#!/usr/bin/env python3
"""WP記事4077（Pygame⑰ まとめ②パドルゲーム）をモジュール版に全面書き直す。"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_update  # noqa

PAGE_ID      = 4077
CACHE_BUSTER = "?v=20260508i"
GAME_BASE    = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"
EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-4-16_paddle.png"

TITLE = "【Pygameでゲーム⑰】まとめ②パドルゲームを作ろう"


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


PADDLE_PY = """\
import pygame

def get_x(mx):
    if mx < 48:  mx = 48
    if mx > 592: mx = 592
    return mx"""

STEP1_CODE = """\
# ゲームループ内
mx    = pygame.mouse.get_pos()[0]   # マウスの X 座標を取得
pad_x = paddle.get_x(mx)            # クランプして安全な座標に"""

FULL_CODE = """\
import pygame
import paddle   # paddle.py を自動インポート

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Breakout")
clock  = pygame.time.Clock()
font   = pygame.font.SysFont(None, 36)

blocks = []
for r in range(3):
    for c in range(8):
        blocks.append([c * 76 + 10, r * 32 + 20, True])
pad_x  = 272
bx, by = 312, 200
vx, vy = 3,   -3
score  = 0
state  = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        mx    = pygame.mouse.get_pos()[0]
        pad_x = paddle.get_x(mx)
        bx += vx
        by += vy
        if bx < 0 or bx > 624: vx = -vx
        if by < 0:              vy = -vy
        pad_rect  = pygame.Rect(pad_x - 48, 350, 96, 12)
        ball_rect = pygame.Rect(bx, by, 16, 16)
        if ball_rect.colliderect(pad_rect):
            vy = -abs(vy)
        for b in blocks:
            if b[2] and ball_rect.colliderect(pygame.Rect(b[0], b[1], 72, 24)):
                b[2]   = False
                vy     = -vy
                score += 1
        if by > 400:
            state = "over"
        if all(not b[2] for b in blocks):
            state = "clear"
        pygame.draw.rect(screen,    "#5cd6ff", (pad_x - 48, 350, 96, 12))
        pygame.draw.ellipse(screen, "#ffffff", (bx, by, 16, 16))
        for b in blocks:
            if b[2]:
                pygame.draw.rect(screen, "#ff9933", (b[0], b[1], 72, 24))
        screen.blit(font.render(f"Score: {score}", True, (255, 255, 255)), (10, 10))
    elif state == "over":
        screen.blit(font.render("GAME OVER",       True, (255, 60,  60)),  (220, 180))
        screen.blit(font.render(f"Score: {score}", True, (255, 255, 255)), (260, 230))
    elif state == "clear":
        screen.blit(font.render("CLEAR!",          True, (255, 220,   0)), (260, 180))
        screen.blit(font.render(f"Score: {score}", True, (255, 255, 255)), (260, 230))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()"""

ANS1_CODE = """\
# ブロックを4段に変更（range(3) → range(4)）
for r in range(4):
    for c in range(8):
        blocks.append([c * 76 + 10, r * 32 + 20, True])"""

ANS2_CODE = """\
# 段ごとに色を変える
COLORS = [(255, 50, 50), (255, 220, 0), (50, 220, 50)]
# 生成時に行番号 r も保存
blocks.append([c * 76 + 10, r * 32 + 20, True, r])
# 描画時に COLORS[b[3]] を使う
for b in blocks:
    if b[2]:
        pygame.draw.rect(screen, COLORS[b[3] % 3], (b[0], b[1], 72, 24))"""

ANS3_CODE = """\
# ブロックを5個壊すごとにボールを加速
if b[2] and ball_rect.colliderect(pygame.Rect(b[0], b[1], 72, 24)):
    b[2]   = False
    vy     = -vy
    score += 1
    sp = 3 + score // 5          # 5個ごとに +1
    vx = sp if vx > 0 else -sp
    vy = -sp if vy < 0 else sp"""

