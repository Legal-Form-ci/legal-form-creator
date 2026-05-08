import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Search, Eye, Trash2, CheckCircle, Clock, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const ContactMessages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("contact_messages").delete().eq("id", id);
    setMessages(prev => prev.filter(m => m.id !== id));
    setSelectedMessage(null);
    toast({ title: "Message supprimé" });
  };

  const filtered = messages.filter(m => {
    const matchSearch = !searchTerm || 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || 
      (filterStatus === "read" && m.is_read) || 
      (filterStatus === "unread" && !m.is_read);
    return matchSearch && matchStatus;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages de contact</h1>
            <p className="text-muted-foreground">
              {messages.length} messages · {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{messages.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
            <p className="text-xs text-muted-foreground">Non lus</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-foreground">{messages.length - unreadCount}</p>
            <p className="text-xs text-muted-foreground">Lus</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Mail className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{messages.filter(m => new Date(m.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="unread">Non lus</SelectItem>
              <SelectItem value="read">Lus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Aucun message</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Sujet</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(msg => (
                      <TableRow key={msg.id} className={!msg.is_read ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Badge variant={msg.is_read ? "secondary" : "default"} className="text-xs">
                            {msg.is_read ? "Lu" : "Nouveau"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{msg.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{msg.email}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{msg.subject || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {format(new Date(msg.created_at), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setSelectedMessage(msg); markAsRead(msg.id); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMessage(msg.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message de {selectedMessage?.name}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Email :</span>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Téléphone :</span>
                  <p className="font-medium">{selectedMessage.phone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Sujet :</span>
                  <p className="font-medium">{selectedMessage.subject || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Date :</span>
                  <p className="font-medium">{format(new Date(selectedMessage.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Message :</span>
                <div className="mt-1 p-4 bg-muted rounded-lg whitespace-pre-wrap text-foreground">
                  {selectedMessage.message}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {selectedMessage.phone && (
                  <Button variant="outline" className="bg-green-50 dark:bg-green-950 border-green-300 text-green-700 dark:text-green-400 hover:bg-green-100" asChild>
                    <a
                      href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${selectedMessage.name},\n\nMerci pour votre message concernant "${selectedMessage.subject || 'votre demande'}".\n\nCordialement,\nLegal Form SARL`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Phone className="h-4 w-4 mr-2" />WhatsApp
                    </a>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <a href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Votre message')}&body=${encodeURIComponent(`Bonjour ${selectedMessage.name},\n\nMerci pour votre message.\n\nCordialement,\nLegal Form SARL`)}`}>
                    <Mail className="h-4 w-4 mr-2" />Répondre par email
                  </a>
                </Button>
                <Button variant="destructive" onClick={() => deleteMessage(selectedMessage.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ContactMessages;
