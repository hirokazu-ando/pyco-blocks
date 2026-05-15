// ===== ピン番号ドロップダウン用ヘルパー =====

// 指定したピン（文字列）をリスト先頭に置いた GP0-GP28 選択肢を返す
function makePinOptions(def) {
  const all = [
    ['GP0','0'],  ['GP1','1'],  ['GP2','2'],  ['GP3','3'],  ['GP4','4'],
    ['GP5','5'],  ['GP6','6'],  ['GP7','7'],  ['GP8','8'],  ['GP9','9'],
    ['GP10','10'],['GP11','11'],['GP12','12'],['GP13','13'],['GP14','14'],
    ['GP15','15'],['GP16','16'],['GP17','17'],['GP18','18'],['GP19','19'],
    ['GP20','20'],['GP21','21'],['GP22','22'],
    ['GP25 (オンボード)','25'],
    ['GP26 (ADC0)','26'],['GP27 (ADC1)','27'],['GP28 (ADC2)','28'],
  ];
  const idx = all.findIndex(function(opt) { return opt[1] === String(def); });
  if (idx > 0) { all.unshift(all.splice(idx, 1)[0]); }
  return all;
}

// ===== デジタル出力 =====

(() => {
const P = window.PycoPalette;

Blockly.Blocks['pico_led_on'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LEDを点灯する  ピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('25')), 'PIN');
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('25')), 'PIN');
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('0')), 'PIN')
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('0')), 'PIN')
      .appendField('  プルアップ')
      .appendField(new Blockly.FieldDropdown([
        ['外付け(PU)','PULLUP_EXT'],
        ['外付け(PD)','PULLDOWN_EXT'],
        ['内部(PU)','PULLUP_INT'],
      ]), 'PULL')
      .appendField('  を読み  変数')
      .appendField(new Blockly.FieldVariable('val'), 'VAR')
      .appendField('に入れる');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioInput);
    this.setTooltip('デジタルピンの値（0 or 1）を変数に入れます。プルアップ方式により配線図と生成コードが切り替わります。');
  }
};

// ===== アナログ入力 =====

Blockly.Blocks['pico_analog_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('アナログ入力  ADCピン')
      .appendField(new Blockly.FieldDropdown([['GP26 (ADC0)','26'],['GP27 (ADC1)','27'],['GP28 (ADC2)','28']]), 'PIN')
      .appendField('を読み  変数')
      .appendField(new Blockly.FieldVariable('val'), 'VAR')
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('0')), 'PIN')
      .appendField('  プルアップ')
      .appendField(new Blockly.FieldDropdown([
        ['外付け(PU)','PULLUP_EXT'],
        ['外付け(PD)','PULLDOWN_EXT'],
        ['内部(PU)','PULLUP_INT'],
      ]), 'PULL')
      .appendField('  の入力値');
    this.setOutput(true, 'Boolean');
    this.setColour(P.gpioInput);
    this.setTooltip('デジタルピンの値（0/1）を返します。プルアップ方式により配線図と生成コードが切り替わります。');
  }
};

Blockly.Blocks['pico_analog_read_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ADCピン')
      .appendField(new Blockly.FieldDropdown([['GP26 (ADC0)','26'],['GP27 (ADC1)','27'],['GP28 (ADC2)','28']]), 'PIN')
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('0')), 'PIN')
      .appendField('  デューティ')
      .appendField(new Blockly.FieldNumber(50, 0, 100), 'DUTY')
      .appendField('%');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioOutput);
    this.setTooltip('PWMでアナログ的な出力をします。デューティ比 0〜100%');
  }
};

Blockly.Blocks['pico_pwm_write_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('PWM出力  ピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('0')), 'PIN');
    this.appendValueInput('DUTY').setCheck('Number')
      .appendField('  デューティ');
    this.appendDummyInput().appendField('%');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioOutput);
    this.setTooltip('PWMでアナログ的な出力をします。デューティに変数や式を差し込めます（0〜100）');
  }
};

// ===== ブザー =====

