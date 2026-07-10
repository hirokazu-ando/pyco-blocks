// =============================================================
// PycoBlocks クラウド保存（Google ログイン + Cloud Firestore）
//
//   設計方針:
//   - window.PYCO_FIREBASE_CONFIG が未設定（null / apiKey なし）なら
//     「何もしない」。UI を一切追加せず、Firebase SDK も読み込まず、
//     コンソールに info を1行出すだけ。→ 現状のアプリに影響を与えない。
//   - 設定がある時だけ Firebase JS SDK（v10 モジュラー版）を gstatic から
//     dynamic import で遅延読み込みする。初期表示はブロックしない。
//   - 作品のシリアライズ/復元は既存の window.PycoWorkspaceIO を再利用する
//     （＝共有URL・localStorage 自動保存とまったく同じ XML 表現）。
//
//   データモデル:  users/{uid}/projects/{docId}
//     = { name, mode, xml, createdAt, updatedAt }
//
//   授業中の事故防止のため、失敗（オフライン・権限・容量超過など）は
//   すべて日本語トーストで知らせ、アプリ本体は絶対に止めない。
// =============================================================
(function() {
  'use strict';

  // ---- 設定チェック（最優先: 未設定なら即終了・DOM も SDK も触らない）----
  var CFG = window.PYCO_FIREBASE_CONFIG;
  if (!CFG || !CFG.apiKey) {
    console.info('PycoBlocks: Firebase 未設定のためクラウド保存は無効です'
      + '（有効化する場合は js/firebase_config.js を設定 / docs/FIREBASE-SETUP.md 参照）。');
    return;
  }

  // ---- 定数 ----
  var SDK_VERSION   = '10.12.0';                 // Firebase JS SDK バージョン
  var GSTATIC_BASE  = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/';
  var MAX_XML_BYTES = 800 * 1024;                // Firestore 1MB 制限対策（安全側 800KB）
  var PENDING_KEY   = 'pyco-cloud-pending-open'; // モード遷移をまたぐ読み込み予約

  // ---- 状態 ----
  var io          = null;   // window.PycoWorkspaceIO
  var fb          = null;   // 読み込んだ Firebase モジュール群
  var sdkPromise  = null;   // SDK 読み込み中の Promise（多重読み込み防止）
  var currentUser = null;   // ログイン中ユーザー（null=未ログイン）
  // 現在編集中の作品がクラウド由来のとき、その参照を保持（上書き保存の判定用）
  var openDoc     = { id: null, name: null, mode: null };

  // =============================================================
  // 汎用ユーティリティ
  // =============================================================

  // トースト（autosave.js と同じ見た目・外部依存なし）
  function toast(msg, kind) {
    try {
      var el = document.createElement('div');
      el.textContent = msg;
      el.setAttribute('role', 'status');
      var bg = kind === 'error' ? 'rgba(160,30,30,0.94)'
             : kind === 'ok'    ? 'rgba(20,90,40,0.94)'
             :                    'rgba(33,33,33,0.92)';
      el.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
        'z-index:99999', 'max-width:90vw',
        'padding:10px 18px', 'border-radius:20px',
        'background:' + bg, 'color:#fff',
        'font-size:14px', 'font-family:sans-serif', 'line-height:1.4',
        'box-shadow:0 2px 10px rgba(0,0,0,0.3)',
        'opacity:0', 'transition:opacity 0.3s ease', 'pointer-events:none'
      ].join(';');
      document.body.appendChild(el);
      requestAnimationFrame(function() { el.style.opacity = '1'; });
      var hold = kind === 'error' ? 4200 : 2600;
      setTimeout(function() {
        el.style.opacity = '0';
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
      }, hold);
    } catch (e) { /* 通知はおまけ。失敗しても無視 */ }
  }

  // Firebase / ネットワークのエラーを日本語メッセージに変換
  function friendlyError(err) {
    var code = (err && (err.code || err.message)) || '';
    code = String(code);
    if (/popup-closed-by-user|cancelled-popup-request|user-cancelled/.test(code))
      return 'ログインをキャンセルしました。';
    if (/popup-blocked/.test(code))
      return 'ポップアップがブロックされました。別の方法でログインを試します…';
    if (/network-request-failed|unavailable|failed to fetch|network error/i.test(code))
      return 'ネットワークに接続できませんでした。通信環境を確認してください。';
    if (/permission-denied|insufficient permissions/i.test(code))
      return '保存の権限がありません。ログイン状態やセキュリティルールを確認してください。';
    if (/unauthorized-domain/.test(code))
      return 'このドメインは許可されていません（Firebase の承認済みドメインに追加してください）。';
    if (/operation-not-allowed/.test(code))
      return 'Google ログインが有効になっていません（Firebase の設定を確認してください）。';
    if (/api-key-not-valid|invalid-api-key/.test(code))
      return 'Firebase の設定（apiKey）が正しくありません。js/firebase_config.js と docs/FIREBASE-SETUP.md を確認してください。';
    if (/quota|resource-exhausted/i.test(code))
      return '保存の上限に達しました。しばらく待って再度お試しください。';
    return 'エラーが発生しました: ' + code;
  }

  function utf8Bytes(str) {
    try { return new TextEncoder().encode(str).length; }
    catch (e) { return unescape(encodeURIComponent(str)).length; } // 古い環境向けフォールバック
  }

  // 日時を「7/10 14:30」風に整形
  function shortStamp(d) {
    d = d || new Date();
    var mm = d.getMonth() + 1, dd = d.getDate();
    var hh = ('0' + d.getHours()).slice(-2), mi = ('0' + d.getMinutes()).slice(-2);
    return mm + '/' + dd + ' ' + hh + ':' + mi;
  }

  // Firestore Timestamp / Date / number を Date に正規化
  function toDate(v) {
    if (!v) return null;
    if (typeof v.toDate === 'function') { try { return v.toDate(); } catch (e) { return null; } }
    if (v instanceof Date) return v;
    if (typeof v === 'number') return new Date(v);
    if (v.seconds != null) return new Date(v.seconds * 1000);
    return null;
  }

  function modeLabel(mode) {
    return mode === 'game' ? 'ゲーム' : mode === 'micropython' ? 'μPython' : 'Python';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // =============================================================
  // Firebase SDK 遅延読み込み
  // =============================================================
  function loadSdk() {
    if (fb) return Promise.resolve(fb);
    if (sdkPromise) return sdkPromise;
    sdkPromise = (function() {
      // dynamic import は通常スクリプトからでも Promise を返す（モジュール不要）
      return Promise.all([
        import(GSTATIC_BASE + 'firebase-app.js'),
        import(GSTATIC_BASE + 'firebase-auth.js'),
        import(GSTATIC_BASE + 'firebase-firestore.js')
      ]).then(function(mods) {
        var appMod = mods[0], authMod = mods[1], fsMod = mods[2];
        var app  = appMod.initializeApp(CFG);
        var auth = authMod.getAuth(app);
        var db   = fsMod.getFirestore(app);
        fb = { app: app, auth: auth, db: db, authMod: authMod, fsMod: fsMod };

        // signInWithRedirect のフォールバック結果を回収（戻ってきた直後）
        authMod.getRedirectResult(auth).catch(function(e) {
          console.warn('PycoBlocks: redirect ログイン結果の取得に失敗:', e);
        });
        // 認証状態の監視（ログイン/ログアウト/セッション復元で UI 更新）
        authMod.onAuthStateChanged(auth, function(user) {
          currentUser = user || null;
          renderCloudUi();
        });
        return fb;
      });
    })();
    sdkPromise.catch(function(e) {
      sdkPromise = null; // 失敗したら次回リトライできるように解放
      console.warn('PycoBlocks: Firebase SDK の読み込みに失敗:', e);
    });
    return sdkPromise;
  }

  // =============================================================
  // 認証
  // =============================================================
  function doLogin() {
    toast('ログイン中…');
    loadSdk().then(function(f) {
      var provider = new f.authMod.GoogleAuthProvider();
      return f.authMod.signInWithPopup(f.auth, provider).catch(function(err) {
        var code = String((err && err.code) || '');
        // ポップアップがブロック/未対応の環境（タブレットの Safari 等）は
        // リダイレクト方式にフォールバックする
        if (/popup-blocked|operation-not-supported|popup-closed-by-user|cancelled-popup-request/.test(code)) {
          if (/popup-closed-by-user|cancelled-popup-request/.test(code)) {
            toast(friendlyError(err));
            return;
          }
          toast('ポップアップが使えないため、画面を切り替えてログインします…');
          return f.authMod.signInWithRedirect(f.auth, provider);
        }
        throw err;
      });
    }).catch(function(err) {
      toast(friendlyError(err), 'error');
    });
  }

  function doLogout() {
    if (!fb) return;
    fb.authMod.signOut(fb.auth).then(function() {
      openDoc = { id: null, name: null, mode: null };
      toast('ログアウトしました');
    }).catch(function(err) {
      toast(friendlyError(err), 'error');
    });
  }

  // =============================================================
  // Firestore 保存 / 一覧 / 削除
  // =============================================================
  function projectsCol() {
    var f = fb;
    return f.fsMod.collection(f.db, 'users', currentUser.uid, 'projects');
  }
  function projectDoc(id) {
    var f = fb;
    return f.fsMod.doc(f.db, 'users', currentUser.uid, 'projects', id);
  }

  // 保存本体（asNew=true で新規 addDoc、false で既存 doc を上書き）
  function saveProject(name, asNew) {
    var f = fb;
    var mode = io.getMode();
    var xml;
    try { xml = io.serialize(); }
    catch (e) { toast('作品の内容を取得できませんでした。', 'error'); return; }

    var bytes = utf8Bytes(xml);
    if (bytes > MAX_XML_BYTES) {
      toast('作品が大きすぎて保存できません（' + Math.round(bytes / 1024) + 'KB / 上限800KB）。'
        + 'ブロックを減らすかファイルを分けてください。', 'error');
      return;
    }

    // 最新の作品内容を localStorage にも即時反映（端末側の保険）
    try { if (window.PycoAutosave && window.PycoAutosave.saveNow) window.PycoAutosave.saveNow(); }
    catch (e) { /* noop */ }

    var ts = f.fsMod.serverTimestamp();
    if (!asNew && openDoc.id && openDoc.mode === mode) {
      // 上書き保存（createdAt は merge で保持）
      var data = { name: name, mode: mode, xml: xml, updatedAt: ts };
      f.fsMod.setDoc(projectDoc(openDoc.id), data, { merge: true }).then(function() {
        openDoc.name = name;
        toast('「' + name + '」を上書き保存しました', 'ok');
      }).catch(function(err) { toast(friendlyError(err), 'error'); });
    } else {
      // 新規保存
      var data2 = { name: name, mode: mode, xml: xml, createdAt: ts, updatedAt: ts };
      f.fsMod.addDoc(projectsCol(), data2).then(function(ref) {
        openDoc = { id: ref.id, name: name, mode: mode };
        toast('「' + name + '」をクラウドに保存しました', 'ok');
      }).catch(function(err) { toast(friendlyError(err), 'error'); });
    }
  }

  function listProjects() {
    var f = fb;
    var q = f.fsMod.query(projectsCol(), f.fsMod.orderBy('updatedAt', 'desc'));
    return f.fsMod.getDocs(q).then(function(snap) {
      var out = [];
      snap.forEach(function(docSnap) {
        var d = docSnap.data() || {};
        out.push({
          id: docSnap.id,
          name: d.name || '(無題)',
          mode: d.mode || 'python',
          xml: d.xml || '',
          updatedAt: toDate(d.updatedAt) || toDate(d.createdAt)
        });
      });
      return out;
    });
  }

  function deleteProject(id) {
    return fb.fsMod.deleteDoc(projectDoc(id));
  }

  // =============================================================
  // 作品の読み込み（同一モード=その場、別モード=遷移して復元）
  // =============================================================
  function openProjectRecord(rec) {
    var curMode = io.getMode();
    if (rec.mode && rec.mode !== curMode) {
      // 別モードの作品 → app.html?mode=◯◯ へ遷移。復元は sessionStorage 予約経由
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({
          id: rec.id, name: rec.name, mode: rec.mode, xml: rec.xml, ts: Date.now()
        }));
      } catch (e) {
        toast('モードの切り替えに失敗しました。', 'error');
        return;
      }
      window.location.href = 'app.html?mode=' + encodeURIComponent(rec.mode);
      return;
    }
    // 同一モード → その場で確認のうえ復元
    if (workspaceHasBlocks() &&
        !window.confirm('今のワークスペースの内容を、選んだ作品で置き換えます。よろしいですか？')) {
      return;
    }
    try {
      io.restore(rec.xml);
      openDoc = { id: rec.id, name: rec.name, mode: rec.mode };
      if (window.PycoAutosave && window.PycoAutosave.saveNow) window.PycoAutosave.saveNow();
      toast('「' + rec.name + '」を開きました', 'ok');
    } catch (e) {
      console.warn('PycoBlocks: 作品の復元に失敗:', e);
      toast('作品を開けませんでした（データが壊れている可能性があります）。', 'error');
    }
  }

  function workspaceHasBlocks() {
    try {
      var ws = io.workspace;
      return !!(ws && ws.getTopBlocks && ws.getTopBlocks(false).length > 0);
    } catch (e) { return false; }
  }

  // 遷移後：モードをまたいで開く予約があれば復元する
  function consumePendingOpen() {
    var raw = null;
    try { raw = sessionStorage.getItem(PENDING_KEY); } catch (e) { return; }
    if (!raw) return;
    try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* noop */ }
    var rec;
    try { rec = JSON.parse(raw); } catch (e) { return; }
    if (!rec || !rec.xml) return;
    // 5分より古い予約は無視（誤爆防止）
    if (rec.ts && (Date.now() - rec.ts) > 5 * 60 * 1000) return;
    // 遷移先モードが一致しているときだけ適用
    if (rec.mode && rec.mode !== io.getMode()) return;
    try {
      io.restore(rec.xml);
      openDoc = { id: rec.id || null, name: rec.name || null, mode: rec.mode || io.getMode() };
      if (window.PycoAutosave && window.PycoAutosave.saveNow) window.PycoAutosave.saveNow();
      toast('「' + (rec.name || '作品') + '」を開きました', 'ok');
    } catch (e) {
      console.warn('PycoBlocks: 予約された作品の復元に失敗:', e);
    }
  }

  // =============================================================
  // UI: ヘッダー（ツールバー）へのボタン組み込み
  //   既存ツールバー(.toolbar=ヘッダー行2)へ差し込むと、PC ではインラインに、
  //   モバイルでは既存の ☰ ドロワーに自動で入り、流儀を踏襲できる。
  // =============================================================
  var uiRoot = null;      // ツールバー内のクラウド用コンテナ
  var menuPopover = null; // アカウントメニューのポップオーバー

  function ensureUiRoot() {
    if (uiRoot && uiRoot.isConnected) return uiRoot;
    var toolbar = document.querySelector('header .toolbar');
    if (!toolbar) return null;
    var sep = document.createElement('div');
    sep.className = 'toolbar-sep';
    sep.id = 'cloud-sep';
    uiRoot = document.createElement('div');
    uiRoot.id = 'cloud-toolbar';
    uiRoot.className = 'cloud-toolbar';
    // 「共有URL」ボタンの直後（ブロック操作グループの末尾）に置く
    var anchor = document.getElementById('btn-share-url');
    if (anchor && anchor.parentNode === toolbar && anchor.nextSibling) {
      toolbar.insertBefore(sep, anchor.nextSibling);
      toolbar.insertBefore(uiRoot, sep.nextSibling);
    } else {
      toolbar.appendChild(sep);
      toolbar.appendChild(uiRoot);
    }
    return uiRoot;
  }

  function renderCloudUi() {
    var root = ensureUiRoot();
    if (!root) return;
    closeMenu();
    root.innerHTML = '';

    if (!currentUser) {
      // 未ログイン: 「ログイン」ボタン
      var loginBtn = document.createElement('button');
      loginBtn.id = 'btn-cloud-login';
      loginBtn.type = 'button';
      loginBtn.textContent = 'ログイン';
      loginBtn.title = 'Google アカウントでログインして作品をクラウドに保存';
      loginBtn.addEventListener('click', doLogin);
      root.appendChild(loginBtn);
      return;
    }

    // ログイン中: アカウントボタン（写真 + 名前）
    var accBtn = document.createElement('button');
    accBtn.id = 'btn-cloud-account';
    accBtn.type = 'button';
    accBtn.className = 'cloud-account-btn';
    accBtn.setAttribute('aria-haspopup', 'true');
    accBtn.setAttribute('aria-expanded', 'false');

    var name = currentUser.displayName || currentUser.email || 'ユーザー';
    var initial = (name.trim()[0] || 'U').toUpperCase();
    var avatar = document.createElement('span');
    avatar.className = 'cloud-avatar';
    if (currentUser.photoURL) {
      var img = document.createElement('img');
      img.src = currentUser.photoURL;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', function() {
        // 画像取得失敗時はイニシャル表示にフォールバック
        avatar.textContent = initial;
        avatar.classList.add('cloud-avatar--letter');
      });
      avatar.appendChild(img);
    } else {
      avatar.textContent = initial;
      avatar.classList.add('cloud-avatar--letter');
    }
    accBtn.appendChild(avatar);
    var nameSpan = document.createElement('span');
    nameSpan.className = 'cloud-account-name';
    nameSpan.textContent = name;
    accBtn.appendChild(nameSpan);
    var caret = document.createElement('span');
    caret.className = 'cloud-caret';
    caret.textContent = '▾';
    accBtn.appendChild(caret);

    accBtn.addEventListener('click', function(ev) {
      ev.stopPropagation();
      toggleMenu(accBtn);
    });
    root.appendChild(accBtn);
  }

  // ---- アカウントメニュー（ポップオーバー） ----
  function closeMenu() {
    if (menuPopover && menuPopover.parentNode) menuPopover.parentNode.removeChild(menuPopover);
    menuPopover = null;
    var accBtn = document.getElementById('btn-cloud-account');
    if (accBtn) accBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClickForMenu, true);
    window.removeEventListener('resize', closeMenu);
  }
  function onDocClickForMenu(ev) {
    if (menuPopover && !menuPopover.contains(ev.target) &&
        !(ev.target.closest && ev.target.closest('#btn-cloud-account'))) {
      closeMenu();
    }
  }
  function toggleMenu(anchorBtn) {
    if (menuPopover) { closeMenu(); return; }
    menuPopover = document.createElement('div');
    menuPopover.className = 'cloud-menu';
    menuPopover.setAttribute('role', 'menu');

    var items = [
      { label: '☁ クラウドに保存', fn: openSaveDialog },
      { label: '📂 クラウドから開く', fn: openLoadDialog },
      { label: '⎋ ログアウト', fn: doLogout, danger: true }
    ];
    items.forEach(function(it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cloud-menu-item' + (it.danger ? ' cloud-menu-item--danger' : '');
      b.textContent = it.label;
      b.setAttribute('role', 'menuitem');
      b.addEventListener('click', function() { closeMenu(); it.fn(); });
      menuPopover.appendChild(b);
    });

    document.body.appendChild(menuPopover);
    // ボタン直下に配置（画面右にはみ出さないよう調整）
    var r = anchorBtn.getBoundingClientRect();
    var w = menuPopover.offsetWidth || 200;
    var left = Math.min(r.left, window.innerWidth - w - 8);
    left = Math.max(8, left);
    menuPopover.style.left = left + 'px';
    menuPopover.style.top = (r.bottom + 6) + 'px';
    anchorBtn.setAttribute('aria-expanded', 'true');
    setTimeout(function() {
      document.addEventListener('click', onDocClickForMenu, true);
      window.addEventListener('resize', closeMenu);
    }, 0);
  }

  // =============================================================
  // モーダル（保存ダイアログ / 開くダイアログ 共通）
  // =============================================================
  function buildModal(titleText) {
    var overlay = document.createElement('div');
    overlay.className = 'cloud-modal-overlay';
    var panel = document.createElement('div');
    panel.className = 'cloud-modal';
    overlay.appendChild(panel);

    var head = document.createElement('div');
    head.className = 'cloud-modal-head';
    var title = document.createElement('span');
    title.className = 'cloud-modal-title';
    title.textContent = titleText;
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'cloud-modal-close';
    closeBtn.textContent = '閉じる';
    head.appendChild(title);
    head.appendChild(closeBtn);
    panel.appendChild(head);

    var bodyEl = document.createElement('div');
    bodyEl.className = 'cloud-modal-body';
    panel.appendChild(bodyEl);

    function close() {
      document.removeEventListener('keydown', onKey);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    function onKey(ev) { if (ev.key === 'Escape') close(); }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(ev) { if (ev.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);

    return { overlay: overlay, panel: panel, body: bodyEl, close: close };
  }

  // ---- 保存ダイアログ ----
  function openSaveDialog() {
    if (!currentUser) { doLogin(); return; }
    var mode = io.getMode();
    var isCloudOrigin = !!(openDoc.id && openDoc.mode === mode);
    var m = buildModal('クラウドに保存');

    var info = document.createElement('p');
    info.className = 'cloud-modal-note';
    info.textContent = 'モード: ' + modeLabel(mode);
    m.body.appendChild(info);

    var label = document.createElement('label');
    label.className = 'cloud-field-label';
    label.textContent = '作品の名前';
    m.body.appendChild(label);

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'cloud-input';
    input.maxLength = 60;
    input.value = isCloudOrigin && openDoc.name ? openDoc.name : ('無題 ' + shortStamp());
    m.body.appendChild(input);

    var actions = document.createElement('div');
    actions.className = 'cloud-modal-actions';

    if (isCloudOrigin) {
      // クラウド由来 → 上書き保存 ＋ 別名で保存
      var overwriteBtn = document.createElement('button');
      overwriteBtn.type = 'button';
      overwriteBtn.className = 'cloud-btn cloud-btn--primary';
      overwriteBtn.textContent = '上書き保存';
      overwriteBtn.addEventListener('click', function() {
        var n = (input.value || '').trim();
        if (!n) { input.focus(); return; }
        m.close(); saveProject(n, false);
      });
      var saveAsBtn = document.createElement('button');
      saveAsBtn.type = 'button';
      saveAsBtn.className = 'cloud-btn';
      saveAsBtn.textContent = '別名で保存';
      saveAsBtn.addEventListener('click', function() {
        var n = (input.value || '').trim();
        if (!n) { input.focus(); return; }
        m.close(); saveProject(n, true);
      });
      actions.appendChild(overwriteBtn);
      actions.appendChild(saveAsBtn);
    } else {
      // 新規保存
      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'cloud-btn cloud-btn--primary';
      saveBtn.textContent = '保存';
      saveBtn.addEventListener('click', function() {
        var n = (input.value || '').trim();
        if (!n) { input.focus(); return; }
        m.close(); saveProject(n, true);
      });
      actions.appendChild(saveBtn);
    }
    m.body.appendChild(actions);

    setTimeout(function() { input.focus(); input.select(); }, 30);
    input.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter') {
        var n = (input.value || '').trim();
        if (!n) return;
        m.close(); saveProject(n, !isCloudOrigin);
      }
    });
  }

  // ---- 開くダイアログ ----
  function openLoadDialog() {
    if (!currentUser) { doLogin(); return; }
    var m = buildModal('クラウドから開く');
    var listWrap = document.createElement('div');
    listWrap.className = 'cloud-list';
    listWrap.textContent = '読み込み中…';
    m.body.appendChild(listWrap);

    listProjects().then(function(items) {
      listWrap.textContent = '';
      if (!items.length) {
        var empty = document.createElement('p');
        empty.className = 'cloud-modal-note';
        empty.textContent = 'まだ保存された作品はありません。';
        listWrap.appendChild(empty);
        return;
      }
      items.forEach(function(rec) {
        listWrap.appendChild(buildListRow(rec, m, listWrap));
      });
    }).catch(function(err) {
      listWrap.textContent = '';
      var e = document.createElement('p');
      e.className = 'cloud-modal-note cloud-modal-note--error';
      e.textContent = friendlyError(err);
      listWrap.appendChild(e);
    });
  }

  function buildListRow(rec, modal, listWrap) {
    var row = document.createElement('div');
    row.className = 'cloud-row';

    var main = document.createElement('button');
    main.type = 'button';
    main.className = 'cloud-row-main';
    main.title = '「' + rec.name + '」を開く';
    main.innerHTML =
      '<span class="cloud-row-name">' + escapeHtml(rec.name) + '</span>' +
      '<span class="cloud-badge cloud-badge--' + escapeHtml(rec.mode) + '">' + escapeHtml(modeLabel(rec.mode)) + '</span>' +
      '<span class="cloud-row-date">' + (rec.updatedAt ? escapeHtml(shortStamp(rec.updatedAt)) : '') + '</span>';
    main.addEventListener('click', function() {
      modal.close();
      openProjectRecord(rec);
    });

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'cloud-row-del';
    del.title = 'この作品を削除';
    del.textContent = '🗑';
    del.addEventListener('click', function(ev) {
      ev.stopPropagation();
      if (!window.confirm('「' + rec.name + '」を削除します。元に戻せません。よろしいですか？')) return;
      del.disabled = true;
      deleteProject(rec.id).then(function() {
        if (openDoc.id === rec.id) openDoc = { id: null, name: null, mode: null };
        if (row.parentNode) row.parentNode.removeChild(row);
        if (listWrap && !listWrap.querySelector('.cloud-row')) {
          var empty = document.createElement('p');
          empty.className = 'cloud-modal-note';
          empty.textContent = 'まだ保存された作品はありません。';
          listWrap.appendChild(empty);
        }
        toast('削除しました', 'ok');
      }).catch(function(err) {
        del.disabled = false;
        toast(friendlyError(err), 'error');
      });
    });

    row.appendChild(main);
    row.appendChild(del);
    return row;
  }

  // =============================================================
  // 初期化
  // =============================================================
  function start() {
    io = window.PycoWorkspaceIO;
    // 未ログイン状態のログインボタンを先に表示（SDK 読み込みは待たない）
    renderCloudUi();
    // モード遷移をまたいだ「開く」予約があればここで復元
    consumePendingOpen();
    // セッション復元 / redirect ログイン結果の回収のため、
    // 初期表示を邪魔しないよう遅延して SDK を読み込む
    var kick = function() { loadSdk(); };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(kick, { timeout: 3000 });
    } else {
      setTimeout(kick, 1200);
    }
  }

  // PycoWorkspaceIO（app.js 末尾で定義）が準備できるまで待ってから開始
  function waitForIoThenStart() {
    var tries = 0;
    (function poll() {
      if (window.PycoWorkspaceIO && typeof window.PycoWorkspaceIO.serialize === 'function') {
        try { start(); } catch (e) { console.warn('PycoBlocks: クラウド初期化に失敗:', e); }
        return;
      }
      if (++tries > 200) { // 約20秒であきらめる（アプリは通常通り動作）
        console.warn('PycoBlocks: PycoWorkspaceIO が見つからずクラウド機能を初期化できませんでした。');
        return;
      }
      setTimeout(poll, 100);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForIoThenStart);
  } else {
    waitForIoThenStart();
  }
})();
