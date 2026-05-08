import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PricingSettings {
  abidjan: number;
  interior: number;
  referral_bonus: number;
}

interface ContactSettings {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
}

interface GeneralSettings {
  site_name: string;
  site_tagline: string;
}

interface SiteSettings {
  pricing: PricingSettings;
  contact: ContactSettings;
  general: GeneralSettings;
}

const DEFAULT_SETTINGS: SiteSettings = {
  pricing: {
    abidjan: 255000,
    interior: 169000,
    referral_bonus: 10000
  },
  contact: {
    phone: '+225 01 71 50 04 73',
    whatsapp: '+225 07 09 67 79 25',
    email: 'contact@legalform.ci',
    address: 'BPM 387, Grand-Bassam, ANCIENNE CIE, Côte d\'Ivoire'
  },
  general: {
    site_name: 'Legal Form',
    site_tagline: 'Créer, gérer et accompagner votre entreprise'
  }
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data && data.length > 0) {
        const newSettings = { ...DEFAULT_SETTINGS };
        data.forEach(item => {
          if (item.key === 'pricing') {
            newSettings.pricing = item.value as unknown as PricingSettings;
          } else if (item.key === 'contact') {
            newSettings.contact = item.value as unknown as ContactSettings;
          } else if (item.key === 'general') {
            newSettings.general = item.value as unknown as GeneralSettings;
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (key: 'pricing' | 'contact' | 'general', value: PricingSettings | ContactSettings | GeneralSettings) => {
    try {
      // First try to update existing
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            value: JSON.parse(JSON.stringify(value)),
            updated_at: new Date().toISOString()
          })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ 
            key, 
            value: JSON.parse(JSON.stringify(value))
          }]);
        if (error) throw error;
      }
      
      setSettings(prev => ({ ...prev, [key]: value }));
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error };
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings
  };
};

// Export a function to get pricing without hook (for server-side or edge functions)
export const getPricing = async (): Promise<PricingSettings> => {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'pricing')
      .single();
    
    if (data?.value) {
      return data.value as unknown as PricingSettings;
    }
  } catch (error) {
    console.error('Error getting pricing:', error);
  }
  
  return DEFAULT_SETTINGS.pricing;
};