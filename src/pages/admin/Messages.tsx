import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Send, User, MessageSquare, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Conversation {
  request_id: string;
  request_type: string;
  client_name: string;
  client_email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  company_name?: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const AdminMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      // Get all messages grouped by request
      const { data: allMessages, error } = await supabase
        .from("request_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by request_id
      const convMap = new Map<string, any>();
      for (const msg of allMessages || []) {
        const key = `${msg.request_id}-${msg.request_type}`;
        if (!convMap.has(key)) {
          convMap.set(key, {
            request_id: msg.request_id,
            request_type: msg.request_type || "company",
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread_count: 0,
            messages: [],
          });
        }
        const conv = convMap.get(key);
        if (!msg.is_read && msg.sender_role !== "admin") {
          conv.unread_count++;
        }
      }

      // Enrich with client info
      const enriched: Conversation[] = [];
      for (const [, conv] of convMap) {
        let clientName = "Client";
        let clientEmail = "";
        let companyName = "";

        if (conv.request_type === "company") {
          const { data } = await supabase
            .from("company_requests")
            .select("contact_name, email, company_name")
            .eq("id", conv.request_id)
            .maybeSingle();
          if (data) {
            clientName = data.contact_name || "Client";
            clientEmail = data.email || "";
            companyName = data.company_name || "";
          }
        } else {
          const { data } = await (supabase as any)
            .from("service_requests")
            .select("contact_name, contact_email, service_type")
            .eq("id", conv.request_id)
            .maybeSingle();
          if (data) {
            clientName = (data as any).contact_name || "Client";
            clientEmail = (data as any).contact_email || "";
            companyName = (data as any).service_type || "";
          }
        }

        enriched.push({
          ...conv,
          client_name: clientName,
          client_email: clientEmail,
          company_name: companyName,
        });
      }

      enriched.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      setConversations(enriched);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conv: Conversation) => {
    const { data, error } = await supabase
      .from("request_messages")
      .select("*")
      .eq("request_id", conv.request_id)
      .eq("request_type", conv.request_type)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }
    setMessages(data || []);

    // Mark unread messages as read
    await supabase
      .from("request_messages")
      .update({ is_read: true })
      .eq("request_id", conv.request_id)
      .eq("request_type", conv.request_type)
      .neq("sender_role", "admin");
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);

      const channel = supabase
        .channel(`admin-msgs-${selectedConv.request_id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "request_messages",
          filter: `request_id=eq.${selectedConv.request_id}`,
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedConv, loadMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !selectedConv) return;
    setSending(true);
    try {
      const { error } = await supabase.from("request_messages").insert({
        request_id: selectedConv.request_id,
        request_type: selectedConv.request_type,
        sender_id: user.id,
        sender_role: "admin",
        message: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
      toast.success("Message envoyé");
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Erreur d'envoi");
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) =>
    !searchTerm ||
    c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messagerie</h1>
        <p className="text-muted-foreground">Communication avec les clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Conversations</CardTitle>
              <Button variant="ghost" size="icon" onClick={loadConversations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-360px)]">
              {loading ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Chargement...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Aucune conversation</p>
              ) : (
                filtered.map((conv) => (
                  <button
                    key={`${conv.request_id}-${conv.request_type}`}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                      selectedConv?.request_id === conv.request_id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{conv.client_name}</span>
                          {conv.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">{conv.unread_count}</Badge>
                          )}
                        </div>
                        {conv.company_name && (
                          <p className="text-xs text-muted-foreground truncate">{conv.company_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 truncate">{conv.last_message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(conv.last_message_at), "dd/MM", { locale: fr })}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConv ? (
            <>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{selectedConv.client_name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedConv.company_name && `${selectedConv.company_name} • `}
                      {selectedConv.request_type === "company" ? "Création" : "Service"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg p-3 ${
                          msg.sender_role === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {format(new Date(msg.created_at), "dd MMM HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Votre message..."
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon" className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
