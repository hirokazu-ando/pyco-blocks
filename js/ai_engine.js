// =====================================================
// PycoBlocks やさしいAI - pyco_ai Skulpt module（Phase 2 本体）
// 小中向け「自分で教えるAI」（Teachable 式）。
// Phase 2: TensorFlow.js MobileNet（特徴抽出）＋ KNN 分類器で本物の学習・分類。
//   teach() = 例を1つ追加（特徴抽出は同期・KNNは遅延学習＝即時）
//   learn() = 学習確定（KNNは即時なので確認のみ）
//   what()  = いま見えているものを分類（非同期 → suspension でPythonを待たせる）
// 非同期ブリッジは既存 game_engine.js と同じ Sk.misceval.promiseToSuspension を流用。
// ライブラリは AI を使ったときだけ遅延ロード（非AI利用者には無負荷）。
// =====================================================

(() => {
  'use strict';

  // ---- 遅延ロードする CDN（TF.js + MobileNet + KNN）----
  const LIBS = [
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.5/dist/knn-classifier.min.js',
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (Array.prototype.some.call(document.scripts, (s) => s.src === src)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('読み込み失敗: ' + src));
      document.head.appendChild(s);
    });
  }

  function getDisplayArea() {
    let area = document.getElementById('ai-display-area');
    if (!area) {
      area = document.createElement('div');
      area.id = 'ai-display-area';
      const cv = document.getElementById('cv-display-area');
      const host = (cv && cv.parentNode) ? cv.parentNode : document.body;
      host.appendChild(area);
    }
    area.style.display = 'block';
    return area;
  }

  function setStatus(html) {
    const area = getDisplayArea();
    let s = document.getElementById('ai-status');
    if (!s) {
      s = document.createElement('div');
      s.id = 'ai-status';
      s.style.cssText = 'font:13px sans-serif;color:#444;margin-top:6px;line-height:1.5';
      area.appendChild(s);
    }
    s.innerHTML = html;
  }

  // ================= 実処理（JS 側・window スコープ）=================
  const Core = {
    state: { source: null, labels: {}, learned: false, lastLabel: null, lastConf: 0, ready: false },
    _readyP: null, _mobilenet: null, _knn: null,

    labelsText() {
      const ks = Object.keys(this.state.labels);
      return ks.length ? ks.map((k) => `「${k}」×${this.state.labels[k]}`).join('　') : '（まだ無し）';
    },

    // ライブラリ＋モデルの準備（1回だけ・メモ化）
    ensureReady() {
      if (this._readyP) return this._readyP;
      setStatus('🧠 AIの準備中…（初回はモデルの読み込みに少し時間がかかります）');
      this._readyP = (async () => {
        for (const u of LIBS) { await loadScript(u); }
        if (!window.mobilenet || !window.knnClassifier || !window.tf) {
          throw new Error('AIライブラリの初期化に失敗しました');
        }
        this._mobilenet = await window.mobilenet.load({ version: 2, alpha: 0.5 });
        this._knn = window.knnClassifier.create();
        this.state.ready = true;
        setStatus('✅ 準備できたよ！「カメラを使う」や「画像を使う」のあと、見せて「おしえる」してね');
        return true;
      })().catch((e) => {
        setStatus('⚠️ AIの準備に失敗しました（ネット接続を確認してください）');
        this._readyP = null;           // 次回再試行できるように
        throw e;
      });
      return this._readyP;
    },

    getInput() { return window.__pycoAiVideo || window.__pycoAiImage || null; },

    _infer() {
      const el = this.getInput();
      if (!el) throw new Error('入力（カメラ／画像）がありません');
      return this._mobilenet.infer(el, true);   // 特徴ベクトル（logits=true）
    },

    // カメラを使う：webカメラ映像を表示
    startCamera() {
      this.state.source = 'camera';
      const area = getDisplayArea();
      // 古い画像入力は破棄
      window.__pycoAiImage = null;
      return new Promise((resolve) => {
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
          setStatus('⚠️ この環境ではカメラを使えません。「画像を使う」を選んでください。');
          return resolve();
        }
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
          let v = document.getElementById('ai-video');
          if (!v) {
            v = document.createElement('video');
            v.id = 'ai-video'; v.autoplay = true; v.playsInline = true; v.muted = true;
            v.width = 240; v.height = 180;
            v.style.cssText = 'border-radius:8px;background:#000';
            area.insertBefore(v, document.getElementById('ai-status'));
          }
          v.srcObject = stream; window.__pycoAiVideo = v;
          const done = () => { setStatus('📷 カメラ準備OK。覚えさせたいものを写して「おしえる」してね'); resolve(); };
          if (v.readyState >= 2) done(); else v.onloadeddata = done;
        }).catch(() => {
          setStatus('⚠️ カメラを使えません（許可が必要です）。「画像を使う」を選んでください。');
          resolve();
        });
      });
    },

    // 画像を使う：名前から決まる見本画像を表示（同じ名前＝同じ画像）。Phase 3 でアップロード対応予定
    useImage(name) {
      this.state.source = 'image';
      window.__pycoAiVideo = null;
      const area = getDisplayArea();
      return new Promise((resolve) => {
        // 名前をハッシュ → 色・模様の決まったサンプル画像を生成（学習・分類が成立する）
        let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
        const cv = document.createElement('canvas'); cv.width = 224; cv.height = 224;
        const ctx = cv.getContext('2d');
        const hue = h % 360;
        ctx.fillStyle = `hsl(${hue},70%,55%)`; ctx.fillRect(0, 0, 224, 224);
        ctx.fillStyle = `hsl(${(hue + 140) % 360},70%,40%)`;
        for (let i = 0; i < 6; i++) ctx.fillRect(((h >> i) & 7) * 28, ((h >> (i + 3)) & 7) * 28, 56, 56);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(name, 112, 120);
        cv.id = 'ai-image'; cv.style.cssText = 'border-radius:8px;width:200px;height:200px';
        const old = document.getElementById('ai-image'); if (old) old.remove();
        area.insertBefore(cv, document.getElementById('ai-status'));
        window.__pycoAiImage = cv;
        setStatus(`🖼️ 画像「${name}」を表示中。「おしえる」で覚えさせてね`);
        resolve();
      });
    },

    async teach(label) {
      await this.ensureReady();
      const el = this.getInput();
      if (!el) { setStatus('⚠️ さきに「カメラを使う」か「画像を使う」を置いてね'); return; }
      const logits = this._infer();
      this._knn.addExample(logits, label);
      logits.dispose();
      this.state.labels[label] = (this.state.labels[label] || 0) + 1;
      this.state.learned = false;
      setStatus(`📚 おぼえた例：${this.labelsText()}`);
    },

    async learn() {
      await this.ensureReady();
      this.state.learned = true;
      const n = this._knn ? this._knn.getNumClasses() : 0;
      if (n < 2) setStatus(`🎓 学習したよ。じょうずに見分けるには <b>2種類以上</b> 教えてね（いま：${this.labelsText()}）`);
      else setStatus(`🎓 学習できたよ！「なに？」できいてみよう（おぼえた：${this.labelsText()}）`);
    },

    async classify() {
      await this.ensureReady();
      if (!this._knn || this._knn.getNumClasses() === 0) {
        this.state.lastLabel = 'わからない'; this.state.lastConf = 0;
        setStatus('🤔 まだ何も教わっていないよ。「おしえる」→「学習する」をしてね');
        return { label: 'わからない', confidence: 0 };
      }
      const el = this.getInput();
      if (!el) { return { label: 'わからない', confidence: 0 }; }
      const logits = this._infer();
      const res = await this._knn.predictClass(logits, 3);
      logits.dispose();
      const conf = (res.confidences && res.confidences[res.label]) || 0;
      this.state.lastLabel = res.label; this.state.lastConf = conf;
      setStatus(`👀 これは「<b>${res.label}</b>」かな？（自信 ${Math.round(conf * 100)}%）`);
      return { label: res.label, confidence: conf };
    },

    // テスト・授業のリセット用
    reset() {
      try { if (this._knn) this._knn.clearAllClasses(); } catch (e) {}
      this.state.labels = {}; this.state.learned = false;
      this.state.lastLabel = null; this.state.lastConf = 0;
    },
  };
  window.PycoAiCore = Core;

  // ================= Skulpt モジュール（薄いラッパ・suspension）=================
  const AI_JS = String.raw`var $builtinmodule = function(name) {
  'use strict';
  var mod = {};
  var Sk = globalThis.Sk;
  var C = globalThis.PycoAiCore;

  // Promise を Skulpt の suspension に変換（game_engine.js と同方式）
  function susp(p) { return new Sk.misceval.promiseToSuspension(p); }
  var NONE = Sk.builtin.none.none$;

  mod.use_camera = new Sk.builtin.func(function() {
    return susp(C.startCamera().then(function() { return NONE; }, function() { return NONE; }));
  });

  mod.use_image = new Sk.builtin.func(function(name_py) {
    var nm = name_py ? Sk.ffi.remapToJs(name_py) : 'sample';
    return susp(C.useImage(nm).then(function() { return NONE; }, function() { return NONE; }));
  });

  mod.teach = new Sk.builtin.func(function(label_py) {
    var label = Sk.ffi.remapToJs(label_py);
    return susp(C.teach(label).then(function() { return NONE; }, function() { return NONE; }));
  });

  mod.learn = new Sk.builtin.func(function() {
    return susp(C.learn().then(function() { return NONE; }, function() { return NONE; }));
  });

  // いま見えているものは何？（非同期分類 → ラベル文字列を返す）
  mod.what = new Sk.builtin.func(function() {
    return susp(C.classify().then(
      function(r) { return Sk.ffi.remapToPy(r.label); },
      function() { return Sk.ffi.remapToPy('わからない'); }
    ));
  });

  // どれくらい自信ある？（0.0〜1.0・直近の what() の結果・同期）
  mod.confidence = new Sk.builtin.func(function() {
    return Sk.ffi.remapToPy(C.state.lastConf || 0.0);
  });

  return mod;
};`;

  window.PycoAi = {
    source: AI_JS,
    installIntoSkulpt: function(Sk) {
      if (!Sk) return;
      if (!Sk.builtinFiles) Sk.builtinFiles = { files: {} };
      if (!Sk.builtinFiles['files']) Sk.builtinFiles['files'] = {};
      Sk.builtinFiles['files']['pyco_ai.js'] = AI_JS;
      Sk.builtinFiles['files']['pyco_ai/__init__.js'] = AI_JS;
    }
  };
})();
