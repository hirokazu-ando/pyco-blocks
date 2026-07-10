// =============================================================
// PycoBlocks 学習モード 進捗・修了証
//
//   責務:
//   - localStorage `pyco-tutorial-progress` を唯一の真実として読み書き
//     （形: { lessons: { "0-00": { completed, completedAt, quizScore } }, name } ）
//   - Google ログイン中なら Firestore `users/{uid}/tutorial/progress` に
//     マージ同期する。cloud.js が初期化済みの Firebase アプリを getApps() で
//     再利用するため cloud.js には一切触らない（config 無効なら同期しない）。
//   - 修了証（グループ全完了で発行）モーダルと印刷。
//
//   ローカルが常に主。クラウド同期の失敗はアプリを止めず警告のみ。
// =============================================================
(function() {
  'use strict';

  var LS_KEY = 'pyco-tutorial-progress';

  // ---- Firebase（cloud.js の初期化を再利用。失敗しても無視）----
  var CFG = window.PYCO_FIREBASE_CONFIG;
  var fb = null;         // { fsMod, db, authMod, auth }
  var fbPromise = null;
  var currentUid = null;

  function cloudEnabled() { return !!(CFG && CFG.apiKey); }

  function loadFb() {
    if (!cloudEnabled()) return Promise.resolve(null);
    if (fb) return Promise.resolve(fb);
    if (fbPromise) return fbPromise;
    var SDK = 'https://www.gstatic.com/firebasejs/10.12.0/';
    fbPromise = Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]).then(function(mods) {
      var appMod = mods[0], authMod = mods[1], fsMod = mods[2];
      // cloud.js が initializeApp 済みなら再利用（重複初期化を避ける）
      var app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(CFG);
      var auth = authMod.getAuth(app);
      var db = fsMod.getFirestore(app);
      fb = { appMod: appMod, authMod: authMod, fsMod: fsMod, app: app, auth: auth, db: db };
      authMod.onAuthStateChanged(auth, function(user) {
        var prevUid = currentUid;
        currentUid = user ? user.uid : null;
        if (currentUid && currentUid !== prevUid) pullThenMerge();
      });
      return fb;
    }).catch(function(e) {
      fbPromise = null;
      console.warn('PycoBlocks: 学習進捗のクラウド同期を初期化できません:', e);
      return null;
    });
    return fbPromise;
  }

  function progressDoc() {
    return fb.fsMod.doc(fb.db, 'users', currentUid, 'tutorial', 'progress');
  }

  // ---- localStorage ----
  function readLocal() {
    try {
      var raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return { lessons: {} };
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return { lessons: {} };
      if (!o.lessons) o.lessons = {};
      return o;
    } catch (e) { return { lessons: {} }; }
  }
  function writeLocal(o) {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) { /* noop */ }
  }

  // 2つの進捗を合成（completed は OR、completedAt は最古、quizScore は最大）
  function mergeProgress(a, b) {
    var out = { lessons: {}, name: a.name || b.name || '' };
    var ids = new Set(Object.keys(a.lessons || {}).concat(Object.keys(b.lessons || {})));
    ids.forEach(function(id) {
      var x = (a.lessons || {})[id] || {};
      var y = (b.lessons || {})[id] || {};
      out.lessons[id] = {
        completed: !!(x.completed || y.completed),
        completedAt: [x.completedAt, y.completedAt].filter(Boolean).sort()[0] || null,
        quizScore: Math.max(x.quizScore || 0, y.quizScore || 0)
      };
    });
    return out;
  }

  // ---- クラウド同期 ----
  function pushToCloud() {
    if (!cloudEnabled()) return;
    loadFb().then(function(f) {
      if (!f || !currentUid) return;
      var local = readLocal();
      f.fsMod.setDoc(progressDoc(), local, { merge: true }).catch(function(err) {
        console.warn('PycoBlocks: 学習進捗のクラウド保存に失敗（ローカルには保存済み）:', err);
      });
    });
  }
  // ログイン確立時：クラウドを取得→ローカルとマージ→双方に反映
  function pullThenMerge() {
    if (!fb || !currentUid) return;
    fb.fsMod.getDoc(progressDoc()).then(function(snap) {
      var remote = snap.exists() ? (snap.data() || { lessons: {} }) : { lessons: {} };
      if (!remote.lessons) remote.lessons = {};
      var merged = mergeProgress(readLocal(), remote);
      writeLocal(merged);
      fb.fsMod.setDoc(progressDoc(), merged, { merge: true }).catch(function() {});
      notify();
    }).catch(function(err) {
      console.warn('PycoBlocks: 学習進捗のクラウド取得に失敗:', err);
    });
  }

  // ---- 変更通知（一覧の再描画などに利用可）----
  var listeners = [];
  function notify() { listeners.forEach(function(cb) { try { cb(readLocal()); } catch (e) {} }); }

  // =============================================================
  // 公開 API
  // =============================================================
  function get() { return readLocal(); }
  function isCompleted(id) {
    var p = readLocal();
    return !!(p.lessons[id] && p.lessons[id].completed);
  }
  function markCompleted(id, info) {
    info = info || {};
    var p = readLocal();
    var prev = p.lessons[id] || {};
    p.lessons[id] = {
      completed: true,
      completedAt: prev.completedAt || new Date().toISOString(),
      quizScore: Math.max(prev.quizScore || 0, info.quizScore || 0)
    };
    writeLocal(p);
    notify();
    pushToCloud();
    return p.lessons[id];
  }
  function setName(name) {
    var p = readLocal();
    p.name = String(name || '').slice(0, 40);
    writeLocal(p);
    notify();
    pushToCloud();
  }
  function groupComplete(lessonIds) {
    var p = readLocal();
    return (lessonIds || []).every(function(id) {
      return p.lessons[id] && p.lessons[id].completed;
    });
  }
  function onChange(cb) { if (typeof cb === 'function') listeners.push(cb); }

  // =============================================================
  // 修了証モーダル
  // =============================================================
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(iso) {
    try {
      var d = iso ? new Date(iso) : new Date();
      return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    } catch (e) { return ''; }
  }

  function showCertificate(group, idx) {
    var lessonIds = (group && group.lessons) || [];
    var progress = readLocal();
    if (!groupComplete(lessonIds)) {
      alert('このコースのすべてのレッスンを完了すると修了証を発行できます。');
      return;
    }
    var defaultName = progress.name || '';
    var name = window.prompt('修了証に印刷するお名前を入力してください。', defaultName);
    if (name === null) return;
    name = String(name).trim();
    if (name) setName(name);

    // 完了日 = グループ内で最も新しい completedAt
    var lastDate = lessonIds.map(function(id) {
      return (progress.lessons[id] && progress.lessons[id].completedAt) || '';
    }).filter(Boolean).sort().pop();

    var lessonsMeta = (idx && idx.lessons) || {};
    var rowsHtml = lessonIds.map(function(id) {
      var m = lessonsMeta[id] || {};
      var score = progress.lessons[id] ? progress.lessons[id].quizScore : null;
      return '<li>' + escapeHtml(m.subtitle ? (m.subtitle + ' ') : '') + escapeHtml(m.title || id)
        + (score != null ? ' <span class="cert-score">（' + score + '点）</span>' : '') + '</li>';
    }).join('');

    injectCertStyle();
    var overlay = document.createElement('div');
    overlay.className = 'pyco-cert-overlay';
    overlay.innerHTML = ''
      + '<div class="pyco-cert-shell">'
      +   '<div class="pyco-cert" id="pyco-cert">'
      +     '<div class="cert-brand">◆ PycoBlocks</div>'
      +     '<div class="cert-kind">修了証 · Certificate of Completion</div>'
      +     '<div class="cert-name">' + escapeHtml(name || 'あなた') + ' 殿</div>'
      +     '<p class="cert-lead">あなたは下記のコースを修了したことを証します。</p>'
      +     '<div class="cert-course">' + escapeHtml((group && (group.certificateTitle || group.title)) || '') + '</div>'
      +     '<ul class="cert-list">' + rowsHtml + '</ul>'
      +     '<div class="cert-date">修了日： ' + escapeHtml(fmtDate(lastDate)) + '</div>'
      +     '<div class="cert-sign">PycoBlocks 学習プログラム</div>'
      +   '</div>'
      +   '<div class="pyco-cert-actions">'
      +     '<button type="button" id="pyco-cert-print">印刷 / PDF保存</button>'
      +     '<button type="button" id="pyco-cert-close">閉じる</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(overlay);

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); document.removeEventListener('keydown', onKey); document.body.classList.remove('pyco-cert-printing'); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.getElementById('pyco-cert-close').addEventListener('click', close);
    document.getElementById('pyco-cert-print').addEventListener('click', function() {
      document.body.classList.add('pyco-cert-printing');
      window.print();
      setTimeout(function() { document.body.classList.remove('pyco-cert-printing'); }, 500);
    });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
  }

  function injectCertStyle() {
    if (document.getElementById('pyco-cert-style')) return;
    var css = ''
    + '.pyco-cert-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:99001;'
    + 'display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;}'
    + '.pyco-cert-shell{display:flex;flex-direction:column;gap:12px;align-items:center;}'
    + '.pyco-cert{width:min(640px,94vw);background:#fdfdf8;color:#1a2b1a;border:2px solid #0a7d34;'
    + 'border-radius:6px;padding:38px 34px;text-align:center;font-family:"Yu Mincho",serif;'
    + 'box-shadow:0 0 0 8px #fdfdf8,0 0 0 10px #0a7d34,0 10px 40px rgba(0,0,0,.5);position:relative;}'
    + '.cert-brand{font-size:1.05rem;font-weight:bold;color:#0a7d34;letter-spacing:.14em;}'
    + '.cert-kind{font-size:.72rem;color:#5a7a5a;letter-spacing:.3em;margin-top:4px;text-transform:uppercase;}'
    + '.cert-name{font-size:1.7rem;font-weight:bold;margin:26px 0 6px;border-bottom:1px solid #cbd8cb;'
    + 'display:inline-block;padding:0 20px 8px;}'
    + '.cert-lead{font-size:.9rem;color:#333;margin:14px 0 10px;}'
    + '.cert-course{font-size:1.15rem;font-weight:bold;color:#0a7d34;margin:6px 0 16px;}'
    + '.cert-list{list-style:none;padding:0;margin:0 auto 20px;display:inline-block;text-align:left;font-size:.9rem;}'
    + '.cert-list li{padding:3px 0;} .cert-score{color:#0a7d34;font-size:.82em;}'
    + '.cert-date{font-size:.95rem;margin-top:12px;} .cert-sign{margin-top:16px;font-size:.85rem;color:#5a7a5a;}'
    + '.pyco-cert-actions{display:flex;gap:10px;}'
    + '.pyco-cert-actions button{background:#0a7d34;color:#fff;border:none;border-radius:6px;'
    + 'padding:9px 20px;font-size:.9rem;cursor:pointer;font-family:sans-serif;}'
    + '.pyco-cert-actions button#pyco-cert-close{background:#444;}'
    + '@media print{'
    + 'body.pyco-cert-printing>*{display:none!important;}'
    + 'body.pyco-cert-printing .pyco-cert-overlay{display:block!important;position:static;background:#fff;padding:0;}'
    + 'body.pyco-cert-printing .pyco-cert-actions{display:none!important;}'
    + 'body.pyco-cert-printing .pyco-cert{box-shadow:none;border:2px solid #0a7d34;margin:0 auto;}}';
    var st = document.createElement('style');
    st.id = 'pyco-cert-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ---- 起動：クラウド設定があれば SDK を遅延読み込みして同期準備 ----
  if (cloudEnabled()) {
    var kick = function() { loadFb(); };
    if ('requestIdleCallback' in window) requestIdleCallback(kick, { timeout: 4000 });
    else setTimeout(kick, 1500);
  }

  window.PycoTutorialProgress = {
    get: get,
    isCompleted: isCompleted,
    markCompleted: markCompleted,
    groupComplete: groupComplete,
    setName: setName,
    onChange: onChange,
    showCertificate: showCertificate
  };
})();
