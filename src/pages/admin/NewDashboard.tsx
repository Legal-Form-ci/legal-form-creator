import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Briefcase, 
  CreditCard, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  MessageSquare
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalCompanies: number;
  totalServices: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRequests: number;
  completedRequests: number;
  thisMonthCompanies: number;
  lastMonthCompanies: number;
}

interface RecentActivity {
  id: string;
  type: 'company' | 'service' | 'payment' | 'message';
  title: string;
  description: string;
  time: string;
  status?: string;
}

const NewDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    totalServices: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRequests: 0,
    completedRequests: 0,
    thisMonthCompanies: 0,
    lastMonthCompanies: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && user && userRole === 'admin') {
      fetchStats();
    }
  }, [user, userRole, loading]);

  const fetchStats = async () => {
    try {
      // Fetch company requests
      const { data: companies } = await supabase
        .from('company_requests')
        .select('*');

      // Fetch service requests
      const { data: services } = await supabase
        .from('service_requests')
        .select('*');

      const allRequests = [...(companies || []), ...(services || [])];
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const thisYear = now.getFullYear();

      const thisMonthCompanies = (companies || []).filter(c => {
        const date = new Date(c.created_at);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).length;

      const lastMonthCompanies = (companies || []).filter(c => {
        const date = new Date(c.created_at);
        return date.getMonth() === lastMonth && date.getFullYear() === (lastMonth === 11 ? thisYear - 1 : thisYear);
      }).length;

      setStats({
        totalCompanies: companies?.length || 0,
        totalServices: services?.length || 0,
        totalRevenue: allRequests.reduce((sum, r) => sum + (r.estimated_price || 0), 0),
        paidRevenue: allRequests.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + (r.estimated_price || 0), 0),
        pendingRequests: allRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
        completedRequests: allRequests.filter(r => r.status === 'completed').length,
        thisMonthCompanies,
        lastMonthCompanies,
      });

      // Recent activities
      const activities: RecentActivity[] = (companies || []).slice(0, 5).map(c => ({
        id: c.id,
        type: 'company' as const,
        title: c.company_name || 'Création d\'entreprise',
        description: `${c.structure_type?.toUpperCase()} - ${c.contact_name}`,
        time: new Date(c.created_at).toLocaleDateString('fr-FR'),
        status: c.status,
      }));

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Build chart data from real DB data
  const [chartData, setChartData] = useState<{name: string; companies: number; services: number}[]>([]);
  const [pieData, setPieData] = useState<{name: string; value: number; color: string}[]>([]);

  useEffect(() => {
    if (!loadingData) {
      buildChartData();
    }
  }, [loadingData, recentActivities]);

  const buildChartData = async () => {
    try {
      const { data: companies } = await supabase.from('company_requests').select('created_at, structure_type');
      const { data: services } = await supabase.from('service_requests').select('created_at');
      
      const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Jul','Aoû','Sep','Oct','Nov','Déc'];
      const now = new Date();
      const last6 = Array.from({length: 6}, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return { month: d.getMonth(), year: d.getFullYear(), name: months[d.getMonth()] };
      });

      const cData = last6.map(m => ({
        name: m.name,
        companies: (companies || []).filter(c => { const d = new Date(c.created_at); return d.getMonth() === m.month && d.getFullYear() === m.year; }).length,
        services: (services || []).filter(s => { const d = new Date(s.created_at); return d.getMonth() === m.month && d.getFullYear() === m.year; }).length,
      }));
      setChartData(cData);

      // Pie: group by structure_type
      const typeCounts: Record<string, number> = {};
      (companies || []).forEach(c => {
        const t = (c.structure_type || 'autre').toUpperCase();
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
      const colors = ['#0891b2', '#0d9488', '#059669', '#6366f1', '#f59e0b', '#ef4444'];
      const pData = Object.entries(typeCounts).map(([name, value], i) => ({
        name, value, color: colors[i % colors.length]
      }));
      setPieData(pData.length > 0 ? pData : [{ name: 'Aucune', value: 0, color: '#94a3b8' }]);
    } catch (e) {
      console.error('Chart data error:', e);
    }
  };

  const getGrowthPercentage = () => {
    if (stats.lastMonthCompanies === 0) return stats.thisMonthCompanies > 0 ? 100 : 0;
    return Math.round(((stats.thisMonthCompanies - stats.lastMonthCompanies) / stats.lastMonthCompanies) * 100);
  };

  const growth = getGrowthPercentage();

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
          <p className="text-slate-400 mt-1">Vue d'ensemble de l'activité Legal Form</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Créations d'entreprise</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalCompanies}</p>
                  <div className="flex items-center mt-2 text-sm">
                    {growth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={growth >= 0 ? "text-green-500" : "text-red-500"}>
                      {Math.abs(growth)}%
                    </span>
                    <span className="text-slate-400 ml-1">ce mois</span>
                  </div>
                </div>
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Services additionnels</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalServices}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Briefcase className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Revenus encaissés</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.paidRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">FCFA</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <CreditCard className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Demandes en attente</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.pendingRequests}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Évolution des demandes</CardTitle>
              <CardDescription className="text-slate-400">Créations vs Services par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Bar dataKey="companies" fill="#0891b2" name="Créations" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="services" fill="#8b5cf6" name="Services" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Répartition par type</CardTitle>
              <CardDescription className="text-slate-400">Types d'entreprises créées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-slate-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Activités récentes</CardTitle>
              <CardDescription className="text-slate-400">Dernières demandes reçues</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/companies')} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Aucune activité récente</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        {activity.type === 'company' && <Building2 className="h-5 w-5 text-primary" />}
                        {activity.type === 'service' && <Briefcase className="h-5 w-5 text-purple-500" />}
                        {activity.type === 'payment' && <CreditCard className="h-5 w-5 text-green-500" />}
                        {activity.type === 'message' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-white">{activity.title}</p>
                        <p className="text-sm text-slate-400">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={
                        activity.status === 'completed' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' :
                        activity.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-500'
                      }>
                        {activity.status === 'completed' ? 'Terminé' :
                         activity.status === 'pending' ? 'En attente' :
                         activity.status === 'in_progress' ? 'En cours' : activity.status}
                      </Badge>
                      <span className="text-sm text-slate-400">{activity.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default NewDashboard;
