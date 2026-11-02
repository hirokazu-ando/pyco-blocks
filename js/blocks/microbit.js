// ===== micro:bit V2 ブロック定義・コード生成 =====
// 生成するコードは micro:bit 版 MicroPython（v2.1）の microbit モジュール用。
// machine.Pin ではなく pin0.write_digital() などの書き方になるので、
// Pico 用のブロックとは混ぜない（micro:bit を選ぶとツールボックスごと入れ替わる）。
//
// 端子の選択肢から P3/P4/P6/P7/P9/P10 を外しているのは、LED 表示の配線と共用だから。
// 使うと表示が乱れたり、端子の値が読めなかったりする。

(() => {
const P = window.PycoPalette;

// デジタル入出力に使ってよい端子（LED 表示・ボタンと共用でないもの）
const DIGITAL_PINS = [['P0','pin0'],['P1','pin1'],['P2','pin2'],['P8','pin8'],
  ['P12','pin12'],['P13','pin13'],['P14','pin14'],['P15','pin15'],['P16','pin16']];
// アナログ入力ができる端子（P3/P4/P10 もできるが LED 表示と共用）
const ANALOG_PINS = [['P0','pin0'],['P1','pin1'],['P2','pin2']];

const ICONS = [
  ['ハート','HEART'],['小さいハート','HEART_SMALL'],['にっこり','HAPPY'],['にこにこ','SMILE'],
  ['かなしい','SAD'],['おこる','ANGRY'],['びっくり','SURPRISED'],['ねむい','ASLEEP'],
  ['まる（YES）','YES'],['ばつ（NO）','NO'],['上の矢印','ARROW_N'],['右の矢印','ARROW_E'],
  ['下の矢印','ARROW_S'],['左の矢印','ARROW_W'],['ドクロ','SKULL'],['アヒル','DUCK'],
  ['うさぎ','RABBIT'],['かめ','TORTOISE'],['音符','MUSIC_QUAVER'],['ダイヤ','DIAMOND'],
];

const TUNES = [
  ['ピンポン（BA_DING）','BA_DING'],['パワーアップ','POWER_UP'],['パワーダウン','POWER_DOWN'],
  ['ジャンプ（上がる）','JUMP_UP'],['ジャンプ（下がる）','JUMP_DOWN'],['ニャンキャット','NYAN'],
  ['エンターテイナー','ENTERTAINER'],['よろこびの歌','ODE'],['ハッピーバースデー','BIRTHDAY'],
  ['ウエディング','WEDDING'],['着信音','RINGTONE'],['ファンク','FUNK'],['ブルース','BLUES'],
  ['ダダダダム','DADADADUM'],['おいかけっこ','CHASE'],['ざんねん（WAWAWAWAA）','WAWAWAWAA'],
];

const GESTURES = [
  ['ふった','shake'],['上に傾けた','up'],['下に傾けた','down'],['左に傾けた','left'],
  ['右に傾けた','right'],['表を上にした','face up'],['裏を上にした','face down'],['落とした','freefall'],
];

function dd(options) { return new Blockly.FieldDropdown(options); }

function stmt(block, colour) {
  block.setPreviousStatement(true, null);
  block.setNextStatement(true, null);
  block.setInputsInline(true);
  block.setColour(colour);
}

// ---------------------------------------------------------------- LED 表示

Blockly.Blocks['mb_scroll'] = {
  init: function() {
    this.appendValueInput('TEXT').appendField('LED に');
    this.appendDummyInput().appendField('を流して表示する');
    stmt(this, P.mbDisplay);
    this.setTooltip('文字や数を右から左へ流して表示します（全部流れ終わるまで待ちます）');
  }
};

Blockly.Blocks['mb_show'] = {
  init: function() {
    this.appendValueInput('TEXT').appendField('LED に');
    this.appendDummyInput().appendField('を1文字ずつ表示する');
    stmt(this, P.mbDisplay);
    this.setTooltip('0〜9 の数や 1 文字を表示するときに使います');
  }
};

Blockly.Blocks['mb_show_icon'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LED にアイコン')
      .appendField(dd(ICONS), 'ICON')
      .appendField('を表示する');
    stmt(this, P.mbDisplay);
  }
};

Blockly.Blocks['mb_set_pixel'] = {
  init: function() {
    this.appendDummyInput().appendField('LED の 横');
    this.appendValueInput('X').setCheck('Number');
    this.appendDummyInput().appendField('縦');
    this.appendValueInput('Y').setCheck('Number');
    this.appendDummyInput().appendField('を 明るさ');
    this.appendValueInput('B').setCheck('Number');
    this.appendDummyInput().appendField('で点ける');
    stmt(this, P.mbDisplay);
    this.setTooltip('横・縦は 0〜4、明るさは 0（消す）〜9（いちばん明るい）');
  }
};

Blockly.Blocks['mb_clear'] = {
  init: function() {
    this.appendDummyInput().appendField('LED を全部消す');
    stmt(this, P.mbDisplay);
  }
};

// ---------------------------------------------------------------- ボタン

Blockly.Blocks['mb_button'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ボタン')
      .appendField(dd([['A','button_a'],['B','button_b']]), 'BTN')
      .appendField(dd([['が押されている','is_pressed'],['が押された（前に調べてから）','was_pressed']]), 'KIND');
    this.setOutput(true, 'Boolean');
    this.setColour(P.mbInput);
    this.setTooltip('「押されている」は今この瞬間、「押された」は前に調べてから一度でも押されたかを返します');
  }
};

