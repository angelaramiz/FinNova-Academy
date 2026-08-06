import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {}, removeToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration) {
        const timer = setTimeout(() => removeToast(toast.id), toast.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, removeToast]);

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return { bg: '#065f46', border: '#10b981', text: '#d1fae5' };
      case 'error': return { bg: '#7f1d1d', border: '#ef4444', text: '#fecaca' };
      case 'warning': return { bg: '#78350f', border: '#f59e0b', text: '#fef3c7' };
      case 'info': return { bg: '#1e3a5f', border: '#3b82f6', text: '#dbeafe' };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
        {toasts.map(toast => {
          const colors = getColor(toast.type);
          return (
            <div key={toast.id}
              className="pointer-events-auto px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in cursor-pointer"
              style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
              onClick={() => removeToast(toast.id)}>
              <span className="text-lg shrink-0">{getIcon(toast.type)}</span>
              <span className="text-[12px] font-medium flex-1">{toast.message}</span>
              <span className="text-[10px] opacity-50 shrink-0">✕</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
  });
}
