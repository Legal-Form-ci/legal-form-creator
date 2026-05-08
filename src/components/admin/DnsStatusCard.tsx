import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, RefreshCw, ShieldCheck, Copy, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FixInstruction {
  host: string;
  type: string;
  value: string;
  note?: string;
}
interface DnsCheck {
  domain: string;
  checked_at: string;
  spf: { ok: boolean; records: string[]; required?: string };
  dkim: { ok: boolean; selector: string | null; record: string | null; tried: string[]; expected_selector?: string };
  dmarc: { ok: boolean; records: string[] };
  all_ok: boolean;
  fix_instructions?: { spf: FixInstruction | null; dkim: FixInstruction | null; dmarc: FixInstruction | null };
}
interface HistoryRow {
  id: string;
  spf_ok: boolean;
  dkim_ok: boolean;
  dmarc_ok: boolean;
  all_ok: boolean;
  checked_at: string;
}

const copy = (text: string) => {
  navigator.clipboard.writeText(text);
  toast({ title: "Copié", description: "Valeur copiée dans le presse-papiers." });
};

const FixBlock = ({ title, fix }: { title: string; fix: FixInstruction }) => (
  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
    <div className="font-semibold text-sm">{title}</div>
    <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-center text-xs font-mono">
      <span className="text-muted-foreground">Host</span>
      <code className="bg-background px-2 py-1 rounded border break-all">{fix.host}</code>
      <Button size="sm" variant="ghost" onClick={() => copy(fix.host)}><Copy className="h-3 w-3" /></Button>

      <span className="text-muted-foreground">Type</span>
      <code className="bg-background px-2 py-1 rounded border">{fix.type}</code>
      <span />

      <span className="text-muted-foreground">Valeur</span>
      <code className="bg-background px-2 py-1 rounded border break-all">{fix.value}</code>
      <Button size="sm" variant="ghost" onClick={() => copy(fix.value)}><Copy className="h-3 w-3" /></Button>
    </div>
    {fix.note && <p className="text-xs text-muted-foreground">💡 {fix.note}</p>}
  </div>
);

export const DnsStatusCard = () => {
  const [data, setData] = useState<DnsCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const check = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-dns-records", {
        body: { persist: true },
      });
      if (!error) setData(data as DnsCheck);
      await loadHistory();
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    const { data } = await (supabase as any)
      .from("dns_check_history")
      .select("id, spf_ok, dkim_ok, dmarc_ok, all_ok, checked_at")
      .order("checked_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  useEffect(() => { check(); }, []);

  const Status = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="font-medium text-sm">{label}</span>
      {ok ? (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" /> OK</Badge>
      ) : (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" /> KO</Badge>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> DNS legalform.ci
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={check} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        {!data && <p className="text-muted-foreground">Vérification…</p>}
        {data && (
          <>
            <div>
              <Status ok={data.spf.ok} label="SPF (include:_spf.resend.com)" />
              <Status ok={data.dkim.ok} label={`DKIM${data.dkim.selector ? ` (${data.dkim.selector})` : " (resend._domainkey)"}`} />
              <Status ok={data.dmarc.ok} label="DMARC" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Dernière vérif : {new Date(data.checked_at).toLocaleString("fr-FR")}
              </span>
              {data.all_ok ? (
                <Badge className="bg-green-600">Domaine prêt ✅</Badge>
              ) : (
                <Badge variant="destructive">Configuration incomplète</Badge>
              )}
            </div>

            {/* Panneau de guidance DKIM/SPF/DMARC */}
            {!data.all_ok && data.fix_instructions && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Enregistrements DNS à créer chez votre hébergeur</AlertTitle>
                <AlertDescription className="mt-3 space-y-3">
                  {data.fix_instructions.spf && <FixBlock title="🔵 SPF" fix={data.fix_instructions.spf} />}
                  {data.fix_instructions.dkim && (
                    <>
                      <FixBlock title="🟣 DKIM (Resend)" fix={data.fix_instructions.dkim} />
                      <p className="text-xs">
                        ⚠️ La valeur exacte (clé publique) est <strong>unique à votre compte Resend</strong> :
                        ouvrez{" "}
                        <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="underline font-semibold">
                          resend.com/domains
                        </a>{" "}
                        → cliquez sur <code className="bg-background px-1 rounded">legalform.ci</code> → copiez l'enregistrement <code className="bg-background px-1 rounded">resend._domainkey</code>.
                      </p>
                    </>
                  )}
                  {data.fix_instructions.dmarc && <FixBlock title="🟢 DMARC" fix={data.fix_instructions.dmarc} />}
                </AlertDescription>
              </Alert>
            )}

            {/* Historique */}
            {history.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs font-semibold mb-2 text-muted-foreground">Historique (20 dernières vérifs)</div>
                <div className="flex gap-1 flex-wrap">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      title={`${new Date(h.checked_at).toLocaleString("fr-FR")} — SPF:${h.spf_ok ? "OK" : "KO"} DKIM:${h.dkim_ok ? "OK" : "KO"} DMARC:${h.dmarc_ok ? "OK" : "KO"}`}
                      className={`h-3 w-3 rounded-sm ${h.all_ok ? "bg-green-500" : h.spf_ok || h.dkim_ok || h.dmarc_ok ? "bg-yellow-500" : "bg-red-500"}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  🟩 Tout OK · 🟨 Partiel · 🟥 KO · vérification automatique toutes les 30 min
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DnsStatusCard;
