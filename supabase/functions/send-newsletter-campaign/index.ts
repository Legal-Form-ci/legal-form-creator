// Send a newsletter campaign to all active subscribers via Resend Connector Gateway
// - Logs every recipient attempt in newsletter_send_logs
// - Skips already-successful recipients on retry (resilient)
// - Resets stuck "sending" campaigns
// - FROM email configurable via NEWSLETTER_FROM secret (fallback legalform.ci)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { brandedEmail } from "../_shared/email-template.ts";
import { sendEmailWithFailover } from "../_shared/email-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
    const isServiceCaller = authHeader === `Bearer ${serviceKey}`;

    const supabase = createClient(supabaseUrl, serviceKey);

    let body: any = {};
    try { body = await req.json(); } catch (_) { body = {}; }
    const { campaignId, testEmail, mode, segment, preferredProvider } = body;
    const simulate = body?.simulate === true;
    if (simulate && !isServiceCaller) return json({ error: "Simulation réservée aux tests serveur" }, 403);

    if (mode === "cron") {
      await supabase.rpc("reset_stuck_newsletter_campaigns");
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
        const r = await sendCampaign(supabase, c.id, undefined, { simulate, preferredProvider });
        results.push({ id: c.id, ...r });
      }
      return json({ processed: results.length, results });
    }

    if (!campaignId) return json({ error: "campaignId required" }, 400);

    const result = await sendCampaign(supabase, campaignId, testEmail, { segment, preferredProvider });
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
  campaignId: string,
  testEmail?: string,
  options: { simulate?: boolean; segment?: string; preferredProvider?: "brevo" | "resend" } = {},
) {
  const { data: campaign, error: campErr } = await supabase
    .from("newsletter_campaigns").select("*").eq("id", campaignId).maybeSingle();

  if (campErr || !campaign) return { error: "Campaign not found", success: 0, failure: 0, total: 0 };

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

  let recipients: { email: string; full_name: string | null }[] = [];
  if (testEmail) {
    recipients = [{ email: testEmail, full_name: null }];
  } else {
    const segment = options.segment || "subscribers";
    recipients = await resolveSegment(supabase, segment);
  }

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
    const greeting = r.full_name
      ? `<p style="font-size:15px;color:#1f2937;margin:0 0 12px">Bonjour ${escapeHtml(r.full_name)},</p>`
      : "";
    const html = brandedEmail({
      bodyHtml: greeting + campaign.html_content,
      unsubscribeUrl: unsub,
      preheader: campaign.subject,
    });

    let providerId: string | null = null;
    let errMsg: string | null = null;
    let ok = false;
    let usedProvider = "simulated";

    if (options.simulate) {
      ok = true;
      providerId = `simulated-${crypto.randomUUID()}`;
    } else {
      const result = await sendEmailWithFailover({
        to: r.email,
        toName: r.full_name,
        subject: campaign.subject,
        html,
        preferredProvider: options.preferredProvider,
      });
      ok = result.ok;
      providerId = result.id || null;
      usedProvider = result.provider;
      if (!ok) errMsg = result.error || "send failed";
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

// Resolve recipient list by named segment.
// Returns deduplicated [{email, full_name}] from the requested audience.
async function resolveSegment(supabase: any, segment: string): Promise<{ email: string; full_name: string | null }[]> {
  const map = new Map<string, { email: string; full_name: string | null }>();
  const add = (email?: string | null, full_name?: string | null) => {
    if (!email) return;
    const e = email.toLowerCase().trim();
    if (!e.includes("@")) return;
    if (!map.has(e)) map.set(e, { email: e, full_name: full_name || null });
  };

  const wantSubs = ["subscribers", "all"].includes(segment);
  const wantRequesters = ["requesters", "all"].includes(segment);
  const wantInternal = ["internal", "all"].includes(segment);
  const wantUsers = ["users", "all"].includes(segment);

  if (wantSubs) {
    const { data } = await supabase
      .from("newsletter_subscribers").select("email, full_name").eq("is_active", true);
    (data || []).forEach((r: any) => add(r.email, r.full_name));
  }
  if (wantRequesters) {
    const { data: cr } = await supabase
      .from("company_requests").select("email, contact_name");
    (cr || []).forEach((r: any) => add(r.email, r.contact_name));
    const { data: sr } = await supabase
      .from("service_requests").select("contact_email, contact_name");
    (sr || []).forEach((r: any) => add(r.contact_email, r.contact_name));
  }
  if (wantInternal) {
    const { data } = await supabase
      .from("team_members").select("email, full_name").eq("is_active", true);
    (data || []).forEach((r: any) => add(r.email, r.full_name));
  }
  if (wantUsers) {
    const { data } = await supabase
      .from("profiles").select("email, full_name");
    (data || []).forEach((r: any) => add(r.email, r.full_name));
  }
  return Array.from(map.values());
}
