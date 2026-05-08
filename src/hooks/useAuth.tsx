import { useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Safe navigate hook that doesn't crash outside Router
const useSafeNavigate = () => {
  try {
    return useNavigate();
  } catch {
    return (path: string, options?: any) => {
      window.location.href = path;
    };
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useSafeNavigate();
  const { toast } = useToast();
  const isNavigating = useRef(false);

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return 'client';
      }
      
      return data?.role || 'client';
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return 'client';
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUserRole(role);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const redirectUrl = 'https://www.legalform.ci/auth/callback';
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
          }
        }
      });
      
      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('User already registered')) {
          errorMessage = "Un compte existe déjà avec cet email. Veuillez vous connecter.";
        } else if (error.message.includes('Password')) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Veuillez entrer une adresse email valide.";
        }
        
        toast({
          title: "Erreur d'inscription",
          description: errorMessage,
          variant: "destructive",
        });
        return { error };
      }
      
      if (data.user && data.session) {
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          full_name: fullName,
          phone: phone,
          email: email,
        }, { onConflict: 'user_id' });

        await supabase.from('user_roles').upsert({
          user_id: data.user.id,
          role: 'client',
        }, { onConflict: 'user_id' });

        setUserRole('client');

        try {
          await supabase.functions.invoke('send-notification', {
            body: { userId: data.user.id, type: 'signup' }
          });
        } catch (e) {
          console.error('Notification error:', e);
        }
        
        toast({
          title: "Inscription réussie",
          description: "Bienvenue sur Legal Form SARL !",
        });

        navigate('/client/dashboard', { replace: true });
      } else if (data.user) {
        toast({
          title: "✅ Inscription réussie",
          description: "Veuillez confirmer votre adresse email pour activer votre compte et accéder à votre espace sécurisé.",
        });
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('SignUp error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'inscription. Vérifiez votre connexion internet.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (isNavigating.current) return { error: new Error('Already navigating') };
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email ou mot de passe incorrect.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter.";
        }
        
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive",
        });
        return { error };
      }
      
      if (data.user) {
        isNavigating.current = true;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!profile) {
          await supabase.from('profiles').insert({
            user_id: data.user.id,
            full_name: data.user.user_metadata?.full_name || '',
            phone: data.user.user_metadata?.phone || '',
            email: data.user.email || '',
          });
        }

        let { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!roleData) {
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: 'client',
          });
          roleData = { role: 'client' };
        }
        
        const role = roleData?.role || 'client';
        setUserRole(role);
        
        toast({
          title: "Connexion réussie",
          description: "Bienvenue !",
        });
        
        if (role === 'admin' || role === 'team') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/client/dashboard', { replace: true });
        }
        
        setTimeout(() => { isNavigating.current = false; }, 2000);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('SignIn error:', error);
      isNavigating.current = false;
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion. Vérifiez votre connexion internet.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      setUser(null);
      setSession(null);
      setUserRole(null);
      isNavigating.current = false;
      
      toast({
        title: "Déconnexion",
        description: "À bientôt !",
      });
      
      navigate("/");
    } catch (error) {
      console.error('SignOut error:', error);
    }
  };

  return {
    user,
    session,
    loading,
    userRole,
    signUp,
    signIn,
    signOut,
  };
};
