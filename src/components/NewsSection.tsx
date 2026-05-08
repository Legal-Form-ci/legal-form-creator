import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ArrowRight, Tag, ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
}

const NewsSection = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image, category, published_at, created_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-heading font-semibold text-white mb-4">
          {t('home.news.title', 'Actualités')}
        </h3>
        {[1, 2].map((i) => (
          <Card key={i} className="bg-white/10 border-0">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-3/4 bg-white/20 mb-2" />
              <Skeleton className="h-3 w-full bg-white/20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-white flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-accent" />
          {t('home.news.title', 'Actualités')}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              to={`/blog/${post.slug}`}
              className="flex-[0_0_100%] min-w-0"
            >
              <Card className="bg-white/10 hover:bg-white/20 border-0 transition-all duration-300 group cursor-pointer h-full overflow-hidden">
                <CardContent className="p-0">
                  {/* Image section */}
                  <div className="relative h-32 w-full overflow-hidden">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to placeholder
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <Newspaper className="h-12 w-12 text-white/40" />
                      </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Category badge */}
                    {post.category && (
                      <Badge className="absolute top-2 left-2 bg-accent/90 text-white text-xs">
                        {post.category}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Content section */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-white/60 text-xs">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.published_at || post.created_at)}
                    </div>
                    <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-accent transition-colors leading-tight">
                      {post.title}
                    </h4>
                    {post.excerpt && (
                      <p className="text-xs text-white/60 line-clamp-2 mt-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Link to="/actualites">
        <Button 
          variant="ghost" 
          className="w-full text-white/80 hover:text-white hover:bg-white/10 group"
        >
          {t('home.news.viewAll', 'Voir toutes les actualités')}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </div>
  );
};

export default NewsSection;