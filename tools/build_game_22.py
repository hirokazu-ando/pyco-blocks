#!/usr/bin/env python3
"""WP 記事 5150 (Pygame㉓ ボス戦を作ろう) の本文を組み立てて反映する。

新㉒（パワーアップアイテム）まで作ってきたシューティングに、
ステージ後半で出現する大型の<strong>ボス</strong>を追加する。
HP（耐久値）、画面上部での自律移動、出現タイミングのスポーン、
プレイヤー弾でダメージを与えてゲージを減らす HP バー描画、
そして Step 2 ではボスがプレイヤーに向けて<strong>下向きの弾</strong>を撃つ攻撃パターンまで実装する。

Step 1 で「ボスの出現 + HP + ジグザグ移動 + プレイヤー弾でダメージ」までの最小実装。
Step 2 で「ボスが下向きに弾を撃つ + ボス弾とプレイヤーの衝突」を追加。
課題で HP 50（A）／ジグザグ移動（B）／3 way ボス弾（C）に発展。
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
    "eyecatch_game-5-23_boss.png"
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

_FUNCS_TEMPLATE = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Boss Battle")
clock = pygame.time.Clock()
state = {{"mode": "play", "px": 296, "py": 176}}
state["exs"] = []
state["eys"] = []
state["bxs"] = []
state["bys"] = []
state["bbxs"] = []
state["bbys"] = []
state["spawn_timer"] = 0
state["bx"] = 288
state["by"] = 40
state["bhp"] = {boss_hp_init}
state["bdx"] = 2
state["bdy"] = 0
state["boss_active"] = 0
state["bb_timer"] = 60
state["boss_hp_init"] = {boss_hp_init}
state["score"] = 0
state["lives"] = 3
state["frame"] = 0
state["espeed"] = 3
'''

_DRAW_PLAY = '''\
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
    screen.blit(_f.render("Time: " + str(40 - state["frame"] // 60), True, "#ffffff"), (200, 50))
    exs = state["exs"]
    eys = state["eys"]
    for i in range(0, len(exs), 1):
        pygame.draw.rect(screen, "#ff6600", (exs[i], eys[i], 48, 48))
    bxs = state["bxs"]
    bys = state["bys"]
    for j in range(0, len(bxs), 1):
        pygame.draw.rect(screen, "#ffeb3b", (bxs[j], bys[j], 8, 16))
    bbxs = state["bbxs"]
    bbys = state["bbys"]
    for k in range(0, len(bbxs), 1):
        pygame.draw.rect(screen, "#ff64a0", (bbxs[k], bbys[k], 8, 16))
    if state["boss_active"] == 1:
        pygame.draw.rect(screen, "#a050ff", (state["bx"], state["by"], 64, 64))
        pygame.draw.rect(screen, "#444444", (80, 100, 480, 12))
        pygame.draw.rect(screen, "#ff3232", (80, 100, state["bhp"] * 480 // state["boss_hp_init"], 12))
        _f = pygame.font.SysFont(None, 22)
        screen.blit(_f.render("BOSS HP: " + str(state["bhp"]), True, "#ffffff"), (80, 80))
'''

_UPDATE_OVER_TEMPLATE = '''\
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
        state["bbxs"] = []
        state["bbys"] = []
        state["spawn_timer"] = 0
        state["bx"] = 288
        state["by"] = 40
        state["bhp"] = {boss_hp_init}
        state["bdx"] = 2
        state["bdy"] = 0
        state["boss_active"] = 0
        state["bb_timer"] = 60
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
        screen.blit(_f.render("BOSS DOWN!", True, "#ffeb3b"), (200, 160))
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


def _make_full_code(update_play_body: str, boss_hp_init: int = 30) -> str:
    """update_play.py 本体と HP 初期値を差し込んで 5 ファイル全体を組み立てる。"""
    return (
        _FUNCS_TEMPLATE.format(boss_hp_init=boss_hp_init)
        + '\n\n'
        + update_play_body
        + '\n\n'
        + _DRAW_PLAY
        + '\n\n'
        + _UPDATE_OVER_TEMPLATE.format(boss_hp_init=boss_hp_init)
        + '\n\n'
        + _DRAW_OVER
        + '\n\n'
        + _MAIN
    )


# Step 1 — ボス出現 + HP + 横移動 + プレイヤー弾でダメージ（ボス弾なし）
_UPDATE_PLAY_STEP1 = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["frame"] >= 600:
        if state["boss_active"] == 0:
            state["boss_active"] = 1
            state["bx"] = 288
            state["by"] = 40
            state["bhp"] = 30
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
    if state["boss_active"] == 1:
        state["bx"] = state["bx"] + state["bdx"]
        if state["bx"] < 0:
            state["bx"] = 0
            state["bdx"] = -state["bdx"]
        if state["bx"] > 576:
            state["bx"] = 576
            state["bdx"] = -state["bdx"]
        boss_hit = pygame.Rect(state["bx"], state["by"], 64, 64)
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(boss_hit):
                state["bhp"] = state["bhp"] - 1
                bys[j] = -100
                if state["bhp"] <= 0:
                    state["boss_active"] = 0
                    state["score"] = state["score"] + 500
                    state["mode"] = "clear"
    exs = state["exs"]
    eys = state["eys"]
    if state["boss_active"] == 0:
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

# Step 2 — ボス弾（下向き）追加 + プレイヤーとの衝突
_UPDATE_PLAY_STEP2 = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["frame"] >= 600:
        if state["boss_active"] == 0:
            state["boss_active"] = 1
            state["bx"] = 288
            state["by"] = 40
            state["bhp"] = 30
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
    bbxs = state["bbxs"]
    bbys = state["bbys"]
    if state["boss_active"] == 1:
        state["bx"] = state["bx"] + state["bdx"]
        if state["bx"] < 0:
            state["bx"] = 0
            state["bdx"] = -state["bdx"]
        if state["bx"] > 576:
            state["bx"] = 576
            state["bdx"] = -state["bdx"]
        state["bb_timer"] = state["bb_timer"] - 1
        if state["bb_timer"] <= 0:
            bbxs.append(state["bx"] + 28)
            bbys.append(state["by"] + 64)
            state["bb_timer"] = 60
        boss_hit = pygame.Rect(state["bx"], state["by"], 64, 64)
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(boss_hit):
                state["bhp"] = state["bhp"] - 1
                bys[j] = -100
                if state["bhp"] <= 0:
                    state["boss_active"] = 0
                    state["score"] = state["score"] + 500
                    state["mode"] = "clear"
    for k in range(0, len(bbxs), 1):
        bbys[k] = bbys[k] + 5
        if bbys[k] > 400:
            bbys[k] = -100
        player_hit3 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        bblt_hit = pygame.Rect(bbxs[k], bbys[k], 8, 16)
        if player_hit3.colliderect(bblt_hit):
            state["lives"] = state["lives"] - 1
            bbys[k] = -100
            if state["lives"] <= 0:
                state["mode"] = "over"
    exs = state["exs"]
    eys = state["eys"]
    if state["boss_active"] == 0:
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

# 課題A 5-23-1 — ボス HP を 50 に増やす（耐久強化）
_UPDATE_PLAY_KADAI_A = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["frame"] >= 600:
        if state["boss_active"] == 0:
            state["boss_active"] = 1
            state["bx"] = 288
            state["by"] = 40
            state["bhp"] = 50
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
    bbxs = state["bbxs"]
    bbys = state["bbys"]
    if state["boss_active"] == 1:
        state["bx"] = state["bx"] + state["bdx"]
        if state["bx"] < 0:
            state["bx"] = 0
            state["bdx"] = -state["bdx"]
        if state["bx"] > 576:
            state["bx"] = 576
            state["bdx"] = -state["bdx"]
        state["bb_timer"] = state["bb_timer"] - 1
        if state["bb_timer"] <= 0:
            bbxs.append(state["bx"] + 28)
            bbys.append(state["by"] + 64)
            state["bb_timer"] = 60
        boss_hit = pygame.Rect(state["bx"], state["by"], 64, 64)
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(boss_hit):
                state["bhp"] = state["bhp"] - 1
                bys[j] = -100
                if state["bhp"] <= 0:
                    state["boss_active"] = 0
                    state["score"] = state["score"] + 500
                    state["mode"] = "clear"
    for k in range(0, len(bbxs), 1):
        bbys[k] = bbys[k] + 5
        if bbys[k] > 400:
            bbys[k] = -100
        player_hit3 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        bblt_hit = pygame.Rect(bbxs[k], bbys[k], 8, 16)
        if player_hit3.colliderect(bblt_hit):
            state["lives"] = state["lives"] - 1
            bbys[k] = -100
            if state["lives"] <= 0:
                state["mode"] = "over"
    exs = state["exs"]
    eys = state["eys"]
    if state["boss_active"] == 0:
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

# 課題B 5-23-2 — ボスをジグザグ移動（縦の上下動を追加）
_UPDATE_PLAY_KADAI_B = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["frame"] >= 600:
        if state["boss_active"] == 0:
            state["boss_active"] = 1
            state["bx"] = 288
            state["by"] = 40
            state["bhp"] = 30
            state["bdy"] = 1
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
    bbxs = state["bbxs"]
    bbys = state["bbys"]
    if state["boss_active"] == 1:
        state["bx"] = state["bx"] + state["bdx"]
        state["by"] = state["by"] + state["bdy"]
        if state["bx"] < 0:
            state["bx"] = 0
            state["bdx"] = -state["bdx"]
        if state["bx"] > 576:
            state["bx"] = 576
            state["bdx"] = -state["bdx"]
        if state["by"] < 24:
            state["by"] = 24
            state["bdy"] = -state["bdy"]
        if state["by"] > 120:
            state["by"] = 120
            state["bdy"] = -state["bdy"]
        state["bb_timer"] = state["bb_timer"] - 1
        if state["bb_timer"] <= 0:
            bbxs.append(state["bx"] + 28)
            bbys.append(state["by"] + 64)
            state["bb_timer"] = 60
        boss_hit = pygame.Rect(state["bx"], state["by"], 64, 64)
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(boss_hit):
                state["bhp"] = state["bhp"] - 1
                bys[j] = -100
                if state["bhp"] <= 0:
                    state["boss_active"] = 0
                    state["score"] = state["score"] + 500
                    state["mode"] = "clear"
    for k in range(0, len(bbxs), 1):
        bbys[k] = bbys[k] + 5
        if bbys[k] > 400:
            bbys[k] = -100
        player_hit3 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        bblt_hit = pygame.Rect(bbxs[k], bbys[k], 8, 16)
        if player_hit3.colliderect(bblt_hit):
            state["lives"] = state["lives"] - 1
            bbys[k] = -100
            if state["lives"] <= 0:
                state["mode"] = "over"
    exs = state["exs"]
    eys = state["eys"]
    if state["boss_active"] == 0:
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

# 課題C 5-23-3 — ボスが 3 way の弾幕を撃つ
_UPDATE_PLAY_KADAI_C = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // 300
    if state["frame"] >= 600:
        if state["boss_active"] == 0:
            state["boss_active"] = 1
            state["bx"] = 288
            state["by"] = 40
            state["bhp"] = 30
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
    bbxs = state["bbxs"]
    bbys = state["bbys"]
    if state["boss_active"] == 1:
        state["bx"] = state["bx"] + state["bdx"]
        if state["bx"] < 0:
            state["bx"] = 0
            state["bdx"] = -state["bdx"]
        if state["bx"] > 576:
            state["bx"] = 576
            state["bdx"] = -state["bdx"]
        state["bb_timer"] = state["bb_timer"] - 1
        if state["bb_timer"] <= 0:
            bbxs.append(state["bx"] + 28); bbys.append(state["by"] + 64)
            bbxs.append(state["bx"] + 8);  bbys.append(state["by"] + 56)
            bbxs.append(state["bx"] + 48); bbys.append(state["by"] + 56)
            state["bb_timer"] = 60
        boss_hit = pygame.Rect(state["bx"], state["by"], 64, 64)
        for j in range(0, len(bxs), 1):
            bullet_hit = pygame.Rect(bxs[j], bys[j], 8, 16)
            if bullet_hit.colliderect(boss_hit):
                state["bhp"] = state["bhp"] - 1
                bys[j] = -100
                if state["bhp"] <= 0:
                    state["boss_active"] = 0
                    state["score"] = state["score"] + 500
                    state["mode"] = "clear"
    for k in range(0, len(bbxs), 1):
        bbys[k] = bbys[k] + 5
        if bbys[k] > 400:
            bbys[k] = -100
        player_hit3 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        bblt_hit = pygame.Rect(bbxs[k], bbys[k], 8, 16)
        if player_hit3.colliderect(bblt_hit):
            state["lives"] = state["lives"] - 1
            bbys[k] = -100
            if state["lives"] <= 0:
                state["mode"] = "over"
    exs = state["exs"]
    eys = state["eys"]
    if state["boss_active"] == 0:
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

CODE_STEP1 = _make_full_code(_UPDATE_PLAY_STEP1, boss_hp_init=30)
CODE_STEP2 = _make_full_code(_UPDATE_PLAY_STEP2, boss_hp_init=30)
CODE_KADAI_A = _make_full_code(_UPDATE_PLAY_KADAI_A, boss_hp_init=50)
CODE_KADAI_B = _make_full_code(_UPDATE_PLAY_KADAI_B, boss_hp_init=30)
CODE_KADAI_C = _make_full_code(_UPDATE_PLAY_KADAI_C, boss_hp_init=30)


SPEC = Spec(
    page_id=5150,
    slug="game-23-shoot-boss",
    title="ボス戦を作ろう",
    intro_paragraphs=[
        '前回（記事㉒）で <strong>state["power"]</strong> を使った'
        '<strong>条件付きアビリティ</strong>を学び、'
        'プレイヤーが「一時的に強くなる」演出を作りました。'
        'シューティングらしさはぐっと増しましたが、'
        'やはりゲームとして締まりを出すには <strong>「最後に大物を倒す」</strong> という'
        '到達点が欲しいところです。',
        'この記事では、ステージ後半に <strong>大型のボス</strong> を出現させ、'
        '<strong>HP（耐久値）</strong>・<strong>HP バー</strong>・'
        '<strong>自律的な左右移動</strong>・'
        '<strong>下向きの弾</strong>でプレイヤーを攻撃する弾幕パターンを実装します。'
        'プレイヤーは弾を当ててボスの HP を削り、0 にすると <strong>"BOSS DOWN!"</strong> でステージクリア。',
        '新しい仕組みは 4 つあります。'
        '①<strong>出現タイミング</strong>（<code>state["frame"] &gt;= 600</code> でボスを 1 回だけ起動）、'
        '②<strong>HP と HP バー</strong>（<code>state["bhp"]</code> を 30 から 1 ずつ削る／'
        '<code>state["bhp"] * 480 // state["boss_hp_init"]</code> で割合バー）、'
        '③<strong>active フラグ</strong>（<code>state["boss_active"]</code> 0/1 で'
        '出現中か否かを管理）、'
        '④<strong>ボス弾</strong>（<code>state["bbxs"]/state["bbys"]</code> という別リストで'
        '下向きに飛ぶ弾を管理）。',
        'Step 1 で「ボスの出現 + HP 30 + 横移動 + プレイヤー弾でダメージ」までの最小実装。'
        'まだボスは反撃してこないので、'
        '<strong>"動く的"</strong> として落ち着いて動きを観察できます。'
        'Step 2 で <strong>60 フレームに 1 発の下向きボス弾</strong> を撃たせ、'
        'プレイヤーとの当たり判定を追加して、本物の "ボス戦" にします。',
        '課題では HP を 50 に増やす（A）、ボスがジグザグに動く（B）、'
        '<strong>3 way の弾幕</strong> を撃つ（C）と発展させ、'
        '次の記事㉔「シューティング完成版」へつなげます。',
    ],
    eyecatch_basename="eyecatch_game_22_boss",
    iframe_xml="game_22_step1_final.xml",
    learn_bullets=[
        '<code>state["frame"] &gt;= 600</code> + <code>state["boss_active"] == 0</code> '
        'の組み合わせで、<strong>1 回だけボスを起動</strong>させる出現パターン',
        '<code>state["bhp"]</code> を 1 ずつ削って 0 になったら <code>state["mode"] = "clear"</code>'
        '— ボス専用の<strong>耐久値ロジック</strong>',
        '<code>state["bhp"] * 480 // state["boss_hp_init"]</code> で <strong>割合 HP バー</strong> を描画する '
        '2 段重ねの矩形（背景の灰色 + 前景の赤）',
        '<code>state["bdx"]</code>（横移動速度）と画面端の符号反転による'
        '<strong>左右壁打ち式の自律移動</strong>',
        '<code>state["bbxs"]/state["bbys"]</code> という<strong>ボス専用の弾リスト</strong>を別管理し、'
        'プレイヤー弾と完全に分離する設計',
        '<code>state["bb_timer"] -= 1</code> + <code>if &lt;= 0: append(...)</code> + '
        '<code>= 60</code> リセットの<strong>定期発射タイマー</strong>パターン',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='ボス戦は、これまで作ってきた仕組みの「組み合わせ」と「拡張」で作れます。'
                '出現・耐久・移動・反撃という 4 つの軸を、state 辞書のキーで整理しましょう。',
    terms_table=[
        ("HP（ヒットポイント）",
         "ボスの耐久値。プレイヤー弾が当たるたびに 1 ずつ減り、"
         "0 になったらボスが倒れる",
         '<code>state["bhp"] = state["bhp"] - 1</code>'),
        ("HP バー（割合バー）",
         "現在 HP を 0〜1 の割合に変換して、"
         "矩形の幅で見せる UI。"
         "<code>bhp * 全体幅 // hp_init</code> で残量を可視化",
         '<code>pygame.draw.rect(screen, "#ff3232", (80, 100, state["bhp"] * 480 // state["boss_hp_init"], 12))</code>'),
        ("出現タイミング（spawn condition）",
         "「いつボスを出すか」を決める条件。"
         "今回は <code>state[\"frame\"] &gt;= 600</code>（10 秒経過）と "
         "<code>state[\"boss_active\"] == 0</code>（まだ出ていない）を AND",
         '<code>if state["frame"] &gt;= 600: if state["boss_active"] == 0: ...</code>'),
        ("active フラグ",
         "「いまボスが出ているか」を 0/1 で管理する変数。"
         "1 のとき移動・攻撃・当たり判定を有効化、"
         "0 のとき雑魚敵を湧かす",
         '<code>state["boss_active"] = 1</code>'),
        ("ボス弾（boss bullet）",
         "プレイヤー弾とは別管理の、ボスから下向きに飛ぶ弾。"
         "<code>bbxs</code>/<code>bbys</code> の専用リストで管理する",
         '<code>state["bbxs"].append(state["bx"] + 28)</code>'),
        ("発射タイマー（fire interval）",
         "「N フレームに 1 発撃つ」を実現するためのカウンタ。"
         "毎フレーム -1、0 を下回ったら発射 + 60 にリセット",
         '<code>state["bb_timer"] -= 1; if state["bb_timer"] &lt;= 0: ...; state["bb_timer"] = 60</code>'),
        ("クリア（clear）",
         "ボスを倒したときの終了状態。"
         '<code>state["mode"] = "clear"</code> にして、'
         '"BOSS DOWN!" 画面に遷移する',
         '<code>if state["bhp"] &lt;= 0: state["mode"] = "clear"</code>'),
    ],
    file_roles_h2="ファイル構成のおさらい（前回までの 5 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。'
         '<strong>変更点：</strong>'
         'ボス用に <code>state["bx"]</code>, <code>state["by"]</code>, '
         '<code>state["bhp"]</code>, <code>state["bdx"]</code>, '
         '<code>state["bdy"]</code>, <code>state["boss_active"]</code>, '
         '<code>state["bb_timer"]</code>, <code>state["boss_hp_init"]</code> '
         'を初期化。'
         'ボス弾用に <code>state["bbxs"] = []</code>, <code>state["bbys"] = []</code> も追加。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<strong>今回の主役のファイル</strong>。'
         '出現条件・ボスの自律移動・ボス弾の発射タイマー・'
         'プレイヤー弾とボスの衝突（HP 削り）・'
         'ボス弾とプレイヤーの衝突（ライフ減少）をすべてここで書きます。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<strong>変更点：</strong>'
         'ボス本体（紫の 64×64 矩形）、HP バー（背景の灰色 + 前景の赤の 2 段重ね）、'
         '"BOSS HP: ◯" のテキスト表示、'
         'ボス弾の描画ループ（ピンクの矩形）を追加。'),
        ("update_over.py",
         '<strong>ゲームオーバー / クリア画面の更新ロジック</strong>。'
         '<strong>変更点：</strong>'
         'リトライ時にボス関連の state（bx/by/bhp/bdx/bdy/boss_active/bb_timer）と '
         'ボス弾リスト（bbxs/bbys）をリセット。'),
        ("draw_over.py",
         '<strong>ゲーム終了画面の描画</strong>。'
         '<strong>変更点：</strong>'
         '<code>state["mode"] == "clear"</code> のときに <strong>"BOSS DOWN!"</strong> '
         '（黄色）を表示するように変更。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<strong>今回もこのファイルを編集しません</strong>。'
         '5 ファイル分割の恩恵で、ボスを足してもループ構造は無傷のままです。'),
    ],
    steps=[
        Step(
            title="ボスを出現させて、HP を削れるようにしよう",
            instructions=[
                '<code>game_funcs.py</code> を開いて、'
                'ボス関連の state を初期化します。'
                '<br>① <code>state["bbxs"] = []</code>, <code>state["bbys"] = []</code>（ボス弾リスト）'
                '<br>② <code>state["bx"] = 288</code>, <code>state["by"] = 40</code>（ボス座標）'
                '<br>③ <code>state["bhp"] = 30</code>, <code>state["boss_hp_init"] = 30</code>（HP と初期 HP）'
                '<br>④ <code>state["bdx"] = 2</code>, <code>state["bdy"] = 0</code>（移動速度）'
                '<br>⑤ <code>state["boss_active"] = 0</code>（最初は 0 = まだ出ていない）'
                '<br>⑥ <code>state["bb_timer"] = 60</code>（ボス弾発射タイマー、Step 2 で使う）',
                '<code>update_play.py</code> を開きます。'
                'まず <strong>frame の更新の直後</strong>に '
                '<code>if state["frame"] &gt;= 600:</code> ブロックを書き、'
                'その中で <code>if state["boss_active"] == 0:</code> 内に '
                '<code>state["boss_active"] = 1</code> + 座標と HP を初期化します。'
                'これで <strong>10 秒経過後に 1 度だけ</strong> ボスが起動します',
                'プレイヤー弾の更新の<strong>後</strong>に '
                '<code>if state["boss_active"] == 1:</code> ブロックを追加。'
                '中身は次の 3 セクション：'
                '<br>① <strong>横移動</strong>：<code>state["bx"] += state["bdx"]</code> + '
                '画面端で符号反転（<code>state["bdx"] = -state["bdx"]</code>）'
                '<br>② <strong>boss_hit を作る</strong>：'
                '<code>boss_hit = pygame.Rect(state["bx"], state["by"], 64, 64)</code>'
                '<br>③ <strong>プレイヤー弾ループ</strong>：'
                '<code>for j in range(0, len(bxs), 1):</code> 内で '
                '<code>bullet_hit.colliderect(boss_hit)</code> なら '
                '<code>state["bhp"] -= 1</code> + 弾を消す（<code>bys[j] = -100</code>）',
                '<strong>HP が 0 になったとき</strong>の処理を内側の if に入れる：'
                '<code>if state["bhp"] &lt;= 0: state["boss_active"] = 0; '
                'state["score"] += 500; state["mode"] = "clear"</code>',
                'ボスが出ているあいだは雑魚敵を新規スポーンさせないように、'
                '雑魚敵スポーンのコードを '
                '<code>if state["boss_active"] == 0:</code> でくるみます。'
                '既に画面に出ている敵はそのまま落下＆当たり判定します',
                '<code>draw_play.py</code> の最後に、ボスを描画するコードを追加します。'
                '<br>① <code>if state["boss_active"] == 1:</code>'
                '<br>② <code>pygame.draw.rect(screen, "#a050ff", (state["bx"], state["by"], 64, 64))</code>（紫のボス本体）'
                '<br>③ HP バー背景：'
                '<code>pygame.draw.rect(screen, "#444444", (80, 100, 480, 12))</code>'
                '<br>④ HP バー前景：'
                '<code>pygame.draw.rect(screen, "#ff3232", (80, 100, state["bhp"] * 480 // state["boss_hp_init"], 12))</code>'
                '<br>⑤ "BOSS HP: ◯" テキスト表示',
                '<code>update_over.py</code> のリトライ時のリセットに、'
                'ボス関連の state（bx/by/bhp/bdx/bdy/boss_active/bb_timer）と '
                'ボス弾リスト（bbxs/bbys）のリセットを追加します。'
                '<code>draw_over.py</code> の <code>state["mode"] == "clear"</code> 時を '
                '<strong>"BOSS DOWN!"</strong> （黄色）に書き換えます',
                '保存して実行。<strong>ゲーム開始から 10 秒たつと</strong>画面上部に紫のボスが現れて'
                '左右に往復し始めます。SPACE 連打で <strong>30 発当てれば撃破</strong>、'
                '"BOSS DOWN!" で勝利画面に遷移するはずです（まだボスは反撃してきません）',
            ],
            figure_basename="game_22_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点（ボス関連 state を初期化）：</strong>'
                                 '<code>state["bbxs"]</code>/<code>state["bbys"]</code>（リスト）と '
                                 '<code>state["bx"]</code>/<code>state["by"]</code>/<code>state["bhp"]</code>/'
                                 '<code>state["bdx"]</code>/<code>state["bdy"]</code>/<code>state["boss_active"]</code>/'
                                 '<code>state["bb_timer"]</code>/<code>state["boss_hp_init"]</code> を追加。',
                'update_play.py': '<strong>変更点：</strong>'
                                  '冒頭に出現条件、'
                                  '<code>if state["boss_active"] == 1:</code> 内にボス横移動 + '
                                  'プレイヤー弾との衝突 + HP 削り + クリア判定。'
                                  '雑魚敵スポーンを <code>if state["boss_active"] == 0:</code> でくるむ。',
                'draw_play.py': '<strong>変更点：</strong>'
                                '末尾に <code>if state["boss_active"] == 1:</code> でボス本体・HP バー・'
                                '"BOSS HP" テキストを描画。',
                'update_over.py': '<strong>変更点：</strong>'
                                  'リトライ時にボス関連 state と bbxs/bbys をリセット。',
                'draw_over.py': '<strong>変更点：</strong>'
                                '<code>state["mode"] == "clear"</code> のとき "BOSS DOWN!" を表示。',
                'main.py': '<strong>このファイルは触りません</strong>。',
            },
        ),
        Step(
            title="ボスに下向きの弾を撃たせよう",
            instructions=[
                'Step 1 では「動く的」を撃つだけでした。'
                'いよいよ <strong>ボスに反撃させて</strong> 本物のボス戦にします',
                '<code>update_play.py</code> の <code>if state["boss_active"] == 1:</code> 内に'
                '<strong>発射タイマー</strong>のコードを追加します。'
                '<br>① <code>state["bb_timer"] = state["bb_timer"] - 1</code>'
                '<br>② <code>if state["bb_timer"] &lt;= 0:</code>'
                '<br>　・<code>bbxs.append(state["bx"] + 28)</code>（ボスの中央 x）'
                '<br>　・<code>bbys.append(state["by"] + 64)</code>（ボスの足元）'
                '<br>　・<code>state["bb_timer"] = 60</code>（次の発射まで 1 秒）',
                'ボスの if ブロックの<strong>外側</strong>に、'
                'ボス弾の k ループを追加します。'
                '<br>① <code>for k in range(0, len(bbxs), 1):</code>'
                '<br>② <code>bbys[k] = bbys[k] + 5</code>（下向きにゆっくり落下）'
                '<br>③ 画面外チェック → <code>bbys[k] = -100</code>（消す）'
                '<br>④ <code>player_hit3.colliderect(bblt_hit)</code> でプレイヤー被弾'
                '<br>⑤ 当たったら <code>state["lives"] -= 1</code> + ボス弾を消す + '
                'ライフ 0 で <code>state["mode"] = "over"</code>',
                '<code>draw_play.py</code> のプレイヤー弾ループの<strong>後</strong>に、'
                'ボス弾の描画ループを追加します。'
                '<code>for k in range(0, len(bbxs), 1):</code> 内で '
                '<code>pygame.draw.rect(screen, "#ff64a0", (bbxs[k], bbys[k], 8, 16))</code>'
                '（ピンクの 8×16 矩形）。'
                '色を黄色（プレイヤー弾）と<strong>明確に区別</strong>するのが安全な UI 設計です',
                '保存して実行。10 秒たってボスが出現すると、'
                '<strong>1 秒に 1 発のペース</strong>でピンクの弾がプレイヤー側に降ってきます。'
                'よけながら撃ち返してください。'
                '本物のシューティングらしさが出てきたはずです',
                '▶ 動作確認：ボス弾がボスの足元から発射されて落下すること、'
                'プレイヤーに当たるとライフが減ること、'
                'ライフ 0 で GAME OVER になること、'
                'ボスを撃破すると <strong>"BOSS DOWN!"</strong> でクリアになることを観察しましょう',
            ],
            figure_basename="game_22_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'game_funcs.py': '<strong>このファイルは触りません</strong>。Step 1 と同じです。',
                'update_play.py': '<strong>変更点：</strong>'
                                  '<code>if state["boss_active"] == 1:</code> 内に発射タイマー追加。'
                                  'ボスの if 外にボス弾 k ループを追加（落下 + プレイヤー衝突）。',
                'draw_play.py': '<strong>変更点：</strong>'
                                'プレイヤー弾ループの後に <code>for k</code> でボス弾描画ループを追加。',
                'update_over.py': '<strong>このファイルは触りません</strong>。Step 1 と同じです。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="5-23-1",
            title="ボス HP を 50 にして耐久を上げよう",
            lead='Step 2 のボス HP を <strong>50</strong> に増やすバランス調整課題です。'
                 '<strong>変更場所は <code>game_funcs.py</code> と <code>update_play.py</code> '
                 'の出現時、それと <code>update_over.py</code> のリトライ時の 3 か所</strong>。'
                 'HP バーは割合表示なので、初期 HP が変わっても見た目は同じ「右端まで」になります。',
            figure_basename="game_22_a_high_hp",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>game_funcs.py</code> の '
                        '<code>state["bhp"] = 30</code> と <code>state["boss_hp_init"] = 30</code> を '
                        '両方とも <code>50</code> に。'
                        '<code>update_play.py</code> のボス出現時の '
                        '<code>state["bhp"] = 30</code> も <code>50</code> に。'
                        '<code>update_over.py</code> のリトライ時のリセットも同じく <code>50</code> に。'
                        'HP バーの計算式 <code>bhp * 480 // boss_hp_init</code> は'
                        '<strong>割合計算なので変更不要</strong>です。'
                        '50 発当てる必要があるので、ボス弾を避けながらの長期戦になります。',
        ),
        Kadai(
            number="5-23-2",
            title="ボスをジグザグに動かそう",
            lead='Step 2 のボスは横にしか動きませんでした。'
                 '<strong>縦の上下動</strong> を追加して、'
                 'プレイヤーから狙いにくくしましょう。'
                 '<code>state["bdy"]</code>（縦速度）を有効化して、'
                 '上下の壁で符号反転させます。',
            figure_basename="game_22_b_zigzag",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='ボス出現時に <code>state["bdy"] = 1</code>（下向き 1）にセット。'
                        '横移動の直後に <code>state["by"] += state["bdy"]</code> を追加し、'
                        '<code>state["by"] &lt; 24</code> または '
                        '<code>state["by"] &gt; 120</code> で '
                        '<code>state["bdy"] = -state["bdy"]</code>（符号反転）。'
                        'ボスが上下のレーンを行ったり来たりするので、'
                        'プレイヤーは横位置だけでなく <strong>「いつ撃つか」</strong> も考える必要が出てきます。',
        ),
        Kadai(
            number="5-23-3",
            title="ボスに 3 way 弾幕を撃たせよう",
            lead='Step 2 では 1 発ずつだったボス弾を、'
                 '<strong>3 way（中央 + 左右）</strong> に拡張しましょう。'
                 '<code>append</code> セットを <strong>3 つ</strong> 並べるだけです。'
                 '弾は全部下に落ちるので、x をずらすだけで扇のような弾幕になります。',
            figure_basename="game_22_c_three_shot",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='<code>state["bb_timer"] &lt;= 0:</code> 内の '
                        '<code>append</code> セットを 3 つに増やすだけ。'
                        'x オフセットは <code>+28 / +8 / +48</code>（中央と左右）、'
                        'y オフセットは <code>+64 / +56 / +56</code>（少し斜め下から発射しているように見せる）。'
                        '弾は全部 <code>bbys[k] += 5</code> で真下に落ちるので、'
                        '本当の意味で扇状ではありませんが、<strong>「3 本の平行弾幕」</strong>'
                        'という見た目になり、回避難度が一気に上がります。'
                        'ボスらしい <strong>「弾幕シューティング」</strong> の最初の一歩です。',
        ),
    ],
    summary_bullets=[
        '<code>state["boss_active"]</code> という <strong>0/1 フラグ</strong> 1 つで、'
        '「いまボスが出ているか」「雑魚敵を湧かすか」を'
        'すべてのループで一貫して切り替えられる',
        '<code>state["bhp"]</code> を 1 ずつ削るだけで <strong>耐久値ロジック</strong> が完成。'
        'HP バーは <code>bhp * 全体幅 // hp_init</code> の<strong>割合計算</strong>で'
        '初期 HP が変わっても自動で正しく描画される',
        '<code>state["bbxs"]</code>/<code>state["bbys"]</code> という<strong>ボス専用の弾リスト</strong>を'
        'プレイヤー弾と分離することで、色・速度・当たり相手を別々に管理できる',
        '<code>state["bb_timer"] -= 1</code> + <code>append + リセット</code> の'
        '<strong>定期発射タイマー</strong>パターンは、'
        'アイテム湧き・敵スポーン・ボス弾・自機ショット連射と'
        '<strong>すべて同じ 3 行のレシピ</strong>で書ける',
        'ボス戦は新しい仕組みではなく、これまでの <strong>「リスト」「タイマー」「colliderect」「state フラグ」</strong> '
        'の組み合わせと拡張で作れる — 増えたのはたった 30 行の update_play 拡張だけ',
    ],
    next_article_id=5152,
    next_article_title='【Pygameでゲーム㉔】シューティング完成版',
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
                  title="【Pygameでゲーム㉓】ボス戦を作ろう")
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
