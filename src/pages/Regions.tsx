import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Regions = () => {
  // Coordonnées uniques - Bureau à Grand-Bassam, couvrant tout le pays
  const mainOffice = {
    city: "Grand-Bassam",
    address: "Grand-Bassam, Côte d'Ivoire",
    phone: "+225 07 09 67 79 25",
    whatsapp: "+225 01 71 50 04 73",
    email: "support@legalform.ci"
  };

  const regions = [
    {
      name: "Abidjan (Lagunes)",
      districts: ["Cocody", "Plateau", "Marcory", "Yopougon", "Abobo", "Adjamé", "Treichville", "Koumassi", "Port-Bouët", "Attécoubé"]
    },
    {
      name: "Yamoussoukro (Lacs)",
      districts: ["Yamoussoukro"]
    },
    {
      name: "Bouaké (Vallée du Bandama)",
      districts: ["Bouaké", "Katiola", "Dabakala", "Béoumi"]
    },
    {
      name: "Daloa (Sassandra-Marahoué)",
      districts: ["Daloa", "Issia", "Vavoua", "Zoukougbeu"]
    },
    {
      name: "San-Pédro (Bas-Sassandra)",
      districts: ["San-Pédro", "Sassandra", "Tabou"]
    },
    {
      name: "Korhogo (Savanes)",
      districts: ["Korhogo", "Ferkessédougou", "Boundiali", "Tingréla"]
    },
    {
      name: "Man (Montagnes)",
      districts: ["Man", "Danané", "Biankouma", "Zouan-Hounien"]
    },
    {
      name: "Abengourou (Comoé)",
      districts: ["Abengourou", "Agnibilékrou", "Bettié"]
    },
    {
      name: "Bondoukou (Zanzan)",
      districts: ["Bondoukou", "Bouna", "Tanda"]
    },
    {
      name: "Gagnoa (Gôh-Djiboua)",
      districts: ["Gagnoa", "Oumé", "Divo", "Lakota"]
    },
    {
      name: "Soubré (Nawa)",
      districts: ["Soubré", "Méagui", "Buyo"]
    },
    {
      name: "Séguéla (Worodougou)",
      districts: ["Séguéla", "Mankono", "Kani"]
    },
    {
      name: "Odienné (Denguélé)",
      districts: ["Odienné", "Minignan", "Samatiguila"]
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
              Nos Régions d'Intervention
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Legal Form est présent dans toute la Côte d'Ivoire pour vous accompagner au plus près de vos projets
            </p>
          </div>

          {/* Main Office Info */}
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="border-2 border-primary">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">Bureau Principal - Grand-Bassam</CardTitle>
                <CardDescription className="text-base">
                  Nous couvrons toute la Côte d'Ivoire depuis notre bureau à Grand-Bassam
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">{mainOffice.address}</p>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <a href={`tel:${mainOffice.phone}`} className="text-muted-foreground hover:text-primary">
                    {mainOffice.phone}
                  </a>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <a 
                    href={`https://wa.me/2250171500473`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-green-600"
                  >
                    WhatsApp Business: {mainOffice.whatsapp}
                  </a>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <a href={`mailto:${mainOffice.email}`} className="text-muted-foreground hover:text-primary">
                    {mainOffice.email}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Regions Grid */}
          <div className="mb-12">
            <h2 className="font-heading font-bold text-3xl text-foreground mb-6 text-center">
              Régions Couvertes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regions.map((region, index) => (
                <Card key={index} className="hover:shadow-strong transition-all hover:border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <MapPin className="h-5 w-5 mr-2" />
                      {region.name}
                    </CardTitle>
                    <CardDescription>
                      {region.districts.join(", ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/create">
                      <Button className="w-full" variant="outline">
                        Créer dans cette région
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-hero rounded-2xl p-12 text-center text-white">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
              Votre Région n'est pas listée ?
            </h2>
            <p className="text-lg mb-6 text-white/90">
              Contactez-nous ! Nous intervenons partout en Côte d'Ivoire
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Regions;
