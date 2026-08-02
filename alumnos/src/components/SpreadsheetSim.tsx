import { useState, useEffect, useCallback } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface SpreadsheetSimProps { theme: Theme; onBack: () => void; }

const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROWS = 50;

export default function SpreadsheetSim({ theme, onBack }: SpreadsheetSimProps) {
  const colors = themeColors[theme];
  const [cells, setCells] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>('A1');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Record<string, string>[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  function getCellRef(r: number, c: number) { return `${COLS[c]}${r + 1}`; }

  function parseRef(ref: string): { col: number; row: number } | null {
    const match = ref.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return null;
    const col = COLS.indexOf(match[1].toUpperCase());
    const row = parseInt(match[2]) - 1;
    if (col < 0 || col >= COLS.length || row < 0 || row >= ROWS) return null;
    return { col, row };
  }

  function getSelectionRange(): { minR: number; maxR: number; minC: number; maxC: number } | null {
    if (!selectionStart || !selectionEnd) return null;
    const start = parseRef(selectionStart);
    const end = parseRef(selectionEnd);
    if (!start || !end) return null;
    return {
      minR: Math.min(start.row, end.row),
      maxR: Math.max(start.row, end.row),
      minC: Math.min(start.col, end.col),
      maxC: Math.max(start.col, end.col),
    };
  }

  function isInSelection(r: number, c: number): boolean {
    const range = getSelectionRange();
    if (!range) return selected === getCellRef(r, c);
    return r >= range.minR && r <= range.maxR && c >= range.minC && c <= range.maxC;
  }

  function evalCell(ref: string): string {
    const val = cells[ref] || '';
    if (val.startsWith('=')) {
      try {
        const rawExpr = val.slice(1);
        let expr = rawExpr.replace(/\b(?:SUM|SUMA|AVG|PROMEDIO|COUNT|CONTAR|MAX|MIN|ABS|ROUND|REDONDEAR|IF|SI|CONCAT|CONCATENAR)\(([^)]+)\)/gi, (match, args) => {
          const upperMatch = match.toUpperCase();
          const isAvg = /AVG|PROMEDIO/i.test(match);
          const isCount = /COUNT|CONTAR/i.test(match);
          const isMax = /MAX/i.test(match);
          const isMin = /MIN/i.test(match);
          const isAbs = /ABS/i.test(match);
          const isRound = /ROUND|REDONDEAR/i.test(match);
          const isIf = /IF|SI/i.test(match);
          const isConcat = /CONCAT|CONCATENAR/i.test(match);

          if (isIf) {
            const parts = args.split(',');
            if (parts.length >= 3) {
              const condition = parts[0].trim();
              const trueVal = parts[1].trim();
              const falseVal = parts[2].trim();
              const condExpr = condition.replace(/\b[A-Z]\d+\b/gi, (m: string) => evalCell(m.toUpperCase()) || '0');
              const result = Function(`"use strict"; return (${condExpr})`)();
              return result ? (trueVal.startsWith('"') ? trueVal.replace(/"/g, '') : String(evalCell(trueVal.toUpperCase()) || trueVal)) : (falseVal.startsWith('"') ? falseVal.replace(/"/g, '') : String(evalCell(falseVal.toUpperCase()) || falseVal));
            }
            return '#ERR';
          }

          const values: number[] = [];
          args.split(',').forEach((arg: string) => {
            arg = arg.trim();
            if (arg.includes(':')) {
              const [from, to] = arg.split(':');
              const fc = COLS.indexOf(from[0].toUpperCase()), fr = parseInt(from.slice(1)) - 1;
              const tc = COLS.indexOf(to[0].toUpperCase()), tr = parseInt(to.slice(1)) - 1;
              for (let r = fr; r <= tr; r++)
                for (let c = fc; c <= tc; c++) {
                  const v = parseFloat(evalCell(getCellRef(r, c)));
                  if (!isNaN(v)) values.push(v);
                }
            } else if (/^[A-Z]\d+$/i.test(arg)) {
              const v = parseFloat(evalCell(arg.toUpperCase()));
              if (!isNaN(v)) values.push(v);
            } else {
              const v = parseFloat(arg);
              if (!isNaN(v)) values.push(v);
            }
          });

          if (isConcat) {
            return args.split(',').map((a: string) => {
              a = a.trim();
              if (a.startsWith('"')) return a.replace(/"/g, '');
              return evalCell(a.toUpperCase()) || '';
            }).join('');
          }

          if (values.length === 0) return '0';
          if (isCount) return String(values.length);
          if (isMax) return String(Math.max(...values));
          if (isMin) return String(Math.min(...values));
          if (isAbs) return String(Math.abs(values[0]));
          if (isRound) return String(Math.round(values[0]));
          const sum = values.reduce((a, b) => a + b, 0);
          return String(isAvg ? Math.round((sum / values.length) * 100) / 100 : sum);
        });

        expr = expr.replace(/\b[A-Z]\d+\b/gi, (m: string) => evalCell(m.toUpperCase()) || '0');
        const result = Function(`"use strict"; return (${expr})`)();
        return String(Math.round(Number(result) * 100) / 100);
      } catch { return '#ERR'; }
    }
    return val;
  }

  function saveState() {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), { ...cells }]);
    setHistoryIdx(prev => prev + 1);
  }

  function undo() {
    if (historyIdx > 0) {
      setHistoryIdx(prev => prev - 1);
      setCells({ ...history[historyIdx - 1] });
    }
  }

  function redo() {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(prev => prev + 1);
      setCells({ ...history[historyIdx + 1] });
    }
  }

  function startEdit(ref: string) {
    setSelected(ref);
    setEditValue(cells[ref] || '');
    setEditing(true);
  }

  function saveEdit() {
    if (!editing) return;
    saveState();
    const updated = { ...cells };
    if (editValue.trim()) updated[selected] = editValue.trim();
    else delete updated[selected];
    setCells(updated);
    setEditing(false);
  }

  function copySelection() {
    const range = getSelectionRange();
    if (!range) { setClipboard({ [selected]: cells[selected] || '' }); return; }
    const clip: Record<string, string> = {};
    for (let r = range.minR; r <= range.maxR; r++)
      for (let c = range.minC; c <= range.maxC; c++)
        clip[getCellRef(r, c)] = cells[getCellRef(r, c)] || '';
    setClipboard(clip);
  }

  function cutSelection() {
    copySelection();
    saveState();
    const range = getSelectionRange();
    if (!range) { delete cells[selected]; setCells({ ...cells }); return; }
    const updated = { ...cells };
    for (let r = range.minR; r <= range.maxR; r++)
      for (let c = range.minC; c <= range.maxC; c++)
        delete updated[getCellRef(r, c)];
    setCells(updated);
  }

  function pasteClipboard() {
    if (Object.keys(clipboard).length === 0) return;
    saveState();
    const start = parseRef(selected);
    if (!start) return;
    const updated = { ...cells };
    const clipRefs = Object.keys(clipboard);
    if (clipRefs.length === 1) {
      updated[selected] = clipboard[clipRefs[0]];
    } else {
      let minR = Infinity, minC = Infinity;
      clipRefs.forEach(ref => {
        const p = parseRef(ref);
        if (p) { minR = Math.min(minR, p.row); minC = Math.min(minC, p.col); }
      });
      clipRefs.forEach(ref => {
        const p = parseRef(ref);
        if (p) {
          const newR = start.row + (p.row - minR);
          const newC = start.col + (p.col - minC);
          if (newR < ROWS && newC < COLS.length) updated[getCellRef(newR, newC)] = clipboard[ref];
        }
      });
    }
    setCells(updated);
  }

  function deleteSelection() {
    saveState();
    const range = getSelectionRange();
    if (!range) { delete cells[selected]; setCells({ ...cells }); return; }
    const updated = { ...cells };
    for (let r = range.minR; r <= range.maxR; r++)
      for (let c = range.minC; c <= range.maxC; c++)
        delete updated[getCellRef(r, c)];
    setCells(updated);
  }

  function applyFormulaToSelection(formula: string) {
    saveState();
    const range = getSelectionRange();
    if (!range) { cells[selected] = formula; setCells({ ...cells }); return; }
    const updated = { ...cells };
    for (let c = range.minC; c <= range.maxC; c++) {
      const colLetter = COLS[c];
      const startRow = range.minR + 1;
      const endRow = range.maxR + 1;
      updated[getCellRef(range.minR, c)] = `=${formula}(${colLetter}${startRow}:${colLetter}${endRow})`;
    }
    setCells(updated);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') { e.preventDefault(); copySelection(); return; }
        if (e.key === 'x') { e.preventDefault(); cutSelection(); return; }
        if (e.key === 'v') { e.preventDefault(); pasteClipboard(); return; }
        if (e.key === 'z') { e.preventDefault(); undo(); return; }
        if (e.key === 'y') { e.preventDefault(); redo(); return; }
      }
      if (!editing) {
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelection(); return; }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setSelected(prev => { setEditValue(''); setEditing(true); return prev; });
        }
      }
      if (editing) {
        if (e.key === 'Enter') { e.preventDefault(); saveEdit(); moveCell(0, 1); }
        else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); setEditValue(cells[selected] || ''); }
        else if (e.key === 'Tab') { e.preventDefault(); saveEdit(); moveCell(1, 0); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); saveEdit(); moveCell(0, 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); saveEdit(); moveCell(0, -1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); saveEdit(); moveCell(1, 0); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); saveEdit(); moveCell(-1, 0); }
        else if (e.key === 'Backspace') { e.preventDefault(); setEditValue(prev => prev.slice(0, -1)); }
        else if (e.key === 'Delete') { e.preventDefault(); setEditValue(''); }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setEditValue(prev => prev + e.key); }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [editing, editValue, selected, cells, clipboard, historyIdx]);

  function moveCell(dc: number, dr: number) {
    const parsed = parseRef(selected);
    if (!parsed) return;
    const nc = Math.max(0, Math.min(parsed.col + dc, COLS.length - 1));
    const nr = Math.max(0, Math.min(parsed.row + dr, ROWS - 1));
    const ref = getCellRef(nr, nc);
    setSelected(ref);
    setSelectionStart(ref);
    setSelectionEnd(ref);
    setEditValue(cells[ref] || '');
    setEditing(true);
  }

  function clickCell(ref: string, e: React.MouseEvent) {
    saveEdit();
    setSelected(ref);
    setEditValue(cells[ref] || '');
    setEditing(true);
    if (e.shiftKey) {
      setSelectionEnd(ref);
    } else {
      setSelectionStart(ref);
      setSelectionEnd(ref);
    }
  }

  function mouseDownCell(ref: string) {
    setSelecting(true);
    setSelectionStart(ref);
    setSelectionEnd(ref);
    setSelected(ref);
    setEditValue(cells[ref] || '');
    setEditing(true);
  }

  function mouseEnterCell(ref: string) {
    if (selecting) setSelectionEnd(ref);
  }

  function mouseUp() { setSelecting(false); }

  useEffect(() => {
    document.addEventListener('mouseup', mouseUp);
    return () => document.removeEventListener('mouseup', mouseUp);
  }, []);

  function handleFormulaChange(e: React.ChangeEvent<HTMLInputElement>) { setEditValue(e.target.value); }
  function handleFormulaKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditing(false);
  }

  function getSelectionLabel(): string {
    if (!selectionStart || !selectionEnd || selectionStart === selectionEnd) return selected;
    return `${selectionStart}:${selectionEnd}`;
  }

  function getSelectionStats(): string {
    const range = getSelectionRange();
    if (!range) return '';
    const values: number[] = [];
    let count = 0;
    for (let r = range.minR; r <= range.maxR; r++)
      for (let c = range.minC; c <= range.maxC; c++) {
        count++;
        const v = parseFloat(evalCell(getCellRef(r, c)));
        if (!isNaN(v)) values.push(v);
      }
    if (values.length === 0) return `${count} celdas`;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    return `Prom: ${avg.toFixed(2)} | Suma: ${sum.toLocaleString('es-MX')} | Cont: ${values.length}`;
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full" style={{ background: colors.bg }}>
      {/* Toolbar */}
      <div className="px-3 py-1.5 border-b-2 shrink-0 flex items-center gap-2 flex-wrap" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded border cursor-pointer hover:opacity-70 shrink-0" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-[9px] font-bold font-mono" style={{ color: colors.text }}>📊 Hoja de Cálculo</span>
        <div className="h-4 w-px mx-1" style={{ background: colors.border }} />
        <button onClick={copySelection} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted }}>📋 Copiar</button>
        <button onClick={cutSelection} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted }}>✂️ Cortar</button>
        <button onClick={pasteClipboard} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted }}>📄 Pegar</button>
        <div className="h-4 w-px mx-1" style={{ background: colors.border }} />
        <button onClick={() => applyFormulaToSelection('SUMA')} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.primary, color: colors.primary }}>Σ SUMA</button>
        <button onClick={() => applyFormulaToSelection('PROMEDIO')} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.primary, color: colors.primary }}>Ø PROM</button>
        <button onClick={() => applyFormulaToSelection('MAX')} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.primary, color: colors.primary }}>↑ MAX</button>
        <button onClick={() => applyFormulaToSelection('MIN')} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.primary, color: colors.primary }}>↓ MIN</button>
        <button onClick={() => applyFormulaToSelection('CONTAR')} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.primary, color: colors.primary }}># CNT</button>
        <div className="h-4 w-px mx-1" style={{ background: colors.border }} />
        <button onClick={undo} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted }}>↩ Deshacer</button>
        <button onClick={redo} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted }}>↪ Rehacer</button>
      </div>

      {/* Formula bar */}
      <div className="px-3 py-1.5 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : colors.bg }}>
        <div className="w-16 text-center text-[9px] font-bold font-mono px-2 py-1 rounded border truncate" style={{ borderColor: colors.border, color: colors.primary, background: colors.cardBg }}>{getSelectionLabel()}</div>
        <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>fx</span>
        <input
          value={editing ? editValue : (cells[selected] || '')}
          onFocus={() => { setEditing(true); setEditValue(cells[selected] || ''); }}
          onChange={handleFormulaChange}
          onKeyDown={handleFormulaKeyDown}
          onBlur={saveEdit}
          className="flex-1 px-3 py-1 rounded border-2 text-[9px] font-mono outline-none"
          style={{ borderColor: editing ? colors.primary : colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }}
          placeholder={`Fórmula: =SUM(A1:A5), =SI(A1>100,"Sí","No")`}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto" onMouseUp={mouseUp}>
        <table className="border-collapse" style={{ borderColor: colors.border }}>
          <thead>
            <tr>
              <th className="sticky top-0 sticky left-0 z-20 w-8 p-1 text-[7px] font-mono border-r border-b" style={{ borderColor: colors.border, background: isDark ? '#1a1a2e' : '#e5e7eb', color: colors.textMuted }}></th>
              {COLS.map(c => (
                <th key={c} className="sticky top-0 z-10 p-1 text-[7px] font-mono border-r border-b min-w-[70px]" style={{ borderColor: colors.border, background: isDark ? '#1a1a2e' : '#e5e7eb', color: colors.primary }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <td className="sticky left-0 z-10 text-center p-1 text-[7px] font-mono border-r border-b" style={{ borderColor: colors.border, background: isDark ? '#111' : '#f3f4f6', color: colors.textMuted }}>{r + 1}</td>
                {COLS.map(c => {
                  const ref = getCellRef(r, COLS.indexOf(c));
                  const isSel = selected === ref;
                  const inRange = isInSelection(r, COLS.indexOf(c));
                  const display = isSel && editing ? editValue : evalCell(ref);
                  const raw = cells[ref] || '';
                  const isFormula = raw.startsWith('=');
                  const hasError = display === '#ERR';
                  return (
                    <td key={c}
                      onMouseDown={() => mouseDownCell(ref)}
                      onMouseEnter={() => mouseEnterCell(ref)}
                      onClick={(e) => clickCell(ref, e)}
                      className="p-1 text-[8px] font-mono border-r border-b cursor-pointer select-none"
                      style={{
                        borderColor: colors.border,
                        background: isSel ? (isDark ? 'rgba(255,177,98,0.2)' : 'rgba(255,177,98,0.3)') : inRange && !isSel ? (isDark ? 'rgba(255,177,98,0.08)' : 'rgba(255,177,98,0.12)') : 'transparent',
                        outline: isSel ? `2px solid ${colors.primary}` : 'none',
                        color: hasError ? '#ef4444' : isFormula ? colors.textMuted : colors.text,
                        minWidth: 70,
                        textAlign: 'right',
                      }}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 border-t-2 flex items-center gap-3 text-[7px] font-mono shrink-0 flex-wrap" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>{ROWS}×{COLS.length}</span>
        {getSelectionStats() && (
          <span className="px-1.5 py-0.5 rounded" style={{ background: isDark ? 'rgba(255,177,98,0.1)' : 'rgba(255,177,98,0.15)', color: colors.primary }}>{getSelectionStats()}</span>
        )}
        <span className="ml-auto" style={{ color: colors.textMuted }}>Ctrl+C/V/X · Shift+Click · Drag</span>
      </div>
    </div>
  );
}
