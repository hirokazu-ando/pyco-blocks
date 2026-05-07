#!/usr/bin/env python3
"""WP記事4069（Pygame⑧ マウス操作）の本文を再生成して反映する。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_get, wp_update  # noqa

PAGE_ID = 4069
CACHE_BUSTER = "?v=20260507e"
GAME_BASE = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"

IMAGE_WIDTHS = {"game_03_mouse_paint": 720,
    "game_08_steps_final": 720,
    "game_08a_click_stars": 720,
    "game_08b_remove_nearest": 696,}


def update_image(content: str, basename: str, width: int) -> str:
    base_url = f"{GAME_BASE}/screenshots/{basename}.png"
    content = re.sub(
        rf'src="{re.escape(base_url)}(\?v=[^"]*)?"',
        f'src="{base_url}{CACHE_BUSTER}"',
        content,
    )
    content = re.sub(
        rf'(src="{re.escape(base_url)}{re.escape(CACHE_BUSTER)}"[^>]*?width:)\d+(px)',
        rf'\g<1>{width}\2',
        content,
    )
    return content


REPLACEMENTS = [
    # ===== 冒頭 =====
    (
        '<p>キーボードとは別の操作方法として、マウスを使ったインタラクションを実装します。マウス座標の取得とクリック判定を使えば、クリックゲームやパドルゲームが作れます。</p>',
        '<p>キーボードに加えて、マウスもゲームの定番入力デバイスです。マウス座標の取得やクリック判定ができるようになると、クリックゲームやパドル系のゲームをぐっと作りやすくなります。</p>'
    ),
    # ===== ステップ1 =====
    (
        '<ol><li>ゲームループ内で<code>mx = game_mouse_x()</code>と<code>my = game_mouse_y()</code>を変数に取得</li><li><code>game_draw_circle(mx, my, 20, 青)</code>で描画</li><li>&#x25b6; 実行してボールがマウスに追いかけてくることを確認してください</li></ol>',
        '<ol><li>ゲームループ内で <code>mx = game_mouse_x()</code> と <code>my = game_mouse_y()</code> を変数に取得します</li><li><code>game_draw_circle(mx, my, 20, 青)</code> で円を描きます</li><li>&#x25b6; 実行して、青い円がマウスカーソルにぴったりついてくれば成功です</li></ol>'
    ),
    # ===== ステップ2 =====
    (
        '<ol><li>変数<code>color</code>を(0,0,255)（青）に設定</li><li>「もし <code>game_mouse_pressed(0)</code> なら color = (255,0,0)（赤）」を追加</li><li>&#x25b6; 実行してクリック中に赤くなることを確認してください</li></ol>',
        '<ol><li>変数 <code>color</code> を (0, 0, 255)（青）に設定します</li><li>「もし <code>game_mouse_pressed(0)</code> なら <code>color = (255, 0, 0)</code>（赤）」を追加します</li><li>&#x25b6; 実行して、左クリックしている間だけ円が赤くなれば成功です</li></ol>'
    ),
    # ===== 課題1 リード =====
    (
        '<p>横長の四角形（パドル）のx位置をマウスのx座標に追従させてみましょう。y座標は固定（例: y=360）で。</p>',
        '<p>横長の四角形（パドル）の x 座標をマウスの x 座標に追従させてみましょう。y 座標は固定（例：y=360）で構いません。ブロック崩しのパドルなどに直接使える基本テクニックです。</p>'
    ),
    # ===== 課題1 解説 =====
    (
        '<p><strong>解説：</strong> <code>mx = game_mouse_x()</code>を取得して<code>game_draw_rect(mx-40, 360, 80, 12, 白)</code>と描画します。パドル幅の半分を引くことで中央にマウスが来ます。</p>',
        '<p><strong>解説：</strong> <code>mx = game_mouse_x()</code> を取得して <code>game_draw_rect(mx - 40, 360, 80, 12, 白)</code> と描きます。パドル幅 80 の半分（40）を引くことで、マウスのちょうど真上にパドルの中心が来るのがポイントです。</p>'
    ),
    # ===== 課題2 リード =====
    (
        '<p>左クリックした座標に星（coinスプライト）を表示するリストを作りましょう。クリックするたびに増えます。</p>',
        '<p>左クリックした座標に星（coin スプライト）が次々と現れる仕掛けを作ってみましょう。リストを使ってクリック位置を記録するのがコツです。</p>'
    ),
    # ===== 課題2 解説 =====
    (
        '<p><strong>解説：</strong> リスト<code>marks</code>を空で用意し、クリック時に<code>[mx, my]</code>をappendします。毎フレームリストを走査してコインを描画します。</p>',
        '<p><strong>解説：</strong> 空のリスト <code>marks</code> を用意し、クリックされたタイミングで <code>[mx, my]</code> を append します。毎フレーム、リストを for ループで走査してコインを描き直すことで、過去にクリックした位置すべてに星が残ります。</p>'
    ),
    # ===== 課題3 リード =====
    (
        '<p>課題4-8-2に加えて、右クリックした位置に最も近いスターを削除する機能を追加しましょう。</p>',
        '<p>課題 4-8-2 に加えて、「右クリックした位置に最も近い星を削除する」機能を追加してみましょう。距離計算と <code>min</code> 関数の組み合わせを練習する課題です。</p>'
    ),
    # ===== 課題3 解説 =====
    (
        '<p><strong>解説：</strong> 右クリック時に<code>marks</code>の各要素との距離を計算し、最も近いものを<code>remove</code>します。距離の計算は<code>((x-mx)**2+(y-my)**2)**0.5</code>です。</p>',
        '<p><strong>解説：</strong> 右クリック時に <code>marks</code> の各要素について「マウス位置との距離」を計算し、<code>min</code> で最も近いものを取り出して <code>remove</code> します。距離は中学数学でおなじみの <code>((x - mx)**2 + (y - my)**2)**0.5</code>（ユークリッド距離）で求められます。</p>'
    ),
    # ===== まとめ =====
    (
        '<ul><li><code>game_mouse_x()/game_mouse_y()</code>でマウスのxy座標を取得できます</li><li><code>game_mouse_pressed(0)</code>で左クリック、<code>(2)</code>で右クリックを検出できます</li><li>パドルゲームなど横方向の操作にはマウスが直感的です</li></ul>',
        '<ul><li><code>game_mouse_x()</code> / <code>game_mouse_y()</code> でマウスの xy 座標を取得できます。</li><li><code>game_mouse_pressed(0)</code> で左クリック、<code>(2)</code> で右クリックを検出できます。</li><li>パドルゲームのような「横方向の操作」では、マウス操作のほうがキーボードより直感的に感じられます。</li></ul>'
    ),
]


def main():
    content = wp_get(PAGE_ID)
    print(f"取得: page {PAGE_ID}, {len(content)} chars")

    new = content
    for old, repl in REPLACEMENTS:
        if old not in new:
            print(f"  WARN: 置換対象が見つかりません: {old[:80]}...")
            continue
        new = new.replace(old, repl, 1)
        print(f"  OK: 置換完了 ({old[:60]}...)")

    for basename, width in IMAGE_WIDTHS.items():
        new = update_image(new, basename, width)
    print("  OK: 画像幅 + キャッシュバスター 更新")

    if new == content:
        print("変更なし。終了。")
        return

    print(f"差分: {len(new) - len(content):+} chars")
    wp_update(PAGE_ID, new)
    print("反映完了")


if __name__ == "__main__":
    main()
