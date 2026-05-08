#!/usr/bin/env python3
"""WP記事4073（Pygame⑫ スコア表示）の本文を再生成して反映する。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_get, wp_update  # noqa

PAGE_ID = 4073
CACHE_BUSTER = "?v=20260508d"
GAME_BASE = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"

IMAGE_WIDTHS = {"game_12_steps_final": 1450,
    "game_12a_score_count": 1475,
    "game_12b_score_cap": 1475,
    "game_12c_high_score": 1475,}


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
        '<p>ゲームにスコア機能を追加しましょう。変数で得点を管理し、f文字列でリアルタイムに表示することで、プレイヤーが目標を持って遊べます。</p>',
        '<p>ゲームにスコア機能を追加しましょう。変数で得点を管理し、f 文字列で画面に常に表示するだけで、プレイヤーは「目標」を持って遊べるようになります。</p>'
    ),
    # ===== ステップ1 =====
    (
        '<ol><li>変数<code>score</code>=0を設定</li><li>コインとの衝突時に<code>score += 10</code>（var_changeブロックで+10）</li><li><code>game_draw_text(f"Score: {score}", 10, 10, 28, 白)</code>でHUD表示</li><li>&#x25b6; 実行してコインを取るとスコアが増えることを確認してください</li></ol>',
        '<ol><li>変数 <code>score</code> を 0 で用意します</li><li>コインとの衝突時に <code>score += 10</code>（var_change ブロックで +10）を追加します</li><li><code>game_draw_text(f"Score: {score}", 10, 10, 28, 白)</code> で HUD としてスコアを表示します</li><li>&#x25b6; 実行して、コインに触れるたびに左上の数字が 10 ずつ増えれば成功です</li></ol>'
    ),
    # ===== 課題1 リード =====
    (
        '<p>変数<code>hi_score</code>を用意して、<code>score</code>が更新されるたびに<code>hi_score</code>も更新してみましょう。</p>',
        '<p>変数 <code>hi_score</code>（ハイスコア）を用意して、<code>score</code> が更新されるたびに最高記録も更新するようにしてみましょう。「最高得点を超えるぞ」というモチベーションが生まれます。</p>'
    ),
    # ===== 課題1 解説 =====
    (
        '<p><strong>解説：</strong> スコア加算後に<code>if score &gt; hi_score: hi_score = score</code>を追加します。ハイスコアは別の位置（例:右上）に表示します。</p>',
        '<p><strong>解説：</strong> スコア加算の直後に <code>if score &gt; hi_score: hi_score = score</code> を 1 行入れるだけで実装できます。ハイスコアは現スコアと別の位置（例：右上）に表示すると、両者を見比べやすくなります。</p>'
    ),
    # ===== 課題2 リード =====
    (
        '<p>コイン（+10点）とスター（+50点）の2種類のアイテムを用意して、それぞれスコアが異なるようにしましょう。</p>',
        '<p>コイン（+10 点）とスター（+50 点）の 2 種類のアイテムを用意し、取った種類によって加点が変わるようにしましょう。希少アイテムを狙う駆け引きが生まれます。</p>'
    ),
    # ===== 課題2 解説 =====
    (
        '<p><strong>解説：</strong> 星用のRectを別途作り、衝突時に<code>score += 50</code>します。コインとスターを独立した変数で管理します。</p>',
        '<p><strong>解説：</strong> スター用の Rect を別に作り、衝突時には <code>score += 50</code> とします。コイン側の処理とまったく同じ形をもう 1 セット書くイメージで、それぞれ独立した変数で位置を管理します。</p>'
    ),
    # ===== 課題3 リード =====
    (
        '<p>コインを取ったとき、残り時間が多いほど高得点（10 + 残り時間×0.1点）になるようにしてみましょう。</p>',
        '<p>コインを取ったとき、残り時間が多いほど高得点（10 + 残り時間 × 0.1 点）になるようにしてみましょう。「素早く取るほどボーナス」というスピード重視の遊び方ができます。</p>'
    ),
    # ===== 課題3 解説 =====
    (
        '<p><strong>解説：</strong> <code>game_get_ticks()</code>で経過時間を取り、制限時間(例:30000ms)からの残り時間をボーナスに使います。早く取るほど高ポイントになります。</p>',
        '<p><strong>解説：</strong> <code>game_get_ticks()</code> で経過時間（ミリ秒）を取得し、制限時間（例：30000 ms）から引いた「残り時間」をボーナス計算に使います。残り時間 × 0.001 を 10 点に足してあげれば、早く取るほど高得点になる仕組みが作れます。</p>'
    ),
    # ===== まとめ =====
    (
        '<ul><li><code>var_change</code>ブロックでスコアを加算します</li><li><code>game_draw_text</code>とf文字列でリアルタイム表示できます</li><li>ハイスコアの保持はif文1行で実装できます</li></ul>',
        '<ul><li><code>var_change</code> ブロックでスコアの加減算ができます。</li><li><code>game_draw_text</code> と f 文字列を組み合わせれば、得点をリアルタイムに表示できます。</li><li>ハイスコア保持は <code>if score &gt; hi_score: hi_score = score</code> の 1 行で実装できます。</li></ul>'
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
