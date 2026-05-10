// Multi-provider email sender with automatic failover.
// Order: Brevo (primary, 300/day) -> Resend (fallback, 100/day).
// Returns { ok, provider, id?, error? }.

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const RESEND_URL = "https://api.resend.com/emails";

const FROM_EMAIL = Deno.env.get("NEWSLETTER_FROM_EMAIL") || "newsletter@legalform.ci";
const FROM_NAME = Deno.env.get("NEWSLETTER_FROM_NAME") || "LegalForm";
const REPLY_TO = Deno.env.get("NEWSLETTER_REPLY_TO") || "contact@legalform.ci";

export type SendInput = {
  to: string;
  toName?: string | null;
  subject: string;
  html: string;
  preferredProvider?: "brevo" | "resend";
};

export type SendResult = {
  ok: boolean;
  provider: "brevo" | "resend" | "none";
  id?: string | null;
  error?: string;
  attempts: { provider: string; ok: boolean; error?: string }[];
};

async function sendViaBrevo(input: SendInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY missing" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(BREVO_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: input.to, name: input.toName || undefined }],
        replyTo: { email: REPLY_TO, name: FROM_NAME },
        subject: input.subject,
        htmlContent: input.html,
        headers: { "X-Mailer": "LegalForm" },
      }),
    });
    clearTimeout(t);
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `Brevo ${res.status}: ${text.slice(0, 300)}` };
    try {
      const j = JSON.parse(text);
      return { ok: true, id: j?.messageId || null };
    } catch {
      return { ok: true };
    }
  } catch (e: any) {
    return { ok: false, error: `Brevo ${e?.name || ""}: ${e?.message || "network"}` };
  }
}

async function sendViaResend(input: SendInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey =
    Deno.env.get("RESEND_API_KEY") ||
    Deno.env.get("Resend_LegalForm_domaine_API") ||
    Deno.env.get("RESEND_API_KEY_1");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(RESEND_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [input.to],
        reply_to: REPLY_TO,
        subject: input.subject,
        html: input.html,
      }),
    });
    clearTimeout(t);
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 300)}` };
    try {
      const j = JSON.parse(text);
      return { ok: true, id: j?.id || null };
    } catch {
      return { ok: true };
    }
  } catch (e: any) {
    return { ok: false, error: `Resend ${e?.name || ""}: ${e?.message || "network"}` };
  }
}

export async function sendEmailWithFailover(input: SendInput): Promise<SendResult> {
  const order: ("brevo" | "resend")[] =
    input.preferredProvider === "resend" ? ["resend", "brevo"] : ["brevo", "resend"];

  const attempts: { provider: string; ok: boolean; error?: string }[] = [];
  for (const provider of order) {
    const r = provider === "brevo" ? await sendViaBrevo(input) : await sendViaResend(input);
    attempts.push({ provider, ok: r.ok, error: r.error });
    if (r.ok) {
      return { ok: true, provider, id: r.id || null, attempts };
    }
  }
  return {
    ok: false,
    provider: "none",
    error: attempts.map((a) => `${a.provider}: ${a.error}`).join(" | "),
    attempts,
  };
}
