import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Zap, Plus, Trash2, Play, ArrowLeft, Loader2, FlaskConical } from "lucide-react";

interface Automation {
  id: string;
  name: string;
  source_type: "news" | "opportunity";
  frequency: "hourly" | "daily" | "weekly";
  time_of_day: string | null;
  day_of_week: number | null;
  segment: string;
  is_active: boolean;
  is_test_mode: boolean;
  test_email: string | null;
  last_run_at: string | null;
}

const SEGMENTS = [
  { value: "subscribers", label: "Abonnés newsletter" },
  { value: "users", label: "Tous utilisateurs" },
  { value: "all", label: "Tout le monde" },
];

const NewsletterAutomations = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    source_type: "news" as "news" | "opportunity",
    frequency: "daily" as "hourly" | "daily" | "weekly",
    time_of_day: "09:00",
    day_of_week: 1,
    segment: "subscribers",
    is_test_mode: true,
    test_email: "",
  });

  const load = async () => {
    const { data } = await (supabase as any).from("newsletter_automations").select("*").order("created_at", { ascending: false });
    setItems((data as Automation[]) || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nom requis", variant: "destructive" }); return;
    }
    if (form.is_test_mode && !form.test_email.trim()) {
      toast({ title: "Email de test requis en mode test", variant: "destructive" }); return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("newsletter_automations").insert({ ...form, created_by: user?.id, is_active: true });
    setLoading(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Automatisation créée" });
    setForm({ ...form, name: "", test_email: "" });
    load();
  };

  const toggle = async (a: Automation, active: boolean) => {
    await (supabase as any).from("newsletter_automations").update({ is_active: active }).eq("id", a.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette automatisation ?")) return;
    await (supabase as any).from("newsletter_automations").delete().eq("id", id);
    load();
  };

  const runNow = async (a: Automation) => {
    setRunning(a.id);
    const { data, error } = await supabase.functions.invoke("auto-newsletter-dispatch", {
      body: { automationId: a.id, force: true },
    });
    setRunning(null);
    if (error || data?.error) {
      toast({ title: "Erreur", description: error?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "Diffusion exécutée", description: data?.message || "Voir les logs pour le détail." });
      load();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/newsletter/compose"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-accent" /> Automatisations Actualités/Opportunités
            </h1>
            <p className="text-muted-foreground text-sm">
              Diffusion automatique des nouvelles publications, avec segments ciblés et mode test.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Nouvelle automatisation</CardTitle>
            <CardDescription>Choisissez source, fréquence, segment, et activez le mode test pour vérifier avant diffusion réelle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Newsletter quotidienne actualités" />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source_type} onValueChange={(v: any) => setForm({ ...form, source_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">Actualités</SelectItem>
                    <SelectItem value="opportunity">Opportunités</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fréquence</Label>
                <Select value={form.frequency} onValueChange={(v: any) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Heure d'envoi</Label>
                <Input type="time" value={form.time_of_day} onChange={(e) => setForm({ ...form, time_of_day: e.target.value })} />
              </div>
              {form.frequency === "weekly" && (
                <div className="space-y-1.5">
                  <Label>Jour de la semaine</Label>
                  <Select value={String(form.day_of_week)} onValueChange={(v) => setForm({ ...form, day_of_week: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"].map((d, i) => (
                        <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Segment ciblé</Label>
                <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-600" /> Mode test (pas de diffusion réelle)
                </Label>
                <Switch checked={form.is_test_mode} onCheckedChange={(v) => setForm({ ...form, is_test_mode: v })} />
              </div>
              {form.is_test_mode && (
                <Input
                  type="email"
                  value={form.test_email}
                  onChange={(e) => setForm({ ...form, test_email: e.target.value })}
                  placeholder="email-test@exemple.com"
                />
              )}
            </div>

            <Button onClick={create} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Créer l'automatisation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Automatisations existantes ({items.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.length === 0 && <p className="p-6 text-center text-muted-foreground">Aucune automatisation.</p>}
              {items.map((a) => (
                <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.name}</p>
                      <Badge variant="outline">{a.source_type === "news" ? "Actualités" : "Opportunités"}</Badge>
                      <Badge>{a.frequency}</Badge>
                      <Badge variant="secondary">{a.segment}</Badge>
                      {a.is_test_mode && <Badge className="bg-amber-100 text-amber-800">TEST</Badge>}
                      {!a.is_active && <Badge variant="destructive">Désactivé</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.time_of_day ? `Envoi à ${a.time_of_day}` : ""}
                      {a.last_run_at ? ` • Dernier envoi : ${new Date(a.last_run_at).toLocaleString("fr-FR")}` : " • Jamais exécuté"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={a.is_active} onCheckedChange={(v) => toggle(a, v)} />
                    <Button size="sm" variant="outline" onClick={() => runNow(a)} disabled={running === a.id}>
                      {running === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      <span className="ml-1">Exécuter</span>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default NewsletterAutomations;
