#!/usr/bin/env python3
"""Pycoblocks の Blockly XML を、app.js と同じロジックで pygame コードに変換するシミュレータ。

完全な再現を目指すのではなく、Part 4/5（ゲーム）XMLで実際に使われるブロック型に絞って実装する。
記事の <pre><code> と差分をとるために使う。

Part 5 追加対応ブロック（game_23/24 以降）:
  値: py_type_cast / py_sorted_call / py_list_slice
  文: py_file_write / py_file_read / py_file_readlines / py_try_except / py_enumerate_start_for
"""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from typing import Optional

NS = '{https://developers.google.com/blockly/xml}'


def _jsstring(s: str) -> str:
    """JS の JSON.stringify と同じく非ASCIIをそのまま出力する。"""
    return json.dumps(s, ensure_ascii=False)


def _strip_outer_parens(s: str) -> str:
    """式の外側を包む冗長な () を1段だけ剥がす（if/while トップ用）。"""
    if not isinstance(s, str):
        return s
    t = s.strip()
    if len(t) < 2 or t[0] != '(' or t[-1] != ')':
        return s
    depth = 0
    for i, c in enumerate(t):
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0 and i != len(t) - 1:
                return s
    return t[1:-1].strip()


def _has_toplevel_kw(s: str, kw: str) -> bool:
    """括弧の外に kw（例 ' or '）が現れるかどうか。"""
    if not isinstance(s, str):
        return False
    depth = 0
    klen = len(kw)
    i = 0
    while i < len(s):
        c = s[i]
        if c in '([':
            depth += 1
        elif c in ')]':
            depth -= 1
        elif depth == 0 and s[i:i + klen] == kw:
            return True
        i += 1
    return False


def _strip_ns(tag: str) -> str:
    return tag.split('}', 1)[-1] if '}' in tag else tag


def _children(elem: ET.Element) -> list[ET.Element]:
    return list(elem)


def _find_value_block(parent: ET.Element, name: str) -> Optional[ET.Element]:
    """parent の <value name="NAME"> 内の最初の <block> を返す。"""
    for v in parent:
        if _strip_ns(v.tag) != 'value':
            continue
        if v.attrib.get('name') != name:
            continue
        for c in v:
            if _strip_ns(c.tag) == 'block' or _strip_ns(c.tag) == 'shadow':
                return c
    return None


def _find_statement_block(parent: ET.Element, name: str) -> Optional[ET.Element]:
    """parent の <statement name="NAME"> 内の最初の <block> を返す。"""
    for s in parent:
        if _strip_ns(s.tag) != 'statement':
            continue
        if s.attrib.get('name') != name:
            continue
        for c in s:
            if _strip_ns(c.tag) == 'block':
                return c
    return None


def _find_field(parent: ET.Element, name: str) -> Optional[str]:
    for f in parent:
        if _strip_ns(f.tag) != 'field':
            continue
        if f.attrib.get('name') == name:
            return f.text or ''
    return None


def _next_block(parent: ET.Element) -> Optional[ET.Element]:
    for n in parent:
        if _strip_ns(n.tag) != 'next':
            continue
        for c in n:
            if _strip_ns(c.tag) == 'block':
                return c
    return None


def value_to_code(block: ET.Element, name: str, default: str) -> str:
    sub = _find_value_block(block, name)
    if sub is None:
        return default
    return value_block(sub)


def get_var_name(block: ET.Element, name: str) -> str:
    """val_var の VAR field を取り出す（実装簡略化のため field='VAR' をそのまま返す）。"""
    v = _find_field(block, name)
    return v if v is not None else 'x'


