#!/usr/bin/env python3
"""WP 記事 (Pygame㉒ 敵AIを作ろう) の本文を組み立てて反映する。

build_game_TEMPLATE.py の SPEC を埋めて使う方式。
--push で WP に反映（初回は wp_create で新規作成、以降は wp_update）。
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
    _iframe,
    _kadai_section,
    _step_section,
    _wp_h2,
    _wp_html,
    _wp_p,
    _wp_table,
    _wp_ul,
)
from build_helpers import wp_create, wp_get, wp_update  # noqa: E402

PAGE_ID = 5148
EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-5-22_enemy_ai.png"


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
    sections.append(_wp_p(
        f'下の <a href="{PYCOBLOCKS_HOME}">PycoBlocks</a> を開いて、'
        '今回のサンプルブロックを読み込んだ状態から始めましょう。'
    ))
    sections.append(_wp_html(_iframe(spec.iframe_xml)))
    sections.append(_wp_h2("この記事で学ぶこと"))
    sections.append(_wp_ul(spec.learn_bullets))
    sections.append(_wp_h2(spec.terms_h2))
    sections.append(_wp_p(spec.terms_intro))
    sections.append(_wp_table(spec.terms_table))
    for idx, step in enumerate(spec.steps, start=1):
        sections.append(_step_section(idx, step, spec.cache_buster))
    sections.append(_wp_h2("演習課題"))
    for k in spec.kadais:
        sections.append(_kadai_section(k, spec.cache_buster))
    sections.append(_wp_h2("まとめ"))
    sections.append(_wp_ul(spec.summary_bullets))
    next_url = f"https://sakigake-robo.com/?p={spec.next_article_id}"
    sections.append(_wp_p(
        f'次の記事 → <a href="{next_url}">{spec.next_article_title}</a>'
    ))
    return "\n\n".join(sections)


# ── Python コード ─────────────────────────────────────────────────

CODE_STEP1 = '''\
import pygame
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Chase Enemy")
clock = pygame.time.Clock()
px = 300
py = 176
ex = 100
ey = 100
score = 0
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
        if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
        if pygame.key.get_pressed()[pygame.K_UP]:    py -= 4
        if pygame.key.get_pressed()[pygame.K_DOWN]:  py += 4
        if px < 0:   px = 0
        if px > 592: px = 592
        if py < 0:   py = 0
        if py > 352: py = 352
        if ex < px: ex += 2
        if ex > px: ex -= 2
        if ey < py: ey += 2
        if ey > py: ey -= 2
        score += 1
        if abs(px - ex) < 40 and abs(py - ey) < 40:
            state = "over"
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _img = pygame.transform.scale(_img, (48, 48))
        screen.blit(_img, (px, py))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _img = pygame.transform.scale(_img, (40, 40))
        screen.blit(_img, (ex, ey))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (10, 10))
    elif state == "over":
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("GAME OVER", True, "#ff3c3c"), (190, 160))
        _f = pygame.font.SysFont(None, 32)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (260, 220))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_STEP2 = '''\
import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("3 Enemies")
clock = pygame.time.Clock()
px = 300
py = 176
enemies = [[random.randint(0, 560), random.randint(0, 360)],
           [random.randint(0, 560), random.randint(0, 360)],
           [random.randint(0, 560), random.randint(0, 360)]]
score = 0
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
        if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
        if pygame.key.get_pressed()[pygame.K_UP]:    py -= 4
        if pygame.key.get_pressed()[pygame.K_DOWN]:  py += 4
        if px < 0:   px = 0
        if px > 592: px = 592
        if py < 0:   py = 0
        if py > 352: py = 352
        score += 1
        for e in enemies:
            if e[0] < px: e[0] += 1
            if e[0] > px: e[0] -= 1
            if e[1] < py: e[1] += 1
            if e[1] > py: e[1] -= 1
            if abs(px - e[0]) < 40 and abs(py - e[1]) < 40:
                state = "over"
            _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
            _img = pygame.transform.scale(_img, (40, 40))
            screen.blit(_img, (e[0], e[1]))
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _img = pygame.transform.scale(_img, (48, 48))
        screen.blit(_img, (px, py))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (10, 10))
    elif state == "over":
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("GAME OVER", True, "#ff3c3c"), (190, 160))
        _f = pygame.font.SysFont(None, 32)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (260, 220))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_A = '''\
import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Speed Up")
clock = pygame.time.Clock()
px = 300
py = 176
ex = 100
ey = 100
score = 0
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
        if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
        if pygame.key.get_pressed()[pygame.K_UP]:    py -= 4
        if pygame.key.get_pressed()[pygame.K_DOWN]:  py += 4
        if px < 0:   px = 0
        if px > 592: px = 592
        if py < 0:   py = 0
        if py > 352: py = 352
        score += 1
        sp = 2 + score // 300
        if ex < px: ex += sp
        if ex > px: ex -= sp
        if ey < py: ey += sp
        if ey > py: ey -= sp
        if abs(px - ex) < 40 and abs(py - ey) < 40:
            state = "over"
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _img = pygame.transform.scale(_img, (48, 48))
        screen.blit(_img, (px, py))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _img = pygame.transform.scale(_img, (40, 40))
        screen.blit(_img, (ex, ey))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render(f"Score: {score // 60}  Speed: {sp}", True, "#ffffff"), (10, 10))
    elif state == "over":
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("GAME OVER", True, "#ff3c3c"), (190, 160))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_B = '''\
import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Shoot Enemy")
clock = pygame.time.Clock()
px = 300
py = 340
ex = 100
ey = 60
bx = -100
by = -100
bactive = False
score = 0
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            if not bactive:
                bx = px + 12
                by = py
                bactive = True
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
        if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
        if px < 0:   px = 0
        if px > 592: px = 592
        if ex < px: ex += 1
        if ex > px: ex -= 1
        if ey < py: ey += 1
        if ey > py: ey -= 1
        if bactive:
            by -= 8
            if by < -20: bactive = False
            if abs(bx - ex) < 30 and abs(by - ey) < 30:
                score += 10
                bactive = False
                ex = random.randint(0, 560)
                ey = random.randint(0, 180)
        if abs(px - ex) < 40 and abs(py - ey) < 40:
            state = "over"
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _img = pygame.transform.scale(_img, (48, 48))
        screen.blit(_img, (px, py))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _img = pygame.transform.scale(_img, (40, 40))
        screen.blit(_img, (ex, ey))
        if bactive:
            _img = pygame.image.load("assets/game-icons/bullet.svg")
            _img = pygame.transform.scale(_img, (12, 20))
            screen.blit(_img, (bx, by))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render(f"Score: {score}", True, "#ffffff"), (10, 10))
    elif state == "over":
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("GAME OVER", True, "#ff3c3c"), (190, 160))
        _f = pygame.font.SysFont(None, 32)
        screen.blit(_f.render(f"Score: {score}", True, "#ffffff"), (260, 220))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_C = '''\
import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Patrol Enemy")
clock = pygame.time.Clock()
px = 300
py = 176
ex = 200
ey = 200
edx = 2
score = 0
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_LEFT]:  px -= 4
        if pygame.key.get_pressed()[pygame.K_RIGHT]: px += 4
        if pygame.key.get_pressed()[pygame.K_UP]:    py -= 4
        if pygame.key.get_pressed()[pygame.K_DOWN]:  py += 4
        if px < 0:   px = 0
        if px > 592: px = 592
        if py < 0:   py = 0
        if py > 352: py = 352
        score += 1
        ex += edx
        if ex < 0 or ex > 560: edx = -edx
        if abs(px - ex) < 40 and abs(py - ey) < 40:
            state = "over"
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _img = pygame.transform.scale(_img, (48, 48))
        screen.blit(_img, (px, py))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _img = pygame.transform.scale(_img, (40, 40))
        screen.blit(_img, (ex, ey))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (10, 10))
    elif state == "over":
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("GAME OVER", True, "#ff3c3c"), (190, 160))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''


SPEC = Spec(
    page_id=PAGE_ID,
    slug="game-21-enemy-ai",
    title="敵AIを作ろう",
    intro_paragraphs=[
        '⑳ で弾を撃てるようにして、⑲ で体力制を導入しました。'
        '今度は<strong>敵に知性を与え</strong>ましょう。'
        '敵が自動でプレイヤーを追いかけてくるだけで、ゲームの緊張感はまるで変わります。',
        'ステップ 1 では 1 体の敵にシンプルな<strong>追跡 AI</strong>（プレイヤーに向かって少しずつ近づく）を実装し、'
        'ステップ 2 では追跡する敵を<strong>3 体</strong>に増やしてリスト管理します。'
        '生き延びた秒数がスコアになります。',
    ],
    eyecatch_basename="eyecatch_game_21_enemy_ai",
    iframe_xml="game_21_step1_final.xml",
    learn_bullets=[
        '<code>if ex &lt; px: ex += 2</code> の 2 行だけで作るシンプル追跡 AI の仕組み',
        '追跡速度と当たり判定の半径でゲームの難しさを調整する方法',
        '<code>score // 60</code> で「フレーム数 ÷ FPS」を秒数スコアに換算する方法',
        '<code>enemies</code> リストで複数の敵を管理し、<code>for</code> で一括処理する方法',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='敵の AI と動きまわりのキーワードを確認しましょう。',
    terms_table=[
        ("追跡 AI（Chase AI）", "プレイヤーの座標に向かって毎フレーム少し移動する最小限の AI。速度が小さいほど「のっそり」した動きになる", "if ex < px: ex += 2"),
        ("追跡速度（chase speed）", "1 フレームで近づく量。大きいほど速い。スコアで上げると難易度が自然に上昇する", "sp = 2 + score // 300"),
        ("生存スコア", "死なずに生き延びたフレーム数（÷60 で秒数）をスコアとして表示するパターン", "score // 60"),
        ("往復移動（patrol）", "端に着いたら向きを反転するだけの単純パターン。追跡と組み合わせると動きが多様になる", "if ex < 0 or ex > 560: edx = -edx"),
    ],
    steps=[
        Step(
            title="1 体の敵がプレイヤーを追いかける",
            instructions=[
                '変数 <code>ex = 100</code> / <code>ey = 100</code> で敵の初期位置を設定します',
                'ゲームループ内で <code>if ex &lt; px: ex += 2</code> / <code>if ex &gt; px: ex -= 2</code> を実装します。y 方向も同様です',
                'プレイヤーと敵の距離が <code>abs(px - ex) &lt; 40</code> かつ <code>abs(py - ey) &lt; 40</code> なら <code>state = "over"</code> にします',
                '<code>score += 1</code> を毎フレーム加算し、表示は <code>score // 60</code> で秒数換算します',
                '▶ 実行して、敵がじわじわ近づいてくることを確認しましょう',
            ],
            figure_basename="game_21_step1_final",
            figure_width=1454,
            code=CODE_STEP1,
        ),
        Step(
            title="敵を 3 体に増やしてリストで管理する",
            instructions=[
                '<code>enemies = [[x, y], [x, y], [x, y]]</code> でランダム位置の敵リストを作ります',
                '<code>for e in enemies:</code> のループ内で追跡 AI・衝突判定・描画をまとめて処理します',
                'プレイヤー描画は <code>for</code> ループの<strong>外（後）</strong>に書くと、プレイヤーが敵の上に表示されます',
                '▶ 実行して、3 方向から迫る敵をかわしながらスコアを稼いでみましょう',
            ],
            figure_basename="game_21_step2_final",
            figure_width=1139,
            code=CODE_STEP2,
        ),
    ],
    kadais=[
        Kadai(
            number="5-22-1",
            title="スコアが上がるにつれて敵を速くしよう",
            lead='生き延びるほど敵が速くなって難易度が上がるようにしましょう。'
                 '<code>sp = 2 + score // 300</code> を計算して追跡速度として使います。',
            figure_basename="game_21a_speed_up",
            figure_width=1454,
            code=CODE_KADAI_A,
            explanation='<code>score // 300</code> は 300 フレーム（= 5 秒）ごとに 1 増えます。'
                        '<code>sp</code> を追跡 AI の移動量として使うと、序盤はのんびり、後半は素早い敵になります。'
                        '<strong>HUD にも速度を表示</strong>すると、プレイヤーが「やばい、速くなった！」と感じる緊張感が生まれます。',
        ),
        Kadai(
            number="5-22-2",
            title="弾を撃って敵を倒せるようにしよう",
            lead='⑳ の弾発射コードと組み合わせて、<strong>スペースキーで弾を撃ち</strong>、'
                 '弾が敵に当たったら <code>score += 10</code> で得点して敵をリセットします。',
            figure_basename="game_21b_shoot_enemy",
            figure_width=1429,
            code=CODE_KADAI_B,
            explanation='弾の当たり判定は <code>abs(bx - ex) &lt; 30 and abs(by - ey) &lt; 30</code> で表現します。'
                        '当たったら <code>bactive = False</code> で弾を消し、敵をランダム位置に再配置します。'
                        '追跡する敵を「撃ち落とす」緊張感と「弾切れで逃げる」駆け引きが同時に楽しめます。',
        ),
        Kadai(
            number="5-22-3",
            title="往復パターンで動く敵を追加しよう",
            lead='追いかけてくる敵とは別に、<strong>左右に往復する敵</strong>を追加しましょう。'
                 '<code>edx</code>（移動方向）を持たせて、壁に当たったら反転します。',
            figure_basename="game_21c_patrol",
            figure_width=1454,
            code=CODE_KADAI_C,
            explanation='<code>ex += edx</code> で毎フレーム移動し、'
                        '<code>if ex &lt; 0 or ex &gt; 560: edx = -edx</code> で方向転換します。'
                        'これは⑨「速度と反射」で学んだ反射の応用です。'
                        '「追いかける敵」と「往復する敵」を組み合わせると、'
                        '攻略パターンが増えてゲームが一気に面白くなります。',
        ),
    ],
    summary_bullets=[
        '<code>if ex &lt; px: ex += speed</code> という 2 行が追跡 AI の本質。速度を変えるだけで難易度を調整できる',
        '<code>enemies</code> リストと <code>for</code> ループを使えば、敵の数が増えてもコードは同じ構造で済む',
        '<code>score // 60</code> で生存秒数スコア、<code>score // 300</code> で 5 秒ごとの速度アップなど、FPS を使った時間計算を覚えておくと便利',
    ],
    next_article_id=5150,
    next_article_title='【Pygameでゲーム㉓】BGMと効果音を追加しよう',
    cache_buster="20260507j",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true")
    ap.add_argument("--create", action="store_true", help="WP に新規ページを作成してIDを取得")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built ({SPEC.slug}): {len(new_content)} chars")

    if args.create:
        pid = wp_create(f"【Pygameでゲーム㉒】{SPEC.title}", new_content, status="draft")
        print(f"新規ページ作成: PAGE_ID = {pid}")
        print("build_game_21.py の PAGE_ID をこの値に変更して --push で更新してください")
    elif args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title=f"【Pygameでゲーム㉒】{SPEC.title}")
        print("反映完了（status=draft）。WP 管理画面で公開してください。")
    else:
        print("\n--- 先頭 600 文字プレビュー ---")
        print(new_content[:600])
        print("\n(dry-run) --create で新規作成 / --push で既存ページ更新")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
