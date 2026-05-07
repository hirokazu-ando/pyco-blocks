#!/usr/bin/env python3
"""WP記事4075（Pygame⑮ タイマーで難易度を上げよう）をモジュール版に全面書き直す。"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_update  # noqa

PAGE_ID      = 4075
CACHE_BUSTER = "?v=20260507i"
GAME_BASE    = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"
EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-4-14_timer.png"

TITLE = "【Pygameでゲーム⑮】タイマーで難易度を上げよう"


def shot(basename: str, width: int) -> str:
    """メインコンテンツ用スクリーンショット図（details 外）"""
    url = f"{GAME_BASE}/screenshots/{basename}.png{CACHE_BUSTER}"
    return (
        f'<figure style="margin:8px 0 24px;">'
        f'<img src="{url}" alt="{basename}" loading="lazy" decoding="async" '
        f'style="border:1px solid #e2e8f0; border-radius:8px; display:block; margin:0 auto; '
        f'width:{width}px; max-width:100%; height:auto;" /></figure>'
    )


def ans_shot(basename: str, width: int, alt: str = "ブロック例",
             label: str = "ブロックの組み合わせ例（スクリーンショット）：") -> str:
    """模範解答用スクリーンショット図（details 内）"""
    url = f"{GAME_BASE}/screenshots/{basename}.png{CACHE_BUSTER}"
    return (
        f'<p>{label}</p>\n'
        f'<figure style="margin:8px 0 16px;">'
        f'<img src="{url}" alt="{alt}" loading="lazy" decoding="async" '
        f'style="border:1px solid #e2e8f0; border-radius:8px; display:block; margin:0 auto; '
        f'width:{width}px; max-width:100%; height:auto;" /></figure>'
    )


def code_block(src: str, lang: str = "python") -> str:
    esc = src.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    label = "Python" if lang == "python" else lang
    return (
        '<div class="hcb_wrap">'
        f'<pre class="prism line-numbers lang-{lang}" data-lang="{label}">'
        f'<code>{esc}</code></pre></div>'
    )


TIMER_PY = """\
import pygame

def elapsed():
    return pygame.time.get_ticks() / 1000

