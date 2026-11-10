# 自由研究コンテンツ 原稿（日英）

レイアウト・デザインが決まる前の**テキスト原稿**。ページを作り直すときはここから文言を持っていく。
現在の実装では、この文言は `i18n.js` の `res-*`（トップ）／ `kr-*`（からくりおもちゃ）キーに入っている。

- からくりおもちゃページの方向性: **ポップな見た目**（レイアウト・デザインはユーザーが決定。現在の `/karakuri/` は黒基調の仮組み）
- 未確定: 動画URL / キット販売ページ / 価格 / 完成品写真 / 第1弾の機種（メリーゴーラウンド・観覧車・時計台のどれか）

---

## 1. トップページ（自由研究）

### ヒーロー

| | JP | EN |
|---|---|---|
| ラベル | FREE RESEARCH | FREE RESEARCH |
| 見出し | つくって、動かして、<br>わかる。 | Build it. Run it.<br>Understand it. |
| リード | 手を動かすところから始める自由研究を、動画とキットで公開していきます。<br>第一弾は、歯車で動く「からくりおもちゃ」。 | Hands-on research projects for kids, released as videos and build kits.<br>First up: karakuri toys driven by gears. |
| ボタン1 | からくりおもちゃを見る | See the karakuri toy |
| ボタン2 | 自由研究の進め方 | How it works |

### 01 Themes

**リード**
- JP: ひとつのテーマを、動画で見て、キットで作って、自分の言葉でまとめるところまで。夏休みの自由研究にそのまま使えるかたちで用意します。
- EN: Each theme takes you from watching the video, to building the kit, to writing up what you found — ready to hand in as a summer research project.

**カード1（第1弾 / Theme 01）**
- 見出し: からくりおもちゃ ／ Karakuri Toys
- 本文 JP: ハンドルを回すと動きが伝わる仕組みを、歯車・カム・クランクから読み解きます。3Dプリンターで作ったパーツを組み立てて、動きの理由を自分で確かめる自由研究です。
- 本文 EN: Turn the handle and motion travels across the model. Gears, cams, and cranks explain why. Assemble 3D-printed parts and find the reason for the movement yourself.
- リンク文言: くわしく見る → ／ Read more →

**カード2（Coming Soon）**
- 見出し: 次のテーマ ／ Next Theme
- 本文 JP: AI・プログラミング・3Dプリンターを使った自由研究のテーマを準備中です。公開情報はSNSでお知らせします。
- 本文 EN: More research themes using AI, programming, and 3D printing are in preparation. We will announce them on our social accounts.

### 02 How to

**リード**
- JP: 自由研究は「作って終わり」ではありません。CoreShiftのテーマは、この3ステップで進められるように作っています。
- EN: A research project does not end when the build is finished. Every CoreShift theme is designed around these three steps.

| STEP | 見出し JP / EN | 本文 JP | 本文 EN |
|---|---|---|---|
| 1 | 動画で見る / Watch | どんな仕組みで動くのかを、実物が動く映像で確認します。作る前に完成形とポイントがわかります。 | See the real thing in motion first, so you know what you are building and what to look out for. |
| 2 | キットで作る / Build | 3Dプリンターで出力したパーツのキットを組み立てます。うまく動かないときこそ、観察のしどころです。 | Assemble the 3D-printed parts. When it does not move smoothly, that is exactly when observation gets interesting. |
| 3 | まとめる / Write it up | 気づいたことを記録して、自分の言葉でまとめます。まとめ方のテンプレートも一緒に配布予定です。 | Record what you noticed and put it in your own words. A write-up template will be provided too. |

### 03 About（導線）

- リード JP: CoreShiftは、18歳の学生を中心とした学生グループです。子どもたちが現代の技術を「手段」として使いこなす力を育てる活動をしています。
- リード EN: CoreShift is a student group centered around 18-year-old students, working to help children use modern technology as a tool.
- カード「CoreShift について」JP: 活動の背景・3Dプリンター／AI／プログラミングの取り組み・イベント情報・支援のお願いはこちらから。
- カード「CoreShift について」EN: Our background, our work with 3D printing / AI / programming, event news, and how to support us.

---

## 2. からくりおもちゃ ページ（キットページ）

### ヒーロー

| | JP | EN |
|---|---|---|
| ラベル | THEME 01 ／ からくりおもちゃ | THEME 01 / KARAKURI TOYS |
| 見出し | 回すと動く。<br>その理由を調べる。 | It moves when you turn it.<br>Find out why. |
| リード | ハンドルを回すと、離れたところの部品が上下したり、回ったりする。<br>その「伝わり方」を、組み立てながら確かめる自由研究です。 | Turn the handle and a part far away rises, falls, or spins.<br>This project is about tracing how that motion travels — while you build it. |

### 01 しくみ / Mechanism

