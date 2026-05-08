import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, ArrowLeft, Search, RefreshCw } from "lucide-react";

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

interface Campaign { id: string; subject: string; status: string; }

const NewsletterLogs = () => {
  const { campaignId } = useParams();
  const [logs, setLogs] = useState<Log[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<string>(campaignId || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: camps } = await supabase
      .from("newsletter_campaigns").select("id, subject, status")
      .order("created_at", { ascending: false });
    setCampaigns(camps || []);

    let q = supabase.from("newsletter_send_logs").select("*").order("created_at", { ascending: false }).limit(500);
    if (selected !== "all") q = q.eq("campaign_id", selected);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setLogs((data as Log[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selected, statusFilter]);

  const filtered = search
    ? logs.filter((l) =>
        l.recipient_email.toLowerCase().includes(search.toLowerCase()) ||
        (l.error_message || "").toLowerCase().includes(search.toLowerCase()))
    : logs;

  const counts = {
    success: logs.filter((l) => l.status === "success").length,
    failed: logs.filter((l) => l.status === "failed").length,
    skipped: logs.filter((l) => l.status === "skipped").length,
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      skipped: "bg-yellow-100 text-yellow-800",
    };
    return <Badge className={map[s]}>{s}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/newsletter/compose"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ScrollText className="h-7 w-7" /> Journal des envois
            </h1>
            <p className="text-muted-foreground text-sm">
              Historique détaillé : destinataire, statut, message provider, erreur.
            </p>
          </div>
        </div>

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
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="sm:w-[320px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les campagnes</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="success">Réussis</SelectItem>
                  <SelectItem value="failed">Échoués</SelectItem>
                  <SelectItem value="skipped">Ignorés</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher email ou erreur…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              </div>
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualiser
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
                    <th className="px-4 py-2">Provider ID</th>
                    <th className="px-4 py-2">Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Aucun log.</td></tr>
                  )}
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-4 py-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-2 font-mono text-xs">{l.recipient_email}</td>
                      <td className="px-4 py-2">{badge(l.status)}</td>
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
