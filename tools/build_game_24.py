#!/usr/bin/env python3
"""WP 記事 5154 (Pygame㉕ ジャンプと重力) の本文を組み立てて反映する。

Part 6 入口 — シューティングから platformer 系へ。
速度 vy・加速度（重力）・接地判定の 3 つで「ジャンプ」を表現する。

  - Step 1: 重力で落下 → 地面で停止 → on_ground = 1
  - Step 2: SPACE で on_ground == 1 のときだけ vy = -14 で離陸
  - 課題A 5-25-1 high_gravity: gravity = 2（重い世界）
  - 課題B 5-25-2 high_jump: jump_init = -18（高く飛ぶ）
  - 課題C 5-25-3 double_jump: jump_count で空中もう 1 回ジャンプ可能

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
    "eyecatch_game-5-25_title.png"
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
state = {{"mode": "play", "px": 296, "py": 80}}
state["vy"] = 0
state["on_ground"] = 0
state["jump_count"] = 0
state["frame"] = 0
'''

_DRAW_PLAY = '''\
# ─── draw_play.py ──────────────────────────────────────────────
import pygame

def draw_play(screen, state):
    pygame.draw.rect(screen, "#444444", (0, 352, 640, 48))
    pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))
    _f = pygame.font.SysFont(None, 28)
    screen.blit(_f.render("vy: " + str(state["vy"]), True, "#ffffff"), (10, 10))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("on_ground: " + str(state["on_ground"]), True, "#88ff88"), (10, 40))
'''

_UPDATE_OVER = '''\
# ─── update_over.py ────────────────────────────────────────────
import pygame

def update_over(screen, state):
    if pygame.key.get_pressed()[pygame.K_RETURN]:
        state["mode"] = "play"
        state["px"] = 296
        state["py"] = 80
        state["vy"] = 0
        state["on_ground"] = 0
        state["jump_count"] = 0
        state["frame"] = 0
'''

_DRAW_OVER = '''\
# ─── draw_over.py ──────────────────────────────────────────────
import pygame

def draw_over(screen, state):
    _f = pygame.font.SysFont(None, 40)
    screen.blit(_f.render("PAUSED", True, "#ff3232"), (220, 150))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render("Press ENTER", True, "#88ff88"), (220, 220))
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
        update_play(screen, state)
        draw_play(screen, state)
    else:
        update_over(screen, state)
        draw_over(screen, state)
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''


def _make_full_code(update_play_body: str, *, title: str = "Jump and Gravity") -> str:
    return (
        _FUNCS_TEMPLATE.format(title=title)
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


# Step 1 — 重力で落下のみ（ジャンプなし）
_UPDATE_PLAY_STEP1 = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame

def update_play(screen, state):
    state["frame"] = state["frame"] + 1
    state["vy"] = state["vy"] + 1
    if state["vy"] > 16:
        state["vy"] = 16
    state["py"] = state["py"] + state["vy"]
    if state["py"] >= 304:
        state["py"] = 304
        state["vy"] = 0
        state["on_ground"] = 1
    else:
        state["on_ground"] = 0
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    if state["px"] < 0:   state["px"] = 0
    if state["px"] > 592: state["px"] = 592
'''

# Step 2 — 重力 + ジャンプ + 左右移動
_UPDATE_PLAY_STEP2 = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame

def update_play(screen, state):
    state["frame"] = state["frame"] + 1
    state["vy"] = state["vy"] + 1
    if state["vy"] > 16:
        state["vy"] = 16
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        if state["on_ground"] == 1:
            state["vy"] = -14
            state["on_ground"] = 0
    state["py"] = state["py"] + state["vy"]
    if state["py"] >= 304:
        state["py"] = 304
        state["vy"] = 0
        state["on_ground"] = 1
    else:
        state["on_ground"] = 0
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    if state["px"] < 0:   state["px"] = 0
    if state["px"] > 592: state["px"] = 592
'''

# 課題A 5-25-1 — 重力 2 倍
_UPDATE_PLAY_KADAI_A = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame

def update_play(screen, state):
    state["frame"] = state["frame"] + 1
    state["vy"] = state["vy"] + 2
    if state["vy"] > 16:
        state["vy"] = 16
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        if state["on_ground"] == 1:
            state["vy"] = -14
            state["on_ground"] = 0
    state["py"] = state["py"] + state["vy"]
    if state["py"] >= 304:
        state["py"] = 304
        state["vy"] = 0
        state["on_ground"] = 1
    else:
        state["on_ground"] = 0
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    if state["px"] < 0:   state["px"] = 0
    if state["px"] > 592: state["px"] = 592
'''

# 課題B 5-25-2 — 高ジャンプ（初速 -18）
_UPDATE_PLAY_KADAI_B = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame

def update_play(screen, state):
    state["frame"] = state["frame"] + 1
    state["vy"] = state["vy"] + 1
    if state["vy"] > 16:
        state["vy"] = 16
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        if state["on_ground"] == 1:
            state["vy"] = -18
            state["on_ground"] = 0
    state["py"] = state["py"] + state["vy"]
    if state["py"] >= 304:
        state["py"] = 304
        state["vy"] = 0
        state["on_ground"] = 1
    else:
        state["on_ground"] = 0
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    if state["px"] < 0:   state["px"] = 0
    if state["px"] > 592: state["px"] = 592
'''

# 課題C 5-25-3 — 二段ジャンプ（jump_count を 0..2 で管理）
_UPDATE_PLAY_KADAI_C = '''\
# ─── update_play.py ────────────────────────────────────────────
import pygame

def update_play(screen, state):
    state["frame"] = state["frame"] + 1
    state["vy"] = state["vy"] + 1
    if state["vy"] > 16:
        state["vy"] = 16
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        if state["jump_count"] < 2:
            state["vy"] = -14
            state["on_ground"] = 0
            state["jump_count"] = state["jump_count"] + 1
    state["py"] = state["py"] + state["vy"]
    if state["py"] >= 304:
        state["py"] = 304
        state["vy"] = 0
        state["on_ground"] = 1
        state["jump_count"] = 0
    else:
        state["on_ground"] = 0
    if pygame.key.get_pressed()[pygame.K_LEFT]:  state["px"] = state["px"] - 4
    if pygame.key.get_pressed()[pygame.K_RIGHT]: state["px"] = state["px"] + 4
    if state["px"] < 0:   state["px"] = 0
    if state["px"] > 592: state["px"] = 592
'''

CODE_STEP1 = _make_full_code(_UPDATE_PLAY_STEP1, title="Falling Demo")
CODE_STEP2 = _make_full_code(_UPDATE_PLAY_STEP2, title="Jump and Gravity")
CODE_KADAI_A = _make_full_code(_UPDATE_PLAY_KADAI_A, title="Heavy World")
CODE_KADAI_B = _make_full_code(_UPDATE_PLAY_KADAI_B, title="Power Jump")
CODE_KADAI_C = _make_full_code(_UPDATE_PLAY_KADAI_C, title="Double Jump")


SPEC = Spec(
    page_id=5154,
    slug="game-25-jump",
    title="ジャンプと重力",
    intro_paragraphs=[
        'Part 5 でシューティングが完結し、ここから <strong>Part 6 — 横スクロールアクション</strong> '
        '系のジャンルへ進みます。横スクロール系を作るには、まず <strong>「ジャンプ」</strong> を実装する必要があります。'
        'ジャンプは、たった 3 つの数（<strong>位置</strong>・<strong>速度</strong>・<strong>加速度</strong>）の'
        '関係を理解すれば、20 行ほどのプログラムで再現できます。',
        '今回は、これまでのシューティングと同じ <strong>5 ファイル分割 + state 辞書</strong> の'
        '枠組みをそのまま受け継ぎ、<code>update_play.py</code> だけを <strong>「重力で落下するキャラクター」</strong> '
        'のロジックに書き換えます。プレイヤーが空から落ちて地面に着地し、'
        '一瞬だけ <code>state["on_ground"] = 1</code> になることを目視で確認します（Step 1）。',
        'Step 2 では <strong>SPACE キーでジャンプ</strong> を追加します。'
        'ポイントは <strong>「接地中だけジャンプできる」</strong> という条件分岐。'
        '<code>state["on_ground"] == 1</code> のときに <code>state["vy"] = -14</code> を代入し、'
        '次フレームから重力が貯金を取り戻して、放物線を描きながら着地します。'
        '位置・速度・加速度の 3 段ピラミッドが、たった 5 行で美しいジャンプを生み出します。',
        '課題では「<strong>重力を 2 倍にする</strong>（A：石みたいに落ちる）」、'
        '「<strong>初速 -18 で高くジャンプ</strong>（B：パワージャンプ）」、'
        '「<strong>空中もう 1 回ジャンプ</strong>（C：jump_count で二段ジャンプ）」の'
        '3 アレンジを通して、物理パラメーターをいじる感覚を磨きます。'
        '次の㉖からは、ジャンプ + 障害物 + ステージ移動と組み合わせて、'
        '本格的な横スクロールアクションへ進化していきます。',
    ],
    eyecatch_basename="eyecatch_game_24_jump",
    iframe_xml="game_24_step1_final.xml",
    learn_bullets=[
        '<code>state["vy"]</code>（縦速度）に <strong>重力 1</strong> を毎フレーム足し続ける'
        '<strong>「速度 ＋ 加速度」</strong>のレシピ',
        '<code>state["py"] = state["py"] + state["vy"]</code> の'
        '<strong>「位置 ＋ 速度」</strong>更新で、放物線の動きが自然に出ること',
        '<code>state["py"] &gt;= 304</code> による <strong>接地判定</strong> と、'
        '着地時の <code>state["vy"] = 0</code> リセット',
        '<code>state["on_ground"]</code> フラグを 0/1 で持たせて、'
        '<strong>「接地中だけ」</strong>の条件分岐（ジャンプの発射条件）を表現する方法',
        'SPACE キー押下 + 接地中 → <code>state["vy"] = -14</code> による'
        '<strong>離陸（初速注入）</strong>のテクニック',
        '<code>state["vy"] &gt; 16</code> で<strong>終端速度クランプ</strong>を入れる理由',
        '5 ファイル分割の継承 ─ <code>game_funcs.py</code> の state を入れ替え、'
        '<code>update_play.py</code> だけ書き換えれば <strong>ジャンルが変わってもループ構造は同じ</strong>',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='ジャンプは「物理3兄弟（位置・速度・加速度）」の最小例です。'
                '一見むずかしそうですが、変数 3 つで完結します。',
    terms_table=[
        ("位置 (position)",
         "プレイヤーの座標。<code>state[\"px\"]</code>（横）と <code>state[\"py\"]</code>（縦）。"
         "毎フレーム速度を足して更新する",
         '<code>state["py"] = state["py"] + state["vy"]</code>'),
        ("速度 (velocity)",
         "1 フレームあたりに位置がどれだけ動くか。"
         "<code>state[\"vy\"]</code>（縦速度）はジャンプ時に -14 になり、毎フレーム重力で +1 ずつ増えていく",
         '<code>state["vy"] = -14</code>（ジャンプ）'),
        ("加速度 (acceleration / 重力)",
         "1 フレームあたりに速度がどれだけ変わるか。"
         "下向きを +、毎フレーム vy に足す。今回は <strong>1</strong>",
         '<code>state["vy"] = state["vy"] + 1</code>'),
        ("終端速度 (terminal velocity)",
         "速度が無限に大きくならないようクランプする上限値。"
         "落下が速くなりすぎてキャラが地面を貫通するのを防ぐ",
         '<code>if state["vy"] &gt; 16: state["vy"] = 16</code>'),
        ("接地判定 (on-ground check)",
         "<code>state[\"py\"] &gt;= 304</code> なら地面に着いているとみなす。"
         "着地したら <code>state[\"vy\"] = 0</code> + <code>state[\"on_ground\"] = 1</code>",
         '<code>if state["py"] &gt;= 304: state["py"] = 304; state["vy"] = 0; state["on_ground"] = 1</code>'),
        ("on_ground フラグ",
         "「いま地面にいるか」を 0/1 で表す。"
         "ジャンプの発射条件として使う（接地中だけ離陸できる）",
         '<code>state["on_ground"] = 1</code> / <code>state["on_ground"] = 0</code>'),
        ("離陸 (jump impulse)",
         "ジャンプの瞬間に縦速度を一気に負の値（上向き）にする処理。"
         "1 フレームだけ <code>vy</code> に大きな値を代入する",
         '<code>if state["on_ground"] == 1: state["vy"] = -14</code>'),
    ],
    file_roles_h2="ファイル構成のおさらい（ジャンプ用に state を入れ替え）",
    file_roles=[
        ("game_funcs.py",
         '<strong>共有データの置き場</strong>。'
         '<strong>変更点：</strong>シューティング用の state（exs/eys/bxs/...）はすべて削除し、'
         '<code>state["py"]</code>, <code>state["vy"]</code>, <code>state["on_ground"]</code>, '
         '<code>state["jump_count"]</code>, <code>state["frame"]</code> だけのシンプルな初期化に。'),
        ("update_play.py",
         '<strong>プレイ中の毎フレーム更新</strong>。'
         '<strong>今回の主役のファイル</strong>。'
         '重力（vy += 1）→ ジャンプ判定（SPACE + on_ground == 1）→ '
         '位置更新（py += vy）→ 接地判定（py &gt;= 304）→ 左右移動の順に書きます。'),
        ("draw_play.py",
         '<strong>プレイ中の毎フレーム描画</strong>。'
         'シンプルに <strong>地面の灰色矩形 + プレイヤーの水色矩形</strong>。'
         'デバッグ用に <code>vy</code> と <code>on_ground</code> を画面左上に表示。'),
        ("update_over.py",
         '<strong>"play" 以外（pause）の更新ロジック</strong>。'
         'ENTER キーで完全リセット（位置・速度・接地フラグ・jump_count を初期化）。'),
        ("draw_over.py",
         '<strong>"play" 以外の描画</strong>。'
         '今回の Step では到達しませんが、Part 6 中盤で「ステージクリア」「ゲームオーバー」を'
         '実装するときの土台として残しておきます。'),
        ("main.py",
         '<strong>ゲームループ本体</strong>。'
         '<strong>このファイルは触りません</strong>。'
         '<code>if state["mode"] == "play":</code> の分岐構造はジャンルが変わっても同じ。'),
    ],
    steps=[
        Step(
            title="重力で落下させて、地面で止めてみよう",
            instructions=[
                'まずは <strong>「重力」</strong>だけを実装します。'
                '<code>game_funcs.py</code> の state を、'
                '<code>{"mode": "play", "px": 296, "py": 80}</code>（<code>py = 80</code> なのは'
                '空中スタートさせるため）に変更し、'
                '<code>state["vy"] = 0</code>, <code>state["on_ground"] = 0</code>, '
                '<code>state["jump_count"] = 0</code>, <code>state["frame"] = 0</code> を追加します',
                '<code>update_play.py</code> を <strong>5 セクション</strong>で書きます：'
                '<br>① <code>state["frame"] += 1</code>（フレームカウンタ）'
                '<br>② <strong>重力</strong>：<code>state["vy"] = state["vy"] + 1</code>（毎フレーム加速）'
                '<br>③ <strong>終端速度クランプ</strong>：<code>if state["vy"] &gt; 16: state["vy"] = 16</code>'
                '<br>④ <strong>位置更新</strong>：<code>state["py"] = state["py"] + state["vy"]</code>'
                '<br>⑤ <strong>接地判定</strong>：<code>if state["py"] &gt;= 304: state["py"] = 304; state["vy"] = 0; state["on_ground"] = 1; else: state["on_ground"] = 0</code>',
                '左右移動も入れておきます。'
                '<code>K_LEFT</code>/<code>K_RIGHT</code> で <code>state["px"]</code> を ±4、'
                '画面端で <code>0</code> または <code>592</code> にクランプ',
                '<code>draw_play.py</code> は <strong>地面 + プレイヤー</strong> のシンプル構成。'
                '<br>① <code>pygame.draw.rect(screen, "#444444", (0, 352, 640, 48))</code>（地面）'
                '<br>② <code>pygame.draw.rect(screen, "#5cd6ff", (state["px"], state["py"], 48, 48))</code>（プレイヤー）'
                '<br>③ デバッグ HUD：<code>vy: ◯</code> と <code>on_ground: ◯</code> を画面左上',
                '<code>update_over.py</code> は ENTER でリセット、<code>draw_over.py</code> はシンプルな PAUSED 表示、'
                '<code>main.py</code> は Part 5 と完全に同じ',
                '保存して実行。<strong>プレイヤーが空から落ち</strong>、'
                '地面（y=304）に着くと <strong>vy: 0</strong>・<strong>on_ground: 1</strong> に切り替わって'
                '止まります。左右キーで横移動も確認できれば Step 1 は完成です',
            ],
            figure_basename="game_24_step1_final",
            figure_width=1500,
            code=CODE_STEP1,
            file_descriptions={
                'game_funcs.py': '<strong>変更点：</strong>'
                                 'シューティング用 state を全削除し、'
                                 '<code>vy</code>/<code>on_ground</code>/<code>jump_count</code>/'
                                 '<code>frame</code> だけのシンプル初期化に。'
                                 '<code>py = 80</code>（空中スタート）。',
                'update_play.py': '<strong>変更点（今回の主役）：</strong>'
                                  'frame → 重力（vy+=1）→ クランプ → 位置更新（py+=vy）→ 接地判定 → 左右移動 の 5 セクション。',
                'draw_play.py': '<strong>変更点：</strong>'
                                '地面（灰色 0,352,640,48）+ プレイヤー（水色 px,py,48,48）+ デバッグ HUD。',
                'update_over.py': '<strong>変更点：</strong>'
                                  'ENTER で位置・速度・接地・jump_count をリセット。',
                'draw_over.py': '<strong>変更点：</strong>'
                                'シンプルな PAUSED + Press ENTER 表示。',
                'main.py': '<strong>このファイルは触りません</strong>。Part 5 と完全に同じ。',
            },
        ),
        Step(
            title="SPACE キーでジャンプさせよう",
            instructions=[
                'Step 1 では「落ちて止まる」だけでした。'
                'いよいよ <strong>SPACE キーでジャンプ</strong> させて、'
                'プレイヤーが地面から飛び上がる動きを実装します',
                '<code>update_play.py</code> の <strong>重力の直後・位置更新の前</strong>に、'
                'ジャンプ判定を追加します。'
                '<br>① <code>if pygame.key.get_pressed()[pygame.K_SPACE]:</code>'
                '<br>② <code>　if state["on_ground"] == 1:</code>'
                '<br>③ <code>　　state["vy"] = -14</code>（負の vy = 上向きに離陸）'
                '<br>④ <code>　　state["on_ground"] = 0</code>（即座に空中フラグへ）',
                'これだけで動きます。<strong>位置と速度の関係</strong>に注目しましょう：'
                'SPACE が押された瞬間に <code>state["vy"] = -14</code>（強く上向き）。'
                '次のフレームでは重力で <code>vy = -13</code> → -12 → ... → 0 → 1 → 2 → ... → 16 と'
                '<strong>放物線を描いて上昇 → 頂点 → 落下</strong> します',
                '<strong>接地中だけジャンプできる</strong> ことが大事。'
                'もし <code>state["on_ground"] == 1</code> の判定を外すと、'
                '<strong>SPACE 押しっぱなし = 永遠に上昇</strong>（フライトモード）になってしまいます。'
                'これがゲーム性を作る鍵です',
                '<code>draw_play.py</code> は Step 1 と同じ。'
                '<code>game_funcs.py</code>・<code>update_over.py</code>・'
                '<code>draw_over.py</code>・<code>main.py</code> も <strong>無変更</strong>',
                '保存して実行。地面に着地後 <strong>SPACE で 1 回だけジャンプ</strong>、'
                '空中で SPACE を連打しても無視されることを確認。'
                '左右移動 + ジャンプを組み合わせて、画面内で自由に飛び回れたら Step 2 は完成です',
                '▶ 動作確認：vy の変化を HUD で観察しましょう。'
                '離陸の瞬間に -14 になり、フレームごとに +1 ずつ増えていき、'
                '頂点で 0 を通って、地面に着くまで増え続け、'
                '着地で 0 にリセット ─ という<strong>「往復速度」</strong> を目で追えます',
            ],
            figure_basename="game_24_step2_final",
            figure_width=1500,
            code=CODE_STEP2,
            file_descriptions={
                'game_funcs.py': '<strong>このファイルは触りません</strong>。Step 1 と同じ。',
                'update_play.py': '<strong>変更点：</strong>'
                                  '重力の直後・位置更新の前に '
                                  '<code>if K_SPACE: if on_ground == 1: vy = -14; on_ground = 0</code> を追加。',
                'draw_play.py': '<strong>このファイルも触りません</strong>。',
                'update_over.py': '<strong>このファイルも触りません</strong>。',
                'draw_over.py': '<strong>このファイルも触りません</strong>。',
                'main.py': '<strong>このファイルも触りません</strong>。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="5-25-1",
            title="重力を 2 倍にして「重い世界」を作ろう",
            lead='Step 2 の <code>state["vy"] = state["vy"] + 1</code> を '
                 '<strong><code>+ 2</code></strong> に変えるだけで、'
                 'ジャンプの放物線が <strong>すぐに頂点に達して急降下</strong> する'
                 '「石みたいな」世界になります。物理パラメーターを変えるだけで世界観が一変するのが楽しいところです。',
            figure_basename="game_24_a_high_gravity",
            figure_width=1500,
            code=CODE_KADAI_A,
            explanation='重力 = 1 のときは vy が 1 ずつ増えるので、'
                        'ジャンプ初速 -14 から 0 になるのに 14 フレーム（約 0.23 秒）かかります。'
                        '重力 = 2 にすると 7 フレーム（約 0.12 秒）で頂点に達するので、'
                        '体感では「重力が強い惑星にいる」感じに。'
                        '逆に <code>+ 0</code>（重力ゼロ）にすれば、'
                        'ジャンプしっぱなしで真上にずっと飛び続ける宇宙空間になります。',
        ),
        Kadai(
            number="5-25-2",
            title="初速を -18 にしてジャンプを高くしよう",
            lead='Step 2 の <code>state["vy"] = -14</code> を <strong><code>-18</code></strong> に'
                 '変えるだけで、<strong>もっと高くジャンプ</strong> できるようになります。'
                 '値を変えるとどう変わるか、いろいろ試してみましょう。',
            figure_basename="game_24_b_high_jump",
            figure_width=1500,
            code=CODE_KADAI_B,
            explanation='ジャンプの最高到達高度は、'
                        '<strong>初速 × 重力</strong> の関係で決まります。'
                        '重力 1 で初速 -14 なら 14 フレームで頂点に達し、'
                        'その間に <code>(14+13+12+...+1) = 105</code> ピクセル上昇します。'
                        '初速 -18 にすると <code>(18+17+...+1) = 171</code> ピクセル上昇 ─ '
                        '初速の差はわずか 4 でも、上昇距離は <strong>1.6 倍</strong> に。'
                        '物理学の <strong>「等加速度直線運動」</strong> の世界です。'
                        '<code>-25</code> や <code>-30</code> も試して、画面上端からはみ出ないように調整するのも面白いです。',
        ),
        Kadai(
            number="5-25-3",
            title="二段ジャンプを実装しよう",
            lead='アクションゲームの定番、<strong>「空中でもう 1 回ジャンプできる」</strong> 仕組みを実装します。'
                 '<code>state["jump_count"]</code> を使って、ジャンプするたびに +1、'
                 '着地で 0 にリセットし、<strong>2 未満なら飛べる</strong> ようにします。',
            figure_basename="game_24_c_double_jump",
            figure_width=1500,
            code=CODE_KADAI_C,
            explanation='Step 2 のジャンプ判定を、'
                        '<code>if state["on_ground"] == 1:</code> から '
                        '<strong><code>if state["jump_count"] &lt; 2:</code></strong> に変更し、'
                        'ジャンプ時に <code>state["jump_count"] = state["jump_count"] + 1</code> を追加。'
                        '着地時のリセットに <code>state["jump_count"] = 0</code> を追加。'
                        'これだけで「空中ジャンプ 1 回まで」の二段ジャンプが完成します。'
                        '値を <code>3</code> に増やせば三段ジャンプ、'
                        '<code>999</code> にすれば実質無制限のフライトモード ─ '
                        '一行の値変更で世界の物理ルールが変わります。',
        ),
    ],
    summary_bullets=[
        '<strong>位置 + 速度 + 加速度</strong> の 3 段ピラミッド構造を、'
        '毎フレーム <code>vy += 1</code> → <code>py += vy</code> の'
        'たった 2 行で表現できる',
        '<code>state["on_ground"]</code> という 0/1 フラグで'
        '<strong>「接地中だけジャンプ可能」</strong> という条件分岐を表現する設計パターン',
        '<code>state["py"] &gt;= 304</code> による <strong>接地判定 + 位置補正 + 速度ゼロ化</strong> の'
        '3 点セットが、地面で止まる挙動を生み出している',
        'シューティングと同じ <strong>5 ファイル分割 + state 辞書</strong> の枠組みが'
        'ジャンルを越えて再利用できる ─ 変更したのは '
        '<code>game_funcs.py</code> の state 中身と <code>update_play.py</code> の本体だけ',
        '次の㉖以降は <strong>障害物 + ステージスクロール + 敵キャラ</strong> を'
        'ジャンプの上に重ねて、本格的な <strong>横スクロールアクション</strong> を作ります',
    ],
    next_article_id=5157,
    next_article_title='【Pygameでゲーム㉖】障害物を置いて当たり判定しよう',
    cache_buster="20260509i",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム㉕】ジャンプと重力")
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
