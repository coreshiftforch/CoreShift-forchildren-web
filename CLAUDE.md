# CoreShift Project Memory

## Tech Stack
- HTML / CSS / JavaScript
- Three.js (3D model rendering)
- GLB files for 3D models

## File Structure
- index.html: main page
- index.html 3dprinter / ai / prog: sub pages
- main.js: Three.js and scroll handling
- style.css: styles

## Responsive Breakpoints
- サイズ3 (PC): 1301px以上（デフォルト）
- サイズ2 (タブレット): max-width: 1300px
- サイズ1 (スマホ): max-width: 768px

## Section Number (.sec-num) Layout Rules
- サイズ3: position absolute, left:80% top:50% centered in section
- サイズ2: font-size 5.6rem, right:88px, top:90px, justify-content:flex-start
- サイズ1: top:160px, right:10px, section padding-top:170px, justify-content:flex-start
- justify-content は flex-start（center にすると短いセクションで数字と見出しがズレる）

## Notes
- Always avoid conflicts with existing Three.js and scroll logic
- Prefer CSS-based solutions over JS where possible
