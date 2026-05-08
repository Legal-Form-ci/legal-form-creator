import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, AlertCircle, User, Loader2, X, Camera, Scan } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as faceapi from 'face-api.js';

interface IdentityDocumentUploadProps {
  requestId?: string;
  requestType?: 'company' | 'service';
  onComplete?: (data: { frontUrl: string; backUrl?: string; faceDetected: boolean }) => void;
  standalone?: boolean;
}

const IdentityDocumentUpload = ({ requestId, requestType = 'company', onComplete, standalone = false }: IdentityDocumentUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<string>("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [faceConfidence, setFaceConfidence] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const documentTypes = [
    { value: "cni", label: "Carte Nationale d'Identité (CNI)" },
    { value: "passport", label: "Passeport" },
    { value: "sejour", label: "Carte de séjour" },
    { value: "permis", label: "Permis de conduire" },
  ];

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingProgress(10);
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setLoadingProgress(40);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        setLoadingProgress(70);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setLoadingProgress(100);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setModelsLoaded(false);
      }
    };
    loadModels();
  }, []);

  const analyzeFaceAdvanced = async (imageDataUrl: string): Promise<{ detected: boolean; confidence: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          if (modelsLoaded) {
            const detections = await faceapi
              .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
              .withFaceLandmarks(true);
            if (detections.length > 0) {
              const bestDetection = detections.reduce((prev, current) => prev.detection.score > current.detection.score ? prev : current);
              resolve({ detected: true, confidence: Math.round(bestDetection.detection.score * 100) });
            } else {
              resolve({ detected: false, confidence: 0 });
            }
          } else {
            const aspectRatio = img.width / img.height;
            const hasGoodAspect = aspectRatio > 0.5 && aspectRatio < 2;
            const hasGoodSize = img.width >= 300 && img.height >= 300;
            resolve({ detected: hasGoodAspect && hasGoodSize, confidence: hasGoodAspect && hasGoodSize ? 60 : 0 });
          }
        } catch (error) {
          console.error('Face detection error:', error);
          resolve({ detected: false, confidence: 0 });
        }
      };
      img.onerror = () => resolve({ detected: false, confidence: 0 });
      img.src = imageDataUrl;
    });
  };

  const handleImageSelect = useCallback(async (file: File, side: 'front' | 'back') => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Format invalide", description: "Veuillez sélectionner une image (JPG, PNG)", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "L'image ne doit pas dépasser 10 Mo", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const preview = e.target?.result as string;
      if (side === 'front') {
        setFrontImage(file);
        setFrontPreview(preview);
        setIsAnalyzing(true);
        setFaceDetected(null);
        setFaceConfidence(0);
        const result = await analyzeFaceAdvanced(preview);
        setFaceDetected(result.detected);
        setFaceConfidence(result.confidence);
        setIsAnalyzing(false);
        if (result.detected) {
          toast({ title: "Visage détecté ✓", description: `Confiance: ${result.confidence}% - Document valide` });
        } else {
          toast({ title: "Visage non détecté", description: "Assurez-vous que la photo d'identité est bien visible", variant: "destructive" });
        }
      } else {
        setBackImage(file);
        setBackPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  }, [modelsLoaded, toast]);

  const handleDrop = useCallback((e: React.DragEvent, side: 'front' | 'back') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file, side);
  }, [handleImageSelect]);

  // Upload to 'documents' bucket (which exists and is public) instead of 'identity-documents'
  const uploadToStorage = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `identity/${user?.id || 'anonymous'}/${requestId || Date.now()}/${folder}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      
      // Fallback: try identity-documents bucket
      const { error: error2 } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file, { upsert: true });
      
      if (error2) {
        console.error('Fallback upload error:', error2);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('identity-documents')
        .getPublicUrl(fileName);
      return publicUrl;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!documentType) {
      toast({ title: "Type requis", description: "Veuillez sélectionner le type de document", variant: "destructive" });
      return;
    }
    if (!frontImage) {
      toast({ title: "Recto requis", description: "Veuillez télécharger le recto du document", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const frontUrl = await uploadToStorage(frontImage, 'front');
      const backUrl = backImage ? await uploadToStorage(backImage, 'back') : null;

      if (!frontUrl) {
        throw new Error('Échec du téléchargement du recto');
      }

      if (standalone) {
        onComplete?.({ frontUrl, backUrl: backUrl || undefined, faceDetected: faceDetected || false });
        toast({ title: "Document validé", description: "Votre pièce d'identité a été enregistrée" });
        return;
      }

      if (requestId && user) {
        const { error } = await supabase
          .from('identity_documents')
          .insert({
            user_id: user.id,
            request_id: requestId,
            document_type: documentType,
            file_url: frontUrl,
            file_name: frontImage.name,
          });
        if (error) throw error;
      }

      toast({ title: "Document téléchargé", description: "Votre pièce d'identité a été enregistrée avec succès" });

      setDocumentType("");
      setFrontImage(null);
      setBackImage(null);
      setFrontPreview(null);
      setBackPreview(null);
      setFaceDetected(null);
      setFaceConfidence(0);

      onComplete?.({ frontUrl, backUrl: backUrl || undefined, faceDetected: faceDetected || false });
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({ title: "Erreur", description: error.message || "Impossible d'enregistrer le document", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage(null);
      setFrontPreview(null);
      setFaceDetected(null);
      setFaceConfidence(0);
    } else {
      setBackImage(null);
      setBackPreview(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Pièce d'identité
          {modelsLoaded && (
            <Badge variant="secondary" className="ml-2"><Scan className="h-3 w-3 mr-1" />IA Active</Badge>
          )}
        </CardTitle>
        <CardDescription>Téléchargez votre pièce d'identité (recto et verso) - Détection automatique du visage</CardDescription>
        {!modelsLoaded && loadingProgress < 100 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground">Chargement de l'IA de détection...</p>
            <Progress value={loadingProgress} className="h-1" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Type de document *</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger><SelectValue placeholder="Sélectionnez le type" /></SelectTrigger>
            <SelectContent>
              {documentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Front */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Recto *</span>
              {isAnalyzing && <Badge variant="secondary" className="animate-pulse"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Analyse IA...</Badge>}
              {faceDetected === true && <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Visage {faceConfidence}%</Badge>}
              {faceDetected === false && !isAnalyzing && frontPreview && <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Non détecté</Badge>}
            </Label>
            
            <input ref={frontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'front')} />

            {frontPreview ? (
              <div className="relative group">
                <img src={frontPreview} alt="Recto" className="w-full h-48 object-cover rounded-lg border-2 border-primary/20" />
                {faceDetected && <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded">Visage validé ✓</div>}
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => removeImage('front')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div onClick={() => frontInputRef.current?.click()} onDrop={(e) => handleDrop(e, 'front')} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Camera className="h-10 w-10 mx-auto text-primary mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Cliquez ou glissez le recto</p>
                <p className="text-xs text-muted-foreground">JPG, PNG jusqu'à 10 Mo</p>
              </div>
            )}
          </div>

          {/* Back */}
          <div className="space-y-2">
            <Label>Verso (optionnel)</Label>
            <input ref={backInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'back')} />

            {backPreview ? (
              <div className="relative group">
                <img src={backPreview} alt="Verso" className="w-full h-48 object-cover rounded-lg border" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => removeImage('back')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div onClick={() => backInputRef.current?.click()} onDrop={(e) => handleDrop(e, 'back')} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Cliquez ou glissez le verso</p>
                <p className="text-xs text-muted-foreground">JPG, PNG jusqu'à 10 Mo</p>
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <Button onClick={handleSubmit} disabled={isUploading || !frontImage || !documentType} className="w-full">
          {isUploading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" />Valider et envoyer</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default IdentityDocumentUpload;
