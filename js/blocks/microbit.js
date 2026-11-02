// ===== micro:bit V2 ブロック定義・コード生成 =====
// 生成するコードは micro:bit 版 MicroPython（v2.1）の microbit モジュール用。
// machine.Pin ではなく pin0.write_digital() などの書き方になるので、
// Pico 用のブロックとは混ぜない（micro:bit を選ぶとツールボックスごと入れ替わる）。
//
// ブロックの文言・カテゴリの色は MakeCode for micro:bit（MIT ライセンス）の日本語訳に合わせた。
// MakeCode で覚えた子が、同じ見た目のブロックで Python に進めるようにするため。
// 出典：github.com/microsoft/pxt-microbit の //% color と、MakeCode の翻訳（Crowdin 承認済み）。
//
// 端子の選択肢から P3/P4/P6/P7/P9/P10 を外しているのは、LED 表示の配線と共用だから。
// 使うと表示が乱れたり、端子の値が読めなかったりする。
//
// 「…とき」「ずっと」のイベントブロックは、MicroPython に同じ仕組みが無い。
// app.js の generateCode が while True: の中に順に並べ、1 周ごとに調べる形にする。

(() => {

// MakeCode のカテゴリ色
const C = {
  basic: '#1E90FF', input: '#D400D4', music: '#E63022', led: '#5C2D91', radio: '#E3008C',
  loops: '#00AA00', pins: '#B22222', serial: '#002050',
};

// デジタル入出力に使ってよい端子（LED 表示・ボタンと共用でないもの）
const DIGITAL_PINS = [['P0','pin0'],['P1','pin1'],['P2','pin2'],['P8','pin8'],
  ['P12','pin12'],['P13','pin13'],['P14','pin14'],['P15','pin15'],['P16','pin16']];
// アナログ入力ができる端子（P3/P4/P10 もできるが LED 表示と共用）
const ANALOG_PINS = [['P0','pin0'],['P1','pin1'],['P2','pin2']];
// タッチを調べられる端子
const TOUCH_PINS = ANALOG_PINS;
const BUTTONS = [['A','a'],['B','b'],['A+B','ab']];

// 並びと訳は MakeCode の IconNames どおり
const ICONS = [
  ['ハート','HEART'],['小さいハート','HEART_SMALL'],['チェック','YES'],['バツ','NO'],
  ['うれしい顔','HAPPY'],['かなしい顔','SAD'],['こまり顔','CONFUSED'],['おこり顔','ANGRY'],
  ['ねてる顔','ASLEEP'],['びっくり顔','SURPRISED'],['へん顔','SILLY'],['すばらしい','FABULOUS'],
  ['ふーん','MEH'],['Tシャツ','TSHIRT'],['ローラースケート','ROLLERSKATE'],['あひる','DUCK'],
  ['家','HOUSE'],['かめ','TORTOISE'],['ちょうちょ','BUTTERFLY'],['棒人間','STICKFIGURE'],
  ['おばけ','GHOST'],['剣','SWORD'],['きりん','GIRAFFE'],['がいこつ','SKULL'],
  ['かさ','UMBRELLA'],['へび','SNAKE'],['うさぎ','RABBIT'],['うし','COW'],
  ['4分音符','MUSIC_CROTCHET'],['8分音符','MUSIC_QUAVER'],['くまで','PITCHFORK'],['まと','TARGET'],
  ['三角','TRIANGLE'],['左向き三角','TRIANGLE_LEFT'],['チェスボード','CHESSBOARD'],['ダイアモンド','DIAMOND'],
  ['小さいダイアモンド','DIAMOND_SMALL'],['しかく','SQUARE'],['小さいしかく','SQUARE_SMALL'],['はさみ','SCISSORS'],
];

// アイコンの形（選択肢の絵に使う）。MakeCode for micro:bit の libs/core/icons.ts（MIT License,
// Copyright (c) Microsoft Corporation）から取った。'9' が点く LED
const ICON_SHAPE = {
  HEART: '09090:99999:99999:09990:00900',
  HEART_SMALL: '00000:09090:09990:00900:00000',
  HAPPY: '00000:09090:00000:90009:09990',
  SAD: '00000:09090:00000:09990:90009',
  CONFUSED: '00000:09090:00000:09090:90909',
  ANGRY: '90009:09090:00000:99999:90909',
  ASLEEP: '00000:99099:00000:09990:00000',
  SURPRISED: '09090:00000:00900:09090:00900',
  SILLY: '90009:00000:99999:00099:00099',
  FABULOUS: '99999:99099:00000:09090:09990',
  MEH: '99099:00000:00090:00900:09000',
  YES: '00000:00009:00090:90900:09000',
  NO: '90009:09090:00900:09090:90009',
  TRIANGLE: '00000:00900:09090:99999:00000',
  TRIANGLE_LEFT: '90000:99000:90900:90090:99999',
  CHESSBOARD: '09090:90909:09090:90909:09090',
  DIAMOND: '00900:09090:90009:09090:00900',
  DIAMOND_SMALL: '00000:00900:09090:00900:00000',
  SQUARE: '99999:90009:90009:90009:99999',
  SQUARE_SMALL: '00000:09990:09090:09990:00000',
  SCISSORS: '99009:99090:00900:99090:99009',
  TSHIRT: '99099:99999:09990:09990:09990',
  ROLLERSKATE: '00099:00099:99999:99999:09090',
  DUCK: '09900:99900:09999:09990:00000',
  HOUSE: '00900:09990:99999:09990:09090',
  TORTOISE: '00000:09990:99999:09090:00000',
  BUTTERFLY: '99099:99999:00900:99999:99099',
  STICKFIGURE: '00900:99999:00900:09090:90009',
  GHOST: '09990:90909:99999:99999:90909',
  SWORD: '00900:00900:00900:09990:00900',
  GIRAFFE: '99000:09000:09000:09990:09090',
  SKULL: '09990:90909:99999:09990:09990',
  UMBRELLA: '09990:99999:00900:90900:99900',
  SNAKE: '99000:99099:09090:09990:00000',
  RABBIT: '90900:90900:99990:99090:99990',
  COW: '90009:90009:99999:09990:00900',
  MUSIC_CROTCHET: '00900:00900:00900:99900:99900',
  MUSIC_QUAVER: '00900:00990:00909:99900:99900',
  PITCHFORK: '90909:90909:99999:00900:00900',
  TARGET: '00900:09990:99099:09990:00900',
};

const ARROWS = [
  ['上向き　　↑','N'],['右上向き　↗','NE'],['右向き　　→','E'],['右下向き　↘','SE'],
  ['下向き　　↓','S'],['左下向き　↙','SW'],['左向き　　←','W'],['左上向き　↖','NW'],
];

const MELODIES = [
  ['ダダダム','DADADADUM'],['ジ・エンターテイナー','ENTERTAINER'],['プレリュード','PRELUDE'],
  ['歓喜の歌','ODE'],['ニャン・キャット','NYAN'],['着信メロディ','RINGTONE'],['ファンク','FUNK'],
  ['ブルース','BLUES'],['ハッピーバースデー','BIRTHDAY'],['ウェディング・マーチ','WEDDING'],
  ['おそうしき','FUNERAL'],['ちゃんちゃん♪','PUNCHLINE'],['タッタラッタッター','BADDY'],
  ['チェイス','CHASE'],['ピコーン！','BA_DING'],['ワワワワー','WAWAWAWAA'],
  ['ジャンプアップ','JUMP_UP'],['ジャンプダウン','JUMP_DOWN'],['パワーアップ','POWER_UP'],['パワーダウン','POWER_DOWN'],
];

const SOUNDS = [
  ['くすくす笑う','GIGGLE'],['ハッピー','HAPPY'],['ハロー','HELLO'],['ミステリアス','MYSTERIOUS'],
  ['悲しい','SAD'],['するする動く','SLIDE'],['舞い上がる','SOARING'],['バネ','SPRING'],
  ['キラキラ','TWINKLE'],['あくび','YAWN'],
];

// MakeCode の Gesture → MicroPython のジェスチャー名
const GESTURES = [
  ['ゆさぶられた','shake'],['ロゴが上になった','up'],['ロゴが下になった','down'],
  ['画面が上になった','face up'],['画面が下になった','face down'],
  ['左に傾けた','left'],['右に傾けた','right'],['落とした','freefall'],
  ['3G','3g'],['6G','6g'],['8G','8g'],
];

function dd(options) { return new Blockly.FieldDropdown(options); }

function stmt(block, colour) {
  block.setPreviousStatement(true, null);
  block.setNextStatement(true, null);
  block.setInputsInline(true);
  block.setColour(colour);
}

function value(block, colour, check) {
  block.setOutput(true, check || null);
  block.setInputsInline(true);
  block.setColour(colour);
}

// イベント。上にも下にもつながらず、中に処理を入れる。
// MakeCode の「最初だけ」「ずっと」と同じく、上の辺は平ら（帽子のふくらみは付けない）
function hat(block, colour) {
  block.appendStatementInput('DO');
  block.setColour(colour);
}

// 「LED画面に表示」の 5×5 のマス。押したマスが点く（MakeCode と同じ見た目）。
// 値は 25 文字の '0'/'1'（左上から右へ、上の行から下の行へ）
// マスは画面の上で 16px 以上にする（作業域の拡大率は 0.6〜0.7 になることが多い。17px では約 10px で、
// 子どもの指・マウスで狙いにくかった）。27 × 0.6 ≒ 16px
const CELL = 27, GAP = 4;
class FieldLedMatrix extends Blockly.Field {
  constructor(value) {
    super(value || '0'.repeat(25));
    this.SERIALIZABLE = true;
    this.CURSOR = 'pointer';
  }
  static fromJson(options) { return new FieldLedMatrix(options.value); }
  doClassValidation_(v) { return /^[01]{25}$/.test(String(v)) ? String(v) : null; }
  initView() {
    this.cells_ = [];
    for (let i = 0; i < 25; i++) {
      this.cells_.push(Blockly.utils.dom.createSvgElement('rect', {
        x: (i % 5) * (CELL + GAP), y: Math.floor(i / 5) * (CELL + GAP),
        width: CELL, height: CELL, rx: 4, ry: 4,
      }, this.fieldGroup_));
    }
  }
  render_() {
    const v = this.getValue() || '';
    // Blockly の CSS が rect の塗りを白にするので、style で上書きする
    this.cells_.forEach((r, i) => { r.style.fill = v[i] === '1' ? '#ffffff' : 'rgba(0, 0, 0, 0.3)'; });
    this.size_ = new Blockly.utils.Size(5 * CELL + 4 * GAP, 5 * CELL + 4 * GAP);
  }
  // マスを押したときに呼ばれる。押した位置のマスを切りかえる
  showEditor_(e) {
    if (!e || e.clientX === undefined) return;
    const r = this.fieldGroup_.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / r.width * 5);
    const y = Math.floor((e.clientY - r.top) / r.height * 5);
    if (x < 0 || x > 4 || y < 0 || y > 4) return;
    const v = this.getValue().split('');
    v[y * 5 + x] = v[y * 5 + x] === '1' ? '0' : '1';
    this.setValue(v.join(''));
  }
  getText() { return 'LED画面'; }
}
Blockly.fieldRegistry.register('field_mb_leds', FieldLedMatrix);

// アイコンの選択肢は絵で出す（MakeCode と同じ）。ICON_SHAPES は下の ICON_SHAPE から作る
function iconSrc(rows) {
  let rects = '';
  rows.replace(/:/g, '').split('').forEach((c, i) => {
    rects += `<rect x="${(i % 5) * 5}" y="${Math.floor(i / 5) * 5}" width="4" height="4" rx="1" fill="${c === '0' ? 'rgba(0,0,0,0.3)' : '#fff'}"/>`;
  });
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${rects}</svg>`);
}

// 「ラベル [入力] ラベル [入力] …」を順に並べる小さな道具。
// parts は 文字列（ラベル）か ['入力名', 'Number' など] の配列
function line(block, parts) {
  parts.forEach(p => {
    if (typeof p === 'string') block.appendDummyInput().appendField(p);
    else block.appendValueInput(p[0]).setCheck(p[1] || null);
  });
}

function def(type, init) { Blockly.Blocks[type] = { init }; }

// ================================================================ 基本

def('mb_show_number', function() {
  line(this, ['数を表示', ['NUM', 'Number']]);
  stmt(this, C.basic);
  this.setTooltip('数を表示します。2けた以上は右から左へ流れます');
});

def('mb_show_leds', function() {
  this.appendDummyInput().appendField('LED画面に表示');
  this.appendDummyInput().appendField(new FieldLedMatrix(), 'LEDS');
  stmt(this, C.basic);
  this.setInputsInline(false);
  this.setTooltip('マスを押すと、その LED が点きます');
});

def('mb_show_icon', function() {
  const opts = ICONS.map(([name, id]) => [{ src: iconSrc(ICON_SHAPE[id]), width: 24, height: 24, alt: name }, id]);
  this.appendDummyInput().appendField('アイコンを表示').appendField(dd(opts), 'ICON');
  stmt(this, C.basic);
});

def('mb_scroll', function() {
  line(this, ['文字列を表示', ['TEXT']]);
  stmt(this, C.basic);
  this.setTooltip('文字を右から左へ流して表示します（全部流れ終わるまで待ちます）');
});

def('mb_clear', function() {
  this.appendDummyInput().appendField('表示を消す');
  stmt(this, C.basic);
});

def('mb_forever', function() {
  this.appendDummyInput().appendField('ずっと');
  hat(this, C.basic);
  this.setTooltip('中のブロックをくり返し動かします');
});

def('mb_pause', function() {
  line(this, ['一時停止（ミリ秒）', ['MS', 'Number']]);
  stmt(this, C.basic);
  this.setTooltip('1000 ミリ秒 = 1 秒。待っている間は「…とき」のブロックも動きません');
});

def('mb_on_start', function() {
  this.appendDummyInput().appendField('最初だけ');
  hat(this, C.basic);
  this.setTooltip('電源を入れたときに 1 回だけ動きます');
});

def('mb_show_arrow', function() {
  this.appendDummyInput().appendField('矢印を表示').appendField(dd(ARROWS), 'DIR');
  stmt(this, C.basic);
});

// ================================================================ 入力

def('mb_on_button', function() {
  this.appendDummyInput().appendField('ボタン').appendField(dd(BUTTONS), 'BTN').appendField('が押されたとき');
  hat(this, C.input);
});

def('mb_on_gesture', function() {
  this.appendDummyInput().appendField(dd(GESTURES), 'G').appendField('とき');
  hat(this, C.input);
});

def('mb_on_pin_pressed', function() {
  this.appendDummyInput().appendField('端子').appendField(dd(TOUCH_PINS), 'PIN').appendField('が短くタップされたとき');
  hat(this, C.input);
  this.setTooltip('端子と GND を両手で持つとタッチになります');
});

def('mb_on_logo', function() {
  this.appendDummyInput().appendField('ロゴが')
    .appendField(dd([['タッチされた','touch'],['タッチが無くなった','release']]), 'ACT').appendField('とき');
  hat(this, C.input);
});

def('mb_on_sound', function() {
  this.appendDummyInput().appendField('まわりの音が')
    .appendField(dd([['うるさくなった','LOUD'],['静かになった','QUIET']]), 'EV').appendField('とき');
  hat(this, C.input);
});

def('mb_button', function() {
  this.appendDummyInput().appendField('ボタン').appendField(dd(BUTTONS), 'BTN').appendField('が押されている');
  value(this, C.input, 'Boolean');
});

def('mb_pin_touched', function() {
  this.appendDummyInput().appendField('端子').appendField(dd(TOUCH_PINS), 'PIN').appendField('がタッチされている');
  value(this, C.input, 'Boolean');
});

def('mb_accel', function() {
  this.appendDummyInput().appendField('加速度')
    .appendField(dd([['x','get_x'],['y','get_y'],['z','get_z'],['絶対値','get_strength']]), 'AXIS');
  value(this, C.input, 'Number');
  this.setTooltip('単位は mg（1000 で地球の重力 1 つ分）。水平に置くと x・y がほぼ 0、z が約 -1000');
});

def('mb_logo_touched', function() {
  this.appendDummyInput().appendField('ロゴがタッチされている');
  value(this, C.input, 'Boolean');
});

def('mb_light', function() {
  this.appendDummyInput().appendField('明るさ');
  value(this, C.input, 'Number');
  this.setTooltip('0〜255。LED を使って測るので、測っている間は表示が少しちらつきます');
});

def('mb_compass', function() {
  this.appendDummyInput().appendField('方角（°）');
  value(this, C.input, 'Number');
  this.setTooltip('北が 0。初めて使うときは LED に出る指示どおりに micro:bit を傾けて調整します');
});

def('mb_temperature', function() {
  this.appendDummyInput().appendField('温度（℃）');
  value(this, C.input, 'Number');
  this.setTooltip('チップの温度なので、室温より少し高めに出ます');
});

def('mb_sound_level', function() {
  this.appendDummyInput().appendField('まわりの音の大きさ');
  value(this, C.input, 'Number');
  this.setTooltip('0〜255。内蔵マイクで測ります');
});

def('mb_set_sound_threshold', function() {
  this.appendDummyInput().appendField(dd([['うるさいかどうか','LOUD'],['静かかどうか','QUIET']]), 'EV');
  line(this, ['のしきい値を', ['N', 'Number'], 'に設定する']);
  stmt(this, C.input);
  this.setTooltip('0〜255');
});

def('mb_is_gesture', function() {
  this.appendDummyInput().appendField(dd(GESTURES), 'G').appendField('動き');
  value(this, C.input, 'Boolean');
});

def('mb_calibrate', function() {
  this.appendDummyInput().appendField('コンパスを調整する');
  stmt(this, C.input);
});

def('mb_magnetic', function() {
  this.appendDummyInput().appendField('磁力（µT）')
    .appendField(dd([['x','get_x'],['y','get_y'],['z','get_z'],['絶対値','get_field_strength']]), 'AXIS');
  value(this, C.input, 'Number');
});

def('mb_running_time', function() {
  this.appendDummyInput().appendField('稼働時間（ミリ秒）');
  value(this, C.input, 'Number');
});

// ================================================================ 音楽

def('mb_play_tone', function() {
  line(this, ['音を鳴らす 高さ（Hz）', ['FREQ', 'Number'], '長さ（ミリ秒）', ['MS', 'Number']]);
  stmt(this, C.music);
  this.setTooltip('ド（C4）は 262Hz、ラ（A4）は 440Hz');
});

def('mb_ring_tone', function() {
  line(this, ['音を鳴らす 高さ（Hz）', ['FREQ', 'Number']]);
  stmt(this, C.music);
  this.setTooltip('止めるまで鳴り続けます');
});

def('mb_rest', function() {
  line(this, ['休符（ミリ秒）', ['MS', 'Number']]);
  stmt(this, C.music);
});

def('mb_music_play', function() {
  this.appendDummyInput().appendField('メロディを鳴らす').appendField(dd(MELODIES), 'TUNE')
    .appendField(dd([['終わるまで','once'],['バックグラウンドで一度だけ','bg'],['バックグラウンドでずっと','loop']]), 'MODE');
  stmt(this, C.music);
});

def('mb_sound_effect', function() {
  this.appendDummyInput().appendField('効果音').appendField(dd(SOUNDS), 'SOUND')
    .appendField(dd([['を鳴らして終わるまで待つ','True'],['を開始する','False']]), 'WAIT');
  stmt(this, C.music);
});

def('mb_set_tempo', function() {
  line(this, ['テンポを設定する（bpm）', ['N', 'Number']]);
  stmt(this, C.music);
});

def('mb_change_tempo', function() {
  line(this, ['テンポを増やす（bpm）', ['N', 'Number']]);
  stmt(this, C.music);
});

def('mb_tempo', function() {
  this.appendDummyInput().appendField('テンポ (bpm)');
  value(this, C.music, 'Number');
});

def('mb_set_volume', function() {
  line(this, ['音量を設定する', ['N', 'Number']]);
  stmt(this, C.music);
  this.setTooltip('0〜255');
});

def('mb_stop_all', function() {
  this.appendDummyInput().appendField('すべての音を停止する');
  stmt(this, C.music);
});

def('mb_speaker', function() {
  this.appendDummyInput().appendField('内蔵スピーカーを')
    .appendField(dd([['オン','on'],['オフ','off']]), 'ON').appendField('にする');
  stmt(this, C.music);
});

// ================================================================ LED

['plot:点灯', 'unplot:消灯', 'toggle:反転'].forEach(s => {
  const [name, text] = s.split(':');
  def('mb_' + name, function() {
    line(this, [text + ' x', ['X', 'Number'], 'y', ['Y', 'Number']]);
    stmt(this, C.led);
    this.setTooltip('x（横）・y（縦）とも 0〜4');
  });
});

def('mb_point', function() {
  line(this, ['LED x', ['X', 'Number'], 'y', ['Y', 'Number'], 'が点灯している']);
  value(this, C.led, 'Boolean');
});

def('mb_plot_brightness', function() {
  line(this, ['点灯 x', ['X', 'Number'], 'y', ['Y', 'Number'], '明るさ', ['B', 'Number']]);
  stmt(this, C.led);
  this.setTooltip('明るさは 0〜255（micro:bit の中では 0〜9 の 10 段階になります）');
});

def('mb_led_enable', function() {
  this.appendDummyInput().appendField('LED表示を有効にする')
    .appendField(dd([['真','on'],['偽','off']]), 'ON');
  stmt(this, C.led);
  this.setTooltip('偽にすると LED 表示が止まり、P3・P4 などの端子を自由に使えます');
});

// ================================================================ 無線

def('mb_radio_group', function() {
  line(this, ['無線のグループを設定', ['N', 'Number']]);
  stmt(this, C.radio);
  this.setTooltip('同じグループ（0〜255）の micro:bit どうしだけで送り合えます');
});

def('mb_radio_send_number', function() {
  line(this, ['無線で数値を送信', ['VALUE', 'Number']]);
  stmt(this, C.radio);
});

def('mb_radio_send_string', function() {
  line(this, ['無線で文字列を送信', ['VALUE']]);
  stmt(this, C.radio);
});

def('mb_on_radio', function() {
  this.appendDummyInput().appendField('無線で受信したとき');
  hat(this, C.radio);
  this.setTooltip('届いた中身は「受信した文字列」「受信した数値」で使えます。' +
                  'MakeCode で作った micro:bit とは送り方が違うので、PycoBlocks どうしで使ってください');
});

def('mb_received_string', function() {
  this.appendDummyInput().appendField('受信した文字列');
  value(this, C.radio, 'String');
});

def('mb_received_number', function() {
  this.appendDummyInput().appendField('受信した数値');
  value(this, C.radio, 'Number');
  this.setTooltip('数として読めないときは 0');
});

def('mb_radio_power', function() {
  line(this, ['無線の送信強度を設定', ['N', 'Number']]);
  stmt(this, C.radio);
  this.setTooltip('0〜7。大きいほど遠くまで届きます');
});

// ================================================================ ループ

def('mb_every', function() {
  line(this, [['MS', 'Number'], 'ミリ秒ごとに']);
  hat(this, C.loops);
});

// ================================================================ 入出力端子

function pinField(block, text, pins) {
  block.appendDummyInput().appendField(text).appendField(dd(pins || DIGITAL_PINS), 'PIN');
}

def('mb_digital_read', function() {
  pinField(this, 'デジタルで読み取る 端子');
  value(this, C.pins, 'Number');
});

def('mb_digital_write', function() {
  pinField(this, 'デジタルで出力する 端子');
  line(this, ['値', ['VALUE', 'Number']]);
  stmt(this, C.pins);
  this.setTooltip('0 か 1');
});

def('mb_analog_read', function() {
  pinField(this, 'アナログ値を読み取る 端子', ANALOG_PINS);
  value(this, C.pins, 'Number');
  this.setTooltip('0〜1023');
});

def('mb_analog_write', function() {
  pinField(this, 'アナログで出力する 端子');
  line(this, ['値', ['VALUE', 'Number']]);
  stmt(this, C.pins);
  this.setTooltip('0〜1023（PWM）。LED の明るさを変えるときなどに使います');
});

def('mb_analog_period', function() {
  pinField(this, 'アナログ出力 パルス周期を設定する 端子');
  line(this, ['周期（マイクロ秒）', ['US', 'Number']]);
  stmt(this, C.pins);
});

def('mb_servo_write', function() {
  pinField(this, 'サーボ 出力する 端子');
  line(this, ['角度', ['DEG', 'Number']]);
  stmt(this, C.pins);
  this.setTooltip('0〜180 度');
});

def('mb_servo_pulse', function() {
  pinField(this, 'サーボ 設定する 端子');
  line(this, ['パルス幅（マイクロ秒）', ['US', 'Number']]);
  stmt(this, C.pins);
  this.setTooltip('多くのサーボは 500〜2500');
});

def('mb_set_pull', function() {
  pinField(this, '端子');
  this.appendDummyInput().appendField('を')
    .appendField(dd([['プルアップ','PULL_UP'],['プルダウン','PULL_DOWN'],['なし','NO_PULL']]), 'PULL')
    .appendField('する');
  stmt(this, C.pins);
});

def('mb_pulse_in', function() {
  pinField(this, 'パルスの長さを測る（マイクロ秒） 端子');
  this.appendDummyInput().appendField('パルス').appendField(dd([['正パルス','1'],['負パルス','0']]), 'LEVEL');
  value(this, C.pins, 'Number');
  this.setTooltip('待ちきれなかったときは負の数になります');
});

// ================================================================ シリアル通信

def('mb_serial_line', function() {
  line(this, ['シリアル通信 1行書き出す', ['TEXT']]);
  stmt(this, C.serial);
});

def('mb_serial_number', function() {
  line(this, ['シリアル通信 数値を文字で書き出す', ['NUM', 'Number']]);
  stmt(this, C.serial);
});

def('mb_serial_value', function() {
  line(this, ['シリアル通信 名前と数値を書き出す', ['NAME'], '=', ['NUM', 'Number']]);
  stmt(this, C.serial);
  this.setTooltip('「名前:数値」の形で 1 行書き出します。センサーモニターのグラフにも出ます');
});

def('mb_serial_string', function() {
  line(this, ['シリアル通信 文字列を書き出す', ['TEXT']]);
  stmt(this, C.serial);
});

// ================================================================ コード生成
// app.js の valueBlockToCode / blockToCode / blockLabel が、知らないブロックを
// ここへ回す。v は valueToCode(block, 入力名, 既定値)。

const f = (b, name) => b.getFieldValue(name);
const int = (b, v, name, dflt) => `int(${v(b, name, dflt)})`;
const btnNow = k => (k === 'ab' ? 'button_a.is_pressed() and button_b.is_pressed()' : `button_${k}.is_pressed()`);

const VALUE = {
  mb_button:          b => btnNow(f(b, 'BTN')),
  mb_pin_touched:     b => `${f(b, 'PIN')}.is_touched()`,
  mb_accel:           b => `accelerometer.${f(b, 'AXIS')}()`,
  mb_logo_touched:    () => 'pin_logo.is_touched()',
  mb_light:           () => 'display.read_light_level()',
  // MicroPython は nT で返すので µT にそろえる
  mb_magnetic:        b => `(compass.${f(b, 'AXIS')}() // 1000)`,
  mb_compass:         () => 'compass.heading()',
  mb_temperature:     () => 'temperature()',
  mb_sound_level:     () => 'microphone.sound_level()',
  mb_is_gesture:      b => `accelerometer.is_gesture('${f(b, 'G')}')`,
  mb_running_time:    () => 'running_time()',
  mb_tempo:           () => 'music.get_tempo()[1]',
  mb_point:           (b, v) => `(display.get_pixel(${int(b, v, 'X', '0')}, ${int(b, v, 'Y', '0')}) > 0)`,
  mb_received_string: () => 'received_string',
  mb_received_number: () => '_mb_num(received_string)',
  mb_digital_read:    b => `${f(b, 'PIN')}.read_digital()`,
  mb_analog_read:     b => `${f(b, 'PIN')}.read_analog()`,
  mb_pulse_in:        b => `machine.time_pulse_us(${f(b, 'PIN')}, ${f(b, 'LEVEL')})`,
};

function ledsImage(b) {
  const v = (f(b, 'LEDS') || '0'.repeat(25)).replace(/1/g, '9');
  return `Image('${[0, 5, 10, 15, 20].map(i => v.slice(i, i + 5)).join(':')}')`;
}

function xy(b, v) { return `${int(b, v, 'X', '0')}, ${int(b, v, 'Y', '0')}`; }

const STMT = {
  mb_show_number:   (b, v) => `display.scroll(${v(b, 'NUM', '0')})`,
  mb_show_leds:     b => `display.show(${ledsImage(b)})`,
  mb_show_icon:     b => `display.show(Image.${f(b, 'ICON')})`,
  mb_scroll:        (b, v) => `display.scroll(str(${v(b, 'TEXT', '""')}))`,
  mb_clear:         () => 'display.clear()',
  mb_pause:         (b, v) => `sleep(${v(b, 'MS', '100')})`,
  mb_show_arrow:    b => `display.show(Image.ARROW_${f(b, 'DIR')})`,

  mb_set_sound_threshold: (b, v) => `microphone.set_threshold(SoundEvent.${f(b, 'EV')}, ${int(b, v, 'N', '128')})`,
  mb_calibrate:     () => 'compass.calibrate()',

  mb_play_tone:     (b, v) => `music.pitch(${int(b, v, 'FREQ', '262')}, ${int(b, v, 'MS', '500')})`,
  mb_ring_tone:     (b, v) => `music.pitch(${int(b, v, 'FREQ', '262')}, -1, wait=False)`,
  mb_rest:          (b, v) => `sleep(${v(b, 'MS', '500')})`,
  mb_music_play:    b => {
    const m = f(b, 'MODE');
    const opt = m === 'once' ? 'wait=True' : m === 'bg' ? 'wait=False' : 'wait=False, loop=True';
    return `music.play(music.${f(b, 'TUNE')}, ${opt})`;
  },
  mb_sound_effect:  b => `audio.play(Sound.${f(b, 'SOUND')}, wait=${f(b, 'WAIT')})`,
  mb_set_tempo:     (b, v) => `music.set_tempo(bpm=${int(b, v, 'N', '120')})`,
  mb_change_tempo:  (b, v) => `music.set_tempo(bpm=music.get_tempo()[1] + ${int(b, v, 'N', '20')})`,
  mb_set_volume:    (b, v) => `set_volume(${int(b, v, 'N', '128')})`,
  mb_stop_all:      () => 'music.stop(); audio.stop()',
  mb_speaker:       b => `speaker.${f(b, 'ON')}()`,

  mb_plot:          (b, v) => `display.set_pixel(${xy(b, v)}, 9)`,
  mb_unplot:        (b, v) => `display.set_pixel(${xy(b, v)}, 0)`,
  mb_toggle:        (b, v) => `display.set_pixel(${xy(b, v)}, 0 if display.get_pixel(${xy(b, v)}) else 9)`,
  mb_plot_brightness: (b, v) => `display.set_pixel(${xy(b, v)}, round(${v(b, 'B', '255')} * 9 / 255))`,
  mb_led_enable:    b => `display.${f(b, 'ON')}()`,

  mb_radio_group:   (b, v) => `radio.config(group=${int(b, v, 'N', '1')})`,
  mb_radio_send_number: (b, v) => `radio.send(str(${v(b, 'VALUE', '0')}))`,
  mb_radio_send_string: (b, v) => `radio.send(str(${v(b, 'VALUE', '""')}))`,
  mb_radio_power:   (b, v) => `radio.config(power=${int(b, v, 'N', '6')})`,

  mb_digital_write: (b, v) => `${f(b, 'PIN')}.write_digital(${int(b, v, 'VALUE', '0')})`,
  mb_analog_write:  (b, v) => `${f(b, 'PIN')}.write_analog(${int(b, v, 'VALUE', '1023')})`,
  mb_analog_period: (b, v) => `${f(b, 'PIN')}.set_analog_period_microseconds(${int(b, v, 'US', '20000')})`,
  // 周期 20ms のうち 0.5〜2.5ms を High にする（write_analog の 1023 が 20ms）
  mb_servo_write:   (b, v) => `${f(b, 'PIN')}.set_analog_period(20); ${f(b, 'PIN')}.write_analog(int(25.6 + 102.4 * ${v(b, 'DEG', '90')} / 180))`,
  mb_servo_pulse:   (b, v) => `${f(b, 'PIN')}.set_analog_period(20); ${f(b, 'PIN')}.write_analog(int(${v(b, 'US', '1500')} * 1023 / 20000))`,
  mb_set_pull:      b => `${f(b, 'PIN')}.set_pull(${f(b, 'PIN')}.${f(b, 'PULL')})`,

  mb_serial_line:   (b, v) => `print(${v(b, 'TEXT', '""')})`,
  mb_serial_number: (b, v) => `print(${v(b, 'NUM', '0')}, end='')`,
  mb_serial_value:  (b, v) => `print(str(${v(b, 'NAME', '"x"')}) + ':' + str(${v(b, 'NUM', '0')}))`,
  mb_serial_string: (b, v) => `print(${v(b, 'TEXT', '""')}, end='')`,
};

// ---------------------------------------------------------------- イベント
// head：中身の前に置く行（中身は nest なら 1 段下げる）
// init：while True: の前に 1 回だけ置く行
// n は while True: の中での通し番号（タイマーの変数名や、_mb_edge の前回値を分けるのに使う。
// 同じロゴで「タッチされた」「無くなった」を両方置いても、前回値を取り合わないように）

const HAT = {
  mb_on_start:       () => ({ loop: false, head: [], nest: false }),
  mb_forever:        () => ({ loop: true, head: [], nest: false }),
  mb_on_button:      (b, v, n) => {
    const k = f(b, 'BTN');
    // A+B は was_pressed では「同時に」を判定できないので、両方押された瞬間を自分で見る
    const cond = k === 'ab' ? `_mb_edge(${n}, ${btnNow('ab')})` : `button_${k}.was_pressed()`;
    return { loop: true, head: [`if ${cond}:`], nest: true };
  },
  mb_on_gesture:     b => ({ loop: true, head: [`if accelerometer.was_gesture('${f(b, 'G')}'):`], nest: true }),
  mb_on_pin_pressed: (b, v, n) => ({ loop: true, head: [`if _mb_edge(${n}, ${f(b, 'PIN')}.is_touched(), False):`], nest: true }),
  mb_on_logo:        (b, v, n) => ({ loop: true, nest: true,
    head: [`if _mb_edge(${n}, pin_logo.is_touched()${f(b, 'ACT') === 'release' ? ', False' : ''}):`] }),
  mb_on_sound:       b => ({ loop: true, head: [`if microphone.was_event(SoundEvent.${f(b, 'EV')}):`], nest: true }),
  mb_on_radio:       () => ({ loop: true, nest: true,
    head: ['received_string = radio.receive()', 'if received_string is not None:'] }),
  mb_every:          (b, v, n) => ({ loop: true, nest: true,
    init: [`_mb_t${n} = running_time()`],
    head: [`if running_time() - _mb_t${n} >= ${v(b, 'MS', '500')}:`, `    _mb_t${n} = running_time()`] }),
};

const HAT_LABEL = {
  mb_on_start: '最初だけ', mb_forever: 'ずっと', mb_on_radio: '無線で受信したとき',
};

const MUSIC_TYPES = ['mb_play_tone', 'mb_ring_tone', 'mb_music_play', 'mb_set_tempo', 'mb_change_tempo',
  'mb_tempo', 'mb_stop_all'];
const RADIO_TYPES = ['mb_radio_group', 'mb_radio_send_number', 'mb_radio_send_string', 'mb_radio_power',
  'mb_on_radio', 'mb_received_string', 'mb_received_number'];
const EDGE_TYPES = ['mb_on_button', 'mb_on_pin_pressed', 'mb_on_logo'];

// 生成コードの先頭。blockTypes はワークスペースにあるブロックの種類（Set）
function header(blockTypes, showComments) {
  const c = s => (showComments ? `# ${s}\n` : '');
  const has = list => list.some(t => blockTypes.has(t));
  let h = c('micro:bit の LED 表示・ボタン・センサー・端子') + 'from microbit import *\n' +
          c('時間待機用（MicroPython版 time モジュール）') + 'import utime\n';
  if (has(MUSIC_TYPES)) h += c('音を鳴らす') + 'import music\n';
  if (has(RADIO_TYPES)) h += c('無線（micro:bit どうしで送り合う）') + 'import radio\n';
  if (blockTypes.has('mb_pulse_in')) h += c('パルスの長さを測る') + 'import machine\n';
  if (blockTypes.has('py_random_int')) h += c('乱数生成用') + 'import random\n';
  // 無線は電源を入れないと送れない・受け取れない。グループを決めなければ 0 番
  if (has(RADIO_TYPES)) h += '\nradio.on()\nreceived_string = ""\n';
  if (blockTypes.has('mb_received_number')) {
    h += '\n' + c('受信した文字を数にする（読めないときは 0）') +
      'def _mb_num(s):\n' +
      '    try:\n' +
      '        return float(s) if "." in s else int(s)\n' +
      '    except (ValueError, TypeError):\n' +
      '        return 0\n';
  }
  if (has(EDGE_TYPES)) {
    h += '\n' + c('押した・離した「瞬間」を見分ける（前の周の状態と比べる）') +
      '_mb_prev = {}\n' +
      'def _mb_edge(key, now, rising=True):\n' +
      '    before = _mb_prev.get(key, False)\n' +
      '    _mb_prev[key] = now\n' +
      '    return (now and not before) if rising else (before and not now)\n';
  }
  return h + '\n';
}

// マウスを乗せたときの説明。各 def() の中で付けていないブロックの分をここにまとめた
// （説明が無いと、はじめての子は「何をするブロックか」を試すしかない）。
// 小学生も読むので、むずかしい漢字と用語はさける。
const TIPS = {
  mb_show_icon: 'えらんだ絵（アイコン）を LED 画面に出します',
  mb_clear: 'LED 画面を全部消します',
  mb_show_arrow: 'えらんだ向きの矢印を LED 画面に出します',
  mb_on_button: 'ボタンを押したときに、中のブロックを動かします',
  mb_on_gesture: 'micro:bit をゆさぶる・かたむけるなど、えらんだ動きをしたときに、中のブロックを動かします',
  mb_on_logo: '表の金色のロゴにさわったとき（または指をはなしたとき）に、中のブロックを動かします',
  mb_on_sound: 'まわりの音が大きくなったとき（または小さくなったとき）に、中のブロックを動かします',
  mb_button: 'ボタンを押している間は「はい（True）」になります。「もし」と組み合わせて使います',
  mb_pin_touched: '端子に指でさわっている間は「はい（True）」になります（GND にもさわると反応しやすい）',
  mb_logo_touched: 'ロゴにさわっている間は「はい（True）」になります',
  mb_is_gesture: 'いま、えらんだ動き（上向き・ゆさぶるなど）をしていれば「はい（True）」になります',
  mb_calibrate: 'コンパス（方角）を使う前の調整です。LED の指示にしたがって micro:bit を回します',
  mb_magnetic: '磁石の力の強さです。磁石を近づけると数が大きくなります（単位は µT）',
  mb_running_time: '電源を入れてから何ミリ秒たったかです（1000 ミリ秒 = 1 秒）',
  mb_rest: '音を鳴らさずに、決めた時間だけ休みます（1000 ミリ秒 = 1 秒）',
  mb_music_play: 'えらんだメロディを鳴らします。「終わるまで」だと鳴りおわるまで次のブロックに進みません',
  mb_sound_effect: 'えらんだ効果音を鳴らします（V2 の内蔵スピーカー）',
  mb_set_tempo: '曲の速さを決めます。数が大きいほど速くなります（bpm = 1 分間の拍の数）',
  mb_change_tempo: '曲の速さを、いまより決めた数だけ速くします（マイナスにすると遅く）',
  mb_tempo: 'いまの曲の速さ（bpm）です',
  mb_stop_all: '鳴っている音を全部止めます',
  mb_speaker: '内蔵スピーカーを使うかどうかを決めます。オフにすると端子 P0 だけから音が出ます',
  mb_point: 'その位置の LED がついていれば「はい（True）」になります。x は横、y はたて（0〜4）',
  mb_radio_send_number: '数を無線で送ります。同じグループの micro:bit が受け取れます',
  mb_radio_send_string: '文字を無線で送ります。同じグループの micro:bit が受け取れます',
  mb_received_string: '無線で受け取った文字です。「無線で受信したとき」の中で使います',
  mb_every: '決めた時間ごとに、中のブロックを動かします（1000 ミリ秒 = 1 秒）',
  mb_digital_read: '端子に電気が来ているとき 1、来ていないとき 0 になります',
  mb_analog_period: 'アナログ出力のパルスの周期を決めます（サーボなどを動かすとき）',
  mb_set_pull: '何もつないでいないときの端子の状態を決めます（スイッチをつなぐときに使います）',
  mb_serial_line: '文字を 1 行、パソコンへ送ります。シリアルモニタに出ます',
  mb_serial_number: '数をパソコンへ送ります。シリアルモニタに出ます（グラフでも見られます）',
  mb_serial_string: '文字をパソコンへ送ります。シリアルモニタに出ます',
};
Object.keys(TIPS).forEach(type => {
  const blk = Blockly.Blocks[type];
  if (!blk) return;
  const init = blk.init;
  blk.init = function() {
    init.call(this);
    if (!this.tooltip) this.setTooltip(TIPS[type]);
  };
});

window.PycoMicrobit = {
  header,
  hasValue: t => Object.prototype.hasOwnProperty.call(VALUE, t),
  hasStmt:  t => Object.prototype.hasOwnProperty.call(STMT, t),
  isHat:    t => Object.prototype.hasOwnProperty.call(HAT, t),
  isLoopHat: t => Object.prototype.hasOwnProperty.call(HAT, t) && t !== 'mb_on_start',
  value: (b, v) => VALUE[b.type](b, v),
  stmt:  (b, v) => STMT[b.type](b, v),
  hat:   (b, v, n) => Object.assign({ init: [] }, HAT[b.type](b, v, n || 0)),
  // コメント行に使う短い説明。ブロックに見えている文字をそのまま使う
  label: b => {
    if (!/^mb_/.test(b.type)) return null;
    if (HAT_LABEL[b.type]) return HAT_LABEL[b.type];
    if (b.type === 'mb_show_leds') return 'LED画面に表示';
    const s = b.inputList.map(inp => inp.fieldRow.map(fd => fd.getText()).join(' ')).join(' ');
    return s.replace(/\s+/g, ' ').trim();
  },
};
})();
