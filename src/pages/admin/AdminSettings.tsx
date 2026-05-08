import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Globe, CreditCard, Save, RefreshCw } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const AdminSettings = () => {
  const { toast } = useToast();
  const { settings, loading, updateSettings, refreshSettings } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  
  // Local state for editing
  const [localPricing, setLocalPricing] = useState({
    abidjan: 255000,
    interior: 169000,
    referral_bonus: 10000
  });
  
  const [localContact, setLocalContact] = useState({
    phone: '',
    whatsapp: '',
    email: '',
    address: ''
  });
  
  const [localGeneral, setLocalGeneral] = useState({
    site_name: '',
    site_tagline: ''
  });

  // Sync from server settings
  useEffect(() => {
    if (!loading) {
      setLocalPricing(settings.pricing);
      setLocalContact(settings.contact);
      setLocalGeneral(settings.general);
    }
  }, [settings, loading]);

  const savePricing = async () => {
    setSaving(true);
    const result = await updateSettings('pricing', localPricing);
    if (result.success) {
      toast({
        title: "Succès",
        description: "Tarifs mis à jour et synchronisés sur toute la plateforme",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les tarifs",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const saveContact = async () => {
    setSaving(true);
    const result = await updateSettings('contact', localContact);
    if (result.success) {
      toast({
        title: "Succès",
        description: "Informations de contact mises à jour",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les contacts",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const saveGeneral = async () => {
    setSaving(true);
    const result = await updateSettings('general', localGeneral);
    if (result.success) {
      toast({
        title: "Succès",
        description: "Paramètres généraux mis à jour",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    }
    setSaving(false);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Paramètres</h1>
            <p className="text-slate-400 mt-1">Configurez les paramètres du site - Synchronisation automatique</p>
          </div>
          <Button onClick={refreshSettings} variant="outline" className="border-slate-600">
            <RefreshCw className="mr-2 h-4 w-4" />
            Rafraîchir
          </Button>
        </div>

        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="pricing" className="data-[state=active]:bg-primary">
              <CreditCard className="mr-2 h-4 w-4" />
              Tarification
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-primary">
              <Globe className="mr-2 h-4 w-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="general" className="data-[state=active]:bg-primary">
              <Settings className="mr-2 h-4 w-4" />
              Général
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Tarification</CardTitle>
                <CardDescription className="text-slate-400">
                  Les prix sont automatiquement synchronisés sur toute la plateforme (page d'accueil, formulaires, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-300">Prix Abidjan (FCFA)</Label>
                    <Input
                      type="number"
                      value={localPricing.abidjan}
                      onChange={(e) => setLocalPricing({ ...localPricing, abidjan: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Prix création entreprise à Abidjan</p>
                  </div>
                  <div>
                    <Label className="text-slate-300">Prix Intérieur (FCFA)</Label>
                    <Input
                      type="number"
                      value={localPricing.interior}
                      onChange={(e) => setLocalPricing({ ...localPricing, interior: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Prix pour l'intérieur du pays</p>
                  </div>
                  <div>
                    <Label className="text-slate-300">Bonus Parrainage (FCFA)</Label>
                    <Input
                      type="number"
                      value={localPricing.referral_bonus}
                      onChange={(e) => setLocalPricing({ ...localPricing, referral_bonus: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Réduction parrainage (parrain & filleul)</p>
                  </div>
                </div>
                <Button onClick={savePricing} disabled={saving} className="bg-primary hover:bg-primary/90">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder les tarifs'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Informations de contact</CardTitle>
                <CardDescription className="text-slate-400">
                  Coordonnées affichées sur le site et dans les communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Téléphone principal</Label>
                    <Input
                      value={localContact.phone}
                      onChange={(e) => setLocalContact({ ...localContact, phone: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">WhatsApp</Label>
                    <Input
                      value={localContact.whatsapp}
                      onChange={(e) => setLocalContact({ ...localContact, whatsapp: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    type="email"
                    value={localContact.email}
                    onChange={(e) => setLocalContact({ ...localContact, email: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Adresse</Label>
                  <Input
                    value={localContact.address}
                    onChange={(e) => setLocalContact({ ...localContact, address: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button onClick={saveContact} disabled={saving} className="bg-primary hover:bg-primary/90">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder les contacts'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Informations générales</CardTitle>
                <CardDescription className="text-slate-400">
                  Paramètres de base du site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Nom du site</Label>
                  <Input
                    value={localGeneral.site_name}
                    onChange={(e) => setLocalGeneral({ ...localGeneral, site_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Slogan</Label>
                  <Input
                    value={localGeneral.site_tagline}
                    onChange={(e) => setLocalGeneral({ ...localGeneral, site_tagline: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button onClick={saveGeneral} disabled={saving} className="bg-primary hover:bg-primary/90">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;