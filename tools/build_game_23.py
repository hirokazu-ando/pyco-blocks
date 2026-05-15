#!/usr/bin/env python3
"""WP 記事 5152 (Pygame㉔ シューティング完成版) の本文を組み立てて反映する。

新㉔は ⑲〜㉓ で積み上げた 5 ファイル分割 + state 辞書のシューティングを
最終形に統合する記事。Step 1 では "play / over / clear" の 3 状態に
items + power-up + boss + 3 way conditional shot をすべて統合した
完成版を提示し、Step 2 でタイトル画面を追加して
"title / play / over / clear" の 4 状態マシンに発展させる。

課題は完成版へのアレンジ提案：
  A — espeed の上昇が 2 倍速く立ち上がる（frame // 150）
  B — power 中はキル得点が 30 点に増えるボーナス（kill_score_power=30）
  C — 撃破後に第 2 ボスが HP 60 で再戦（boss_hp=60 + zigzag + 3 way）

--push で WP に反映する。
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
    "eyecatch_game-5-24_complete.png"
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
pygame.display.set_caption("{title}")
clock = pygame.time.Clock()
state = {{"mode": "{mode_init}", "px": 296, "py": 176}}
state["exs"] = []
state["eys"] = []
state["bxs"] = []
state["bys"] = []
state["bbxs"] = []
state["bbys"] = []
state["ixs"] = []
state["iys"] = []
state["spawn_timer"] = 0
state["item_timer"] = random.randint(240, 360)
state["power"] = 0
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
    if state["power"] > 0:
        pygame.draw.rect(screen, "#ffeb3b", (state["px"] - 4, state["py"] - 4, 56, 56), 2)
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("Score: " + str(state["score"]), True, "#ffffff"), (10, 10))
    if state["lives"] >= 1:
        pygame.draw.rect(screen, "#ff3232", (480, 12, 24, 24))
    if state["lives"] >= 2:
        pygame.draw.rect(screen, "#ff3232", (520, 12, 24, 24))
    if state["lives"] >= 3:
        pygame.draw.rect(screen, "#ff3232", (560, 12, 24, 24))
    _f = pygame.font.SysFont(None, 24)
    if state["power"] > 0:
        screen.blit(_f.render("POWER: " + str(state["power"] // 60 + 1), True, "#ffeb3b"), (10, 40))
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
    ixs = state["ixs"]
    iys = state["iys"]
    for m in range(0, len(ixs), 1):
        pygame.draw.rect(screen, "#22ee99", (ixs[m], iys[m], 16, 16))
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
import random

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "{next_mode}"
        state["px"] = 296
        state["py"] = 176
        state["exs"] = []
        state["eys"] = []
        state["bxs"] = []
        state["bys"] = []
        state["bbxs"] = []
        state["bbys"] = []
        state["ixs"] = []
        state["iys"] = []
        state["spawn_timer"] = 0
        state["item_timer"] = random.randint(240, 360)
        state["power"] = 0
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

_DRAW_OVER_SIMPLE = '''\
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
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Press ENTER", True, "#88ff88"), (220, 310))
'''

_DRAW_OVER_WITH_TITLE = '''\
# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    if state["mode"] == "title":
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("Shooter Complete", True, "#ffeb3b"), (140, 130))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render("Press ENTER to start", True, "#ffffff"), (180, 220))
    if state["mode"] == "clear":
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("BOSS DOWN!", True, "#ffeb3b"), (200, 130))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render("Final Score: " + str(state["score"]), True, "#ffffff"), (180, 220))
        _f = pygame.font.SysFont(None, 24)
        screen.blit(_f.render("Press ENTER", True, "#88ff88"), (220, 310))
    if state["mode"] == "over":
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 150))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render("Final Score: " + str(state["score"]), True, "#ffffff"), (180, 220))
        _f = pygame.font.SysFont(None, 24)
        screen.blit(_f.render("Press ENTER", True, "#88ff88"), (220, 310))
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


def _make_full_code(
    update_play_body: str,
    *,
    boss_hp_init: int = 30,
    mode_init: str = "play",
    title: str = "Shooter Complete",
    next_mode: str = "play",
    with_title: bool = False,
) -> str:
    """update_play.py 本体を差し込んで 5 ファイル全体を組み立てる。"""
    return (
        _FUNCS_TEMPLATE.format(
            boss_hp_init=boss_hp_init,
            mode_init=mode_init,
            title=title,
        )
        + '\n\n'
        + update_play_body
        + '\n\n'
        + _DRAW_PLAY
        + '\n\n'
        + _UPDATE_OVER_TEMPLATE.format(
            boss_hp_init=boss_hp_init,
            next_mode=next_mode,
        )
        + '\n\n'
        + (_DRAW_OVER_WITH_TITLE if with_title else _DRAW_OVER_SIMPLE)
        + '\n\n'
        + _MAIN
    )


def _update_play_body(
    *,
    kill_score_normal: int = 10,
    kill_score_power: int = 10,
    espeed_div: int = 300,
    boss_hp: int = 30,
    fire_mode: str = "single",
    zigzag: bool = False,
) -> str:
    """update_play.py 本体を組み立てる（items + power + boss + 3 way conditional）。"""
    if fire_mode == "three":
        bb_fire = (
            '            bbxs.append(state["bx"] + 28); bbys.append(state["by"] + 64)\n'
            '            bbxs.append(state["bx"] + 8);  bbys.append(state["by"] + 56)\n'
            '            bbxs.append(state["bx"] + 48); bbys.append(state["by"] + 56)\n'
        )
    else:
        bb_fire = (
            '            bbxs.append(state["bx"] + 28)\n'
            '            bbys.append(state["by"] + 64)\n'
        )
    zigzag_init = ''
    zigzag_move = ''
    if zigzag:
        zigzag_init = '            state["bdy"] = 1\n'
        zigzag_move = (
            '        state["by"] = state["by"] + state["bdy"]\n'
            '        if state["by"] < 24:\n'
            '            state["by"] = 24\n'
            '            state["bdy"] = -state["bdy"]\n'
            '        if state["by"] > 120:\n'
            '            state["by"] = 120\n'
            '            state["bdy"] = -state["bdy"]\n'
        )
    return f'''\
# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    state["frame"] = state["frame"] + 1
    state["espeed"] = 3 + state["frame"] // {espeed_div}
    if state["power"] > 0:
        state["power"] = state["power"] - 1
    if state["frame"] >= 600:
        if state["boss_active"] == 0:
            state["boss_active"] = 1
            state["bx"] = 288
            state["by"] = 40
            state["bhp"] = {boss_hp}
{zigzag_init}    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
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
            bxs.append(state["px"] + 4);  bys.append(state["py"] + 4)
            bxs.append(state["px"] + 36); bys.append(state["py"] + 4)
        else:
            bxs.append(state["px"] + 20)
            bys.append(state["py"])
    for j in range(0, len(bxs), 1):
        bys[j] = bys[j] - 8
    bbxs = state["bbxs"]
    bbys = state["bbys"]
    if state["boss_active"] == 1:
        state["bx"] = state["bx"] + state["bdx"]
{zigzag_move}        if state["bx"] < 0:
            state["bx"] = 0
            state["bdx"] = -state["bdx"]
        if state["bx"] > 576:
            state["bx"] = 576
            state["bdx"] = -state["bdx"]
        state["bb_timer"] = state["bb_timer"] - 1
        if state["bb_timer"] <= 0:
{bb_fire}            state["bb_timer"] = 60
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
    ixs = state["ixs"]
    iys = state["iys"]
    state["item_timer"] = state["item_timer"] - 1
    if state["item_timer"] <= 0:
        ixs.append(random.randint(0, 624))
        iys.append(-16)
        state["item_timer"] = random.randint(240, 360)
    for m in range(0, len(ixs), 1):
        iys[m] = iys[m] + 2
        if iys[m] > 400:
            iys[m] = -1000
        player_hit2 = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
        item_hit = pygame.Rect(ixs[m], iys[m], 16, 16)
        if player_hit2.colliderect(item_hit):
            state["power"] = 300
            iys[m] = -1000
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
                if state["power"] > 0:
                    state["score"] = state["score"] + {kill_score_power}
                else:
                    state["score"] = state["score"] + {kill_score_normal}
                bys[j] = -100
'''


# Step 1 — 完成版（mode='play' で起動。クリア / オーバー後は ENTER で play へ）
CODE_STEP1 = _make_full_code(
    _update_play_body(),
    boss_hp_init=30,
    mode_init="play",
    title="Shooter Complete",
    next_mode="play",
    with_title=False,
)

# Step 2 — タイトル画面追加（mode='title' で起動。クリア / オーバー後は title へ戻る）
CODE_STEP2 = _make_full_code(
    _update_play_body(),
    boss_hp_init=30,
    mode_init="title",
    title="Shooter Complete",
    next_mode="title",
    with_title=True,
)

# 課題A 5-24-1 fast_ramp — espeed の上昇が 2 倍速い (frame // 150)
CODE_KADAI_A = _make_full_code(
    _update_play_body(espeed_div=150),
    boss_hp_init=30,
    mode_init="title",
    title="Shooter Complete",
    next_mode="title",
    with_title=True,
)

# 課題B 5-24-2 score_boost — power 中はキル得点が 30
CODE_KADAI_B = _make_full_code(
    _update_play_body(kill_score_power=30),
    boss_hp_init=30,
    mode_init="title",
    title="Shooter Complete",
    next_mode="title",
    with_title=True,
)

# 課題C 5-24-3 boss_rematch — 第 2 ボス HP 60 + zigzag + 3 way
CODE_KADAI_C = _make_full_code(
    _update_play_body(boss_hp=60, fire_mode="three", zigzag=True),
    boss_hp_init=60,
    mode_init="title",
    title="Shooter Complete",
    next_mode="title",
    with_title=True,
)


SPEC = Spec(
    page_id=5152,
    slug="game-24-shoot-complete",
    title="シューティング完成版",
    intro_paragraphs=[
        '⑲ で弾の発射、⑳ で弾と敵の衝突、㉑ で敵の出現パターン、㉒ で'
        'パワーアップアイテム、そして㉓でボス戦と HP バーまでを学んできました。'
        '個別の機能は揃ったので、いよいよ <strong>シューティングを 1 本のゲームとして完成</strong> させます。',
        'Step 1 では、これまでのすべての機能を <strong>1 つの完成版</strong> に統合します。'
        'ボスが出るまでのザコ撃ち（⑳ +㉑）、パワーアップで一時的に 3 way 化（㉒）、'
        '10 秒経過でボス出現と HP バー（㉓）、ボスを倒したら "BOSS DOWN!"、'
        'ライフが尽きたら "GAME OVER" の <strong>3 状態マシン</strong>（play / clear / over）が動きます。',
        'Step 2 では <strong>タイトル画面</strong> を足して <strong>4 状態マシン</strong>（title / play / clear / over）に発展させます。'
        'ゲーム起動直後にタイトルが出て、ENTER でプレイ開始、'
        'クリアやゲームオーバー後はタイトルに戻ってもう一度遊べる ─ '
        '配布できる<strong>「ちゃんと完結したゲーム」</strong> の形になります。',
        'ここで重要なのは、<strong>5 ファイル分割の恩恵</strong>です。'
        'タイトル画面を加えても、変更するのは <code>game_funcs.py</code> の '
        '<code>state["mode"] = "title"</code> と、<code>draw_over.py</code> の'
        '画面分岐、それに <code>update_over.py</code> のリトライ先のたった 3 か所だけ。'
        '<code>update_play.py</code> はノータッチで、状態の追加にスムーズに対応できます。',
        '課題では「<strong>難易度を上げる</strong>（A：敵が 2 倍速く強くなる）」'
        '「<strong>得点バランスを変える</strong>（B：パワーアップ中はキル得点 3 倍）」'
        '「<strong>第 2 ボス</strong>（C：HP 60 + ジグザグ + 3 way 弾幕で再戦）」と'
        'ゲームバランスのアレンジに挑戦して、Part 5（2D シューティング編）を完結させます。'
        '次の㉕からはついに Part 6 — <strong>ジャンプと重力</strong> の世界へ進みます。',
    ],
    eyecatch_basename="eyecatch_game_23_complete",
    iframe_xml="game_23_step1_final.xml",
    learn_bullets=[
        '<code>state["mode"]</code> に <strong>"play" / "over" / "clear"</strong> の'
        '3 値を持たせ、<code>main.py</code> 1 か所の if/else で<strong>処理を分岐</strong>させる',
        'タイトル画面を追加して <strong>4 状態マシン</strong>（title / play / clear / over）に発展させる方法',
        '<code>update_over.py</code> のリトライ時のリセット先を <strong>"play"</strong> から'
        '<strong>"title"</strong> に変えるだけで、タイトルへ戻るループ構造に切り替えられること',
        '<code>state["mode"]</code> による <code>draw_over.py</code> 内の'
        '<strong>3 分岐描画</strong>（タイトル / クリア / オーバー）の書き方',
        '5 ファイル分割の恩恵 ─ 状態追加（title）に対して<strong>触るファイルが 3 つだけ</strong>に抑えられる設計',
        '<strong>項目別タイマー</strong>（spawn_timer / item_timer / bb_timer / power）が同じ'
        '<strong>「-1 + 0 で発火 + リセット」</strong>のレシピで完全に統一されていること',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='完成版で使うキーワードと、これまで学んだ仕組みの組み合わせ方を確認しましょう。'
                '新しい仕組みは「タイトル画面」と「4 状態マシン」だけです。',
    terms_table=[
        ("4 状態 mode マシン",
         "<code>state[\"mode\"]</code> に title / play / clear / over の 4 値を持たせる。"
         "<code>main.py</code> は \"play\" 以外をすべて update_over + draw_over に流す",
         '<code>state["mode"] = "title"</code> / <code>"play"</code> / <code>"clear"</code> / <code>"over"</code>'),
        ("update_play の責務",
         "プレイ中（mode == \"play\"）の毎フレーム更新だけを担当する。"
         "title / clear / over の処理は<strong>一切ここに書かない</strong>",
         '5 ファイル分割の境界。<code>update_play(state)</code> は <code>mode == "play"</code> でのみ呼ばれる'),
        ("更新順序（フレームごと）",
         "①プレイヤー操作 → ②自機弾 → ③ボス + ボス弾 → ④アイテム + power 取得 → ⑤雑魚敵 + 衝突。"
         "順序を守ると衝突判定の取りこぼしや変数依存のズレが起きにくい",
         '<code>update_play()</code> 内のセクション順で表現'),
        ("状態フラグ分岐（draw_over）",
         "<code>draw_over.py</code> 内で <code>if state[\"mode\"] == \"...\":</code> を 3 つ並べて、"
         "title / clear / over の<strong>表示文字列を切り替える</strong>",
         '<code>if state["mode"] == "title":</code> / <code>"clear":</code> / <code>"over":</code>'),
        ("タイトル画面（title）",
         "ゲーム起動直後に表示する <strong>受付画面</strong>。"
         "ENTER で <code>state[\"mode\"] = \"play\"</code> に切り替えて本編へ進む",
         '<code>state["mode"] = "title"</code> 起動 + <code>update_over</code> で ENTER → "play"'),
        ("リトライ遷移先（next_mode）",
         "<code>update_over.py</code> でリトライしたあと、どの mode に戻すか。"
         "Step 1 では \"play\"、Step 2 では \"title\" にする",
         '<code>state["mode"] = "play"</code> / <code>state["mode"] = "title"</code>'),
        ("単一 update_over（共通リトライ）",
         "title / clear / over いずれの状態でも ENTER で完全リセットする"
         "<strong>1 つの関数</strong>。状態ごとに別関数を作らないのがコツ",
         '<code>def update_over(state):</code> 1 つで 3 状態を受け持つ'),
    ],
    file_roles_h2="ファイル構成のおさらい（5 ファイル分割の最終形）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。'
         '<strong>変更点：</strong>'
         'Step 2 では <code>state["mode"] = "title"</code> で起動するように変更。'
         'それ以外（リスト・カウンタ・座標など）は㉓と完全に同じ。'),
        ("update_play.py",
         '<strong>プレイ中（mode == "play"）の毎フレーム更新</strong>。'
         '<strong>変更点：</strong> ありません。⑲〜㉓で積み上げた'
         '「自機 + 弾 + 敵スポーン + アイテム + power 中 3 way + ボス + ボス弾」を'
         'そのまま統合した完成形をここに置きます。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<strong>変更点：</strong> ありません。'
         '自機（power 中は黄色のオーラ）+ HUD + リスト 4 つ + ボス + HP バーを'
         '描画する完成形のまま使います。'),
        ("update_over.py",
         '<strong>"play" 以外（title / clear / over）の毎フレーム更新</strong>。'
         '<strong>変更点：</strong> Step 2 ではリトライ時の <code>state["mode"]</code> を '
         '<code>"play"</code> から <strong><code>"title"</code></strong> に変えるだけ。'),
        ("draw_over.py",
         '<strong>"play" 以外の描画</strong>。'
         '<strong>変更点：</strong> Step 2 では <code>if state["mode"] == "title":</code> '
         'の分岐を追加して <strong>"Shooter Complete" + Press ENTER to start"</strong> を表示。'
         'clear / over の分岐は㉓のまま。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<strong>このファイルは触りません</strong>。'
         '<code>if state["mode"] == "play":</code> 1 つで'
         '4 状態マシン（title / play / clear / over）を捌けます。'),
    ],
    steps=[
        Step(
            title="シューティングを 1 本に統合しよう（3 状態マシン）",
            instructions=[
                '⑲〜㉓ で書いた 5 ファイルをそのまま受け継いで、'
                '<strong>1 つのゲーム</strong>に統合します。'
                'まずは <code>state["mode"]</code> に '
                '<strong>"play" / "over" / "clear"</strong> の 3 値を持つ起動形から始めます',
                '<code>game_funcs.py</code> を確認します。'
                'リスト 4 つ（exs/eys, bxs/bys, bbxs/bbys, ixs/iys）、'
                '4 つのタイマー（spawn_timer / item_timer / bb_timer / power）、'
                'ボス state（bx/by/bhp/bdx/bdy/boss_active/boss_hp_init）、'
                'プレイヤー state（px/py/lives/score/frame/espeed）— '
                '㉓と同じ初期化セットになっていることを確認しましょう',
                '<code>update_play.py</code> は <strong>5 つのセクション</strong>から成ります。'
                '<br>① <strong>frame と power 減衰</strong>（毎フレーム）'
                '<br>② <strong>ボス起動条件</strong>（frame &gt;= 600 で 1 回だけ）'
                '<br>③ <strong>プレイヤー操作 + 弾発射</strong>（power 中は 3 way）'
                '<br>④ <strong>ボス + ボス弾</strong>（HP 削り / 落下 / 衝突）'
                '<br>⑤ <strong>アイテム + 雑魚敵 + 衝突 + 得点</strong>',
                '<code>draw_play.py</code> は <strong>すべてのリストを描画</strong>します。'
                '自機（power 中は黄色いオーラを矩形の枠で表示）、'
                'スコア・ライフ・POWER の HUD、'
                '雑魚敵リスト、自機弾リスト、ボス弾リスト、アイテムリスト、'
                'そしてボス本体と HP バーを順番に描きます',
                '<code>update_over.py</code> は ENTER でゲームを完全リセット。'
                'リスト 4 つを空に、タイマー 4 つをリセット、'
                '<code>state["mode"] = "play"</code> でプレイ画面へ戻します',
                '<code>draw_over.py</code> は <code>state["mode"]</code> によって'
                '<strong>「BOSS DOWN!」/ 「GAME OVER」</strong> を出し分けます',
                '<code>main.py</code> は <code>if state["mode"] == "play":</code> 1 つで'
                'update_play + draw_play を呼び、それ以外は update_over + draw_over に流す',
                '保存して実行。<strong>序盤は雑魚敵を撃って</strong>、'
                'ときどき出るアイテムで一時的に 3 way、'
                '10 秒経つとボスが出てきて HP を削り、'
                '撃破すれば <strong>"BOSS DOWN!"</strong>、'
                'ライフが尽きれば <strong>"GAME OVER"</strong>。'
                'これで完成版の動作確認は OK です',
            ],
            figure_basename="game_23_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong> なし。'
                                 '⑲〜㉓ で積み上げた state 初期化セットがそのまま揃っています。',
                'update_play.py': '<strong>変更点：</strong> なし。'
                                  'frame / power 減衰 → ボス起動 → 自機弾（条件付き 3 way）→ '
                                  'ボス + ボス弾 → アイテム → 雑魚敵 + 衝突の 5 セクションを統合。',
                'draw_play.py': '<strong>変更点：</strong> なし。'
                                'リスト 4 種 + 自機（オーラ枠）+ HUD + ボス + HP バーを描画。',
                'update_over.py': '<strong>変更点：</strong> なし。'
                                  '4 リスト・4 タイマー・ボス state・プレイヤー state を完全リセット。',
                'draw_over.py': '<strong>変更点：</strong> なし。'
                                'mode==\"clear\" で "BOSS DOWN!"、それ以外で "GAME OVER" を表示。',
                'main.py': '<strong>このファイルは触りません</strong>。'
                           '<code>if state["mode"] == "play":</code> の 2 分岐で完結。',
            },
        ),
        Step(
            title="タイトル画面を追加して 4 状態マシンにしよう",
            instructions=[
                'Step 1 はゲーム起動直後にいきなり遊び始める形でした。'
                'いよいよ <strong>"タイトル → プレイ → クリア / オーバー → タイトルに戻る"</strong> という'
                '<strong>4 状態マシン</strong> に発展させて、配布できる完成形に仕上げます',
                '<code>game_funcs.py</code> の <code>state = {"mode": "play", ...}</code> を'
                '<strong><code>state = {"mode": "title", ...}</code></strong> に変更します。'
                'これだけで「ゲーム起動直後はタイトル画面」になります（main の if が "play" 以外を update_over に流すため）',
                '<code>update_over.py</code> のリトライ処理を見直します。'
                'ENTER 押下時の <code>state["mode"] = "play"</code> はそのままで OK ですが、'
                'リセット先を <strong><code>state["mode"] = "title"</code></strong> にすると'
                '<strong>クリア / オーバー後にタイトルへ戻る</strong> 形にもできます。'
                '今回は ENTER ですぐプレイに入りたいので '
                '<strong><code>state["mode"] = "title"</code></strong> ではなく、'
                '<strong>そのまま <code>"play"</code></strong> でも構いません。'
                '<br>※ 本記事では「タイトル → ENTER → play → クリア → ENTER → タイトル」の流れにしたいので、'
                'リトライ先を <code>"play"</code> ではなく <strong><code>"title"</code></strong> に変えます。'
                'こうすると、起動直後とリトライ後の状態が同じ「タイトル画面」に揃って'
                '<strong>分かりやすいループ</strong> になります',
                '<code>draw_over.py</code> に <strong>3 分岐</strong>を書きます。'
                '<br>① <code>if state["mode"] == "title":</code>'
                '<br>　・"Shooter Complete" + "Press ENTER to start" を表示'
                '<br>② <code>if state["mode"] == "clear":</code>'
                '<br>　・"BOSS DOWN!" + Final Score + "Press ENTER" を表示'
                '<br>③ <code>if state["mode"] == "over":</code>'
                '<br>　・"GAME OVER" + Final Score + "Press ENTER" を表示',
                '<code>main.py</code> は <strong>1 文字も書き換えません</strong>。'
                '<code>if state["mode"] == "play":</code> 1 つで、'
                'タイトル画面（"title"）もクリア画面（"clear"）もオーバー画面（"over"）も'
                'すべて update_over + draw_over に流れます。'
                'これが <strong>4 状態マシン</strong> の威力です',
                '保存して実行。<strong>起動直後はタイトル</strong>（"Shooter Complete"）、'
                'ENTER でプレイ開始、ボス撃破で "BOSS DOWN!"、ライフ 0 で "GAME OVER"、'
                '再度 ENTER でタイトルへ戻り、また ENTER でプレイ。'
                '<strong>無限に遊べる完成版</strong>になりました',
                '▶ 動作確認：タイトル → ENTER → プレイ → クリア → ENTER → タイトル → ENTER → プレイの'
                'ループが破綻なく回ること、'
                'リスト・タイマー・ボス state・プレイヤー state が毎回正しく初期化されることを確認しましょう',
            ],
            figure_basename="game_23_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>'
                                 '<code>state = {"mode": "play", ...}</code> を '
                                 '<code>state = {"mode": "title", ...}</code> に変えるだけ。',
                'update_play.py': '<strong>このファイルは触りません</strong>。Step 1 と完全に同じ。'
                                  'プレイ中の処理は title 状態追加の影響を受けません。',
                'draw_play.py': '<strong>このファイルも触りません</strong>。',
                'update_over.py': '<strong>変更点：</strong>'
                                  'リトライ時のリセット先を '
                                  '<code>state["mode"] = "play"</code> から '
                                  '<code>state["mode"] = "title"</code> に変更。',
                'draw_over.py': '<strong>変更点：</strong>'
                                '<code>if state["mode"] == "title":</code> の分岐を追加して'
                                '"Shooter Complete" + "Press ENTER to start" を表示。'
                                'clear / over の分岐はそのまま。',
                'main.py': '<strong>このファイルは触りません</strong>。'
                           '<code>if state["mode"] == "play":</code> 1 行で 4 状態を捌く。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="5-24-1",
            title="難易度の立ち上がりを 2 倍速くしよう",
            lead='Step 2 の <code>update_play.py</code> 内の '
                 '<code>state["espeed"] = 3 + state["frame"] // 300</code> を'
                 '<strong><code>// 150</code></strong> に変えるだけ。'
                 '雑魚敵の落下速度がより速く立ち上がるので、'
                 'ボスが出るまでの 10 秒間がより緊張感のある立ち上がりになります。',
            figure_basename="game_23_a_fast_ramp",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='<code>state["frame"] // 300</code> は'
                        '<strong>5 秒に 1 段</strong>の速度上昇でしたが、'
                        '<code>// 150</code> にすると <strong>2.5 秒に 1 段</strong> の'
                        '2 倍ペースになります。'
                        'ボス出現の 10 秒時点で espeed が 7 まで上がるので、'
                        '雑魚敵の落下が体感で目に見えて速く感じられます。'
                        'プレイヤーが慣れてきたら <code>// 100</code>（3 倍）に挑戦してみるのも面白いです。',
        ),
        Kadai(
            number="5-24-2",
            title="パワーアップ中はキル得点を 3 倍にしよう",
            lead='Step 2 の <code>update_play.py</code> 内の'
                 '雑魚敵キル時の得点処理を、'
                 '<strong>パワーアップ中なら 30 点</strong>、通常時は 10 点に変更しましょう。'
                 'バランス調整によって、アイテムを取るタイミングが戦略の鍵になります。',
            figure_basename="game_23_b_score_boost",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>if state["power"] &gt; 0:</code> 分岐の中で '
                        '<code>state["score"] += 30</code>、'
                        'else で <code>state["score"] += 10</code> にする。'
                        'プレイヤーは「アイテムを取った直後にどれだけ撃ち込めるか」を'
                        '考えるようになり、戦略性が一気に増します。'
                        'スコアアタック性が出るので、'
                        '友達と "5 分間で何点取れるか" を競い合うのも楽しいです。',
        ),
        Kadai(
            number="5-24-3",
            title="第 2 ボス（HP 60・ジグザグ・3 way）と再戦しよう",
            lead='ボスを倒したあと、すぐに第 2 ボスが現れる<strong>連戦モード</strong>に挑戦します。'
                 '<code>state["bhp"] = 30</code> を <strong>60</strong> に倍増、'
                 '出現時に <code>state["bdy"] = 1</code> を加えてジグザグ移動、'
                 '弾を <strong>3 way</strong> で撃つようにすると、'
                 '本格的な弾幕シューティングになります。',
            figure_basename="game_23_c_boss_rematch",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='HP 倍増（30 → 60）に加えて、'
                        '<code>state["bdy"] = 1</code> で縦移動を有効化、'
                        '<code>append</code> セットを 3 つに増やして 3 way 弾幕にします。'
                        '壁打ち反転を縦軸にも追加（<code>state["by"] &lt; 24</code> / '
                        '<code>state["by"] &gt; 120</code>）するのを忘れずに。'
                        '本来の連戦モードにする場合は、<code>state["mode"] = "clear"</code> を'
                        '<code>"clear"</code> ではなく <code>"play"</code> のままにして、'
                        '<code>state["frame"] = 0</code> + <code>state["boss_hp_init"] = 60</code> + '
                        '<code>state["bhp"] = 60</code> を再セットします。'
                        '本記事では XML で「初手 HP 60 + ジグザグ + 3 way」の'
                        '<strong>強化ボス</strong> から戦う形を提示しています。',
        ),
    ],
    summary_bullets=[
        '<code>state["mode"]</code> に title / play / clear / over の 4 値を持たせる'
        '<strong>状態マシン設計</strong> で、ゲームの全体構造が main.py の 1 つの if/else に集約される',
        '5 ファイル分割の威力 ─ <strong>タイトル画面の追加で触るファイルは 3 つだけ</strong>'
        '（game_funcs / update_over / draw_over）。'
        'update_play / draw_play / main は完全に無影響',
        '⑲〜㉓ の機能（弾・敵スポーン・アイテム・条件付き 3 way・ボス・ボス弾・HP バー）が'
        '<strong>1 つの update_play に 5 セクションで統合</strong>でき、'
        '責務分離が崩れない',
        '<strong>「-1 + 0 で発火 + リセット」のタイマーレシピ</strong>が '
        'spawn_timer / item_timer / bb_timer / power の 4 つで完全に統一されている',
        '次の Part 6 では <strong>ジャンプと重力</strong> ─ プレイヤーが上下に動く'
        '<strong>アクション系</strong> の世界へ進みます。'
        '本記事までで完成した state 辞書 + 5 ファイル分割の枠組みは、ジャンルが変わっても'
        'そのまま使い回せます',
    ],
    next_article_id=5154,
    next_article_title='【Pygameでゲーム㉕】ジャンプと重力',
    cache_buster="20260509g",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム㉔】シューティング完成版")
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
