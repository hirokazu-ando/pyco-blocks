#!/usr/bin/env python3
"""WP 記事 4074 (Pygame⑭ 残機を作ろう) の本文を組み立てて反映する。

新⑬（スコア）で確立した state["score"] と Final Score 表示の上に、
state["lives"] = 3 の「残機」を載せる。衝突したら -1、lives <= 0 で over。
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
    "eyecatch_game-4-13_lives.png"
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

# Step 1 — state["lives"] = 3 を導入し、衝突で残機を 1 減らして敵をリセット。
# 残機が 0 になったら mode = "over" に切り替え。Enter 復帰時は lives と score を初期化。
CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3}


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
        state["lives"] = state["lives"] - 1
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        if state["lives"] <= 0:
            state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Lives: " + str(state["lives"]), True, "#ffeb3b"), (480, 10))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
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

# Step 2 — Lives: 数字 を「赤い四角 ×残機」のハート風 HUD に置き換える。
# draw_play.py のみ変更。3 つの if で残機の数だけ四角を描く。
CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3}


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
        state["lives"] = state["lives"] - 1
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        if state["lives"] <= 0:
            state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
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

# 課題A 4-14-1 — スタート残機を 5 にしよう
# game_funcs.py の "lives": 3 → 5、update_over.py のリセット値も 5、
# draw_play.py に if state["lives"] >= 4/5 の 2 ブロックを追加。
CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 5}


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
        state["lives"] = state["lives"] - 1
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        if state["lives"] <= 0:
            state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (400, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (440, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 4:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 5:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 5
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

# 課題B 4-14-2 — 衝突直後 30 frames 無敵
# state["invincible"] = 0 を追加。衝突時に 30 セット、毎フレーム -1。
# 衝突判定は invincible == 0 のときだけ。draw_play で点滅表示。
CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3, "invincible": 0}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    if state["invincible"] > 0:
        state["invincible"] = state["invincible"] - 1
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
        if state["invincible"] == 0:
            state["lives"] = state["lives"] - 1
            state["ey"] = -48
            state["ex"] = random.randint(0, 576)
            state["invincible"] = 30
            if state["lives"] <= 0:
                state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    if state["invincible"] % 4 < 2:
        pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
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

# 課題C 4-14-3 — 5 点ごとに残機 +1（上限 5）
# update_play.py のスコア加算ブロックの直後に
# 「もし score % 5 == 0 かつ lives < 5 なら lives += 1」を追加。
CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3}


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
        if state["score"] % 5 == 0:
            if state["lives"] < 5:
                state["lives"] = state["lives"] + 1
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["lives"] = state["lives"] - 1
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        if state["lives"] <= 0:
            state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (400, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (440, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 4:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 5:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
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


SPEC = Spec(
    page_id=4074,
    slug="game-14-lives",
    title="残機を作ろう",
    intro_paragraphs=[
        '前回（記事⑬）は <code>state</code> 辞書に <code>"score": 0</code> を足して、'
        '敵をやり過ごすたびにスコアが 1 ずつ増え、ゲームオーバー画面でも'
        '「Final Score: ◯」が表示されるようにしました。'
        'ただ「1 回当たったら即ゲームオーバー」だと、ちょっとミスしただけで終わってしまって'
        'プレイの粘りが出づらい状態です。',
        '今回は <strong>残機（ライフ）</strong>を入れます。'
        '<code>state</code> 辞書に <code>"lives": 3</code> を追加し、'
        '敵にぶつかるたびに <code>state["lives"]</code> を 1 減らして敵だけリセット。'
        '残機が <code>0</code> 以下になったときに初めて <code>state["mode"] = "over"</code> でゲームオーバー画面へ切り替えます。'
        '<strong>「データを <code>state</code> に追加 → 動きを <code>update_play.py</code> で足す → '
        '見た目を <code>draw_play.py</code> で更新」</strong>の 3 段の手順は前回と同じ。'
        '<code>state</code> に変数を 1 つ足すだけで「3 機制」のアクションゲームに変身する流れを体験しましょう。',
    ],
    eyecatch_basename="eyecatch_game_14_lives",
    iframe_xml="game_14_step1_pop.xml",
    learn_bullets=[
        '<code>state</code> 辞書に <code>"lives": 3</code> を追加して、残機を 1 か所で管理する考え方',
        '衝突したときに <code>state["lives"] = state["lives"] - 1</code> で残機を 1 減らし、敵だけリセットして続行する流れ',
        '<code>if state["lives"] &lt;= 0:</code> で残機が尽きたときだけ <code>state["mode"] = "over"</code> に切り替える分岐',
        'リトライ時（Enter キー）に <code>state["lives"]</code> も <code>state["score"]</code> と一緒に初期値へ戻す処理',
        '残機の表示を「数字」から「赤い四角 ×残機の数」のハート風 HUD に置き換える描画の応用',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='今回出てくる「残機」「クールタイム」「比較演算子 <code>&lt;=</code>」は、'
                'アクションゲームでもよく使う考え方です。'
                'まずは言葉と役割を結びつけてから、ブロックの組み立てに入りましょう。',
    terms_table=[
        ("残機（ライフ）",
         "プレイヤーが敵に当たっても続けて遊べる回数。0 になったらゲームオーバー",
         "<code>state[\"lives\"] = 3</code>"),
        ("decrement（減算）",
         "変数を 1 ずつ減らす書き方。ここでは衝突するたびに残機を 1 減らす",
         "<code>state[\"lives\"] = state[\"lives\"] - 1</code>"),
        ("&lt;=（小なりイコール）",
         "「左辺が右辺以下」を判定する比較演算子。残機が 0 以下かどうかを調べるのに使う",
         "<code>state[\"lives\"] &lt;= 0</code>"),
        ("HUD",
         "Heads-Up Display の略。ゲーム画面の上に重ねて表示するスコア・残機などの情報",
         "左上 Score・右上 Lives の四角"),
        ("クールタイム",
         "「ある処理が連続発生しないようにする猶予フレーム」の総称。演習課題 4-14-2 の無敵時間が代表例",
         "<code>state[\"invincible\"] = 30</code>"),
    ],
    file_roles_h2="ファイル構成のおさらい（前回作った 5 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。<code>screen</code>・<code>clock</code>・'
         '<code>state</code> 辞書を初期化します。'
         '<code>state</code> には <code>"mode"</code>・<code>"px"</code>・'
         '<code>"ex"</code>・<code>"ey"</code>・<code>"score"</code> が入っています。'
         '<strong>今回はここに <code>"lives": 3</code> を 1 行追加します</strong>。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<code>update_play(state)</code> 関数の中で、左右キー → '
         '<code>state["px"]</code> 加減算 → 敵の落下 → 画面外でリセット → スコア加算 → 当たり判定、の流れを書いています。'
         '<strong>今回は当たり判定の中身を「即 over」から「lives -1 → 敵リセット → 残機が 0 以下なら over」に書き換えます</strong>。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<code>draw_play(screen, state)</code> 関数の中で、'
         'プレイヤー（青）・敵（橙）・「Score: ◯」を描いています。'
         '<strong>今回はここに右上の「Lives: ◯」を 1 行追加し（ステップ 1）、'
         'ステップ 2 で「ハート風の四角 ×残機」に置き換えます</strong>。'),
        ("update_over.py",
         '<strong>ゲームオーバー画面の更新ロジック</strong>。'
         'Enter キーで <code>state["mode"] = "play"</code> に戻すファイルです。'
         '<strong>今回はここに <code>state["lives"] = 3</code> と <code>state["score"] = 0</code> を加え、'
         'リトライ時に状態を初期値へ戻すようにします</strong>。'),
        ("draw_over.py",
         '<strong>ゲームオーバー画面の描画</strong>。'
         '「GAME OVER」と「Final Score: ◯」を表示するファイルです。'
         '<strong>このファイルは編集しません</strong>。'
         '同じ <code>state["score"]</code> を読み出すだけで、別画面に同じ値を出せるのは前回までと同じです。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
         '<strong>今回もこのファイルを編集しません</strong>。'
         '残機を足してもループ構造は無傷で済むのが、モジュール分割の効きどころです。'),
    ],
    steps=[
        Step(
            title="state に残機を足し、衝突で 1 減らす（残機 0 以下で over）",
            instructions=[
                '前回までの 5 ファイル分割（<code>game_funcs.py</code> 〜 <code>main.py</code>）の状態からスタートします。'
                'まず <code>game_funcs.py</code> の <strong>state 辞書（茶色の <code>py_dict_literal</code> ブロック）</strong>に'
                '<code>"lives": 3</code> の項目を 1 つ追加します（<code>"score": 0</code> の隣に並ぶ形）',
                '次に <code>update_play.py</code> を開き、'
                '<strong>当たり判定（<code>player_hit.colliderect(enemy_hit)</code> の紫色の <code>pico_if</code>）</strong>の中身を書き換えます。'
                '今までは <code>state["mode"] = "over"</code> 1 行だけでしたが、'
                'これを<strong>「残機を 1 減らす → 敵をリセット → 残機が 0 以下なら over」</strong>の流れに置き換えます。'
                '具体的には、<code>state["lives"] = state["lives"] - 1</code>（茶色の辞書代入＋橙色の数値演算）、'
                '<code>state["ey"] = -48</code>、<code>state["ex"] = random.randint(0, 576)</code> の 3 行を順に置き、'
                'その下にもう 1 つ紫色の <code>pico_if</code> を入れ子で追加して'
                '「<code>state["lives"] &lt;= 0</code> なら <code>state["mode"] = "over"</code>」とします',
                '次に <code>draw_play.py</code> を開き、関数の最後に「Lives: ◯」のテキスト描画を追加します。'
                '青色の <code>game_draw_text</code> ブロックを 1 つ置き、'
                '文字には <code>"Lives: " + str(state["lives"])</code>（橙色の文字列連結＋茶色の辞書取得を <code>str()</code> で囲む）、'
                '色は <code>"#ffeb3b"</code>（黄色）、座標は <code>(480, 10)</code> を入れます',
                '最後に <code>update_over.py</code> を開き、'
                '<strong>Enter で <code>state["mode"] = "play"</code> に戻している茶色の辞書代入ブロックの<strong>下</strong></strong>に、'
                '<code>state["lives"] = 3</code> と <code>state["score"] = 0</code> の 2 行を追加します。'
                'これでリトライ時に残機もスコアも初期値へ戻ります',
                '▶ 実行して、敵に何度かぶつかっても残機が 3 → 2 → 1 と減りつつ続行できれば成功です。'
                '残機が 0 になった瞬間に「GAME OVER」画面へ切り替わり、Enter で残機 3・スコア 0 から再スタートできます',
            ],
            figure_basename="game_14_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>state 辞書に <code>"lives": 3</code> を 1 行追加します（茶色の辞書リテラルブロック）。'
                                 '残機もスコアと同じく <code>state</code> にまとめておくのが定石です。',
                'update_play.py': '<strong>変更点：</strong>当たり判定の中身を 4 行に書き換えます。'
                                  '<code>state["lives"] = state["lives"] - 1</code>（茶色＋橙色）、'
                                  '<code>state["ey"] = -48</code>（茶色）、'
                                  '<code>state["ex"] = random.randint(0, 576)</code>（茶色＋橙色の game_random_int）の 3 行を順に置き、'
                                  '入れ子の紫色 <code>pico_if</code> で「<code>state["lives"] &lt;= 0</code> なら <code>state["mode"] = "over"</code>」を加えます。',
                'draw_play.py': '<strong>変更点：</strong>関数の最後に青色の <code>game_draw_text</code> ブロックを 1 つ追加し、'
                                '<code>"Lives: " + str(state["lives"])</code> を黄色 <code>"#ffeb3b"</code> で <code>(480, 10)</code> に描画します。'
                                'プレイヤー・敵・Score の既存ブロックはそのまま残します。',
                'update_over.py': '<strong>変更点：</strong>Enter で <code>"play"</code> に戻している既存ブロックの下に、'
                                  '<code>state["lives"] = 3</code> と <code>state["score"] = 0</code> の 2 行を追加します。'
                                  'リトライ時に残機とスコアを初期値に戻すための処理です。',
                'draw_over.py': '画面中央に「GAME OVER」と「Final Score: ◯」を描く内容はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
                          '<strong>このステップでは何も変えません</strong>。'
                          '残機を足してもループ構造は無傷で済むのが、モジュール分割の効きどころです。',
            },
        ),
        Step(
            title="Lives の数字を「赤い四角 ×残機」のハート風 HUD に置き換える",
            instructions=[
                '前のステップで残機の仕組みは動きましたが、画面右上の「Lives: 2」のような数字表示は、'
                'ぱっと見で残機がいくつあるか伝わりません。'
                '<strong>残機の数だけ赤い小さな四角を並べて</strong>、'
                'アクションゲームでよく見るハート風の HUD にしましょう',
                '<code>draw_play.py</code> を開き、ステップ 1 で追加した青色の <code>game_draw_text</code> ブロック'
                '（「Lives: ◯」を描いているもの）を<strong>削除</strong>します',
                '代わりに、紫色の <code>pico_if</code> ブロックを 3 つ縦に並べます。'
                '1 つ目は「もし <code>state["lives"] &gt;= 1</code> なら、'
                '橙色の <code>game_draw_rect</code> ブロックで'
                '<code>(480, 12, 24, 24)</code> に <code>"#ff3232"</code>（赤）の四角を描く」。'
                '2 つ目は <code>&gt;= 2</code> で <code>(520, 12, 24, 24)</code>。'
                '3 つ目は <code>&gt;= 3</code> で <code>(560, 12, 24, 24)</code>。'
                '左右に 40px 間隔で 3 つ並ぶ形です',
                '▶ 実行して、画面右上に赤い四角が 3 つ並び、敵にぶつかるたびに右から 1 つずつ消えていけば成功です。'
                'Enter で復帰すると、3 つの赤い四角が再び表示されます',
                '<strong>変更したファイルは <code>draw_play.py</code> 1 つだけ</strong>です。'
                '同じ <code>state["lives"]</code> の値を、表現方法だけ「数字」から「四角の数」に変えただけ、というのが state 辞書の使いどころです',
            ],
            figure_basename="game_14_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'draw_play.py': '<strong>変更点：</strong>ステップ 1 で追加した「Lives: ◯」の青色 <code>game_draw_text</code> ブロックを削除し、'
                                '紫色の <code>pico_if</code> を 3 つ並べます。'
                                '各 <code>pico_if</code> の中で橙色の <code>game_draw_rect</code> ブロックで赤い 24×24 の四角を描き、'
                                '横に 40px 間隔で 3 つ並べる形です。',
                'game_funcs.py': '<code>state</code> 辞書はステップ 1 から変更ありません。'
                                 '<strong>このステップでは何も変えません</strong>。',
                'update_play.py': '当たり判定や残機の減算処理はステップ 1 のまま。'
                                  '<strong>このステップでは何も変えません</strong>。'
                                  'データの扱いは触らず、見た目だけ変える練習です。',
                'update_over.py': 'Enter キーでの初期化処理もステップ 1 のまま。'
                                  '<strong>このステップでは何も変えません</strong>。',
                'draw_over.py': '「GAME OVER」と「Final Score」を描く内容はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': 'ゲームループの分岐構造はそのまま。'
                          '<strong>このステップでは何も変えません</strong>。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="4-14-1",
            title="スタート残機を 5 にしてみよう（イージーモード）",
            lead='3 機制だと初心者には少しシビアです。'
                 'スタート時の残機を <strong>5</strong> に増やして、'
                 'ハート HUD も 5 つ並ぶようにしましょう。'
                 '触るのは <code>game_funcs.py</code>・<code>update_over.py</code>・<code>draw_play.py</code> の 3 ファイルです。',
            figure_basename="game_14_a_lives5",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>game_funcs.py</code> の茶色の辞書リテラルブロック（<code>py_dict_literal</code>）の '
                        '<code>"lives": 3</code> を <code>"lives": 5</code> に書き換えます。'
                        '<code>update_over.py</code> でも、リトライ時の <code>state["lives"] = 3</code> を '
                        '<code>state["lives"] = 5</code> に変更します（数値ブロックの中身を 5 に）。'
                        '<code>draw_play.py</code> ではハート風の 3 ブロックの下にもう 2 つ紫色の <code>pico_if</code> を追加し、'
                        '「<code>state["lives"] &gt;= 4</code> なら <code>(520, 12)</code>」「<code>&gt;= 5</code> なら <code>(560, 12)</code>」の四角を描くようにします。'
                        '横位置は 40px ずつズラして全部で 5 つ並ぶようにしましょう（既存 3 つの x 座標も '
                        '<code>400 / 440 / 480</code> に詰めると揃います）。'
                        '<strong>「初期値」と「リセット値」を 2 か所揃って書き換える</strong>のがゲームバランス調整のポイントです。',
            file_descriptions={
                'game_funcs.py': '<code>state</code> 辞書の <code>"lives": 3</code> を <code>"lives": 5</code> に書き換えます。',
                'update_over.py': 'リトライ時の <code>state["lives"] = 3</code> を <code>state["lives"] = 5</code> に変更します。',
                'draw_play.py': '紫色の <code>pico_if</code> を 5 つに増やし、'
                                '<code>&gt;= 1〜5</code> の各条件で 40px ずつズラした位置に赤い四角を描きます。'
                                '<code>(400, 12) / (440, 12) / (480, 12) / (520, 12) / (560, 12)</code> の 5 個並べる形です。',
            },
        ),
        Kadai(
            number="4-14-2",
            title="衝突直後 30 frames は無敵にしよう（点滅つき）",
            lead='今のままだと、敵に当たって敵がリセットされた直後にすぐ別の敵が降ってきて'
                 '<strong>連続ダメージ</strong>になることがあります。'
                 '<code>state["invincible"]</code> という<strong>無敵タイマー</strong>を追加して、'
                 '衝突直後 30 frames（=0.5 秒）は当たり判定を無視するようにしましょう。'
                 'おまけにプレイヤーを点滅させて「無敵中だよ」と一目でわかるようにします。',
            figure_basename="game_14_b_invincible",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>game_funcs.py</code> の茶色の辞書リテラルブロックに <code>"invincible": 0</code> を 1 行追加します。'
                        '<code>update_play.py</code> では関数の先頭に紫色の <code>pico_if</code> を 1 つ追加し、'
                        '「<code>state["invincible"] &gt; 0</code> なら <code>state["invincible"] = state["invincible"] - 1</code>」'
                        'と毎フレーム 1 ずつ減らします。'
                        'そして既存の当たり判定の <code>pico_if</code> の中身を、'
                        'もう 1 つ紫色の <code>pico_if</code> で囲って'
                        '「<code>state["invincible"] == 0</code> のときだけ lives を減らす」ようにします。'
                        'lives を減らした直後に <code>state["invincible"] = 30</code> もセット（茶色の辞書代入）。'
                        '<code>draw_play.py</code> ではプレイヤーの青い四角の <code>game_draw_rect</code> を、'
                        '紫色の <code>pico_if</code> で囲って'
                        '「<code>state["invincible"] % 4 &lt; 2</code> のときだけ描画」とします。'
                        '余り（<code>%</code>）ブロックは橙色の <code>math_arithmetic</code> です。'
                        '<strong>「タイマー変数 + クールタイム判定」</strong>はあらゆるアクションゲームの基礎です。',
            file_descriptions={
                'game_funcs.py': '<code>state</code> 辞書に <code>"invincible": 0</code> を 1 行追加します。',
                'update_play.py': '関数の先頭に「<code>state["invincible"] &gt; 0</code> なら毎フレーム -1」する紫色の'
                                  '<code>pico_if</code> を追加。'
                                  '当たり判定の <code>pico_if</code> の中身を「<code>state["invincible"] == 0</code> のときだけ」の'
                                  '入れ子に書き換え、ダメージ処理の最後に <code>state["invincible"] = 30</code> をセットします。',
                'draw_play.py': 'プレイヤーの青い <code>game_draw_rect</code> ブロックを紫色の <code>pico_if</code> で囲み、'
                                '「<code>state["invincible"] % 4 &lt; 2</code> のときだけ描画」に変更します。'
                                'これでプレイヤーが点滅して「無敵中」が見て分かるようになります。',
            },
        ),
        Kadai(
            number="4-14-3",
            title="5 点ごとに残機 +1 のボーナスを付けよう（最大 5 機）",
            lead='ずっと減るだけだと辛いので、<strong>スコアが 5 の倍数</strong>になったときに残機を 1 増やすボーナスを付けましょう。'
                 'ただし最大 5 機まで（無限増殖防止）。<code>%</code>（余り）と <code>&lt;</code> の組み合わせで'
                 '「5 で割り切れる かつ 残機が 5 未満」を判定します。'
                 '<code>draw_play.py</code> も最大 5 機表示できるようにします（課題 4-14-1 と同じハート 5 つ並び）。',
            figure_basename="game_14_c_bonus",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='<code>update_play.py</code> のスコア加算ブロック'
                        '（<code>state["score"] = state["score"] + 1</code>）の<strong>下</strong>に、'
                        '紫色の <code>pico_if</code> を 1 つ追加し、'
                        '「<code>state["score"] % 5 == 0</code>」を比較ブロック（橙色の比較＋橙色の余り <code>math_arithmetic</code>）で書きます。'
                        'その中身に、もう 1 つ紫色の <code>pico_if</code> を入れ子にして'
                        '「<code>state["lives"] &lt; 5</code>」のときだけ <code>state["lives"] = state["lives"] + 1</code> を実行します。'
                        '<code>draw_play.py</code> は課題 4-14-1 と同じく、'
                        '紫色の <code>pico_if</code> を 5 つ並べて <code>&gt;= 1〜5</code> で赤い四角を描くようにします。'
                        '<code>game_funcs.py</code> と <code>update_over.py</code> は変更不要です'
                        '（スタート残機 3 のまま、ボーナスで増えた分は次のゲームに引き継がない）。'
                        '<strong>「2 段の <code>if</code> ネスト」と「<code>%</code> 余り演算子」</strong>を組み合わせて、'
                        '条件付きのご褒美を作る練習です。',
            file_descriptions={
                'update_play.py': 'スコア加算ブロックの下に紫色の <code>pico_if</code> を 2 段ネストで追加します。'
                                  '外側は「<code>state["score"] % 5 == 0</code>」、内側は「<code>state["lives"] &lt; 5</code>」。'
                                  '内側の <code>pico_if</code> の中で <code>state["lives"] = state["lives"] + 1</code> を実行します。',
                'draw_play.py': '残機 5 まで表示できるよう、紫色の <code>pico_if</code> を 5 つに増やします（課題 4-14-1 と同じ並び）。'
                                '<code>(400, 12) / (440, 12) / (480, 12) / (520, 12) / (560, 12)</code> の 5 個並べる形です。',
            },
        ),
    ],
    summary_bullets=[
        '<code>state</code> 辞書に <code>"lives": 3</code> を 1 行足すだけで「3 機制」のアクションゲームに変身する',
        '衝突したときの処理を「即 over」から「lives -1 → 敵リセット → 残機 0 以下なら over」の 3 段に分ける',
        'リトライ時（Enter キー）には <code>state["lives"]</code> も <code>state["score"]</code> と一緒に初期値に戻す',
        'HUD は数字でも 4 角（ハート風）でもよい。'
        '<code>state["lives"]</code> という同じデータを、表現方法だけ変えるのが state 辞書の使いどころ',
        '無敵タイマー・ボーナス残機など、'
        '<code>state</code> にカウンタや上限変数をもう 1 つ足すだけでバリエーションを足せる',
    ],
    next_article_id=4075,
    next_article_title='【Pygameでゲーム⑮】タイマーで難易度を上げよう',
    cache_buster="20260509h",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑭】残機を作ろう")
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
