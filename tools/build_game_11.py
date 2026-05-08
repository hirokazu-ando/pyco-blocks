#!/usr/bin/env python3
"""WP記事4072（Pygame⑪ 当たり判定）の本文を再生成して反映する。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_helpers import wp_get, wp_update  # noqa

PAGE_ID = 4072
CACHE_BUSTER = "?v=20260508c"
GAME_BASE = "https://hirokazu-ando.github.io/pyco-blocks/samples/game"

IMAGE_WIDTHS = {"game_11_steps_final": 1163,
    "game_11a_coin_collect": 1475,
    "game_11b_enemy_collide": 1841,
    "game_11c_invincible": 1889,}


def update_image(content: str, basename: str, width: int) -> str:
    base_url = f"{GAME_BASE}/screenshots/{basename}.png"
    content = re.sub(
        rf'src="{re.escape(base_url)}(\?v=[^"]*)?"',
        f'src="{base_url}{CACHE_BUSTER}"',
        content,
    )
    content = re.sub(
        rf'(src="{re.escape(base_url)}{re.escape(CACHE_BUSTER)}"[^>]*?width:)\d+(px)',
        rf'\g<1>{width}\2',
        content,
    )
    return content


REPLACEMENTS = [
    # ===== 冒頭 =====
    (
        '<p>「当たり判定」があってこそゲームらしくなります。<code>game_rect</code>と<code>game_collide</code>ブロックを使って、2つのオブジェクトが重なったかを判定する方法を学びましょう。</p>',
        '<p>「当たり判定」が入って初めて、ゲームらしいやり取りが生まれます。<code>game_rect</code> と <code>game_collide</code> ブロックを使って、2 つのオブジェクトが重なったかどうかを判定する方法を覚えていきましょう。</p>'
    ),
    # ===== ステップ1 =====
    (
        '<ol><li><code>player_rect = game_rect(px, py, 64, 64)</code></li><li><code>enemy_rect = game_rect(ex, ey, 48, 48)</code></li><li>「もし <code>game_collide(player_rect, enemy_rect)</code> なら → 背景を赤にする」</li><li>&#x25b6; 実行して当たったとき背景が赤くなることを確認してください</li></ol>',
        '<ol><li>プレイヤー用に <code>player_rect = game_rect(px, py, 64, 64)</code> を作ります</li><li>敵用に <code>enemy_rect = game_rect(ex, ey, 48, 48)</code> を作ります</li><li>「もし <code>game_collide(player_rect, enemy_rect)</code> なら背景を赤にする」を追加します</li><li>&#x25b6; 実行して、プレイヤーと敵が重なった瞬間だけ背景が赤くなれば成功です</li></ol>'
    ),
    # ===== 課題1 リード =====
    (
        '<p><code>coin</code>スプライトをランダムな位置に置き、プレイヤーが触れたら別の位置に移動するようにしましょう。</p>',
        '<p><code>coin</code> スプライトをランダムな位置に置き、プレイヤーが触れたら別のランダム位置にワープするようにしましょう。「コイン集めゲーム」の基本となる仕掛けです。</p>'
    ),
    # ===== 課題1 解説 =====
    (
        '<p><strong>解説：</strong> コインのRectを作り、<code>game_collide</code>で判定します。衝突時に<code>cx = random(0,600), cy = random(0,360)</code>でリセットします。</p>',
        '<p><strong>解説：</strong> コイン用の Rect を作り、プレイヤーの Rect と <code>game_collide</code> で重なりを判定します。衝突したら <code>cx = random(0, 600)</code>、<code>cy = random(0, 360)</code> で新しい位置に移すとともに、スコアも 10 ポイント加算してあげると達成感が出ます。</p>'
    ),
    # ===== 課題2 リード =====
    (
        '<p>敵3体それぞれに衝突判定を追加し、どれかに当たったらゲームオーバーフラグを立てましょう。</p>',
        '<p>敵 3 体それぞれに衝突判定を入れ、いずれか 1 体に当たった時点でゲームオーバーフラグを立てるようにしましょう。「弾幕」を避けるシューティング風の遊びになります。</p>'
    ),
    # ===== 課題2 解説 =====
    (
        '<p><strong>解説：</strong> <code>enemies</code>リストをforループで走査し、各敵のRectを作って判定します。1体でも衝突したら<code>running = False</code>にします。</p>',
        '<p><strong>解説：</strong> <code>enemies</code> リストを for ループで回し、敵 1 体ごとに Rect を作ってプレイヤーと <code>game_collide</code> します。1 体でも衝突したら <code>running = False</code> としてループを抜けると、自然にゲームオーバー状態になります。</p>'
    ),
    # ===== 課題3 リード =====
    (
        '<p>衝突後の2秒間は無敵（衝突判定を無視）にしてみましょう。<code>game_get_ticks()</code>を使います。</p>',
        '<p>衝突した直後の 2 秒間だけ無敵（衝突判定を無視）にしてみましょう。<code>game_get_ticks()</code> でゲーム開始からの経過ミリ秒を取得し、「無敵終了時刻」を比べるテクニックを使います。</p>'
    ),
    # ===== 課題3 解説 =====
    (
        '<p><strong>解説：</strong> 衝突時に<code>invincible_until = game_get_ticks() + 2000</code>を設定。判定条件に<code>game_get_ticks() &gt; invincible_until</code>を追加します。</p>',
        '<p><strong>解説：</strong> 衝突したタイミングで <code>invincible_until = game_get_ticks() + 2000</code> をセット（現在時刻 + 2000 ms = 2 秒後）。判定条件に <code>game_get_ticks() &gt; invincible_until</code> を AND で加えれば、無敵時間中は当たり判定をスキップできます。</p>'
    ),
    # ===== 課題1 コード修正（py変数・上下移動・衝突判定・render str化） =====
    (
        'px = 300\ncx = random.randint(0, 600)\ncy = random.randint(0, 360)\nscore = 0\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    screen.fill((10, 22, 40))  # #0a1628\n    if pygame.key.get_pressed()[pygame.K_RIGHT]:\n        px += 4\n    if pygame.key.get_pressed()[pygame.K_LEFT]:\n        px -= 4\n    if abs(px - cx) &lt; 40 and abs(340 - cy) &lt; 40:\n        score += 1\n        cx = random.randint(0, 600)\n        cy = random.randint(0, 360)\n    _img = pygame.image.load(\'assets/game-icons/player_ship.svg\')\n    _rw = 48; _rh = 48\n    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n    screen.blit(_img, (px, 330))\n    _img = pygame.image.load(\'assets/game-icons/coin.svg\')\n    _rw = 32; _rh = 32\n    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n    screen.blit(_img, (cx, cy))\n    _f = pygame.font.SysFont(None, 28)\n    screen.blit(_f.render(score, True, (255, 238, 68)), (10, 10))  # #ffee44',
        'px = 300\npy = 300\ncx = random.randint(0, 600)\ncy = random.randint(0, 360)\nscore = 0\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    screen.fill((10, 22, 40))  # #0a1628\n    if pygame.key.get_pressed()[pygame.K_RIGHT]:\n        px += 4\n    if pygame.key.get_pressed()[pygame.K_LEFT]:\n        px -= 4\n    if pygame.key.get_pressed()[pygame.K_UP]:\n        py -= 4\n    if pygame.key.get_pressed()[pygame.K_DOWN]:\n        py += 4\n    if abs(px - cx) &lt; 40 and abs(py - cy) &lt; 40:\n        score += 1\n        cx = random.randint(0, 600)\n        cy = random.randint(0, 360)\n    _img = pygame.image.load(\'assets/game-icons/player_ship.svg\')\n    _rw = 48; _rh = 48\n    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n    screen.blit(_img, (px, py))\n    _img = pygame.image.load(\'assets/game-icons/coin.svg\')\n    _rw = 32; _rh = 32\n    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n    screen.blit(_img, (cx, cy))\n    _f = pygame.font.SysFont(None, 28)\n    screen.blit(_f.render(str(score), True, (255, 238, 68)), (10, 10))  # #ffee44',
    ),
    # ===== 課題2 コード修正（py変数・上下移動・衝突判定・render str化） =====
    (
        'px = 300\nenemies = [[random.randint(0, 576), -48] for _ in range(3)]\nscore = 0\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    screen.fill((10, 10, 46))  # #0a0a2e\n    if pygame.key.get_pressed()[pygame.K_RIGHT]:\n        px += 4\n    if pygame.key.get_pressed()[pygame.K_LEFT]:\n        px -= 4\n    for e in enemies:\n        e[1] += 3\n        if e[1] &gt; 400:\n            e[1] = -48\n            e[0] = random.randint(0, 576)\n            score += 1\n        if abs(px - e[0]) &lt; 40 and abs(330 - e[1]) &lt; 40:\n            score -= 1\n            e[1] = -48\n        _img = pygame.image.load(\'assets/game-icons/enemy_bug.svg\')\n        _rw = 48; _rh = 48\n        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n        screen.blit(_img, (e[0], e[1]))\n    _img = pygame.image.load(\'assets/game-icons/player_ship.svg\')\n    _rw = 48; _rh = 48\n    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n    screen.blit(_img, (px, 330))\n    _f = pygame.font.SysFont(None, 28)\n    screen.blit(_f.render(score, True, (255, 255, 255)), (10, 10))',
        'px = 300\npy = 330\nenemies = [[random.randint(0, 576), -48] for _ in range(3)]\nscore = 0\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    screen.fill((10, 10, 46))  # #0a0a2e\n    if pygame.key.get_pressed()[pygame.K_RIGHT]:\n        px += 4\n    if pygame.key.get_pressed()[pygame.K_LEFT]:\n        px -= 4\n    if pygame.key.get_pressed()[pygame.K_UP]:\n        py -= 4\n    if pygame.key.get_pressed()[pygame.K_DOWN]:\n        py += 4\n    for e in enemies:\n        e[1] += 3\n        if e[1] &gt; 400:\n            e[1] = -48\n            e[0] = random.randint(0, 576)\n            score += 1\n        if abs(px - e[0]) &lt; 40 and abs(py - e[1]) &lt; 40:\n            score -= 1\n            e[1] = -48\n        _img = pygame.image.load(\'assets/game-icons/enemy_bug.svg\')\n        _rw = 48; _rh = 48\n        _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n        screen.blit(_img, (e[0], e[1]))\n    _img = pygame.image.load(\'assets/game-icons/player_ship.svg\')\n    _rw = 48; _rh = 48\n    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n    screen.blit(_img, (px, py))\n    _f = pygame.font.SysFont(None, 28)\n    screen.blit(_f.render(str(score), True, (255, 255, 255)), (10, 10))',
    ),
    # ===== 課題3 コード修正（py変数・上下移動・衝突判定） =====
    (
        'px = 300\nex = random.randint(0, 576)\ney = -48\ninv_until = 0\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    screen.fill((10, 10, 46))  # #0a0a2e\n    if pygame.key.get_pressed()[pygame.K_RIGHT]:\n        px += 4\n    if pygame.key.get_pressed()[pygame.K_LEFT]:\n        px -= 4\n    ey += 3\n    now = pygame.time.get_ticks()\n    if abs(px - ex) &lt; 40 and abs(330 - ey) &lt; 40 and now &gt; inv_until:\n        inv_until = now + 2000\n        ey = -48\n        ex = random.randint(0, 576)\n    _img = pygame.image.load(\'assets/game-icons/player_ship.svg\')\n    _rw = 48; _rh = 48\n    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n    screen.blit(_img, (px, 330))',
        'px = 300\npy = 330\nex = random.randint(0, 576)\ney = -48\ninv_until = 0\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    screen.fill((10, 10, 46))  # #0a0a2e\n    if pygame.key.get_pressed()[pygame.K_RIGHT]:\n        px += 4\n    if pygame.key.get_pressed()[pygame.K_LEFT]:\n        px -= 4\n    if pygame.key.get_pressed()[pygame.K_UP]:\n        py -= 4\n    if pygame.key.get_pressed()[pygame.K_DOWN]:\n        py += 4\n    ey += 3\n    now = pygame.time.get_ticks()\n    if abs(px - ex) &lt; 40 and abs(py - ey) &lt; 40 and now &gt; inv_until:\n        inv_until = now + 2000\n        ey = -48\n        ex = random.randint(0, 576)\n    _img = pygame.image.load(\'assets/game-icons/player_ship.svg\')\n    _rw = 48; _rh = 48\n    _img = pygame.transform.scale(_img, (_rw, _rh)) if _rw &gt; 0 and _rh &gt; 0 else _img\n    screen.blit(_img, (px, py))',
    ),
    # ===== まとめ =====
    (
        '<ul><li><code>game_rect(x, y, w, h)</code>でRectオブジェクトを作ります</li><li><code>game_collide(rectA, rectB)</code>で2つのRectの衝突を判定できます</li><li>当たり判定はゲームの勝敗・スコア・ダメージ処理のトリガーになります</li></ul>',
        '<ul><li><code>game_rect(x, y, w, h)</code> で Rect オブジェクトを作れます。</li><li><code>game_collide(rectA, rectB)</code> で 2 つの Rect が重なっているかを判定できます。</li><li>当たり判定は、勝敗判定・スコア加算・ダメージ処理など、ゲーム中のあらゆるイベントのきっかけになります。</li></ul>'
    ),
]


def main():
    content = wp_get(PAGE_ID)
    print(f"取得: page {PAGE_ID}, {len(content)} chars")

    new = content
    for old, repl in REPLACEMENTS:
        if old not in new:
            print(f"  WARN: 置換対象が見つかりません: {old[:80]}...")
            continue
        new = new.replace(old, repl, 1)
        print(f"  OK: 置換完了 ({old[:60]}...)")

    for basename, width in IMAGE_WIDTHS.items():
        new = update_image(new, basename, width)
    print("  OK: 画像幅 + キャッシュバスター 更新")

    if new == content:
        print("変更なし。終了。")
        return

    print(f"差分: {len(new) - len(content):+} chars")
    wp_update(PAGE_ID, new)
    print("反映完了")


if __name__ == "__main__":
    main()
