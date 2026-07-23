import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface SpreadsheetRow {
  label: string;
  value: number | null;
  editable: boolean;
  correct?: number;
  formula?: string;
}

interface SpreadsheetProps {
  rows: SpreadsheetRow[];
  onSubmit: (answers: Record<string, any>) => void;
  theme: Theme;
  title?: string;
  loading?: boolean;
}

export default function SpreadsheetWidget({ rows, onSubmit, theme, title, loading }: SpreadsheetProps) {
  const colors = themeColors[theme];
  const [values, setValues] = useState<Record<string, string>>({});

  function handleChange(label: string, val: string) {
    setValues(prev => ({ ...prev, [label]: val }));
  }

  function handleSubmit() {
    const answers: Record<string, any> = {};
    rows.filter(r => r.editable).forEach(r => {
      answers[`row_${r.label}`] = Number(values[r.label]) || 0;
    });
    onSubmit(answers);
  }

  const isDark = theme === 'dark';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: colors.bg }}>📊</div>
          <span className="text-[10px] font-bold font-mono" style={{ color: colors.text }}>{title || 'Hoja de Cálculo'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: colors.border }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
                <th className="px-4 py-2.5 text-[9px] font-bold font-mono uppercase" style={{ borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, width: '50%' }}>Concepto</th>
                <th className="px-4 py-2.5 text-[9px] font-bold font-mono uppercase" style={{ borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, width: '30%' }}>Valor</th>
                <th className="px-4 py-2.5 text-[9px] font-bold font-mono uppercase" style={{ borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, width: '20%' }}>Fórmula</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{
                  background: row.editable ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)') : 'transparent',
                }}>
                  <td className="px-4 py-2.5 text-[10px] font-mono" style={{ borderBottom: `1px solid ${colors.border}40`, color: row.editable ? colors.text : colors.textMuted }}>
                    <span className="font-bold">{row.label}</span>
                    {row.editable && <span className="ml-1.5 text-[8px]" style={{ color: colors.primary }}>✏️</span>}
                  </td>
                  <td className="px-4 py-2.5" style={{ borderBottom: `1px solid ${colors.border}40` }}>
                    {row.editable ? (
                      <input type="number" step="any" value={values[row.label] ?? ''} onChange={e => handleChange(row.label, e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-mono outline-none text-right"
                        style={{
                          borderColor: colors.border,
                          background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                          color: colors.text,
                        }}
                        placeholder="___"
                      />
                    ) : (
                      <div className="text-[10px] font-mono font-bold text-right" style={{ color: colors.primary }}>
                        {row.value !== null ? `$${row.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[8px] font-mono" style={{ borderBottom: `1px solid ${colors.border}40`, color: colors.textMuted }}>
                    {row.formula || (row.editable ? '✏️ Por calcular' : '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 rounded-xl border-2 text-[9px]" style={{ borderColor: colors.primary + '30', background: colors.primary + '08', color: colors.textMuted }}>
          <strong style={{ color: colors.primary }}>💡 Instrucciones:</strong> Calcula los valores marcados en amarillo usando los datos proporcionados. Luego presiona "Validar".
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full mt-5 py-3 rounded-xl border-2 text-xs font-bold cursor-pointer hover:opacity-85 transition disabled:opacity-50"
          style={{
            borderColor: colors.primary,
            background: colors.primary,
            color: '#1B2632',
            boxShadow: `3px 3px 0px 0px ${colors.border}`,
          }}
        >{loading ? 'Validando...' : '✓ Validar cálculos'}</button>
      </div>
    </div>
  );
}
