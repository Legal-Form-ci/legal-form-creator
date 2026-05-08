import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText, File, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Document {
  id: string;
  document_name: string;
  document_type: string | null;
  document_url: string;
  sender_role: string;
  message: string | null;
  created_at: string;
}

interface RequestDocumentsProps {
  requestId: string;
  requestType: "company" | "service";
}

const documentTypes = [
  { value: "cni_recto", label: "CNI Recto" },
  { value: "cni_verso", label: "CNI Verso" },
  { value: "extrait_naissance", label: "Extrait de naissance" },
  { value: "casier_judiciaire", label: "Casier judiciaire" },
  { value: "filiation", label: "Document de filiation" },
  { value: "contrat_bail", label: "Contrat de bail" },
  { value: "statuts", label: "Statuts" },
  { value: "dsv", label: "Déclaration de souscription" },
  { value: "autre", label: "Autre document" },
];

const RequestDocuments = ({ requestId, requestType }: RequestDocumentsProps) => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    loadDocuments();
  }, [requestId, user]);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('request_documents_exchange')
      .select('id, document_name, document_type, document_url, sender_role, message, created_at')
      .eq('request_id', requestId)
      .eq('request_type', requestType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      return;
    }

    setDocuments((data as Document[]) || []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !user) {
      toast({
        title: t('documents.error', 'Erreur'),
        description: t('documents.selectFileAndType', 'Veuillez sélectionner un fichier et un type de document'),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${requestId}/${Date.now()}_${documentType}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('request_documents_exchange')
        .insert({
          request_id: requestId,
          request_type: requestType,
          sender_id: user.id,
          sender_role: userRole === 'admin' || userRole === 'team' ? 'admin' : 'client',
          document_name: selectedFile.name,
          document_type: documentType,
          document_url: publicUrl,
          file_name: selectedFile.name,
          file_url: publicUrl,
          message: description || null,
        } as any);

      if (dbError) throw dbError;

      toast({
        title: t('documents.uploadSuccess', 'Document envoyé'),
        description: t('documents.uploadSuccessDesc', 'Le document a été uploadé avec succès'),
      });

      setSelectedFile(null);
      setDocumentType("");
      setDescription("");
      setPreviewUrl(null);
      loadDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: t('documents.error', 'Erreur'),
        description: t('documents.uploadFailed', 'Impossible d\'uploader le document'),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      window.open(doc.document_url, '_blank');
      toast({
        title: t('documents.downloadSuccess', 'Téléchargement lancé'),
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: t('documents.error', 'Erreur'),
        description: t('documents.downloadFailed', 'Impossible de télécharger le document'),
        variant: "destructive",
      });
    }
  };

  const getDocumentTypeLabel = (type: string | null) => {
    if (!type) return 'Document';
    const docType = documentTypes.find(d => d.value === type);
    return docType?.label || type;
  };

  const isImage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  if (!user) return null;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {t('documents.title', 'Documents échangés')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Form */}
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 space-y-4 bg-muted/30">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t('documents.sendDocument', 'Envoyer un document')}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="file">{t('documents.file', 'Fichier')}</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,.doc,.docx"
                  className="cursor-pointer"
                />
              </div>
              
              <div>
                <Label>{t('documents.documentType', 'Type de document')}</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('documents.selectType', 'Sélectionnez le type')} />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">{t('documents.description', 'Description')} ({t('documents.optional', 'optionnel')})</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('documents.descriptionPlaceholder', 'Ajoutez une note sur ce document...')}
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              {previewUrl ? (
                <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border-2 border-primary/20">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : selectedFile ? (
                <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                  <File className="h-12 w-12 text-primary mb-2" />
                  <p className="text-sm text-center text-muted-foreground truncate max-w-[150px]">
                    {selectedFile.name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">{t('documents.noPreview', 'Aperçu du fichier')}</p>
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !documentType}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? t('documents.uploading', 'Envoi en cours...') : t('documents.sendButton', 'Envoyer le document')}
          </Button>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">
            {t('documents.documentsList', 'Documents')} ({documents.length})
          </h4>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('documents.noDocuments', 'Aucun document échangé pour le moment')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {isImage(doc.document_name) ? (
                      <ImageIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{getDocumentTypeLabel(doc.document_type)}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.document_name}</p>
                      {doc.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.message}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          doc.sender_role === 'admin' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-accent/10 text-accent'
                        }`}>
                          {doc.sender_role === 'admin' ? 'Legal Form' : 'Client'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(doc)}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestDocuments;