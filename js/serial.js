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
  let lastRx = '';
  const pendingReads = new WeakMap();   // reader → 時間切れで持ち越した read()       // readUntil が直近に受け取った文字（失敗時の原因表示に使う）

  // --- ボードの違い（app.js の window.PycoBoard が持つ） ---
  // micro:bit は USB を直接持たず、間のチップ（DAPLink）が 115200bps の UART に
  // 中継する。受け側のバッファが小さいので、長いコードを一度に送ると取りこぼす。
  // またファイルシステムが単純で、追記モード 'a' とフォルダが無い。
  function isMicrobit() {
    return !!(window.PycoBoard && window.PycoBoard.get() === 'microbit');
  }
  function boardName() { return isMicrobit() ? 'micro:bit' : 'Pico'; }
  const MB_CHUNK = 64;      // micro:bit へ 1 回に送るバイト数
  const MB_GAP_MS = 10;     // その間の待ち（64B / 10ms ≒ 6KB/s。UART の上限 11.5KB/s の約半分）

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
    if (!isMicrobit() || buf.length <= MB_CHUNK) {
      await writer.write(buf);
      return;
    }
    for (let i = 0; i < buf.length; i += MB_CHUNK) {
      await writer.write(buf.slice(i, i + MB_CHUNK));
      await sleep(MB_GAP_MS);
    }
  }

  // Raw REPL で 1 コマンド実行（cmd + Ctrl+D）
  async function execRaw(cmd, waitMs = 500) {
    await write(cmd + '\x04');
    await sleep(waitMs);
  }

  async function readUntil(reader, target, timeoutMs, onData) {
    let buf = '';
    lastRx = '';

    while (!buf.includes(target)) {
      // 時間切れでも reader.read() は取り消されず、次に届いた文字を受け取ってしまう。
      // 捨てると次の readUntil が肝心の応答（'raw REPL' など）を取り逃すので、待ちを持ち越す。
      const pending = pendingReads.get(reader) || reader.read();
      pendingReads.set(reader, pending);
      const result = await Promise.race([
        pending,
        new Promise(resolve => setTimeout(() => resolve(null), timeoutMs)),
      ]);

      if (!result) { lastRx = buf; return ''; }
      pendingReads.delete(reader);

      const { value, done } = result;
      if (done) break;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buf += chunk;
        if (onData) onData(chunk);
      }
    }

    lastRx = buf;
    return buf.includes(target) ? buf : '';
  }

  // Ctrl+C でプログラムを止め、Ctrl+A で Raw REPL に入る。
  // 1 回目は止めた直後の出力（Traceback や print の残り）に紛れて失敗することがあるので 3 回まで試す。
  // 失敗したときは、ボードから何が返ってきたかで原因を分けて知らせる。
  async function enterRawRepl(reader, onStatus) {
    let heard = '';
    for (let i = 0; i < 3; i++) {
      onStatus(i === 0 ? '実行を中断中...' : `Raw REPL に切り替え中...（再試行 ${i}）`);
      await write('\r\x03\x03');    // Ctrl+C × 2：実行中断
      await readUntil(reader, '>>>', 1500);
      heard += lastRx;
      onStatus('Raw REPL に切り替え中...');
      await write('\x01');           // Ctrl+A：Raw REPL モード
      if (await readUntil(reader, 'raw REPL', 2000)) return;
      heard += lastRx;
    }
    const got = heard.replace(/[\x00-\x08\x0b-\x1f]/g, '').trim();
    if (!got) {
      throw new Error(isMicrobit()
        ? 'micro:bit から応答がありません。MicroPython の .hex を入れたか（MakeCode のプログラムのままだと応答しません）、' +
          'ポート選択で「mbed Serial Port」または「micro:bit」を選んだか、本体が V2 か（V1 は非対応）を確かめてください。'
        : 'Pico から応答がありません。MicroPython を入れたか、ポート選択で正しいポートを選んだかを確かめてください。');
    }
    throw new Error(`Raw REPL に切り替えできません。${boardName()} から返ってきた文字：「${got.slice(-120)}」`);
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

  // --- BOOTSEL（ファーム書き込みモード）に入れる ---
  // machine.bootloader() を実行すると Pico はその場で USB を切り離し、
  // RPI-RP2 ドライブとして再列挙する。応答は返ってこないので待たずに後片付けする。
  // すでに MicroPython が入っている Pico を入れ直すとき、
  // BOOTSEL ボタンを押しながら挿し直す手間を無くすために使う。
  async function enterBootloader() {
    if (isMicrobit()) throw new Error('micro:bit は BOOTSEL を使わない（.hex を MICROBIT ドライブへ入れる）');
    if (!port) throw new Error('Pico に接続されていません');
    await stopMonitor();
    await sleep(200);
    try {
      await write('\x03\x03');                              // 実行中のプログラムを止める
      await sleep(300);
      await write('\x01');                                  // Raw REPL（エコーを抑える）
      await sleep(200);
      await write('import machine\nmachine.bootloader()\x04');
      await sleep(500);
    } catch (_) {
      // 送信の途中でポートが消えるのは想定どおり。失敗として扱わない。
    }
    await disconnect();
  }

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
      await enterRawRepl(reader, onStatus);

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

  // --- Pico の中身を空にする（MicroPython 本体は残す） ---
  //
  // 書き込んだばかりの MicroPython はファイルが 1 つも無い状態なので、
  // ルート以下を全部消せばファイルシステムは工場出荷時と同じになる。
  // main.py だけ消す作りにすると、boot.py や lib/ が残って
  // 「消したはずなのに直らない」という一番わかりにくい状態を作ってしまう。
  async function wipeFiles(onStatus) {
    if (!port) throw new Error(`${boardName()} に接続されていません`);
    await stopMonitor();
    const reader = port.readable.getReader();

    try {
      await enterRawRepl(reader, onStatus);

      onStatus('ファイルを削除中...');
      // ディレクトリは中身を消してから rmdir する。os.stat()[0] の 0x4000 がディレクトリの印。
      // micro:bit にはフォルダも os.stat も無いので、一覧のファイルを消すだけ。
      const script = isMicrobit() ? [
        'import os',
        '_n=0',
        'for _e in os.listdir():',
        '    os.remove(_e); _n+=1',
        'print("WIPED",_n)',
      ].join('\n') : [
        'import os',
        '_n=0',
        'def _rm(p):',
        '    global _n',
        '    try: _m=os.stat(p)[0]',
        '    except Exception: return',
        '    if _m & 0x4000:',
        '        for _e in os.listdir(p): _rm(p+"/"+_e)',
        '        try: os.rmdir(p)',
        '        except Exception: pass',
        '    else:',
        '        try:',
        '            os.remove(p); _n+=1',
        '        except Exception: pass',
        'for _e in os.listdir("/"): _rm("/"+_e)',
        'print("WIPED",_n)',
      ].join('\n');
      await write(script + '\x04');
      // 応答は OK + 出力 + \x04 + エラー + \x04 + > の形。
      // エラーが出ていれば \x04\x04> にはならないので、そのまま失敗として扱える。
      if (!await readUntil(reader, '\x04\x04>', 8000)) {
        throw new Error(`削除の応答を確認できませんでした。${boardName()} を挿し直してからやり直してください。`);
      }

      onStatus(`${boardName()} をリセット中...`);
      await write('import machine; machine.reset()\x04');
      await sleep(300);

      await disconnect();
      onStatus(`✓ ${boardName()} を空にしました`);
    } finally {
      try { await reader.cancel(); } catch (_) {}
      try { reader.releaseLock(); } catch (_) {}
    }
  }

  // --- main.py 書き込みメイン ---
  async function writeMainPy(code, onStatus) {
    await stopMonitor();   // モニターが reader を保持している場合に解放
    const reader = port.readable.getReader();

    try {
      await enterRawRepl(reader, onStatus);

      // UTF-8 バイト列を 128 バイトずつ HEX チャンクで書き込む
      const bytes = new TextEncoder().encode(code);
      const CHUNK = 128;

      if (isMicrobit()) {
        await writeMainPyMicrobit(reader, bytes, onStatus);
      } else for (let i = 0; i < bytes.length; i += CHUNK) {
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

      onStatus(`${boardName()} をリセット中...`);
      await write('import machine; machine.reset()\x04');
      await sleep(300);

      await disconnect();
      onStatus(`✓ 書き込み完了！${boardName()} が再起動しました`);
    } finally {
      try { await reader.cancel(); } catch (_) {}
      try { reader.releaseLock(); } catch (_) {}
    }
  }

  // micro:bit の main.py 書き込み。'ab'（追記）が使えないので、ファイルを 1 回だけ開き、
  // 開いたまま少しずつ書いて最後に閉じる（Raw REPL の変数は次の実行まで残る）。
  // bytes.fromhex が無い版もあるので、b'\x..' の形で送る。
  async function writeMainPyMicrobit(reader, bytes, onStatus) {
    const CHUNK = 48;
    const steps = [`_f=open('main.py','wb')`];
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const esc = Array.from(bytes.slice(i, i + CHUNK)).map(b => '\\x' + b.toString(16).padStart(2, '0')).join('');
      steps.push(`_f.write(b'${esc}')`);
    }
    steps.push('_f.close()');
    for (let k = 0; k < steps.length; k++) {
      await write(steps[k] + '\x04');
      if (!await readUntil(reader, '\x04\x04>', 3000)) {
        throw new Error('main.py 書き込み応答を確認できませんでした（micro:bit の空きが足りない可能性もある）');
      }
      onStatus(`書き込み中... ${Math.round((k + 1) / steps.length * 100)}%`);
    }
  }

  return { connect, reconnect, disconnect, isConnected, stopCode, runCode, writeMainPy,
           startMonitor, stopMonitor, isMonitoring, enterBootloader, wipeFiles };
})();
