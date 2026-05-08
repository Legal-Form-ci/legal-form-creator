import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  public_id: string | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["Actualités", "Guides Pratiques", "Juridique", "Entrepreneuriat"];

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image, category, tags, published_at, public_id')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts((data as BlogPost[]) || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading font-bold text-5xl text-foreground mb-4">Blog Legal Form</h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Ressources, actualités et guides pour vous accompagner dans votre parcours entrepreneurial
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-12">
            <Button variant={selectedCategory === null ? "default" : "outline"} onClick={() => setSelectedCategory(null)}>Tous</Button>
            {categories.map((cat) => (
              <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} onClick={() => setSelectedCategory(cat)}>{cat}</Button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse"><div className="h-48 bg-muted" /><CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader></Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} to={`/actualites/${post.public_id || post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {post.cover_image && <div className="aspect-video w-full overflow-hidden"><img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" /></div>}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        {post.category && <Badge>{post.category}</Badge>}
                        {post.published_at && <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.published_at).toLocaleDateString('fr-FR')}</span>}
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card><CardContent className="text-center py-12"><BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Aucun article trouvé</h3></CardContent></Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;