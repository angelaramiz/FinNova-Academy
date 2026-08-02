import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';

export default function Calculator({ theme, onBack }: { theme: Theme; onBack: () => void }) {
  const colors = themeColors[theme];
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [firstNumber, setFirstNumber] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);

  function input(n: string) {
    if (n === '.' && display.includes('.')) return;
    const next = (display === '0' && n !== '.' ? n : display === '0' && n === '.' ? '0.' : display + n);
    setDisplay(next);
    // Preview del resultado
    if (pendingOp !== null && firstNumber !== null) {
      const b = parseFloat(next);
      if (isNaN(b)) return;
      const op = opMap[pendingOp] || pendingOp;
      const r = op === '+' ? firstNumber + b
        : op === '-' ? firstNumber - b
        : op === '*' ? firstNumber * b
        : op === '/' && b !== 0 ? firstNumber / b : 0;
      setResult(`= ${String(Math.round(r * 100) / 100)}`);
    }
  }

  function operate(op: string) {
    setFirstNumber(parseFloat(display));
    setPendingOp(op);
    setExpression(display + ` ${op} `);
    setDisplay('');
    setResult('');
  }

  function calculate() {
    if (firstNumber === null || pendingOp === null) return;
    const b = parseFloat(display);
    const op = opMap[pendingOp] || pendingOp;
    const r = op === '+' ? firstNumber + b
      : op === '-' ? firstNumber - b
      : op === '*' ? firstNumber * b
      : op === '/' && b !== 0 ? firstNumber / b : 0;
    const val = String(Math.round(r * 100) / 100);
    setExpression(firstNumber + ' ' + pendingOp + ' ' + b + ' =');
    setDisplay(val);
    setResult('');
    setFirstNumber(null);
    setPendingOp(null);
  }

  function clear() { setDisplay('0'); setExpression(''); setFirstNumber(null); setPendingOp(null); setResult(''); }
  function backspace() { setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0'); }

  const isDark = theme === 'dark';
  // Teclado físico
  const opMap: Record<string, string> = { '+': '+', '-': '-', '×': '*', '÷': '/', '%': '%' };
  const btns = [['C','⌫','%','÷'],['7','8','9','×'],['4','5','6','-'],['1','2','3','+']];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const keyMap: Record<string, string> = {
        '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
        '.':'.','+':'+','-':'-','*':'×','/':'÷',
        'Enter':'=','=':'=','Escape':'C','Delete':'C','Backspace':'⌫',
        '%':'%',
      };
      const mapped = keyMap[e.key];
      if (mapped) {
        e.preventDefault();
        if ('0123456789.'.includes(mapped)) input(mapped);
        else if ('+-×÷'.includes(mapped)) operate(mapped);
        else if (mapped === '=') calculate();
        else if (mapped === 'C') clear();
        else if (mapped === '⌫') backspace();
        else if (mapped === '%') setDisplay(String(parseFloat(display) / 100));
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [display, expression, firstNumber, pendingOp]);

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
          <div className="text-right text-[11px] font-mono mb-1 truncate" style={{ color: colors.textMuted, minHeight: '16px' }}>{expression}</div>
          <div className="text-right font-mono font-bold text-2xl tracking-wider truncate" style={{ color: colors.text }}>{display}</div>
          <div className="text-right text-sm font-mono mt-1 min-h-[20px]" style={{ color: colors.primary }}>{result}</div>
        </div>
        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2 flex-1">
          {btns.flat().map(b => (
            <button key={b} onClick={() => {
              if ('0123456789.'.includes(b)) input(b);
              else if ('+-×÷'.includes(b)) operate(b);
              else if (b === 'C') clear();
              else if (b === '⌫') backspace();
              else if (b === '%') setDisplay(String(parseFloat(display) / 100));
              else if (b === '=') calculate();
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
