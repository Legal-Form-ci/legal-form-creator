import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { TrendingUp, TrendingDown, Building2, Users, CreditCard, FileText, Calendar, MapPin } from "lucide-react";
import AdminLayout from "./AdminLayout";

const Analytics = () => {
  const { user, userRole, loading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalServices: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const [monthlyData, setMonthlyData] = useState<{month: string; companies: number; services: number; revenue: number}[]>([]);
  const [regionData, setRegionData] = useState<{name: string; value: number; color: string}[]>([]);
  const [companyTypeData, setCompanyTypeData] = useState<{type: string; count: number}[]>([]);
  const [statusData, setStatusData] = useState<{name: string; value: number; color: string}[]>([]);

  useEffect(() => {
    if (!loading && user && userRole === 'admin') {
      fetchAnalytics();
    }
  }, [user, userRole, loading]);

  const fetchAnalytics = async () => {
    try {
      const [companiesRes, servicesRes, profilesRes] = await Promise.all([
        supabase.from('company_requests').select('*'),
        supabase.from('service_requests').select('*'),
        supabase.from('profiles').select('id'),
      ]);

      const companies = companiesRes.data || [];
      const services = servicesRes.data || [];

      const totalRevenue = companies
        .filter(c => c.payment_status === 'paid')
        .reduce((sum, c) => sum + (c.estimated_price || 0), 0);

      setStats({
        totalCompanies: companies.length,
        totalServices: services.length,
        totalRevenue,
        totalUsers: profilesRes.data?.length || 0,
      });

      // Build monthly chart from real data
      const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Jul','Aoû','Sep','Oct','Nov','Déc'];
      const now = new Date();
      const last12 = Array.from({length: 12}, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        return { month: d.getMonth(), year: d.getFullYear(), name: months[d.getMonth()] };
      });

      setMonthlyData(last12.map(m => ({
        month: m.name,
        companies: companies.filter(c => { const d = new Date(c.created_at); return d.getMonth() === m.month && d.getFullYear() === m.year; }).length,
        services: services.filter(s => { const d = new Date(s.created_at); return d.getMonth() === m.month && d.getFullYear() === m.year; }).length,
        revenue: companies.filter(c => { const d = new Date(c.created_at); return d.getMonth() === m.month && d.getFullYear() === m.year && c.payment_status === 'paid'; }).reduce((s, c) => s + (c.estimated_price || 0), 0),
      })));

      // Region data from real companies
      const regionCounts: Record<string, number> = {};
      companies.forEach(c => {
        const r = c.region || 'Non précisé';
        regionCounts[r] = (regionCounts[r] || 0) + 1;
      });
      const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4'];
      setRegionData(Object.entries(regionCounts).sort((a,b) => b[1] - a[1]).slice(0, 7).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] })));

      // Company type data
      const typeCounts: Record<string, number> = {};
      companies.forEach(c => {
        const t = (c.structure_type || c.company_type || 'Autre').toUpperCase();
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
      setCompanyTypeData(Object.entries(typeCounts).sort((a,b) => b[1] - a[1]).map(([type, count]) => ({ type, count })));

      // Status data
      const statusCounts: Record<string, number> = {};
      companies.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });
      const statusColors: Record<string, string> = { completed: '#10b981', in_progress: '#f59e0b', pending: '#3b82f6', rejected: '#ef4444' };
      const statusLabels: Record<string, string> = { completed: 'Terminées', in_progress: 'En cours', pending: 'En attente', rejected: 'Annulées' };
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: statusLabels[name] || name, value, color: statusColors[name] || '#6b7280' })));

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' FCFA';
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Statistiques</h1>
          <p className="text-muted-foreground">Vue d'ensemble des performances de la plateforme</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total Entreprises</CardDescription></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalCompanies}</div>
              <div className="flex items-center text-sm text-muted-foreground mt-1"><Building2 className="h-4 w-4 mr-1" />Demandes de création</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Services Additionnels</CardDescription></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalServices}</div>
              <div className="flex items-center text-sm text-muted-foreground mt-1"><FileText className="h-4 w-4 mr-1" />Demandes de services</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Revenus (payés)</CardDescription></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</div>
              <div className="flex items-center text-sm text-muted-foreground mt-1"><CreditCard className="h-4 w-4 mr-1" />Paiements confirmés</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Utilisateurs</CardDescription></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalUsers}</div>
              <div className="flex items-center text-sm text-muted-foreground mt-1"><Users className="h-4 w-4 mr-1" />Comptes inscrits</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Évolution mensuelle</CardTitle><CardDescription>Créations d'entreprises et services (12 derniers mois)</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="companies" fill="hsl(var(--primary))" name="Entreprises" />
                  <Bar dataKey="services" fill="hsl(var(--accent))" name="Services" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Répartition par région</CardTitle></CardHeader>
            <CardContent>
              {regionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={regionData} cx="50%" cy="50%" labelLine={false} label={({name, value}) => `${name} (${value})`} outerRadius={100} dataKey="value">
                      {regionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Types d'entreprises</CardTitle></CardHeader>
            <CardContent>
              {companyTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={companyTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="type" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Nombre" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Statut des demandes</CardTitle></CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({name, value}) => `${name} (${value})`} outerRadius={100} dataKey="value">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
