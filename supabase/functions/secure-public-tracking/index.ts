import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePhone(phone: string): string[] {
  // Remove all spaces, dashes, dots
  const cleaned = phone.replace(/[\s\-\.]/g, '');
  
  // Generate variations for matching
  const variations: string[] = [cleaned];
  
  // If starts with +225, also try without it
  if (cleaned.startsWith('+225')) {
    variations.push(cleaned.substring(4));
  }
  // If starts with 225, also try without it
  if (cleaned.startsWith('225') && cleaned.length > 10) {
    variations.push(cleaned.substring(3));
  }
  // If starts with 00225, also try without it
  if (cleaned.startsWith('00225')) {
    variations.push(cleaned.substring(5));
  }
  // If doesn't start with +, try with +225
  if (!cleaned.startsWith('+')) {
    variations.push(`+225${cleaned}`);
    variations.push(`+225${cleaned.replace(/^0/, '')}`);
  }
  // Also try without leading 0
  if (cleaned.startsWith('0')) {
    variations.push(cleaned.substring(1));
  }
  
  return [...new Set(variations)];
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string' || phone.length < 8 || phone.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const ipAddress = getClientIP(req);
    console.log(`Tracking request from IP: ${ipAddress} for phone: ${phone}`);

    // Generate phone variations for matching
    const phoneVariations = normalizePhone(phone);
    console.log('Phone variations:', phoneVariations);

    const allRequests: any[] = [];

    // Fetch company requests matching any phone variation
    for (const phoneVar of phoneVariations) {
      const { data: companyData, error: companyError } = await supabase
        .from('company_requests')
        .select('id, tracking_number, status, created_at, company_name, contact_name, phone, payment_status, estimated_price')
        .or(`phone.ilike.%${phoneVar}%,phone.eq.${phoneVar}`);

      if (!companyError && companyData) {
        for (const r of companyData) {
          // Check if this request is already in our results
          if (!allRequests.some(ar => ar.id === r.id)) {
            allRequests.push({ ...r, type: 'company' });
          }
        }
      }
    }

    // Fetch service requests matching any phone variation
    for (const phoneVar of phoneVariations) {
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_requests')
        .select('id, tracking_number, status, created_at, service_type, contact_name, company_name, contact_phone, payment_status, estimated_price')
        .or(`contact_phone.ilike.%${phoneVar}%,contact_phone.eq.${phoneVar}`);

      if (!serviceError && serviceData) {
        for (const r of serviceData) {
          // Check if this request is already in our results
          if (!allRequests.some(ar => ar.id === r.id)) {
            allRequests.push({ ...r, type: 'service' });
          }
        }
      }
    }

    // Sort by created_at descending
    allRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`Found ${allRequests.length} requests for phone ${phone}`);

    return new Response(
      JSON.stringify({ requests: allRequests }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in secure-public-tracking function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

serve(handler);
