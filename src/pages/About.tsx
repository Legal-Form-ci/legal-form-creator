import { Target, Heart, Award, Users, CheckCircle2, ArrowRight, Sparkles, Building2, Globe2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    { icon: Target, title: "Excellence", description: "Standards élevés sur chaque dossier, chaque conseil, chaque livrable." },
    { icon: Heart, title: "Engagement", description: "Nous portons votre projet avec la même intensité que le vôtre." },
    { icon: Award, title: "Expertise", description: "Juristes, fiscalistes et conseillers certifiés à votre service." },
    { icon: Users, title: "Proximité", description: "Présents dans toutes les régions de Côte d'Ivoire et au-delà." },
  ];

  const reasons = [
    { title: "Accompagnement Complet", description: "De l'idée au lancement opérationnel, sans rupture." },
    { title: "Rapidité d'Exécution", description: "Procédures optimisées, délais maîtrisés." },
    { title: "Tarifs Transparents", description: "Aucun frais caché. Devis clair avant toute action." },
    { title: "Expertise Juridique", description: "Une équipe pluridisciplinaire certifiée." },
    { title: "Suivi Personnalisé", description: "Un conseiller dédié, un canal direct." },
    { title: "Solutions Digitales", description: "Outils numériques pour piloter votre activité." },
  ];

  const stats = [
    { value: "1 200+", label: "Entreprises créées" },
    { value: "14", label: "Régions couvertes" },
    { value: "98%", label: "Clients satisfaits" },
    { value: "72h", label: "Délai moyen RCCM" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-white pt-32 pb-20 lg:pt-44 lg:pb-28">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl">
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur mb-5">À propos de Legal Form</Badge>
              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
                Le partenaire stratégique des entrepreneurs ivoiriens
              </h1>
              <p className="text-lg sm:text-xl text-white/85 leading-relaxed">
                Nous transformons les idées en entreprises solides — structuration juridique, formalités,
                financement et solutions digitales sous un même toit.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/create"><Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Créer mon entreprise <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
                <Link to="/contact"><Button size="lg" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white hover:text-primary">Nous rencontrer</Button></Link>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAND */}
        <section className="border-b border-border bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-heading font-bold text-3xl sm:text-4xl text-primary">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MISSION + VISION */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <Card className="border-2 hover:shadow-strong transition-all">
                <CardContent className="p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10"><Sparkles className="h-6 w-6 text-primary" /></div>
                    <h2 className="font-heading font-bold text-2xl text-foreground">Notre mission</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Accompagner chaque porteur de projet — de la structuration à la croissance — en combinant rigueur juridique,
                    intelligence opérationnelle et outils numériques modernes.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 bg-gradient-hero text-white hover:shadow-strong transition-all">
                <CardContent className="p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-white/15"><Globe2 className="h-6 w-6 text-white" /></div>
                    <h2 className="font-heading font-bold text-2xl">Notre vision</h2>
                  </div>
                  <p className="text-white/90 leading-relaxed">
                    Devenir la référence ouest-africaine de la création et du développement d'entreprise, en plaçant la confiance,
                    la rapidité et la pédagogie au cœur de chaque relation client.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* VALEURS */}
        <section className="py-16 lg:py-24 bg-muted/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="secondary" className="mb-3">Nos valeurs</Badge>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">Quatre principes, une exigence</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <Card key={v.title} className="group hover:shadow-strong hover:-translate-y-1 transition-all border-2 hover:border-primary">
                    <CardContent className="p-6">
                      <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="h-6 w-6 text-primary group-hover:text-white" />
                      </div>
                      <h3 className="font-heading font-semibold text-lg mb-2">{v.title}</h3>
                      <p className="text-sm text-muted-foreground">{v.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* POURQUOI NOUS */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <Badge variant="secondary" className="mb-3">Pourquoi nous choisir</Badge>
                <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
                  Une plateforme pensée pour les entrepreneurs exigeants
                </h2>
                <p className="text-muted-foreground mb-6">
                  Nous combinons l'expertise d'un cabinet juridique et l'efficacité d'une plateforme digitale moderne.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/services"><Button>Découvrir nos services</Button></Link>
                  <Link to="/pricing"><Button variant="outline">Voir les tarifs</Button></Link>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {reasons.map((r) => (
                  <div key={r.title} className="flex gap-3 p-4 rounded-xl bg-card border hover:border-primary hover:shadow-soft transition-all">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm text-foreground">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-hero rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white shadow-premium">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">Prêt à démarrer votre projet ?</h2>
              <p className="text-white/85 max-w-2xl mx-auto mb-8">
                Un conseiller dédié vous accompagne dès aujourd'hui. Devis transparent, action immédiate.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/create"><Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Lancer ma création <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
                <Link to="/contact"><Button size="lg" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white hover:text-primary">Parler à un expert</Button></Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
