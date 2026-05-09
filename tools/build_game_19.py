#!/usr/bin/env python3
"""WP 記事 5002 (Pygame⑳ 敵に弾を当てよう) の本文を組み立てて反映する。

新⑲ の課題19-3（連射クールダウン）まで完了した状態をベースにする。
state には <code>cooldown</code> キーがあり、update_play.py の発射処理は
<code>if cooldown &lt;= 0: if K_SPACE: append + cooldown = 6</code> の二重 if 構造で書かれている。

Step 1 で「弾 j × 敵 i」のネスト for ループ + colliderect で命中時に
敵をリスポーン + 弾を画面外に飛ばす（消す）処理を実装。
Step 2 で「敵が画面外に逃れた報酬 +1」を削除し、命中時 +10 のスコア体系に切り替える。
課題で撃破点 50（A）／逃したペナルティ -1（B）／貫通弾（C）に発展。
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
    "eyecatch_game-5-20_shoot-hit.png"
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

# Step 1 — 弾と敵の衝突判定。命中時に敵リスポーン + 弾を画面外（-100）に飛ばす。
# スコア体系は新⑲のまま（敵が下に逃れたら +1）。
# ベースは新⑲の課題19-3 完了状態（cooldown 込み）。
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
    if state["cooldown"] <= 0:
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
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(enemy_hit):
                eys[i] = -48
                exs[i] = random.randint(0, 576)
                bys[j] = -100


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

# Step 2 — 撃破スコア +10 / 「敵が画面外に逃れた報酬 +1」を 0 に。cooldown 込み。
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
    if state["cooldown"] <= 0:
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
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(enemy_hit):
                eys[i] = -48
                exs[i] = random.randint(0, 576)
                state["score"] = state["score"] + 10
                bys[j] = -100


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

# 課題A 5-20-1 — 撃破スコアを 10 → 50 に上げる。update_play.py の 1 数値だけ。
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
    if state["cooldown"] <= 0:
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
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(enemy_hit):
                eys[i] = -48
                exs[i] = random.randint(0, 576)
                state["score"] = state["score"] + 50
                bys[j] = -100


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

# 課題B 5-20-2 — 敵を逃したらペナルティ -1（撃破 +10 はそのまま）。
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
    if state["cooldown"] <= 0:
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
            state["score"] = state["score"] + -1
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(enemy_hit):
                eys[i] = -48
                exs[i] = random.randint(0, 576)
                state["score"] = state["score"] + 10
                bys[j] = -100


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

# 課題C 5-20-3 — 貫通弾。命中しても弾を消さない（bys[j] = -100 を削除）。
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
    if state["cooldown"] <= 0:
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
        player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        enemy_hit = pygame.Rect(exs[i] + 12, eys[i] + 12, 24, 24)
        if player_hit.colliderect(enemy_hit):
            state["lives"] = state["lives"] - 1
            eys[i] = -48
            exs[i] = random.randint(0, 576)
            if state["lives"] <= 0:
                state["mode"] = "over"
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(enemy_hit):
                eys[i] = -48
                exs[i] = random.randint(0, 576)
                state["score"] = state["score"] + 10


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
    page_id=5002,
    slug="game-20-shoot-hit",
    title="敵に弾を当てよう",
    intro_paragraphs=[
        '前回（記事⑲）では、プレイヤーから上向きに弾を撃てるようになり、'
        '課題19-3 では <strong>連射クールダウン</strong>（押しっぱなしでも 6 フレームに 1 発のリズムになる仕組み）も入れました。'
        'この記事はその「クールダウン込みの連射シューティング」を <strong>そのまま起点</strong> にします。'
        '今のままでは撃った弾は敵を <strong>すり抜けて</strong> いくだけで、敵を倒すことはできません。'
        'この記事では、撃った弾と敵の <strong>当たり判定</strong> を入れて、'
        '<strong>「撃つ → 当てる → 敵が消える」</strong> というシューティングの基本サイクルを完成させます。',
        'Step 1 では、'
        '<code>for j in range(0, len(bxs), 1):</code> の <strong>弾ループ</strong>を、'
        '敵 <code>i</code> ループの <strong>内側</strong> にもう 1 つネストして、'
        '<strong>「敵 i × 弾 j」のすべての組み合わせ</strong> で <code>colliderect</code> を呼びます。'
        '命中したら敵を画面上端に戻し（リスポーン）、弾を画面外（<code>bys[j] = -100</code>）に飛ばして消す、というシンプルな処理から始めます。',
        'Step 2 では、敵を <strong>下に逃したら +1 点</strong> という旧仕様（記事⑰〜⑲）を撤廃し、'
        '<strong>命中時に +10 点</strong> という「撃破こそ得点になる」体系に切り替えます。'
        'これでようやく、シューティングらしい <strong>能動的な得点</strong> が成立します。',
        '課題では、撃破点をさらに <strong>+50</strong> に上げる（A）、'
        '<strong>逃したらペナルティ -1</strong> を入れる（B）、'
        '弾が貫通する <strong>貫通弾</strong>（C）と発展させ、'
        '次の記事㉑「敵の出現パターンを作ろう」へつなげます。',
    ],
    eyecatch_basename="eyecatch_game_20_shoot_hit",
    iframe_xml="game_19_step1_final.xml",
    learn_bullets=[
        '敵 <code>i</code> ループの <strong>内側</strong> にさらに弾 <code>j</code> ループをネストして、'
        '<strong>「敵 × 弾」のすべての組み合わせ</strong>で衝突判定を呼ぶパターン',
        'プレイヤー × 敵の <code>player_hit</code> / <code>enemy_hit</code> と並行して、'
        '<strong>弾 × 敵</strong>用の <code>bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)</code> を作る方法',
        '命中時に敵を <strong>リスポーン</strong>（<code>eys[i] = -48</code> + 新しい <code>exs[i]</code>）して、'
        '弾を <strong>画面外（<code>bys[j] = -100</code>）に飛ばす</strong>ことで「弾を消す」を実現する仕組み',
        '<strong>得点ロジックの差し替え</strong>：'
        '「逃した報酬 +1」を消し、「撃破ボーナス +10」に置き換える設計判断',
        '撃破スコア・逃したペナルティ・貫通弾といった<strong>パラメータ（数値や処理）の有無で'
        'ゲームの意味が大きく変わる</strong>感覚（記事⑰〜⑲と同じ「数値を変えるだけ」の発展）',
        '5 ファイル分割の中で <strong>触るのは <code>update_play.py</code> 1 か所だけ</strong>',
        ' という焦点の絞り方。描画・終了画面・main は無傷のままシューティングが完成する',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='当たり判定はゲーム作りの中核。今回出てくる新しい概念と、それぞれを state 辞書のどのキーで表すかを整理します。'
                'プレイヤー × 敵の colliderect（記事⑮〜⑰で扱った）と、弾 × 敵を同じ仕組みで書く感覚を掴みましょう。',
    terms_table=[
        ("弾ヒットボックス（bullet_hit）",
         "弾の当たり判定用 pygame.Rect。"
         "弾の見た目と同じ 8×16 で作るのが今回の方針。"
         "弾は小さいので 24×24 のプレイヤー / 敵と同じヒットボックスにすると当たりが甘くなりすぎる",
         '<code>pygame.Rect(bxs[j], bys[j], 8, 16)</code>'),
        ("二重 for ループ（敵 × 弾）",
         "外側 for i で全敵、内側 for j で全弾を回し、"
         "<code>for i × for j</code> の組み合わせ全部で衝突を調べる",
         '<code>for i in range(0, len(exs), 1):</code> の中に '
         '<code>for j in range(0, len(bxs), 1):</code>'),
        ("敵リスポーン",
         "敵を画面上端に戻して x をランダム化することで、撃破直後にまた新しい敵が出現するように見せかける手法。"
         "敵 list の長さは変えない（list.remove は使わない）",
         '<code>eys[i] = -48</code>; <code>exs[i] = random.randint(0, 576)</code>'),
        ("画面外送り（弾を消す）",
         "弾を <code>list.remove</code> で実際に消すと list の index がずれて for ループが壊れるので、"
         "<code>bys[j] = -100</code> で画面のはるか上に飛ばして「見えない弾」にする",
         '<code>bys[j] = -100</code>'),
        ("撃破スコア（kill score）",
         "弾が敵に当たったときの加算点。シューティングでは敵を倒すこと自体が得点源で、"
         "<strong>逃れた敵に得点を与えない</strong>のが普通",
         '<code>state["score"] = state["score"] + 10</code>'),
        ("貫通弾（pierce）",
         "命中しても消えない弾。<code>bys[j] = -100</code> を書かないだけで実現できる。"
         "強力すぎるので普通は限定的に登場する",
         '弾消失行を削除するだけ'),
    ],
    file_roles_h2="ファイル構成のおさらい（前回までの 6 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。'
         '<strong>今回はこのファイルを触りません</strong>。'
         '弾・敵・スコア・cooldown の初期データは前回までと完全に同じ（<code>state["bxs"] = []</code>, '
         '<code>state["bys"] = []</code>, <code>state["cooldown"] = 0</code> ほか）。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<strong>今回触るのはこのファイルだけ</strong>。'
         '敵 i ループの中に <strong>弾 j ループをネスト</strong>して、'
         '<code>bullet_hit</code> と <code>enemy_hit</code> の <code>colliderect</code> + 命中処理（敵リスポーン + 弾消失）を追加します。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<strong>今回はこのファイルを触りません</strong>。'
         '弾・敵・スコアの描画は前回までと同じで、命中で見た目に変化はあっても処理は同一。'),
        ("update_over.py",
         '<strong>ゲームオーバー / クリア画面の更新ロジック</strong>。'
         '<strong>今回はこのファイルを触りません</strong>。'
         'リトライ時のリセット内容は前回（記事⑲）課題19-3 完了状態と同じで、'
         '<code>state["cooldown"] = 0</code> も含めてリセットします。'),
        ("draw_over.py",
         '<strong>ゲーム終了画面の描画</strong>。'
         '<strong>今回はこのファイルを触りません</strong>。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<strong>今回もこのファイルを編集しません</strong>。'
         '当たり判定の追加でループ構造は無傷のまま済みます。'),
    ],
    steps=[
        Step(
            title="弾と敵の衝突判定を入れよう（命中で敵リスポーン + 弾消失）",
            instructions=[
                'ベースは新⑲の <strong>課題19-3（連射クールダウン）まで完了した状態</strong>です。'
                '<code>game_funcs.py</code> に <code>state["cooldown"] = 0</code> が、'
                '<code>update_play.py</code> に <code>cooldown</code> の二重 if 構造（<code>cooldown</code> を毎フレーム 1 減らし、'
                '<code>cooldown &lt;= 0</code> のとき <code>K_SPACE</code> で発射 + <code>cooldown = 6</code>）が、'
                '<code>update_over.py</code> のリトライ処理に <code>state["cooldown"] = 0</code> がそれぞれ入っているはずです。'
                'この状態をそのままスタートにします',
                '今回触るのは <strong><code>update_play.py</code> だけ</strong>です。'
                '<code>game_funcs.py</code> / <code>draw_play.py</code> / <code>update_over.py</code> /'
                '<code>draw_over.py</code> / <code>main.py</code> はそのままで OK',
                '<code>update_play.py</code> を開きます。'
                '<strong>敵 i ループの中</strong>（<code>player_hit.colliderect(enemy_hit)</code> 判定の <strong>あと</strong>）に、'
                '<strong>弾 j のネスト for ループ</strong> を追加します。'
                '<code>for j in range(0, len(bxs), 1):</code>（緑の <code>pico_for_from_to</code>）で書きます',
                'ネストした for j の中で、まず弾のヒットボックスを作ります。'
                '<code>bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)</code>'
                '（紫の <code>vset</code> + <code>game_rect</code>）。'
                '弾の見た目と同じ 8×16 にしておくと判定が自然になります',
                '次に <code>if bullet_hit.colliderect(enemy_hit):</code>（紫の <code>pico_if</code> + 緑の <code>game_collide</code>）の中に命中処理を 3 行書きます：'
                '<br>① <code>eys[i] = -48</code>（敵を画面上端に戻す）'
                '<br>② <code>exs[i] = random.randint(0, 576)</code>（敵の x をランダムに）'
                '<br>③ <code>bys[j] = -100</code>（弾を画面外に飛ばして消す）',
                '保存して <strong>K_SPACE で弾を発射 → 敵に当てる</strong>を試してください。'
                '弾が敵に触れた瞬間に敵がリスポーン（画面上端から再出現）して、弾も消えるはずです。'
                'スコアは（このステップではまだ）敵を逃したときの +1 だけが加算されます。それは Step 2 で直します',
                '▶ 動作確認：何度も弾を撃って、敵を 5〜10 体倒せるかを試しましょう。'
                '撃った瞬間に敵が動くテンポ感がシューティングらしくなったのを体感できます',
            ],
            figure_basename="game_19_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>このファイルは触りません</strong>。'
                                 '弾と敵の初期化は前回（記事⑲ Step 2）と同じ。'
                                 '当たり判定は実行時の関数なので、データ初期化には影響しません。',
                'update_play.py': '<strong>変更点：</strong>'
                                  '敵 i ループの中（<code>player_hit.colliderect</code> 判定の後）に '
                                  '<code>for j in range(0, len(bxs), 1):</code> をネスト。'
                                  '中で <code>bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)</code> を作り、'
                                  '<code>if bullet_hit.colliderect(enemy_hit):</code> の中で'
                                  '<code>eys[i] = -48</code>, <code>exs[i] = random.randint(0, 576)</code>, '
                                  '<code>bys[j] = -100</code> の 3 行を書きます。',
                'draw_play.py': '<strong>このファイルは触りません</strong>。'
                                '描画は弾・敵の位置だけを参照するので、当たり判定とは独立しています。',
                'update_over.py': '<strong>このファイルは触りません</strong>。'
                                  'リトライ処理の弾リセットは前回（記事⑲）と同じです。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
        Step(
            title="得点を「撃破ボーナス +10」に切り替えよう",
            instructions=[
                'Step 1 では <strong>敵を倒してもスコアが増えない</strong>違和感がありました。'
                '原因は、得点ロジックが <strong>「敵を画面下に逃したら +1」</strong>のままだから。'
                'シューティングでは「逃した敵に得点を与える」のは不自然なので、'
                '<strong>「撃破時に +10 点、逃しても得点なし」</strong>に切り替えます',
                '<code>update_play.py</code> を開きます。'
                '<strong>敵が画面外に出たときの処理</strong>（<code>if eys[i] &gt; 400:</code> の中）の'
                '<strong><code>state["score"] = state["score"] + 1</code> の行を削除</strong>します。'
                '敵を逃しても得点にならない設計に変えます',
                '次に、<strong>弾と敵が衝突したときの処理</strong>（<code>if bullet_hit.colliderect(enemy_hit):</code> の中）に'
                '<code>state["score"] = state["score"] + 10</code> を <strong>1 行追加</strong>します。'
                '<code>bys[j] = -100</code> の前後どちらでも構いません',
                '保存して動作確認。<strong>K_SPACE で敵を撃破するたびに +10 点</strong>入るようになり、'
                '敵を逃しても 0 点（マイナスにもならない）。これが本来のシューティングのスコア設計です',
                '▶ 動作確認：5 体撃破で 50 点、10 体撃破で 100 点。逃した敵を数えても得点が変わらないことを確認しましょう',
            ],
            figure_basename="game_19_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'game_funcs.py': '<strong>このファイルは触りません</strong>。',
                'update_play.py': '<strong>変更点：</strong>'
                                  '① 敵が画面下に出たときの <code>state["score"] = state["score"] + 1</code> を <strong>削除</strong>。'
                                  '② 弾命中時の <code>if bullet_hit.colliderect(enemy_hit):</code> の中に '
                                  '<code>state["score"] = state["score"] + 10</code> を <strong>1 行追加</strong>。',
                'draw_play.py': '<strong>このファイルは触りません</strong>。'
                                'スコア表示はそのまま <code>state["score"]</code> の値を出します。',
                'update_over.py': '<strong>このファイルは触りません</strong>。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="5-20-1",
            title="撃破スコアを上げよう（10 → 50）",
            lead='Step 2 では撃破点が +10 でしたが、'
                 'もっと「敵を倒したくなる」ゲームにするために、撃破点を <strong>+50</strong> に上げてみましょう。'
                 '<strong>触るのは <code>update_play.py</code> の数値 1 か所だけ</strong>です。',
            figure_basename="game_19_a_score_50",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>update_play.py</code> の弾命中時の'
                        '<code>state["score"] = state["score"] + 10</code> の'
                        '<strong>数値 10 を 50</strong> に書き換えるだけ。'
                        '同じパターンで <code>100</code> や <code>500</code> にすれば派手なスコアになり、'
                        '<code>1</code> にすれば抑えめのスコアと、数値ひとつでゲームのテンポが大きく変わるのが体感できます。',
            file_descriptions={
                'update_play.py': '弾命中時の <code>state["score"] = state["score"] + 10</code> の'
                                  '<strong>数値 10 を 50</strong> に書き換えます。変更箇所は <strong>1 か所だけ</strong>。',
                'game_funcs.py': '<strong>このファイルは触りません</strong>。',
                'draw_play.py': '<strong>このファイルは触りません</strong>。'
                                'スコア表示は <code>state["score"]</code> の値そのままを出すだけ。',
                'update_over.py': '<strong>このファイルは触りません</strong>。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
        Kadai(
            number="5-20-2",
            title="敵を逃したらペナルティ -1",
            lead='Step 2 で「逃した敵に得点を与えない」設計にしましたが、'
                 '<strong>「逃したらマイナス点」</strong>にしてみるとどうでしょう？'
                 '<strong>「敵を撃ち漏らさず倒せ！」</strong>というプレッシャーが生まれます。'
                 '触るのは <code>update_play.py</code> の 1 か所だけです。',
            figure_basename="game_19_b_miss_penalty",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>update_play.py</code> の <strong>敵が画面下に出たとき</strong>の処理'
                        '（<code>if eys[i] &gt; 400:</code> の中）に、'
                        '<code>state["score"] = state["score"] + -1</code>'
                        '（紫の <code>py_dict_set</code> + 緑の <code>py_math</code> + 数値 <code>-1</code>）を <strong>1 行追加</strong>するだけ。'
                        '撃破 +10 はそのまま残しているので、'
                        '<strong>「撃ち漏らすと得点が減る」</strong>仕様になります。'
                        '少しでも逃したらマイナスなので、'
                        '<strong>連射しっぱなしでも逃さず全部倒すのが理想</strong>のゲームに変わります。',
            file_descriptions={
                'update_play.py': '敵が画面下に出たときの処理に '
                                  '<code>state["score"] = state["score"] + -1</code> を <strong>1 行追加</strong>します。'
                                  '撃破 +10 の行はそのまま残します。',
                'game_funcs.py': '<strong>このファイルは触りません</strong>。',
                'draw_play.py': '<strong>このファイルは触りません</strong>。',
                'update_over.py': '<strong>このファイルは触りません</strong>。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
        Kadai(
            number="5-20-3",
            title="貫通弾を作ろう（弾を消さない）",
            lead='通常の弾は敵に当たると消えますが、'
                 '<strong>命中しても消えない貫通弾</strong>はどうでしょう？'
                 '1 発で複数の敵を貫通して倒せる強力な弾になります。'
                 '<strong>弾を消す行を 1 行削除するだけ</strong>で実現できます。',
            figure_basename="game_19_c_pierce",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='<code>update_play.py</code> の弾命中処理から'
                        '<strong><code>bys[j] = -100</code> の行を削除</strong>するだけ。'
                        '弾は命中しても消えないので、上に進み続け、'
                        '通り道にある別の敵にも当たれば倒せます。'
                        '<strong>弾の上に敵がたまたま重なるタイミング</strong>では、'
                        '1 発で 2 体・3 体まとめて倒せて爽快感があります。'
                        '逆に難易度が下がり過ぎる場合は、'
                        '貫通させる代わりに <strong>連射クールダウンを長めに</strong>するなどで'
                        'バランスを取るのが定番のテクニックです。',
            file_descriptions={
                'update_play.py': '弾命中処理から <code>bys[j] = -100</code> を <strong>1 行削除</strong>します。'
                                  '残りの命中処理（敵リスポーン + score+10）はそのまま。',
                'game_funcs.py': '<strong>このファイルは触りません</strong>。',
                'draw_play.py': '<strong>このファイルは触りません</strong>。',
                'update_over.py': '<strong>このファイルは触りません</strong>。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
    ],
    summary_bullets=[
        '<strong>敵 i ループの中に弾 j ループをネスト</strong>するパターンが、'
        'シューティングの当たり判定の基本形。「敵 × 弾」のすべての組み合わせで <code>colliderect</code> を呼ぶ',
        '<strong>弾を消す</strong>には <code>list.remove</code> ではなく'
        '<strong><code>bys[j] = -100</code> で画面外に飛ばす</strong>。'
        'list の長さや index がズレないので for ループが安全に動く',
        '<strong>得点ロジックの差し替え</strong>でゲーム性が大きく変わる。'
        '「逃した報酬 +1」を消し「撃破 +10」を追加するだけで、'
        '受動ゲームから能動ゲームへ転換できる',
        '当たり判定だけで <strong>5 ファイルのうち 1 つ（update_play.py）</strong> しか触らないことに注目。'
        '描画・終了画面・main は完全に無傷のままシューティングが完成する',
        '撃破スコア（A）／逃したペナルティ（B）／貫通弾（C）はすべて'
        '<strong>同じ場所の数値・行を変える</strong>だけのアレンジ。'
        'ゲームのバランスや手触りを整えるパラメータ調整は、コードの構造ではなくロジック内の一行で決まる',
        '次の記事㉑では、敵を <strong>3 体固定</strong>から <strong>定期的にスポーンさせる</strong>仕組みに進化させ、'
        '出現パターンや難易度カーブの作り方を学びます',
    ],
    next_article_id=5006,
    next_article_title='【Pygameでゲーム㉑】敵の出現パターンを作ろう',
    cache_buster="20260509d",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑳】敵に弾を当てよう")
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
