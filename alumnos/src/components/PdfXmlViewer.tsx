import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface PdfXmlViewerProps {
  theme: Theme;
  xml: string;
  pdfHtml: string;
  data: any;
  onDownload?: (format: 'pdf' | 'xml') => void;
}

export default function PdfXmlViewer({ theme, xml, pdfHtml, data, onDownload }: PdfXmlViewerProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [view, setView] = useState<'pdf' | 'xml'>('pdf');

  function download(format: 'pdf' | 'xml') {
    if (format === 'xml') {
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CFDI-${data.invoiceNumber || 'factura'}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([pdfHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CFDI-${data.invoiceNumber || 'factura'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onDownload?.(format);
  }

  return (
    <div className="flex flex-col h-full" style={{ background: colors.bg }}>
      <div className="px-3 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>📄 CFDI Generado</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          <button onClick={() => setView('pdf')} className="px-2 py-1 rounded text-[10px] font-mono cursor-pointer border" style={{ borderColor: colors.primary, background: view === 'pdf' ? colors.primary : 'transparent', color: view === 'pdf' ? '#1B2632' : colors.textMuted }}>PDF</button>
          <button onClick={() => setView('xml')} className="px-2 py-1 rounded text-[10px] font-mono cursor-pointer border" style={{ borderColor: colors.primary, background: view === 'xml' ? colors.primary : 'transparent', color: view === 'xml' ? '#1B2632' : colors.textMuted }}>XML</button>
        </div>
        <button onClick={() => download('pdf')} className="px-2 py-1 rounded text-[10px] font-mono cursor-pointer border ml-1" style={{ borderColor: '#22c55e', color: '#22c55e' }}>⬇ PDF</button>
        <button onClick={() => download('xml')} className="px-2 py-1 rounded text-[10px] font-mono cursor-pointer border ml-1" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>⬇ XML</button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {view === 'pdf' ? (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.border, background: '#fff' }}>
            <iframe srcDoc={pdfHtml} className="w-full" style={{ minHeight: 500, border: 'none' }} title="CFDI PDF" />
          </div>
        ) : (
          <pre className="p-3 rounded-xl border text-[10px] font-mono leading-relaxed overflow-auto" style={{ borderColor: colors.border, background: isDark ? '#0a0f1a' : '#f8fafc', color: '#e2e8f0', maxHeight: 500 }}>{xml}</pre>
        )}
      </div>
    </div>
  );
}