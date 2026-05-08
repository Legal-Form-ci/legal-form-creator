// Send a newsletter campaign to all active subscribers via Resend Connector Gateway
// - Logs every recipient attempt in newsletter_send_logs
// - Skips already-successful recipients on retry (resilient)
// - Resets stuck "sending" campaigns
// - FROM email configurable via NEWSLETTER_FROM secret (fallback legalform.ci)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const DEFAULT_FROM = Deno.env.get("NEWSLETTER_FROM") || "Legal Form <newsletter@legalform.ci>";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
    const isServiceCaller = authHeader === `Bearer ${serviceKey}`;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") || Deno.env.get("RESEND_API_KEY");

    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);
    if (!RESEND_API_KEY) return json({ error: "Resend connector not linked (RESEND_API_KEY_1 missing)" }, 500);

    const supabase = createClient(supabaseUrl, serviceKey);

    let body: any = {};
    try { body = await req.json(); } catch (_) { body = {}; }
    const { campaignId, testEmail, mode } = body;
    const simulate = body?.simulate === true;
    if (simulate && !isServiceCaller) return json({ error: "Simulation réservée aux tests serveur" }, 403);

    if (mode === "cron") {
      // 1) Recover stuck campaigns
      await supabase.rpc("reset_stuck_newsletter_campaigns");
      // 2) Pick due scheduled campaigns
      let dueQuery = supabase
        .from("newsletter_campaigns")
        .select("id")
        .eq("status", "scheduled")
        .lte("scheduled_at", new Date().toISOString());
      if (campaignId) {
        if (!isServiceCaller) return json({ error: "campaignId cron réservé aux tests serveur" }, 403);
        dueQuery = dueQuery.eq("id", campaignId);
      }
      const { data: due } = await dueQuery;

      const results: any[] = [];
      for (const c of due || []) {
        const r = await sendCampaign(supabase, RESEND_API_KEY, LOVABLE_API_KEY, c.id, undefined, { simulate });
        results.push({ id: c.id, ...r });
      }
      return json({ processed: results.length, results });
    }

    if (!campaignId) return json({ error: "campaignId required" }, 400);

    const result = await sendCampaign(supabase, RESEND_API_KEY, LOVABLE_API_KEY, campaignId, testEmail);
    return json(result);
  } catch (e: any) {
    console.error("send-newsletter-campaign error:", e);
    return json({ error: e.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendCampaign(
  supabase: any,
  RESEND_API_KEY: string,
  LOVABLE_API_KEY: string,
  campaignId: string,
  testEmail?: string,
  options: { simulate?: boolean } = {},
) {
  const { data: campaign, error: campErr } = await supabase
    .from("newsletter_campaigns").select("*").eq("id", campaignId).maybeSingle();

  if (campErr || !campaign) return { error: "Campaign not found", success: 0, failure: 0, total: 0 };

  // Mark as sending (only if not already in-flight to avoid double-send)
  if (!testEmail) {
    if (campaign.status === "sent") {
      return { skipped: true, reason: "already sent", success: 0, failure: 0, total: 0 };
    }
    if (campaign.status === "partial_failed") {
      return { skipped: true, reason: "partial_failed requires manual review", success: 0, failure: 0, total: 0 };
    }
    await supabase.from("newsletter_campaigns")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", campaignId);
  }

  // Fetch recipients
  let recipients: { email: string; full_name: string | null }[] = [];
  if (testEmail) {
    recipients = [{ email: testEmail, full_name: null }];
  } else {
    const { data: subs } = await supabase
      .from("newsletter_subscribers").select("email, full_name").eq("is_active", true);
    recipients = subs || [];
  }

  // Skip recipients already successfully sent for THIS campaign (retry-safety)
  let alreadySent = new Set<string>();
  if (!testEmail) {
    const { data: prior } = await supabase
      .from("newsletter_send_logs")
      .select("recipient_email")
      .eq("campaign_id", campaignId)
      .eq("status", "success");
    alreadySent = new Set((prior || []).map((p: any) => p.recipient_email.toLowerCase()));
  }

  let success = 0, failure = 0, skipped = 0;

  for (const r of recipients) {
    if (!testEmail && alreadySent.has(r.email.toLowerCase())) {
      skipped++;
      await supabase.from("newsletter_send_logs").insert({
        campaign_id: campaignId, recipient_email: r.email, status: "skipped",
        error_message: "Already sent in previous attempt",
      });
      continue;
    }

    const unsub = `https://www.legalform.ci/newsletter/unsubscribe?email=${encodeURIComponent(r.email)}`;
    const html = `${campaign.html_content}
<hr style="margin:32px 0;border:none;border-top:1px solid #eee" />
<p style="font-size:12px;color:#888;text-align:center">
  Vous recevez cet email car vous êtes inscrit à la newsletter Legal Form.<br/>
  <a href="${unsub}" style="color:#888">Se désabonner</a>
</p>`;

    let providerId: string | null = null;
    let errMsg: string | null = null;
    let ok = false;

    try {
      if (options.simulate) {
        ok = true;
        providerId = `simulated-${crypto.randomUUID()}`;
      } else {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 15000);
        const res = await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: DEFAULT_FROM, to: [r.email], subject: campaign.subject, html }),
        });
        clearTimeout(timeout);
        const text = await res.text();
        if (res.ok) {
          ok = true;
          try { providerId = JSON.parse(text)?.id || null; } catch (_) {}
        } else {
          errMsg = `HTTP ${res.status}: ${text.slice(0, 500)}`;
        }
      }
    } catch (e: any) {
      errMsg = e?.name === "AbortError" ? "Timeout (15s)" : (e?.message || "Unknown error");
    }

    if (ok) success++; else failure++;

    if (!testEmail) {
      await supabase.from("newsletter_send_logs").insert({
        campaign_id: campaignId,
        recipient_email: r.email,
        status: ok ? "success" : "failed",
        provider_message_id: providerId,
        error_message: errMsg,
      });
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!testEmail) {
    // Aggregate definitive counts from logs (handles partial retries)
    const { count: successTotal } = await supabase
      .from("newsletter_send_logs")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId).eq("status", "success");
    const { count: failureTotal } = await supabase
      .from("newsletter_send_logs")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId).eq("status", "failed");

    const finalStatus = (successTotal || 0) > 0 && (failureTotal || 0) === 0 ? "sent" :
      (successTotal || 0) > 0 ? "partial_failed" : "failed";
    await supabase.from("newsletter_campaigns").update({
      status: finalStatus,
      sent_at: new Date().toISOString(),
      recipients_count: recipients.length,
      success_count: successTotal || 0,
      failure_count: failureTotal || 0,
      updated_at: new Date().toISOString(),
    }).eq("id", campaignId);
  }

  return { success, failure, skipped, total: recipients.length, test: !!testEmail, simulated: !!options.simulate };
}
