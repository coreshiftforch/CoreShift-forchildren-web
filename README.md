# CoreShift ホームページ

福岡市で子ども向けの3Dプリンター・AI・プログラミングのものづくり体験会を開く団体 CoreShift のホームページ（https://core-shift.jp ）のリポジトリです。
HTML / CSS だけの静的サイトで、GitHub Pages が `main` ブランチを Jekyll で組み立てて公開します。

## フォルダの中身

| 場所 | 中身 |
| --- | --- |
| `_layouts/default.html` | 全ページ共通の枠（`<head>`、ヘッダー・フッターの読み込み） |
| `_includes/` | `header.html`（ヘッダー）と `footer.html`（フッター） |
| `site.css` | 全ページ共通のスタイル |
| `index.html` | トップページ |
| ページのフォルダ（`for-organizations/`、`coreshift-for-children/`、`3dprinter/`、`ai/`、`contact/` など） | 各ページの `index.html` と、そのページ専用の `page.css` |
| `programs/` | プログラムの一覧と各プログラムのページ（`nameplate/`、`custom/`、`ideathon/`）。共通のスタイルは `programs.css` |
| `files/` | 配布する資料（`coreshift-guide.pdf` 案内資料） |
| `icon/` | ロゴ・アイコン画像（ファビコンは `coreshift-icon.png`） |
| `images/` | ページで使う画像（OGP 画像、アニメーションの連番画像など） |
| `docs/ROADMAP.md` | 作業の進め方・文言の方針（公開されない） |
| `tools/` | 作業用のスクリプト。`tools/blender/` に 3D 素材（`.glb`）と Blender 用スクリプト（公開されない） |
| `CLAUDE.md` | AI（Claude Code）向けのメモ。構成や決まりごとの要約（公開されない） |

`coreshift-for-children/nameplate-demo/` は体験会で使う独立した Web アプリです。Jekyll のレイアウトは使わず、URL も変えません。

## 手元で見る

Jekyll で組み立ててから見ます（`_includes` の読み込みは Jekyll がするので、`python3 -m http.server` でそのまま開くとヘッダー・フッターが出ません）。

```sh
jekyll serve        # http://localhost:4000 で見られる
```

## ページを足す

フォルダを作り、`index.html` の先頭に設定を書きます。本文は `<main>` の中だけ書きます。

```html
---
layout: default
title: "ページ名｜… — CoreShift"
description: "検索結果に出る説明文"
page_theme: t-3d            # ページの色（t-3d / t-ai / t-prog / t-programs / t-orgs / t-children / t-support / t-contact）。必ず付ける
genre: 3dprinter            # 下段メニューで強調するジャンル（3dprinter / ai / programming / programs）。読む方別のページは nav: orgs など
extra_css: /フォルダ名/page.css  # そのページ専用のスタイル（あれば）
---
<main>
  …
</main>
```

- 本文に `{{` や `{%` を書かない（Jekyll の命令として読まれてしまう）
- 見出しとボタンは、言葉の切れ目に `<wbr>` を入れる（例: `体験会を<wbr>開きませんか`）

## 活動レポートを足す

1. レポートのページを作る（例: `coreshift-for-children/event01_takamiya/` をまねる）
2. **活動レポート一覧** `reports/index.html` の `<ul class="rcards">` の**先頭**に、カードの `<li>` を1つ足す（いまある `<li>` をまねる）
3. **トップ** `index.html` の「これまでの活動」（`<ul class="rcards">`）の**先頭**にも、同じ `<li>` を足す
   - トップに出るのは3つまで。4つ以上になると「もっと見る」（→ 活動レポート一覧）が自動で出ます
4. `sitemap.xml` にレポートのページを足す

## 公開の流れ

1. ブランチを作って直す
2. プルリクエスト（PR）を作る
3. 確認して `main` にマージする
4. GitHub Pages が自動で組み立て直し、数分で https://core-shift.jp に反映される

## 文言のきまり

書き方の方針は `docs/ROADMAP.md` にあります。たとえば:

- 料金表はサイトに載せない（PDF も置かない・リンクしない）
- 費用は「内容に合わせてお見積もり」とだけ書く
