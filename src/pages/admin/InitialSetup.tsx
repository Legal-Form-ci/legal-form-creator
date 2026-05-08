import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const InitialSetup = () => {
  const [isCreating, setIsCreating] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const createSuperAdmin = async () => {
    // Validate form
    if (!formData.email || !formData.password || !formData.fullName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone
        }
      });

      if (error) throw error;

      toast({
        title: "Super Admin créé avec succès",
        description: `Le compte ${formData.email} a été créé. Vous pouvez maintenant vous connecter.`,
      });

      // Redirect to auth page after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
      
    } catch (error: any) {
      console.error('Erreur lors de la création du super admin:', error);
      
      let errorMessage = "Impossible de créer le compte super admin";
      
      // Handle FunctionsHttpError
      if (error?.name === 'FunctionsHttpError') {
        try {
          const errorBody = await error.context?.json?.();
          errorMessage = errorBody?.error || errorMessage;
          
          if (errorBody?.code === 'ADMIN_EXISTS') {
            toast({
              title: "Administrateur existant",
              description: "Un compte administrateur existe déjà. Veuillez vous connecter.",
            });
            setTimeout(() => navigate('/auth'), 2000);
            return;
          }
        } catch {
          // If we can't parse the error, use the default message
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl">Configuration Initiale</CardTitle>
              <CardDescription>
                Créez le compte Super Administrateur pour commencer à utiliser la plateforme
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Entrez le nom complet"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 caractères"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmez le mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Important:</strong> Choisissez un mot de passe fort et conservez-le en lieu sûr. Ce compte aura un accès complet à la plateforme.
                </p>
              </div>

              <Button 
                onClick={createSuperAdmin}
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? "Création en cours..." : "Créer le Super Admin"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Cette action ne peut être effectuée qu'une seule fois lors de la configuration initiale de la plateforme.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InitialSetup;
