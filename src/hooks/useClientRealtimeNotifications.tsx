import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UseClientRealtimeNotificationsProps {
  userId: string | undefined;
  onUpdate: () => void;
}

export const useClientRealtimeNotifications = ({ userId, onUpdate }: UseClientRealtimeNotificationsProps) => {
  const { t } = useTranslation();

  const handlePaymentUpdate = useCallback((payload: any) => {
    console.log('Payment update received:', payload);
    
    if (payload.new.status === 'approved') {
      toast.success(t('notifications.paymentApproved', 'Paiement confirmé !'), {
        description: t('notifications.paymentApprovedDesc', 'Votre paiement a été validé avec succès.')
      });
    } else if (payload.new.status === 'pending') {
      toast.info(t('notifications.paymentPending', 'Paiement en cours de traitement'), {
        description: t('notifications.paymentPendingDesc', 'Votre paiement est en cours de vérification.')
      });
    }
    
    onUpdate();
  }, [t, onUpdate]);

  const handleRequestUpdate = useCallback((payload: any, type: 'company' | 'service') => {
    console.log(`${type} request update received:`, payload);
    
    const statusMessages: Record<string, { title: string; desc: string }> = {
      'in_progress': {
        title: t('notifications.requestInProgress', 'Demande en cours de traitement'),
        desc: t('notifications.requestInProgressDesc', 'Notre équipe traite actuellement votre demande.')
      },
      'completed': {
        title: t('notifications.requestCompleted', 'Demande terminée !'),
        desc: t('notifications.requestCompletedDesc', 'Votre demande a été finalisée avec succès.')
      },
      'rejected': {
        title: t('notifications.requestRejected', 'Demande rejetée'),
        desc: t('notifications.requestRejectedDesc', 'Veuillez consulter les détails pour plus d\'informations.')
      }
    };

    const message = statusMessages[payload.new.status];
    if (message) {
      if (payload.new.status === 'completed') {
        toast.success(message.title, { description: message.desc });
      } else if (payload.new.status === 'rejected') {
        toast.error(message.title, { description: message.desc });
      } else {
        toast.info(message.title, { description: message.desc });
      }
    }

    // Update payment status notification
    if (payload.new.payment_status === 'approved' && payload.old?.payment_status !== 'approved') {
      toast.success(t('notifications.paymentConfirmed', 'Paiement confirmé'), {
        description: t('notifications.paymentConfirmedDesc', 'Le paiement de votre demande a été validé.')
      });
    }
    
    onUpdate();
  }, [t, onUpdate]);

  useEffect(() => {
    if (!userId) return;

    console.log('Setting up realtime subscriptions for user:', userId);

    // Subscribe to company_requests changes for this user
    const companyChannel = supabase
      .channel(`company-requests-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'company_requests',
          filter: `user_id=eq.${userId}`
        },
        (payload) => handleRequestUpdate(payload, 'company')
      )
      .subscribe();

    // Subscribe to service_requests changes for this user
    const serviceChannel = supabase
      .channel(`service-requests-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${userId}`
        },
        (payload) => handleRequestUpdate(payload, 'service')
      )
      .subscribe();

    // Subscribe to payments changes for this user
    const paymentChannel = supabase
      .channel(`payments-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${userId}`
        },
        handlePaymentUpdate
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(companyChannel);
      supabase.removeChannel(serviceChannel);
      supabase.removeChannel(paymentChannel);
    };
  }, [userId, handlePaymentUpdate, handleRequestUpdate]);
};
