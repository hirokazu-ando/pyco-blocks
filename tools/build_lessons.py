#!/usr/bin/env python3
# =============================================================
# lessons/*.json → lessons/*.js 一括変換
#
#   目的: app.html を file:// で直接開いても学習モードが動くように、
#   レッスン定義を <script> タグで読める JS 形式に変換する
#   （fetch は file:// スキームで失敗するため）。
#
#   - lessons/index.json      → lessons/index.js
#       window.PYCO_LESSONS_INDEX = {...};
#   - lessons/<id>.json       → lessons/<id>.js
#       window.PYCO_LESSONS = window.PYCO_LESSONS || {};
#       window.PYCO_LESSONS['<id>'] = {...};
#   - check.xmlEquals が参照する lessons/xml/<file> は JS 内の _xml に
#     インライン埋め込みする（file:// では XML も fetch できないため）。
#
#   使い方（リポジトリのどこからでも可）:
#     python3 tools/build_lessons.py
#
#   JSON が正本。JS は生成物なので直接編集しないこと。
#   新レッスン追加時は JSON を書く → 本スクリプト実行 → app.html に
#   <script src="lessons/<id>.js"> を1行追加する。
# =============================================================
import json
import glob
import os
import sys

HEADER = (
    "// このファイルは tools/build_lessons.py が lessons/%s.json から自動生成したものです。\n"
    "// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py\n"
)


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    lessons_dir = os.path.join(base, "lessons")
    if not os.path.isdir(lessons_dir):
        print("ERROR: lessons/ が見つかりません: %s" % lessons_dir)
        return 1

    json_paths = sorted(glob.glob(os.path.join(lessons_dir, "*.json")))
    if not json_paths:
        print("ERROR: lessons/*.json がありません")
        return 1

    count = 0
    for path in json_paths:
        name = os.path.splitext(os.path.basename(path))[0]
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        if name == "index":
            body = "window.PYCO_LESSONS_INDEX = %s;\n" % dumps(data)
        else:
            # 模範 XML（xmlEquals）を _xml にインライン埋め込み
            xml_map = {}
            for step in data.get("steps", []):
                chk = step.get("check") or {}
                fn = chk.get("xmlEquals")
                if fn:
                    xml_path = os.path.join(lessons_dir, "xml", fn)
                    if os.path.exists(xml_path):
                        with open(xml_path, encoding="utf-8") as xf:
                            xml_map[fn] = xf.read()
                    else:
                        print("WARN: %s: 模範XMLが見つかりません: %s" % (name, fn))
            if xml_map:
                data["_xml"] = xml_map
            body = (
                "window.PYCO_LESSONS = window.PYCO_LESSONS || {};\n"
                "window.PYCO_LESSONS[%s] = %s;\n" % (dumps(name), dumps(data))
            )

        out_path = os.path.join(lessons_dir, name + ".js")
        with open(out_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(HEADER % name)
            f.write(body)
        print("OK: %s -> %s" % (os.path.basename(path), os.path.basename(out_path)))
        count += 1

    print("完了: %d ファイルを変換しました" % count)
    return 0


def dumps(obj):
    return json.dumps(obj, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    sys.exit(main())
