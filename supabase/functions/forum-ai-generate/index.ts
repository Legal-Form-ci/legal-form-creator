import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type, format } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: "Contenu requis" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Image generation request
    if (type === "image") {
      const imagePrompt = `Professional, ultra-realistic, high-quality photograph for a social media post about: ${content}. Clean composition, natural lighting, no text overlays, no watermarks, suitable for a professional social network in Côte d'Ivoire, West Africa. Modern, engaging, authentic look.`;

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageBase64) {
          // Upload to Supabase storage
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `forum/ai-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

          const { error: uploadError } = await supabaseClient.storage
            .from("company-logos")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabaseClient.storage.from("company-logos").getPublicUrl(fileName);
            return new Response(JSON.stringify({ image_url: urlData.publicUrl }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
      return new Response(JSON.stringify({ error: "Échec génération image" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
      });
    }

    const isComment = type === "comment";

    const systemPrompt = isComment
      ? `Tu es un assistant rédactionnel pour un forum professionnel d'entrepreneurs en Côte d'Ivoire.
L'utilisateur te donne une idée de commentaire (même un seul mot). Tu dois générer un commentaire naturel, humain, engageant et pertinent.
- Ton professionnel mais accessible
- Pas de formules creuses ni de flatterie
- Court (2-5 phrases max)
- Pas de hashtags pour les commentaires
- Pas de balisage HTML visible
Réponds en JSON: { "content": "le commentaire enrichi" }`
      : `Tu es un moteur de publication intelligent pour le réseau social professionnel Ivoi'Rois, plateforme communautaire d'entrepreneurs en Côte d'Ivoire.

CAPACITÉS :
- Comprendre le sujet même à partir d'un simple mot
- Identifier l'émotion dominante : fierté, enthousiasme, gratitude, information, réflexion
- Déterminer le format de publication le plus naturel
- Développer un simple mot en publication sociale complète

STYLE RÉDACTIONNEL :
- Ton humain, direct et authentique — jamais robotique
- Phrases courtes à moyennes, rythmées et lisibles
- Sauts de ligne réguliers pour la lecture mobile
- Émojis avec parcimonie si le ton le justifie
- Registre professionnel sans être rigide
- Première ligne percutante (phrase d'accroche)
- Question ouverte en fin si pertinent pour l'engagement

TYPES DE PUBLICATIONS :
- Publication courte (statut) : 3-5 lignes max
- Publication développée (article social) : structurée avec intro, développement, conclusion
- Publication événement : contexte, date, lieu, objectifs
- Publication annonce/actualité : accroche, corps, appel à l'action
- Publication témoignage : narration authentique à la première personne
- Publication inspirationnelle : format court, percutant

RÈGLES ABSOLUES :
- Aucun balisage HTML ni Markdown visible
- Aucun artefact détectable comme contenu IA
- Minimum 100 mots pour le contenu
- Hashtags pertinents (3-5 max) en fin de publication
- Catégorie parmi : Général, Création d'entreprise, Fiscalité, Juridique, Financement, Conseils

Réponds UNIQUEMENT en JSON:
{
  "title": "Titre percutant",
  "content": "Contenu complet de la publication (texte pur, pas de markdown)",
  "category": "Catégorie détectée",
  "hashtags": ["tag1", "tag2", "tag3"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite atteinte, réessayez" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erreur du service IA");
    }

    const aiResponse = await response.json();
    const messageContent = aiResponse.choices?.[0]?.message?.content;

    if (!messageContent) throw new Error("Réponse IA vide");

    let parsed;
    try {
      const jsonMatch = messageContent.match(/```json\s*([\s\S]*?)\s*```/) ||
                        messageContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, messageContent];
      parsed = JSON.parse(jsonMatch[1] || messageContent);
    } catch {
      parsed = isComment
        ? { content: messageContent }
        : { title: content.substring(0, 60), content: messageContent, category: "Général", hashtags: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Forum AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
