# CoreShift Project Memory

## Tech Stack
- HTML / CSS（静的サイト。GitHub Pages の Jekyll で組み立てる）
- 3D素材: models/*.glb と bake_and_export.py（Blender 用）。今のページでは使っていないが、連番画像の3Dアニメーションなどに使う予定があるので残す

## File Structure
- _layouts/default.html: <head>・全体の枠。_includes/header.html・footer.html: ヘッダーとフッター
- site.css: 共通スタイル。ページ専用のスタイルは各ページの page.css（ページ先頭の extra_css で読み込む）
- index.html（トップ）、for-organizations/（施設・学校向け）、coreshift-for-children/（保護者向け）、coreshift-for-children/support/（企業・個人向け）、contact/（お問い合わせ）
- 技術ごとのページ: 3dprinter/（プログラムA）、ai/（プログラムC。2026-11-22 に転送から作り直し）、programming/（micro:bit・準備中）。メニューからはつながず、施設・学校向けからリンク
- 残している旧ページ: about/、karakuri/、coreshift-for-children/activities/、coreshift-for-children/event01_takamiya/（活動レポート）
- files/coreshift-guide.pdf: 一般向けの案内資料（ドライブ 01_団体運営/02_資料/02_PDF集/01_一般向け の「YYYY-MM-DD_CoreShiftのご案内.pdf」の最新版）。直したら差し替える
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
