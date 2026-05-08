import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { exportPaymentsToCSV } from "@/utils/exportUtils";
import AdminLayout from "./AdminLayout";
import { ArrowLeft, CreditCard, DollarSign, TrendingUp, Clock, FileText, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface PaymentData {
  id: string;
  tracking_number: string;
  company_name: string;
  contact_name: string;
  estimated_price: number;
  status: string;
  payment_status?: string;
  created_at: string;
  email: string;
  phone: string;
  type: 'company' | 'service';
  service_type?: string;
}

const COLORS = ['#0D9488', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981'];

const PaymentsDashboard = () => {
  const { t } = useTranslation();
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userRole !== 'admin') {
        navigate("/client/dashboard");
      }
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchPayments();
    }
  }, [user, userRole]);

  const fetchPayments = async () => {
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('company_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyError) throw companyError;

      const { data: serviceData, error: serviceError } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (serviceError) throw serviceError;

      const combinedData = [
        ...(companyData || []).map(r => ({ ...r, type: 'company' as const })),
        ...(serviceData || []).map(r => ({ ...r, type: 'service' as const }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPayments(combinedData as any);
      setLoadingPayments(false);
    } catch (error) {
      toast({
        title: t('admin.error', 'Erreur'),
        description: t('admin.loadPaymentsError', 'Impossible de charger les paiements'),
        variant: "destructive",
      });
      setLoadingPayments(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'payment_confirmed':
      case 'completed':
        return 'bg-green-500';
      case 'payment_pending':
      case 'pending':
        return 'bg-yellow-500';
      case 'payment_failed':
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
      case 'payment_confirmed':
        return t('admin.paid', 'Payé');
      case 'payment_pending':
        return t('admin.paymentPending', 'En attente de paiement');
      case 'payment_failed':
      case 'failed':
        return t('admin.paymentFailed', 'Échec du paiement');
      case 'pending':
        return t('admin.notPaid', 'Non payé');
      case 'completed':
        return t('admin.completedPaid', 'Terminé (Payé)');
      default:
        return status;
    }
  };

  const calculateStats = () => {
    const total = payments.reduce((sum, p) => sum + (p.estimated_price || 0), 0);
    const paid = payments
      .filter(p => p.payment_status === 'approved' || p.status === 'completed')
      .reduce((sum, p) => sum + (p.estimated_price || 0), 0);
    const pending = payments
      .filter(p => !p.payment_status || p.payment_status === 'pending')
      .reduce((sum, p) => sum + (p.estimated_price || 0), 0);
    
    return { total, paid, pending, count: payments.length };
  };

  // Calculate monthly revenue data for charts
  const getMonthlyRevenueData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = months.map((month, index) => {
      const monthPayments = payments.filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === index && date.getFullYear() === new Date().getFullYear();
      });
      
      const revenue = monthPayments
        .filter(p => p.payment_status === 'approved')
        .reduce((sum, p) => sum + (p.estimated_price || 0), 0);
      
      const pending = monthPayments
        .filter(p => !p.payment_status || p.payment_status === 'pending')
        .reduce((sum, p) => sum + (p.estimated_price || 0), 0);

      return { 
        month, 
        revenue: revenue / 1000, // En milliers de FCFA
        pending: pending / 1000,
        total: (revenue + pending) / 1000
      };
    });
    return monthlyData;
  };

  // Calculate payment status distribution for pie chart
  const getPaymentDistribution = () => {
    const approved = payments.filter(p => p.payment_status === 'approved').length;
    const pending = payments.filter(p => !p.payment_status || p.payment_status === 'pending').length;
    const failed = payments.filter(p => p.payment_status === 'failed').length;
    
    return [
      { name: t('admin.paid', 'Payé'), value: approved, color: '#10B981' },
      { name: t('admin.notPaid', 'Non payé'), value: pending, color: '#F59E0B' },
      { name: t('admin.paymentFailed', 'Échoué'), value: failed, color: '#EF4444' },
    ].filter(item => item.value > 0);
  };

  // Calculate request type distribution
  const getRequestTypeDistribution = () => {
    const company = payments.filter(p => p.type === 'company').length;
    const service = payments.filter(p => p.type === 'service').length;
    
    return [
      { name: t('admin.companyRequests', 'Entreprises'), value: company, color: '#0D9488' },
      { name: t('admin.serviceRequests', 'Services'), value: service, color: '#8B5CF6' },
    ];
  };

  const stats = calculateStats();
  const monthlyData = getMonthlyRevenueData();
  const paymentDistribution = getPaymentDistribution();
  const requestTypeDistribution = getRequestTypeDistribution();

  const generateInvoice = (payment: PaymentData) => {
    navigate(`/admin/invoices?requestId=${payment.id}&type=${payment.type}`);
  };

  if (loading || loadingPayments) {
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t('admin.paymentsManagement', 'Gestion des Paiements')}</h1>
            <p className="text-slate-400 mt-1">{t('admin.paymentsTracking', 'Suivi des paiements et transactions')}</p>
          </div>
          <Button onClick={() => exportPaymentsToCSV(payments)} className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            {t('admin.exportCSV', 'Exporter CSV')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{t('admin.totalTransactions', 'Total Transactions')}</CardTitle>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.count}</div>
              <p className="text-xs text-slate-400">{t('admin.allRequests', 'Toutes les demandes')}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{t('admin.totalAmount', 'Montant Total')}</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()} FCFA</div>
              <p className="text-xs text-slate-400">{t('admin.totalTransactionsAmount', 'Total des transactions')}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{t('admin.paid', 'Payé')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.paid.toLocaleString()} FCFA</div>
              <p className="text-xs text-slate-400">{t('admin.confirmedPayments', 'Paiements confirmés')}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{t('admin.pending', 'En attente')}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pending.toLocaleString()} FCFA</div>
              <p className="text-xs text-slate-400">{t('admin.pendingPayments', 'Paiements en attente')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{t('admin.revenueEvolution', 'Évolution des revenus')}</CardTitle>
              <CardDescription className="text-slate-400">{t('admin.monthlyRevenueInThousands', 'Revenus mensuels en milliers de FCFA')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name={t('admin.paid', 'Payé')} fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name={t('admin.pending', 'En attente')} fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Distribution Pie Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{t('admin.paymentDistribution', 'Répartition des paiements')}</CardTitle>
              <CardDescription className="text-slate-400">{t('admin.byPaymentStatus', 'Par statut de paiement')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart for Trend */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{t('admin.revenueTrend', 'Tendance des revenus')}</CardTitle>
              <CardDescription className="text-slate-400">{t('admin.monthlyEvolution', 'Évolution mensuelle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total" name={t('admin.total', 'Total')} stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488' }} />
                    <Line type="monotone" dataKey="revenue" name={t('admin.paid', 'Payé')} stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Request Type Distribution */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{t('admin.requestTypeDistribution', 'Types de demandes')}</CardTitle>
              <CardDescription className="text-slate-400">{t('admin.companyVsService', 'Entreprises vs Services')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={requestTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {requestTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t('admin.paymentsList', 'Liste des Paiements')}</CardTitle>
            <CardDescription className="text-slate-400">{t('admin.paymentsOverview', "Vue d'ensemble de tous les paiements et leur statut")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">{t('admin.trackingNumber', 'N° Suivi')}</TableHead>
                    <TableHead className="text-slate-300">{t('admin.company', 'Entreprise')}</TableHead>
                    <TableHead className="text-slate-300">{t('admin.contact', 'Contact')}</TableHead>
                    <TableHead className="text-slate-300">{t('admin.amount', 'Montant')}</TableHead>
                    <TableHead className="text-slate-300">{t('admin.status', 'Statut')}</TableHead>
                    <TableHead className="text-slate-300">{t('admin.date', 'Date')}</TableHead>
                    <TableHead className="text-slate-300">{t('admin.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={`${payment.type}-${payment.id}`} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="font-medium text-white">
                        {payment.tracking_number || payment.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-white">
                        {payment.type === 'company' 
                          ? (payment.company_name || 'Sans nom')
                          : (payment.service_type || 'Service')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-white">{payment.contact_name}</div>
                          <div className="text-slate-400">{payment.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-white">
                        {payment.estimated_price?.toLocaleString() || 0} FCFA
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(payment.payment_status || payment.status)}>
                          {getPaymentStatusLabel(payment.payment_status || payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {(!payment.payment_status || payment.payment_status === 'pending') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => generateInvoice(payment)}
                            className="text-primary border-primary hover:bg-primary hover:text-white"
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            {t('admin.generateInvoice', 'Facture')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PaymentsDashboard;
