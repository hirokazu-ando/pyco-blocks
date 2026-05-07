#!/usr/bin/env python3
"""WP 記事 5002 (Pygame⑲ 弾を撃ってみよう) の本文を組み立てて反映する。

build_game_TEMPLATE.py の SPEC を埋めて使う方式。
eyecatch は WP メディア (media_id=5003) を直接参照する。
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
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Single Bullet")
clock = pygame.time.Clock()
px = 300
bx = 0
by = -100
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if pygame.key.get_pressed()[pygame.K_RIGHT]:
        px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:
        px -= 4
    by -= 6
    if pygame.key.get_pressed()[pygame.K_SPACE] and by < 0:
        bx = px + 20
        by = 330
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    screen.blit(_img, (px, 330))
    if by >= 0:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (bx, by))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_STEP2 = '''import pygame
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Bullet List")
clock = pygame.time.Clock()
px = 300
bullets = []
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if pygame.key.get_pressed()[pygame.K_RIGHT]:
        px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:
        px -= 4
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        bullets.append([px + 20, 330])
    for b in bullets:
        b[1] = b[1] - 6
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    screen.blit(_img, (px, 330))
    for b in bullets:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (b[0], b[1]))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_A = '''import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Bullet Hit Enemy")
clock = pygame.time.Clock()
px = 300
ex = random.randint(0, 576)
ey = -48
bullets = []
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if pygame.key.get_pressed()[pygame.K_RIGHT]:
        px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:
        px -= 4
    if pygame.key.get_pressed()[pygame.K_SPACE]:
        bullets.append([px + 20, 330])
    ey += 3
    if ey > 400:
        ey = -48
        ex = random.randint(0, 576)
    for b in bullets:
        b[1] = b[1] - 6
        if abs(b[0] - ex) < 30 and abs(b[1] - ey) < 30:
            ey = -48
            ex = random.randint(0, 576)
            b[1] = -1000
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    screen.blit(_img, (px, 330))
    _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    screen.blit(_img, (ex, ey))
    for b in bullets:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (b[0], b[1]))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_B = '''import pygame
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Cooldown")
clock = pygame.time.Clock()
px = 300
bullets = []
ctimer = 0
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if pygame.key.get_pressed()[pygame.K_RIGHT]:
        px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:
        px -= 4
    if pygame.time.get_ticks() >= ctimer and pygame.key.get_pressed()[pygame.K_SPACE]:
        bullets.append([px + 20, 330])
        ctimer = pygame.time.get_ticks() + 0.3 * 1000
    for b in bullets:
        b[1] = b[1] - 6
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    screen.blit(_img, (px, 330))
    for b in bullets:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (b[0], b[1]))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_C = '''import pygame
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("3-Way Shot")
clock = pygame.time.Clock()
px = 300
bullets = []
ctimer = 0
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill("#0a0a2e")
    if pygame.key.get_pressed()[pygame.K_RIGHT]:
        px += 4
    if pygame.key.get_pressed()[pygame.K_LEFT]:
        px -= 4
    if pygame.time.get_ticks() >= ctimer and pygame.key.get_pressed()[pygame.K_SPACE]:
        bullets.append([px + 20, 330, -2])
        bullets.append([px + 20, 330, 0])
        bullets.append([px + 20, 330, 2])
        ctimer = pygame.time.get_ticks() + 0.3 * 1000
    for b in bullets:
        b[1] = b[1] - 6
        b[0] = b[0] + b[2]
    _img = pygame.image.load("assets/game-icons/player_ship.svg")
    _rw = 48; _rh = 48
    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
    screen.blit(_img, (px, 330))
    for b in bullets:
        _img = pygame.image.load("assets/game-icons/bullet.svg")
        _rw = 16; _rh = 24
        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img
        screen.blit(_img, (b[0], b[1]))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''


SPEC = Spec(
    page_id=5002,
    slug="game-19-shoot",
    title="弾を撃ってみよう",
    intro_paragraphs=[
        '⑲ で残機の概念を入れたら、次は反撃です。シューティングゲームの花、'
        '<strong>弾</strong>を撃てるようにしましょう。'
        'まずは「1 発だけ撃てる」シンプルな仕組みから始めて、ステップ 2 で '
        '<code>リスト</code> を使って何発でも飛ばせるように改造していきます。',
        'リストを使うと、画面上に存在する弾を全部まとめて管理できます。'
        '<code>append</code> で弾を増やし、<code>for</code> 文でまとめて動かす '
        '——リスト操作の典型的なパターンを、ゲームを通して体感していきましょう。',
    ],
    eyecatch_basename="eyecatch_game_19_shoot",  # not used (overridden)
    iframe_xml="game_19_step1_final.xml",
    learn_bullets=[
        '<code>by</code> 変数で 1 発の弾を管理し、画面外で「待機状態」を表す方法',
        'スペースキーで発射、画面外に出たら再度撃てるようにする「弾の使い回し」',
        '空のリスト <code>bullets = []</code> と <code>append</code> を使って弾を増やす方法',
        '<code>for b in bullets:</code> で全部の弾をまとめて動かすパターン',
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
            title="スペースキーで弾を 1 発撃つ",
            instructions=[
                '変数 <code>bx</code>、<code>by</code> を作り、初期値を <code>bx = 0</code> / <code>by = -100</code>（画面外）にします',
                'ループの先頭で <code>by -= 6</code> を毎フレーム実行し、弾を上方向に進めます',
                '<code>SPACE</code> キーが押されていて かつ <code>by &lt; 0</code>（画面外で待機中）のときに、<code>bx = px + 20</code> / <code>by = 330</code> で発射位置に戻します',
                '弾の描画は <code>by &gt;= 0</code> のとき（画面内にあるとき）だけ行うように <code>if</code> でくくります',
                '▶ 実行して、SPACE を押すと弾が 1 発上に飛び、画面外に出るとまた撃てるようになることを確認しましょう',
            ],
            figure_basename="game_19_step1_final",
            figure_width=1059,
            code=CODE_STEP1,
        ),
        Step(
            title="リストで複数の弾を連射する",
            instructions=[
                '変数 <code>bullets</code> を空リスト <code>[]</code> に初期化します',
                '<code>SPACE</code> キーが押されたら <code>bullets.append([px + 20, 330])</code> でリストに新しい弾を追加します',
                '<code>for b in bullets:</code> ループで全部の弾の <code>b[1]</code>（y 座標）を <code>b[1] - 6</code> に更新します',
                '描画も別の <code>for b in bullets:</code> で回し、<code>(b[0], b[1])</code> の位置に弾画像を描きます',
                '▶ 実行して、SPACE を押し続けると弾がリストに溜まりながら上に登っていくことを確認しましょう',
            ],
            figure_basename="game_19_step2_final",
            figure_width=1407,
            code=CODE_STEP2,
        ),
    ],
    kadais=[
        Kadai(
            number="5-20-1",
            title="弾を当てて敵を消そう",
            lead='⑪ で作った敵キャラと組み合わせて、弾が当たったら敵をリスポーンさせる「シューティングらしさ」を加えましょう。各弾と敵の距離を判定して、当たったら敵を初期位置へ戻します。',
            figure_basename="game_19a_bullet_hit",
            figure_width=1801,
            code=CODE_KADAI_A,
            explanation='<code>for b in bullets:</code> の中で、弾の <code>b[0], b[1]</code> と敵の <code>ex, ey</code> の距離を <code>abs</code> で比較します。当たったら敵をランダムにリスポーン、当たった弾は <code>b[1] = -1000</code> として画面外へ追いやれば「消えた」ように見えます。',
        ),
        Kadai(
            number="5-20-2",
            title="連射しすぎを防ぐクールダウン",
            lead='SPACE 連打で弾が一気に大量発射されてしまうのを抑えるため、<code>game_timer_set</code> と <code>game_timer_done</code> で「<strong>0.3 秒に 1 発まで</strong>」のクールダウンを実装しましょう。⑱ の無敵タイマーと同じパターンです。',
            figure_basename="game_19b_cooldown",
            figure_width=1407,
            code=CODE_KADAI_B,
            explanation='変数 <code>ctimer</code> を作り、<code>game_timer_done(ctimer)</code> が True のときだけ発射を許可します。発射と同時に <code>game_timer_set</code> で 0.3 秒後を <code>ctimer</code> にセットすれば、その間は再発射できなくなります。',
        ),
        Kadai(
            number="5-20-3",
            title="3 方向に弾をばらまく",
            lead='1 回の SPACE で <strong>3 つの弾</strong>を扇状に発射するようにしてみましょう。リストの要素を <code>[x, y, vx]</code> の 3 つ組にすると、弾ごとに横方向の速度を持たせられます。',
            figure_basename="game_19c_three_way",
            figure_width=1407,
            code=CODE_KADAI_C,
            explanation='<code>bullets.append([px + 20, 330, -2])</code> のように、x 速度を 3 つ目の要素として持たせます。<code>for b in bullets:</code> の中で <code>b[0] = b[0] + b[2]</code> を毎フレーム実行すれば、弾が斜めに広がります。<code>vx</code> を <code>-2 / 0 / 2</code> の 3 種類にすると、ちょうど扇形にばらけます。',
        ),
    ],
    summary_bullets=[
        '画面外で「待機」させて使い回せば、変数 1 つで 1 発の弾は十分管理できます',
        '<code>bullets = []</code> + <code>append</code> + <code>for</code> の組み合わせは、ゲーム以外でも頻出する Python の基本パターンです',
        'リストの各要素を <code>[x, y, vx]</code> のように <strong>サブリスト</strong>にすると、1 個 1 個の弾に独立した状態を持たせられます',
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
