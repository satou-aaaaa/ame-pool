// 雨をプールで数えるの問題を作る（ブラウザと node の両方で使う）。
// 1問は、1時間の雨量（mm）と広さ（km²・ha）から、降った水が25mプール何杯分かを選ぶ（正解したら2段目「気象庁の言葉では、どの雨？」）か、
// 雨の量とプールの決まりの問いに答える。
// プールの大きさは、たて25m×よこ15m×深さ1m＝375m³ と決めた（日本水泳連盟「プール公認規則」の25mプール：レーン幅は2.50mを推奨・水深1.00m以上。
// 6レーン×2.5m＝15m。施設要領の標準プールは6レーン以上）。本物のプールは大きさがちがうので、答えは目安。
// 水の量（m³）＝ 雨量(mm) ÷ 1000 × 広さ(m²) × 時間。プールの杯数＝水の量 ÷ 375。しみこむ・流れる分は数えない。
// 雨の強さの言葉は、気象庁「雨の強さと降り方」の表（1時間雨量。境目ちょうどは「以上」の側）。要点は共有フォルダ games/ame-pool-research.md。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回し・まちがいの選び肢は、足すだけでも過去の日の問題が変わる（選ぶ範囲が変わるため）。公開したあとは変えず、変えるときは qa/run.mjs の PINS を作り直して PR に理由を書く。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    ame: ["気象庁「雨の強さと降り方」", "https://www.jma.go.jp/jma/kishou/know/yougo_hp/amehyo.html"],
    pool: ["日本水泳連盟「プール公認規則」（郡山市の掲載）", "https://www.city.koriyama.lg.jp/uploaded/attachment/2832.pdf"],
  };

  // このゲームのプール（m）。たて×よこ×深さ＝375m³
  const POOL = { l: 25, w: 15, d: 1 };
  const POOL_M3 = POOL.l * POOL.w * POOL.d;

  // 2段目「気象庁の言葉では、どの雨？」の5つ（気象庁「雨の強さと降り方」。1時間雨量の下の端「以上」）
  // sub は表の「人の受けるイメージ」。数を書かない（書くと表を見ずに当たる）
  const GROUPS = {
    yaya: { name: "やや強い雨", sub: "ザーザーと降る" },
    tsuyoi: { name: "強い雨", sub: "どしゃ降り" },
    hageshii: { name: "激しい雨", sub: "バケツをひっくり返したように降る" },
    hijo: { name: "非常に激しい雨", sub: "滝のように降る" },
    moretsu: { name: "猛烈な雨", sub: "息苦しくなるような圧迫感がある" },
  };
  const LOW = { yaya: 10, tsuyoi: 20, hageshii: 30, hijo: 50, moretsu: 80 };
  const RANGE = { yaya: "10mm以上20mm未満", tsuyoi: "20mm以上30mm未満", hageshii: "30mm以上50mm未満", hijo: "50mm以上80mm未満", moretsu: "80mm以上" };
  const grpOf = (mm) => (mm >= 80 ? "moretsu" : mm >= 50 ? "hijo" : mm >= 30 ? "hageshii" : mm >= 20 ? "tsuyoi" : "yaya");
  const gwhyOf = (mm) => { const g = grpOf(mm); return `気象庁「雨の強さと降り方」では、1時間雨量${RANGE[g]}を「${GROUPS[g].name}」といいます。${mm === LOW[g] ? `${mm}mmちょうどは「以上」の側です。` : ""}`; };

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end
  const MEDIA = { kiroku: "雨の記録", gyaku: "逆から考える", kimari: "雨とプールの決まり" };

  // 数の書き方：3けたごとに「,」、1万からは「万」
  const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  function fmt(n) {
    if (n >= 10000) { const m = n / 10000; return `${Number.isInteger(m) ? comma(m) : String(Math.round(m * 100) / 100)}万`; }
    return Number.isInteger(n) ? comma(n) : String(n);
  }
  // 上から2けたに丸める（1より小さい数は使わない。10より小さい数は小数1けた）
  function round2(x) {
    if (x < 10) return Math.round(x * 10) / 10;
    const p = Math.pow(10, Math.floor(Math.log10(x)) - 1);
    return Math.round(x / p) * p;
  }
  const cups = (x) => `約${fmt(round2(x))}杯`;
  // 広さ：km² か ha。m2 は平方メートル
  const AREA = { "0.5k": [500000, "0.5km²"], "1k": [1e6, "1km²"], "2k": [2e6, "2km²"], "3k": [3e6, "3km²"], "5k": [5e6, "5km²"], "10k": [1e7, "10km²"], "1h": [1e4, "1ha"], "10h": [1e5, "10ha"], "50h": [5e5, "50ha"] };
  const AREA_NOTE = { "1h": "1ha＝100m×100m＝1万m²", "10h": "10ha＝1万m²の10こ分＝10万m²", "50h": "50ha＝50万m²＝0.5km²" };
  const m3Of = (mm, m2, h) => (mm / 1000) * m2 * h; // 水の量（m³）
  const poolsOf = (mm, m2, h) => m3Of(mm, m2, h) / POOL_M3;

  // 杯数のまちがいの選び肢：答えを何倍かした数（丸めたあとで答えと重ならず、1以上のものだけ）
  const FAR = [10, 0.1, 100, 0.01], NEAR = [3, 1 / 3, 2, 0.5], N3 = [3, 1 / 3], N2 = [2, 0.5];
  function distract(R, x, lv) {
    const a = round2(x), ok = (f) => { const v = round2(x * f); return v >= 1 && v !== a; };
    const far = FAR.filter(ok), near = NEAR.filter(ok);
    if (lv === 0) return pickN(R, far, 2);
    if (lv === 2) return [...pickN(R, N3.filter(ok), 1), ...pickN(R, N2.filter(ok), 1), ...pickN(R, far, 1)]; // むずかしいは3倍ちがい・2倍ちがいを1つずつと、10倍以上ちがいを1つ
    return pickN(R, [...far, ...near.slice(0, 2)], 3);
  }
  const PLACE = ["町", "住宅地", "地いき", "まち全体"];
  const rainTxt = (mm, h) => (h > 1 ? `1時間${mm}mmの雨が${h}時間続いた` : `1時間に${mm}mmの雨`);
  const SIT = [
    (a, pl, r) => `${a}の${pl}に、${r}。降った水は25mプール何杯分？`,
    (a, pl, r) => `${r}。${a}の${pl}に降った水は、プール何杯分？`,
    (a, pl, r) => `雨の記録：${a}の${pl}に、${r}。プールで何杯分？`,
    (a, pl, r) => `${a}の${pl}。${r}。水は25mプール何杯？`,
  ];
  function poolMake(mm, code, h) {
    const [m2, al] = AREA[code], x = poolsOf(mm, m2, h);
    return (R, lv) => {
      const si = ri(R, 0, SIT.length - 1), pi = ri(R, 0, PLACE.length - 1), fs = distract(R, x, lv);
      const opts = shuffle(R, [x, ...fs.map((f) => x * f)]).map(cups);
      return { type: "act", media: MEDIA.kiroku, q: SIT[si](al, PLACE[pi], rainTxt(mm, h)), opts, ans: cups(x), rev: false, v: `${si}.${pi}:${fs.map((f) => [...FAR, ...NEAR].indexOf(f)).join(".")}` };
    };
  }
  // 杯数の問題。id は p<mm>_<広さ>_<時間>
  const P = (lv, mm, code, h, look) => {
    const [m2, al] = AREA[code], v = m3Of(mm, m2, h), x = poolsOf(mm, m2, h), g = grpOf(mm);
    const hs = h > 1 ? `×${h}時間` : "";
    return { id: `p${mm}_${code}_${h}`, lv, mm, area: al, m2, h, pools: round2(x), m3: v, ans: cups(x), grp: g, gwhy: gwhyOf(mm), col: "kiroku",
      name: `${al}に${mm}mm${h > 1 ? `×${h}時間` : ""}：${cups(x)}`,
      look: look || (AREA_NOTE[code] ? `${AREA_NOTE[code]}。プール1杯は375m³。` : "1km²に1mmで1,000m³。プール1杯は375m³。"),
      key: `降った水は${fmt(v)}m³。これを375m³で割ります。`,
      why: `${mm}mm＝${mm / 1000}m。${mm / 1000}m×${fmt(m2)}m²${hs}＝${fmt(v)}m³。375m³で割ると${String(Math.round(x * 10) / 10)}杯、${cups(x)}です。`,
      src: ["ame", "pool"], make: poolMake(mm, code, h) };
  };
  // 逆の問題：1km²に1時間で、プール約N杯分の雨。何mm？（選び肢は RM の中から）
  const RM = [10, 30, 50, 80, 100, 120];
  const RSIT = [
    (c) => `1km²の町に1時間の雨。降った水は25mプール${c}分。1時間に何mm？`,
    (c) => `1時間の雨で、1km²にプール${c}分の水。雨は何mm？`,
    (c) => `1km²に降った1時間の雨が、プール${c}分。1時間雨量は？`,
  ];
  function revMake(mm) {
    const a = RM.indexOf(mm), x = poolsOf(mm, 1e6, 1);
    return (R, lv) => {
      const si = ri(R, 0, RSIT.length - 1), all = RM.map((_, i) => i).filter((i) => i !== a), nb = all.filter((i) => Math.abs(i - a) === 1);
      let ds;
      if (lv === 2) { const n1 = pickN(R, nb, 1); ds = [...n1, ...pickN(R, all.filter((i) => !n1.includes(i)), 2)]; } else ds = pickN(R, all, lv === 0 ? 2 : 3);
      return { type: "act", media: MEDIA.gyaku, q: RSIT[si](cups(x)), opts: shuffle(R, [a, ...ds]).map((i) => `${RM[i]}mm`), ans: `${mm}mm`, rev: true, v: `${si}:${ds.join(".")}` };
    };
  }
  const RV = (lv, mm, look) => {
    const x = poolsOf(mm, 1e6, 1);
    return { id: `r${mm}`, lv, mm, area: "1km²", m2: 1e6, h: 1, pools: round2(x), m3: m3Of(mm, 1e6, 1), ans: `${mm}mm`, grp: grpOf(mm), gwhy: gwhyOf(mm), col: "gyaku",
      name: `1km²にプール${cups(x)}：${mm}mm`, look: look || "1km²に1mmでプール約2.7杯分です。", key: `${cups(x)}×375m³で、およそ${fmt(m3Of(mm, 1e6, 1))}m³です。`,
      why: `1km²に1mmで1,000m³。${mm}mmなら${fmt(m3Of(mm, 1e6, 1))}m³で、375m³で割ると${cups(x)}です。`, src: ["ame", "pool"], make: revMake(mm) };
  };
  // 決まりの問題。ans：答え、ws：まちがいの選び肢の候補（やさしいは2つ、ほかは3つ使う）、sit：問いの言い方
  function fact(col, sit, ans, ws) {
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), ds = pickN(R, ws, lv === 0 ? 2 : 3);
      return { type: "fact", media: MEDIA[col], q: sit[si], opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${ds.map((d) => ws.indexOf(d)).join(".")}` };
    };
  }
  const F = (id, lv, src, name, look, key, why, sit, ans, ws) => ({ id, lv, ans, grp: null, gwhy: "", col: "kimari", name, look, key, why, src, make: fact("kimari", sit, ans, ws) });

  const KINDS = [
    // ---- やさしい ----
    P(0, 10, "1k", 1), P(0, 20, "1k", 1), P(0, 30, "1k", 1), P(0, 50, "1k", 1), P(0, 80, "1k", 1),
    P(0, 100, "1k", 1, "1km²に100mmで10万m³。プール1杯は375m³。"),
    P(0, 20, "2k", 1), P(0, 50, "2k", 1), P(0, 100, "2k", 1),
    F("f1l", 0, ["ame"], "1m²に1mmの雨は1L", "1mm＝0.001mです。", "1m²×0.001m＝0.001m³＝1Lです。",
      "雨量1mmは、降った水が深さ1mmたまる量です。1m²なら0.001m³、つまり1Lです。",
      ["1m²の地面に1mmの雨。たまる水は何L？", "1mmの雨が1m²に降った。水の量は？", "1m²の上に深さ1mmの水。何L？"], "1L", ["10L", "100L", "1000L", "0.1L", "0.01L"]),
    F("f375", 0, ["pool"], "このゲームのプール1杯は375m³", "たて×よこ×深さです。", "25m×15m×1m＝375m³です。",
      "このゲームでは、25mプールを、たて25m・よこ15m（6レーン×2.5m）・深さ1mと決めています。25×15×1＝375m³です。",
      ["このゲームのプール（25m×15m×深さ1m）は何m³？", "たて25m・よこ15m・深さ1mのプール。水は何m³？", "25mプール1杯（よこ15m・深さ1m）の水の量は？"], "375m³", ["37.5m³", "3,750m³", "3.75m³", "37,500m³", "1,000m³"]),
    F("fhour", 0, ["ame"], "雨の強さは1時間雨量で分ける", "表のいちばん左の列です。", "「やや強い雨」から「猛烈な雨」は、1時間雨量で分けています。",
      "気象庁「雨の強さと降り方」の表は、1時間雨量（mm）で「やや強い雨」から「猛烈な雨」までを分けています。",
      ["「やや強い雨」「猛烈な雨」は、何の雨量で分けている？", "気象庁の雨の強さの言葉。もとになる雨量は？", "「激しい雨」は、どの雨量で決まる？"], "1時間雨量", ["1日の雨量", "1か月の雨量", "1年の雨量", "1分間の雨量"]),
    // ---- ふつう ----
    P(1, 15, "0.5k", 1), P(1, 40, "0.5k", 1), P(1, 60, "0.5k", 1), P(1, 90, "0.5k", 1),
    P(1, 25, "3k", 1), P(1, 50, "3k", 1), P(1, 70, "3k", 1), P(1, 100, "3k", 1),
    P(1, 20, "5k", 1), P(1, 30, "5k", 1), P(1, 80, "5k", 1), P(1, 110, "5k", 1),
    P(1, 10, "10k", 1), P(1, 40, "10k", 1), P(1, 60, "10k", 1), P(1, 120, "10k", 1),
    P(1, 20, "1k", 2), P(1, 30, "1k", 2), P(1, 50, "1k", 2), P(1, 40, "2k", 2),
    RV(1, 100, "1km²に100mmで10万m³です。"),
    F("f1000", 1, ["ame"], "1km²に1mmの雨は1,000m³", "1km²＝1000m×1000m＝100万m²。", "100万m²×0.001m＝1,000m³です。",
      "1km²は100万m²です。1mm（0.001m）の雨が降ると、100万×0.001＝1,000m³の水になります。",
      ["1km²の町に1mmの雨。降った水は何m³？", "1mmの雨が1km²に降った。水の量は？", "100万m²（1km²）に1mmの雨。何m³？"], "1,000m³", ["1m³", "10m³", "100m³", "10万m³", "100万m³"]),
    F("f10man", 1, ["ame"], "1km²に100mmの雨は10万m³", "1km²に1mmで1,000m³です。", "1,000m³×100＝10万m³です。",
      "1km²に1mmで1,000m³。100mmなら1,000×100＝10万m³です。プールなら約270杯です。",
      ["1km²の町に1時間100mmの雨。降った水は何m³？", "100mmの雨が1km²に降った。水の量は？", "1km²に100mm。たまる水は何m³？"], "10万m³", ["100m³", "1,000m³", "1万m³", "100万m³", "1億m³"]),
    F("f80", 1, ["ame"], "1時間80mm以上は猛烈な雨", "表のいちばん下の行です。", "1時間雨量80mm以上を「猛烈な雨」といいます。",
      "気象庁「雨の強さと降り方」では、1時間雨量80mm以上の雨を「猛烈な雨」といいます。",
      ["1時間雨量80mm以上の雨を、気象庁は何という？", "気象庁の言葉で、いちばん強い雨は？", "「息苦しくなるような圧迫感」の雨は？"], "猛烈な雨", ["やや強い雨", "強い雨", "激しい雨", "非常に激しい雨"]),
    // ---- むずかしい ----
    P(2, 30, "10h", 1), P(2, 50, "10h", 1), P(2, 80, "10h", 1),
    P(2, 20, "50h", 1), P(2, 60, "50h", 1), P(2, 100, "50h", 1),
    P(2, 50, "1h", 1), P(2, 100, "1h", 1),
    P(2, 20, "1k", 3), P(2, 40, "1k", 3), P(2, 30, "3k", 3),
    RV(2, 10), RV(2, 30), RV(2, 50), RV(2, 80), RV(2, 120),
    F("f375mm", 2, ["pool"], "1haに37.5mmでプール1杯", "1ha＝1万m²。375m³を1万m²で割ります。", "375÷10000＝0.0375m＝37.5mmです。",
      "1haは1万m²です。プール1杯375m³を1万m²に広げると、深さ0.0375m＝37.5mmです。",
      ["1ha（100m×100m）に何mmの雨で、プール1杯分？", "1万m²に降ってプール1杯分になる雨は何mm？", "プール1杯（375m³）を1haに広げると深さは？"], "37.5mm", ["3.75mm", "375mm", "0.375mm", "3,750mm", "1mm"]),
    F("fbucket", 2, ["ame"], "バケツをひっくり返したように降るのは激しい雨", "30mm以上50mm未満の雨です。", "「バケツをひっくり返したように降る」は激しい雨です。",
      "気象庁「雨の強さと降り方」では、激しい雨（1時間30mm以上50mm未満）を「バケツをひっくり返したように降る」としています。",
      ["「バケツをひっくり返したように降る」雨は？", "気象庁の表で「道路が川のようになる」雨は？", "1時間30mm以上50mm未満の雨の名前は？"], "激しい雨", ["やや強い雨", "強い雨", "非常に激しい雨", "猛烈な雨"]),
    F("ftaki", 2, ["ame"], "滝のように降るのは非常に激しい雨", "50mm以上80mm未満の雨です。", "「滝のように降る」は非常に激しい雨です。",
      "気象庁「雨の強さと降り方」では、非常に激しい雨（1時間50mm以上80mm未満）を「滝のように降る」としています。傘は全く役に立たなくなります。",
      ["「滝のように降る」雨は？", "気象庁の表で「傘は全く役に立たなくなる」雨は？", "1時間50mm以上80mm未満の雨の名前は？"], "非常に激しい雨", ["やや強い雨", "強い雨", "激しい雨", "猛烈な雨"]),
    F("fkijun", 2, ["ame"], "警報・注意報の基準は地域によって異なる", "全国で1つの数ではありません。", "大雨の警報や注意報の基準は、地域によって異なります。",
      "気象庁「雨の強さと降り方」の注では、大雨の警報や注意報の基準は地域によって異なるとしています。",
      ["大雨の警報や注意報の基準は、どう決まっている？", "気象庁の注で、警報や注意報の基準について正しいのは？", "大雨警報の基準の雨量は？"], "地域によって異なる", ["全国どこでも同じ", "1時間80mmと決まっている", "その日の天気で毎回決める", "基準は無い", "海の近くだけ決まっている"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "p100_1k_1|2026-11-27:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: k.gwhy, mm: k.mm || 0, pools: k.pools || 0, h: k.h || 0, area: k.area || "", src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const AMP = { KINDS, BY, GROUPS, LOW, RANGE, LV, SRC, POOL, POOL_M3, MEDIA, grpOf, round2, fmt, cups, poolsOf, m3Of, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = AMP; else root.AMP = AMP;
})(typeof self !== "undefined" ? self : this);
