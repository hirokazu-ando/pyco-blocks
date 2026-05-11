// ===== 実態配線図ジェネレーター (Phase 1) =====
// Blocklyワークスペースのブロックを解析してSVG配線図を生成する

(() => {
  'use strict';

  // ===== Pico 物理レイアウト定数 =====
  const PX = 100;        // Pico本体 left edge
  const PY = 30;         // Pico本体 top edge
  const PW = 88;         // Pico本体 width
  const PP = 19;         // ピンピッチ (px)
  const PC = 20;         // ピン数 (片側)
  const PH = (PC - 1) * PP + 24;

  // 左側ピン (上→下, pin 1→20)
  const L_PINS = [
    'GP0','GP1','GND','GP2','GP3','GP4','GND','GP5',
    'GP6','GP7','GP8','GND','GP9','GP10','GP11','GP12',
    'GND','GP13','GP14','GP15'
  ];
  // 右側ピン (上→下, pin 40→21)
  const R_PINS = [
    'VBUS','VSYS','GND','3V3_EN','3V3','ADC_REF','GP28','AGND',
    'GP27','GP26','RUN','GP22','GP21','GP20','GND','GP19',
    'GP18','GND','GP17','GP16'
  ];

  // GP番号 → {x, y, side}
  function gpCoord(gpNum) {
    const n = parseInt(gpNum);
    const li = L_PINS.indexOf('GP' + n);
    if (li >= 0) return { x: PX, y: PY + 12 + li * PP, side: 'left' };
    const ri = R_PINS.indexOf('GP' + n);
    if (ri >= 0) return { x: PX + PW, y: PY + 12 + ri * PP, side: 'right' };
    return null;
  }
  const GND_COORD  = { x: PX, y: PY + 12 + 2 * PP, side: 'left'  }; // 左 pin3
  const V3V3_COORD = { x: PX + PW, y: PY + 12 + 4 * PP, side: 'right' }; // 右 pin36

  function picoCoordOf(spec) {
    if (!spec) return null;
    if (spec.gp  != null) return gpCoord(spec.gp);
    if (spec.gnd)         return GND_COORD;
    if (spec.v3v3)        return V3V3_COORD;
    return null;
  }

  // ===== コンポーネント配置 =====
  const CX0   = PX + PW + 110; // components 開始 x
  const CY0   = PY + 10;
  const C_COLS = 3;
  const C_CW   = 185;
  const C_CH   = 145;

  // ===== SVGシンボル定義 =====
  // pins: {pinName: {dx, dy}} (コンポーネント中心からのオフセット)
  // draw(cx, cy): SVG文字列を返す

  const SYM = {

    LED: {
      pins: { A: { dx: -36, dy: 0 }, C: { dx: 36, dy: 0 } },
      draw(cx, cy) {
        return `<g>
  <rect x="${cx-24}" y="${cy-5}" width="14" height="10" fill="#c9a96e" stroke="#666" stroke-width="1" rx="2"/>
  <line x1="${cx-36}" y1="${cy}" x2="${cx-24}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <line x1="${cx-10}" y1="${cy}" x2="${cx+6}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <polygon points="${cx+6},${cy-13} ${cx+6},${cy+13} ${cx+22},${cy}" fill="#e53935" stroke="#b71c1c" stroke-width="1.2"/>
  <line x1="${cx+22}" y1="${cy-14}" x2="${cx+22}" y2="${cy+14}" stroke="#b71c1c" stroke-width="1.8"/>
  <line x1="${cx+22}" y1="${cy}" x2="${cx+36}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <line x1="${cx+24}" y1="${cy-7}" x2="${cx+34}" y2="${cy-18}" stroke="#FFD54F" stroke-width="1.3"/>
  <line x1="${cx+29}" y1="${cy-4}" x2="${cx+39}" y2="${cy-15}" stroke="#FFD54F" stroke-width="1.3"/>
  <text x="${cx}" y="${cy+28}" text-anchor="middle" class="cv-lbl">LED</text>
</g>`;
      }
    },

    BTN: {
      pins: { VCC: { dx: -28, dy: 0 }, SIG: { dx: 28, dy: 0 } },
      draw(cx, cy) {
        return `<g>
  <rect x="${cx-18}" y="${cy-18}" width="36" height="36" fill="#fafafa" stroke="#555" stroke-width="1.5" rx="3"/>
  <circle cx="${cx}" cy="${cy}" r="10" fill="#e0e0e0" stroke="#555" stroke-width="1.2"/>
  <circle cx="${cx}" cy="${cy}" r="4" fill="#bdbdbd"/>
  <line x1="${cx-28}" y1="${cy}" x2="${cx-18}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <line x1="${cx+18}" y1="${cy}" x2="${cx+28}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <text x="${cx}" y="${cy+30}" text-anchor="middle" class="cv-lbl">Button</text>
</g>`;
      }
    },

    POT: {
      pins: { VCC: { dx: -28, dy: 0 }, SIG: { dx: 0, dy: 32 }, GND: { dx: 28, dy: 0 } },
      draw(cx, cy) {
        return `<g>
  <rect x="${cx-22}" y="${cy-22}" width="44" height="44" fill="#b3e5fc" stroke="#0277bd" stroke-width="1.5" rx="4"/>
  <line x1="${cx-28}" y1="${cy}" x2="${cx-22}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <line x1="${cx+22}" y1="${cy}" x2="${cx+28}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <polygon points="${cx-6},${cy-4} ${cx+6},${cy-4} ${cx},${cy+8}" fill="#0277bd"/>
  <line x1="${cx}" y1="${cy+8}" x2="${cx}" y2="${cy+32}" stroke="#aaa" stroke-width="1.5"/>
  <text x="${cx}" y="${cy+46}" text-anchor="middle" class="cv-lbl">POT</text>
</g>`;
      }
    },

    BUZZ: {
      pins: { SIG: { dx: -26, dy: 0 }, GND: { dx: 26, dy: 0 } },
      draw(cx, cy) {
        return `<g>
  <circle cx="${cx}" cy="${cy}" r="20" fill="#424242" stroke="#212121" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="7" fill="#616161"/>
  <line x1="${cx-26}" y1="${cy}" x2="${cx-20}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <line x1="${cx+20}" y1="${cy}" x2="${cx+26}" y2="${cy}" stroke="#aaa" stroke-width="1.5"/>
  <text x="${cx}" y="${cy+32}" text-anchor="middle" class="cv-lbl">Buzzer</text>
</g>`;
      }
    },

    SERVO: {
      pins: { GND: { dx: -20, dy: 40 }, VCC: { dx: 0, dy: 40 }, PWM: { dx: 20, dy: 40 } },
      draw(cx, cy) {
        return `<g>
  <rect x="${cx-32}" y="${cy-28}" width="64" height="52" fill="#f5f5f5" stroke="#757575" stroke-width="1.5" rx="5"/>
  <circle cx="${cx+14}" cy="${cy-8}" r="15" fill="#e0e0e0" stroke="#757575" stroke-width="1.2"/>
  <circle cx="${cx+14}" cy="${cy-8}" r="5" fill="#9e9e9e"/>
  <rect x="${cx+9}" y="${cy-26}" width="20" height="7" fill="#bdbdbd" stroke="#757575" stroke-width="1" rx="2"/>
  <line x1="${cx-20}" y1="${cy+24}" x2="${cx-20}" y2="${cy+40}" stroke="#111" stroke-width="3"/>
  <line x1="${cx}"    y1="${cy+24}" x2="${cx}"    y2="${cy+40}" stroke="#e53935" stroke-width="3"/>
  <line x1="${cx+20}" y1="${cy+24}" x2="${cx+20}" y2="${cy+40}" stroke="#f57f17" stroke-width="3"/>
  <text x="${cx}" y="${cy+54}" text-anchor="middle" class="cv-lbl">Servo</text>
</g>`;
      }
    },

    HCSR04: {
      pins: { VCC: { dx: -36, dy: 30 }, TRIG: { dx: -12, dy: 30 }, ECHO: { dx: 12, dy: 30 }, GND: { dx: 36, dy: 30 } },
      draw(cx, cy) {
        return `<g>
  <rect x="${cx-46}" y="${cy-24}" width="92" height="50" fill="#2e7d32" stroke="#1b5e20" stroke-width="1.5" rx="4"/>
  <circle cx="${cx-20}" cy="${cy}" r="15" fill="#c8e6c9" stroke="#388e3c" stroke-width="1.2"/>
  <circle cx="${cx+20}" cy="${cy}" r="15" fill="#c8e6c9" stroke="#388e3c" stroke-width="1.2"/>
  <circle cx="${cx-20}" cy="${cy}" r="9" fill="#388e3c"/>
  <circle cx="${cx+20}" cy="${cy}" r="9" fill="#388e3c"/>
  <text x="${cx-20}" y="${cy+4}" text-anchor="middle" font-size="7" fill="#fff">T</text>
  <text x="${cx+20}" y="${cy+4}" text-anchor="middle" font-size="7" fill="#fff">E</text>
  <text x="${cx}" y="${cy+46}" text-anchor="middle" class="cv-lbl">HC-SR04</text>
</g>`;
      }
    },

    DHT22: {
      pins: { VCC: { dx: -18, dy: 34 }, SIG: { dx: 0, dy: 34 }, GND: { dx: 18, dy: 34 } },
      draw(cx, cy) {
        return `<g>
  <rect x="${cx-24}" y="${cy-30}" width="48" height="58" fill="#1565C0" stroke="#0d47a1" stroke-width="1.5" rx="5"/>
  <rect x="${cx-20}" y="${cy-26}" width="40" height="20" fill="#fff" rx="2"/>
  <text x="${cx}" y="${cy-12}" text-anchor="middle" font-size="7.5" fill="#333">DHT22</text>
  <text x="${cx}" y="${cy+2}"  text-anchor="middle" font-size="9"   fill="#fff">🌡</text>
  <text x="${cx}" y="${cy+16}" text-anchor="middle" font-size="9"   fill="#fff">💧</text>
  <text x="${cx}" y="${cy+48}" text-anchor="middle" class="cv-lbl">DHT22</text>
</g>`;
      }
    },

    LCD: {
      pins: { GND: { dx: -44, dy: 30 }, VCC: { dx: -15, dy: 30 }, SDA: { dx: 15, dy: 30 }, SCL: { dx: 44, dy: 30 } },
      draw(cx, cy) {
        const cells = [];
        for (let r = 0; r < 2; r++) for (let c = 0; c < 16; c++) {
          cells.push(`<rect x="${cx - 50 + c * 6}" y="${cy - 22 + r * 14}" width="5" height="10" fill="#4fc3f7" rx="1" opacity="0.55"/>`);
        }
        return `<g>
  <rect x="${cx-58}" y="${cy-28}" width="116" height="52" fill="#1a237e" stroke="#283593" stroke-width="1.5" rx="3"/>
  ${cells.join('')}
  <text x="${cx}" y="${cy+46}" text-anchor="middle" class="cv-lbl">LCD1602 (I2C)</text>
</g>`;
      }
    },

    SEG7: {
      pins: { COM: { dx: 0, dy: 42 } },
      draw(cx, cy) {
        // 8の字 (全セグメント点灯)
        return `<g>
  <rect x="${cx-30}" y="${cy-38}" width="60" height="72" fill="#111" stroke="#333" stroke-width="1.5" rx="3"/>
  <rect x="${cx-18}" y="${cy-34}" width="36" height="7"  fill="#e53935" rx="3"/>
  <rect x="${cx+10}" y="${cy-29}" width="7"  height="26" fill="#e53935" rx="3"/>
  <rect x="${cx+10}" y="${cy+1}"  width="7"  height="26" fill="#e53935" rx="3"/>
  <rect x="${cx-18}" y="${cy+25}" width="36" height="7"  fill="#e53935" rx="3"/>
  <rect x="${cx-18}" y="${cy+1}"  width="7"  height="26" fill="#e53935" rx="3"/>
  <rect x="${cx-18}" y="${cy-29}" width="7"  height="26" fill="#e53935" rx="3"/>
  <rect x="${cx-18}" y="${cy-4}"  width="36" height="7"  fill="#e53935" rx="3"/>
  <text x="${cx}" y="${cy+56}" text-anchor="middle" class="cv-lbl">7-SEG</text>
</g>`;
      }
    },

    STEPPER: {
      pins: { IN1: { dx: -38, dy: 32 }, IN2: { dx: -13, dy: 32 }, IN3: { dx: 13, dy: 32 }, IN4: { dx: 38, dy: 32 } },
      draw(cx, cy) {
        return `<g>
  <rect x="${cx-46}" y="${cy-28}" width="92" height="54" fill="#6d4c41" stroke="#4e342e" stroke-width="1.5" rx="4"/>
  <circle cx="${cx}" cy="${cy}" r="18" fill="#4e342e" stroke="#bcaaa4" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="6" fill="#795548"/>
  <rect x="${cx-3}" y="${cy-26}" width="6" height="10" fill="#bcaaa4" rx="1"/>
  <text x="${cx}" y="${cy+46}" text-anchor="middle" class="cv-lbl">Stepper+ULN2003</text>
</g>`;
      }
    },

    L298N: {
      pins: { IN1: { dx: -30, dy: 30 }, IN2: { dx: -10, dy: 30 }, EN: { dx: 10, dy: 30 }, GND: { dx: 30, dy: 30 } },
      draw(cx, cy) {
        return `<g>
  <rect x="${cx-44}" y="${cy-26}" width="88" height="48" fill="#b71c1c" stroke="#7f0000" stroke-width="1.5" rx="4"/>
  <text x="${cx}" y="${cy-8}"  text-anchor="middle" font-size="11" font-weight="bold" fill="#fff">L298N</text>
  <text x="${cx}" y="${cy+8}"  text-anchor="middle" font-size="8"  fill="#ffcdd2">DC Motor Driver</text>
  <text x="${cx}" y="${cy+44}" text-anchor="middle" class="cv-lbl">DC Motor</text>
</g>`;
      }
    },
  };

  // ===== ブロック解析 =====
  function parseBlocks(workspace) {
    const comps = [];
    const seen  = new Set();

    function add(key, type, pins, label) {
      if (seen.has(key)) return;
      seen.add(key);
      comps.push({ type, pins, label });
    }

    workspace.getAllBlocks(false)
      .filter(b => !b.isInsertionMarker())
      .forEach(b => {
        const t  = b.type;
        const gf = n => b.getFieldValue(n);

        if (['pico_led_on','pico_led_off','pico_digital_write','pico_pwm_write'].includes(t)) {
          const p = gf('PIN');
          add('led' + p, 'LED', { A: { gp: p }, C: { gnd: true } }, 'LED (GP' + p + ')');

        } else if (['pico_digital_read','pico_digital_read_val'].includes(t)) {
          const p = gf('PIN');
          add('btn' + p, 'BTN', { SIG: { gp: p }, VCC: { v3v3: true } }, 'Button (GP' + p + ')');

        } else if (['pico_analog_read','pico_analog_read_val'].includes(t)) {
          const p = gf('PIN');
          add('pot' + p, 'POT', { SIG: { gp: p }, VCC: { v3v3: true }, GND: { gnd: true } }, 'POT (GP' + p + ')');

        } else if (['pico_buzzer_tone','pico_buzzer_stop'].includes(t)) {
          const p = gf('PIN');
          add('buzz' + p, 'BUZZ', { SIG: { gp: p }, GND: { gnd: true } }, 'Buzzer (GP' + p + ')');

        } else if (t === 'pico_servo_angle') {
          const p = gf('PIN');
          add('servo' + p, 'SERVO', { PWM: { gp: p }, VCC: { v3v3: true }, GND: { gnd: true } }, 'Servo (GP' + p + ')');

        } else if (['pico_ultrasonic_cm','pico_ultrasonic_cm_val'].includes(t)) {
          const trig = gf('TRIG'), echo = gf('ECHO');
          add('hcsr04_' + trig + '_' + echo, 'HCSR04',
            { VCC: { v3v3: true }, TRIG: { gp: trig }, ECHO: { gp: echo }, GND: { gnd: true } }, 'HC-SR04');

        } else if (t === 'pico_dht_read') {
          const p = gf('PIN');
          add('dht' + p, 'DHT22', { VCC: { v3v3: true }, SIG: { gp: p }, GND: { gnd: true } }, 'DHT22 (GP' + p + ')');

        } else if (t === 'pico_lcd_init') {
          const sda = gf('SDA'), scl = gf('SCL');
          add('lcd_' + sda + '_' + scl, 'LCD',
            { GND: { gnd: true }, VCC: { v3v3: true }, SDA: { gp: sda }, SCL: { gp: scl } }, 'LCD1602');

        } else if (t === 'pico_7seg_show') {
          const ps = gf('PINS').split(',').map(s => s.trim());
          const pins = { COM: { gnd: true } };
          ['A','B','C','D','E','F','G'].forEach((s, i) => { if (ps[i]) pins[s] = { gp: ps[i] }; });
          add('seg7', 'SEG7', pins, '7-SEG');

        } else if (['pico_dcmotor_run','pico_dcmotor_stop'].includes(t)) {
          const in1 = gf('IN1'), in2 = gf('IN2');
          const en  = b.getFieldValue('EN');
          add('l298n_' + in1 + '_' + in2, 'L298N',
            { IN1: { gp: in1 }, IN2: { gp: in2 }, EN: en ? { gp: en } : null, GND: { gnd: true } }, 'DC Motor');

        } else if (['pico_stepper_step','pico_stepper_angle'].includes(t)) {
          const ps = gf('PINS').split(',').map(s => s.trim());
          add('step_' + ps.join('_'), 'STEPPER',
            { IN1: { gp: ps[0] }, IN2: { gp: ps[1] }, IN3: { gp: ps[2] }, IN4: { gp: ps[3] } }, 'Stepper');
        }
      });

    return comps;
  }

  // ===== レイアウト =====
  function layoutComps(comps) {
    comps.forEach((c, i) => {
      c.cx = CX0 + (i % C_COLS) * C_CW + 72;
      c.cy = CY0 + Math.floor(i / C_COLS) * C_CH + 56;
    });
  }

  // ===== ワイヤー描画 =====
  function wirePath(x1, y1, side, x2, y2) {
    // ベジェ曲線: 左ピンは左へ伸ばしてから右へ回る
    let cp1x, cp2x;
    const spread = Math.max(70, Math.abs(x2 - x1) * 0.55);
    if (side === 'right') {
      cp1x = x1 + spread;
      cp2x = x2 - 50;
    } else {
      cp1x = x1 - 110;
      cp2x = x2 - 60;
    }
    return `M${x1},${y1} C${cp1x},${y1} ${cp2x},${y2} ${x2},${y2}`;
  }

  function wireColor(spec) {
    if (spec.gnd)  return '#455a64';
    if (spec.v3v3) return '#e53935';
    return '#43a047';
  }

  // ===== Pico SVG =====
  function buildPicoSVG() {
    const parts = [];
    // 本体
    parts.push(`<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" fill="#2e7d32" stroke="#1b5e20" stroke-width="2.5" rx="5"/>`);
    parts.push(`<rect x="${PX+6}" y="${PY+6}" width="${PW-12}" height="${PH-12}" fill="none" stroke="#1b5e20" stroke-width="0.5" rx="3"/>`);
    parts.push(`<text x="${PX+PW/2}" y="${PY+PH/2-7}" text-anchor="middle" font-size="8.5" fill="#a5d6a7" font-weight="bold">Raspberry</text>`);
    parts.push(`<text x="${PX+PW/2}" y="${PY+PH/2+7}" text-anchor="middle" font-size="8.5" fill="#a5d6a7" font-weight="bold">Pi Pico</text>`);

    // 左ピン
    L_PINS.forEach((name, i) => {
      const py = PY + 12 + i * PP;
      const isGnd = name === 'GND';
      const col = isGnd ? '#546e7a' : '#FFD54F';
      parts.push(`<line x1="${PX-10}" y1="${py}" x2="${PX}" y2="${py}" stroke="#78909c" stroke-width="1.2"/>`);
      parts.push(`<circle cx="${PX}" cy="${py}" r="3" fill="${col}" stroke="#222" stroke-width="0.5"/>`);
      parts.push(`<text x="${PX-12}" y="${py+3.5}" text-anchor="end" font-size="6.5" fill="#90a4ae">${name}</text>`);
    });

    // 右ピン
    R_PINS.forEach((name, i) => {
      const py = PY + 12 + i * PP;
      const rx = PX + PW;
      const isGnd = name === 'GND' || name === 'AGND';
      const isPwr = name === '3V3' || name === 'VSYS' || name === 'VBUS';
      const col   = isGnd ? '#546e7a' : isPwr ? '#e57373' : '#FFD54F';
      parts.push(`<line x1="${rx}" y1="${py}" x2="${rx+10}" y2="${py}" stroke="#78909c" stroke-width="1.2"/>`);
      parts.push(`<circle cx="${rx}" cy="${py}" r="3" fill="${col}" stroke="#222" stroke-width="0.5"/>`);
      parts.push(`<text x="${rx+12}" y="${py+3.5}" text-anchor="start" font-size="6.5" fill="#90a4ae">${name}</text>`);
    });

    return parts.join('\n');
  }

  // ===== メイン =====
  window.generateCircuitSVG = function(workspace) {
    const comps = parseBlocks(workspace);
    layoutComps(comps);

    const numRows = Math.max(1, Math.ceil(comps.length / C_COLS));
    const svgW = CX0 + C_COLS * C_CW + 30;
    const svgH = Math.max(PY + PH + 30, CY0 + numRows * C_CH + 20);

    let wireCount = 0;
    const els = [];

    // 背景
    els.push(`<rect width="${svgW}" height="${svgH}" fill="#0d1117"/>`);
    // 薄いグリッド
    for (let gx = 0; gx < svgW; gx += 40) els.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${svgH}" stroke="#161b22" stroke-width="1"/>`);
    for (let gy = 0; gy < svgH; gy += 40) els.push(`<line x1="0" y1="${gy}" x2="${svgW}" y2="${gy}" stroke="#161b22" stroke-width="1"/>`);

    // ワイヤー (Picoより前に描画)
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
        els.push(`<path d="${wirePath(pc.x, pc.y, pc.side, comp.cx + sp.dx, comp.cy + sp.dy)}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" opacity="0.88"/>`);
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

    // 空の場合
    if (comps.length === 0) {
      const mx = svgW / 2, my = svgH / 2;
      els.push(`<text x="${mx}" y="${my-10}" text-anchor="middle" fill="#30363d" font-size="13">MicroPython ブロックを追加すると</text>`);
      els.push(`<text x="${mx}" y="${my+10}" text-anchor="middle" fill="#30363d" font-size="13">配線図が表示されます</text>`);
    }

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
<style>.cv-lbl{font-size:8.5px;fill:#90a4ae;font-family:sans-serif}</style>
${els.join('\n')}
</svg>`;

    return { svg: svgStr, compCount: comps.length, wireCount };
  };

})();
