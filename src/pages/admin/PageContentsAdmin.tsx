import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Plus, Trash2, FileText } from "lucide-react";

interface Section {
  heading: string;
  body: string;
}

interface PageContent {
  id: string;
  page_key: string;
  title: string;
  content: Section[];
  updated_at: string;
}

const PageContentsAdmin = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from('page_contents')
      .select('*')
      .order('page_key');

    if (!error && data) {
      setPages(data.map(p => ({
        ...p,
        content: Array.isArray(p.content) ? (p.content as unknown as Section[]) : []
      })));
    }
    setLoading(false);
  };

  const updatePage = (pageKey: string, field: string, value: any) => {
    setPages(prev => prev.map(p => 
      p.page_key === pageKey ? { ...p, [field]: value } : p
    ));
  };

  const updateSection = (pageKey: string, index: number, field: keyof Section, value: string) => {
    setPages(prev => prev.map(p => {
      if (p.page_key !== pageKey) return p;
      const newContent = [...p.content];
      newContent[index] = { ...newContent[index], [field]: value };
      return { ...p, content: newContent };
    }));
  };

  const addSection = (pageKey: string) => {
    setPages(prev => prev.map(p => {
      if (p.page_key !== pageKey) return p;
      return { ...p, content: [...p.content, { heading: "", body: "" }] };
    }));
  };

  const removeSection = (pageKey: string, index: number) => {
    setPages(prev => prev.map(p => {
      if (p.page_key !== pageKey) return p;
      return { ...p, content: p.content.filter((_, i) => i !== index) };
    }));
  };

  const savePage = async (page: PageContent) => {
    setSaving(true);
    const { error } = await supabase
      .from('page_contents')
      .update({
        title: page.title,
        content: page.content as any,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .eq('page_key', page.page_key);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Enregistré", description: `Page "${page.title}" mise à jour` });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  const pageLabels: Record<string, string> = {
    terms: "Conditions Générales",
    privacy: "Confidentialité"
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Pages Légales</h1>
          <p className="text-muted-foreground mt-1">Modifiez le contenu des pages Conditions et Confidentialité</p>
        </div>

        <Tabs defaultValue={pages[0]?.page_key || "terms"}>
          <TabsList>
            {pages.map(p => (
              <TabsTrigger key={p.page_key} value={p.page_key}>
                <FileText className="h-4 w-4 mr-2" />
                {pageLabels[p.page_key] || p.page_key}
              </TabsTrigger>
            ))}
          </TabsList>

          {pages.map(page => (
            <TabsContent key={page.page_key} value={page.page_key}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pageLabels[page.page_key] || page.page_key}</span>
                    <Button onClick={() => savePage(page)} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Titre de la page</Label>
                    <Input
                      value={page.title}
                      onChange={(e) => updatePage(page.page_key, 'title', e.target.value)}
                      className="text-lg font-semibold"
                    />
                  </div>

                  {page.content.map((section, i) => (
                    <Card key={i} className="border">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Section {i + 1}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(page.page_key, i)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          value={section.heading}
                          onChange={(e) => updateSection(page.page_key, i, 'heading', e.target.value)}
                          placeholder="Titre de la section"
                          className="font-semibold"
                        />
                        <Textarea
                          value={section.body}
                          onChange={(e) => updateSection(page.page_key, i, 'body', e.target.value)}
                          placeholder="Contenu de la section"
                          rows={5}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" onClick={() => addSection(page.page_key)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une section
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default PageContentsAdmin;
