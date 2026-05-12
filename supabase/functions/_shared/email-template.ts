// Shared branded HTML wrapper for all outgoing LegalForm emails
// Logo URL is configurable via EMAIL_LOGO_URL secret (recommended: a public Supabase storage URL).
// Fallback uses the Lovable published URL where /logo.png is served from public/.
const LOGO_URL =
  Deno.env.get("EMAIL_LOGO_URL") ||
  "https://doc-duplicator-wiz.lovable.app/logo.png";
const SITE = Deno.env.get("EMAIL_SITE_URL") || "https://www.legalform.ci";

export function brandedEmail(opts: {
  bodyHtml: string;
  unsubscribeUrl?: string;
  preheader?: string;
}) {
  const { bodyHtml, unsubscribeUrl, preheader = "" } = opts;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LegalForm</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;color:#f5f7fa">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fa;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:linear-gradient(135deg,#0f766e 0%,#0d9488 100%);padding:28px 32px;text-align:center">
            <a href="${SITE}" style="text-decoration:none;color:#ffffff">
              <img src="${LOGO_URL}" alt="LegalForm" width="140" style="display:inline-block;max-width:140px;height:auto;border:0;outline:none" />
              <div style="margin-top:8px;font-family:Inter,Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px">Legal Form</div>
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="background:#0f172a;color:#cbd5e1;padding:24px 32px;text-align:center;font-size:12px;line-height:1.6">
            <p style="margin:0 0 8px;color:#fff;font-weight:600">LegalForm — Création d'entreprise en Côte d'Ivoire</p>
            <p style="margin:0 0 12px">
              <a href="${SITE}" style="color:#5eead4;text-decoration:none">www.legalform.ci</a> ·
              <a href="${SITE}/contact" style="color:#5eead4;text-decoration:none">Contact</a> ·
              <a href="${SITE}/services" style="color:#5eead4;text-decoration:none">Services</a>
            </p>
            ${unsubscribeUrl ? `<p style="margin:0;color:#94a3b8">Vous recevez cet email car vous êtes inscrit à nos communications. <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline">Se désabonner</a></p>` : ""}
            <p style="margin:8px 0 0;color:#64748b">© ${new Date().getFullYear()} LegalForm. Tous droits réservés.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
