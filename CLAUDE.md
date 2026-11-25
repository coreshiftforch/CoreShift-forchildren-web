# CoreShift Project Memory

## Tech Stack
- HTML / CSS（静的サイト。GitHub Pages の Jekyll で組み立てる）
- 3D素材: models/*.glb と bake_and_export.py（Blender 用）。今のページでは使っていないが、連番画像の3Dアニメーションなどに使う予定があるので残す

## File Structure
- _layouts/default.html: <head>・全体の枠。_includes/header.html・footer.html: ヘッダーとフッター
- ヘッダーは2段（上の帯＝読む方別の4つ、下＝ジャンル: 3Dプリンター・AI・プログラミング・プログラム・CoreShiftについて＋「開催のご相談」ボタン）。ジャンルの強調はページ先頭の genre（3dprinter / ai / programming / programs）。フッターは見出しつき4列（活動内容・CoreShiftについて・ご案内・お問い合わせ）
- ページごとの目印の色: ページ先頭の page_theme（t-3d 空色・t-ai オレンジ・t-prog 緑・t-programs 深い青・t-orgs 藍・t-children 金・t-support コーラル・t-contact）。ヘッダーの下の線・今いるメニュー・冒頭の背景・パンくずの札がその色になる。新しいページには必ず付ける
- 配色: イメージカラーはロゴの空色 #29abe2（--sky）。白地の文字・ボタンには深い空色 --accent（#0a74b0）、文字は紺 --navy。空色そのものは帯・面・紺文字のバッジにだけ使う（白地では薄すぎる） テクノロジーを強調する部分だけ旧サイトの黒×青（クラス is-tech。技術ページのヒーローと3Dプリンターのしくみ）
- site.css: 共通スタイル。ページ専用のスタイルは各ページの page.css（ページ先頭の extra_css で読み込む）
- index.html（トップ）、for-organizations/（施設・学校向け）、coreshift-for-children/（保護者向け）、coreshift-for-children/support/（企業・個人向け）、contact/（お問い合わせ）
- 技術ごとのページ: 3dprinter/、ai/、programming/（micro:bit・準備中）。技術そのものの紹介だけを書き、体験の流れ・対象・時間はプログラムのページに書く。メニューからはつながず、トップの「使う技術」からリンク
- プログラムごとのページ: programs/nameplate/（A ネームプレート作り）、programs/custom/（B ご相談受付）、programs/ideathon/（C アイデアソン×バイブコーディング）。共通のスタイルは programs/programs.css。中身は案内PDFの各プログラムのページに合わせ、費用の数字は書かない。施設・学校向けのカードと技術ページからリンク
- 残している旧ページ: about/、karakuri/、coreshift-for-children/activities/、coreshift-for-children/event01_takamiya/（活動レポート）
- files/coreshift-guide.pdf: 一般向けの案内資料（ドライブ 01_団体運営/02_資料/02_PDF集/01_一般向け_YYYY-MM-DD（末尾は最終更新日）の「YYYY-MM-DD_CoreShiftのご案内.pdf」の最新版）。直したら差し替える
- files/coreshift-price-list.pdf: 一般向けの料金表（別紙。同じフォルダの「YYYY-MM-DD_料金表.pdf」の最新版）。料金を変えたら差し替える
- 「CoreShift for children/」は転送用。coreshift-for-children/nameplate-demo/ は体験会で使う独立した Web アプリ（なまえプレート。2026-11 に作り直した。Jekyll のレイアウトは使わない。URL は変えない。設定は js/config.js）
- 作業の進め方・文言の方針は docs/ROADMAP.md、作業は GitHub Issue で管理

## Responsive Breakpoints
- サイズ3 (PC): 1301px以上（デフォルト）
- サイズ2 (タブレット): max-width: 1300px
- サイズ1 (スマホ): max-width: 768px

## Notes
- Prefer CSS-based solutions over JS where possible
- 各ページは先頭の設定（--- で囲む部分）＋ <main> の本文だけ。本文に {{ や {% を書かない
- 見出しとボタンは言葉の切れ目に <wbr> を入れる（docs/ROADMAP.md の進め方のきまり）
