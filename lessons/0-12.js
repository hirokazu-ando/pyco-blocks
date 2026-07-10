// このファイルは tools/build_lessons.py が lessons/0-12.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-12"] = {
  "id": "0-12",
  "group": "part0-control",
  "title": "リストを使おう",
  "subtitle": "Python × 入門 #12",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-12-list/",
  "toolbox": [
    "var_set",
    "py_list_empty",
    "py_list_append",
    "py_list_get",
    "py_list_len",
    "py_for_list",
    "val_number",
    "val_str",
    "val_var",
    "py_print",
    "print_text"
  ],
  "steps": [
    {
      "title": "リストとは何か",
      "body": "<p>これまでは <code>x</code> や <code>score</code> のように、1つの変数に1つの値を入れてきました。でも「点数が10人分ある」「部品名をまとめたい」ときに、変数を何個も作るのは大変です。</p><p><b>リスト</b> は、複数の値を <b>順番に並べて</b> 1つの変数で管理するしくみです。for と組み合わせると、たくさんのデータを同じ処理でまとめて扱えます。</p><p>準備ができたら「次へ ▶」を押してください。</p>",
      "hint": "このパネルは右上の「▶」で折りたたみ、「✕」で学習をやめられます。"
    },
    {
      "title": "リストは「順番つきの入れ物」",
      "body": "<p>リストは値を左から順に並べたデータです。PycoBlocksでは、まず <b>空のリスト</b> を作り、そこへ値を <b>追加</b> していきます。何番目かを指す番号を <b>インデックス</b> と呼び、Pythonでは <b>0から</b> 始まります。</p><pre>fruits = []\nfruits.append(\"apple\")\nfruits.append(\"orange\")\nprint(fruits[0])</pre><p>追加する命令はリストの最後に値を足します。<code>fruits[0]</code> は先頭（0番目）の要素です。</p>"
    },
    {
      "title": "手順1：空のリストを作る",
      "body": "<p>「変数」カテゴリの <b>変数〜を〜にする</b> に、「リスト」カテゴリの <b>空のリスト [ ]</b> をはめ込み、下の図のように置きましょう。これで空のリストが入った変数ができます。</p><p>2つのブロックが置けたらクリアです。</p>",
      "hint": "変数名は好きに決めてかまいません。図では fruits にしています。",
      "check": {
        "blocksRequired": [
          "var_set",
          "py_list_empty"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-12_empty_list.png",
        "alt": "変数fruitsに空のリストを入れる組み合わせ"
      }
    },
    {
      "title": "手順2：果物を追加して先頭を表示する",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li>空のリストを変数 <code>fruits</code> に入れる</li><li><b>リスト fruits に〜を追加する</b> を3つ並べ、<code>apple</code>・<code>orange</code>・<code>grape</code> を追加する</li><li><b>リスト fruits の 0 番目</b> を表示する</li></ol><p>「▶ 実行」を押して <code>apple</code> と出れば成功です。</p><pre>apple</pre>",
      "hint": "追加ブロックの値には「値」カテゴリの文字列ブロックを入れます。表示には「リスト〜の〜番目」を使います。",
      "run": true,
      "check": {
        "outputEquals": "apple"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-12_fruits_first.png",
        "alt": "3つの果物を追加して先頭を表示する組み合わせ"
      }
    },
    {
      "title": "長さを調べる・forで順に取り出す",
      "body": "<p>リストの要素数（個数）は <b>リスト〜の長さ</b> で調べられます。そしてリストの本当の強みは <b>for</b> との組み合わせです。</p><pre>for item in parts:\n    print(item)</pre><p>リストの中身を先頭から1つずつ <code>item</code> に入れて繰り返します。要素が増えても、同じ形のコードでそのまま処理できます。</p>"
    },
    {
      "title": "手順3：部品名を順番に表示する",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li>空のリストを変数 <code>parts</code> に入れる</li><li><code>LED</code>・<code>sensor</code>・<code>motor</code> を追加する</li><li><b>変数 item ← リスト parts を順に繰り返す</b> の中で <b>item を表示する</b></li></ol><p>「▶ 実行」を押して、3つの部品名が1行ずつ出れば成功です。</p><pre>LED\nsensor\nmotor</pre>",
      "hint": "繰り返しの中の「表示する」には、取り出した item（変数）を入れます。",
      "run": true,
      "check": {
        "outputEquals": "LED\nsensor\nmotor"
      },
      "image": {
        "src": "lessons/img/0-12_for_parts.png",
        "alt": "リストparts の中身をforで順に表示する組み合わせ"
      }
    },
    {
      "title": "コードを読もう：リストの [ ] とインデックス",
      "body": "<p>手順2で組んだブロックは、次のPythonコードになります。1行ずつ読んでみましょう。</p><pre class=\"code-lines\">fruits = []\nfruits.append(\"apple\")\nfruits.append(\"orange\")\nfruits.append(\"grape\")\nprint(fruits[0])</pre><ul><li>1行目：<code>[]</code> は空のリストです。変数 <code>fruits</code> に空のリストを入れています。</li><li>2〜4行目：<code>append</code> はリストの<b>最後に値を足す</b>命令です。上から順に apple・orange・grape が並びます。</li><li>5行目：<code>fruits[0]</code> の <code>[ ]</code> は<b>インデックス（何番目か）</b>を表します。番号は <b>0から</b>始まるので、<code>fruits[0]</code> は先頭の <code>apple</code> です。</li></ul><p>この <code>[ ]</code> が、リストを作るときと、要素を取り出すときの両方で出てくることに注目しましょう。</p>",
      "hint": "インデックスは0から数えます。先頭が0番目、次が1番目です。",
      "callout": {
        "target": "code",
        "text": "生成されたコードはここで確認できます"
      }
    },
    {
      "quiz": true,
      "title": "コード読解テスト",
      "body": "<p>次のコードを実行すると、何が表示されるでしょう？表示される値を答えてください。</p><pre class=\"code-lines\">nums = [10, 20, 30, 40]\nprint(nums[2])</pre>",
      "hint": "インデックスは0から数えます。nums[0]が10、nums[1]が20です。",
      "check": {
        "answerText": {
          "accept": [
            "30",
            "\"30\""
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p>果物を3つ入れた<b>リスト</b>を作り、<b>先頭（0番目）</b>と<b>3番目（インデックス2）</b>の要素を表示するコードを書いて実行しましょう。</p><pre class=\"code-lines\">apple\ngrape</pre>",
      "hint": "fruits = [\"apple\", \"orange\", \"grape\"] のようにリストを作り、fruits[0] と fruits[2] を表示します。",
      "check": {
        "codeRun": {
          "outputEquals": "apple\ngrape",
          "codeContains": [
            {
              "pattern": "\\[",
              "message": "実行結果は合っていますが、リストの [ ] を使ってリストを作ってみましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(\\s*[\"'](apple|grape)",
              "message": "実行結果は合っていますが、文字を直接printせず、リストの要素を取り出して表示しましょう"
            }
          ]
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p>リスト <code>fruits = [\"apple\", \"orange\", \"grape\"]</code> のとき、先頭の <code>\"apple\"</code> を取り出す書き方はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "fruits[0]",
            "fruits[1]",
            "fruits[3]"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>[\"LED\", \"sensor\", \"motor\"]</code> の <b>長さ</b>（要素数）はいくつでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "3",
            "2",
            "0"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：好きな言葉のリストを表示しよう",
      "body": "<p>好きな言葉を3つ以上リストに追加して、for で1つずつ表示してみましょう。<b>追加する</b> と <b>順に繰り返す</b> をどちらも使えばクリアです。</p><p>組み合わせ例：</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-12-list/</code></p>",
      "hint": "空のリストを作り、追加ブロックで値を入れてから、for で順に表示します。",
      "check": {
        "blocksRequired": [
          "py_list_append",
          "py_for_list"
        ]
      },
      "image": {
        "src": "lessons/img/0-12_for_parts.png",
        "alt": "リストの中身をforで順に表示する例"
      }
    }
  ]
};
