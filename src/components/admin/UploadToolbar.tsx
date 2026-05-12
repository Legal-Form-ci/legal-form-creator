import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Image as ImageIcon, Paperclip, Loader2, Copy, Check, FolderOpen, Trash2, Search, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onInsert: (htmlSnippet: string) => void;
}

interface MediaItem {
  name: string;
  fullPath: string;
  url: string;
  size: number | null;
  updated_at: string | null;
  kind: "image" | "doc";
}

const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(name);

const UploadToolbar = ({ onInsert }: Props) => {
  const { toast } = useToast();
  const imgRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const folders = ["image", "doc"];
      const all: MediaItem[] = [];
      for (const folder of folders) {
        const { data, error } = await supabase.storage.from("newsletter-assets").list(folder, {
          limit: 200, sortBy: { column: "updated_at", order: "desc" },
        });
        if (error) continue;
        for (const f of data || []) {
          if (f.name === ".emptyFolderPlaceholder") continue;
          const path = `${folder}/${f.name}`;
          const { data: pub } = supabase.storage.from("newsletter-assets").getPublicUrl(path);
          all.push({
            name: f.name,
            fullPath: path,
            url: pub.publicUrl,
            size: (f.metadata as any)?.size ?? null,
            updated_at: f.updated_at || (f as any).created_at || null,
            kind: folder === "image" ? "image" : "doc",
          });
        }
      }
      setItems(all);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (libraryOpen) fetchLibrary(); }, [libraryOpen]);

  const upload = async (file: File, kind: "image" | "doc") => {
    setUploading(true);
    try {
      const path = `${kind}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage.from("newsletter-assets").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("newsletter-assets").getPublicUrl(path);
      const url = data.publicUrl;
      setLastUrl(url);
      insertSnippet(url, file.name, kind);
      toast({ title: kind === "image" ? "Image insérée" : "Document joint" });
    } catch (e: any) {
      toast({ title: "Échec upload", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const insertSnippet = (url: string, name: string, kind: "image" | "doc") => {
    const snippet = kind === "image"
      ? `<p style="text-align:center"><img src="${url}" alt="" style="max-width:100%;border-radius:8px"/></p>`
      : `<p>📎 <a href="${url}" target="_blank" rel="noopener">${name}</a></p>`;
    onInsert(snippet);
  };

  const removeItem = async (item: MediaItem) => {
    if (!confirm(`Supprimer "${item.name}" de la bibliothèque ?`)) return;
    const { error } = await supabase.storage.from("newsletter-assets").remove([item.fullPath]);
    if (error) toast({ title: "Erreur suppression", description: error.message, variant: "destructive" });
    else { toast({ title: "Fichier supprimé" }); fetchLibrary(); }
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const images = filtered.filter((i) => i.kind === "image" || isImage(i.name));
  const docs = filtered.filter((i) => i.kind === "doc" && !isImage(i.name));

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
      <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "image"); e.target.value = ""; }} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "doc"); e.target.value = ""; }} />

      <Button type="button" size="sm" variant="outline" onClick={() => imgRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-1" />} Téléverser image
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => docRef.current?.click()} disabled={uploading}>
        <Paperclip className="h-4 w-4 mr-1" /> Téléverser document
      </Button>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="secondary">
            <FolderOpen className="h-4 w-4 mr-1" /> Bibliothèque
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" /> Bibliothèque de médias</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un fichier…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Tabs defaultValue="images" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
              <TabsTrigger value="docs">Documents ({docs.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="images" className="flex-1 overflow-y-auto">
              {loading ? <div className="flex justify-center p-6"><Loader2 className="animate-spin h-5 w-5" /></div> :
                images.length === 0 ? <p className="text-muted-foreground text-center py-6 text-sm">Aucune image. Téléversez via le bouton ci-dessus.</p> :
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                  {images.map((it) => (
                    <div key={it.fullPath} className="group relative rounded-md border overflow-hidden bg-white">
                      <img src={it.url} alt={it.name} className="w-full h-28 object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 p-2">
                        <Button size="sm" onClick={() => { insertSnippet(it.url, it.name, "image"); setLibraryOpen(false); }}>Insérer</Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => { navigator.clipboard.writeText(it.url); toast({ title: "URL copiée" }); }}>
                          <Copy className="h-3 w-3 mr-1" /> URL
                        </Button>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-red-500/30 absolute top-1 right-1 h-7 w-7" onClick={() => removeItem(it)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="px-2 py-1 text-[10px] truncate text-muted-foreground">{it.name}</p>
                    </div>
                  ))}
                </div>}
            </TabsContent>
            <TabsContent value="docs" className="flex-1 overflow-y-auto">
              {loading ? <div className="flex justify-center p-6"><Loader2 className="animate-spin h-5 w-5" /></div> :
                docs.length === 0 ? <p className="text-muted-foreground text-center py-6 text-sm">Aucun document.</p> :
                <div className="divide-y border rounded-md">
                  {docs.map((it) => (
                    <div key={it.fullPath} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{it.name}</p>
                        <p className="text-xs text-muted-foreground">{it.updated_at ? new Date(it.updated_at).toLocaleString("fr-FR") : ""}</p>
                      </div>
                      <Button size="sm" onClick={() => { insertSnippet(it.url, it.name, "doc"); setLibraryOpen(false); }}>Insérer</Button>
                      <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(it.url); toast({ title: "URL copiée" }); }}><Copy className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(it)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  ))}
                </div>}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {lastUrl && (
        <div className="flex items-center gap-1 ml-auto text-xs">
          <span className="text-muted-foreground truncate max-w-[200px]">{lastUrl}</span>
          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(lastUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadToolbar;
