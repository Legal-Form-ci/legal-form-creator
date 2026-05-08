import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  MoreHorizontal,
  FileText,
  MessageSquare,
  CreditCard,
  Printer
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from "./AdminLayout";
import { exportCompanyRequests } from "@/utils/exportUtils";

interface CompanyRequest {
  id: string;
  structure_type: string;
  company_name: string;
  region: string | null;
  city: string | null;
  contact_name: string;
  phone: string;
  email: string;
  status: string;
  payment_status: string | null;
  estimated_price: number | null;
  created_at: string;
}

const CompaniesManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, statusFilter, typeFilter]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('company_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.company_name?.toLowerCase().includes(query) ||
        r.contact_name.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.phone.includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(r => r.structure_type === typeFilter);
    }

    setFilteredRequests(filtered);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('company_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Succès", description: "Statut mis à jour" });
      fetchRequests();
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

  const getPaymentBadge = (status: string | null) => {
    if (status === 'paid') return <Badge className="bg-green-500">Payé</Badge>;
    return <Badge className="bg-yellow-500">En attente</Badge>;
  };

  const structureTypes = [
    { value: "ei", label: "Entreprise Individuelle" },
    { value: "sarl", label: "SARL" },
    { value: "sarlu", label: "SARLU" },
    { value: "sas", label: "SAS" },
    { value: "sasu", label: "SASU" },
    { value: "ong", label: "ONG" },
    { value: "association", label: "Association" },
    { value: "sci", label: "SCI" },
    { value: "gie", label: "GIE" },
  ];

  if (loading) {
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Créations d'entreprise</h1>
            <p className="text-slate-400 mt-1">{filteredRequests.length} demande(s) sur {requests.length}</p>
          </div>
          <Button 
            onClick={() => {
              exportCompanyRequests(requests);
              toast({ title: "Export CSV lancé", description: "Le fichier sera téléchargé automatiquement" });
            }} 
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, téléphone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {structureTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">N° Suivi</TableHead>
                    <TableHead className="text-slate-300">Entreprise</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Contact</TableHead>
                    <TableHead className="text-slate-300">Région</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Paiement</TableHead>
                    <TableHead className="text-slate-300">Statut</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                        Aucune demande trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow 
                        key={request.id} 
                        className="border-slate-700 hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => navigate(`/admin/company/${request.id}`)}
                      >
                        <TableCell className="font-medium text-white">
                          {request.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-white">
                          {request.company_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-500 text-slate-300">
                            {request.structure_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-white">{request.contact_name}</div>
                          <div className="text-sm text-slate-400">{request.phone}</div>
                        </TableCell>
                        <TableCell className="text-slate-300">{request.region}</TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{getPaymentBadge(request.payment_status)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={request.status || 'pending'}
                            onValueChange={(value) => updateStatus(request.id, value)}
                          >
                            <SelectTrigger className={`w-32 ${getStatusColor(request.status)} text-white border-0`}>
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem 
                                onClick={() => navigate(`/admin/company/${request.id}`)}
                                className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              {(!request.payment_status || request.payment_status !== 'paid') && (
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/admin/invoices?requestId=${request.id}&type=company`)}
                                  className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Générer facture
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                Générer PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Messagerie
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CompaniesManagement;
