// PycoBlocks — MicroPython 導入ウィザード
//
// MicroPython が入っていない Pico を持った生徒が、この画面から離れずに
// 導入まで行き着けるようにする。手順は 4 段階。
//   ① ボードを選ぶ  ② BOOTSEL にする  ③ 書き込む  ④ つないで確かめる
//
// ファームウェア（UF2）は firmware/ に同梱したものを配る。
// 一覧の正本は firmware/manifest.json で、tools/fetch_firmware.py が生成する。
// MicroPython は MIT ライセンスなので再配布できる。

const PicoFirmware = (() => {
  'use strict';

  const MANIFEST_URL = 'firmware/manifest.json';
  const LS_BOARD     = 'pycoblocks.firmware.board';
  const CREDIT       = 'ファームウェアは MicroPython 公式配布（MIT ライセンス）をそのまま同梱しています。';

  // manifest.json が読めないとき（file:// で開いた場合など）に使う。
  // UF2 のリンクは公式のダウンロードページに逃がす。
  const FALLBACK_BOARDS = [
    { id: 'RPI_PICO',    name: 'Raspberry Pi Pico / Pico H',  chip: 'RP2040', wireless: false,
      hint: '基板に銀色のシールド（金属のふた）が無い。' },
    { id: 'RPI_PICO_W',  name: 'Raspberry Pi Pico W / WH',    chip: 'RP2040', wireless: true,
      hint: '基板の端に銀色のシールドが載っている（無線チップ）。' },
    { id: 'RPI_PICO2',   name: 'Raspberry Pi Pico 2',         chip: 'RP2350', wireless: false,
      hint: '表面に「Pico 2」の印刷。シールドは無い。' },
    { id: 'RPI_PICO2_W', name: 'Raspberry Pi Pico 2 W',       chip: 'RP2350', wireless: true,
      hint: '表面に「Pico 2 W」の印刷。端にシールドが載っている。' },
  ];

  let deps     = { serial: null, onSerialChange: null };
  let manifest = null;
  let boards   = [];
  let selected = null;   // ボード定義そのもの
  let step     = 1;
  let root     = null;   // モーダルの最上位要素
  let busy     = false;

  const $ = sel => root && root.querySelector(sel);

  // ---------------------------------------------------------------- 準備

  function init(options) {
    deps = Object.assign(deps, options || {});
  }

  // 基板の見た目（無線シールドの有無）はボード ID から決める。
  // manifest 側に持たせると tools 側と二重管理になるのでここで判定する。
  function isWireless(id) { return /_W$/.test(id); }

  // 基板に印刷されている文字（図のシルク印刷に使う）
  function silkLabel(id) {
    return {
      RPI_PICO:    'Pico',
      RPI_PICO_W:  'Pico W',
      RPI_PICO2:   'Pico 2',
      RPI_PICO2_W: 'Pico 2 W',
    }[id] || 'Pico';
  }

  async function loadManifest() {
    if (boards.length) return;
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      manifest = await res.json();
      boards = (manifest.boards || []).map(b => Object.assign({}, b, {
        wireless: isWireless(b.id),
        uf2Url:   'firmware/' + b.file,
      }));
    } catch (_) {
      // ローカルのファイルを直接開いたときなど。手順の案内だけは出せるようにする。
      manifest = null;
      boards = FALLBACK_BOARDS.map(b => Object.assign({}, b, {
        uf2Url: 'https://micropython.org/download/' + b.id + '/',
        external: true,
      }));
    }
    if (!boards.length) boards = FALLBACK_BOARDS.slice();
  }

  function restoreSelection() {
    const saved = localStorage.getItem(LS_BOARD);
    selected = boards.find(b => b.id === saved) || null;
  }

  // ------------------------------------------------------------ 画面の骨

  function buildRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'fw-modal';
    root.className = 'fw-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'MicroPython を入れる');
    root.style.display = 'none';
    root.innerHTML = `
      <div class="fw-dialog">
        <header class="fw-head">
          <h2 class="fw-title">MicroPython を入れる</h2>
          <button type="button" class="fw-close" id="fw-close" aria-label="閉じる">×</button>
        </header>
        <ol class="fw-steps" id="fw-steps">
          <li data-step="1"><span>1</span>ボードを選ぶ</li>
          <li data-step="2"><span>2</span>BOOTSEL にする</li>
          <li data-step="3"><span>3</span>書き込む</li>
          <li data-step="4"><span>4</span>つないで確かめる</li>
        </ol>
        <div class="fw-body" id="fw-body"></div>
        <footer class="fw-foot">
          <div class="fw-msg" id="fw-msg"></div>
          <div class="fw-nav">
            <button type="button" class="fw-btn" id="fw-prev">戻る</button>
            <button type="button" class="fw-btn fw-btn--primary" id="fw-next">次へ</button>
          </div>
        </footer>
      </div>`;
    document.body.appendChild(root);

    $('#fw-close').addEventListener('click', close);
    $('#fw-prev').addEventListener('click', () => go(step - 1));
    $('#fw-next').addEventListener('click', () => go(step + 1));
    root.addEventListener('click', e => { if (e.target === root) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && root.style.display !== 'none') close();
    });
    return root;
  }

  function setMsg(text, type) {
    const el = $('#fw-msg');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'fw-msg' + (type ? ' fw-msg--' + type : '');
  }

  // -------------------------------------------------------------- 各段階

  function renderStep1() {
    const cards = boards.map(b => `
      <button type="button" class="fw-card${selected && selected.id === b.id ? ' is-selected' : ''}"
              data-board="${b.id}" aria-pressed="${selected && selected.id === b.id}">
        <div class="fw-card-art">${PicoArt.board({
          wireless: b.wireless, label: silkLabel(b.id), height: 150,
        })}</div>
        <div class="fw-card-name">${b.name}</div>
        <div class="fw-card-hint">${b.hint || ''}</div>
        <div class="fw-card-chip">${b.chip}${b.version ? ' ／ MicroPython v' + b.version : ''}</div>
      </button>`).join('');

    return `
      <p class="fw-lead">手に持っている基板と同じものを選ぶ。<strong>ここを間違えると、書き込んでも動かない。</strong></p>
      <div class="fw-cards">${cards}</div>
      <p class="fw-note">${manifest ? CREDIT : '※ ファームウェアの一覧を読み込めなかったので、公式サイトからのダウンロードに切り替えている。'}</p>`;
  }

  function renderStep2() {
    const connected = deps.serial && deps.serial.isConnected();
    return `
      <div class="fw-two">
        <section class="fw-pane">
          <h3 class="fw-h3">はじめて入れる／電源を抜いている</h3>
          <div class="fw-art">${PicoArt.plugIn({
            wireless: selected.wireless, label: silkLabel(selected.id), height: 250,
          })}</div>
          <ol class="fw-list">
            <li>USB ケーブルをパソコンから<strong>抜く</strong>。</li>
            <li>基板の白い <strong>BOOTSEL</strong> ボタンを<strong>押したまま</strong>にする。</li>
            <li>押したまま USB ケーブルを挿す。挿してから指を離す。</li>
          </ol>
        </section>
        <section class="fw-pane">
          <h3 class="fw-h3">すでに MicroPython が入っている</h3>
          <p class="fw-p">ボタンを押さなくても、PycoBlocks から BOOTSEL に入れられる。入れ直しや更新のときはこちらが早い。</p>
          <button type="button" class="fw-btn fw-btn--primary fw-btn--wide" id="fw-bootsel">
            ${connected ? 'BOOTSEL に入れる' : 'つないで BOOTSEL に入れる'}
          </button>
          <p class="fw-note">実行すると Pico はいったん切断され、パソコンに <code>RPI-RP2</code> という
          ドライブとして出てくる。それが出れば成功。</p>
        </section>
      </div>
      <p class="fw-check">
        <strong>うまくいったかの確認：</strong>パソコンに <code>RPI-RP2</code> という名前のドライブ
        （USB メモリのようなもの）が出ていれば、次に進んでよい。
      </p>`;
  }

  function renderStep3() {
    const canWebUsb = supportsOneClick();
    const oneClick = canWebUsb ? `
      <section class="fw-pane fw-pane--accent">
        <h3 class="fw-h3">おすすめ：ワンクリックで書き込む</h3>
        <p class="fw-p">ファイルを触らずに、このページから直接書き込む。</p>
        <button type="button" class="fw-btn fw-btn--primary fw-btn--wide" id="fw-flash">
          ${selected.name} に書き込む
        </button>
        <div class="fw-progress" id="fw-progress" hidden>
          <div class="fw-progress-bar" id="fw-progress-bar"></div>
        </div>
        <p class="fw-note">うまくいかないときは、右の手順で書き込めば必ず入る。</p>
      </section>` : '';

    const dlLabel = selected.external
      ? '公式サイトから UF2 をダウンロード'
      : `UF2 をダウンロード（${selected.file || ''}）`;

    return `
      <div class="${canWebUsb ? 'fw-two' : ''}">
        ${oneClick}
        <section class="fw-pane">
          <h3 class="fw-h3">${canWebUsb ? 'もうひとつの方法：ファイルを落とし込む' : 'ファイルを落とし込んで書き込む'}</h3>
          <div class="fw-art">${PicoArt.dragDrop({ height: 170 })}</div>
          <ol class="fw-list">
            <li>
              <a class="fw-btn fw-btn--primary fw-btn--inline" id="fw-download"
                 href="${selected.uf2Url}"${selected.external ? ' target="_blank" rel="noopener"' : ' download'}>
                ${dlLabel}
              </a>
            </li>
            <li>パソコンに出ている <code>RPI-RP2</code> ドライブを開く。</li>
            <li>ダウンロードした <code>.uf2</code> ファイルを、そのドライブへドラッグ＆ドロップする。</li>
            <li>コピーが終わるとドライブがひとりでに消える。それが書き込み完了の合図。</li>
          </ol>
          <details class="fw-help">
            <summary>うまくいかないとき</summary>
            <ul class="fw-list">
              <li><strong>コピーの途中でエラーが出た</strong> — 「デバイスが取り外されました」「コピー先が見つかりません」などは、
                  たいてい<strong>失敗ではない</strong>。書き込みが終わった Pico は自分でドライブを切り離すので、
                  パソコンがそれを異常と見なして言ってくるだけ。次へ進んで確かめればよい。</li>
              <li><strong><code>RPI-RP2</code> ドライブが出てこない</strong> — BOOTSEL を押す力が足りないか、
                  押す前に USB を挿している。「戻る」で手順をやり直す。
                  それでも出ないときは USB ケーブルを疑う（充電専用のケーブルでは出てこない）。</li>
              <li><strong>コピーしてもドライブが消えない</strong> — 選んだボードが違うおそれがある。
                  「戻る」で基板の見た目と選択を照らし合わせる。</li>
              <li><strong>ファイルがブラウザで開いてしまう</strong> — クリックではなく、
                  ドライブの窓へ<strong>ドラッグして落とす</strong>。ダウンロードフォルダからコピーして貼り付けてもよい。</li>
            </ul>
          </details>
        </section>
      </div>
      <p class="fw-check">
        <strong>選んでいるボード：</strong>${selected.name}
        ${selected.version ? '（MicroPython v' + selected.version + '）' : ''}
        — 違っていれば「戻る」で選び直す。
      </p>`;
  }

  function renderStep4() {
    return `
      <p class="fw-lead">最後に、ちゃんと入ったか確かめる。</p>
      <ol class="fw-list fw-list--lg">
        <li>Pico を USB でつないだままにする（抜いていたら挿し直す）。</li>
        <li>下のボタンを押して、出てきた一覧から Pico を選ぶ。</li>
      </ol>
      <button type="button" class="fw-btn fw-btn--primary fw-btn--wide" id="fw-connect">接続してためす</button>
      <div class="fw-result" id="fw-result"></div>
      <details class="fw-help">
        <summary>一覧に出てこないとき</summary>
        <ul class="fw-list">
          <li>Thonny など、ほかのアプリが Pico をつかんでいないか確かめる。開いていたら閉じる。</li>
          <li>USB ケーブルが「充電専用」だと通信できない。データ通信できるケーブルに替える。</li>
          <li><code>RPI-RP2</code> ドライブがまだ出たままなら、書き込みが終わっていない。手順 3 に戻る。</li>
          <li>ブラウザは Chrome か Edge を使う（Safari・Firefox では接続できない）。</li>
        </ul>
      </details>`;
  }

  function render() {
    const body = $('#fw-body');
    if (step === 1)      body.innerHTML = renderStep1();
    else if (step === 2) body.innerHTML = renderStep2();
    else if (step === 3) body.innerHTML = renderStep3();
    else                 body.innerHTML = renderStep4();

    // 進行表示
    root.querySelectorAll('#fw-steps li').forEach(li => {
      const n = Number(li.dataset.step);
      li.classList.toggle('is-current', n === step);
      li.classList.toggle('is-done', n < step);
    });

    // ナビゲーション
    $('#fw-prev').disabled = (step === 1);
    const next = $('#fw-next');
    next.textContent = step === 4 ? '閉じる' : '次へ';
    next.disabled = (step === 1 && !selected);

    bindStep();
    body.scrollTop = 0;
  }

  function bindStep() {
    if (step === 1) {
      root.querySelectorAll('.fw-card').forEach(card => {
        card.addEventListener('click', () => {
          selected = boards.find(b => b.id === card.dataset.board);
          localStorage.setItem(LS_BOARD, selected.id);
          setMsg('');
          render();
        });
      });
    }

    if (step === 2) {
      const btn = $('#fw-bootsel');
      if (btn) btn.addEventListener('click', onEnterBootsel);
    }

    if (step === 3) {
      const flash = $('#fw-flash');
      if (flash) flash.addEventListener('click', onOneClickFlash);
      const dl = $('#fw-download');
      if (dl) dl.addEventListener('click', () => {
        setMsg('ダウンロードした .uf2 を RPI-RP2 ドライブへドラッグ＆ドロップする。', 'info');
      });
    }

    if (step === 4) {
      const btn = $('#fw-connect');
      if (btn) btn.addEventListener('click', onTryConnect);
    }
  }

  function go(n) {
    if (busy) return;
    if (n > 4) { close(); return; }
    if (n < 1) return;
    if (n > 1 && !selected) { setMsg('先にボードを選ぶ。', 'err'); return; }
    step = n;
    setMsg('');
    render();
  }

  // ------------------------------------------------------------ 各操作

  async function onEnterBootsel() {
    const serial = deps.serial;
    if (!serial) return;
    const btn = $('#fw-bootsel');
    busy = true;
    btn.disabled = true;
    try {
      if (!serial.isConnected()) {
        setMsg('ポートを選んでください…', 'info');
        await serial.connect();
      }
      setMsg('BOOTSEL に切り替え中…', 'info');
      await serial.enterBootloader();
      if (deps.onSerialChange) deps.onSerialChange();
      setMsg('切り替えを送った。RPI-RP2 ドライブが出ていれば成功。次へ進む。', 'ok');
    } catch (e) {
      setMsg(friendly(e) , 'err');
    } finally {
      busy = false;
      btn.disabled = false;
    }
  }

  async function onTryConnect() {
    const serial = deps.serial;
    const out = $('#fw-result');
    if (!serial) return;
    busy = true;
    try {
      setMsg('ポートを選んでください…', 'info');
      if (serial.isConnected()) await serial.disconnect();
      await serial.connect();
      if (deps.onSerialChange) deps.onSerialChange();
      out.className = 'fw-result fw-result--ok';
      out.textContent = '接続できた。MicroPython が入っている。ウィザードを閉じて、ブロックを実行してみる。';
      setMsg('');
    } catch (e) {
      out.className = 'fw-result fw-result--err';
      out.textContent = friendly(e);
      setMsg('');
    } finally {
      busy = false;
    }
  }

  // ワンクリック書き込み（WebUSB + PICOBOOT）は「作らない」と決めた。2026-09-07 の実測で、
  // Windows 11 + Chrome 151 において RP2 Boot（VID 0x2e8a / PID 0x0003）は
  // open() まで通るのに claimInterface(1) が 12 秒待っても返ってこない（例外も投げない）。
  // PICOBOOT 側（itf1・class 0xff）が WinUSB に紐付いていないためで、直すには Zadig が要る。
  // 授業でそれは無理な上、例外が飛ばない以上「失敗したらファイル方式へ落とす」も成立しない。
  // 判定ツール＝tools/webusb_probe.html。事情が変わって再挑戦するときは、
  //   ・claimInterface に必ずタイムアウトを噛ませる（ハングで画面が固まるため）
  //   ・RP2350 の UF2 は先頭ブロックが family 0xe48bff57 で blocks=2・start 0x10ffff00
  // の 2 点を忘れないこと。
  //
  // 下のフックは残してある。PicoFlash が読み込まれていなければ何も起きない。
  function supportsOneClick() {
    return typeof PicoFlash !== 'undefined'
        && typeof navigator !== 'undefined'
        && 'usb' in navigator
        && !selected.external;
  }

  async function onOneClickFlash() {
    if (typeof PicoFlash === 'undefined') return;
    const btn  = $('#fw-flash');
    const wrap = $('#fw-progress');
    const bar  = $('#fw-progress-bar');
    busy = true;
    btn.disabled = true;
    wrap.hidden = false;
    try {
      await PicoFlash.flash(selected, (done, total, label) => {
        const pct = total ? Math.round(done / total * 100) : 0;
        bar.style.width = pct + '%';
        setMsg((label || '書き込み中') + '… ' + pct + '%', 'info');
      });
      setMsg('書き込みが終わった。Pico が再起動する。次へ進んで確かめる。', 'ok');
    } catch (e) {
      setMsg(friendly(e) + ' — 右の「ファイルを落とし込む」手順なら確実に書き込める。', 'err');
    } finally {
      busy = false;
      btn.disabled = false;
    }
  }

  function friendly(e) {
    const m = (e && e.message) || String(e);
    if (/No port selected|cancelled|No device selected/i.test(m)) return 'キャンセルされた。';
    if (/open|Failed to open/i.test(m)) return 'ポートが他のアプリ（Thonny など）に使われている。閉じてからやり直す。';
    if (/Web Serial/i.test(m)) return m;
    if (/接続されていません/.test(m)) return 'Pico につながっていない。先に接続する。';
    return m;
  }

  // ---------------------------------------------------------------- 開閉

  async function open(opts) {
    buildRoot();
    await loadManifest();
    if (!selected) restoreSelection();
    step = (opts && opts.step) || (selected ? 2 : 1);
    root.style.display = 'flex';
    setMsg('');
    render();
    const focusable = root.querySelector('.fw-card, .fw-btn');
    if (focusable) focusable.focus();
  }

  function close() {
    if (!root) return;
    root.style.display = 'none';
  }

  function isOpen() { return !!root && root.style.display !== 'none'; }

  return { init, open, close, isOpen };
})();
