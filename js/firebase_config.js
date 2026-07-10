// =============================================================
// Firebase 設定ファイル
//   docs/FIREBASE-SETUP.md の手順で取得した firebaseConfig を貼り付ける。
//
//   ★ このファイルが null のままなら、ログイン・クラウド保存の機能は
//     一切表示されず、アプリは今まで通り（ローカル自動保存のみ）動きます。
//     Firebase プロジェクトを作らなくても PycoBlocks は完全に使えます。
//
//   有効化するには、下の null を削除して、コンソールでコピーした
//   firebaseConfig オブジェクトをそのまま代入してください。
// =============================================================
window.PYCO_FIREBASE_CONFIG = null;

// 例（docs/FIREBASE-SETUP.md の手順5でコピーした値に置き換える）:
// window.PYCO_FIREBASE_CONFIG = {
//   apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   authDomain:        "pycoblocks-xxxxx.firebaseapp.com",
//   projectId:         "pycoblocks-xxxxx",
//   storageBucket:     "pycoblocks-xxxxx.appspot.com",
//   messagingSenderId: "000000000000",
//   appId:             "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx"
// };
