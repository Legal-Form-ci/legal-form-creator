import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import WysiwygEditor from "@/components/WysiwygEditor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Send, Save, Calendar, Loader2, Mail, Eye, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import DnsStatusCard from "@/components/admin/DnsStatusCard";

interface Campaign {
  id: string;
  subject: string;
  html_content: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  success_count: number;
  failure_count: number;
  created_at: string;
}

const NewsletterCompose = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<h2>Bonjour 👋</h2>\n<p>Voici les nouveautés Legal Form…</p>");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSubs, setActiveSubs] = useState(0);

  const load = async () => {
    const [{ data: list }, { count }] = await Promise.all([
      supabase.from("newsletter_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setCampaigns(list || []);
    setActiveSubs(count || 0);
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditingId(null);
    setSubject("");
    setHtml("<h2>Bonjour 👋</h2>\n<p>Voici les nouveautés Legal Form…</p>");
    setScheduledAt("");
  };

  const save = async (asScheduled = false) => {
    if (!subject.trim() || !html.trim()) {
      toast({ title: "Champs requis", description: "Sujet et contenu sont requis.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const payload: any = {
      subject,
      html_content: html,
      status: asScheduled && scheduledAt ? "scheduled" : "draft",
      scheduled_at: asScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };
    let res;
    if (editingId) {
      res = await supabase.from("newsletter_campaigns").update(payload).eq("id", editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      res = await supabase.from("newsletter_campaigns").insert({ ...payload, created_by: user?.id });
    }
    setLoading(false);
    if (res.error) {
      toast({ title: "Erreur", description: res.error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Campagne mise à jour" : "Brouillon enregistré" });
      reset(); load();
    }
  };

  const sendNow = async (id?: string, isTest = false) => {
    const campaignId = id || editingId;
    if (!campaignId) {
      toast({ title: "Enregistrez d'abord la campagne", variant: "destructive" });
      return;
    }
    if (isTest && !testEmail) {
      toast({ title: "Indiquez un email de test", variant: "destructive" });
      return;
    }
    if (!isTest && !confirm(`Envoyer maintenant à ${activeSubs} abonnés actifs ?`)) return;

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("send-newsletter-campaign", {
      body: { campaignId, testEmail: isTest ? testEmail : undefined },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur d'envoi", description: error.message, variant: "destructive" });
    } else if (data?.error) {
      toast({ title: "Erreur d'envoi", description: data.error, variant: "destructive" });
    } else {
      toast({
        title: isTest ? "Email de test envoyé" : "Campagne envoyée",
        description: data?.failure
          ? `${data?.success || 0}/${data?.total || 0} réussis • ${data.failure} échec(s)`
          : `${data?.success || 0}/${data?.total || 0} envois réussis`,
      });
      load();
    }
  };

  const editCampaign = (c: Campaign) => {
    setEditingId(c.id);
    setSubject(c.subject);
    setHtml(c.html_content);
    setScheduledAt(c.scheduled_at ? c.scheduled_at.slice(0, 16) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      scheduled: "bg-blue-100 text-blue-800",
      sending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      partial_failed: "bg-orange-100 text-orange-800",
      failed: "bg-red-100 text-red-800",
    };
    return <Badge className={map[s] || ""}>{s}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Mail className="h-6 w-6 sm:h-7 sm:w-7" /> Composer la newsletter</h1>
            <p className="text-muted-foreground">{activeSubs} abonné(s) actif(s)</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/newsletter/logs"><ScrollText className="h-4 w-4 mr-1" /> Journal des envois</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DnsStatusCard />
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Astuce</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Tant que SPF/DKIM/DMARC ne sont pas <strong>OK</strong>, les emails risquent d'être marqués comme spam.
              Ajoutez les enregistrements DNS fournis dans Resend depuis votre hébergeur.
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="compose">
          <TabsList>
            <TabsTrigger value="compose">{editingId ? "Modifier" : "Composer"}</TabsTrigger>
            <TabsTrigger value="history">Campagnes ({campaigns.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "Modifier la campagne" : "Nouvelle campagne"}</CardTitle>
                <CardDescription>Composez en HTML. Un lien de désinscription RGPD est ajouté automatiquement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sujet de l'email</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Newsletter Legal Form – Mai 2026" />
                </div>
                <div className="space-y-2">
                  <Label>Contenu de l'email</Label>
                  <WysiwygEditor value={html} onChange={setHtml} className="rounded-md border" />
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Éditer le HTML brut (avancé)</summary>
                    <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={8} className="font-mono text-xs mt-2" />
                  </details>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Planifier (optionnel)</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>

                <div className="grid gap-2 sm:flex sm:flex-wrap">
                  <Button onClick={() => save(false)} variant="outline" disabled={loading} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" /> Enregistrer brouillon
                  </Button>
                  <Button onClick={() => save(true)} variant="outline" disabled={loading || !scheduledAt} className="w-full sm:w-auto">
                    <Calendar className="mr-2 h-4 w-4" /> Planifier
                  </Button>
                  <Button onClick={() => sendNow(undefined, false)} disabled={loading || !editingId} className="w-full sm:w-auto">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Envoyer maintenant
                  </Button>
                  {editingId && <Button onClick={reset} variant="ghost">Annuler</Button>}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <Label>Email de test</Label>
                  <div className="grid gap-2 sm:flex">
                    <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="vous@exemple.com" />
                    <Button onClick={() => sendNow(undefined, true)} variant="secondary" disabled={loading || !editingId} className="w-full sm:w-auto">
                      Envoyer test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Aperçu</CardTitle></CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white text-black max-h-[400px] overflow-auto" dangerouslySetInnerHTML={{ __html: html }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {campaigns.length === 0 && <p className="p-6 text-muted-foreground text-center">Aucune campagne pour le moment.</p>}
                  {campaigns.map((c) => (
                    <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{c.subject}</p>
                          {statusBadge(c.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.sent_at ? `Envoyé ${new Date(c.sent_at).toLocaleString("fr-FR")} • ${c.success_count}/${c.recipients_count} réussis` :
                           c.scheduled_at ? `Planifié ${new Date(c.scheduled_at).toLocaleString("fr-FR")}` :
                           `Créé ${new Date(c.created_at).toLocaleString("fr-FR")}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => editCampaign(c)}>Modifier</Button>
                        {!["sent", "partial_failed", "sending"].includes(c.status) && (
                          <Button size="sm" onClick={() => sendNow(c.id, false)}>Envoyer</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default NewsletterCompose;
