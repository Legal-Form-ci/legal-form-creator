import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'company' | 'service' | 'payment' | 'ticket' | 'message';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

export const useRealtimeNotifications = (isAdmin: boolean) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to company_requests changes
    const companyChannel = supabase
      .channel('company-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'company_requests'
        },
        (payload) => {
          console.log('New company request:', payload);
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'company',
            title: 'Nouvelle demande de création',
            description: `${payload.new.company_name || 'Entreprise'} - ${payload.new.structure_type?.toUpperCase()}`,
            timestamp: new Date(),
            read: false
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.success('Nouvelle demande de création', {
            description: newNotification.description
          });
        }
      )
      .subscribe();

    // Subscribe to service_requests changes
    const serviceChannel = supabase
      .channel('service-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests'
        },
        (payload) => {
          console.log('New service request:', payload);
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'service',
            title: 'Nouvelle demande de service',
            description: `${payload.new.service_type} - ${payload.new.contact_name || 'Client'}`,
            timestamp: new Date(),
            read: false
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.success('Nouvelle demande de service', {
            description: newNotification.description
          });
        }
      )
      .subscribe();

    // Subscribe to payments changes
    const paymentChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Payment update:', payload);
          if (payload.eventType === 'INSERT' || 
              (payload.eventType === 'UPDATE' && payload.new.status === 'approved')) {
            const isNew = payload.eventType === 'INSERT';
            const isPaid = payload.new.status === 'approved';
            
            const newNotification: Notification = {
              id: payload.new.id,
              type: 'payment',
              title: isPaid ? 'Paiement reçu' : 'Nouveau paiement initié',
              description: `${payload.new.amount?.toLocaleString()} FCFA - ${payload.new.customer_name || 'Client'}`,
              timestamp: new Date(),
              read: false
            };
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            if (isPaid) {
              toast.success('Paiement reçu !', {
                description: newNotification.description
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to support tickets
    const ticketChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          console.log('New ticket:', payload);
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'ticket',
            title: 'Nouveau ticket support',
            description: payload.new.subject,
            timestamp: new Date(),
            read: false
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info('Nouveau ticket support', {
            description: payload.new.subject
          });
        }
      )
      .subscribe();

    // Subscribe to contact messages
    const messageChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log('New contact message:', payload);
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'message',
            title: 'Nouveau message de contact',
            description: `${payload.new.name} - ${payload.new.subject || 'Sans sujet'}`,
            timestamp: new Date(),
            read: false
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info('Nouveau message de contact', {
            description: newNotification.description
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(companyChannel);
      supabase.removeChannel(serviceChannel);
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [isAdmin]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};
