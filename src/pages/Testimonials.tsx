import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TestimonialForm from "@/components/TestimonialForm";

interface Testimonial {
  id: string;
  name: string;
  company: string;
  region: string;
  type: string;
  rating: number;
  comment: string;
  image?: string;
}

const Testimonials = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Auto-show form if hash is #form
  useEffect(() => {
    if (window.location.hash === "#form") setShowForm(true);
  }, []);

  const fetchTestimonials = async () => {
    try {
      // Fetch from both tables
      const [companiesRes, testimonialsRes] = await Promise.all([
        (supabase as any).from('created_companies').select('id, name, type, region, rating, testimonial, founder_name, founder_photo_url, logo_url').eq('is_published', true).not('testimonial', 'is', null).order('created_at', { ascending: false }),
        supabase.from('testimonials').select('*').eq('is_approved', true).order('created_at', { ascending: false })
      ]);

      const fromCompanies = ((companiesRes.data || []) as any[]).map((item: any) => ({
        id: item.id,
        name: item.founder_name || "Client",
        company: item.name || "",
        region: item.region || "",
        type: item.type || "",
        rating: item.rating || 5,
        comment: item.testimonial || "",
        image: item.founder_photo_url || item.logo_url || undefined
      }));

      const fromTestimonials = (testimonialsRes.data || []).map(item => ({
        id: item.id,
        name: item.name,
        company: item.company || "",
        region: item.location || "",
        type: item.company_type || "",
        rating: item.rating || 5,
        comment: item.message,
        image: item.avatar_url || undefined
      }));

      setTestimonials([...fromTestimonials, ...fromCompanies]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTestimonials(); }, []);

  useEffect(() => {
    if (testimonials.length <= 3) return;
    const timer = setInterval(() => setCurrentIndex(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextSlide = () => setCurrentIndex(p => (p + 1) % Math.max(1, testimonials.length));
  const prevSlide = () => setCurrentIndex(p => (p - 1 + testimonials.length) % Math.max(1, testimonials.length));

  const getVisibleTestimonials = () => {
    if (testimonials.length <= 3) return testimonials;
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(testimonials[(currentIndex + i) % testimonials.length]);
    }
    return visible;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-foreground mb-6">
              {t('testimonials.title', 'Ce qu\'ils disent de nous')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('testimonials.subtitle', 'Découvrez les témoignages de nos clients satisfaits')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <Card className="border-2 border-primary/20"><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-primary mb-2">500+</div><p className="text-xs text-muted-foreground">Entreprises créées</p></CardContent></Card>
            <Card className="border-2 border-primary/20"><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-primary mb-2">4.9/5</div><p className="text-xs text-muted-foreground">Note moyenne</p></CardContent></Card>
            <Card className="border-2 border-primary/20"><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-primary mb-2">14</div><p className="text-xs text-muted-foreground">Régions couvertes</p></CardContent></Card>
            <Card className="border-2 border-primary/20"><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-primary mb-2">7j</div><p className="text-xs text-muted-foreground">Délai moyen</p></CardContent></Card>
          </div>

          {/* Testimonials carousel */}
          <div className="relative mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Témoignages</h2>
              <div className="flex gap-2">
                {testimonials.length > 3 && (
                  <>
                    <Button variant="outline" size="icon" onClick={prevSlide}><ChevronLeft className="h-5 w-5" /></Button>
                    <Button variant="outline" size="icon" onClick={nextSlide}><ChevronRight className="h-5 w-5" /></Button>
                  </>
                )}
                <Button onClick={() => setShowForm(!showForm)} className="bg-accent hover:bg-accent/90 text-white">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Laisser un témoignage
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>
            ) : testimonials.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Aucun témoignage pour le moment</p>
                <p className="text-sm text-muted-foreground mt-2">Soyez le premier à partager votre expérience !</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getVisibleTestimonials().map((testimonial, i) => (
                  <Card key={`${testimonial.id}-${i}`} className="border-2 hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          {testimonial.image ? (
                            <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-primary">{testimonial.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-primary font-medium">{testimonial.company}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(testimonial.rating)].map((_, starIdx) => (
                              <Star key={starIdx} className="h-3 w-3 text-accent fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <Quote className="h-6 w-6 text-primary/20 mb-2" />
                      <p className="text-muted-foreground mb-4 italic text-sm">"{testimonial.comment}"</p>
                      <div className="flex items-center gap-2 pt-4 border-t">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">{testimonial.type}</span>
                        <span className="text-xs text-muted-foreground">{testimonial.region}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Testimonial Form */}
          {showForm && (
            <div id="form" className="mb-16 max-w-2xl mx-auto">
              <TestimonialForm onSuccess={() => { setShowForm(false); fetchTestimonials(); }} />
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-hero rounded-2xl p-8 text-center text-white">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-4">Rejoignez nos clients satisfaits</h2>
            <p className="text-lg mb-6 text-white/90">Faites confiance à Legal Form pour la création de votre entreprise</p>
            <Link to="/create"><Button size="lg" className="bg-accent hover:bg-accent/90 text-white">{t('nav.createCompany', 'Créer mon entreprise')}</Button></Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Testimonials;
