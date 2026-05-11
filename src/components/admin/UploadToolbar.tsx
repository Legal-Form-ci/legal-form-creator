import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Paperclip, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onInsert: (htmlSnippet: string) => void;
}

const UploadToolbar = ({ onInsert }: Props) => {
  const { toast } = useToast();
  const imgRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const upload = async (file: File, kind: "image" | "doc") => {
    setUploading(true);
    try {
      const path = `${kind}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage.from("newsletter-assets").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("newsletter-assets").getPublicUrl(path);
      const url = data.publicUrl;
      setLastUrl(url);
      const snippet = kind === "image"
        ? `<p style="text-align:center"><img src="${url}" alt="" style="max-width:100%;border-radius:8px"/></p>`
        : `<p>📎 <a href="${url}" target="_blank" rel="noopener">${file.name}</a></p>`;
      onInsert(snippet);
      toast({ title: kind === "image" ? "Image insérée" : "Document joint" });
    } catch (e: any) {
      toast({ title: "Échec upload", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
      <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "image"); e.target.value = ""; }} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "doc"); e.target.value = ""; }} />
      <Button type="button" size="sm" variant="outline" onClick={() => imgRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-1" />} Insérer image
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => docRef.current?.click()} disabled={uploading}>
        <Paperclip className="h-4 w-4 mr-1" /> Joindre document
      </Button>
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
