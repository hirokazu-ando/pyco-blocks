// =====================================================
// Game mode block definitions
// =====================================================

(() => {
  const P = window.PycoPalette;

  const T = {
    init: '\u30b2\u30fc\u30e0\u3092\u521d\u671f\u5316\u3059\u308b',
    width: '\u5e45',
    height: '\u9ad8\u3055',
    title: '\u30bf\u30a4\u30c8\u30eb',
    loop: '\u30b2\u30fc\u30e0\u30eb\u30fc\u30d7\u3092\u958b\u59cb\u3059\u308b',
    events: '\u30a6\u30a3\u30f3\u30c9\u30a6\u3092\u9589\u3058\u305f\u3089\u7d42\u4e86\u3059\u308b',
    frame: '\u753b\u9762\u3092\u66f4\u65b0\u3059\u308b',
    fill1: '\u753b\u9762\u3092',
    fill2: '\u8272\u3067\u5857\u308a\u3064\u3076\u3059',
    rect: '\u56db\u89d2\u5f62\u3092\u63cf\u304f',
    circle: '\u5186\u3092\u63cf\u304f',
    line: '\u7dda\u3092\u63cf\u304f',
    text: '\u6587\u5b57\u3092\u66f8\u304f',
    textLabel: '\u6587\u5b57',
    size: '\u5927\u304d\u3055',
    color: '\u8272',
    radius: '\u534a\u5f84',
    key: '\u30ad\u30fc',
    keyPressed: '\u304c\u62bc\u3055\u308c\u3066\u3044\u308b',
    right: '\u53f3\u77e2\u5370',
    left: '\u5de6\u77e2\u5370',
    up: '\u4e0a\u77e2\u5370',
    down: '\u4e0b\u77e2\u5370',
    space: '\u30b9\u30da\u30fc\u30b9',
    collideMid: '\u3068',
    collideTail: '\u304c\u91cd\u306a\u3063\u3066\u3044\u308b',
    quit: '\u30b2\u30fc\u30e0\u3092\u7d42\u4e86\u3059\u308b'
  };

  Blockly.Blocks['game_init'] = {
    init: function() {
      this.appendDummyInput().appendField(T.init);
      this.appendValueInput('W').setCheck(null).appendField(T.width);
      this.appendValueInput('H').setCheck(null).appendField(T.height);
      this.appendValueInput('TITLE').setCheck(null).appendField(T.title);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.game || '#EC407A');
      this.setTooltip('pygame\u3092\u521d\u671f\u5316\u3057\u3001\u30b2\u30fc\u30e0\u753b\u9762\u3092\u4f5c\u6210\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_loop'] = {
    init: function() {
      this.appendDummyInput().appendField(T.loop);
      this.appendStatementInput('DO').setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.game || '#EC407A');
      this.setTooltip('while running \u306e\u4e2d\u306b\u51e6\u7406\u3092\u66f8\u304f\u305f\u3081\u306e\u67a0\u3067\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_events'] = {
    init: function() {
      this.appendDummyInput().appendField(T.events);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.game || '#EC407A');
      this.setTooltip('pygame.QUIT \u3092\u691c\u51fa\u3057\u305f\u3089 running = False \u306b\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_flip'] = {
    init: function() {
      this.appendDummyInput().appendField(T.frame);
      this.appendValueInput('FPS').setCheck(null).appendField('FPS');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.game || '#EC407A');
      this.setTooltip('pygame.display.flip() \u3068 clock.tick(FPS) \u3092\u5b9f\u884c\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_fill'] = {
    init: function() {
      this.appendValueInput('COLOR').setCheck(null).appendField(T.fill1);
      this.appendDummyInput().appendField(T.fill2);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.game || '#EC407A');
      this.setTooltip('screen.fill(COLOR) \u3092\u5b9f\u884c\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_draw_rect'] = {
    init: function() {
      this.appendDummyInput().appendField(T.rect);
      this.appendValueInput('X').setCheck(null).appendField('x');
      this.appendValueInput('Y').setCheck(null).appendField('y');
      this.appendValueInput('W').setCheck(null).appendField(T.width);
      this.appendValueInput('H').setCheck(null).appendField(T.height);
      this.appendValueInput('COLOR').setCheck(null).appendField(T.color);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setTooltip('pygame.draw.rect() \u3067\u56db\u89d2\u5f62\u3092\u63cf\u304d\u307e\u3059\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_draw_circle'] = {
    init: function() {
      this.appendDummyInput().appendField(T.circle);
      this.appendValueInput('X').setCheck(null).appendField('x');
      this.appendValueInput('Y').setCheck(null).appendField('y');
      this.appendValueInput('R').setCheck(null).appendField(T.radius);
      this.appendValueInput('COLOR').setCheck(null).appendField(T.color);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setTooltip('pygame.draw.circle() \u3067\u5186\u3092\u63cf\u304d\u307e\u3059\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_draw_line'] = {
    init: function() {
      this.appendDummyInput().appendField(T.line);
      this.appendValueInput('X1').setCheck(null).appendField('x1');
      this.appendValueInput('Y1').setCheck(null).appendField('y1');
      this.appendValueInput('X2').setCheck(null).appendField('x2');
      this.appendValueInput('Y2').setCheck(null).appendField('y2');
      this.appendValueInput('COLOR').setCheck(null).appendField(T.color);
      this.appendValueInput('THICK').setCheck(null).appendField('\u592a\u3055');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setTooltip('pygame.draw.line() \u3067\u7dda\u3092\u63cf\u304d\u307e\u3059\u3002\u300c\u592a\u3055\u300d\u306f\u7701\u7565\u53ef\uff08\u65e2\u5b9a 1\uff09\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_draw_text'] = {
    init: function() {
      this.appendDummyInput().appendField(T.text);
      this.appendValueInput('TEXT').setCheck(null).appendField(T.textLabel);
      this.appendValueInput('X').setCheck(null).appendField('x');
      this.appendValueInput('Y').setCheck(null).appendField('y');
      this.appendValueInput('SIZE').setCheck(null).appendField(T.size);
      this.appendValueInput('COLOR').setCheck(null).appendField(T.color);
      this.appendValueInput('FONT').setCheck(null).appendField('\u30d5\u30a9\u30f3\u30c8');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setTooltip('\u6587\u5b57\u3092\u63cf\u753b\u3057\u3066\u753b\u9762\u3078\u8cbc\u308a\u4ed8\u3051\u307e\u3059\u3002\u300c\u30d5\u30a9\u30f3\u30c8\u300d\u3092\u7a7a\u306b\u3059\u308b\u3068\u6bce\u56de\u4f5c\u308a\u307e\u3059\u3002\u4e8b\u524d\u306b\u300c\u30d5\u30a9\u30f3\u30c8\u3092\u4f5c\u308b\u300d\u3067\u5909\u6570\u5316\u3057\u3066\u304a\u304f\u3068\u901f\u304f\u306a\u308a\u307e\u3059\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_draw_image'] = {
    init: function() {
      this.appendDummyInput().appendField('\u753b\u50cf\u3092\u63cf\u753b\u3059\u308b');
      this.appendValueInput('URL').setCheck(null).appendField('URL');
      this.appendValueInput('X').setCheck(null).appendField('x');
      this.appendValueInput('Y').setCheck(null).appendField('y');
      this.appendValueInput('W').setCheck(null).appendField('\u5e45');
      this.appendValueInput('H').setCheck(null).appendField('\u9ad8\u3055');
      this.appendValueInput('ROT').setCheck(null).appendField('\u56de\u8ee2\u89d2\u5ea6');
      this.appendDummyInput()
        .appendField('\u53cd\u8ee2')
        .appendField(new Blockly.FieldDropdown([
          ['\u306a\u3057', 'NONE'],
          ['\u5de6\u53f3', 'X'],
          ['\u4e0a\u4e0b', 'Y'],
          ['\u4e21\u65b9', 'XY']
        ]), 'FLIP');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setTooltip('\u753b\u50cfURL\u3092\u8aad\u307f\u8fbc\u3093\u3067\u753b\u9762\u306b\u63cf\u753b\u3057\u307e\u3059\u3002\u5e45\u30fb\u9ad8\u3055\u304c -1 \u306a\u3089\u539f\u5927\u3001\u56de\u8ee2\u89d2\u5ea6 0 \u306a\u3089\u7121\u52b9\u3001\u53cd\u8ee2\u306f transform.flip \u3067\u3059\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_key_pressed'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(T.key)
        .appendField(new Blockly.FieldDropdown([
          [T.right, 'K_RIGHT'],
          [T.left, 'K_LEFT'],
          [T.up, 'K_UP'],
          [T.down, 'K_DOWN'],
          [T.space, 'K_SPACE'],
          ['Enter', 'K_RETURN'],
          ['W', 'K_w'],
          ['A', 'K_a'],
          ['S', 'K_s'],
          ['D', 'K_d']
        ]), 'KEY')
        .appendField(T.keyPressed);
      this.setOutput(true, 'Boolean');
      this.setColour(P.gameInput || '#26A69A');
      this.setTooltip('pygame.key.get_pressed()[pygame.K_XXX] \u3067\u62bc\u4e0b\u72b6\u614b\u3092\u53d6\u5f97\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_keys_capture : statement
  //   \u2192 <VAR> = pygame.key.get_pressed()
  Blockly.Blocks['game_keys_capture'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u30ad\u30fc\u62bc\u4e0b\u72b6\u614b\u3092')
        .appendField(new Blockly.FieldVariable('keys'), 'VAR')
        .appendField('\u306b\u53d6\u5f97');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameInput || '#26A69A');
      this.setInputsInline(true);
      this.setTooltip('pygame.key.get_pressed() \u3092\u5909\u6570\u306b\u53d6\u5f97\u3057\u307e\u3059\u3002\u305d\u306e\u3042\u3068\u300c\u30ad\u30fc<VAR>\u306e \u3007\u3007 \u304c\u62bc\u3055\u308c\u3066\u3044\u308b\u300d\u3067\u72b6\u614b\u3092\u8abf\u3079\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_keys_held : value (Boolean)
  //   \u2192 <VAR>[pygame.K_XXX]
  Blockly.Blocks['game_keys_held'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u30ad\u30fc')
        .appendField(new Blockly.FieldVariable('keys'), 'VAR')
        .appendField('\u306e')
        .appendField(new Blockly.FieldDropdown([
          [T.right, 'K_RIGHT'],
          [T.left, 'K_LEFT'],
          [T.up, 'K_UP'],
          [T.down, 'K_DOWN'],
          [T.space, 'K_SPACE'],
          ['Enter', 'K_RETURN'],
          ['W', 'K_w'],
          ['A', 'K_a'],
          ['S', 'K_s'],
          ['D', 'K_d']
        ]), 'KEY')
        .appendField(T.keyPressed);
      this.setOutput(true, 'Boolean');
      this.setColour(P.gameInput || '#26A69A');
      this.setTooltip('\u4e8b\u524d\u306b game_keys_capture \u3067\u53d6\u5f97\u3057\u305f\u30ad\u30fc\u72b6\u614b\u8f9e\u66f8\u3092\u8abf\u3079\u307e\u3059\u3002\u30eb\u30fc\u30d7\u4e2d\u306b\u8907\u6570\u306e\u30ad\u30fc\u3092\u5224\u5b9a\u3059\u308b\u5834\u5408\u306b\u4fbf\u5229\u3067\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_rect'] = {
    init: function() {
      this.appendDummyInput().appendField('Rect(');
      this.appendValueInput('X').setCheck(null).appendField('x');
      this.appendValueInput('Y').setCheck(null).appendField('y');
      this.appendValueInput('W').setCheck(null).appendField(T.width);
      this.appendValueInput('H').setCheck(null).appendField(T.height);
      this.appendDummyInput().appendField(')');
      this.setOutput(true, null);
      this.setColour(P.gamePhysics || '#FB8C00');
      this.setTooltip('pygame.Rect(x, y, w, h) \u3092\u4f5c\u6210\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
      this.setInputsInline(true);
    }
  };

  Blockly.Blocks['game_collide'] = {
    init: function() {
      this.appendValueInput('A').setCheck(null).appendField('Rect');
      this.appendDummyInput().appendField(T.collideMid);
      this.appendValueInput('B').setCheck(null).appendField('Rect');
      this.appendDummyInput().appendField(T.collideTail);
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour(P.gamePhysics || '#FB8C00');
      this.setTooltip('Rect.colliderect(other) \u3067\u5f53\u305f\u308a\u5224\u5b9a\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_rect_collidepoint'] = {
    init: function() {
      this.appendValueInput('RECT').setCheck(null).appendField('Rect');
      this.appendDummyInput().appendField('\u306e\u70b9');
      this.appendValueInput('X').setCheck(null).appendField('x');
      this.appendValueInput('Y').setCheck(null).appendField('y');
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour(P.gamePhysics || '#FB8C00');
      this.setTooltip('Rect.collidepoint(x, y) \u3067\u70b9\u304c\u5185\u5074\u304b\u5224\u5b9a\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_rect_union'] = {
    init: function() {
      this.appendValueInput('A').setCheck(null).appendField('Rect');
      this.appendDummyInput().appendField('\u3068');
      this.appendValueInput('B').setCheck(null).appendField('Rect');
      this.appendDummyInput().appendField('\u3092\u5305\u3080\u6700\u5c0f');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour(P.gamePhysics || '#FB8C00');
      this.setTooltip('Rect.union(other) \u3067\u8ca0\u306a\u3057\u533a\u9593\u3092\u8fd4\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_quit'] = {
    init: function() {
      this.appendDummyInput().appendField(T.quit);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.game || '#EC407A');
      this.setTooltip('pygame.quit() \u3092\u5b9f\u884c\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // ===== \u30bf\u30a4\u30de\u30fc =====
  Blockly.Blocks['game_get_ticks'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30b2\u30fc\u30e0\u958b\u59cb\u304b\u3089\u306e\u6642\u9593\uff08ms\uff09');
      this.setOutput(true, 'Number');
      this.setColour(P.gameTime || '#7E57C2');
      this.setTooltip('pygame.time.get_ticks() \u2014 \u30b2\u30fc\u30e0\u958b\u59cb\u304b\u3089\u306e\u7d4c\u904e\u6642\u9593\uff08\u30df\u30ea\u79d2\uff09\u30021000\u3067\u5272\u308b\u3068\u79d2\u306b\u306a\u308a\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // ===== \u30de\u30a6\u30b9 =====
  Blockly.Blocks['game_mouse_x'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30de\u30a6\u30b9\u306eX\u5ea7\u6a19');
      this.setOutput(true, 'Number');
      this.setColour(P.gameInput || '#26A69A');
      this.setTooltip('pygame.mouse.get_pos()[0] \u2014 \u30de\u30a6\u30b9\u30ab\u30fc\u30bd\u30eb\u306eX\u5ea7\u6a19\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_mouse_y'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30de\u30a6\u30b9\u306eY\u5ea7\u6a19');
      this.setOutput(true, 'Number');
      this.setColour(P.gameInput || '#26A69A');
      this.setTooltip('pygame.mouse.get_pos()[1] \u2014 \u30de\u30a6\u30b9\u30ab\u30fc\u30bd\u30eb\u306eY\u5ea7\u6a19\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_mouse_pressed'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u30de\u30a6\u30b9\u306e')
        .appendField(new Blockly.FieldDropdown([
          ['\u5de6\u30dc\u30bf\u30f3', '0'],
          ['\u53f3\u30dc\u30bf\u30f3', '2'],
          ['\u4e2d\u30dc\u30bf\u30f3', '1']
        ]), 'BTN')
        .appendField('\u304c\u62bc\u3055\u308c\u3066\u3044\u308b');
      this.setOutput(true, 'Boolean');
      this.setColour(P.gameInput || '#26A69A');
      this.setTooltip('pygame.mouse.get_pressed() \u2014 \u6307\u5b9a\u3057\u305f\u30de\u30a6\u30b9\u30dc\u30bf\u30f3\u304c\u62bc\u3055\u308c\u3066\u3044\u308b\u304b\u5224\u5b9a\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_mouse_capture : statement
  //   \u2192 <MX>, <MY> = pygame.mouse.get_pos()
  Blockly.Blocks['game_mouse_capture'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u30de\u30a6\u30b9\u5ea7\u6a19\u3092');
      this.appendDummyInput()
        .appendField('x:')
        .appendField(new Blockly.FieldVariable('mx'), 'MX')
        .appendField('y:')
        .appendField(new Blockly.FieldVariable('my'), 'MY')
        .appendField('\u306b\u53d6\u5f97');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameInput || '#26A69A');
      this.setInputsInline(true);
      this.setTooltip('pygame.mouse.get_pos() \u306e\u7d50\u679c\u3092 2 \u3064\u306e\u5909\u6570\u306b\u5c55\u958b\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_font_set : statement
  //   \u2192 <VAR> = pygame.font.SysFont(None, <SIZE>)
  Blockly.Blocks['game_font_set'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u30d5\u30a9\u30f3\u30c8')
        .appendField(new Blockly.FieldVariable('font'), 'VAR')
        .appendField('\u3092\u4f5c\u308b\uff08\u5927\u304d\u3055');
      this.appendValueInput('SIZE').setCheck(null);
      this.appendDummyInput().appendField('\uff09');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setInputsInline(true);
      this.setTooltip('pygame.font.SysFont(None, SIZE) \u3092\u5909\u6570\u306b\u4fdd\u5b58\u3057\u307e\u3059\u3002\u300c\u6587\u5b57\u3092\u66f8\u304f\u300d\u30d6\u30ed\u30c3\u30af\u3067\u4f7f\u3044\u56de\u305b\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_text_render : statement
  //   \u2192 <VAR> = <FONT>.render(<TEXT>, True, <COLOR>)
  Blockly.Blocks['game_text_render'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u6587\u5b57\u30b5\u30fc\u30d5\u30a7\u30b9')
        .appendField(new Blockly.FieldVariable('text_surf'), 'VAR')
        .appendField('\u3092\u4f5c\u308b\uff08\u30d5\u30a9\u30f3\u30c8');
      this.appendValueInput('FONT').setCheck(null);
      this.appendValueInput('TEXT').setCheck(null).appendField('\u6587\u5b57');
      this.appendValueInput('COLOR').setCheck(null).appendField('\u8272');
      this.appendDummyInput().appendField('\uff09');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setInputsInline(true);
      this.setTooltip('<FONT>.render(TEXT, True, COLOR) \u3092\u5909\u6570\u306b\u4fdd\u5b58\u3057\u307e\u3059\u3002\u3042\u3068\u3067\u300c\u30b5\u30fc\u30d5\u30a7\u30b9\u3092\u63cf\u753b\u300d\u3067\u753b\u9762\u3078\u8cbc\u308a\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_blit_surface : statement
  //   \u2192 screen.blit(<SURF>, (<X>, <Y>))
  Blockly.Blocks['game_blit_surface'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30b5\u30fc\u30d5\u30a7\u30b9\u3092\u63cf\u753b');
      this.appendValueInput('SURF').setCheck(null);
      this.appendValueInput('X').setCheck(null).appendField('x');
      this.appendValueInput('Y').setCheck(null).appendField('y');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setInputsInline(true);
      this.setTooltip('screen.blit(SURF, (X, Y)) \u3092\u5b9f\u884c\u3057\u307e\u3059\u3002\u6587\u5b57\u3084\u753b\u50cf\u306e\u30b5\u30fc\u30d5\u30a7\u30b9\u3092\u753b\u9762\u306b\u8cbc\u308a\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_image_blit : statement
  //   \u2192 screen.blit(pygame.image.load(<URL>), (<X>, <Y>)) \u307e\u305f\u306f 4-tuple
  Blockly.Blocks['game_image_blit'] = {
    init: function() {
      this.appendDummyInput().appendField('\u753b\u50cf\u3092\u8cbc\u308b');
      this.appendValueInput('URL').setCheck(null);
      this.appendValueInput('X').setCheck(null).appendField('x');
      this.appendValueInput('Y').setCheck(null).appendField('y');
      this.appendValueInput('W').setCheck(null).appendField('\u5e45');
      this.appendValueInput('H').setCheck(null).appendField('\u9ad8\u3055');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameDraw || '#0288D1');
      this.setInputsInline(true);
      this.setTooltip('screen.blit(pygame.image.load(URL), (X, Y, W, H)) \u3092\u5b9f\u884c\u3057\u307e\u3059\uff08W/H \u306f\u7701\u7565\u53ef\uff09\u3002\u30b9\u30d7\u30e9\u30a4\u30c8\u3092\u76f4\u63a5\u7f6e\u304d\u305f\u3044\u3068\u304d\u306b\u4f7f\u3044\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // \u8272\u309216\u9032\u6570\uff08#RRGGBB\uff09\u3067\u76f4\u63a5\u5165\u529b\u3059\u308b\u30d6\u30ed\u30c3\u30af\u3002
  // \u30d1\u30ec\u30c3\u30c8\u304b\u3089\u9078\u3073\u305f\u3044\u3068\u304d\u306f colour_picker\uff08@blockly/field-colour\uff09\u3092\u4f7f\u3046\u3002
  Blockly.Blocks['game_color'] = {
    init: function() {
      const isHex = function(v) {
        if (v == null) return null;
        const s = String(v).trim();
        return /^#[0-9a-fA-F]{6}$/.test(s) ? s : null;
      };
      const self = this;
      const validator = function(v) {
        const ok = isHex(v);
        if (ok) { try { self.setColour(ok); } catch (e) {} }
        return ok;
      };
      this.appendDummyInput()
        .appendField('\u8272')
        .appendField(new Blockly.FieldTextInput('#3B82F6', validator), 'COLOR');
      this.setOutput(true, 'Colour');
      this.setColour('#3B82F6');
      this.setTooltip('\u8272\u3092 16\u9032\u6570 (#RRGGBB) \u3067\u76f4\u63a5\u5165\u529b\u3057\u307e\u3059\u3002\u30d1\u30ec\u30c3\u30c8\u304b\u3089\u9078\u3073\u305f\u3044\u5834\u5408\u306f colour_picker \u3092\u4f7f\u3063\u3066\u304f\u3060\u3055\u3044\u3002');
      this.setHelpUrl('');
    }
  };

  // ===== \u753b\u50cf\u30d7\u30ea\u30bb\u30c3\u30c8 =====
  var GAME_SPRITES = [
    ['\u30d7\u30ec\u30a4\u30e4\u30fc',  'assets/game-icons/player_ship.svg'],
    ['\u30ed\u30b1\u30c3\u30c8',    'assets/game-icons/rocket.svg'],
    ['\u6575\uff08\u866b\uff09',    'assets/game-icons/enemy_bug.svg'],
    ['\u30b3\u30a4\u30f3',      'assets/game-icons/coin.svg'],
    ['\u30b8\u30a7\u30e0',      'assets/game-icons/gem.svg'],
    ['\u30b9\u30bf\u30fc',      'assets/game-icons/star.svg'],
    ['\u30cf\u30fc\u30c8',      'assets/game-icons/heart.svg'],
    ['\u5f3e',          'assets/game-icons/bullet.svg'],
    ['\u30a8\u30ca\u30b8\u30fc',    'assets/game-icons/energy.svg'],
    ['\u30b7\u30fc\u30eb\u30c9',    'assets/game-icons/shield.svg'],
    ['\u30c8\u30b2',        'assets/game-icons/spike.svg'],
    ['\u30e1\u30c6\u30aa',      'assets/game-icons/meteor.svg'],
    ['\u30dd\u30fc\u30bf\u30eb',    'assets/game-icons/portal.svg'],
    ['\u6728\u7bb1',        'assets/game-icons/crate.svg'],
    // Part 6: \u6b69\u884c\u30a2\u30cb\u30e1
    ['\u30d7\u30ec\u30a4\u30e4\u30fc\u6b691',  'assets/game-icons/player_walk1.svg'],
    ['\u30d7\u30ec\u30a4\u30e4\u30fc\u6b692',  'assets/game-icons/player_walk2.svg'],
    ['\u30d7\u30ec\u30a4\u30e4\u30fc\u30b8\u30e3\u30f3\u30d7', 'assets/game-icons/player_jump.svg'],
    // Part 7: \u30d1\u30ba\u30eb\u30d4\u30fc\u30b9
    ['\u30d4\u30fc\u30b9\u8d64',       'assets/game-icons/piece_red.svg'],
    ['\u30d4\u30fc\u30b9\u9752',       'assets/game-icons/piece_blue.svg'],
    ['\u30d4\u30fc\u30b9\u7dd1',       'assets/game-icons/piece_green.svg'],
    ['\u30d4\u30fc\u30b9\u9ec4',       'assets/game-icons/piece_yellow.svg'],
    ['\u30d4\u30fc\u30b9\u7d2b',       'assets/game-icons/piece_purple.svg'],
    ['\u30d4\u30fc\u30b9\u6c34',       'assets/game-icons/piece_cyan.svg'],
    // Part 6: \u30bf\u30a4\u30eb
    ['\u30bf\u30a4\u30eb\u8349',       'assets/tiles/tile_grass.png'],
    ['\u30bf\u30a4\u30eb\u571f',       'assets/tiles/tile_dirt.png'],
    ['\u30bf\u30a4\u30eb\u77f3',       'assets/tiles/tile_stone.png'],
    ['\u30bf\u30a4\u30eb\u308c\u3093\u304c',   'assets/tiles/tile_brick.png'],
    ['\u30bf\u30a4\u30eb\u6c34',       'assets/tiles/tile_water.png'],
    ['\u30bf\u30a4\u30eb\u6eb6\u5ca9',     'assets/tiles/tile_lava.png'],
    ['\u30bf\u30a4\u30eb\u6c37',       'assets/tiles/tile_ice.png'],
    ['\u30bf\u30a4\u30eb\u7a7a',       'assets/tiles/tile_sky.png'],
    ['\u30bf\u30a4\u30eb\u30b3\u30a4\u30f3',   'assets/tiles/tile_coin.png'],
    ['\u30bf\u30a4\u30eb\u30c8\u30b2',     'assets/tiles/tile_spike.png'],
    ['\u30bf\u30a4\u30eb\u30b4\u30fc\u30eb',   'assets/tiles/tile_goal.png'],
    ['\u30bf\u30a4\u30eb\u30c9\u30a2',     'assets/tiles/tile_door.png'],
  ];

  // ===== \u52b9\u679c\u97f3\u30d7\u30ea\u30bb\u30c3\u30c8 =====
  var GAME_SOUNDS = [
    ['\u30b8\u30e3\u30f3\u30d7',       'assets/audio/se/se_jump.wav'],
    ['\u767a\u5c04',           'assets/audio/se/se_shoot.wav'],
    ['\u88ab\u5f3e',           'assets/audio/se/se_hit.wav'],
    ['\u7206\u767a',           'assets/audio/se/se_explosion.wav'],
    ['\u30b3\u30a4\u30f3',         'assets/audio/se/se_coin.wav'],
    ['\u30d1\u30ef\u30fc\u30a2\u30c3\u30d7',   'assets/audio/se/se_powerup.wav'],
    ['\u30af\u30ea\u30a2',         'assets/audio/se/se_clear.wav'],
    ['\u30b2\u30fc\u30e0\u30aa\u30fc\u30d0\u30fc', 'assets/audio/se/se_gameover.wav'],
    ['\u9078\u629e',           'assets/audio/se/se_select.wav'],
    ['\u30af\u30ea\u30c3\u30af',       'assets/audio/se/se_click.wav'],
    ['\u30e9\u30a4\u30f3\u6d88\u53bb',     'assets/audio/se/se_lineclear.wav'],
  ];

  // ===== BGM \u30d7\u30ea\u30bb\u30c3\u30c8 =====
  var GAME_BGMS = [
    ['\u30a2\u30af\u30b7\u30e7\u30f3',     'assets/audio/bgm/bgm_action.wav'],
    ['\u30d1\u30ba\u30eb',         'assets/audio/bgm/bgm_puzzle.wav'],
    ['\u30bf\u30a4\u30c8\u30eb',       'assets/audio/bgm/bgm_title.wav'],
    ['\u30dc\u30b9',           'assets/audio/bgm/bgm_boss.wav'],
  ];

  Blockly.Blocks['game_sound_preset'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u5185\u8535\u52b9\u679c\u97f3')
        .appendField(new Blockly.FieldDropdown(GAME_SOUNDS), 'SE');
      this.setOutput(true, 'String');
      this.setColour(P.gameAudio || '#26C6DA');
      this.setTooltip('\u5185\u8535 SE \u306e\u30d1\u30b9\u3092\u8fd4\u3057\u307e\u3059\u3002game_sound_load \u306e URL \u306b\u5dee\u3057\u8fbc\u3093\u3067\u4f7f\u3044\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_music_preset'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u5185\u8535 BGM')
        .appendField(new Blockly.FieldDropdown(GAME_BGMS), 'BGM');
      this.setOutput(true, 'String');
      this.setColour(P.gameAudio || '#26C6DA');
      this.setTooltip('\u5185\u8535 BGM \u306e\u30d1\u30b9\u3092\u8fd4\u3057\u307e\u3059\u3002game_music_load_play \u306e URL \u306b\u5dee\u3057\u8fbc\u3093\u3067\u4f7f\u3044\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_image_preset'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u5185\u8535\u753b\u50cf')
        .appendField(new Blockly.FieldDropdown(GAME_SPRITES), 'IMG');
      this.setOutput(true, 'String');
      this.setColour(P.gameDraw || '#0288D1');
      this.setTooltip('\u3042\u3089\u304b\u3058\u3081\u7528\u610f\u3055\u308c\u305f\u30b2\u30fc\u30e0\u7528\u753b\u50cf\u3092\u9078\u3073\u307e\u3059\u3002game_draw_image \u306e URL \u306b\u5dee\u3057\u8fbc\u3093\u3067\u4f7f\u3044\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // ===== Rect\u5c5e\u6027\u53d6\u5f97 =====
  Blockly.Blocks['game_rect_attr'] = {
    init: function() {
      this.appendValueInput('RECT').setCheck(null).appendField('Rect');
      this.appendDummyInput()
        .appendField('\u306e')
        .appendField(new Blockly.FieldDropdown([
          ['x\u5ea7\u6a19', 'x'],
          ['y\u5ea7\u6a19', 'y'],
          ['\u5e45', 'width'],
          ['\u9ad8\u3055', 'height'],
          ['\u4e2d\u5fc3x', 'centerx'],
          ['\u4e2d\u5fc3y', 'centery']
        ]), 'ATTR');
      this.setOutput(true, 'Number');
      this.setInputsInline(true);
      this.setColour(P.gamePhysics || '#FB8C00');
      this.setTooltip('Rect \u30aa\u30d6\u30b8\u30a7\u30af\u30c8\u306e\u5c5e\u6027\uff08x/y/\u5e45/\u9ad8\u3055/\u4e2d\u5fc3\uff09\u3092\u53d6\u5f97\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_import_random'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('random \u30e2\u30b8\u30e5\u30fc\u30eb\u3092\u8aad\u307f\u8fbc\u3080');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.builtins);
      this.setTooltip('import random');
      this.setHelpUrl('');
    }
  };

  Blockly.Blocks['game_random_int'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u30e9\u30f3\u30c0\u30e0\u6574\u6570\uff08')
        .appendField(new Blockly.FieldNumber(0, -10000, 100000), 'LO')
        .appendField('\u301c')
        .appendField(new Blockly.FieldNumber(576, -10000, 100000), 'HI')
        .appendField('\uff09');
      this.setOutput(true, null);
      this.setColour(P.math);
      this.setTooltip('random.randint(lo, hi)');
      this.setHelpUrl('');
    }
  };

  // === Part 5\u2471 \u30e9\u30a4\u30d5\u5236\uff1a\u30bf\u30a4\u30de\u30fc\u671f\u9650\u5909\u6570\u306e\u64cd\u4f5c ============================
  // game_timer_set : \u300c(VAR) \u3092 SEC \u79d2\u5f8c\u306e\u671f\u9650\u306b\u30bb\u30c3\u30c8\u300d statement
  //   \u2192 <VAR> = pygame.time.get_ticks() + <SEC> * 1000
  Blockly.Blocks['game_timer_set'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u30bf\u30a4\u30de\u30fc\u5909\u6570')
        .appendField(new Blockly.FieldVariable('expire_at'), 'VAR')
        .appendField('\u3092');
      this.appendValueInput('SEC')
        .setCheck(null)
        .appendField('\u79d2\u5f8c\u306b\u30bb\u30c3\u30c8\uff08\u73fe\u5728\u6642\u523b+');
      this.appendDummyInput().appendField('\u00d71000ms\uff09');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameTime || '#7E57C2');
      this.setInputsInline(true);
      this.setTooltip('\u671f\u9650\u5909\u6570\u306b\u300c\u73fe\u5728\u306e\u7d4c\u904e\u30df\u30ea\u79d2 + SEC*1000\u300d\u3092\u4ee3\u5165\u3057\u307e\u3059\u3002\u7121\u6575\u6642\u9593\u3084\u52b9\u679c\u6642\u9593\u306e\u8a08\u6e2c\u306b\u4f7f\u3044\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_timer_done : \u300c(VAR) \u306f\u7d42\u308f\u3063\u305f\u304b\u300d boolean
  //   \u2192 pygame.time.get_ticks() >= <VAR>
  Blockly.Blocks['game_timer_done'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('\u30bf\u30a4\u30de\u30fc\u5909\u6570')
        .appendField(new Blockly.FieldVariable('expire_at'), 'VAR')
        .appendField('\u306e\u671f\u9650\u304c\u6765\u305f');
      this.setOutput(true, 'Boolean');
      this.setColour(P.gameTime || '#7E57C2');
      this.setTooltip('pygame.time.get_ticks() >= \u671f\u9650\u5909\u6570\u3001\u3092\u8fd4\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // === Part 6\u3256 \u30ab\u30e1\u30e9\uff1a\u30ef\u30fc\u30eb\u30c9\u2192\u30b9\u30af\u30ea\u30fc\u30f3\u5ea7\u6a19\u5909\u63db ========================
  // game_camera_set : cam_x = OX; cam_y = OY \u3092\u51fa\u529b
  Blockly.Blocks['game_camera_set'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30ab\u30e1\u30e9\u4f4d\u7f6e');
      this.appendValueInput('OX').setCheck(null).appendField('cam_x');
      this.appendValueInput('OY').setCheck(null).appendField('cam_y');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameCamera || '#5C6BC0');
      this.setInputsInline(true);
      this.setTooltip('\u30ab\u30e1\u30e9\u306e\u30aa\u30d5\u30bb\u30c3\u30c8 (cam_x, cam_y) \u3092\u66f4\u65b0\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_world_to_screen_x : <X> - cam_x \uff08value\uff09
  Blockly.Blocks['game_world_to_screen_x'] = {
    init: function() {
      this.appendValueInput('X').setCheck(null).appendField('\u753b\u9762X\u5ea7\u6a19\uff08worldX:');
      this.appendDummyInput().appendField('\u2212 cam_x \uff09');
      this.setOutput(true, 'Number');
      this.setColour(P.gameCamera || '#5C6BC0');
      this.setInputsInline(true);
      this.setTooltip('\u30ef\u30fc\u30eb\u30c9X\u5ea7\u6a19\u3092\u753b\u9762X\u5ea7\u6a19\u306b\u5909\u63db\u3057\u307e\u3059\uff08cam_x \u3092\u5f15\u304d\u307e\u3059\uff09\u3002');
      this.setHelpUrl('');
    }
  };

  // game_world_to_screen_y : <Y> - cam_y
  Blockly.Blocks['game_world_to_screen_y'] = {
    init: function() {
      this.appendValueInput('Y').setCheck(null).appendField('\u753b\u9762Y\u5ea7\u6a19\uff08worldY:');
      this.appendDummyInput().appendField('\u2212 cam_y \uff09');
      this.setOutput(true, 'Number');
      this.setColour(P.gameCamera || '#5C6BC0');
      this.setInputsInline(true);
      this.setTooltip('\u30ef\u30fc\u30eb\u30c9Y\u5ea7\u6a19\u3092\u753b\u9762Y\u5ea7\u6a19\u306b\u5909\u63db\u3057\u307e\u3059\uff08cam_y \u3092\u5f15\u304d\u307e\u3059\uff09\u3002');
      this.setHelpUrl('');
    }
  };

  // === Part 6\u3258\u301c\u325b \u30bf\u30a4\u30eb\u30de\u30c3\u30d7 ============================================
  // game_tilemap_create : value
  //   \u2192 [[<FILL>] * <W> for _ in range(<H>)]
  Blockly.Blocks['game_tilemap_create'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30bf\u30a4\u30eb\u30de\u30c3\u30d7\u4f5c\u6210\uff08\u6a2a');
      this.appendValueInput('W').setCheck(null);
      this.appendDummyInput().appendField('\u00d7\u7e26');
      this.appendValueInput('H').setCheck(null);
      this.appendDummyInput().appendField('\u30fb\u521d\u671f\u5024');
      this.appendValueInput('FILL').setCheck(null);
      this.appendDummyInput().appendField('\uff09');
      this.setOutput(true, 'Array');
      this.setColour(P.gameWorld || '#6D4C41');
      this.setInputsInline(true);
      this.setTooltip('\u6307\u5b9a\u30b5\u30a4\u30ba\u306e 2 \u6b21\u5143\u914d\u5217\u3092\u4f5c\u308a\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_tilemap_from_text : value
  //   \u2192 ASCII \u6587\u5b57\u5217\u30de\u30c3\u30d7\u3092 2D \u914d\u5217\u306b\u5c55\u958b
  //     '.'\u2192GRASS '='\u2192ROAD '#'\u2192WALL '~'\u2192WATER
  Blockly.Blocks['game_tilemap_from_text'] = {
    init: function() {
      this.appendDummyInput().appendField('\u6587\u5b57\u5217\u304b\u3089\u30bf\u30a4\u30eb\u30de\u30c3\u30d7\u3092\u4f5c\u308b');
      var defaultMap = '##########\n#....=...#\n#....=...#\n#....=...#\n#........#\n#........#\n##########';
      this.appendDummyInput().appendField(
        new Blockly.FieldMultilineInput(defaultMap), 'TEXT');
      this.appendDummyInput()
        .appendField('\u300c.\u300d=')
        .appendField(new Blockly.FieldNumber(0), 'V_DOT')
        .appendField('\u3000\u300c=\u300d=')
        .appendField(new Blockly.FieldNumber(1), 'V_EQ');
      this.appendDummyInput()
        .appendField('\u300c#\u300d=')
        .appendField(new Blockly.FieldNumber(2), 'V_HASH')
        .appendField('\u3000\u300c~\u300d=')
        .appendField(new Blockly.FieldNumber(3), 'V_TILDE');
      this.setOutput(true, 'Array');
      this.setColour(P.gameWorld || '#6D4C41');
      this.setInputsInline(false);
      this.setTooltip('ASCII \u30de\u30c3\u30d7\u6587\u5b57\u5217\u3092 2 \u6b21\u5143\u914d\u5217\u306b\u5c55\u958b\u3057\u307e\u3059\u3002\u8a18\u53f7\u3068\u30bf\u30a4\u30ebID\u306e\u5bfe\u5fdc\u306f\u4e0b\u306e\u30d5\u30a3\u30fc\u30eb\u30c9\u3067\u8abf\u6574\u3067\u304d\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_tilemap_get : value
  //   \u2192 <MAP>[<Y>][<X>]
  Blockly.Blocks['game_tilemap_get'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30de\u30c3\u30d7');
      this.appendValueInput('MAP').setCheck(null);
      this.appendDummyInput().appendField('\u306e (\u884cY');
      this.appendValueInput('Y').setCheck(null);
      this.appendDummyInput().appendField('\u30fb\u5217X');
      this.appendValueInput('X').setCheck(null);
      this.appendDummyInput().appendField(') \u306e\u5024');
      this.setOutput(true, null);
      this.setColour(P.gameWorld || '#6D4C41');
      this.setInputsInline(true);
      this.setTooltip('\u30de\u30c3\u30d7[\u884cY][\u5217X] \u3092\u53d6\u308a\u51fa\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_tilemap_set : statement
  //   \u2192 <MAP>[<Y>][<X>] = <VALUE>
  Blockly.Blocks['game_tilemap_set'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30de\u30c3\u30d7');
      this.appendValueInput('MAP').setCheck(null);
      this.appendDummyInput().appendField('\u306e (\u884cY');
      this.appendValueInput('Y').setCheck(null);
      this.appendDummyInput().appendField('\u30fb\u5217X');
      this.appendValueInput('X').setCheck(null);
      this.appendDummyInput().appendField(') \u3092');
      this.appendValueInput('VALUE').setCheck(null);
      this.appendDummyInput().appendField('\u306b\u3059\u308b');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameWorld || '#6D4C41');
      this.setInputsInline(true);
      this.setTooltip('\u30de\u30c3\u30d7[\u884cY][\u5217X] = VALUE \u3092\u5b9f\u884c\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_tilemap_draw : statement
  //   \u2192 2 \u91cd\u30eb\u30fc\u30d7\u3067 images dict \u3092 blit
  Blockly.Blocks['game_tilemap_draw'] = {
    init: function() {
      this.appendDummyInput().appendField('\u30bf\u30a4\u30eb\u30de\u30c3\u30d7');
      this.appendValueInput('MAP').setCheck(null);
      this.appendDummyInput().appendField('\u3092\u63cf\u753b\uff08\u30bf\u30a4\u30eb\u30b5\u30a4\u30ba');
      this.appendValueInput('TILE').setCheck(null);
      this.appendDummyInput().appendField('\u30fb\u753b\u50cf\u8f9e\u66f8');
      this.appendValueInput('IMAGES').setCheck(null);
      this.appendDummyInput().appendField('\uff09');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameWorld || '#6D4C41');
      this.setInputsInline(true);
      this.setTooltip('2 \u6b21\u5143\u914d\u5217\u306e\u5404\u30bb\u30eb\u3092\u753b\u50cf\u8f9e\u66f8\u306b\u5f93\u3063\u3066\u63cf\u753b\u3057\u307e\u3059\u3002cam_x, cam_y \u304c\u30b9\u30b3\u30fc\u30d7\u306b\u3042\u308c\u3070\u81ea\u52d5\u3067\u30ab\u30e1\u30e9\u8ffd\u968f\u3002');
      this.setHelpUrl('');
    }
  };

  // game_gravity_apply : statement
  //   \u2192 VY += 0.5; Y += VY; if Y >= GROUND: Y = GROUND; VY = 0
  Blockly.Blocks['game_gravity_apply'] = {
    init: function() {
      this.appendDummyInput().appendField('\u91cd\u529b\u3092\u9069\u7528\uff08\u9ad8\u3055');
      this.appendDummyInput().appendField(new Blockly.FieldVariable('y'), 'Y');
      this.appendDummyInput().appendField('\u30fb\u9038\u901f\u5ea6');
      this.appendDummyInput().appendField(new Blockly.FieldVariable('vy'), 'VY');
      this.appendDummyInput().appendField('\u30fb\u5730\u9762');
      this.appendValueInput('GROUND').setCheck(null);
      this.appendDummyInput().appendField('\uff09');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gamePhysics || '#FB8C00');
      this.setInputsInline(true);
      this.setTooltip('\u91cd\u529b\u3092 vy \u306b\u52a0\u3048\u3001y \u3092\u66f4\u65b0\u3057\u3066\u3001\u5730\u9762\u3088\u308a\u4e0b\u306b\u3044\u304b\u306a\u3044\u3088\u3046\u306b\u63b2\u3052\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_grid_rotate90 : value
  //   \u2192 [list(row) for row in zip(*GRID[::-1])]
  Blockly.Blocks['game_grid_rotate90'] = {
    init: function() {
      this.appendValueInput('GRID').setCheck(null).appendField('\u3092 90 \u5ea6\u56de\u8ee2');
      this.setOutput(true, null);
      this.setColour(P.gameWorld || '#6D4C41');
      this.setInputsInline(true);
      this.setTooltip('2 \u6b21\u5143\u914d\u5217\u3092\u6642\u8a08\u56de\u308a\u306b 90 \u5ea6\u56de\u8ee2\u3057\u305f\u65b0\u3057\u3044\u914d\u5217\u3092\u8fd4\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_sound_load : value
  //   \u2192 pygame.mixer.Sound(URL)
  Blockly.Blocks['game_sound_load'] = {
    init: function() {
      this.appendValueInput('URL').setCheck(null).appendField('\u52b9\u679c\u97f3\u3092\u8aad\u307f\u8fbc\u3080');
      this.setOutput(true, null);
      this.setColour(P.gameAudio || '#26C6DA');
      this.setInputsInline(true);
      this.setTooltip('\u6307\u5b9a URL \u306e WAV \u3092\u8aad\u307f\u8fbc\u3093\u3067 Sound \u30aa\u30d6\u30b8\u30a7\u30af\u30c8\u3092\u8fd4\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

  // game_sound_play : statement
  //   \u2192 <SOUND>.play()
  Blockly.Blocks['game_sound_play'] = {
    init: function() {
      this.appendValueInput('SOUND').setCheck(null).appendField('\u52b9\u679c\u97f3\u3092\u9cf4\u3089\u3059');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameAudio || '#26C6DA');
      this.setInputsInline(true);
      this.setTooltip('Sound \u30aa\u30d6\u30b8\u30a7\u30af\u30c8\u3092\u518d\u751f\u3057\u307e\u3059\uff08\u8907\u6570\u540c\u6642\u518d\u751f\u53ef\uff09\u3002');
      this.setHelpUrl('');
    }
  };

  // game_music_load_play : statement
  //   \u2192 pygame.mixer.music.load(URL); pygame.mixer.music.play(-1 if LOOP else 0)
  Blockly.Blocks['game_music_load_play'] = {
    init: function() {
      this.appendValueInput('URL').setCheck(null).appendField('BGM \u3092\u518d\u751f');
      this.appendDummyInput().appendField('\uff08\u30eb\u30fc\u30d7');
      this.appendDummyInput().appendField(new Blockly.FieldCheckbox('TRUE'), 'LOOP');
      this.appendDummyInput().appendField('\uff09');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameAudio || '#26C6DA');
      this.setInputsInline(true);
      this.setTooltip('\u6307\u5b9a URL \u306e BGM \u3092\u30ed\u30fc\u30c9\u3057\u3066\u518d\u751f\u3057\u307e\u3059\u3002\u30c1\u30a7\u30c3\u30af\u3092\u5916\u3059\u3068 1 \u56de\u3060\u3051\u518d\u751f\u3002');
      this.setHelpUrl('');
    }
  };

  // game_music_stop : statement
  //   \u2192 pygame.mixer.music.stop()
  Blockly.Blocks['game_music_stop'] = {
    init: function() {
      this.appendDummyInput().appendField('BGM \u3092\u6b62\u3081\u308b');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(P.gameAudio || '#26C6DA');
      this.setInputsInline(true);
      this.setTooltip('\u518d\u751f\u4e2d\u306e BGM \u3092\u505c\u6b62\u3057\u307e\u3059\u3002');
      this.setHelpUrl('');
    }
  };

})();
