// このファイルは tools/build_lessons.py が lessons/0-20.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-20"] = {
  "id": "0-20",
  "group": "part0-advanced",
  "title": "リスト内包表記を使おう",
  "subtitle": "Python × 入門 #20",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-20-list-comprehension/",
  "toolbox": [
    "py_list_comp",
    "py_list_comp_if",
    "py_dict_comp",
    "py_set_comp",
    "py_ternary",
    "py_math_op",
    "cond_compare",
    "py_list_literal",
    "val_number",
    "val_var",
    "var_set",
    "py_print"
  ],
  "steps": [
    {
      "title": "短く書けるリストの作り方",
      "body": "<p>くり返しでリストを作るコードを、<b>1行で短く</b> 書ける書き方が <b>リスト内包表記</b> です。</p><p>ふつうのくり返しだと、こう書きます。</p><pre>squares = []\nfor i in range(1, 6):\n    squares.append(i * i)</pre><p>これをリスト内包表記にすると、次のように書けます。</p><pre>squares = [i * i for i in range(1, 6)]</pre><p><code>[ 式 for 変数 in リスト ]</code> の形で、各要素に式を当てはめた新しいリストができます。</p>",
      "hint": "「式 → for → 変数 → in → もとのリスト」の順で読むと意味がわかりやすいです。"
    },
    {
      "title": "手順1：内包表記ブロックを置く",
      "body": "<p>「リスト」カテゴリから <b>[ 式 for 変数 in リスト ]</b> のブロックを取り出し、下の図のように置きましょう。</p><p>1つ置けたらクリアです。</p>",
      "hint": "左のあなに式、まん中に変数名、右のあなにもとのリストを入れます。",
      "check": {
        "blocksRequired": [
          "py_list_comp"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-20_comp_block.png",
        "alt": "リスト内包表記のブロック"
      }
    },
    {
      "title": "手順2：2乗のリストを作る",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 nums</b> に <b>リスト</b> <code>[1, 2, 3, 4]</code> を入れる</li><li>内包表記の式を <code>n × n</code>、変数を <code>n</code>、もとのリストを <code>nums</code> にする</li><li><b>値を表示する</b> で結果を表示する</li></ol><p>「▶ 実行」を押して、各要素を2乗したリストが出れば成功です。</p><pre>[1, 4, 9, 16]</pre>",
      "hint": "式の部分に算術演算ブロックで n × n を入れます。",
      "run": true,
      "check": {
        "outputEquals": "[1, 4, 9, 16]"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-20_squares.png",
        "alt": "リストnumsの各要素を2乗した内包表記の組み合わせ"
      }
    },
    {
      "title": "条件でしぼり込む",
      "body": "<p>末尾に <b>if 条件</b> を加えると、条件を満たす要素だけを取り出せます。<b>[ 式 for 変数 in リスト if 条件 ]</b> のブロックを使います。</p><pre>[n for n in nums if n % 2 == 0]  →  偶数だけ</pre><p>同じ考え方で、<b>辞書内包表記</b> <code>{キー: 値 for …}</code> や <b>セット内包表記</b> <code>{式 for …}</code> も作れます。次で条件付きを試しましょう。</p>"
    },
    {
      "title": "手順3：偶数だけ取り出す",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 nums</b> に <b>リスト</b> <code>[1, 2, 3, 4, 5, 6]</code> を入れる</li><li>条件付きの内包表記で、式を <code>n</code>、変数を <code>n</code>、もとのリストを <code>nums</code>、条件を <code>n % 2 == 0</code> にする</li><li><b>値を表示する</b> で結果を表示する</li></ol><p>「▶ 実行」を押して、偶数だけのリストが出れば成功です。</p><pre>[2, 4, 6]</pre>",
      "hint": "条件には比較ブロックを使い、n を 2 で割った余り（%）が 0 と等しいかを調べます。",
      "run": true,
      "check": {
        "outputEquals": "[2, 4, 6]"
      },
      "image": {
        "src": "lessons/img/0-20_evens.png",
        "alt": "条件付き内包表記で偶数だけ取り出す組み合わせ"
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><code>[n * 2 for n in [1, 2, 3]]</code> を実行すると、どんなリストになるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "[2, 4, 6]",
            "[1, 2, 3]",
            "[6]"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>[n for n in [1, 2, 3, 4] if n &gt; 2]</code> を実行すると、どんなリストになるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "[3, 4]",
            "[1, 2]",
            "[1, 2, 3, 4]"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：自分だけのリストを作ろう",
      "body": "<p>リスト内包表記を使って、好きな計算をした新しいリストを作って表示してみましょう。内包表記ブロックを1つ使えばクリアです。</p><p>組み合わせ例：</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-20-list-comprehension/</code></p>",
      "hint": "式の部分を変えると、2乗・3倍・文字の変換など、いろいろなリストが作れます。",
      "check": {
        "blocksRequired": [
          "py_list_comp"
        ]
      },
      "image": {
        "src": "lessons/img/0-20_squares.png",
        "alt": "リスト内包表記で新しいリストを作る組み合わせの例"
      }
    }
  ]
};
