// TASK-O1 — Pantalla de bloqueo estilo PC genérica (sin marcas ni logos).
// Hora real grande + fecha sim + avatar; cualquier tecla o tap entra;
// transición "Cargando tu perfil de…" (~1s, 0 con reduced-motion).
import { useEffect, useState } from 'react';
import {
  fechaSimLarga,
  etiquetaRol,
  duracionTransicion,
  prefersReducedMotion,
  type SpecialtyId,
} from '../lib/bloqueo';

interface Props {
  nombre: string;
  specialty: SpecialtyId;
  onEnter: () => void;
}

const FONDOS: Record<SpecialtyId, string> = {
  practicas: 'linear-gradient(135deg, #78350f 0%, #1c1917 70%)',
  accounting: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 70%)',
  data_engineering: 'linear-gradient(135deg, #020617 0%, #155e75 100%)',
};

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function horaReal(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function LockScreen({ nombre, specialty, onEnter }: Props) {
  const [fase, setFase] = useState<'bloqueo' | 'cargando'>('bloqueo');
  const [hora, setHora] = useState(horaReal);
  const [reducido] = useState(prefersReducedMotion);

  useEffect(() => {
    const t = setInterval(() => setHora(horaReal()), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (fase !== 'bloqueo') return;
    const entrar = () => {
      setFase('cargando');
      setTimeout(onEnter, duracionTransicion(prefersReducedMotion()));
    };
    const tecla = () => entrar();
    const tap = () => entrar();
    window.addEventListener('keydown', tecla);
    window.addEventListener('click', tap);
    return () => {
      window.removeEventListener('keydown', tecla);
      window.removeEventListener('click', tap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  return (
    <div
      className="w-full h-[calc(100vh-120px)] rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center select-none cursor-pointer"
      style={{
        background: FONDOS[specialty],
        transition: reducido ? 'none' : 'opacity 0.3s ease',
        opacity: fase === 'cargando' ? 0.25 : 1,
      }}
    >
      {fase === 'bloqueo' ? (
        <>
          <div className="text-6xl font-mono font-bold text-white tabular-nums">{hora}</div>
          <div className="text-sm text-white/80 mt-1">{fechaSimLarga()}</div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold">
              {iniciales(nombre)}
            </div>
            <div className="text-white font-medium">{nombre}</div>
          </div>
          <div className="absolute bottom-10 text-white/70 text-xs animate-pulse">
            Presiona cualquier tecla o haz clic para entrar
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-3 border-white/30"
            style={reducido ? undefined : { borderTopColor: '#fff', animation: 'spin 1s linear infinite', borderWidth: 3 }}
          />
          <div className="text-white/90 text-sm">Cargando tu perfil de {etiquetaRol(specialty)}…</div>
        </div>
      )}
    </div>
  );
}
