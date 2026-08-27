import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface Props { theme: Theme; onBack: () => void; }

export default function PromptSim({ theme, onBack }: Props) {
  const colors = themeColors[theme];
  const [before] = useState('Resume las ventas de julio.');
  const [after, setAfter] = useState('Eres un analista. Resume las ventas de julio en JSON con: total, top_cliente. Sé claro, da un ejemplo del formato esperado y devuelve solo JSON.');
  const [check, setCheck] = useState(false);
  const ok = /json|tabla|lista|formato|step|paso/.test(after) && /ejemplo|few-shot|instrucci|regla|claro/.test(after);
  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>💬 Prompt engineering — Mejora de instrucción</span>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded ml-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>Escritorio</button>
      </div>
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <div className="text-[11px] font-mono" style={{ color: colors.textMuted }}><strong>Prompt original:</strong> “{before}”</div>
        <label className="block text-[10px] font-bold font-mono" style={{ color: colors.textMuted }}>Prompt mejorado (formato + few-shot)</label>
        <textarea value={after} onChange={e => setAfter(e.target.value)}
          className="w-full p-3 rounded-xl border-2 text-[11px] font-mono outline-none h-28" style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text }} />
        <button onClick={() => setCheck(true)}
          className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer" style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632' }}>▶ Evaluar rúbrica</button>
        {check && (
          <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: ok ? '#22c55e' : '#ef4444', background: ok ? '#22c55e10' : '#ef444410', color: ok ? '#16a34a' : '#dc2626' }}>
            {ok ? '✓ Prompt claro: fija formato de salida + instrucción + ejemplo few-shot.' : '✗ Añade formato de salida (JSON/tabla) y un ejemplo (few-shot) para reducir ambigüedad.'}
          </div>
        )}
      </div>
    </div>
  );
}