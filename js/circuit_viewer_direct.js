// ===== 直結スタイル 実体配線図レンダラ (Phase 3) =====
//
// window.generateCircuitSVG(workspace, {overrides, wireOverrides})
//   → { svg, compCount, wireCount }   （circuit_viewer.js と同一契約）
//
// 既定でこの直結レンダラを使う。切替:
//   既定       = 直結スタイル（本ファイル・ブレッドボードなし）
//   ?cv=bb     = ブレッドボード型（circuit_viewer_bb.js）
//   ?cv=legacy = 旧レンダラ（circuit_viewer.js）
// 読み込み順は app.html で legacy → bb → direct。後勝ちで direct が既定になる。
//
// 設計要点:
//   - Pico(自作SVG)を中央に水平配置。上辺ピン列(row c)=VBUS/3V3/GP16.. 下辺(row h)=GP0..GP15。
//   - 部品は接続先GPピンの在る側(上/下)へ、実寸(SVG境界)を反映したスロットに重なりゼロで配置。
//   - ピン→ピンの直接ジャンパー線(軽い弧)。3V3/VBUS=赤・GND=黒・信号=部品ごと識別色。
//   - GNDは最寄りのGNDピンへ。Pico本体を横切る配線はPicoの端を回って外側最短で迂回。
//   - 部品アートは js/circuit_parts_data.js（wokwi MIT + 自作Pico）。
//
(function () {
  'use strict';

  try {
    var _p = (typeof location !== 'undefined') ? new URLSearchParams(location.search) : null;
    var _cv = _p && _p.get('cv');
    if (_cv === 'legacy' || _cv === 'bb') return;   // 旧/BB レンダラを温存
  } catch (e) { /* location 不在は direct を使う */ }

  var PARTS = (typeof window !== 'undefined' && window.PYCO_CIRCUIT_PARTS) || {};

  // ============================================================
  //  幾何定数
  // ============================================================
  var PITCH = 18;                 // Picoピン間隔
  var SCL = PITCH / 9.6;          // Pico自作アートの格子整合スケール ≒1.875
  var LEAD = 34;                  // Picoピン列と部品ピン列の間隙
  var GAP = 30;                   // 同一バンド内の部品間隙
  var LBL = '#3a3f47';

  function r2(v) { return Math.round(v * 100) / 100; }
  function r4(v) { return Math.round(v * 10000) / 10000; }

  var _uid = 0;
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
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
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ラベル（白ハローで可読性確保）
  function label(x, y, text, opts) {
    opts = opts || {};
    var fs = opts.fs || 9, anchor = opts.anchor || 'middle', fill = opts.fill || LBL;
    var weight = opts.weight ? ' font-weight="' + opts.weight + '"' : '';
    return '<text x="' + r2(x) + '" y="' + r2(y) + '" text-anchor="' + anchor + '" font-size="' + fs +
      '"' + weight + ' fill="' + fill + '" stroke="#fbfaf7" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">' +
      esc(text) + '</text>';
  }

  // ============================================================
  //  Pico ピン配列の正（実機準拠・機械照合用）
  // ============================================================
  var PICO_TOP = ['VBUS', 'VSYS', 'GND', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'AGND',
    'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'];
  var PICO_BOT = ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7',
    'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'];
  function wokwiPinName(n) {
    if (n === 'GND.7') return 'AGND';
    if (/^GND\.\d+$/.test(n)) return 'GND';
    return n;
  }

  // ============================================================
  //  ブロック解析（circuit_viewer_bb.js と同一意味論）
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
  //  ネットグラフ（union-find・電気検証）
  //  net key: 'gp:N' / '3v3' / 'vbus' / 'gnd' / 'vext' / '<compId>.<pin>'
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

  // ============================================================
  //  Pico 水平配置（自作SVG・上辺=row c / 下辺=row h）
  // ============================================================
  function placePico(cx, cy) {
    var art = PARTS['pi-pico'];
    if (!art) return null;
    var gp0 = art.pins['GP0'], gp15 = art.pins['GP15'], vbus = art.pins['VBUS'];
    // 目標: GP0→(pinX(1),botY), GP15→(pinX(20),botY), VBUS→(pinX(1),topY)
    var span = 19 * PITCH;
    var x1 = cx - span / 2;                 // pinX(1)
    var sx = span / (gp15.y - gp0.y);       // ≒ SCL
    var rowGap = sx * (vbus.x - gp0.x);      // 上下ピン列の距離（等方）
    var topY = cy - rowGap / 2, botY = cy + rowGap / 2;
    var sy = rowGap / ((art.w - gp0.x) - (art.w - vbus.x)); // = sx（等方）
    var ox = x1 - sx * gp0.y;
    var oy = topY - sy * (art.w - vbus.x);
    // 変換: (x,y) → (ox + sx*y, oy + sy*(W - x))  … 反時計回り90°
    var prefix = 'pico' + (_uid++) + '_';
    var tf = 'translate(' + r2(ox) + ',' + r2(oy) + ') matrix(0,' + r4(-sy) + ',' + r4(sx) + ',0,0,' + r4(sy * art.w) + ')';
    var svg = '<g class="cv-comp" data-comp-id="__pico__" transform="' + tf + '">' + nsIds(art.inner, prefix) + '</g>';

    var pinPos = {}, gndTop = [], gndBot = [], table = { top: [], bot: [] };
    Object.keys(art.pins).forEach(function (nm) {
      var q = art.pins[nm];
      var X = ox + sx * q.y, Y = oy + sy * (art.w - q.x);
      var row = (Y < cy) ? 'c' : 'h';
      var col = Math.round((X - x1) / PITCH) + 1;
      var canon = wokwiPinName(nm);
      if (canon === 'GND') (row === 'c' ? gndTop : gndBot).push({ x: X, y: Y, col: col });
      else pinPos[canon] = { x: X, y: Y, row: row, col: col };
      table[row === 'c' ? 'top' : 'bot'].push({ col: col, name: canon });
    });
    table.top.sort(function (a, b) { return a.col - b.col; });
    table.bot.sort(function (a, b) { return a.col - b.col; });
    var topOk = table.top.map(function (e) { return e.name; }).join(',') === PICO_TOP.join(',');
    var botOk = table.bot.map(function (e) { return e.name; }).join(',') === PICO_BOT.join(',');
    gndTop.sort(function (a, b) { return a.col - b.col; });
    gndBot.sort(function (a, b) { return a.col - b.col; });

    // 本体 bbox（4隅を変換）
    var corners = [[0, 0], [art.w, 0], [0, art.h], [art.w, art.h]].map(function (p) {
      return { x: ox + sx * p[1], y: oy + sy * (art.w - p[0]) };
    });
    var xs = corners.map(function (c) { return c.x; }), ysv = corners.map(function (c) { return c.y; });
    var box = { x0: Math.min.apply(0, xs), y0: Math.min.apply(0, ysv), x1: Math.max.apply(0, xs), y1: Math.max.apply(0, ysv) };

    return {
      svg: svg, pinPos: pinPos, gndTop: gndTop, gndBot: gndBot,
      topY: topY, botY: botY, x1: x1, cx: cx, box: box,
      table: table, pinTableOk: topOk && botOk
    };
  }

  // ============================================================
  //  部品配置ユーティリティ
  // ============================================================
  function bboxOfAligned(data, target0, pin0, s, ang) {
    var cs = Math.cos(ang), sn = Math.sin(ang);
    var pts = [[0, 0], [data.w, 0], [0, data.h], [data.w, data.h]].map(function (p) {
      var dx = (p[0] - pin0.x) * s, dy = (p[1] - pin0.y) * s;
      return [target0.x + dx * cs - dy * sn, target0.y + dx * sn + dy * cs];
    });
    var xs = pts.map(function (p) { return p[0]; }), ysv = pts.map(function (p) { return p[1]; });
    return { x0: Math.min.apply(0, xs), y0: Math.min.apply(0, ysv), x1: Math.max.apply(0, xs), y1: Math.max.apply(0, ysv) };
  }
  // 2ピンを2つの目標点に合わせて回転+均一スケール配置
  function placeAligned(tag, id, targets, POINTS) {
    var data = PARTS[tag];
    if (!data) return { ok: false, svg: '' };
    var pin0 = data.pins[targets[0][0]], t0 = targets[0][1];
    if (!pin0 || !t0) return { ok: false, svg: '' };
    var s = 1, ang = 0;
    if (targets.length > 1) {
      var pin1 = data.pins[targets[1][0]], t1 = targets[1][1];
      if (pin1 && t1) {
        var pd = Math.hypot(pin1.x - pin0.x, pin1.y - pin0.y);
        var td = Math.hypot(t1.x - t0.x, t1.y - t0.y);
        if (pd > 0.01) s = td / pd;
        ang = Math.atan2(t1.y - t0.y, t1.x - t0.x) - Math.atan2(pin1.y - pin0.y, pin1.x - pin0.x);
      }
    }
    var cos = Math.cos(ang), sin = Math.sin(ang);
    Object.keys(data.pins).forEach(function (nm) {
      var q = data.pins[nm];
      var dx = (q.x - pin0.x) * s, dy = (q.y - pin0.y) * s;
      POINTS[id + '.' + nm] = { x: t0.x + dx * cos - dy * sin, y: t0.y + dx * sin + dy * cos };
    });
    var prefix = 'p' + (_uid++) + '_';
    var tf = 'translate(' + r2(t0.x) + ',' + r2(t0.y) + ') rotate(' + r4(ang * 180 / Math.PI) +
      ') scale(' + r4(s) + ') translate(' + r2(-pin0.x) + ',' + r2(-pin0.y) + ')';
    return {
      ok: true, scale: s,
      svg: '<g class="cv-comp" data-comp-id="' + id + '" transform="' + tf + '">' + nsIds(data.inner, prefix) + '</g>',
      bbox: bboxOfAligned(data, t0, pin0, s, ang)
    };
  }
  // 水平2ピンをピンライン上に載せる。top=正立(本体は上)・bottom=180°反転(本体は下・ピンは上向き)。
  // 部品ごとの sign 混乱を避けるため、自然な左右順を判定して目標順を決める。
  function placeLine(tag, id, pinA, pinB, band, cx, pinY, scale, POINTS) {
    var data = PARTS[tag];
    if (!data) return { ok: false, svg: '' };
    var a = data.pins[pinA], b = data.pins[pinB];
    if (!a || !b) return { ok: false, svg: '' };
    var leftName = a.x <= b.x ? pinA : pinB, rightName = a.x <= b.x ? pinB : pinA;
    var d = Math.abs(a.x - b.x) * scale;
    var xl = cx - d / 2, xr = cx + d / 2;
    var targets = (band === 't')
      ? [[leftName, { x: xl, y: pinY }], [rightName, { x: xr, y: pinY }]]   // 正立
      : [[leftName, { x: xr, y: pinY }], [rightName, { x: xl, y: pinY }]];  // 180°反転
    return placeAligned(tag, id, targets, POINTS);
  }
  // 左上基準・任意スケール（モジュール類）
  function placeAt(tag, id, tx, ty, s, POINTS) {
    var data = PARTS[tag];
    if (!data) return { ok: false, svg: '' };
    Object.keys(data.pins).forEach(function (nm) {
      var q = data.pins[nm];
      POINTS[id + '.' + nm] = { x: tx + s * q.x, y: ty + s * q.y };
    });
    var prefix = 'p' + (_uid++) + '_';
    return {
      ok: true,
      svg: '<g class="cv-comp" data-comp-id="' + id + '" transform="translate(' + r2(tx) + ',' + r2(ty) + ') scale(' + r4(s) + ')">' +
        nsIds(data.inner, prefix) + '</g>',
      bbox: { x0: tx, y0: ty, x1: tx + s * data.w, y1: ty + s * data.h }
    };
  }

  // ============================================================
  //  自作モジュール（ボード外・bb からの移植/簡略）
  // ============================================================
  function drawBattery(x, y, id, txt, POINTS) {
    var w = 104, h = 62, svg = [];
    svg.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="#2e3440" stroke="#1c2128" stroke-width="2"/>');
    for (var i = 0; i < 2; i++) {
      var cyy = y + 16 + i * 28;
      svg.push('<rect x="' + (x + 14) + '" y="' + (cyy - 9) + '" width="76" height="18" rx="4" fill="#cfa54a" stroke="#8d6f2f"/>');
    }
    svg.push('<text x="' + (x + 12) + '" y="' + (y + 14) + '" fill="#ff8d8d" font-size="13" font-weight="bold">+</text>');
    svg.push('<text x="' + (x + 12) + '" y="' + (y + h - 6) + '" fill="#9fc3ff" font-size="14" font-weight="bold">−</text>');
    POINTS[id + '.+'] = { x: x + w - 8, y: y + 12 };
    POINTS[id + '.-'] = { x: x + w - 8, y: y + h - 12 };
    svg.push('<circle cx="' + (x + w - 8) + '" cy="' + (y + 12) + '" r="3.2" fill="#d24a4a"/>');
    svg.push('<circle cx="' + (x + w - 8) + '" cy="' + (y + h - 12) + '" r="3.2" fill="#33363c"/>');
    if (txt) svg.push(label(x + w / 2, y + h + 16, txt, { fs: 11, weight: 'bold' }));
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: x, y0: y, x1: x + w, y1: y + h + 22 } };
  }
  function drawMotor(x, y, id, txt, POINTS) {
    var w = 104, h = 58, svg = [];
    svg.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#c8ccd3" stroke="#8b9098" stroke-width="2"/>');
    svg.push('<rect x="' + (x + w - 4) + '" y="' + (y + 6) + '" width="14" height="' + (h - 12) + '" rx="4" fill="#f3f0ea" stroke="#b6b0a4" stroke-width="2"/>');
    for (var i = 0; i < 3; i++)
      svg.push('<line x1="' + (x + 20 + i * 26) + '" y1="' + (y + 10) + '" x2="' + (x + 20 + i * 26) + '" y2="' + (y + h - 10) + '" stroke="#aeb3bb" stroke-width="3"/>');
    var tex = x - 12, tya = y + h / 2 - 12, tyb = y + h / 2 + 12;
    [tya, tyb].forEach(function (ty) { svg.push('<rect x="' + (tex - 4) + '" y="' + (ty - 4) + '" width="16" height="8" fill="#c9963f" stroke="#8d6f2f" stroke-width="1"/>'); });
    POINTS[id + '.a'] = { x: tex - 4, y: tya };
    POINTS[id + '.b'] = { x: tex - 4, y: tyb };
    if (txt) svg.push(label(x + w / 2, y + h + 15, txt, { fs: 11, weight: 'bold' }));
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: tex - 6, y0: y, x1: x + w + 12, y1: y + h + 20 } };
  }
  function drawUln(x, y, id, POINTS) {
    var w = 156, h = 84, svg = [];
    svg.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#1f5fbf" stroke="#143f80" stroke-width="2"/>');
    svg.push('<text x="' + (x + w / 2) + '" y="' + (y + 14) + '" fill="#fff" font-size="10" font-weight="bold" text-anchor="middle">ULN2003 ドライバ</text>');
    svg.push('<rect x="' + (x + 54) + '" y="' + (y + 30) + '" width="52" height="18" rx="2" fill="#17171c" stroke="#000"/>');
    var names = ['IN1', 'IN2', 'IN3', 'IN4', '+', '−'];
    for (var i = 0; i < 6; i++) {
      var py = y + 18 + i * 11;
      svg.push('<rect x="' + (x - 5) + '" y="' + (py - 3.5) + '" width="10" height="7" rx="1.5" fill="#e6c14e" stroke="#a6841f"/>');
      svg.push('<text x="' + (x + 9) + '" y="' + (py + 3) + '" fill="#dce7ff" font-size="8" font-weight="bold">' + names[i] + '</text>');
      var key = names[i] === '+' ? 'VCC' : (names[i] === '−' ? 'GND' : names[i]);
      POINTS[id + '.' + key] = { x: x - 4, y: py };
    }
    var motNames = ['A-', 'A+', 'B+', 'B-'];
    for (var j = 0; j < 4; j++) {
      var my = y + 30 + j * 11;
      svg.push('<circle cx="' + (x + w - 7) + '" cy="' + my + '" r="2.6" fill="#7a5e16"/>');
      POINTS[id + '.M' + motNames[j]] = { x: x + w - 7, y: my };
    }
    svg.push('<text x="' + (x + w / 2) + '" y="' + (y + h - 8) + '" fill="#dce7ff" font-size="9" text-anchor="middle">28BYJ-48 用</text>');
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: x - 8, y0: y, x1: x + w + 4, y1: y + h + 4 } };
  }
  // L293D DIP-16 スタンドアロン（上下8ピン・ピン座標を返す）
  function drawL293D(x, y, id, POINTS) {
    var pw = 8 * PITCH, ph = 74, svg = [];
    svg.push('<rect x="' + x + '" y="' + y + '" width="' + pw + '" height="' + ph + '" rx="4" fill="#2b2e34" stroke="#17191d" stroke-width="1.5"/>');
    svg.push('<path d="M' + (x + pw / 2 - 8) + ' ' + y + ' a8 8 0 0 0 16 0" fill="#454a52"/>');
    svg.push('<text x="' + (x + pw / 2) + '" y="' + (y + ph / 2 + 4) + '" fill="#d7dadf" font-size="13" font-weight="bold" text-anchor="middle">L293D</text>');
    svg.push('<circle cx="' + (x + 12) + '" cy="' + (y + ph - 10) + '" r="2.5" fill="#d7dadf"/>');
    var topN = ['VSS', '4A', '4Y', 'GND', 'GND', '3Y', '3A', 'EN2'];
    var botN = ['EN1', '1A(IN1)', '1Y(OUT1)', 'GND', 'GND', '2Y(OUT2)', '2A(IN2)', 'VS'];
    var keyTop = ['VSS', null, null, 'GNDt1', 'GNDt2', null, null, 'EN2'];
    var keyBot = ['EN1', 'IN1', 'OUT1', 'GNDb1', 'GNDb2', 'OUT2', 'IN2', 'VS'];
    for (var i = 0; i < 8; i++) {
      var px = x + PITCH / 2 + i * PITCH;
      svg.push('<rect x="' + (px - 3) + '" y="' + (y - 7) + '" width="6" height="7" rx="1" fill="#c9cdd3"/>');
      svg.push('<rect x="' + (px - 3) + '" y="' + y_bot() + '" width="6" height="7" rx="1" fill="#c9cdd3"/>');
      if (keyTop[i]) POINTS[id + '.' + keyTop[i]] = { x: px, y: y - 6 };
      if (keyBot[i]) POINTS[id + '.' + keyBot[i]] = { x: px, y: y + ph + 6 };
      svg.push('<text x="' + px + '" y="' + (y + 11) + '" fill="#9aa3ad" font-size="5" text-anchor="middle">' + topN[i] + '</text>');
      svg.push('<text x="' + px + '" y="' + (y + ph - 4) + '" fill="#9aa3ad" font-size="4.6" text-anchor="middle">' + botN[i] + '</text>');
    }
    function y_bot() { return y + ph; }
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: x, y0: y - 8, x1: x + pw, y1: y + ph + 8 } };
  }

  // ============================================================
  //  配線マネージャ（直結・弧＋Pico端の外回り迂回）
  // ============================================================
  var COLPAL = {
    v: '#d24a4a', vext: '#e07b2f', gnd: '#33363c',
    sig: ['#2f7de0', '#e0a52f', '#8e44ad', '#159a72', '#c0392b', '#0e7490', '#a3559d', '#2f9e44']
  };
  function ptInBox(p, box) { return p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1; }
  // 直線が本体内側帯(inner)を横切るか（端点=ピンは inner の外側にある想定）
  function segHitsInner(a, b, inner) {
    var n = 28;
    for (var i = 0; i <= n; i++) {
      var t = i / n, p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (ptInBox(p, inner)) return true;
    }
    return false;
  }
  // 折れ線を samples 個でサンプルして inner を横切るか
  function polyHitsInner(pts, inner) {
    for (var s = 0; s < pts.length - 1; s++) {
      var p = pts[s], q = pts[s + 1], n = 16;
      for (var i = 1; i < n; i++) {
        var t = i / n;
        if (ptInBox({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }, inner)) return true;
      }
    }
    return false;
  }
  // 角を丸めた折れ線パス
  function roundedPoly(pts, r) {
    if (pts.length < 3) return 'M' + r2(pts[0].x) + ',' + r2(pts[0].y) + ' L' + r2(pts[pts.length - 1].x) + ',' + r2(pts[pts.length - 1].y);
    var d = 'M' + r2(pts[0].x) + ',' + r2(pts[0].y);
    for (var i = 1; i < pts.length - 1; i++) {
      var p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
      var v1 = { x: p1.x - p0.x, y: p1.y - p0.y }, v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
      var l1 = Math.hypot(v1.x, v1.y) || 1, l2 = Math.hypot(v2.x, v2.y) || 1;
      var rr = Math.min(r, l1 / 2, l2 / 2);
      var a1 = { x: p1.x - v1.x / l1 * rr, y: p1.y - v1.y / l1 * rr };
      var a2 = { x: p1.x + v2.x / l2 * rr, y: p1.y + v2.y / l2 * rr };
      d += ' L' + r2(a1.x) + ',' + r2(a1.y) + ' Q' + r2(p1.x) + ',' + r2(p1.y) + ' ' + r2(a2.x) + ',' + r2(a2.y);
    }
    var last = pts[pts.length - 1];
    d += ' L' + r2(last.x) + ',' + r2(last.y);
    return d;
  }
  function WireMgr(picoBox, inner, rows) {
    var list = [];
    var center = { x: (picoBox.x0 + picoBox.x1) / 2, y: (picoBox.y0 + picoBox.y1) / 2 };
    var crossCount = 0, crossIds = [];
    return {
      add: function (a, b, color, id, opt) {
        if (!a || !b) return false;
        list.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, color: color, id: id, sag: opt && opt.sag != null ? opt.sag : null });
        return true;
      },
      count: function () { return list.length; },
      crossings: function () { return crossCount; },
      crossIds: function () { return crossIds; },
      render: function () {
        // 束分散
        var cl = {};
        function ck(p) { return Math.round(p.x / 22) + ':' + Math.round(p.y / 22); }
        list.forEach(function (w) { [ck(w.a), ck(w.b)].forEach(function (k) { (cl[k] || (cl[k] = [])).push(w); }); });
        list.forEach(function (w) { w.avoid = 0; });
        Object.keys(cl).forEach(function (k) {
          var ws = cl[k]; if (ws.length < 2) return;
          ws.sort(function (p, q) { return Math.hypot(p.b.x - p.a.x, p.b.y - p.a.y) - Math.hypot(q.b.x - q.a.x, q.b.y - q.a.y); });
          ws.forEach(function (w, i) { w.avoid = Math.max(w.avoid, i); });
        });
        function isPicoPin(p) {
          var onRow = (rows && (Math.abs(p.y - rows.topY) < 3 || Math.abs(p.y - rows.botY) < 3));
          return onRow && p.x >= picoBox.x0 - 2 && p.x <= picoBox.x1 + 2;
        }
        return list.map(function (w) {
          var a = w.a, b = w.b, d, hitPts;
          if (segHitsInner(a, b, inner)) {
            // Pico本体を横切る → 端を回り、対象ピンの在る辺の外側から着地（直交ルート）
            var P = isPicoPin(b) ? b : (isPicoPin(a) ? a : null);
            var Q = (P === b) ? a : b;
            var goLeft = (Q.x < center.x);
            var endX = goLeft ? (picoBox.x0 - 22 - w.avoid * 9) : (picoBox.x1 + 22 + w.avoid * 9);
            var pts;
            if (P) {
              var topPin = Math.abs(P.y - rows.topY) < Math.abs(P.y - rows.botY);
              var yOuter = topPin ? (picoBox.y0 - 20 - w.avoid * 8) : (picoBox.y1 + 20 + w.avoid * 8);
              pts = [Q, { x: endX, y: Q.y }, { x: endX, y: yOuter }, { x: P.x, y: yOuter }, P];
            } else {
              // モジュール間の横断（稀）: 本体の上/下の外側を回す（両端点より外へ）
              var below = (a.y + b.y) / 2 >= center.y;
              var yOut2 = below ? (Math.max(picoBox.y1, a.y, b.y) + 22 + w.avoid * 8)
                                : (Math.min(picoBox.y0, a.y, b.y) - 22 - w.avoid * 8);
              pts = [a, { x: a.x, y: yOut2 }, { x: b.x, y: yOut2 }, b];
            }
            d = roundedPoly(pts, 10);
            hitPts = pts;
          } else {
            var dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1;
            var sag = (w.sag != null ? w.sag : Math.min(24, 7 + dist * 0.09)) + w.avoid * 8;
            var mx0 = (a.x + b.x) / 2, my0 = (a.y + b.y) / 2;
            var nx = -dy / dist, ny = dx / dist;
            var away = (mx0 - center.x) * nx + (my0 - center.y) * ny;
            if (away < 0) { nx = -nx; ny = -ny; }
            var cp = { x: mx0 + nx * sag, y: my0 + ny * sag };
            d = 'M' + r2(a.x) + ',' + r2(a.y) + ' Q' + r2(cp.x) + ',' + r2(cp.y) + ' ' + r2(b.x) + ',' + r2(b.y);
            hitPts = null;
            // 二次ベジェのサンプル（凸包内）
            var n = 24, prev = a, sampHit = false;
            for (var si = 1; si <= n; si++) { var t = si / n, u = 1 - t; var pp = { x: u * u * a.x + 2 * u * t * cp.x + t * t * b.x, y: u * u * a.y + 2 * u * t * cp.y + t * t * b.y }; if (ptInBox(pp, inner)) { sampHit = true; break; } }
            if (sampHit) { crossCount++; crossIds.push(w.id); }
          }
          if (hitPts && polyHitsInner(hitPts, inner)) { crossCount++; crossIds.push(w.id); }
          return '<g class="cv-wire-arc" data-wire-id="' + w.id + '">' +
            '<path d="' + d + '" fill="none" stroke="' + w.color + '" stroke-width="3.4" stroke-linecap="round"/>' +
            '<circle cx="' + r2(a.x) + '" cy="' + r2(a.y) + '" r="3.1" fill="' + w.color + '"/>' +
            '<circle cx="' + r2(b.x) + '" cy="' + r2(b.y) + '" r="3.1" fill="' + w.color + '"/></g>';
        }).join('\n');
      }
    };
  }

  // ============================================================
  //  メイン回路構築
  // ============================================================
  function buildCircuit(pico, comps, overrides) {
    var POINTS = {};
    var net = NetGraph();
    // 本体内側帯（ピン列より十分内側）。ここを横切る配線だけを「Pico横断」とみなす。
    // ピン直近(±14px)はピンへの正当な着地帯なので除外し、中央を貫く線だけ検出する。
    var innerBox = { x0: pico.box.x0 + 6, x1: pico.box.x1 - 6, y0: pico.topY + 14, y1: pico.botY - 14 };
    var wires = WireMgr(pico.box, innerBox, { topY: pico.topY, botY: pico.botY });
    var partsSvg = [], labelSvg = [];
    // 重なり検証用（Pico本体も含める＝部品がPicoに被らないことを機械判定）
    var boxes = [{ id: '__pico__', bb: { x0: pico.box.x0, y0: pico.box.y0, x1: pico.box.x1, y1: pico.box.y1 } }];
    var usedPins = {};     // 使用中Picoピン → ラベル用
    var bounds = { x0: pico.box.x0, y0: pico.box.y0, x1: pico.box.x1, y1: pico.box.y1 };
    var checks = [];
    var sigIdx = 0;
    function nextSig() { return COLPAL.sig[sigIdx++ % COLPAL.sig.length]; }
    function grow(bb) {
      if (!bb) return;
      bounds.x0 = Math.min(bounds.x0, bb.x0); bounds.y0 = Math.min(bounds.y0, bb.y0);
      bounds.x1 = Math.max(bounds.x1, bb.x1); bounds.y1 = Math.max(bounds.y1, bb.y1);
    }
    function addBox(id, bb) { boxes.push({ id: id, bb: bb }); grow(bb); }
    function chk(comp, rule, ok, detail) { checks.push({ comp: comp, rule: rule, ok: !!ok, detail: detail || '' }); }

    // Picoピン点/キー
    function gpPt(gp) { var p = pico.pinPos['GP' + parseInt(gp)]; if (p) usedPins['GP' + parseInt(gp)] = p; return p; }
    function gpKey(gp) { return 'gp:' + parseInt(gp); }
    function v3Pt() { usedPins['3V3'] = pico.pinPos['3V3']; return pico.pinPos['3V3']; }
    function vbusPt() { usedPins['VBUS'] = pico.pinPos['VBUS']; return pico.pinPos['VBUS']; }
    // 最寄りGND（部品の在るバンド優先）
    function gndPt(x, band) {
      var pool = band === 't' ? pico.gndTop : pico.gndBot;
      if (!pool.length) pool = pico.gndTop.concat(pico.gndBot);
      var best = pool[0], bd = Infinity;
      pool.forEach(function (g) { var d = Math.abs(g.x - x); if (d < bd) { bd = d; best = g; } });
      usedPins['GND@' + Math.round(best.x)] = { x: best.x, y: best.y, name: 'GND' };
      return best;
    }
    // 電源電位を静的に確定（Pico内部でGND/3V3/vextを結線）
    net.union('gnd', 'gnd');
    var VEXT_PT = null;

    function connected(a, b) { return net.conn(a, b); }
    function isGnd(k) { return net.conn(k, 'gnd'); }
    function is3v3(k) { return net.conn(k, '3v3'); }

    // ---- バンド割当（primary GP の行で上下決定）----
    function primaryBand(c) {
      var gps = [];
      Object.keys(c.pins).forEach(function (k) { var pk = c.pins[k]; if (pk && pk.gp != null) gps.push(pk.gp); });
      for (var i = 0; i < gps.length; i++) {
        var p = pico.pinPos['GP' + parseInt(gps[i])];
        if (p) return { band: p.row === 'c' ? 't' : 'h', anchorX: p.x };
      }
      return { band: 'h', anchorX: pico.cx };
    }

    // ---- スロット割当（実寸反映・重なりゼロ）----
    // 上下バンドそれぞれ左→右に詰める。cursor で重なり回避。
    var cursor = { t: -1e9, h: -1e9 };
    function slot(band, w, anchorX, comp) {
      var ov = overrides && overrides[comp.compId];
      var desired = anchorX - w / 2 + ((ov && ov.dx) || 0);
      var left = Math.max(desired, cursor[band] + GAP);
      cursor[band] = left + w;
      return { left: left, cx: left + w / 2, dy: (ov && ov.dy) || 0 };
    }
    // ボード外モジュール配置カーソル
    var rightX = 0, rightY = 0;

    // ピンライン（部品ピンを載せる水平線）
    function lineY(band, offset) { return band === 't' ? (pico.box.y0 - LEAD - (offset || 0)) : (pico.box.y1 + LEAD + (offset || 0)); }
    // 部品ピン小ラベル（アートと反対＝Pico側へ寄せる）
    function pinLabel(pt, text, band) {
      labelSvg.push(label(pt.x, band === 't' ? pt.y - 6 : pt.y + 11, text, { fs: 7.5 }));
    }
    // 部品名ラベル（アートの外側=Picoと反対側）
    function nameLabel(cx, bb, band, text) {
      var y = band === 't' ? bb.y0 - 5 : bb.y1 + 13;
      labelSvg.push(label(cx, y, text, { fs: 11, weight: 'bold' }));
    }

    // ====== 部品ハンドラ ======
    var H = {};

    // LED + 直列抵抗（同一スロットに縦積み: Pico側=LED脚, 外側=抵抗→GND）
    H.LED = function (c) {
      var pb = primaryBand(c), band = pb.band, dir = band === 't' ? -1 : 1;
      var led = PARTS['wokwi-led'], res = PARTS['wokwi-resistor'];
      var sL = 1.5, sR = 1.4;
      var ledW = led.w * sL, ledH = led.h * sL, resW = res.w * sR;
      var w = Math.max(ledW, resW);
      var sl = slot(band, w, pb.anchorX, c);
      var pinY = lineY(band, 0) + sl.dy;
      // LED: A/C を水平線に。上バンド=正立(脚下), 下バンド=180°(脚上)
      var pr = placeLine('wokwi-led', c.compId, 'A', 'C', band, sl.cx, pinY, sL, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      // 抵抗: LEDの外側に水平配置（片脚をLED.C付近、他脚をGNDへ）
      var resY = (band === 't' ? pr.bbox.y0 - 12 : pr.bbox.y1 + 12) + 0;
      var rr = placeAligned('wokwi-resistor', 'res_' + c.compId,
        [['1', { x: sl.cx - resW / 2, y: resY }], ['2', { x: sl.cx + resW / 2, y: resY }]], POINTS);
      partsSvg.push(rr.svg); addBox('res_' + c.compId, rr.bbox);
      // 配線
      var gp = c.pins.A.gp, gpp = gpPt(gp);
      wires.add(gpp, POINTS[c.compId + '.A'], nextSig(), c.compId + ':A');
      net.union(gpKey(gp), c.compId + '.A');
      wires.add(POINTS[c.compId + '.C'], POINTS['res_' + c.compId + '.1'], nextSig(), c.compId + ':C', { sag: 6 });
      net.union(c.compId + '.C', 'res_' + c.compId + '.1');
      net.union('res_' + c.compId + '.1', 'res_' + c.compId + '.2');   // 抵抗体は導通
      var g = gndPt(sl.cx, band);
      wires.add(POINTS['res_' + c.compId + '.2'], g, COLPAL.gnd, c.compId + ':GND');
      net.union('res_' + c.compId + '.2', 'gnd');
      // ラベル
      pinLabel(POINTS[c.compId + '.A'], '＋', band); pinLabel(POINTS[c.compId + '.C'], '−', band);
      nameLabel(sl.cx, { x0: Math.min(pr.bbox.x0, rr.bbox.x0), y0: Math.min(pr.bbox.y0, rr.bbox.y0), x1: Math.max(pr.bbox.x1, rr.bbox.x1), y1: Math.max(pr.bbox.y1, rr.bbox.y1) }, band, 'LED + 抵抗');
      chk(c.compId, 'LED: GP→アノード', connected(gpKey(gp), c.compId + '.A'));
      chk(c.compId, 'LED: カソード→抵抗→GND', connected(c.compId + '.C', 'res_' + c.compId + '.1') && isGnd(c.compId + '.C'));
      chk(c.compId, 'LED: アノードとカソードは非短絡', !connected(c.compId + '.A', c.compId + '.C'));
    };

    // タクトスイッチ（6mm・水平2端子を線に載せる）
    H.BTN = function (c) {
      var pb = primaryBand(c), band = pb.band;
      var art = PARTS['wokwi-pushbutton-6mm']; var s = 1.9;
      var w = art.w * s;
      var sl = slot(band, w, pb.anchorX, c);
      var pinY = lineY(band, 0) + sl.dy;
      // 本体をPicoから遠ざけるため、アート下辺ピン(2.*)を常にライン(Pico寄り)へ載せる。
      // 上バンド=正立で本体は上へ / 下バンド=180°反転で本体は下へ（どちらも2.*をアンカー）。
      var near = ['2.l', '2.r'], far = ['1.l', '1.r'];
      var pr = placeLine('wokwi-pushbutton-6mm', c.compId, near[0], near[1], band, sl.cx, pinY, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      net.union(c.compId + '.1.l', c.compId + '.1.r'); // 端子1ペア常時導通
      net.union(c.compId + '.2.l', c.compId + '.2.r'); // 端子2ペア常時導通
      var nearK = c.compId + '.' + near[0], farK = c.compId + '.' + far[0];
      // SIG=Pico寄り端子, 他方=対向端子
      var gp = c.pins.SIG.gp, gpp = gpPt(gp);
      wires.add(gpp, POINTS[nearK], nextSig(), c.compId + ':SIG');
      net.union(gpKey(gp), nearK);
      pinLabel(POINTS[nearK], 'GP' + parseInt(gp), band);
      if (c.pins.VCC.gnd) {
        var g = gndPt(sl.cx, band);
        wires.add(POINTS[farK], g, COLPAL.gnd, c.compId + ':GND', { sag: 12 });
        net.union(farK, 'gnd');
        pinLabel(POINTS[farK], 'GND', band === 't' ? 'h' : 't');
      } else if (c.pins.VCC.v3v3) {
        wires.add(POINTS[farK], v3Pt(), COLPAL.v, c.compId + ':VCC', { sag: 12 });
        net.union(farK, '3v3');
        pinLabel(POINTS[farK], '3V3', band === 't' ? 'h' : 't');
      }
      nameLabel(sl.cx, pr.bbox, band, 'ボタン' + (c.pull === 'PULLUP_INT' ? '（内部PU）' : ''));
      chk(c.compId, 'タクトSW: 端子1↔端子2は非短絡', !connected(c.compId + '.1.l', c.compId + '.2.l'));
      chk(c.compId, 'タクトSW: GP→押下側端子', connected(gpKey(gp), nearK));
      if (c.pins.VCC.gnd) chk(c.compId, 'タクトSW: 対端子→GND', isGnd(farK));
      if (c.pins.VCC.v3v3) chk(c.compId, 'タクトSW: 対端子→3V3', is3v3(farK));
    };

    // 外付け抵抗（プルアップ/ダウン・水平配置）
    H.RES = function (c) {
      var gpSpec = c.pins.A.gp != null ? c.pins.A : c.pins.B;
      var railSpec = c.pins.A.gp != null ? c.pins.B : c.pins.A;
      var pgp = pico.pinPos['GP' + parseInt(gpSpec.gp)];
      var band = pgp && pgp.row === 'c' ? 't' : 'h';
      var art = PARTS['wokwi-resistor'], s = 1.4;
      var w = art.w * s;
      var sl = slot(band, w, pgp ? pgp.x : pico.cx, c);
      var pinY = lineY(band, 0) + sl.dy;
      // GP脚をPico寄り(内側)、電源脚を外側 … 水平なので両脚を線に載せ、GP脚をanchor寄せ
      var pr = placeAligned('wokwi-resistor', c.compId, [['1', { x: sl.cx - w / 2, y: pinY }], ['2', { x: sl.cx + w / 2, y: pinY }]], POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      net.union(c.compId + '.1', c.compId + '.2');   // 抵抗体は導通
      var gpp = gpPt(gpSpec.gp);
      wires.add(gpp, POINTS[c.compId + '.1'], nextSig(), c.compId + ':GP');
      net.union(gpKey(gpSpec.gp), c.compId + '.1');
      pinLabel(POINTS[c.compId + '.1'], 'GP' + parseInt(gpSpec.gp), band);
      if (railSpec.v3v3) {
        wires.add(POINTS[c.compId + '.2'], v3Pt(), COLPAL.v, c.compId + ':V', { sag: 14 });
        net.union(c.compId + '.2', '3v3'); pinLabel(POINTS[c.compId + '.2'], '3V3', band);
      } else {
        var g = gndPt(sl.cx, band);
        wires.add(POINTS[c.compId + '.2'], g, COLPAL.gnd, c.compId + ':G', { sag: 14 });
        net.union(c.compId + '.2', 'gnd'); pinLabel(POINTS[c.compId + '.2'], 'GND', band);
      }
      nameLabel(sl.cx, pr.bbox, band, '抵抗' + (c.pull === 'PULLUP_EXT' ? '（プルアップ）' : c.pull === 'PULLDOWN_EXT' ? '（プルダウン）' : ''));
      chk(c.compId, '抵抗(' + (c.pull || '') + '): GP側接続', connected(gpKey(gpSpec.gp), c.compId + '.1'));
      chk(c.compId, '抵抗(' + (c.pull || '') + '): ' + (railSpec.v3v3 ? '3V3' : 'GND') + '側接続', railSpec.v3v3 ? is3v3(c.compId + '.2') : isGnd(c.compId + '.2'));
    };

    // 可変抵抗（3ピン水平）
    H.POT = function (c) {
      var pb = primaryBand(c), band = pb.band, dir = band === 't' ? -1 : 1;
      var art = PARTS['wokwi-potentiometer'], s = 0.72;
      var w = art.w * s;
      var sl = slot(band, w, pb.anchorX, c);
      var pinY = lineY(band, 0) + sl.dy;
      var pr = placeLine('wokwi-potentiometer', c.compId, 'GND', 'VCC', band, sl.cx, pinY, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC', { sag: 12 });
      net.union(c.compId + '.VCC', '3v3');
      var g = gndPt(sl.cx, band);
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND', { sag: 12 });
      net.union(c.compId + '.GND', 'gnd');
      var gpp = gpPt(c.pins.SIG.gp);
      wires.add(POINTS[c.compId + '.SIG'], gpp, nextSig(), c.compId + ':SIG');
      net.union(c.compId + '.SIG', gpKey(c.pins.SIG.gp));
      pinLabel(POINTS[c.compId + '.SIG'], 'GP' + parseInt(c.pins.SIG.gp), band);
      pinLabel(POINTS[c.compId + '.VCC'], '3V3', band); pinLabel(POINTS[c.compId + '.GND'], 'GND', band);
      nameLabel(sl.cx, pr.bbox, band, '可変抵抗');
      chk(c.compId, 'POT: SIG→ADCピン', connected(c.compId + '.SIG', gpKey(c.pins.SIG.gp)));
      chk(c.compId, 'POT: VCC→3V3', is3v3(c.compId + '.VCC'));
      chk(c.compId, 'POT: GND→GND', isGnd(c.compId + '.GND'));
    };

    // 圧電ブザー（2ピン水平）
    H.BUZZ = function (c) {
      var pb = primaryBand(c), band = pb.band, dir = band === 't' ? -1 : 1;
      var art = PARTS['wokwi-buzzer'], s = 0.62;
      var w = art.w * s;
      var sl = slot(band, w, pb.anchorX, c);
      var pinY = lineY(band, 0) + sl.dy;
      var pr = placeLine('wokwi-buzzer', c.compId, '1', '2', band, sl.cx, pinY, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      var g = gndPt(sl.cx, band);
      wires.add(POINTS[c.compId + '.1'], g, COLPAL.gnd, c.compId + ':GND', { sag: 10 });
      net.union(c.compId + '.1', 'gnd');
      var gpp = gpPt(c.pins.SIG.gp);
      wires.add(POINTS[c.compId + '.2'], gpp, nextSig(), c.compId + ':SIG');
      net.union(c.compId + '.2', gpKey(c.pins.SIG.gp));
      pinLabel(POINTS[c.compId + '.1'], '−', band); pinLabel(POINTS[c.compId + '.2'], '＋GP' + parseInt(c.pins.SIG.gp), band);
      nameLabel(sl.cx, pr.bbox, band, 'ブザー');
      chk(c.compId, 'ブザー: GP→＋端子', connected(gpKey(c.pins.SIG.gp), c.compId + '.2'));
      chk(c.compId, 'ブザー: −端子→GND', isGnd(c.compId + '.1'));
    };

    // 超音波センサ HC-SR04（4ピン水平・下辺）
    H.HCSR04 = function (c) {
      var pb = primaryBand(c), band = pb.band, dir = band === 't' ? -1 : 1;
      var art = PARTS['wokwi-hc-sr04'], s = 0.82;
      var w = art.w * s;
      var sl = slot(band, w, pb.anchorX, c);
      var pinY = lineY(band, 0) + sl.dy;
      var pr = placeLine('wokwi-hc-sr04', c.compId, 'VCC', 'GND', band, sl.cx, pinY, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC', { sag: 12 });
      net.union(c.compId + '.VCC', '3v3');
      var g = gndPt(POINTS[c.compId + '.GND'].x, band);
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND', { sag: 12 });
      net.union(c.compId + '.GND', 'gnd');
      var tp = gpPt(c.pins.TRIG.gp), ep = gpPt(c.pins.ECHO.gp);
      wires.add(POINTS[c.compId + '.TRIG'], tp, nextSig(), c.compId + ':TRIG');
      net.union(c.compId + '.TRIG', gpKey(c.pins.TRIG.gp));
      wires.add(POINTS[c.compId + '.ECHO'], ep, nextSig(), c.compId + ':ECHO');
      net.union(c.compId + '.ECHO', gpKey(c.pins.ECHO.gp));
      pinLabel(POINTS[c.compId + '.VCC'], 'VCC', band); pinLabel(POINTS[c.compId + '.TRIG'], 'TRIG', band);
      pinLabel(POINTS[c.compId + '.ECHO'], 'ECHO', band); pinLabel(POINTS[c.compId + '.GND'], 'GND', band);
      nameLabel(sl.cx, pr.bbox, band, '超音波センサ HC-SR04');
      chk(c.compId, 'HC-SR04: TRIG→GP' + c.pins.TRIG.gp, connected(c.compId + '.TRIG', gpKey(c.pins.TRIG.gp)));
      chk(c.compId, 'HC-SR04: ECHO→GP' + c.pins.ECHO.gp, connected(c.compId + '.ECHO', gpKey(c.pins.ECHO.gp)));
      chk(c.compId, 'HC-SR04: VCC→3V3/GND→GND', is3v3(c.compId + '.VCC') && isGnd(c.compId + '.GND'));
    };

    // 温湿度センサ DHT22（4ピン水平・NC未接続）
    H.DHT22 = function (c) {
      var pb = primaryBand(c), band = pb.band, dir = band === 't' ? -1 : 1;
      var art = PARTS['wokwi-dht22'], s = 0.62;
      var w = art.w * s;
      var sl = slot(band, w, pb.anchorX, c);
      var pinY = lineY(band, 0) + sl.dy;
      var pr = placeLine('wokwi-dht22', c.compId, 'VCC', 'GND', band, sl.cx, pinY, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC', { sag: 12 });
      net.union(c.compId + '.VCC', '3v3');
      var g = gndPt(POINTS[c.compId + '.GND'].x, band);
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND', { sag: 12 });
      net.union(c.compId + '.GND', 'gnd');
      var gpp = gpPt(c.pins.SIG.gp);
      wires.add(POINTS[c.compId + '.SDA'], gpp, nextSig(), c.compId + ':SIG');
      net.union(c.compId + '.SDA', gpKey(c.pins.SIG.gp));
      pinLabel(POINTS[c.compId + '.VCC'], 'VCC', band); pinLabel(POINTS[c.compId + '.SDA'], 'DATA', band); pinLabel(POINTS[c.compId + '.GND'], 'GND', band);
      nameLabel(sl.cx, pr.bbox, band, '温湿度センサ DHT22');
      chk(c.compId, 'DHT22: DATA→GP' + c.pins.SIG.gp, connected(c.compId + '.SDA', gpKey(c.pins.SIG.gp)));
      chk(c.compId, 'DHT22: VCC→3V3/GND→GND', is3v3(c.compId + '.VCC') && isGnd(c.compId + '.GND'));
      chk(c.compId, 'DHT22: NC未接続', !isGnd(c.compId + '.NC') && !is3v3(c.compId + '.NC'));
    };

    // 7セグLED（正立配置・上下ピンを直結）
    H.SEG7 = function (c) {
      // 下バンドに正立配置（数字は正立のまま）。上辺ピン=Pico寄り。
      var band = 'h';
      var art = PARTS['wokwi-7segment'], s = 1.3;
      var w = art.w * s, h = art.h * s;
      // anchor: A-G のうち最初のGPの列付近
      var pb = primaryBand(c);
      var sl = slot(band, w, pb.anchorX, c);
      var tx = sl.left, ty = pico.box.y1 + LEAD + 6 + sl.dy;
      var pr = placeAt('wokwi-7segment', c.compId, tx, ty, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      net.union(c.compId + '.COM.1', c.compId + '.COM.2');
      var g = gndPt(POINTS[c.compId + '.COM.1'].x, band);
      wires.add(POINTS[c.compId + '.COM.1'], g, COLPAL.gnd, c.compId + ':COM', { sag: 14 });
      net.union(c.compId + '.COM.1', 'gnd');
      pinLabel(POINTS[c.compId + '.COM.1'], 'COM', band);
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function (sname) {
        if (!c.pins[sname]) return;
        var gpp = gpPt(c.pins[sname].gp);
        wires.add(POINTS[c.compId + '.' + sname], gpp, nextSig(), c.compId + ':' + sname, { sag: 10 });
        net.union(c.compId + '.' + sname, gpKey(c.pins[sname].gp));
        chk(c.compId, '7セグ: ' + sname + '→GP' + c.pins[sname].gp, connected(c.compId + '.' + sname, gpKey(c.pins[sname].gp)));
      });
      nameLabel(sl.cx, pr.bbox, band, '7セグメントLED');
      chk(c.compId, '7セグ: COM→GND', isGnd(c.compId + '.COM.1'));
    };

    // I2C LCD1602（ボード外・下段中央寄り）
    H.LCD = function (c) {
      var s = 0.72;
      var art = PARTS['wokwi-lcd1602'];
      var w = art.w * s;
      var ov = overrides && overrides[c.compId];
      var tx = pico.box.x0 + (rightX) + ((ov && ov.dx) || 0);
      var ty = pico.box.y1 + LEAD + 118 + ((ov && ov.dy) || 0);
      rightX += w + 30;
      var pr = placeAt('wokwi-lcd1602', c.compId, tx, ty, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      var g = gndPt(POINTS[c.compId + '.GND'].x, 'h');
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND', { sag: 20 });
      net.union(c.compId + '.GND', 'gnd');
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC', { sag: 26 });
      net.union(c.compId + '.VCC', '3v3');
      wires.add(POINTS[c.compId + '.SDA'], gpPt(c.pins.SDA.gp), nextSig(), c.compId + ':SDA', { sag: 30 });
      net.union(c.compId + '.SDA', gpKey(c.pins.SDA.gp));
      wires.add(POINTS[c.compId + '.SCL'], gpPt(c.pins.SCL.gp), nextSig(), c.compId + ':SCL', { sag: 36 });
      net.union(c.compId + '.SCL', gpKey(c.pins.SCL.gp));
      ['GND', 'VCC', 'SDA', 'SCL'].forEach(function (pn) { pinLabel(POINTS[c.compId + '.' + pn], pn, 't'); });
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, 'h', 'LCD1602 (I2C)');
      chk(c.compId, 'LCD: SDA→GP' + c.pins.SDA.gp, connected(c.compId + '.SDA', gpKey(c.pins.SDA.gp)));
      chk(c.compId, 'LCD: SCL→GP' + c.pins.SCL.gp, connected(c.compId + '.SCL', gpKey(c.pins.SCL.gp)));
      chk(c.compId, 'LCD: VCC→3V3/GND→GND', is3v3(c.compId + '.VCC') && isGnd(c.compId + '.GND'));
    };

    // CdS光センサモジュール（ボード外・下段）
    H.CDS = function (c) {
      var s = 0.8;
      var art = PARTS['wokwi-photoresistor-sensor'];
      var w = art.w * s;
      var ov = overrides && overrides[c.compId];
      var tx = pico.box.x0 + rightX + ((ov && ov.dx) || 0);
      var ty = pico.box.y0 - LEAD - art.h * s - 30 + ((ov && ov.dy) || 0);
      rightX += w + 30;
      var pr = placeAt('wokwi-photoresistor-sensor', c.compId, tx, ty, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC', { sag: 18 });
      net.union(c.compId + '.VCC', '3v3');
      var g = gndPt(POINTS[c.compId + '.GND'].x, 't');
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND', { sag: 24 });
      net.union(c.compId + '.GND', 'gnd');
      wires.add(POINTS[c.compId + '.AO'], gpPt(c.pins.SIG.gp), nextSig(), c.compId + ':SIG', { sag: 30 });
      net.union(c.compId + '.AO', gpKey(c.pins.SIG.gp));
      ['VCC', 'GND', 'AO'].forEach(function (pn) { pinLabel(POINTS[c.compId + '.' + pn], pn, 'h'); });
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, 't', '光センサ (CdS)');
      chk(c.compId, 'CDS: AO→ADCピン', connected(c.compId + '.AO', gpKey(c.pins.SIG.gp)));
      chk(c.compId, 'CDS: VCC→3V3', is3v3(c.compId + '.VCC'));
      chk(c.compId, 'CDS: GND→GND', isGnd(c.compId + '.GND'));
    };

    // サーボ（ボード外・右）
    H.SERVO = function (c) {
      var s = 0.8;
      var art = PARTS['wokwi-servo'];
      var ov = overrides && overrides[c.compId];
      var tx = pico.box.x1 + 60 + ((ov && ov.dx) || 0);
      var ty = rightY + pico.box.y0 + ((ov && ov.dy) || 0);
      rightY += art.h * s + 26;
      var pr = placeAt('wokwi-servo', c.compId, tx, ty, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      wires.add(POINTS[c.compId + '.PWM'], gpPt(c.pins.PWM.gp), nextSig(), c.compId + ':PWM', { sag: 26 });
      net.union(c.compId + '.PWM', gpKey(c.pins.PWM.gp));
      if (VEXT_PT) { wires.add(POINTS[c.compId + '.V+'], VEXT_PT, COLPAL.vext, c.compId + ':V+', { sag: 18 }); net.union(c.compId + '.V+', 'vext'); }
      var g = gndPt(POINTS[c.compId + '.GND'].x, 'h');
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND', { sag: 22 });
      net.union(c.compId + '.GND', 'gnd');
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, 'h', 'サーボモーター');
      chk(c.compId, 'サーボ: PWM→GP' + c.pins.PWM.gp, connected(c.compId + '.PWM', gpKey(c.pins.PWM.gp)));
      chk(c.compId, 'サーボ: V+→外部電源', connected(c.compId + '.V+', 'vext'));
      chk(c.compId, 'サーボ: GND→GND', isGnd(c.compId + '.GND'));
    };

    // L293D + DCモーター（ボード外・下段）
    H.L293D = function (c) {
      var ov = overrides && overrides[c.compId];
      var tx = pico.box.x0 + rightX + ((ov && ov.dx) || 0);
      var ty = pico.box.y1 + LEAD + 110 + ((ov && ov.dy) || 0);
      var dip = drawL293D(tx, ty, c.compId, POINTS);
      partsSvg.push(dip.svg); addBox(c.compId, dip.bbox);
      var mot = drawMotor(tx + 8 * PITCH + 60, ty - 8, 'motor_' + c.compId, 'DCモーター', POINTS);
      partsSvg.push(mot.svg); addBox('motor_' + c.compId, mot.bbox);
      rightX += 8 * PITCH + 200;
      // 電源
      if (VEXT_PT) {
        wires.add(POINTS[c.compId + '.VS'], VEXT_PT, COLPAL.vext, c.compId + ':VS', { sag: 14 }); net.union(c.compId + '.VS', 'vext');
        wires.add(POINTS[c.compId + '.VSS'], VEXT_PT, COLPAL.vext, c.compId + ':VSS', { sag: 20 }); net.union(c.compId + '.VSS', 'vext');
      }
      var g = gndPt(POINTS[c.compId + '.GNDb1'].x, 'h');
      wires.add(POINTS[c.compId + '.GNDb1'], g, COLPAL.gnd, c.compId + ':GND', { sag: 14 }); net.union(c.compId + '.GNDb1', 'gnd');
      net.union(c.compId + '.GNDb1', c.compId + '.GNDb2'); net.union(c.compId + '.GNDb1', c.compId + '.GNDt1'); net.union(c.compId + '.GNDt1', c.compId + '.GNDt2');
      if (c.pins.EN && c.pins.EN.gp != null) {
        wires.add(POINTS[c.compId + '.EN1'], gpPt(c.pins.EN.gp), nextSig(), c.compId + ':EN'); net.union(c.compId + '.EN1', gpKey(c.pins.EN.gp));
      } else if (VEXT_PT) {
        wires.add(POINTS[c.compId + '.EN1'], VEXT_PT, COLPAL.vext, c.compId + ':EN', { sag: 26 }); net.union(c.compId + '.EN1', 'vext');
      }
      wires.add(POINTS[c.compId + '.IN1'], gpPt(c.pins.IN1.gp), nextSig(), c.compId + ':IN1'); net.union(c.compId + '.IN1', gpKey(c.pins.IN1.gp));
      wires.add(POINTS[c.compId + '.IN2'], gpPt(c.pins.IN2.gp), nextSig(), c.compId + ':IN2'); net.union(c.compId + '.IN2', gpKey(c.pins.IN2.gp));
      wires.add(POINTS[c.compId + '.OUT1'], POINTS['motor_' + c.compId + '.a'], nextSig(), c.compId + ':OUT1', { sag: 24 }); net.union(c.compId + '.OUT1', 'motor_' + c.compId + '.a');
      wires.add(POINTS[c.compId + '.OUT2'], POINTS['motor_' + c.compId + '.b'], nextSig(), c.compId + ':OUT2', { sag: 30 }); net.union(c.compId + '.OUT2', 'motor_' + c.compId + '.b');
      nameLabel((dip.bbox.x0 + dip.bbox.x1) / 2, dip.bbox, 'h', 'モータードライバ L293D');
      chk(c.compId, 'L293D: IN1→GP' + c.pins.IN1.gp, connected(c.compId + '.IN1', gpKey(c.pins.IN1.gp)));
      chk(c.compId, 'L293D: IN2→GP' + c.pins.IN2.gp, connected(c.compId + '.IN2', gpKey(c.pins.IN2.gp)));
      chk(c.compId, 'L293D: OUT1/OUT2→モーター', connected(c.compId + '.OUT1', 'motor_' + c.compId + '.a') && connected(c.compId + '.OUT2', 'motor_' + c.compId + '.b'));
      chk(c.compId, 'L293D: GND→GND', isGnd(c.compId + '.GNDb1'));
      chk(c.compId, 'L293D: VS/VSS→外部電源', connected(c.compId + '.VS', 'vext') && connected(c.compId + '.VSS', 'vext'));
      if (c.pins.EN && c.pins.EN.gp != null) chk(c.compId, 'L293D: EN→GP' + c.pins.EN.gp, connected(c.compId + '.EN1', gpKey(c.pins.EN.gp)));
      else chk(c.compId, 'L293D: EN→＋(常時有効)', connected(c.compId + '.EN1', 'vext'));
    };

    // ステッピングモーター 28BYJ-48 + ULN2003（ボード外・下段）
    H.STEPPER = function (c) {
      var ov = overrides && overrides[c.compId];
      var ux = pico.box.x0 + rightX + ((ov && ov.dx) || 0);
      var uy = pico.box.y1 + LEAD + 110 + ((ov && ov.dy) || 0);
      var uln = drawUln(ux, uy, 'uln_' + c.compId, POINTS);
      partsSvg.push(uln.svg); addBox('uln_' + c.compId, uln.bbox);
      var ms = 0.62, marT = PARTS['wokwi-stepper-motor'];
      var mx = ux + 156 + 60, my = uy - 30;
      var pr = placeAt('wokwi-stepper-motor', 'stp_' + c.compId, mx, my, ms, POINTS);
      partsSvg.push(pr.svg); addBox('stp_' + c.compId, pr.bbox);
      rightX += 156 + marT.w * ms + 160;
      ['IN1', 'IN2', 'IN3', 'IN4'].forEach(function (k, i) {
        wires.add(POINTS['uln_' + c.compId + '.' + k], gpPt(c.pins[k].gp), nextSig(), c.compId + ':' + k, { sag: 18 + i * 6 });
        net.union('uln_' + c.compId + '.' + k, gpKey(c.pins[k].gp));
      });
      if (VEXT_PT) { wires.add(POINTS['uln_' + c.compId + '.VCC'], VEXT_PT, COLPAL.vext, c.compId + ':VCC', { sag: 14 }); net.union('uln_' + c.compId + '.VCC', 'vext'); }
      var g = gndPt(POINTS['uln_' + c.compId + '.GND'].x, 'h');
      wires.add(POINTS['uln_' + c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND', { sag: 20 });
      net.union('uln_' + c.compId + '.GND', 'gnd');
      ['A-', 'A+', 'B+', 'B-'].forEach(function (m, i) {
        wires.add(POINTS['uln_' + c.compId + '.M' + m], POINTS['stp_' + c.compId + '.' + m], ['#2f7de0', '#e0a52f', '#8e44ad', '#159a72'][i], c.compId + ':M' + m, { sag: 14 + i * 6 });
        net.union('uln_' + c.compId + '.M' + m, 'stp_' + c.compId + '.' + m);
      });
      nameLabel((uln.bbox.x0 + uln.bbox.x1) / 2, uln.bbox, 'h', 'ステッピングモーター 28BYJ-48');
      ['IN1', 'IN2', 'IN3', 'IN4'].forEach(function (k) {
        chk(c.compId, 'ステッピング: ' + k + '→GP' + c.pins[k].gp, connected('uln_' + c.compId + '.' + k, gpKey(c.pins[k].gp)));
      });
      chk(c.compId, 'ステッピング: 電源→外部電源/GND', connected('uln_' + c.compId + '.VCC', 'vext') && isGnd('uln_' + c.compId + '.GND'));
      chk(c.compId, 'ステッピング: モーター4線', connected('uln_' + c.compId + '.MA-', 'stp_' + c.compId + '.A-') && connected('uln_' + c.compId + '.MB-', 'stp_' + c.compId + '.B-'));
    };

    // 外部電源（電池ボックス・左下）
    H.EXTPWR = function (c) {
      var ov = overrides && overrides[c.compId];
      var x = pico.box.x0 - 20 + ((ov && ov.dx) || 0);
      var y = pico.box.y1 + LEAD + 110 + ((ov && ov.dy) || 0);
      var bat = drawBattery(x, y, c.compId, '外部電源（モーター用 単3×2）', POINTS);
      partsSvg.push(bat.svg); addBox(c.compId, bat.bbox);
      rightX = Math.max(rightX, bat.bbox.x1 - pico.box.x0 + 34);   // 後続モジュールを電池ボックスの右へ
      VEXT_PT = POINTS[c.compId + '.+'];
      net.union(c.compId + '.+', 'vext');
      var g = gndPt(POINTS[c.compId + '.-'].x, 'h');
      wires.add(POINTS[c.compId + '.-'], g, COLPAL.gnd, c.compId + ':-', { sag: 18 });
      net.union(c.compId + '.-', 'gnd');
      pinLabel(POINTS[c.compId + '.+'], '＋', 't'); pinLabel(POINTS[c.compId + '.-'], '−', 'h');
      chk(c.compId, '外部電源: −→GND共通', isGnd(c.compId + '.-'));
      chk(c.compId, '外部電源: +→VEXT', connected(c.compId + '.+', 'vext'));
    };

    function placeholder(c) {
      var pb = primaryBand(c), band = pb.band;
      var sl = slot(band, 80, pb.anchorX, c);
      var y = lineY(band, 0) + (band === 't' ? -30 : 30);
      partsSvg.push('<g class="cv-comp" data-comp-id="' + c.compId + '"><rect x="' + (sl.cx - 40) + '" y="' + (y - 20) + '" width="80" height="40" rx="6" fill="#eceae3" stroke="#b9b3a6" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<text x="' + sl.cx + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11" fill="#7a7566">' + c.type + '</text></g>');
      addBox(c.compId, { x0: sl.cx - 40, y0: y - 20, x1: sl.cx + 40, y1: y + 20 });
      chk(c.compId, 'プレースホルダ（アート未取得）', false);
    }

    // ---- 実行順: 外部電源(VEXT確定) → 直挿し部品(バンド内はanchorX昇順) → ボード外モジュール ----
    var moduleType = { LCD: 1, SERVO: 1, L293D: 1, STEPPER: 1, CDS: 1 };
    function bucket(c) { return c.type === 'EXTPWR' ? 0 : (moduleType[c.type] ? 2 : 1); }
    var order = comps.slice().sort(function (a, b) {
      var ba = bucket(a), bb2 = bucket(b);
      if (ba !== bb2) return ba - bb2;
      if (ba === 1) {
        var pa = primaryBand(a), pq = primaryBand(b);
        if (pa.band !== pq.band) return pa.band < pq.band ? -1 : 1;   // 上(t)→下(h)
        return pa.anchorX - pq.anchorX;                               // 接続ピンに近い順
      }
      return 0;
    });
    order.forEach(function (c) { (H[c.type] || placeholder)(c); });

    // ---- Picoピンラベル（使用ピンのみ）----
    Object.keys(usedPins).forEach(function (k) {
      var p = usedPins[k]; if (!p) return;
      var nm = p.name || k;
      var y = p.row === 'c' ? p.y - 7 : p.y + 12;
      // 部品ピンラベルと干渉しにくいようPico側に小さく
      labelSvg.push(label(p.x, y, nm, { fs: 8, fill: '#5b6066' }));
    });

    return {
      partsSvg: partsSvg.join('\n'), wiresSvg: wires.render(), labelSvg: labelSvg.join('\n'),
      wireCount: wires.count(), checks: checks, bounds: bounds, boxes: boxes,
      picoCross: wires.crossings(), crossIds: wires.crossIds()
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

    var pico = placePico(0, 0);
    if (!pico) {
      return {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120"><text x="20" y="60" fill="#c0392b" font-size="14">circuit_parts_data.js が読み込まれていません</text></svg>',
        compCount: 0, wireCount: 0
      };
    }

    var circuit = buildCircuit(pico, comps, overrides);

    var b = circuit.bounds, pad = 28;
    var vx = b.x0 - pad, vy = b.y0 - pad, vx1 = b.x1 + pad, vy1 = b.y1 + pad;

    var overlay = [];
    if (parsed.onboardLedOn) {
      vy -= 26;
      overlay.push('<text x="' + pico.cx + '" y="' + (vy + 20) + '" text-anchor="middle" font-size="13" fill="#2e7d32" font-weight="bold">GP25 = オンボードLED（外部配線なし）</text>');
    }
    (parsed.badPins || []).forEach(function (bp, i) {
      if (i === 0) vy -= 20;
      overlay.push('<text x="' + pico.cx + '" y="' + (vy + 40 + i * 16) + '" text-anchor="middle" font-size="12" fill="#c0392b">GP' + bp.gp + ' は内部専用ピンです</text>');
    });
    if (comps.length === 0 && !parsed.onboardLedOn && (parsed.badPins || []).length === 0) {
      overlay.push('<text x="' + pico.cx + '" y="' + (vy1 + 26) + '" text-anchor="middle" font-size="18" fill="#b7b1a3">MicroPython ブロックを追加すると</text>');
      overlay.push('<text x="' + pico.cx + '" y="' + (vy1 + 52) + '" text-anchor="middle" font-size="18" fill="#b7b1a3">配線図が表示されます</text>');
      vy1 += 66;
    }

    var vw = vx1 - vx, vh = vy1 - vy;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + r2(vw) + '" height="' + r2(vh) +
      '" viewBox="' + r2(vx) + ' ' + r2(vy) + ' ' + r2(vw) + ' ' + r2(vh) + '" font-family="sans-serif">\n' +
      '<rect x="' + r2(vx) + '" y="' + r2(vy) + '" width="' + r2(vw) + '" height="' + r2(vh) + '" fill="#fbfaf7"/>\n' +
      circuit.wiresSvg + '\n' + pico.svg + '\n' + circuit.partsSvg + '\n' + circuit.labelSvg + '\n' + overlay.join('\n') + '\n</svg>';

    window.__PYCO_DIRECT_DEBUG = {
      picoTop: PICO_TOP, picoBot: PICO_BOT, picoTable: pico.table, picoPinTableOk: pico.pinTableOk,
      checks: circuit.checks, boxes: circuit.boxes, picoCross: circuit.picoCross, crossIds: circuit.crossIds
    };
    return { svg: svg, compCount: comps.length, wireCount: circuit.wireCount };
  };

  window.__PYCO_DIRECT_ACTIVE = true;
})();
