// ===== PoliviaBot UME ブロック定義 =====
// ピン配置: Motor_L+(GP0) Motor_L-(GP1) Motor_R+(GP2) Motor_R-(GP3)
//           LED1(GP11) LED2(GP12) SW1(GP13) SW2(GP14)

(() => {
const P = window.PycoPalette;

// 前進する
Blockly.Blocks['pvb_forward'] = {
  init: function() {
    this.appendDummyInput().appendField('前進する  速さ');
    this.appendValueInput('SPEED').setCheck('Number');
    this.appendDummyInput().appendField('%');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.polyvia);
    this.setTooltip('PoliviaBotを前進させます');
  }
};

// 後退する
Blockly.Blocks['pvb_backward'] = {
  init: function() {
    this.appendDummyInput().appendField('後退する  速さ');
    this.appendValueInput('SPEED').setCheck('Number');
    this.appendDummyInput().appendField('%');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.polyvia);
  }
};

// 右に曲がる
Blockly.Blocks['pvb_turn_right'] = {
  init: function() {
    this.appendDummyInput().appendField('右に曲がる  速さ');
    this.appendValueInput('SPEED').setCheck('Number');
    this.appendDummyInput().appendField('%');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.polyvia);
  }
};

// 左に曲がる
Blockly.Blocks['pvb_turn_left'] = {
  init: function() {
    this.appendDummyInput().appendField('左に曲がる  速さ');
    this.appendValueInput('SPEED').setCheck('Number');
    this.appendDummyInput().appendField('%');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.polyvia);
  }
};

// 止まる
Blockly.Blocks['pvb_stop'] = {
  init: function() {
    this.appendDummyInput().appendField('止まる');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.polyvia);
  }
};

// LED点灯
Blockly.Blocks['pvb_led_on'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LED')
      .appendField(new Blockly.FieldDropdown([['1','11'],['2','12']]), 'LED')
      .appendField('を点灯する');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.polyvia);
  }
};

// LED消灯
Blockly.Blocks['pvb_led_off'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LED')
      .appendField(new Blockly.FieldDropdown([['1','11'],['2','12']]), 'LED')
      .appendField('を消灯する');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.polyvia);
  }
};

// スイッチの値（Boolean 値ブロック）
Blockly.Blocks['pvb_switch_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('スイッチ')
      .appendField(new Blockly.FieldDropdown([['1','13'],['2','14']]), 'SW')
      .appendField('の値');
    this.setOutput(true, 'Boolean');
    this.setColour(P.polyvia);
    this.setTooltip('スイッチが押されているとき True を返します（GP13/GP14）');
  }
};

// スイッチが押されていたら
Blockly.Blocks['pvb_if_switch'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('もしスイッチ')
      .appendField(new Blockly.FieldDropdown([['1','13'],['2','14']]), 'SW')
      .appendField('が押されていたら');
    this.appendStatementInput('DO').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.polyvia);
  }
};

// ===== OLED 画面（SSD1306 128x64・I2C0 SDA=GP4/SCL=GP5・0x3C）=====
// 画面のフォントは英数字のみ（日本語は表示できない）。書くたびに自動で画面更新する。
const OLED_ROWS = [['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],['6','6']];

// OLEDの○行目に［値］を表示する
Blockly.Blocks['pvb_oled_text'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('OLEDの')
      .appendField(new Blockly.FieldDropdown(OLED_ROWS), 'ROW')
      .appendField('行目に');
    this.appendValueInput('TEXT').setCheck(null);
    this.appendDummyInput().appendField('を表示する');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.display);
    this.setTooltip('OLED(128x64)の指定行に文字や値を表示します。英数字のみ・書くたび自動で画面更新');
  }
};

// OLEDの○行目に「ラベル」＋値を表示する
Blockly.Blocks['pvb_oled_label_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('OLEDの')
      .appendField(new Blockly.FieldDropdown(OLED_ROWS), 'ROW')
      .appendField('行目に')
      .appendField(new Blockly.FieldTextInput('dist:'), 'LABEL');
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('を表示する');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.display);
    this.setTooltip('ラベル文字と値をつなげて表示します。例: dist:15（ラベルは英数字のみ）');
  }
};

// OLED画面を消す
Blockly.Blocks['pvb_oled_clear'] = {
  init: function() {
    this.appendDummyInput().appendField('OLED画面を消す');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.display);
    this.setTooltip('OLEDの表示を全部消します');
  }
};

})();
