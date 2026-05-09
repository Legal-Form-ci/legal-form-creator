// Generate a polished HTML email body from a short prompt using Lovable AI Gateway
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Tu es un rédacteur d'emails marketing pour LegalForm (Côte d'Ivoire, juridique/entrepreneuriat).
Tu produis UNIQUEMENT du HTML inline pour le CORPS d'un email (sans <html>, <head>, <body>, sans <style>).
Style : moderne, professionnel, chaleureux, francophone, court (max 6 paragraphes).
Structure attendue :
- 1 <h2 style="color:#0f766e;margin:0 0 16px;font-family:Inter,Arial,sans-serif">Titre accrocheur</h2>
- Paragraphes en <p style="font-size:15px;line-height:1.6;color:#1f2937;margin:0 0 14px">
- Bouton CTA si pertinent : <p style="text-align:center;margin:24px 0"><a href="https://www.legalform.ci" style="background:#0f766e;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Action</a></p>
- Pas de markdown, pas de balises script. Uniquement HTML inline-styled.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, subject } = await req.json();
    if (!prompt) return json({ error: "prompt required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Sujet : ${subject || "(libre)"}\nBrief : ${prompt}\n\nRédige le HTML du corps de l'email maintenant.` },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return json({ error: `Gateway ${res.status}: ${t.slice(0, 300)}` }, 500);
    }
    const data = await res.json();
    const html = data?.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = html.replace(/^```html\s*/i, "").replace(/```\s*$/i, "");
    return json({ html: cleaned });
  } catch (e: any) {
    console.error("ai-email-generate error:", e);
    return json({ error: e.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
