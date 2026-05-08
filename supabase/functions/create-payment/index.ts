import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  description: string;
  requestId: string;
  requestType?: 'company' | 'service';
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== CREATE-PAYMENT FUNCTION (KKIAPAY) STARTED ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const kkiapayPublicKey = Deno.env.get('KKIAPAY_PUBLIC_KEY');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasKkiapayKey: !!kkiapayPublicKey
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error - Supabase' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Note: KkiaPay payment is initiated client-side, so we just prepare the record
    // and return the necessary data for the frontend to open the KkiaPay widget

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    let body: PaymentRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { 
      amount, 
      description, 
      requestId, 
      requestType = 'company', 
      customerEmail, 
      customerName, 
      customerPhone 
    } = body;

    console.log('Payment request:', { amount, description, requestId, requestType, customerEmail, customerName });

    // Validate required fields
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'Request ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!customerEmail || !customerName) {
      return new Response(
        JSON.stringify({ error: 'Customer email and name are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify the user owns the request
    const tableName = requestType === 'service' ? 'service_requests' : 'company_requests';
    const { data: request, error: requestError } = await supabase
      .from(tableName)
      .select('user_id, tracking_number, company_name')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError) {
      console.error('Database error:', requestError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!request) {
      console.error('Request not found:', requestId);
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (request.user_id !== user.id) {
      console.error('User does not own request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - You can only create payments for your own requests' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('Request verified, preparing KkiaPay payment data...');

    const cleanPhone = customerPhone ? customerPhone.replace(/[^0-9]/g, '') : '';

    // Create a pending payment record
    const paymentId = crypto.randomUUID();
    
    const { error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        user_id: user.id,
        request_id: requestId,
        request_type: requestType,
        amount: Math.round(amount),
        currency: 'XOF',
        status: 'pending',
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: cleanPhone,
        tracking_number: request.tracking_number,
        payment_method: 'kkiapay',
        metadata: {
          description: description,
          company_name: request.company_name
        }
      });

    if (paymentInsertError) {
      console.error('Error inserting payment record:', paymentInsertError);
      // Don't fail - the payment can still proceed
    } else {
      console.log('Payment record created:', paymentId);
    }

    // Update request with pending payment info
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
    }

    // Log the payment event
    await supabase
      .from('payment_logs')
      .insert({
        payment_id: paymentId,
        event_type: 'kkiapay_initiated',
        event_data: {
          request_id: requestId,
          amount: amount,
          customer_email: customerEmail
        }
      });

    console.log('=== CREATE-PAYMENT FUNCTION SUCCESS ===');

    // Return data for KkiaPay widget (frontend handles the actual payment)
    return new Response(
      JSON.stringify({
        success: true,
        paymentMethod: 'kkiapay',
        paymentId,
        amount: Math.round(amount),
        description: description || `Paiement Legal Form - ${request.tracking_number || requestId}`,
        trackingNumber: request.tracking_number,
        requestId,
        requestType,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: cleanPhone
        },
        // KkiaPay is handled client-side, no redirect URL needed
        // Frontend will use the useKkiapay hook
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('=== CREATE-PAYMENT FUNCTION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);
