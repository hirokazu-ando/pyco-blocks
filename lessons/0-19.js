// このファイルは tools/build_lessons.py が lessons/0-19.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-19"] = {
  "id": "0-19",
  "group": "part0-advanced",
  "title": "タプルとセットを使おう",
  "subtitle": "Python × 入門 #19",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-19-tuple-set/",
  "toolbox": [
    "py_tuple_literal",
    "py_tuple_unpack",
    "py_set_literal",
    "py_set_add",
    "py_set_discard",
    "py_list_dedup",
    "py_sorted_set",
    "py_frozenset",
    "py_list_literal",
    "val_number",
    "val_var",
    "var_set",
    "py_print"
  ],
  "steps": [
    {
      "title": "リストの仲間、タプルとセット",
      "body": "<p>リストに似ているけれど性質のちがうデータ構造を2つ学びます。</p><ul><li><b>タプル</b>（tuple）：<code>( )</code> で作る。作った後は <b>変更できない</b>。座標や色など「固定したいデータ」に向く</li><li><b>セット</b>（set）：<code>{ }</code> で作る。<b>重複が消える</b>・<b>順序を持たない</b>。重複排除や集合演算に向く</li></ul><p>変更できないセットは <b>frozenset</b> と呼びます。</p>",
      "hint": "タプルは変更できない、セットは重複しない・順番がない、と覚えましょう。"
    },
    {
      "title": "手順1：タプルブロックを置く",
      "body": "<p>「タプル・セット」カテゴリから <b>タプル ( … )</b> のブロックを取り出し、下の図のように置きましょう。中に2つの数を入れられます。</p><p>1つ置けたらクリアです。</p>",
      "hint": "青色のブロックです。カッコの中に値をはめ込みます。",
      "check": {
        "blocksRequired": [
          "py_tuple_literal"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-19_tuple_block.png",
        "alt": "2つの値を持つタプルブロック"
      }
    },
    {
      "title": "手順2：タプルを分解して取り出す",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 point</b> に <b>タプル (3, 7)</b> を入れる</li><li><b>変数 x, y = タプル point</b> のブロックで、2つの値を <code>x</code> と <code>y</code> に分ける（アンパック）</li><li><b>値を表示する</b> で <code>x</code>、続けて <code>y</code> を表示する</li></ol><p>「▶ 実行」を押して <code>3</code> と <code>7</code> が2行出れば成功です。</p><pre>3\n7</pre>",
      "hint": "アンパックを使うと、1つのタプルの中身を複数の変数に一度に代入できます。",
      "run": true,
      "check": {
        "outputEquals": "3\n7"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-19_unpack.png",
        "alt": "タプルpointをxとyに分解して表示する組み合わせ"
      }
    },
    {
      "title": "セットで重複を消す",
      "body": "<p>セットは <b>同じ値をまとめて1つ</b> にします。ただし順序を持たないので、そのまま表示すると並び順は決まりません。</p><p>そこで <b>リスト〜の重複を除いて昇順に並べる</b> のブロックを使うと、重複を消したうえできれいな昇順のリストにできます。</p><p>また、2つのセットを比べる集合演算（和集合 <code>|</code>・積集合 <code>&amp;</code>・差集合 <code>-</code>）も使えます。</p>"
    },
    {
      "title": "手順3：重複を消して並べる",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 scores</b> に <b>リスト</b> <code>[80, 90, 80, 70]</code> を入れる</li><li><b>値を表示する</b> に <b>scores の重複を除いて昇順に並べる</b> をはめる</li></ol><p>「▶ 実行」を押して、重複が消えて昇順に並んだリストが出れば成功です。</p><pre>[70, 80, 90]</pre>",
      "hint": "重複していた 80 が1つにまとまり、小さい順に並びます。",
      "run": true,
      "check": {
        "outputEquals": "[70, 80, 90]"
      },
      "image": {
        "src": "lessons/img/0-19_sorted_set.png",
        "alt": "リストの重複を除いて昇順に並べて表示する組み合わせ"
      }
    },
    {
      "title": "コードを読もう：タプルのアンパック",
      "body": "<p>ブロックが作った Python コードを1行ずつ読んでみましょう。</p><pre class=\"code-lines\">point = (3, 7)\nx, y = point\nprint(x)\nprint(y)</pre><ol><li><b>1行目</b>：<code>( )</code> で2つの数をまとめた<b>タプル</b>を作り、<code>point</code> に入れます。</li><li><b>2行目</b>：左に変数を2つ、右にタプルを置くと、中身が順に <code>x</code> と <code>y</code> に入ります。これを<b>アンパック</b>といいます。</li><li><b>3・4行目</b>：<code>x</code> と <code>y</code> をそれぞれ表示します。</li></ol>",
      "hint": "左辺の変数の数と、タプルの中身の数をそろえるのがポイントです。",
      "callout": {
        "target": "code",
        "text": "この形のコードが作られます"
      }
    },
    {
      "quiz": true,
      "title": "コード読解テスト",
      "body": "<p>次のコードを実行すると、何が表示されるでしょう？数字で答えてください。</p><pre class=\"code-lines\">color = (255, 128, 0)\nr, g, b = color\nprint(g)</pre>",
      "hint": "左から順に r・g・b に入ります。g は2番目の値です。",
      "check": {
        "answerText": {
          "accept": [
            "128",
            "\"128\""
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p>タプル <code>(10, 20)</code> を作り、<b>アンパック</b>で2つの変数に分け、その2つをたし算した結果を表示するコードを書いて実行しましょう。</p><pre class=\"code-lines\">30</pre>",
      "hint": "a, b = (10, 20) のように分けてから、a + b を表示します。",
      "check": {
        "codeRun": {
          "outputEquals": "30",
          "codeContains": [
            {
              "pattern": "[A-Za-z_]\\w*\\s*,\\s*[A-Za-z_]\\w*\\s*=",
              "message": "実行結果は合っていますが、アンパック（a, b = ... の形）を使って書いてみましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(\\s*30\\s*\\)",
              "message": "実行結果は合っていますが、30 を直接書かず、アンパックした2つの変数をたして表示しましょう"
            }
          ]
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><b>タプル</b> について正しい説明はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "作った後は中身を変更できない",
            "重複した値は必ず消える",
            "要素に名前を付けて保存する"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p>セット <code>{1, 2, 2, 3}</code> の要素はいくつになるでしょう？（セットは重複を消す）</p>",
      "check": {
        "choice": {
          "options": [
            "3個",
            "4個",
            "2個"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：重複をなくそう",
      "body": "<p>好きな数を並べたリストを作り、<b>重複を除いて昇順に並べる</b> ブロックで整理して表示するプログラムを作ってみましょう。そのブロックを使えばクリアです。</p><p>組み合わせ例：</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-19-tuple-set/</code></p>",
      "hint": "同じ数を2回以上入れておくと、重複が消えるようすがよくわかります。",
      "check": {
        "blocksRequired": [
          "py_sorted_set"
        ]
      },
      "image": {
        "src": "lessons/img/0-19_sorted_set.png",
        "alt": "リストの重複を除いて昇順に並べる組み合わせの例"
      }
    }
  ]
};
