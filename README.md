# PycoBlocks

ブロックを並べるだけで Python / MicroPython コードを生成できるプログラミング環境です。

**デモ → https://hirokazu-ando.github.io/pyco-blocks/**

![](https://img.shields.io/badge/Blockly-12.5.1-E53935?style=flat-square)
![](https://img.shields.io/badge/Skulpt-1.2.0-f7c948?style=flat-square)
![](https://img.shields.io/badge/MicroPython-v1.23-2196F3?style=flat-square)
![](https://img.shields.io/badge/pygame-互換-4CAF50?style=flat-square)

---

## 3つのモード

### Python入門モード

ブラウザ内で Skulpt を使って実行するため、**実機不要**。授業の導入や自習に使えます。

- while / for ループ、break / continue
- リスト・辞書
- 関数（引数・戻り値）・自作モジュール（タブ切替）
- キーボード入力（`input()`）
- 型変換・絶対値・round・乱数
- f文字列（`f"…{変数}…"` 形式）

### ゲームモード

Skulpt上で動作する **pygameエミュレーター** を搭載。ブラウザ内でゲームを作れます。

- pygame互換コード生成（ローカル Python でもそのまま動く）
- Canvas描画・キー入力・当たり判定
- 画像読み込み・矩形描画・スコア表示

### MicroPythonモード（Raspberry Pi Pico / PoliviaBot）

Web Serial API でブラウザから Pico に直接接続できます。コードの実行と `main.py` への書き込みに対応しています。

---

## ブロック一覧

### Python入門モード

| カテゴリ | ブロック |
|---------|---------|
| **繰り返し** | 〇回繰り返す・カウンター繰り返す・while・for-each・break / continue |
| **分岐** | if / elif / else・比較・AND / OR / NOT |
| **変数** | セット・増減 |
| **値** | 変数・数値・文字列・True / False・f文字列 |
| **計算** | 算術演算・文字列連結・型変換・絶対値・round・乱数 |
| **リスト** | 作成・追加・取得・長さ・検索・削除 |
| **辞書** | 作成・セット・取得・キー一覧 |
| **関数** | 定義（引数0〜3）・戻り値あり・呼び出し |
| **モジュール** | モジュール呼び出し（文・値）・自作モジュールタブ切替 |
| **クラス** | クラス定義・初期化（引数1〜2）・メソッド（引数0〜1）・属性セット・属性ゲット・インスタンス生成・メソッド呼び出し |
| **入力** | キーボード入力（テキスト・整数・小数） |
| **表示** | 値を表示・テキスト・ラベル＋変数・区切り線 |

### ゲームモード

| カテゴリ | ブロック |
|---------|---------|
| **ゲーム** | 初期化・ゲームループ・イベント処理・画面塗りつぶし・図形描画・画像描画・flip・終了 |
| **変数** | セット・増減 |
| **分岐** | if / elif / else・比較・AND / OR / NOT |
| **計算** | 算術演算・型変換・絶対値・乱数 |
| **値** | 変数・数値・文字列・True / False |

### MicroPythonモード

| カテゴリ | ブロック |
|---------|---------|
| **PoliviaBot** | 前進・後退・旋回・停止・LED・スイッチ・超音波センサー・ラインセンサー |
| **繰り返し** | ずっと繰り返す・〇回繰り返す・カウンター繰り返し |
| **分岐** | if / elif / else・比較・AND / OR / NOT |
| **時間** | 秒数待機 |
| **出力** | デジタル出力（HIGH / LOW） |
| **入力** | デジタル入力・アナログ入力（ADC） |
| **変数** | セット・増減 |
| **値** | 変数・数値 |
| **表示** | print・ラベル付き・区切り線 |

---

## 使い方

### Python入門モード（実機不要）

1. [デモURL](https://hirokazu-ando.github.io/pyco-blocks/) を開く（または `?mode=python` パラメータ）
2. 「Python」ボタンを選ぶ（初期状態で選択済み）
3. 左のカテゴリからブロックをドラッグして並べる
4. `▶ 実行` で動作確認する

### ゲームモード（実機不要）

1. デモURL を開き「ゲーム」ボタンを選ぶ（または `?mode=game` パラメータ）
2. ゲームブロックを並べる
3. `▶ 実行` でブラウザ内のCanvasにゲームが動く
4. 生成されたコードはローカルの Python + pygame でもそのまま動作する

### MicroPythonモード（Pico接続）

Chrome または Edge（デスクトップ版）が必要です。

1. デモURL を Chrome / Edge で開く（または `?mode=micropython` パラメータ）
2. 「μPython」ボタンを選ぶ
3. Raspberry Pi Pico を USB 接続する
4. 「接続」ボタン → ポートを選択
5. ブロックを並べて `▶ 実行`、または「書き込み」で `main.py` に保存

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| ブロックエンジン | [Blockly](https://developers.google.com/blockly) 12.5.1（Zelos レンダラー） |
| コードエディタ | [CodeMirror](https://codemirror.net/) 5.65.16 |
| Python 実行 | [Skulpt](https://skulpt.org/) 1.2.0 |
| pygameエミュレーター | 独自実装（Canvas描画・キー入力・ゲームループ） |
| シリアル通信 | Web Serial API |
| 対象ハードウェア | Raspberry Pi Pico / Pico W |

---

## 対応ブラウザ

| ブラウザ | Python実行 / ゲーム | Pico接続 |
|---------|-----------|---------|
| Chrome / Edge（デスクトップ） | ✅ | ✅ |
| Safari（iPad / Mac） | ✅ | ❌ |
| Firefox | ✅ | ❌ |

Pico接続には Web Serial API が必要なため、Chrome / Edge のデスクトップ版のみ対応しています。

---

## スマホ・タブレット対応

画面幅の狭い端末では自動的に編集レイアウトに切り替わり、スマホ・タブレットからもブロックを組めます。

- 画面下部のタブバーで「ブロック / コード / 出力」のパネルを切り替える
- よく使う `▶ 実行` はメニュー外のフローティングボタンとして常に表示
- 実行エラーは画面下部に全幅バナーで表示（日本語の解説つき）
- MicroPythonモードで実態配線図を「非表示」にすると、ブロック画面が全面に広がる

タブレット（iPad など）では Safari でも編集できます。Pico への接続のみ Chrome / Edge のデスクトップ版が必要です。

---

## ライセンス

MIT License
