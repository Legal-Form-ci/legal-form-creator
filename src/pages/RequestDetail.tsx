import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RequestMessaging from "@/components/RequestMessaging";
import RequestDocuments from "@/components/RequestDocuments";
import RequestRating from "@/components/RequestRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";

const RequestDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'company' | 'service';
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !id) {
      navigate('/auth');
      return;
    }
    loadRequest();
  }, [id, type, user]);

  const loadRequest = async () => {
    setLoading(true);
    try {
      const tableName = type === 'company' ? 'company_requests' : 'service_requests';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (error: any) {
      console.error('Error loading request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la demande",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRequest = async () => {
    if (!userRole || userRole !== 'admin') return;

    try {
      const tableName = type === 'company' ? 'company_requests' : 'service_requests';
      const { error } = await supabase
        .from(tableName)
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Dossier fermé",
        description: "Le dossier a été marqué comme terminé",
      });
      loadRequest();
    } catch (error: any) {
      console.error('Error closing request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de fermer le dossier",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <p className="text-center">Chargement...</p>
          </div>
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
          <div className="container mx-auto px-4">
            <p className="text-center">Demande introuvable</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending_quote': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'rejected': return 'Rejeté';
      case 'pending_quote': return 'Devis en attente';
      default: return status;
    }
  };

  const isCompleted = request.status === 'completed';
  const canRate = isCompleted && !request.client_rating;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate(userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Info */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">
                        {type === 'company' ? request.company_name || 'Création d\'entreprise' : 'Service ' + request.service_type}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        N° {request.tracking_number || request.id.slice(0, 8)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-semibold">{request.contact_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{request.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="font-semibold">{request.phone}</p>
                    </div>
                    {request.estimated_price && (
                      <div>
                        <p className="text-sm text-muted-foreground">Prix estimé</p>
                        <p className="font-semibold">{request.estimated_price.toLocaleString()} FCFA</p>
                      </div>
                    )}
                  </div>

                  {userRole === 'admin' && request.status !== 'completed' && (
                    <Button
                      onClick={handleCloseRequest}
                      variant="outline"
                      className="w-full"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Clôturer ce dossier
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Messaging */}
              <RequestMessaging requestId={id!} requestType={type} />

              {/* Documents */}
              <RequestDocuments requestId={id!} requestType={type} />
            </div>

            {/* Right Column - Rating */}
            <div>
              {canRate && (
                <RequestRating
                  requestId={id!}
                  requestType={type}
                  existingRating={request.client_rating}
                  existingReview={request.client_review}
                  onRatingSubmitted={loadRequest}
                />
              )}
              
              {request.client_rating && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Évaluation client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold mb-2">
                      {request.client_rating} / 5 ⭐
                    </p>
                    {request.client_review && (
                      <p className="text-sm text-muted-foreground">
                        {request.client_review}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RequestDetail;
