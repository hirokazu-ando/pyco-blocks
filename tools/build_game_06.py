#!/usr/bin/env python3
"""WP記事4067（Pygame⑥ キーボード）の本文を再生成して反映する。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_get, wp_update  # noqa

PAGE_ID = 4067
CACHE_BUSTER = "?v=20260507e"
GAME_BASE = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"

IMAGE_WIDTHS = {"game_06_wasd": 720,
    "game_06_steps_final": 720,
    "game_06a_dash": 693,
    "game_06b_diagonal": 720,}


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
        '<p>いよいよプレイヤーがキャラクターを操作できるゲームを作ります。<code>game_key_pressed</code>ブロックを使って、矢印キーやWASDキーでキャラクターを動かしてみましょう。</p>',
        '<p>いよいよプレイヤーがキャラクターを操作できるゲームに踏み込みます。<code>game_key_pressed</code> ブロックを使えば、矢印キーや WASD キーでキャラクターを自由に動かせるようになります。</p>'
    ),
    # ===== ステップ1 =====
    (
        '<ol><li>変数<code>px</code>=300, <code>py</code>=320に設定（ゲームループ外）</li><li>ゲームループ内：<br>　「もし 右矢印キーが押されている なら px += 4」<br>　「もし 左矢印キーが押されている なら px -= 4」</li><li>ship_imgをx=px, y=pyに描画</li><li>&#x25b6; 実行して矢印キーで動くことを確認してください</li></ol>',
        '<ol><li>ゲームループの外で、変数 <code>px</code> = 300, <code>py</code> = 320 を準備します</li><li>ゲームループ内で、次の 2 つの条件ブロックを並べます<br>　「もし 右矢印キーが押されている なら <code>px += 4</code>」<br>　「もし 左矢印キーが押されている なら <code>px -= 4</code>」</li><li>ship 画像を (x=px, y=py) に描画します</li><li>&#x25b6; 実行して、矢印キーで自機が左右に動けば成功です</li></ol>'
    ),
    # ===== ステップ2 =====
    (
        '<ol><li>上キーで<code>py -= 4</code>、下キーで<code>py += 4</code>を追加してください</li><li>&#x25b6; 実行して4方向に動くことを確認してください</li></ol>',
        '<ol><li>上キーで <code>py -= 4</code>、下キーで <code>py += 4</code> の条件ブロックを追加します</li><li>&#x25b6; 実行して、上下左右の 4 方向に自機が動けば成功です</li></ol>'
    ),
    # ===== 課題1 リード =====
    (
        '<p>矢印キーに加えて、W・A・S・Dキーでも同じように動けるようにしましょう。</p>',
        '<p>矢印キーに加えて、W / A / S / D キーでも同じように動けるようにしましょう。FPS ゲームでお馴染みの操作スタイルです。</p>'
    ),
    # ===== 課題1 解説 =====
    (
        '<p><strong>解説：</strong> <code>game_key_pressed</code>ブロックのプルダウンでW/A/S/Dを選べます。矢印キーの条件ブロックと同じ処理を並べるだけです。</p>',
        '<p><strong>解説：</strong> <code>game_key_pressed</code> ブロックのプルダウンから W / A / S / D を選べます。矢印キーで作った条件ブロックをコピーし、対応するキーに差し替えるだけで実装できます。</p>'
    ),
    # ===== 課題2 リード =====
    (
        '<p>移動速度を変数<code>speed</code>=4で管理し、スペースキーを押すと<code>speed</code>=8（高速）、離すと4に戻るようにしましょう。</p>',
        '<p>移動速度を変数 <code>speed</code> = 4 で管理し、スペースキーを押している間だけ <code>speed</code> = 8（ダッシュ）になるようにしましょう。「ダッシュ」のあるゲームでよく使うパターンです。</p>'
    ),
    # ===== 課題2 解説 =====
    (
        '<p><strong>解説：</strong> ループ先頭で<code>speed = 4</code>を設定し、「もしスペースキーが押されているならspeed = 8」と上書きします。移動時は<code>px += speed</code>を使います。</p>',
        '<p><strong>解説：</strong> ループの先頭で毎フレーム <code>speed = 4</code> をセットし直し、「スペースキーが押されていれば <code>speed = 8</code> に上書き」という形にすると、押している間だけダッシュ、離すと自動で元の速さに戻ります。移動量は <code>px += speed</code> のように変数で書くのがポイントです。</p>'
    ),
    # ===== 課題3 リード =====
    (
        '<p>右と上を同時に押したとき斜め上右（x+, y-）に動くようにしましょう。Pygameのポーリング方式ではこれが自然に実現できます。動作を確認してください。</p>',
        '<p>右と上を同時に押したときに、自機が斜め右上（x +, y -）に動くようにしましょう。実は <code>game_key_pressed</code> 方式（ポーリング）では特別なコードを書かなくても自然に斜め移動が実現します。本当にそうなるか試して確かめてみてください。</p>'
    ),
    # ===== 課題3 解説 =====
    (
        '<p><strong>解説：</strong> 各キーの条件が独立しているため、右キーと上キーを同時に押すと自然に斜め移動になります。特別な処理は不要です。</p>',
        '<p><strong>解説：</strong> 上下左右それぞれの条件ブロックが独立しているため、右と上を同時に押すと <code>px += 4</code> と <code>py -= 4</code> が同じフレームで実行され、結果として斜め右上へ動きます。8 方向移動を実現するために特別な処理を書く必要はありません。</p>'
    ),
    # ===== まとめ =====
    (
        '<ul><li><code>game_key_pressed</code>は押している間ずっとTrueを返します</li><li>矢印キー・WASDキー・スペースキーなど多数のキーに対応しています</li><li>複数のキー条件を並べることで8方向移動も自然に実現できます</li></ul>',
        '<ul><li><code>game_key_pressed</code> はキーを押している間ずっと True を返します（ポーリング方式）。</li><li>矢印キー・WASD・スペースキーなど、ゲームでよく使うキーに対応しています。</li><li>複数のキー条件を並べるだけで、4 方向や 8 方向移動が自然に実現できます。</li></ul>'
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
