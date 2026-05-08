import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  to: string;
  subject: string;
  html: string;
  customerName?: string;
  trackingNumber?: string;
  amount?: number;
  companyName?: string;
  type?: 'payment_confirmed' | 'payment_failed' | 'request_created' | 'custom';
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== SEND-PAYMENT-NOTIFICATION STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const { to, subject, html, customerName, trackingNumber, amount, companyName, type }: NotificationRequest = await req.json();

    console.log(`Sending email to: ${to}, type: ${type || 'custom'}`);

    let emailHtml = html;
    let emailSubject = subject;

    // Generate beautiful email templates based on type
    if (type === 'payment_confirmed') {
      emailSubject = `✅ Paiement confirmé - ${trackingNumber || 'Legal Form'}`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #007c7a 0%, #009e9a 100%); padding: 40px 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">LEGAL FORM</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Création d'entreprises en Côte d'Ivoire</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; margin: 0 auto;">
                        <span style="color: #ffffff; font-size: 40px; line-height: 80px;">✓</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px; text-align: center;">
                      <h2 style="margin: 0 0 15px; color: #1a1a1a; font-size: 24px;">Paiement Confirmé!</h2>
                      <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                        Bonjour ${customerName || 'Cher client'},<br>
                        Nous avons bien reçu votre paiement.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px;">
                        <tr>
                          <td style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                            <span style="color: #666; font-size: 14px;">Numéro de suivi</span><br>
                            <span style="color: #007c7a; font-size: 18px; font-weight: 600;">${trackingNumber || 'N/A'}</span>
                          </td>
                        </tr>
                        ${companyName ? `
                        <tr>
                          <td style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                            <span style="color: #666; font-size: 14px;">Entreprise / Service</span><br>
                            <span style="color: #1a1a1a; font-size: 16px; font-weight: 500;">${companyName}</span>
                          </td>
                        </tr>
                        ` : ''}
                        ${amount ? `
                        <tr>
                          <td style="padding: 15px 20px;">
                            <span style="color: #666; font-size: 14px;">Montant payé</span><br>
                            <span style="color: #10b981; font-size: 24px; font-weight: 700;">${amount.toLocaleString('fr-FR')} FCFA</span>
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px;">Prochaines étapes</h3>
                      <ol style="margin: 0; padding: 0 0 0 20px; color: #666; font-size: 14px; line-height: 2;">
                        <li>Notre équipe traite votre demande</li>
                        <li>Vous recevrez les documents par email</li>
                        <li>Suivez l'avancement sur votre espace client</li>
                      </ol>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 40px; text-align: center;">
                      <a href="https://legalform.ci/client/dashboard" style="display: inline-block; background-color: #007c7a; color: #ffffff; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                        Accéder à mon espace
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                        <strong>LEGAL FORM CI</strong>
                      </p>
                      <p style="margin: 0 0 5px; color: #999; font-size: 12px;">
                        +225 07 09 67 79 25 | contact@legalform.ci
                      </p>
                      <p style="margin: 0; color: #999; font-size: 12px;">
                        Abidjan, Côte d'Ivoire
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else if (type === 'payment_failed') {
      emailSubject = `Échec du paiement - ${trackingNumber || 'Legal Form'}`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #007c7a 0%, #009e9a 100%); padding: 40px 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">LEGAL FORM</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Création d'entreprises en Côte d'Ivoire</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="width: 80px; height: 80px; background-color: #ef4444; border-radius: 50%; margin: 0 auto;">
                        <span style="color: #ffffff; font-size: 40px; line-height: 80px;">✕</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px; text-align: center;">
                      <h2 style="margin: 0 0 15px; color: #1a1a1a; font-size: 24px;">Paiement Échoué</h2>
                      <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                        Bonjour ${customerName || 'Cher client'},<br>
                        Votre paiement n'a pas pu être traité.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 40px; text-align: center;">
                      <a href="https://legalform.ci/client/dashboard" style="display: inline-block; background-color: #007c7a; color: #ffffff; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                        Réessayer le paiement
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                        Besoin d'aide? Contactez-nous!
                      </p>
                      <p style="margin: 0; color: #999; font-size: 12px;">
                        +225 07 09 67 79 25 | contact@legalform.ci
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    }
    
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, logging email only');
      console.log('Email would be sent:', { to, subject: emailSubject });
      return new Response(
        JSON.stringify({ success: true, message: 'Email logged (Resend not configured)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Send email using fetch to Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Legal Form <onboarding@resend.dev>',
        to: [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent', data: emailData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in send-payment-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);
