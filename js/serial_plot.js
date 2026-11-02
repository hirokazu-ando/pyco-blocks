// ===== シリアルモニタのグラフ（センサーモニター） =====
// シリアルモニタに出た行から数を拾って折れ線グラフにする。実機（WebSerial）でも
// micro:bit シミュレータでも、print した値がそのまま線になる。
//
// 拾う書き方は 2 つ：
//   名前:数値 … 「x:12」「加速度x:-20 明るさ:30」のように名前つき（MakeCode の
//               「シリアル通信 名前と数値を書き出す」と同じ形）。名前ごとに 1 本の線
//   数値だけ … 「12」「(1, 2, 3)」「1,2,3」。左から 1・2・3 … の線（Mu エディタと同じ）
// 凡例を押すと、その線を出したり消したりできる（値の大きさが違う線を見比べるとき用）。

(() => {
const MAX = 300;   // 線 1 本に残す点の数
// 線の色は色覚に配慮した Okabe-Ito の配色。黒い背景用と白い背景用を分けて持つ（白では明るい色が見えないため）。
// 5 本目からは破線・点線も使い、色だけに頼らず見分けられるようにする。
const COLORS_DARK  = ['#56B4E9', '#E69F00', '#009E73', '#F0E442', '#CC79A7', '#FF7F3F', '#4C9BE8', '#CCCCCC'];
const COLORS_LIGHT = ['#0072B2', '#D55E00', '#007A5A', '#8A6D00', '#A8457E', '#000000', '#3A8FC4', '#7A5200'];
const DASHES = [[], [], [], [], [7, 4], [2, 3], [7, 3, 2, 3], [10, 4]];
function lineStyle(s) {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  const pal = light ? COLORS_LIGHT : COLORS_DARK;
  return { c: pal[s.idx % pal.length], d: DASHES[s.idx % DASHES.length] };
}

let series = new Map();   // 名前 → { data: [], idx（線の番号＝色と線種）, hidden }
let partial = '';         // まだ改行が来ていない行の続き
let root = null, canvas = null, legend = null, fitBox = null, dirty = false;
// 線ごとに最小〜最大を 0〜1 にそろえて描くか。加速度（-1024〜1024）と明るさ（0〜255）のように
// 大きさがちがう線を同じ縦軸に描くと、小さい方が平らに見えて動きが分からないため。
let fit = false;

const PAIR = /([^\s:,=()'"]+)\s*[:=]\s*(-?\d+(?:\.\d+)?)/g;
const ONLY_NUMS = /^\s*\(?\s*-?\d+(?:\.\d+)?(?:\s*[,\s]\s*-?\d+(?:\.\d+)?)*\s*\)?\s*$/;

function add(name, v) {
  let s = series.get(name);
  if (!s) {
    s = { data: [], idx: series.size, hidden: false };
    series.set(name, s);
  }
  s.data.push(v);
  if (s.data.length > MAX) s.data.shift();
  dirty = true;
}

function parseLine(line) {
  let m, hit = false;
  PAIR.lastIndex = 0;
  while ((m = PAIR.exec(line))) { add(m[1], Number(m[2])); hit = true; }
  if (hit) return;
  if (ONLY_NUMS.test(line)) {
    line.replace(/[()]/g, ' ').trim().split(/[\s,]+/).forEach((t, i) => add(String(i + 1), Number(t)));
  }
}

function feed(text) {
  const lines = (partial + String(text).replace(/\r/g, '')).split('\n');
  partial = lines.pop();
  if (partial.length > 500) partial = '';
  lines.forEach(parseLine);
  if (dirty && root && !root.hidden) requestAnimationFrame(draw);
}

function reset() {
  series = new Map();
  partial = '';
  dirty = true;
  if (root && !root.hidden) draw();
}

function draw() {
  if (!dirty || !canvas) return;
  dirty = false;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);

  const shown = Array.from(series.values()).filter(s => !s.hidden && s.data.length);
  let lo = Infinity, hi = -Infinity;
  // そろえる表示：線ごとの最小・最大で 0〜1 に直してから描く（凡例の数は元の値のまま）
  const norm = s => {
    if (!fit) return v => v;
    let a = Infinity, b = -Infinity;
    s.data.forEach(v => { if (v < a) a = v; if (v > b) b = v; });
    return b === a ? () => 0.5 : v => (v - a) / (b - a);
  };
  if (fit && shown.length) { lo = 0; hi = 1; }
  else shown.forEach(s => s.data.forEach(v => { if (v < lo) lo = v; if (v > hi) hi = v; }));
  if (!shown.length) {
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim() || '#718096'; g.font = '12px sans-serif';
    g.fillText('print した数がここに線で出ます（例：x:12 や 12, 34）', 10, 20);
  } else {
    if (hi === lo) { hi += 1; lo -= 1; }
    // そろえる表示は 0〜100% をそのまま目盛りにする（余白を足すと -8% のような半端な目盛りになる）
    const pad = fit ? 0.03 : (hi - lo) * 0.08; hi += pad; lo -= pad;
    const L = 46, T = 6, R = 8, B = 6;
    const Y = v => T + (hi - v) * (h - T - B) / (hi - lo);
    // 目盛り
    // 目盛りの字は 12px、色はテーマの --text-dim（白テーマでも読める濃さ）
    g.font = '12px monospace'; g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim() || '#718096';
    g.strokeStyle = 'rgba(160,174,192,0.18)'; g.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = lo + (hi - lo) * i / 4, y = Y(v);
      g.beginPath(); g.moveTo(L, y); g.lineTo(w - R, y); g.stroke();
      // 目盛りは幅が 10 以上なら整数に丸める（-17.54 のような半端な数は読みにくい）。そろえる表示では % で出す
      g.fillText(fit ? Math.round(Math.min(1, Math.max(0, v)) * 100) + '%' : (hi - lo >= 10 ? String(Math.round(v)) : fmt(v)), 2, y + 3);
    }
    // 点が少ないうちは横いっぱいに広げ、MAX 点を超えたら右から左へ流す
    const span = Math.max(60, ...shown.map(s => s.data.length)) - 1;
    shown.forEach(s => {
      const n = norm(s);
      g.beginPath();
      s.data.forEach((v0, i) => {
        const v = n(v0);
        const x = L + (w - L - R) * (i + span + 1 - s.data.length) / span;
        i ? g.lineTo(x, Y(v)) : g.moveTo(x, Y(v));
      });
      const st = lineStyle(s);
      g.strokeStyle = st.c; g.setLineDash(st.d); g.lineWidth = 2; g.stroke(); g.setLineDash([]);
    });
  }
  // 凡例（押すと出す・消す）
  legend.innerHTML = '';
  series.forEach((s, name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sp-item' + (s.hidden ? ' off' : '');
    const st = lineStyle(s);
    b.innerHTML = st.d.length
      ? `<i style="background:repeating-linear-gradient(90deg,${st.c} 0 ${st.d[0]}px,transparent ${st.d[0]}px ${st.d[0] + st.d[1]}px);width:18px"></i>`
      : `<i style="background:${st.c}"></i>`;
    b.appendChild(document.createTextNode(`${name} ${fmt(s.data[s.data.length - 1])}`));
    b.title = '押すと線を出す・消す';
    b.addEventListener('click', () => { s.hidden = !s.hidden; dirty = true; draw(); });
    legend.appendChild(b);
  });
  // 「縦軸を線ごとにそろえる」は線が 2 本以上のときだけ意味がある
  if (fitBox) fitBox.style.display = series.size > 1 ? 'flex' : 'none';
}

function fmt(v) {
  if (v === undefined) return '';
  return Math.abs(v) >= 100 || Number.isInteger(v) ? String(Math.round(v)) : v.toFixed(2);
}

// グラフを出している間は、文字の欄を小さくしてグラフに高さを回す（以前は高さ約 70px で線の動きが読めなかった）。
// 末尾にあった min-height:0 が 110px を打ち消していたので外した。
const CSS = `
#serial-plot { flex:3 1 0; min-height:110px; display:flex; flex-direction:column; border-top:1px solid #2d3748; background:#0d1117; }
#monitor-panel:has(#serial-plot:not([hidden])) #monitor-output { flex:1 1 0; min-height:44px; }
#serial-plot[hidden] { display:none; }
#serial-plot canvas { flex:1 1 0; width:100%; min-height:0; display:block; }
#serial-plot .sp-legend { display:flex; flex-wrap:wrap; gap:4px 10px; padding:3px 8px; font-size:11px; }
#serial-plot .sp-item { display:flex; align-items:center; gap:4px; background:none; border:0; color:#cbd5e0; cursor:pointer; padding:0; font:inherit; font-family:monospace; }
#serial-plot .sp-item.off { opacity:.35; text-decoration:line-through; }
#serial-plot .sp-item i { width:14px; height:3px; display:inline-block; }
[data-theme="light"] #serial-plot { background:#fbfaf7; border-top-color:#e2e8f0; }
[data-theme="light"] #serial-plot .sp-item { color:#2d3748; }
`;

// panel：グラフを入れる #monitor-panel、after：この要素の直後に置く、button：表示切り替えボタン
function mount(panel, after, button) {
  if (root || !panel) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  root = document.createElement('div');
  root.id = 'serial-plot';
  root.hidden = true;
  root.innerHTML = '<canvas></canvas><div class="sp-legend"></div>';
  after.insertAdjacentElement('afterend', root);
  canvas = root.querySelector('canvas');
  legend = root.querySelector('.sp-legend');
  // 「縦軸を線ごとにそろえる」はチェックボックスにする。押しボタンでは、今そうなっているのか、
  // 押すとそうなるのかが分からなかった。凡例は値が届くたびに作り直すので、その外に 1 回だけ作る
  // （中に置くと作り直しのたびにフォーカスが外れる）
  fitBox = document.createElement('label');
  fitBox.className = 'sp-fit';
  fitBox.style.cssText = 'display:none;align-items:center;gap:6px;padding:3px 8px;font-size:12px;cursor:pointer;';
  fitBox.title = '値の大きさがちがう線（加速度と明るさなど）を、それぞれ最小〜最大でそろえて動きを見比べます';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = fit;
  cb.addEventListener('change', () => { fit = cb.checked; dirty = true; draw(); });
  fitBox.appendChild(cb);
  fitBox.appendChild(document.createTextNode('縦軸を線ごとにそろえる（0〜100%）'));
  root.appendChild(fitBox);
  if (button) button.addEventListener('click', () => show(root.hidden));
  window.addEventListener('resize', () => { dirty = true; if (!root.hidden) draw(); });
}

function show(on) {
  if (!root) return;
  root.hidden = !on;
  if (on) { dirty = true; requestAnimationFrame(draw); }
}

window.PycoPlot = { feed, reset, mount, show, _series: () => series };
})();
