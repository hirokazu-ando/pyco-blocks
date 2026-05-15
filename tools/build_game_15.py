#!/usr/bin/env python3
"""WP 記事 4076 (Pygame⑯ 上下にも動かそう = 2D よけゲーム集大成) の本文を組み立てて反映する。

新⑮（state["frame"] と state["espeed"] によるタイマー難易度カーブ）で完成した
よけゲームの上に、state["py"] を追加して上下にも動けるようにする。
プレイヤーが上下に動くと、衝突判定（player_hit）の y も追従させる必要がある。

これが Part 4「ゲーム処理の基本」の集大成にあたる記事。
ここまでで lives / score / frame / espeed / clear モード / 2D 移動 / 2D 当たり判定 が
すべて揃い、Part 5 以降のジャンル別分岐への準備が整う。
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
    "eyecatch_game-4-15_updown.png"
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

# Step 1 — state["py"] を追加し、上下キーで py を動かす。
# プレイヤー描画を (px, py) にし、画面端でクランプ。Enter リトライで py = 176 もリセット。
# ただしこのステップでは player_hit の y はまだ固定 342 のままなので、
# プレイヤーが下に逃げても上半身で当たらない（Step 2 で修正）。
CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("2D Dodge")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176, "ex": random.randint(0, 576), "ey": -48,
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
    if pygame.key.get_pressed()[pygame.K_UP]:    state["py"] = state["py"] - 4
    if pygame.key.get_pressed()[pygame.K_DOWN]:  state["py"] = state["py"] + 4
    if state["py"] < 0:   state["py"] = 0
    if state["py"] > 352: state["py"] = 352
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
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
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
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
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

# Step 2 — 2D 当たり判定にする。
# Step 1 では player_hit の y が固定 342 だったので、プレイヤーが上に逃げると当たらない。
# ここで player_hit の y を py 連動（py + 12）に変えて、プレイヤーの実際の位置で判定する。
CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("2D Dodge")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176, "ex": random.randint(0, 576), "ey": -48,
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
    if pygame.key.get_pressed()[pygame.K_UP]:    state["py"] = state["py"] - 4
    if pygame.key.get_pressed()[pygame.K_DOWN]:  state["py"] = state["py"] + 4
    if state["py"] < 0:   state["py"] = 0
    if state["py"] > 352: state["py"] = 352
    state["ey"] = state["ey"] + state["espeed"]
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
    player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
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
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
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
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
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

# 課題A 4-16-1 — リトライでスタート位置（px）をランダムにする。
# update_over.py のみ変更。Enter キー押下時の px を 296 固定から random.randint(0, 592) に。
CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("2D Dodge")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176, "ex": random.randint(0, 576), "ey": -48,
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
    if pygame.key.get_pressed()[pygame.K_UP]:    state["py"] = state["py"] - 4
    if pygame.key.get_pressed()[pygame.K_DOWN]:  state["py"] = state["py"] + 4
    if state["py"] < 0:   state["py"] = 0
    if state["py"] > 352: state["py"] = 352
    state["ey"] = state["ey"] + state["espeed"]
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
    player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
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
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
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
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = random.randint(0, 592)
        state["py"] = 176
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
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

# 課題B 4-16-2 — 動ける範囲を画面下半分のみにする。
# update_play.py のみ変更。py のクランプを 0〜352 から 200〜352 に絞る。
CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("2D Dodge")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 200, "ex": random.randint(0, 576), "ey": -48,
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
    if pygame.key.get_pressed()[pygame.K_UP]:    state["py"] = state["py"] - 4
    if pygame.key.get_pressed()[pygame.K_DOWN]:  state["py"] = state["py"] + 4
    if state["py"] < 200: state["py"] = 200
    if state["py"] > 352: state["py"] = 352
    state["ey"] = state["ey"] + state["espeed"]
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
    player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
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
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
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
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 200
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
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

# 課題C 4-16-3 — ハイスコアを画面右下に表示する。
# state に "hiscore": 0 を追加し、score > hiscore のときに hiscore を更新。
# update_over でリトライしても hiscore はリセットしないのがポイント。
# draw_play の右下に "HiScore: ◯" を黄色で描画。
CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("2D Dodge")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176, "ex": random.randint(0, 576), "ey": -48,
         "score": 0, "lives": 3, "frame": 0, "espeed": 3, "hiscore": 0}


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
    if pygame.key.get_pressed()[pygame.K_UP]:    state["py"] = state["py"] - 4
    if pygame.key.get_pressed()[pygame.K_DOWN]:  state["py"] = state["py"] + 4
    if state["py"] < 0:   state["py"] = 0
    if state["py"] > 352: state["py"] = 352
    state["ey"] = state["ey"] + state["espeed"]
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
        state["score"] = state["score"] + 1
        if state["score"] > state["hiscore"]:
            state["hiscore"] = state["score"]
    player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
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
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
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
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("HiScore: " + str(state["hiscore"]), True, "#ffeb3b"), (440, 370))


# ─── update_over.py ────────────────────────────────────────────
import pygame
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
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


SPEC = Spec(
    page_id=4076,
    slug="game-16-2d-dodge",
    title="上下にも動かそう",
    intro_paragraphs=[
        '前回（記事⑮）は <code>state</code> 辞書に <code>"frame"</code> と <code>"espeed"</code> を追加して、'
        'タイマーで難易度が上がる仕組みを作りました。'
        '残機・スコア・5 秒ごと加速・30 秒で GAME CLEAR! まで入った、それなりに遊べるよけゲームです。',
        'ただ、まだ <strong>プレイヤーは左右にしか動けません</strong>。'
        '落ちてくる敵が画面の端に近いときは、避けようとしても画面の端で詰まってしまいます。'
        '今回は <code>state</code> 辞書に <code>"py": 176</code> を追加して、'
        '<strong>上下キーでも動けるように</strong>しましょう。'
        'プレイヤーが上下に動けるようになると、'
        '当たり判定も <code>py</code> に追従させて <strong>2D 当たり判定</strong>にする必要があります。',
        'ここまでで <strong>5 ファイル分割 + state 辞書 + score + lives + frame + espeed + clear モード + 2D 移動 + 2D 当たり判定</strong> が'
        'すべて揃い、Part 4「ゲーム処理の基本」の集大成となります。'
        'これ以降は Part 5（シューティング）・Part 6（アクション）・Part 7（パズル）と、'
        '<strong>好きなジャンルへ自由に分岐</strong>して様々なゲームを作る段階に入ります。',
    ],
    eyecatch_basename="eyecatch_game_16_2d_dodge",
    iframe_xml="game_16_step1_final.xml",
    learn_bullets=[
        '<code>state</code> 辞書に <code>"py": 176</code> を追加して、プレイヤーの y 座標も状態として持つ方法',
        '<code>pygame.K_UP</code> / <code>pygame.K_DOWN</code> キーで <code>state["py"]</code> を ±4 動かす操作',
        'プレイヤーの y 座標を画面端でクランプ（<code>0 &lt;= py &lt;= 352</code>）して画面外にはみ出さないようにする方法',
        'プレイヤー描画を <code>(px, py)</code> の 2D 座標で行うように <code>draw_play.py</code> を修正する手順',
        'プレイヤーが上下に動くと <strong>当たり判定もずれる</strong>問題と、'
        '<code>player_hit</code> の y を <code>py + 12</code> に書き換える <strong>2D 当たり判定</strong>',
        'リトライ時に <code>state["py"]</code> も初期値（176）へ戻す処理',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='今回出てくる「2D 移動」「2D 当たり判定」は、これまで縦軸を意識せずに済んでいた処理を本格的に 2D 化する考え方です。'
                'まず言葉と役割を結びつけてから、ブロックの組み立てに入りましょう。',
    terms_table=[
        ("2D 移動",
         "プレイヤーが x 方向だけでなく y 方向にも動けるようにすること。<code>state[\"px\"]</code> と <code>state[\"py\"]</code> の両方を毎フレーム更新する",
         "<code>state[\"py\"] = state[\"py\"] - 4</code>"),
        ("クランプ",
         "値を「最小値 ～ 最大値」の範囲に収めること。<code>0 &lt;= py &lt;= 352</code> ならプレイヤーが画面外に飛び出さない",
         "<code>if state[\"py\"] &lt; 0: state[\"py\"] = 0</code>"),
        ("ヒットボックス",
         "実際に当たり判定に使う矩形。プレイヤーは絵の <strong>真ん中 24×24</strong> だけが当たるようにすると、画素レベルでの精度より「遊びやすさ」が出る",
         "<code>pygame.Rect(px + 12, py + 12, 24, 24)</code>"),
        ("2D 当たり判定",
         "x だけでなく y も含めて衝突を見ること。Rect ベースの <code>colliderect</code> は元から 2D に対応しているので、<strong>y を py 連動に書き換えるだけ</strong>で済む",
         "<code>player_hit = pygame.Rect(state[\"px\"] + 12, state[\"py\"] + 12, 24, 24)</code>"),
        ("ハイスコア",
         "プレイ中の最高記録。<code>state[\"hiscore\"]</code> に保持して、<strong>リトライ時にもリセットしない</strong>のがポイント（課題 C で扱う）",
         "<code>if state[\"score\"] &gt; state[\"hiscore\"]: state[\"hiscore\"] = state[\"score\"]</code>"),
    ],
    file_roles_h2="ファイル構成のおさらい（前回まで作った 6 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。<code>state</code> 辞書に '
         '<code>"mode"</code>・<code>"px"</code>・<code>"ex"</code>・<code>"ey"</code>・'
         '<code>"score"</code>・<code>"lives"</code>・<code>"frame"</code>・<code>"espeed"</code> が入っています。'
         '<strong>今回はここに <code>"py": 176</code> の 1 行を追加します</strong>。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<strong>今回は上下キーでの py 移動と py のクランプを追加し、'
         'ステップ 2 では <code>player_hit</code> の y を <code>py + 12</code> に書き換えて 2D 当たり判定に対応させます</strong>。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<strong>今回はプレイヤーの矩形を <code>(state["px"], 330)</code> から <code>(state["px"], state["py"])</code> に書き換える</strong>だけで OK です。'
         'Score / Lives / Speed / Time の HUD はそのまま。'),
        ("update_over.py",
         '<strong>ゲームオーバー / クリア画面の更新ロジック</strong>。'
         '<strong>今回はリトライ時のリセット処理に <code>state["py"] = 176</code> を追加します</strong>。'
         '残機・スコア・タイマー・敵速度の隣に並べる形です。'),
        ("draw_over.py",
         '<strong>ゲーム終了画面の描画</strong>。'
         '前回作った GAME CLEAR! / GAME OVER の出し分け + Final Score 表示はそのまま。'
         '<strong>今回は何も変えません</strong>。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
         '<strong>今回もこのファイルを編集しません</strong>。'
         '上下移動を足してもループ構造は無傷で済みます。'),
    ],
    steps=[
        Step(
            title="上下にも動けるようにしよう",
            instructions=[
                '前回までの 5 ファイル分割の状態からスタートします。'
                'まず <code>game_funcs.py</code> の <strong>state 辞書（茶色の <code>py_dict_literal</code> ブロック）</strong>に'
                '<code>"py": 176</code> を 1 項目追加します（<code>"px": 296</code> の隣に並ぶ形）',
                '次に <code>update_play.py</code> を開き、'
                '<strong>左右キーの分岐の下</strong>に上下キーの分岐を 2 つ追加します。'
                '<code>K_UP</code> なら <code>state["py"] = state["py"] - 4</code>、'
                '<code>K_DOWN</code> なら <code>state["py"] = state["py"] + 4</code>（紫色の <code>pico_if</code> ＋茶色の辞書代入）',
                '同じ <code>update_play.py</code> で、上下移動の<strong>直後</strong>に画面端クランプを 2 つ追加します。'
                '<code>state["py"] &lt; 0</code> なら <code>state["py"] = 0</code>、'
                '<code>state["py"] &gt; 352</code> なら <code>state["py"] = 352</code>（紫色の <code>pico_if</code> ＋数値ブロック）',
                '<code>draw_play.py</code> を開き、'
                '<strong>プレイヤーを描く <code>game_draw_rect</code> ブロックの y 引数</strong>を、'
                '数値 330 から <strong><code>state["py"]</code> の辞書取得ブロック</strong>に差し替えます。'
                '高さ 48・幅 48 はそのまま',
                '<code>update_over.py</code> を開き、Enter キーでのリセット処理に'
                '<code>state["py"] = 176</code> の 1 行を追加します（茶色の辞書代入を 1 つ）。'
                'これでリトライ時にプレイヤーの位置も画面中央に戻ります',
                '▶ 実行して、上下キーで青い四角が画面の上下にも動けば成功です。'
                'ただし当たり判定はまだ Step 1 の状態（プレイヤーの位置 (px, 342) が固定）なので、'
                'プレイヤーが上に移動してもその場で当たります。これは Step 2 で直します',
            ],
            figure_basename="game_16_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>state 辞書に <code>"py": 176</code> を追加します（茶色の辞書リテラルブロック）。'
                                 '<code>"px": 296</code> の隣に並べるのが分かりやすいです。',
                'update_play.py': '<strong>変更点：</strong>左右キー分岐の下に、上下キー分岐を 2 つ追加します。'
                                  '<code>K_UP</code> で <code>py -= 4</code>、<code>K_DOWN</code> で <code>py += 4</code>。'
                                  'さらに上下移動の直後に画面端クランプ <code>0 &lt;= py &lt;= 352</code> を入れます。',
                'draw_play.py': '<strong>変更点：</strong>プレイヤーを描く <code>game_draw_rect</code> の y を、'
                                '数値 330 から <code>state["py"]</code> 取得に差し替えるだけ。',
                'update_over.py': '<strong>変更点：</strong>Enter キーでのリセット処理に <code>state["py"] = 176</code> の 1 行を追加します。',
                'draw_over.py': 'GAME CLEAR! / GAME OVER の分岐 + Final Score の表示はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
                          '<strong>このステップでは何も変えません</strong>。',
            },
        ),
        Step(
            title="2D 当たり判定にしよう",
            instructions=[
                '前のステップでプレイヤーは上下にも動けるようになりましたが、'
                '<strong>当たり判定は Step 1 のときの位置 (px, 342) で固定</strong>のままです。'
                'プレイヤーを上に移動させても画面下部で衝突が起きてしまいます',
                '<code>update_play.py</code> を開き、<strong>player_hit の y 座標</strong>を書き換えます。'
                '今までは <code>pygame.Rect(state["px"] + 12, 342, 24, 24)</code> でしたが、'
                '<code>342</code>（橙色の数値ブロック）を <code>state["py"] + 12</code>（茶色の辞書取得＋橙色の <code>+</code> ＋数値 <code>12</code>）'
                'に差し替えます',
                '差し替えるのは <strong>1 ブロックだけ</strong>。'
                '敵側の <code>enemy_hit</code> は元から <code>state["ey"] + 12</code> なので変更不要です',
                '▶ 実行して、プレイヤーを上下に動かしながら敵が降ってくる流れに合わせて避けると、'
                '<strong>プレイヤーの位置で正確に当たり判定が起きる</strong>ようになっていれば成功です。'
                'これで Part 4 の集大成「2D よけゲーム」が完成しました',
            ],
            figure_basename="game_16_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'update_play.py': '<strong>変更点：</strong><code>player_hit</code> の y 座標を、固定値 <code>342</code> から '
                                  '<code>state["py"] + 12</code> に書き換えます。'
                                  'これで「プレイヤーの実際の位置」で当たり判定が起きるようになります。',
                'game_funcs.py': '<code>state</code> 辞書はステップ 1 から変更ありません。'
                                 '<strong>このステップでは何も変えません</strong>。',
                'draw_play.py': 'プレイヤー / 敵 / Score / Lives / Speed / Time の描画はステップ 1 のまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'update_over.py': 'Enter キーでのリセット処理もステップ 1 のまま。'
                                  '<strong>このステップでは何も変えません</strong>。',
                'draw_over.py': 'GAME CLEAR! / GAME OVER の分岐 + Final Score の表示はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': 'ゲームループの分岐構造はそのまま。'
                          '<strong>このステップでは何も変えません</strong>。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="4-16-1",
            title="リトライでスタート位置をランダムにしよう",
            lead='毎回同じ位置（画面中央）からスタートすると、'
                 '少し物足りなく感じてきます。'
                 'リトライ時に <strong>x 座標だけランダム</strong>にして、'
                 '緊張感のある復帰にしましょう。'
                 '触るのは <code>update_over.py</code> 1 ファイルだけ。'
                 '<strong>「リセット時に乱数を混ぜる」</strong>のはゲームの単調さを減らす定番テクニックです。',
            figure_basename="game_16_a_random_start",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>update_over.py</code> を開き、'
                        'Enter キー押下時のリセット処理にある <code>state["px"] = 296</code>（茶色の辞書代入＋数値 296）の'
                        '<strong>数値 296 を <code>random.randint(0, 592)</code> ブロック</strong>に差し替えます。'
                        '<code>random</code> モジュールは <code>game_import_random</code> ブロックで読み込み、'
                        '<code>game_random_int</code> ブロックの引数に <code>0</code> と <code>592</code> を入れます。'
                        '<code>state["py"] = 176</code> はそのまま（y はランダム化しない）。'
                        '<strong>「画面端からの復帰もありえる」</strong>ようになって、'
                        'プレイ感が一気に変わります。',
            file_descriptions={
                'update_over.py': 'Enter キー押下時のリセット処理で、<code>state["px"] = 296</code> の右辺を '
                                  '<code>random.randint(0, 592)</code> に差し替えます。'
                                  '<code>random</code> をこのファイルでも import する必要があるので、'
                                  '先頭の <code>game_import_random</code> ブロックを忘れずに。',
            },
        ),
        Kadai(
            number="4-16-2",
            title="動ける範囲を画面下半分にしよう",
            lead='2D 移動だと自由度が高すぎて、'
                 '画面の上に逃げ続けることもできてしまいます。'
                 '<strong>動ける範囲を画面下半分のみ（py: 200 〜 352）に制限</strong>して、'
                 '上から降ってくる敵をきちんと避ける必要があるゲーム性に戻しましょう。'
                 '触るのは <code>update_play.py</code> 1 ファイル。'
                 '<strong>「クランプの最小値を変えるだけ」</strong>でゲームバランスを調整できる練習です。',
            figure_basename="game_16_b_yclamp",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>update_play.py</code> を開き、ステップ 1 で追加した '
                        '<code>if state["py"] &lt; 0: state["py"] = 0</code> の'
                        '<strong>条件と代入の数値を両方とも <code>200</code> に変える</strong>だけ。'
                        '具体的には条件を <code>state["py"] &lt; 200</code> に、'
                        '中身を <code>state["py"] = 200</code> に差し替えます。'
                        '<code>game_funcs.py</code> 側のスタート位置も <code>"py": 200</code> に揃えると、'
                        '最初から下半分エリアに配置されて自然です。'
                        '<strong>「動ける範囲を絞る」</strong>のはゲームバランスの基本テクで、'
                        '同じ仕組みで「上半分のみ」「中央の帯のみ」など色々試せます。',
            file_descriptions={
                'update_play.py': 'ステップ 1 の y クランプ <code>0 &lt;= py &lt;= 352</code> を、'
                                  '<code>200 &lt;= py &lt;= 352</code> に書き換えます（最小値だけ 0 → 200 に変更）。',
                'game_funcs.py': 'スタート位置を <code>"py": 200</code> に変えると、'
                                 '最初から下半分エリアに配置されて自然です。'
                                 '<code>update_over.py</code> のリトライ時の <code>state["py"]</code> も 200 に揃えるのを忘れずに。',
            },
        ),
        Kadai(
            number="4-16-3",
            title="ハイスコアを画面に表示しよう",
            lead='ゲームを何度もリトライしているうちに、'
                 '<strong>「自分の最高記録」</strong>が気になってきます。'
                 'state に <code>"hiscore": 0</code> を追加して、'
                 'スコアを更新するたびに hiscore も更新、リトライ時には hiscore は <strong>リセットしない</strong> のがポイント。'
                 '触るのは <code>game_funcs.py</code> + <code>update_play.py</code> + <code>draw_play.py</code> の 3 ファイル。'
                 '<strong>「リセットされる値とされない値」</strong>の使い分けを学ぶ練習です。',
            figure_basename="game_16_c_hiscore",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='まず <code>game_funcs.py</code> の state 辞書に '
                        '<code>"hiscore": 0</code> を追加します（茶色の辞書リテラルの末尾）。'
                        '<code>update_play.py</code> では、スコア加算 <code>state["score"] = state["score"] + 1</code> の'
                        '<strong>直後</strong>に紫色の <code>pico_if</code> を追加し、'
                        '条件 <code>state["score"] &gt; state["hiscore"]</code>、'
                        '中身 <code>state["hiscore"] = state["score"]</code> を入れます。'
                        '<code>draw_play.py</code> の最後に、青色の <code>game_draw_text</code> ブロックを 1 つ置き、'
                        '<code>"HiScore: " + str(state["hiscore"])</code> を黄色 <code>"#ffeb3b"</code> で <code>(440, 370)</code> に描画。'
                        '<code>update_over.py</code> のリトライ処理は <strong>触らない</strong>のが大事。'
                        '<strong>hiscore はリセットしない</strong>から、何度リトライしても最高記録が残ります。',
            file_descriptions={
                'game_funcs.py': 'state 辞書に <code>"hiscore": 0</code> を 1 項目追加します（茶色の辞書リテラルの最後）。',
                'update_play.py': 'スコア加算 <code>state["score"] = state["score"] + 1</code> の直後に、'
                                  '紫色の <code>pico_if</code> ブロックを 1 つ追加。'
                                  '条件は <code>state["score"] &gt; state["hiscore"]</code>、中身は '
                                  '<code>state["hiscore"] = state["score"]</code>。',
                'draw_play.py': '関数の最後に青色の <code>game_draw_text</code> ブロックを 1 つ追加し、'
                                '<code>"HiScore: " + str(state["hiscore"])</code> を黄色 <code>"#ffeb3b"</code>、'
                                'サイズ 24 で <code>(440, 370)</code> に描画します。',
                'update_over.py': '<strong>ここは触りません</strong>。'
                                  'hiscore をリセットしないことで、リトライしても最高記録が残るのがポイントです。',
            },
        ),
    ],
    summary_bullets=[
        '<code>state</code> 辞書に <code>"py"</code> を追加して、左右だけだったプレイヤー操作を <strong>2D 移動</strong>に拡張できる',
        '上下キー（<code>K_UP</code> / <code>K_DOWN</code>）と画面端クランプの組み合わせで、プレイヤーが画面外にはみ出さない 2D 操作が完成する',
        '<code>player_hit</code> の y を <code>py + 12</code> に書き換えるだけで、'
        '<code>pygame.Rect</code> ベースの当たり判定は <strong>そのまま 2D 化</strong>できる',
        'リトライ時には <code>state["py"]</code> も忘れずに初期値へ戻す。'
        '逆に <strong>hiscore のように「リセットしない値」</strong>もある（課題 C）',
        'これで Part 4「ゲーム処理の基本」は完結。'
        '5 ファイル分割・state 辞書・state 機械・2D 移動・2D 当たり判定・タイマー・残機・クリア分岐が揃った。'
        '次回以降の Part 5（シューティング）/ Part 6（アクション）/ Part 7（パズル）は、ここで作った 6 ファイル構成を土台に <strong>好きなジャンルへ自由に分岐</strong>できる',
    ],
    next_article_id=4077,
    next_article_title='【Pygameでゲーム⑰】◯◯◯',
    cache_buster="20260509m",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑯】上下にも動かそう")
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
