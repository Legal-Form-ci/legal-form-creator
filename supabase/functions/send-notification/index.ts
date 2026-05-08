import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface NotificationRequest {
  userId?: string;
  requestId?: string;
  type: 'signup' | 'login' | 'password_reset' | 'status_change' | 'new_request' | 'payment_received' | 'announcement' | 'security' | 'opportunity' | 'email_confirmation' | 'document_validated' | 'document_rejected';
  newStatus?: string;
  customMessage?: string;
  link?: string;
}

const SITE_URL = 'https://legalform.ci';
const SITE_NAME = 'Legal Form SARL';
const PREFIX = 'Message généré automatiquement, ne pas répondre.';

function generateNotification(type: string, userName: string, opts: { newStatus?: string; customMessage?: string; requestId?: string }) {
  let title = '';
  let message = '';
  let link = '';

  switch (type) {
    case 'signup':
      title = `Bienvenue sur ${SITE_NAME}`;
      message = `${PREFIX}\nBonjour ${userName}, votre inscription a été enregistrée avec succès. Bienvenue sur ${SITE_NAME} ! Accédez à votre espace client pour suivre vos dossiers.`;
      link = '/client/dashboard';
      break;
    case 'email_confirmation':
      title = 'Confirmez votre adresse email';
      message = `${PREFIX}\nBonjour ${userName}, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous pour activer votre compte.`;
      link = '/client/dashboard';
      break;
    case 'login':
      title = 'Connexion détectée';
      message = `${PREFIX}\nBonjour ${userName}, une connexion a été détectée sur votre compte le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}. Si ce n'était pas vous, sécurisez votre compte immédiatement.`;
      link = '/client/dashboard';
      break;
    case 'password_reset':
      title = 'Réinitialisation du mot de passe';
      message = `${PREFIX}\nBonjour ${userName}, vous avez demandé la réinitialisation de votre mot de passe. Cliquez ci-dessous pour définir un nouveau mot de passe.`;
      link = '/reset-password';
      break;
    case 'status_change': {
      const statusLabels: Record<string, string> = {
        'pending': 'En attente',
        'en_cours': 'En cours de traitement',
        'documents_requis': 'Documents requis',
        'en_attente_paiement': 'En attente de paiement',
        'complete': 'Terminée',
        'rejected': 'Rejetée',
      };
      const statusLabel = statusLabels[opts.newStatus || ''] || opts.newStatus || 'mis à jour';
      title = 'Mise à jour de votre dossier';
      message = `${PREFIX}\nBonjour ${userName}, le statut de votre dossier a été mis à jour : ${statusLabel}. Consultez votre espace client pour plus de détails.`;
      link = '/client/dashboard';
      break;
    }
    case 'new_request':
      title = 'Nouvelle demande reçue';
      message = `${PREFIX}\nBonjour ${userName}, votre demande de création d'entreprise a été reçue et est en cours d'examen. Vous recevrez une notification à chaque mise à jour.`;
      link = '/client/dashboard';
      break;
    case 'payment_received':
      title = 'Paiement reçu';
      message = `${PREFIX}\nBonjour ${userName}, votre paiement a été reçu avec succès. Votre dossier sera traité dans les meilleurs délais. Merci pour votre confiance !`;
      link = '/client/dashboard';
      break;
    case 'document_validated':
      title = 'Document validé';
      message = `${PREFIX}\nBonjour ${userName}, votre document d'identité a été validé avec succès. Votre dossier peut maintenant être traité.`;
      link = '/client/dashboard';
      break;
    case 'document_rejected':
      title = 'Document refusé';
      message = `${PREFIX}\nBonjour ${userName}, votre document d'identité a été refusé. Veuillez soumettre un nouveau document conforme depuis votre espace client.`;
      link = '/client/dashboard';
      break;
    case 'announcement':
      title = opts.customMessage ? 'Annonce importante' : 'Information';
      message = `${PREFIX}\n${opts.customMessage || 'Une nouvelle annonce est disponible sur votre espace.'}`;
      link = '/actualites';
      break;
    case 'security':
      title = 'Alerte de sécurité';
      message = `${PREFIX}\nBonjour ${userName}, une activité inhabituelle a été détectée sur votre compte. Veuillez vérifier vos accès et modifier votre mot de passe si nécessaire.`;
      link = '/forgot-password';
      break;
    case 'opportunity':
      title = 'Nouvelle opportunité';
      message = `${PREFIX}\nBonjour ${userName}, ${opts.customMessage || 'une nouvelle opportunité est disponible. Connectez-vous pour en savoir plus.'}`;
      link = '/services';
      break;
    default:
      title = 'Notification';
      message = `${PREFIX}\n${opts.customMessage || 'Vous avez une nouvelle notification.'}`;
      link = '/client/dashboard';
  }

  return { title, message, link };
}

