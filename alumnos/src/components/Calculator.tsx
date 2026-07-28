import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

export default function Calculator({ theme, onBack }: { theme: Theme; onBack: () => void }) {
  const colors = themeColors[theme];
  const [expression, setExpression] = useState('');
  const [current, setCurrent] = useState('0');
  const [result, setResult] = useState('');
  const [newNumber, setNewNumber] = useState(true);
  const [lastOp, setLastOp] = useState('');

  function input(n: string) {
    if (n === '.' && current.includes('.')) return;
    const next = newNumber ? (n === '.' ? '0.' : n) : (current === '0' && n !== '.' ? n : current + n);
    setCurrent(next);
    setNewNumber(false);
    if (lastOp) {
      try {
        const a = parseFloat(expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/=/g, '').split(/[+\-*/]/).pop() || '0');
        const op = lastOp === '×' ? '*' : lastOp === '÷' ? '/' : lastOp;
        const b = parseFloat(next);
        const r = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : op === '/' ? (b !== 0 ? a / b : 0) : b;
        setResult(`= ${String(Math.round(r * 100) / 100)}`);
      } catch { setResult(''); }
    }
  }

  function operate(op: string) {
    setExpression(prev => prev + (current || '0') + ` ${op} `);
    setCurrent('');
    setNewNumber(true);
    setLastOp(op);
    setResult('');
  }

  function calculate() {
    const full = expression + (current || '0');
    try {
      const sanitized = full.replace(/×/g, '*').replace(/÷/g, '/');
      const r = new Function(`return (${sanitized})`)();
      const val = String(Math.round(Number(r) * 100) / 100);
      setExpression(full + ` =`);
      setCurrent(val);
      setResult('');
      setNewNumber(true);
      setLastOp('');
    } catch { setResult('= Error'); }
  }

  function clear() {
    setExpression(''); setCurrent('0'); setResult(''); setNewNumber(true); setLastOp('');
  }

  function backspace() {
    if (newNumber) return;
    setCurrent(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  }

  const btns = [
    ['C','⌫','%','÷'],
    ['7','8','9','×'],
    ['4','5','6','-'],
    ['1','2','3','+'],
  ];

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
        <button onClick={onBack} className="text-[10px] px-2 py-1 rounded border cursor-pointer hover:opacity-70 shrink-0" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🧮</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Calculadora</span>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Display area */}
        <div className="rounded-xl border-2 p-4 min-h-[90px] flex flex-col justify-end" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff' }}>
          <div className="text-right text-[11px] font-mono mb-1 truncate" style={{ color: colors.textMuted, minHeight: '16px' }}>
            {expression}
          </div>
          <div className="text-right font-mono font-bold text-2xl tracking-wider truncate" style={{ color: colors.text }}>
            {current}
          </div>
          <div className="text-right text-sm font-mono mt-1 min-h-[20px]" style={{ color: colors.primary }}>
            {result}
          </div>
        </div>
        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2 flex-1">
          {btns.flat().map(b => (
            <button key={b} onClick={() => {
              if ('0123456789.'.includes(b)) input(b);
              else if ('+-×÷'.includes(b)) operate(b);
              else if (b === 'C') clear();
              else if (b === '⌫') backspace();
              else if (b === '%') { setCurrent(String(parseFloat(current) / 100)); }
            }} className="rounded-xl border-2 text-base font-bold cursor-pointer hover:opacity-80 transition flex items-center justify-center" style={{
              borderColor: colors.border, background: '+-×÷'.includes(b) ? colors.primary + '20' : b === 'C' ? '#ef444410' : colors.cardBg,
              color: b === 'C' ? '#ef4444' : '+-×÷'.includes(b) ? colors.primary : colors.text,
              boxShadow: `2px 2px 0px 0px ${colors.border}`,
            }}>{b}</button>
          ))}
          <button onClick={calculate} className="col-span-4 rounded-xl border-2 text-lg font-bold cursor-pointer hover:opacity-85 transition" style={{
            borderColor: colors.primary, background: colors.primary, color: '#1B2632',
            boxShadow: `3px 3px 0px 0px ${colors.border}`,
          }}>=</button>
        </div>
      </div>
    </div>
  );
}
