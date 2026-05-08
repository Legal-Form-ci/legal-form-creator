import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, EyeOff, Building2, Search, Loader2, Upload } from "lucide-react";

interface CreatedCompany {
  id: string;
  company_name: string;
  company_type: string | null;
  activity_sector: string | null;
  founder_name: string | null;
  location: string | null;
  region: string | null;
  logo_url: string | null;
  photo_url: string | null;
  website: string | null;
  testimonial: string | null;
  is_visible: boolean;
  created_at: string;
}

const COMPANY_TYPES = ["SARL", "SA", "SAS", "EURL", "SNC", "GIE", "Association", "Coopérative", "Autre"];
const SECTORS = ["Commerce", "Services", "Industrie", "Agriculture", "Technologie", "Santé", "Éducation", "Transport", "BTP", "Restauration", "Autre"];

const CompaniesShowcase = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<CreatedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CreatedCompany | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    company_name: "", company_type: "SARL", activity_sector: "", founder_name: "",
    location: "", region: "", website: "", testimonial: "", logo_url: "", photo_url: "",
  });

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    const { data } = await (supabase as any).from("created_companies").select("*").order("created_at", { ascending: false });
    if (data) setCompanies(data as CreatedCompany[]);
    setLoading(false);
  };

  const openEdit = (company: CreatedCompany) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.company_name, company_type: company.company_type || "SARL",
      activity_sector: company.activity_sector || "", founder_name: company.founder_name || "",
      location: company.location || "", region: company.region || "",
      website: company.website || "", testimonial: company.testimonial || "",
      logo_url: company.logo_url || "", photo_url: company.photo_url || "",
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingCompany(null);
    setFormData({ company_name: "", company_type: "SARL", activity_sector: "", founder_name: "", location: "", region: "", website: "", testimonial: "", logo_url: "", photo_url: "" });
    setDialogOpen(true);
  };

  const handleFileUpload = async (file: File, field: "logo_url" | "photo_url") => {
    const ext = file.name.split(".").pop();
    const path = `showcase/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Erreur upload", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
    setFormData(prev => ({ ...prev, [field]: urlData.publicUrl }));
  };

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      toast({ title: "Nom requis", variant: "destructive" }); return;
    }
    const payload = { ...formData, is_published: true } as any;
    if (editingCompany) {
      await (supabase as any).from("created_companies").update(payload).eq("id", editingCompany.id);
      toast({ title: "Entreprise mise à jour" });
    } else {
      await (supabase as any).from("created_companies").insert(payload);
      toast({ title: "Entreprise ajoutée" });
    }
    setDialogOpen(false);
    fetchCompanies();
  };

  const toggleVisibility = async (id: string, visible: boolean) => {
    await (supabase as any).from("created_companies").update({ is_published: !visible }).eq("id", id);
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_visible: !visible } : c));
  };

  const deleteCompany = async (id: string) => {
    await (supabase as any).from("created_companies").delete().eq("id", id);
    setCompanies(prev => prev.filter(c => c.id !== id));
    toast({ title: "Entreprise supprimée" });
  };

  const filtered = companies.filter(c =>
    !searchTerm || c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.founder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.activity_sector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Entreprises créées</h1>
            <p className="text-muted-foreground">{companies.length} entreprises accompagnées</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Ajouter une entreprise</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <Building2 className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{companies.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-foreground">{companies.filter(c => c.is_visible).length}</p>
            <p className="text-xs text-muted-foreground">Visibles</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <EyeOff className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{companies.filter(c => !c.is_visible).length}</p>
            <p className="text-xs text-muted-foreground">Masquées</p>
          </CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Logo</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Secteur</TableHead>
                      <TableHead className="hidden lg:table-cell">Fondateur</TableHead>
                      <TableHead>Visible</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(company => (
                      <TableRow key={company.id}>
                        <TableCell>
                          {company.logo_url ? (
                            <img src={company.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{company.company_name}</TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="outline">{company.company_type || "—"}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{company.activity_sector || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{company.founder_name || "—"}</TableCell>
                        <TableCell>
                          <Switch checked={company.is_visible} onCheckedChange={() => toggleVisibility(company.id, company.is_visible)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(company)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCompany(company.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Modifier l'entreprise" : "Ajouter une entreprise"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nom de l'entreprise *</Label><Input value={formData.company_name} onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={formData.company_type} onValueChange={v => setFormData(p => ({ ...p, company_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COMPANY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Secteur</Label>
                <Select value={formData.activity_sector} onValueChange={v => setFormData(p => ({ ...p, activity_sector: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Fondateur</Label><Input value={formData.founder_name} onChange={e => setFormData(p => ({ ...p, founder_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ville/Commune</Label><Input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} /></div>
              <div><Label>Région</Label><Input value={formData.region} onChange={e => setFormData(p => ({ ...p, region: e.target.value }))} /></div>
            </div>
            <div><Label>Site web</Label><Input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="https://" /></div>
            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {formData.logo_url && <img src={formData.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80">
                    <Upload className="h-4 w-4" />Choisir un logo
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "logo_url")} />
                </label>
              </div>
            </div>
            <div>
              <Label>Image de couverture</Label>
              <div className="flex items-center gap-3">
                {formData.photo_url && <img src={formData.photo_url} alt="" className="h-16 w-24 rounded-lg object-cover" />}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80">
                    <Upload className="h-4 w-4" />Choisir une image
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "photo_url")} />
                </label>
              </div>
            </div>
            <div><Label>Témoignage</Label><Textarea value={formData.testimonial} onChange={e => setFormData(p => ({ ...p, testimonial: e.target.value }))} rows={3} /></div>
            <Button onClick={handleSave} className="w-full">{editingCompany ? "Mettre à jour" : "Ajouter"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CompaniesShowcase;
