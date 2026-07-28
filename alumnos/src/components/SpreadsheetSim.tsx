import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface SpreadsheetSimProps { theme: Theme; onBack: () => void; }

const COLS = 'ABCDEFGH'.split('');
const ROWS = 20;

export default function SpreadsheetSim({ theme, onBack }: SpreadsheetSimProps) {
  const colors = themeColors[theme];
  const [cells, setCells] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>('A1');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  function getCellRef(r: number, c: number) { return `${COLS[c]}${r + 1}`; }

  function evalCell(ref: string): string {
    const val = cells[ref] || '';
    if (val.startsWith('=')) {
      try {
        const expr = val.slice(1)
          .replace(/\b[A-H]\d+\b/gi, m => evalCell(m) || '0')
          .replace(/SUM\(([A-H]\d+):([A-H]\d+)\)/gi, (_, from, to) => sumRange(from, to))
          .replace(/AVG\(([A-H]\d+):([A-H]\d+)\)/gi, (_, from, to) => avgRange(from, to));
        const result = Function(`"use strict"; return (${expr})`)();
        return String(Math.round(Number(result) * 100) / 100);
      } catch { return '#ERR'; }
    }
    return val;
  }

  function sumRange(from: string, to: string): string {
    const fc = COLS.indexOf(from[0]), fr = parseInt(from.slice(1)) - 1;
    const tc = COLS.indexOf(to[0]), tr = parseInt(to.slice(1)) - 1;
    let sum = 0;
    for (let r = fr; r <= tr; r++)
      for (let c = fc; c <= tc; c++)
        sum += parseFloat(evalCell(getCellRef(r, c))) || 0;
    return String(sum);
  }

  function avgRange(from: string, to: string): string {
    const fc = COLS.indexOf(from[0]), fr = parseInt(from.slice(1)) - 1;
    const tc = COLS.indexOf(to[0]), tr = parseInt(to.slice(1)) - 1;
    let sum = 0, count = 0;
    for (let r = fr; r <= tr; r++)
      for (let c = fc; c <= tc; c++) {
        const v = parseFloat(evalCell(getCellRef(r, c)));
        if (!isNaN(v)) { sum += v; count++; }
      }
    return count > 0 ? String(Math.round((sum / count) * 100) / 100) : '0';
  }

  function startEdit(ref: string) {
    setSelected(ref);
    setEditValue(cells[ref] || '');
    setEditing(true);
  }

  function saveEdit() {
    const updated = { ...cells };
    if (editValue.trim()) updated[selected] = editValue.trim();
    else delete updated[selected];
    setCells(updated);
    setEditing(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditing(false);
  }

  const isDark = theme === 'dark';

  // Empty spreadsheet - student fills it freely

  return (
    <div className="flex flex-col h-full" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
        <button onClick={onBack} className="text-[10px] px-2 py-1 rounded border cursor-pointer hover:opacity-70 shrink-0" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📊</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Hoja de Cálculo</span>
        <span className="text-[8px] font-mono ml-auto mr-2" style={{ color: colors.textMuted }}>Nuevo libro · Contabilidad</span>
        <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#22c55e20', color: '#22c55e' }}>✓ Listo</span>
      </div>

      {/* Formula bar */}
      <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : colors.bg }}>
        <div className="w-10 text-center text-[10px] font-bold font-mono px-2 py-1 rounded border" style={{ borderColor: colors.border, color: colors.primary, background: colors.cardBg }}>{selected}</div>
        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>fx</span>
        <input
          value={editing ? editValue : (cells[selected] || '')}
          onFocus={() => startEdit(selected)}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKey}
          onBlur={saveEdit}
          className="flex-1 px-3 py-1.5 rounded-lg border-2 text-[10px] font-mono outline-none"
          style={{ borderColor: editing ? colors.primary : colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }}
          placeholder={`Introduce valor o fórmula (=SUM(A1:A5))`}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse w-full" style={{ borderColor: colors.border }}>
          <thead>
            <tr>
              <th className="sticky top-0 z-10 w-8 p-1 text-[8px] font-mono border-r border-b" style={{ borderColor: colors.border, background: isDark ? '#1a1a2e' : '#e5e7eb', color: colors.textMuted }}></th>
              {COLS.map(c => (
                <th key={c} className="sticky top-0 z-10 p-1.5 text-[8px] font-mono border-r border-b min-w-[80px]" style={{ borderColor: colors.border, background: isDark ? '#1a1a2e' : '#e5e7eb', color: colors.primary }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <td className="text-center p-1.5 text-[8px] font-mono border-r border-b" style={{ borderColor: colors.border, background: isDark ? '#111' : '#f3f4f6', color: colors.textMuted }}>{r + 1}</td>
                {COLS.map(c => {
                  const ref = getCellRef(r, COLS.indexOf(c));
                  const isSel = selected === ref;
                  const val = evalCell(ref);
                  const raw = cells[ref] || '';
                  return (
                    <td key={c} onClick={() => { setSelected(ref); if (!editing) setEditValue(raw); }}
                      className="p-1.5 text-[9px] font-mono border-r border-b cursor-pointer hover:opacity-80 transition text-right"
                      style={{
                        borderColor: colors.border,
                        background: isSel ? (isDark ? 'rgba(255,177,98,0.15)' : 'rgba(255,177,98,0.2)') : 'transparent',
                        outline: isSel ? `2px solid ${colors.primary}` : 'none',
                        color: raw.startsWith('=') ? colors.textMuted : colors.text,
                        fontWeight: raw.startsWith('=') ? 'normal' : 'normal',
                      }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-t-2 flex items-center gap-3 text-[8px] font-mono shrink-0 flex-wrap" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>Libro vacío</span>
        <span className="text-[6px] bg-white/10 px-1 py-0.5 rounded font-bold" style={{ color: colors.primary }}>Fórmulas:</span>
        <span style={{ color: colors.primary }}>=A1+B1</span>
        <span style={{ color: colors.primary }}>=SUM(A1:A5)</span>
        <span style={{ color: colors.primary }}>=AVG(B1:B5)</span>
        <span style={{ color: colors.primary }}>=B2*0.16</span>
        <span style={{ color: colors.primary }}>=C1-C2</span>
        <span style={{ color: colors.primary }}>=D1/D2</span>
        <span className="ml-auto" style={{ color: colors.textMuted }}>{selected}</span>
      </div>
    </div>
  );
}
