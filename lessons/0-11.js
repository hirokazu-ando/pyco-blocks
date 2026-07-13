// このファイルは tools/build_lessons.py が lessons/0-11.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-11"] = {
  "id": "0-11",
  "group": "part0-control",
  "title": "whileで繰り返そう",
  "subtitle": "Python × 入門 #11",
  "mode": "python",
  "article": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-11-while/",
  "toolbox": [
    "var_set",
    "var_change",
    "py_while",
    "cond_compare",
    "val_number",
    "val_var",
    "py_print",
    "print_text"
  ],
  "steps": [
    {
      "track": "block",
      "title": "前回のおさらい",
      "body": "<p>0-9・0-10では <b>for</b> を使って「回数や範囲が決まっている繰り返し」を書きました。今回学ぶ <b>while</b> は、回数ではなく <b>条件</b> で繰り返しを決めます。</p><ul><li>「合計が100をこえるまで」「正しい合言葉が入るまで」のように、いつ終わるか実行するまで分からない繰り返しに向いています</li><li>条件が成り立っている間だけ、中の処理をずっと繰り返します</li></ul><p>準備ができたら「次へ ▶」を押してください。</p>",
      "bodyEasy": "<p>0-9・0-10の <b>for</b> は「回数や範囲が決まった繰り返し」でした。今回の <b>while</b> は、回数ではなく <b>条件</b> で繰り返しを決めます。</p><ul><li>「合計が100をこえるまで」のように、いつ終わるか分からない繰り返しに向きます</li><li>条件が成り立つ間だけ、中の処理をくり返します</li></ul>",
      "hint": "このパネルは右上のボタンで折りたたみ、「✕」で学習をやめられます。"
    },
    {
      "track": "block",
      "title": "whileは「条件が成り立つ間」繰り返す",
      "body": "<p><b>while</b> は「条件が成り立っている間、中の処理を繰り返す」しくみです。条件が成り立たなくなった時点で、ループの外へ進みます。</p><pre>x = 1\nwhile x <= 5:\n    print(x)\n    x = x + 1</pre><p>最初に <code>x</code> を <code>1</code> にしておきます。<code>x <= 5</code> が成り立つ間は表示をくり返し、そのたびに <code>x</code> を1増やします。<code>x</code> が6になると条件が成り立たなくなり、ループが止まります。</p>",
      "bodyEasy": "<p><b>while</b> は「条件が成り立つ間、中の処理をくり返す」しくみです。成り立たなくなったらループの外へ進みます。</p><pre>x = 1\nwhile x <= 5:\n    print(x)\n    x = x + 1</pre><p>はじめに <code>x</code> を <code>1</code> にします。<code>x <= 5</code> の間くり返し、そのたび <code>x</code> を1増やします。<code>x</code> が6で条件が成り立たなくなり止まります。</p>"
    },
    {
      "track": "block",
      "title": "手順1：繰り返しブロックを置く",
      "body": "<p>「繰り返し」カテゴリから <b>ずっと〜の間 繰り返す</b> ブロックを取り出し、下の図のように置きましょう。条件のあなには「分岐」カテゴリの <b>比較</b> ブロックを、その左右には「値」カテゴリの <b>変数</b> と <b>数値</b> を入れます。</p><p>while ブロックが1つ置けたらクリアです。</p>",
      "bodyEasy": "<p>「繰り返し」カテゴリから <b>ずっと〜の間 繰り返す</b> を出して置きます。条件のあなに <b>比較</b> ブロックを、その左右に <b>変数</b> と <b>数値</b> を入れます。</p><p>while ブロックが1つ置けたらクリアです。</p>",
      "hint": "比較ブロックの真ん中のプルダウンで、<= や >= などを選べます。",
      "check": {
        "blocksRequired": [
          "py_while"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-11_while_block.png",
        "alt": "条件に x <= 5 を入れたwhileブロック"
      }
    },
    {
      "track": "block",
      "title": "手順2：1から5まで表示する",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 x を 1 にする</b>（初期化）</li><li><b>x <= 5 の間 繰り返す</b> の中に、<b>x を表示する</b>→<b>x を 1 だけ増やす</b> を入れる</li></ol><p>「▶ 実行」を押して、<code>1</code>〜<code>5</code> が1行ずつ出れば成功です。</p><pre>1\n2\n3\n4\n5</pre>",
      "bodyEasy": "<p>下の図のように組みます。</p><ol><li><b>変数 x を 1 にする</b>（はじめの用意）</li><li><b>x <= 5 の間 繰り返す</b> の中に <b>x を表示する</b>→<b>x を 1 だけ増やす</b> を入れる</li></ol><p>「▶ 実行」で <code>1</code>〜<code>5</code> が1行ずつ出れば成功です。</p><pre>1\n2\n3\n4\n5</pre>",
      "hint": "更新（x を 1 だけ増やす）を忘れると、条件がずっと成り立ったままになり止まりません。",
      "run": true,
      "check": {
        "outputEquals": "1\n2\n3\n4\n5"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-11_count1to5.png",
        "alt": "変数xを1にして、x<=5の間くり返しながら表示・増加する組み合わせ"
      }
    },
    {
      "track": "block",
      "title": "「値を変える処理」を忘れない",
      "body": "<p>while でいちばん多い失敗は、<b>条件に使っている値を変え忘れる</b>ことです。値が変わらないと、条件がいつまでも成り立ったままになり、ループが終わりません。これを <b>無限ループ</b> と呼びます。</p><p>PycoBlocksでは実行できる回数に上限があり、終わらないループは途中で止まります。これはブラウザを守るためのしくみです。while を書くときは「いつ条件が成り立たなくなるのか」を必ず確かめましょう。</p>",
      "bodyEasy": "<p>while で多い失敗は、<b>条件に使う値を変えわすれる</b>ことです。値が変わらないと条件がずっと成り立ち、終わりません。これを <b>無限ループ（むげんループ）</b> といいます。</p><p>PycoBlocksはくり返せる回数に上限があり、終わらないループは途中で止まります。while を書くときは「いつ条件が成り立たなくなるか」を必ず確かめましょう。</p>"
    },
    {
      "track": "block",
      "title": "手順3：10からのカウントダウン",
      "body": "<p>今度は数を <b>減らしながら</b> くり返します。下の図のように組み立てましょう。</p><ol><li><b>変数 x を 10 にする</b></li><li><b>x >= 1 の間 繰り返す</b> の中で、<b>x を表示する</b>→<b>x を -1 だけ増やす</b>（1ずつ減らす）</li><li>ループの外（下）に <b>「発射！」を表示する</b> を置く</li></ol><p>「▶ 実行」を押して、<code>10</code>から<code>1</code>のあとに <code>発射！</code> と出れば成功です。</p>",
      "bodyEasy": "<p>今度は数を <b>減らしながら</b> くり返します。</p><ol><li><b>変数 x を 10 にする</b></li><li><b>x >= 1 の間 繰り返す</b> の中で <b>x を表示する</b>→<b>x を -1 だけ増やす</b>（1ずつ減らす）</li><li>ループの外（下）に <b>「発射！」を表示する</b> を置く</li></ol><p>「▶ 実行」で <code>10</code>から<code>1</code>のあとに <code>発射！</code> と出れば成功です。</p>",
      "hint": "増やすブロックの数値を -1 にすると、1ずつ減らせます。「発射！」はループの外に置きます。",
      "run": true,
      "check": {
        "outputEquals": "10\n9\n8\n7\n6\n5\n4\n3\n2\n1\n発射！"
      },
      "image": {
        "src": "lessons/img/0-11_countdown.png",
        "alt": "10から1までカウントダウンして最後に発射！と表示する組み合わせ"
      }
    },
    {
      "track": "code",
      "title": "コードを読もう：whileとインデント",
      "autoCode": true,
      "body": "<p>手順2で組んだコードを読んでみましょう。<b>初期化・条件・更新</b> の3つがそろっているかに注目します。</p><pre class=\"code-lines\">x = 1\nwhile x &lt;= 5:\n    print(x)\n    x = x + 1</pre><ul><li><b>1行目</b> <code>x = 1</code>：くり返しの前に <code>x</code> を <code>1</code> にしておきます（<b>初期化</b>）。</li><li><b>2行目</b> <code>while x &lt;= 5:</code>「<code>x</code> が 5 以下の <b>間</b> くり返す」という <b>条件</b> です。行末の <b>:</b>（コロン）で中身が始まります。</li><li><b>3行目</b>：先頭の <b>4つの空白（インデント）</b> が「<code>while</code> の中」を表します。<code>x</code> を表示します。</li><li><b>4行目</b>：同じ4つの空白なので、これも中の処理です。<code>x</code> を1増やします（<b>更新</b>）。これがあるから、<code>x</code> はいつか 6 になって条件が成り立たなくなり、ループが止まります。</li></ul><p>更新（4行目）を書き忘れると条件がずっと成り立ったままになり、終わらなくなります。for と同じく、くり返す処理はインデントで「中」に入れます。</p>",
      "bodyEasy": "<p>手順2のコードを読みます。<b>はじめの用意・条件・更新</b> の3つに注目します。</p><pre class=\"code-lines\">x = 1\nwhile x &lt;= 5:\n    print(x)\n    x = x + 1</pre><ul><li><b>1行目</b> <code>x = 1</code>：前に <code>x</code> を <code>1</code> にします（<b>はじめの用意</b>）。</li><li><b>2行目</b> <code>while x &lt;= 5:</code>「<code>x</code> が 5 以下の <b>間</b> くり返す」という <b>条件</b>。行のおわりの <b>:</b>（コロン）で中身が始まります。</li><li><b>3・4行目</b>：先頭の <b>4つの空白（インデント）＝「その中身」</b>。<code>x</code> を表示し、<code>x</code> を1増やします（<b>更新</b>）。これがあるから <code>x</code> はいつか6になり止まります。</li></ul><p>更新（4行目）を書きわすれると終わりません。</p>",
      "callout": {
        "target": "code",
        "text": "生成されたコードはここで見られます"
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード読解テスト（記述式）",
      "body": "<p>次のコードを実行すると、数が何行か表示されます。<b>最後（いちばん下）</b>に表示される数はいくつでしょう？</p><pre class=\"code-lines\">x = 1\nwhile x &lt;= 3:\n    print(x)\n    x = x + 1</pre>",
      "bodyEasy": "<p>次を実行すると数が何行か出ます。<b>最後（いちばん下）</b>に出る数はいくつでしょう？</p><pre class=\"code-lines\">x = 1\nwhile x &lt;= 3:\n    print(x)\n    x = x + 1</pre>",
      "hint": "x は 1・2・3 と表示され、4 になると x <= 3 が成り立たなくなって止まります。",
      "check": {
        "answerText": {
          "accept": [
            "3"
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p><b>while</b> を使って、<code>1</code>・<code>2</code>・<code>3</code> を1行ずつ表示するコードを書いて実行しましょう。必ず止まるように、くり返しの中で数を <b>1ずつ増やす</b> ことを忘れないでください。</p><pre class=\"code-lines\">1\n2\n3</pre>",
      "bodyEasy": "<p><b>while</b> で <code>1</code>・<code>2</code>・<code>3</code> を1行ずつ表示しましょう。必ず止まるよう、中で数を <b>1ずつ増やす</b> のを忘れないでください。</p><pre class=\"code-lines\">1\n2\n3</pre>",
      "hint": "x を 1 にしてから while x <= 3: と書き、中で x を表示し、x = x + 1 で増やします。数字を直接 print してはいけません。",
      "check": {
        "codeRun": {
          "outputEquals": "1\n2\n3",
          "codeContains": [
            {
              "pattern": "while\\s",
              "message": "while を使ってくり返しましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(\\s*1\\s*\\)",
              "message": "数字を直接 print せず、変数を表示しながらくり返しましょう"
            }
          ]
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p>while が「終わらないループ（無限ループ）」になってしまう、いちばんの原因はどれでしょう？</p>",
      "bodyEasy": "<p>while が「終わらないループ（無限ループ）」になる、いちばんの原因はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "条件に使う値を変える処理を書き忘れた",
            "表示するブロックを使いすぎた",
            "変数の名前が長すぎた"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p>次のうち、for よりも while が向いているのはどれでしょう？</p>",
      "bodyEasy": "<p>次のうち、for より while が向いているのはどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "合計が100をこえるまで入力を続ける（何回で終わるか決まっていない）",
            "1から10まで順番に表示する",
            "リストの要素を1つずつ表示する"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "課題：好きな回数だけくり返そう",
      "body": "<p>while を使って、好きな数を表示するプログラムを作ってみましょう。「初期化」「条件」「更新」の3つをそろえるのがコツです。while ブロックを1つ使えばクリアです。</p><p>組み合わせ例：</p>",
      "bodyEasy": "<p>while で好きな数を表示するプログラムを作りましょう。「はじめの用意」「条件」「更新」の3つをそろえるのがコツです。while ブロックを1つ使えばクリアです。</p><p>組み合わせ例：</p>",
      "hint": "変数を初期化し、比較ブロックで条件を作り、ループの中で値を増やす（または減らす）ようにします。",
      "check": {
        "blocksRequired": [
          "py_while"
        ]
      },
      "image": {
        "src": "lessons/img/0-11_count1to5.png",
        "alt": "whileで1から5まで表示する例"
      }
    }
  ]
};
