import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, ArrowLeft, Search, RefreshCw, Download, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Log {
  id: string;
  campaign_id: string;
  recipient_email: string;
  status: "success" | "failed" | "skipped";
  provider_message_id: string | null;
  error_message: string | null;
  attempt: number;
  created_at: string;
}

interface Campaign { id: string; subject: string; status: string; recipients_count?: number; success_count?: number; failure_count?: number; }

const NewsletterLogs = () => {
  const { campaignId } = useParams();
  const [logs, setLogs] = useState<Log[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<string>(campaignId || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: camps } = await supabase
      .from("newsletter_campaigns").select("id, subject, status, recipients_count, success_count, failure_count")
      .order("created_at", { ascending: false });
    setCampaigns(camps || []);

    let q = supabase.from("newsletter_send_logs").select("*").order("created_at", { ascending: false }).limit(1000);
    if (selected !== "all") q = q.eq("campaign_id", selected);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) q = q.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());
    const { data } = await q;
    setLogs((data as Log[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selected, statusFilter, dateFrom, dateTo]);

  // Realtime monitoring
  useEffect(() => {
    const ch = supabase
      .channel("newsletter_logs_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "newsletter_send_logs" }, (payload) => {
        const row = payload.new as Log;
        if (selected !== "all" && row.campaign_id !== selected) return;
        setLogs((prev) => [row, ...prev].slice(0, 1000));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "newsletter_campaigns" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [selected]);

  const filtered = useMemo(() => {
    let r = logs;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter((l) =>
        l.recipient_email.toLowerCase().includes(s) ||
        (l.error_message || "").toLowerCase().includes(s));
    }
    if (providerFilter !== "all") {
      r = r.filter((l) => (l.error_message || "").includes(`via:${providerFilter}`) || (l.provider_message_id || "").startsWith(providerFilter[0]));
    }
    return r;
  }, [logs, search, providerFilter]);

  const counts = {
    success: logs.filter((l) => l.status === "success").length,
    failed: logs.filter((l) => l.status === "failed").length,
    skipped: logs.filter((l) => l.status === "skipped").length,
  };

  const liveCampaign = selected !== "all" ? campaigns.find(c => c.id === selected) : null;
  const progress = liveCampaign?.recipients_count
    ? Math.round((((liveCampaign.success_count || 0) + (liveCampaign.failure_count || 0)) / liveCampaign.recipients_count) * 100)
    : 0;

  const detectProvider = (l: Log) => {
    if (l.error_message?.includes("via:brevo") || l.error_message?.includes("Brevo")) return "brevo";
    if (l.error_message?.includes("via:resend") || l.error_message?.includes("Resend")) return "resend";
    return "—";
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      skipped: "bg-yellow-100 text-yellow-800",
    };
    return <Badge className={map[s]}>{s}</Badge>;
  };

  const exportCsv = () => {
    const rows = [
      ["Date", "Campagne", "Destinataire", "Statut", "Provider", "Message ID", "Tentative", "Erreur"],
      ...filtered.map((l) => {
        const c = campaigns.find((x) => x.id === l.campaign_id);
        return [
          new Date(l.created_at).toISOString(),
          c?.subject || l.campaign_id,
          l.recipient_email,
          l.status,
          detectProvider(l),
          l.provider_message_id || "",
          String(l.attempt ?? ""),
          (l.error_message || "").replace(/\s+/g, " "),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `newsletter-logs-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/newsletter/compose"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <ScrollText className="h-6 w-6 sm:h-7 sm:w-7" /> Journal des envois
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-green-600">
                <Activity className="h-3.5 w-3.5 animate-pulse" /> Live
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Monitoring temps réel : destinataire, statut, provider, erreur. Export CSV disponible.
            </p>
          </div>
        </div>

        {liveCampaign && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Progression — {liveCampaign.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{(liveCampaign.success_count || 0) + (liveCampaign.failure_count || 0)} / {liveCampaign.recipients_count || 0}</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} />
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="text-green-600">✓ {liveCampaign.success_count || 0} réussis</span>
                <span className="text-red-600">✕ {liveCampaign.failure_count || 0} échecs</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Réussis</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-green-600">{counts.success}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Échoués</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-red-600">{counts.failed}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ignorés</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-yellow-600">{counts.skipped}</CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="grid gap-3 lg:grid-cols-6">
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="lg:col-span-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les campagnes</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="success">Réussis</SelectItem>
                  <SelectItem value="failed">Échoués</SelectItem>
                  <SelectItem value="skipped">Ignorés</SelectItem>
                </SelectContent>
              </Select>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous providers</SelectItem>
                  <SelectItem value="brevo">Brevo</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher email ou erreur…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              </div>
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualiser
              </Button>
              <Button onClick={exportCsv} variant="default">
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Destinataire</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2">Provider</th>
                    <th className="px-4 py-2">Message ID</th>
                    <th className="px-4 py-2">Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun log.</td></tr>
                  )}
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-4 py-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-2 font-mono text-xs">{l.recipient_email}</td>
                      <td className="px-4 py-2">{badge(l.status)}</td>
                      <td className="px-4 py-2 text-xs"><Badge variant="outline">{detectProvider(l)}</Badge></td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{l.provider_message_id || "—"}</td>
                      <td className="px-4 py-2 text-xs text-red-600 max-w-md truncate" title={l.error_message || ""}>{l.error_message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default NewsletterLogs;