def value_block(block: ET.Element) -> str:
    btype = block.attrib.get('type', '')
    if btype == 'val_var':
        return get_var_name(block, 'VAR')
    if btype == 'val_number':
        return _find_field(block, 'NUM') or '0'
    if btype == 'val_str':
        return _jsstring(_find_field(block, 'TEXT') or '')
    if btype == 'val_bool':
        return 'True' if (_find_field(block, 'BOOL') == 'True') else 'False'
    if btype == 'colour_picker':
        return _jsstring(_find_field(block, 'COLOUR') or '#ffffff')
    if btype == 'game_color':
        return _jsstring(_find_field(block, 'COLOR') or '#ffffff')
    if btype == 'game_image_preset':
        return _jsstring(_find_field(block, 'IMG') or '')
    if btype == 'game_sound_preset':
        return _jsstring(_find_field(block, 'SE') or '')
    if btype == 'game_music_preset':
        return _jsstring(_find_field(block, 'BGM') or '')
    if btype == 'py_math_op':
        left = value_to_code(block, 'LEFT', '0')
        right = value_to_code(block, 'RIGHT', '0')
        op = _find_field(block, 'OP') or '+'
        if op == '-' and left.strip() == '0':
            right_blk_ = _find_value_block(block, 'RIGHT')
            right_op_ = (_find_field(right_blk_, 'OP')
                         if right_blk_ is not None
                         and _strip_ns(right_blk_.get('type', '')) == 'py_math_op'
                         else None)
            if right_op_ in ('+', '-'):
                return f'-({right})'
            return f'-{right}'
        # 子の py_math_op 演算子を見て、必要な時のみ括弧を付ける
        def _prec(o: str) -> int:
            if o in ('*', '/', '//', '%'):
                return 2
            if o in ('+', '-'):
                return 1
            return 0
        left_blk = _find_value_block(block, 'LEFT')
        right_blk = _find_value_block(block, 'RIGHT')
        left_op = _find_field(left_blk, 'OP') if (left_blk is not None and _strip_ns(left_blk.get('type', '')) == 'py_math_op') else None
        right_op = _find_field(right_blk, 'OP') if (right_blk is not None and _strip_ns(right_blk.get('type', '')) == 'py_math_op') else None
        my_p = _prec(op)
        l_p = _prec(left_op) if left_op else 99
        r_p = _prec(right_op) if right_op else 99
        associative = op in ('+', '*')
        lw = f'({left})' if l_p < my_p else left
        rw = f'({right})' if (r_p < my_p or (r_p == my_p and not associative)) else right
        return f'{lw} {op} {rw}'
    if btype == 'py_str_concat':
        a = value_to_code(block, 'A', '""')
        b = value_to_code(block, 'B', '""')
        return f'(str({a}) + str({b}))'
    if btype == 'cond_compare':
        left = value_to_code(block, 'LEFT', '0')
        right = value_to_code(block, 'RIGHT', '0')
        op = _find_field(block, 'OP') or '=='
        return f'{left} {op} {right}'
    if btype == 'cond_and':
        a = value_to_code(block, 'A', 'True')
        b = value_to_code(block, 'B', 'True')
        import re as _re
        cmp_re = _re.compile(r'^(.+?) (==|!=|<=|>=|<|>) (.+)$')
        ma = cmp_re.match(a)
        mb = cmp_re.match(b)
        if ma and mb and ma.group(3) == mb.group(1):
            return f'{ma.group(1)} {ma.group(2)} {ma.group(3)} {mb.group(2)} {mb.group(3)}'
        aw = f'({a})' if _has_toplevel_kw(a, ' or ') else a
        bw = f'({b})' if _has_toplevel_kw(b, ' or ') else b
        return f'{aw} and {bw}'
    if btype == 'cond_or':
        a = value_to_code(block, 'A', 'False')
        b = value_to_code(block, 'B', 'False')
        return f'{a} or {b}'
    if btype == 'cond_not':
        a = value_to_code(block, 'A', 'True')
        return f'not {a}'
    if btype == 'py_fstring':
        pre = _find_field(block, 'PRE') or ''
        post = _find_field(block, 'POST') or ''
        val = value_to_code(block, 'VAR', '""')
        def esc(s: str) -> str:
            return s.replace('\\', '\\\\').replace("'", "\\'")
        return f"f'{esc(pre)}{{{val}}}{esc(post)}'"
    if btype == 'py_fstring2_expr':
        pre = _find_field(block, 'PRE') or ''
        mid = _find_field(block, 'MID') or ''
        post = _find_field(block, 'POST') or ''
        v1 = value_to_code(block, 'VAR1', '""')
        v2 = value_to_code(block, 'VAR2', '""')
        def esc2(s: str) -> str:
            return s.replace('\\', '\\\\').replace("'", "\\'")
        return f"f'{esc2(pre)}{{{v1}}}{esc2(mid)}{{{v2}}}{esc2(post)}'"
    if btype == 'py_ternary':
        then_v = value_to_code(block, 'THEN', 'None')
        cond_v = value_to_code(block, 'COND', 'True')
        else_v = value_to_code(block, 'ELSE', 'None')
        return f'{then_v} if {cond_v} else {else_v}'
    if btype == 'py_list_empty':
        return '[]'
    if btype == 'py_list_literal':
        items = []
        i = 0
        while True:
            v = _find_value_block(block, f'ITEM{i}')
            if v is None and i >= 16:
                break
            if v is None:
                # 連続して見つからない場合は終了（最大16要素）
                if i > 0 and not any(_find_value_block(block, f'ITEM{j}') for j in range(i, i + 4)):
                    break
                i += 1
                continue
            items.append(value_block(v))
            i += 1
            if i > 64:
                break
        return f'[{", ".join(items)}]'
    if btype == 'py_list_len':
        return f'len({get_var_name(block, "LIST")})'
    if btype == 'py_list_get':
        idx = value_to_code(block, 'INDEX', '0')
        return f'{get_var_name(block, "LIST")}[{idx}]'
    if btype == 'py_list_pop':
        return f'{get_var_name(block, "LIST")}.pop()'
    if btype == 'py_range':
        rstart = _find_field(block, 'START') or '0'
        rstop = _find_field(block, 'STOP') or '10'
        return f'range({rstop})' if str(rstart) == '0' else f'range({rstart}, {rstop})'
    if btype == 'py_list_comp':
        expr = value_to_code(block, 'EXPR', 'x')
        var = get_var_name(block, 'VAR')
        lst = value_to_code(block, 'LIST', '[]')
        return f'[{expr} for {var} in {lst}]'
    if btype == 'py_list_comp_if':
        expr = value_to_code(block, 'EXPR', 'x')
        var = get_var_name(block, 'VAR')
        lst = value_to_code(block, 'LIST', '[]')
        cond = value_to_code(block, 'COND', 'True')
        return f'[{expr} for {var} in {lst} if {cond}]'
    if btype == 'py_random_int':
        return f'random.randint({value_to_code(block, "FROM", "1")}, {value_to_code(block, "TO", "10")})'
    if btype == 'game_random_int':
        lo = _find_field(block, 'LO') or '0'
        hi = _find_field(block, 'HI') or '576'
        return f'random.randint({lo}, {hi})'
    if btype == 'py_round':
        val = value_to_code(block, 'VALUE', '0')
        digits = value_to_code(block, 'DIGITS', '2')
        return f'round({val}, {digits})'
    if btype == 'py_abs':
        return f'abs({_strip_outer_parens(value_to_code(block, "VALUE", "0"))})'
    if btype == 'py_int':
        return f'int({_strip_outer_parens(value_to_code(block, "VALUE", "0"))})'
    if btype == 'py_min2':
        a = _strip_outer_parens(value_to_code(block, 'A', '0'))
        b = _strip_outer_parens(value_to_code(block, 'B', '0'))
        return f'min({a}, {b})'
    if btype == 'py_max2':
        a = _strip_outer_parens(value_to_code(block, 'A', '0'))
        b = _strip_outer_parens(value_to_code(block, 'B', '0'))
        return f'max({a}, {b})'
    if btype == 'game_get_ticks':
        return 'pygame.time.get_ticks()'
    if btype == 'game_timer_done':
        var = _find_field(block, 'VAR') or 'expire_at'
        return f'pygame.time.get_ticks() >= {var}'
    if btype == 'game_world_to_screen_x':
        return f'{value_to_code(block, "X", "0")} - cam_x'
    if btype == 'game_world_to_screen_y':
        return f'{value_to_code(block, "Y", "0")} - cam_y'
    if btype == 'game_tilemap_create':
        w = value_to_code(block, 'W', '10')
        h = value_to_code(block, 'H', '10')
        f = value_to_code(block, 'FILL', '0')
        return f'[[{f}] * {w} for _ in range({h})]'
    if btype == 'game_tilemap_get':
        m = value_to_code(block, 'MAP', 'tilemap')
        y = value_to_code(block, 'Y', '0')
        x = value_to_code(block, 'X', '0')
        return f'{m}[{y}][{x}]'
    if btype == 'game_grid_rotate90':
        g = value_to_code(block, 'GRID', 'grid')
        return f'[list(_row) for _row in zip(*{g}[::-1])]'
    if btype == 'game_sound_load':
        url = value_to_code(block, 'URL', '"assets/audio/se/se_jump.wav"')
        return f'pygame.mixer.Sound({url})'
    if btype == 'game_mouse_x':
        return 'pygame.mouse.get_pos()[0]'
    if btype == 'game_mouse_y':
        return 'pygame.mouse.get_pos()[1]'
    if btype == 'game_mouse_pressed':
        btn = _find_field(block, 'BTN') or '0'
        return f'pygame.mouse.get_pressed()[{btn}]'
    if btype == 'game_key_pressed':
        key = _find_field(block, 'KEY') or 'K_RIGHT'
        return f'pygame.key.get_pressed()[pygame.{key}]'
    if btype == 'game_keys_held':
        v = get_var_name(block, 'VAR')
        key = _find_field(block, 'KEY') or 'K_RIGHT'
        return f'{v}[pygame.{key}]'
    if btype == 'game_rect':
        x = value_to_code(block, 'X', '0')
        y = value_to_code(block, 'Y', '0')
        w = value_to_code(block, 'W', '10')
        h = value_to_code(block, 'H', '10')
        return f'pygame.Rect({x}, {y}, {w}, {h})'
    if btype == 'game_collide':
        a = value_to_code(block, 'A', 'pygame.Rect(0, 0, 1, 1)')
        b = value_to_code(block, 'B', 'pygame.Rect(0, 0, 1, 1)')
        return f'{a}.colliderect({b})'
    if btype == 'py_custom_expr':
        raw = _find_field(block, 'CODE') or ''
        raw = raw.replace('\r\n', '\n').replace('\r', '\n').split('\n')[0].strip()
        return raw or 'None'
    if btype == 'game_rect_attr':
        rect = value_to_code(block, 'RECT', 'pygame.Rect(0,0,0,0)')
        attr = _find_field(block, 'ATTR') or 'x'
        return f'{rect}.{attr}'
    # --- Part 5 追加対応 ---
    if btype == 'py_type_cast':
        type_name = _find_field(block, 'TYPE') or 'int'
        val = value_to_code(block, 'VALUE', '0')
        return f'{type_name}({val})'
    if btype == 'py_sorted_call':
        lst = get_var_name(block, 'LIST')
        reverse = _find_field(block, 'REVERSE') or 'False'
        return f'sorted({lst}, reverse={reverse})'
    if btype == 'py_list_slice':
        lst = get_var_name(block, 'LIST')
        start = value_to_code(block, 'START', '0')
        stop = value_to_code(block, 'STOP', '10')
        return f'{lst}[{start}:{stop}]'
    return '0'


