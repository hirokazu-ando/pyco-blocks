// ツールバーの小さなメニュー（「ファイル ▾」「⚙ 表示 ▾」）の開閉。
//   - 中のボタンは元の ID のまま（app.js がその ID でクリック処理を付けている）。
//   - ここでは開く・閉じるだけを受け持ち、ボタンの動作には手を出さない。
//   - スマホ表示（body.mobile-mode）では CSS がメニューを開かずに中身を並べるので、
//     ここでは何もしない。
(function () {
  'use strict';

  function init() {
    var menus = Array.prototype.slice.call(document.querySelectorAll('.tb-menu'));
    if (!menus.length) return;

    function isMobile() { return document.body.classList.contains('mobile-mode'); }

    function setOpen(menu, open) {
      var btn = menu.querySelector('.tb-menu-btn');
      menu.classList.toggle('open', open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function closeAll(except) {
      menus.forEach(function (m) { if (m !== except) setOpen(m, false); });
    }

    menus.forEach(function (menu) {
      var btn = menu.querySelector('.tb-menu-btn');
      var pop = menu.querySelector('.tb-menu-pop');
      if (!btn || !pop) return;

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isMobile()) return;
        var open = !menu.classList.contains('open');
        closeAll(menu);
        setOpen(menu, open);
        if (open) {
          var first = pop.querySelector('button:not([disabled])');
          if (first && e.detail === 0) first.focus();   // キーボードで開いたときだけ中へ
        }
      });

      // 中のボタンを押したら閉じる。A−/A+・画面の色・# は続けて押すことが多いので「表示」は開いたまま。
      pop.addEventListener('click', function (e) {
        if (isMobile()) return;
        var b = e.target.closest('button');
        if (!b) return;
        if (menu.id === 'tb-menu-view' && b.id !== 'btn-mobile-toggle') return;
        setOpen(menu, false);
      });

      // Esc で閉じてメニューのボタンへ戻る
      menu.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
          e.stopPropagation();
          setOpen(menu, false);
          btn.focus();
        }
      });

      // Tab でメニューの外へ出たら閉じる
      menu.addEventListener('focusout', function (e) {
        if (e.relatedTarget && !menu.contains(e.relatedTarget)) setOpen(menu, false);
      });
    });

    // メニューの外をクリックしたら閉じる
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.tb-menu')) closeAll(null);
    });
    // Blockly の作業域は pointerdown で止めることがあるので、それでも閉じる
    document.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.tb-menu')) closeAll(null);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