**リード**
- JP: からくりおもちゃの動きは、たいてい次の3つの部品の組み合わせでできています。どれも身のまわりの機械に使われているものです。
- EN: Karakuri movement almost always comes from a combination of these three parts. All of them are used in machines around you.

**歯車（ギア） / Gears — 速さと向きを変える / Change speed and direction**
- JP: かみ合った歯車は、たがいに逆向きに回ります。歯の数が違うと回る速さも変わります。大きい歯車から小さい歯車へ伝えると速く、逆にすると遅く、そのかわり力が強くなります。
- EN: Meshed gears turn in opposite directions. Different tooth counts change the speed: driving a small gear from a large one is faster, and the other way round is slower but stronger.

**カム / Cam — 回転を上下に変える / Turn rotation into up-and-down**
- JP: 軸に取り付けた丸くない部品がカムです。回転すると、その上にのった棒が押し上げられたり下がったりします。回り続ける動きを、くり返す上下の動きに変える部品です。
- EN: A cam is a non-round part fixed to a shaft. As it rotates, a rod resting on it is pushed up and lowered again — converting continuous rotation into repeating vertical motion.

**クランク / Crank — 回転を往復に変える / Turn rotation into back-and-forth**
- JP: 軸から少しずらした場所に棒をつなぐと、回転が行ったり来たりの往復運動になります。自転車のペダルや電車の車輪と同じ考え方です。
- EN: Attach a rod off-center from the shaft and rotation becomes reciprocating motion — the same idea as bicycle pedals or train wheels.

**調べるポイント / Things to investigate**
1. JP: 歯の数を数えて、ハンドルを1回まわすと先の部品が何回まわるか予想してから、実際に数えてみる。
   EN: Count the teeth, predict how many times the far part turns for one turn of the handle, then check by counting.
2. JP: 動きが重いとき・止まるときは、どこが当たっているのかを観察する。
   EN: When the motion feels heavy or stops, observe where the parts are rubbing or catching.
3. JP: 同じ仕組みが使われているものを、家の中や街の中から探してみる。
   EN: Look for the same mechanisms in your home and around town.

### 02 つくる / Build

**リード**
- JP: 3Dプリンターで出力したパーツを組み立てて、実際に動かします。動画とキットは順次公開します。
- EN: Assemble the 3D-printed parts and get it moving. Videos and kits are being released step by step.

**解説動画 / Guide video（公開準備中 / In preparation）**
- JP: 組み立ての手順と、動きの仕組みを説明する動画を準備しています。公開したらこのページとSNSでお知らせします。
- EN: A video covering the assembly steps and the mechanism is in preparation. We will announce it here and on social media.

**組み立てキット / Build kit（販売準備中 / Coming to the shop）**
- JP: 必要なパーツをそろえたキットを準備中です。販売はCoreShiftのBASEショップで行う予定です。
- EN: A kit with all the parts you need is in preparation. It will be sold through the CoreShift BASE shop.
- リンク: https://coreshift.base.shop/

### 03 まとめる / Write it up

**リード**
- JP: 自由研究として提出するときは、この順番で書くとまとまります。写真をはさむと、それだけで読みやすくなります。
- EN: When you hand the project in, this order works well. Adding photos alone makes it much easier to read.

| # | 見出し JP / EN | 本文 JP | 本文 EN |
|---|---|---|---|
| 1 | きっかけ・調べたいこと / Why you chose it | 「回すとどうして動くのか知りたかった」など、はじめの疑問を書きます。 | Write down your first question, such as "I wanted to know why it moves when you turn it." |
| 2 | 予想 / Your prediction | 組み立てる前に、どう動くと思ったかを書いておきます。外れていても大丈夫です。 | Before building, write down how you think it will move. Being wrong is perfectly fine. |
| 3 | やったこと / What you did | 組み立ての手順、歯の数、測った回数などを記録します。 | Record the assembly steps, the tooth counts, and the numbers you measured. |
| 4 | わかったこと / What you found | 予想と比べてどうだったか。うまくいかなかったことも立派な結果です。 | Compare it with your prediction. Things that did not work are results too. |
| 5 | もっと調べたいこと / What to try next | 次にためしてみたいことを書いて終わります。 | Finish by writing down what you would like to investigate next. |

**CTA**: キット・体験会のお問い合わせ ／ Ask about kits and workshops → `/contact/`

---

## メタ情報（SEO）

- トップ `<title>`: CoreShift — つくる自由研究
- トップ description: 3Dプリンターで作るからくりおもちゃなど、手を動かして学ぶ自由研究のテーマを、動画とキットで公開します。小学生から楽しめる体験型の自由研究をCoreShiftがサポート。
- からくり `<title>`: からくりおもちゃ — つくる自由研究 | CoreShift
- からくり description: 歯車・カム・クランクで動くからくりおもちゃを組み立てて、動きの仕組みを調べる自由研究。3Dプリンターで作ったパーツのキットと解説動画で、小学生から取り組めます。
