import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ImageMode = "none" | "cover" | "cover_and_inline";

export interface GeneratedArticle {
  title: string;
  excerpt: string;
  category: string;
  formattedContent: string;
  tags: string;
  meta_description: string;
  slug: string;
  author_name: string;
  cover_image?: string;
  inline_images?: string[];
}

export interface InlineIllustration {
  heading: string;
  alt: string;
  url: string;
}

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = "google/gemini-2.5-flash";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const normalizeSlug = (source: string) =>
  source.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 100);

const sanitizeContentForFallback = (content: string) => content.trim().slice(0, 1200);

export const buildSystemPrompt = (imageMode: ImageMode) => {
  const mediaInstruction =
    imageMode === "cover_and_inline"
      ? "Le contenu doit rester 100% en Markdown lisible et prévoir des sections bien hiérarchisées (## et ###) pour permettre l'ajout d'illustrations contextuelles."
      : "Le contenu doit rester 100% en Markdown lisible, sans balisage HTML visible.";

  return `Tu es un moteur éditorial premium pour Legal Form SARL (Côte d'Ivoire, zone OHADA).

OBJECTIF :
- Transformer une saisie libre (même un mot) en article complet, structuré et publiable
- Ton naturel, professionnel, humain, journalistique — jamais robotique
- Aucun HTML visible, uniquement Markdown pur
- Minimum 800 mots de contenu de qualité

RÈGLES STRICTES :
1) Titre impactant en MAJUSCULES — pertinent, précis, non racoleur
2) Résumé court et engageant (max 200 caractères) — phrase d'accroche factuelle
3) Contenu structuré avec :
   - Introduction engageante et directe (2-3 paragraphes)
   - Sections logiques avec sous-titres ## et ###
   - Paragraphes bien aérés (max 4-5 lignes chacun)
   - Listes à puces quand pertinent
   - **Tableaux Markdown** quand le sujet le justifie (comparaisons, données, chronologies)
   - Conclusion synthétique
4) Catégorie : Fiscalité | Juridique | Entrepreneuriat | Actualités | Formation | Conseils | Événements | Annonces
5) Tags pertinents séparés par des virgules (5-8 tags)
6) Meta description SEO (max 160 caractères)
7) Slug URL propre en minuscules avec tirets
8) ${mediaInstruction}

TABLEAUX MARKDOWN — RÈGLES :
- Utilise la syntaxe Markdown standard : | Col1 | Col2 |
- Ligne de séparation avec |---|---|
- Génère des tableaux UNIQUEMENT quand ils apportent de la valeur (comparaisons, données chiffrées, chronologies, fiches techniques)
- En-têtes claires et concises
- Données factuelles et réalistes
- Jamais de tableau pour meubler

CHARTE ÉDITORIALE :
- Factuel, précis, vérifiable
- Respectueux des institutions et acteurs
- Jamais flatteur ni critique
- Indétectable comme contenu IA
- Posture de journaliste rigoureux

Retourne UNIQUEMENT du JSON valide avec cette structure exacte :
{
  "title": "TITRE EN MAJUSCULES",
  "excerpt": "Résumé court engageant",
  "category": "Catégorie",
  "formattedContent": "Contenu complet en Markdown avec tableaux si pertinent",
  "tags": "tag1, tag2, tag3, tag4, tag5",
  "meta_description": "Description SEO optimisée",
  "slug": "slug-url-propre",
  "author_name": "Legal Form SARL"
}`;
};

export const callAiGateway = async (apiKey: string, body: Record<string, unknown>): Promise<any> => {
  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) throw new HttpError(429, "Limite de requêtes atteinte, réessayez dans quelques secondes");
    if (response.status === 402) throw new HttpError(402, "Crédits IA insuffisants");
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    throw new HttpError(500, "Erreur du service IA");
  }

  return response.json();
};

export const generateArticle = async (apiKey: string, content: string, imageMode: ImageMode): Promise<string> => {
  const aiResponse = await callAiGateway(apiKey, {
    model: TEXT_MODEL,
    temperature: 0.65,
    messages: [
      { role: "system", content: buildSystemPrompt(imageMode) },
      { role: "user", content: `Voici le contenu source à enrichir :\n\n${content}` },
    ],
  });

  const messageContent = aiResponse?.choices?.[0]?.message?.content;
  if (!messageContent || typeof messageContent !== "string") throw new HttpError(500, "Réponse IA vide");
  return messageContent;
};

