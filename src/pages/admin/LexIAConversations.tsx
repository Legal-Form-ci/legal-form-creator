import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Bot, 
  User, 
  Calendar, 
  Clock, 
  Search, 
  BarChart3,
  TrendingUp,
  Users,
  Star,
  Download,
  RefreshCw,
  Eye,
  Mail
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Conversation {
  id: string;
  session_id: string;
  user_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  started_at: string;
  ended_at: string | null;
  summary: string | null;
  satisfaction_rating: number | null;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Stats {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  avgSatisfaction: number;
  conversationsToday: number;
  conversationsThisWeek: number;
}

const LexIAConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    totalMessages: 0,
    avgMessagesPerConversation: 0,
    avgSatisfaction: 0,
    conversationsToday: 0,
    conversationsThisWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchStats();
  }, [dateFilter]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('lexia_conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFilter === 'today') {
        query = query.gte('created_at', startOfDay(new Date()).toISOString());
      } else if (dateFilter === 'week') {
        query = query.gte('created_at', subDays(new Date(), 7).toISOString());
      } else if (dateFilter === 'month') {
        query = query.gte('created_at', subDays(new Date(), 30).toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations((data as any) || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total conversations
      const { count: totalConversations } = await supabase
        .from('lexia_conversations')
        .select('*', { count: 'exact', head: true });

      // Total messages
      const { count: totalMessages } = await supabase
        .from('lexia_messages')
        .select('*', { count: 'exact', head: true });

      // Today's conversations
      const { count: conversationsToday } = await supabase
        .from('lexia_conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay(new Date()).toISOString());

      // This week's conversations
      const { count: conversationsThisWeek } = await supabase
        .from('lexia_conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', subDays(new Date(), 7).toISOString());

      // Average satisfaction (not available in current schema)
      const avgSatisfaction = 0;

      setStats({
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        avgMessagesPerConversation: totalConversations ? Math.round((totalMessages || 0) / totalConversations) : 0,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        conversationsToday: conversationsToday || 0,
        conversationsThisWeek: conversationsThisWeek || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('lexia_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleViewConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);
    setDialogOpen(true);
  };

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      stats,
      conversations: conversations.map(c => ({
        id: c.id,
        visitorName: c.visitor_name,
        visitorEmail: c.visitor_email,
        startedAt: c.started_at,
        endedAt: c.ended_at,
        summary: c.summary,
        satisfaction: c.satisfaction_rating,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexia-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.visitor_name?.toLowerCase().includes(query) ||
      c.visitor_email?.toLowerCase().includes(query) ||
      c.summary?.toLowerCase().includes(query) ||
      c.session_id.toLowerCase().includes(query)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              Conversations LexIA
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez et analysez les conversations de l'assistant virtuel
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchConversations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Conversations</p>
                  <p className="text-3xl font-bold">{stats.totalConversations}</p>
                </div>
                <MessageSquare className="h-10 w-10 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                  <p className="text-3xl font-bold">{stats.conversationsToday}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Messages Total</p>
                  <p className="text-3xl font-bold">{stats.totalMessages}</p>
                </div>
                <BarChart3 className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Satisfaction Moy.</p>
                  <p className="text-3xl font-bold">{stats.avgSatisfaction}/5</p>
                </div>
                <Star className="h-10 w-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email, résumé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des conversations</CardTitle>
            <CardDescription>
              {filteredConversations.length} conversation(s) trouvée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune conversation trouvée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {conversation.visitor_name || 'Visiteur anonyme'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {conversation.visitor_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {conversation.visitor_email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(conversation.created_at), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(conversation.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {conversation.satisfaction_rating && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          {conversation.satisfaction_rating}/5
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewConversation(conversation)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Conversation avec {selectedConversation?.visitor_name || 'Visiteur'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedConversation && (
              <div className="space-y-4">
                {/* Conversation Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    {selectedConversation.visitor_email || 'Non renseigné'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>{' '}
                    {format(new Date(selectedConversation.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </div>
                  {selectedConversation.summary && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Résumé:</span>{' '}
                      {selectedConversation.summary}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'assistant' ? '' : 'flex-row-reverse'}`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'assistant' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {message.role === 'assistant' ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div className={`rounded-lg p-3 max-w-[80%] ${
                          message.role === 'assistant'
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default LexIAConversations;
