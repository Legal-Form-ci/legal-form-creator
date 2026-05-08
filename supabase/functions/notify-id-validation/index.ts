import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  documentId: string;
  status: 'verified' | 'rejected';
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { documentId, status, message }: NotificationRequest = await req.json();

    // Get document details with user info
    const { data: document, error: docError } = await supabase
      .from('identity_documents')
      .select(`
        *,
        profiles:user_id (full_name, phone)
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(document.user_id);
    const userEmail = authUser?.user?.email;

    // Update document verification status
    const { error: updateError } = await supabase
      .from('identity_documents')
      .update({
        verified: status === 'verified',
        verified_by: user.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Document ${documentId} ${status} by admin ${user.id}`);

    // Send email notification if Resend is configured
    if (resendApiKey && userEmail) {
      const userName = (document.profiles as any)?.full_name || 'Cher client';
      const isVerified = status === 'verified';
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isVerified ? '#10b981' : '#ef4444'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; padding: 8px 16px; background: ${isVerified ? '#d1fae5' : '#fee2e2'}; color: ${isVerified ? '#065f46' : '#991b1b'}; border-radius: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isVerified ? '✅ Document Vérifié' : '❌ Document Rejeté'}</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>
              
              <p>Nous vous informons que votre pièce d'identité a été ${isVerified ? 'vérifiée et validée' : 'examinée mais rejetée'}.</p>
              
              <p style="text-align: center; margin: 20px 0;">
                <span class="status-badge">${isVerified ? '✓ Vérifié' : '✗ Rejeté'}</span>
              </p>
              
              ${message ? `<p><strong>Commentaire :</strong> ${message}</p>` : ''}
              
              ${isVerified ? `
                <p>Votre dossier est maintenant complet et notre équipe peut poursuivre le traitement de votre demande.</p>
              ` : `
                <p>Veuillez soumettre à nouveau votre document en vous assurant que :</p>
                <ul>
                  <li>Le document est lisible et non flou</li>
                  <li>Toutes les informations sont visibles</li>
                  <li>Le document n'est pas expiré</li>
                  <li>La photo d'identité est clairement visible</li>
                </ul>
              `}
              
              <div class="footer">
                <p>Cordialement,<br><strong>L'équipe Legal Form</strong></p>
                <p>📧 contact@legalform.ci</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Legal Form <onboarding@resend.dev>',
            to: [userEmail],
            subject: `Document d'identité ${isVerified ? 'validé' : 'rejeté'} - Legal Form`,
            html: emailHtml
          })
        });
        
        if (emailResponse.ok) {
          console.log(`Email notification sent to ${userEmail}`);
        } else {
          const errText = await emailResponse.text();
          console.error('Email API error:', errText);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue even if email fails
      }
    } else {
      console.log('Email notification skipped - Resend not configured or no user email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Document ${status === 'verified' ? 'vérifié' : 'rejeté'} avec succès`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in notify-id-validation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
