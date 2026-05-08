import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { publicTrackingSchema } from "@/lib/validations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Package, Clock, CheckCircle, CreditCard, AlertCircle } from "lucide-react";

interface RequestStatus {
  id: string;
  type: string;
  tracking_number?: string;
  status: string;
  created_at: string;
  company_name?: string;
  service_type?: string;
  contact_name: string;
  payment_status?: string;
  estimated_price?: number;
}

const PublicTracking = () => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState<RequestStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: t('status.pending', 'En attente'), variant: "outline" },
      in_progress: { label: t('status.inProgress', 'En cours'), variant: "default" },
      payment_pending: { label: t('status.unpaid', 'En attente de paiement'), variant: "secondary" },
      payment_confirmed: { label: t('status.paid', 'Paiement confirmé'), variant: "default" },
      completed: { label: t('status.completed', 'Terminé'), variant: "default" },
      cancelled: { label: t('status.rejected', 'Annulé'), variant: "destructive" }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string | undefined) => {
    if (!status || status === 'pending' || !['approved', 'completed'].includes(status)) {
      return <Badge variant="destructive">{t('status.unpaid', 'Non payé')}</Badge>;
    }
    return <Badge className="bg-green-500">{t('status.paid', 'Payé')}</Badge>;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = publicTrackingSchema.safeParse({ phone });
    if (!validation.success) {
      toast({
        title: t('common.error', 'Erreur de validation'),
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(false);

    try {
      // Use secure edge function with rate limiting
      const { data, error } = await supabase.functions.invoke('secure-public-tracking', {
        body: { phone }
      });

      if (error) {
        if (error.message?.includes('Too many requests')) {
          toast({
            title: "Trop de tentatives",
            description: "Vous avez effectué trop de recherches. Veuillez réessayer plus tard.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      const allRequests = data?.requests || [];
      setRequests(allRequests);
      setSearched(true);

      if (allRequests.length === 0) {
        toast({
          title: t('tracking.noRequestsFound', 'Aucun dossier trouvé'),
          description: t('tracking.noRequestsFoundDesc', 'Aucun dossier actif n\'est associé à ce numéro.'),
        });
      }

    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast({
        title: t('common.error', 'Erreur'),
        description: "Impossible de récupérer vos dossiers. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isPaid = (status: string | undefined) => {
    return status === 'approved' || status === 'completed';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <Package className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading font-bold text-4xl text-foreground mb-4">
              {t('tracking.title', 'Suivre mon dossier')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('tracking.enterPhone', 'Entrez votre numéro de téléphone pour consulter l\'état de vos dossiers')}
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('tracking.yourRequests', 'Rechercher vos dossiers')}</CardTitle>
              <CardDescription>
                Utilisez le numéro de téléphone que vous avez fourni lors de votre demande
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="phone">{t('form.phone', 'Numéro de téléphone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t('tracking.phonePlaceholder', '+225 XX XX XX XX XX')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? t('common.loading', 'Recherche...') : t('tracking.search', 'Rechercher mes dossiers')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {searched && requests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">{t('tracking.yourRequests', 'Vos dossiers')} ({requests.length})</h2>
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {request.type === 'company' ? t('dashboard.companyCreation', 'Création d\'entreprise') : 'Demande de service'}
                        </CardTitle>
                        <CardDescription>
                          {request.tracking_number && (
                            <span className="font-mono">{request.tracking_number}</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(request.status)}
                        {getPaymentStatusBadge(request.payment_status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('form.name', 'Nom du contact')}</p>
                        <p className="font-medium">{request.contact_name}</p>
                      </div>
                      {request.company_name && (
                        <div>
                          <p className="text-muted-foreground">{t('form.company', 'Entreprise')}</p>
                          <p className="font-medium">{request.company_name}</p>
                        </div>
                      )}
                      {request.service_type && (
                        <div>
                          <p className="text-muted-foreground">Type de service</p>
                          <p className="font-medium">{request.service_type}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">{t('common.date', 'Date de création')}</p>
                        <p className="font-medium">
                          {new Date(request.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      {request.estimated_price && (
                        <div>
                          <p className="text-muted-foreground">{t('common.amount', 'Montant')}</p>
                          <p className="font-medium text-primary">{request.estimated_price.toLocaleString()} FCFA</p>
                        </div>
                      )}
                    </div>
                    
                    {request.status === 'completed' && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Votre dossier est terminé !</span>
                      </div>
                    )}
                    
                    {!isPaid(request.payment_status) && request.estimated_price && request.estimated_price > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center gap-2 text-orange-700 dark:text-orange-300">
                          <AlertCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">{t('status.unpaid', 'En attente de paiement')}</span>
                        </div>
                        <Link to="/auth" className="block">
                          <Button className="w-full bg-accent hover:bg-accent/90">
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('tracking.loginRequired', 'Connectez-vous pour payer')}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searched && requests.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('tracking.noRequestsFound', 'Aucun dossier trouvé')}</h3>
                <p className="text-muted-foreground">
                  {t('tracking.noRequestsFoundDesc', 'Aucun dossier n\'est associé à ce numéro de téléphone.')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicTracking;
