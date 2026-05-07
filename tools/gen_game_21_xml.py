#!/usr/bin/env python3
"""game_21 (㉒ 敵AIを作ろう) の XML ファイルを生成する。"""
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

# ── statement blocks (each returns a proper <block>...</block>) ─────
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
    """game_import_random — proper open/close tag so chain() can find </block>"""
    s = '<block type="game_import_random" x="20" y="20">'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def gevt(nxt=""):
    """game_events — proper open/close tag"""
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
            raise ValueError(f"No </block> found in: {b[:80]}")
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

# ── collision detection (abs distance check) ─────────────────────────
def hitcheck_xy(px_id, px_name, py_val, ex_id, ex_name, ey_id, ey_name,
                body, nxt="", radius=40):
    """py_val can be a value block (vb or nb) for player y"""
    cond = cand(
        cmp("<", absb(mathop("-", vb(px_id, px_name), vb(ex_id, ex_name))), nb(radius)),
        cmp("<", absb(mathop("-", py_val, vb(ey_id, ey_name))), nb(radius)),
    )
    return pif(cond, body, nxt=nxt)

# ════════════════════════════════════════════════════════════════════
# game_21_step1_final.xml  —  1 体の追いかけ敵
# ════════════════════════════════════════════════════════════════════
VARS_S1 = [("g21s1_px","px"),("g21s1_py","py"),("g21s1_ex","ex"),
           ("g21s1_ey","ey"),("g21s1_sc","score"),("g21s1_st","state")]

play_s1 = chain(
    pif(kpress("K_LEFT"),  vchg("g21s1_px","px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g21s1_px","px", nb(4))),
    pif(kpress("K_UP"),    vchg("g21s1_py","py", nb(-4))),
    pif(kpress("K_DOWN"),  vchg("g21s1_py","py", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    cs("if py < 0:   py = 0"),
    cs("if py > 352: py = 352"),
    # chase AI
    pif(cmp("<", vb("g21s1_ex","ex"), vb("g21s1_px","px")), vchg("g21s1_ex","ex", nb(2))),
    pif(cmp(">", vb("g21s1_ex","ex"), vb("g21s1_px","px")), vchg("g21s1_ex","ex", nb(-2))),
    pif(cmp("<", vb("g21s1_ey","ey"), vb("g21s1_py","py")), vchg("g21s1_ey","ey", nb(2))),
    pif(cmp(">", vb("g21s1_ey","ey"), vb("g21s1_py","py")), vchg("g21s1_ey","ey", nb(-2))),
    vchg("g21s1_sc","score", nb(1)),
    hitcheck_xy("g21s1_px","px", vb("g21s1_py","py"),
                "g21s1_ex","ex", "g21s1_ey","ey",
                vset("g21s1_st","state", sb("over"))),
    img(SHIP,  vb("g21s1_px","px"), vb("g21s1_py","py"), 48),
    img(ENEMY, vb("g21s1_ex","ex"), vb("g21s1_ey","ey"), 40),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 10, 10, 24, "#ffffff")'),
)

over_s1 = chain(
    dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 260, 220, 28, "#ffffff")'),
)

loop_s1 = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g21s1_st","state"), sb("play")), play_s1, else_body=over_s1),
    flip(60),
)

