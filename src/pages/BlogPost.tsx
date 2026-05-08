import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, ArrowLeft, User, Eye, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  author_name: string | null;
  views_count: number | null;
  public_id: string | null;
}

const SOCIAL_NETWORKS = [
  { name: "Facebook", icon: "https://cdn.simpleicons.org/facebook/1877F2", share: (url: string, text: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}` },
  { name: "X (Twitter)", icon: "https://cdn.simpleicons.org/x/000000", share: (url: string, text: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { name: "LinkedIn", icon: "https://cdn.simpleicons.org/linkedin/0A66C2", share: (url: string, text: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { name: "WhatsApp", icon: "https://cdn.simpleicons.org/whatsapp/25D366", share: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}` },
  { name: "Telegram", icon: "https://cdn.simpleicons.org/telegram/26A5E4", share: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { name: "Email", icon: "https://cdn.simpleicons.org/gmail/EA4335", share: (url: string, text: string) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent('Lire l\'article complet, cliquez ici : ' + url)}` },
];

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'xwtmnzorzsvkamqemddk';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string>("");
  const [translatedTitle, setTranslatedTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const { toast } = useToast();
  const { currentLang, translateText, needsTranslation } = useAutoTranslate();

  useEffect(() => {
    if (slug) loadPost();
  }, [slug]);

  useEffect(() => {
    if (!post || !needsTranslation) {
      if (post) {
        setTranslatedTitle(post.title);
        setTranslatedContent(post.content);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      const [title, content] = await Promise.all([
        translateText(post.title),
        translateText(post.content),
      ]);
      if (!cancelled) {
        setTranslatedTitle(title);
        setTranslatedContent(content);
      }
    })();
    return () => { cancelled = true; };
  }, [post, currentLang, needsTranslation]);

  const loadPost = async () => {
    setLoading(true);
    try {
      // Try by public_id first (new format artXXX-MM-YYY), then slug
      let { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('public_id', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (!data) {
        const res = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();
        data = res.data;
      }

      if (data) {
        setPost(data as BlogPost);
        supabase.rpc('increment_blog_views', { post_id: data.id }).then(() => {});
        document.title = `${data.title} | Legal Form`;
        
        // Set OG meta tags dynamically for this article
        const setMeta = (selector: string, content: string) => {
          const el = document.querySelector(selector);
          if (el) el.setAttribute('content', content);
        };
        setMeta('meta[property="og:title"]', data.title);
        setMeta('meta[name="twitter:title"]', data.title);
        if (data.excerpt) {
          setMeta('meta[property="og:description"]', data.excerpt);
          setMeta('meta[name="twitter:description"]', data.excerpt);
        }
        if (data.cover_image) {
          setMeta('meta[property="og:image"]', data.cover_image);
          setMeta('meta[name="twitter:image"]', data.cover_image);
        }
        const articleUrl = `https://www.legalform.ci/actualites/${data.public_id || data.slug}`;
        setMeta('meta[property="og:url"]', articleUrl);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShareUrl = () => {
    if (!post) return window.location.href;
    const id = post.public_id || post.slug;
    // Always share the clean public URL: /actualites/{public_id}
    return `https://www.legalform.ci/actualites/${id}`;
  };

  const getArticleUrl = () => {
    if (!post) return window.location.href;
    return `https://www.legalform.ci/actualites/${post.public_id || post.slug}`;
  };

  const getShareText = () => {
    if (!post) return '';
    return `${post.title}\n\n${post.excerpt || ''}\n\n📖 Lire l'article complet :`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-12 bg-muted rounded w-3/4" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Article non trouvé</h1>
            <Link to="/actualites"><Button><ArrowLeft className="mr-2 h-4 w-4" />Retour aux actualités</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <article className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link to="/actualites">
            <Button variant="ghost" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />Retour aux actualités</Button>
          </Link>

          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {post.category && <Badge className="bg-primary text-primary-foreground">{post.category}</Badge>}
              {post.published_at && (
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {post.author_name && (
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <User className="h-4 w-4" />{post.author_name}
                </span>
              )}
              {post.views_count != null && (
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Eye className="h-4 w-4" />{post.views_count} vue{post.views_count > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4 mr-1" />Partager
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                navigator.clipboard.writeText(getArticleUrl());
                toast({ title: "Lien copié !", description: "Le lien de l'article a été copié." });
              }}>
                Copier le lien
              </Button>
            </div>

            <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4 leading-tight">
              {translatedTitle || post.title}
            </h1>
            
            {post.excerpt && <p className="text-lg text-muted-foreground italic leading-relaxed">{post.excerpt}</p>}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag, i) => <Badge key={i} variant="outline">{tag}</Badge>)}
              </div>
            )}
          </header>

          {post.cover_image && (
            <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
              <img src={post.cover_image} alt={post.title} className="w-full h-auto max-h-[500px] object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none article-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({children}) => <h1 className="text-3xl font-bold text-primary mb-6 mt-8 border-b-2 border-primary/30 pb-3">{children}</h1>,
                h2: ({children}) => <h2 className="text-2xl font-semibold text-foreground mb-4 mt-7">{children}</h2>,
                h3: ({children}) => <h3 className="text-xl font-medium text-foreground mb-3 mt-6">{children}</h3>,
                p: ({children}) => <p className="mb-5 leading-relaxed text-foreground/90 text-base">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside mb-5 space-y-2 pl-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-5 space-y-2 pl-2">{children}</ol>,
                li: ({children}) => <li className="text-foreground/90">{children}</li>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-primary pl-5 italic my-6 bg-primary/5 py-4 pr-4 rounded-r-lg">{children}</blockquote>
                ),
                table: ({children}) => (
                  <div className="overflow-x-auto my-6 rounded-lg border border-border">
                    <table className="w-full border-collapse">{children}</table>
                  </div>
                ),
                thead: ({children}) => <thead className="bg-primary text-primary-foreground">{children}</thead>,
                th: ({children}) => <th className="p-3 font-semibold text-left text-sm">{children}</th>,
                tr: ({children}) => <tr className="border-b border-border even:bg-muted/50">{children}</tr>,
                td: ({children}) => <td className="p-3 text-sm">{children}</td>,
                code: ({children, className}) => className ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-5"><code className="text-sm font-mono">{children}</code></pre>
                ) : (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>
                ),
                hr: () => <hr className="my-8 border-t-2 border-muted" />,
                a: ({href, children}) => <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">{children}</a>,
                img: ({src, alt}) => <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-lg my-6 shadow-md" />,
                strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
                em: ({children}) => <em className="italic">{children}</em>,
              }}
            >
              {translatedContent || post.content}
            </ReactMarkdown>
          </div>
        </div>
      </article>

      {/* Social Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partager cet article</DialogTitle>
            <DialogDescription>Choisissez un réseau social pour partager l'article</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            {SOCIAL_NETWORKS.map((network) => (
              <a
                key={network.name}
                href={network.share(getShareUrl(), getShareText())}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setShareOpen(false)}
              >
                <img src={network.icon} alt={network.name} className="h-8 w-8" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs text-center font-medium">{network.name}</span>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
