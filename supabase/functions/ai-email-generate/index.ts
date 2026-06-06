// Generate a polished HTML email body from a short prompt using Lovable AI Gateway.
// Optionally also generates a hero illustration and injects it at the top of the body.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = "google/gemini-2.5-flash";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

const SYSTEM = `Tu es un rédacteur d'emails marketing pour LegalForm (Côte d'Ivoire, juridique/entrepreneuriat).
Tu produis UNIQUEMENT du HTML inline pour le CORPS d'un email (sans <html>, <head>, <body>, sans <style>).
Style : moderne, professionnel, chaleureux, francophone, court (max 6 paragraphes).
Structure attendue :
- 1 <h2 style="color:#0f766e;margin:0 0 16px;font-family:Inter,Arial,sans-serif">Titre accrocheur</h2>
- Paragraphes en <p style="font-size:15px;line-height:1.6;color:#1f2937;margin:0 0 14px">
- Bouton CTA si pertinent : <p style="text-align:center;margin:24px 0"><a href="https://www.legalform.ci" style="background:#0f766e;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Action</a></p>
- N'inclus AUCUNE balise <img>, elles sont gérées séparément.
- Pas de markdown, pas de balises script. Uniquement HTML inline-styled.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, subject, withImage } = await req.json();
    if (!prompt) return json({ error: "prompt required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    // 1) Text body
    const textRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Sujet : ${subject || "(libre)"}\nBrief : ${prompt}\n\nRédige le HTML du corps de l'email maintenant.` },
        ],
      }),
    });
    if (!textRes.ok) {
      const t = await textRes.text();
      return json({ error: `Gateway ${textRes.status}: ${t.slice(0, 300)}` }, 500);
    }
    const textData = await textRes.json();
    let html = (textData?.choices?.[0]?.message?.content?.trim() || "")
      .replace(/^```html\s*/i, "")
      .replace(/```\s*$/i, "");

    // 2) Optional hero image
    let imageUrl: string | null = null;
    if (withImage) {
      try {
        const imgPrompt = `Illustration éditoriale ultra-réaliste, format paysage 16:9, pour un email professionnel LegalForm Côte d'Ivoire. Sujet: ${subject || prompt}. Contexte: ${prompt}. Style premium, lumière naturelle, palette sobre verte/teal, sans texte ni watermark.`;
        const imgRes = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: IMAGE_MODEL,
            messages: [{ role: "user", content: imgPrompt }],
            modalities: ["image", "text"],
          }),
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const dataUrl =
            imgData?.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
            (Array.isArray(imgData?.choices?.[0]?.message?.content)
              ? imgData.choices[0].message.content.find((p: any) => p?.type === "image_url")?.image_url?.url
              : null);
          if (typeof dataUrl === "string" && dataUrl.startsWith("data:image")) {
            imageUrl = await uploadDataUrl(dataUrl);
          }
        }
      } catch (e) {
        console.error("hero image gen failed", e);
      }

      if (imageUrl) {
        const heroBlock = `<p style="text-align:center;margin:0 0 24px"><img src="${imageUrl}" alt="" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:12px;border:0;outline:none" /></p>\n`;
        html = heroBlock + html;
      }
    }

    return json({ html, image_url: imageUrl });
  } catch (e: any) {
    console.error("ai-email-generate error:", e);
    return json({ error: e.message }, 500);
  }
});

async function uploadDataUrl(dataUrl: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;

  const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const mimeType = mimeMatch?.[1] || "image/png";
  const base64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const path = `image/ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase.storage
    .from("newsletter-assets")
    .upload(path, bytes, { contentType: mimeType, upsert: false });
  if (error) {
    console.error("upload error", error);
    return null;
  }
  const { data } = supabase.storage.from("newsletter-assets").getPublicUrl(path);
  return data?.publicUrl || null;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
