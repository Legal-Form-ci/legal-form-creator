import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, MapPin, FileText, CheckCircle2, Users, UserCircle, Plus, Trash2, Gift, User, IdCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IdentityDocumentUpload from "@/components/IdentityDocumentUpload";

interface Associate {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  residenceAddress: string;
  profession: string;
  maritalStatus: string;
  maritalRegime: string;
}

// Helper to format numbers with thousand separators
const formatNumber = (value: string | number) => {
  const num = typeof value === 'string' ? value.replace(/\s/g, '') : value.toString();
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const parseNumber = (value: string) => {
  return value.replace(/\s/g, '');
};

// Local storage persistence
const DRAFT_KEY = "legalform_create_draft";

const saveDraft = (data: any) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
  } catch (e) {
    console.error("Failed to save draft:", e);
  }
};

const loadDraft = () => {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Failed to load draft:", e);
    return null;
  }
};

const clearDraft = () => {
  localStorage.removeItem(DRAFT_KEY);
};

const Create = () => {
  // Clear draft on fresh navigation to ensure a blank form each time
  useEffect(() => {
    // Only clear if there's no explicit "resume" param
    const params = new URLSearchParams(window.location.search);
    if (!params.has('resume')) {
      clearDraft();
    }
  }, []);
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  
  
  const draft = loadDraft();

  const [step, setStep] = useState(() => draft?.step || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
  // Step 1: Company identification
  const [companyData, setCompanyData] = useState(() => draft?.companyData || {
    structureType: "",
    companyName: "",
    sigle: "",
    capital: "",
    activities: "",
    bank: "",
  });
  
  // Step 2: Location
  const [locationData, setLocationData] = useState(() => draft?.locationData || {
    city: "",
    commune: "",
    quartier: "",
    reference: "",
    bp: "",
  });
  
  // Step 3: Manager info
  const [managerData, setManagerData] = useState(() => draft?.managerData || {
    fullName: "",
    mandatDuration: "",
    phone: "",
    email: "",
    residence: "",
    maritalStatus: "",
    maritalRegime: "",
  });
  
  // Step 4: Associates (for SARLU only one)
  const [associates, setAssociates] = useState<Associate[]>(() => draft?.associates || [{
    id: "1",
    fullName: "",
    phone: "",
    email: "",
    residenceAddress: "",
    profession: "",
    maritalStatus: "",
    maritalRegime: "",
  }]);
  
  // Step 5: Additional services
  const [additionalServices, setAdditionalServices] = useState<string[]>(() => draft?.additionalServices || []);
  
  // Identity document data
  const [identityData, setIdentityData] = useState<{
    frontUrl?: string;
    backUrl?: string;
    faceDetected: boolean;
  } | null>(draft?.identityData || null);
  
  // Referral system
  const [referralCode, setReferralCode] = useState(() => draft?.referralCode || "");
  const [referrerName, setReferrerName] = useState("");
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  // Check for referral code in URL params
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      validateReferralCode(refCode.toUpperCase());
    }
  }, [searchParams]);
  
  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 6) {
      setReferrerName("");
      return;
    }
    
    setIsValidatingReferral(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('referral_code', code.toUpperCase())
        .maybeSingle();
      
      if (data && data.full_name) {
        setReferrerName(data.full_name);
      } else {
        setReferrerName("");
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
    } finally {
      setIsValidatingReferral(false);
    }
  };

  // Auto-save draft on data changes
  useEffect(() => {
    const draftData = {
      step,
      companyData,
      locationData,
      managerData,
      associates,
      additionalServices,
      identityData,
      referralCode,
    };
    saveDraft(draftData);
  }, [step, companyData, locationData, managerData, associates, additionalServices, identityData, referralCode]);

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: t('auth.required', 'Authentification requise'),
        description: t('auth.requiredDesc', 'Vous devez être connecté pour créer une entreprise'),
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, loading, navigate, toast, t]);

  const structureTypes = [
    { value: "ei", label: "Entreprise Individuelle" },
    { value: "sarl", label: "SARL - Société à Responsabilité Limitée" },
    { value: "sarlu", label: "SARLU - Société à Responsabilité Limitée Unipersonnelle" },
    { value: "filiale", label: "Filiale" },
    { value: "ong", label: "ONG - Organisation Non Gouvernementale" },
    { value: "association", label: "Association" },
    { value: "fondation", label: "Fondation" },
    { value: "scoops", label: "SCOOPS - Coopérative" },
    { value: "sci", label: "SCI - Société Civile Immobilière" },
    { value: "gie", label: "GIE - Groupement d'Intérêt Économique" },
  ];

  const banks = [
    "SGBCI", "BICICI", "BOA - Bank Of Africa", "Ecobank", "NSIA Banque", "Bridge Bank",
    "Coris Bank", "BNI - Banque Nationale d'Investissement", "SIB - Société Ivoirienne de Banque",
    "Orabank", "UBA - United Bank for Africa", "GTBank", "BHCI - Banque de l'Habitat de Côte d'Ivoire",
    "Banque Atlantique", "BIAO-CI", "Versus Bank", "Banque Populaire de Côte d'Ivoire",
    "Standard Chartered Bank", "Citibank", "Diamond Bank", "Access Bank",
    "Baobab Côte d'Ivoire (Microcrédit)", "Advans Côte d'Ivoire (Microcrédit)",
    "FIDRA (Microcrédit)", "UNACOOPEC-CI (Coopérative)", "RCMEC (Coopérative)",
    "CEMCI (Microfinance)", "CELPAID", "COFINA", "Letshego",
    "Autre"
  ];

  const otherServiceslist = [
    { id: "immobilier", label: "Immobilier" },
    { id: "verification", label: "Formalités de vérification préalable" },
    { id: "acd_agrement", label: "Formalités ACD - Agrément" },
    { id: "agrement_fdfp", label: "Agrément FDFP" },
    { id: "agrement_agent_immobilier", label: "Agrément agent immobilier" },
    { id: "transport", label: "Transport" },
    { id: "carte_transporteur", label: "Carte de transporteur" },
  ];

  const isUnipersonnelle = companyData.structureType === 'sarlu' || companyData.structureType === 'sasu' || companyData.structureType === 'ei';

  const addAssociate = () => {
    if (isUnipersonnelle) return;
    setAssociates([...associates, {
      id: Date.now().toString(),
      fullName: "",
      phone: "",
      email: "",
      residenceAddress: "",
      profession: "",
      maritalStatus: "",
      maritalRegime: "",
    }]);
  };

  const removeAssociate = (id: string) => {
    if (associates.length > 1) {
      setAssociates(associates.filter(a => a.id !== id));
    }
  };

  const updateAssociate = (id: string, field: keyof Associate, value: string) => {
    setAssociates(associates.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) return;
    
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const hasValidReferral = !!(referralCode && referrerName);
      
      // Create the company request - NO PAYMENT
      const { data: requestData, error: requestError } = await supabase
        .from('company_requests')
        .insert({
          user_id: user.id,
          structure_type: companyData.structureType,
          company_name: companyData.companyName,
          sigle: companyData.sigle || null,
          capital: companyData.capital,
          activity: companyData.activities,
          bank: companyData.bank,
          region: locationData.city,
          city: locationData.commune,
          address: `${locationData.quartier}, ${locationData.reference}`,
          bp: locationData.bp || null,
          contact_name: managerData.fullName,
          phone: managerData.phone,
          email: managerData.email,
          manager_residence: managerData.residence,
          manager_marital_status: managerData.maritalStatus,
          manager_marital_regime: managerData.maritalRegime,
          manager_mandate_duration: managerData.mandatDuration,
          additional_services: additionalServices,
          status: 'pending',
          payment_status: 'unpaid',
          referrer_code: hasValidReferral ? referralCode : null,
          discount_applied: hasValidReferral ? 10000 : 0,
        })
        .select()
        .single();

      if (requestError) {
        console.error('[Create] Error creating request:', requestError);
        throw new Error(requestError.message || 'Erreur lors de la création de la demande');
      }

      // Trigger new request notification
      try {
        await supabase.functions.invoke('send-notification', {
          body: { userId: user.id, requestId: requestData.id, type: 'new_request' }
        });
      } catch (e) {
        console.error('Notification error:', e);
      }

      // Insert associates
      for (const associate of associates) {
        if (associate.fullName) {
          await supabase.from('company_associates').insert({
            company_request_id: requestData.id,
            full_name: associate.fullName,
            phone: associate.phone,
            email: associate.email,
            residence_address: associate.residenceAddress,
            profession: associate.profession,
            marital_status: associate.maritalStatus,
            marital_regime: associate.maritalRegime,
          });
        }
      }

      clearDraft();
      toast({
        title: t('create.requestSent', 'Demande envoyée'),
        description: t('create.requestSentDesc', 'Votre demande a été enregistrée avec succès. Une facture vous sera envoyée après étude de votre dossier.'),
      });
      navigate("/client/dashboard");
      
    } catch (error: any) {
      console.error('[Create] Submission error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Step 1 validation
    if (step === 1) {
      if (!companyData.structureType || !companyData.companyName || !companyData.capital) {
        toast({
          title: t('create.requiredFields', 'Champs requis'),
          description: t('create.step1Required', 'Veuillez renseigner le type, le nom et le capital'),
          variant: "destructive",
        });
        return;
      }
    }
    
    // Step 2 validation
    if (step === 2) {
      if (!locationData.city || !locationData.commune || !locationData.quartier) {
        toast({
          title: t('create.requiredFields', 'Champs requis'),
          description: t('create.step2Required', 'Veuillez renseigner la ville, commune et quartier'),
          variant: "destructive",
        });
        return;
      }
    }
    
    // Step 3 validation
    if (step === 3) {
      if (!managerData.fullName || !managerData.phone || !managerData.email) {
        toast({
          title: t('create.requiredFields', 'Champs requis'),
          description: t('create.step3Required', 'Veuillez renseigner les informations du gérant'),
          variant: "destructive",
        });
        return;
      }
    }
    
    // Step 4 validation
    if (step === 4) {
      const firstAssociate = associates[0];
      if (!firstAssociate.fullName || !firstAssociate.phone) {
        toast({
          title: t('create.requiredFields', 'Champs requis'),
          description: isUnipersonnelle 
            ? t('create.step4RequiredUnique', 'Veuillez renseigner les informations de l\'associé unique')
            : t('create.step4Required', 'Veuillez renseigner les informations des associés'),
          variant: "destructive",
        });
        return;
      }
    }
    
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const stepLabels = [
    t('create.step1', 'Société'),
    t('create.step2', 'Localisation'),
    t('create.step3', 'Gérant'),
    isUnipersonnelle ? t('create.step4Unique', 'Associé Unique') : t('create.step4', 'Associés'),
    t('create.step5', 'Autres démarches'),
    t('create.step6', 'Récapitulatif'),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-foreground mb-4">
              {t('create.title', 'Créer Mon Entreprise')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('create.subtitle', 'Suivez les étapes pour démarrer votre projet')}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-12 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div key={num} className="flex flex-col items-center flex-1 min-w-[60px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {num}
                </div>
                <div className="text-xs mt-2 text-center whitespace-nowrap">
                  {stepLabels[num - 1]}
                </div>
              </div>
            ))}
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                {step === 1 && <><Building2 className="mr-2" /> {t('create.step1Title', 'Identification de la société')}</>}
                {step === 2 && <><MapPin className="mr-2" /> {t('create.step2Title', 'Localisation')}</>}
                {step === 3 && <><UserCircle className="mr-2" /> {t('create.step3Title', 'Informations du gérant')}</>}
                {step === 4 && <><Users className="mr-2" /> {isUnipersonnelle ? t('create.step4TitleUnique', 'Informations de l\'associé unique') : t('create.step4Title', 'Informations des associés')}</>}
                {step === 5 && <><FileText className="mr-2" /> {t('create.step5Title', 'Autres démarches')}</>}
                {step === 6 && <><CheckCircle2 className="mr-2" /> {t('create.step6Title', 'Récapitulatif')}</>}
              </CardTitle>
              <CardDescription>{t('create.stepOf', 'Étape')} {step} {t('create.of', 'sur')} 6</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Step 1: Company Identification */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Referral Code Section */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Gift className="h-5 w-5" />
                      <Label className="font-semibold">Code Parrain (optionnel)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Avez-vous été référé ? Entrez le code de votre parrain pour bénéficier de -10 000 FCFA sur votre création.
                    </p>
                    <Input
                      value={referralCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        setReferralCode(code);
                        if (code.length >= 6) validateReferralCode(code);
                      }}
                      placeholder="Ex: A1B2C3D4"
                      className="uppercase"
                    />
                    {isValidatingReferral && <p className="text-sm text-muted-foreground">Vérification...</p>}
                    {referrerName && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Parrain: {referrerName}</span>
                        <CheckCircle2 className="h-4 w-4 ml-auto" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>{t('create.structureType', 'Forme Juridique')} *</Label>
                    <Select 
                      value={companyData.structureType} 
                      onValueChange={(value) => setCompanyData({...companyData, structureType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('create.selectStructure', 'Sélectionnez une forme juridique')} />
                      </SelectTrigger>
                      <SelectContent>
                        {structureTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="companyName">{t('create.companyName', 'Raison ou Dénomination sociale')} *</Label>
                    <Input
                      id="companyName"
                      value={companyData.companyName}
                      onChange={(e) => setCompanyData({...companyData, companyName: e.target.value})}
                      placeholder={t('create.companyNamePlaceholder', 'Ex: TECH INNOV SARL')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sigle">{t('create.sigle', 'Sigle')} ({t('common.optional', 'optionnel')})</Label>
                    <Input
                      id="sigle"
                      value={companyData.sigle}
                      onChange={(e) => setCompanyData({...companyData, sigle: e.target.value})}
                      placeholder="Ex: TIS"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="capital">{t('create.capital', 'Capital social')} (FCFA) *</Label>
                    <Input
                      id="capital"
                      value={formatNumber(companyData.capital)}
                      onChange={(e) => setCompanyData({...companyData, capital: parseNumber(e.target.value)})}
                      placeholder="Ex: 1 000 000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="activities">{t('create.activities', 'Activités de la société')} *</Label>
                    <Textarea
                      id="activities"
                      value={companyData.activities}
                      onChange={(e) => setCompanyData({...companyData, activities: e.target.value})}
                      placeholder={t('create.activitiesPlaceholder', 'Décrivez les activités principales')}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>{t('create.bank', 'Choix de la banque')} *</Label>
                    <Select 
                      value={companyData.bank} 
                      onValueChange={(value) => setCompanyData({...companyData, bank: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('create.selectBank', 'Sélectionnez une banque')} />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="city">{t('create.city', 'Ville')} *</Label>
                    <Input
                      id="city"
                      value={locationData.city}
                      onChange={(e) => setLocationData({...locationData, city: e.target.value})}
                      placeholder="Ex: Abidjan, Bouaké, Daloa..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="commune">{t('create.commune', 'Commune')} *</Label>
                    <Input
                      id="commune"
                      value={locationData.commune}
                      onChange={(e) => setLocationData({...locationData, commune: e.target.value})}
                      placeholder="Ex: Cocody, Plateau, Marcory..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="quartier">{t('create.quartier', 'Quartier')} *</Label>
                    <Input
                      id="quartier"
                      value={locationData.quartier}
                      onChange={(e) => setLocationData({...locationData, quartier: e.target.value})}
                      placeholder="Ex: Riviera Palmeraie..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reference">{t('create.reference', 'Référence non loin du siège')}</Label>
                    <Input
                      id="reference"
                      value={locationData.reference}
                      onChange={(e) => setLocationData({...locationData, reference: e.target.value})}
                      placeholder={t('create.referencePlaceholder', 'Ex: une pharmacie, une école...')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bp">{t('create.bp', 'Boîte Postale (BP)')} ({t('common.optional', 'optionnel')})</Label>
                    <Input
                      id="bp"
                      value={locationData.bp}
                      onChange={(e) => setLocationData({...locationData, bp: e.target.value})}
                      placeholder="Ex: BP 1234"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Manager Info */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="managerName">{t('create.managerName', 'Nom et prénoms du Gérant')} *</Label>
                    <Input
                      id="managerName"
                      value={managerData.fullName}
                      onChange={(e) => setManagerData({...managerData, fullName: e.target.value})}
                      placeholder="Ex: KOUASSI Jean-Marc"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mandatDuration">{t('create.mandatDuration', 'Durée du mandat')} *</Label>
                    <Input
                      id="mandatDuration"
                      value={managerData.mandatDuration}
                      onChange={(e) => setManagerData({...managerData, mandatDuration: e.target.value})}
                      placeholder="Ex: 5 ans, indéterminée..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="managerPhone">{t('create.managerPhone', 'Téléphone du Gérant')} *</Label>
                    <Input
                      id="managerPhone"
                      type="tel"
                      value={managerData.phone}
                      onChange={(e) => setManagerData({...managerData, phone: e.target.value})}
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="managerEmail">{t('create.managerEmail', 'Email du Gérant')} *</Label>
                    <Input
                      id="managerEmail"
                      type="email"
                      value={managerData.email}
                      onChange={(e) => setManagerData({...managerData, email: e.target.value})}
                      placeholder="gerant@email.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="managerResidence">{t('create.managerResidence', 'Domicile du gérant')}</Label>
                    <Input
                      id="managerResidence"
                      value={managerData.residence}
                      onChange={(e) => setManagerData({...managerData, residence: e.target.value})}
                      placeholder="Adresse de résidence"
                    />
                  </div>
                  
                  <div>
                    <Label>{t('create.maritalStatus', 'Situation matrimoniale du gérant')}</Label>
                    <RadioGroup value={managerData.maritalStatus} onValueChange={(v) => setManagerData({...managerData, maritalStatus: v})}>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="celibataire" id="celibataire" />
                          <Label htmlFor="celibataire">{t('create.single', 'Célibataire')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="marie" id="marie" />
                          <Label htmlFor="marie">{t('create.married', 'Marié(e)')}</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {managerData.maritalStatus === 'marie' && (
                    <div>
                      <Label>{t('create.maritalRegime', 'Régime matrimonial')}</Label>
                      <RadioGroup value={managerData.maritalRegime} onValueChange={(v) => setManagerData({...managerData, maritalRegime: v})}>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="separation" id="separation" />
                            <Label htmlFor="separation">{t('create.separationOfProperty', 'Séparation de bien')}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="communaute" id="communaute" />
                            <Label htmlFor="communaute">{t('create.communityOfProperty', 'Communauté de bien')}</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  
                  {/* Identity Document Upload */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <IdCard className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{t('create.identityDocument', 'Pièce d\'identité du gérant')}</h3>
                    </div>
                    <IdentityDocumentUpload
                      standalone={true}
                      onComplete={(data) => {
                        setIdentityData(data);
                      }}
                    />
                    {identityData && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Document enregistré {identityData.faceDetected ? '(visage détecté)' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Associates */}
              {step === 4 && (
                <div className="space-y-6">
                  {!isUnipersonnelle && (
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">
                        {t('create.addAssociates', 'Ajoutez les informations des associés')}
                      </p>
                      <Button type="button" onClick={addAssociate} size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('create.addAssociate', 'Ajouter un associé')}
                      </Button>
                    </div>
                  )}
                  
                  {associates.map((associate, index) => (
                    <Card key={associate.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">
                            {isUnipersonnelle 
                              ? t('create.uniqueAssociate', 'Associé(e) unique')
                              : `${t('create.associate', 'Associé(e)')} ${index + 1}`
                            }
                          </CardTitle>
                          {!isUnipersonnelle && associates.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAssociate(associate.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>{t('create.associateName', 'Nom et prénoms')} *</Label>
                            <Input
                              value={associate.fullName}
                              onChange={(e) => updateAssociate(associate.id, 'fullName', e.target.value)}
                              placeholder="Nom et prénoms"
                            />
                          </div>
                          <div>
                            <Label>{t('create.associatePhone', 'Téléphone')} *</Label>
                            <Input
                              type="tel"
                              value={associate.phone}
                              onChange={(e) => updateAssociate(associate.id, 'phone', e.target.value)}
                              placeholder="+225 XX XX XX XX XX"
                            />
                          </div>
                          <div>
                            <Label>{t('create.associateEmail', 'Email')}</Label>
                            <Input
                              type="email"
                              value={associate.email}
                              onChange={(e) => updateAssociate(associate.id, 'email', e.target.value)}
                              placeholder="email@exemple.com"
                            />
                          </div>
                          <div>
                            <Label>{t('create.associateProfession', 'Profession')}</Label>
                            <Input
                              value={associate.profession}
                              onChange={(e) => updateAssociate(associate.id, 'profession', e.target.value)}
                              placeholder="Profession"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>{t('create.associateAddress', 'Domicile')}</Label>
                            <Input
                              value={associate.residenceAddress}
                              onChange={(e) => updateAssociate(associate.id, 'residenceAddress', e.target.value)}
                              placeholder="Adresse de résidence"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>{t('create.maritalStatus', 'Situation matrimoniale')}</Label>
                          <RadioGroup 
                            value={associate.maritalStatus} 
                            onValueChange={(v) => updateAssociate(associate.id, 'maritalStatus', v)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="celibataire" id={`celibataire-${associate.id}`} />
                                <Label htmlFor={`celibataire-${associate.id}`}>{t('create.single', 'Célibataire')}</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="marie" id={`marie-${associate.id}`} />
                                <Label htmlFor={`marie-${associate.id}`}>{t('create.married', 'Marié(e)')}</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        {associate.maritalStatus === 'marie' && (
                          <div>
                            <Label>{t('create.maritalRegime', 'Régime matrimonial')}</Label>
                            <RadioGroup 
                              value={associate.maritalRegime} 
                              onValueChange={(v) => updateAssociate(associate.id, 'maritalRegime', v)}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="separation" id={`sep-${associate.id}`} />
                                  <Label htmlFor={`sep-${associate.id}`}>{t('create.separationOfProperty', 'Séparation de bien')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="communaute" id={`com-${associate.id}`} />
                                  <Label htmlFor={`com-${associate.id}`}>{t('create.communityOfProperty', 'Communauté de bien')}</Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 5: Other Services */}
              {step === 5 && (
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    {t('create.otherServicesDesc', 'Sélectionnez les autres démarches dont vous avez besoin (sur devis) :')}
                  </p>
                  
                  {otherServiceslist.map((service) => (
                    <div key={service.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={service.id}
                        checked={additionalServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAdditionalServices([...additionalServices, service.id]);
                          } else {
                            setAdditionalServices(additionalServices.filter(s => s !== service.id));
                          }
                        }}
                      />
                      <Label htmlFor={service.id} className="cursor-pointer flex-1">
                        {service.label}
                      </Label>
                    </div>
                  ))}
                  
                  {additionalServices.length > 0 && (
                    <p className="text-sm text-accent font-medium bg-accent/10 p-3 rounded-lg">
                      {t('create.quoteNotice', 'Les services sélectionnés seront traités sur devis.')}
                    </p>
                  )}
                </div>
              )}

              {/* Step 6: Summary */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg mb-4">{t('create.summary', 'Récapitulatif de votre demande')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>{t('create.structureType', 'Forme juridique')} :</strong> {structureTypes.find(t => t.value === companyData.structureType)?.label}</div>
                      <div><strong>{t('create.companyName', 'Dénomination')} :</strong> {companyData.companyName}</div>
                      {companyData.sigle && <div><strong>{t('create.sigle', 'Sigle')} :</strong> {companyData.sigle}</div>}
                      <div><strong>{t('create.capital', 'Capital')} :</strong> {formatNumber(companyData.capital)} FCFA</div>
                      <div><strong>{t('create.city', 'Ville')} :</strong> {locationData.city}</div>
                      <div><strong>{t('create.commune', 'Commune')} :</strong> {locationData.commune}</div>
                      <div><strong>{t('create.managerName', 'Gérant')} :</strong> {managerData.fullName}</div>
                      <div><strong>{t('create.managerPhone', 'Téléphone')} :</strong> {managerData.phone}</div>
                      <div><strong>{t('create.managerEmail', 'Email')} :</strong> {managerData.email}</div>
                      <div><strong>{t('create.associatesCount', 'Associés')} :</strong> {associates.filter(a => a.fullName).length}</div>
                    </div>
                    
                    {additionalServices.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <strong>{t('create.otherServices', 'Autres démarches')} :</strong>
                        <ul className="list-disc list-inside ml-2 mt-2">
                          {additionalServices.map(serviceId => (
                            <li key={serviceId}>{otherServiceslist.find(s => s.id === serviceId)?.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/10 p-6 rounded-lg border-2 border-primary/20">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-lg font-semibold">
                        {t('create.invoiceNotice', 'Facturation')} :
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {t('create.invoiceMessage', 'Une facture personnalisée vous sera envoyée')}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Une facture générée et adaptée à votre demande vous sera envoyée après étude de votre dossier. Le tarif varie selon la forme juridique, la localisation et les spécificités de votre projet.
                    </p>
                    {referrerName && (
                      <p className="text-sm text-accent font-medium mt-2">
                        ✅ Parrainage validé par {referrerName} — une réduction sera appliquée sur votre facture.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                {step > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    {t('common.previous', 'Précédent')}
                  </Button>
                )}
                
                {step < 6 ? (
                  <Button onClick={nextStep} className="ml-auto">
                    {t('common.next', 'Suivant')}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    className="ml-auto bg-accent hover:bg-accent/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? t('create.processing', 'Traitement en cours...') 
                      : t('create.submitRequest', 'Soumettre ma demande')
                    }
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Create;
