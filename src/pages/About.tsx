import { Target, Heart, Award, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Excellence",
      description: "Nous visons l'excellence dans chaque projet, chaque conseil et chaque accompagnement"
    },
    {
      icon: Heart,
      title: "Engagement",
      description: "Votre réussite est notre priorité. Nous nous engageons à vos côtés jusqu'à l'atteinte de vos objectifs"
    },
    {
      icon: Award,
      title: "Expertise",
      description: "Une équipe de professionnels qualifiés avec une expertise juridique et entrepreneuriale reconnue"
    },
    {
      icon: Users,
      title: "Proximité",
      description: "Présents dans toutes les régions de Côte d'Ivoire pour vous accompagner au plus près"
    }
  ];

  const reasons = [
    {
      title: "Accompagnement Complet",
      description: "De l'idée au lancement, nous gérons toutes les étapes de votre projet"
    },
    {
      title: "Rapidité d'Exécution",
      description: "Procédures optimisées pour créer votre entreprise dans les meilleurs délais"
    },
    {
      title: "Tarifs Transparents",
      description: "Prix clairs et compétitifs sans frais cachés"
    },
    {
      title: "Expertise Juridique",
      description: "Équipe de juristes et experts comptables certifiés"
    },
    {
      title: "Suivi Personnalisé",
      description: "Un conseiller dédié pour suivre votre dossier de A à Z"
    },
    {
      title: "Solutions Digitales",
      description: "Accompagnement dans la transformation numérique de votre entreprise"
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
              À Propos de Legal Form
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Votre partenaire stratégique pour transformer vos idées en entreprises solides et pérennes
            </p>
          </div>

          {/* Mission */}
          <section className="mb-20">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-primary">
                <CardContent className="p-8 sm:p-12">
                  <h2 className="font-heading font-bold text-3xl text-center text-foreground mb-6">
                    Notre Mission
                  </h2>
                  <p className="text-lg text-muted-foreground text-center leading-relaxed mb-6">
                    <strong className="text-foreground">Legal Form</strong> est une plateforme spécialisée dans la création d'entreprises, 
                    la structuration juridique et l'accompagnement complet des porteurs de projets.
                  </p>
                  <p className="text-lg text-muted-foreground text-center leading-relaxed">
                    Nous intervenons depuis l'idée jusqu'au lancement opérationnel : structuration & formalisation, 
                    création d'entreprise, association, ONG ou coopérative, obtention des immatriculations, 
                    rédaction de documents juridiques, conseil en stratégie, formation, recherche de financement, 
                    et conception de solutions digitales.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Values */}
          <section className="mb-20">
            <h2 className="font-heading font-bold text-3xl text-center text-foreground mb-12">
              Nos Valeurs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-strong transition-all">
                    <CardHeader>
                      <div className="mx-auto mb-4 p-4 rounded-xl bg-primary/10 w-fit">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="mb-20">
            <h2 className="font-heading font-bold text-3xl text-center text-foreground mb-12">
              Pourquoi Choisir Legal Form ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reasons.map((reason, index) => (
                <Card key={index} className="hover:shadow-soft transition-all hover:border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">{reason.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Vision */}
          <section className="mb-20">
            <div className="bg-gradient-hero rounded-2xl p-12 text-white">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-6">
                  Notre Vision
                </h2>
                <p className="text-lg text-white/90 leading-relaxed mb-4">
                  <strong>Legal Form n'est pas seulement un service, c'est un partenaire stratégique</strong> pour tous ceux 
                  qui veulent entreprendre en toute sécurité, rapidement et avec une équipe experte.
                </p>
                <p className="text-lg text-white/90 leading-relaxed">
                  Notre mission est de transformer les idées en entreprises solides, performantes et pérennes, 
                  en accompagnant chaque entrepreneur à chaque étape de son parcours.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <h3 className="font-heading font-bold text-2xl text-foreground mb-6">
              Prêt à Démarrer Votre Projet ?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Créer mon entreprise
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
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

export default About;
