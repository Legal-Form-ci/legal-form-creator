import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const articleId = url.searchParams.get("id");

  if (!articleId) {
    return new Response("Missing id", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try public_id first (artXXX-MM-YYY format), then slug
  let { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, cover_image, slug, public_id")
    .eq("public_id", articleId)
    .eq("is_published", true)
    .maybeSingle();

  if (!post) {
    const res = await supabase
      .from("blog_posts")
      .select("title, excerpt, cover_image, slug, public_id")
      .eq("slug", articleId)
      .eq("is_published", true)
      .maybeSingle();
    post = res.data;
  }

  if (!post) {
    return Response.redirect("https://www.legalform.ci/actualites", 302);
  }

  const siteUrl = "https://www.legalform.ci";
  const articleUrl = `${siteUrl}/actualites/${post.public_id || post.slug}`;
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.excerpt || post.title);
  
  // CRITICAL: Always use the article's cover image, NEVER fall back to site logo
  const image = post.cover_image || `${siteUrl}/placeholder.svg`;

  // Check User-Agent: if it's a social crawler, serve HTML with OG tags
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  const isCrawler =
    ua.includes("facebookexternalhit") ||
    ua.includes("twitterbot") ||
    ua.includes("linkedinbot") ||
    ua.includes("whatsapp") ||
    ua.includes("telegrambot") ||
    ua.includes("slackbot") ||
    ua.includes("discordbot") ||
    ua.includes("googlebot") ||
    ua.includes("bingbot") ||
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider");

  if (isCrawler) {
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:site_name" content="Legal Form">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <link rel="canonical" href="${articleUrl}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${image}" alt="${title}">
  <a href="${articleUrl}">Lire l'article</a>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // For regular users, redirect to the SPA
  return Response.redirect(articleUrl, 302);
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(handler);
