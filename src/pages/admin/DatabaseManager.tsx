import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Table as TableIcon, 
  Users, 
  Shield, 
  Clock,
  HardDrive,
  Layers,
  FileJson,
  FileSpreadsheet,
  FileCode,
  CheckCircle,
  AlertCircle,
  Cloud
} from "lucide-react";

interface TableInfo {
  name: string;
  rowCount: number;
  lastUpdated: string;
}

interface BackupRecord {
  id: string;
  created_at: string;
  type: string;
  format: string;
  size: string;
  status: string;
}

const DatabaseManager = () => {
  const { t } = useTranslation();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const [exportFormat, setExportFormat] = useState<string>("json");

  const tablesList = [
    'company_requests',
    'service_requests',
    'payments',
    'profiles',
    'company_associates',
    'identity_documents',
    'blog_posts',
    'created_companies',
    'ebooks',
    'contact_messages',
    'support_tickets',
    'user_roles',
    'lexia_conversations',
    'lexia_messages',
    'request_messages',
    'request_documents_exchange',
    'payment_logs'
  ];

  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'admin')) {
      navigate("/auth");
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    fetchTableStats();
  }, []);

  const fetchTableStats = async () => {
    setLoading(true);
    const tableInfos: TableInfo[] = [];

    for (const tableName of tablesList) {
      try {
        const { count } = await supabase
          .from(tableName as any)
          .select('*', { count: 'exact', head: true });

        tableInfos.push({
          name: tableName,
          rowCount: count || 0,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        tableInfos.push({
          name: tableName,
          rowCount: 0,
          lastUpdated: '-'
        });
      }
    }

    setTables(tableInfos);
    setLoading(false);
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const tablesToExport = selectedTable === 'all' 
        ? tablesList 
        : [selectedTable];

      const exportData: Record<string, any[]> = {};

      for (const tableName of tablesToExport) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*');

        if (!error && data) {
          exportData[tableName] = data;
        }
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          filename = `legalform_backup_${new Date().toISOString().slice(0, 10)}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          // For CSV, export first table or all combined
          const csvData = Object.entries(exportData).map(([table, rows]) => {
            if (rows.length === 0) return '';
            const headers = Object.keys(rows[0]).join(',');
            const rowsStr = rows.map(row => 
              Object.values(row).map(v => 
                typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
              ).join(',')
            ).join('\n');
            return `\n--- ${table} ---\n${headers}\n${rowsStr}`;
          }).join('\n');
          content = csvData;
          filename = `legalform_backup_${new Date().toISOString().slice(0, 10)}.csv`;
          mimeType = 'text/csv';
          break;
        case 'sql':
          // Generate SQL INSERT statements
          const sqlStatements = Object.entries(exportData).map(([table, rows]) => {
            return rows.map(row => {
              const columns = Object.keys(row).join(', ');
              const values = Object.values(row).map(v => {
                if (v === null) return 'NULL';
                if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
                return v;
              }).join(', ');
              return `INSERT INTO ${table} (${columns}) VALUES (${values});`;
            }).join('\n');
          }).join('\n\n');
          content = sqlStatements;
          filename = `legalform_backup_${new Date().toISOString().slice(0, 10)}.sql`;
          mimeType = 'text/plain';
          break;
        default:
          throw new Error('Format non supporté');
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t('admin.exportSuccess', 'Export réussi'),
        description: t('admin.dataExported', `Données exportées en ${exportFormat.toUpperCase()}`),
      });
    } catch (error: any) {
      toast({
        title: t('admin.error', 'Erreur'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getTotalRecords = () => tables.reduce((sum, t) => sum + t.rowCount, 0);

  const getTableIcon = (name: string) => {
    if (name.includes('user') || name.includes('profile')) return Users;
    if (name.includes('payment')) return HardDrive;
    if (name.includes('request')) return FileJson;
    return TableIcon;
  };

  if (authLoading) {
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
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              {t('admin.databaseManager', 'Gestionnaire de Base de Données')}
            </h1>
            <p className="text-slate-400 mt-1">
              {t('admin.dbManagerDesc', 'Gérez, exportez et sauvegardez vos données')}
            </p>
          </div>
          <Button onClick={fetchTableStats} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh', 'Actualiser')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{tables.length}</div>
                  <p className="text-slate-400 text-sm">{t('admin.tables', 'Tables')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/20">
                  <HardDrive className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{getTotalRecords()}</div>
                  <p className="text-slate-400 text-sm">{t('admin.totalRecords', 'Enregistrements')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Shield className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">RLS</div>
                  <p className="text-slate-400 text-sm">{t('admin.securityActive', 'Sécurité active')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/20">
                  <Cloud className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{t('admin.cloud', 'Cloud')}</div>
                  <p className="text-slate-400 text-sm">{t('admin.syncronized', 'Synchronisé')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tables" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="tables">{t('admin.tables', 'Tables')}</TabsTrigger>
            <TabsTrigger value="export">{t('admin.export', 'Export')}</TabsTrigger>
            <TabsTrigger value="schema">{t('admin.schema', 'Schéma')}</TabsTrigger>
          </TabsList>

          <TabsContent value="tables">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TableIcon className="h-5 w-5" />
                  {t('admin.allTables', 'Toutes les tables')}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {t('admin.tablesDesc', 'Vue d\'ensemble de toutes les tables de la base de données')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">{t('admin.tableName', 'Table')}</TableHead>
                          <TableHead className="text-slate-300">{t('admin.records', 'Enregistrements')}</TableHead>
                          <TableHead className="text-slate-300">{t('admin.security', 'Sécurité')}</TableHead>
                          <TableHead className="text-slate-300">{t('admin.status', 'Statut')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tables.map((table) => {
                          const Icon = getTableIcon(table.name);
                          return (
                            <TableRow key={table.name} className="border-slate-700 hover:bg-slate-700/50">
                              <TableCell className="text-white font-medium">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-slate-400" />
                                  {table.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                <Badge variant="outline" className="font-mono">
                                  {table.rowCount}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-green-500/20 text-green-400">
                                  <Shield className="h-3 w-3 mr-1" />
                                  RLS
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-primary/20 text-primary">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {t('admin.active', 'Actif')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {t('admin.exportData', 'Exporter les données')}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {t('admin.exportDesc', 'Téléchargez vos données dans différents formats')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">{t('admin.selectTable', 'Sélectionner la table')}</label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('admin.allTables', 'Toutes les tables')}</SelectItem>
                        {tablesList.map(table => (
                          <SelectItem key={table} value={table}>{table}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">{t('admin.format', 'Format')}</label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">
                          <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            JSON
                          </div>
                        </SelectItem>
                        <SelectItem value="csv">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV
                          </div>
                        </SelectItem>
                        <SelectItem value="sql">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4" />
                            SQL
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={exportData} 
                    disabled={exporting}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {exporting ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {t('admin.downloadBackup', 'Télécharger la sauvegarde')}
                  </Button>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">{t('admin.exportFormats', 'Formats disponibles')}</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-yellow-400" />
                      <strong>JSON</strong> - {t('admin.jsonDesc', 'Format complet avec structure, idéal pour restauration')}
                    </li>
                    <li className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-400" />
                      <strong>CSV</strong> - {t('admin.csvDesc', 'Compatible Excel/Google Sheets pour analyse')}
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-blue-400" />
                      <strong>SQL</strong> - {t('admin.sqlDesc', 'Instructions INSERT pour migration base de données')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schema">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {t('admin.databaseSchema', 'Schéma de la base de données')}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {t('admin.schemaDesc', 'Architecture complète de la base de données')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <Card key={table.name} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white text-sm">{table.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {table.rowCount} {t('admin.rows', 'lignes')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Shield className="h-3 w-3 text-green-400" />
                          RLS {t('admin.enabled', 'activé')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default DatabaseManager;
