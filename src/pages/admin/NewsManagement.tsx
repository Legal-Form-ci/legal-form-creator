import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIContentGenerator from "@/components/AIContentGenerator";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { 
  Plus, Edit2, Trash2, Eye, Image as ImageIcon, Save,
  Bold, Italic, List, Heading1, Heading2, Heading3,
  Link as LinkIcon, Newspaper, Quote, Code, Table as TableIcon,
  AlignCenter, ListOrdered, Minus, Palette, Undo, Redo,
  ChevronLeft, ChevronRight
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  is_published: boolean;
  published_at: string | null;
  author_name: string | null;
  views_count: number | null;
  created_at: string;
  public_id: string | null;
}

const ITEMS_PER_PAGE = 10;

const NewsManagement = () => {
  const { t } = useTranslation();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    category: "",
    tags: "",
    is_published: false,
    author_name: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'admin')) {
      navigate("/auth");
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const paginatedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: generateSlug(value)
    }));
  };

  const handleContentChange = (newContent: string) => {
    setUndoStack(prev => [...prev.slice(-20), formData.content]);
    setRedoStack([]);
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, formData.content]);
      setFormData(prev => ({ ...prev, content: previousContent }));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, formData.content]);
      setFormData(prev => ({ ...prev, content: nextContent }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `blog/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length === 1) {
        setFormData(prev => ({ ...prev, cover_image: uploadedUrls[0] }));
      } else {
        const imageMarkdown = uploadedUrls.map(url => `![Image](${url})`).join('\n\n');
        handleContentChange(formData.content + '\n\n' + imageMarkdown);
        if (!formData.cover_image) {
          setFormData(prev => ({ ...prev, cover_image: uploadedUrls[0] }));
        }
      }

      toast({ title: 'Images téléchargées avec succès' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const insertFormatting = (type: string, extraData?: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);

    let newText = "";
    let cursorOffset = 0;

    switch (type) {
      case 'bold': newText = `**${selectedText || 'texte en gras'}**`; cursorOffset = selectedText ? 0 : -2; break;
      case 'italic': newText = `*${selectedText || 'texte en italique'}*`; cursorOffset = selectedText ? 0 : -1; break;
      case 'h1': newText = `\n# ${selectedText || 'Titre principal'}\n`; break;
      case 'h2': newText = `\n## ${selectedText || 'Sous-titre'}\n`; break;
      case 'h3': newText = `\n### ${selectedText || 'Section'}\n`; break;
      case 'list': newText = `\n- ${selectedText || 'élément de liste'}\n- élément 2\n- élément 3`; break;
      case 'numbered': newText = `\n1. ${selectedText || 'premier élément'}\n2. deuxième élément\n3. troisième élément`; break;
      case 'link': newText = `[${selectedText || 'texte du lien'}](https://url.com)`; break;
      case 'quote': newText = `\n> ${selectedText || 'Citation importante'}\n`; break;
      case 'code': newText = selectedText.includes('\n') ? `\n\`\`\`\n${selectedText || 'code'}\n\`\`\`\n` : `\`${selectedText || 'code'}\``; break;
      case 'table': newText = `\n| Colonne 1 | Colonne 2 | Colonne 3 |\n|-----------|-----------|----------|\n| Données 1 | Données 2 | Données 3 |\n`; break;
      case 'hr': newText = `\n---\n`; break;
      case 'color': newText = `<span style="color:${extraData || '#008080'}">${selectedText || 'texte coloré'}</span>`; break;
      case 'center': newText = `<div style="text-align:center">\n\n${selectedText || 'Texte centré'}\n\n</div>`; break;
    }

    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    handleContentChange(before + newText + after);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = start + newText.length + cursorOffset;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: 'Erreur', description: 'Veuillez remplir les champs obligatoires', variant: "destructive" });
      return;
    }

    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    // Don't generate public_id here - the database trigger will do it automatically
    const postData: any = {
      title: formData.title,
      slug: formData.slug || generateSlug(formData.title),
      excerpt: formData.excerpt || formData.content.substring(0, 200).replace(/[#*_`]/g, '') + '...',
      content: formData.content,
      cover_image: formData.cover_image || null,
      category: formData.category || null,
      tags: tagsArray.length > 0 ? tagsArray : null,
      is_published: formData.is_published,
      published_at: formData.is_published ? new Date().toISOString() : null,
      author_name: formData.author_name || 'Legal Form'
    };

    try {
      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);
        if (error) throw error;
        toast({ title: 'Article mis à jour' });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);
        if (error) throw error;
        toast({ title: 'Article créé' });
      }

      setDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image: post.cover_image || "",
      category: post.category || "",
      tags: post.tags?.join(', ') || "",
      is_published: post.is_published || false,
      author_name: post.author_name || ""
    });
    setUndoStack([]);
    setRedoStack([]);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: "destructive" });
    } else {
      toast({ title: 'Article supprimé' });
      fetchPosts();
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({ title: "", slug: "", excerpt: "", content: "", cover_image: "", category: "", tags: "", is_published: false, author_name: "" });
    setUndoStack([]);
    setRedoStack([]);
    setEditorTab("write");
  };

  if (authLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div></AdminLayout>;
  }

  const colorOptions = ['#008080', '#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Actualités</h1>
            <p className="text-muted-foreground mt-1">Créez et gérez les articles d'actualité</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />Nouvel article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  {editingPost ? 'Modifier l\'article' : 'Nouvel article'}
                </DialogTitle>
                <DialogDescription>
                  {editingPost ? 'Modifiez les informations de l\'article' : 'Remplissez les informations pour créer un nouvel article'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input id="title" value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Titre de l'article" className="text-lg font-semibold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug URL (référence interne)</Label>
                    <Input id="slug" value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="titre-de-l-article" />
                    <p className="text-xs text-muted-foreground">L'URL publique sera générée automatiquement au format artXXX-MM-YYY</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Input id="category" value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} placeholder="Fiscalité, Juridique, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Auteur</Label>
                    <Input id="author" value={formData.author_name} onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))} placeholder="Legal Form" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" value={formData.tags} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))} placeholder="fiscalité, entreprise" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Résumé</Label>
                  <Textarea id="excerpt" value={formData.excerpt} onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} placeholder="Résumé de l'article" rows={2} />
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>Image de couverture</Label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Input value={formData.cover_image} onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))} placeholder="URL de l'image" />
                    </div>
                    <div>
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                          <ImageIcon className="h-4 w-4" />{uploading ? 'Upload...' : 'Upload'}
                        </div>
                      </Label>
                      <input id="image-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </div>
                  </div>
                  {formData.cover_image && (
                    <img src={formData.cover_image} alt="Couverture" className="w-full max-h-48 object-cover rounded-lg mt-2" />
                  )}
                </div>

                {/* AI Content Generator */}
                <AIContentGenerator
                  content={formData.content}
                  onGenerate={(generated) => {
                    setFormData((prev) => ({
                      ...prev,
                      title: generated.title || prev.title,
                      excerpt: generated.excerpt || prev.excerpt,
                      category: generated.category || prev.category,
                      tags: generated.tags || prev.tags,
                      content: generated.formattedContent || prev.content,
                      cover_image: generated.cover_image || prev.cover_image,
                      author_name: generated.author_name || prev.author_name,
                      slug: generated.slug || prev.slug,
                    }));
                  }}
                />

                {/* Markdown Editor */}
                <div className="space-y-2">
                  <Label>Contenu *</Label>
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-t-lg border border-b-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} title="Annuler"><Undo className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} title="Rétablir"><Redo className="h-4 w-4" /></Button>
                    <div className="w-px bg-border mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('h1')} title="Titre 1"><Heading1 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('h2')} title="Titre 2"><Heading2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('h3')} title="Titre 3"><Heading3 className="h-4 w-4" /></Button>
                    <div className="w-px bg-border mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('bold')} title="Gras"><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('italic')} title="Italique"><Italic className="h-4 w-4" /></Button>
                    <div className="w-px bg-border mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('list')} title="Liste"><List className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('numbered')} title="Liste numérotée"><ListOrdered className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('link')} title="Lien"><LinkIcon className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('quote')} title="Citation"><Quote className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('code')} title="Code"><Code className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('table')} title="Tableau"><TableIcon className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('hr')} title="Séparateur"><Minus className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormatting('center')} title="Centrer"><AlignCenter className="h-4 w-4" /></Button>
                    <div className="w-px bg-border mx-1" />
                    {colorOptions.map(color => (
                      <button key={color} onClick={() => insertFormatting('color', color)} className="h-6 w-6 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: color }} title={`Couleur ${color}`} />
                    ))}
                  </div>

                  <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as "write" | "preview")}>
                    <TabsList className="w-full">
                      <TabsTrigger value="write" className="flex-1">Écrire</TabsTrigger>
                      <TabsTrigger value="preview" className="flex-1">Aperçu</TabsTrigger>
                    </TabsList>
                    <TabsContent value="write">
                      <Textarea ref={contentRef} value={formData.content} onChange={(e) => handleContentChange(e.target.value)} placeholder="Écrivez votre article en Markdown..." rows={20} className="font-mono text-sm" />
                    </TabsContent>
                    <TabsContent value="preview">
                      <div className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-md min-h-[400px] bg-card">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formData.content || '*Aucun contenu*'}</ReactMarkdown>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Publish toggle */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label>Publier l'article</Label>
                    <p className="text-sm text-muted-foreground">L'article sera visible publiquement</p>
                  </div>
                  <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))} />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Annuler</Button>
                  <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" />{editingPost ? 'Mettre à jour' : 'Créer l\'article'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Articles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Articles ({posts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Public</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Vues</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPosts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="font-mono text-xs">{post.public_id || '—'}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="font-medium truncate">{post.title}</div>
                      </TableCell>
                      <TableCell>{post.category && <Badge variant="outline">{post.category}</Badge>}</TableCell>
                      <TableCell>
                        <Badge className={post.is_published ? 'bg-green-500' : 'bg-yellow-500'}>
                          {post.is_published ? 'Publié' : 'Brouillon'}
                        </Badge>
                      </TableCell>
                      <TableCell>{post.views_count || 0}</TableCell>
                      <TableCell>{new Date(post.created_at).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {post.is_published && post.public_id && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/actualites/${post.public_id}`, '_blank')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(post)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default NewsManagement;
