// =============================================================
// PycoBlocks ブロック自動保存・復元
//   - ワークスペースの変更を約1秒デバウンスして localStorage に保存する
//   - ページ読込時、共有URL(#x1=/#xml=)や ?src= が無ければ前回の作品を
//     サイレント復元し、控えめなトーストで知らせる
//   - シリアライズ/復元は app.js が公開する window.PycoWorkspaceIO を再利用する
//     （＝共有URL機能とまったく同じ表現。将来 Firebase 保存でも使い回せる）
//
//   授業中の事故防止が目的なので、保存の失敗(容量超過など)でアプリを
//   止めないよう、ストレージ操作はすべて try/catch で握りつぶす。
// =============================================================
(function() {
  'use strict';

  var KEY_PREFIX  = 'pyco-autosave-'; // 実キーはモード別: -python / -game / -micropython
  var DEBOUNCE_MS = 1000;             // 変更が落ち着いてから保存するまでの待ち時間

  function storageKey(mode) { return KEY_PREFIX + mode; }

  // ---- localStorage 入出力（失敗しても例外を投げない）----
  function saveToStorage(mode, text) {
    try {
      window.localStorage.setItem(storageKey(mode), text);
      return true;
    } catch (e) {
      // QuotaExceededError など。保存に失敗してもアプリは継続させる
      console.warn('PycoBlocks: 自動保存に失敗しました（容量超過など）:', e);
      return false;
    }
  }
  function loadFromStorage(mode) {
    try { return window.localStorage.getItem(storageKey(mode)); }
    catch (e) { console.warn('PycoBlocks: 自動保存の読み込みに失敗:', e); return null; }
  }
  function removeFromStorage(mode) {
    try { window.localStorage.removeItem(storageKey(mode)); }
    catch (e) { /* プライベートモード等で読み取り専用のことがある。無視 */ }
  }

  // ---- 復元通知トースト（外部依存なし・2.5秒で自動的に消える）----
  function showToast(msg) {
    try {
      var el = document.createElement('div');
      el.textContent = msg;
      el.setAttribute('role', 'status');
      el.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
        'z-index:99999', 'max-width:90vw',
        'padding:10px 18px', 'border-radius:20px',
        'background:rgba(33,33,33,0.92)', 'color:#fff',
        'font-size:14px', 'font-family:sans-serif', 'line-height:1.4',
        'box-shadow:0 2px 10px rgba(0,0,0,0.3)',
        'opacity:0', 'transition:opacity 0.3s ease', 'pointer-events:none'
      ].join(';');
      document.body.appendChild(el);
      // フェードイン → 一定時間後フェードアウト → 削除
      requestAnimationFrame(function() { el.style.opacity = '1'; });
      setTimeout(function() {
        el.style.opacity = '0';
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
      }, 2500);
    } catch (e) { /* 通知はおまけ。失敗しても無視 */ }
  }

  // ---- UIイベント(スクロール/選択/クリック等)かどうか判定 ----
  //   これらは作品内容を変えないので保存トリガーにしない。
  function isNonContentEvent(ev) {
    if (!ev) return true;
    var B = window.Blockly;
    // Blockly 12 のイベントは isUiEvent プロパティを持つ
    if (ev.isUiEvent) return true;
    if (B && B.Events) {
      if (typeof B.Events.isUiEvent === 'function' && B.Events.isUiEvent(ev.type)) return true;
      // 読み込み完了/ビューポート移動などのメタイベントも保存不要
      if (ev.type === B.Events.FINISHED_LOADING) return true;
      if (ev.type === B.Events.VIEWPORT_CHANGE) return true;
    }
    return false;
  }

  // ---- 本体 ----
  function init(io) {
    if (!io || !io.workspace) {
      console.warn('PycoBlocks: 自動保存を初期化できません（PycoWorkspaceIO 不在）');
      return;
    }

    // (1) 復元判定
    //   共有URL(#x1=/#xml=)や ?src= が指定されているときは、そちらを優先し
    //   自動保存からは復元しない（ただし自動保存データは消さない）。
    if (!io.hasUrlSource()) {
      var mode  = io.getMode();
      var saved = loadFromStorage(mode);
      if (saved != null && saved !== '') {
        try {
          io.restore(saved);
          showToast('前回の作業を復元しました');
        } catch (e) {
          // XML破損など。壊れたデータは削除して普通に起動する
          console.warn('PycoBlocks: 自動保存の復元に失敗したため削除します:', e);
          removeFromStorage(mode);
        }
      }
    }

    // (2) 自動保存: ワークスペースの変更をデバウンスして保存
    var timer = null;
    function scheduleSave() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function() {
        timer = null;
        saveNow();
      }, DEBOUNCE_MS);
    }
    function saveNow() {
      // 保存時点のモードで保存する（モード別キーへ振り分け）
      var mode = io.getMode();
      try {
        var text = io.serialize();
        saveToStorage(mode, text);
      } catch (e) {
        console.warn('PycoBlocks: シリアライズに失敗:', e);
      }
    }

    io.workspace.addChangeListener(function(ev) {
      if (isNonContentEvent(ev)) return;
      scheduleSave();
    });

    // 将来のクラウド保存(Firebase)等から即時保存を呼べるように公開
    window.PycoAutosave.saveNow  = saveNow;
    window.PycoAutosave.load     = loadFromStorage;
    window.PycoAutosave.clear    = removeFromStorage;
    window.PycoAutosave.storageKey = storageKey;
  }

  window.PycoAutosave = { init: init };
})();
