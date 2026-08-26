import { useEffect, useMemo, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

export interface GuideBubble {
  id: string;
  title: string;
  body: string;
  anchor?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuideBubblesProps {
  guides: GuideBubble[];
  theme: Theme;
  /** Si es true, el botón se posiciona absoluto dentro de su contenedor relative (no fixed al viewport). */
  inline?: boolean;
}

function anchorRect(anchor?: string): DOMRect | null {
  if (!anchor) return null;
  try {
    const el = document.querySelector(anchor);
    if (!el) return null;
    return el.getBoundingClientRect();
  } catch {
    return null;
  }
}

export default function GuideBubbles({ guides, theme, inline }: GuideBubblesProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const current = useMemo(() => guides[idx] || null, [guides, idx]);

  useEffect(() => {
    if (open && current?.anchor) {
      // Al avanzar de burbuja, si el anchor existe se resalta automáticamente.
      const timer = setTimeout(() => {}, 50);
      return () => clearTimeout(timer);
    }
  }, [open, current]);

  if (!guides || guides.length === 0) return null;

  const rect = open ? anchorRect(current?.anchor) : null;
  const isCentered = open && (!current?.anchor || current?.position === 'center');

  const bubbleStyle: React.CSSProperties = isCentered
    ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
    : rect
      ? (() => {
          const pos = current?.position || 'bottom';
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const W = 340, H = 170;
          let left = rect.left + rect.width / 2 - W / 2;
          let top = rect.top + rect.height + 12;
          if (pos === 'top') top = rect.top - H - 12;
          if (pos === 'left') { left = rect.left - W - 12; top = rect.top + rect.height / 2 - H / 2; }
          if (pos === 'right') { left = rect.right + 12; top = rect.top + rect.height / 2 - H / 2; }
          left = Math.max(8, Math.min(vw - W - 8, left));
          top = Math.max(8, Math.min(vh - H - 8, top));
          return { left, top };
        })()
      : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <>
      {/* Botón 💡 Guía — fixed global salvo inline (dentro de su panel) */}
      <button
        onClick={() => { setOpen(o => !o); setIdx(0); }}
        className={inline
          ? 'absolute bottom-3 right-3 z-20 flex items-center gap-2 px-3 py-2.5 rounded-full shadow-xl cursor-pointer hover:opacity-90 transition select-none'
          : 'fixed bottom-20 right-5 z-[110] flex items-center gap-2 px-4 py-3 rounded-full shadow-xl cursor-pointer hover:opacity-90 transition select-none'}
        style={{ background: colors.primary, color: '#1B2632', border: `2px solid ${colors.border}`, boxShadow: `3px 3px 0px 0px ${colors.border}` }}
        title="Abrir guía paso a paso"
      >
        <span className="text-base leading-none">💡</span>
        <span className="text-[11px] font-bold font-mono">Guía</span>
        {open && <span className="text-[10px] font-mono">✕</span>}
      </button>

      {open && current && (
        <>
          {/* Anillo de resaltado del elemento anclado */}
          {rect && (
            <div className="fixed z-[105] pointer-events-none rounded-lg"
              style={{
                left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12,
                boxShadow: `0 0 0 3px ${colors.primary}88`,
              }}
            />
          )}
          {/* Burbuja */}
          <div className="fixed z-[108] pointer-events-auto animate-slide-in" style={{ width: 'min(90vw, 340px)', ...bubbleStyle }}>
            <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: isDark ? '#1e293b' : '#fff', border: `2px solid ${colors.primary}` }}>
              <div className="h-1 w-full" style={{ background: isDark ? '#0f172a' : '#e5e7eb' }}>
                <div className="h-full transition-all duration-300" style={{ width: `${((idx + 1) / guides.length) * 100}%`, background: colors.primary }} />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded" style={{ background: colors.primary + '20', color: colors.primary }}>
                    Guía {idx + 1} de {guides.length}
                  </span>
                  <button onClick={() => setOpen(false)} className="text-[10px] font-mono cursor-pointer hover:opacity-70" style={{ color: colors.textMuted }}>Cerrar</button>
                </div>
                <h4 className="text-[15px] font-bold mb-2" style={{ color: colors.text }}>{current.title}</h4>
                <p className="text-[11px] leading-relaxed mb-5" style={{ color: colors.textMuted }}>{current.body}</p>
                <div className="flex gap-2">
                  {idx > 0 && (
                    <button onClick={() => setIdx(i => i - 1)} className="px-4 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:opacity-80 transition"
                      style={{ background: isDark ? '#334155' : '#e5e7eb', color: colors.text }}>
                      ← Anterior
                    </button>
                  )}
                  <button onClick={() => idx < guides.length - 1 ? setIdx(i => i + 1) : setOpen(false)}
                    className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                    style={{ background: colors.primary, color: '#1B2632' }}>
                    {idx < guides.length - 1 ? 'Siguiente →' : 'Entendido ✓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}