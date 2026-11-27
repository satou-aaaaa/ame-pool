# AGENTS.md

雨をプールで数える：1時間の雨量（mm）と広さ（km²・ha）から、降った水が25mプール何杯分かを当てる1日5問の学習ゲーム（防災シリーズ BS3。核の一言「1km²に1時間100mm＝プール約270杯」）。正解したら、その雨が気象庁「雨の強さと降り方」のどの言葉（やや強い雨〜猛烈な雨）かも選ぶ。答えのあとにプールが並んでいく図を出す。`index.html` と `data.js`（問題の種類）を GitHub Pages で公開する。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめ、検査の依存とブラウザを入れる。何度実行してもよい
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
node qa/run.mjs   # 問題（全種類×3000問：選び肢・答えは1つ・杯数と2段目を別の式で検算・出典）・今日の5問と上級（3年分）・とことん・通しで遊ぶ・続きから・2段目・プールの図・復習・幅320px・PWA・引き継ぎ・見やすさ（CI の QA と同じ）
```

## このリポジトリの決まり

- プールは、たて25m×よこ15m×深さ1m＝375m³ と決めた（日本水泳連盟「プール公認規則」の25mプール：レーン幅は2.50mを推奨・水深1.00m以上。6レーン×2.5m＝15m）。変えると全部の答えが変わるので変えない。根拠と式は共有フォルダ games/ame-pool-research.md。
- 式：水の量（m³）＝雨量（mm）÷1000×広さ（m²）×時間、杯数＝水の量÷375（上から2けたで丸めて「約」）。しみこむ・流れる水は数えない。`qa/run.mjs` は data.js と別に書いた式で検算する。
- 雨の強さの言葉は気象庁「雨の強さと降り方」<https://www.jma.go.jp/jma/kishou/know/yougo_hp/amehyo.html> の1時間雨量の区切り（10・20・30・50・80mm。ちょうどは「以上」の側）。10mm 未満の雨は表に無いので問題にしない。
- 言い方：遊び方と「このゲームについて」と README に、問題の雨は練習のための例で本物の観測の記録ではないこと・答えは目安であることを置く（QA が見る）。
- 問題は3つの形。杯数の問題（id `p<mm>_<広さ>_<時間>`）は杯数を選び、正解したら2段目で雨の強さの言葉（5つ）を選ぶ。逆の問題（`r<mm>`）は杯数から1時間の雨量を選び、2段目もある。決まりの問題は答え1つとまちがい2〜3つで、2段目は無い。やさしいは選び肢3つ（10倍・100倍ちがい）、ふつう・むずかしいは4つ（むずかしいは2倍・3倍ちがいを必ず入れる）。
- 今日の5問（やさしい2・ふつう2・むずかしい1、種類は重ねない）・上級（むずかしい3、今日のむずかしいと別）は日本時間の日付の種で決まり、だれでも同じ。`Math.random()` は練習・とことんの種だけ。`KINDS`・言い回し・まちがいの選び肢は、足すだけでも過去の日の問題が変わる。公開後は変えず、変えるときは QA の `PINS` を作り直して理由を PR に書く。`data.js` を変える PR は自動ではマージされない（`hold_paths`）。
- ★はまちがい＋ヒントの数（0で★3・1で★2・2以上で★1）。上級はヒントなし。時間制限なし。
- 好きなだけ遊べる：チケット・ライフ・回数制限・🔒で開くモードを入れない（shared-workflows `routines/game-dev.md` F1〜F7。QA が見る）。とことん（`runs.e`）はまちがえても続き、「ここで降りる」で終わる。
- 1問を深くする：`depth.js` と `qa/depth-check.mjs` は shared-workflows `template/` の写しで、ここでは直さない。自信あり・2段目「気象庁の言葉では、どの雨？」・復習（1→3→7日後）。記録 `amp-v1`・文字 `amp-fs`・復習 `amp-depth`。
- 共有は遊ぶ人が押したときに開くリンクだけ。シェアの文に問題・答えを出さない。応援は Ko-fi へのただのリンクだけ。
- 外へ通信しない（CSP の `connect-src 'self'` を広げない）。見やすさ（`<!-- a11y:begin -->`〜`end`・`qa/a11y.mjs`）・引き継ぎ（`transfer.js`）・game-core・GameStore・kiroku・parts は shared-workflows `template/` の写しで、ここでは直さない（shared-workflows のルートで `node scripts/sync-template.mjs ../ame-pool` を回して写す）。
- 画面の土台は風力階級よみ（fuuryoku-yomi）から写した（ひな形の部品は `node scripts/new-game.mjs` で入れた）。写し元の言葉が残っていないかを QA が見る。
- PWA：画面のファイルを足したら `sw.js` の `SHELL` にも足し、中身を大きく変えたら `CACHE` の版を上げる。アイコンは `node tools/make-icons.cjs`、`og.png` は `node tools/make-og.cjs`。
- 公開リポジトリなので、個人情報・鍵を入れない。

## 公開

- GitHub Pages は `main` のルート（`/`）を公開する。PR の QA と Secret scan が ✅ になると `automerge.yml` が自動でマージする。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
- `sw.js`・`manifest.webmanifest`・`data.js` を変える PR は自動ではマージされない（`hold_paths`）。CodeRabbit のレビューを読み、手でマージする。CodeRabbit は PR に `@coderabbitai review` とコメントして頼む。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品は shared-workflows の共通部品を呼ぶ。リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md` と `routines/without-claude.md` を読む。
