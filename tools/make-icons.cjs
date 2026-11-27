// アプリのアイコン（icon-192.png・icon-512.png）を作る。紺の地に、雨つぶとプール（雨の量をプールで数える）。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#123554"/>
      <path d="M50 12 C42 26 36 34 36 42 a14 14 0 0 0 28 0 C64 34 58 26 50 12Z" fill="#7fc4ef"/>
      <rect x="14" y="64" width="72" height="22" rx="3" fill="#2f7fb5" stroke="#fffdf7" stroke-width="3"/>
      <g stroke="#fffdf7" stroke-width="2"><path d="M14 75 H86"/><path d="M38 64 V86"/><path d="M62 64 V86"/></g></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
