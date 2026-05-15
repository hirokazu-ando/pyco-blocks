#!/usr/bin/env python3
"""WP 記事 4075 (Pygame⑮ タイマーで難易度を上げよう) の本文を組み立てて反映する。

新⑭（残機 lives）で確立した state 辞書 + 5 ファイル分割の上に、
state["frame"] と state["espeed"] を追加して時間ベースの難易度カーブを作る。
さらに 30 秒生き延びれば state["mode"] = "clear" でクリア表示。
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
    "eyecatch_game-4-14_timer-1.png"
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

# Step 1 — state["frame"] と state["espeed"] を導入し、時間で敵が加速する。
# Speed: HUD を draw_play.py に追加。残機（state["lives"]）は ⑭ から継承。
CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Timer")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3, "frame": 0, "espeed": 3}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + state["espeed"]
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
        state["score"] = 0
        state["frame"] = 0
        state["espeed"] = 3


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

# Step 2 — 30 秒生き延びたら state["mode"] = "clear"。
# draw_play.py に Time: HUD（残り秒数）を追加し、
# draw_over.py で mode が "clear" / "over" を判定して GAME CLEAR / GAME OVER を出し分け。
CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Timer")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3, "frame": 0, "espeed": 3}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["frame"] >= 1800:
        state["mode"] = "clear"
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + state["espeed"]
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
        state["score"] = 0
        state["frame"] = 0
        state["espeed"] = 3


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    if state["mode"] == "clear":
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME CLEAR!", True, "#ffeb3b"), (200, 160))
    else:
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

# 課題A 4-15-1 — 残り 10 秒以下で Time: HUD を赤くする
# draw_play.py のみ変更。state["frame"] // 60 が 20 を超えたら赤、それ以下なら白。
CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Timer")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3, "frame": 0, "espeed": 3}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["frame"] >= 1800:
        state["mode"] = "clear"
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + state["espeed"]
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    if state["frame"] // 60 <= 20:
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))
    else:
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ff3232"), (200, 50))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
        state["score"] = 0
        state["frame"] = 0
        state["espeed"] = 3


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    if state["mode"] == "clear":
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME CLEAR!", True, "#ffeb3b"), (200, 160))
    else:
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

# 課題B 4-15-2 — 速度に上限（最大 8）を設定する
# update_play.py のみ変更。state["espeed"] を計算後、8 を超えたら 8 に切り詰める。
CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Timer")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3, "frame": 0, "espeed": 3}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["espeed"] > 8:
        state["espeed"] = 8
    if state["frame"] >= 1800:
        state["mode"] = "clear"
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + state["espeed"]
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
        state["score"] = 0
        state["frame"] = 0
        state["espeed"] = 3


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    if state["mode"] == "clear":
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME CLEAR!", True, "#ffeb3b"), (200, 160))
    else:
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

# 課題C 4-15-3 — ゲームオーバー画面に Final Time を追加
# draw_over.py のみ変更。Final Score の下に Final Time: ◯ sec を表示。
CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Timer")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3, "frame": 0, "espeed": 3}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["frame"] >= 1800:
        state["mode"] = "clear"
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + state["espeed"]
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["lives"] = 3
        state["score"] = 0
        state["frame"] = 0
        state["espeed"] = 3


# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    if state["mode"] == "clear":
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME CLEAR!", True, "#ffeb3b"), (200, 160))
    else:
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 32)
    screen.blit(_f.render("Final Score: " + str(state["score"]), True, "#ffffff"), (200, 220))
    _f = pygame.font.SysFont(None, 32)
    screen.blit(_f.render("Final Time: " + str(state["frame"] // 60) + " sec", True, "#aaaaaa"), (200, 270))


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
    page_id=4075,
    slug="game-15-timer",
    title="タイマーで難易度を上げよう",
    intro_paragraphs=[
        '前回（記事⑭）は <code>state</code> 辞書に <code>"lives": 3</code> を追加して、'
        '敵にぶつかっても 3 機分は粘れるようにしました。'
        'ただ「いつまでも同じスピードで降ってくる」だけだと、やり込みのメリハリが出づらいです。',
        '今回は <strong>タイマー</strong>を入れます。'
        '<code>state</code> 辞書に <code>"frame": 0</code> と <code>"espeed": 3</code> を加えて、'
        '毎フレーム <code>frame</code> を 1 ずつ増やしながら'
        '<strong>5 秒経過するごとに敵の落下速度が +1 加速</strong>する仕組みにします。'
        '<strong>30 秒間生き延びれば <code>state["mode"] = "clear"</code></strong> でクリア画面へ遷移し、'
        '<code>draw_over.py</code> で「GAME CLEAR!」または「GAME OVER」を出し分けます。',
        '<strong>「カウンタ変数を <code>state</code> に置く → 経過時間から派生値を計算する → 派生値で挙動を変える」</strong>'
        'というパターンは、シューティングのウェーブ進行・RPG のターン経過・パズルゲームの制限時間など、'
        'あらゆる時間ゲーに使い回せる定石です。',
    ],
    eyecatch_basename="eyecatch_game_15_timer",
    iframe_xml="game_15_step2_final.xml",
    learn_bullets=[
        '<code>state</code> 辞書に <code>"frame": 0</code> を追加し、毎フレーム <code>+1</code> 増やしてカウンタにする方法',
        '<code>state["frame"] // 300</code>（300 frames = 5 秒）で <strong>5 秒ごとに 1 ずつ加速する</strong>難易度カーブの作り方',
        '<code>state["espeed"]</code> を別キーとして持っておき、表示にも挙動にも同じ値を使う設計',
        '<code>state["frame"] &gt;= 1800</code>（1800 frames = 30 秒）で <code>state["mode"] = "clear"</code> に切り替えて勝利を扱う分岐',
        'ゲーム終了画面（<code>draw_over.py</code>）で <code>state["mode"]</code> を判定して <strong>GAME CLEAR / GAME OVER を出し分ける</strong>条件分岐',
        'リトライ時に <code>state["frame"]</code> と <code>state["espeed"]</code> も初期値へ戻す処理',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='今回出てくる「フレーム」「整数除算 <code>//</code>」「クリア / オーバーの 2 種ゲーム終了」は、'
                'タイマーゲームの基礎です。'
                'まず言葉と役割を結びつけてから、ブロックの組み立てに入りましょう。',
    terms_table=[
        ("フレーム",
         "ゲームループ 1 周分。<code>clock.tick(60)</code> なら 1 秒に 60 回ループするので、60 frames = 1 秒",
         "<code>state[\"frame\"] = state[\"frame\"] + 1</code>"),
        ("整数除算 <code>//</code>",
         "「割って整数部分だけ返す」演算子。<code>frame // 300</code> なら「300 frames（5 秒）ごとに +1 されるカウンタ」になる",
         "<code>state[\"frame\"] // 300</code>"),
        ("派生値",
         "ほかの状態から計算で求まる値。<code>espeed = 3 + frame // 300</code> は <code>frame</code> から派生する敵速度",
         "<code>state[\"espeed\"] = 3 + state[\"frame\"] // 300</code>"),
        ("clear モード",
         "ゲーム終了の 2 つめ。残機 0 で <code>over</code>、制限時間内生き残りで <code>clear</code> に分岐する",
         "<code>state[\"mode\"] = \"clear\"</code>"),
        ("HUD の階層",
         "Score（左上）/ Lives（右上）/ Speed（左中）/ Time（中央左）と、画面位置を変えれば 4 種類の HUD でも視線が散らない",
         "<code>(10, 10) / (480, 12) / (10, 50) / (200, 50)</code>"),
    ],
    file_roles_h2="ファイル構成のおさらい（前回まで作った 6 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。<code>state</code> 辞書に '
         '<code>"mode"</code>・<code>"px"</code>・<code>"ex"</code>・<code>"ey"</code>・'
         '<code>"score"</code>・<code>"lives"</code> が入っています。'
         '<strong>今回はここに <code>"frame": 0</code> と <code>"espeed": 3</code> の 2 行を追加します</strong>。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<code>update_play(state)</code> 関数の中で、左右キー → 敵の落下 → 当たり判定（lives -1）の流れを書いています。'
         '<strong>今回は関数の先頭に <code>state["frame"] += 1</code> と <code>state["espeed"] = 3 + state["frame"] // 300</code> を追加し、'
         '敵の落下式を <code>state["ey"] += 3</code> から <code>state["ey"] += state["espeed"]</code> に書き換えます</strong>。'
         'ステップ 2 では <code>state["frame"] &gt;= 1800</code> でクリアに切り替える分岐も足します。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         'プレイヤー（青）・敵（橙）・Score・残機ハート ×3 を描いています。'
         '<strong>今回はここに「Speed: ◯」HUD を追加し、ステップ 2 で「Time: ◯」HUD（残り秒数）も追加します</strong>。'),
        ("update_over.py",
         '<strong>ゲームオーバー / クリア画面の更新ロジック</strong>。'
         'Enter キーで <code>state["mode"] = "play"</code> に戻し、'
         '残機・スコアを初期化するファイルです。'
         '<strong>今回はここに <code>state["frame"] = 0</code> と <code>state["espeed"] = 3</code> も加え、'
         'リトライ時にタイマーと敵速度も初期値へ戻すようにします</strong>。'),
        ("draw_over.py",
         '<strong>ゲーム終了画面の描画</strong>。'
         'これまでは「GAME OVER」と「Final Score: ◯」だけでしたが、'
         '<strong>ステップ 2 でクリア（mode=="clear"）と通常 over の判定を入れて、'
         '「GAME CLEAR!」（黄色）と「GAME OVER」（赤）を出し分けます</strong>。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
         '<strong>今回もこのファイルを編集しません</strong>。'
         'タイマーやクリア表示を足してもループ構造は無傷で済みます。'),
    ],
    steps=[
        Step(
            title="state にタイマーを足し、5 秒ごとに敵を加速させる",
            instructions=[
                '前回までの 5 ファイル分割の状態からスタートします。'
                'まず <code>game_funcs.py</code> の <strong>state 辞書（茶色の <code>py_dict_literal</code> ブロック）</strong>に'
                '<code>"frame": 0</code> と <code>"espeed": 3</code> の 2 項目を追加します（<code>"lives": 3</code> の隣に並ぶ形）',
                '次に <code>update_play.py</code> を開き、'
                '<strong>関数の先頭</strong>に 2 行のブロックを追加します。'
                '1 行目は <code>state["frame"] = state["frame"] + 1</code>（茶色の辞書代入＋橙色の数値演算）。'
                '2 行目は <code>state["espeed"] = 3 + state["frame"] // 300</code>'
                '（茶色の辞書代入＋橙色の <code>+</code> ＋橙色の <code>//</code>）',
                '同じ <code>update_play.py</code> で、敵の落下式を書き換えます。'
                '<strong>今までは <code>state["ey"] = state["ey"] + 3</code> だった部分</strong>を、'
                '<code>state["ey"] = state["ey"] + state["espeed"]</code> に変更します（数値ブロック <code>3</code> を辞書取得ブロック <code>state["espeed"]</code> に差し替え）',
                '<code>draw_play.py</code> を開き、関数の最後に「Speed: ◯」の HUD を追加します。'
                '青色の <code>game_draw_text</code> ブロックを 1 つ置き、'
                '文字には <code>"Speed: " + str(state["espeed"])</code>、色は <code>"#aaaaaa"</code>（薄い灰色）、'
                '座標は <code>(10, 50)</code> を入れます',
                '<code>update_over.py</code> を開き、Enter キーでのリセット処理に'
                '<code>state["frame"] = 0</code> と <code>state["espeed"] = 3</code> の 2 行を追加します（茶色の辞書代入を 2 つ）。'
                'これでリトライ時にタイマーも初期値へ戻ります',
                '▶ 実行して、最初は遅かった敵が時間とともに少しずつ速くなっていけば成功です。'
                '左下の Speed 表示が 5 秒ごとに 3 → 4 → 5 と増えていくのを確認しましょう',
            ],
            figure_basename="game_15_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>state 辞書に <code>"frame": 0</code> と <code>"espeed": 3</code> の 2 行を追加します（茶色の辞書リテラルブロックの最後に並べる）。'
                                 'タイマーと派生値も <code>state</code> にまとめておくのが定石です。',
                'update_play.py': '<strong>変更点：</strong>関数の先頭に 2 行のブロックを追加します。'
                                  '<code>state["frame"] = state["frame"] + 1</code> と '
                                  '<code>state["espeed"] = 3 + state["frame"] // 300</code> です。'
                                  'さらに敵の落下式を <code>state["ey"] = state["ey"] + 3</code> から '
                                  '<code>state["ey"] = state["ey"] + state["espeed"]</code> に書き換えます。',
                'draw_play.py': '<strong>変更点：</strong>関数の最後に青色の <code>game_draw_text</code> ブロックを 1 つ追加し、'
                                '<code>"Speed: " + str(state["espeed"])</code> を薄い灰色 <code>"#aaaaaa"</code> で <code>(10, 50)</code> に描画します。',
                'update_over.py': '<strong>変更点：</strong>Enter キーでのリセット処理に '
                                  '<code>state["frame"] = 0</code> と <code>state["espeed"] = 3</code> の 2 行を追加します。'
                                  'リトライ時にタイマーと敵速度も初期値へ戻すための処理です。',
                'draw_over.py': '画面中央に「GAME OVER」と「Final Score: ◯」を描く内容はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
                          '<strong>このステップでは何も変えません</strong>。',
            },
        ),
        Step(
            title="30 秒生き延びたら GAME CLEAR! にしよう",
            instructions=[
                '前のステップで「時間とともに加速する」仕組みは動きました。'
                'でも、ずっと続くだけでは「クリア」というゴールがありません。'
                '<strong>30 秒（=1800 frames）生き延びたらクリア</strong>にしましょう',
                '<code>update_play.py</code> を開き、ステップ 1 で追加した「frame +=1 / espeed 計算」の 2 行の<strong>下</strong>に、'
                '紫色の <code>pico_if</code> ブロックを 1 つ追加します。'
                '条件は <code>state["frame"] &gt;= 1800</code>、'
                '中身は <code>state["mode"] = "clear"</code>（茶色の辞書代入＋紫色の文字列ブロック）です',
                '<code>draw_play.py</code> を開き、関数の最後に「Time: ◯」の HUD を追加します。'
                '青色の <code>game_draw_text</code> ブロックを 1 つ置き、'
                '文字には <code>"Time: " + str(30 - state["frame"] // 60)</code>'
                '（"Time: " ＋ <code>str()</code>（橙色の 30 ─ <code>state["frame"] // 60</code>））、'
                '色は <code>"#ffffff"</code>（白）、座標は <code>(200, 50)</code> を入れます',
                '<code>draw_over.py</code> を開き、関数の中身を書き換えます。'
                '<strong>今までは「GAME OVER」だけでしたが</strong>、'
                'まず紫色の <code>pico_if_else</code> ブロック（または <code>pico_if</code> ×2）で'
                '「<code>state["mode"] == "clear"</code> なら GAME CLEAR! を黄色 <code>"#ffeb3b"</code> で <code>(200, 160)</code> に、'
                'それ以外は GAME OVER を赤 <code>"#ff3232"</code> で <code>(220, 160)</code> に」'
                'と分岐します。Final Score の表示はそのまま（分岐の外）残します',
                '▶ 実行して、敵に当たらないように 30 秒生き延びると「GAME CLEAR!」が黄色で表示されれば成功です。'
                '残機が尽きると今まで通り赤い「GAME OVER」になります。Enter で再スタートすればタイマーも 0 から再開します',
            ],
            figure_basename="game_15_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'update_play.py': '<strong>変更点：</strong>関数先頭の「frame += 1 / espeed 計算」の下に、紫色の <code>pico_if</code> を 1 つ追加します。'
                                  '条件は <code>state["frame"] &gt;= 1800</code>、'
                                  '中身は <code>state["mode"] = "clear"</code>。これで 30 秒経つと自動的にクリア画面へ遷移します。',
                'draw_play.py': '<strong>変更点：</strong>関数の最後に青色の <code>game_draw_text</code> ブロックを 1 つ追加し、'
                                '<code>"Time: " + str(30 - state["frame"] // 60)</code> を白で <code>(200, 50)</code> に描画します。'
                                '残り秒数の HUD です。',
                'draw_over.py': '<strong>変更点：</strong>関数の冒頭を紫色の <code>pico_if_else</code> で分岐させます。'
                                '<code>state["mode"] == "clear"</code> なら「GAME CLEAR!」を黄色 <code>"#ffeb3b"</code> で <code>(200, 160)</code> に、'
                                'else なら「GAME OVER」を赤 <code>"#ff3232"</code> で <code>(220, 160)</code> に。'
                                'Final Score の表示は分岐の<strong>外</strong>に残し、両方の終了状態で同じ位置に表示します。',
                'game_funcs.py': '<code>state</code> 辞書はステップ 1 から変更ありません。'
                                 '<strong>このステップでは何も変えません</strong>。',
                'update_over.py': 'Enter キーでのリセット処理もステップ 1 のまま。'
                                  '<strong>このステップでは何も変えません</strong>。'
                                  '<code>state["mode"] = "play"</code> の代入で「clear」「over」のどちらからでも復帰できます。',
                'main.py': 'ゲームループの分岐構造はそのまま。'
                          '<strong>このステップでは何も変えません</strong>。'
                          '<code>"play"</code> 以外（=「over」も「clear」も）のときは <code>update_over</code> ＋ <code>draw_over</code> を呼ぶだけで両方扱えます。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="4-15-1",
            title="残り 10 秒以下で Time: HUD を赤くしよう",
            lead='残り時間が少なくなってきたとき、見た目で「やばい！」と分かる演出を入れましょう。'
                 '<code>state["frame"] // 60</code>（経過秒数）が <strong>20 を超えたら（=残り 10 秒以下なら）</strong>'
                 '「Time: ◯」HUD を赤色 <code>"#ff3232"</code> で表示するようにします。'
                 '触るのは <code>draw_play.py</code> 1 ファイルだけ。<strong>条件分岐で表示色を切り替える</strong>定番パターンの練習です。',
            figure_basename="game_15_a_redtime",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>draw_play.py</code> を開き、ステップ 2 で追加した「Time: ◯」の '
                        '<code>game_draw_text</code> ブロックを<strong>削除</strong>します。'
                        '代わりに紫色の <code>pico_if_else</code> ブロックを 1 つ置き、'
                        '条件は <code>state["frame"] // 60 &lt;= 20</code>（=残り 10 秒以上）。'
                        '<code>true</code> 側には白色 <code>"#ffffff"</code> の Time テキスト、'
                        '<code>false</code> 側には赤色 <code>"#ff3232"</code> の Time テキスト（中身は同じ <code>"Time: " + str(30 - state["frame"] // 60)</code>）を置きます。'
                        '<strong>「同じ表示を、状態によって違う色で出す」</strong>のはアラート系演出の基本です。',
            file_descriptions={
                'draw_play.py': 'ステップ 2 で追加した「Time: ◯」<code>game_draw_text</code> を削除し、'
                                '紫色の <code>pico_if_else</code> で囲んで色を切り替えます。'
                                '条件は <code>state["frame"] // 60 &lt;= 20</code>。'
                                '<code>true</code> なら白、<code>false</code> なら赤色で同じ Time 文字を描きます。',
            },
        ),
        Kadai(
            number="4-15-2",
            title="速度の上限を 8 にして無敵化を防ごう",
            lead='今のままだと、長く生き延びるほど敵が速くなり続けて、'
                 '画面上でほぼ瞬間移動レベルになってしまいます。'
                 '<code>state["espeed"]</code> に <strong>上限 8</strong> を設定して、'
                 '一定の難しさで頭打ちになるようにしましょう。'
                 '触るのは <code>update_play.py</code> 1 ファイル。<strong>「計算 → 上限チェック」</strong>の 2 段構えで値をクランプします。',
            figure_basename="game_15_b_speedcap",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>update_play.py</code> を開き、ステップ 1 で追加した '
                        '<code>state["espeed"] = 3 + state["frame"] // 300</code> の<strong>直後</strong>に、'
                        '紫色の <code>pico_if</code> ブロックを 1 つ追加します。'
                        '条件は <code>state["espeed"] &gt; 8</code>、'
                        '中身は <code>state["espeed"] = 8</code>（茶色の辞書代入＋数値ブロック 8）。'
                        'これで espeed は 3 → 4 → 5 → 6 → 7 → 8 と上がってきて、'
                        '8 を超えたら 8 に固定されるようになります。'
                        '<strong>「最大値クランプ」</strong>はゲームバランス調整の超基礎テクニックです。',
            file_descriptions={
                'update_play.py': 'ステップ 1 で追加した <code>state["espeed"] = 3 + state["frame"] // 300</code> の直後に、'
                                  '紫色の <code>pico_if</code> ブロックを 1 つ追加します。'
                                  '条件は <code>state["espeed"] &gt; 8</code>、'
                                  '中身は <code>state["espeed"] = 8</code>。'
                                  'これで上限 8 を超えないようにクランプできます。',
            },
        ),
        Kadai(
            number="4-15-3",
            title="ゲーム終了画面に Final Time を追加しよう",
            lead='ゲームオーバー / クリア画面で「何秒生き延びたか」が分かると、'
                 '次のプレイへのモチベーションになります。'
                 '<code>draw_over.py</code> に <strong>Final Time: ◯ sec</strong> の表示を追加しましょう。'
                 '触るのは <code>draw_over.py</code> 1 ファイルだけ。'
                 '<strong>「state に既にある値を別の画面で読むだけ」</strong>のシンプルな練習です。',
            figure_basename="game_15_c_finaltime",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='<code>draw_over.py</code> を開き、Final Score: ◯ の <code>game_draw_text</code> の<strong>下</strong>に、'
                        'もう 1 つ青色の <code>game_draw_text</code> ブロックを追加します。'
                        '文字には <code>"Final Time: " + str(state["frame"] // 60) + " sec"</code>'
                        '（橙色の文字列連結を 2 段重ねる：'
                        '<code>"Final Time: "</code> + <code>str(state["frame"] // 60)</code> + <code>" sec"</code>）、'
                        '色は <code>"#aaaaaa"</code>（薄い灰色）、座標は <code>(200, 270)</code> を入れます。'
                        '<strong>「同じ <code>state["frame"]</code> という生データを、別の場所・別の表現で再利用する」</strong>のが state 辞書の旨味です。',
            file_descriptions={
                'draw_over.py': 'Final Score の <code>game_draw_text</code> の下に、もう 1 つ青色の <code>game_draw_text</code> ブロックを追加します。'
                                '文字は <code>"Final Time: " + str(state["frame"] // 60) + " sec"</code>、'
                                '色は薄い灰色 <code>"#aaaaaa"</code>、座標は <code>(200, 270)</code>。'
                                'GAME OVER / GAME CLEAR どちらの画面でも同じ位置に経過時間が出ます。',
            },
        ),
    ],
    summary_bullets=[
        '<code>state["frame"] += 1</code> を毎フレーム実行するだけで、ゲーム内の経過時間がカウントできる',
        '<code>state["espeed"] = 3 + state["frame"] // 300</code> のように <strong>派生値を state に持つ</strong>と、表示と挙動の両方で同じ値が使えて便利',
        '<code>state["frame"] &gt;= 1800</code>（30 秒）で <code>state["mode"] = "clear"</code> に分岐するだけで「制限時間制クリア」が成立する',
        '<code>draw_over.py</code> で <code>state["mode"]</code> を判定すれば、'
        '<strong>1 つのファイルで GAME OVER と GAME CLEAR を出し分け</strong>られる',
        'リトライ時には <code>state["frame"]</code> と <code>state["espeed"]</code> も忘れずに初期値へ戻す。'
        '残機・スコアと同じく「初期化リスト」を update_over に並べておくのが鉄板',
    ],
    next_article_id=4076,
    next_article_title='【Pygameでゲーム⑯】◯◯◯',
    cache_buster="20260509e",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑮】タイマーで難易度を上げよう")
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
