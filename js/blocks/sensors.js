// ===== センサーブロック定義 =====
// 超音波: Trig=GP7, Echo=GP6
// ラインセンサー: L=GP26(ADC0), C=GP27(ADC1), R=GP28(ADC2)

(() => {
const P = window.PycoPalette;

// 超音波センサーの距離（Number 値ブロック）
Blockly.Blocks['pvb_sonar_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('超音波センサーの距離（cm）');
    this.setOutput(true, 'Number');
    this.setColour(P.sensorValue);
    this.setTooltip('超音波センサーで測った距離（cm）を返します。Trig=GP7, Echo=GP6');
  }
};

// ラインセンサーの値（Number 値ブロック）
Blockly.Blocks['pvb_line_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ラインセンサー')
      .appendField(new Blockly.FieldDropdown([['左','26'],['中','27'],['右','28']]), 'SENSOR')
      .appendField('の値');
    this.setOutput(true, 'Number');
    this.setColour(P.sensorValue);
    this.setTooltip('ラインセンサーの値（0〜65535）を返します。黒ライン上で値が大きくなります');
  }
};

// 超音波センサーで距離を測る
Blockly.Blocks['pvb_sonar'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('超音波センサーで距離を測り  変数')
      .appendField(new Blockly.FieldVariable('dist'), 'VAR')
      .appendField('に入れる');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.sensorStatement);
    this.setTooltip('距離(cm)を変数に入れます。Trig=GP7, Echo=GP6');
  }
};

// もし障害物が近かったら（超音波）
Blockly.Blocks['pvb_if_obstacle'] = {
  init: function() {
    this.appendDummyInput().appendField('もし前に障害物が');
    this.appendValueInput('DIST').setCheck('Number');
    this.appendDummyInput().appendField('cm 以内にあったら');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.sensorStatement);
  }
};

// ラインセンサーを読む
Blockly.Blocks['pvb_line_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ラインセンサー')
      .appendField(new Blockly.FieldDropdown([['左','26'],['中','27'],['右','28']]), 'SENSOR')
      .appendField('を読み  変数')
      .appendField(new Blockly.FieldVariable('line'), 'VAR')
      .appendField('に入れる');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.sensorStatement);
    this.setTooltip('0〜65535の値。黒ライン上で値が大きくなります');
  }
};

// もしラインセンサーが黒だったら
Blockly.Blocks['pvb_if_line'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('もしラインセンサー')
      .appendField(new Blockly.FieldDropdown([['左','26'],['中','27'],['右','28']]), 'SENSOR')
      .appendField('が')
      .appendField(new Blockly.FieldDropdown([['黒','black'],['白','white']]), 'COLOR')
      .appendField('だったら（しきい値')
      .appendField(new Blockly.FieldNumber(10000, 0, 65535, 1), 'THR')
      .appendField('）');
    this.appendStatementInput('DO').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.sensorStatement);
    this.setTooltip('読んだ値がしきい値より大きければ黒、小さければ白。白は約2500、黒は約17000〜25000。うまく見分けられないときは「ラインセンサーを読む」で白と黒の値を測り、その真ん中にします');
  }
};

// 変数を表示する（シリアル出力）
Blockly.Blocks['pvb_print'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('dist'), 'VAR')
      .appendField('を表示する');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.display);
    this.setTooltip('シリアル通信でPCに値を送ります（デバッグ用）');
  }
};

})();
