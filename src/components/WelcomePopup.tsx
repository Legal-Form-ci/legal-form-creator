import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Sparkles, ArrowRight, Building2, FileCheck, Clock, Gift, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PROMO_END_DATE = new Date("2025-03-15T23:59:59");
const MAX_PROMO_CLIENTS = 10;
const DISCOUNT_PERCENT = 15;

const WelcomePopup = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(25);
  const [promoActive, setPromoActive] = useState(false);
  const [promoSpotsLeft, setPromoSpotsLeft] = useState(0);

  useEffect(() => {
    const checkPromo = async () => {
      const now = new Date();
      if (now > PROMO_END_DATE) {
        setPromoActive(false);
        return;
      }

      try {
        const { count } = await supabase
          .from("company_requests")
          .select("id", { count: "exact", head: true })
          .gt("promo_bonus", 0);
        
        const used = count || 0;
        if (used < MAX_PROMO_CLIENTS) {
          setPromoActive(true);
          setPromoSpotsLeft(MAX_PROMO_CLIENTS - used);
        }
      } catch {
        // Promo check failed, don't show promo
      }
    };

    const lastShown = localStorage.getItem("welcomePopupLastShown");
    const today = new Date().toDateString();
    if (lastShown === today) return; // Already shown today

    checkPromo();
    const showTimer = setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem("welcomePopupLastShown", today);
    }, 2000);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
      setIsOpen(false);
    }
  }, [isOpen, countdown]);

  const handleClose = () => setIsOpen(false);

  const features = [
    { icon: Building2, title: "Création rapide", desc: "Accompagnement personnalisé" },
    { icon: FileCheck, title: "100% en ligne", desc: "Sans déplacement" },
    { icon: Clock, title: "Suivi en temps réel", desc: "Suivez votre dossier" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[620px] p-0 border-0 overflow-hidden bg-transparent">
        <DialogHeader className="sr-only">
          <DialogTitle>Popup de bienvenue Legal Form</DialogTitle>
          <DialogDescription>
            Offre promotionnelle et accès rapide à la création d'entreprise.
          </DialogDescription>
        </DialogHeader>
        <div className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent/30 blur-2xl -translate-x-1/2 translate-y-1/2" />
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all group"
          >
            <span className="text-sm font-medium">{countdown}s</span>
            <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          </button>

          <div className="relative p-6 sm:p-8 text-center">
            {/* Promo Banner */}
            {promoActive && (
              <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-300/30 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-amber-300" />
                  <span className="text-amber-200 font-bold text-sm uppercase tracking-wide">
                    Offre Spéciale Lancement
                  </span>
                  <Percent className="h-5 w-5 text-amber-300" />
                </div>
                <p className="text-white font-bold text-2xl sm:text-3xl mb-1">
                  -{DISCOUNT_PERCENT}% de réduction
                </p>
                <p className="text-white/80 text-sm">
                  Pour les <strong>{MAX_PROMO_CLIENTS} premiers clients</strong> — Plus que{" "}
                  <strong className="text-amber-300">{promoSpotsLeft} place{promoSpotsLeft > 1 ? "s" : ""}</strong> !
                </p>
                <p className="text-white/60 text-xs mt-1">
                  Valable jusqu'au 15 mars 2025
                </p>
              </div>
            )}

            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 sm:mb-6">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-accent animate-pulse" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white mb-3">
              Bienvenue sur Legal Form
            </h2>
            <p className="text-white/90 text-base sm:text-lg mb-6 max-w-md mx-auto">
              Votre partenaire de confiance pour la création et la gestion d'entreprise en Côte d'Ivoire
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-accent mx-auto mb-2" />
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-1">{feature.title}</h3>
                    <p className="text-white/70 text-xs sm:text-sm">{feature.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/create" onClick={handleClose}>
                <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 h-auto group shadow-lg">
                  {promoActive ? `Profiter de -${DISCOUNT_PERCENT}%` : "Créer mon entreprise"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={handleClose} className="w-full sm:w-auto border-2 border-white/30 bg-transparent text-white hover:bg-white/10 font-medium px-6 py-3 h-auto">
                Explorer le site
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-6 sm:gap-10 text-white">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-accent">100+</div>
                <div className="text-xs sm:text-sm text-white/70">Entreprises créées</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-accent">Rapide</div>
                <div className="text-xs sm:text-sm text-white/70">Création rapide</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-accent">13</div>
                <div className="text-xs sm:text-sm text-white/70">Régions couvertes</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
