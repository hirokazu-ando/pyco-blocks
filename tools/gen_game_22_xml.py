#!/usr/bin/env python3
"""game_22 (㉓ BGMと効果音を追加しよう) の XML ファイルを生成する。"""
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

SE_OVER = "assets/audio/se/se_gameover.wav"
SE_HIT  = "assets/audio/se/se_hit.wav"
BGM_ACT = "assets/audio/bgm/bgm_action.wav"

def se_preset(path):
    return f'<block type="game_sound_preset"><field name="SE">{path}</field></block>'

def bgm_preset(path):
    return f'<block type="game_music_preset"><field name="BGM">{path}</field></block>'

def sound_load(se_path, nxt=""):
    s = (f'<block type="game_sound_load">'
         f'<value name="URL">{se_preset(se_path)}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def music_play(bgm_path, loop=True, nxt=""):
    loop_val = "TRUE" if loop else "FALSE"
    s = (f'<block type="game_music_load_play"><field name="LOOP">{loop_val}</field>'
         f'<value name="URL">{bgm_preset(bgm_path)}</value>')
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def music_stop(nxt=""):
    s = '<block type="game_music_stop">'
    if nxt: s += f"<next>{nxt}</next>"
    return s + "</block>"

def sound_play(sound_var_block, nxt=""):
    s = f'<block type="game_sound_play"><value name="SOUND">{sound_var_block}</value>'
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

# ────────── 共通チェイスゲームのプレイ部分 ─────────────────────────────────
def chase_play(px_id, py_id, ex_id, ey_id, sc_id, st_id,
               gameover_extra=""):
    """gameover_extra: state="over"の後に追加するブロック文字列"""
    gameover_body = vset(st_id, "state", sb("over"))
    if gameover_extra:
        # Insert gameover_extra AFTER var_set (use rfind to get outermost </block>)
        idx = gameover_body.rfind("</block>")
        gameover_body = gameover_body[:idx] + f"<next>{gameover_extra}</next></block>"
    return chain(
        pif(kpress("K_LEFT"),  vchg(px_id, "px", nb(-4))),
        pif(kpress("K_RIGHT"), vchg(px_id, "px", nb(4))),
        pif(kpress("K_UP"),    vchg(py_id, "py", nb(-4))),
        pif(kpress("K_DOWN"),  vchg(py_id, "py", nb(4))),
        cs("if px < 0:   px = 0"),
        cs("if px > 592: px = 592"),
        cs("if py < 0:   py = 0"),
        cs("if py > 352: py = 352"),
        pif(cmp("<", vb(ex_id, "ex"), vb(px_id, "px")), vchg(ex_id, "ex", nb(2))),
        pif(cmp(">", vb(ex_id, "ex"), vb(px_id, "px")), vchg(ex_id, "ex", nb(-2))),
        pif(cmp("<", vb(ey_id, "ey"), vb(py_id, "py")), vchg(ey_id, "ey", nb(2))),
        pif(cmp(">", vb(ey_id, "ey"), vb(py_id, "py")), vchg(ey_id, "ey", nb(-2))),
        vchg(sc_id, "score", nb(1)),
        hitcheck_xy(px_id, "px", vb(py_id, "py"),
                    ex_id, "ex", ey_id, "ey", gameover_body),
        img(SHIP,  vb(px_id, "px"), vb(py_id, "py"), 48),
        img(ENEMY, vb(ex_id, "ex"), vb(ey_id, "ey"), 40),
        cs('pyco_game.draw_text(f"Score: {score // 60}", 10, 10, 24, "#ffffff")'),
    )

def chase_over(sc_id):
    return chain(
        dtxt(sb("GAME OVER"), 190, 160, 40, "#ff3c3c"),
        cs('pyco_game.draw_text(f"Score: {score // 60}", 260, 220, 28, "#ffffff")'),
    )

# ════════════════════════════════════════════════════════════════════
# game_22_step1_final.xml  —  チェイスゲーム + BGM
# ════════════════════════════════════════════════════════════════════
VARS_S1 = [("g22s1_px","px"),("g22s1_py","py"),("g22s1_ex","ex"),
           ("g22s1_ey","ey"),("g22s1_sc","score"),("g22s1_st","state")]

play_s1 = chase_play("g22s1_px","g22s1_py","g22s1_ex","g22s1_ey","g22s1_sc","g22s1_st")
over_s1 = chase_over("g22s1_sc")
loop_s1 = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g22s1_st","state"), sb("play")), play_s1, else_body=over_s1),
    flip(60),
)

