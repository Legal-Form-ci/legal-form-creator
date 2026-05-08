import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, User, MessageSquare, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface RequestInfo {
  id: string;
  type: "company" | "service";
  name: string;
  status: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const ClientMessages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestInfo[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const loadRequests = useCallback(async () => {
    if (!user) return;

    const { data: companies } = await supabase
      .from("company_requests")
      .select("id, company_name, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: services } = await (supabase as any)
      .from("service_requests")
      .select("id, service_type, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const reqs: RequestInfo[] = [
      ...(companies || []).map((c: any) => ({ id: c.id, type: "company" as const, name: c.company_name || "Entreprise", status: c.status })),
      ...((services || []) as any[]).map((s: any) => ({ id: s.id, type: "service" as const, name: s.service_type || "Service", status: s.status })),
    ];
    setRequests(reqs);

    // Count unread per request
    const { data: unreadMsgs } = await supabase
      .from("request_messages")
      .select("request_id")
      .eq("is_read", false)
      .eq("sender_role", "admin")
      .in("request_id", reqs.map((r) => r.id));

    const counts: Record<string, number> = {};
    for (const msg of unreadMsgs || []) {
      counts[msg.request_id] = (counts[msg.request_id] || 0) + 1;
    }
    setUnreadCounts(counts);
  }, [user]);

  const loadMessages = useCallback(async (req: RequestInfo) => {
    const { data } = await supabase
      .from("request_messages")
      .select("*")
      .eq("request_id", req.id)
      .eq("request_type", req.type)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark admin messages as read
    await supabase
      .from("request_messages")
      .update({ is_read: true })
      .eq("request_id", req.id)
      .eq("sender_role", "admin");
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (selectedRequest) {
      loadMessages(selectedRequest);

      const channel = supabase
        .channel(`client-msgs-${selectedRequest.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "request_messages",
          filter: `request_id=eq.${selectedRequest.id}`,
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedRequest, loadMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !selectedRequest) return;
    setSending(true);
    try {
      const { error } = await supabase.from("request_messages").insert({
        request_id: selectedRequest.id,
        request_type: selectedRequest.type,
        sender_id: user.id,
        sender_role: "client",
        message: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
      toast.success("Message envoyé");
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setSending(false);
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Mes Messages
              {totalUnread > 0 && <Badge variant="destructive">{totalUnread}</Badge>}
            </h1>
            <p className="text-muted-foreground">Échangez avec l'équipe Legal Form</p>
          </div>

          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucune demande en cours. Créez une demande pour démarrer une conversation.</p>
                <Button className="mt-4" onClick={() => navigate("/create")}>Créer une entreprise</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: "500px" }}>
              {/* Request List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mes demandes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[450px]">
                    {requests.map((req) => (
                      <button
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                          selectedRequest?.id === req.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-medium truncate">{req.name}</span>
                          </div>
                          {unreadCounts[req.id] > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0 shrink-0">{unreadCounts[req.id]}</Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">{req.type === "company" ? "Création" : "Service"}</Badge>
                      </button>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat */}
              <Card className="lg:col-span-2 flex flex-col">
                {selectedRequest ? (
                  <>
                    <CardHeader className="pb-3 border-b border-border">
                      <CardTitle className="text-base">{selectedRequest.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0">
                      <ScrollArea className="flex-1 p-4" style={{ minHeight: "300px" }}>
                        <div className="space-y-3">
                          {messages.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm py-8">
                              Envoyez un message pour démarrer la conversation
                            </p>
                          )}
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender_role === "client" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[75%] rounded-lg p-3 ${
                                msg.sender_role === "client"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}>
                                <div className="flex items-center gap-1 mb-1">
                                  <User className="h-3 w-3" />
                                  <span className="text-xs font-semibold">
                                    {msg.sender_role === "admin" ? "Legal Form" : "Vous"}
                                  </span>
                                </div>
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
                  <div className="flex-1 flex items-center justify-center text-muted-foreground" style={{ minHeight: "400px" }}>
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Sélectionnez une demande</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientMessages;
