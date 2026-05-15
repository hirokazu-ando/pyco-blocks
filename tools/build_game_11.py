#!/usr/bin/env python3
"""WP 記事 4072 (Pygame⑫ 当たり判定を作ろう) の本文を組み立てて反映する。

新⑪（モジュール分割）で確立した state 辞書 + 5 ファイル分割の枠組みに、
pygame.Rect / Rect.colliderect の当たり判定を載せる。
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
    "eyecatch_game-4-11_collision-2.png"
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

# Step 1 — pygame.Rect + colliderect の最小コード
# 前ステップ（記事⑪ step2）からの変更点：update_play.py のみ。
# 衝突したら state["mode"] = "over" にする。
CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Collision")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48}


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
    player_rect = pygame.Rect(state["px"], 330, 48, 48)
    enemy_rect = pygame.Rect(state["ex"], state["ey"], 48, 48)
    if player_rect.colliderect(enemy_rect):
        state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"


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

# Step 2 — ヒットボックスを中央 24×24 に絞る
# Step 1 からの変更：update_play.py のみ。
CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Collision")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48}


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
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"


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

# 課題A 4-12-1 — 死なない練習モード
# 衝突しても state["mode"] は変えず、敵だけリセットする。update_play.py のみ変更。
CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Collision")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48}


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
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"


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

# 課題B 4-12-2 — HIT! 演出
# state["hit_timer"] を追加し、衝突したら 30 フレームのヒット演出後に mode = "over"。
# game_funcs.py + update_play.py + draw_play.py の3ファイル変更。
CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Collision")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "ex": random.randint(0, 576), "ey": -48,
         "hit_timer": 0}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    if state["hit_timer"] > 0:
        state["hit_timer"] = state["hit_timer"] - 1
        if state["hit_timer"] <= 0:
            state["mode"] = "over"
        return
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    state["ey"] = state["ey"] + 3
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
    player_hit = pygame.Rect(state["px"] + 12, 342, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["hit_timer"] = 30


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], 330, 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))
    if state["hit_timer"] > 0:
        _f = pygame.font.SysFont(None, 64)
        screen.blit(_f.render("HIT!", True, "#ffeb3b"), (260, 150))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"


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

# 課題C 4-12-3 — 上下移動 + 4方向当たり判定
# state["py"] を追加し、上下キーで動かす。当たり判定の Y 座標も state["py"] に。
# game_funcs.py + update_play.py + draw_play.py の3ファイル変更。
CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Collision")
clock = pygame.time.Clock()
state = {"mode": "play", "px": 296, "py": 296,
         "ex": random.randint(0, 576), "ey": -48}


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random

def update_play(state):
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    if pygame.key.get_pressed()[pygame.K_UP]:    state["py"] = state["py"] - 4
    if pygame.key.get_pressed()[pygame.K_DOWN]:  state["py"] = state["py"] + 4
    state["ey"] = state["ey"] + 3
    if state["ey"] > 400:
        state["ey"] = -48
        state["ex"] = random.randint(0, 576)
    player_hit = pygame.Rect(state["px"] + 12, state["py"] + 12, 24, 24)
    enemy_hit = pygame.Rect(state["ex"] + 12, state["ey"] + 12, 24, 24)
    if player_hit.colliderect(enemy_hit):
        state["mode"] = "over"


# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
    pygame.draw.rect(screen, "#ff6600", (state["ex"], state["ey"], 48, 48))


# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"


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


SPEC = Spec(
    page_id=4072,
    slug="game-12-collision",
    title="当たり判定を作ろう",
    intro_paragraphs=[
        '前回はゲームの中身を <code>game_funcs.py</code> / <code>update_play.py</code> / '
        '<code>draw_play.py</code> / <code>update_over.py</code> / <code>draw_over.py</code> / '
        '<code>main.py</code> の 5 つに分け、'
        '<code>state["mode"]</code> でプレイ中とゲームオーバーを切り替える枠組みを作りました。'
        'ところが今のところ「ゲームオーバーになる条件」が無いので、'
        'いくら敵に突っ込んでも何も起きません。',
        '今回は、ゲームらしさの肝となる<strong>当たり判定（collision）</strong>を入れます。'
        'PycoBlocks の <code>game_rect</code>（pygame.Rect）と '
        '<code>game_collide</code>（Rect.colliderect）を使って、'
        '「プレイヤーの四角」と「敵の四角」が重なった瞬間に '
        '<code>state["mode"] = "over"</code> に切り替えるところまでを作ります。'
        '当たり判定はすべて <code>update_play.py</code> の中に書くので、'
        'モジュール分割の利点（「動きの変更ならここを開く」）をもう一度体感できる回です。',
    ],
    eyecatch_basename="eyecatch_game_12_collision",
    iframe_xml="game_12_step2_final.xml",
    learn_bullets=[
        '<code>pygame.Rect(x, y, w, h)</code> で長方形（Rect）オブジェクトを作る方法',
        '<code>rectA.colliderect(rectB)</code> で 2 つの Rect が重なっているかを判定する方法',
        '当たり判定はゲームの「動き」なので、<strong><code>update_play.py</code> の中だけで完結する</strong>こと',
        '衝突したときに <code>state["mode"] = "over"</code> でゲームオーバー画面に切り替える流れ',
        '見た目の四角より小さなヒットボックス（中央 24×24）を作って、当たり判定を「やさしく」する考え方',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='今回出てくる「Rect」「colliderect」「ヒットボックス」の 3 つを押さえておきましょう。'
                'いずれもゲームプログラミングでは欠かせない言葉です。',
    terms_table=[
        ("Rect",
         "長方形を表す pygame のオブジェクト。x, y, 幅, 高さの 4 つの値を持つ",
         "<code>pygame.Rect(0, 0, 48, 48)</code>"),
        ("colliderect",
         "2 つの Rect が重なっているかどうかを True / False で返すメソッド",
         "<code>a.colliderect(b)</code>"),
        ("ヒットボックス",
         "見た目の絵とは別に、当たり判定のためだけに用意する小さめの長方形",
         "中央 24×24 など"),
        ("game_rect",
         "PycoBlocks のブロック。<code>pygame.Rect(x, y, w, h)</code> を作って返す",
         "オレンジ色のブロック"),
        ("game_collide",
         "PycoBlocks のブロック。2 つの Rect の <code>colliderect</code> を呼ぶ",
         "オレンジ色のブロック"),
    ],
    file_roles_h2="ファイル構成のおさらい（前回作った 5 ファイル）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。<code>screen</code>・<code>clock</code>・'
         '<code>state</code> 辞書を初期化します。'
         '<code>state</code> には <code>"px"</code>（プレイヤー X）・'
         '<code>"ex"</code>（敵 X）・<code>"ey"</code>（敵 Y）・'
         '<code>"mode"</code>（"play" / "over"）が入っています。'
         '<strong>今回はこのファイルを直接編集しません</strong>（演習課題で増やすことはあります）。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<code>update_play(state)</code> 関数の中で、左右キー → '
         '<code>state["px"]</code> 加減算 → 敵の落下 → 画面外でリセットの流れを書いています。'
         '<strong>今回の本題（当たり判定）はここに足します</strong>。'
         '前回置いた「Space で <code>state["mode"]="over"</code>」の動作確認用ブロックは、'
         '本記事の最初に削除して衝突判定に置き換えます。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         '<code>draw_play(screen, state)</code> 関数の中で、'
         '<code>state["px"]</code>・<code>state["ex"]</code>・<code>state["ey"]</code> から座標を取り出して'
         'プレイヤー（青）と敵（赤）の四角を描いています。'
         '<strong>今回はこのファイルを編集しません</strong>（演習課題で見た目を変えることはあります）。'),
        ("update_over.py",
         '<strong>ゲームオーバー画面の更新ロジック</strong>。'
         '<code>update_over(state)</code> 関数で、Enter キーが押されたら '
         '<code>state["mode"] = "play"</code> に戻すだけのファイルです。'
         '<strong>今回はこのファイルを編集しません</strong>（衝突判定はあくまで <code>update_play.py</code> 側に書きます）。'
         '<br>※ 衝突した瞬間の敵の座標で再開してしまうため、Enter で復帰した直後にもう一度ゲームオーバーになります。'
         'これは敵やプレイヤーの位置を初期化していないからで、<strong>次の記事⑬</strong>で'
         '<code>update_over.py</code> に位置リセットを足して解消します。'),
        ("draw_over.py",
         '<strong>ゲームオーバー画面の描画</strong>。'
         '<code>draw_over(screen, state)</code> 関数で、画面中央に「GAME OVER」と表示します。'
         '<strong>今回はこのファイルを編集しません</strong>。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<code>from game_funcs import …</code> で共有データを取り込み、'
         '<code>from update_play import update_play</code>・'
         '<code>from draw_play import draw_play</code>・'
         '<code>from update_over import update_over</code>・'
         '<code>from draw_over import draw_over</code> で 4 つの関数を読み込み、'
         '<code>if state["mode"] == "play":</code> ／ <code>else:</code> で分岐するだけ。'
         '<strong>今回はこのファイルを編集しません</strong>。当たり判定を増やしても <code>main.py</code> はそのままで済む、'
         'というのがモジュール分割のうまみです。'),
    ],
    steps=[
        Step(
            title="プレイヤーと敵に当たり判定を入れる",
            instructions=[
                '前回までの 5 ファイル分割の状態（<code>game_funcs.py</code> 〜 <code>main.py</code>）'
                'からスタートします。今回触るのは <strong><code>update_play.py</code> だけ</strong>です',
                'まず、前の記事⑪で動作確認用に置いていた '
                '「もし <code>K_SPACE</code> なら <code>state["mode"] = "over"</code>」のブロックを <strong>削除</strong>します。'
                'この記事ではキー操作ではなく <strong>衝突判定</strong> でゲームオーバーに切り替える、という形に置き換えます',
                '<code>update_play.py</code> の関数 <code>update_play(state)</code> の最後に、'
                'プレイヤー用の Rect を作る変数代入を追加します：'
                '<code>player_rect = game_rect(state["px"], 330, 48, 48)</code>'
                '（<code>game_rect</code> はオレンジ色のブロック、'
                '左辺の <code>player_rect</code> は緑色の「変数に値を入れる」ブロック、'
                '<code>state["px"]</code> は茶色の辞書ブロックです）',
                '同じく敵用の Rect を作ります：'
                '<code>enemy_rect = game_rect(state["ex"], state["ey"], 48, 48)</code>'
                '（プレイヤー用と同じ形のオレンジ色 <code>game_rect</code> ブロックを 1 つ追加するイメージです）',
                '「もし <code>game_collide(player_rect, enemy_rect)</code> なら、'
                '<code>state["mode"] = "over"</code>」を追加します'
                '（<code>game_collide</code> はオレンジ色で True / False を返すブロック、'
                '<code>もし〜なら</code> は紫色の <code>pico_if</code> ブロック、'
                '<code>state["mode"] = "over"</code> は茶色の辞書ブロックです）',
                '▶ 実行して、敵にわざとぶつかってみてください。瞬間に画面が「GAME OVER」表示に切り替われば成功です。'
                '<code>update_over.py</code> の Enter キー処理は前の記事⑪のまま残しているので、Enter を押せばまたプレイ画面に戻ります'
                '（ただし衝突した位置の敵がそのまま残るため、Enter 直後にもう一度ゲームオーバーになります。'
                '位置のリセットは<strong>次の記事⑬</strong>で <code>update_over.py</code> に足します）',
                'まだ「ぶつかった瞬間」と「絵が重なった瞬間」が一致しすぎて、慣性のような感覚がないかもしれません。次のステップで「ヒットボックス」を導入してそこを調整します',
            ],
            figure_basename="game_12_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'update_play.py': '関数 <code>update_play(state)</code> の最後に、'
                                  '<code>player_rect = pygame.Rect(state["px"], 330, 48, 48)</code> と '
                                  '<code>enemy_rect = pygame.Rect(state["ex"], state["ey"], 48, 48)</code> を作り、'
                                  '<code>player_rect.colliderect(enemy_rect)</code> が True なら '
                                  '<code>state["mode"] = "over"</code> に切り替えます。'
                                  '当たり判定は「動き」のひとつなので、変更はこのファイルの中だけで完結します。',
                'game_funcs.py': '<code>state</code> 辞書（<code>"mode"</code> / <code>"px"</code> / '
                                 '<code>"ex"</code> / <code>"ey"</code>）の初期化と <code>screen</code>・'
                                 '<code>clock</code> の用意を担当。'
                                 '<strong>当たり判定では新しいキーを足さない</strong>ので、ステップ1では一切編集しません。',
                'draw_play.py': 'プレイヤーと敵の四角を <code>state[…]</code> から取り出して描画するファイル。'
                                '描画は当たり判定とは別の役割なので、'
                                '<strong>このステップでは何も変えません</strong>。',
                'update_over.py': 'ゲームオーバー画面の更新（Enter キーで <code>"play"</code> に戻す）だけを行うファイル。'
                                  '当たり判定が <code>True</code> のときに <code>state["mode"] = "over"</code> に切り替えるのは'
                                  '<code>update_play.py</code> 側で済むので、'
                                  '<strong>このステップでは何も変えません</strong>。',
                'draw_over.py': '画面中央に「GAME OVER」を描くだけの描画ファイル。'
                                '<strong>このステップでは何も変えません</strong>。'
                                '見た目を装飾したくなったら演習課題4-12-2や次の記事で触ります。',
                'main.py': '<code>from game_funcs import …</code> と 4 つの <code>from … import …</code>、'
                          '<code>if state["mode"] == "play": ／ else:</code> の分岐だけのループ。'
                          '<strong>このステップでは何も変えません</strong>。'
                          '当たり判定を増やしても <code>main.py</code> がそのままで済む、というのがモジュール分割のうまみです。',
            },
        ),
        Step(
            title="ヒットボックスを中央 24×24 に絞る",
            instructions=[
                '見た目の絵が 48×48 でも、当たり判定は <strong>もう少し内側</strong> のほうがプレイヤーにやさしくなります。'
                '当たり判定専用の小さな Rect を新しく作ってあげましょう',
                '<code>update_play.py</code> の <code>player_rect</code> と <code>enemy_rect</code> を、'
                '名前を <code>player_hit</code> / <code>enemy_hit</code> に変えて、'
                '<code>x</code>・<code>y</code> を <strong>+12 ずらし</strong>、'
                '幅・高さを <strong>24×24</strong> に縮めます'
                '（左辺は緑色の「変数に値を入れる」ブロックで名前を入力し直すだけ。'
                '<code>state["px"]+12</code> の <code>+</code> は橙色の数値演算ブロックです）',
                '具体的には：'
                '<code>player_hit = game_rect(state["px"]+12, 342, 24, 24)</code>、'
                '<code>enemy_hit = game_rect(state["ex"]+12, state["ey"]+12, 24, 24)</code>'
                '（オレンジ色の <code>game_rect</code> ブロックの中に、'
                '茶色の辞書ブロック <code>state[…]</code> と橙色の数値演算 <code>+12</code> を差し込む形になります）',
                '<code>game_collide</code> ブロック（オレンジ色）の 2 つの引数も '
                '<code>player_hit</code> と <code>enemy_hit</code> に差し替えます',
                '▶ 実行して、敵をすれすれですり抜けられる感覚があれば成功です。'
                '見た目の四角と当たり判定の四角は別物にできる、というのは覚えておくと色々な場面で役立ちます',
            ],
            figure_basename="game_12_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'update_play.py': 'Rect の名前を <code>player_hit</code> / <code>enemy_hit</code> に変え、'
                                  '位置を中央寄りに <strong>+12</strong> ずらし、サイズを <strong>24×24</strong> に縮めます。'
                                  '<code>state</code> 辞書には何も足さないので、<code>game_funcs.py</code> は触りません。',
                'game_funcs.py': '<code>state</code> 辞書はそのまま。'
                                 'ヒットボックスの座標やサイズは <code>update_play.py</code> 側でその場で計算するので、'
                                 '<strong>このステップでは何も変えません</strong>。',
                'draw_play.py': 'プレイヤーと敵の見た目（48×48 の四角）はそのままにしておきます。'
                                '当たり判定の四角だけ小さくするのが「ヒットボックス」の考え方なので、'
                                '<strong>このステップでは何も変えません</strong>。',
                'update_over.py': 'Enter で <code>"play"</code> に戻す処理はそのまま。'
                                  '<strong>このステップでは何も変えません</strong>。',
                'draw_over.py': '「GAME OVER」を描くだけの内容はそのまま。'
                                '<strong>このステップでは何も変えません</strong>。',
                'main.py': 'ゲームループの分岐構造はそのまま。'
                          '<strong>このステップでは何も変えません</strong>。'
                          'ヒットボックスの調整も <code>update_play.py</code> の中だけで完結します。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="4-12-1",
            title="衝突しても死なない『練習モード』を作ろう",
            lead='いきなりゲームオーバーにせず、衝突したら<strong>敵だけ画面外にリセット</strong>するモードに直してみましょう。'
                 '練習中や動作確認のときに重宝する「死なないモード」です。'
                 '変更場所は <code>update_play.py</code> の中、当たり判定が True になったときの処理だけ。'
                 '<code>state["mode"] = "over"</code> を消し、敵リセットの 2 行に置き換えます。',
            figure_basename="game_12_a_easy",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='当たり判定が True になった紫色の <code>pico_if</code> ブロックの中身を、'
                        '茶色の辞書ブロックで <code>state["mode"] = "over"</code> としていた 1 行から、'
                        '茶色の辞書ブロック 2 個（<code>state["ey"] = -48</code> と '
                        '<code>state["ex"] = random.randint(0, 576)</code>）に差し替えます。'
                        'こうすると衝突しても敵が画面の上に戻り、ランダムな X からまた降ってくる挙動になります。'
                        '「ゲームオーバーにしない」という大きな仕様変更も、<strong>触るのはこのファイルの中だけ</strong>。'
                        'モジュール分割の良さがいちばん見える課題です。',
            file_descriptions={
                'update_play.py': '当たり判定が True になったときの中身を、'
                                  '「<code>state["mode"] = "over"</code>」から'
                                  '「<code>state["ey"] = -48</code> と <code>state["ex"] = random.randint(0, 576)</code>」'
                                  'の 2 行に書き換えるだけです。',
            },
        ),
        Kadai(
            number="4-12-2",
            title="ぶつかった瞬間に『HIT!』を見せてからゲームオーバーにしよう",
            lead='衝突した瞬間にいきなり真っ黒な「GAME OVER」へ切り替わるのは少し殺風景です。'
                 '<code>state["hit_timer"]</code> を新しく追加して、'
                 '衝突から <strong>30 フレーム（約 0.5 秒）</strong> の間は黄色の「HIT!」を表示し、'
                 'タイマーが 0 になったら <code>state["mode"] = "over"</code> に切り替える、'
                 'という<strong>演出付きのゲームオーバー</strong>を作りましょう。',
            figure_basename="game_12_b_hit",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='<code>game_funcs.py</code> の茶色い辞書リテラルブロック（<code>py_dict_literal</code>）に '
                        '<code>"hit_timer": 0</code> の項目を 1 行追加します。'
                        '<code>update_play.py</code> では関数の先頭で「<code>hit_timer &gt; 0</code> なら毎フレーム -1。'
                        '0 になった瞬間に <code>state["mode"] = "over"</code> にして以後の処理を <code>return</code>」'
                        'という分岐を、紫色の <code>pico_if</code> ブロックと'
                        '橙色の比較ブロック・茶色の辞書ブロックで組み立てます。'
                        '関数の途中で抜けるための <code>return</code> は朱色の関数ブロック（<code>py_return</code>）です。'
                        '衝突時は <code>state["hit_timer"] = 30</code> をセットするだけです。'
                        '<code>draw_play.py</code> では <code>hit_timer &gt; 0</code> のときだけ画面中央に黄色い「HIT!」を'
                        '青色の <code>game_draw_text</code> ブロックで描画します。'
                        '<strong>「タイマー的なフラグも state 辞書にまとめる」</strong>パターンの初出として覚えておきましょう。',
            file_descriptions={
                'game_funcs.py': '<code>state</code> 辞書に <code>"hit_timer": 0</code> を追加します。'
                                 '時間に関わるカウンタも <code>state</code> に置くのが定石です。',
                'update_play.py': '関数の先頭に「<code>state["hit_timer"] &gt; 0</code> なら毎フレーム 1 ずつ減らす。'
                                  '0 以下になった瞬間に <code>state["mode"] = "over"</code> へ切り替えて <code>return</code>」'
                                  'という分岐を入れます。'
                                  '当たり判定が True のときは、すぐ <code>"over"</code> にせず '
                                  '<code>state["hit_timer"] = 30</code> をセットするだけです。',
                'draw_play.py': 'プレイヤーと敵を描いたあとに、'
                                '「もし <code>state["hit_timer"] &gt; 0</code> なら'
                                '画面中央に黄色い『HIT!』を <code>blit</code> する」処理を追加します。'
                                '見た目だけの変更なので、<code>update_play.py</code> 側のロジックは増えません。',
            },
        ),
        Kadai(
            number="4-12-3",
            title="プレイヤーを上下にも動かして、4方向の当たり判定にしよう",
            lead='プレイヤーは今のところ Y 座標が 330 で固定されています。'
                 '<code>state</code> 辞書に <code>"py"</code> を追加し、'
                 '<strong>上下キー</strong>でも動けるようにしましょう。'
                 '当たり判定の Y も <code>state["py"]</code> から取ってくる必要があります。'
                 '描画も <code>draw_play.py</code> 側を <code>state["py"]</code> 参照に書き換えます。',
            figure_basename="game_12_c_4dir",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='<code>game_funcs.py</code> の茶色い辞書リテラルブロックに '
                        '<code>"py": 296</code> の項目を追加します（画面中央あたり）。'
                        '<code>update_play.py</code> では青緑色の <code>game_key_pressed</code> ブロック '
                        '（<code>K_UP</code> / <code>K_DOWN</code>）と、紫色の <code>pico_if</code> を組んで、'
                        '茶色の辞書ブロックで <code>state["py"]</code> を ±4 動かす分岐を増やします。'
                        '当たり判定用の <code>player_hit</code> の Y も '
                        '<code>state["py"] + 12</code>（橙色の数値演算ブロックで足し算）に差し替えます。'
                        '<code>draw_play.py</code> では青色の <code>game_draw_rect</code> ブロックの Y 入力を、'
                        '青色の数値定数 330 から茶色の辞書ブロック <code>state["py"]</code> に差し替えるだけです。'
                        '「データを増やす（<code>state</code> に追加）→ 動きを足す（update_play）→ 見た目を更新（draw_play）」'
                        'という<strong>3 段の手順</strong>がきれいに見える課題です。'
                        '今後の機能追加でもこの 3 段階で考えると整理しやすくなります。',
            file_descriptions={
                'game_funcs.py': '<code>state</code> 辞書に <code>"py": 296</code> を追加します。'
                                 'プレイヤーの Y 座標も <code>state</code> 管理にします。',
                'update_play.py': '<code>K_UP</code> / <code>K_DOWN</code> での <code>state["py"]</code> 加減算を追加し、'
                                  '<code>player_hit</code> の Y を <code>state["py"] + 12</code> に変えます。'
                                  '左右キーの処理は前のままです。',
                'draw_play.py': 'プレイヤーを描く Y 座標を 330 から <code>state["py"]</code> に差し替えるだけです。'
                                '当たり判定の話とは独立した <strong>「見た目の追従」</strong> なので、ここで一行直すだけで済みます。',
            },
        ),
    ],
    summary_bullets=[
        '<code>pygame.Rect(x, y, w, h)</code> で長方形を作り、'
        '<code>rectA.colliderect(rectB)</code> で 2 つの長方形の重なりを判定する',
        '当たり判定は「動き」なので、変更はすべて <code>update_play.py</code> の中で完結する',
        '衝突したときに <code>state["mode"] = "over"</code> を入れるだけで、'
        '前回作った状態機械の枠組みに自然に乗る',
        '見た目の四角より小さい <strong>ヒットボックス</strong>（中央 24×24）を作ると、'
        '当たり判定をやさしく感じさせる調整ができる',
        '「データを <code>state</code> に追加 → 動きを <code>update_play.py</code> で足す → '
        '見た目を <code>draw_play.py</code> で更新」の 3 段で機能を増やしていく',
    ],
    next_article_id=4073,
    next_article_title='【Pygameでゲーム⑬】スコアを数えよう',
    cache_buster="20260509b",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑫】当たり判定を作ろう")
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
