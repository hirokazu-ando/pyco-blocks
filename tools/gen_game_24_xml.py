#!/usr/bin/env python3
"""game_24 (㉕ タイトル画面を作ろう) の XML ファイルを生成する。"""
from pathlib import Path

GAME_DIR = Path(__file__).resolve().parents[1] / "samples" / "game"

def write_xml(filename, content):
    path = GAME_DIR / filename
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Wrote: {path.name}")

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ── value blocks ────────────────────────────────────────────────────
def nb(v):    return f'<block type="val_number"><field name="NUM">{v}</field></block>'
def sb(t):    return f'<block type="val_str"><field name="TEXT">{esc(t)}</field></block>'
def vb(i, n): return f'<block type="val_var"><field name="VAR" id="{i}">{n}</field></block>'
def cb(h):    return f'<block type="colour_picker"><field name="COLOUR">{h}</field></block>'
def ce(c):    return f'<block type="py_custom_expr"><field name="CODE">{esc(c)}</field></block>'
def boob(v):  return f'<block type="val_bool"><field name="BOOL">{v}</field></block>'

SHIP  = "assets/game-icons/player_ship.svg"
ENEMY = "assets/game-icons/enemy_bug.svg"
BGM_ACT = "assets/audio/bgm/bgm_action.wav"

# ── audio helpers ───────────────────────────────────────────────────
def bgm_preset(path):
    return f'<block type="game_music_preset"><field name="BGM">{path}</field></block>'