def remain(limit):
    return max(0, limit - elapsed())"""

STEP1_CODE = """\
# ゲームループ内（抜粋）
elapsed = timer.elapsed()          # 経過秒数を取得
espeed  = 2 + int(elapsed // 5)   # 5 秒ごとに +1 加速
ey     += espeed                   # 敵を落下させる"""

STEP1_FULL_CODE = """\
import pygame
import random
import timer

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Timer Speed")
clock  = pygame.time.Clock()
font   = pygame.font.SysFont(None, 36)

px = 296
ex = random.randint(0, 592)
ey = -48
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
    px = max(0, min(592, px))
    elapsed = timer.elapsed()
    espeed  = 2 + int(elapsed // 5)
    ey     += espeed
    if ey > 400:
        ex = random.randint(0, 592)
        ey = -48
    pygame.draw.rect(screen, "#5cd6ff", (px, 330, 48, 48))
    pygame.draw.rect(screen, "#ff4466", (ex, ey,  48, 48))
    screen.blit(font.render(f"Speed: {{espeed}}", True, (180, 180, 180)), (10, 10))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()"""

STEP2_CODE = """\
# ゲームループ内（抜粋）
remain = timer.remain(TIME_LIMIT)  # 残り時間（秒）を取得
if remain <= 0:
    state = "clear"                # 時間切れでクリアへ"""

FULL_CODE = """\
import pygame
import random
import timer   # timer.py を自動インポート

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Timer Game")
clock  = pygame.time.Clock()
font   = pygame.font.SysFont(None, 36)

TIME_LIMIT = 30
px = 296
ex = random.randint(0, 592)
ey = -48
state  = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
        if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
        px = max(0, min(592, px))
        elapsed = timer.elapsed()
        espeed  = 2 + int(elapsed // 5)
        ey     += espeed
        if ey > 400:
            ex = random.randint(0, 592)
            ey = -48
        remain = timer.remain(TIME_LIMIT)
        if remain <= 0:
            state = "clear"
        pygame.draw.rect(screen, "#5cd6ff", (px, 330, 48, 48))
        pygame.draw.rect(screen, "#ff4466", (ex, ey,  48, 48))
        col = (255, 60, 60) if remain < 10 else (255, 255, 255)
        screen.blit(font.render(f"Time: {{int(remain)}}", True, col),          (10, 10))
        screen.blit(font.render(f"Speed: {{espeed}}",     True, (180,180,180)), (10, 46))
    elif state == "clear":
        screen.blit(font.render("CLEAR!", True, (255, 220, 0)), (260, 180))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()"""

ANS1_CODE = """\
# state == "play" の描画セクション（抜粋）
remain = timer.remain(TIME_LIMIT)
if remain <= 0:
    state = "clear"
col = (255, 60, 60) if remain < 10 else (255, 255, 255)
screen.blit(font.render(f"Time: {{int(remain)}}", True, col), (10, 10))"""

ANS2_FULL_CODE = """\
import pygame
import random
import timer

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Timer Game")
clock  = pygame.time.Clock()
font   = pygame.font.SysFont(None, 36)

TIME_LIMIT = 30
px      = 296
enemies = [[random.randint(0, 592), -48]]
state   = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
        if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
        px = max(0, min(592, px))
        num_enemies = min(5, 1 + int(timer.elapsed() // 10))
        while len(enemies) < num_enemies:
            enemies.append([random.randint(0, 592), -48])
        elapsed = timer.elapsed()
        espeed  = 2 + int(elapsed // 5)
        for e in enemies:
            e[1] += espeed
            if e[1] > 400:
                e[0] = random.randint(0, 592)
                e[1] = -48
        remain = timer.remain(TIME_LIMIT)
        if remain <= 0:
            state = "clear"
        pygame.draw.rect(screen, "#5cd6ff", (px, 330, 48, 48))
        for e in enemies:
            pygame.draw.rect(screen, "#ff4466", (e[0], e[1], 48, 48))
        col = (255, 60, 60) if remain < 10 else (255, 255, 255)
        screen.blit(font.render(f"Time: {{int(remain)}}", True, col),          (10, 10))
        screen.blit(font.render(f"Speed: {{espeed}}",     True, (180,180,180)), (10, 46))
    elif state == "clear":
        screen.blit(font.render("CLEAR!", True, (255, 220, 0)), (260, 180))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()"""

ANS3_TIMER_CODE = """\
import pygame

def elapsed():
    return pygame.time.get_ticks() / 1000

def remain(limit):
    return max(0, limit - elapsed())

def speed_step(base, accel):
    return base + accel * int(elapsed() // 10)"""

ANS3_MAIN_CODE = """\
# main.py — speed_step を使って速度計算を timer.py に委ねる
espeed = int(timer.speed_step(2, 1))   # base=2、10秒ごとに +1
ey    += espeed"""

CONTENT = f"""\
<!-- wp:paragraph -->
<p>⑭ で学んだモジュールの使い方を活かして、タイマー機能を <code>timer.py</code> という専用ファイルに切り出しましょう。<code>timer.elapsed()</code> で経過時間を、<code>timer.remain(limit)</code> で残り時間を取得できるようにします。</p>
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
<ul><li>経過時間を返す <code>timer.elapsed()</code> の作り方と使い方</li><li>残り時間を返す <code>timer.remain(limit)</code> の作り方と使い方</li><li>時間によって敵の速度を変える難易度カーブの実装</li><li>制限時間つきのゲームオーバー／クリア判定</li></ul>
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>timer.py を作ろう</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>まず「<strong>＋</strong>」ボタンで <code>timer.py</code> というサブファイルを追加し、次の2つの関数を定義します。<code>elapsed()</code> は経過秒数、<code>remain(limit)</code> は残り時間を返します。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
{shot("game_14_timer_py", 1013)}
<!-- /wp:html -->

<!-- wp:html -->
{code_block(TIMER_PY)}
<!-- /wp:html -->

<!-- wp:paragraph -->
<p><strong>ポイント：</strong><code>remain</code> の中から同じファイルの <code>elapsed()</code> を呼んでいます。モジュール内の関数同士が呼び合えるのもモジュール化の利点です。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {{"level":2}} -->
<h2>ステップ1：経過時間で敵を加速させよう</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<ol><li><code>main.py</code> タブに切り替えます</li><li>ゲームループ内の敵処理の前に <strong>変数 elapsed にする ＝ モジュール timer の関数 elapsed の結果</strong> ブロックを置きます（引数なし）</li><li>続けて <code>espeed = 2 + elapsed // 5</code> を計算し、<code>ey += espeed</code> で敵を落下させます</li><li>&#x25b6; 実行して、時間とともに敵が加速すれば成功です</li></ol>
<!-- /wp:html -->

<!-- wp:html -->
{shot("game_14_step1", 847)}
<!-- /wp:html -->

<!-- wp:html -->
{code_block(STEP1_CODE)}
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>ステップ1完成後の全体コードは以下の通りです。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
{code_block(STEP1_FULL_CODE)}
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>ステップ2：カウントダウンタイマーを追加しよう</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<ol><li>定数 <code>TIME_LIMIT = 30</code> をループの外で設定します</li><li>ゲームループ内に <strong>変数 remain にする ＝ モジュール timer の関数 remain（引数：30）の結果</strong> ブロックを置きます</li><li>「もし remain &lt;= 0 なら state = "clear"」を追加します</li><li>描画セクションで <code>Time: {{int(remain)}}</code> を表示します</li><li>&#x25b6; 実行して30秒経つとクリア画面になれば完成です</li></ol>
<!-- /wp:html -->

<!-- wp:html -->
{shot("game_14_step2", 833)}
<!-- /wp:html -->

<!-- wp:html -->
{code_block(STEP2_CODE)}
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>完成コード</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><code>timer.elapsed()</code> と <code>timer.remain()</code> を組み合わせた完成版です。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
{code_block(FULL_CODE)}
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>演習課題</h2>
<!-- /wp:heading -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-15-1：残り10秒でタイマーを赤くしよう</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p>残り時間が10秒を切ったら、タイマーの文字色を赤に変えてみましょう。<code>timer.remain()</code> の戻り値を条件として使います。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{ans_shot("game_14a_color_timer", 833, "残り時間による色切り替えブロック例")}
{code_block(ANS1_CODE)}
<p><strong>解説：</strong> <code>timer.remain(TIME_LIMIT) &lt; 10</code> を条件にして文字色を切り替えます。<code>remain</code> 変数を一度取得しておくと、複数の条件判定や表示でも同じ値が使えます。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-15-2：10秒ごとに敵を1体ずつ増やそう（最大5体）</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p>敵をリストで管理し、10秒ごとに1体追加（最大5体）してみましょう。<code>timer.elapsed()</code> を使って必要な体数を計算します。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{ans_shot("game_14b_enemy_list", 1597, "敵を増やすブロック例")}
{code_block(ANS2_FULL_CODE)}
<p><strong>解説：</strong> <code>1 + int(timer.elapsed() // 10)</code> で「10秒ごとに1体増える」体数が求まります。<code>min(5, ...)</code> で上限5体に制限し、<code>while len(enemies) &lt; num_enemies:</code> で足りない分だけ追加します。敵リスト <code>enemies</code> の各要素 <code>[x, y]</code> を <code>for</code> ループで動かして衝突判定・描画も行います。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":3}} -->
<h3>課題4-15-3：timer.py に速度計算も持たせよう</h3>
<!-- /wp:heading -->

<!-- wp:html -->
<p><code>timer.py</code> に <code>speed_step(base, accel)</code> という関数を追加して、<code>main.py</code> の速度計算をそちらに委ねてみましょう。</p>
<!-- /wp:html -->

<!-- wp:html -->
<details>
<summary>&#x25b6; 模範解答と解説を見る</summary>
{ans_shot("game_14c_speed_step", 1441, "speed_step関数のブロック例（timer.py）", "timer.py 側のブロック：")}
{code_block(ANS3_TIMER_CODE)}
{code_block(ANS3_MAIN_CODE)}
<p><strong>解説：</strong> <code>speed_step(base, accel)</code> は「<code>base</code> を起点に、10秒ごとに <code>accel</code> ずつ速くなる速度」を返します。タイマーに関わる計算をすべて <code>timer.py</code> に集約すると、<code>main.py</code> がさらにすっきりします。</p>
</details>
<!-- /wp:html -->

<!-- wp:heading {{"level":2}} -->
<h2>まとめ</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<ul><li><code>timer.py</code> に <code>elapsed()</code> と <code>remain(limit)</code> を定義しておくと、<code>main.py</code> の可読性が大幅に上がります。</li><li><code>timer.elapsed()</code> はゲーム開始からの経過秒数、<code>timer.remain(30)</code> は残り時間を返します。</li><li>モジュールに処理を委ねることで、<code>main.py</code> はゲームの「流れ」だけに集中できます。</li></ul>
<!-- /wp:html -->
"""


def main():
    print(f"更新: page {PAGE_ID} → {TITLE}")
    wp_update(PAGE_ID, CONTENT, status="draft", title=TITLE)
    print("反映完了")


if __name__ == "__main__":
    main()
