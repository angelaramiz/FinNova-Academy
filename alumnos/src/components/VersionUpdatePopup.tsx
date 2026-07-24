import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface Props { theme: Theme; }

export default function VersionUpdatePopup({ theme }: Props) {
  const colors = themeColors[theme];
  const [show, setShow] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('https://finnova-back.onrender.com/api/health', { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (data.version) {
          const stored = localStorage.getItem('app_version');
          if (stored && stored !== data.version) {
            setRemoteVersion(data.version);
            setShow(true);
            localStorage.setItem('app_version', data.version);
          }
        }
      } catch { /* backend no disponible */ }
    };
    check();
  }, []);

  async function handleUpdate() {
    try {
      // Limpiar todas las caches del navegador
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      // Desregistrar Service Workers antiguos
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
      }
      // Recargar limpio
      window.location.href = window.location.origin;
    } catch { window.location.reload(); }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="max-w-sm w-full mx-4 p-6 rounded-2xl border-2 shadow-2xl animate-slide-in" style={{
        borderColor: colors.primary,
        background: theme === 'dark' ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)',
        boxShadow: `0 0 40px ${colors.primary}40`,
      }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl" style={{
            background: `${colors.primary}20`,
            border: `2px solid ${colors.primary}`,
          }}>🚀</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: colors.text }}>Nueva versión disponible</h2>
          <p className="text-xs mb-1" style={{ color: colors.textMuted }}>
            Se ha detectado una versión actualizada del sistema.
          </p>
          <p className="text-xs font-mono mb-5" style={{ color: colors.primary }}>
            v{remoteVersion}
          </p>
          <button onClick={handleUpdate}
            className="w-full py-3 rounded-xl border-2 text-sm font-bold cursor-pointer hover:opacity-85 transition"
            style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632', boxShadow: `3px 3px 0px 0px ${colors.border}` }}
          >⚡ Actualizar ahora</button>
        </div>
      </div>
    </div>
  );
}
