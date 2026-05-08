import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare, Plus, Eye, ThumbsUp, Clock, Send,
  Sparkles, Loader2, ChevronDown, ChevronUp, Pin,
  Image as ImageIcon, FileText, Images, Type
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
  likes_count: number;
  views_count: number;
  is_pinned: boolean;
  created_at: string;
}

interface ForumComment {
  id: string;
  post_id: string;
  content: string;
  user_id: string;
  likes_count: number;
  created_at: string;
}

const CATEGORIES = [
  "Général",
  "Création d'entreprise",
  "Fiscalité",
  "Juridique",
  "Financement",
  "Conseils",
];

const Forum = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "Général" });
  const [aiInput, setAiInput] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressText, setAiProgressText] = useState("");
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, ForumComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [aiCommentGenerating, setAiCommentGenerating] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  // Real-time comments subscription
  useEffect(() => {
    const channel = supabase
      .channel("forum-comments-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_comments" }, (payload) => {
        const newComment = payload.new as ForumComment;
        setComments((prev) => ({
          ...prev,
          [newComment.post_id]: [...(prev[newComment.post_id] || []), newComment],
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("forum_posts")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as ForumPost[]);
      // Fetch profile names
      const userIds = [...new Set(data.map((p: any) => p.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        if (profilesData) {
          const map: Record<string, string> = {};
          profilesData.forEach((p: any) => { map[p.user_id] = p.full_name || "Membre"; });
          setProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase
      .from("forum_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (data) {
      setComments((prev) => ({ ...prev, [postId]: data as ForumComment[] }));
      // Fetch comment author names
      const userIds = [...new Set(data.map((c: any) => c.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        if (profilesData) {
          setProfiles((prev) => {
            const updated = { ...prev };
            profilesData.forEach((p: any) => { updated[p.user_id] = p.full_name || "Membre"; });
            return updated;
          });
        }
      }
    }
  };

  const togglePost = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) fetchComments(postId);
      // Increment view count
      supabase.from("forum_posts").update({ views_count: (posts.find(p => p.id === postId)?.views_count || 0) + 1 } as any).eq("id", postId).then();
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast({ title: "Connectez-vous", description: "Vous devez être connecté pour publier", variant: "destructive" });
      return;
    }
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({ title: "Champs requis", description: "Titre et contenu sont obligatoires", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("forum_posts").insert({
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      user_id: user.id,
    } as any);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Publication créée !" });
      setNewPost({ title: "", content: "", category: "Général" });
      setAiInput("");
      setDialogOpen(false);
      fetchPosts();
    }
  };

  const generatePostWithAI = async (format: "text" | "image" | "multi-image" = "text") => {
    if (!aiInput.trim()) {
      toast({ title: "Saisissez une idée", description: "Même un simple mot suffit", variant: "destructive" });
      return;
    }
    setShowFormatPicker(false);
    setAiGenerating(true);
    setAiProgress(10);
    setAiProgressText("Analyse de votre idée...");
    try {
      setAiProgress(30);
      setAiProgressText("Génération du contenu...");
      const { data, error } = await supabase.functions.invoke("forum-ai-generate", {
        body: { content: aiInput, type: "post", format },
      });
      if (error) throw error;
      if (data) {
        setNewPost({
          title: data.title || aiInput,
          content: data.content || aiInput,
          category: data.category || "Général",
        });
        setAiProgress(70);

        // Generate image if requested
        if (format === "image" || format === "multi-image") {
          setAiProgressText("Génération de l'image IA...");
          try {
            const { data: imgData, error: imgError } = await supabase.functions.invoke("forum-ai-generate", {
              body: { content: data.title || aiInput, type: "image" },
            });
            if (!imgError && imgData?.image_url) {
              setGeneratedImage(imgData.image_url);
            }
          } catch {
            // Continue without image
          }
        }

        setAiProgress(100);
        setAiProgressText("Terminé !");
        toast({ title: "Publication générée par l'IA !" });
      }
    } catch (err: any) {
      toast({ title: "Erreur IA", description: err.message || "Réessayez", variant: "destructive" });
    } finally {
      setTimeout(() => {
        setAiGenerating(false);
        setAiProgress(0);
        setAiProgressText("");
      }, 500);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user) {
      toast({ title: "Connectez-vous", variant: "destructive" });
      return;
    }
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    const { error } = await supabase.from("forum_comments").insert({
      post_id: postId,
      content,
      user_id: user.id,
    } as any);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  const generateCommentWithAI = async (postId: string) => {
    const input = commentInputs[postId]?.trim();
    if (!input) {
      toast({ title: "Saisissez une idée de commentaire", variant: "destructive" });
      return;
    }
    setAiCommentGenerating(postId);
    try {
      const { data, error } = await supabase.functions.invoke("forum-ai-generate", {
        body: { content: input, type: "comment" },
      });
      if (error) throw error;
      if (data?.content) {
        setCommentInputs((prev) => ({ ...prev, [postId]: data.content }));
      }
    } catch (err: any) {
      toast({ title: "Erreur IA", description: err.message, variant: "destructive" });
    } finally {
      setAiCommentGenerating(null);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) { toast({ title: "Connectez-vous", variant: "destructive" }); return; }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    await supabase.from("forum_posts").update({ likes_count: (post.likes_count || 0) + 1 } as any).eq("id", postId);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
  };

  const filteredPosts = selectedCategory === "all" ? posts : posts.filter((p) => p.category === selectedCategory);

  const getInitials = (userId: string) => {
    const name = profiles[userId] || "M";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-3">
              Forum de la Communauté
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Échangez avec d'autres entrepreneurs, posez vos questions et partagez votre expérience
            </p>
          </div>

          {/* Filters & Create */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <Button variant={selectedCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("all")}>
                Tous
              </Button>
              {CATEGORIES.map((cat) => (
                <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>
                  {cat}
                </Button>
              ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Nouvelle discussion</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer une discussion</DialogTitle>
                  <DialogDescription>Saisissez votre idée et laissez l'IA vous aider à rédiger</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* AI Helper */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" />
                      Assistant IA — Éditeur intelligent
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Saisissez une idée, même un seul mot..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !aiGenerating && setShowFormatPicker(true)}
                      />
                      <Button onClick={() => setShowFormatPicker(true)} disabled={aiGenerating || !aiInput.trim()} size="sm" className="shrink-0">
                        {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Format Picker */}
                    {showFormatPicker && (
                      <div className="grid gap-2 pt-2">
                        <Button variant="outline" className="h-auto py-3 justify-start gap-3" onClick={() => generatePostWithAI("image")}>
                          <ImageIcon className="h-5 w-5 text-primary shrink-0" />
                          <div className="text-left">
                            <p className="font-medium text-sm">Avec image IA</p>
                            <p className="text-xs text-muted-foreground font-normal">Image ultra-réaliste générée</p>
                          </div>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 justify-start gap-3" onClick={() => generatePostWithAI("multi-image")}>
                          <Images className="h-5 w-5 text-primary shrink-0" />
                          <div className="text-left">
                            <p className="font-medium text-sm">Carrousel d'images</p>
                            <p className="text-xs text-muted-foreground font-normal">Galerie thématique cohérente</p>
                          </div>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 justify-start gap-3" onClick={() => generatePostWithAI("text")}>
                          <Type className="h-5 w-5 text-primary shrink-0" />
                          <div className="text-left">
                            <p className="font-medium text-sm">Texte uniquement</p>
                            <p className="text-xs text-muted-foreground font-normal">Publication textuelle enrichie</p>
                          </div>
                        </Button>
                      </div>
                    )}

                    {/* Progress */}
                    {aiGenerating && (
                      <div className="space-y-1">
                        <Progress value={aiProgress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground text-center">{aiProgressText}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      L'IA enrichira votre idée en publication complète, naturelle et engageante
                    </p>
                  </div>

                  <Separator />

                  {/* Generated Image Preview */}
                  {generatedImage && (
                    <div className="relative">
                      <img src={generatedImage} alt="Image générée" className="w-full rounded-lg max-h-48 object-cover" />
                      <Button size="sm" variant="destructive" className="absolute top-2 right-2 h-7 text-xs" onClick={() => setGeneratedImage(null)}>
                        Supprimer
                      </Button>
                    </div>
                  )}

                  <Input
                    placeholder="Titre de la discussion"
                    value={newPost.title}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <Select value={newPost.category} onValueChange={(v) => setNewPost((prev) => ({ ...prev, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Contenu de votre publication..."
                    value={newPost.content}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="resize-none"
                  />
                  <Button onClick={handleCreatePost} className="w-full">Publier</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune discussion pour le moment. Soyez le premier !</p>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className={`overflow-hidden transition-shadow hover:shadow-md ${post.is_pinned ? "border-primary/50" : ""}`}>
                  <CardContent className="p-0">
                    {/* Post Header */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {getInitials(post.user_id)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm text-foreground">
                              {profiles[post.user_id] || "Membre"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                            </span>
                            {post.is_pinned && (
                              <Badge variant="default" className="text-xs py-0 px-1.5">
                                <Pin className="h-3 w-3 mr-0.5" />Épinglé
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs mb-2">{post.category}</Badge>
                          <h3 className="font-semibold text-foreground mb-1.5">{post.title}</h3>
                          <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                            {expandedPost === post.id ? post.content : post.content.length > 200 ? post.content.substring(0, 200) + "..." : post.content}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-3 ml-13">
                        <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2" onClick={() => handleLike(post.id)}>
                          <ThumbsUp className="h-4 w-4 mr-1" />{post.likes_count || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2" onClick={() => togglePost(post.id)}>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {comments[post.id]?.length || 0}
                          {expandedPost === post.id ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                        </Button>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" />{post.views_count || 0}
                        </span>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {expandedPost === post.id && (
                      <div className="border-t bg-muted/30">
                        {/* Comments List */}
                        <div className="max-h-80 overflow-y-auto">
                          {(comments[post.id] || []).map((comment) => (
                            <div key={comment.id} className="px-4 sm:px-5 py-3 border-b border-border/50 last:border-0">
                              <div className="flex items-start gap-2">
                                <Avatar className="h-7 w-7 shrink-0">
                                  <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                                    {getInitials(comment.user_id)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">{profiles[comment.user_id] || "Membre"}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-line">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(comments[post.id] || []).length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-6">Aucun commentaire. Soyez le premier !</p>
                          )}
                        </div>

                        {/* Comment Input */}
                        <div className="px-4 sm:px-5 py-3 border-t flex gap-2 items-end">
                          <div className="flex-1 relative">
                            <Textarea
                              placeholder="Votre commentaire..."
                              value={commentInputs[post.id] || ""}
                              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                              rows={2}
                              className="resize-none text-sm pr-10"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => generateCommentWithAI(post.id)}
                              disabled={aiCommentGenerating === post.id}
                              title="Enrichir avec l'IA"
                            >
                              {aiCommentGenerating === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </Button>
                            <Button size="icon" className="h-8 w-8" onClick={() => handleComment(post.id)}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Forum;