export const parseGeneratedArticle = (messageContent: string, fallbackContent: string): GeneratedArticle => {
  try {
    const jsonMatch =
      messageContent.match(/```json\s*([\s\S]*?)\s*```/) ||
      messageContent.match(/```\s*([\s\S]*?)\s*```/) ||
      [null, messageContent];

    const parsed = JSON.parse(jsonMatch[1] || messageContent);

    return {
      title: (parsed.title || "").toString().trim() || fallbackContent.slice(0, 70).toUpperCase(),
      excerpt: (parsed.excerpt || "").toString().trim(),
      category: (parsed.category || "Actualités").toString().trim(),
      formattedContent: (parsed.formattedContent || "").toString().trim() || sanitizeContentForFallback(fallbackContent),
      tags: (parsed.tags || "").toString().trim(),
      meta_description: (parsed.meta_description || parsed.excerpt || "").toString().trim().slice(0, 160),
      slug: normalizeSlug((parsed.slug || parsed.title || fallbackContent).toString()),
      author_name: (parsed.author_name || "Legal Form SARL").toString().trim(),
    };
  } catch {
    console.error("Failed to parse AI article response", messageContent);
    const fallbackTitle = fallbackContent.slice(0, 70).trim().toUpperCase() || "ACTUALITÉ";
    return {
      title: fallbackTitle,
      excerpt: fallbackContent.slice(0, 200).trim(),
      category: "Actualités",
      formattedContent: sanitizeContentForFallback(fallbackContent),
      tags: "",
      meta_description: fallbackContent.slice(0, 160).trim(),
      slug: normalizeSlug(fallbackTitle),
      author_name: "Legal Form SARL",
    };
  }
};

const getImageDataUrl = (imageResponse: any): string | null => {
  // Check direct images array
  const images = imageResponse?.choices?.[0]?.message?.images;
  if (Array.isArray(images) && images.length > 0) {
    const url = images[0]?.image_url?.url;
    if (typeof url === "string" && url.startsWith("data:image")) return url;
  }

  // Check content parts
  const contentParts = imageResponse?.choices?.[0]?.message?.content;
  if (Array.isArray(contentParts)) {
    const imagePart = contentParts.find((part: any) => part?.type === "image_url" && part?.image_url?.url);
    const url = imagePart?.image_url?.url;
    if (typeof url === "string" && url.startsWith("data:image")) return url;
  }

  return null;
};

const uploadDataUrlToStorage = async (dataUrl: string, filePath: string): Promise<string | null> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase credentials missing for image upload");
    return null;
  }

  const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const mimeType = mimeMatch?.[1] || "image/png";
  const base64Data = dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  const binaryData = Uint8Array.from(atob(base64Data), (char) => char.charCodeAt(0));

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

  const { error: uploadError } = await supabaseClient.storage
    .from("blog-images")
    .upload(filePath, binaryData, { contentType: mimeType, upsert: true });

  if (uploadError) {
    console.error("Image upload error", uploadError);
    return null;
  }

  const { data: urlData } = supabaseClient.storage.from("blog-images").getPublicUrl(filePath);
  return urlData?.publicUrl || null;
};

export const generateAndUploadImage = async (apiKey: string, prompt: string, filePrefix: string): Promise<string | null> => {
  try {
    const imageResponse = await callAiGateway(apiKey, {
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    });

    const dataUrl = getImageDataUrl(imageResponse);
    if (!dataUrl) {
      console.error("No image data URL found in response");
      return null;
    }

    const filePath = `${filePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    return await uploadDataUrlToStorage(dataUrl, filePath);
  } catch (error) {
    console.error("Image generation/upload failed", error);
    return null;
  }
};

export const extractIllustrationTargets = (markdown: string, maxTargets = 2): string[] => {
  const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)]
    .map((match) => match[1]?.trim())
    .filter(Boolean);
  if (headings.length > 0) return headings.slice(0, maxTargets);

  const paragraphs = markdown
    .split("\n\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 40 && !line.startsWith("#") && !line.startsWith("- "));
  return paragraphs.slice(0, maxTargets).map((paragraph) => paragraph.slice(0, 60));
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const injectInlineIllustrations = (markdown: string, illustrations: InlineIllustration[]): string => {
  let updated = markdown;
  illustrations.forEach((illustration) => {
    const headingPattern = new RegExp(`(^##\\s+${escapeRegex(illustration.heading)}\\s*$)`, "m");
    const imageBlock = `\n\n![${illustration.alt}](${illustration.url})\n`;
    if (headingPattern.test(updated)) {
      updated = updated.replace(headingPattern, `$1${imageBlock}`);
    } else {
      updated = `${updated.trim()}\n\n![${illustration.alt}](${illustration.url})\n`;
    }
  });
  return updated;
};
