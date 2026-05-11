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

    // ── LED (横向き・左ドーム=アノード・右フラット=カソード) ───
    LED: {
      pins: { A: { dx: -46, dy: 0 }, C: { dx: 46, dy: 0 } },
      draw(cx, cy) {
        const bh = 14;          // ボディ半高
        const bx1 = cx - 16;   // 左端(アノード側)
        const bx2 = cx + 16;   // 右端(カソード側)
        // D字パス: bx1上端 → 左ドーム半円(CCW,large) → bx1下端 → 右端下 → 右端上 → close
        const path = `M${bx1},${cy-bh} A${bh},${bh} 0 1,0 ${bx1},${cy+bh} L${bx2},${cy+bh} L${bx2},${cy-bh} Z`;
        return `<g filter="url(#fDrop)">
  <line x1="${cx-46}" y1="${cy}" x2="${bx1}" y2="${cy}" stroke="#ccc" stroke-width="2.5" stroke-linecap="round"/>
  <path d="${path}" fill="url(#gLedRed)" stroke="#c62828" stroke-width="1.5"/>
  <ellipse cx="${cx-8}" cy="${cy-5}" rx="9" ry="5" fill="#fff" opacity="0.2"/>
  <line x1="${bx2}" y1="${cy-bh}" x2="${bx2}" y2="${cy+bh}" stroke="#7f0000" stroke-width="3"/>
  <line x1="${bx2}" y1="${cy}" x2="${cx+46}" y2="${cy}" stroke="#ccc" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="${cx+18}" y1="${cy-8}"  x2="${cx+30}" y2="${cy-20}" stroke="#ffd740" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="${cx+22}" y1="${cy-4}"  x2="${cx+34}" y2="${cy-16}" stroke="#ffd740" stroke-width="1.5" stroke-linecap="round"/>
  <text x="${cx}" y="${cy+bh+14}" text-anchor="middle" class="cv-lbl">LED</text>
</g>`;
      }
    },

    // ── タクタイルスイッチ (上面) ──────────────────────────
    BTN: {
      pins: { VCC: { dx: -30, dy: 0 }, SIG: { dx: 30, dy: 0 } },
      draw(cx, cy) {
        return `<g filter="url(#fDrop)">
  <!-- PCB面 -->
  <rect x="${cx-24}" y="${cy-24}" width="48" height="48" fill="#1a3a1a" stroke="#2a5a2a" stroke-width="1" rx="4"/>
  <!-- スイッチ本体 -->
  <rect x="${cx-20}" y="${cy-20}" width="40" height="40" fill="#252525" stroke="#3a3a3a" stroke-width="1" rx="3"/>
  <!-- ボタンキャップ -->
  <rect x="${cx-12}" y="${cy-12}" width="24" height="24" fill="url(#gBtn)" stroke="#888" stroke-width="1" rx="3"/>
  <rect x="${cx-10}" y="${cy-10}" width="10" height="5" fill="#fff" opacity="0.25" rx="1"/>
  <!-- 4コーナー ハンダパッド -->
  <circle cx="${cx-21}" cy="${cy-21}" r="3.5" fill="#ffd54f" stroke="#b8860b" stroke-width="0.5"/>
  <circle cx="${cx+21}" cy="${cy-21}" r="3.5" fill="#ffd54f" stroke="#b8860b" stroke-width="0.5"/>
  <circle cx="${cx-21}" cy="${cy+21}" r="3.5" fill="#ffd54f" stroke="#b8860b" stroke-width="0.5"/>
  <circle cx="${cx+21}" cy="${cy+21}" r="3.5" fill="#ffd54f" stroke="#b8860b" stroke-width="0.5"/>
  <!-- リード -->
  <line x1="${cx-30}" y1="${cy}" x2="${cx-22}" y2="${cy}" stroke="#d0d0d0" stroke-width="2"/>
  <line x1="${cx+22}" y1="${cy}" x2="${cx+30}" y2="${cy}" stroke="#d0d0d0" stroke-width="2"/>
  <text x="${cx}" y="${cy+34}" text-anchor="middle" class="cv-lbl">Button</text>
</g>`;
      }
    },

    // ── トリマーポテンショ (上面) ──────────────────────────
    POT: {
      pins: { VCC: { dx: -30, dy: 0 }, SIG: { dx: 0, dy: 34 }, GND: { dx: 30, dy: 0 } },
      draw(cx, cy) {
        return `<g filter="url(#fDrop)">
  <!-- PCB -->
  <rect x="${cx-28}" y="${cy-22}" width="56" height="40" fill="#1a3a1a" stroke="#2a5a2a" stroke-width="1" rx="3"/>
  <!-- 本体 (青) -->
  <rect x="${cx-24}" y="${cy-18}" width="48" height="32" fill="url(#gPcbBlue)" stroke="#0d47a1" stroke-width="1" rx="3"/>
  <!-- ノブ円 -->
  <circle cx="${cx}" cy="${cy}" r="13" fill="#e8e8e8" stroke="#9e9e9e" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="9"  fill="#d0d0d0" stroke="#888" stroke-width="1"/>
  <!-- ノブ溝 (スロット) -->
  <line x1="${cx}" y1="${cy-9}" x2="${cx}" y2="${cy-2}" stroke="#555" stroke-width="3" stroke-linecap="round"/>
  <!-- ハンダパッド -->
  <rect x="${cx-23}" y="${cy+8}" width="8" height="6" fill="#ffd54f" rx="1"/>
  <rect x="${cx-4}"  y="${cy+8}" width="8" height="6" fill="#ffd54f" rx="1"/>
  <rect x="${cx+15}" y="${cy+8}" width="8" height="6" fill="#ffd54f" rx="1"/>
  <!-- リード -->
  <line x1="${cx-30}" y1="${cy}" x2="${cx-22}" y2="${cy}" stroke="#d0d0d0" stroke-width="2"/>
  <line x1="${cx+22}" y1="${cy}" x2="${cx+30}" y2="${cy}" stroke="#d0d0d0" stroke-width="2"/>
  <line x1="${cx}"    y1="${cy+14}" x2="${cx}"  y2="${cy+34}" stroke="#d0d0d0" stroke-width="2"/>
  <text x="${cx}" y="${cy+48}" text-anchor="middle" class="cv-lbl">Potentiometer</text>
</g>`;
      }
    },

    // ── パッシブブザー ─────────────────────────────────────
    BUZZ: {
      pins: { SIG: { dx: -30, dy: 0 }, GND: { dx: 30, dy: 0 } },
      draw(cx, cy) {
        return `<g filter="url(#fDrop)">
  <!-- 外形 (黒円) -->
  <circle cx="${cx}" cy="${cy}" r="22" fill="#1a1a1a" stroke="#333" stroke-width="1.5"/>
  <!-- 上面ディスク -->
  <ellipse cx="${cx}" cy="${cy-3}" rx="22" ry="8" fill="#212121" stroke="#2a2a2a" stroke-width="1"/>
  <!-- 中央穴パターン -->
  <circle cx="${cx}"    cy="${cy-3}" r="5"   fill="#0a0a0a" stroke="#333" stroke-width="0.5"/>
  <circle cx="${cx-10}" cy="${cy-3}" r="2"   fill="#111" stroke="#333" stroke-width="0.5"/>
  <circle cx="${cx+10}" cy="${cy-3}" r="2"   fill="#111" stroke="#333" stroke-width="0.5"/>
  <circle cx="${cx}"    cy="${cy-12}" r="2"  fill="#111" stroke="#333" stroke-width="0.5"/>
  <circle cx="${cx}"    cy="${cy+6}"  r="2"  fill="#111" stroke="#333" stroke-width="0.5"/>
  <!-- ＋ マーク -->
  <text x="${cx-18}" y="${cy-8}" font-size="9" fill="#e53935" font-weight="bold">+</text>
  <!-- PCB底面リング -->
  <ellipse cx="${cx}" cy="${cy+18}" rx="22" ry="5" fill="#1a3a1a" stroke="#2a5a2a" stroke-width="1"/>
  <!-- リード -->
  <line x1="${cx-30}" y1="${cy}" x2="${cx-22}" y2="${cy}" stroke="#d0d0d0" stroke-width="2"/>
  <line x1="${cx+22}" y1="${cy}" x2="${cx+30}" y2="${cy}" stroke="#d0d0d0" stroke-width="2"/>
  <text x="${cx}" y="${cy+36}" text-anchor="middle" class="cv-lbl">Buzzer</text>
</g>`;
      }
    },

    // ── SG90 サーボ (斜め上から) ──────────────────────────
    SERVO: {
      pins: { GND: { dx: -22, dy: 44 }, VCC: { dx: 0, dy: 44 }, PWM: { dx: 22, dy: 44 } },
      draw(cx, cy) {
        return `<g filter="url(#fDrop)">
  <!-- 本体 -->
  <rect x="${cx-34}" y="${cy-30}" width="68" height="56" fill="url(#gServoBody)" stroke="#9e9e9e" stroke-width="1.5" rx="6"/>
  <!-- 側面マウントタブ (左) -->
  <rect x="${cx-44}" y="${cy-20}" width="12" height="28" fill="#e0e0e0" stroke="#aaa" stroke-width="1" rx="4"/>
  <circle cx="${cx-38}" cy="${cy-14}" r="3" fill="#bbb" stroke="#999" stroke-width="0.5"/>
  <circle cx="${cx-38}" cy="${cy+14}" r="3" fill="#bbb" stroke="#999" stroke-width="0.5"/>
  <!-- 側面マウントタブ (右) -->
  <rect x="${cx+32}" y="${cy-20}" width="12" height="28" fill="#e0e0e0" stroke="#aaa" stroke-width="1" rx="4"/>
  <circle cx="${cx+38}" cy="${cy-14}" r="3" fill="#bbb" stroke="#999" stroke-width="0.5"/>
  <circle cx="${cx+38}" cy="${cy+14}" r="3" fill="#bbb" stroke="#999" stroke-width="0.5"/>
  <!-- ギアカバー円 -->
  <circle cx="${cx+16}" cy="${cy-10}" r="18" fill="#d8d8d8" stroke="#aaa" stroke-width="1.2"/>
  <circle cx="${cx+16}" cy="${cy-10}" r="10" fill="#c0c0c0" stroke="#999" stroke-width="1"/>
  <circle cx="${cx+16}" cy="${cy-10}" r="4"  fill="#909090"/>
  <!-- 出力シャフト + ホーン -->
  <rect x="${cx+10}" y="${cy-30}" width="24" height="8" fill="#e8e8e8" stroke="#999" stroke-width="1" rx="4"/>
  <circle cx="${cx+16}" cy="${cy-26}" r="3.5" fill="#bbb" stroke="#888" stroke-width="0.5"/>
  <!-- ラベル -->
  <text x="${cx-8}" y="${cy+12}" text-anchor="middle" font-size="7" fill="#666" font-style="italic">SG90</text>
  <!-- 3本ワイヤーコネクタ -->
  <rect x="${cx-34}" y="${cy+20}" width="68" height="10" fill="#424242" stroke="#333" stroke-width="1" rx="2"/>
  <rect x="${cx-30}" y="${cy+22}" width="12" height="6" fill="#3e2723" stroke="#222" stroke-width="0.5" rx="1"/>
  <rect x="${cx-14}" y="${cy+22}" width="12" height="6" fill="#b71c1c" stroke="#222" stroke-width="0.5" rx="1"/>
  <rect x="${cx+2}"  y="${cy+22}" width="12" height="6" fill="#e65100" stroke="#222" stroke-width="0.5" rx="1"/>
  <!-- リード -->
  <line x1="${cx-22}" y1="${cy+30}" x2="${cx-22}" y2="${cy+44}" stroke="#3e2723" stroke-width="2.5"/>
  <line x1="${cx}"    y1="${cy+30}" x2="${cx}"    y2="${cy+44}" stroke="#b71c1c" stroke-width="2.5"/>
  <line x1="${cx+22}" y1="${cy+30}" x2="${cx+22}" y2="${cy+44}" stroke="#e65100" stroke-width="2.5"/>
  <text x="${cx}" y="${cy+58}" text-anchor="middle" class="cv-lbl">Servo (SG90)</text>
</g>`;
      }
    },

    // ── HC-SR04 超音波センサー ────────────────────────────
    HCSR04: {
      pins: { VCC: { dx: -38, dy: 34 }, TRIG: { dx: -13, dy: 34 }, ECHO: { dx: 13, dy: 34 }, GND: { dx: 38, dy: 34 } },
      draw(cx, cy) {
        return `<g filter="url(#fDrop)">
  <!-- PCB (緑) -->
  <rect x="${cx-50}" y="${cy-28}" width="100" height="58" fill="url(#gPcbGreen)" stroke="#1b5e20" stroke-width="1.5" rx="4"/>
  <!-- PCB パターン (デコ) -->
  <line x1="${cx-38}" y1="${cy+14}" x2="${cx-24}" y2="${cy+14}" stroke="#ffd54f" stroke-width="0.7" opacity="0.5"/>
  <line x1="${cx+24}" y1="${cy+14}" x2="${cx+38}" y2="${cy+14}" stroke="#ffd54f" stroke-width="0.7" opacity="0.5"/>
  <!-- ラベル -->
  <text x="${cx}" y="${cy-14}" text-anchor="middle" font-size="7.5" fill="#c8e6c9" font-weight="bold">HC-SR04</text>
  <!-- トランスデューサー左 (TRIG) -->
  <circle cx="${cx-22}" cy="${cy+2}" r="17" fill="url(#gTransducer)" stroke="#757575" stroke-width="1.5"/>
  <circle cx="${cx-22}" cy="${cy+2}" r="12" fill="#c8c8c8" stroke="#888" stroke-width="1"/>
  <circle cx="${cx-22}" cy="${cy+2}" r="8"  fill="#aaaaaa" stroke="#777" stroke-width="0.8"/>
  <circle cx="${cx-22}" cy="${cy+2}" r="4"  fill="#888"/>
  <!-- トランスデューサー右 (ECHO) -->
  <circle cx="${cx+22}" cy="${cy+2}" r="17" fill="url(#gTransducer)" stroke="#757575" stroke-width="1.5"/>
  <circle cx="${cx+22}" cy="${cy+2}" r="12" fill="#c8c8c8" stroke="#888" stroke-width="1"/>
  <circle cx="${cx+22}" cy="${cy+2}" r="8"  fill="#aaaaaa" stroke="#777" stroke-width="0.8"/>
  <circle cx="${cx+22}" cy="${cy+2}" r="4"  fill="#888"/>
  <!-- ピンヘッダ -->
  <rect x="${cx-40}" y="${cx+8}" width="80" height="6" fill="#222" rx="1"/>
  <text x="${cx}" y="${cy+50}" text-anchor="middle" class="cv-lbl">HC-SR04</text>
</g>`;
      }
    },

    // ── DHT22 温湿度センサー ──────────────────────────────
    DHT22: {
      pins: { VCC: { dx: -18, dy: 38 }, SIG: { dx: 0, dy: 38 }, GND: { dx: 18, dy: 38 } },
      draw(cx, cy) {
        const slits = Array.from({ length: 6 }, (_, i) =>
          `<rect x="${cx-17}" y="${cy-22+i*5}" width="34" height="2.5" fill="#90caf9" rx="1" opacity="0.55"/>`
        ).join('');
        return `<g filter="url(#fDrop)">
  <!-- 本体 (青) -->
  <rect x="${cx-26}" y="${cy-34}" width="52" height="66" fill="url(#gPcbBlue)" stroke="#0d47a1" stroke-width="1.5" rx="6"/>
  <!-- 窓 (白) -->
  <rect x="${cx-20}" y="${cy-28}" width="40" height="34" fill="#fff" rx="3"/>
  <!-- スリット -->
  ${slits}
  <!-- ラベル -->
  <text x="${cx}" y="${cy+14}" text-anchor="middle" font-size="8"   fill="#fff" font-weight="bold">DHT22</text>
  <text x="${cx}" y="${cy+24}" text-anchor="middle" font-size="7.5" fill="#90caf9">Temp / Humi</text>
  <!-- ピン (3本) -->
  <line x1="${cx-18}" y1="${cy+32}" x2="${cx-18}" y2="${cy+38}" stroke="#d0d0d0" stroke-width="2"/>
  <line x1="${cx}"    y1="${cy+32}" x2="${cx}"    y2="${cy+38}" stroke="#d0d0d0" stroke-width="2"/>
  <line x1="${cx+18}" y1="${cy+32}" x2="${cx+18}" y2="${cy+38}" stroke="#d0d0d0" stroke-width="2"/>
  <text x="${cx}" y="${cy+52}" text-anchor="middle" class="cv-lbl">DHT22</text>
</g>`;
      }
    },

    // ── LCD1602 I2C ──────────────────────────────────────
    LCD: {
      pins: { GND: { dx: -46, dy: 34 }, VCC: { dx: -15, dy: 34 }, SDA: { dx: 15, dy: 34 }, SCL: { dx: 46, dy: 34 } },
      draw(cx, cy) {
        const cells = [];
        for (let r = 0; r < 2; r++) for (let c = 0; c < 16; c++) {
          cells.push(`<rect x="${cx-51+c*6.8}" y="${cy-20+r*14}" width="5.8" height="10" fill="#4dd0e1" rx="1" opacity="0.5"/>`);
        }
        return `<g filter="url(#fDrop)">
  <!-- PCB -->
  <rect x="${cx-62}" y="${cy-32}" width="124" height="62" fill="url(#gPcbGreen)" stroke="#1b5e20" stroke-width="1.5" rx="4"/>
  <!-- ディスプレイベゼル -->
  <rect x="${cx-58}" y="${cy-28}" width="116" height="54" fill="#0a1f0a" stroke="#1b5e20" stroke-width="0.8" rx="2"/>
  <!-- バックライト領域 -->
  <rect x="${cx-54}" y="${cy-24}" width="108" height="46" fill="#002020" rx="2"/>
  <!-- ピクセルセル -->
  ${cells.join('')}
  <!-- I2C チップ (小) -->
  <rect x="${cx+38}" y="${cy-24}" width="18" height="14" fill="#1a1a1a" stroke="#333" stroke-width="0.5" rx="1"/>
  <!-- コントラストトリマー -->
  <rect x="${cx-58}" y="${cy-8}" width="8" height="8" fill="#1565C0" stroke="#0d47a1" stroke-width="0.5" rx="1"/>
  <!-- リード -->
  <text x="${cx}" y="${cy+48}" text-anchor="middle" class="cv-lbl">LCD1602 (I2C)</text>
</g>`;
      }
    },

    // ── 7セグメント LED ───────────────────────────────────
    SEG7: {
      pins: { COM: { dx: 0, dy: 46 } },
      draw(cx, cy) {
        return `<g filter="url(#fDrop)">
  <!-- ハウジング -->
  <rect x="${cx-34}" y="${cy-42}" width="68" height="82" fill="#1c1c1c" stroke="#2a2a2a" stroke-width="1.5" rx="4"/>
  <!-- ウィンドウ -->
  <rect x="${cx-30}" y="${cy-38}" width="60" height="74" fill="#0a0a0a" rx="2"/>
  <!-- セグメント A (上横) -->
  <rect x="${cx-20}" y="${cy-34}" width="40" height="8" fill="#ff5722" rx="4" opacity="0.9"/>
  <!-- セグメント B (右上縦) -->
  <rect x="${cx+12}" y="${cy-28}" width="8" height="27" fill="#ff5722" rx="4" opacity="0.9"/>
  <!-- セグメント C (右下縦) -->
  <rect x="${cx+12}" y="${cy+2}"  width="8" height="27" fill="#ff5722" rx="4" opacity="0.9"/>
  <!-- セグメント D (下横) -->
  <rect x="${cx-20}" y="${cy+27}" width="40" height="8"  fill="#ff5722" rx="4" opacity="0.9"/>
  <!-- セグメント E (左下縦) -->
  <rect x="${cx-20}" y="${cy+2}"  width="8" height="27" fill="#ff5722" rx="4" opacity="0.9"/>
  <!-- セグメント F (左上縦) -->
  <rect x="${cx-20}" y="${cy-28}" width="8" height="27" fill="#ff5722" rx="4" opacity="0.9"/>
  <!-- セグメント G (中横) -->
  <rect x="${cx-20}" y="${cy-4}"  width="40" height="8"  fill="#ff5722" rx="4" opacity="0.9"/>
  <!-- DP -->
  <circle cx="${cx+25}" cy="${cy+32}" r="4" fill="#ff5722" opacity="0.9"/>
  <!-- グロー効果 -->
  <rect x="${cx-20}" y="${cy-34}" width="40" height="8"  fill="#ff5722" rx="4" opacity="0.2" filter="url(#fDrop)"/>
  <text x="${cx}" y="${cy+60}" text-anchor="middle" class="cv-lbl">7-Segment</text>
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
  <text x="${cx}" y="${cy+24}" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">ULN2003A</text>
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
  <text x="${cx}" y="${cy+50}" text-anchor="middle" class="cv-lbl">28BYJ-48 + ULN2003</text>
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
  <text x="${cx}" y="${cy+3}"  text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">L298N</text>
  <!-- ターミナルブロック (モーター出力) -->
  <rect x="${cx-46}" y="${cy-4}" width="14" height="12" fill="#1565C0" stroke="#0d47a1" stroke-width="0.8" rx="1"/>
  <rect x="${cx+32}" y="${cy-4}" width="14" height="12" fill="#1565C0" stroke="#0d47a1" stroke-width="0.8" rx="1"/>
  <!-- LED -->
  <circle cx="${cx-32}" cy="${cx+16}" r="3.5" fill="#00e676" stroke="#00c853" stroke-width="0.5"/>
  <text x="${cx}" y="${cy+48}" text-anchor="middle" class="cv-lbl">DC Motor (L298N)</text>
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
    p.push(`<text x="${PX+PW/2}" y="${chipY+14}" text-anchor="middle" font-size="5.5" fill="#555">RP2040</text>`);
    // LED チップ
    p.push(`<circle cx="${PX+PW/2-22}" cy="${PY+20}" r="3" fill="#00e676" stroke="#00c853" stroke-width="0.5"/>`);
    // Pico ラベル
    p.push(`<text x="${PX+PW/2}" y="${PY+PH-10}" text-anchor="middle" font-size="7" fill="#a5d6a7" font-weight="bold">Pico</text>`);

    // 左ピンラベル・接続点
    L_PINS.forEach((name, i) => {
      const py = PY + 12 + i * PP;
      const isGnd = name === 'GND';
      const col = isGnd ? '#78909c' : '#FFD54F';
      p.push(`<circle cx="${PX}" cy="${py}" r="3" fill="${col}" stroke="#222" stroke-width="0.5"/>`);
      p.push(`<text x="${PX-12}" y="${py+3.5}" text-anchor="end" font-size="6.5" fill="#90a4ae">${name}</text>`);
    });
    // 右ピンラベル・接続点
    R_PINS.forEach((name, i) => {
      const py = PY + 12 + i * PP;
      const rx = PX + PW;
      const isGnd = name === 'GND' || name === 'AGND';
      const isPwr = ['3V3','VSYS','VBUS'].includes(name);
      const col = isGnd ? '#78909c' : isPwr ? '#e57373' : '#FFD54F';
      p.push(`<circle cx="${rx}" cy="${py}" r="3" fill="${col}" stroke="#222" stroke-width="0.5"/>`);
      p.push(`<text x="${rx+12}" y="${py+3.5}" text-anchor="start" font-size="6.5" fill="#90a4ae">${name}</text>`);
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
      els.push(`<text x="${mx}" y="${my-10}" text-anchor="middle" fill="#30363d" font-size="13">MicroPython ブロックを追加すると</text>`);
      els.push(`<text x="${mx}" y="${my+10}" text-anchor="middle" fill="#30363d" font-size="13">配線図が表示されます</text>`);
    }

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
<style>.cv-lbl{font-size:8.5px;fill:#90a4ae;font-family:sans-serif}</style>
${DEFS}
${els.join('\n')}
</svg>`;

    return { svg: svgStr, compCount: comps.length, wireCount };
  };

})();
