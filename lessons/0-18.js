// このファイルは tools/build_lessons.py が lessons/0-18.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-18"] = {
  "id": "0-18",
  "group": "part0-advanced",
  "title": "文字列を自在に操ろう",
  "subtitle": "Python × 入門 #18",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-18-string-methods/",
  "toolbox": [
    "py_str_split",
    "py_str_join",
    "py_str_strip",
    "py_str_replace",
    "py_str_find",
    "py_str_upper",
    "val_str",
    "val_var",
    "var_set",
    "py_print",
    "print_text"
  ],
  "steps": [
    {
      "title": "文字列を加工するメソッド",
      "body": "<p>文字列には、テキストを思い通りに加工する道具（メソッド）がそろっています。今回はよく使う5つを学びます。</p><ul><li><b>分割</b>（split）：区切り文字でリストに分ける</li><li><b>結合</b>（join）：リストを1つの文字列につなぐ</li><li><b>前後の空白を取り除く</b>（strip）</li><li><b>置換</b>（replace）：文字を別の文字に置きかえる</li><li><b>検索</b>（find）：文字の位置を調べる（無ければ -1）</li></ul>",
      "hint": "「文字列メソッド」カテゴリにこれらのブロックがそろっています。"
    },
    {
      "title": "手順1：分割ブロックを置く",
      "body": "<p>「文字列メソッド」カテゴリから <b>文字列〜を〜で分割</b> のブロックを取り出し、下の図のように置きましょう。区切り文字で文字列をリストに分けるブロックです。</p><p>1つ置けたらクリアです。</p>",
      "hint": "変数の部分に分けたい文字列の入った変数を、区切りの欄に区切り文字（例：カンマ）を入れます。",
      "check": {
        "blocksRequired": [
          "py_str_split"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-18_split_block.png",
        "alt": "文字列を区切り文字で分割するブロック"
      }
    },
    {
      "title": "手順2：カンマで分割する",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 text</b> に文字列 <code>apple,banana,cherry</code> を入れる</li><li><b>変数 words</b> に <b>text をカンマで分割</b> した結果を入れる</li><li><b>値を表示する</b> で <code>words</code> を表示する</li></ol><p>「▶ 実行」を押して、3つの要素のリストが出れば成功です。</p><pre>['apple', 'banana', 'cherry']</pre>",
      "hint": "分割の区切りの欄にはカンマ「,」を入れます。結果はリストになります。",
      "run": true,
      "check": {
        "outputEquals": "['apple', 'banana', 'cherry']"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-18_split.png",
        "alt": "文字列をカンマで分割してリストを表示する組み合わせ"
      }
    },
    {
      "title": "置換・結合・空白の除去",
      "body": "<p>ほかにも便利なメソッドがあります。</p><ul><li><b>置換</b>（replace）：<code>\"hello\"</code> の <code>l</code> を <code>r</code> に置きかえると <code>herro</code></li><li><b>結合</b>（join）：<code>-</code> でリスト <code>[\"a\",\"b\",\"c\"]</code> をつなぐと <code>a-b-c</code>（分割の逆）</li><li><b>前後の空白を取り除く</b>（strip）：<code>\" hi \"</code> → <code>hi</code>。入力の前処理によく使います</li></ul><p>次で置換を試してみましょう。</p>"
    },
    {
      "title": "手順3：文字を置きかえる",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>変数 s</b> に文字列 <code>hello</code> を入れる</li><li><b>値を表示する</b> に <b>s の l を r に置換</b> をはめる</li></ol><p>「▶ 実行」を押して <code>herro</code> と出れば成功です。</p><pre>s = \"hello\"\nprint(s.replace(\"l\", \"r\"))</pre>",
      "hint": "置換ブロックの「old」に l、「new」に r を入れます。2つの l が両方 r になります。",
      "run": true,
      "check": {
        "outputEquals": "herro"
      },
      "image": {
        "src": "lessons/img/0-18_replace.png",
        "alt": "文字列helloのlをrに置換してherroと表示する組み合わせ"
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p>検索（find）で、探す文字が <b>見つからなかった</b> ときに返る値はどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "-1",
            "0",
            "エラーになる"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><code>\" hi \"</code>（前後に空白）を <b>前後の空白を取り除く</b>（strip）と、何になるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "hi",
            " hi ",
            "hi と 空白の一覧"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ③",
      "body": "<p><code>-</code> でリスト <code>[\"a\", \"b\", \"c\"]</code> を <b>結合</b>（join）すると、何になるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "a-b-c",
            "['a', 'b', 'c']",
            "abc"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：CSVを分解しよう",
      "body": "<p><code>田中,25,東京</code> のような文字列を <b>分割</b> して、名前・年齢・都市に分けるプログラムを作ってみましょう。<b>分割</b> ブロックを使えばクリアです。</p><p>組み合わせ例：</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-18-string-methods/</code></p>",
      "hint": "分割した結果はリストになるので、番号（0・1・2）で1つずつ取り出せます。",
      "check": {
        "blocksRequired": [
          "py_str_split"
        ]
      },
      "image": {
        "src": "lessons/img/0-18_split.png",
        "alt": "文字列を分割してリストにする組み合わせの例"
      }
    }
  ]
};
