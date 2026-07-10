// このファイルは tools/build_lessons.py が lessons/0-04.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-04"] = {
  "id": "0-04",
  "group": "part0-basic",
  "title": "文字列を組み立てよう",
  "subtitle": "Python × 入門 #04",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-04-strings/",
  "toolbox": [
    "val_str",
    "py_str_concat",
    "py_fstring",
    "val_number",
    "val_var",
    "var_set",
    "py_print"
  ],
  "steps": [
    {
      "title": "文字列とは何か",
      "body": "<p>Pythonでは、<code>\"</code> か <code>'</code> で囲んだテキストを <b>文字列</b> と呼びます。数値の <code>80</code> と文字列の <code>\"80\"</code> は、見た目は似ていても別ものです。</p><ul><li><b>結合</b>：<code>+</code> で文字列をつなげる（例：<code>\"A\" + \"B\"</code> → <code>AB</code>）</li><li><b>f文字列</b>：<code>f\"...{変数}...\"</code> で変数を文字列に埋め込む</li></ul>",
      "hint": "「値」カテゴリの文字列ブロックが \"...\" にあたります。"
    },
    {
      "title": "手順1：文字列を表示する",
      "body": "<p><b>値を表示する</b> ブロックに、「値」カテゴリの <b>文字列</b> ブロックをはめ込み、文字を <code>Hello, Python!</code> にします。下の図のように組みましょう。</p><p>「▶ 実行」を押して同じ文字が出れば成功です。</p><pre>print(\"Hello, Python!\")</pre>",
      "hint": "文字列ブロックの白いボックスに Hello, Python! と入力して実行します。",
      "run": true,
      "check": {
        "outputEquals": "Hello, Python!"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-04_hello_python.png",
        "alt": "文字列Hello, Python!を表示する組み合わせ"
      }
    },
    {
      "title": "文字列をつなげる",
      "body": "<p>文字列どうしは <code>+</code> でつなげられます。「計算」カテゴリの <b>文字列連結</b> ブロック（<code>py_str_concat</code>）を使うと、2つの文字列をくっつけられます。</p><pre>\"こんにちは\" + \"世界\"  →  こんにちは世界</pre><p>このブロックは数値も自動で文字に変えてつなげてくれます。</p>"
    },
    {
      "title": "手順2：2つの文字をつなげる",
      "body": "<p><b>値を表示する</b> に <b>文字列連結</b> ブロックをはめ、左に <code>こんにちは</code>、右に <code>世界</code> の文字列ブロックを入れます。下の図のように組みましょう。</p><p>「▶ 実行」を押して <code>こんにちは世界</code> と出れば成功です。</p>",
      "hint": "文字列ブロックを2つ用意し、連結ブロックの左右にはめます。",
      "run": true,
      "check": {
        "outputEquals": "こんにちは世界"
      },
      "image": {
        "src": "lessons/img/0-04_concat.png",
        "alt": "こんにちはと世界をつなげて表示する組み合わせ"
      }
    },
    {
      "title": "f文字列で埋め込む",
      "body": "<p>変数や数値を文字にまぜたいときは <b>f文字列</b> が便利です。「値」カテゴリの <b>f文字列</b> ブロック（<code>py_fstring</code>）は、前の文・<code>{ }</code>に入れる値・後ろの文、の3つを組み合わせます。</p><pre>f\"得点は{85}点\"  →  得点は85点</pre><p><code>{ }</code> の中には数値・変数・計算式を入れられます。</p>"
    },
    {
      "title": "手順3：f文字列を表示する",
      "body": "<p><b>値を表示する</b> に <b>f文字列</b> ブロックをはめ、前の文を <code>得点は</code>、{ } に <b>数値</b> の <code>85</code>、後ろの文を <code>点</code> にします。下の図のように組みましょう。</p><p>「▶ 実行」を押して <code>得点は85点</code> と出れば成功です。</p>",
      "hint": "f文字列ブロックの前後のボックスに文字を入れ、真ん中のあなに数値ブロック（85）をはめます。",
      "run": true,
      "check": {
        "outputEquals": "得点は85点"
      },
      "image": {
        "src": "lessons/img/0-04_fstring.png",
        "alt": "f文字列で得点は85点と表示する組み合わせ"
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><code>\"A\" + \"B\"</code> を表示すると何が出るでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "AB",
            "A B",
            "エラーになる"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>name</code> に <code>\"山田\"</code> が入っているとき、<code>f\"{name}さん\"</code> は何になるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "山田さん",
            "{name}さん",
            "nameさん"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：f文字列で自己紹介",
      "body": "<p><b>f文字列</b> ブロックを使って、名前や年齢を埋め込んだ自己紹介文を表示してみましょう。f文字列ブロックを1つ使えばクリアです。</p><p>組み合わせ例：</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-04-strings/</code></p>",
      "hint": "「値を表示する」にf文字列ブロックをはめ、変数や数値を{ }に入れます。",
      "check": {
        "blocksRequired": [
          "py_fstring"
        ]
      },
      "image": {
        "src": "lessons/img/0-04_fstring_example.png",
        "alt": "変数nameをf文字列に埋め込んで表示する例"
      }
    }
  ]
};
