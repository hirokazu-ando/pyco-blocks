#!/usr/bin/env python3
"""WP 記事 4073 (Pygame⑬ スコアを数えよう) の本文を組み立てて反映する。

新⑫（当たり判定）で確立した「敵に当たったら state["mode"] = "over"」の
枠組みに、state["score"] でスコアを管理して画面に表示する仕組みを載せる。
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

EYECATCH_URL = (
    "https://sakigake-robo.com/wp-content/uploads/2026/05/"
    "eyecatch_game-4-12_score-2.png"
)


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
    if spec.file_roles:
        sections.append(_wp_h2(spec.file_roles_h2 or "ファイル構成のおさらい"))
        roles_items = [
            f'<strong><code>{fname}</code></strong> — {desc}'
            for fname, desc in spec.file_roles
        ]
        sections.append(_wp_ul(roles_items))
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


# ── Python コード（5 ファイル分割スタイル） ──────────────────────────────

# Step 1 — state["score"] を導入してプレイ中の HUD に表示
# 前ステップ（記事⑫ step2 の Hitbox 24×24 状態）からの変更：
#   game_funcs.py: state 辞書に "score": 0 を追加
#   update_play.py: 敵が画面外に出てリセットするタイミングで state["score"] += 1
#   draw_play.py: 左上に Score: ... を描画
CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Score")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + 3
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))


# ─── update_over.py ────────────────────────────────────────────
import pygame
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["ex"] = random.randint(0, 576)
        state["ey"] = -48


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    _f = pygame.font.SysFont(None, 40)
    screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))


# ─── main.py ───────────────────────────────────────────────────
from game_funcs import screen, clock, state
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over
import pygame

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state["mode"] == "play":
        update_play(state)
        draw_play(screen, state)
    else:
        update_over(state)
        draw_over(screen, state)
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

# Step 2 — ゲームオーバー画面に最終スコアを表示
# Step 1 からの変更：draw_over.py のみ。Final Score を中央に追加。
CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Score")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + 3
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))


# ─── update_over.py ────────────────────────────────────────────
import pygame
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["ex"] = random.randint(0, 576)
        state["ey"] = -48


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    _f = pygame.font.SysFont(None, 40)
    screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 32)
    screen.blit(_f.render("Final Score: " + str(state["score"]), True, "#ffffff"), (200, 220))


# ─── main.py ───────────────────────────────────────────────────
from game_funcs import screen, clock, state
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over
import pygame

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state["mode"] == "play":
        update_play(state)
        draw_play(screen, state)
    else:
        update_over(state)
        draw_over(screen, state)
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

# 課題A 4-13-1 — ハイスコアを保持しよう
# state["high_score"] を追加。プレイ中に score > high_score なら更新。
# Enter で復帰したら state["score"] をリセット。
# 4 ファイル変更：game_funcs.py / update_play.py / update_over.py / draw_play.py
CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Score")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "high_score": 0}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + 3
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
        if state["score"] > state["high_score"]:
            state["high_score"] = state["score"]
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Hi: " + str(state["high_score"]), True, "#ffeb3b"), (480, 10))


# ─── update_over.py ────────────────────────────────────────────
import pygame
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["ex"] = random.randint(0, 576)
        state["ey"] = -48
        state["score"] = 0


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    _f = pygame.font.SysFont(None, 40)
    screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 32)
    screen.blit(_f.render("Final Score: " + str(state["score"]), True, "#ffffff"), (200, 220))


# ─── main.py ───────────────────────────────────────────────────
from game_funcs import screen, clock, state
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over
import pygame

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state["mode"] == "play":
        update_play(state)
        draw_play(screen, state)
    else:
        update_over(state)
        draw_over(screen, state)
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

# 課題B 4-13-2 — スコアでテンポを上げよう
# 敵の落下速度を score の値で加速する。update_play.py のみ変更。
CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Score")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + 3 + state["score"] // 5
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))


# ─── update_over.py ────────────────────────────────────────────
import pygame
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["ex"] = random.randint(0, 576)
        state["ey"] = -48


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    _f = pygame.font.SysFont(None, 40)
    screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 32)
    screen.blit(_f.render("Final Score: " + str(state["score"]), True, "#ffffff"), (200, 220))


# ─── main.py ───────────────────────────────────────────────────
from game_funcs import screen, clock, state
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over
import pygame

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state["mode"] == "play":
        update_play(state)
        draw_play(screen, state)
    else:
        update_over(state)
        draw_over(screen, state)
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

# 課題C 4-13-3 — +1 ポップアップ演出
# state["pop_timer"] を追加し、スコア加算時に 30 フレームの "+1" を画面中央に表示する。
# game_funcs.py + update_play.py + draw_play.py の 3 ファイル変更。
CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Score")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "pop_timer": 0}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    if state["pop_timer"] > 0:
        state["pop_timer"] = state["pop_timer"] - 1
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + 3
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
        state["pop_timer"] = 30
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["pop_timer"] > 0:
        _f = pygame.font.SysFont(None, 64)
        screen.blit(_f.render("+1", True, "#ffeb3b"), (290, 160))


# ─── update_over.py ────────────────────────────────────────────
import pygame
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["ex"] = random.randint(0, 576)
        state["ey"] = -48


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    _f = pygame.font.SysFont(None, 40)
    screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 32)
    screen.blit(_f.render("Final Score: " + str(state["score"]), True, "#ffffff"), (200, 220))


# ─── main.py ───────────────────────────────────────────────────
from game_funcs import screen, clock, state
from update_play import update_play
from draw_play import draw_play
from update_over import update_over
from draw_over import draw_over
import pygame

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state["mode"] == "play":
        update_play(state)
        draw_play(screen, state)
    else:
        update_over(state)
        draw_over(screen, state)
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''


SPEC = Spec(
    page_id=4073,
    slug="game-13-score",
    title="スコアを数えよう",
    intro_paragraphs=[
        '前回（記事⑫）は、5 ファイル分割の <code>update_play.py</code> の中だけに'
        '<strong>当たり判定</strong>を足して、敵にぶつかったら <code>state["mode"] = "over"</code> で'
        'ゲームオーバー画面へ切り替わるところまで作りました。'
        '遊べるようにはなりましたが、まだ点数が無いので「うまく避けられた」感覚が薄い状態です。',
        '今回は <strong>スコア</strong>を入れます。'
        '<code>state</code> 辞書に <code>"score": 0</code> を追加し、'
        '敵を 1 体やり過ごす（画面外に出てリセットされる）たびに <code>state["score"]</code> を +1。'
        'プレイ中は左上に「Score: ◯」を表示し、ゲームオーバー画面では「Final Score: ◯」を中央に出します。'
        '<strong>「データを <code>state</code> に追加 → 動きを <code>update_play.py</code> で足す → '
        '見た目を <code>draw_play.py</code> / <code>draw_over.py</code> で更新」</strong>'
        'という<strong>3 段の手順</strong>で機能を増やす流れを、もう一度なぞってみましょう。',
    ],
    eyecatch_basename="eyecatch_game_13_score",
    iframe_xml="game_13_step1_final.xml",
    learn_bullets=[
        '<code>state</code> 辞書に <code>"score": 0</code> を追加して、ゲーム中の点数を一元管理する考え方',
        '敵が画面外に出てリセットされる瞬間に <code>state["score"] = state["score"] + 1</code> で点数を増やすタイミング',
        '<code>pygame.font.SysFont(None, 28)</code> でフォントを作り、<code>render</code> → <code>blit</code> で画面に文字を描画する流れ',
        '数値の <code>state["score"]</code> を <code>"Score: " + str(...)</code> のように文字列と連結する書き方',
        'ゲームオーバー画面の <code>draw_over.py</code> でも <code>state["score"]</code> を読み出して「Final Score」を表示する応用',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='今回は文字を描画するための言葉が増えます。'
                '「フォント」「レンダリング」「blit」「str() 変換」の 4 つは Pygame では頻出なので、ここで一気に押さえておきましょう。',
    terms_table=[
        ("フォント",
         "文字を描くときの書体・サイズの組み合わせ。<code>pygame.font.SysFont(None, 28)</code> で作る",
         "<code>_f = pygame.font.SysFont(None, 28)</code>"),
        ("レンダリング",
         "フォントから「文字の絵（Surface）」を作る作業。<code>render(文字, アンチエイリアス, 色)</code>",
         "<code>_f.render(\"Score: 5\", True, \"#ffffff\")</code>"),
        ("blit",
         "画面（screen）に絵（Surface）を貼り付けるメソッド。座標は (x, y)",
         "<code>screen.blit(img, (10, 10))</code>"),
        ("str()",
         "数値を文字列に変える組み込み関数。文字とくっつけて表示するときに使う",
         "<code>\"Score: \" + str(state[\"score\"])</code>"),
        ("game_draw_text",
         "PycoBlocks のブロック。<code>pygame.font.SysFont(...).render(...).blit(...)</code> をまとめて 1 ブロックで書ける",
         "青色のブロック"),
    ],
    file_roles_h2="ファイル構成のおさらい（前回作った 5 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。<code>screen</code>・<code>clock</code>・'
         '<code>state</code> 辞書を初期化します。'
         '<code>state</code> には <code>"px"</code>（プレイヤー X）・'
         '<code>"ex"</code>（敵 X）・<code>"ey"</code>（敵 Y）・'
         '<code>"mode"</code>（"play" / "over"）が入っています。'
         '<strong>今回はここに <code>"score": 0</code> を 1 行追加します</strong>。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<code>update_play(state)</code> 関数の中で、左右キー → '
         '<code>state["px"]</code> 加減算 → 敵の落下 → 画面外でリセット → 当たり判定、の流れを書いています。'
         '<strong>今回はここに <code>state["score"] = state["score"] + 1</code> を 1 行足すだけ</strong>。'
         '敵が画面外に出てリセットされるタイミング（=「やり過ごせた」瞬間）でスコアを 1 増やします。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<code>draw_play(screen, state)</code> 関数の中で、'
         '<code>state["px"]</code>・<code>state["ex"]</code>・<code>state["ey"]</code> から座標を取り出して'
         'プレイヤー（青）と敵（赤）の四角を描いています。'
         '<strong>今回はここに「Score: ◯」のテキスト描画を追加します</strong>。'
         '見た目に関わる変更は draw_play.py、というルールが今回もそのまま当てはまります。'),
        ("update_over.py",
         '<strong>ゲームオーバー画面の更新ロジック</strong>。'
         '<code>update_over(state)</code> 関数で、Enter キーが押されたら '
         '<code>state["mode"] = "play"</code> に戻し、続けて'
         '<code>state["px"] = 296</code>・<code>state["ex"] = random.randint(0, 576)</code>・'
         '<code>state["ey"] = -48</code> でプレイヤーと敵の位置を初期化します'
         '（位置を戻さないと、衝突した瞬間の敵の座標で再開してしまい、リトライ直後にまた当たってしまうため）。'
         '<strong>ステップ 1・2 では編集しません</strong>。'
         '演習課題（4-13-1 ハイスコア）で「リトライ時にスコアもゼロに戻す」1 行を追加するときだけ触ります。'),
        ("draw_over.py",
         '<strong>ゲームオーバー画面の描画</strong>。'
         '<code>draw_over(screen, state)</code> 関数で、画面中央に「GAME OVER」と表示します。'
         '<strong>今回はここに「Final Score: ◯」を 1 行追加します</strong>（ステップ 2）。'
         '同じ <code>state["score"]</code> を読み出すだけで、別画面に同じ値を出せるのが state 辞書の強みです。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<code>from game_funcs import …</code> で共有データを取り込み、'
         '<code>from update_play import update_play</code>・'
         '<code>from draw_play import draw_play</code>・'
         '<code>from update_over import update_over</code>・'
         '<code>from draw_over import draw_over</code> で 4 つの関数を読み込み、'
         '<code>if state["mode"] == "play":</code> ／ <code>else:</code> で分岐するだけ。'
         '<strong>今回はこのファイルを編集しません</strong>。スコアを足しても <code>main.py</code> はそのまま、'
         'というのがモジュール分割の効きどころです。'),
    ],
    steps=[
        Step(
            title="state にスコアを足し、左上に「Score: ◯」を表示する",
            instructions=[
                '前回までの 5 ファイル分割（<code>game_funcs.py</code> 〜 <code>main.py</code>）の状態からスタートします。'
                'まず <code>game_funcs.py</code> の <strong>state 辞書（茶色の <code>py_dict_literal</code> ブロック）</strong>に'
                '<code>"score": 0</code> の項目を 1 つ追加します（既存の <code>"mode"</code> / <code>"px"</code> / '
                '<code>"ex"</code> / <code>"ey"</code> と並ぶ形）',
                '次に <code>update_play.py</code> を開き、<strong>敵が画面外に出てリセットされるブロック</strong>'
                '（<code>state["ey"] = -48</code> と <code>state["ex"] = random.randint(0, 576)</code> を'
                '紫色の <code>pico_if</code> で囲っているところ）の<strong>中</strong>に'
                '<code>state["score"] = state["score"] + 1</code> を 1 行追加します'
                '（左辺は茶色の辞書代入ブロック <code>py_dict_set</code>、'
                '右辺の足し算は橙色の数値演算ブロック <code>math_arithmetic</code>、'
                '中の <code>state["score"]</code> は茶色の辞書取得ブロック <code>py_dict_get</code> です）',
                '最後に <code>draw_play.py</code> を開き、関数の最後に「Score: ◯」のテキスト描画を追加します：'
                '青色の <code>game_draw_text</code> ブロックを 1 つ置き、'
                '文字には <code>"Score: " + str(state["score"])</code>'
                '（茶色の辞書取得ブロックを <code>str()</code> で囲み、橙色の文字列連結ブロックでつなぐ）、'
                '色は <code>"#ffffff"</code>、座標は <code>(10, 10)</code> を入れます',
                '▶ 実行して、敵をやり過ごすたびに左上の数字が 1, 2, 3 ... と増えていけば成功です。'
                '敵にぶつかれば前回までと同じく「GAME OVER」画面に切り替わります（Enter で復帰）',
                'ここで気になるのは「ゲームオーバー画面のときには結局スコアが何だったのか分からない」点です。'
                '次のステップで <code>draw_over.py</code> にも「Final Score: ◯」を出してあげましょう',
            ],
            figure_basename="game_13_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>state 辞書に <code>"score": 0</code> を追加します（茶色の辞書リテラルブロック）。'
                                 '時間に関わるカウンタもスコアも、まず <code>state</code> に置く、というのがこのシリーズの定石です。',
                'update_play.py': '<strong>変更点：</strong>敵が画面外でリセットされる紫色の <code>pico_if</code> ブロックの中に、'
                                  '<code>state["score"] = state["score"] + 1</code> を 1 行加えます。'
                                  '「やり過ごせた」瞬間にスコアを増やすので、リセット処理と同じブロックの中に置くのが自然です。',
                'draw_play.py': '<strong>変更点：</strong>関数の最後に青色の <code>game_draw_text</code> ブロックを 1 つ追加し、'
                                '<code>"Score: " + str(state["score"])</code> を白で <code>(10, 10)</code> に描画します。'
                                'プレイヤーと敵の四角を描く既存の処理はそのまま残します。',
                'update_over.py': 'Enter で <code>state["mode"] = "play"</code> に戻し、'
                                  '続けて <code>state["px"] = 296</code>・<code>state["ex"] = random.randint(0, 576)</code>・'
                                  '<code>state["ey"] = -48</code> でプレイヤーと敵の位置を初期化する内容はそのまま。'
                                  '<strong>このステップでは何も変えません</strong>。'
                                  '（リトライ時にスコアもゼロに戻したい場合は演習課題 4-13-1 で扱います）',
                'draw_over.py': '画面中央に「GAME OVER」を描くだけの内容はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。'
                                '次のステップで「Final Score」をここに足します。',
                'main.py': '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
                          '<strong>このステップでは何も変えません</strong>。'
                          'スコアを足しても <code>main.py</code> はそのまま、というのがモジュール分割の効きどころです。',
            },
        ),
        Step(
            title="ゲームオーバー画面に「Final Score: ◯」を表示する",
            instructions=[
                '前のステップでスコアは増えるようになりましたが、ゲームオーバー画面が「GAME OVER」だけだと、'
                '「結局何点取れたのか」がプレイ後にわかりません。'
                '同じ <code>state["score"]</code> を <code>draw_over.py</code> から読み出して、'
                'ゲームオーバー画面にも「Final Score」を出してあげましょう',
                '<code>draw_over.py</code> を開き、既存の「GAME OVER」を描く青色の <code>game_draw_text</code> ブロックの<strong>下</strong>に、'
                'もう 1 つ青色の <code>game_draw_text</code> ブロックを置きます',
                '新しいブロックの文字には <code>"Final Score: " + str(state["score"])</code>'
                '（茶色の辞書取得ブロック <code>state["score"]</code> を <code>str()</code> で囲み、'
                '橙色の文字列連結ブロックで <code>"Final Score: "</code> とつなぐ）、'
                '色は <code>"#ffffff"</code>、フォントサイズは <code>32</code>、座標は <code>(200, 220)</code> を入れます',
                '▶ 実行して、敵にぶつかったあとに「GAME OVER」の下に「Final Score: ◯」が表示されれば成功です。'
                'Enter キーで再プレイすると、<code>state["score"]</code> はリセットされず<strong>そのまま積み上がる</strong>のがわかります（リセット方法は演習課題 4-13-1 で扱います）',
                '<strong>変更したファイルは <code>draw_over.py</code> 1 つだけ</strong>です。'
                '同じデータ（<code>state["score"]</code>）を、画面ごとに別の描画ファイルが好きに表示できる、というのが state 辞書 + 5 ファイル分割の強みです',
            ],
            figure_basename="game_13_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'draw_over.py': '<strong>変更点：</strong>「GAME OVER」を描いている青色の <code>game_draw_text</code> ブロックの下に、'
                                'もう 1 つ <code>game_draw_text</code> ブロックを追加し、'
                                '<code>"Final Score: " + str(state["score"])</code> をフォントサイズ 32・白・座標 (200, 220) で描画します。',
                'game_funcs.py': '<code>state</code> 辞書はステップ 1 から変更ありません。'
                                 '<code>"score"</code> はすでに用意されているので、そのまま使えます。'
                                 '<strong>このステップでは何も変えません</strong>。',
                'update_play.py': 'スコアを増やす処理（<code>state["score"] = state["score"] + 1</code>）はステップ 1 のまま。'
                                  '<strong>このステップでは何も変えません</strong>。',
                'draw_play.py': '左上の「Score: ◯」描画もステップ 1 のまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'update_over.py': 'Enter キーで <code>state["mode"] = "play"</code> に戻し、'
                                  '位置を初期化する処理はそのまま。'
                                  '<strong>このステップでは何も変えません</strong>。',
                'main.py': 'ゲームループの分岐構造はそのまま。'
                          '<strong>このステップでは何も変えません</strong>。'
                          '別の画面（draw_over）に新しい表示を足しても、main.py が無傷で済むのが分割の効きどころです。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="4-13-1",
            title="ハイスコアを覚えておこう（リトライでスコアもリセット）",
            lead='今のままだと、ゲームオーバー後に Enter で復帰しても <code>state["score"]</code> が積み上がったままで、'
                 '「最高記録」がよく分かりません。<code>state</code> 辞書に <code>"high_score": 0</code> を追加して、'
                 'プレイ中に <code>score &gt; high_score</code> なら <code>high_score</code> を更新、'
                 '右上に「Hi: ◯」を表示しましょう。さらにリトライ時（Enter キー）には'
                 '<code>state["score"] = 0</code> を入れて、毎回 0 から数え直すようにします。',
            figure_basename="game_13_a_hiscore",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>game_funcs.py</code> の茶色の辞書リテラルブロック（<code>py_dict_literal</code>）に '
                        '<code>"high_score": 0</code> を 1 行追加します。'
                        '<code>update_play.py</code> ではスコアを増やす紫色の <code>pico_if</code> ブロックの中に、'
                        'もう 1 つ紫色の <code>pico_if</code> を入れ子にして'
                        '「<code>state["score"] &gt; state["high_score"]</code> なら'
                        '<code>state["high_score"] = state["score"]</code>」とします'
                        '（比較は橙色の比較ブロック、左右の値は茶色の辞書取得ブロック）。'
                        '<code>draw_play.py</code> では青色の <code>game_draw_text</code> ブロックをもう 1 つ追加し、'
                        '<code>"Hi: " + str(state["high_score"])</code> を黄色 <code>"#ffeb3b"</code> で <code>(480, 10)</code> に描画します。'
                        '<code>update_over.py</code> では、Enter で <code>state["mode"] = "play"</code> に戻し'
                        '位置を初期化している既存ブロック群の<strong>一番下</strong>に、'
                        '茶色の辞書代入ブロックで <code>state["score"] = 0</code> を 1 行追加するだけ。'
                        '「同じデータ（state）の中に役割の違う値を増やす」考え方のいい練習になります。',
            file_descriptions={
                'game_funcs.py': '<code>state</code> 辞書に <code>"high_score": 0</code> を 1 行追加します。'
                                 '記録系の値も <code>state</code> にまとめるのが定石です。',
                'update_play.py': 'スコアを増やす紫色の <code>pico_if</code> の中に、'
                                  '「もし <code>state["score"] &gt; state["high_score"]</code> なら'
                                  '<code>state["high_score"] = state["score"]</code>」'
                                  'という更新処理を入れ子で追加します。',
                'draw_play.py': '右上に「Hi: ◯」を黄色 <code>"#ffeb3b"</code> で表示する青色の'
                                '<code>game_draw_text</code> ブロックを 1 つ追加します。座標は <code>(480, 10)</code>。',
                'update_over.py': 'Enter で <code>"play"</code> に戻し位置を初期化している既存ブロック群の<strong>一番下</strong>に、'
                                  '<code>state["score"] = 0</code> を 1 行追加します。'
                                  '<code>state["high_score"]</code> は維持され、<code>state["score"]</code> だけ 0 に戻ります。',
            },
        ),
        Kadai(
            number="4-13-2",
            title="スコアが上がるとテンポも上がるようにしよう",
            lead='ずっと同じ落下スピードだと、何点取っても難易度が変わらず単調になります。'
                 '敵の落下速度を <code>3 + state["score"] // 5</code> に変えて、'
                 '<strong>5 点ごとに +1</strong> ずつ早くなる「スコア連動アクション」にしましょう。'
                 '<code>update_play.py</code> の <code>state["ey"] = state["ey"] + 3</code> を 1 行書き換えるだけです。',
            figure_basename="game_13_b_tempo",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>update_play.py</code> の <code>state["ey"] = state["ey"] + 3</code> の右辺を、'
                        '<code>3 + state["score"] // 5</code> に置き換えます。'
                        '加算は橙色の数値演算ブロック <code>math_arithmetic</code>、'
                        '整数除算（<code>//</code>）も同じ橙色の <code>math_arithmetic</code> ブロックです。'
                        '<code>state["score"]</code> は茶色の辞書取得ブロック <code>py_dict_get</code>。'
                        '0〜4 点では速度 3、5〜9 点では速度 4、10〜14 点では速度 5 ……と階段状に上がっていく挙動になります。'
                        '「データ（<code>state["score"]</code>）が動き（速度）を直接動かす」という、'
                        '<strong>state を活用したアクションゲームの王道パターン</strong>です。'
                        '<code>game_funcs.py</code> や <code>draw_play.py</code> を触らずに難易度カーブを足せるのも、分割の旨味です。',
            file_descriptions={
                'update_play.py': '<code>state["ey"] = state["ey"] + 3</code> の右辺を'
                                  '<code>3 + state["score"] // 5</code> に書き換えるだけです。'
                                  '橙色の数値演算ブロックを 2 つ重ねる形になります。',
            },
        ),
        Kadai(
            number="4-13-3",
            title="スコアが増えた瞬間に「+1」をポップアップさせよう",
            lead='スコアが上がる瞬間がただ数字が変わるだけだと地味です。'
                 '<code>state</code> 辞書に <code>"pop_timer": 0</code> を追加し、'
                 'スコア加算のタイミングで <code>pop_timer = 30</code>（=30 フレーム ≒ 0.5 秒）にセット。'
                 '<code>update_play.py</code> では毎フレーム <code>pop_timer</code> を 1 ずつ減らし、'
                 '<code>draw_play.py</code> で「<code>pop_timer &gt; 0</code> なら画面中央に黄色く『+1』を表示」する、'
                 '<strong>演出</strong>の練習です。',
            figure_basename="game_13_c_pop",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='<code>game_funcs.py</code> の茶色の辞書リテラルブロックに <code>"pop_timer": 0</code> を 1 行追加します。'
                        '<code>update_play.py</code> では関数の先頭に紫色の <code>pico_if</code> を 1 つ追加し、'
                        '「もし <code>state["pop_timer"] &gt; 0</code> なら'
                        '<code>state["pop_timer"] = state["pop_timer"] - 1</code>」と書きます'
                        '（比較は橙色の比較ブロック、減算は橙色の数値演算ブロック）。'
                        'そして既存のスコア加算ブロックの<strong>下</strong>に、'
                        '茶色の辞書代入ブロックで <code>state["pop_timer"] = 30</code> を 1 行追加します。'
                        '<code>draw_play.py</code> では関数の最後にもう 1 つ紫色の <code>pico_if</code> を置き、'
                        '「もし <code>state["pop_timer"] &gt; 0</code> なら'
                        '画面中央 <code>(290, 160)</code> に黄色 <code>"#ffeb3b"</code> で'
                        '<code>"+1"</code> をフォントサイズ 64 で描画」を青色の <code>game_draw_text</code> ブロックで作ります。'
                        '<strong>「タイマーで一定フレームだけ表示する」</strong>のはアニメーション表現の基本です。'
                        'state にカウンタを 1 つ足すだけで動きと見た目を制御できる、というのを体感してみてください。',
            file_descriptions={
                'game_funcs.py': '<code>state</code> 辞書に <code>"pop_timer": 0</code> を 1 行追加します。'
                                 '時間に関わるカウンタはすべて <code>state</code> にまとめておくのが定石です。',
                'update_play.py': '関数の先頭に「<code>state["pop_timer"] &gt; 0</code> なら毎フレーム -1」する紫色の'
                                  '<code>pico_if</code> ブロックを追加し、'
                                  'スコア加算の直後に <code>state["pop_timer"] = 30</code> を 1 行加えます。',
                'draw_play.py': '関数の最後に「<code>state["pop_timer"] &gt; 0</code> のとき画面中央 <code>(290, 160)</code> に'
                                'フォントサイズ 64・黄色で <code>"+1"</code> を描画する」青色の'
                                '<code>game_draw_text</code> ブロックを追加します。',
            },
        ),
    ],
    summary_bullets=[
        '<code>state</code> 辞書に <code>"score": 0</code> を 1 行足すだけで、ゲーム全体に共有される点数管理ができる',
        'スコアを増やすタイミングは「敵を画面外まで送れた瞬間」。'
        'リセット処理と同じ <code>pico_if</code> の中に <code>state["score"] = state["score"] + 1</code> を入れる',
        '画面に文字を出すには「フォントを作る → <code>render</code> → <code>blit</code>」の 3 手順だが、'
        'PycoBlocks の青色 <code>game_draw_text</code> ブロックで 1 行で済む',
        '同じ <code>state["score"]</code> を <code>draw_play.py</code> も <code>draw_over.py</code> も読み出せるので、'
        'プレイ画面とゲームオーバー画面に同じ値を出すのが楽',
        '「データを <code>state</code> に追加 → 動きを <code>update_play.py</code> で足す → '
        '見た目を <code>draw_play.py</code> / <code>draw_over.py</code> で更新」の 3 段で機能を増やしていく',
    ],
    next_article_id=4074,
    next_article_title='【Pygameでゲーム⑭】ゲームオーバーを作ろう',
    cache_buster="20260509a",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑬】スコアを数えよう")
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
