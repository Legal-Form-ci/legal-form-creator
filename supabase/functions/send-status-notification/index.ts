import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationData {
  requestId: string;
  requestType: 'company' | 'service';
  newStatus: string;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  trackingNumber?: string;
  companyName?: string;
}

const statusMessages: Record<string, { subject: string; title: string; message: string; color: string }> = {
  'pending': {
    subject: 'Demande reçue',
    title: 'Votre demande a été reçue',
    message: 'Nous avons bien reçu votre demande de création d\'entreprise. Notre équipe va l\'examiner dans les plus brefs délais.',
    color: '#f59e0b'
  },
  'in_progress': {
    subject: 'Dossier en cours de traitement',
    title: 'Votre dossier est en cours de traitement',
    message: 'Bonne nouvelle ! Notre équipe travaille activement sur votre dossier. Vous serez notifié dès que nous aurons des mises à jour.',
    color: '#3b82f6'
  },
  'documents_required': {
    subject: 'Documents supplémentaires requis',
    title: 'Documents supplémentaires nécessaires',
    message: 'Pour finaliser votre dossier, nous avons besoin de documents supplémentaires. Veuillez vous connecter à votre espace client pour les soumettre.',
    color: '#f97316'
  },
  'awaiting_payment': {
    subject: 'En attente de paiement',
    title: 'Votre dossier est prêt - Paiement requis',
    message: 'Votre dossier a été validé et est prêt pour le traitement final. Veuillez effectuer le paiement pour lancer la création de votre entreprise.',
    color: '#8b5cf6'
  },
  'processing': {
    subject: 'Création en cours',
    title: 'Création de votre entreprise en cours',
    message: 'Excellent ! Le processus de création de votre entreprise est en cours. Les formalités administratives sont en train d\'être effectuées.',
    color: '#06b6d4'
  },
  'completed': {
    subject: '🎉 Votre entreprise est créée !',
    title: 'Félicitations ! Votre entreprise est officiellement créée',
    message: 'Nous avons le plaisir de vous annoncer que votre entreprise a été créée avec succès ! Tous vos documents officiels sont disponibles dans votre espace client.',
    color: '#22c55e'
  },
  'rejected': {
    subject: 'Dossier rejeté',
    title: 'Votre dossier a été rejeté',
    message: 'Nous sommes désolés, mais votre dossier n\'a pas pu être accepté. Veuillez consulter votre espace client pour plus de détails et les prochaines étapes.',
    color: '#ef4444'
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const data: NotificationData = await req.json()
    
    console.log('Sending status notification:', data)

    const statusInfo = statusMessages[data.newStatus] || statusMessages['pending']
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #007c7a 0%, #005a58 100%); padding: 40px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">LEGAL FORM</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Création d'entreprises en Côte d'Ivoire</p>
                  </td>
                </tr>
                
                <!-- Status Badge -->
                <tr>
                  <td style="padding: 30px 40px 0;">
                    <div style="text-align: center;">
                      <span style="display: inline-block; background: ${statusInfo.color}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                        ${statusInfo.subject}
                      </span>
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px 40px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px;">Bonjour ${data.clientName},</h2>
                    <h3 style="color: ${statusInfo.color}; margin: 0 0 15px; font-size: 20px;">${statusInfo.title}</h3>
                    <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 25px; font-size: 16px;">
                      ${statusInfo.message}
                    </p>
                    
                    <!-- Request Info Box -->
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 25px 0;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        ${data.trackingNumber ? `
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">Numéro de suivi:</td>
                          <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600; text-align: right;">${data.trackingNumber}</td>
                        </tr>
                        ` : ''}
                        ${data.companyName ? `
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">Entreprise:</td>
                          <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600; text-align: right;">${data.companyName}</td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">Statut actuel:</td>
                          <td style="padding: 8px 0; text-align: right;">
                            <span style="background: ${statusInfo.color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                              ${statusInfo.subject}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://legalform.ci/client/dashboard" 
                         style="display: inline-block; background: linear-gradient(135deg, #007c7a 0%, #005a58 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Accéder à mon espace client
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #f8f9fa; padding: 30px 40px; text-align: center;">
                    <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
                      Pour toute question, contactez-nous:
                    </p>
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0;">
                      📧 monentreprise@legalform.ci | 📱 +225 07 09 67 79 25
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 20px 0 0;">
                      © ${new Date().getFullYear()} Legal Form CI - Tous droits réservés
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // Send email via Resend
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Legal Form <notifications@legalform.ci>',
            to: [data.clientEmail],
            subject: `Legal Form - ${statusInfo.subject}`,
            html: emailHtml,
          }),
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error('Resend API error:', errorText)
        } else {
          console.log('Email sent successfully to:', data.clientEmail)
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
      }
    } else {
      console.log('RESEND_API_KEY not configured, email would be sent to:', data.clientEmail)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
