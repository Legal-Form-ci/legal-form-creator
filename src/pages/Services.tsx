import { Building2, Users, FileText, Briefcase, ShieldCheck, Landmark, GraduationCap, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Services = () => {
  const companyTypes = [
    { name: "SARL", description: "Société à Responsabilité Limitée", details: "Structure flexible pour PME avec responsabilité limitée des associés.", tag: "Le plus demandé" },
    { name: "SUARL", description: "SARL Unipersonnelle", details: "Idéale pour les entrepreneurs solo souhaitant protéger leur patrimoine." },
    { name: "SNC", description: "Société en Nom Collectif", details: "Tous les associés ont la qualité de commerçant." },
    { name: "SCS", description: "Société en Commandite Simple", details: "Associés commanditaires et commandités avec statuts différents." },
    { name: "Entreprise Individuelle", description: "Activité en nom propre", details: "Structure simple, sans personne morale distincte." },
    { name: "SAS / SA", description: "Société par Actions", details: "Pour les projets ambitieux avec investisseurs et gouvernance avancée." },
  ];

  const otherStructures = [
    { icon: Users, title: "Association", description: "Création et enregistrement d'associations à but non lucratif." },
    { icon: Landmark, title: "ONG", description: "Organisation Non Gouvernementale pour projets de développement." },
    { icon: Briefcase, title: "Coopérative", description: "Structure de collaboration économique entre membres." },
    { icon: Building2, title: "GIE", description: "Groupement d'Intérêt Économique pour actions communes." },
  ];

  const legalDocuments = [
    "Rédaction de statuts", "Modification de statuts", "Bail commercial enregistré",
    "Contrats de travail (CDI, CDD)", "Convention de partenariat", "Procurations et mandats",
    "Actes de cession de parts", "Protocoles d'accord", "Déclaration de Souscription (DSV)",
  ];

  const complementaryServices = [
    { title: "RCCM", description: "Registre du Commerce et du Crédit Mobilier" },
    { title: "DFE", description: "Déclaration Fiscale d'Existence" },
    { title: "NCC", description: "Numéro de Compte Contribuable" },
    { title: "Immatriculation CNPS", description: "Caisse Nationale de Prévoyance Sociale" },
    { title: "IDU", description: "Identification Unique de l'entreprise" },
    { title: "NTD", description: "Numéro de Télédéclarant fiscal" },
    { title: "Avis de constitution", description: "Publication légale officielle" },
    { title: "Domiciliation", description: "Adresse commerciale et siège social" },
  ];

  const additional = [
    { icon: FileText, title: "Structuration de projet", desc: "Business plan, études de faisabilité et conseil stratégique." },
    { icon: GraduationCap, title: "Formation", desc: "Formations entrepreneuriales et coaching personnalisé." },
    { icon: Briefcase, title: "Mobilisation de financement", desc: "Recherche et montage de dossiers de financement." },
    { icon: Building2, title: "Solutions digitales", desc: "Sites web, applications et outils sur mesure." },
    { icon: FileText, title: "Identité visuelle", desc: "Logos, chartes graphiques et supports de communication." },
    { icon: Briefcase, title: "Comptabilité & fiscalité", desc: "Tenue, déclarations et conseil en gestion." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-white pt-32 pb-20 lg:pt-44 lg:pb-28">
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl">
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur mb-5">Nos services</Badge>
              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
                Tout ce qu'il faut pour créer et faire grandir votre entreprise
              </h1>
              <p className="text-lg sm:text-xl text-white/85 leading-relaxed mb-8">
                Création de société, formalités, documents juridiques, financement, digital — sous un seul guichet.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/create"><Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Démarrer ma demande <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
                <Link to="/pricing"><Button size="lg" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white hover:text-primary">Voir les tarifs</Button></Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-20 lg:space-y-28">
          {/* Company Types */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-primary/10"><Building2 className="h-6 w-6 text-primary" /></div>
              <div>
                <Badge variant="secondary" className="mb-2">Création d'entreprise</Badge>
                <h2 className="font-heading font-bold text-3xl text-foreground">Choisissez votre forme juridique</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companyTypes.map((type) => (
                <Card key={type.name} className="group border-2 hover:border-primary hover:shadow-strong hover:-translate-y-1 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-primary text-2xl">{type.name}</CardTitle>
                      {type.tag && <Badge className="bg-accent/15 text-accent border-accent/30">{type.tag}</Badge>}
                    </div>
                    <CardDescription className="font-semibold text-foreground">{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{type.details}</p>
                    <Link to="/create" className="text-sm text-primary font-semibold inline-flex items-center group-hover:gap-2 gap-1 transition-all">
                      Lancer la création <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Other Structures */}
          <section>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge variant="secondary" className="mb-3">Autres structures</Badge>
              <h2 className="font-heading font-bold text-3xl text-foreground">Associations, ONG, coopératives & GIE</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {otherStructures.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.title} className="group text-center border-2 hover:border-primary hover:shadow-strong hover:-translate-y-1 transition-all">
                    <CardHeader>
                      <div className="mx-auto p-3 rounded-xl bg-primary/10 w-fit mb-2 group-hover:bg-primary transition-colors">
                        <Icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                      </div>
                      <CardTitle>{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Legal Documents */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-primary/10"><FileText className="h-6 w-6 text-primary" /></div>
              <div>
                <Badge variant="secondary" className="mb-2">Documents juridiques</Badge>
                <h2 className="font-heading font-bold text-3xl text-foreground">Rédaction par des juristes certifiés</h2>
              </div>
            </div>
            <Card className="border-2">
              <CardContent className="p-6 lg:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {legalDocuments.map((doc) => (
                    <div key={doc} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Complementary Services */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-primary/10"><ShieldCheck className="h-6 w-6 text-primary" /></div>
              <div>
                <Badge variant="secondary" className="mb-2">Formalités incluses</Badge>
                <h2 className="font-heading font-bold text-3xl text-foreground">Toutes les démarches officielles</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {complementaryServices.map((service) => (
                <Card key={service.title} className="hover:shadow-soft hover:border-primary transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-primary">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section>
            <div className="bg-gradient-hero rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white shadow-premium">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">Lancez votre projet dès maintenant</h2>
              <p className="text-white/85 max-w-2xl mx-auto mb-2">
                Devis personnalisé en moins de 24h. Paiement sécurisé Mobile Money, carte et virement.
              </p>
              <p className="text-sm text-white/70 mb-8">💳 Toutes les démarches incluses dans nos packs</p>
              <Link to="/create"><Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base px-8 h-12">
                Soumettre ma demande <ArrowRight className="ml-2 h-5 w-5" />
              </Button></Link>
            </div>
          </section>

          {/* Additional */}
          <section>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge variant="secondary" className="mb-3">Services additionnels</Badge>
              <h2 className="font-heading font-bold text-3xl text-foreground">Pour aller plus loin</h2>
              <p className="text-muted-foreground mt-3">Prestations complémentaires sur devis pour accompagner votre croissance.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {additional.map((svc) => {
                const Icon = svc.icon;
                return (
                  <Card key={svc.title} className="group border-2 hover:border-primary hover:shadow-strong hover:-translate-y-1 transition-all">
                    <CardHeader>
                      <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2 group-hover:bg-primary transition-colors">
                        <Icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                      </div>
                      <CardTitle className="text-primary">{svc.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{svc.desc}</p>
                      <Link to="/service-request"><Button className="w-full" size="sm">Soumettre ma demande</Button></Link>
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
