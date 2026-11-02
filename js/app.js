document.addEventListener('DOMContentLoaded', function() {

  // ===== 右クリックメニュー 日本語化 =====
  Object.assign(Blockly.Msg, {
    DUPLICATE_BLOCK:     'ブロックを複製',
    ADD_COMMENT:         'コメントを追加',
    REMOVE_COMMENT:      'コメントを削除',
    COLLAPSE_BLOCK:      'ブロックを小さくたたむ',
    EXPAND_BLOCK:        'たたんだブロックを広げる',
    DISABLE_BLOCK:       '使わないことにする（灰色になる）',
    ENABLE_BLOCK:        '使うことにもどす',
    DELETE_BLOCK:        'ブロックを削除',
    DELETE_X_BLOCKS:     '%1 個のブロックを削除',
    DELETE_ALL_BLOCKS:   'すべてのブロックを削除',
    HELP:                'ヘルプ',
    UNDO:                '元に戻す',
    REDO:                'やり直す',
    CLEAN_UP:            'ブロックを左にそろえて並べる',
    COLLAPSE_ALL:        'ぜんぶ小さくたたむ',
    EXPAND_ALL:          'ぜんぶ広げる',
    INLINE_INPUTS:       '入れる所を横に並べる',
    EXTERNAL_INPUTS:     '入れる所をたてに並べる',
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
    zoom: { controls: true, wheel: true, pinch: true, startScale: 1.0, maxScale: 3, minScale: 0.3 },
    move: { drag: true, wheel: false, scrollbars: true }
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
    indentUnit: 4,            // 自動字下げ・Tab を 4 スペースに統一（タブ/スペース混在のIndentationError防止）
    indentWithTabs: false,    // タブ文字を使わず常にスペース
    smartIndent: true,        // `:` の次の行などを自動で1段下げる
    extraKeys: {
      // Tab = 4スペース（選択中はまとめて字下げ）。読み取り専用のときと Esc の直後は下の keydown で素通しする
      Tab: function(cm) {
        if (cm.somethingSelected()) cm.indentSelection('add');
        else cm.execCommand('insertSoftTab');
      },
      'Shift-Tab': function(cm) { cm.indentSelection('subtract'); },
      // 行頭のスペースは Backspace で1段（4つ）まとめて消す＝インデントを崩しにくく
      Backspace: function(cm) {
        const cur = cm.getCursor();
        const before = cm.getLine(cur.line).slice(0, cur.ch);
        if (/^ +$/.test(before)) {
          const unit = cm.getOption('indentUnit') || 4;
          const del = ((before.length - 1) % unit) + 1;
          cm.replaceRange('', { line: cur.line, ch: cur.ch - del }, { line: cur.line, ch: cur.ch });
        } else {
          cm.execCommand('delCharBefore');
        }
      },
      Enter: 'newlineAndIndent',
    },
  });

  // キーボードだけで操作する人がエディタから出られなくなる（Tab の罠）のを防ぐ。
  //   読み取り専用（ブロックから作ったコードを見ているだけ）のときと、Esc を押した直後は、
  //   Tab を CodeMirror に渡さずブラウザに返して次のボタンへ移れるようにする。
  //   （keymap で CodeMirror.Pass を返しても既定の keymap が Tab を拾うので、codemirrorIgnore で丸ごと外す）
  editor.on('keydown', function(cm, e) {
    if (e.key === 'Escape') { cm.state.pycoEscTab = true; return; }
    if (e.key === 'Tab') {
      if (cm.getOption('readOnly') || cm.state.pycoEscTab) e.codemirrorIgnore = true;
      return;
    }
    if (e.key !== 'Shift') cm.state.pycoEscTab = false;   // また打ち始めたら Tab は字下げに戻す
  });
  editor.on('focus', function(cm) { cm.state.pycoEscTab = false; });

  // 上の出方を、読み上げと画面の両方で知らせる。知らないと Tab の罠と区別がつかない。
  //   読み上げ：入力欄（textarea）に名前と出方を付ける。画面：コード編集中だけ、見出しの右に小さく出す
  (function() {
    const ta = editor.getInputField();
    if (ta) ta.setAttribute('aria-label', 'Python のコード。エディタの外へ出るには Esc を押してから Tab');
    const title = document.getElementById('code-header-title');
    if (!title || !title.parentNode) return;
    const hint = document.createElement('span');
    hint.id = 'code-kbd-hint';
    hint.textContent = 'Esc → Tab で外へ';
    hint.setAttribute('aria-hidden', 'true');   // 読み上げは textarea の名前で伝える（二重に読ませない）
    hint.style.cssText = 'display:none;margin-left:8px;font-size:12px;color:var(--text-dim);white-space:nowrap;';
    title.parentNode.insertBefore(hint, title.nextSibling);
  })();

  // 全角スペース（U+3000）を見えるようにするオーバーレイ（コード中の見えない全角スペース対策）
  editor.addOverlay({
    name: 'zenkaku-space',
    token: function(stream) {
      if (stream.next() === '　') return 'zenkaku-space';
      while (stream.peek() != null && stream.peek() !== '　') stream.next();
      return null;
    }
  });
  let codingMode = false;
  let syntaxCollapsed = false;
  let _errorLineNo = -1;   // コーディングモードでハイライト中のエラー行（0始まり・無しは-1）
  let currentMode = 'micropython'; // 初期値は後で applyMode('python') で上書き
  // MicroPython モードでつなぐボード（'pico' / 'microbit'）。
  // micro:bit も中身は MicroPython モードなので currentMode は 'micropython' のまま、
  // ツールボックス・生成コードの先頭・通信の細部だけをこれで切り替える。
  // 保存や共有 URL では 'microbit' を 1 つのモードとして扱う（modeKey()）。
  let currentBoard = 'pico';
  function modeKey() {
    return (currentMode === 'micropython' && currentBoard === 'microbit') ? 'microbit' : currentMode;
  }
  // serial.js / firmware.js からボードを知るための窓口
  window.PycoBoard = { get: function() { return currentBoard; } };

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
      case 'pico_w_led_on':    return `Pico W 内蔵LED → HIGH（点灯）`;
      case 'pico_w_led_off':   return `Pico W 内蔵LED → LOW（消灯）`;
      case 'pico_w_wifi_connect': return `WiFi 接続（SSID: ${block.getFieldValue('SSID')}）`;
      case 'pico_w_wifi_ip':   return `IP アドレスを取得`;
      case 'pico_w_http_get':  return `HTTP GET → 変数`;
      case 'pico_w_http_post': return `HTTP POST → 変数`;
      case 'pico_wait':        return `秒数待機`;
      case 'pico_repeat':      return `繰り返す`;
      case 'pico_forever':     return `ずっと繰り返す（無限ループ）`;
      case 'pvb_forward':      return `前進する`;
      case 'pvb_backward':     return `後退する`;
      case 'pvb_turn_right':   return `右旋回`;
      case 'pvb_turn_left':    return `左旋回`;
      case 'pvb_stop':         return `止まる（モーター停止）`;
      case 'pvb_drive':        return `左右の速さを決めて走る`;
      case 'pvb_ticks_ms':     return `起動してからの時間（ms）`;
      case 'pvb_wifi_ap':      return `Wi-Fi の親機になる（名前: ${block.getFieldValue('SSID')}）`;
      case 'pvb_web_start':    return `操縦ページを出す`;
      case 'pvb_web_button':   return `操縦ページで押されたボタン`;
      case 'pvb_web_show':     return `操縦ページに ${block.getFieldValue('NAME')} を出す`;
      case 'pvb_web_number':   return `操縦ページから届いた数 ${block.getFieldValue('KEY')}`;
      case 'pvb_udp_send':     return `合図を送る`;
      case 'pvb_udp_recv':     return `届いた合図`;
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
      case 'pvb_oled_text':      return `OLEDの${block.getFieldValue('ROW')}行目に表示する`;
      case 'pvb_oled_label_val': return `OLEDの${block.getFieldValue('ROW')}行目に「${block.getFieldValue('LABEL')}」＋値を表示する`;
      case 'pvb_oled_clear':     return `OLED画面を消す`;
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
      case 'game_tilemap_from_text': return '文字列マップから 2 次元配列を作る';
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
      default: {
        const mbLabel = window.PycoMicrobit ? PycoMicrobit.label(block) : null;
        return mbLabel || block.type;
      }
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
      // ===== やさしいAI（pyco_ai）値ブロック =====
      case 'ai_what':
        return 'pyco_ai.what()';
      case 'ai_confidence':
        return 'pyco_ai.confidence()';
      case 'val_var':
        return getVarName(block, 'VAR') || 'x';
      case 'val_number':
      // Blockly 標準の math_number も 受ける。PycoBlocks の パレットからは 出ない が、
      // 手書き XML や 昔の 共有リンクには 混ざっている。ここが 無いと 既定の '0' に
      // 落ち、**待ち時間が 全部 0 秒の コードが 黙って 出る**（2026-09-07 に
      // samples/micropython の 41本で 実際に 起きていた）。
      case 'math_number':
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
        // not は and / or より強く結びつく。かっこがないと not (A and B) が (not A) and B になる
        const aw = (hasTopLevelKeyword(a, ' and ') || hasTopLevelKeyword(a, ' or ')) ? `(${a})` : a;
        return `not ${aw}`;
      }
      case 'pico_digital_read_val': {
        const pin = block.getFieldValue('PIN');
        const pull = block.getFieldValue('PULL') || 'PULLUP_EXT';
        const pinArgs = pull === 'PULLUP_INT' ? `${pin}, Pin.IN, Pin.PULL_UP` : `${pin}, Pin.IN`;
        return `Pin(${pinArgs}).value()`;
      }
      case 'pico_analog_read_val': {
        const pin = block.getFieldValue('PIN');
        return `ADC(${pin}).read_u16()`;
      }
      case 'pico_w_wifi_ip':
        return `_wlan.ifconfig()[0]`;
      case 'pico_ultrasonic_cm_val': {
        const trig = block.getFieldValue('TRIG');
        const echo = block.getFieldValue('ECHO');
        return `_us_dist(${trig}, ${echo})`;
      }
      case 'pvb_switch_val': {
        const sw = block.getFieldValue('SW');
        // PoliviaBot UME の SW1(GP13)/SW2(GP14) は プルダウン・押すと High。
        // 以前は PULL_UP で == 0 を 押下と していたので、押していない ときに True に なっていた
        return `(Pin(${sw}, Pin.IN, Pin.PULL_DOWN).value() == 1)`;
      }
      case 'pvb_line_val': {
        const sensor = block.getFieldValue('SENSOR');
        return `ADC(${sensor}).read_u16()`;
      }
      case 'pvb_sonar_val':
        return '_pvb_sonar_cm()';
      case 'pvb_ticks_ms':
        return 'utime.ticks_ms()';
      case 'pvb_web_button':
        return '_pvb_web_button()';
      case 'pvb_web_number':
        return `_pvb_web_number("${block.getFieldValue('KEY')}")`;
      case 'pvb_udp_recv':
        return '_pvb_udp_recv()';
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
        // 地の文の { } は そのまま だと 置きかえ欄と 見なされ SyntaxError に なる。
        // JSON を 書く ときに 必ず 踏む ので 二重に して 逃がす（2026-09-08）。
        function escSingleQuotedChunk(s) {
          return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\{/g, '{{').replace(/\}/g, '}}');
        }
        return `f'${escSingleQuotedChunk(pre)}{${val}}${escSingleQuotedChunk(post)}'`;
      }
      case 'py_fstring_fmt': {
        const fmtPre = block.getFieldValue('PRE') || '';
        const fmtFmt = block.getFieldValue('FMT') || '';
        const fmtVal = valueToCode(block, 'VAR', '""');
        function escSQ(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\{/g, '{{').replace(/\}/g, '}}'); }
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
        // 地の文の { } は 二重に して 逃がす（py_fstring と 同じ）
        const escF2 = (x) => String(x).replace(/\{/g, '{{').replace(/\}/g, '}}');
        return `f"${escF2(f2Pre)}{${f2V1}}${escF2(f2Mid)}{${f2V2}}${escF2(f2Post)}"`;
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
        function escSQf3(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\{/g, '{{').replace(/\}/g, '}}'); }
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
        function escSQf2(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\{/g, '{{').replace(/\}/g, '}}'); }
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
      case 'game_tilemap_from_text': {
        const raw = block.getFieldValue('TEXT') || '';
        const vDot   = Number(block.getFieldValue('V_DOT')   || 0);
        const vEq    = Number(block.getFieldValue('V_EQ')    || 1);
        const vHash  = Number(block.getFieldValue('V_HASH')  || 2);
        const vTilde = Number(block.getFieldValue('V_TILDE') || 3);
        const rows = raw.split('\n').filter(r => r.length > 0);
        const charMap = { '.': vDot, '=': vEq, '#': vHash, '~': vTilde };
        const pyRows = rows.map(r => {
          const cells = Array.from(r).map(c => String(charMap[c] !== undefined ? charMap[c] : 0));
          return '[' + cells.join(', ') + ']';
        });
        return '[' + pyRows.join(', ') + ']';
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
        // micro:bit のブロックは js/blocks/microbit.js が受け持つ
        if (window.PycoMicrobit && PycoMicrobit.hasValue(block.type)) return PycoMicrobit.value(block, valueToCode);
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

      // ===== Pico W 専用 =====
      case 'pico_w_led_on': {
        code = appendLocal(code, indent + `Pin('LED', Pin.OUT).value(1)\n`);
        break;
      }
      case 'pico_w_led_off': {
        code = appendLocal(code, indent + `Pin('LED', Pin.OUT).value(0)\n`);
        break;
      }
      case 'pico_w_wifi_connect': {
        const ssid = block.getFieldValue('SSID');
        const pass = block.getFieldValue('PASS');
        code = appendLocal(code, indent + `import network, utime\n`);
        code = appendLocal(code, indent + `_wlan = network.WLAN(network.STA_IF)\n`);
        code = appendLocal(code, indent + `_wlan.active(True)\n`);
        code = appendLocal(code, indent + `_wlan.connect(${JSON.stringify(ssid)}, ${JSON.stringify(pass)})\n`);
        code = appendLocal(code, indent + `while not _wlan.isconnected():\n`);
        code = appendLocal(code, indent + `    utime.sleep(0.5)\n`);
        break;
      }
      case 'pico_w_http_get': {
        const url = block.getFieldValue('URL');
        const v = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `_r = urequests.get(${JSON.stringify(url)})\n`);
        code = appendLocal(code, indent + `${v} = _r.text\n`);
        code = appendLocal(code, indent + `_r.close()\n`);
        break;
      }
      case 'pico_w_http_post': {
        const url = block.getFieldValue('URL');
        const v = getVarName(block, 'VAR');
        const data = valueToCode(block, 'DATA', '""');
        code = appendLocal(code, indent + `_r = urequests.post(${JSON.stringify(url)}, data=${data})\n`);
        code = appendLocal(code, indent + `${v} = _r.text\n`);
        code = appendLocal(code, indent + `_r.close()\n`);
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
      // 駆動は bringup_UME_PicoW/05_motor_test.py・pb/pb_lib.py と同じ（2026-09-29）。
      // 走る＝片側 High・もう片側で PWM（スローディケイ。低い速さでも回る）
      // 止める＝両方 High（ブレーキ。その場で止まる）。前は片側 0 の駆動で、
      // 低い速さで回らず、止めても惰性ですべって動画の実測と合わなかった。
      // 実際のピン操作は先頭の _pvb_drive(左, 右)（-100〜100）にまとめてある。
      case 'pvb_forward': {
        registerExprBlocksAtLineFromInput(block, 'SPEED', _emitCtx.line);
        const spd = valueToCode(block, 'SPEED', '50');
        code = appendLocal(code, indent + `_pvb_drive(${spd}, ${spd})\n`);
        break;
      }
      case 'pvb_backward': {
        registerExprBlocksAtLineFromInput(block, 'SPEED', _emitCtx.line);
        const spd = valueToCode(block, 'SPEED', '50');
        code = appendLocal(code, indent + `_pvb_drive(-(${spd}), -(${spd}))\n`);
        break;
      }
      case 'pvb_turn_right': {
        // 左=前進・右=後退（その場で右回り）
        registerExprBlocksAtLineFromInput(block, 'SPEED', _emitCtx.line);
        const spd = valueToCode(block, 'SPEED', '50');
        code = appendLocal(code, indent + `_pvb_drive(${spd}, -(${spd}))\n`);
        break;
      }
      case 'pvb_turn_left': {
        // 左=後退・右=前進（その場で左回り）
        registerExprBlocksAtLineFromInput(block, 'SPEED', _emitCtx.line);
        const spd = valueToCode(block, 'SPEED', '50');
        code = appendLocal(code, indent + `_pvb_drive(-(${spd}), ${spd})\n`);
        break;
      }
      case 'pvb_stop': {
        code = appendLocal(code, indent + `_pvb_drive(0, 0)\n`);
        break;
      }
      case 'pvb_drive': {
        const lnDrv = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'LEFT', lnDrv);
        registerExprBlocksAtLineFromInput(block, 'RIGHT', lnDrv);
        const dl = valueToCode(block, 'LEFT', '50');
        const dr = valueToCode(block, 'RIGHT', '50');
        code = appendLocal(code, indent + `_pvb_drive(${dl}, ${dr})\n`);
        break;
      }

      // ===== PoliviaBot Wi-Fi（Pico W 限定）=====
      // 親機（AP）にして、スマホをロボットの Wi-Fi に直接つなぐ。学校の Wi-Fi を通さない。
      case 'pvb_wifi_ap': {
        const apSsid = block.getFieldValue('SSID');
        const apPass = block.getFieldValue('PASS');
        code = appendLocal(code, indent + `_ap = network.WLAN(network.AP_IF)\n`);
        code = appendLocal(code, indent + `_ap.config(essid=${JSON.stringify(apSsid)}, password=${JSON.stringify(apPass)})\n`);
        code = appendLocal(code, indent + `_ap.active(True)\n`);
        code = appendLocal(code, indent + `while not _ap.active():\n`);
        code = appendLocal(code, indent + `    utime.sleep(0.1)\n`);
        code = appendLocal(code, indent + `print("Wi-Fi", ${JSON.stringify(apSsid)}, "http://" + _ap.ifconfig()[0])\n`);
        break;
      }
      case 'pvb_web_start': {
        code = appendLocal(code, indent + `_pvb_web_start()\n`);
        break;
      }
      case 'pvb_web_show': {
        const lnShow = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'VALUE', lnShow);
        const showName = block.getFieldValue('NAME');
        const showVal = valueToCode(block, 'VALUE', '0');
        code = appendLocal(code, indent + `_pvb_web_show(${JSON.stringify(showName)}, ${showVal})\n`);
        break;
      }
      case 'pvb_udp_send': {
        const lnUdp = _emitCtx.line;
        registerExprBlocksAtLineFromInput(block, 'MSG', lnUdp);
        const udpMsg = valueToCode(block, 'MSG', '""');
        code = appendLocal(code, indent + `_pvb_udp_send(${udpMsg})\n`);
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
        // プルダウン・押すと High（pvb_switch_val と 同じ 判定）
        code = appendLocal(code, indent + `if Pin(${sw}, Pin.IN, Pin.PULL_DOWN).value() == 1:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }

      // ===== センサー =====
      case 'pvb_sonar': {
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `_trig = Pin(7, Pin.OUT); _echo = Pin(6, Pin.IN)\n`);
        code = appendLocal(code, indent + `_trig.value(0); utime.sleep_us(5)\n`);
        code = appendLocal(code, indent + `_trig.value(1); utime.sleep_us(10); _trig.value(0)\n`);
        code = appendLocal(code, indent + `_dur = time_pulse_us(_echo, 1, 30000)\n`);
        code = appendLocal(code, indent + `utime.sleep_ms(60)  # 連続測定で失敗しないよう測定間隔を確保\n`);
        code = appendLocal(code, indent + `${varName} = 999.0 if _dur < 0 else _dur * 0.0343 / 2\n`);
        break;
      }
      case 'pvb_if_obstacle': {
        code = appendLocal(code, indent + `_trig = Pin(7, Pin.OUT); _echo = Pin(6, Pin.IN)\n`);
        code = appendLocal(code, indent + `_trig.value(0); utime.sleep_us(5)\n`);
        code = appendLocal(code, indent + `_trig.value(1); utime.sleep_us(10); _trig.value(0)\n`);
        code = appendLocal(code, indent + `_dur = time_pulse_us(_echo, 1, 30000)\n`);
        code = appendLocal(code, indent + `utime.sleep_ms(60)  # 連続測定で失敗しないよう測定間隔を確保\n`);
        code = appendLocal(code, indent + `_dist_cm = 999.0 if _dur < 0 else _dur * 0.0343 / 2\n`);
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
        const thr = parseInt(block.getFieldValue('THR'), 10);
        const thrVal = Number.isFinite(thr) ? thr : 10000;  // 9/30 実機：白2500・黒17000〜25000
        code = appendLocal(code, indent + `if ADC(${sensor}).read_u16() ${op} ${thrVal}:\n`);
        const inner = statementToCode(block, 'DO', indent + '    ');
        code = appendChildBody(code, inner, indent + '    pass\n');
        break;
      }
      case 'pvb_print': {
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `print(${varName})\n`);
        break;
      }
      // ===== PoliviaBot OLED（SSD1306・自動初期化／書くたび自動更新）=====
      case 'pvb_oled_text': {
        const oRow = parseInt(block.getFieldValue('ROW'), 10) || 1;
        const oTop = (oRow - 1) * 10;
        const oTxt = valueToCode(block, 'TEXT', '""');
        code = appendLocal(code, indent + `_oled.fill_rect(0, ${oTop}, 128, 10, 0)\n`);
        code = appendLocal(code, indent + `_oled.text(str(${oTxt}), 0, ${oTop + 1})\n`);
        code = appendLocal(code, indent + `_oled.show()\n`);
        break;
      }
      case 'pvb_oled_label_val': {
        const olRow = parseInt(block.getFieldValue('ROW'), 10) || 1;
        const olTop = (olRow - 1) * 10;
        const olLabel = JSON.stringify(block.getFieldValue('LABEL') || '');
        const olVal = valueToCode(block, 'VALUE', '""');
        code = appendLocal(code, indent + `_oled.fill_rect(0, ${olTop}, 128, 10, 0)\n`);
        code = appendLocal(code, indent + `_oled.text(${olLabel} + str(${olVal}), 0, ${olTop + 1})\n`);
        code = appendLocal(code, indent + `_oled.show()\n`);
        break;
      }
      case 'pvb_oled_clear': {
        code = appendLocal(code, indent + `_oled.fill(0)\n`);
        code = appendLocal(code, indent + `_oled.show()\n`);
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
        const pull = block.getFieldValue('PULL') || 'PULLUP_EXT';
        const pinArgs = pull === 'PULLUP_INT' ? `${pin}, Pin.IN, Pin.PULL_UP` : `${pin}, Pin.IN`;
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `${varName} = Pin(${pinArgs}).value()\n`);
        break;
      }
      case 'pico_analog_read': {
        const pin = block.getFieldValue('PIN');
        const varName = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `${varName} = ADC(${pin}).read_u16()\n`);
        break;
      }

      // ===== PWM出力 =====
      case 'pico_pwm_write': {
        const pin = block.getFieldValue('PIN');
        const duty = parseInt(block.getFieldValue('DUTY'));
        const dutyU16 = Math.round(duty * 65535 / 100);
        code = appendLocal(code, indent + `PWM(Pin(${pin})).duty_u16(${dutyU16})\n`);
        break;
      }
      case 'pico_pwm_write_val': {
        const pin = block.getFieldValue('PIN');
        const dutyExpr = valueToCode(block, 'DUTY', '0');
        code = appendLocal(code, indent + `PWM(Pin(${pin})).duty_u16(int(max(0, min(100, ${dutyExpr})) * 65535 / 100))\n`);
        break;
      }

      // ===== ブザー =====
      case 'pico_buzzer_tone': {
        const bzPin = block.getFieldValue('PIN');
        const bzFreq = block.getFieldValue('FREQ');
        const bzDur  = block.getFieldValue('DUR');
        code = appendLocal(code, indent + `_bz = PWM(Pin(${bzPin}))\n`);
        code = appendLocal(code, indent + `_bz.freq(${bzFreq})\n`);
        code = appendLocal(code, indent + `_bz.duty_u16(32768)\n`);
        code = appendLocal(code, indent + `utime.sleep(${bzDur})\n`);
        code = appendLocal(code, indent + `_bz.deinit()\n`);
        break;
      }
      case 'pico_buzzer_stop': {
        const bzStopPin = block.getFieldValue('PIN');
        code = appendLocal(code, indent + `PWM(Pin(${bzStopPin})).deinit()\n`);
        break;
      }

      // ===== 7セグメント =====
      case 'pico_7seg_show': {
        const segNum = block.getFieldValue('NUM');
        const pa = block.getFieldValue('PIN_A');
        const pb = block.getFieldValue('PIN_B');
        const pc = block.getFieldValue('PIN_C');
        const pd = block.getFieldValue('PIN_D');
        const pe = block.getFieldValue('PIN_E');
        const pf = block.getFieldValue('PIN_F');
        const pg = block.getFieldValue('PIN_G');
        code = appendLocal(code, indent + `_SEG_PAT = [[1,1,1,1,1,1,0],[0,1,1,0,0,0,0],[1,1,0,1,1,0,1],[1,1,1,1,0,0,1],[0,1,1,0,0,1,1],[1,0,1,1,0,1,1],[1,0,1,1,1,1,1],[1,1,1,0,0,0,0],[1,1,1,1,1,1,1],[1,1,1,1,0,1,1]]\n`);
        code = appendLocal(code, indent + `_seg_pins = [Pin(p, Pin.OUT) for p in [${pa},${pb},${pc},${pd},${pe},${pf},${pg}]]\n`);
        code = appendLocal(code, indent + `for _i, _v in enumerate(_SEG_PAT[${segNum}]): _seg_pins[_i].value(_v)\n`);
        break;
      }

      // ===== LCD1602 (I2C) =====
      case 'pico_lcd_init': {
        const lcdSda = block.getFieldValue('SDA');
        const lcdScl = block.getFieldValue('SCL');
        const lcdVar = getVarName(block, 'VAR');
        // アドレスは 基板により 0x27 / 0x3F。古い XML には ADDR が 無いので 0x27 に 倒す
        const lcdAddr = block.getFieldValue('ADDR') || '0x27';
        code = appendLocal(code, indent + `_i2c = I2C(0, sda=Pin(${lcdSda}), scl=Pin(${lcdScl}), freq=400000)\n`);
        code = appendLocal(code, indent + `${lcdVar} = LCD1602(_i2c, ${lcdAddr})\n`);
        break;
      }
      case 'pico_lcd_print': {
        const lcdPVar = getVarName(block, 'VAR');
        const lcdRow  = block.getFieldValue('ROW');
        const lcdText = valueToCode(block, 'TEXT', '""');
        code = appendLocal(code, indent + `${lcdPVar}.move_to(0, ${lcdRow})\n`);
        // MicroPython の str に ljust は 無い（AttributeError で 止まる）。
        // 前の 表示が 残らないよう、16文字に 足りない ぶんは 空白を 足してから 切る
        code = appendLocal(code, indent + `${lcdPVar}.putstr((str(${lcdText}) + " " * 16)[:16])\n`);
        break;
      }
      case 'pico_lcd_clear': {
        const lcdCVar = getVarName(block, 'VAR');
        code = appendLocal(code, indent + `${lcdCVar}.clear()\n`);
        break;
      }

      // ===== サーボモーター =====
      case 'pico_servo_angle': {
        const svPin   = block.getFieldValue('PIN');
        const svAngle = block.getFieldValue('ANGLE');
        code = appendLocal(code, indent + `_sv = PWM(Pin(${svPin}), freq=50)\n`);
        code = appendLocal(code, indent + `_sv.duty_u16(int(1638 + ${svAngle} * 8192 // 180))\n`);
        break;
      }
      case 'pico_servo_angle_val': {
        const svvPin   = block.getFieldValue('PIN');
        const svvAngle = valueToCode(block, 'ANGLE', '90');
        code = appendLocal(code, indent + `_sv = PWM(Pin(${svvPin}), freq=50)\n`);
        code = appendLocal(code, indent + `_sv.duty_u16(int(1638 + max(0, min(180, ${svvAngle})) * 8192 // 180))\n`);
        break;
      }

      // ===== DCモーター (L298N) =====
      case 'pico_dcmotor_run': {
        const dcIn1  = block.getFieldValue('IN1');
        const dcIn2  = block.getFieldValue('IN2');
        const dcEn   = block.getFieldValue('EN');
        const dcSpd  = parseInt(block.getFieldValue('SPEED'));
        const dcDir  = block.getFieldValue('DIR');
        const dcDuty = Math.round(dcSpd * 65535 / 100);
        if (dcDir === 'fwd') {
          code = appendLocal(code, indent + `Pin(${dcIn1}, Pin.OUT).value(1); Pin(${dcIn2}, Pin.OUT).value(0)\n`);
        } else {
          code = appendLocal(code, indent + `Pin(${dcIn1}, Pin.OUT).value(0); Pin(${dcIn2}, Pin.OUT).value(1)\n`);
        }
        code = appendLocal(code, indent + `PWM(Pin(${dcEn})).duty_u16(${dcDuty})\n`);
        break;
      }
      case 'pico_dcmotor_run_val': {
        const dcvIn1 = block.getFieldValue('IN1');
        const dcvIn2 = block.getFieldValue('IN2');
        const dcvEn  = block.getFieldValue('EN');
        const dcvDir = block.getFieldValue('DIR');
        const dcvSpd = valueToCode(block, 'SPEED', '50');
        if (dcvDir === 'fwd') {
          code = appendLocal(code, indent + `Pin(${dcvIn1}, Pin.OUT).value(1); Pin(${dcvIn2}, Pin.OUT).value(0)\n`);
        } else {
          code = appendLocal(code, indent + `Pin(${dcvIn1}, Pin.OUT).value(0); Pin(${dcvIn2}, Pin.OUT).value(1)\n`);
        }
        code = appendLocal(code, indent + `PWM(Pin(${dcvEn})).duty_u16(int(max(0, min(100, ${dcvSpd})) * 65535 // 100))\n`);
        break;
      }
      case 'pico_dcmotor_stop': {
        const dcStIn1 = block.getFieldValue('IN1');
        const dcStIn2 = block.getFieldValue('IN2');
        code = appendLocal(code, indent + `Pin(${dcStIn1}, Pin.OUT).value(0); Pin(${dcStIn2}, Pin.OUT).value(0)\n`);
        break;
      }

      // ===== ステッピングモーター (28BYJ-48 + ULN2003) =====
      case 'pico_stepper_step': {
        const stIn1   = block.getFieldValue('IN1');
        const stIn2   = block.getFieldValue('IN2');
        const stIn3   = block.getFieldValue('IN3');
        const stIn4   = block.getFieldValue('IN4');
        const stSteps = block.getFieldValue('STEPS');
        const stDelay = block.getFieldValue('DELAY');
        code = appendLocal(code, indent + `_st_pins = [Pin(p, Pin.OUT) for p in [${stIn1},${stIn2},${stIn3},${stIn4}]]\n`);
        code = appendLocal(code, indent + `_st_seq = [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,1,1],[0,0,0,1],[1,0,0,1]]\n`);
        code = appendLocal(code, indent + `_st_n = abs(${stSteps}); _st_dir = 1 if (${stSteps}) >= 0 else -1\n`);
        code = appendLocal(code, indent + `for _s in range(_st_n):\n`);
        code = appendLocal(code, indent + `    _st_i = (_s * _st_dir) % 8\n`);
        code = appendLocal(code, indent + `    for _j in range(4): _st_pins[_j].value(_st_seq[_st_i][_j])\n`);
        code = appendLocal(code, indent + `    utime.sleep_ms(${stDelay})\n`);
        break;
      }
      case 'pico_stepper_angle': {
        const staIn1   = block.getFieldValue('IN1');
        const staIn2   = block.getFieldValue('IN2');
        const staIn3   = block.getFieldValue('IN3');
        const staIn4   = block.getFieldValue('IN4');
        const staAngle = block.getFieldValue('ANGLE');
        const staDelay = block.getFieldValue('DELAY');
        code = appendLocal(code, indent + `_st_pins = [Pin(p, Pin.OUT) for p in [${staIn1},${staIn2},${staIn3},${staIn4}]]\n`);
        code = appendLocal(code, indent + `_st_seq = [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,1,1],[0,0,0,1],[1,0,0,1]]\n`);
        code = appendLocal(code, indent + `_st_n = int(abs(${staAngle}) * 4096 / 360); _st_dir = 1 if (${staAngle}) >= 0 else -1\n`);
        code = appendLocal(code, indent + `for _s in range(_st_n):\n`);
        code = appendLocal(code, indent + `    _st_i = (_s * _st_dir) % 8\n`);
        code = appendLocal(code, indent + `    for _j in range(4): _st_pins[_j].value(_st_seq[_st_i][_j])\n`);
        code = appendLocal(code, indent + `    utime.sleep_ms(${staDelay})\n`);
        break;
      }

      // ===== 超音波センサー (HC-SR04) =====
      case 'pico_ultrasonic_cm': {
        const usTrig = block.getFieldValue('TRIG');
        const usEcho = block.getFieldValue('ECHO');
        const usVar  = getVarName(block, 'VAR');
        // 測る 中身（_us_dist）は ヘッダで 1回だけ 定義する。
        // ここに 書くと ループの 中で 毎回 定義し直す 形に なり、
        // 値ブロックだけ 使った ときは そもそも 定義されない
        code = appendLocal(code, indent + `${usVar} = _us_dist(${usTrig}, ${usEcho})\n`);
        break;
      }

      // ===== DHT11 温湿度センサー =====
      case 'pico_dht_read': {
        const dhtPin  = block.getFieldValue('PIN');
        const dhtTVar = getVarName(block, 'TVAR');
        const dhtHVar = getVarName(block, 'HVAR');
        code = appendLocal(code, indent + `_dht = DHT11(Pin(${dhtPin}))\n`);
        code = appendLocal(code, indent + `_dht.measure()\n`);
        code = appendLocal(code, indent + `${dhtTVar} = _dht.temperature()\n`);
        code = appendLocal(code, indent + `${dhtHVar} = _dht.humidity()\n`);
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
      case 'pico_ultrasonic_cm_val':
      case 'pvb_switch_val':
      case 'pvb_line_val':
      case 'pvb_sonar_val':
      case 'pvb_ticks_ms':
      case 'pvb_web_button':
      case 'pvb_web_number':
      case 'pvb_udp_recv':
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

      // ===== 小中向け: やさしいAI（pyco_ai）=====
      case 'ai_import': {
        code = appendLocal(code, indent + 'import pyco_ai\n');
        break;
      }
      case 'ai_use_camera': {
        code = appendLocal(code, indent + 'pyco_ai.use_camera()\n');
        break;
      }
      case 'ai_use_image': {
        const aiSrc = block.getFieldValue('SRC') || 'sample';
        code = appendLocal(code, indent + `pyco_ai.use_image("${aiSrc}")\n`);
        break;
      }
      case 'ai_teach': {
        const aiLabel = block.getFieldValue('LABEL') || '';
        code = appendLocal(code, indent + `pyco_ai.teach(${JSON.stringify(aiLabel)})\n`);
        break;
      }
      case 'ai_learn': {
        code = appendLocal(code, indent + 'pyco_ai.learn()\n');
        break;
      }
      case 'ai_what': {
        code = appendLocal(code, indent + 'pyco_ai.what()\n');
        break;
      }
      case 'ai_confidence': {
        code = appendLocal(code, indent + 'pyco_ai.confidence()\n');
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
        // micro:bit の「…とき」「ずっと」「最初だけ」。while True: の組み立ては generateCode が行う
        if (window.PycoMicrobit && PycoMicrobit.isHat(block.type)) {
          const h = PycoMicrobit.hat(block, valueToCode, block._mbIdx);
          h.head.forEach(function(l) { code = appendLocal(code, indent + l + '\n'); });
          const inner = statementToCode(block, 'DO', indent + (h.nest ? '    ' : ''));
          code = appendChildBody(code, inner, h.nest ? indent + '    pass\n' : '');
          break;
        }
        if (window.PycoMicrobit && PycoMicrobit.hasStmt(block.type)) {
          block.inputList.forEach(function(inp) {
            if (isBlocklyValueInput(inp)) registerExprBlocksAtLineFromInput(block, inp.name, _emitCtx.line);
          });
          code = appendLocal(code, indent + PycoMicrobit.stmt(block, valueToCode) + '\n');
          break;
        }
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

  // micro:bit：MakeCode と同じく「最初だけ」と「ずっと」「…とき」を並べて書けるようにする。
  // MicroPython には並行して動く仕組みが無いので、ふつうのブロックと「最初だけ」を先に、
  // 「ずっと」「…とき」は 1 つの while True: の中に置いて 1 周ごとに順に調べる。
  // そのため「ずっと」の中で長く一時停止すると、その間ボタンなどの反応も止まる。
  function microbitProgram(topBlocks) {
    let code = '';
    const loops = [];
    topBlocks.forEach(function(b) {
      if (PycoMicrobit.isLoopHat(b.type)) loops.push(b);
      else code += blockToCode(b, '');
    });
    if (!loops.length) return code;
    const init = [];
    loops.forEach(function(b, i) {
      b._mbIdx = i;
      init.push.apply(init, PycoMicrobit.hat(b, valueToCode, i).init);
    });
    if (init.length) code = appendLocal(code, init.join('\n') + '\n');
    if (showComments) code = appendLocal(code, '# 「ずっと」と「…とき」を順に調べ続ける\n');
    code = appendLocal(code, 'while True:\n');
    loops.forEach(function(b) { code += blockToCode(b, '    '); });
    // MakeCode の「ずっと」と同じく 1 周ごとに少し休み、無線やボタンの処理に時間を渡す
    code = appendLocal(code, '    sleep(20)\n');
    return code;
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

    // 「# ON/OFF」で 消すのは **説明の コメントだけ**。import 行は 残す。
    // 以前は import 行にも '# ' を 付けて いたので、コメントを 切った コードを
    // Thonny に 貼ると NameError: Pin で 動かなかった（2026-09-07 に 実測）。
    const cm = '';

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
    } else if (currentBoard === 'microbit') {
      // ─── MicroPython（micro:bit）：machine.Pin ではなく microbit モジュール ───
      header = PycoMicrobit.header(blockTypes, showComments);
    } else {
      // ─── MicroPythonモード：既存ロジック ───
      const motorTypes = ['pvb_forward','pvb_backward','pvb_turn_right','pvb_turn_left','pvb_stop','pvb_drive'];
      const hasMotor   = motorTypes.some(t => blockTypes.has(t));
      const hasSonarVal = blockTypes.has('pvb_sonar_val');
      // 超音波系ブロックがあれば machine.time_pulse_us を取り込む（タイムアウト付き測定に必須）
      const sonarTypes = ['pvb_sonar_val','pvb_sonar','pvb_if_obstacle','pico_ultrasonic_cm','pico_ultrasonic_cm_val'];
      const hasSonar    = sonarTypes.some(t => blockTypes.has(t));
      // HC-SR04 ブロック（文・値のどちらでも）があれば 測る 関数を 先頭に 1回だけ 置く
      const hasUltra = blockTypes.has('pico_ultrasonic_cm') || blockTypes.has('pico_ultrasonic_cm_val');

      // OLED画面ブロックがあれば I2C と framebuf を取り込み、ドライバをコードに同梱する
      const oledTypes = ['pvb_oled_text','pvb_oled_label_val','pvb_oled_clear'];
      const hasOled = oledTypes.some(t => blockTypes.has(t));

      // LCD1602(I2C) ブロックがあれば I2C と lcd1602 ドライバを取り込む。
      // これが無いと生成コードは NameError: I2C で止まる
      const lcdTypes = ['pico_lcd_init','pico_lcd_print','pico_lcd_clear'];
      const hasLcd = lcdTypes.some(t => blockTypes.has(t));
      // DHT11 は MicroPython 標準の dht モジュールから読み込む
      const hasDht = blockTypes.has('pico_dht_read');
      // HTTP GET/POST は urequests。ループの中で import すると 毎周 走るので 先頭に 1回だけ
      const hasHttp = blockTypes.has('pico_w_http_get') || blockTypes.has('pico_w_http_post');
      // PoliviaBot の Wi-Fi（Pico W 限定）。操縦ページは待たずに戻る Web サーバ
      const webTypes = ['pvb_web_start','pvb_web_button','pvb_web_show','pvb_web_number'];
      const hasWeb = webTypes.some(t => blockTypes.has(t));
      const hasUdp = blockTypes.has('pvb_udp_send') || blockTypes.has('pvb_udp_recv');
      const hasWifiAp = blockTypes.has('pvb_wifi_ap');

      const needsRandom = blockTypes.has('py_random_int');
      const machineImports = 'Pin, PWM, ADC' + (hasSonar ? ', time_pulse_us' : '') + ((hasOled || hasLcd) ? ', I2C' : '');
      const baseHeader =
        (showComments ? '# Picoのピン・PWM・ADC制御用\n' : '') + `${cm}from machine import ${machineImports}\n` +
        (showComments ? '# 時間待機用（MicroPython版 time モジュール）\n' : '') + `${cm}import utime\n` +
        (hasOled ? ((showComments ? '# OLED画面の描画用\n' : '') + `${cm}import framebuf\n`) : '') +
        (hasLcd ? ((showComments ? '# LCD1602 のドライバ（lcd1602.py を Pico に保存しておく）\n' : '') + `${cm}from lcd1602 import LCD1602\n`) : '') +
        (hasDht ? ((showComments ? '# DHT11 温湿度センサー用\n' : '') + `${cm}from dht import DHT11\n`) : '') +
        (hasHttp ? ((showComments ? '# HTTP 通信用（Pico W）\n' : '') + `${cm}import urequests\n`) : '') +
        ((hasWifiAp || hasUdp) ? ((showComments ? '# Wi-Fi（Pico W）\n' : '') + `${cm}import network\n`) : '') +
        ((hasWeb || hasUdp) ? ((showComments ? '# 操縦ページ・合図の通信（Pico W）\n' : '') + `${cm}import socket\n`) : '') +
        (hasWeb ? `${cm}import json\n` : '') +
        (needsRandom ? ((showComments ? '# 乱数生成用\n' : '') + `${cm}import random\n`) : '') +
        '\n';
      const ultraHelper =
        'def _us_dist(tr, ec):\n' +
        '    t=Pin(tr,Pin.OUT); e=Pin(ec,Pin.IN)\n' +
        '    t.value(0); utime.sleep_us(5); t.value(1); utime.sleep_us(10); t.value(0)\n' +
        '    _d=time_pulse_us(e,1,30000)\n' +
        '    utime.sleep_ms(60)  # 連続測定で失敗しないよう測定間隔を確保\n' +
        '    return 999.0 if _d<0 else _d*0.0343/2\n\n';
      // UME V3：左右とも IN1（GP0 / GP2）側を High にすると前進（2026-09-12 実機で確認）
      const motorInit =
        '_lp = PWM(Pin(0)); _lp.freq(20000)\n' +
        '_lm = PWM(Pin(1)); _lm.freq(20000)\n' +
        '_rp = PWM(Pin(2)); _rp.freq(20000)\n' +
        '_rm = PWM(Pin(3)); _rm.freq(20000)\n\n' +
        'def _pvb_motor(a, b, p):\n' +
        '    p = max(-100, min(100, p))\n' +
        '    d = int(abs(p) * 65535 / 100)\n' +
        '    if p >= 0:\n' +
        '        a.duty_u16(65535); b.duty_u16(65535 - d)\n' +
        '    else:\n' +
        '        b.duty_u16(65535); a.duty_u16(65535 - d)\n\n' +
        'def _pvb_drive(left, right):\n' +
        '    _pvb_motor(_lp, _lm, left)\n' +
        '    _pvb_motor(_rp, _rm, right)\n\n';
      // Thonny 動作版(07_sonar_test.py)に合わせ、time_pulse_us でタイムアウト付き測定。
      // エコーが返らない時も無限ループせず、遠距離(999cm)扱いで安全に抜ける。
      const sonarHelper =
        'def _pvb_sonar_cm():\n' +
        '    _trig = Pin(7, Pin.OUT); _echo = Pin(6, Pin.IN)\n' +
        '    _trig.value(0); utime.sleep_us(5)\n' +
        '    _trig.value(1); utime.sleep_us(10); _trig.value(0)\n' +
        '    _dur = time_pulse_us(_echo, 1, 30000)\n' +
        '    utime.sleep_ms(60)  # 連続測定で失敗しないよう測定間隔を確保\n' +
        '    if _dur < 0: return 999.0\n' +
        '    return _dur * 0.0343 / 2\n\n';

      // SSD1306 OLED 最小ドライバ（framebuf 継承・128x64）。
      // show() はページ単位に分割転送する（100kHz・基板にプルアップ無しのため
      // 一括転送だと I2C タイムアウトで ETIMEDOUT になる。2026-06-12 実機確認済み）。
      const oledSetup =
        (showComments ? '# OLED(SSD1306) ドライバとI2C初期化（SDA=GP4 / SCL=GP5 / 0x3C）\n' : '') +
        'class SSD1306_I2C(framebuf.FrameBuffer):\n' +
        '    def __init__(self, w, h, i2c, addr=0x3C):\n' +
        '        self.i2c = i2c; self.addr = addr; self.w = w; self.pages = h // 8\n' +
        '        self.buffer = bytearray(self.pages * w)\n' +
        '        super().__init__(self.buffer, w, h, framebuf.MONO_VLSB)\n' +
        '        for c in (0xAE,0x20,0x00,0x40,0xA1,0xA8,h-1,0xC8,0xD3,0x00,0xDA,0x12,\n' +
        '                  0xD5,0x80,0xD9,0xF1,0xDB,0x30,0x81,0xFF,0xA4,0xA6,0x8D,0x14,0xAF):\n' +
        '            self.i2c.writeto(addr, bytes([0x80, c]))\n' +
        '        self.fill(0); self.show()\n' +
        '    def show(self):\n' +
        '        for c in (0x21, 0, self.w - 1, 0x22, 0, self.pages - 1):\n' +
        '            self.i2c.writeto(self.addr, bytes([0x80, c]))\n' +
        '        for p in range(self.pages):\n' +
        '            self.i2c.writeto(self.addr, b"\\x40" + self.buffer[p * self.w:(p + 1) * self.w])\n' +
        '\n' +
        '_i2c = I2C(0, sda=Pin(4), scl=Pin(5), freq=100000)\n' +
        '_oled = SSD1306_I2C(128, 64, _i2c, 0x3C)\n\n';

      // 操縦ページ（Pico W）。accept を待たない作りにして、ずっと繰り返すの中で
      // 毎回呼んでも走りが止まらないようにする。ページは 0.3 秒ごとに /v を読み、
      // ボタン・値・数の欄のうち、プログラムで使っているものだけを出す。
      // ボタンを押している間は 0.2 秒ごとに命令を送り続け、離すと "停止" を1回送る。
      const webUse = `{"b": ${blockTypes.has('pvb_web_button') ? 1 : 0}, "n": ${blockTypes.has('pvb_web_number') ? 1 : 0}`;
      const webHelper =
        '_PVB_CMD = {b"/f": "前進", b"/b": "後退", b"/l": "左", b"/r": "右", b"/s": "停止"}\n' +
        `_PVB_PAGE = '''<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>PoliviaBot</title><style>body{font-family:sans-serif;text-align:center;margin:0;padding:12px;user-select:none;-webkit-user-select:none}#pad{display:none;grid-template-columns:repeat(3,1fr);gap:10px;max-width:360px;margin:0 auto 12px}#pad button{font-size:24px;padding:28px 0;border:0;border-radius:12px;background:#ddd;touch-action:none}#pad button:active{background:#8cd}#vals div{max-width:360px;margin:6px auto;text-align:left}#vals b{display:inline-block;min-width:4em}#vals span{font-size:22px}canvas{display:block;width:100%;height:60px;background:#f4f4f4;border-radius:6px}#num{display:none;max-width:360px;margin:12px auto}#num input{width:5em;font-size:20px;margin:0 6px}#num button{font-size:20px;padding:6px 16px}</style><h3>PoliviaBot</h3><div id=pad><i></i><button data-c=f>前</button><i></i><button data-c=l>左</button><button data-c=s>止</button><button data-c=r>右</button><i></i><button data-c=b>後</button><i></i></div><div id=vals></div><div id=num>A<input id=na type=number step=any value=0>B<input id=nb type=number step=any value=0><button id=ns>送る</button></div><script>var t=null;function go(c){fetch('/'+c,{cache:'no-store'}).catch(function(){})}document.querySelectorAll('#pad button').forEach(function(b){var c=b.dataset.c;b.onpointerdown=function(e){e.preventDefault();go(c);clearInterval(t);t=null;if(c!='s')t=setInterval(function(){go(c)},200)};b.onpointerup=b.onpointerleave=b.onpointercancel=function(){if(t){clearInterval(t);t=null;go('s')}}});document.getElementById('ns').onclick=function(){go('n?A='+encodeURIComponent(na.value)+'&B='+encodeURIComponent(nb.value))};var H={};function draw(k){var c=H[k].c,h=H[k].h,x=c.getContext('2d'),w=c.width=c.clientWidth,g=c.height=60,lo=Math.min.apply(0,h),hi=Math.max.apply(0,h);if(hi==lo){hi+=1;lo-=1}x.clearRect(0,0,w,g);x.beginPath();h.forEach(function(v,i){var X=i*w/99,Y=g-4-(v-lo)*(g-8)/(hi-lo);i?x.lineTo(X,Y):x.moveTo(X,Y)});x.strokeStyle='#07c';x.lineWidth=2;x.stroke()}function tick(){fetch('/v',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){pad.style.display=d.b?'grid':'none';num.style.display=d.n?'block':'none';for(var k in d.v){if(!H[k]){var e=document.createElement('div');e.innerHTML='<b></b><span></span><canvas></canvas>';e.firstChild.textContent=k;vals.appendChild(e);H[k]={s:e.children[1],c:e.children[2],h:[]}}var v=d.v[k];H[k].s.textContent=v;if(typeof v=='number'){H[k].h.push(v);if(H[k].h.length>100)H[k].h.shift();draw(k)}}}).catch(function(){}).then(function(){setTimeout(tick,300)})}tick()</script>'''.encode()\n` +
        '_pvb_cmd = ""\n' +
        '_pvb_vals = {}\n' +
        '_pvb_num = {"A": 0.0, "B": 0.0}\n\n' +
        'def _pvb_web_start():\n' +
        '    global _pvb_srv\n' +
        '    _pvb_srv = socket.socket()\n' +
        '    _pvb_srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\n' +
        '    _pvb_srv.bind(("0.0.0.0", 80))\n' +
        '    _pvb_srv.listen(2)\n' +
        '    _pvb_srv.setblocking(False)\n\n' +
        'def _pvb_web_poll():\n' +
        '    global _pvb_cmd\n' +
        '    try:\n' +
        '        c, _ = _pvb_srv.accept()\n' +
        '    except OSError:\n' +
        '        return\n' +
        '    try:\n' +
        '        c.settimeout(0.3)\n' +
        '        # 最後の空行まで読みきってから返す。読み残して閉じると接続がリセットされ、\n' +
        '        # スマホのブラウザはページを捨ててしまう（リクエストは 450 バイトほどある）\n' +
        '        req = b""\n' +
        '        while b"\\r\\n\\r\\n" not in req and len(req) < 2048:\n' +
        '            d = c.recv(512)\n' +
        '            if not d:\n' +
        '                break\n' +
        '            req += d\n' +
        '        req = req.split(b" ")\n' +
        '        path = req[1] if len(req) > 1 else b"/"\n' +
        '        head = b"HTTP/1.0 200 OK\\r\\nCache-Control: no-store\\r\\nContent-Type: "\n' +
        '        if path in _PVB_CMD:\n' +
        '            _pvb_cmd = _PVB_CMD[path]\n' +
        '            c.sendall(head + b"text/plain\\r\\n\\r\\nok")\n' +
        '        elif path == b"/v":\n' +
        `            c.sendall(head + b"application/json\\r\\n\\r\\n" + ('${webUse}, "v": ' + json.dumps(_pvb_vals) + '}').encode())\n` +
        '        elif path.startswith(b"/n?"):\n' +
        '            for kv in path[3:].split(b"&"):\n' +
        '                k, _, v = kv.partition(b"=")\n' +
        '                try:\n' +
        '                    _pvb_num[k.decode()] = float(v)\n' +
        '                except ValueError:\n' +
        '                    pass\n' +
        '            c.sendall(head + b"text/plain\\r\\n\\r\\nok")\n' +
        '        else:\n' +
        '            c.sendall(head + b"text/html; charset=utf-8\\r\\n\\r\\n")\n' +
        '            c.sendall(_PVB_PAGE)\n' +
        '    except OSError:\n' +
        '        pass\n' +
        '    c.close()\n\n' +
        'def _pvb_web_button():\n' +
        '    global _pvb_cmd\n' +
        '    _pvb_web_poll()\n' +
        '    cmd = _pvb_cmd\n' +
        '    _pvb_cmd = ""\n' +
        '    return cmd\n\n' +
        'def _pvb_web_show(name, v):\n' +
        '    _pvb_vals[name] = v\n' +
        '    _pvb_web_poll()\n\n' +
        'def _pvb_web_number(k):\n' +
        '    _pvb_web_poll()\n' +
        '    return _pvb_num[k]\n\n';

      // 合図（UDP・Pico W）。同じ Wi-Fi の全員へブロードキャストで送る。受け取りは待たない
      const udpHelper =
        '_pvb_udp = None\n\n' +
        'def _pvb_udp_open():\n' +
        '    global _pvb_udp, _pvb_bcast\n' +
        '    _pvb_udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\n' +
        '    try:\n' +
        '        _pvb_udp.setsockopt(socket.SOL_SOCKET, getattr(socket, "SO_BROADCAST", 0x20), 1)\n' +
        '    except OSError:\n' +
        '        pass\n' +
        '    _pvb_udp.bind(("0.0.0.0", 5005))\n' +
        '    _pvb_udp.setblocking(False)\n' +
        '    _pvb_bcast = "255.255.255.255"\n' +
        '    for i in (network.AP_IF, network.STA_IF):\n' +
        '        w = network.WLAN(i)\n' +
        '        ip, mask = w.ifconfig()[:2]\n' +
        '        if w.active() and ip != "0.0.0.0":\n' +
        '            _pvb_bcast = ".".join(str(int(a) | (255 - int(m))) for a, m in zip(ip.split("."), mask.split(".")))\n' +
        '            break\n\n' +
        'def _pvb_udp_send(msg):\n' +
        '    if _pvb_udp is None:\n' +
        '        _pvb_udp_open()\n' +
        '    try:\n' +
        '        _pvb_udp.sendto(str(msg).encode(), (_pvb_bcast, 5005))\n' +
        '    except OSError:\n' +
        '        pass\n\n' +
        'def _pvb_udp_recv():\n' +
        '    if _pvb_udp is None:\n' +
        '        _pvb_udp_open()\n' +
        '    try:\n' +
        '        return _pvb_udp.recv(64).decode()\n' +
        '    except OSError:\n' +
        '        return ""\n\n';

      header = baseHeader;
      if (hasMotor)    header += motorInit;
      if (hasSonarVal) header += sonarHelper;
      if (hasUltra)    header += ultraHelper;
      if (hasOled)     header += oledSetup;
      if (hasWeb)      header += webHelper;
      if (hasUdp)      header += udpHelper;
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
    if (currentBoard === 'microbit' && currentMode === 'micropython') {
      code = microbitProgram(topBlocks);
    } else {
      for (const block of topBlocks) {
        code += blockToCode(block, '');
      }
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

    // MicroPython モード: 配線図プレビューを更新（配線図は Pico 用だけ）
    if (currentMode === 'micropython' && currentBoard === 'pico') updateCircuitPreview();
  }

  // ===== 配線図プレビュー更新 =====
  // 配線図の地色は画面のテーマに合わせる。用紙色のまま黒い画面に置くと
  // 白い板だけが浮いて見えるため（data-theme は白テーマのときだけ 'light'）。
  function circuitIsDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  function updateCircuitPreview() {
    const previewSvg = document.getElementById('circuit-preview-svg');
    const previewSummary = document.getElementById('circuit-preview-summary');
    if (!previewSvg || typeof generateCircuitSVG !== 'function') return;
    try {
      const overrides = window.__pycoCircuitOverrides || {};
      const wireOverrides = window.__pycoCircuitWireOverrides || {};
      const result = generateCircuitSVG(workspace, { overrides, wireOverrides, dark: circuitIsDark() });
      previewSvg.innerHTML = result.svg;
      // 固定 width/height を外して CSS でコンテナにフィットさせる
      const svgEl = previewSvg.querySelector('svg');
      if (svgEl) {
        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');
        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }
      if (previewSummary) {
        previewSummary.textContent = result.compCount > 0
          ? `部品 ${result.compCount} / 接続 ${result.wireCount} (クリックで拡大)`
          : 'ブロックを追加すると配線図が表示されます';
      }
    } catch (err) {
      console.error('[circuit-preview]', err);
      previewSvg.innerHTML = `<p style="color:#f44336;padding:8px;font-size:.8em;font-family:sans-serif;">エラー: ${err.message}</p>`;
    }
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

  // ===== 作業域の上の帯（書き方の一覧・元に戻す・やり直す） =====
  //   Ctrl+Z を知らない子は、まちがえて消したブロックを戻せない。画面に押せるボタンを置く。
  //   以前は作業域（Blockly の描画面）の上に重ねていた（右下→右上の縦 1 列）が、
  //     ・右下：ブロックを落とすと後ろに隠れる、エラーパネルにふさがれる、スマホでは「▶ 実行」と重なる
  //     ・右上：横長のブロックや右へ広がったプログラムの右端が下にもぐる（作業域の狭いゲーム・micro:bit で起きやすい）
  //   ので、描画面の外に高さ 38px（32px のボタンが入る。スマホ表示は 44px のボタンが入る 50px）の帯（#ws-strip）を作り、横 1 列に並べる。
  //   帯は #blockly-div の最初の子で、Blockly の描画面（.injectionDiv）はその下の残りの高さを使う。
  //   帯の左には Python モードのカテゴリの切替（よく使うもの／ぜんぶ）を置く（下の toolboxScope）。
  //   見た目は css/style.css の #ws-strip・#ws-undo-bar button（担当を分けているので、ここでは並びと高さだけ決める）。
  const WS_STRIP_H = 38, WS_STRIP_H_MOBILE = 50, WS_STRIP_H_MOBILE_SLIM = 46;
  (function() {
    const host = document.getElementById('blockly-div');
    if (!host) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const strip = document.createElement('div');
    strip.id = 'ws-strip';
    strip.style.cssText = 'box-sizing:border-box;display:flex;align-items:center;gap:8px;padding:0 8px;overflow:hidden;';
    const left = document.createElement('div');
    left.id = 'ws-strip-left';
    left.style.cssText = 'display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;';
    strip.appendChild(left);
    const bar = document.createElement('div');
    bar.id = 'ws-undo-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', '作業域の操作');
    bar.style.cssText = 'display:flex;flex-direction:row;align-items:center;gap:6px;flex:none;margin-left:auto;';
    strip.appendChild(bar);
    function mk(id, label, title, redo) {
      const b = document.createElement('button');
      b.type = 'button';
      b.id = id;
      b.textContent = label;
      b.title = title;
      b.setAttribute('aria-label', title);
      b.addEventListener('click', function(ev) {
        const byKeyboard = ev.detail === 0;   // Enter・Space で押したとき（マウス・タッチは 1 以上）
        workspace.undo(redo);
        requestAnimationFrame(function() {
          sync();
          // マウスで押したときは作業域へフォーカスを返す。ボタンに残ると、続けて押す Ctrl+Z／Ctrl+Y が
          // Blockly に届かない（押して履歴が空になると body へ落ちて、作業域をクリックし直すまで効かなかった）
          // キーボードで押したときはボタンに残す。押せなくなったら、押せる方へ。両方押せなければ作業域へ
          if (byKeyboard && !b.disabled) return;
          const other = redo ? undoBtn : redoBtn;
          if (byKeyboard && !other.disabled) { other.focus(); return; }
          focusWorkspace();
        });
      });
      bar.appendChild(b);
      return b;
    }
    function focusWorkspace() {
      try {
        if (Blockly.getFocusManager) { Blockly.getFocusManager().focusTree(workspace); return; }
      } catch (e) { /* 下へ */ }
      try { workspace.getParentSvg().focus(); } catch (e) { /* noop */ }
    }
    // 構文リファレンス（ブロック画面用）。押すと右から引き出しが出る
    const refBtn = document.createElement('button');
    refBtn.type = 'button';
    refBtn.id = 'btn-ws-reference';
    refBtn.textContent = '書き方の一覧';
    refBtn.title = 'ブロックが作る Python の書き方の一覧（リファレンス）を開く';
    refBtn.addEventListener('click', function() { _refDrawer ? closeReferenceDrawer() : openReferenceDrawer(); });
    bar.appendChild(refBtn);
    const undoBtn = mk('btn-ws-undo', '↶ もどす', '元に戻す（Ctrl+Z）', false);
    const redoBtn = mk('btn-ws-redo', '↷ やりなおす', 'やり直す（Ctrl+Y）', true);
    // 描画面を帯の高さだけ縮める（.injectionDiv は CSS で height:100%）
    const inj = workspace.getInjectionDiv ? workspace.getInjectionDiv() : host.querySelector('.injectionDiv');
    host.insertBefore(strip, inj || host.firstChild);
    let stripH = 0;
    function syncHeight() {
      // スマホ表示で切替の無いモード（帯は ↶↷ だけ）は、44px のボタンがちょうど入る高さに詰める
      const mobile = document.body.classList.contains('mobile-mode');
      const h = mobile ? (strip.classList.contains('ws-strip--noscope') ? WS_STRIP_H_MOBILE_SLIM : WS_STRIP_H_MOBILE) : WS_STRIP_H;
      if (h === stripH) return;
      stripH = h;
      strip.style.height = h + 'px';
      if (inj) inj.style.height = 'calc(100% - ' + h + 'px)';
      requestAnimationFrame(function() { Blockly.svgResize(workspace); });
    }
    // スマホ表示では帯が狭いので記号だけにする（名前は aria-label と title に残す）
    function syncLabels() {
      const m = document.body.classList.contains('mobile-mode');
      undoBtn.textContent = m ? '↶' : '↶ もどす';
      redoBtn.textContent = m ? '↷' : '↷ やりなおす';
      // スマホでも書き方の一覧を開けるように（以前は隠していて、スマホにだけ開く道が無かった・r5 05 R5-04）
      refBtn.textContent = m ? '書き方' : '書き方の一覧';
      syncHeight();
    }
    new MutationObserver(syncLabels).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    syncLabels();
    function sync() {
      undoBtn.disabled = workspace.getUndoStack().length === 0;
      redoBtn.disabled = workspace.getRedoStack().length === 0;
    }
    workspace.addChangeListener(function() { requestAnimationFrame(sync); });
    sync();

    // ----- カテゴリの切替（よく使うもの／ぜんぶ）-----
    //   Python モードはカテゴリが 20 個あり、小学生はどこから見ればよいか分からない。
    //   帯の左（カテゴリの列の上）に切替を置き、「よく使うもの」では基本の 8 つだけを出す。
    //   既定は「ぜんぶ」。選んだ方は localStorage（pyco-tb-scope-python）に覚える。
    //   Python モード（main.py）だけに出し、効かせる。Pico・ゲーム・micro:bit はいつも全部。
    //   以前は保存キーがモード共通（pyco-tb-scope）で、Python で選んだ「よく使うもの」が Pico にも効き、
    //   「出力（LED）」「センサー」が何の知らせもなく消えていた（r4 03/04 R4-01）。
    //   「よく使うもの」のまま、隠れたカテゴリのブロック（関数など）を含むサンプル・ファイルを読み込んだら
    //   自動で「ぜんぶ」に戻し、知らせで一言いう（02 R4-01）。
    //   見た目は css/style.css の #tb-scope と .tb-scope-btn（[aria-pressed="true"] が今の方）
    const COMMON_CATS = ['表示', '値', '変数', '計算', '繰り返し', '分岐', '入力', '時間'];
    const SCOPE_KEY = 'pyco-tb-scope-python';
    let scope = 'all';
    try {
      let v = localStorage.getItem(SCOPE_KEY);
      // 古い共通キーからの引っ越し（1 回だけ）
      if (v === null && localStorage.getItem('pyco-tb-scope') !== null) {
        v = localStorage.getItem('pyco-tb-scope');
        localStorage.setItem(SCOPE_KEY, v);
      }
      localStorage.removeItem('pyco-tb-scope');
      if (v === 'common') scope = 'common';
    } catch (e) { /* noop */ }
    const scopeBox = document.createElement('div');
    scopeBox.id = 'tb-scope';
    scopeBox.setAttribute('role', 'group');
    scopeBox.setAttribute('aria-label', 'カテゴリの出し方');
    scopeBox.style.cssText = 'display:none;align-items:center;gap:0;';
    const scopeBtns = [['common', 'よく使うもの', 'よく使う 8 つのカテゴリだけを出す'], ['all', 'ぜんぶ', 'すべてのカテゴリを出す']].map(function(d) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tb-scope-btn';
      b.dataset.scope = d[0];
      b.textContent = d[1];
      b.title = d[2];
      b.addEventListener('click', function() {
        setScope(d[0]);
      });
      scopeBox.appendChild(b);
      return b;
    });
    left.appendChild(scopeBox);
    function setScope(v) {
      scope = v;
      try { localStorage.setItem(SCOPE_KEY, scope); } catch (e) { /* noop */ }
      applyToolboxScope();
    }
    // 切替を出すのは Python モードの main.py（カテゴリが多いツールボックス）のときだけ
    function scopeActive(items, names) {
      return currentMode === 'python' && items.length > 12 &&
        COMMON_CATS.every(function(n) { return names.indexOf(n) >= 0; });
    }
    function applyToolboxScope() {
      const tb = workspace.getToolbox && workspace.getToolbox();
      const items = tb ? tb.getToolboxItems() : [];
      const names = items.map(function(it) { return it.getName ? it.getName() : ''; });
      const many = scopeActive(items, names);
      scopeBox.style.display = many ? 'flex' : 'none';
      // 切替の無いモードでは帯の左が空になる。スマホ表示では帯を詰める（syncHeight）
      strip.classList.toggle('ws-strip--noscope', !many);
      syncHeight();
      // 見た目の下地（css/style.css の #tb-scope .tb-scope-btn が無いときでもツールバーのボタンと同じ形に見えるように）
      // 選ばれている方は塗らない（塗りは「次に押すボタン」＝［接続］［▶ 実行］の色）。枠線＋太字＋下線で示す
      scopeBtns.forEach(function(b) {
        const on = b.dataset.scope === scope;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.cssText = 'min-height:32px;padding:0 10px;border-radius:0;cursor:pointer;font-family:var(--font-mono);font-size:13px;white-space:nowrap;' +
          'border:1px solid ' + (on ? 'var(--accent-cyan)' : 'var(--border-dim)') + ';background:var(--bg-surface);' +
          (on ? 'color:var(--accent-cyan);font-weight:bold;text-decoration:underline;text-underline-offset:4px;' : 'color:var(--text-primary);font-weight:normal;');
      });
      // Python 以外（と別ファイルのタブ）ではいつも全部出す（隠したままのカテゴリを残さない）
      items.forEach(function(it) {
        if (it.getParent && it.getParent()) return;
        // 子カテゴリ（Python応用の中）は親ごと隠れるので、上の段だけ見る
        const show = !many || scope === 'all' || COMMON_CATS.indexOf(it.getName()) >= 0;
        if (show && it.show) it.show();
        else if (!show && it.hide) it.hide();
      });
      if (!many) return;
      const sel = tb.getSelectedItem && tb.getSelectedItem();
      if (sel && scope === 'common') {
        let top = sel;
        while (top.getParent && top.getParent()) top = top.getParent();
        if (COMMON_CATS.indexOf(top.getName()) < 0) tb.clearSelection();
      }
    }
    // ツールボックスを入れかえる所（モード切替・ファイルのタブ・学習モード）がいくつもあるので、ここでまとめて受ける
    const origUpdateToolbox = workspace.updateToolbox.bind(workspace);
    workspace.updateToolbox = function(def) { origUpdateToolbox(def); applyToolboxScope(); };
    applyToolboxScope();

    // 「よく使うもの」のときに、隠れたカテゴリのブロックが作業域に入ったら（サンプル・ファイル・復元）「ぜんぶ」へ戻す。
    //   出ているカテゴリの中身（入れ子の値ブロックも含む）にある型は、ブロック一覧から出しただけなので数えない
    function typesIn(node, out) {
      if (!node) return out;
      if (Array.isArray(node)) { node.forEach(function(n) { typesIn(n, out); }); return out; }
      if (typeof node !== 'object') return out;
      if (node.type && typeof node.type === 'string') out[node.type] = true;
      // XML で書いたツールボックスは中身が blockxml（DOM）に入っている。入れ子の値ブロック・影も数える
      if (node.blockxml && node.blockxml.querySelectorAll) {
        Array.prototype.forEach.call(node.blockxml.querySelectorAll('block[type],shadow[type]'), function(el) { out[el.getAttribute('type')] = true; });
        return out;
      }
      Object.keys(node).forEach(function(k) { if (k !== 'type' && node[k] && typeof node[k] === 'object') typesIn(node[k], out); });
      return out;
    }
    function hiddenTypesInfo() {
      const tb = workspace.getToolbox && workspace.getToolbox();
      if (!tb) return null;
      const vis = {}, hid = {};
      let procHidden = false;
      tb.getToolboxItems().forEach(function(it) {
        let top = it;
        while (top.getParent && top.getParent()) top = top.getParent();
        const shown = COMMON_CATS.indexOf(top.getName ? top.getName() : '') >= 0;
        let contents = null;
        try { contents = it.getContents ? it.getContents() : null; } catch (e) { contents = null; }
        if (typeof contents === 'string') { if (!shown && contents === 'PROCEDURE') procHidden = true; return; }
        typesIn(contents, shown ? vis : hid);
      });
      return { vis: vis, hid: hid, procHidden: procHidden };
    }
    let _scopeCheckQueued = false;
    workspace.addChangeListener(function(e) {
      if (e.type !== Blockly.Events.BLOCK_CREATE || scope !== 'common' || _scopeCheckQueued) return;
      _scopeCheckQueued = true;
      // 読み込みは何百個のブロックを一度に作るので、まとめて 1 回だけ調べる
      setTimeout(function() {
        _scopeCheckQueued = false;
        if (scope !== 'common' || scopeBox.style.display === 'none') return;
        const info = hiddenTypesInfo();
        if (!info) return;
        const hit = workspace.getAllBlocks(false).some(function(b) {
          const t = b.type;
          if (info.vis[t]) return false;
          if (info.hid[t]) return true;
          return info.procHidden && /^procedures_/.test(t);
        });
        if (!hit) return;
        setScope('all');
        showToast('「よく使うもの」に無いブロックがあるので、カテゴリを「ぜんぶ」にしました。');
      }, 0);
    });
  })();

  // ===== Ctrl+Enter で実行 =====
  //   いま見えていて押せる実行ボタンを押す（Python/ゲームはシェル実行、Pico/micro:bit は実機かシミュレータ）。
  //   エディタの中でも効くよう capture で先に受ける。
  document.addEventListener('keydown', function(e) {
    if (!(e.ctrlKey || e.metaKey) || e.key !== 'Enter' || e.shiftKey || e.altKey) return;
    const btn = ['btn-run-python', 'btn-run'].map(function(id) { return document.getElementById(id); })
      .find(function(b) { return b && getComputedStyle(b).display !== 'none'; });
    if (!btn) return;
    e.preventDefault();
    // Blockly 12 のキーボード操作では Ctrl+Enter が「メニューを開く」に割り当てられていて、
    // 実行と同時に右クリックメニューが開いていた（続けて Enter で「複製」などが実行される）。Blockly に渡さない
    e.stopImmediatePropagation();
    if (!btn.disabled) btn.click();
  }, true);

  // ===== テーマ切替（黒/白） =====
  const THEMES = [
    // ボタンの字は「押すとどうなるか」。今の色は画面そのもので分かる（見出しは「画面の色」）
    { id: 'dark',  label: '白にする',  hint: '画面の色を白にする（いまは黒）', cmTheme: 'dracula', blocklyTheme: pcbTheme   },
    { id: 'light', label: '黒にする',  hint: '画面の色を黒にする（いまは白）', cmTheme: 'default', blocklyTheme: lightTheme },
  ];
  let currentTheme = localStorage.getItem('pyco-theme') || 'dark';

  function applyTheme(themeId) {
    currentTheme = themeId;
    const t = THEMES.find(function(t) { return t.id === themeId; }) || THEMES[0];
    document.documentElement.setAttribute('data-theme', themeId === 'dark' ? '' : themeId);
    document.getElementById('btn-theme').textContent = t.label;
    document.getElementById('btn-theme').title = t.hint;
    document.getElementById('btn-theme').setAttribute('aria-label', t.hint);
    editor.setOption('theme', t.cmTheme);
    workspace.setTheme(t.blocklyTheme);
    localStorage.setItem('pyco-theme', themeId);
    // 配線図の地色もテーマに追従させる（拡大表示が開いていればそちらも）
    if (currentMode === 'micropython' && currentBoard === 'pico') updateCircuitPreview();
    if (typeof window.__pycoCircuitRerender === 'function') window.__pycoCircuitRerender();
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

  // A+／A− はブロック作業域の拡大率も同じ割合で変える。プロジェクタで後ろの席から読めるように
  // 「A+」を押してもコード欄だけ大きくなり、肝心のブロックが小さいままだったため。
  function scaleWorkspaceBy(ratio) {
    if (!workspace) return;
    const next = Math.max(0.3, Math.min(3, workspace.scale * ratio));
    workspace.setScale(next);
    Blockly.svgResize(workspace);
  }

  document.getElementById('btn-font-inc').addEventListener('click', function() {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    if (idx < FONT_SIZES.length - 1) {
      scaleWorkspaceBy(FONT_SIZES[idx + 1] / currentFontSize);
      applyFontSize(FONT_SIZES[idx + 1]);
    }
  });

  document.getElementById('btn-font-dec').addEventListener('click', function() {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    if (idx > 0) {
      scaleWorkspaceBy(FONT_SIZES[idx - 1] / currentFontSize);
      applyFontSize(FONT_SIZES[idx - 1]);
    }
  });
  document.getElementById('btn-font-inc').title = 'ブロックとコードの文字を大きく';
  document.getElementById('btn-font-dec').title = 'ブロックとコードの文字を小さく';

  applyTheme(currentTheme);
  applyFontSize(currentFontSize);

  const btnComments = document.getElementById('btn-toggle-comments');
  btnComments.addEventListener('click', function() {
    showComments = !showComments;
    // 「# ON」では今の状態か押すとそうなるのか分からなかったので、チェックの形で今の状態を出す
    btnComments.textContent = showComments ? '☑ あり' : '☐ なし';
    btnComments.setAttribute('aria-checked', showComments ? 'true' : 'false');
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
    // micro:bit 用。Pico 用（machine.Pin など）を出すと、まちがった書き方を覚えてしまうので分ける。
    // label は「ブロックの名前（カテゴリ）」、code はそのブロックが作るコード（js/blocks/microbit.js の
    // STMT / VALUE / HAT）と同じ形にしてある。ブロックとコードを見比べられるように
    microbit: [
      {
        cat: 'はじめに書くこと', tb: '基本',
        items: [
          { label: 'micro:bit の道具を使う', tb: null, code: 'from microbit import *' },
          { label: 'ずっと（基本）',         code: 'while True:\n    sleep(20)' },
          { label: '一時停止（ミリ秒）（基本）', code: 'sleep(1000)' },
        ]
      },
      {
        cat: 'LED に表示（基本）', tb: '基本',
        items: [
          { label: 'アイコンを表示',       code: 'display.show(Image.HEART)' },
          { label: 'LED画面に表示',        code: "display.show(Image('09090:99999:99999:09990:00900'))" },
          { label: '数を表示',             code: 'display.scroll(123)' },
          { label: '文字列を表示',         code: 'display.scroll(str("Hello!"))' },
          { label: '矢印を表示',           code: 'display.show(Image.ARROW_N)' },
          { label: '表示を消す',           code: 'display.clear()' },
          { label: '点灯 x y（LED）',      tb: 'LED', code: 'display.set_pixel(2, 2, 9)' },
          { label: '消灯 x y（LED）',      tb: 'LED', code: 'display.set_pixel(2, 2, 0)' },
        ]
      },
      {
        cat: 'ボタン・タッチ（入力）', tb: '入力',
        items: [
          { label: 'ボタン A が押されたとき', code: 'if button_a.was_pressed():\n    display.show(Image.HAPPY)' },
          { label: 'ボタン A が押されている', code: 'button_a.is_pressed()' },
          { label: 'ロゴがタッチされている', code: 'pin_logo.is_touched()' },
          { label: '端子 P0 がタッチされている', code: 'pin0.is_touched()' },
        ]
      },
      {
        cat: 'センサー（入力）', tb: '入力',
        items: [
          { label: 'ゆさぶられたとき',     code: "if accelerometer.was_gesture('shake'):\n    display.show(Image.SURPRISED)" },
          { label: '加速度 x',             code: 'accelerometer.get_x()' },
          { label: '明るさ',               code: 'display.read_light_level()' },
          { label: '温度（℃）',            code: 'temperature()' },
          { label: '方角（°）',            code: 'compass.heading()' },
          { label: 'まわりの音の大きさ',   code: 'microphone.sound_level()' },
          { label: '稼働時間（ミリ秒）',   code: 'running_time()' },
        ]
      },
      {
        cat: '音楽', tb: '音楽',
        items: [
          { label: '音の道具を使う',       tb: null, code: 'import music' },
          { label: 'メロディを鳴らす',     code: 'music.play(music.BIRTHDAY, wait=True)' },
          { label: '音を鳴らす（Hz, ミリ秒）', code: 'music.pitch(262, 500)' },
          { label: 'すべての音を停止する', code: 'music.stop(); audio.stop()' },
        ]
      },
      {
        cat: '無線', tb: '無線',
        items: [
          { label: '無線の道具を使う',     tb: null, code: 'import radio\nradio.on()' },
          { label: '無線のグループを設定', code: 'radio.config(group=1)' },
          { label: '無線で文字列を送信',   code: 'radio.send(str("hello"))' },
          { label: '無線で受信したとき',   code: 'received_string = radio.receive()\nif received_string is not None:\n    display.scroll(str(received_string))' },
        ]
      },
      {
        cat: '入出力端子', tb: '入出力端子',
        items: [
          { label: 'デジタルで出力する P0', code: 'pin0.write_digital(1)' },
          { label: 'デジタルで読み取る P0', code: 'pin0.read_digital()' },
          { label: 'アナログで読み取る P0', code: 'pin0.read_analog()' },
          { label: 'アナログで出力する P0', code: 'pin0.write_analog(1023)' },
        ]
      },
      {
        cat: 'シリアル通信（グラフ）', tb: 'シリアル通信',
        items: [
          { label: '1行書き出す',           code: 'print("hello")' },
          { label: '名前と数値を書き出す（グラフになる）', code: "print(str('x') + ':' + str(accelerometer.get_x()))" },
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

  // 書き方の一覧（micro:bit）の札 → そのブロックの型。札を押すと、左のブロック一覧でそのカテゴリを開いて光らせる
  const MB_REF_BLOCK = {
    'ずっと（基本）': 'mb_forever', '一時停止（ミリ秒）（基本）': 'mb_pause',
    'アイコンを表示': 'mb_show_icon', 'LED画面に表示': 'mb_show_leds', '数を表示': 'mb_show_number',
    '文字列を表示': 'mb_scroll', '矢印を表示': 'mb_show_arrow', '表示を消す': 'mb_clear',
    '点灯 x y（LED）': 'mb_plot', '消灯 x y（LED）': 'mb_unplot',
    'ボタン A が押されたとき': 'mb_on_button', 'ボタン A が押されている': 'mb_button',
    'ロゴがタッチされている': 'mb_logo_touched', '端子 P0 がタッチされている': 'mb_pin_touched',
    'ゆさぶられたとき': 'mb_on_gesture', '加速度 x': 'mb_accel', '明るさ': 'mb_light',
    '温度（℃）': 'mb_temperature', '方角（°）': 'mb_compass', 'まわりの音の大きさ': 'mb_sound_level',
    '稼働時間（ミリ秒）': 'mb_running_time',
    'メロディを鳴らす': 'mb_music_play', '音を鳴らす（Hz, ミリ秒）': 'mb_play_tone', 'すべての音を停止する': 'mb_stop_all',
    '無線のグループを設定': 'mb_radio_group', '無線で文字列を送信': 'mb_radio_send_string', '無線で受信したとき': 'mb_on_radio',
    'デジタルで出力する P0': 'mb_digital_write', 'デジタルで読み取る P0': 'mb_digital_read',
    'アナログで読み取る P0': 'mb_analog_read', 'アナログで出力する P0': 'mb_analog_write',
    '1行書き出す': 'mb_serial_line', '名前と数値を書き出す（グラフになる）': 'mb_serial_value',
  };
  function buildSyntaxPanel(mode) {
    // micro:bit は currentMode が 'micropython'（ボードだけ違う）なので、ここでボードを見て分ける
    const mb = mode === 'micropython' && currentBoard === 'microbit';
    const data = (mb ? SYNTAX_REF.microbit : SYNTAX_REF[mode]) || SYNTAX_REF.python;
    const container = document.getElementById('syntax-content');
    document.getElementById('syntax-mode-label').textContent =
      mb ? 'micro:bit'
      : mode === 'micropython' ? 'MicroPython'
      : mode === 'game' ? 'ゲーム'
      : 'Python入門';
    if (!container) return;
    container.replaceChildren();
    // micro:bit は、コードだけでは小学生が「どのブロックか」分からないので、各項目の頭に
    // そのブロックの名前を、ブロックと同じ色の小さな札（.syn-block）で出す：［文字列を表示］→ display.scroll(...)
    // 色はツールボックスのカテゴリ（tb）の色。tb が null の項目はブロックが無い（自動で入る）
    const tbColour = {};
    if (mb) {
      try {
        workspace.getToolbox().getToolboxItems().forEach(function(it) {
          if (it.getName && it.colour_) tbColour[it.getName()] = it.colour_;
        });
      } catch (e) { /* 色が取れなくても札は出す */ }
    }

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
        // 押すとコードに入るのはコード編集のときだけ（ブロック画面の引き出しでは見るだけ）
        if (codingMode) itemEl.title = 'クリックで挿入';

        const labelEl = document.createElement('span');
        labelEl.className = 'syn-label';
        labelEl.textContent = item.label;
        const tb = mb ? (item.tb !== undefined ? item.tb : cat.tb) : undefined;
        if (mb) {
          itemEl.classList.add('syn-item--block');
          if (tb) {
            labelEl.classList.add('syn-block');
            labelEl.dataset.tb = tb;
            if (MB_REF_BLOCK[item.label]) labelEl.dataset.block = MB_REF_BLOCK[item.label];
            labelEl.title = '［' + tb + '］にあるブロック' + (codingMode ? '' : '（押すと左のブロック一覧で光ります）');
            if (!codingMode) { labelEl.tabIndex = 0; labelEl.setAttribute('role', 'button'); }
            labelEl.style.cssText = 'display:inline-block;padding:3px 10px;border-radius:4px;color:#fff;font-size:13px;font-weight:bold;line-height:1.4;' +
              'background:' + (tbColour[tb] || '#455a64') + ';';
          } else {
            labelEl.classList.add('syn-block--none');
            labelEl.style.fontSize = '13px';
            labelEl.textContent = item.label + '（ブロックは無い・自動で入る）';
          }
        }
        itemEl.appendChild(labelEl);

        const codeEl = document.createElement('code');
        if (mb) codeEl.style.fontSize = '13px';
        const lines = String(item.code || '').split('\n');
        lines.forEach(function(line, i) {
          if (i > 0) codeEl.appendChild(document.createElement('br'));
          codeEl.appendChild(document.createTextNode(line));
        });
        if (mb && tb) {
          // 札の下に「→ コード」。ブロックからこのコードができる、と読めるように
          const row = document.createElement('div');
          row.className = 'syn-code-row';
          row.style.cssText = 'display:flex;align-items:flex-start;gap:6px;margin:3px 0 4px 4px;';
          const ar = document.createElement('span');
          ar.className = 'syn-arrow';
          ar.setAttribute('aria-hidden', 'true');
          ar.textContent = '→';
          ar.style.cssText = 'font-size:13px;line-height:1.5;color:var(--text-dim);flex:none;';
          row.appendChild(ar);
          row.appendChild(codeEl);
          itemEl.appendChild(row);
        } else {
          itemEl.appendChild(codeEl);
        }

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
    // ブロック画面で開いているときはコードに入れない（読み取り専用のエディタに API で書き込むと、ブロックと食い違うため）。
    // micro:bit の札（ブロックの名前）を押したときは、引き出しを閉じて左のブロック一覧でそのブロックを光らせる。
    // 札のほかは押せない見た目（css：引き出しの中は cursor:default）なので、押しても何もしない
    if (!codingMode) {
      const tag = e.target.closest('.syn-block');
      if (tag && tag.dataset.tb) {
        const byKey = _refTagByKey;
        _refTagByKey = false;
        closeReferenceDrawer();
        showBlockInToolbox(tag.dataset.tb, tag.dataset.block, byKey);
      }
      return;
    }
    editor.replaceSelection(code);
    editor.focus();
    // 挿入フラッシュ演出
    item.classList.add('syn-item--inserted');
    setTimeout(function() { item.classList.remove('syn-item--inserted'); }, 400);
  });

  // キーボードでも札を押せるように（Enter・Space）
  document.getElementById('syntax-content').addEventListener('keydown', function(e) {
    if ((e.key !== 'Enter' && e.key !== ' ') || codingMode) return;
    const tag = e.target.closest && e.target.closest('.syn-block');
    if (!tag) return;
    e.preventDefault();
    // キーボードで押したときは、閉じたあとフォーカスを開いたカテゴリへ移す（光ったブロックへキーで行けるように）
    _refTagByKey = true;
    tag.click();
    _refTagByKey = false;
  });
  let _refTagByKey = false;

  // ===== 画面の小道具：選択ダイアログとトースト =====
  //   confirm() は「OK／キャンセル」の 2 択しか出せず、ボタンの言葉も変えられない。
  //   「保存して戻る／消して戻る／やめる」のように、押す前に結果が分かる言葉で聞くために自前で出す。
  //   CSS は担当を分けているので style.css に頼らず、テーマの CSS 変数をインラインで使う。
  // ダイアログを開いている間の約束ごと（askChoice とサンプル一覧で共通）
  //   ・背景（body の他の子）を inert にして、Tab・読み上げが外へ出ないようにする
  //   ・Tab／Shift+Tab はダイアログの中で回す（inert の効かないブラウザ向けの保険）
  //   ・Esc で onCancel
  //   ・閉じたら、開く前にフォーカスがあった所へ戻す。そこが今は見えない（メニューの中など）ときは
  //     メニューのボタン（［ファイル］、スマホは［☰ メニュー］）へ
  //   戻り値の関数を呼ぶと元に戻す
  function holdModal(back, box, onCancel) {
    const opener = document.activeElement;
    const inerted = [];
    Array.prototype.forEach.call(document.body.children, function(c) {
      if (c === back || c.inert || c.tagName === 'SCRIPT') return;
      c.inert = true; inerted.push(c);
    });
    function focusables() {
      return Array.prototype.filter.call(
        box.querySelectorAll('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'),
        function(el) {
          if (el.disabled || el.offsetParent === null) return false;
          // 閉じた <details> の中身は見えないのに offsetParent が残る（Chrome）。最後の 1 つがそこにあると、
          // 「最後で先頭へ戻す」が効かずに 1 回だけ外へ出ていた（サンプル一覧・r4 05 R4-03）
          const cd = el.closest('details:not([open])');
          return !cd || (el.tagName === 'SUMMARY' && el.parentNode === cd);
        });
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    return function release() {
      document.removeEventListener('keydown', onKey, true);
      inerted.forEach(function(c) { c.inert = false; });
      const visible = function(el) { return el && el.isConnected && el.offsetParent !== null && !el.disabled; };
      const mobile = document.body.classList.contains('mobile-mode');
      const target = [opener, document.getElementById(mobile ? 'btn-mobile-menu' : 'btn-menu-file')].find(visible);
      if (target && target !== document.body) { try { target.focus(); } catch (e) { /* noop */ } }
    };
  }

  function askChoice(title, message, choices) {
    return new Promise(function(resolve) {
      const back = document.createElement('div');
      back.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;';
      const box = document.createElement('div');
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.style.cssText = 'background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-glow);border-radius:10px;padding:18px 20px;width:min(520px,94vw);font-size:15px;line-height:1.6;box-shadow:0 6px 24px rgba(0,0,0,.4);';
      const h = document.createElement('div');
      h.id = 'pyco-choice-title';
      h.textContent = title;
      h.style.cssText = 'font-weight:bold;font-size:16px;margin-bottom:8px;';
      box.setAttribute('aria-labelledby', h.id);
      const p = document.createElement('p');
      p.id = 'pyco-choice-msg';
      p.textContent = message;
      p.style.cssText = 'margin:0 0 14px;white-space:pre-line;';
      // 題名とボタン名だけでなく、本文（「置きかえると今のブロックは消えます」など）も読ませる
      box.setAttribute('aria-describedby', p.id);
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;';
      let firstBtn = null;
      let release = null;
      function close(v) {
        if (back.parentNode) back.parentNode.removeChild(back);
        if (release) release();
        resolve(v);
      }
      choices.forEach(function(c) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = c.label;
        b.style.cssText = 'min-height:36px;padding:6px 14px;border-radius:6px;font-size:14px;cursor:pointer;' +
          (c.primary ? 'background:var(--accent-green);color:var(--bg-base);border:1px solid var(--accent-green);font-weight:bold;'
                     : 'background:transparent;color:var(--text-primary);border:1px solid var(--text-dim);');
        b.addEventListener('click', function() { close(c.value); });
        row.appendChild(b);
        // 初めにフォーカスする（Enter で押される）のは focus を付けた選択肢、無ければ主ボタン
        if (c.focus) firstBtn = b;
        else if (c.primary && !firstBtn) firstBtn = b;
      });
      box.appendChild(h); box.appendChild(p); box.appendChild(row);
      back.appendChild(box);
      back.addEventListener('click', function(e) { if (e.target === back) close(null); });
      document.body.appendChild(back);
      release = holdModal(back, box, function() { close(null); });
      (firstBtn || row.firstChild).focus();
    });
  }

  // 目線の近く（ツールバーのすぐ下）に出す知らせ。接続の失敗などをコード欄見出しの小さな字だけで
  // 知らせると気づかれないため。action を渡すと「次にすること」をボタンで押せる。
  //   ・位置：ヘッダーの実際の下端の下。ヘッダーは幅で 1〜2 段に変わるので、CSS の --header-h（54px の
  //     決め打ち）ではツールバーの下 14px に重なり、文中で「押して」と言っている［接続］を隠していた。
  //     下端は ResizeObserver で測って --pyco-header-bottom に入れる（--header-h はレイアウトにも
  //     使われているので書き換えない）
  //   ・重なり順：ヘッダーの中（メニュー .tb-menu-pop より下）に置く。DOM もツールバーの直後になるので、
  //     キーボードでも［接続］の次の Tab でボタンへ届く
  //   ・消える時間：文の長さに合わせて延ばし、マウスを乗せている間・フォーカス中は消さない（WCAG 2.2.1）
  //   ・知らせは画面に 1 つだけ。自動保存の「前回の作業を復元しました」もこの部品で出す（window.PycoToast）
  // 大きさが変わらずに位置だけ変わる（上の行の書体が読み込まれて下がる等）と ResizeObserver は
  // 呼ばれないので、知らせ・引き出しを出す直前にも測り直す
  function measureHeaderBottom() {
    const header = document.querySelector('header');
    if (!header) return;
    document.documentElement.style.setProperty('--pyco-header-bottom', Math.round(header.getBoundingClientRect().bottom) + 'px');
    // 狭いパソコン幅（1180px 以下）では［ログイン］をモード切替の左に置く（css：F10）。その位置に使う幅
    const mt = header.querySelector('.mode-toggle');
    if (mt && mt.offsetWidth) document.documentElement.style.setProperty('--pyco-mode-toggle-w', mt.offsetWidth + 'px');
  }
  (function trackHeaderBottom() {
    const header = document.querySelector('header');
    if (!header) return;
    measureHeaderBottom();
    if (window.ResizeObserver) new ResizeObserver(measureHeaderBottom).observe(header);
    window.addEventListener('resize', measureHeaderBottom);
  })();
  let _toastClose = null;
  function hideToast() { if (_toastClose) _toastClose(); }
  function showToast(msg, opts) {
    opts = opts || {};
    hideToast();
    measureHeaderBottom();
    const el = document.createElement('div');
    el.id = 'pyco-toast';
    el.className = 'pyco-toast' + (opts.type === 'err' ? ' err' : '');
    el.setAttribute('role', opts.type === 'err' ? 'alert' : 'status');
    const err = opts.type === 'err';
    // スマホ表示（幅 900px 以下もこちらになる）の header は高さ固定・overflow:hidden・transform 付きで、
    // その中に入れると position:fixed でも header の箱で切られて何も見えなかった。body 直下に置き、左右 12px で出す。
    // パソコンでは右寄せ（コード欄の上）。中央に出すと作業域右上の［書き方の一覧／もどす／やりなおす］をふさいでいた
    const mobile = document.body.classList.contains('mobile-mode');
    el.classList.add(mobile ? 'pyco-toast--mobile' : 'pyco-toast--pc');
    // パソコンではコード欄の幅の中に収める。1024 幅では右寄せ 520px が作業域の［もどす］やズームにかかっていた（r4 01 R4-01）
    let pcPos = 'right:16px;max-width:min(520px,calc(100vw - 32px));';
    if (!mobile) {
      const cp = document.querySelector('.code-panel');
      const r = (cp && cp.offsetParent !== null) ? cp.getBoundingClientRect() : null;
      if (r && r.width >= 240) {
        pcPos = 'right:' + Math.max(8, Math.round(window.innerWidth - r.right + 12)) + 'px;' +
          'max-width:' + Math.round(Math.min(520, r.width - 24)) + 'px;';
      }
    }
    // スマホでは帯（↶ ↷）が見えていればその下に出す（帯の上にかかって［もどす］が押せなかった・r5 04 R5-04）
    let topCss = 'calc(var(--pyco-header-bottom, var(--header-h)) + 8px)';
    if (mobile) {
      const strip = document.getElementById('ws-strip') || document.getElementById('ws-undo-bar');
      const sr = (strip && strip.offsetParent !== null) ? strip.getBoundingClientRect() : null;
      if (sr && sr.height > 0 && sr.bottom > 0) topCss = 'max(' + topCss + ', ' + Math.round(sr.bottom + 8) + 'px)';
    }
    // 文は 1 行目に全幅で、文字のボタン（［MicroPython導入を開く］など）があるときだけ 2 行目の右に回す（文が細い列で 6 行に折れていた）。
    // ［×］は右上に固定（×だけのときまで 2 行になり、中身の半分が空いていた・r5 04 R5-01）
    el.style.cssText = 'position:fixed;top:' + topCss + ';flex-wrap:' + (opts.action ? 'wrap' : 'nowrap') + ';justify-content:flex-end;' +
      'padding-right:' + (mobile ? 58 : 52) + 'px !important;' +
      (mobile ? 'left:12px;right:12px;z-index:2100;min-height:52px;'
              : 'left:auto;z-index:150;' + pcPos) +
      'display:flex;align-items:center;gap:8px 12px;padding:10px 14px;border-radius:0;' +
      'font-size:15px;line-height:1.5;box-shadow:0 4px 16px rgba(0,0,0,.35);' +
      (err ? 'background:#7a1f1f;color:#fff;border:1px solid #ff8a8a;' : 'background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-glow);');
    const t = document.createElement('span');
    t.className = 'pyco-toast-msg';
    t.textContent = msg;
    t.style.flex = opts.action ? '1 1 100%' : '1 1 auto';
    el.appendChild(t);
    if (opts.action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = opts.action.label;
      b.style.cssText = 'flex:none;min-height:32px;padding:4px 12px;border-radius:0;font-size:14px;cursor:pointer;background:#fff;color:#222;border:none;font-weight:bold;';
      b.addEventListener('click', function() { close(); opts.action.onClick(); });
      el.appendChild(b);
    }
    const x = document.createElement('button');
    x.type = 'button';
    x.textContent = '×';
    x.setAttribute('aria-label', '知らせを閉じる');
    x.title = '閉じる';
    x.style.cssText = 'position:absolute;top:6px;right:6px;flex:none;min-width:32px;min-height:32px;background:none;border:1px solid currentColor;color:inherit;font-size:18px;line-height:1;cursor:pointer;padding:0;';
    x.addEventListener('click', function() { close(true); });
    el.appendChild(x);
    // 閉じたときにフォーカスを返す先：出す前にいた所（body なら［接続］）
    const opener = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : null;
    const toolbar = document.querySelector('header .toolbar');
    // パソコンでは DOM をツールバーの直後に置く（［接続］の次の Tab でボタンへ届く）
    if (!mobile && toolbar && toolbar.parentNode) toolbar.parentNode.insertBefore(el, toolbar.nextSibling);
    else document.body.appendChild(el);
    // 読む時間：1 文字 0.25 秒（エラー）／0.12 秒。短くてもエラーは 10 秒、ふつうは 4 秒。
    // 長い文でもエラー 15 秒・ふつう 8 秒で打ち切る（乗せている間は消えないので、読みたい子は止められる）
    const len = String(msg).length;
    const ms = opts.ms || (err ? Math.min(15000, Math.max(10000, len * 250)) : Math.min(8000, Math.max(4000, len * 120)));
    let timer = null, hold = 0;
    function arm() { clearTimeout(timer); timer = setTimeout(function() { if (!hold) close(); }, ms); }
    // 乗せている・フォーカスしている間は消さない。離れたらもう一度 ms 待つ
    el.addEventListener('mouseenter', function() { hold++; });
    el.addEventListener('mouseleave', function() { hold = Math.max(0, hold - 1); if (!hold) arm(); });
    el.addEventListener('focusin', function() { hold++; });
    el.addEventListener('focusout', function() { hold = Math.max(0, hold - 1); if (!hold) arm(); });
    arm();
    // Esc で閉じる（ダイアログ・引き出しが開いているときはそちらが先に受ける）
    function onKey(e) {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      close(true);
    }
    document.addEventListener('keydown', onKey);
    // restoreFocus：× と Esc のとき。フォーカスが知らせの中（か body）にあれば、出す前の場所か［接続］へ返す
    function close(restoreFocus) {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      const a = document.activeElement;
      const inside = a && (el.contains(a) || a === document.body);
      if (el.parentNode) el.parentNode.removeChild(el);
      if (_toastClose === close) _toastClose = null;
      if (restoreFocus && inside) {
        const back = (opener && opener.isConnected && opener.offsetParent !== null) ? opener : document.getElementById('btn-connect');
        if (back && back.offsetParent !== null) { try { back.focus(); } catch (e2) { /* noop */ } }
      }
    }
    _toastClose = close;
  }
  window.PycoToast = { show: showToast, hide: hideToast };

  // ===== ブロック画面で開く構文リファレンス（右から出る引き出し） =====
  //   リファレンスはコード編集のときだけ左に出る作りで、ブロックで授業をしている間は存在に気づけなかった。
  //   ブロック画面では #syntax-panel を一時的に引き出しへ移して見せ、閉じたら元の場所へ戻す
  //   （レイアウト用の CSS には手を入れない）。
  let _refDrawer = null;
  function openReferenceDrawer() {
    if (codingMode || _refDrawer) return;
    const panel = document.getElementById('syntax-panel');
    if (!panel) return;
    buildSyntaxPanel(currentMode);
    measureHeaderBottom();
    const home = { parent: panel.parentNode, next: panel.nextSibling };
    // ほかのダイアログ（サンプル一覧・確認）と同じ扱いにする：aria-modal・背景は inert・Tab は中で回る・
    // Esc／外側を押すと閉じ、開いた［書き方の一覧］ボタンへフォーカスを戻す（holdModal）。
    // 外側（背景）は薄く暗くして、引き出しの間は作業域を触れないことを見せる
    const back = document.createElement('div');
    back.className = 'pyco-ref-back';
    back.style.cssText = 'position:fixed;left:0;right:0;bottom:0;top:var(--pyco-header-bottom, var(--header-h));z-index:9200;background:rgba(0,0,0,.25);';
    const drawer = document.createElement('div');
    drawer.className = 'pyco-ref-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', '書き方の一覧');
    // 上端はヘッダーの下（ツールバーの「⚙ 表示」などを覆わない）
    drawer.style.cssText = 'position:absolute;top:0;right:0;bottom:0;width:min(380px,92vw);' +
      'display:flex;flex-direction:column;background:var(--bg-panel);border-left:1px solid var(--border-glow);box-shadow:-6px 0 18px rgba(0,0,0,.35);';
    back.appendChild(drawer);
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--border-dim);font-size:13px;color:var(--text-primary);';
    const note = document.createElement('span');
    note.style.flex = '1';
    note.textContent = 'ブロックが作るコードの書き方の一覧';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '閉じる ✕';
    close.style.cssText = 'min-height:32px;padding:2px 10px;border-radius:6px;cursor:pointer;background:transparent;color:var(--text-primary);border:1px solid var(--text-dim);font-size:13px;';
    bar.appendChild(note); bar.appendChild(close);
    drawer.appendChild(bar);
    panel.style.display = 'flex';
    panel.style.width = '100%';
    panel.style.flex = '1 1 auto';
    drawer.appendChild(panel);
    document.body.appendChild(back);
    back.addEventListener('click', function(e) { if (e.target === back) closeReferenceDrawer(); });
    const release = holdModal(back, drawer, closeReferenceDrawer);
    _refDrawer = { drawer: back, home: home, release: release };
    close.addEventListener('click', closeReferenceDrawer);
    close.focus();
  }
  function closeReferenceDrawer() {
    if (!_refDrawer) return;
    const panel = document.getElementById('syntax-panel');
    const h = _refDrawer.home;
    if (panel) {
      panel.style.display = ''; panel.style.width = ''; panel.style.flex = '';
      if (h.parent) h.parent.insertBefore(panel, h.next && h.next.parentNode === h.parent ? h.next : null);
    }
    const d = _refDrawer;
    _refDrawer = null;
    if (d.drawer.parentNode) d.drawer.parentNode.removeChild(d.drawer);
    if (d.release) d.release();
  }
  // カテゴリ（名前）を開き、その中の type のブロックまでブロック一覧を送って、しばらく光らせる
  function showBlockInToolbox(catName, type, byKey) {
    const tb = workspace.getToolbox && workspace.getToolbox();
    if (!tb) return;
    const it = tb.getToolboxItems().find(function(x) { return x.getName && x.getName() === catName; });
    if (!it) return;
    // すでに選ばれているカテゴリへ setSelectedItem すると、開閉が切り替わって一覧が閉じてしまう（r5 02 R5-01）。
    // 選ばれていれば開いたまま（閉じていたら一度外してから選び直す）
    if (tb.getSelectedItem && tb.getSelectedItem() === it) {
      const fl0 = tb.getFlyout && tb.getFlyout();
      if (!(fl0 && fl0.isVisible && fl0.isVisible())) { tb.clearSelection(); tb.setSelectedItem(it); }
    } else {
      tb.setSelectedItem(it);
    }
    if (byKey) {
      try {
        if (Blockly.getFocusManager && it.getFocusableElement) Blockly.getFocusManager().focusNode(it);
        else if (it.getDiv) it.getDiv().focus();
      } catch (e) { /* noop */ }
    }
    if (!type) return;
    setTimeout(function() {
      const fl = tb.getFlyout && tb.getFlyout();
      const fws = fl && fl.getWorkspace && fl.getWorkspace();
      if (!fws) return;
      const blk = fws.getTopBlocks(false).find(function(b) { return b.type === type; });
      if (!blk) return;
      try {
        // 見えていなければ、そのブロックが一覧の上の方に来るまで送る
        const xy = blk.getRelativeToSurfaceXY();
        const m = fws.getMetrics();
        const y = xy.y * fws.scale - 16;
        if (y < m.viewTop || y + blk.getHeightWidth().height * fws.scale > m.viewTop + m.viewHeight) {
          fws.scrollbar && fws.scrollbar.set(m.viewLeft - m.scrollLeft, Math.max(0, y - m.scrollTop));
        }
      } catch (e) { /* 送れなくても光らせる */ }
      const root = blk.getSvgRoot && blk.getSvgRoot();
      if (!root) return;
      root.classList.remove('pyco-ref-flash');
      void root.getBoundingClientRect();
      root.classList.add('pyco-ref-flash');
      setTimeout(function() { root.classList.remove('pyco-ref-flash'); }, 2600);
    }, 120);
  }

  const btnCodingMode = document.getElementById('btn-coding-mode');
  // コード編集に入ったときのコード（＝ブロックから作ったもの）。ブロックへ戻るときに
  // これと違えば、手で書いた分が上書きで消えるので先に聞く。
  let _codeAtCodingStart = null;
  btnCodingMode.addEventListener('click', async function(ev) {
    // 学習モード（tutorial.js）がボタンを click() で切り替えるときは聞かない（isTrusted が false）
    if (ev && ev.isTrusted && codingMode && !fileMode && _codeAtCodingStart !== null && editor.getValue() !== _codeAtCodingStart) {
      const ans = await askChoice('ブロックにもどります',
        '書いたコードは、ブロックにもどると消えます（ブロックから作ったコードに置きかわります）。\n' +
        '残したいときは「.py に保存してもどる」を選んでください。',
        [{ label: '.py に保存してもどる', value: 'save', primary: true },
         { label: '消してもどる', value: 'discard' },
         { label: 'やめる（コード編集を続ける）', value: null }]);
      if (!ans) return;
      if (ans === 'save') document.getElementById('btn-download').click();
    }
    closeReferenceDrawer();
    // 右クリックメニュー・ドロップダウンを出したままだと、コード欄の上に残る
    try { Blockly.hideChaff(); } catch (e) { /* noop */ }
    codingMode = !codingMode;
    _codeAtCodingStart = codingMode ? editor.getValue() : null;
    // main.py はブロックモード時 readonly、サブファイルは常に編集可
    editor.setOption('readOnly', activeFileIdx === 0 ? !codingMode : false);
    btnCodingMode.textContent = codingMode ? 'ブロック' : 'コード編集';
    const kbdHint = document.getElementById('code-kbd-hint');
    if (kbdHint) kbdHint.style.display = codingMode ? '' : 'none';
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
  //   ルートに mode を書いておく。別のモードで開いたときに、どのモード用か分かるようにするため
  //   （Blockly はルートの属性を読まないので、読込側の互換は崩れない）。
  document.getElementById('btn-save-xml').addEventListener('click', function() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    xml.setAttribute('mode', modeKey());
    const text = Blockly.Xml.domToText(xml);
    const blob = new Blob([text], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    // 「blocks.xml」ばかりが並ぶとどれが何か分からないので、モードと日時を名前に入れる
    const d = new Date();
    const z = function(n) { return String(n).padStart(2, '0'); };
    a.download = 'pycoblocks_' + modeKey() + '_' + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) +
      '-' + z(d.getHours()) + z(d.getMinutes()) + '.xml';
    a.click();
  });

  // ===== ブロック XML 読込 =====
  // XML がどのモード用かを決める。mode 属性があればそれ、無ければ（以前に保存したファイル・サンプル）
  // ブロックの種類が各モードのツールボックスにどれだけ入っているかで推し量る。
  const MODE_TOOLBOXES = {
    python: ['toolbox-python', 'toolbox-module'],
    game: ['toolbox-game', 'toolbox-game-module'],
    micropython: ['toolbox-micropython'],
    microbit: ['toolbox-microbit'],
  };
  function guessXmlMode(dom) {
    const m = dom.getAttribute && dom.getAttribute('mode');
    if (m && MODE_TOOLBOXES[m]) return m;
    const types = new Set();
    dom.querySelectorAll('block, shadow').forEach(function(b) { if (b.getAttribute('type')) types.add(b.getAttribute('type')); });
    if (types.size === 0) return modeKey();
    const missing = {};
    Object.keys(MODE_TOOLBOXES).forEach(function(k) {
      const have = new Set();
      MODE_TOOLBOXES[k].forEach(function(id) {
        const tb = document.getElementById(id);
        if (tb) tb.querySelectorAll('block, shadow').forEach(function(b) { have.add(b.getAttribute('type')); });
      });
      // 機器・ゲーム専用のブロック（pico_ / pvb_ / mb_ / game_）が無いのは決定的なので重くする。
      // サンプルには print や f 文字列のような共通ブロックもあり、それだけで数えると取り違える
      let n = 0;
      types.forEach(function(t) { if (!have.has(t)) n += /^(pico_|pvb_|mb_|game_)/.test(t) ? 10 : 1; });
      missing[k] = n;
    });
    // 今のモードで足りていれば今のモードのまま（変数ブロックなどツールボックスに無い型もあるので 0 に限らない）
    let best = modeKey();
    Object.keys(missing).forEach(function(k) { if (missing[k] < missing[best]) best = k; });
    return best;
  }

  // ブロック XML の文字列を作業域へ読み込む。ファイル読込とサンプル一覧の両方から使う。
  //   ・別モード用なら、切り替えるかを先に聞く（Pico 用を micro:bit で開くと実行時に NameError になる）
  //   ・今のブロックがあれば、黙って消さずに「置きかえる／足す／やめる」を聞く
  //   label：確認の文に出す名前（サンプルは一覧と同じ題名。無ければファイル名）
  async function loadBlocksXmlText(text, name, label) {
    label = label || name;
    let dom;
    try {
      dom = Blockly.utils.xml.textToDom(text);
    } catch (err) {
      alert('XML の読み込みに失敗しました: ' + err.message);
      return false;
    }
    const target = guessXmlMode(dom);
    if (target !== modeKey()) {
      const ans = await askChoice(MODE_LABELS[target] + ' 用のファイルです',
        '「' + label + '」は ' + MODE_LABELS[target] + ' 用のブロックです。今は ' + MODE_LABELS[modeKey()] + ' モードです。\n' +
        'このまま開くと、使えないブロックが混ざって実行でエラーになります。',
        [{ label: MODE_LABELS[target] + ' モードに切り替えて開く', value: 'switch', primary: true },
         { label: 'このまま開く', value: 'keep' },
         { label: 'やめる', value: null }]);
      if (!ans) return false;
      if (ans === 'switch') switchMode(target, true);
    }
    let add = false;
    // micro:bit の最初から置いてある 2 つだけなら、聞かずに置きかえる（消えて困るものが無い）
    if (workspace.getAllBlocks(false).length > 0 && !isStarterOnly()) {
      // 消える方（置きかえる）を主ボタン・Enter の既定にしない。うっかり Enter で作品が消えるため
      const ans = await askChoice('ブロックを読み込みます',
        '今のブロックがあります。「' + label + '」をどう読み込みますか？\n' +
        '（置きかえると今のブロックは消えます。残したいときは先に［ファイル］→［ブロックを保存］）',
        [{ label: '置きかえる', value: 'replace' },
         { label: '今のブロックに足す', value: 'add' },
         { label: 'やめる', value: null, focus: true }]);
      if (!ans) return false;
      add = ans === 'add';
    }
    try {
      const rootName = (dom.tagName || dom.localName || '').toLowerCase();
      if (!add) { stopRunningSim(); clearSimBoardAfterStop(); workspace.clear(); clearShellForNewProgram(); }
      if (rootName === 'project' && !add) _loadProjectXml(dom);
      else Blockly.Xml.domToWorkspace(dom, workspace);
      window.__PCO_LAST_XML_SRC = name;
      generateCode();
      // 置きかえたときは読み込んだブロックが見える位置へ（足したときは今の見え方を変えない）
      if (!add) fitAfterLoad();
      return true;
    } catch (err) {
      alert('XML の読み込みに失敗しました: ' + err.message);
      return false;
    }
  }

  // ===== サンプルを開く =====
  //   samples/ にある記事の例・答えを、今のモードの分だけ章ごとに並べて 1 クリックで開く。
  //   一覧は tools/build_samples_index.py が作る samples/index.json（静的サイトはフォルダを一覧できないため）。
  //   開くときは loadBlocksXmlText を通すので、今のブロックがあれば先に聞く。
  let _samplesIndex = null;
  function openSamples() {
    const p = _samplesIndex ? Promise.resolve(_samplesIndex)
      : fetch('samples/index.json').then(function(r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); });
    p.then(function(idx) { _samplesIndex = idx; buildSamplesModal(idx); })
      .catch(function(err) {
        console.warn('PycoBlocks: サンプル一覧を読み込めません:', err);
        showToast('サンプル一覧を読み込めませんでした（ファイルを直接開いているときは使えません）。', { type: 'err' });
      });
  }
  function buildSamplesModal(idx) {
    const key = modeKey();
    const groups = (idx.modes && idx.modes[key]) || [];
    const back = document.createElement('div');
    back.style.cssText = 'position:fixed;inset:0;z-index:9300;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;';
    const box = document.createElement('div');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'サンプルを開く');
    box.style.cssText = 'background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-glow);border-radius:10px;' +
      'width:min(720px,96vw);max-height:86vh;display:flex;flex-direction:column;font-size:15px;line-height:1.5;';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border-dim);';
    head.innerHTML = '<b style="font-size:16px;flex:1"></b>';
    head.firstChild.textContent = 'サンプルを開く（' + MODE_LABELS[key] + '）';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '閉じる';
    closeBtn.style.cssText = 'min-height:34px;padding:4px 12px;border-radius:6px;cursor:pointer;background:transparent;color:var(--text-primary);border:1px solid var(--text-dim);font-size:14px;';
    head.appendChild(closeBtn);
    const body = document.createElement('div');
    body.style.cssText = 'overflow:auto;padding:8px 16px 16px;';
    if (!groups.length) {
      const p = document.createElement('p');
      p.textContent = MODE_LABELS[key] + ' のサンプルは準備中です。ほかのモードのサンプルは、上のモードを切り替えてから開いてください。';
      body.appendChild(p);
    }
    groups.forEach(function(g, gi) {
      // 章が多いので <details> でたたむ。最初の章だけ開いておく
      const d = document.createElement('details');
      if (gi === 0) d.open = true;
      d.style.cssText = 'border-bottom:1px solid var(--border-dim);padding:4px 0;';
      const sm = document.createElement('summary');
      sm.textContent = g.title + '（' + g.items.length + '）';
      sm.style.cssText = 'cursor:pointer;padding:6px 0;font-weight:bold;';
      d.appendChild(sm);
      const list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 8px 12px;';
      g.items.forEach(function(it) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = it.title;
        b.title = it.file;
        b.style.cssText = 'min-height:34px;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:14px;' +
          'background:var(--bg-panel);color:var(--text-primary);border:1px solid var(--border-dim);text-align:left;';
        // ひとこと説明（micro:bit のサンプル）があれば題名の下に出す。名前だけでは何ができるか分からないため
        if (it.desc) {
          b.style.flex = '1 1 100%';
          b.style.padding = '6px 12px';
          const dsc = document.createElement('span');
          dsc.textContent = it.desc;
          dsc.style.cssText = 'display:block;font-size:13px;color:var(--text-dim);font-weight:normal;margin-top:2px;';
          b.textContent = '';
          const tt = document.createElement('b');
          tt.textContent = it.title;
          b.appendChild(tt); b.appendChild(dsc);
        }
        b.addEventListener('click', function() {
          close();
          fetch(it.file).then(function(r) { return r.ok ? r.text() : Promise.reject('HTTP ' + r.status); })
            .then(function(text) {
              const name = it.file.split('/').pop();
              return loadBlocksXmlText(text, name, it.title);
            })
            .catch(function(err) { showToast('サンプルを開けませんでした：' + err, { type: 'err' }); });
        });
        list.appendChild(b);
      });
      d.appendChild(list);
      body.appendChild(d);
    });
    box.appendChild(head); box.appendChild(body);
    back.appendChild(box);
    let release = null;
    function close() {
      if (back.parentNode) back.parentNode.removeChild(back);
      if (release) { release(); release = null; }
    }
    closeBtn.addEventListener('click', close);
    back.addEventListener('click', function(e) { if (e.target === back) close(); });
    document.body.appendChild(back);
    release = holdModal(back, box, close);
    closeBtn.focus();
  }
  const btnSamples = document.getElementById('btn-samples');
  if (btnSamples) btnSamples.addEventListener('click', openSamples);
  // 学習モードの一覧（js/tutorial.js）からも開けるように公開する
  window.PycoSamples = { open: openSamples };
  window.PycoSwitchMode = function(m) { switchMode(m, true); };

  document.getElementById('btn-load-xml').addEventListener('click', function() {
    document.getElementById('xml-input').click();
  });

  document.getElementById('xml-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) { loadBlocksXmlText(ev.target.result, file.name); };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ===== ブロック共有URL =====
  //   ワークスペースのXMLを pako(deflateRaw) で圧縮し Base64URL にして
  //   URLのハッシュに載せる。サーバ不要・1リンクで丸ごと復元できる。
  //   前処理は座標(x/y)の除去のみ。id は残す（変数の再リンク崩れを防ぐため）。
  //
  //   URL形式（版を分けて後方互換を保つ）:
  //     #m=<mode>&x1=...  編集モード + 辞書v1付き deflate（現行・最短）
  //     #x1=...           辞書v1付き deflate（mode省略時は読込側でpython既定）
  //     #xml=...          無辞書 deflate（旧形式・読み込みのみ対応）
  //   m は python/game/micropython。読込側はブロック展開前にこのモードへ切替える。
  //   辞書(js/share_dict.js)はアプリ同梱でURLには載らないため、語彙ぶんURLが短くなる。
  var _SHARE_DICT_V1 = (typeof window !== 'undefined' && window.PCO_SHARE_DICT_V1)
    ? new TextEncoder().encode(window.PCO_SHARE_DICT_V1) : null;

  function _bytesToBase64Url(bytes) {
    var bin = '';
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function _base64UrlToBytes(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var bin = atob(str);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  // 共有URL用に座標を落とした XML 文字列を作る
  function _workspaceToShareXmlText() {
    var dom = Blockly.Xml.workspaceToDom(workspace);
    var blocks = dom.querySelectorAll('block');
    for (var i = 0; i < blocks.length; i++) {
      blocks[i].removeAttribute('x');
      blocks[i].removeAttribute('y');
    }
    return Blockly.Xml.domToText(dom);
  }

  // 共有URLモーダルを開いてURLを表示する
  var _shareCurrentUrl = '';
  function _openShareModal(url) {
    var modal = document.getElementById('share-modal');
    var ta    = document.getElementById('share-url-text');
    var msg   = document.getElementById('share-copy-msg');
    var lenEl = document.getElementById('share-url-len');
    var nativeBtn = document.getElementById('share-native');
    if (!modal || !ta) { window.prompt('このURLをコピーしてください:', url); return; }
    _shareCurrentUrl = url;
    ta.value = url;
    if (msg) msg.textContent = '';
    if (lenEl) lenEl.textContent = url.length + ' 文字';
    // ネイティブ共有(Web Share API)が使える端末でのみ「SNSで共有」を出す
    if (nativeBtn) nativeBtn.style.display = (typeof navigator.share === 'function') ? '' : 'none';
    // モバイルではツールメニュー(ドロワー)を閉じてからモーダルを最前面に出す
    document.body.classList.remove('menu-open');
    modal.style.display = 'flex';
    // PCでは全選択して即 Ctrl+C 可能に。モバイルは自動フォーカスでキーボードが
    // URLを隠すのを避け、「コピー」ボタン操作に委ねる
    if (!document.body.classList.contains('mobile-mode')) {
      requestAnimationFrame(function() { ta.focus(); ta.select(); });
    }
  }
  function _closeShareModal() {
    var modal = document.getElementById('share-modal');
    if (modal) modal.style.display = 'none';
  }

  var btnShareUrl = document.getElementById('btn-share-url');
  if (btnShareUrl) {
    btnShareUrl.addEventListener('click', function() {
      if (typeof pako === 'undefined') {
        alert('圧縮ライブラリ(pako)を読み込めませんでした。通信環境を確認してください。');
        return;
      }
      var topBlocks = workspace.getTopBlocks(false);
      if (topBlocks.length === 0) {
        alert('共有するブロックがありません。先にブロックを並べてください。');
        return;
      }
      var xmlText = _workspaceToShareXmlText();
      var rawBytes = new TextEncoder().encode(xmlText);
      // 辞書v1が使えれば辞書付きで圧縮（#x1=）。無ければ無辞書（#xml=）にフォールバック
      var bytes, key;
      if (_SHARE_DICT_V1) {
        bytes = pako.deflateRaw(rawBytes, { level: 9, dictionary: _SHARE_DICT_V1 });
        key = 'x1=';
      } else {
        bytes = pako.deflateRaw(rawBytes, { level: 9 });
        key = 'xml=';
      }
      var encoded = _bytesToBase64Url(bytes);
      // 開く相手が別モードでも自動で合わせられるよう、編集モードもハッシュに含める
      var url = location.origin + location.pathname + '#m=' + modeKey() + '&' + key + encoded;

      // URLが長すぎる場合は共有を止め、サーバ設置(?src=)を案内する
      if (url.length > 8000) {
        alert('作品が大きすぎて共有URLに収まりません（' + url.length + '文字）。\n'
            + '「ブロック保存」でXMLを書き出し、サーバに置いて ?src= で読み込む方法をご検討ください。');
        return;
      }
      _openShareModal(url);
    });
  }

  // 共有モーダルの操作（コピー / 閉じる / 背景クリックで閉じる）
  var shareCopyBtn = document.getElementById('share-copy');
  if (shareCopyBtn) {
    shareCopyBtn.addEventListener('click', function() {
      var ta  = document.getElementById('share-url-text');
      var msg = document.getElementById('share-copy-msg');
      if (!ta) return;
      ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value);
        ok = true;
      }
      if (msg) msg.textContent = ok ? 'コピーしました ✓' : '↑ 枠内を選んで手動でコピーしてください';
    });
  }
  // SNSで共有（Web Share API）: OSのネイティブ共有シートを開く
  var shareNativeBtn = document.getElementById('share-native');
  if (shareNativeBtn) {
    shareNativeBtn.addEventListener('click', function() {
      if (typeof navigator.share !== 'function' || !_shareCurrentUrl) return;
      navigator.share({
        title: 'PycoBlocks のブロック',
        text: 'PycoBlocks で作ったブロックを共有します',
        url: _shareCurrentUrl
      }).catch(function() { /* ユーザーがキャンセルした場合など。無視 */ });
    });
  }
  var shareCloseBtn = document.getElementById('share-close');
  if (shareCloseBtn) shareCloseBtn.addEventListener('click', _closeShareModal);
  var shareModalEl = document.getElementById('share-modal');
  if (shareModalEl) {
    shareModalEl.addEventListener('click', function(e) {
      if (e.target === shareModalEl) _closeShareModal();
    });
  }

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
  const btnConnect   = document.getElementById('btn-connect');
  const btnReconnect = document.getElementById('btn-reconnect');
  const btnWrite     = document.getElementById('btn-write');
  const statusEl     = document.getElementById('serial-status');

  function setSerialStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.title = '';
    statusEl.className = 'serial-status' + (type ? ' serial-status--' + type : '');
  }

  // ===== シリアルモニター =====
  const monitorOutput  = document.getElementById('monitor-output');
  const btnMonitorClear = document.getElementById('btn-monitor-clear');

  function appendMonitor(text) {
    if (window.PycoPlot) PycoPlot.feed(text);
    monitorOutput.textContent += text;
    monitorOutput.scrollTop = monitorOutput.scrollHeight;
  }

  btnMonitorClear.addEventListener('click', function() {
    monitorOutput.textContent = '';
    if (window.PycoPlot) PycoPlot.reset();
  });
  if (window.PycoPlot) PycoPlot.mount(document.getElementById('monitor-panel'), monitorOutput, document.getElementById('btn-plot'));

  function updateSerialUI() {
    const connected = PicoSerial.isConnected();
    btnConnect.textContent = connected ? '切断' : '接続';
    btnConnect.classList.toggle('connected', connected);
    btnReconnect.disabled = false;   // 抜き差し後の復帰に使うため常に押せる
    btnWrite.disabled = !connected;
    // micro:bit はつないでいなくてもシミュレータで動かせる。押せない灰色の「実行」を置くと
    // 「動かない」と思われるので、未接続ならツールバーの実行・停止をシミュレータにつなぐ（MakeCode と同じ）。
    // 停止は何を止めるのかを言葉で示し、シミュレータ用の停止ボタンを別に増やさない。
    const mb = currentMode === 'micropython' && currentBoard === 'microbit';
    const board = mb ? 'micro:bit' : 'Pico';
    const runBtn = document.getElementById('btn-run');
    const stopBtn = document.getElementById('btn-stop');
    runBtn.disabled = (!connected && !mb) || (mb && !connected && _simRunning);
    stopBtn.disabled = !connected && !(mb && _simRunning);
    runBtn.textContent = (mb && !connected) ? '▶ 実行（シミュレータ）' : '▶ 実行';
    stopBtn.textContent = mb ? (connected ? '■ micro:bit を止める' : '■ シミュレータを止める') : '■ 停止';
    runBtn.title = connected ? board + ' でプログラムを動かします（Ctrl+Enter）'
      : mb ? 'つないでいないので、シミュレータで動かします（Ctrl+Enter）'
      : '先に［接続］で Pico をつなぐと押せます';
    stopBtn.title = connected ? board + ' で動いているプログラムを止めます'
      : mb ? 'シミュレータで動いているプログラムを止めます'
      : '先に［接続］で Pico をつなぐと押せます';
    btnWrite.title = !connected ? '先に［接続］で ' + board + ' をつなぐと押せます'
      : mb ? 'プログラムを micro:bit に main.py として保存します（電池だけでも動くようになります）'
      : 'プログラムを Pico に main.py として保存します（USB を抜いても動くようになります）';
    // 接続時は自動でモニター開始、切断時は停止
    if (connected && !PicoSerial.isMonitoring()) {
      PicoSerial.startMonitor(appendMonitor);
    } else if (!connected) {
      PicoSerial.stopMonitor();
    }
  }

  // ===== MicroPython 導入ウィザード =====
  const btnFirmware = document.getElementById('btn-firmware');

  if (typeof PicoFirmware !== 'undefined') {
    PicoFirmware.init({
      serial: PicoSerial,
      // ウィザード側で接続・切断したときにツールバーの状態を合わせる
      onSerialChange: () => updateSerialUI(),
    });
    if (btnFirmware) {
      btnFirmware.addEventListener('click', () => {
        hintFirmware(false);
        PicoFirmware.open();
      });
    }
  }

  // Pico が見つからないときに「MicroPython導入」へ目を向けさせる
  function hintFirmware(on) {
    if (btnFirmware) btnFirmware.classList.toggle('fw-hint', !!on);
  }

  // 接続失敗を「何が起きたか＋次にすること」の日本語にする。
  //   以前は e.message に "Failed" が入っていればすべて「Thonny が使用中」としていたが、
  //   一覧で何も選ばずに閉じたとき（NotFoundError）まで Thonny のせいにしていて、子どもには通じなかった。
  //   Web Serial の例外は name で見分ける（message はブラウザの言語・版で変わる）。
  function friendlyConnectError(e) {
    const board = currentBoard === 'microbit' ? 'micro:bit' : 'Pico';
    const name = (e && e.name) || '';
    const msg = (e && e.message) || String(e);
    if (name === 'NotFoundError' || /No port selected|cancel/i.test(msg)) {
      return { text: board + ' が選ばれませんでした。USB をさし直して、もう一度［接続］。はじめての ' + board + ' は［MicroPython導入］から。', fw: true };
    }
    if (name === 'InvalidStateError' || /already open/i.test(msg)) {
      return { text: board + ' はもうつながっています。［切断］してから、もう一度［接続］。', fw: false };
    }
    if (name === 'NetworkError' || /Failed to open/i.test(msg)) {
      return { text: board + ' を開けませんでした。Thonny や別のタブを閉じ、USB をさし直して、もう一度［接続］。', fw: false };
    }
    if (name === 'SecurityError') {
      return { text: 'このページではシリアル接続が許可されていません。Chrome か Edge で開き直してください。', fw: false };
    }
    return { text: board + ' につなげませんでした（' + msg + '）。USB をさし直して、もう一度［接続］。', fw: true };
  }

  // 失敗はステータス欄の小さな字だけでは気づかれないので、ツールバーの下にも大きく出す
  function reportConnectError(head, e) {
    const f = friendlyConnectError(e);
    // 長い説明は上の知らせに出す。ここにも同じ文を出すと 2 か所に赤字が並ぶので、短い 1 行だけ残す
    // （知らせを閉じた後も、乗せれば全文が読めるよう title に入れる）
    setSerialStatus(head, 'err');
    statusEl.title = f.text;
    showToast('つなげませんでした：' + f.text, {
      type: 'err',
      action: (f.fw && btnFirmware) ? { label: 'MicroPython導入を開く', onClick: function() { btnFirmware.click(); } } : null,
    });
    hintFirmware(f.fw);
  }

  // 「再接続」は一度つないで許可したポートがあるときだけ意味がある。
  // 一度もつないでいないのに押せると「接続」との違いが分からないので、その間は隠す。
  //   許可済みのポートは USB のベンダー ID で今のボードの分だけ数える（Pico の許可が残っていると、
  //   一度もつないでいない micro:bit モードでも「再接続」が出ていた）。ID が分からないポートは数える。
  const BOARD_VID = { pico: 0x2E8A, microbit: 0x0D28 };
  let _knownVids = [];
  function refreshKnownPorts() {
    if (!(hasSerial && navigator.serial.getPorts)) return;
    navigator.serial.getPorts().then(function(ports) {
      _knownVids = ports.map(function(pt) { try { return (pt.getInfo() || {}).usbVendorId; } catch (e) { return undefined; } });
      updateReconnectVisibility();
    }).catch(function() {});
  }
  refreshKnownPorts();
  function updateReconnectVisibility() {
    if (!btnReconnect) return;
    const vid = BOARD_VID[currentBoard];
    const known = _knownVids.some(function(v) { return v === undefined || v === vid; });
    btnReconnect.style.display = (currentMode === 'micropython' && hasSerial && known) ? '' : 'none';
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
      hintFirmware(false);
      refreshKnownPorts();
      updateSerialUI();
    } catch (e) {
      // 一覧に Pico が出てこない原因の多くは MicroPython 未導入。
      // 失敗をそこで終わらせず、導入ウィザードへ誘導する。
      reportConnectError('接続失敗', e);
      updateSerialUI();
    }
  });

  // 再接続：Pico を抜き差ししたあと、ポート選択ダイアログ無しで接続し直す
  btnReconnect.addEventListener('click', async function() {
    btnReconnect.disabled = true;
    setSerialStatus('再接続中...', 'progress');
    try {
      await PicoSerial.reconnect();
      setSerialStatus('再接続しました', 'ok');
    } catch (e) {
      reportConnectError('再接続失敗', e);
    } finally {
      updateSerialUI();
    }
  });

  document.getElementById('btn-run').addEventListener('click', async function() {
    if (warnEmptyInput()) return;
    // micro:bit を未接続で押したらシミュレータで動かす（updateSerialUI の説明を参照）
    if (!PicoSerial.isConnected()) {
      if (currentBoard === 'microbit') {
        if (window.PycoMicrobitSim && PycoMicrobitSim.unlockAudio) PycoMicrobitSim.unlockAudio();
        runPython();
      }
      return;
    }
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
    if (!PicoSerial.isConnected()) { _pyStopRequested = true; return; }
    try {
      await PicoSerial.stopCode();
      setSerialStatus('■ 停止しました', 'dim');
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
      setSerialStatus('書き込み完了', 'ok');
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
  // mode は 'python' / 'game' / 'micropython'（Pico）/ 'microbit'
  function applyMode(mode, clearWorkspace) {
    if (mode === 'microbit') { currentBoard = 'microbit'; mode = 'micropython'; }
    else if (mode === 'micropython') currentBoard = 'pico';
    currentMode = mode;
    if (clearWorkspace) workspace.clear();

    // モードボタン
    document.getElementById('btn-mode-python').classList.toggle('mode-btn--active', mode === 'python');
    document.getElementById('btn-mode-game').classList.toggle('mode-btn--active', mode === 'game');
    document.getElementById('btn-mode-micropython').classList.toggle('mode-btn--active', mode === 'micropython' && currentBoard === 'pico');
    document.getElementById('btn-mode-microbit').classList.toggle('mode-btn--active', mode === 'micropython' && currentBoard === 'microbit');

    // ツールボックス切り替え（サブファイルなら module 用ツールボックスを優先）
    let toolboxId = 'toolbox-' + mode;
    if (activeFileIdx !== 0) {
      if (mode === 'python') toolboxId = 'toolbox-module';
      else if (mode === 'game') toolboxId = 'toolbox-game-module';
    }
    if (mode === 'micropython' && currentBoard === 'microbit') toolboxId = 'toolbox-microbit';
    workspace.updateToolbox(document.getElementById(toolboxId));

    // ラベル更新
    document.getElementById('title-sub').textContent =
      mode === 'python' ? 'Python 入門'
      : mode === 'game' ? 'ゲーム'
      : currentBoard === 'microbit' ? 'micro:bit / MicroPython'
      : 'Raspberry Pi Pico / MicroPython';
    document.getElementById('code-header-title').textContent =
      mode === 'python' ? 'Python のコード'
      : mode === 'game' ? 'ゲームの Python コード'
      : 'MicroPython のコード';

    // シリアル関連ボタン（MicroPython && Web Serial対応のみ表示）
    const showSerial = mode === 'micropython' && hasSerial;
    ['btn-connect', 'btn-run', 'btn-stop', 'btn-write'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = showSerial ? '' : 'none';
    });
    updateReconnectVisibility();
    // ボタンの説明（title）をボードに合わせる。micro:bit でも「Pico に…」と出ていたため
    const isMb = currentBoard === 'microbit';
    const boardTitles = {
      'btn-firmware': isMb ? 'micro:bit に MicroPython（.hex）を入れる（はじめて使うとき・入れ直すとき）'
                           : 'Pico に MicroPython を入れる（はじめて使うとき・入れ直すとき）',
      'btn-connect': isMb ? 'USB でつないだ micro:bit を選んで接続します' : 'USB でつないだ Pico を選んで接続します',
      'btn-reconnect': isMb ? 'micro:bit を抜き差ししたあと、ポート選択なしで接続し直します'
                            : 'Pico を抜き差ししたあと、ポート選択なしで接続し直します',
    };
    Object.keys(boardTitles).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.title = boardTitles[id];
    });

    // MicroPython 導入ウィザードは Web Serial 非対応のブラウザでも役に立つ
    // （UF2 を配って手で書き込む道が残る）ので、モードだけで出し分ける。
    ['serial-sep', 'btn-firmware'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (mode === 'micropython') ? '' : 'none';
    });

    // DEMOバッジ（MicroPythonモードでWeb Serial非対応のみ表示）
    const demoBadge = document.getElementById('demo-badge');
    if (demoBadge) demoBadge.style.display = (mode === 'micropython' && !hasSerial) ? '' : 'none';

    // 配線図ボタン（MicroPythonモード・Pico のみ表示）
    const showCircuit = mode === 'micropython' && currentBoard === 'pico';
    ['circuit-sep', 'btn-circuit'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = showCircuit ? '' : 'none';
    });

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
    const circuitPreview = document.getElementById('circuit-preview-area');

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

    // ゲームモード / MicroPython モードは 2x2 レイアウトに切替
    // (game: 左下=ゲーム画面 / micropython: 左下=配線図プレビュー)
    const use2x2 = (mode === 'game' || mode === 'micropython');
    if (use2x2) {
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
      // 左下: モードに応じて配線図プレビュー or ゲーム画面
      if (mode === 'game' && gameArea && leftBottomAnchor && gameArea.parentElement !== leftCol) {
        leftBottomAnchor.insertAdjacentElement('afterend', gameArea);
      }
      if (mode === 'micropython' && circuitPreview && leftBottomAnchor && circuitPreview.parentElement !== leftCol) {
        leftBottomAnchor.insertAdjacentElement('afterend', circuitPreview);
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
    // 配線図は Pico の部品データで描くので、micro:bit では出さない
    // micro:bit では同じ場所にシミュレータを出す（中身の切り替えは CSS の .mode-microbit）
    if (circuitPreview) circuitPreview.style.display = mode === 'micropython' ? '' : 'none';
    // モード判別用クラス（CSS 側の !important 上書きを mode 別にするため）
    if (mainEl) mainEl.classList.toggle('mode-micropython', mode === 'micropython');
    if (mainEl) mainEl.classList.toggle('mode-microbit', mode === 'micropython' && currentBoard === 'microbit');
    const btnSensor = document.getElementById('btn-sensor-monitor');
    if (btnSensor) btnSensor.style.display = (mode === 'micropython' && currentBoard === 'microbit') ? '' : 'none';
    // MicroPython 以外に切り替えたら配線図モーダルを閉じる
    if (mode !== 'micropython') {
      const cmodal = document.getElementById('circuit-modal');
      if (window.__pycoCircuitClose) window.__pycoCircuitClose();
      else if (cmodal) cmodal.style.display = 'none';
    }
    if (gameHandle) gameHandle.style.display = 'none';
    if (monHdr)   monHdr.style.display   = '';
    if (monOut)   monOut.style.display   = '';
    if (monHandle) monHandle.style.display = '';
    if (shellDock) shellDock.style.display = 'none';
    if (dockHandle) dockHandle.style.display = 'none';

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
    syncModeUrl(false);
    if (showSerial) updateSerialUI();

  }

  // モードボタンのイベント
  //   モードごとに自動保存のキーが分かれている（pyco-autosave-python / -micropython …）。
  //   以前は切り替えると作業域を空にするだけだったので、戻ってきても空のままで、
  //   そこへ 1 つ置いた瞬間に残っていた保存が上書きされて作品が消えていた。
  //   いまは「出る前に保存 → 入ったらそのモードの保存を戻す」を必ず組で行う。
  const MODE_LABELS = { python: 'Python 入門', game: 'ゲーム', micropython: 'Pi Pico', microbit: 'micro:bit' };

  // micro:bit の作業域が空のときの最初の形（MakeCode と同じく「最初だけ」と「ずっと」を置く）
  const MB_STARTER_XML = '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="mb_on_start" x="30" y="30"></block>' +
    '<block type="mb_forever" x="30" y="150"></block></xml>';
  function placeMicrobitStarter() {
    if (modeKey() !== 'microbit' || workspace.getAllBlocks(false).length > 0) return;
    // 置いた 2 つを「元に戻す」の履歴に入れない。入れると、子どもが最初に押す「↶ もどす」で
    // ひな形が消えてしまう（MakeCode も新しいプロジェクトの直後は戻せない）。
    // Blockly の履歴は非同期に積まれるので、あとから clearUndo() するのでは間に合わない
    const rec = Blockly.Events.getRecordUndo();
    Blockly.Events.setRecordUndo(false);
    try {
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(MB_STARTER_XML), workspace);
      generateCode();
    } catch (e) { console.warn('PycoBlocks: micro:bit の初期ブロックを置けませんでした:', e); }
    finally { Blockly.Events.setRecordUndo(rec); }
  }
  // 作業域が「最初だけ」「ずっと」の空の 2 つだけか（＝まだ何も作っていない）。
  // そのときはモード切替やサンプル読込で「今のブロックが消えます」と聞かない。
  // 毎回 OK を押す練習になると、本当に大事な確認を読まなくなるため
  function isStarterOnly() {
    if (modeKey() !== 'microbit') return false;
    const all = workspace.getAllBlocks(false);
    if (all.length !== 2) return false;
    const types = all.map(function(b) { return b.type; }).sort().join(',');
    return types === 'mb_forever,mb_on_start';
  }

  // ?mode= を今のモードに合わせる。授業中にブラウザを再読込しても同じモードで開き直すため。
  //   dropSource=true（ボタンで切り替えたとき）は、共有 URL のハッシュ（#m=…&x1=…）と ?src= も消す。
  //   それらは前のモードの作品なので、残すと再読込で前のモードへ戻され、作品も差し替わる。
  function syncModeUrl(dropSource) {
    try {
      const url = new URL(window.location.href);
      const key = modeKey();
      if (key === 'python') url.searchParams.delete('mode');
      else url.searchParams.set('mode', key);
      if (dropSource) {
        url.searchParams.delete('src');
        if (/[#&](m|x1|xml)=/.test(url.hash)) url.hash = '';
      }
      if (url.href !== window.location.href) history.replaceState(history.state, '', url.href);
    } catch (e) { /* file:// など URL を書き換えられない環境では何もしない */ }
  }

  // モードのボタンから切り替えるとき。ブロックがあれば先に聞く（ほかのダイアログと同じ形。ブラウザ標準の confirm は使わない）
  async function requestModeSwitch(target) {
    if (modeKey() === target) return;
    const hasBlocks = workspace.getAllBlocks(false).length > 0 && !isStarterOnly();
    if (hasBlocks) {
      const ans = await askChoice(MODE_LABELS[target] + ' モードに切り替えます',
        '今のブロックは自動で保存されます。' + MODE_LABELS[modeKey()] + ' モードに戻ると元にもどります。',
        [{ label: '切り替える', value: 'go', primary: true },
         { label: 'やめる', value: null }]);
      if (!ans) return;
    }
    switchMode(target, true);
  }

  function switchMode(target, skipConfirm) {
    if (modeKey() === target) return;
    stopRunningSim();
    const AS = window.PycoAutosave;
    // 出る前に、今のモードのキーへ保存する（1秒待ちの保存を残さない）
    if (AS && AS.flush) AS.flush();
    // 作業域を空にする削除イベントで、空の作品が新しいモードへ保存されないようにする
    Blockly.Events.disable();
    try {
      applyMode(target, true);
      // 前のモードの別ファイル（自作モジュールのタブ）を持ち込まない
      pyFiles = [{ name: 'main.py', content: '', blockXml: null }];
      activeFileIdx = 0;
      const tabs = document.getElementById('file-tabs');
      if (tabs && tabs.style.display !== 'none') renderFileTabs();
    } finally {
      Blockly.Events.enable();
    }
    if (AS && AS.cancel) AS.cancel();
    // 右クリックメニューや、前のモード用の書き方の一覧を残さない
    try { Blockly.hideChaff(); } catch (e) { /* noop */ }
    closeReferenceDrawer();
    // 前のモード（ボード）の接続・再接続の結果や知らせを持ち込まない。
    // Pico の「再接続失敗: Pico を開けませんでした…」が micro:bit モードに残っていた
    if (typeof setSerialStatus === 'function') setSerialStatus('', '');
    hideToast();
    // 入ったモードの保存を戻す（無ければ空のまま。micro:bit は最初の 2 つを置く）
    let restored = false;
    const saved = AS && AS.load ? AS.load(target) : null;
    // 復元で置いたブロックも「元に戻す」の履歴に入れない（下の clearUndo は非同期に積まれる分に間に合わない）
    const rec = Blockly.Events.getRecordUndo();
    Blockly.Events.setRecordUndo(false);
    try {
      if (saved) {
        try { window.PycoWorkspaceIO.restore(saved); restored = true; }
        catch (e) { console.warn('PycoBlocks: 自動保存の復元に失敗:', e); }
      }
      if (!restored) placeMicrobitStarter();
    } finally { Blockly.Events.setRecordUndo(rec); }
    collapseCircuitForMobile();
    // 「元に戻す」で復元前の空の作業域へ戻れてしまわないよう、履歴はここから始める
    workspace.clearUndo();
    generateCode();
    syncModeUrl(true);
  }

  document.getElementById('btn-mode-python').addEventListener('click', function() { requestModeSwitch('python'); });
  document.getElementById('btn-mode-game').addEventListener('click', function() { requestModeSwitch('game'); });
  document.getElementById('btn-mode-micropython').addEventListener('click', function() { requestModeSwitch('micropython'); });
  document.getElementById('btn-mode-microbit').addEventListener('click', function() { requestModeSwitch('microbit'); });

  // ===== Python シェル実行（Skulpt） =====

  let _pyStopRequested = false;
  let _simRunning = false;   // micro:bit シミュレータ（Skulpt）が動いているか。ツールバーの停止を押せるかに使う
  let _sensorMonRunning = false;   // センサーモニター（実機・シミュレータ）が動いているか
  // いま動いている Skulpt の実行（1 回ごとの印）。シミュレータのセンサーモニターは、動いているプログラムを
  // 止めずに横で動くので、モニターだけを止められるように 1 回ごとに止める印（stop）を持つ（r4 03 R4-03）
  const _pyRuns = new Set();
  let _monitorRun = null;
  // サンプルを置きかえる・モードを切り替えるときは、動いているプログラム（シミュレータ・ゲーム）を先に止める。
  // 止めないと、ブロックは変わったのに前のプログラムが動き続けていた
  // 置きかえたときは、前の作品の LED（ハートなど）を盤面から消す。新しい作品が前の絵を出しているように見えたため。
  // 止める印を付けてから実際に止まるまで少しかかる（その間に 1 回描くことがある）ので、止まってから消す
  function clearSimBoardAfterStop() {
    if (!window.PycoMicrobitSim || currentBoard !== 'microbit') return;
    let tries = 0;
    (function wait() {
      if (_pyRuns.size && tries++ < 40) { setTimeout(wait, 50); return; }
      try { PycoMicrobitSim.reset(); } catch (e) { /* noop */ }
    })();
  }
  // 置きかえたときは、シェルに残った前のプログラムの出力・エラーを消す（新しいサンプルのエラーと見まちがえる・r5 02 R5-04）。
  // 実機（Pico・micro:bit）をつないでいるときのシェルは実機の出力なので消さない
  function clearShellForNewProgram() {
    const connected = currentMode === 'micropython' && typeof PicoSerial !== 'undefined' && PicoSerial.isConnected();
    if (connected) return;
    const monOut = document.getElementById('monitor-output');
    if (monOut) monOut.innerHTML = '';
  }
  function stopRunningSim() {
    if (!_simRunning) return;
    _pyStopRequested = true;
    window.__pygameRunning = false;
  }

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
    // やさしいAIモジュール（小中向け pyco_ai）
    if (window.PycoAi && window.PycoAi.source && x.includes('pyco_ai')) {
      return window.PycoAi.source;
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

  // キーボードで［▶ 実行］を押すと、実行中はボタンが disabled になってフォーカスが BODY へ落ちていた（r5 05 R5-02）。
  // 押せなくなったら停止ボタンへ移し、止まったら元の［▶ 実行］へ戻す
  let _runFocusFrom = null;
  function keepRunFocus(running, before) {
    const usable = function(el) { return el && el.offsetParent !== null && !el.disabled; };
    const lost = function() { const a = document.activeElement; return !a || a === document.body || !usable(a); };
    if (running) {
      if (!before || !/^btn-run(-python)?$/.test(before.id) || usable(before)) return;
      const to = ['btn-stop-python', 'btn-stop'].map(function(id) { return document.getElementById(id); }).find(usable);
      if (to) { _runFocusFrom = before; try { to.focus(); } catch (e) { /* noop */ } }
    } else if (_runFocusFrom) {
      const back = _runFocusFrom;
      _runFocusFrom = null;
      if (lost() || (before && /^btn-stop(-python)?$/.test(before.id))) {
        const to = [back, document.getElementById('btn-run-python'), document.getElementById('btn-run')].find(usable);
        if (to) { try { to.focus(); } catch (e) { /* noop */ } }
      }
    }
  }
  function setPythonRunning(running) {
    const focusBefore = document.activeElement;
    const btnRun  = document.getElementById('btn-run-python');
    const btnStop = document.getElementById('btn-stop-python');
    btnRun.disabled    = running;
    btnRun.textContent = running ? '実行中…' : '▶ 実行';
    // micro:bit のシミュレータはツールバーの「■ シミュレータを止める」で止める。
    // ここでも停止を出すと停止ボタンが 3 つ並び、どれが何を止めるか分からなくなる
    btnStop.style.display = (running && currentMode !== 'micropython') ? '' : 'none';
    _simRunning = running;
    if (window.PycoMicrobitSim) PycoMicrobitSim.setRunning(running);
    // 止まったシミュレータは盤面を少し暗くする（MakeCode と同じ。LED が光ったままだと止まっていないように見える）。
    // 見た目は css/style.css の #mb-sim.mbs-stopped。最初の実行の前は付けない
    const simEl = document.getElementById('mb-sim');
    if (simEl) simEl.classList.toggle('mbs-stopped', !running);
    if (!running && _sensorMonRunning && !PicoSerial.isConnected()) setSensorMonRunning(false);
    if (currentMode === 'micropython' && typeof PicoSerial !== 'undefined') updateSerialUI();
    keepRunFocus(running, focusBefore);
  }

  // codeOverride：決まったコードを動かすとき（センサーモニター）。ボタンから呼ぶと Event が来るので文字列のときだけ使う
  function runPython(codeOverride) {
    if (typeof Sk === 'undefined') {
      appendShellText('[エラー] Skulptが読み込まれていません。ネットワーク接続を確認してください。\n', true);
      return;
    }

    saveCurrentFile();
    // ゲームモードでは「現在見えているコード」を優先して実行する
    const mainFile = pyFiles.find(function(f) { return f.name === 'main.py'; });
    const code = typeof codeOverride === 'string' ? codeOverride
      : currentMode === 'game'
      ? editor.getValue()
      : (mainFile ? mainFile.content : editor.getValue());
    const monOut = document.getElementById('monitor-output');

    monOut.innerHTML = '';
    appendShellText('>>> 実行開始\n', false, 'py-prompt');

    // センサーモニター（codeOverride）をプログラムの横で動かすときは、プログラムの止める印を消さない
    const isMonitor = typeof codeOverride === 'string';
    const sideBySide = isMonitor && _pyRuns.size > 0;
    if (!sideBySide) _pyStopRequested = false;
    const runTok = { stop: false };
    _pyRuns.add(runTok);
    if (isMonitor) _monitorRun = runTok;
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

    // micro:bit：microbit / music / radio などをシミュレータ用の代わりに差しかえる
    const _mbSim = currentMode === 'micropython' && currentBoard === 'microbit' && window.PycoMicrobitSim;
    if (_mbSim) {
      PycoMicrobitSim.installIntoSkulpt(Sk);
      // 横で動かすモニターは、動いているプログラムの LED・音を消さない
      if (!sideBySide) PycoMicrobitSim.reset();
    }

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
    // やさしいAIモジュール登録（小中向け pyco_ai）
    if (window.PycoAi && typeof window.PycoAi.installIntoSkulpt === 'function') {
      try { window.PycoAi.installIntoSkulpt(Sk); } catch (e) { console.warn('pyco_ai install failed', e); }
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
        if (_pyStopRequested || runTok.stop) {
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
      if (_pyStopRequested || runTok.stop) {
        appendShellText(runTok.stop && !_pyStopRequested ? '>>> センサーモニターを止めました\n' : '>>> 停止しました\n', false, 'py-prompt');
        return;
      }
      const parsed = parseSkulptError(err, code);
      if (codingMode) {
        // コーディングモード：行番号＋内容＋直し方を日本語で表示し、該当行をハイライト
        showCodingError(parsed);
      } else {
        // ブロックモード：シェルにタイトル＋該当ブロックをハイライト（詳細はパネル）。
        // 右のコード欄と見比べられるよう、行番号も出す（コード編集で動かしたときと同じ形）
        appendShellText('\n' + (parsed.lineno ? '❌ ' + parsed.lineno + '行目：' : '') + parsed.title + '\n', true);
        if (blockLineMap.size > 0) {
          const bid = parsed.lineno ? blockIdAtLine(parsed.lineno) : null;
          showErrorOnBlock(bid, parsed.title, parsed.detail);
        }
      }
    }).finally(function() {
      _pyRuns.delete(runTok);
      if (_monitorRun === runTok) _monitorRun = null;
      if (_pyRuns.size === 0) {
        setPythonRunning(false);
        if (_mbSim) PycoMicrobitSim.halt();
      } else if (isMonitor && _sensorMonRunning && !PicoSerial.isConnected()) {
        // モニターだけ止まった：プログラムはそのまま動いている
        setSensorMonRunning(false);
      }
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
    if (window.PycoPlot && !isError && cls !== 'py-prompt') PycoPlot.feed(text);
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
    if (panel && panel.style.display !== 'none') { panel.style.display = 'none'; fitWorkspaceAboveErrorPanel(false); }
    // コーディングモードのエラー行ハイライトを消す
    if (_errorLineNo >= 0) {
      try { editor.removeLineClass(_errorLineNo, 'background', 'cm-error-line'); } catch (e) {}
      _errorLineNo = -1;
    }
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
    fitWorkspaceAboveErrorPanel(true);
  }
  // エラーパネルは作業域の下に重ねて出すので、ゴミ箱とズームの「－」が隠れていた（r4 02 R3-05）。
  // 出ている間は、作業域（#blockly-div）の下に重なった分だけ余白を取り、描画面を縮める。
  // Blockly はゴミ箱・ズームを描画面の右下に置き直すので、パネルの上に出る（ブロックの位置は変わらない）
  function fitWorkspaceAboveErrorPanel(on) {
    const host = document.getElementById('blockly-div');
    const panel = document.getElementById('error-hint');
    if (!host || !panel) return;
    let pad = 0;
    if (on && panel.style.display === 'block') {
      const hr = host.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      if (hr.height > 0 && pr.left < hr.right && pr.right > hr.left) pad = Math.max(0, Math.round(hr.bottom - pr.top));
      // 作業域の半分を超えては縮めない（パネルは中でスクロールできる）
      pad = Math.min(pad, Math.round(hr.height / 2));
    }
    const v = pad ? pad + 'px' : '';
    if (host.style.paddingBottom === v) return;
    host.style.paddingBottom = v;
    requestAnimationFrame(function() { try { Blockly.svgResize(workspace); } catch (e) { /* noop */ } });
  }

  // コーディングモード：シェルに「何行目で・何が・どう直すか」を日本語で出し、該当行をハイライト
  function showCodingError(parsed) {
    const ln = parsed.lineno;
    appendShellText('\n' + (ln ? `❌ ${ln}行目でエラーが起きました` : '❌ エラーが起きました') + '\n', true);
    appendShellText(parsed.title + '\n', true);
    if (ln) {
      let lineText = '';
      try { lineText = (editor.getLine(ln - 1) || '').replace(/\t/g, '  '); } catch (e) {}
      if (lineText.trim()) appendShellText('　　' + ln + '| ' + lineText + '\n', true);
    }
    if (parsed.detail) appendShellText(parsed.detail + '\n', false, 'py-hint');
    // エディタの該当行をハイライト＋スクロール
    if (ln) {
      try {
        editor.addLineClass(ln - 1, 'background', 'cm-error-line');
        editor.scrollIntoView({ line: ln - 1, ch: 0 }, 120);
        _errorLineNo = ln - 1;
      } catch (e) {}
    }
  }

  // SyntaxError の「実際のコード行」を解析して、初心者向けに具体的な原因＋直し方を返す。
  // Skulptのエラー文は不親切なので、該当行（無ければ1つ上の行）をヒューリスティックで診断する。
  function diagnoseSyntaxError(code, lineno) {
    if (!code) return null;
    const lines = String(code).split('\n');
    // 文字列リテラルとコメントを除去してコード構造だけにする（"…"内の#や全角は誤検知しないため）
    function stripStr(s) {
      return String(s)
        .replace(/"(?:[^"\\]|\\.)*"/g, '__')
        .replace(/'(?:[^'\\]|\\.)*'/g, '__')
        .replace(/#.*$/, '');
    }
    function check(raw) {
      if (raw == null) return null;
      const line = raw.replace(/\s+$/, '');
      // 1. 行のはじめに全角スペース（インデントの全角スペースは必ず誤り）
      if (/^[ \t]*　/.test(raw)) {
        return { cause: '行のはじめに 全角スペース が入っています',
                 fix: '字下げ（インデント）は 半角スペース で書きます。\n赤い箱で表示された全角スペースを、半角スペース（4つが目安）に直してください。' };
      }
      const codeOnly = stripStr(line);
      // 2. コード部分に全角スペース・全角記号が混じっている
      const zen = codeOnly.match(/[　：；（）＜＞＝”’［］｛｝＋－＊／、。！？]/);
      if (zen) {
        const nm = zen[0] === '　' ? '全角スペース' : `全角の「${zen[0]}」`;
        return { cause: `コードに ${nm} が混じっています`,
                 fix: `プログラムの記号やスペースは 半角 で書きます（日本語は " " の中だけ）。\n${nm} を半角に直してください。` };
      }
      // 3. if/for/while/def 等の行末にコロン : が無い
      if (/^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(codeOnly)
          && !/:\s*$/.test(codeOnly) && !/\\\s*$/.test(codeOnly)) {
        const kw = codeOnly.match(/^\s*(\w+)/)[1];
        return { cause: `「${kw}」の行の終わりに コロン : がありません`,
                 fix: `Python では if / elif / else / for / while / def の行の最後に : を付けます。\n例:  if 点数 >= 60:` };
      }
      // 4. 比較のつもりで = が1つ（if/elif/while の条件・かっこ内の引数は除外）
      const cond = codeOnly.replace(/^\s*\w+/, '').replace(/\([^()]*\)/g, '()');
      if (/^\s*(if|elif|while)\b/.test(codeOnly) && /[^=!<>]=[^=]/.test(cond)) {
        return { cause: '「等しいか」を調べるところが = （代入）になっています',
                 fix: '比較は == （イコール2つ）です。\n例:  if なまえ == "たろう":' };
      }
      // 5. print のあとにかっこが無い（Python2式）
      if (/^\s*print\s+[^(\s=]/.test(line) && !/^\s*print\s*\(/.test(line)) {
        return { cause: 'print のあとに かっこ ( ) がありません',
                 fix: 'print は  print("メッセージ")  のように かっこ で囲みます。' };
      }
      // 6. かっこの数が合わない（その行）
      const op = (codeOnly.match(/[([{]/g) || []).length;
      const cl = (codeOnly.match(/[)\]}]/g) || []).length;
      if (op > cl) return { cause: 'かっこ ( [ { の 閉じ忘れ があります',
                            fix: '開いた かっこ と 閉じる かっこ の数をそろえてください。' };
      if (cl > op) return { cause: 'かっこ ) ] } が多すぎます（開きが足りません）',
                            fix: '閉じる かっこ に対して、開く かっこ が足りません。' };
      // 7. クォートの数が奇数＝閉じ忘れの可能性
      if (((line.match(/"/g) || []).length % 2) === 1 || ((line.match(/'/g) || []).length % 2) === 1) {
        return { cause: 'クォート " または \' の 閉じ忘れ がありそうです',
                 fix: '文字列は  "..."  または  \'...\'  のように、同じ記号ではさんで とじます。' };
      }
      return null;
    }
    // 行が分かるなら 該当行 → 1つ上の行（本文行で報告され、原因が上のヘッダ行のことがある）
    if (lineno) {
      const r = check(lines[lineno - 1]) || check(lines[lineno - 2]);
      if (r) return r;
    } else {
      // 行が分からない場合（閉じ忘れ等でEOFに達したとき）は全行を走査
      for (let i = 0; i < lines.length; i++) { const r = check(lines[i]); if (r) return r; }
    }
    // 複数行にまたがる かっこ／クォート の閉じ忘れ（全体のバランス）
    const all = lines.map(stripStr).join('\n');
    const op = (all.match(/[([{]/g) || []).length;
    const cl = (all.match(/[)\]}]/g) || []).length;
    if (op > cl) return { cause: 'かっこ ( [ { の 閉じ忘れ があります',
                          fix: 'プログラム全体で、開いた かっこ と 閉じる かっこ の数をそろえてください。' };
    if (cl > op) return { cause: 'かっこ ) ] } が多すぎます（開きが足りません）',
                          fix: '閉じる かっこ に対して、開く かっこ が足りません。' };
    if (/["']/.test(all)) return { cause: 'クォート " または \' の 閉じ忘れ がありそうです',
                                   fix: '文字列は "..." または \'...\' のように、同じ記号ではさんで とじます。' };
    return null;
  }

  // Skulptエラーを解析して { lineno, title, detail } を返す
  function parseSkulptError(err, code) {
    const tp = err.tp$name || '';
    let rawMsg = '';
    try { rawMsg = err.args.v[0].v; } catch (e) { rawMsg = err.toString ? err.toString() : String(err); }

    // 行番号取得（tracebackの先頭フレーム＝エラーが実際に起きた最深部）
    // Skulptはエラー発生地点を traceback[0]、呼び出し元を末尾に積む。
    // 末尾を使うと、関数内エラーが呼び出し側の行に表示されてしまうため先頭を使う。
    let lineno = null;
    if (err.traceback && err.traceback.length > 0) {
      lineno = err.traceback[0].lineno;
    }
    // フォールバック：SyntaxError 等で traceback が無い場合、メッセージや err から行番号を拾う
    if (!lineno && typeof err.$lineno === 'number') lineno = err.$lineno;
    if (!lineno) {
      const lm = String(rawMsg).match(/on line (\d+)/);
      if (lm) lineno = parseInt(lm[1], 10);
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
      if (rawMsg.includes('unsupported operand') || rawMsg.includes('concatenate')) {
        detail = `文字列と数値を そのまま 足し算しようとしています。\n・数値を文字列にして つなげるには： "点数" + str(100)\n・文字列を数値にして 計算するには： int("100") + 5\n（コーディングモードでは str(...) / int(...) / float(...) で型をそろえます）`;
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
    } else if (tp === 'UnboundLocalError') {
      const m = rawMsg.match(/local variable '(.+?)'/);
      const name = m ? `「${m[1]}」` : 'その変数';
      title = `UnboundLocalError — ${name} に値を入れる前に使っています`;
      detail = `関数の中で ${name} を、まだ値を入れていない状態で使おうとしています。\n・使う前に「変数に入れる」ブロックで ${name} に値をセットしてください\n・比較の == と 代入の = をまちがえていませんか（最初の代入は = ひとつです）\n　例:  biggest = a   ← まず値を入れる`;
    } else if (tp === 'KeyError') {
      title = `KeyError — 辞書にそのキーがありません`;
      detail = `辞書（ディクショナリ）に、指定したキーが存在しません。\n・キーのスペルが合っているか確認してください\n・キーがあるか先に確認するには  if キー in 辞書:  を使います\n（くわしい原因: ${rawMsg}）`;
    } else if (tp === 'ModuleNotFoundError' || tp === 'ImportError') {
      title = `ImportError — モジュールを読み込めません`;
      detail = `import しようとしたモジュール（ライブラリ）が見つからない、またはこの環境では使えません。\n・モジュール名のスペルを確認してください\n・このブラウザ版では使えないモジュールもあります\n（くわしい原因: ${rawMsg}）`;
    } else if (tp === 'RecursionError') {
      title = `RecursionError — 関数の呼び出しが深くなりすぎました`;
      detail = `関数が自分自身を呼び続けて、止まらなくなっています。\n・再帰の「終わりの条件（これ以上呼ばない条件）」があるか確認してください\n・呼び出すたびに ゴールに近づいているか確認してください`;
    } else if (tp === 'AssertionError') {
      title = `AssertionError — assert の条件が成り立ちませんでした`;
      // assert に独自メッセージが付いている場合だけ表示（Skulptの内部文字列は出さない）
      const amOk = rawMsg && !/on line \d+/.test(rawMsg) && rawMsg !== 'AssertionError';
      detail = `assert で「正しいはず」とした条件が、実際には成り立っていませんでした。\n・条件式が本当に正しいか、変数の値を print で確認してください${amOk ? '\n（メッセージ: ' + rawMsg + '）' : ''}`;
    } else if (tp === 'OverflowError') {
      title = `OverflowError — 数が大きくなりすぎました`;
      detail = `計算の結果が、あつかえる範囲をこえて大きくなりました。\n・くり返しで数をかけ続けていないか確認してください`;
    } else if (tp === 'StopIteration') {
      title = `StopIteration — 取り出せる要素がもうありません`;
      detail = `next() などで要素を取り出そうとしましたが、もう残っていません。\n・for ループを使うと、要素の数だけ自動でくり返せます`;
    } else if (tp === 'FileNotFoundError' || tp === 'IOError' || tp === 'OSError') {
      title = `FileNotFoundError — ファイルが見つかりません`;
      detail = `open しようとしたファイルが見つかりません。\n・ファイル名のスペルや拡張子（.txt など）を確認してください\n・先に「書き込み」でファイルを作ってから読み込んでください\n（くわしい原因: ${rawMsg}）`;
    } else if (tp === 'TabError') {
      title = `TabError — タブとスペースが混ざっています`;
      detail = `字下げ（インデント）に タブ と スペース が混ざっています。\n・字下げはスペースだけにそろえてください（Tabキーでスペース4つが入ります）`;
    } else if (tp === 'NotImplementedError') {
      title = `NotImplementedError — この機能はこの環境では使えません`;
      detail = `使おうとした機能は、このブラウザ版では対応していません。\n・別のやり方で書けないか確認してください\n（くわしい原因: ${rawMsg}）`;
    } else if (tp === 'IndentationError') {
      if (/expected an indented block/i.test(rawMsg)) {
        title = `IndentationError — 字下げ（インデント）が足りません`;
        detail = `if / for / while / def などの 次の行 は、1段（スペース4つ）深く字下げします。\n例:\n  if 点数 >= 60:\n      print("合格")   ← この行を字下げ`;
      } else if (/unexpected indent/i.test(rawMsg)) {
        title = `IndentationError — 字下げ（インデント）が多すぎます`;
        detail = `この行だけ よけいに字下げされています。\n・前の行と同じ深さにそろえてください\n・行のはじめに よけいなスペースが無いか確認してください`;
      } else {
        title = `IndentationError — 字下げ（インデント）がそろっていません`;
        detail = `行のはじめの空白（字下げ）がそろっていません。\n・同じまとまりの行は、同じ深さに字下げします（スペース4つが目安）\n・タブとスペースを混ぜないでください（Tabキーで4スペースが入ります）`;
      }
    } else if (tp === 'SyntaxError') {
      const diag = diagnoseSyntaxError(code, lineno);
      if (diag) {
        // コード行を解析して具体的な原因を特定できた場合
        title = `SyntaxError — ${diag.cause}`;
        detail = diag.fix;
      } else {
        title = `SyntaxError — 書き方（文法）のまちがいがあります`;
        detail = `コードの書き方にまちがいがあります。よくある原因:\n・行のおわりに コロン : を忘れていませんか（if / for / while / def の行）\n・かっこ ( ) [ ] や クォート " ' の閉じ忘れはありませんか\n・全角スペースや全角の記号（：　（）など）が混じっていませんか\n・= は1つで「代入」、== は2つで「等しいか比較」です\n（くわしい原因: ${rawMsg}）`;
      }
    } else if (rawMsg.includes('execLimit') || rawMsg.includes('Execution exceeded')) {
      title = `TimeLimitError — 実行ステップ数の上限を超えました`;
      detail = `ループが終わらずに繰り返し続けている可能性があります。\n・「ずっと繰り返す（while True）」の中に終了条件があるか確認してください\n・繰り返し回数が多すぎないか確認してください`;
      lineno = null; // 特定行なし
    } else {
      // 上のどれにも当てはまらない種別：英語のまま出さず、日本語の枠で包む
      title = tp ? `${tp} — エラーが起きました` : 'エラーが起きました';
      detail = `プログラムの実行中にエラーが起きました。\n原因: ${rawMsg}`;
    }

    return { lineno: lineno, title: title, detail: detail };
  }

  // ［閉じる］で閉じたら、フォーカスを作業域（コード編集中はコード欄）へ返す（body に落ちていた・r5 02 R5-02）
  document.getElementById('error-hint-close').addEventListener('click', function() {
    clearErrorHighlights();
    try {
      if (codingMode) editor.focus();
      else if (Blockly.getFocusManager) Blockly.getFocusManager().focusTree(workspace);
      else workspace.markFocused();
    } catch (e) { /* noop */ }
  });

  // ===== 空の差し込み口のまま実行しようとしたら知らせる =====
  //   「? を表示する」の ? が空のまま実行すると print("") になり、何も出ずに「>>> 完了」だけが出る。
  //   子どもには何が悪いのか分からないので、実行する前にそのブロックを光らせて「ここに値を入れてね」と出す。
  //   調べるのは表示・書き出しのブロックだけ（ほかのブロックは空でも意味のある書き方がある）。
  //   わざと空にしたいときは、もう一度［▶ 実行］を押せばそのまま動く。
  const EMPTY_CHECK_TYPES = /^(py_print|py_print2|py_print_multi|mb_show_number|mb_scroll|mb_serial_(line|number|value|string))$/;
  let _emptyWarnedId = null;
  function warnEmptyInput() {
    if (codingMode || !workspace) return false;
    const hit = workspace.getAllBlocks(true).find(function(b) {
      if (!b.isEnabled() || !EMPTY_CHECK_TYPES.test(b.type)) return false;
      return b.inputList.some(function(inp) {
        return inp.type === Blockly.inputs.inputTypes.VALUE && inp.connection && !inp.connection.targetBlock();
      });
    });
    const panel = document.getElementById('error-hint');
    const shown = panel && panel.style.display === 'block';
    if (!hit || (shown && _emptyWarnedId === hit.id)) { _emptyWarnedId = null; return false; }
    _emptyWarnedId = hit.id;
    showErrorOnBlock(hit.id, 'ここに値を入れてね',
      '光っているブロックの差し込み口が空です。「値」や「文字列」のブロックから、表示したい文字や数を入れましょう。\n' +
      '（空のまま動かすときは、もう一度［▶ 実行］）');
    try { workspace.centerOnBlock(hit.id); } catch (e) { /* 古い Blockly */ }
    return true;
  }

  document.getElementById('btn-run-python').addEventListener('click', function() {
    if (warnEmptyInput()) return;
    runPython();
  });
  // センサーモニター（micro:bit）：選んだセンサーの値を 0.1 秒ごとに print するプログラムを動かし、グラフで見る。
  // つないでいれば実機で、つないでいなければシミュレータで動かす。止めるのはそれぞれの停止ボタン。
  // 選んだセンサーはブラウザに覚えておく
  const MB_SENSORS = [
    { key: 'ax', label: '加速度x', expr: 'accelerometer.get_x()', on: true },
    { key: 'ay', label: '加速度y', expr: 'accelerometer.get_y()', on: true },
    { key: 'az', label: '加速度z', expr: 'accelerometer.get_z()', on: true },
    { key: 'as', label: '加速度の強さ', expr: 'accelerometer.get_strength()' },
    { key: 'light', label: '明るさ', expr: 'display.read_light_level()' },
    { key: 'temp', label: '温度', expr: 'temperature()' },
    { key: 'sound', label: '音', expr: 'microphone.sound_level()' },
    { key: 'head', label: '方角', expr: 'compass.heading()', note: '実機は初めに LED の指示で調整が必要' },
    { key: 'mag', label: '磁力', expr: 'compass.get_field_strength() // 1000', note: 'µT' },
    { key: 'p0', label: 'P0', expr: 'pin0.read_analog()', note: 'アナログ値 0〜1023' },
    { key: 'p1', label: 'P1', expr: 'pin1.read_analog()', note: 'アナログ値 0〜1023' },
    { key: 'p2', label: 'P2', expr: 'pin2.read_analog()', note: 'アナログ値 0〜1023' },
  ];
  function mbSensorChoice() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('pyco-mb-sensors') || 'null'); } catch (_) {}
    return MB_SENSORS.filter(function(s) { return saved ? saved.indexOf(s.key) >= 0 : s.on; });
  }
  // プログラム（生成した Python）の中で読んでいるセンサー。MB_SENSORS の expr と同じ呼び出しを探す
  function mbSensorsInCode(code) {
    const pats = { ax: /accelerometer\.get_x\(/, ay: /accelerometer\.get_y\(/, az: /accelerometer\.get_z\(/,
      as: /accelerometer\.get_strength\(/, light: /read_light_level\(/, temp: /\btemperature\(/,
      sound: /microphone\.sound_level\(/, head: /compass\.heading\(/, mag: /compass\.get_(field_strength|[xyz])\(/,
      p0: /pin0\.read_analog\(/, p1: /pin1\.read_analog\(/, p2: /pin2\.read_analog\(/ };
    return Object.keys(pats).filter(function(k) { return pats[k].test(code); });
  }
  function mbSensorCode(list) {
    return 'from microbit import *\n' +
      'while True:\n' +
      "    print(" + list.map(function(s) { return "'" + s.label + ":' + str(" + s.expr + ")"; }).join(" + ' ' + ") + ")\n" +
      '    sleep(100)\n';
  }
  // センサーモニターが動いている間は、ボタンを「■ センサーモニターを止める」にして、押すと止まるようにする
  //   （名前が変わらないと動いているか分からず、もう一度押すと選ぶ窓がまた開いていた）。
  //   見た目は css/style.css の #btn-sensor-monitor.is-running
  function setSensorMonRunning(on) {
    _sensorMonRunning = on;
    const btn = document.getElementById('btn-sensor-monitor');
    if (!btn) return;
    btn.textContent = on ? '■ センサーモニターを止める' : 'センサーモニター';
    btn.classList.toggle('is-running', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  async function stopMbSensorMonitor() {
    // シミュレータ：止めるのはモニターだけ（開始のときに止めなかったプログラムは止めない）。
    // モニターしか動いていなければ、それが止まってシミュレータも止まる
    if (!PicoSerial.isConnected()) {
      if (_monitorRun) _monitorRun.stop = true; else _pyStopRequested = true;
      return;
    }
    try {
      await PicoSerial.stopCode();
      setSerialStatus('■ センサーモニターを止めました', 'dim');
    } catch (e) {
      setSerialStatus('停止エラー: ' + e.message, 'err');
    }
  }
  async function startMbSensorMonitor(list) {
    if (!list.length) return;
    const code = mbSensorCode(list);
    if (window.PycoPlot) { PycoPlot.reset(); PycoPlot.show(true); }
    setSensorMonRunning(true);
    if (!PicoSerial.isConnected()) { runPython(code); return; }   // 止まると setPythonRunning(false) で戻す
    try {
      await PicoSerial.runCode(code, msg => setSerialStatus(msg, 'progress'), appendMonitor);
    } catch (e) {
      setSerialStatus('実行エラー: ' + e.message, 'err');
    } finally {
      setSensorMonRunning(false);
      updateSerialUI();
    }
  }
  // 「センサーモニター」を押すと、センサーを選ぶ小さな窓を出す
  (function() {
    const btn = document.getElementById('btn-sensor-monitor');
    const pop = document.createElement('div');
    pop.id = 'mb-sensor-pop';
    pop.hidden = true;
    const chosen = mbSensorChoice().map(function(s) { return s.key; });
    pop.innerHTML = '<div class="msp-title">グラフに出すセンサー</div><div class="msp-list">' +
      MB_SENSORS.map(function(s) {
        return '<label' + (s.note ? ' title="' + s.note + '"' : '') + '><input type="checkbox" value="' + s.key + '"' +
          (chosen.indexOf(s.key) >= 0 ? ' checked' : '') + '>' + s.label + '</label>';
      }).join('') +
      '</div><div class="msp-foot"><span class="msp-where"></span><button type="button" class="msp-cancel">閉じる</button><button type="button" class="msp-go">開始</button></div>';
    document.getElementById('monitor-panel').appendChild(pop);
    const picked = function() {
      const keys = Array.from(pop.querySelectorAll('input:checked')).map(function(i) { return i.value; });
      return MB_SENSORS.filter(function(s) { return keys.indexOf(s.key) >= 0; });
    };
    pop.addEventListener('change', function() { pop.querySelector('.msp-go').disabled = !picked().length; });
    btn.addEventListener('click', function() {
      if (_sensorMonRunning) { pop.hidden = true; stopMbSensorMonitor(); return; }
      pop.querySelector('.msp-where').textContent = PicoSerial.isConnected() ? '実機で動かします' : 'シミュレータで動かします';
      // 開くたびに、いまのプログラムが使っているセンサーに印を付ける（「明るさ」のプログラムなのに
      // 加速度だけが選ばれていると、子どもは見たい線を探せない）。使っていなければ前回の選び方のまま
      if (pop.hidden) {
        const used = mbSensorsInCode(editor.getValue());
        const keys = used.length ? used : mbSensorChoice().map(function(s) { return s.key; });
        pop.querySelectorAll('input[type=checkbox]').forEach(function(i) { i.checked = keys.indexOf(i.value) >= 0; });
        pop.querySelector('.msp-go').disabled = !keys.length;
      }
      pop.hidden = !pop.hidden;
    });
    pop.querySelector('.msp-cancel').addEventListener('click', function() { pop.hidden = true; });
    pop.querySelector('.msp-go').addEventListener('click', function() {
      const list = picked();
      try { localStorage.setItem('pyco-mb-sensors', JSON.stringify(list.map(function(s) { return s.key; }))); } catch (_) {}
      pop.hidden = true;
      startMbSensorMonitor(list);
    });
  })();

  // micro:bit シミュレータ（配線図の場所に出る）の実行・停止ボタン
  if (window.PycoMicrobitSim) {
    PycoMicrobitSim.mount(document.getElementById('mb-sim'), {
      run: runPython,
      stop: function() { _pyStopRequested = true; },
    });
  }
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

    const is2x2 = () => mainEl && mainEl.classList.contains('game-layout');
    function startDrag(clientY) {
      dragging = true;
      startY = clientY;
      startH = (is2x2() && monitorPanel)
        ? parsePct(mainEl.style.getPropertyValue('--right-top') || window.getComputedStyle(mainEl).getPropertyValue('--right-top'), 56)
        : codeOutput.getBoundingClientRect().height;
      handle.classList.add('dragging');
      document.body.style.userSelect = 'none';
    }
    function onMove(clientY) {
      if (!dragging) return;
      if (is2x2()) {
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
      if (is2x2()) {
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

  // 左列の上下リサイズ (ゲーム画面 or 配線図プレビュー 共通)
  (function() {
    const gameHandle = document.getElementById('game-area-resize-handle');
    const circuitHandle = document.getElementById('circuit-preview-resize-handle');
    const mainEl = document.querySelector('.main');
    if (!mainEl || (!gameHandle && !circuitHandle)) return;

    let dragging = false;
    let activeHandle = null;
    let startY = 0;
    let startTopPct = 56;

    function parsePct(value, fallback) {
      const n = parseFloat((value || '').replace('%', ''));
      return Number.isFinite(n) ? n : fallback;
    }

    function startDrag(clientY, handle) {
      if (!mainEl.classList.contains('game-layout')) return;
      dragging = true;
      activeHandle = handle;
      startY = clientY;
      startTopPct = parsePct(mainEl.style.getPropertyValue('--left-top') || window.getComputedStyle(mainEl).getPropertyValue('--left-top'), 56);
      handle.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    }

    function onMove(clientY) {
      if (!dragging || !mainEl.classList.contains('game-layout')) return;
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
      if (activeHandle) activeHandle.classList.remove('dragging');
      activeHandle = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      requestAnimationFrame(() => Blockly.svgResize(workspace));
    }

    [gameHandle, circuitHandle].forEach(h => {
      if (!h) return;
      h.addEventListener('mousedown', e => startDrag(e.clientY, h));
      h.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientY, h); }, { passive: false });
    });
    document.addEventListener('mousemove', e => onMove(e.clientY));
    document.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  })();

  // 配線図プレビュー 折りたたみ
  (function() {
    const collapseBtn = document.getElementById('btn-circuit-collapse');
    const svgEl = document.getElementById('circuit-preview-svg');
    const previewArea = document.getElementById('circuit-preview-area');
    const resizeHandle = document.getElementById('circuit-preview-resize-handle');
    const blocklyDiv = document.getElementById('blockly-div');
    const leftCol = document.getElementById('game-left-column');
    if (!collapseBtn || !svgEl || !previewArea) return;

    collapseBtn.addEventListener('click', (ev) => {
      const isCollapsed = svgEl.style.display === 'none';
      // 人が押したときだけ覚える（スマホ表示で自動で畳むときは覚えない）。1280×720 のプロジェクタでは
      // 作業域が 320px しかなく、授業のたびに［非表示］を押させていた（r4 03 R4-02）
      if (ev && ev.isTrusted) { try { localStorage.setItem('pyco-circuit-collapsed', isCollapsed ? '0' : '1'); } catch (e) { /* noop */ } }
      if (isCollapsed) {
        svgEl.style.display = 'flex';
        previewArea.style.flex = '';
        if (blocklyDiv) blocklyDiv.style.flex = '';
        if (resizeHandle) resizeHandle.style.display = '';
        collapseBtn.textContent = '非表示 ▼';
        collapseBtn.title = 'プレビューを折りたたむ';
      } else {
        svgEl.style.display = 'none';
        previewArea.style.flex = '0 0 auto';
        if (blocklyDiv) blocklyDiv.style.flex = '1 1 0';
        if (resizeHandle) resizeHandle.style.display = 'none';
        collapseBtn.textContent = '配線図を表示 ▲';
        collapseBtn.title = 'プレビューを展開する';
      }
      // スマホ表示は flex 比率を !important で固定しているため、
      // クラスで上書きしてブロックを全面化する（!isCollapsed=これから折りたたむ）
      if (leftCol) leftCol.classList.toggle('circuit-collapsed', !isCollapsed);
      requestAnimationFrame(() => Blockly.svgResize(workspace));
    });
  })();

  // スマホでは配線図プレビューが画面の下半分を占め、作業域が 230px ほどしか残らない。
  // スマホ表示で Pico モードに入ったときは、はじめから折りたたんでおく（見たければ「配線図を表示 ▲」）
  // パソコンでも、前に［非表示］にしていれば畳んだまま始める（覚えるのは上の折りたたみボタン）
  // 覚える場所は localStorage の pyco-circuit-collapsed（'1'＝畳む・'0'＝出す）
  function collapseCircuitForMobile() {
    if (modeKey() !== 'micropython') return;
    let pref = null;
    try { pref = localStorage.getItem('pyco-circuit-collapsed'); } catch (e) { /* noop */ }
    const mobile = document.body.classList.contains('mobile-mode');
    if (!(pref === '1' || (mobile && pref !== '0'))) return;
    const svgEl = document.getElementById('circuit-preview-svg');
    const btn = document.getElementById('btn-circuit-collapse');
    if (svgEl && btn && svgEl.style.display !== 'none') btn.click();
  }

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
      if (!mainEl.classList.contains('game-layout')) return;
      dragging = true;
      vHandle.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    function moveDrag(clientX) {
      if (!dragging || !mainEl.classList.contains('game-layout')) return;
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

  // ===== 実態配線図ボタン =====
  (function() {
    const modal   = document.getElementById('circuit-modal');
    const btnOpen = document.getElementById('btn-circuit');
    const btnClose= document.getElementById('circuit-close');
    const wrap    = document.getElementById('circuit-svg-wrap');
    const summary = document.getElementById('circuit-summary');
    const btnDlSvg= document.getElementById('circuit-dl-svg');
    const btnDlPng= document.getElementById('circuit-dl-png');
    const btnZoomIn = document.getElementById('circuit-zoom-in');
    const btnZoomOut= document.getElementById('circuit-zoom-out');
    const btnZoomFit= document.getElementById('circuit-zoom-fit');
    const btnResetPos = document.getElementById('circuit-reset-pos');
    if (!modal || !btnOpen) return;

    let currentScale = 1;
    let panX = 0, panY = 0;
    let currentSvgStr = '';
    // セッション内で部品の手動位置 (自動配置からのオフセット) を保持
    const circuitOverrides = {};
    // セッション内で配線縦セグメントの左右ずらし (chDx) を保持
    const circuitWireOverrides = {};

    function applyView() {
      const svgEl = wrap.querySelector('svg');
      if (svgEl) {
        svgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
        svgEl.style.transformOrigin = 'top left';
      }
    }
    function applyZoom(scale) {
      currentScale = Math.max(0.3, Math.min(3, scale));
      applyView();
    }

    function renderInto(target) {
      const result = generateCircuitSVG(workspace, {
        overrides: circuitOverrides,
        wireOverrides: circuitWireOverrides,
        dark: circuitIsDark(),
      });
      currentSvgStr = result.svg;
      target.innerHTML = result.svg;
      if (summary) summary.textContent = `部品 ${result.compCount} 個 / 接続 ${result.wireCount} 本`;
      setupCompDrag();
      setupWireDrag();
    }

    // ── スクリーン座標 → SVG内部座標変換 ──
    // getBoundingClientRect() を使うことで CSS transform: scale() を正確に吸収する
    function toSVGCoord(clientX, clientY) {
      const svg = wrap.querySelector('svg');
      if (!svg) return { x: clientX, y: clientY };
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      if (!vb || rect.width === 0) return { x: clientX, y: clientY };
      return {
        x: (clientX - rect.left) * (vb.width  / rect.width),
        y: (clientY - rect.top)  * (vb.height / rect.height),
      };
    }

    // ── 部品ドラッグ処理 ──
    // renderInto() 後のコンポーネントは絶対座標(cx,cy)で再描画されグループtransformは無い。
    // baseDx/baseDy を持ち越すと次回ドラッグ開始直後に旧オフセット分ジャンプするため、
    // 常に translate(今回dx, 今回dy) だけ設定し、確定時に prevOv に累積する。
    let dragState = null;
    function setupCompDrag() {
      const svg = wrap.querySelector('svg');
      if (!svg) return;
      svg.querySelectorAll('.cv-comp').forEach(g => {
        g.style.cursor = 'move';
        g.addEventListener('mousedown', onCompMouseDown);
        g.addEventListener('touchstart', onCompTouchStart, { passive: false });
      });
    }
    function onCompMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      startDrag(this, e.clientX, e.clientY);
    }
    function onCompTouchStart(e) {
      if (!e.touches[0]) return;
      e.preventDefault();
      e.stopPropagation();
      startDrag(this, e.touches[0].clientX, e.touches[0].clientY);
    }
    const DRAG_SNAP = 20; // グリッドスナップ間隔 (SVG座標px、グリッド40pxの半分)
    function snapVal(v) { return Math.round(v / DRAG_SNAP) * DRAG_SNAP; }

    function startDrag(g, clientX, clientY) {
      const svgPt = toSVGCoord(clientX, clientY);
      dragState = { g, id: g.getAttribute('data-comp-id'), startSvgX: svgPt.x, startSvgY: svgPt.y };
      g.style.opacity = '0.7';
    }
    function onDocMove(clientX, clientY) {
      if (!dragState) return;
      const svgPt = toSVGCoord(clientX, clientY);
      const dx = snapVal(svgPt.x - dragState.startSvgX);
      const dy = snapVal(svgPt.y - dragState.startSvgY);
      dragState.g.setAttribute('transform', `translate(${dx},${dy})`);
    }
    function endDrag(clientX, clientY) {
      if (!dragState) return;
      const svgPt = toSVGCoord(clientX, clientY);
      const dx = snapVal(svgPt.x - dragState.startSvgX);
      const dy = snapVal(svgPt.y - dragState.startSvgY);
      const prev = circuitOverrides[dragState.id] || { dx: 0, dy: 0 };
      circuitOverrides[dragState.id] = { dx: prev.dx + dx, dy: prev.dy + dy };
      dragState.g.style.opacity = '';
      dragState = null;
      // 新しい位置で配線を再ルーティング
      renderInto(wrap);
      applyZoom(currentScale);
      // 左下プレビューにも反映
      if (typeof updateCircuitPreview === 'function') updateCircuitPreview();
    }
    document.addEventListener('mousemove', e => onDocMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', e => endDrag(e.clientX, e.clientY));
    document.addEventListener('touchmove', e => {
      if (!dragState || !e.touches[0]) return;
      e.preventDefault();
      onDocMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.addEventListener('touchend', e => {
      if (!dragState) return;
      const t = e.changedTouches[0];
      if (!t) return;
      endDrag(t.clientX, t.clientY);
    });

    // ── 配線縦セグメントのドラッグ処理 ──
    let wireDragState = null;
    function setupWireDrag() {
      const svg = wrap.querySelector('svg');
      if (!svg) return;
      svg.querySelectorAll('.cv-wire').forEach(g => {
        g.addEventListener('mousedown', onWireMouseDown);
        g.addEventListener('touchstart', onWireTouchStart, { passive: false });
      });
    }
    function onWireMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      startWireDrag(this, e.clientX);
    }
    function onWireTouchStart(e) {
      if (!e.touches[0]) return;
      e.preventDefault();
      e.stopPropagation();
      startWireDrag(this, e.touches[0].clientX);
    }
    function startWireDrag(g, clientX) {
      const id = g.getAttribute('data-wire-id');
      const ov = circuitWireOverrides[id] || { chDx: 0 };
      wireDragState = {
        g, id,
        startSvgX: toSVGCoord(clientX, 0).x,
        baseChDx: ov.chDx,
        baseCh: parseFloat(g.getAttribute('data-ch')),
        x1: parseFloat(g.getAttribute('data-x1')),
        y1: parseFloat(g.getAttribute('data-y1')),
        x2: parseFloat(g.getAttribute('data-x2')),
        y2: parseFloat(g.getAttribute('data-y2')),
        wrap: g.getAttribute('data-wrap') === '1',
        trackY: parseFloat(g.getAttribute('data-track-y')),
      };
      g.style.opacity = '0.6';
    }
    function onWireDocMove(clientX) {
      if (!wireDragState) return;
      const dx = toSVGCoord(clientX, 0).x - wireDragState.startSvgX;
      const newCh = wireDragState.baseCh + dx;
      const s = wireDragState;
      let d;
      if (s.wrap) {
        d = `M${s.x1},${s.y1} V${s.trackY} H${newCh} V${s.y2} H${s.x2}`;
      } else if (Math.abs(s.x1 - newCh) <= 1) {
        d = `M${s.x1},${s.y1} V${s.y2} H${s.x2}`;
      } else {
        d = `M${s.x1},${s.y1} H${newCh} V${s.y2} H${s.x2}`;
      }
      s.g.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    }
    function endWireDrag(clientX) {
      if (!wireDragState) return;
      const dx = toSVGCoord(clientX, 0).x - wireDragState.startSvgX;
      circuitWireOverrides[wireDragState.id] = { chDx: wireDragState.baseChDx + dx };
      wireDragState.g.style.opacity = '';
      wireDragState = null;
      renderInto(wrap);
      applyZoom(currentScale);
      if (typeof updateCircuitPreview === 'function') updateCircuitPreview();
    }
    document.addEventListener('mousemove', e => onWireDocMove(e.clientX));
    document.addEventListener('mouseup', e => endWireDrag(e.clientX));
    document.addEventListener('touchmove', e => {
      if (!wireDragState || !e.touches[0]) return;
      e.preventDefault();
      onWireDocMove(e.touches[0].clientX);
    }, { passive: false });
    document.addEventListener('touchend', e => {
      if (!wireDragState) return;
      const t = e.changedTouches[0];
      endWireDrag(t ? t.clientX : wireDragState.startSvgX);
    });

    // ── 空白ドラッグでパン (SVG 自体を translate で動かす) ──
    // .cv-comp / .cv-wire の mousedown は stopPropagation しているのでここに来るのは空白だけ
    let panState = null;
    wrap.addEventListener('mousedown', e => {
      if (e.button !== 0) return; // 左クリックのみ
      if (e.target.closest('.cv-comp') || e.target.closest('.cv-wire')) return;
      panState = {
        startX: e.clientX, startY: e.clientY,
        basePanX: panX, basePanY: panY,
      };
      wrap.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!panState) return;
      panX = panState.basePanX + (e.clientX - panState.startX);
      panY = panState.basePanY + (e.clientY - panState.startY);
      applyView();
    });
    document.addEventListener('mouseup', () => {
      if (!panState) return;
      panState = null;
      wrap.style.cursor = 'grab';
    });

    // ── ホイールでカーソル位置中心にズーム ──
    wrap.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newScale = Math.max(0.3, Math.min(3, currentScale * factor));
      if (newScale === currentScale) return;
      const rect = wrap.getBoundingClientRect();
      // カーソルの wrap 左上基準座標
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      // カーソル下にあるSVG論理座標 (translate+scale 逆算)
      const logicalX = (cx - panX) / currentScale;
      const logicalY = (cy - panY) / currentScale;
      // ズーム後も同じ論理点をカーソル下に維持
      panX = cx - logicalX * newScale;
      panY = cy - logicalY * newScale;
      currentScale = newScale;
      applyView();
    }, { passive: false });

    function openModal() {
      if (currentMode !== 'micropython' || currentBoard !== 'pico') return;
      if (typeof generateCircuitSVG !== 'function') {
        alert('配線図エンジンが読み込まれていません。Ctrl+Shift+R で強制リロードしてください。');
        return;
      }
      try {
        renderInto(wrap);
        currentScale = 1;
        panX = 0; panY = 0;
        applyZoom(1);
        modal.style.display = 'flex';
      } catch(err) {
        console.error('[circuit]', err);
        wrap.innerHTML = `<p style="color:#f44336;padding:16px;font-family:sans-serif;">
          配線図の生成でエラーが発生しました。<br>
          <code style="font-size:.85em;">${err.message}</code>
        </p>`;
        modal.style.display = 'flex';
      }
      holdCircuitModal();
    }
    // ほかのダイアログと同じ作法にする：role=dialog・aria-modal・Esc で閉じる・Tab は中で回す・
    // 閉じたら開いたボタン（［配線図］）へ戻す（holdModal・r5 03 R5-01）
    const box = modal.firstElementChild;
    if (box) {
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', '実体配線図');
    }
    let releaseCircuit = null;
    function holdCircuitModal() {
      if (releaseCircuit || !box) return;
      // 左下のプレビューを押して開いたときは、閉じたあと［配線図］へ戻す
      const a = document.activeElement;
      if ((!a || a === document.body || a.closest('#circuit-preview-svg')) && btnOpen.offsetParent !== null) {
        try { btnOpen.focus(); } catch (e) { /* noop */ }
      }
      releaseCircuit = holdModal(modal, box, closeModal);
      try { btnClose.focus(); } catch (e) { /* noop */ }
    }
    function closeModal() {
      modal.style.display = 'none';
      const r = releaseCircuit;
      releaseCircuit = null;
      if (r) r();
    }
    window.__pycoCircuitClose = closeModal;
    btnOpen.addEventListener('click', openModal);
    // 左下プレビューをクリックしても拡大モーダルを開く
    const previewSvg = document.getElementById('circuit-preview-svg');
    if (previewSvg) previewSvg.addEventListener('click', openModal);

    // 自動配置に戻すボタン (部品位置 + 配線位置 両方リセット)
    if (btnResetPos) btnResetPos.addEventListener('click', () => {
      Object.keys(circuitOverrides).forEach(k => delete circuitOverrides[k]);
      Object.keys(circuitWireOverrides).forEach(k => delete circuitWireOverrides[k]);
      renderInto(wrap);
      applyZoom(currentScale);
      if (typeof updateCircuitPreview === 'function') updateCircuitPreview();
    });

    // overrides を他から参照できるよう公開 (プレビュー側で同じ位置を反映するため)
    window.__pycoCircuitOverrides = circuitOverrides;
    window.__pycoCircuitWireOverrides = circuitWireOverrides;

    btnClose.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    btnZoomIn.addEventListener('click',  () => applyZoom(currentScale * 1.25));
    btnZoomOut.addEventListener('click', () => applyZoom(currentScale * 0.8));
    btnZoomFit.addEventListener('click', () => { panX = 0; panY = 0; applyZoom(1); });

    // 保存は画面のテーマに関わらず用紙版で書き出す。記事に貼ったり印刷したり
    // する用途なので、黒い地の図が出てくると使いにくいため。
    function paperSvgStr() {
      try {
        return generateCircuitSVG(workspace, {
          overrides: circuitOverrides,
          wireOverrides: circuitWireOverrides,
          dark: false,
        }).svg;
      } catch (err) {
        console.error('[circuit-save]', err);
        return currentSvgStr;
      }
    }

    // テーマ切替から呼ばれる。拡大表示が開いているときだけ描き直す。
    window.__pycoCircuitRerender = function() {
      if (modal.style.display !== 'none') renderInto(wrap);
    };

    if (btnDlSvg) btnDlSvg.addEventListener('click', function() {
      const blob = new Blob([paperSvgStr()], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'circuit.svg';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    if (btnDlPng) btnDlPng.addEventListener('click', function() {
      const svgEl = wrap.querySelector('svg');
      if (!svgEl) return;
      const w = svgEl.viewBox.baseVal.width  || svgEl.width.baseVal.value;
      const h = svgEl.viewBox.baseVal.height || svgEl.height.baseVal.value;
      const canvas = document.createElement('canvas');
      canvas.width = w * 2; canvas.height = h * 2;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'circuit.png';
        a.click();
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(paperSvgStr());
    });
  })();

  window.addEventListener('resize', syncMainViewportHeight);
  syncMainViewportHeight();

  // ===== Blockly 初期表示ズームをビューポート幅に合わせる =====
  // ツールボックスが横幅で隠れる問題を回避。初回のみ実行し、以降の手動ズームは尊重する
  function autoFitInitialZoom() {
    if (!workspace) return;
    const blocklyDiv = document.getElementById('blockly-div');
    if (!blocklyDiv) return;
    const w = blocklyDiv.getBoundingClientRect().width;
    if (w <= 0) return;
    let scale;
    if (w >= 1400)      scale = 1.0;
    else if (w >= 1100) scale = 0.9;
    else if (w >= 900)  scale = 0.8;
    else if (w >= 700)  scale = 0.7;
    else if (w >= 500)  scale = 0.6;
    else                scale = 0.5;
    // スマホ・タブレット表示では指でつまむので小さすぎると扱えない（0.5 だと文字が約 8px）。
    // 画面が広いタブレットは等倍、スマホは 0.75 にする
    if (document.body.classList.contains('mobile-mode')) scale = w >= 700 ? 1.0 : 0.75;
    // A+／A− で決めた大きさを保つ。文字の大きさ（localStorage に残る）と同じ割合を掛けるので、
    // 再読み込みやサンプルを開いた後の自動ズームで、ブロックだけ元の大きさへ戻ることがない
    if (typeof currentFontSize === 'number' && currentFontSize > 0) scale *= currentFontSize / FONT_DEFAULT;
    workspace.setScale(scale);
    Blockly.svgResize(workspace);
  }

  // 読み込んだブロックの左上を、作業域の左上（余白 20px）に合わせる。
  //   Blockly は読込後の見える位置を動かさないので、座標が左や上にあるサンプルは
  //   左端がカテゴリ一覧の下にもぐり、「化する 幅 640…」のように途中から見えていた。
  function showBlocksTopLeft() {
    if (!workspace) return;
    const box = workspace.getBlocksBoundingBox();
    if (!box || box.right - box.left <= 0) return;
    const s = workspace.scale;
    // scrollX/Y はスクロール位置。ブロック座標 x は画面の x*scale + scrollX に描かれる
    workspace.scroll(20 - box.left * s, 20 - box.top * s);
  }
  // 読込のあとに使う組。レイアウトが落ち着いてから拡大率を合わせ、そのあとで位置を合わせる
  function fitAfterLoad() {
    requestAnimationFrame(function() { requestAnimationFrame(function() { autoFitInitialZoom(); showBlocksTopLeft(); }); });
  }

  // micro:bit のツールボックスに、ボードに関係ない共通カテゴリを Pico 用から写して足す。
  // 同じ XML を 2 か所に書くと片方だけ直して食い違うので、元は toolbox-micropython の 1 つだけにする
  // micro:bit のツールボックス：ループ・論理などは Pico 用（toolbox-micropython）と同じブロックを使う。
  // app.html の <category data-common="型 型 …"> に、その型のブロックを Pico 用からコピーして入れる
  // （カテゴリに直接書いた micro:bit 専用ブロックは後ろに回す）。
  // 色は MakeCode に合わせ、micro:bit モードで作られたときだけカテゴリの色に塗り替える。
  // 文言は Pico 版の記事と同じままにする（2026-11-02 先生判断）。
  (function buildMicrobitToolbox() {
    const src = document.getElementById('toolbox-micropython');
    const dst = document.getElementById('toolbox-microbit');
    if (!src || !dst) return;
    const recolor = {};
    dst.querySelectorAll('category[data-common]').forEach(function(cat) {
      const own = Array.from(cat.children);
      const colour = cat.getAttribute('colour');
      cat.getAttribute('data-common').trim().split(/\s+/).forEach(function(type) {
        // data-dup：Pico 用で 2 つのカテゴリに置いた同じブロック（変数カテゴリの val_var）。写すと 2 つ並ぶので外す
        src.querySelectorAll('category > block[type="' + type + '"]:not([data-dup])').forEach(function(b) {
          cat.appendChild(b.cloneNode(true));
        });
        recolor[type] = colour;
      });
      own.forEach(function(el) { cat.appendChild(el); });
    });
    Object.keys(recolor).forEach(function(type) {
      const def = Blockly.Blocks[type];
      if (!def || def._mbRecolor) return;
      const init = def.init;
      def.init = function() {
        init.apply(this, arguments);
        if (!(currentBoard === 'microbit' && currentMode === 'micropython')) return;
        if (type === 'val_str') {
          // 差し込み口に置いた文字（シャドウ）は MakeCode と同じく白地に赤い「"」にする。
          // シャドウは colourSecondary で塗られるので、それだけ白にした色の組を使う
          // 色の組は黒・白どちらのテーマにも入れる（描画側は組をテーマ切り替えのときにまとめて読む）
          const style = { colourPrimary: recolor[type], colourSecondary: '#ffffff', colourTertiary: '#c8c8c8', hat: '' };
          [pcbTheme, lightTheme].forEach(function(th) { if (!th.blockStyles['mb_text']) th.setBlockStyle('mb_text', style); });
          const cp = this.workspace.getRenderer().getConstants();
          if (!cp.blockStyles['mb_text']) cp.setTheme(this.workspace.getTheme());
          this.setStyle('mb_text');
          this.inputList[0].fieldRow.forEach(function(fd) { if (fd instanceof Blockly.FieldLabel) fd.class = 'mbQuote'; });
          return;
        }
        this.setColour(recolor[type]);
      };
      def._mbRecolor = true;
    });
  })();

  // ===== 初期化 =====
  // URLパラメータ ?mode=micropython（Pico）/ microbit でモードを指定できる（省略時は python）
  const _urlParams = new URLSearchParams(window.location.search);
  const _urlMode = _urlParams.get('mode');
  applyMode((_urlMode === 'micropython' || _urlMode === 'microbit' || _urlMode === 'game') ? _urlMode : 'python', false);
  // 前に配線図を［非表示］にしていれば、開いたときから畳んでおく（モードを切り替えたときは switchMode で同じことをする）
  collapseCircuitForMobile();

  // モード適用後にレイアウトが落ち着いてからオートフィット
  requestAnimationFrame(() => requestAnimationFrame(autoFitInitialZoom));

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
        fitAfterLoad();
      })
      .catch(function(err) { console.warn('PycoBlocks: ?src= load failed:', err); });
  }

  // URL の共有ハッシュ（#x1= / #xml=）でワークスペースを復元
  //   #x1=  … 辞書v1付き deflate（現行）
  //   #xml= … 無辞書 deflate（旧形式・後方互換）
  var _hash = window.location.hash || '';
  var _hashV1 = _hash.match(/[#&]x1=([^&]+)/);
  var _hashLegacy = _hash.match(/[#&]xml=([^&]+)/);
  if (_hashV1 || _hashLegacy) {
    try {
      if (typeof pako === 'undefined') throw new Error('pako 未読み込み');
      var _xmlText;
      if (_hashV1) {
        if (!_SHARE_DICT_V1) throw new Error('共有辞書(share_dict.js)が未読み込み');
        _xmlText = new TextDecoder().decode(
          pako.inflateRaw(_base64UrlToBytes(_hashV1[1]), { dictionary: _SHARE_DICT_V1 }));
      } else {
        _xmlText = new TextDecoder().decode(pako.inflateRaw(_base64UrlToBytes(_hashLegacy[1])));
      }
      var _dom = Blockly.utils.xml.textToDom(_xmlText);
      var _rootName = (_dom.tagName || _dom.localName || '').toLowerCase();
      // ハッシュに編集モード(#m=)が含まれていれば、ブロック読込前に切り替える
      // （ツールボックス/生成コードを共有元と一致させ、未知ブロック化を防ぐ）
      var _hashMode = _hash.match(/[#&]m=([^&]+)/);
      if (_hashMode) {
        var _m = _hashMode[1];
        if ((_m === 'python' || _m === 'game' || _m === 'micropython' || _m === 'microbit') && _m !== modeKey()) {
          applyMode(_m, false);
        }
      }
      workspace.clear();
      if (_rootName === 'project') {
        _loadProjectXml(_dom);
      } else {
        Blockly.Xml.domToWorkspace(_dom, workspace);
      }
      if (typeof generateCode === 'function') generateCode();
      fitAfterLoad();
    } catch (err) {
      console.warn('PycoBlocks: 共有ハッシュの復元に失敗:', err);
      alert('共有URLのブロックを復元できませんでした。URLが途中で切れていないか確認してください。');
    }
  }

  // ============================================================
  // 自動保存(js/autosave.js)向けブリッジ
  //   ワークスペースのシリアライズ/復元を、共有URL(#x1=)や ?src= と同じ経路で
  //   1か所にまとめて公開する。autosave.js だけでなく将来の Firebase 保存でも
  //   この serialize/restore をそのまま使い回せるようにするのが目的。
  //     - serialize()      … 現在の作品を XML 文字列にする（複数ファイルは <project>）
  //     - restore(text)    … XML 文字列をワークスペースに読み込む（共有/`?src=` と同経路）
  //     - getMode()        … 'python' / 'game' / 'micropython' / 'microbit'
  //     - hasUrlSource()   … 共有URLや ?src= 指定があるか（自動復元の優先判定用）
  // ============================================================
  function _autosaveSerialize() {
    // アクティブファイルの現在のワークスペースを XML 化（座標も残して並び位置を保持）
    var activeDom = Blockly.Xml.workspaceToDom(workspace);
    var activeXmlText = Blockly.Xml.domToText(activeDom);
    // 単一ファイルなら共有URLと同じ <xml> 表現をそのまま返す
    if (!pyFiles || pyFiles.length <= 1) return activeXmlText;
    // マルチファイル(自作モジュールタブ等)は <project><file><xml>…</xml></file></project>
    // にまとめる。この構造は _loadProjectXml(=共有/`?src=` の復元経路)がそのまま読める。
    function _escAttr(s) {
      return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }
    var parts = ['<project>'];
    for (var i = 0; i < pyFiles.length; i++) {
      var f = pyFiles[i];
      var xmlText = (i === activeFileIdx) ? activeXmlText : (f.blockXml || '');
      parts.push('<file name="' + _escAttr(f.name) + '">');
      if (xmlText) parts.push(xmlText);
      parts.push('</file>');
    }
    parts.push('</project>');
    return parts.join('');
  }
  function _autosaveRestore(text) {
    // 共有ハッシュの復元(上のブロック)と同じ手順でワークスペースへ展開する
    var dom = Blockly.utils.xml.textToDom(text);
    var rootName = (dom.tagName || dom.localName || '').toLowerCase();
    // 復元は「元に戻す」の対象にしない（もどすを押すと作品が消えて空になるため）
    var rec = Blockly.Events.getRecordUndo();
    Blockly.Events.setRecordUndo(false);
    try {
      workspace.clear();
      if (rootName === 'project') {
        _loadProjectXml(dom);
      } else {
        Blockly.Xml.domToWorkspace(dom, workspace);
      }
    } finally { Blockly.Events.setRecordUndo(rec); }
    if (typeof generateCode === 'function') generateCode();
    fitAfterLoad();
  }
  function _autosaveHasUrlSource() {
    var h = window.location.hash || '';
    if (/[#&]x1=/.test(h) || /[#&]xml=/.test(h)) return true;
    if (_urlParams && _urlParams.get('src')) return true;
    return false;
  }
  window.PycoWorkspaceIO = {
    workspace: workspace,
    getMode: function() { return modeKey(); },
    serialize: _autosaveSerialize,
    restore: _autosaveRestore,
    hasUrlSource: _autosaveHasUrlSource
  };
  // autosave.js が読み込まれていれば初期化する（復元→変更監視の開始）
  if (window.PycoAutosave && typeof window.PycoAutosave.init === 'function') {
    try { window.PycoAutosave.init(window.PycoWorkspaceIO); }
    catch (e) { console.warn('PycoBlocks: 自動保存の初期化に失敗:', e); }
  }
  // 保存も共有 URL も無い micro:bit は「最初だけ」「ずっと」を置いて始める（?src= の読込は非同期なので待たない）
  if (!_autosaveHasUrlSource()) placeMicrobitStarter();

  // ============================================================
  // モバイル編集モード
  //   - 自動判定（画面幅 ≤900px）＋ヘッダーの「スマホ表示」ボタンで手動切替
  //   - 手動切替は localStorage に記憶し、以後の自動判定より優先する
  //   - ボトムタブで #blockly-div と .code-panel を全画面切替
  //   - ペイン表示を切り替えたら Blockly.svgResize / editor.refresh を必ず呼ぶ
  //     （display:none から復帰した直後はサイズが 0 のままで潰れるため）
  // ============================================================
  (function setupMobileMode() {
    const body      = document.body;
    const toggleBtn = document.getElementById('btn-mobile-toggle');
    const tabbar    = document.getElementById('mobile-tabbar');
    if (!tabbar) return;

    const tabs     = tabbar.querySelectorAll('.m-tab');
    const mq       = window.matchMedia('(max-width: 900px)');
    const STORE_KEY = 'pyco-mobile-override'; // 'on' | 'off' | 未設定(=自動)

    // ツールメニュー（ドロワー）関連
    const menuBtn   = document.getElementById('btn-mobile-menu');
    const backdrop  = document.getElementById('mobile-menu-backdrop');
    const toolbar   = document.querySelector('.toolbar');

    function closeMenu() {
      body.classList.remove('menu-open');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    }
    function toggleMenu() {
      const open = !body.classList.contains('menu-open');
      body.classList.toggle('menu-open', open);
      if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function isMobileActive() {
      const ov = localStorage.getItem(STORE_KEY);
      if (ov === 'on')  return true;
      if (ov === 'off') return false;
      return mq.matches; // どちらでもなければ画面幅で自動判定
    }

    // display 復帰後のサイズ反映。両エディタが潰れないよう必ず呼ぶ
    function refreshPanes() {
      try {
        if (workspace) Blockly.svgResize(workspace);
      } catch (e) { /* noop */ }
      try {
        if (editor) editor.refresh();
      } catch (e) { /* noop */ }
    }

    function setPane(pane) {
      body.classList.remove('pane-blocks', 'pane-code');
      body.classList.add('pane-' + pane);
      tabs.forEach(function(t) {
        t.classList.toggle('active', t.dataset.pane === pane);
        t.setAttribute('aria-pressed', t.dataset.pane === pane ? 'true' : 'false');  // 読み上げでも「いまどちら」
      });
      // クラス適用→レイアウト確定後にリサイズ。
      // エラーパネルが出ていれば、ブロックタブに戻ったときに作業域をパネルの上まで縮める（ゴミ箱が隠れていた・r5 05 R5-03）
      requestAnimationFrame(function() { refreshPanes(); fitWorkspaceAboveErrorPanel(true); });
    }

    function applyMobile(on) {
      body.classList.toggle('mobile-mode', on);
      if (!on) closeMenu(); // PC 表示へ戻すときはドロワーを閉じる
      if (toggleBtn) {
        toggleBtn.textContent = on ? 'PC表示' : 'スマホ表示';
        toggleBtn.classList.toggle('active', on);
      }
      if (on && !body.classList.contains('pane-blocks') && !body.classList.contains('pane-code')) {
        setPane('blocks'); // 初回は「ブロック」タブから
      } else {
        requestAnimationFrame(refreshPanes);
      }
      if (typeof syncRunFab === 'function') syncRunFab(); // FAB の表示/有効状態を反映
      requestAnimationFrame(autoFitInitialZoom);   // スマホ表示用の拡大率に合わせ直す
      if (on) collapseCircuitForMobile();
    }

    // ボトムタブのクリックでペイン切替
    tabs.forEach(function(t) {
      t.addEventListener('click', function() { setPane(t.dataset.pane); });
    });

    // ヘッダーの手動トグル（localStorage に記憶して自動判定より優先）
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        const next = !body.classList.contains('mobile-mode');
        localStorage.setItem(STORE_KEY, next ? 'on' : 'off');
        applyMobile(next);
      });
    }

    // 画面幅の変化に追従（手動オーバーライドが無いときだけ）
    mq.addEventListener('change', function() {
      if (localStorage.getItem(STORE_KEY) === null) applyMobile(mq.matches);
    });

    // 実行ボタンを押したら結果が見えるタブへ自動遷移
    //   通常/MicroPython：結果はコード・モニタ側 → 「コード・実行」タブ
    //   ゲーム：ゲーム画面は左列にある        → 「ブロック」タブ
    //   micro:bit のシミュレータ：LED の盤面は「ブロック」タブ側 → 切り替えない
    //   （コード・実行タブへ移ると盤面が見えず、「押したのに光らない」に見えていた）
    ['btn-run', 'btn-run-python'].forEach(function(id) {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', function() {
        if (!body.classList.contains('mobile-mode')) return;
        const isGame = (typeof currentMode !== 'undefined') && currentMode === 'game';
        const isMbSim = id === 'btn-run' && currentBoard === 'microbit' &&
          !(typeof PicoSerial !== 'undefined' && PicoSerial.isConnected());
        setPane((isGame || isMbSim) ? 'blocks' : 'code');
      });
    });

    // ----- フローティング実行ボタン（ドロワー外・右下） -----
    // モードで切り替わる実体ボタン(btn-run-python / btn-run)のうち、
    // いま表示中＝有効なものへ委譲する。状態(disabled/表示)はそれに同期。
    //   実行中は同じボタンが「■ 停止」になり、押すと止まる（止めるためにタブを戻ってシミュレータの
    //   停止を探さなくてよいように）。実行ボタンと停止ボタンは組（STOP_OF）で持つ。
    const runFab = document.getElementById('btn-mobile-run');
    // スマホ表示では、下のタブの「▶ 実行／■ 停止」が正。☰ メニューの中の実行・停止（.tb-dup-mobile）は
    // 2 つ目になって迷うので見えなくする。display:none にすると、どの実行ボタンが今のモードのものかを
    // 表示（display）で調べている所（このタブ・Ctrl+Enter）が見つけられなくなるので、visibility で隠す
    if (!document.getElementById('pyco-dup-mobile-style')) {
      const st = document.createElement('style');
      st.id = 'pyco-dup-mobile-style';
      st.textContent = 'body.mobile-mode .tb-dup-mobile{visibility:hidden!important;position:absolute!important;' +
        'width:1px!important;height:1px!important;min-width:0!important;min-height:0!important;overflow:hidden!important;' +
        'margin:0!important;padding:0!important;border:0!important;pointer-events:none!important;}';
      document.head.appendChild(st);
    }
    const realRunBtns = ['btn-run-python', 'btn-run']
      .map(function(id) { return document.getElementById(id); })
      .filter(Boolean);
    const STOP_OF = { 'btn-run-python': 'btn-stop-python', 'btn-run': 'btn-stop' };
    // 実行中で、組の停止ボタンが押せるなら、その停止ボタンを返す
    function activeStopBtn(target) {
      if (!target || !target.disabled) return null;
      const st = document.getElementById(STOP_OF[target.id]);
      if (!st || st.disabled || getComputedStyle(st).display === 'none') return null;
      return st;
    }

    function activeRunBtn() {
      // display:none でない（＝そのモードで使う）実行ボタンを返す
      for (let i = 0; i < realRunBtns.length; i++) {
        if (getComputedStyle(realRunBtns[i]).display !== 'none') return realRunBtns[i];
      }
      return null;
    }
    function syncRunFab() {
      if (!runFab) return;
      const target = activeRunBtn();
      const stop = activeStopBtn(target);
      // 使える実行ボタンが無いモード（例：MicroPython DEMO）は隠す
      runFab.style.display = target ? '' : 'none';
      runFab.disabled = stop ? false : (target ? target.disabled : true);
      const label = stop ? '■ 停止' : '▶ 実行';
      if (runFab.textContent !== label) runFab.textContent = label;
      runFab.title = stop ? '実行を止める' : (target && target.disabled ? (target.title || '実行') : '実行');
      runFab.setAttribute('aria-label', stop ? '停止' : '実行');
    }
    if (runFab) {
      runFab.addEventListener('click', function() {
        const target = activeRunBtn();
        const stop = activeStopBtn(target);
        if (stop) { stop.click(); return; }
        if (target && !target.disabled) target.click(); // 実体ボタンの click を発火
      });
      // 実体ボタン（実行・停止）の disabled / display 変化に追従
      const ro = new MutationObserver(syncRunFab);
      realRunBtns.concat(Object.values(STOP_OF).map(function(id) { return document.getElementById(id); }).filter(Boolean))
        .forEach(function(b) {
          ro.observe(b, { attributes: true, attributeFilter: ['disabled', 'style'] });
        });
    }

    // ☰ メニューでドロワー開閉、背景タップで閉じる
    if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    // Esc でも閉じる（キーボードや外付けキーボードのタブレット）。閉じたら開いたボタンへフォーカスを戻す
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape' || !body.classList.contains('menu-open')) return;
      closeMenu();
      if (menuBtn) menuBtn.focus();
    });

    // ドロワー内のボタンをタップしたら自動で閉じる（操作後すぐ編集に戻れる）
    if (toolbar) {
      toolbar.addEventListener('click', function(e) {
        if (!body.classList.contains('mobile-mode')) return;
        if (e.target.closest('button')) closeMenu();
      });
    }

    // 初期適用
    applyMobile(isMobileActive());
  })();
});
