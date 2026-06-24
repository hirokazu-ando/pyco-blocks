// =====================================================
// やさしいAI ブロック定義（小中向け・自分で教えるAI）
// pyco_ai: use_camera / use_image / teach / learn / what / confidence
// Phase 1（骨組み）：ブロック定義。生成は app.js、shim は ai_engine.js。
// 既存 ml.js（高専向け pyco_ml）とは別モジュール（難易度を分離）。
// =====================================================

(() => {
'use strict';
const P = window.PycoPalette;

Blockly.Blocks['ai_import'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('やさしいAI を使う');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.ai);
    this.setTooltip('AI を使えるようにする（いちばん上に置く）  import pyco_ai');
  }
};

Blockly.Blocks['ai_use_camera'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('\u{1F4F7} カメラを使う');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.ai);
    this.setTooltip('webカメラの映像を AI に見せる');
  }
};

Blockly.Blocks['ai_use_image'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('\u{1F5BC}️ 画像を使う')
      .appendField(new Blockly.FieldDropdown([['サンプル', 'sample'], ['アップロード', 'upload']]), 'SRC');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.ai);
    this.setTooltip('画像を AI に見せる（カメラのかわり）');
  }
};

Blockly.Blocks['ai_teach'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('いま見えているものを「')
      .appendField(new Blockly.FieldTextInput('グー'), 'LABEL')
      .appendField('」としておぼえさせる');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.ai);
    this.setTooltip('お手本を見せて AI に教える（同じラベルで何回もくり返すとかしこくなる）');
  }
};

Blockly.Blocks['ai_learn'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('AI に学習させる');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.ai);
    this.setTooltip('おぼえさせたお手本で AI を学習させる');
  }
};

Blockly.Blocks['ai_what'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('いま見えているものは何？');
    this.setOutput(true, null);
    this.setColour(P.ai);
    this.setTooltip('AI が分類したラベル（文字）を返す');
  }
};

Blockly.Blocks['ai_confidence'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('どれくらい自信ある？');
    this.setOutput(true, null);
    this.setColour(P.ai);
    this.setTooltip('AI の自信（0.0〜1.0）を返す');
  }
};

})();
