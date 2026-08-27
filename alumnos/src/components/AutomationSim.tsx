import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface Props { theme: Theme; onBack: () => void; }

export default function AutomationSim({ theme, onBack }: Props) {
  const colors = themeColors[theme];
  const [nodes, setNodes] = useState('HTTP GET /api/ventas → SQL insert → notify Slack');
  const [trigger, setTrigger] = useState('cron diario 06:00');
  const [run, setRun] = useState(false);
  const ok = /http|api|sql|transform|notify/.test(nodes) && /cron|diario|schedule|trigger|webhook|al llegue/.test(trigger);
  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>⚙️ n8n — Workflow de ingesta diaria</span>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded ml-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>Escritorio</button>
      </div>
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <label className="block text-[10px] font-bold font-mono" style={{ color: colors.textMuted }}>Trigger</label>
        <input value={trigger} onChange={e => setTrigger(e.target.value)}
          className="w-full p-2 rounded-xl border-2 text-[11px] font-mono outline-none" style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text }} />
        <label className="block text-[10px] font-bold font-mono" style={{ color: colors.textMuted }}>Nodos (HTTP → transform → persistir → notificar)</label>
        <textarea value={nodes} onChange={e => setNodes(e.target.value)}
          className="w-full p-3 rounded-xl border-2 text-[11px] font-mono outline-none h-24" style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text }} />
        <button onClick={() => setRun(true)}
          className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer" style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632' }}>▶ Ejecutar workflow</button>
        {run && (
          <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: ok ? '#22c55e' : '#ef4444', background: ok ? '#22c55e10' : '#ef444410', color: ok ? '#16a34a' : '#dc2626' }}>
            {ok ? '✓ Trigger + nodos de acción forman un workflow ejecutable (HTTP→SQL→notify).' : '✗ Define trigger (cron/webhook) y nodos de acción (HTTP/SQL/notify).'}
          </div>
        )}
      </div>
    </div>
  );
}