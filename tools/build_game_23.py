#!/usr/bin/env python3
"""WP 記事 (Pygame㉔ スコアランキングを保存しよう) の本文を組み立てて反映する。

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

PAGE_ID      = 5152   # wp_create 後に確定したIDを設定
EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-5-24_ranking.png"


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
pygame.display.set_caption("Hiscore")
clock = pygame.time.Clock()
pygame.mixer.music.load("assets/audio/bgm/bgm_action.wav")
pygame.mixer.music.play(-1)
# ハイスコアをファイルから読み込む
try:
    with open("hiscore.txt") as _f:
        _raw = _f.read()
    hiscore = int(_raw)
except Exception:
    hiscore = 0
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
            if score > hiscore:
                hiscore = score
                with open("hiscore.txt", "w") as _f:
                    _f.write(str(hiscore))
        _img = pygame.image.load("assets/game-icons/player_ship.svg")
        _img = pygame.transform.scale(_img, (48, 48))
        screen.blit(_img, (px, py))
        _img = pygame.image.load("assets/game-icons/enemy_bug.svg")
        _img = pygame.transform.scale(_img, (40, 40))
        screen.blit(_img, (ex, ey))
        _f = pygame.font.SysFont(None, 28)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (10, 10))
        screen.blit(_f.render(f"Best:  {hiscore // 60}", True, "#ffcc00"), (10, 38))
    elif state == "over":
        _f = pygame.font.SysFont(None, 48)
        screen.blit(_f.render("GAME OVER", True, "#ff3c3c"), (190, 160))
        _f = pygame.font.SysFont(None, 32)
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (200, 220))
        screen.blit(_f.render(f"Best:  {hiscore // 60}", True, "#ffcc00"), (200, 258))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_STEP2 = '''\
import pygame
import random
pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Ranking")
clock = pygame.time.Clock()
pygame.mixer.music.load("assets/audio/bgm/bgm_action.wav")
pygame.mixer.music.play(-1)
# ランキングをファイルから読み込む
try:
    with open("ranking.txt") as _f:
        lines = _f.readlines()
    ranking = [int(x.strip()) for x in lines if x.strip()][:3]
except Exception:
    ranking = []
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
            ranking.append(score)
            ranking.sort(reverse=True)
            ranking = ranking[:3]
            with open("ranking.txt", "w") as _f:
                _f.write("\\n".join(str(s) for s in ranking))
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
        screen.blit(_f.render(f"Score: {score // 60}", True, "#ffffff"), (200, 220))
        for i, s in enumerate(ranking, start=1):
            _f = pygame.font.SysFont(None, 28)
            screen.blit(_f.render(f"{i}位: {s // 60}", True, "#ffcc00"),
                        (200, 258 + (i - 1) * 28))
    pygame.display.flip()
    clock.tick(60)
pygame.quit()
'''

CODE_KADAI_A = '''\
# ゲームオーバー時：ランキング更新前に1位判定
is_new_best = not ranking or score > ranking[0]
ranking.append(score)
ranking.sort(reverse=True)
ranking = ranking[:3]
with open("ranking.txt", "w") as _f:
    _f.write("\\n".join(str(s) for s in ranking))
...
# ゲームオーバー画面での表示
if is_new_best:
    _f = pygame.font.SysFont(None, 36)
    screen.blit(_f.render("★ NEW BEST! ★", True, "#ffd700"), (170, 340))
'''

CODE_KADAI_B = '''\
# ゲームオーバー画面内（state == "over" のブロック）
# D キーを押したらランキングをリセット
for event in pygame.event.get():
    if event.type == pygame.KEYDOWN and event.key == pygame.K_d:
        ranking = []
        with open("ranking.txt", "w") as _f:
            _f.write("")
'''

CODE_KADAI_C = '''\
# ゲーム起動時：プレイ回数を読み込む
try:
    with open("play_count.txt") as _f:
        _raw = _f.read()
    play_count = int(_raw)
except Exception:
    play_count = 0
...
# ゲームオーバー時：プレイ回数を更新して保存
play_count += 1
with open("play_count.txt", "w") as _f:
    _f.write(str(play_count))
...
# プレイ状態の画面表示
_f = pygame.font.SysFont(None, 24)
screen.blit(_f.render(f"挑戦回数: {play_count}", True, "#aaaaaa"), (10, 66))
'''


SPEC = Spec(
    page_id=PAGE_ID,
    slug="game-23-ranking",
    title="スコアランキングを保存しよう",
    intro_paragraphs=[
        'ゲームのスコアは毎回リセットされてしまい、どれだけうまくなったかが残りません。'
        'ファイルにスコアを書き込んでおけば、次回起動したときにも前回の記録を参照できます。',
        '㉒ で作った追いかけ敵ゲームに <strong>ハイスコア保存</strong> と '
        '<strong>トップ3ランキング</strong> 機能を追加して、'
        'やる気が続くゲームに仕上げましょう。',
    ],
    eyecatch_basename="eyecatch_game_23_ranking",
    iframe_xml="game_23_step1_final.xml",
    learn_bullets=[
        '<code>py_file_write</code> ブロックでスコアをテキストファイルに保存する方法',
        '<code>py_file_read</code> / <code>py_file_readlines</code> で起動時にファイルを読み込む方法',
        '<code>try/except</code> ブロックでファイルが存在しない場合の初期値を設定する方法',
        '<code>sorted()</code> と <code>slice</code> でリストをトップ3に絞り込む方法',
        '<code>for i, s in enumerate(ranking, start=1):</code> でランキング表示をループ処理する方法',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='ファイル操作と集計処理のキーワードを確認しましょう。',
    terms_table=[
        ("ファイル書き込み", "指定したファイル名にテキストを上書き保存する。ファイルが無ければ新規作成される", "<code>py_file_write</code>（ファイル名と内容を指定）"),
        ("ファイル読み込み", "ファイルの内容をすべて文字列として読み込み、変数に代入する", "<code>py_file_read</code>（ファイル名と変数名を指定）"),
        ("行ごとに読む", "ファイルを 1 行ずつリストとして読み込む。スコアを 1 行 1 件で保存・読み込む際に使う", "<code>py_file_readlines</code>"),
        ("<code>try/except</code>", "エラーが起きたときの代替処理を書く構文。ファイルが存在しない場合に初期値を設定するときに使う", "<code>try:</code> ファイル読み込み → <code>except Exception:</code> 初期値 0"),
        ("<code>sorted()</code>", "リストを昇順または降順に並び替えた新しいリストを返す。<code>reverse=True</code> で降順になる", "<code>sorted(ranking, reverse=True)</code>"),
    ],
    steps=[
        Step(
            title="ハイスコアをファイルに保存する",
            instructions=[
                '<strong>try/except ブロック</strong> を使い、ゲーム開始時に <code>hiscore.txt</code> を読み込みます。'
                'ファイルが存在しない場合（初回起動時）は <code>hiscore = 0</code> に初期化します',
                '4 方向移動・敵の追跡・衝突判定の処理は ㉒ と同じです',
                '衝突でゲームオーバーになったとき、<code>score &gt; hiscore</code> なら '
                '<code>hiscore</code> を更新し <strong>ファイル書き込み</strong> ブロックで保存します',
                'プレイ画面とゲームオーバー画面の両方に <code>Best: {hiscore // 60}</code> を表示します',
                '▶ 実行してプレイし、終了後に再度起動してハイスコアが引き継がれることを確認しましょう',
            ],
            figure_basename="game_23_step1_final",
            figure_width=1454,
            code=CODE_STEP1,
        ),
        Step(
            title="ランキングトップ3を保存する",
            instructions=[
                '<strong>py_file_readlines</strong> ブロックで <code>ranking.txt</code> を行ごとに読み込み、'
                '整数リスト <code>ranking</code> に変換します（ファイルが無ければ空リスト）',
                '衝突でゲームオーバーになったとき、<code>ranking.append(score)</code> でスコアを追加します',
                '<code>sorted(ranking, reverse=True)</code> で降順にソートし、'
                '<code>ranking[:3]</code> でトップ3を残します',
                '<strong>ファイル書き込み</strong> ブロックで改行区切りのスコアを <code>ranking.txt</code> に保存します',
                'ゲームオーバー画面で <strong>enumerate（1 から）</strong> ブロックを使い、ランキングをループ表示します',
                '▶ 何度かプレイしてランキングが正しく更新されることを確認しましょう',
            ],
            figure_basename="game_23_step2_final",
            figure_width=1454,
            code=CODE_STEP2,
        ),
    ],
    kadais=[
        Kadai(
            number="5-24-1",
            title="ランキング1位を更新したら「★ NEW BEST! ★」を表示しよう",
            lead='ランキングを更新する前に <code>is_new_best = not ranking or score &gt; ranking[0]</code> '
                 'で1位かどうかを判定し、ゲームオーバー画面に「★ NEW BEST! ★」を表示しましょう。',
            figure_basename="game_23a_new_best",
            figure_width=1035,
            code=CODE_KADAI_A,
            explanation='<code>not ranking</code> でランキングが空（初プレイ）の場合も True になります。'
                        'ランキング更新の <em>前</em> に判定することがポイントです。'
                        '更新後に <code>score == ranking[0]</code> でも同様に判定できます。'
                        '表示色を <code>#ffd700</code>（ゴールド）にするとより華やかになります。',
        ),
        Kadai(
            number="5-24-2",
            title="D キーでランキングをリセットしよう",
            lead='ゲームオーバー画面で D キーを押したら <code>ranking</code> リストを空にし、'
                 '<code>ranking.txt</code> に空文字を書き込んでリセットしましょう。',
            figure_basename="game_23b_reset_ranking",
            figure_width=663,
            code=CODE_KADAI_B,
            explanation='<code>pyco_game.key_just_pressed(\'K_d\')</code> は D キーが押された '
                        '<em>瞬間のみ</em> True になります（<code>key_pressed</code> は押しっぱなしで True）。'
                        '画面に「D: リセット」とヒントを表示すると親切です。',
        ),
        Kadai(
            number="5-24-3",
            title="プレイ回数をファイルに記録しよう",
            lead='<code>play_count.txt</code> にプレイ回数を保存・読み込みし、'
                 'ゲーム画面に「挑戦回数: N」を表示しましょう。'
                 'ゲームオーバーになるたびに 1 加算して保存します。',
            figure_basename="game_23c_play_count",
            figure_width=705,
            code=CODE_KADAI_C,
            explanation='<code>try/except</code> でファイルが存在しない初回は <code>play_count = 0</code> に設定します。'
                        '<code>var_change（+1）</code> ブロックで回数を増やし、'
                        '<code>str(play_count)</code> に変換してから書き込みます。'
                        'ハイスコアと組み合わせて「N 回挑戦中のベスト」のように表示してみましょう。',
        ),
    ],
    summary_bullets=[
        '<code>py_file_write</code> ブロックでスコアをテキストファイルに保存、<code>py_file_read</code> で起動時に読み込める',
        '<code>try/except（エラー全般）</code> ブロックでファイルが存在しない初回の例外をキャッチし、初期値を設定できる',
        '<code>sorted(ranking, reverse=True)[:3]</code> でトップ3ランキングをシンプルに実現できる',
        '<code>enumerate（1 から）</code> ブロックで順位番号付きのランキング表示ループを書ける',
        'ファイル I/O ＋ リスト操作の組み合わせはゲームだけでなく、あらゆるプログラムで役立つ基本技術',
    ],
    next_article_id=5154,
    next_article_title='【Pygameでゲーム㉕】タイトル画面を作ろう',
    cache_buster="20260507k",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push",   action="store_true")
    ap.add_argument("--create", action="store_true", help="WP に新規ページを作成")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built ({SPEC.slug}): {len(new_content)} chars")

    if args.create:
        pid = wp_create(f"【Pygameでゲーム㉔】{SPEC.title}", new_content, status="draft")
        print(f"新規ページ作成: PAGE_ID = {pid}")
        print("build_game_23.py の PAGE_ID をこの値に変更して --push で更新してください")
    elif args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title=f"【Pygameでゲーム㉔】{SPEC.title}")
        print("反映完了（status=draft）。WP 管理画面で公開してください。")
    else:
        print("\n--- 先頭 600 文字プレビュー ---")
        print(new_content[:600])
        print("\n(dry-run) --create で新規作成 / --push で既存ページ更新")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
