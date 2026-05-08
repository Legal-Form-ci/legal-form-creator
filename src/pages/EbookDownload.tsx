import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Download, FileText, CheckCircle } from "lucide-react";

interface Ebook {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  cover_image: string | null;
  category: string | null;
  is_free: boolean;
  download_count: number;
}

const EbookDownload = () => {
  const { id } = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadEbook();
    }
  }, [id]);

  const loadEbook = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setEbook(data as Ebook);
      
      if (data?.title) {
        document.title = `Télécharger ${data.title} | Legal Form`;
      }
    } catch (error) {
      console.error('Error loading ebook:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger ce document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ebook) return;

    if (!formData.name || !formData.email) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setDownloading(true);

    try {
      // Record download
      await supabase
        .from('ebook_downloads')
        .insert({
          ebook_id: ebook.id,
          user_email: formData.email,
          user_name: formData.name
        });

      // Increment download count
      await supabase
        .from('ebooks')
        .update({ download_count: (ebook.download_count || 0) + 1 })
        .eq('id', ebook.id);

      // Open file URL
      if (ebook.file_url) {
        window.open(ebook.file_url, '_blank');
        setShowForm(false);
        
        toast({
          title: "Téléchargement lancé",
          description: "Votre fichier devrait se télécharger automatiquement",
        });
      }
    } catch (error: any) {
      console.error('Error downloading:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <Card className="animate-pulse">
              <div className="h-64 bg-muted" />
              <CardHeader>
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full mt-2" />
              </CardHeader>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl text-center">
            <h1 className="text-4xl font-bold mb-4">Document non trouvé</h1>
            <Button onClick={() => window.history.back()}>Retour</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Card>
            {ebook.cover_image && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img
                  src={ebook.cover_image}
                  alt={ebook.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <CardHeader className="text-center">
              <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-3xl mb-4">{ebook.title}</CardTitle>
              <CardDescription className="text-lg">
                {ebook.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {showForm ? (
                <form onSubmit={handleDownload} className="space-y-6">
                  <div className="bg-primary/10 p-4 rounded-lg text-sm text-primary">
                    📑 Ce document vous aide à accomplir vos démarches en conformité avec la loi ivoirienne et l'acte OHADA.
                    <br />
                    <br />
                    Entrez vos coordonnées ci-dessous pour recevoir le fichier et accéder à nos prochaines ressources gratuites.
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Votre nom"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemple@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={downloading}>
                    <Download className="mr-2 h-5 w-5" />
                    {downloading ? "Téléchargement..." : "Recevoir mon fichier"}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="text-2xl font-bold">Téléchargement réussi !</h3>
                  <p className="text-muted-foreground">
                    Merci d'avoir téléchargé ce document. Vous recevrez bientôt d'autres ressources utiles.
                  </p>
                  <Button onClick={() => window.location.href = '/ebooks'} variant="outline">
                    Découvrir d'autres ressources
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EbookDownload;