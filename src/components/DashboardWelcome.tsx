import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface DashboardWelcomeProps {
  userId: string;
}

const DashboardWelcome = ({ userId }: DashboardWelcomeProps) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<{ full_name: string; phone: string | null } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loginTime] = useState(new Date());

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', userId)
        .single();
      
      if (data) setProfile(data);
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Bonjour');
    if (hour < 18) return t('dashboard.goodAfternoon', 'Bon après-midi');
    return t('dashboard.goodEvening', 'Bonsoir');
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary overflow-hidden">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">
                {getGreeting()}, {profile?.full_name || t('dashboard.user', 'Utilisateur')} !
              </h2>
              <p className="text-muted-foreground">
                {t('dashboard.welcomeBack', 'Content de vous revoir sur votre espace')}
              </p>
            </div>
          </div>
          
          <div className="text-right hidden md:block">
            <div className="text-3xl font-mono font-bold text-primary">
              {formatTime(currentTime)}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.loginAt', 'Connecté à')} {formatTime(loginTime)}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardWelcome;