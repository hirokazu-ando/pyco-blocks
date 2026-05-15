#!/usr/bin/env python3
"""WP 記事 4077 (Pygame⑰ 敵を増やしてみよう = list + for ループ) の本文を組み立てて反映する。

新⑯ で完成した「2D よけゲーム」の枠組みは、敵がまだ 1 体しか出てこない。
新⑰ では state["exs"] / state["eys"] を list 化して 3 体に増やし、
for i in range(0, 3, 1) で同じロジックをまとめて回す方法を導入する。

Step 1 で 3 体ハードコードの list ループ、Step 2 で range(0, len(exs), 1)
に書き換えてリスト長で自動化、課題で 5 体・個別速度・5 体個別速度に発展。
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
    "eyecatch_game-4-16_multi.png"
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

# Step 1 — 敵を 3 体に増やす（state["exs"] / state["eys"] を list 化）。
# update_play / draw_play の中で `for i in range(0, 3, 1):` を使ってまとめて処理。
CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Multi Enemies")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [100, 320, 540]
state["eys"] = [-48, -200, -400]
state["score"] = 0
state["lives"] = 3
state["frame"] = 0
state["espeed"] = 3


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
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, 3, 1):
        eys[i] = eys[i] + state["espeed"]
        if eys[i] > 400:
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            state["score"] = state["score"] + 1
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, 3, 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
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
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [100, 320, 540]
        state["eys"] = [-48, -200, -400]
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

# Step 2 — range(0, 3, 1) を range(0, len(exs), 1) に書き換える。
# これでリストの長さに合わせて自動でループ範囲が決まるので、
# 課題 A や C のように敵を 5 体に増やしても update_play / draw_play は触らずに済む。
CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Multi Enemies")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [100, 320, 540]
state["eys"] = [-48, -200, -400]
state["score"] = 0
state["lives"] = 3
state["frame"] = 0
state["espeed"] = 3


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
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        eys[i] = eys[i] + state["espeed"]
        if eys[i] > 400:
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            state["score"] = state["score"] + 1
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
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
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [100, 320, 540]
        state["eys"] = [-48, -200, -400]
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

# 課題A 4-17-1 — 敵を 5 体に増やす。
# Step 2 の len(exs) ループのおかげで、game_funcs.py と update_over.py を 5 要素に変えるだけで済む。
CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Multi Enemies")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [60, 200, 340, 460, 580]
state["eys"] = [-48, -160, -280, -400, -520]
state["score"] = 0
state["lives"] = 3
state["frame"] = 0
state["espeed"] = 3


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
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        eys[i] = eys[i] + state["espeed"]
        if eys[i] > 400:
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            state["score"] = state["score"] + 1
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
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
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [60, 200, 340, 460, 580]
        state["eys"] = [-48, -160, -280, -400, -520]
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

# 課題B 4-17-2 — 敵ごとの落下速度を別々にする。
# state["speeds"] = [3, 4, 2] を追加し、`eys[i] += state["espeed"]` を `eys[i] += speeds[i]` に。
CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Multi Enemies")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [100, 320, 540]
state["eys"] = [-48, -200, -400]
state["speeds"] = [3, 4, 2]
state["score"] = 0
state["lives"] = 3
state["frame"] = 0
state["espeed"] = 3


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
    exs = state["exs"]
    eys = state["eys"]
    speeds = state["speeds"]
    for i in range(0, len(exs), 1):
        eys[i] = eys[i] + speeds[i]
        if eys[i] > 400:
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            state["score"] = state["score"] + 1
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
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
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [100, 320, 540]
        state["eys"] = [-48, -200, -400]
        state["speeds"] = [3, 4, 2]
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

# 課題C 4-17-3 — 課題 B（speeds による個別速度）を 5 体に拡張。
# game_funcs.py と update_over.py の list を 5 要素に揃えるだけ。len(exs) ループで自動対応。
CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Multi Enemies")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [60, 200, 340, 460, 580]
state["eys"] = [-48, -160, -280, -400, -520]
state["speeds"] = [3, 4, 2, 5, 3]
state["score"] = 0
state["lives"] = 3
state["frame"] = 0
state["espeed"] = 3


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
    exs = state["exs"]
    eys = state["eys"]
    speeds = state["speeds"]
    for i in range(0, len(exs), 1):
        eys[i] = eys[i] + speeds[i]
        if eys[i] > 400:
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            state["score"] = state["score"] + 1
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
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
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [60, 200, 340, 460, 580]
        state["eys"] = [-48, -160, -280, -400, -520]
        state["speeds"] = [3, 4, 2, 5, 3]
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
    page_id=4077,
    slug="game-17-multi-enemies",
    title="敵を増やしてみよう",
    intro_paragraphs=[
        '前回（記事⑯）で <strong>2D 移動 + 2D 当たり判定</strong>まで揃って、'
        'Part 4 の集大成「2D よけゲーム」が完成しました。'
        'ただ、まだ <strong>敵が 1 体しか出てきません</strong>。'
        '少し物足りないですね。',
        '今回は state 辞書の <code>"ex"</code> / <code>"ey"</code> を'
        '<strong>list（リスト）</strong>に変えて、敵を 3 体に増やします。'
        '同じロジックを 3 回コピペするのではなく、'
        '<code>for i in range(0, 3, 1):</code> という <strong>for ループ</strong>を使ってまとめて処理するのがポイント。'
        '一度この書き方を覚えると、敵を 5 体に増やすときも、各敵の速度を別々にしたいときも、'
        '<strong>list の中身を変えるだけ</strong>で対応できるようになります。',
        'Step 1 で <code>range(0, 3, 1)</code> のハードコード版、'
        'Step 2 で <code>range(0, len(exs), 1)</code> に書き換えてリスト長で自動化、'
        '課題で 5 体や個別落下速度に発展させていきます。',
    ],
    eyecatch_basename="eyecatch_game_17_multi_enemies",
    iframe_xml="game_17_step2_final.xml",
    learn_bullets=[
        '<code>state</code> 辞書の値に <strong>list（リスト）</strong>を入れる方法（'
        '<code>state["exs"] = [100, 320, 540]</code>）',
        'list を <strong>局所変数に取り出して</strong>から扱うパターン（'
        '<code>exs = state["exs"]</code> → 後は <code>exs[i]</code> でアクセス）',
        '<code>for i in range(0, 3, 1):</code> を使って <strong>同じ処理を複数回まとめて行う</strong>方法',
        '<strong><code>len(リスト)</code></strong> でリストの長さを取得して、'
        'range(3) を <code>range(0, len(exs), 1)</code> に置き換える書き換えテクニック',
        '<code>player_hit</code> と <code>enemy_hit</code> の <strong>当たり判定もループ内で</strong>'
        '回すことで、3 体すべてとの衝突を毎フレーム自動で見られるようになる',
        'list を使った設計の<strong>メリット</strong>：'
        '敵の数を増やすときに <code>game_funcs.py</code> の list を 5 要素に変えるだけで、'
        '<code>update_play.py</code> や <code>draw_play.py</code> は触らずに済む（課題 A で体感）',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='今回出てくる「list」「for ループ」「len()」は、'
                'Python プログラミング全般で <strong>最頻出</strong>の道具です。'
                'まず言葉と動きを結びつけてから、ブロックの組み立てに入りましょう。',
    terms_table=[
        ("list（リスト）",
         "複数の値を <strong>順番付き</strong>でまとめて持つ箱。<code>[100, 320, 540]</code> のように <code>[ ]</code> で囲む。"
         "敵の x 座標 3 体分などを 1 つの変数に入れられる",
         "<code>state[\"exs\"] = [100, 320, 540]</code>"),
        ("リスト要素アクセス",
         "list の <strong>i 番目</strong>を取り出したり書き換えたりする操作。"
         "Python では 0 から数える（先頭が <code>[0]</code>）",
         "<code>exs[0]</code>、<code>eys[i] = -48</code>"),
        ("for ループ",
         "「同じ処理を <strong>n 回</strong>繰り返す」ための制御構文。"
         "<code>for i in range(0, 3, 1):</code> は i = 0 → 1 → 2 と動く",
         "<code>for i in range(0, 3, 1):<br>&nbsp;&nbsp;&nbsp;&nbsp;eys[i] = eys[i] + state[\"espeed\"]</code>"),
        ("len()",
         "list の <strong>長さ（要素数）</strong>を返す組み込み関数。"
         "ループ範囲を list の長さに連動させると、<strong>list を増やすだけで自動対応</strong>できる",
         "<code>for i in range(0, len(exs), 1):</code>"),
        ("局所変数化",
         "辞書アクセス <code>state[\"exs\"]</code> を毎回書くと冗長なので、"
         "ループの直前で <code>exs = state[\"exs\"]</code> と <strong>別名を付ける</strong>テクニック。"
         "list は参照型なので <code>exs[i] = -48</code> で元の <code>state[\"exs\"]</code> も書き換わる",
         "<code>exs = state[\"exs\"]<br>eys = state[\"eys\"]</code>"),
    ],
    file_roles_h2="ファイル構成のおさらい（前回まで作った 6 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。'
         '<strong>今回は <code>state["ex"]</code> と <code>state["ey"]</code> を </strong>'
         '<strong><code>state["exs"] = [100, 320, 540]</code> と '
         '<code>state["eys"] = [-48, -200, -400]</code> に書き換える</strong>のが最大の変更点です。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<strong>今回は敵の落下処理・当たり判定処理を <code>for i in range(0, 3, 1):</code> ループの中に入れる</strong>のが核心。'
         'プレイヤー操作（左右上下）とクランプは元のまま外側に置きます。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<strong>敵を描く <code>game_draw_rect</code> をループの中に入れる</strong>だけで OK。'
         'Score / Lives / Speed / Time の HUD はループの<strong>外</strong>のまま。'),
        ("update_over.py",
         '<strong>ゲームオーバー / クリア画面の更新ロジック</strong>。'
         '<strong>今回はリトライ時に <code>state["exs"]</code> と <code>state["eys"]</code> も list で初期化し直す</strong>必要があります。'),
        ("draw_over.py",
         '<strong>ゲーム終了画面の描画</strong>。'
         'GAME CLEAR! / GAME OVER の出し分け + Final Score 表示はそのまま。'
         '<strong>今回は何も変えません</strong>。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
         '<strong>今回もこのファイルを編集しません</strong>。'
         '敵が増えてもループ構造は無傷で済みます。'),
    ],
    steps=[
        Step(
            title="敵を3体に増やそう（list + for ループ）",
            instructions=[
                '前回まで「敵 1 体」だった構成からスタートします。'
                'まず <code>game_funcs.py</code> を開き、'
                '<strong><code>state["ex"]</code> と <code>state["ey"]</code> の代入</strong>を、'
                '<code>state["exs"] = [100, 320, 540]</code> と <code>state["eys"] = [-48, -200, -400]</code> の'
                'list 代入に書き換えます（茶色の辞書代入＋赤色の <code>py_list_literal</code>）',
                '<code>update_play.py</code> を開き、敵の落下処理と当たり判定を'
                '<strong><code>for i in range(0, 3, 1):</code> ブロック</strong>（緑の <code>pico_for_from_to</code>）の'
                '中にまとめて入れます。'
                'ループの直前で <code>exs = state["exs"]</code> / <code>eys = state["eys"]</code> と '
                '<strong>局所変数化</strong>しておくと、ループ内で <code>exs[i]</code> / <code>eys[i]</code> と書けて短くなります',
                'ループ内の処理は次の通り：'
                '<code>eys[i] = eys[i] + state["espeed"]</code>（紫の <code>py_list_set</code>）/'
                '<code>if eys[i] > 400:</code> なら eys[i] = -48 / exs[i] = random / score+=1（紫の <code>pico_if</code> + リスト操作） /'
                '<code>player_hit</code> = (px+12, py+12, 24, 24) / <code>enemy_hit</code> = (exs[i]+12, eys[i]+12, 24, 24) /'
                '<code>colliderect</code> 衝突 → lives-=1 / eys[i]=-48 / exs[i]=random',
                '<code>draw_play.py</code> でも同じパターン：'
                '<code>exs = state["exs"]</code> と <code>eys = state["eys"]</code> で局所変数化してから、'
                '<code>for i in range(0, 3, 1):</code> の中で'
                '<code>game_draw_rect((exs[i], eys[i], 48, 48), "#ff6600")</code> を 1 つだけ置きます',
                '<code>update_over.py</code> のリトライ処理にも、'
                '<code>state["exs"] = [100, 320, 540]</code> と <code>state["eys"] = [-48, -200, -400]</code> の'
                '初期化を 2 行追加（茶色の辞書代入＋赤色の <code>py_list_literal</code>）',
                '▶ 実行して、上から <strong>3 体の敵</strong>が時間差で降ってきて、'
                'プレイヤーは左右上下に動きながら避けられれば成功。'
                '画面端に消えた敵は再び上から random で復活します',
            ],
            figure_basename="game_17_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>'
                                 '<code>state["ex"] = random.randint(0, 576)</code> と <code>state["ey"] = -48</code> を'
                                 '<strong>削除</strong>し、'
                                 '<code>state["exs"] = [100, 320, 540]</code> と <code>state["eys"] = [-48, -200, -400]</code> の'
                                 '<strong>list 代入を 2 行</strong>追加します。'
                                 '初期 y を時間差で並べると、3 体が等間隔で降ってきて見栄えがよいです。',
                'update_play.py': '<strong>変更点：</strong>'
                                  '敵の落下処理と当たり判定を <code>for i in range(0, 3, 1):</code> ループの中にまとめて入れます。'
                                  'ループの直前で <code>exs = state["exs"]</code> / <code>eys = state["eys"]</code> と局所変数化。'
                                  'ループ内の <code>state["ex"]</code> / <code>state["ey"]</code> をすべて <code>exs[i]</code> / <code>eys[i]</code> に書き換えます。',
                'draw_play.py': '<strong>変更点：</strong>'
                                '敵を描く <code>game_draw_rect</code> を <code>for i in range(0, 3, 1):</code> の中に入れます。'
                                'プレイヤー描画と HUD はループの<strong>外</strong>のまま。',
                'update_over.py': '<strong>変更点：</strong>'
                                  'リトライ処理の中に、'
                                  '<code>state["exs"] = [100, 320, 540]</code> と <code>state["eys"] = [-48, -200, -400]</code> の'
                                  '<strong>list 初期化を 2 行</strong>追加します。',
                'draw_over.py': 'GAME CLEAR! / GAME OVER の分岐 + Final Score の表示はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
                          '<strong>このステップでは何も変えません</strong>。',
            },
        ),
        Step(
            title="リストの長さを len() で自動化しよう",
            instructions=[
                '前のステップでは <code>for i in range(0, 3, 1):</code> と「3」をハードコードで書きました。'
                'これだと敵を増やしたいとき、<strong>3 を 5 に書き換える場所がループ 2 か所</strong>になり、'
                '修正漏れの危険があります',
                '<code>update_play.py</code> を開き、'
                '<code>for i in range(0, 3, 1):</code> の <strong>中央の <code>3</code></strong> を、'
                '<strong><code>len(exs)</code></strong>（黄色の <code>py_list_len</code> ブロック）に差し替えます。'
                '<code>exs</code> はループ直前で局所変数化したものを使います',
                '<code>draw_play.py</code> でも同じく、'
                '<code>for i in range(0, 3, 1):</code> の <code>3</code> を <code>len(exs)</code> に差し替えます',
                '<code>game_funcs.py</code> と <code>update_over.py</code> は<strong>触りません</strong>。'
                'ステップ 1 と同じ 3 体構成で OK',
                '▶ 実行して、見た目はステップ 1 と同じ動きになっていれば成功。'
                'ここで <strong>仕組みは変わったのに見た目が同じ</strong>のがプログラミングの味。'
                'この書き換えのおかげで、課題 A で「敵を 5 体に」したいときに'
                '<strong><code>game_funcs.py</code> の list を 5 要素に変えるだけ</strong>で済みます',
            ],
            figure_basename="game_17_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'update_play.py': '<strong>変更点：</strong>'
                                  '敵の落下＋衝突ループの <code>for i in range(0, 3, 1):</code> の <code>3</code> を、'
                                  '<strong><code>len(exs)</code></strong> ブロックに差し替えます。'
                                  '差し替えるのは <strong>1 か所</strong>だけ。',
                'draw_play.py': '<strong>変更点：</strong>'
                                '敵描画ループの <code>for i in range(0, 3, 1):</code> の <code>3</code> を、'
                                '<strong><code>len(exs)</code></strong> ブロックに差し替えます。'
                                '差し替えるのは <strong>1 か所</strong>だけ。',
                'game_funcs.py': 'state 辞書はステップ 1 から変更なし。'
                                 '<strong>このステップでは何も変えません</strong>。',
                'update_over.py': 'リトライ処理もステップ 1 のまま。'
                                  '<strong>このステップでは何も変えません</strong>。',
                'draw_over.py': 'GAME CLEAR! / GAME OVER の分岐 + Final Score の表示はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': 'ゲームループの分岐構造もそのまま。'
                          '<strong>このステップでは何も変えません</strong>。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="4-17-1",
            title="敵を5体に増やそう",
            lead='Step 2 で <code>len(exs)</code> 自動化したご褒美の課題です。'
                 '触るのは <code>game_funcs.py</code> と <code>update_over.py</code> の'
                 '<strong>list を 5 要素に揃える</strong>だけ。'
                 '<code>update_play.py</code> や <code>draw_play.py</code> は <strong>1 つも書き換える必要がありません</strong>。'
                 '<strong>「ループ範囲を len() にしたから対応できた」</strong>という設計の威力を体感する練習です。',
            figure_basename="game_17_a_five_enemies",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>game_funcs.py</code> の <code>state["exs"]</code> を '
                        '<code>[60, 200, 340, 460, 580]</code> に、'
                        '<code>state["eys"]</code> を <code>[-48, -160, -280, -400, -520]</code> に変えます。'
                        'x 座標は画面幅 640 を 5 等分して並べると重ならず見やすい配置に、'
                        'y 座標は時間差で降らせると一気に 5 体が降ってこなくて自然です。'
                        '<code>update_over.py</code> のリトライ処理も同じ 5 要素に揃えます。'
                        '<strong>これだけ</strong>で、ループ範囲は <code>len(exs)</code> なので'
                        '<code>update_play.py</code> や <code>draw_play.py</code> は触らずに 5 体ゲームになります。',
            file_descriptions={
                'game_funcs.py': '<code>state["exs"]</code> を <code>[60, 200, 340, 460, 580]</code> に、'
                                 '<code>state["eys"]</code> を <code>[-48, -160, -280, -400, -520]</code> に書き換えます。'
                                 'list の要素を 3 から 5 に増やすだけ。',
                'update_over.py': 'リトライ処理の <code>state["exs"]</code> と <code>state["eys"]</code> も、'
                                  '<code>game_funcs.py</code> と<strong>同じ 5 要素</strong>の list に揃えます。'
                                  '初期化と同じ値を使うのがコツ。',
                'update_play.py': '<strong>このファイルは触りません</strong>。'
                                  '<code>for i in range(0, len(exs), 1):</code> の <code>len()</code> が '
                                  'list の長さに自動追従するので、5 体でも問題なく動きます。',
                'draw_play.py': '<strong>このファイルも触りません</strong>。'
                                '描画ループも <code>len(exs)</code> なので、5 体すべて自動で描画されます。',
            },
        ),
        Kadai(
            number="4-17-2",
            title="敵ごとに落下速度を変えよう",
            lead='今までは全敵が同じ速度（<code>state["espeed"]</code>）で落ちてきました。'
                 '<strong>各敵に専用の速度</strong>を持たせて、ばらばらに降らせましょう。'
                 'state 辞書に <code>"speeds": [3, 4, 2]</code> を追加し、'
                 '<code>eys[i] += state["espeed"]</code> を <code>eys[i] += speeds[i]</code> に書き換えます。'
                 '<strong>「同じインデックスでアクセスする 2 つ目の list」</strong>のパターンを覚える練習です。',
            figure_basename="game_17_b_speed_list",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>game_funcs.py</code> の state 辞書代入の最後に '
                        '<code>state["speeds"] = [3, 4, 2]</code> を 1 行追加します。'
                        '<code>update_play.py</code> を開き、ループの直前で'
                        '<code>speeds = state["speeds"]</code> と局所変数化（exs / eys と並べて 3 行に）。'
                        'ループ内の <code>eys[i] = eys[i] + state["espeed"]</code> を、'
                        '<code>eys[i] = eys[i] + speeds[i]</code>（紫の <code>py_list_get</code> ブロック）に書き換えます。'
                        '<code>update_over.py</code> のリトライ処理にも <code>state["speeds"] = [3, 4, 2]</code> を追加。'
                        '実行すると、3 体がそれぞれ違う速度（中・速・遅）で降ってきて、'
                        'よけのリズムが格段に難しくなります。',
            file_descriptions={
                'game_funcs.py': 'state 辞書代入の末尾に <code>state["speeds"] = [3, 4, 2]</code> を 1 行追加します。'
                                 '長さは <code>exs</code> / <code>eys</code> と同じ 3 にすること。',
                'update_play.py': 'ループ直前で <code>speeds = state["speeds"]</code> と局所変数化。'
                                  'ループ内の <code>eys[i] = eys[i] + state["espeed"]</code> を、'
                                  '<code>eys[i] = eys[i] + speeds[i]</code> に差し替えます。',
                'update_over.py': 'リトライ処理に <code>state["speeds"] = [3, 4, 2]</code> を追加します。'
                                  'これを忘れるとリトライ後に speeds が残ったままで思ったとおりに動かないので注意。',
                'draw_play.py': '<strong>このファイルは触りません</strong>。'
                                '描画ロジックは速度に関係しないので、変更不要です。',
            },
        ),
        Kadai(
            number="4-17-3",
            title="5体・個別速度のフル装備版",
            lead='課題 A（5 体）と課題 B（個別速度）を <strong>合体</strong>させた最終形。'
                 '触るのは <code>game_funcs.py</code> と <code>update_over.py</code> だけ。'
                 '<code>update_play.py</code> と <code>draw_play.py</code> は <strong>課題 B のまま</strong>で動きます。'
                 '<strong>「list の中身を変えるだけで難易度を調整できる」</strong>という設計のメリットを最大限に活かす練習です。',
            figure_basename="game_17_c_mixed_speeds",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='課題 B の状態から、<code>game_funcs.py</code> の <code>exs</code> / <code>eys</code> / <code>speeds</code> を '
                        '<strong>すべて 5 要素</strong>に揃えます。'
                        '例えば <code>exs = [60, 200, 340, 460, 580]</code> / <code>eys = [-48, -160, -280, -400, -520]</code> / '
                        '<code>speeds = [3, 4, 2, 5, 3]</code>。'
                        '<code>update_over.py</code> のリトライ処理も同じ 5 要素に揃えます。'
                        '速度の組み合わせを <code>[2, 3, 4, 5, 6]</code> のように極端に変えてみたり、'
                        '<code>[1, 1, 8, 1, 1]</code> のように 1 体だけ高速にしてみると、'
                        '<strong>同じコードで全く違うゲームバランス</strong>になることが体感できます。',
            file_descriptions={
                'game_funcs.py': '<code>exs</code> / <code>eys</code> / <code>speeds</code> をすべて<strong>同じ長さ 5</strong>の list に揃えます。'
                                 'インデックス i の同じ位置同士で対応するので、長さが揃っていないと <code>IndexError</code> が出ます。',
                'update_over.py': 'リトライ処理の <code>exs</code> / <code>eys</code> / <code>speeds</code> も <code>game_funcs.py</code> と<strong>同じ 5 要素</strong>に揃えます。',
                'update_play.py': '<strong>このファイルは触りません</strong>。'
                                  '課題 B で <code>speeds[i]</code> 化済み + <code>len(exs)</code> ループなので、'
                                  '5 体・個別速度の構成にそのまま対応します。',
                'draw_play.py': '<strong>このファイルも触りません</strong>。'
                                '描画も <code>len(exs)</code> ループのままで 5 体描けます。',
            },
        ),
    ],
    summary_bullets=[
        '<code>state</code> 辞書の値に <strong>list</strong> を入れることで、'
        '同じ役割の値（敵の x 座標 N 体分など）を <strong>1 つの変数</strong>でまとめて持てる',
        '<strong><code>for i in range(0, N, 1):</code></strong> ループを使うことで、'
        'コピペ N 回分の処理を <strong>1 つのブロック</strong>でまとめて書ける',
        '<code>range(0, len(exs), 1)</code> のように <strong>list の長さでループ範囲を決める</strong>と、'
        'list を増やすだけで自動対応できる<strong>「弾力のある」</strong>コードになる（課題 A で実感）',
        'list を <strong>局所変数に取り出す</strong>パターン（<code>exs = state["exs"]</code>）で、'
        'ループ内のコードがすっきり読みやすくなる',
        '<strong>「同じインデックスで複数の list を参照する」</strong>パターン（<code>exs[i]</code> + <code>speeds[i]</code>）は、'
        'シューティング（弾と敵）・パーティクル（粒子の位置と速度）・タイルマップ（座標と種類）など、'
        'これから学ぶジャンルすべての基本になる',
        'list と for ループは Python プログラミングの<strong>最頻出セット</strong>。'
        'ゲーム以外の場面（データ処理・グラフ描画・機械学習）でも同じ書き方を使うので、'
        'ここでしっかり身につけておくと <strong>Part 5 以降のジャンル分岐が一気に楽</strong>になる',
    ],
    next_article_id=4078,
    next_article_title='【Pygameでゲーム⑱】◯◯◯',
    cache_buster="20260509k",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑰】敵を増やしてみよう")
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
