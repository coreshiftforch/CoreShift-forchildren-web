/* ══════════════════════════════════════════════════════════════
   なまえプレート ― 変えることがある値は ここに まとめてある

   ★3mf の保存先（Googleドライブのフォルダ）は、このファイルではなく
     **Apps Script の側**が決めている。フォルダを動かす／名前を変えるときは
     Apps Script の FOLDER_ID を直す。SUBMIT_URL は そのままでよい。
     （Apps Script を新しく作り直したときだけ、下の URL を書きかえる）
   ══════════════════════════════════════════════════════════════ */
window.NAMEPLATE_CONFIG = {
  /* イベント会場モード（?mode=event）の あいことばを確かめる Apps Script */
  GATE_URL: 'https://script.google.com/macros/s/AKfycbxZyhmcQmkTiLi7dhWR8VQ09BKn9B5oj58xxXbC54yA7eiamzYZjhviSlDRGuMs_1BLQg/exec',

  /* できあがった 3mf を受けとって ドライブに保存する Apps Script */
  SUBMIT_URL: 'https://script.google.com/macros/s/AKfycbwEUGychKUl6O6SDKZNHq2t9r_cANxnLxWOeqLfxHceE84hkUSVXRFuMVREg-WXMXi4/exec',

  /* あいことばを入れてから 何分間 聞きなおさないか */
  UNLOCK_MINUTES: 20,

  /* できあがりの最大サイズ（穴のリングこみ・mm）。こえるときは土台を自動で縮める */
  PLATE_MAX_W_MM: 50,
  PLATE_MAX_H_MM: 40,

  /* フィラメントの色。Bambu Lab 純正 PLA Basic の公式hex（黄だけは見た目合わせ）。
     short は ファイル名に使う1文字（例 たろう_名白_土灰） */
  FILAMENTS: [
    { name: 'くろ',     short: '黒', hex: 0x000000 },
    { name: 'しろ',     short: '白', hex: 0xffffff },
    { name: 'はいいろ', short: '灰', hex: 0x8e9089 },
    { name: 'みずいろ', short: '水', hex: 0x00b1b7 },
    { name: 'ピンク',   short: '桃', hex: 0xf5547c },
    { name: 'オレンジ', short: '橙', hex: 0xff6a13 },
    { name: 'みどり',   short: '緑', hex: 0x00ae42 },
    { name: 'きいろ',   short: '黄', hex: 0xf5cf3d },
  ],
};
