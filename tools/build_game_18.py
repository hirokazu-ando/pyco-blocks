#!/usr/bin/env python3
"""WP 記事 5000 (Pygame⑲ 弾を撃ってみよう = single bullet → list bullets) の本文を組み立てて反映する。

Part 5「シューティング系」の入口。記事⑰で完成した list+for ループの 2D よけゲームに、
プレイヤーから上向きに発射する「弾」を追加する。

Step 1 で state["bx"] / state["by"] による単発弾（同時に 1 発しか撃てない）、
Step 2 で state["bxs"] / state["bys"] による list 化（連射可能）に書き換え、
課題で弾色変更（A）／弾速変更（B）／クールダウン（C）に発展。
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
    "eyecatch_game-5-19_shoot-bullets.png"
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

# Step 1 — 単発弾。state["bx"], state["by"] に弾の座標を 1 組だけ持つ。
# K_SPACE で by==-1 のとき発射、by != -1 で y を 8 ずつ進める。画面外で by=-1 に戻す。
CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Shooter")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [100, 320, 540]
state["eys"] = [-48, -200, -400]
state["bx"] = 0
state["by"] = -1
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
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        if state["by"] == -1:
            state["bx"] = state["px"] + 20
            state["by"] = state["py"]
    if state["by"] != -1:
        state["by"] = state["by"] - 8
        if state["by"] < -8:
            state["by"] = -1
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
    if state["by"] != -1:
        pygame.draw.rect(screen, "#ffeb3b", (state["bx"], state["by"], 8, 16))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [100, 320, 540]
        state["eys"] = [-48, -200, -400]
        state["bx"] = 0
        state["by"] = -1
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

# Step 2 — リスト弾。state["bxs"], state["bys"] に発射した弾の座標を append し、
# for j in range(0, len(bxs), 1) で全弾の y を 8 ずつ進める。連射可能になる。
CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Shooter")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [100, 320, 540]
state["eys"] = [-48, -200, -400]
state["bxs"] = []
state["bys"] = []
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
    bxs = state["bxs"]
    bys = state["bys"]
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        bxs.append(state["px"] + 20)
        bys.append(state["py"])
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 8
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
    bxs = state["bxs"]
    bys = state["bys"]
    for j in range(0, len(bxs), 1):
        pygame.draw.rect(screen, "#ffeb3b", (bxs[j], bys[j], 8, 16))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [100, 320, 540]
        state["eys"] = [-48, -200, -400]
        state["bxs"] = []
        state["bys"] = []
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

# 課題A 5-19-1 — 弾の色を黄→ピンク (#ffeb3b → #ff66cc)。
# 触るのは draw_play.py の弾描画 1 行だけ。
CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Shooter")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [100, 320, 540]
state["eys"] = [-48, -200, -400]
state["bxs"] = []
state["bys"] = []
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
    bxs = state["bxs"]
    bys = state["bys"]
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        bxs.append(state["px"] + 20)
        bys.append(state["py"])
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 8
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
    bxs = state["bxs"]
    bys = state["bys"]
    for j in range(0, len(bxs), 1):
        pygame.draw.rect(screen, "#ff66cc", (bxs[j], bys[j], 8, 16))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [100, 320, 540]
        state["eys"] = [-48, -200, -400]
        state["bxs"] = []
        state["bys"] = []
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

# 課題B 5-19-2 — 弾速 8 → 12 へ加速。
# 触るのは update_play.py の bys[j] = bys[j] - 8 の数値だけ（1 か所）。
CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Shooter")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [100, 320, 540]
state["eys"] = [-48, -200, -400]
state["bxs"] = []
state["bys"] = []
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
    bxs = state["bxs"]
    bys = state["bys"]
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        bxs.append(state["px"] + 20)
        bys.append(state["py"])
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 12
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
    bxs = state["bxs"]
    bys = state["bys"]
    for j in range(0, len(bxs), 1):
        pygame.draw.rect(screen, "#ffeb3b", (bxs[j], bys[j], 8, 16))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [100, 320, 540]
        state["eys"] = [-48, -200, -400]
        state["bxs"] = []
        state["bys"] = []
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

# 課題C 5-19-3 — クールダウン。state["cooldown"] を毎フレーム 1 減らし、
# K_SPACE が押されてもcooldown==0 のときだけ発射 + cooldown=6 にリセット。
# 連射が制限され、1/10 秒に 1 発のリズムになる。
CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Shooter")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = [100, 320, 540]
state["eys"] = [-48, -200, -400]
state["bxs"] = []
state["bys"] = []
state["cooldown"] = 0
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
    bxs = state["bxs"]
    bys = state["bys"]
    state["cooldown"] = state["cooldown"] - 1
    if state["cooldown"] == 0:
        if pygame.key.get_pressed()[pygame.K_SPACE]:
            bxs.append(state["px"] + 20)
            bys.append(state["py"])
            state["cooldown"] = 6
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 8
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
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Speed: " + str(state["espeed"]), True, "#aaaaaa"), (10, 50))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Time: " + str(30 - state["frame"] // 60), True, "#ffffff"), (200, 50))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
    bxs = state["bxs"]
    bys = state["bys"]
    for j in range(0, len(bxs), 1):
        pygame.draw.rect(screen, "#ffeb3b", (bxs[j], bys[j], 8, 16))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["exs"] = [100, 320, 540]
        state["eys"] = [-48, -200, -400]
        state["bxs"] = []
        state["bys"] = []
        state["cooldown"] = 0
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
    page_id=5000,
    slug="game-19-shoot-bullets",
    title="弾を撃ってみよう",
    intro_paragraphs=[
        'ここから Part 5「シューティング系」に入ります。'
        'Part 4 で完成した「2D よけゲーム」（プレイヤーが上下左右に動いて 3 体の敵を避ける）に、'
        '<strong>K_SPACE で上向きに弾を撃つ</strong>機能を足していきましょう。',
        'Step 1 では <code>state["bx"]</code> / <code>state["by"]</code> の'
        '<strong>2 つの数値変数</strong>で「弾は同時に 1 発だけ」というシンプルな設計から始めます。'
        '<code>state["by"] == -1</code> のときだけ発射できる、というルールで「弾が画面上にあるか」を表現するのがコツです。',
        'Step 2 では同じ仕組みを <code>state["bxs"]</code> / <code>state["bys"]</code> の'
        '<strong>list（リスト）</strong>に書き換えて、'
        '<code>append()</code> で弾を増やし <code>for j in range(0, len(bxs), 1):</code> で全弾を一度に進めます。'
        '記事⑰で身につけた「list + for ループ」のパターンが、'
        '<strong>シューティングの弾管理にそのまま使える</strong>ことを体感する回です。',
        '課題では弾色変更（A）、弾速アップ（B）、連射クールダウン（C）と発展させ、'
        '次の記事⑳「敵に弾を当てよう」へつなげます。',
    ],
    eyecatch_basename="eyecatch_game_19_shoot_bullets",
    iframe_xml="game_18_step2_final.xml",
    learn_bullets=[
        '<strong>2 つの数値変数</strong>（<code>state["bx"]</code>, <code>state["by"]</code>）で'
        '「同時に 1 発だけ撃てる弾」をシンプルに実装する方法',
        '<code>by == -1</code> という<strong>センチネル値</strong>で'
        '「弾が画面上にあるかないか」を表現するパターン',
        'プレイヤーから真上に弾を発射する仕組み（'
        '<code>bx = px + 20</code>, <code>by = py</code> で発射地点を決める）',
        'list（<code>bxs</code>, <code>bys</code>）と <code>append()</code> を使って'
        '<strong>同時に何発でも撃てる</strong>連射式に書き換える方法',
        '<code>for j in range(0, len(bxs), 1):</code> で'
        '全ての弾の <code>bys[j]</code> を毎フレーム 8 ずつ減らして上方向に進める書き方',
        'スプライトの色／速度／クールダウンといった<strong>パラメータをデータで切り替える</strong>'
        '考え方（記事⑰の list 化と同じ「数値を 1 か所変えるだけで挙動を変える」設計）',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='シューティングで弾を扱うときの言葉と、それぞれを state 辞書のどのキーで表すかを整理します。'
                'プレイヤー位置・敵リストの感覚を「弾」にも適用するイメージで読んでください。',
    terms_table=[
        ("弾（bullet）",
         "プレイヤーから発射される飛び道具。1 発ずつ位置（x, y）を持ち、毎フレーム y を減らして上に進む",
         '<code>state["bx"]</code>, <code>state["by"]</code> /'
         ' <code>state["bxs"]</code>, <code>state["bys"]</code>'),
        ("センチネル値",
         "「特別な意味を持つ値」のこと。Step 1 では <code>by == -1</code> を「弾は今、画面上にない」を表す目印に使う",
         '<code>if state["by"] == -1: 発射</code>'),
        ("append（リスト末尾追加）",
         "list の末尾に新しい要素を 1 つ追加する操作。<code>K_SPACE</code> が押された瞬間にだけ呼ぶ",
         '<code>bxs.append(state["px"] + 20)</code>'),
        ("連射（オートファイア）",
         "K_SPACE を押している間、毎フレーム弾を発射し続ける挙動。"
         "list 化したのでappend が積み重なるだけで自然に連射になる",
         '<code>if K_SPACE: bxs.append(...)</code>'),
        ("クールダウン",
         "「次の発射までに必ず待つフレーム数」を持たせて連射を制限する仕組み。"
         "<code>state[\"cooldown\"]</code> を毎フレーム 1 減らし、0 のときだけ発射 + 6 にリセット",
         '<code>if state["cooldown"] == 0:</code>'),
    ],
    file_roles_h2="ファイル構成のおさらい（前回まで作った 6 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。'
         '<strong>今回は state 辞書に弾用のキー</strong>'
         '（Step 1: <code>state["bx"] = 0</code>, <code>state["by"] = -1</code> /'
         ' Step 2: <code>state["bxs"] = []</code>, <code>state["bys"] = []</code>）'
         '<strong>を 2 行追加します</strong>。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<strong>K_SPACE が押されたときの発射処理と、毎フレームの弾移動処理を追加します</strong>。'
         'プレイヤー操作・敵ループは前回までのまま外側に置き、弾処理を独立した塊として書き足すのがポイント。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<strong>弾を黄色（<code>#ffeb3b</code>）の小さな縦長の長方形で描画する 1〜2 行を追加します</strong>。'
         'Step 1 では <code>if state["by"] != -1:</code> の条件付きで 1 発、'
         'Step 2 では <code>for j in range(...):</code> で全弾を描画。'),
        ("update_over.py",
         '<strong>ゲームオーバー / クリア画面の更新ロジック</strong>。'
         '<strong>リトライ時に弾の状態もリセット</strong>します。'
         'Step 1: <code>state["bx"] = 0</code>, <code>state["by"] = -1</code> /'
         ' Step 2: <code>state["bxs"] = []</code>, <code>state["bys"] = []</code> を追加。'),
        ("draw_over.py",
         '<strong>ゲーム終了画面の描画</strong>。'
         'GAME CLEAR! / GAME OVER の出し分け + Final Score 表示はそのまま。'
         '<strong>今回は何も変えません</strong>。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
         '<strong>今回もこのファイルを編集しません</strong>。'
         '弾が増えてもループ構造は無傷で済みます。'),
    ],
    steps=[
        Step(
            title="単発の弾を撃てるようにしよう（state[\"bx\"] / state[\"by\"]）",
            instructions=[
                '<code>game_funcs.py</code> を開き、state 辞書代入のあとに'
                '<code>state["bx"] = 0</code>、<code>state["by"] = -1</code> の 2 行を追加します。'
                '<code>by = -1</code> は「今は弾がいない」というセンチネル値を表します',
                '<code>update_play.py</code> を開き、プレイヤー移動とクランプの後（敵ループの前）に'
                '<strong>弾の発射処理</strong>を書きます。'
                '<code>if pygame.key.get_pressed()[pygame.K_SPACE]:</code>（紫の <code>pico_if</code> + 紫の <code>game_key_pressed</code>）の中に、'
                '<code>if state["by"] == -1:</code> をネストし、'
                '<code>state["bx"] = state["px"] + 20</code> と <code>state["by"] = state["py"]</code> を書きます。'
                '「弾が画面にいない時だけ発射する」ロジックです',
                '同じ <code>update_play.py</code> に <strong>弾の移動処理</strong>を続けて書きます。'
                '<code>if state["by"] != -1:</code>（「弾が画面にいるとき」）の中で、'
                '<code>state["by"] = state["by"] - 8</code> で y を 8 ずつ減らし、'
                '<code>if state["by"] &lt; -8: state["by"] = -1</code> で画面外に出たらセンチネル値に戻します',
                '<code>draw_play.py</code> を開き、敵描画ループのあとに'
                '<code>if state["by"] != -1:</code> の中で'
                '<code>pygame.draw.rect(screen, "#ffeb3b", (state["bx"], state["by"], 8, 16))</code> '
                '（緑の <code>game_draw_rect</code>）を 1 つ書きます。'
                '黄色の細長い長方形が弾になります',
                '<code>update_over.py</code> のリトライ処理にも'
                '<code>state["bx"] = 0</code>, <code>state["by"] = -1</code> の 2 行を追加して、'
                'Enter キー押下時に弾も初期状態に戻すようにします',
                '▶ 実行して、<strong>K_SPACE で 1 発ずつ弾が撃てる</strong>こと、'
                '弾が画面上にいる間は 2 発目が出ないこと、'
                '弾が上端に消えると次の弾が撃てるようになることを確認しましょう',
            ],
            figure_basename="game_18_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>'
                                 'state 辞書代入のあとに <code>state["bx"] = 0</code>, <code>state["by"] = -1</code> の'
                                 '<strong>2 行を追加</strong>します。'
                                 '<code>by = -1</code> は「弾は今、画面上にいない」というセンチネル値で、'
                                 '<code>update_play</code> 側でこの値を見て発射可否を判定します。',
                'update_play.py': '<strong>変更点：</strong>'
                                  'プレイヤー操作の直後（敵ループの前）に弾の発射処理と移動処理を追加します。'
                                  '<code>if K_SPACE:</code> の中に <code>if state["by"] == -1:</code> をネストして'
                                  '<code>bx = px + 20</code>, <code>by = py</code> を書くのが発射。'
                                  'その後 <code>if state["by"] != -1:</code> で <code>by</code> を 8 ずつ減らし、'
                                  '画面外に出たら <code>by = -1</code> に戻します。',
                'draw_play.py': '<strong>変更点：</strong>'
                                '敵描画ループのあとに <code>if state["by"] != -1:</code> の条件付きで'
                                '<code>pygame.draw.rect</code> を 1 つ追加するだけ。'
                                '弾は 8x16 の縦長長方形で <code>#ffeb3b</code>（黄色）にしておくと'
                                'プレイヤー（水色）と敵（オレンジ）と区別しやすいです。',
                'update_over.py': '<strong>変更点：</strong>'
                                  'Enter キー押下時のリセット処理に <code>state["bx"] = 0</code>, '
                                  '<code>state["by"] = -1</code> の 2 行を追加します。'
                                  'これを忘れるとリトライ後に弾が変な位置に残ったり発射できなくなったりします。',
                'draw_over.py': 'GAME CLEAR! / GAME OVER の分岐 + Final Score の表示はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': '<code>from … import …</code> と <code>if state["mode"] == "play":</code> の分岐だけのループ。'
                          '<strong>このステップでは何も変えません</strong>。',
            },
        ),
        Step(
            title="弾を list 化して連射できるようにしよう",
            instructions=[
                '前のステップでは「弾は同時に 1 発まで」でしたが、'
                'シューティングらしく <strong>連射できる</strong>ようにします。'
                'やることは記事⑰で敵を 3 体に増やしたときと同じ <strong>「数値 → list 化」</strong>のパターンです',
                '<code>game_funcs.py</code> を開き、'
                '<code>state["bx"] = 0</code>, <code>state["by"] = -1</code> の 2 行を、'
                '<strong><code>state["bxs"] = []</code>, <code>state["bys"] = []</code></strong>'
                '（赤色の <code>py_list_empty</code> ブロック）の <strong>2 行に書き換え</strong>ます。'
                '空の list で初期化しておきます',
                '<code>update_play.py</code> の弾処理を全部書き直します。'
                'まずループの直前で <code>bxs = state["bxs"]</code> / <code>bys = state["bys"]</code> と<strong>局所変数化</strong>。'
                '<code>if K_SPACE:</code> の中で <code>bxs.append(state["px"] + 20)</code> と '
                '<code>bys.append(state["py"])</code>（紫の <code>py_list_append</code> ブロック）を呼びます。'
                'これで K_SPACE が押されている間は毎フレーム弾が追加されます',
                '弾の移動も <strong>for ループ</strong>で全弾まとめて処理します。'
                '<code>for j in range(0, len(bxs), 1):</code>（緑の <code>pico_for_from_to</code>）の中で'
                '<code>bys[j] = bys[j] - 8</code>（紫の <code>py_list_set</code> + <code>py_list_get</code>）を書きます。'
                '画面外チェック（<code>by &lt; -8</code> の処理）はこのステップでは省略して OK です',
                '<code>draw_play.py</code> も同じパターン：'
                '<code>bxs = state["bxs"]</code> / <code>bys = state["bys"]</code> で局所変数化してから、'
                '<code>for j in range(0, len(bxs), 1):</code> の中で'
                '<code>pygame.draw.rect(screen, "#ffeb3b", (bxs[j], bys[j], 8, 16))</code> を 1 つ書きます',
                '<code>update_over.py</code> のリトライ処理も list 初期化に書き換え：'
                '<code>state["bxs"] = []</code>, <code>state["bys"] = []</code> の 2 行に',
                '▶ 実行して、<strong>K_SPACE を押しっぱなしで連射</strong>できることを確認しましょう。'
                '画面上に何発でも弾を出せて、それぞれ独立に上に進んでいくのが見えれば成功です',
            ],
            figure_basename="game_18_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>'
                                 '<code>state["bx"] = 0</code>, <code>state["by"] = -1</code> の 2 行を、'
                                 '<code>state["bxs"] = []</code>, <code>state["bys"] = []</code> の'
                                 '<strong>list 初期化</strong>に書き換えます（赤色の <code>py_list_empty</code> ブロック）。',
                'update_play.py': '<strong>変更点：</strong>'
                                  '弾処理を局所変数化 + append + for ループに書き換えます。'
                                  '<code>bxs = state["bxs"]</code> / <code>bys = state["bys"]</code> でローカルに取り出してから、'
                                  '<code>if K_SPACE:</code> の中で <code>bxs.append(...)</code> と <code>bys.append(...)</code>。'
                                  '<code>for j in range(0, len(bxs), 1):</code> の中で <code>bys[j] = bys[j] - 8</code> を呼びます。',
                'draw_play.py': '<strong>変更点：</strong>'
                                '弾描画を局所変数化 + for ループに書き換えます。'
                                '<code>bxs</code> / <code>bys</code> を取り出してから、'
                                '<code>for j in range(0, len(bxs), 1):</code> の中で'
                                '<code>pygame.draw.rect(screen, "#ffeb3b", (bxs[j], bys[j], 8, 16))</code> を呼びます。',
                'update_over.py': '<strong>変更点：</strong>'
                                  'リトライ処理の <code>state["bx"]</code> / <code>state["by"]</code> 初期化を、'
                                  '<code>state["bxs"] = []</code> / <code>state["bys"] = []</code> の 2 行に書き換えます。',
                'draw_over.py': 'GAME CLEAR! / GAME OVER の分岐 + Final Score の表示はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': 'ゲームループの分岐構造もそのまま。'
                          '<strong>このステップでは何も変えません</strong>。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="5-19-1",
            title="弾の色を変えよう（黄→ピンク）",
            lead='Step 2 で連射できるようになりました。'
                 '弾の見た目も自分好みにカスタマイズしてみましょう。'
                 '<strong>触るのは <code>draw_play.py</code> の弾描画 1 行だけ</strong>です。'
                 '描画ロジックを変えても発射ロジック（<code>update_play.py</code>）には何も影響しないことを体感する練習です。',
            figure_basename="game_18_a_pink_bullets",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>draw_play.py</code> の <code>pygame.draw.rect(screen, "#ffeb3b", ...)</code> の'
                        '<strong>カラーコード <code>"#ffeb3b"</code></strong>（黄色）を、'
                        '<strong><code>"#ff66cc"</code></strong>（ピンク）に変えるだけ。'
                        'これで弾色が変わります。'
                        '別の色にしたいときは <code>"#00ff00"</code>（黄緑）や <code>"#ff0000"</code>（赤）など、'
                        'カラーコードを変えるだけで自由に変更できます。',
            file_descriptions={
                'draw_play.py': '弾描画 <code>pygame.draw.rect</code> の色引数 <code>"#ffeb3b"</code> を、'
                                '<code>"#ff66cc"</code> に書き換えます。'
                                '変更箇所は <strong>1 か所だけ</strong>。',
                'game_funcs.py': '<strong>このファイルは触りません</strong>。'
                                 '色は描画時に決まるので、データ初期化には影響しません。',
                'update_play.py': '<strong>このファイルは触りません</strong>。'
                                  'ロジック（発射・移動）は色とは独立。',
                'update_over.py': '<strong>このファイルは触りません</strong>。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
        Kadai(
            number="5-19-2",
            title="弾速をアップしよう（8 → 12）",
            lead='連射の見た目をもう少し激しくしましょう。'
                 '<strong>弾の進む速度を 8 → 12</strong> に変えます。'
                 '<strong>触るのは <code>update_play.py</code> の <code>bys[j] = bys[j] - 8</code> の数値 1 か所だけ</strong>。'
                 '「動きの速度はロジック側のパラメータで決まる」という分担関係を確認する練習です。',
            figure_basename="game_18_b_fast_bullets",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>update_play.py</code> の弾移動ループの中の'
                        '<code>bys[j] = bys[j] - 8</code> を、'
                        '<code>bys[j] = bys[j] - 12</code> に変えるだけ。'
                        '弾の進む速度が 1.5 倍になり、敵に届くまでの時間が短くなります。'
                        '逆に <code>4</code> にすればゆっくり弾、<code>20</code> にすれば高速弾と、'
                        '数値 1 つで弾の性能を自由に調整できることがわかります。',
            file_descriptions={
                'update_play.py': '弾移動ループ内の <code>bys[j] = bys[j] - 8</code> の'
                                  '<strong>数値 8 を 12</strong> に書き換えます。変更箇所は <strong>1 か所だけ</strong>。',
                'game_funcs.py': '<strong>このファイルは触りません</strong>。'
                                 '初期データには弾速は含まれていません（移動ロジック側で決めている）。',
                'draw_play.py': '<strong>このファイルは触りません</strong>。'
                                '描画は弾の位置だけを使うので、速度には影響されません。',
                'update_over.py': '<strong>このファイルは触りません</strong>。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
        Kadai(
            number="5-19-3",
            title="連射クールダウンを追加しよう",
            lead='Step 2 のままだと K_SPACE を押しっぱなしで毎フレーム弾が出るので、'
                 '画面が黄色だらけになります。'
                 '<strong>「次の弾までに 6 フレーム待つ」</strong>クールダウンを追加して、'
                 '少し制限のある連射に変えましょう。'
                 '<code>game_funcs.py</code> に <code>state["cooldown"] = 0</code> を 1 行追加し、'
                 '<code>update_play.py</code> の発射処理を <strong>2 重 if</strong> に書き換えます。',
            figure_basename="game_18_c_cooldown",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='<code>game_funcs.py</code> の state 初期化に'
                        '<code>state["cooldown"] = 0</code> を 1 行追加します。'
                        '<code>update_play.py</code> では弾の発射処理を：'
                        '<br>① <code>state["cooldown"] = state["cooldown"] - 1</code>（毎フレーム 1 減らす）'
                        '<br>② <code>if state["cooldown"] == 0:</code> の中に'
                        '<code>if K_SPACE:</code> をネスト（cooldown が 0 のときだけ発射可能）'
                        '<br>③ 発射時に <code>bxs.append(...)</code>, <code>bys.append(...)</code> に加えて'
                        '<code>state["cooldown"] = 6</code> も実行（6 フレーム間は撃てなくする）'
                        '<br>に書き換えます。'
                        '<code>update_over.py</code> のリトライ処理にも'
                        '<code>state["cooldown"] = 0</code> を追加すれば完成。'
                        '実行すると K_SPACE を押しっぱなしでも 1/10 秒に 1 発のリズムで撃てるようになります。',
            file_descriptions={
                'game_funcs.py': 'state 初期化に <code>state["cooldown"] = 0</code> を 1 行追加します。',
                'update_play.py': '発射処理を 2 重 if に書き換えます。'
                                  '<code>state["cooldown"] = state["cooldown"] - 1</code>（毎フレーム）→'
                                  '<code>if state["cooldown"] == 0:</code> →'
                                  '<code>if K_SPACE:</code> →'
                                  '<code>bxs.append(...)</code> + <code>bys.append(...)</code> + '
                                  '<code>state["cooldown"] = 6</code> の流れで書きます。',
                'update_over.py': 'リトライ処理に <code>state["cooldown"] = 0</code> を追加します。'
                                  'これを忘れるとリトライ直後に cooldown が変な値で残って弾が出ない、ということが起きます。',
                'draw_play.py': '<strong>このファイルは触りません</strong>。'
                                '描画は弾の位置だけを参照するので、cooldown は関係ありません。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
    ],
    summary_bullets=[
        '<strong>センチネル値（<code>by == -1</code>）</strong>を使うと、'
        '「弾が画面上にあるかないか」を 1 つの数値で表現できる。'
        'シンプルな実装の入り口として有効',
        '弾を list 化（<code>state["bxs"]</code>, <code>state["bys"]</code>）して'
        '<strong><code>append()</code></strong> で末尾追加すれば、'
        'list の長さが「画面上の弾の数」になり、自然に連射できるようになる',
        '<strong><code>for j in range(0, len(bxs), 1):</code></strong> で'
        '全弾の位置を毎フレーム一度に更新できる。記事⑰の敵 3 体ループと完全に同じパターン',
        '描画と更新が独立していると、<strong>色だけ変えたい</strong>（課題 A）/'
        '<strong>速度だけ変えたい</strong>（課題 B）<strong>のときに触る場所が一目でわかる</strong>。'
        '5 ファイル分割の効能をシューティングでも実感できた回',
        'クールダウンは <strong>「カウンタを毎フレーム 1 減らし、0 のときだけ何かする」</strong>パターン。'
        'シューティング以外でもアイテム再出現・敵の弾発射・無敵時間などに広く使える',
        '次の記事⑳では、ここで作った弾を <strong>敵に当てて消す</strong>当たり判定（'
        '<code>player_hit</code> と <code>enemy_hit</code> の <code>colliderect</code>）を追加します。'
        '撃つ → 当てる → スコアに変えるシューティングの基本サイクルが完成します',
    ],
    next_article_id=5002,
    next_article_title='【Pygameでゲーム⑳】◯◯◯',
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
                  title="【Pygameでゲーム⑲】弾を撃ってみよう")
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