def statement_to_code(block: ET.Element, indent: str) -> str:
    """先頭ブロックから next を辿って、各ブロックを文として出力。"""
    out: list[str] = []
    cur = block
    while cur is not None:
        out.append(block_to_code(cur, indent))
        cur = _next_block(cur)
    return ''.join(out)


def _inner_statement(block: ET.Element, name: str, indent: str, fallback: str = 'pass') -> str:
    sub = _find_statement_block(block, name)
    if sub is None:
        return indent + fallback + '\n'
    return statement_to_code(sub, indent)


def block_to_code(block: ET.Element, indent: str) -> str:
    btype = block.attrib.get('type', '')
    if btype == 'game_init':
        w = value_to_code(block, 'W', '480')
        h = value_to_code(block, 'H', '320')
        title = value_to_code(block, 'TITLE', '"ゲーム"')
        return (
            indent + 'pygame.init()\n'
            + indent + f'screen = pygame.display.set_mode(({w}, {h}))\n'
            + indent + f'pygame.display.set_caption({title})\n'
            + indent + 'clock = pygame.time.Clock()\n'
        )
    if btype == 'game_loop':
        body = _inner_statement(block, 'DO', indent + '    ')
        if _RUNNING_PRESET:
            return indent + 'while running:\n' + body
        return indent + 'running = True\n' + indent + 'while running:\n' + body
    if btype == 'game_events':
        return (
            indent + 'for event in pygame.event.get():\n'
            + indent + '    if event.type == pygame.QUIT:\n'
            + indent + '        running = False\n'
        )
    if btype == 'game_fill':
        c = value_to_code(block, 'COLOR', '"#000000"')
        return indent + f'screen.fill({c})\n'
    if btype == 'game_draw_rect':
        x = value_to_code(block, 'X', '0')
        y = value_to_code(block, 'Y', '0')
        w = value_to_code(block, 'W', '10')
        h = value_to_code(block, 'H', '10')
        c = value_to_code(block, 'COLOR', '"#ffffff"')
        return indent + f'pygame.draw.rect(screen, {c}, ({x}, {y}, {w}, {h}))\n'
    if btype == 'game_draw_circle':
        x = value_to_code(block, 'X', '0')
        y = value_to_code(block, 'Y', '0')
        r = value_to_code(block, 'R', '10')
        c = value_to_code(block, 'COLOR', '"#ffffff"')
        return indent + f'pygame.draw.circle(screen, {c}, ({x}, {y}), {r})\n'
    if btype == 'game_draw_line':
        x1 = value_to_code(block, 'X1', '0')
        y1 = value_to_code(block, 'Y1', '0')
        x2 = value_to_code(block, 'X2', '0')
        y2 = value_to_code(block, 'Y2', '0')
        c = value_to_code(block, 'COLOR', '"#ffffff"')
        thick_blk = _find_value_block(block, 'THICK')
        if thick_blk is not None:
            th = value_to_code(block, 'THICK', '1')
            return indent + f'pygame.draw.line(screen, {c}, ({x1}, {y1}), ({x2}, {y2}), {th})\n'
        return indent + f'pygame.draw.line(screen, {c}, ({x1}, {y1}), ({x2}, {y2}))\n'
    if btype == 'game_draw_text':
        t = value_to_code(block, 'TEXT', '"Hello"')
        x = value_to_code(block, 'X', '0')
        y = value_to_code(block, 'Y', '0')
        c = value_to_code(block, 'COLOR', '"#ffffff"')
        font_blk = _find_value_block(block, 'FONT')
        if font_blk is not None:
            f = value_to_code(block, 'FONT', 'pygame.font.SysFont(None, 24)')
            return indent + f'screen.blit({f}.render({t}, True, {c}), ({x}, {y}))\n'
        s = value_to_code(block, 'SIZE', '24')
        return (
            indent + f'_f = pygame.font.SysFont(None, {s})\n'
            + indent + f'screen.blit(_f.render({t}, True, {c}), ({x}, {y}))\n'
        )
    if btype == 'game_keys_capture':
        v = get_var_name(block, 'VAR')
        return indent + f'{v} = pygame.key.get_pressed()\n'
    if btype == 'game_mouse_capture':
        mx = get_var_name(block, 'MX')
        my = get_var_name(block, 'MY')
        return indent + f'{mx}, {my} = pygame.mouse.get_pos()\n'
    if btype == 'game_font_set':
        v = get_var_name(block, 'VAR')
        s = value_to_code(block, 'SIZE', '24')
        return indent + f'{v} = pygame.font.SysFont(None, {s})\n'
    if btype == 'game_text_render':
        v = get_var_name(block, 'VAR')
        f = value_to_code(block, 'FONT', 'pygame.font.SysFont(None, 24)')
        t = value_to_code(block, 'TEXT', '"Hello"')
        c = value_to_code(block, 'COLOR', '"#ffffff"')
        return indent + f'{v} = {f}.render({t}, True, {c})\n'
    if btype == 'game_blit_surface':
        s = value_to_code(block, 'SURF', 'None')
        x = value_to_code(block, 'X', '0')
        y = value_to_code(block, 'Y', '0')
        return indent + f'screen.blit({s}, ({x}, {y}))\n'
    if btype == 'game_image_blit':
        url = value_to_code(block, 'URL', '"assets/game-icons/player_ship.svg"')
        x = value_to_code(block, 'X', '0')
        y = value_to_code(block, 'Y', '0')
        w_blk = _find_value_block(block, 'W')
        h_blk = _find_value_block(block, 'H')
        if w_blk is not None and h_blk is not None:
            w = value_to_code(block, 'W', '32')
            h = value_to_code(block, 'H', '32')
            return indent + f'screen.blit(pygame.image.load({url}), ({x}, {y}, {w}, {h}))\n'
        return indent + f'screen.blit(pygame.image.load({url}), ({x}, {y}))\n'
    if btype == 'game_draw_image':
        url = value_to_code(block, 'URL', '"https://example.com/player.png"')
        x = value_to_code(block, 'X', '0')
        y = value_to_code(block, 'Y', '0')
        w = value_to_code(block, 'W', '-1')
        h = value_to_code(block, 'H', '-1')
        rot = value_to_code(block, 'ROT', '0')
        flip = _find_field(block, 'FLIP') or 'NONE'
        out = (
            indent + f'_img = pygame.image.load({url})\n'
            + indent + f'_rw = {w}; _rh = {h}\n'
            + indent + '_img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img\n'
        )
        if rot != '0':
            out += (
                indent + f'_rot_deg = {rot}\n'
                + indent + '_img = pygame.transform.rotate(_img, _rot_deg) if _rot_deg != 0 else _img\n'
            )
        if flip == 'X':
            out += indent + '_img = pygame.transform.flip(_img, True, False)\n'
        elif flip == 'Y':
            out += indent + '_img = pygame.transform.flip(_img, False, True)\n'
        elif flip == 'XY':
            out += indent + '_img = pygame.transform.flip(_img, True, True)\n'
        out += indent + f'screen.blit(_img, ({x}, {y}))\n'
        return out
    if btype == 'game_flip':
        fps = value_to_code(block, 'FPS', '60')
        return indent + 'pygame.display.flip()\n' + indent + f'clock.tick({fps})\n'
    if btype == 'game_quit':
        return indent + 'pygame.quit()\n'
    if btype == 'game_import_random':
        return indent + 'import random\n'
    if btype == 'game_timer_set':
        var = _find_field(block, 'VAR') or 'expire_at'
        sec = value_to_code(block, 'SEC', '3')
        return indent + f'{var} = pygame.time.get_ticks() + {sec} * 1000\n'
    if btype == 'game_camera_set':
        ox = value_to_code(block, 'OX', '0')
        oy = value_to_code(block, 'OY', '0')
        return indent + f'cam_x = {ox}\n' + indent + f'cam_y = {oy}\n'
    if btype == 'game_tilemap_set':
        m = value_to_code(block, 'MAP', 'tilemap')
        y = value_to_code(block, 'Y', '0')
        x = value_to_code(block, 'X', '0')
        v = value_to_code(block, 'VALUE', '0')
        return indent + f'{m}[{y}][{x}] = {v}\n'
    if btype == 'game_tilemap_draw':
        m = value_to_code(block, 'MAP', 'tilemap')
        s = value_to_code(block, 'TILE', '32')
        i = value_to_code(block, 'IMAGES', '{}')
        return (
            indent + f'for _ty in range(len({m})):\n'
            + indent + f'    for _tx in range(len({m}[_ty])):\n'
            + indent + f'        _tid = {m}[_ty][_tx]\n'
            + indent + f'        if _tid in {i}:\n'
            + indent + f'            screen.blit({i}[_tid], (_tx * {s} - cam_x, _ty * {s} - cam_y))\n'
        )
    if btype == 'game_gravity_apply':
        gy  = _find_field(block, 'Y')  or 'y'
        gvy = _find_field(block, 'VY') or 'vy'
        gg  = value_to_code(block, 'GROUND', '400')
        return (
            indent + f'{gvy} += 0.5\n'
            + indent + f'{gy} += {gvy}\n'
            + indent + f'if {gy} >= {gg}:\n'
            + indent + f'    {gy} = {gg}\n'
            + indent + f'    {gvy} = 0\n'
        )
    if btype == 'game_sound_play':
        sp = value_to_code(block, 'SOUND', 'snd')
        return indent + f'{sp}.play()\n'
    if btype == 'game_music_load_play':
        mu = value_to_code(block, 'URL', '"assets/audio/bgm/bgm_action.wav"')
        ml = '-1' if (_find_field(block, 'LOOP') == 'TRUE') else '0'
        return (
            indent + f'pygame.mixer.music.load({mu})\n'
            + indent + f'pygame.mixer.music.play({ml})\n'
        )
    if btype == 'game_music_stop':
        return indent + 'pygame.mixer.music.stop()\n'
    if btype == 'pico_if':
        cond0 = _strip_outer_parens(value_to_code(block, 'IF0', 'True'))
        out = indent + f'if {cond0}:\n'
        out += _inner_statement(block, 'DO0', indent + '    ')
        i = 1
        while True:
            cond_v = _find_value_block(block, f'IF{i}')
            stmt_v = _find_statement_block(block, f'DO{i}')
            if cond_v is None and stmt_v is None:
                break
            cond = _strip_outer_parens(value_to_code(block, f'IF{i}', 'True'))
            out += indent + f'elif {cond}:\n'
            out += _inner_statement(block, f'DO{i}', indent + '    ')
            i += 1
        else_stmt = _find_statement_block(block, 'ELSE')
        if else_stmt is not None:
            out += indent + 'else:\n'
            out += _inner_statement(block, 'ELSE', indent + '    ')
        return out
    if btype == 'pico_for_from_to':
        v = get_var_name(block, 'VAR')
        start = value_to_code(block, 'START', '0')
        stop = value_to_code(block, 'STOP', '10')
        step = value_to_code(block, 'STEP', '1')
        if step == '1' and start == '0':
            range_args = f'{stop}'
        elif step == '1':
            range_args = f'{start}, {stop}'
        else:
            range_args = f'{start}, {stop}, {step}'
        out = indent + f'for {v} in range({range_args}):\n'
        out += _inner_statement(block, 'DO', indent + '    ')
        return out
    if btype == 'pico_for_range':
        v = get_var_name(block, 'VAR')
        n = value_to_code(block, 'N', '10')
        out = indent + f'for {v} in range({n}):\n'
        out += _inner_statement(block, 'DO', indent + '    ')
        return out
    if btype == 'py_for_list':
        item = get_var_name(block, 'VAR')
        lst = get_var_name(block, 'LIST')
        out = indent + f'for {item} in {lst}:\n'
        out += _inner_statement(block, 'DO', indent + '    ')
        return out
    if btype == 'var_set':
        v = get_var_name(block, 'VAR')
        val = _strip_outer_parens(value_to_code(block, 'VALUE', '0'))
        return indent + f'{v} = {val}\n'
    if btype == 'var_set2':
        v1 = get_var_name(block, 'VAR1')
        v2 = get_var_name(block, 'VAR2')
        val1 = _strip_outer_parens(value_to_code(block, 'VALUE1', '0'))
        val2 = _strip_outer_parens(value_to_code(block, 'VALUE2', '0'))
        return indent + f'{v1}, {v2} = {val1}, {val2}\n'
    if btype == 'var_change':
        v = get_var_name(block, 'VAR')
        amt = value_to_code(block, 'AMOUNT', '1')
        trimmed = amt.strip()
        m_num = re.match(r'^-(\d+(?:\.\d+)?)$', trimmed)
        m_unary = re.match(r'^-([A-Za-z_][\w.\[\]]*)$', trimmed)
        m_zero_minus = re.match(r'^\(\s*0\s*-\s*(.+?)\s*\)$', trimmed)
        m_neg_parens = re.match(r'^-\((.+)\)$', trimmed)
        if m_num:
            return indent + f'{v} -= {m_num.group(1)}\n'
        if m_unary:
            return indent + f'{v} -= {m_unary.group(1)}\n'
        if m_zero_minus:
            return indent + f'{v} -= {m_zero_minus.group(1)}\n'
        if m_neg_parens:
            return indent + f'{v} -= {m_neg_parens.group(1)}\n'
        return indent + f'{v} += {_strip_outer_parens(amt)}\n'
    if btype == 'py_list_append':
        lst = get_var_name(block, 'LIST')
        val = value_to_code(block, 'VALUE', 'None')
        return indent + f'{lst}.append({val})\n'
    if btype == 'py_list_pop':
        return indent + f'{get_var_name(block, "LIST")}.pop()\n'
    if btype == 'py_list_set':
        lst = get_var_name(block, 'LIST')
        idx = value_to_code(block, 'INDEX', '0')
        val = value_to_code(block, 'VALUE', 'None')
        # VALUE が `lst[idx] op rhs` の形なら lst[idx] op= rhs に簡略化
        val_blk = _find_value_block(block, 'VALUE')
        if val_blk is not None and _strip_ns(val_blk.get('type', '')) == 'py_math_op':
            op = _find_field(val_blk, 'OP') or '+'
            left_blk = _find_value_block(val_blk, 'LEFT')
            if left_blk is not None and _strip_ns(left_blk.get('type', '')) == 'py_list_get':
                left_lst = get_var_name(left_blk, 'LIST')
                left_idx = value_to_code(left_blk, 'INDEX', '0')
                if left_lst == lst and left_idx == idx and op in ('+', '-', '*', '/', '//', '%'):
                    rhs = value_to_code(val_blk, 'RIGHT', '0')
                    return indent + f'{lst}[{idx}] {op}= {rhs}\n'
        return indent + f'{lst}[{idx}] = {val}\n'
    if btype == 'py_import_module':
        mod = _find_field(block, 'MODULE') or ''
        return indent + f'import {mod}\n'
    if btype == 'py_custom_stmt':
        raw = _find_field(block, 'CODE') or ''
        raw = raw.replace('\r\n', '\n').replace('\r', '\n')
        if not raw.strip():
            return indent + 'pass\n'
        return ''.join(indent + ln + '\n' for ln in raw.split('\n'))
    # --- Part 5 追加対応 ---
    if btype == 'py_file_write':
        fname = _find_field(block, 'FILENAME') or 'output.txt'
        content = value_to_code(block, 'CONTENT', '""')
        return (indent + f'with open("{fname}", "w") as _f:\n'
                + indent + f'    _f.write({content})\n')
    if btype == 'py_file_read':
        fname = _find_field(block, 'FILENAME') or 'input.txt'
        var = _find_field(block, 'VAR') or '_raw'
        return (indent + f'with open("{fname}") as _f:\n'
                + indent + f'    {var} = _f.read()\n')
    if btype == 'py_file_readlines':
        fname = _find_field(block, 'FILENAME') or 'input.txt'
        var = _find_field(block, 'VAR') or 'lines'
        return (indent + f'with open("{fname}") as _f:\n'
                + indent + f'    {var} = _f.readlines()\n')
    if btype == 'py_try_except':
        etype = _find_field(block, 'ETYPE') or 'Exception'
        body = _inner_statement(block, 'BODY', indent + '    ')
        handler = _inner_statement(block, 'HANDLER', indent + '    ')
        return (indent + 'try:\n' + body
                + indent + f'except {etype}:\n' + handler)
    if btype == 'py_enumerate_start_for':
        start = _find_field(block, 'START') or '0'
        idx = get_var_name(block, 'IDX')
        val = get_var_name(block, 'VAL')
        lst = get_var_name(block, 'LIST')
        out = indent + f'for {idx}, {val} in enumerate({lst}, start={start}):\n'
        out += _inner_statement(block, 'DO', indent + '    ')
        return out
    # 値ブロックが statement 位置に置かれているケースは無視（app.js でも break）
    return ''


