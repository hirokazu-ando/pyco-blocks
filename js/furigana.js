// =============================================================
// ふりがな（小学生向け）
//   ［⚙ 見た目］→「ふりがな」で、ツールバー・モードの切替・ブロックのカテゴリ名・
//   スマホのタブ・空のときの案内カードの漢字に読みを付ける。
//   言葉そのものは変えない（記事・学習モードの文と同じ言葉のまま読めるようにする）。
//   小学生レビュー k1（2026-11-26）：「実行」「接続」「分岐」「繰り返し」などが読めなかった。
//
//   - 既定は「なし」。?furigana=1 で開くと「あり」（トップの［小学生はここから］が付ける）
//   - 状態は localStorage 'pyco-furigana'（'1' / '0'）に残す
//   - ボタンの文字は app.js が書きかえることがあるので、対象の場所の変化を見て付け直す
//   - 切ると <ruby class="pyco-furi"> を元の文字に戻す
// =============================================================
(function () {
  'use strict';
  var KEY = 'pyco-furigana';
  // 読みを付ける場所
  var ROOTS = 'header .toolbar, header .mode-toggle, .blocklyToolbox, #mobile-tabbar, #ws-empty-hint';
  // [漢字の部分, 読み, 送りがな]。長いものから順に当てる
  var WORDS = [
    ['当たり判定', 'あたりはんてい', ''],
    ['繰り返し', 'くりかえし', ''],
    ['書き込み', 'かきこみ', ''],
    ['再接続', 'さいせつぞく', ''],
    ['配線図', 'はいせんず', ''],
    ['文字列', 'もじれつ', ''],
    ['見た目', 'みため', ''],
    ['学習', 'がくしゅう', ''],
    ['実行', 'じっこう', ''],
    ['接続', 'せつぞく', ''],
    ['導入', 'どうにゅう', ''],
    ['編集', 'へんしゅう', ''],
    ['表示', 'ひょうじ', ''],
    ['変数', 'へんすう', ''],
    ['計算', 'けいさん', ''],
    ['入力', 'にゅうりょく', ''],
    ['出力', 'しゅつりょく', ''],
    ['分岐', 'ぶんき', ''],
    ['時間', 'じかん', ''],
    ['描画', 'びょうが', ''],
    ['物理', 'ぶつり', ''],
    ['基本', 'きほん', ''],
    ['音楽', 'おんがく', ''],
    ['無線', 'むせん', ''],
    ['論理', 'ろんり', ''],
    ['関数', 'かんすう', ''],
    ['数学', 'すうがく', ''],
    ['画像', 'がぞう', ''],
    ['画面', 'がめん', ''],
    ['作品', 'さくひん', ''],
    ['見本', 'みほん', ''],
    ['止める', 'と', 'める'],
    ['新しく', 'あたら', 'しく'],
    ['作る', 'つく', 'る'],
    ['開く', 'ひら', 'く'],
    ['値', 'あたい', '']
  ];
  var on = false;
  var pending = false;

  function kanjiPart(w) { return w[2] ? w[0].slice(0, w[0].length - w[2].length) : w[0]; }

  function rubyFor(w) {
    var r = document.createElement('ruby');
    r.className = 'pyco-furi';
    r.appendChild(document.createTextNode(kanjiPart(w)));
    var rt = document.createElement('rt');
    rt.textContent = w[1];
    r.appendChild(rt);
    return r;
  }

  // 1 つのテキストノードに読みを付ける
  function annotateText(node) {
    var text = node.nodeValue;
    if (!text || !/[一-鿿]/.test(text)) return;
    var frag = null, rest = text, changed = false;
    frag = document.createDocumentFragment();
    while (rest.length) {
      var best = -1, bw = null;
      for (var i = 0; i < WORDS.length; i++) {
        var k = rest.indexOf(WORDS[i][0]);
        if (k >= 0 && (best < 0 || k < best || (k === best && WORDS[i][0].length > bw[0].length))) { best = k; bw = WORDS[i]; }
      }
      if (best < 0) { frag.appendChild(document.createTextNode(rest)); break; }
      if (best > 0) frag.appendChild(document.createTextNode(rest.slice(0, best)));
      frag.appendChild(rubyFor(bw));
      if (bw[2]) frag.appendChild(document.createTextNode(bw[2]));
      rest = rest.slice(best + bw[0].length);
      changed = true;
    }
    if (!changed) return;
    // ボタンは flex で並べているものがあり、ルビと送りがなが別々の項目になって間があく（「止 める」）。1 つの span に包む
    var wrap = document.createElement('span');
    wrap.className = 'pyco-furi-wrap';
    wrap.appendChild(frag);
    node.parentNode.replaceChild(wrap, node);
  }

  function annotateAll() {
    pending = false;
    if (!on) return;
    var roots = document.querySelectorAll(ROOTS);
    Array.prototype.forEach.call(roots, function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentNode;
          if (!p || p.closest('ruby, .pyco-furi-wrap, script, style, textarea, input, svg, .CodeMirror, .tb-menu-sub')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var list = [], n;
      while ((n = walker.nextNode())) list.push(n);
      list.forEach(annotateText);
    });
  }

  function stripAll() {
    Array.prototype.forEach.call(document.querySelectorAll('ruby.pyco-furi'), function (r) {
      var base = '';
      Array.prototype.forEach.call(r.childNodes, function (c) { if (c.nodeType === 3) base += c.nodeValue; });
      var t = document.createTextNode(base);
      r.parentNode.replaceChild(t, r);
      if (t.parentNode) t.parentNode.normalize();
    });
    Array.prototype.forEach.call(document.querySelectorAll('span.pyco-furi-wrap'), function (w) {
      var t = document.createTextNode(w.textContent);
      var p = w.parentNode;
      p.replaceChild(t, w);
      p.normalize();
    });
  }

  function schedule() {
    if (pending || !on) return;
    pending = true;
    requestAnimationFrame(annotateAll);
  }

  // 対象の場所が書きかわったら付け直す（Blockly の描画など関係ない変化は見ない）
  var mo = new MutationObserver(function (muts) {
    if (!on) return;
    for (var i = 0; i < muts.length; i++) {
      var t = muts[i].target;
      var el = t.nodeType === 1 ? t : t.parentElement;
      if (el && el.closest && el.closest(ROOTS)) { schedule(); return; }
      // 新しく足された案内カードやツールボックス
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var a = added[j];
        if (a.nodeType === 1 && (a.matches(ROOTS) || a.querySelector && a.querySelector(ROOTS))) { schedule(); return; }
      }
    }
  });

  function paintButton() {
    var b = document.getElementById('btn-furigana');
    if (!b) return;
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.textContent = on ? '☑ あり' : '☐ なし';
  }

  function set(v, keep) {
    on = !!v;
    document.body.classList.toggle('furigana', on);
    if (keep !== false) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* noop */ } }
    paintButton();
    if (on) annotateAll(); else stripAll();
  }

  function init() {
    var v = null;
    try { v = localStorage.getItem(KEY); } catch (e) { v = null; }
    var q = null;
    try { q = new URLSearchParams(location.search).get('furigana'); } catch (e) { q = null; }
    if (q === '1' || q === '0') v = q;
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    var b = document.getElementById('btn-furigana');
    if (b) b.addEventListener('click', function () { set(!on); });
    set(v === '1', q === '1' || q === '0' ? true : false);
  }

  window.PycoFurigana = { set: set, isOn: function () { return on; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
