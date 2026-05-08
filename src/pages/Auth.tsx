import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COUNTRY_CODES = [
  { code: "+225", country: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+33", country: "FR", name: "France", flag: "🇫🇷" },
  { code: "+1", country: "US", name: "États-Unis", flag: "🇺🇸" },
  { code: "+44", country: "GB", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "+32", country: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "+41", country: "CH", name: "Suisse", flag: "🇨🇭" },
  { code: "+1", country: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "+212", country: "MA", name: "Maroc", flag: "🇲🇦" },
  { code: "+221", country: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "+223", country: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "+226", country: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "+228", country: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "+229", country: "BJ", name: "Bénin", flag: "🇧🇯" },
  { code: "+227", country: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "+224", country: "GN", name: "Guinée", flag: "🇬🇳" },
  { code: "+237", country: "CM", name: "Cameroun", flag: "🇨🇲" },
  { code: "+241", country: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "+242", country: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "+243", country: "CD", name: "RD Congo", flag: "🇨🇩" },
  { code: "+250", country: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "+234", country: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "+49", country: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "+39", country: "IT", name: "Italie", flag: "🇮🇹" },
  { code: "+34", country: "ES", name: "Espagne", flag: "🇪🇸" },
  { code: "+86", country: "CN", name: "Chine", flag: "🇨🇳" },
  { code: "+91", country: "IN", name: "Inde", flag: "🇮🇳" },
  { code: "+55", country: "BR", name: "Brésil", flag: "🇧🇷" },
  { code: "+7", country: "RU", name: "Russie", flag: "🇷🇺" },
  { code: "+81", country: "JP", name: "Japon", flag: "🇯🇵" },
  { code: "+27", country: "ZA", name: "Afrique du Sud", flag: "🇿🇦" },
  { code: "+971", country: "AE", name: "Émirats Arabes Unis", flag: "🇦🇪" },
  { code: "+966", country: "SA", name: "Arabie Saoudite", flag: "🇸🇦" },
  { code: "+90", country: "TR", name: "Turquie", flag: "🇹🇷" },
  { code: "+20", country: "EG", name: "Égypte", flag: "🇪🇬" },
  { code: "+216", country: "TN", name: "Tunisie", flag: "🇹🇳" },
  { code: "+213", country: "DZ", name: "Algérie", flag: "🇩🇿" },
];

const detectCountryCode = (): string => {
  try {
    const lang = navigator.language || navigator.languages?.[0] || '';
    const region = lang.split('-')[1]?.toUpperCase();
    if (region) {
      const match = COUNTRY_CODES.find(c => c.country === region);
      if (match) return match.code;
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Abidjan') || tz.includes('Africa/Abidjan')) return '+225';
    if (tz.includes('Europe/Paris')) return '+33';
    if (tz.includes('America/New_York') || tz.includes('America/Chicago')) return '+1';
    if (tz.includes('Europe/London')) return '+44';
  } catch {}
  return '+225';
};

const Auth = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState(() => detectCountryCode());
  const [whatsapp, setWhatsapp] = useState("");
  const { signUp, signIn, user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({
        title: "Connexion Google échouée",
        description: err.message?.includes("provider is not enabled")
          ? "Le fournisseur Google n'est pas activé dans Supabase. Activez-le dans Authentication → Providers."
          : err.message,
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (user && userRole !== null) {
      if (userRole === 'admin' || userRole === 'team') {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/client/dashboard", { replace: true });
      }
    }
  }, [user, userRole, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = `${countryCode} ${phone}`;
    await signUp(email, password, fullName, fullPhone);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  const selectedCountry = useMemo(() => 
    COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0],
    [countryCode]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-heading font-bold text-4xl text-foreground mb-4">
              {t('auth.login')} / {t('auth.signup')}
            </h1>
            <p className="text-muted-foreground">
              Accédez à votre espace personnel
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>{t('auth.login')}</CardTitle>
                  <CardDescription>
                    Connectez-vous pour suivre vos dossiers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    {googleLoading ? "Connexion..." : "Continuer avec Google"}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">{t('auth.email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">{t('auth.password')}</Label>
                      <PasswordInput
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="text-right">
                      <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                        {t('auth.forgotPassword')}
                      </Link>
                    </div>
                    <Button type="submit" className="w-full">
                      {t('auth.loginButton')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>{t('auth.signup')}</CardTitle>
                  <CardDescription>
                    Créez un compte pour commencer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-name">{t('form.name')}</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-phone">{t('form.phone')}</Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-[130px] shrink-0">
                            <SelectValue>
                              <span className="flex items-center gap-1">
                                <span>{selectedCountry.flag}</span>
                                <span className="text-xs">{countryCode}</span>
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {COUNTRY_CODES.map((c) => (
                              <SelectItem key={`${c.country}-${c.code}`} value={c.code}>
                                <span className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span className="text-sm">{c.name}</span>
                                  <span className="text-xs text-muted-foreground">{c.code}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="signup-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="07 09 67 79 25"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-whatsapp">
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          WhatsApp (optionnel)
                        </span>
                      </Label>
                      <Input
                        id="signup-whatsapp"
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder={`${countryCode} 07 09 67 79 25`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">{t('auth.email')}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">{t('auth.password')}</Label>
                      <PasswordInput
                        id="signup-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <PasswordStrengthIndicator password={password} />
                    </div>
                    <Button type="submit" className="w-full">
                      {t('auth.signupButton')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
