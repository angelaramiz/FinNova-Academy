import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface DataHighlightProps {
  theme: Theme;
  fields: { label: string; value: string; icon?: string }[];
  onCopy?: (label: string, value: string) => void;
}

export default function DataHighlight({ theme, fields }: DataHighlightProps) {
  const colors = themeColors[theme];
  return (
    <div className="rounded-xl border-2 p-3" style={{ borderColor: '#f59e0b50', background: '#f59e0b10' }}>
      <p className="text-[10px] font-bold font-mono mb-1" style={{ color: '#f59e0b' }}>💡 Pistas: dónde está cada dato y a dónde va</p>
      <p className="text-[9px] font-mono mb-2" style={{ color: colors.textMuted }}>Como la burbuja Guía: indica el mapeo, no la respuesta.</p>
      <div className="grid gap-1.5">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg border" style={{ borderColor: colors.border, background: 'transparent' }}>
            <span className="text-[10px]">{f.icon || '📌'}</span>
            <span className="font-mono font-bold shrink-0" style={{ color: colors.text }}>{f.label}:</span>
            <span className="font-mono ml-auto text-right" style={{ color: colors.textMuted }}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
