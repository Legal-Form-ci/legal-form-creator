// Supabase Auth "Send Email" hook -> envoie via Resend depuis legalform.ci
// À configurer dans: Supabase Dashboard > Authentication > Hooks > Send Email Hook
// URL: https://xwtmnzorzsvkamqemddk.supabase.co/functions/v1/auth-email-hook
// Secret: SEND_EMAIL_HOOK_SECRET (format v1,whsec_...)

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const HOOK_SECRET = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '').replace('v1,whsec_', 'whsec_');
const FROM = 'Legal Form SARL <noreply@legalform.ci>';
const SITE = 'https://www.legalform.ci';

const SUBJECTS: Record<string, string> = {
  signup: 'Confirmez votre inscription - Legal Form SARL',
  magiclink: 'Votre lien de connexion - Legal Form SARL',
  recovery: 'Réinitialisation de votre mot de passe',
  invite: 'Vous êtes invité sur Legal Form SARL',
  email_change: 'Confirmez votre nouvelle adresse email',
  reauthentication: 'Code de réauthentification',
};

function buildHtml(action: string, link: string, token: string, name: string) {
  const cta: Record<string, string> = {
    signup: 'Confirmer mon email',
    magiclink: 'Se connecter',
    recovery: 'Réinitialiser mon mot de passe',
    invite: 'Accepter l’invitation',
    email_change: 'Confirmer le changement',
    reauthentication: 'Confirmer',
  };
  const intro: Record<string, string> = {
    signup: `Bonjour ${name}, bienvenue sur Legal Form SARL ! Confirmez votre adresse email pour activer votre compte.`,
    magiclink: `Bonjour ${name}, cliquez ci-dessous pour vous connecter en toute sécurité.`,
    recovery: `Bonjour ${name}, vous avez demandé la réinitialisation de votre mot de passe.`,
    invite: `Bonjour, vous avez été invité à rejoindre Legal Form SARL.`,
    email_change: `Bonjour ${name}, confirmez votre nouvelle adresse email.`,
    reauthentication: `Bonjour ${name}, votre code de confirmation est : <b>${token}</b>`,
  };
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Inter,Arial,sans-serif;color:#0f172a">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06)">
      <tr><td style="background:linear-gradient(135deg,#0d9488,#c9a84c);padding:24px;text-align:center;color:#fff">
        <h1 style="margin:0;font-size:22px">Legal Form SARL</h1>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="font-size:16px;line-height:1.5;margin:0 0 24px">${intro[action] ?? intro.signup}</p>
        <p style="text-align:center;margin:32px 0">
          <a href="${link}" style="background:#0d9488;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${cta[action] ?? 'Confirmer'}</a>
        </p>
        <p style="font-size:13px;color:#64748b;margin:24px 0 0">Si le bouton ne fonctionne pas, copiez ce lien :<br><a href="${link}" style="color:#0d9488;word-break:break-all">${link}</a></p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"/>
        <p style="font-size:12px;color:#94a3b8;margin:0">Ce message a été envoyé automatiquement par ${SITE}. Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let data: any;
  try {
    if (HOOK_SECRET) {
      const wh = new Webhook(HOOK_SECRET);
      data = wh.verify(payload, headers);
    } else {
      data = JSON.parse(payload);
    }
  } catch (e) {
    console.error('Signature invalide:', e);
    return new Response(JSON.stringify({ error: { http_code: 401, message: 'Invalid signature' } }), { status: 401 });
  }

  const { user, email_data } = data;
  const action = email_data.email_action_type as string;
  const link = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${action}&redirect_to=${encodeURIComponent(email_data.redirect_to || SITE)}`;
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'utilisateur';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [user.email],
        subject: SUBJECTS[action] || 'Notification - Legal Form SARL',
        html: buildHtml(action, link, email_data.token, name),
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: { http_code: 500, message: err } }), { status: 500 });
    }
  } catch (e) {
    console.error('Send error:', e);
    return new Response(JSON.stringify({ error: { http_code: 500, message: String(e) } }), { status: 500 });
  }

  return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
});
