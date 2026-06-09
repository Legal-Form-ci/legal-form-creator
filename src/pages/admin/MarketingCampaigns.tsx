import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import MarketingTabs from "@/components/admin/MarketingTabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Send, Mail, Zap, ScrollText, ArrowRight, Users, CheckCircle2, AlertCircle } from "lucide-react";

interface Stats {
  subscribers: number;
  activeSubs: number;
  campaigns: number;
  sentCampaigns: number;
  automations: number;
  activeAutomations: number;
  lastSent?: string | null;
}

const MarketingCampaigns = () => {
  const [stats, setStats] = useState<Stats>({
    subscribers: 0, activeSubs: 0, campaigns: 0, sentCampaigns: 0,
    automations: 0, activeAutomations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [subs, camps, autos] = await Promise.all([
        supabase.from("newsletter_subscribers").select("id, is_active"),
        supabase.from("newsletter_campaigns").select("id, status, sent_at").order("sent_at", { ascending: false }),
        supabase.from("newsletter_automations").select("id, is_active"),
      ]);
      const subsData = subs.data || [];
      const campsData = camps.data || [];
      const autosData = autos.data || [];
      setStats({
        subscribers: subsData.length,
        activeSubs: subsData.filter((s: any) => s.is_active).length,
        campaigns: campsData.length,
        sentCampaigns: campsData.filter((c: any) => c.status === "sent").length,
        automations: autosData.length,
        activeAutomations: autosData.filter((a: any) => a.is_active).length,
        lastSent: campsData.find((c: any) => c.sent_at)?.sent_at ?? null,
      });
      setLoading(false);
    })();
  }, []);

  const sections = [
    {
      title: "Composer & Envoyer",
      desc: "Créez une campagne, choisissez un segment et envoyez (immédiat, planifié ou test).",
      href: "/admin/newsletter/compose",
      icon: Send,
      color: "from-blue-500/20 to-blue-500/5",
    },
    {
      title: "Abonnés",
      desc: "Liste des abonnés newsletter, recherche, export CSV et désinscriptions.",
      href: "/admin/newsletter",
      icon: Mail,
      color: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      title: "Automatisations",
      desc: "Newsletters automatiques (actualités, opportunités) en mode test ou production.",
      href: "/admin/newsletter/automations",
      icon: Zap,
      color: "from-amber-500/20 to-amber-500/5",
    },
    {
      title: "Journal d'envois",
      desc: "Historique détaillé : succès, échecs, providers, relances.",
      href: "/admin/newsletter/logs",
      icon: ScrollText,
      color: "from-purple-500/20 to-purple-500/5",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Campagnes Marketing"
          description="Centre unifié pour les emails, automatisations, segments et statistiques d'envoi."
          icon={Megaphone}
          actions={
            <Button asChild>
              <Link to="/admin/newsletter/compose">
                <Send className="mr-2 h-4 w-4" /> Nouvelle campagne
              </Link>
            </Button>
          }
        />

        <MarketingTabs />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Abonnés actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "…" : stats.activeSubs}</p>
              <p className="text-xs text-muted-foreground">sur {stats.subscribers} au total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Campagnes envoyées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "…" : stats.sentCampaigns}</p>
              <p className="text-xs text-muted-foreground">sur {stats.campaigns} créées</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" /> Automatisations actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "…" : stats.activeAutomations}</p>
              <p className="text-xs text-muted-foreground">sur {stats.automations} configurées</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Dernier envoi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {stats.lastSent ? new Date(stats.lastSent).toLocaleDateString("fr-FR") : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.lastSent ? new Date(stats.lastSent).toLocaleTimeString("fr-FR") : "Aucun envoi enregistré"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((s) => (
            <Link key={s.href} to={s.href} className="group">
              <Card className={`h-full transition-all hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br ${s.color}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg bg-background/80 backdrop-blur">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="mt-3">{s.title}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bonnes pratiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Toujours envoyer un <Badge variant="outline">test</Badge> à votre email avant un envoi en masse.</p>
            <p>• Segmentez vos campagnes (abonnés, demandeurs, équipe) pour maximiser l'engagement.</p>
            <p>• Activez les automatisations en mode test avant de basculer en production.</p>
            <p>• Surveillez le journal d'envois pour identifier les bounces et nettoyer la liste.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default MarketingCampaigns;
