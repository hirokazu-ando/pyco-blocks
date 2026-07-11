# -*- coding: utf-8 -*-
"""wokwi-elements（vendored）を実レンダリングして SVG＋pinInfo を抽出し、
   js/circuit_parts_data.js（window.PYCO_CIRCUIT_PARTS）を生成する。

ブレッドボード型実態配線図レンダラ（circuit_viewer_bb.js）が file:// でも
動くように、部品アート（shadow root の SVG 文字列）とピン座標を JS に焼き込む。
lessons/*.json → *.js と同じ「ビルド時抽出」方式。

  - 入力: /home/ando/freecad_pipeline/lib/wokwi-elements/dist/wokwi-elements.bundle.min.js
  - 出力: js/circuit_parts_data.js
      window.PYCO_CIRCUIT_PARTS = {
        "wokwi-led": { "w":.., "h":.., "inner":"<svg innerHTML>",
                       "pins": { "A": {"x":.., "y":..}, ... } },
        ...
      };

wokwi-pi-pico は本バンドル(v1.9.2)に存在しないため、Pico は本スクリプトの
build_pico() が自作SVG（外部アート非依存・ライセンス安全・実機準拠ピン配列）を
合成して焼き込む。

使い方:
    python3 tools/extract_wokwi_parts.py
"""
import json
import os
import tempfile
from pathlib import Path

LIB = Path("/home/ando/freecad_pipeline/lib/wokwi-elements")
BUNDLE = LIB / "dist" / "wokwi-elements.bundle.min.js"
OUT = Path(__file__).resolve().parent.parent / "js" / "circuit_parts_data.js"

# 抽出対象（フェーズ1+2）。attrs は pinInfo/見た目に影響するものだけ指定。
# LED は value="1"（点灯・グロー付き）で抽出する（dk05 品質基準に合わせる）。
# タクトスイッチは実寸の wokwi-pushbutton-6mm を採用（約2〜3列相当）。
TARGETS = [
    {"tag": "wokwi-led", "attrs": {"color": "red", "value": "1", "flip": ""}},
    {"tag": "wokwi-resistor", "attrs": {"value": "330"}},
    {"tag": "wokwi-pushbutton", "attrs": {"color": "green"}},
    {"tag": "wokwi-pushbutton-6mm", "attrs": {"color": "green"}},
    # ---- フェーズ2 ----
    {"tag": "wokwi-potentiometer", "attrs": {}},
    {"tag": "wokwi-photoresistor-sensor", "attrs": {}},
    {"tag": "wokwi-buzzer", "attrs": {}},
    {"tag": "wokwi-servo", "attrs": {"horn": "single"}},
    {"tag": "wokwi-hc-sr04", "attrs": {}},
    {"tag": "wokwi-dht22", "attrs": {}},
    {"tag": "wokwi-lcd1602", "attrs": {"pins": "i2c", "text": "Hello, Pico!"}},
    {"tag": "wokwi-7segment", "attrs": {"values": "[1,1,1,1,1,1,1,0]"}},
    {"tag": "wokwi-stepper-motor", "attrs": {"size": "28"}},
]

# Raspberry Pi Pico: 自作SVG（外部アート非依存・ライセンス安全）で合成する。
# ※ wokwi-elements バンドルには存在しない。寸法は公式機械仕様
#   （20.9×52.75mm 相当・2.54mmピッチ40ピン・castellated）を 96dpi で px 化。
#   ピン座標は実機正表と機械照合済み。board.svg 等の外部アートは一切使用しない。
MM2PX = 96 / 25.4

