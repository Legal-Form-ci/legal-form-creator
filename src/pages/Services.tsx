import { Building2, Users, FileText, Briefcase, ShieldCheck, Landmark, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Services = () => {
  const companyTypes = [
    { name: "SARL", description: "Société à Responsabilité Limitée", details: "Structure flexible pour PME avec responsabilité limitée des associés" },
    { name: "SUARL", description: "Société Unipersonnelle à Responsabilité Limitée", details: "SARL avec un seul associé, idéale pour entrepreneurs solo" },
    { name: "SNC", description: "Société en Nom Collectif", details: "Tous les associés ont la qualité de commerçant" },
    { name: "SCS", description: "Société en Commandite Simple", details: "Associés commanditaires et commandités avec statuts différents" },
    { name: "Entreprise Individuelle", description: "Pour exercer seul une activité", details: "Structure simple sans création de personne morale distincte" },
  ];

  const otherStructures = [
    { icon: Users, title: "Association", description: "Création et enregistrement d'associations à but non lucratif" },
    { icon: Landmark, title: "ONG", description: "Organisation Non Gouvernementale pour projets de développement" },
    { icon: Briefcase, title: "Coopérative", description: "Structure de collaboration économique entre membres" },
    { icon: Building2, title: "GIE", description: "Groupement d'Intérêt Économique pour actions communes" },
  ];

  const legalDocuments = [
    "Rédaction de statuts", "Modification de statuts", "Contrat de bail commercial enregistré",
    "Contrat de travail (CDI, CDD)", "Convention de partenariat", "Procurations et mandats",
    "Actes de cession de parts", "Protocoles d'accord", "Déclaration de Souscription et de Versement (DSV)",
  ];

  const complementaryServices = [
    { title: "RCCM", description: "Registre du Commerce et du Crédit Mobilier" },
    { title: "DFE", description: "Déclaration Fiscale d'Existence" },
    { title: "NCC", description: "Numéro de Compte Contribuable" },
    { title: "Immatriculation CNPS", description: "Caisse Nationale de Prévoyance Sociale" },
    { title: "IDU", description: "Identification Unique de l'entreprise" },
    { title: "NTD", description: "Numéro de Télédéclarant fiscal" },
    { title: "Avis de constitution", description: "Publication officielle" },
    { title: "Domiciliation", description: "Adresse commerciale et siège social" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">Nos Services</h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Créer, gérer et accompagner votre entreprise en Côte d'Ivoire et partout dans le monde
            </p>
          </div>

          {/* Company Types */}
          <section className="mb-20">
            <div className="flex items-center mb-8">
              <Building2 className="h-8 w-8 text-primary mr-3" />
              <h2 className="font-heading font-bold text-3xl text-foreground">Création d'Entreprise</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companyTypes.map((type, index) => (
                <Card key={index} className="hover:shadow-strong transition-all hover:border-primary">
                  <CardHeader>
                    <CardTitle className="text-primary">{type.name}</CardTitle>
                    <CardDescription className="font-semibold text-foreground">{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{type.details}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Other Structures */}
          <section className="mb-20">
            <h2 className="font-heading font-bold text-3xl text-foreground mb-8">Autres Structures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {otherStructures.map((structure, index) => {
                const Icon = structure.icon;
                return (
                  <Card key={index} className="hover:shadow-strong transition-all hover:border-primary text-center">
                    <CardHeader>
                      <div className="mx-auto mb-3 p-3 rounded-xl bg-primary/10 w-fit">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>{structure.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{structure.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Legal Documents */}
          <section className="mb-20">
            <div className="flex items-center mb-8">
              <FileText className="h-8 w-8 text-primary mr-3" />
              <h2 className="font-heading font-bold text-3xl text-foreground">Documents Juridiques</h2>
            </div>
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {legalDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Complementary Services */}
          <section className="mb-20">
            <div className="flex items-center mb-8">
              <ShieldCheck className="h-8 w-8 text-primary mr-3" />
              <h2 className="font-heading font-bold text-3xl text-foreground">Formalités incluses dans la création</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complementaryServices.map((service, index) => (
                <Card key={index} className="hover:shadow-soft transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA - No prices */}
          <section className="mb-20">
            <div className="bg-gradient-hero rounded-2xl p-12 text-center text-white">
              <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-6">
                Lancez votre projet dès maintenant
              </h2>
              <p className="text-lg mb-4 text-white/90 max-w-3xl mx-auto">
                Remplissez le formulaire en ligne et recevez un devis personnalisé adapté à votre situation et votre localisation. Notre équipe d'experts vous accompagne à chaque étape.
              </p>
              <p className="text-sm text-white/70 mb-8">
                💳 Paiement en ligne accepté : Mobile Money, carte bancaire et virement électronique
              </p>
              <Link to="/create">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white shadow-strong text-lg px-8 py-6 h-auto font-semibold">
                  Soumettre ma demande
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>
          
          {/* Additional Services Section */}
          <section className="mb-20">
            <h2 className="font-heading font-bold text-3xl text-foreground mb-4 text-center">Services Additionnels</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              Des prestations complémentaires sur devis pour accompagner votre croissance
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: FileText, title: "Structuration de Projet", desc: "Montage de business plan, études de faisabilité et conseil stratégique" },
                { icon: GraduationCap, title: "Formation", desc: "Formation entrepreneuriale, gestion d'entreprise et accompagnement personnalisé" },
                { icon: Briefcase, title: "Mobilisation de Financement", desc: "Recherche, montage de dossiers et mobilisation de financements" },
                { icon: Building2, title: "Solutions Digitales", desc: "Conception de sites web, applications mobiles et solutions digitales sur mesure" },
                { icon: FileText, title: "Identité Visuelle", desc: "Conception de logos, chartes graphiques et supports de communication" },
                { icon: Briefcase, title: "Comptabilité & Fiscalité", desc: "Suivi comptable, déclarations fiscales et conseil en gestion financière" },
              ].map((svc, i) => {
                const Icon = svc.icon;
                return (
                  <Card key={i} className="border-2 hover:shadow-strong transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center text-primary">
                        <Icon className="h-6 w-6 mr-2" />{svc.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-muted-foreground">{svc.desc}</p>
                      <Link to="/service-request">
                        <Button className="w-full" size="sm">Soumettre ma demande</Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
