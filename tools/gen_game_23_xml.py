#!/usr/bin/env python3
"""game_23 (㉔ スコアランキングを保存しよう) の XML ファイルを生成する。"""
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

# ── audio helpers (same as game_22) ─────────────────────────────────
def bgm_preset(path):
    return f'<block type="game_music_preset"><field name="BGM">{path}</field></block>'

def music_play(bgm_path, loop=True, nxt=""):
    loop_val = "TRUE" if loop else "FALSE"
    s = (f'<block type="game_music_load_play"><field name="LOOP">{loop_val}</field>'
         f'<value name="URL">{bgm_preset(bgm_path)}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

# ── file I/O helpers ─────────────────────────────────────────────────
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

def file_readlines(fname, var_name, nxt=""):
    s = (f'<block type="py_file_readlines">'
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

# ── list helpers ──────────────────────────────────────────────────────
def list_empty():
    return '<block type="py_list_empty"></block>'

def list_append(list_id, list_name, val_block, nxt=""):
    s = (f'<block type="py_list_append">'
         f'<field name="LIST" id="{list_id}">{list_name}</field>'
         f'<value name="VALUE">{val_block}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def sorted_call(list_id, list_name, reverse="True"):
    return (f'<block type="py_sorted_call">'
            f'<field name="LIST" id="{list_id}">{list_name}</field>'
            f'<field name="REVERSE">{reverse}</field></block>')

def list_slice(list_id, list_name, start_block, stop_block):
    return (f'<block type="py_list_slice">'
            f'<field name="LIST" id="{list_id}">{list_name}</field>'
            f'<value name="START">{start_block}</value>'
            f'<value name="STOP">{stop_block}</value></block>')

def enumerate_start_for(start, idx_id, idx_name, val_id, val_name,
                        list_id, list_name, body, nxt=""):
    s = (f'<block type="py_enumerate_start_for">'
         f'<field name="START">{start}</field>'
         f'<field name="IDX" id="{idx_id}">{idx_name}</field>'
         f'<field name="VAL" id="{val_id}">{val_name}</field>'
         f'<field name="LIST" id="{list_id}">{list_name}</field>'
         f'<statement name="DO">{body}</statement>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

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
# game_23_step1_final.xml  —  チェイスゲーム + ハイスコア保存
# ════════════════════════════════════════════════════════════════════
VARS_S1 = [("g23s1_px","px"),("g23s1_py","py"),("g23s1_ex","ex"),
           ("g23s1_ey","ey"),("g23s1_sc","score"),("g23s1_st","state"),
           ("g23s1_hs","hiscore")]

# ハイスコードの読み込み（try/except）
load_hiscore = try_except("Exception",
    body_block=chain(
        file_read("hiscore.txt", "_raw"),
        vset("g23s1_hs", "hiscore", type_cast(ce("_raw"), "int")),
    ),
    handler_block=vset("g23s1_hs", "hiscore", nb(0)),
)

# ゲームオーバー時のハイスコード更新・保存
hiscore_update_s1 = pif(
    cmp(">", vb("g23s1_sc", "score"), vb("g23s1_hs", "hiscore")),
    chain(
        vset("g23s1_hs", "hiscore", vb("g23s1_sc", "score")),
        file_write("hiscore.txt", type_cast(vb("g23s1_hs", "hiscore"), "str")),
    )
)

# プレイ状態（衝突でゲームオーバー + ハイスコード更新）
play_s1 = chain(
    pif(kpress("K_LEFT"),  vchg("g23s1_px", "px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g23s1_px", "px", nb(4))),
    pif(kpress("K_UP"),    vchg("g23s1_py", "py", nb(-4))),
    pif(kpress("K_DOWN"),  vchg("g23s1_py", "py", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    cs("if py < 0:   py = 0"),
    cs("if py > 352: py = 352"),
    pif(cmp("<", vb("g23s1_ex","ex"), vb("g23s1_px","px")), vchg("g23s1_ex","ex", nb(2))),
    pif(cmp(">", vb("g23s1_ex","ex"), vb("g23s1_px","px")), vchg("g23s1_ex","ex", nb(-2))),
    pif(cmp("<", vb("g23s1_ey","ey"), vb("g23s1_py","py")), vchg("g23s1_ey","ey", nb(2))),
    pif(cmp(">", vb("g23s1_ey","ey"), vb("g23s1_py","py")), vchg("g23s1_ey","ey", nb(-2))),
    vchg("g23s1_sc", "score", nb(1)),
    hitcheck_xy("g23s1_px", "px", vb("g23s1_py", "py"),
                "g23s1_ex", "ex", "g23s1_ey", "ey",
                # body: state="over" then hiscore_update
                chain(
                    vset("g23s1_st", "state", sb("over")),
                    hiscore_update_s1,
                )),
    img(SHIP,  vb("g23s1_px","px"), vb("g23s1_py","py"), 48),
    img(ENEMY, vb("g23s1_ex","ex"), vb("g23s1_ey","ey"), 40),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 10, 10, 24, "#ffffff")'),
    cs('pyco_game.draw_text(f"Best:  {hiscore // 60}", 10, 38, 22, "#ffcc00")'),
)

over_s1 = chain(
    dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 200, 220, 28, "#ffffff")'),
    cs('pyco_game.draw_text(f"Best:  {hiscore // 60}", 200, 258, 28, "#ffcc00")'),
)

loop_s1 = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g23s1_st","state"), sb("play")), play_s1, else_body=over_s1),
    flip(60),
)

write_xml("game_23_step1_final.xml", wrap(
    varsdecl(*VARS_S1),
    chain(
        gir(),
        game_init(640, 400, "Hiscore"),
        music_play(BGM_ACT, loop=True),
        load_hiscore,
        vset("g23s1_px","px", nb(300)),
        vset("g23s1_py","py", nb(176)),
        vset("g23s1_ex","ex", nb(100)),
        vset("g23s1_ey","ey", nb(100)),
        vset("g23s1_sc","score", nb(0)),
        vset("g23s1_st","state", sb("play")),
        game_loop(loop_s1),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_23_step2_final.xml  —  ランキングトップ3を保存
# ════════════════════════════════════════════════════════════════════
VARS_S2 = [("g23s2_px","px"),("g23s2_py","py"),("g23s2_ex","ex"),
           ("g23s2_ey","ey"),("g23s2_sc","score"),("g23s2_st","state"),
           ("g23s2_rk","ranking"),("g23s2_i","i"),("g23s2_s","s")]

# ランキングの読み込み（try/except）
load_ranking = try_except("Exception",
    body_block=chain(
        file_readlines("ranking.txt", "lines"),
        vset("g23s2_rk", "ranking",
             ce("[int(x.strip()) for x in lines if x.strip()][:3]")),
    ),
    handler_block=vset("g23s2_rk", "ranking", list_empty()),
)

# ゲームオーバー時のランキング更新・保存
# NOTE: ranking_update は chain() の最後の引数として使用するため pre-chain 可
ranking_update_s2 = chain(
    list_append("g23s2_rk", "ranking", vb("g23s2_sc", "score")),
    vset("g23s2_rk", "ranking",
         sorted_call("g23s2_rk", "ranking", "True")),
    vset("g23s2_rk", "ranking",
         list_slice("g23s2_rk", "ranking", nb(0), nb(3))),
    file_write("ranking.txt",
               ce('"\\n".join(str(s) for s in ranking)')),
)

# プレイ状態
play_s2 = chain(
    pif(kpress("K_LEFT"),  vchg("g23s2_px", "px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g23s2_px", "px", nb(4))),
    pif(kpress("K_UP"),    vchg("g23s2_py", "py", nb(-4))),
    pif(kpress("K_DOWN"),  vchg("g23s2_py", "py", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    cs("if py < 0:   py = 0"),
    cs("if py > 352: py = 352"),
    pif(cmp("<", vb("g23s2_ex","ex"), vb("g23s2_px","px")), vchg("g23s2_ex","ex", nb(2))),
    pif(cmp(">", vb("g23s2_ex","ex"), vb("g23s2_px","px")), vchg("g23s2_ex","ex", nb(-2))),
    pif(cmp("<", vb("g23s2_ey","ey"), vb("g23s2_py","py")), vchg("g23s2_ey","ey", nb(2))),
    pif(cmp(">", vb("g23s2_ey","ey"), vb("g23s2_py","py")), vchg("g23s2_ey","ey", nb(-2))),
    vchg("g23s2_sc", "score", nb(1)),
    hitcheck_xy("g23s2_px", "px", vb("g23s2_py", "py"),
                "g23s2_ex", "ex", "g23s2_ey", "ey",
                chain(
                    vset("g23s2_st", "state", sb("over")),
                    ranking_update_s2,
                )),
    img(SHIP,  vb("g23s2_px","px"), vb("g23s2_py","py"), 48),
    img(ENEMY, vb("g23s2_ex","ex"), vb("g23s2_ey","ey"), 40),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 10, 10, 24, "#ffffff")'),
)

# ゲームオーバー表示（ランキングリスト付き）
rank_disp = enumerate_start_for(
    1, "g23s2_i", "i", "g23s2_s", "s", "g23s2_rk", "ranking",
    cs('pyco_game.draw_text(f"{i}\\u4f4d: {s // 60}", 200, 258 + (i-1) * 28, 24, "#ffcc00")'),
)

over_s2 = chain(
    dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 200, 220, 28, "#ffffff")'),
    rank_disp,
)

loop_s2 = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g23s2_st","state"), sb("play")), play_s2, else_body=over_s2),
    flip(60),
)

write_xml("game_23_step2_final.xml", wrap(
    varsdecl(*VARS_S2),
    chain(
        gir(),
        game_init(640, 400, "Ranking"),
        music_play(BGM_ACT, loop=True),
        load_ranking,
        vset("g23s2_px","px", nb(300)),
        vset("g23s2_py","py", nb(176)),
        vset("g23s2_ex","ex", nb(100)),
        vset("g23s2_ey","ey", nb(100)),
        vset("g23s2_sc","score", nb(0)),
        vset("g23s2_st","state", sb("play")),
        game_loop(loop_s2),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_23a_new_best.xml  —  NEW BEST! 表示（課題A）
# ゲームオーバー時にランキング1位なら "★ NEW BEST! ★" を表示する
# ════════════════════════════════════════════════════════════════════
VARS_A = [("g23a_nb","is_new_best"),("g23a_rk","ranking"),
          ("g23a_sc","score"),("g23a_st","state")]
VARS_A_FULL = VARS_A + [("g23a_i","i"),("g23a_s","s")]

rank_disp_a = enumerate_start_for(
    1, "g23a_i", "i", "g23a_s", "s", "g23a_rk", "ranking",
    cs('pyco_game.draw_text(f"{i}\\u4f4d: {s // 60}", 200, 258 + (i-1) * 28, 24, "#ffcc00")'),
)

# over_a はチェーンの最後の引数として使うため pre-chain 可
over_a = chain(
    dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 200, 220, 28, "#ffffff")'),
    rank_disp_a,
    pif(ce("is_new_best"),
        dtxt(sb("\\u2605 NEW BEST! \\u2605"), 170, 340, 30, "#ffd700")),
)

# NOTE: gameover_body_a は個別ブロックとして chain() に渡す（pre-chain 禁止）
write_xml("game_23a_new_best.xml", wrap(
    varsdecl(*VARS_A_FULL),
    chain(
        vset("g23a_nb","is_new_best", boob("False")),
        vset("g23a_rk","ranking", list_empty()),
        vset("g23a_sc","score", nb(0)),
        vset("g23a_st","state", sb("play")),
        cs("# ...（ゲームループ内）..."),
        cs("# 衝突判定 → ゲームオーバー時のランキング更新"),
        # gameover_body の各ブロックを個別に展開（double <next> バグを避ける）
        vset("g23a_st", "state", sb("over")),
        vset("g23a_nb", "is_new_best",
             ce("not ranking or score > ranking[0]")),
        list_append("g23a_rk", "ranking", vb("g23a_sc", "score")),
        vset("g23a_rk", "ranking",
             sorted_call("g23a_rk", "ranking", "True")),
        vset("g23a_rk", "ranking",
             list_slice("g23a_rk", "ranking", nb(0), nb(3))),
        file_write("ranking.txt",
                   ce('"\\n".join(str(s) for s in ranking)')),
        cs("# ゲームオーバー画面での表示"),
        over_a,  # LAST — pre-chain 可
    )
))

# ════════════════════════════════════════════════════════════════════
# game_23b_reset_ranking.xml  —  D キーでランキングリセット（課題B）
# ════════════════════════════════════════════════════════════════════
VARS_B = [("g23b_rk","ranking")]

reset_body = chain(
    vset("g23b_rk", "ranking", list_empty()),
    file_write("ranking.txt", sb("")),
)

write_xml("game_23b_reset_ranking.xml", wrap(
    varsdecl(*VARS_B),
    chain(
        vset("g23b_rk","ranking", list_empty()),
        cs("# ゲームオーバー画面内（over 状態のブロック）"),
        pif(ce("pyco_game.key_just_pressed('K_d')"), reset_body),
        cs("# ランキング表示（for ループ）"),
        enumerate_start_for(
            1, "g23b_i", "i", "g23b_s", "s", "g23b_rk", "ranking",
            cs('pyco_game.draw_text(f"{i}\\u4f4d: {s // 60}", 200, 258 + (i-1) * 28, 24, "#ffcc00")'),
        ),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_23c_play_count.xml  —  プレイ回数をファイルに記録（課題C）
# ════════════════════════════════════════════════════════════════════
VARS_C = [("g23c_pc","play_count")]

load_play_count = try_except("Exception",
    body_block=chain(
        file_read("play_count.txt", "_raw"),
        vset("g23c_pc", "play_count", type_cast(ce("_raw"), "int")),
    ),
    handler_block=vset("g23c_pc", "play_count", nb(0)),
)

write_xml("game_23c_play_count.xml", wrap(
    varsdecl(*VARS_C),
    chain(
        load_play_count,
        cs("# ... ゲームセットアップ ..."),
        cs("# ゲームオーバー時：プレイ回数を更新して保存"),
        vchg("g23c_pc", "play_count", nb(1)),
        file_write("play_count.txt",
                   type_cast(vb("g23c_pc", "play_count"), "str")),
        cs("# プレイ状態の表示（ゲームループ内）"),
        cs('pyco_game.draw_text(f"\\u6311\\u6226\\u56de\\u6570: {play_count}", 10, 66, 22, "#aaaaaa")'),
    )
))

print("\n✓ 5 XML files for game_23 generated.")
