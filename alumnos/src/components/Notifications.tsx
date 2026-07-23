import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

export interface Notification {
  id: string;
  from: string;
  subject: string;
  body: string;
  time: string;
  read: boolean;
  type: 'message' | 'alert' | 'milestone';
}

function getToken() { return localStorage.getItem('supabase_auth_token') || ''; }

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<Notification | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);

  function addNotification(notif: Notification) {
    setNotifications(prev => [notif, ...prev]);
    setToast(notif);
    setTimeout(() => setToast(null), 5000);
  }

  async function checkEvents() {
    try {
      const data = await apiFetch<any>('/api/sim/events/random');
      if (data.event) {
        addNotification({
          id: `evt-${Date.now()}`,
          from: data.event.personaje,
          subject: data.event.title,
          body: data.event.message,
          time: new Date().toISOString(),
          read: false,
          type: 'message',
        });
      }
    } catch { /* ignore */ }
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, toast, inboxOpen, setInboxOpen, unreadCount, addNotification, markAllRead, checkEvents };
}

export function NotificationToast({ notif, theme }: { notif: Notification; theme: Theme }) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';

  return (
    <div className="fixed top-16 right-4 z-[100] pointer-events-none">
      <div className="px-4 py-3 rounded-xl border-2 backdrop-blur-xl animate-slide-in shadow-xl max-w-sm pointer-events-auto" style={{
        borderColor: colors.border, background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
        boxShadow: `4px 4px 0px 0px ${colors.border}`,
      }}>
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: notif.type === 'milestone' ? '#22c55e' : colors.primary, color: '#1B2632' }}>
            {notif.type === 'milestone' ? '🏆' : '💬'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-bold font-mono" style={{ color: colors.primary }}>{notif.from}</span>
              <span className="text-[7px] font-mono" style={{ color: colors.textMuted }}>ahora</span>
            </div>
            <p className="text-[10px] font-bold" style={{ color: colors.text }}>{notif.subject}</p>
            <p className="text-[9px] mt-0.5" style={{ color: colors.textMuted }}>{notif.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationInbox({ theme, onClose, notifications, markAllRead, unreadCount }: {
  theme: Theme; onClose: () => void; notifications: Notification[]; markAllRead: () => void; unreadCount: number;
}) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';

  useEffect(() => { markAllRead(); }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden animate-slide-in" style={{
        borderColor: colors.border, background: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)',
        boxShadow: `6px 6px 0px 0px ${colors.border}`,
      }}>
        <div className="flex items-center justify-between px-5 py-3 border-b-2 shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.primary, color: '#1B2632' }}>📬</div>
            <div>
              <span className="text-sm font-bold" style={{ color: colors.text }}>Bandeja de entrada</span>
              <span className="text-[9px] font-mono ml-2" style={{ color: colors.textMuted }}>{notifications.length} mensajes</span>
            </div>
          </div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded-lg border cursor-pointer" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>✕</button>
        </div>
        <div className="flex-1 overflow-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-3xl mb-3">📭</span>
              <p className="text-xs" style={{ color: colors.text }}>No tienes mensajes</p>
              <p className="text-[9px] mt-1" style={{ color: colors.textMuted }}>Los mensajes del jefe y clientes aparecerán aquí</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {notifications.map(n => (
                <div key={n.id} className="px-5 py-3.5 hover:opacity-80 transition cursor-pointer" style={{ background: n.read ? 'transparent' : colors.primary + '10' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{
                      background: n.type === 'milestone' ? '#22c55e20' : n.type === 'alert' ? '#f59e0b20' : colors.primary + '20',
                      color: n.type === 'milestone' ? '#22c55e' : n.type === 'alert' ? '#f59e0b' : colors.primary,
                      border: `1px solid ${n.type === 'milestone' ? '#22c55e' : n.type === 'alert' ? '#f59e0b' : colors.primary}`,
                    }}>
                      {n.type === 'milestone' ? '🏆' : n.type === 'alert' ? '⚠️' : '💬'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono" style={{ color: colors.primary }}>{n.from}</span>
                        <span className="text-[7px] font-mono" style={{ color: colors.textMuted }}>
                          {new Date(n.time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: colors.text }}>{n.subject}</p>
                      <p className="text-[9px] mt-0.5 line-clamp-2" style={{ color: colors.textMuted }}>{n.body}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: colors.primary }} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
