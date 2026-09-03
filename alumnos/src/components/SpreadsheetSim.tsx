import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { themeColors, Theme } from '../lib/theme';

type CellFormat = {
  type?: 'number' | 'currency' | 'percent' | 'date' | 'text';
  decimals?: number;
  bold?: boolean;
  italic?: boolean;
  bgColor?: string;
  textColor?: string;
  align?: 'left' | 'center' | 'right';
};

type CellData = {
  value: string;
  format?: CellFormat;
};

type ClipboardData = {
  cells: Map<string, CellData>;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  isCut: boolean;
};

type HistoryEntry = {
  cells: Map<string, CellData>;
};

const COLUMNS = 26;
const ROWS = 100;
const MAX_HISTORY = 20;
const ROW_HEIGHT = 19;
const BUFFER = 6;

function colToLetter(col: number): string {
  return String.fromCharCode(65 + col);
}

function letterToCol(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 65;
}

function cellId(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`;
}

function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z])(\d+)$/i);
  if (!match) return null;
  const col = letterToCol(match[1]);
  const row = parseInt(match[2], 10) - 1;
  if (col < 0 || col >= COLUMNS || row < 0 || row >= ROWS) return null;
  return { row, col };
}

function parseRange(range: string): { startRow: number; startCol: number; endRow: number; endCol: number } | null {
  const parts = range.split(':');
  if (parts.length !== 2) return null;
  const start = parseCellRef(parts[0].trim());
  const end = parseCellRef(parts[1].trim());
  if (!start || !end) return null;
  return {
    startRow: Math.min(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endRow: Math.max(start.row, end.row),
    endCol: Math.max(start.col, end.col),
  };
}

function parseRangeStr(range: string): [number, number][] | null {
  const r = parseRange(range);
  if (!r) return null;
  const result: [number, number][] = [];
  for (let row = r.startRow; row <= r.endRow; row++) {
    for (let col = r.startCol; col <= r.endCol; col++) {
      result.push([row, col]);
    }
  }
  return result;
}

function getCellValue(cells: Map<string, CellData>, row: number, col: number): string {
  const id = cellId(row, col);
  const cell = cells.get(id);
  return cell?.value || '';
}

function getNumericValue(cells: Map<string, CellData>, row: number, col: number): number {
  const val = getCellValue(cells, row, col);
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

function evaluateFormula(
  formula: string,
  cells: Map<string, CellData>,
  getVal: (cells: Map<string, CellData>, row: number, col: number) => string,
  getNum: (cells: Map<string, CellData>, row: number, col: number) => number
): string {
  const f = formula.trim();
  if (!f.startsWith('=')) return formula;
  const expr = f.substring(1).trim();

  function extractArgs(argsStr: string): string[] {
    const args: string[] = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < argsStr.length; i++) {
      const ch = argsStr[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) args.push(current.trim());
    return args;
  }

  function getNumericValues(argsStr: string): number[] {
    const nums: number[] = [];
    const args = extractArgs(argsStr);
    for (const arg of args) {
      const range = parseRange(arg);
      if (range) {
        for (let r = range.startRow; r <= range.endRow; r++) {
          for (let c = range.startCol; c <= range.endCol; c++) {
            const v = parseFloat(getVal(cells, r, c));
            if (!isNaN(v)) nums.push(v);
          }
        }
      } else {
        const ref = parseCellRef(arg);
        if (ref) {
          const v = parseFloat(getVal(cells, ref.row, ref.col));
          if (!isNaN(v)) nums.push(v);
        } else {
          const v = parseFloat(arg);
          if (!isNaN(v)) nums.push(v);
        }
      }
    }
    return nums;
  }

  function evalExpr(expr: string): string {
    const trimmed = expr.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1);
    }
    const num = parseFloat(trimmed);
    if (!isNaN(num)) return trimmed;
    const ref = parseCellRef(trimmed);
    if (ref) return getVal(cells, ref.row, ref.col);
    const funcMatch = trimmed.match(/^(\w+)\(([\s\S]*)\)$/);
    if (funcMatch) {
      const funcName = funcMatch[1].toUpperCase();
      const argsStr = funcMatch[2];
      return evalFunction(funcName, argsStr);
    }
    const ops = ['+', '-', '*', '/'];
    for (const op of ops) {
      let depth = 0;
      for (let i = trimmed.length - 1; i >= 1; i--) {
        if (trimmed[i] === ')') depth++;
        else if (trimmed[i] === '(') depth--;
        else if (trimmed[i] === op && depth === 0) {
          const left = evalExpr(trimmed.substring(0, i));
          const right = evalExpr(trimmed.substring(i + 1));
          const l = parseFloat(left);
          const r = parseFloat(right);
          if (!isNaN(l) && !isNaN(r)) {
            if (op === '+') return String(l + r);
            if (op === '-') return String(l - r);
            if (op === '*') return String(l * r);
            if (op === '/') return r !== 0 ? String(l / r) : '#DIV/0!';
          }
          break;
        }
      }
    }
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return evalExpr(trimmed.slice(1, -1));
    }
    return trimmed;
  }

  function evalFunction(name: string, argsStr: string): string {
    const args = extractArgs(argsStr);
    const nums = getNumericValues(argsStr);

    if (name === 'SUM' || name === 'SUMA') {
      return String(nums.reduce((a, b) => a + b, 0));
    }
    if (name === 'AVG' || name === 'PROMEDIO') {
      return nums.length > 0 ? String(nums.reduce((a, b) => a + b, 0) / nums.length) : '0';
    }
    if (name === 'COUNT' || name === 'CONTAR') {
      return String(nums.length);
    }
    if (name === 'MAX') {
      return nums.length > 0 ? String(Math.max(...nums)) : '0';
    }
    if (name === 'MIN') {
      return nums.length > 0 ? String(Math.min(...nums)) : '0';
    }
    if (name === 'ABS') {
      const v = nums[0] ?? 0;
      return String(Math.abs(v));
    }
    if (name === 'ROUND' || name === 'REDONDEAR') {
      const v = nums[0] ?? 0;
      const d = nums[1] ?? 0;
      return String(Number(v.toFixed(d)));
    }
    if (name === 'POWER' || name === 'POTENCIA') {
      return String(Math.pow(nums[0] ?? 0, nums[1] ?? 2));
    }
    if (name === 'SQRT' || name === 'RAIZ') {
      const v = nums[0] ?? 0;
      return v >= 0 ? String(Math.sqrt(v)) : '#NUM!';
    }
    if (name === 'MOD') {
      const divisor = nums[1] ?? 1;
      return divisor !== 0 ? String((nums[0] ?? 0) % divisor) : '#DIV/0!';
    }
    if (name === 'INT' || name === 'ENTERO') {
      return String(Math.floor(nums[0] ?? 0));
    }
    if (name === 'RAND') {
      return String(Math.random());
    }
    if (name === 'RANDBETWEEN' || name === 'ALEATORIO.ENTRE') {
      const low = nums[0] ?? 1;
      const high = nums[1] ?? 100;
      return String(Math.floor(Math.random() * (high - low + 1)) + low);
    }

    if (name === 'IF' || name === 'SI') {
      const condition = evalExpr(args[0]);
      const isTruthy = condition !== '0' && condition !== '' && condition.toUpperCase() !== 'FALSE' && condition !== '#REF!';
      return isTruthy ? evalExpr(args[1] ?? 'TRUE') : evalExpr(args[2] ?? 'FALSE');
    }
    if (name === 'AND' || name === 'Y') {
      const vals = args.map(a => {
        const v = evalExpr(a);
        return v !== '0' && v !== '' && v.toUpperCase() !== 'FALSE';
      });
      return vals.every(Boolean) ? 'TRUE' : 'FALSE';
    }
    if (name === 'OR' || name === 'O') {
      const vals = args.map(a => {
        const v = evalExpr(a);
        return v !== '0' && v !== '' && v.toUpperCase() !== 'FALSE';
      });
      return vals.some(Boolean) ? 'TRUE' : 'FALSE';
    }
    if (name === 'NOT') {
      const v = evalExpr(args[0]);
      const isTruthy = v !== '0' && v !== '' && v.toUpperCase() !== 'FALSE';
      return isTruthy ? 'FALSE' : 'TRUE';
    }

    if (name === 'UPPER' || name === 'MINUSC') {
      const v = evalExpr(args[0] ?? '""');
      return v.toUpperCase();
    }
    if (name === 'LOWER' || name === 'MAXUSC') {
      const v = evalExpr(args[0] ?? '""');
      return v.toLowerCase();
    }
    if (name === 'PROPER' || name === 'NOMPROPIO') {
      const v = evalExpr(args[0] ?? '""');
      return v.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    }
    if (name === 'LEN' || name === 'LARGO') {
      const v = evalExpr(args[0] ?? '""');
      return String(v.length);
    }
    if (name === 'LEFT' || name === 'IZQUIERDA') {
      const v = evalExpr(args[0] ?? '""');
      const count = nums[0] ?? 1;
      return v.substring(0, count);
    }
    if (name === 'RIGHT' || name === 'DERECHA') {
      const v = evalExpr(args[0] ?? '""');
      const count = nums[0] ?? 1;
      return v.substring(v.length - count);
    }
    if (name === 'MID' || name === 'EXTRAE') {
      const v = evalExpr(args[0] ?? '""');
      const start = (nums[0] ?? 1) - 1;
      const count = nums[1] ?? 1;
      return v.substring(start, start + count);
    }
    if (name === 'TRIM' || name === 'ESPACIOS') {
      const v = evalExpr(args[0] ?? '""');
      return v.trim();
    }
    if (name === 'VALUE' || name === 'VALOR') {
      const v = evalExpr(args[0] ?? '0');
      const numVal = parseFloat(v);
      return isNaN(numVal) ? '#VALUE!' : String(numVal);
    }
    if (name === 'CONCAT' || name === 'CONCATENAR') {
      return args.map(a => evalExpr(a)).join('');
    }

    if (name === 'NOW' || name === 'AHORA') {
      return new Date().toLocaleString('es-MX');
    }
    if (name === 'TODAY' || name === 'HOY') {
      return new Date().toLocaleDateString('es-MX');
    }
    if (name === 'DATE' || name === 'FECHA') {
      const year = nums[0] ?? new Date().getFullYear();
      const month = (nums[1] ?? new Date().getMonth() + 1) - 1;
      const day = nums[2] ?? new Date().getDate();
      return new Date(year, month, day).toLocaleDateString('es-MX');
    }
    if (name === 'YEAR' || name === 'ANO') {
      const v = evalExpr(args[0] ?? '""');
      const d = new Date(v);
      return isNaN(d.getTime()) ? '#VALUE!' : String(d.getFullYear());
    }
    if (name === 'MONTH' || name === 'MES') {
      const v = evalExpr(args[0] ?? '""');
      const d = new Date(v);
      return isNaN(d.getTime()) ? '#VALUE!' : String(d.getMonth() + 1);
    }
    if (name === 'DAY' || name === 'DIA') {
      const v = evalExpr(args[0] ?? '""');
      const d = new Date(v);
      return isNaN(d.getTime()) ? '#VALUE!' : String(d.getDate());
    }

    // ─── VLOOKUP / CONSULTAV ──────────────────────────────────
    if (name === 'VLOOKUP' || name === 'CONSULTAV' || name === 'BUSCARV') {
      const lookupValue = evalExpr(args[0] ?? '');
      const rangeStr = args[1] ?? '';
      const colIndex = nums[2] ?? 1;
      const exactMatch = args[3] !== undefined ? evalExpr(args[3]) : 'FALSE';
      const range = parseRangeStr(rangeStr);
      if (!range) return '#REF!';
      for (const [row, col] of range) {
        const cellVal = getVal(cells, row, col);
        if (exactMatch.toUpperCase() === 'TRUE') {
          if (String(cellVal) === String(lookupValue)) {
            return getVal(cells, row, col + colIndex - 1);
          }
        } else {
          if (parseFloat(cellVal) >= parseFloat(lookupValue)) {
            return getVal(cells, row, col + colIndex - 1);
          }
        }
      }
      return '#N/A';
    }

    // ─── INDEX ────────────────────────────────────────────────
    if (name === 'INDEX') {
      const rangeStr = args[0] ?? '';
      const rowIdx = (nums[1] ?? 1) - 1;
      const colIdx = (nums[2] ?? 1) - 1;
      const range = parseRangeStr(rangeStr);
      if (!range || range.length === 0) return '#REF!';
      const rangeRows = [...new Set(range.map(r => r[0]))].sort((a, b) => a - b);
      const rangeCols = [...new Set(range.map(r => r[1]))].sort((a, b) => a - b);
      const targetRow = rangeRows[rowIdx] ?? rangeRows[0];
      const targetCol = rangeCols[colIdx] ?? rangeCols[0];
      return getVal(cells, targetRow, targetCol);
    }

    // ─── MATCH / COINCIDIR ────────────────────────────────────
    if (name === 'MATCH' || name === 'COINCIDIR') {
      const lookupValue = evalExpr(args[0] ?? '');
      const rangeStr = args[1] ?? '';
      const matchType = nums[2] ?? 1;
      const range = parseRangeStr(rangeStr);
      if (!range) return '#N/A';
      if (matchType === 0) {
        for (let i = 0; i < range.length; i++) {
          if (String(getVal(cells, range[i][0], range[i][1])) === String(lookupValue)) return String(i + 1);
        }
      } else if (matchType === 1) {
        for (let i = 0; i < range.length; i++) {
          if (parseFloat(getVal(cells, range[i][0], range[i][1])) <= parseFloat(lookupValue)) return String(i + 1);
        }
      } else {
        for (let i = 0; i < range.length; i++) {
          if (parseFloat(getVal(cells, range[i][0], range[i][1])) >= parseFloat(lookupValue)) return String(i + 1);
        }
      }
      return '#N/A';
    }

    // ─── PMT / PAGO ───────────────────────────────────────────
    if (name === 'PMT' || name === 'PAGO') {
      const rate = nums[0] ?? 0;
      const nper = nums[1] ?? 1;
      const pv = nums[2] ?? 0;
      if (nper === 0) return '#DIV/0!';
      const pmt = -(rate * pv) / (1 - Math.pow(1 + rate, -nper));
      return String(Math.round(pmt * 100) / 100);
    }

    // ─── NPV / VNA ────────────────────────────────────────────
    if (name === 'NPV' || name === 'VNA') {
      const rate = nums[0] ?? 0;
      let npv = 0;
      for (let i = 1; i < nums.length; i++) {
        npv += nums[i] / Math.pow(1 + rate, i);
      }
      return String(Math.round(npv * 100) / 100);
    }

    // ─── IRR / TIR ────────────────────────────────────────────
    if (name === 'IRR' || name === 'TIR') {
      const cashflows = nums;
      if (cashflows.length < 2) return '#NUM!';
      let low = -0.99, high = 10, irr = 0;
      for (let iter = 0; iter < 100; iter++) {
        irr = (low + high) / 2;
        let npv = 0;
        for (let i = 0; i < cashflows.length; i++) { npv += cashflows[i] / Math.pow(1 + irr, i); }
        if (Math.abs(npv) < 0.01) break;
        if (npv > 0) low = irr; else high = irr;
      }
      return String(Math.round(irr * 10000) / 10000);
    }

    // ─── STDEV / DESVEST ──────────────────────────────────────
    if (name === 'STDEV' || name === 'DESVEST') {
      if (nums.length < 2) return '#DIV/0!';
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / (nums.length - 1);
      return String(Math.sqrt(variance));
    }

    // ─── VAR (varianza) ───────────────────────────────────────
    if (name === 'VAR' || name === 'VAR') {
      if (nums.length < 2) return '#DIV/0!';
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / (nums.length - 1);
      return String(variance);
    }

    // ─── XLOOKUP / BUSCARX ───────────────────────────────
    if (name === 'XLOOKUP' || name === 'BUSCARX') {
      const lookupValue = evalExpr(args[0] ?? '');
      const lookupRange = parseRangeStr(args[1] ?? '');
      const returnRange = parseRangeStr(args[2] ?? '');
      const ifNotFound = args[3] !== undefined ? evalExpr(args[3]) : '#N/A';
      if (!lookupRange || !returnRange) return ifNotFound;
      for (let i = 0; i < lookupRange.length; i++) {
        if (String(getVal(cells, lookupRange[i][0], lookupRange[i][1])) === String(lookupValue)) {
          const target = returnRange[i] || returnRange[0];
          return getVal(cells, target[0], target[1]);
        }
      }
      return ifNotFound;
    }

    // ─── SUMIFS / SUMAR.SI.CONJUNTO ───────────────────────
    if (name === 'SUMIFS' || name === 'SUMAR.SI.CONJUNTO') {
      const sumRange = parseRangeStr(args[0] ?? '');
      if (!sumRange) return '0';
      let sum = 0;
      for (let i = 0; i < sumRange.length; i++) {
        const [r, c] = sumRange[i];
        let match = true;
        for (let k = 1; k + 1 < args.length; k += 2) {
          const critRange = parseRangeStr(args[k] ?? '');
          const crit = evalExpr(args[k + 1] ?? '');
          if (!critRange || String(getVal(cells, critRange[i]?.[0] ?? r, critRange[i]?.[1] ?? c)) !== String(crit)) { match = false; break; }
        }
        if (match) { const v = parseFloat(getVal(cells, r, c)); if (!isNaN(v)) sum += v; }
      }
      return String(sum);
    }

    // ─── COUNTIFS / CONTAR.SI.CONJUNTO ────────────────────
    if (name === 'COUNTIFS' || name === 'CONTAR.SI.CONJUNTO') {
      // args son pares criteria_range, criteria
      let maxLen = 0;
      const pairs: { range: [number, number][] | null; crit: string }[] = [];
      for (let k = 0; k + 1 < args.length; k += 2) {
        const range = parseRangeStr(args[k] ?? '');
        const crit = evalExpr(args[k + 1] ?? '');
        pairs.push({ range, crit });
        if (range) maxLen = Math.max(maxLen, range.length);
      }
      if (maxLen === 0) return '0';
      let count = 0;
      for (let i = 0; i < maxLen; i++) {
        let match = true;
        for (const p of pairs) {
          if (!p.range) { match = false; break; }
          const v = String(getVal(cells, p.range[i]?.[0] ?? p.range[0][0], p.range[i]?.[1] ?? p.range[0][1]));
          if (v !== p.crit) { match = false; break; }
        }
        if (match) count++;
      }
      return String(count);
    }

    // ─── UNIQUE / UNICO ───────────────────────────────────
    if (name === 'UNIQUE' || name === 'UNICO') {
      const range = parseRangeStr(args[0] ?? '');
      if (!range) return '#REF!';
      const seen = new Set<string>();
      const uniq: string[] = [];
      for (const [r, c] of range) {
        const v = String(getVal(cells, r, c));
        if (!seen.has(v)) { seen.add(v); uniq.push(v); }
      }
      return uniq.join(',');
    }

    // ─── FILTER / FILTRAR ─────────────────────────────────
    if (name === 'FILTER' || name === 'FILTRAR') {
      const range = parseRangeStr(args[0] ?? '');
      const includeRange = parseRangeStr(args[1] ?? '');
      const ifEmpty = args[2] !== undefined ? evalExpr(args[2]) : '#CALC!';
      if (!range || !includeRange) return ifEmpty;
      const out: string[] = [];
      for (let i = 0; i < range.length && i < includeRange.length; i++) {
        const inc = getVal(cells, includeRange[i][0], includeRange[i][1]);
        const truthy = inc !== '0' && inc !== '' && inc.toUpperCase() !== 'FALSE';
        if (truthy) out.push(getVal(cells, range[i][0], range[i][1]));
      }
      return out.length ? out.join(',') : ifEmpty;
    }

    return '#NAME?';
  }

  try {
    return evalExpr(expr);
  } catch {
    return '#ERROR!';
  }
}

function formatValue(value: string, format?: CellFormat): string {
  if (!format?.type || !value) return value;
  if (format.type === 'text') return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const decimals = format.decimals ?? 2;
  if (format.type === 'currency') return `$${num.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  if (format.type === 'percent') return `${(num * 100).toFixed(decimals)}%`;
  if (format.type === 'number') return num.toFixed(decimals);
  return value;
}

function detectSeries(values: (string | null)[]): string[] {
  if (values.length < 2) return values.map(v => v ?? '');
  const nums = values.map(v => parseFloat(v ?? ''));
  const allNumbers = nums.every(n => !isNaN(n));
  if (allNumbers && values.length >= 2) {
    const diff = nums[1] - nums[0];
    const isArithmetic = nums.every((n, i) => i === 0 || Math.abs(n - nums[i - 1] - diff) < 0.0001);
    if (isArithmetic) {
      return values.map((_, i) => String(nums[0] + diff * i));
    }
  }
  const first = values[0];
  if (values.every(v => v === first)) {
    return values.map(() => first ?? '');
  }
  return values.map(v => v ?? '');
}

function btnStyle(colors: { bg: string; cardBg: string; cardSecondary: string; text: string; textMuted: string; primary: string; secondary: string; border: string }) {
  return {
    background: colors.cardSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    color: colors.text,
    fontSize: '13px',
  };
}

interface SpreadsheetSimProps {
  theme: Theme;
  onBack: () => void;
}

export default function SpreadsheetSim({ theme, onBack }: SpreadsheetSimProps) {
  const colors = themeColors[theme];
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [selection, setSelection] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number }>({
    startRow: 0, startCol: 0, endRow: 0, endCol: 0,
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([{ cells: new Map() }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [autoFillStart, setAutoFillStart] = useState<{ row: number; col: number } | null>(null);
  const [autoFillEnd, setAutoFillEnd] = useState<{ row: number; col: number } | null>(null);
  const [activeFormat, setActiveFormat] = useState<CellFormat>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const pushHistory = useCallback((newCells: Map<string, CellData>) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ cells: new Map(newCells) });
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setCells(new Map(prev.cells));
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setCells(new Map(next.cells));
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const getDisplayValue = useCallback((row: number, col: number): string => {
    const id = cellId(row, col);
    const cell = cells.get(id);
    if (!cell) return '';
    if (cell.value.startsWith('=')) {
      return evaluateFormula(cell.value, cells, getCellValue, getNumericValue);
    }
    return cell.value;
  }, [cells]);

  const selectionStats = useMemo(() => {
    const { startRow, startCol, endRow, endCol } = selection;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    let sum = 0;
    let count = 0;
    let numCount = 0;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const v = getDisplayValue(r, c);
        if (v !== '') {
          count++;
          const n = parseFloat(v);
          if (!isNaN(n)) {
            sum += n;
            numCount++;
          }
        }
      }
    }
    const avg = numCount > 0 ? sum / numCount : 0;
    return { sum, avg, count, numCount };
  }, [selection, cells, getDisplayValue]);

  const selRect = useMemo(() => ({
    minRow: Math.min(selection.startRow, selection.endRow),
    maxRow: Math.max(selection.startRow, selection.endRow),
    minCol: Math.min(selection.startCol, selection.endCol),
    maxCol: Math.max(selection.startCol, selection.endCol),
  }), [selection]);

  const isCellSelected = useCallback((row: number, col: number): boolean => {
    return row >= selRect.minRow && row <= selRect.maxRow && col >= selRect.minCol && col <= selRect.maxCol;
  }, [selRect]);

  const isCellHighlighted = useCallback((row: number, col: number): boolean => {
    return highlightedCells.has(cellId(row, col));
  }, [highlightedCells]);

  const commitEdit = useCallback(() => {
    if (!editMode) return;
    const id = cellId(selectedCell.row, selectedCell.col);
    const newCells = new Map(cells);
    const existing = newCells.get(id);
    newCells.set(id, { value: editValue, format: existing?.format });
    setCells(newCells);
    pushHistory(newCells);
    setEditMode(false);
  }, [editMode, editValue, selectedCell, cells, pushHistory]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditValue('');
  }, []);

  const handleCellMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (editMode) {
      commitEdit();
    }
    setSelectedCell({ row, col });
    if (!e.shiftKey) {
      setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
      setAutoFillStart({ row, col });
      setAutoFillEnd(null);
    } else {
      setSelection(prev => ({ ...prev, endRow: row, endCol: col }));
    }
    setIsSelecting(true);
    const id = cellId(row, col);
    const cell = cells.get(id);
    setActiveFormat(cell?.format ?? {});
  }, [editMode, cells, commitEdit]);

  const handleCellClick = useCallback((row: number, col: number, shiftKey: boolean) => {
    if (shiftKey) {
      setSelection(prev => ({ ...prev, endRow: row, endCol: col }));
    }
  }, []);

  const handleCellMouseMove = useCallback((row: number, col: number) => {
    if (isSelecting && !editMode) {
      setSelection(prev => ({ ...prev, endRow: row, endCol: col }));
    }
    if (autoFillStart && isSelecting) {
      setAutoFillEnd({ row, col });
    }
  }, [isSelecting, editMode, autoFillStart]);

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditMode(true);
    const id = cellId(row, col);
    const cell = cells.get(id);
    setEditValue(cell?.value ?? '');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [cells]);

  const copySelection = useCallback((isCut: boolean) => {
    const { minRow, maxRow, minCol, maxCol } = selRect;
    const clipCells = new Map<string, CellData>();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const id = cellId(r, c);
        const cell = cells.get(id);
        if (cell) clipCells.set(id, { ...cell });
      }
    }
    setClipboard({
      cells: clipCells,
      startRow: minRow,
      startCol: minCol,
      endRow: maxRow,
      endCol: maxCol,
      isCut,
    });
    const textLines: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const rowVals: string[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        rowVals.push(getDisplayValue(r, c));
      }
      textLines.push(rowVals.join('\t'));
    }
    navigator.clipboard?.writeText(textLines.join('\n')).catch(() => {});
  }, [selRect, cells, getDisplayValue]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard) return;
    const newCells = new Map(cells);
    const { startRow: srcStartRow, startCol: srcStartCol, endRow: srcEndRow, endCol: srcEndCol, cells: clipCells } = clipboard;
    const rows = srcEndRow - srcStartRow;
    const cols = srcEndCol - srcStartCol;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const srcRow = srcStartRow + r;
        const srcCol = srcStartCol + c;
        const srcId = cellId(srcRow, srcCol);
        const targetRow = selectedCell.row + r;
        const targetCol = selectedCell.col + c;
        if (targetRow < ROWS && targetCol < COLUMNS) {
          const targetId = cellId(targetRow, targetCol);
          const srcCell = clipCells.get(srcId);
          if (srcCell) {
            newCells.set(targetId, { ...srcCell });
          }
        }
      }
    }
    if (clipboard.isCut) {
      for (let r = srcStartRow; r <= srcEndRow; r++) {
        for (let c = srcStartCol; c <= srcEndCol; c++) {
          newCells.delete(cellId(r, c));
        }
      }
      setClipboard(null);
    }
    setCells(newCells);
    pushHistory(newCells);
  }, [clipboard, cells, selectedCell, pushHistory]);

  const deleteSelection = useCallback(() => {
    const { minRow, maxRow, minCol, maxCol } = selRect;
    const newCells = new Map(cells);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        newCells.delete(cellId(r, c));
      }
    }
    setCells(newCells);
    pushHistory(newCells);
  }, [selRect, cells, pushHistory]);

  const applyFormat = useCallback((format: Partial<CellFormat>) => {
    const { minRow, maxRow, minCol, maxCol } = selRect;
    const newCells = new Map(cells);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const id = cellId(r, c);
        const existing = newCells.get(id) ?? { value: '' };
        newCells.set(id, {
          ...existing,
          format: { ...existing.format, ...format },
        });
      }
    }
    setCells(newCells);
    pushHistory(newCells);
    setActiveFormat(prev => ({ ...prev, ...format }));
  }, [selRect, cells, pushHistory]);

  const findAndReplace = useCallback(() => {
    if (!findText) return;
    const newCells = new Map(cells);
    let found = false;
    Array.from(newCells.entries()).forEach(([id, cell]) => {
      if (cell.value.includes(findText)) {
        newCells.set(id, { ...cell, value: cell.value.replace(findText, replaceText) });
        found = true;
      }
    });
    if (found) {
      setCells(newCells);
      pushHistory(newCells);
    }
  }, [findText, replaceText, cells, pushHistory]);

  const findNext = useCallback(() => {
    if (!findText) return;
    const highlights = new Set<string>();
    Array.from(cells.entries()).forEach(([id, cell]) => {
      if (cell.value.includes(findText)) {
        highlights.add(id);
      }
    });
    setHighlightedCells(highlights);
  }, [findText, cells]);

  const insertRow = useCallback((above: boolean) => {
    const insertAt = above ? selectedCell.row : selectedCell.row + 1;
    const newCells = new Map<string, CellData>();
    Array.from(cells.entries()).forEach(([id, cell]) => {
      const parsed = parseCellRef(id);
      if (parsed) {
        if (parsed.row >= insertAt) {
          const newId = cellId(parsed.row + 1, parsed.col);
          newCells.set(newId, cell);
        } else {
          newCells.set(id, cell);
        }
      }
    });
    setCells(newCells);
    pushHistory(newCells);
  }, [cells, selectedCell, pushHistory]);

  const exportCsv = useCallback(() => {
    const rows: string[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: string[] = [];
      for (let c = 0; c < COLUMNS; c++) {
        row.push(getDisplayValue(r, c));
      }
      rows.push(row);
    }
    const csvContent = rows.map(row =>
      row.map(cell => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hoja_calculo.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [getDisplayValue]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu.visible) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible, closeContextMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (contextMenu.visible) {
        if (e.key === 'Escape') closeContextMenu();
        return;
      }
      if (findReplaceOpen) {
        if (e.key === 'Escape') setFindReplaceOpen(false);
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') { e.preventDefault(); copySelection(false); }
        else if (e.key === 'x') { e.preventDefault(); copySelection(true); }
        else if (e.key === 'v') { e.preventDefault(); pasteClipboard(); }
        else if (e.key === 'z') { e.preventDefault(); undo(); }
        else if (e.key === 'y') { e.preventDefault(); redo(); }
        else if (e.key === 'f') { e.preventDefault(); setFindReplaceOpen(true); }
        else if (e.key === 'b') { e.preventDefault(); applyFormat({ bold: !activeFormat.bold }); }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!editMode) {
          e.preventDefault();
          deleteSelection();
        }
      }
      if (e.key === 'Escape' && editMode) {
        cancelEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelection, pasteClipboard, undo, redo, deleteSelection, editMode, cancelEdit, findReplaceOpen, applyFormat, activeFormat, contextMenu.visible, closeContextMenu]);

  useEffect(() => {
    if (containerRef.current) {
      const cellEl = containerRef.current.querySelector(`[data-cell="${cellId(selectedCell.row, selectedCell.col)}"]`);
      if (cellEl) {
        cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [selectedCell]);

  useEffect(() => {
    if (!editMode) {
      const id = cellId(selectedCell.row, selectedCell.col);
      const cell = cells.get(id);
      setFormulaBarValue(cell?.value ?? '');
    }
  }, [selectedCell, cells, editMode]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isSelecting && autoFillStart && autoFillEnd) {
        if (autoFillEnd.row > autoFillStart.row) {
          const sourceValues: (string | null)[] = [];
          for (let c = autoFillStart.col; c <= Math.max(autoFillStart.col, autoFillEnd.col); c++) {
            const v = getDisplayValue(autoFillStart.row, c);
            sourceValues.push(v || null);
          }
          const filled = detectSeries(sourceValues);
          const newCells = new Map(cells);
          for (let r = autoFillStart.row + 1; r <= autoFillEnd.row; r++) {
            for (let c = autoFillStart.col; c <= Math.max(autoFillStart.col, autoFillEnd.col); c++) {
              const cIdx = c - autoFillStart.col;
              const val = filled[cIdx % filled.length];
              const id = cellId(r, c);
              const existing = newCells.get(id);
              newCells.set(id, { value: val ?? '', format: existing?.format });
            }
          }
          setCells(newCells);
          pushHistory(newCells);
        }
      }
      setIsSelecting(false);
      setAutoFillStart(null);
      setAutoFillEnd(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isSelecting, autoFillStart, autoFillEnd, cells, getDisplayValue, pushHistory]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const containerHeight = containerRef.current?.clientHeight || 600;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endRow = Math.min(ROWS - 1, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER);
  const visibleRows = Array.from({ length: endRow - startRow + 1 }, (_, i) => startRow + i);
  const totalHeight = ROWS * ROW_HEIGHT;
  const offsetY = startRow * ROW_HEIGHT;

  const renderCellContent = (row: number, col: number) => {
    const id = cellId(row, col);
    const cell = cells.get(id);
    const displayVal = getDisplayValue(row, col);
    const formatted = formatValue(displayVal, cell?.format);
    const isActive = selectedCell.row === row && selectedCell.col === col;

    if (isActive && editMode) {
      return (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitEdit();
              setSelectedCell(prev => ({ ...prev, row: Math.min(prev.row + 1, ROWS - 1) }));
            }
            else if (e.key === 'Tab') {
              e.preventDefault();
              commitEdit();
              setSelectedCell(prev => ({ ...prev, col: Math.min(prev.col + 1, COLUMNS - 1) }));
            }
            else if (e.key === 'Escape') cancelEdit();
          }}
          onBlur={commitEdit}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            background: colors.cardBg,
            color: colors.text,
            fontSize: '13px',
            padding: '0 4px',
            fontFamily: 'inherit',
          }}
        />
      );
    }

    return (
      <span style={{
        fontWeight: cell?.format?.bold ? 'bold' : 'normal',
        fontStyle: cell?.format?.italic ? 'italic' : 'normal',
        color: cell?.format?.textColor || colors.text,
      }}>
        {formatted}
      </span>
    );
  };

  const contextMenuItems = [
    { label: 'Cortar', shortcut: 'Ctrl+X', action: () => copySelection(true) },
    { label: 'Copiar', shortcut: 'Ctrl+C', action: () => copySelection(false) },
    { label: 'Pegar', shortcut: 'Ctrl+V', action: () => pasteClipboard() },
    { label: 'Borrar', shortcut: 'Del', action: () => deleteSelection() },
    { divider: true },
    { label: 'Formato Moneda ($)', action: () => applyFormat({ type: 'currency' }) },
    { label: 'Formato Porcentaje (%)', action: () => applyFormat({ type: 'percent' }) },
    { label: 'Formato Number', action: () => applyFormat({ type: 'number' }) },
    { divider: true },
    { label: 'Insertar fila arriba', action: () => insertRow(true) },
    { label: 'Insertar fila abajo', action: () => insertRow(false) },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: colors.bg,
      color: colors.text,
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '13px',
      userSelect: 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px 8px',
        borderBottom: `1px solid ${colors.border}`,
        background: colors.cardSecondary,
        flexWrap: 'wrap',
      }}>
        <button onClick={onBack} style={{
          background: colors.cardSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          color: colors.text,
          fontSize: '14px',
          marginRight: '8px',
        }}>← Escritorio</button>

        <button onClick={() => copySelection(false)} style={btnStyle(colors)} title="Copiar (Ctrl+C)">Copiar</button>
        <button onClick={() => copySelection(true)} style={btnStyle(colors)} title="Cortar (Ctrl+X)">Cortar</button>
        <button onClick={pasteClipboard} style={btnStyle(colors)} title="Pegar (Ctrl+V)">Pegar</button>
        <button onClick={deleteSelection} style={btnStyle(colors)} title="Borrar (Del)">Borrar</button>

        <div style={{ width: '1px', height: '20px', background: colors.border, margin: '0 4px' }} />

        <button onClick={undo} style={btnStyle(colors)} title="Deshacer (Ctrl+Z)">Deshacer</button>
        <button onClick={redo} style={btnStyle(colors)} title="Rehacer (Ctrl+Y)">Rehacer</button>

        <div style={{ width: '1px', height: '20px', background: colors.border, margin: '0 4px' }} />

        <button onClick={() => setFindReplaceOpen(true)} style={btnStyle(colors)} title="Buscar (Ctrl+F)">Buscar</button>

        <div style={{ width: '1px', height: '20px', background: colors.border, margin: '0 4px' }} />

        <button onClick={() => applyFormat({ bold: !activeFormat.bold })} style={{
          ...btnStyle(colors),
          fontWeight: 'bold',
          background: activeFormat.bold ? colors.primary : colors.cardSecondary,
        }} title="Negrita (Ctrl+B)">B</button>
        <button onClick={() => applyFormat({ italic: !activeFormat.italic })} style={{
          ...btnStyle(colors),
          fontStyle: 'italic',
          background: activeFormat.italic ? colors.primary : colors.cardSecondary,
        }} title="Cursiva">I</button>

        <div style={{ width: '1px', height: '20px', background: colors.border, margin: '0 4px' }} />

        <button onClick={() => applyFormat({ type: activeFormat.type === 'currency' ? undefined : 'currency' })} style={{
          ...btnStyle(colors),
          background: activeFormat.type === 'currency' ? colors.primary : colors.cardSecondary,
        }} title="Moneda">$</button>
        <button onClick={() => applyFormat({ type: activeFormat.type === 'percent' ? undefined : 'percent' })} style={{
          ...btnStyle(colors),
          background: activeFormat.type === 'percent' ? colors.primary : colors.cardSecondary,
        }} title="Porcentaje">%</button>
        <button onClick={() => applyFormat({ decimals: Math.max(0, (activeFormat.decimals ?? 2) - 1) })} style={btnStyle(colors)} title="Decimales -">0.0→0</button>
        <button onClick={() => applyFormat({ decimals: (activeFormat.decimals ?? 2) + 1 })} style={btnStyle(colors)} title="Decimales +">0→0.0</button>

        <div style={{ width: '1px', height: '20px', background: colors.border, margin: '0 4px' }} />

        <label style={{ fontSize: '13px', color: colors.text }}>Color:</label>
        <input
          type="color"
          value={activeFormat.textColor || '#000000'}
          onChange={(e) => applyFormat({ textColor: e.target.value })}
          style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', padding: 0 }}
          title="Color de texto"
        />
        <label style={{ fontSize: '13px', color: colors.text, marginLeft: '4px' }}>Fondo:</label>
        <input
          type="color"
          value={activeFormat.bgColor || '#ffffff'}
          onChange={(e) => applyFormat({ bgColor: e.target.value })}
          style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', padding: 0 }}
          title="Color de fondo"
        />

        <div style={{ width: '1px', height: '20px', background: colors.border, margin: '0 4px' }} />

        <button onClick={exportCsv} style={btnStyle(colors)} title="Exportar CSV">Exportar CSV</button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderBottom: `1px solid ${colors.border}`,
        background: colors.cardSecondary,
        gap: '8px',
      }}>
        <div style={{
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '3px',
          padding: '2px 8px',
          minWidth: '60px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 'bold',
        }}>
          {cellId(selectedCell.row, selectedCell.col)}
        </div>
        <div style={{ color: colors.textMuted, fontSize: '13px' }}>=</div>
        <input
          value={formulaBarValue}
          onChange={(e) => {
            setFormulaBarValue(e.target.value);
            setEditValue(e.target.value);
            setEditMode(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { commitEdit(); setEditMode(false); }
            else if (e.key === 'Escape') { cancelEdit(); setEditMode(false); }
          }}
          style={{
            flex: 1,
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '3px',
            padding: '2px 8px',
            color: colors.text,
            fontSize: '13px',
            fontFamily: 'Consolas, monospace',
          }}
        />
      </div>

      {findReplaceOpen && (
        <div style={{
          position: 'absolute',
          top: '100px',
          right: '20px',
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '12px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          minWidth: '280px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>Buscar y Reemplazar</span>
            <button onClick={() => { setFindReplaceOpen(false); setHighlightedCells(new Set()); }} style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', color: colors.textMuted }}>Buscar:</label>
            <input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') findNext(); }}
              style={{
                width: '100%',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '3px',
                padding: '4px 8px',
                color: colors.text,
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', color: colors.textMuted }}>Reemplazar:</label>
            <input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              style={{
                width: '100%',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '3px',
                padding: '4px 8px',
                color: colors.text,
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={findNext} style={{ ...btnStyle(colors), flex: 1 }}>Buscar</button>
            <button onClick={findAndReplace} style={{ ...btnStyle(colors), flex: 1 }}>Reemplazar</button>
          </div>
        </div>
      )}

      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            padding: '4px 0',
            zIndex: 2000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            minWidth: '200px',
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenuItems.map((item, i) => {
            if ('divider' in item && item.divider) {
              return <div key={i} style={{ height: '1px', background: colors.border, margin: '4px 0' }} />;
            }
            return (
              <div
                key={i}
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: colors.text,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = colors.primary;
                  (e.currentTarget as HTMLDivElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  (e.currentTarget as HTMLDivElement).style.color = colors.text;
                }}
                onClick={() => {
                  if ('action' in item && item.action) {
                    item.action();
                  }
                  closeContextMenu();
                }}
              >
                <span>{item.label}</span>
                {'shortcut' in item && item.shortcut && (
                  <span style={{ fontSize: '11px', color: colors.textMuted, marginLeft: '24px' }}>{item.shortcut}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div ref={containerRef} onScroll={handleScroll} style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
      }} onContextMenu={handleContextMenu}>
        <table style={{
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}>
          <thead>
            <tr>
              <th style={{
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 20,
                background: colors.cardSecondary,
                border: `1px solid ${colors.border}`,
                width: '40px',
                minWidth: '40px',
              }} />
              {Array.from({ length: COLUMNS }, (_, c) => (
                <th key={c} style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: colors.cardSecondary,
                  border: `1px solid ${colors.border}`,
                  width: '80px',
                  minWidth: '80px',
                  padding: '4px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}>
                  {colToLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ height: `${totalHeight}px` }}>
            <tr style={{ height: `${offsetY}px` }}><td colSpan={COLUMNS + 1} style={{ padding: 0, border: 'none' }} /></tr>
            {visibleRows.map(r => (
              <tr key={r}>
                <td style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 5,
                  background: colors.cardSecondary,
                  border: `1px solid ${colors.border}`,
                  width: '40px',
                  minWidth: '40px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  height: `${ROW_HEIGHT}px`,
                }}>
                  {r + 1}
                </td>
                {Array.from({ length: COLUMNS }, (_, c) => {
                  const id = cellId(r, c);
                  const cell = cells.get(id);
                  const selected = isCellSelected(r, c);
                  const active = selectedCell.row === r && selectedCell.col === c;
                  const highlighted = isCellHighlighted(r, c);

                  return (
                    <td
                      key={c}
                      data-cell={id}
                      onMouseDown={(e) => handleCellMouseDown(r, c, e)}
                      onMouseMove={() => handleCellMouseMove(r, c)}
                      onClick={(e) => handleCellClick(r, c, e.shiftKey)}
                      onDoubleClick={() => handleCellDoubleClick(r, c)}
                      style={{
                        border: `1px solid ${colors.border}`,
                        padding: '0 4px',
                        height: `${ROW_HEIGHT}px`,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        background: highlighted
                          ? colors.primary
                          : cell?.format?.bgColor
                            ? cell.format.bgColor
                            : active
                              ? colors.primary
                              : selected
                                ? colors.cardSecondary
                                : colors.cardBg,
                        color: cell?.format?.textColor || colors.text,
                        textAlign: cell?.format?.align || 'left',
                        cursor: 'cell',
                        position: 'relative',
                      }}
                    >
                      {renderCellContent(r, c)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px',
        borderTop: `1px solid ${colors.border}`,
        background: colors.cardSecondary,
        fontSize: '13px',
        color: colors.textMuted,
        gap: '16px',
      }}>
        <div>
          Celdas: {selectionStats.count}
          {selectionStats.numCount > 0 && (
            <> | Suma: {selectionStats.sum.toFixed(2)} | Promedio: {selectionStats.avg.toFixed(2)} | Num: {selectionStats.numCount}</>
          )}
        </div>
        <div>
          Hist: {historyIndex + 1}/{history.length}
        </div>
      </div>
    </div>
  );
}
