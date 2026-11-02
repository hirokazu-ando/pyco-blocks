(() => {
const P = window.PycoPalette;

// 各 elif/else ブランチの個別削除ボタン用 SVG（赤・16×16）
const MINUS_BRANCH = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" rx="3" fill="%23ef4444"/><text x="8" y="12" text-anchor="middle" font-size="14" fill="white" font-family="monospace">-</text></svg>';

Blockly.Blocks['pico_wait'] = {
  init: function() {
    this.appendValueInput('SEC').setCheck('Number');
    this.appendDummyInput().appendField('秒待つ');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.timing);
  }
};
Blockly.Blocks['pico_repeat'] = {
  init: function() {
    this.appendValueInput('TIMES').setCheck('Number');
    this.appendDummyInput().appendField('回繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.loops);
  }
};
Blockly.Blocks['pico_forever'] = {
  init: function() {
    this.appendDummyInput().appendField('ずっと繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setColour(P.loops);
  }
};

// ===== 複合 if ブロック（if / elif / else を+ボタンで追加） =====

Blockly.Blocks['pico_if_elseif'] = {
  init: function() {
    this.appendDummyInput().appendField('elif');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(P.logic);
    this.setTooltip('elif ブランチ');
  }
};

Blockly.Blocks['pico_if_else'] = {
  init: function() {
    this.appendDummyInput().appendField('else');
    this.setPreviousStatement(true);
    this.setColour(P.logic);
    this.setTooltip('else ブランチ');
  }
};

Blockly.Blocks['pico_if'] = {
  elseifCount_: 0,
  elseCount_: 0,

  init: function() {
    this.elseifCount_ = 0;
    this.elseCount_   = 0;

    this.appendValueInput('IF0')
      .setCheck('Boolean')
      .appendField('もし');
    this.appendDummyInput('IF0_LABEL').appendField('だったら');
    this.appendStatementInput('DO0').setCheck(null);
    this._addButtons();

    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.logic);
    this.setTooltip('条件に応じて処理を分岐します。+ボタンで else/elif を追加できます');
  },

  // + ボタン：まず else を追加し、else がある場合は elif を追加する
  _addBranch: function() {
    if (this.elseCount_ === 0) {
      this._addElse();
    } else {
      this._addElseIf();
    }
  },

  _addButtons: function() {
    if (this.getInput('BUTTONS')) this.removeInput('BUTTONS');
    this.appendDummyInput('BUTTONS')
      .appendField(new Blockly.FieldImage(
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" rx="4" fill="%23FF9800"/><text x="10" y="15" text-anchor="middle" font-size="16" fill="white" font-family="monospace">+</text></svg>',
        20, 20, '+', () => { this._addBranch(); }
      ))
      .appendField(new Blockly.FieldImage(
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" rx="4" fill="%23757575"/><text x="10" y="15" text-anchor="middle" font-size="16" fill="white" font-family="monospace">-</text></svg>',
        20, 20, '-', () => { this._removeLast(); }
      ));
  },

  _addElseIf: function() {
    const hasElse = this.elseCount_ > 0;
    if (hasElse) {
      this.removeInput('ELSE_LABEL');
      this.removeInput('ELSE');
    }
    this.removeInput('BUTTONS');

    this.elseifCount_++;
    const i = this.elseifCount_;
    this.appendValueInput('IF' + i)
      .setCheck('Boolean')
      .appendField('そうでなくもし');
    this.appendDummyInput('IF' + i + '_LABEL')
      .appendField('だったら ')
      .appendField(new Blockly.FieldImage(
        MINUS_BRANCH, 16, 16, '-',
        ((capturedI) => () => { this._removeElseIf(capturedI); })(i)
      ));
    this.appendStatementInput('DO' + i).setCheck(null);

    if (hasElse) {
      this.appendDummyInput('ELSE_LABEL')
        .appendField('そうでなければ ')
        .appendField(new Blockly.FieldImage(MINUS_BRANCH, 16, 16, '-', () => { this._removeElse(); }));
      this.appendStatementInput('ELSE').setCheck(null);
    }
    this._addButtons();
    this.initSvg && this.render();
  },

  _addElse: function() {
    if (this.elseCount_ > 0) return;
    this.removeInput('BUTTONS');
    this.elseCount_ = 1;
    this.appendDummyInput('ELSE_LABEL')
      .appendField('そうでなければ ')
      .appendField(new Blockly.FieldImage(MINUS_BRANCH, 16, 16, '-', () => { this._removeElse(); }));
    this.appendStatementInput('ELSE').setCheck(null);
    this._addButtons();
    this.initSvg && this.render();
  },

  // else ブランチを単独で削除
  _removeElse: function() {
    if (this.elseCount_ === 0) return;
    this.removeInput('ELSE');
    this.removeInput('ELSE_LABEL');
    this.elseCount_ = 0;
    this.removeInput('BUTTONS');
    this._addButtons();
    this.render && this.render();
  },

  // idx 番目の elif を削除して残りを詰め直す
  _removeElseIf: function(idx) {
    const total   = this.elseifCount_;
    const hasElse = this.elseCount_ > 0;

    // 全 elif インプットを逆順で削除（接続ブロックはワークスペースに切り離される）
    for (let j = total; j >= 1; j--) {
      if (this.getInput('DO' + j))            this.removeInput('DO' + j);
      if (this.getInput('IF' + j + '_LABEL')) this.removeInput('IF' + j + '_LABEL');
      if (this.getInput('IF' + j))            this.removeInput('IF' + j);
    }
    if (hasElse) {
      if (this.getInput('ELSE'))       this.removeInput('ELSE');
      if (this.getInput('ELSE_LABEL')) this.removeInput('ELSE_LABEL');
    }
    if (this.getInput('BUTTONS')) this.removeInput('BUTTONS');

    // idx を除いた elif を再構築
    this.elseifCount_ = 0;
    for (let j = 1; j <= total; j++) {
      if (j === idx) continue;
      this.elseifCount_++;
      const i = this.elseifCount_;
      this.appendValueInput('IF' + i).setCheck('Boolean').appendField('そうでなくもし');
      this.appendDummyInput('IF' + i + '_LABEL')
        .appendField('だったら ')
        .appendField(new Blockly.FieldImage(
          MINUS_BRANCH, 16, 16, '-',
          ((capturedI) => () => { this._removeElseIf(capturedI); })(i)
        ));
      this.appendStatementInput('DO' + i).setCheck(null);
    }

    if (hasElse) {
      this.appendDummyInput('ELSE_LABEL')
        .appendField('そうでなければ ')
        .appendField(new Blockly.FieldImage(MINUS_BRANCH, 16, 16, '-', () => { this._removeElse(); }));
      this.appendStatementInput('ELSE').setCheck(null);
    }

    this._addButtons();
    this.render && this.render();
  },

  _removeLast: function() {
    if (this.elseCount_ > 0) {
      this.removeInput('ELSE_LABEL');
      this.removeInput('ELSE');
      this.elseCount_ = 0;
    } else if (this.elseifCount_ > 0) {
      const i = this.elseifCount_;
      this.removeInput('IF' + i);
      this.removeInput('IF' + i + '_LABEL');
      this.removeInput('DO' + i);
      this.elseifCount_--;
    }
    this.removeInput('BUTTONS');
    this._addButtons();
    this.initSvg && this.render();
  },

  mutationToDom: function() {
    const container = document.createElement('mutation');
    container.setAttribute('elseif', this.elseifCount_);
    container.setAttribute('else', this.elseCount_);
    return container;
  },

  domToMutation: function(xmlElement) {
    const targetElseif = parseInt(xmlElement.getAttribute('elseif'), 10) || 0;
    const targetElse   = parseInt(xmlElement.getAttribute('else'),   10) || 0;
    this._rebuildShape(targetElseif, targetElse);
  },

  _rebuildShape: function(elseifCount, elseCount) {
    for (let i = 1; this.getInput('IF' + i); i++) {
      this.removeInput('IF' + i);
      if (this.getInput('IF' + i + '_LABEL')) this.removeInput('IF' + i + '_LABEL');
      this.removeInput('DO' + i);
    }
    if (this.getInput('ELSE_LABEL')) this.removeInput('ELSE_LABEL');
    if (this.getInput('ELSE'))       this.removeInput('ELSE');
    if (this.getInput('BUTTONS'))    this.removeInput('BUTTONS');

    this.elseifCount_ = 0;
    this.elseCount_   = 0;

    for (let j = 0; j < elseifCount; j++) {
      this.elseifCount_++;
      const idx = this.elseifCount_;
      this.appendValueInput('IF' + idx).setCheck('Boolean').appendField('そうでなくもし');
      this.appendDummyInput('IF' + idx + '_LABEL')
        .appendField('だったら ')
        .appendField(new Blockly.FieldImage(
          MINUS_BRANCH, 16, 16, '-',
          ((capturedIdx) => () => { this._removeElseIf(capturedIdx); })(idx)
        ));
      this.appendStatementInput('DO' + idx).setCheck(null);
    }
    if (elseCount > 0) {
      this.elseCount_ = 1;
      this.appendDummyInput('ELSE_LABEL')
        .appendField('そうでなければ ')
        .appendField(new Blockly.FieldImage(MINUS_BRANCH, 16, 16, '-', () => { this._removeElse(); }));
      this.appendStatementInput('ELSE').setCheck(null);
    }
    this._addButtons();
  }
};

// for range(N)
Blockly.Blocks['pico_for_range'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('i'), 'VAR')
      .appendField('を');
    this.appendValueInput('N').setCheck('Number');
    this.appendDummyInput().appendField('回繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.loops);
    this.setTooltip('指定した回数だけ繰り返します。変数に現在の回数(0始まり)が入ります');
  }
};

// for range(START, STOP, STEP)
Blockly.Blocks['pico_for_from_to'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('i'), 'VAR')
      .appendField('を');
    this.appendValueInput('START').setCheck('Number');
    this.appendDummyInput().appendField('から');
    this.appendValueInput('STOP').setCheck('Number');
    // range(start, stop) は stop を含まない。「まで」だと 10 も入ると読めてしまうので「の手前まで」と書く
    this.appendDummyInput().appendField('の手前まで');
    this.appendValueInput('STEP').setCheck('Number');
    this.appendDummyInput().appendField('ずつ繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.loops);
    this.setTooltip('はじめの数から、終わりの数の手前まで、決めた数ずつ増やしながら繰り返します。終わりの数は含みません（1〜10 にしたいときは「1 から 11 の手前まで」）');
  }
};

})();
