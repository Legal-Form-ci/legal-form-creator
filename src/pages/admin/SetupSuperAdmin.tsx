import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SetupSuperAdmin() {
  const [isCreating, setIsCreating] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingAdmin();
  }, []);

  const checkExistingAdmin = async () => {
    // Edge function handles security - just check if user is authenticated as admin
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Vous devez être connecté en tant qu\'admin');
        navigate('/auth');
        return;
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setChecking(false);
    }
  };

  const [email, setEmail] = useState('innocentkoffi1@gmail.com');
  const [password, setPassword] = useState('@Massa29012020');
  const [fullName, setFullName] = useState('KOFFI Inocent');
  const [phone, setPhone] = useState('+2250759566087');
  const [role, setRole] = useState<'admin' | 'team' | 'client'>('admin');

  const createSuperAdmin = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: { email, password, full_name: fullName, phone, role }
      });

      if (error) throw error;

      // Create profile
      if (data?.email) {
        toast.success(`Compte ${role} créé avec succès pour ${email}`);
      }
      
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setIsCreating(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg border border-border">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Créer un compte utilisateur</h1>
          <p className="text-muted-foreground text-sm">
            Administration des comptes Legal Form
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label>Nom complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Mot de passe</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v: 'admin' | 'team' | 'client') => setRole(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Super Admin</SelectItem>
                <SelectItem value="team">Équipe</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={createSuperAdmin} disabled={isCreating} className="w-full" size="lg">
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            `Créer le compte ${role}`
          )}
        </Button>
      </div>
    </div>
  );
}
