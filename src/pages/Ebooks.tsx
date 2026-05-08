import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, Download } from "lucide-react";
import { Link } from "react-router-dom";

interface Ebook {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  file_url: string;
  category: string | null;
  is_free: boolean;
  price: number | null;
  download_count: number;
  is_published: boolean;
}

const Ebooks = () => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["Statuts", "Modèles", "Guides", "Formulaires"];

  useEffect(() => {
    loadEbooks();
  }, [selectedCategory]);

  const loadEbooks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ebooks')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEbooks((data as Ebook[]) || []);
    } catch (error) {
      console.error('Error loading ebooks:', error);
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
            <h1 className="font-heading font-bold text-5xl text-foreground mb-4">
              Ressources Gratuites
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Téléchargez nos modèles, guides et documents pour faciliter vos démarches juridiques
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-12">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
            >
              Tous
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted" />
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : ebooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ebooks.map((ebook) => (
                <Link key={ebook.id} to={`/ebook/${ebook.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {ebook.cover_image && (
                      <div className="aspect-[4/3] w-full overflow-hidden">
                        <img
                          src={ebook.cover_image}
                          alt={ebook.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{ebook.category || 'Document'}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {ebook.download_count} téléchargements
                        </span>
                      </div>
                      <CardTitle className="line-clamp-2">{ebook.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {ebook.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune ressource trouvée</h3>
                <p className="text-muted-foreground">
                  {selectedCategory
                    ? `Aucune ressource dans la catégorie "${selectedCategory}"`
                    : "Aucune ressource disponible pour le moment"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Ebooks;