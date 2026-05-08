import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawBody = await req.text();
    let body: any = {};
    try { body = JSON.parse(rawBody); } catch { console.error("[fedapay-webhook] Invalid JSON body:", rawBody); }
    console.log("[fedapay-webhook] received event:", JSON.stringify(body).slice(0, 1000));

    const event = body.event || body.name;
    const entity = body.entity || body.object || body.data;

    if (!entity) {
      console.warn("[fedapay-webhook] No entity in payload");
      return new Response(JSON.stringify({ error: "No entity" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const transactionId = String(entity.id || entity.transaction_id || "");
    const status = String(entity.status || "").toLowerCase();
    const reference = String(entity.reference || "");

    console.log(`[fedapay-webhook] event=${event} txId=${transactionId} status=${status} ref=${reference}`);

    if (!transactionId) {
      console.warn("[fedapay-webhook] Missing transaction id");
      return new Response(JSON.stringify({ error: "Missing transaction id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const isApproved = status === "approved" || status === "completed" || status === "paid" || event === "transaction.approved";
    const isFailed = status === "declined" || status === "cancelled" || status === "canceled" || status === "failed" || event === "transaction.declined" || event === "transaction.canceled";

    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (pErr) console.error("[fedapay-webhook] payment lookup error:", pErr);

    if (!payment) {
      console.warn(`[fedapay-webhook] No payment row for transaction_id=${transactionId} — webhook ignored`);
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (isApproved) {
      const { error: upPay } = await supabase
        .from("payments")
        .update({ status: "approved" })
        .eq("id", payment.id);
      if (upPay) console.error("[fedapay-webhook] payment update error:", upPay);

      const invoiceId = (payment.metadata as any)?.invoice_id;
      if (invoiceId) {
        const { error: upInv } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);
        if (upInv) console.error("[fedapay-webhook] invoice update error:", upInv);
        else console.log(`[fedapay-webhook] invoice ${invoiceId} marked paid`);
      }

      if (payment.request_id) {
        const table = payment.request_type === "service" ? "service_requests" : "company_requests";
        const { error: upReq } = await supabase
          .from(table)
          .update({
            payment_status: "approved",
            payment_reference: transactionId,
            payment_amount: payment.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.request_id);
        if (upReq) console.error(`[fedapay-webhook] ${table} update error:`, upReq);
        else console.log(`[fedapay-webhook] ${table} ${payment.request_id} marked approved`);
      }

      if (payment.user_id) {
        await supabase.from("notifications").insert({
          user_id: payment.user_id,
          title: "Paiement confirmé ✅",
          message: `Votre paiement de ${payment.amount} ${payment.currency || "XOF"} a été confirmé.`,
          type: "payment",
          link: "/client/dashboard",
        });
      }

      console.log(`[fedapay-webhook] SUCCESS payment=${payment.id}`);
    } else if (isFailed) {
      const { error: upFail } = await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      if (upFail) console.error("[fedapay-webhook] failure update error:", upFail);

      const invoiceId = (payment.metadata as any)?.invoice_id;
      if (invoiceId) {
        await supabase.from("invoices").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", invoiceId);
      }
      if (payment.user_id) {
        await supabase.from("notifications").insert({
          user_id: payment.user_id,
          title: "Paiement échoué",
          message: "Votre paiement n'a pas abouti. Vous pouvez réessayer depuis votre tableau de bord.",
          type: "payment",
          link: "/client/dashboard",
        });
      }
      console.log(`[fedapay-webhook] FAILED payment=${payment.id}`);
    } else {
      console.log(`[fedapay-webhook] status="${status}" not handled (waiting)`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

serve(handler);