Blockly.Blocks['mb_button_presses'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('ボタン')
      .appendField(dd([['A','button_a'],['B','button_b']]), 'BTN')
      .appendField('が押された回数');
    this.setOutput(true, 'Number');
    this.setColour(P.mbInput);
    this.setTooltip('前に調べてから押された回数。調べると 0 に戻ります');
  }
};

Blockly.Blocks['mb_logo_touched'] = {
  init: function() {
    this.appendDummyInput().appendField('ロゴ（表の金色のマーク）がさわられている');
    this.setOutput(true, 'Boolean');
    this.setColour(P.mbInput);
  }
};

// ---------------------------------------------------------------- センサー

Blockly.Blocks['mb_accel'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('加速度')
      .appendField(dd([['x（左右）','get_x'],['y（前後）','get_y'],['z（上下）','get_z']]), 'AXIS');
    this.setOutput(true, 'Number');
    this.setColour(P.mbSensor);
    this.setTooltip('傾きや動きの大きさ。水平に置くと x・y がほぼ 0、z が約 -1024');
  }
};

Blockly.Blocks['mb_gesture'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('micro:bit を')
      .appendField(dd(GESTURES), 'G');
    this.setOutput(true, 'Boolean');
    this.setColour(P.mbSensor);
    this.setTooltip('前に調べてから、その動きがあったら True');
  }
};

Blockly.Blocks['mb_temperature'] = {
  init: function() {
    this.appendDummyInput().appendField('温度（℃）');
    this.setOutput(true, 'Number');
    this.setColour(P.mbSensor);
    this.setTooltip('チップの温度なので、室温より少し高めに出ます');
  }
};

Blockly.Blocks['mb_light'] = {
  init: function() {
    this.appendDummyInput().appendField('明るさ（0〜255）');
    this.setOutput(true, 'Number');
    this.setColour(P.mbSensor);
    this.setTooltip('LED を使って明るさを測ります。測っている間は LED 表示が少しちらつきます');
  }
};

Blockly.Blocks['mb_sound_level'] = {
  init: function() {
    this.appendDummyInput().appendField('音の大きさ（0〜255）');
    this.setOutput(true, 'Number');
    this.setColour(P.mbSensor);
    this.setTooltip('内蔵マイクで測ります（micro:bit V2 だけ）');
  }
};

Blockly.Blocks['mb_running_time'] = {
  init: function() {
    this.appendDummyInput().appendField('動き始めてからの時間（ミリ秒）');
    this.setOutput(true, 'Number');
    this.setColour(P.timing);
  }
};

// ---------------------------------------------------------------- 音

Blockly.Blocks['mb_music_play'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('メロディ')
      .appendField(dd(TUNES), 'TUNE')
      .appendField('を鳴らす')
      .appendField(dd([['（終わるまで待つ）','True'],['（待たずに次へ）','False']]), 'WAIT');
    stmt(this, P.mbSound);
  }
};

