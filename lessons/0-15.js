// このファイルは tools/build_lessons.py が lessons/0-15.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-15"] = {
  "id": "0-15",
  "group": "part0-advanced",
  "title": "戻り値とスコープを理解しよう",
  "subtitle": "Python × 入門 #15",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-15-return-scope/",
  "toolbox": [
    "py_def",
    "py_def_args2",
    "py_return",
    "py_call_val",
    "py_call_val2",
    "var_set",
    "py_math_op",
    "val_number",
    "val_var",
    "val_str",
    "py_print",
    "print_text"
  ],
  "steps": [
    {
      "title": "returnとスコープ",
      "body": "<p>0-14では処理を関数にまとめました。今回はその続きとして、関数が結果を返す <b>return（戻り値）</b> と、変数が使える範囲である <b>スコープ</b> を整理します。</p><p>ここが分かると、ただ長いコードを書く段階から、部品を組み合わせて考える段階へ進めます。</p><p>準備ができたら「次へ ▶」を押してください。</p>",
      "hint": "このパネルは右上のボタンで折りたたみ、「✕」で学習をやめられます。"
    },
    {
      "title": "returnは「結果を外へ返す」命令",
      "body": "<p><b>表示する</b> は画面に出す命令です。一方 <b>return</b> は、関数の中で作った値を <b>呼び出した場所へ返します</b>。表示するだけなら表示で十分ですが、結果を変数に入れて次の処理に使うなら return が必要です。</p><pre>def add(a, b):\n    return a + b\nresult = add(3, 5)\nprint(result)</pre><p><code>add(3, 5)</code> の場所に、返ってきた <code>8</code> が入ります。</p>"
    },
    {
      "title": "手順1：二乗を返す関数を定義する",
      "body": "<p>「関数」カテゴリの <b>関数〜（引数: x）を定義する</b> を取り出し、名前を <code>square</code>、引数を <code>n</code> にして下の図のように置きましょう。中に <b>n × n を返す（return）</b> を入れます。</p><p>関数を定義するブロックと <b>返す</b> ブロックが置けたらクリアです。</p>",
      "hint": "返す値には算術演算ブロックを使い、左右に同じ引数 n を入れます。",
      "check": {
        "blocksRequired": [
          "py_def",
          "py_return"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-15_square.png",
        "alt": "引数nを受け取りn×nを返すsquare関数のブロック"
      }
    },
    {
      "title": "手順2：戻り値を表示する",
      "body": "<p>返ってきた値を表示してみましょう。下の図のように組み立てます。</p><ol><li><code>square</code> 関数を定義し、中で <b>n × n を返す</b></li><li>その下で <b>関数 square（引数: 6）の結果</b> を表示する</li></ol><p>「▶ 実行」を押して <code>36</code> と出れば成功です。</p><pre>36</pre>",
      "hint": "「結果」のブロックは値を持つので、そのまま「表示する」にはめ込めます。",
      "run": true,
      "check": {
        "outputEquals": "36"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-15_square_run.png",
        "alt": "square関数の結果を表示する組み合わせ"
      }
    },
    {
      "title": "スコープとNone",
      "body": "<p>関数の中で作った変数は、その関数の中だけで使えます。この範囲を <b>スコープ</b>、その変数を <b>ローカル変数</b> と呼びます。外へ出したい値は return で返します。</p><p>また、<b>return を書かない関数</b> は、実は <b>None</b>（値がないことを表す特別な値）を返します。「表示する関数」と「値を返す関数」は目的が違う、と考えると整理しやすいです。</p>"
    },
    {
      "title": "手順3：Noneが出ることを確かめる",
      "body": "<p>return しない関数の戻り値を表示すると <b>None</b> が出ます。下の図のように組み立てましょう。</p><ol><li>引数 <code>name</code> を受け取り、それを <b>表示するだけ</b>（return しない）の <code>show_name</code> 関数を作る</li><li>その戻り値を変数 <code>result</code> に入れ、<code>result</code> を表示する</li></ol><p>「▶ 実行」を押して <code>Aoi</code> のあとに <code>None</code> が出れば成功です。</p><pre>Aoi\nNone</pre>",
      "hint": "show_name は表示するだけで return がないので、戻り値は None になります。",
      "run": true,
      "check": {
        "outputEquals": "Aoi\nNone"
      },
      "image": {
        "src": "lessons/img/0-15_none.png",
        "alt": "returnしない関数の戻り値がNoneになることを確かめる組み合わせ"
      }
    },
    {
      "title": "コードを読もう：returnとスコープ",
      "body": "<p>次のコードは、関数が計算した結果を <b>return</b> で呼び出し元へ返し、変数に受け取って表示する例です。</p><pre class=\"code-lines\">def add(a, b):\n    return a + b\nresult = add(3, 5)\nprint(result)</pre><ul><li>1〜2行目：関数の定義です。引数 <code>a</code>・<code>b</code> は<b>関数の中だけ</b>で使える変数（スコープ）です。<code>return a + b</code> で計算結果を外へ返します。</li><li>3行目：<code>add(3, 5)</code> を呼ぶと、その場所に返ってきた <code>8</code> が入り、変数 <code>result</code> に保存されます。</li><li>4行目：<code>result</code> を表示すると <code>8</code> が出ます。</li></ul><p><code>return</code> があると、結果を変数に入れて次の処理に使えます。ただ表示するだけの命令とのちがいを意識しましょう。</p>",
      "hint": "return は値を呼び出し元へ返します。返ってきた値は変数に入れて使えます。",
      "callout": {
        "target": "code",
        "text": "生成されたコードはここで確認できます"
      }
    },
    {
      "quiz": true,
      "title": "コード読解テスト",
      "body": "<p>次のコードで、<code>square(7)</code> の<b>戻り値</b>はいくつでしょう？表示される値を答えてください。</p><pre class=\"code-lines\">def square(n):\n    return n * n\nprint(square(7))</pre>",
      "hint": "square(7) は 7 × 7 を計算して返します。",
      "check": {
        "answerText": {
          "accept": [
            "49",
            "\"49\""
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p>数を受け取り、その数を<b>2倍にして return する</b>関数を作りましょう。<code>5</code> を渡した結果を表示して、<code>10</code> と出れば成功です。</p><pre class=\"code-lines\">10</pre>",
      "hint": "def twice(n): の中で return n * 2 と書き、print(twice(5)) で呼び出します。",
      "check": {
        "codeRun": {
          "outputEquals": "10",
          "codeContains": [
            {
              "pattern": "def\\s",
              "message": "実行結果は合っていますが、def で関数を定義してみましょう"
            },
            {
              "pattern": "return\\s",
              "message": "実行結果は合っていますが、return を使って結果を返してみましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(\\s*10\\b",
              "message": "実行結果は合っていますが、10を直接printせず、関数の戻り値を表示しましょう"
            }
          ]
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><b>表示する</b> と <b>return</b> のちがいとして正しいのはどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "表示するは画面に出す。returnは値を呼び出し元へ返す",
            "どちらもまったく同じ意味である",
            "returnは画面に文字を出す命令である"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><b>return</b> を書かない関数の戻り値は何になるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "None",
            "0",
            "エラーになる"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：計算結果を返す関数を作ろう",
      "body": "<p>数を受け取って、その計算結果を <b>return</b> する自分の関数を作ってみましょう。<b>関数の定義</b> と <b>return</b> をどちらも使えばクリアです。</p><p>組み合わせ例：</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-15-return-scope/</code></p>",
      "hint": "引数を受け取る関数を定義し、中で計算した結果を return します。呼び出して結果を表示してみましょう。",
      "check": {
        "blocksRequired": [
          "py_def",
          "py_return"
        ]
      },
      "image": {
        "src": "lessons/img/0-15_square.png",
        "alt": "計算結果を返す関数の例"
      }
    }
  ]
};
