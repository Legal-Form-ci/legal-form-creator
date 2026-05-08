import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, UserPlus, Shield, User as UserIcon, Search, Users, Copy, Link, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PasswordInput } from '@/components/PasswordInput';
import AdminLayout from './AdminLayout';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email?: string;
  role?: string;
  referral_code?: string | null;
  referral_link?: string | null;
  referral_count?: number | null;
  referral_earnings?: number | null;
  created_at: string;
}

export default function UsersManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'client' as 'admin' | 'client',
  });
  const navigate = useNavigate();
  const { userRole, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && userRole !== 'admin') {
      navigate('/auth');
    }
  }, [userRole, authLoading, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users based on search and role filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.referral_code || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const clientCount = users.filter(u => u.role === 'client').length;
    const recentUsers = users.filter(u => {
      const createdDate = new Date(u.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length;
    
    return { totalUsers, adminCount, clientCount, recentUsers };
  }, [users]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, phone, referral_code, referral_link, referral_count, referral_earnings, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch ALL roles at once for efficiency
      const { data: allRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map((allRoles || []).map(r => [r.user_id, r.role]));

      // Also try to get emails from company_requests for users
      const { data: requestEmails } = await supabase
        .from('company_requests')
        .select('user_id, email')
        .order('created_at', { ascending: false });
      
      const emailsMap = new Map<string, string>();
      (requestEmails || []).forEach(r => {
        if (r.user_id && r.email && !emailsMap.has(r.user_id)) {
          emailsMap.set(r.user_id, r.email);
        }
      });

      const usersWithRoles = (profiles || []).map((profile) => ({
        ...profile,
        role: rolesMap.get(profile.user_id) || 'client',
        email: emailsMap.get(profile.user_id) || '',
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: {
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          phone: newUser.phone,
          role: newUser.role,
        },
      });

      if (error) throw error;

      toast.success('Utilisateur créé avec succès');
      setShowCreateForm(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'client',
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setCreating(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'client') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Rôle mis à jour avec succès');
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papiers`);
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white mb-2">
            Gestion des Utilisateurs
          </h1>
          <p className="text-slate-400">
            Gérez les utilisateurs et leurs accès à la plateforme Legal Form
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <p className="text-xs text-slate-500">comptes enregistrés</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Administrateurs</CardTitle>
              <Shield className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.adminCount}</div>
              <p className="text-xs text-slate-500">avec accès admin</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Clients</CardTitle>
              <UserIcon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.clientCount}</div>
              <p className="text-xs text-slate-500">comptes clients</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Nouveaux (30j)</CardTitle>
              <UserPlus className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.recentUsers}</div>
              <p className="text-xs text-slate-500">ce mois-ci</p>
            </CardContent>
          </Card>
        </div>

        {/* Create User Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Créer un Utilisateur</CardTitle>
                <CardDescription className="text-slate-400">
                  Créez de nouveaux comptes pour l'équipe Legal Form
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant={showCreateForm ? 'outline' : 'default'}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {showCreateForm ? 'Annuler' : 'Nouveau Compte'}
              </Button>
            </div>
          </CardHeader>
          {showCreateForm && (
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">{t('form.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="email@legalform.ci"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">{t('auth.password')} *</Label>
                    <PasswordInput
                      id="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Minimum 6 caractères"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-slate-300">{t('form.name')} *</Label>
                    <Input
                      id="full_name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      placeholder="Prénom Nom"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">{t('form.phone')}</Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      placeholder="+225 XX XX XX XX XX"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-300">Rôle *</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: 'admin' | 'client') =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">
                        <div className="flex items-center">
                          <UserIcon className="mr-2 h-4 w-4" />
                          Client
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Administrateur
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createUser} disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    'Créer le compte'
                  )}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Search and Filters */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher par nom, email, téléphone ou code parrainage..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="admin">Administrateurs</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Utilisateurs ({filteredUsers.length})</CardTitle>
            <CardDescription className="text-slate-400">
              {filteredUsers.length} utilisateur(s) trouvé(s) sur {users.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">{t('form.name')}</TableHead>
                    <TableHead className="text-slate-400">Contact</TableHead>
                    <TableHead className="text-slate-400">Rôle</TableHead>
                    <TableHead className="text-slate-400">Code Parrainage</TableHead>
                    <TableHead className="text-slate-400">Filleuls</TableHead>
                    <TableHead className="text-slate-400">Gains</TableHead>
                    <TableHead className="text-slate-400">Inscription</TableHead>
                    <TableHead className="text-slate-400">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-slate-700">
                        <TableCell className="font-medium text-white">{user.full_name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.phone && (
                              <span className="text-sm text-slate-300">{user.phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-primary' : ''}>
                            {user.role === 'admin' ? 'Admin' : 'Client'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.referral_code ? (
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-700 px-2 py-1 rounded text-xs text-primary font-mono">
                                {user.referral_code}
                              </code>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(user.referral_code!, 'Code')}
                              >
                                <Copy className="h-3 w-3 text-slate-400" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-white font-medium">{user.referral_count || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-accent font-medium">
                            {(user.referral_earnings || 0).toLocaleString()} FCFA
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(value: 'admin' | 'client') =>
                                updateUserRole(user.user_id, value)
                              }
                            >
                              <SelectTrigger className="w-[100px] h-8 bg-slate-700 border-slate-600 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {user.referral_link && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(user.referral_link!, 'Lien de parrainage')}
                                title="Copier le lien de parrainage"
                              >
                                <Link className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}