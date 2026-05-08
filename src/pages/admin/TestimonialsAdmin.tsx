import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "./AdminLayout";
import { CheckCircle, EyeOff, Search, Star, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type FilterStatus = "all" | "pending" | "approved";

interface TestimonialItem {
  id: string;
  name: string;
  message: string;
  company: string | null;
  company_type: string | null;
  location: string | null;
  rating: number | null;
  is_approved: boolean | null;
  avatar_url: string | null;
  created_at: string;
}

const TestimonialsAdmin = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth", { replace: true });
      else if (userRole !== "admin" && userRole !== "team") navigate("/client/dashboard", { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "team")) {
      fetchTestimonials();
    }
  }, [user, userRole]);

  const fetchTestimonials = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les témoignages", variant: "destructive" });
      setLoadingData(false);
      return;
    }

    setTestimonials(data || []);
    setLoadingData(false);
  };

  const approveTestimonial = async (id: string) => {
    const { error } = await supabase.from("testimonials").update({ is_approved: true }).eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'approuver", variant: "destructive" });
      return;
    }
    toast({ title: "Témoignage approuvé", description: "Le témoignage est visible publiquement." });
    fetchTestimonials();
  };

  const rejectTestimonial = async () => {
    const { error } = await supabase.from("testimonials").update({ is_approved: false }).eq("id", rejectDialog.id);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de rejeter", variant: "destructive" });
      return;
    }

    toast({
      title: "Témoignage rejeté",
      description: rejectReason?.trim() ? `Motif: ${rejectReason.trim()}` : "Le témoignage a été retiré de l'affichage public.",
    });

    setRejectDialog({ open: false, id: "" });
    setRejectReason("");
    fetchTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Supprimer définitivement ce témoignage ?")) return;

    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
      return;
    }

    toast({ title: "Témoignage supprimé", description: "Suppression définitive effectuée." });
    fetchTestimonials();
  };

  const pending = testimonials.filter((item) => !item.is_approved).length;
  const approved = testimonials.filter((item) => !!item.is_approved).length;

  const filtered = useMemo(() => {
    return testimonials.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.company || "").toLowerCase().includes(search.toLowerCase()) ||
        item.message.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && !!item.is_approved) ||
        (statusFilter === "pending" && !item.is_approved);

      return matchesSearch && matchesStatus;
    });
  }, [testimonials, search, statusFilter]);

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des témoignages</h1>
          <p className="text-muted-foreground mt-1">Validez, rejetez avec motif (optionnel) ou supprimez les témoignages.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{testimonials.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{pending}</div>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{approved}</div>
              <p className="text-xs text-muted-foreground">Approuvés</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filtrer les témoignages</CardTitle>
            <CardDescription>Recherche par nom, entreprise ou contenu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un témoignage..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>
                Tous ({testimonials.length})
              </Button>
              <Button variant={statusFilter === "pending" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("pending")}>
                En attente ({pending})
              </Button>
              <Button variant={statusFilter === "approved" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("approved")}>
                Approuvés ({approved})
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Témoignage</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.company || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-accent fill-accent" />
                          <span>{item.rating || 5}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.message}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(item.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_approved ? "default" : "secondary"}>
                          {item.is_approved ? "Approuvé" : "En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!item.is_approved ? (
                            <Button size="sm" onClick={() => approveTestimonial(item.id)} title="Approuver">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectDialog({ open: true, id: item.id })}
                              title="Rejeter / masquer"
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => deleteTestimonial(item.id)} title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Aucun témoignage trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter ce témoignage</DialogTitle>
            <DialogDescription>
              Vous pouvez renseigner un motif (optionnel), puis confirmer le rejet.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motif du rejet (optionnel)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: "" })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={rejectTestimonial}>
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default TestimonialsAdmin;
