import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bold, 
  Italic, 
  Underline,
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3, 
  Link as LinkIcon, 
  Quote, 
  Code, 
  Table as TableIcon, 
  Minus, 
  Palette, 
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo, 
  Redo,
  Image as ImageIcon,
  Highlighter,
  Type,
  Sparkles,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  showAIButton?: boolean;
  onAIGenerate?: () => void;
  isAIGenerating?: boolean;
}

const COLOR_PALETTE = [
  { name: 'Turquoise', value: '#008080' },
  { name: 'Doré', value: '#B8860B' },
  { name: 'Rouge', value: '#e74c3c' },
  { name: 'Bleu', value: '#3498db' },
  { name: 'Vert', value: '#27ae60' },
  { name: 'Orange', value: '#f39c12' },
  { name: 'Violet', value: '#9b59b6' },
  { name: 'Rose', value: '#e91e63' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Jaune', value: '#fff59d' },
  { name: 'Vert', value: '#c8e6c9' },
  { name: 'Bleu', value: '#b3e5fc' },
  { name: 'Rose', value: '#f8bbd9' },
  { name: 'Orange', value: '#ffe0b2' },
];

export const RichTextEditor = ({
  value,
  onChange,
  onImageUpload,
  placeholder = "Rédigez votre contenu ici...",
  className,
  minHeight = "400px",
  showAIButton = false,
  onAIGenerate,
  isAIGenerating = false
}: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const saveToUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-30), value]);
    setRedoStack([]);
  }, [value]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, value]);
      onChange(previousContent);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, value]);
      onChange(nextContent);
    }
  };

  const insertFormatting = (type: string, extraData?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    saveToUndo();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText = "";
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        newText = `**${selectedText || 'texte en gras'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || 'texte en italique'}*`;
        break;
      case 'underline':
        newText = `<u>${selectedText || 'texte souligné'}</u>`;
        break;
      case 'h1':
        newText = `\n# ${selectedText || 'Titre Principal'}\n`;
        break;
      case 'h2':
        newText = `\n## ${selectedText || 'Sous-titre'}\n`;
        break;
      case 'h3':
        newText = `\n### ${selectedText || 'Section'}\n`;
        break;
      case 'list':
        newText = `\n- ${selectedText || 'Élément 1'}\n- Élément 2\n- Élément 3\n`;
        break;
      case 'numbered':
        newText = `\n1. ${selectedText || 'Premier point'}\n2. Deuxième point\n3. Troisième point\n`;
        break;
      case 'link':
        newText = `[${selectedText || 'texte du lien'}](https://url.com)`;
        break;
      case 'quote':
        newText = `\n> ${selectedText || 'Citation importante'}\n`;
        break;
      case 'code':
        if (selectedText.includes('\n')) {
          newText = `\n\`\`\`\n${selectedText || 'code'}\n\`\`\`\n`;
        } else {
          newText = `\`${selectedText || 'code'}\``;
        }
        break;
      case 'table':
        newText = `\n| Colonne 1 | Colonne 2 | Colonne 3 |\n|-----------|-----------|----------|\n| Donnée 1 | Donnée 2 | Donnée 3 |\n| Donnée 4 | Donnée 5 | Donnée 6 |\n`;
        break;
      case 'hr':
        newText = `\n---\n`;
        break;
      case 'color':
        newText = `<span style="color:${extraData || '#008080'}">${selectedText || 'texte coloré'}</span>`;
        break;
      case 'highlight':
        newText = `<mark style="background-color:${extraData || '#fff59d'}">${selectedText || 'texte surligné'}</mark>`;
        break;
      case 'left':
        newText = `<div style="text-align:left">\n\n${selectedText || 'Texte aligné à gauche'}\n\n</div>`;
        break;
      case 'center':
        newText = `<div style="text-align:center">\n\n${selectedText || 'Texte centré'}\n\n</div>`;
        break;
      case 'right':
        newText = `<div style="text-align:right">\n\n${selectedText || 'Texte aligné à droite'}\n\n</div>`;
        break;
    }

    const before = value.substring(0, start);
    const after = value.substring(end);
    handleChange(before + newText + after);

    // Focus and set cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = start + newText.length + cursorOffset;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleImageUploadClick = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || !onImageUpload) return;

      for (const file of Array.from(files)) {
        try {
          const url = await onImageUpload(file);
          if (url) {
            saveToUndo();
            const imageMarkdown = `\n![${file.name}](${url})\n`;
            handleChange(value + imageMarkdown);
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
    };

    input.click();
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    onClick, 
    title, 
    active = false,
    disabled = false 
  }: { 
    icon: React.ElementType; 
    onClick: () => void; 
    title: string;
    active?: boolean;
    disabled?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 w-8 p-0",
        active && "bg-primary/20 text-primary"
      )}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const Divider = () => <div className="w-px h-6 bg-border mx-1" />;

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-muted border-b">
        {/* Undo/Redo */}
        <ToolbarButton icon={Undo} onClick={handleUndo} title="Annuler" disabled={undoStack.length === 0} />
        <ToolbarButton icon={Redo} onClick={handleRedo} title="Rétablir" disabled={redoStack.length === 0} />
        <Divider />

        {/* Text Formatting */}
        <ToolbarButton icon={Bold} onClick={() => insertFormatting('bold')} title="Gras (Ctrl+B)" />
        <ToolbarButton icon={Italic} onClick={() => insertFormatting('italic')} title="Italique (Ctrl+I)" />
        <ToolbarButton icon={Underline} onClick={() => insertFormatting('underline')} title="Souligné" />
        <Divider />

        {/* Headings */}
        <ToolbarButton icon={Heading1} onClick={() => insertFormatting('h1')} title="Titre H1" />
        <ToolbarButton icon={Heading2} onClick={() => insertFormatting('h2')} title="Titre H2" />
        <ToolbarButton icon={Heading3} onClick={() => insertFormatting('h3')} title="Titre H3" />
        <Divider />

        {/* Lists */}
        <ToolbarButton icon={List} onClick={() => insertFormatting('list')} title="Liste à puces" />
        <ToolbarButton icon={ListOrdered} onClick={() => insertFormatting('numbered')} title="Liste numérotée" />
        <Divider />

        {/* Advanced */}
        <ToolbarButton icon={Quote} onClick={() => insertFormatting('quote')} title="Citation" />
        <ToolbarButton icon={Code} onClick={() => insertFormatting('code')} title="Code" />
        <ToolbarButton icon={LinkIcon} onClick={() => insertFormatting('link')} title="Lien" />
        <ToolbarButton icon={TableIcon} onClick={() => insertFormatting('table')} title="Tableau" />
        <ToolbarButton icon={Minus} onClick={() => insertFormatting('hr')} title="Ligne horizontale" />
        <Divider />

        {/* Alignment */}
        <ToolbarButton icon={AlignLeft} onClick={() => insertFormatting('left')} title="Aligner à gauche" />
        <ToolbarButton icon={AlignCenter} onClick={() => insertFormatting('center')} title="Centrer" />
        <ToolbarButton icon={AlignRight} onClick={() => insertFormatting('right')} title="Aligner à droite" />
        <Divider />

        {/* Colors */}
        <div className="relative">
          <ToolbarButton 
            icon={Palette} 
            onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }} 
            title="Couleur du texte" 
          />
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 flex gap-1 p-2 bg-popover border rounded-md shadow-lg z-50">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => { insertFormatting('color', color.value); setShowColorPicker(false); }}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <ToolbarButton 
            icon={Highlighter} 
            onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }} 
            title="Surligner" 
          />
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 flex gap-1 p-2 bg-popover border rounded-md shadow-lg z-50">
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => { insertFormatting('highlight', color.value); setShowHighlightPicker(false); }}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Image Upload */}
        {onImageUpload && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImageUploadClick}
            className="h-8"
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Images
          </Button>
        )}

        {/* AI Generate */}
        {showAIButton && onAIGenerate && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onAIGenerate}
            disabled={isAIGenerating || !value.trim()}
            className="h-8 bg-gradient-to-r from-primary to-accent"
          >
            {isAIGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Générer IA
          </Button>
        )}
      </div>

      {/* Editor with tabs */}
      <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as "write" | "preview")}>
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent">
          <TabsTrigger value="write" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Type className="h-4 w-4 mr-2" />
            Écrire
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            Aperçu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="m-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { saveToUndo(); handleChange(e.target.value); }}
            placeholder={placeholder}
            className="rounded-none border-0 resize-none font-mono text-sm focus-visible:ring-0"
            style={{ minHeight }}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert p-4 overflow-y-auto bg-card"
            style={{ minHeight }}
          >
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({children}) => <h1 className="text-3xl font-bold text-primary mb-4 mt-6 border-b-2 border-primary/30 pb-2">{children}</h1>,
                  h2: ({children}) => <h2 className="text-2xl font-semibold text-foreground mb-3 mt-5">{children}</h2>,
                  h3: ({children}) => <h3 className="text-xl font-medium text-foreground mb-2 mt-4">{children}</h3>,
                  p: ({children}) => <p className="mb-4 leading-relaxed text-foreground">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                  li: ({children}) => <li className="text-foreground">{children}</li>,
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-4 bg-primary/5 py-3 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full border-collapse border border-border">{children}</table>
                    </div>
                  ),
                  th: ({children}) => <th className="border border-border p-3 bg-muted font-semibold text-left">{children}</th>,
                  td: ({children}) => <td className="border border-border p-3">{children}</td>,
                  code: ({children, className}) => className ? (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                      <code className="text-sm font-mono">{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>
                  ),
                  hr: () => <hr className="my-8 border-t-2 border-muted" />,
                  a: ({href, children}) => (
                    <a href={href} className="text-primary underline hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  img: ({src, alt}) => (
                    <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-lg my-4 shadow-md" />
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">L'aperçu apparaîtra ici...</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RichTextEditor;