write_xml("game_22_step1_final.xml", wrap(
    varsdecl(*VARS_S1),
    chain(
        gir(),
        game_init(640, 400, "Chase + BGM"),
        music_play(BGM_ACT, loop=True),   # BGM ブロック ← これが主役
        vset("g22s1_px","px", nb(300)),
        vset("g22s1_py","py", nb(176)),
        vset("g22s1_ex","ex", nb(100)),
        vset("g22s1_ey","ey", nb(100)),
        vset("g22s1_sc","score", nb(0)),
        vset("g22s1_st","state", sb("play")),
        game_loop(loop_s1),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_22_step2_final.xml  —  BGM + ゲームオーバー効果音
# ════════════════════════════════════════════════════════════════════
VARS_S2 = [("g22s2_px","px"),("g22s2_py","py"),("g22s2_ex","ex"),
           ("g22s2_ey","ey"),("g22s2_sc","score"),("g22s2_st","state"),
           ("g22s2_so","se_over"),("g22s2_sp","se_played")]

# gameover_extra: play SE and set se_played=True
se_play_once = chain(
    pif(ce("not se_played"),
        chain(
            sound_play(vb("g22s2_so","se_over")),
            vset("g22s2_sp","se_played", boob("True")),
        )),
)

play_s2 = chase_play("g22s2_px","g22s2_py","g22s2_ex","g22s2_ey","g22s2_sc","g22s2_st",
                     gameover_extra=se_play_once)
over_s2 = chase_over("g22s2_sc")
loop_s2 = chain(
    gevt(),
    gfill("#0a0a2e"),
    pif(cmp("==", vb("g22s2_st","state"), sb("play")), play_s2, else_body=over_s2),
    flip(60),
)

write_xml("game_22_step2_final.xml", wrap(
    varsdecl(*VARS_S2),
    chain(
        gir(),
        game_init(640, 400, "Chase + SE"),
        music_play(BGM_ACT, loop=True),
        # se_over = Sound("se_gameover.wav")
        vset("g22s2_so","se_over",
             f'<block type="game_sound_load"><value name="URL">{se_preset(SE_OVER)}</value></block>'),
        vset("g22s2_sp","se_played", boob("False")),
        vset("g22s2_px","px", nb(300)),
        vset("g22s2_py","py", nb(176)),
        vset("g22s2_ex","ex", nb(100)),
        vset("g22s2_ey","ey", nb(100)),
        vset("g22s2_sc","score", nb(0)),
        vset("g22s2_st","state", sb("play")),
        game_loop(loop_s2),
        game_quit(),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_22a_bgm_mute.xml  —  M キー BGM ミュート切り替え
# Show only the key concept: mute flag + M key toggle
# ════════════════════════════════════════════════════════════════════
VARS_A = [("g22a_mu","mute")]

# Show: mute = False, then key_just_pressed M → toggle mute → set_volume
mute_toggle = chain(
    vset("g22a_mu","mute", ce("not mute")),
    cs("pygame.mixer.music.set_volume(0 if mute else 1.0)"),
)

write_xml("game_22a_bgm_mute.xml", wrap(
    varsdecl(*VARS_A),
    chain(
        vset("g22a_mu","mute", boob("False"), ),
        cs("# ゲームループ内 — イベント処理で M キーを検出"),
        pif(ce("pyco_game.key_just_pressed('K_m')"), mute_toggle),
        dtxt(ce("'BGM: OFF' if mute else 'BGM: ON'"), 10, 370, 22, "#aaaaaa"),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_22b_warning_sound.xml  —  敵が近づいたら警告音
# ════════════════════════════════════════════════════════════════════
VARS_B = [("g22b_sw","se_warn"),("g22b_wd","warned"),
          ("g22b_px","px"),("g22b_py","py"),("g22b_ex","ex"),("g22b_ey","ey")]

warn_cond = cand(
    cmp("<", absb(mathop("-", vb("g22b_px","px"), vb("g22b_ex","ex"))), nb(100)),
    cmp("<", absb(mathop("-", vb("g22b_py","py"), vb("g22b_ey","ey"))), nb(100)),
)
warn_body = chain(
    pif(ce("not warned"),
        chain(
            sound_play(vb("g22b_sw","se_warn")),
            vset("g22b_wd","warned", boob("True")),
        )),
)
far_body = vset("g22b_wd","warned", boob("False"))

write_xml("game_22b_warning_sound.xml", wrap(
    varsdecl(*VARS_B),
    chain(
        vset("g22b_sw","se_warn",
             f'<block type="game_sound_load"><value name="URL">{se_preset(SE_HIT)}</value></block>'),
        vset("g22b_wd","warned", boob("False")),
        cs("# ゲームループ内のプレイ状態処理"),
        vset("g22b_px","px", nb(300)),
        vset("g22b_py","py", nb(176)),
        vset("g22b_ex","ex", nb(400)),
        vset("g22b_ey","ey", nb(200)),
        cs("# 距離 100 以内で警告音（1 回のみ）"),
        pif(warn_cond, warn_body, else_body=far_body),
    )
))

# ════════════════════════════════════════════════════════════════════
# game_22c_bgm_stop.xml  —  ゲームオーバー時 BGM 停止
# ════════════════════════════════════════════════════════════════════
VARS_C = [("g22c_so","se_over"),("g22c_sp","se_played"),
          ("g22c_st","state"),("g22c_px","px"),("g22c_py","py"),
          ("g22c_ex","ex"),("g22c_ey","ey")]

go_body_c = chain(
    vset("g22c_st","state", sb("over")),
    pif(ce("not se_played"),
        chain(
            sound_play(vb("g22c_so","se_over")),
            vset("g22c_sp","se_played", boob("True")),
        )),
    music_stop(),   # ← BGM を止める
)

hit_cond_c = cand(
    cmp("<", absb(mathop("-", vb("g22c_px","px"), vb("g22c_ex","ex"))), nb(40)),
    cmp("<", absb(mathop("-", vb("g22c_py","py"), vb("g22c_ey","ey"))), nb(40)),
)

write_xml("game_22c_bgm_stop.xml", wrap(
    varsdecl(*VARS_C),
    chain(
        vset("g22c_so","se_over",
             f'<block type="game_sound_load"><value name="URL">{se_preset(SE_OVER)}</value></block>'),
        vset("g22c_sp","se_played", boob("False")),
        vset("g22c_px","px", nb(300)),
        vset("g22c_py","py", nb(176)),
        vset("g22c_ex","ex", nb(100)),
        vset("g22c_ey","ey", nb(100)),
        vset("g22c_st","state", sb("play")),
        cs("# ゲームループ内の衝突判定で BGM を止める"),
        pif(hit_cond_c, go_body_c),
    )
))

print("\n✓ 5 XML files for game_22 generated.")
