// PycoBlocks — Web Serial (MicroPython Raw REPL)
const PicoSerial = (() => {
  let port   = null;
  let writer = null;
  let lastInfo = null;   // 直近に接続したポートの USB 情報（再接続でダイアログ無し復帰に使う）

  // --- シリアルモニター状態 ---
  let monitorReader = null;
  let monitorActive = false;
  let _monitorCb    = null;
  let activeReader  = null;   // runCode が現在使用中の reader

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const decoder = new TextDecoder();

  // --- 接続 / 切断 ---

  async function connect() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API 非対応です。Chrome または Edge をお使いください。');
    }
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    try { lastInfo = port.getInfo(); } catch (_) { lastInfo = null; }
  }

  // --- 再接続：Pico を抜き差ししたあとダイアログ無しで接続し直す ---
  // 既に許可済みのポート（getPorts）を直接開くため、ポート選択ダイアログが出ない。
  // 抜線後に port が残って「接続済み」誤判定のままになる場合に備え、先に確実に閉じる。
  async function reconnect() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API 非対応です。Chrome または Edge をお使いください。');
    }
    await stopMonitor();
    await disconnect();
    await sleep(200);

    const ports = await navigator.serial.getPorts();
    let target = null;
    if (lastInfo) {
      target = ports.find(p => {
        const info = p.getInfo();
        return info.usbVendorId === lastInfo.usbVendorId &&
               info.usbProductId === lastInfo.usbProductId;
      }) || null;
    }
    if (!target && ports.length === 1) target = ports[0];   // 許可済みが1つだけなら迷わずそれ
    if (!target) {
      // 過去に許可したポートが無ければ通常の接続ダイアログにフォールバック
      return connect();
    }

    port = target;
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    try { lastInfo = port.getInfo(); } catch (_) {}
  }

  async function disconnect() {
    try {
      if (writer) { writer.releaseLock(); writer = null; }
    } catch (_) {}
    try {
      if (port) { await port.close(); port = null; }
    } catch (_) {}
  }

  function isConnected() { return !!port; }

  // --- 低レベル書き込み ---
  // drain() を廃止：reader ロック競合の原因だったため sleep() のみでタイミング管理

  async function write(data) {
    if (!writer) throw new Error('シリアルポートが接続されていません');
    const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    await writer.write(buf);
  }

  // Raw REPL で 1 コマンド実行（cmd + Ctrl+D）
  async function execRaw(cmd, waitMs = 500) {
    await write(cmd + '\x04');
    await sleep(waitMs);
  }

  async function readUntil(reader, target, timeoutMs, onData) {
    let buf = '';

    while (!buf.includes(target)) {
      const result = await Promise.race([
        reader.read(),
        new Promise(resolve => setTimeout(() => resolve(null), timeoutMs)),
      ]);

      if (!result) return '';

      const { value, done } = result;
      if (done) break;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buf += chunk;
        if (onData) onData(chunk);
      }
    }

    return buf.includes(target) ? buf : '';
  }

  // --- シリアルモニター ---
  function startMonitor(onData) {
    if (monitorActive) return;
    _monitorCb = onData;
    monitorActive = true;
    _monitorLoop();
  }

  function _monitorLoop() {
    if (!monitorActive || !port || !port.readable) { monitorActive = false; return; }
    const dec = new TextDecoder();
    (async () => {
      try {
        monitorReader = port.readable.getReader();
        while (monitorActive) {
          const { value, done } = await monitorReader.read();
          if (done) { monitorActive = false; break; }
          if (value && _monitorCb) _monitorCb(dec.decode(value));
        }
      } catch (_) {}
      finally {
        try { monitorReader.releaseLock(); } catch (_) {}
        monitorReader = null;
        if (monitorActive) { await sleep(200); _monitorLoop(); }
      }
    })();
  }

  async function stopMonitor() {
    monitorActive = false;
    if (monitorReader) {
      try { await monitorReader.cancel(); } catch (_) {}
      try { monitorReader.releaseLock(); } catch (_) {}
      monitorReader = null;
    }
    await sleep(300);
  }

  function isMonitoring() { return monitorActive; }

  // --- 実行中のプログラムを停止（Ctrl+C x2） ---
  async function stopCode() {
    await write('\x03\x03');
    if (activeReader) {
      try { activeReader.cancel(); } catch (_) {}
    }
    await sleep(300);
  }

  // --- コードを直接実行（main.py に保存しない） ---
  async function runCode(code, onStatus, onData) {
    const wasMonitoring = monitorActive;
    if (wasMonitoring) await stopMonitor();
    await sleep(300);

    activeReader = port.readable.getReader();
    const reader = activeReader;
    try {
      onStatus('実行を中断中...');
      await write('\x03\x03');
      await sleep(800);

      onStatus('Raw REPL に切り替え中...');
      await write('\x01');
      if (!await readUntil(reader, 'raw REPL', 3000)) {
        throw new Error('Raw REPL に切り替えできません。Pico が MicroPython で起動しているか確認してください。');
      }

      onStatus('実行中...');
      await write(code + '\x04');

      let firstChunk = true;
      await readUntil(reader, '\x04\x04>', 30000, chunk => {
        let display = chunk;
        if (firstChunk) {
          display = display.replace(/^OK/, '');
          firstChunk = false;
        }
        display = display.replace(/\x04/g, '').replace(/\x03/g, '');
        if (display) onData(display);
      });

      // 通常 REPL に戻す
      await write('\x02');
      await sleep(200);

      onStatus('✓ 実行完了');
    } finally {
      activeReader = null;
      try { await reader.cancel(); } catch (_) {}
      try { reader.releaseLock(); } catch (_) {}
      if (wasMonitoring && _monitorCb) {
        await sleep(100);
        startMonitor(_monitorCb);
      }
    }
  }

  // --- main.py 書き込みメイン ---
  async function writeMainPy(code, onStatus) {
    await stopMonitor();   // モニターが reader を保持している場合に解放
    const reader = port.readable.getReader();

    try {
      onStatus('実行を中断中...');
      await write('\x03\x03');       // Ctrl+C × 2：実行中断
      await readUntil(reader, '>>>', 2000);

      onStatus('Raw REPL に切り替え中...');
      await write('\x01');           // Ctrl+A：Raw REPL モード
      if (!await readUntil(reader, 'raw REPL', 3000)) {
        throw new Error('Raw REPL に切り替えできません。Pico が MicroPython で起動しているか確認してください。');
      }

      // UTF-8 バイト列を 128 バイトずつ HEX チャンクで書き込む
      const bytes = new TextEncoder().encode(code);
      const CHUNK = 128;

      for (let i = 0; i < bytes.length; i += CHUNK) {
        const chunk = bytes.slice(i, i + CHUNK);
        const hex   = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join('');
        const mode  = i === 0 ? 'wb' : 'ab';
        const cmd = `_f=open('/main.py','${mode}');_f.write(bytes.fromhex('${hex}'));_f.close()`;
        await write(cmd + '\x04');
        if (!await readUntil(reader, '\x04\x04>', 2000)) {
          throw new Error('main.py 書き込み応答を確認できませんでした');
        }
        const pct = Math.min(100, Math.round((i + CHUNK) / bytes.length * 100));
        onStatus(`書き込み中... ${pct}%`);
      }

      onStatus('Pico をリセット中...');
      await write('import machine; machine.reset()\x04');
      await sleep(300);

      await disconnect();
      onStatus('✓ 書き込み完了！Pico が再起動しました');
    } finally {
      try { await reader.cancel(); } catch (_) {}
      try { reader.releaseLock(); } catch (_) {}
    }
  }

  return { connect, reconnect, disconnect, isConnected, stopCode, runCode, writeMainPy,
           startMonitor, stopMonitor, isMonitoring };
})();
