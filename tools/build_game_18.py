#!/usr/bin/env python3
"""WP 記事 5000 (Pygame⑱ ライフ制とリスポーン) の本文を組み立てて反映する。

build_game_TEMPLATE.py の SPEC を埋めて使う方式。
eyecatch は WP メディア (media_id=4999) を直接参照する。
Part 5 より関数分け（update_play/draw_play）構造を採用。
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_game_TEMPLATE import (  # noqa: E402
    Kadai,
    PYCOBLOCKS_HOME,
    Spec,
    Step,
    _closest_base,
    _iframe,
    _kadai_section,
    _step_section,
    _wp_h2,
    _wp_html,
    _wp_p,
    _wp_table,
    _wp_ul,
)
from build_helpers import wp_get, wp_update  # noqa: E402

EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-5-18_lives.png"


def _eyecatch_wp(url: str) -> str:
    return (
        '<figure style="margin:8px 0 16px;">'
        f'<img src="{url}" alt="アイキャッチ" loading="lazy" decoding="async" '
        'style="display:block; margin:0 auto; width:512px; max-width:100%; '
        'height:auto; border-radius:12px;" />'
        '</figure>'
    )


def build_content(spec: Spec) -> str:
    sections: list[str] = []
    for p in spec.intro_paragraphs:
        sections.append(_wp_p(p))
    sections.append(_wp_html(_eyecatch_wp(EYECATCH_URL)))
    sections.append(_wp_h2("まずはPycoBlocksを開こう"))
    open_url = f"{PYCOBLOCKS_HOME}?mode=game&amp;src=samples/game/{spec.iframe_xml}"
    sections.append(_wp_p(
        f'下の <a href="{open_url}" target="_blank" rel="noopener">PycoBlocks</a> を開いて、'
        '今回のサンプルブロックを読み込んだ状態から始めましょう。'
    ))
    sections.append(_wp_html(_iframe(spec.iframe_xml)))
    sections.append(_wp_h2("この記事で学ぶこと"))
    sections.append(_wp_ul(spec.learn_bullets))
    sections.append(_wp_h2(spec.terms_h2))
    sections.append(_wp_p(spec.terms_intro))
    sections.append(_wp_table(spec.terms_table))
    for idx, step in enumerate(spec.steps, start=1):
        base = spec.steps[idx - 2].code if idx > 1 else None
        sections.append(_step_section(idx, step, spec.cache_buster, base_code=base))
    sections.append(_wp_h2("演習課題"))
    step_codes = [s.code for s in spec.steps]
    for k in spec.kadais:
        base = _closest_base(k.code, step_codes)
        sections.append(_kadai_section(k, spec.cache_buster, base_code=base))
    sections.append(_wp_h2("まとめ"))
    sections.append(_wp_ul(spec.summary_bullets))
    next_url = f"https://sakigake-robo.com/?p={spec.next_article_id}"
    sections.append(_wp_p(
        f'次の記事 → <a href="{next_url}">{spec.next_article_title}</a>'
    ))
    return "\n\n".join(sections)


# ── Python コード（関数分け構造） ──────────────────────────────────────

CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives System")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
lives = 3
state = "play"


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    gf.ey += 3
    if gf.ey > 400:
        gf.ey = -48
        gf.ex = random.randint(0, 576)
    if abs(gf.px - gf.ex) < 40 and abs(330 - gf.ey) < 40:
        gf.lives -= 1
        gf.ey = -48
        gf.ex = random.randint(0, 576)
        if gf.lives <= 0:
            gf.state = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.ex, gf.ey))
    _f = pygame.font.SysFont(None, 24)
    gf.screen.blit(_f.render(f\'Lives: {gf.lives}\', True, "#ffffff"), (10, 10))


# ─── update_over.py ────────────────────────────────────────────
import game_funcs as gf

def update_over():
    pass


# ─── draw_over.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_over():
    _f = pygame.font.SysFont(None, 40)
    gf.screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    if gf.state == "play":
        update_play()
        draw_play()
    else:
        update_over()
        draw_over()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''

CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives + Invincible")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
lives = 3
itimer = 0
state = "play"


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    gf.ey += 3
    if gf.ey > 400:
        gf.ey = -48
        gf.ex = random.randint(0, 576)
    if pygame.time.get_ticks() >= gf.itimer and abs(gf.px - gf.ex) < 40 and abs(330 - gf.ey) < 40:
        gf.lives -= 1
        gf.ey = -48
        gf.ex = random.randint(0, 576)
        gf.itimer = pygame.time.get_ticks() + 1 * 1000
        if gf.lives <= 0:
            gf.state = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.ex, gf.ey))
    _f = pygame.font.SysFont(None, 24)
    gf.screen.blit(_f.render(f\'Lives: {gf.lives}\', True, "#ffffff"), (10, 10))


# ─── update_over.py ────────────────────────────────────────────
import game_funcs as gf

def update_over():
    pass


# ─── draw_over.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_over():
    _f = pygame.font.SysFont(None, 40)
    gf.screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    if gf.state == "play":
        update_play()
        draw_play()
    else:
        update_over()
        draw_over()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''

CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Heart HUD")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
lives = 3
state = "play"


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    gf.ey += 3
    if gf.ey > 400:
        gf.ey = -48
        gf.ex = random.randint(0, 576)
    if abs(gf.px - gf.ex) < 40 and abs(330 - gf.ey) < 40:
        gf.lives -= 1
        gf.ey = -48
        gf.ex = random.randint(0, 576)
        if gf.lives <= 0:
            gf.state = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.ex, gf.ey))
    for i in range(gf.lives):
        _img = pygame.image.load("assets/game-icons/heart.svg")
        _rw = 30; _rh = 30
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        gf.screen.blit(_img, (10 + i * 36, 10))


# ─── update_over.py ────────────────────────────────────────────
import game_funcs as gf

def update_over():
    pass


# ─── draw_over.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_over():
    _f = pygame.font.SysFont(None, 40)
    gf.screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    if gf.state == "play":
        update_play()
        draw_play()
    else:
        update_over()
        draw_over()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''

CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Heart Heal Item")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
hx = random.randint(0, 600)
hy = -200
lives = 3
state = "play"


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    gf.ey += 3
    gf.hy += 2
    if gf.ey > 400:
        gf.ey = -48
        gf.ex = random.randint(0, 576)
    if gf.hy > 400:
        gf.hy = -200
        gf.hx = random.randint(0, 600)
    if abs(gf.px - gf.ex) < 40 and abs(330 - gf.ey) < 40:
        gf.lives -= 1
        gf.ey = -48
        gf.ex = random.randint(0, 576)
        if gf.lives <= 0:
            gf.state = "over"
    if abs(gf.px - gf.hx) < 36 and abs(330 - gf.hy) < 36:
        if gf.lives < 5:
            gf.lives += 1
        gf.hy = -200
        gf.hx = random.randint(0, 600)


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.ex, gf.ey))
    _img = pygame.image.load("assets/game-icons/heart.svg")
    _rw = 36; _rh = 36
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.hx, gf.hy))
    _f = pygame.font.SysFont(None, 24)
    gf.screen.blit(_f.render(f\'Lives: {gf.lives}\', True, "#ffffff"), (10, 10))


# ─── update_over.py ────────────────────────────────────────────
import game_funcs as gf

def update_over():
    pass


# ─── draw_over.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_over():
    _f = pygame.font.SysFont(None, 40)
    gf.screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    if gf.state == "play":
        update_play()
        draw_play()
    else:
        update_over()
        draw_over()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''

CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Slow When Invincible")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
lives = 3
itimer = 0
state = "play"


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    if pygame.time.get_ticks() >= gf.itimer:
        gf.ey += 3
    else:
        gf.ey += 1
    if gf.ey > 400:
        gf.ey = -48
        gf.ex = random.randint(0, 576)
    if pygame.time.get_ticks() >= gf.itimer and abs(gf.px - gf.ex) < 40 and abs(330 - gf.ey) < 40:
        gf.lives -= 1
        gf.ey = -48
        gf.ex = random.randint(0, 576)
        gf.itimer = pygame.time.get_ticks() + 2 * 1000
        if gf.lives <= 0:
            gf.state = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.ex, gf.ey))
    _f = pygame.font.SysFont(None, 24)
    gf.screen.blit(_f.render(f\'Lives: {gf.lives}\', True, "#ffffff"), (10, 10))


# ─── update_over.py ────────────────────────────────────────────
import game_funcs as gf

def update_over():
    pass


# ─── draw_over.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_over():
    _f = pygame.font.SysFont(None, 40)
    gf.screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    if gf.state == "play":
        update_play()
        draw_play()
    else:
        update_over()
        draw_over()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''


SPEC = Spec(
    page_id=5000,
    slug="game-18-lives",
    title="ライフ制とリスポーン",
    intro_paragraphs=[
        'Part 4 では <code>if state == "play":</code> ブロックの中にゲームのすべての処理を書いてきました。'
        'ゲームに機能を追加するたびにこのブロックが長くなり、'
        '「どこを変えればいいか」がわかりにくくなります。',
        'Part 5「改造道場」では、ゲームロジック（動き・判定）を '
        '<code>update_play()</code>、描画処理を <code>draw_play()</code> という'
        '<strong>関数</strong>に分けて書きます。'
        '今回は<strong>3 機制</strong>と<strong>無敵時間</strong>を実装しながら、'
        '整理されたモジュール構造を体験しましょう。',
    ],
    eyecatch_basename="eyecatch_game_18_lives",  # not used (overridden)
    iframe_xml="game_18_step1_final.xml",
    learn_bullets=[
        '<code>update_play()</code> と <code>draw_play()</code> 関数でゲームロジックと描画を分離する方法',
        '残機（<code>lives</code> 変数）で複数回の被弾を許容する仕組みを作る',
        '被弾時に敵をリスポーンさせ、<code>lives &lt;= 0</code> でゲームオーバーへ遷移する',
        '<code>pygame.time.get_ticks()</code> を使ったタイマーで無敵時間を実装する',
        '画面左上に「Lives: N」の HUD を <code>draw_play()</code> に表示する',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='モジュール構造とライフ制・無敵タイマーで使う言葉をまとめます。',
    terms_table=[
        ("update_play()", "ゲームロジック（移動・当たり判定・状態変化）をまとめた関数。機能追加はここに書く", "毎フレーム呼ばれる"),
        ("draw_play()", "描画処理（スプライト・HUD）をまとめた関数。表示変更はここに書く", "毎フレーム呼ばれる"),
        ("global", "関数の外で定義した変数を関数内で変更するときに必要な宣言", "global px, lives, state"),
        ("lives", "残りの機数（ライフ）を保持する数値変数", "lives = 3"),
        ("無敵時間", "被弾直後の短い時間、ダメージを受けない仕組み", "1 秒間"),
    ],
    steps=[
        Step(
            title="ゲームを関数で整理してライフ制を追加する",
            instructions=[
                'ゲームの処理を <code>update_play()</code>（ロジック）と <code>draw_play()</code>（描画）の '
                '2 つの関数に分けて書きます',
                '<code>update_play()</code> の先頭に <code>global px, ex, ey, lives, state</code> と書いて、'
                '変数の変更を宣言します',
                '<code>update_play()</code> に：キー入力・敵の落下・衝突判定・<code>lives -= 1</code>・'
                '<code>state = "over"</code> 判定を書きます',
                '<code>draw_play()</code> に：プレイヤー・敵の描画と <code>f"Lives: {lives}"</code> HUD を書きます',
                'メインループは <code>if state == "play": update_play(); draw_play()</code> とシンプルにまとめます',
                '▶ 実行して、3 回当たるまでゲームが続くこと、HUD のカウントが減ることを確認しましょう',
            ],
            figure_basename="game_18_step1_final",
            figure_width=1429,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '共有変数の置き場です。プレイヤー位置 <code>px</code>、敵位置 <code>ex</code>・<code>ey</code> に加えて、'
                                 '残機 <code>lives = 3</code> とゲーム状態 <code>state = "play"</code> を初期化します。'
                                 '<code>state</code> が "play" / "over" を切り替えることで画面遷移を表現します。',
                'update_play.py': 'プレイ中の毎フレーム更新を担当します。左右キーで <code>px</code> を動かし、敵を落下させ、'
                                  'プレイヤーに当たったら <code>lives -= 1</code>。<code>lives</code> が 0 以下になったら'
                                  '<code>state = "over"</code> に切り替えてゲームオーバー画面に遷移します。',
                'draw_play.py': 'プレイ中の毎フレーム描画を担当します。プレイヤーと敵を描いたあと、'
                                '<code>f"Lives: {lives}"</code> のテキスト HUD を画面左上に表示します。',
                'update_over.py': 'ゲームオーバー画面の状態更新を担当します。<code>R</code> キーが押されたら '
                                  '<code>lives</code> を 3 に戻し、敵もリセットして <code>state = "play"</code> へ戻します。',
                'draw_over.py': 'ゲームオーバー画面の描画を担当します。「GAME OVER」と「Press R to restart」の'
                                '2 行テキストを中央付近に表示するだけのシンプルな構成です。',
                'main.py': 'ゲームループ本体です。<code>state</code> の値で <code>update_play / draw_play</code> と '
                           '<code>update_over / draw_over</code> を呼び分けるだけ。'
                           '「画面ごとの処理は専用関数に書く」ルールが見える形になっています。',
            },
        ),
        Step(
            title="update_play() に無敵タイマーを追加する",
            instructions=[
                '変数 <code>itimer = 0</code> を初期化します（ゲームループの外）',
                '<code>update_play()</code> の <code>global</code> 宣言に <code>itimer</code> を追加します',
                '衝突判定に <code>pygame.time.get_ticks() &gt;= itimer</code> を AND 条件で追加し、'
                '無敵中はダメージを受けないようにします',
                '被弾したときに <code>itimer = pygame.time.get_ticks() + 1 * 1000</code> で 1 秒後を設定します',
                '▶ 実行して、敵に当たった直後の 1 秒間だけ「すり抜け」が起きることを確認しましょう',
            ],
            figure_basename="game_18_step2_final",
            figure_width=1831,
            code=CODE_STEP2,
            file_descriptions={
                'game_funcs.py': '<code>itimer = 0</code> を追加します。これが「無敵が終わる時刻」を表す変数で、'
                                 '<code>pygame.time.get_ticks()</code> の値と比較する形で使います。',
                'update_play.py': '衝突判定に <code>pygame.time.get_ticks() &gt;= itimer</code> を AND 条件で'
                                  '加えます。被弾と同時に <code>itimer = pygame.time.get_ticks() + 1 * 1000</code> '
                                  'を設定すると、その時刻まではダメージを受けないので「無敵時間」が実現します。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="5-19-1",
            title="draw_play() のハートアイコンで残機を表示する",
            lead='「Lives: N」のテキスト HUD を、<code>heart.svg</code> アイコンを 3 つ並べる表示に改造しましょう。'
                 '残機が減ったら左から順に消えていく見た目になればゴールです。'
                 '<strong>変更場所は <code>draw_play()</code> 関数の中だけです。</strong>',
            figure_basename="game_18a_heart_hud",
            figure_width=1460,
            code=CODE_KADAI_A,
            explanation='<code>draw_play()</code> の中で <code>for i in range(lives):</code> を回し、'
                        'ハート画像を <code>10 + i * 36</code> の x 座標に描画します。'
                        '<code>update_play()</code> には手を加えなくて OK です。'
                        '「描画だけ変えたい → draw_play() を探す」という整理が活きるパターンです。',
            file_descriptions={
                'draw_play.py': 'HUD のテキスト描画を捨て、<code>for i in range(lives):</code> でハート画像を'
                                '残機の数だけ並べて描画します。<code>10 + i * 36</code> の x 座標で 36px 間隔。'
                                '残機が減るとハートも左から消えていきます。<code>update_play()</code> はそのままです。',
            },
        ),
        Kadai(
            number="5-19-2",
            title="update_play() にハート回復アイテムを追加する",
            lead='画面の上から落ちてくるハートを拾うと <code>lives</code> が 1 増える「回復アイテム」を追加しましょう。'
                 '最大 5 機まで。<strong>動き・判定は <code>update_play()</code>、描画は <code>draw_play()</code> に追加します。</strong>',
            figure_basename="game_18b_heart_heal",
            figure_width=1430,
            code=CODE_KADAI_B,
            explanation='<code>update_play()</code> に <code>hx</code>, <code>hy</code> の落下と当たり判定を追加します。'
                        '当たったときに <code>lives &lt; 5</code> なら <code>lives += 1</code>、'
                        'ハートをリスポーンさせます。'
                        '<code>draw_play()</code> にハート画像の描画を追加します。'
                        '修正箇所が 2 つの関数に整理されていることに注目してください。',
            file_descriptions={
                'game_funcs.py': 'ハート回復アイテムの位置 <code>hx</code>・<code>hy</code> を追加します。'
                                 '敵と同じく画面上の外から落とすので <code>hy = -48</code> から始めるのが定石です。',
                'update_play.py': 'ハートの落下処理（<code>hy += 2</code> など）と、プレイヤーが触れた時の判定を追加します。'
                                  '<code>lives &lt; 5</code> のときだけ <code>lives += 1</code> し、ハートをランダム位置にリスポーン。'
                                  '上限 5 機の制約は数値リテラルで素直に書くだけです。',
                'draw_play.py': 'ハートアイテムを描画する 1 行を追加します。'
                                'プレイヤー → 敵 → HUD に加えて「拾えるアイテム」の描画も入る形になります。',
            },
        ),
        Kadai(
            number="5-19-3",
            title="update_play() の分岐で無敵中だけ敵をスローにする",
            lead='無敵時間の効果をもっと体感できるよう、無敵中は敵の落下速度を遅くしましょう。'
                 '<strong>変更場所は <code>update_play()</code> の敵移動部分だけです。</strong>',
            figure_basename="game_18c_slow_invincible",
            figure_width=1831,
            code=CODE_KADAI_C,
            explanation='<code>update_play()</code> 内で <code>if pygame.time.get_ticks() &gt;= itimer:</code> の'
                        '真偽に応じて <code>ey</code> の増分を切り替えます。'
                        'True（無敵が切れた状態）なら <code>+3</code>、False（無敵中）なら <code>+1</code>。'
                        '<code>draw_play()</code> には変更不要です。',
            file_descriptions={
                'update_play.py': '敵の落下速度を <code>if pygame.time.get_ticks() &gt;= itimer:</code> の真偽で切り替えます。'
                                  '無敵が切れた通常状態なら <code>ey += 3</code>、無敵中なら <code>ey += 1</code>。'
                                  '同じ <code>itimer</code> 変数を「ダメージ無効化」と「演出のスロー化」の両方に使うのがポイントです。',
            },
        ),
    ],
    summary_bullets=[
        '<code>update_play()</code> にゲームロジック、<code>draw_play()</code> に描画をまとめると改造場所が一目でわかる',
        '関数内でグローバル変数を変更するときは <code>global</code> 宣言が必要。読むだけなら不要',
        '残機を変数で管理すると、1 回のミスで終わらない柔軟なゲームが作れる',
        '<code>pygame.time.get_ticks()</code> で「現在時刻 + N 秒」を設定すれば時間制御はどこでも使える',
    ],
    next_article_id=4998,
    next_article_title='Part 5「改造道場」インデックス',
    cache_buster="20260508f",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑲】ライフ制とリスポーン")
        print("反映完了（status=draft）。WP 管理画面で公開してください。")
    else:
        try:
            current = wp_get(SPEC.page_id)
            print(
                f"現在の本文: {len(current)} chars / 新本文: {len(new_content)} chars "
                f"(diff={len(new_content) - len(current):+d})"
            )
        except Exception as e:
            print(f"（既存取得スキップ: {e}）")
        print("\n--- 先頭 800 文字プレビュー ---")
        print(new_content[:800])
        print("\n(dry-run) --push で WP に反映")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
