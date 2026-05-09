document.addEventListener('DOMContentLoaded', function() {

  // ===== 右クリックメニュー 日本語化 =====
  Object.assign(Blockly.Msg, {
    DUPLICATE_BLOCK:     'ブロックを複製',
    ADD_COMMENT:         'コメントを追加',
    REMOVE_COMMENT:      'コメントを削除',
    COLLAPSE_BLOCK:      '折りたたむ',
    EXPAND_BLOCK:        '展開する',
    DISABLE_BLOCK:       '無効にする',
    ENABLE_BLOCK:        '有効にする',
    DELETE_BLOCK:        'ブロックを削除',
    DELETE_X_BLOCKS:     '%1 個のブロックを削除',
    DELETE_ALL_BLOCKS:   'すべてのブロックを削除',
    HELP:                'ヘルプ',
    UNDO:                '元に戻す',
    REDO:                'やり直す',
    CLEAN_UP:            '整理する',
    COLLAPSE_ALL:        'すべて折りたたむ',
    EXPAND_ALL:          'すべて展開する',
    INLINE_INPUTS:       '入力をインライン表示',
    EXTERNAL_INPUTS:     '入力を別行に表示',
    NEW_VARIABLE:        '新しい変数を作る',
    NEW_VARIABLE_TITLE:  '新しい変数の名前:',
    RENAME_VARIABLE:     '変数の名前を変える',
    RENAME_VARIABLE_TITLE:'変数「%1」の新しい名前:',
    DELETE_VARIABLE:     '変数「%1」を削除する',
    DELETE_VARIABLE_CONFIRMATION:'変数「%1」は %2 か所で使われています。削除しますか？',
    VARIABLE_CATEGORY_NAME:'変数',
    VARIABLE_ALREADY_EXISTS:'変数「%1」はすでに存在します。',
  });

  const pcbTheme = Blockly.Theme.defineTheme('pcbTerminal', {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#0b150b',
      toolboxBackgroundColour:   '#080e08',
      toolboxForegroundColour:   '#a0c8a0',
      flyoutBackgroundColour:    '#0a140a',
      flyoutForegroundColour:    '#c8e6c8',
      flyoutOpacity:             1,
      scrollbarColour:           '#1a3a1a',
      scrollbarOpacity:          0.7,
      insertionMarkerColour:     '#00ff41',
      insertionMarkerOpacity:    0.4,
      cursorColour:              '#00ff41',
    }
  });

  const workspace = Blockly.inject('blockly-div', {
    toolbox: document.getElementById('toolbox-python'),
    theme: pcbTheme,
    renderer: 'zelos',
    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3 }
  });

  const lightTheme = Blockly.Theme.defineTheme('pycoLight', {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#f8fff8',
      toolboxBackgroundColour:   '#f0f6f0',
      toolboxForegroundColour:   '#1a2a1a',
      flyoutBackgroundColour:    '#eef6ee',
      flyoutForegroundColour:    '#1a2a1a',
      flyoutOpacity:             1,
      scrollbarColour:           '#b0ccb0',
      scrollbarOpacity:          0.8,
      insertionMarkerColour:     '#1e7a1e',
      insertionMarkerOpacity:    0.4,
      cursorColour:              '#1e7a1e',
    }
  });

  const editor = CodeMirror(document.getElementById('code-editor'), {
    value: '# ブロックを追加してください',
    mode: 'python',
    theme: 'dracula',
    lineNumbers: true,
    readOnly: true,
    lineWrapping: false,
    tabSize: 4,
    indentWithTabs: false,
  });
  let codingMode = false;
  let syntaxCollapsed = false;
  let currentMode = 'micropython'; // 初期値は後で applyMode('python') で上書き

  // ===== ファイルタブ管理（Python入門モードのみ） =====
  let pyFiles = [{ name: 'main.py', content: '# ブロックを追加してください', blockXml: null }];
  let activeFileIdx = 0;

  // モジュール選択ドロップダウン用：ブロック定義（python_intro.js）から参照
  window.getPyModuleOptions = function() {
    const mods = pyFiles
      .filter(function(f, i) { return i !== 0; })
      .map(function(f) {
        const name = f.name.replace(/\.py$/, '');
        return [name, name];
      });
    return mods.length > 0 ? mods : [['（モジュールなし）', '__none__']];
  };

  // 指定モジュール内の関数名一覧（ブロック定義の関数ドロップダウンから参照）
  window.getPyModuleFunctions = function(modName) {
    if (!modName || modName === '__none__') return [['（モジュールを選択）', '__none__']];
    const file = pyFiles.find(function(f) { return f.name === modName + '.py'; });
    if (!file) return [['（モジュールなし）', '__none__']];
    const funcs = [];
    const seen = new Set();
    const pushFunc = function(name) {
      if (name && !seen.has(name)) { seen.add(name); funcs.push([name, name]); }
    };
    const content = file.content || '';
    const re = /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gm;
    let m;
    while ((m = re.exec(content)) !== null) pushFunc(m[1]);
    if (file.blockXml) {
      try {
        const dom = new DOMParser().parseFromString(file.blockXml, 'text/xml');
        const defTypes = ['py_def_noarg', 'py_def', 'py_def_args2', 'py_def_args3'];
        defTypes.forEach(function(t) {
          dom.querySelectorAll('block[type="' + t + '"]').forEach(function(b) {
            const fld = b.querySelector(':scope > field[name="NAME"]');
            if (fld) pushFunc((fld.textContent || '').trim());
          });
        });
      } catch (e) { /* ignore */ }
    }
    return funcs.length > 0 ? funcs : [['（関数なし）', '__none__']];
  };

  // 指定モジュールから「from import で読み込めそうな名前」を抽出
  // = トップレベルの def / class / 代入。imports は除外
  window.getPyModuleNames = function(modName) {
    if (!modName || modName === '__none__') return [['（モジュールを選択）', '__none__']];
    const file = pyFiles.find(function(f) { return f.name === modName + '.py'; });
    if (!file) return [['（モジュールなし）', '__none__']];
    const names = [];
    const seen = new Set();
    const push = function(n) {
      if (n && !seen.has(n)) { seen.add(n); names.push([n, n]); }
    };
    const content = file.content || '';
    content.split('\n').forEach(function(line) {
      if (/^\s/.test(line)) return;             // インデント行はスキップ
      if (/^\s*#/.test(line)) return;           // コメント行
      if (/^(import|from)\s/.test(line)) return; // import 自体
      let m = line.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
      if (m) { push(m[1]); return; }
      m = line.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (m) { push(m[1]); return; }
      m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)/);
      if (m) push(m[1]);
    });
    if (file.blockXml) {
      try {
        const dom = new DOMParser().parseFromString(file.blockXml, 'text/xml');
        const defTypes = ['py_def_noarg', 'py_def', 'py_def_args2', 'py_def_args3'];
        defTypes.forEach(function(t) {
          dom.querySelectorAll('block[type="' + t + '"]').forEach(function(b) {
            const fld = b.querySelector(':scope > field[name="NAME"]');
            if (fld) push((fld.textContent || '').trim());
          });
        });
      } catch (e) { /* ignore */ }
    }
    return names.length > 0 ? names : [['（名前なし）', '__none__']];
  };

  function saveCurrentFile() {
    pyFiles[activeFileIdx].content = editor.getValue();
  }

  function renderFileTabs() {
    const bar = document.getElementById('file-tabs');
    bar.innerHTML = '';
    pyFiles.forEach(function(f, i) {
      const tab = document.createElement('div');
      tab.className = 'file-tab' + (i === activeFileIdx ? ' active' : '');
      const name = document.createElement('span');
      name.className = 'file-tab-name';
      name.textContent = f.name;
      // ダブルクリックでインライン編集（main.py は除く）
      if (i !== 0) {
        name.title = 'ダブルクリックで名前を変更';
        name.addEventListener('dblclick', function(e) {
          e.stopPropagation();
          const oldName = f.name;
          name.contentEditable = 'true';
          name.classList.add('editing');
          // テキスト全選択
          const range = document.createRange();
          range.selectNodeContents(name);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          name.focus();

          let committed = false;
          function commit() {
            if (committed) return;
            committed = true;
            name.contentEditable = 'false';
            name.classList.remove('editing');
            let newName = (name.textContent || '').trim();
            if (!newName) { name.textContent = oldName; return; }
            if (!/\.py$/i.test(newName) && !/\.[a-z0-9]+$/i.test(newName)) newName += '.py';
            if (newName === oldName) { name.textContent = oldName; return; }
            if (pyFiles.some(function(g, j) { return j !== i && g.name === newName; })) {
              alert('同じ名前のファイルが既にあります: ' + newName);
              name.textContent = oldName;
              return;
            }
            saveCurrentFile();
            pyFiles[i].name = newName;
            f.name = newName;
            renderFileTabs();
          }
          function cancel() {
            if (committed) return;
            committed = true;
            name.contentEditable = 'false';
            name.classList.remove('editing');
            name.textContent = oldName;
          }
          name.addEventListener('keydown', function(ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); commit(); name.blur(); }
            else if (ev.key === 'Escape') { ev.preventDefault(); cancel(); name.blur(); }
          });
          name.addEventListener('blur', commit, { once: true });
        });
      }
      tab.appendChild(name);
      if (i !== 0) {
        const close = document.createElement('span');
        close.className = 'file-tab-close';
        close.textContent = '×';
        close.title = '削除';
        close.addEventListener('click', function(e) {
          e.stopPropagation();
          if (!confirm(f.name + ' を削除しますか？')) return;
          // 削除前に現在のエディタ内容を保存
          saveCurrentFile();
          pyFiles.splice(i, 1);
          const nextIdx = activeFileIdx >= pyFiles.length ? pyFiles.length - 1
                        : activeFileIdx === i            ? Math.max(0, i - 1)
                        : activeFileIdx > i              ? activeFileIdx - 1
                        : activeFileIdx;
          activeFileIdx = nextIdx;
          editor.setValue(pyFiles[activeFileIdx].content);
          editor.setOption('readOnly', activeFileIdx === 0 ? !codingMode : false);
          // 削除後のアクティブファイルのBlocklyワークスペースを復元
          workspace.clear();
          if (pyFiles[activeFileIdx].blockXml) {
            try {
              const dom = new DOMParser().parseFromString(pyFiles[activeFileIdx].blockXml, 'text/xml');
              Blockly.Xml.domToWorkspace(dom.documentElement, workspace);
            } catch (e) {
              console.warn('ワークスペース復元失敗:', e);
            }
          }
          // ツールボックスも切替
          if (currentMode === 'python') {
            const tbId = activeFileIdx === 0 ? 'toolbox-python' : 'toolbox-module';
            workspace.updateToolbox(document.getElementById(tbId));
          } else if (currentMode === 'game') {
            const tbId = activeFileIdx === 0 ? 'toolbox-game' : 'toolbox-game-module';
            workspace.updateToolbox(document.getElementById(tbId));
          }
          renderFileTabs();
        });
        tab.appendChild(close);
      }
      tab.addEventListener('click', function() {
        if (name.contentEditable === 'true') return;
        switchFile(i);
      });
      bar.appendChild(tab);
    });
    const addBtn = document.createElement('button');
    addBtn.id = 'btn-add-file';
    addBtn.textContent = '+';
    addBtn.title = 'ファイルを追加';
    addBtn.addEventListener('click', addNewFile);
    bar.appendChild(addBtn);
  }

  function switchFile(idx) {
    saveCurrentFile();
    // 現在のワークスペースXMLを保存
    const curXml = Blockly.Xml.workspaceToDom(workspace);
    pyFiles[activeFileIdx].blockXml = Blockly.Xml.domToText(curXml);

    activeFileIdx = idx;
    editor.setValue(pyFiles[idx].content);
    // main.py はブロックモード時 readonly、サブファイルは常に編集可
    editor.setOption('readOnly', idx === 0 ? !codingMode : false);

    // 切替先ファイルのBlocklyワークスペースを復元
    workspace.clear();
    if (pyFiles[idx].blockXml) {
      try {
        const dom = new DOMParser().parseFromString(pyFiles[idx].blockXml, 'text/xml');
        Blockly.Xml.domToWorkspace(dom.documentElement, workspace);
      } catch (e) {
        console.warn('ワークスペース復元失敗:', e);
      }
    }

    // ツールボックス切替: main.py → python/game、サブファイル → module
    if (currentMode === 'python') {
      const tbId = idx === 0 ? 'toolbox-python' : 'toolbox-module';
      workspace.updateToolbox(document.getElementById(tbId));
    } else if (currentMode === 'game') {
      const tbId = idx === 0 ? 'toolbox-game' : 'toolbox-game-module';
      workspace.updateToolbox(document.getElementById(tbId));
    }

    renderFileTabs();
  }

  function addNewFile() {
    const raw = prompt('ファイル名を入力してください（例: mymodule.py / data.txt）');
    if (!raw || !raw.trim()) return;
    const trimmed = raw.trim();
    const hasExt = /\.(py|txt|csv|json|md)$/i.test(trimmed);
    const fname = hasExt ? trimmed : trimmed + '.py';
    if (pyFiles.find(function(f) { return f.name === fname; })) {
      alert(fname + ' はすでに存在します');
      return;
    }
    const isData = !/\.py$/i.test(fname);
    pyFiles.push({ name: fname, content: '', blockXml: null, isData: isData });
    switchFile(pyFiles.length - 1);
  }

  function pycoFlushToTab(fname, content, append) {
    const existing = pyFiles.find(f => f.name === fname);
    if (existing) {
      existing.content = append ? (existing.content + content) : content;
      existing.isData = true;
      if (pyFiles[activeFileIdx].name === fname) {
        if (typeof pyEditor !== 'undefined' && pyEditor) {
          pyEditor.setValue(existing.content);
        } else if (editor) {
          editor.setValue(existing.content);
        }
      }
    } else {
      pyFiles.push({ name: fname, content: content, blockXml: null, isData: true });
    }
    renderFileTabs();
  }

  let _PycoFileClass = null;
  function _getPycoFileClass() {
    if (_PycoFileClass) return _PycoFileClass;
    _PycoFileClass = Sk.abstr.buildNativeClass('PycoFile', {
      constructor: function PycoFile(fname, mode) {
        this.fname = fname;
        this.mode = mode || 'r';
        this.writeBuffer = '';
        this.readContent = '';
        if (this.mode === 'r') {
          const tab = pyFiles.find(f => f.name === fname);
          if (!tab) {
            throw new Sk.builtin.IOError('ファイルが見つかりません: ' + fname);
          }
          this.readContent = tab.content;
        }
      },
      methods: {
        __enter__: {
          $meth: function() { return this; },
          $flags: { NoArgs: true },
        },
        __exit__: {
          $meth: function(_t, _v, _tb) {
            if (this.mode === 'w') pycoFlushToTab(this.fname, this.writeBuffer, false);
            if (this.mode === 'a') pycoFlushToTab(this.fname, this.writeBuffer, true);
            return Sk.builtin.bool.false$;
          },
          $flags: { MinArgs: 3, MaxArgs: 3 },
        },
        write: {
          $meth: function(data) {
            const s = Sk.ffi.remapToJs(data);
            this.writeBuffer = (this.writeBuffer || '') + s;
            return Sk.builtin.none.none$;
          },
          $flags: { OneArg: true },
        },
        read: {
          $meth: function() {
            return Sk.ffi.remapToPy(this.readContent);
          },
          $flags: { NoArgs: true },
        },
        readlines: {
          $meth: function() {
            const lines = this.readContent.split('\n').map(l => Sk.ffi.remapToPy(l));
            return new Sk.builtin.list(lines);
          },
          $flags: { NoArgs: true },
        },
        readline: {
          $meth: function() {
            const idx = this.readContent.indexOf('\n');
            let line;
            if (idx === -1) {
              line = this.readContent;
              this.readContent = '';
            } else {
              line = this.readContent.slice(0, idx + 1);
              this.readContent = this.readContent.slice(idx + 1);
            }
            return Sk.ffi.remapToPy(line);
          },
          $flags: { NoArgs: true },
        },
        close: {
          $meth: function() { return Sk.builtin.none.none$; },
          $flags: { NoArgs: true },
        },
      },
    });
    return _PycoFileClass;
  }

  function makePycoFileObj(fname, mode) {
    const Klass = _getPycoFileClass();
    return new Klass(fname, mode);
  }

  let Tutorial;   // 後で代入（generateCode から参照するため先に宣言）
  let blockLineMap = new Map(); // blockId → { from, to }（CodeMirror の 0 始まり行番号）
  const BLOCK_SEL_BG_CLASS = 'block-selection-highlight';
  let _emitCtx = { line: 0 };
  function _nl(s) {
    return (s.match(/\n/g) || []).length;
  }
  function appendLocal(code, frag) {
    if (frag) _emitCtx.line += _nl(frag);
    return code + frag;
  }
  /** 子の blockToCode 戻りは子側で行数加算済み。空のときは pass 行だけ加算 */
  function appendChildBody(code, childText, passLine) {
    if (childText) return code + childText;
    return appendLocal(code, passLine);
  }
  /** 式の外側を包む冗長な () を1段だけ剥がす（if/while などのトップで使う） */
  function stripOuterParens(s) {
    if (typeof s !== 'string') return s;
    const t = s.trim();
    if (t.length < 2 || t[0] !== '(' || t[t.length - 1] !== ')') return s;
    let depth = 0;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0 && i !== t.length - 1) return s;
      }
    }
    return t.slice(1, -1).trim();
  }
  /** トップレベル（括弧外）に指定キーワードが現れるか。 ' and ' / ' or ' の検出に使う */
  function hasTopLevelKeyword(s, kw) {
    if (typeof s !== 'string') return false;
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '(' || c === '[') depth++;
      else if (c === ')' || c === ']') depth--;
      else if (depth === 0 && s.slice(i, i + kw.length) === kw) return true;
    }
    return false;
  }

  /**
   * 式用（VALUE）入力だけ追跡する。statement 入力（DO など）は別行なのでここでは辿らない。
   * 接続方向で判定（圧縮 Blockly でもクラス名に依存しにくい）。
   */
  function isBlocklyValueInput(inp) {
    if (!inp || !inp.connection) return false;
    const tb = inp.connection.targetBlock();
    if (!tb) return false;
    if (tb.outputConnection && tb.outputConnection.targetConnection === inp.connection) return true;
    if (tb.previousConnection && tb.previousConnection.targetConnection === inp.connection) return false;
    const ctor = inp.constructor && inp.constructor.name;
    if (ctor === 'StatementInput' || ctor === 'DummyInput') return false;
    if (ctor === 'ValueInput') return true;
    const t = inp.type;
    if (typeof Blockly !== 'undefined') {
      if (Blockly.INPUT_VALUE !== undefined && t === Blockly.INPUT_VALUE) return true;
      if (Blockly.inputs && Blockly.inputs.inputTypes && t === Blockly.inputs.inputTypes.VALUE) return true;
    }
    return t === 1 || t === 'input_value';
  }

  /** 式ブロックとその子（演算・比較など）を、与えられた行に紐付けて blockLineMap に登録する */
  function registerExprBlocksAtLine(block, lineNo) {
    if (!block) return;
    blockLineMap.set(block.id, { from: lineNo, to: lineNo });
    const inputs = block.inputList;
    for (let i = 0; i < inputs.length; i++) {
      const inp = inputs[i];
      if (!isBlocklyValueInput(inp)) continue;
      const tb = inp.connection && inp.connection.targetBlock();
      if (tb) registerExprBlocksAtLine(tb, lineNo);
    }
  }

  function registerExprBlocksAtLineFromInput(parentBlock, inputName, lineNo) {
    const input = parentBlock.getInput(inputName);
    if (!input || !input.connection || !input.connection.targetBlock()) return;
    registerExprBlocksAtLine(input.connection.targetBlock(), lineNo);
  }

  // ブロックの日本語ラベルを返す
  function blockLabel(block) {
    switch (block.type) {
      case 'pico_led_on':      return `出力ピン${block.getFieldValue('PIN')} → HIGH（点灯）`;
      case 'pico_led_off':     return `出力ピン${block.getFieldValue('PIN')} → LOW（消灯）`;
      case 'pico_digital_write': {
        const v = block.getFieldValue('VAL') === '1' ? 'HIGH' : 'LOW';
        return `GPIOピン${block.getFieldValue('PIN')} → ${v}`;
      }
      case 'pico_wait':        return `秒数待機`;
      case 'pico_repeat':      return `繰り返す`;
      case 'pico_forever':     return `ずっと繰り返す（無限ループ）`;
      case 'pvb_forward':      return `前進する`;
      case 'pvb_backward':     return `後退する`;
      case 'pvb_turn_right':   return `右旋回`;
      case 'pvb_turn_left':    return `左旋回`;
      case 'pvb_stop':         return `止まる（モーター停止）`;
      case 'pvb_led_on': {
        const n = block.getFieldValue('LED') === '11' ? '1' : '2';
        return `LED${n} 点灯（GP${block.getFieldValue('LED')}）`;
      }
      case 'pvb_led_off': {
        const n = block.getFieldValue('LED') === '11' ? '1' : '2';
        return `LED${n} 消灯（GP${block.getFieldValue('LED')}）`;
      }
      case 'pvb_if_switch': {
        const n = block.getFieldValue('SW') === '13' ? '1' : '2';
        return `スイッチ${n} が押されていたら（GP${block.getFieldValue('SW')}）`;
      }
      case 'pvb_sonar_val':    return '超音波センサーの距離（cm）';
      case 'pvb_line_val': {
        const l = block.getFieldValue('SENSOR') === '26' ? '左' : block.getFieldValue('SENSOR') === '27' ? '中' : '右';
        return `ラインセンサー（${l}）の値`;
      }
      case 'pvb_switch_val': {
        const n = block.getFieldValue('SW') === '13' ? '1' : '2';
        return `スイッチ${n} の値`;
      }
      case 'pvb_sonar':        return `超音波センサーで距離を測る → 変数「${getVarName(block, 'VAR')}」に格納`;
      case 'pvb_if_obstacle':  return `障害物が近かったら`;
      case 'pvb_line_read': {
        const l = block.getFieldValue('SENSOR') === '26' ? '左' : block.getFieldValue('SENSOR') === '27' ? '中' : '右';
        return `ラインセンサー（${l}）を読む → 変数「${getVarName(block, 'VAR')}」に格納`;
      }
      case 'pvb_if_line': {
        const l = block.getFieldValue('SENSOR') === '26' ? '左' : block.getFieldValue('SENSOR') === '27' ? '中' : '右';
        const c = block.getFieldValue('COLOR') === 'black' ? '黒' : '白';
        return `ラインセンサー（${l}）が${c}だったら`;
      }
      case 'pvb_print':        return `変数「${getVarName(block, 'VAR')}」を表示する`;
      case 'var_set':          return `変数「${getVarName(block, 'VAR')}」に値をセットする`;
      case 'var_change':       return `変数「${getVarName(block, 'VAR')}」を増減する`;
      case 'var_if_greater':   return `変数「${getVarName(block, 'VAR')}」が大きかったら`;
      case 'var_if_less':      return `変数「${getVarName(block, 'VAR')}」が小さかったら`;
      case 'print_text':       return `「${block.getFieldValue('TEXT')}」を表示する`;
      case 'print_var_label':  return `「${block.getFieldValue('LABEL')}」+ 変数「${getVarName(block, 'VAR')}」を表示する`;
      case 'print_separator':  return `区切り線を表示する`;
      case 'val_var':         return `変数「${getVarName(block, 'VAR')}」`;
      case 'val_number':      return `数値 ${block.getFieldValue('NUM')}`;
      case 'cond_compare':    return `比較（${block.getFieldValue('OP')}）`;
      case 'cond_and':        return `かつ（AND）`;
      case 'cond_or':         return `または（OR）`;
      case 'cond_not':        return `でない（NOT）`;
      case 'pico_if': {
        const eic = block.elseifCount_ || 0;
        const ec  = block.elseCount_   || 0;
        let label = '条件分岐（if';
        if (eic > 0) label += ` + ${eic}×elif`;
        if (ec  > 0) label += ' + else';
        return label + '）';
      }
      case 'pico_digital_read':     return `ピン${block.getFieldValue('PIN')} デジタル入力 → 変数「${getVarName(block, 'VAR')}」`;
      case 'pico_analog_read':      return `ADCピン${block.getFieldValue('PIN')} アナログ入力 → 変数「${getVarName(block, 'VAR')}」`;
      case 'pico_digital_read_val': return `ピン${block.getFieldValue('PIN')} の入力値`;
      case 'pico_analog_read_val':  return `ADCピン${block.getFieldValue('PIN')} のアナログ値`;
      case 'pico_for_range':  return `${getVarName(block, 'VAR')} を N 回繰り返す`;
      case 'pico_for_from_to': return `${getVarName(block, 'VAR')} を範囲指定で繰り返す`;
      case 'val_str':        return `文字列「${block.getFieldValue('TEXT')}」`;
      case 'val_bool':       return block.getFieldValue('BOOL') === 'True' ? 'True（真）' : 'False（偽）';
      case 'py_math_op':     return `算術演算（${block.getFieldValue('OP')}）`;
      case 'py_str_concat':  return '文字列連結';
      case 'py_while':       return 'while ループ';
      case 'py_print':       return '値を表示する';
      case 'py_print_multi': return '複数の値をスペース区切りで表示';
      case 'py_sorted_key_func':      return `リスト「${getVarName(block, 'LIST')}」を${block.getFieldValue('KEY')}順に並び替え`;
      case 'py_sorted_dict_two_keys': return `辞書リスト「${getVarName(block, 'LIST')}」を2キーでソート`;
      case 'py_input': {
        const typeLabel = { str: 'テキスト', int: '数値（整数）', float: '数値（小数）' }[block.getFieldValue('TYPE')] || 'テキスト';
        return `キーボード入力（${typeLabel}）→ 変数「${getVarName(block, 'VAR')}」`;
      }
      case 'py_list_empty':    return '空のリスト []';
      case 'py_list_append':   return `リスト「${getVarName(block, 'LIST')}」に追加する`;
      case 'py_list_get':      return `リスト「${getVarName(block, 'LIST')}」の要素取得`;
      case 'py_list_set':      return `リスト「${getVarName(block, 'LIST')}」の要素変更`;
      case 'py_list_len':      return `リスト「${getVarName(block, 'LIST')}」の長さ`;
      case 'py_list_contains': return `リスト「${getVarName(block, 'LIST')}」に含まれるか`;
      case 'py_for_list':      return `リスト「${getVarName(block, 'LIST')}」を順に繰り返す`;
      case 'py_fstring':       return 'f文字列';
      case 'py_fstring_fmt':   return 'f文字列（フォーマット付き）';
      case 'py_dict_new':      return '空の辞書 {}';
      case 'py_dict_literal':  return '辞書リテラル { キー: 値, ... }';
      case 'py_dict_set':      return `辞書「${getVarName(block, 'DICT')}」にキーと値をセット`;
      case 'py_dict_get':         return `辞書「${getVarName(block, 'DICT')}」からキーで取得`;
      case 'py_dict_get_default': return `辞書「${getVarName(block, 'DICT')}」からキーで取得（なければデフォルト値）`;
      case 'py_dict_keys':     return `辞書「${getVarName(block, 'DICT')}」のキー一覧`;
      case 'py_for_dict_items_sorted': return `辞書「${getVarName(block, 'DICT')}」をソートして繰り返す`;
      case 'py_tuple_literal':  return 'タプル ( ... )';
      case 'py_set_literal':    return 'セット { ... }';
      case 'py_set_add':        return `セット「${getVarName(block, 'SET')}」に要素を追加`;
      case 'py_set_discard':    return `セット「${getVarName(block, 'SET')}」から要素を削除`;
      case 'py_list_literal':   return 'リスト [ ... ]';
      case 'py_list_comp':      return 'リスト内包表記 [式 for 変数 in リスト]';
      case 'py_list_comp_if':   return 'リスト内包表記（条件付き）';
      case 'py_ternary':        return '条件式 (値 if 条件 else 値)';
      case 'py_dict_comp':      return '辞書内包表記 {キー: 値 for 変数 in リスト}';
      case 'py_set_comp':       return 'セット内包表記 {式 for 変数 in リスト}';
      case 'py_enumerate_for':  return `リスト「${getVarName(block, 'LIST')}」を番号付きで繰り返す`;
      case 'py_zip_for':        return `リスト「${getVarName(block, 'LIST_A')}」と「${getVarName(block, 'LIST_B')}」を同時に繰り返す`;
      case 'py_sorted_call':    return `リスト「${getVarName(block, 'LIST')}」を並び替え`;
      case 'py_min_call':       return `リスト「${getVarName(block, 'LIST')}」の最小値`;
      case 'py_max_call':       return `リスト「${getVarName(block, 'LIST')}」の最大値`;
      case 'py_sum_call':       return `リスト「${getVarName(block, 'LIST')}」の合計`;
      case 'py_str_split':     return `文字列「${getVarName(block, 'VAR')}」を分割`;
      case 'py_str_strip':     return `文字列「${getVarName(block, 'VAR')}」の前後の空白を取り除く`;
      case 'py_str_replace':   return `文字列「${getVarName(block, 'VAR')}」の文字を置換`;
      case 'py_str_find':      return `文字列「${getVarName(block, 'VAR')}」の中で検索`;
      case 'py_str_join':      return `文字列「${block.getFieldValue('SEP')}」でリスト「${getVarName(block, 'LIST')}」を結合`;
      case 'py_str_lstrip':    return `文字列「${getVarName(block, 'VAR')}」の左端の空白を取り除く`;
      case 'py_str_rstrip':    return `文字列「${getVarName(block, 'VAR')}」の右端の空白を取り除く`;
      case 'py_str_find_from': return `文字列「${getVarName(block, 'VAR')}」の中で「${block.getFieldValue('SUB')}」を${block.getFieldValue('START')}文字目から探す`;
      case 'py_range':        return `range(${block.getFieldValue('START')}, ${block.getFieldValue('STOP')})`;
      case 'py_str_upper':    return `文字列「${getVarName(block, 'VAR')}」を大文字に変換`;
      case 'py_tuple_unpack': return `${getVarName(block, 'VAR_X')}, ${getVarName(block, 'VAR_Y')} = ${getVarName(block, 'SRC')}`;
      case 'py_print2':       return `変数「${getVarName(block, 'VAR_A')}」と「${getVarName(block, 'VAR_B')}」を表示`;
      case 'py_set_op':       return `セット「${getVarName(block, 'SET_A')}」${block.getFieldValue('OP')}「${getVarName(block, 'SET_B')}」`;
      case 'py_list_dedup':   return `リスト「${getVarName(block, 'LIST')}」の重複を除く`;
      case 'py_sorted_set':   return `リスト「${getVarName(block, 'LIST')}」の重複を除いて昇順に並べる`;
      case 'py_dict_val_literal': return '辞書 {キー: 値, キー: 値}（キーに任意の値）';
      case 'py_frozenset':    return 'frozenset（変更不可のセット）を作成';
      case 'py_type_of':      return `変数「${getVarName(block, 'VAR')}」の型を取得（type）`;
      case 'py_sorted_tuple_idx': return `リスト「${getVarName(block, 'LIST')}」を${block.getFieldValue('IDX')}番目の要素で${block.getFieldValue('REV') === 'True' ? '降順' : '昇順'}ソート`;
      case 'py_fstring2':     return `"${block.getFieldValue('PRE')}{${getVarName(block, 'VAR1')}}${block.getFieldValue('MID')}{${getVarName(block, 'VAR2')}}${block.getFieldValue('POST')}"`;
      case 'py_list_pop':     return `リスト「${getVarName(block, 'LIST')}」の末尾を取り出す（pop）`;
      case 'py_enumerate_start_for': return `リスト「${getVarName(block, 'LIST')}」を番号（${block.getFieldValue('START')}から）付きで繰り返す`;
      case 'py_map_call':      return `リスト「${getVarName(block, 'LIST')}」を一括変換（map）`;
      case 'py_break':         return 'ループを抜ける（break）';
      case 'py_continue':      return '次のループへ（continue）';
      case 'py_def_noarg':  return `関数「${getVarName(block, 'NAME')}」を定義する`;
      case 'py_def':        return `関数「${getVarName(block, 'NAME')}」（引数: ${getVarName(block, 'PARAM')}）を定義する`;
      case 'py_def_args2':  return `関数「${getVarName(block, 'NAME')}」（引数: ${block.getFieldValue('PARAM1')}, ${block.getFieldValue('PARAM2')}）を定義する`;
      case 'py_def_args3':  return `関数「${getVarName(block, 'NAME')}」（引数: ${block.getFieldValue('PARAM1')}, ${block.getFieldValue('PARAM2')}, ${block.getFieldValue('PARAM3')}）を定義する`;
      case 'py_return':     return '戻り値を返す（return）';
      case 'py_call_stmt':        return `関数「${getVarName(block, 'NAME')}」を呼び出す`;
      case 'py_call_stmt_arg2':   return `関数「${getVarName(block, 'NAME')}」（2引数）を呼び出す`;
      case 'py_call_val':         return `関数「${getVarName(block, 'NAME')}」の結果`;
      case 'py_call_val2':        return `関数「${getVarName(block, 'NAME')}」（2引数）の結果`;
      case 'py_fstring2_expr':    return 'f文字列（2式埋め込み）';
      case 'py_list_range':       return `0 から ${block.getFieldValue('N')} 個の整数リスト`;
      case 'py_module_call_stmt': return `モジュール「${block.getFieldValue('MODULE')}」の「${block.getFieldValue('FUNC')}」を呼び出す`;
      case 'py_module_call_val':  return `モジュール「${block.getFieldValue('MODULE')}」の「${block.getFieldValue('FUNC')}」の結果`;
      case 'py_random_int':    return 'ランダムな整数';
      case 'py_type_cast':     return `型変換（${block.getFieldValue('TYPE')}）`;
      case 'py_abs':           return '絶対値（abs）';
      case 'py_round':         return '四捨五入（round）';
      case 'py_set_empty':     return '空のセット set()';
      case 'py_import_module': return `モジュール「${block.getFieldValue('MODULE')}」を読み込む（import）`;
      case 'py_import_as':     return `モジュール「${block.getFieldValue('MODULE')}」を別名「${block.getFieldValue('ALIAS')}」で読み込む（import as）`;
      case 'py_from_import_multi': {
        const _fimNames = [];
        for (let k = 0; block.getField && block.getField('NAME' + k); k++) {
          const v = block.getFieldValue('NAME' + k);
          if (v && v !== '__none__') _fimNames.push(v);
        }
        return `モジュール「${block.getFieldValue('MODULE')}」から「${_fimNames.join(', ')}」を読み込む（from import 複数）`;
      }
      case 'py_bisect_left':   return `整列済みリスト「${getVarName(block, 'LIST')}」で値が入る左端の位置（bisect_left）`;
      case 'py_bisect_right':  return `整列済みリスト「${getVarName(block, 'LIST')}」で値が入る右端の位置（bisect_right）`;
      case 'py_str_isdigit':   return '文字列が数字だけか（isdigit）';
      case 'py_list_slice':    return `リスト「${getVarName(block, 'LIST')}」の範囲を取り出す（slice）`;
      case 'py_list_get_negative': return `リスト「${getVarName(block, 'LIST')}」の末尾から${block.getFieldValue('OFFSET')}番目`;
      case 'py_call_val3':     return `関数「${getVarName(block, 'NAME')}」（3引数）の結果`;
      case 'py_fstring3':      return 'f文字列（3式埋め込み）';
      case 'py_deque_init':    return 'deque（両端キュー）を作る';
      case 'py_deque_popleft': return `deque「${getVarName(block, 'DEQUE')}」の先頭を取り出す（popleft）`;
      case 'py_deque_append':  return `deque「${getVarName(block, 'DEQUE')}」の末尾に追加（append）`;
      case 'py_list_pop_val':  return `リスト「${getVarName(block, 'LIST')}」の末尾を取り出した値（pop）`;
      case 'game_color':
        return '色: ' + (block.getFieldValue('COLOR') || '');
      case 'game_image_preset': {
        const snames = {
          'assets/game-icons/player_ship.svg': 'プレイヤー',
          'assets/game-icons/rocket.svg': 'ロケット',
          'assets/game-icons/enemy_bug.svg': '敵（ドローン）',
          'assets/game-icons/coin.svg': 'コイン',
          'assets/game-icons/gem.svg': 'ジェム',
          'assets/game-icons/star.svg': 'スター',
          'assets/game-icons/heart.svg': 'ハート',
          'assets/game-icons/bullet.svg': '弾',
          'assets/game-icons/energy.svg': 'エナジー',
          'assets/game-icons/shield.svg': 'シールド',
          'assets/game-icons/spike.svg': 'トゲ',
          'assets/game-icons/meteor.svg': 'メテオ',
          'assets/game-icons/portal.svg': 'ポータル',
          'assets/game-icons/crate.svg': '木箱',
        };
        return '内蔵画像: ' + (snames[block.getFieldValue('IMG')] || block.getFieldValue('IMG'));
      }
      case 'game_sound_preset': return '内蔵効果音: ' + (block.getFieldValue('SE') || '');
      case 'game_music_preset': return '内蔵 BGM: ' + (block.getFieldValue('BGM') || '');
      case 'game_draw_image': return '画像を描画する（サイズ・回転・反転対応）';
      case 'game_rect_collidepoint': return 'Rect と点が重なるか（collidepoint）';
      case 'game_rect_union': return '二つの Rect を包む最小矩形（union）';
      case 'game_get_ticks':   return 'ゲーム開始からの時間（ms）';
      case 'game_mouse_x':     return 'マウスのX座標';
      case 'game_mouse_y':     return 'マウスのY座標';
      case 'game_mouse_pressed': {
        const btns = { '0': '左', '1': '中', '2': '右' };
        return `マウス${btns[block.getFieldValue('BTN')] || '左'}ボタン押下判定`;
      }
      case 'game_keys_capture':  return `キー押下状態を「${getVarName(block, 'VAR')}」に取得`;
      case 'game_keys_held': {
        const v = getVarName(block, 'VAR');
        return `${v}[${block.getFieldValue('KEY') || 'K_RIGHT'}] が押されている`;
      }
      case 'game_mouse_capture': return `マウス座標を「${getVarName(block, 'MX')}, ${getVarName(block, 'MY')}」に取得`;
      case 'game_font_set':      return `フォント「${getVarName(block, 'VAR')}」を作る`;
      case 'game_text_render':   return `文字サーフェス「${getVarName(block, 'VAR')}」を作る`;
      case 'game_blit_surface':  return 'サーフェスを画面へ描画';
      case 'game_image_blit':    return '画像を画面へ貼る（直接 blit）';
      case 'game_rect_attr': {
        const attrs = { x: 'x座標', y: 'y座標', width: '幅', height: '高さ', centerx: '中心x', centery: '中心y' };
        return `Rectの${attrs[block.getFieldValue('ATTR')] || '属性'}`;
      }
      case 'py_class_def':        return `クラス「${block.getFieldValue('NAME')}」を定義する`;
      case 'py_class_init':       return `__init__（self, ${getVarName(block, 'PARAM')}）`;
      case 'py_class_init2':      return `__init__（self, ${getVarName(block, 'PARAM1')}, ${getVarName(block, 'PARAM2')}）`;
      case 'py_class_method':     return `メソッド「${block.getFieldValue('NAME')}」（引数なし）`;
      case 'py_class_method1':    return `メソッド「${block.getFieldValue('NAME')}」（引数: ${getVarName(block, 'PARAM')}）`;
      case 'py_self_set':         return `self.${block.getFieldValue('ATTR')} に代入`;
      case 'py_self_get':         return `self.${block.getFieldValue('ATTR')}`;
      case 'py_new_instance':     return `クラス「${block.getFieldValue('NAME')}」のインスタンスを作る`;
      case 'py_method_call_stmt': return `${getVarName(block, 'INST')}.${block.getFieldValue('METHOD')}() を呼ぶ`;
      case 'py_attr_get':         return `${getVarName(block, 'INST')}.${block.getFieldValue('ATTR')}`;
      case 'py_try_except':       return `エラー（${block.getFieldValue('ETYPE')}）を処理する`;
      case 'py_try_except_as':    return `エラーを ${getVarName(block, 'EVAR')} として処理する`;
      case 'py_raise':            return `${block.getFieldValue('ETYPE')} を発生させる`;
      case 'py_custom_stmt': return 'カスタムPython（文・1行・縦連結で複数行）';
      case 'py_custom_expr': return 'カスタムPython（式）';
      // Part 2 descriptions
      case 'py_import_plt':    return 'matplotlib をインポートする';
      case 'py_plt_plot':      return '折れ線グラフを追加する（plt.plot）';
      case 'py_plt_bar':       return '棒グラフを追加する（plt.bar）';
      case 'py_plt_scatter':   return '散布図を追加する（plt.scatter）';
      case 'py_plt_hist':      return `ヒストグラムを追加する（bins=${block.getFieldValue('BINS')}）`;
      case 'py_plt_title':     return 'グラフのタイトルを設定する（plt.title）';
      case 'py_plt_xlabel':    return 'X軸ラベルを設定する（plt.xlabel）';
      case 'py_plt_ylabel':    return 'Y軸ラベルを設定する（plt.ylabel）';
      case 'py_plt_show':      return 'グラフを表示する（plt.show）';
      case 'py_import_stats':  return 'statistics をインポートする';
      case 'py_stats_mean':    return 'リストの平均（statistics.mean）';
      case 'py_stats_median':  return 'リストの中央値（statistics.median）';
      case 'py_stats_stdev':   return 'リストの標準偏差（statistics.stdev）';
      case 'py_stats_mode':    return 'リストの最頻値（statistics.mode）';
      case 'py_import_csv':    return 'csv をインポートする';
      case 'py_csv_read_rows': return `CSV「${block.getFieldValue('FILENAME')}」を読み込む`;
      case 'py_csv_get_col':   return `列 ${block.getFieldValue('COL')} を数値リストとして取り出す`;
      // Part 4 game
      case 'game_import_random': return 'random モジュールを読み込む';
      case 'game_random_int':    return `ランダム整数（${block.getFieldValue('LO')}〜${block.getFieldValue('HI')}）`;
      case 'game_timer_set':     return `タイマー変数「${getVarName(block, 'VAR')}」を SEC 秒後にセット`;
      case 'game_timer_done':    return `タイマー変数「${getVarName(block, 'VAR')}」の期限が来た`;
      case 'game_camera_set':    return 'カメラ位置（cam_x, cam_y）を更新';
      case 'game_world_to_screen_x': return 'ワールドX → 画面X（worldX − cam_x）';
      case 'game_world_to_screen_y': return 'ワールドY → 画面Y（worldY − cam_y）';
      case 'game_tilemap_create':    return 'タイルマップを作る（W×H, 初期値 FILL）';
      case 'game_tilemap_get':       return 'マップ[行Y][列X] を取り出す';
      case 'game_tilemap_set':       return 'マップ[行Y][列X] = VALUE';
      case 'game_tilemap_draw':      return 'タイルマップを描画する（cam_x, cam_y を引いて）';
      case 'game_gravity_apply':     return `重力で「${getVarName(block, 'Y')}」を更新（速度「${getVarName(block, 'VY')}」）`;
      case 'game_grid_rotate90':     return '2 次元配列を 90 度回転';
      case 'game_sound_load':        return '効果音を読み込む（Sound オブジェクト）';
      case 'game_sound_play':        return '効果音を鳴らす';
      case 'game_music_load_play':   return `BGM を再生${block.getFieldValue('LOOP') === 'TRUE' ? '（ループ）' : ''}`;
      case 'game_music_stop':        return 'BGM を止める';
      // Part 5/6 ml
      case 'ml_data_2d':    return `特徴量データ ${block.getFieldValue('DATA').slice(0, 20)}...`;
      case 'ml_label_list': return `ラベルデータ ${block.getFieldValue('DATA').slice(0, 20)}...`;
      default:                 return block.type;
    }
  }

  // コメント行を生成（トップレベルは区切り線付き、ネストは▶スタイル）
  function commentLine(block, indent) {
    const label = blockLabel(block);
    if (indent === '') {
      const bar = '─'.repeat(Math.max(0, 40 - label.length));
      return `# ┌─ ${label} ${bar}\n`;
    }
    return `${indent}# ▶ ${label}\n`;
  }

  // コメント表示フラグ（トグルボタンで切り替え）
  let showComments = true;
  let fileMode = false;

  // FieldVariable の表示名を安全に取得するヘルパー
  // FieldVariable は getFieldValue() が内部 ID を返すため、
  // getVariable().name で表示名を取得する
  function getVarName(block, fieldName) {
    const field = block.getField(fieldName || 'VAR');
    if (field && typeof field.getVariable === 'function') {
      const v = field.getVariable();
      if (v && v.name) return v.name;
    }
    return block.getFieldValue(fieldName || 'VAR') || fieldName || 'x';
  }

  function getSelectedBlockId() {
    try {
      if (typeof Blockly !== 'undefined' && Blockly.common && typeof Blockly.common.getSelected === 'function') {
        const sel = Blockly.common.getSelected();
        if (sel && sel.id != null) return sel.id;
      }
    } catch (e) { /* */ }
    try {
      if (typeof workspace.getSelected === 'function') {
        const b = workspace.getSelected();
        if (b && b.id != null) return b.id;
      }
      if (typeof workspace.getSelectedBlock === 'function') {
        const b = workspace.getSelectedBlock();
        if (b && b.id != null) return b.id;
      }
    } catch (e) { /* */ }
    return null;
  }

  /** markText + インラインブロック幅指定は CM5 の行描画を壊すことがあるため、行背景クラスのみ使う */
  function clearBlockSelectionHighlight() {
    try {
      const n = editor.lineCount();
      for (let i = 0; i < n; i++) {
        editor.removeLineClass(i, 'background', BLOCK_SEL_BG_CLASS);
      }
    } catch (e) { /* */ }
  }

  function paintBlockSelectionHighlight(blockId) {
    clearBlockSelectionHighlight();
    if (blockId == null || blockId === '') return;
    const info = blockLineMap.get(blockId);
    if (!info) return;
    const lc = editor.lineCount();
    if (info.from < 0 || info.from >= lc) return;
    const last = Math.min(info.to, lc - 1);
    if (last < info.from) return;
    try {
      for (let line = info.from; line <= last; line++) {
        editor.addLineClass(line, 'background', BLOCK_SEL_BG_CLASS);
      }
      editor.scrollIntoView({ line: info.from, ch: 0 }, 80);
    } catch (err) {
      console.warn('paintBlockSelectionHighlight', err);
    }
  }

  function refreshBlockSelectionHighlight() {
    paintBlockSelectionHighlight(getSelectedBlockId());
  }

  function valueToCode(block, inputName, defaultVal) {
    if (defaultVal === undefined) defaultVal = '0';
    const input = block.getInput(inputName);
    if (!input || !input.connection || !input.connection.targetBlock()) {
      return String(defaultVal);
    }
    return valueBlockToCode(input.connection.targetBlock());
  }

  function valueBlockToCode(block) {
    if (!block) return '0';
    switch (block.type) {
      case 'val_var':
        return getVarName(block, 'VAR') || 'x';
      case 'val_number':
        return String(block.getFieldValue('NUM') !== null ? block.getFieldValue('NUM') : '0');
      case 'val_str': {
        const text = block.getFieldValue('TEXT') || '';
        return JSON.stringify(text);
      }
      case 'val_bool':
        return block.getFieldValue('BOOL') === 'True' ? 'True' : 'False';
      case 'colour_picker': {
        const hex = block.getFieldValue('COLOUR') || '#ffffff';
        return JSON.stringify(hex);
      }
      case 'py_math_op': {
        const left  = valueToCode(block, 'LEFT', '0');
        const right = valueToCode(block, 'RIGHT', '0');
        const op    = block.getFieldValue('OP');
        // (0 - x) を単項マイナス -x に短縮（Python の慣用表現）
        if (op === '-' && String(left).trim() === '0') {
          return `-${right}`;
        }
        // 子の py_math_op の op を見て、Python 演算子優先度に従い必要時のみ括弧を付ける
        const prec = (o) => (o === '*' || o === '/' || o === '//' || o === '%') ? 2
                          : (o === '+' || o === '-') ? 1
                          : 0;
        const leftBlk  = block.getInputTargetBlock ? block.getInputTargetBlock('LEFT')  : null;
        const rightBlk = block.getInputTargetBlock ? block.getInputTargetBlock('RIGHT') : null;
        const leftOp  = (leftBlk  && leftBlk.type  === 'py_math_op') ? leftBlk.getFieldValue('OP')  : null;
        const rightOp = (rightBlk && rightBlk.type === 'py_math_op') ? rightBlk.getFieldValue('OP') : null;
        const myPrec    = prec(op);
        const leftPrec  = leftOp  ? prec(leftOp)  : 99;
        const rightPrec = rightOp ? prec(rightOp) : 99;
        const associative = (op === '+' || op === '*');
        const lw = (leftPrec < myPrec) ? `(${left})` : left;
        const rw = (rightPrec < myPrec || (rightPrec === myPrec && !associative)) ? `(${right})` : right;
        return `${lw} ${op} ${rw}`;
      }
      case 'py_str_concat': {
        const a = valueToCode(block, 'A', '""');
        const b = valueToCode(block, 'B', '""');
        return `(str(${a}) + str(${b}))`;
      }
      case 'cond_compare': {
        const left  = valueToCode(block, 'LEFT', '0');
        const right = valueToCode(block, 'RIGHT', '0');
        const op    = block.getFieldValue('OP');
        // 比較は優先度が高く、論理演算子の中でも括弧不要
        return `${left} ${op} ${right}`;
      }
      case 'cond_and': {
        const a = valueToCode(block, 'A', 'True');
        const b = valueToCode(block, 'B', 'True');
        const cmpRe = /^(.+?) (==|!=|<=|>=|<|>) (.+)$/;
        const ma = cmpRe.exec(a);
        const mb = cmpRe.exec(b);
        if (ma && mb && ma[3] === mb[1]) {
          return `${ma[1]} ${ma[2]} ${ma[3]} ${mb[2]} ${mb[3]}`;
        }
        const aw = hasTopLevelKeyword(a, ' or ') ? `(${a})` : a;
        const bw = hasTopLevelKeyword(b, ' or ') ? `(${b})` : b;
        return `${aw} and ${bw}`;
      }
      case 'cond_or': {
        const a = valueToCode(block, 'A', 'False');
        const b = valueToCode(block, 'B', 'False');
        return `${a} or ${b}`;
      }
      case 'cond_not': {
        const a = valueToCode(block, 'A', 'True');
        return `not ${a}`;
      }
      case 'pico_digital_read_val': {
        const pin = block.getFieldValue('PIN');
        return `Pin(${pin}, Pin.IN).value()`;
      }
      case 'pico_analog_read_val': {
        const pin = block.getFieldValue('PIN');
        return `ADC(${pin}).read_u16()`;
      }
      case 'pvb_switch_val': {
        const sw = block.getFieldValue('SW');
        return `(Pin(${sw}, Pin.IN, Pin.PULL_UP).value() == 0)`;
      }
      case 'pvb_line_val': {
        const sensor = block.getFieldValue('SENSOR');
        return `ADC(${sensor}).read_u16()`;
      }
      case 'pvb_sonar_val':
        return '_pvb_sonar_cm()';
      case 'py_list_empty':
        return '[]';
      case 'py_list_get': {
        const listName = getVarName(block, 'LIST');
        const idx = valueToCode(block, 'INDEX', '0');
        return `${listName}[${idx}]`;
      }
      case 'py_list_len': {
        const listName = getVarName(block, 'LIST');
        return `len(${listName})`;
      }
      case 'py_list_contains': {
        const lcList = getVarName(block, 'LIST');
        const lcItem = valueToCode(block, 'ITEM', 'None');
        return `${lcItem} in ${lcList}`;
      }
      case 'py_fstring': {
        const pre  = block.getFieldValue('PRE') || '';
        const post = block.getFieldValue('POST') || '';
        const val  = valueToCode(block, 'VAR', '""');
        // 二重引用符のみの f"..." だと {stats["hits"]} など式内の " が文字列を閉じて SyntaxError になる。
        // 外側は単引用符 f'...' にし、PRE/POST に含まれる ' のみエスケープする。
        function escSingleQuotedChunk(s) {
          return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        }
        return `f'${escSingleQuotedChunk(pre)}{${val}}${escSingleQuotedChunk(post)}'`;
      }
      case 'py_fstring_fmt': {
        const fmtPre = block.getFieldValue('PRE') || '';
        const fmtFmt = block.getFieldValue('FMT') || '';
        const fmtVal = valueToCode(block, 'VAR', '""');
        function escSQ(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
        return `f'${escSQ(fmtPre)}{${fmtVal}:${fmtFmt}}'`;
      }
      case 'py_tuple_literal': {
        const tupleItems = [];
        for (let i = 0; i < (block.itemCount_ || 2); i++) {
          tupleItems.push(valueToCode(block, 'ITEM' + i, 'None'));
        }
        if (tupleItems.length === 1) return `(${tupleItems[0]},)`;
        return `(${tupleItems.join(', ')})`;
      }
      case 'py_set_literal': {
        const setItems = [];
        for (let i = 0; i < (block.itemCount_ || 2); i++) {
          setItems.push(valueToCode(block, 'ITEM' + i, 'None'));
        }
        return `{${setItems.join(', ')}}`;
      }
      case 'py_list_literal': {
        const listLitItems = [];
        for (let i = 0; i < (block.itemCount_ || 0); i++) {
          listLitItems.push(valueToCode(block, 'ITEM' + i, 'None'));
        }
        return `[${listLitItems.join(', ')}]`;
      }
      case 'py_list_comp': {
        const lcExpr = valueToCode(block, 'EXPR', 'x');
        const lcVar  = getVarName(block, 'VAR');
        const lcList = valueToCode(block, 'LIST', '[]');
        return `[${lcExpr} for ${lcVar} in ${lcList}]`;
      }
      case 'py_list_comp_if': {
        const lciExpr = valueToCode(block, 'EXPR', 'x');
        const lciVar  = getVarName(block, 'VAR');
        const lciList = valueToCode(block, 'LIST', '[]');
        const lciCond = valueToCode(block, 'COND', 'True');
        return `[${lciExpr} for ${lciVar} in ${lciList} if ${lciCond}]`;
      }
      case 'py_ternary': {
        const thenVal = valueToCode(block, 'THEN', 'None');
        const condVal = valueToCode(block, 'COND', 'True');
        const elseVal = valueToCode(block, 'ELSE', 'None');
        return `${thenVal} if ${condVal} else ${elseVal}`;
      }
      case 'py_dict_comp': {
        const dcKey  = valueToCode(block, 'KEY', 'k');
        const dcVal  = valueToCode(block, 'VALUE', 'v');
        const dcVar  = getVarName(block, 'VAR');
        const dcList = valueToCode(block, 'LIST', '[]');
        return `{${dcKey}: ${dcVal} for ${dcVar} in ${dcList}}`;
      }
      case 'py_set_comp': {
        const scExpr = valueToCode(block, 'EXPR', 'x');
        const scVar  = getVarName(block, 'VAR');
        const scList = valueToCode(block, 'LIST', '[]');
        return `{${scExpr} for ${scVar} in ${scList}}`;
      }
      case 'py_sorted_call': {
        const sortList    = getVarName(block, 'LIST');
        const sortReverse = block.getFieldValue('REVERSE') || 'False';
        return `sorted(${sortList}, reverse=${sortReverse})`;
      }
      case 'py_sorted_key_func': {
        const skList = getVarName(block, 'LIST');
        const skKey  = block.getFieldValue('KEY') || 'len';
        return `sorted(${skList}, key=${skKey})`;
      }
      case 'py_sorted_dict_two_keys': {
        const sdList = getVarName(block, 'LIST');
        const sdKey1 = block.getFieldValue('KEY1') || 'key1';
        const sdRev1 = block.getFieldValue('REV1');
        const sdKey2 = block.getFieldValue('KEY2') || 'key2';
        const sdRev2 = block.getFieldValue('REV2');
        const expr1 = sdRev1 === 'desc' ? `-_s["${sdKey1}"]` : `_s["${sdKey1}"]`;
        const expr2 = sdRev2 === 'desc' ? `-_s["${sdKey2}"]` : `_s["${sdKey2}"]`;
        return `sorted(${sdList}, key=lambda _s: (${expr1}, ${expr2}))`;
      }
      case 'py_min_call':
        return `min(${getVarName(block, 'LIST')})`;
      case 'py_max_call':
        return `max(${getVarName(block, 'LIST')})`;
      case 'py_sum_call':
        return `sum(${getVarName(block, 'LIST')})`;
      case 'py_str_split': {
        const strSplitVar = getVarName(block, 'VAR');
        const strSplitSep = block.getFieldValue('SEP') || '';
        return strSplitSep ? `${strSplitVar}.split(${JSON.stringify(strSplitSep)})` : `${strSplitVar}.split()`;
      }
      case 'py_str_strip': {
        return `${getVarName(block, 'VAR')}.strip()`;
      }
      case 'py_str_replace': {
        const strReplVar = getVarName(block, 'VAR');
        const strReplOld = block.getFieldValue('OLD') || '';
        const strReplNew = block.getFieldValue('NEW') || '';
        return `${strReplVar}.replace(${JSON.stringify(strReplOld)}, ${JSON.stringify(strReplNew)})`;
      }
      case 'py_str_find': {
        const strFindVar = getVarName(block, 'VAR');
        const strFindSub = block.getFieldValue('SUB') || '';
        return `${strFindVar}.find(${JSON.stringify(strFindSub)})`;
      }
      case 'py_str_join': {
        const joinSep = block.getFieldValue('SEP') || '';
        const joinList = getVarName(block, 'LIST');
        return `${JSON.stringify(joinSep)}.join(${joinList})`;
      }
      case 'py_str_lstrip': {
        return `${getVarName(block, 'VAR')}.lstrip()`;
      }
      case 'py_str_rstrip': {
        return `${getVarName(block, 'VAR')}.rstrip()`;
      }
      case 'py_str_find_from': {
        const findFromVar = getVarName(block, 'VAR');
        const findFromSub = block.getFieldValue('SUB') || '';
        const findFromStart = block.getFieldValue('START') || 0;
        return `${findFromVar}.find(${JSON.stringify(findFromSub)}, ${findFromStart})`;
      }
      case 'py_range': {
        const rStart = block.getFieldValue('START') || 0;
        const rStop  = block.getFieldValue('STOP')  || 10;
        return String(rStart) === '0' ? `range(${rStop})` : `range(${rStart}, ${rStop})`;
      }
      case 'py_str_upper': {
        return `${getVarName(block, 'VAR')}.upper()`;
      }
      case 'py_tuple_unpack': {
        return `${getVarName(block, 'VAR_X')}, ${getVarName(block, 'VAR_Y')} = ${getVarName(block, 'SRC')}`;
      }
      case 'py_print2': {
        return `print(${getVarName(block, 'VAR_A')}, ${getVarName(block, 'VAR_B')})`;
      }
      case 'py_set_op': {
        const setA  = getVarName(block, 'SET_A');
        const setOp = block.getFieldValue('OP') || '|';
        const setB  = getVarName(block, 'SET_B');
        return `${setA} ${setOp} ${setB}`;
      }
      case 'py_list_dedup': {
        return `list(set(${getVarName(block, 'LIST')}))`;
      }
      case 'py_dict_val_literal': {
        const dvk0 = valueToCode(block, 'KEY0', 'None');
        const dvv0 = valueToCode(block, 'VAL0', 'None');
        const dvk1 = valueToCode(block, 'KEY1', 'None');
        const dvv1 = valueToCode(block, 'VAL1', 'None');
        return `{${dvk0}: ${dvv0}, ${dvk1}: ${dvv1}}`;
      }
      case 'py_frozenset': {
        const fsVal = valueToCode(block, 'VALUE', '[]');
        return `frozenset(${fsVal})`;
      }
      case 'py_type_of': {
        return `type(${getVarName(block, 'VAR')})`;
      }
      case 'py_sorted_tuple_idx': {
        const stiList = getVarName(block, 'LIST');
        const stiIdx  = block.getFieldValue('IDX') || '1';
        const stiRev  = block.getFieldValue('REV') || 'False';
        return `sorted(${stiList}, key=lambda x: x[${stiIdx}], reverse=${stiRev})`;
      }
      case 'py_sorted_set': {
        return `sorted(set(${getVarName(block, 'LIST')}))`;
      }
      case 'py_fstring2': {
        const f2Pre  = block.getFieldValue('PRE')  || '';
        const f2V1   = getVarName(block, 'VAR1');
        const f2Mid  = block.getFieldValue('MID')  || '';
        const f2V2   = getVarName(block, 'VAR2');
        const f2Post = block.getFieldValue('POST') || '';
        return `f"${f2Pre}{${f2V1}}${f2Mid}{${f2V2}}${f2Post}"`;
      }
      case 'py_list_pop': {
        return `${getVarName(block, 'LIST')}.pop()`;
      }
      case 'py_map_call': {
        const mapList = getVarName(block, 'LIST');
        const mapType = block.getFieldValue('TYPE') || 'int';
        return `list(map(${mapType}, ${mapList}))`;
      }

      // ===== 0-29: アルゴリズムまとめ演習 追加ブロック =====
      case 'py_set_empty': {
        return 'set()';
      }
      case 'py_bisect_left': {
        const blList = getVarName(block, 'LIST');
        const blVal  = valueToCode(block, 'VALUE', '0');
        return `bisect.bisect_left(${blList}, ${blVal})`;
      }
      case 'py_bisect_right': {
        const brList = getVarName(block, 'LIST');
        const brVal  = valueToCode(block, 'VALUE', '0');
        return `bisect.bisect_right(${brList}, ${brVal})`;
      }
      case 'py_str_isdigit': {
        const isdigVal = valueToCode(block, 'VALUE', '""');
        return `${isdigVal}.isdigit()`;
      }
      case 'py_list_slice': {
        const lsList  = getVarName(block, 'LIST');
        const lsStart = valueToCode(block, 'START', '');
        const lsStop  = valueToCode(block, 'STOP',  '');
        return `${lsList}[${lsStart}:${lsStop}]`;
      }
      case 'py_list_get_negative': {
        const lgnList   = getVarName(block, 'LIST');
        const lgnOffset = block.getFieldValue('OFFSET') || '1';
        return `${lgnList}[-${lgnOffset}]`;
      }
      case 'py_call_val3': {
        const cv3Name = getVarName(block, 'NAME');
        const cv3A1   = valueToCode(block, 'ARG1', '');
        const cv3A2   = valueToCode(block, 'ARG2', '');
        const cv3A3   = valueToCode(block, 'ARG3', '');
        return `${cv3Name}(${cv3A1}, ${cv3A2}, ${cv3A3})`;
      }
      case 'py_fstring3': {
        const f3Pre  = block.getFieldValue('PRE')  || '';
        const f3M1   = block.getFieldValue('MID1') || '';
        const f3M2   = block.getFieldValue('MID2') || '';
        const f3Post = block.getFieldValue('POST') || '';
        const f3V1   = valueToCode(block, 'VAR1', '""');
        const f3V2   = valueToCode(block, 'VAR2', '""');
        const f3V3   = valueToCode(block, 'VAR3', '""');
        function escSQf3(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
        return `f'${escSQf3(f3Pre)}{${f3V1}}${escSQf3(f3M1)}{${f3V2}}${escSQf3(f3M2)}{${f3V3}}${escSQf3(f3Post)}'`;
      }
      case 'py_deque_init': {
        const dqInit = valueToCode(block, 'VALUE', '[]');
        return `deque(${dqInit})`;
      }
      case 'py_deque_popleft': {
        return `${getVarName(block, 'DEQUE')}.popleft()`;
      }
      case 'py_list_pop_val': {
        return `${getVarName(block, 'LIST')}.pop()`;
      }

      // ===== Part 2: statistics value ブロック =====
      case 'py_stats_mean':
        return `statistics.mean(${valueToCode(block, 'DATA', '[]')})`;
      case 'py_stats_median':
        return `statistics.median(${valueToCode(block, 'DATA', '[]')})`;
      case 'py_stats_stdev':
        return `statistics.stdev(${valueToCode(block, 'DATA', '[]')})`;
      case 'py_stats_mode':
        return `statistics.mode(${valueToCode(block, 'DATA', '[]')})`;

      case 'py_dict_new':
        return '{}';
      case 'py_dict_literal': {
        const pairs = [];
        for (let i = 0; i < block.itemCount_; i++) {
          const key = block.getFieldValue('KEY' + i) || ('key' + (i + 1));
          const val = valueToCode(block, 'PAIR' + i, 'None');
          pairs.push(`"${key}": ${val}`);
        }
        return `{${pairs.join(', ')}}`;
      }
      case 'py_dict_get': {
        const dictName = getVarName(block, 'DICT');
        const key = valueToCode(block, 'KEY', '""');
        return `${dictName}[${key}]`;
      }
      case 'py_dict_get_default': {
        const dgdDict = getVarName(block, 'DICT');
        const dgdKey = valueToCode(block, 'KEY', '""');
        const dgdDefault = valueToCode(block, 'DEFAULT', '0');
        return `${dgdDict}.get(${dgdKey}, ${dgdDefault})`;
      }
      case 'py_dict_keys': {
        const dictName = getVarName(block, 'DICT');
        return `list(${dictName}.keys())`;
      }
      case 'py_random_int': {
        const from = valueToCode(block, 'FROM', '1');
        const to   = valueToCode(block, 'TO', '10');
        return `random.randint(${from}, ${to})`;
      }
      case 'py_type_cast': {
        const val  = valueToCode(block, 'VALUE', '0');
        const type = block.getFieldValue('TYPE');
        return `${type}(${val})`;
      }
      case 'py_abs': {
        const val = stripOuterParens(valueToCode(block, 'VALUE', '0'));
        return `abs(${val})`;
      }
      case 'py_round': {
        const val    = valueToCode(block, 'VALUE', '0');
        const digits = valueToCode(block, 'DIGITS', '2');
        return `round(${val}, ${digits})`;
      }
      case 'py_int': {
        const val = stripOuterParens(valueToCode(block, 'VALUE', '0'));
        return `int(${val})`;
      }
      case 'py_min2': {
        const a = stripOuterParens(valueToCode(block, 'A', '0'));
        const b = stripOuterParens(valueToCode(block, 'B', '0'));
        return `min(${a}, ${b})`;
      }
      case 'py_max2': {
        const a = stripOuterParens(valueToCode(block, 'A', '0'));
        const b = stripOuterParens(valueToCode(block, 'B', '0'));
        return `max(${a}, ${b})`;
      }
      case 'py_call_val': {
        const name = getVarName(block, 'NAME');
        const arg  = valueToCode(block, 'ARG', '');
        return `${name}(${arg})`;
      }
      case 'py_call_val2': {
        const cv2Name = getVarName(block, 'NAME');
        const cv2Arg1 = valueToCode(block, 'ARG1', '');
        const cv2Arg2 = valueToCode(block, 'ARG2', '');
        return `${cv2Name}(${cv2Arg1}, ${cv2Arg2})`;
      }
      case 'py_fstring2_expr': {
        const f2ePre  = block.getFieldValue('PRE')  || '';
        const f2eMid  = block.getFieldValue('MID')  || '';
        const f2ePost = block.getFieldValue('POST') || '';
        const f2eV1   = valueToCode(block, 'VAR1', '""');
        const f2eV2   = valueToCode(block, 'VAR2', '""');
        function escSQf2(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
        return `f'${escSQf2(f2ePre)}{${f2eV1}}${escSQf2(f2eMid)}{${f2eV2}}${escSQf2(f2ePost)}'`;
      }
      case 'py_list_range': {
        const lrN = block.getFieldValue('N') || '10';
        return `list(range(${lrN}))`;
      }
      case 'py_module_call_val': {
        const mod  = block.getFieldValue('MODULE');
        const func = block.getFieldValue('FUNC');
        const arg  = valueToCode(block, 'ARG', '');
        if (!mod || mod === '__none__') return `${func}(${arg})`;
        return `${mod}.${func}(${arg})`;
      }
      case 'game_key_pressed': {
        const key = block.getFieldValue('KEY') || 'K_RIGHT';
        return `pygame.key.get_pressed()[pygame.${key}]`;
      }
      case 'game_keys_held': {
        const v = getVarName(block, 'VAR');
        const key = block.getFieldValue('KEY') || 'K_RIGHT';
        return `${v}[pygame.${key}]`;
      }
      case 'game_rect': {
        const x = valueToCode(block, 'X', '0');
        const y = valueToCode(block, 'Y', '0');
        const w = valueToCode(block, 'W', '10');
        const h = valueToCode(block, 'H', '10');
        return `pygame.Rect(${x}, ${y}, ${w}, ${h})`;
      }
      case 'game_collide': {
        const a = valueToCode(block, 'A', 'pygame.Rect(0, 0, 1, 1)');
        const b = valueToCode(block, 'B', 'pygame.Rect(0, 0, 1, 1)');
        return `${a}.colliderect(${b})`;
      }
      case 'game_rect_collidepoint': {
        const r = valueToCode(block, 'RECT', 'pygame.Rect(0, 0, 1, 1)');
        const x = valueToCode(block, 'X', '0');
        const y = valueToCode(block, 'Y', '0');
        return `${r}.collidepoint(${x}, ${y})`;
      }
      case 'game_rect_union': {
        const a = valueToCode(block, 'A', 'pygame.Rect(0, 0, 1, 1)');
        const b = valueToCode(block, 'B', 'pygame.Rect(0, 0, 1, 1)');
        return `${a}.union(${b})`;
      }
      case 'game_color':
        return JSON.stringify(block.getFieldValue('COLOR'));
      case 'game_image_preset':
        return JSON.stringify(block.getFieldValue('IMG'));
      case 'game_sound_preset':
        return JSON.stringify(block.getFieldValue('SE'));
      case 'game_music_preset':
        return JSON.stringify(block.getFieldValue('BGM'));
      case 'game_get_ticks':
        return 'pygame.time.get_ticks()';
      case 'game_mouse_x':
        return 'pygame.mouse.get_pos()[0]';
      case 'game_mouse_y':
        return 'pygame.mouse.get_pos()[1]';
      case 'game_mouse_pressed': {
        const btn = block.getFieldValue('BTN') || '0';
        return `pygame.mouse.get_pressed()[${btn}]`;
      }
      case 'game_rect_attr': {
        const rect = valueToCode(block, 'RECT', 'pygame.Rect(0,0,0,0)');
        const attr = block.getFieldValue('ATTR') || 'x';
        return `${rect}.${attr}`;
      }
      case 'py_self_get': {
        const attr = block.getFieldValue('ATTR');
        return `self.${attr}`;
      }
      case 'py_new_instance': {
        const name = block.getFieldValue('NAME');
        const arg  = valueToCode(block, 'ARG', '');
        return `${name}(${arg})`;
      }
      case 'py_attr_get': {
        const inst = getVarName(block, 'INST');
        const attr = block.getFieldValue('ATTR');
        return `${inst}.${attr}`;
      }
      case 'py_custom_expr': {
        let raw = block.getFieldValue('CODE');
        if (raw === undefined || raw === null) raw = '';
        raw = String(raw).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')[0].trim();
        return raw || 'None';
      }
      case 'game_random_int': {
        const lo = block.getFieldValue('LO') || '0';
        const hi = block.getFieldValue('HI') || '576';
        return `random.randint(${lo}, ${hi})`;
      }
      case 'game_timer_done': {
        const tdVar = getVarName(block, 'VAR');
        return `pygame.time.get_ticks() >= ${tdVar}`;
      }
      case 'game_world_to_screen_x': {
        const wx = valueToCode(block, 'X', '0');
        return `${wx} - cam_x`;
      }
      case 'game_world_to_screen_y': {
        const wy = valueToCode(block, 'Y', '0');
        return `${wy} - cam_y`;
      }
      case 'game_tilemap_create': {
        const tw = valueToCode(block, 'W', '10');
        const th = valueToCode(block, 'H', '10');
        const tf = valueToCode(block, 'FILL', '0');
        return `[[${tf}] * ${tw} for _ in range(${th})]`;
      }
      case 'game_tilemap_get': {
        const tg = valueToCode(block, 'MAP', 'tilemap');
        const ty = valueToCode(block, 'Y', '0');
        const tx = valueToCode(block, 'X', '0');
        return `${tg}[${ty}][${tx}]`;
      }
      case 'game_grid_rotate90': {
        const gg = valueToCode(block, 'GRID', 'grid');
        return `[list(_row) for _row in zip(*${gg}[::-1])]`;
      }
      case 'game_sound_load': {
        const url = valueToCode(block, 'URL', '"assets/audio/se/se_jump.wav"');
        return `pygame.mixer.Sound(${url})`;
      }
      case 'ml_data_2d': {
        return block.getFieldValue('DATA') || '[]';
      }
      case 'ml_label_list': {
        return block.getFieldValue('DATA') || '[]';
      }
      default:
        return '0';
    }
  }

  // ブロックをMicroPythonコードに変換（再帰）
  function blockToCode(block, indent) {
    if (!block) return '';
    indent = indent || '';
    const blockOwnFrom = _emitCtx.line;
    let code = '';
    if (showComments) {
      code = appendLocal(code, commentLine(block, indent));
    }

    switch (block.type) {

      // ===== ゲームモード（pygame互換） =====
      case 'game_init': {
        const ln0 = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'W', ln0);
        registerExprBlocksAtLineFromInput(block, 'H', ln0);
        registerExprBlocksAtLineFromInput(block, 'TITLE', ln0);
        const w = valueToCode(block, 'W', '480');
        const h = valueToCode(block, 'H', '320');
        const title = valueToCode(block, 'TITLE', '"ゲーム"');
        code = appendLocal(code, indent + `pygame.init()\n`);
        code = appendLocal(code, indent + `screen = pygame.display.set_mode((${w}, ${h}))\n`);
        code = appendLocal(code, indent + `pygame.display.set_caption(${title})\n`);
        code = appendLocal(code, indent + `clock = pygame.time.Clock()\n`);
        break;
      }
      case 'game_loop': {
        if (!_emitCtx.runningPreset) {
          code = appendLocal(code, indent + `running = True\n`);
        }
        code = appendLocal(code, indent + `while running:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'game_events': {
        code = appendLocal(code, indent + `for event in pygame.event.get():\n`);
        code = appendLocal(code, indent + `    if event.type == pygame.QUIT:\n`);
        code = appendLocal(code, indent + `        running = False\n`);
        break;
      }
      case 'game_fill': {
        const lnFill = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'COLOR', lnFill);
        const c = valueToCode(block, 'COLOR', '"#000000"');
        code = appendLocal(code, indent + `screen.fill(${c})\n`);
        break;
      }
      case 'game_draw_rect': {
        const ln = _emitCtx.line;
        ['X', 'Y', 'W', 'H', 'COLOR'].forEach(function(n) { registerExprBlocksAtLineFromInput(block, n, ln); });
        const x = valueToCode(block, 'X', '0');
        const y = valueToCode(block, 'Y', '0');
        const w = valueToCode(block, 'W', '10');
        const h = valueToCode(block, 'H', '10');
        const c = valueToCode(block, 'COLOR', '"#ffffff"');
        code = appendLocal(code, indent + `pygame.draw.rect(screen, ${c}, (${x}, ${y}, ${w}, ${h}))\n`);
        break;
      }
      case 'game_draw_circle': {
        const ln = _emitCtx.line;
        ['X', 'Y', 'R', 'COLOR'].forEach(function(n) { registerExprBlocksAtLineFromInput(block, n, ln); });
        const x = valueToCode(block, 'X', '0');
        const y = valueToCode(block, 'Y', '0');
        const r = valueToCode(block, 'R', '10');
        const c = valueToCode(block, 'COLOR', '"#ffffff"');
        code = appendLocal(code, indent + `pygame.draw.circle(screen, ${c}, (${x}, ${y}), ${r})\n`);
        break;
      }
      case 'game_draw_line': {
        const ln = _emitCtx.line;
        ['X1', 'Y1', 'X2', 'Y2', 'COLOR', 'THICK'].forEach(function(n) { registerExprBlocksAtLineFromInput(block, n, ln); });
        const x1 = valueToCode(block, 'X1', '0');
        const y1 = valueToCode(block, 'Y1', '0');
        const x2 = valueToCode(block, 'X2', '0');
        const y2 = valueToCode(block, 'Y2', '0');
        const c  = valueToCode(block, 'COLOR', '"#ffffff"');
        const thickBlk = block.getInputTargetBlock && block.getInputTargetBlock('THICK');
        if (thickBlk) {
          const th = valueToCode(block, 'THICK', '1');
          code = appendLocal(code, indent + `pygame.draw.line(screen, ${c}, (${x1}, ${y1}), (${x2}, ${y2}), ${th})\n`);
        } else {
          code = appendLocal(code, indent + `pygame.draw.line(screen, ${c}, (${x1}, ${y1}), (${x2}, ${y2}))\n`);
        }
        break;
      }
      case 'game_draw_text': {
        const ln = _emitCtx.line;
        ['TEXT', 'X', 'Y', 'SIZE', 'COLOR', 'FONT'].forEach(function(n) { registerExprBlocksAtLineFromInput(block, n, ln); });
        const t = valueToCode(block, 'TEXT', '"Hello"');
        const x = valueToCode(block, 'X', '0');
        const y = valueToCode(block, 'Y', '0');
        const c = valueToCode(block, 'COLOR', '"#ffffff"');
        const fontBlk = block.getInputTargetBlock && block.getInputTargetBlock('FONT');
        if (fontBlk) {
          const f = valueToCode(block, 'FONT', 'pygame.font.SysFont(None, 24)');
          code = appendLocal(code, indent + `screen.blit(${f}.render(${t}, True, ${c}), (${x}, ${y}))\n`);
        } else {
          const s = valueToCode(block, 'SIZE', '24');
          code = appendLocal(code, indent + `_f = pygame.font.SysFont(None, ${s})\n`);
          code = appendLocal(code, indent + `screen.blit(_f.render(${t}, True, ${c}), (${x}, ${y}))\n`);
        }
        break;
      }
      case 'game_keys_capture': {
        const v = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `${v} = pygame.key.get_pressed()\n`);
        break;
      }
      case 'game_mouse_capture': {
        const mx = getVarName(block, 'MX');
        const my = getVarName(block, 'MY');
        code = appendLocal(code, indent + `${mx}, ${my} = pygame.mouse.get_pos()\n`);
        break;
      }
      case 'game_font_set': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'SIZE', ln);
        const v = getVarName(block, 'VAR');
        const s = valueToCode(block, 'SIZE', '24');
        code = appendLocal(code, indent + `${v} = pygame.font.SysFont(None, ${s})\n`);
        break;
      }
      case 'game_text_render': {
        const ln = _emitCtx.line;
        ['FONT', 'TEXT', 'COLOR'].forEach(n => registerExprBlocksAtLineFromInput(block, n, ln));
        const v = getVarName(block, 'VAR');
        const f = valueToCode(block, 'FONT', 'pygame.font.SysFont(None, 24)');
        const t = valueToCode(block, 'TEXT', '"Hello"');
        const c = valueToCode(block, 'COLOR', '"#ffffff"');
        code = appendLocal(code, indent + `${v} = ${f}.render(${t}, True, ${c})\n`);
        break;
      }
      case 'game_blit_surface': {
        const ln = _emitCtx.line;
        ['SURF', 'X', 'Y'].forEach(n => registerExprBlocksAtLineFromInput(block, n, ln));
        const s = valueToCode(block, 'SURF', 'None');
        const x = valueToCode(block, 'X', '0');
        const y = valueToCode(block, 'Y', '0');
        code = appendLocal(code, indent + `screen.blit(${s}, (${x}, ${y}))\n`);
        break;
      }
      case 'game_image_blit': {
        const ln = _emitCtx.line;
        ['URL', 'X', 'Y', 'W', 'H'].forEach(n => registerExprBlocksAtLineFromInput(block, n, ln));
        const url = valueToCode(block, 'URL', '"assets/game-icons/player_ship.svg"');
        const x = valueToCode(block, 'X', '0');
        const y = valueToCode(block, 'Y', '0');
        const wBlk = block.getInputTargetBlock && block.getInputTargetBlock('W');
        const hBlk = block.getInputTargetBlock && block.getInputTargetBlock('H');
        if (wBlk && hBlk) {
          const w = valueToCode(block, 'W', '32');
          const h = valueToCode(block, 'H', '32');
          code = appendLocal(code, indent + `screen.blit(pygame.image.load(${url}), (${x}, ${y}, ${w}, ${h}))\n`);
        } else {
          code = appendLocal(code, indent + `screen.blit(pygame.image.load(${url}), (${x}, ${y}))\n`);
        }
        break;
      }
      case 'game_draw_image': {
        const ln = _emitCtx.line;
        ['URL', 'X', 'Y', 'W', 'H', 'ROT'].forEach(function(n) { registerExprBlocksAtLineFromInput(block, n, ln); });
        const url = valueToCode(block, 'URL', '"https://example.com/player.png"');
        const x = valueToCode(block, 'X', '0');
        const y = valueToCode(block, 'Y', '0');
        const w = valueToCode(block, 'W', '-1');
        const h = valueToCode(block, 'H', '-1');
        const rot = valueToCode(block, 'ROT', '0');
        const flip = (block.getFieldValue && block.getFieldValue('FLIP')) || 'NONE';
        code = appendLocal(code, indent + `_img = pygame.image.load(${url})\n`);
        code = appendLocal(code, indent + `_rw = ${w}; _rh = ${h}\n`);
        code = appendLocal(code, indent + `_img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img\n`);
        // 回転行は ROT が 0 リテラル以外の場合のみ出す（記事のシンプル例と整合）
        if (rot !== '0') {
          code = appendLocal(code, indent + `_rot_deg = ${rot}\n`);
          code = appendLocal(code, indent + `_img = pygame.transform.rotate(_img, _rot_deg) if _rot_deg != 0 else _img\n`);
        }
        if (flip === 'X') {
          code = appendLocal(code, indent + `_img = pygame.transform.flip(_img, True, False)\n`);
        } else if (flip === 'Y') {
          code = appendLocal(code, indent + `_img = pygame.transform.flip(_img, False, True)\n`);
        } else if (flip === 'XY') {
          code = appendLocal(code, indent + `_img = pygame.transform.flip(_img, True, True)\n`);
        }
        code = appendLocal(code, indent + `screen.blit(_img, (${x}, ${y}))\n`);
        break;
      }
      case 'game_flip': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'FPS', ln);
        const fps = valueToCode(block, 'FPS', '60');
        code = appendLocal(code, indent + `pygame.display.flip()\n`);
        code = appendLocal(code, indent + `clock.tick(${fps})\n`);
        break;
      }
      case 'game_quit': {
        code = appendLocal(code, indent + `pygame.quit()\n`);
        break;
      }
      case 'game_import_random': {
        code = appendLocal(code, indent + `import random\n`);
        break;
      }
      case 'game_timer_set': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'SEC', ln);
        const tsVar = getVarName(block, 'VAR');
        const tsSec = valueToCode(block, 'SEC', '3');
        code = appendLocal(code, indent + `${tsVar} = pygame.time.get_ticks() + ${tsSec} * 1000\n`);
        break;
      }
      case 'game_camera_set': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'OX', ln);
        registerExprBlocksAtLineFromInput(block, 'OY', ln);
        const ox = valueToCode(block, 'OX', '0');
        const oy = valueToCode(block, 'OY', '0');
        code = appendLocal(code, indent + `cam_x = ${ox}\n`);
        code = appendLocal(code, indent + `cam_y = ${oy}\n`);
        break;
      }
      case 'game_tilemap_set': {
        const ln = _emitCtx.line;
        ['MAP', 'Y', 'X', 'VALUE'].forEach(n => registerExprBlocksAtLineFromInput(block, n, ln));
        const tsm = valueToCode(block, 'MAP', 'tilemap');
        const tsy = valueToCode(block, 'Y', '0');
        const tsx = valueToCode(block, 'X', '0');
        const tsv = valueToCode(block, 'VALUE', '0');
        code = appendLocal(code, indent + `${tsm}[${tsy}][${tsx}] = ${tsv}\n`);
        break;
      }
      case 'game_tilemap_draw': {
        const ln = _emitCtx.line;
        ['MAP', 'TILE', 'IMAGES'].forEach(n => registerExprBlocksAtLineFromInput(block, n, ln));
        const tdm = valueToCode(block, 'MAP', 'tilemap');
        const tds = valueToCode(block, 'TILE', '32');
        const tdi = valueToCode(block, 'IMAGES', '{}');
        code = appendLocal(code, indent + `for _ty in range(len(${tdm})):\n`);
        code = appendLocal(code, indent + `    for _tx in range(len(${tdm}[_ty])):\n`);
        code = appendLocal(code, indent + `        _tid = ${tdm}[_ty][_tx]\n`);
        code = appendLocal(code, indent + `        if _tid in ${tdi}:\n`);
        code = appendLocal(code, indent + `            screen.blit(${tdi}[_tid], (_tx * ${tds} - cam_x, _ty * ${tds} - cam_y))\n`);
        break;
      }
      case 'game_gravity_apply': {
        const ln = _emitCtx.line;
        ['GROUND'].forEach(n => registerExprBlocksAtLineFromInput(block, n, ln));
        const gvY  = getVarName(block, 'Y');
        const gvVY = getVarName(block, 'VY');
        const gvG  = valueToCode(block, 'GROUND', '400');
        code = appendLocal(code, indent + `${gvVY} += 0.5\n`);
        code = appendLocal(code, indent + `${gvY} += ${gvVY}\n`);
        code = appendLocal(code, indent + `if ${gvY} >= ${gvG}:\n`);
        code = appendLocal(code, indent + `    ${gvY} = ${gvG}\n`);
        code = appendLocal(code, indent + `    ${gvVY} = 0\n`);
        break;
      }
      case 'game_sound_play': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'SOUND', ln);
        const sp = valueToCode(block, 'SOUND', 'snd');
        code = appendLocal(code, indent + `${sp}.play()\n`);
        break;
      }
      case 'game_music_load_play': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'URL', ln);
        const mu = valueToCode(block, 'URL', '"assets/audio/bgm/bgm_action.wav"');
        const ml = block.getFieldValue('LOOP') === 'TRUE' ? '-1' : '0';
        code = appendLocal(code, indent + `pygame.mixer.music.load(${mu})\n`);
        code = appendLocal(code, indent + `pygame.mixer.music.play(${ml})\n`);
        break;
      }
      case 'game_music_stop': {
        code = appendLocal(code, indent + `pygame.mixer.music.stop()\n`);
        break;
      }

      case 'py_custom_stmt': {
        let raw = block.getFieldValue('CODE');
        if (raw === undefined || raw === null) raw = '';
        raw = String(raw).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        if (!raw.trim()) {
          code = appendLocal(code, indent + 'pass\n');
          break;
        }
        const lines = raw.split('\n');
        for (let li = 0; li < lines.length; li++) {
          code = appendLocal(code, indent + lines[li] + '\n');
        }
        break;
      }

      // ===== 基本GPIO =====
      case 'pico_led_on': {
        const pin = block.getFieldValue('PIN');
        code = appendLocal(code, indent + `Pin(${pin}, Pin.OUT).value(1)\n`);
        break;
      }
      case 'pico_led_off': {
        const pin = block.getFieldValue('PIN');
        code = appendLocal(code, indent + `Pin(${pin}, Pin.OUT).value(0)\n`);
        break;
      }
      case 'pico_digital_write': {
        const pin = block.getFieldValue('PIN');
        const val = block.getFieldValue('VAL');
        code = appendLocal(code, indent + `Pin(${pin}, Pin.OUT).value(${val})\n`);
        break;
      }

      // ===== 制御 =====
      case 'pico_wait': {
        const lnWait = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'SEC', lnWait);
        const sec = valueToCode(block, 'SEC', '1');
        code = appendLocal(code, currentMode === 'python'
          ? indent + `time.sleep(${sec})\n`
          : indent + `utime.sleep(${sec})\n`);
        break;
      }
      case 'pico_repeat': {
        const lnRep = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'TIMES', lnRep);
        const times = valueToCode(block, 'TIMES', '10');
        code = appendLocal(code, indent + `for _ in range(${times}):\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'pico_forever': {
        code = appendLocal(code, indent + `while True:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }

      // ===== PoliviaBot UME モーター =====
      case 'pvb_forward': {
        const lnFwd = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'SPEED', lnFwd);
        const spd = valueToCode(block, 'SPEED', '50');
        code = appendLocal(code, indent + `_d = ${spd} * 65535 // 100\n`);
        code = appendLocal(code, indent + `_lm.duty_u16(0); _rm.duty_u16(0)\n`);
        code = appendLocal(code, indent + `_lp.duty_u16(_d); _rp.duty_u16(_d)\n`);
        break;
      }
      case 'pvb_backward': {
        const lnBwd = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'SPEED', lnBwd);
        const spd = valueToCode(block, 'SPEED', '50');
        code = appendLocal(code, indent + `_d = ${spd} * 65535 // 100\n`);
        code = appendLocal(code, indent + `_lp.duty_u16(0); _rp.duty_u16(0)\n`);
        code = appendLocal(code, indent + `_lm.duty_u16(_d); _rm.duty_u16(_d)\n`);
        break;
      }
      case 'pvb_turn_right': {
        const lnTR = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'SPEED', lnTR);
        const spd = valueToCode(block, 'SPEED', '50');
        code = appendLocal(code, indent + `_d = ${spd} * 65535 // 100\n`);
        code = appendLocal(code, indent + `_lm.duty_u16(0); _rm.duty_u16(_d)\n`);
        code = appendLocal(code, indent + `_lp.duty_u16(_d); _rp.duty_u16(0)\n`);
        break;
      }
      case 'pvb_turn_left': {
        const lnTL = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'SPEED', lnTL);
        const spd = valueToCode(block, 'SPEED', '50');
        code = appendLocal(code, indent + `_d = ${spd} * 65535 // 100\n`);
        code = appendLocal(code, indent + `_lm.duty_u16(_d); _rm.duty_u16(0)\n`);
        code = appendLocal(code, indent + `_lp.duty_u16(0); _rp.duty_u16(_d)\n`);
        break;
      }
      case 'pvb_stop': {
        code = appendLocal(code, indent + `_lp.duty_u16(0); _rp.duty_u16(0)\n`);
        code = appendLocal(code, indent + `_lm.duty_u16(0); _rm.duty_u16(0)\n`);
        break;
      }

      // ===== PoliviaBot LED / スイッチ =====
      case 'pvb_led_on': {
        const led = block.getFieldValue('LED');
        code = appendLocal(code, indent + `Pin(${led}, Pin.OUT).value(1)\n`);
        break;
      }
      case 'pvb_led_off': {
        const led = block.getFieldValue('LED');
        code = appendLocal(code, indent + `Pin(${led}, Pin.OUT).value(0)\n`);
        break;
      }
      case 'pvb_if_switch': {
        const sw = block.getFieldValue('SW');
        code = appendLocal(code, indent + `if Pin(${sw}, Pin.IN, Pin.PULL_UP).value() == 0:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }

      // ===== センサー =====
      case 'pvb_sonar': {
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `_trig = Pin(7, Pin.OUT); _echo = Pin(6, Pin.IN)\n`);
        code = appendLocal(code, indent + `_trig.value(0); utime.sleep_us(2)\n`);
        code = appendLocal(code, indent + `_trig.value(1); utime.sleep_us(10); _trig.value(0)\n`);
        code = appendLocal(code, indent + `while _echo.value() == 0: pass\n`);
        code = appendLocal(code, indent + `_t0 = utime.ticks_us()\n`);
        code = appendLocal(code, indent + `while _echo.value() == 1: pass\n`);
        code = appendLocal(code, indent + `${varName} = utime.ticks_diff(utime.ticks_us(), _t0) / 58\n`);
        break;
      }
      case 'pvb_if_obstacle': {
        code = appendLocal(code, indent + `_trig = Pin(7, Pin.OUT); _echo = Pin(6, Pin.IN)\n`);
        code = appendLocal(code, indent + `_trig.value(0); utime.sleep_us(2)\n`);
        code = appendLocal(code, indent + `_trig.value(1); utime.sleep_us(10); _trig.value(0)\n`);
        code = appendLocal(code, indent + `while _echo.value() == 0: pass\n`);
        code = appendLocal(code, indent + `_t0 = utime.ticks_us()\n`);
        code = appendLocal(code, indent + `while _echo.value() == 1: pass\n`);
        code = appendLocal(code, indent + `_dist_cm = utime.ticks_diff(utime.ticks_us(), _t0) / 58\n`);
        const lnObs = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'DIST', lnObs);
        const dist  = valueToCode(block, 'DIST', '20');
        code = appendLocal(code, indent + `if _dist_cm < ${dist}:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'pvb_line_read': {
        const sensor = block.getFieldValue('SENSOR');
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `${varName} = ADC(${sensor}).read_u16()\n`);
        break;
      }
      case 'pvb_if_line': {
        const sensor = block.getFieldValue('SENSOR');
        const color = block.getFieldValue('COLOR');
        const op = color === 'black' ? '>' : '<';
        code = appendLocal(code, indent + `if ADC(${sensor}).read_u16() ${op} 32767:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'pvb_print': {
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `print(${varName})\n`);
        break;
      }
      case 'pico_if': {
        const lnIf0 = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IF0', lnIf0);
        const cond0 = stripOuterParens(valueToCode(block, 'IF0', 'True'));
        code = appendLocal(code, indent + `if ${cond0}:\n`);
        const do0   = statementToCode(block, 'DO0', indent + '    ');
        code = appendChildBody(code, do0, indent + '    pass\n');
        for (let i = 1; block.getInput('IF' + i); i++) {
          const lnElif = _emitCtx.line;
          registerExprBlocksAtLineFromInput(block, 'IF' + i, lnElif);
          const condI = stripOuterParens(valueToCode(block, 'IF' + i, 'True'));
          code = appendLocal(code, indent + `elif ${condI}:\n`);
          const doI   = statementToCode(block, 'DO' + i, indent + '    ');
          code = appendChildBody(code, doI, indent + '    pass\n');
        }
        if (block.getInput('ELSE')) {
          code = appendLocal(code, indent + `else:\n`);
          const doElse = statementToCode(block, 'ELSE', indent + '    ');
          code = appendChildBody(code, doElse, indent + '    pass\n');
        }
        break;
      }
      case 'var_set': {
        const v   = getVarName(block, 'VAR');
        const lnSet = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'VALUE', lnSet);
        const val = stripOuterParens(valueToCode(block, 'VALUE', '0'));
        code = appendLocal(code, indent + `${v} = ${val}\n`);
        break;
      }
      case 'var_set2': {
        const v1 = getVarName(block, 'VAR1');
        const v2 = getVarName(block, 'VAR2');
        const lnSet = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'VALUE1', lnSet);
        registerExprBlocksAtLineFromInput(block, 'VALUE2', lnSet);
        const val1 = stripOuterParens(valueToCode(block, 'VALUE1', '0'));
        const val2 = stripOuterParens(valueToCode(block, 'VALUE2', '0'));
        code = appendLocal(code, indent + `${v1}, ${v2} = ${val1}, ${val2}\n`);
        break;
      }
      case 'var_change': {
        const v   = getVarName(block, 'VAR');
        const lnChg = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'AMOUNT', lnChg);
        const amt = valueToCode(block, 'AMOUNT', '1');
        // 負の量は -= に整える（Python 慣用句）
        let line;
        const trimmed = String(amt).trim();
        const mNum     = trimmed.match(/^-(\d+(?:\.\d+)?)$/);
        const mUnary   = trimmed.match(/^-([A-Za-z_][\w.\[\]]*)$/);
        const mZeroMin = trimmed.match(/^\(\s*0\s*-\s*(.+?)\s*\)$/);
        if (mNum) {
          line = `${v} -= ${mNum[1]}`;
        } else if (mUnary) {
          line = `${v} -= ${mUnary[1]}`;
        } else if (mZeroMin) {
          line = `${v} -= ${mZeroMin[1]}`;
        } else {
          line = `${v} += ${stripOuterParens(amt)}`;
        }
        code = appendLocal(code, indent + line + '\n');
        break;
      }
      case 'pico_digital_read': {
        const pin = block.getFieldValue('PIN');
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `${varName} = Pin(${pin}, Pin.IN).value()\n`);
        break;
      }
      case 'pico_analog_read': {
        const pin = block.getFieldValue('PIN');
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `${varName} = ADC(${pin}).read_u16()\n`);
        break;
      }
      case 'val_var':
      case 'val_number':
      case 'val_str':
      case 'val_bool':
      case 'py_math_op':
      case 'py_str_concat':
      case 'cond_compare':
      case 'cond_and':
      case 'cond_or':
      case 'cond_not':
      case 'pico_if_elseif':
      case 'pico_if_else':
      case 'pico_digital_read_val':
      case 'pico_analog_read_val':
      case 'pvb_switch_val':
      case 'pvb_line_val':
      case 'pvb_sonar_val':
      case 'py_list_empty':
      case 'py_list_get':
      case 'py_list_len':
      case 'py_list_contains':
      case 'py_random_int':
      case 'py_type_cast':
      case 'py_abs':
      case 'py_round':
      case 'py_call_val':
      case 'py_call_val2':
      case 'py_call_val3':
      case 'py_fstring':
      case 'py_fstring_fmt':
      case 'py_fstring2_expr':
      case 'py_fstring3':
      case 'py_list_range':
      case 'py_dict_new':
      case 'py_dict_literal':
      case 'py_dict_get':
      case 'py_dict_get_default':
      case 'py_dict_keys':
      case 'py_ternary':
      case 'py_dict_comp':
      case 'py_set_comp':
      case 'py_sorted_key_func':
      case 'py_sorted_dict_two_keys':
      case 'py_set_empty':
      case 'py_bisect_left':
      case 'py_bisect_right':
      case 'py_str_isdigit':
      case 'py_list_slice':
      case 'py_list_get_negative':
      case 'py_deque_init':
      case 'py_deque_popleft':
      case 'py_list_pop_val':
        break;
      case 'py_import_module': {
        const impMod = block.getFieldValue('MODULE') || '';
        code = appendLocal(code, indent + `import ${impMod}\n`);
        break;
      }
      case 'py_import_as': {
        const iaMod   = block.getFieldValue('MODULE') || '';
        const iaAlias = block.getFieldValue('ALIAS')  || '';
        code = appendLocal(code, indent + `import ${iaMod} as ${iaAlias}\n`);
        break;
      }
      case 'py_from_import_multi': {
        const fimMod = block.getFieldValue('MODULE') || '';
        const fimList = [];
        for (let k = 0; block.getField && block.getField('NAME' + k); k++) {
          const v = block.getFieldValue('NAME' + k);
          if (v && v !== '__none__') fimList.push(v);
        }
        const fimNames = fimList.join(', ');
        code = appendLocal(code, indent + `from ${fimMod} import ${fimNames}\n`);
        break;
      }
      case 'py_deque_append': {
        const dqAppDeque = getVarName(block, 'DEQUE');
        const dqAppVal   = valueToCode(block, 'VALUE', '0');
        code = appendLocal(code, indent + `${dqAppDeque}.append(${dqAppVal})\n`);
        break;
      }
      case 'pico_for_range': {
        const v      = getVarName(block, 'VAR');
        const lnForN = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'N', lnForN);
        const n      = valueToCode(block, 'N', '10');
        code = appendLocal(code, indent + `for ${v} in range(${n}):\n`);
        const doCode = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, doCode, indent + '    pass\n');
        break;
      }
      case 'pico_for_from_to': {
        const v      = getVarName(block, 'VAR');
        const lnRange = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'START', lnRange);
        registerExprBlocksAtLineFromInput(block, 'STOP', lnRange);
        registerExprBlocksAtLineFromInput(block, 'STEP', lnRange);
        const start  = valueToCode(block, 'START', '0');
        const stop   = valueToCode(block, 'STOP', '10');
        const step   = valueToCode(block, 'STEP', '1');
        // デフォルト値は省略して短い range 形式を選ぶ
        let rangeArgs;
        if (step === '1' && start === '0') rangeArgs = `${stop}`;
        else if (step === '1') rangeArgs = `${start}, ${stop}`;
        else rangeArgs = `${start}, ${stop}, ${step}`;
        code = appendLocal(code, indent + `for ${v} in range(${rangeArgs}):\n`);
        const doCode = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, doCode, indent + '    pass\n');
        break;
      }
      case 'var_if_greater': {
        const v     = getVarName(block, 'VAR');
        const lnGt = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'THRESHOLD', lnGt);
        const thr   = valueToCode(block, 'THRESHOLD', '0');
        code = appendLocal(code, indent + `if ${v} > ${thr}:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'var_if_less': {
        const v     = getVarName(block, 'VAR');
        const lnLt = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'THRESHOLD', lnLt);
        const thr   = valueToCode(block, 'THRESHOLD', '0');
        code = appendLocal(code, indent + `if ${v} < ${thr}:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'print_text': {
        const text = JSON.stringify(block.getFieldValue('TEXT'));
        code = appendLocal(code, indent + `print(${text})\n`);
        break;
      }
      case 'print_var_label': {
        const label = JSON.stringify(block.getFieldValue('LABEL'));
        const varName = getVarName(block, 'VAR');
        const lnPvl = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'VAR', lnPvl);
        code = appendLocal(code, indent + `print(${label} + str(${varName}))\n`);
        break;
      }
      case 'print_separator': {
        code = appendLocal(code, indent + `print('----------------')\n`);
        break;
      }

      // ===== Python入門専用 =====
      case 'py_input': {
        const varName = getVarName(block, 'VAR');
        const prompt  = JSON.stringify(block.getFieldValue('PROMPT'));
        const type    = block.getFieldValue('TYPE');
        if (type === 'int') {
          code = appendLocal(code, indent + `${varName} = int(input(${prompt}))\n`);
        } else if (type === 'float') {
          code = appendLocal(code, indent + `${varName} = float(input(${prompt}))\n`);
        } else {
          code = appendLocal(code, indent + `${varName} = input(${prompt})\n`);
        }
        break;
      }
      case 'py_while': {
        const lnWhile = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'COND', lnWhile);
        const cond  = stripOuterParens(valueToCode(block, 'COND', 'True'));
        code = appendLocal(code, indent + `while ${cond}:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'py_print': {
        const lnPrint = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'VALUE', lnPrint);
        const val = valueToCode(block, 'VALUE', '""');
        code = appendLocal(code, indent + `print(${val})\n`);
        break;
      }
      case 'py_print_multi': {
        const pmItems = [];
        for (let i = 0; i < (block.itemCount_ || 2); i++) {
          pmItems.push(valueToCode(block, 'ITEM' + i, '""'));
        }
        code = appendLocal(code, indent + `print(${pmItems.join(', ')})\n`);
        break;
      }
      case 'py_set_add': {
        const setAddName = getVarName(block, 'SET');
        const setAddVal  = valueToCode(block, 'VALUE', 'None');
        code = appendLocal(code, indent + `${setAddName}.add(${setAddVal})\n`);
        break;
      }
      case 'py_set_discard': {
        const setDisName = getVarName(block, 'SET');
        const setDisVal  = valueToCode(block, 'VALUE', 'None');
        code = appendLocal(code, indent + `${setDisName}.discard(${setDisVal})\n`);
        break;
      }
      case 'py_enumerate_for': {
        const enumIdx  = getVarName(block, 'IDX');
        const enumVal  = getVarName(block, 'VAL');
        const enumList = getVarName(block, 'LIST');
        code = appendLocal(code, indent + `for ${enumIdx}, ${enumVal} in enumerate(${enumList}):\n`);
        const enumInner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, enumInner, indent + '    pass\n');
        break;
      }
      case 'py_zip_for': {
        const zipA     = getVarName(block, 'VAR_A');
        const zipB     = getVarName(block, 'VAR_B');
        const zipListA = getVarName(block, 'LIST_A');
        const zipListB = getVarName(block, 'LIST_B');
        code = appendLocal(code, indent + `for ${zipA}, ${zipB} in zip(${zipListA}, ${zipListB}):\n`);
        const zipInner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, zipInner, indent + '    pass\n');
        break;
      }
      case 'py_file_write': {
        const fname = block.getFieldValue('FILENAME') || 'data.txt';
        const content = valueToCode(block, 'CONTENT', '""');
        code = appendLocal(code, indent + `with open("${fname}", "w") as _f:\n`);
        code = appendLocal(code, indent + `    _f.write(${content})\n`);
        break;
      }
      case 'py_file_append': {
        const fname = block.getFieldValue('FILENAME') || 'data.txt';
        const content = valueToCode(block, 'CONTENT', '""');
        code = appendLocal(code, indent + `with open("${fname}", "a") as _f:\n`);
        code = appendLocal(code, indent + `    _f.write(${content})\n`);
        break;
      }
      case 'py_file_read': {
        const fname = block.getFieldValue('FILENAME') || 'data.txt';
        const varName = block.getFieldValue('VAR') || 'content';
        code = appendLocal(code, indent + `with open("${fname}") as _f:\n`);
        code = appendLocal(code, indent + `    ${varName} = _f.read()\n`);
        break;
      }
      case 'py_file_readlines': {
        const fname = block.getFieldValue('FILENAME') || 'data.txt';
        const varName = block.getFieldValue('VAR') || 'lines';
        code = appendLocal(code, indent + `with open("${fname}") as _f:\n`);
        code = appendLocal(code, indent + `    ${varName} = _f.readlines()\n`);
        break;
      }
      case 'py_enumerate_start_for': {
        const esIdx   = getVarName(block, 'IDX');
        const esVal   = getVarName(block, 'VAL');
        const esList  = getVarName(block, 'LIST');
        const esStart = block.getFieldValue('START') || '0';
        code = appendLocal(code, indent + `for ${esIdx}, ${esVal} in enumerate(${esList}, start=${esStart}):\n`);
        const esInner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, esInner, indent + '    pass\n');
        break;
      }

      // ===== リスト =====
      case 'py_list_append': {
        const listName = getVarName(block, 'LIST');
        const lnApp = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'VALUE', lnApp);
        const val = valueToCode(block, 'VALUE', 'None');
        code = appendLocal(code, indent + `${listName}.append(${val})\n`);
        break;
      }
      case 'py_dict_set': {
        const dictName = getVarName(block, 'DICT');
        const lnDs = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'KEY', lnDs);
        registerExprBlocksAtLineFromInput(block, 'VAL', lnDs);
        const key = valueToCode(block, 'KEY', '""');
        const val = valueToCode(block, 'VAL', 'None');
        code = appendLocal(code, indent + `${dictName}[${key}] = ${val}\n`);
        break;
      }
      case 'py_list_set': {
        const listName = getVarName(block, 'LIST');
        const lnIdx = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'INDEX', lnIdx);
        registerExprBlocksAtLineFromInput(block, 'VALUE', lnIdx);
        const idx = valueToCode(block, 'INDEX', '0');
        const val = valueToCode(block, 'VALUE', 'None');
        // VALUE が `listName[idx] op rhs` なら listName[idx] op= rhs に簡略化
        const valBlk = block.getInputTargetBlock('VALUE');
        if (valBlk && valBlk.type === 'py_math_op') {
          const op = valBlk.getFieldValue('OP') || '+';
          const leftBlk = valBlk.getInputTargetBlock('LEFT');
          if (leftBlk && leftBlk.type === 'py_list_get') {
            const leftLst = getVarName(leftBlk, 'LIST');
            const leftIdx = valueToCode(leftBlk, 'INDEX', '0');
            if (leftLst === listName && leftIdx === idx && ['+', '-', '*', '/', '//', '%'].includes(op)) {
              const rhs = valueToCode(valBlk, 'RIGHT', '0');
              code = appendLocal(code, indent + `${listName}[${idx}] ${op}= ${rhs}\n`);
              break;
            }
          }
        }
        code = appendLocal(code, indent + `${listName}[${idx}] = ${val}\n`);
        break;
      }
      case 'py_for_list': {
        const itemVar  = getVarName(block, 'VAR');
        const listName = getVarName(block, 'LIST');
        code = appendLocal(code, indent + `for ${itemVar} in ${listName}:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'py_for_dict_items_sorted': {
        const fdiDict   = getVarName(block, 'DICT');
        const fdiKeyVar = getVarName(block, 'KEY_VAR');
        const fdiValVar = getVarName(block, 'VAL_VAR');
        code = appendLocal(code, indent + `for ${fdiKeyVar}, ${fdiValVar} in sorted(${fdiDict}.items()):\n`);
        const fdiInner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, fdiInner, indent + '    pass\n');
        break;
      }

      // ===== ループ制御 =====
      case 'py_break':
        code = appendLocal(code, indent + `break\n`);
        break;
      case 'py_continue':
        code = appendLocal(code, indent + `continue\n`);
        break;

      // ===== 関数 =====
      case 'py_def_noarg': {
        const name = getVarName(block, 'NAME');
        code = appendLocal(code, indent + `def ${name}():\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_def': {
        const name  = getVarName(block, 'NAME');
        const param = getVarName(block, 'PARAM');
        code = appendLocal(code, indent + `def ${name}(${param}):\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_def_args2': {
        const name = getVarName(block, 'NAME');
        const p1   = block.getFieldValue('PARAM1');
        const p2   = block.getFieldValue('PARAM2');
        code = appendLocal(code, indent + `def ${name}(${p1}, ${p2}):\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_def_args3': {
        const name = getVarName(block, 'NAME');
        const p1   = block.getFieldValue('PARAM1');
        const p2   = block.getFieldValue('PARAM2');
        const p3   = block.getFieldValue('PARAM3');
        code = appendLocal(code, indent + `def ${name}(${p1}, ${p2}, ${p3}):\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_return': {
        const lnRet = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'VALUE', lnRet);
        const retVal = valueToCode(block, 'VALUE', 'None');
        code = appendLocal(code, indent + `return ${retVal}\n`);
        break;
      }
      case 'py_call_stmt': {
        const name = getVarName(block, 'NAME');
        const lnCall = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'ARG', lnCall);
        const arg = valueToCode(block, 'ARG', '');
        code = appendLocal(code, indent + `${name}(${arg})\n`);
        break;
      }
      case 'py_call_stmt_arg2': {
        const name = getVarName(block, 'NAME');
        const lnCall = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'ARG1', lnCall);
        registerExprBlocksAtLineFromInput(block, 'ARG2', lnCall);
        const arg1 = valueToCode(block, 'ARG1', '');
        const arg2 = valueToCode(block, 'ARG2', '');
        code = appendLocal(code, indent + `${name}(${arg1}, ${arg2})\n`);
        break;
      }
      case 'py_module_call_stmt': {
        const mod    = block.getFieldValue('MODULE');
        const func   = block.getFieldValue('FUNC');
        const lnMod  = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'ARG', lnMod);
        const arg    = valueToCode(block, 'ARG', '');
        const call   = (!mod || mod === '__none__') ? `${func}(${arg})` : `${mod}.${func}(${arg})`;
        code = appendLocal(code, indent + call + '\n');
        break;
      }

      // ===== クラスブロック（0-16） =====
      case 'py_class_def': {
        const name = block.getFieldValue('NAME');
        code = appendLocal(code, indent + `class ${name}:\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_class_init': {
        const param = getVarName(block, 'PARAM');
        code = appendLocal(code, indent + `def __init__(self, ${param}):\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_class_init2': {
        const p1 = getVarName(block, 'PARAM1');
        const p2 = getVarName(block, 'PARAM2');
        code = appendLocal(code, indent + `def __init__(self, ${p1}, ${p2}):\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_class_method': {
        const name = block.getFieldValue('NAME');
        code = appendLocal(code, indent + `def ${name}(self):\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_class_method1': {
        const name  = block.getFieldValue('NAME');
        const param = getVarName(block, 'PARAM');
        code = appendLocal(code, indent + `def ${name}(self, ${param}):\n`);
        const body = statementToCode(block, 'BODY', indent + '    ');
        code = appendChildBody(code, body, indent + '    pass\n');
        break;
      }
      case 'py_self_set': {
        const attr = block.getFieldValue('ATTR');
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'VALUE', ln);
        const val = valueToCode(block, 'VALUE', '0');
        code = appendLocal(code, indent + `self.${attr} = ${val}\n`);
        break;
      }
      case 'py_method_call_stmt': {
        const inst   = getVarName(block, 'INST');
        const method = block.getFieldValue('METHOD');
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'ARG', ln);
        const arg = valueToCode(block, 'ARG', '');
        code = appendLocal(code, indent + `${inst}.${method}(${arg})\n`);
        break;
      }

      // ===== 例外処理ブロック（0-17） =====
      case 'py_try_except': {
        const etype   = block.getFieldValue('ETYPE');
        const tryBody = statementToCode(block, 'BODY', indent + '    ');
        const handler = statementToCode(block, 'HANDLER', indent + '    ');
        code = appendLocal(code, indent + `try:\n`);
        code = appendChildBody(code, tryBody, indent + '    pass\n');
        code = appendLocal(code, indent + `except ${etype}:\n`);
        code = appendChildBody(code, handler, indent + '    pass\n');
        break;
      }
      case 'py_try_except_as': {
        const evar    = getVarName(block, 'EVAR');
        const tryBody = statementToCode(block, 'BODY', indent + '    ');
        const handler = statementToCode(block, 'HANDLER', indent + '    ');
        code = appendLocal(code, indent + `try:\n`);
        code = appendChildBody(code, tryBody, indent + '    pass\n');
        code = appendLocal(code, indent + `except Exception as ${evar}:\n`);
        code = appendChildBody(code, handler, indent + '    pass\n');
        break;
      }
      case 'py_raise': {
        const etype = block.getFieldValue('ETYPE');
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'MSG', ln);
        const msg = valueToCode(block, 'MSG', '""');
        code = appendLocal(code, indent + `raise ${etype}(${msg})\n`);
        break;
      }

      // ===== Part 2: matplotlib pyplot ブロック =====
      case 'py_import_plt': {
        code = appendLocal(code, indent + 'import matplotlib.pyplot as plt\n');
        break;
      }
      case 'py_plt_plot': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'X', ln);
        registerExprBlocksAtLineFromInput(block, 'Y', ln);
        const px = valueToCode(block, 'X', '[]');
        const py = valueToCode(block, 'Y', '[]');
        code = appendLocal(code, indent + `plt.plot(${px}, ${py})\n`);
        break;
      }
      case 'py_plt_bar': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'X', ln);
        registerExprBlocksAtLineFromInput(block, 'Y', ln);
        const bx = valueToCode(block, 'X', '[]');
        const by = valueToCode(block, 'Y', '[]');
        code = appendLocal(code, indent + `plt.bar(${bx}, ${by})\n`);
        break;
      }
      case 'py_plt_scatter': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'X', ln);
        registerExprBlocksAtLineFromInput(block, 'Y', ln);
        const sx = valueToCode(block, 'X', '[]');
        const sy = valueToCode(block, 'Y', '[]');
        code = appendLocal(code, indent + `plt.scatter(${sx}, ${sy})\n`);
        break;
      }
      case 'py_plt_hist': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'DATA', ln);
        const hdata = valueToCode(block, 'DATA', '[]');
        const bins  = block.getFieldValue('BINS') || '10';
        code = appendLocal(code, indent + `plt.hist(${hdata}, bins=${bins})\n`);
        break;
      }
      case 'py_plt_title': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'TEXT', ln);
        const tt = valueToCode(block, 'TEXT', '""');
        code = appendLocal(code, indent + `plt.title(${tt})\n`);
        break;
      }
      case 'py_plt_xlabel': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'TEXT', ln);
        const xlbl = valueToCode(block, 'TEXT', '""');
        code = appendLocal(code, indent + `plt.xlabel(${xlbl})\n`);
        break;
      }
      case 'py_plt_ylabel': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'TEXT', ln);
        const ylbl = valueToCode(block, 'TEXT', '""');
        code = appendLocal(code, indent + `plt.ylabel(${ylbl})\n`);
        break;
      }
      case 'py_plt_show': {
        code = appendLocal(code, indent + 'plt.show()\n');
        break;
      }

      // ===== Part 2: statistics ブロック =====
      case 'py_import_stats': {
        code = appendLocal(code, indent + 'import statistics\n');
        break;
      }
      case 'py_import_csv': {
        code = appendLocal(code, indent + 'import csv\n');
        break;
      }
      case 'py_csv_read_rows': {
        const csvVar  = getVarName(block, 'VAR');
        const csvFile = block.getFieldValue('FILENAME') || 'data.csv';
        code = appendLocal(code, indent + `with open("${csvFile}") as _f:\n`);
        code = appendLocal(code, indent + `    _rows = list(csv.reader(_f))\n`);
        code = appendLocal(code, indent + `${csvVar} = _rows[1:] if len(_rows) > 1 else []\n`);
        break;
      }
      case 'py_csv_get_col': {
        const colVar  = getVarName(block, 'VAR');
        const rowsVar = getVarName(block, 'ROWS');
        const colIdx  = block.getFieldValue('COL') || '0';
        code = appendLocal(code, indent + `${colVar} = [float(r[${colIdx}]) for r in ${rowsVar} if len(r) > ${colIdx}]\n`);
        break;
      }

      // ===== Part 6: 機械学習ブロック =====
      case 'ml_import': {
        code = appendLocal(code, indent + 'import pyco_ml\n');
        break;
      }
      case 'ml_knn': {
        const knnVar = getVarName(block, 'VAR');
        const knnK   = block.getFieldValue('K') || '3';
        code = appendLocal(code, indent + `${knnVar} = pyco_ml.KNN(${knnK})\n`);
        break;
      }
      case 'ml_linreg': {
        const lrVar = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `${lrVar} = pyco_ml.LinearRegression()\n`);
        break;
      }
      case 'ml_fit': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'MODEL', ln);
        registerExprBlocksAtLineFromInput(block, 'X_TRAIN', ln);
        registerExprBlocksAtLineFromInput(block, 'Y_TRAIN', ln);
        const fitMdl = valueToCode(block, 'MODEL', 'clf');
        const fitXtr = valueToCode(block, 'X_TRAIN', '[]');
        const fitYtr = valueToCode(block, 'Y_TRAIN', '[]');
        code = appendLocal(code, indent + `${fitMdl}.fit(${fitXtr}, ${fitYtr})\n`);
        break;
      }
      case 'ml_predict_stmt': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'MODEL', ln);
        registerExprBlocksAtLineFromInput(block, 'X_TEST', ln);
        const psVar = getVarName(block, 'VAR');
        const psMdl = valueToCode(block, 'MODEL', 'clf');
        const psXte = valueToCode(block, 'X_TEST', '[]');
        code = appendLocal(code, indent + `${psVar} = ${psMdl}.predict(${psXte})\n`);
        break;
      }
      case 'ml_predict_val': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'MODEL', ln);
        registerExprBlocksAtLineFromInput(block, 'X_TEST', ln);
        const pvMdl = valueToCode(block, 'MODEL', 'clf');
        const pvXte = valueToCode(block, 'X_TEST', '[]');
        code = appendLocal(code, indent + `${pvMdl}.predict(${pvXte})\n`);
        break;
      }
      case 'ml_accuracy': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'Y_TRUE', ln);
        registerExprBlocksAtLineFromInput(block, 'Y_PRED', ln);
        const accYt = valueToCode(block, 'Y_TRUE', '[]');
        const accYp = valueToCode(block, 'Y_PRED', '[]');
        code = appendLocal(code, indent + `pyco_ml.accuracy(${accYt}, ${accYp})\n`);
        break;
      }
      case 'ml_split': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'X', ln);
        registerExprBlocksAtLineFromInput(block, 'Y', ln);
        const spXtr  = getVarName(block, 'X_TR');
        const spXte  = getVarName(block, 'X_TE');
        const spYtr  = getVarName(block, 'Y_TR');
        const spYte  = getVarName(block, 'Y_TE');
        const spX    = valueToCode(block, 'X', '[]');
        const spY    = valueToCode(block, 'Y', '[]');
        const spRatio = block.getFieldValue('RATIO') || '0.2';
        code = appendLocal(code, indent + `${spXtr}, ${spXte}, ${spYtr}, ${spYte} = pyco_ml.train_test_split(${spX}, ${spY}, ${spRatio})\n`);
        break;
      }

      // ===== Part 5: 画像処理ブロック =====
      case 'cv_import': {
        code = appendLocal(code, indent + 'import pyco_cv\n');
        break;
      }
      case 'cv_load': {
        const cvVar    = getVarName(block, 'VAR');
        const cvSample = block.getFieldValue('SAMPLE') || 'gradient';
        code = appendLocal(code, indent + `${cvVar} = pyco_cv.load("${cvSample}")\n`);
        break;
      }
      case 'cv_show': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        const showImg = valueToCode(block, 'IMG', 'img');
        code = appendLocal(code, indent + `pyco_cv.show(${showImg})\n`);
        break;
      }
      case 'cv_to_gray': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        const grayImg = valueToCode(block, 'IMG', 'img');
        code = appendLocal(code, indent + `pyco_cv.to_gray(${grayImg})\n`);
        break;
      }
      case 'cv_filter_blur': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        const blurImg = valueToCode(block, 'IMG', 'img');
        const blurSz  = block.getFieldValue('SIZE') || '3';
        code = appendLocal(code, indent + `pyco_cv.filter_blur(${blurImg}, ${blurSz})\n`);
        break;
      }
      case 'cv_filter_edge': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        const edgeImg = valueToCode(block, 'IMG', 'img');
        code = appendLocal(code, indent + `pyco_cv.filter_edge(${edgeImg})\n`);
        break;
      }
      case 'cv_brightness': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        const brightImg   = valueToCode(block, 'IMG', 'img');
        const brightDelta = block.getFieldValue('DELTA') || '50';
        code = appendLocal(code, indent + `pyco_cv.brightness(${brightImg}, ${brightDelta})\n`);
        break;
      }
      case 'cv_get_pixel': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        registerExprBlocksAtLineFromInput(block, 'X', ln);
        registerExprBlocksAtLineFromInput(block, 'Y', ln);
        const gpImg = valueToCode(block, 'IMG', 'img');
        const gpX   = valueToCode(block, 'X', '0');
        const gpY   = valueToCode(block, 'Y', '0');
        code = appendLocal(code, indent + `pyco_cv.get_pixel(${gpImg}, ${gpX}, ${gpY})\n`);
        break;
      }
      case 'cv_set_pixel': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        registerExprBlocksAtLineFromInput(block, 'X', ln);
        registerExprBlocksAtLineFromInput(block, 'Y', ln);
        registerExprBlocksAtLineFromInput(block, 'R', ln);
        registerExprBlocksAtLineFromInput(block, 'G', ln);
        registerExprBlocksAtLineFromInput(block, 'B', ln);
        const spImg = valueToCode(block, 'IMG', 'img');
        const spX   = valueToCode(block, 'X', '0');
        const spY   = valueToCode(block, 'Y', '0');
        const spR   = valueToCode(block, 'R', '255');
        const spG   = valueToCode(block, 'G', '0');
        const spB   = valueToCode(block, 'B', '0');
        code = appendLocal(code, indent + `pyco_cv.set_pixel(${spImg}, ${spX}, ${spY}, ${spR}, ${spG}, ${spB})\n`);
        break;
      }
      case 'cv_width': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        const wImg = valueToCode(block, 'IMG', 'img');
        code = appendLocal(code, indent + `pyco_cv.get_width(${wImg})\n`);
        break;
      }
      case 'cv_height': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        const hImg = valueToCode(block, 'IMG', 'img');
        code = appendLocal(code, indent + `pyco_cv.get_height(${hImg})\n`);
        break;
      }
      case 'cv_resize': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        registerExprBlocksAtLineFromInput(block, 'W', ln);
        registerExprBlocksAtLineFromInput(block, 'H', ln);
        const rzImg = valueToCode(block, 'IMG', 'img');
        const rzW   = valueToCode(block, 'W', '60');
        const rzH   = valueToCode(block, 'H', '60');
        code = appendLocal(code, indent + `pyco_cv.resize(${rzImg}, ${rzW}, ${rzH})\n`);
        break;
      }
      case 'cv_copy': {
        const ln = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'IMG', ln);
        const cpVar = getVarName(block, 'VAR');
        const cpImg = valueToCode(block, 'IMG', 'img');
        code = appendLocal(code, indent + `${cpVar} = pyco_cv.copy(${cpImg})\n`);
        break;
      }

      case 'py_tuple_unpack': {
        const tpX   = getVarName(block, 'VAR_X');
        const tpY   = getVarName(block, 'VAR_Y');
        const tpSrc = getVarName(block, 'SRC');
        code = appendLocal(code, indent + `${tpX}, ${tpY} = ${tpSrc}\n`);
        break;
      }
      case 'py_print2': {
        const p2A = getVarName(block, 'VAR_A');
        const p2B = getVarName(block, 'VAR_B');
        code = appendLocal(code, indent + `print(${p2A}, ${p2B})\n`);
        break;
      }
      case 'py_list_pop': {
        code = appendLocal(code, indent + `${getVarName(block, 'LIST')}.pop()\n`);
        break;
      }

      default:
        code = appendLocal(code, indent + `pass  # 未対応ブロック: ${block.type}\n`);
    }

    if (indent === '') {
      code = appendLocal(code, '\n');
    }

    blockLineMap.set(block.id, {
      from: blockOwnFrom,
      to: Math.max(blockOwnFrom, _emitCtx.line - 1)
    });

    const next = block.getNextBlock ? block.getNextBlock() : null;
    if (next) {
      code += blockToCode(next, indent);
    }

    return code;
  }

  // STATEMENT入力（ブロックの中身）を展開
  function statementToCode(block, inputName, indent) {
    const input = block.getInput(inputName);
    if (!input || !input.connection || !input.connection.targetBlock()) return '';
    return blockToCode(input.connection.targetBlock(), indent);
  }

  // コード生成メイン
  function generateCode() {
    if (fileMode) return;
    // データファイル（open() の書き込みで生成されたタブ）は Blockly のコード生成対象外
    if (pyFiles[activeFileIdx] && pyFiles[activeFileIdx].isData) return;

    // ワークスペース内の全ブロックタイプを収集
    const allBlocks = workspace.getAllBlocks(false);
    const blockTypes = new Set(allBlocks.map(b => b.type));

    let header;

    const cm = showComments ? '' : '# ';  // コメントOFF時はimport行を # で無効化

    if (currentMode === 'python') {
      // ─── Python入門モード：使用ブロックに応じてimportを挿入 ───
      const needsTime   = blockTypes.has('pico_wait');
      const needsRandom = blockTypes.has('py_random_int');
      const importLines = [];
      if (needsTime)   importLines.push((showComments ? '# 時間待機（time.sleep）用\n' : '') + `${cm}import time`);
      if (needsRandom) importLines.push((showComments ? '# 乱数生成（random.randint）用\n' : '') + `${cm}import random`);
      // 自作モジュール呼び出しブロックで使われているモジュールを収集してimport
      const usedModules = new Set();
      allBlocks.forEach(function(b) {
        if (b.type === 'py_module_call_stmt' || b.type === 'py_module_call_val') {
          const mod = b.getFieldValue('MODULE');
          if (mod && mod !== '__none__') usedModules.add(mod);
        }
      });
      usedModules.forEach(function(mod) {
        importLines.push((showComments ? `# 自作モジュール ${mod} をインポート\n` : '') + `${cm}import ${mod}`);
      });
      header = importLines.length ? importLines.join('\n') + '\n\n' : '';
    } else if (currentMode === 'game') {
      const needsRandom = blockTypes.has('py_random_int');
      const importLines = [];
      importLines.push((showComments ? '# ゲーム（pygame互換）\n' : '') + `${cm}import pygame`);
      if (needsRandom) importLines.push(`${cm}import random`);
      // 自作モジュール呼び出しブロックで使われているモジュールを収集してimport
      const usedModules = new Set();
      allBlocks.forEach(function(b) {
        if (b.type === 'py_module_call_stmt' || b.type === 'py_module_call_val') {
          const mod = b.getFieldValue('MODULE');
          if (mod && mod !== '__none__') usedModules.add(mod);
        }
      });
      usedModules.forEach(function(mod) {
        importLines.push((showComments ? `# 自作モジュール ${mod} をインポート\n` : '') + `${cm}import ${mod}`);
      });
      header = importLines.join('\n') + '\n\n';
    } else {
      // ─── MicroPythonモード：既存ロジック ───
      const motorTypes = ['pvb_forward','pvb_backward','pvb_turn_right','pvb_turn_left','pvb_stop'];
      const hasMotor   = motorTypes.some(t => blockTypes.has(t));
      const hasSonarVal = blockTypes.has('pvb_sonar_val');

      const baseHeader =
        (showComments ? '# Picoのピン・PWM・ADC制御用\n' : '') + `${cm}from machine import Pin, PWM, ADC\n` +
        (showComments ? '# 時間待機用（MicroPython版 time モジュール）\n' : '') + `${cm}import utime\n\n`;
      const motorInit =
        '_lp = PWM(Pin(0)); _lp.freq(1000)\n' +
        '_lm = PWM(Pin(1)); _lm.freq(1000)\n' +
        '_rp = PWM(Pin(2)); _rp.freq(1000)\n' +
        '_rm = PWM(Pin(3)); _rm.freq(1000)\n\n';
      const sonarHelper =
        'def _pvb_sonar_cm():\n' +
        '    _trig = Pin(7, Pin.OUT); _echo = Pin(6, Pin.IN)\n' +
        '    _trig.value(0); utime.sleep_us(2)\n' +
        '    _trig.value(1); utime.sleep_us(10); _trig.value(0)\n' +
        '    while _echo.value() == 0: pass\n' +
        '    _t0 = utime.ticks_us()\n' +
        '    while _echo.value() == 1: pass\n' +
        '    return utime.ticks_diff(utime.ticks_us(), _t0) / 58\n\n';

      header = baseHeader;
      if (hasMotor)    header += motorInit;
      if (hasSonarVal) header += sonarHelper;
    }

    const isMain = activeFileIdx === 0;

    blockLineMap.clear();
    _emitCtx.line = isMain ? (header.match(/\n/g) || []).length : 0;
    _emitCtx.runningPreset = allBlocks.some(function(b) {
      if (b.type !== 'var_set') return false;
      const vname = (b.getField && b.getField('VAR')) ? b.getField('VAR').getText() : '';
      if (vname !== 'running') return false;
      const valBlk = b.getInputTargetBlock && b.getInputTargetBlock('VALUE');
      if (!valBlk || valBlk.type !== 'val_bool') return false;
      return (valBlk.getFieldValue && valBlk.getFieldValue('BOOL')) === 'True';
    });
    let code = '';
    const topBlocks = workspace.getTopBlocks(true);
    for (const block of topBlocks) {
      code += blockToCode(block, '');
    }
    // サブファイル（モジュール）はheaderなし・空でもプレースホルダーなし
    // ゲームモードのサブファイルはpygame/randomを自動付与（ゲームブロックが pygame. を参照するため）
    let subHeader = '';
    if (!isMain && currentMode === 'game') {
      const subImports = ['import pygame'];
      if (blockTypes.has('py_random_int')) subImports.push('import random');
      subHeader = subImports.join('\n') + '\n\n';
    }
    const generated = isMain
      ? header + (code || '# ブロックを追加してください')
      : subHeader + (code || '');
    pyFiles[activeFileIdx].content = generated;
    if (!codingMode) {
      editor.setValue(generated);
    }

    // コーディングモードではエディタとブロック由来の行が一致しないため選択ハイライトしない
    if (!codingMode) {
      refreshBlockSelectionHighlight();
    } else {
      clearBlockSelectionHighlight();
    }

    // チュートリアル自動チェック（Tutorial代入済みの場合のみ）
    if (Tutorial) Tutorial.check(blockTypes);
  }

  // ===== ツールボックスエリアへのドラッグで削除 =====
  workspace.addChangeListener(function(e) {
    if (e.type !== Blockly.Events.BLOCK_DRAG || e.isStart) return;
    const block = workspace.getBlockById(e.blockId);
    if (!block) return;

    // ツールボックスのDOM幅を取得
    const toolboxEl = document.querySelector('.blocklyToolboxDiv');
    if (!toolboxEl) return;
    const toolboxRight = toolboxEl.getBoundingClientRect().right;

    // ブロックのSVG座標をスクリーン座標に変換
    const blocklyDiv = document.getElementById('blockly-div');
    const divLeft = blocklyDiv.getBoundingClientRect().left;
    const blockXY = block.getRelativeToSurfaceXY();
    const scale = workspace.scale;
    const metrics = workspace.getMetrics();
    const blockScreenX = divLeft + (blockXY.x + metrics.contentLeft) * scale;

    if (blockScreenX < toolboxRight) {
      Blockly.Events.disable();
      try { block.dispose(false, true); } finally { Blockly.Events.enable(); }
      generateCode();
    }
  });

  // ワークスペース変更時に自動更新
  workspace.addChangeListener(function(e) {
    // ブロックを操作したら読み込みファイルモードを解除
    if (fileMode && e.type !== Blockly.Events.VIEWPORT_CHANGE && e.type !== Blockly.Events.SELECTED) {
      fileMode = false;
    }
    // VIEWPORT_CHANGE / BLOCK_DRAG開始はコード変化なしのためスキップ
    if (e.type === Blockly.Events.VIEWPORT_CHANGE) return;
    if (e.type === Blockly.Events.BLOCK_DRAG && e.isStart) return;
    // 選択のみが変わったときはコード内容は変わらないので再生成しない
    if (e.type === Blockly.Events.SELECTED) return;
    // ブロックを変更したらエラーハイライトをクリア
    clearErrorHighlights();
    generateCode();
  });

  workspace.addChangeListener(function(e) {
    if (e.type !== Blockly.Events.SELECTED) return;
    if (codingMode) {
      clearBlockSelectionHighlight();
      return;
    }
    let id = (e.newElementId != null && e.newElementId !== '') ? e.newElementId : null;
    if (!id) id = getSelectedBlockId();
    paintBlockSelectionHighlight(id);
  });

  generateCode();

  // ===== テーマ切替（黒/白） =====
  const THEMES = [
    { id: 'dark',  label: '黒',  cmTheme: 'dracula', blocklyTheme: pcbTheme   },
    { id: 'light', label: '白',  cmTheme: 'default', blocklyTheme: lightTheme },
  ];
  let currentTheme = localStorage.getItem('pyco-theme') || 'dark';

  function applyTheme(themeId) {
    currentTheme = themeId;
    const t = THEMES.find(function(t) { return t.id === themeId; }) || THEMES[0];
    document.documentElement.setAttribute('data-theme', themeId === 'dark' ? '' : themeId);
    document.getElementById('btn-theme').textContent = t.label;
    editor.setOption('theme', t.cmTheme);
    workspace.setTheme(t.blocklyTheme);
    localStorage.setItem('pyco-theme', themeId);
  }

  document.getElementById('btn-theme').addEventListener('click', function() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  // ===== コードエリア フォントサイズ =====
  const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24];
  const FONT_DEFAULT = 13;
  let currentFontSize = parseInt(localStorage.getItem('pyco-font-size'), 10) || FONT_DEFAULT;

  function applyFontSize(size) {
    currentFontSize = size;
    editor.getWrapperElement().style.fontSize = size + 'px';
    editor.refresh();
    document.getElementById('monitor-output').style.fontSize = size + 'px';
    localStorage.setItem('pyco-font-size', size);
  }

  document.getElementById('btn-font-inc').addEventListener('click', function() {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    if (idx < FONT_SIZES.length - 1) applyFontSize(FONT_SIZES[idx + 1]);
  });

  document.getElementById('btn-font-dec').addEventListener('click', function() {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    if (idx > 0) applyFontSize(FONT_SIZES[idx - 1]);
  });

  applyTheme(currentTheme);
  applyFontSize(currentFontSize);

  const btnComments = document.getElementById('btn-toggle-comments');
  btnComments.addEventListener('click', function() {
    showComments = !showComments;
    btnComments.textContent = showComments ? '# ON' : '# OFF';
    btnComments.classList.toggle('comments-off', !showComments);
    generateCode();
  });

  // ===== 構文リファレンス データ =====
  const SYNTAX_REF = {
    python: [
      {
        cat: '変数',
        items: [
          { label: '代入',      code: 'x = 10' },
          { label: '文字列',    code: 'x = "hello"' },
          { label: '演算代入',  code: 'x += 1' },
        ]
      },
      {
        cat: '表示',
        items: [
          { label: 'print',     code: 'print(x)' },
          { label: '文字列+変数', code: 'print("x=", x)' },
        ]
      },
      {
        cat: '入力',
        items: [
          { label: 'input',     code: 'x = input("名前: ")' },
          { label: 'int変換',   code: 'n = int(input())' },
        ]
      },
      {
        cat: '繰り返し',
        items: [
          { label: 'for range',    code: 'for i in range(10):\n    ...' },
          { label: 'for start→stop', code: 'for i in range(1,11):\n    ...' },
          { label: 'for リスト',   code: 'for x in my_list:\n    ...' },
          { label: 'while',        code: 'while 条件:\n    ...' },
          { label: 'break',        code: 'break' },
          { label: 'continue',     code: 'continue' },
        ]
      },
      {
        cat: '分岐',
        items: [
          { label: 'if',        code: 'if 条件:\n    ...' },
          { label: 'if/else',   code: 'if 条件:\n    ...\nelse:\n    ...' },
          { label: 'elif',      code: 'elif 条件:\n    ...' },
        ]
      },
      {
        cat: '比較・論理',
        items: [
          { label: '比較',      code: 'x == y  x != y\nx > y   x <= y' },
          { label: 'and/or',   code: 'x > 0 and x < 10\nx == 1 or x == 2' },
          { label: 'not',       code: 'not 条件' },
        ]
      },
      {
        cat: '計算',
        items: [
          { label: '四則',      code: 'x + y  x - y\nx * y  x / y' },
          { label: '整数除算',  code: 'x // y' },
          { label: '余り',      code: 'x % y' },
          { label: '型変換',    code: 'int(x)  float(x)  str(x)' },
          { label: '絶対値',    code: 'abs(x)' },
          { label: '四捨五入',  code: 'round(x, 2)' },
          { label: '乱数',      code: 'import random\nrandom.randint(1, 10)' },
        ]
      },
      {
        cat: 'リスト',
        items: [
          { label: '作成',      code: 'my_list = []' },
          { label: '追加',      code: 'my_list.append(x)' },
          { label: '取得',      code: 'x = my_list[0]' },
          { label: '変更',      code: 'my_list[0] = x' },
          { label: '長さ',      code: 'len(my_list)' },
          { label: '初期値あり', code: 'my_list = [1, 2, 3]' },
        ]
      },
      {
        cat: '辞書',
        items: [
          { label: '作成',      code: 'my_dict = {"key": value}' },
          { label: '取得',      code: 'x = my_dict["key"]' },
          { label: '追加・変更', code: 'my_dict["key"] = value' },
          { label: 'キー一覧',  code: 'list(my_dict.keys())' },
          { label: 'for文',     code: 'for k in my_dict.keys():\n    ...' },
        ]
      },
      {
        cat: '関数',
        items: [
          { label: '定義（引数なし）', code: 'def my_func():\n    ...' },
          { label: '定義（引数あり）', code: 'def my_func(x):\n    ...' },
          { label: 'return',           code: 'return 値' },
          { label: '呼び出し',         code: 'my_func()\nmy_func(引数)' },
          { label: '戻り値を使う',     code: 'result = my_func(x)' },
        ]
      },
    ],
    micropython: [
      {
        cat: 'セットアップ',
        items: [
          { label: 'import',    code: 'from machine import Pin\nimport utime' },
          { label: 'LED出力',   code: 'led = Pin(25, Pin.OUT)' },
          { label: 'ピン入力',  code: 'btn = Pin(14, Pin.IN,\n         Pin.PULL_UP)' },
        ]
      },
      {
        cat: '出力',
        items: [
          { label: 'HIGH',      code: 'led.value(1)' },
          { label: 'LOW',       code: 'led.value(0)' },
          { label: 'トグル',   code: 'led.toggle()' },
        ]
      },
      {
        cat: '入力',
        items: [
          { label: 'デジタル読み', code: 'v = btn.value()' },
          { label: 'アナログ読み', code: 'from machine import ADC\nadc = ADC(26)\nv = adc.read_u16()' },
        ]
      },
      {
        cat: '時間',
        items: [
          { label: '待機(秒)',  code: 'utime.sleep(1)' },
          { label: '待機(ms)', code: 'utime.sleep_ms(500)' },
        ]
      },
      {
        cat: '繰り返し',
        items: [
          { label: '無限ループ', code: 'while True:\n    ...' },
          { label: 'for',       code: 'for i in range(10):\n    ...' },
        ]
      },
      {
        cat: '分岐',
        items: [
          { label: 'if',        code: 'if 条件:\n    ...' },
          { label: 'if/else',   code: 'if 条件:\n    ...\nelse:\n    ...' },
        ]
      },
      {
        cat: 'PoliviaBot',
        items: [
          { label: '前進',      code: 'forward(speed)' },
          { label: '後退',      code: 'backward(speed)' },
          { label: '右折/左折', code: 'turn_right(s)\nturn_left(s)' },
          { label: '停止',      code: 'stop()' },
          { label: '超音波',    code: 'dist = sonar()' },
        ]
      },
    ],
    game: [
      {
        cat: '初期化',
        items: [
          { label: '初期化', code: 'import pygame\npygame.init()' },
          { label: '画面生成', code: 'screen = pygame.display.set_mode((640, 400))' },
          { label: 'タイトル', code: 'pygame.display.set_caption("My Game")' },
          { label: 'Clock', code: 'clock = pygame.time.Clock()' },
        ]
      },
      {
        cat: 'ループ',
        items: [
          { label: '基本ループ', code: 'running = True\nwhile running:\n    ...' },
          { label: 'イベント処理', code: 'for event in pygame.event.get():\n    if event.type == pygame.QUIT:\n        running = False' },
          { label: 'フレーム更新', code: 'pygame.display.flip()\nclock.tick(60)' },
        ]
      },
      {
        cat: '描画',
        items: [
          { label: '塗りつぶし', code: 'screen.fill("#202020")' },
          { label: '四角', code: 'pygame.draw.rect(screen, "#00c864", (x, y, w, h))' },
          { label: '円', code: 'pygame.draw.circle(screen, "#ff0000", (x, y), r)' },
          { label: '線', code: 'pygame.draw.line(screen, "#ffffff", (x1, y1), (x2, y2))' },
          { label: '文字', code: 'f = pygame.font.SysFont(None, 24)\nscreen.blit(f.render("SCORE", True, "#fff"), (10, 10))' },
          { label: '画像', code: '_img = pygame.image.load("assets/game-icons/player_ship.svg")\n_rw = -1; _rh = -1\n_img = pygame.transform.scale(_img, (_rw, _rh)) if _rw > 0 and _rh > 0 else _img\n_rot_deg = 0\n_img = pygame.transform.rotate(_img, _rot_deg) if _rot_deg != 0 else _img\nscreen.blit(_img, (x, y))' },
        ]
      },
      {
        cat: '入力・判定',
        items: [
          { label: 'キー入力', code: 'keys = pygame.key.get_pressed()\nif keys[pygame.K_LEFT]:\n    x -= 5' },
          { label: 'Rect作成', code: 'r1 = pygame.Rect(x, y, 32, 32)' },
          { label: '衝突判定', code: 'if r1.colliderect(r2):\n    score += 1' },
        ]
      },
    ]
  };

  function buildSyntaxPanel(mode) {
    const data = SYNTAX_REF[mode] || SYNTAX_REF.python;
    const container = document.getElementById('syntax-content');
    document.getElementById('syntax-mode-label').textContent =
      mode === 'micropython' ? 'MicroPython'
      : mode === 'game' ? 'ゲーム'
      : 'Python入門';
    if (!container) return;
    container.replaceChildren();

    data.forEach(function(cat) {
      const catEl = document.createElement('div');
      catEl.className = 'syn-cat';

      const titleEl = document.createElement('div');
      titleEl.className = 'syn-cat-title';
      titleEl.textContent = cat.cat;
      catEl.appendChild(titleEl);

      cat.items.forEach(function(item) {
        const itemEl = document.createElement('div');
        itemEl.className = 'syn-item';
        itemEl.dataset.code = item.code;
        itemEl.title = 'クリックで挿入';

        const labelEl = document.createElement('span');
        labelEl.className = 'syn-label';
        labelEl.textContent = item.label;
        itemEl.appendChild(labelEl);

        const codeEl = document.createElement('code');
        const lines = String(item.code || '').split('\n');
        lines.forEach(function(line, i) {
          if (i > 0) codeEl.appendChild(document.createElement('br'));
          codeEl.appendChild(document.createTextNode(line));
        });
        itemEl.appendChild(codeEl);

        catEl.appendChild(itemEl);
      });

      container.appendChild(catEl);
    });
  }

  function updateSyntaxCollapseUI() {
    const mainEl = document.querySelector('.main');
    const btn = document.getElementById('btn-syntax-toggle');
    const syntaxHeader = document.querySelector('#syntax-panel .syntax-header');
    if (!mainEl || !btn) return;
    if (codingMode && !syntaxCollapsed && syntaxHeader && btn.parentElement !== syntaxHeader) {
      syntaxHeader.appendChild(btn);
    } else if ((!codingMode || syntaxCollapsed) && btn.parentElement !== mainEl) {
      mainEl.appendChild(btn);
    }
    mainEl.classList.toggle('syntax-collapsed', codingMode && syntaxCollapsed);
    btn.style.display = codingMode ? 'inline-flex' : 'none';
    btn.classList.toggle('syntax-btn-floating', codingMode && syntaxCollapsed);
    btn.textContent = syntaxCollapsed ? '▶ リファレンス表示' : '◀ リファレンス非表示';
    btn.title = syntaxCollapsed ? '構文リファレンスを表示' : '構文リファレンスを隠す';
    btn.setAttribute('aria-expanded', syntaxCollapsed ? 'false' : 'true');
  }

  // 構文パネルのクリックでエディタに挿入
  document.getElementById('syntax-content').addEventListener('click', function(e) {
    const item = e.target.closest('.syn-item');
    if (!item) return;
    const code = item.dataset.code;
    if (!code) return;
    editor.replaceSelection(code);
    editor.focus();
    // 挿入フラッシュ演出
    item.classList.add('syn-item--inserted');
    setTimeout(function() { item.classList.remove('syn-item--inserted'); }, 400);
  });

  const btnCodingMode = document.getElementById('btn-coding-mode');
  btnCodingMode.addEventListener('click', function() {
    codingMode = !codingMode;
    // main.py はブロックモード時 readonly、サブファイルは常に編集可
    editor.setOption('readOnly', activeFileIdx === 0 ? !codingMode : false);
    btnCodingMode.textContent = codingMode ? 'ブロック' : 'コード編集';
    btnCodingMode.classList.toggle('coding-active', codingMode);
    document.querySelector('.main').classList.toggle('coding-mode', codingMode);
    updateSyntaxCollapseUI();
    if (codingMode) {
      if (!syntaxCollapsed) buildSyntaxPanel(currentMode);
      setTimeout(function() { editor.refresh(); }, 30);
    } else {
      generateCode();
      setTimeout(function() { Blockly.svgResize(workspace); }, 50);
    }
  });

  const btnSyntaxToggle = document.getElementById('btn-syntax-toggle');
  if (btnSyntaxToggle) {
    btnSyntaxToggle.addEventListener('click', function() {
      if (!codingMode) return;
      syntaxCollapsed = !syntaxCollapsed;
      if (!syntaxCollapsed) buildSyntaxPanel(currentMode);
      updateSyntaxCollapseUI();
      setTimeout(function() { editor.refresh(); }, 20);
    });
  }

  // ===== ブロック XML 保存 =====
  document.getElementById('btn-save-xml').addEventListener('click', function() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const text = Blockly.Xml.domToText(xml);
    const blob = new Blob([text], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'blocks.xml';
    a.click();
  });

  // ===== ブロック XML 読込 =====
  document.getElementById('btn-load-xml').addEventListener('click', function() {
    document.getElementById('xml-input').click();
  });

  document.getElementById('xml-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const dom = new DOMParser().parseFromString(ev.target.result, 'text/xml');
        const xml = dom.documentElement;
        workspace.clear();
        Blockly.Xml.domToWorkspace(xml, workspace);
        window.__PCO_LAST_XML_SRC = file.name;
      } catch (err) {
        alert('XML の読み込みに失敗しました: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btn-download').addEventListener('click', function() {
    saveCurrentFile();
    const activeFile = pyFiles[activeFileIdx];
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = activeFile.name || 'main.py';
    a.click();
  });

  document.getElementById('btn-load').addEventListener('click', function() {
    document.getElementById('file-input').click();
  });

  document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      if (currentMode === 'python') {
        // Python入門モード: ファイル名でタブを検索、なければ追加
        let idx = pyFiles.findIndex(function(f) { return f.name === file.name; });
        if (idx === -1) {
          pyFiles.push({ name: file.name, content: ev.target.result });
          idx = pyFiles.length - 1;
        } else {
          pyFiles[idx].content = ev.target.result;
        }
        switchFile(idx);
      } else {
        fileMode = true;
        editor.setValue(ev.target.result);
        document.getElementById('serial-status').textContent = file.name + ' を読み込みました';
        document.getElementById('serial-status').className = 'serial-status serial-status--ok';
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ===== Web Serial 対応チェック =====
  const hasSerial = 'serial' in navigator;

  // ===== Web Serial：接続 / 書き込み =====
  const btnConnect = document.getElementById('btn-connect');
  const btnWrite   = document.getElementById('btn-write');
  const statusEl   = document.getElementById('serial-status');

  function setSerialStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'serial-status' + (type ? ' serial-status--' + type : '');
  }

  // ===== シリアルモニター =====
  const monitorOutput  = document.getElementById('monitor-output');
  const btnMonitorClear = document.getElementById('btn-monitor-clear');

  function appendMonitor(text) {
    monitorOutput.textContent += text;
    monitorOutput.scrollTop = monitorOutput.scrollHeight;
  }

  btnMonitorClear.addEventListener('click', function() {
    monitorOutput.textContent = '';
  });

  function updateSerialUI() {
    const connected = PicoSerial.isConnected();
    btnConnect.textContent = connected ? '切断' : '接続';
    btnConnect.classList.toggle('connected', connected);
    btnWrite.disabled = !connected;
    document.getElementById('btn-run').disabled = !connected;
    document.getElementById('btn-stop').disabled = !connected;
    // 接続時は自動でモニター開始、切断時は停止
    if (connected && !PicoSerial.isMonitoring()) {
      PicoSerial.startMonitor(appendMonitor);
    } else if (!connected) {
      PicoSerial.stopMonitor();
    }
  }

  btnConnect.addEventListener('click', async function() {
    if (PicoSerial.isConnected()) {
      await PicoSerial.disconnect();
      setSerialStatus('切断しました', 'dim');
      updateSerialUI();
      return;
    }
    try {
      setSerialStatus('ポートを選択中...', '');
      await PicoSerial.connect();
      setSerialStatus('接続済み', 'ok');
      updateSerialUI();
    } catch (e) {
      const msg = e.message.includes('open') || e.message.includes('Failed')
        ? 'ポートが他のアプリ（Thonny等）に使用中です'
        : e.message.includes('No port selected') || e.message.includes('cancelled')
        ? 'キャンセルされました'
        : e.message;
      setSerialStatus('接続失敗: ' + msg, 'err');
      updateSerialUI();
    }
  });

  document.getElementById('btn-run').addEventListener('click', async function() {
    const code = editor.getValue();
    document.getElementById('btn-run').disabled = true;
    btnWrite.disabled = true;
    btnConnect.disabled = true;
    try {
      await PicoSerial.runCode(code, msg => setSerialStatus(msg, 'progress'), appendMonitor);
    } catch (e) {
      setSerialStatus('実行エラー: ' + e.message, 'err');
    } finally {
      updateSerialUI();
      btnConnect.disabled = false;
    }
  });

  document.getElementById('btn-stop').addEventListener('click', async function() {
    try {
      await PicoSerial.stopCode();
      setSerialStatus('⏹ 停止しました', 'dim');
    } catch (e) {
      setSerialStatus('停止エラー: ' + e.message, 'err');
    }
  });

  btnWrite.addEventListener('click', async function() {
    const code = editor.getValue();
    btnWrite.disabled = true;
    btnConnect.disabled = true;
    try {
      await PicoSerial.writeMainPy(code, msg => setSerialStatus(msg, 'progress'));
      setSerialStatus('✓ 書き込み完了', 'ok');
    } catch (e) {
      setSerialStatus('書き込みエラー: ' + e.message, 'err');
    } finally {
      updateSerialUI();
      btnConnect.disabled = false;
    }
  });

  // ===== モード切替 =====

  function fitGameLayout(mainEl, forceDefault) {
    if (!mainEl) return;
    const rect = mainEl.getBoundingClientRect();
    if (!rect.width) return;

    const HANDLE_SIZE = 8;
    const MIN_LEFT = 260;
    const MIN_RIGHT = 260;

    const minLeftPct = ((MIN_LEFT / rect.width) * 100);
    const maxLeftPct = 100 - ((MIN_RIGHT + HANDLE_SIZE) / rect.width) * 100;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const parsePct = (value, fallback) => {
      const n = parseFloat((value || '').replace('%', ''));
      return Number.isFinite(n) ? n : fallback;
    };

    const style = window.getComputedStyle(mainEl);
    const curLeft = parsePct(mainEl.style.getPropertyValue('--game-left') || style.getPropertyValue('--game-left'), 50);
    const baseLeft = forceDefault ? 50 : curLeft;
    const nextLeft = clamp(baseLeft, minLeftPct, maxLeftPct);

    mainEl.style.setProperty('--game-left', `${nextLeft}%`);
  }

  function fitGameColumnSplits(mainEl, forceDefault) {
    if (!mainEl) return;
    const rect = mainEl.getBoundingClientRect();
    if (!rect.height) return;

    const HANDLE_SIZE = 6;
    const MIN_TOP = 90;
    const MIN_BOTTOM = 90;
    const minTopPct = (MIN_TOP / rect.height) * 100;
    const maxTopPct = 100 - ((MIN_BOTTOM + HANDLE_SIZE) / rect.height) * 100;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const parsePct = (value, fallback) => {
      const n = parseFloat((value || '').replace('%', ''));
      return Number.isFinite(n) ? n : fallback;
    };

    const style = window.getComputedStyle(mainEl);
    const curLeftTop = parsePct(mainEl.style.getPropertyValue('--left-top') || style.getPropertyValue('--left-top'), 56);
    const curRightTop = parsePct(mainEl.style.getPropertyValue('--right-top') || style.getPropertyValue('--right-top'), 56);
    const nextLeftTop = clamp(forceDefault ? 56 : curLeftTop, minTopPct, maxTopPct);
    const nextRightTop = clamp(forceDefault ? 56 : curRightTop, minTopPct, maxTopPct);
    mainEl.style.setProperty('--left-top', `${nextLeftTop}%`);
    mainEl.style.setProperty('--right-top', `${nextRightTop}%`);
  }

  function syncMainViewportHeight() {
    const mainEl = document.querySelector('.main');
    if (!mainEl) return;
    const header = document.querySelector('header');
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const mainH = Math.max(240, window.innerHeight - headerH);
    mainEl.style.setProperty('--main-vh', `${mainH}px`);
  }

  // モードを切り替える（clearWorkspace=trueのときワークスペースをクリア）
  function applyMode(mode, clearWorkspace) {
    currentMode = mode;
    if (clearWorkspace) workspace.clear();

    // モードボタン
    document.getElementById('btn-mode-python').classList.toggle('mode-btn--active', mode === 'python');
    document.getElementById('btn-mode-game').classList.toggle('mode-btn--active', mode === 'game');
    document.getElementById('btn-mode-micropython').classList.toggle('mode-btn--active', mode === 'micropython');

    // ツールボックス切り替え（サブファイルなら module 用ツールボックスを優先）
    let toolboxId = 'toolbox-' + mode;
    if (activeFileIdx !== 0) {
      if (mode === 'python') toolboxId = 'toolbox-module';
      else if (mode === 'game') toolboxId = 'toolbox-game-module';
    }
    workspace.updateToolbox(document.getElementById(toolboxId));

    // ラベル更新
    document.getElementById('title-sub').textContent =
      mode === 'python' ? 'Python 入門'
      : mode === 'game' ? 'ゲーム'
      : 'Raspberry Pi Pico / MicroPython';
    document.getElementById('code-header-title').textContent =
      mode === 'python' ? 'Python Output'
      : mode === 'game' ? 'Game'
      : 'MicroPython Output';
    const tutLabel = document.getElementById('tut-mode-label');
    if (tutLabel) tutLabel.textContent =
      mode === 'python' ? 'Python入門'
      : mode === 'game' ? 'ゲーム'
      : 'MicroPython';

    // シリアル関連ボタン（MicroPython && Web Serial対応のみ表示）
    const showSerial = mode === 'micropython' && hasSerial;
    ['serial-sep', 'btn-connect', 'btn-run', 'btn-stop', 'btn-write'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = showSerial ? '' : 'none';
    });

    // DEMOバッジ（MicroPythonモードでWeb Serial非対応のみ表示）
    const demoBadge = document.getElementById('demo-badge');
    if (demoBadge) demoBadge.style.display = (mode === 'micropython' && !hasSerial) ? '' : 'none';

    // Python/ゲーム 実行UI と ゲームCanvas の切り替え
    const btnRunPy  = document.getElementById('btn-run-python');
    const runPySep  = document.getElementById('run-py-sep');
    const monTitle  = document.getElementById('monitor-header-title');
    const monPanel  = document.getElementById('monitor-panel');
    const monAnchor = document.getElementById('monitor-panel-anchor');
    const monitorMainAnchor = document.getElementById('monitor-main-anchor');
    const gamePanelAnchor = document.getElementById('game-panel-anchor');
    const gameMainAnchor = document.getElementById('game-main-anchor');
    const mainEl = document.querySelector('.main');
    const divider = document.querySelector('.divider');
    const shellDock = document.getElementById('game-shell-dock');
    const dockHandle = document.getElementById('game-dock-resize-handle');
    const gameHandle = document.getElementById('game-resize-handle');
    const monOut    = document.getElementById('monitor-output');
    const monHdr    = document.querySelector('.monitor-header');
    const monHandle = document.getElementById('monitor-resize-handle');
    const gameArea  = document.getElementById('game-canvas-area');
    const syntaxPanel = document.getElementById('syntax-panel');
    const blocklyDiv = document.getElementById('blockly-div');
    const codePanel = document.querySelector('.code-panel');
    const codeOutput = document.getElementById('code-editor');
    const syntaxHomeAnchor = document.getElementById('syntax-home-anchor');
    const blocklyHomeAnchor = document.getElementById('blockly-home-anchor');
    const codeHomeAnchor = document.getElementById('code-home-anchor');
    const leftCol = document.getElementById('game-left-column');
    const rightCol = document.getElementById('game-right-column');
    const leftTopAnchor = document.getElementById('game-left-top-anchor');
    const leftBottomAnchor = document.getElementById('game-left-bottom-anchor');
    const rightTopAnchor = document.getElementById('game-right-top-anchor');
    const rightBottomAnchor = document.getElementById('game-right-bottom-anchor');

    // モード跨ぎで残るインラインサイズを都度リセット
    if (blocklyDiv) {
      blocklyDiv.style.width = '';
      blocklyDiv.style.height = '';
      blocklyDiv.style.flex = '';
    }
    if (syntaxPanel) {
      syntaxPanel.style.width = '';
      syntaxPanel.style.height = '';
      syntaxPanel.style.flex = '';
    }
    if (codePanel) codePanel.style.flex = '';
    if (codePanel) codePanel.style.width = '';
    if (codePanel) codePanel.style.height = '';
    if (codeOutput) codeOutput.style.flex = '';
    if (monOut) monOut.style.flex = '';
    if (gameArea) gameArea.style.height = '';
    if (monPanel) monPanel.style.height = '';

    if (mode === 'python' || mode === 'game') {
      if (btnRunPy) btnRunPy.style.display = '';
      if (runPySep) runPySep.style.display = '';
      if (monTitle) monTitle.textContent = mode === 'game' ? 'ゲーム シェル' : 'Python シェル';
      if (monOut)   { monOut.innerHTML = ''; monOut.classList.add('python-shell'); }
    } else {
      if (btnRunPy) btnRunPy.style.display = 'none';
      if (runPySep) runPySep.style.display = 'none';
      if (monTitle) monTitle.textContent = 'シリアルモニタ';
      if (monOut)   { monOut.innerHTML = ''; monOut.classList.remove('python-shell'); }
    }

    // ゲームモードは 2x2 レイアウトに切替
    if (mode === 'game') {
      if (mainEl) mainEl.classList.add('game-layout');
      if (divider) divider.style.display = 'none';
      if (leftCol) leftCol.style.display = '';
      if (rightCol) rightCol.style.display = '';
      if (blocklyDiv && leftTopAnchor && blocklyDiv.parentElement !== leftCol) {
        leftTopAnchor.insertAdjacentElement('afterend', blocklyDiv);
      }
      if (syntaxPanel && leftTopAnchor && syntaxPanel.parentElement !== leftCol) {
        leftTopAnchor.insertAdjacentElement('afterend', syntaxPanel);
      }
      if (gameArea && leftBottomAnchor && gameArea.parentElement !== leftCol) {
        leftBottomAnchor.insertAdjacentElement('afterend', gameArea);
      }
      if (codePanel && rightTopAnchor && codePanel.parentElement !== rightCol) {
        rightTopAnchor.insertAdjacentElement('afterend', codePanel);
      }
      if (monPanel && rightBottomAnchor && monPanel.parentElement !== rightCol) {
        rightBottomAnchor.insertAdjacentElement('afterend', monPanel);
      }
      fitGameLayout(mainEl, true);
      fitGameColumnSplits(mainEl, true);
    } else {
      if (mainEl) mainEl.classList.remove('game-layout');
      if (divider) divider.style.display = '';
      if (leftCol) leftCol.style.display = 'none';
      if (rightCol) rightCol.style.display = 'none';
      if (syntaxPanel && syntaxHomeAnchor && syntaxPanel.parentElement !== syntaxHomeAnchor.parentElement) {
        syntaxHomeAnchor.insertAdjacentElement('afterend', syntaxPanel);
      }
      if (blocklyDiv && blocklyHomeAnchor && blocklyDiv.parentElement !== blocklyHomeAnchor.parentElement) {
        blocklyHomeAnchor.insertAdjacentElement('afterend', blocklyDiv);
      }
      if (codePanel && codeHomeAnchor && codePanel.parentElement !== codeHomeAnchor.parentElement) {
        codeHomeAnchor.insertAdjacentElement('afterend', codePanel);
      }
      if (gameArea && gamePanelAnchor && gameArea.parentElement !== gamePanelAnchor.parentElement) {
        gamePanelAnchor.insertAdjacentElement('afterend', gameArea);
      }
      if (monPanel && monAnchor && monPanel.parentElement !== monAnchor.parentElement) {
        monAnchor.insertAdjacentElement('afterend', monPanel);
      }
    }

    if (gameArea) gameArea.style.display = (mode === 'game') ? '' : 'none';
    if (gameHandle) gameHandle.style.display = 'none';
    if (monHdr)   monHdr.style.display   = '';
    if (monOut)   monOut.style.display   = '';
    if (monHandle) monHandle.style.display = '';
    if (shellDock) shellDock.style.display = 'none';
    if (dockHandle) dockHandle.style.display = 'none';

    // チュートリアルリセット
    Tutorial.resetForMode();

    // ファイルタブバー表示切り替え（Python入門・ゲームモードでマルチファイル対応）
    const fileTabs = document.getElementById('file-tabs');
    if (fileTabs) {
      const tabsVisible = (mode === 'python' || mode === 'game');
      fileTabs.style.display = tabsVisible ? '' : 'none';
      if (tabsVisible) renderFileTabs();
    }

    // MicroPython モードのみ main.py を実体コードとして扱う（隠れタブ混線を防止）
    if (mode === 'micropython' && activeFileIdx !== 0) {
      saveCurrentFile();
      activeFileIdx = 0;
      editor.setValue(pyFiles[0].content || '');
      editor.setOption('readOnly', !codingMode);
    }

    // コード再生成
    generateCode();
    requestAnimationFrame(() => Blockly.svgResize(workspace));

    // コーディングモード中はモード変更時に構文パネルも更新
    if (codingMode) {
      if (!syntaxCollapsed) buildSyntaxPanel(mode);
    }
    updateSyntaxCollapseUI();
    syncMainViewportHeight();

  }

  // モードボタンのイベント
  document.getElementById('btn-mode-python').addEventListener('click', function() {
    if (currentMode === 'python') return;
    const hasBlocks = workspace.getAllBlocks(false).length > 0;
    if (hasBlocks && !confirm('Python入門モードに切り替えます。\nワークスペースのブロックがクリアされます。よろしいですか？')) return;
    applyMode('python', true);
  });

  document.getElementById('btn-mode-game').addEventListener('click', function() {
    if (currentMode === 'game') return;
    const hasBlocks = workspace.getAllBlocks(false).length > 0;
    if (hasBlocks && !confirm('ゲームモードに切り替えます。\nワークスペースのブロックがクリアされます。よろしいですか？')) return;
    applyMode('game', true);
  });

  document.getElementById('btn-mode-micropython').addEventListener('click', function() {
    if (currentMode === 'micropython') return;
    const hasBlocks = workspace.getAllBlocks(false).length > 0;
    if (hasBlocks && !confirm('MicroPythonモードに切り替えます。\nワークスペースのブロックがクリアされます。よろしいですか？')) return;
    applyMode('micropython', true);
  });

  // ===== Python シェル実行（Skulpt） =====

  let _pyStopRequested = false;

  function skulptRead(x) {
    // pyFiles から検索（'./foo.py' 形式にも対応）
    const bare = x.replace(/^\.\//, '');
    const found = pyFiles.find(function(f) { return f.name === bare; });
    if (found) return found.content;
    // ゲームモード: pygame エミュレーターを read() 経由で供給（Skulptが渡すパス形式を問わず対応）
    if (currentMode === 'game' && window.PycoPygame && window.PycoPygame.source) {
      if (x.includes('pygame')) {
        return window.PycoPygame.source;
      }
    }
    // 機械学習モジュール
    if (window.PycoML && window.PycoML.source && x.includes('pyco_ml')) {
      return window.PycoML.source;
    }
    // 画像処理モジュール
    if (window.PycoCv && window.PycoCv.source && x.includes('pyco_cv')) {
      return window.PycoCv.source;
    }
    // 統計モジュール（Skulptは標準statisticsを持たないのでshimを供給）
    if (window.PycoStats && window.PycoStats.source && x.includes('statistics')) {
      return window.PycoStats.source;
    }
    // CSVモジュール（Skulpt標準は NotImplementedError を投げるのでshimを優先）
    if (window.PycoCsv && window.PycoCsv.source && x.includes('csv')) {
      return window.PycoCsv.source;
    }
    // Skulpt 組み込みにフォールバック
    if (Sk.builtinFiles === undefined || Sk.builtinFiles['files'][x] === undefined) {
      throw "File not found: '" + x + "'";
    }
    return Sk.builtinFiles['files'][x];
  }

  function setPythonRunning(running) {
    const btnRun  = document.getElementById('btn-run-python');
    const btnStop = document.getElementById('btn-stop-python');
    btnRun.disabled    = running;
    btnRun.textContent = running ? '実行中…' : '▶ 実行';
    btnStop.style.display = running ? '' : 'none';
  }

  function runPython() {
    if (typeof Sk === 'undefined') {
      appendShellText('[エラー] Skulptが読み込まれていません。ネットワーク接続を確認してください。\n', true);
      return;
    }

    saveCurrentFile();
    // ゲームモードでは「現在見えているコード」を優先して実行する
    const mainFile = pyFiles.find(function(f) { return f.name === 'main.py'; });
    const code = currentMode === 'game'
      ? editor.getValue()
      : (mainFile ? mainFile.content : editor.getValue());
    const monOut = document.getElementById('monitor-output');

    monOut.innerHTML = '';
    appendShellText('>>> 実行開始\n', false, 'py-prompt');

    _pyStopRequested = false;
    clearErrorHighlights();
    setPythonRunning(true);

    if (currentMode === 'game') {
      window.__pygameRunning = true;
    }

    // matplotlib プロットエリアをクリア（前回の描画を消す）
    const plotArea = document.getElementById('pyco-plot-area');
    if (plotArea) plotArea.innerHTML = '';
    const plotRow = document.getElementById('pyco-plot-row');
    if (plotRow) plotRow.style.display = 'none';
    const plotHandle = document.getElementById('plot-resize-handle');
    if (plotHandle) plotHandle.style.display = 'none';
    // 画像処理表示エリアをクリア
    const cvArea = document.getElementById('cv-display-area');
    if (cvArea) {
      cvArea.innerHTML = '';
      cvArea.style.display = 'none';
    }
    // Skulpt matplotlib の描画先として pyco-plot-area を設定
    Sk.TurtleGraphics = { target: 'pyco-plot-area', width: 600, height: 420 };

    Sk.configure({
      output: function(text) {
        appendShellText(text);
        monOut.scrollTop = monOut.scrollHeight;
      },
      read: skulptRead,
      inputfun: function(prompt) {
        const answer = window.prompt(prompt || '');
        appendShellText((prompt || '') + (answer !== null ? answer : '') + '\n', false, 'py-prompt');
        return answer !== null ? answer : '';
      },
      inputfunTakesPrompt: true,
      yieldLimit: 200,   // 200ステップごとにブラウザへ制御を返す（停止ボタン応答に必要）
      __future__: Sk.python3,
    });

    const _pycoOpenFn = function(file, mode, buffering, encoding, errors, newline, closefd, opener) {
      const fname = Sk.ffi.remapToJs(file);
      const m = (mode && mode !== Sk.builtin.none.none$) ? Sk.ffi.remapToJs(mode) : 'r';
      return makePycoFileObj(fname, m);
    };
    _pycoOpenFn.co_varnames = ['file', 'mode', 'buffering', 'encoding', 'errors', 'newline', 'closefd', 'opener'];
    _pycoOpenFn.$defaults = [
      new Sk.builtin.str('r'),
      new Sk.builtin.int_(-1),
      Sk.builtin.none.none$,
      Sk.builtin.none.none$,
      Sk.builtin.none.none$,
      Sk.builtin.bool.true$,
      Sk.builtin.none.none$,
    ];
    Sk.builtins['open'] = new Sk.builtin.func(_pycoOpenFn);

    // Sk.configure の後に pygame を登録（configure が builtinFiles をリセットするため必ず後に呼ぶ）
    if (currentMode === 'game' && window.PycoPygame && typeof window.PycoPygame.installIntoSkulpt === 'function') {
      try { window.PycoPygame.installIntoSkulpt(Sk); } catch (e) { console.warn('pygame install failed', e); }
    }
    // 機械学習モジュール登録
    if (window.PycoML && typeof window.PycoML.installIntoSkulpt === 'function') {
      try { window.PycoML.installIntoSkulpt(Sk); } catch (e) { console.warn('pyco_ml install failed', e); }
    }
    // 画像処理モジュール登録
    if (window.PycoCv && typeof window.PycoCv.installIntoSkulpt === 'function') {
      try { window.PycoCv.installIntoSkulpt(Sk); } catch (e) { console.warn('pyco_cv install failed', e); }
    }
    // matplotlib グラフモジュール登録
    if (window.PycoChart && typeof window.PycoChart.installIntoSkulpt === 'function') {
      try { window.PycoChart.installIntoSkulpt(Sk); } catch (e) { console.warn('matplotlib install failed', e); }
    }
    // statistics モジュール登録
    if (window.PycoStats && typeof window.PycoStats.installIntoSkulpt === 'function') {
      try { window.PycoStats.installIntoSkulpt(Sk); } catch (e) { console.warn('statistics install failed', e); }
    }
    // csv モジュール登録
    if (window.PycoCsv && typeof window.PycoCsv.installIntoSkulpt === 'function') {
      try { window.PycoCsv.installIntoSkulpt(Sk); } catch (e) { console.warn('csv install failed', e); }
    }

    Sk.misceval.asyncToPromise(function() {
      return Sk.importMainWithBody('<stdin>', false, code, true);
    }, {
      '*': function() {
        if (_pyStopRequested) {
          throw new Sk.builtin.SystemExit('停止');
        }
      }
    }).then(function() {
      appendShellText('>>> 完了\n', false, 'py-prompt');
      // matplotlib でグラフが描かれた場合は表示
      if (plotArea && plotArea.querySelector('canvas, svg, img')) {
        const plotRow = document.getElementById('pyco-plot-row');
        if (plotRow) plotRow.style.display = 'flex';
      }
    }).catch(function(err) {
      if (_pyStopRequested) {
        appendShellText('>>> 停止しました\n', false, 'py-prompt');
        return;
      }
      const parsed = parseSkulptError(err);
      // シェルにエラー表示
      appendShellText('\n' + parsed.title + '\n', true);
      // ブロックハイライト（コーディングモードでなく blockLineMap がある場合のみ）
      if (!codingMode && blockLineMap.size > 0) {
        const bid = parsed.lineno ? blockIdAtLine(parsed.lineno) : null;
        showErrorOnBlock(bid, parsed.title, parsed.detail);
      }
    }).finally(function() {
      setPythonRunning(false);
      monOut.scrollTop = monOut.scrollHeight;
    });
  }

  function appendShellText(text, isError, cls) {
    const monOut = document.getElementById('monitor-output');
    const span   = document.createElement('span');
    if (isError) {
      span.className = 'py-error';
    } else if (cls) {
      span.className = cls;
    }
    span.textContent = text;
    monOut.appendChild(span);
  }

  // ===== エラーハイライト =====

  // blockLineMap（0始まり行番号）から最も近いブロックIDを返す
  function blockIdAtLine(lineNo1) {
    const lineNo0 = lineNo1 - 1; // Skulptは1始まり → 0始まりに変換
    let bestId = null, bestDist = Infinity;
    blockLineMap.forEach(function(range, id) {
      const dist = lineNo0 >= range.from && lineNo0 <= range.to
        ? 0
        : Math.min(Math.abs(lineNo0 - range.from), Math.abs(lineNo0 - range.to));
      if (dist < bestDist) { bestDist = dist; bestId = id; }
    });
    return bestId;
  }

  function clearErrorHighlights() {
    workspace.getAllBlocks(false).forEach(function(b) {
      b.getSvgRoot().classList.remove('block-error-highlight');
    });
    const panel = document.getElementById('error-hint');
    if (panel) panel.style.display = 'none';
  }

  function showErrorOnBlock(blockId, title, detail) {
    clearErrorHighlights();
    const block = blockId ? workspace.getBlockById(blockId) : null;
    if (block) {
      block.getSvgRoot().classList.add('block-error-highlight');
      block.select();
    }
    const panel = document.getElementById('error-hint');
    if (!panel) return;
    document.getElementById('error-hint-title').textContent = title;
    document.getElementById('error-hint-body').textContent = detail;
    // Blocklyエリアの横幅にパネルを合わせる
    const blocklyDiv = document.getElementById('blockly-div');
    if (blocklyDiv) {
      const rect = blocklyDiv.getBoundingClientRect();
      panel.style.left  = rect.left + 'px';
      panel.style.width = rect.width + 'px';
    }
    panel.style.display = 'block';
  }

  // Skulptエラーを解析して { lineno, title, detail } を返す
  function parseSkulptError(err) {
    const tp = err.tp$name || '';
    let rawMsg = '';
    try { rawMsg = err.args.v[0].v; } catch (e) { rawMsg = err.toString ? err.toString() : String(err); }

    // 行番号取得（tracebackの最後のフレーム）
    let lineno = null;
    if (err.traceback && err.traceback.length > 0) {
      lineno = err.traceback[err.traceback.length - 1].lineno;
    }

    // エラー種別ごとの日本語タイトル＋解説
    let title = tp ? tp + ': ' + rawMsg : rawMsg;
    let detail = '';

    if (tp === 'NameError') {
      const m = rawMsg.match(/name '(.+?)' is not defined/);
      const name = m ? `「${m[1]}」` : '変数・関数名';
      title = `NameError — ${name} が見つかりません`;
      detail = `${name} はまだ定義されていません。\n・スペルミスがないか確認してください\n・変数を使う前に「変数に入れる」ブロックで値をセットしてください\n・関数を使う前に「関数を定義する」ブロックが必要です`;
    } else if (tp === 'TypeError') {
      title = `TypeError — データの型が合っていません`;
      if (rawMsg.includes('unsupported operand') || rawMsg.includes('can only concatenate')) {
        detail = `文字列と数値を足し算しようとしています。\n・数値に変換するには「型変換（int/float）」ブロックを使ってください\n・文字列として結合するには「文字列に変換（str）」してから「文字列連結」ブロックを使ってください`;
      } else if (rawMsg.includes('takes') && rawMsg.includes('argument')) {
        detail = `関数に渡す引数の数が間違っています。\n・関数定義の引数の数と、呼び出し時の引数の数を合わせてください`;
      } else {
        detail = `型（文字列・数値・リストなど）が合っていない操作をしています。\n原因: ${rawMsg}`;
      }
    } else if (tp === 'ZeroDivisionError') {
      title = `ZeroDivisionError — 0 で割っています`;
      detail = `割り算の右側（割る数）が 0 になっています。\n0 では割れないので、割る数が 0 にならないか確認してください。`;
    } else if (tp === 'IndexError') {
      title = `IndexError — リストの番号が範囲外です`;
      detail = `リストに存在しない番号（インデックス）にアクセスしています。\n・リストの長さを「リストの長さ」ブロックで確認してください\n・番号は 0 から始まります（1番目 = 0、2番目 = 1…）`;
    } else if (tp === 'AttributeError') {
      title = `AttributeError — 存在しない機能を呼び出しています`;
      detail = `その変数・オブジェクトには、その機能（メソッド）がありません。\n原因: ${rawMsg}`;
    } else if (tp === 'ValueError') {
      title = `ValueError — 値の形式が正しくありません`;
      if (rawMsg.includes('invalid literal') && rawMsg.includes('int')) {
        detail = `文字列を整数（int）に変換しようとしましたが、数字以外の文字が含まれています。\n・入力した文字列が「123」のような数字だけかどうか確認してください`;
      } else {
        detail = `値の形式が正しくありません。\n原因: ${rawMsg}`;
      }
    } else if (tp === 'IndentationError' || tp === 'SyntaxError') {
      title = `${tp} — コードの形式エラー（ブロックモードでは通常発生しません）`;
      detail = `コーディングモードで直接書いたコードに問題があります。\n原因: ${rawMsg}`;
    } else if (rawMsg.includes('execLimit') || rawMsg.includes('Execution exceeded')) {
      title = `TimeLimitError — 実行ステップ数の上限を超えました`;
      detail = `ループが終わらずに繰り返し続けている可能性があります。\n・「ずっと繰り返す（while True）」の中に終了条件があるか確認してください\n・繰り返し回数が多すぎないか確認してください`;
      lineno = null; // 特定行なし
    } else {
      detail = rawMsg;
    }

    return { lineno: lineno, title: title, detail: detail };
  }

  document.getElementById('error-hint-close').addEventListener('click', clearErrorHighlights);

  document.getElementById('btn-run-python').addEventListener('click', runPython);
  document.getElementById('btn-stop-python').addEventListener('click', function() {
    _pyStopRequested = true;
    if (currentMode === 'game') {
      window.__pygameRunning = false;
    }
  });

  // ===== チュートリアルマネージャー =====
  function setSafeRichText(targetEl, html) {
    if (!targetEl) return;
    const raw = (html == null) ? '' : String(html);
    if (!raw) {
      targetEl.replaceChildren();
      return;
    }

    // Tiny sanitizer: allow basic formatting only, strip all attributes.
    const allowed = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'CODE', 'PRE', 'UL', 'OL', 'LI', 'SPAN']);
    const parser = new DOMParser();
    const doc = parser.parseFromString('<div>' + raw + '</div>', 'text/html');
    const root = doc.body && doc.body.firstElementChild;
    if (!root) {
      targetEl.textContent = raw;
      return;
    }

    function cloneNodeSafe(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || '');
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return null;

      const tag = node.tagName;
      if (!allowed.has(tag)) {
        // Keep text content of disallowed elements (e.g., script/style/a/img).
        return document.createTextNode(node.textContent || '');
      }

      const el = document.createElement(tag.toLowerCase());
      for (const child of Array.from(node.childNodes)) {
        const safeChild = cloneNodeSafe(child);
        if (safeChild) el.appendChild(safeChild);
      }
      return el;
    }

    const frag = document.createDocumentFragment();
    for (const child of Array.from(root.childNodes)) {
      const safe = cloneNodeSafe(child);
      if (safe) frag.appendChild(safe);
    }
    targetEl.replaceChildren(frag);
  }

  Tutorial = {
    currentStep: 0,
    isOpen: false,

    init() {
      document.getElementById('btn-tutorial').addEventListener('click', () => {
        if (this.isOpen) this.close(); else this.open();
      });
      document.getElementById('tut-close').addEventListener('click', () => this.close());
      document.getElementById('tut-hint-toggle').addEventListener('click', () => {
        const hint = document.getElementById('tut-hint');
        const btn  = document.getElementById('tut-hint-toggle');
        const shown = hint.style.display !== 'none';
        hint.style.display = shown ? 'none' : 'block';
        btn.textContent    = shown ? '💡 ヒントを見る' : '💡 ヒントを隠す';
      });
      document.getElementById('tut-prev').addEventListener('click', () => this.prev());
      document.getElementById('tut-next').addEventListener('click', () => this.next());
    },

    open() {
      this.isOpen = true;
      document.getElementById('tutorial-panel').classList.add('tutorial-panel--open');
      document.getElementById('btn-tutorial').classList.add('tutorial-active');
      this.render();
      // Blocklyのリサイズを通知
      setTimeout(() => Blockly.svgResize(workspace), 310);
    },

    close() {
      this.isOpen = false;
      document.getElementById('tutorial-panel').classList.remove('tutorial-panel--open');
      document.getElementById('btn-tutorial').classList.remove('tutorial-active');
      setTimeout(() => Blockly.svgResize(workspace), 310);
    },

    steps() {
      return (typeof TUTORIALS !== 'undefined' && TUTORIALS[currentMode]) || [];
    },

    resetForMode() {
      this.currentStep = 0;
      if (this.isOpen) this.render();
    },

    render() {
      const steps = this.steps();
      if (!steps.length) return;
      const idx   = Math.min(this.currentStep, steps.length - 1);
      const step  = steps[idx];
      const total = steps.length;

      document.getElementById('tut-title').textContent    = step.title;
      setSafeRichText(document.getElementById('tut-body'), step.body);
      setSafeRichText(document.getElementById('tut-hint'), step.hint);
      document.getElementById('tut-hint').style.display  = 'none';
      document.getElementById('tut-hint-toggle').textContent = '💡 ヒントを見る';
      document.getElementById('tut-progress').textContent = `${idx + 1} / ${total}`;
      document.getElementById('tut-pbar-fill').style.width = `${(idx + 1) / total * 100}%`;

      document.getElementById('tut-prev').disabled = (idx === 0);
      const nextBtn = document.getElementById('tut-next');
      nextBtn.disabled    = true;
      nextBtn.textContent = (idx === total - 1) ? '完了 ✓' : '次へ ▶';

      const checkEl = document.getElementById('tut-check');
      checkEl.textContent = '○ 待機中';
      checkEl.className   = 'tut-check';

      // 現在のワークスペース状態で即時チェック
      const blockTypes = new Set(workspace.getAllBlocks(false).map(b => b.type));
      this._applyCheck(step, blockTypes);
    },

    check(blockTypes) {
      if (!this.isOpen) return;
      const steps = this.steps();
      if (!steps.length) return;
      this._applyCheck(steps[this.currentStep], blockTypes);
    },

    _applyCheck(step, blockTypes) {
      const passed  = step.check(blockTypes);
      const checkEl = document.getElementById('tut-check');
      const nextBtn = document.getElementById('tut-next');
      if (passed) {
        checkEl.textContent = '✓ クリア！';
        checkEl.className   = 'tut-check tut-check--done';
        nextBtn.disabled    = false;
      } else {
        checkEl.textContent = '○ 待機中';
        checkEl.className   = 'tut-check';
        nextBtn.disabled    = true;
      }
    },

    next() {
      const steps = this.steps();
      if (this.currentStep < steps.length - 1) {
        this.currentStep++;
        this.render();
      } else {
        this.close();
      }
    },

    prev() {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.render();
      }
    },
  };

  // ===== リサイズ機能 =====

  // 左右 / 上下リサイズ（ブロックエリア ↔ コードパネル）
  // ≤900px の縦積みレイアウト時は clientY で高さリサイズに自動切替
  (function() {
    const divider    = document.querySelector('.divider');
    const blocklyDiv = document.getElementById('blockly-div');
    const codePanel  = document.querySelector('.code-panel');
    const mainEl     = document.querySelector('.main');
    let dragging = false;
    let startX = 0, startY = 0, startW = 0, startH = 0;

    function isColumnMode() {
      return window.innerWidth <= 900;
    }

    function startDrag(clientX, clientY) {
      dragging = true;
      divider.classList.add('dragging');
      document.body.style.userSelect = 'none';
      if (isColumnMode()) {
        startY = clientY;
        startH = blocklyDiv.getBoundingClientRect().height;
        document.body.style.cursor = 'row-resize';
      } else {
        startX = clientX;
        startW = blocklyDiv.getBoundingClientRect().width;
        document.body.style.cursor = 'col-resize';
      }
    }

    function onMove(clientX, clientY) {
      if (!dragging) return;
      if (isColumnMode()) {
        const mainH = mainEl.getBoundingClientRect().height;
        const divH  = divider.getBoundingClientRect().height;
        const newH  = Math.max(100, Math.min(mainH - divH - 100, startH + (clientY - startY)));
        blocklyDiv.style.height = newH + 'px';
        blocklyDiv.style.flex   = 'none';
        codePanel.style.flex    = '1';
      } else {
        const mainW = mainEl.getBoundingClientRect().width;
        const divW  = divider.getBoundingClientRect().width;
        const newW  = Math.max(200, Math.min(mainW - divW - 200, startW + (clientX - startX)));
        blocklyDiv.style.width = newW + 'px';
        blocklyDiv.style.flex  = 'none';
        codePanel.style.flex   = '1';
      }
      Blockly.svgResize(workspace);
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      divider.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    divider.addEventListener('mousedown',  e => startDrag(e.clientX, e.clientY));
    divider.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    document.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('mouseup',   () => endDrag());
    document.addEventListener('touchend',  () => endDrag());
  })();

  // 上下リサイズ（コード表示 ↔ シリアルモニタ）
  (function() {
    const handle      = document.getElementById('monitor-resize-handle');
    const codeOutput  = document.getElementById('code-editor');
    const monitorOut  = document.getElementById('monitor-output');
    const monitorPanel = document.getElementById('monitor-panel');
    const mainEl = document.querySelector('.main');
    const parsePct = (value, fallback) => {
      const n = parseFloat((value || '').replace('%', ''));
      return Number.isFinite(n) ? n : fallback;
    };
    let dragging = false, startY = 0, startH = 0;

    function startDrag(clientY) {
      dragging = true;
      startY = clientY;
      startH = (currentMode === 'game' && monitorPanel)
        ? parsePct(mainEl.style.getPropertyValue('--right-top') || window.getComputedStyle(mainEl).getPropertyValue('--right-top'), 56)
        : codeOutput.getBoundingClientRect().height;
      handle.classList.add('dragging');
      document.body.style.userSelect = 'none';
    }
    function onMove(clientY) {
      if (!dragging) return;
      if (currentMode === 'game') {
        if (!mainEl) return;
        const rect = mainEl.getBoundingClientRect();
        if (!rect.height) return;
        const minTop = (90 / rect.height) * 100;
        const maxTop = 100 - ((90 + 6) / rect.height) * 100;
        const deltaPct = ((clientY - startY) / rect.height) * 100;
        const next = Math.max(minTop, Math.min(maxTop, startH + deltaPct));
        mainEl.style.setProperty('--right-top', `${next}%`);
        requestAnimationFrame(() => Blockly.svgResize(workspace));
      } else {
        const newH = Math.max(60, startH + (clientY - startY));
        codeOutput.style.flex = `0 0 ${newH}px`;
        monitorOut.style.flex = '1 1 0';
      }
    }
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.userSelect = '';
      if (currentMode === 'game') {
        requestAnimationFrame(() => Blockly.svgResize(workspace));
      }
    }

    handle.addEventListener('mousedown', e => { document.body.style.cursor = 'row-resize'; startDrag(e.clientY); });
    handle.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientY); }, { passive: false });
    document.addEventListener('mousemove', e => onMove(e.clientY));
    document.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('mouseup', () => { document.body.style.cursor = ''; endDrag(); });
    document.addEventListener('touchend', endDrag);
  })();

  // 上下リサイズ（シェル出力 ↔ グラフエリア）
  (function() {
    const handle   = document.getElementById('plot-resize-handle');
    const plotArea = document.getElementById('pyco-plot-area');
    if (!handle || !plotArea) return;

    let dragging = false, startY = 0, startH = 0;

    function startDrag(clientY) {
      dragging = true;
      startY   = clientY;
      startH   = plotArea.getBoundingClientRect().height;
      handle.classList.add('dragging');
      document.body.style.userSelect = 'none';
    }
    function onMove(clientY) {
      if (!dragging) return;
      const newH = Math.max(80, startH - (clientY - startY));
      plotArea.style.height = newH + 'px';
      // Chart.js にリサイズを通知
      if (window.Chart) {
        const chart = Chart.getChart(plotArea.querySelector('canvas'));
        if (chart) chart.resize();
      }
    }
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.userSelect = '';
    }

    handle.addEventListener('mousedown', e => { document.body.style.cursor = 'row-resize'; startDrag(e.clientY); });
    handle.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientY); }, { passive: false });
    document.addEventListener('mousemove', e => onMove(e.clientY));
    document.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('mouseup', () => { document.body.style.cursor = ''; endDrag(); });
    document.addEventListener('touchend', endDrag);
  })();

  // 左右リサイズ（グラフエリアの横幅）
  (function() {
    const wHandle  = document.getElementById('plot-width-handle');
    const plotArea = document.getElementById('pyco-plot-area');
    const plotRow  = document.getElementById('pyco-plot-row');
    if (!wHandle || !plotArea || !plotRow) return;

    let dragging = false, startX = 0, startW = 0;

    function startDrag(clientX) {
      dragging = true;
      startX   = clientX;
      startW   = plotArea.getBoundingClientRect().width;
      wHandle.classList.add('dragging');
      document.body.style.userSelect = 'none';
    }
    function onMove(clientX) {
      if (!dragging) return;
      const rowW = plotRow.getBoundingClientRect().width;
      const newW = Math.min(rowW - 6, Math.max(150, startW + (clientX - startX)));
      plotArea.style.flex = `0 0 ${newW}px`;
      if (window.Chart) {
        const chart = Chart.getChart(plotArea.querySelector('canvas'));
        if (chart) chart.resize();
      }
    }
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      wHandle.classList.remove('dragging');
      document.body.style.userSelect = '';
    }

    wHandle.addEventListener('mousedown', e => { document.body.style.cursor = 'col-resize'; startDrag(e.clientX); });
    wHandle.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientX); }, { passive: false });
    document.addEventListener('mousemove', e => onMove(e.clientX));
    document.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientX); } }, { passive: false });
    document.addEventListener('mouseup', () => { document.body.style.cursor = ''; endDrag(); });
    document.addEventListener('touchend', endDrag);
  })();

  // 上下リサイズ（コード表示 ↔ ゲーム画面）
  (function() {
    const handle   = document.getElementById('game-resize-handle');
    const codeOut  = document.getElementById('code-editor');
    const gameArea = document.getElementById('game-canvas-area');
    if (!handle || !codeOut || !gameArea) return;

    let dragging = false;
    let startY = 0;
    let startCodeH = 0;

    function startDrag(clientY) {
      if (currentMode !== 'game') return;
      dragging = true;
      startY = clientY;
      startCodeH = codeOut.getBoundingClientRect().height;
      handle.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    }

    function onMove(clientY) {
      if (!dragging) return;
      const panel = document.querySelector('.code-panel');
      if (!panel) return;
      const panelH = panel.getBoundingClientRect().height;
      const delta = clientY - startY;
      const minCode = 80;
      const minGame = 140;
      const newCode = Math.max(minCode, Math.min(panelH - minGame, startCodeH + delta));
      codeOut.style.flex = `0 0 ${newCode}px`;
      gameArea.style.flex = '1 1 auto';
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    handle.addEventListener('mousedown', e => startDrag(e.clientY));
    handle.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientY); }, { passive: false });
    document.addEventListener('mousemove', e => onMove(e.clientY));
    document.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  })();

  // ゲーム表示エリアの個別上下リサイズ（ゲームパネルのみ）
  (function() {
    const handle = document.getElementById('game-area-resize-handle');
    const mainEl = document.querySelector('.main');
    if (!handle || !mainEl) return;

    let dragging = false;
    let startY = 0;
    let startTopPct = 56;

    function parsePct(value, fallback) {
      const n = parseFloat((value || '').replace('%', ''));
      return Number.isFinite(n) ? n : fallback;
    }

    function startDrag(clientY) {
      if (currentMode !== 'game') return;
      dragging = true;
      startY = clientY;
      startTopPct = parsePct(mainEl.style.getPropertyValue('--left-top') || window.getComputedStyle(mainEl).getPropertyValue('--left-top'), 56);
      handle.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    }

    function onMove(clientY) {
      if (!dragging || currentMode !== 'game') return;
      const rect = mainEl.getBoundingClientRect();
      if (!rect.height) return;
      const minTop = (90 / rect.height) * 100;
      const maxTop = 100 - ((90 + 6) / rect.height) * 100;
      const deltaPct = ((clientY - startY) / rect.height) * 100;
      const next = Math.max(minTop, Math.min(maxTop, startTopPct + deltaPct));
      mainEl.style.setProperty('--left-top', `${next}%`);
      requestAnimationFrame(() => Blockly.svgResize(workspace));
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      requestAnimationFrame(() => Blockly.svgResize(workspace));
    }

    handle.addEventListener('mousedown', e => startDrag(e.clientY));
    handle.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientY); }, { passive: false });
    document.addEventListener('mousemove', e => onMove(e.clientY));
    document.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  })();

  // 上下リサイズ（上エリア ↔ 下段ゲームシェル）
  (function() {
    const handle = document.getElementById('game-dock-resize-handle');
    const shellDock = document.getElementById('game-shell-dock');
    if (!handle || !shellDock) return;

    let dragging = false;
    let startY = 0;
    let startH = 0;

    function startDrag(clientY) {
      if (currentMode !== 'game') return;
      dragging = true;
      startY = clientY;
      startH = shellDock.getBoundingClientRect().height;
      handle.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    }

    function onMove(clientY) {
      if (!dragging) return;
      const main = document.querySelector('.main');
      if (!main) return;
      const viewport = window.innerHeight;
      const header = document.querySelector('header');
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const minDock = 120;
      const maxDock = Math.max(minDock, viewport - headerH - 140);
      const next = Math.max(minDock, Math.min(maxDock, startH - (clientY - startY)));
      shellDock.style.height = next + 'px';
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    handle.addEventListener('mousedown', e => startDrag(e.clientY));
    handle.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientY); }, { passive: false });
    document.addEventListener('mousemove', e => onMove(e.clientY));
    document.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  })();

  // ゲーム2x2レイアウトの左右リサイズ
  (function() {
    const mainEl = document.querySelector('.main');
    const vHandle = document.getElementById('game-grid-v-handle');
    if (!mainEl || !vHandle) return;
    let dragging = false;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function calcBounds(rect) {
      const HANDLE_SIZE = 8;
      const MIN_LEFT = 260;
      const MIN_RIGHT = 260;
      return {
        minLeftPct: (MIN_LEFT / rect.width) * 100,
        maxLeftPct: 100 - ((MIN_RIGHT + HANDLE_SIZE) / rect.width) * 100
      };
    }

    function startDrag() {
      if (currentMode !== 'game' || !mainEl.classList.contains('game-layout')) return;
      dragging = true;
      vHandle.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    function moveDrag(clientX) {
      if (!dragging || currentMode !== 'game') return;
      const rect = mainEl.getBoundingClientRect();
      if (!rect.width) return;
      const bounds = calcBounds(rect);
      const raw = ((clientX - rect.left) / rect.width) * 100;
      mainEl.style.setProperty('--game-left', `${clamp(raw, bounds.minLeftPct, bounds.maxLeftPct)}%`);
      requestAnimationFrame(() => Blockly.svgResize(workspace));
    }

    function endDrag() {
      if (!dragging) return;
      vHandle.classList.remove('dragging');
      dragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      requestAnimationFrame(() => Blockly.svgResize(workspace));
    }

    vHandle.addEventListener('mousedown', startDrag);
    vHandle.addEventListener('touchstart', e => { e.preventDefault(); startDrag(); }, { passive: false });
    document.addEventListener('mousemove', e => moveDrag(e.clientX));
    document.addEventListener('touchmove', e => {
      if (!dragging) return;
      e.preventDefault();
      moveDrag(e.touches[0].clientX);
    }, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    window.addEventListener('resize', () => {
      if (mainEl.classList.contains('game-layout')) {
        fitGameLayout(mainEl, false);
        fitGameColumnSplits(mainEl, false);
        requestAnimationFrame(() => Blockly.svgResize(workspace));
      }
    });
  })();

  // ?src= で XML を読み込んだときのパス（スクリーンショットの既定ファイル名に利用）
  window.__PCO_LAST_XML_SRC = window.__PCO_LAST_XML_SRC || '';

  // ===== スクリーンショット保存 =====
  (function registerScreenshotMenu() {
    function captureWorkspaceAsPng() {
      const blocks = workspace.getAllBlocks(false);
      if (blocks.length === 0) { alert('ブロックがありません'); return; }

      const blockCanvas = workspace.getCanvas();
      const bbox = blockCanvas.getBBox();
      if (!bbox || bbox.width === 0 || bbox.height === 0) { alert('ブロックがありません'); return; }

      const padding = 20;

      // blockCanvas の CTM（translate+scale）でSVGルート座標に変換
      const ctm = blockCanvas.getCTM();
      const x1 = ctm.a * bbox.x + ctm.e;
      const y1 = ctm.d * bbox.y + ctm.f;
      const x2 = ctm.a * (bbox.x + bbox.width)  + ctm.e;
      const y2 = ctm.d * (bbox.y + bbox.height) + ctm.f;

      const viewX = x1 - padding;
      const viewY = y1 - padding;
      const viewW = (x2 - x1) + padding * 2;
      const viewH = (y2 - y1) + padding * 2;
      const imgW  = Math.ceil(viewW);
      const imgH  = Math.ceil(viewH);

      // BlobURL経由では外部CSS・CSS変数が解決されないため、
      // クローン前にオリジナル要素のcomputedスタイルをインライン属性に書き込む
      const inlineProps = ['fill', 'font-family', 'font-size', 'font-weight'];
      const textEls = Array.from(blockCanvas.querySelectorAll('text, tspan'));
      const savedAttrs = textEls.map(el => {
        const saved = {};
        inlineProps.forEach(p => { saved[p] = el.getAttribute(p); });
        return saved;
      });
      textEls.forEach(el => {
        const cs = window.getComputedStyle(el);
        inlineProps.forEach(p => {
          const camel = p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          const val = cs[camel] || cs.getPropertyValue(p);
          if (val && val !== 'none' && val !== '') el.setAttribute(p, val);
        });
      });

      // blockCanvas のみを新しいSVGにラップ（背景・ツールボックスを含めない）
      const ns = 'http://www.w3.org/2000/svg';
      const newSvg = document.createElementNS(ns, 'svg');
      newSvg.setAttribute('xmlns', ns);
      newSvg.setAttribute('width',   imgW);
      newSvg.setAttribute('height',  imgH);
      newSvg.setAttribute('viewBox', `${viewX} ${viewY} ${viewW} ${viewH}`);

      // defs（フィルター・クリッピング定義）をコピー
      const origDefs = workspace.getParentSvg().querySelector('defs');
      if (origDefs) newSvg.appendChild(origDefs.cloneNode(true));

      // ブロック本体をコピー（インライン属性が書き込まれた状態でクローン）
      newSvg.appendChild(blockCanvas.cloneNode(true));

      // オリジナル要素を元の状態に戻す
      textEls.forEach((el, i) => {
        inlineProps.forEach(p => {
          const v = savedAttrs[i][p];
          if (v === null) el.removeAttribute(p);
          else el.setAttribute(p, v);
        });
      });

      const svgStr = new XMLSerializer().serializeToString(newSvg);
      const blob   = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url    = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width  = imgW;
        canvas.height = imgH;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const a = document.createElement('a');
        const now = new Date();
        const ts = now.getFullYear()
          + String(now.getMonth() + 1).padStart(2, '0')
          + String(now.getDate()).padStart(2, '0') + '_'
          + String(now.getHours()).padStart(2, '0')
          + String(now.getMinutes()).padStart(2, '0')
          + String(now.getSeconds()).padStart(2, '0');
        let basename = '';
        try {
          const raw = typeof window.__PCO_LAST_XML_SRC === 'string' ? window.__PCO_LAST_XML_SRC.trim() : '';
          if (raw) {
            const last = raw.split(/[/?#]/).filter(Boolean).pop();
            if (last && /\.xml$/i.test(last)) basename = last.replace(/\.xml$/i, '');
          }
        } catch (_) {}
        a.download = basename ? `${basename}.png` : `pyco_blocks_${ts}.png`;
        a.href = canvas.toDataURL('image/png');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
      img.onerror = function() { URL.revokeObjectURL(url); alert('画像の生成に失敗しました'); };
      img.src = url;
    }

    const menuDef = {
      displayText: '全ブロックを画像保存',
      preconditionFn: function() {
        return workspace.getAllBlocks(false).length > 0 ? 'enabled' : 'disabled';
      },
      callback: function() { captureWorkspaceAsPng(); },
      weight: 200,
    };

    Blockly.ContextMenuRegistry.registry.register(
      Object.assign({ id: 'pcb_screenshot_block', scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK }, menuDef)
    );
    Blockly.ContextMenuRegistry.registry.register(
      Object.assign({ id: 'pcb_screenshot_workspace', scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE }, menuDef)
    );
  })();

  window.addEventListener('resize', syncMainViewportHeight);
  syncMainViewportHeight();

  // ===== 初期化 =====
  Tutorial.init();
  // URLパラメータ ?mode=micropython でモードを指定できる（省略時は python）
  const _urlParams = new URLSearchParams(window.location.search);
  const _urlMode = _urlParams.get('mode');
  applyMode(_urlMode === 'micropython' ? 'micropython' : (_urlMode === 'game' ? 'game' : 'python'), false);

  // URLパラメータ ?src=path/to/file.xml でワークスペースにXMLを自動読み込み
  // ルートが <project> ならマルチファイルとして展開、 <xml> なら従来通り単一ロード
  function _loadProjectXml(projectEl) {
    var fileEls = projectEl.querySelectorAll(':scope > file');
    if (fileEls.length === 0) return;
    pyFiles = [];
    fileEls.forEach(function(fileEl) {
      var name = fileEl.getAttribute('name') || 'unnamed.py';
      var xmlEl = fileEl.querySelector(':scope > xml');
      var xmlText = xmlEl ? Blockly.Xml.domToText(xmlEl) : '';
      pyFiles.push({ name: name, content: '', blockXml: xmlText });
    });
    var mainIdx = pyFiles.findIndex(function(f) { return f.name === 'main.py'; });
    if (mainIdx > 0) {
      var mainFile = pyFiles.splice(mainIdx, 1)[0];
      pyFiles.unshift(mainFile);
    }
    var subToolboxId = currentMode === 'game' ? 'toolbox-game-module'
                     : currentMode === 'python' ? 'toolbox-module' : null;
    var mainToolboxId = currentMode === 'game' ? 'toolbox-game'
                      : currentMode === 'python' ? 'toolbox-python' : null;
    function _loadFileToWorkspace(idx, toolboxId) {
      activeFileIdx = idx;
      if (toolboxId) {
        var tb = document.getElementById(toolboxId);
        if (tb) workspace.updateToolbox(tb);
      }
      workspace.clear();
      if (pyFiles[idx].blockXml) {
        try {
          var dom = new DOMParser().parseFromString(pyFiles[idx].blockXml, 'text/xml');
          Blockly.Xml.domToWorkspace(dom.documentElement, workspace);
        } catch (e) { console.warn('project file load failed:', pyFiles[idx].name, e); }
      }
      if (typeof generateCode === 'function') generateCode();
    }
    for (var i = 1; i < pyFiles.length; i++) {
      _loadFileToWorkspace(i, subToolboxId);
    }
    _loadFileToWorkspace(0, mainToolboxId);
    if (typeof renderFileTabs === 'function') renderFileTabs();
  }

  const _urlSrc = _urlParams.get('src');
  if (_urlSrc) {
    window.__PCO_LAST_XML_SRC = _urlSrc;
    fetch(_urlSrc)
      .then(function(r) { return r.ok ? r.text() : Promise.reject('HTTP ' + r.status); })
      .then(function(xmlText) {
        var dom = Blockly.utils.xml.textToDom(xmlText);
        var rootName = (dom.tagName || dom.localName || '').toLowerCase();
        if (rootName === 'project') {
          _loadProjectXml(dom);
        } else {
          Blockly.Xml.domToWorkspace(dom, workspace);
        }
      })
      .catch(function(err) { console.warn('PycoBlocks: ?src= load failed:', err); });
  }
});
