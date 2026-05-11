// ===== 実態配線図ジェネレーター (Phase 1) =====

(() => {
  'use strict';

  // ===== Pico レイアウト定数 =====
  const PX = 110, PY = 30, PW = 88, PP = 19, PC = 20;
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
  const GND_C  = { x: PX,      y: PY + 12 + 2 * PP, side: 'left'  };
  const V3V3_C = { x: PX + PW, y: PY + 12 + 4 * PP, side: 'right' };

  function picoCoordOf(s) {
    if (!s) return null;
    if (s.gp  != null) return gpCoord(s.gp);
    if (s.gnd)         return GND_C;
    if (s.v3v3)        return V3V3_C;
    return null;
  }

  // ===== コンポーネント配置 =====
  const CX0 = PX + PW + 120, CY0 = PY + 10;
  const C_COLS = 3, C_CW = 195, C_CH = 160;

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

  // ===== コンポーネントシンボル =====
  const SYM = {

    // ── LED (Wokwi wokwi-led, MIT © 2020 Uri Shaked) ────────
    LED: {
      pins: { A: { dx: -5, dy: 62 }, C: { dx: 8, dy: 62 } },
      draw(cx, cy) {
        // Wokwi SVG: viewBox="-10 -5 35.456 39.618" → 44×50px
        const sx = cx - 22, sy = cy - 25;
        // リード出口 (display座標): 左(A)≈(cx-5,cy+19), 右(C)≈(cx+8,cy+20)
        const aX = cx - 5,  aLeadY = cy + 19;
        const cX = cx + 8,  cLeadY = cy + 20;
        const resT = aLeadY + 4, resB = resT + 22;
        const pinY = cy + 62;
        return `<g>
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
  <!-- アノードリード → 抵抗 → ピン -->
  <line x1="${aX}" y1="${aLeadY}" x2="${aX}" y2="${resT}" stroke="#888" stroke-width="1.5"/>
  <rect x="${aX-7}" y="${resT}" width="14" height="22" fill="#c8a86e" stroke="#8a7040" stroke-width="1" rx="3"/>
  <line x1="${aX-5}" y1="${resT+5}"  x2="${aX+5}" y2="${resT+5}"  stroke="#6b4c20" stroke-width="1"/>
  <line x1="${aX-5}" y1="${resT+11}" x2="${aX+5}" y2="${resT+11}" stroke="#6b4c20" stroke-width="1"/>
  <line x1="${aX-5}" y1="${resT+17}" x2="${aX+5}" y2="${resT+17}" stroke="#6b4c20" stroke-width="1"/>
  <line x1="${aX}" y1="${resB}" x2="${aX}" y2="${pinY}" stroke="#888" stroke-width="1.5"/>
  <!-- カソードリード → ピン -->
  <line x1="${cX}" y1="${cLeadY}" x2="${cX}" y2="${pinY}" stroke="#888" stroke-width="1.5"/>
  <!-- ピンラベル -->
  <text x="${aX}" y="${pinY+16}" text-anchor="middle" font-size="14" fill="#90a4ae" font-family="sans-serif">A</text>
  <text x="${cX}" y="${pinY+16}" text-anchor="middle" font-size="14" fill="#90a4ae" font-family="sans-serif">C</text>
  <text x="${cx}" y="${cy-28}" text-anchor="middle" class="cv-lbl">LED</text>
</g>`;
      }
    },

    // ── タクタイルスイッチ (Wokwi wokwi-pushbutton, MIT © 2020 Uri Shaked) ──
    BTN: {
      pins: { VCC: { dx: -38, dy: 0 }, SIG: { dx: 38, dy: 0 } },
      draw(cx, cy) {
        // viewBox="-3 0 18 12" → 90×60px (scale=5)
        const sx = cx - 45, sy = cy - 30;
        return `<g>
  <svg x="${sx}" y="${sy}" width="90" height="60" viewBox="-3 0 18 12" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="12" height="12" rx=".44" ry=".44" fill="#464646"/>
    <rect x=".75" y=".75" width="10.5" height="10.5" rx=".211" ry=".211" fill="#eaeaea"/>
    <g fill="#1b1b1b">
      <circle cx="1.767" cy="1.7916" r=".37"/>
      <circle cx="10.161" cy="1.7916" r=".37"/>
      <circle cx="10.161" cy="10.197" r=".37"/>
      <circle cx="1.767" cy="10.197" r=".37"/>
    </g>
    <g fill="#999" stroke-width="1.0154">
      <path d="m12.365 2.426c0.06012 0 0.10849 0.0469 0.1085 0.10522v0.38698h2.2173c0.12023 0 0.217 0.0938 0.217 0.21045v0.50721c0 0.1166-0.09677 0.21045-0.217 0.21045h-2.2173v0.40101c0 0.0583-0.0484 0.10528-0.1085 0.10528h-0.36835v-1.9266z"/>
      <path d="m12.365 7.5c0.06012 0 0.10849 0.0469 0.1085 0.10522v0.38698h2.2173c0.12023 0 0.217 0.0938 0.217 0.21045v0.50721c0 0.1166-0.09677 0.21045-0.217 0.21045h-2.2173v0.40101c0 0.0583-0.0484 0.10528-0.1085 0.10528h-0.36835v-1.9266z"/>
      <path d="m-0.35085 4.3526c-0.06012 0-0.10849-0.0469-0.1085-0.10522v-0.38698h-2.2173c-0.12023 0-0.217-0.0938-0.217-0.21045v-0.50721c0-0.1166 0.09677-0.21045 0.217-0.21045h2.2173v-0.40101c0-0.0583 0.0484-0.10528 0.1085-0.10528h0.36835v1.9266z"/>
      <path d="m-0.35085 9.4266c-0.06012 0-0.10849-0.0469-0.1085-0.10522v-0.38698h-2.2173c-0.12023 0-0.217-0.0938-0.217-0.21045v-0.50721c0-0.1166 0.09677-0.21045 0.217-0.21045h2.2173v-0.40101c0-0.0583 0.0484-0.10528 0.1085-0.10528h0.36835v1.9266z"/>
    </g>
    <circle cx="6" cy="6" r="3.822" fill="#cc2222"/>
    <circle cx="6" cy="6" r="2.9" fill="#cc2222" stroke="#2f2f2f" stroke-opacity=".47" stroke-width=".08"/>
  </svg>
  <!-- ピンラベル -->
  <text x="${cx-38}" y="${cy-34}" text-anchor="middle" font-size="12" fill="#90a4ae" font-family="sans-serif">VCC</text>
  <text x="${cx+38}" y="${cy-34}" text-anchor="middle" font-size="12" fill="#90a4ae" font-family="sans-serif">SIG</text>
  <text x="${cx}" y="${cy+48}" text-anchor="middle" class="cv-lbl">Button</text>
</g>`;
      }
    },

    // ── ポテンショメーター (Wokwi wokwi-potentiometer, MIT © 2020 Uri Shaked) ──
    POT: {
      pins: { VCC: { dx: 38, dy: 42 }, SIG: { dx: 12, dy: 42 }, GND: { dx: -14, dy: 42 } },
      draw(cx, cy) {
        // viewBox="0 0 20 20" → 80×80px (scale=4), pins at bottom
        const sx = cx - 40, sy = cy - 40;
        return `<g>
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
  <!-- ピンリード (底面から下へ) -->
  <line x1="${cx+38}" y1="${cy+40}" x2="${cx+38}" y2="${cy+42}" stroke="#888" stroke-width="1.5"/>
  <line x1="${cx+12}" y1="${cy+40}" x2="${cx+12}" y2="${cy+42}" stroke="#888" stroke-width="1.5"/>
  <line x1="${cx-14}" y1="${cy+40}" x2="${cx-14}" y2="${cy+42}" stroke="#888" stroke-width="1.5"/>
  <!-- ピンラベル -->
  <text x="${cx+38}" y="${cy+56}" text-anchor="middle" font-size="12" fill="#90a4ae" font-family="sans-serif">VCC</text>
  <text x="${cx+12}" y="${cy+56}" text-anchor="middle" font-size="12" fill="#90a4ae" font-family="sans-serif">SIG</text>
  <text x="${cx-14}" y="${cy+56}" text-anchor="middle" font-size="12" fill="#90a4ae" font-family="sans-serif">GND</text>
  <text x="${cx}" y="${cy+70}" text-anchor="middle" class="cv-lbl">Potentiometer</text>
</g>`;
      }
    },

    // ── パッシブブザー (Wokwi wokwi-buzzer, MIT © 2020 Uri Shaked) ──
    BUZZ: {
      pins: { SIG: { dx: -9, dy: 50 }, GND: { dx: 9, dy: 50 } },
      draw(cx, cy) {
        // viewBox="0 0 17 20" → 68×80px (scale=4)
        const sx = cx - 34, sy = cy - 40;
        const pinY = cy + 50;
        return `<g>
  <svg x="${sx}" y="${sy}" width="68" height="80" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg">
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
  <!-- ピンラベル -->
  <text x="${cx-9}" y="${pinY+16}" text-anchor="middle" font-size="12" fill="#90a4ae" font-family="sans-serif">SIG</text>
  <text x="${cx+9}" y="${pinY+16}" text-anchor="middle" font-size="12" fill="#e53935" font-family="sans-serif">+</text>
  <text x="${cx}" y="${pinY+32}" text-anchor="middle" class="cv-lbl">Buzzer</text>
</g>`;
      }
    },

    // ── SG90 サーボ (Wokwi wokwi-servo, MIT © 2020 Uri Shaked) ──
    SERVO: {
      pins: { GND: { dx: -61, dy: -6 }, VCC: { dx: -61, dy: 0 }, PWM: { dx: -61, dy: 6 } },
      draw(cx, cy) {
        // Wokwi viewBox="0 0 170.08 119.55" → 130×72px
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
  <!-- ピンラベル -->
  <text x="${cx-61}" y="${cy-20}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">GND</text>
  <text x="${cx-61}" y="${cy+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">VCC</text>
  <text x="${cx-61}" y="${cy+24}" text-anchor="middle" font-size="11" fill="#f57c00" font-family="sans-serif">PWM</text>
  <text x="${cx+12}" y="${cy+46}" text-anchor="middle" class="cv-lbl">Servo (SG90)</text>
</g>`;
      }
    },

    // ── HC-SR04 (Wokwi wokwi-hc-sr04, MIT © 2020 Uri Shaked) ──
    HCSR04: {
      pins: { VCC: { dx: -37, dy: 38 }, TRIG: { dx: -12, dy: 38 }, ECHO: { dx: 13, dy: 38 }, GND: { dx: 38, dy: 38 } },
      draw(cx, cy) {
        // viewBox="0 0 45 25" → 90×50px (scale=2)
        const sx = cx - 45, sy = cy - 25;
        const pinY = cy + 38;
        return `<g>
  <svg x="${sx}" y="${sy}" width="90" height="50" viewBox="0 0 45 25" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
    <g transform="rotate(-90)" font-size="1.55" fill="#e6e6e6" stroke-width=".039" font-family="sans-serif">
      <text x="-17.6" y="19.6">VCC</text>
      <text x="-17.6" y="22.1">TRIG</text>
      <text x="-17.6" y="24.6">ECHO</text>
      <text x="-17.6" y="27.2">GND</text>
    </g>
  </svg>
  <!-- ピンラベル (外部) -->
  <text x="${cx-37}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">VCC</text>
  <text x="${cx-12}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">TRIG</text>
  <text x="${cx+13}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">ECHO</text>
  <text x="${cx+38}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">GND</text>
  <text x="${cx}" y="${pinY+28}" text-anchor="middle" class="cv-lbl">HC-SR04</text>
</g>`;
      }
    },

    // ── DHT22 (Wokwi wokwi-dht22, MIT © 2020 Uri Shaked) ──
    DHT22: {
      pins: { VCC: { dx: -10, dy: 52 }, SIG: { dx: 4, dy: 52 }, GND: { dx: 18, dy: 52 } },
      draw(cx, cy) {
        // viewBox="0 0 15.1 30.885" → 50×102px (scale≈3.3)
        const sx = cx - 25, sy = cy - 50;
        const pinY = cy + 52;
        return `<g>
  <svg x="${sx}" y="${sy}" width="50" height="102" viewBox="0 0 15.1 30.885" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ccc" stroke-linecap="round" stroke-width=".21">
      <rect x="3.57" y="23.885" width=".75" height="7" rx=".2"/>
      <rect x="6.11" y="23.885" width=".75" height="7" rx=".2"/>
      <rect x="8.65" y="23.885" width=".75" height="7" rx=".2"/>
      <rect x="11.19" y="23.885" width=".75" height="7" rx=".2"/>
    </g>
    <path d="M15.05 23.995V5.033c0-.107-1.069-4.962-2.662-4.96L2.803.09C1.193.09.05 4.926.05 5.033v18.962c0 .107.086.192.192.192h14.616a.192.192 0 00.192-.192M7.615.948h.004c1.08 0 1.956.847 1.956 1.892s-.876 1.892-1.956 1.892-1.956-.847-1.956-1.892c0-1.044.873-1.89 1.952-1.892z" fill="#f2f2f2" stroke="#000" stroke-linecap="round" stroke-width=".1"/>
    <text x="3.7" y="22.86" fill="#000" font-family="sans-serif" font-size="2.2" stroke-width=".05">DHT22</text>
  </svg>
  <!-- ピンラベル -->
  <text x="${cx-10}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">VCC</text>
  <text x="${cx+4}"  y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">SIG</text>
  <text x="${cx+18}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">GND</text>
  <text x="${cx}" y="${pinY+28}" text-anchor="middle" class="cv-lbl">DHT22</text>
</g>`;
      }
    },

    // ── LCD1602 I2C (Wokwi wokwi-lcd1602, MIT © 2020 Uri Shaked) ──
    LCD: {
      pins: { GND: { dx: -46, dy: 40 }, VCC: { dx: -15, dy: 40 }, SDA: { dx: 15, dy: 40 }, SCL: { dx: 46, dy: 40 } },
      draw(cx, cy) {
        // viewBox="0 0 80 36" → 160×72px (scale=2), Wokwi exact green #087f45
        const sx = cx - 80, sy = cy - 36;
        const pinY = cy + 40;
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
  <line x1="${cx-46}" y1="${cy+36}" x2="${cx-46}" y2="${pinY}" stroke="#888" stroke-width="1.5"/>
  <line x1="${cx-15}" y1="${cy+36}" x2="${cx-15}" y2="${pinY}" stroke="#888" stroke-width="1.5"/>
  <line x1="${cx+15}" y1="${cy+36}" x2="${cx+15}" y2="${pinY}" stroke="#888" stroke-width="1.5"/>
  <line x1="${cx+46}" y1="${cy+36}" x2="${cx+46}" y2="${pinY}" stroke="#888" stroke-width="1.5"/>
  <text x="${cx-46}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">GND</text>
  <text x="${cx-15}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">VCC</text>
  <text x="${cx+15}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">SDA</text>
  <text x="${cx+46}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">SCL</text>
  <text x="${cx}" y="${pinY+28}" text-anchor="middle" class="cv-lbl">LCD1602 (I2C)</text>
</g>`;
      }
    },

    // ── 7セグメント LED (Wokwi wokwi-7segment, MIT © 2020 Uri Shaked) ──
    SEG7: {
      pins: { COM: { dx: 0, dy: 62 } },
      draw(cx, cy) {
        // Wokwi viewBox="0 0 12.55 22" → 63×110px (scale≈5)
        // segments: hexagonal polygon shapes with skewX(-8) italic styling
        const sx = cx - 31, sy = cy - 55;
        const pinY = cy + 62;
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
  <line x1="${cx}" y1="${sy+110}" x2="${cx}" y2="${pinY}" stroke="#888" stroke-width="1.5"/>
  <text x="${cx}" y="${pinY+14}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">COM</text>
  <text x="${cx}" y="${pinY+28}" text-anchor="middle" class="cv-lbl">7-Segment</text>
</g>`;
      }
    },

    // ── 28BYJ-48 + ULN2003 ─────────────────────────────
    STEPPER: {
      pins: { IN1: { dx: -40, dy: 36 }, IN2: { dx: -13, dy: 36 }, IN3: { dx: 13, dy: 36 }, IN4: { dx: 40, dy: 36 } },
      draw(cx, cy) {
        return `<g filter="url(#fDrop)">
  <!-- ULN2003 基板 -->
  <rect x="${cx-48}" y="${cy+6}"  width="96" height="28" fill="url(#gPcbBlue)" stroke="#0d47a1" stroke-width="1.5" rx="3"/>
  <text x="${cx}" y="${cy+24}" text-anchor="middle" font-size="14" fill="#fff" font-weight="bold">ULN2003A</text>
  <!-- モーター本体 (円形) -->
  <circle cx="${cx}" cy="${cy-14}" r="34" fill="url(#gMotorBlue)" stroke="#0d47a1" stroke-width="2"/>
  <!-- ギア外輪 -->
  <circle cx="${cx}" cy="${cy-14}" r="28" fill="#1976d2" stroke="#1565c0" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy-14}" r="20" fill="#1565c0" stroke="#0d47a1" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy-14}" r="12" fill="#0d47a1" stroke="#0a3880" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy-14}" r="5"  fill="#082a6e"/>
  <!-- シャフト -->
  <rect x="${cx-3.5}" y="${cy-50}" width="7" height="14" fill="#b0bec5" stroke="#78909c" stroke-width="0.8" rx="2"/>
  <!-- コネクタケーブル -->
  <rect x="${cx-26}" y="${cy+2}" width="52" height="6" fill="#212121" stroke="#333" stroke-width="0.5" rx="1"/>
  <!-- ピンラベル -->
  <text x="${cx-40}" y="${cy+50}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">IN1</text>
  <text x="${cx-13}" y="${cy+50}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">IN2</text>
  <text x="${cx+13}" y="${cy+50}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">IN3</text>
  <text x="${cx+40}" y="${cy+50}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">IN4</text>
  <text x="${cx}" y="${cy+66}" text-anchor="middle" class="cv-lbl">28BYJ-48 + ULN2003</text>
</g>`;
      }
    },

    // ── L298N DCモータードライバー ────────────────────────
    L298N: {
      pins: { IN1: { dx: -30, dy: 34 }, IN2: { dx: -10, dy: 34 }, EN: { dx: 10, dy: 34 }, GND: { dx: 30, dy: 34 } },
      draw(cx, cy) {
        const fins = Array.from({ length: 9 }, (_, i) =>
          `<line x1="${cx-20+i*5}" y1="${cy-36}" x2="${cx-20+i*5}" y2="${cy-16}" stroke="#1a1a1a" stroke-width="1.2"/>`
        ).join('');
        return `<g filter="url(#fDrop)">
  <!-- 赤PCB -->
  <rect x="${cx-48}" y="${cy-32}" width="96" height="62" fill="url(#gPcbRed)" stroke="#7f0000" stroke-width="1.5" rx="4"/>
  <!-- ヒートシンク -->
  <rect x="${cx-24}" y="${cy-36}" width="48" height="22" fill="#2a2a2a" stroke="#1a1a1a" stroke-width="1" rx="2"/>
  ${fins}
  <!-- L298N IC -->
  <rect x="${cx-20}" y="${cy-14}" width="40" height="26" fill="#1a1a1a" stroke="#2a2a2a" stroke-width="1" rx="2"/>
  <!-- ICピン (側面) -->
  ${Array.from({length:4}, (_,i) => `<rect x="${cx-26}" y="${cy-10+i*6}" width="6" height="3" fill="#555" rx="1"/>`).join('')}
  ${Array.from({length:4}, (_,i) => `<rect x="${cx+20}" y="${cy-10+i*6}" width="6" height="3" fill="#555" rx="1"/>`).join('')}
  <text x="${cx}" y="${cy+3}"  text-anchor="middle" font-size="18" fill="#fff" font-weight="bold">L298N</text>
  <!-- ターミナルブロック (モーター出力) -->
  <rect x="${cx-46}" y="${cy-4}" width="14" height="12" fill="#1565C0" stroke="#0d47a1" stroke-width="0.8" rx="1"/>
  <rect x="${cx+32}" y="${cy-4}" width="14" height="12" fill="#1565C0" stroke="#0d47a1" stroke-width="0.8" rx="1"/>
  <!-- LED -->
  <circle cx="${cx-32}" cy="${cy+16}" r="3.5" fill="#00e676" stroke="#00c853" stroke-width="0.5"/>
  <!-- ピンラベル -->
  <text x="${cx-30}" y="${cy+48}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">IN1</text>
  <text x="${cx-10}" y="${cy+48}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">IN2</text>
  <text x="${cx+10}" y="${cy+48}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">EN</text>
  <text x="${cx+30}" y="${cy+48}" text-anchor="middle" font-size="11" fill="#90a4ae" font-family="sans-serif">GND</text>
  <text x="${cx}" y="${cy+64}" text-anchor="middle" class="cv-lbl">DC Motor (L298N)</text>
</g>`;
      }
    },
  };

  // ===== ブロック解析 =====
  function parseBlocks(workspace) {
    const comps = [], seen = new Set();

    function add(key, type, pins) {
      if (seen.has(key)) return;
      seen.add(key);
      comps.push({ type, pins });
    }

    workspace.getAllBlocks(false)
      .filter(b => !b.isInsertionMarker())
      .forEach(b => {
        const t = b.type, gf = n => b.getFieldValue(n);

        if (['pico_led_on','pico_led_off','pico_digital_write','pico_pwm_write'].includes(t)) {
          const p = gf('PIN');
          add('led'+p, 'LED', { A:{gp:p}, C:{gnd:true} });

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
          add('servo'+p, 'SERVO', { PWM:{gp:p}, VCC:{v3v3:true}, GND:{gnd:true} });

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
          const ps = gf('PINS').split(',').map(s=>s.trim());
          const pins = { COM:{gnd:true} };
          ['A','B','C','D','E','F','G'].forEach((s,i) => { if(ps[i]) pins[s]={gp:ps[i]}; });
          add('seg7', 'SEG7', pins);

        } else if (['pico_dcmotor_run','pico_dcmotor_stop'].includes(t)) {
          const in1=gf('IN1'), in2=gf('IN2'), en=b.getFieldValue('EN');
          add('l298n_'+in1+'_'+in2, 'L298N',
            { IN1:{gp:in1}, IN2:{gp:in2}, EN:en?{gp:en}:null, GND:{gnd:true} });

        } else if (['pico_stepper_step','pico_stepper_angle'].includes(t)) {
          const ps = gf('PINS').split(',').map(s=>s.trim());
          add('step_'+ps.join('_'), 'STEPPER',
            { IN1:{gp:ps[0]}, IN2:{gp:ps[1]}, IN3:{gp:ps[2]}, IN4:{gp:ps[3]} });
        }
      });

    return comps;
  }

  // ===== レイアウト =====
  function layoutComps(comps) {
    comps.forEach((c, i) => {
      c.cx = CX0 + (i % C_COLS) * C_CW + 78;
      c.cy = CY0 + Math.floor(i / C_COLS) * C_CH + 62;
    });
  }

  // ===== ワイヤー描画 =====
  function wirePath(x1, y1, side, x2, y2) {
    if (side === 'right') {
      const dx = Math.abs(x2 - x1);
      const cx1 = x1 + Math.max(65, dx * 0.45);
      const cx2 = x2 - 45;
      return `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`;
    } else {
      // 左ピン: 下方を回り込むルート
      const bot = PY + PH + 35;
      const cx1 = x1 - 55;
      const cx2 = x2 - 65;
      return `M${x1},${y1} C${cx1},${y1} ${cx2},${bot} ${x2},${y2}`;
    }
  }

  function wireColor(s) {
    if (s.gnd)  return '#546e7a';
    if (s.v3v3) return '#e53935';
    return '#43a047';
  }

  // ===== Pico SVG =====
  function buildPicoSVG() {
    const p = [];
    // ピン穴 (基板端)
    for (let i = 0; i < PC; i++) {
      const py = PY + 12 + i * PP;
      p.push(`<rect x="${PX-8}" y="${py-3}" width="6" height="6" fill="#ffd54f" stroke="#b8860b" stroke-width="0.5" rx="1"/>`);
      p.push(`<rect x="${PX+PW+2}" y="${py-3}" width="6" height="6" fill="#ffd54f" stroke="#b8860b" stroke-width="0.5" rx="1"/>`);
    }
    // 基板本体
    p.push(`<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" fill="#2e7d32" stroke="#1b5e20" stroke-width="2.5" rx="5"/>`);
    p.push(`<rect x="${PX+4}" y="${PY+4}" width="${PW-8}" height="${PH-8}" fill="none" stroke="#1b5e20" stroke-width="0.6" rx="3"/>`);
    // RP2040 チップ
    const chipX = PX + PW/2 - 18, chipY = PY + PH/2 - 18;
    p.push(`<rect x="${chipX}" y="${chipY}" width="36" height="36" fill="#111" stroke="#333" stroke-width="0.5" rx="2"/>`);
    p.push(`<text x="${PX+PW/2}" y="${chipY+14}" text-anchor="middle" font-size="9" fill="#555">RP2040</text>`);
    // LED チップ
    p.push(`<circle cx="${PX+PW/2-22}" cy="${PY+20}" r="3" fill="#00e676" stroke="#00c853" stroke-width="0.5"/>`);
    // Pico ラベル
    p.push(`<text x="${PX+PW/2}" y="${PY+PH-10}" text-anchor="middle" font-size="14" fill="#a5d6a7" font-weight="bold">Pico</text>`);

    // 左ピンラベル・接続点
    L_PINS.forEach((name, i) => {
      const py = PY + 12 + i * PP;
      const isGnd = name === 'GND';
      const col = isGnd ? '#78909c' : '#FFD54F';
      p.push(`<circle cx="${PX}" cy="${py}" r="3" fill="${col}" stroke="#222" stroke-width="0.5"/>`);
      p.push(`<text x="${PX-14}" y="${py+4.5}" text-anchor="end" font-size="13" fill="#90a4ae">${name}</text>`);
    });
    // 右ピンラベル・接続点
    R_PINS.forEach((name, i) => {
      const py = PY + 12 + i * PP;
      const rx = PX + PW;
      const isGnd = name === 'GND' || name === 'AGND';
      const isPwr = ['3V3','VSYS','VBUS'].includes(name);
      const col = isGnd ? '#78909c' : isPwr ? '#e57373' : '#FFD54F';
      p.push(`<circle cx="${rx}" cy="${py}" r="3" fill="${col}" stroke="#222" stroke-width="0.5"/>`);
      p.push(`<text x="${rx+14}" y="${py+4.5}" text-anchor="start" font-size="13" fill="#90a4ae">${name}</text>`);
    });

    return p.join('\n');
  }

  // ===== メイン =====
  window.generateCircuitSVG = function(workspace) {
    const comps = parseBlocks(workspace);
    layoutComps(comps);

    const numRows = Math.max(1, Math.ceil(comps.length / C_COLS));
    const svgW = CX0 + C_COLS * C_CW + 30;
    const svgH = Math.max(PY + PH + 50, CY0 + numRows * C_CH + 30);

    let wireCount = 0;
    const els = [];

    // 背景
    els.push(`<rect width="${svgW}" height="${svgH}" fill="#0d1117"/>`);
    // グリッド
    for (let gx = 0; gx < svgW; gx += 40) els.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${svgH}" stroke="#161b22" stroke-width="1"/>`);
    for (let gy = 0; gy < svgH; gy += 40) els.push(`<line x1="0" y1="${gy}" x2="${svgW}" y2="${gy}" stroke="#161b22" stroke-width="1"/>`);

    // ワイヤー
    comps.forEach(comp => {
      const sym = SYM[comp.type];
      if (!sym) return;
      Object.entries(comp.pins).forEach(([pname, spec]) => {
        if (!spec) return;
        const sp = sym.pins[pname];
        if (!sp) return;
        const pc = picoCoordOf(spec);
        if (!pc) return;
        const color = wireColor(spec);
        els.push(`<path d="${wirePath(pc.x, pc.y, pc.side, comp.cx + sp.dx, comp.cy + sp.dy)}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>`);
        wireCount++;
      });
    });

    // Pico
    els.push(buildPicoSVG());

    // コンポーネント
    comps.forEach(comp => {
      const sym = SYM[comp.type];
      if (sym) els.push(sym.draw(comp.cx, comp.cy));
    });

    // 空の場合のメッセージ
    if (comps.length === 0) {
      const mx = svgW / 2, my = svgH / 2;
      els.push(`<text x="${mx}" y="${my-10}" text-anchor="middle" fill="#30363d" font-size="26">MicroPython ブロックを追加すると</text>`);
      els.push(`<text x="${mx}" y="${my+20}" text-anchor="middle" fill="#30363d" font-size="26">配線図が表示されます</text>`);
    }

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
<style>.cv-lbl{font-size:17px;fill:#90a4ae;font-family:sans-serif}</style>
${DEFS}
${els.join('\n')}
</svg>`;

    return { svg: svgStr, compCount: comps.length, wireCount };
  };

})();
