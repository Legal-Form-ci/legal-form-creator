import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LogOut, Building2, Briefcase, DollarSign, Users } from "lucide-react";

interface CompanyRequest {
  id: string;
  structure_type: string;
  company_name: string;
  region: string | null;
  contact_name: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
  estimated_price: number | null;
  payment_status?: string | null;
}

interface ServiceRequest {
  id: string;
  service_type: string;
  company_name: string | null;
  status: string;
  created_at: string;
  estimated_price: number | null;
  payment_status?: string | null;
  user_id: string;
}

const UnifiedDashboard = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyRequests, setCompanyRequests] = useState<CompanyRequest[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("companies");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userRole !== 'admin') {
        navigate("/client/dashboard");
      }
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchAllData();
    }
  }, [user, userRole]);

  const fetchAllData = async () => {
    await Promise.all([fetchCompanyRequests(), fetchServiceRequests()]);
    setLoadingData(false);
  };

  const fetchCompanyRequests = async () => {
    const { data, error } = await supabase
      .from('company_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCompanyRequests(data);
    }
  };

  const fetchServiceRequests = async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setServiceRequests((data as any) || []);
    }
  };

  const updateCompanyStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('company_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Statut mis à jour",
    });

    fetchCompanyRequests();
  };

  const updateServiceStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Statut mis à jour",
    });

    fetchServiceRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_quote':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'pending_quote':
        return 'Devis en attente';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return <Badge className="bg-yellow-500">En attente</Badge>;
    }
    if (status === 'paid') {
      return <Badge className="bg-green-500">Payé</Badge>;
    }
    return <Badge variant="destructive">Non payé</Badge>;
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dfe: "DFE",
      ncc: "NCC",
      cnps: "CNPS",
      idu: "IDU",
      ntd: "NTD",
      domiciliation: "Domiciliation",
      structuration: "Structuration",
      formation: "Formation",
      financement: "Financement",
      digitale: "Solutions Digitales",
      identite: "Identité Visuelle",
      comptabilite: "Comptabilité",
    };
    return labels[type] || type;
  };

  const totalRevenue = [...companyRequests, ...serviceRequests].reduce((sum, req) => sum + (req.estimated_price || 0), 0);
  const paidRevenue = [...companyRequests, ...serviceRequests]
    .filter(req => req.payment_status === 'paid')
    .reduce((sum, req) => sum + (req.estimated_price || 0), 0);

  if (loading || loadingData) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-heading font-bold text-4xl text-foreground mb-2">
                Tableau de bord Admin
              </h1>
              <p className="text-muted-foreground">
                Gérez toutes les demandes et services
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/users')}>
                <Users className="mr-2 h-4 w-4" />
                Utilisateurs
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Créations d'entreprise</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyRequests.length}</div>
                <p className="text-xs text-muted-foreground">demandes totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services additionnels</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{serviceRequests.length}</div>
                <p className="text-xs text-muted-foreground">demandes totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paidRevenue.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">sur {totalRevenue.toLocaleString()} FCFA</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="companies">Créations d'entreprise</TabsTrigger>
              <TabsTrigger value="services">Services additionnels</TabsTrigger>
            </TabsList>

            <TabsContent value="companies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Demandes de création d'entreprise</CardTitle>
                  <CardDescription>
                    {companyRequests.length} demande(s) au total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Suivi</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Région</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Paiement</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companyRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell>{request.structure_type.toUpperCase()}</TableCell>
                            <TableCell>{request.company_name || 'N/A'}</TableCell>
                            <TableCell>{request.region || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{request.contact_name}</div>
                                <div className="text-muted-foreground">{request.phone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(request.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(request.payment_status)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusLabel(request.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={request.status}
                                onValueChange={(value) => updateCompanyStatus(request.id, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">En attente</SelectItem>
                                  <SelectItem value="in_progress">En cours</SelectItem>
                                  <SelectItem value="completed">Terminé</SelectItem>
                                  <SelectItem value="rejected">Rejeté</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Demandes de services additionnels</CardTitle>
                  <CardDescription>
                    {serviceRequests.length} demande(s) au total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Suivi</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Paiement</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell>{getServiceTypeLabel(request.service_type)}</TableCell>
                            <TableCell>{request.company_name || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="text-muted-foreground">ID: {request.user_id.slice(0, 8)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(request.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              {request.estimated_price > 0 
                                ? `${request.estimated_price.toLocaleString()} FCFA`
                                : 'Sur devis'
                              }
                            </TableCell>
                            <TableCell>
                              {request.estimated_price > 0 
                                ? getPaymentStatusBadge(request.payment_status)
                                : <Badge variant="outline">Devis requis</Badge>
                              }
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusLabel(request.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={request.status}
                                onValueChange={(value) => updateServiceStatus(request.id, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">En attente</SelectItem>
                                  <SelectItem value="pending_quote">Devis en attente</SelectItem>
                                  <SelectItem value="in_progress">En cours</SelectItem>
                                  <SelectItem value="completed">Terminé</SelectItem>
                                  <SelectItem value="rejected">Rejeté</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UnifiedDashboard;
