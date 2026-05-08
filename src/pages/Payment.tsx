import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKkiapay, KkiapaySuccessResponse } from "@/hooks/useKkiapay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  CreditCard, 
  Building2, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  Receipt,
  Smartphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RequestDetails {
  id: string;
  tracking_number: string;
  company_name?: string;
  service_type?: string;
  estimated_price: number;
  payment_status: string | null;
  status: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  contact_email?: string;
  contact_phone?: string;
  type: 'company' | 'service';
}

const Payment = () => {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const requestType = searchParams.get('type') || 'company';
  
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle payment success
  const handlePaymentSuccess = useCallback(async (response: KkiapaySuccessResponse) => {
    console.log('Payment successful:', response);
    setProcessing(true);
    
    try {
      // Update payment status in database
      const { error } = await supabase.functions.invoke('verify-kkiapay-payment', {
        body: {
          transactionId: response.transactionId,
          requestId: request?.id,
          requestType: request?.type,
          amount: request?.estimated_price
        }
      });

      if (error) {
        console.error('Verification error:', error);
        // Still show success as payment was made
      }

      toast({
        title: "Paiement réussi !",
        description: "Votre paiement a été effectué avec succès.",
      });

      // Redirect to success page or dashboard
      navigate('/payment/callback?status=success&transaction_id=' + response.transactionId);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Paiement reçu",
        description: "Le paiement a été effectué. Mise à jour en cours...",
      });
      navigate('/payment/callback?status=success&transaction_id=' + response.transactionId);
    } finally {
      setProcessing(false);
    }
  }, [request, toast, navigate]);

  const handlePaymentFailed = useCallback((error: any) => {
    console.error('Payment failed:', error);
    setProcessing(false);
    toast({
      title: "Paiement échoué",
      description: "Le paiement n'a pas pu être effectué. Veuillez réessayer.",
      variant: "destructive",
    });
  }, [toast]);

  const handlePaymentClose = useCallback(() => {
    console.log('Payment widget closed');
    setProcessing(false);
  }, []);

  const { openPayment, isReady } = useKkiapay({
    onSuccess: handlePaymentSuccess,
    onFailed: handlePaymentFailed,
    onClose: handlePaymentClose,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentification requise",
        description: "Vous devez être connecté pour effectuer un paiement",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (user && requestId) {
      fetchRequest();
    }
  }, [user, authLoading, requestId, requestType]);

  const fetchRequest = async () => {
    try {
      const tableName = requestType === 'service' ? 'service_requests' : 'company_requests';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', requestId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        const record = data as any;
        setRequest({
          id: record.id,
          tracking_number: record.tracking_number || '',
          company_name: record.company_name || record.service_type,
          service_type: record.service_type,
          estimated_price: record.estimated_price || 0,
          payment_status: record.payment_status,
          status: record.status,
          contact_name: record.contact_name,
          email: record.email || record.contact_email,
          phone: record.phone || record.contact_phone,
          contact_email: record.contact_email,
          contact_phone: record.contact_phone,
          type: requestType as 'company' | 'service'
        });
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la demande",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!request || !user) return;

    setProcessing(true);

    try {
      const customerEmail = request.email || request.contact_email || user.email || '';
      const customerName = request.contact_name || 'Client';
      const customerPhone = request.phone || request.contact_phone || '';

      // Create a pending payment record first
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          request_id: request.id,
          request_type: request.type,
          amount: request.estimated_price,
          currency: 'XOF',
          status: 'pending',
          provider: 'fedapay',
          metadata: {
            customer_email: customerEmail,
            customer_name: customerName,
            customer_phone: customerPhone,
            tracking_number: request.tracking_number,
            description: `Paiement ${request.type === 'company' ? 'création entreprise' : 'service'} - ${request.tracking_number}`
          }
        });

      if (insertError) {
        console.error('Error creating payment record:', insertError);
      }

      // Open KkiaPay widget
      const success = openPayment({
        amount: request.estimated_price,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        partnerId: request.id,
        data: {
          request_id: request.id,
          request_type: request.type,
          tracking_number: request.tracking_number
        }
      });

      if (!success) {
        throw new Error('Impossible d\'ouvrir le widget de paiement');
      }
    } catch (error: any) {
      console.error('Erreur paiement:', error);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur est survenue lors de l'initialisation du paiement",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-500">Payé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'failed':
      case 'canceled':
        return <Badge className="bg-red-500">Échoué</Badge>;
      default:
        return <Badge variant="outline">Non payé</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Demande introuvable</h1>
            <p className="text-muted-foreground mb-4">Cette demande n'existe pas ou ne vous appartient pas.</p>
            <Button onClick={() => navigate('/client/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPaid = request.payment_status === 'approved' || request.payment_status === 'completed';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/client/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <div className="text-center mb-8">
            <CreditCard className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
              Paiement
            </h1>
            <p className="text-muted-foreground">
              Finalisez le paiement de votre demande
            </p>
          </div>

          {isPaid ? (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
                    Paiement effectué
                  </h2>
                  <p className="text-green-600 dark:text-green-300 mb-4">
                    Votre paiement a été reçu avec succès. Nous traitons votre demande.
                  </p>
                  <Button onClick={() => navigate('/client/dashboard')}>
                    Voir ma demande
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle>{request.company_name || request.service_type}</CardTitle>
                        <CardDescription>{request.tracking_number}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(request.payment_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">
                        {request.type === 'company' ? 'Création entreprise' : 'Service additionnel'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Statut:</span>
                      <p className="font-medium capitalize">{request.status}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {(request.email || request.contact_email) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{request.email || request.contact_email}</span>
                      </div>
                    )}
                    {(request.phone || request.contact_phone) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{request.phone || request.contact_phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                        <span className="text-lg">Montant à payer</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {request.estimated_price.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Méthodes de paiement</CardTitle>
                  <CardDescription>
                    Paiement sécurisé via KkiaPay - Mobile Money & Cartes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="p-3 border rounded-lg text-center">
                      <Smartphone className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                      <span className="text-xs font-medium">MTN</span>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <Smartphone className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                      <span className="text-xs font-medium">Orange</span>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <Smartphone className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <span className="text-xs font-medium">Moov</span>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <CreditCard className="h-5 w-5 mx-auto mb-1 text-blue-700" />
                      <span className="text-xs font-medium">Visa/MC</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={processing || !isReady}
                    className="w-full bg-accent hover:bg-accent/90"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payer {request.estimated_price.toLocaleString()} FCFA
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    En cliquant sur "Payer", vous serez redirigé vers la page de paiement sécurisée KkiaPay.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
