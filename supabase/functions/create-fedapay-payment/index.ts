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
    const fedapayKey = Deno.env.get("FEDAPAY_SECRET_KEY");

    if (!fedapayKey) {
      return new Response(
        JSON.stringify({ error: "FedaPay non configuré. Contactez l'administrateur." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "invoiceId requis" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch invoice
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single();

    if (invError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Facture introuvable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (invoice.status === "paid") {
      return new Response(
        JSON.stringify({ error: "Cette facture est déjà payée" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get user profile for customer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("user_id", user.id)
      .single();

    const customerName = profile?.full_name || user.email?.split("@")[0] || "Client";
    const customerEmail = profile?.email || user.email || "";
    const customerPhone = profile?.phone || "";

    // Determine FedaPay environment
    const isSandbox = fedapayKey.startsWith("sk_sandbox_");
    const baseUrl = isSandbox
      ? "https://sandbox-api.fedapay.com"
      : "https://api.fedapay.com";

    const callbackUrl = "https://www.legalform.ci/payment/callback";

    // Create FedaPay transaction
    const fedaRes = await fetch(`${baseUrl}/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fedapayKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: invoice.description || `Facture ${invoice.invoice_number}`,
        amount: Math.round(invoice.amount),
        currency: { iso: invoice.currency || "XOF" },
        callback_url: `${callbackUrl}?invoice_id=${invoiceId}&status=success`,
        customer: {
          firstname: customerName.split(" ")[0],
          lastname: customerName.split(" ").slice(1).join(" ") || customerName,
          email: customerEmail,
          phone_number: { number: customerPhone, country: "CI" },
        },
      }),
    });

    const fedaData = await fedaRes.json();
    console.log("FedaPay response:", JSON.stringify(fedaData));

    if (!fedaRes.ok) {
      console.error("FedaPay error:", fedaData);
      return new Response(
        JSON.stringify({ error: "Erreur FedaPay", details: fedaData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const transactionId = fedaData.v1?.transaction?.id;

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "Transaction non créée", details: fedaData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Generate payment token/URL
    const tokenRes = await fetch(`${baseUrl}/v1/transactions/${transactionId}/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fedapayKey}`,
        "Content-Type": "application/json",
      },
    });

    const tokenData = await tokenRes.json();
    console.log("FedaPay token response:", JSON.stringify(tokenData));

    const paymentUrl = tokenData.token
      ? `https://${isSandbox ? "sandbox-" : ""}process.fedapay.com/${tokenData.token}`
      : null;

    // Update invoice with transaction ID
    await supabase
      .from("invoices")
      .update({
        payment_transaction_id: String(transactionId),
        payment_provider: "fedapay",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    // Create payment record
    await supabase.from("payments").insert({
      user_id: user.id,
      request_id: invoice.request_id,
      request_type: invoice.request_type || "company",
      amount: invoice.amount,
      currency: invoice.currency || "XOF",
      status: "pending",
      provider: "fedapay",
      transaction_id: String(transactionId),
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        fedapay_transaction_id: transactionId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        transactionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("create-fedapay-payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
