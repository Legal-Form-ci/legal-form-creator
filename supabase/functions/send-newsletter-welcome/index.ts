// Send a branded welcome email when someone subscribes to the newsletter
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { brandedEmail } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = Deno.env.get("NEWSLETTER_FROM") || "LegalForm <newsletter@legalform.ci>";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, fullName } = await req.json();
    if (!email) return json({ error: "email required" }, 400);

    const RESEND_API_KEY =
      Deno.env.get("RESEND_API_KEY") ||
      Deno.env.get("Resend_LegalForm_domaine_API") ||
      Deno.env.get("RESEND_API_KEY_1");
    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY missing" }, 500);

    const unsub = `https://www.legalform.ci/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
    const greeting = fullName ? `Bonjour ${escapeHtml(fullName)} 👋` : "Bienvenue chez LegalForm 👋";
    const body = `
      <h2 style="color:#0f766e;margin:0 0 16px;font-size:24px">${greeting}</h2>
      <p style="font-size:16px;line-height:1.6;color:#1f2937;margin:0 0 16px">
        Merci de rejoindre la communauté <strong>LegalForm</strong>, la plateforme N°1 pour
        créer et gérer votre entreprise en Côte d'Ivoire.
      </p>
      <p style="font-size:15px;line-height:1.6;color:#1f2937;margin:0 0 16px">
        Vous recevrez désormais nos meilleurs guides, actualités juridiques et offres exclusives :
      </p>
      <ul style="font-size:15px;line-height:1.8;color:#1f2937;padding-left:20px;margin:0 0 24px">
        <li>📚 Conseils pour créer SARL, SAS, SARLU, EI…</li>
        <li>⚖️ Veille juridique et fiscale OHADA</li>
        <li>🚀 Études de cas et témoignages d'entrepreneurs</li>
        <li>🎁 Offres réservées aux abonnés</li>
      </ul>
      <p style="text-align:center;margin:32px 0">
        <a href="https://www.legalform.ci/services" style="background:#0f766e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;font-size:15px">Découvrir nos services</a>
      </p>
      <p style="font-size:13px;color:#6b7280;margin:24px 0 0;text-align:center">
        Une question ? Répondez simplement à cet email, notre équipe vous répond rapidement.
      </p>`;

    const html = brandedEmail({
      bodyHtml: body,
      unsubscribeUrl: unsub,
      preheader: "Bienvenue chez LegalForm — vos guides et actus juridiques arrivent !",
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "Bienvenue chez LegalForm 🎉",
        html,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("Resend welcome failed:", res.status, text);
      return json({ error: `Resend ${res.status}: ${text.slice(0, 300)}` }, 500);
    }
    return json({ ok: true, id: safeJson(text)?.id });
  } catch (e: any) {
    console.error("send-newsletter-welcome error:", e);
    return json({ error: e.message }, 500);
  }
});

function json(d: any, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function safeJson(s: string) { try { return JSON.parse(s); } catch { return null; } }
function escapeHtml(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
