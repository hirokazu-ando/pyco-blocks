// ===== micro:bit シミュレータ =====
// micro:bit モードの「シミュレータで実行」で、生成した MicroPython をブラウザの中（Skulpt）で動かす。
// microbit / music / radio / utime / machine を Python で書いた代わりのモジュールに差しかえ、
// LED・ボタン・センサーは下の S（状態）と画面の部品でやりとりする。
//
// 5×5 の文字の形（FONT）とアイコンの形（ICONS）は MakeCode for micro:bit
// （github.com/microsoft/pxt-microbit、MIT License、Copyright (c) Microsoft Corporation）の
// sim/state/ledmatrix.ts と libs/core/icons.ts から取った。ボードの絵（形・座標・色）は同じリポジトリの
// sim/visuals/microbit.ts から写した。
//
// 実機と違うところ：メロディは短い代わりの音、効果音は簡単な音の上下、
// 無線は画面の欄から「届いたこと」にする、端子のアナログ入力はタッチ中 1023・それ以外 0。

(() => {
const FONT = [0,0,0,0,0,8,8,8,0,8,10,74,64,0,0,10,95,234,95,234,14,217,46,211,110,25,50,68,137,51,12,146,76,146,77,8,8,0,0,0,4,136,8,8,4,8,4,132,132,136,0,10,68,138,64,0,4,142,196,128,0,0,0,4,136,0,0,14,192,0,0,0,0,8,0,1,34,68,136,16,12,146,82,82,76,4,140,132,132,142,28,130,76,144,30,30,194,68,146,76,6,202,82,95,226,31,240,30,193,62,2,68,142,209,46,31,226,68,136,16,14,209,46,209,46,14,209,46,196,136,0,8,0,8,0,0,4,128,4,136,2,68,136,4,130,0,14,192,14,192,8,4,130,68,136,14,209,38,192,4,14,209,53,179,108,12,146,94,210,82,28,146,92,146,92,14,208,16,16,14,28,146,82,82,92,30,208,28,144,30,30,208,28,144,16,14,208,19,113,46,18,82,94,210,82,28,136,8,8,28,31,226,66,82,76,18,84,152,20,146,16,16,16,16,30,17,59,117,177,49,17,57,53,179,113,12,146,82,82,76,28,146,92,144,16,12,146,82,76,134,28,146,92,146,81,14,208,12,130,92,31,228,132,132,132,18,82,82,82,76,17,49,49,42,68,17,49,53,187,113,18,82,76,146,82,17,42,68,132,132,30,196,136,16,30,14,200,8,8,14,16,8,4,130,65,14,194,66,66,78,4,138,64,0,0,0,0,0,0,31,8,4,128,0,0,0,14,210,82,79,16,16,28,146,92,0,14,208,16,14,2,66,78,210,78,12,146,92,144,14,6,200,28,136,8,14,210,78,194,76,16,16,28,146,82,8,0,8,8,8,2,64,2,66,76,16,20,152,20,146,8,8,8,8,6,0,27,117,177,49,0,28,146,82,82,0,12,146,82,76,0,28,146,92,144,0,14,210,78,194,0,14,208,16,16,0,6,200,4,152,8,8,14,200,7,0,18,82,82,79,0,17,49,42,68,0,17,49,53,187,0,18,76,140,146,0,17,42,68,152,0,30,196,136,30,6,196,140,132,134,8,8,8,8,8,24,8,12,136,24,0,0,12,131,96];
const ICONS = {
  ARROW_N: '00900:09990:90909:00900:00900',
  ARROW_NE: '00999:00099:00909:09000:90000',
  ARROW_E: '00900:00090:99999:00090:00900',
  ARROW_SE: '90000:09000:00909:00099:00999',
  ARROW_S: '00900:00900:90909:09990:00900',
  ARROW_SW: '00009:00090:90900:99000:99900',
  ARROW_W: '00900:09000:99999:09000:00900',
  ARROW_NW: '99900:99000:90900:00090:00009',
  HEART: '09090:99999:99999:09990:00900',
  HEART_SMALL: '00000:09090:09990:00900:00000',
  HAPPY: '00000:09090:00000:90009:09990',
  SAD: '00000:09090:00000:09990:90009',
  CONFUSED: '00000:09090:00000:09090:90909',
  ANGRY: '90009:09090:00000:99999:90909',
  ASLEEP: '00000:99099:00000:09990:00000',
  SURPRISED: '09090:00000:00900:09090:00900',
  SILLY: '90009:00000:99999:00099:00099',
  FABULOUS: '99999:99099:00000:09090:09990',
  MEH: '99099:00000:00090:00900:09000',
  YES: '00000:00009:00090:90900:09000',
  NO: '90009:09090:00900:09090:90009',
  TRIANGLE: '00000:00900:09090:99999:00000',
  TRIANGLE_LEFT: '90000:99000:90900:90090:99999',
  CHESSBOARD: '09090:90909:09090:90909:09090',
  DIAMOND: '00900:09090:90009:09090:00900',
  DIAMOND_SMALL: '00000:00900:09090:00900:00000',
  SQUARE: '99999:90009:90009:90009:99999',
  SQUARE_SMALL: '00000:09990:09090:09990:00000',
  SCISSORS: '99009:99090:00900:99090:99009',
  TSHIRT: '99099:99999:09990:09990:09990',
  ROLLERSKATE: '00099:00099:99999:99999:09090',
  DUCK: '09900:99900:09999:09990:00000',
  HOUSE: '00900:09990:99999:09990:09090',
  TORTOISE: '00000:09990:99999:09090:00000',
  BUTTERFLY: '99099:99999:00900:99999:99099',
  STICKFIGURE: '00900:99999:00900:09090:90009',
  GHOST: '09990:90909:99999:99999:90909',
  SWORD: '00900:00900:00900:09990:00900',
  GIRAFFE: '99000:09000:09000:09990:09090',
  SKULL: '09990:90909:99999:09990:09990',
  UMBRELLA: '09990:99999:00900:90900:99900',
  SNAKE: '99000:99099:09090:09990:00000',
  RABBIT: '90900:90900:99990:99090:99990',
  COW: '90009:90009:99999:09990:00900',
  MUSIC_CROTCHET: '00900:00900:00900:99900:99900',
  MUSIC_QUAVER: '00900:00990:00909:99900:99900',
  PITCHFORK: '90909:90909:99999:00900:00900',
  TARGET: '00900:09990:99099:09990:00900',
};

// ---------------------------------------------------------------- 状態
const S = {
  leds: new Array(25).fill(0), on: true,
  btn: { a: false, b: false }, presses: { a: 0, b: 0 },
  logo: false, pins: { p0: false, p1: false, p2: false },
  ax: 0, ay: 0, az: -1024, light: 128, temp: 21, sound: 30, heading: 0,
  flags: new Set(), shakeUntil: 0, gestureLog: [],
  th: { loud: 128, quiet: 64 },
  out: {}, radioLog: [], radioIn: [], group: 0,
  t0: performance.now(), volume: 128, speaker: true,
};

let anim = null;          // 文字を流す・順に出すタイマー
let ui = null;            // 画面の部品
let audioCtx = null, osc = null, oscGain = null, tuneTimers = [], playingUntil = 0;

function draw() {
  if (!ui) return;
  ui.leds.forEach((el, i) => {
    const v = S.on ? S.leds[i] : 0;
    // 明るさの見せ方は MakeCode と同じ（不透明度 100〜255／255、大きさ 0.6〜1.0 倍）
    el.style.opacity = v > 0 ? String((v / 9 * 155 + 100) / 255) : '0';
    if (v > 0) el.style.transform = `scale(${v / 9 * 0.4 + 0.6})`;
  });
  ui.caps.a.setAttribute('fill', S.btn.a ? TH.buttonDown : TH.buttonUp);
  ui.caps.b.setAttribute('fill', S.btn.b ? TH.buttonDown : TH.buttonUp);
  ui.caps.ab.setAttribute('fill', S.btn.a && S.btn.b ? TH.buttonDown : TH.virtualButtonUp);
  ui.headBg.setAttribute('fill', S.logo ? TH.buttonDown : TH.buttonUp);
  ['p0', 'p1', 'p2'].forEach(k => {
    const o = S.out[k];
    let v = 100, t = '';
    if (o !== undefined) {
      const n = Number(String(o).replace('PWM ', ''));
      if (String(o).startsWith('PWM')) { v = Math.floor(100 - n / 1023 * 100); t = '~' + n; }
      else { v = n > 0 ? 0 : 100; t = n > 0 ? '1' : '0'; }
    }
    if (S.pins[k]) v = 0;
    ui.pinStops[k].forEach(s => s.setAttribute('offset', v + '%'));
    ui.pinTexts[k].textContent = t;
  });
  const outs = Object.keys(S.out).map(k => `${k.toUpperCase()}: ${S.out[k]}`);
  ui.out.textContent = outs.length ? '端子の出力　' + outs.join('　') : '';
  ui.radio.textContent = S.radioLog.slice(-4).join('\n');
}

function setLeds(arr) { S.leds = arr.slice(0, 25); while (S.leds.length < 25) S.leds.push(0); draw(); }

function stopAnim() { if (anim) { clearInterval(anim); anim = null; } }

// 文字列 → 列ごとの点（[col][row]）。文字の間に 1 列空ける
function textColumns(text) {
  const cols = [];
  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i);
    if (c < 32 || c > 126) c = 63;   // 表示できない文字は「?」（実機と同じ）
    const base = (c - 32) * 5;
    for (let x = 0; x < 5; x++) {
      const col = [];
      for (let y = 0; y < 5; y++) col.push((FONT[base + y] & (1 << (4 - x))) ? 9 : 0);
      cols.push(col);
    }
    if (i < text.length - 1) cols.push([0, 0, 0, 0, 0]);
  }
  return cols;
}

