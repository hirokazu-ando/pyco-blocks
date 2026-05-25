#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pycoblocks: workspace XML -> PNG via headless Chromium; optional LLM-generated XML.

Setup:
  cd Pycoblocks
  pip install -r tools/requirements-blockshot.txt
  playwright install chromium

Render existing XML:
  python tools/blockshot.py render samples/python-intro/intro_0-14_a_greet_noarg.xml out.png

LLM generates XML (OpenAI-compatible Chat Completions, OPENAI_API_KEY required):
  python tools/blockshot.py gen --prompt "print Hello" -o preview.xml

Generate then PNG:
  python tools/blockshot.py all --prompt "print Hello" -o demo.png --save-xml w.xml

CI (GitHub Actions, no local Python required):
  Repo: Actions -> "Blockshot PNG" -> Run workflow. Download "blockshot-png" artifact.

Env: OPENAI_API_KEY, OPENAI_API_BASE (default https://api.openai.com/v1), BLOCKSHOT_MODEL (gpt-4o-mini).
"""
from __future__ import annotations

import argparse
import functools
import json
import os
import shutil
import socket
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        return


def pick_free_port() -> int:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    _, port = s.getsockname()
    s.close()
    return int(port)


def start_static_server(root: Path) -> tuple[ThreadingHTTPServer, threading.Thread, int]:
    port = pick_free_port()
    handler = functools.partial(
        QuietHandler,
        directory=str(root.resolve()),
    )
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    th = threading.Thread(target=httpd.serve_forever, daemon=True)
    th.start()
    return httpd, th, port


def cmd_render(args: argparse.Namespace) -> int:
    root = repo_root()
    xml_in = Path(args.xml).expanduser().resolve()
    if not xml_in.is_file():
        print("Input XML not found:", xml_in, file=sys.stderr)
        return 2
    png_out = Path(args.png).expanduser().resolve()

    # リポジトリ内のXMLは直接相対パスで渡す（一時コピー不要）
    # リポジトリ外のXMLのみ一時コピーを作る
    staged = None
    try:
        rel_xml = xml_in.relative_to(root).as_posix()
    except ValueError:
        stem = "_blockshot_" + ("%08x" % (time.time_ns() & 0xFFFFFFFF)) + ".xml"
        rel_xml = "samples/python-intro/" + stem
        staged = root / rel_xml
        shutil.copyfile(xml_in, staged)

    httpd = None
    try:
        httpd, _th, port = start_static_server(root)
        from playwright.sync_api import sync_playwright  # type: ignore

        src_q = urllib.parse.quote(rel_xml, safe="/:@")
        url = f"http://127.0.0.1:{port}/tools/blockshot.html?src={src_q}"
        wait_ms = max(500, int(args.wait_ms))

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            ctx = browser.new_context(
                viewport={
                    "width": int(args.viewport_w),
                    "height": int(args.viewport_h),
                },
                device_scale_factor=2,
            )
            page = ctx.new_page()
            page.goto(url, wait_until="load", timeout=60_000)

            # 固定時間待機→描画完了フラグ待ちに変更（安定性向上）
            try:
                page.wait_for_function("window.__pyco_ready === true", timeout=wait_ms)
            except Exception:
                if page.evaluate("() => !!window.__pyco_error"):
                    print("Load error (invalid XML or missing blocks).", file=sys.stderr)
                    return 3
                print("Timeout waiting for __pyco_ready.", file=sys.stderr)
                return 3

            png_out.parent.mkdir(parents=True, exist_ok=True)
            bounds = page.evaluate("() => window.__pyco_bounds || null")
            if bounds and bounds.get("width", 0) > 0 and bounds.get("height", 0) > 0:
                needed_w = int(bounds.get("x", 0) + bounds["width"]) + 20
                needed_h = int(bounds.get("y", 0) + bounds["height"]) + 20
                new_w = max(int(args.viewport_w), needed_w)
                new_h = max(int(args.viewport_h), needed_h)
                if new_w != int(args.viewport_w) or new_h != int(args.viewport_h):
                    page.set_viewport_size({"width": new_w, "height": new_h})
                page.screenshot(path=str(png_out), clip=bounds)
            else:
                page.locator("#blockly-div").screenshot(path=str(png_out))
            browser.close()

        print("Wrote:", png_out)
        return 0
    except ModuleNotFoundError:
        print(
            "Missing playwright. Run: pip install playwright && playwright install chromium",
            file=sys.stderr,
        )
        return 4
    finally:
        if httpd is not None:
            try:
                httpd.shutdown()
            except OSError:
                pass
        if staged is not None:
            try:
                staged.unlink(missing_ok=True)
            except OSError:
                pass


_AI_SYSTEM_PROMPT = """You output ONLY one valid Blockly workspace XML document for PycoBlocks Python intro mode.

Root:
<xml xmlns="https://developers.google.com/blockly/xml">
...blocks...
</xml>

Use these concrete block types when applicable:

Statements:
  py_print        - value VALUE (expression block)
  var_set         - FieldVariable VAR, value VALUE
  var_change      - FieldVariable VAR, value AMOUNT (number)
  py_if           - value COND, statement THEN (and optionally ELSE per Blockly schema)
  py_while        - value COND, statement DO
  py_input        - FieldVariable VAR, dropdown TYPE str|int|float, field PROMPT (text)
  py_def_noarg    - field NAME (function name), statement BODY
  py_def_args2    - NAME + two args (follow existing sample XML shapes)
  py_return       - value VALUE
  py_call_stmt    - field NAME (+ args per toolkit samples)

Expressions:
  val_str         - field TEXT (literal string contents, NO extra quotes)
  val_number      - field NUM numeric string
  val_var         - FieldVariable VAR

Linkage:
  Use <next> and nested <statement name="BODY"> consistently with Blockly XML from this project.

Identify every <block> with a unique id (b1, b2, ...).
Add x/y on blocks with vertical spacing (+45 to +60 px per row).

Structural example:

<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="py_print" id="b1" x="30" y="30">
    <value name="VALUE"><block type="val_str" id="b2"><field name="TEXT">Hello</field></block></value>
  </block>
</xml>

Respond with RAW XML ONLY (no markdown, no preamble).
"""


def _strip_code_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        if lines and lines[0].strip().lower() in {"xml", "blockly"}:
            lines = lines[1:]
        t = "\n".join(lines).strip()
    return t


def _openai_compatible_chat(user_prompt: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY is empty (needed for gen / all)."
        )
    base = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")
    model = os.environ.get("BLOCKSHOT_MODEL", "gpt-4o-mini")
    endpoint = base + "/chat/completions"
    body = json.dumps(
        {
            "model": model,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": _AI_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Authorization": "Bearer " + api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace") if e.fp else ""
        raise SystemExit("API HTTP {}: {}".format(e.code, detail)) from e
    except urllib.error.URLError as e:
        raise SystemExit("API URL error: {}".format(e)) from e

    try:
        content = data["choices"][0]["message"]["content"]
        return str(content).strip()
    except (KeyError, IndexError) as exc:
        raise SystemExit("Unexpected API response shape: {}".format(data)) from exc


def cmd_gen(args: argparse.Namespace) -> int:
    raw = _openai_compatible_chat(args.prompt)
    xml_text = _strip_code_fence(raw)
    out = Path(args.out_xml).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(xml_text + ("\n" if not xml_text.endswith("\n") else ""), encoding="utf-8")
    print("Wrote:", out)
    return 0


def cmd_all(args: argparse.Namespace) -> int:
    raw = _openai_compatible_chat(args.prompt)
    xml_text = _strip_code_fence(raw)
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".xml", text=False)
    os.close(tmp_fd)
    tpath = Path(tmp_path)
    httpd_holder = None
    staged = None

    try:
        tpath.write_text(xml_text + "\n", encoding="utf-8")

        save = (args.save_xml or "").strip()
        if save:
            sd = Path(save).expanduser().resolve()
            sd.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(tpath, sd)
            print("Saved XML:", sd)

        staged_name = "_blockshot_" + ("%08x" % (time.time_ns() & 0xFFFFFFFF)) + ".xml"
        rel = "samples/python-intro/" + staged_name
        staged = repo_root() / rel
        shutil.copyfile(tpath, staged)

        httpd_holder, _th, port = start_static_server(repo_root())
        from playwright.sync_api import sync_playwright  # type: ignore

        src_q = urllib.parse.quote(rel.replace("\\", "/"), safe="/:@")
        title_q = urllib.parse.quote(args.title or "") if args.title else ""
        url = (
            f"http://127.0.0.1:{port}/viewer.html"
            f"?src={src_q}&readable=0"
            + (f"&title={title_q}" if title_q else "")
        )
        wait_ms = max(500, int(args.wait_ms))
        png_out = Path(args.png).expanduser().resolve()

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            ctx = browser.new_context(
                viewport={
                    "width": int(args.viewport_w),
                    "height": int(args.viewport_h),
                },
                device_scale_factor=2,
            )
            page = ctx.new_page()
            page.goto(url, wait_until="load", timeout=max(120_000, wait_ms))
            page.wait_for_timeout(wait_ms)
            err_flex = page.evaluate(
                "() => getComputedStyle(document.getElementById('error-msg')).display === 'flex'"
            )
            if err_flex:
                print("Viewer load error.", file=sys.stderr)
                return 3
            target = page.locator("#blockly-div .blocklySvg").first
            target.wait_for(state="visible", timeout=wait_ms)
            png_out.parent.mkdir(parents=True, exist_ok=True)
            target.screenshot(path=str(png_out), omit_background=False)
            browser.close()

        print("Wrote:", png_out)
        return 0
    except ModuleNotFoundError:
        print(
            "Missing playwright. Run: pip install playwright && playwright install chromium",
            file=sys.stderr,
        )
        return 4
    finally:
        if httpd_holder is not None:
            try:
                httpd_holder.shutdown()
            except OSError:
                pass
        if staged is not None:
            try:
                staged.unlink(missing_ok=True)
            except OSError:
                pass
        try:
            tpath.unlink(missing_ok=True)
        except OSError:
            pass


def main() -> int:
    ap = argparse.ArgumentParser(description="Pycoblocks blockshot: XML to PNG / LLM helper")
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("render", help="Render existing workspace XML to PNG")
    r.add_argument("xml", help="Path to workspace .xml")
    r.add_argument("png", help="Output .png path")
    r.add_argument("--title", default="", help="Optional viewer title")
    r.add_argument("--wait-ms", type=int, default=4500, help="Post-load settle time (ms)")
    r.add_argument("--viewport-w", type=int, default=1280)
    r.add_argument("--viewport-h", type=int, default=920)
    r.set_defaults(_fn=cmd_render)

    g = sub.add_parser("gen", help="Ask LLM to write workspace XML only")
    g.add_argument("--prompt", "-p", required=True)
    g.add_argument("-o", "--out-xml", required=True)
    g.set_defaults(_fn=cmd_gen)

    al = sub.add_parser("all", help="LLM XML then PNG in one shot")
    al.add_argument("--prompt", "-p", required=True)
    al.add_argument("-o", "--png", required=True, help="Output PNG path")
    al.add_argument("--save-xml", default="", help="Also save generated XML path")
    al.add_argument("--title", default="")
    al.add_argument("--wait-ms", type=int, default=4500)
    al.add_argument("--viewport-w", type=int, default=1280)
    al.add_argument("--viewport-h", type=int, default=920)
    al.set_defaults(_fn=cmd_all)

    ns = ap.parse_args()
    return int(ns._fn(ns))


if __name__ == "__main__":
    raise SystemExit(main())
