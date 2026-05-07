#!/usr/bin/env python3
"""WP記事4068（Pygame⑦ 境界チェック）の本文を再生成して反映する。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_get, wp_update  # noqa

PAGE_ID = 4068
CACHE_BUSTER = "?v=20260507e"
GAME_BASE = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"

IMAGE_WIDTHS = {"game_07_steps_final": 720,
    "game_07a_clamp_x": 693,
    "game_07b_bounce_x": 685,
    "game_07c_inner_margin": 663,}


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
        '<p>前の記事でキャラクターを動かせるようになりましたが、このままでは画面の外に出てしまいます。この記事では座標をクランプして、画面の端でぴったり止まる処理を実装します。</p>',
        '<p>前回でキャラクターを動かせるようになりましたが、そのままだと画面の外まで飛び出していってしまいます。今回は座標をクランプ（範囲制限）する処理を加え、画面の端でぴったり止まるようにしましょう。</p>'
    ),
    # ===== ステップ1 =====
    (
        '<ol><li>キー入力処理の後に以下の条件ブロックを追加する：<br>　「もし px &lt; 0 なら px = 0」<br>　「もし px &gt; 576 なら px = 576（640-64）」（64はスプライト幅）<br>　「もし py &lt; 0 なら py = 0」<br>　「もし py &gt; 336 なら py = 336（400-64）」（64はスプライト高さ）</li><li>&#x25b6; 実行して画面端で止まることを確認してください</li></ol>',
        '<ol><li>キー入力処理の後に、次の 4 つの条件ブロックを追加します（スプライトサイズは 64×64 とします）<br>　「もし <code>px &lt; 0</code> なら <code>px = 0</code>」<br>　「もし <code>px &gt; 576</code> なら <code>px = 576</code>」（640 - 64）<br>　「もし <code>py &lt; 0</code> なら <code>py = 0</code>」<br>　「もし <code>py &gt; 336</code> なら <code>py = 336</code>」（400 - 64）</li><li>&#x25b6; 実行して、画面の端でぴったり止まれば成功です</li></ol>'
    ),
    # ===== ステップ2 =====
    (
        '<ol><li>4つのif文の代わりに：<br>　<code>px = max(0, min(576, px))</code><br>　<code>py = max(0, min(336, py))</code><br>　（py_custom_stmtブロックを使う）</li></ol>',
        '<ol><li>4 つの if 文の代わりに、次のように 1 行で書くこともできます<br>　<code>px = max(0, min(576, px))</code><br>　<code>py = max(0, min(336, py))</code><br>　（式ブロック / py_custom_stmt を使います）</li><li>意味は「px は最低でも 0、最大でも 576」になるように clamp する、という処理です</li></ol>'
    ),
    # ===== 課題1 リード =====
    (
        '<p>左右方向だけ境界チェックして、上下は自由に動けるようにしましょう。</p>',
        '<p>左右方向だけ境界チェックを行い、上下は自由に動けるようにしてみましょう。「特定の方向だけ制限する」演習です。</p>'
    ),
    # ===== 課題1 解説 =====
    (
        '<p><strong>解説：</strong> xの境界チェックだけ入れ、yはそのままにします。<code>px = max(0, min(576, px))</code>のように<code>max/min</code>でまとめることもできます。</p>',
        '<p><strong>解説：</strong> x の境界チェックだけを入れ、y はそのままにします。if 2 つで書いても、<code>px = max(0, min(576, px))</code> と 1 行でまとめてもどちらでも OK です。</p>'
    ),
    # ===== 課題2 リード =====
    (
        '<p>止まるのではなく、端に達したら速度を反転（跳ね返り）させてみましょう。変数<code>vx</code>を使います。</p>',
        '<p>端に達したら止まるのではなく、ピンポン玉のように <strong>跳ね返らせて</strong> みましょう。速度を表す変数 <code>vx</code> を導入し、壁に当たったときに符号を反転させるのがポイントです。</p>'
    ),
    # ===== 課題2 解説 =====
    (
        '<p><strong>解説：</strong> 移動を<code>px += vx</code>として、<code>px &lt; 0 or px &gt; 576</code>のとき<code>vx = -vx</code>で反転させます。これは次の記事（⑨速度と反射）の予習です！</p>',
        '<p><strong>解説：</strong> 移動を <code>px += vx</code> と書き、<code>px &lt; 0</code> もしくは <code>px &gt; 576</code> のときに <code>vx = -vx</code> で速度の符号を反転させます。これだけで「壁にぶつかったら跳ね返る」動きが完成します。次の章で扱う「速度と反射」の予習にもなる重要なパターンです。</p>'
    ),
    # ===== 課題3 リード =====
    (
        '<p>x=64〜576, y=64〜336（画面の内側80%）にしか移動できないようにしてみましょう。</p>',
        '<p>x = 64〜576、y = 64〜336（画面の内側 80 %）の範囲にしか移動できないようにしてみましょう。HUD 表示のために端を残しておきたいゲームでよく使うテクニックです。</p>'
    ),
    # ===== 課題3 解説 =====
    (
        '<p><strong>解説：</strong> <code>px = max(64, min(512, px))</code>、<code>py = max(64, min(272, py))</code>とします。マージンが64pxになります。</p>',
        '<p><strong>解説：</strong> <code>px = max(64, min(512, px))</code>、<code>py = max(64, min(272, py))</code> とすれば、上下左右に 64 px ずつのマージン（余白）を確保できます。スプライト幅 64 を考慮するなら、上限は 640 - 64 - 64 = 512、336 - 64 = 272 となります。</p>'
    ),
    # ===== まとめ =====
    (
        '<ul><li>座標に上限・下限を設けることでキャラクターが画面外に出るのを防ぎます</li><li><code>max(0, min(上限, 座標))</code>で1行で範囲制限できます</li><li>スプライトのサイズを引いた値を上限にするとキャラクターの端がぴったり合います</li></ul>',
        '<ul><li>座標に上限と下限を決めることで、キャラクターが画面外に出るのを防げます。</li><li><code>max(0, min(上限, 座標))</code> で 1 行で範囲制限が書けます。</li><li>スプライトのサイズ分を引いた値を上限にすると、キャラクターの端がちょうど画面の端に揃います。</li></ul>'
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
