import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users } from "lucide-react";
import AdminLayout from "./AdminLayout";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  email?: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  team: "Équipe",
  client: "Client",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500",
  team: "bg-blue-500",
  client: "bg-green-500",
};

const TeamManagement = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // Get all user roles with admin or team roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'team'])
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Get profiles for these users
      const userIds = rolesData?.map(r => r.user_id) || [];
      
      if (userIds.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const teamMembers: TeamMember[] = (rolesData || []).map(role => {
        const profile = profilesData?.find(p => p.user_id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role,
          created_at: role.created_at,
          full_name: profile?.full_name || 'Non défini',
          phone: profile?.phone || null,
        };
      });

      setMembers(teamMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'équipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole } as any)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Rôle mis à jour",
      });
      fetchTeamMembers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle",
        variant: "destructive",
      });
    }
  };

  if (loading) {
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Équipe Legal Form</h1>
            <p className="text-slate-400 mt-1">Gérez les membres de l'équipe et leurs permissions</p>
          </div>
        </div>

        {/* Role Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(roleLabels).filter(([role]) => role !== 'client').map(([role, label]) => {
            const count = members.filter(m => m.role === role).length;
            return (
              <Card key={role} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 rounded-full ${roleColors[role]} mx-auto mb-2 flex items-center justify-center`}>
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Members Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membres de l'équipe ({members.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Utilisateurs avec des droits d'administration
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Nom</TableHead>
                    <TableHead className="text-slate-300">Téléphone</TableHead>
                    <TableHead className="text-slate-300">Rôle</TableHead>
                    <TableHead className="text-slate-300">Ajouté le</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                        Aucun membre dans l'équipe
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="font-medium text-white">{member.full_name}</TableCell>
                        <TableCell className="text-slate-300">{member.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[member.role]}>
                            {roleLabels[member.role] || member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(member.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {member.role === 'admin' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateRole(member.user_id, 'team')}
                                className="text-slate-300 hover:text-white"
                              >
                                Rétrograder
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateRole(member.user_id, 'admin')}
                                className="text-slate-300 hover:text-white"
                              >
                                Promouvoir
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
};

export default TeamManagement;