write_xml("game_21_step1_final.xml", wrap(
    varsdecl(*VARS_S1),
    chain(
        gir(),
        game_init(640, 400, "Chase Enemy"),
        vset("g21s1_px","px", nb(300)),
        vset("g21s1_py","py", nb(176)),
        vset("g21s1_ex","ex", nb(100)),
        vset("g21s1_ey","ey", nb(100)),
        vset("g21s1_sc","score", nb(0)),
        vset("g21s1_st","state", sb("play")),
        game_loop(loop_s1),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_21_step2_final.xml  —  3 体リスト管理
# ════════════════════════════════════════════════════════════════════
VARS_S2 = [("g21s2_px","px"),("g21s2_py","py"),
           ("g21s2_en","enemies"),("g21s2_sc","score"),("g21s2_st","state")]

play_s2 = chain(
    pif(kpress("K_LEFT"),  vchg("g21s2_px","px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g21s2_px","px", nb(4))),
    pif(kpress("K_UP"),    vchg("g21s2_py","py", nb(-4))),
    pif(kpress("K_DOWN"),  vchg("g21s2_py","py", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    cs("if py < 0:   py = 0"),
    cs("if py > 352: py = 352"),
    vchg("g21s2_sc","score", nb(1)),
    cs("for e in enemies:"),
    cs("    if e[0] < px: e[0] += 1"),
    cs("    if e[0] > px: e[0] -= 1"),
    cs("    if e[1] < py: e[1] += 1"),
    cs("    if e[1] > py: e[1] -= 1"),
    cs("    if abs(px-e[0])<40 and abs(py-e[1])<40: state='over'"),
    cs('    pyco_game.draw_image("assets/game-icons/enemy_bug.svg", e[0], e[1], 40)'),
    img(SHIP, vb("g21s2_px","px"), vb("g21s2_py","py"), 48),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 10, 10, 24, "#ffffff")'),
)

over_s2 = chain(
    dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 260, 220, 28, "#ffffff")'),
)

loop_s2 = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g21s2_st","state"), sb("play")), play_s2, else_body=over_s2),
    flip(60),
)

write_xml("game_21_step2_final.xml", wrap(
    varsdecl(*VARS_S2),
    chain(
        gir(),
        game_init(640, 400, "3 Enemies"),
        vset("g21s2_px","px", nb(300)),
        vset("g21s2_py","py", nb(176)),
        vset("g21s2_en","enemies",
             ce("[[random.randint(0,560),random.randint(0,360)] for _ in range(3)]")),
        vset("g21s2_sc","score", nb(0)),
        vset("g21s2_st","state", sb("play")),
        game_loop(loop_s2),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_21a_speed_up.xml  —  スコアで敵スピードアップ
# ════════════════════════════════════════════════════════════════════
VARS_A = [("g21a_px","px"),("g21a_py","py"),("g21a_ex","ex"),
          ("g21a_ey","ey"),("g21a_sp","sp"),("g21a_sc","score"),("g21a_st","state")]

play_a = chain(
    pif(kpress("K_LEFT"),  vchg("g21a_px","px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g21a_px","px", nb(4))),
    pif(kpress("K_UP"),    vchg("g21a_py","py", nb(-4))),
    pif(kpress("K_DOWN"),  vchg("g21a_py","py", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    cs("if py < 0:   py = 0"),
    cs("if py > 352: py = 352"),
    vchg("g21a_sc","score", nb(1)),
    # sp = 2 + score // 300
    vset("g21a_sp","sp", mathop("+", nb(2), mathop("//", vb("g21a_sc","score"), nb(300)))),
    # chase AI using sp
    pif(cmp("<", vb("g21a_ex","ex"), vb("g21a_px","px")), vchg("g21a_ex","ex", vb("g21a_sp","sp"))),
    pif(cmp(">", vb("g21a_ex","ex"), vb("g21a_px","px")), vchg("g21a_ex","ex", ce("-sp"))),
    pif(cmp("<", vb("g21a_ey","ey"), vb("g21a_py","py")), vchg("g21a_ey","ey", vb("g21a_sp","sp"))),
    pif(cmp(">", vb("g21a_ey","ey"), vb("g21a_py","py")), vchg("g21a_ey","ey", ce("-sp"))),
    hitcheck_xy("g21a_px","px", vb("g21a_py","py"),
                "g21a_ex","ex", "g21a_ey","ey",
                vset("g21a_st","state", sb("over"))),
    img(SHIP,  vb("g21a_px","px"), vb("g21a_py","py"), 48),
    img(ENEMY, vb("g21a_ex","ex"), vb("g21a_ey","ey"), 40),
    cs('pyco_game.draw_text(f"Score: {score // 60}  Speed: {sp}", 10, 10, 24, "#ffffff")'),
)

over_a = dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c")

loop_a = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g21a_st","state"), sb("play")), play_a, else_body=over_a),
    flip(60),
)

write_xml("game_21a_speed_up.xml", wrap(
    varsdecl(*VARS_A),
    chain(
        gir(),
        game_init(640, 400, "Speed Up"),
        vset("g21a_px","px", nb(300)),
        vset("g21a_py","py", nb(176)),
        vset("g21a_ex","ex", nb(100)),
        vset("g21a_ey","ey", nb(100)),
        vset("g21a_sp","sp", nb(2)),
        vset("g21a_sc","score", nb(0)),
        vset("g21a_st","state", sb("play")),
        game_loop(loop_a),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_21b_shoot_enemy.xml  —  弾で敵を倒す
# ════════════════════════════════════════════════════════════════════
VARS_B = [("g21b_px","px"),("g21b_py","py"),("g21b_ex","ex"),
          ("g21b_ey","ey"),("g21b_bx","bx"),("g21b_by","by"),
          ("g21b_ba","bactive"),("g21b_sc","score"),("g21b_st","state")]

# Note: player_y is fixed at 340 for shoot game
play_b = chain(
    pif(kpress("K_LEFT"),  vchg("g21b_px","px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g21b_px","px", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    # enemy chases player (x only)
    pif(cmp("<", vb("g21b_ex","ex"), vb("g21b_px","px")), vchg("g21b_ex","ex", nb(1))),
    pif(cmp(">", vb("g21b_ex","ex"), vb("g21b_px","px")), vchg("g21b_ex","ex", nb(-1))),
    # bullet move & hit
    cs("if bactive:"),
    cs("    by -= 8"),
    cs("    if by < -20: bactive = False"),
    cs("    if abs(bx-ex)<30 and abs(by-ey)<30:"),
    cs("        score += 10; bactive = False"),
    cs("        ex = random.randint(0,560); ey = random.randint(0,180)"),
    # player-enemy collision (py=340 fixed)
    hitcheck_xy("g21b_px","px", nb(340),
                "g21b_ex","ex", "g21b_ey","ey",
                vset("g21b_st","state", sb("over"))),
    # draw
    img(SHIP,  vb("g21b_px","px"), vb("g21b_py","py"), 48),
    img(ENEMY, vb("g21b_ex","ex"), vb("g21b_ey","ey"), 40),
    cs("if bactive:"),
    cs('    pyco_game.draw_image("assets/game-icons/bullet.svg", bx, by, 12)'),
    cs('pyco_game.draw_text(f"Score: {score}", 10, 10, 24, "#ffffff")'),
)

over_b = chain(
    dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
    cs('pyco_game.draw_text(f"Score: {score}", 260, 220, 28, "#ffffff")'),
)

loop_b = chain(
    gevt(),
    cs("if pyco_game.key_just_pressed('K_SPACE') and not bactive:"),
    cs("    bx = px + 12; by = 340; bactive = True"),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g21b_st","state"), sb("play")), play_b, else_body=over_b),
    flip(60),
)

write_xml("game_21b_shoot_enemy.xml", wrap(
    varsdecl(*VARS_B),
    chain(
        gir(),
        game_init(640, 400, "Shoot Enemy"),
        vset("g21b_px","px", nb(300)),
        vset("g21b_py","py", nb(340)),
        vset("g21b_ex","ex", nb(100)),
        vset("g21b_ey","ey", nb(60)),
        vset("g21b_bx","bx", nb(-100)),
        vset("g21b_by","by", nb(-100)),
        vset("g21b_ba","bactive", boob("False")),
        vset("g21b_sc","score", nb(0)),
        vset("g21b_st","state", sb("play")),
        game_loop(loop_b),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_21c_patrol.xml  —  往復パターン敵
# ════════════════════════════════════════════════════════════════════
VARS_C = [("g21c_px","px"),("g21c_py","py"),("g21c_ex","ex"),
          ("g21c_ey","ey"),("g21c_edx","edx"),
          ("g21c_sc","score"),("g21c_st","state")]

play_c = chain(
    pif(kpress("K_LEFT"),  vchg("g21c_px","px", nb(-4))),
    pif(kpress("K_RIGHT"), vchg("g21c_px","px", nb(4))),
    pif(kpress("K_UP"),    vchg("g21c_py","py", nb(-4))),
    pif(kpress("K_DOWN"),  vchg("g21c_py","py", nb(4))),
    cs("if px < 0:   px = 0"),
    cs("if px > 592: px = 592"),
    cs("if py < 0:   py = 0"),
    cs("if py > 352: py = 352"),
    vchg("g21c_sc","score", nb(1)),
    # patrol: ex += edx
    vchg("g21c_ex","ex", vb("g21c_edx","edx")),
    # reverse direction at walls  (use ce() for condition value)
    pif(ce("ex < 0 or ex > 560"),
        vset("g21c_edx","edx", ce("-edx"))),
    hitcheck_xy("g21c_px","px", vb("g21c_py","py"),
                "g21c_ex","ex", "g21c_ey","ey",
                vset("g21c_st","state", sb("over"))),
    img(SHIP,  vb("g21c_px","px"), vb("g21c_py","py"), 48),
    img(ENEMY, vb("g21c_ex","ex"), vb("g21c_ey","ey"), 40),
    cs('pyco_game.draw_text(f"Score: {score // 60}", 10, 10, 24, "#ffffff")'),
)

over_c = dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c")

loop_c = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g21c_st","state"), sb("play")), play_c, else_body=over_c),
    flip(60),
)

write_xml("game_21c_patrol.xml", wrap(
    varsdecl(*VARS_C),
    chain(
        gir(),
        game_init(640, 400, "Patrol Enemy"),
        vset("g21c_px","px", nb(300)),
        vset("g21c_py","py", nb(176)),
        vset("g21c_ex","ex", nb(200)),
        vset("g21c_ey","ey", nb(200)),
        vset("g21c_edx","edx", nb(2)),
        vset("g21c_sc","score", nb(0)),
        vset("g21c_st","state", sb("play")),
        game_loop(loop_c),
        game_quit(),
    )
))

print("\n✓ 5 XML files for game_21 generated.")
