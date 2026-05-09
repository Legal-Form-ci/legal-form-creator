// Webhook public Resend -> trace les events (delivered, bounced, complained, opened, clicked)
// Configurer dans Resend Dashboard > Webhooks
// URL: https://xwtmnzorzsvkamqemddk.supabase.co/functions/v1/resend-webhook
// Secret: RESEND_WEBHOOK_SECRET (whsec_...)

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? '';
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.text();
  const headers = Object.fromEntries(req.headers);

  let event: any;
  try {
    const wh = new Webhook(SECRET);
    event = wh.verify(body, headers);
  } catch (e) {
    console.error('Signature Resend invalide:', e);
    return new Response('Invalid signature', { status: 401 });
  }

  console.log('Resend event:', event.type, event.data?.email_id);

  // Traçage best-effort dans newsletter_send_logs si l'email_id matche
  try {
    const emailId = event.data?.email_id;
    const to = Array.isArray(event.data?.to) ? event.data.to[0] : event.data?.to;
    if (emailId && to) {
      await supabase.from('newsletter_send_logs').insert({
        recipient_email: to,
        status: event.type.replace('email.', ''),
        error_message: event.type,
        attempt: 0,
      });
    }
  } catch (e) {
    console.warn('Log skip:', e);
  }

  return new Response('ok');
});
