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

wokwi-pi-pico は本バンドル(v1.9.2)に存在しないため、Pico は
circuit_viewer_bb.js 側の自作 SVG（実機準拠ピン配列）で描画する。

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

# 抽出対象（フェーズ1）。attrs は pinInfo/見た目に影響するものだけ指定。
TARGETS = [
    {"tag": "wokwi-led", "attrs": {"color": "red", "flip": ""}},
    {"tag": "wokwi-resistor", "attrs": {"value": "330"}},
    {"tag": "wokwi-pushbutton", "attrs": {"color": "green"}},
]

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
      const svg = el.shadowRoot.querySelector('svg');
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

    header = (
        "// このファイルは tools/extract_wokwi_parts.py が生成したものです。\n"
        "// 直接編集しないでください。再生成: python3 tools/extract_wokwi_parts.py\n"
        "// 部品アート: @wokwi/elements v1.9.2 (MIT) の shadow SVG を抽出。\n"
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
