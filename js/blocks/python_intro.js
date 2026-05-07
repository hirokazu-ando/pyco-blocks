// =====================================================
// Python入門モード専用ブロック定義
// =====================================================

(() => {
const P = window.PycoPalette;

// キーボード入力ブロック
// テキスト:    var = input("prompt")
// 数値(整数):  var = int(input("prompt"))
// 数値(小数):  var = float(input("prompt"))
Blockly.Blocks['py_input'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('キーボード入力 (')
      .appendField(new Blockly.FieldDropdown([
        ['テキスト',    'str'],
        ['数値（整数）', 'int'],
        ['数値（小数）', 'float'],
      ]), 'TYPE')
      .appendField(') を')
      .appendField(new Blockly.FieldVariable('x'), 'VAR')
      .appendField('に入れる');
    this.appendDummyInput()
      .appendField('  案内文:')
      .appendField(new Blockly.FieldTextInput('入力してください'), 'PROMPT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.ioKeyboard);
    this.setTooltip('input() でキーボードから値を受け取ります。\n数値を受け取る場合は int() や float() で変換されます。');
    this.setHelpUrl('');
  }
};

// ===== 文字列値ブロック =====
Blockly.Blocks['val_str'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('"')
      .appendField(new Blockly.FieldTextInput('Hello'), 'TEXT')
      .appendField('"');
    this.setOutput(true, null);
    this.setColour(P.literals);
    this.setTooltip('文字列の値を表します');
    this.setHelpUrl('');
  }
};

// ===== 真偽値ブロック =====
Blockly.Blocks['val_bool'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['True（真）', 'True'],
        ['False（偽）', 'False'],
      ]), 'BOOL');
    this.setOutput(true, 'Boolean');
    this.setColour(P.literals);
    this.setTooltip('True（真）またはFalse（偽）の値を表します');
    this.setHelpUrl('');
  }
};

// ===== 算術演算ブロック =====
Blockly.Blocks['py_math_op'] = {
  init: function() {
    this.appendValueInput('LEFT').setCheck(null);
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['+（足し算）', '+'],
        ['-（引き算）', '-'],
        ['×（掛け算）', '*'],
        ['÷（割り算）', '/'],
        ['//（整数除算）', '//'],
        ['%（余り）', '%'],
        ['**（べき乗）', '**'],
      ]), 'OP');
    this.appendValueInput('RIGHT').setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('算術演算を行います');
    this.setHelpUrl('');
  }
};

// ===== 文字列連結ブロック =====
Blockly.Blocks['py_str_concat'] = {
  init: function() {
    this.appendValueInput('A').setCheck(null);
    this.appendDummyInput().appendField('と');
    this.appendValueInput('B').setCheck(null);
    this.appendDummyInput().appendField('をつなげる');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('str() で文字列に変換してから連結します');
    this.setHelpUrl('');
  }
};

// ===== while ループブロック =====
Blockly.Blocks['py_while'] = {
  init: function() {
    this.appendValueInput('COND')
      .setCheck('Boolean')
      .appendField('ずっと');
    this.appendDummyInput().appendField('の間 繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.loops);
    this.setTooltip('条件が True の間、中の処理を繰り返します');
    this.setHelpUrl('');
  }
};

// ===== 汎用 print ブロック（値ブロックを受け取る） =====
Blockly.Blocks['py_print'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('を表示する');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.display);
    this.setTooltip('変数・数値・文字列など何でも表示できます');
    this.setHelpUrl('');
  }
};

// =====================================================
// リスト（list）ブロック
// =====================================================

