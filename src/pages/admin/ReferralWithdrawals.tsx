import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  Check, 
  X, 
  Clock, 
  Download,
  Search,
  Filter,
  Users,
  TrendingUp,
  DollarSign
} from "lucide-react";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_details: any;
  requested_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  user_profile?: {
    full_name: string | null;
    phone: string | null;
  };
}

const ReferralWithdrawals = () => {
  const { t } = useTranslation();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'admin')) {
      navigate("/auth");
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_withdrawals')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each withdrawal
      const withdrawalsWithProfiles = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('user_id', withdrawal.user_id)
            .single();
          
          return {
            ...withdrawal,
            user_profile: profile || { full_name: null, phone: null }
          };
        })
      );

      setWithdrawals(withdrawalsWithProfiles as any);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (action: 'approved' | 'rejected' | 'paid') => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('referral_withdrawals')
        .update({
          status: action,
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      // If approved or paid, update user's earnings
      if (action === 'paid') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            referral_earnings: 0 // Reset after payment
          })
          .eq('user_id', selectedWithdrawal.user_id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Succès",
        description: action === 'approved' 
          ? "Demande approuvée" 
          : action === 'rejected' 
            ? "Demande rejetée" 
            : "Paiement effectué"
      });

      setDialogOpen(false);
      setSelectedWithdrawal(null);
      setAdminNotes("");
      fetchWithdrawals();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500 text-white"><Check className="w-3 h-3 mr-1" /> Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Rejeté</Badge>;
      case 'paid':
        return <Badge className="bg-green-500 text-white"><DollarSign className="w-3 h-3 mr-1" /> Payé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = !searchQuery || 
      w.user_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.user_profile?.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    paid: withdrawals.filter(w => w.status === 'paid').length,
    totalAmount: withdrawals.filter(w => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0),
    pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0)
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Retraits Parrainage</h1>
            <p className="text-muted-foreground mt-1">Validez et gérez les demandes de retrait des parrains</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total demandes</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">{stats.pendingAmount.toLocaleString()} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payés</p>
                  <p className="text-2xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Wallet className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total payé</p>
                  <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="pending">En attente</TabsTrigger>
                  <TabsTrigger value="approved">Approuvés</TabsTrigger>
                  <TabsTrigger value="paid">Payés</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Liste des demandes de retrait</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune demande de retrait
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Date demande</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{withdrawal.user_profile?.full_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{withdrawal.user_profile?.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{withdrawal.amount.toLocaleString()} FCFA</TableCell>
                        <TableCell>{withdrawal.payment_method || 'Non spécifié'}</TableCell>
                        <TableCell>
                          {new Date(withdrawal.requested_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setAdminNotes(withdrawal.admin_notes || "");
                              setDialogOpen(true);
                            }}
                          >
                            Gérer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Traiter la demande de retrait</DialogTitle>
            </DialogHeader>
            
            {selectedWithdrawal && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utilisateur</span>
                    <span className="font-medium">{selectedWithdrawal.user_profile?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-medium">{selectedWithdrawal.user_profile?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant</span>
                    <span className="font-bold text-lg">{selectedWithdrawal.amount.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Méthode</span>
                    <span>{selectedWithdrawal.payment_method || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut actuel</span>
                    {getStatusBadge(selectedWithdrawal.status)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes administrateur</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ajouter des notes (optionnel)..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedWithdrawal?.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleProcess('rejected')}
                    disabled={processing}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => handleProcess('approved')}
                    disabled={processing}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                </>
              )}
              {selectedWithdrawal?.status === 'approved' && (
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleProcess('paid')}
                  disabled={processing}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Marquer comme payé
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ReferralWithdrawals;
