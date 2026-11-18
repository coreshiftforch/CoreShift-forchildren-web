# CoreShift Project Memory

## Tech Stack
- HTML / CSS（静的サイト。GitHub Pages の Jekyll で組み立てる）
- 3D素材: models/*.glb と bake_and_export.py（Blender 用）。今のページでは使っていないが、連番画像の3Dアニメーションなどに使う予定があるので残す

## File Structure
- _layouts/default.html: <head>・全体の枠。_includes/header.html・footer.html: ヘッダーとフッター
- site.css: 共通スタイル。ページ専用のスタイルは各ページの page.css（ページ先頭の extra_css で読み込む）
- index.html（トップ）、for-organizations/（施設・学校向け）、coreshift-for-children/（保護者向け）、coreshift-for-children/support/（企業・個人向け）、contact/（お問い合わせ）
- 残している旧ページ: about/、3dprinter/、programming/、karakuri/、coreshift-for-children/activities/、coreshift-for-children/event01_takamiya/（活動レポート）
- ai/ と「CoreShift for children/」は転送用。coreshift-for-children/nameplate-demo/ は体験会で使う独立した Web アプリ（触らない）
- 作業の進め方・文言の方針は docs/ROADMAP.md、作業は GitHub Issue で管理

## Responsive Breakpoints
- サイズ3 (PC): 1301px以上（デフォルト）
- サイズ2 (タブレット): max-width: 1300px
- サイズ1 (スマホ): max-width: 768px

## Notes
- Prefer CSS-based solutions over JS where possible
- 各ページは先頭の設定（--- で囲む部分）＋ <main> の本文だけ。本文に {{ や {% を書かない
- 見出しとボタンは言葉の切れ目に <wbr> を入れる（docs/ROADMAP.md の進め方のきまり）