Blockly.Blocks['mb_music_pitch'] = {
  init: function() {
    this.appendDummyInput().appendField('高さ');
    this.appendValueInput('FREQ').setCheck('Number');
    this.appendDummyInput().appendField('Hz の音を');
    this.appendValueInput('MS').setCheck('Number');
    this.appendDummyInput().appendField('ミリ秒鳴らす');
    stmt(this, P.mbSound);
    this.setTooltip('ド（C4）は 262Hz、ラ（A4）は 440Hz');
  }
};

Blockly.Blocks['mb_music_stop'] = {
  init: function() {
    this.appendDummyInput().appendField('音を止める');
    stmt(this, P.mbSound);
  }
};

// ---------------------------------------------------------------- 無線

Blockly.Blocks['mb_radio_group'] = {
  init: function() {
    this.appendDummyInput().appendField('無線のグループを');
    this.appendValueInput('N').setCheck('Number');
    this.appendDummyInput().appendField('にする');
    stmt(this, P.mbRadio);
    this.setTooltip('同じグループ（0〜255）の micro:bit どうしだけで送り合えます');
  }
};

Blockly.Blocks['mb_radio_send'] = {
  init: function() {
    this.appendValueInput('VALUE').appendField('無線で');
    this.appendDummyInput().appendField('を送る');
    stmt(this, P.mbRadio);
  }
};

Blockly.Blocks['mb_radio_receive'] = {
  init: function() {
    this.appendDummyInput().appendField('無線で受け取った文字');
    this.setOutput(true, 'String');
    this.setColour(P.mbRadio);
    this.setTooltip('届いていないときは空の文字 "" になります');
  }
};

// ---------------------------------------------------------------- 端子

Blockly.Blocks['mb_digital_write'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('端子')
      .appendField(dd(DIGITAL_PINS), 'PIN')
      .appendField('を')
      .appendField(dd([['1（オン）','1'],['0（オフ）','0']]), 'VAL')
      .appendField('にする');
    stmt(this, P.mbPin);
  }
};

Blockly.Blocks['mb_digital_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('端子')
      .appendField(dd(DIGITAL_PINS), 'PIN')
      .appendField('のデジタル値（0/1）');
    this.setOutput(true, 'Number');
    this.setColour(P.mbPin);
  }
};

Blockly.Blocks['mb_analog_write'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('端子')
      .appendField(dd(DIGITAL_PINS), 'PIN')
      .appendField('に');
    this.appendValueInput('VALUE').setCheck('Number');
    this.appendDummyInput().appendField('を出す（0〜1023）');
    stmt(this, P.mbPin);
    this.setTooltip('LED の明るさを変えるときなどに使います（PWM）');
  }
};

Blockly.Blocks['mb_analog_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('端子')
      .appendField(dd(ANALOG_PINS), 'PIN')
      .appendField('のアナログ値（0〜1023）');
    this.setOutput(true, 'Number');
    this.setColour(P.mbPin);
  }
};

// ================================================================ コード生成
// app.js の valueBlockToCode / blockToCode / blockLabel が、知らないブロックを
// ここへ回す。v は valueToCode(block, 入力名, 既定値)。

const VALUE = {
  mb_button:         b => `${b.getFieldValue('BTN')}.${b.getFieldValue('KIND')}()`,
  mb_button_presses: b => `${b.getFieldValue('BTN')}.get_presses()`,
  mb_logo_touched:   () => 'pin_logo.is_touched()',
  mb_accel:          b => `accelerometer.${b.getFieldValue('AXIS')}()`,
  mb_gesture:        b => `accelerometer.was_gesture('${b.getFieldValue('G')}')`,
  mb_temperature:    () => 'temperature()',
  mb_light:          () => 'display.read_light_level()',
  mb_sound_level:    () => 'microphone.sound_level()',
  mb_running_time:   () => 'running_time()',
  // radio.receive() は届いていないと None を返す。比べたり表示したりで
  // つまずかないよう空の文字に置きかえる
  mb_radio_receive:  () => '(radio.receive() or "")',
  mb_digital_read:   b => `${b.getFieldValue('PIN')}.read_digital()`,
  mb_analog_read:    b => `${b.getFieldValue('PIN')}.read_analog()`,
};

