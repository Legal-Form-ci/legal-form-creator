import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Camera, Loader2, Save, User } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d\s().-]{6,20}$/;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  });
  const [errors, setErrors] = useState<{ full_name?: string; email?: string; phone?: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (user) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
    }

    setProfile({
      full_name: data?.full_name || (user!.user_metadata as any)?.full_name || "",
      email: data?.email || user!.email || "",
      phone: data?.phone || "",
      avatar_url: data?.avatar_url || (user!.user_metadata as any)?.avatar_url || "",
    });
    setLoading(false);
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!profile.full_name.trim() || profile.full_name.trim().length < 2) {
      next.full_name = "Le nom doit contenir au moins 2 caractères.";
    }
    if (!EMAIL_REGEX.test(profile.email.trim())) {
      next.email = "Adresse email invalide.";
    }
    if (profile.phone && !PHONE_REGEX.test(profile.phone.trim())) {
      next.phone = "Numéro de téléphone invalide.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast({ title: "Format non supporté", description: "Utilisez JPG, PNG, WEBP ou GIF.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast({ title: "Fichier trop volumineux", description: "L'image doit faire moins de 5 Mo.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `avatars/${user!.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      const newUrl = urlData.publicUrl;

      // Persist immediately so it survives a reload even without "Save"
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user!.id,
          avatar_url: newUrl,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: newUrl }));
      toast({ title: "Photo mise à jour ✅" });
    } catch (err: any) {
      toast({ title: "Échec de l'upload", description: err.message || "Réessayez plus tard.", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validate()) {
      toast({ title: "Formulaire incomplet", description: "Corrigez les erreurs avant d'enregistrer.", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name.trim(),
          email: profile.email.trim().toLowerCase(),
          phone: profile.phone.trim(),
          avatar_url: profile.avatar_url || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      // Sync auth email if it changed
      if (profile.email.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: profile.email.trim().toLowerCase() });
        if (emailErr) {
          toast({
            title: "Profil enregistré",
            description: `Email du compte non modifié : ${emailErr.message}`,
          });
        } else {
          toast({ title: "Profil enregistré", description: "Un email de confirmation a été envoyé pour valider la nouvelle adresse." });
        }
      } else {
        toast({ title: "Profil enregistré ✅" });
      }
    } catch (err: any) {
      toast({ title: "Échec de l'enregistrement", description: err.message || "Réessayez.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                    aria-label="Changer la photo de profil"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </div>
              </div>
              <CardTitle className="text-2xl">
                <User className="inline-block mr-2 h-6 w-6" /> Mon Profil
              </CardTitle>
              <CardDescription>Gérez vos informations personnelles</CardDescription>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF — 5 Mo max.</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet *</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Votre nom complet"
                  aria-invalid={!!errors.full_name}
                />
                {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  placeholder="votre@email.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                <p className="text-xs text-muted-foreground">
                  Modifier l'email enverra un lien de confirmation à la nouvelle adresse.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+225 07 00 00 00 00"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Enregistrer les modifications</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
