// このファイルは tools/build_lessons.py が lessons/0-03.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-03"] = {
  "id": "0-03",
  "group": "part0-basic",
  "title": "計算してみよう",
  "subtitle": "Python × 入門 #03",
  "mode": "python",
  "article": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-03-math/",
  "toolbox": [
    "py_math_op",
    "val_number",
    "val_var",
    "var_set",
    "py_print"
  ],
  "steps": [
    {
      "track": "block",
      "title": "Pythonで使える計算",
      "body": "<p>電卓でできる計算は、すべてPythonでもできます。「計算」カテゴリの <b>算術演算</b> ブロック（<code>py_math_op</code>）で、次の演算子が使えます。</p><ul><li><code>+</code> 足し算 ／ <code>-</code> 引き算</li><li><code>*</code> 掛け算 ／ <code>/</code> 割り算（小数あり）</li><li><code>//</code> 整数の割り算（切り捨て） ／ <code>%</code> 余り ／ <code>**</code> べき乗</li></ul><p>まずは足し算から試してみましょう。</p>",
      "bodyEasy": "<p>電卓でできる計算は、Pythonでも全部できます。「計算」カテゴリの <b>算術演算</b> ブロックで、次の記号が使えます。</p><ul><li><code>+</code> 足し算 ／ <code>-</code> 引き算</li><li><code>*</code> 掛け算 ／ <code>/</code> 割り算（小数あり）</li><li><code>//</code> 整数の割り算（切り捨て） ／ <code>%</code> 余り ／ <code>**</code> べき乗</li></ul><p>まずは足し算からためしましょう。</p>",
      "hint": "算術演算ブロックの真ん中のプルダウンで、+ − × ÷ などを選べます。"
    },
    {
      "track": "block",
      "title": "手順1：計算ブロックを置く",
      "body": "<p>「計算」カテゴリから <b>算術演算</b> ブロックを1つ、下の図のように置きましょう。左右に数値をはめ、真ん中で演算子を選んで使います。</p><p>1つ置けたらクリアです。</p>",
      "bodyEasy": "<p>「計算」カテゴリから <b>算術演算</b> ブロックを１つ、下の図のように置きましょう。左右に数値をはめ、真ん中で記号を選びます。</p><p>１つ置けたらクリアです。</p>",
      "hint": "左右のあなには「値」カテゴリの数値ブロックが入ります。",
      "check": {
        "blocksRequired": [
          "py_math_op"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/block_py_math_op.png",
        "alt": "算術演算ブロック"
      }
    },
    {
      "track": "block",
      "title": "手順2：10 + 3 を表示する",
      "body": "<p><b>値を表示する</b> に <b>算術演算</b> ブロックをはめ込み、左を <code>10</code>、演算子を <code>+</code>、右を <code>3</code> にします。下の図のように組みましょう。</p><p>「▶ 実行」を押して <code>13</code> と出れば成功です。</p><pre>print(10 + 3)</pre>",
      "bodyEasy": "<p><b>値を表示する</b> に <b>算術演算</b> ブロックをはめ、左を <code>10</code>、記号を <code>+</code>、右を <code>3</code> にします。下の図のように組みましょう。</p><p>「▶ 実行」を押して <code>13</code> と出れば成功です。</p><pre>print(10 + 3)</pre>",
      "hint": "数値ブロックを2つ用意して、算術演算の左右にはめます。実行結果に 13。",
      "run": true,
      "check": {
        "outputEquals": "13"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-03_add.png",
        "alt": "10 + 3 を表示する組み合わせ"
      }
    },
    {
      "track": "block",
      "title": "割り算のいろいろ",
      "body": "<p>割り算には種類があります。</p><ul><li><code>/</code> は答えが <b>小数</b> になる（例：<code>10 / 3</code> → <code>3.3333333333333335</code>）</li><li><code>//</code> は小数を切り捨てた <b>整数</b>（例：<code>10 // 3</code> → <code>3</code>）</li><li><code>%</code> は割った <b>余り</b>（例：<code>10 % 3</code> → <code>1</code>）</li></ul><p>「10個のお菓子を3人で分けると1人何個で、何個余る？」に <code>//</code> と <code>%</code> がぴったりです。</p>",
      "bodyEasy": "<p>割り算には種類があります。</p><ul><li><code>/</code> は <b>小数</b>（例：<code>10 / 3</code> → <code>3.3333333333333335</code>）</li><li><code>//</code> は切り捨てた <b>整数</b>（例：<code>10 // 3</code> → <code>3</code>）</li><li><code>%</code> は <b>余り</b>（例：<code>10 % 3</code> → <code>1</code>）</li></ul><p>「お菓子10個を3人で分けると、1人何個で何個余る？」に <code>//</code> と <code>%</code> がぴったりです。</p>"
    },
    {
      "track": "block",
      "title": "手順3：10 // 3 を表示する",
      "body": "<p>演算子を <code>//</code>（整数の割り算）に変えて、下の図のように <code>10 // 3</code> を表示しましょう。</p><p>「▶ 実行」を押して <code>3</code> と出れば成功です。</p><pre>print(10 // 3)</pre>",
      "bodyEasy": "<p>記号を <code>//</code>（整数の割り算）に変えて、下の図のように <code>10 // 3</code> を表示しましょう。</p><p>「▶ 実行」を押して <code>3</code> と出れば成功です。</p><pre>print(10 // 3)</pre>",
      "hint": "プルダウンから「//（整数除算）」を選びます。実行結果に 3。",
      "run": true,
      "check": {
        "outputEquals": "3"
      },
      "image": {
        "src": "lessons/img/0-03_intdiv.png",
        "alt": "10 // 3 を表示する組み合わせ"
      }
    },
    {
      "track": "block",
      "title": "手順4：変数と計算を組み合わせる",
      "body": "<p>変数に計算結果を入れることもできます。下の図のように組み立てましょう。</p><ol><li><b>変数〜を〜にする</b> の値に <b>算術演算</b>（<code>10 + 20</code>）をはめる</li><li>その下に <b>値を表示する</b> を置き、同じ変数をはめる</li></ol><p>実行結果に <code>30</code> と出れば成功です。</p><pre>total = 10 + 20\nprint(total)</pre>",
      "bodyEasy": "<p>変数に計算の答えを入れることもできます。下の図のように組みましょう。</p><ol><li><b>変数～を～にする</b> の値に <b>算術演算</b>（<code>10 + 20</code>）をはめる</li><li>その下に <b>値を表示する</b> を置き、同じ変数をはめる</li></ol><p>実行結果に <code>30</code> と出れば成功です。</p><pre>total = 10 + 20\nprint(total)</pre>",
      "hint": "変数ブロックの値のあなに算術演算ブロックを入れます。実行結果に 30。",
      "run": true,
      "check": {
        "outputEquals": "30"
      },
      "image": {
        "src": "lessons/img/0-03_total.png",
        "alt": "変数totalに10+20を入れて表示する組み合わせ"
      }
    },
    {
      "track": "code",
      "title": "コードを読もう",
      "body": "<p>コードエリア（スマホでは「コード・実行」タブ）には、次の2行が出ています。1行ずつ意味を確認しましょう。</p><pre class=\"code-lines\">total = 10 + 20\nprint(total)</pre><ul><li><b>1行目</b>：右がわの <code>10 + 20</code> が先に計算されて <code>30</code> になり、その結果を <code>=</code> で変数 <code>total</code> に入れます。「計算してから代入する」という順番です。</li><li><b>2行目</b>：<code>print(total)</code> で <code>total</code> の中身（<code>30</code>）を表示します。</li></ul>",
      "bodyEasy": "<p>コードエリア（スマホは「コード・実行」タブ）に、次の2行が出ています。</p><pre class=\"code-lines\">total = 10 + 20\nprint(total)</pre><ul><li><b>1行目</b>：右がわの <code>10 + 20</code> が先に計算されて <code>30</code> になり、それを <code>=</code> で変数 <code>total</code> に入れます。「計算してから代入」の順です。</li><li><b>2行目</b>：<code>print(total)</code> で <code>total</code> の中身（<code>30</code>）を表示します。</li></ul>",
      "callout": {
        "target": "code",
        "text": "右上に同じ total = 10 + 20 / print(total) が出ています",
        "placement": "left"
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><code>10 % 3</code> の結果はどれでしょう？（<code>%</code> は「余り」）</p>",
      "bodyEasy": "<p><code>10 % 3</code> の結果はどれでしょう？（<code>%</code> は「余り」）</p>",
      "check": {
        "choice": {
          "options": [
            "1",
            "3",
            "0"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>2 ** 8</code>（<code>**</code> はべき乗）の結果はどれでしょう？</p>",
      "bodyEasy": "<p><code>2 ** 8</code>（<code>**</code> はべき乗）の結果はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "256",
            "16",
            "64"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード読解テスト",
      "body": "<p>次のコードを実行すると、何が表示されるでしょう。数字で答えてください。（<code>%</code> は「余り」）</p><pre class=\"code-lines\">print(17 % 5)</pre>",
      "bodyEasy": "<p>次のコードを実行すると、何が表示されるでしょう。数字で答えてください。（<code>%</code> は「余り」）</p><pre class=\"code-lines\">print(17 % 5)</pre>",
      "hint": "17 を 5 で割った余りです。",
      "check": {
        "answerText": {
          "accept": [
            "2"
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p><b>コード編集モード</b> でPythonを直接書いて、実行結果に <code>100</code> と表示しましょう。ただし <code>100</code> をそのまま書かず、<b>かけ算の式</b> で求めてください。</p><pre class=\"code-lines\">100</pre>",
      "bodyEasy": "<p><b>コード編集モード</b> でPythonを直接書いて、実行結果に <code>100</code> と表示しましょう。ただし <code>100</code> をそのまま書かず、<b>かけ算の式</b> で求めてください。</p><pre class=\"code-lines\">100</pre>",
      "hint": "print(25 * 4) のように、かけ算（*）の式を書きます。",
      "check": {
        "codeRun": {
          "outputEquals": "100",
          "codeContains": [
            {
              "pattern": "\\*",
              "message": "かけ算（*）を使って計算しましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(\\s*[\"']?100",
              "message": "100を直接書かず、計算式で求めましょう"
            }
          ]
        }
      }
    }
  ]
};