const STMT = {
  mb_scroll:        (b, v) => `display.scroll(str(${v(b, 'TEXT', '""')}))`,
  mb_show:          (b, v) => `display.show(str(${v(b, 'TEXT', '""')}))`,
  mb_show_icon:     b => `display.show(Image.${b.getFieldValue('ICON')})`,
  mb_set_pixel:     (b, v) => `display.set_pixel(int(${v(b, 'X', '2')}), int(${v(b, 'Y', '2')}), int(${v(b, 'B', '9')}))`,
  mb_clear:         () => 'display.clear()',
  mb_music_play:    b => `music.play(music.${b.getFieldValue('TUNE')}, wait=${b.getFieldValue('WAIT')})`,
  mb_music_pitch:   (b, v) => `music.pitch(int(${v(b, 'FREQ', '440')}), int(${v(b, 'MS', '500')}))`,
  mb_music_stop:    () => 'music.stop()',
  mb_radio_group:   (b, v) => `radio.config(group=int(${v(b, 'N', '1')}))`,
  mb_radio_send:    (b, v) => `radio.send(str(${v(b, 'VALUE', '""')}))`,
  mb_digital_write: b => `${b.getFieldValue('PIN')}.write_digital(${b.getFieldValue('VAL')})`,
  mb_analog_write:  (b, v) => `${b.getFieldValue('PIN')}.write_analog(int(${v(b, 'VALUE', '512')}))`,
};

function pinLabel(b) { return 'P' + String(b.getFieldValue('PIN')).replace('pin', ''); }
function btnLabel(b) { return b.getFieldValue('BTN') === 'button_a' ? 'A' : 'B'; }

const LABEL = {
  mb_scroll:         () => 'LED に流して表示する',
  mb_show:           () => 'LED に1文字ずつ表示する',
  mb_show_icon:      b => `LED にアイコン（${b.getFieldValue('ICON')}）を表示する`,
  mb_set_pixel:      () => 'LED を1つ点ける',
  mb_clear:          () => 'LED を全部消す',
  mb_button:         b => `ボタン${btnLabel(b)}`,
  mb_button_presses: b => `ボタン${btnLabel(b)}が押された回数`,
  mb_music_play:     b => `メロディ（${b.getFieldValue('TUNE')}）を鳴らす`,
  mb_music_pitch:    () => '音を鳴らす',
  mb_music_stop:     () => '音を止める',
  mb_radio_group:    () => '無線のグループを決める',
  mb_radio_send:     () => '無線で送る',
  mb_digital_write:  b => `端子${pinLabel(b)} → ${b.getFieldValue('VAL') === '1' ? 'オン' : 'オフ'}`,
  mb_analog_write:   b => `端子${pinLabel(b)} にアナログ値を出す`,
};

const MUSIC_TYPES = ['mb_music_play', 'mb_music_pitch', 'mb_music_stop'];
const RADIO_TYPES = ['mb_radio_group', 'mb_radio_send', 'mb_radio_receive'];

// 生成コードの先頭。blockTypes はワークスペースにあるブロックの種類（Set）
function header(blockTypes, showComments) {
  const c = s => (showComments ? `# ${s}\n` : '');
  const has = list => list.some(t => blockTypes.has(t));
  let h = c('micro:bit の LED 表示・ボタン・センサー・端子') + 'from microbit import *\n' +
          c('時間待機用（MicroPython版 time モジュール）') + 'import utime\n';
  if (has(MUSIC_TYPES)) h += c('音を鳴らす') + 'import music\n';
  if (has(RADIO_TYPES)) h += c('無線（micro:bit どうしで送り合う）') + 'import radio\n';
  if (blockTypes.has('py_random_int')) h += c('乱数生成用') + 'import random\n';
  // 無線は電源を入れないと送れない・受け取れない。グループを決めなければ 0 番
  if (has(RADIO_TYPES)) h += '\nradio.on()\n';
  return h + '\n';
}

window.PycoMicrobit = {
  header,
  hasValue: t => Object.prototype.hasOwnProperty.call(VALUE, t),
  hasStmt:  t => Object.prototype.hasOwnProperty.call(STMT, t),
  value: b => VALUE[b.type](b),
  stmt:  (b, v) => STMT[b.type](b, v),
  label: b => (LABEL[b.type] ? LABEL[b.type](b) : null),
};
})();