HTML = """<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body>
<script src="__BUNDLE__"></script>
<div id="stage"></div>
<script>
window.__RESULT__ = null;
window.__ERR__ = null;
(async () => {
  try {
    const targets = __TARGETS__;
    const out = {};
    const stage = document.getElementById('stage');
    const els = [];
    for (const t of targets) {
      const el = document.createElement(t.tag);
      for (const k in t.attrs) el.setAttribute(k, t.attrs[k]);
      stage.appendChild(el);
      els.push([el, t]);
      await customElements.whenDefined(t.tag);
    }
    // LitElement のレンダリング完了を確実に待つ（shadow SVG が空になる罠の回避）
    for (const [el] of els) { if (el.updateComplete) await el.updateComplete; }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (const [el, t] of els) {
      // shadow root に複数の svg を持つ部品（buzzer等）があるため最大面積のものを選ぶ
      let svg = null, best = -1;
      for (const s of el.shadowRoot.querySelectorAll('svg')) {
        const r = s.getBoundingClientRect();
        if (r.width * r.height > best) { best = r.width * r.height; svg = s; }
      }
      // shadow の adoptedStyleSheets（Lit css）でスタイル指定される text 等は
      // innerHTML 抽出でスタイルが失われる（例: potentiometer のピンラベルが
      // 既定 16px で巨大化）。計算済みスタイルを属性としてインライン化する。
      for (const tx of svg.querySelectorAll('text, tspan')) {
        const cs = getComputedStyle(tx);
        if (!tx.getAttribute('font-size')) tx.setAttribute('font-size', cs.fontSize);
        if (!tx.getAttribute('font-family')) tx.setAttribute('font-family', cs.fontFamily);
        if (!tx.getAttribute('font-weight') && cs.fontWeight !== '400')
          tx.setAttribute('font-weight', cs.fontWeight);
        if (!tx.getAttribute('fill')) tx.setAttribute('fill', cs.fill);
        if (!tx.getAttribute('text-anchor') && cs.textAnchor !== 'start')
          tx.setAttribute('text-anchor', cs.textAnchor);
      }
      // wokwi の pinInfo はレンダリング後の px 空間。inner は viewBox 単位なので、
      // 実レンダリング寸法(getBoundingClientRect)で viewBox→px 正規化して焼き込む。
      const rect = svg.getBoundingClientRect();
      const cssW = rect.width, cssH = rect.height;
      let minx = 0, miny = 0, vbw = cssW, vbh = cssH;
      const vb = svg.getAttribute('viewBox');
      if (vb) { const p = vb.trim().split(/\\s+/).map(Number); minx = p[0]; miny = p[1]; vbw = p[2]; vbh = p[3]; }
      const sx = cssW / vbw, sy = cssH / vbh;
      // inner を pin-px 空間へ写す <g> で包む（scale してから viewBox 原点を移動）
      const norm = '<g transform="scale(' + sx + ',' + sy + ') translate(' +
                   (-minx) + ',' + (-miny) + ')">' + svg.innerHTML + '</g>';
      const pins = {};
      for (const p of (el.pinInfo || [])) {
        pins[p.name] = { x: p.x, y: p.y, signals: (p.signals || []) };
      }
      out[t.tag] = { w: cssW, h: cssH, inner: norm, pins };
    }
    window.__RESULT__ = out;
  } catch (e) { window.__ERR__ = String(e) + '\\n' + (e.stack||''); }
})();
</script>
</body></html>"""


def build_pico():
    """Raspberry Pi Pico を自作SVGで合成する（外部アート非依存・ライセンス安全）。

    - 寸法: 公式機械仕様に基づく 20.9mm(幅) × 52.75mm(高さ) 相当を 96dpi で px 化。
      2.54mm ピッチ・片側20ピン・castellated パッド。
    - 座標系: 縦置き(USB を上端)のまま px。横置き(USB左)への回転はレンダラ側
      placePico が行う。
    - pins: 実機正表（左列 GP0→GP15 / 右列 VBUS→GP16）を 2.54mm ピッチで生成し、
      機械照合済みで焼き込む。座標はいずれも実機の機械寸法（=事実）。
    - アート: PCB(緑)・金の castellated パッド・USB・BOOTSEL・RP2040・取付穴4・
      シルク"Pico"＋ピン番号。ラズベリーロゴ等の商標は一切描かない。
    """
    w_px, h_px = 20.9 * MM2PX, 52.75 * MM2PX     # 79.0 x 199.4 px
    x_left, x_right = 1.6 * MM2PX, 19.3 * MM2PX   # castellated パッド列の中心
    y0, dy = 3.4 * MM2PX, 2.54 * MM2PX            # pin1 位置・2.54mm ピッチ

    # 実機正表（縦置き・上→下）。左列=GP0側 pin1..20 / 右列=VBUS側 pin40..21。
    left = ["GP0", "GP1", "GND.1", "GP2", "GP3", "GP4", "GP5", "GND.2",
            "GP6", "GP7", "GP8", "GP9", "GND.3", "GP10", "GP11", "GP12",
            "GP13", "GND.4", "GP14", "GP15"]
    right = ["VBUS", "VSYS", "GND.8", "3V3_EN", "3V3", "ADC_VREF", "GP28",
             "GND.7", "GP27", "GP26", "RUN", "GP22", "GND.6", "GP21", "GP20",
             "GP19", "GP18", "GND.5", "GP17", "GP16"]
    pins = {}
    for i, nm in enumerate(left):
        pins[nm] = {"x": x_left, "y": y0 + i * dy, "signals": []}
    for i, nm in enumerate(right):
        pins[nm] = {"x": x_right, "y": y0 + i * dy, "signals": []}

    return {"w": w_px, "h": h_px,
            "inner": _pico_art(w_px, h_px, x_left, x_right, y0, dy),
            "pins": pins}


