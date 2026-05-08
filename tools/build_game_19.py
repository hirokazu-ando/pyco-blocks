#!/usr/bin/env python3
"""WP 記事 5002 (Pygame⑲ 弾を撃ってみよう) の本文を組み立てて反映する。

build_game_TEMPLATE.py の SPEC を埋めて使う方式。
eyecatch は WP メディア (media_id=5003) を直接参照する。
Part 5 より関数分け（update_play/draw_play）構造を採用。
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

EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-5-19_shoot.png"


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


# ── Python コード（関数分け構造） ──────────────────────────────────────

CODE_STEP1 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Single Bullet")
clock = pygame.time.Clock()
px = 300
bx = 0
by = -100


# ─── update_play.py ────────────────────────────────────────────
import pygame
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    gf.by -= 6
    if pygame.key.get_pressed()[pygame.K_SPACE] and gf.by < 0:
        gf.bx = gf.px + 20
        gf.by = 330


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    if gf.by >= 0:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        gf.screen.blit(_img, (gf.bx, gf.by))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    update_play()
    draw_play()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''

CODE_STEP2 = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Bullet List")
clock = pygame.time.Clock()
px = 300
bullets = []


# ─── update_play.py ────────────────────────────────────────────
import pygame
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        gf.bullets.append([gf.px + 20, 330])
    for b in gf.bullets:
        b[1] = b[1] - 6


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    for b in gf.bullets:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        gf.screen.blit(_img, (b[0], b[1]))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    update_play()
    draw_play()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''

CODE_KADAI_A = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame
import random

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Bullet Hit Enemy")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
bullets = []


# ─── update_play.py ────────────────────────────────────────────
import pygame
import random
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        gf.bullets.append([gf.px + 20, 330])
    gf.ey += 3
    if gf.ey > 400:
        gf.ey = -48
        gf.ex = random.randint(0, 576)
    for b in gf.bullets:
        b[1] = b[1] - 6
        if abs(b[0] - gf.ex) < 30 and abs(b[1] - gf.ey) < 30:
            gf.ey = -48
            gf.ex = random.randint(0, 576)
            b[1] = -1000


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.ex, gf.ey))
    for b in gf.bullets:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        gf.screen.blit(_img, (b[0], b[1]))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    update_play()
    draw_play()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''

CODE_KADAI_B = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Cooldown")
clock = pygame.time.Clock()
px = 300
bullets = []
ctimer = 0


# ─── update_play.py ────────────────────────────────────────────
import pygame
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    if pygame.time.get_ticks() >= gf.ctimer and pygame.key.get_pressed()[pygame.K_SPACE]:
        gf.bullets.append([gf.px + 20, 330])
        gf.ctimer = pygame.time.get_ticks() + 0.3 * 1000
    for b in gf.bullets:
        b[1] = b[1] - 6


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    for b in gf.bullets:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        gf.screen.blit(_img, (b[0], b[1]))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    update_play()
    draw_play()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''

CODE_KADAI_C = '''\
# ─── game_funcs.py ─────────────────────────────────────────────
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("3-Way Shot")
clock = pygame.time.Clock()
px = 300
bullets = []
ctimer = 0


# ─── update_play.py ────────────────────────────────────────────
import pygame
import game_funcs as gf

def update_play():
    if pygame.key.get_pressed()[pygame.K_RIGHT]: gf.px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:  gf.px -= 4
    if pygame.time.get_ticks() >= gf.ctimer and pygame.key.get_pressed()[pygame.K_SPACE]:
        gf.bullets.append([gf.px + 20, 330, -2])
        gf.bullets.append([gf.px + 20, 330,  0])
        gf.bullets.append([gf.px + 20, 330,  2])
        gf.ctimer = pygame.time.get_ticks() + 0.3 * 1000
    for b in gf.bullets:
        b[1] = b[1] - 6
        b[0] = b[0] + b[2]


# ─── draw_play.py ──────────────────────────────────────────────
import pygame
import game_funcs as gf

def draw_play():
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    gf.screen.blit(_img, (gf.px, 330))
    for b in gf.bullets:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        gf.screen.blit(_img, (b[0], b[1]))


# ─── main.py ───────────────────────────────────────────────────
import pygame
import game_funcs as gf
from update_play import update_play
from draw_play import draw_play

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    gf.screen.fill("#0a0a2e")
    update_play()
    draw_play()
    pygame.display.flip()
    gf.clock.tick(60)
pygame.quit()
'''


SPEC = Spec(
    page_id=5002,
    slug="game-19-shoot",
    title="弾を撃ってみよう",
    intro_paragraphs=[
        '⑱ で残機の概念を入れて、ゲームに <code>update_play()</code> と <code>draw_play()</code> の'
        '関数構造を導入しました。今回はその構造を使いながら、'
        'シューティングゲームの花、<strong>弾</strong>を撃てるようにしましょう。',
        'まずは「1 発だけ撃てる」シンプルな仕組みから始めて、'
        'ステップ 2 で <code>リスト</code> を使って何発でも飛ばせるよう改造します。'
        'どちらも <code>update_play()</code> に弾の処理を追加するだけです。',
    ],
    eyecatch_basename="eyecatch_game_19_shoot",  # not used (overridden)
    iframe_xml="game_19_step1_final.xml",
    learn_bullets=[
        '<code>update_play()</code> に弾の発射・移動ロジックを追加する方法',
        '<code>by</code> 変数で 1 発の弾を管理し、画面外で「待機状態」を表す方法',
        '<code>draw_play()</code> に弾の描画を追加する方法',
        '空のリスト <code>bullets = []</code> と <code>append</code> で弾を増やすパターン',
        '<code>for b in bullets:</code> で全部の弾をまとめて動かすイディオム',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='リストで弾を管理するために必要な言葉をまとめます。',
    terms_table=[
        ("リスト（list）", "複数の値を順番に並べて入れておける入れ物。<code>[]</code> で書く", "bullets = []"),
        ("append", "リストの末尾に要素を 1 つ追加するメソッド", "bullets.append([x, y])"),
        ("要素（element）", "リストに入っている 1 個 1 個の値。<code>[x, y]</code> のような小さなリストでも 1 要素", "[320, 330]"),
        ("for ループ", "リストの中身を順番に取り出して処理するブロック", "for b in bullets: ..."),
        ("リスト[番号]", "リストの何番目の要素かを指定して取り出す（0 始まり）", "b[0] は x、b[1] は y"),
    ],
    steps=[
        Step(
            title="update_play() にスペースキーで弾を 1 発撃つ処理を追加する",
            instructions=[
                '変数 <code>bx = 0</code>、<code>by = -100</code>（画面外）を初期化します',
                '<code>update_play()</code> の先頭に <code>global px, bx, by</code> を書きます',
                '<code>update_play()</code> 内で <code>by -= 6</code> を毎フレーム実行し、弾を上に進めます',
                '<code>SPACE</code> キーが押されていて かつ <code>by &lt; 0</code>（待機中）のときに発射位置に戻します',
                '<code>draw_play()</code> に <code>if by &gt;= 0:</code> でくくった弾の描画を追加します',
                '▶ 実行して、SPACE を押すと弾が上に飛び、画面外に出るとまた撃てることを確認しましょう',
            ],
            figure_basename="game_19_step1_final",
            figure_width=1059,
            code=CODE_STEP1,
            step_iframe_xml="game_19_step1_final.xml",
            file_descriptions={
                'game_funcs.py': '共有変数を置く場所です。プレイヤー位置 <code>px</code> に加えて、'
                                 '弾の現在位置 <code>bx</code>・<code>by</code> を初期化します。'
                                 '<code>by = -100</code>（画面外）が「いま弾は飛んでいない（待機状態）」を表すサインになります。',
                'update_play.py': '毎フレームの状態更新を担当します。左右キーで <code>px</code> を動かし、'
                                  '<code>by</code> を毎フレーム 6 ずつ減らして弾を上に進めます。'
                                  '<code>SPACE</code> が押されかつ <code>by &lt; 0</code>（待機中）のときだけ、'
                                  '発射位置（<code>px+20</code>, 330）に戻して再発射します。',
                'draw_play.py': '毎フレームの描画を担当します。プレイヤー画像を描いたあと、'
                                '<code>by &gt;= 0</code> のとき（=飛行中）だけ弾を描画します。'
                                '待機中は <code>by</code> が画面外なので描画はスキップされます。',
                'main.py': 'ゲームループ本体です。各フレームで <code>screen.fill</code> → '
                           '<code>update_play()</code> → <code>draw_play()</code> の順に呼び出すだけのシンプルな構造になりました。',
            },
        ),
        Step(
            title="update_play() をリスト版に改造して連射できるようにする",
            instructions=[
                '変数 <code>bullets = []</code> に変更します（<code>bx</code>, <code>by</code> は不要）',
                '<code>update_play()</code> の <code>global</code> から <code>bx, by</code> を外します（リストは再代入しないため）',
                '<code>update_play()</code> で <code>SPACE</code> が押されたら <code>bullets.append([px + 20, 330])</code>',
                '<code>for b in bullets:</code> で全弾の <code>b[1]</code> を <code>b[1] - 6</code> に更新します',
                '<code>draw_play()</code> で同様に <code>for b in bullets:</code> して全弾を描画します',
                '▶ 実行して、SPACE を押し続けると弾が溜まりながら上に登っていくことを確認しましょう',
            ],
            figure_basename="game_19_step2_final",
            figure_width=1407,
            code=CODE_STEP2,
            file_descriptions={
                'game_funcs.py': '<code>bx</code>・<code>by</code> を捨てて、'
                                 '空のリスト <code>bullets = []</code> を用意します。'
                                 'これが「いま画面に飛んでいる弾全部」の入れ物になります。',
                'update_play.py': '<code>SPACE</code> が押されたら <code>bullets.append([px+20, 330])</code> で'
                                  '弾を 1 つ追加し、<code>for b in bullets:</code> で全弾の <code>b[1]</code> を毎フレーム 6 ずつ減らします。'
                                  'これで「何発でも撃てて、全部が同時に進む」が実現できます。',
                'draw_play.py': '<code>for b in bullets:</code> で全弾を順番に取り出し、'
                                'それぞれの <code>b[0]</code>・<code>b[1]</code> の位置に弾画像を描画します。'
                                '描画ループも update 側と同じ構造になっています。',
            },
        ),
    ],
    kadais=[
        Kadai(
            number="5-20-1",
            title="update_play() に弾と敵の当たり判定を追加しよう",
            lead='敵と組み合わせて、弾が当たったら敵をリスポーンする「シューティングらしさ」を加えましょう。'
                 '<strong>当たり判定も <code>update_play()</code> の <code>for b in bullets:</code> ループの中に追加します。</strong>',
            figure_basename="game_19a_bullet_hit",
            figure_width=1801,
            code=CODE_KADAI_A,
            explanation='<code>update_play()</code> の <code>for b in bullets:</code> の中で、'
                        '<code>abs(b[0] - ex) &lt; 30 and abs(b[1] - ey) &lt; 30</code> で判定します。'
                        '当たったら敵をリスポーン、弾は <code>b[1] = -1000</code> で画面外へ。'
                        '<code>draw_play()</code> は変更不要です。',
            file_descriptions={
                'game_funcs.py': 'プレイヤーと弾リストに加えて、敵の位置 <code>ex</code>・<code>ey</code> と '
                                 '<code>random</code> モジュールを追加します。<code>ey = -48</code> で'
                                 '画面上の外から敵が降ってくる初期状態を作ります。',
                'update_play.py': '敵の落下処理（<code>ey += 3</code>）と、画面下まで来たらランダム位置で'
                                  'リスポーンする処理を加えます。さらに <code>for b in bullets:</code> の中で'
                                  '<code>abs(b[0]-ex)&lt;30 and abs(b[1]-ey)&lt;30</code> による当たり判定を行い、'
                                  '当たれば敵をリスポーン・弾を画面外に飛ばします。',
                'draw_play.py': '敵を描画する 1 行を追加するだけです。プレイヤー → 敵 → 全弾の順に描けば'
                                'シューティング画面の完成です。',
            },
        ),
        Kadai(
            number="5-20-2",
            title="update_play() にクールダウンを追加しよう",
            lead='SPACE 連打で弾が大量発射されるのを抑えるため、<code>ctimer</code> で「0.3 秒に 1 発まで」を実装しましょう。'
                 '⑱ の無敵タイマーと同じパターンです。',
            figure_basename="game_19b_cooldown",
            figure_width=1407,
            code=CODE_KADAI_B,
            explanation='<code>update_play()</code> の <code>global</code> に <code>ctimer</code> を追加し、'
                        '<code>pygame.time.get_ticks() &gt;= ctimer</code> が True のときだけ発射を許可します。'
                        '発射と同時に <code>ctimer = pygame.time.get_ticks() + 0.3 * 1000</code> をセットします。',
            file_descriptions={
                'game_funcs.py': '弾リストに加えて、次に撃てる時刻を記録する <code>ctimer = 0</code> を追加します。'
                                 '⑱の無敵タイマーと同じく「未来の時刻まで撃てない」というパターンの実装です。',
                'update_play.py': '<code>SPACE</code> 単独ではなく <code>pygame.time.get_ticks() &gt;= ctimer</code> '
                                  'と AND を取って発射を許可します。発射と同時に <code>ctimer</code> を「現在時刻 + 0.3 秒」に'
                                  '更新するので、その時刻まで次の弾は出ません。',
            },
        ),
        Kadai(
            number="5-20-3",
            title="update_play() で 3 方向に弾をばらまこう",
            lead='1 回の SPACE で 3 つの弾を扇状に発射しましょう。'
                 'リストの要素を <code>[x, y, vx]</code> の 3 つ組にすると、弾ごとに横方向の速度を持たせられます。',
            figure_basename="game_19c_three_way",
            figure_width=1407,
            code=CODE_KADAI_C,
            explanation='<code>bullets.append([px + 20, 330, -2])</code> のように <code>vx</code> を 3 つ目の要素として持たせます。'
                        '<code>update_play()</code> の <code>for b in bullets:</code> で '
                        '<code>b[0] = b[0] + b[2]</code> を追加すれば弾が斜めに広がります。',
            file_descriptions={
                'game_funcs.py': 'クールダウン版と同じく <code>bullets = []</code> と <code>ctimer = 0</code> を用意します。'
                                 '違いは update 側のリストの中身（要素数 3 になる）だけで、初期化は変わりません。',
                'update_play.py': '1 回の発射で <code>[x, y, -2]</code>・<code>[x, y, 0]</code>・<code>[x, y, 2]</code> の'
                                  '3 つを <code>append</code> します。<code>for b in bullets:</code> で <code>b[1] -= 6</code> '
                                  '（上昇）に加えて <code>b[0] += b[2]</code>（横移動）を行うと、'
                                  '弾ごとに違う <code>vx</code> で扇状に広がります。',
            },
        ),
    ],
    summary_bullets=[
        '<code>update_play()</code> に弾の処理を追加するだけで発射機能が実装できる',
        '<code>bullets = []</code> + <code>append</code> + <code>for</code> は Python でリストを使う基本パターン',
        'リストの要素を <code>[x, y, vx]</code> にすると 1 個 1 個の弾に独立した状態を持たせられる',
        '処理を関数に分けることで「どこを変えればいいか」が常に明確になる',
    ],
    next_article_id=4998,
    next_article_title='Part 5「改造道場」インデックス',
    cache_buster="20260508e",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title="【Pygameでゲーム⑳】弾を撃ってみよう")
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
