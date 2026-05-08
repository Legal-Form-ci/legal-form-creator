import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Upload, User, Building2, Globe, Star, Send, X, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { detectAndCropFace, dataURLtoFile } from "@/utils/faceDetection";
import { uploadFile } from "@/utils/fileUpload";

interface TestimonialFormProps {
  onSuccess?: () => void;
}

const TestimonialForm = ({ onSuccess }: TestimonialFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    founderName: "",
    companyName: "",
    companyType: "",
    region: "",
    testimonial: "",
    rating: "5",
    website: "",
    photo: null as File | null,
    logo: null as File | null,
  });

  const regions = [
    "Abidjan (Lagunes)", "Yamoussoukro (Lacs)", "Bouaké (Vallée du Bandama)",
    "Daloa (Sassandra-Marahoué)", "San-Pédro (Bas-Sassandra)", "Korhogo (Savanes)",
    "Man (Montagnes)", "Abengourou (Comoé)", "Bondoukou (Zanzan)", "Gagnoa (Gôh-Djiboua)",
    "Grand-Bassam", "Divo (Lôh-Djiboua)", "Soubré (Nawa)"
  ];

  const companyTypes = [
    { value: "sarl", label: "SARL" },
    { value: "sarlu", label: "SARLU" },
    { value: "ei", label: "Entreprise Individuelle" },
    { value: "association", label: "Association" },
    { value: "ong", label: "ONG" },
    { value: "scoops", label: "SCOOPS" },
    { value: "sci", label: "SCI" },
    { value: "gie", label: "GIE" },
  ];

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setFormData(prev => ({ ...prev, photo: file }));

    try {
      // Apply face detection and auto-crop
      const result = await detectAndCropFace(file);
      setPhotoPreview(result.croppedDataUrl);
      setOriginalPhoto(result.originalDataUrl);
      setFaceDetected(result.faceDetected);

      if (result.faceDetected) {
        toast({
          title: t('testimonial.faceDetected', 'Visage détecté'),
          description: t('testimonial.faceDetectedDesc', 'La photo a été automatiquement recadrée sur votre visage.'),
        });
      }
    } catch (error) {
      console.error('Face detection error:', error);
      // Fallback to original image
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
        setOriginalPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingPhoto(false);
    }
  }, [t, toast]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setOriginalPhoto(null);
    setFaceDetected(false);
    setFormData({ ...formData, photo: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearLogo = () => {
    setLogoPreview(null);
    setFormData({ ...formData, logo: null });
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let photoUrl = null;
      let logoUrl = null;

      // Upload photo if present
      if (photoPreview && formData.photo) {
        const photoFile = dataURLtoFile(photoPreview, `photo_${Date.now()}.jpg`);
        const photoResult = await uploadFile('testimonial-photos', photoFile);
        if (photoResult.success) {
          photoUrl = photoResult.url;
        }
      }

      // Upload logo if present
      if (logoPreview && formData.logo) {
        const logoResult = await uploadFile('company-logos', formData.logo);
        if (logoResult.success) {
          logoUrl = logoResult.url;
        }
      }

      // Insert testimonial into testimonials table (pending approval)
      const { error } = await supabase
        .from('testimonials')
        .insert({
          name: formData.founderName,
          comment: formData.testimonial,
          company: formData.companyName,
          region: formData.region,
          rating: parseInt(formData.rating),
          logo: logoUrl,
          is_approved: false,
        } as any);

      if (error) throw error;

      toast({
        title: t('testimonial.success', 'Témoignage envoyé'),
        description: t('testimonial.successDesc', 'Votre témoignage sera publié après validation par notre équipe.'),
      });

      // Reset form
      setFormData({
        founderName: "",
        companyName: "",
        companyType: "",
        region: "",
        testimonial: "",
        rating: "5",
        website: "",
        photo: null,
        logo: null,
      });
      setPhotoPreview(null);
      setOriginalPhoto(null);
      setLogoPreview(null);
      setFaceDetected(false);
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: t('testimonial.error', 'Erreur'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-accent" />
          {t('testimonial.title', 'Partagez votre expérience')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload with Face Detection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              {t('testimonial.photo', 'Votre photo')} ({t('testimonial.optional', 'optionnel')})
            </Label>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => !isProcessingPhoto && fileInputRef.current?.click()}
                className={`relative w-28 h-28 rounded-full overflow-hidden cursor-pointer group ${isProcessingPhoto ? 'animate-pulse' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
                  padding: '4px',
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center">
                  {isProcessingPhoto ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="text-xs text-muted-foreground mt-1">Analyse...</span>
                    </div>
                  ) : photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                {!isProcessingPhoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {photoPreview && (
                  <>
                    {faceDetected && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Check className="h-3 w-3" />
                        {t('testimonial.faceCentered', 'Visage centré automatiquement')}
                      </span>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={clearPhoto}>
                      <X className="h-4 w-4 mr-1" /> {t('testimonial.remove', 'Retirer')}
                    </Button>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('testimonial.photoTip', 'Votre visage sera automatiquement détecté et centré dans la photo')}
            </p>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="founderName">{t('testimonial.founderName', 'Votre nom et prénoms')} *</Label>
              <Input
                id="founderName"
                value={formData.founderName}
                onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                required
                placeholder={t('testimonial.founderNamePlaceholder', 'Ex: KOUASSI Jean-Marc')}
              />
            </div>
            <div>
              <Label htmlFor="companyName">{t('testimonial.companyName', 'Nom de l\'entreprise')} *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                placeholder={t('testimonial.companyNamePlaceholder', 'Ex: TECH INNOV SARL')}
              />
            </div>
          </div>

          {/* Company type and region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('testimonial.companyType', 'Type de structure')} *</Label>
              <Select value={formData.companyType} onValueChange={(v) => setFormData({ ...formData, companyType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('testimonial.selectType', 'Sélectionnez')} />
                </SelectTrigger>
                <SelectContent>
                  {companyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('testimonial.region', 'Région')} *</Label>
              <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('testimonial.selectRegion', 'Sélectionnez')} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rating */}
          <div>
            <Label>{t('testimonial.rating', 'Note')} *</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star.toString() })}
                  className="focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      star <= parseInt(formData.rating) 
                        ? 'text-accent fill-accent' 
                        : 'text-muted-foreground hover:text-accent/50'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div>
            <Label htmlFor="testimonial">{t('testimonial.message', 'Votre témoignage')} *</Label>
            <Textarea
              id="testimonial"
              value={formData.testimonial}
              onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
              required
              rows={4}
              placeholder={t('testimonial.messagePlaceholder', 'Partagez votre expérience avec Legal Form...')}
            />
          </div>

          {/* Company Logo - Optional */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('testimonial.logo', 'Logo de l\'entreprise')} ({t('testimonial.optional', 'optionnel')})
            </Label>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer group border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors flex items-center justify-center bg-muted"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-5 w-5 text-white" />
                </div>
              </div>
              {logoPreview && (
                <Button type="button" variant="ghost" size="sm" onClick={clearLogo}>
                  <X className="h-4 w-4 mr-1" /> {t('testimonial.remove', 'Retirer')}
                </Button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Website - Optional */}
          <div>
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('testimonial.website', 'Site web de l\'entreprise')} ({t('testimonial.optional', 'optionnel')})
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting 
              ? t('testimonial.submitting', 'Envoi en cours...') 
              : t('testimonial.submit', 'Soumettre mon témoignage')
            }
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            {t('testimonial.approval', 'Votre témoignage sera publié après validation par notre équipe.')}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default TestimonialForm;
