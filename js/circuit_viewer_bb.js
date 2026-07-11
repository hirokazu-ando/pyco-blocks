// ===== ブレッドボード型 実態配線図レンダラ (Phase 2) =====
//
// window.generateCircuitSVG(workspace, {overrides, wireOverrides})
//   → { svg, compCount, wireCount }   （旧 circuit_viewer.js と同一契約）
//
// 既定でこの新レンダラを使う。?cv=legacy を付けると本ファイルは何もせず、
// 先に読み込まれた circuit_viewer.js の旧レンダラがそのまま生きる。
//
// 品質基準: 電子工作のきほん #05 実体配線図（bb_render.js + wokwi 部品）。
//   - LED は点灯表現（value=1 のグロー）・脚を開いて別列に挿す
//   - 抵抗は盤面に寝かせて両脚を穴へ
//   - 配線は自然なたわみの弧・太め・穴に着地。赤=＋/黒=−/信号色
//   - モジュール（LCD/サーボ/モーター/電源等）はボード外に置き弧で接続
//
// 部品アート: js/circuit_parts_data.js（tools/extract_wokwi_parts.py 生成）。
//   Pico は自作SVG（外部アート非依存・実機準拠・ピン名照合済み）。
//
(function () {
  'use strict';

  // ---- ?cv=legacy なら旧レンダラを温存して撤退 ----
  try {
    var _p = (typeof location !== 'undefined')
      ? new URLSearchParams(location.search) : null;
    if (_p && _p.get('cv') === 'legacy') return;
  } catch (e) { /* location 不在環境は新レンダラを使う */ }

  var PARTS = (typeof window !== 'undefined' && window.PYCO_CIRCUIT_PARTS) || {};

  // ============================================================
  //  幾何定数
  //  PITCH=16px = 実機の 0.1inch(2.54mm)。wokwi 部品は 9.6px/0.1in で
  //  作画されているため、格子整合スケール SCL=PITCH/9.6 を基準にする。
  // ============================================================
  var PITCH = 16;
  var SCL = PITCH / 9.6;                // ≒1.667（2.54mmピッチ整合の基準スケール）
  var HOLE = Math.max(5, Math.round(PITCH * 0.4));
  var BX = 40, BY = 40;
  var TRENCH = 3 * PITCH;               // 中央溝 = 0.3inch（実機・DIP整合）

  function rowYs() {
    var ys = {}, y = 16;
    ys['t-'] = y; y += PITCH;
    ys['t+'] = y; y += Math.round(PITCH * 1.8);
    'abcde'.split('').forEach(function (r) { ys[r] = y; y += PITCH; });
    y += TRENCH - PITCH;                 // e→f の合計が TRENCH になるように
    'fghij'.split('').forEach(function (r) { ys[r] = y; y += PITCH; });
    y += Math.round(PITCH * 0.8);
    ys['b+'] = y; y += PITCH;
    ys['b-'] = y; y += 16;
    return { ys: ys, h: y };
  }

  function railXFn(cols) {
    var boardW = 2 * 18 + (cols - 1) * PITCH + 8;
    var railM = 10, availW = boardW - 2 * railM;
    var gap = 2 * PITCH;
    if (20 * PITCH + 4 * gap > availW)
      gap = Math.max(PITCH * 0.5, (availW - 20 * PITCH) / 4);
    var span = 20 * PITCH + 4 * gap;
    return function (k) {
      return BX + (boardW - span) / 2 +
        Math.floor((k - 1) / 5) * (4 * PITCH + gap) + ((k - 1) % 5) * PITCH;
    };
  }

  function hole(x, y) {
    return '<rect x="' + (x - HOLE / 2) + '" y="' + (y - HOLE / 2) + '" width="' + HOLE +
      '" height="' + HOLE + '" rx="1.5" fill="#40454d"/>';
  }

  function makeBoard(cols) {
    var lay = rowYs();
    var ys = lay.ys;
    var boardW = 2 * 18 + (cols - 1) * PITCH + 8;
    var boardH = lay.h;
    var POINTS = {};
    var svg = [];
    var rx = railXFn(cols);

    svg.push('<rect x="' + BX + '" y="' + BY + '" width="' + boardW +
      '" height="' + boardH + '" rx="8" fill="#f6f4ee" stroke="#cbc6bb" stroke-width="1.5"/>');
    var gapTop = BY + ys['e'] + HOLE / 2, gapBot = BY + ys['f'] - HOLE / 2;
    var chH = Math.max(10, Math.round((gapBot - gapTop) * 0.6));
    svg.push('<rect x="' + BX + '" y="' + ((gapTop + gapBot) / 2 - chH / 2) +
      '" width="' + boardW + '" height="' + chH + '" fill="#e5e1d7"/>');

    [['t-', '#3a86e0', '−'], ['t+', '#d24a4a', '+'],
     ['b+', '#d24a4a', '+'], ['b-', '#3a86e0', '−']].forEach(function (row) {
      var rk = row[0], color = row[1], sign = row[2];
      var y = BY + ys[rk];
      var x1 = rx(1) - 8, x2 = rx(25) + 8;
      var outer = (rk === 't-' || rk === 'b+') ? -7 : 7;
      svg.push('<line x1="' + x1 + '" y1="' + (y + outer) + '" x2="' + x2 +
        '" y2="' + (y + outer) + '" stroke="' + color + '" stroke-width="2"/>');
      svg.push('<text x="' + (x1 - 12) + '" y="' + (y + 5) + '" fill="' + color +
        '" font-size="14" font-weight="bold" text-anchor="middle">' + sign + '</text>');
      for (var k = 1; k <= 25; k++) {
        var hx = rx(k);
        svg.push(hole(hx, y));
        POINTS[rk + '.' + k] = { x: hx, y: y };
      }
    });

    'abcdefghij'.split('').forEach(function (r) {
      var y = BY + ys[r];
      for (var c = 1; c <= cols; c++) {
        var hx = BX + 18 + 4 + (c - 1) * PITCH;
        svg.push(hole(hx, y));
        POINTS[r + c] = { x: hx, y: y };
      }
    });
    for (var c2 = 5; c2 <= cols; c2 += 5) {
      var hx2 = BX + 18 + 4 + (c2 - 1) * PITCH;
      svg.push('<text x="' + hx2 + '" y="' + (BY + ys['a'] - 8) +
        '" fill="#9a9484" font-size="10" text-anchor="middle">' + c2 + '</text>');
    }
    ['a', 'j'].forEach(function (r) {
      svg.push('<text x="' + (BX + 7) + '" y="' + (BY + ys[r] + 4) +
        '" fill="#9a9484" font-size="10">' + r + '</text>');
    });

    return { POINTS: POINTS, svg: svg.join('\n'), w: boardW, h: boardH, ys: ys, railX: rx, cols: cols };
  }

  // ============================================================
  //  ユーティリティ
  // ============================================================
  function r2(v) { return Math.round(v * 100) / 100; }
  function r4(v) { return Math.round(v * 10000) / 10000; }

  var _uid = 0;
  function nsIds(inner, prefix) {
    var ids = {};
    inner.replace(/\bid="([^"]+)"/g, function (m, id) { ids[id] = prefix + id; return m; });
    var out = inner;
    Object.keys(ids).forEach(function (id) {
      var nid = ids[id];
      out = out.replace(new RegExp('id="' + escRe(id) + '"', 'g'), 'id="' + nid + '"');
      out = out.replace(new RegExp('url\\(#' + escRe(id) + '\\)', 'g'), 'url(#' + nid + ')');
      out = out.replace(new RegExp('(href|xlink:href)="#' + escRe(id) + '"', 'g'), '$1="#' + nid + '"');
    });
    return out;
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // ============================================================
  //  Pico ピン配列の正（実機準拠・機械照合用）
  // ============================================================
  var PICO_TOP = ['VBUS', 'VSYS', 'GND', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'AGND',
    'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'];
  var PICO_BOT = ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7',
    'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'];

  // ピンデータ名 → 正名（GND.n→GND、GND.7=AGND位置）
  function wokwiPinName(n) {
    if (n === 'GND.7') return 'AGND';
    if (/^GND\.\d+$/.test(n)) return 'GND';
    return n;
  }

  // ============================================================
  //  Pico 配置（自作Pico縦置きSVGを USB左向き横置きに回転）
  //  上辺ピン→行c・下辺ピン→行h（中央溝0.3inをまたぐ・実機準拠）
  // ============================================================
  function placePico(board, col0) {
    var art = PARTS['pi-pico'];
    if (!art) return null;
    var P = board.POINTS;
    var holeXof = function (c) { return P['a' + c].x; };
    var rowYof = function (r) { return BY + board.ys[r]; };

    var gp0 = art.pins['GP0'], vbus = art.pins['VBUS'];
    var W = art.w;
    var sx = SCL;                                  // 長手方向（ピン列ピッチ→PITCH）
    var pinSpan = vbus.x - gp0.x;                  // ≒66.9px（実0.7inch相当）
    var sy = (rowYof('h') - rowYof('c')) / pinSpan;// ≒1.674（c↔h=7ピッチに整合）
    var ox = holeXof(col0) - sx * gp0.y;
    var oy = rowYof('h') - sy * (W - gp0.x);

    // 変換: (x,y)→(ox + sx*y, oy + sy*(W - x))  … 反時計回り90°＋非等方スケール
    var prefix = 'pico' + (_uid++) + '_';
    var tf = 'translate(' + r2(ox) + ',' + r2(oy) + ') matrix(0,' + r4(-sy) + ',' + r4(sx) + ',0,0,' + r4(sy * W) + ')';
    var svg = '<g class="cv-comp" data-comp-id="__pico__" transform="' + tf + '">' +
      nsIds(art.inner, prefix) + '</g>';

    // ピン→穴の対応表を構築＆検証
    var pinHole = {};      // 正名: GPn / 3V3 / VBUS / ...（GNDは配列）
    var gndTop = [], gndBot = [];
    var table = { top: [], bot: [] };
    Object.keys(art.pins).forEach(function (nm) {
      var q = art.pins[nm];
      var X = ox + sx * q.y, Y = oy + sy * (W - q.x);
      var col = Math.round((X - holeXof(1)) / PITCH) + 1;
      var row = (Y < (rowYof('c') + rowYof('h')) / 2) ? 'c' : 'h';
      var ref = row + col;
      var canon = wokwiPinName(nm);
      if (canon === 'GND') (row === 'c' ? gndTop : gndBot).push(col);
      else pinHole[canon] = ref;
      table[row === 'c' ? 'top' : 'bot'].push({ col: col, name: canon });
    });
    table.top.sort(function (a, b) { return a.col - b.col; });
    table.bot.sort(function (a, b) { return a.col - b.col; });
    var topOk = table.top.map(function (e) { return e.name; }).join(',') === PICO_TOP.join(',');
    var botOk = table.bot.map(function (e) { return e.name; }).join(',') === PICO_BOT.join(',');
    gndTop.sort(function (a, b) { return a - b; });
    gndBot.sort(function (a, b) { return a - b; });

    return {
      svg: svg, col0: col0, colN: col0 + 19,
      pinHole: pinHole, gndTop: gndTop, gndBot: gndBot,
      table: table, pinTableOk: topOk && botOk,
      cx: ox + sx * art.h / 2
    };
  }

  // ============================================================
  //  ブロック解析（circuit_viewer.js parseBlocks 移植・意味論同一）
  // ============================================================
  var INTERNAL_PINS = new Set([23, 24, 25, 29]);

  function parseBlocks(workspace) {
    var comps = [], seen = new Set(), onboardLedOn = false, badPins = [];
    function add(key, type, pins, opts) {
      if (seen.has(key)) return;
      seen.add(key);
      var c = { compId: key, type: type, pins: pins };
      if (opts) for (var k in opts) c[k] = opts[k];
      comps.push(c);
    }
    workspace.getAllBlocks(false).filter(function (b) { return !b.isInsertionMarker(); })
      .forEach(function (b) {
        var t = b.type, gf = function (n) { return b.getFieldValue(n); };
        if (['pico_led_on', 'pico_led_off', 'pico_digital_write', 'pico_pwm_write', 'pico_pwm_write_val'].indexOf(t) >= 0) {
          var p = gf('PIN');
          if (parseInt(p) === 25) onboardLedOn = true;
          else if (INTERNAL_PINS.has(parseInt(p))) badPins.push({ gp: p });
          else add('led' + p, 'LED', { A: { gp: p }, C: { gnd: true } });
        } else if (['pico_digital_read', 'pico_digital_read_val'].indexOf(t) >= 0) {
          var p2 = gf('PIN'), pull = gf('PULL') || 'PULLUP_EXT';
          if (pull === 'PULLDOWN_EXT') {
            add('btn' + p2, 'BTN', { SIG: { gp: p2 }, VCC: { v3v3: true } }, { pull: 'PULLDOWN_EXT' });
            add('respd' + p2, 'RES', { A: { gp: p2 }, B: { gnd: true } }, { pull: 'PULLDOWN_EXT' });
          } else if (pull === 'PULLUP_INT') {
            add('btn' + p2, 'BTN', { SIG: { gp: p2 }, VCC: { gnd: true } }, { pull: 'PULLUP_INT' });
          } else {
            add('respu' + p2, 'RES', { A: { v3v3: true }, B: { gp: p2 } }, { pull: 'PULLUP_EXT' });
            add('btn' + p2, 'BTN', { SIG: { gp: p2 }, VCC: { gnd: true } }, { pull: 'PULLUP_EXT' });
          }
        } else if (['pico_analog_read', 'pico_analog_read_val'].indexOf(t) >= 0) {
          var p3 = gf('PIN');
          var sensor = (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('sensor') : '') || '';
          if (sensor === 'cds') add('cds' + p3, 'CDS', { SIG: { gp: p3 }, VCC: { v3v3: true }, GND: { gnd: true } });
          else add('pot' + p3, 'POT', { SIG: { gp: p3 }, VCC: { v3v3: true }, GND: { gnd: true } });
        } else if (['pico_buzzer_tone', 'pico_buzzer_stop'].indexOf(t) >= 0) {
          add('buzz' + gf('PIN'), 'BUZZ', { SIG: { gp: gf('PIN') }, GND: { gnd: true } });
        } else if (['pico_servo_angle', 'pico_servo_angle_val'].indexOf(t) >= 0) {
          add('servo' + gf('PIN'), 'SERVO', { PWM: { gp: gf('PIN') }, VCC: { vext: true }, GND: { gnd: true } });
        } else if (['pico_ultrasonic_cm', 'pico_ultrasonic_cm_val'].indexOf(t) >= 0) {
          var tr = gf('TRIG'), ec = gf('ECHO');
          add('hcsr04_' + tr + '_' + ec, 'HCSR04', { VCC: { v3v3: true }, TRIG: { gp: tr }, ECHO: { gp: ec }, GND: { gnd: true } });
        } else if (t === 'pico_dht_read') {
          add('dht' + gf('PIN'), 'DHT22', { VCC: { v3v3: true }, SIG: { gp: gf('PIN') }, GND: { gnd: true } });
        } else if (t === 'pico_lcd_init') {
          add('lcd_' + gf('SDA') + '_' + gf('SCL'), 'LCD', { GND: { gnd: true }, VCC: { v3v3: true }, SDA: { gp: gf('SDA') }, SCL: { gp: gf('SCL') } });
        } else if (t === 'pico_7seg_show') {
          var pins7 = { COM: { gnd: true } };
          ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function (s) { var pp = gf('PIN_' + s); if (pp) pins7[s] = { gp: pp }; });
          add('seg7', 'SEG7', pins7);
        } else if (['pico_dcmotor_run', 'pico_dcmotor_run_val', 'pico_dcmotor_stop'].indexOf(t) >= 0) {
          var en = gf('EN');
          add('l293d_' + gf('IN1') + '_' + gf('IN2'), 'L293D',
            { VSS: { vext: true }, EN: en ? { gp: en } : null, IN1: { gp: gf('IN1') }, IN2: { gp: gf('IN2') }, GND: { gnd: true }, VS: { vext: true } });
        } else if (['pico_stepper_step', 'pico_stepper_angle'].indexOf(t) >= 0) {
          add('step_' + [gf('IN1'), gf('IN2'), gf('IN3'), gf('IN4')].join('_'), 'STEPPER',
            { VCC: { vext: true }, IN1: { gp: gf('IN1') }, IN2: { gp: gf('IN2') }, IN3: { gp: gf('IN3') }, IN4: { gp: gf('IN4') }, GND: { gnd: true } });
        }
      });
    var hasVext = comps.some(function (c) {
      return Object.keys(c.pins).some(function (k) { return c.pins[k] && c.pins[k].vext; });
    });
    if (hasVext) add('extpwr', 'EXTPWR', { GND: { gnd: true } });
    return { comps: comps, onboardLedOn: onboardLedOn, badPins: badPins };
  }

  // ============================================================
  //  ネットグラフ（電気的検証用 union-find）
  //  net key: 'T{col}'(a-e列) / 'B{col}'(f-j列) / 't+','t-','b+','b-' / 'pt:{ref}'
  // ============================================================
  function NetGraph() {
    var parent = {};
    function find(k) {
      if (!(k in parent)) { parent[k] = k; return k; }
      var r = k;
      while (parent[r] !== r) r = parent[r];
      while (parent[k] !== r) { var nx = parent[k]; parent[k] = r; k = nx; }
      return r;
    }
    return {
      union: function (a, b) { var ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; },
      conn: function (a, b) { return find(a) === find(b); }
    };
  }
  function netKeyOf(ref) {
    if (/^[tb][+\-]\./.test(ref)) return ref.split('.')[0];   // レール
    var m = /^([a-j])(\d+)$/.exec(ref);
    if (m) return ('abcde'.indexOf(m[1]) >= 0 ? 'T' : 'B') + m[2];
    return 'pt:' + ref;    // ボード外部品ピン等
  }

  // ============================================================
  //  部品配置（wokwi アート）
  // ============================================================
  function bboxOf(data, hole0, pin, s, ang) {
    var cs = Math.cos(ang), sn = Math.sin(ang);
    var pts = [[0, 0], [data.w, 0], [0, data.h], [data.w, data.h]].map(function (p) {
      var dx = (p[0] - pin.x) * s, dy = (p[1] - pin.y) * s;
      return [hole0.x + dx * cs - dy * sn, hole0.y + dx * sn + dy * cs];
    });
    var xs = pts.map(function (p) { return p[0]; }), ysv = pts.map(function (p) { return p[1]; });
    return { x0: Math.min.apply(0, xs), y0: Math.min.apply(0, ysv), x1: Math.max.apply(0, xs), y1: Math.max.apply(0, ysv) };
  }
  // 2点アライメント（回転＋均一スケール）
  function placePart2(tag, id, align, POINTS) {
    var data = PARTS[tag];
    if (!data) return { svg: '', ok: false };
    var pin = data.pins[align[0][0]], hole0 = POINTS[align[0][1]];
    if (!pin || !hole0) return { svg: '', ok: false };
    var s = 1, ang = 0;
    if (align.length > 1) {
      var pin2 = data.pins[align[1][0]], h2 = POINTS[align[1][1]];
      if (pin2 && h2) {
        var pd = Math.hypot(pin2.x - pin.x, pin2.y - pin.y);
        var hd = Math.hypot(h2.x - hole0.x, h2.y - hole0.y);
        if (pd > 0.01) s = hd / pd;
        ang = Math.atan2(h2.y - hole0.y, h2.x - hole0.x) -
          Math.atan2(pin2.y - pin.y, pin2.x - pin.x);
      }
    }
    var cos = Math.cos(ang), sin = Math.sin(ang);
    Object.keys(data.pins).forEach(function (nm) {
      var q = data.pins[nm];
      var dx = (q.x - pin.x) * s, dy = (q.y - pin.y) * s;
      POINTS[id + '.' + nm] = { x: hole0.x + dx * cos - dy * sin, y: hole0.y + dx * sin + dy * cos };
    });
    var prefix = 'p' + (_uid++) + '_';
    var tf = 'translate(' + r2(hole0.x) + ',' + r2(hole0.y) + ') rotate(' +
      r4(ang * 180 / Math.PI) + ') scale(' + r4(s) + ') translate(' +
      r2(-pin.x) + ',' + r2(-pin.y) + ')';
    return {
      svg: '<g class="cv-comp" data-comp-id="' + id + '" transform="' + tf + '">' +
        nsIds(data.inner, prefix) + '</g>',
      ok: true, scale: s,
      bbox: bboxOf(data, hole0, pin, s, ang)
    };
  }
  // 1点配置（左上基準・任意スケール）
  function placePartAt(tag, id, tx, ty, s, POINTS) {
    var data = PARTS[tag];
    if (!data) return { svg: '', ok: false };
    Object.keys(data.pins).forEach(function (nm) {
      var q = data.pins[nm];
      POINTS[id + '.' + nm] = { x: tx + s * q.x, y: ty + s * q.y };
    });
    var prefix = 'p' + (_uid++) + '_';
    return {
      svg: '<g class="cv-comp" data-comp-id="' + id + '" transform="translate(' + r2(tx) + ',' + r2(ty) + ') scale(' + r4(s) + ')">' +
        nsIds(data.inner, prefix) + '</g>',
      ok: true,
      bbox: { x0: tx, y0: ty, x1: tx + s * data.w, y1: ty + s * data.h }
    };
  }
  // 曲がった脚（ピン実座標→穴）
  function stub(a, b) {
    var mx = (a.x + b.x) / 2, my = Math.max(a.y, b.y) - 2;
    return '<path d="M' + r2(a.x) + ',' + r2(a.y) + ' Q' + r2(mx) + ',' + r2(my) + ' ' + r2(b.x) + ',' + r2(b.y) +
      '" fill="none" stroke="#9aa0a8" stroke-width="3" stroke-linecap="round"/>';
  }

  // ============================================================
  //  自作SVG（ボード外モジュール: bb_render.js から移植）
  // ============================================================
  function drawBattery(x, y, id, label, POINTS) {
    var w = 96, h = 130, svg = [];
    svg.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="#2e3440" stroke="#1c2128" stroke-width="2"/>');
    for (var i = 0; i < 2; i++) {
      var cx = x + 24 + i * 30;
      svg.push('<rect x="' + (cx - 9) + '" y="' + (y + 26) + '" width="18" height="74" rx="4" fill="#cfa54a" stroke="#8d6f2f"/>');
      var nubY = i === 0 ? y + 20 : y + 100;
      svg.push('<rect x="' + (cx - 4) + '" y="' + nubY + '" width="8" height="6" fill="#b9bec7"/>');
    }
    svg.push('<text x="' + (x + w - 24) + '" y="' + (y + 17) + '" fill="#ff8d8d" font-size="11" font-weight="bold">+</text>');
    svg.push('<text x="' + (x + w - 24) + '" y="' + (y + h - 7) + '" fill="#9fc3ff" font-size="12" font-weight="bold">−</text>');
    if (label) svg.push('<text x="' + (x + w / 2) + '" y="' + (y + h + 16) + '" fill="#28303f" font-size="13" font-weight="bold" text-anchor="middle">' + label + '</text>');
    POINTS[id + '.+'] = { x: x + w - 10, y: y + 12 };
    POINTS[id + '.-'] = { x: x + w - 10, y: y + h - 12 };
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: x, y0: y, x1: x + w + 10, y1: y + h + 22 } };
  }

  function drawMotor(x, y, id, label, POINTS) {
    var w = 110, h = 62, svg = [];
    svg.push('<line x1="' + (x - 24) + '" y1="' + (y + h / 2) + '" x2="' + x + '" y2="' + (y + h / 2) + '" stroke="#8b9098" stroke-width="5" stroke-linecap="round"/>');
    svg.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#c8ccd3" stroke="#8b9098" stroke-width="2"/>');
    svg.push('<rect x="' + (x + w - 4) + '" y="' + (y + 6) + '" width="14" height="' + (h - 12) + '" rx="4" fill="#f3f0ea" stroke="#b6b0a4" stroke-width="2"/>');
    for (var i = 0; i < 3; i++)
      svg.push('<line x1="' + (x + 22 + i * 26) + '" y1="' + (y + 12) + '" x2="' + (x + 22 + i * 26) + '" y2="' + (y + h - 12) + '" stroke="#aeb3bb" stroke-width="3"/>');
    var tex = x + w + 10, tya = y + h / 2 - 14, tyb = y + h / 2 + 14;
    [tya, tyb].forEach(function (ty) {
      svg.push('<rect x="' + tex + '" y="' + (ty - 4) + '" width="14" height="8" fill="#c9963f" stroke="#8d6f2f" stroke-width="1"/>');
    });
    POINTS[id + '.a'] = { x: tex + 12, y: tya };
    POINTS[id + '.b'] = { x: tex + 12, y: tyb };
    if (label) svg.push('<text x="' + (x + w / 2) + '" y="' + (y + h + 18) + '" fill="#28303f" font-size="13" font-weight="bold" text-anchor="middle">' + label + '</text>');
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: x - 24, y0: y, x1: tex + 22, y1: y + h + 20 } };
  }

  // ULN2003 ドライバ基板（28BYJ-48用・自作）
  function drawUln(x, y, id, POINTS) {
    var w = 150, h = 88, svg = [];
    svg.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#1f5fbf" stroke="#143f80" stroke-width="2"/>');
    svg.push('<text x="' + (x + w / 2) + '" y="' + (y + 14) + '" fill="#fff" font-size="10" font-weight="bold" text-anchor="middle">ULN2003 ドライバ</text>');
    svg.push('<rect x="' + (x + 52) + '" y="' + (y + 32) + '" width="52" height="18" rx="2" fill="#17171c" stroke="#000"/>');
    var names = ['IN1', 'IN2', 'IN3', 'IN4', '+', '−'];
    for (var i = 0; i < 6; i++) {
      var py = y + 16 + i * 12;
      svg.push('<rect x="' + (x - 5) + '" y="' + (py - 3.5) + '" width="10" height="7" rx="1.5" fill="#e6c14e" stroke="#a6841f"/>');
      svg.push('<text x="' + (x + 9) + '" y="' + (py + 3) + '" fill="#dce7ff" font-size="8" font-weight="bold">' + names[i] + '</text>');
      var key = names[i] === '+' ? 'VCC' : (names[i] === '−' ? 'GND' : names[i]);
      POINTS[id + '.' + key] = { x: x - 4, y: py };
    }
    svg.push('<rect x="' + (x + w - 14) + '" y="' + (y + 24) + '" width="14" height="48" rx="2" fill="#f3f0ea" stroke="#b6b0a4"/>');
    var motNames = ['A-', 'A+', 'B+', 'B-'];
    for (var j = 0; j < 4; j++) {
      var my = y + 32 + j * 11;
      svg.push('<circle cx="' + (x + w - 7) + '" cy="' + my + '" r="2.6" fill="#7a5e16"/>');
      POINTS[id + '.M' + motNames[j]] = { x: x + w - 7, y: my };
    }
    svg.push('<text x="' + (x + w / 2) + '" y="' + (y + h - 8) + '" fill="#dce7ff" font-size="9" text-anchor="middle">28BYJ-48 用</text>');
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: x - 8, y0: y, x1: x + w + 4, y1: y + h + 4 } };
  }

  // L293D DIP-16（溝またぎ・自作）。colL..colL+7 の8列・上=行e/下=行f。
  function drawL293D(board, colL, id, POINTS) {
    var P = board.POINTS, svg = [];
    var xL = P['e' + colL].x - 10, xR = P['e' + (colL + 7)].x + 10;
    var yT = P['e' + colL].y + 5, yB = P['f' + colL].y - 5;
    for (var i = 0; i < 8; i++) {
      var hx = P['e' + (colL + i)].x;
      svg.push('<rect x="' + (hx - 3) + '" y="' + (P['e' + colL].y - 2) + '" width="6" height="' + (yT - P['e' + colL].y + 2) + '" fill="#b9bec7"/>');
      svg.push('<rect x="' + (hx - 3) + '" y="' + yB + '" width="6" height="' + (P['f' + colL].y - yB + 2) + '" fill="#b9bec7"/>');
    }
    svg.push('<rect x="' + xL + '" y="' + yT + '" width="' + (xR - xL) + '" height="' + (yB - yT) + '" rx="3" fill="#2b2e34" stroke="#17191d" stroke-width="1.5"/>');
    svg.push('<path d="M' + xL + ' ' + ((yT + yB) / 2 - 7) + ' a7 7 0 0 0 0 14" fill="#454a52"/>');
    svg.push('<text x="' + ((xL + xR) / 2) + '" y="' + ((yT + yB) / 2 + 4) + '" fill="#d7dadf" font-size="12" font-weight="bold" text-anchor="middle">L293D</text>');
    svg.push('<circle cx="' + (xL + 12) + '" cy="' + (yB - 8) + '" r="2.5" fill="#d7dadf"/>');
    var topNames = ['VSS', '4A', '4Y', 'GND', 'GND', '3Y', '3A', 'EN2'];
    var botNames = ['EN1', '1A', '1Y', 'GND', 'GND', '2Y', '2A', 'VS'];
    for (var k = 0; k < 8; k++) {
      var px = P['e' + (colL + k)].x;
      svg.push('<text x="' + px + '" y="' + (yT + 10) + '" fill="#9aa3ad" font-size="5.5" text-anchor="middle">' + topNames[k] + '</text>');
      svg.push('<text x="' + px + '" y="' + (yB - 5) + '" fill="#9aa3ad" font-size="5.5" text-anchor="middle">' + botNames[k] + '</text>');
    }
    var holes = {
      EN1: 'f' + colL, IN1: 'f' + (colL + 1), OUT1: 'f' + (colL + 2),
      GNDb1: 'f' + (colL + 3), GNDb2: 'f' + (colL + 4),
      OUT2: 'f' + (colL + 5), IN2: 'f' + (colL + 6), VS: 'f' + (colL + 7),
      VSS: 'e' + colL, EN2: 'e' + (colL + 7),
      GNDt1: 'e' + (colL + 3), GNDt2: 'e' + (colL + 4)
    };
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', holes: holes };
  }

  // ============================================================
  //  ワイヤーマネージャ（弧・自動回避）
  //  - 端点クラスタ（束）を検出し sag を段階的に散らして重なりを避ける
  //  - 膨らみはボード中心から遠ざかる側（上半分は上・下半分は下）
  // ============================================================
  var COLPAL = {
    v: '#d24a4a', vext: '#e07b2f', gnd: '#33363c',
    sig: ['#2f7de0', '#e0a52f', '#8e44ad', '#159a72', '#c0392b', '#0e7490', '#a3559d']
  };

  function WireMgr(POINTS, boardCenter) {
    var list = [];
    return {
      add: function (fromRef, toRef, color, id, opt) {
        var a = POINTS[fromRef], b = POINTS[toRef];
        if (!a || !b) return false;
        list.push({ a: a, b: b, color: color, id: id,
          sagBase: (opt && opt.sag != null) ? opt.sag : null });
        return true;
      },
      count: function () { return list.length; },
      render: function () {
        var clusterIdx = {};
        function ckey(p) { return Math.round(p.x / 20) + ':' + Math.round(p.y / 20); }
        list.forEach(function (w) {
          [ckey(w.a), ckey(w.b)].forEach(function (k) {
            if (!(k in clusterIdx)) clusterIdx[k] = [];
            clusterIdx[k].push(w);
          });
        });
        list.forEach(function (w) { w.avoid = 0; });
        Object.keys(clusterIdx).forEach(function (k) {
          var ws = clusterIdx[k];
          if (ws.length < 2) return;
          ws.sort(function (p, q) {
            return Math.hypot(p.b.x - p.a.x, p.b.y - p.a.y) - Math.hypot(q.b.x - q.a.x, q.b.y - q.a.y);
          });
          ws.forEach(function (w, i) { w.avoid = Math.max(w.avoid, i); });
        });
        return list.map(function (w) {
          var a = w.a, b = w.b;
          var dx = b.x - a.x, dy = b.y - a.y;
          var dist = Math.hypot(dx, dy) || 1;
          var sag = (w.sagBase != null ? w.sagBase : Math.min(26, 8 + dist * 0.10)) + w.avoid * 9;
          var mx0 = (a.x + b.x) / 2, my0 = (a.y + b.y) / 2;
          // 膨らみは配線と直交する法線方向・「ボード中心から遠ざかる」向き
          // （縦配線が Pico/ボードを突っ切るのを防ぐ）
          var nx = -dy / dist, ny = dx / dist;
          var away = (mx0 - boardCenter.x) * nx + (my0 - boardCenter.y) * ny;
          if (away < 0) { nx = -nx; ny = -ny; }
          var mx = mx0 + nx * sag, my = my0 + ny * sag;
          var d = 'M' + r2(a.x) + ',' + r2(a.y) + ' Q' + r2(mx) + ',' + r2(my) + ' ' + r2(b.x) + ',' + r2(b.y);
          return '<g class="bb-wire" data-wire-id="' + w.id + '">' +
            '<path d="' + d + '" fill="none" stroke="' + w.color + '" stroke-width="3.6" stroke-linecap="round"/>' +
            '<circle cx="' + r2(a.x) + '" cy="' + r2(a.y) + '" r="3" fill="' + w.color + '"/>' +
            '<circle cx="' + r2(b.x) + '" cy="' + r2(b.y) + '" r="3" fill="' + w.color + '"/></g>';
        }).join('\n');
      }
    };
  }

  // ============================================================
  //  メイン回路構築
  // ============================================================
  function buildCircuit(board, pico, comps, overrides) {
    var P = board.POINTS;
    var partsSvg = [], preSvg = [];
    var checks = [];
    var net = NetGraph();
    var bounds = { x0: BX, y0: BY, x1: BX + board.w, y1: BY + board.h };
    function grow(bb) {
      if (!bb) return;
      bounds.x0 = Math.min(bounds.x0, bb.x0); bounds.y0 = Math.min(bounds.y0, bb.y0);
      bounds.x1 = Math.max(bounds.x1, bb.x1); bounds.y1 = Math.max(bounds.y1, bb.y1);
    }
    var boardCenter = { x: BX + board.w / 2, y: BY + (board.ys['e'] + board.ys['f']) / 2 };
    var wires = WireMgr(P, boardCenter);
    // レール間ブリッジ用: ボード右端を回り込む sag（Q制御点で最大偏位=sag/2）
    var bridgeSag = 2 * (BX + board.w - board.railX(25)) + 56;
    var sigIdx = 0;
    function nextSig() { return COLPAL.sig[sigIdx++ % COLPAL.sig.length]; }

    function addWire(fromRef, toRef, color, id, opt) {
      if (wires.add(fromRef, toRef, color, id, opt))
        net.union(netKeyOf(fromRef), netKeyOf(toRef));
    }

    // ---- タップ（列内の空き穴）----
    var usedTaps = {};
    function takeTap(col, band) {
      var rows = band === 'T' ? ['b', 'a'] : ['i', 'j'];
      for (var i = 0; i < rows.length; i++) {
        var ref = rows[i] + col;
        if (!usedTaps[ref] && P[ref]) { usedTaps[ref] = 1; return ref; }
      }
      return rows[0] + col;
    }
    function gpInfo(gp) {
      var ref = pico.pinHole['GP' + parseInt(gp)];
      if (!ref) return null;
      var row = ref[0], col = parseInt(ref.slice(1));
      return { ref: ref, col: col, band: row === 'c' ? 'T' : 'B' };
    }
    function gpTap(gp) {
      var gi = gpInfo(gp);
      if (!gi) return null;
      return { ref: takeTap(gi.col, gi.band), band: gi.band, col: gi.col };
    }

    // ---- レール管理（GND=t-/b-・＋レール=3v3/vext を要求時割当）----
    var railFed = {};
    var V3KEY = pico.pinHole['3V3'] ? netKeyOf(pico.pinHole['3V3']) : null;
    var VEXTKEY = 'pt:extpwr.+';
    var GNDREF_B = 'j' + pico.gndBot[0];   // 検証用 GND 代表（下辺GND列の外周穴）
    var GNDREF_T = 'a' + pico.gndTop[0];
    net.union(netKeyOf(GNDREF_B), netKeyOf(GNDREF_T)); // Pico内部でGNDは共通

    function feedGndRail(rail) {
      if (railFed[rail]) return;
      railFed[rail] = 'gnd';
      if (rail === 'b-') {
        addWire(takeTap(pico.gndBot[0], 'B'), 'b-.2', COLPAL.gnd, 'feed_b-', { sag: 10 });
      } else {
        addWire(takeTap(pico.gndTop[0], 'T'), 't-.2', COLPAL.gnd, 'feed_t-', { sag: 10 });
      }
    }
    function feedPlusRail(rail, kind) {
      railFed[rail] = kind;
      if (kind === 'vext') {
        // EXTPWR（実行順で先行）が b+ に給電済み。t+ が要求されたら右端でブリッジ。
        if (rail === 't+' && railFed['b+'] === 'vext') {
          addWire('b+.25', 't+.25', COLPAL.vext, 'bridge_vext', { sag: bridgeSag });
        }
        return;
      }
      var v3ref = pico.pinHole['3V3'];
      var col = parseInt(v3ref.slice(1));
      if (rail === 't+') {
        addWire(takeTap(col, 'T'), 't+.2', COLPAL.v, 'feed_t+', { sag: 10 });
      } else {
        if (!railFed['t+']) feedPlusRail('t+', '3v3');
        if (railFed['t+'] === '3v3') {
          // 右端を回り込んで上＋レール→下＋レールへ渡す（ボード上を横切らない）
          addWire('t+.25', 'b+.25', COLPAL.v, 'bridge_v', { sag: bridgeSag });
        } else {
          addWire(takeTap(col, 'T'), 'b+.1', COLPAL.v, 'feed_b+', { sag: 26 });
        }
      }
    }
    function railFor(kind, band) {
      if (kind === 'gnd') {
        var r = band === 'T' ? 't-' : 'b-';
        feedGndRail(r);
        return r;
      }
      var pref = band === 'T' ? ['t+', 'b+'] : ['b+', 't+'];
      for (var i = 0; i < 2; i++) {
        var rail = pref[i];
        if (railFed[rail] === kind) return rail;
        if (!railFed[rail]) { feedPlusRail(rail, kind); return rail; }
      }
      return pref[0];
    }

    // ---- 割当（列・ボード外スロット）----
    var nextCol = pico.colN + 3;
    function allocCols(n, comp) {
      var shift = 0;
      var ov = overrides && overrides[comp.compId];
      if (ov && ov.dx) shift = Math.round(ov.dx / PITCH);
      var c = Math.max(pico.colN + 2, nextCol + shift);
      nextCol = Math.max(nextCol, c) + n + 1;
      return c;
    }
    var botX = BX + 130, botY = BY + board.h + 46;
    function allocBottom(w, comp) {
      var ov = overrides && overrides[comp.compId];
      var x = botX + ((ov && ov.dx) || 0);
      botX += w + 40;
      return { x: x, y: botY + ((ov && ov.dy) || 0) };
    }
    var rightX = BX + board.w + 50, rightY = BY + 20;
    function allocRight(h, comp) {
      var ov = overrides && overrides[comp.compId];
      var y = rightY + ((ov && ov.dy) || 0);
      rightY += h + 30;
      return { x: rightX + ((ov && ov.dx) || 0), y: y };
    }

    function railKNear(col) {
      var x = P['a' + Math.min(col, board.cols)].x;
      var best = 1, bd = Infinity;
      for (var k = 1; k <= 25; k++) {
        var d = Math.abs(board.railX(k) - x);
        if (d < bd) { bd = d; best = k; }
      }
      return best;
    }

    function chk(comp, rule, ok, detail) {
      checks.push({ comp: comp, rule: rule, ok: !!ok, detail: detail || '' });
    }
    function connected(refA, refB) { return net.conn(netKeyOf(refA), netKeyOf(refB)); }
    function isGnd(ref) { return connected(ref, GNDREF_B); }
    function is3v3(ref) { return V3KEY && net.conn(netKeyOf(ref), V3KEY); }

    function wireGpTo(gp, holeRef, color, wid, opt) {
      var t = gpTap(gp);
      if (!t) return null;
      addWire(t.ref, holeRef, color, wid, opt);
      return t;
    }

    // ============ 部品ハンドラ ============
    var handlers = {

      // LED（dk05流: 脚開き・点灯グロー・GP側グループ搭載）＋直列抵抗（寝かせ）
      LED: function (c) {
        var gi = gpInfo(c.pins.A.gp);
        var topSide = gi && gi.band === 'T';
        var col = allocCols(7, c);
        var cC = col + 4, cA = col + 5;
        var legRow = topSide ? 'd' : 'g';
        var pr = placePart2('wokwi-led', c.compId, [['C', legRow + cC], ['A', legRow + cA]], P);
        if (!pr.ok) return placeholder(c);
        var resRow = topSide ? 'b' : 'i';
        var rr = placePart2('wokwi-resistor', 'res_' + c.compId, [['2', resRow + cC], ['1', resRow + col]], P);
        if (rr.ok) { partsSvg.push(rr.svg); grow(rr.bbox); }
        partsSvg.push(pr.svg); grow(pr.bbox);
        usedTaps[resRow + cC] = usedTaps[resRow + col] = 1;
        usedTaps[legRow + cC] = usedTaps[legRow + cA] = 1;
        var band = topSide ? 'T' : 'B';
        var gRail = railFor('gnd', band);
        addWire(takeTap(col, band), gRail + '.' + railKNear(col), COLPAL.gnd, c.compId + ':GND', { sag: 9 });
        wireGpTo(c.pins.A.gp, takeTap(cA, band), nextSig(), c.compId + ':A');
        var gpRef = pico.pinHole['GP' + parseInt(c.pins.A.gp)];
        chk(c.compId, 'LED: GP→アノード', gpRef && connected(gpRef, legRow + cA));
        chk(c.compId, 'LED: カソード→抵抗→GND',
          connected(legRow + cC, resRow + cC) && isGnd(resRow + col), 'R先=' + gRail);
        chk(c.compId, 'LED: アノードとカソードは非短絡', !connected(legRow + cA, legRow + cC));
      },

      // タクトスイッチ（6mm 実寸・溝またぎ・曲げ脚）
      BTN: function (c) {
        var col = allocCols(4, c);
        var art = PARTS['wokwi-pushbutton-6mm'];
        if (!art) return placeholder(c);
        var s = 1.35;
        var pinMidX = (art.pins['1.l'].x + art.pins['1.r'].x) / 2;
        var pinMidY = (art.pins['1.l'].y + art.pins['2.l'].y) / 2;
        var cxT = (P['e' + col].x + P['e' + (col + 2)].x) / 2;
        var cyT = (P['e' + col].y + P['f' + col].y) / 2;
        var pr = placePartAt('wokwi-pushbutton-6mm', c.compId,
          cxT - s * pinMidX, cyT - s * pinMidY, s, P);
        grow(pr.bbox);
        var pinHoles = { '1.l': 'e' + col, '1.r': 'e' + (col + 2), '2.l': 'f' + col, '2.r': 'f' + (col + 2) };
        Object.keys(pinHoles).forEach(function (pn) {
          preSvg.push(stub(P[c.compId + '.' + pn], P[pinHoles[pn]]));
          usedTaps[pinHoles[pn]] = 1;
        });
        partsSvg.push(pr.svg);
        net.union(netKeyOf('e' + col), netKeyOf('e' + (col + 2)));   // 端子1（上・常時導通ペア）
        net.union(netKeyOf('f' + col), netKeyOf('f' + (col + 2)));   // 端子2（下・常時導通ペア）
        wireGpTo(c.pins.SIG.gp, takeTap(col, 'B'), nextSig(), c.compId + ':SIG');
        var other = c.pins.VCC;
        if (other.gnd) {
          var gRail = railFor('gnd', 'T');
          addWire(takeTap(col, 'T'), gRail + '.' + railKNear(col), COLPAL.gnd, c.compId + ':GND', { sag: 9 });
        } else if (other.v3v3) {
          var vRail = railFor('3v3', 'T');
          addWire(takeTap(col, 'T'), vRail + '.' + railKNear(col), COLPAL.v, c.compId + ':VCC', { sag: 9 });
        }
        chk(c.compId, 'タクトSW: 溝またぎ端子分離（非短絡）', !connected('e' + col, 'f' + col), 'e' + col + '×f' + col);
        var gpRef2 = pico.pinHole['GP' + parseInt(c.pins.SIG.gp)];
        chk(c.compId, 'タクトSW: GP→押下側端子', gpRef2 && connected(gpRef2, 'f' + col));
        if (other.gnd) chk(c.compId, 'タクトSW: 対端子→GND', isGnd('e' + col));
        if (other.v3v3) chk(c.compId, 'タクトSW: 対端子→3V3', is3v3('e' + col));
      },

      // 外付け抵抗（プルアップ/ダウン: 盤面に寝かせて実装）
      RES: function (c) {
        var gpSpec = c.pins.A.gp != null ? c.pins.A : c.pins.B;
        var railSpec = c.pins.A.gp != null ? c.pins.B : c.pins.A;
        var gi = gpInfo(gpSpec.gp);
        var topSide = gi && gi.band === 'T';
        var col = allocCols(5, c);
        var row = topSide ? 'b' : 'i';
        var pr = placePart2('wokwi-resistor', c.compId, [['1', row + col], ['2', row + (col + 4)]], P);
        if (!pr.ok) return placeholder(c);
        partsSvg.push(pr.svg); grow(pr.bbox);
        usedTaps[row + col] = usedTaps[row + (col + 4)] = 1;
        wireGpTo(gpSpec.gp, takeTap(col + 4, topSide ? 'T' : 'B'), nextSig(), c.compId + ':GP');
        var band = topSide ? 'T' : 'B';
        if (railSpec.v3v3) {
          var vRail = railFor('3v3', band);
          addWire(takeTap(col, band), vRail + '.' + railKNear(col), COLPAL.v, c.compId + ':V', { sag: 9 });
        } else {
          var gRail = railFor('gnd', band);
          addWire(takeTap(col, band), gRail + '.' + railKNear(col), COLPAL.gnd, c.compId + ':G', { sag: 9 });
        }
        var gpRef = pico.pinHole['GP' + parseInt(gpSpec.gp)];
        chk(c.compId, '抵抗(' + (c.pull || '') + '): GP側接続', gpRef && connected(gpRef, row + (col + 4)));
        chk(c.compId, '抵抗(' + (c.pull || '') + '): ' + (railSpec.v3v3 ? '3V3' : 'GND') + '側接続',
          railSpec.v3v3 ? is3v3(row + col) : isGnd(row + col));
      },

      // 可変抵抗（3ピン: ADC=上辺GPのため上グループ・行c）
      POT: function (c) {
        var col = allocCols(6, c);
        var pr = placePart2('wokwi-potentiometer', c.compId, [['GND', 'c' + col], ['VCC', 'c' + (col + 2)]], P);
        if (!pr.ok) return placeholder(c);
        partsSvg.push(pr.svg); grow(pr.bbox);
        ['c' + col, 'c' + (col + 1), 'c' + (col + 2)].forEach(function (h) { usedTaps[h] = 1; });
        var vRail = railFor('3v3', 'T');
        addWire(takeTap(col + 2, 'T'), vRail + '.' + railKNear(col + 2), COLPAL.v, c.compId + ':VCC', { sag: 9 });
        var gRail = railFor('gnd', 'T');
        addWire(takeTap(col, 'T'), gRail + '.' + railKNear(col), COLPAL.gnd, c.compId + ':GND', { sag: 9 });
        wireGpTo(c.pins.SIG.gp, takeTap(col + 1, 'T'), nextSig(), c.compId + ':SIG');
        var gpRef = pico.pinHole['GP' + parseInt(c.pins.SIG.gp)];
        chk(c.compId, 'POT: SIG→ADCピン', gpRef && connected(gpRef, 'c' + (col + 1)));
        chk(c.compId, 'POT: VCC→3V3', is3v3('c' + (col + 2)));
        chk(c.compId, 'POT: GND→GND', isGnd('c' + col));
      },

      // CdS光センサモジュール（ボード外・右）
      CDS: function (c) {
        var slot = allocRight(120, c);
        var pr = placePartAt('wokwi-photoresistor-sensor', c.compId, slot.x, slot.y, 0.85, P);
        if (!pr.ok) return placeholder(c);
        partsSvg.push(pr.svg); grow(pr.bbox);
        var vRail = railFor('3v3', 'T');
        addWire(c.compId + '.VCC', vRail + '.25', COLPAL.v, c.compId + ':VCC', { sag: 22 });
        var gRail = railFor('gnd', 'T');
        addWire(c.compId + '.GND', gRail + '.25', COLPAL.gnd, c.compId + ':GND', { sag: 30 });
        var t = gpTap(c.pins.SIG.gp);
        if (t) addWire(c.compId + '.AO', t.ref, nextSig(), c.compId + ':SIG', { sag: 38 });
        var gpRef = pico.pinHole['GP' + parseInt(c.pins.SIG.gp)];
        chk(c.compId, 'CDS: AO→ADCピン', gpRef && connected(c.compId + '.AO', gpRef));
        chk(c.compId, 'CDS: VCC→3V3', is3v3(c.compId + '.VCC'));
        chk(c.compId, 'CDS: GND→GND', isGnd(c.compId + '.GND'));
      },

      // 圧電ブザー（2ピン・GP側グループに搭載。pin1=−/pin2=＋）
      BUZZ: function (c) {
        var gi = gpInfo(c.pins.SIG.gp);
        var topSide = gi && gi.band === 'T';
        var col = allocCols(5, c);
        var row = topSide ? 'd' : 'g';
        var pr = placePart2('wokwi-buzzer', c.compId, [['1', row + col], ['2', row + (col + 1)]], P);
        if (!pr.ok) return placeholder(c);
        partsSvg.push(pr.svg); grow(pr.bbox);
        usedTaps[row + col] = usedTaps[row + (col + 1)] = 1;
        var band = topSide ? 'T' : 'B';
        var gRail = railFor('gnd', band);
        addWire(takeTap(col, band), gRail + '.' + railKNear(col), COLPAL.gnd, c.compId + ':GND', { sag: 9 });
        wireGpTo(c.pins.SIG.gp, takeTap(col + 1, band), nextSig(), c.compId + ':SIG');
        var gpRef = pico.pinHole['GP' + parseInt(c.pins.SIG.gp)];
        chk(c.compId, 'ブザー: GP→＋端子', gpRef && connected(gpRef, row + (col + 1)));
        chk(c.compId, 'ブザー: −端子→GND', isGnd(row + col));
      },

      // サーボ（ボード外・右）: PWM=GP / V+=外部電源 / GND
      SERVO: function (c) {
        var slot = allocRight(130, c);
        var pr = placePartAt('wokwi-servo', c.compId, slot.x, slot.y, 0.9, P);
        if (!pr.ok) return placeholder(c);
        partsSvg.push(pr.svg); grow(pr.bbox);
        var t = gpTap(c.pins.PWM.gp);
        if (t) addWire(c.compId + '.PWM', t.ref, nextSig(), c.compId + ':PWM', { sag: 30 });
        var vRail = railFor('vext', 'B');
        addWire(c.compId + '.V+', vRail + '.25', COLPAL.vext, c.compId + ':V+', { sag: 18 });
        var gRail = railFor('gnd', 'B');
        addWire(c.compId + '.GND', gRail + '.25', COLPAL.gnd, c.compId + ':GND', { sag: 26 });
        var gpRef = pico.pinHole['GP' + parseInt(c.pins.PWM.gp)];
        chk(c.compId, 'サーボ: PWM→GP' + c.pins.PWM.gp, gpRef && connected(c.compId + '.PWM', gpRef));
        chk(c.compId, 'サーボ: V+→外部電源', net.conn(netKeyOf(c.compId + '.V+'), VEXTKEY));
        chk(c.compId, 'サーボ: GND→GND', isGnd(c.compId + '.GND'));
      },

      // 超音波センサ HC-SR04（上グループ行cに直挿し・本体はボード上方）
      HCSR04: function (c) {
        var col = allocCols(7, c);
        var pr = placePart2('wokwi-hc-sr04', c.compId, [['VCC', 'c' + col], ['GND', 'c' + (col + 3)]], P);
        if (!pr.ok) return placeholder(c);
        partsSvg.push(pr.svg); grow(pr.bbox);
        for (var i = 0; i < 4; i++) usedTaps['c' + (col + i)] = 1;
        var vRail = railFor('3v3', 'T');
        addWire(takeTap(col, 'T'), vRail + '.' + railKNear(col), COLPAL.v, c.compId + ':VCC', { sag: 9 });
        var gRail = railFor('gnd', 'T');
        addWire(takeTap(col + 3, 'T'), gRail + '.' + railKNear(col + 3), COLPAL.gnd, c.compId + ':GND', { sag: 9 });
        wireGpTo(c.pins.TRIG.gp, takeTap(col + 1, 'T'), nextSig(), c.compId + ':TRIG');
        wireGpTo(c.pins.ECHO.gp, takeTap(col + 2, 'T'), nextSig(), c.compId + ':ECHO');
        var trigRef = pico.pinHole['GP' + parseInt(c.pins.TRIG.gp)];
        var echoRef = pico.pinHole['GP' + parseInt(c.pins.ECHO.gp)];
        chk(c.compId, 'HC-SR04: TRIG→GP' + c.pins.TRIG.gp, trigRef && connected(trigRef, 'c' + (col + 1)));
        chk(c.compId, 'HC-SR04: ECHO→GP' + c.pins.ECHO.gp, echoRef && connected(echoRef, 'c' + (col + 2)));
        chk(c.compId, 'HC-SR04: VCC→3V3/GND→GND', is3v3('c' + col) && isGnd('c' + (col + 3)));
      },

      // 温湿度センサ DHT22（上グループ行c・NCは未接続）
      DHT22: function (c) {
        var col = allocCols(6, c);
        var pr = placePart2('wokwi-dht22', c.compId, [['VCC', 'c' + col], ['GND', 'c' + (col + 3)]], P);
        if (!pr.ok) return placeholder(c);
        partsSvg.push(pr.svg); grow(pr.bbox);
        for (var i = 0; i < 4; i++) usedTaps['c' + (col + i)] = 1;
        var vRail = railFor('3v3', 'T');
        addWire(takeTap(col, 'T'), vRail + '.' + railKNear(col), COLPAL.v, c.compId + ':VCC', { sag: 9 });
        var gRail = railFor('gnd', 'T');
        addWire(takeTap(col + 3, 'T'), gRail + '.' + railKNear(col + 3), COLPAL.gnd, c.compId + ':GND', { sag: 9 });
        wireGpTo(c.pins.SIG.gp, takeTap(col + 1, 'T'), nextSig(), c.compId + ':SIG');
        var gpRef = pico.pinHole['GP' + parseInt(c.pins.SIG.gp)];
        chk(c.compId, 'DHT22: SDA→GP' + c.pins.SIG.gp, gpRef && connected(gpRef, 'c' + (col + 1)));
        chk(c.compId, 'DHT22: VCC→3V3/GND→GND', is3v3('c' + col) && isGnd('c' + (col + 3)));
        chk(c.compId, 'DHT22: NC未接続', !isGnd('c' + (col + 2)) && !is3v3('c' + (col + 2)));
      },

      // I2C LCD1602（ボード外・下）
      LCD: function (c) {
        var slot = allocBottom(260, c);
        var pr = placePartAt('wokwi-lcd1602', c.compId, slot.x, slot.y, 0.85, P);
        if (!pr.ok) return placeholder(c);
        partsSvg.push(pr.svg); grow(pr.bbox);
        var gRail = railFor('gnd', 'B');
        addWire(c.compId + '.GND', gRail + '.4', COLPAL.gnd, c.compId + ':GND', { sag: 16 });
        var vRail = railFor('3v3', 'B');
        addWire(c.compId + '.VCC', vRail + '.5', COLPAL.v, c.compId + ':VCC', { sag: 22 });
        var tS = gpTap(c.pins.SDA.gp), tC = gpTap(c.pins.SCL.gp);
        if (tS) addWire(c.compId + '.SDA', tS.ref, nextSig(), c.compId + ':SDA', { sag: 28 });
        if (tC) addWire(c.compId + '.SCL', tC.ref, nextSig(), c.compId + ':SCL', { sag: 36 });
        var sdaRef = pico.pinHole['GP' + parseInt(c.pins.SDA.gp)];
        var sclRef = pico.pinHole['GP' + parseInt(c.pins.SCL.gp)];
        chk(c.compId, 'LCD: SDA→GP' + c.pins.SDA.gp, sdaRef && connected(c.compId + '.SDA', sdaRef));
        chk(c.compId, 'LCD: SCL→GP' + c.pins.SCL.gp, sclRef && connected(c.compId + '.SCL', sclRef));
        chk(c.compId, 'LCD: VCC→3V3/GND→GND', is3v3(c.compId + '.VCC') && isGnd(c.compId + '.GND'));
      },

      // 7セグメントLED（溝またぎ・非等方スケールで c/h 行に直挿し）
      SEG7: function (c) {
        var col = allocCols(6, c);
        var art = PARTS['wokwi-7segment'];
        if (!art) return placeholder(c);
        var sxx = SCL;
        var syy = (P['h' + col].y - P['c' + col].y) / (art.pins['COM.1'].y - art.pins['COM.2'].y);
        var tx = P['c' + col].x - sxx * art.pins['G'].x;
        var ty = P['c' + col].y - syy * art.pins['G'].y;
        var prefix = 'p' + (_uid++) + '_';
        partsSvg.push('<g class="cv-comp" data-comp-id="' + c.compId + '" transform="translate(' + r2(tx) + ',' + r2(ty) + ') scale(' + r4(sxx) + ',' + r4(syy) + ')">' +
          nsIds(art.inner, prefix) + '</g>');
        grow({ x0: tx, y0: ty, x1: tx + sxx * art.w, y1: ty + syy * art.h });
        var pinHoles = {
          G: 'c' + col, F: 'c' + (col + 1), 'COM.2': 'c' + (col + 2), A: 'c' + (col + 3), B: 'c' + (col + 4),
          E: 'h' + col, D: 'h' + (col + 1), 'COM.1': 'h' + (col + 2), C: 'h' + (col + 3), DP: 'h' + (col + 4)
        };
        Object.keys(pinHoles).forEach(function (k) { usedTaps[pinHoles[k]] = 1; });
        net.union(netKeyOf(pinHoles['COM.1']), netKeyOf(pinHoles['COM.2']));  // 内部導通
        var gRail = railFor('gnd', 'B');
        addWire(takeTap(col + 2, 'B'), gRail + '.' + railKNear(col + 2), COLPAL.gnd, c.compId + ':COM', { sag: 9 });
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function (s) {
          if (!c.pins[s]) return;
          var hRef = pinHoles[s];
          var band = hRef[0] === 'c' ? 'T' : 'B';
          wireGpTo(c.pins[s].gp, takeTap(parseInt(hRef.slice(1)), band), nextSig(), c.compId + ':' + s);
          var gpRef = pico.pinHole['GP' + parseInt(c.pins[s].gp)];
          chk(c.compId, '7セグ: ' + s + '→GP' + c.pins[s].gp, gpRef && connected(gpRef, hRef));
        });
        chk(c.compId, '7セグ: COM→GND', isGnd(pinHoles['COM.1']));
      },

      // L293D + DCモーター（DIP溝またぎ＋モーターはボード外・右）
      L293D: function (c) {
        var colL = allocCols(9, c);
        var dip = drawL293D(board, colL, c.compId, P);
        preSvg.push(dip.svg);
        Object.keys(dip.holes).forEach(function (k) { usedTaps[dip.holes[k]] = 1; });
        var H = dip.holes;
        var slot = allocRight(110, c);
        var mot = drawMotor(slot.x + 20, slot.y, 'motor_' + c.compId, 'DCモーター', P);
        partsSvg.push(mot.svg); grow(mot.bbox);
        var vRail = railFor('vext', 'B');
        addWire(takeTap(colL + 7, 'B'), vRail + '.' + railKNear(colL + 7), COLPAL.vext, c.compId + ':VS', { sag: 9 });
        var vRailT = railFor('vext', 'T');
        addWire(takeTap(colL, 'T'), vRailT + '.' + railKNear(colL), COLPAL.vext, c.compId + ':VSS', { sag: 9 });
        var gRail = railFor('gnd', 'B');
        addWire(takeTap(colL + 3, 'B'), gRail + '.' + railKNear(colL + 3), COLPAL.gnd, c.compId + ':GND', { sag: 9 });
        if (c.pins.EN && c.pins.EN.gp != null) {
          wireGpTo(c.pins.EN.gp, takeTap(colL, 'B'), nextSig(), c.compId + ':EN');
        } else {
          addWire(takeTap(colL, 'B'), vRail + '.' + railKNear(colL), COLPAL.vext, c.compId + ':EN', { sag: 13 });
        }
        wireGpTo(c.pins.IN1.gp, takeTap(colL + 1, 'B'), nextSig(), c.compId + ':IN1');
        wireGpTo(c.pins.IN2.gp, takeTap(colL + 6, 'B'), nextSig(), c.compId + ':IN2');
        addWire(takeTap(colL + 2, 'B'), 'motor_' + c.compId + '.a', nextSig(), c.compId + ':OUT1', { sag: 32 });
        addWire(takeTap(colL + 5, 'B'), 'motor_' + c.compId + '.b', nextSig(), c.compId + ':OUT2', { sag: 40 });
        var in1Ref = pico.pinHole['GP' + parseInt(c.pins.IN1.gp)];
        var in2Ref = pico.pinHole['GP' + parseInt(c.pins.IN2.gp)];
        chk(c.compId, 'L293D: IN1→GP' + c.pins.IN1.gp, in1Ref && connected(in1Ref, H.IN1));
        chk(c.compId, 'L293D: IN2→GP' + c.pins.IN2.gp, in2Ref && connected(in2Ref, H.IN2));
        chk(c.compId, 'L293D: OUT1/OUT2→モーター',
          connected(H.OUT1, 'motor_' + c.compId + '.a') && connected(H.OUT2, 'motor_' + c.compId + '.b'));
        chk(c.compId, 'L293D: GND→GND', isGnd(H.GNDb1));
        chk(c.compId, 'L293D: VS/VSS→外部電源', net.conn(netKeyOf(H.VS), VEXTKEY) && net.conn(netKeyOf(H.VSS), VEXTKEY));
        if (c.pins.EN && c.pins.EN.gp != null) {
          var enRef = pico.pinHole['GP' + parseInt(c.pins.EN.gp)];
          chk(c.compId, 'L293D: EN→GP' + c.pins.EN.gp, enRef && connected(enRef, H.EN1));
        } else {
          chk(c.compId, 'L293D: EN→＋(常時有効)', net.conn(netKeyOf(H.EN1), netKeyOf(vRail + '.1')));
        }
      },

      // ステッピングモーター 28BYJ-48 + ULN2003（両方ボード外）
      STEPPER: function (c) {
        var uslot = allocBottom(200, c);
        var uln = drawUln(uslot.x + 20, uslot.y, 'uln_' + c.compId, P);
        partsSvg.push(uln.svg); grow(uln.bbox);
        var mslot = allocRight(200, c);
        var pr = placePartAt('wokwi-stepper-motor', 'stp_' + c.compId, mslot.x, mslot.y, 0.75, P);
        if (pr.ok) { partsSvg.push(pr.svg); grow(pr.bbox); }
        ['IN1', 'IN2', 'IN3', 'IN4'].forEach(function (k, i) {
          var t = gpTap(c.pins[k].gp);
          if (t) addWire('uln_' + c.compId + '.' + k, t.ref, nextSig(), c.compId + ':' + k, { sag: 20 + i * 8 });
        });
        var vRail = railFor('vext', 'B');
        addWire('uln_' + c.compId + '.VCC', vRail + '.8', COLPAL.vext, c.compId + ':VCC', { sag: 14 });
        var gRail = railFor('gnd', 'B');
        addWire('uln_' + c.compId + '.GND', gRail + '.9', COLPAL.gnd, c.compId + ':GND', { sag: 20 });
        if (pr.ok) {
          ['A-', 'A+', 'B+', 'B-'].forEach(function (m, i) {
            addWire('uln_' + c.compId + '.M' + m, 'stp_' + c.compId + '.' + m,
              ['#2f7de0', '#e0a52f', '#8e44ad', '#159a72'][i], c.compId + ':M' + m, { sag: 16 + i * 8 });
          });
        }
        ['IN1', 'IN2', 'IN3', 'IN4'].forEach(function (k) {
          var gpRef = pico.pinHole['GP' + parseInt(c.pins[k].gp)];
          chk(c.compId, 'ステッピング: ' + k + '→GP' + c.pins[k].gp,
            gpRef && connected('uln_' + c.compId + '.' + k, gpRef));
        });
        chk(c.compId, 'ステッピング: 電源→外部電源/GND',
          net.conn(netKeyOf('uln_' + c.compId + '.VCC'), VEXTKEY) && isGnd('uln_' + c.compId + '.GND'));
        if (pr.ok) chk(c.compId, 'ステッピング: モーター4線',
          connected('uln_' + c.compId + '.MA-', 'stp_' + c.compId + '.A-') &&
          connected('uln_' + c.compId + '.MB-', 'stp_' + c.compId + '.B-'));
      },

      // 外部電源（電池ボックス・ボード外の左下）: b+/b- レールに給電
      EXTPWR: function (c) {
        var slot = { x: BX - 15, y: BY + board.h + 46 };
        var ov = overrides && overrides[c.compId];
        if (ov) { slot.x += ov.dx || 0; slot.y += ov.dy || 0; }
        var bat = drawBattery(slot.x, slot.y, c.compId, '外部電源（モーター用）', P);
        partsSvg.push(bat.svg); grow(bat.bbox);
        railFed['b+'] = 'vext';
        addWire(c.compId + '.+', 'b+.1', COLPAL.vext, c.compId + ':+', { sag: 14 });
        feedGndRail('b-');
        addWire(c.compId + '.-', 'b-.1', COLPAL.gnd, c.compId + ':-', { sag: 22 });
        chk(c.compId, '外部電源: −→GND共通（Picoと共通GND）', isGnd(c.compId + '.-'));
        chk(c.compId, '外部電源: +→＋レール', connected(c.compId + '.+', 'b+.1'));
      }
    };

    function placeholder(c) {
      var col = allocCols(4, c);
      var h = P['c' + Math.min(col, board.cols)];
      partsSvg.push('<g class="cv-comp" data-comp-id="' + c.compId + '">' +
        '<rect x="' + (h.x - 34) + '" y="' + (h.y - 20) + '" width="68" height="40" rx="6" fill="#eceae3" stroke="#b9b3a6" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<text x="' + h.x + '" y="' + (h.y + 4) + '" text-anchor="middle" font-size="11" fill="#7a7566">' + c.type + '</text></g>');
      chk(c.compId, 'プレースホルダ（アート未取得）', false);
    }

    // EXTPWR を最初に（レール割当確定）→ 盤上部品 → ボード外モジュール
    var order = comps.slice().sort(function (a, b) {
      var rank = { EXTPWR: 0, RES: 1, LED: 2, BTN: 3, BUZZ: 4, POT: 5, HCSR04: 6, DHT22: 7, SEG7: 8, L293D: 9, STEPPER: 10, LCD: 11, SERVO: 12, CDS: 13 };
      return (rank[a.type] == null ? 99 : rank[a.type]) - (rank[b.type] == null ? 99 : rank[b.type]);
    });
    order.forEach(function (c) {
      (handlers[c.type] || placeholder)(c);
    });

    return {
      preSvg: preSvg.join('\n'), partsSvg: partsSvg.join('\n'),
      wiresSvg: wires.render(), wireCount: wires.count(),
      checks: checks, bounds: bounds
    };
  }

  // ============================================================
  //  メイン: generateCircuitSVG
  // ============================================================
  window.generateCircuitSVG = function (workspace, options) {
    options = options || {};
    var overrides = options.overrides || {};
    var parsed = parseBlocks(workspace);
    var comps = parsed.comps;

    var colNeed = 24;
    comps.forEach(function (c) {
      colNeed += ({ LED: 8, BTN: 5, RES: 6, POT: 7, BUZZ: 6, HCSR04: 8, DHT22: 7, SEG7: 7, L293D: 10 })[c.type] || 0;
    });
    var cols = Math.max(34, colNeed);

    var board = makeBoard(cols);
    var pico = placePico(board, 2);
    if (!pico) {
      return {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120"><text x="20" y="60" fill="#c0392b" font-size="14">circuit_parts_data.js が読み込まれていません</text></svg>',
        compCount: 0, wireCount: 0
      };
    }

    var circuit = buildCircuit(board, pico, comps, overrides);

    var b = circuit.bounds;
    var pad = 24;
    var vx = Math.min(b.x0, BX) - pad, vy = Math.min(b.y0, BY - PITCH) - pad;
    var vx1 = Math.max(b.x1, BX + board.w) + pad, vy1 = Math.max(b.y1, BY + board.h) + pad;

    var overlay = [];
    if (parsed.onboardLedOn) {
      vy -= 26;
      overlay.push('<text x="' + pico.cx + '" y="' + (vy + 22) + '" text-anchor="middle" font-size="13" fill="#2e7d32" font-weight="bold">GP25 = オンボードLED（外部配線なし）</text>');
    }
    (parsed.badPins || []).forEach(function (bp, i) {
      if (i === 0) vy -= 20;
      overlay.push('<text x="' + pico.cx + '" y="' + (vy + 42 + i * 16) + '" text-anchor="middle" font-size="12" fill="#c0392b">GP' + bp.gp + ' は内部専用ピンです</text>');
    });
    if (comps.length === 0 && !parsed.onboardLedOn && (parsed.badPins || []).length === 0) {
      overlay.push('<text x="' + pico.cx + '" y="' + (vy1 + 28) + '" text-anchor="middle" font-size="20" fill="#b7b1a3">MicroPython ブロックを追加すると</text>');
      overlay.push('<text x="' + pico.cx + '" y="' + (vy1 + 56) + '" text-anchor="middle" font-size="20" fill="#b7b1a3">ブレッドボード配線図が表示されます</text>');
      vy1 += 72;
    }

    var vw = vx1 - vx, vh = vy1 - vy;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + r2(vw) + '" height="' + r2(vh) +
      '" viewBox="' + r2(vx) + ' ' + r2(vy) + ' ' + r2(vw) + ' ' + r2(vh) + '" font-family="sans-serif">\n' +
      '<rect x="' + r2(vx) + '" y="' + r2(vy) + '" width="' + r2(vw) + '" height="' + r2(vh) + '" fill="#fbfaf7"/>\n' +
      board.svg + '\n' + circuit.preSvg + '\n' + pico.svg + '\n' +
      circuit.partsSvg + '\n' + circuit.wiresSvg + '\n' + overlay.join('\n') + '\n</svg>';

    window.__PYCO_BB_CHECKS = {
      picoTop: PICO_TOP, picoBot: PICO_BOT,
      picoTable: pico.table, picoPinTableOk: pico.pinTableOk,
      checks: circuit.checks
    };

    return { svg: svg, compCount: comps.length, wireCount: circuit.wireCount };
  };

  window.__PYCO_BB_ACTIVE = true;
})();