Blockly.Blocks['pico_buzzer_tone'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ブザー  ピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('15')), 'PIN')
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('15')), 'PIN');
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
      .appendField('  a:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('2')), 'PIN_A')
      .appendField('b:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('3')), 'PIN_B')
      .appendField('c:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('4')), 'PIN_C')
      .appendField('d:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('5')), 'PIN_D')
      .appendField('e:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('6')), 'PIN_E')
      .appendField('f:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('7')), 'PIN_F')
      .appendField('g:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('8')), 'PIN_G');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioDisplay);
    this.setTooltip('7セグメントLEDに数字(0〜9)を表示します。a〜g 各セグメントのピンを指定します');
  }
};

// ===== LCD1602 (I2C) =====

Blockly.Blocks['pico_lcd_init'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LCD初期化  SDAピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('0')), 'SDA')
      .appendField('  SCLピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('1')), 'SCL')
      .appendField('  変数')
      .appendField(new Blockly.FieldVariable('lcd'), 'VAR');
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
      .appendField(new Blockly.FieldVariable('lcd'), 'VAR')
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
      .appendField(new Blockly.FieldVariable('lcd'), 'VAR');
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('15')), 'PIN')
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('2')), 'IN1')
      .appendField('  IN2ピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('3')), 'IN2')
      .appendField('  ENピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('4')), 'EN')
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('2')), 'IN1')
      .appendField('  IN2ピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('3')), 'IN2');
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
      .appendField('ステッパー  IN1:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('8')),  'IN1')
      .appendField('IN2:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('9')),  'IN2')
      .appendField('IN3:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('10')), 'IN3')
      .appendField('IN4:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('11')), 'IN4')
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
      .appendField('ステッパー  IN1:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('8')),  'IN1')
      .appendField('IN2:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('9')),  'IN2')
      .appendField('IN3:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('10')), 'IN3')
      .appendField('IN4:')
      .appendField(new Blockly.FieldDropdown(makePinOptions('11')), 'IN4')
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('14')), 'TRIG')
      .appendField('  ECHOピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('15')), 'ECHO')
      .appendField('→ 変数')
      .appendField(new Blockly.FieldVariable('dist'), 'VAR');
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('14')), 'TRIG')
      .appendField('  ECHOピン')
      .appendField(new Blockly.FieldDropdown(makePinOptions('15')), 'ECHO');
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
      .appendField(new Blockly.FieldDropdown(makePinOptions('16')), 'PIN')
      .appendField('  温度→変数')
      .appendField(new Blockly.FieldVariable('temp'), 'TVAR')
      .appendField('  湿度→変数')
      .appendField(new Blockly.FieldVariable('humi'), 'HVAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioInput);
    this.setTooltip('DHT11から温度(℃)と湿度(%)を読み取り変数に入れます');
  }
};

// ==========================================================
// Pico W 専用ブロック（3-14 WiFi / 3-15 IoT 対応）
// ----------------------------------------------------------
// Pico W のオンボード LED は Pin(25) ではなく Pin('LED') に接続されている。
// WiFi 接続には network モジュール、HTTP には urequests モジュールが必要。
// 全て MicroPython モード専用（Skulpt 上では shim が必要）。
// ==========================================================

// ===== Pico W 内蔵 LED =====

Blockly.Blocks['pico_w_led_on'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('Pico W 内蔵LEDを点灯する');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioPicoW);
    this.setTooltip("Pico W の内蔵 LED を点灯します（Pin('LED', Pin.OUT).value(1)）");
  }
};
Blockly.Blocks['pico_w_led_off'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('Pico W 内蔵LEDを消灯する');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioPicoW);
    this.setTooltip("Pico W の内蔵 LED を消灯します（Pin('LED', Pin.OUT).value(0)）");
  }
};

// ===== Pico W WiFi 接続 =====

Blockly.Blocks['pico_w_wifi_connect'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('Pico W で WiFi に接続  SSID:')
      .appendField(new Blockly.FieldTextInput('your-ssid'), 'SSID')
      .appendField('  パスワード:')
      .appendField(new Blockly.FieldTextInput('your-password'), 'PASS');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioPicoW);
    this.setTooltip('Pico W を STA モードで起動し、指定した SSID に接続します。接続完了まで待機します');
  }
};

Blockly.Blocks['pico_w_wifi_ip'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('Pico W の IP アドレス');
    this.setOutput(true, 'String');
    this.setColour(P.gpioPicoW);
    this.setTooltip('現在接続中の WiFi の IP アドレスを文字列で返します（接続後に使用）');
  }
};

// ===== Pico W HTTP 通信 =====

Blockly.Blocks['pico_w_http_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('HTTP GET  URL:')
      .appendField(new Blockly.FieldTextInput('https://example.com/'), 'URL')
      .appendField('  結果→変数')
      .appendField(new Blockly.FieldVariable('resp'), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioPicoW);
    this.setTooltip('指定 URL に HTTP GET を送り、レスポンス本文（文字列）を変数に入れます');
  }
};

Blockly.Blocks['pico_w_http_post'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('HTTP POST  URL:')
      .appendField(new Blockly.FieldTextInput('https://example.com/'), 'URL')
      .appendField('  送るデータ:');
    this.appendValueInput('DATA');
    this.appendDummyInput()
      .appendField('  結果→変数')
      .appendField(new Blockly.FieldVariable('resp'), 'VAR');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.gpioPicoW);
    this.setTooltip('指定 URL に HTTP POST を送ります。データは文字列（JSON など）。レスポンス本文を変数に入れます');
  }
};

})();
