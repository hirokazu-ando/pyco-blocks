// ===== ブレッドボード型 実態配線図レンダラ (Phase 1 skeleton) =====
//
// window.generateCircuitSVG(workspace, {overrides, wireOverrides})
//   → { svg, compCount, wireCount }   （旧 circuit_viewer.js と同一契約）
//
// 既定でこの新レンダラを使う。?cv=legacy を付けると本ファイルは何もせず、
// 先に読み込まれた circuit_viewer.js の旧レンダラがそのまま生きる。
//
// 部品アート/ピン座標は tools/extract_wokwi_parts.py が生成した
// window.PYCO_CIRCUIT_PARTS（js/circuit_parts_data.js）から取得する。
// Pico とブレッドボード本体は本ファイルの自作 SVG（実機準拠）。
//
// フェーズ1対応部品: LED / 抵抗 / タクトスイッチ（内部・外部プルアップ）。
// 未対応部品は注記付きプレースホルダで描画する（フェーズ2で移植）。
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
  //  ブレッドボード幾何（bb_render.js の実証済みモデルを移植）
  //  穴名: 端子穴 a1..jN（列1..Nは a-e / f-j がそれぞれ縦導通）、
  //        電源レール t-.k / t+.k / b+.k / b-.k（横導通・k=1..25）
  // ============================================================
  var PITCH = 16;                       // 穴ピッチ(px)
  var HOLE = Math.max(5, Math.round(PITCH * 0.4));
  var BX = 40, BY = 40;                 // ボード左上

  // 行の相対Y（BYからのオフセット）を計算
  function rowYs() {
    var ys = {}, y = 16;
    ys['t-'] = y; y += PITCH;
    ys['t+'] = y; y += Math.round(PITCH * 1.8);
    'abcde'.split('').forEach(function (r) { ys[r] = y; y += PITCH; });
    y += Math.round(PITCH * 1.2);        // 中央溝
    'fghij'.split('').forEach(function (r) { ys[r] = y; y += PITCH; });
    y += Math.round(PITCH * 0.8);
    ys['b+'] = y; y += PITCH;
    ys['b-'] = y; y += 16;
    return { ys: ys, h: y };
  }

  // レール穴kのX（5穴×5グループ・ボード内に収める）
  function railX(cols) {
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

  // ボードのジオメトリ一式（POINTS登録・SVG断片生成）
  function makeBoard(cols) {
    var lay = rowYs();
    var ys = lay.ys;
    var boardW = 2 * 18 + (cols - 1) * PITCH + 8;
    var boardH = lay.h;
    var POINTS = {};
    var svg = [];
    var rx = railX(cols);

    // 本体
    svg.push('<rect x="' + BX + '" y="' + BY + '" width="' + boardW +
      '" height="' + boardH + '" rx="8" fill="#f6f4ee" stroke="#cbc6bb" stroke-width="1.5"/>');
    // 中央溝
    var gapTop = BY + ys['e'] + HOLE / 2, gapBot = BY + ys['f'] - HOLE / 2;
    var chH = Math.max(8, Math.round((gapBot - gapTop) * 0.7));
    svg.push('<rect x="' + BX + '" y="' + ((gapTop + gapBot) / 2 - chH / 2) +
      '" width="' + boardW + '" height="' + chH + '" fill="#e5e1d7"/>');

    // 電源レール（ストライプ＋穴）
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
        POINTS[rk + '.' + k] = { x: hx, y: y, rail: rk };
      }
    });

    // 端子穴 a-j × 1..cols
    'abcdefghij'.split('').forEach(function (r) {
      var y = BY + ys[r];
      for (var c = 1; c <= cols; c++) {
        var hx = BX + 18 + 4 + (c - 1) * PITCH;
        svg.push(hole(hx, y));
        POINTS[r + c] = { x: hx, y: y, col: c, group: 'abcde'.indexOf(r) >= 0 ? 'T' : 'B' };
      }
    });
    // 列番号・行ラベル
    for (var c2 = 5; c2 <= cols; c2 += 5) {
      var hx2 = BX + 18 + 4 + (c2 - 1) * PITCH;
      svg.push('<text x="' + hx2 + '" y="' + (BY + ys['a'] - 8) +
        '" fill="#9a9484" font-size="10" text-anchor="middle">' + c2 + '</text>');
    }
    ['a', 'j'].forEach(function (r) {
      svg.push('<text x="' + (BX + 7) + '" y="' + (BY + ys[r] + 4) +
        '" fill="#9a9484" font-size="10">' + r + '</text>');
    });

    return { POINTS: POINTS, svg: svg.join('\n'), w: boardW, h: boardH, ys: ys, railX: rx };
  }

  function hole(x, y) {
    return '<rect x="' + (x - HOLE / 2) + '" y="' + (y - HOLE / 2) + '" width="' + HOLE +
      '" height="' + HOLE + '" rx="1.5" fill="#40454d"/>';
  }

  // ============================================================
  //  Pico（自作SVG・実機準拠ピン配列）。中央溝をまたいで col0..col0+19。
  //  上辺ピン→行a（a{col}）、下辺ピン→行j（j{col}）でタップ。本体はb..iを覆う。
  //  ※ wokwi-pi-pico は vendored バンドル(v1.9.2)に無いため自作。ピン表は
  //    実Pico準拠（下の TOP/BOT が唯一の正・自己検証で機械照合する）。
  // ============================================================
  var PICO_TOP = ['VBUS', 'VSYS', 'GND', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'AGND',
    'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'];
  var PICO_BOT = ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7',
    'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'];

  function makePico(board, col0) {
    var P = board.POINTS, ys = board.ys, svg = [];
    var pins = 20, colN = col0 + pins - 1;
    var cL = P['a' + col0], cR = P['a' + colN];
    var pitch = (cR.x - cL.x) / (pins - 1);
    var yA = P['a' + col0].y, yB = P['b' + col0].y, yI = P['i' + col0].y;
    var left = cL.x - pitch * 0.62, right = cR.x + pitch * 0.62, w = right - left;
    var top = yB - 7, bot = yI + 7, h = bot - top;
    var cx0 = left + w / 2, cy0 = (top + bot) / 2;

    // USB（左）
    svg.push('<rect x="' + (left - 17) + '" y="' + (cy0 - 17) + '" width="19" height="34" rx="3" fill="#d6dade" stroke="#8b9098" stroke-width="2"/>');
    svg.push('<rect x="' + (left - 12) + '" y="' + (cy0 - 12) + '" width="12" height="24" rx="2" fill="#9aa0a8"/>');
    // 基板
    svg.push('<rect x="' + left + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="9" fill="#136c43" stroke="#0a4d2e" stroke-width="2"/>');
    svg.push('<rect x="' + (left + 5) + '" y="' + (top + 5) + '" width="' + (w - 10) + '" height="' + (h - 10) + '" rx="6" fill="none" stroke="#3a9c6e" stroke-width="1" stroke-opacity="0.6"/>');
    // 金メッキパッド
    var POINTS_PICO = {};
    for (var i = 0; i < pins; i++) {
      var px = cL.x + i * pitch;
      [top, bot].forEach(function (ey) {
        svg.push('<rect x="' + (px - 5) + '" y="' + (ey - 4) + '" width="10" height="8" rx="2" fill="#e6c14e" stroke="#a6841f" stroke-width="1"/>');
        svg.push('<circle cx="' + px + '" cy="' + ey + '" r="2.3" fill="#7a5e16"/>');
      });
    }
    // チップ
    var chip = Math.min(46, h - 30);
    svg.push('<rect x="' + (cx0 - chip / 2) + '" y="' + (cy0 - chip / 2) + '" width="' + chip + '" height="' + chip + '" rx="4" fill="#17171c" stroke="#000" stroke-width="1.5"/>');
    svg.push('<text x="' + cx0 + '" y="' + (cy0 - 2) + '" fill="#9aa3ad" font-size="8" font-weight="bold" text-anchor="middle">RP2040</text>');
    svg.push('<text x="' + (left + Math.min(60, w * 0.42)) + '" y="' + (cy0 + 3) + '" fill="#eafff5" font-size="11" font-weight="bold" text-anchor="middle" font-style="italic">Pico</text>');

    // ピン名ラベル（回転）＋ POINTS 登録
    var picoPins = {};   // 名前→穴参照（a{col}/j{col}）
    var gT = 0, gB = 0;
    function reg(name, col, side) {
      var ref = (side === 'top') ? ('a' + col) : ('j' + col);
      if (name === 'GND') {
        var idx = side === 'top' ? ('GNDt' + (++gT)) : ('GNDb' + (++gB));
        picoPins[idx] = ref;
      } else {
        picoPins[name] = ref;
      }
    }
    for (var j = 0; j < pins; j++) {
      var col = col0 + j;
      reg(PICO_TOP[j], col, 'top');
      reg(PICO_BOT[j], col, 'bot');
      var pxx = cL.x + j * pitch;
      svg.push('<text x="' + (pxx + 3) + '" y="' + (top + 13) + '" fill="#e7f5ee" font-size="6.5" text-anchor="start" transform="rotate(90 ' + (pxx + 3) + ' ' + (top + 13) + ')">' + PICO_TOP[j] + '</text>');
      svg.push('<text x="' + (pxx + 3) + '" y="' + (bot - 13) + '" fill="#e7f5ee" font-size="6.5" text-anchor="end" transform="rotate(90 ' + (pxx + 3) + ' ' + (bot - 13) + ')">' + PICO_BOT[j] + '</text>');
    }
    return { svg: svg.join('\n'), pins: picoPins, top: top, bot: bot, cx: cx0, cy: cy0, left: left, right: right };
  }

  // ============================================================
  //  ブロック解析（circuit_viewer.js の parseBlocks を忠実に移植）
  //  ※旧ファイルは無改変のため private 関数を再実装している。
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
            add('respd' + p2, 'RES', { A: { gp: p2 }, B: { gnd: true } }, { pull: 'PULLDOWN_EXT', pairKey: 'pd' + p2 });
          } else if (pull === 'PULLUP_INT') {
            add('btn' + p2, 'BTN', { SIG: { gp: p2 }, VCC: { gnd: true } }, { pull: 'PULLUP_INT' });
          } else {
            add('respu' + p2, 'RES', { A: { v3v3: true }, B: { gp: p2 } }, { pull: 'PULLUP_EXT', pairKey: 'pu' + p2 });
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
          add('l293d_' + gf('IN1') + '_' + gf('IN2'), 'L293D', { VSS: { vext: true }, IN1: { gp: gf('IN1') }, IN2: { gp: gf('IN2') }, GND: { gnd: true }, VS: { vext: true } });
        } else if (['pico_stepper_step', 'pico_stepper_angle'].indexOf(t) >= 0) {
          add('step_' + [gf('IN1'), gf('IN2'), gf('IN3'), gf('IN4')].join('_'), 'STEPPER',
            { VCC: { vext: true }, IN1: { gp: gf('IN1') }, IN2: { gp: gf('IN2') }, IN3: { gp: gf('IN3') }, IN4: { gp: gf('IN4') }, GND: { gnd: true } });
        }
      });
    return { comps: comps, onboardLedOn: onboardLedOn, badPins: badPins };
  }

  // ============================================================
  //  部品埋め込みユーティリティ（wokwi shadow SVG を <g> で配置）
  // ============================================================
  var _uid = 0;
  // inner中のid/参照(url(#..), href="#..")をインスタンス固有に名前空間化しID衝突を防ぐ
  function nsIds(inner, prefix) {
    var ids = {};
    inner.replace(/\bid="([^"]+)"/g, function (m, id) { ids[id] = prefix + id; return m; });
    var out = inner;
    Object.keys(ids).forEach(function (id) {
      var nid = ids[id];
      out = out.replace(new RegExp('id="' + esc(id) + '"', 'g'), 'id="' + nid + '"');
      out = out.replace(new RegExp('url\\(#' + esc(id) + '\\)', 'g'), 'url(#' + nid + ')');
      out = out.replace(new RegExp('(href|xlink:href)="#' + esc(id) + '"', 'g'), '$1="#' + nid + '"');
    });
    return out;
  }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // 部品を align（[[pinName, holeRef], ...]）で配置。
  //   1点: そのピンを穴へ平行移動（scale=1・回転なし）
  //   2点: pin0→hole0 を厳密一致させ、pin1→hole1 の向き＆距離に合わせて
  //        回転＋均一スケール（bb_render.js と同じ2点アライメント）。
  // POINTSへ各ピンの絶対座標を登録し、<g class="cv-comp">断片を返す。
  function placePart(tag, id, align, POINTS) {
    var data = PARTS[tag];
    if (!data) return { svg: '', ok: false };
    var pin = data.pins[align[0][0]];
    var hole0 = POINTS[align[0][1]];
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
    // 変換: translate(hole0) rotate(ang) scale(s) translate(-pin)
    // 全ピンの絶対座標を登録
    Object.keys(data.pins).forEach(function (nm) {
      var q = data.pins[nm];
      var dx = (q.x - pin.x) * s, dy = (q.y - pin.y) * s;
      POINTS[id + '.' + nm] = {
        x: hole0.x + dx * cos - dy * sin,
        y: hole0.y + dx * sin + dy * cos
      };
    });
    var prefix = 'p' + (_uid++) + '_';
    var tf = 'translate(' + r2(hole0.x) + ',' + r2(hole0.y) + ') rotate(' +
      r4(ang * 180 / Math.PI) + ') scale(' + r4(s) + ') translate(' +
      r2(-pin.x) + ',' + r2(-pin.y) + ')';
    var g = '<g class="cv-comp" data-comp-id="' + id + '" transform="' + tf + '">' +
      nsIds(data.inner, prefix) + '</g>';
    return { svg: g, ok: true, scale: s, ang: ang };
  }

  function r2(v) { return Math.round(v * 100) / 100; }
  function r4(v) { return Math.round(v * 10000) / 10000; }

  // ============================================================
  //  ジャンパー線（穴→穴・軽い弧）
  // ============================================================
  function wire(POINTS, fromRef, toRef, color, id) {
    var a = POINTS[fromRef], b = POINTS[toRef];
    if (!a || !b) return { svg: '', ok: false };
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.hypot(dx, dy);
    // 軽い弧：中点を配線方向の法線側へ持ち上げる（実配線のジャンパーらしさ）
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var sag = Math.min(26, dist * 0.14);
    var nx = dist > 0.01 ? -dy / dist : 0, ny = dist > 0.01 ? dx / dist : 0;
    // 常に上向き(-y)に膨らませる
    if (ny > 0) { nx = -nx; ny = -ny; }
    var qx = mx + nx * sag, qy = my + ny * sag;
    var d = 'M' + r2(a.x) + ',' + r2(a.y) + ' Q' + r2(qx) + ',' + r2(qy) + ' ' + r2(b.x) + ',' + r2(b.y);
    // クラスは bb-wire（cv-wire にすると旧モーダルの配線ドラッグが誤作動するため別名）。
    // フェーズ1の編集操作は cv-comp の列シフトのみ対応。
    var g = '<g class="bb-wire" data-wire-id="' + id + '">' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<circle cx="' + r2(a.x) + '" cy="' + r2(a.y) + '" r="3" fill="' + color + '"/>' +
      '<circle cx="' + r2(b.x) + '" cy="' + r2(b.y) + '" r="3" fill="' + color + '"/>' +
      '</g>';
    return { svg: g, ok: true };
  }

  var COL = {
    v: '#d24a4a',    // 3V3 / VBUS
    gnd: '#333840',  // GND
    sig: ['#2f7de0', '#e08a2f', '#8e44ad', '#159a72', '#c0392b']
  };

  // ============================================================
  //  レイアウト＋配線（フェーズ1: LED / RES / BTN）
  //  戻り値 { partsSvg, wiresSvg, rightCol, checks }
  // ============================================================
  function buildCircuit(board, pico, comps, overrides) {
    var P = board.POINTS;
    var partsSvg = [], wiresSvg = [];
    var checks = [];        // 電気的検証ログ
    var sigColorIdx = 0;
    var workCol = 24;       // Pico(1..20)の右側に部品を並べる
    var wireCount = 0;

    // ---- Pico ピン→穴参照の解決 ----
    function picoRef(spec) {
      if (!spec) return null;
      if (spec.gp != null) {
        var nm = 'GP' + parseInt(spec.gp);
        return pico.pins[nm] || null;
      }
      if (spec.v3v3) return pico.pins['3V3'];
      if (spec.vbus) return pico.pins['VBUS'];
      if (spec.gnd) return pico.pins['GNDb1'] || pico.pins['GNDt1'];
      return null;
    }
    function nearestGndRailHole(fromRef, band) {
      // band: 't' or 'b'。列の近い順にレール穴を返す（占有は簡易に無視）
      var f = P[fromRef]; var best = null, bd = Infinity;
      for (var k = 1; k <= 25; k++) {
        var ref = (band === 't' ? 't-.' : 'b-.') + k;
        var h = P[ref]; if (!h) continue;
        var d = Math.abs(h.x - f.x);
        if (d < bd) { bd = d; best = ref; }
      }
      return best;
    }
    function nearestVRailHole(fromRef, band) {
      var f = P[fromRef]; var best = null, bd = Infinity;
      for (var k = 1; k <= 25; k++) {
        var ref = (band === 't' ? 't+.' : 'b+.') + k;
        var h = P[ref]; if (!h) continue;
        var d = Math.abs(h.x - f.x);
        if (d < bd) { bd = d; best = ref; }
      }
      return best;
    }

    // ドラッグ（列シフト）反映: overrides[id].dx → 列数シフト
    function colShift(id) {
      var ov = overrides && overrides[id];
      if (!ov || !ov.dx) return 0;
      return Math.round(ov.dx / PITCH);
    }

    // ---- 部品ごとの配置ハンドラ ----
    var handlers = {
      // LED＋直列抵抗（アノード→GP・カソード→抵抗→GNDレール）
      LED: function (c) {
        var col = workCol + colShift(c.compId); workCol += 3;
        var aCol = col, kCol = col + 1;         // アノード列・カソード列（上グループ）
        // LED: A→e{aCol}, C→e{kCol}（脚は行eへ・本体は上に立つ）
        var pr = placePart('wokwi-led', c.compId, [['A', 'e' + aCol], ['C', 'e' + kCol]], P);
        if (!pr.ok) return placeholder(c, col);
        partsSvg.push(pr.svg);
        var col2 = COL.sig[sigColorIdx++ % COL.sig.length];
        // GP → アノード列（上グループの空き穴 a{aCol}）
        var gp = picoRef(c.pins.A);
        if (gp) { pushWire(gp, 'a' + aCol, col2, c.compId + ':A'); }
        // 直列抵抗：カソード列 → t-（GND）レール。抵抗を立てて配置。
        var rId = 'res_' + c.compId;
        var railHole = nearestGndRailHole('e' + kCol, 't');
        var rr = placePart('wokwi-resistor', rId, [['1', 'b' + kCol], ['2', railHole]], P);
        if (rr.ok) partsSvg.push(rr.svg);
        // Pico GND → GNDレール（下辺→b-）＋ t- と b- は同一GNDなので橋渡し
        ensureGndRailTop('e' + kCol);
        checks.push({ comp: c.compId, rule: 'LED anode->GP, cathode->R->GND',
          anodeGP: gp, cathodeToRes: railHole, ok: !!gp && rr.ok });
        return;
      },
      // タクトスイッチ（溝またぎ・端子1=上/端子2=下・押下で導通）
      BTN: function (c) {
        var col = workCol + colShift(c.compId); workCol += 4;
        // 1.l→e{col}（上グループ=端子1）, 2.l→f{col}（下グループ=端子2）
        var pr = placePart('wokwi-pushbutton', c.compId, [['1.l', 'e' + col], ['2.l', 'f' + col]], P);
        if (!pr.ok) return placeholder(c, col);
        partsSvg.push(pr.svg);
        var col2 = COL.sig[sigColorIdx++ % COL.sig.length];
        // 端子1(SIG側) と 端子2(VCC側) を pins から配線
        var t1 = c.pins.SIG, t2 = c.pins.VCC;
        var r1 = picoRef(t1), r2ref = picoRef(t2);
        // 端子1 = 上グループ col（a{col}で外側タップ）
        if (r1) pushWire(r1, 'a' + col, wireColor(t1, col2), c.compId + ':SIG');
        // 端子2 = 下グループ col（j{col}で外側タップ）
        if (t2 && t2.gnd) {
          ensureGndRailBottom('j' + col);
          var gh = nearestGndRailHole('j' + col, 'b');
          pushWire('j' + col, gh, COL.gnd, c.compId + ':VCC');
        } else if (r2ref) {
          pushWire(r2ref, 'j' + col, wireColor(t2, col2), c.compId + ':VCC');
        }
        checks.push({ comp: c.compId, rule: 'tact switch straddles trench (term1 top / term2 bottom)',
          term1Top: 'e' + col, term2Bottom: 'f' + col,
          separated: P['e' + col].group !== P['f' + col].group, ok: P['e' + col].group !== P['f' + col].group });
        return;
      },
      // 外付け抵抗（プルアップ/プルダウン）：A,B の2端子を穴/レールへ
      RES: function (c) {
        var col = workCol + colShift(c.compId); workCol += 3;
        var aCol = col, bCol = col + 3;
        var pr = placePart('wokwi-resistor', c.compId, [['1', 'c' + aCol], ['2', 'c' + bCol]], P);
        if (!pr.ok) return placeholder(c, col);
        partsSvg.push(pr.svg);
        // A端子
        wireEnd(c.pins.A, 'a' + aCol, c.compId + ':A');
        // B端子
        wireEnd(c.pins.B, 'a' + bCol, c.compId + ':B');
        checks.push({ comp: c.compId, rule: 'external resistor', pull: c.pull, ok: true });
        return;
      }
    };

    function wireColor(spec, sigCol) {
      if (!spec) return sigCol;
      if (spec.v3v3 || spec.vbus) return COL.v;
      if (spec.gnd) return COL.gnd;
      return sigCol;
    }
    // 端子specに応じて穴/レールへ配線（3V3/GNDはレール経由）
    function wireEnd(spec, holeRef, wid) {
      if (!spec) return;
      if (spec.v3v3) {
        ensureVRailTop(holeRef);
        var vh = nearestVRailHole(holeRef, 't');
        pushWire(holeRef, vh, COL.v, wid);
      } else if (spec.gnd) {
        ensureGndRailTop(holeRef);
        var gh = nearestGndRailHole(holeRef, 't');
        pushWire(holeRef, gh, COL.gnd, wid);
      } else if (spec.gp != null) {
        var gp = picoRef(spec);
        if (gp) pushWire(gp, holeRef, COL.sig[sigColorIdx++ % COL.sig.length], wid);
      }
    }
    function pushWire(fromRef, toRef, color, wid) {
      var w = wire(P, fromRef, toRef, color, wid);
      if (w.ok) { wiresSvg.push(w.svg); wireCount++; }
    }
    // Pico GND を上レール(t-)へ供給（1回だけ）
    var tGndReady = false, bGndReady = false, tVReady = false;
    function ensureGndRailTop() {
      if (tGndReady) return; tGndReady = true;
      var g = pico.pins['GNDt1'] || pico.pins['GNDb1'];
      var gh = nearestGndRailHole(g, 't');
      pushWire(g, gh, COL.gnd, 'picognd_t');
    }
    function ensureGndRailBottom() {
      if (bGndReady) return; bGndReady = true;
      var g = pico.pins['GNDb1'] || pico.pins['GNDt1'];
      var gh = nearestGndRailHole(g, 'b');
      pushWire(g, gh, COL.gnd, 'picognd_b');
    }
    function ensureVRailTop() {
      if (tVReady) return; tVReady = true;
      var v = pico.pins['3V3'];
      var vh = nearestVRailHole(v, 't');
      pushWire(v, vh, COL.v, 'picov_t');
    }

    function placeholder(c, col) {
      var h = P['c' + col];
      partsSvg.push('<g class="cv-comp" data-comp-id="' + c.compId + '">' +
        '<rect x="' + (h.x - 34) + '" y="' + (h.y - 20) + '" width="68" height="40" rx="6" fill="#eceae3" stroke="#b9b3a6" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<text x="' + h.x + '" y="' + (h.y - 2) + '" text-anchor="middle" font-size="11" fill="#7a7566">' + c.type + '</text>' +
        '<text x="' + h.x + '" y="' + (h.y + 12) + '" text-anchor="middle" font-size="8" fill="#a59f90">Phase2</text></g>');
      workCol += 3;
      checks.push({ comp: c.compId, rule: 'placeholder (unsupported in BB phase1)', ok: false });
    }

    // 実行順: RES を BTN より先に置くとプルアップ抵抗が左に来て見やすい
    var order = comps.slice().sort(function (a, b) {
      var rank = { RES: 0, LED: 1, BTN: 2 };
      return (rank[a.type] == null ? 9 : rank[a.type]) - (rank[b.type] == null ? 9 : rank[b.type]);
    });
    order.forEach(function (c) {
      (handlers[c.type] || function () { placeholder(c, workCol + colShift(c.compId)); })(c);
    });

    return { partsSvg: partsSvg.join('\n'), wiresSvg: wiresSvg.join('\n'),
      rightCol: workCol, checks: checks, wireCount: wireCount };
  }

  // ============================================================
  //  メイン: generateCircuitSVG（同期・文字列返し）
  // ============================================================
  window.generateCircuitSVG = function (workspace, options) {
    options = options || {};
    var overrides = options.overrides || {};
    var parsed = parseBlocks(workspace);
    var comps = parsed.comps;

    // 必要列数を見積り（部品1個あたり最大4列＋余白）
    var need = 24 + comps.length * 4 + 6;
    var cols = Math.max(30, need);

    var board = makeBoard(cols);
    var pico = makePico(board, 1);
    var circuit = buildCircuit(board, pico, comps, overrides);

    // ---- viewBox（ボード全体＋部品の立ち上がり分の上余白）----
    var vx = BX - 20, vy = BY - PITCH * 3.2;
    var vw = board.w + 40;
    var vh = board.h + PITCH * 4.5;

    var bg = '<rect x="' + vx + '" y="' + vy + '" width="' + vw + '" height="' + vh + '" fill="#fbfaf7"/>';

    var overlay = [];
    if (parsed.onboardLedOn) {
      overlay.push('<text x="' + pico.cx + '" y="' + (vy + 20) + '" text-anchor="middle" font-size="13" fill="#2e7d32" font-weight="bold">GP25 = オンボードLED（外部配線なし）</text>');
    }
    (parsed.badPins || []).forEach(function (bp, i) {
      overlay.push('<text x="' + pico.cx + '" y="' + (vy + 40 + i * 16) + '" text-anchor="middle" font-size="12" fill="#c0392b">GP' + bp.gp + ' は内部専用ピンです</text>');
    });
    if (comps.length === 0 && !parsed.onboardLedOn && (parsed.badPins || []).length === 0) {
      overlay.push('<text x="' + pico.cx + '" y="' + (board.POINTS['b-.5'].y + 40) + '" text-anchor="middle" font-size="20" fill="#b7b1a3">MicroPython ブロックを追加すると</text>');
      overlay.push('<text x="' + pico.cx + '" y="' + (board.POINTS['b-.5'].y + 68) + '" text-anchor="middle" font-size="20" fill="#b7b1a3">ブレッドボード配線図が表示されます</text>');
      vh += 80;
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + vw + '" height="' + vh +
      '" viewBox="' + vx + ' ' + vy + ' ' + vw + ' ' + vh + '" font-family="sans-serif">\n' +
      bg + '\n' + board.svg + '\n' + pico.svg + '\n' +
      circuit.wiresSvg + '\n' + circuit.partsSvg + '\n' + overlay.join('\n') + '\n</svg>';

    // 自己検証結果をグローバルに残す（Playwright/コンソールから照合可能）
    window.__PYCO_BB_CHECKS = {
      picoTop: PICO_TOP, picoBot: PICO_BOT,
      picoPinHoles: pico.pins, checks: circuit.checks
    };

    return { svg: svg, compCount: comps.length, wireCount: circuit.wireCount };
  };

  // 旧レンダラに対する識別フラグ
  window.__PYCO_BB_ACTIVE = true;
})();
