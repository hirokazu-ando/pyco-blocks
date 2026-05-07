#!/usr/bin/env python3
"""WP記事4070（Pygame⑨ 速度と反射）の本文を再生成して反映する。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_get, wp_update  # noqa

PAGE_ID = 4070
CACHE_BUSTER = "?v=20260507h"
GAME_BASE = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"

IMAGE_WIDTHS = {"game_05_ball_bounce": 1221,
    "game_09_steps_final": 799,
    "game_09a_accelerate": 799,
    "game_09b_paddle_bounce": 1437,}


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
        '<p>速度（velocity）を変数で管理し、壁や床に当たったら符号を反転させることで、ボールの跳ね返りを実装できます。ブロック崩しやピンポンゲームの基本です。</p>',
        '<p>速度（velocity）を変数で管理し、壁や床に当たったら符号を反転させる――この組み合わせだけで、ボールが跳ね回る動きを実装できます。ブロック崩しやピンポンゲームの心臓部となるパターンです。</p>'
    ),
    # ===== ステップ1 =====
    (
        '<ol><li>変数: <code>bx</code>=320, <code>by</code>=200, <code>vx</code>=3, <code>vy</code>=4</li><li>ゲームループ内：<br>　<code>bx += vx</code>、<code>by += vy</code><br>　「もし bx &lt; 0 または bx &gt; 620 なら vx = -vx」<br>　「もし by &lt; 0 または by &gt; 380 なら vy = -vy」</li><li><code>game_draw_circle(bx, by, 20, 白)</code></li><li>&#x25b6; 実行してボールが跳ね返ることを確認してください</li></ol>',
        '<ol><li>変数を準備します（<code>bx</code> = 320, <code>by</code> = 200, <code>vx</code> = 3, <code>vy</code> = 4）</li><li>ゲームループ内で、次の処理を順に並べます<br>　<code>bx += vx</code>、<code>by += vy</code> で位置を更新<br>　「もし <code>bx &lt; 0</code> または <code>bx &gt; 620</code> なら <code>vx = -vx</code>」<br>　「もし <code>by &lt; 0</code> または <code>by &gt; 380</code> なら <code>vy = -vy</code>」</li><li><code>game_draw_circle(bx, by, 20, 白)</code> でボールを描きます</li><li>&#x25b6; 実行して、白いボールが画面の四辺で跳ね返り続ければ成功です</li></ol>'
    ),
    # ===== 課題1 リード =====
    (
        '<p><code>vx=5, vy=6</code>に変えてボールを速くしてみましょう。速すぎると壁をすり抜ける場合があります。何故でしょうか？</p>',
        '<p><code>vx = 5, vy = 6</code> に変えてボールを速くしてみましょう。速度を上げすぎると、ボールが壁をすり抜けてしまうことがあります。なぜそんな現象が起きるのでしょうか？</p>'
    ),
    # ===== 課題1 解説 =====
    (
        '<p><strong>解説：</strong> 1フレームで移動量が大きすぎると、壁を超えた位置でチェックされるため反転し損なうことがあります。これを「トンネリング」と言います。速度が小さいうちは問題ありません。</p>',
        '<p><strong>解説：</strong> 1 フレームの移動量が大きすぎると、ボールが壁を飛び越えた位置で当たり判定されてしまい、反転のタイミングを逃すことがあります。この現象は <strong>トンネリング</strong> と呼ばれ、ゲーム物理ではよく問題になります。速度が小さい範囲では起きないので、まずはそのまま遊んでみるのが大事です。</p>'
    ),
    # ===== 課題2 リード =====
    (
        '<p>ボールが跳ね返るたびに速度が1.1倍になるようにしましょう（<code>vx *= 1.1</code>）。</p>',
        '<p>ボールが跳ね返るたびに、速度が 1.1 倍ずつ速くなるようにしてみましょう（<code>vx *= 1.1</code>）。続けるうちにどんどん難しくなる「加速ピンポン」風の動きになります。</p>'
    ),
    # ===== 課題2 解説 =====
    (
        '<p><strong>解説：</strong> 反転のタイミングで<code>vx *= 1.1</code>および<code>vy *= 1.1</code>を追加します。速度が増しすぎないよう<code>abs(vx) &lt; 15</code>の条件で制限するとよいです。</p>',
        '<p><strong>解説：</strong> 速度を反転させた直後に <code>vx *= 1.1</code> と <code>vy *= 1.1</code> を追加します。ただしそのまま放置するとボールが速くなりすぎてトンネリングを起こすので、<code>abs(vx) &lt; 15</code> という上限を設けて加速を止めるのがコツです。</p>'
    ),
    # ===== 課題3 リード =====
    (
        '<p>マウス操作のパドル（y=360の横棒）にボールが当たったら上方向に跳ね返るようにしましょう。</p>',
        '<p>マウスで操作するパドル（y = 360 の横棒）にボールが当たったとき、上方向に跳ね返るようにしてみましょう。ブロック崩しに一歩近づく演習です。</p>'
    ),
    # ===== 課題3 解説 =====
    (
        '<p><strong>解説：</strong> パドル領域はx=mx-40〜mx+40, y=360〜372。ボール位置<code>by &gt; 340</code>かつ<code>bx</code>がパドル範囲内のとき<code>vy = -abs(vy)</code>（必ず上向きに）します。</p>',
        '<p><strong>解説：</strong> パドルの領域は x = mx − 40〜mx + 40、y = 360〜372 です。ボールの位置が <code>by &gt; 340</code> かつ <code>bx</code> がパドルの x 範囲内に入ったとき、<code>vy = -abs(vy)</code> として「必ず上向き」に反転させます。普通の <code>vy = -vy</code> だと連続ヒット時にめり込むので、<code>-abs()</code> で必ず上向きに揃えるのがポイントです。</p>'
    ),
    # ===== まとめ =====
    (
        '<ul><li>速度変数<code>vx, vy</code>を使って毎フレーム座標を更新します</li><li>壁に達したとき<code>v = -v</code>で速度を反転させます</li><li>このパターンはブロック崩し・ピンポン・ビリヤードゲームの基本です</li></ul>',
        '<ul><li>速度変数 <code>vx, vy</code> を使い、毎フレーム座標を更新するのが「動き」の基本です。</li><li>壁に達したら <code>v = -v</code> で速度を反転させると、跳ね返りが表現できます。</li><li>このパターンは、ブロック崩し・ピンポン・ビリヤード系ゲームすべての土台になります。</li></ul>'
    ),
    # ===== 課題4-9-2 コード修正（符号を保った加速へ） =====
    (
        '    vx += 0.05\n    vy += 0.05\n    bx += vx\n    by += vy',
        '    if vx &gt; 0:\n        vx += 0.05\n    else:\n        vx -= 0.05\n    if vy &gt; 0:\n        vy += 0.05\n    else:\n        vy -= 0.05\n    bx += vx\n    by += vy',
    ),
    # ===== 課題4-9-2 解説修正 =====
    (
        '<p><strong>解説：</strong> 初速 <code>vx, vy = 1, 1</code> から始め、毎フレーム <code>vx += 0.05; vy += 0.05</code> で少しずつ加算します。これは「等加速度運動」のシンプルな表現で、時間経過とともにボールの速度が線形に増えていきます。なお速度が大きくなりすぎると、1 フレームで壁を飛び越えてしまう「トンネリング」が起きやすくなる点には注意してください。</p>',
        '<p><strong>解説：</strong> 毎フレーム、<code>vx</code> が正なら <code>vx += 0.05</code>、負なら <code>vx -= 0.05</code> として、速度の方向（符号）を保ちながら大きさだけを増やします。<code>vy</code> も同様です。これにより、壁で跳ね返ったあとも同じ方向へ加速し続けます。速度が大きくなりすぎると壁を飛び越える「トンネリング」が起きやすくなる点には注意してください。</p>',
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
