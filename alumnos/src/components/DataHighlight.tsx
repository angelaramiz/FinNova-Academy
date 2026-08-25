import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface DataHighlightProps {
  theme: Theme;
  fields: { label: string; value: string; icon?: string }[];
  onCopy?: (label: string, value: string) => void;
}

export default function DataHighlight({ theme, fields, onCopy }: DataHighlightProps) {
  const colors = themeColors[theme];
  const [copied, setCopied] = useState<string | null>(null);

  function handleCopy(label: string, value: string) {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(label);
    onCopy?.(label, value);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="rounded-xl border-2 p-3" style={{ borderColor: '#f59e0b50', background: '#f59e0b10' }}>
      <p className="text-[10px] font-bold font-mono mb-2" style={{ color: '#f59e0b' }}>⚡ Datos clave del documento — copia al portal:</p>
      <div className="grid gap-1.5">
        {fields.map((f, i) => (
          <button key={i} onClick={() => handleCopy(f.label, f.value)}
            className="flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg border cursor-pointer hover:opacity-80 transition text-left"
            style={{ borderColor: copied === f.label ? '#22c55e' : colors.border, background: copied === f.label ? '#22c55e10' : 'transparent' }}>
            <span className="text-[10px]">{f.icon || '📌'}</span>
            <span className="font-mono font-bold shrink-0" style={{ color: colors.text }}>{f.label}:</span>
            <span className="font-mono ml-auto" style={{ color: copied === f.label ? '#22c55e' : '#f59e0b', background: '#f59e0b10', padding: '1px 6px', borderRadius: 4 }}>{f.value}</span>
            {copied === f.label && <span className="text-[9px]" style={{ color: '#22c55e' }}>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
