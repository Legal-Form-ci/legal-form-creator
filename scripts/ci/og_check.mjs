// Vérification og:image sur toutes les pages /actualites en production.
// Pré-requis : un sitemap exposant les URLs /actualites/* OU une RPC publique
// list_published_blog_posts() OU une SUPABASE_SERVICE_ROLE_KEY (secret CI).
//
// Usage: SITE=https://legalform.ci node og_check.mjs
//
import fs from "node:fs";

const SB   = process.env.SUPABASE_URL || "https://xwtmnzorzsvkamqemddk.supabase.co";
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const SITE = process.env.SITE || "https://legalform.ci";
const OUT  = process.env.OUT_DIR || "./og-report";

fs.mkdirSync(OUT, { recursive: true });

async function loadFromSitemap() {
  const r = await fetch(`${SITE}/sitemap.xml`);
  if (!r.ok) return [];
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]*\/actualites\/[^<]+)<\/loc>/g)].map(m => ({ url: m[1] }));
}

async function loadFromSupabase() {
  if (!KEY) return [];
  const r = await fetch(`${SB}/rest/v1/blog_posts?select=public_id,slug,cover_image&is_published=eq.true&limit=1000`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) { console.error("Supabase:", r.status, await r.text()); return []; }
  return (await r.json()).map(p => ({ url: `${SITE}/actualites/${p.public_id || p.slug}`, expected: p.cover_image }));
}

const extractOg = (h) =>
  (h.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
   h.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i) || [])[1] || null;

const targets = (await loadFromSitemap()).length ? await loadFromSitemap() : await loadFromSupabase();
console.log(`URLs à vérifier: ${targets.length}`);

const results = [];
for (const t of targets) {
  let status = "KO", actual = null, note = "";
  try {
    const r = await fetch(t.url, { redirect: "follow", headers: { "User-Agent": "OGCheckBot/1.0" }});
    if (!r.ok) note = `HTTP ${r.status}`;
    else {
      actual = extractOg(await r.text());
      if (!actual) note = "og:image absent";
      else if (actual.includes("logo")) note = "og:image = logo (statique, pas dynamique)";
      else if (t.expected && !actual.includes(t.expected.split("/").pop().split("?")[0])) note = "og:image ≠ cover_image";
      else { status = "OK"; note = "ok"; }
    }
  } catch (e) { note = e.message; }
  results.push({ url: t.url, status, expected: t.expected, actual, note });
  console.log(`${status.padEnd(2)} ${t.url} — ${note}`);
}

const ok = results.filter(r => r.status === "OK").length;
const md = `# Rapport og:image\n\n${new Date().toISOString()} — ${SITE}\n\n**Total: ${results.length} | OK: ${ok} | KO: ${results.length - ok}**\n\n| Statut | URL | cover attendu | og:image trouvé | Note |\n|---|---|---|---|---|\n` +
  results.map(r => `| ${r.status} | ${r.url} | ${r.expected ?? "—"} | ${r.actual ?? "—"} | ${r.note} |`).join("\n");

fs.writeFileSync(`${OUT}/og_image_report.md`, md);
fs.writeFileSync(`${OUT}/og_image_report.json`, JSON.stringify(results, null, 2));
console.log(`\n${ok}/${results.length} OK — rapports: ${OUT}/`);
process.exit(results.length > 0 && ok < results.length ? 1 : 0);
