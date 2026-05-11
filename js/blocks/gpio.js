// ===== デジタル出力 =====

(() => {
const P = window.PycoPalette;

Blockly.Blocks['pico_led_on'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LEDを点灯する  ピン')
      .appendField(new Blockly.FieldNumber(25, 0, 28), 'PIN');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioOutput);
    this.setTooltip('指定したピンのLEDを点灯します');
  }
};
Blockly.Blocks['pico_led_off'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LEDを消灯する  ピン')
      .appendField(new Blockly.FieldNumber(25, 0, 28), 'PIN');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioOutput);
    this.setTooltip('指定したピンのLEDを消灯します');
  }
};
Blockly.Blocks['pico_digital_write'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ピン')
      .appendField(new Blockly.FieldNumber(0, 0, 28), 'PIN')
      .appendField('を')
      .appendField(new Blockly.FieldDropdown([['HIGH','1'],['LOW','0']]), 'VAL')
      .appendField('にする');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioOutput);
  }
};

// ===== デジタル入力 =====

Blockly.Blocks['pico_digital_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('デジタル入力  ピン')
      .appendField(new Blockly.FieldNumber(0, 0, 28), 'PIN')
      .appendField('を読み  変数')
      .appendField(new Blockly.FieldTextInput('val'), 'VAR')
      .appendField('に入れる');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioInput);
    this.setTooltip('デジタルピンの値（0 or 1）を変数に入れます');
  }
};

// ===== アナログ入力 =====

Blockly.Blocks['pico_analog_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('アナログ入力  ADCピン')
      .appendField(new Blockly.FieldDropdown([['GP26 (ADC0)','26'],['GP27 (ADC1)','27'],['GP28 (ADC2)','28']]), 'PIN')
      .appendField('を読み  変数')
      .appendField(new Blockly.FieldTextInput('val'), 'VAR')
      .appendField('に入れる');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioInput);
    this.setTooltip('アナログ値（0〜65535）を変数に入れます。GP26/27/28のみ使用可能');
  }
};

// ===== 入力値ブロック（値として使用）=====

Blockly.Blocks['pico_digital_read_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ピン')
      .appendField(new Blockly.FieldNumber(0, 0, 28), 'PIN')
      .appendField('の入力値');
    this.setOutput(true, 'Boolean');
    this.setColour(P.gpioInput);
    this.setTooltip('デジタルピンの値（True/False）を返します。条件ブロックにはめ込めます');
  }
};

Blockly.Blocks['pico_analog_read_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ADCピン')
      .appendField(new Blockly.FieldDropdown([['GP26','26'],['GP27','27'],['GP28','28']]), 'PIN')
      .appendField('のアナログ値');
    this.setOutput(true, 'Number');
    this.setColour(P.gpioInput);
    this.setTooltip('アナログ入力値（0〜65535）を返します。比較ブロックにはめ込めます');
  }
};

// ===== PWM出力 =====

Blockly.Blocks['pico_pwm_write'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('PWM出力  ピン')
      .appendField(new Blockly.FieldNumber(0, 0, 28), 'PIN')
      .appendField('  デューティ')
      .appendField(new Blockly.FieldNumber(50, 0, 100), 'DUTY')
      .appendField('%');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioOutput);
    this.setTooltip('PWMでアナログ的な出力をします。デューティ比 0〜100%');
  }
};

// ===== ブザー =====

Blockly.Blocks['pico_buzzer_tone'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ブザー  ピン')
      .appendField(new Blockly.FieldNumber(15, 0, 28), 'PIN')
      .appendField('  周波数')
      .appendField(new Blockly.FieldNumber(440, 20, 20000), 'FREQ')
      .appendField('Hz  時間')
      .appendField(new Blockly.FieldNumber(1, 0, 60), 'DUR')
      .appendField('秒');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioOutput);
    this.setTooltip('パッシブブザーを指定した周波数で鳴らします');
  }
};
Blockly.Blocks['pico_buzzer_stop'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ブザーを止める  ピン')
      .appendField(new Blockly.FieldNumber(15, 0, 28), 'PIN');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioOutput);
    this.setTooltip('PWMブザーの出力を停止します');
  }
};

// ===== 7セグメント =====

Blockly.Blocks['pico_7seg_show'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('7セグ表示  数字')
      .appendField(new Blockly.FieldNumber(0, 0, 9), 'NUM')
      .appendField('  ピン[a,b,c,d,e,f,g]')
      .appendField(new Blockly.FieldTextInput('2,3,4,5,6,7,8'), 'PINS');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioDisplay);
    this.setTooltip('7セグメントLEDに数字(0〜9)を表示します。ピンはa,b,c,d,e,f,gの順でカンマ区切り');
  }
};

// ===== LCD1602 (I2C) =====