_RUNNING_PRESET = False


def _detect_running_preset(root: ET.Element) -> bool:
    """ドキュメント中で var_set running = True が明示的にあれば True を返す。"""
    for blk in root.iter():
        if _strip_ns(blk.tag) != 'block':
            continue
        if blk.attrib.get('type') != 'var_set':
            continue
        var_field = _find_field(blk, 'VAR')
        if var_field != 'running':
            continue
        val_blk = _find_value_block(blk, 'VALUE')
        if val_blk is None:
            continue
        if _strip_ns(val_blk.get('type', '')) == 'val_bool':
            if (_find_field(val_blk, 'BOOL') or '') == 'True':
                return True
    return False


def xml_to_code(xml_text: str) -> str:
    global _RUNNING_PRESET
    root = ET.fromstring(xml_text)
    _RUNNING_PRESET = _detect_running_preset(root)
    # 全トップレベルの <block> を集めて連結
    pieces: list[str] = ['import pygame\n']
    for child in root:
        if _strip_ns(child.tag) == 'block':
            pieces.append(statement_to_code(child, ''))
    return ''.join(pieces)


def main() -> None:
    import sys
    if len(sys.argv) < 2:
        print('usage: xml_to_pygame.py <path.xml>')
        sys.exit(1)
    with open(sys.argv[1]) as f:
        text = f.read()
    print(xml_to_code(text))


if __name__ == '__main__':
    main()
