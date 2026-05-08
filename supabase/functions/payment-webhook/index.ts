import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kkiapay-signature',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('=== KKIAPAY WEBHOOK FUNCTION STARTED ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const kkiapaySecret = Deno.env.get('KKIAPAY_SECRET');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasKkiapaySecret: !!kkiapaySecret
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.text();
    console.log('Webhook body received:', body.substring(0, 500));
    
    // Parse webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('KkiaPay webhook data:', JSON.stringify(webhookData, null, 2).substring(0, 1000));

    // KkiaPay webhook structure
    const transactionId = webhookData.transactionId || webhookData.transaction_id || webhookData.id;
    const status = webhookData.status || webhookData.state || 'SUCCESS';
    const amount = webhookData.amount;
    const phone = webhookData.phone;
    
    // Get custom data from webhook
    const data = webhookData.data || {};
    const requestId = data.requestId || data.request_id;
    const requestType = data.requestType || data.request_type || 'company';

    console.log('Parsed data:', { transactionId, status, amount, requestId, requestType });

    if (!transactionId) {
      console.error('No transaction ID in webhook data');
      return new Response(
        JSON.stringify({ error: 'Missing transaction ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Map KkiaPay status to our status
    let paymentStatus = 'pending';
    let requestStatus = 'payment_pending';
    
    if (status === 'SUCCESS' || status === 'TRANSACTION_SUCCESS' || status === 'approved' || status === 'success') {
      paymentStatus = 'approved';
      requestStatus = 'payment_confirmed';
    } else if (status === 'FAILED' || status === 'declined' || status === 'canceled' || status === 'failed') {
      paymentStatus = 'failed';
      requestStatus = 'payment_failed';
    } else if (status === 'PENDING' || status === 'pending') {
      paymentStatus = 'pending';
      requestStatus = 'payment_pending';
    } else {
      // Unknown status from callback, assume success
      paymentStatus = 'approved';
      requestStatus = 'payment_confirmed';
    }

    console.log('Status mapping:', { kkiapayStatus: status, paymentStatus, requestStatus });

    // Find payment record by transaction ID
    const { data: paymentRecord, error: paymentFindError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', String(transactionId))
      .maybeSingle();

    if (paymentFindError) {
      console.error('Error finding payment record:', paymentFindError);
    }

    let trackingNumber = '';
    let customerEmail = '';
    let customerName = '';
    let companyName = '';

    if (paymentRecord) {
      // Update existing payment
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          payment_method: 'kkiapay',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);

      if (paymentUpdateError) {
        console.error('Error updating payment record:', paymentUpdateError);
      } else {
        console.log('Payment record updated:', paymentRecord.id);
      }

      trackingNumber = paymentRecord.tracking_number || '';
      customerEmail = paymentRecord.customer_email || '';
      customerName = paymentRecord.customer_name || '';

      // Log the payment event
      await supabase
        .from('payment_logs')
        .insert({
          payment_id: paymentRecord.id,
          event_type: `webhook_kkiapay_${status}`,
          event_data: webhookData
        });

      // Get request ID from payment record if not in webhook
      const actualRequestId = requestId || paymentRecord.request_id;
      const actualRequestType = requestType || paymentRecord.request_type || 'company';

      // Update the request
      if (actualRequestId) {
        const tableName = actualRequestType === 'service' ? 'service_requests' : 'company_requests';

        const { data: requestData, error: updateError } = await supabase
          .from(tableName)
          .update({
            status: requestStatus,
            payment_status: paymentStatus === 'approved' ? 'paid' : paymentStatus,
            payment_id: String(transactionId),
            updated_at: new Date().toISOString()
          })
          .eq('id', actualRequestId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating request:', updateError);
        } else {
          console.log(`Request ${actualRequestId} updated to status: ${requestStatus}`);
          trackingNumber = requestData?.tracking_number || trackingNumber;
          customerEmail = requestData?.email || requestData?.contact_email || customerEmail;
          customerName = requestData?.contact_name || customerName;
          companyName = requestData?.company_name || '';
        }

        // Send confirmation email if payment approved
        if (paymentStatus === 'approved' && customerEmail) {
          try {
            await supabase.functions.invoke('send-payment-notification', {
              body: {
                to: customerEmail,
                type: 'payment_confirmed',
                customerName: customerName,
                trackingNumber: trackingNumber,
                amount: amount || paymentRecord.amount,
                companyName: companyName
              }
            });
            console.log('Payment confirmation email sent');
          } catch (emailError) {
            console.error('Error sending email:', emailError);
          }
        }
      }
    } else {
      console.warn('No payment record found for transaction:', transactionId);
      
      // Log the orphan event
      await supabase
        .from('payment_logs')
        .insert({
          event_type: `webhook_kkiapay_${status}_orphan`,
          event_data: webhookData
        });
    }

    console.log('=== KKIAPAY WEBHOOK FUNCTION SUCCESS ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionId,
        paymentStatus,
        requestStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('=== KKIAPAY WEBHOOK FUNCTION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
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
