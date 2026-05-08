import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  HttpError,
  ImageMode,
  extractIllustrationTargets,
  generateAndUploadImage,
  generateArticle,
  injectInlineIllustrations,
  parseGeneratedArticle,
} from "./helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const isValidImageMode = (value: unknown): value is ImageMode =>
  value === "none" || value === "cover" || value === "cover_and_inline";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const requestedMode = body?.imageMode ?? (body?.withImage ? "cover" : "none");
    const imageMode: ImageMode = isValidImageMode(requestedMode) ? requestedMode : "none";

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Le contenu ne peut pas être vide" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new HttpError(500, "LOVABLE_API_KEY is not configured");
    }

    const rawArticle = await generateArticle(LOVABLE_API_KEY, content, imageMode);
    const parsed = parseGeneratedArticle(rawArticle, content);

    if (imageMode !== "none") {
      const coverPrompt = [
        `Photographie ultra-réaliste et professionnelle en lien avec: ${parsed.title}`,
        `Contexte: ${parsed.excerpt || parsed.category || "article d'actualité"}`,
        "Style institutionnel, lumière naturelle, composition propre, sans texte ni watermark",
        "Cadre Côte d'Ivoire / Afrique de l'Ouest quand pertinent",
      ].join(". ");

      const coverUrl = await generateAndUploadImage(
        LOVABLE_API_KEY,
        coverPrompt,
        "blog/ai-cover",
      );

      if (coverUrl) {
        parsed.cover_image = coverUrl;
      }
    }

    if (imageMode === "cover_and_inline") {
      const targets = extractIllustrationTargets(parsed.formattedContent, 2);
      const generatedInlineImages: { heading: string; alt: string; url: string }[] = [];

      for (const target of targets) {
        const inlinePrompt = [
          `Illustration éditoriale ultra-réaliste pour la section: ${target}`,
          `Article principal: ${parsed.title}`,
          "Rendu journalistique premium, naturel, sobre, sans texte ni watermark",
        ].join(". ");

        const inlineUrl = await generateAndUploadImage(
          LOVABLE_API_KEY,
          inlinePrompt,
          "blog/ai-inline",
        );

        if (inlineUrl) {
          generatedInlineImages.push({
            heading: target,
            alt: `Illustration ${target}`,
            url: inlineUrl,
          });
        }
      }

      if (generatedInlineImages.length > 0) {
        parsed.formattedContent = injectInlineIllustrations(
          parsed.formattedContent,
          generatedInlineImages,
        );
        parsed.inline_images = generatedInlineImages.map((item) => item.url);
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("AI content generator error:", error);

    if (error instanceof HttpError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: error.status,
        },
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
