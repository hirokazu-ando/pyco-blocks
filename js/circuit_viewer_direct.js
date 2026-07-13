// ===== 直結スタイル 実体配線図レンダラ (Phase 4・縦置きPico＋直交格子配線) =====
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
// Phase 4 設計要点（先生フィードバック反映）:
//   - Pico(自作SVG)を縦置き(USB上向き)で中央に配置。左列=GP0..GP15 / 右列=VBUS..GP16。
//   - 接続中のPicoピンは基板の外側(左列→左・右列→右)に水平テキストでピン名を明記。
//   - 部品は接続先ピンの高さに合わせ左右へ縦整列（実寸bbox反映・重なりゼロ）。
//   - 配線は直交(90°)格子ルーティング。弧は廃止し水平/垂直セグメントのみ。
//     レーン割当(区間グラフ貪欲彩色)で縦セグメントの重なり・密着を防ぐ。
//   - 反対側の列へ届く線(3V3など)は基板の上下を回る(wrap)ので本体を横切らない。
//   - 3V3/VBUS=赤・GND=黒・信号=部品ごと識別色。T字分岐のみドット。
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
  var PITCH = 18;                 // Picoピン間隔（縦）
  var SCL = PITCH / 9.6;          // Pico自作アートの格子整合スケール ≒1.875
  var CH_STEP = 13;               // 配線レーン間隔（格子・12〜16px）
  var LBLW = 34;                  // 基板端〜ピン名ラベル帯の幅
  var CIN = 128;                  // 基板端〜部品接続ピン列の間隙（ラベル帯＋レーン＋余白）
  var VGAP = 20;                  // 同一サイド内の部品縦間隙
  var STUB = 20;                  // wrap配線のピン側スタブ長
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
  // ピン名の呼び出しチップ（不透明背景で配線を隠し確実に読める）
  function pinChip(x, y, text, side) {
    var fs = 8.6, padX = 3.2, w = text.length * fs * 0.62 + padX * 2, h = 13;
    var rx = (side === 'left') ? x - w : x;
    var tx = (side === 'left') ? x - padX : x + padX;
    var anchor = (side === 'left') ? 'end' : 'start';
    return '<g class="cv-pinlbl">' +
      '<rect x="' + r2(rx) + '" y="' + r2(y - h / 2) + '" width="' + r2(w) + '" height="' + h +
      '" rx="2.5" fill="#fbfaf7" stroke="#c9c3b4" stroke-width="0.8"/>' +
      '<text x="' + r2(tx) + '" y="' + r2(y + 3) + '" text-anchor="' + anchor + '" font-size="' + fs +
      '" font-weight="bold" fill="#4a4f57">' + esc(text) + '</text></g>';
  }

  // ============================================================
  //  テキスト衝突管理（文字ラベルの重なり完全排除）
  //  全ラベル（ピン名チップ・部品側ピンラベル・部品名・極性±）の bbox を収集し、
  //  テキスト同士 / テキスト×配線 の交差を解消するレイアウトパス。
  //  解消手段の優先順: ①原位置 ②列に沿う微小オフセット ③外側/反対へ退避
  //                    ④密集限界では白不透明背景チップ化（許容箇所は数えて報告）
  // ============================================================
  var SEG_PAD = 1.8;   // 配線ストローク(3px)半分＋余白。harness2.js と一致させること。
  // 文字幅の近似（全角=fs / 半角=0.6fs）。＋(FF0B)・−(2212)・●(25CF)は全角扱い。
  function textWidth(text, fs) {
    var w = 0;
    for (var i = 0; i < text.length; i++) {
      var cc = text.charCodeAt(i);
      var full = (cc >= 0x1100 && cc <= 0x115F) || (cc >= 0x2E80 && cc <= 0xA4CF) ||
        (cc >= 0xAC00 && cc <= 0xD7A3) || (cc >= 0xF900 && cc <= 0xFAFF) ||
        (cc >= 0xFE30 && cc <= 0xFE4F) || (cc >= 0xFF00 && cc <= 0xFF60) ||
        (cc >= 0xFFE0 && cc <= 0xFFE6) || cc === 0x2212 || cc === 0x25CF;
      w += full ? fs * 1.0 : fs * 0.6;
    }
    return w;
  }
  function textBBox(x, y, w, anchor, fs) {
    var x0, x1;
    if (anchor === 'end') { x1 = x; x0 = x - w; }
    else if (anchor === 'start') { x0 = x; x1 = x + w; }
    else { x0 = x - w / 2; x1 = x + w / 2; }
    return { x0: x0 - 0.6, x1: x1 + 0.6, y0: y - fs * 0.80, y1: y + fs * 0.24 };
  }
  function rOv(a, b) { var e = 0.4; return a.x0 < b.x1 - e && b.x0 < a.x1 - e && a.y0 < b.y1 - e && b.y0 < a.y1 - e; }
  // 配線折れ線を軸平行の細矩形群へ（テキスト×配線交差判定用）
  function segRectsFrom(wireSegs, pad) {
    var out = [];
    for (var s = 0; s < wireSegs.length; s++) {
      var pts = wireSegs[s].pts;
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        var x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
        if (x1 - x0 < 0.6 && y1 - y0 < 0.6) continue;
        out.push({ x0: x0 - pad, x1: x1 + pad, y0: y0 - pad, y1: y1 + pad });
      }
    }
    return out;
  }
  // 通常テキスト描画（白ハロー）。bg=true で白不透明背景チップを裏に敷く。
  function renderPlain(x, y, text, fs, anchor, weight, fill, bg) {
    var t = label(x, y, text, { fs: fs, anchor: anchor, weight: weight, fill: fill });
    if (!bg) return t;
    var bb = textBBox(x, y, textWidth(text, fs), anchor, fs);
    var rect = '<rect x="' + r2(bb.x0) + '" y="' + r2(bb.y0) + '" width="' + r2(bb.x1 - bb.x0) +
      '" height="' + r2(bb.y1 - bb.y0) + '" rx="2" fill="#fbfaf7" fill-opacity="0.95" stroke="#d8d2c4" stroke-width="0.7"/>';
    return '<g class="cv-txtbg">' + rect + t + '</g>';
  }
  // ピン名チップ（outGap>0 で外側へ退避＋リーダー線）。outGap=0 は従来 pinChip と同一。
  function renderChip(px, py, text, side, outGap) {
    var fs = 8.6, padX = 3.2, w = text.length * fs * 0.62 + padX * 2, h = 13;
    var left = (side === 'left');
    var ex = left ? px - outGap : px + outGap;
    var rx = left ? ex - w : ex;
    var tx = left ? ex - padX : ex + padX;
    var anchor = left ? 'end' : 'start';
    var lead = outGap > 0.5 ? '<line x1="' + r2(px) + '" y1="' + r2(py) + '" x2="' + r2(ex) + '" y2="' + r2(py) +
      '" stroke="#c9c3b4" stroke-width="1"/>' : '';
    return '<g class="cv-pinlbl">' + lead +
      '<rect x="' + r2(rx) + '" y="' + r2(py - h / 2) + '" width="' + r2(w) + '" height="' + h +
      '" rx="2.5" fill="#fbfaf7" stroke="#c9c3b4" stroke-width="0.8"/>' +
      '<text x="' + r2(tx) + '" y="' + r2(py + 3) + '" text-anchor="' + anchor + '" font-size="' + fs +
      '" font-weight="bold" fill="#4a4f57">' + esc(text) + '</text></g>';
  }
  function chipBBox(px, py, text, side, outGap) {
    var fs = 8.6, padX = 3.2, w = text.length * fs * 0.62 + padX * 2, h = 13;
    var left = (side === 'left');
    var ex = left ? px - outGap : px + outGap;
    var rx = left ? ex - w : ex;
    return { x0: rx - 0.5, x1: rx + w + 0.5, y0: py - h / 2 - 0.5, y1: py + h / 2 + 0.5 };
  }
  // ラベル候補生成（優先順に並べる。末尾は必ず bg フォールバック）
  function candidatesFor(d) {
    var list = [];
    if (d.kind === 'chip') {
      [0, 14, 28, 44].forEach(function (g) {
        list.push({ bbox: chipBBox(d.px, d.py, d.text, d.side, g), bg: true, isChip: true,
          render: (function (g2) { return function () { return renderChip(d.px, d.py, d.text, d.side, g2); }; })(g) });
      });
      return list;
    }
    if (d.kind === 'pinlbl') {
      var s = d.out, anchor = s < 0 ? 'end' : 'start', w = textWidth(d.text, d.fs);
      var offs = [[0, 0], [0, -7], [0, 7], [0, -14], [0, 14], [0, -21], [0, 21],
        [s * 7, 0], [s * 7, -7], [s * 7, 7], [s * 14, 0], [s * 14, -8], [s * 14, 8], [s * 22, -9], [s * 22, 9]];
      offs.forEach(function (o) {
        var x = d.bx + o[0], y = d.by + o[1];
        list.push({ bbox: textBBox(x, y, w, anchor, d.fs), bg: false,
          render: function () { return renderPlain(x, y, d.text, d.fs, anchor, null, LBL, false); } });
      });
      list.push({ bbox: textBBox(d.bx, d.by, w, anchor, d.fs), bg: true,
        render: function () { return renderPlain(d.bx, d.by, d.text, d.fs, anchor, null, LBL, true); } });
      return list;
    }
    // name（部品名）: 既定方向へ段階退避 → 反対方向 → 横ずらし → bg
    var w2 = textWidth(d.text, d.fs);
    var yo = d.below ? [0, 13, 26, 39, -18, -31, 52] : [0, -13, -26, 18, -39, 31];
    yo.forEach(function (o) {
      var y = d.by + o;
      list.push({ bbox: textBBox(d.bx, y, w2, 'middle', d.fs), bg: false,
        render: (function (yy) { return function () { return renderPlain(d.bx, yy, d.text, d.fs, 'middle', 'bold', LBL, false); }; })(y) });
    });
    [-46, 46].forEach(function (xo) {
      var x = d.bx + xo, y = d.by + (d.below ? 13 : -13);
      list.push({ bbox: textBBox(x, y, w2, 'middle', d.fs), bg: false,
        render: (function (xx, yy) { return function () { return renderPlain(xx, yy, d.text, d.fs, 'middle', 'bold', LBL, false); }; })(x, y) });
    });
    list.push({ bbox: textBBox(d.bx, d.by, w2, 'middle', d.fs), bg: true,
      render: function () { return renderPlain(d.bx, d.by, d.text, d.fs, 'middle', 'bold', LBL, true); } });
    return list;
  }
  // レイアウト本体：登録ラベルを衝突なしに配置。part 箱は name の soft 障害物。
  function layoutLabels(reg, partBoxes, segRects) {
    var ord = { pinlbl: 0, chip: 1, name: 2 };
    var items = reg.slice().sort(function (a, b) { return ord[a.kind] - ord[b.kind]; });
    var placed = [], svg = [], finalLabels = [], bgCount = 0, bgList = [];
    function textClear(bb) { for (var i = 0; i < placed.length; i++) if (rOv(bb, placed[i])) return false; return true; }
    function wireClear(bb) { for (var i = 0; i < segRects.length; i++) if (rOv(bb, segRects[i])) return false; return true; }
    function partClear(bb) { for (var i = 0; i < partBoxes.length; i++) if (rOv(bb, partBoxes[i].bb)) return false; return true; }
    var noOpt = (typeof window !== 'undefined' && window.__PYCO_NO_LABELOPT);
    items.forEach(function (d) {
      var cands = candidatesFor(d), chosen = null;
      if (noOpt) {   // 検証用：原位置固定（衝突解消を無効化）。既定では通らない。
        chosen = cands[0]; placed.push(chosen.bbox);
        finalLabels.push({ bbox: chosen.bbox, bg: false, chip: !!chosen.isChip, kind: d.kind });
        svg.push(chosen.render()); return;
      }
      var partCheck = (d.kind === 'name');
      for (var pass = 0; pass < 2 && !chosen; pass++) {
        for (var ci = 0; ci < cands.length; ci++) {
          var c = cands[ci];
          if (!textClear(c.bbox)) continue;
          if (!c.bg && !wireClear(c.bbox)) continue;
          if (pass === 0 && partCheck && !partClear(c.bbox)) continue;
          chosen = c; break;
        }
      }
      if (!chosen) chosen = cands[cands.length - 1];   // bg フォールバック
      placed.push(chosen.bbox);
      if (chosen.bg && !chosen.isChip) { bgCount++; bgList.push(d.kind + ':' + d.text); }
      finalLabels.push({ bbox: chosen.bbox, bg: !!chosen.bg, chip: !!chosen.isChip, kind: d.kind });
      svg.push(chosen.render());
    });
    return { svg: svg.join('\n'), labels: finalLabels, bgCount: bgCount, bgList: bgList };
  }

  // ============================================================
  //  Pico ピン配列の正（実機準拠・機械照合用）縦置き 上→下
  // ============================================================
  var PICO_LEFT = ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7',
    'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'];
  var PICO_RIGHT = ['VBUS', 'VSYS', 'GND', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'AGND',
    'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'];
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
  //  Pico 縦置き配置（自作SVG・USB上向き・左列/右列）
  // ============================================================
  function placePico(cx, cy) {
    var art = PARTS['pi-pico'];
    if (!art) return null;
    var s = SCL;
    var W = art.w * s, H = art.h * s;
    var ox = cx - W / 2, oy = cy - H / 2;
    var prefix = 'pico' + (_uid++) + '_';
    var tf = 'translate(' + r2(ox) + ',' + r2(oy) + ') scale(' + r4(s) + ')';
    var svg = '<g class="cv-comp" data-comp-id="__pico__" transform="' + tf + '">' + nsIds(art.inner, prefix) + '</g>';

    var leftX = ox, rightX = ox + W;
    var pinPos = {}, gndLeft = [], gndRight = [], table = { left: [], right: [] };
    Object.keys(art.pins).forEach(function (nm) {
      var q = art.pins[nm];
      var X = ox + s * q.x, Y = oy + s * q.y;
      var side = (X < cx) ? 'left' : 'right';
      var edgeX = side === 'left' ? leftX : rightX;
      var canon = wokwiPinName(nm);
      if (canon === 'GND') (side === 'left' ? gndLeft : gndRight).push({ x: edgeX, y: Y, side: side });
      else pinPos[canon] = { x: edgeX, y: Y, side: side };
      table[side].push({ y: Y, name: canon });
    });
    table.left.sort(function (a, b) { return a.y - b.y; });
    table.right.sort(function (a, b) { return a.y - b.y; });
    var leftOk = table.left.map(function (e) { return e.name; }).join(',') === PICO_LEFT.join(',');
    var rightOk = table.right.map(function (e) { return e.name; }).join(',') === PICO_RIGHT.join(',');
    gndLeft.sort(function (a, b) { return a.y - b.y; });
    gndRight.sort(function (a, b) { return a.y - b.y; });

    var box = { x0: ox, y0: oy, x1: ox + W, y1: oy + H };
    return {
      svg: svg, pinPos: pinPos, gndLeft: gndLeft, gndRight: gndRight, box: box,
      leftX: leftX, rightX: rightX, topY: oy, botY: oy + H, cx: cx, cy: cy,
      table: table, pinTableOk: leftOk && rightOk
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
  // 部品のピン列を縦向きにして基板側サイドへ配置（本体は外側＝基板と反対へ自動整向）
  //   innerX  = 部品の接続ピン列の x（基板端から CIN 離れた位置）
  //   cyC     = 縦方向の中心 y
  function placeSideStack(tag, id, side, innerX, cyC, scale, POINTS, axisPair) {
    var data = PARTS[tag];
    if (!data) return { ok: false, svg: '' };
    var names = Object.keys(data.pins);
    var first, last;
    if (axisPair && data.pins[axisPair[0]] && data.pins[axisPair[1]]) {
      // 明示軸（部品を90°の整った向きに保つ・斜め回転を避ける）
      first = axisPair[0]; last = axisPair[1];
    } else {
      // 最遠ピン2点を軸に採用
      first = names[0]; last = names[0];
      var maxd = -1;
      for (var i = 0; i < names.length; i++)
        for (var j = i + 1; j < names.length; j++) {
          var d = Math.hypot(data.pins[names[i]].x - data.pins[names[j]].x, data.pins[names[i]].y - data.pins[names[j]].y);
          if (d > maxd) { maxd = d; first = names[i]; last = names[j]; }
        }
    }
    var axisLen = Math.hypot(data.pins[first].x - data.pins[last].x, data.pins[first].y - data.pins[last].y) * scale;
    function build(topN, botN, dry) {
      var yTop = cyC - axisLen / 2, yBot = cyC + axisLen / 2;
      return placeAligned(tag, id, [[topN, { x: innerX, y: yTop }], [botN, { x: innerX, y: yBot }]], dry ? {} : POINTS);
    }
    var a = build(first, last, true), b = build(last, first, true);
    // 本体が基板側（内側）へはみ出さない向きを選ぶ
    function score(r) {
      if (!r.ok) return 1e9;
      return side === 'left' ? (r.bbox.x1 - innerX) : (innerX - r.bbox.x0);
    }
    var pick = score(a) <= score(b) ? [first, last] : [last, first];
    return build(pick[0], pick[1], false);
  }

  // ============================================================
  //  自作モジュール（ボード外）
  // ============================================================
  function drawBattery(x, y, id, txt, POINTS) {
    var w = 104, h = 62, LEAD = 16, svg = [];
    svg.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="#2e3440" stroke="#1c2128" stroke-width="2"/>');
    for (var i = 0; i < 2; i++) {
      var cyy = y + 16 + i * 28;
      svg.push('<rect x="' + (x + 14) + '" y="' + (cyy - 9) + '" width="76" height="18" rx="4" fill="#cfa54a" stroke="#8d6f2f"/>');
    }
    // 端子＝本体外へ引き出したリード線（+ は右／− は左）。配線は本体を横切らない。
    var pyP = y + 16, pyM = y + h - 16;
    var pxP = x + w + LEAD, pxM = x - LEAD;
    POINTS[id + '.+'] = { x: pxP, y: pyP };
    POINTS[id + '.-'] = { x: pxM, y: pyM };
    svg.push('<line x1="' + (x + w) + '" y1="' + pyP + '" x2="' + pxP + '" y2="' + pyP + '" stroke="#d24a4a" stroke-width="2.4"/>');
    svg.push('<line x1="' + x + '" y1="' + pyM + '" x2="' + pxM + '" y2="' + pyM + '" stroke="#33363c" stroke-width="2.4"/>');
    svg.push('<circle cx="' + pxP + '" cy="' + pyP + '" r="3.2" fill="#d24a4a"/>');
    svg.push('<circle cx="' + pxM + '" cy="' + pyM + '" r="3.2" fill="#33363c"/>');
    svg.push('<text x="' + (x + w + 4) + '" y="' + (pyP - 6) + '" fill="#ff8d8d" font-size="13" font-weight="bold" text-anchor="middle">+</text>');
    svg.push('<text x="' + (x - 4) + '" y="' + (pyM + 16) + '" fill="#9fc3ff" font-size="14" font-weight="bold" text-anchor="middle">−</text>');
    if (txt) svg.push(label(x + w / 2, y + h + 16, txt, { fs: 11, weight: 'bold' }));
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: pxM - 4, y0: y, x1: pxP + 4, y1: y + h + 22 }, body: { x0: x, y0: y, x1: x + w, y1: y + h } };
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
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: tex - 6, y0: y, x1: x + w + 12, y1: y + h + 20 }, body: { x0: x, y0: y, x1: x + w, y1: y + h } };
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
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: x - 8, y0: y, x1: x + w + 4, y1: y + h + 4 }, body: { x0: x, y0: y, x1: x + w, y1: y + h } };
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
      svg.push('<rect x="' + (px - 3) + '" y="' + (y + ph) + '" width="6" height="7" rx="1" fill="#c9cdd3"/>');
      if (keyTop[i]) POINTS[id + '.' + keyTop[i]] = { x: px, y: y - 6 };
      if (keyBot[i]) POINTS[id + '.' + keyBot[i]] = { x: px, y: y + ph + 6 };
      svg.push('<text x="' + px + '" y="' + (y + 11) + '" fill="#9aa3ad" font-size="5" text-anchor="middle">' + topN[i] + '</text>');
      svg.push('<text x="' + px + '" y="' + (y + ph - 4) + '" fill="#9aa3ad" font-size="4.6" text-anchor="middle">' + botN[i] + '</text>');
    }
    return { svg: '<g class="cv-comp" data-comp-id="' + id + '">' + svg.join('') + '</g>', bbox: { x0: x, y0: y - 8, x1: x + pw, y1: y + ph + 8 }, body: { x0: x, y0: y, x1: x + pw, y1: y + ph } };
  }

  // ============================================================
  //  色規則
  // ============================================================
  var COLPAL = {
    v: '#d24a4a', vext: '#e07b2f', gnd: '#33363c',
    sig: ['#2f7de0', '#e0a52f', '#8e44ad', '#159a72', '#c0392b', '#0e7490', '#a3559d', '#2f9e44']
  };

  // ============================================================
  //  配線マネージャ（直交・格子レーン割当・上下wrap）
  // ============================================================
  function ptInBox(p, box) { return p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1; }
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
  // 角を丸めた直交折れ線パス（半径 r の角丸）
  function orthoPath(pts, r) {
    if (pts.length < 2) return '';
    if (pts.length === 2) return 'M' + r2(pts[0].x) + ',' + r2(pts[0].y) + ' L' + r2(pts[1].x) + ',' + r2(pts[1].y);
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

  // 区間グラフ貪欲彩色（縦セグメントのレーン割当）。
  // 同一Picoピン(トランク)は同じレーンを共有。y範囲が重ならない群はレーン再利用。
  function assignChannels(list) {
    if (!list.length) return 0;
    var GAP = 6;
    var groupMap = {};
    list.forEach(function (w) {
      var key = w.side + ':' + r2(w.px) + ':' + r2(w.py);
      (groupMap[key] || (groupMap[key] = [])).push(w);
    });
    var groups = [];
    Object.keys(groupMap).forEach(function (k) {
      var ws = groupMap[k], lo = Infinity, hi = -Infinity;
      ws.forEach(function (w) { lo = Math.min(lo, w.py, w.cy); hi = Math.max(hi, w.py, w.cy); });
      groups.push({ wires: ws, lo: lo, hi: hi });
    });
    groups.sort(function (a, b) { return a.lo - b.lo; });
    var ends = [];
    groups.forEach(function (g) {
      var c = -1;
      for (var i = 0; i < ends.length; i++) { if (ends[i] + GAP <= g.lo) { c = i; break; } }
      if (c === -1) c = ends.length;
      ends[c] = g.hi;
      g.wires.forEach(function (w) { w.channelIdx = c + 1; });
    });
    return ends.length;
  }

  function WireMgr(pico) {
    var list = [];
    var innerBox = { x0: pico.leftX + 4, x1: pico.rightX - 4, y0: pico.topY + 6, y1: pico.botY - 6 };
    var crossCount = 0, crossIds = [], segs = [];
    return {
      // a,b の一方に pico:true が付いていれば Pico 配線、無ければ自由配線（部品間）
      add: function (a, b, color, id, opt) {
        if (!a || !b) return false;
        list.push({ a: a, b: b, color: color, id: id, opt: opt || {} });
        return true;
      },
      count: function () { return list.length; },
      crossings: function () { return crossCount; },
      crossIds: function () { return crossIds; },
      segs: function () { return segs; },
      render: function (wireOverrides) {
        wireOverrides = wireOverrides || {};
        var picoWires = [], freeWires = [], explicitWires = [];
        list.forEach(function (w) {
          if (w.opt && w.opt.pts) { explicitWires.push(w); return; }   // 明示ルート（本体回避・手動配線）
          var P = (w.a && w.a.pico) ? w.a : ((w.b && w.b.pico) ? w.b : null);
          if (P) {
            var C = (P === w.a) ? w.b : w.a;
            var compSide = (C.x < pico.cx) ? 'left' : 'right';
            w._P = P; w._C = C; w._side = P.side; w._compSide = compSide;
            w._wrap = (P.side !== compSide);
            // 基板より下に来るピンは基板下で処理する（横切り回避）。
            // 水平ピン列(L293D等)はバス帯で段状に、縦ピン列/孤立は水平着地。
            w._under = (C.y > pico.botY + 6);
            if (w._under) w._wrap = false;
            w.px = P.x; w.py = P.y; w.cx = C.y; // cy alias for interval (y of comp)
            picoWires.push(w);
          } else {
            freeWires.push(w);
          }
        });
        function chanX(side, idx) {
          return side === 'left' ? (pico.leftX - LBLW - idx * CH_STEP) : (pico.rightX + LBLW + idx * CH_STEP);
        }
        // ---- レーン割当（wrapしない・基板下でない Pico配線をサイド別に彩色）----
        var normL = picoWires.filter(function (w) { return !w._wrap && !w._under && w._side === 'left'; });
        var normR = picoWires.filter(function (w) { return !w._wrap && !w._under && w._side === 'right'; });
        var nL = assignChannels(normL), nR = assignChannels(normR);
        var laneNext = { left: nL + 1, right: nR + 1 };  // 通常レーンの外側から採番
        // ---- 基板下モジュール配線 ----
        // 同じ高さ(C.y)を共有する水平ピン列は段状バスで縦着地、
        // それ以外(縦ピン列/孤立)は通常どおり水平着地する。
        var unders = picoWires.filter(function (w) { return w._under; });
        var yCount = {};
        unders.forEach(function (w) { var k = Math.round(w._C.y / 3); yCount[k] = (yCount[k] || 0) + 1; });
        var underRow = unders.filter(function (w) { return yCount[Math.round(w._C.y / 3)] > 1; });
        var underCol = unders.filter(function (w) { return yCount[Math.round(w._C.y / 3)] <= 1; });
        underRow.sort(function (a, b) { return a._C.x - b._C.x; });
        underRow.forEach(function (w, i) {
          w._underCh = chanX(w._side, laneNext[w._side]++);
          w._busY = pico.botY + 16 + i * 7;
        });
        underCol.forEach(function (w) { w._underCh = chanX(w._side, laneNext[w._side]++); });
        // ---- wrap配線：上回り/下回りに分けトラックy ----
        var midY = pico.cy;
        var wraps = picoWires.filter(function (w) { return w._wrap; });
        var topW = [], botW = [];
        wraps.forEach(function (w) { (w.py < midY ? topW : botW).push(w); });
        topW.sort(function (a, b) { return Math.min(a.py, a._C.y) - Math.min(b.py, b._C.y); });
        botW.sort(function (a, b) { return Math.max(b.py, b._C.y) - Math.max(a.py, a._C.y); });
        topW.forEach(function (w, i) { w._trackY = pico.topY - 14 - i * 11; });
        botW.forEach(function (w, i) { w._trackY = pico.botY + 14 + i * 11; });
        // 部品側 dest レーン（compSide・トランク共有）
        var wg = {};
        wraps.forEach(function (w) {
          var key = r2(w.px) + ':' + r2(w.py) + ':' + w._compSide;
          (wg[key] || (wg[key] = [])).push(w);
        });
        var wgL = [], wgR = [];
        Object.keys(wg).forEach(function (k) {
          var ws = wg[k], minY = Math.min.apply(0, ws.map(function (w) { return w._C.y; }));
          (ws[0]._compSide === 'left' ? wgL : wgR).push({ ws: ws, minY: minY });
        });
        wgL.sort(function (a, b) { return a.minY - b.minY; });
        wgR.sort(function (a, b) { return a.minY - b.minY; });
        wgL.forEach(function (g) { var x = chanX('left', laneNext.left++); g.ws.forEach(function (w) { w._destCh = x; }); });
        wgR.forEach(function (g) { var x = chanX('right', laneNext.right++); g.ws.forEach(function (w) { w._destCh = x; }); });
        // 近側(ピン側)スタブレーン（pinSide・ピントランク共有）
        var sg = {};
        wraps.forEach(function (w) {
          var key = w._side + ':' + r2(w.px) + ':' + r2(w.py);
          (sg[key] || (sg[key] = [])).push(w);
        });
        Object.keys(sg).forEach(function (k) {
          var ws = sg[k], side = ws[0]._side, x = chanX(side, laneNext[side]++);
          ws.forEach(function (w) { w._stubX = x; });
        });

        // ---- 描画 ----
        var out = [];
        function emit(w, pts) {
          // セグメント記録（重複判定用）。同一ネットの共有を許容。
          // 電源(GND/VEXT/3V3)は単一ネットなので色でまとめる。信号はPicoピン=一意ネット。
          var trunk = (w.color === COLPAL.gnd) ? 'gnd' : (w.color === COLPAL.vext) ? 'vext' :
            (w.color === COLPAL.v) ? '3v3' : (w._P ? (r2(w.px) + ':' + r2(w.py)) : ('free:' + w.id));
          segs.push({ id: w.id, trunk: trunk, pts: pts.map(function (p) { return { x: r2(p.x), y: r2(p.y) }; }) });
          if (polyHitsInner(pts, innerBox)) { crossCount++; crossIds.push(w.id); }
          var d = orthoPath(pts, 3);
          var da = w._P ? (' data-x1="' + r2(w.px) + '" data-y1="' + r2(w.py) + '" data-x2="' + r2(w._C.x) + '" data-y2="' + r2(w._C.y) +
            '" data-wrap="' + (w._wrap ? 1 : 0) + '" data-ch="' + r2(w._chForData != null ? w._chForData : w.px) + '"' + (w._wrap ? ' data-track-y="' + r2(w._trackY) + '"' : '')) : '';
          out.push('<g class="cv-wire" data-wire-id="' + w.id + '"' + da + '>' +
            '<path class="cv-wire-hit" d="' + d + '" fill="none" stroke="transparent" stroke-width="13" pointer-events="stroke"/>' +
            '<path class="cv-wire-line" d="' + d + '" fill="none" stroke="' + w.color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<circle cx="' + r2(pts[0].x) + '" cy="' + r2(pts[0].y) + '" r="2.9" fill="' + w.color + '"/>' +
            '<circle cx="' + r2(pts[pts.length - 1].x) + '" cy="' + r2(pts[pts.length - 1].y) + '" r="2.9" fill="' + w.color + '"/></g>');
        }
        picoWires.forEach(function (w) {
          var wov = wireOverrides[w.id];
          var chDx = (wov && typeof wov.chDx === 'number') ? wov.chDx : 0;
          var P = w._P, C = w._C, pts;
          if (w._under) {
            var uch = w._underCh + chDx;
            w._chForData = uch;
            if (w._busY != null) {
              // 水平ピン列：バス帯で縦着地
              pts = [{ x: P.x, y: P.y }, { x: uch, y: P.y }, { x: uch, y: w._busY },
              { x: C.x, y: w._busY }, { x: C.x, y: C.y }];
            } else {
              // 縦ピン列/孤立：基板下で水平着地（基板を横切らない）
              pts = [{ x: P.x, y: P.y }, { x: uch, y: P.y }, { x: uch, y: C.y }, { x: C.x, y: C.y }];
            }
          } else if (!w._wrap) {
            if (Math.abs(P.y - C.y) < 1.5) {
              pts = [{ x: P.x, y: P.y }, { x: C.x, y: C.y }];
              w._chForData = P.x;
            } else {
              var ch = chanX(w._side, w.channelIdx) + chDx;
              w._chForData = ch;
              pts = [{ x: P.x, y: P.y }, { x: ch, y: P.y }, { x: ch, y: C.y }, { x: C.x, y: C.y }];
            }
          } else {
            var stubX = w._stubX;
            var destCh = w._destCh + chDx;
            w._chForData = destCh;
            pts = [{ x: P.x, y: P.y }, { x: stubX, y: P.y }, { x: stubX, y: w._trackY },
            { x: destCh, y: w._trackY }, { x: destCh, y: C.y }, { x: C.x, y: C.y }];
          }
          emit(w, pts);
        });
        // 自由配線（部品間）の直交ルート。ピン列の向きに合わせて着地方向を選ぶ。
        var yCntA = {}, yCntB = {};
        freeWires.forEach(function (w) {
          yCntA[Math.round(w.a.y / 3)] = (yCntA[Math.round(w.a.y / 3)] || 0) + 1;
          yCntB[Math.round(w.b.y / 3)] = (yCntB[Math.round(w.b.y / 3)] || 0) + 1;
        });
        var busFN = 0;
        freeWires.forEach(function (w) {
          var a = w.a, b = w.b;
          if (Math.abs(a.y - b.y) < 1.5 || Math.abs(a.x - b.x) < 1.5) { emit(w, [{ x: a.x, y: a.y }, { x: b.x, y: b.y }]); return; }
          var V = [{ x: a.x, y: a.y }, { x: a.x, y: b.y }, { x: b.x, y: b.y }];  // 縦抜き→水平着地
          var Lh = [{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }]; // 水平→縦着地
          if (yCntA[Math.round(a.y / 3)] > 1 && !polyHitsInner(V, innerBox)) { emit(w, V); return; }   // 送り側が横列
          if (yCntB[Math.round(b.y / 3)] > 1 && !polyHitsInner(Lh, innerBox)) { emit(w, Lh); return; }  // 受け側が横列
          if (!polyHitsInner(Lh, innerBox)) { emit(w, Lh); return; }
          if (!polyHitsInner(V, innerBox)) { emit(w, V); return; }
          // どちらも基板を横切る場合は基板下のバス帯を回る
          var busYf = pico.botY + 46 + (busFN++) * 11;
          emit(w, [{ x: a.x, y: a.y }, { x: a.x, y: busYf }, { x: b.x, y: busYf }, { x: b.x, y: b.y }]);
        });
        // 明示ルート（手動計算済み折れ線）をそのまま描画
        explicitWires.forEach(function (w) { emit(w, w.opt.pts); });
        return out.join('\n');
      }
    };
  }

  // ============================================================
  //  メイン回路構築
  // ============================================================
  function buildCircuit(pico, comps, overrides, wireOverrides) {
    var POINTS = {};
    var net = NetGraph();
    var wires = WireMgr(pico);
    var partsSvg = [], labelReg = [];
    var boxes = [{ id: '__pico__', bb: { x0: pico.box.x0, y0: pico.box.y0, x1: pico.box.x1, y1: pico.box.y1 } }];
    var usedPins = {};
    var bounds = { x0: pico.box.x0, y0: pico.box.y0, x1: pico.box.x1, y1: pico.box.y1 };
    var checks = [];
    var sigIdx = 0;
    function nextSig() { return COLPAL.sig[sigIdx++ % COLPAL.sig.length]; }
    function grow(bb) {
      if (!bb) return;
      bounds.x0 = Math.min(bounds.x0, bb.x0); bounds.y0 = Math.min(bounds.y0, bb.y0);
      bounds.x1 = Math.max(bounds.x1, bb.x1); bounds.y1 = Math.max(bounds.y1, bb.y1);
    }
    // body: 配線交差判定に使う「実体（塗り）矩形」。省略時は交差判定から除外（リード外向き部品）。
    function addBox(id, bb, body) { boxes.push({ id: id, bb: bb, body: body || null }); grow(bb); }
    function chk(comp, rule, ok, detail) { checks.push({ comp: comp, rule: rule, ok: !!ok, detail: detail || '' }); }

    // ---- Picoピン点/キー ----
    function gpPt(gp) {
      var p = pico.pinPos['GP' + parseInt(gp)];
      if (p) usedPins['GP' + parseInt(gp)] = { x: p.x, y: p.y, side: p.side, name: 'GP' + parseInt(gp) };
      return p ? { x: p.x, y: p.y, side: p.side, pico: true } : null;
    }
    function gpKey(gp) { return 'gp:' + parseInt(gp); }
    function v3Pt() { var p = pico.pinPos['3V3']; usedPins['3V3'] = { x: p.x, y: p.y, side: p.side, name: '3V3' }; return { x: p.x, y: p.y, side: p.side, pico: true }; }
    function vbusPt() { var p = pico.pinPos['VBUS']; usedPins['VBUS'] = { x: p.x, y: p.y, side: p.side, name: 'VBUS' }; return { x: p.x, y: p.y, side: p.side, pico: true }; }
    // 最寄りGND（指定サイド優先）
    function gndPt(y, side) {
      var pool = side === 'left' ? pico.gndLeft : pico.gndRight;
      if (!pool.length) pool = pico.gndLeft.concat(pico.gndRight);
      var best = pool[0], bd = Infinity;
      pool.forEach(function (g) { var d = Math.abs(g.y - y); if (d < bd) { bd = d; best = g; } });
      usedPins['GND@' + best.side + Math.round(best.y)] = { x: best.x, y: best.y, side: best.side, name: 'GND' };
      return { x: best.x, y: best.y, side: best.side, pico: true };
    }
    net.union('gnd', 'gnd');
    var VEXT_PT = null;

    function connected(a, b) { return net.conn(a, b); }
    function isGnd(k) { return net.conn(k, 'gnd'); }
    function is3v3(k) { return net.conn(k, '3v3'); }

    // ---- サイド割当（primary GP の列で左右決定）----
    function primarySide(c) {
      var order = ['SIG', 'A', 'PWM', 'TRIG', 'IN1', 'SDA', 'ECHO'];
      var cand = [];
      Object.keys(c.pins).forEach(function (k) { var pk = c.pins[k]; if (pk && pk.gp != null) cand.push({ k: k, gp: pk.gp }); });
      cand.sort(function (a, b) {
        var ia = order.indexOf(a.k), ib = order.indexOf(b.k);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
      for (var i = 0; i < cand.length; i++) {
        var p = pico.pinPos['GP' + parseInt(cand[i].gp)];
        if (p) return { side: p.side, anchorY: p.y };
      }
      return { side: 'right', anchorY: pico.cy };
    }

    // ---- 縦スロット割当（サイド別・上→下に詰める・重なりゼロ）----
    var cursor = { left: null, right: null };
    function slotV(side, h, anchorY, comp) {
      var ov = overrides && overrides[comp.compId];
      var top = (cursor[side] == null) ? (anchorY - h / 2) : Math.max(anchorY - h / 2, cursor[side] + VGAP);
      cursor[side] = top + h;
      return { cy: top + h / 2 + ((ov && ov.dy) || 0), dx: (ov && ov.dx) || 0 };
    }
    function innerXOf(side, dx) { return (side === 'left' ? pico.leftX - CIN : pico.rightX + CIN) + (dx || 0); }
    // ボード下モジュール配置カーソル
    var belowX = pico.leftX, belowY = pico.botY + 70;

    // 部品ピン小ラベル（接続点脇）→ 衝突管理レジストリへ登録
    function pinLabelAt(pt, text, side) {
      labelReg.push({ kind: 'pinlbl', text: text, fs: 7.2, out: (side === 'left' ? -1 : 1),
        bx: (side === 'left' ? pt.x - 4 : pt.x + 4), by: pt.y - 6 });
    }
    // 部品名ラベル（本体の外側）→ 衝突管理レジストリへ登録
    function nameLabel(cx, bb, text, below) {
      var y = below ? bb.y1 + 13 : bb.y0 - 5;
      labelReg.push({ kind: 'name', text: text, fs: 11, weight: 'bold', bx: cx, by: y, below: !!below });
    }

    // ====== 部品ハンドラ ======
    var H = {};

    // LED + 直列抵抗（縦積み: A(上)→GP / C→抵抗→GND）
    H.LED = function (c) {
      var ps = primarySide(c), side = ps.side;
      var sL = 1.4, sR = 1.1;
      var slotH = 150;
      var sl = slotV(side, slotH, ps.anchorY, c);
      var innerX = innerXOf(side, sl.dx);
      var ledCy = sl.cy - 46, resCy = sl.cy + 42;
      var pr = placeSideStack('wokwi-led', c.compId, side, innerX, ledCy, sL, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      var rr = placeSideStack('wokwi-resistor', 'res_' + c.compId, side, innerX, resCy, sR, POINTS);
      partsSvg.push(rr.svg); addBox('res_' + c.compId, rr.bbox);
      var gp = c.pins.A.gp;
      wires.add(gpPt(gp), POINTS[c.compId + '.A'], nextSig(), c.compId + ':A');
      net.union(gpKey(gp), c.compId + '.A');
      // C→抵抗（近い脚どうし）
      var rNear = (Math.abs(POINTS['res_' + c.compId + '.1'].y - POINTS[c.compId + '.C'].y) <
        Math.abs(POINTS['res_' + c.compId + '.2'].y - POINTS[c.compId + '.C'].y)) ? '1' : '2';
      var rFar = rNear === '1' ? '2' : '1';
      wires.add(POINTS[c.compId + '.C'], POINTS['res_' + c.compId + '.' + rNear], nextSig(), c.compId + ':C');
      net.union(c.compId + '.C', 'res_' + c.compId + '.' + rNear);
      net.union('res_' + c.compId + '.1', 'res_' + c.compId + '.2');
      var g = gndPt(POINTS['res_' + c.compId + '.' + rFar].y, side);
      wires.add(POINTS['res_' + c.compId + '.' + rFar], g, COLPAL.gnd, c.compId + ':GND');
      net.union('res_' + c.compId + '.' + rFar, 'gnd');
      pinLabelAt(POINTS[c.compId + '.A'], '＋', side); pinLabelAt(POINTS[c.compId + '.C'], '−', side);
      var full = { x0: Math.min(pr.bbox.x0, rr.bbox.x0), y0: Math.min(pr.bbox.y0, rr.bbox.y0), x1: Math.max(pr.bbox.x1, rr.bbox.x1), y1: Math.max(pr.bbox.y1, rr.bbox.y1) };
      nameLabel((full.x0 + full.x1) / 2, full, 'LED + 抵抗', true);
      chk(c.compId, 'LED: GP→アノード', connected(gpKey(gp), c.compId + '.A'));
      chk(c.compId, 'LED: カソード→抵抗→GND', connected(c.compId + '.C', 'res_' + c.compId + '.' + rNear) && isGnd(c.compId + '.C'));
      chk(c.compId, 'LED: アノードとカソードは非短絡', !connected(c.compId + '.A', c.compId + '.C'));
    };

    // タクトスイッチ（6mm・2端子を縦線に載せる）
    H.BTN = function (c) {
      var ps = primarySide(c), side = ps.side, s = 1.9;
      var sl = slotV(side, 60, ps.anchorY, c);
      var innerX = innerXOf(side, sl.dx);
      // 半ピッチずらして端子がPicoピン格子と一致しないようにする（水平線の偶発重なり回避）
      var pr = placeSideStack('wokwi-pushbutton-6mm', c.compId, side, innerX, sl.cy + PITCH / 2, s, POINTS, ['1.l', '2.l']);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      net.union(c.compId + '.1.l', c.compId + '.1.r');
      net.union(c.compId + '.2.l', c.compId + '.2.r');
      // 端子1(=1.l/1.r) と 端子2(=2.l/2.r) の代表点。基板側(内側=innerX)寄りの脚を SIG に。
      function inner(term) {
        var l = POINTS[c.compId + '.' + term + '.l'], r = POINTS[c.compId + '.' + term + '.r'];
        return (side === 'left' ? (l.x > r.x ? l : r) : (l.x < r.x ? l : r));
      }
      var sig = inner('2'), sigK = c.compId + '.2.l';
      var far = inner('1'), farK = c.compId + '.1.l';
      var gp = c.pins.SIG.gp;
      wires.add(gpPt(gp), sig, nextSig(), c.compId + ':SIG');
      net.union(gpKey(gp), sigK);
      pinLabelAt(sig, 'GP' + parseInt(gp), side);
      if (c.pins.VCC.gnd) {
        var g = gndPt(far.y, side);
        wires.add(far, g, COLPAL.gnd, c.compId + ':GND');
        net.union(farK, 'gnd'); pinLabelAt(far, 'GND', side);
      } else if (c.pins.VCC.v3v3) {
        wires.add(far, v3Pt(), COLPAL.v, c.compId + ':VCC');
        net.union(farK, '3v3'); pinLabelAt(far, '3V3', side);
      }
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, 'ボタン' + (c.pull === 'PULLUP_INT' ? '（内部PU）' : ''), true);
      chk(c.compId, 'タクトSW: 端子1↔端子2は非短絡', !connected(c.compId + '.1.l', c.compId + '.2.l'));
      chk(c.compId, 'タクトSW: GP→押下側端子', connected(gpKey(gp), sigK));
      if (c.pins.VCC.gnd) chk(c.compId, 'タクトSW: 対端子→GND', isGnd(farK));
      if (c.pins.VCC.v3v3) chk(c.compId, 'タクトSW: 対端子→3V3', is3v3(farK));
    };

    // 外付け抵抗（プルアップ/ダウン・縦配置）
    H.RES = function (c) {
      var gpSpec = c.pins.A.gp != null ? c.pins.A : c.pins.B;
      var railSpec = c.pins.A.gp != null ? c.pins.B : c.pins.A;
      var pgp = pico.pinPos['GP' + parseInt(gpSpec.gp)];
      var side = pgp ? pgp.side : 'right';
      var sl = slotV(side, 60, pgp ? pgp.y : pico.cy, c);
      var innerX = innerXOf(side, sl.dx);
      var pr = placeSideStack('wokwi-resistor', c.compId, side, innerX, sl.cy, 1.35, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      net.union(c.compId + '.1', c.compId + '.2');
      // GP脚=基板寄り(内側)を採用
      var p1 = POINTS[c.compId + '.1'], p2 = POINTS[c.compId + '.2'];
      var gpPin = (side === 'left' ? (p1.x > p2.x ? '1' : '2') : (p1.x < p2.x ? '1' : '2'));
      var railPin = gpPin === '1' ? '2' : '1';
      wires.add(gpPt(gpSpec.gp), POINTS[c.compId + '.' + gpPin], nextSig(), c.compId + ':GP');
      net.union(gpKey(gpSpec.gp), c.compId + '.' + gpPin);
      pinLabelAt(POINTS[c.compId + '.' + gpPin], 'GP' + parseInt(gpSpec.gp), side);
      if (railSpec.v3v3) {
        wires.add(POINTS[c.compId + '.' + railPin], v3Pt(), COLPAL.v, c.compId + ':V');
        net.union(c.compId + '.' + railPin, '3v3'); pinLabelAt(POINTS[c.compId + '.' + railPin], '3V3', side);
      } else {
        var g = gndPt(POINTS[c.compId + '.' + railPin].y, side);
        wires.add(POINTS[c.compId + '.' + railPin], g, COLPAL.gnd, c.compId + ':G');
        net.union(c.compId + '.' + railPin, 'gnd'); pinLabelAt(POINTS[c.compId + '.' + railPin], 'GND', side);
      }
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, '抵抗' + (c.pull === 'PULLUP_EXT' ? '（プルアップ）' : c.pull === 'PULLDOWN_EXT' ? '（プルダウン）' : ''), true);
      chk(c.compId, '抵抗(' + (c.pull || '') + '): GP側接続', connected(gpKey(gpSpec.gp), c.compId + '.' + gpPin));
      chk(c.compId, '抵抗(' + (c.pull || '') + '): ' + (railSpec.v3v3 ? '3V3' : 'GND') + '側接続', railSpec.v3v3 ? is3v3(c.compId + '.' + railPin) : isGnd(c.compId + '.' + railPin));
    };

    // 可変抵抗（3ピン縦）
    H.POT = function (c) {
      var ps = primarySide(c), side = ps.side, s = 0.72;
      var sl = slotV(side, 90, ps.anchorY, c);
      var innerX = innerXOf(side, sl.dx);
      var pr = placeSideStack('wokwi-potentiometer', c.compId, side, innerX, sl.cy, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC');
      net.union(c.compId + '.VCC', '3v3');
      var g = gndPt(POINTS[c.compId + '.GND'].y, side);
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND');
      net.union(c.compId + '.GND', 'gnd');
      wires.add(POINTS[c.compId + '.SIG'], gpPt(c.pins.SIG.gp), nextSig(), c.compId + ':SIG');
      net.union(c.compId + '.SIG', gpKey(c.pins.SIG.gp));
      pinLabelAt(POINTS[c.compId + '.SIG'], 'GP' + parseInt(c.pins.SIG.gp), side);
      pinLabelAt(POINTS[c.compId + '.VCC'], '3V3', side); pinLabelAt(POINTS[c.compId + '.GND'], 'GND', side);
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, '可変抵抗', true);
      chk(c.compId, 'POT: SIG→ADCピン', connected(c.compId + '.SIG', gpKey(c.pins.SIG.gp)));
      chk(c.compId, 'POT: VCC→3V3', is3v3(c.compId + '.VCC'));
      chk(c.compId, 'POT: GND→GND', isGnd(c.compId + '.GND'));
    };

    // 圧電ブザー（2ピン縦）
    H.BUZZ = function (c) {
      var ps = primarySide(c), side = ps.side, s = 0.62;
      var sl = slotV(side, 70, ps.anchorY, c);
      var innerX = innerXOf(side, sl.dx);
      var pr = placeSideStack('wokwi-buzzer', c.compId, side, innerX, sl.cy, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      var g = gndPt(POINTS[c.compId + '.1'].y, side);
      wires.add(POINTS[c.compId + '.1'], g, COLPAL.gnd, c.compId + ':GND');
      net.union(c.compId + '.1', 'gnd');
      wires.add(POINTS[c.compId + '.2'], gpPt(c.pins.SIG.gp), nextSig(), c.compId + ':SIG');
      net.union(c.compId + '.2', gpKey(c.pins.SIG.gp));
      pinLabelAt(POINTS[c.compId + '.1'], '−', side); pinLabelAt(POINTS[c.compId + '.2'], '＋GP' + parseInt(c.pins.SIG.gp), side);
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, 'ブザー', true);
      chk(c.compId, 'ブザー: GP→＋端子', connected(gpKey(c.pins.SIG.gp), c.compId + '.2'));
      chk(c.compId, 'ブザー: −端子→GND', isGnd(c.compId + '.1'));
    };

    // 超音波センサ HC-SR04（4ピン縦）
    H.HCSR04 = function (c) {
      var ps = primarySide(c), side = ps.side, s = 0.82;
      var sl = slotV(side, 110, ps.anchorY, c);
      var innerX = innerXOf(side, sl.dx);
      var pr = placeSideStack('wokwi-hc-sr04', c.compId, side, innerX, sl.cy, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC');
      net.union(c.compId + '.VCC', '3v3');
      var g = gndPt(POINTS[c.compId + '.GND'].y, side);
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND');
      net.union(c.compId + '.GND', 'gnd');
      wires.add(POINTS[c.compId + '.TRIG'], gpPt(c.pins.TRIG.gp), nextSig(), c.compId + ':TRIG');
      net.union(c.compId + '.TRIG', gpKey(c.pins.TRIG.gp));
      wires.add(POINTS[c.compId + '.ECHO'], gpPt(c.pins.ECHO.gp), nextSig(), c.compId + ':ECHO');
      net.union(c.compId + '.ECHO', gpKey(c.pins.ECHO.gp));
      pinLabelAt(POINTS[c.compId + '.VCC'], 'VCC', side); pinLabelAt(POINTS[c.compId + '.TRIG'], 'TRIG', side);
      pinLabelAt(POINTS[c.compId + '.ECHO'], 'ECHO', side); pinLabelAt(POINTS[c.compId + '.GND'], 'GND', side);
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, '超音波センサ HC-SR04', true);
      chk(c.compId, 'HC-SR04: TRIG→GP' + c.pins.TRIG.gp, connected(c.compId + '.TRIG', gpKey(c.pins.TRIG.gp)));
      chk(c.compId, 'HC-SR04: ECHO→GP' + c.pins.ECHO.gp, connected(c.compId + '.ECHO', gpKey(c.pins.ECHO.gp)));
      chk(c.compId, 'HC-SR04: VCC→3V3/GND→GND', is3v3(c.compId + '.VCC') && isGnd(c.compId + '.GND'));
    };

    // 温湿度センサ DHT22（4ピン縦・NC未接続）
    H.DHT22 = function (c) {
      var ps = primarySide(c), side = ps.side, s = 0.62;
      var sl = slotV(side, 96, ps.anchorY, c);
      var innerX = innerXOf(side, sl.dx);
      var pr = placeSideStack('wokwi-dht22', c.compId, side, innerX, sl.cy, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC');
      net.union(c.compId + '.VCC', '3v3');
      var g = gndPt(POINTS[c.compId + '.GND'].y, side);
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND');
      net.union(c.compId + '.GND', 'gnd');
      wires.add(POINTS[c.compId + '.SDA'], gpPt(c.pins.SIG.gp), nextSig(), c.compId + ':SIG');
      net.union(c.compId + '.SDA', gpKey(c.pins.SIG.gp));
      pinLabelAt(POINTS[c.compId + '.VCC'], 'VCC', side); pinLabelAt(POINTS[c.compId + '.SDA'], 'DATA', side); pinLabelAt(POINTS[c.compId + '.GND'], 'GND', side);
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, '温湿度センサ DHT22', true);
      chk(c.compId, 'DHT22: DATA→GP' + c.pins.SIG.gp, connected(c.compId + '.SDA', gpKey(c.pins.SIG.gp)));
      chk(c.compId, 'DHT22: VCC→3V3/GND→GND', is3v3(c.compId + '.VCC') && isGnd(c.compId + '.GND'));
      chk(c.compId, 'DHT22: NC未接続', !isGnd(c.compId + '.NC') && !is3v3(c.compId + '.NC'));
    };

    // 7セグLED（サイド・縦向き＝各ピンが異なる高さで格子配線に載る）
    H.SEG7 = function (c) {
      var ps = primarySide(c), side = ps.side, s = 1.5;
      var sl = slotV(side, 150, ps.anchorY, c);
      var innerX = innerXOf(side, sl.dx);
      var pr = placeSideStack('wokwi-7segment', c.compId, side, innerX, sl.cy, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox);
      net.union(c.compId + '.COM.1', c.compId + '.COM.2');
      var g = gndPt(POINTS[c.compId + '.COM.2'].y, side);
      wires.add(POINTS[c.compId + '.COM.2'], g, COLPAL.gnd, c.compId + ':COM');
      net.union(c.compId + '.COM.2', 'gnd');
      pinLabelAt(POINTS[c.compId + '.COM.2'], 'COM', side);
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function (sname) {
        if (!c.pins[sname]) return;
        wires.add(POINTS[c.compId + '.' + sname], gpPt(c.pins[sname].gp), nextSig(), c.compId + ':' + sname);
        net.union(c.compId + '.' + sname, gpKey(c.pins[sname].gp));
        pinLabelAt(POINTS[c.compId + '.' + sname], sname, side);
        chk(c.compId, '7セグ: ' + sname + '→GP' + c.pins[sname].gp, connected(c.compId + '.' + sname, gpKey(c.pins[sname].gp)));
      });
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, '7セグメントLED', true);
      chk(c.compId, '7セグ: COM→GND', isGnd(c.compId + '.COM.2'));
    };

    // I2C LCD1602（右サイド・ピンは左端＝基板向き）
    H.LCD = function (c) {
      var s = 0.72;
      var art = PARTS['wokwi-lcd1602'];
      var ov = overrides && overrides[c.compId];
      var tx = pico.rightX + CIN + ((ov && ov.dx) || 0);
      var ty = pico.topY + 6 + ((ov && ov.dy) || 0);
      var pr = placeAt('wokwi-lcd1602', c.compId, tx, ty, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox, pr.bbox);
      var g = gndPt(POINTS[c.compId + '.GND'].y, 'right');
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND');
      net.union(c.compId + '.GND', 'gnd');
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC');
      net.union(c.compId + '.VCC', '3v3');
      wires.add(POINTS[c.compId + '.SDA'], gpPt(c.pins.SDA.gp), nextSig(), c.compId + ':SDA');
      net.union(c.compId + '.SDA', gpKey(c.pins.SDA.gp));
      wires.add(POINTS[c.compId + '.SCL'], gpPt(c.pins.SCL.gp), nextSig(), c.compId + ':SCL');
      net.union(c.compId + '.SCL', gpKey(c.pins.SCL.gp));
      ['GND', 'VCC', 'SDA', 'SCL'].forEach(function (pn) { pinLabelAt(POINTS[c.compId + '.' + pn], pn, 'left'); });
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, 'LCD1602 (I2C)', true);
      chk(c.compId, 'LCD: SDA→GP' + c.pins.SDA.gp, connected(c.compId + '.SDA', gpKey(c.pins.SDA.gp)));
      chk(c.compId, 'LCD: SCL→GP' + c.pins.SCL.gp, connected(c.compId + '.SCL', gpKey(c.pins.SCL.gp)));
      chk(c.compId, 'LCD: VCC→3V3/GND→GND', is3v3(c.compId + '.VCC') && isGnd(c.compId + '.GND'));
    };

    // CdS光センサモジュール（左サイド・ピンは右端＝基板向き）
    H.CDS = function (c) {
      var s = 0.8;
      var art = PARTS['wokwi-photoresistor-sensor'];
      var ov = overrides && overrides[c.compId];
      var tx = pico.leftX - CIN - art.w * s + ((ov && ov.dx) || 0);
      var ty = pico.topY + 6 + ((ov && ov.dy) || 0);
      var pr = placeAt('wokwi-photoresistor-sensor', c.compId, tx, ty, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox, pr.bbox);
      wires.add(POINTS[c.compId + '.VCC'], v3Pt(), COLPAL.v, c.compId + ':VCC');
      net.union(c.compId + '.VCC', '3v3');
      var g = gndPt(POINTS[c.compId + '.GND'].y, 'left');
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND');
      net.union(c.compId + '.GND', 'gnd');
      wires.add(POINTS[c.compId + '.AO'], gpPt(c.pins.SIG.gp), nextSig(), c.compId + ':SIG');
      net.union(c.compId + '.AO', gpKey(c.pins.SIG.gp));
      ['VCC', 'GND', 'AO'].forEach(function (pn) { pinLabelAt(POINTS[c.compId + '.' + pn], pn, 'right'); });
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, '光センサ (CdS)', true);
      chk(c.compId, 'CDS: AO→ADCピン', connected(c.compId + '.AO', gpKey(c.pins.SIG.gp)));
      chk(c.compId, 'CDS: VCC→3V3', is3v3(c.compId + '.VCC'));
      chk(c.compId, 'CDS: GND→GND', isGnd(c.compId + '.GND'));
    };

    // サーボ（右サイド・ピンは左端＝基板向き）
    H.SERVO = function (c) {
      var s = 0.8;
      var art = PARTS['wokwi-servo'];
      var ov = overrides && overrides[c.compId];
      var tx = pico.rightX + CIN + ((ov && ov.dx) || 0);
      var ty = (cursor.right != null ? cursor.right + VGAP : pico.topY + 6) + ((ov && ov.dy) || 0);
      cursor.right = ty + art.h * s;
      var pr = placeAt('wokwi-servo', c.compId, tx, ty, s, POINTS);
      partsSvg.push(pr.svg); addBox(c.compId, pr.bbox, pr.bbox);
      wires.add(POINTS[c.compId + '.PWM'], gpPt(c.pins.PWM.gp), nextSig(), c.compId + ':PWM');
      net.union(c.compId + '.PWM', gpKey(c.pins.PWM.gp));
      if (VEXT_PT) { wires.add(POINTS[c.compId + '.V+'], VEXT_PT, COLPAL.vext, c.compId + ':V+'); net.union(c.compId + '.V+', 'vext'); }
      var g = gndPt(POINTS[c.compId + '.GND'].y, 'right');
      wires.add(POINTS[c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND');
      net.union(c.compId + '.GND', 'gnd');
      ['PWM', 'V+', 'GND'].forEach(function (pn) { pinLabelAt(POINTS[c.compId + '.' + pn], pn === 'PWM' ? 'PWM(GP' + parseInt(c.pins.PWM.gp) + ')' : pn, 'left'); });
      nameLabel((pr.bbox.x0 + pr.bbox.x1) / 2, pr.bbox, 'サーボモーター', true);
      chk(c.compId, 'サーボ: PWM→GP' + c.pins.PWM.gp, connected(c.compId + '.PWM', gpKey(c.pins.PWM.gp)));
      chk(c.compId, 'サーボ: V+→外部電源', connected(c.compId + '.V+', 'vext'));
      chk(c.compId, 'サーボ: GND→GND', isGnd(c.compId + '.GND'));
    };

    // L293D + DCモーター（ボード下）
    H.L293D = function (c) {
      var ov = overrides && overrides[c.compId];
      var tx = belowX + ((ov && ov.dx) || 0);
      var ty = belowY + 20 + ((ov && ov.dy) || 0);
      var dip = drawL293D(tx, ty, c.compId, POINTS);
      partsSvg.push(dip.svg); addBox(c.compId, dip.bbox, dip.body);
      var mot = drawMotor(tx + 8 * PITCH + 60, ty - 8, 'motor_' + c.compId, 'DCモーター', POINTS);
      partsSvg.push(mot.svg); addBox('motor_' + c.compId, mot.bbox, mot.body);
      belowX += 8 * PITCH + 240;
      // ---- L293D 明示配線（DIP本体を横切らない・下辺ピンは一旦下へ退避してから回す）----
      var pw = 8 * PITCH, solidBot = ty + 74;   // 74 = drawL293D の DIP 高さ ph
      var bIdx = 0, lIdx = 0, rIdx = 0, mIdx = 0;
      function busBelow() { return solidBot + 16 + (bIdx++) * 11; }
      function chOut(P) {
        return (P.side === 'left')
          ? pico.leftX - LBLW - (3 + lIdx++) * CH_STEP
          : Math.max(pico.rightX + LBLW, tx + pw + 14) + (rIdx++) * CH_STEP;
      }
      // 下辺ピン → Pico（下へ退避 → 外側チャンネル → Pico ピンへ）
      function toPico(Ckey, P, color, id) {
        var C = POINTS[Ckey], bus = busBelow(), ch = chOut(P);
        wires.add(P, C, color, id, { pts: [
          { x: P.x, y: P.y }, { x: ch, y: P.y }, { x: ch, y: bus },
          { x: C.x, y: bus }, { x: C.x, y: C.y } ] });
      }
      // 下辺ピン → 外部電源＋（下へ退避 → 電池左まで水平 → 電池リードへ上がる）
      function toBatDown(Ckey, id) {
        var C = POINTS[Ckey], bus = busBelow(), bat = VEXT_PT;
        wires.add(C, bat, COLPAL.vext, id, { pts: [
          { x: C.x, y: C.y }, { x: C.x, y: bus }, { x: bat.x, y: bus }, { x: bat.x, y: bat.y } ] });
      }
      // 下辺ピン → モーター端子（下へ退避 → チップとモーターの間を上がる）
      function toMotor(Ckey, Mkey, color, id) {
        var C = POINTS[Ckey], M = POINTS[Mkey], bus = busBelow(), riser = tx + pw + 10 + (mIdx++) * 12;
        wires.add(C, M, color, id, { pts: [
          { x: C.x, y: C.y }, { x: C.x, y: bus }, { x: riser, y: bus }, { x: riser, y: M.y }, { x: M.x, y: M.y } ] });
      }
      net.union(c.compId + '.GNDb1', c.compId + '.GNDb2'); net.union(c.compId + '.GNDb1', c.compId + '.GNDt1'); net.union(c.compId + '.GNDt1', c.compId + '.GNDt2');
      toPico(c.compId + '.IN1', gpPt(c.pins.IN1.gp), nextSig(), c.compId + ':IN1'); net.union(c.compId + '.IN1', gpKey(c.pins.IN1.gp));
      toPico(c.compId + '.IN2', gpPt(c.pins.IN2.gp), nextSig(), c.compId + ':IN2'); net.union(c.compId + '.IN2', gpKey(c.pins.IN2.gp));
      toPico(c.compId + '.GNDb1', gndPt(pico.botY, 'left'), COLPAL.gnd, c.compId + ':GND'); net.union(c.compId + '.GNDb1', 'gnd');
      if (c.pins.EN && c.pins.EN.gp != null) {
        toPico(c.compId + '.EN1', gpPt(c.pins.EN.gp), nextSig(), c.compId + ':EN'); net.union(c.compId + '.EN1', gpKey(c.pins.EN.gp));
      } else if (VEXT_PT) {
        toBatDown(c.compId + '.EN1', c.compId + ':EN'); net.union(c.compId + '.EN1', 'vext');
      }
      if (VEXT_PT) {
        toBatDown(c.compId + '.VS', c.compId + ':VS'); net.union(c.compId + '.VS', 'vext');
        // VSS は上辺ピン＝そのまま上へ（本体の上を通らない）
        wires.add(POINTS[c.compId + '.VSS'], VEXT_PT, COLPAL.vext, c.compId + ':VSS', { pts: [
          { x: POINTS[c.compId + '.VSS'].x, y: POINTS[c.compId + '.VSS'].y },
          { x: POINTS[c.compId + '.VSS'].x, y: VEXT_PT.y }, { x: VEXT_PT.x, y: VEXT_PT.y } ] });
        net.union(c.compId + '.VSS', 'vext');
      }
      toMotor(c.compId + '.OUT1', 'motor_' + c.compId + '.a', nextSig(), c.compId + ':OUT1'); net.union(c.compId + '.OUT1', 'motor_' + c.compId + '.a');
      toMotor(c.compId + '.OUT2', 'motor_' + c.compId + '.b', nextSig(), c.compId + ':OUT2'); net.union(c.compId + '.OUT2', 'motor_' + c.compId + '.b');
      nameLabel((dip.bbox.x0 + dip.bbox.x1) / 2, dip.bbox, 'モータードライバ L293D', true);
      chk(c.compId, 'L293D: IN1→GP' + c.pins.IN1.gp, connected(c.compId + '.IN1', gpKey(c.pins.IN1.gp)));
      chk(c.compId, 'L293D: IN2→GP' + c.pins.IN2.gp, connected(c.compId + '.IN2', gpKey(c.pins.IN2.gp)));
      chk(c.compId, 'L293D: OUT1/OUT2→モーター', connected(c.compId + '.OUT1', 'motor_' + c.compId + '.a') && connected(c.compId + '.OUT2', 'motor_' + c.compId + '.b'));
      chk(c.compId, 'L293D: GND→GND', isGnd(c.compId + '.GNDb1'));
      chk(c.compId, 'L293D: VS/VSS→外部電源', connected(c.compId + '.VS', 'vext') && connected(c.compId + '.VSS', 'vext'));
      if (c.pins.EN && c.pins.EN.gp != null) chk(c.compId, 'L293D: EN→GP' + c.pins.EN.gp, connected(c.compId + '.EN1', gpKey(c.pins.EN.gp)));
      else chk(c.compId, 'L293D: EN→＋(常時有効)', connected(c.compId + '.EN1', 'vext'));
    };

    // ステッピングモーター 28BYJ-48 + ULN2003（ボード下）
    H.STEPPER = function (c) {
      var ov = overrides && overrides[c.compId];
      var ux = belowX + ((ov && ov.dx) || 0);
      var uy = belowY + 20 + ((ov && ov.dy) || 0);
      var uln = drawUln(ux, uy, 'uln_' + c.compId, POINTS);
      partsSvg.push(uln.svg); addBox('uln_' + c.compId, uln.bbox, uln.body);
      var ms = 0.72, marT = PARTS['wokwi-stepper-motor'];
      var mx = ux + 156 + 60, my = uy - 30;
      var pr = placeAt('wokwi-stepper-motor', 'stp_' + c.compId, mx, my, ms, POINTS);
      partsSvg.push(pr.svg); addBox('stp_' + c.compId, pr.bbox);
      belowX += 156 + marT.w * ms + 180;
      ['IN1', 'IN2', 'IN3', 'IN4'].forEach(function (k) {
        wires.add(POINTS['uln_' + c.compId + '.' + k], gpPt(c.pins[k].gp), nextSig(), c.compId + ':' + k);
        net.union('uln_' + c.compId + '.' + k, gpKey(c.pins[k].gp));
      });
      if (VEXT_PT) { wires.add(POINTS['uln_' + c.compId + '.VCC'], VEXT_PT, COLPAL.vext, c.compId + ':VCC'); net.union('uln_' + c.compId + '.VCC', 'vext'); }
      // GND/VCC は ULN 左辺の外向きリード端子 → 必ず左サイドから寄せて本体を横切らせない
      var g = gndPt(pico.botY, 'left');
      wires.add(POINTS['uln_' + c.compId + '.GND'], g, COLPAL.gnd, c.compId + ':GND');
      net.union('uln_' + c.compId + '.GND', 'gnd');
      // モーター4線：ULN 右辺端子 → 必ず右へ出してからステッピングへ（本体を横切らない・水平先行L字）
      ['A-', 'A+', 'B+', 'B-'].forEach(function (m, i) {
        var A = POINTS['uln_' + c.compId + '.M' + m], B = POINTS['stp_' + c.compId + '.' + m];
        wires.add(A, B, ['#2f7de0', '#e0a52f', '#8e44ad', '#159a72'][i], c.compId + ':M' + m,
          { pts: [{ x: A.x, y: A.y }, { x: B.x, y: A.y }, { x: B.x, y: B.y }] });
        net.union('uln_' + c.compId + '.M' + m, 'stp_' + c.compId + '.' + m);
      });
      nameLabel((uln.bbox.x0 + uln.bbox.x1) / 2, uln.bbox, 'ステッピングモーター 28BYJ-48', true);
      ['IN1', 'IN2', 'IN3', 'IN4'].forEach(function (k) {
        chk(c.compId, 'ステッピング: ' + k + '→GP' + c.pins[k].gp, connected('uln_' + c.compId + '.' + k, gpKey(c.pins[k].gp)));
      });
      chk(c.compId, 'ステッピング: 電源→外部電源/GND', connected('uln_' + c.compId + '.VCC', 'vext') && isGnd('uln_' + c.compId + '.GND'));
      chk(c.compId, 'ステッピング: モーター4線', connected('uln_' + c.compId + '.MA-', 'stp_' + c.compId + '.A-') && connected('uln_' + c.compId + '.MB-', 'stp_' + c.compId + '.B-'));
    };

    // 外部電源（電池ボックス・ボード下左）
    H.EXTPWR = function (c) {
      var ov = overrides && overrides[c.compId];
      var x = pico.leftX - 20 + ((ov && ov.dx) || 0);
      var y = pico.botY + 70 + ((ov && ov.dy) || 0);
      var bat = drawBattery(x, y, c.compId, '外部電源（モーター用 単3×2）', POINTS);
      partsSvg.push(bat.svg); addBox(c.compId, bat.bbox, bat.body);
      belowX = Math.max(belowX, bat.bbox.x1 + 40);
      belowY = Math.max(belowY, bat.bbox.y1 + 20);
      VEXT_PT = POINTS[c.compId + '.+'];
      net.union(c.compId + '.+', 'vext');
      var g = gndPt(pico.botY, 'left');
      wires.add(POINTS[c.compId + '.-'], g, COLPAL.gnd, c.compId + ':-');
      net.union(c.compId + '.-', 'gnd');
      // ＋/− 記号は drawBattery がリード端子脇に描画済み（重複ラベルは付けない）
      chk(c.compId, '外部電源: −→GND共通', isGnd(c.compId + '.-'));
      chk(c.compId, '外部電源: +→VEXT', connected(c.compId + '.+', 'vext'));
    };

    function placeholder(c) {
      var ps = primarySide(c), side = ps.side;
      var sl = slotV(side, 50, ps.anchorY, c);
      var x = innerXOf(side, sl.dx) - (side === 'left' ? 80 : 0);
      partsSvg.push('<g class="cv-comp" data-comp-id="' + c.compId + '"><rect x="' + (x) + '" y="' + (sl.cy - 20) + '" width="80" height="40" rx="6" fill="#eceae3" stroke="#b9b3a6" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<text x="' + (x + 40) + '" y="' + (sl.cy + 4) + '" text-anchor="middle" font-size="11" fill="#7a7566">' + c.type + '</text></g>');
      addBox(c.compId, { x0: x, y0: sl.cy - 20, x1: x + 80, y1: sl.cy + 20 });
      chk(c.compId, 'プレースホルダ（アート未取得）', false);
    }

    // ---- 実行順: 外部電源(VEXT確定) → 直挿し部品(サイド内はanchorY昇順) → ボード下/大型モジュール ----
    var moduleType = { LCD: 1, SERVO: 1, L293D: 1, STEPPER: 1, CDS: 1, SEG7: 1 };
    function bucket(c) { return c.type === 'EXTPWR' ? 0 : (moduleType[c.type] ? 2 : 1); }
    var order = comps.slice().sort(function (a, b) {
      var ba = bucket(a), bb2 = bucket(b);
      if (ba !== bb2) return ba - bb2;
      if (ba === 1) {
        var pa = primarySide(a), pq = primarySide(b);
        if (pa.side !== pq.side) return pa.side < pq.side ? -1 : 1;
        return pa.anchorY - pq.anchorY;
      }
      return 0;
    });
    order.forEach(function (c) { (H[c.type] || placeholder)(c); });

    // ---- Picoピン名ラベル（使用ピンのみ・基板外側に水平テキスト）----
    Object.keys(usedPins).forEach(function (k) {
      var p = usedPins[k]; if (!p) return;
      labelReg.push({ kind: 'chip', text: p.name, px: p.x, py: p.y, side: p.side });
    });

    // ---- 配線を先に確定 → その配線を障害物として全テキストの衝突を解消 ----
    var wiresSvg = wires.render(wireOverrides);
    var wsegs = wires.segs();
    // 配線端まで描画域に含める（チャンネル外周・本体回避ルートの見切れ防止）
    wsegs.forEach(function (w) { w.pts.forEach(function (p) { grow({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); }); });
    // ---- モジュール本体×配線 交差判定（body 指定の塗り矩形のみ・Pico横断とは別集計）----
    var bodyCross = 0, bodyCrossIds = [];
    var solidBodies = boxes.filter(function (bx) { return bx.body; });
    wsegs.forEach(function (w) {
      for (var i = 0; i < w.pts.length - 1; i++) {
        var a = w.pts[i], b = w.pts[i + 1];
        var horiz = Math.abs(a.y - b.y) < 0.6, vert = Math.abs(a.x - b.x) < 0.6;
        if (!horiz && !vert) continue;
        var sx0 = Math.min(a.x, b.x), sx1 = Math.max(a.x, b.x), sy0 = Math.min(a.y, b.y), sy1 = Math.max(a.y, b.y);
        for (var j = 0; j < solidBodies.length; j++) {
          var bb = solidBodies[j].body, IN = 3, TH = 10;
          var bx0 = bb.x0 + IN, bx1 = bb.x1 - IN, by0 = bb.y0 + IN, by1 = bb.y1 - IN;
          if (bx1 <= bx0 || by1 <= by0) continue;
          var pen;
          if (horiz) { if (!(sy0 > by0 && sy0 < by1)) continue; pen = Math.min(sx1, bx1) - Math.max(sx0, bx0); }
          else { if (!(sx0 > bx0 && sx0 < bx1)) continue; pen = Math.min(sy1, by1) - Math.max(sy0, by0); }
          if (pen > TH) { bodyCross++; if (bodyCrossIds.length < 8) bodyCrossIds.push(w.id + '×' + solidBodies[j].id); }
        }
      }
    });
    var segRects = segRectsFrom(wsegs, SEG_PAD);
    var lay = layoutLabels(labelReg, boxes, segRects);
    lay.labels.forEach(function (L) { grow(L.bbox); });   // 退避で外へ出た文字も描画域に含める

    return {
      partsSvg: partsSvg.join('\n'), wiresSvg: wiresSvg, labelSvg: lay.svg,
      wireCount: wires.count(), checks: checks, bounds: bounds, boxes: boxes,
      picoCross: wires.crossings(), crossIds: wires.crossIds(), wireSegs: wsegs,
      bodyCross: bodyCross, bodyCrossIds: bodyCrossIds,
      labelBoxes: lay.labels, labelBgCount: lay.bgCount, labelBgList: lay.bgList
    };
  }

  // ============================================================
  //  メイン: generateCircuitSVG
  // ============================================================
  window.generateCircuitSVG = function (workspace, options) {
    options = options || {};
    var overrides = options.overrides || {};
    var wireOverrides = options.wireOverrides || {};
    // Pico本体のドラッグは overrides['__pico__'] で中心をずらす
    var picoOv = overrides['__pico__'] || { dx: 0, dy: 0 };
    var parsed = parseBlocks(workspace);
    var comps = parsed.comps;

    var pico = placePico(picoOv.dx || 0, picoOv.dy || 0);
    if (!pico) {
      return {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120"><text x="20" y="60" fill="#c0392b" font-size="14">circuit_parts_data.js が読み込まれていません</text></svg>',
        compCount: 0, wireCount: 0
      };
    }

    var circuit = buildCircuit(pico, comps, overrides, wireOverrides);

    var b = circuit.bounds, pad = 30;
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
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + r2(vw) + '" height="' + r2(vh) +
      '" viewBox="' + r2(vx) + ' ' + r2(vy) + ' ' + r2(vw) + ' ' + r2(vh) + '" font-family="sans-serif">\n' +
      '<rect x="' + r2(vx) + '" y="' + r2(vy) + '" width="' + r2(vw) + '" height="' + r2(vh) + '" fill="#fbfaf7"/>\n' +
      circuit.wiresSvg + '\n' + pico.svg + '\n' + circuit.partsSvg + '\n' + circuit.labelSvg + '\n' + overlay.join('\n') + '\n</svg>';

    window.__PYCO_DIRECT_DEBUG = {
      picoLeft: PICO_LEFT, picoRight: PICO_RIGHT, picoTable: pico.table, picoPinTableOk: pico.pinTableOk,
      checks: circuit.checks, boxes: circuit.boxes, picoCross: circuit.picoCross, crossIds: circuit.crossIds,
      wireSegs: circuit.wireSegs, bodyCross: circuit.bodyCross, bodyCrossIds: circuit.bodyCrossIds,
      labelBoxes: circuit.labelBoxes, labelBgCount: circuit.labelBgCount, labelBgList: circuit.labelBgList
    };
    return { svg: svg, compCount: comps.length, wireCount: circuit.wireCount };
  };

  window.__PYCO_DIRECT_ACTIVE = true;
})();
