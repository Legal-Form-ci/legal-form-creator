import { Check, ArrowRight, Shield, Clock, Zap, HeadphonesIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Pricing = () => {
  const included = [
    "Rédaction de statuts",
    "Immatriculation RCCM",
    "Déclaration Fiscale d'Existence (DFE)",
    "Numéro Compte Contribuable (NCC)",
    "Immatriculation CNPS",
    "Identification Unique (IDU)",
    "Numéro Télédéclarant (NTD)",
    "Avis de constitution",
    "Journal",
    "Déclaration de Souscription et Versement (DSV)"
  ];

  const advantages = [
    { icon: Zap, title: "100% en ligne", desc: "Toutes vos démarches sans vous déplacer" },
    { icon: Clock, title: "Rapide", desc: "Délais optimisés pour votre création" },
    { icon: Shield, title: "Sécurisé", desc: "Paiement et données protégés" },
    { icon: HeadphonesIcon, title: "Accompagnement", desc: "Équipe d'experts à votre écoute" },
  ];

  const additionalServices = [
    {
      title: "Structuration de Projet",
      description: "Montage de business plan, études de faisabilité et conseil stratégique",
    },
    {
      title: "Formation",
      description: "Formation entrepreneuriale, gestion d'entreprise et accompagnement",
    },
    {
      title: "Mobilisation de Financement",
      description: "Recherche, montage de dossiers et mobilisation de financements",
    },
    {
      title: "Solutions Digitales",
      description: "Sites web, applications mobiles et solutions sur mesure",
    },
    {
      title: "Identité Visuelle",
      description: "Logos, chartes graphiques et supports de communication",
    },
    {
      title: "Comptabilité & Fiscalité",
      description: "Suivi comptable, déclarations fiscales et conseil financier",
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">
              Un accompagnement adapté à votre projet
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Soumettez votre demande et recevez un devis personnalisé selon votre situation, votre région et vos besoins spécifiques.
            </p>
          </div>

          {/* Main Value Proposition */}
          <div className="max-w-4xl mx-auto mb-20">
            <Card className="border-2 border-primary shadow-strong overflow-hidden">
              <div className="bg-primary text-white text-center py-3 text-sm font-semibold">
                PACK CRÉATION D'ENTREPRISE — TOUT INCLUS
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Création complète de votre entreprise</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Un tarif unique et transparent, adapté à votre localisation et votre structure juridique.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {included.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-accent/10 p-4 rounded-lg mb-6 text-center">
                  <p className="text-sm text-accent font-semibold">
                    💳 Paiement en ligne : Mobile Money, carte bancaire, virement électronique
                  </p>
                </div>

                <div className="text-center">
                  <Link to="/create">
                    <Button size="lg" className="text-lg px-10 py-6 h-auto font-semibold">
                      Soumettre ma demande
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-3">
                    Vous recevrez un devis détaillé après soumission de votre dossier.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advantages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
            {advantages.map((adv, i) => {
              const Icon = adv.icon;
              return (
                <Card key={i} className="text-center border-2 hover:border-primary transition-all">
                  <CardContent className="pt-6 pb-4">
                    <div className="mx-auto mb-3 p-3 rounded-xl bg-primary/10 w-fit">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{adv.title}</h3>
                    <p className="text-sm text-muted-foreground">{adv.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Services */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl text-foreground mb-4">
                Services Additionnels
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Des prestations complémentaires pour accompagner la croissance de votre entreprise
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {additionalServices.map((service, index) => (
                <Card key={index} className="hover:shadow-soft transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-primary font-semibold text-sm">Sur devis personnalisé</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-hero rounded-2xl p-12 text-center text-white">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
              Prêt à lancer votre projet ?
            </h2>
            <p className="text-lg mb-6 text-white/90">
              Soumettez votre demande gratuitement et recevez votre devis personnalisé
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                  Démarrer ma création
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
