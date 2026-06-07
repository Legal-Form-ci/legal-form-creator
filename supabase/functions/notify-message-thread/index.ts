// Notifies the opposite party when a new message is posted in a request thread.
// - sender_role=client  -> notify all admins (in-app + email)
// - sender_role=admin   -> notify the request owner (in-app + email via send-notification)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { brandedEmail } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.legalform.ci";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { request_id, request_type, sender_role, message, sender_name } = await req.json();
    if (!request_id || !sender_role || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const table = request_type === "service" ? "service_requests" : "company_requests";
    const { data: reqRow } = await supabase
      .from(table)
      .select("user_id, tracking_number, contact_name, company_name, email, contact_email")
      .eq("id", request_id)
      .maybeSingle();

    if (!reqRow) return new Response(JSON.stringify({ error: "Request not found" }), { status: 404, headers: corsHeaders });

    const tracking = (reqRow as any).tracking_number || request_id.slice(0, 8);
    const preview = String(message).slice(0, 180);
    const link = `/client/dashboard`;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    async function sendMail(to: string, subject: string, html: string) {
      if (!resendKey || !to) return;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "LegalForm <contact@legalform.ci>",
          to: [to],
          subject,
          html,
        }),
      }).catch((e) => console.error("mail err", e));
    }

    if (sender_role === "admin" && reqRow.user_id) {
      // Notify client
      await supabase.from("notifications").insert({
        user_id: reqRow.user_id,
        title: `Nouveau message — dossier ${tracking}`,
        message: `LegalForm vous a répondu : « ${preview} »`,
        type: "info",
        link,
      });
      const email = (reqRow as any).email || (reqRow as any).contact_email;
      if (email) {
        const html = brandedEmail({
          bodyHtml: `<h2 style="color:#0f766e">Nouveau message de LegalForm</h2>
            <p>Bonjour,</p>
            <p>Vous avez reçu un nouveau message concernant votre dossier <strong>${tracking}</strong> :</p>
            <blockquote style="border-left:3px solid #0f766e;padding:12px 16px;background:#f0fdfa;margin:16px 0;border-radius:6px">${preview.replace(/\n/g, "<br>")}</blockquote>
            <p><a href="${SITE}${link}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Répondre dans mon espace</a></p>`,
          preheader: `Message LegalForm — dossier ${tracking}`,
        });
        await sendMail(email, `LegalForm — Nouveau message dossier ${tracking}`, html);
      }
    } else if (sender_role === "client") {
      // Notify admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminIds = (admins || []).map((a) => a.user_id);
      if (adminIds.length) {
        await supabase.from("notifications").insert(
          adminIds.map((uid) => ({
            user_id: uid,
            title: `Message client — dossier ${tracking}`,
            message: `${sender_name || "Un client"} : « ${preview} »`,
            type: "info",
            link: `/admin/messages`,
          }))
        );
        const { data: profs } = await supabase
          .from("profiles")
          .select("email")
          .in("user_id", adminIds);
        const adminEmails = (profs || []).map((p: any) => p.email).filter(Boolean);
        for (const em of adminEmails) {
          const html = brandedEmail({
            bodyHtml: `<h2 style="color:#0f766e">Nouveau message client</h2>
              <p>Dossier <strong>${tracking}</strong> — ${sender_name || "Client"}</p>
              <blockquote style="border-left:3px solid #0f766e;padding:12px 16px;background:#f0fdfa;margin:16px 0;border-radius:6px">${preview.replace(/\n/g, "<br>")}</blockquote>
              <p><a href="${SITE}/admin/messages" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Ouvrir la messagerie</a></p>`,
            preheader: `Message client — dossier ${tracking}`,
          });
          await sendMail(em, `LegalForm Admin — Message dossier ${tracking}`, html);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
