import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DFEForm from "@/components/services/DFEForm";
import NCCForm from "@/components/services/NCCForm";
import CNPSForm from "@/components/services/CNPSForm";
import OtherServicesForm from "@/components/services/OtherServicesForm";
import AdditionalServiceForm from "@/components/services/AdditionalServiceForm";
import { FileText, ArrowLeft } from "lucide-react";

const ServiceRequest = () => {
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get('service');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactData, setContactData] = useState({
    contact_name: "",
    phone: "",
    email: "",
  });
  const [serviceDetails, setServiceDetails] = useState<any>({});
  
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentification requise",
        description: "Vous devez être connecté pour demander un service",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, loading, navigate, toast]);

  const services: Record<string, { label: string; price: number; isQuote?: boolean }> = {
    "dfe": { label: "DFE - Déclaration Fiscale d'Existence", price: 25000 },
    "ncc": { label: "NCC - Numéro Compte Contribuable", price: 25000 },
    "cnps": { label: "CNPS - Immatriculation", price: 25000 },
    "idu": { label: "IDU - Identification Unique", price: 25000 },
    "ntd": { label: "NTD - Numéro de Télédéclarant", price: 25000 },
    "domiciliation": { label: "Domiciliation commerciale", price: 50000 },
    "structuration": { label: "Structuration de Projet", price: 0, isQuote: true },
    "formation": { label: "Formation", price: 0, isQuote: true },
    "financement": { label: "Mobilisation de Financement", price: 0, isQuote: true },
    "digitale": { label: "Solutions Digitales", price: 0, isQuote: true },
    "identite": { label: "Identité Visuelle", price: 0, isQuote: true },
    "comptabilite": { label: "Comptabilité & Fiscalité", price: 0, isQuote: true },
  };

  const selectedServiceInfo = serviceParam ? services[serviceParam] : null;

  const handleServiceDetailsChange = (field: string, value: any) => {
    setServiceDetails({ ...serviceDetails, [field]: value });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive",
      });
      return;
    }

    if (!serviceParam || !selectedServiceInfo) {
      toast({
        title: "Service invalide",
        description: "Le service sélectionné n'existe pas",
        variant: "destructive",
      });
      return;
    }

    if (!contactData.contact_name || !contactData.email || !contactData.phone) {
      toast({
        title: "Informations requises",
        description: "Veuillez remplir toutes les informations de contact",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: requestData, error: requestError } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          service_type: serviceParam,
          service_category: serviceParam,
          contact_name: contactData.contact_name,
          contact_phone: contactData.phone,
          contact_email: contactData.email,
          details: serviceDetails,
          estimated_price: selectedServiceInfo.price,
          status: selectedServiceInfo.isQuote ? 'pending_quote' : 'pending',
        })
        .select()
        .single();

      if (requestError) {
        console.error('Erreur création demande:', requestError);
        throw new Error(requestError.message);
      }

      // All services: just save and redirect to dashboard
      toast({
        title: "Demande enregistrée",
        description: selectedServiceInfo.isQuote 
          ? "Nous vous contacterons sous peu avec un devis personnalisé"
          : "Votre demande a été enregistrée. Une facture vous sera envoyée après étude de votre dossier.",
      });
      navigate('/client/dashboard');
      
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const renderServiceForm = () => {
    switch (serviceParam) {
      case 'dfe':
        return <DFEForm formData={serviceDetails} onChange={handleServiceDetailsChange} />;
      case 'ncc':
        return <NCCForm formData={serviceDetails} onChange={handleServiceDetailsChange} />;
      case 'cnps':
        return <CNPSForm formData={serviceDetails} onChange={handleServiceDetailsChange} />;
      case 'idu':
      case 'ntd':
      case 'domiciliation':
        return <OtherServicesForm formData={serviceDetails} onChange={handleServiceDetailsChange} selectedService={serviceParam} />;
      case 'structuration':
      case 'formation':
      case 'financement':
      case 'digitale':
      case 'identite':
      case 'comptabilite':
        return <AdditionalServiceForm formData={serviceDetails} onChange={handleServiceDetailsChange} selectedService={serviceParam} />;
      default:
        return null;
    }
  };

  if (!serviceParam || !selectedServiceInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Service non trouvé</h1>
            <Button onClick={() => navigate('/services')}>Retour aux services</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/services')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux services
          </Button>

          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-foreground mb-4">
              {selectedServiceInfo.label}
            </h1>
            <p className="text-lg text-muted-foreground">
              {selectedServiceInfo.isQuote ? "Sur devis personnalisé" : `Prix: ${selectedServiceInfo.price.toLocaleString()} FCFA`}
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations de contact
              </CardTitle>
              <CardDescription>
                Remplissez vos coordonnées pour cette demande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contact_name">Nom complet *</Label>
                  <Input
                    id="contact_name"
                    value={contactData.contact_name}
                    onChange={(e) => setContactData({...contactData, contact_name: e.target.value})}
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => setContactData({...contactData, phone: e.target.value})}
                    placeholder="+225 0101010101"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData({...contactData, email: e.target.value})}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {renderServiceForm()}

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="bg-accent hover:bg-accent/90"
              >
                {isSubmitting ? "Traitement en cours..." : "Soumettre ma demande"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceRequest;
