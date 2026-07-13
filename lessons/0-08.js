// このファイルは tools/build_lessons.py が lessons/0-08.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-08"] = {
  "id": "0-08",
  "group": "part0-control",
  "title": "and・or・not（論理演算）",
  "subtitle": "Python × 入門 #08",
  "mode": "python",
  "article": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-08-logic/",
  "toolbox": [
    "pico_if",
    "cond_compare",
    "cond_and",
    "cond_or",
    "cond_not",
    "var_set",
    "py_print",
    "val_number",
    "val_var",
    "val_str",
    "val_bool"
  ],
  "steps": [
    {
      "track": "block",
      "title": "論理演算とは何か",
      "body": "<p>2つ以上の条件を組み合わせたいときに使うのが <b>論理演算</b> です。</p><ul><li><b>かつ（and）</b>：両方が正しいときだけ True</li><li><b>または（or）</b>：どちらか一方でも正しければ True</li><li><b>でない（not）</b>：正しい／間違いをひっくり返す</li></ul><p>「80点以上 <b>かつ</b> 提出済み」のように、複数の条件をまとめて判定できます。</p>",
      "hint": "and・or・not はすべて「分岐」カテゴリにあります。"
    },
    {
      "track": "block",
      "title": "手順1：かつ（and）ブロックを置く",
      "body": "<p>「分岐」カテゴリから <b>かつ</b> ブロックを取り出し、下の図のように左右へ <b>比較</b> をはめましょう。左に <code>x &gt;= 80</code>、右に <code>x &lt;= 100</code> を入れます。</p><p>ここまで組めたらクリアです。</p>",
      "hint": "「かつ」ブロックの左右のあなには、六角形の比較ブロックが入ります。",
      "check": {
        "blocksRequired": [
          "cond_and"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-08_and_place.png",
        "alt": "x>=80かつx<=100の比較ブロック"
      }
    },
    {
      "track": "block",
      "title": "手順2：2つの条件がそろったら",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 x を 85 にする</b></li><li><b>もし〜だったら</b> の条件に <b>かつ</b>（<code>x &gt;= 80</code> かつ <code>x &lt;= 100</code>）をはめる</li><li>中に <b>「PASS」を表示する</b> を入れる</li></ol><p><code>x</code> は <code>85</code> で両方の条件が正しいので、「▶ 実行」して <code>PASS</code> と出れば成功です。</p><pre>x = 85\nif x &gt;= 80 and x &lt;= 100:\n    print(\"PASS\")</pre>",
      "hint": "「かつ」は両方が正しいときだけ True になります。",
      "run": true,
      "check": {
        "outputEquals": "PASS"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-08_and.png",
        "alt": "x=85のときPASSを表示する組み合わせ"
      }
    },
    {
      "track": "block",
      "title": "または（or）と でない（not）",
      "body": "<p>残りの2つも見てみましょう。</p><ul><li><b>または（or）</b>：<code>a == 0 or b == 0</code> は、どちらかが0なら True</li><li><b>でない（not）</b>：<code>not 条件</code> は、正しい／間違いを反転する</li></ul><p><code>not True</code> は <code>False</code>、<code>not False</code> は <code>True</code> になります。<b>でない</b> は真偽値の変数と組み合わせると読みやすくなります。</p>"
    },
    {
      "track": "block",
      "title": "手順3：でない（not）を使う",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 is_raining を False にする</b>（「値」カテゴリの True/False ブロック）</li><li><b>もし〜だったら</b> の条件に <b>でない</b> をはめ、中に <code>is_raining</code> を入れる</li><li>中に <b>「出発」を表示する</b> を入れる</li></ol><p><code>is_raining</code> は <code>False</code>、その <b>でない</b> は True なので、「▶ 実行」して <code>出発</code> と出れば成功です。</p><pre>is_raining = False\nif not is_raining:\n    print(\"出発\")</pre>",
      "hint": "not は真偽をひっくり返します。False の「でない」は True です。",
      "run": true,
      "check": {
        "outputEquals": "出発"
      },
      "image": {
        "src": "lessons/img/0-08_not.png",
        "alt": "not is_rainingのとき出発を表示する組み合わせ"
      }
    },
    {
      "track": "code",
      "title": "コードを読もう：かつ（and）を使ったif",
      "body": "<p>手順2で組んだコードを読んでみましょう。<code>if</code> の条件に <b>かつ（and）</b> を使っています。</p><pre class=\"code-lines\">x = 85\nif x &gt;= 80 and x &lt;= 100:\n    print(\"PASS\")</pre><ul><li><b>1行目</b>：変数 <code>x</code> に <code>85</code> を入れます。</li><li><b>2行目</b> <code>if x &gt;= 80 and x &lt;= 100:</code>「もし <code>x</code> が 80 以上 <b>かつ</b> 100 以下なら」。<code>and</code> は左右の両方が正しいときだけ全体が True になります。行末の <b>:</b>（コロン）で中の処理が始まります。</li><li><b>3行目</b>：先頭の <b>4つの空白（インデント）</b> が「<code>if</code> の中」を表します。条件が正しいときだけ <code>PASS</code> が表示されます。<code>x</code> は <code>85</code> で両方の条件が正しいので実行されます。</li></ul><p>2つの条件を <code>and</code> や <code>or</code> でつなぐと、1つの <code>if</code> でまとめて判定できます。</p>",
      "callout": {
        "target": "code",
        "text": "生成されたコードはここで見られます"
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード読解テスト（記述式）",
      "body": "<p>次のコードを実行すると、何が表示されるでしょう？</p><pre class=\"code-lines\">a = 5\nif a &gt; 0 and a &lt; 10:\n    print(\"範囲内\")\nelse:\n    print(\"範囲外\")</pre>",
      "hint": "a は 5 です。5 は「0 より大きい」かつ「10 より小さい」を両方みたすでしょうか。",
      "check": {
        "answerText": {
          "accept": [
            "範囲内"
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p><b>変数 x を 85 にして</b>、<code>x</code> が <code>80</code> 以上 <b>かつ</b> <code>100</code> 以下なら <code>PASS</code> を、そうでなければ <code>NG</code> を表示しましょう。<code>PASS</code> と表示されれば成功です。</p>",
      "hint": "1行目で x を作り、if の条件で 2つの比較を and でつなぎます。中の行は4つの空白で下げます。",
      "check": {
        "codeRun": {
          "outputEquals": "PASS",
          "codeContains": [
            {
              "pattern": "\\b(and|or)\\b",
              "message": "and か or を使って2つの条件を組み合わせましょう"
            },
            {
              "pattern": "if\\s",
              "message": "if を使って判定しましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "^\\s*print",
              "message": "最初に答えを直接 print せず、条件で分けて表示しましょう"
            }
          ]
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><code>True and False</code>（かつ）の結果はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "False（両方が正しくないとダメ）",
            "True",
            "エラーになる"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>True or False</code>（または）の結果はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "True（どちらか一方でOK）",
            "False",
            "エラーになる"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "課題：複数の条件で判定しよう",
      "body": "<p><b>かつ</b> または <b>または</b> を使って、複数の条件をまとめて判定するプログラムを作りましょう。<b>もし〜だったら</b> と組み合わせ、<b>かつ</b> ブロックを1つ使えばクリアです。</p>",
      "hint": "「10以上 かつ 100以下」のような範囲の判定に、かつ が便利です。",
      "check": {
        "blocksRequired": [
          "cond_and",
          "pico_if"
        ]
      }
    }
  ]
};
