// このファイルは tools/build_lessons.py が lessons/0-00.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-00"] = {
  "id": "0-00",
  "group": "part0-basic",
  "title": "PycoBlocksをはじめよう",
  "subtitle": "Python × 入門 #00",
  "mode": "python",
  "article": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-00-intro/",
  "toolbox": [
    "print_text"
  ],
  "steps": [
    {
      "track": "block",
      "title": "ようこそ！",
      "body": "<p>この学習モードでは、<b>ブロックを並べるだけ</b>で本物のPythonコードを動かしながら学びます。</p><p>プログラムとは、コンピュータへの「指示書」です。料理のレシピのように、書かれた命令が<b>上から順番に</b>実行されます。</p><p>準備ができたら「次へ ▶」を押してください。</p>",
      "bodyEasy": "<p>この学習モードでは、<b>ブロックを並べる</b>だけでPythonを動かせます。</p><p>プログラムは、コンピュータへの「指示書」です。命令は<b>上から順に</b>実行されます。</p><p>じゅんびができたら「次へ ▶」を押してください。</p>",
      "hint": "このパネルは右上のボタンで折りたたみ、「✕」で学習をやめられます。"
    },
    {
      "track": "block",
      "title": "画面の見方①：ブロックパレット",
      "body": "<p>まずは画面のエリアを順番に見ていきましょう。</p><p>枠で示した場所が<b>ブロックパレット</b>です。使えるブロックの一覧で、カテゴリをクリックするとブロックが出てきます。</p><p>今は学習モード用に「テキストを表示」ブロックだけになっています。</p>",
      "bodyEasy": "<p>まず画面の場所を1つずつ見ていきます。</p><p>枠のところが<b>ブロックパレット</b>です。使えるブロックの一覧で、カテゴリを押すとブロックが出ます。</p><p>今は「テキストを表示」ブロックだけがあります。</p>",
      "callout": {
        "target": "toolbox",
        "text": "ここがブロックパレット。使えるブロックが並んでいます",
        "placement": "right"
      }
    },
    {
      "track": "block",
      "title": "画面の見方②：ワークスペース",
      "body": "<p>枠で示した場所が<b>ワークスペース</b>です。</p><p>パレットからブロックをドラッグして置き、組み立てる作業台です。マウスホイールで拡大・縮小もできます。</p>",
      "bodyEasy": "<p>枠のところが<b>ワークスペース</b>です。</p><p>パレットからブロックを引っぱってきて、組み立てる作業台です。マウスのホイールで大きさも変えられます。</p>",
      "callout": {
        "target": "workspace",
        "text": "ここがワークスペース。ブロックを置いて組み立てる作業台です"
      }
    },
    {
      "track": "block",
      "title": "画面の見方③：コードエリア",
      "body": "<p>枠で示した場所が<b>コードエリア</b>です（スマホでは「コード・実行」タブにあります）。</p><p>ワークスペースのブロックから自動生成されたPythonコードが表示されます。ブロックを動かすたびにリアルタイムで変わります。</p>",
      "bodyEasy": "<p>枠のところが<b>コードエリア</b>です（スマホは「コード・実行」タブ）。</p><p>ブロックから自動で作られたPythonコードが出ます。ブロックを動かすたびに中身が変わります。</p>",
      "callout": {
        "target": "code",
        "text": "ここに本物のPythonコードが自動で表示されます",
        "placement": "left"
      }
    },
    {
      "track": "block",
      "title": "画面の見方④：実行結果",
      "body": "<p>枠で示した場所が<b>実行結果</b>のエリアです（スマホでは「コード・実行」タブにあります）。</p><p>プログラムを実行したときの出力がここに表示されます。</p>",
      "bodyEasy": "<p>枠のところが<b>実行結果</b>のエリアです（スマホは「コード・実行」タブ）。</p><p>プログラムを動かしたときの答えが、ここに出ます。</p>",
      "callout": {
        "target": "output",
        "text": "実行した結果はここに出ます",
        "placement": "left"
      }
    },
    {
      "track": "block",
      "title": "画面の見方⑤：実行ボタン",
      "body": "<p>最後に、枠で示した<b>「▶ 実行」</b>ボタンです。</p><p>ワークスペースのプログラムは、このボタンを押すと動きます。</p><p>これで画面の説明はおしまいです。実際に動かしてみましょう。</p>",
      "bodyEasy": "<p>最後は、枠の<b>「▶ 実行」</b>ボタンです。</p><p>押すと、ワークスペースのプログラムが動きます。</p><p>画面の説明はおしまい。動かしてみましょう。</p>",
      "callout": {
        "target": "run",
        "text": "プログラムはこのボタンで実行します",
        "placement": "bottom"
      }
    },
    {
      "track": "block",
      "title": "手順1：ブロックを置く",
      "body": "<p>パレットにある <b>「Hello」を表示する</b> ブロックを、下の図のようにワークスペースへ<b>ドラッグ</b>して置いてください。</p><p>置けたら、下の「✓ クリア！」が点灯します。</p>",
      "bodyEasy": "<p>パレットの <b>「Hello」を表示する</b> ブロックを、下の図のようにワークスペースへ<b>引っぱって</b>置いてください。</p><p>置けたら、下の「✓ クリア！」が光ります。</p>",
      "hint": "パレットの上でマウスの左ボタンを押したまま、中央へ動かして離します。",
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "check": {
        "blocksRequired": [
          "print_text"
        ]
      },
      "image": {
        "src": "lessons/img/block_print_text.png",
        "alt": "「Hello」を表示するブロック"
      }
    },
    {
      "track": "block",
      "title": "手順2：文字を変えて実行する",
      "body": "<p>ブロックの白いボックスをクリックして、下の図のように文字を <code>Hello!</code> に書きかえましょう。</p><p>できたら <b>「▶ 実行」</b> ボタンを押します。実行結果に <code>Hello!</code> と表示されたら成功です。</p>",
      "bodyEasy": "<p>ブロックの白いボックスを押して、下の図のように文字を <code>Hello!</code> に書きかえます。</p><p>できたら <b>「▶ 実行」</b> を押します。実行結果に <code>Hello!</code> と出れば成功です。</p>",
      "hint": "白いボックスをクリック → もとの文字を消して <code>Hello!</code> と入力 → Enter。そのあと「▶ 実行」。",
      "callout": {
        "target": "run",
        "text": "書きかえたらこのボタンで実行",
        "placement": "bottom"
      },
      "run": true,
      "check": {
        "outputEquals": "Hello!"
      },
      "image": {
        "src": "lessons/img/0-00_hello_run.png",
        "alt": "文字をHello!に変えた表示ブロック"
      }
    },
    {
      "track": "block",
      "title": "ブロックとコードのつながり",
      "body": "<p>コードエリアには次のコードが出ているはずです。</p><pre>print(\"Hello!\")</pre><ul><li><code>print</code> は「表示しろ」という命令</li><li><code>( )</code> の中に書いたものを画面に出す</li><li><code>\"Hello!\"</code> のように <code>\"</code> で囲んだ文字を <b>文字列</b> と呼ぶ</li></ul><p>ブロック1つが、コード1行に対応しています。</p>",
      "bodyEasy": "<p>コードエリアに、このコードが出ています。</p><pre>print(\"Hello!\")</pre><ul><li><code>print</code> は「表示しろ」という命令</li><li><code>( )</code> の中のものを画面に出す</li><li><code>\"</code> で囲んだ文字を <b>文字列</b> と呼ぶ</li></ul><p>ブロック１つが、コード１行になります。</p>",
      "callout": {
        "target": {
          "block": "print_text"
        },
        "text": "このブロック1つがコード1行に対応しています"
      }
    },
    {
      "track": "code",
      "title": "コードを読もう",
      "autoCode": true,
      "body": "<p>コードエリア（スマホでは「コード・実行」タブ）には、次の1行が出ています。1行ずつ意味を確認しましょう。</p><pre class=\"code-lines\">print(\"Hello!\")</pre><ul><li><b>1行目</b>：<code>print</code> は「表示しろ」という命令です。<code>( )</code> の中に書いたものを画面に出します。<code>\"Hello!\"</code> のように <code>\"</code>（ダブルクォート）で囲んだ文字を <b>文字列</b> と呼びます。囲んだ <code>\"</code> 自体は表示されず、中身の <code>Hello!</code> だけが出ます。</li></ul>",
      "bodyEasy": "<p>コードエリア（スマホは「コード・実行」タブ）に、次の1行が出ています。</p><pre class=\"code-lines\">print(\"Hello!\")</pre><ul><li><b>1行目</b>：<code>print</code> は「表示しろ」という命令。<code>( )</code> の中を画面に出します。<code>\"</code>（ダブルクォート）で囲んだ文字を <b>文字列</b> と呼びます。<code>\"</code> は表示されず、中の <code>Hello!</code> だけ出ます。</li></ul>",
      "callout": {
        "target": "code",
        "text": "右上に同じ print(\"Hello!\") が出ています",
        "placement": "left"
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ",
      "body": "<p><code>print()</code> の役割はどれでしょう？</p>",
      "bodyEasy": "<p><code>print()</code> は何をする命令でしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "( ) の中身を画面に表示する",
            "数を計算する",
            "ファイルを保存する"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "課題：2行のメッセージ",
      "body": "<p>「テキストを表示」ブロックを <b>2つ縦につないで</b>、2行のメッセージを作りましょう。1行目に自分の名前、2行目に「よろしくお願いします！」です。ブロックが2つ置けたらクリアです。</p><p>組み合わせ例：</p>",
      "bodyEasy": "<p>「テキストを表示」ブロックを <b>2つ縦につないで</b>、2行のメッセージを作りましょう。1行目に自分の名前、2行目に「よろしくお願いします！」です。ブロックが2つ置けたらクリアです。</p><p>組み合わせ例：</p>",
      "hint": "パレットからもう1つブロックを取り出し、最初のブロックの下にくっつけます（上下がカチッとはまります）。",
      "check": {
        "blocksMin": {
          "print_text": 2
        }
      },
      "image": {
        "src": "lessons/img/0-00_two_prints.png",
        "alt": "表示ブロックを2つ縦につないだ例"
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード読解テスト",
      "body": "<p>次のコードを実行すると、何が表示されるでしょう。表示される文字を答えてください。</p><pre class=\"code-lines\">print(\"Python\")</pre>",
      "bodyEasy": "<p>次のコードを実行すると、何が表示されるでしょう。出る文字を答えてください。</p><pre class=\"code-lines\">print(\"Python\")</pre>",
      "hint": "<code>\"</code> で囲んだ中身がそのまま表示されます。",
      "check": {
        "answerText": {
          "accept": [
            "Python",
            "\"Python\""
          ],
          "caseInsensitive": true
        }
      }
    }
  ]
};
