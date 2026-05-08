import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Phone, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number | null;
}

const FAQ = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setFaqs(data);
    }
    setLoading(false);
  };

  const categories = [...new Set(faqs.map(f => f.category || 'general'))];

  const filteredFaqs = searchQuery.trim()
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory
      ? faqs.filter(faq => (faq.category || 'general') === activeCategory)
      : faqs;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <HelpCircle className="h-12 w-12" />
              </div>
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-6">
              {t('faq.title', 'Questions Fréquentes')}
            </h1>
            <p className="text-xl text-white/90 mb-8">
              {t('faq.subtitle', 'Trouvez rapidement les réponses à vos questions sur nos services de création d\'entreprise en Côte d\'Ivoire.')}
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('faq.searchPlaceholder', 'Rechercher une question...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg bg-white text-foreground border-0 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              onClick={() => setActiveCategory(null)}
              className="rounded-full"
            >
              {t('faq.allCategories', 'Toutes les catégories')}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                onClick={() => setActiveCategory(cat)}
                className="rounded-full capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredFaqs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {t('faq.noResults', 'Aucun résultat trouvé')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('faq.noResultsDesc', 'Essayez avec d\'autres mots-clés ou consultez toutes les catégories.')}
                </p>
                <Button onClick={() => { setSearchQuery(''); setActiveCategory(null); }}>
                  {t('faq.showAll', 'Voir toutes les questions')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border rounded-lg px-6 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left py-5">
                    <div className="flex flex-col gap-2">
                      {faq.category && (
                        <Badge variant="secondary" className="w-fit text-xs capitalize">
                          {faq.category}
                        </Badge>
                      )}
                      <span className="font-medium text-foreground">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">
                {t('faq.stillQuestions', 'Vous avez encore des questions ?')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('faq.stillQuestionsDesc', 'Notre équipe est disponible pour répondre à toutes vos questions.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/contact">
                    {t('faq.contactUs', 'Nous contacter')}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="tel:+2250709677925">
                    <Phone className="mr-2 h-4 w-4" />
                    +225 07 09 67 79 25
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
