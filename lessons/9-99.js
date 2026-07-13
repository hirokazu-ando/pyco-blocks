// このファイルは tools/build_lessons.py が lessons/9-99.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["9-99"] = {
  "id": "9-99",
  "group": null,
  "title": "エンジン検証（answerText / codeRun）",
  "subtitle": "テスト専用",
  "mode": "python",
  "toolbox": [
    "print_text"
  ],
  "steps": [
    {
      "quiz": true,
      "title": "コード読解テスト（記述式）",
      "body": "<p>次のコードを実行すると、何が表示されるでしょう？数字で答えてください。</p><pre class=\"code-lines\">x = 50\ny = 3\nprint(x + y)</pre>",
      "bodyEasy": "<p><b>やさしい版</b>：<code>x</code> は <code>50</code>、<code>y</code> は <code>3</code> です。<code>x + y</code> は <code>50 + 3</code> のたし算になります。答えの数字を入れてみましょう。</p><pre class=\"code-lines\">x = 50\ny = 3\nprint(x + y)</pre>",
      "hint": "x + y は 50 + 3 の計算です。",
      "check": {
        "answerText": {
          "accept": [
            "53",
            "\"53\""
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "quiz": true,
      "title": "フォールバック検証（bodyEasy なし）",
      "body": "<p>このステップには <code>bodyEasy</code> がありません。「やさしい」を選んでも、この通常の解説がそのまま表示されれば正しくフォールバックできています。<code>10</code> と <code>5</code> をかけ算した答えを入れてください。</p><pre class=\"code-lines\">print(10 * 5)</pre>",
      "hint": "10 × 5 の答えです。",
      "check": {
        "answerText": {
          "accept": [
            "50"
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p><b>for文</b> を使って、<code>1</code>・<code>2</code>・<code>3</code> を1行ずつ表示するコードを書いて実行しましょう。</p><pre class=\"code-lines\">1\n2\n3</pre>",
      "bodyEasy": "<p><b>やさしい版</b>：<code>for</code> は「くり返し」のブロックです。<code>1</code>・<code>2</code>・<code>3</code> をじゅんばんに1行ずつ出してみましょう。</p><pre class=\"code-lines\">1\n2\n3</pre>",
      "hint": "for i in range(1, 4): のように書きます。",
      "check": {
        "codeRun": {
          "outputEquals": "1\n2\n3",
          "codeContains": [
            {
              "pattern": "for\\s",
              "message": "実行結果は合っていますが、for文を使って書いてみましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(1\\)",
              "message": "実行結果は合っていますが、数字を直接printせず、for文でくり返してみましょう"
            }
          ]
        }
      }
    }
  ]
};
