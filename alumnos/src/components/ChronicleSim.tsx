import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface ChronicleSimProps { theme: Theme; onBack: () => void; }

interface ChronicleEntry {
  sceneId: string;
  fechaSim: string;
  resultado: string;
  npc: string;
  detail: string;
  at?: string;
}

function apiFetch(path: string): Promise<any> {
  const token = localStorage.getItem('supabase_auth_token') || '';
  const isRender = window.location.hostname.includes('onrender.com');
  const baseUrl = (import.meta as any).env?.VITE_API_URL || (isRender ? 'https://finnova-back.onrender.com' : '');
  return fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

// NPC label por id (mismo mapeo que EmailInbox)
const NPC_LABEL: Record<string, string> = {
  lic_gomez: 'Lic. Gómez',
  sandra_mora: 'Ing. Sandra Mora',
  tesoreria: 'Tesorería',
  maria_lopez_rrhh: 'María López (RRHH)',
  cliente_comercial_norte: 'Comercial del Norte',
  proveedor_transportes_express: 'Transportes Express',
  ana_analista: 'Ana García',
};

const RESULT_ICON: Record<string, string> = {
  completada: '✅',
  fallida: '❌',
  arco_cerrado: '🏆',
};

export default function ChronicleSim({ theme, onBack }: ChronicleSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [chronicle, setChronicle] = useState<ChronicleEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/sim/story/chronicle')
      .then(d => {
        if (d?.chronicle) setChronicle(d.chronicle);
        else if (d?.error) setError(d.error);
        else setChronicle([]);
      })
      .catch(() => setChronicle([]));
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📖</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Crónica — Mundo vivo</span>
        <span className="flex-1" />
        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>{chronicle ? chronicle.length : 0} hitos</span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {error && (
          <div className="text-[11px] px-3 py-2 rounded-lg font-mono" style={{ background: '#ef444410', color: '#ef4444' }}>
            Error: {error}
          </div>
        )}

        {chronicle === null ? (
          <div className="space-y-2 animate-pulse">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-14 rounded-xl" style={{ background: colors.cardSecondary }} />
            ))}
          </div>
        ) : chronicle.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📖</div>
            <p className="text-[13px] font-bold font-mono" style={{ color: colors.textMuted }}>Aún no hay hitos registrados</p>
            <p className="text-[11px] font-mono mt-1" style={{ color: colors.textMuted }}>Completa tareas para construir tu crónica laboral</p>
          </div>
        ) : (
          <div className="relative pl-5" style={{ borderLeft: `2px solid ${colors.border}` }}>
            {chronicle.map((h, i) => (
              <div key={i} className="relative mb-4 pl-2">
                <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2" style={{ background: colors.bg, borderColor: h.resultado === 'completada' ? '#22c55e' : h.resultado === 'arco_cerrado' ? '#f59e0b' : '#ef4444' }} />
                <div className="rounded-xl border-2 p-3" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>{RESULT_ICON[h.resultado] || '📌'} {h.sceneId}</span>
                    <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: colors.cardSecondary, color: colors.textMuted }}>{h.fechaSim}</span>
                  </div>
                  <p className="text-[11px] font-mono mb-1" style={{ color: colors.textMuted }}>{h.detail}</p>
                  <p className="text-[9px] font-mono" style={{ color: colors.primary }}>👤 {NPC_LABEL[h.npc] || h.npc} · {h.resultado}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>ChronicleSim · log de hitos del mundo simulado</span>
        <span style={{ color: colors.primary }}>fuente de logros del CV (R-08)</span>
      </div>
    </div>
  );
}