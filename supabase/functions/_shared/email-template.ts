// Shared branded HTML wrapper for all outgoing LegalForm emails
// Logo URL is configurable via EMAIL_LOGO_URL secret (recommended: a public Supabase storage URL).
// Fallback uses the Lovable published URL where /logo.png is served from public/.
// Official LegalForm logo hosted on the Lovable assets CDN (always reachable,
// independent of the published site). Override via EMAIL_LOGO_URL secret if needed.
const LOGO_URL =
  Deno.env.get("EMAIL_LOGO_URL") ||
  "https://doc-duplicator-wiz.lovable.app/__l5e/assets-v1/c2fc5c1a-c242-49dd-b63b-302dae0d2c9c/legalform-logo-email.png";
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
  <style>
    img { max-width: 100% !important; height: auto !important; display: block; border: 0; outline: none; text-decoration: none; }
    .email-body img { max-width: 100% !important; height: auto !important; margin-left: auto; margin-right: auto; border-radius: 10px; }
    .email-body table { max-width: 100% !important; }
    .email-body p, .email-body li { word-break: break-word; }
    /* Strict logo rule: always centered, never overflows on mobile or desktop */
    .email-logo-cell { text-align: center !important; padding: 24px 16px !important; }
    .email-logo { display: block !important; margin: 0 auto !important; max-width: 120px !important; width: 100% !important; height: auto !important; object-fit: contain !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .email-pad { padding: 20px !important; }
      .email-logo { max-width: 96px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;color:#f5f7fa">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fa;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:#0f766e;padding:24px 32px;text-align:center">
            <a href="${SITE}" style="text-decoration:none;display:inline-block">
              <img src="${LOGO_URL}" alt="LegalForm" width="120" height="120" style="display:block;margin:0 auto;width:120px;max-width:120px;height:auto;border:0;outline:none;background:#0f766e" />
            </a>
          </td>
        </tr>
        <tr>
          <td class="email-body email-pad" style="padding:32px">
            ${sanitizeBodyImages(bodyHtml)}
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

// Ensure all <img> tags in the email body are responsive and never overflow
// the 600px email container in any client (Gmail strips <style> blocks).
function sanitizeBodyImages(html: string): string {
  if (!html) return "";
  return html.replace(/<img\b([^>]*)>/gi, (_match, attrs) => {
    let a = String(attrs);
    // Remove any existing width / height attributes that could break responsiveness
    a = a.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    // Merge or inject inline style
    if (/\sstyle\s*=/.test(a)) {
      a = a.replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i, (_m, _q, dq, sq) => {
        const existing = (dq ?? sq ?? "").trim().replace(/;?\s*$/, "");
        const merged = `${existing}; max-width:100%; height:auto; display:block; margin:16px auto; border-radius:10px; border:0; outline:none;`;
        return ` style="${merged}"`;
      });
    } else {
      a += ` style="max-width:100%; height:auto; display:block; margin:16px auto; border-radius:10px; border:0; outline:none;"`;
    }
    return `<img${a}>`;
  });
}

