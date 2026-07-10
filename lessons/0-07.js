// このファイルは tools/build_lessons.py が lessons/0-07.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-07"] = {
  "id": "0-07",
  "group": "part0-control",
  "title": "もし〜なら（if文）",
  "subtitle": "Python × 入門 #07",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-07-if/",
  "toolbox": [
    "pico_if",
    "cond_compare",
    "var_set",
    "py_print",
    "val_number",
    "val_var",
    "val_str"
  ],
  "steps": [
    {
      "title": "条件分岐とは何か",
      "body": "<p><b>もし〜なら</b>（<code>if文</code>）を使うと、条件が正しいときだけ処理を実行できます。前回の <b>真偽値</b>（True／False）がここで役に立ちます。</p><ul><li>条件が <b>True</b> のとき → 中の処理を実行する</li><li>条件が <b>False</b> のとき → 何もしない（またはelseの処理へ）</li></ul><p>準備ができたら「次へ ▶」を押してください。</p>",
      "hint": "「もし雨なら傘を持つ」のように、条件で行動を分けるのが if文です。"
    },
    {
      "title": "手順1：もしブロックを置く",
      "body": "<p>「分岐」カテゴリから <b>もし〜だったら</b> ブロックを取り出し、下の図のように組み立てましょう。</p><ol><li>条件のあなに <b>比較</b> <code>x &gt; 0</code> をはめる</li><li>中に <b>「OK」を表示する</b> を入れる</li></ol><p>ここまで組めたらクリアです。</p>",
      "hint": "条件のあなは六角形。ここに比較ブロックがぴったり入ります。",
      "check": {
        "blocksRequired": [
          "pico_if"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-07_if_place.png",
        "alt": "もしx>0だったらOKを表示するブロック"
      }
    },
    {
      "title": "手順2：正の数のとき表示する",
      "body": "<p>下の図のように、上に <b>変数 x を 3 にする</b> を足しましょう。<code>x</code> は <code>3</code> なので条件 <code>x &gt; 0</code> は正しく（True）、中の処理が実行されます。</p><p>「▶ 実行」を押して <code>OK</code> と出れば成功です。</p><pre>x = 3\nif x &gt; 0:\n    print(\"OK\")</pre>",
      "hint": "変数ブロックの下に、さっき作った「もし」ブロックをつなげます。",
      "run": true,
      "check": {
        "outputEquals": "OK"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-07_if_ok.png",
        "alt": "x=3のときOKを表示する組み合わせ"
      }
    },
    {
      "title": "elseで2択にする",
      "body": "<p>「もし〜だったら」ブロックの左下の <b>＋ボタン</b> を押すと、<b>そうでなければ</b>（<code>else</code>）が追加されます。</p><ul><li>条件が <b>True</b> → 上の処理</li><li>条件が <b>False</b> → <b>そうでなければ</b> の処理</li></ul><p>これで「どちらか一方」を必ず実行できます。さらに＋を押すと <b>そうでなくもし</b>（<code>elif</code>）も追加でき、3段階以上に分けられます。</p>"
    },
    {
      "title": "手順3：elseで2択にする",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 x を -5 にする</b></li><li>＋ボタンで <b>そうでなければ</b> を追加する</li><li>上に <b>「OK」を表示する</b>、そうでなければに <b>「NG」を表示する</b></li></ol><p><code>x</code> は <code>-5</code> なので条件は間違い（False）。「▶ 実行」して <code>NG</code> と出れば成功です。</p><pre>x = -5\nif x &gt; 0:\n    print(\"OK\")\nelse:\n    print(\"NG\")</pre>",
      "hint": "＋ボタンを1回押すと「そうでなければ」が出ます。表示ブロックの文字を OK と NG にします。",
      "run": true,
      "check": {
        "outputEquals": "NG"
      },
      "image": {
        "src": "lessons/img/0-07_ifelse.png",
        "alt": "x=-5のときelseでNGを表示する組み合わせ"
      }
    },
    {
      "title": "コードを読もう：if〜elseとインデント",
      "body": "<p>手順3で組んだコードを読んでみましょう。ここで大切なのは <b>行末のコロン</b> と <b>インデント（行のはじめの空白）</b> です。</p><pre class=\"code-lines\">x = -5\nif x &gt; 0:\n    print(\"OK\")\nelse:\n    print(\"NG\")</pre><ul><li><b>1行目</b>：変数 <code>x</code> に <code>-5</code> を入れます。</li><li><b>2行目</b> <code>if x &gt; 0:</code>「もし <code>x</code> が 0 より大きいなら」。行末の <b>:</b>（コロン）は「ここから中の処理が始まる」という合図です。</li><li><b>3行目</b>：先頭の <b>4つの空白（インデント）</b> が「<code>if</code> の中」を表します。条件が正しいときだけ実行されます。今回 <code>x</code> は <code>-5</code> なので実行されません。</li><li><b>4行目</b> <code>else:</code>「そうでなければ」。こちらもコロンで終わります。</li><li><b>5行目</b>：同じく4つの空白で下げられているので「<code>else</code> の中」です。今回はこちらが実行され <code>NG</code> と表示されます。</li></ul><p>インデントの <b>4つの空白＝「中」</b> という意味を、しっかり覚えておきましょう。</p>",
      "callout": {
        "target": "code",
        "text": "生成されたコードはここで見られます"
      }
    },
    {
      "quiz": true,
      "title": "コード読解テスト（記述式）",
      "body": "<p>次のコードを実行すると、何が表示されるでしょう？</p><pre class=\"code-lines\">y = 20\nif y &gt; 10:\n    print(\"大きい\")\nelse:\n    print(\"小さい\")</pre>",
      "hint": "y は 20 です。20 は 10 より大きいので、if の中が実行されます。",
      "check": {
        "answerText": {
          "accept": [
            "大きい"
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p><b>変数 x を 8 にして</b>、<code>x</code> が <code>5</code> より大きければ <code>OK</code> を、そうでなければ <code>NG</code> を表示する <b>if〜else</b> を書いて実行しましょう。<code>OK</code> と表示されれば成功です。</p>",
      "hint": "1行目で x を作り、if の条件のあとにコロンを付け、中の行は4つの空白で下げます。else も忘れずに。",
      "check": {
        "codeRun": {
          "outputEquals": "OK",
          "codeContains": [
            {
              "pattern": "if\\s",
              "message": "if を使って判定しましょう"
            },
            {
              "pattern": "else",
              "message": "else（そうでなければ）も使いましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "^\\s*print",
              "message": "最初に答えを直接 print せず、if〜else で分けて表示しましょう"
            },
            {
              "pattern": "if\\s+True",
              "message": "条件は自分で決めましょう（if True のような書き方は使いません）"
            }
          ]
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><code>x</code> が <code>3</code> のとき、<code>if x &gt; 0:</code> の中の処理はどうなるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "条件が正しいので実行される",
            "条件が間違いなので実行されない",
            "エラーになる"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>s = 75</code> のとき、次のプログラムは何を表示するでしょう？</p><pre>if s &gt;= 90:\n    print(\"A\")\nelif s &gt;= 70:\n    print(\"B\")\nelse:\n    print(\"C\")</pre>",
      "check": {
        "choice": {
          "options": [
            "B",
            "A",
            "C"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：条件で分けよう",
      "body": "<p><b>もし〜だったら</b> ブロックを使って、条件によって表示を分けるプログラムを作りましょう。もしブロックを1つ使えばクリアです。</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-07-if/</code></p>",
      "hint": "＋ボタンで else や elif を足すと、より細かく分けられます。",
      "check": {
        "blocksRequired": [
          "pico_if"
        ]
      }
    }
  ]
};