function getEmailCta(type: string): string {
  switch (type) {
    case 'signup':
    case 'email_confirmation':
      return 'Accéder à mon espace';
    case 'password_reset':
      return 'Réinitialiser mon mot de passe';
    case 'login':
    case 'security':
      return 'Vérifier mon compte';
    case 'status_change':
    case 'new_request':
      return 'Voir mon dossier';
    case 'payment_received':
      return 'Voir mon paiement';
    case 'document_validated':
    case 'document_rejected':
      return 'Voir mes documents';
    case 'announcement':
      return 'Lire l\'annonce';
    case 'opportunity':
      return 'Découvrir l\'opportunité';
    default:
      return 'Accéder à mon espace';
  }
}

function buildEmailHtml(title: string, message: string, link: string, type: string) {
  const fullLink = link ? `${SITE_URL}${link}` : SITE_URL;
  const ctaText = getEmailCta(type);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#17a2b8,#0d7a8c);padding:35px 40px;text-align:center;">
    <img src="${SITE_URL}/images/agricapital-logo.jpg" alt="Legal Form SARL" width="64" height="64" style="border-radius:50%;margin-bottom:12px;border:3px solid rgba(255,255,255,0.3);">
    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:0.5px;">${SITE_NAME}</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Votre partenaire pour la création d'entreprise en Côte d'Ivoire</p>
  </td></tr>
  <!-- Content -->
  <tr><td style="padding:40px 40px 30px;">
    <h2 style="color:#1a1a1a;font-size:21px;margin:0 0 22px;border-bottom:3px solid #17a2b8;padding-bottom:14px;font-weight:600;">${title}</h2>
    <div style="color:#444444;font-size:15px;line-height:1.8;">${message.replace(/\n/g, '<br>')}</div>
    <div style="text-align:center;margin:35px 0 10px;">
      <a href="${fullLink}" style="display:inline-block;background:linear-gradient(135deg,#17a2b8,#0d7a8c);color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(23,162,184,0.3);">${ctaText}</a>
    </div>
  </td></tr>
  <!-- Security Notice -->
  <tr><td style="padding:0 40px 25px;">
    <div style="background:#f8f9fa;border-radius:8px;padding:15px 20px;border-left:4px solid #17a2b8;">
      <p style="color:#666;font-size:12px;margin:0;line-height:1.6;">
        🔒 Ce message provient de <strong>${SITE_NAME}</strong>. Si vous n'avez pas effectué cette action, ignorez cet email ou contactez-nous à <a href="mailto:contact@legalform.ci" style="color:#17a2b8;">contact@legalform.ci</a>.
      </p>
    </div>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#1a1a2e;padding:30px 40px;">
    <p style="color:#ccc;font-size:13px;margin:0;text-align:center;line-height:1.7;">
      © ${new Date().getFullYear()} <strong style="color:#17a2b8;">${SITE_NAME}</strong> — Tous droits réservés<br>
      <a href="${SITE_URL}" style="color:#17a2b8;text-decoration:none;">legalform.ci</a> &nbsp;|&nbsp;
      <a href="${SITE_URL}/contact" style="color:#17a2b8;text-decoration:none;">Contact</a> &nbsp;|&nbsp;
      <a href="${SITE_URL}/confidentialite" style="color:#17a2b8;text-decoration:none;">Confidentialité</a> &nbsp;|&nbsp;
      <a href="${SITE_URL}/conditions" style="color:#17a2b8;text-decoration:none;">CGU</a>
    </p>
    <p style="color:#777;font-size:11px;text-align:center;margin:12px 0 0;">
      Cet email a été envoyé automatiquement par ${SITE_NAME}. Merci de ne pas répondre à ce message.<br>
      Développé par <a href="https://wa.me/2250759566087" style="color:#17a2b8;text-decoration:none;">Inocent KOFFI</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: NotificationRequest = await req.json()
    const { userId, requestId, type, newStatus, customMessage, link } = body

    let targetUserId = userId
    let userName = ''
    let userEmail = ''

    if (requestId && !targetUserId) {
      const { data: request } = await supabase
        .from('company_requests')
        .select('user_id, contact_name, email')
        .eq('id', requestId)
        .single()
      
      if (request) {
        targetUserId = request.user_id
        userName = request.contact_name || ''
        userEmail = request.email || ''
      }
    }

    if (targetUserId && !userName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', targetUserId)
        .maybeSingle()
      
      if (profile) {
        userName = profile.full_name || ''
        userEmail = profile.email || ''
      }
    }

    const notif = generateNotification(type, userName || 'Utilisateur', { newStatus, customMessage, requestId });
    const notifLink = link || notif.link;

    // Insert in-app notification
    if (targetUserId) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title: notif.title,
          message: notif.message,
          type: type === 'security' ? 'warning' : 'info',
          link: notifLink,
          is_read: false,
        })

      if (notifError) {
        console.error('Error inserting notification:', notifError)
      }
    }

    // Send email via Resend if configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey && userEmail) {
      try {
        const emailHtml = buildEmailHtml(notif.title, notif.message, notifLink, type);
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${SITE_NAME} <contact@legalform.ci>`,
            to: [userEmail],
            subject: `${SITE_NAME} — ${notif.title}`,
            html: emailHtml,
          }),
        })
        if (!emailRes.ok) {
          console.error('Resend error:', await emailRes.text())
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr)
      }
    }

    return new Response(
      JSON.stringify({ success: true, title: notif.title, message: notif.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
