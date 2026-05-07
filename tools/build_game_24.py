#!/usr/bin/env python3
"""WP 記事 (Pygame㉕ タイトル画面を作ろう) の本文を組み立てて反映する。

--push で WP に反映（初回は --create で新規作成してから使う）。
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
from build_helpers import wp_create, wp_update  # noqa: E402

PAGE_ID      = 5154   # wp_create 後に確定したIDを設定
EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-5-25_title.png"


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


# ── Python コード ─────────────────────────────────────────────────────

CODE_STEP1 = '''\
import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("追いかけゲーム")
clock = pygame.time.Clock()
pygame.mixer.music.load("assets/audio/bgm/bgm_action.wav")
pygame.mixer.music.play(-1)
px = 300
py = 176
ex = 100
ey = 100
score = 0
state = "title"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN and state == "title":
                state = "play"
    screen.fill("#0a0a2e")
    if state == "title":
        _f = pygame.font.SysFont(None, 56)
        screen.blit(_f.render("追いかけゲーム", True, "#ffffff"), (150, 140))
        _f = pygame.font.SysFont(None, 32)
        screen.blit(_f.render("ENTER でスタート", True, "#aaffaa"), (185, 225))
    elif state == "play":
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
    else:
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("GAME OVER", True, "#ff3c3c"), (190, 160))
        _f = pygame.font.SysFont(None, 32)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (200, 220))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_STEP2 = '''\
import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("追いかけゲーム")
clock = pygame.time.Clock()
pygame.mixer.music.load("assets/audio/bgm/bgm_action.wav")
pygame.mixer.music.play(-1)
px = 300
py = 176
ex = 100
ey = 100
score = 0
state = "title"
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN and state == "title":
                state = "play"
                px, py, ex, ey, score = 300, 176, 100, 100, 0
            if event.key == pygame.K_r and state == "over":
                state = "title"
    screen.fill("#0a0a2e")
    if state == "title":
        _f = pygame.font.SysFont(None, 56)
        screen.blit(_f.render("追いかけゲーム", True, "#ffffff"), (150, 140))
        _f = pygame.font.SysFont(None, 32)
        screen.blit(_f.render("ENTER でスタート", True, "#aaffaa"), (185, 225))
    elif state == "play":
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
    else:
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("GAME OVER", True, "#ff3c3c"), (190, 160))
        _f = pygame.font.SysFont(None, 32)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (200, 220))
        screen.blit(_f.render("R: タイトルへ", True, "#aaaaaa"), (200, 258))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_A = '''\
# ゲームオーバー画面（over 状態）に追加
# イベントループの KEYDOWN 処理に追記
if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
    if state == "over":
        state = "play"
        px, py, ex, ey, score = 300, 176, 100, 100, 0
...
# over 画面に表示テキストを追加
_f = pygame.font.SysFont(None, 24)
screen.blit(_f.render("SPACE: リトライ  R: タイトル", True, "#aaaaaa"),
            (150, 258))
'''

CODE_KADAI_B = '''\
# ゲーム起動時にハイスコアを読み込む
try:
    with open("hiscore.txt") as _f:
        _raw = _f.read()
    hiscore = int(_raw)
except Exception:
    hiscore = 0
...
# タイトル画面（title 状態）にハイスコアを表示
_f = pygame.font.SysFont(None, 32)
screen.blit(_f.render(f"Best: {hiscore // 60}", True, "#ffcc00"), (240, 220))
...
# ゲームオーバー時のハイスコア更新・保存
if score > hiscore:
    hiscore = score
    with open("hiscore.txt", "w") as _f:
        _f.write(str(hiscore))
'''

CODE_KADAI_C = '''\
# タイトル画面（title 状態）に画像を追加
_img = pygame.image.load("assets/game-icons/player_ship.svg")
_img = pygame.transform.scale(_img, (72, 72))
screen.blit(_img, (110, 180))
_img = pygame.image.load("assets/game-icons/enemy_bug.svg")
_img = pygame.transform.scale(_img, (64, 64))
screen.blit(_img, (430, 175))
'''


SPEC = Spec(
    page_id=PAGE_ID,
    slug="game-24-title",
    title="タイトル画面を作ろう",
    intro_paragraphs=[
        'ゲームを起動すると、いきなりプレイが始まってしまいます。'
        '本格的なゲームには、タイトルやルールを表示する「タイトル画面」があります。',
        '㉒ で作った追いかけゲームを <strong>3 つの状態（ステート）</strong>で管理することで、'
        'タイトル画面 → プレイ → ゲームオーバーという自然なフローを実現しましょう。',
    ],
    eyecatch_basename="eyecatch_game_24_title",
    iframe_xml="game_24_step1_final.xml",
    learn_bullets=[
        '<code>if-elif-else</code> ブロックで 3 状態（title / play / over）を切り替える方法',
        '<code>key_just_pressed</code> ブロックで ENTER キーが押された「瞬間」だけ反応する方法',
        '状態が遷移するタイミングで変数をリセットする方法',
        'R キーでゲームオーバー画面からタイトルへ戻る方法',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='ゲームの画面フローを管理するキーワードを確認しましょう。',
    terms_table=[
        ("ゲームの状態（ステート）",
         "ゲームの進行を管理する考え方。<code>'title'</code>/<code>'play'</code>/<code>'over'</code> などの文字列を変数に保存し、<code>if-elif</code> で処理を切り替える",
         "<code>state</code> 変数 + <code>if-elif</code> ブロック"),
        ("key_just_pressed",
         "キーが押された「瞬間」だけ <code>True</code> を返す。押しっぱなしの間は <code>True</code> にならないため、画面遷移に使いやすい",
         "<code>pyco_game.key_just_pressed('K_RETURN')</code>"),
        ("変数リセット",
         "ゲームが始まる前に座標・スコアなどをすべて初期値に戻す処理。タイトルからプレイへ移るときに行う",
         "<code>px=300, py=176, ex=100, ey=100, score=0</code>"),
        ("ステート遷移",
         "ある状態から別の状態へ移ること。「ENTER を押したら title→play」のように、きっかけ（トリガー）と行き先（遷移先）をセットで設計する",
         "<code>if key_just_pressed: state = 'play'</code>"),
    ],
    steps=[
        Step(
            title="タイトル画面を追加する",
            instructions=[
                '変数 <code>state</code> を <code>"title"</code> で初期化し、ゲームをタイトル画面からスタートさせます',
                'ゲームループ内の処理を <strong>if-elif-else（3 分岐）</strong> ブロックで切り替えます：<code>title</code> / <code>play</code> / <code>over</code>（else）',
                'タイトル状態では「追いかけゲーム」と「ENTER でスタート」の文字を表示します',
                '<code>key_just_pressed(\'K_RETURN\')</code> で ENTER が押された瞬間 <code>state = "play"</code> に遷移します',
                '衝突でゲームオーバーになったら <code>state = "over"</code> に遷移します（リスタート手段なし）',
                '▶ 実行してタイトル画面が表示され、ENTER でプレイが始まることを確認しましょう',
            ],
            figure_basename="game_24_step1_final",
            figure_width=1454,
            code=CODE_STEP1,
        ),
        Step(
            title="リスタート機能を追加する",
            instructions=[
                'タイトル → プレイに遷移するとき、<code>px / py / ex / ey / score</code> をすべてリセットします',
                '変数リセットのブロックを <code>key_just_pressed(\'K_RETURN\')</code> の <strong>if ブロック内</strong> に追加します',
                'ゲームオーバー画面に「R: タイトルへ」のテキストを表示します',
                '<code>key_just_pressed(\'K_r\')</code> で R が押された瞬間 <code>state = "title"</code> に遷移します',
                '▶ 何度でも遊べるようになったことを確認しましょう',
            ],
            figure_basename="game_24_step2_final",
            figure_width=1454,
            code=CODE_STEP2,
        ),
    ],
    kadais=[
        Kadai(
            number="5-25-1",
            title="SPACE キーでゲームオーバーから直接リトライしよう",
            lead='ゲームオーバー画面で <code>SPACE</code> キーを押したら、タイトルを経由せず直接プレイ状態に戻りましょう。'
                 'このとき変数リセットも忘れずに行います。',
            figure_basename="game_24a_retry",
            figure_width=890,
            code=CODE_KADAI_A,
            explanation='<code>key_just_pressed(\'K_SPACE\')</code> を over 状態の処理に追加します。'
                        'リセット処理（6 変数）を if ブロック内に並べましょう。'
                        '「SPACE: リトライ　R: タイトル」のようにヒントを表示すると親切です。',
        ),
        Kadai(
            number="5-25-2",
            title="タイトル画面にハイスコアを表示しよう",
            lead='㉔ で保存した <code>hiscore.txt</code> を起動時に読み込み、'
                 'タイトル画面に「Best: N 秒」として表示しましょう。'
                 'ゲームオーバー時には記録を更新して保存します。',
            figure_basename="game_24b_hiscore_title",
            figure_width=928,
            code=CODE_KADAI_B,
            explanation='<code>try/except</code> ブロックを使ったファイル読み込みは ㉔ と同じパターンです。'
                        'タイトル画面でハイスコアを見せることで「前回を超えたい」という動機づけになります。'
                        'ゲームオーバー時は <code>score &gt; hiscore</code> を判定してから保存します。',
        ),
        Kadai(
            number="5-25-3",
            title="タイトル画面にキャラクター画像を飾ろう",
            lead='タイトル画面にプレイヤーと敵の画像を表示して、ゲームの内容が伝わるデザインにしましょう。'
                 '画像ブロックを使って 2 つのキャラクターを左右に配置します。',
            figure_basename="game_24c_title_sprites",
            figure_width=1059,
            code=CODE_KADAI_C,
            explanation='画像サイズを <code>64〜80 px</code> と大きめにすると迫力が増します。'
                        'プレイヤーを左側・敵を右側に配置すると「追いかけゲーム」の設定が伝わります。'
                        '<code>assets/game-icons/</code> にある他のスプライトも試してみましょう。',
        ),
    ],
    summary_bullets=[
        '<code>state</code> 変数と <code>if-elif-else</code> ブロックで 3 状態（title / play / over）を管理できる',
        '<code>key_just_pressed</code> ブロックでキーが押された「瞬間」だけ処理できる',
        '状態が切り替わるタイミングで変数をリセットすることで、何度でも公平にプレイできる',
        'タイトル画面を加えるだけでゲームの完成度が大きく上がる',
        '状態管理の考え方は、メニュー付きアプリやシーン遷移など、あらゆる場面で応用できる',
    ],
    next_article_id=4998,
    next_article_title='Pygameでゲームを作ろう Part5 改造道場',
    cache_buster="20260507l",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push",   action="store_true")
    ap.add_argument("--create", action="store_true", help="WP に新規ページを作成")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built ({SPEC.slug}): {len(new_content)} chars")

    if args.create:
        pid = wp_create(f"【Pygameでゲーム㉕】{SPEC.title}", new_content, status="draft")
        print(f"新規ページ作成: PAGE_ID = {pid}")
        print("build_game_24.py の PAGE_ID をこの値に変更して --push で更新してください")
    elif args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title=f"【Pygameでゲーム㉕】{SPEC.title}")
        print("反映完了（status=draft）。WP 管理画面で公開してください。")
    else:
        print("\n--- 先頭 600 文字プレビュー ---")
        print(new_content[:600])
        print("\n(dry-run) --create で新規作成 / --push で既存ページ更新")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
