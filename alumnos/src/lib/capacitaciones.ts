// Lógica pura de capacitaciones (testeable sin DOM).
// TrainingPlayer.tsx la consume; tests/capacitaciones.test.ts la verifica.
import type { TrainingData, TrainingSegmento } from '../components/TrainingPlayer';

export function fmtTiempo(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Filtra segmentos por texto (case-insensitive); query vacío = todos. */
export function filtrarSegmentos(segmentos: TrainingSegmento[], query: string): TrainingSegmento[] {
  const q = query.trim().toLowerCase();
  if (!q) return segmentos;
  return segmentos.filter((s) => s.text.toLowerCase().includes(q));
}

/** Índice del segmento en reproducción para t (último con start <= t). */
export function indiceActivo(segmentos: TrainingSegmento[], t: number): number {
  let idx = -1;
  for (let i = 0; i < segmentos.length; i++) {
    if (segmentos[i].start <= t) idx = i;
    else break;
  }
  return idx;
}

/** Contrato de layout idéntico: todo training lo cumple o la vista diverge. */
export function validarTraining(t: unknown): string[] {
  const errores: string[] = [];
  const d = t as Partial<TrainingData>;
  if (typeof d?.titulo !== 'string' || !d.titulo) errores.push('titulo');
  if (typeof d?.instructor !== 'string' || !d.instructor) errores.push('instructor');
  if (typeof d?.duracion !== 'number' || d.duracion <= 0) errores.push('duracion');
  if (!Array.isArray(d?.capitulos) || d.capitulos.length < 5) errores.push('capitulos>=5');
  if (!Array.isArray(d?.segmentos) || d.segmentos.length === 0) errores.push('segmentos');
  (d.capitulos ?? []).forEach((c, i) => {
    if (typeof c?.titulo !== 'string' || typeof c?.inicio !== 'number' || c.inicio < 0 || c.inicio > (d.duracion ?? 0)) {
      errores.push(`capitulos[${i}]`);
    }
  });
  (d.segmentos ?? []).forEach((s, i) => {
    if (typeof s?.start !== 'number' || typeof s?.end !== 'number' || typeof s?.text !== 'string' || s.start > s.end || s.start < 0) {
      errores.push(`segmentos[${i}]`);
    }
  });
  return errores;
}
