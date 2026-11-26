// =============================================================
// PoliviaBot シミュレータ（上から見たコース）
//   Pico モードで pvb_ のブロックを置くと、配線図の場所にこの画面を出す。
//   Pico をつないでいないときに［▶ 実行］を押すと、生成したコードをそのまま Skulpt で動かす。
//   生成コードは書きかえず、machine / utime / framebuf をシミュレータ用の代わりに差しかえる
//   （js/microbit_sim.js と同じ作り）。
//
//   - モーター：GP0・GP1（左）、GP2・GP3（右）の PWM。出力は (dutyA − dutyB) ÷ 65535
//     （app.js の _pvb_motor：前進は a=65535・b=65535−d）
//   - ラインセンサー：ADC(26)=左・ADC(27)=中・ADC(28)=右。白 約 2500・黒 約 20000（実機の目安）
//     センサーの下の黒の割合で間の値も出す（線のふちで止める #10 のため）
//   - 距離センサー：Pin(7)=trig・Pin(6)=echo。time_pulse_us が前の壁・箱までの往復時間を返す
//   - LED：GP11・GP12、スイッチ：GP13（SW1）・GP14（SW2）は画面のボタン
//   - OLED：SSD1306（128×64）。framebuf の fill / fill_rect / text / pixel などを画面に描く
//   - Wi-Fi・通信（network / socket）は動かない。読み込むと案内のエラーにする
//
//   ロボットの大きさとセンサーの位置は KiCad の基板（UME V2・Pico カード V2）から取った（GEOM）。
//   ★ 車輪の大きさ・左右の間と、速さ（VMAX・DEAD）は仮の値。実物が決まったら直す。
//   ロボットの絵は assets/pvb/pvb_top.png（tools/pvb_sprite/build_sprite.py で KiCad の 3D 書き出しから作る）
// =============================================================
(function () {
  'use strict';

  // ---------------------------------------------------------------- 寸法（cm）。（ ）は UME V2 の KiCad 座標 mm。車軸は y=120（モーター台 H3/H8）
  const GEOM = {
    track: 7.3,       // 左右の車輪の間（車輪の幅 12mm・内側が切り欠きの奥 x120 / 180 から 0.5mm → 中心 x113.5 / 186.5）
    bodyW: 8.5,       // 車体の幅（車輪の外側 x107.5〜192.5）
    bodyF: 8.3,       // 車軸から前の端まで（距離センサーの筒の先 y≈37。筒の長さは仮）
    bodyB: 2.2,       // 車軸から後ろの端まで（車輪の直径 44mm → y142）
    lineAhead: 4.4,   // 車軸からラインセンサーまで（TCRT5000 U6〜U8 y76）
    lineGap: 2.2,     // ラインセンサーの左右の間（x128 / 150 / 172）
    sonarAhead: 8.3,  // 車軸から距離センサーの筒の先まで
  };
  // ロボットの絵（前が右）。絵の範囲は y143〜36・x106〜194 → 車軸から後ろ 2.3・前 8.4、左右 ±4.4
  const SPRITE = { src: 'assets/pvb/pvb_top.png', x: -2.3, y: -4.4, w: 10.7, h: 8.8 };
  // 横の欄の大きなロボット（前が上）。部品の位置は KiCad 座標 mm（Pico カードは 2mm 前へずらした値）
  const BOARD = {
    led: { 11: [118, 68], 12: [182, 68] },        // D3 / D4（Pico の上下）
    sw: { 13: [136, 136], 14: [164, 136] },       // SW1 / SW2（電源スイッチの上下の押しボタン）
    power: [150, 136], powerLed: [142, 136],      // 電源スイッチ SW3（電池の左）と電源の LED D2
  };
  // 電源スイッチのレバー：ON は x149・OFF は x151（★仮：動く幅 2mm）、y138〜143 で基板の後ろへ出る
  const LEVER = { on: 149, off: 151, y0: 138, y1: 143, w: 1.6 };
  // GP11 / GP12 の LED（Pico カード D3 / D4。カードは UME より 2mm 前に重なる）
  const LEDPOS = { 11: [5.2, -3.2], 12: [5.2, 3.2] };
  const BOARD_SRC = 'assets/pvb/pvb_board.png';
  // KiCad 座標 mm → 横の欄の絵（前が上・x106〜194 × y36〜143）の中の % 位置
  function pct(x, y) { return [((x - 106) / 88 * 100).toFixed(2) + '%', ((y - 36) / 107 * 100).toFixed(2) + '%']; }
  // KiCad 座標 mm → ロボットの中の座標 cm（車軸 y120・中心 x150）
  function loc(x, y) { return [(120 - y) / 10, (x - 150) / 10]; }
  const VMAX = 40;    // 出力 100 のときの速さ（cm/s）
  const DEAD = 15;    // これより小さい出力では動かない（%）。#05 の「動き出す出力」用
  const WHITE = 2500, BLACK = 20000;
  const FIELD_W = 42, FIELD_H = 30;     // コースの大きさ（cm）。A3 の紙（42×29.7cm）くらい
  const PX = 4;                          // 線の判定用の絵の細かさ（1cm あたりの点）

  // ---------------------------------------------------------------- コース
  const COURSES = {
    floor: { label: 'なにもない床', start: [10, 15, 0], boxes: [], draw: function () {} },
    stopline: {
      label: '止まる線', start: [10, 15, 0], boxes: [],
      draw: function (g) { g.fillRect(32, 3, 2, FIELD_H - 6); },
    },
    box: {
      label: '線でかこんだ場', start: [21, 15, 0], boxes: [],
      draw: function (g) {
        const m = 1.5, w = 2;
        g.fillRect(m, m, FIELD_W - 2 * m, w);
        g.fillRect(m, FIELD_H - m - w, FIELD_W - 2 * m, w);
        g.fillRect(m, m, w, FIELD_H - 2 * m);
        g.fillRect(FIELD_W - m - w, m, w, FIELD_H - 2 * m);
      },
    },
    oval: {
      label: 'だ円のコース', start: [21 - GEOM.lineAhead, 25, 0], boxes: [],
      draw: function (g) {
        g.lineWidth = 1.8;
        g.beginPath(); g.ellipse(21, 15, 14, 10, 0, 0, Math.PI * 2); g.stroke();
      },
    },
    wall: {
      label: '箱を置いた紙', start: [4, 15, 0], boxes: [{ x: 37, y: 9, w: 4, h: 12 }],
      draw: function () {},
    },
  };
  const COURSE_KEYS = ['floor', 'stopline', 'box', 'oval', 'wall'];

  // ---------------------------------------------------------------- 状態
  const S = {
    course: 'floor',
    boxes: [],
    x: 30, y: 60, th: 0,             // 車軸の中心と向き（右向き 0・時計回りが正。画面は y が下向き）
    duty: { 0: 0, 1: 0, 2: 0, 3: 0 },
    pins: { 11: 0, 12: 0 },
    sw: { 13: 0, 14: 0 },
    power: 1,                        // 電源スイッチ（OFF だとモーターは回らない。Pico は USB の電気で動く）
    running: false,
    lastFrame: 0,
    swWaitSince: 0,                  // SW1 を待っている間（押してと知らせる）
    oledDirty: false,
    sonarCm: -1,
  };
  let lineCanvas = null, lineData = null;
  let ui = null;
  let lastSuggest = null;

  function rebuildLine() {
    if (!lineCanvas) {
      lineCanvas = document.createElement('canvas');
      lineCanvas.width = FIELD_W * PX; lineCanvas.height = FIELD_H * PX;
    }
    const g = lineCanvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#fff'; g.fillRect(0, 0, lineCanvas.width, lineCanvas.height);
    g.setTransform(PX, 0, 0, PX, 0, 0);
    g.fillStyle = '#000'; g.strokeStyle = '#000';
    COURSES[S.course].draw(g);
    lineData = g.getImageData(0, 0, lineCanvas.width, lineCanvas.height).data;
  }

  function isBlack(x, y) {
    const px = Math.floor(x * PX), py = Math.floor(y * PX);
    if (px < 0 || py < 0 || px >= FIELD_W * PX || py >= FIELD_H * PX) return 0;   // コースの外は床（白）
    return lineData[(py * FIELD_W * PX + px) * 4] < 128 ? 1 : 0;
  }

  // センサーの下の黒の割合（半径 0.6cm の中の 9 点）
  function blackRatio(x, y) {
    let n = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) n += isBlack(x + i * 0.6, y + j * 0.6);
    return n / 9;
  }

  function fwd() { return [Math.cos(S.th), Math.sin(S.th)]; }
  function left() { return [Math.sin(S.th), -Math.cos(S.th)]; }

  function linePos(k) {   // k: -1=左 0=中 1=右
    const f = fwd(), l = left();
    const a = GEOM.lineAhead, s = -k * GEOM.lineGap;
    return [S.x + f[0] * a + l[0] * s, S.y + f[1] * a + l[1] * s];
  }

  // 決まった小さなゆらぎ（毎回同じ動きになるよう乱数は使わない）
  let jitterN = 0;
  function jitter() { jitterN = (jitterN + 1) % 7; return [0, 60, -40, 90, -80, 30, -60][jitterN]; }

  function adc(ch) {
    const k = ch === 26 ? -1 : ch === 27 ? 0 : ch === 28 ? 1 : null;
    if (k === null) return 0;
    const p = linePos(k);
    return Math.max(0, Math.min(65535, Math.round(WHITE + blackRatio(p[0], p[1]) * (BLACK - WHITE) + jitter())));
  }

  // ---------------------------------------------------------------- 距離センサー
  function rayHit(ox, oy, dx, dy) {
    let best = Infinity;
    const rects = S.boxes.slice();
    // コースは A3 の紙なので、まわりにかべは無い（超音波が当たるのは箱だけ）
    rects.forEach(function (r) {
      let t0 = -Infinity, t1 = Infinity;
      const ax = [[ox, dx, r.x, r.x + r.w], [oy, dy, r.y, r.y + r.h]];
      for (let i = 0; i < 2; i++) {
        const o = ax[i][0], d = ax[i][1], lo = ax[i][2], hi = ax[i][3];
        if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return; continue; }
        let a = (lo - o) / d, b = (hi - o) / d;
        if (a > b) { const t = a; a = b; b = t; }
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      }
      if (t1 >= t0 && t0 > 0) best = Math.min(best, t0);
    });
    return best;
  }

  function sonarCm() {
    const f = fwd();
    const ox = S.x + f[0] * GEOM.sonarAhead, oy = S.y + f[1] * GEOM.sonarAhead;
    let best = Infinity;
    for (let a = -7.5; a <= 7.5; a += 3.75) {   // 前の 15° のはば
      const t = S.th + a * Math.PI / 180;
      best = Math.min(best, rayHit(ox, oy, Math.cos(t), Math.sin(t)));
    }
    return best > 400 ? -1 : best;
  }

  // ---------------------------------------------------------------- 動き
  function motorOut(a, b) { return (S.duty[a] - S.duty[b]) / 65535 * 100; }
  function wheelV(p) {
    const m = Math.abs(p);
    if (m < DEAD) return 0;
    return Math.sign(p) * (m - DEAD) / (100 - DEAD) * VMAX;
  }

  function corners(x, y, th) {
    const c = Math.cos(th), s = Math.sin(th);
    const hw = GEOM.bodyW / 2;
    return [[GEOM.bodyF, -hw], [GEOM.bodyF, hw], [-GEOM.bodyB, hw], [-GEOM.bodyB, -hw]].map(function (p) {
      return [x + p[0] * c - p[1] * s, y + p[0] * s + p[1] * c];
    });
  }
  function blocked(x, y, th) {
    // 紙の端から車体がはみ出すのはよい。車軸の中心が紙の外へ出るときだけ止める（画面から消えないように）
    if (x < 0 || y < 0 || x > FIELD_W || y > FIELD_H) return true;
    return corners(x, y, th).some(function (p) {
      return S.boxes.some(function (r) { return p[0] > r.x && p[0] < r.x + r.w && p[1] > r.y && p[1] < r.y + r.h; });
    });
  }

  function step(dt) {
    if (!S.power) return;
    const vl = wheelV(motorOut(0, 1)), vr = wheelV(motorOut(2, 3));
    const v = (vl + vr) / 2;
    const w = (vl - vr) / GEOM.track;   // 右が速いと左へ曲がる（画面では反時計回り＝th が減る）
    const n = Math.max(1, Math.ceil(dt / 0.005));
    for (let i = 0; i < n; i++) {
      const h = dt / n;
      const th = S.th + w * h;
      const x = S.x + v * Math.cos(th) * h, y = S.y + v * Math.sin(th) * h;
      if (!blocked(x, y, th)) { S.x = x; S.y = y; S.th = th; }
      else if (!blocked(S.x, S.y, th)) { S.th = th; }
    }
  }

  // ---------------------------------------------------------------- OLED
  let oledDraw = null, oledG = null;
  function oledInit() {
    if (!oledDraw) {
      oledDraw = document.createElement('canvas');
      oledDraw.width = 128; oledDraw.height = 64;
      oledG = oledDraw.getContext('2d');
    }
    oledG.fillStyle = '#000'; oledG.fillRect(0, 0, 128, 64);
    S.oledDirty = true;
  }
  function col(c) { return c ? '#fff' : '#000'; }

  // ---------------------------------------------------------------- Skulpt に渡す関数
  const api = {
    now: function () { return Math.floor(performance.now() - (S.t0 || 0)); },
    pwm: function (pin, d) { if (pin in S.duty) S.duty[pin] = Math.max(0, Math.min(65535, d | 0)); },
    pin_write: function (pin, v) { if (pin === 11 || pin === 12) S.pins[pin] = v ? 1 : 0; },
    pin_read: function (pin) {
      if (pin === 13 || pin === 14) {
        if (pin === 13 && !S.sw[13] && !S.swWaitSince) S.swWaitSince = performance.now();
        if (S.sw[pin]) S.swWaitSince = 0;
        return S.sw[pin];
      }
      return 0;
    },
    adc: function (ch) { return adc(ch); },
    pulse_us: function (timeout) {
      const d = sonarCm();
      if (d < 0) return -1;
      const us = Math.round(d * 2 / 0.0343);
      return us > timeout ? -1 : us;
    },
    fb_fill: function (c) { if (!oledG) oledInit(); oledG.fillStyle = col(c); oledG.fillRect(0, 0, 128, 64); },
    fb_rect: function (x, y, w, h, c, fill) {
      if (!oledG) oledInit();
      if (fill) { oledG.fillStyle = col(c); oledG.fillRect(x, y, w, h); }
      else { oledG.strokeStyle = col(c); oledG.lineWidth = 1; oledG.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
    },
    fb_pixel: function (x, y, c) { if (!oledG) oledInit(); oledG.fillStyle = col(c); oledG.fillRect(x, y, 1, 1); },
    fb_line: function (x1, y1, x2, y2, c) {
      if (!oledG) oledInit();
      oledG.strokeStyle = col(c); oledG.lineWidth = 1;
      oledG.beginPath(); oledG.moveTo(x1 + 0.5, y1 + 0.5); oledG.lineTo(x2 + 0.5, y2 + 0.5); oledG.stroke();
    },
    fb_text: function (s, x, y, c) {
      if (!oledG) oledInit();
      oledG.fillStyle = col(c);
      oledG.font = '8px monospace'; oledG.textBaseline = 'top';
      // framebuf の文字は 1 字 8 ドット。1 字ずつ置いて幅をそろえる
      const t = String(s);
      for (let i = 0; i < t.length; i++) oledG.fillText(t[i], x + i * 8 + 1, y);
    },
    oled_show: function () { S.oledDirty = true; S.oledUsed = true; },
  };

  const BRIDGE_JS = `var $builtinmodule = function(name) {
  var mod = {};
  var api = window.PycoPvbSim._api;
  Object.keys(api).forEach(function(k) {
    mod[k] = new Sk.builtin.func(function() {
      var a = Array.prototype.map.call(arguments, function(x) { return Sk.ffi.remapToJs(x); });
      var v = api[k].apply(null, a);
      return (v === null || v === undefined) ? Sk.builtin.none.none$ : Sk.ffi.remapToPy(v);
    });
  });
  return mod;
};`;

  const MACHINE_PY = `
import _pvbsim as _s

def _pid(p):
    return p.id if isinstance(p, Pin) else int(p)

class Pin:
    IN = 0
    OUT = 1
    PULL_UP = 1
    PULL_DOWN = 2
    def __init__(self, id, mode=-1, pull=-1, value=None):
        self.id = int(id)
        if value is not None:
            self.value(value)
    def init(self, mode=-1, pull=-1, value=None):
        if value is not None:
            self.value(value)
    def value(self, v=None):
        if v is None:
            return _s.pin_read(self.id)
        _s.pin_write(self.id, 1 if v else 0)
    def on(self):
        self.value(1)
    def off(self):
        self.value(0)
    def high(self):
        self.value(1)
    def low(self):
        self.value(0)
    def toggle(self):
        self.value(0 if self.value() else 1)
    def __call__(self, v=None):
        return self.value(v)

class PWM:
    def __init__(self, pin, freq=None, duty_u16=None):
        self.id = _pid(pin)
        if duty_u16 is not None:
            self.duty_u16(duty_u16)
    def freq(self, f=None):
        return 20000 if f is None else None
    def duty_u16(self, d=None):
        if d is None:
            return 0
        _s.pwm(self.id, int(d))
    def deinit(self):
        _s.pwm(self.id, 0)

class ADC:
    def __init__(self, pin):
        self.ch = _pid(pin)
    def read_u16(self):
        return _s.adc(self.ch)

class I2C:
    def __init__(self, id=0, sda=None, scl=None, freq=400000):
        pass
    def scan(self):
        return [0x3C]
    def writeto(self, addr, data, stop=True):
        if len(data) > 1 and data[0] == 0x40:
            _s.oled_show()
        return len(data)

def time_pulse_us(pin, level, timeout_us=1000000):
    return _s.pulse_us(timeout_us)

def freq(f=None):
    return 125000000
`;

  const UTIME_PY = `
import time as _time
import _pvbsim as _s

# 長い待ちも 50ms ずつに分ける。待ちの途中でも［■ 止める］が効くように
def sleep(s):
    ms = s * 1000
    while ms > 0:
        _time.sleep(min(ms, 50) / 1000)
        ms -= 50

def sleep_ms(ms):
    sleep(ms / 1000)

def sleep_us(us):
    if us >= 1000:
        sleep(us / 1000000)

def ticks_ms():
    return _s.now()

def ticks_us():
    return _s.now() * 1000

def ticks_add(t, d):
    return t + d

def ticks_diff(a, b):
    return a - b
`;

  const FRAMEBUF_PY = `
import _pvbsim as _s

MONO_VLSB = 0
MONO_HLSB = 3
MONO_HMSB = 4

class FrameBuffer:
    def __init__(self, buf, w, h, fmt=0, stride=None):
        self._w = w
        self._h = h
    def fill(self, c):
        _s.fb_fill(c)
    def fill_rect(self, x, y, w, h, c):
        _s.fb_rect(x, y, w, h, c, True)
    def rect(self, x, y, w, h, c, f=False):
        _s.fb_rect(x, y, w, h, c, bool(f))
    def pixel(self, x, y, c=None):
        if c is None:
            return 0
        _s.fb_pixel(x, y, c)
    def hline(self, x, y, w, c):
        _s.fb_rect(x, y, w, 1, c, True)
    def vline(self, x, y, h, c):
        _s.fb_rect(x, y, 1, h, c, True)
    def line(self, x1, y1, x2, y2, c):
        _s.fb_line(x1, y1, x2, y2, c)
    def text(self, s, x, y, c=1):
        _s.fb_text(str(s), x, y, c)
    def scroll(self, dx, dy):
        pass
`;

  // Wi-Fi と通信はシミュレータでは動かさない（読み込んだ時点で分かるように知らせる）
  const NET_PY = `
raise ImportError('Wi-Fi・通信のブロックは、シミュレータでは動きません。Pico W をつないで［▶ 実行］してください')
`;

  function installIntoSkulpt(Sk) {
    if (!Sk.builtinFiles) Sk.builtinFiles = { files: {} };
    const f = Sk.builtinFiles.files;
    f['src/lib/_pvbsim.js'] = BRIDGE_JS;
    f['src/lib/machine.py'] = MACHINE_PY;
    f['src/lib/utime.py'] = UTIME_PY;
    f['src/lib/framebuf.py'] = FRAMEBUF_PY;
    f['src/lib/network.py'] = NET_PY;
    f['src/lib/socket.py'] = NET_PY;
    // Skulpt には bytearray が無い。OLED のドライバが画面用の入れ物を作るのに使うだけなので bytes で代える
    // （描く処理はこのファイルの framebuf がする。入れ物の中身は使わない）
    if (Sk.builtins && !Sk.builtins.bytearray && Sk.builtins.bytes) Sk.builtins.bytearray = Sk.builtins.bytes;
  }

  // ---------------------------------------------------------------- 実行の始まりと終わり
  function placeStart() {
    const st = COURSES[S.course].start;
    S.x = st[0]; S.y = st[1]; S.th = st[2];
  }
  function reset() {
    S.duty = { 0: 0, 1: 0, 2: 0, 3: 0 };
    S.pins = { 11: 0, 12: 0 };
    S.swWaitSince = 0;
    S.t0 = performance.now();
    placeStart();
    oledInit();
    S.oledUsed = false;
    if (ui) ui.oled.hidden = true;
  }
  function halt() {
    S.duty = { 0: 0, 1: 0, 2: 0, 3: 0 };
    S.swWaitSince = 0;
  }
  function setRunning(r) {
    S.running = !!r;
    if (ui) {
      ui.root.classList.toggle('pvs-stopped', !r && ui.started);
      if (r) ui.started = true;
    }
  }

  function setCourse(key) {
    if (!COURSES[key]) return;
    S.course = key;
    S.boxes = COURSES[key].boxes.map(function (b) { return { x: b.x, y: b.y, w: b.w, h: b.h }; });
    rebuildLine();
    placeStart();
    if (ui) ui.sel.value = key;
  }

  // コードからコースを選ぶ。人が選び直したら、プログラムの種類が変わるまではそのままにする
  function suggest(code) {
    const c = String(code || '');
    const l = /ADC\(26\)/.test(c), m = /ADC\(27\)/.test(c), r = /ADC\(28\)/.test(c);
    const sonar = /time_pulse_us\(/.test(c);
    let key = 'floor';
    if (/=\s*max\(\w+,\s*ADC\(/.test(c)) key = 'box';          // 3 つのどれかが黒（線の内側にいる）
    else if (l && r) key = 'oval';                              // ライントレース
    else if (l || m || r) key = 'stopline';                     // 1 つだけ（線で止まる・線のふち）
    else if (sonar) key = 'wall';
    if (key !== lastSuggest) { lastSuggest = key; setCourse(key); }
  }

  // ---------------------------------------------------------------- 画面
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function mount(root, opts) {
    if (!root) return;
    root.replaceChildren();
    const top = el('div', 'pvs-top');
    const lab = el('label', 'pvs-course');
    lab.appendChild(document.createTextNode('コース '));
    const sel = el('select');
    sel.setAttribute('aria-label', 'コースを選ぶ');
    COURSE_KEYS.forEach(function (k) {
      const o = el('option', null, COURSES[k].label); o.value = k; sel.appendChild(o);
    });
    lab.appendChild(sel);
    const bStart = el('button', 'pvs-btn', 'はじめの位置へ');
    bStart.type = 'button';
    bStart.title = 'ロボットをコースのはじめの位置と向きにもどす';
    const bL = el('button', 'pvs-btn', '↺'); bL.type = 'button'; bL.title = 'ロボットの向きを左へ 15° 回す';
    const bR = el('button', 'pvs-btn', '↻'); bR.type = 'button'; bR.title = 'ロボットの向きを右へ 15° 回す';
    top.append(lab, bStart, bL, bR);

    const body = el('div', 'pvs-body');
    const fieldWrap = el('div', 'pvs-field-wrap');
    const field = el('canvas', 'pvs-field');
    field.setAttribute('role', 'img');
    field.setAttribute('aria-label', 'PoliviaBot を上から見たコース');
    fieldWrap.appendChild(field);

    const side = el('div', 'pvs-side');
    const oled = el('canvas', 'pvs-oled');
    oled.width = 128; oled.height = 64;
    oled.setAttribute('role', 'img'); oled.setAttribute('aria-label', 'OLED 画面');
    oled.hidden = true;   // 使ったときだけ出す
    // ロボットの絵：LED はその場所で光り、押しボタン・電源スイッチは絵の上で操作する（micro:bit のシミュレータと同じ考え）
    const robot = el('div', 'pvs-robot');
    const rimg = el('img', 'pvs-robot-img');
    rimg.src = BOARD_SRC; rimg.alt = 'PoliviaBot を上から見た絵（上が前）'; rimg.draggable = false;
    robot.appendChild(rimg);
    function put(e, xy) { const q = pct(xy[0], xy[1]); e.style.left = q[0]; e.style.top = q[1]; robot.appendChild(e); return e; }
    const ledEls = {};
    [[11, 'GP11 の LED'], [12, 'GP12 の LED']].forEach(function (p) {
      const e = el('span', 'pvs-led'); e.title = p[1]; ledEls[p[0]] = put(e, BOARD.led[p[0]]);
    });
    const pwrLed = put(el('span', 'pvs-led pvs-led-pwr'), BOARD.powerLed); pwrLed.title = '電源の LED';
    const swEls = {};
    [[13, 'SW1'], [14, 'SW2']].forEach(function (p) {
      const b = el('button', p[0] === 14 ? 'pvs-sw pvs-sw-r' : 'pvs-sw');
      b.type = 'button';
      b.appendChild(el('span', 'pvs-tag', p[1]));
      b.title = p[1] + '（押している間だけ押したことになる）';
      const down = function (e) { e.preventDefault(); S.sw[p[0]] = 1; b.classList.add('down'); };
      const up = function () { S.sw[p[0]] = 0; b.classList.remove('down'); };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat) down(e); } });
      b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') up(); });
      swEls[p[0]] = put(b, BOARD.sw[p[0]]);
    });
    // 電源スイッチ（押すたびに ON / OFF）。レバーは基板の後ろ（下）へ出ている
    const pwr = el('button', 'pvs-pwr');
    pwr.type = 'button';
    pwr.setAttribute('role', 'switch');
    const lever = el('span', 'pvs-lever');
    const pwrTag = el('span', 'pvs-tag', '電源');
    pwr.append(lever, pwrTag);
    put(pwr, BOARD.power);
    robot.appendChild(lever);
    function paintPower() {
      pwr.setAttribute('aria-checked', S.power ? 'true' : 'false');
      pwr.title = '電源スイッチ：' + (S.power ? 'ON' : 'OFF') + '（押すと切りかわる。OFF だとモーターは回らない）';
      pwrTag.textContent = '電源 ' + (S.power ? 'ON' : 'OFF');
      const q = pct(S.power ? LEVER.on : LEVER.off, (LEVER.y0 + LEVER.y1) / 2);
      lever.style.left = q[0]; lever.style.top = q[1];
      lever.style.width = (LEVER.w / 88 * 100).toFixed(2) + '%';
      lever.style.height = ((LEVER.y1 - LEVER.y0) / 107 * 100).toFixed(2) + '%';
    }
    pwr.addEventListener('click', function () { S.power = S.power ? 0 : 1; paintPower(); });
    paintPower();
    // センサーとモーターの値は、ロボットの絵の上の部品の場所に出す
    //   ラインセンサー：TCRT5000（x128 / 150 / 172・y76）、距離：超音波センサーの前、モーター：左右の車輪の上
    function chip(xy, cls, title) { const c = el('span', 'pvs-chip ' + cls); c.title = title; return put(c, xy); }
    const lineV = {};
    [[26, '左', 128], [27, '中', 150], [28, '右', 172]].forEach(function (q) {
      const c = chip([q[2], 76], 'pvs-chip-line', 'ラインセンサー（' + q[1] + '）の値。黒い線の上だと大きくなる');
      c.appendChild(el('span', 'pvs-k', q[1]));
      lineV[q[0]] = el('span', 'pvs-v', '0');
      c.appendChild(lineV[q[0]]);
    });
    const distT = chip([150, 40], 'pvs-chip-dist', '超音波センサーで測ったきょり');
    const motT = { L: chip([113.5, 120], 'pvs-chip-mot', '左のモーターの出力（−100〜100）'),
      R: chip([186.5, 120], 'pvs-chip-mot', '右のモーターの出力（−100〜100）') };
    const read = el('div', 'pvs-read');
    const hint = el('div', 'pvs-hint', '▶ SW1 を押すとスタート');
    hint.hidden = true;
    read.append(hint);
    side.append(oled, robot, read);
    body.append(fieldWrap, side);

    const note = el('p', 'pvs-note', 'ロボットと箱はドラッグで動かせます。コースは A3 の紙の大きさ。ロボットの大きさとセンサーの位置は実物どおり、速さは仮の値です。');
    root.append(top, body, note);

    ui = { root: root, sel: sel, field: field, oled: oled, ledEls: ledEls, pwrLed: pwrLed, swEls: swEls, lineV: lineV, distT: distT, motT: motT, hint: hint,
      started: false, opts: opts || {} };

    sel.addEventListener('change', function () { setCourse(sel.value); });
    bStart.addEventListener('click', function () { placeStart(); });
    bL.addEventListener('click', function () { S.th -= Math.PI / 12; });
    bR.addEventListener('click', function () { S.th += Math.PI / 12; });

    // ドラッグ：ロボット（車軸から 9cm 以内）か箱をつかむ
    let drag = null;
    function toWorld(e) {
      const r = field.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * FIELD_W, (e.clientY - r.top) / r.height * FIELD_H];
    }
    field.addEventListener('pointerdown', function (e) {
      const p = toWorld(e);
      if (Math.hypot(p[0] - S.x, p[1] - S.y) < 9) drag = { kind: 'bot', dx: S.x - p[0], dy: S.y - p[1] };
      else {
        const b = S.boxes.find(function (r) { return p[0] > r.x && p[0] < r.x + r.w && p[1] > r.y && p[1] < r.y + r.h; });
        if (b) drag = { kind: 'box', b: b, dx: b.x - p[0], dy: b.y - p[1] };
      }
      if (drag) { field.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    field.addEventListener('pointermove', function (e) {
      if (!drag) return;
      const p = toWorld(e);
      if (drag.kind === 'bot') {
        S.x = Math.max(0, Math.min(FIELD_W, p[0] + drag.dx));
        S.y = Math.max(0, Math.min(FIELD_H, p[1] + drag.dy));
      } else {
        drag.b.x = Math.max(0, Math.min(FIELD_W - drag.b.w, p[0] + drag.dx));
        drag.b.y = Math.max(0, Math.min(FIELD_H - drag.b.h, p[1] + drag.dy));
      }
    });
    const endDrag = function () { drag = null; };
    field.addEventListener('pointerup', endDrag);
    field.addEventListener('pointercancel', endDrag);

    setCourse(S.course);
    oledInit();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- 描く
  function fitField() {
    const wrap = ui.field.parentElement;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return false;
    let cw = w, ch = w * FIELD_H / FIELD_W;
    if (ch > h) { ch = h; cw = h * FIELD_W / FIELD_H; }
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    if (ui.field.width !== pw || ui.field.height !== ph) {
      ui.field.width = pw; ui.field.height = ph;
      ui.field.style.width = Math.round(cw) + 'px';
      ui.field.style.height = Math.round(ch) + 'px';
    }
    return true;
  }

  function drawField() {
    const cv = ui.field, g = cv.getContext('2d');
    const k = cv.width / FIELD_W;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(lineCanvas, 0, 0, cv.width, cv.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    // 10cm ごとの目もり
    g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1 / k;
    g.beginPath();
    for (let x = 5; x < FIELD_W; x += 5) { g.moveTo(x, 0); g.lineTo(x, FIELD_H); }
    for (let y = 5; y < FIELD_H; y += 5) { g.moveTo(0, y); g.lineTo(FIELD_W, y); }
    g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5 / k;   // A3 の紙の縁（かべではない）
    g.strokeRect(0.1, 0.1, FIELD_W - 0.2, FIELD_H - 0.2);
    S.boxes.forEach(function (r) {
      g.fillStyle = '#c8a26a'; g.fillRect(r.x, r.y, r.w, r.h);
      g.strokeStyle = '#7a5a2a'; g.lineWidth = 0.5; g.strokeRect(r.x, r.y, r.w, r.h);
    });
    // 距離センサーの見ている向き
    const f = fwd();
    const ox = S.x + f[0] * GEOM.sonarAhead, oy = S.y + f[1] * GEOM.sonarAhead;
    const d = S.sonarCm < 0 ? 60 : Math.min(S.sonarCm, 400);
    g.fillStyle = S.sonarCm >= 0 && S.sonarCm < 400 ? 'rgba(66,153,225,.18)' : 'rgba(66,153,225,.08)';
    g.beginPath(); g.moveTo(ox, oy);
    g.arc(ox, oy, d, S.th - 7.5 * Math.PI / 180, S.th + 7.5 * Math.PI / 180);
    g.closePath(); g.fill();
    // 車体
    g.save();
    g.translate(S.x, S.y); g.rotate(S.th);
    const img = robotImg();
    if (img) {
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(img, SPRITE.x, SPRITE.y, SPRITE.w, SPRITE.h);
    } else {   // 絵を読み込むまで・読み込めなかったとき
      const hw = GEOM.bodyW / 2;
      g.fillStyle = '#1a1a1c'; g.strokeStyle = '#000'; g.lineWidth = 0.3;
      g.beginPath(); g.rect(-GEOM.bodyB, -hw, GEOM.bodyF + GEOM.bodyB, GEOM.bodyW); g.fill(); g.stroke();
    }
    // 電源スイッチのレバー
    const lv = loc(S.power ? LEVER.on : LEVER.off, LEVER.y1);
    g.fillStyle = '#d9dce1'; g.fillRect(lv[0], lv[1] - LEVER.w / 20, (LEVER.y1 - LEVER.y0) / 10, LEVER.w / 10);
    if (S.power) {
      const pl = loc(BOARD.powerLed[0], BOARD.powerLed[1]);
      g.fillStyle = 'rgba(255,80,60,.5)'; g.beginPath(); g.arc(pl[0], pl[1], 0.6, 0, Math.PI * 2); g.fill();
    }
    // LED（光っているときだけ重ねる）
    [11, 12].forEach(function (n) {
      if (!S.pins[n]) return;
      const p = LEDPOS[n];
      g.fillStyle = 'rgba(246,224,94,.45)'; g.beginPath(); g.arc(p[0], p[1], 1.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff3a0'; g.beginPath(); g.arc(p[0], p[1], 0.55, 0, Math.PI * 2); g.fill();
    });
    g.restore();
    // ラインセンサー（黒の上は赤）
    [-1, 0, 1].forEach(function (k2) {
      const p = linePos(k2);
      const on = blackRatio(p[0], p[1]) > 0.5;
      g.fillStyle = on ? '#e53e3e' : '#fff'; g.strokeStyle = '#1a202c'; g.lineWidth = 0.3;
      g.beginPath(); g.arc(p[0], p[1], 0.55, 0, Math.PI * 2); g.fill(); g.stroke();
    });
  }

  let robotImgEl = null;
  function robotImg() {
    if (!robotImgEl) { robotImgEl = new Image(); robotImgEl.src = SPRITE.src; }
    return robotImgEl.complete && robotImgEl.naturalWidth ? robotImgEl : null;
  }

  function setText(e, t) { if (e.textContent !== t) e.textContent = t; }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!ui || !ui.root.isConnected) return;
    const dt = S.lastFrame ? Math.min(0.05, (t - S.lastFrame) / 1000) : 0;
    S.lastFrame = t;
    if (S.running) step(dt);
    if (ui.root.offsetParent === null) return;   // 見えていないときは描かない
    S.sonarCm = sonarCm();
    if (fitField()) drawField();
    if (S.oledDirty && oledDraw) {
      const g = ui.oled.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(oledDraw, 0, 0);
      S.oledDirty = false;
      if (S.oledUsed) ui.oled.hidden = false;
    }
    ui.ledEls[11].classList.toggle('on', !!S.pins[11]);
    ui.ledEls[12].classList.toggle('on', !!S.pins[12]);
    ui.pwrLed.classList.toggle('on', !!S.power);
    // SW1 を待ったまま 1 秒たったら、押せばはじまることを知らせる
    const waiting = S.running && S.swWaitSince && t - S.swWaitSince > 1000 && !S.sw[13];
    ui.swEls[13].classList.toggle('pvs-attn', !!waiting);
    [26, 27, 28].forEach(function (ch) { setText(ui.lineV[ch], String(adc(ch))); });
    setText(ui.distT, 'きょり ' + (S.sonarCm < 0 ? '遠い' : S.sonarCm.toFixed(1) + 'cm'));
    setText(ui.motT.L, String(Math.round(motorOut(0, 1))));
    setText(ui.motT.R, String(Math.round(motorOut(2, 3))));
    [26, 27, 28].forEach(function (ch) { ui.lineV[ch].parentNode.classList.toggle('pvs-black', adc(ch) > (WHITE + BLACK) / 2); });
    // 電源が OFF のままモーターを回そうとしていたら知らせる
    const noPower = S.running && !S.power && (Math.abs(motorOut(0, 1)) >= DEAD || Math.abs(motorOut(2, 3)) >= DEAD);
    setText(ui.hint, noPower ? '電源スイッチが OFF なので、モーターが回りません' : '▶ SW1 を押すとスタート');
    ui.hint.hidden = !(waiting || noPower);
  }

  window.PycoPvbSim = {
    mount: mount, installIntoSkulpt: installIntoSkulpt, reset: reset, halt: halt,
    setRunning: setRunning, suggest: suggest, setCourse: setCourse,
    _api: api, _state: S, _courses: COURSE_KEYS,
  };
})();
