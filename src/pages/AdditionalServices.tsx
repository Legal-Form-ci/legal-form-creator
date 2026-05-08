import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DFEForm from "@/components/services/DFEForm";
import NCCForm from "@/components/services/NCCForm";
import CNPSForm from "@/components/services/CNPSForm";
import OtherServicesForm from "@/components/services/OtherServicesForm";
import { FileText, ArrowLeft } from "lucide-react";

const AdditionalServices = () => {
  const [selectedService, setSelectedService] = useState("");
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

  const services = [
    { value: "dfe", label: "DFE - Déclaration Fiscale d'Existence", price: 25000 },
    { value: "ncc", label: "NCC - Numéro Compte Contribuable", price: 25000 },
    { value: "cnps", label: "CNPS - Immatriculation", price: 25000 },
    { value: "idu", label: "IDU - Identification Unique", price: 25000 },
    { value: "ntd", label: "NTD - Numéro de Télédéclarant", price: 25000 },
    { value: "domiciliation", label: "Domiciliation commerciale", price: 50000 },
  ];

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

    if (!selectedService) {
      toast({
        title: "Service requis",
        description: "Veuillez sélectionner un service",
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
      const selectedServiceInfo = services.find(s => s.value === selectedService);
      
      // Create service request with correct column names
      const { data: requestData, error: requestError } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          service_type: selectedService,
          service_category: 'additional',
          contact_name: contactData.contact_name,
          contact_phone: contactData.phone,
          contact_email: contactData.email,
          details: { company_name: serviceDetails.company_name || null, description: `Service: ${selectedServiceInfo?.label}`, ...serviceDetails },
          estimated_price: selectedServiceInfo?.price || 25000,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) {
        console.error('Erreur création demande:', requestError);
        throw new Error(requestError.message);
      }

      // Initiate payment with requestType: 'service'
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: selectedServiceInfo?.price || 25000,
          description: `Service: ${selectedServiceInfo?.label}`,
          requestId: requestData.id,
          requestType: 'service',
          customerEmail: contactData.email,
          customerName: contactData.contact_name,
          customerPhone: contactData.phone
        }
      });

      if (paymentError) {
        console.error('Erreur paiement:', paymentError);
        throw new Error(paymentError.message || 'Erreur lors de la création du paiement');
      }

      toast({
        title: "Demande enregistrée",
        description: "Redirection vers la page de paiement...",
      });

      // Redirect to payment
      if (paymentData?.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
      }
      
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
    switch (selectedService) {
      case 'dfe':
        return <DFEForm formData={serviceDetails} onChange={handleServiceDetailsChange} />;
      case 'ncc':
        return <NCCForm formData={serviceDetails} onChange={handleServiceDetailsChange} />;
      case 'cnps':
        return <CNPSForm formData={serviceDetails} onChange={handleServiceDetailsChange} />;
      case 'idu':
      case 'ntd':
      case 'domiciliation':
        return <OtherServicesForm formData={serviceDetails} onChange={handleServiceDetailsChange} selectedService={selectedService} />;
      default:
        return null;
    }
  };

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
              Services Additionnels
            </h1>
            <p className="text-lg text-muted-foreground">
              Demandez un service complémentaire pour votre entreprise
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sélectionner un service
              </CardTitle>
              <CardDescription>
                Choisissez le service dont vous avez besoin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="service">Type de service *</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

          {selectedService && (
            <div className="space-y-6">
              {renderServiceForm()}

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  size="lg"
                  className="bg-accent hover:bg-accent/90"
                >
                  {isSubmitting ? "Traitement en cours..." : "Procéder au paiement"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdditionalServices;
