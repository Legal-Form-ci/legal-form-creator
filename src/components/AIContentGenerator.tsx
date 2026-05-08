import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, Image as ImageIcon, FileText, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type ImageMode = "none" | "cover" | "cover_and_inline";

interface AIContentGeneratorProps {
  content: string;
  onGenerate: (generated: {
    title: string;
    excerpt: string;
    category: string;
    formattedContent: string;
    tags?: string;
    meta_description?: string;
    slug?: string;
    cover_image?: string;
    author_name?: string;
    inline_images?: string[];
  }) => void;
  disabled?: boolean;
}

const AIContentGenerator = ({ content, onGenerate, disabled }: AIContentGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const { toast } = useToast();

  const generationLabel: Record<ImageMode, string> = {
    cover: "image de couverture",
    cover_and_inline: "image de couverture et illustrations",
    none: "contenu textuel",
  };

  const generateWithAI = async (imageMode: ImageMode) => {
    if (!content.trim()) {
      toast({
        title: "Contenu requis",
        description: "Veuillez saisir du contenu à enrichir (même un simple mot)",
        variant: "destructive",
      });
      return;
    }

    setShowDialog(false);
    setIsGenerating(true);
    setProgress(10);
    setProgressText("Analyse du contenu...");

    try {
      setProgress(30);
      setProgressText("Génération du contenu éditorial...");

      const { data, error } = await supabase.functions.invoke("ai-content-generator", {
        body: { content, imageMode },
      });

      if (error) throw error;

      setProgress(75);
      setProgressText(
        imageMode === "none" ? "Finalisation du texte..." : "Finalisation des médias IA...",
      );

      if (data) {
        const result: any = {
          title: data.title || "",
          excerpt: data.excerpt || "",
          category: data.category || "",
          formattedContent: data.formattedContent || content,
          tags: data.tags || "",
          meta_description: data.meta_description || data.excerpt || "",
          slug: data.slug || "",
          author_name: data.author_name || "Legal Form SARL",
          inline_images: Array.isArray(data.inline_images) ? data.inline_images : [],
        };

        if (data.cover_image) {
          result.cover_image = data.cover_image;
        }

        setProgress(100);
        setProgressText("Terminé !");

        onGenerate(result);

        toast({
          title: "Contenu généré avec succès",
          description: `L'IA a généré le ${generationLabel[imageMode]} avec succès.`,
        });
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer le contenu. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressText("");
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setShowDialog(true)}
        disabled={disabled || isGenerating || !content.trim()}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Générer avec l'IA
          </>
        )}
      </Button>

      {isGenerating && (
        <div className="w-full space-y-2 mt-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">{progressText}</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Générer le contenu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              L'IA va analyser votre texte et générer automatiquement : titre, résumé, catégorie, tags, contenu structuré et médias selon l'option choisie.
            </p>

            <div className="grid gap-3">
              <Button
                onClick={() => generateWithAI("cover")}
                className="h-auto py-4 flex items-start gap-3 justify-start"
                variant="outline"
              >
                <ImageIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold">Avec image de couverture</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    Génère l'article + une image de couverture IA ultra-réaliste
                  </p>
                </div>
              </Button>

              <Button
                onClick={() => generateWithAI("cover_and_inline")}
                className="h-auto py-4 flex items-start gap-3 justify-start"
                variant="outline"
              >
                <Images className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold">Couverture + illustrations dans le contenu</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    Génère l'article, une couverture et des images contextualisées dans les sections clés
                  </p>
                </div>
              </Button>

              <Button
                onClick={() => generateWithAI("none")}
                className="h-auto py-4 flex items-start gap-3 justify-start"
                variant="outline"
              >
                <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold">Sans image</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    Génère uniquement le contenu textuel optimisé et structuré
                  </p>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIContentGenerator;
