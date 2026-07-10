// このファイルは tools/build_lessons.py が lessons/0-13.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-13"] = {
  "id": "0-13",
  "group": "part0-control",
  "title": "辞書を使おう",
  "subtitle": "Python × 入門 #13",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-13-dict/",
  "toolbox": [
    "var_set",
    "py_dict_new",
    "py_dict_set",
    "py_dict_get",
    "py_dict_keys",
    "py_for_list",
    "val_number",
    "val_str",
    "val_var",
    "py_print",
    "print_text"
  ],
  "steps": [
    {
      "title": "辞書とは何か",
      "body": "<p>0-12のリストは「0番目、1番目」のように <b>番号</b> でデータを取り出しました。今回学ぶ <b>辞書</b> は、番号ではなく <b>キー</b> と呼ぶ名前で値を取り出すデータです。</p><p>人のプロフィール、部品の在庫数、教科ごとの点数のように、「名前」と「値」をセットで管理したいときに役立ちます。</p><p>準備ができたら「次へ ▶」を押してください。</p>",
      "hint": "このパネルは右上の「▶」で折りたたみ、「✕」で学習をやめられます。"
    },
    {
      "title": "辞書は「キー」と「値」のセット",
      "body": "<p>辞書は、キーと値をセットで管理します。キーを指定すると、それに対応する値を取り出せます。あとからキーと値を追加することもできます。</p><pre>person = {}\nperson[\"name\"] = \"Taro\"\nprint(person[\"name\"])</pre><p><code>person[\"name\"]</code> は、キー <code>\"name\"</code> に対応する値を取り出します。この例では <code>Taro</code> が表示されます。</p>"
    },
    {
      "title": "手順1：空の辞書を作る",
      "body": "<p>「変数」カテゴリの <b>変数〜を〜にする</b> に、「辞書」カテゴリの <b>空の辞書 { }</b> をはめ込み、下の図のように置きましょう。</p><p>2つのブロックが置けたらクリアです。</p>",
      "hint": "変数名は好きに決めてかまいません。図では person にしています。",
      "check": {
        "blocksRequired": [
          "var_set",
          "py_dict_new"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-13_empty_dict.png",
        "alt": "変数personに空の辞書を入れる組み合わせ"
      }
    },
    {
      "title": "手順2：キーと値を入れて取り出す",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li>空の辞書を変数 <code>person</code> に入れる</li><li><b>辞書 person の〜に〜を入れる</b> で、キー <code>name</code> に <code>Taro</code>、キー <code>age</code> に <code>16</code> を入れる</li><li><b>辞書 person の〜の値</b> を使って、キー <code>name</code> の値を表示する</li></ol><p>「▶ 実行」を押して <code>Taro</code> と出れば成功です。</p><pre>Taro</pre>",
      "hint": "キーには文字列ブロックを入れます。取り出しブロックのキーも同じ name にそろえます。",
      "run": true,
      "check": {
        "outputEquals": "Taro"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-13_person_name.png",
        "alt": "辞書personにnameとageを入れてnameの値を表示する組み合わせ"
      }
    },
    {
      "title": "キー一覧を使って順に処理する",
      "body": "<p>辞書そのものは「キーで取り出す」データですが、<b>キー一覧</b> を作れば for と組み合わせて順番に処理できます。PycoBlocksでは、キー一覧をリストとして取り出してからループします。</p><pre>keys = list(scores.keys())\nfor name in keys:\n    print(scores[name])</pre><p><code>name</code> にはキーが順番に入り、<code>scores[name]</code> でそのキーの値を取り出せます。</p>"
    },
    {
      "title": "手順3：教科ごとの点数を表示する",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li>空の辞書を変数 <code>scores</code> に入れる</li><li>キー <code>math</code> に <code>80</code>、キー <code>science</code> に <code>90</code> を入れる</li><li><b>辞書 scores のキー一覧</b> を変数 <code>keys</code> に入れる</li><li><b>keys を順に繰り返す</b> の中で、キー（name）の値を表示する</li></ol><p>「▶ 実行」を押して <code>80</code>・<code>90</code> が出れば成功です。</p><pre>80\n90</pre>",
      "hint": "取り出しブロックのキーには、繰り返しで取り出した name（変数）を入れます。",
      "run": true,
      "check": {
        "outputEquals": "80\n90"
      },
      "image": {
        "src": "lessons/img/0-13_iterate.png",
        "alt": "辞書scoresのキー一覧をforで順に取り出して値を表示する組み合わせ"
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p>辞書 <code>scores</code> から <code>\"math\"</code> の点数を取り出す書き方はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "scores[\"math\"]",
            "scores[0]",
            "scores(math)"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p>辞書の <b>キー一覧</b> を取り出すと、返ってくるのはどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "キーを並べたリスト",
            "値を並べたリスト",
            "辞書の個数"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：自分の辞書を作ろう",
      "body": "<p>自分の辞書を作って好きなキーに値を入れ、そのキーの値を取り出して表示してみましょう。<b>値を入れる</b> と <b>値を取り出す</b> をどちらも使えばクリアです。</p><p>組み合わせ例：</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-13-dict/</code></p>",
      "hint": "空の辞書を作り、キーと値を入れてから、同じキーで値を取り出して表示します。",
      "check": {
        "blocksRequired": [
          "py_dict_set",
          "py_dict_get"
        ]
      },
      "image": {
        "src": "lessons/img/0-13_person_name.png",
        "alt": "辞書にキーと値を入れて取り出す例"
      }
    }
  ]
};
