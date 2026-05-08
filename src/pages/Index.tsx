import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, FileText, Shield, CheckCircle2, Star, GraduationCap, Gift, Zap, Clock, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsSection from "@/components/NewsSection";
import heroBackground from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { HeroSearchBar } from "@/components/HeroSearchBar";

interface HomeTestimonial {
  name: string;
  company: string;
  region: string;
  rating: number;
  comment: string;
  logo?: string;
}

const Index = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: Building2,
      title: t('home.services.creation.title', 'Création d\'entreprise'),
      description: t('home.services.creation.desc', 'De l\'idée au lancement opérationnel'),
      items: [
        "Entreprise Individuelle, SARL, SARLU",
        "Association, ONG, Fondation",
        "SCOOPS, SCI, GIE",
        "Filiale"
      ],
    },
    {
      icon: FileText,
      title: t('home.services.management.title', 'Gestion d\'entreprise'),
      description: t('home.services.management.desc', 'Modifications et formalités'),
      items: [
        "Changement de gérant, cession de part",
        "Domiciliation d'entreprise",
        "Rédaction de contrats",
        "Dépôt de marque"
      ],
    },
    {
      icon: GraduationCap,
      title: t('home.services.support.title', 'Accompagnement'),
      description: t('home.services.support.desc', 'Accompagnement stratégique'),
      items: [
        "Comptabilité et fiscalité",
        "Formation entrepreneuriale",
        "Structuration de projet",
        "Mobilisation de financement"
      ],
    },
    {
      icon: FileText,
      title: t('home.services.other.title', 'Autres formalités'),
      description: t('home.services.other.desc', 'Démarches administratives'),
      items: [
        "Immobilier, Agrément FDFP",
        "Agrément agent immobilier",
        "Transport, Carte transporteur",
        "Formalités ACD"
      ],
    },
  ];

  const steps = [
    { number: "01", title: t('home.steps.step1.title', 'Choisissez votre service'), description: t('home.steps.step1.desc', 'Sélectionnez la forme juridique adaptée à votre activité') },
    { number: "02", title: t('home.steps.step2.title', 'Remplissez le formulaire'), description: t('home.steps.step2.desc', 'Informations simples et rapides en quelques minutes') },
    { number: "03", title: t('home.steps.step3.title', 'Recevez votre devis personnalisé'), description: t('home.steps.step3.desc', 'Un devis adapté à votre situation vous est transmis') },
    { number: "04", title: t('home.steps.step4.title', 'Suivi jusqu\'à tous vos documents'), description: t('home.steps.step4.desc', 'Suivi personnalisé en temps réel') },
  ];

  const defaultTestimonials: HomeTestimonial[] = [
    { name: "Inocent KOFFI", company: "AGRICAPITAL SARL", region: "Daloa", rating: 5, comment: t('home.testimonials.koffi', 'Service rapide et professionnel. L\'équipe Legal Form a été disponible à chaque étape.'), logo: `/images/agricapital-logo.jpg?v=${Date.now().toString().slice(0,8)}` },
    { name: "KOUASSI Marie", company: "TECHNOVATE SARL", region: "Abidjan", rating: 5, comment: t('home.testimonials.kouassi', 'J\'ai créé mon entreprise en peu de temps.') },
    { name: "DIALLO Amadou", company: "BATIR CI SARL", region: "Bouaké", rating: 5, comment: t('home.testimonials.diallo', 'Processus simplifié, équipe compétente. Je recommande vivement Legal Form.') },
  ];

  const [testimonials, setTestimonials] = useState<HomeTestimonial[]>(defaultTestimonials);

  useEffect(() => { setTestimonials(defaultTestimonials); }, [t]);

  useEffect(() => {
    const fetchApprovedTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("name, company, location, rating, message, avatar_url")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error || !data?.length) return;
      setTestimonials(data.map((item) => ({
        name: item.name,
        company: item.company || "Client Legal Form",
        region: item.location || "Côte d'Ivoire",
        rating: item.rating || 5,
        comment: item.message,
        logo: item.avatar_url || undefined,
      })));
    };
    fetchApprovedTestimonials();
  }, []);

  const advantages = [
    { icon: Zap, title: "100% en ligne", desc: "Pas besoin de vous déplacer" },
    { icon: Clock, title: "Rapide & efficace", desc: "Délais optimisés" },
    { icon: Shield, title: "Sécurisé", desc: "Paiement et données protégés" },
    { icon: HeadphonesIcon, title: "Support dédié", desc: "Équipe réactive à votre écoute" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Split Layout */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-hero"
          style={{
            backgroundImage: `linear-gradient(135deg, hsl(179 100% 24% / 0.95) 0%, hsl(179 100% 18% / 0.95) 100%), url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 border-2 border-white rounded-full" />
          <div className="absolute bottom-32 left-10 w-96 h-96 border-2 border-white transform rotate-45" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 border-2 border-white transform -rotate-12" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
            {/* Left side - Main CTA */}
            <div className="lg:col-span-3">
              <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {t('home.hero.title', 'Transformez votre idée en une')}{" "}
                <span className="text-accent">{t('home.hero.highlight', 'entreprise viable')}</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                {t('home.hero.subtitle', 'Créer, gérer et accompagner votre entreprise en Côte d\'Ivoire et partout dans le monde.')}
              </p>
              
              {/* AI Search Bar - FIRST element */}
              <HeroSearchBar />

              {/* Value proposition banner */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-250">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-lg">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Programme Parrainage</p>
                    <p className="text-white/80 text-xs">
                      Parrainez un proche et bénéficiez tous les deux d'avantages exclusifs sur votre dossier !
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <Link to="/create">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-white shadow-strong text-lg px-8 py-6 h-auto font-semibold group">
                    {t('home.hero.cta', 'Créer mon entreprise')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" variant="outline" className="border-2 border-white bg-white text-primary hover:bg-white/90 hover:text-primary text-lg px-8 py-6 h-auto font-bold">
                    {t('home.hero.services', 'Nos services')}
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right side - News Section + Advantages */}
            <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <NewsSection />
              </div>
              
              {/* Advantages - moved here from below CTA buttons */}
              <div className="grid grid-cols-2 gap-3">
                {advantages.map((adv, i) => {
                  const Icon = adv.icon;
                  return (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold text-xs">{adv.title}</p>
                        <p className="text-white/70 text-[10px]">{adv.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 lg:mb-16">
            <div className="text-left max-w-2xl">
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                {t('home.services.eyebrow', 'Notre expertise')}
              </span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight mb-4">
                {t('home.services.title', 'Nos Services')}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('home.services.subtitle', 'Créer, gérer et accompagner votre entreprise en Côte d\'Ivoire et partout dans le monde.')}
              </p>
            </div>
            <div className="hidden md:flex md:justify-end md:text-right">
              <Link to="/services">
                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white">
                  {t('home.services.viewAll', 'Voir tous nos services')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="border border-border/60 hover:border-primary hover:shadow-strong transition-all duration-300 group h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary transition-colors w-fit mb-5">
                      <Icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2 text-left">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-left leading-relaxed">{service.description}</p>
                    <ul className="space-y-2 mt-auto">
                      {service.items.map((item, i) => (
                        <li key={i} className="flex items-start text-sm text-muted-foreground text-left">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="md:hidden text-center mt-10">
            <Link to="/services">
              <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white">
                {t('home.services.viewAll', 'Voir tous nos services')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 sm:py-20 lg:py-28 bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 lg:mb-16">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
              {t('home.steps.eyebrow', 'Processus')}
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight mb-4">
              {t('home.steps.title', 'Comment ça marche ?')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t('home.steps.subtitle', 'Créez votre entreprise en 4 étapes simples')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-background rounded-xl p-6 h-full border border-border/60 hover:shadow-soft transition-shadow">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-hero text-white font-heading font-bold text-xl mb-4 shadow-soft">
                    {step.number}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2 text-left leading-snug">{step.title}</h3>
                  <p className="text-sm text-muted-foreground text-left leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-start mt-10 lg:mt-12">
            <Link to="/create">
              <Button size="lg" className="bg-gradient-accent hover:opacity-90 shadow-soft text-base px-7 py-6 h-auto font-semibold">
                {t('home.steps.cta', 'Commencer maintenant')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 lg:mb-16">
            <div className="text-left max-w-2xl">
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                {t('home.testimonials.eyebrow', 'Témoignages')}
              </span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight mb-4">
                {t('home.testimonials.title', 'Ce qu\'ils disent de nous')}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('home.testimonials.subtitle', 'Découvrez les témoignages de nos clients satisfaits')}
              </p>
            </div>
            <div className="hidden md:flex md:gap-3 md:justify-end">
              <Link to="/testimonials">
                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white">
                  {t('home.testimonials.viewAll', 'Voir tous')}
                </Button>
              </Link>
              <Link to="/testimonials?action=submit">
                <Button className="bg-accent hover:bg-accent/90 text-white">
                  {t('home.testimonials.submit', 'Laisser un témoignage')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-border/60 hover:shadow-strong hover:-translate-y-1 transition-all duration-300 h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-primary/20 flex items-center justify-center p-1 flex-shrink-0">
                      {testimonial.logo ? (
                        <img src={testimonial.logo} alt={testimonial.company} className="w-full h-full object-contain rounded-full"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                        />
                      ) : null}
                      <span className={`text-lg font-bold text-primary ${testimonial.logo ? 'hidden' : ''}`}>
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center mb-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-accent fill-current" />
                        ))}
                      </div>
                      <p className="font-semibold text-foreground text-sm truncate">{testimonial.name}</p>
                      <p className="text-xs text-primary font-medium truncate">{testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed text-left mb-4 flex-1">"{testimonial.comment}"</p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Client vérifié</span>
                    <span className="text-xs text-muted-foreground font-medium">{testimonial.region}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="md:hidden flex flex-col sm:flex-row gap-3 mt-10">
            <Link to="/testimonials" className="flex-1">
              <Button variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white">
                {t('home.testimonials.viewAll', 'Voir tous les témoignages')}
              </Button>
            </Link>
            <Link to="/testimonials?action=submit" className="flex-1">
              <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                {t('home.testimonials.submit', 'Laisser un témoignage')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
