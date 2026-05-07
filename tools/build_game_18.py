#!/usr/bin/env python3
"""WP 記事 5000 (Pygame⑱ ライフ制とリスポーン) の本文を組み立てて反映する。

build_game_TEMPLATE.py の SPEC を埋めて使う方式。
eyecatch は WP メディア (media_id=4999) を直接参照する。
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
from build_helpers import wp_get, wp_update  # noqa: E402

EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-5-18_lives.png"


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


# ── Python コード（xml_to_pygame.py 出力をそのまま貼る）──────────────

CODE_STEP1 = '''import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives System")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
lives = 3
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_RIGHT]:
            px += 4
        if pygame.key.get_pressed()[pygame.K_LEFT]:
            px -= 4
        ey += 3
        if ey > 400:
            ey = -48
            ex = random.randint(0, 576)
        if abs(px - ex) < 40 and abs(330 - ey) < 40:
            lives -= 1
            ey = -48
            ex = random.randint(0, 576)
            if lives <= 0:
                state = "over"
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (px, 330))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (ex, ey))
    else:
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render(f'Lives: {lives}', True, "#ffffff"), (10, 10))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_STEP2 = '''import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Lives + Invincible")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
lives = 3
itimer = 0
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_RIGHT]:
            px += 4
        if pygame.key.get_pressed()[pygame.K_LEFT]:
            px -= 4
        ey += 3
        if ey > 400:
            ey = -48
            ex = random.randint(0, 576)
        if pygame.time.get_ticks() >= itimer and abs(px - ex) < 40 and abs(330 - ey) < 40:
            lives -= 1
            ey = -48
            ex = random.randint(0, 576)
            itimer = pygame.time.get_ticks() + 1 * 1000
            if lives <= 0:
                state = "over"
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (px, 330))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (ex, ey))
    else:
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render(f'Lives: {lives}', True, "#ffffff"), (10, 10))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_A = '''import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Heart HUD")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
lives = 3
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_RIGHT]:
            px += 4
        if pygame.key.get_pressed()[pygame.K_LEFT]:
            px -= 4
        ey += 3
        if ey > 400:
            ey = -48
            ex = random.randint(0, 576)
        if abs(px - ex) < 40 and abs(330 - ey) < 40:
            lives -= 1
            ey = -48
            ex = random.randint(0, 576)
            if lives <= 0:
                state = "over"
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (px, 330))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (ex, ey))
    else:
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    for i in range(lives):
        _img = pygame.image.load("assets/game-icons/heart.svg")
        _rw = 30; _rh = 30
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (10 + i * 36, 10))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_B = '''import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Heart Heal Item")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
hx = random.randint(0, 600)
hy = -200
lives = 3
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_RIGHT]:
            px += 4
        if pygame.key.get_pressed()[pygame.K_LEFT]:
            px -= 4
        ey += 3
        hy += 2
        if ey > 400:
            ey = -48
            ex = random.randint(0, 576)
        if hy > 400:
            hy = -200
            hx = random.randint(0, 600)
        if abs(px - ex) < 40 and abs(330 - ey) < 40:
            lives -= 1
            ey = -48
            ex = random.randint(0, 576)
            if lives <= 0:
                state = "over"
        if abs(px - hx) < 36 and abs(330 - hy) < 36:
            if lives < 5:
                lives += 1
            hy = -200
            hx = random.randint(0, 600)
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (px, 330))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (ex, ey))
        _img = pygame.image.load("assets/game-icons/heart.svg")
        _rw = 36; _rh = 36
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (hx, hy))
    else:
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render(f'Lives: {lives}', True, "#ffffff"), (10, 10))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_C = '''import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Slow When Invincible")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
lives = 3
itimer = 0
state = "play"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if state == "play":
        if pygame.key.get_pressed()[pygame.K_RIGHT]:
            px += 4
        if pygame.key.get_pressed()[pygame.K_LEFT]:
            px -= 4
        if pygame.time.get_ticks() >= itimer:
            ey += 3
        else:
            ey += 1
        if ey > 400:
            ey = -48
            ex = random.randint(0, 576)
        if pygame.time.get_ticks() >= itimer and abs(px - ex) < 40 and abs(330 - ey) < 40:
            lives -= 1
            ey = -48
            ex = random.randint(0, 576)
            itimer = pygame.time.get_ticks() + 2 * 1000
            if lives <= 0:
                state = "over"
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (px, 330))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _rw = 48; _rh = 48
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (ex, ey))
    else:
        _f = pygame.font.SysFont(None, 40)
        screen.blit(_f.render("GAME OVER", True, "#ff3232"), (220, 160))
    _f = pygame.font.SysFont(None, 24)
    screen.blit(_f.render(f'Lives: {lives}', True, "#ffffff"), (10, 10))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''


SPEC = Spec(
    page_id=5000,
    slug="game-18-lives",
    title="ライフ制とリスポーン",
    intro_paragraphs=[
        '記事⑬では <code>state</code> 変数で「PLAY → GAME OVER」の遷移を作りました。'
        'けれど 1 回当たっただけで終わってしまうと、難しすぎて遊びづらいゲームになりがちです。'
        '今回はアクションゲームの定番、<strong>3 機制</strong>に改造していきます。',
        'さらに被弾直後の<strong>無敵時間</strong>もタイマーで実装し、連続ヒットで一瞬で残機が溶けるのを防ぎます。'
        'ここから Part 5「改造道場」のスタートです。',
    ],
    eyecatch_basename="eyecatch_game_18_lives",  # not used (overridden)
    iframe_xml="game_18_step1_final.xml",
    learn_bullets=[
        '残機（<code>lives</code> 変数）で複数回の被弾を許容する仕組みを作る',
        '被弾時に敵をリスポーンさせ、<code>lives ≤ 0</code> でゲームオーバーへ遷移する',
        '<code>game_timer_set</code> と <code>game_timer_done</code> で無敵時間を実装する',
        '画面左上に「Lives: N」のような HUD を表示する',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='ライフ制と無敵タイマーで使う言葉をまとめます。',
    terms_table=[
        ("lives", "残りの機数（ライフ）を保持する数値変数", "lives = 3"),
        ("リスポーン", "被弾後に敵やプレイヤーを初期位置から再出現させる処理", "ey = -48; ex = random"),
        ("無敵時間", "被弾直後の短い時間、ダメージを受けない仕組み", "1 秒間"),
        ("game_timer_set", "「現在時刻 + N 秒」を期限変数に代入するブロック", "itimer を 1 秒後にセット"),
        ("game_timer_done", "期限変数の時刻を過ぎたら True を返すブロック", "if timer_done(itimer):"),
    ],
    steps=[
        Step(
            title="ライフを 3 つにして、当たったらリスポーン",
            instructions=[
                '変数 <code>lives</code> を <code>3</code> に初期化します（ゲームループの外）',
                '衝突したら <code>lives -= 1</code> し、敵をランダム位置にリスポーンさせます',
                '<code>lives &lt;= 0</code> になったタイミングで <code>state = "over"</code> に切り替えます',
                '画面左上に <code>f"Lives: {lives}"</code> を <code>game_draw_text</code> で表示します',
                '▶ 実行して、3 回当たるまでゲームが続くこと、HUD のカウントが減ることを確認しましょう',
            ],
            figure_basename="game_18_step1_final",
            figure_width=1429,
            code=CODE_STEP1,
        ),
        Step(
            title="無敵タイマーで連続ヒットを防ぐ",
            instructions=[
                '変数 <code>itimer</code> を <code>0</code> に初期化します（ゲーム開始直後は無敵ではない状態）',
                '衝突判定に <code>game_timer_done(itimer)</code> を AND 条件で追加し、無敵中はダメージを受けないようにします',
                '被弾したときに <code>game_timer_set</code> で「1 秒後」を <code>itimer</code> にセットします',
                '▶ 実行して、敵に当たった直後の 1 秒間だけ「すり抜け」が起きることを確認しましょう',
            ],
            figure_basename="game_18_step2_final",
            figure_width=1831,
            code=CODE_STEP2,
        ),
    ],
    kadais=[
        Kadai(
            number="5-18-1",
            title="ハートアイコンで残機を表示する",
            lead='「Lives: N」のテキスト HUD を、<code>heart.svg</code> アイコンを 3 つ並べる表示に改造してみましょう。残機が減ったら左から順に消えていく見た目になればゴールです。',
            figure_basename="game_18a_heart_hud",
            figure_width=1460,
            code=CODE_KADAI_A,
            explanation='<code>pico_for_from_to</code> で <code>i</code> を <code>0</code> から <code>lives</code> 未満まで回し、ハート画像を <code>10 + i * 36</code> の x 座標に描画します。間隔を一定にしてループで描くと、ライフ数に応じて自動的に表示数が変わります。',
        ),
        Kadai(
            number="5-18-2",
            title="ハートを拾うとライフ +1（最大 5）",
            lead='画面の上から落ちてくるハートを拾うと <code>lives</code> が 1 増える「回復アイテム」を追加してみましょう。最大 5 機まで増やせる上限も付けると、バランスが取りやすくなります。',
            figure_basename="game_18b_heart_heal",
            figure_width=1430,
            code=CODE_KADAI_B,
            explanation='ハート用に <code>hx</code>, <code>hy</code> という位置変数を作り、敵と同じ要領で落下と当たり判定を実装します。プレイヤーと衝突したときに <code>lives &lt; 5</code> なら <code>lives += 1</code>、その後にハートを画面外へリスポーンさせれば「拾える」感覚が出ます。',
        ),
        Kadai(
            number="5-18-3",
            title="無敵中だけ敵がスローモーションに",
            lead='無敵時間の効果をもっと体感できるよう、無敵中は敵の落下速度を遅くしてみましょう。「ヒットストップ」のような演出が作れます。',
            figure_basename="game_18c_slow_invincible",
            figure_width=1831,
            code=CODE_KADAI_C,
            explanation='<code>pico_if/else</code> で <code>game_timer_done(itimer)</code> の真偽に応じて <code>ey</code> の増分を切り替えます。True（無敵が切れた状態）なら <code>+3</code>、False（無敵中）なら <code>+1</code> にすると、被弾直後だけ世界がスローに見える演出になります。<code>game_timer_set</code> の秒数を 2 秒にすると効果がより分かりやすいです。',
        ),
    ],
    summary_bullets=[
        '残機を変数で管理すると、1 回のミスで終わらない柔軟なゲームが作れます',
        'リスポーンは「敵やアイテムの座標を初期値に戻す」だけのシンプルな処理です',
        '<code>game_timer_set</code> と <code>game_timer_done</code> を組み合わせると、無敵時間や効果時間といった時間制御が短く書けます',
    ],
    next_article_id=4998,
    next_article_title='Part 5「改造道場」インデックス',
    cache_buster="20260507i",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="WP に反映する（既定は dry-run）")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built page {SPEC.page_id} ({SPEC.slug}): {len(new_content)} chars")

    if args.push:
        wp_update(SPEC.page_id, new_content, status="draft")
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
