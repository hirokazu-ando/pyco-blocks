// このファイルは tools/build_lessons.py が lessons/0-16.json から自動生成したものです。
// 直接編集しないでください（正本は JSON）。再生成: python3 tools/build_lessons.py
window.PYCO_LESSONS = window.PYCO_LESSONS || {};
window.PYCO_LESSONS["0-16"] = {
  "id": "0-16",
  "group": "part0-advanced",
  "title": "クラスを使ってみよう",
  "subtitle": "Python × 入門 #16",
  "mode": "python",
  "article": "https://sakigake-robo.com/courses/pycoblocks/pycoblocks-part0-intro/pycoblocks-16-class/",
  "toolbox": [
    "py_class_def",
    "py_class_init",
    "py_class_method",
    "py_self_set",
    "py_self_get",
    "py_new_instance",
    "py_method_call_stmt",
    "py_str_concat",
    "val_str",
    "val_var",
    "val_number",
    "py_print",
    "print_text"
  ],
  "steps": [
    {
      "track": "block",
      "title": "まず用語を整理しよう",
      "body": "<p>今回のテーマ「クラス」は用語が多いので、まず「犬のキャラクター」にたとえて整理します。今は「なんとなくそういうものか」で大丈夫です。</p><ul><li><b>クラス</b>：データと処理をまとめた「設計図」（犬の設計図）</li><li><b>インスタンス</b>：設計図から作った「実体」（ポチ、バディなど本物の犬）</li><li><b>属性</b>：インスタンスが持つデータ。<code>self.名前</code> と書く（その犬の名前や年齢）</li><li><b>メソッド</b>：クラスの中に定義する「関数」（あいさつする、走る）</li><li><b>self</b>：「自分自身のインスタンス」を指す特別な変数（「ぼく」にあたる）</li></ul><p>準備ができたら「次へ ▶」を押してください。</p>",
      "bodyEasy": "<p>「クラス」は用語が多いので、「犬のキャラクター」にたとえます。今は「なんとなく」で大丈夫です。</p><ul><li><b>クラス</b>：データと処理をまとめた「設計図」（犬の設計図）</li><li><b>インスタンス</b>：設計図から作った「実物」（ポチなど本物の犬）</li><li><b>属性</b>：インスタンスが持つデータ。<code>self.名前</code> と書く</li><li><b>メソッド</b>：クラスの中に作る「関数」（あいさつする）</li><li><b>self</b>：自分自身のインスタンスを指す（「ぼく」）</li></ul><p>「次へ ▶」を押してください。</p>",
      "hint": "設計図（クラス）は1枚でも、そこから何匹でも犬（インスタンス）を作れます。"
    },
    {
      "track": "block",
      "title": "Dogクラスのブロックを読んでみよう",
      "body": "<p>下の図が、名前を持ちあいさつができる犬の設計図（Dogクラス）です。大きく分けて次の3つでできています。</p><ol><li><b>クラス Dog を定義する</b>：設計図全体の入れ物</li><li><b>初期化（self, 引数: name）</b>：犬を作るときに自動で呼ばれ、渡した名前を <code>self.name</code> という属性として保存する</li><li><b>メソッド greet</b>：<code>self.name</code> を使ってあいさつを表示する「できること」</li></ol><p><code>self.name</code> の <code>self</code> は「この犬自身」を指します。ポチなら「ポチ」、バディなら「バディ」と、インスタンスごとに別々の値を持ちます。</p>",
      "bodyEasy": "<p>下の図が、名前を持ちあいさつできる犬の設計図（Dogクラス）です。3つでできています。</p><ol><li><b>クラス Dog を定義する</b>：設計図全体の入れ物</li><li><b>初期化（self, 引数: name）</b>：犬を作るとき自動で呼ばれ、名前を <code>self.name</code>（属性）に保存する</li><li><b>メソッド greet</b>：<code>self.name</code> であいさつする「できること」</li></ol><p><code>self</code> は「この犬自身」。ポチなら「ポチ」と、実物ごとにちがう値を持ちます。</p>",
      "hint": "「初期化」は __init__ という特別なメソッドで、インスタンスを作る瞬間に自動で呼ばれます。",
      "image": {
        "src": "lessons/img/0-16_dog_class.png",
        "alt": "名前を保存しあいさつするDogクラスの設計図ブロック"
      }
    },
    {
      "track": "block",
      "title": "手順1：クラスの設計図を組む",
      "body": "<p>「クラス」カテゴリのブロックを使って、下の図のように <b>Dog クラスの設計図</b> を組みましょう。</p><ol><li><b>クラス Dog を定義する</b> の中に、<b>初期化（self, 引数: name）</b> を入れ、<b>self.name に name を入れる</b></li><li>続けて <b>メソッド greet（引数なし）</b> を入れ、中であいさつを表示する</li></ol><p>クラス・初期化・メソッドの3つのブロックが置けたらクリアです。</p>",
      "bodyEasy": "<p>「クラス」カテゴリのブロックで、下の図のように <b>Dog クラスの設計図</b> を組みましょう。</p><ol><li><b>クラス Dog を定義する</b> の中に <b>初期化（self, 引数: name）</b> を入れ、<b>self.name に name を入れる</b></li><li>続けて <b>メソッド greet（引数なし）</b> を入れ、中であいさつを表示する</li></ol><p>クラス・初期化・メソッドの3つのブロックが置けたらクリアです。</p>",
      "hint": "あいさつは「計算」カテゴリの文字列連結でつなげます。self. の中身は「クラス」カテゴリの self.〜 ブロックです。",
      "check": {
        "blocksRequired": [
          "py_class_def",
          "py_class_init",
          "py_class_method"
        ]
      },
      "callout": {
        "target": "toolbox",
        "text": "ここからブロックを取り出します",
        "placement": "right"
      },
      "image": {
        "src": "lessons/img/0-16_dog_class.png",
        "alt": "Dogクラスの設計図（初期化とgreetメソッド）を組んだブロック"
      }
    },
    {
      "track": "block",
      "title": "手順2：インスタンスを作ってあいさつさせる",
      "body": "<p>設計図から実体（インスタンス）を作り、メソッドを呼び出しましょう。下の図のように、設計図の下に2つのブロックを足します。</p><ol><li><b>変数 dog を クラス Dog（引数: \"ポチ\"）で作る</b>：ポチという犬を作る</li><li><b>dog . greet を呼ぶ</b>：ポチにあいさつさせる</li></ol><p>「▶ 実行」を押して、次のように出れば成功です。</p><pre>こんにちは！ぼくの名前はね、ポチ！</pre>",
      "bodyEasy": "<p>設計図から実物（インスタンス）を作り、メソッドを呼びましょう。下の図のように、設計図の下に2つのブロックを足します。</p><ol><li><b>変数 dog を クラス Dog（引数: \"ポチ\"）で作る</b>：ポチという犬を作る</li><li><b>dog . greet を呼ぶ</b>：ポチにあいさつさせる</li></ol><p>「▶ 実行」を押して、次のように出れば成功です。</p><pre>こんにちは！ぼくの名前はね、ポチ！</pre>",
      "hint": "作るブロックの引数に \"ポチ\" を入れ、呼ぶブロックのインスタンスを dog にそろえます。",
      "run": true,
      "check": {
        "outputEquals": "こんにちは！ぼくの名前はね、ポチ！"
      },
      "callout": {
        "target": "run",
        "text": "組めたらこのボタンで実行",
        "placement": "bottom"
      },
      "image": {
        "src": "lessons/img/0-16_dog_full.png",
        "alt": "Dogクラスからポチを作ってgreetを呼ぶ組み合わせ全体"
      }
    },
    {
      "track": "block",
      "title": "インスタンスはそれぞれ独立している",
      "body": "<p>同じクラスから複数のインスタンスを作ると、それぞれが <b>独立した属性</b> を持ちます。設計図は1枚でも、作った犬はお互いに干渉しません。</p><p>また、属性はメソッドをまたいで <b>保存され続けます</b>。たとえばカウンターのクラスを作ると、増やした値が次の呼び出しにも引き継がれます。ポチが何かをしてもバディには関係ない——インスタンスはそれと同じです。</p>",
      "bodyEasy": "<p>同じクラスから複数のインスタンスを作ると、それぞれが <b>別々の属性</b> を持ちます。設計図は1枚でも、犬どうしはえいきょうし合いません。</p><p>属性はメソッドをまたいでも <b>保存され続けます</b>。カウンターのクラスなら、増やした値が次の呼び出しにも引きつがれます。</p>"
    },
    {
      "track": "code",
      "title": "コードを読もう：class・self・メソッド",
      "body": "<p>手順で組んだ Dog クラスは、次のPythonコードになります。用語を思い出しながら読んでみましょう。</p><pre class=\"code-lines\">class Dog:\n    def __init__(self, name):\n        self.name = name\n    def greet(self):\n        print(\"こんにちは！ぼくの名前はね、\" + self.name + \"！\")\ndog = Dog(\"ポチ\")\ndog.greet()</pre><ul><li>1行目：<code>class Dog:</code> は設計図の宣言です。</li><li>2〜3行目：<code>__init__</code> は<b>初期化</b>メソッド。犬を作る瞬間に呼ばれ、渡した名前を <code>self.name</code> という<b>属性</b>に保存します。<code>self</code> は「その犬自身」です。</li><li>4〜5行目：<code>greet</code> は<b>メソッド</b>（クラスの中の関数）。<code>self.name</code> を使ってあいさつを表示します。</li><li>6行目：<code>Dog(\"ポチ\")</code> で<b>インスタンス</b>（実体）を作り、変数 <code>dog</code> に入れます。</li><li>7行目：<code>dog.greet()</code> でそのメソッドを呼び出します。</li></ul>",
      "bodyEasy": "<p>手順で組んだ Dog クラスは、次のコードになります。用語を思い出しながら読みましょう。</p><pre class=\"code-lines\">class Dog:\n    def __init__(self, name):\n        self.name = name\n    def greet(self):\n        print(\"こんにちは！ぼくの名前はね、\" + self.name + \"！\")\ndog = Dog(\"ポチ\")\ndog.greet()</pre><ul><li>1行目：<code>class Dog:</code> は設計図の宣言。</li><li>2〜3行目：<code>__init__</code> は<b>初期化</b>。犬を作る瞬間に呼ばれ、名前を <code>self.name</code>（属性）に保存します。<code>self</code> は「その犬自身」。</li><li>4〜5行目：<code>greet</code> は<b>メソッド</b>（クラスの中の関数）。<code>self.name</code> であいさつします。</li><li>6行目：<code>Dog(\"ポチ\")</code> で<b>インスタンス</b>（実物）を作り、<code>dog</code> に入れます。</li><li>7行目：<code>dog.greet()</code> でメソッドを呼びます。</li></ul>",
      "hint": "class=設計図、self=自分自身、メソッド=クラスの中の関数、と対応づけて読みましょう。",
      "callout": {
        "target": "code",
        "text": "生成されたコードはここで確認できます"
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード読解テスト",
      "body": "<p>次のコードを実行すると、最後に何が表示されるでしょう？表示される値を答えてください。</p><pre class=\"code-lines\">class Counter:\n    def __init__(self):\n        self.n = 0\n    def add(self):\n        self.n = self.n + 1\nc = Counter()\nc.add()\nc.add()\nprint(c.n)</pre>",
      "bodyEasy": "<p>次のコードを実行すると、最後に何が表示されるでしょう？表示される値を答えてください。</p><pre class=\"code-lines\">class Counter:\n    def __init__(self):\n        self.n = 0\n    def add(self):\n        self.n = self.n + 1\nc = Counter()\nc.add()\nc.add()\nprint(c.n)</pre>",
      "hint": "add を呼ぶたびに self.n が1ずつ増えます。add は2回呼ばれています。",
      "check": {
        "answerText": {
          "accept": [
            "2",
            "\"2\""
          ],
          "caseInsensitive": true
        }
      }
    },
    {
      "track": "code",
      "quiz": true,
      "title": "コード記述テスト",
      "body": "<p>名前を受け取って保存し、その名前を表示する<b>メソッド</b>を持つ<b>クラス</b>を作りましょう。<code>\"Tama\"</code> という名前のインスタンスを作ってメソッドを呼び、<code>Tama</code> と表示されれば成功です。</p><pre class=\"code-lines\">Tama</pre>",
      "bodyEasy": "<p>名前を受け取って保存し、その名前を表示する<b>メソッド</b>を持つ<b>クラス</b>を作りましょう。<code>\"Tama\"</code> という名前のインスタンスを作ってメソッドを呼び、<code>Tama</code> と表示されれば成功です。</p><pre class=\"code-lines\">Tama</pre>",
      "hint": "class Cat: の中で __init__ に self.name = name を書き、call メソッドで print(self.name) します。最後に c = Cat(\"Tama\") と c.call() を書きます。",
      "check": {
        "codeRun": {
          "outputEquals": "Tama",
          "codeContains": [
            {
              "pattern": "class\\s",
              "message": "実行結果は合っていますが、class を使ってクラスを作ってみましょう"
            },
            {
              "pattern": "self",
              "message": "実行結果は合っていますが、self を使って名前を属性に保存してみましょう"
            }
          ],
          "codeForbids": [
            {
              "pattern": "print\\(\\s*[\"']Tama",
              "message": "実行結果は合っていますが、文字を直接printせず、クラスとメソッドを使って表示しましょう"
            }
          ]
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ①",
      "body": "<p><b>self</b> が指しているのはどれでしょう？</p>",
      "bodyEasy": "<p><b>self</b> が指しているのはどれでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "そのメソッドを呼び出したインスタンス自身",
            "クラスの設計図そのもの",
            "画面に表示する文字"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ②",
      "body": "<p><b>初期化（__init__）</b> はいつ呼ばれるでしょう？</p>",
      "bodyEasy": "<p><b>初期化（__init__）</b> はいつ呼ばれるでしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "インスタンスを作る瞬間に自動で呼ばれる",
            "プログラムの最後に呼ばれる",
            "一度も呼ばれない"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "確認クイズ③",
      "body": "<p><b>メソッド</b> とは何でしょう？</p>",
      "bodyEasy": "<p><b>メソッド</b> とは何でしょう？</p>",
      "check": {
        "choice": {
          "options": [
            "クラスの中に定義する関数",
            "インスタンスが持つデータ",
            "画面に表示する命令"
          ],
          "answer": 0
        }
      }
    },
    {
      "track": "block",
      "quiz": true,
      "title": "課題：別の名前で犬を作ろう",
      "body": "<p>設計図（クラス Dog）はそのままで、<code>\"バディ\"</code> という名前のインスタンスを作り、あいさつを呼び出してみましょう。<b>インスタンスを作る</b> と <b>メソッドを呼ぶ</b> をどちらも使えばクリアです。</p><p>組み合わせ例：</p>",
      "bodyEasy": "<p>設計図（クラス Dog）はそのままで、<code>\"バディ\"</code> という名前のインスタンスを作り、あいさつを呼び出してみましょう。<b>インスタンスを作る</b> と <b>メソッドを呼ぶ</b> をどちらも使えばクリアです。</p><p>組み合わせ例：</p>",
      "hint": "作るブロックの引数を \"バディ\" にし、呼ぶブロックのインスタンスを buddy にそろえます。設計図は変えなくて大丈夫です。",
      "check": {
        "blocksRequired": [
          "py_new_instance",
          "py_method_call_stmt"
        ]
      },
      "image": {
        "src": "lessons/img/0-16_buddy.png",
        "alt": "Dogクラスからバディを作ってあいさつさせる例"
      }
    }
  ]
};
