import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { useEffect } from 'react';

export default function UpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update().catch(() => {});
        }, 30 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      let refreshing = false;
      const handleControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    }
  }, []);

  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      window.location.reload();
    }
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] max-w-sm animate-slide-in">
      <div className="border-2 backdrop-blur-xl rounded-2xl p-4 shadow-2xl flex flex-col gap-3" style={{
        borderColor: '#FFB162',
        background: 'rgba(15,23,42,0.95)',
      }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFB162' }}>
              <RefreshCw size={18} className="animate-spin" style={{ color: '#1B2632' }} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-tight">Actualización Disponible</h4>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                Nueva versión del simulador con mejoras y correcciones.
              </p>
            </div>
          </div>
          <button onClick={() => setNeedRefresh(false)} className="text-gray-500 hover:text-white p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setNeedRefresh(false)}
            className="px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-colors">
            Ignorar
          </button>
          <button onClick={handleUpdate}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all flex items-center gap-1.5 shadow-md"
            style={{ background: '#FFB162', color: '#1B2632' }}>
            <RefreshCw size={12} />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}
