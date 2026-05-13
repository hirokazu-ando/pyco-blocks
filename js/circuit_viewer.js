// ===== 実態配線図ジェネレーター (Phase 1) =====

(() => {
  'use strict';

  // ===== Pico レイアウト定数 =====
  // PX/PY は自動配置 + ユーザドラッグオフセット で動的に変動する
  // PW は実際の Pi Pico の縦横比 (21:51 ≈ 1:2.4) に近づけるため広めに
  let PX = 110, PY = 30;
  const PW = 130, PP = 19, PC = 20;
  const CH_STEP = 18; // チャンネル間隔（広めにとり交差視認性を確保）
  const PH = (PC - 1) * PP + 24;

  const L_PINS = [
    'GP0','GP1','GND','GP2','GP3','GP4','GND','GP5',
    'GP6','GP7','GP8','GND','GP9','GP10','GP11','GP12',
    'GND','GP13','GP14','GP15'
  ];
  const R_PINS = [
    'VBUS','VSYS','GND','3V3_EN','3V3','ADC_REF','GP28','AGND',
    'GP27','GP26','RUN','GP22','GP21','GP20','GND','GP19',
    'GP18','GND','GP17','GP16'
  ];

  function gpCoord(n) {
    n = parseInt(n);
    const li = L_PINS.indexOf('GP' + n);
    if (li >= 0) return { x: PX,      y: PY + 12 + li * PP, side: 'left'  };
    const ri = R_PINS.indexOf('GP' + n);
    if (ri >= 0) return { x: PX + PW, y: PY + 12 + ri * PP, side: 'right' };
    return null;
  }
  function getV3v3() { return { x: PX + PW, y: PY + 12 + 4 * PP, side: 'right' }; }
  function getVbus()  { return { x: PX + PW, y: PY + 12 + 0 * PP, side: 'right' }; }

  // 全GNDピン位置を動的生成 (PXが変わるたびに呼ぶ)
  function getGndPins() {
    return [
      { x: PX,      y: PY + 12 + 2  * PP, side: 'left'  },
      { x: PX,      y: PY + 12 + 6  * PP, side: 'left'  },
      { x: PX,      y: PY + 12 + 11 * PP, side: 'left'  },
      { x: PX,      y: PY + 12 + 16 * PP, side: 'left'  },
      { x: PX + PW, y: PY + 12 + 2  * PP, side: 'right' },
      { x: PX + PW, y: PY + 12 + 7  * PP, side: 'right' },
      { x: PX + PW, y: PY + 12 + 14 * PP, side: 'right' },
      { x: PX + PW, y: PY + 12 + 17 * PP, side: 'right' },
    ];
  }

  function picoCoordOf(s, cx2, cy2, preferSide) {
    if (!s) return null;
    if (s.gp  != null) return gpCoord(s.gp);
    if (s.gnd) {
      const all  = getGndPins();
      const pool = preferSide ? (all.filter(g => g.side === preferSide) || all) : all;
      const src  = pool.length > 0 ? pool : all;
      let best = src[0], bestDist = Infinity;
      src.forEach(g => {
        const d = Math.hypot(g.x - (cx2 || 0), g.y - (cy2 || 0));
        if (d < bestDist) { bestDist = d; best = g; }
      });
      return best;
    }
    if (s.v3v3) return getV3v3();
    if (s.vbus) return getVbus();
    return null;
  }

  // ===== コンポーネント配置定数 =====
  const C_CW = 200;        // 部品セル幅 (ラベル・本体の横余裕を確保)
  const C_CH = 175;        // 部品セル高さ
  const C_L_MARGIN = 30;   // SVG左端マージン
  const COMP_MIN_GAP = 135;// 同列上下隣接部品の中心間最小距離 (7Seg/STEPPER の実効高さに合わせて広め)
  const COMP_MAX_PUSH = 110;// 同列に押し込める時の理想cyからの最大ずれ (超えたら新列)

  // ===== SVG Defs (グラデーション・フィルター) =====
  const DEFS = `<defs>
  <radialGradient id="gLedRed" cx="40%" cy="35%" r="65%">
    <stop offset="0%"   stop-color="#ff8a80"/>
    <stop offset="60%"  stop-color="#e53935"/>
    <stop offset="100%" stop-color="#b71c1c"/>
  </radialGradient>
  <radialGradient id="gBtn" cx="38%" cy="32%" r="72%">
    <stop offset="0%"   stop-color="#f0f0f0"/>
    <stop offset="100%" stop-color="#9e9e9e"/>
  </radialGradient>
  <linearGradient id="gServoBody" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stop-color="#f0f0f0"/>
    <stop offset="100%" stop-color="#b8b8b8"/>
  </linearGradient>
  <linearGradient id="gPcbGreen" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="#43a047"/>
    <stop offset="100%" stop-color="#1b5e20"/>
  </linearGradient>
  <linearGradient id="gPcbBlue" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="#1e88e5"/>
    <stop offset="100%" stop-color="#0d47a1"/>
  </linearGradient>
  <linearGradient id="gPcbRed" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="#ef5350"/>
    <stop offset="100%" stop-color="#b71c1c"/>
  </linearGradient>
  <radialGradient id="gTransducer" cx="38%" cy="32%" r="70%">
    <stop offset="0%"   stop-color="#f5f5f5"/>
    <stop offset="60%"  stop-color="#c0c0c0"/>
    <stop offset="100%" stop-color="#757575"/>
  </radialGradient>
  <linearGradient id="gMotorBlue" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="#42a5f5"/>
    <stop offset="100%" stop-color="#1565c0"/>
  </linearGradient>
  <filter id="fDrop" x="-12%" y="-12%" width="124%" height="124%">
    <feDropShadow dx="1.5" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.55"/>
  </filter>
</defs>`;

  // 部品端に横スタブ＋ラベルを描く汎用ヘルパー
  // side='right' → 左端 (右側Picoに向かう配線)  side='left' → 右端
  function sideStubs(cx, cy, side, bodyW, dys, labels) {
    const edgeX  = side === 'right' ? cx - bodyW : cx + bodyW;
    const sdir   = side === 'right' ? -1 : 1;
    const padX   = edgeX + sdir * 8;   // 配線接続点(円)はボード端より外側
    const lblX   = edgeX + sdir * 12;
    const anchor = side === 'right' ? 'end' : 'start';
    return dys.map((dy, i) => {
      const py = cy + dy;
      return `<line x1="${edgeX}" y1="${py}" x2="${padX}" y2="${py}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${padX}" cy="${py}" r="3" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${lblX}" y="${py+4}" text-anchor="${anchor}" font-size="11" fill="#b0bec5" font-family="sans-serif">${labels[i]}</text>`;
    }).join('\n  ');
  }

  // ===== コンポーネントシンボル =====
  const SYM = {

    // ── LED (Wokwi wokwi-led, MIT © 2020 Uri Shaked) + 直列抵抗 ─
    // バルブを 90° 回転して脚を水平に向け、リード/抵抗/ピンを脚先端に直結
    LED: {
      pins: { A: { dx: -58, dy: -5 }, C: { dx: -30, dy: 5 } },
      draw(cx, cy, side = 'right') {
        // sdir はピンが伸びる向き (right側部品は左へ、left側部品は右へ)
        const sdir = side === 'right' ? -1 : 1;
        // バルブ SVG を rotate(90) で横倒し → 脚先端は (cx-19.4, cy∓5.2) 付近
        // left 側はさらに x=cx でミラーすることで脚を右向きに反転
        const sx = cx - 22, sy = cy - 25;
        const rotateXform = `rotate(90 ${cx} ${cy})`;
        const bulbXform = side === 'left'
          ? `translate(${cx * 2} 0) scale(-1 1) ${rotateXform}`
          : rotateXform;
        // 回転後の脚先端 (アノード=上側, カソード=下側)
        const legTipX = cx + sdir * 19;
        const aTipY = cy - 5;
        const cTipY = cy + 5;
        // 直列抵抗 & ピン位置
        const resNear = cx + sdir * 30;
        const resFar  = cx + sdir * 50;
        const aPinX   = cx + sdir * 58;
        const cPinX   = cx + sdir * 30;
        const resX    = Math.min(resNear, resFar);
        const resW    = Math.abs(resFar - resNear);
        const labelAnchor = side === 'right' ? 'end' : 'start';
        return `<g>
  <g transform="${bulbXform}">
    <svg x="${sx}" y="${sy}" width="44" height="50" viewBox="-10 -5 35.456 39.618" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5099" y="20.382" width="2.1514" height="9.8273" fill="#8c8c8c"/>
      <path d="m12.977 30.269c0-1.1736-0.86844-2.5132-1.8916-3.4024-0.41616-0.3672-1.1995-1.0015-1.1995-1.4249v-5.4706h-2.1614v5.7802c0 1.0584 0.94752 1.8785 1.9462 2.7482 0.44424 0.37584 1.3486 1.2496 1.3486 1.7694" fill="#8c8c8c"/>
      <path d="m14.173 13.001v-5.9126c0-3.9132-3.168-7.0884-7.0855-7.0884-3.9125 0-7.0877 3.1694-7.0877 7.0884v13.649c1.4738 1.651 4.0968 2.7526 7.0877 2.7526 4.6195 0 8.3686-2.6179 8.3686-5.8594v-1.5235c-7.4e-4 -1.1426-0.47444-2.2039-1.283-3.1061z" opacity=".3"/>
      <path d="m14.173 13.001v-5.9126c0-3.9132-3.168-7.0884-7.0855-7.0884-3.9125 0-7.0877 3.1694-7.0877 7.0884v13.649c1.4738 1.651 4.0968 2.7526 7.0877 2.7526 4.6195 0 8.3686-2.6179 8.3686-5.8594v-1.5235c-7.4e-4 -1.1426-0.47444-2.2039-1.283-3.1061z" fill="#e6e6e6" opacity=".5"/>
      <path d="m14.173 13.001v3.1054c0 2.7389-3.1658 4.9651-7.0855 4.9651-3.9125 2e-5 -7.0877-2.219-7.0877-4.9651v4.6296c1.4738 1.6517 4.0968 2.7526 7.0877 2.7526 4.6195 0 8.3686-2.6179 8.3686-5.8586l-4e-5 -1.5235c-7e-4 -1.1419-0.4744-2.2032-1.283-3.1054z" fill="#d1d1d1" opacity=".9"/>
      <polygon points="2.2032 16.107 3.1961 16.107 3.1961 13.095 6.0156 13.095 10.012 8.8049 3.407 8.8049 2.2032 9.648" fill="#666"/>
      <polygon points="11.215 9.0338 7.4117 13.095 11.06 13.095 11.06 16.107 11.974 16.107 11.974 8.5241 10.778 8.5241" fill="#666"/>
      <path d="m14.173 13.001v-5.9126c0-3.9132-3.168-7.0884-7.0855-7.0884-3.9125 0-7.0877 3.1694-7.0877 7.0884v13.649c1.4738 1.651 4.0968 2.7526 7.0877 2.7526 4.6195 0 8.3686-2.6179 8.3686-5.8594v-1.5235c-7.4e-4 -1.1426-0.47444-2.2039-1.283-3.1061z" fill="#e53935" opacity=".65"/>
      <path d="m10.388 3.7541 1.4364-0.2736c-0.84168-1.1318-2.0822-1.9577-3.5417-2.2385l0.25416 1.0807c0.76388 0.27072 1.4068 0.78048 1.8511 1.4314z" fill="#fff" opacity=".5"/>
      <path d="m0.76824 19.926v1.5199c0.64872 0.5292 1.4335 0.97632 2.3076 1.3169v-1.525c-0.8784-0.33624-1.6567-0.78194-2.3076-1.3118z" fill="#fff" opacity=".5"/>
    </svg>
  </g>
  <!-- アノード (A): 脚先端→リード→直列抵抗→リード→ピン -->
  <line x1="${legTipX}" y1="${aTipY}" x2="${resNear}" y2="${aTipY}" stroke="#888" stroke-width="1.5"/>
  <rect x="${resX}" y="${aTipY - 4}" width="${resW}" height="8" fill="#c8a86e" stroke="#8a7040" stroke-width="1" rx="2"/>
  <line x1="${resX + resW * 0.25}" y1="${aTipY - 4}" x2="${resX + resW * 0.25}" y2="${aTipY + 4}" stroke="#8a6030" stroke-width="1"/>
  <line x1="${resX + resW * 0.5}"  y1="${aTipY - 4}" x2="${resX + resW * 0.5}"  y2="${aTipY + 4}" stroke="#8a6030" stroke-width="1"/>
  <line x1="${resX + resW * 0.75}" y1="${aTipY - 4}" x2="${resX + resW * 0.75}" y2="${aTipY + 4}" stroke="#8a6030" stroke-width="1"/>
  <line x1="${resFar}" y1="${aTipY}" x2="${aPinX}" y2="${aTipY}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${aPinX}" cy="${aTipY}" r="3" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${aPinX + sdir * 4}" y="${aTipY + 4}" text-anchor="${labelAnchor}" font-size="11" fill="#b0bec5" font-family="sans-serif">A</text>
  <!-- カソード (C): 脚先端→スタブ→ピン -->
  <line x1="${legTipX}" y1="${cTipY}" x2="${cPinX}" y2="${cTipY}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${cPinX}" cy="${cTipY}" r="3" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${cPinX + sdir * 4}" y="${cTipY + 4}" text-anchor="${labelAnchor}" font-size="11" fill="#b0bec5" font-family="sans-serif">C</text>
  <text x="${cx}" y="${cy + 26}" text-anchor="middle" class="cv-lbl">LED</text>
</g>`;
      }
    },

    // ── タクタイルスイッチ (Wokwi wokwi-pushbutton, MIT © 2020 Uri Shaked) ──
    // 小型化(36×36)+両ピンPico側に集約
    BTN: {
      pins: { VCC: { dx: -34, dy: -8 }, SIG: { dx: -34, dy: 8 } },
      draw(cx, cy, side = 'right') {
        const sdir = side === 'right' ? -1 : 1;
        const sx = cx - 18, sy = cy - 18;
        // 本体SVGの向きは固定(正方形なので回転不要)
        const pinSpec = [
          { lbl: 'VCC', dy: -8 },
          { lbl: 'SIG', dy:  8 },
        ];
        const tipX = cx + sdir * 18;
        const padX = cx + sdir * 34;
        const labelAnchor = side === 'right' ? 'end' : 'start';
        const stubs = pinSpec.map(({lbl, dy}) => {
          const y = cy + dy;
          return `<line x1="${tipX}" y1="${y}" x2="${padX}" y2="${y}" stroke="#c8a86e" stroke-width="2.5"/>
  <circle cx="${tipX}" cy="${y}" r="2" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${tipX - sdir * 4}" y="${y - 3}" text-anchor="${labelAnchor}" font-size="9" fill="#b0bec5" font-family="sans-serif">${lbl}</text>`;
        }).join('\n  ');
        return `<g>
  <svg x="${sx}" y="${sy}" width="36" height="36" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="12" height="12" rx=".44" ry=".44" fill="#464646"/>
    <rect x=".75" y=".75" width="10.5" height="10.5" rx=".211" ry=".211" fill="#eaeaea"/>
    <g fill="#1b1b1b">
      <circle cx="1.767" cy="1.7916" r=".37"/>
      <circle cx="10.161" cy="1.7916" r=".37"/>
      <circle cx="10.161" cy="10.197" r=".37"/>
      <circle cx="1.767" cy="10.197" r=".37"/>
    </g>
    <circle cx="6" cy="6" r="3.822" fill="#cc2222"/>
    <circle cx="6" cy="6" r="2.9" fill="#cc2222" stroke="#2f2f2f" stroke-opacity=".47" stroke-width=".08"/>
  </svg>
  ${stubs}
  <text x="${cx}" y="${cy+30}" text-anchor="middle" class="cv-lbl">Button</text>
</g>`;
      }
    },

    // ── ポテンショメーター (Wokwi wokwi-potentiometer, MIT © 2020 Uri Shaked) ──
    // 90°回転でピンを横向きに（元SVGのピンは底部横並び → rotate(90)で左側縦並びに）
    // 回転後ピン位置計算: rotate(90 cx cy) → GND(cx-32,cy-9) SIG(cx-32,cy+1) VCC(cx-32,cy+11)
    POT: {
      pins: { GND: { dx: -32, dy: -9 }, SIG: { dx: -32, dy: 1 }, VCC: { dx: -32, dy: 11 } },
      draw(cx, cy, side = 'right') {
        const sx = cx - 40, sy = cy - 40;
        const rotAngle = side === 'right' ? 90 : -90;
        const dys = side === 'right' ? [-9, 1, 11] : [9, -1, -11];
        return `<g>
  <g transform="rotate(${rotAngle} ${cx} ${cy})">
    <svg x="${sx}" y="${sy}" width="80" height="80" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <rect x=".15" y=".15" width="19.5" height="19.5" ry="1.23" fill="#045881" stroke="#045881" stroke-width=".30"/>
      <rect x="5.4" y=".70" width="9.1" height="1.9" fill="#ccdae3" stroke-width=".15"/>
      <ellipse cx="9.95" cy="8.06" rx="7.27" ry="7.43" fill="#e4e8eb" stroke-width=".15"/>
      <ellipse cx="9.95" cy="8.06" rx="6.60" ry="6.58" fill="#c3c2c3" stroke-width=".15"/>
      <rect x="9.79" y="2" width=".42" height="3.1" stroke-width=".15" fill="#333"/>
      <g fill="#b3b1b0" stroke-width=".15">
        <ellipse cx="7.68" cy="18" rx=".61" ry=".63"/>
        <ellipse cx="10.22" cy="18" rx=".61" ry=".63"/>
        <ellipse cx="12.76" cy="18" rx=".61" ry=".63"/>
      </g>
      <rect x="6" y="17" width="8" height="2" fill-opacity="0" stroke="#fff" stroke-width=".30"/>
      <g stroke-width=".15" fill="#ccdae3" font-size="1.3" font-family="sans-serif">
        <text x="6.1" y="16.6">GND</text>
        <text x="9.0" y="16.63">SIG</text>
        <text x="11.4" y="16.59">VCC</text>
      </g>
      <g fill="#fff" stroke-width=".15">
        <ellipse cx="1.68" cy="1.81" rx=".99" ry=".96"/>
        <ellipse cx="1.48" cy="18.37" rx=".99" ry=".96"/>
        <ellipse cx="17.97" cy="18.47" rx=".99" ry=".96"/>
        <ellipse cx="18.07" cy="1.91" rx=".99" ry=".96"/>
      </g>
    </svg>
  </g>
  ${sideStubs(cx, cy, side, 32, dys, ['GND', 'SIG', 'VCC'])}
  <text x="${cx}" y="${cy + 44}" text-anchor="middle" class="cv-lbl">Potentiometer</text>
</g>`;
      }
    },

    // ── パッシブブザー (Wokwi wokwi-buzzer, MIT © 2020 Uri Shaked) ──
    // 90°回転で端子を横向きに。SVGを56×66に縮小
    BUZZ: {
      pins: { SIG: { dx: -50, dy: -4 }, GND: { dx: -50, dy: 4 } },
      draw(cx, cy, side = 'right') {
        const sdir = side === 'right' ? -1 : 1;
        const sx = cx - 28, sy = cy - 33;
        const rotateXform = `rotate(90 ${cx} ${cy})`;
        const bodyXform = side === 'left'
          ? `translate(${cx * 2} 0) scale(-1 1) ${rotateXform}`
          : rotateXform;
        const pinSpec = [
          { lbl: 'SIG', dy: -4 },
          { lbl: 'GND', dy:  4 },
        ];
        const tipX = cx + sdir * 33;
        const padX = cx + sdir * 50;
        const labelAnchor = side === 'right' ? 'end' : 'start';
        const stubs = pinSpec.map(({lbl, dy}) => {
          const y = cy + dy;
          return `<line x1="${tipX}" y1="${y}" x2="${padX}" y2="${y}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${padX}" cy="${y}" r="3" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${padX + sdir * 4}" y="${y + 3}" text-anchor="${labelAnchor}" font-size="9" fill="#b0bec5" font-family="sans-serif">${lbl}</text>`;
        }).join('\n  ');
        return `<g>
  <g transform="${bodyXform}">
    <svg x="${sx}" y="${sy}" width="56" height="66" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg">
      <path d="m7.23 16.5v3.5" fill="none" stroke="#8c8c8c" stroke-width=".5"/>
      <path d="m9.77 16.5v3.5" fill="#f00" stroke="#f00" stroke-width=".5"/>
      <g stroke="#444">
        <ellipse cx="8.5" cy="8.5" rx="8.15" ry="8.15" fill="#1a1a1a" stroke-width=".7"/>
        <circle cx="8.5" cy="8.5" r="6.35" fill="none" stroke-width=".3" style="paint-order:normal"/>
        <circle cx="8.5" cy="8.5" r="4.35" fill="none" stroke-width=".3" style="paint-order:normal"/>
      </g>
      <circle cx="8.5" cy="8.5" r="1.37" fill="#ccc" stroke="#444" stroke-width=".25"/>
      <text x="3.5" y="10" font-size="2.8" fill="#e53935" font-weight="bold" font-family="sans-serif">+</text>
    </svg>
  </g>
  ${stubs}
  <text x="${cx}" y="${cy + 28}" text-anchor="middle" class="cv-lbl">Buzzer</text>
</g>`;
      }
    },

    // ── SG90 サーボ (Wokwi wokwi-servo, MIT © 2020 Uri Shaked) ──
    // ピン位置: connectorface cx-61, pad cx-69; dy=-6(GND), 0(VCC外部電源), +6(PWM)
    SERVO: {
      pins: { GND: { dx: -69, dy: -6 }, VCC: { dx: -69, dy: 0 }, PWM: { dx: -69, dy: 6 } },
      draw(cx, cy, side = 'right') {
        const sdir = side === 'right' ? -1 : 1;
        const sx = cx - 65, sy = cy - 36;
        const pin = (x, y) =>
          `<g transform="translate(${x},${y})">
            <rect x="0" y="-1.91" width="3.72" height="3.71" fill="#111"/>
            <rect fill="#ccc" x="0.33" y="-1.23" width="3.04" height="2.46" rx=".15"/>
          </g>`;
        return `<g>
  <svg x="${sx}" y="${sy}" width="130" height="72" viewBox="0 0 170.08 119.55" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" stroke="#b44200" stroke-width="2.7" d="m83.32,56.6c0,0-32.99,0.96-43.32,0-6.20,-0.58-10.60,-6.20-14.87,-6.31"/>
    <path fill="none" stroke="#ff2300" stroke-width="2.7" d="m83.326 59.6h-62.971"/>
    <path fill="none" stroke="#f47b00" stroke-width="2.7" d="m83.32,62.6c0,0-32.60,-0.61-43.33,-0.15-6.87,0.29-12.01,6.82-14.77,6.73"/>
    <rect fill="#666" y="45.5" width="25.71" height="28" rx="1.14"/>
    ${pin(4.7, 50.06)}${pin(4.7, 59.66)}${pin(4.7, 69.26)}
    <path fill="#4d4d4d" d="m55.068 66.75a7.09 7.09 0 1 0-5.8261-11.136 0.18 0.18 0 0 1-0.33-0.10234v-14.346h17.676v36.98h-17.676v-14.346a0.18 0.18 0 0 1 0.333-0.107 7.08 7.08 0 0 0 5.83 3.06z"/>
    <path fill="#4d4d4d" d="m163.92 66.867a7.09 7.09 0 1 1 5.8145-11.136 0.18 0.18 0 0 0 0.33-0.10234v-14.346h-17.664v36.98h17.676v-14.346a0.18 0.18 0 0 0-0.333-0.107 7.08 7.08 0 0 1-5.83 3.06z"/>
    <rect fill="#666" x="64.255" y="37.911" width="90.241" height="43.725" rx="5.3331"/>
    <path fill="gray" d="m110.07 50.005h-14.42v19.537h14.42a9.7684 9.7684 0 0 0 0-19.537z"/>
    <circle fill="#999" cx="91.467" cy="59.773" r="18.606"/>
    <rect fill="#e0e0e0" x="88.5" y="40" width="6" height="20" rx="3"/>
    <rect fill="#e0e0e0" x="79" y="57" width="25" height="6" rx="3"/>
    <circle fill="gray" cx="91.467" cy="59.773" r="8.3729"/>
    <circle fill="#ccc" cx="91.467" cy="59.773" r="6.2494"/>
  </svg>
  <!-- 端子スタブ (GND / Vext / PWM) -->
  ${sideStubs(cx, cy, side, 61, [-6, 0, 6], ['GND', 'Vext', 'PWM'])}
  <text x="${cx}" y="${cy + 46}" text-anchor="middle" class="cv-lbl">Servo (SG90)</text>
</g>`;
      }
    },

    // ── HC-SR04 (Wokwi wokwi-hc-sr04, MIT © 2020 Uri Shaked) ──
    // 90°回転で端子を横向きに。
    // Picoピッチ(PP=19px=2.54mm)に合わせて PP/2.54≈7.48倍にスケールアップ。
    // viewBox="0 0 45 25", ピンx=18.61〜26.23(間隔2.54unit), ピンy中間≈22unit
    // 新サイズ: width=337, height=187
    // sx: 足水平中心(22.42unit)がcxに来るよう cx-168
    // sy: 足中間y_real=sy+164.6、rotate後tipX=cx-75 → sy=cy-112
    HCSR04: {
      pins: { VCC: { dx: -95, dy: -28.5 }, TRIG: { dx: -95, dy: -9.5 }, ECHO: { dx: -95, dy: 9.5 }, GND: { dx: -95, dy: 28.5 } },
      draw(cx, cy, side = 'right') {
        const sdir = side === 'right' ? -1 : 1;
        const sx = cx - 168, sy = cy - 112;
        const rotateXform = `rotate(90 ${cx} ${cy})`;
        const bodyXform = side === 'left'
          ? `translate(${cx * 2} 0) scale(-1 1) ${rotateXform}`
          : rotateXform;
        const pinSpec = [
          { lbl: 'VCC',  dy: -28.5 },
          { lbl: 'TRIG', dy:  -9.5 },
          { lbl: 'ECHO', dy:   9.5 },
          { lbl: 'GND',  dy:  28.5 },
        ];
        const tipX = cx + sdir * 75;
        const padX = cx + sdir * 95;
        const labelAnchor = side === 'right' ? 'end' : 'start';
        const stubs = pinSpec.map(({lbl, dy}) => {
          const y = cy + dy;
          return `<line x1="${tipX}" y1="${y}" x2="${padX}" y2="${y}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${padX}" cy="${y}" r="3" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${padX + sdir * 4}" y="${y + 3}" text-anchor="${labelAnchor}" font-size="9" fill="#b0bec5" font-family="sans-serif">${lbl}</text>`;
        }).join('\n  ');
        return `<g>
  <g transform="${bodyXform}">
    <svg x="${sx}" y="${sy}" width="337" height="187" viewBox="0 0 45 25" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <pattern patternUnits="userSpaceOnUse" width="2" height="2" id="hcsr04cb">
          <path d="M0 0h1v1H0zM1 1h1v1H1z"/>
        </pattern>
        <radialGradient id="hcsr04g" cx="8.96" cy="10.04" r="3.58" gradientUnits="userSpaceOnUse">
          <stop stop-color="#777" offset="0"/>
          <stop stop-color="#b9b9b9" offset="1"/>
        </radialGradient>
        <g id="hcsr04su">
          <circle cx="8.98" cy="10" r="8.61" fill="#dcdcdc"/>
          <circle cx="8.98" cy="10" r="7.17" fill="#222"/>
          <circle cx="8.98" cy="10" r="5.53" fill="#777"/>
          <circle cx="8.98" cy="10" r="3.59" fill="url(#hcsr04g)"/>
          <circle cx="8.99" cy="10" r=".277" fill="#777" opacity=".818"/>
          <circle cx="8.98" cy="10" r="5.53" fill="url(#hcsr04cb)" opacity=".397"/>
        </g>
      </defs>
      <path d="M0 0v20.948h45V0zm1.422.464a1 1 0 011 1 1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 01.996-1zm41.956 0a1 1 0 011 1 1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 01.996-1zM1.422 18.484a1 1 0 011 1 1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 01.996-1zm41.956 0a1 1 0 011 1 1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 01.996-1z" fill="#456f93"/>
      <use href="#hcsr04su"/>
      <use href="#hcsr04su" x="27.12"/>
      <rect ry="2.07" y=".626" x="17.111" height="4.139" width="10.272" fill="#878787" stroke="#424242" stroke-width=".368"/>
      <g fill="black">
        <rect x="17.87" y="18" ry=".568" width="2.25" height="2.271"/>
        <rect x="20.41" y="18" ry=".568" width="2.25" height="2.271"/>
        <rect x="22.95" y="18" ry=".568" width="2.25" height="2.271"/>
        <rect x="25.49" y="18" ry=".568" width="2.25" height="2.271"/>
      </g>
      <g fill="#ccc" stroke-linecap="round" stroke-width=".21">
        <rect x="18.61" y="19" width=".75" height="6" rx=".2"/>
        <rect x="21.15" y="19" width=".75" height="6" rx=".2"/>
        <rect x="23.69" y="19" width=".75" height="6" rx=".2"/>
        <rect x="26.23" y="19" width=".75" height="6" rx=".2"/>
      </g>
      <text font-size="2.2" fill="#e6e6e6" stroke-width=".055" x="17.6" y="8">HC-SR04</text>
    </svg>
  </g>
  ${stubs}
  <text x="${cx}" y="${cy + 185}" text-anchor="middle" class="cv-lbl">HC-SR04</text>
</g>`;
      }
    },

    // ── DHT22 (Wokwi wokwi-dht22, MIT © 2020 Uri Shaked) ──
    // 90°回転で端子を横向きに。Picoピッチ(PP=19px)に合わせてSVGを113×231にスケールアップ。
    // 実物は4ピン: VCC / DATA / NC / GND。NC は未接続（パッドなし・薄色表示）。
    DHT22: {
      pins: { VCC: { dx: -95, dy: -28.5 }, SIG: { dx: -95, dy: -9.5 }, GND: { dx: -95, dy: 28.5 } },
      draw(cx, cy, side = 'right') {
        const sdir = side === 'right' ? -1 : 1;
        const sx = cx - 55, sy = cy - 156;
        const rotateXform = `rotate(90 ${cx} ${cy})`;
        const bodyXform = side === 'left'
          ? `translate(${cx * 2} 0) scale(-1 1) ${rotateXform}`
          : rotateXform;
        const pinSpec = [
          { lbl: 'VCC',  dy: -28.5 },
          { lbl: 'DATA', dy:  -9.5 },
          { lbl: 'NC',   dy:   9.5, nc: true },
          { lbl: 'GND',  dy:  28.5 },
        ];
        const tipX = cx + sdir * 75;
        const padX = cx + sdir * 95;
        const labelAnchor = side === 'right' ? 'end' : 'start';
        const stubs = pinSpec.map(({lbl, dy, nc}) => {
          const y = cy + dy;
          if (nc) {
            return `<line x1="${tipX}" y1="${y}" x2="${padX}" y2="${y}" stroke="#555" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="${padX + sdir * 4}" y="${y + 3}" text-anchor="${labelAnchor}" font-size="9" fill="#555" font-family="sans-serif">${lbl}</text>`;
          }
          return `<line x1="${tipX}" y1="${y}" x2="${padX}" y2="${y}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${padX}" cy="${y}" r="3" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${padX + sdir * 4}" y="${y + 3}" text-anchor="${labelAnchor}" font-size="9" fill="#b0bec5" font-family="sans-serif">${lbl}</text>`;
        }).join('\n  ');
        return `<g>
  <g transform="${bodyXform}">
    <svg x="${sx}" y="${sy}" width="113" height="231" viewBox="0 0 15.1 30.885" xmlns="http://www.w3.org/2000/svg">
      <g fill="#ccc" stroke-linecap="round" stroke-width=".21">
        <rect x="3.57" y="23.885" width=".75" height="7" rx=".2"/>
        <rect x="6.11" y="23.885" width=".75" height="7" rx=".2"/>
        <rect x="8.65" y="23.885" width=".75" height="7" rx=".2"/>
        <rect x="11.19" y="23.885" width=".75" height="7" rx=".2"/>
      </g>
      <path d="M15.05 23.995V5.033c0-.107-1.069-4.962-2.662-4.96L2.803.09C1.193.09.05 4.926.05 5.033v18.962c0 .107.086.192.192.192h14.616a.192.192 0 00.192-.192M7.615.948h.004c1.08 0 1.956.847 1.956 1.892s-.876 1.892-1.956 1.892-1.956-.847-1.956-1.892c0-1.044.873-1.89 1.952-1.892z" fill="#f2f2f2" stroke="#000" stroke-linecap="round" stroke-width=".1"/>
      <text x="3.7" y="22.86" fill="#000" font-family="sans-serif" font-size="2.2" stroke-width=".05">DHT22</text>
    </svg>
  </g>
  ${stubs}
  <text x="${cx}" y="${cy + 70}" text-anchor="middle" class="cv-lbl">DHT22</text>
</g>`;
      }
    },

    // ── LCD1602 I2C (Wokwi wokwi-lcd1602, MIT © 2020 Uri Shaked) ──
    LCD: {
      pins: { GND: { dx: -88, dy: -24 }, VCC: { dx: -88, dy: -8 }, SDA: { dx: -88, dy: 8 }, SCL: { dx: -88, dy: 24 } },
      draw(cx, cy, side = 'right') {
        const sx = cx - 80, sy = cy - 36;
        // Character cells: 16×2 grid in SVG mm units (panelX=12.45, panelY=12.55, spacing 3.55×5.95)
        const cells = [];
        for (let r = 0; r < 2; r++) for (let c = 0; c < 16; c++) {
          const cx2 = 12.45 + c * 3.55, cy2 = 12.55 + r * 5.95;
          cells.push(`<rect x="${cx2}" y="${cy2}" width="2.95" height="5.55" fill="#4dd0e1" opacity="0.12" rx="0.3"/>`);
        }
        return `<g>
  <svg x="${sx}" y="${sy}" width="160" height="72" viewBox="0 0 80 36" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="36" fill="#087f45"/>
    <circle cx="3.5"  cy="3.5"  r="1.5" fill="#056035"/>
    <circle cx="76.5" cy="3.5"  r="1.5" fill="#056035"/>
    <circle cx="3.5"  cy="32.5" r="1.5" fill="#056035"/>
    <circle cx="76.5" cy="32.5" r="1.5" fill="#056035"/>
    <rect x="4.95" y="5.7"  width="71"   height="24.7" fill="#111" rx="0.7"/>
    <rect x="7.55" y="10.3" width="65.8" height="15.5" rx="1.5" fill="#003050"/>
    ${cells.join('')}
    <rect x="5"  y="27"   width="22" height="7"   fill="#056035" stroke="#034025" stroke-width="0.3" rx="0.5"/>
    <rect x="6"  y="27.5" width="10" height="6"   fill="#1a1a1a" stroke="#333"    stroke-width="0.2" rx="0.3"/>
    ${[0,1,2].map(i=>`<rect x="5.3"  y="${28+i*1.5}" width="0.7" height="0.8" fill="#555" rx="0.1"/>`).join('')}
    ${[0,1,2].map(i=>`<rect x="16.0" y="${28+i*1.5}" width="0.7" height="0.8" fill="#555" rx="0.1"/>`).join('')}
    <circle cx="23" cy="30.5" r="2.3" fill="#1565C0" stroke="#0d47a1" stroke-width="0.3"/>
    <circle cx="23" cy="30.5" r="0.8" fill="#1a1a1a"/>
  </svg>
  ${sideStubs(cx, cy, side, 80, [-24, -8, 8, 24], ['GND', 'VCC', 'SDA', 'SCL'])}
  <text x="${cx}" y="${cy-40}" text-anchor="middle" class="cv-lbl">LCD1602 (I2C)</text>
</g>`;
      }
    },

    // ── 7セグメント LED (Wokwi wokwi-7segment, MIT © 2020 Uri Shaked) ──
    SEG7: {
      // A-G+COM: 左側縦並び(14px間隔)。bodyW=31(svg63px幅の半分)、stub8px → dx=-39
      pins: {
        A:   { dx: -39, dy: -49 }, B: { dx: -39, dy: -35 }, C: { dx: -39, dy: -21 },
        D:   { dx: -39, dy:  -7 }, E: { dx: -39, dy:   7 }, F: { dx: -39, dy:  21 },
        G:   { dx: -39, dy:  35 }, COM: { dx: -39, dy:  49 },
      },
      draw(cx, cy, side = 'right') {
        const sx = cx - 31, sy = cy - 55;
        return `<g>
  <svg x="${sx}" y="${sy}" width="63" height="110" viewBox="0 0 12.55 22" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="12.55" height="20.5" fill="#1a1a1a"/>
    <g transform="skewX(-8) translate(3.5,2.4) scale(0.81)" fill="#ff8c00">
      <polygon points="2 0 8 0 9 1 8 2 2 2 1 1"/>
      <polygon points="10 2 10 8 9 9 8 8 8 2 9 1"/>
      <polygon points="10 10 10 16 9 17 8 16 8 10 9 9"/>
      <polygon points="8 18 2 18 1 17 2 16 8 16 9 17"/>
      <polygon points="0 16 0 10 1 9 2 10 2 16 1 17"/>
      <polygon points="0 8 0 2 1 1 2 2 2 8 1 9"/>
      <polygon points="2 8 8 8 9 9 8 10 2 10 1 9"/>
    </g>
    <circle cx="11.4" cy="17.5" r="0.89" fill="#ff8c00"/>
    <rect x="3.18" y="20.5" width="7.62" height="1.5" fill="#c8a86e" stroke="#8a7040" stroke-width="0.15" rx="0.2"/>
  </svg>
  ${sideStubs(cx, cy, side, 31, [-49,-35,-21,-7,7,21,35,49], ['A','B','C','D','E','F','G','COM'])}
  <text x="${cx}" y="${cy-60}" text-anchor="middle" class="cv-lbl">7-Segment</text>
</g>`;
      }
    },

    // ── 28BYJ-48 + ULN2003 ─────────────────────────────
    // Wokwi風: モーター軸オフセット・ULN2003基板に4ピンLED表示
    // スタブ6本: VCC(dy=-30)/IN1-IN4(dy=-18〜18,12px間隔)/GND(dy=30)
    STEPPER: {
      pins: {
        VCC: { dx: -76, dy: -30 },
        IN1: { dx: -76, dy: -18 }, IN2: { dx: -76, dy: -6 },
        IN3: { dx: -76, dy:   6 }, IN4: { dx: -76, dy: 18 },
        GND: { dx: -76, dy:  30 },
      },
      draw(cx, cy, side = 'right') {
        const mdir = side === 'right' ? 1 : -1;
        // 基板(ULN2003)は常にPico側、モーター(28BYJ-48)は常に外側
        // bx: 基板左端 (side=right→cx-68, side=left→cx+8)
        const bx = cx - mdir * 38 - 30, by = cy - 34;
        const mcx = cx + mdir * 52, mcy = cy, mR = 26;
        // ワイヤー始点: 基板のモーター側端コネクタ
        const wireStartX = mdir > 0 ? bx + 62 : bx;
        const wireEndX   = mcx - mdir * mR;
        // 5本ワイヤー (28BYJ-48標準色)
        const wireColors = ['#e91e63', '#f44336', '#ff9800', '#ffeb3b', '#2196f3'];
        const wires = wireColors.map((c, i) => {
          const wy = cy + (i - 2) * 5;
          return `<line x1="${wireStartX}" y1="${wy}" x2="${wireEndX}" y2="${wy}" stroke="${c}" stroke-width="1.5" opacity="0.9"/>`;
        }).join('\n  ');
        // モーターコネクタ: 基板のモーター側端
        const connX = mdir > 0 ? bx + 52 : bx;
        const slotX = mdir > 0 ? bx + 53 : bx + 1;
        // シャフトはPico側にオフセット
        const shaftOffX = mcx - mdir * 5;
        // IN LED / 電源LEDはPico側端に配置
        const ledX = mdir > 0 ? bx + 10 : bx + 50;
        return `<g filter="url(#fDrop)">
  <!-- ULN2003 基板 (60×68) -->
  <rect x="${bx}" y="${by}" width="60" height="68" fill="#1a4484" stroke="#0d2a6e" stroke-width="1.5" rx="3"/>
  <circle cx="${bx + 5}"  cy="${by + 5}"  r="2" fill="#122e5e" stroke="#0a1e40" stroke-width="0.4"/>
  <circle cx="${bx + 55}" cy="${by + 5}"  r="2" fill="#122e5e" stroke="#0a1e40" stroke-width="0.4"/>
  <circle cx="${bx + 5}"  cy="${by + 63}" r="2" fill="#122e5e" stroke="#0a1e40" stroke-width="0.4"/>
  <circle cx="${bx + 55}" cy="${by + 63}" r="2" fill="#122e5e" stroke="#0a1e40" stroke-width="0.4"/>
  <!-- ULN2003A IC -->
  <rect x="${bx + 20}" y="${cy - 8}" width="28" height="16" fill="#111" stroke="#2a2a2a" stroke-width="0.5" rx="1"/>
  <text x="${bx + 34}" y="${cy + 3}" text-anchor="middle" font-size="5" fill="#bbb" font-weight="bold">ULN2003A</text>
  <!-- IN1〜IN4 LED (Pico側端) -->
  ${[-18, -6, 6, 18].map((dy, i) => `<circle cx="${ledX}" cy="${cy + dy}" r="3" fill="#c62828" stroke="#b71c1c" stroke-width="0.5"/>
  <circle cx="${ledX}" cy="${cy + dy}" r="1.3" fill="#ff8a80" opacity="0.8"/>
  <text x="${ledX}" y="${cy + dy + 8}" text-anchor="middle" font-size="4" fill="#90caf9">IN${i + 1}</text>`).join('\n  ')}
  <!-- 電源LED (緑, Pico側端) -->
  <circle cx="${ledX}" cy="${by + 60}" r="3" fill="#1b5e20" stroke="#00c853" stroke-width="0.5"/>
  <circle cx="${ledX}" cy="${by + 60}" r="1.3" fill="#69f0ae" opacity="0.8"/>
  <!-- 5ピンモーターコネクタ -->
  <rect x="${connX}" y="${cy - 12}" width="9" height="24" fill="#1565C0" stroke="#0d47a1" stroke-width="0.6" rx="1"/>
  ${[-8, -4, 0, 4, 8].map(dy => `<rect x="${slotX}" y="${cy + dy - 2}" width="5" height="4" fill="#555" rx="0.5"/>`).join('')}

  <!-- 5本ワイヤー (基板→モーター) -->
  ${wires}

  <!-- 28BYJ-48 モーター本体 -->
  <circle cx="${mcx}" cy="${mcy}" r="${mR}" fill="url(#gMotorBlue)" stroke="#0d47a1" stroke-width="1.5"/>
  <circle cx="${mcx}" cy="${mcy}" r="${mR - 5}" fill="none" stroke="#1565c0" stroke-width="0.7" stroke-dasharray="3 2"/>
  <text x="${mcx}" y="${mcy - 7}" text-anchor="middle" font-size="5" fill="#e3f2fd" font-weight="bold">28BYJ-48</text>
  <!-- D字出力シャフト (Pico側オフセット) -->
  <circle cx="${shaftOffX}" cy="${mcy + 5}" r="5.5" fill="#b0bec5" stroke="#78909c" stroke-width="0.8"/>
  <circle cx="${shaftOffX}" cy="${mcy + 5}" r="2.5" fill="#78909c"/>
  <line x1="${shaftOffX - 5}" y1="${mcy + 5}" x2="${shaftOffX + 5}" y2="${mcy + 5}" stroke="#546e7a" stroke-width="1"/>
  <!-- 取付タブ (左右) -->
  <rect x="${mcx + mR - 2}" y="${mcy - 5}" width="9" height="10" fill="#0a3070" stroke="#0d47a1" stroke-width="0.6" rx="2"/>
  <circle cx="${mcx + mR + 2}" cy="${mcy}" r="2.2" fill="#122e5e"/>
  <rect x="${mcx - mR - 7}" y="${mcy - 5}" width="9" height="10" fill="#0a3070" stroke="#0d47a1" stroke-width="0.6" rx="2"/>
  <circle cx="${mcx - mR - 3}" cy="${mcy}" r="2.2" fill="#122e5e"/>

  ${sideStubs(cx, cy, side, 68, [-30, -18, -6, 6, 18, 30], ['VCC', 'IN1', 'IN2', 'IN3', 'IN4', 'GND'])}
  <text x="${cx}" y="${cy + 50}" text-anchor="middle" class="cv-lbl">Stepper (28BYJ-48 + ULN2003)</text>
</g>`;
      }
    },

    // ── L293D DCモータードライバー (DIP-16 IC) + DCモーター ────────────────────────
    // 正確なピンアサイン: 左側(pin1-8): EN1,IN1,OUT1,GND,GND,OUT2,IN2,VS
    //                     右側(pin16): VSS (ロジック電源=VBUS)
    // OUT1(pin3)/OUT2(pin6)はIN1/IN2と同じ左側(Pico面)にあるが、
    // 視認性のためモーター側スタブとして表示し、IC内ピン番号で明示する
    L293D: {
      pins: {
        EN:  { dx: -30, dy: -35 }, // pin1: 左上
        IN1: { dx: -30, dy: -25 }, // pin2
        GND: { dx: -30, dy:  -5 }, // pin4
        IN2: { dx: -30, dy:  25 }, // pin7
        VS:  { dx: -30, dy:  35 }, // pin8: 外部電源(vext)
        VSS: { dx:  30, dy: -35 }, // pin16: 右上(VBUS)
      },
      draw(cx, cy, side = 'right') {
        const bw = 22, bh = 40;
        const mdir = side === 'right' ? 1 : -1;
        const mx  = cx + mdir * (bw + 62);
        const mR  = 22;
        const motorEdge = mx - mdir * mR;
        // OUT1/OUT2: モーター側スタブ (pin3=dy-15, pin6=dy+15)
        const outEdge = cx + mdir * bw;
        const outPad  = outEdge + mdir * 8;
        const out1y = cy - 15, out2y = cy + 15;
        const outLblAnchor = mdir > 0 ? 'start' : 'end';
        const outLblX = outPad + mdir * 4;
        // VSS stub (motor side, pin16 top)
        const vssY = cy - 35;
        // DIP nubs
        const leftNubs = Array.from({ length: 8 }, (_, i) => {
          const py = cy - 35 + i * 10;
          return `<rect x="${cx - bw - 5}" y="${py - 2}" width="5" height="4" fill="#bdbdbd" stroke="#888" stroke-width="0.3" rx="0.5"/>`;
        }).join('\n  ');
        const rightNubs = Array.from({ length: 8 }, (_, i) => {
          const py = cy - 35 + i * 10;
          return `<rect x="${cx + bw}" y="${py - 2}" width="5" height="4" fill="#bdbdbd" stroke="#888" stroke-width="0.3" rx="0.5"/>`;
        }).join('\n  ');
        const shaftX = mdir > 0 ? mx + mR : mx - mR - 12;

        return `<g filter="url(#fDrop)">
  <!-- L293D DIP-16 IC ボディ -->
  <rect x="${cx - bw}" y="${cy - bh}" width="${bw * 2}" height="${bh * 2}" fill="#1a1a1a" stroke="#444" stroke-width="1.5" rx="2"/>
  <path d="M${cx - 7},${cy - bh} a7,7 0 0,0 14,0" fill="#2a2a2a"/>
  <circle cx="${cx - bw + 6}" cy="${cy - bh + 8}" r="2.5" fill="#555"/>
  ${leftNubs}
  ${rightNubs}
  <!-- ICピン番号 (左側: 実物理ピン位置) -->
  <text x="${cx - bw + 3}" y="${cy - 31}" font-size="4" fill="#666" font-family="sans-serif">1:EN1</text>
  <text x="${cx - bw + 3}" y="${cy - 21}" font-size="4" fill="#666" font-family="sans-serif">2:IN1</text>
  <text x="${cx - bw + 3}" y="${cy - 11}" font-size="4" fill="#e57373" font-family="sans-serif">3:OUT1</text>
  <text x="${cx - bw + 3}" y="${cy - 1}"  font-size="4" fill="#666" font-family="sans-serif">4:GND</text>
  <text x="${cx - bw + 3}" y="${cy + 9}"  font-size="4" fill="#666" font-family="sans-serif">5:GND</text>
  <text x="${cx - bw + 3}" y="${cy + 19}" font-size="4" fill="#64b5f6" font-family="sans-serif">6:OUT2</text>
  <text x="${cx - bw + 3}" y="${cy + 29}" font-size="4" fill="#666" font-family="sans-serif">7:IN2</text>
  <text x="${cx - bw + 3}" y="${cy + 39}" font-size="4" fill="#ffb74d" font-family="sans-serif">8:VS</text>
  <!-- ICラベル -->
  <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="8" fill="#ccc" font-weight="bold" font-family="sans-serif">L293D</text>
  <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="5.5" fill="#777" font-family="sans-serif">H-Bridge</text>

  <!-- Pico側スタブ: EN1(1)/IN1(2)/GND(4)/IN2(7)/VS(8) -->
  ${sideStubs(cx, cy, side, bw, [-35, -25, -5, 25, 35], ['EN1', 'IN1', 'GND', 'IN2', 'VS'])}

  <!-- VSS stub (pin16, モーター側上端 → VBUS wrap wire) -->
  <line x1="${outEdge}" y1="${vssY}" x2="${outPad}" y2="${vssY}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${outPad}" cy="${vssY}" r="3" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${outLblX}" y="${vssY + 4}" text-anchor="${outLblAnchor}" font-size="11" fill="#b0bec5" font-family="sans-serif">VSS</text>

  <!-- OUT1 stub (pin3=dy-15, モーター側) -->
  <line x1="${outEdge}" y1="${out1y}" x2="${outPad}" y2="${out1y}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${outPad}" cy="${out1y}" r="2.5" fill="#e53935" stroke="#b71c1c" stroke-width="0.5"/>
  <text x="${outLblX}" y="${out1y + 4}" text-anchor="${outLblAnchor}" font-size="9" fill="#ef9a9a" font-family="sans-serif">OUT1</text>

  <!-- OUT2 stub (pin6=dy+15, モーター側) -->
  <line x1="${outEdge}" y1="${out2y}" x2="${outPad}" y2="${out2y}" stroke="#888" stroke-width="1.5"/>
  <circle cx="${outPad}" cy="${out2y}" r="2.5" fill="#1e88e5" stroke="#0d47a1" stroke-width="0.5"/>
  <text x="${outLblX}" y="${out2y + 4}" text-anchor="${outLblAnchor}" font-size="9" fill="#90caf9" font-family="sans-serif">OUT2</text>

  <!-- OUT1/OUT2 → DCモーター接続ワイヤー -->
  <line x1="${outPad}" y1="${out1y}" x2="${motorEdge}" y2="${out1y}" stroke="#e53935" stroke-width="1.5" opacity="0.9"/>
  <line x1="${outPad}" y1="${out2y}" x2="${motorEdge}" y2="${out2y}" stroke="#1e88e5" stroke-width="1.5" opacity="0.9"/>

  <!-- DCモーター本体 -->
  <circle cx="${mx}" cy="${cy}" r="${mR}" fill="url(#gMotorBlue)" stroke="#0d47a1" stroke-width="1.5"/>
  <circle cx="${mx}" cy="${cy}" r="${mR - 6}" fill="none" stroke="#1565c0" stroke-width="0.7" stroke-dasharray="3 2"/>
  <text x="${mx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="#e3f2fd" font-weight="bold" font-family="sans-serif">M</text>
  <circle cx="${motorEdge}" cy="${out1y}" r="2.5" fill="#e53935" stroke="#b71c1c" stroke-width="0.5"/>
  <circle cx="${motorEdge}" cy="${out2y}" r="2.5" fill="#1e88e5" stroke="#0d47a1" stroke-width="0.5"/>
  <rect x="${shaftX}" y="${cy - 3}" width="12" height="6" fill="#b0bec5" stroke="#78909c" stroke-width="0.6" rx="1.5"/>

  <text x="${cx}" y="${cy + bh + 14}" text-anchor="middle" class="cv-lbl">L293D + DC Motor</text>
</g>`;
      }
    },
    // ── 外部電源 (回路図電池記号) ─────────────────────────────────────────────
    // SERVO/L293D等の外部電源(vext)が必要な場合に自動追加される
    // GND端子のみPico GNDと接続。V+端子は各コンポーネントの"Vext"スタブと接続する
    EXTPWR: {
      pins: { GND: { dx: 0, dy: 30 } },
      draw(cx, cy) {
        return `<g>
  <!-- V+ 端子線 -->
  <line x1="${cx}" y1="${cy - 30}" x2="${cx}" y2="${cy - 20}" stroke="#ff8f00" stroke-width="2"/>
  <text x="${cx + 4}" y="${cy - 21}" font-size="10" fill="#ff8f00" font-weight="bold" font-family="sans-serif">+</text>
  <!-- 電池セル1: 長線(正極) -->
  <line x1="${cx - 14}" y1="${cy - 20}" x2="${cx + 14}" y2="${cy - 20}" stroke="#333" stroke-width="2.5"/>
  <!-- 電池セル1: 短線(負極) -->
  <line x1="${cx - 8}"  y1="${cy - 12}" x2="${cx + 8}"  y2="${cy - 12}" stroke="#333" stroke-width="4"/>
  <!-- セル間接続 -->
  <line x1="${cx}" y1="${cy - 12}" x2="${cx}" y2="${cy - 4}" stroke="#555" stroke-width="1.5"/>
  <!-- 電池セル2: 長線 -->
  <line x1="${cx - 14}" y1="${cy - 4}"  x2="${cx + 14}" y2="${cy - 4}"  stroke="#333" stroke-width="2.5"/>
  <!-- 電池セル2: 短線 -->
  <line x1="${cx - 8}"  y1="${cy + 4}"  x2="${cx + 8}"  y2="${cy + 4}"  stroke="#333" stroke-width="4"/>
  <!-- GND 端子線 -->
  <line x1="${cx}" y1="${cy + 4}" x2="${cx}" y2="${cy + 22}" stroke="#546e7a" stroke-width="2"/>
  <text x="${cx + 4}" y="${cy + 20}" font-size="10" fill="#546e7a" font-weight="bold" font-family="sans-serif">−</text>
  <!-- GND ピン (配線接続点 → Pico GND) -->
  <line x1="${cx}" y1="${cy + 22}" x2="${cx}" y2="${cy + 30}" stroke="#546e7a" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy + 30}" r="3" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5"/>
  <text x="${cx}" y="${cy + 44}" text-anchor="middle" class="cv-lbl">Ext. Power</text>
</g>`;
      }
    },
  };

  // GP25など接続先のないピン番号セット
  const INTERNAL_PINS = new Set([23, 24, 25, 29]);

  // ===== ブロック解析 =====
  function parseBlocks(workspace) {
    const comps = [], seen = new Set();
    let onboardLedOn = false;   // GP25 オンボードLED点灯フラグ
    const badPins = [];          // 接続不可ピン情報

    function add(key, type, pins) {
      if (seen.has(key)) return;
      seen.add(key);
      comps.push({ compId: key, type, pins });
    }

    workspace.getAllBlocks(false)
      .filter(b => !b.isInsertionMarker())
      .forEach(b => {
        const t = b.type, gf = n => b.getFieldValue(n);

        if (['pico_led_on','pico_led_off','pico_digital_write','pico_pwm_write'].includes(t)) {
          const p = gf('PIN');
          if (parseInt(p) === 25) {
            // GP25はオンボードLED — 外部配線なし、Pico上のLEDを光らせる
            onboardLedOn = true;
          } else if (INTERNAL_PINS.has(parseInt(p))) {
            badPins.push({ gp: p, reason: 'GP'+p+'は内部専用ピンです' });
          } else {
            add('led'+p, 'LED', { A:{gp:p}, C:{gnd:true} });
          }

        } else if (['pico_digital_read','pico_digital_read_val'].includes(t)) {
          const p = gf('PIN');
          add('btn'+p, 'BTN', { SIG:{gp:p}, VCC:{v3v3:true} });

        } else if (['pico_analog_read','pico_analog_read_val'].includes(t)) {
          const p = gf('PIN');
          add('pot'+p, 'POT', { SIG:{gp:p}, VCC:{v3v3:true}, GND:{gnd:true} });

        } else if (['pico_buzzer_tone','pico_buzzer_stop'].includes(t)) {
          const p = gf('PIN');
          add('buzz'+p, 'BUZZ', { SIG:{gp:p}, GND:{gnd:true} });

        } else if (t === 'pico_servo_angle') {
          const p = gf('PIN');
          add('servo'+p, 'SERVO', { PWM:{gp:p}, VCC:{vext:true}, GND:{gnd:true} });

        } else if (['pico_ultrasonic_cm','pico_ultrasonic_cm_val'].includes(t)) {
          const trig = gf('TRIG'), echo = gf('ECHO');
          add('hcsr04_'+trig+'_'+echo, 'HCSR04',
            { VCC:{v3v3:true}, TRIG:{gp:trig}, ECHO:{gp:echo}, GND:{gnd:true} });

        } else if (t === 'pico_dht_read') {
          const p = gf('PIN');
          add('dht'+p, 'DHT22', { VCC:{v3v3:true}, SIG:{gp:p}, GND:{gnd:true} });

        } else if (t === 'pico_lcd_init') {
          const sda = gf('SDA'), scl = gf('SCL');
          add('lcd_'+sda+'_'+scl, 'LCD',
            { GND:{gnd:true}, VCC:{v3v3:true}, SDA:{gp:sda}, SCL:{gp:scl} });

        } else if (t === 'pico_7seg_show') {
          const pins = { COM:{gnd:true} };
          ['A','B','C','D','E','F','G'].forEach(s => {
            const p = gf('PIN_' + s);
            if (p) pins[s] = { gp: p };
          });
          add('seg7', 'SEG7', pins);

        } else if (['pico_dcmotor_run','pico_dcmotor_stop'].includes(t)) {
          const in1=gf('IN1'), in2=gf('IN2'), en=b.getFieldValue('EN');
          add('l293d_'+in1+'_'+in2, 'L293D',
            { VSS:{vbus:true}, EN:en?{gp:en}:null, IN1:{gp:in1}, IN2:{gp:in2}, GND:{gnd:true}, VS:{vext:true} });

        } else if (['pico_stepper_step','pico_stepper_angle'].includes(t)) {
          const in1=gf('IN1'), in2=gf('IN2'), in3=gf('IN3'), in4=gf('IN4');
          add('step_'+[in1,in2,in3,in4].join('_'), 'STEPPER',
            { VCC:{vbus:true}, IN1:{gp:in1}, IN2:{gp:in2}, IN3:{gp:in3}, IN4:{gp:in4}, GND:{gnd:true} });
        }
      });

    // vextピンを持つコンポーネントが存在する場合、外部電源コンポーネントを自動追加
    const hasVext = comps.some(c => Object.values(c.pins).some(s => s && s.vext));
    if (hasVext) {
      add('extpwr', 'EXTPWR', { GND: {gnd:true} });
    }

    return { comps, onboardLedOn, badPins };
  }

  // ===== 部品配置サイド判定 =====
  // 「ラップ配線(Picoの反対側のピンへ到達するために上/下を回る線)」の本数で比較し、
  // 少ない側に配置する。タイなら VCC があれば right(3V3 は右側のみ)、なければ left。
  function compSide(comp) {
    let leftGp = 0, rightGp = 0, hasVcc = false;
    for (const spec of Object.values(comp.pins)) {
      if (!spec) continue;
      if (spec.gp != null) {
        const gp = parseInt(spec.gp);
        if (L_PINS.includes('GP' + gp)) leftGp++;
        else rightGp++;
      }
      if (spec.v3v3 || spec.vbus) hasVcc = true;
    }
    const wrapsIfLeft  = rightGp + (hasVcc ? 1 : 0);  // 右Picoピン→左部品の数
    const wrapsIfRight = leftGp;                       // 左Picoピン→右部品の数
    if (wrapsIfLeft < wrapsIfRight) return 'left';
    if (wrapsIfRight < wrapsIfLeft) return 'right';
    return hasVcc ? 'right' : (leftGp > 0 ? 'left' : 'right');
  }

  // ===== レイアウト =====
  // 主要GPピンの理想cyを返す: 対応Picoピンのyにそのピンのdyをオフセットしたもの。
  // Picoに「近い側」のGPピンを優先 (左サイド部品=最大dx, 右サイド部品=最小dx)。
  function idealCyOf(comp) {
    const sym = SYM[comp.type];
    if (!sym) return PY + 100;
    let best = null;
    for (const [pname, spec] of Object.entries(comp.pins)) {
      if (!spec || spec.gp == null || !sym.pins[pname]) continue;
      const pc = gpCoord(spec.gp);
      if (!pc) continue;
      const sp = sym.pins[pname];
      const score = comp.compSide === 'left' ? (sp.dx || 0) : -(sp.dx || 0);
      if (!best || score > best.score) {
        best = { score, ideal: pc.y - (sp.dy || 0) };
      }
    }
    if (!best) return PY + 100;
    return Math.max(PY + 30, best.ideal);
  }

  function layoutComps(comps) {
    comps.forEach(c => { c.compSide = compSide(c); });
    const leftComps  = comps.filter(c => c.compSide === 'left');
    const rightComps = comps.filter(c => c.compSide === 'right');

    // 各サイドのワイヤー数 → ルーティング幅を動的決定
    const countWires = list => list.reduce((sum, c) =>
      sum + Object.values(c.pins).filter(Boolean).length, 0);
    const lWires = countWires(leftComps);
    const rWires = countWires(rightComps);
    const routingL = Math.max(110, CH_STEP * (lWires + 1) + 20);
    const routingR = Math.max(110, CH_STEP * (rWires + 1) + 20);

    // 各部品を主要GPピンのy揃え → 既存列に最小プッシュで収まればそこに、
    // どの列でもCOMP_MAX_PUSH以上ずれる場合のみ新列を作る ベストフィット型パッキング
    function packCols(list) {
      if (list.length === 0) return 0;
      list.forEach(c => { c.idealCy = idealCyOf(c); });
      list.sort((a, b) => a.idealCy - b.idealCy);
      const lastInCol = [];
      list.forEach(c => {
        let bestCol = -1, bestPush = Infinity, bestCy = 0;
        for (let i = 0; i < lastInCol.length; i++) {
          const minCy = Math.max(c.idealCy, lastInCol[i] + COMP_MIN_GAP);
          const push = minCy - c.idealCy;
          if (push < bestPush) { bestPush = push; bestCol = i; bestCy = minCy; }
        }
        if (bestCol < 0 || bestPush > COMP_MAX_PUSH) {
          bestCol = lastInCol.length;
          bestCy = c.idealCy;
          lastInCol.push(0);
        }
        c.col = bestCol;
        c.cy  = bestCy;
        lastInCol[bestCol] = bestCy;
      });
      return lastInCol.length;
    }

    const lCols = packCols(leftComps);
    const rCols = packCols(rightComps);

    PX = lCols > 0 ? C_L_MARGIN + lCols * C_CW + routingL : 80;

    leftComps.forEach(c => {
      c.cx = PX - routingL - (lCols - 1 - c.col) * C_CW - C_CW / 2;
    });
    rightComps.forEach(c => {
      c.cx = PX + PW + routingR + c.col * C_CW + C_CW / 2;
    });

    return { lCols, rCols, leftCount: leftComps.length, rightCount: rightComps.length, routingL, routingR };
  }

  // ===== ワイヤー描画ヘルパー (HVH 直角ルート) =====
  // 同高さは直線、Picoピンと部品ピンが垂直に重なるならL字、それ以外はHVH。
  function wirePath(x1, y1, ch, x2, y2) {
    if (Math.abs(y1 - y2) <= 1) return `M${x1},${y1} H${x2}`;
    if (Math.abs(x1 - ch) <= 1) return `M${x1},${y1} V${y2} H${x2}`;
    return `M${x1},${y1} H${ch} V${y2} H${x2}`;
  }

  // 区間グラフの貪欲彩色でチャンネルを割り当てる。
  // 同一 Pico ピン (x1,y1) から出るワイヤーはトランクとして同じチャンネルを共有し、
  // y範囲が重ならない別グループは同じチャンネルを再利用して縦の密集を解消する。
  function assignChannels(list) {
    if (list.length === 0) return;
    const GAP = 6;
    // ── ピン単位にグループ化 ──
    const groupMap = new Map();
    list.forEach(w => {
      const key = `${w.x1}:${w.y1}`;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(w);
    });
    const groups = [];
    groupMap.forEach(wires => {
      let lo = Infinity, hi = -Infinity;
      wires.forEach(w => {
        lo = Math.min(lo, w.y1, w.y2);
        hi = Math.max(hi, w.y1, w.y2);
      });
      // トランク内で部品側に最も近い x2 を chBaseX として保存
      // (channel をPicoから遠い側、部品手前に置くため)
      const side = wires[0].side;
      const chBaseX = side === 'right'
        ? Math.min(...wires.map(w => w.x2))
        : Math.max(...wires.map(w => w.x2));
      wires.forEach(w => { w.chBaseX = chBaseX; });
      groups.push({ wires, lo, hi });
    });
    // ── グループ単位で貪欲彩色 ──
    groups.sort((a, b) => a.lo - b.lo);
    const channelEnds = [];
    groups.forEach(g => {
      let c = channelEnds.findIndex(end => end + GAP <= g.lo);
      if (c === -1) c = channelEnds.length;
      channelEnds[c] = g.hi;
      g.wires.forEach(w => { w.channelIdx = c + 1; });
    });
  }

  const SIGNAL_COLORS = [
    '#43a047','#1e88e5','#f9a825','#ab47bc',
    '#00acc1','#fb8c00','#26a69a','#ec407a',
    '#7cb342','#8d6e63'
  ];
  function wireColor(s) {
    if (s.gnd)  return '#546e7a';
    if (s.v3v3) return '#e53935';
    if (s.vbus) return '#ff7043';  // VBUS 5V: ディープオレンジ
    return SIGNAL_COLORS[parseInt(s.gp || 0) % SIGNAL_COLORS.length];
  }

  // ===== Pico SVG (Wokwi Pi Pico ボード, MIT © wokwi-boards) =====
  function buildPicoSVG(onboardLedOn) {
    const p = [];
    // ピンパッド (基板外, 銅色)
    for (let i = 0; i < PC; i++) {
      const py = PY + 12 + i * PP;
      p.push(`<rect x="${PX-9}" y="${py-3.5}" width="9" height="7" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5" rx="1"/>`);
      p.push(`<rect x="${PX+PW}"  y="${py-3.5}" width="9" height="7" fill="#c8a86e" stroke="#8a7040" stroke-width="0.5" rx="1"/>`);
    }
    // 基板本体 (Wokwi Pi Pico #006837)
    p.push(`<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" fill="#006837" stroke="#004e29" stroke-width="2.5" rx="3"/>`);
    p.push(`<rect x="${PX+3}" y="${PY+3}" width="${PW-6}" height="${PH-6}" fill="none" stroke="#00522e" stroke-width="0.6" rx="2"/>`);
    // マウントホール (4隅)
    [[PX+10, PY+10],[PX+PW-10, PY+10],[PX+10, PY+PH-10],[PX+PW-10, PY+PH-10]].forEach(([hx,hy]) => {
      p.push(`<circle cx="${hx}" cy="${hy}" r="5.5" fill="#004e29"/>`);
      p.push(`<circle cx="${hx}" cy="${hy}" r="3.5" fill="#ffd54f" stroke="#b8860b" stroke-width="0.5"/>`);
    });
    // USB Micro-B コネクタ (上端中央)
    const uC = PX + PW/2;
    p.push(`<rect x="${uC-11}" y="${PY-15}" width="22" height="17" fill="#c6c6c6" stroke="#aaa" stroke-width="0.5" rx="2"/>`);
    p.push(`<rect x="${uC-8}"  y="${PY-13}" width="16" height="14" fill="#363a44" rx="1.5"/>`);
    p.push(`<text x="${uC}" y="${PY+4}" text-anchor="middle" font-size="6.5" fill="#a5d6a7" font-family="sans-serif">USB</text>`);
    // BOOTSEL ボタン (上部左側)
    const bX = PX + 15, bY = PY + 44;
    p.push(`<rect x="${bX-9}" y="${bY-7}" width="18" height="13" fill="#b0bec5" stroke="#78909c" stroke-width="0.5" rx="2"/>`);
    p.push(`<ellipse cx="${bX}" cy="${bY}" rx="5.5" ry="4" fill="#e8e8e8" stroke="#bbb" stroke-width="0.5"/>`);
    p.push(`<text x="${bX}" y="${bY+14}" text-anchor="middle" font-size="5.5" fill="#4caf50" font-family="sans-serif">BOOT</text>`);
    // GP25 オンボードLED (点灯時はグロー効果 + GP25:ON ラベル)
    const ledX = PX + PW - 12, ledY = PY + 22;
    if (onboardLedOn) {
      p.push(`<circle cx="${ledX}" cy="${ledY}" r="8"  fill="#90ff00" opacity="0.25"/>`);
      p.push(`<circle cx="${ledX}" cy="${ledY}" r="5.5" fill="#c8ff50" opacity="0.55"/>`);
      p.push(`<circle cx="${ledX}" cy="${ledY}" r="3.5" fill="#f0ff80" stroke="#90ff00" stroke-width="1"/>`);
      p.push(`<text x="${ledX}" y="${ledY-10}" text-anchor="middle" font-size="5.5" fill="#c8ff50" font-family="sans-serif" font-weight="bold">GP25:ON</text>`);
    } else {
      p.push(`<circle cx="${ledX}" cy="${ledY}" r="3.5" fill="#90ff00" stroke="#55cc00" stroke-width="0.5" opacity="0.5"/>`);
    }
    p.push(`<text x="${ledX}" y="${ledY+12}" text-anchor="middle" font-size="5.5" fill="#4caf50" font-family="sans-serif">LED</text>`);
    // RP2040 チップ (中央・正方形)
    const chipSz = 60;
    const chipX = PX + (PW - chipSz) / 2, chipY = PY + PH/2 - chipSz/2;
    p.push(`<rect x="${chipX}" y="${chipY}" width="${chipSz}" height="${chipSz}" fill="#30312e" stroke="#3a3a38" stroke-width="0.5" rx="2"/>`);
    for (let i = 0; i < 4; i++) {
      p.push(`<rect x="${chipX-5}" y="${chipY+6+i*12}" width="5" height="5.5" fill="#4a4a4a" rx="0.5"/>`);
      p.push(`<rect x="${chipX+chipSz}" y="${chipY+6+i*12}" width="5" height="5.5" fill="#4a4a4a" rx="0.5"/>`);
    }
    p.push(`<text x="${PX+PW/2}" y="${chipY+26}" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">RP2040</text>`);
    p.push(`<text x="${PX+PW/2}" y="${chipY+39}" text-anchor="middle" font-size="6.5" fill="#444" font-family="sans-serif">Raspberry Pi</text>`);
    // Pico ラベル (下端)
    p.push(`<text x="${PX+PW/2}" y="${PY+PH-14}" text-anchor="middle" font-size="13" fill="#4caf50" font-weight="bold" font-family="sans-serif">Pico</text>`);
    p.push(`<text x="${PX+PW/2}" y="${PY+PH-3}"  text-anchor="middle" font-size="7"  fill="#33865f" font-family="sans-serif">RP2040</text>`);

    // 左ピンラベル・接続点 (基板外側・配線越しに読めるよう背景ノックアウト付き)
    L_PINS.forEach((name, i) => {
      const py = PY + 12 + i * PP;
      const isGnd = name === 'GND';
      const col = isGnd ? '#78909c' : '#FFD54F';
      p.push(`<circle cx="${PX}" cy="${py}" r="3" fill="${col}" stroke="#222" stroke-width="0.5"/>`);
      const lblW = name.length * 7 + 4;
      p.push(`<rect x="${PX-14-lblW}" y="${py-7}" width="${lblW}" height="14" fill="#0d1117" opacity="0.85" rx="2"/>`);
      p.push(`<text x="${PX-14}" y="${py+4}" text-anchor="end" font-size="11" fill="#cfd8dc" font-family="sans-serif" font-weight="bold">${name}</text>`);
    });
    // 右ピンラベル・接続点
    R_PINS.forEach((name, i) => {
      const py = PY + 12 + i * PP;
      const rx = PX + PW;
      const isGnd = name === 'GND' || name === 'AGND';
      const isPwr = ['3V3','VSYS','VBUS'].includes(name);
      const col = isGnd ? '#78909c' : isPwr ? '#e57373' : '#FFD54F';
      p.push(`<circle cx="${rx}" cy="${py}" r="3" fill="${col}" stroke="#222" stroke-width="0.5"/>`);
      const lblW = name.length * 7 + 4;
      p.push(`<rect x="${rx+14}" y="${py-7}" width="${lblW}" height="14" fill="#0d1117" opacity="0.85" rx="2"/>`);
      p.push(`<text x="${rx+14+4}" y="${py+4}" text-anchor="start" font-size="11" fill="#cfd8dc" font-family="sans-serif" font-weight="bold">${name}</text>`);
    });

    return p.join('\n');
  }

  // ===== メイン =====
  // options.overrides: { [compId]: { dx, dy } } 自動配置からの差分でユーザ手動配置を反映
  // 特殊 compId '__pico__' は Pico 本体の移動オフセット (PX, PY に加算)
  // options.wireOverrides: { [wireId]: { chDx } } 配線の縦セグメントを左右にずらす差分 (chDx 単位はSVG座標)
  window.generateCircuitSVG = function(workspace, options) {
    const overrides = (options && options.overrides) || {};
    const wireOverrides = (options && options.wireOverrides) || {};
    // PY は呼び出しごとにリセット (前回の picoOv.dy が累積しないように)
    PY = 30;
    const { comps, onboardLedOn, badPins } = parseBlocks(workspace);
    const { rCols, routingR, lCols, routingL } = layoutComps(comps);
    // layoutComps内でPXが更新されるため、以降はPXの最新値を使用

    // ユーザ手動位置を自動配置に重ねる (配線も新しい位置で再ルーティング)
    comps.forEach(c => {
      const ov = overrides[c.compId];
      if (ov) {
        c.cx += ov.dx || 0;
        c.cy += ov.dy || 0;
      }
    });

    // Pico 本体のドラッグオフセット (gpCoord 等が参照する PX/PY を直接ずらす)
    const picoOv = overrides['__pico__'] || { dx: 0, dy: 0 };
    PX += picoOv.dx || 0;
    PY += picoOv.dy || 0;

    // ── 境界ボックス計算（手動ドラッグで領域が自動拡張される）──
    // 基準: 自動配置の右端・下端。overrides後のコンポーネント位置が超えた場合はそちらを優先。
    const BOUND_PAD = 60;
    let bMinX = (lCols > 0 ? C_L_MARGIN : PX) - BOUND_PAD;
    let bMinY = PY - BOUND_PAD;
    let bMaxX = PX + PW + routingR + Math.max(rCols, 1) * C_CW + 30;
    let bMaxY = PY + PH + BOUND_PAD;

    comps.forEach(c => {
      bMinX = Math.min(bMinX, c.cx - 210);
      bMinY = Math.min(bMinY, c.cy - 100);
      bMaxX = Math.max(bMaxX, c.cx + 210);
      bMaxY = Math.max(bMaxY, c.cy + 110);
    });

    const vx = bMinX;
    const vy = bMinY;
    const svgW = Math.max(bMaxX - vx, 400);
    const svgH = Math.max(bMaxY - vy, 300);

    let wireCount = 0;
    const els = [];

    // 背景
    els.push(`<rect x="${vx}" y="${vy}" width="${svgW}" height="${svgH}" fill="#0d1117"/>`);
    // グリッド (40px)
    for (let gx = Math.floor(vx / 40) * 40; gx < vx + svgW; gx += 40)
      els.push(`<line x1="${gx}" y1="${vy}" x2="${gx}" y2="${vy + svgH}" stroke="#161b22" stroke-width="1"/>`);
    for (let gy = Math.floor(vy / 40) * 40; gy < vy + svgH; gy += 40)
      els.push(`<line x1="${vx}" y1="${gy}" x2="${vx + svgW}" y2="${gy}" stroke="#161b22" stroke-width="1"/>`);

    const unknownGPins = [];

    // ── Pass 1: ワイヤー収集 (Picoピン側 → 部品ピン側) ──
    const wires = [];
    comps.forEach(comp => {
      const sym = SYM[comp.type];
      if (!sym) return;
      Object.entries(comp.pins).forEach(([pname, spec]) => {
        if (!spec) return;
        const sp = sym.pins[pname];
        if (!sp) return;
        // 左側配置部品はdxを反転して右側出しにする
        const sideFlip = comp.compSide === 'left' ? -1 : 1;
        const cpX = comp.cx + sp.dx * sideFlip, cpY = comp.cy + sp.dy;
        const pc = picoCoordOf(spec, cpX, cpY, comp.compSide);
        if (!pc) {
          if (spec.gp != null) unknownGPins.push({ gp: spec.gp, cx: comp.cx, cy: comp.cy });
          return;
        }
        wires.push({
          x1: pc.x, y1: pc.y, side: pc.side,
          x2: cpX, y2: cpY,
          color: wireColor(spec),
          compSide: comp.compSide,
          wrap: pc.side !== comp.compSide,  // Picoのピン側と部品側が異なる→ラップ要
          compId: comp.compId,
          pname,
          wireId: `${comp.compId}:${pname}`,
        });
      });
    });

    // ── Pass 2: チャンネル割当 ──
    // 通常ワイヤー (Pico同側) はサイドごとに channelIdx を一意化。
    // ラップワイヤーは「destCh (部品側でPicoを通り過ぎたあとの縦線位置)」を別プールで採番。
    const normalWires = wires.filter(w => !w.wrap);
    const wrapWires   = wires.filter(w =>  w.wrap);
    assignChannels(normalWires.filter(w => w.side === 'right'));
    assignChannels(normalWires.filter(w => w.side === 'left'));

    // 通常ワイヤーが使うチャンネル数 (各サイド) → ラップワイヤーは外側に詰める
    const maxCh = arr => arr.reduce((m, w) => Math.max(m, w.channelIdx || 0), 0);
    const normalRightCount = maxCh(normalWires.filter(w => w.side === 'right'));
    const normalLeftCount  = maxCh(normalWires.filter(w => w.side === 'left'));

    // ラップワイヤーを「上回り」「下回り」に分類してトラックyを割当
    const picoMidY = PY + PH / 2;
    const topWraps = [], botWraps = [];
    wrapWires.forEach(w => {
      const mid = (w.y1 + w.y2) / 2;
      (mid < picoMidY ? topWraps : botWraps).push(w);
    });
    // トラック割当: 上回りは y が小さい順、下回りは y が大きい順 (Picoから順に外へ離す)
    topWraps.sort((a, b) => Math.min(a.y1, a.y2) - Math.min(b.y1, b.y2));
    botWraps.sort((a, b) => Math.max(b.y1, b.y2) - Math.max(a.y1, a.y2));
    topWraps.forEach((w, i) => { w.trackY = PY - 12 - i * 12; });
    botWraps.forEach((w, i) => { w.trackY = PY + PH + 12 + i * 12; });

    // ラップワイヤー: 部品側の縦線位置 (destCh) を採番。通常チャンネルの外側を使う。
    // 同一 Pico ピンから出るラップワイヤーは同じ destCh を共有 (トランク化)。
    const wrapGroup = new Map();
    wrapWires.forEach(w => {
      const key = `${w.x1}:${w.y1}:${w.compSide}`;
      if (!wrapGroup.has(key)) wrapGroup.set(key, []);
      wrapGroup.get(key).push(w);
    });
    const wrapGroupsLeft  = [];
    const wrapGroupsRight = [];
    wrapGroup.forEach(wires => {
      const minY = Math.min(...wires.map(w => w.y2));
      (wires[0].compSide === 'left' ? wrapGroupsLeft : wrapGroupsRight)
        .push({ wires, minY });
    });
    wrapGroupsLeft.sort((a, b) => a.minY - b.minY);
    wrapGroupsRight.sort((a, b) => a.minY - b.minY);
    wrapGroupsLeft.forEach((g, i) => {
      const dest = PX - CH_STEP * (normalLeftCount + i + 1);
      g.wires.forEach(w => { w.destCh = dest; });
    });
    wrapGroupsRight.forEach((g, i) => {
      const dest = PX + PW + CH_STEP * (normalRightCount + i + 1);
      g.wires.forEach(w => { w.destCh = dest; });
    });

    // ── Pass 3: 描画 ──
    wires.forEach(w => {
      let pathD;
      const wov = wireOverrides[w.wireId];
      const chDx = (wov && typeof wov.chDx === 'number') ? wov.chDx : 0;
      let chForData;
      if (!w.wrap) {
        // channel は部品手前 (chBaseX 起点) に置く。
        // これで Pico → 部品手前まで水平に長く伸び、最後だけ縦に曲がる L 字風になる。
        const base = w.chBaseX != null ? w.chBaseX : w.x1;
        const ch = (w.side === 'right'
          ? base - CH_STEP * w.channelIdx
          : base + CH_STEP * w.channelIdx) + chDx;
        chForData = ch;
        pathD = wirePath(w.x1, w.y1, ch, w.x2, w.y2);
      } else {
        // M(x1,y1) V(trackY) H(destCh) V(y2) H(x2)
        const destCh = w.destCh + chDx;
        chForData = destCh;
        pathD = `M${w.x1},${w.y1} V${w.trackY} H${destCh} V${w.y2} H${w.x2}`;
      }
      // cv-wire でラップして data-* に再計算用パラメータを埋め込む。
      // hit-path は不可視で太いストロークを持ち、クリック判定を広く取る。
      const trackYAttr = w.wrap ? ` data-track-y="${w.trackY}"` : '';
      els.push(
        `<g class="cv-wire" data-wire-id="${w.wireId}" data-x1="${w.x1}" data-y1="${w.y1}" data-x2="${w.x2}" data-y2="${w.y2}" data-wrap="${w.wrap ? 1 : 0}" data-ch="${chForData}"${trackYAttr}>` +
        `<path class="cv-wire-hit" d="${pathD}" fill="none" stroke="transparent" stroke-width="14" pointer-events="stroke"/>` +
        `<path class="cv-wire-line" d="${pathD}" fill="none" stroke="${w.color}" stroke-width="2.2" stroke-linecap="square" opacity="0.92" pointer-events="none"/>` +
        `</g>`
      );
      wireCount++;
    });

    // Pico (cv-comp としてドラッグ可能にする。data-comp-id='__pico__')
    els.push(`<g class="cv-comp" data-comp-id="__pico__">${buildPicoSVG(onboardLedOn)}</g>`);

    // コンポーネント (cv-comp クラスでラップしてドラッグ識別子を持たせる)
    comps.forEach(comp => {
      const sym = SYM[comp.type];
      if (!sym) return;
      els.push(`<g class="cv-comp" data-comp-id="${comp.compId}">${sym.draw(comp.cx, comp.cy, comp.compSide)}</g>`);
    });

    // ───── エラーオーバーレイ ─────
    badPins.forEach((e, idx) => {
      const ex = PX + PW / 2, ey = PY + 50 + idx * 44;
      els.push(`<g>
  <rect x="${ex-70}" y="${ey-30}" width="140" height="36" fill="#7f0000" opacity="0.88" rx="5" stroke="#f44336" stroke-width="1.5"/>
  <text x="${ex}" y="${ey-14}" text-anchor="middle" font-size="14" fill="#ff8a80" font-family="sans-serif">GP${e.gp}: 接続不可</text>
  <text x="${ex}" y="${ey+2}"  text-anchor="middle" font-size="11" fill="#ef9a9a" font-family="sans-serif">${e.reason}</text>
</g>`);
    });

    unknownGPins.forEach(e => {
      els.push(`<g>
  <rect x="${e.cx-68}" y="${e.cy-78}" width="136" height="34" fill="#7f0000" opacity="0.88" rx="5" stroke="#f44336" stroke-width="1.5"/>
  <text x="${e.cx}" y="${e.cy-62}" text-anchor="middle" font-size="14" fill="#ff8a80" font-family="sans-serif">GP${e.gp}: 接続できません</text>
  <text x="${e.cx}" y="${e.cy-48}" text-anchor="middle" font-size="11" fill="#ef9a9a" font-family="sans-serif">ピン番号を確認してください</text>
</g>`);
    });

    if (onboardLedOn) {
      const nx = PX + PW / 2, ny = PY - 28;
      els.push(`<g>
  <rect x="${nx-68}" y="${ny-18}" width="136" height="24" fill="#1a3a1a" opacity="0.9" rx="4" stroke="#4caf50" stroke-width="1"/>
  <text x="${nx}" y="${ny-2}" text-anchor="middle" font-size="12" fill="#a5d6a7" font-family="sans-serif">GP25 = オンボードLED</text>
</g>`);
    }

    if (comps.length === 0 && !onboardLedOn && badPins.length === 0) {
      const mx = vx + svgW / 2, my = vy + svgH / 2;
      els.push(`<text x="${mx}" y="${my-10}" text-anchor="middle" fill="#30363d" font-size="26">MicroPython ブロックを追加すると</text>`);
      els.push(`<text x="${mx}" y="${my+20}" text-anchor="middle" fill="#30363d" font-size="26">配線図が表示されます</text>`);
    }

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="${vx} ${vy} ${svgW} ${svgH}">
<style>.cv-lbl{font-size:17px;fill:#90a4ae;font-family:sans-serif}</style>
${DEFS}
${els.join('\n')}
</svg>`;

    return { svg: svgStr, compCount: comps.length, wireCount };
  };

})();
