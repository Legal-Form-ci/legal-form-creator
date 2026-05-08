import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Building2, 
  User, 
  MapPin, 
  FileText, 
  MessageSquare,
  CreditCard,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  Users
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import RequestMessaging from "@/components/RequestMessaging";
import RequestDocuments from "@/components/RequestDocuments";

interface CompanyRequest {
  id: string;
  structure_type: string;
  company_name: string | null;
  capital: string | null;
  activity: string | null;
  region: string | null;
  city: string | null;
  address: string | null;
  contact_name: string;
  phone: string;
  email: string;
  status: string;
  payment_status: string | null;
  estimated_price: number | null;
  additional_services: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Associate {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  marital_status: string | null;
  marital_regime: string | null;
  residence_address: string | null;
  profession: string | null;
  shares_count: number | null;
  shares_percentage: number | null;
}

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState<CompanyRequest | null>(null);
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRequest();
      fetchAssociates();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('company_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data as any);
    } catch (error) {
      console.error('Error fetching request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la demande",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociates = async () => {
    try {
      const { data, error } = await supabase
        .from('company_associates')
        .select('*')
        .eq('company_request_id', id);

      if (error) throw error;
      setAssociates((data as any) || []);
    } catch (error) {
      console.error('Error fetching associates:', error);
    }
  };

  const updateStatus = async (status: string) => {
    if (!request) return;
    
    try {
      const { error } = await supabase
        .from('company_requests')
        .update({ status })
        .eq('id', request.id);

      if (error) throw error;

      toast({ title: "Succès", description: "Statut mis à jour" });
      fetchRequest();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'rejected': return 'Rejeté';
      default: return status || 'Inconnu';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!request) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-slate-400">Demande introuvable</p>
          <Button onClick={() => navigate('/admin/companies')} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/admin/companies')}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                {request.company_name || 'Création d\'entreprise'}
                <Badge className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </h1>
              <p className="text-slate-400 mt-1">
                N° {request.id.slice(0, 8).toUpperCase()} • {request.structure_type.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Download className="mr-2 h-4 w-4" />
              Générer PDF
            </Button>
          </div>
        </div>

        {/* Status Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-slate-400 mr-4">Changer le statut :</span>
              <Button 
                size="sm" 
                variant={request.status === 'pending' ? 'default' : 'outline'}
                onClick={() => updateStatus('pending')}
                className={request.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : 'border-slate-600 text-slate-300'}
              >
                <Clock className="mr-1 h-3 w-3" /> En attente
              </Button>
              <Button 
                size="sm" 
                variant={request.status === 'in_progress' ? 'default' : 'outline'}
                onClick={() => updateStatus('in_progress')}
                className={request.status === 'in_progress' ? 'bg-blue-500 hover:bg-blue-600' : 'border-slate-600 text-slate-300'}
              >
                <Clock className="mr-1 h-3 w-3" /> En cours
              </Button>
              <Button 
                size="sm" 
                variant={request.status === 'completed' ? 'default' : 'outline'}
                onClick={() => updateStatus('completed')}
                className={request.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : 'border-slate-600 text-slate-300'}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Terminé
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="info" className="data-[state=active]:bg-primary">
              <Building2 className="mr-2 h-4 w-4" /> Informations
            </TabsTrigger>
            <TabsTrigger value="associates" className="data-[state=active]:bg-primary">
              <Users className="mr-2 h-4 w-4" /> Associés ({associates.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-primary">
              <FileText className="mr-2 h-4 w-4" /> Documents
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary">
              <MessageSquare className="mr-2 h-4 w-4" /> Messagerie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Info */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Informations de l'entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Forme juridique</p>
                      <p className="text-white font-medium">{request.structure_type.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Dénomination</p>
                      <p className="text-white font-medium">{request.company_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Capital</p>
                      <p className="text-white font-medium">{request.capital ? `${parseInt(request.capital).toLocaleString()} FCFA` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Date de demande</p>
                      <p className="text-white font-medium">{new Date(request.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Activités</p>
                    <p className="text-white">{request.activity || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Contact principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Nom complet</p>
                      <p className="text-white font-medium">{request.contact_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Téléphone</p>
                      <p className="text-white font-medium">{request.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="text-white font-medium">{request.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Info */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Région</p>
                      <p className="text-white font-medium">{request.region}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Ville</p>
                      <p className="text-white font-medium">{request.city || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Adresse complète</p>
                    <p className="text-white">{request.address}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Montant estimé</p>
                      <p className="text-2xl font-bold text-white">
                        {request.estimated_price ? `${request.estimated_price.toLocaleString()} FCFA` : 'Sur devis'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Statut paiement</p>
                      <Badge className={request.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {request.payment_status === 'paid' ? 'Payé' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="associates">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Liste des associés</CardTitle>
                <CardDescription className="text-slate-400">
                  {associates.length} associé(s) enregistré(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {associates.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Aucun associé enregistré</p>
                ) : (
                  <div className="space-y-4">
                    {associates.map((associate, index) => (
                      <Card key={associate.id} className="bg-slate-700 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-white flex items-center gap-2">
                                {associate.full_name}
                              </h4>
                              <p className="text-sm text-slate-400">Associé #{index + 1}</p>
                            </div>
                            {associate.shares_percentage && (
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{associate.shares_percentage}%</p>
                                <p className="text-xs text-slate-400">{associate.shares_count || 0} parts</p>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Téléphone</p>
                              <p className="text-white">{associate.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Email</p>
                              <p className="text-white">{associate.email || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Profession</p>
                              <p className="text-white">{associate.profession || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Situation</p>
                              <p className="text-white">{associate.marital_status || 'N/A'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <RequestDocuments requestId={request.id} requestType="company" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <RequestMessaging requestId={request.id} requestType="company" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default CompanyDetail;
