import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketIcon, Plus, Search, Clock, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { toast } from "@/hooks/use-toast";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

const Tickets = () => {
  const { user, userRole, loading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", priority: "normal" });

  useEffect(() => {
    if (!loading && user && userRole === 'admin') fetchTickets();
  }, [user, loading, userRole]);

  useEffect(() => { filterTickets(); }, [tickets, searchTerm, statusFilter]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    setFilteredTickets(filtered);
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { open: "bg-blue-500", in_progress: "bg-yellow-500", resolved: "bg-green-500", closed: "bg-gray-500" };
    return map[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };
    return map[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = { urgent: "bg-red-500", high: "bg-orange-500", normal: "bg-yellow-500", low: "bg-green-500" };
    return map[priority] || "bg-gray-500";
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = { urgent: "Urgent", high: "Haute", normal: "Normale", low: "Basse" };
    return map[priority] || priority;
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('support_tickets').insert({
      subject: newTicket.subject,
      message: newTicket.description,
      priority: newTicket.priority,
      user_id: user?.id,
    });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de créer le ticket", variant: "destructive" });
      return;
    }
    toast({ title: "Ticket créé", description: "Le ticket a été créé avec succès" });
    setNewTicket({ subject: "", description: "", priority: "normal" });
    setIsCreateOpen(false);
    fetchTickets();
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticketId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" });
      return;
    }
    toast({ title: "Statut mis à jour" });
    fetchTickets();
  };

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support & Tickets</h1>
            <p className="text-muted-foreground">Gérez les demandes d'assistance</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouveau ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un ticket</DialogTitle>
                <DialogDescription>Décrivez votre problème ou question</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Sujet</Label>
                  <Input id="subject" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="Résumé de votre demande" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} placeholder="Détaillez votre problème..." rows={4} />
                </div>
                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateTicket} className="w-full">Créer le ticket</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: TicketIcon, color: "text-muted-foreground" },
            { label: "Ouverts", value: stats.open, icon: AlertCircle, color: "text-blue-500" },
            { label: "En cours", value: stats.inProgress, icon: Clock, color: "text-yellow-500" },
            { label: "Résolus", value: stats.resolved, icon: CheckCircle2, color: "text-green-500" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="open">Ouverts</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolus</SelectItem>
              <SelectItem value="closed">Fermés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <TicketIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun ticket trouvé</p>
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.message}</p>
                          <span className="text-xs text-muted-foreground mt-2 block">
                            {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex gap-2">
                        <Badge className={`${getStatusColor(ticket.status)} text-white`}>{getStatusLabel(ticket.status)}</Badge>
                        <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>{getPriorityLabel(ticket.priority)}</Badge>
                      </div>
                      <Select value={ticket.status} onValueChange={(value) => updateTicketStatus(ticket.id, value)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Ouvert</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="resolved">Résolu</SelectItem>
                          <SelectItem value="closed">Fermé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Tickets;
