#!/usr/bin/env python3
"""WP 記事 (Pygame㉓ BGMと効果音を追加しよう) の本文を組み立てて反映する。

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

PAGE_ID      = 5150   # wp_create 後に確定したIDを設定
EYECATCH_URL = "https://sakigake-robo.com/wp-content/uploads/2026/05/eyecatch_game-5-23_audio.png"


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
pygame.display.set_caption("Chase + BGM")
clock = pygame.time.Clock()
pygame.mixer.music.load("assets/audio/bgm/bgm_action.wav")
pygame.mixer.music.play(-1)
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
pygame.display.set_caption("Chase + SE")
clock = pygame.time.Clock()
se_over = pygame.mixer.Sound("assets/audio/se/se_gameover.wav")
se_played = False
pygame.mixer.music.load("assets/audio/bgm/bgm_action.wav")
pygame.mixer.music.play(-1)
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
            if not se_played:
                se_over.play()
                se_played = True
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

CODE_KADAI_A = '''\
# M キーを押すたびに BGM を ミュート ⇔ 再生 切り替え
mute = False
...
for event in pygame.event.get():
    if event.type == pygame.KEYDOWN and event.key == pygame.K_m:
        mute = not mute
        pygame.mixer.music.set_volume(0 if mute else 1.0)
'''

CODE_KADAI_B = '''\
# 敵との距離が 100 以内になったら警告音を鳴らす
se_warn = pygame.mixer.Sound("assets/audio/se/se_hit.wav")
warned = False
...
if abs(px - ex) < 100 and abs(py - ey) < 100:
    if not warned:
        se_warn.play()
        warned = True
else:
    warned = False   # 離れたらフラグをリセット
'''

CODE_KADAI_C = '''\
# ゲームオーバー時に BGM を止める
if abs(px - ex) < 40 and abs(py - ey) < 40:
    state = "over"
    if not se_played:
        se_over.play()
        se_played = True
    pygame.mixer.music.stop()   # ← BGM を止める
'''


SPEC = Spec(
    page_id=PAGE_ID,
    slug="game-22-audio",
    title="BGMと効果音を追加しよう",
    intro_paragraphs=[
        'ゲームに音楽と効果音を加えると、一気に本格的なゲームらしくなります。'
        'PycoBlocks には <strong>bgm_action.wav</strong> などの内蔵音源が用意されており、'
        '1〜2 ブロックで BGM が流れるようになります。',
        '㉒ で完成させた追いかけ敵ゲームに BGM とゲームオーバー効果音を追加して、'
        'サウンド付きの完成版ゲームを仕上げましょう。',
    ],
    eyecatch_basename="eyecatch_game_22_audio",
    iframe_xml="game_22_step1_final.xml",
    learn_bullets=[
        '<code>pygame.mixer.music.load()</code> と <code>.play(-1)</code> で BGM をループ再生する方法',
        '<code>pygame.mixer.Sound()</code> で効果音オブジェクトを作り、<code>.play()</code> で鳴らす方法',
        '効果音フラグ（<code>se_played</code>）を使って「1回だけ鳴らす」制御を実装する方法',
        'M キーで BGM をミュート・再開する <code>set_volume()</code> の使い方',
    ],
    terms_h2="用語を整理しよう",
    terms_intro='サウンド周りのキーワードを確認しましょう。',
    terms_table=[
        ("BGM（背景音楽）", "ゲーム中ずっと流れる音楽。<code>pygame.mixer.music</code> で管理し、<code>.play(-1)</code> でループ再生できる", "<code>pygame.mixer.music.play(-1)</code>"),
        ("効果音（SE）", "コインを取る・ゲームオーバーなど、イベントに合わせて 1 回鳴らす短い音。<code>pygame.mixer.Sound</code> オブジェクトで管理する", "<code>se.play()</code>"),
        ("効果音フラグ", "同じ効果音を 1 フレームに何度も鳴らさないための制御フラグ。イベント発生時に <code>True</code> にし、条件が終わったら <code>False</code> にリセットする", "<code>if not se_played: se.play(); se_played = True</code>"),
        ("<code>set_volume()</code>", "音量を 0.0〜1.0 で調整するメソッド。<code>0</code> でミュート、<code>1.0</code> で通常音量", "<code>pygame.mixer.music.set_volume(0)</code>"),
    ],
    steps=[
        Step(
            title="BGMをゲームに追加する",
            instructions=[
                '<strong>BGM を再生</strong> ブロックを <code>game_init</code> の直後（ゲームループの前）に置きます',
                'BGM プリセットで <code>bgm_action.wav</code> を選び、ループを <strong>ON</strong> にします',
                '▶ 実行してゲームが始まると同時に音楽が流れることを確認しましょう',
                'ポイント：BGM は 1 回だけ呼べばよく、ゲームループの中に書く必要はありません',
            ],
            figure_basename="game_22_step1_final",
            figure_width=1454,  # CSS 1454x2784
            code=CODE_STEP1,
        ),
        Step(
            title="ゲームオーバー時に効果音を鳴らす",
            instructions=[
                '変数 <code>se_over</code> に <strong>効果音を読み込む</strong> ブロックを使って <code>se_gameover.wav</code> を代入します',
                'フラグ変数 <code>se_played = False</code> を初期化します',
                'ゲームオーバー判定のすぐ後に <code>if not se_played:</code> → <strong>効果音を鳴らす</strong> → <code>se_played = True</code> と書きます',
                '▶ 実行して、敵に当たった瞬間にゲームオーバー音が 1 回だけ鳴ることを確認しましょう',
            ],
            figure_basename="game_22_step2_final",
            figure_width=1454,  # CSS 1454x3080
            code=CODE_STEP2,
        ),
    ],
    kadais=[
        Kadai(
            number="5-23-1",
            title="M キーで BGM をミュートしよう",
            lead='<code>mute</code> フラグを持ち、M キーが押されるたびに '
                 '<code>pygame.mixer.music.set_volume(0)</code> と '
                 '<code>set_volume(1.0)</code> を切り替えましょう。',
            figure_basename="game_22a_bgm_mute",
            figure_width=1071,
            code=CODE_KADAI_A,
            explanation='<code>set_volume(0)</code> はミュート、<code>set_volume(1.0)</code> は通常音量です。'
                        '<code>mute = not mute</code> でフラグを反転させるたびに音量を切り替えます。'
                        '画面に「BGM: ON / OFF」を表示するとわかりやすくなります。',
        ),
        Kadai(
            number="5-23-2",
            title="敵が近づいたら警告音を鳴らそう",
            lead='敵との距離が 100 以内になったら <code>se_hit.wav</code> を鳴らしましょう。'
                 'フラグ <code>warned</code> を使って離れるまで再鳴動しないようにします。',
            figure_basename="game_22b_warning_sound",
            figure_width=1441,
            code=CODE_KADAI_B,
            explanation='距離チェックに <code>abs(px - ex) &lt; 100</code> を使います。'
                        '<code>warned</code> フラグが <code>False</code> のときだけ鳴らし、'
                        '距離が 100 以上になったら <code>False</code> にリセットします。'
                        'これで「近づくたびに 1 回だけ警告音が鳴る」動作になります。',
        ),
        Kadai(
            number="5-23-3",
            title="ゲームオーバー時に BGM を止めよう",
            lead='ゲームオーバーになった瞬間に <strong>BGM を止める</strong> ブロックを呼んで、'
                 '効果音とともに BGM をストップさせましょう。',
            figure_basename="game_22c_bgm_stop",
            figure_width=1422,
            code=CODE_KADAI_C,
            explanation='<code>pygame.mixer.music.stop()</code> を state = "over" に移行するブロックの直後に置きます。'
                        '効果音 <code>se_over.play()</code> の後に BGM を止めると、'
                        '効果音が鳴ってから静かになる演出になります。'
                        'より高度な演出として、<code>pygame.mixer.music.fadeout(1000)</code>（1秒でフェードアウト）もあります。',
        ),
    ],
    summary_bullets=[
        '<code>pygame.mixer.music.load()</code> + <code>.play(-1)</code> でループ BGM を 2 行で追加できる',
        '<code>pygame.mixer.Sound()</code> で効果音オブジェクトを作り、<code>.play()</code> で任意のタイミングに鳴らす',
        '効果音フラグ（<code>se_played</code>）で「1 回だけ鳴らす」制御が確実になる',
        '<code>set_volume()</code> で音量調整、<code>music.stop()</code> でBGM停止、覚えておくと演出の幅が広がる',
    ],
    next_article_id=5152,
    next_article_title='【Pygameでゲーム㉔】スコアランキングを保存しよう',
    cache_buster="20260507j",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push",   action="store_true")
    ap.add_argument("--create", action="store_true", help="WP に新規ページを作成")
    args = ap.parse_args()

    new_content = build_content(SPEC)
    print(f"Built ({SPEC.slug}): {len(new_content)} chars")

    if args.create:
        pid = wp_create(f"【Pygameでゲーム㉓】{SPEC.title}", new_content, status="draft")
        print(f"新規ページ作成: PAGE_ID = {pid}")
        print("build_game_22.py の PAGE_ID をこの値に変更して --push で更新してください")
    elif args.push:
        wp_update(SPEC.page_id, new_content, status="draft",
                  title=f"【Pygameでゲーム㉓】{SPEC.title}")
        print("反映完了（status=draft）。WP 管理画面で公開してください。")
    else:
        print("\n--- 先頭 600 文字プレビュー ---")
        print(new_content[:600])
        print("\n(dry-run) --create で新規作成 / --push で既存ページ更新")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
