#!/usr/bin/env python3
"""WP記事4074(Pygame⑬ ゲームオーバー)の本文を再生成して反映する。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_get, wp_update  # noqa

PAGE_ID = 4074
CACHE_BUSTER = "?v=20260507i"
GAME_BASE = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"

IMAGE_WIDTHS = {"game_13_step1_final": 1413,
    "game_13_step2_final": 1429,
    "game_13a_game_over": 1429,
    "game_13b_reset_func": 1429,
    "game_13c_lives": 1476,}


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
        '<p>ゲームに終わりがなければ達成感がありません。敵に当たったらゲームオーバーになる仕組みと、「GAME OVER」画面を実装しましょう。</p>',
        '<p>ゲームに終わりがないと達成感は生まれにくいものです。敵に当たったらゲームオーバーになる仕組みと、「GAME OVER」画面を表示する流れを実装してみましょう。</p>'
    ),
    # ===== ステップ1 =====
    (
        '<ol><li>プレイヤーと敵が衝突したとき<code>running = False</code>（var_setブロックでFalseに）を設定</li><li>&#x25b6; 実行して当たるとゲームが止まることを確認してください</li></ol>',
        '<ol><li>プレイヤーと敵が衝突したときに <code>running = False</code>（var_set ブロックで False を代入）を実行します</li><li>&#x25b6; 実行して、敵に当たった瞬間にゲームが止まれば成功です</li></ol>'
    ),
    # ===== ステップ2 =====
    (
        '<ol><li>変数<code>state</code>を<code>"play"</code>に設定（ゲームループ外）</li><li>ゲームループ内で「もし state == "play" なら通常処理、そうでなければGAME OVER表示」に切り替える</li><li>敵に当たったとき<code>state = "over"</code>にしてください</li></ol>',
        '<ol><li>ゲームループの外で変数 <code>state</code> を <code>"play"</code> に設定します</li><li>ゲームループ内では「<code>state == "play"</code> なら通常のゲーム処理、そうでなければ GAME OVER 表示」と分岐します</li><li>敵に当たったタイミングで <code>state = "over"</code> に切り替えれば、画面が遷移するように見えます</li></ol>'
    ),
    # ===== 課題1 リード =====
    (
        '<p>ゲームオーバー画面に最終スコアと「Press R to Retry」の文字を表示しましょう。</p>',
        '<p>ゲームオーバー画面に「最終スコア」と「Press R to Retry」の文字を表示してみましょう。プレイヤーに次のアクションを促す UI の練習です。</p>'
    ),
    # ===== 課題1 解説 =====
    (
        '<p><strong>解説：</strong> ゲームオーバー時の描画ブロックに<code>f\'Final Score: {score}\'</code>と<code>\'Press R to Retry\'</code>を追加します。</p>',
        '<p><strong>解説：</strong> <code>state == \'over\'</code> 側の描画ブロックに、<code>f\'Final Score: {score}\'</code> と <code>\'Press R to Retry\'</code> の 2 つの <code>game_draw_text</code> を追加するだけです。フォントサイズや色を変えると、メリハリのある画面になります。</p>'
    ),
    # ===== 課題2 リード =====
    (
        '<p>ゲームオーバー中にRキーを押すと、スコアをリセットして再プレイできるようにしましょう。</p>',
        '<p>ゲームオーバー中に R キーを押すと、スコア・座標などを初期値に戻して再プレイできるようにしてみましょう。「もう 1 回」の動線を作る練習です。</p>'
    ),
    # ===== 課題2 解説 =====
    (
        '<p><strong>解説：</strong> <code>state == \'over\'</code>中にRキーが押されたとき、<code>score=0, px=300, py=320, ex=random, ey=-48, state=\'play\'</code>にリセットします。</p>',
        '<p><strong>解説：</strong> <code>state == \'over\'</code> のときに R キー押下を検知し、<code>score=0, px=300, py=320, ex=random, ey=-48, state=\'play\'</code> と一通りの変数を初期値に戻します。リセットする変数が増えてきたら、関数 <code>reset_game()</code> としてまとめると見通しが良くなります。</p>'
    ),
    # ===== 課題3 リード =====
    (
        '<p>変数<code>lives</code>=3を用意し、衝突のたびに残機を1減らして、0になったらゲームオーバーにしましょう。</p>',
        '<p>変数 <code>lives</code> = 3 を用意し、敵に衝突するたびに残機を 1 減らし、0 になった時点でゲームオーバーにしてみましょう。アクションゲームの定番「3 機制」の実装です。</p>'
    ),
    # ===== 課題3 解説 =====
    (
        '<p><strong>解説：</strong> 衝突時に<code>lives -= 1</code>し、<code>lives &lt;= 0</code>になったら<code>state = \'over\'</code>。残機がある間は敵をリセットして続行します。</p>',
        '<p><strong>解説：</strong> 衝突時に <code>lives -= 1</code> したあと、<code>lives &lt;= 0</code> なら <code>state = \'over\'</code> に切り替えます。残機が残っていればプレイヤーは生存しているので、敵だけランダム位置に戻して仕切り直す流れにすると、自然な「ライフ消費」の動きになります。</p>'
    ),
    # ===== まとめ =====
    (
        '<ul><li><code>running = False</code>でゲームループを終了できます</li><li><code>state</code>変数でプレイ中とゲームオーバーを切り替えると画面遷移が作れます</li><li>Rキーでリスタートする実装は「全変数を初期値に戻す」だけです</li></ul>',
        '<ul><li><code>running = False</code> でゲームループを抜けることができます。</li><li><code>state</code> 変数を使うと「プレイ中」と「ゲームオーバー」のような画面遷移が作れます。</li><li>R キーでのリスタートは、関連する変数を初期値に戻すだけで実装できます。</li></ul>'
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
