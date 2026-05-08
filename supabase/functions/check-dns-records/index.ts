// Vérifie SPF / DKIM / DMARC pour legalform.ci via Google DNS over HTTPS
// - Validation stricte SPF: doit contenir include:_spf.resend.com
// - Validation stricte DKIM: enregistrement valide sur resend._domainkey
// - Persiste l'historique dans dns_check_history (mode persist=true)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOMAIN = "legalform.ci";
const REQUIRED_SPF_INCLUDE = "include:_spf.resend.com";
const RESEND_DKIM_SELECTOR = "resend._domainkey";
const DKIM_FALLBACK_SELECTORS = ["resend", "resend2._domainkey"];

async function dnsQuery(name: string, type: string) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
  if (!res.ok) return { Answer: [] as any[] };
  return await res.json();
}

function joinTxt(records: any[]): string[] {
  return (records || [])
    .filter((r) => r.type === 16 || r.type === "TXT")
    .map((r) => String(r.data || "").replace(/^"|"$/g, "").replace(/" "/g, ""));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let persist = false;
  try {
    const body = await req.json();
    persist = body?.persist === true;
  } catch (_) { /* no body */ }

  try {
    // SPF
    const spfRes = await dnsQuery(DOMAIN, "TXT");
    const spfRecords = joinTxt(spfRes.Answer || []).filter((t) => t.toLowerCase().startsWith("v=spf1"));
    const spfOk = spfRecords.some((r) => r.toLowerCase().includes(REQUIRED_SPF_INCLUDE));

    // DMARC
    const dmarcRes = await dnsQuery(`_dmarc.${DOMAIN}`, "TXT");
    const dmarcRecords = joinTxt(dmarcRes.Answer || []).filter((t) => t.toLowerCase().startsWith("v=dmarc1"));
    const dmarcOk = dmarcRecords.length > 0;

    // DKIM Resend (strict): essai prioritaire sur resend._domainkey
    let dkimOk = false;
    let dkimRecord: string | null = null;
    let dkimSelectorFound: string | null = null;
    const tried: string[] = [];

    const selectors = [RESEND_DKIM_SELECTOR, ...DKIM_FALLBACK_SELECTORS];
    for (const sel of selectors) {
      tried.push(sel);
      const r = await dnsQuery(`${sel}.${DOMAIN}`, "TXT");
      const recs = joinTxt(r.Answer || []);
      const dkim = recs.find((t) => /v=dkim1/i.test(t) && /p=[A-Za-z0-9+/=]{20,}/.test(t));
      if (dkim) {
        dkimOk = true;
        dkimRecord = dkim.slice(0, 250);
        dkimSelectorFound = sel;
        break;
      }
    }

    const result = {
      domain: DOMAIN,
      checked_at: new Date().toISOString(),
      spf: { ok: spfOk, required: REQUIRED_SPF_INCLUDE, records: spfRecords },
      dkim: { ok: dkimOk, selector: dkimSelectorFound, record: dkimRecord, tried, expected_selector: RESEND_DKIM_SELECTOR },
      dmarc: { ok: dmarcOk, records: dmarcRecords },
      all_ok: spfOk && dkimOk && dmarcOk,
      // Instructions précises pour l'admin
      fix_instructions: {
        spf: spfOk ? null : {
          host: "@",
          type: "TXT",
          value: `v=spf1 ${REQUIRED_SPF_INCLUDE} ~all`,
          note: "Si un SPF existe déjà, fusionnez les include: dans un seul enregistrement TXT.",
        },
        dkim: dkimOk ? null : {
          host: RESEND_DKIM_SELECTOR,
          type: "TXT",
          value: "Récupérez la clé publique DKIM exacte dans votre dashboard Resend (Domains → legalform.ci).",
          note: "L'enregistrement attendu commence par v=DKIM1; k=rsa; p=...",
        },
        dmarc: dmarcOk ? null : {
          host: "_dmarc",
          type: "TXT",
          value: "v=DMARC1; p=none; rua=mailto:dmarc@legalform.ci",
        },
      },
    };

    // Persist history if requested (cron or admin action)
    if (persist) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceKey);
        await supabase.from("dns_check_history").insert({
          domain: DOMAIN,
          spf_ok: spfOk,
          dkim_ok: dkimOk,
          dmarc_ok: dmarcOk,
          all_ok: result.all_ok,
          details: result,
        });
      } catch (e) {
        console.error("Failed to persist DNS history:", e);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
