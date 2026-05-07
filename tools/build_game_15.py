#!/usr/bin/env python3
"""WP記事4076（Pygame⑯ まとめ①よけゲーム）をモジュール版に全面書き直す。"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_update  # noqa

PAGE_ID      = 4076
CACHE_BUSTER = "?v=20260507j"
GAME_BASE    = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"
EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-4-15_dodge.png"

TITLE = "【Pygameでゲーム⑯】まとめ①よけゲームを作ろう"


def shot(basename: str, width: int) -> str:
    url = f"{GAME_BASE}/screenshots/{basename}.png{CACHE_BUSTER}"
    return (
        f'<figure style="margin:8px 0 24px;">'
        f'<img src="{url}" alt="{basename}" loading="lazy" decoding="async" '
        f'style="border:1px solid #e2e8f0; border-radius:8px; display:block; margin:0 auto; '
        f'width:{width}px; max-width:100%; height:auto;" /></figure>'
    )


def code_block(src: str) -> str:
    esc = src.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return (
        '<div class="hcb_wrap">'
        '<pre class="prism line-numbers lang-python" data-lang="Python">'
        f'<code>{esc}</code></pre></div>'
    )


PLAYER_PY = """\
import pygame

def move_x(px):
    if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
    if px < 0:   px = 0
    if px > 592: px = 592
    return px

def move_y(py):
    if pygame.key.get_pressed()[pygame.K_UP]:   py -= 4
    if pygame.key.get_pressed()[pygame.K_DOWN]: py += 4
    if py < 0:   py = 0
    if py > 352: py = 352
    return py"""

STEP1_CODE = """\
# ゲームループ内
px = player.move_x(px)   # 左右キーで移動・クランプ
py = player.move_y(py)   # 上下キーで移動・クランプ"""

FULL_CODE = """\
import pygame
import random
import player   # player.py を自動インポート

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Dodge Game")
clock  = pygame.time.Clock()
font   = pygame.font.SysFont(None, 36)

px     = 296
py     = 176
ex     = random.randint(0, 592)
ey     = -48
score  = 0
state  = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        px = player.move_x(px)
        py = player.move_y(py)
        ey += 3
        if ey > 400:
            ex = random.randint(0, 592)
            ey = -48
            score += 1
        if abs(px - ex) < 48 and abs(py - ey) < 48:
            state = "over"
        pygame.draw.rect(screen, "#5cd6ff", (px, py, 48, 48))
        pygame.draw.rect(screen, "#ff4466", (ex, ey, 48, 48))
        screen.blit(font.render(f"Score: {score}", True, (255, 255, 255)), (10, 10))
    elif state == "over":
        screen.blit(font.render("GAME OVER",       True, (255, 60, 60)),   (220, 160))
        screen.blit(font.render(f"Score: {score}", True, (255, 255, 255)), (260, 210))
        screen.blit(font.render("R: Retry",        True, (180, 180, 180)), (260, 256))
        if pygame.key.get_pressed()[pygame.K_r]:
            px, py = 296, 176
            ex     = random.randint(0, 592)
            ey     = -48
            score  = 0
            state  = "play"
    pygame.display.flip()
    clock.tick(60)
pygame.quit()"""

ANS1_CODE = """\
# player.py: speed 引数を追加
def move_x(px, speed=4):
    if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= speed
    if pygame.key.get_pressed()[pygame.K_RIGHT]: px += speed
    if px < 0:   px = 0
    if px > 592: px = 592
    return px

# main.py 側（速さ 6 に変更）
px = player.move_x(px, 6)"""

ANS2_CODE = """\
# main.py に timer モジュールを追加
import timer
TIME_LIMIT = 30
...
remain = timer.remain(TIME_LIMIT)
if remain <= 0:
    state = "over"
col = (255, 60, 60) if remain < 10 else (255, 255, 255)
screen.blit(font.render(f"Time: {int(remain)}", True, col), (10, 46))"""

ANS3_CODE = """\
# main.py: 敵をリストで管理
enemies = [[random.randint(0, 592), -48],
           [random.randint(0, 592), -200]]
for e in enemies:
    e[1] += 3
    if e[1] > 400:
        e[0] = random.randint(0, 592)
        e[1] = -48
        score += 1
    if abs(px - e[0]) < 48 and abs(py - e[1]) < 48:
        state = "over"
    pygame.draw.rect(screen, "#ff4466", (e[0], e[1], 48, 48))"""

