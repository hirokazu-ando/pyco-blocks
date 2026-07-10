// このファイルは tools/build_lessons.py が lessons/0-02.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-02"] = {
  "id": "0-02",
  "group": "part0-basic",
  "title": "変数に値を入れよう",
  "subtitle": "Python × 入門 #02",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-02-variables/",
  "toolbox": [
    "var_set",
    "var_change",
    "val_number",
    "val_var",
    "py_print",
    "print_var_label"
  ],
  "steps": [
    {
      "title": "変数とは何か",
      "body": "<p><b>変数</b> は、値に名前を付けて覚えておく「箱」のようなものです。</p><ul><li><b>代入</b>：変数に値を入れること（例：<code>score = 80</code>）</li><li><b>参照</b>：変数から値を取り出して使うこと（例：<code>print(score)</code>）</li></ul><p>同じ数を何度も使うときや、途中で値が変わるときに便利です。</p>",
      "hint": "変数はゲームの得点や持ち物の数など「変わっていく値」を覚えるのに役立ちます。"
    },
    {
      "title": "手順1：変数を作る",
      "body": "<p>「変数」カテゴリから <b>変数〜を〜にする</b> ブロックを取り出し、下の図のように置きましょう。変数に値を入れる（代入する）ためのブロックです。</p><p>1つ置けたらクリアです。</p>",
      "hint": "値の部分には「値」カテゴリの数値ブロックをはめ込めます。",
      "check": {
        "blocksRequired": [
          "var_set"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/block_var_set.png",
        "alt": "変数〜を〜にするブロック"
      }
    },
    {
      "title": "手順2：80を入れて表示する",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数〜を〜にする</b> に <b>数値</b> ブロックをはめて、値を <code>80</code> にする</li><li>その下に <b>値を表示する</b> を置き、「値」カテゴリの <b>変数</b> ブロックをはめる</li></ol><p>「▶ 実行」を押して <code>80</code> と表示されれば成功です。</p><pre>score = 80\nprint(score)</pre>",
      "hint": "「変数」ブロックと「値を表示」ブロックの変数名を同じにそろえます。実行結果に 80 と出ればOK。",
      "run": true,
      "check": {
        "outputEquals": "80"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-02_score80.png",
        "alt": "変数scoreを80にして表示する組み合わせ"
      }
    },
    {
      "title": "値を更新できる",
      "body": "<p>変数のいいところは、途中で値を <b>更新</b> できることです。「変数」カテゴリの <b>変数〜を〜だけ増やす</b> ブロック（<code>var_change</code>）を使うと、今の値に足し算できます。</p><pre>score = score + 10</pre><p>これを繰り返すと、値がどんどん増えていくのが見えます。</p>"
    },
    {
      "title": "手順3：10ずつ増やして表示する",
      "body": "<p>下の図のように並べて実行しましょう。</p><ol><li><b>変数を 0 にする</b></li><li><b>10だけ増やす</b>→<b>表示する</b> を3回くり返す</li></ol><p>実行結果が <code>10</code>・<code>20</code>・<code>30</code> と3行出れば成功です。</p>",
      "hint": "増やす→表示、増やす→表示、増やす→表示、の順に縦へ並べます。",
      "run": true,
      "check": {
        "outputEquals": "10\n20\n30"
      },
      "image": {
        "src": "lessons/img/0-02_count10.png",
        "alt": "変数を0にして、10だけ増やす→表示するを3回並べた組み合わせ"
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><b>代入</b> という言葉の意味はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "変数に値を入れること",
            "画面に文字を表示すること",
            "計算の答えを消すこと"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>score = 80</code> のあとに <code>score = score + 5</code> を実行しました。いま <code>score</code> の値はいくつでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "85",
            "5",
            "80"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：好きな数を表示しよう",
      "body": "<p><code>my_number</code> という変数に好きな数を入れて、その値を表示するプログラムを作りましょう。<b>変数〜を〜にする</b> と <b>値を表示する</b> の2つを置けばクリアです。</p><p>組み合わせ例（数は好きな値でOK）：</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-02-variables/</code></p>",
      "hint": "変数ブロックに数値をはめ、その下の「値を表示」に同じ変数ブロックをはめます。",
      "check": {
        "blocksRequired": [
          "var_set",
          "py_print"
        ]
      },
      "image": {
        "src": "lessons/img/0-02_mynumber.png",
        "alt": "変数my_numberに数を入れて表示する例"
      }
    }
  ]
};
