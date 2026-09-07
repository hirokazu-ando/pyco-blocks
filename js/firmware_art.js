// PycoBlocks — MicroPython 導入ウィザードの図版（インライン SVG）
//
// 生成 AI の絵は使わない。基板の寸法は Raspberry Pi Pico の実寸に合わせてある。
//   基板 21.0 × 51.0 mm ／ USB コネクタは短辺の中央
//   BOOTSEL ボタンの中心は基板上端（USB 側）から約 10.5 mm
//   RP2040 は中心が上端から約 25 mm
// viewBox の 1 単位 = 1 mm。実物と見比べても位置が合う。

const PicoArt = (() => {
  'use strict';

  // 画面はダークの PCB TERMINAL テーマなので、それに乗る配色にしてある。
  // 強調色と文字色は CSS 変数を参照し、テーマを変えても図が追従するようにした。
  const C = {
    pcb:      '#21804b',                        // Raspberry Pi Pico の基板の緑（暗背景で沈まぬよう少し明るめ）
    pcbEdge:  '#0f4a2c',
    silk:     '#f2f6f3',                        // 基板のシルク印刷（白）
    pad:      '#d4af37',                        // 金メッキのパッド
    chip:     '#141414',
    metal:    '#c8ccd0',
    shield:   '#b9bfc4',
    accent:   'var(--accent-amber, #ffb700)',   // 矢印・囲みの強調
    text:     'var(--text-primary, #c8e6c8)',   // 図に添える説明の文字
    dim:      '#7b8b7b',
  };

  // --- 部品ひとつぶん ---------------------------------------------------

  function pinHoles() {
    // 両側 20 個ずつ、2.54 mm ピッチ。1 番ピンの中心は上端から 3.5 mm。
    let out = '';
    for (let i = 0; i < 20; i++) {
      const y = 3.5 + i * 2.54;
      out += `<circle cx="1.6" cy="${y.toFixed(2)}" r="0.8" fill="${C.pad}"/>`;
      out += `<circle cx="1.6" cy="${y.toFixed(2)}" r="0.42" fill="${C.pcbEdge}"/>`;
      out += `<circle cx="19.4" cy="${y.toFixed(2)}" r="0.8" fill="${C.pad}"/>`;
      out += `<circle cx="19.4" cy="${y.toFixed(2)}" r="0.42" fill="${C.pcbEdge}"/>`;
    }
    return out;
  }

  function usbConnector() {
    return `
      <rect x="6.75" y="-1.4" width="7.5" height="5.6" rx="0.7"
            fill="${C.metal}" stroke="${C.dim}" stroke-width="0.12"/>
      <rect x="8.1" y="0.4" width="4.8" height="2.2" rx="0.4" fill="#6b7280"/>`;
  }

  function bootselButton(highlight) {
    // 3.5 mm 角のタクトスイッチ。中心 (10.5, 10.5)。
    const ring = highlight
      ? `<circle cx="10.5" cy="10.5" r="4.2" fill="none"
                 stroke="${C.accent}" stroke-width="0.5" opacity="0.95"/>`
      : '';
    return `
      ${ring}
      <rect x="8.75" y="8.75" width="3.5" height="3.5" rx="0.35"
            fill="#e6e8ea" stroke="#9aa0a6" stroke-width="0.12"/>
      <circle cx="10.5" cy="10.5" r="1.05" fill="#f7f8f9" stroke="#9aa0a6" stroke-width="0.1"/>`;
  }

  function coreChips() {
    return `
      <rect x="7" y="21.5" width="7" height="7" rx="0.4" fill="${C.chip}"/>
      <circle cx="8.2" cy="27.3" r="0.35" fill="#4b5563"/>
      <rect x="8.6" y="32.2" width="3.8" height="2.6" rx="0.3" fill="#2b2b2b"/>
      <rect x="4.6" y="14.2" width="1.6" height="0.9" rx="0.15" fill="#8fd694"/>`;
  }

  function wirelessShield() {
    // Pico W / Pico 2 W の CYW43439 は USB と反対側の端にシールドで覆われて載る。
    return `
      <rect x="4.6" y="39.5" width="11.8" height="8.6" rx="0.5"
            fill="${C.shield}" stroke="#8e969c" stroke-width="0.15"/>
      <rect x="5.6" y="40.5" width="9.8" height="6.6" rx="0.3"
            fill="none" stroke="#a7aeb4" stroke-width="0.12"/>`;
  }

  function debugPads() {
    return `
      <circle cx="7.5" cy="49.4" r="0.6" fill="${C.pad}"/>
      <circle cx="10.5" cy="49.4" r="0.6" fill="${C.pad}"/>
      <circle cx="13.5" cy="49.4" r="0.6" fill="${C.pad}"/>`;
  }

  // --- 基板ぜんたい -----------------------------------------------------

  /**
   * Pico の基板図を返す。
   * @param {object} o
   * @param {boolean} o.wireless  無線シールドを載せるか（Pico W / Pico 2 W）
   * @param {string}  o.label     基板に印刷する文字（例 "Pico 2 W"）
   * @param {boolean} o.highlight BOOTSEL ボタンを強調するか
   * @param {number}  o.height    表示の高さ（px）
   */
  function board(o) {
    const opt = Object.assign(
      { wireless: false, label: 'Pico', highlight: false, height: 190 },
      o || {}
    );
    // 基板を 21×51 として、強調の輪と USB のはみ出しぶんの余白を左右上下にとる
    return `
<svg viewBox="-3 -3 27 57" height="${opt.height}" role="img"
     aria-label="Raspberry Pi ${opt.label} の基板図"
     style="max-width:100%; height:auto; max-height:${opt.height}px;">
  ${usbConnector()}
  <rect x="0" y="0" width="21" height="51" rx="1"
        fill="${C.pcb}" stroke="${C.pcbEdge}" stroke-width="0.25"/>
  ${pinHoles()}
  ${bootselButton(opt.highlight)}
  ${coreChips()}
  ${opt.wireless ? wirelessShield() : ''}
  ${debugPads()}
  <text x="10.5" y="18.4" text-anchor="middle" fill="${C.silk}"
        font-size="2.1" font-family="sans-serif" font-weight="600">${opt.label}</text>
  <text x="10.5" y="20.9" text-anchor="middle" fill="${C.silk}"
        font-size="1.5" font-family="sans-serif" opacity="0.85">Raspberry Pi</text>
</svg>`;
  }

  /**
   * 「BOOTSEL を押しながら USB を挿す」図。
   * 基板図に、押す指の矢印と挿す向きの矢印を重ねる。
   * 文字が潰れないよう、基板の左右に十分な余白を取ってある。
   */
  function plugIn(o) {
    const opt = Object.assign({ wireless: false, label: 'Pico', height: 250 }, o || {});
    return `
<svg viewBox="-16 -9 52 63" height="${opt.height}" role="img"
     aria-label="BOOTSEL ボタンを押しながら USB ケーブルを挿す図"
     style="max-width:100%; height:auto; max-height:${opt.height}px;">
  <defs>
    <marker id="pa-arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${C.accent}"/>
    </marker>
  </defs>

  <g>
    ${usbConnector()}
    <rect x="0" y="0" width="21" height="51" rx="1"
          fill="${C.pcb}" stroke="${C.pcbEdge}" stroke-width="0.25"/>
    ${pinHoles()}
    ${bootselButton(true)}
    ${coreChips()}
    ${opt.wireless ? wirelessShield() : ''}
    ${debugPads()}
    <text x="10.5" y="18.4" text-anchor="middle" fill="${C.silk}"
          font-size="2.1" font-family="sans-serif" font-weight="600">${opt.label}</text>
  </g>

  <!-- ① BOOTSEL を押さえる -->
  <path d="M-5.2,13.6 L6.0,11.2" stroke="${C.accent}" stroke-width="0.55"
        fill="none" marker-end="url(#pa-arrow)"/>
  <text x="-15.5" y="13.2" text-anchor="start" fill="${C.accent}"
        font-size="3.4" font-family="sans-serif" font-weight="700">1</text>
  <text x="-12.2" y="13.2" text-anchor="start" fill="${C.text}"
        font-size="3.0" font-family="sans-serif">おす</text>

  <!-- ② USB を挿す -->
  <path d="M10.5,-7.0 L10.5,-2.6" stroke="${C.accent}" stroke-width="0.55"
        fill="none" marker-end="url(#pa-arrow)"/>
  <text x="13.5" y="-4.0" text-anchor="start" fill="${C.accent}"
        font-size="3.4" font-family="sans-serif" font-weight="700">2</text>
  <text x="16.8" y="-4.0" text-anchor="start" fill="${C.text}"
        font-size="3.0" font-family="sans-serif">さす</text>
</svg>`;
  }

  /**
   * 「UF2 を RPI-RP2 ドライブに落とす」図。
   * 添え字がはみ出さないよう、viewBox に左右の余白と 2 行ぶんの下余白を取ってある。
   */
  function dragDrop(o) {
    const opt = Object.assign({ height: 150 }, o || {});
    return `
<svg viewBox="0 0 150 76" height="${opt.height}" role="img"
     aria-label="UF2 ファイルを RPI-RP2 ドライブにドラッグアンドドロップする図"
     style="max-width:100%; height:auto; max-height:${opt.height}px;">
  <defs>
    <marker id="pa-arrow2" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${C.accent}"/>
    </marker>
  </defs>

  <!-- ダウンロードした UF2 ファイル -->
  <g transform="translate(14,16)">
    <path d="M0,0 h18 l8,8 v28 a2,2 0 0 1 -2,2 h-24 a2,2 0 0 1 -2,-2 v-34 a2,2 0 0 1 2,-2 z"
          fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
    <path d="M18,0 l8,8 h-8 z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
    <text x="12" y="26" text-anchor="middle" fill="#0f766e"
          font-size="7" font-family="sans-serif" font-weight="700">UF2</text>
  </g>
  <text x="27" y="64" text-anchor="middle" fill="${C.text}"
        font-size="5.2" font-family="sans-serif">ダウンロードした</text>
  <text x="27" y="71" text-anchor="middle" fill="${C.text}"
        font-size="5.2" font-family="sans-serif">ファイル</text>

  <!-- 矢印 -->
  <text x="75" y="10" text-anchor="middle" fill="${C.accent}"
        font-size="6" font-family="sans-serif" font-weight="700">ドラッグ＆ドロップ</text>
  <path d="M46,40 C60,30 76,30 88,38" stroke="${C.accent}" stroke-width="2"
        fill="none" marker-end="url(#pa-arrow2)" stroke-dasharray="4 3"/>

  <!-- パソコンに出てくるドライブ -->
  <g transform="translate(94,22)">
    <rect x="0" y="0" width="48" height="32" rx="3"
          fill="#f8fafc" stroke="#64748b" stroke-width="1.2"/>
    <rect x="0" y="0" width="48" height="8" rx="3" fill="#64748b"/>
    <rect x="0" y="5" width="48" height="3" fill="#64748b"/>
    <circle cx="6.5" cy="15" r="2.4" fill="#0f766e"/>
    <text x="12.5" y="17.4" fill="#0f172a" font-size="6.4"
          font-family="sans-serif" font-weight="700">RPI-RP2</text>
    <rect x="6.5" y="22" width="34" height="1.6" rx="0.8" fill="#cbd5e1"/>
    <rect x="6.5" y="26" width="24" height="1.6" rx="0.8" fill="#cbd5e1"/>
  </g>
  <text x="118" y="64" text-anchor="middle" fill="${C.text}"
        font-size="5.2" font-family="sans-serif">パソコンに出てくる</text>
  <text x="118" y="71" text-anchor="middle" fill="${C.text}"
        font-size="5.2" font-family="sans-serif">ドライブ</text>
</svg>`;
  }

  return { board, plugIn, dragDrop };
})();
