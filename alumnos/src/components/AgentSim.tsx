import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface Props { theme: Theme; onBack: () => void; }

export default function AgentSim({ theme, onBack }: Props) {
  const colors = themeColors[theme];
  const [tools, setTools] = useState('SQL (consulta mart), HTTP (API ventas), LLM (resumen)');
  const [loop, setLoop] = useState('Percepción → decide tool → ejecuta → usa memoria del paso anterior');
  const [run, setRun] = useState(false);
  const ok = /sql|notebook|http|llm|api/.test(tools) && /tool|herramienta|memoria|bucle|loop|resultado|pasa/.test(loop);
  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>🧠 Agente — Consulta con herramientas</span>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded ml-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>Escritorio</button>
      </div>
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <label className="block text-[10px] font-bold font-mono" style={{ color: colors.textMuted }}>Herramientas del agente</label>
        <input value={tools} onChange={e => setTools(e.target.value)}
          className="w-full p-2 rounded-xl border-2 text-[11px] font-mono outline-none" style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text }} />
        <label className="block text-[10px] font-bold font-mono" style={{ color: colors.textMuted }}>Loop y memoria</label>
        <textarea value={loop} onChange={e => setLoop(e.target.value)}
          className="w-full p-3 rounded-xl border-2 text-[11px] font-mono outline-none h-20" style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text }} />
        <button onClick={() => setRun(true)}
          className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer" style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632' }}>▶ Ejecutar agente</button>
        {run && (
          <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: ok ? '#22c55e' : '#ef4444', background: ok ? '#22c55e10' : '#ef444410', color: ok ? '#16a34a' : '#dc2626' }}>
            {ok ? '✓ Loop percepción→decisión→acción(tool)→memoria bien definido.' : '✗ Describe herramientas reales (SQL/HTTP/LLM) y el loop con memoria.'}
          </div>
        )}
      </div>
    </div>
  );
}