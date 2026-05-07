#!/usr/bin/env python3
"""WP記事4071（Pygame⑩ 乱数で敵を出す）の本文を再生成して反映する。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_get, wp_update  # noqa

PAGE_ID = 4071
CACHE_BUSTER = "?v=20260507i"
GAME_BASE = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"

IMAGE_WIDTHS = {"game_10_steps_final": 1106,
    "game_10a_one_enemy": 1106,
    "game_10b_two_enemies": 1128,
    "game_10c_enemy_list": 1716,}


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
        '<p>乱数を使って敵がランダムな位置に現れる処理を実装します。これでゲームに予測不能さが生まれ、繰り返し遊べるようになります。</p>',
        '<p>乱数を使って敵がランダムな位置に現れるようにすると、ゲームに「次に何が起きるか分からない」という予測不能さが生まれ、繰り返し遊んでも飽きにくくなります。</p>'
    ),
    # ===== ステップ1 =====
    (
        '<ol><li>変数: <code>ex = py_random_int(0, 576)</code>、<code>ey</code>=-48</li><li>ゲームループ内：<br>　<code>ey += 3</code>（毎フレーム下に移動）<br>　enemy_bugをx=ex, y=eyに描画<br>　「もし ey &gt; 400 なら ex = random(0,576), ey = -48」</li><li>&#x25b6; 実行して敵が落ちてきてリセットされることを確認してください</li></ol>',
        '<ol><li>変数を準備します（<code>ex = py_random_int(0, 576)</code>、<code>ey</code> = -48）</li><li>ゲームループ内で次の処理を順に並べます<br>　<code>ey += 3</code> で敵を下方向に移動<br>　enemy_bug を (x = ex, y = ey) に描画<br>　「もし <code>ey &gt; 400</code> なら <code>ex = random(0, 576)</code>、<code>ey = -48</code>」でリセット</li><li>&#x25b6; 実行して、敵が画面の上から落ちてきて、下まで行くと別の x 位置から再登場すれば成功です</li></ol>'
    ),
    # ===== 課題1 リード =====
    (
        '<p>敵がリセットされるたびに落下速度<code>espeed</code>も<code>random.randint(2, 6)</code>でランダムに変えてみましょう。</p>',
        '<p>敵がリセットされるタイミングで、落下速度 <code>espeed</code> も <code>random.randint(2, 6)</code> でランダムに変えてみましょう。出てくるたびに速さが違う敵になり、難易度が一気に上がります。</p>'
    ),
    # ===== 課題1 解説 =====
    (
        '<p><strong>解説：</strong> リセット処理で<code>espeed = random.randint(2, 6)</code>を同時に設定します。<code>ey += espeed</code>と書き換えることで速度がランダムになります。</p>',
        '<p><strong>解説：</strong> リセット処理の中で <code>espeed = random.randint(2, 6)</code> を一緒にセットし、移動式を <code>ey += espeed</code> に書き換えるだけで、敵ごとの落下速度がランダムに切り替わります。</p>'
    ),
    # ===== 課題2 リード =====
    (
        '<p><code>ex2, ey2, ex3, ey3</code>の変数を用意して3体の敵を独立して動かしてみましょう。</p>',
        '<p><code>ex2, ey2, ex3, ey3</code> のように変数を増やして、3 体の敵を独立して動かしてみましょう。それぞれ別の速度・別のタイミングで降ってくるので、敵らしさがぐっと増します。</p>'
    ),
    # ===== 課題2 解説 =====
    (
        '<p><strong>解説：</strong> 3体を完全に独立して管理するにはリストを使うとスッキリします（上級の予習）。2体なら変数を2セット用意して同じ処理を繰り返せば動きます。</p>',
        '<p><strong>解説：</strong> 同じ形の処理を 2 セット並べれば 2 体まではすぐ動きます。ただし 3 体・4 体と増えてくるとコードが長くなりがちなので、上級課題ではリストでまとめて管理する方法を扱います。</p>'
    ),
    # ===== 課題3 リード =====
    (
        '<p><code>enemies = [[rx, -48, rspeed], ...]</code>のようなリストで3体の敵をまとめて管理してみましょう。</p>',
        '<p><code>enemies = [[rx, -48, rspeed], ...]</code> のようなリストで、3 体の敵を 1 つのデータ構造にまとめて管理してみましょう。for ループ + リストの組み合わせは、ゲームプログラミングで頻繁に出てくる重要なパターンです。</p>'
    ),
    # ===== 課題3 解説 =====
    (
        '<p><strong>解説：</strong> <code>enemies = [[x, y, speed], ...]</code>で初期化。毎フレームforループで更新・描画・リセットします。リストにまとめると敵を何体でも簡単に追加できます。</p>',
        '<p><strong>解説：</strong> 各敵を <code>[x, y, speed]</code> という 3 要素リストで表し、それを enemies という大きなリストに入れます。毎フレーム for ループで「移動 → 画面外チェック → リセット → 描画」を繰り返せば完成です。この形にしておけば、敵の数を 5 体・10 体に増やすのも初期化の 1 行を変えるだけで済みます。</p>'
    ),
    # ===== まとめ =====
    (
        '<ul><li><code>py_random_int(a, b)</code>でa以上b以下の整数を乱数で取得できます</li><li>敵が画面外に出たらランダムな位置にリセットすることで繰り返し出現します</li><li>敵をリストで管理するとコードが短くスッキリします</li></ul>',
        '<ul><li><code>py_random_int(a, b)</code> で a 以上 b 以下の整数を乱数で得られます。</li><li>敵が画面外に出たらランダムな位置に戻すことで、無限に出現し続ける敵が作れます。</li><li>敵をリストで管理すると、何体でも同じ処理でまとめて扱えます。</li></ul>'
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
