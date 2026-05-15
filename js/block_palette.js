'use strict';

/**
 * PycoBlocks - Blockly block color palette.
 *
 * Notes:
 * - Blocks call `setColour()` using this table (window.PycoPalette).
 * - Category colours in `index.html` are kept in sync manually.
 */
window.PycoPalette = {
  display: '#00ACC1',
  variables: '#558B2F',
  math: '#FB8C00',
  literals: '#8E24AA',
  ioKeyboard: '#26A69A',
  gpioOutput:  '#EF5350',
  gpioInput:   '#00897B',
  gpioMotor:   '#F57C00',  // Part 3: サーボ・DCモーター・ステッピングモーター
  gpioDisplay: '#1565C0',  // Part 3: 7セグメント・LCD1602
  gpioSensor:  '#00897B',  // Part 3: 超音波・DHT11（gpioInput と同色）
  gpioPicoW:   '#3949AB',  // Part 3-14/15: Pico W 専用 LED/WiFi/HTTP（無印 Pico と視覚分離）
  logic: '#5E35B1',
  loops: '#F9A825',
  lists: '#689F38',
  dict: '#6D4C41',
  game: '#EC407A',           // 基本制御: init/loop/events/flip/fill/quit
  gameDraw: '#0288D1',       // 描画: draw_rect/circle/line/text/image, font_set, blit
  gameInput: '#26A69A',      // 入力: keys/mouse 系
  gamePhysics: '#FB8C00',    // 判定・物理: collide/rect_collidepoint/union/gravity
  gameTime: '#7E57C2',       // 時間: get_ticks/timer_set/timer_done
  gameCamera: '#5C6BC0',     // カメラ: camera_set/world_to_screen
  gameWorld: '#6D4C41',      // 地図: tilemap/grid_rotate
  gameAudio: '#26C6DA',      // 音: sound/music 系
  gameAsset: '#9CCC65',      // 値・プリセット (現在未使用)
  functions: '#FF7043',
  classes:     '#7B1FA2',
  exceptions:  '#D32F2F',
  tuples:   '#0288D1',
  builtins: '#00796B',
  modules: '#546E7A',
  chart:   '#1565C0',   // Part 2: matplotlib
  stats:   '#00695C',   // Part 2: statistics / csv
  ml:      '#283593',   // Part 6: 機械学習
  cv:      '#1B5E20',   // Part 5: 画像処理
  customPython: '#455A64',
  timing: '#2E7D32',
  polyvia: '#EF5350',
  sensorValue: '#EF5350',
  sensorStatement: '#EF5350',
};
