import React, { useState, useRef, useEffect } from 'react';
import { Bell, Heart, UserPlus, Eye, Info, Check } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

function getRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'agora';
  if (diffMins < 60) return `há ${diffMins}m`;
  if (diffHours < 24) return `há ${diffHours}h`;
  return `há ${diffDays}d`;
}

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'new_follower':
      return <div className="p-2 rounded-full bg-purple-500/20 text-purple-500"><UserPlus size={16} /></div>;
    case 'new_favorite':
      return <div className="p-2 rounded-full bg-pink-500/20 text-pink-500"><Heart size={16} /></div>;
    case 'new_view':
      return <div className="p-2 rounded-full bg-blue-500/20 text-blue-500"><Eye size={16} /></div>;
    case 'system':
    default:
      return <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-500"><Info size={16} /></div>;
  }
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/80 text-foreground transition-colors hover:bg-white shadow-sm"
        aria-label="Notificações"
      >
        <Bell size={20} className="text-foreground" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary font-mono text-[9px] font-bold text-primary-foreground shadow-neon">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 flex w-80 flex-col overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 shadow-2xl backdrop-blur-md sm:w-96">
          <div className="flex items-center justify-between p-4 border-b border-border-soft">
            <h3 className="font-semibold text-foreground text-lg">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex min-h-[44px] min-w-[44px] items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                <Check size={14} />
                Marcar tudo lido
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm font-medium">A carregar...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                Sem notificações por agora 🌟
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                    }}
                    className={`flex w-full gap-3 border-l-2 p-4 text-left transition-colors hover:bg-accent/40 min-h-[44px] ${
                      notification.read 
                        ? 'border-transparent bg-transparent' 
                        : 'border-primary bg-primary/5'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground line-clamp-1">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                        {getRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0 flex items-center justify-center w-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
