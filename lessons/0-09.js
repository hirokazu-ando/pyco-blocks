// このファイルは tools/build_lessons.py が lessons/0-09.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-09"] = {
  "id": "0-09",
  "group": "part0-control",
  "title": "決まった回数くり返そう（for文）",
  "subtitle": "Python × 入門 #09",
  "mode": "python",
  "article": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-09-for/",
  "toolbox": [
    "pico_for_range",
    "pico_repeat",
    "py_print",
    "var_set",
    "var_change",
    "val_number",
    "val_str",
    "val_var"
  ],
  "steps": [
    {
      "track": "block",
      "title": "くり返しとは何か",
      "body": "<p>同じ処理を何度もするとき、表示ブロックを何個も並べるのは大変です。<b>for文</b> を使うと、決まった回数だけ処理を <b>くり返せます</b>。</p><ul><li><b>range(3)</b>：3回くり返す（カウンタは 0, 1, 2 と進む）</li><li>くり返しの中に置いた処理が、回数ぶん実行される</li></ul><p>準備ができたら「次へ ▶」を押してください。</p>",
      "hint": "「繰り返し」カテゴリに for文のブロックがあります。"
    },
    {
      "track": "block",
      "title": "手順1：くり返しブロックを置く",
      "body": "<p>「繰り返し」カテゴリから <b>変数 i を N 回繰り返す</b> ブロックを取り出し、下の図のように置きましょう。回数のあなに <b>数値</b> の <code>3</code> を入れます。</p><p>1つ置けたらクリアです。</p>",
      "hint": "回数のあなには「値」カテゴリの数値ブロックが入ります。",
      "check": {
        "blocksRequired": [
          "pico_for_range"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-09_for_place.png",
        "alt": "3回繰り返すブロック"
      }
    },
    {
      "track": "block",
      "title": "手順2：Helloを3回表示する",
      "body": "<p>下の図のように、くり返しの中に <b>「Hello」を表示する</b> を入れましょう（<b>値を表示する</b> に文字列 <code>Hello</code> をはめます）。</p><p>「▶ 実行」を押して <code>Hello</code> が3行出れば成功です。</p><pre>for i in range(3):\n    print(\"Hello\")</pre>",
      "hint": "くり返しブロックの内側のくぼみに、表示ブロックをはめ込みます。",
      "run": true,
      "check": {
        "outputEquals": "Hello\nHello\nHello"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-09_hello3.png",
        "alt": "Helloを3回表示する組み合わせ"
      }
    },
    {
      "track": "block",
      "title": "カウンタ変数 i",
      "body": "<p>くり返しブロックには <b>カウンタ変数</b>（ここでは <code>i</code>）があります。<code>range(3)</code> のとき、<code>i</code> は <b>0 → 1 → 2</b> と1回ごとに変わります。</p><p>数え始めが <b>0</b> なのがポイントです。この <code>i</code> を表示すると、今何回目かがわかります。</p>"
    },
    {
      "track": "block",
      "title": "手順3：iを表示する",
      "body": "<p>下の図のように、くり返しの中で <b>値を表示する</b> に <b>変数</b> <code>i</code> をはめましょう。</p><p>「▶ 実行」を押して <code>0</code>・<code>1</code>・<code>2</code> と3行出れば成功です。</p><pre>for i in range(3):\n    print(i)</pre>",
      "hint": "表示ブロックに、数値ではなく変数 i をはめるのがポイントです。",
      "run": true,
      "check": {
        "outputEquals": "0\n1\n2"
      },
      "image": {
        "src": "lessons/img/0-09_printi.png",
        "alt": "カウンタ変数iを表示する組み合わせ"
      }
    },
    {
      "track": "code",
      "title": "コードを読もう：forとインデント",
      "body": "<p>手順3で組んだコードを読んでみましょう。ここでも <b>行末のコロン</b> と <b>インデント</b> が大切です。</p><pre class=\"code-lines\">for i in range(3):\n    print(i)</pre><ul><li><b>1行目</b> <code>for i in range(3):</code>「<code>i</code> を <code>0</code>・<code>1</code>・<code>2</code> と変えながら 3回くり返す」という意味です。行末の <b>:</b>（コロン）は「ここからくり返す中身が始まる」という合図です。</li><li><b>2行目</b>：先頭の <b>4つの空白（インデント）</b> が「<code>for</code> の中」を表します。この <code>print(i)</code> が回数ぶん、つまり 3回くり返されます。<code>i</code> は 1回ごとに <code>0 → 1 → 2</code> と変わります。</li></ul><p>くり返したい処理は、必ずインデントで下げて「中」に入れます。数え始めが <b>0</b> であることも覚えておきましょう。</p>",
      "callout": {
        "target": "code",
        "text": "生成されたコードはここで見られます"
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード読解テスト（記述式）",
      "body": "<p>次のコードを実行すると、数が3行表示されます。<b>1行目</b>に表示される数はいくつでしょう？</p><pre class=\"code-lines\">for i in range(3):\n    print(i + 1)</pre>",
      "hint": "i は 0 から始まります。1回目は i が 0 なので、0 + 1 を表示します。",
      "check": {
        "answerText": {
          "accept": [
            "1"
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p><b>for</b> と <b>range</b> を使って、<code>0</code>・<code>1</code>・<code>2</code> を1行ずつ表示するコードを書いて実行しましょう。</p><pre class=\"code-lines\">0\n1\n2</pre>",
      "hint": "for i in range(3): と書き、次の行を4つの空白で下げて print(i) を書きます。数字を直接 print してはいけません。",
      "check": {
        "codeRun": {
          "outputEquals": "0\n1\n2",
          "codeContains": [
            {
              "pattern": "for\\s",
              "message": "for を使ってくり返しましょう"
            },
            {
              "pattern": "range",
              "message": "range を使って回数を決めましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(\\s*0\\s*\\)",
              "message": "数字を直接 print せず、カウンタ変数 i を表示しましょう"
            }
          ]
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><code>for i in range(3):</code> のとき、<code>i</code> はどんな順に変わるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "0, 1, 2",
            "1, 2, 3",
            "0, 1, 2, 3"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p>次のプログラムは <code>A</code> を何行表示するでしょう？</p><pre>for i in range(5):\n    print(\"A\")</pre>",
      "check": {
        "choice": {
          "options": [
            "5行",
            "4行",
            "6行"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "課題：くり返してみよう",
      "body": "<p><b>くり返し</b> ブロックの中に <b>値を表示する</b> を入れて、好きな回数だけ表示するプログラムを作りましょう。くり返しブロックを1つ使えばクリアです。</p>",
      "hint": "回数や表示する内容は自由です。カウンタ変数 i を表示に使ってもかまいません。",
      "check": {
        "blocksRequired": [
          "pico_for_range",
          "py_print"
        ]
      }
    }
  ]
};
