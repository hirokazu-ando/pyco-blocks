// このファイルは tools/build_lessons.py が lessons/0-05.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-05"] = {
  "id": "0-05",
  "group": "part0-control",
  "title": "キーボードから入力しよう",
  "subtitle": "Python × 入門 #05",
  "mode": "python",
  "articleUrl": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-05-input-2/",
  "toolbox": [
    "py_input",
    "py_print",
    "py_math_op",
    "val_var",
    "val_number"
  ],
  "steps": [
    {
      "title": "入力とは何か",
      "body": "<p>これまでは、表示する内容をあらかじめプログラムに書いていました。<b>入力</b> を使うと、プログラムを動かす人がその場で <b>キーボードから値を打ち込める</b> ようになります。</p><ul><li><b>案内文</b>：何を入力すればよいかを画面に出す文</li><li><b>受け取った値</b>：変数に入れて、あとで表示や計算に使う</li></ul><p>準備ができたら「次へ ▶」を押してください。</p>",
      "hint": "この学習モードでは、実行すると入力用の小さな窓が開き、そこに文字を打ち込みます。"
    },
    {
      "title": "手順1：入力ブロックを置く",
      "body": "<p>「入力」カテゴリから <b>キーボード入力</b> ブロックを取り出し、下の図のように置きましょう。受け取った値を入れる変数の名前を <code>name</code> に、案内文を <code>名前を入力してください</code> にします。</p><p>1つ置けたらクリアです。</p>",
      "hint": "左の窓（テキスト／数値）で受け取り方を選び、変数名と案内文を書きかえます。",
      "check": {
        "blocksRequired": [
          "py_input"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-05_input_place.png",
        "alt": "キーボード入力ブロックを置いたところ"
      }
    },
    {
      "title": "手順2：入力した名前を表示する",
      "body": "<p>下の図のように、<b>キーボード入力</b> ブロックの下に <b>値を表示する</b> を置き、「値」カテゴリの <b>変数</b> ブロック（<code>name</code>）をはめましょう。</p><p>「▶ 実行」を押すと入力の窓が開きます。名前を打ち込むと、その名前がそのまま表示されます。</p><pre>name = input(\"名前を入力してください\")\nprint(name)</pre>",
      "hint": "入力ブロックの変数名と、表示ブロックの変数名を同じ name にそろえます。",
      "run": true,
      "check": {
        "blocksRequired": [
          "py_input",
          "py_print"
        ]
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-05_input_print.png",
        "alt": "入力した名前を表示する組み合わせ"
      }
    },
    {
      "title": "文字と数値のちがい",
      "body": "<p>入力ブロックには受け取り方が3つあります。</p><ul><li><b>テキスト</b>：打ち込んだ文字をそのまま受け取る（例：<code>\"12\"</code>）</li><li><b>数値（整数）</b>：数として受け取る（例：<code>12</code>）。計算に使える</li><li><b>数値（小数）</b>：小数として受け取る（例：<code>1.5</code>）</li></ul><p>テキストのままだと <code>\"5\" + \"3\"</code> は <code>53</code> になってしまいます。計算したいときは <b>数値（整数）</b> を選びます。</p>"
    },
    {
      "title": "手順3：2つの数を入力して足す",
      "body": "<p>下の図のように組み立てましょう。</p><ol><li><b>キーボード入力（数値（整数））</b> を2つ縦に並べ、変数を <code>a</code> と <code>b</code> にする</li><li>その下に <b>値を表示する</b> を置き、「計算」カテゴリの <b>算術演算</b> で <code>a + b</code> をはめる</li></ol><p>「▶ 実行」して、2つの整数（例：3と4）を打ち込むと、その合計が表示されます。</p><pre>a = int(input(\"...\"))\nb = int(input(\"...\"))\nprint(a + b)</pre>",
      "hint": "受け取り方を「数値（整数）」にするのがポイント。テキストのままだと足し算になりません。",
      "run": true,
      "check": {
        "blocksMin": {
          "py_input": 2,
          "py_print": 1
        }
      },
      "image": {
        "src": "lessons/img/0-05_int_sum.png",
        "alt": "2つの整数を入力して足し算を表示する組み合わせ"
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><b>キーボード入力</b> を <b>テキスト</b> で受け取ったとき、その値はどれになるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "文字列（数を打ち込んでも文字あつかい）",
            "いつも整数",
            "いつも小数"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><b>テキスト</b> で <code>5</code> と <code>3</code> を入力し、その2つを <code>+</code> でつないで表示しました。何が出るでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "53（文字がつながる）",
            "8（足し算される）",
            "エラーになる"
          ],
          "answer": 0
        }
      }
    },
    {
      "quiz": true,
      "title": "課題：入力を使ってみよう",
      "body": "<p><b>キーボード入力</b> ブロックで値を受け取り、その値を <b>値を表示する</b> で表示するプログラムを作りましょう。2つのブロックを置けばクリアです。</p><p>もっとくわしく → 解説記事 <code>https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-05-input-2/</code></p>",
      "hint": "受け取り方は自由です。名前でも年齢でも、好きなものを入力してみましょう。",
      "check": {
        "blocksRequired": [
          "py_input",
          "py_print"
        ]
      }
    }
  ]
};
