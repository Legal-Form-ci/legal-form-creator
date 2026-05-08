import { useState } from 'react';
import { Bell, X, Check, Building2, CreditCard, MessageSquare, Mail, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'company' | 'service' | 'payment' | 'ticket' | 'message';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'company':
      return Building2;
    case 'service':
      return Briefcase;
    case 'payment':
      return CreditCard;
    case 'ticket':
      return MessageSquare;
    case 'message':
      return Mail;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'company':
      return 'text-blue-400 bg-blue-500/20';
    case 'service':
      return 'text-purple-400 bg-purple-500/20';
    case 'payment':
      return 'text-green-400 bg-green-500/20';
    case 'ticket':
      return 'text-orange-400 bg-orange-500/20';
    case 'message':
      return 'text-cyan-400 bg-cyan-500/20';
    default:
      return 'text-slate-400 bg-slate-500/20';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
};

export const NotificationPanel = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear
}: NotificationPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Notification Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-slate-300 hover:text-white hover:bg-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">
                    {unreadCount} nouvelles
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-400 hover:text-white"
                      onClick={onMarkAllAsRead}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Tout lire
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-400 hover:text-white"
                      onClick={onClear}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Effacer
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Notification List */}
            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-slate-700/50 transition-colors cursor-pointer",
                          !notification.read && "bg-slate-700/30"
                        )}
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className={cn("p-2 rounded-lg flex-shrink-0", colorClass)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                "text-sm",
                                !notification.read ? "text-white font-medium" : "text-slate-300"
                              )}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {notification.description}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};
