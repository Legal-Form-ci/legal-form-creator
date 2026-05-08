import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const NewsletterUnsubscribe = () => {
  const [params] = useSearchParams();
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const unsubscribe = async (emailToUnsub: string) => {
    if (!emailToUnsub || !emailToUnsub.includes("@")) {
      setStatus("error");
      setMessage("Veuillez entrer une adresse email valide.");
      return;
    }
    setStatus("loading");
    const { data, error } = await supabase.rpc("unsubscribe_newsletter", { _email: emailToUnsub });
    if (error) {
      setStatus("error");
      setMessage("Une erreur est survenue. Veuillez réessayer ou nous contacter.");
      return;
    }
    if (data === true) {
      setStatus("success");
      setMessage(`L'adresse ${emailToUnsub} a bien été désabonnée de notre newsletter. Conformément au RGPD, vous ne recevrez plus aucune communication marketing.`);
    } else {
      setStatus("error");
      setMessage(`Aucun abonnement actif n'a été trouvé pour ${emailToUnsub}.`);
    }
  };

  useEffect(() => {
    if (initialEmail) unsubscribe(initialEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Helmet>
        <title>Désinscription Newsletter | Legal Form</title>
        <meta name="description" content="Désinscrivez-vous de la newsletter Legal Form en un clic. Conforme RGPD." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-[70vh] container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Désinscription Newsletter</CardTitle>
            <CardDescription>
              Conformément au RGPD, vous pouvez vous désabonner à tout moment de notre newsletter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" ? (
              <div className="flex gap-3 items-start p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-900 dark:text-green-200">{message}</p>
              </div>
            ) : status === "error" ? (
              <div className="flex gap-3 items-start p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{message}</p>
              </div>
            ) : null}

            {status !== "success" && (
              <form
                onSubmit={(e) => { e.preventDefault(); unsubscribe(email); }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email à désabonner</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                  />
                </div>
                <Button type="submit" disabled={status === "loading"} className="w-full">
                  {status === "loading" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Désinscription en cours…</>
                  ) : (
                    "Me désabonner"
                  )}
                </Button>
              </form>
            )}

            <div className="text-center pt-4 border-t">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
                Retour à l'accueil
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
};

export default NewsletterUnsubscribe;