def music_play(bgm_path, loop=True, nxt=""):
    loop_val = "TRUE" if loop else "FALSE"
    s = (f'<block type="game_music_load_play"><field name="LOOP">{loop_val}</field>'
         f'<value name="URL">{bgm_preset(bgm_path)}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

# ── file I/O helpers (game_23 と同じ) ─────────────────────────────
def file_write(fname, content_block, nxt=""):
    s = (f'<block type="py_file_write">'
         f'<field name="FILENAME">{fname}</field>'
         f'<value name="CONTENT">{content_block}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def file_read(fname, var_name, nxt=""):
    s = (f'<block type="py_file_read">'
         f'<field name="FILENAME">{fname}</field>'
         f'<field name="VAR">{var_name}</field>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def try_except(etype, body_block, handler_block, nxt=""):
    s = (f'<block type="py_try_except">'
         f'<field name="ETYPE">{etype}</field>'
         f'<statement name="BODY">{body_block}</statement>'
         f'<statement name="HANDLER">{handler_block}</statement>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def type_cast(val_block, type_name):
    return (f'<block type="py_type_cast">'
            f'<field name="TYPE">{type_name}</field>'
            f'<value name="VALUE">{val_block}</value></block>')

# ── statement & control blocks ──────────────────────────────────────
def cs(c, nxt=""):
    s = f'<block type="py_custom_stmt"><field name="CODE">{esc(c)}</field>'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def vset(i, n, val, nxt=""):
    s = f'<block type="var_set"><field name="VAR" id="{i}">{n}</field><value name="VALUE">{val}</value>'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def vchg(i, n, amt, nxt=""):
    s = f'<block type="var_change"><field name="VAR" id="{i}">{n}</field><value name="AMOUNT">{amt}</value>'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def pif(cond, body, nxt="", else_body=""):
    mut = '<mutation elseif="0" else="1" />' if else_body else '<mutation elseif="0" else="0" />'
    s = f'<block type="pico_if">{mut}<value name="IF0">{cond}</value><statement name="DO0">{body}</statement>'
    if else_body: s += f'<statement name="ELSE">{else_body}</statement>'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def pif_elif(cond0, body0, cond1, body1, else_body="", nxt=""):
    """if-elif-else: mutation elseif=1"""
    has_else = bool(else_body)
    mut = f'<mutation elseif="1" else="{"1" if has_else else "0"}" />'
    s = (f'<block type="pico_if">{mut}'
         f'<value name="IF0">{cond0}</value><statement name="DO0">{body0}</statement>'
         f'<value name="IF1">{cond1}</value><statement name="DO1">{body1}</statement>')
    if else_body: s += f'<statement name="ELSE">{else_body}</statement>'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def kpress(key): return f'<block type="game_key_pressed"><field name="KEY">{key}</field></block>'

def cmp(op, left, right):
    return (f'<block type="cond_compare"><field name="OP">{esc(op)}</field>'
            f'<value name="LEFT">{left}</value><value name="RIGHT">{right}</value></block>')

def cand(a, b):
    return f'<block type="cond_and"><value name="A">{a}</value><value name="B">{b}</value></block>'

def absb(val):
    return f'<block type="py_abs"><value name="VALUE">{val}</value></block>'

def mathop(op, left, right):
    return (f'<block type="py_math_op"><field name="OP">{esc(op)}</field>'
            f'<value name="LEFT">{left}</value><value name="RIGHT">{right}</value></block>')

def img(path, x, y, w, nxt=""):
    s = (f'<block type="game_draw_image">'
         f'<value name="URL"><block type="game_image_preset"><field name="IMG">{path}</field></block></value>'
         f'<value name="X">{x}</value><value name="Y">{y}</value>'
         f'<value name="W">{nb(w)}</value><value name="H">{nb(w)}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def dtxt(text, x, y, size, color, nxt=""):
    s = (f'<block type="game_draw_text">'
         f'<value name="TEXT">{text}</value>'
         f'<value name="X">{nb(x)}</value><value name="Y">{nb(y)}</value>'
         f'<value name="SIZE">{nb(size)}</value><value name="COLOR">{cb(color)}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def flip(fps=60, nxt=""):
    s = f'<block type="game_flip"><value name="FPS">{nb(fps)}</value>'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def gfill(color, nxt=""):
    s = f'<block type="game_fill"><value name="COLOR">{cb(color)}</value>'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def gir(nxt=""):
    s = '<block type="game_import_random" x="20" y="20">'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def gevt(nxt=""):
    s = '<block type="game_events">'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def game_init(w, h, title, nxt=""):
    s = (f'<block type="game_init">'
         f'<value name="W">{nb(w)}</value><value name="H">{nb(h)}</value>'
         f'<value name="TITLE">{sb(title)}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def game_loop(body, nxt=""):
    s = f'<block type="game_loop"><statement name="DO">{body}</statement>'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def game_quit():
    return '<block type="game_quit"></block>'

def chain(*blocks):
    if not blocks: return ""
    result = blocks[-1]
    for b in reversed(blocks[:-1]):
        i = b.rfind("</block>")
        if i < 0:
            raise ValueError(f"No </block>: {b[:80]}")
        result = b[:i] + f"<next>{result}</next>" + b[i:]
    return result

def varsdecl(*args):
    vs = "\n".join(f'    <variable id="{a[0]}">{a[1]}</variable>' for a in args)
    return f"  <variables>\n{vs}\n  </variables>\n"

def wrap(vars_xml, block_xml):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
{vars_xml}  {block_xml}
</xml>'''

def hitcheck_xy(px_id, px_name, py_val, ex_id, ex_name, ey_id, ey_name,
                body, nxt="", radius=40):
    cond = cand(
        cmp("<", absb(mathop("-", vb(px_id, px_name), vb(ex_id, ex_name))), nb(radius)),
        cmp("<", absb(mathop("-", py_val, vb(ey_id, ey_name))), nb(radius)),
    )
    return pif(cond, body, nxt=nxt)

# ════════════════════════════════════════════════════════════════════
# game_24_step1_final.xml  —  タイトル画面追加（title→play→over）
# ════════════════════════════════════════════════════════════════════
VARS_S1 = [("g24s1_px","px"),("g24s1_py","py"),("g24s1_ex","ex"),
           ("g24s1_ey","ey"),("g24s1_sc","score"),("g24s1_st","state")]

# タイトル状態: テキスト表示 + ENTER でプレイ開始
title_body_s1 = chain(
    dtxt(sb("追いかけゲーム"), 150, 140, 48, "#ffffff"),
    dtxt(sb("ENTER でスタート"), 185, 225, 28, "#aaffaa"),
    pif(ce("pyco_game.key_just_pressed('K_RETURN')"),
        vset("g24s1_st", "state", sb("play"))),
)

# プレイ状態: 衝突で game over（ハイスコアなし・シンプル版）
play_body_s1 = chain(
    pif(kpress("K_LEFT"),  vchg("g24s1_px", "px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g24s1_px", "px", nb(4))),
    pif(kpress("K_UP"),    vchg("g24s1_py", "py", nb(-4))),
    pif(kpress("K_DOWN"),  vchg("g24s1_py", "py", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    cs("if py < 0:   py = 0"),
    cs("if py > 352: py = 352"),
    pif(cmp("<", vb("g24s1_ex","ex"), vb("g24s1_px","px")), vchg("g24s1_ex","ex", nb(2))),
    pif(cmp(">", vb("g24s1_ex","ex"), vb("g24s1_px","px")), vchg("g24s1_ex","ex", nb(-2))),
    pif(cmp("<", vb("g24s1_ey","ey"), vb("g24s1_py","py")), vchg("g24s1_ey","ey", nb(2))),
    pif(cmp(">", vb("g24s1_ey","ey"), vb("g24s1_py","py")), vchg("g24s1_ey","ey", nb(-2))),
    vchg("g24s1_sc", "score", nb(1)),
    hitcheck_xy("g24s1_px", "px", vb("g24s1_py", "py"),
                "g24s1_ex", "ex", "g24s1_ey", "ey",
                vset("g24s1_st", "state", sb("over"))),
    img(SHIP,  vb("g24s1_px","px"), vb("g24s1_py","py"), 48),
    img(ENEMY, vb("g24s1_ex","ex"), vb("g24s1_ey","ey"), 40),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 10, 10, 24, "#ffffff")'),
)

# ゲームオーバー状態（リスタートなし）
over_body_s1 = chain(
    dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 200, 220, 28, "#ffffff")'),
)

loop_s1 = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif_elif(
        cmp("==", vb("g24s1_st","state"), sb("title")), title_body_s1,
        cmp("==", vb("g24s1_st","state"), sb("play")),  play_body_s1,
        else_body=over_body_s1,
    ),
    flip(60),
)

write_xml("game_24_step1_final.xml", wrap(
    varsdecl(*VARS_S1),
    chain(
        gir(),
        game_init(640, 400, "追いかけゲーム"),
        music_play(BGM_ACT, loop=True),
        vset("g24s1_px","px", nb(300)),
        vset("g24s1_py","py", nb(176)),
        vset("g24s1_ex","ex", nb(100)),
        vset("g24s1_ey","ey", nb(100)),
        vset("g24s1_sc","score", nb(0)),
        vset("g24s1_st","state", sb("title")),
        game_loop(loop_s1),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_24_step2_final.xml  —  リスタート機能追加
#   ・ENTER でタイトル→プレイ + 変数リセット
#   ・R キーでゲームオーバー→タイトル
# ════════════════════════════════════════════════════════════════════
VARS_S2 = [("g24s2_px","px"),("g24s2_py","py"),("g24s2_ex","ex"),
           ("g24s2_ey","ey"),("g24s2_sc","score"),("g24s2_st","state")]

# タイトル→プレイ時に変数リセット
title_body_s2 = chain(
    dtxt(sb("追いかけゲーム"), 150, 140, 48, "#ffffff"),
    dtxt(sb("ENTER でスタート"), 185, 225, 28, "#aaffaa"),
    pif(ce("pyco_game.key_just_pressed('K_RETURN')"),
        chain(
            vset("g24s2_st", "state", sb("play")),
            vset("g24s2_px", "px", nb(300)),
            vset("g24s2_py", "py", nb(176)),
            vset("g24s2_ex", "ex", nb(100)),
            vset("g24s2_ey", "ey", nb(100)),
            vset("g24s2_sc", "score", nb(0)),
        )),
)

# プレイ状態（step1 と同じ）
play_body_s2 = chain(
    pif(kpress("K_LEFT"),  vchg("g24s2_px", "px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g24s2_px", "px", nb(4))),
    pif(kpress("K_UP"),    vchg("g24s2_py", "py", nb(-4))),
    pif(kpress("K_DOWN"),  vchg("g24s2_py", "py", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    cs("if py < 0:   py = 0"),
    cs("if py > 352: py = 352"),
    pif(cmp("<", vb("g24s2_ex","ex"), vb("g24s2_px","px")), vchg("g24s2_ex","ex", nb(2))),
    pif(cmp(">", vb("g24s2_ex","ex"), vb("g24s2_px","px")), vchg("g24s2_ex","ex", nb(-2))),
    pif(cmp("<", vb("g24s2_ey","ey"), vb("g24s2_py","py")), vchg("g24s2_ey","ey", nb(2))),
    pif(cmp(">", vb("g24s2_ey","ey"), vb("g24s2_py","py")), vchg("g24s2_ey","ey", nb(-2))),
    vchg("g24s2_sc", "score", nb(1)),
    hitcheck_xy("g24s2_px", "px", vb("g24s2_py", "py"),
                "g24s2_ex", "ex", "g24s2_ey", "ey",
                vset("g24s2_st", "state", sb("over"))),
    img(SHIP,  vb("g24s2_px","px"), vb("g24s2_py","py"), 48),
    img(ENEMY, vb("g24s2_ex","ex"), vb("g24s2_ey","ey"), 40),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 10, 10, 24, "#ffffff")'),
)

# ゲームオーバー状態: R キーでタイトルへ
over_body_s2 = chain(
    dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 200, 220, 28, "#ffffff")'),
    cs('pyco_game.draw_text("R: タイトルへ", 200, 258, 22, "#aaaaaa")'),
    pif(ce("pyco_game.key_just_pressed('K_r')"),
        vset("g24s2_st", "state", sb("title"))),
)

loop_s2 = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif_elif(
        cmp("==", vb("g24s2_st","state"), sb("title")), title_body_s2,
        cmp("==", vb("g24s2_st","state"), sb("play")),  play_body_s2,
        else_body=over_body_s2,
    ),
    flip(60),
)

write_xml("game_24_step2_final.xml", wrap(
    varsdecl(*VARS_S2),
    chain(
        gir(),
        game_init(640, 400, "追いかけゲーム"),
        music_play(BGM_ACT, loop=True),
        vset("g24s2_px","px", nb(300)),
        vset("g24s2_py","py", nb(176)),
        vset("g24s2_ex","ex", nb(100)),
        vset("g24s2_ey","ey", nb(100)),
        vset("g24s2_sc","score", nb(0)),
        vset("g24s2_st","state", sb("title")),
        game_loop(loop_s2),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_24a_retry.xml  —  SPACE キーで直接リトライ（課題A）
# ゲームオーバー画面から SPACE でプレイに直接戻る
# ════════════════════════════════════════════════════════════════════
VARS_A = [("g24a_st","state"),("g24a_px","px"),("g24a_py","py"),
           ("g24a_ex","ex"),("g24a_ey","ey"),("g24a_sc","score")]

retry_body_a = chain(
    vset("g24a_st", "state", sb("play")),
    vset("g24a_px", "px", nb(300)),
    vset("g24a_py", "py", nb(176)),
    vset("g24a_ex", "ex", nb(100)),
    vset("g24a_ey", "ey", nb(100)),
    vset("g24a_sc", "score", nb(0)),
)

write_xml("game_24a_retry.xml", wrap(
    varsdecl(*VARS_A),
    chain(
        vset("g24a_st","state", sb("over")),
        vset("g24a_sc","score", nb(0)),
        cs("# ゲームオーバー画面（over 状態のブロック）"),
        dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
        cs('pyco_game.draw_text(f"Score: {score // 60}", 200, 220, 28, "#ffffff")'),
        cs('pyco_game.draw_text("SPACE: リトライ  R: タイトル", 150, 258, 20, "#aaaaaa")'),
        pif(ce("pyco_game.key_just_pressed('K_SPACE')"), retry_body_a),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_24b_hiscore_title.xml  —  タイトル画面にハイスコア表示（課題B）
# ファイルからハイスコアを読み込み、タイトル画面に表示する
# ════════════════════════════════════════════════════════════════════
VARS_B = [("g24b_hs","hiscore"),("g24b_sc","score"),("g24b_st","state")]

load_hiscore_b = try_except("Exception",
    body_block=chain(
        file_read("hiscore.txt", "_raw"),
        vset("g24b_hs","hiscore", type_cast(ce("_raw"), "int")),
    ),
    handler_block=vset("g24b_hs","hiscore", nb(0)),
)

hiscore_update_b = pif(
    cmp(">", vb("g24b_sc","score"), vb("g24b_hs","hiscore")),
    chain(
        vset("g24b_hs","hiscore", vb("g24b_sc","score")),
        file_write("hiscore.txt", type_cast(vb("g24b_hs","hiscore"), "str")),
    )
)

write_xml("game_24b_hiscore_title.xml", wrap(
    varsdecl(*VARS_B),
    chain(
        load_hiscore_b,
        cs("# タイトル画面（title 状態のブロック）"),
        dtxt(sb("追いかけゲーム"), 150, 140, 48, "#ffffff"),
        cs('pyco_game.draw_text(f"Best: {hiscore // 60}", 240, 220, 28, "#ffcc00")'),
        dtxt(sb("ENTER でスタート"), 185, 268, 22, "#aaffaa"),
        cs("# ゲームオーバー時のハイスコア更新"),
        vset("g24b_st","state", sb("over")),
        hiscore_update_b,
    )
))

# ════════════════════════════════════════════════════════════════════
# game_24c_title_sprites.xml  —  タイトル画面に画像を飾る（課題C）
# プレイヤー・敵の画像をタイトル画面に表示して華やかにする
# ════════════════════════════════════════════════════════════════════
VARS_C = [("g24c_st","state")]

write_xml("game_24c_title_sprites.xml", wrap(
    varsdecl(*VARS_C),
    chain(
        vset("g24c_st","state", sb("title")),
        cs("# タイトル画面（title 状態のブロック）"),
        dtxt(sb("追いかけゲーム"), 150, 120, 48, "#ffffff"),
        dtxt(sb("ENTER でスタート"), 185, 205, 28, "#aaffaa"),
        cs("# キャラクターをタイトル画面に飾りとして表示"),
        img(SHIP,  nb(110), nb(180), 72),
        img(ENEMY, nb(430), nb(175), 64),
    )
))

print("\n✓ 5 XML files for game_24 generated.")
