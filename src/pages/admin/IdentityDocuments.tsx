import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCheck, 
  FileX, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  RefreshCw,
  Download,
  Filter,
  AlertCircle
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface IdentityDocument {
  id: string;
  user_id: string;
  request_id: string;
  request_type: string;
  document_type: string;
  front_url: string;
  back_url: string | null;
  face_detected: boolean;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  faceDetected: number;
}

const IdentityDocuments = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<IdentityDocument[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, rejected: 0, faceDetected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified">("all");
  const [selectedDocument, setSelectedDocument] = useState<IdentityDocument | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const documentTypeLabels: Record<string, string> = {
    cni: "CNI",
    passport: "Passeport",
    sejour: "Carte de séjour",
    permis: "Permis de conduire"
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('identity_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user info for each document
      const docsWithUsers = await Promise.all(
        (data || []).map(async (doc) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', doc.user_id)
            .single();
          
          return {
            ...doc,
            user_name: profile?.full_name || 'Non renseigné'
          };
        })
      );

      setDocuments(docsWithUsers as any);

      // Calculate stats
      const total = docsWithUsers.length;
      const pending = docsWithUsers.filter(d => d.status === 'pending').length;
      const verified = docsWithUsers.filter(d => d.status === 'verified').length;
      const rejected = docsWithUsers.filter(d => d.status === 'rejected').length;
      const faceDetected = 0;
      
      setStats({ total, pending, verified, rejected, faceDetected });
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleVerify = async (status: 'verified' | 'rejected') => {
    if (!selectedDocument) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('notify-id-validation', {
        body: {
          documentId: selectedDocument.id,
          status,
          message: verificationMessage
        }
      });

      if (error) throw error;

      toast({
        title: status === 'verified' ? "Document vérifié" : "Document rejeté",
        description: "Une notification a été envoyée à l'utilisateur"
      });

      setShowDialog(false);
      setSelectedDocument(null);
      setVerificationMessage("");
      fetchDocuments();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter le document",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.request_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "pending" && !doc.verified && !doc.verified_at) ||
      (filterStatus === "verified" && doc.verified);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (doc: IdentityDocument) => {
    if (doc.verified) {
      return <Badge className="bg-green-500">Vérifié</Badge>;
    }
    if (doc.verified_at) {
      return <Badge variant="destructive">Rejeté</Badge>;
    }
    return <Badge variant="secondary">En attente</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Documents d'identité</h1>
            <p className="text-slate-400">Vérification des pièces d'identité uploadées</p>
          </div>
          <Button onClick={fetchDocuments} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileCheck className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">En attente</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Vérifiés</p>
                  <p className="text-2xl font-bold text-green-400">{stats.verified}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Rejetés</p>
                  <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Visage IA</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.faceDetected}</p>
                </div>
                <User className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, type ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <TabsList className="bg-slate-700">
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="pending">En attente</TabsTrigger>
                  <TabsTrigger value="verified">Vérifiés</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileX className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">Aucun document trouvé</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">Utilisateur</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">IA Visage</TableHead>
                    <TableHead className="text-slate-300">Statut</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">
                        {doc.user_name}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {documentTypeLabels[doc.document_type] || doc.document_type}
                      </TableCell>
                      <TableCell>
                        {doc.face_detected ? (
                          <Badge className="bg-green-500/20 text-green-400">Détecté</Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-600 text-slate-400">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc)}</TableCell>
                      <TableCell className="text-slate-400">
                        {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowDialog(true);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Document Detail Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Vérification du document</DialogTitle>
              <DialogDescription className="text-slate-400">
                Examinez le document et décidez de sa validation
              </DialogDescription>
            </DialogHeader>
            
            {selectedDocument && (
              <div className="space-y-6">
                {/* Document Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Utilisateur</p>
                    <p className="font-medium">{selectedDocument.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Type</p>
                    <p className="font-medium">{documentTypeLabels[selectedDocument.document_type]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Détection IA</p>
                    <p className="font-medium">
                      {selectedDocument.face_detected ? (
                        <span className="text-green-400">✓ Visage détecté</span>
                      ) : (
                        <span className="text-yellow-400">⚠ Non détecté</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Statut</p>
                    {getStatusBadge(selectedDocument)}
                  </div>
                </div>

                {/* Document Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Recto</p>
                    <div className="relative aspect-[3/2] rounded-lg overflow-hidden border border-slate-600">
                      <img
                        src={selectedDocument.front_url}
                        alt="Recto"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {selectedDocument.back_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">Verso</p>
                      <div className="relative aspect-[3/2] rounded-lg overflow-hidden border border-slate-600">
                        <img
                          src={selectedDocument.back_url}
                          alt="Verso"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Message */}
                {!selectedDocument.verified && !selectedDocument.verified_at && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Message (optionnel)</p>
                    <Textarea
                      value={verificationMessage}
                      onChange={(e) => setVerificationMessage(e.target.value)}
                      placeholder="Ajoutez un commentaire pour l'utilisateur..."
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}

                {/* Actions */}
                {!selectedDocument.verified && !selectedDocument.verified_at && (
                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleVerify('rejected')}
                      disabled={isProcessing}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeter
                    </Button>
                    <Button
                      onClick={() => handleVerify('verified')}
                      disabled={isProcessing}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Valider
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default IdentityDocuments;
