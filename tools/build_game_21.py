#!/usr/bin/env python3
"""WP 記事 5148 (Pygame㉒ パワーアップアイテム) の本文を組み立てて反映する。

新㉑（spawn_timer）まで作ってきたシューティングに、画面上から降ってくる
緑のアイテム（power-up）を追加し、取ると一定時間ショットが強化される
「条件付きアビリティ」を導入する。

Step 1 で「アイテム湧き + 取得で power=300 セット + 単発ショット」の最小実装。
Step 2 で「state[\"power\"] > 0 のとき 3 way ショット」の条件分岐を追加。
課題で 600 フレーム長尺パワー（A）／5 way（B）／パワー中はキル得点 3 倍（C）に発展。
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
    "eyecatch_game-5-22_power_up.png"
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

_FUNCS = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Power Up Shooter")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 176}
state["exs"] = []
state["eys"] = []
state["bxs"] = []
state["bys"] = []
state["ixs"] = []
state["iys"] = []
state["spawn_timer"] = 0
state["item_timer"] = 300
state["power"] = 0
state["score"] = 0
state["lives"] = 3
state["frame"] = 0
state["espeed"] = 3
'''

_DRAW_PLAY = '''\
# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    if state["power"] > 0:
        pygame.draw.rect(screen, "#ffeb3b", (state["px"], state["py"], 48, 48))
    else:
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
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Power: " + str(state["power"] // 60), True, "#7cffa5"), (340, 50))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
    bxs = state["bxs"]
    bys = state["bys"]
    for j in range(0, len(bxs), 1):
        pygame.draw.rect(screen, "#ffeb3b", (bxs[j], bys[j], 8, 16))
    ixs = state["ixs"]
    iys = state["iys"]
    for k in range(0, len(ixs), 1):
        pygame.draw.rect(screen, "#7cffa5", (ixs[k], iys[k], 24, 24))
'''

_UPDATE_OVER = '''\
# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 176
        state["exs"] = []
        state["eys"] = []
        state["bxs"] = []
        state["bys"] = []
        state["ixs"] = []
        state["iys"] = []
        state["spawn_timer"] = 0
        state["item_timer"] = 300
        state["power"] = 0
        state["lives"] = 3
        state["score"] = 0
        state["frame"] = 0
        state["espeed"] = 3
'''

_DRAW_OVER = '''\
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
'''

_MAIN = '''\
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


def _make_full_code(update_play_body: str) -> str:
    """update_play.py 本体を差し込んで 5 ファイル全体を組み立てる。"""
    return (
        _FUNCS
        + '\n\n'
        + update_play_body
        + '\n\n'
        + _DRAW_PLAY
        + '\n\n'
        + _UPDATE_OVER
        + '\n\n'
        + _DRAW_OVER
        + '\n\n'
        + _MAIN
    )


# Step 1 — アイテム湧き + power=300 セット + 単発ショット（条件分岐なし）
_UPDATE_PLAY_STEP1 = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    state["power"] = state["power"] - 1
    if state["power"] < 0: state["power"] = 0
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
    ixs = state["ixs"]
    iys = state["iys"]
    state["item_timer"] = state["item_timer"] - 1
    if state["item_timer"] <= 0:
        ixs.append(random.randint(0, 552))
        iys.append(-24)
        state["item_timer"] = random.randint(240, 360)
    for k in range(0, len(ixs), 1):
        iys[k] = iys[k] + 2
        if iys[k] > 400:
            iys[k] = -1000
        player_hit2 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        item_hit = pygame.Rect(ixs[k] + 12, iys[k] + 12, 24, 24)
        if player_hit2.colliderect(item_hit):
            iys[k] = -1000
            state["power"] = 300
    exs = state["exs"]
    eys = state["eys"]
    state["spawn_timer"] = state["spawn_timer"] - 1
    if state["spawn_timer"] <= 0:
        exs.append(random.randint(0, 576))
        eys.append(-48)
        state["spawn_timer"] = 60 - state["frame"] // 60
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
'''

# Step 2 — power > 0 のとき 3 way、それ以外は単発（条件付きアビリティ）
_UPDATE_PLAY_STEP2 = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    state["power"] = state["power"] - 1
    if state["power"] < 0: state["power"] = 0
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
        if state["power"] > 0:
            bxs.append(state["px"] + 20); bys.append(state["py"])
            bxs.append(state["px"] + 4);  bys.append(state["py"] + 8)
            bxs.append(state["px"] + 36); bys.append(state["py"] + 8)
        else:
            bxs.append(state["px"] + 20); bys.append(state["py"])
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 8
    ixs = state["ixs"]
    iys = state["iys"]
    state["item_timer"] = state["item_timer"] - 1
    if state["item_timer"] <= 0:
        ixs.append(random.randint(0, 552))
        iys.append(-24)
        state["item_timer"] = random.randint(240, 360)
    for k in range(0, len(ixs), 1):
        iys[k] = iys[k] + 2
        if iys[k] > 400:
            iys[k] = -1000
        player_hit2 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        item_hit = pygame.Rect(ixs[k] + 12, iys[k] + 12, 24, 24)
        if player_hit2.colliderect(item_hit):
            iys[k] = -1000
            state["power"] = 300
    exs = state["exs"]
    eys = state["eys"]
    state["spawn_timer"] = state["spawn_timer"] - 1
    if state["spawn_timer"] <= 0:
        exs.append(random.randint(0, 576))
        eys.append(-48)
        state["spawn_timer"] = 60 - state["frame"] // 60
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
'''

# 課題A 5-22-1 — power の効果時間を 600 に伸ばす（10 秒）
_UPDATE_PLAY_KADAI_A = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    state["power"] = state["power"] - 1
    if state["power"] < 0: state["power"] = 0
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
        if state["power"] > 0:
            bxs.append(state["px"] + 20); bys.append(state["py"])
            bxs.append(state["px"] + 4);  bys.append(state["py"] + 8)
            bxs.append(state["px"] + 36); bys.append(state["py"] + 8)
        else:
            bxs.append(state["px"] + 20); bys.append(state["py"])
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 8
    ixs = state["ixs"]
    iys = state["iys"]
    state["item_timer"] = state["item_timer"] - 1
    if state["item_timer"] <= 0:
        ixs.append(random.randint(0, 552))
        iys.append(-24)
        state["item_timer"] = random.randint(240, 360)
    for k in range(0, len(ixs), 1):
        iys[k] = iys[k] + 2
        if iys[k] > 400:
            iys[k] = -1000
        player_hit2 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        item_hit = pygame.Rect(ixs[k] + 12, iys[k] + 12, 24, 24)
        if player_hit2.colliderect(item_hit):
            iys[k] = -1000
            state["power"] = 600
    exs = state["exs"]
    eys = state["eys"]
    state["spawn_timer"] = state["spawn_timer"] - 1
    if state["spawn_timer"] <= 0:
        exs.append(random.randint(0, 576))
        eys.append(-48)
        state["spawn_timer"] = 60 - state["frame"] // 60
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
'''

# 課題B 5-22-2 — power 中は 5 way ショット
_UPDATE_PLAY_KADAI_B = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    state["power"] = state["power"] - 1
    if state["power"] < 0: state["power"] = 0
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
        if state["power"] > 0:
            bxs.append(state["px"] + 20); bys.append(state["py"])
            bxs.append(state["px"] + 4);  bys.append(state["py"] + 8)
            bxs.append(state["px"] + 36); bys.append(state["py"] + 8)
            bxs.append(state["px"] - 12); bys.append(state["py"] + 16)
            bxs.append(state["px"] + 52); bys.append(state["py"] + 16)
        else:
            bxs.append(state["px"] + 20); bys.append(state["py"])
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 8
    ixs = state["ixs"]
    iys = state["iys"]
    state["item_timer"] = state["item_timer"] - 1
    if state["item_timer"] <= 0:
        ixs.append(random.randint(0, 552))
        iys.append(-24)
        state["item_timer"] = random.randint(240, 360)
    for k in range(0, len(ixs), 1):
        iys[k] = iys[k] + 2
        if iys[k] > 400:
            iys[k] = -1000
        player_hit2 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        item_hit = pygame.Rect(ixs[k] + 12, iys[k] + 12, 24, 24)
        if player_hit2.colliderect(item_hit):
            iys[k] = -1000
            state["power"] = 300
    exs = state["exs"]
    eys = state["eys"]
    state["spawn_timer"] = state["spawn_timer"] - 1
    if state["spawn_timer"] <= 0:
        exs.append(random.randint(0, 576))
        eys.append(-48)
        state["spawn_timer"] = 60 - state["frame"] // 60
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
'''

# 課題C 5-22-3 — power 中はキル得点 3 倍（10→30）
_UPDATE_PLAY_KADAI_C = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    state["power"] = state["power"] - 1
    if state["power"] < 0: state["power"] = 0
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
        if state["power"] > 0:
            bxs.append(state["px"] + 20); bys.append(state["py"])
            bxs.append(state["px"] + 4);  bys.append(state["py"] + 8)
            bxs.append(state["px"] + 36); bys.append(state["py"] + 8)
        else:
            bxs.append(state["px"] + 20); bys.append(state["py"])
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 8
    ixs = state["ixs"]
    iys = state["iys"]
    state["item_timer"] = state["item_timer"] - 1
    if state["item_timer"] <= 0:
        ixs.append(random.randint(0, 552))
        iys.append(-24)
        state["item_timer"] = random.randint(240, 360)
    for k in range(0, len(ixs), 1):
        iys[k] = iys[k] + 2
        if iys[k] > 400:
            iys[k] = -1000
        player_hit2 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        item_hit = pygame.Rect(ixs[k] + 12, iys[k] + 12, 24, 24)
        if player_hit2.colliderect(item_hit):
            iys[k] = -1000
            state["power"] = 300
    exs = state["exs"]
    eys = state["eys"]
    state["spawn_timer"] = state["spawn_timer"] - 1
    if state["spawn_timer"] <= 0:
        exs.append(random.randint(0, 576))
        eys.append(-48)
        state["spawn_timer"] = 60 - state["frame"] // 60
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
                if state["power"] > 0:
                    state["score"] = state["score"] + 30
                else:
                    state["score"] = state["score"] + 10
                bys[j] = -100
'''

CODE_STEP1 = _make_full_code(_UPDATE_PLAY_STEP1)
CODE_STEP2 = _make_full_code(_UPDATE_PLAY_STEP2)
CODE_KADAI_A = _make_full_code(_UPDATE_PLAY_KADAI_A)
CODE_KADAI_B = _make_full_code(_UPDATE_PLAY_KADAI_B)
CODE_KADAI_C = _make_full_code(_UPDATE_PLAY_KADAI_C)


SPEC = Spec(
    page_id=5148,
    slug="game-22-shoot-power",
    title="パワーアップアイテム",
    intro_paragraphs=[
        '前回（記事㉑）で <strong>spawn_timer</strong> による敵の動的スポーンを学び、'
        '時間とともにシューティングが盛り上がる「リズム」を作りました。'
        'ただ、プレイヤー側はずっと同じ単発ショットのまま。'
        'やはりゲームには <strong>「ここで強くなる！」という瞬間</strong> が欲しいところです。',
        'この記事では、画面の上から降ってくる<strong>緑のアイテム</strong>を取ると、'
        '一定時間ショットが <strong>3 way（3 連射）</strong> に切り替わるという'
        '<strong>条件付きアビリティ</strong>を実装します。'
        '使うのは <code>state["power"]</code> という<strong>効果時間タイマー</strong>。'
        '取得時に 300（5 秒分）をセットし、毎フレーム -1 して 0 になったら元の単発に戻ります。',
        'Step 1 では「アイテムを湧かせて、取ると <code>state["power"] = 300</code> をセット」までを実装。'
        'まだショット自体は単発のままで、HUD に <code>Power: 5 → 4 → 3...</code> と'
        '残り秒数が表示されるところまで作ります。',
        'Step 2 で <code>if state["power"] &gt; 0:</code> の条件分岐を追加して、'
        'パワー中は SPACE 1 回押下で <code>append</code> を <strong>3 セット</strong>並べる'
        '<strong>3 way ショット</strong>を実装します。'
        'これで「アイテムを取る → 強くなる → 元に戻る」の循環が完成します。',
        '課題では、効果時間を 600 フレーム（10 秒）に伸ばす（A）、'
        '<strong>5 way ショット</strong> に拡張する（B）、'
        'パワー中は<strong>キル得点が 3 倍</strong>になる（C）と発展させ、'
        '次の記事㉓「ボス戦を作ろう」へつなげます。',
    ],
    eyecatch_basename="eyecatch_game_22_power_up",
    iframe_xml="game_21_step1_final.xml",
    learn_bullets=[
        '<code>state["power"]</code> という<strong>効果時間タイマー</strong>を毎フレーム'
        '<code>-1</code> して、0 を下回ったら 0 で固定するイディオム',
        'アイテム取得時に <code>state["power"] = 300</code> でセット → 5 秒間（@60fps）'
        '能力が有効になる <strong>有限時間バフ</strong> の作り方',
        '<code>if state["power"] &gt; 0:</code> 〜 <code>else:</code> でショット種類を切り替える'
        '<strong>条件付きアビリティ</strong> の構造',
        'アイテムを <code>random.randint(240, 360)</code> 間隔で<strong>確率的に出現</strong>させ、'
        '<code>iys</code> リストで管理する方法（敵スポーンと同じパターン）',
        'パワー中はプレイヤーを<strong>黄色</strong>に、HUD に <code>Power: 残り秒数</code> を表示して'
        '「いま強い！」を視覚化する UX 設計',
        '5 ファイル分割の中で、<code>game_funcs.py</code>（4 行追加）／<code>update_play.py</code>'
        '（アイテムループ + ショット分岐）／<code>draw_play.py</code>（プレイヤー色分岐 + 緑アイテム描画）'
        'の 3 ファイルに変更が局所化されること',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='アイテムでプレイヤーが一時的に強くなる仕組みは、ほぼすべてのゲームに登場します。'
                '今回出てくる新しい概念と、それを state 辞書のどのキーで表すかを整理しましょう。',
    terms_table=[
        ("パワーアップアイテム",
         "プレイヤーが取得すると一時的に能力を強化する画面上のオブジェクト。"
         "今回は緑の四角で表現する",
         '<code>ixs.append(random.randint(0, 552))</code>'),
        ("効果時間タイマー（buff timer）",
         "能力が有効な残りフレーム数を保持するカウンタ。"
         "取得時にセット、毎フレーム -1、0 を下回ったら 0 で固定",
         '<code>state["power"] = 300</code>'),
        ("確率出現（random spawn interval）",
         "毎回違う間隔でアイテムを湧かせるための仕組み。"
         "<code>random.randint(240, 360)</code> で 4〜6 秒のランダムな次回までの待ち時間を作る",
         '<code>state["item_timer"] = random.randint(240, 360)</code>'),
        ("条件付きアビリティ",
         "<code>state[\"power\"]</code> の値で能力の有無を判定する設計。"
         "<code>if &gt; 0:</code> 〜 <code>else:</code> で「強化版」と「通常版」を切り替える",
         '<code>if state["power"] &gt; 0: ...</code>'),
        ("3 way（3 連射）ショット",
         "1 回のキー入力で <code>append</code> を 3 セット並べて、"
         "弾を 3 つ同時に発射するパターン",
         '<code>bxs.append(...); bxs.append(...); bxs.append(...)</code>'),
        ("画面外フラグ（sentinel）",
         "アイテムや弾が画面外に出たことを示すための「あり得ない値」。"
         "<code>iys[k] = -1000</code> のように極端な値を入れて当たり判定を無効化する",
         '<code>iys[k] = -1000</code>'),
    ],
    file_roles_h2="ファイル構成のおさらい（前回までの 5 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。'
         '<strong>変更点：</strong>'
         '<code>state["ixs"] = []</code>, <code>state["iys"] = []</code>, '
         '<code>state["item_timer"] = 300</code>, <code>state["power"] = 0</code> の 4 行を追加。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<strong>今回触るのはこのファイルが中心です</strong>。'
         '冒頭で <code>state["power"]</code> を 1 つ減らし、敵ループの<strong>前</strong>に'
         'アイテム湧き＋アイテムループ（取得時に <code>state["power"] = 300</code>）を追加。'
         'Step 2 ではショット部分に <code>if state["power"] &gt; 0:</code> 分岐を入れます。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<strong>変更点：</strong>'
         'プレイヤー色を <code>if state["power"] &gt; 0:</code> で黄色／シアンに分岐、'
         'HUD に <code>Power: 残り秒数</code> を追加、'
         '末尾に <code>for k in range(0, len(ixs), 1):</code> で緑アイテムを描画。'),
        ("update_over.py",
         '<strong>ゲームオーバー / クリア画面の更新ロジック</strong>。'
         '<strong>変更点：</strong>'
         'リトライ時に <code>state["ixs"] = []</code>, <code>state["iys"] = []</code>, '
         '<code>state["item_timer"] = 300</code>, <code>state["power"] = 0</code> をリセット。'),
        ("draw_over.py",
         '<strong>ゲーム終了画面の描画</strong>。'
         '<strong>今回はこのファイルを触りません</strong>。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<strong>今回もこのファイルを編集しません</strong>。'
         '5 ファイル分割の恩恵で、新しい機能を足してもループ構造は無傷のままです。'),
    ],
    steps=[
        Step(
            title="アイテムを湧かせて、取ると power=300 をセットしよう",
            instructions=[
                '<code>game_funcs.py</code> を開いて、敵リストの並びの下に '
                '<code>state["ixs"] = []</code>, <code>state["iys"] = []</code>, '
                '<code>state["item_timer"] = 300</code>, <code>state["power"] = 0</code> の'
                '4 行を追加します（アイテム x/y リストと、5 秒後に 1 個目を出すタイマー、'
                'パワー残量カウンタ）',
                '<code>update_play.py</code> を開きます。'
                '<strong>関数の冒頭、frame の更新の直後</strong>に '
                '<code>state["power"] = state["power"] - 1</code> を書き、'
                'その下に <code>if state["power"] &lt; 0: state["power"] = 0</code> を追加します。'
                'これで毎フレーム自動的にカウンタが減っていきます',
                '次に、敵ループ（<code>for i in range(0, len(exs), 1):</code>）の<strong>直前</strong>に'
                'アイテムまわりのコードを差し込みます。'
                '<br>① <code>ixs = state["ixs"]</code> / <code>iys = state["iys"]</code> でリストを取り出す'
                '<br>② <code>state["item_timer"] = state["item_timer"] - 1</code>'
                '<br>③ <code>if state["item_timer"] &lt;= 0:</code> 内で：'
                '<code>ixs.append(random.randint(0, 552))</code> / <code>iys.append(-24)</code> / '
                '<code>state["item_timer"] = random.randint(240, 360)</code>',
                'さらにその下にアイテム k ループ（<code>for k in range(0, len(ixs), 1):</code>）を書きます。'
                '<br>① <code>iys[k] = iys[k] + 2</code>（ゆっくり落下）'
                '<br>② 画面外チェック → <code>iys[k] = -1000</code> で消す'
                '<br>③ <code>player_hit2.colliderect(item_hit)</code> で取得判定。'
                '当たったら <code>iys[k] = -1000</code> + <code>state["power"] = 300</code>',
                '<code>draw_play.py</code> の末尾に '
                '<code>for k in range(0, len(ixs), 1):</code> を追加して、'
                '<code>pygame.draw.rect(screen, "#7cffa5", (ixs[k], iys[k], 24, 24))</code> で'
                '緑のアイテムを描きます。'
                '<strong>HUD に Power 表示も追加</strong>：'
                '<code>screen.blit(_f.render("Power: " + str(state["power"] // 60), True, "#7cffa5"), (340, 50))</code>',
                '<code>update_over.py</code> のリトライ時のリセットに '
                '<code>state["ixs"] = []</code>, <code>state["iys"] = []</code>, '
                '<code>state["item_timer"] = 300</code>, <code>state["power"] = 0</code> を追加します',
                '保存して実行。<strong>5 秒たつと最初の緑アイテム</strong>が画面上から降ってきて、'
                '取得すると HUD の Power が 5 から 0 までカウントダウンするはずです。'
                '取得しても<strong>まだショットは単発のまま</strong>で OK です（次のステップで強化します）',
            ],
            figure_basename="game_21_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点（4 行追加）：</strong>'
                                 '<code>state["ixs"] = []</code>, <code>state["iys"] = []</code>, '
                                 '<code>state["item_timer"] = 300</code>, <code>state["power"] = 0</code>。',
                'update_play.py': '<strong>変更点：</strong>'
                                  '関数冒頭に <code>state["power"] -= 1</code> + 0 クランプ。'
                                  '敵ループの<strong>直前</strong>にアイテム湧きとアイテム k ループを追加。'
                                  '取得時に <code>state["power"] = 300</code>。',
                'draw_play.py': '<strong>変更点：</strong>'
                                'HUD に <code>Power: 残り秒</code> を追加、'
                                '末尾に <code>for k</code> で緑アイテム描画ループを追加。',
                'update_over.py': '<strong>変更点：</strong>'
                                  'リトライ時に ixs/iys/item_timer/power のリセットを追加。',
                'draw_over.py': '<strong>このファイルは触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
        Step(
            title="state[\"power\"] > 0 のとき 3 way ショットに切り替えよう",
            instructions=[
                'Step 1 では「取っても見た目しか変わらない」状態でした。'
                'いよいよ <strong>条件付きアビリティ</strong> を実装します',
                '<code>update_play.py</code> の <code>if pygame.key.get_pressed()[pygame.K_SPACE]:</code> '
                'ブロックを書き換えます。'
                '中身を <strong>2 通り</strong> に分岐：'
                '<br>・<code>if state["power"] &gt; 0:</code> のとき → '
                '<code>bxs.append</code>/<code>bys.append</code> を <strong>3 セット</strong> 並べる（3 way）'
                '<br>・<code>else:</code> のとき → 1 セットだけ append（単発）',
                '3 way の x オフセットは <code>+20 / +4 / +36</code>、y は <code>+0 / +8 / +8</code> 程度がきれいに見えます。'
                '弾は全部 <code>bys[j] -= 8</code> でまっすぐ上に飛ぶので、'
                '<strong>x をずらす</strong>だけで複数の弾道に見せかけます',
                '<code>draw_play.py</code> の冒頭、プレイヤー描画を '
                '<code>if state["power"] &gt; 0: pygame.draw.rect(screen, "#ffeb3b", ...)</code> '
                '(黄色) と <code>else: pygame.draw.rect(screen, "#5cd6ff", ...)</code> (シアン) に'
                '分岐させると、見た目で「いま強い！」が分かります',
                '保存して実行。緑アイテムを取った直後 5 秒間は、SPACE を押すと'
                '<strong>3 発の弾が同時に飛ぶ</strong>はずです。'
                '5 秒経って power が 0 になると、自動で単発に戻ります',
                '▶ 動作確認：パワー中は敵が一度に 3 体まとめて消せること、'
                '5 秒後にちゃんと単発に戻ること、HUD の Power カウントダウンを観察しましょう',
            ],
            figure_basename="game_21_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'game_funcs.py': '<strong>このファイルは触りません</strong>。Step 1 と同じです。',
                'update_play.py': '<strong>変更点：</strong>'
                                  'SPACE 押下時の <code>append</code> を '
                                  '<code>if state["power"] &gt; 0:</code> 〜 <code>else:</code> で分岐。'
                                  'パワー中は 3 セット、それ以外は 1 セット append。',
                'draw_play.py': '<strong>変更点：</strong>'
                                'プレイヤー描画を黄色／シアンの '
                                '<code>if state["power"] &gt; 0:</code> 分岐に。',
                'update_over.py': '<strong>このファイルは触りません</strong>。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="5-22-1",
            title="効果時間を 10 秒（600 フレーム）に伸ばそう",
            lead='Step 2 の <code>state["power"] = 300</code>（5 秒）を、'
                 '<strong>600（10 秒）</strong> に書き換えるだけのバランス調整課題です。'
                 '<strong>変更場所は <code>update_play.py</code> のアイテム取得時の 1 行だけ</strong>。'
                 'パワーの「ご褒美感」が大きく変わります。',
            figure_basename="game_21_a_long_power",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>state["power"] = 300</code> を '
                        '<code>state["power"] = 600</code> に変えるだけ。'
                        '効果時間が長くなる分、アイテム取得の達成感が増します。'
                        'ただし長すぎると「常時 3 way」になってアイテムのありがたみが薄れるので、'
                        '600 がちょうど良いバランスかどうかを実際にプレイして確かめましょう。',
        ),
        Kadai(
            number="5-22-2",
            title="パワー中は 5 way ショットにしよう",
            lead='Step 2 で 3 way だったショットを、パワー中だけ <strong>5 way</strong> に拡張しましょう。'
                 '<code>append</code> セットを <strong>5 つ</strong> 並べるだけです。'
                 'x オフセットを左右に大きくとって、扇状に見せます。',
            figure_basename="game_21_b_five_way",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>if state["power"] &gt; 0:</code> 内に '
                        '<code>append</code> セットを 2 組追加。'
                        'x は <code>-12</code> と <code>+52</code>（プレイヤーの両サイドの外側）、'
                        'y は <code>+16</code>（少し下から発射）にすると 5 本の弾が扇状に広がる演出になります。'
                        '弾は<strong>全部まっすぐ上に飛ぶ</strong>ので、本物の「扇」ではなく'
                        '<strong>「5 本の平行線」</strong>ですが、見た目のインパクトは十分です。',
        ),
        Kadai(
            number="5-22-3",
            title="パワー中はキル得点を 3 倍にしよう",
            lead='Step 2 では「同じ得点 + 3 way で速く稼げる」だけでしたが、'
                 'これに <strong>「キル単価そのものを 3 倍」</strong> を足してみましょう。'
                 'パワー中はキル得点が <code>10 → 30</code>。'
                 '<code>update_play.py</code> の弾／敵衝突時の <code>state["score"] += 10</code> を分岐させます。',
            figure_basename="game_21_c_score_boost",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='弾と敵が衝突した際の <code>state["score"] = state["score"] + 10</code> を '
                        '<code>if state["power"] &gt; 0: state["score"] += 30 else: state["score"] += 10</code> に'
                        '書き換えるだけ。'
                        '「3 way で 3 体倒す × 3 倍得点 = 通常時の 9 倍速でスコアが伸びる」という'
                        '<strong>強烈な「強化期間」</strong>が生まれ、'
                        'アイテムを積極的に取りに行く動機付けになります。',
        ),
    ],
    summary_bullets=[
        '<code>state["power"]</code> という<strong>効果時間タイマー</strong>を 1 つ持つだけで、'
        '「一時的に強くなる」というゲーム演出のほぼ全てが作れる',
        '取得時に <code>state["power"] = 300</code> でセット、'
        '毎フレーム <code>-1</code>、'
        '<code>0</code> を下回ったら <code>0</code> で固定 — このイディオムが'
        '<strong>有限時間バフの基本形</strong>',
        '<code>if state["power"] &gt; 0:</code> 〜 <code>else:</code> で能力を切り替えるのが'
        '<strong>条件付きアビリティ</strong>の核。'
        'ショット数・得点倍率・色・速度など、何でも切り替えられる',
        'アイテムも <strong>敵スポーンと完全に同じ仕組み</strong>（item_timer + append + 落下ループ）。'
        '同じパターンが繰り返し使えるのがゲームプログラミングの効率のいい設計',
        '5 ファイル分割のおかげで、変更は <code>game_funcs.py</code>（4 行）／'
        '<code>update_play.py</code>（アイテムループとショット分岐）／'
        '<code>draw_play.py</code>（色分岐とアイテム描画）の 3 か所に局所化される',
    ],
    next_article_id=5150,
    next_article_title='【Pygameでゲーム㉓】ボス戦を作ろう',
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
                  title="【Pygameでゲーム㉒】パワーアップアイテム")
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