Blockly.Blocks['py_list_empty'] = {
  init: function() {
    this.appendDummyInput().appendField('空のリスト [ ]');
    this.setOutput(true, null);
    this.setColour(P.lists);
    this.setTooltip('空のリスト [] を返します');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_list_append'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST');
    this.appendDummyInput().appendField('に');
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('を追加する');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.lists);
    this.setTooltip('リストの末尾に値を追加します（append）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_list_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST');
    this.appendDummyInput().appendField('の');
    this.appendValueInput('INDEX').setCheck('Number');
    this.appendDummyInput().appendField('番目');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.lists);
    this.setTooltip('リストのi番目の要素を取得します（0始まり）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_list_set'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST');
    this.appendDummyInput().appendField('の');
    this.appendValueInput('INDEX').setCheck('Number');
    this.appendDummyInput().appendField('番目を');
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('にする');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.lists);
    this.setTooltip('リストのi番目の要素を変更します');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_list_contains'] = {
  init: function() {
    this.appendValueInput('ITEM').setCheck(null);
    this.appendDummyInput()
      .appendField('が リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('に含まれる');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setColour(P.lists);
    this.setTooltip('値がリストに含まれているか調べます（item in list）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_list_len'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST');
    this.appendDummyInput().appendField('の長さ');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.lists);
    this.setTooltip('リストの要素数を返します（len）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_for_list'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('item'), 'VAR');
    this.appendDummyInput().appendField('← リスト');
    this.appendDummyInput()
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST');
    this.appendDummyInput().appendField('を順に繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.loops);
    this.setTooltip('リストの要素を1つずつ取り出して繰り返します（for item in list）');
    this.setHelpUrl('');
  }
};

// =====================================================
// ループ制御
// =====================================================

Blockly.Blocks['py_break'] = {
  init: function() {
    this.appendDummyInput().appendField('ループを抜ける（break）');
    this.setPreviousStatement(true, null);
    this.setNextStatement(false, null);
    this.setColour(P.loops);
    this.setTooltip('ループを即座に終了します（break）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_continue'] = {
  init: function() {
    this.appendDummyInput().appendField('次のループへ（continue）');
    this.setPreviousStatement(true, null);
    this.setNextStatement(false, null);
    this.setColour(P.loops);
    this.setTooltip('残りの処理を飛ばして次の繰り返しへ進みます（continue）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 関数（function）ブロック
// =====================================================

Blockly.Blocks['py_def_noarg'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('関数')
      .appendField(new Blockly.FieldTextInput('my_func'), 'NAME')
      .appendField('を定義する');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.functions);
    this.setTooltip('引数なしの関数を定義します（def name():）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_def'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('関数')
      .appendField(new Blockly.FieldTextInput('my_func'), 'NAME')
      .appendField('（引数:')
      .appendField(new Blockly.FieldVariable('x'), 'PARAM')
      .appendField('）を定義する');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.functions);
    this.setTooltip('引数1つの関数を定義します（def name(param):）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_def_args2'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('関数')
      .appendField(new Blockly.FieldTextInput('my_func'), 'NAME')
      .appendField('（引数:')
      .appendField(new Blockly.FieldTextInput('a'), 'PARAM1')
      .appendField(',')
      .appendField(new Blockly.FieldTextInput('b'), 'PARAM2')
      .appendField('）を定義する');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.functions);
    this.setTooltip('引数2つの関数を定義します（def name(a, b):）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_def_args3'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('関数')
      .appendField(new Blockly.FieldTextInput('my_func'), 'NAME')
      .appendField('（引数:')
      .appendField(new Blockly.FieldTextInput('a'), 'PARAM1')
      .appendField(',')
      .appendField(new Blockly.FieldTextInput('b'), 'PARAM2')
      .appendField(',')
      .appendField(new Blockly.FieldTextInput('c'), 'PARAM3')
      .appendField('）を定義する');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.functions);
    this.setTooltip('引数3つの関数を定義します（def name(a, b, c):）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_return'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('を返す（return）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(false, null);
    this.setColour(P.functions);
    this.setTooltip('値を返して関数を終了します（return）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_call_stmt'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('関数')
      .appendField(new Blockly.FieldTextInput('my_func'), 'NAME')
      .appendField('を呼び出す（引数:');
    this.appendValueInput('ARG').setCheck(null);
    this.appendDummyInput().appendField('）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.functions);
    this.setTooltip('関数を呼び出します。引数不要なら何もつなげないでください');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_call_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('関数')
      .appendField(new Blockly.FieldTextInput('my_func'), 'NAME')
      .appendField('（引数:');
    this.appendValueInput('ARG').setCheck(null);
    this.appendDummyInput().appendField('）の結果');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.functions);
    this.setTooltip('関数の戻り値を取得します');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_call_val2'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('関数')
      .appendField(new Blockly.FieldTextInput('my_func'), 'NAME')
      .appendField('（引数1:');
    this.appendValueInput('ARG1').setCheck(null);
    this.appendDummyInput().appendField(',  引数2:');
    this.appendValueInput('ARG2').setCheck(null);
    this.appendDummyInput().appendField('）の結果');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.functions);
    this.setTooltip('2つの引数を渡して関数を呼び出し、戻り値を取得します');
    this.setHelpUrl('');
  }
};

// ===== 自作モジュール呼び出しブロック（文） =====
function _moduleOptions() {
  if (typeof window.getPyModuleOptions === 'function') return window.getPyModuleOptions();
  return [['（読込中）', '__none__']];
}

function _funcOptions() {
  const block = this.getSourceBlock ? this.getSourceBlock() : this.sourceBlock_;
  const mod = block ? block.getFieldValue('MODULE') : '__none__';
  if (typeof window.getPyModuleFunctions === 'function') return window.getPyModuleFunctions(mod);
  return [['（読込中）', '__none__']];
}

Blockly.Blocks['py_module_call_stmt'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('モジュール')
      .appendField(new Blockly.FieldDropdown(_moduleOptions), 'MODULE')
      .appendField('の関数')
      .appendField(new Blockly.FieldDropdown(_funcOptions), 'FUNC')
      .appendField('を呼び出す（引数:');
    this.appendValueInput('ARG').setCheck(null);
    this.appendDummyInput().appendField('）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.modules);
    this.setTooltip('モジュールを選んでから関数をプルダウンで選択してください。');
    this.setHelpUrl('');
  }
};

// ===== 自作モジュール呼び出しブロック（値） =====
Blockly.Blocks['py_module_call_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('モジュール')
      .appendField(new Blockly.FieldDropdown(_moduleOptions), 'MODULE')
      .appendField('の関数')
      .appendField(new Blockly.FieldDropdown(_funcOptions), 'FUNC')
      .appendField('（引数:');
    this.appendValueInput('ARG').setCheck(null);
    this.appendDummyInput().appendField('）の結果');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.modules);
    this.setTooltip('モジュールを選んでから関数をプルダウンで選択してください。');
    this.setHelpUrl('');
  }
};

// =====================================================
// クラスブロック（0-16）
// =====================================================

Blockly.Blocks['py_class_def'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('クラス')
      .appendField(new Blockly.FieldTextInput('MyClass'), 'NAME')
      .appendField('を定義する');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.classes);
    this.setTooltip('クラスを定義します（class Name:）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_class_init'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('初期化（self, 引数:')
      .appendField(new Blockly.FieldVariable('name'), 'PARAM')
      .appendField('）');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.classes);
    this.setTooltip('__init__メソッドを定義します（引数1つ）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_class_init2'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('初期化（self, 引数:')
      .appendField(new Blockly.FieldVariable('width'), 'PARAM1')
      .appendField(',')
      .appendField(new Blockly.FieldVariable('height'), 'PARAM2')
      .appendField('）');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.classes);
    this.setTooltip('__init__メソッドを定義します（引数2つ）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_class_method'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('メソッド')
      .appendField(new Blockly.FieldTextInput('greet'), 'NAME')
      .appendField('（引数なし）');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.classes);
    this.setTooltip('selfのみのメソッドを定義します（def name(self):）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_class_method1'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('メソッド')
      .appendField(new Blockly.FieldTextInput('my_method'), 'NAME')
      .appendField('（引数:')
      .appendField(new Blockly.FieldVariable('param'), 'PARAM')
      .appendField('）');
    this.appendStatementInput('BODY').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.classes);
    this.setTooltip('引数1つのメソッドを定義します（def name(self, param):）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_self_set'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('self.')
      .appendField(new Blockly.FieldTextInput('attr'), 'ATTR')
      .appendField('に');
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('を入れる');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.classes);
    this.setTooltip('self の属性に値を代入します（self.attr = value）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_self_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('self.')
      .appendField(new Blockly.FieldTextInput('attr'), 'ATTR');
    this.setOutput(true, null);
    this.setColour(P.classes);
    this.setTooltip('self の属性を取得します（self.attr）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_new_instance'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('クラス')
      .appendField(new Blockly.FieldTextInput('MyClass'), 'NAME')
      .appendField('（引数:');
    this.appendValueInput('ARG').setCheck(null);
    this.appendDummyInput().appendField('）で作る');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.classes);
    this.setTooltip('クラスのインスタンスを作ります（ClassName(arg)）。引数不要なら空欄のままにしてください');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_method_call_stmt'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldVariable('obj'), 'INST')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('method'), 'METHOD')
      .appendField('（引数:');
    this.appendValueInput('ARG').setCheck(null);
    this.appendDummyInput().appendField('）を呼ぶ');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.classes);
    this.setTooltip('メソッドを呼び出します（obj.method(arg)）。引数不要なら空欄のままにしてください');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_attr_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldVariable('obj'), 'INST')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('attr'), 'ATTR');
    this.setOutput(true, null);
    this.setColour(P.classes);
    this.setTooltip('インスタンスの属性を取得します（obj.attr）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 例外処理ブロック（0-17）
// =====================================================

const EX_TYPES = [
  ['エラー全般（Exception）', 'Exception'],
  ['ValueError',          'ValueError'],
  ['ZeroDivisionError',   'ZeroDivisionError'],
  ['TypeError',           'TypeError'],
  ['IndexError',          'IndexError'],
  ['KeyError',            'KeyError'],
];

Blockly.Blocks['py_try_except'] = {
  init: function() {
    this.appendDummyInput().appendField('試す：');
    this.appendStatementInput('BODY').setCheck(null);
    this.appendDummyInput()
      .appendField('エラー（')
      .appendField(new Blockly.FieldDropdown(EX_TYPES), 'ETYPE')
      .appendField('）のとき：');
    this.appendStatementInput('HANDLER').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.exceptions);
    this.setTooltip('try/except：エラーが起きたときの処理を書きます（try: ... except ExcType:）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_try_except_as'] = {
  init: function() {
    this.appendDummyInput().appendField('試す：');
    this.appendStatementInput('BODY').setCheck(null);
    this.appendDummyInput()
      .appendField('エラーを')
      .appendField(new Blockly.FieldVariable('e'), 'EVAR')
      .appendField('として受け取る：');
    this.appendStatementInput('HANDLER').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.exceptions);
    this.setTooltip('try/except Exception as e：エラーの内容を変数に受け取ります（try: ... except Exception as e:）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_raise'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('エラーを発生させる（')
      .appendField(new Blockly.FieldDropdown([
        ['ValueError',   'ValueError'],
        ['TypeError',    'TypeError'],
        ['Exception',    'Exception'],
      ]), 'ETYPE')
      .appendField('：');
    this.appendValueInput('MSG').setCheck(null);
    this.appendDummyInput().appendField('）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.exceptions);
    this.setTooltip('raise：意図的にエラーを発生させます（raise ExcType("msg")）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 計算追加ブロック
// =====================================================

Blockly.Blocks['py_random_int'] = {
  init: function() {
    this.appendValueInput('FROM').setCheck('Number');
    this.appendDummyInput().appendField('以上');
    this.appendValueInput('TO').setCheck('Number');
    this.appendDummyInput().appendField('以下のランダムな整数');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.math);
    this.setTooltip('ランダムな整数を返します（random.randint(a, b)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_type_cast'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput()
      .appendField('を')
      .appendField(new Blockly.FieldDropdown([
        ['整数（int）',  'int'],
        ['小数（float）', 'float'],
        ['文字列（str）', 'str'],
      ]), 'TYPE')
      .appendField('に変換');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('値を指定した型に変換します（int/float/str）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_type_of'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('type(')
      .appendField(new Blockly.FieldVariable('x'), 'VAR')
      .appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('変数の型を調べます（type(var)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_abs'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck('Number');
    this.appendDummyInput().appendField('の絶対値');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.math);
    this.setTooltip('絶対値を返します（abs）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_round'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck('Number');
    this.appendDummyInput().appendField('を小数点');
    this.appendValueInput('DIGITS').setCheck('Number');
    this.appendDummyInput().appendField('桁に丸める');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.math);
    this.setTooltip('指定した桁数で四捨五入します（round）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_int'] = {
  init: function() {
    this.appendDummyInput().appendField('整数化');
    this.appendValueInput('VALUE').setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.math);
    this.setTooltip('値を整数に変換します（int）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_min2'] = {
  init: function() {
    this.appendDummyInput().appendField('小さい方');
    this.appendValueInput('A').setCheck(null);
    this.appendDummyInput().appendField('と');
    this.appendValueInput('B').setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.math);
    this.setTooltip('2つの値のうち小さい方を返します（min）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_max2'] = {
  init: function() {
    this.appendDummyInput().appendField('大きい方');
    this.appendValueInput('A').setCheck(null);
    this.appendDummyInput().appendField('と');
    this.appendValueInput('B').setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.math);
    this.setTooltip('2つの値のうち大きい方を返します（max）');
    this.setHelpUrl('');
  }
};

// =====================================================
// f文字列ブロック
// =====================================================

Blockly.Blocks['py_fstring'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('f"')
      .appendField(new Blockly.FieldTextInput('こんにちは、'), 'PRE')
      .appendField('{');
    this.appendValueInput('VAR').setCheck(null);
    this.appendDummyInput()
      .appendField('}')
      .appendField(new Blockly.FieldTextInput('さん'), 'POST')
      .appendField('"');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.literals);
    this.setTooltip('f文字列：変数を埋め込んだ文字列を作ります（例: f"こんにちは、{name}さん"）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_fstring_fmt'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('f"')
      .appendField(new Blockly.FieldTextInput(''), 'PRE')
      .appendField('{');
    this.appendValueInput('VAR').setCheck(null);
    this.appendDummyInput()
      .appendField(':')
      .appendField(new Blockly.FieldTextInput('.1f'), 'FMT')
      .appendField('}"');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.literals);
    this.setTooltip('f文字列：式にフォーマット指定を付けて埋め込みます（例: f"平均: {val:.1f}"）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_fstring2_expr'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('f"')
      .appendField(new Blockly.FieldTextInput(''), 'PRE')
      .appendField('{');
    this.appendValueInput('VAR1').setCheck(null);
    this.appendDummyInput()
      .appendField('}')
      .appendField(new Blockly.FieldTextInput('の点数: '), 'MID')
      .appendField('{');
    this.appendValueInput('VAR2').setCheck(null);
    this.appendDummyInput()
      .appendField('}')
      .appendField(new Blockly.FieldTextInput(''), 'POST')
      .appendField('"');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.literals);
    this.setTooltip('f文字列：2つの式を埋め込んだ文字列を作ります（例: f"{name}の点数: {score}"）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 辞書（dict）ブロック
// =====================================================

Blockly.Blocks['py_dict_new'] = {
  init: function() {
    this.appendDummyInput().appendField('空の辞書 { }');
    this.setOutput(true, null);
    this.setColour(P.dict);
    this.setTooltip('空の辞書 {} を返します。var_set ブロックと組み合わせて変数に入れてください。');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_dict_set'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('辞書')
      .appendField(new Blockly.FieldVariable('my_dict'), 'DICT')
      .appendField('の');
    this.appendValueInput('KEY').setCheck(null);
    this.appendDummyInput().appendField('に');
    this.appendValueInput('VAL').setCheck(null);
    this.appendDummyInput().appendField('を入れる');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.dict);
    this.setTooltip('辞書のキーに値をセットします（dict[key] = value）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_dict_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('辞書')
      .appendField(new Blockly.FieldVariable('my_dict'), 'DICT')
      .appendField('の');
    this.appendValueInput('KEY').setCheck(null);
    this.appendDummyInput().appendField('の値');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.dict);
    this.setTooltip('辞書からキーに対応する値を取得します（dict[key]）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_dict_get_default'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('辞書')
      .appendField(new Blockly.FieldVariable('my_dict'), 'DICT')
      .appendField('の');
    this.appendValueInput('KEY').setCheck(null);
    this.appendDummyInput().appendField('の値（なければ');
    this.appendValueInput('DEFAULT').setCheck(null);
    this.appendDummyInput().appendField('）');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.dict);
    this.setTooltip('辞書.get(キー, デフォルト値) を返します。キーがなければデフォルト値を返します。');
  }
};

Blockly.Blocks['py_for_dict_items_sorted'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('辞書')
      .appendField(new Blockly.FieldVariable('my_dict'), 'DICT')
      .appendField('を');
    this.appendDummyInput()
      .appendField('ソートして')
      .appendField(new Blockly.FieldVariable('key'), 'KEY_VAR')
      .appendField(',')
      .appendField(new Blockly.FieldVariable('value'), 'VAL_VAR')
      .appendField('に取り出す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.loops);
    this.setTooltip('辞書のキーと値をソートして順に取り出します（for k, v in sorted(dict.items())）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_dict_keys'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('辞書')
      .appendField(new Blockly.FieldVariable('my_dict'), 'DICT')
      .appendField('のキー一覧');
    this.setOutput(true, null);
    this.setColour(P.dict);
    this.setTooltip('辞書のキーをリストとして返します（list(dict.keys())）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_dict_literal'] = {
  itemCount_: 2,

  init: function() {
    const countField = new Blockly.FieldDropdown([
      ['1件', '1'], ['2件', '2'], ['3件', '3'], ['4件', '4']
    ]);
    this.appendDummyInput('TOP')
      .appendField('辞書 {')
      .appendField(countField, 'COUNT');
    this.rebuildShape_();
    this.setOutput(true, null);
    this.setColour(P.dict);
    this.setTooltip('辞書リテラルを作ります（例: {"name": "Taro", "age": 16}）。キーと値のペアを1〜4個設定できます。');
    this.setHelpUrl('');
    // init 完了後にバリデーターを設定（init 中の早期発火を防ぐ）
    countField.setValidator(this.onCountChanged_.bind(this));
  },

  onCountChanged_: function(val) {
    this.itemCount_ = parseInt(val, 10);
    this.rebuildShape_();
  },

  mutationToDom: function() {
    const el = document.createElement('mutation');
    el.setAttribute('items', this.itemCount_);
    return el;
  },

  domToMutation: function(xmlElement) {
    const n = parseInt(xmlElement.getAttribute('items'), 10);
    if (!isNaN(n)) this.itemCount_ = n;
    // setValue の前に rebuildShape_ を呼んでから件数表示を同期する（バリデーター経由の二重実行を防ぐ）
    this.rebuildShape_();
    const f = this.getField('COUNT');
    if (f) {
      const saved = f.getValidator ? f.getValidator() : null;
      if (saved) f.setValidator(null);
      f.setValue(String(this.itemCount_));
      if (saved) f.setValidator(saved);
    }
  },

  rebuildShape_: function() {
    let i = 0;
    while (this.getInput('PAIR' + i)) {
      this.removeInput('PAIR' + i);
      i++;
    }
    if (this.getInput('BOTTOM')) this.removeInput('BOTTOM');
    for (let j = 0; j < this.itemCount_; j++) {
      this.appendValueInput('PAIR' + j)
        .appendField('  キー')
        .appendField(new Blockly.FieldTextInput('key' + (j + 1)), 'KEY' + j)
        .appendField('値');
    }
    this.appendDummyInput('BOTTOM').appendField('}');
  }
};


// =====================================================
// 0-19: タプル・セット
// =====================================================

Blockly.Blocks['py_tuple_literal'] = {
  itemCount_: 2,
  init: function() {
    const countField = new Blockly.FieldDropdown([
      ['1個', '1'], ['2個', '2'], ['3個', '3'], ['4個', '4'], ['5個', '5']
    ]);
    this.appendDummyInput('TOP')
      .appendField('タプル (')
      .appendField(countField, 'COUNT');
    this.rebuildShape_();
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('変更できないデータの並び（タプル）を作ります');
    this.setHelpUrl('');
    countField.setValidator(this.onCountChanged_.bind(this));
  },
  onCountChanged_: function(val) {
    this.itemCount_ = parseInt(val, 10);
    this.rebuildShape_();
  },
  mutationToDom: function() {
    const el = document.createElement('mutation');
    el.setAttribute('items', this.itemCount_);
    return el;
  },
  domToMutation: function(xmlElement) {
    const n = parseInt(xmlElement.getAttribute('items'), 10);
    if (!isNaN(n)) this.itemCount_ = n;
    this.rebuildShape_();
    const f = this.getField('COUNT');
    if (f) {
      const saved = f.getValidator ? f.getValidator() : null;
      if (saved) f.setValidator(null);
      f.setValue(String(this.itemCount_));
      if (saved) f.setValidator(saved);
    }
  },
  rebuildShape_: function() {
    let i = 0;
    while (this.getInput('ITEM' + i)) { this.removeInput('ITEM' + i); i++; }
    if (this.getInput('BOTTOM')) this.removeInput('BOTTOM');
    for (let j = 0; j < this.itemCount_; j++) {
      this.appendValueInput('ITEM' + j)
        .appendField(j === 0 ? '' : ',');
    }
    this.appendDummyInput('BOTTOM').appendField(')');
  }
};

Blockly.Blocks['py_set_literal'] = {
  itemCount_: 2,
  init: function() {
    const countField = new Blockly.FieldDropdown([
      ['1個', '1'], ['2個', '2'], ['3個', '3'], ['4個', '4'], ['5個', '5']
    ]);
    this.appendDummyInput('TOP')
      .appendField('セット {')
      .appendField(countField, 'COUNT');
    this.rebuildShape_();
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('重複なし・順序なしのデータの集まり（セット）を作ります');
    this.setHelpUrl('');
    countField.setValidator(this.onCountChanged_.bind(this));
  },
  onCountChanged_: function(val) {
    this.itemCount_ = parseInt(val, 10);
    this.rebuildShape_();
  },
  mutationToDom: function() {
    const el = document.createElement('mutation');
    el.setAttribute('items', this.itemCount_);
    return el;
  },
  domToMutation: function(xmlElement) {
    const n = parseInt(xmlElement.getAttribute('items'), 10);
    if (!isNaN(n)) this.itemCount_ = n;
    this.rebuildShape_();
    const f = this.getField('COUNT');
    if (f) {
      const saved = f.getValidator ? f.getValidator() : null;
      if (saved) f.setValidator(null);
      f.setValue(String(this.itemCount_));
      if (saved) f.setValidator(saved);
    }
  },
  rebuildShape_: function() {
    let i = 0;
    while (this.getInput('ITEM' + i)) { this.removeInput('ITEM' + i); i++; }
    if (this.getInput('BOTTOM')) this.removeInput('BOTTOM');
    for (let j = 0; j < this.itemCount_; j++) {
      this.appendValueInput('ITEM' + j)
        .appendField(j === 0 ? '' : ',');
    }
    this.appendDummyInput('BOTTOM').appendField('}');
  }
};

Blockly.Blocks['py_set_add'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('セット')
      .appendField(new Blockly.FieldVariable('my_set'), 'SET');
    this.appendValueInput('VALUE').setCheck(null).appendField('に');
    this.appendDummyInput().appendField('を追加する');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.tuples);
    this.setTooltip('セットに要素を追加します（set.add(x)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_set_discard'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('セット')
      .appendField(new Blockly.FieldVariable('my_set'), 'SET');
    this.appendValueInput('VALUE').setCheck(null).appendField('から');
    this.appendDummyInput().appendField('を削除する');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.tuples);
    this.setTooltip('セットから要素を削除します（set.discard(x)）。要素がなくてもエラーになりません。');
    this.setHelpUrl('');
  }
};

// =====================================================
// 0-20: リスト内包表記
// =====================================================

Blockly.Blocks['py_list_comp'] = {
  init: function() {
    this.appendDummyInput().appendField('[');
    this.appendValueInput('EXPR').setCheck(null);
    this.appendDummyInput()
      .appendField('for')
      .appendField(new Blockly.FieldVariable('x'), 'VAR')
      .appendField('in');
    this.appendValueInput('LIST').setCheck(null);
    this.appendDummyInput().appendField(']');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.lists);
    this.setTooltip('[式 for 変数 in リスト] の形でリストを作ります（リスト内包表記）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_list_comp_if'] = {
  init: function() {
    this.appendDummyInput().appendField('[');
    this.appendValueInput('EXPR').setCheck(null);
    this.appendDummyInput()
      .appendField('for')
      .appendField(new Blockly.FieldVariable('x'), 'VAR')
      .appendField('in');
    this.appendValueInput('LIST').setCheck(null);
    this.appendDummyInput().appendField('if');
    this.appendValueInput('COND').setCheck(null);
    this.appendDummyInput().appendField(']');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.lists);
    this.setTooltip('[式 for 変数 in リスト if 条件] の形でリストを絞り込みながら作ります');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_ternary'] = {
  init: function() {
    this.appendValueInput('THEN').setCheck(null);
    this.appendDummyInput().appendField('if');
    this.appendValueInput('COND').setCheck(null);
    this.appendDummyInput().appendField('else');
    this.appendValueInput('ELSE').setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.literals);
    this.setTooltip('条件式: 条件が真なら THEN、偽なら ELSE の値を返します（値 if 条件 else 値）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_dict_comp'] = {
  init: function() {
    this.appendDummyInput().appendField('{');
    this.appendValueInput('KEY').setCheck(null);
    this.appendDummyInput().appendField(':');
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput()
      .appendField('for')
      .appendField(new Blockly.FieldVariable('k'), 'VAR')
      .appendField('in');
    this.appendValueInput('LIST').setCheck(null);
    this.appendDummyInput().appendField('}');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.dict);
    this.setTooltip('{キー: 値 for 変数 in リスト} の形で辞書を作ります（辞書内包表記）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_set_comp'] = {
  init: function() {
    this.appendDummyInput().appendField('{');
    this.appendValueInput('EXPR').setCheck(null);
    this.appendDummyInput()
      .appendField('for')
      .appendField(new Blockly.FieldVariable('x'), 'VAR')
      .appendField('in');
    this.appendValueInput('LIST').setCheck(null);
    this.appendDummyInput().appendField('}');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('{式 for 変数 in リスト} の形でセットを作ります（セット内包表記）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 0-21: 組み込み関数
// =====================================================

Blockly.Blocks['py_enumerate_for'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('番号')
      .appendField(new Blockly.FieldVariable('i'), 'IDX')
      .appendField('と値')
      .appendField(new Blockly.FieldVariable('v'), 'VAL')
      .appendField('で');
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('を順に繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.builtins);
    this.setTooltip('enumerate() で番号と値を同時に取り出しながら繰り返します（for i, v in enumerate(list)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_zip_for'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('a'), 'VAR_A')
      .appendField('と')
      .appendField(new Blockly.FieldVariable('b'), 'VAR_B')
      .appendField('で');
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('list1'), 'LIST_A')
      .appendField('と')
      .appendField(new Blockly.FieldVariable('list2'), 'LIST_B')
      .appendField('を同時に繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.builtins);
    this.setTooltip('zip() で2つのリストを同時に繰り返します（for a, b in zip(list1, list2)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_sorted_call'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('を')
      .appendField(new Blockly.FieldDropdown([['昇順', 'False'], ['降順', 'True']]), 'REVERSE')
      .appendField('に並び替え');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('sorted() でリストを並び替えた新しいリストを返します（元のリストは変わりません）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_sorted_key_func'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('を')
      .appendField(new Blockly.FieldDropdown([
        ['文字数（len）順', 'len'],
        ['文字列（str）順', 'str'],
        ['整数値（int）順', 'int'],
        ['絶対値（abs）順', 'abs'],
      ]), 'KEY')
      .appendField('に並び替え');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('sorted(list, key=func) でリストをキー関数の順に並び替えます');
  }
};

Blockly.Blocks['py_sorted_dict_two_keys'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('辞書リスト')
      .appendField(new Blockly.FieldVariable('students'), 'LIST');
    this.appendDummyInput()
      .appendField('をキー1「')
      .appendField(new Blockly.FieldTextInput('key1'), 'KEY1')
      .appendField('」')
      .appendField(new Blockly.FieldDropdown([['昇順', 'asc'], ['降順', 'desc']]), 'REV1');
    this.appendDummyInput()
      .appendField('キー2「')
      .appendField(new Blockly.FieldTextInput('key2'), 'KEY2')
      .appendField('」')
      .appendField(new Blockly.FieldDropdown([['昇順', 'asc'], ['降順（数値）', 'desc']]), 'REV2');
    this.appendDummyInput().appendField('でソート');
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('辞書リストを2つのキーでソートします。キー2の降順は数値のみ有効です。');
  }
};

Blockly.Blocks['py_dict_val_literal'] = {
  init: function() {
    this.appendDummyInput().appendField('{');
    this.appendValueInput('KEY0').setCheck(null);
    this.appendValueInput('VAL0').setCheck(null).appendField(':');
    this.appendDummyInput().appendField(',');
    this.appendValueInput('KEY1').setCheck(null);
    this.appendValueInput('VAL1').setCheck(null).appendField(':');
    this.appendDummyInput().appendField('}');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.dict);
    this.setTooltip('キーに任意の値（frozensetなど）を使った辞書を作ります（{キー: 値, キー: 値}）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_frozenset'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck(null)
      .appendField('frozenset(');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('変更不可のセット（frozenset）を作ります（frozenset(値)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_sorted_tuple_idx'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('students'), 'LIST')
      .appendField('の')
      .appendField(new Blockly.FieldNumber(1, 0, 10, 1), 'IDX')
      .appendField('番目の要素で')
      .appendField(new Blockly.FieldDropdown([
        ['昇順', 'False'],
        ['降順', 'True'],
      ]), 'REV')
      .appendField('ソート');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('タプルのリストをN番目の要素でソートします（sorted(list, key=lambda x: x[N], reverse=...)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_print_multi'] = {
  itemCount_: 2,
  init: function() {
    this.setColour(P.display);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('複数の値をスペース区切りで表示します（print(a, b, ...)）');
    this.rebuildShape_();
  },
  rebuildShape_: function() {
    let i = 0;
    while (this.getInput('ITEM' + i)) { this.removeInput('ITEM' + i); i++; }
    if (this.getInput('BOTTOM')) this.removeInput('BOTTOM');
    if (!this.getInput('TOP')) {
      this.appendDummyInput('TOP').appendField('表示（複数）');
    }
    for (let j = 0; j < this.itemCount_; j++) {
      this.appendValueInput('ITEM' + j).appendField(j === 0 ? '' : ',');
    }
    this.appendDummyInput('BOTTOM')
      .appendField(new Blockly.FieldImage(_LIST_PLUS,  16, 16, '+', () => { this.itemCount_++; this.rebuildShape_(); }))
      .appendField(new Blockly.FieldImage(_LIST_MINUS, 16, 16, '-', () => { if (this.itemCount_ > 1) { this.itemCount_--; this.rebuildShape_(); } }));
    this.setInputsInline(true);
  },
  mutationToDom: function() {
    const el = document.createElement('mutation');
    el.setAttribute('items', this.itemCount_);
    return el;
  },
  domToMutation: function(xmlElement) {
    const n = parseInt(xmlElement.getAttribute('items'), 10);
    if (!isNaN(n)) this.itemCount_ = n;
    this.rebuildShape_();
  }
};

Blockly.Blocks['py_min_call'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('の最小値');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('min() でリストの中の最小値を返します');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_max_call'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('の最大値');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('max() でリストの中の最大値を返します');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_sum_call'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('の合計');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('sum() でリストの全要素の合計を返します');
    this.setHelpUrl('');
  }
};

// =====================================================
// 0-18: 文字列メソッド
// =====================================================

Blockly.Blocks['py_str_split'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('を')
      .appendField(new Blockly.FieldTextInput(','), 'SEP')
      .appendField('で分割（空欄=空白）');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('文字列を区切り文字で分割してリストにします（str.split()）。区切り文字を空欄にすると空白で分割します。');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_str_strip'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('の前後の空白を取り除く');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('文字列の先頭と末尾の空白を取り除きます（str.strip()）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_str_replace'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('の')
      .appendField(new Blockly.FieldTextInput('old'), 'OLD')
      .appendField('を')
      .appendField(new Blockly.FieldTextInput('new'), 'NEW')
      .appendField('に置換');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('文字列中の特定の文字列を別の文字列に置き換えます（str.replace()）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_str_find'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('の中で')
      .appendField(new Blockly.FieldTextInput('keyword'), 'SUB')
      .appendField('を探す');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('文字列中で部分文字列を検索し、最初の位置（インデックス）を返します。見つからなければ -1 を返します（str.find()）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 0-21: 組み込み関数（追加）
// =====================================================

Blockly.Blocks['py_enumerate_start_for'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('番号（')
      .appendField(new Blockly.FieldNumber(1, 0, 100), 'START')
      .appendField('から）')
      .appendField(new Blockly.FieldVariable('i'), 'IDX')
      .appendField('と値')
      .appendField(new Blockly.FieldVariable('v'), 'VAL')
      .appendField('で');
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('を順に繰り返す');
    this.appendStatementInput('DO').setCheck(null);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.builtins);
    this.setTooltip('enumerate() で番号と値を同時に取り出します。番号の開始値を指定できます（for i, v in enumerate(list, start=N)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_map_call'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('の各要素を')
      .appendField(new Blockly.FieldDropdown([
        ['整数（int）',  'int'],
        ['小数（float）', 'float'],
        ['文字列（str）', 'str'],
        ['絶対値（abs）', 'abs'],
      ]), 'TYPE')
      .appendField('に変換したリスト');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.builtins);
    this.setTooltip('リストの全要素を一括変換した新しいリストを返します（list(map(type, list))）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 0-19〜0-22: 追加ブロック（range / str_upper / tuple_unpack / print2 / set_op / sorted_set / fstring2）
// =====================================================

Blockly.Blocks['py_range'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('range(')
      .appendField(new Blockly.FieldNumber(0, -1000, 100000), 'START')
      .appendField(',')
      .appendField(new Blockly.FieldNumber(10, 1, 100000), 'STOP')
      .appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.loops);
    this.setTooltip('整数の連続（START から STOP-1 まで）を作ります（range(start, stop)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_list_range'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('0 から')
      .appendField(new Blockly.FieldNumber(10, 1, 1000000), 'N')
      .appendField('個の整数リスト');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.lists);
    this.setTooltip('0 から N-1 までの整数リストを作ります（list(range(N))）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_str_upper'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('を大文字に変換');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('文字列を全て大文字に変換します（str.upper()）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_tuple_unpack'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('x'), 'VAR_X')
      .appendField(',')
      .appendField(new Blockly.FieldVariable('y'), 'VAR_Y')
      .appendField('= タプル')
      .appendField(new Blockly.FieldVariable('point'), 'SRC');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.tuples);
    this.setTooltip('タプルの値を2つの変数に展開します（x, y = point）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_print2'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('x'), 'VAR_A')
      .appendField('と')
      .appendField(new Blockly.FieldVariable('y'), 'VAR_B')
      .appendField('を表示する');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.display);
    this.setTooltip('2つの変数を並べて表示します（print(a, b)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_set_op'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('セット')
      .appendField(new Blockly.FieldVariable('a'), 'SET_A')
      .appendField(new Blockly.FieldDropdown([
        ['| 和集合', '|'],
        ['& 積集合（共通）', '&'],
        ['- 差集合', '-'],
        ['^ 対称差', '^'],
      ]), 'OP')
      .appendField('セット')
      .appendField(new Blockly.FieldVariable('b'), 'SET_B');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('2つのセットに対して集合演算を行います（| 和集合  & 積集合  - 差集合  ^ 対称差）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_list_dedup'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('scores'), 'LIST')
      .appendField('の重複を除く');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('リストから重複を取り除いたリストを返します（順序は不定）（list(set(list))）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_sorted_set'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('nums'), 'LIST')
      .appendField('の重複を除いて昇順に並べる');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('重複を除いてから昇順に並べたリストを返します（sorted(set(list))）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_fstring2'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldTextInput(''), 'PRE')
      .appendField(new Blockly.FieldVariable('var1'), 'VAR1')
      .appendField(new Blockly.FieldTextInput(': '), 'MID')
      .appendField(new Blockly.FieldVariable('var2'), 'VAR2')
      .appendField(new Blockly.FieldTextInput(''), 'POST');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.literals);
    this.setTooltip('2つの変数を埋め込んだ文字列を作ります（f"{var1}...{var2}..."）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 0-18: 追加文字列メソッド（join / lstrip / rstrip / find_from）
// =====================================================

Blockly.Blocks['py_str_join'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldTextInput(','), 'SEP')
      .appendField('でリスト')
      .appendField(new Blockly.FieldVariable('my_list'), 'LIST')
      .appendField('を結合');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('区切り文字でリストの要素を結合して文字列にします（sep.join(list)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_str_lstrip'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('の左端の空白を取り除く');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('文字列の左端（先頭）の空白を取り除きます（str.lstrip()）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_str_rstrip'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('の右端の空白を取り除く');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('文字列の右端（末尾）の空白を取り除きます（str.rstrip()）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_str_find_from'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('の中で')
      .appendField(new Blockly.FieldTextInput('keyword'), 'SUB')
      .appendField('を')
      .appendField(new Blockly.FieldNumber(1, 0, 1000), 'START')
      .appendField('文字目から探す');
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('指定した位置から文字列を検索します（str.find(sub, start)）');
    this.setHelpUrl('');
  }
};

// =====================================================
// リストリテラル（＋／－ボタンで要素を増減）
// =====================================================
const _LIST_PLUS = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
  '<circle cx="8" cy="8" r="7.5" fill="#4CAF50"/>' +
  '<text x="8" y="12.5" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="white">+</text>' +
  '</svg>'
);
const _LIST_MINUS = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
  '<circle cx="8" cy="8" r="7.5" fill="#F44336"/>' +
  '<text x="8" y="12.5" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="white">−</text>' +
  '</svg>'
);

const _LIST_VERT = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
  '<circle cx="8" cy="8" r="7.5" fill="#5C6BC0"/>' +
  '<text x="8" y="12" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="white">↕</text>' +
  '</svg>'
);

Blockly.Blocks['py_list_literal'] = {
  itemCount_: 2,
  vertical_: false,
  init: function() {
    this.setColour(P.lists);
    this.setOutput(true, null);
    this.setTooltip('リストを作ります。＋で要素を追加、－で削除、↕で縦/横の並びを切り替えられます。');
    this.setHelpUrl('');
    this.rebuildShape_();
  },
  rebuildShape_: function() {
    let i = 0;
    while (this.getInput('ITEM' + i)) { this.removeInput('ITEM' + i); i++; }
    if (this.getInput('BOTTOM')) this.removeInput('BOTTOM');
    if (this.getInput('TOP')) this.removeInput('TOP');
    this.appendDummyInput('TOP').appendField('リスト [');
    for (let j = 0; j < this.itemCount_; j++) {
      this.appendValueInput('ITEM' + j)
        .appendField(j === 0 ? '' : ',');
    }
    this.appendDummyInput('BOTTOM')
      .appendField(']')
      .appendField(new Blockly.FieldImage(_LIST_PLUS,  16, 16, '+', () => { this.itemCount_++; this.rebuildShape_(); }))
      .appendField(new Blockly.FieldImage(_LIST_MINUS, 16, 16, '-', () => { if (this.itemCount_ > 0) { this.itemCount_--; this.rebuildShape_(); } }))
      .appendField(new Blockly.FieldImage(_LIST_VERT,  16, 16, '↕', () => { this.vertical_ = !this.vertical_; this.rebuildShape_(); }));
    this.setInputsInline(!this.vertical_);
  },
  mutationToDom: function() {
    const el = document.createElement('mutation');
    el.setAttribute('items', this.itemCount_);
    if (this.vertical_) el.setAttribute('vertical', 'true');
    return el;
  },
  domToMutation: function(xmlElement) {
    const n = parseInt(xmlElement.getAttribute('items'), 10);
    if (!isNaN(n)) this.itemCount_ = n;
    this.vertical_ = xmlElement.getAttribute('vertical') === 'true';
    this.rebuildShape_();
  }
};

// =====================================================
// 0-19〜0-22: 追加ブロック（range / str_upper / tuple_unpack / print2 / set_op / sorted_set / fstring2）
// =====================================================

Blockly.Blocks['py_range'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('range(')
      .appendField(new Blockly.FieldNumber(0, -1000, 10000), 'START')
      .appendField(',')
      .appendField(new Blockly.FieldNumber(10, 1, 100000), 'STOP')
      .appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.loops);
    this.setTooltip('整数の連続（START から STOP-1 まで）を作ります（range(start, stop)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_str_upper'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('文字列')
      .appendField(new Blockly.FieldVariable('text'), 'VAR')
      .appendField('を大文字に変換');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.math);
    this.setTooltip('文字列を全て大文字に変換します（str.upper()）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_tuple_unpack'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('x'), 'VAR_X')
      .appendField(',')
      .appendField(new Blockly.FieldVariable('y'), 'VAR_Y')
      .appendField('= タプル')
      .appendField(new Blockly.FieldVariable('point'), 'SRC');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.tuples);
    this.setTooltip('タプルの値を2つの変数に展開します（x, y = point）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_print2'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('変数')
      .appendField(new Blockly.FieldVariable('x'), 'VAR_A')
      .appendField('と')
      .appendField(new Blockly.FieldVariable('y'), 'VAR_B')
      .appendField('を表示する');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.display);
    this.setTooltip('2つの変数を並べて表示します（print(a, b)）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_set_op'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('セット')
      .appendField(new Blockly.FieldVariable('a'), 'SET_A')
      .appendField(new Blockly.FieldDropdown([
        ['| 和集合', '|'],
        ['& 積集合（共通）', '&'],
        ['- 差集合', '-'],
        ['^ 対称差', '^'],
      ]), 'OP')
      .appendField('セット')
      .appendField(new Blockly.FieldVariable('b'), 'SET_B');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('2つのセットに対して集合演算を行います（|和集合 &積集合 -差集合 ^対称差）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_sorted_set'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('nums'), 'LIST')
      .appendField('の重複を除いて昇順に並べる');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('重複を除いてから昇順に並べたリストを返します（sorted(set(list))）');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['py_fstring2'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldTextInput(''), 'PRE')
      .appendField(new Blockly.FieldVariable('var1'), 'VAR1')
      .appendField(new Blockly.FieldTextInput(': '), 'MID')
      .appendField(new Blockly.FieldVariable('var2'), 'VAR2')
      .appendField(new Blockly.FieldTextInput(''), 'POST');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.literals);
    this.setTooltip('2つの変数を埋め込んだ文字列を作ります（f"{var1}...{var2}..."）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 0-23〜0-28: アルゴリズム編追加ブロック
// =====================================================

Blockly.Blocks['py_list_pop'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('data'), 'LIST')
      .appendField('の末尾を取り出す（pop）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.lists);
    this.setTooltip('リストの末尾要素を削除します（list.pop()）');
    this.setHelpUrl('');
  }
};

// =====================================================
// 0-29: アルゴリズムまとめ演習 追加ブロック
// =====================================================

// 空のセット set()
Blockly.Blocks['py_set_empty'] = {
  init: function() {
    this.appendDummyInput().appendField('空のセット set()');
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('要素のないセットを作ります（set()）。{} は辞書になるので set() を使います。');
    this.setHelpUrl('');
  }
};

// import 文
Blockly.Blocks['py_import_module'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('モジュール')
      .appendField(new Blockly.FieldTextInput('bisect'), 'MODULE')
      .appendField('を読み込む（import）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.modules);
    this.setTooltip('標準ライブラリなどのモジュールを読み込みます（import モジュール名）');
    this.setHelpUrl('');
  }
};

// import モジュール as エイリアス 文
Blockly.Blocks['py_import_as'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('モジュール')
      .appendField(new Blockly.FieldTextInput('game_funcs'), 'MODULE')
      .appendField('を別名')
      .appendField(new Blockly.FieldTextInput('gf'), 'ALIAS')
      .appendField('で読み込む（import as）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.modules);
    this.setTooltip('モジュールに短い別名を付けて読み込みます（import モジュール名 as エイリアス）');
    this.setHelpUrl('');
  }
};

// from モジュール import 名前 文
Blockly.Blocks['py_from_import'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('モジュール')
      .appendField(new Blockly.FieldTextInput('collections'), 'MODULE')
      .appendField('から')
      .appendField(new Blockly.FieldTextInput('deque'), 'NAMES')
      .appendField('を読み込む（from import）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.modules);
    this.setTooltip('モジュール内の特定の名前を読み込みます（from モジュール import 名前）');
    this.setHelpUrl('');
  }
};

// bisect.bisect_left
Blockly.Blocks['py_bisect_left'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('整列済みリスト')
      .appendField(new Blockly.FieldVariable('data'), 'LIST')
      .appendField('で値');
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('が入る左端の位置（bisect_left）');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.lists);
    this.setTooltip('整列済みリストで、値以上が始まる左端のインデックスを返します（bisect.bisect_left）。事前に import bisect が必要です。');
    this.setHelpUrl('');
  }
};

// bisect.bisect_right
Blockly.Blocks['py_bisect_right'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('整列済みリスト')
      .appendField(new Blockly.FieldVariable('data'), 'LIST')
      .appendField('で値');
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('が入る右端の位置（bisect_right）');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(P.lists);
    this.setTooltip('整列済みリストで、値より大きい要素が始まるインデックスを返します（bisect.bisect_right）。事前に import bisect が必要です。');
    this.setHelpUrl('');
  }
};

// str.isdigit()
Blockly.Blocks['py_str_isdigit'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('が数字だけか（isdigit）');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setColour(P.math);
    this.setTooltip('文字列が数字のみで構成されているか調べます（str.isdigit()）');
    this.setHelpUrl('');
  }
};

// list slice list[start:stop]
Blockly.Blocks['py_list_slice'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('data'), 'LIST')
      .appendField('の');
    this.appendValueInput('START').setCheck(null);
    this.appendDummyInput().appendField('〜');
    this.appendValueInput('STOP').setCheck(null);
    this.appendDummyInput().appendField('の範囲を取り出す（slice）');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.lists);
    this.setTooltip('リストの一部分を取り出します（list[start:stop]）。空欄にすると先頭または末尾になります。');
    this.setHelpUrl('');
  }
};

// list[-1] last element
Blockly.Blocks['py_list_get_negative'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('data'), 'LIST')
      .appendField('の末尾から')
      .appendField(new Blockly.FieldNumber(1, 1, 1000, 1), 'OFFSET')
      .appendField('番目');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.lists);
    this.setTooltip('リストの末尾から数えた要素を取得します（list[-n]）。1なら最後の要素です。');
    this.setHelpUrl('');
  }
};

// 3-arg function call
Blockly.Blocks['py_call_val3'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('関数')
      .appendField(new Blockly.FieldTextInput('my_func'), 'NAME')
      .appendField('（引数1:');
    this.appendValueInput('ARG1').setCheck(null);
    this.appendDummyInput().appendField(',  引数2:');
    this.appendValueInput('ARG2').setCheck(null);
    this.appendDummyInput().appendField(',  引数3:');
    this.appendValueInput('ARG3').setCheck(null);
    this.appendDummyInput().appendField('）の結果');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.functions);
    this.setTooltip('3つの引数を渡して関数を呼び出し、戻り値を取得します');
    this.setHelpUrl('');
  }
};

// 3-variable f-string
Blockly.Blocks['py_fstring3'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('f"')
      .appendField(new Blockly.FieldTextInput(''), 'PRE')
      .appendField('{');
    this.appendValueInput('VAR1').setCheck(null);
    this.appendDummyInput()
      .appendField('}')
      .appendField(new Blockly.FieldTextInput(''), 'MID1')
      .appendField('{');
    this.appendValueInput('VAR2').setCheck(null);
    this.appendDummyInput()
      .appendField('}')
      .appendField(new Blockly.FieldTextInput(''), 'MID2')
      .appendField('{');
    this.appendValueInput('VAR3').setCheck(null);
    this.appendDummyInput()
      .appendField('}')
      .appendField(new Blockly.FieldTextInput(''), 'POST')
      .appendField('"');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.literals);
    this.setTooltip('3つの式を埋め込んだ f文字列を作ります');
    this.setHelpUrl('');
  }
};

// deque(iterable)
Blockly.Blocks['py_deque_init'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck(null)
      .appendField('deque（両端キュー）');
    this.appendDummyInput().appendField('を作る');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('リストなどから両端キュー（deque）を作ります。事前に from collections import deque が必要です。');
    this.setHelpUrl('');
  }
};

// deque.popleft()
Blockly.Blocks['py_deque_popleft'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('deque')
      .appendField(new Blockly.FieldVariable('queue'), 'DEQUE')
      .appendField('の先頭を取り出す（popleft）');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.tuples);
    this.setTooltip('dequeの先頭要素を取り出して返します（deque.popleft()）');
    this.setHelpUrl('');
  }
};

// list.pop() value form (returns popped element)
Blockly.Blocks['py_list_pop_val'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('リスト')
      .appendField(new Blockly.FieldVariable('data'), 'LIST')
      .appendField('の末尾を取り出した値（pop）');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(P.lists);
    this.setTooltip('リストの末尾要素を取り出して値を返します（list.pop()）');
    this.setHelpUrl('');
  }
};

// deque.append(x)
Blockly.Blocks['py_deque_append'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('deque')
      .appendField(new Blockly.FieldVariable('queue'), 'DEQUE')
      .appendField('の末尾に');
    this.appendValueInput('VALUE').setCheck(null);
    this.appendDummyInput().appendField('を追加（append）');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(P.tuples);
    this.setTooltip('dequeの末尾に要素を追加します（deque.append(x)）');
    this.setHelpUrl('');
  }
};

})();
