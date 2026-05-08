import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Trash2, Pin, PinOff, Eye, Search,
  ThumbsUp, Clock, AlertTriangle, Users
} from "lucide-react";
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

const ForumManagement = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [postComments, setPostComments] = useState<ForumComment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [postsRes, commentsRes, profilesRes] = await Promise.all([
      supabase.from("forum_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("forum_comments").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);

    if (postsRes.data) setPosts(postsRes.data);
    if (commentsRes.data) setComments(commentsRes.data);
    if (profilesRes.data) {
      const map: Record<string, string> = {};
      profilesRes.data.forEach((p: any) => { map[p.user_id] = p.full_name || "Utilisateur"; });
      setProfiles(map);
    }
    setLoading(false);
  };

  const togglePin = async (post: ForumPost) => {
    const { error } = await supabase
      .from("forum_posts")
      .update({ is_pinned: !post.is_pinned })
      .eq("id", post.id);

    if (!error) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_pinned: !p.is_pinned } : p));
      toast({ title: post.is_pinned ? "Publication désépinglée" : "Publication épinglée" });
    }
  };

  const deletePost = async (postId: string) => {
    // Delete comments first
    await supabase.from("forum_comments").delete().eq("post_id", postId);
    const { error } = await supabase.from("forum_posts").delete().eq("id", postId);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setComments(prev => prev.filter(c => c.post_id !== postId));
      toast({ title: "Publication supprimée" });
    }
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from("forum_comments").delete().eq("id", commentId);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPostComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: "Commentaire supprimé" });
    }
  };

  const viewPostComments = (post: ForumPost) => {
    setSelectedPost(post);
    setPostComments(comments.filter(c => c.post_id === post.id));
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalPosts: posts.length,
    totalComments: comments.length,
    pinnedPosts: posts.filter(p => p.is_pinned).length,
    uniqueUsers: new Set([...posts.map(p => p.user_id), ...comments.map(c => c.user_id)]).size,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion du Forum</h1>
          <p className="text-muted-foreground">Modérez les publications et commentaires</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground">Publications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary/70" />
              <p className="text-2xl font-bold">{stats.totalComments}</p>
              <p className="text-xs text-muted-foreground">Commentaires</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Pin className="h-6 w-6 mx-auto mb-2 text-accent-foreground" />
              <p className="text-2xl font-bold">{stats.pinnedPosts}</p>
              <p className="text-xs text-muted-foreground">Épinglées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-secondary-foreground" />
              <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              <p className="text-xs text-muted-foreground">Contributeurs</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une publication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Publications ({posts.length})</TabsTrigger>
            <TabsTrigger value="comments">Commentaires ({comments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune publication</p>
            ) : (
              filteredPosts.map((post) => {
                const commentCount = comments.filter(c => c.post_id === post.id).length;
                return (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {post.is_pinned && <Pin className="h-4 w-4 text-amber-500" />}
                            <h3 className="font-semibold truncate">{post.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{profiles[post.user_id] || "Utilisateur"}</span>
                            <Badge variant="outline" className="text-xs">{post.category}</Badge>
                            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{post.likes_count}</span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views_count}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{commentCount}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(post.created_at), { locale: fr, addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => viewPostComments(post)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => togglePin(post)}>
                            {post.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePost(post.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-3 mt-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun commentaire</p>
            ) : (
              comments.slice(0, 50).map((comment) => {
                const parentPost = posts.find(p => p.id === comment.post_id);
                return (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm mb-1">{comment.content}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{profiles[comment.user_id] || "Utilisateur"}</span>
                            {parentPost && <span className="truncate">→ {parentPost.title}</span>}
                            <span>{formatDistanceToNow(new Date(comment.created_at), { locale: fr, addSuffix: true })}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteComment(comment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Post detail dialog */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPost?.title}</DialogTitle>
              <DialogDescription>
                Par {profiles[selectedPost?.user_id || ""] || "Utilisateur"} • {selectedPost?.category}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm whitespace-pre-wrap">{selectedPost?.content}</p>
              <h4 className="font-semibold text-sm">Commentaires ({postComments.length})</h4>
              {postComments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun commentaire</p>
              ) : (
                postComments.map(c => (
                  <div key={c.id} className="flex items-start justify-between border rounded-lg p-3">
                    <div>
                      <p className="text-sm">{c.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {profiles[c.user_id] || "Utilisateur"} • {formatDistanceToNow(new Date(c.created_at), { locale: fr, addSuffix: true })}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteComment(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ForumManagement;
