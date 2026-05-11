// Auto-dispatch newsletter from Actualités/Opportunités based on automations.
// Triggered by pg_cron (no body) or manually with { automationId, force }.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendEmailWithFailover } from "../_shared/email-sender.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function shouldRun(a: any): boolean {
  if (!a.is_active) return false;
  const now = new Date();
  if (a.last_run_at) {
    const last = new Date(a.last_run_at);
    const diffH = (now.getTime() - last.getTime()) / 36e5;
    if (a.frequency === "hourly" && diffH < 1) return false;
    if (a.frequency === "daily" && diffH < 23) return false;
    if (a.frequency === "weekly" && diffH < 23 * 7) return false;
  }
  return true;
}

function buildHtml(item: any, source: "news" | "opportunity"): string {
  const title = item.title || item.name || "Nouveauté LegalForm";
  const summary = item.excerpt || item.description || item.summary || "";
  const img = item.cover_image || item.image_url || item.image || "";
  const link = source === "news"
    ? `https://legalform.ci/actualites/${item.slug || item.id}`
    : `https://legalform.ci/opportunites/${item.slug || item.id}`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    ${img ? `<img src="${img}" alt="" style="width:100%;display:block"/>` : ""}
    <div style="padding:24px">
      <span style="display:inline-block;background:#0f766e;color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">${source === "news" ? "Actualité" : "Opportunité"}</span>
      <h2 style="color:#0f172a;margin:14px 0 10px;font-size:22px;line-height:1.3">${title}</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6">${summary}</p>
      <a href="${link}" style="display:inline-block;margin-top:18px;background:#0f766e;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Lire la suite →</a>
    </div>
  </div>`;
}

async function getRecipients(supabase: any, segment: string): Promise<{ email: string; name?: string | null }[]> {
  if (segment === "subscribers" || segment === "all") {
    const { data } = await supabase.from("newsletter_subscribers").select("email, full_name").eq("is_active", true);
    if (segment === "subscribers") return (data || []).map((d: any) => ({ email: d.email, name: d.full_name }));
    const { data: u } = await supabase.from("profiles").select("email, full_name");
    const map = new Map<string, any>();
    [...(data || []), ...(u || [])].forEach((r: any) => r.email && map.set(r.email.toLowerCase(), { email: r.email, name: r.full_name }));
    return [...map.values()];
  }
  if (segment === "users") {
    const { data } = await supabase.from("profiles").select("email, full_name");
    return (data || []).filter((d: any) => d.email).map((d: any) => ({ email: d.email, name: d.full_name }));
  }
  return [];
}

async function processAutomation(supabase: any, a: any, force = false) {
  if (!force && !shouldRun(a)) return { skipped: true, reason: "schedule" };
  const table = a.source_type === "news" ? "news" : "opportunities";
  let q = supabase.from(table).select("*").order("created_at", { ascending: false }).limit(1);
  const { data: items, error } = await q;
  if (error) return { error: `select ${table}: ${error.message}` };
  const item = items?.[0];
  if (!item) return { skipped: true, reason: "no_content" };
  if (!force && a.last_dispatched_id === item.id) return { skipped: true, reason: "already_sent" };

  const html = buildHtml(item, a.source_type);
  const subject = `[${a.source_type === "news" ? "Actualité" : "Opportunité"}] ${item.title || item.name || "Nouveauté"}`;

  // Test mode → send only to test email
  if (a.is_test_mode && a.test_email) {
    const r = await sendEmailWithFailover({ to: a.test_email, subject: `[TEST] ${subject}`, html });
    await supabase.from("newsletter_automations").update({ last_run_at: new Date().toISOString() }).eq("id", a.id);
    return { test: true, ok: r.ok, provider: r.provider };
  }

  const recipients = await getRecipients(supabase, a.segment);
  if (recipients.length === 0) return { skipped: true, reason: "no_recipients" };

  // Create campaign + logs
  const { data: campaign } = await supabase.from("newsletter_campaigns").insert({
    subject, html_content: html, status: "sending", recipients_count: recipients.length, created_by: a.created_by,
  }).select().single();

  let success = 0, failure = 0;
  for (const r of recipients) {
    const personalizedHtml = r.name ? html.replace(/Bonjour[^<,]*/i, `Bonjour ${r.name}`) : html;
    const res = await sendEmailWithFailover({ to: r.email, toName: r.name, subject, html: personalizedHtml });
    if (res.ok) success++; else failure++;
    await supabase.from("newsletter_send_logs").insert({
      campaign_id: campaign?.id,
      recipient_email: r.email,
      status: res.ok ? "success" : "failed",
      provider_message_id: res.id || null,
      error_message: res.ok ? `via:${res.provider}` : `via:${res.provider} | ${res.error}`,
      attempt: 1,
    });
  }

  await supabase.from("newsletter_campaigns").update({
    status: failure === 0 ? "sent" : (success > 0 ? "partial_failed" : "failed"),
    success_count: success, failure_count: failure, sent_at: new Date().toISOString(),
  }).eq("id", campaign?.id);

  await supabase.from("newsletter_automations").update({
    last_run_at: new Date().toISOString(), last_dispatched_id: item.id,
  }).eq("id", a.id);

  return { ok: true, total: recipients.length, success, failure, campaignId: campaign?.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  let body: any = {};
  try { body = await req.json(); } catch {}

  try {
    if (body.automationId) {
      const { data: a } = await supabase.from("newsletter_automations").select("*").eq("id", body.automationId).single();
      if (!a) throw new Error("Automation not found");
      const r = await processAutomation(supabase, a, !!body.force);
      return new Response(JSON.stringify({ ok: true, message: r.skipped ? `Ignoré: ${r.reason}` : `Envoi terminé`, result: r }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: list } = await supabase.from("newsletter_automations").select("*").eq("is_active", true);
    const results: any[] = [];
    for (const a of list || []) results.push({ id: a.id, ...(await processAutomation(supabase, a)) });
    return new Response(JSON.stringify({ ok: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
