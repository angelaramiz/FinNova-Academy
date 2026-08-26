import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface DualViewLayoutProps {
  theme: Theme;
  portalTitle: string;
  portalIcon: string;
  documentHtml: string;
  highlightFields?: { label: string; value: string; selector?: string }[];
  onPortalSubmit?: (answers: Record<string, any>) => void;
  portalContent?: React.ReactNode;
}

export default function DualViewLayout({ theme, portalTitle, portalIcon, documentHtml, highlightFields = [], onPortalSubmit, portalContent }: DualViewLayoutProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  // Como la burbuja Guía: oculto por defecto, el alumno pide la pista
  const [showHighlight, setShowHighlight] = useState(false);

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-3 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-[13px] font-bold font-mono" style={{ color: colors.text }}>{portalIcon} {portalTitle}</span>
        <div className="flex-1" />
        <button onClick={() => setShowHighlight(!showHighlight)}
          className="px-2 py-1 rounded text-[10px] font-mono cursor-pointer border"
          style={{ borderColor: colors.primary, color: showHighlight ? colors.primary : colors.textMuted, background: showHighlight ? colors.primary + '15' : 'transparent' }}>
          {showHighlight ? '◉ Ocultar pistas' : '○ Mostrar pistas'}
        </button>
      </div>

      {/* 2-column layout */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Portal */}
        <div className="flex-1 border-r-2 overflow-auto p-4" style={{ borderColor: colors.border, minWidth: '50%' }}>
          <div className="mb-3">
            <h3 className="text-[12px] font-bold font-mono mb-2" style={{ color: colors.text }}>{portalIcon} Portal</h3>
          </div>
          {portalContent || (
            <div className="text-center py-12" style={{ color: colors.textMuted }}>
              <p className="text-[11px]">Portal en desarrollo...</p>
            </div>
          )}
        </div>

        {/* RIGHT: Document */}
        <div className="flex-1 overflow-auto p-4" style={{ minWidth: '50%', background: isDark ? 'rgba(0,0,0,0.1)' : '#f8fafc' }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>📄 Documento</h3>
          </div>

          {/* Highlight — como burbuja Guía: pista de mapeo, no respuestas */}
          {showHighlight && highlightFields.length > 0 && (
            <div className="mb-3 p-3 rounded-xl border-2" style={{ borderColor: '#f59e0b50', background: '#f59e0b10' }}>
              <p className="text-[10px] font-bold font-mono mb-1" style={{ color: '#f59e0b' }}>💡 Pistas: dónde está cada dato y a dónde va</p>
              <p className="text-[9px] font-mono mb-2" style={{ color: colors.textMuted }}>Lee el TICKET y ubica cada campo. Las pistas no dan la respuesta — indican el mapeo, como la burbuja Guía.</p>
              <div className="space-y-1.5">
                {highlightFields.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="text-[10px]">{(f as any).icon || '•'}</span>
                    <span className="font-mono font-bold" style={{ color: colors.text }}>{f.label}:</span>
                    <span className="font-mono" style={{ color: colors.textMuted, background: isDark ? '#ffffff0a' : '#00000006', padding: '1px 6px', borderRadius: 4 }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document iframe */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.border, background: '#fff' }}>
            <iframe srcDoc={documentHtml} className="w-full" style={{ minHeight: 500, border: 'none' }} title="Documento" />
          </div>
        </div>
      </div>
    </div>
  );
}
