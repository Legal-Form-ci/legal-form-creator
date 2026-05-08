// Audit Lighthouse mobile + desktop + historique cumulatif.
// Sortie : /og-report/lighthouse/{desktop,mobile}.{json,html}, history.json, summary.md
// Échoue (exit 1) si un score < SEUIL (par défaut 90).
//
// Usage: URL=https://legalform.ci THRESHOLD=90 node lighthouse_check.mjs
//
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import fs from "node:fs";

const URL       = process.env.URL || "https://legalform.ci";
const THRESHOLD = Number(process.env.THRESHOLD || 90);
const OUT       = process.env.OUT_DIR || "./lighthouse-report";
fs.mkdirSync(OUT, { recursive: true });

async function run(formFactor) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  try {
    const cfg = {
      extends: "lighthouse:default",
      settings: {
        formFactor,
        screenEmulation: formFactor === "mobile"
          ? { mobile: true,  width: 412,  height: 823, deviceScaleFactor: 1.75, disabled: false }
          : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1,    disabled: false },
        throttlingMethod: "simulate",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    };
    const r = await lighthouse(URL, { port: chrome.port, output: ["json", "html"], logLevel: "error" }, cfg);
    fs.writeFileSync(`${OUT}/${formFactor}.json`, r.report[0]);
    fs.writeFileSync(`${OUT}/${formFactor}.html`, r.report[1]);
    return Object.fromEntries(Object.entries(r.lhr.categories).map(([k, v]) => [k, Math.round((v.score || 0) * 100)]));
  } finally {
    await chrome.kill();
  }
}

const desktop = await run("desktop");
const mobile  = await run("mobile");
console.log("DESKTOP:", desktop);
console.log("MOBILE :", mobile);

const hf = `${OUT}/history.json`;
const history = fs.existsSync(hf) ? JSON.parse(fs.readFileSync(hf)) : [];
history.push({ at: new Date().toISOString(), url: URL, desktop, mobile });
fs.writeFileSync(hf, JSON.stringify(history, null, 2));

const tbl = (s) => Object.entries(s).map(([k, v]) => `| ${k} | ${v} | ${v >= THRESHOLD ? "✅" : "❌"} |`).join("\n");
fs.writeFileSync(`${OUT}/summary.md`,
`# Lighthouse — ${URL}\n\nDate: ${new Date().toISOString()}  |  Seuil: ${THRESHOLD}\n\n## Desktop\n| Catégorie | Score | OK |\n|---|---:|:--:|\n${tbl(desktop)}\n\n## Mobile\n| Catégorie | Score | OK |\n|---|---:|:--:|\n${tbl(mobile)}\n`);

const failed = [...Object.entries(desktop), ...Object.entries(mobile)].filter(([, v]) => v < THRESHOLD);
if (failed.length) {
  console.error(`\n❌ ${failed.length} score(s) sous le seuil ${THRESHOLD}.`);
  process.exit(1);
}
console.log(`\n✅ Tous les scores ≥ ${THRESHOLD}.`);
