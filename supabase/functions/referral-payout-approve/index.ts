import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Vérif role : admin ou team_finance
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    const ok = (roles || []).some((r: any) => ["admin", "team_finance"].includes(r.role));
    if (!ok) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { withdrawal_id, action, admin_notes } = await req.json();
    if (!withdrawal_id || !["approve", "reject", "mark_paid"].includes(action)) {
      return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: wd, error: wdErr } = await admin.from("referral_withdrawals").select("*").eq("id", withdrawal_id).single();
    if (wdErr || !wd) {
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const statusMap: Record<string, string> = { approve: "approved", reject: "rejected", mark_paid: "paid" };
    const newStatus = statusMap[action];

    const updates: Record<string, unknown> = {
      status: newStatus,
      processed_at: new Date().toISOString(),
      processed_by: userData.user.id,
    };
    if (admin_notes) updates.admin_notes = admin_notes;

    await admin.from("referral_withdrawals").update(updates).eq("id", withdrawal_id);

    // Si payé : débiter le solde du parrain + log event
    if (action === "mark_paid") {
      const { data: profile } = await admin.from("profiles").select("referral_balance, referral_earnings").eq("user_id", wd.user_id).single();
      const newBalance = Math.max(0, Number(profile?.referral_balance || 0) - Number(wd.amount));
      await admin.from("profiles").update({ referral_balance: newBalance }).eq("user_id", wd.user_id);
      await admin.from("referral_events").insert({
        referrer_id: wd.user_id,
        referred_id: wd.user_id,
        event_type: "payout",
        amount: wd.amount,
        metadata: { withdrawal_id, payment_method: wd.payment_method },
      });
    }

    // Notification in-app + email best-effort
    try {
      const messages: Record<string, { title: string; msg: string }> = {
        approve: { title: "Retrait parrainage approuvé", msg: `Votre demande de retrait de ${wd.amount} FCFA a été approuvée et sera traitée sous 48h.` },
        reject: { title: "Retrait parrainage refusé", msg: `Votre demande de retrait a été refusée. ${admin_notes || ""}` },
        mark_paid: { title: "Retrait parrainage payé", msg: `Votre retrait de ${wd.amount} FCFA a été versé via ${wd.payment_method}.` },
      };
      const m = messages[action];
      await admin.from("notifications").insert({
        user_id: wd.user_id,
        type: "referral_withdrawal",
        title: m.title,
        message: m.msg,
        link: "/client/dashboard",
      });
    } catch (e) {
      console.error("notify err", e);
    }

    return new Response(JSON.stringify({ ok: true, status: newStatus }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