function colsToLeds(cols, start) {
  const a = new Array(25).fill(0);
  for (let x = 0; x < 5; x++) {
    const col = cols[start + x];
    if (col) for (let y = 0; y < 5; y++) a[y * 5 + x] = col[y];
  }
  return a;
}

function charLeds(ch) { return colsToLeds(textColumns(ch), 0); }

// ---------------------------------------------------------------- 音
function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function toneStop() {
  tuneTimers.forEach(clearTimeout); tuneTimers = [];
  if (osc) { try { osc.stop(); } catch (_) {} osc = null; }
  playingUntil = 0;
}

function toneStart(freq, f1, ms) {
  const c = ctx();
  if (osc) { try { osc.stop(); } catch (_) {} osc = null; }
  if (!c || !S.speaker || freq <= 0) return;
  osc = c.createOscillator();
  oscGain = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (f1 && ms > 0) osc.frequency.linearRampToValueAtTime(f1, c.currentTime + ms / 1000);
  oscGain.gain.value = 0.06 * S.volume / 255;
  osc.connect(oscGain).connect(c.destination);
  osc.start();
  if (ms > 0) osc.stop(c.currentTime + ms / 1000);
}

const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// "c4:4" "eb" "r:2" … 高さと長さは前の音を引き継ぐ（MicroPython の music と同じ書き方）
function parseTune(notes, tickMs) {
  let oct = 4, dur = 4;
  return notes.map(n => {
    const m = /^([a-gr])([#b]?)(\d?)(?::(\d+))?$/i.exec(String(n).trim());
    if (!m) return [0, dur * tickMs];
    if (m[3]) oct = Number(m[3]);
    if (m[4]) dur = Number(m[4]);
    if (m[1].toLowerCase() === 'r') return [0, dur * tickMs];
    let semi = NOTE[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const f = 440 * Math.pow(2, (semi - 9) / 12 + (oct - 4));
    return [f, dur * tickMs];
  });
}

function playSeq(seq, loop) {
  toneStop();
  let t = 0;
  const total = seq.reduce((s, x) => s + x[1], 0);
  const run = () => {
    t = 0;
    seq.forEach(([f, ms]) => {
      tuneTimers.push(setTimeout(() => toneStart(f, 0, ms * 0.9), t));
      t += ms;
    });
    if (loop) tuneTimers.push(setTimeout(run, t));
  };
  run();
  playingUntil = loop ? Infinity : performance.now() + total;
  return total;
}

const SFX = {
  giggle: [[600, 900, 120], [600, 900, 120], [600, 900, 120]],
  happy: [[500, 1000, 250], [1000, 1300, 250]],
  hello: [[400, 900, 300], [900, 700, 200]],
  mysterious: [[300, 600, 600]],
  sad: [[700, 300, 700]],
  slide: [[300, 1200, 500]],
  soaring: [[400, 2000, 900]],
  spring: [[300, 900, 150], [900, 300, 150], [300, 900, 150]],
  twinkle: [[1500, 1800, 100], [1800, 1500, 100], [1500, 1800, 100], [2000, 2200, 100]],
  yawn: [[800, 300, 900]],
};

function playSfx(name) {
  toneStop();
  const seg = SFX[String(name).toLowerCase()] || SFX.hello;
  let t = 0;
  seg.forEach(([f0, f1, ms]) => { tuneTimers.push(setTimeout(() => toneStart(f0, f1, ms), t)); t += ms; });
  playingUntil = performance.now() + t;
  return t;
}

// ---------------------------------------------------------------- Python 側から呼ぶ関数（_mbsim）
function currentGesture() {
  if (performance.now() < S.shakeUntil) return 'shake';
  if (S.az < -700) return 'face up';
  if (S.az > 700) return 'face down';
  if (S.ax < -500) return 'left';
  if (S.ax > 500) return 'right';
  if (S.ay < -500) return 'up';
  if (S.ay > 500) return 'down';
  return '';
}

function flag(k) { S.flags.add(k); }

const api = {
  now: () => Math.round(performance.now() - S.t0),
  read: k => {
    if (k === 'a' || k === 'b') return S.btn[k];
    if (k in S.pins) return S.pins[k];
    if (k === 'logo') return S.logo;
    return S[k];
  },
  take: k => { const had = S.flags.has(k); S.flags.delete(k); return had; },
  presses: k => { const n = S.presses[k]; S.presses[k] = 0; return n; },
  gesture: () => currentGesture(),
  gestures: () => { const g = S.gestureLog; S.gestureLog = []; return g; },
  sound_now: () => (S.sound >= S.th.loud ? 'loud' : S.sound <= S.th.quiet ? 'quiet' : null),
  threshold: (e, v) => { S.th[e] = v; },
  leds: s => { stopAnim(); setLeds(String(s).split('').map(Number)); },
  pixel: (x, y, v) => { stopAnim(); S.leds[y * 5 + x] = v; draw(); },
  get_pixel: (x, y) => S.leds[y * 5 + x],
  display_on: on => { S.on = !!on; draw(); },
  is_on: () => S.on,
  // 文字を右から左へ流す。終わるまでのミリ秒を返す（待つかどうかは Python 側）
  scroll: (text, delay, loop) => {
    stopAnim();
    const cols = [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]].concat(textColumns(String(text)));
    const frames = cols.length;
    let f = 0;
    setLeds(colsToLeds(cols, 0));
    anim = setInterval(() => {
      f++;
      if (f >= frames) {
        if (loop) f = 0; else { stopAnim(); setLeds(new Array(25).fill(0)); return; }
      }
      setLeds(colsToLeds(cols, f));
    }, delay);
    return frames * delay;
  },
  // 1 文字ずつ順に出す。最後の文字は出したまま
  show_chars: (text, delay) => {
    stopAnim();
    const s = String(text);
    let i = 0;
    setLeds(charLeds(s[0]));
    anim = setInterval(() => {
      i++;
      if (i >= s.length) { stopAnim(); return; }
      setLeds(charLeds(s[i]));
    }, delay);
    return s.length * delay;
  },
  char: ch => { stopAnim(); setLeds(charLeds(String(ch))); },
  tone: (f, ms) => { toneStop(); toneStart(f, 0, ms); playingUntil = ms > 0 ? performance.now() + ms : Infinity; },
  tone_stop: () => toneStop(),
  tune: (notes, tickMs, loop) => playSeq(parseTune(notes, tickMs), loop),
  sfx: name => playSfx(name),
  playing: () => performance.now() < playingUntil,
  volume: v => { S.volume = Math.max(0, Math.min(255, v)); },
  speaker: on => { S.speaker = !!on; if (!on) toneStop(); },
  pin_out: (k, kind, v) => { S.out[k] = kind === 'D' ? String(v) : 'PWM ' + v; draw(); },
  radio_group: g => { S.group = g; },
  radio_send: m => { S.radioLog.push('送信 → ' + m); draw(); },
  radio_recv: () => (S.radioIn.length ? S.radioIn.shift() : null),
};

// ---------------------------------------------------------------- Skulpt へ渡すモジュール
const BRIDGE_JS = `var $builtinmodule = function(name) {
  var mod = {};
  var api = window.PycoMicrobitSim._api;
  function toPy(v) {
    if (v === null || v === undefined) return Sk.builtin.none.none$;
    return Sk.ffi.remapToPy(v);
  }
  Object.keys(api).forEach(function(k) {
    mod[k] = new Sk.builtin.func(function() {
      var a = Array.prototype.map.call(arguments, function(x) { return Sk.ffi.remapToJs(x); });
      return toPy(api[k].apply(null, a));
    });
  });
  return mod;
};`;

const ICON_LINES = Object.keys(ICONS).map(k => `Image.${k} = Image('${ICONS[k]}')`).join('\n');

const MICROBIT_PY = `
import time as _time
import math as _math
import _mbsim as _s

# 長い待ちも 50ms ずつに分ける。待ちの途中でも停止ボタンが効くように
def sleep(ms):
    while ms > 0:
        _time.sleep(min(ms, 50) / 1000)
        ms -= 50

def running_time():
    return _s.now()

def temperature():
    return int(_s.read('temp'))

def set_volume(v):
    _s.volume(int(v))

def reset():
    raise SystemExit('reset')

def panic(n=0):
    raise SystemExit('panic ' + str(n))

def scale(value, from_, to):
    r = (value - from_[0]) * (to[1] - to[0]) / (from_[1] - from_[0]) + to[0]
    if isinstance(to[0], int) and isinstance(to[1], int):
        return int(round(r))
    return r

def _check(x, y):
    if not (0 <= x < 5 and 0 <= y < 5):
        raise ValueError('index out of bounds')

class Image:
    def __init__(self, *args):
        if len(args) == 0:
            self._w = 5
            self._h = 5
            self._p = [0] * 25
        elif isinstance(args[0], str):
            rows = [r for r in args[0].split(':') if r != '']
            self._h = len(rows)
            self._w = max([len(r) for r in rows]) if rows else 0
            self._p = []
            for r in rows:
                for x in range(self._w):
                    self._p.append(int(r[x]) if x < len(r) else 0)
        else:
            self._w = args[0]
            self._h = args[1] if len(args) > 1 else 5
            self._p = [0] * (self._w * self._h)
            if len(args) > 2:
                for i in range(min(len(args[2]), len(self._p))):
                    self._p[i] = args[2][i]
    def width(self):
        return self._w
    def height(self):
        return self._h
    def get_pixel(self, x, y):
        return self._p[y * self._w + x]
    def set_pixel(self, x, y, v):
        self._p[y * self._w + x] = v
    def copy(self):
        im = Image(self._w, self._h)
        im._p = list(self._p)
        return im
    def invert(self):
        im = self.copy()
        im._p = [9 - v for v in self._p]
        return im
    def _leds(self):
        s = ''
        for y in range(5):
            for x in range(5):
                s += str(self._p[y * self._w + x]) if (x < self._w and y < self._h) else '0'
        return s
    def __repr__(self):
        rows = []
        for y in range(self._h):
            rows.append(''.join([str(v) for v in self._p[y * self._w:(y + 1) * self._w]]))
        return "Image('" + ':'.join(rows) + ":')"

${ICON_LINES}
Image.ALL_ARROWS = [Image.ARROW_N, Image.ARROW_NE, Image.ARROW_E, Image.ARROW_SE,
                    Image.ARROW_S, Image.ARROW_SW, Image.ARROW_W, Image.ARROW_NW]

class _Display:
    def show(self, x, delay=400, wait=True, loop=False, clear=False):
        if isinstance(x, Image):
            _s.leds(x._leds())
        elif isinstance(x, (list, tuple)):
            for im in x:
                self.show(im)
                sleep(delay)
        else:
            s = str(x)
            if len(s) == 1:
                _s.char(s)
            elif len(s) > 1:
                ms = _s.show_chars(s, delay)
                if wait:
                    sleep(ms)
        if clear:
            sleep(delay)
            self.clear()
    def scroll(self, text, delay=150, wait=True, loop=False, monospace=False):
        ms = _s.scroll(str(text), delay, loop)
        if wait and not loop:
            sleep(ms)
    def clear(self):
        _s.leds('0' * 25)
    def set_pixel(self, x, y, v):
        _check(x, y)
        _s.pixel(x, y, int(v))
    def get_pixel(self, x, y):
        _check(x, y)
        return _s.get_pixel(x, y)
    def on(self):
        _s.display_on(True)
    def off(self):
        _s.display_on(False)
    def is_on(self):
        return _s.is_on()
    def read_light_level(self):
        return int(_s.read('light'))

display = _Display()

class _Button:
    def __init__(self, k):
        self._k = k
    def is_pressed(self):
        return _s.read(self._k)
    def was_pressed(self):
        return _s.take(self._k)
    def get_presses(self):
        return _s.presses(self._k)

button_a = _Button('a')
button_b = _Button('b')

class _Accelerometer:
    def get_x(self):
        return int(_s.read('ax'))
    def get_y(self):
        return int(_s.read('ay'))
    def get_z(self):
        return int(_s.read('az'))
    def get_values(self):
        return (self.get_x(), self.get_y(), self.get_z())
    def get_strength(self):
        x, y, z = self.get_values()
        return int(_math.sqrt(x * x + y * y + z * z))
    def current_gesture(self):
        return _s.gesture()
    def is_gesture(self, name):
        return _s.gesture() == name
    def was_gesture(self, name):
        return _s.take('g:' + name)
    def get_gestures(self):
        return tuple(_s.gestures())
    def set_range(self, value):
        pass

accelerometer = _Accelerometer()

class _Compass:
    def heading(self):
        return int(_s.read('heading'))
    def calibrate(self):
        pass
    def is_calibrated(self):
        return True
    def clear_calibration(self):
        pass
    def get_x(self):
        return int(30000 * _math.sin(_math.radians(self.heading())))
    def get_y(self):
        return int(30000 * _math.cos(_math.radians(self.heading())))
    def get_z(self):
        return -40000
    def get_field_strength(self):
        return 50000

compass = _Compass()

class SoundEvent:
    LOUD = 'loud'
    QUIET = 'quiet'

class _Microphone:
    def sound_level(self):
        return int(_s.read('sound'))
    def was_event(self, event):
        return _s.take(event)
    def is_event(self, event):
        return _s.sound_now() == event
    def current_event(self):
        return _s.sound_now()
    def get_events(self):
        return ()
    def set_threshold(self, event, value):
        _s.threshold(event, int(value))

microphone = _Microphone()

class Sound:
    GIGGLE = 'giggle'
    HAPPY = 'happy'
    HELLO = 'hello'
    MYSTERIOUS = 'mysterious'
    SAD = 'sad'
    SLIDE = 'slide'
    SOARING = 'soaring'
    SPRING = 'spring'
    TWINKLE = 'twinkle'
    YAWN = 'yawn'

class _Audio:
    def play(self, source, wait=True, pin=None, return_pin=None):
        ms = _s.sfx(str(source))
        if wait:
            sleep(ms)
    def stop(self):
        _s.tone_stop()
    def is_playing(self):
        return _s.playing()

audio = _Audio()

class _Speaker:
    def __init__(self):
        self._on = True
    def on(self):
        self._on = True
        _s.speaker(True)
    def off(self):
        self._on = False
        _s.speaker(False)
    def is_on(self):
        return self._on

speaker = _Speaker()

class _Pin:
    PULL_UP = 0
    PULL_DOWN = 1
    NO_PULL = 2
    RESISTIVE = 0
    CAPACITIVE = 1
    def __init__(self, k):
        self._k = k
        self._period = 20000
    def read_digital(self):
        return 1 if _s.read(self._k) else 0
    def write_digital(self, value):
        _s.pin_out(self._k, 'D', int(value))
    def read_analog(self):
        return 1023 if _s.read(self._k) else 0
    def write_analog(self, value):
        _s.pin_out(self._k, 'A', int(value))
    def set_analog_period(self, period):
        self._period = period * 1000
    def set_analog_period_microseconds(self, period):
        self._period = period
    def get_analog_period_microseconds(self):
        return self._period
    def is_touched(self):
        return _s.read(self._k)
    def set_touch_mode(self, value):
        pass
    def set_pull(self, value):
        pass
    def get_pull(self):
        return 2
    def get_mode(self):
        return 'unused'

pin0 = _Pin('p0')
pin1 = _Pin('p1')
pin2 = _Pin('p2')
pin3 = _Pin('p3')
pin4 = _Pin('p4')
pin5 = _Pin('p5')
pin6 = _Pin('p6')
pin7 = _Pin('p7')
pin8 = _Pin('p8')
pin9 = _Pin('p9')
pin10 = _Pin('p10')
pin11 = _Pin('p11')
pin12 = _Pin('p12')
pin13 = _Pin('p13')
pin14 = _Pin('p14')
pin15 = _Pin('p15')
pin16 = _Pin('p16')
pin19 = _Pin('p19')
pin20 = _Pin('p20')
pin_logo = _Pin('logo')
pin_speaker = _Pin('speaker')
`;

// メロディは実機の曲を短くした代わりの音
const MUSIC_PY = `
from microbit import sleep as _sleep
import _mbsim as _s

_tempo = [4, 120]

def set_tempo(ticks=4, bpm=120):
    _tempo[0] = ticks
    _tempo[1] = bpm

def get_tempo():
    return (_tempo[0], _tempo[1])

def reset():
    set_tempo()

def play(music, pin=None, wait=True, loop=False):
    if isinstance(music, str):
        music = [music]
    ms = _s.tune(list(music), 60000 / _tempo[1] / _tempo[0], loop)
    if wait and not loop:
        _sleep(ms)

def pitch(frequency, duration=-1, pin=None, wait=True):
    _s.tone(int(frequency), int(duration))
    if wait and duration > 0:
        _sleep(duration)

def stop(pin=None):
    _s.tone_stop()

DADADADUM = ('r4:2', 'g', 'g', 'g', 'eb:8', 'r:2', 'f', 'f', 'f', 'd:8')
ENTERTAINER = ('d4:1', 'd#', 'e', 'c5:2', 'e4:1', 'c5:2', 'e4:1', 'c5:3', 'c:1', 'd', 'd#', 'e', 'c', 'd', 'e:2', 'b4:1', 'd5:2', 'c:4')
PRELUDE = ('c4:1', 'e', 'g', 'c5', 'e', 'g4', 'c5', 'e', 'c4', 'e', 'g', 'c5', 'e', 'g4', 'c5', 'e')
ODE = ('e4', 'e', 'f', 'g', 'g', 'f', 'e', 'd', 'c', 'c', 'd', 'e', 'e:6', 'd:2', 'd:8')
NYAN = ('f#5:2', 'g#', 'c#:1', 'd#:2', 'b4:1', 'd5:1', 'c#', 'b4:2', 'b', 'c#5', 'd', 'd:1', 'c#', 'b4:1', 'c#5:1', 'd#', 'f#', 'g#', 'd#', 'f#', 'c#', 'd', 'b4', 'c#5', 'b4')
RINGTONE = ('c4:1', 'd', 'e:2', 'g', 'd:1', 'e', 'f:2', 'a', 'e:1', 'f', 'g:2', 'b', 'c5:4')
FUNK = ('c2:2', 'c', 'd#', 'c:1', 'f:2', 'c:1', 'f:2', 'f#', 'g', 'c', 'c', 'g', 'c:1', 'f#:2', 'c:1', 'f#:2', 'f', 'd#')
BLUES = ('c2:2', 'e', 'g', 'a', 'a#', 'a', 'g', 'e', 'f', 'a', 'c3', 'd', 'd#', 'd', 'c', 'a2', 'g', 'b', 'd3', 'f', 'c2:2', 'e', 'g', 'e')
BIRTHDAY = ('c4:3', 'c:1', 'd:4', 'c:4', 'f', 'e:8', 'c:3', 'c:1', 'd:4', 'c:4', 'g', 'f:8')
WEDDING = ('c4:4', 'f:3', 'f:1', 'f:8', 'c:4', 'g:3', 'e:1', 'f:8')
FUNERAL = ('c3:4', 'c:3', 'c:1', 'c:4', 'd#:3', 'd:1', 'd:3', 'c:1', 'c:3', 'b2:1', 'c3:4')
PUNCHLINE = ('c4:3', 'g3:1', 'f#', 'g', 'g#:3', 'g', 'r', 'b', 'c4')
PYTHON = ('d5:1', 'b4', 'r', 'b', 'b', 'a#', 'b', 'g5', 'r', 'd', 'd', 'r', 'b4', 'c5', 'r', 'c', 'c', 'r', 'd')
BADDY = ('c3:3', 'r', 'd:2', 'd#', 'r', 'c', 'r', 'f#:8')
CHASE = ('a4:1', 'b', 'c5', 'b4', 'a:2', 'r', 'a:1', 'b', 'c5', 'b4', 'a:2', 'r', 'a:2', 'e5', 'd#', 'e', 'f', 'e', 'd#', 'e')
BA_DING = ('b5:1', 'e6:3')
WAWAWAWAA = ('e3:3', 'r:1', 'd#:3', 'r:1', 'd:4', 'r:1', 'c#:8')
JUMP_UP = ('c5:1', 'd', 'e', 'f', 'g')
JUMP_DOWN = ('g5:1', 'f', 'e', 'd', 'c')
POWER_UP = ('g4:1', 'c5', 'e', 'g:2', 'e:1', 'g:3')
POWER_DOWN = ('g5:1', 'd#', 'c', 'g4:2', 'b:1', 'c5:3')
`;

const RADIO_PY = `
import _mbsim as _s

_state = {'on': False}
RATE_1MBIT = 1
RATE_2MBIT = 2

def on():
    _state['on'] = True

def off():
    _state['on'] = False

def config(**kwargs):
    if 'group' in kwargs:
        _s.radio_group(kwargs['group'])

def reset():
    pass

def send(message):
    if not _state['on']:
        raise ValueError('radio is not enabled')
    _s.radio_send(str(message))

def receive():
    if not _state['on']:
        raise ValueError('radio is not enabled')
    return _s.radio_recv()

def send_bytes(message):
    send(str(message))

def receive_bytes():
    return receive()

def receive_full():
    m = receive()
    if m is None:
        return None
    return (m, -50, 0)
`;

const UTIME_PY = `
from microbit import sleep as _sleep
import _mbsim as _s

def sleep(s):
    _sleep(s * 1000)

def sleep_ms(ms):
    _sleep(ms)

def sleep_us(us):
    _sleep(us / 1000)

def ticks_ms():
    return _s.now()

def ticks_us():
    return _s.now() * 1000

def ticks_add(t, d):
    return t + d

def ticks_diff(a, b):
    return a - b
`;

const MACHINE_PY = `
import _mbsim as _s

def time_pulse_us(pin, level, timeout_us=1000000):
    return -1

def reset():
    raise SystemExit('reset')

def freq():
    return 64000000
`;

function installIntoSkulpt(Sk) {
  if (!Sk.builtinFiles) Sk.builtinFiles = { files: {} };
  const f = Sk.builtinFiles.files;
  f['src/lib/_mbsim.js'] = BRIDGE_JS;
  f['src/lib/microbit.py'] = MICROBIT_PY;
  f['src/lib/music.py'] = MUSIC_PY;
  f['src/lib/radio.py'] = RADIO_PY;
  f['src/lib/utime.py'] = UTIME_PY;
  f['src/lib/machine.py'] = MACHINE_PY;
}

// ---------------------------------------------------------------- 画面
// ボードの絵は MakeCode の sim/visuals/microbit.ts（MIT License, Copyright (c) Microsoft Corporation）の
// 形・座標・色をそのまま写した（viewBox 500×408、v1 の外形・ロゴ・ボタン・端子・LED・センサーの部品）。
const TH = {
  accent: '#3AFFB3', display: '#111', pin: '#D4AF37', pinTouched: '#FFA500', pinActive: '#FF5500',
  ledOn: '#ff7f7f', ledOff: '#202020', buttonOuter: '#979797', buttonUp: '#111', buttonDown: '#FFA500',
  virtualButtonOuter: '#333', virtualButtonUp: '#fff', lightLevelOn: 'yellow', lightLevelOff: '#555',
};
const PIN_PATHS = {   // P0 / P1 / P2 / 3V / GND（タッチできる大きな端子）
  p0: 'M16.5,341.2c0,0.4-0.1,0.9-0.1,1.3v60.7c4.1,1.7,8.6,2.7,12.9,2.7h34.4v-64.7c0,0,0-0.1,0-0.1c0-13-10.6-23.6-23.7-23.6C27.2,317.6,16.5,328.1,16.5,341.2z M21.2,341.6c0-10.7,8.7-19.3,19.3-19.3c10.7,0,19.3,8.7,19.3,19.3c0,10.7-8.6,19.3-19.3,19.3C29.9,360.9,21.2,352.2,21.2,341.6z',
  p1: 'M139.1,317.3c-12.8,0-22.1,10.3-23.1,23.1V406h46.2v-65.6C162.2,327.7,151.9,317.3,139.1,317.3zM139.3,360.1c-10.7,0-19.3-8.6-19.3-19.3c0-10.7,8.6-19.3,19.3-19.3c10.7,0,19.3,8.7,19.3,19.3C158.6,351.5,150,360.1,139.3,360.1z',
  p2: 'M249,317.3c-12.8,0-22.1,10.3-23.1,23.1V406h46.2v-65.6C272.1,327.7,261.8,317.3,249,317.3z M249.4,360.1c-10.7,0-19.3-8.6-19.3-19.3c0-10.7,8.6-19.3,19.3-19.3c10.7,0,19.3,8.7,19.3,19.3C268.7,351.5,260.1,360.1,249.4,360.1z',
  v3: 'M359.9,317.3c-12.8,0-22.1,10.3-23.1,23.1V406H383v-65.6C383,327.7,372.7,317.3,359.9,317.3z M360,360.1c-10.7,0-19.3-8.6-19.3-19.3c0-10.7,8.6-19.3,19.3-19.3c10.7,0,19.3,8.7,19.3,19.3C379.3,351.5,370.7,360.1,360,360.1z',
  gnd: 'M458,317.6c-13,0-23.6,10.6-23.6,23.6c0,0,0,0.1,0,0.1h0V406H469c4.3,0,8.4-1,12.6-2.7v-60.7c0-0.4,0-0.9,0-1.3C481.6,328.1,471,317.6,458,317.6z M457.8,360.9c-10.7,0-19.3-8.6-19.3-19.3c0-10.7,8.6-19.3,19.3-19.3c10.7,0,19.3,8.7,19.3,19.3C477.1,352.2,468.4,360.9,457.8,360.9z',
};
const PIN_HOLE = { p0: [40.5, 341.6], p1: [139.3, 340.8], p2: [249.4, 340.8] };
const PIN_LABELS = [
  'M35.7,376.4c0-2.8,2.1-5.1,5.5-5.1c3.3,0,5.5,2.4,5.5,5.1v4.7c0,2.8-2.2,5.1-5.5,5.1c-3.3,0-5.5-2.4-5.5-5.1V376.4zM43.3,376.4c0-1.3-0.8-2.3-2.2-2.3c-1.3,0-2.1,1.1-2.1,2.3v4.7c0,1.2,0.8,2.3,2.1,2.3c1.3,0,2.2-1.1,2.2-2.3V376.4z',
  'M136.2,374.1c2.8,0,3.4-0.8,3.4-2.5h2.9v14.3h-3.4v-9.5h-3V374.1z',
  'M248.6,378.5c1.7-1,3-1.7,3-3.1c0-1.1-0.7-1.6-1.6-1.6c-1,0-1.8,0.6-1.8,2.1h-3.3c0-2.6,1.8-4.6,5.1-4.6c2.6,0,4.9,1.3,4.9,4.3c0,2.4-2.3,3.9-3.8,4.7c-2,1.3-2.5,1.8-2.5,2.9h6.1v2.7h-10C244.8,381.2,246.4,379.9,248.6,378.5z',
  'M352.1,381.1c0,1.6,0.9,2.5,2.2,2.5c1.2,0,1.9-0.9,1.9-1.9c0-1.2-0.6-2-2.1-2h-1.3v-2.6h1.3c1.5,0,1.9-0.7,1.9-1.8c0-1.1-0.7-1.6-1.6-1.6c-1.4,0-1.8,0.8-1.8,2.1h-3.3c0-2.4,1.5-4.6,5.1-4.6c2.6,0,5,1.3,5,4c0,1.6-1,2.8-2.1,3.2c1.3,0.5,2.3,1.6,2.3,3.5c0,2.7-2.4,4.3-5.2,4.3c-3.5,0-5.5-2.1-5.5-5.1H352.1z',
  'M368.5,385.9h-3.1l-5.1-14.3h3.5l3.1,10.1l3.1-10.1h3.6L368.5,385.9z',
  'M444.4,378.3h7.4v2.5h-1.5c-0.6,3.3-3,5.5-7.1,5.5c-4.8,0-7.5-3.5-7.5-7.5c0-3.9,2.8-7.5,7.5-7.5c3.8,0,6.4,2.3,6.6,5h-3.5c-0.2-1.1-1.4-2.2-3.1-2.2c-2.7,0-4.1,2.3-4.1,4.7c0,2.5,1.4,4.7,4.4,4.7c2,0,3.2-1.2,3.4-2.7h-2.5V378.3z',
  'M461.4,380.9v-9.3h3.3v14.3h-3.5l-5.2-9.2v9.2h-3.3v-14.3h3.5L461.4,380.9z',
  'M472.7,371.6c4.8,0,7.5,3.5,7.5,7.2s-2.7,7.2-7.5,7.2h-5.3v-14.3H472.7z M470.8,374.4v8.6h1.8c2.7,0,4.2-2.1,4.2-4.3s-1.6-4.3-4.2-4.3H470.8z',
];
const SMALL_PIN_XS = [66.7, 79.1, 91.4, 103.7, 164.3, 176.6, 188.9, 201.3, 213.6, 275.2, 287.5, 299.8, 312.1, 324.5, 385.1, 397.4, 409.7, 422];

function grad(id, c1, c2, v) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="${v}" stop-color="${c1}"/><stop offset="${v}" stop-color="${c2}"/></linearGradient>`;
}

function boardSvg() {
  const btn = (k, left, top, label, outer) => {
    const w = 56.2, n = 10;
    const nuts = k === 'ab' ? '' : [[n, n], [n, w - n], [w - n, w - n], [w - n, n]]
      .map(([x, y]) => `<circle class="mbs-nut" cx="${left + x}" cy="${top + y}" r="6"/>`).join('');
    return `<g class="mbs-btn" data-k="${k}" role="button" aria-label="${label}"><title>${label}</title>` +
      // 見えない当たり判定（見た目より 4 ずつ広い）。スマホで 44px 以上になるように
      `<rect class="mbs-btn-hit" x="${left - 4}" y="${top - 4}" width="${w + 8}" height="${w + 8}" fill="transparent"/>` +
      `<rect class="mbs-btn-outer" x="${left}" y="${top}" rx="4" ry="4" width="${w}" height="${w}" fill="${outer}"/>${nuts}`;
  };
  let leds = '';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const x = j * 46 + 154, y = i * 44 + 113;
    leds += `<rect x="${x}" y="${y}" width="10" height="20" rx="2" ry="2" fill="${TH.ledOff}"/>` +
      `<rect class="mbs-led" x="${x - 2}" y="${y - 2}" width="14" height="24" rx="3" ry="3" fill="${TH.ledOn}" filter="url(#mbs-ledglow)" style="opacity:0"/>`;
  }
  const pin = (k, title) => `<path class="mbs-pin" data-k="${k}" fill="url(#mbs-g-${k})" d="${PIN_PATHS[k]}"><title>${title}</title></path>`;
  return `
<svg class="mbs-svg" viewBox="0 0 500 408" xmlns="http://www.w3.org/2000/svg" role="application" aria-label="micro:bit">
  <defs>
    <filter id="mbs-ledglow" x="-75%" y="-75%" width="300%" height="300%">
      <feMorphology operator="dilate" radius="4" in="SourceAlpha" result="thicken"/>
      <feGaussianBlur stdDeviation="5" in="thicken" result="blurred"/>
      <feFlood flood-color="rgb(255, 17, 77)" result="glowColor"/>
      <feComposite in="glowColor" in2="blurred" operator="in" result="ledglow_colored"/>
      <feMerge><feMergeNode in="ledglow_colored"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${['p0', 'p1', 'p2', 'v3', 'gnd'].map(k => grad('mbs-g-' + k, TH.pin, TH.pinActive, '100%')).join('')}
    ${grad('mbs-g-small', TH.pin, TH.pinActive, '100%')}
    ${grad('mbs-g-light', TH.lightLevelOn, TH.lightLevelOff, '50%')}
    ${grad('mbs-g-temp', TH.ledOff, TH.ledOn, '50%')}
    ${grad('mbs-g-sound', TH.ledOff, TH.ledOn, '50%')}
  </defs>
  <path fill="#111" d="M498,31.9C498,14.3,483.7,0,466.1,0H31.9C14.3,0,0,14.3,0,31.9v342.2C0,391.7,14.3,406,31.9,406h434.2c17.6,0,31.9-14.3,31.9-31.9V31.9z M14.3,206.7c-2.7,0-4.8-2.2-4.8-4.8c0-2.7,2.2-4.8,4.8-4.8c2.7,0,4.8,2.2,4.8,4.8C19.2,204.6,17,206.7,14.3,206.7z M486.2,206.7c-2.7,0-4.8-2.2-4.8-4.8c0-2.7,2.2-4.8,4.8-4.8c2.7,0,4.8,2.2,4.8,4.8C491,204.6,488.8,206.7,486.2,206.7z"/>
  <path fill="${TH.display}" d="M333.8,310.3H165.9c-8.3,0-15-6.7-15-15V127.5c0-8.3,6.7-15,15-15h167.8c8.3,0,15,6.7,15,15v167.8C348.8,303.6,342.1,310.3,333.8,310.3z"/>
  <g fill="${TH.accent}">
    <polygon points="115,56.7 173.1,0 115,0"/>
    <path d="M114.2,0H25.9C12.1,2.1,0,13.3,0,27.7v83.9L114.2,0z"/>
    <polygon points="173,27.9 202.5,0 173,0"/>
    <polygon points="54.1,242.4 54.1,274.1 22.4,274.1"/>
    <polygon points="446.2,164.6 446.2,132.8 477.9,132.8"/>
  </g>
  ${leds}
  <circle class="mbs-w mbs-w-light" data-w="light" cx="50" cy="50" r="35" fill="url(#mbs-g-light)"><title>明るさ（上下にドラッグ）</title></circle>
  <text class="mbs-t mbs-w" data-w="light" data-t="light" x="85" y="80"></text>
  <g class="mbs-head" data-k="logo" role="button" aria-label="ロゴ"><title>ロゴ（押している間タッチ）</title>
    <ellipse cx="251" cy="75" rx="75" ry="35" fill="transparent"/>
    <path class="mbs-head-bg" fill="${TH.buttonUp}" d="M 269.9 50.2 L 269.9 50.2 l -39.5 0 v 0 c -14.1 0.1 -24.6 10.7 -24.6 24.8 c 0 13.9 10.4 24.4 24.3 24.7 v 0 h 39.6 c 14.2 0 24.8 -10.6 24.8 -24.7 C 294.5 61 284 50.3 269.9 50.2 M 269.7 89.2"/>
    <g fill="${TH.accent}">
      <path d="M269.9,50.2L269.9,50.2l-39.5,0v0c-14.1,0.1-24.6,10.7-24.6,24.8c0,13.9,10.4,24.4,24.3,24.7v0h39.6c14.2,0,24.8-10.6,24.8-24.7C294.5,61,284,50.3,269.9,50.2 M269.7,89.2L269.7,89.2l-39.3,0c-7.7-0.1-14-6.4-14-14.2c0-7.8,6.4-14.2,14.2-14.2h39.1c7.8,0,14.2,6.4,14.2,14.2C283.9,82.9,277.5,89.2,269.7,89.2"/>
      <path d="M230.6,69.7c-2.9,0-5.3,2.4-5.3,5.3c0,2.9,2.4,5.3,5.3,5.3c2.9,0,5.3-2.4,5.3-5.3C235.9,72.1,233.5,69.7,230.6,69.7"/>
      <path d="M269.7,80.3c2.9,0,5.3-2.4,5.3-5.3c0-2.9-2.4-5.3-5.3-5.3c-2.9,0-5.3,2.4-5.3,5.3C264.4,77.9,266.8,80.3,269.7,80.3"/>
    </g>
  </g>
  <rect class="mbs-w mbs-bar" data-w="temp" x="120" y="110" width="20" height="160" rx="5" ry="5" fill="url(#mbs-g-temp)"><title>温度（上下にドラッグ）</title></rect>
  <text class="mbs-t mbs-w" data-w="temp" data-t="temp" x="58" y="130"></text>
  <rect class="mbs-w mbs-bar" data-w="sound" x="360" y="110" width="20" height="160" rx="5" ry="5" fill="url(#mbs-g-sound)"><title>まわりの音（上下にドラッグ）</title></rect>
  <text class="mbs-t mbs-w" data-w="sound" data-t="sound" x="370" y="90"></text>
  <g class="mbs-w mbs-shake" data-w="acc" role="button" aria-label="ゆさぶる"><title>ゆさぶる</title>
    <circle cx="404" cy="115" r="12" fill="${TH.virtualButtonUp}"/>
    <text class="mbs-ts" x="420" y="122">SHAKE</text>
  </g>
  ${btn('a', 25.9, 176.4, 'ボタン A', TH.buttonOuter)}<path class="mbs-cap" fill="${TH.buttonUp}" d="M69.7,203.5c0,8.7-7,15.7-15.7,15.7s-15.7-7-15.7-15.7c0-8.7,7-15.7,15.7-15.7S69.7,194.9,69.7,203.5"/></g>
  ${btn('b', 418.1, 176.4, 'ボタン B', TH.buttonOuter)}<path class="mbs-cap" fill="${TH.buttonUp}" d="M461.9,203.5c0,8.7-7,15.7-15.7,15.7c-8.7,0-15.7-7-15.7-15.7c0-8.7,7-15.7,15.7-15.7C454.9,187.8,461.9,194.9,461.9,203.5"/></g>
  ${btn('ab', 417, 250, 'A と B を同時に押す', TH.virtualButtonOuter)}<circle class="mbs-cap" cx="446" cy="278" r="16.5" fill="${TH.virtualButtonUp}"/></g>
  <text class="mbs-t mbs-abt" x="370" y="272">A+B</text>
  <path fill="#000" pointer-events="none" d="M48.1,270.9l-0.6-1.7h-5.1l-0.6,1.7h-3.5l5.1-14.3h3.1l5.2,14.3H48.1z M45,260.7l-1.8,5.9h3.5L45,260.7z"/>
  <path fill="#000" pointer-events="none" d="M449.1,135.8h5.9c3.9,0,4.7,2.4,4.7,3.9c0,1.8-1.4,2.9-2.5,3.2c0.9,0,2.6,1.1,2.6,3.3c0,1.5-0.8,4-4.7,4h-6V135.8zM454.4,141.7c1.6,0,2-1,2-1.7c0-0.6-0.3-1.7-2-1.7h-2v3.4H454.4z M452.4,144.1v3.5h2.1c1.6,0,2-1,2-1.8c0-0.7-0.4-1.8-2-1.8H452.4z"/>
  <path fill="url(#mbs-g-small)" d="M0,357.7v19.2c0,10.8,6.2,20.2,14.4,25.2v-44.4H0z"/>
  ${SMALL_PIN_XS.map(x => `<rect x="${x}" y="356.7" width="10" height="50" fill="url(#mbs-g-small)"/>`).join('')}
  <path fill="url(#mbs-g-small)" d="M483.6,402c8.2-5,14.4-14.4,14.4-25.1v-19.2h-14.4V402z"/>
  ${pin('p0', 'P0（押している間タッチ）')}${pin('p1', 'P1（押している間タッチ）')}${pin('p2', 'P2（押している間タッチ）')}${pin('v3', '3V')}${pin('gnd', 'GND')}
  ${['p0', 'p1', 'p2'].map(k => `<text class="mbs-tp" data-t="${k}" x="${PIN_HOLE[k][0]}" y="${PIN_HOLE[k][1] + 7}"></text>`).join('')}
  <g fill="#000" pointer-events="none">${PIN_LABELS.map(d => `<path d="${d}"/>`).join('')}</g>
</svg>`;
}

const CSS = `
/* 操作パネルはアプリの色・書体に合わせる（黒テーマでは暗い面）。ボードの絵（SVG）は MakeCode のまま。
   色は css/style.css の変数（--bg-panel など）を使うので、白テーマにも自動で追従する。 */
#mb-sim { display:flex; gap:12px; padding:8px 12px; overflow:auto; box-sizing:border-box; flex:1 1 0; min-height:0;
  background:var(--bg-panel, #f3f3f3); color:var(--text-primary, #323130);
  font:13px/1.45 var(--font-mono, "Segoe UI", sans-serif); }
#mb-sim *, #mb-sim *::before, #mb-sim *::after { box-sizing:border-box; }
#mb-sim button, #mb-sim input, #mb-sim select { font:inherit; }
#mb-sim button:focus-visible, #mb-sim input:focus-visible, #mb-sim select:focus-visible { outline:2px solid var(--accent-cyan, #3454D1); outline-offset:1px; }
.mbs-board { flex:0 1 auto; display:flex; align-items:center; justify-content:center; height:100%; min-height:180px;
  aspect-ratio:500 / 408; max-width:34%; min-width:160px; }
.mbs-svg { display:block; width:100%; height:100%; overflow:visible; touch-action:none; transform-origin:50% 50%; user-select:none; -webkit-user-select:none; }
.mbs-svg .mbs-btn, .mbs-svg .mbs-head, .mbs-svg .mbs-shake, .mbs-svg .mbs-pin[data-k^=p], .mbs-svg .mbs-w { cursor:pointer; }
/* ボタンの当たり判定を見た目より広げる（透明な縁）。A と A+B の間は 18 しか空いていないので縁は 16 まで */
.mbs-svg .mbs-btn-outer { stroke:rgba(0,0,0,0); stroke-width:16px; }
.mbs-svg .mbs-btn-outer:hover { stroke:grey; stroke-width:3px; }
.mbs-svg .mbs-nut { fill:#704A4A; pointer-events:none; }
.mbs-svg .mbs-cap { pointer-events:none; }
.mbs-svg .mbs-pin[data-k^=p]:hover { stroke:#D4AF37; stroke-width:2px; }
.mbs-svg .mbs-pin.on { stroke:darkorange; stroke-width:5px; }
.mbs-svg .mbs-led { transform-box:fill-box; transform-origin:50% 50%; pointer-events:none; }
.mbs-svg .mbs-bar { stroke:#aaa; stroke-width:3px; }
.mbs-svg .mbs-w-light { stroke:#fff; stroke-width:3px; }
.mbs-svg .mbs-w { visibility:hidden; }
.mbs-svg.use-light [data-w=light], .mbs-svg.use-temp [data-w=temp], .mbs-svg.use-sound [data-w=sound], .mbs-svg.use-acc [data-w=acc] { visibility:visible; }
.mbs-svg .mbs-t, .mbs-svg .mbs-ts, .mbs-svg .mbs-tp { font-family:"Lucida Console", Monaco, monospace; fill:#fff; pointer-events:none; }
.mbs-svg .mbs-t { font-size:25px; }
.mbs-svg .mbs-abt { font-size:22px; }
.mbs-svg.use-sound .mbs-abt { font-size:20px; transform:translate(18px, 2px); }
.mbs-svg .mbs-ts, .mbs-svg .mbs-tp { font-size:20px; }
.mbs-svg .mbs-tp { text-anchor:middle; }
/* 操作の列：幅があれば 2 列に並べて、温度・音・方角が下に隠れないようにする。
   それでも入りきらないときは、上下の影でスクロールできることを示す。 */
.mbs-ctl { flex:1 1 240px; min-width:200px; display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));
  align-content:start; gap:8px; align-self:stretch; overflow:auto; padding-right:2px;
  background:
    linear-gradient(var(--bg-panel, #f3f3f3) 30%, rgba(0,0,0,0)) top / 100% 24px local no-repeat,
    linear-gradient(rgba(0,0,0,0), var(--bg-panel, #f3f3f3) 70%) bottom / 100% 24px local no-repeat,
    linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,0)) top / 100% 10px scroll no-repeat,
    linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.35)) bottom / 100% 10px scroll no-repeat; }
/* 黒テーマでは黒い影が見えないので、スクロールの影を明るい色にする */
:root:not([data-theme="light"]) .mbs-ctl { background:
    linear-gradient(var(--bg-panel) 30%, rgba(0,0,0,0)) top / 100% 24px local no-repeat,
    linear-gradient(rgba(0,0,0,0), var(--bg-panel) 70%) bottom / 100% 24px local no-repeat,
    linear-gradient(rgba(0,212,255,.28), rgba(0,212,255,0)) top / 100% 10px scroll no-repeat,
    linear-gradient(rgba(0,212,255,0), rgba(0,212,255,.28)) bottom / 100% 10px scroll no-repeat; }
body.mobile-mode .mbs-ctl { background:none !important; }
.mbs-run, .mbs-out, .mbs-note { grid-column:1 / -1; }
.mbs-run { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.mbs-run button { white-space:nowrap; min-height:32px; padding:0 14px; border:1px solid; font-weight:700; cursor:pointer;
  clip-path:polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px); }
.mbs-run .run { background:var(--accent-green, #3454D1); border-color:var(--accent-green, #3454D1); color:#04140a; }
:root[data-theme="light"] .mbs-run .run { color:#fff; }
.mbs-run .run:hover:not(:disabled) { filter:brightness(1.12); }
.mbs-run .stop { background:transparent; border-color:#ff6060; color:#ff6060; }
:root[data-theme="light"] .mbs-run .stop { border-color:#b42318; color:#b42318; }
.mbs-run .stop:hover:not(:disabled) { background:rgba(255,96,96,.12); }
/* 押せないときは、白テーマの色指定より強くして「点線の枠＋灰色」にそろえる（ツールバーと同じ見え方） */
.mbs-run button:disabled, :root[data-theme="light"] .mbs-run button.run:disabled, :root[data-theme="light"] .mbs-run button.stop:disabled {
  background:transparent; border:1px dashed var(--text-dim, #605e5c); color:var(--text-dim, #605e5c); cursor:not-allowed; filter:none; font-weight:normal; }
.mbs-card { background:transparent; border:1px solid var(--border-dim, #e0e0e0); border-radius:0; padding:6px 10px; display:grid;
  grid-template-columns:repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap:2px 12px; align-content:start; }
.mbs-card h4 { grid-column:1 / -1; margin:0 0 2px; font-size:12px; font-weight:700; color:var(--accent-cyan, #605e5c); letter-spacing:.02em; }
.mbs-card label { display:flex; align-items:center; gap:8px; white-space:nowrap; min-height:24px; }
.mbs-card label span { width:5.4em; flex:0 1 auto; overflow:hidden; text-overflow:ellipsis; color:var(--text-primary, #323130); }
.mbs-card label b { width:3em; text-align:right; font-weight:700; font-variant-numeric:tabular-nums; color:var(--accent-cyan, #3454D1); }
.mbs-card input[type=range] { flex:1; min-width:44px; accent-color:var(--accent-cyan, #3454D1); height:18px; margin:0; }
.mbs-card label.mbs-chk { white-space:normal; }
.mbs-card label.mbs-chk span { width:auto; }
.mbs-card input[type=checkbox] { accent-color:var(--accent-cyan, #3454D1); margin:0; }
.mbs-row { grid-column:1 / -1; display:flex; gap:6px; align-items:center; min-width:0; }
.mbs-row select, .mbs-row input[type=text] { flex:1; min-width:0; height:30px; background:var(--bg-surface, #fff); color:var(--text-primary, #323130);
  border:1px solid var(--border-dim, #c8c6c4); border-radius:0; padding:0 6px; }
.mbs-row select:focus, .mbs-row input[type=text]:focus { outline:none; border-color:var(--accent-cyan, #3454D1); }
.mbs-row button { white-space:nowrap; min-height:30px; padding:0 10px; border:1px solid var(--accent-cyan, #c8c6c4); background:transparent; color:var(--accent-cyan, #323130); cursor:pointer; }
.mbs-row button:hover { background:rgba(0,212,255,.12); }
.mbs-row button:active { background:var(--accent-amber, #FFA500); color:#171004; }
.mbs-radio { grid-column:1 / -1; white-space:pre; font-family:Consolas, "Lucida Console", monospace; color:var(--text-dim, #605e5c); min-height:0; }
.mbs-radio:empty, .mbs-out:empty { display:none; }
.mbs-out { font-family:Consolas, "Lucida Console", monospace; color:var(--text-primary, #323130); background:var(--bg-surface, #fff); border:1px solid var(--border-dim, #e0e0e0);
  padding:4px 10px; }
.mbs-note { color:var(--text-dim, #8a8886); font-size:12px; }
/* スマホ表示：ボードを上に大きく、操作はその下に。右下の「▶ 実行」と重ならないよう下に余白。 */
body.mobile-mode #mb-sim { flex-direction:column; padding-bottom:76px; }
body.mobile-mode .mbs-board { max-width:none; width:100%; height:auto; min-height:0; flex:0 0 auto; }
body.mobile-mode .mbs-ctl { overflow:visible; flex:0 0 auto; background:none; }
body.mobile-mode .mbs-svg .mbs-btn-outer { stroke-width:16px; }
body.mobile-mode .mbs-card label { min-height:40px; }
body.mobile-mode .mbs-card input[type=range] { height:28px; }
body.mobile-mode .mbs-run button, body.mobile-mode .mbs-row button, body.mobile-mode .mbs-row select, body.mobile-mode .mbs-row input[type=text] { min-height:44px; }
`;

const GESTURE_UI = [
  ['ゆさぶる','shake'],['ロゴを上に','up'],['ロゴを下に','down'],['画面を上に','face up'],
  ['画面を下に','face down'],['左に傾ける','left'],['右に傾ける','right'],['落とす','freefall'],
  ['3G','3g'],['6G','6g'],['8G','8g'],
];

function slider(name, key, min, max, step) {
  return `<label><span>${name}</span><input type="range" data-s="${key}" min="${min}" max="${max}" step="${step || 1}" value="${S[key]}"><b data-v="${key}">${S[key]}</b></label>`;
}

function hold(el, on, off) {
  const down = e => { e.preventDefault(); el.setPointerCapture && el.setPointerCapture(e.pointerId); on(); el.classList.add('on'); draw(); };
  const up = () => { if (el.classList.contains('on')) { el.classList.remove('on'); off(); draw(); } };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}

function press(k) { S.btn[k] = true; S.presses[k]++; flag(k); }

// センサーの値を変える（スライダー・ボード上の部品・マウスの傾きから共通で呼ぶ）
// 音の大小と動き（ジェスチャー）の出来事はここで立てる
function setSensors(vals) {
  const before = S.sound;
  const g0 = currentGesture();
  Object.keys(vals).forEach(k => { S[k] = vals[k]; });
  if ('sound' in vals) {
    if (before < S.th.loud && S.sound >= S.th.loud) flag('loud');
    if (before > S.th.quiet && S.sound <= S.th.quiet) flag('quiet');
  }
  const g1 = currentGesture();
  if (g1 && g1 !== g0) { flag('g:' + g1); S.gestureLog.push(g1); }
  syncSensors();
}

function syncSensors() {
  if (!ui) return;
  ui.sliders.forEach(el => {
    const k = el.dataset.s;
    if (Number(el.value) !== S[k]) el.value = S[k];
    ui.vals[k].textContent = S[k];
  });
  const pct = (v, lo, hi) => Math.max(0, Math.min(100, Math.floor((v - lo) / (hi - lo) * 100)));
  ui.gLight.forEach(s => s.setAttribute('offset', pct(S.light, 0, 255) + '%'));
  ui.gTemp.forEach(s => s.setAttribute('offset', (100 - pct(S.temp, -10, 50)) + '%'));
  ui.gSound.forEach(s => s.setAttribute('offset', (100 - pct(S.sound, 0, 255)) + '%'));
  ui.texts.light.textContent = S.light;
  ui.texts.temp.textContent = S.temp + '°C';
  ui.texts.sound.textContent = S.sound;
  const af = 8 / 1024;
  const s = 1 - Math.min(0.1, Math.pow(Math.max(Math.abs(S.ax), Math.abs(S.ay)) / 1024, 2) / 35);
  ui.tilt.style.transform = (S.ax || S.ay)
    ? `perspective(${Math.max(600, ui.svg.clientWidth * 2)}px) rotateX(${-S.ay * af}deg) rotateY(${S.ax * af}deg) scale(${s})` : '';
}

// プログラムが読んだセンサーだけボードの上に部品を出す（MakeCode と同じ）
const USE_OF = { light: 'light', temp: 'temp', sound: 'sound', ax: 'acc', ay: 'acc', az: 'acc' };
function markUse(w) {
  if (!ui || !w || ui.used.has(w)) return;
  ui.used.add(w);
  ui.svg.classList.add('use-' + w);
}
function hookUse() {
  const read = api.read, take = api.take;
  api.read = k => { markUse(USE_OF[k]); return read(k); };
  api.take = k => {
    if (String(k).startsWith('g:')) markUse('acc');
    else if (k === 'loud' || k === 'quiet') markUse('sound');
    return take(k);
  };
  ['gesture', 'gestures'].forEach(n => { const f = api[n]; api[n] = (...a) => { markUse('acc'); return f(...a); }; });
  const sn = api.sound_now; api.sound_now = () => { markUse('sound'); return sn(); };
}

function svgPoint(svg, e) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

function dragWidget(svg, el, f) {
  const move = e => setSensors(f(svgPoint(svg, e)));
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); el.setPointerCapture && el.setPointerCapture(e.pointerId); move(e);
    const mv = ev => move(ev);
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
}

// 加速度を使うプログラムのときは、ボードの上でマウスを動かすと傾く。外へ出ると水平に戻る。
// 戻すのはマウスで傾けたときだけ。スライダーで決めた値は、マウスが通り抜けても消さない
function attachTilt(box, svg) {
  let decay = 0, byMouse = false;
  document.addEventListener('input', e => {
    if (e.target.closest && e.target.closest('#mb-sim') && /^a[xyz]$/.test(e.target.dataset.s || '')) byMouse = false;
  });
  const on = () => ui.used.has('acc') && ui.tiltBox.checked;
  box.addEventListener('pointermove', e => {
    // ボタン・端子・ロゴ・センサー部品の上では傾きを止める（傾いて的がずれないように）
    if (!on() || e.buttons || e.target.closest('.mbs-btn, .mbs-head, .mbs-pin, .mbs-w')) return;
    if (decay) { cancelAnimationFrame(decay); decay = 0; }
    const r = box.getBoundingClientRect();
    const ax = (e.clientX - r.left - r.width / 2) / (r.width / 3);
    const ay = (e.clientY - r.top - r.height / 2) / (r.height / 3);
    const x = Math.max(-1024, Math.min(1024, Math.round(ax * 1024)));
    const y = Math.max(-1024, Math.min(1024, Math.round(ay * 1024)));
    const z2 = 1024 * 1024 - x * x - y * y;
    byMouse = true;
    setSensors({ ax: x, ay: y, az: Math.round((z2 > 0 ? -1 : 1) * Math.sqrt(Math.abs(z2))) });
  });
  box.addEventListener('pointerleave', () => {
    if (!on() || decay || !byMouse) return;
    byMouse = false;
    const step = () => {
      let x = Math.trunc(S.ax * 0.85), y = Math.trunc(S.ay * 0.85);
      if (Math.abs(x) <= 24 && Math.abs(y) <= 24) { decay = 0; setSensors({ ax: 0, ay: 0, az: -1024 }); return; }
      setSensors({ ax: x, ay: y, az: -Math.round(Math.sqrt(Math.max(0, 1024 * 1024 - x * x - y * y))) });
      decay = requestAnimationFrame(step);
    };
    decay = requestAnimationFrame(step);
  });
}

function doGesture(g) {
  if (g === 'shake') S.shakeUntil = performance.now() + 600;
  flag('g:' + g);
  S.gestureLog.push(g);
}

function mount(root, opts) {
  if (!root || ui) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  root.innerHTML = `
    <div class="mbs-board">${boardSvg()}</div>
    <div class="mbs-ctl">
      <!-- 実行・停止はツールバー（スマホは右下の［▶ 実行］）の 1 組に任せ、ここは隠す。
           同じ働きのボタンが 2 組あると目が 2 か所に分かれ、名前も違って別の働きに見えたため。
           テストや外から呼べるよう、ボタン自体は残す -->
      <div class="mbs-run" style="display:none">
        <button class="run">▶ 実行（シミュレータ）</button><button class="stop" disabled>■ シミュレータを止める</button>
      </div>
      <div class="mbs-card">
        <h4>傾き（加速度）</h4>
        ${slider('x（mg）', 'ax', -2048, 2048, 8)}
        ${slider('y（mg）', 'ay', -2048, 2048, 8)}
        ${slider('z（mg）', 'az', -2048, 2048, 8)}
        <label class="mbs-chk"><input type="checkbox" class="tilt" checked><span>ボードの上でマウスを動かして傾ける</span></label>
        <div class="mbs-row"><select class="g">${GESTURE_UI.map(g => `<option value="${g[1]}">${g[0]}</option>`).join('')}</select><button class="g-go">動かす</button></div>
      </div>
      <div class="mbs-card">
        <h4>まわりのようす</h4>
        ${slider('明るさ', 'light', 0, 255)}
        ${slider('温度（℃）', 'temp', -10, 50)}
        ${slider('まわりの音', 'sound', 0, 255)}
        ${slider('方角（°）', 'heading', 0, 359)}
        <div class="mbs-row"><button class="loud">大きな音を出す</button></div>
      </div>
      <div class="mbs-card">
        <h4>無線</h4>
        <div class="mbs-row"><input type="text" class="rin" placeholder="無線で届く文字（例：12）" aria-label="無線で受け取るメッセージ（受信させる文字）"><button class="rgo">受信させる</button></div>
        <div class="mbs-radio"></div>
      </div>
      <div class="mbs-out"></div>
      <div class="mbs-note">音と無線は実機と少し違います</div>
    </div>`;

  const svg = root.querySelector('.mbs-svg');
  const q = s => Array.from(svg.querySelectorAll(s));
  ui = {
    svg, used: new Set(),
    tilt: svg,
    leds: q('.mbs-led'),
    caps: { a: svg.querySelector('[data-k=a] .mbs-cap'), b: svg.querySelector('[data-k=b] .mbs-cap'), ab: svg.querySelector('[data-k=ab] .mbs-cap') },
    headBg: svg.querySelector('.mbs-head-bg'),
    pins: { p0: svg.querySelector('.mbs-pin[data-k=p0]'), p1: svg.querySelector('.mbs-pin[data-k=p1]'), p2: svg.querySelector('.mbs-pin[data-k=p2]') },
    pinStops: { p0: q('#mbs-g-p0 stop'), p1: q('#mbs-g-p1 stop'), p2: q('#mbs-g-p2 stop') },
    pinTexts: { p0: svg.querySelector('[data-t=p0]'), p1: svg.querySelector('[data-t=p1]'), p2: svg.querySelector('[data-t=p2]') },
    gLight: q('#mbs-g-light stop'), gTemp: q('#mbs-g-temp stop'), gSound: q('#mbs-g-sound stop'),
    texts: { light: svg.querySelector('[data-t=light]'), temp: svg.querySelector('[data-t=temp]'), sound: svg.querySelector('[data-t=sound]') },
    sliders: Array.from(root.querySelectorAll('input[type=range]')),
    vals: {},
    tiltBox: root.querySelector('.tilt'),
    out: root.querySelector('.mbs-out'),
    radio: root.querySelector('.mbs-radio'),
    run: root.querySelector('.mbs-run .run'),
    stop: root.querySelector('.mbs-run .stop'),
  };
  ui.sliders.forEach(el => { ui.vals[el.dataset.s] = root.querySelector(`[data-v="${el.dataset.s}"]`); });
  hookUse();

  // ボタン・ロゴ・端子（押している間だけ）
  svg.querySelectorAll('.mbs-btn').forEach(el => {
    const k = el.dataset.k;
    if (k === 'ab') hold(el, () => { press('a'); press('b'); }, () => { S.btn.a = false; S.btn.b = false; });
    else hold(el, () => press(k), () => { S.btn[k] = false; });
  });
  Object.keys(ui.pins).forEach(k => hold(ui.pins[k], () => { S.pins[k] = true; }, () => { S.pins[k] = false; }));
  hold(svg.querySelector('.mbs-head'), () => { S.logo = true; }, () => { S.logo = false; });

  // ボード上のセンサー部品（MakeCode と同じ動かし方）
  dragWidget(svg, svg.querySelector('circle[data-w=light]'),
    p => ({ light: Math.max(0, Math.min(255, Math.floor((p.y - (50 - 17.5)) / 35 * 255))) }));
  dragWidget(svg, svg.querySelector('rect[data-w=temp]'),
    p => ({ temp: Math.floor(-10 + Math.max(0, Math.min(1, (260 - p.y) / 140)) * 60) }));
  dragWidget(svg, svg.querySelector('rect[data-w=sound]'),
    p => ({ sound: Math.floor(Math.max(0, Math.min(1, (260 - p.y) / 140)) * 255) }));
  const shake = svg.querySelector('.mbs-shake');
  const shakeDot = shake.querySelector('circle');
  shake.addEventListener('pointerdown', e => { e.preventDefault(); shakeDot.setAttribute('fill', TH.buttonDown); });
  shake.addEventListener('pointerleave', () => shakeDot.setAttribute('fill', TH.virtualButtonUp));
  shake.addEventListener('pointerup', () => { shakeDot.setAttribute('fill', TH.virtualButtonUp); doGesture('shake'); });
  attachTilt(root.querySelector('.mbs-board'), svg);

  ui.sliders.forEach(el => el.addEventListener('input', () => setSensors({ [el.dataset.s]: Number(el.value) })));

  root.querySelector('.g-go').addEventListener('click', () => doGesture(root.querySelector('.g').value));
  root.querySelector('.loud').addEventListener('click', () => {
    const keep = S.sound;
    S.sound = 255; syncSensors(); flag('loud');
    setTimeout(() => { S.sound = keep; syncSensors(); if (keep <= S.th.quiet) flag('quiet'); }, 400);
  });
  const rin = root.querySelector('.rin');
  const deliver = () => {
    if (!rin.value) return;
    S.radioIn.push(rin.value);
    S.radioLog.push('受信 ← ' + rin.value);
    rin.value = '';
    draw();
  };
  root.querySelector('.rgo').addEventListener('click', deliver);
  rin.addEventListener('keydown', e => { if (e.key === 'Enter') deliver(); });

  ui.run.addEventListener('click', () => { ctx(); opts.run(); });
  ui.stop.addEventListener('click', () => opts.stop());
  syncSensors();
  draw();
}

// 実行の前に、前回の表示・音・たまった出来事を消す（センサーのスライダーはそのまま）
function reset() {
  stopAnim(); toneStop();
  S.leds.fill(0); S.on = true; S.flags.clear(); S.gestureLog = []; S.presses = { a: 0, b: 0 };
  S.out = {}; S.radioIn = []; S.radioLog = []; S.t0 = performance.now(); S.volume = 128; S.speaker = true;
  S.th = { loud: 128, quiet: 64 };
  if (ui) { ui.used.forEach(w => ui.svg.classList.remove('use-' + w)); ui.used.clear(); }
  draw();
}

function halt() { stopAnim(); toneStop(); }

function setRunning(running) {
  if (!ui) return;
  ui.run.disabled = running;
  ui.run.textContent = running ? '実行中…' : '▶ 実行（シミュレータ）';
  ui.stop.disabled = !running;
}

// unlockAudio：音を鳴らす準備。ブラウザは押した瞬間（ユーザー操作の中）に作った音しか鳴らさないので、
// ツールバーの［▶ 実行］から動かすときも、押した処理の中でこれを呼ぶ
window.PycoMicrobitSim = { mount, installIntoSkulpt, reset, halt, setRunning, unlockAudio: ctx, _api: api, _state: S };
})();
