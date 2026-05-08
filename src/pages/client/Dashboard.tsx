import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardWelcome from "@/components/DashboardWelcome";
import ReferralSection from "@/components/ReferralSection";
import { LogOut, Plus, FileText, Building2, Clock, CreditCard, MessageSquare, Eye, TrendingUp, CheckCircle2, Gift, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useClientRealtimeNotifications } from "@/hooks/useClientRealtimeNotifications";

const ClientInvoices = ({ userId }: { userId?: string }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;
    const fetchInvoices = async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setInvoices(data || []);
      setLoading(false);
    };
    fetchInvoices();
  }, [userId]);

  const handlePay = async (invoice: any) => {
    setPayingId(invoice.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-fedapay-payment', {
        body: { invoiceId: invoice.id }
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast({ title: "Erreur", description: "Impossible de générer le lien de paiement", variant: "destructive" });
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({ title: "Erreur de paiement", description: err.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>;

  if (invoices.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6 text-center py-12">
          <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Aucune facture pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="border-2 hover:border-primary transition-all">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                <CardDescription>{invoice.description || 'Facture'}</CardDescription>
              </div>
              <Badge className={invoice.status === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                {invoice.status === 'paid' ? 'Payée' : 'En attente'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat('fr-FR').format(invoice.amount)} FCFA
              </div>
              <div className="flex gap-2">
                {invoice.status !== 'paid' && (
                  <Button size="sm" onClick={() => handlePay(invoice)} disabled={payingId === invoice.id}>
                    {payingId === invoice.id ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Chargement...</>
                    ) : (
                      <><CreditCard className="mr-2 h-4 w-4" />Payer via FedaPay</>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Détails
                </Button>
              </div>
            </div>
            {invoice.due_date && (
              <p className="text-sm text-muted-foreground mt-2">
                Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface Request {
  id: string;
  status: string;
  created_at: string;
  estimated_price: number | null;
  payment_status?: string | null;
  company_name: string | null;
  structure_type?: string;
  region?: string | null;
  service_type?: string;
  type: 'company' | 'service';
  tracking_number?: string;
}

const ClientDashboard = () => {
  const { t } = useTranslation();
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    // Wait for loading to complete
    if (loading) return;
    
    // Only redirect if we have confirmed user status
    if (!user) {
      console.log('[ClientDashboard] No user, redirecting to auth');
      navigate("/auth", { replace: true });
      return;
    }
    
    if (userRole !== null && (userRole === 'admin' || userRole === 'team')) {
      console.log('[ClientDashboard] User is admin/team, redirecting to admin dashboard');
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingRequests(true);
      const { data: companyData, error: companyError } = await supabase
        .from('company_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (companyError) throw companyError;

      const { data: serviceData, error: serviceError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (serviceError) throw serviceError;

      const companyRequests = (companyData || []).map(r => ({ ...r, type: 'company' as const }));
      const serviceRequests = (serviceData || []).map(r => ({ ...r, type: 'service' as const }));
      
      const allRequests = [...companyRequests, ...serviceRequests].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRequests(allRequests as any);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast({
        title: t('dashboard.error', 'Erreur'),
        description: t('dashboard.errorLoading', 'Impossible de charger vos demandes'),
        variant: "destructive",
      });
    } finally {
      setLoadingRequests(false);
    }
  }, [user, toast, t]);

  useClientRealtimeNotifications({
    userId: user?.id,
    onUpdate: fetchRequests
  });

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('status.pending', 'En attente');
      case 'in_progress': return t('status.inProgress', 'En cours');
      case 'completed': return t('status.completed', 'Terminé');
      case 'rejected': return t('status.rejected', 'Rejeté');
      default: return status;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 25;
      case 'in_progress': return 60;
      case 'completed': return 100;
      case 'rejected': return 0;
      default: return 10;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string | null | undefined) => {
    if (paymentStatus === 'approved') {
      return <Badge className="bg-green-500 text-white">{t('status.paid', 'Payé')}</Badge>;
    }
    return <Badge className="bg-yellow-500 text-white">{t('status.unpaid', 'Non payé')}</Badge>;
  };

  if (loading || loadingRequests) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('dashboard.loading', 'Chargement...')}</p>
        </div>
      </div>
    );
  }

  const totalPaid = requests.filter(r => r.payment_status === 'approved').reduce((sum, r) => sum + (r.estimated_price || 0), 0);
  const totalPending = requests.filter(r => !r.payment_status || r.payment_status === 'pending').reduce((sum, r) => sum + (r.estimated_price || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {user && <DashboardWelcome userId={user.id} />}
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8 mb-8">
            <div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-2">
                {t('dashboard.title', 'Mon Espace Client')}
              </h1>
              <p className="text-muted-foreground">
                {t('dashboard.subtitle', 'Suivez l\'avancement de vos dossiers')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/create")} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                {t('dashboard.newRequest', 'Nouvelle demande')}
              </Button>
              <Button variant="outline" onClick={() => navigate("/client/profile")}>
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </Button>
              <Button variant="outline" onClick={() => navigate("/client/messages")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('dashboard.logout', 'Déconnexion')}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-2">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{requests.length}</p>
                  <p className="text-sm text-muted-foreground">Demandes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length}
                  </p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Terminées</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalPaid.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">FCFA payé</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Mes demandes
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Factures
              </TabsTrigger>
              <TabsTrigger value="referral" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Parrainage
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="requests" className="mt-6">
              {requests.length === 0 ? (
                <Card className="border-2">
                  <CardContent className="pt-6 text-center py-12">
                    <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4 text-lg">
                      {t('dashboard.noRequests', 'Vous n\'avez pas encore de demande')}
                    </p>
                    <Button onClick={() => navigate("/create")} size="lg">
                      {t('dashboard.createFirst', 'Créer ma première entreprise')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {requests.map((request) => (
                    <Card 
                      key={request.id} 
                      className="border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer" 
                      onClick={() => navigate(`/request/${request.id}?type=${request.type}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">
                                {request.type === 'company' 
                                  ? (request.company_name || 'Création d\'entreprise') 
                                  : `Service ${request.service_type}`}
                              </CardTitle>
                              {getPaymentStatusBadge(request.payment_status)}
                            </div>
                            <CardDescription>
                              N° de suivi: <span className="font-semibold">{request.tracking_number || request.id.slice(0, 8).toUpperCase()}</span>
                            </CardDescription>
                          </div>
                          <Badge className={`${getStatusColor(request.status)} text-white`}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <Progress value={getStatusProgress(request.status)} className="h-2" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(!request.payment_status || request.payment_status === 'pending') && request.estimated_price && (
                            <Button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/payment/${request.id}?type=${request.type}`); }}
                              className="bg-accent hover:bg-accent/90"
                              size="sm"
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Payer
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/request/${request.id}?type=${request.type}`); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Détails
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/request/${request.id}?type=${request.type}#messages`); }}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Messages
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-6">
              <ClientInvoices userId={user?.id} />
            </TabsContent>
            
            <TabsContent value="referral" className="mt-6">
              {user && <ReferralSection userId={user.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