def _pico_art(W, H, xL, xR, y0, dy):
    """縦置き(USB上端)の自作 Pico SVG を組み立てて返す（座標は px）。"""
    cx = W / 2.0
    s = []
    a = s.append

    # ---- defs: グラデーション ----
    a('<defs>')
    a('<linearGradient id="pcpcb" x1="0" y1="0" x2="1" y2="1">'
      '<stop offset="0" stop-color="#1ba15b"/>'
      '<stop offset="0.55" stop-color="#158a4a"/>'
      '<stop offset="1" stop-color="#0f7139"/></linearGradient>')
    a('<linearGradient id="pcpad" x1="0" y1="0" x2="0" y2="1">'
      '<stop offset="0" stop-color="#f2d98d"/>'
      '<stop offset="0.5" stop-color="#d8ac53"/>'
      '<stop offset="1" stop-color="#b58b37"/></linearGradient>')
    a('<linearGradient id="pcusb" x1="0" y1="0" x2="1" y2="0">'
      '<stop offset="0" stop-color="#9fa5ad"/>'
      '<stop offset="0.5" stop-color="#e6e9ee"/>'
      '<stop offset="1" stop-color="#a8aeb6"/></linearGradient>')
    a('<radialGradient id="pcchip" cx="0.34" cy="0.28" r="0.95">'
      '<stop offset="0" stop-color="#3b3e45"/>'
      '<stop offset="1" stop-color="#191b1f"/></radialGradient>')
    a('</defs>')

    # ---- PCB 本体（上端=USB側 y=0）----
    a(f'<rect x="0" y="0" width="{W:.2f}" height="{H:.2f}" rx="7" '
      f'fill="url(#pcpcb)" stroke="#0b5228" stroke-width="1.4"/>')
    a(f'<rect x="2.4" y="2.4" width="{W-4.8:.2f}" height="{H-4.8:.2f}" rx="5.5" '
      f'fill="none" stroke="#eaf6ee" stroke-opacity="0.22" stroke-width="0.8"/>')

    # ---- 金の castellated パッド（両側 20 個ずつ・端に半円ノッチ）----
    pw_l = xL + 3.0
    rx0 = xR - 3.0
    pw_r = W - rx0
    for i in range(20):
        y = y0 + i * dy
        # 左列（左端 x=0 に castellation）
        a(f'<rect x="0" y="{y-3.3:.2f}" width="{pw_l:.2f}" height="6.6" rx="1.3" '
          f'fill="url(#pcpad)" stroke="#946f28" stroke-width="0.4"/>')
        a(f'<rect x="1.4" y="{y-2.5:.2f}" width="{pw_l-2.4:.2f}" height="1.3" rx="0.6" '
          f'fill="#fbeec2" opacity="0.55"/>')
        a(f'<circle cx="0" cy="{y:.2f}" r="2.1" fill="#5a4a22"/>')
        # 右列（右端 x=W に castellation）
        a(f'<rect x="{rx0:.2f}" y="{y-3.3:.2f}" width="{pw_r:.2f}" height="6.6" rx="1.3" '
          f'fill="url(#pcpad)" stroke="#946f28" stroke-width="0.4"/>')
        a(f'<rect x="{rx0+1:.2f}" y="{y-2.5:.2f}" width="{pw_r-2.4:.2f}" height="1.3" rx="0.6" '
          f'fill="#fbeec2" opacity="0.55"/>')
        a(f'<circle cx="{W:.2f}" cy="{y:.2f}" r="2.1" fill="#5a4a22"/>')

    # ---- 取付穴 4（公式: 幅方向 11.4mm / 長手 47mm 間隔）----
    for hx in (4.8 * MM2PX, 16.1 * MM2PX):
        for hy in (2.0 * MM2PX, 49.0 * MM2PX):
            a(f'<circle cx="{hx:.2f}" cy="{hy:.2f}" r="4.1" '
              f'fill="#e7e2d3" stroke="#b3ac97" stroke-width="0.5"/>')
            a(f'<circle cx="{hx:.2f}" cy="{hy:.2f}" r="2.3" fill="#20232a"/>')

    # ---- USB micro-B（上端中央・盤外へオーバーハング）----
    a(f'<rect x="{cx-15:.2f}" y="-12.5" width="30" height="20" rx="2.4" '
      f'fill="url(#pcusb)" stroke="#7d828a" stroke-width="0.6"/>')
    a(f'<rect x="{cx-11:.2f}" y="-9" width="22" height="15" rx="1.6" '
      f'fill="#2b2f37"/>')
    a(f'<rect x="{cx-8:.2f}" y="-6.5" width="16" height="10" rx="1" '
      f'fill="#4a4f58"/>')

    # ---- BOOTSEL ボタン ----
    bx, by = cx + 12, 30
    a(f'<rect x="{bx-6:.2f}" y="{by-5:.2f}" width="12" height="10" rx="1.6" '
      f'fill="#cfd4da" stroke="#9aa0a8" stroke-width="0.5"/>')
    a(f'<rect x="{bx-4:.2f}" y="{by-3.2:.2f}" width="8" height="6.4" rx="1" fill="#eef1f4"/>')
    a(f'<text x="{cx-8:.2f}" y="{by+3:.2f}" font-family="sans-serif" font-size="4.4" '
      f'fill="#eaf6ee" fill-opacity="0.85" text-anchor="middle" '
      f'transform="rotate(90 {cx-8:.2f} {by:.2f})">BOOTSEL</text>')

    # ---- 小型 SMD 部品（レギュレータ・水晶など・雰囲気）----
    for sx0, sy0, sw, sh in ((cx-11, 46, 8, 6), (cx+3, 46, 7, 5),
                             (cx-12, 58, 6, 9), (cx+6, 60, 6, 6)):
        a(f'<rect x="{sx0:.2f}" y="{sy0:.2f}" width="{sw}" height="{sh}" rx="1" '
          f'fill="#20242b" stroke="#0c1116" stroke-width="0.4"/>')

    # ---- RP2040 チップ（中央）----
    ch = 7.0 * MM2PX
    chx, chy = cx - ch / 2, H * 0.42 - ch / 2
    a(f'<rect x="{chx:.2f}" y="{chy:.2f}" width="{ch:.2f}" height="{ch:.2f}" rx="1.6" '
      f'fill="url(#pcchip)" stroke="#0e0f12" stroke-width="0.6"/>')
    a(f'<circle cx="{chx+4:.2f}" cy="{chy+4:.2f}" r="1.2" fill="#0e0f12"/>')
    a(f'<text x="{cx:.2f}" y="{chy+ch/2+1.5:.2f}" font-family="sans-serif" font-size="4.6" '
      f'fill="#9a9fa8" text-anchor="middle" '
      f'transform="rotate(90 {cx:.2f} {chy+ch/2:.2f})">RP2040</text>')

    # ---- シルク "Pico"（下部・回転で最終は横書き）----
    ty = H * 0.76
    a(f'<text x="{cx:.2f}" y="{ty:.2f}" font-family="sans-serif" font-size="12" '
      f'font-weight="bold" fill="#eef7f0" text-anchor="middle" '
      f'transform="rotate(90 {cx:.2f} {ty:.2f})">Pico</text>')

    # ---- 角のピン番号（1 / 20 / 21 / 40）----
    for label, px, py in ((" 1", xL, y0), ("20", xL, y0 + 19 * dy),
                          ("40", xR, y0), ("21", xR, y0 + 19 * dy)):
        ax = px + (6.5 if px < W / 2 else -6.5)
        a(f'<text x="{ax:.2f}" y="{py:.2f}" font-family="sans-serif" font-size="4.6" '
          f'fill="#eaf6ee" fill-opacity="0.8" text-anchor="middle" '
          f'transform="rotate(90 {ax:.2f} {py:.2f})">{label.strip()}</text>')

    return "".join(s)