Blockly.Blocks['pico_lcd_init'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LCD初期化  SDAピン')
      .appendField(new Blockly.FieldNumber(0, 0, 28), 'SDA')
      .appendField('  SCLピン')
      .appendField(new Blockly.FieldNumber(1, 0, 28), 'SCL')
      .appendField('  変数')
      .appendField(new Blockly.FieldTextInput('lcd'), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioDisplay);
    this.setTooltip('LCD1602（I2Cアドレス0x27）を初期化します。lcd1602.py が Pico に入っている必要があります');
  }
};
Blockly.Blocks['pico_lcd_print'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LCD  変数')
      .appendField(new Blockly.FieldTextInput('lcd'), 'VAR')
      .appendField('  行')
      .appendField(new Blockly.FieldDropdown([['1行目','0'],['2行目','1']]), 'ROW')
      .appendField('に表示:');
    this.appendValueInput('TEXT');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioDisplay);
    this.setTooltip('LCDの指定した行にテキストを表示します（16文字まで）');
  }
};
Blockly.Blocks['pico_lcd_clear'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LCDをクリア  変数')
      .appendField(new Blockly.FieldTextInput('lcd'), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioDisplay);
    this.setTooltip('LCDの表示を全消去します');
  }
};

// ===== サーボモーター =====

Blockly.Blocks['pico_servo_angle'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('サーボ  ピン')
      .appendField(new Blockly.FieldNumber(15, 0, 28), 'PIN')
      .appendField('を')
      .appendField(new Blockly.FieldNumber(90, 0, 180), 'ANGLE')
      .appendField('度に回す');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioMotor);
    this.setTooltip('SG90サーボを0〜180度の指定角度に回します（PWM 50Hz）');
  }
};

// ===== DCモーター (L298N) =====

Blockly.Blocks['pico_dcmotor_run'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('DCモーター  IN1ピン')
      .appendField(new Blockly.FieldNumber(2, 0, 28), 'IN1')
      .appendField('  IN2ピン')
      .appendField(new Blockly.FieldNumber(3, 0, 28), 'IN2')
      .appendField('  ENピン')
      .appendField(new Blockly.FieldNumber(4, 0, 28), 'EN')
      .appendField('  速度')
      .appendField(new Blockly.FieldNumber(50, 0, 100), 'SPEED')
      .appendField('%  方向')
      .appendField(new Blockly.FieldDropdown([['正転','fwd'],['逆転','rev']]), 'DIR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioMotor);
    this.setTooltip('L298NでDCモーターを回します。速度0〜100%、方向を指定');
  }
};
Blockly.Blocks['pico_dcmotor_stop'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('DCモーター停止  IN1ピン')
      .appendField(new Blockly.FieldNumber(2, 0, 28), 'IN1')
      .appendField('  IN2ピン')
      .appendField(new Blockly.FieldNumber(3, 0, 28), 'IN2');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioMotor);
    this.setTooltip('DCモーターを停止します（IN1=LOW, IN2=LOW）');
  }
};

// ===== ステッピングモーター (28BYJ-48 + ULN2003) =====

Blockly.Blocks['pico_stepper_step'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ステッパー  ピン[IN1-IN4]')
      .appendField(new Blockly.FieldTextInput('8,9,10,11'), 'PINS')
      .appendField('  ステップ数')
      .appendField(new Blockly.FieldNumber(512, -4096, 4096), 'STEPS')
      .appendField('  遅延')
      .appendField(new Blockly.FieldNumber(2, 1, 20), 'DELAY')
      .appendField('ms');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioMotor);
    this.setTooltip('28BYJ-48+ULN2003でN ステップ動かします。負値で逆転。512ステップ≒1回転');
  }
};
Blockly.Blocks['pico_stepper_angle'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ステッパー  ピン[IN1-IN4]')
      .appendField(new Blockly.FieldTextInput('8,9,10,11'), 'PINS')
      .appendField('を')
      .appendField(new Blockly.FieldNumber(90, -360, 360), 'ANGLE')
      .appendField('度回す  遅延')
      .appendField(new Blockly.FieldNumber(2, 1, 20), 'DELAY')
      .appendField('ms');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioMotor);
    this.setTooltip('28BYJ-48+ULN2003で指定した角度だけ回転します。負値で逆転');
  }
};

// ===== 超音波センサー (HC-SR04) =====

Blockly.Blocks['pico_ultrasonic_cm'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('超音波距離  TRIGピン')
      .appendField(new Blockly.FieldNumber(14, 0, 28), 'TRIG')
      .appendField('  ECHOピン')
      .appendField(new Blockly.FieldNumber(15, 0, 28), 'ECHO')
      .appendField('→ 変数')
      .appendField(new Blockly.FieldTextInput('dist'), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioInput);
    this.setTooltip('HC-SR04超音波センサーで距離（cm）を測り変数に入れます');
  }
};
Blockly.Blocks['pico_ultrasonic_cm_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('超音波距離(cm)  TRIGピン')
      .appendField(new Blockly.FieldNumber(14, 0, 28), 'TRIG')
      .appendField('  ECHOピン')
      .appendField(new Blockly.FieldNumber(15, 0, 28), 'ECHO');
    this.setOutput(true, 'Number');
    this.setColour(P.gpioInput);
    this.setTooltip('HC-SR04で距離（cm）を値として返します。条件ブロックなどにはめ込めます');
  }
};

// ===== DHT11 温湿度センサー =====

Blockly.Blocks['pico_dht_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('DHT11読み取り  ピン')
      .appendField(new Blockly.FieldNumber(16, 0, 28), 'PIN')
      .appendField('  温度→変数')
      .appendField(new Blockly.FieldTextInput('temp'), 'TVAR')
      .appendField('  湿度→変数')
      .appendField(new Blockly.FieldTextInput('humi'), 'HVAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioInput);
    this.setTooltip('DHT11から温度(℃)と湿度(%)を読み取り変数に入れます');
  }
};

})();
