// このファイルは tools/build_lessons.py が lessons/0-10.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-10"] = {
  "id": "0-10",
  "group": "part0-control",
  "title": "自由にくり返そう（for応用）",
  "subtitle": "Python × 入門 #10",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-10-for-advanced/",
  "toolbox": [
    "pico_for_from_to",
    "pico_for_range",
    "py_print",
    "val_number",
    "val_var"
  ],
  "steps": [
    {
      "title": "rangeを自由に使う",
      "body": "<p>前回の <code>range(3)</code> は <b>0から</b> 数え始めました。今回は <b>始まり・終わり・とびかた</b> を自分で決めます。</p><ul><li><b>始まりの値</b> を指定できる（例：2から）</li><li><b>いくつずつ</b> 進むか（とびかた）を決められる（例：2ずつ）</li><li>とびかたを <b>マイナス</b> にすると、逆順に数えられる</li></ul><p>「変数 i を〜から〜まで〜ずつ繰り返す」ブロックを使います。<b>終わりの値そのものは含まない</b> のがポイントです。</p>",
      "hint": "「繰り返し」カテゴリの「〜から〜まで〜ずつ繰り返す」ブロックを使います。"
    },
    {
      "title": "手順1：開始値を指定する",
      "body": "<p>「繰り返し」カテゴリから <b>変数 i を〜から〜まで〜ずつ繰り返す</b> ブロックを取り出し、下の図のように組みましょう。<code>2</code> から <code>7</code> まで <code>1</code> ずつ、中で <b>値を表示する</b> に <code>i</code> をはめます。</p><p>「▶ 実行」を押して <code>2</code> から <code>6</code> まで出れば成功です（7は含みません）。</p><pre>for i in range(2, 7):\n    print(i)</pre>",
      "hint": "3つのあなに、始まり 2・終わり 7・とびかた 1 を入れます。終わりの値は表示されません。",
      "run": true,
      "check": {
        "outputEquals": "2\n3\n4\n5\n6"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-10_r27.png",
        "alt": "2から7まで1ずつ繰り返してiを表示する組み合わせ"
      }
    },
    {
      "title": "とびかたを変える",
      "body": "<p>3つ目のあな（とびかた）を <code>2</code> にすると、<b>1つおき</b> に進みます。</p><pre>for i in range(1, 10, 2):\n    print(i)</pre><p>これで <code>1, 3, 5, 7, 9</code> のように奇数だけを取り出せます。とびかたを <code>3</code> にすれば3つおき、というように自由に決められます。</p>"
    },
    {
      "title": "手順2：1つおきに表示する",
      "body": "<p>下の図のように、<code>1</code> から <code>10</code> まで <code>2</code> ずつ繰り返しましょう。</p><p>「▶ 実行」を押して <code>1</code>・<code>3</code>・<code>5</code>・<code>7</code>・<code>9</code> と出れば成功です。</p><pre>for i in range(1, 10, 2):\n    print(i)</pre>",
      "hint": "とびかたのあなを 2 にするのがポイントです。10は含まれません。",
      "run": true,
      "check": {
        "outputEquals": "1\n3\n5\n7\n9"
      },
      "image": {
        "src": "lessons/img/0-10_r1102.png",
        "alt": "1から10まで2ずつ繰り返してiを表示する組み合わせ"
      }
    },
    {
      "title": "逆順に数える",
      "body": "<p>とびかたを <b>マイナス</b> にすると、大きい数から小さい数へ <b>逆順</b> に数えられます。</p><pre>for i in range(5, 0, -1):\n    print(i)</pre><p>これで <code>5, 4, 3, 2, 1</code> とカウントダウンできます。始まりを大きく、終わりを小さくして、とびかたを <code>-1</code> にするのがコツです。</p>"
    },
    {
      "title": "手順3：カウントダウンする",
      "body": "<p>下の図のように、<code>5</code> から <code>0</code> まで <code>-1</code> ずつ繰り返しましょう。とびかたのあなには <b>数値</b> の <code>-1</code> を入れます。</p><p>「▶ 実行」を押して <code>5</code> から <code>1</code> まで逆順に出れば成功です。</p><pre>for i in range(5, 0, -1):\n    print(i)</pre>",
      "hint": "とびかたを -1 にします。終わりの 0 は含まれないので、1 まで表示されます。",
      "run": true,
      "check": {
        "outputEquals": "5\n4\n3\n2\n1"
      },
      "image": {
        "src": "lessons/img/0-10_r5001.png",
        "alt": "5から0まで-1ずつ繰り返してカウントダウンする組み合わせ"
      }
    },
    {
      "title": "コードを読もう：range(始まり, 終わり, とびかた)",
      "body": "<p>手順3で組んだカウントダウンのコードを読んでみましょう。<code>range</code> に <b>3つの数</b> を入れています。</p><pre class=\"code-lines\">for i in range(5, 0, -1):\n    print(i)</pre><ul><li><b>1行目</b> <code>for i in range(5, 0, -1):</code> の3つの数は、順に <b>始まり（5）</b>・<b>終わり（0）</b>・<b>とびかた（-1）</b> です。とびかたが <code>-1</code> なので 1 ずつ減り、<code>5 → 4 → 3 → 2 → 1</code> と変わります。<b>終わりの 0 は含まない</b> ので、0 は表示されません。行末の <b>:</b>（コロン）で中身が始まります。</li><li><b>2行目</b>：先頭の <b>4つの空白（インデント）</b> が「<code>for</code> の中」を表し、<code>print(i)</code> がくり返されます。</li></ul><p>始まり・終わり・とびかたを変えると、とびとびの数や逆順のくり返しが自由に作れます。</p>",
      "callout": {
        "target": "code",
        "text": "生成されたコードはここで見られます"
      }
    },
    {
      "quiz": true,
      "title": "コード読解テスト（記述式）",
      "body": "<p>次のコードを実行すると、数が何行か表示されます。<b>1行目</b>に表示される数はいくつでしょう？</p><pre class=\"code-lines\">for i in range(2, 11, 2):\n    print(i)</pre>",
      "hint": "始まりは 2 です。2 から 2 ずつ増えていきます。",
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
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p><code>range</code> の <b>始まり・終わり・とびかた</b>（3つの数）を使って、<code>2</code>・<code>4</code>・<code>6</code>・<code>8</code> を表示するコードを書いて実行しましょう。</p><pre class=\"code-lines\">2\n4\n6\n8</pre>",
      "hint": "range に 3つの数を入れます。始まりを 2、とびかたを 2 にすると 2, 4, 6, 8 の順になります。数字を直接 print してはいけません。",
      "check": {
        "codeRun": {
          "outputEquals": "2\n4\n6\n8",
          "codeContains": [
            {
              "pattern": "for\\s",
              "message": "for を使ってくり返しましょう"
            },
            {
              "pattern": "range\\(\\s*\\d+\\s*,\\s*\\d+\\s*,",
              "message": "range に 始まり・終わり・とびかた の3つの数を入れましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(\\s*2\\s*\\)",
              "message": "数字を直接 print せず、カウンタ変数 i を表示しましょう"
            }
          ]
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><code>for i in range(2, 11, 2):</code> で表示される最後の数はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "10",
            "11",
            "12"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>for i in range(10, 0, -1):</code> は、いくつの数を表示するでしょう？（10から1まで）</p>",
      "check": {
        "choice": {
          "options": [
            "10個",
            "11個",
            "9個"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：カウントダウンを作ろう",
      "body": "<p><b>〜から〜まで〜ずつ繰り返す</b> ブロックを使って、好きな数からのカウントダウンや、とびとびの数を表示するプログラムを作りましょう。このブロックを1つ使えばクリアです。</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-10-for-advanced/</code></p>",
      "hint": "とびかたをマイナスにすると逆順、2以上にするととびとびになります。",
      "check": {
        "blocksRequired": [
          "pico_for_from_to",
          "py_print"
        ]
      }
    }
  ]
};