CONTENT = f"""\
<!-- wp:paragraph -->
<p>マウスで動かすパドルと跳ね返るボールを組み合わせて「ブロック崩し」を作りましょう。パドルの座標計算を <code>paddle.py</code> モジュールに切り出すことで、<code>main.py</code> は衝突判定やボール処理に集中できます。</p>
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
<ul><li>パドルの位置計算を <code>paddle.py</code> に切り出してモジュール化する</li><li><code>paddle.get_x(mx)</code> でマウス座標をクランプして安全な X 座標を返す</li><li>ブロックをリストで管理し、衝突で <code>False</code> にして消去する</li><li><code>all(not b[2] for b in blocks)</code> でクリア判定する</li></ul>
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>paddle.py を作ろう</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>「<strong>＋</strong>」ボタンで <code>paddle.py</code> を追加し、<code>get_x(mx)</code> 関数を定義します。マウスの X 座標を受け取り、パドルが画面端に埋まらないよう 48〜592 の範囲にクランプして返します。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
{shot("game_16_paddle_py", 441)}
<!-- /wp:html -->

<!-- wp:html -->
{code_block(PADDLE_PY)}
<!-- /wp:html -->

<!-- wp:paragraph -->
<p><strong>ポイント：</strong>パドルの横幅が 96px（左右 48px ずつ）なので、中心 <code>pad_x</code> を 48〜592 の範囲に制限すれば、パドル全体が画面内に収まります。クランプの境界値はパドル幅に合わせて調整してください。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {{"level":2}} -->
<h2>main.py から呼び出す</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><code>main.py</code> のゲームループ内でマウス座標を取得し、すぐ <code>paddle.get_x(mx)</code> に渡します。戻り値が安全なパドル中心 X 座標です。以下はパドルゲーム完成版の全ブロック図と完成コードです。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
{shot("game_16_main_full", 1444)}
<!-- /wp:html -->

<!-- wp:html -->
{code_block(FULL_CODE)}
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>演習課題</h2>
<!-- /wp:heading -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-17-1：ブロックを4段に増やそう</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p><code>range(3)</code> を <code>range(4)</code> に変えて、ブロックを1段追加しましょう。ブロック数が増えるとスコアも増えます。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{shot("game_16_ans1", 1728)}
{code_block(ANS1_CODE)}
<p><strong>解説：</strong> ループの上限を変えるだけです。段が増えると初期 Y 座標が下がるので、ボールが届きやすくなるメリットもあります。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-17-2：段ごとにブロックの色を変えよう</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p>1段目：赤、2段目：黄、3段目：緑のように、段番号で色を切り替えてみましょう。ブロックリストに行番号 <code>r</code> を一緒に保存するのがポイントです。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{shot("game_16_ans2", 1818)}
{code_block(ANS2_CODE)}
<p><strong>解説：</strong> ブロックの生成時に <code>r</code>（行番号）を 4 要素目として追加します。描画時に <code>COLORS[b[3] % 3]</code> で行に対応した色を選ぶだけです。<code>% 3</code> で4段目以降も循環します。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-17-3：ブロックを壊すたびにボールを加速させよう</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p>5個ブロックを壊すごとにボールの速度を +1 してみましょう。スコアを使って速度を計算します。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{shot("game_16_ans3", 806)}
{code_block(ANS3_CODE)}
<p><strong>解説：</strong> <code>score // 5</code> でブロックを5個壊すごとに速度が 1 上がります。<code>vx</code> と <code>vy</code> は符号（方向）を保ちながら絶対値だけ変えるのがコツです。速くなりすぎる場合は上限を設けましょう。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>まとめ</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<ul><li>パドルのクランプ処理を <code>paddle.py</code> に切り出すと、<code>main.py</code> は衝突判定やゲーム状態管理に集中できます。</li><li><code>vy = -abs(vy)</code> のようにパドル衝突時は必ず上方向に揃えると、ボールが床に埋まるバグを防げます。</li><li><code>all(not b[2] for b in blocks)</code> で全ブロックの消滅を 1 行で判定できます。</li></ul>
<!-- /wp:html -->
"""


def main():
    print(f"更新: page {PAGE_ID} → {TITLE}")
    wp_update(PAGE_ID, CONTENT, status="draft", title=TITLE)
    print("反映完了")


if __name__ == "__main__":
    main()