def main():
    from playwright.sync_api import sync_playwright
    html = (HTML.replace("__BUNDLE__", BUNDLE.as_uri())
                .replace("__TARGETS__", json.dumps(TARGETS)))
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False,
                                     encoding="utf-8") as f:
        f.write(html)
        tmp = f.name
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            page = b.new_page()
            page.goto(Path(tmp).as_uri())
            page.wait_for_function("window.__RESULT__ !== null || window.__ERR__ !== null",
                                   timeout=30000)
            err = page.evaluate("window.__ERR__")
            if err:
                raise RuntimeError("extract error: " + err)
            data = page.evaluate("window.__RESULT__")
            b.close()
    finally:
        os.unlink(tmp)

    data["pi-pico"] = build_pico()

    header = (
        "// このファイルは tools/extract_wokwi_parts.py が生成したものです。\n"
        "// 直接編集しないでください。再生成: python3 tools/extract_wokwi_parts.py\n"
        "// 部品アート: @wokwi/elements v1.9.2 (MIT) の shadow SVG を抽出。\n"
        "// pi-pico: 自作SVG（外部アート非依存・ライセンス安全・build_pico で合成）。\n"
    )
    body = "window.PYCO_CIRCUIT_PARTS = " + json.dumps(data, ensure_ascii=False) + ";\n"
    OUT.write_text(header + body, encoding="utf-8")

    # 抽出結果の要約（検証用に stdout へ）
    print("wrote", OUT)
    for tag, d in data.items():
        print(f"  {tag}: {d['w']}x{d['h']} pins=" +
              ", ".join(f"{n}({round(p['x'],1)},{round(p['y'],1)})"
                        for n, p in d["pins"].items()))


if __name__ == "__main__":
    main()
