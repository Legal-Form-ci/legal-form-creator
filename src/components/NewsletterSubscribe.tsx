import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, User } from "lucide-react";

interface Props {
  source?: string;
  variant?: "footer" | "inline";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NewsletterSubscribe = ({ source = "footer", variant = "footer" }: Props) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast({ title: "Email invalide", description: "Veuillez entrer une adresse email valide.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: trimmedEmail, full_name: trimmedName || null, source });

      if (error && error.code !== "23505") throw error;

      const alreadySubscribed = error?.code === "23505";
      toast({
        title: alreadySubscribed ? "Déjà inscrit" : "Inscription confirmée 🎉",
        description: alreadySubscribed
          ? "Cet email est déjà abonné — nous vous renvoyons votre email de bienvenue."
          : "Merci ! Un email de bienvenue vous a été envoyé.",
      });
      setEmail("");
      setFullName("");

      // Always trigger the welcome email (even on duplicate, in case they missed it)
      supabase.functions
        .invoke("send-newsletter-welcome", {
          body: { email: trimmedEmail, fullName: trimmedName || null },
        })
        .catch((err) => console.warn("welcome email failed:", err));
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Échec de l'inscription. Réessayez.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={variant === "footer" ? "space-y-2" : "space-y-2 max-w-md"}>
      {variant === "footer" && (
        <p className="text-sm text-muted-foreground">Recevez nos actualités juridiques et nos guides.</p>
      )}
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Votre nom complet"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="pl-9"
          aria-label="Nom complet"
        />
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            required
            aria-label="Adresse email pour la newsletter"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "S'inscrire"}
        </Button>
      </div>
    </form>
  );
};

export default NewsletterSubscribe;
