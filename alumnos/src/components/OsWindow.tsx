// TASK-O3 — Ventana OS genérica (sin marcas).
// Arrastrar por la barra de título, minimizar, maximizar/restaurar, cerrar.
// En móvil siempre maximizada. Las apps se envuelven sin reescribirse.
import { useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react';
import { debeMaximizar } from '../lib/bloqueo';

interface Props {
  titulo: string;
  icono?: string;
  movil: boolean;
  onCerrar: () => void;
  onMinimizar: () => void;
  children: ReactNode;
}

export default function OsWindow({ titulo, icono = '🪟', movil, onCerrar, onMinimizar, children }: Props) {
  const [max, setMax] = useState(debeMaximizar(movil));
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  function empezarArrastre(e: RPointerEvent) {
    if (max || movil) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function mover(e: RPointerEvent) {
    if (!drag.current || max || movil) return;
    const nx = Math.max(-200, Math.min(200, e.clientX - drag.current.dx));
    const ny = Math.max(0, Math.min(120, e.clientY - drag.current.dy));
    setPos({ x: nx, y: ny });
  }

  function soltar() {
    drag.current = null;
  }

  const maximizada = max || movil;

  return (
    <div
      className="absolute flex flex-col rounded-xl border-2 overflow-hidden shadow-2xl"
      style={
        maximizada
          ? { inset: 0, borderColor: '#334155', background: '#0f172a' }
          : {
              left: '4%', top: '4%', width: '92%', height: '88%',
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              borderColor: '#334155', background: '#0f172a',
            }
      }
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 shrink-0"
        style={{ background: '#1e293b', cursor: maximizada ? 'default' : 'move', touchAction: 'none' }}
        onPointerDown={empezarArrastre}
        onPointerMove={mover}
        onPointerUp={soltar}
      >
        <span className="text-sm">{icono}</span>
        <span className="text-[12px] font-bold font-mono text-white truncate flex-1">{titulo}</span>
        <button onClick={onMinimizar} className="w-6 h-6 rounded text-[11px] text-slate-300 hover:bg-slate-600" aria-label="Minimizar">_</button>
        {!movil && (
          <button onClick={() => setMax((v) => !v)} className="w-6 h-6 rounded text-[11px] text-slate-300 hover:bg-slate-600" aria-label="Maximizar">
            {max ? '❐' : '▢'}
          </button>
        )}
        <button onClick={onCerrar} className="w-6 h-6 rounded text-[11px] text-white hover:bg-red-600" aria-label="Cerrar">✕</button>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

// Envuelve las pantallas solo en modo OS fuera del escritorio;
// en cualquier otro caso devuelve los hijos intactos.
export function VentanaOSCondicional({
  activa, titulo, icono, movil, onCerrar, onMinimizar, children,
}: Props & { activa: boolean }) {
  if (!activa) return <>{children}</>;
  return (
    <OsWindow titulo={titulo} icono={icono} movil={movil} onCerrar={onCerrar} onMinimizar={onMinimizar}>
      {children}
    </OsWindow>
  );
}
