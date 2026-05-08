import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "confirmed" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for hash params (Supabase sends tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get("type");

        if (type === "signup" || type === "email") {
          setStatus("confirmed");
          // Auto redirect after 3 seconds
          setTimeout(() => navigate("/auth", { replace: true }), 3000);
          return;
        }

        if (type === "recovery") {
          navigate("/reset-password" + window.location.hash, { replace: true });
          return;
        }

        // If already logged in, redirect to dashboard
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (roleData?.role === "admin" || roleData?.role === "team") {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/client/dashboard", { replace: true });
          }
        } else {
          setStatus("confirmed");
          setTimeout(() => navigate("/auth", { replace: true }), 3000);
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-md text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Vérification en cours...</p>
            </div>
          )}

          {status === "confirmed" && (
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="font-heading font-bold text-3xl text-foreground">
                ✅ Email confirmé avec succès
              </h1>
              <p className="text-muted-foreground text-lg">
                Votre compte a été activé. Vous pouvez maintenant vous connecter
                et accéder à votre espace sécurisé.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirection automatique dans quelques secondes...
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Se connecter</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <h1 className="font-heading font-bold text-3xl text-foreground">
                Erreur de vérification
              </h1>
              <p className="text-muted-foreground">
                Le lien est peut-être expiré. Veuillez réessayer.
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Retour à la connexion</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthCallback;
