import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Building2, MapPin, Calendar, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Company {
  name: string;
  type: string;
  region: string;
  district: string;
  date: string;
  rating: number;
  testimonial: string;
  founder: string;
  logo?: string;
}

const Showcase = () => {
  const { t } = useTranslation();
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, regions: 0, avgRating: 0 });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error } = await (supabase as any).from('created_companies').select('name, type, region, district, created_at, rating, testimonial, founder_name, logo_url').eq('is_published', true).order('created_at', { ascending: false });
        if (!error && data) {
          const mapped = (data as any[]).map((item: any) => ({ 
            name: item.name, 
            type: item.type, 
            region: item.region, 
            district: item.district || item.region, 
            date: item.created_at, 
            rating: item.rating || 5, 
            testimonial: item.testimonial || "", 
            founder: item.founder_name || "",
            logo: item.logo_url || ""
          }));
          setCompanies(mapped);
          
          // Calculate stats
          const uniqueRegions = new Set(mapped.map(c => c.region));
          const avgRating = mapped.length > 0 
            ? mapped.reduce((sum, c) => sum + c.rating, 0) / mapped.length 
            : 0;
          setStats({
            total: mapped.length,
            regions: uniqueRegions.size,
            avgRating: Math.round(avgRating * 10) / 10
          });
        }
      } catch (error) { console.error("Error:", error); }
      finally { setIsLoading(false); }
    };
    fetchCompanies();
  }, []);

  const regions = ["Abidjan", "Yamoussoukro", "Bouaké", "Daloa", "San-Pédro", "Korhogo"];
  const types = ["SARL", "SUARL", "Association", "ONG"];
  const filteredCompanies = companies.filter(c => (filterRegion === "all" || c.region === filterRegion) && (filterType === "all" || c.type === filterType));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-foreground mb-6">{t('nav.showcase')}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Découvrez les entreprises que nous avons accompagnées avec succès</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-12 max-w-2xl mx-auto">
            <Select value={filterRegion} onValueChange={setFilterRegion}><SelectTrigger><SelectValue placeholder="Région" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes</SelectItem>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
            <Select value={filterType} onValueChange={setFilterType}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem>{types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Aucune entreprise à afficher pour le moment</p>
              <p className="text-sm text-muted-foreground mt-2">Les entreprises créées apparaîtront ici</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company, i) => (
                <Card key={i} className="hover:shadow-strong transition-all hover:border-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="h-10 w-10 object-contain rounded" />
                      ) : (
                        <Building2 className="h-8 w-8 text-primary" />
                      )}
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">{company.type}</span>
                    </div>
                    <CardTitle className="text-xl">{company.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground"><MapPin className="h-4 w-4 mr-2" />{company.region}</div>
                    <div className="flex items-center text-sm text-muted-foreground"><Calendar className="h-4 w-4 mr-2" />Créée le {new Date(company.date).toLocaleDateString('fr-FR')}</div>
                    <div className="flex items-center">{[...Array(5)].map((_, starIdx) => <Star key={starIdx} className={`h-4 w-4 ${starIdx < company.rating ? "fill-accent text-accent" : "text-muted"}`} />)}</div>
                    {company.testimonial && <div className="bg-muted/50 p-4 rounded-lg"><p className="text-sm text-muted-foreground italic">"{company.testimonial}"</p><p className="text-xs font-semibold mt-2">- {company.founder}</p></div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center border-2"><CardContent className="p-8"><div className="text-4xl font-bold text-primary mb-2">{stats.total > 0 ? `${stats.total}+` : '0'}</div><p className="text-muted-foreground">{t('testimonials.companiesCreated')}</p></CardContent></Card>
            <Card className="text-center border-2"><CardContent className="p-8"><div className="text-4xl font-bold text-primary mb-2">{stats.regions > 0 ? stats.regions : '0'}</div><p className="text-muted-foreground">{t('testimonials.regionsCovered')}</p></CardContent></Card>
            <Card className="text-center border-2"><CardContent className="p-8"><div className="text-4xl font-bold text-primary mb-2">{stats.avgRating > 0 ? `${stats.avgRating}/5` : '-'}</div><p className="text-muted-foreground">{t('testimonials.averageRating')}</p></CardContent></Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Showcase;