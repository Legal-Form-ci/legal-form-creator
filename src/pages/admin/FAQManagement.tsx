import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Save, HelpCircle, Loader2 } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number | null;
  is_published: boolean | null;
  created_at: string;
}

const CATEGORIES = [
  { id: "general", name: "Général" },
  { id: "Création d'entreprise", name: "Création d'entreprise" },
  { id: "Paiement & Tarifs", name: "Paiement & Tarifs" },
  { id: "Processus & Suivi", name: "Processus & Suivi" },
  { id: "Documents & Livrables", name: "Documents & Livrables" },
  { id: "Services Additionnels", name: "Services Additionnels" },
];

const FAQManagement = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    category: "general",
    question: "",
    answer: "",
    sort_order: 0,
    is_published: true,
  });

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "admin")) {
      navigate("/auth");
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from("faq")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setFaqs(data as FAQ[]);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({
        title: "Erreur",
        description: "La question et la réponse sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from("faq")
          .update({
            category: formData.category,
            question: formData.question,
            answer: formData.answer,
            sort_order: formData.sort_order,
            is_published: formData.is_published,
          })
          .eq("id", editingFaq.id);

        if (error) throw error;
        toast({ title: "FAQ mise à jour avec succès" });
      } else {
        const { error } = await supabase.from("faq").insert({
          category: formData.category,
          question: formData.question,
          answer: formData.answer,
          sort_order: formData.sort_order,
          is_published: formData.is_published,
        });

        if (error) throw error;
        toast({ title: "FAQ créée avec succès" });
      }

      setDialogOpen(false);
      resetForm();
      fetchFaqs();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      category: faq.category || "general",
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order || 0,
      is_published: faq.is_published ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) return;

    const { error } = await supabase.from("faq").delete().eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "FAQ supprimée" });
      fetchFaqs();
    }
  };

  const togglePublished = async (faq: FAQ) => {
    const { error } = await supabase
      .from("faq")
      .update({ is_published: !faq.is_published })
      .eq("id", faq.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      fetchFaqs();
    }
  };

  const resetForm = () => {
    setEditingFaq(null);
    setFormData({
      category: "general",
      question: "",
      answer: "",
      sort_order: 0,
      is_published: true,
    });
  };

  const filteredFaqs =
    filterCategory === "all" ? faqs : faqs.filter((f) => f.category === filterCategory);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="h-8 w-8 text-primary" />
              Gestion des FAQ
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez les questions fréquentes affichées sur le site public
            </p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingFaq ? "Modifier la FAQ" : "Nouvelle FAQ"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ordre d'affichage</Label>
                    <Input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
                      }
                      min={0}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Question *</Label>
                  <Input
                    value={formData.question}
                    onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                    placeholder="Quelle est votre question ?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Réponse *</Label>
                  <Textarea
                    value={formData.answer}
                    onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
                    placeholder="Rédigez une réponse claire et détaillée..."
                    rows={6}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_published: checked }))
                      }
                    />
                    <Label>FAQ publiée et visible</Label>
                  </div>
                  <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {editingFaq ? "Mettre à jour" : "Enregistrer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm">Total FAQ</p>
              <p className="text-2xl font-bold text-foreground">{faqs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm">Publiées</p>
              <p className="text-2xl font-bold text-primary">{faqs.filter((f) => f.is_published).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm">Non publiées</p>
              <p className="text-2xl font-bold text-destructive">{faqs.filter((f) => !f.is_published).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="text-muted-foreground">Filtrer par catégorie :</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Table */}
        <Card>
          <CardHeader>
            <CardTitle>FAQ ({filteredFaqs.length})</CardTitle>
            <CardDescription>
              Les modifications sont synchronisées en temps réel sur le site public
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune FAQ trouvée</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {faq.category || "general"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="font-medium truncate">{faq.question}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {faq.answer.substring(0, 80)}...
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={faq.is_published ? "default" : "secondary"}>
                          {faq.is_published ? "Publiée" : "Masquée"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => togglePublished(faq)}>
                            <Switch checked={!!faq.is_published} className="scale-75" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(faq)} className="text-primary">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(faq.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FAQManagement;