CONTENT = f"""\
<!-- wp:paragraph -->
<p>⑤〜⑭ で学んできた技術をすべて組み合わせて「よけゲーム」を完成させましょう。プレイヤーの移動処理を <code>player.py</code> モジュールに切り出すことで、<code>main.py</code> がゲームの「流れ」だけに集中できるシンプルな構成になります。</p>
<!-- /wp:paragraph -->
<!-- wp:html -->
<figure style="margin:8px 0 24px;"><img src="{EYECATCH_URL}" alt="{TITLE}" loading="lazy" decoding="async" style="display:block; margin:0 auto; width:512px; max-width:100%; height:auto; border-radius:12px;" /></figure>
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>まずはPycoBlocksを開こう</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>下の<a href="https://hirokazu-ando.github.io/pyco-blocks/?mode=game" target="_blank">PycoBlocks</a>で直接作業するか、別タブで開いてください。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<iframe frameborder="0" height="620" src="https://hirokazu-ando.github.io/pyco-blocks/?mode=game" style="border:1px solid #ccc; border-radius:8px; display:block; margin:16px 0;" width="100%">
</iframe>
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>この記事で学ぶこと</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<ul><li>プレイヤーの移動処理を <code>player.py</code> に切り出してモジュール化する</li><li><code>player.move_x(px)</code> / <code>player.move_y(py)</code> で左右・上下移動を呼び出す</li><li>敵の出現・衝突判定・スコア加算でゲームループを構成する</li><li><code>state</code> 変数でプレイ中／ゲームオーバーを切り替える</li></ul>
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>player.py を作ろう</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>まず「<strong>＋</strong>」ボタンで <code>player.py</code> というサブファイルを追加し、2つの関数を定義します。<code>move_x(px)</code> は左右移動と水平クランプ、<code>move_y(py)</code> は上下移動と垂直クランプをそれぞれ担当し、更新後の座標を返します。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
{shot("game_15_player_py", 1008)}
<!-- /wp:html -->

<!-- wp:html -->
{code_block(PLAYER_PY)}
<!-- /wp:html -->

<!-- wp:paragraph -->
<p><strong>ポイント：</strong>各関数は座標を受け取り、移動・クランプ後の新しい座標を <code>return</code> で返します。<code>main.py</code> 側で <code>px = player.move_x(px)</code> と書くだけで座標が更新されるため、メインループが非常にすっきりします。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {{"level":2}} -->
<h2>main.py から呼び出す</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><code>main.py</code> タブに切り替えて、ゲームループ内でモジュール呼び出しブロックを使い <code>player.move_x(px)</code> と <code>player.move_y(py)</code> を呼びます。戻り値をそのまま <code>px</code> / <code>py</code> に代入するだけです。以下はよけゲーム完成版の全ブロック図と完成コードです。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
{shot("game_15_main_full", 1454)}
<!-- /wp:html -->

<!-- wp:html -->
{code_block(FULL_CODE)}
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>演習課題</h2>
<!-- /wp:heading -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-16-1：player.py に速さ引数を追加しよう</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p><code>move_x(px, speed=4)</code> のように速さをデフォルト引数にして、<code>main.py</code> から速さを渡せるようにしましょう。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{shot("game_15_ans1_player", 654)}
{code_block(ANS1_CODE)}
<p><strong>解説：</strong> <code>speed=4</code> はデフォルト引数です。呼び出し側で <code>player.move_x(px, 6)</code> と書けば速さ6で動きます。<code>player.py</code> の1行だけ変えればゲームの難易度が変わる――これがモジュール化の力です。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-16-2：timer.py と組み合わせてカウントダウンを追加しよう</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p>⑭ で作った <code>timer.py</code> を <code>import</code> して、制限時間が 0 になると GAME OVER になるようにしましょう。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{shot("game_15_ans2_main", 1022)}
{code_block(ANS2_CODE)}
<p><strong>解説：</strong> <code>timer.remain(TIME_LIMIT)</code> が 0 以下になると <code>state = "over"</code> に移行します。残り10秒で文字を赤くするのも ⑭ で学んだテクニックです。複数のモジュールを組み合わせると機能が増えても <code>main.py</code> は短いまま保てます。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-16-3：敵を2体に増やそう</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p>敵をリストで管理して2体同時に出現させましょう。衝突判定も全敵に対してループで行います。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{shot("game_15_ans3_main", 1785)}
{code_block(ANS3_CODE)}
<p><strong>解説：</strong> <code>enemies</code> リストに <code>[x, y]</code> を格納して <code>for e in enemies:</code> でループします。体数が増えても処理の書き方は変わりません。初期 y 座標をずらすと出現タイミングがばらけて自然に見えます。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>まとめ</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<ul><li>移動処理を <code>player.py</code> に切り出すと、<code>main.py</code> はゲームの「流れ」だけに集中できます。</li><li><code>player.move_x(px)</code> / <code>player.move_y(py)</code> のように関数を呼んで戻り値で座標を更新するのが基本パターンです。</li><li>複数の <code>.py</code> ファイルを組み合わせることで、大きなゲームも整理された状態で作れます。</li></ul>
<!-- /wp:html -->
"""


def main():
    print(f"更新: page {PAGE_ID} → {TITLE}")
    wp_update(PAGE_ID, CONTENT, status="draft", title=TITLE)
    print("反映完了")


if __name__ == "__main__":
    main()
