// =============================================================
// PycoBlocks 学習モード（チュートリアル）エンジン
//
//   設計方針:
//   - app.js 本体には触れず、window.PycoWorkspaceIO（serialize/restore/
//     getMode）と Blockly.getMainWorkspace()、DOM 要素だけで連携する疎結合。
//   - レッスン定義は外部 JSON（lessons/<id>.json）。#lesson=0-00 でも起動。
//   - 判定は宣言的 check（blocksRequired / blocksMin / xmlEquals /
//     outputEquals / choice[拡張]）。ワークスペース変更と実行出力の
//     どちらの変化でも現ステップを再評価する。
//   - 進捗保存・修了証は js/tutorial_progress.js（window.PycoTutorialProgress）。
//
//   授業中の事故防止のため、失敗してもアプリ本体は絶対に止めない。
// =============================================================
(function() {
  'use strict';

  // ---- 定数 ----
  var LESSON_BASE  = 'lessons/';                 // レッスン JSON の置き場所
  var BACKUP_KEY   = 'pyco-tutorial-backup-';    // レッスン開始前の作品退避キー（+mode）
  var HASH_RE      = /[#&]lesson=([0-9A-Za-z_-]+)/;

  // ---- 状態 ----
  var io          = null;   // window.PycoWorkspaceIO
  var lesson      = null;   // 現在のレッスン定義（JSON）
  var stepIndex   = 0;      // 現ステップ
  var isOpen      = false;
  var backupXml   = null;   // レッスン開始前の作品（復帰用）
  var savedMode   = null;   // 開始時のモード（ツールボックス復元用）
  var indexCache  = null;   // lessons/index.json
  var monObserver = null;   // #monitor-output の変化監視
  var wrongCount  = 0;      // クイズの誤答数（スコア算出用）
  var quizTotal   = 0;      // クイズステップ数

  // =============================================================
  // 汎用ユーティリティ
  // =============================================================
  function getWs() {
    try {
      if (io && io.workspace) return io.workspace;
      return window.Blockly && window.Blockly.getMainWorkspace ? window.Blockly.getMainWorkspace() : null;
    } catch (e) { return null; }
  }
  function getMode() {
    try { return (io && io.getMode) ? io.getMode() : 'python'; } catch (e) { return 'python'; }
  }
  function $(id) { return document.getElementById(id); }

  function toast(msg, kind) {
    try {
      var el = document.createElement('div');
      el.textContent = msg;
      el.setAttribute('role', 'status');
      var bg = kind === 'error' ? 'rgba(160,30,30,0.94)'
             : kind === 'ok'    ? 'rgba(20,90,40,0.94)'
             :                    'rgba(20,30,20,0.94)';
      el.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
        'z-index:100000', 'max-width:90vw', 'padding:10px 18px', 'border-radius:18px',
        'background:' + bg, 'color:#fff', 'font-size:14px', 'font-family:sans-serif',
        'line-height:1.4', 'box-shadow:0 2px 10px rgba(0,0,0,0.4)',
        'opacity:0', 'transition:opacity .3s ease', 'pointer-events:none'
      ].join(';');
      document.body.appendChild(el);
      requestAnimationFrame(function() { el.style.opacity = '1'; });
      setTimeout(function() {
        el.style.opacity = '0';
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
      }, kind === 'error' ? 4200 : 2400);
    } catch (e) { /* noop */ }
  }

  // 限定サニタイザ（app-DESKTOP-IFAJQUL.js の setSafeRichText を踏襲）
  function setSafeRichText(targetEl, htmlStr) {
    if (!targetEl) return;
    var raw = (htmlStr == null) ? '' : String(htmlStr);
    if (!raw) { targetEl.replaceChildren(); return; }
    var allowed = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'CODE', 'PRE', 'UL', 'OL', 'LI', 'SPAN', 'H4']);
    var parser = new DOMParser();
    var doc = parser.parseFromString('<div>' + raw + '</div>', 'text/html');
    var root = doc.body && doc.body.firstElementChild;
    if (!root) { targetEl.textContent = raw; return; }
    function cloneSafe(node) {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
      if (node.nodeType !== Node.ELEMENT_NODE) return null;
      var tag = node.tagName;
      if (!allowed.has(tag)) return document.createTextNode(node.textContent || '');
      var el = document.createElement(tag.toLowerCase());
      Array.from(node.childNodes).forEach(function(c) {
        var s = cloneSafe(c); if (s) el.appendChild(s);
      });
      return el;
    }
    var frag = document.createDocumentFragment();
    Array.from(root.childNodes).forEach(function(c) {
      var s = cloneSafe(c); if (s) frag.appendChild(s);
    });
    targetEl.replaceChildren(frag);
  }

  // =============================================================
  // スタイル注入（既存の端末風・緑テーマを踏襲）
  // =============================================================
  var STYLE_ID = 'pyco-tutorial-style';
  function injectStyle() {
    if ($(STYLE_ID)) return;
    var css = ''
    + '#pyco-tut-panel{position:fixed;top:0;right:0;bottom:0;width:min(360px,100vw);'
    + 'background:var(--bg-panel,#070d07);border-left:1px solid var(--border-dim,#1a341a);'
    + 'box-shadow:-4px 0 24px rgba(0,0,0,.45);z-index:9000;display:flex;flex-direction:column;'
    + 'transform:translateX(100%);transition:transform .28s ease;font-family:var(--font-mono,monospace);'
    + 'color:var(--text-primary,#c8e6c8);}'
    + '#pyco-tut-panel.open{transform:translateX(0);}'
    + '#pyco-tut-panel.collapsed{transform:translateX(calc(100% - 34px));}'
    + '.pyco-tut-head{display:flex;align-items:center;gap:8px;padding:10px 12px;'
    + 'border-bottom:1px solid var(--border-dim,#1a341a);flex-shrink:0;}'
    + '.pyco-tut-head .t{font-size:.82rem;font-weight:bold;color:var(--accent-green,#00ff41);'
    + 'letter-spacing:.06em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.pyco-tut-head button{background:transparent;border:1px solid var(--border-dim,#1a341a);'
    + 'color:var(--text-dim,#5a8a5a);cursor:pointer;font:inherit;font-size:.72rem;padding:3px 8px;'
    + 'border-radius:4px;}'
    + '.pyco-tut-head button:hover{color:var(--accent-green,#00ff41);border-color:var(--accent-green,#00ff41);}'
    + '.pyco-tut-pbar{height:4px;background:var(--bg-surface,#0b150b);flex-shrink:0;}'
    + '.pyco-tut-pbar-fill{height:100%;background:var(--accent-green,#00ff41);width:0;transition:width .3s ease;'
    + 'box-shadow:0 0 6px var(--accent-green,#00ff41);}'
    + '.pyco-tut-body{flex:1;overflow-y:auto;padding:14px 14px 18px;}'
    + '.pyco-tut-step-title{font-size:.98rem;font-weight:bold;color:var(--accent-cyan,#00d4ff);margin:0 0 8px;}'
    + '.pyco-tut-quizbadge{display:inline-block;font-size:.62rem;background:var(--accent-amber,#ffb700);'
    + 'color:#111;font-weight:bold;padding:1px 7px;border-radius:10px;margin-right:6px;vertical-align:middle;'
    + 'letter-spacing:.05em;}'
    + '.pyco-tut-text{font-size:.86rem;line-height:1.7;}'
    + '.pyco-tut-text p{margin:0 0 .7em;} .pyco-tut-text ul,.pyco-tut-text ol{margin:.3em 0 .8em 1.2em;}'
    + '.pyco-tut-text code{background:var(--bg-surface,#0b150b);color:var(--accent-green,#00ff41);'
    + 'padding:1px 5px;border-radius:4px;font-size:.9em;}'
    + '.pyco-tut-text pre{background:var(--bg-surface,#0b150b);border:1px solid var(--border-dim,#1a341a);'
    + 'border-radius:6px;padding:8px 10px;overflow-x:auto;color:var(--text-code,#00ff41);font-size:.84em;}'
    // ステップ画像（ブロック図）：白カードに載せてブロックの視認性を確保
    + '.pyco-tut-img{background:#fff;border:1px solid var(--border-dim,#1a341a);border-radius:6px;'
    + 'padding:8px;margin:10px 0;text-align:center;}'
    + '.pyco-tut-img img{max-width:100%;height:auto;display:inline-block;vertical-align:middle;}'
    + '.pyco-tut-hint{margin-top:12px;}'
    + '.pyco-tut-hint-toggle{background:transparent;border:1px dashed var(--accent-amber,#ffb700);'
    + 'color:var(--accent-amber,#ffb700);cursor:pointer;font:inherit;font-size:.76rem;padding:5px 10px;'
    + 'border-radius:6px;width:100%;text-align:left;}'
    + '.pyco-tut-hint-body{display:none;margin-top:8px;font-size:.82rem;line-height:1.6;'
    + 'background:rgba(255,183,0,.08);border-left:3px solid var(--accent-amber,#ffb700);padding:8px 10px;'
    + 'border-radius:0 6px 6px 0;}'
    + '.pyco-tut-choices{margin-top:12px;display:flex;flex-direction:column;gap:8px;}'
    + '.pyco-tut-choice{text-align:left;background:var(--bg-surface,#0b150b);'
    + 'border:1px solid var(--border-dim,#1a341a);color:var(--text-primary,#c8e6c8);cursor:pointer;'
    + 'font:inherit;font-size:.84rem;padding:9px 12px;border-radius:6px;transition:all .15s ease;}'
    + '.pyco-tut-choice:hover{border-color:var(--accent-cyan,#00d4ff);}'
    + '.pyco-tut-choice.correct{border-color:var(--accent-green,#00ff41);color:var(--accent-green,#00ff41);'
    + 'background:rgba(0,255,65,.1);} '
    + '.pyco-tut-choice.wrong{border-color:#e05252;color:#e05252;background:rgba(224,82,82,.1);}'
    + '.pyco-tut-foot{border-top:1px solid var(--border-dim,#1a341a);padding:10px 12px;flex-shrink:0;}'
    + '.pyco-tut-check{font-size:.82rem;margin-bottom:8px;color:var(--text-dim,#5a8a5a);}'
    + '.pyco-tut-check.done{color:var(--accent-green,#00ff41);font-weight:bold;}'
    + '.pyco-tut-navbtns{display:flex;gap:8px;}'
    + '.pyco-tut-navbtns button{flex:1;background:transparent;border:1px solid var(--border-dim,#1a341a);'
    + 'color:var(--text-primary,#c8e6c8);cursor:pointer;font:inherit;font-size:.8rem;padding:8px 6px;'
    + 'border-radius:6px;transition:all .15s ease;}'
    + '.pyco-tut-navbtns button.primary{border-color:var(--accent-green,#00ff41);color:var(--accent-green,#00ff41);}'
    + '.pyco-tut-navbtns button:disabled{opacity:.4;cursor:not-allowed;}'
    + '.pyco-tut-navbtns button:not(:disabled):hover{border-color:var(--accent-cyan,#00d4ff);color:var(--accent-cyan,#00d4ff);}'
    // 完了画面
    + '.pyco-tut-done{text-align:center;padding:20px 6px;}'
    + '.pyco-tut-done .big{font-size:2.4rem;margin-bottom:10px;}'
    + '.pyco-tut-done h4{color:var(--accent-green,#00ff41);font-size:1.05rem;margin:0 0 6px;}'
    // モーダル（一覧・修了証）
    + '.pyco-tut-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:99000;'
    + 'display:flex;align-items:center;justify-content:center;padding:16px;}'
    + '.pyco-tut-modal{background:var(--bg-panel,#070d07);border:1px solid var(--border-dim,#1a341a);'
    + 'border-radius:10px;width:min(560px,96vw);max-height:92vh;display:flex;flex-direction:column;'
    + 'font-family:var(--font-mono,monospace);color:var(--text-primary,#c8e6c8);box-shadow:0 8px 40px rgba(0,0,0,.6);}'
    + '.pyco-tut-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;'
    + 'border-bottom:1px solid var(--border-dim,#1a341a);}'
    + '.pyco-tut-modal-head .mt{color:var(--accent-green,#00ff41);font-weight:bold;font-size:1rem;}'
    + '.pyco-tut-modal-head button{background:none;border:none;color:var(--text-dim,#5a8a5a);cursor:pointer;'
    + 'font:inherit;font-size:.82rem;}'
    + '.pyco-tut-modal-body{padding:14px 16px;overflow-y:auto;}'
    + '.pyco-tut-lessonrow{display:flex;align-items:center;gap:10px;width:100%;text-align:left;'
    + 'background:var(--bg-surface,#0b150b);border:1px solid var(--border-dim,#1a341a);'
    + 'color:var(--text-primary,#c8e6c8);cursor:pointer;font:inherit;padding:11px 13px;border-radius:8px;'
    + 'margin-bottom:9px;transition:all .15s ease;}'
    + '.pyco-tut-lessonrow:hover:not(:disabled){border-color:var(--accent-green,#00ff41);}'
    + '.pyco-tut-lessonrow:disabled{opacity:.55;cursor:not-allowed;}'
    + '.pyco-tut-lessonrow .num{color:var(--accent-cyan,#00d4ff);font-size:.78rem;font-weight:bold;'
    + 'min-width:38px;}'
    + '.pyco-tut-lessonrow .nm{flex:1;font-size:.88rem;}'
    + '.pyco-tut-lessonrow .st{font-size:.72rem;color:var(--text-dim,#5a8a5a);}'
    + '.pyco-tut-lessonrow .st.done{color:var(--accent-green,#00ff41);}'
    + '.pyco-tut-certbtn{width:100%;margin-top:6px;background:transparent;'
    + 'border:1px solid var(--accent-amber,#ffb700);color:var(--accent-amber,#ffb700);cursor:pointer;'
    + 'font:inherit;font-size:.86rem;padding:11px;border-radius:8px;font-weight:bold;}'
    + '.pyco-tut-certbtn:disabled{opacity:.4;cursor:not-allowed;}'
    // ヘッダーの学習ボタンの見た目（塗り・.tutorial-active反転）は css/style.css 側で定義
    // コールアウト：対象要素のハイライト枠（パルス）
    + '#pyco-tut-highlight{position:fixed;z-index:9050;pointer-events:none;display:none;'
    + 'border:2px solid var(--accent-amber,#ffb700);border-radius:8px;'
    + 'animation:pycoTutPulse 1.5s ease-in-out infinite;}'
    + '@keyframes pycoTutPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,183,0,.55);}'
    + '50%{box-shadow:0 0 0 9px rgba(255,183,0,0);}}'
    // コールアウト：吹き出し本体＋三角矢印
    + '#pyco-tut-callout{position:fixed;z-index:9100;pointer-events:none;display:none;'
    + 'max-width:260px;background:#0b150b;border:1px solid var(--accent-amber,#ffb700);'
    + 'color:var(--text-primary,#c8e6c8);font-family:var(--font-mono,monospace);'
    + 'font-size:.8rem;line-height:1.55;padding:9px 12px;border-radius:6px;'
    + 'box-shadow:0 4px 18px rgba(0,0,0,.55);}'
    + '#pyco-tut-callout .pyco-tut-callout-arrow{position:absolute;width:0;height:0;'
    + 'border:8px solid transparent;}'
    + '#pyco-tut-callout .arrow-right{left:-16px;border-right-color:var(--accent-amber,#ffb700);}'
    + '#pyco-tut-callout .arrow-left{right:-16px;border-left-color:var(--accent-amber,#ffb700);}'
    + '#pyco-tut-callout .arrow-bottom{top:-16px;border-bottom-color:var(--accent-amber,#ffb700);}'
    + '#pyco-tut-callout .arrow-top{bottom:-16px;border-top-color:var(--accent-amber,#ffb700);}'
    // モバイル：下部シート化
    + '@media (max-width:900px){#pyco-tut-panel{top:auto;left:0;right:0;bottom:56px;width:100%;'
    + 'height:auto;max-height:48vh;border-left:none;border-top:1px solid var(--border-dim,#1a341a);'
    + 'transform:translateY(100%);box-shadow:0 -4px 24px rgba(0,0,0,.45);}'
    + '#pyco-tut-panel.open{transform:translateY(0);}'
    + '#pyco-tut-panel.collapsed{transform:translateY(calc(100% - 40px));}}';
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = css;
    document.head.appendChild(st);
  }

  // =============================================================
  // パネル DOM 構築
  // =============================================================
  var panel = null, els = {};
  function buildPanel() {
    if (panel) return panel;
    injectStyle();
    panel = document.createElement('aside');
    panel.id = 'pyco-tut-panel';
    panel.setAttribute('aria-label', '学習モード');
    panel.innerHTML = ''
      + '<div class="pyco-tut-head">'
      +   '<span class="t" id="pyco-tut-lesson-title">学習モード</span>'
      +   '<button type="button" id="pyco-tut-collapse" title="折りたたむ">▶</button>'
      +   '<button type="button" id="pyco-tut-close" title="学習をやめる">✕</button>'
      + '</div>'
      + '<div class="pyco-tut-pbar"><div class="pyco-tut-pbar-fill" id="pyco-tut-pbar-fill"></div></div>'
      + '<div class="pyco-tut-body" id="pyco-tut-body"></div>'
      + '<div class="pyco-tut-foot">'
      +   '<div class="pyco-tut-check" id="pyco-tut-check">○ 待機中</div>'
      +   '<div class="pyco-tut-navbtns">'
      +     '<button type="button" id="pyco-tut-prev">◀ もどる</button>'
      +     '<button type="button" id="pyco-tut-next" class="primary" disabled>次へ ▶</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(panel);
    els.lessonTitle = $('pyco-tut-lesson-title');
    els.collapse = $('pyco-tut-collapse');
    els.close = $('pyco-tut-close');
    els.pbar = $('pyco-tut-pbar-fill');
    els.body = $('pyco-tut-body');
    els.check = $('pyco-tut-check');
    els.prev = $('pyco-tut-prev');
    els.next = $('pyco-tut-next');
    els.nav = panel.querySelector('.pyco-tut-navbtns');

    els.close.addEventListener('click', function() { endLesson(false); });
    els.collapse.addEventListener('click', toggleCollapse);
    els.prev.addEventListener('click', prevStep);
    els.next.addEventListener('click', nextStep);
    return panel;
  }
  function toggleCollapse() {
    var c = panel.classList.toggle('collapsed');
    els.collapse.textContent = c ? '◀' : '▶';
    resizeBlockly();
  }
  function resizeBlockly() {
    try {
      var ws = getWs();
      if (ws && window.Blockly) setTimeout(function() {
        window.Blockly.svgResize(ws);
        positionCallout(); // パネル開閉でレイアウトが動いた後に追従
      }, 300);
    } catch (e) { /* noop */ }
  }

  // =============================================================
  // コールアウト（吹き出し＋ハイライト枠）
  //   step.callout = { target, text?, placement? }
  //   target: エリア別名 / CSSセレクタ / {block:"種名"}（最初の該当ブロック）
  //   placement: top/bottom/left/right（省略時は見切れない側を自動選択）
  //   text 省略時・スマホレイアウト時はハイライト枠のみ表示。
  //   追従: window resize/scroll ＋ ワークスペース全イベント
  //   （VIEWPORT_CHANGE などの UI イベント含む）で再配置。
  // =============================================================
  // エリア別名 → 要素解決（DOM 構造変更に強いよう関数で解決）
  var AREA_ALIASES = {
    'toolbox': function() {
      // Blockly のツールボックス DOM はバージョンでクラス名が変わるため
      // API（getToolbox().HtmlDiv）を最優先で使う
      try {
        var ws = getWs();
        var tb = ws && ws.getToolbox && ws.getToolbox();
        if (tb && tb.HtmlDiv) return tb.HtmlDiv;
      } catch (e) { /* noop */ }
      return document.querySelector('.blocklyToolboxDiv') || document.querySelector('.blocklyToolbox');
    },
    'workspace':    function() { return $('blockly-div'); },
    'code':         function() { return $('code-editor'); },
    'output':       function() { return $('monitor-panel') || $('monitor-output'); },
    'run':          function() {
      // モードで実体が切り替わる実行ボタンのうち、表示中のものを返す
      var ids = ['btn-run-python', 'btn-run'];
      for (var i = 0; i < ids.length; i++) {
        var el = $(ids[i]);
        if (el && window.getComputedStyle(el).display !== 'none') return el;
      }
      return null;
    },
    'learn-button': function() { return $('btn-tutorial'); },
    'code-panel':   function() { return document.querySelector('.code-panel'); }
  };

  var calloutBubble = null, calloutHl = null, currentCallout = null;

  function isMobileLayout() {
    return window.innerWidth <= 900 || document.body.classList.contains('mobile-mode');
  }

  function ensureCalloutDom() {
    if (calloutBubble) return;
    injectStyle();
    calloutHl = document.createElement('div');
    calloutHl.id = 'pyco-tut-highlight';
    calloutHl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(calloutHl);

    calloutBubble = document.createElement('div');
    calloutBubble.id = 'pyco-tut-callout';
    calloutBubble.setAttribute('role', 'note');
    var txt = document.createElement('span');
    txt.className = 'pyco-tut-callout-text';
    var ar = document.createElement('span');
    ar.className = 'pyco-tut-callout-arrow';
    calloutBubble.appendChild(txt);
    calloutBubble.appendChild(ar);
    document.body.appendChild(calloutBubble);
  }

  function showCallout(callout) {
    currentCallout = callout || null;
    if (!currentCallout) { hideCallout(); return; }
    ensureCalloutDom();
    positionCallout();
  }
  function hideCallout() {
    currentCallout = null;
    hideCalloutVisual();
  }
  function hideCalloutVisual() {
    if (calloutBubble) calloutBubble.style.display = 'none';
    if (calloutHl) calloutHl.style.display = 'none';
  }

  // ターゲット指定 → 画面座標 rect（不可視・画面外なら null）
  function resolveTargetRect(target) {
    if (!target) return null;
    try {
      // (c) ブロック指定 {block:"print_text"} = 該当種の最初のブロック
      if (typeof target === 'object' && target.block) {
        var ws = getWs();
        if (!ws) return null;
        var blocks = ws.getAllBlocks(false);
        var blk = null;
        for (var i = 0; i < blocks.length; i++) {
          if (blocks[i].type === target.block) { blk = blocks[i]; break; }
        }
        if (!blk || !blk.getSvgRoot) return null;
        var root = blk.getSvgRoot();
        if (!root) return null;
        var r = root.getBoundingClientRect();
        // ワークスペース表示領域の外（ズーム/スクロールで見えない）なら隠す
        var wsEl = $('blockly-div');
        if (wsEl) {
          var wr = wsEl.getBoundingClientRect();
          if (r.right < wr.left || r.left > wr.right || r.bottom < wr.top || r.top > wr.bottom) return null;
        }
        return r;
      }
      // (a) エリア別名 / (b) CSSセレクタ
      var el = null;
      if (typeof target === 'string') {
        if (AREA_ALIASES[target]) el = AREA_ALIASES[target]();
        else { try { el = document.querySelector(target); } catch (e) { el = null; } }
      }
      if (!el) return null;
      if (window.getComputedStyle(el).display === 'none') return null;
      var rect = el.getBoundingClientRect();
      if (rect.width <= 0 && rect.height <= 0) return null;
      return rect;
    } catch (e) { return null; }
  }

  function positionCallout() {
    if (!currentCallout || !isOpen) { hideCalloutVisual(); return; }
    ensureCalloutDom();
    var rect = resolveTargetRect(currentCallout.target);
    var vw = window.innerWidth, vh = window.innerHeight;
    // 対象なし・画面外 → 両方隠す
    if (!rect || rect.right < 0 || rect.left > vw || rect.bottom < 0 || rect.top > vh) {
      hideCalloutVisual();
      return;
    }

    // ハイライト枠（常に表示）
    var pad = 3;
    calloutHl.style.display = 'block';
    calloutHl.style.left   = (rect.left - pad) + 'px';
    calloutHl.style.top    = (rect.top - pad) + 'px';
    calloutHl.style.width  = (rect.width + pad * 2) + 'px';
    calloutHl.style.height = (rect.height + pad * 2) + 'px';

    // 吹き出し（text 無し・スマホレイアウトでは出さない＝枠のみ）
    var text = currentCallout.text;
    if (!text || isMobileLayout()) {
      calloutBubble.style.display = 'none';
      return;
    }
    var txtEl = calloutBubble.querySelector('.pyco-tut-callout-text');
    txtEl.textContent = String(text);
    calloutBubble.style.display = 'block';
    calloutBubble.style.left = '0px';
    calloutBubble.style.top = '-9999px'; // 一旦画面外でサイズ計測
    var bw = calloutBubble.offsetWidth, bh = calloutBubble.offsetHeight;

    // 学習パネルが右に開いているときは、その左端までを配置可能領域とする。
    // ただしターゲット自体がパネル境界より右にある場合（狭い画面で
    // ヘッダーのボタンがパネル下に重なる等）は全幅で配置し、ターゲット
    // から離れないことを優先する（吹き出しはパネルより手前に描画される）。
    var limitRight = vw;
    if (panel && panel.classList.contains('open') && !panel.classList.contains('collapsed') && vw > 900) {
      try {
        var pl = panel.getBoundingClientRect().left;
        if (rect.right <= pl) limitRight = Math.min(vw, pl);
      } catch (e) { /* noop */ }
    }

    var GAP = 12;
    var spaces = {
      right:  limitRight - rect.right,
      left:   rect.left,
      bottom: vh - rect.bottom,
      top:    rect.top
    };
    function fits(s) {
      if (s === 'right')  return spaces.right  >= bw + GAP + 8;
      if (s === 'left')   return spaces.left   >= bw + GAP + 8;
      if (s === 'bottom') return spaces.bottom >= bh + GAP + 8;
      if (s === 'top')    return spaces.top    >= bh + GAP + 8;
      return false;
    }
    var side = currentCallout.placement;
    if (!spaces.hasOwnProperty(side) || !fits(side)) {
      // 指定なし or 見切れる → 余白の大きい順で収まる側を自動選択
      var order = ['right', 'left', 'bottom', 'top'].sort(function(a, b) { return spaces[b] - spaces[a]; });
      side = order[0];
      for (var i = 0; i < order.length; i++) { if (fits(order[i])) { side = order[i]; break; } }
    }

    var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    var left, top;
    if (side === 'right')       { left = rect.right + GAP;    top = cy - bh / 2; }
    else if (side === 'left')   { left = rect.left - bw - GAP; top = cy - bh / 2; }
    else if (side === 'bottom') { left = cx - bw / 2;          top = rect.bottom + GAP; }
    else                        { left = cx - bw / 2;          top = rect.top - bh - GAP; }
    left = Math.max(8, Math.min(left, limitRight - bw - 8));
    top  = Math.max(8, Math.min(top, vh - bh - 8));
    calloutBubble.style.left = left + 'px';
    calloutBubble.style.top  = top + 'px';

    // 矢印（吹き出しの対象側の辺・対象中心に向けて位置調整）
    var ar = calloutBubble.querySelector('.pyco-tut-callout-arrow');
    ar.className = 'pyco-tut-callout-arrow arrow-' + side;
    if (side === 'right' || side === 'left') {
      var ay = Math.max(6, Math.min(cy - top - 8, bh - 22));
      ar.style.top = ay + 'px';
      ar.style.left = '';
      ar.style.right = '';
    } else {
      var ax = Math.max(6, Math.min(cx - left - 8, bw - 22));
      ar.style.left = ax + 'px';
      ar.style.top = '';
      ar.style.bottom = '';
    }
  }

  // =============================================================
  // レッスンのロード
  //   二段構え: (1) <script src="lessons/*.js"> で事前読込された
  //   window.PYCO_LESSONS / PYCO_LESSONS_INDEX を最優先で使う
  //   （file:// 直開きでは fetch が「URL scheme "file" is not
  //   supported」で失敗するため）。
  //   (2) 見つからなければ従来どおり lessons/*.json を fetch する
  //   （#05 以降を JS 化し忘れても http(s) 配信なら動く保険）。
  //   JS 版は tools/build_lessons.py で JSON から自動生成する。
  // =============================================================
  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }
  function loadIndex() {
    if (indexCache) return Promise.resolve(indexCache);
    if (window.PYCO_LESSONS_INDEX) {
      indexCache = window.PYCO_LESSONS_INDEX;
      return Promise.resolve(indexCache);
    }
    return fetchJson(LESSON_BASE + 'index.json').then(function(j) { indexCache = j; return j; });
  }
  function loadLesson(id) {
    var preloaded = window.PYCO_LESSONS && window.PYCO_LESSONS[id];
    var p = preloaded ? Promise.resolve(preloaded)
                      : fetchJson(LESSON_BASE + id + '.json');
    return p.then(function(def) {
      // xmlEquals 用の模範 XML を先読み（JS 化版は _xml に埋め込み済み）
      var xmlNeeds = (def.steps || [])
        .filter(function(s) { return s.check && s.check.xmlEquals; })
        .map(function(s) { return s.check.xmlEquals; })
        .filter(function(fn) { return !(def._xml && def._xml[fn]); });
      if (!xmlNeeds.length) return def;
      return Promise.all(xmlNeeds.map(function(fn) {
        return fetch(LESSON_BASE + 'xml/' + fn, { cache: 'no-cache' })
          .then(function(r) { return r.ok ? r.text() : ''; })
          .then(function(t) { def._xml = def._xml || {}; def._xml[fn] = t; })
          .catch(function() { def._xml = def._xml || {}; def._xml[fn] = ''; });
      })).then(function() { return def; });
    });
  }

  // =============================================================
  // レッスンの開始 / 終了
  // =============================================================
  function startLesson(id) {
    io = window.PycoWorkspaceIO || io;
    var ws = getWs();
    if (!ws) { toast('ワークスペースの準備ができていません。少し待ってからお試しください。', 'error'); return; }

    loadLesson(id).then(function(def) {
      // モード不一致は案内のみ（クロスモードは後続対応）
      var mode = getMode();
      if (def.mode && def.mode !== mode) {
        toast('このレッスンは「' + def.mode + '」モード向けです。モードを切り替えてからお試しください。', 'error');
        return;
      }
      // 進行中の作品を退避（完了/中断で戻す）
      try {
        backupXml = io && io.serialize ? io.serialize() : null;
        savedMode = mode;
        if (backupXml) window.localStorage.setItem(BACKUP_KEY + mode, backupXml);
      } catch (e) { backupXml = null; }

      lesson = def;
      stepIndex = 0;
      wrongCount = 0;
      quizTotal = (def.steps || []).filter(function(s) { return s.quiz; }).length;

      // ワークスペースを白紙に（レッスン用のツールボックスへ）
      try { ws.clear(); } catch (e) { /* noop */ }
      applyLessonToolbox(def);

      openPanel();
      els.lessonTitle.textContent = def.title || '学習モード';
      renderStep();
      startMonitorObserver();
      // URL ハッシュを揃える（共有・リロード対応）
      try {
        if (HASH_RE.test(location.hash)) {
          location.hash = location.hash.replace(HASH_RE, function(m, p, o) { return m[0] + 'lesson=' + id; });
        } else {
          history.replaceState(null, '', location.pathname + location.search + '#lesson=' + id);
        }
      } catch (e) { /* noop */ }
    }).catch(function(err) {
      console.warn('PycoBlocks: レッスンの読み込みに失敗:', err);
      toast('レッスンを読み込めませんでした（' + id + '）。', 'error');
    });
  }

  // レッスンを終了して元の作品へ戻す
  function endLesson(completed) {
    hideCallout();
    stopMonitorObserver();
    restoreToolbox();
    closePanel();
    // 作品を復元
    try {
      var mode = savedMode || getMode();
      var backup = backupXml;
      if (backup == null) {
        try { backup = window.localStorage.getItem(BACKUP_KEY + mode); } catch (e) { backup = null; }
      }
      var ws = getWs();
      if (ws) ws.clear();
      if (backup && io && io.restore) io.restore(backup);
      try { window.localStorage.removeItem(BACKUP_KEY + mode); } catch (e) { /* noop */ }
    } catch (e) { console.warn('PycoBlocks: 作品の復元に失敗:', e); }
    backupXml = null; savedMode = null; lesson = null;
    // ハッシュから lesson= を除去
    try {
      if (HASH_RE.test(location.hash)) {
        var h = location.hash.replace(HASH_RE, '').replace(/^#&/, '#').replace(/&&/, '&');
        history.replaceState(null, '', location.pathname + location.search + (h === '#' ? '' : h));
      }
    } catch (e) { /* noop */ }
    if (!completed) toast('学習モードを終了しました');
  }

  // =============================================================
  // ツールボックスの動的差し替え
  // =============================================================
  function applyLessonToolbox(def) {
    var ws = getWs();
    if (!ws) return;
    var list = def.toolbox;
    if (!Array.isArray(list) || !list.length) return; // 未指定ならモードの標準ツールボックスのまま
    // アプリの既存ツールボックスは全て category 形式。Blockly は
    // flyout ⇄ category のモード変更を許さないため、レッスン用も
    // 1つの category に包んで差し替える。
    var xml = document.createElement('xml');
    xml.setAttribute('id', 'pyco-tut-toolbox');
    var cat = document.createElement('category');
    cat.setAttribute('name', def.toolboxCategoryName || 'レッスンのブロック');
    cat.setAttribute('colour', def.toolboxColour || '#00ACC1');
    xml.appendChild(cat);
    list.forEach(function(entry) {
      // 文字列＝ブロック種、オブジェクト＝{type, xml(生XML)} も許可
      if (typeof entry === 'string') {
        var b = document.createElement('block');
        b.setAttribute('type', entry);
        b.setAttribute('gap', '8');
        cat.appendChild(b);
      } else if (entry && entry.xml) {
        try {
          var dom = window.Blockly.utils.xml.textToDom(entry.xml);
          cat.appendChild(dom);
        } catch (e) { /* skip */ }
      } else if (entry && entry.type) {
        var b2 = document.createElement('block');
        b2.setAttribute('type', entry.type);
        b2.setAttribute('gap', '8');
        cat.appendChild(b2);
      }
    });
    try { ws.updateToolbox(xml); } catch (e) { console.warn('PycoBlocks: ツールボックス差し替えに失敗:', e); }
  }
  function restoreToolbox() {
    var ws = getWs();
    if (!ws) return;
    var mode = savedMode || getMode();
    var el = $('toolbox-' + mode);
    if (el) { try { ws.updateToolbox(el); } catch (e) { /* noop */ } }
  }

  // =============================================================
  // パネル開閉
  // =============================================================
  function openPanel() {
    buildPanel();
    isOpen = true;
    panel.classList.add('open');
    panel.classList.remove('collapsed');
    els.collapse.textContent = '▶';
    var btn = $('btn-tutorial');
    if (btn) btn.classList.add('tutorial-active');
    resizeBlockly();
  }
  function closePanel() {
    isOpen = false;
    hideCallout();
    if (panel) panel.classList.remove('open');
    var btn = $('btn-tutorial');
    if (btn) btn.classList.remove('tutorial-active');
    resizeBlockly();
  }

  // =============================================================
  // 実行出力（#monitor-output）の監視
  // =============================================================
  function startMonitorObserver() {
    stopMonitorObserver();
    var out = $('monitor-output');
    if (!out || typeof MutationObserver === 'undefined') return;
    monObserver = new MutationObserver(function() { evaluateCurrent(); });
    monObserver.observe(out, { childList: true, subtree: true, characterData: true });
  }
  function stopMonitorObserver() {
    if (monObserver) { try { monObserver.disconnect(); } catch (e) {} monObserver = null; }
  }

  // =============================================================
  // ステップ描画
  // =============================================================
  function steps() { return (lesson && lesson.steps) || []; }

  function renderStep() {
    var all = steps();
    if (!all.length) return;
    stepIndex = Math.max(0, Math.min(stepIndex, all.length - 1));
    var step = all[stepIndex];
    var total = all.length;

    // 本文
    var html = '';
    html += '<h3 class="pyco-tut-step-title">'
          + (step.quiz ? '<span class="pyco-tut-quizbadge">クイズ</span>' : '')
          + escapeHtml(step.title || ('ステップ ' + (stepIndex + 1))) + '</h3>';
    html += '<div class="pyco-tut-text" id="pyco-tut-text"></div>';
    els.body.innerHTML = html;
    setSafeRichText($('pyco-tut-text'), step.body || '');

    // ステップ画像（ブロック図）。サニタイザに <img> は許さず専用フィールドで扱う。
    // step.image = "パス" | {src, alt} | それらの配列。パスは app.html からの相対。
    if (step.image) renderStepImages(step);

    // 選択式クイズ
    step._passed = false;
    if (step.check && step.check.choice) {
      renderChoices(step);
    }
    // ヒント
    if (step.hint) {
      var hintWrap = document.createElement('div');
      hintWrap.className = 'pyco-tut-hint';
      hintWrap.innerHTML = '<button type="button" class="pyco-tut-hint-toggle">ヒントを見る</button>'
        + '<div class="pyco-tut-hint-body" id="pyco-tut-hint-body"></div>';
      els.body.appendChild(hintWrap);
      setSafeRichText($('pyco-tut-hint-body'), step.hint);
      var hb = $('pyco-tut-hint-body');
      var ht = hintWrap.querySelector('.pyco-tut-hint-toggle');
      ht.addEventListener('click', function() {
        var shown = hb.style.display === 'block';
        hb.style.display = shown ? 'none' : 'block';
        ht.textContent = shown ? 'ヒントを見る' : 'ヒントを隠す';
      });
    }

    // 進捗バー / ナビ
    els.pbar.style.width = ((stepIndex + 1) / total * 100) + '%';
    els.prev.disabled = (stepIndex === 0);
    els.next.textContent = (stepIndex === total - 1) ? '完了 ✓' : '次へ ▶';

    // 実行が必要なステップの案内
    els.check.dataset.run = (step.check && (step.check.outputEquals != null || step.run)) ? '1' : '';

    evaluateCurrent();

    // コールアウト（吹き出し）。パネル開閉アニメ後にも再配置する
    if (step.callout) showCallout(step.callout); else hideCallout();
    setTimeout(positionCallout, 350);
  }

  // ステップ画像の描画（白カード＋@2x PNGを等倍相当で表示）
  function renderStepImages(step) {
    var items = Array.isArray(step.image) ? step.image : [step.image];
    items.forEach(function(item) {
      var src = (typeof item === 'string') ? item : (item && item.src);
      if (!src || typeof src !== 'string') return;
      var alt = (item && typeof item === 'object' && item.alt)
        ? item.alt
        : 'ブロックの組み合わせ図：' + (step.title || '');
      var card = document.createElement('div');
      card.className = 'pyco-tut-img';
      var img = document.createElement('img');
      img.alt = alt;
      img.loading = 'lazy';
      img.addEventListener('load', function() {
        // blockshot は device_scale_factor=2 で書き出されるため、
        // 1/2 サイズ＝実寸相当で表示（カード幅は超えない）
        try {
          var avail = Math.max(60, card.clientWidth - 18);
          img.style.width = Math.min(Math.round(img.naturalWidth / 2), avail) + 'px';
        } catch (e) { /* noop */ }
      });
      img.addEventListener('error', function() {
        // 読み込み失敗時はカードごと消してレイアウトを崩さない
        if (card.parentNode) card.parentNode.removeChild(card);
      });
      img.src = src;
      card.appendChild(img);
      els.body.appendChild(card);
    });
  }

  function renderChoices(step) {
    var wrap = document.createElement('div');
    wrap.className = 'pyco-tut-choices';
    var opts = step.check.choice.options || [];
    var answer = step.check.choice.answer;
    opts.forEach(function(label, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pyco-tut-choice';
      b.textContent = label;
      b.addEventListener('click', function() {
        if (step._passed) return;
        if (i === answer) {
          b.classList.add('correct');
          step._passed = true;
          Array.prototype.forEach.call(wrap.children, function(c) { c.disabled = true; });
          evaluateCurrent();
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          wrongCount++;
        }
      });
      wrap.appendChild(b);
    });
    els.body.appendChild(wrap);
  }

  // =============================================================
  // 判定
  // =============================================================
  function evaluateCurrent() {
    if (!isOpen) return;
    var step = steps()[stepIndex];
    if (!step) return;
    var passed = checkPasses(step);
    if (passed) {
      els.check.textContent = '✓ クリア！';
      els.check.className = 'pyco-tut-check done';
      els.next.disabled = false;
    } else {
      els.check.textContent = els.check.dataset.run
        ? '○ 「▶ 実行」を押して確かめよう'
        : '○ 待機中';
      els.check.className = 'pyco-tut-check';
      els.next.disabled = true;
    }
  }

  function checkPasses(step) {
    var chk = step.check;
    if (!chk) return true;               // 情報ステップ＝常に通過
    if (chk.choice) return step._passed === true;
    var ws = getWs();
    if (!ws) return false;

    if (chk.blocksRequired) {
      var types = new Set(ws.getAllBlocks(false).map(function(b) { return b.type; }));
      return chk.blocksRequired.every(function(t) { return types.has(t); });
    }
    if (chk.blocksMin) {
      var counts = {};
      ws.getAllBlocks(false).forEach(function(b) { counts[b.type] = (counts[b.type] || 0) + 1; });
      return Object.keys(chk.blocksMin).every(function(t) { return (counts[t] || 0) >= chk.blocksMin[t]; });
    }
    if (chk.outputEquals != null) {
      return normOutput() === normText(chk.outputEquals);
    }
    if (chk.xmlEquals) {
      var model = (lesson._xml && lesson._xml[chk.xmlEquals]) || '';
      if (!model) return false;
      return xmlStructMatch(ws, model);
    }
    return false;
  }

  // 実行結果テキストを正規化（「>>> 実行開始」などのプロンプト行を除去）
  function normOutput() {
    var out = $('monitor-output');
    if (!out) return '';
    var lines = (out.textContent || '').split('\n').filter(function(ln) {
      return !/^>>>/.test(ln.trim());
    });
    return normText(lines.join('\n'));
  }
  function normText(s) {
    return String(s == null ? '' : s).replace(/\r/g, '').replace(/[ \t]+$/gm, '').replace(/\n+$/,'').trim();
  }

  // 構造 XML 比較（id / 座標 / 変数id を無視して type・field 値を比較）
  function xmlStructMatch(ws, modelXmlText) {
    try {
      var curDom = window.Blockly.Xml.workspaceToDom(ws, true);
      var canonical = function(domNode) {
        function walk(node) {
          if (!node || node.nodeType !== 1) return null;
          var tag = node.tagName.toLowerCase();
          if (tag === 'block' || tag === 'shadow') {
            var o = { type: node.getAttribute('type'), fields: {}, children: [] };
            Array.from(node.children).forEach(function(ch) {
              var t = ch.tagName.toLowerCase();
              if (t === 'field') o.fields[ch.getAttribute('name')] = (ch.textContent || '').trim();
              else if (t === 'value' || t === 'statement' || t === 'next') {
                Array.from(ch.children).forEach(function(g) {
                  var w = walk(g); if (w) o.children.push({ slot: ch.getAttribute('name') || t, block: w });
                });
              }
            });
            return o;
          }
          // xml ルート等
          var arr = [];
          Array.from(node.children).forEach(function(ch) {
            if (ch.tagName.toLowerCase() === 'block') { var w = walk(ch); if (w) arr.push(w); }
          });
          return arr;
        }
        return walk(domNode);
      };
      var modelDom = window.Blockly.utils.xml.textToDom(modelXmlText);
      return JSON.stringify(canonical(curDom)) === JSON.stringify(canonical(modelDom));
    } catch (e) { return false; }
  }

  // =============================================================
  // ステップ遷移
  // =============================================================
  function nextStep() {
    var all = steps();
    if (stepIndex < all.length - 1) {
      stepIndex++;
      renderStep();
    } else {
      completeLesson();
    }
  }
  function prevStep() {
    if (stepIndex > 0) { stepIndex--; renderStep(); }
  }

  // =============================================================
  // レッスン完了
  // =============================================================
  function completeLesson() {
    var id = lesson.id;
    var group = lesson.group || null;
    var score = quizTotal > 0 ? Math.round(100 * quizTotal / (quizTotal + wrongCount)) : 100;
    // 進捗を保存
    try {
      if (window.PycoTutorialProgress && window.PycoTutorialProgress.markCompleted) {
        window.PycoTutorialProgress.markCompleted(id, { quizScore: score, group: group });
      }
    } catch (e) { console.warn('PycoBlocks: 進捗保存に失敗:', e); }

    // 完了画面（次のレッスン / 一覧へ）
    els.pbar.style.width = '100%';
    var nextId = findNextLesson(id);
    var doneHtml = ''
      + '<div class="pyco-tut-done">'
      + '<div class="big">✓</div>'
      + '<h4>レッスン完了！</h4>'
      + '<p class="pyco-tut-text">「' + escapeHtml(lesson.title || '') + '」をクリアしました。</p>'
      + (quizTotal > 0 ? '<p class="pyco-tut-text">クイズ得点: <b>' + score + '</b> 点</p>' : '')
      + '</div>';
    els.body.innerHTML = doneHtml;
    els.check.textContent = '✓ 完了しました';
    els.check.className = 'pyco-tut-check done';
    els.prev.disabled = true;
    els.next.disabled = false;

    // ナビボタンを差し替え（els.prev / els.next は detach するだけで破棄しない）
    var navwrap = els.nav;
    if (els.prev.parentNode) els.prev.parentNode.removeChild(els.prev);
    if (els.next.parentNode) els.next.parentNode.removeChild(els.next);
    navwrap.innerHTML = '';
    if (nextId) {
      var nb = document.createElement('button');
      nb.type = 'button'; nb.className = 'primary';
      nb.textContent = '次のレッスンへ ▶';
      nb.addEventListener('click', function() {
        rebuildNav();
        startLesson(nextId);
      });
      navwrap.appendChild(nb);
    }
    var lb = document.createElement('button');
    lb.type = 'button';
    lb.textContent = '一覧へ';
    lb.addEventListener('click', function() {
      rebuildNav();
      endLesson(true);
      openLessonList();
    });
    navwrap.appendChild(lb);

    hideCallout();
    toast('レッスン「' + (lesson.title || id) + '」を完了しました！', 'ok');
  }
  // 完了画面で差し替えたナビを既定の prev/next に戻す
  function rebuildNav() {
    els.nav.innerHTML = '';
    els.nav.appendChild(els.prev);
    els.nav.appendChild(els.next);
  }

  function findNextLesson(curId) {
    if (!indexCache) return null;
    var groups = indexCache.groups || [];
    for (var g = 0; g < groups.length; g++) {
      var ls = groups[g].lessons || [];
      var i = ls.indexOf(curId);
      if (i >= 0 && i < ls.length - 1) {
        var cand = ls[i + 1];
        var meta = (indexCache.lessons || {})[cand];
        if (meta && meta.status === 'ready') return cand;
        return null;
      }
    }
    return null;
  }

  // =============================================================
  // レッスン一覧モーダル
  // =============================================================
  function openLessonList() {
    loadIndex().then(function(idx) {
      buildListModal(idx);
    }).catch(function(err) {
      console.warn('PycoBlocks: レッスン一覧を読み込めません:', err);
      toast('レッスン一覧を読み込めませんでした。', 'error');
    });
  }

  function buildListModal(idx) {
    injectStyle();
    var progress = (window.PycoTutorialProgress && window.PycoTutorialProgress.get)
      ? window.PycoTutorialProgress.get() : { lessons: {} };
    var overlay = document.createElement('div');
    overlay.className = 'pyco-tut-overlay';
    var modal = document.createElement('div');
    modal.className = 'pyco-tut-modal';
    overlay.appendChild(modal);

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }

    var head = document.createElement('div');
    head.className = 'pyco-tut-modal-head';
    head.innerHTML = '<span class="mt">学習モード（レッスン一覧）</span>';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button'; closeBtn.textContent = '閉じる';
    closeBtn.addEventListener('click', close);
    head.appendChild(closeBtn);
    modal.appendChild(head);

    var body = document.createElement('div');
    body.className = 'pyco-tut-modal-body';
    modal.appendChild(body);

    (idx.groups || []).forEach(function(group) {
      var h = document.createElement('h4');
      h.textContent = group.title || group.id;
      h.style.cssText = 'color:var(--accent-cyan,#00d4ff);margin:4px 0 10px;font-size:.92rem;';
      body.appendChild(h);

      var lessonIds = group.lessons || [];
      lessonIds.forEach(function(lid) {
        var meta = (idx.lessons || {})[lid] || {};
        var done = !!(progress.lessons && progress.lessons[lid] && progress.lessons[lid].completed);
        var ready = meta.status === 'ready';
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'pyco-tut-lessonrow';
        row.disabled = !ready;
        row.innerHTML = '<span class="num">' + escapeHtml(meta.subtitle || lid) + '</span>'
          + '<span class="nm">' + escapeHtml(meta.title || lid) + '</span>'
          + '<span class="st ' + (done ? 'done' : '') + '">'
          + (done ? '✓ 完了' : (ready ? '未受講' : '準備中')) + '</span>';
        if (ready) {
          row.addEventListener('click', function() { close(); startLesson(lid); });
        }
        body.appendChild(row);
      });

      // 修了証ボタン
      var allDone = lessonIds.every(function(lid) {
        return progress.lessons && progress.lessons[lid] && progress.lessons[lid].completed;
      });
      var certBtn = document.createElement('button');
      certBtn.type = 'button';
      certBtn.className = 'pyco-tut-certbtn';
      certBtn.textContent = allDone ? '修了証を発行する' : '修了証（全レッスン完了で発行）';
      certBtn.disabled = !allDone;
      certBtn.addEventListener('click', function() {
        if (window.PycoTutorialProgress && window.PycoTutorialProgress.showCertificate) {
          window.PycoTutorialProgress.showCertificate(group, idx);
        }
      });
      body.appendChild(certBtn);
    });

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
  }

  // =============================================================
  // ヘッダーボタン & URL ハッシュ起動
  // =============================================================
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function wireHeaderButton() {
    var btn = $('btn-tutorial');
    if (!btn) return;
    btn.addEventListener('click', function() {
      if (isOpen) { endLesson(false); }
      else { openLessonList(); }
    });
  }

  function checkHashLaunch() {
    var m = HASH_RE.exec(location.hash || '');
    if (m && m[1]) {
      // ワークスペース初期化直後の自動復元と競合しないよう少し遅延
      setTimeout(function() { startLesson(m[1]); }, 400);
    }
  }

  // =============================================================
  // 起動
  // =============================================================
  function start() {
    io = window.PycoWorkspaceIO;
    injectStyle();   // パネル未構築でも一覧モーダルが正しく表示されるよう先に注入
    wireHeaderButton();
    registerWsListener();
    // コールアウトの位置追従（ウィンドウリサイズ・ページ内スクロール）
    window.addEventListener('resize', positionCallout);
    window.addEventListener('scroll', positionCallout, true);
    checkHashLaunch();
  }

  // ワークスペースの変更で現ステップを再評価する（開いている間のみ動作）。
  // autosave.js と同じく UI イベント（選択・スクロール等）は無視する。
  var wsListenerAttached = false;
  function registerWsListener() {
    if (wsListenerAttached) return;
    var ws = getWs();
    if (!ws || !ws.addChangeListener) return;
    ws.addChangeListener(function(ev) {
      if (!isOpen) return;
      // コールアウトはスクロール/ズーム(VIEWPORT_CHANGE)・ブロック移動を
      // 含む全イベントで追従させる（UI イベントでも位置は変わるため）
      positionCallout();
      if (ev && ev.isUiEvent) return;
      evaluateCurrent();
    });
    wsListenerAttached = true;
  }
  function waitForIoThenStart() {
    var tries = 0;
    (function poll() {
      if (window.PycoWorkspaceIO && typeof window.PycoWorkspaceIO.serialize === 'function') {
        try { start(); } catch (e) { console.warn('PycoBlocks: 学習モード初期化に失敗:', e); }
        return;
      }
      if (++tries > 200) { console.warn('PycoBlocks: PycoWorkspaceIO 不在のため学習モードを初期化できません。'); return; }
      setTimeout(poll, 100);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForIoThenStart);
  } else {
    waitForIoThenStart();
  }

  // ---- 公開 API ----
  window.PycoTutorial = {
    start: startLesson,        // レッスンIDを指定して開始
    openList: openLessonList,  // 一覧を開く
    end: function() { endLesson(false); },
    isOpen: function() { return isOpen; }
  };
})();
