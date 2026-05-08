#!/usr/bin/env python3
"""per-file XML を <project> 形式にマージする。

Usage:
  python3 tools/merge_to_project.py <base>           # samples/game/<base>.xml を生成
  python3 tools/merge_to_project.py <base1> <base2>  # 複数ベース一括

例: python3 tools/merge_to_project.py game_19_step1_final
  → samples/game/game_19_step1_final_funcs.xml
    samples/game/game_19_step1_final_update_play.xml
    samples/game/game_19_step1_final_draw_play.xml
    samples/game/game_19_step1_final_main.xml
  を読み、<project> 形式の samples/game/game_19_step1_final.xml を出力する。

ファイル並び順は SUFFIXES 順（main.py が最後）。各 <file name="..."> の中に
元 XML の documentElement（<xml>）をそのまま入れる。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from xml.dom import minidom

# サフィックス → ファイル名のマップ。並び順 = プロジェクト内のタブ順。
SUFFIXES: list[tuple[str, str]] = [
    ('_funcs', 'game_funcs.py'),
    ('_draw_title', 'draw_title.py'),
    ('_update_play', 'update_play.py'),
    ('_draw_play', 'draw_play.py'),
    ('_update_over', 'update_over.py'),
    ('_draw_over', 'draw_over.py'),
    ('_main', 'main.py'),
]


def find_xml(base: str, suffix: str, samples_dir: Path) -> Path | None:
    """指定ベース＋サフィックスのXMLを返す。無ければ過去ステップへフォールバック。

    例: game_19_step2_final + _main → 無ければ game_19_step1_final_main.xml を探す。
    """
    p = samples_dir / f'{base}{suffix}.xml'
    if p.is_file():
        return p
    m = re.match(r'(.+_step)(\d+)(.*)$', base)
    if m:
        prefix, num, tail = m.group(1), int(m.group(2)), m.group(3)
        for i in range(num - 1, 0, -1):
            alt = samples_dir / f'{prefix}{i}{tail}{suffix}.xml'
            if alt.is_file():
                return alt
    return None


def merge_one(base: str, samples_dir: Path) -> Path:
    """1 ベース分をマージして project XML を生成し、出力パスを返す。"""
    project = minidom.Document()
    root = project.createElement('project')
    root.setAttribute('xmlns', 'https://developers.google.com/blockly/xml')
    project.appendChild(root)

    found = 0
    for suffix, fname in SUFFIXES:
        src = find_xml(base, suffix, samples_dir)
        if src is None:
            continue
        dom = minidom.parse(str(src))
        xml_el = dom.documentElement  # <xml>
        file_el = project.createElement('file')
        file_el.setAttribute('name', fname)
        # <xml> ノードを project ドキュメントへ移植
        imported = project.importNode(xml_el, True)
        file_el.appendChild(imported)
        root.appendChild(file_el)
        found += 1

    if found == 0:
        raise FileNotFoundError(f'no per-file XMLs found for base={base!r}')

    out_path = samples_dir / f'{base}.xml'
    text = project.toxml(encoding='UTF-8').decode('utf-8')
    out_path.write_text(text, encoding='utf-8')
    return out_path


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    samples_dir = Path(__file__).parent.parent / 'samples' / 'game'
    for base in argv[1:]:
        try:
            out = merge_one(base, samples_dir)
            print(f'OK  {out.name}')
        except Exception as e:
            print(f'NG  {base}: {e}', file=sys.stderr)
            return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
