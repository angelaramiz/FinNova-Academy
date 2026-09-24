// TourSim — piloto automático individual reutilizable para los Sims
// Contalink. Overlay + spotlight + tarjeta arrastrable con teoría, puntos de
// progreso y gate en localStorage (ver una vez). Sin backend: el piloto es
// observación, la evaluación vive en cada Sim. Cero LLM.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PasoTour } from './toursContalink';
import { geometriaSpotlight } from './tourGeometria';

interface Props {
  titulo: string;
  pasos: PasoTour[];
  storageKey: string;
  // Navega el Sim al paso interno antes de medir (tabs condicionales).
  onNavegar?: (paso: string) => void;
  // Tour-acción: verifica si la tarea del paso i está cumplida (en vivo).
  onVerificar?: (i: number) => boolean;
}

export default function TourSim({ titulo, pasos, storageKey, onNavegar, onVerificar }: Props) {
  const [terminado, setTerminado] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });
  const [activo, setActivo] = useState(false);
  const [idx, setIdx] = useState(0);
  const [intento, setIntento] = useState(false);
  const [geom, setGeom] = useState({ l: 0, t: 0, w: 0, h: 0 });
  const [pos, setPos] = useState({ l: 12, t: 12 });
  const tipRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const paso = pasos[Math.min(idx, pasos.length - 1)];
  // Verificación en vivo: se re-evalúa en cada render del Sim.
  const cumple = onVerificar ? onVerificar(Math.min(idx, pasos.length - 1)) : true;

  const medir = useCallback((i: number) => {
    const el = document.querySelector(pasos[i]?.selector || '');
    if (!el) return false;
    (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'auto' });
    const r = el.getBoundingClientRect();
    // Origen del contenedor raíz: dentro de la ventana del escritorio
    // (ancestro con transform) el `fixed` es relativo al ancestro.
    const ro = rootRef.current?.getBoundingClientRect();
    const g = geometriaSpotlight(r, { left: ro?.left ?? 0, top: ro?.top ?? 0 });
    setGeom(g);
    const margen = 12;
    const ro2 = rootRef.current?.getBoundingClientRect();
    const ox = ro2?.left ?? 0;
    const oy = ro2?.top ?? 0;
    const ancho = Math.min(420, window.innerWidth - 24);
    let l = Math.max(margen, Math.min(r.left - ox, window.innerWidth - ancho - margen));
    let t = r.bottom - oy + margen;
    if (t + 320 > window.innerHeight - margen) t = Math.max(margen, r.top - oy - 320 - margen);
    setPos({ l, t });
    return true;
  }, [pasos]);

  const irA = useCallback((i: number) => {
    const fin = () => {
      try { localStorage.setItem(storageKey, '1'); } catch { /* noop */ }
      setTerminado(true);
      setActivo(false);
    };
    if (i >= pasos.length) { fin(); return; }
    const step = pasos[i];
    setIdx(i);
    setIntento(false);
    // Navega al tab del paso y mide tras el re-render.
    if (step.paso && onNavegar) onNavegar(step.paso);
    setTimeout(() => {
      if (document.querySelector(step.selector)) {
        requestAnimationFrame(() => medir(i));
      } else {
        // Ancla ausente aun tras navegar: salta al siguiente.
        irA(i + 1);
      }
    }, 80);
  }, [pasos, storageKey, medir, onNavegar]);

  // Re-clamp tras render (alto real de la tarjeta).
  useLayoutEffect(() => {
    if (!activo || !tipRef.current) return;
    const h = tipRef.current.offsetHeight || 0;
    const w = tipRef.current.offsetWidth || 0;
    const margen = 12;
    setPos((p) => {
      let { l, t } = p;
      if (t + h > window.innerHeight - margen) t = window.innerHeight - h - margen;
      if (t < margen) t = margen;
      if (l + w > window.innerWidth - margen) l = window.innerWidth - w - margen;
      if (l < margen) l = margen;
      return { l, t };
    });
  }, [activo, idx]);

  useEffect(() => {
    if (!activo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActivo(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activo]);

  function onDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.l, oy: pos.t };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos({ l: drag.current.ox + e.clientX - drag.current.sx, t: drag.current.oy + e.clientY - drag.current.sy });
  }
  function onUp() {
    if (!drag.current) return;
    drag.current = null;
    const h = tipRef.current?.offsetHeight || 0;
    const w = tipRef.current?.offsetWidth || 0;
    const margen = 12;
    setPos((p) => {
      let l = Math.max(margen, Math.min(p.l, window.innerWidth - w - margen));
      let t = Math.max(margen, Math.min(p.t, window.innerHeight - h - margen));
      return { l, t };
    });
  }

  if (terminado) return null;

  if (!activo) {
    return (
      <button
        onClick={() => { setIdx(0); setActivo(true); requestAnimationFrame(() => medir(0)); }}
        className="w-full px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition animate-pulse"
        style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}
      >
        ▶ Iniciar {titulo} — tour guiado ({pasos.length} pasos)
      </button>
    );
  }

  return (
    <div ref={rootRef} className="fixed inset-0 z-50">
      {/* Spotlight real: el div enmarca el objetivo con fondo transparente y
        su box-shadow gigante oscurece TODO lo de afuera (agujero de luz).
        Sin fondo parejo: el contenido enmarcado queda iluminado. */}
      <div
        className="fixed rounded-xl pointer-events-none transition-all duration-500"
        style={{ left: geom.l, top: geom.t, width: geom.w, height: geom.h, boxShadow: '0 0 0 4px #3b82f6, 0 0 30px rgba(59,130,246,0.5), 0 0 0 9999px rgba(15,23,42,0.88)' }}
      />
      <div
        ref={tipRef}
        className="fixed bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl"
        style={{ left: pos.l, top: pos.t, width: 'min(420px, calc(100vw - 24px))', maxHeight: 'calc(100vh - 24px)', overflowY: 'auto' }}
      >
        <div
          className="flex items-start justify-between mb-3 select-none"
          style={{ cursor: 'grab', touchAction: 'none' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          title="Arrastra para mover"
        >
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
              PASO {idx + 1} / {pasos.length}
            </span>
            <div className="flex gap-1">
              {pasos.map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < idx ? '#10b981' : i === idx ? '#3b82f6' : '#cbd5e1' }} />
              ))}
            </div>
          </div>
          <button onClick={() => setActivo(false)} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Cerrar tour">✕</button>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1">Piloto automático</div>
        <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm sm:text-base">{paso.titulo}</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{paso.descripcion}</p>
        <div className="rounded-lg p-3 mb-2" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <div className="text-[10px] font-semibold mb-1" style={{ color: '#92400e' }}>📚 Teoría</div>
          <div className="text-xs leading-relaxed" style={{ color: '#78350f' }}>{paso.teoria}</div>
        </div>
        <div className="rounded-lg p-2 mb-3 text-[10px] font-medium" style={{ background: '#eff6ff', borderLeft: '4px solid #1e40af', color: '#1e40af' }}>📖 {paso.referencia}</div>
        {/* Tour-acción: la tarea se verifica en vivo; Siguiente se bloquea hasta cumplirla */}
        {paso.tarea && (
          <div className="rounded-lg p-2 mb-3 text-[11px] font-medium" style={{ background: cumple ? '#ecfdf5' : '#fefce8', borderLeft: `4px solid ${cumple ? '#10b981' : '#f59e0b'}`, color: cumple ? '#065f46' : '#92400e' }}>
            ✋ Hazlo ahora: {paso.tarea}
            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { if (cumple) irA(idx + 1); else setIntento(true); }} className="px-3 py-1.5 text-xs text-white rounded-lg font-bold" style={{ background: cumple ? '#10b981' : '#f59e0b' }}>✓ Ya lo hice</button>
              {intento && !cumple && <span>⏳ Aún no: completa la tarea para seguir.</span>}
              {cumple && <span>✅ Listo, puedes seguir.</span>}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="text-[10px] text-slate-500">{Math.round((idx / pasos.length) * 100)}% completado</div>
          <div className="flex gap-2">
            <button onClick={() => setActivo(false)} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Saltar</button>
            {idx > 0 && <button onClick={() => irA(idx - 1)} className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg">← Atrás</button>}
            <button onClick={() => irA(idx + 1)} disabled={!!paso.tarea && !cumple} title={paso.tarea && !cumple ? `Te falta: ${paso.tarea}` : 'Siguiente paso'} className="px-4 py-1.5 text-xs bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium disabled:opacity-40">
              {idx === pasos.length - 1 ? 'Finalizar ✓' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
