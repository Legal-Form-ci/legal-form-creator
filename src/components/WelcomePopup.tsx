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
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none w-[calc(100vw-1.5rem)] sm:w-auto sm:max-w-[500px] md:max-w-[580px] max-h-[calc(100dvh-2rem)] overflow-hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Popup de bienvenue Legal Form</DialogTitle>
          <DialogDescription>
            Offre promotionnelle et accès rapide à la création d'entreprise.
          </DialogDescription>
        </DialogHeader>
        <div className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 rounded-2xl shadow-premium overflow-hidden max-h-[calc(100dvh-2rem)] flex flex-col">
          {/* Decorations */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent/30 blur-2xl -translate-x-1/2 translate-y-1/2" />
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-sm"
          >
            <span className="text-xs font-medium tabular-nums">{countdown}s</span>
            <X className="h-4 w-4" />
          </button>

          <div className="relative p-5 sm:p-7 text-center overflow-y-auto overscroll-contain">
            {/* Promo Banner */}
            {promoActive && (
              <div className="mb-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-300/30 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <Gift className="h-4 w-4 text-amber-300" />
                  <span className="text-amber-200 font-bold text-[11px] sm:text-xs uppercase tracking-wide">
                    Offre Spéciale Lancement
                  </span>
                  <Percent className="h-4 w-4 text-amber-300" />
                </div>
                <p className="text-white font-bold text-xl sm:text-2xl mb-0.5">
                  -{DISCOUNT_PERCENT}% de réduction
                </p>
                <p className="text-white/80 text-xs sm:text-sm">
                  Pour les <strong>{MAX_PROMO_CLIENTS} premiers clients</strong> — Plus que{" "}
                  <strong className="text-amber-300">{promoSpotsLeft} place{promoSpotsLeft > 1 ? "s" : ""}</strong> !
                </p>
              </div>
            )}

            {/* Logo */}
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-3 sm:mb-4">
              <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-accent animate-pulse" />
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-white mb-2 leading-tight">
              Bienvenue sur Legal Form
            </h2>
            <p className="text-white/90 text-sm sm:text-base mb-5 max-w-md mx-auto leading-relaxed">
              Votre partenaire de confiance pour la création et la gestion d'entreprise en Côte d'Ivoire
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="p-2.5 sm:p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent mx-auto mb-1.5" />
                    <h3 className="font-semibold text-white text-[11px] sm:text-sm leading-tight mb-0.5">{feature.title}</h3>
                    <p className="text-white/70 text-[10px] sm:text-xs leading-tight hidden sm:block">{feature.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link to="/create" onClick={handleClose} className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-white font-semibold px-5 group shadow-lg">
                  {promoActive ? `Profiter de -${DISCOUNT_PERCENT}%` : "Créer mon entreprise"}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={handleClose} className="w-full sm:w-auto border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white font-medium px-5">
                Explorer
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-white">
              <div>
                <div className="text-lg sm:text-2xl font-bold text-accent">100+</div>
                <div className="text-[10px] sm:text-xs text-white/70 leading-tight">Entreprises créées</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-accent">Rapide</div>
                <div className="text-[10px] sm:text-xs text-white/70 leading-tight">Délais courts</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-accent">13</div>
                <div className="text-[10px] sm:text-xs text-white/70 leading-tight">Régions couvertes</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
