// TASK-R2-1 (Revisor de moldes, Fase 2, Capa 2 por reglas, cero LLM).
// Score pedagogico determinista 0-100 + justificacion por criterio.
// Funcion pura: mismo input -> mismo output, sin fechas ni azar.
// Pesos (orden Angel 2026-09-13): cobertura 35 / claridad 30 /
// tono-forma 15 / duracion-ritmo 20. Capa 1 (validateMolde) veta;
// Capa 2 solo aconseja (veredicto en el endpoint, TASK-R2-2).

export interface JustificacionCriterio {
  criterio: 'cobertura' | 'claridad' | 'tono_forma' | 'duracion_ritmo';
  puntaje: number;
  max: number;
  notas: string[];
}

export interface ResultadoScore {
  score: number;
  justificacion: JustificacionCriterio[];
}

interface Capitulo {
  titulo?: unknown;
  inicio?: unknown;
}

interface Segmento {
  start?: unknown;
  end?: unknown;
  speaker?: unknown;
  text?: unknown;
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function red1(n: number): number {
  return Math.round(n * 10) / 10;
}

const HUECO_MAX_S = 1200; // 20 min: huecos mayores penalizan cobertura
const TITULO_MIN = 15; // titulos mas cortos penalizan claridad
const CAP_MIN_S = 180; // 3 min
const CAP_MAX_S = 900; // 15 min
const Q_UMBRAL = 0.35; // ratio de "?" por encima: artefacto
const TINY_UMBRAL = 0.3; // ratio de segmentos <2s por encima: artefacto
const TINY_S = 2;

export function scoreMolde(molde: unknown): ResultadoScore {
  if (!esObjeto(molde)) {
    const nota = 'molde: entrada invalida (no es objeto)';
    return {
      score: 0,
      justificacion: (['cobertura', 'claridad', 'tono_forma', 'duracion_ritmo'] as const).map(
        (criterio) => ({ criterio, puntaje: 0, max: 0, notas: [nota] }),
      ),
    };
  }
  const caps: Capitulo[] = Array.isArray(molde.capitulos) ? (molde.capitulos as Capitulo[]) : [];
  const segs: Segmento[] = Array.isArray(molde.segmentos) ? (molde.segmentos as Segmento[]) : [];
  const duracion = typeof molde.duracion === 'number' && molde.duracion > 0 ? molde.duracion : 0;

  const justificacion: JustificacionCriterio[] = [
    puntuarCobertura(caps, segs, duracion),
    puntuarClaridad(caps),
    puntuarTono(segs),
    puntuarRitmo(caps, duracion),
  ];
  const score = red1(
    Math.min(100, Math.max(0, justificacion.reduce((a, j) => a + j.puntaje, 0))),
  );
  return { score, justificacion };
}

function limitesCapitulos(caps: Capitulo[], duracion: number): number[] {
  const inicios = caps
    .map((c) => (typeof c.inicio === 'number' ? c.inicio : NaN))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const fin = duracion > 0 ? duracion : inicios.length > 0 ? inicios[inicios.length - 1] : 0;
  return [...inicios, fin];
}

function segmentosEn(segs: Segmento[], desde: number, hasta: number): Segmento[] {
  return segs.filter(
    (s) => typeof s.start === 'number' && s.start >= desde && s.start < hasta,
  );
}

function puntuarCobertura(caps: Capitulo[], segs: Segmento[], duracion: number): JustificacionCriterio {
  const max = 35;
  const notas: string[] = [];
  let p = max;
  if (caps.length === 0 || segs.length === 0) {
    return { criterio: 'cobertura', puntaje: 0, max, notas: ['cobertura: sin capitulos o sin segmentos'] };
  }
  const bounds = limitesCapitulos(caps, duracion);
  caps.forEach((_, i) => {
    if (i + 1 >= bounds.length) return;
    const n = segmentosEn(segs, bounds[i], bounds[i + 1]).length;
    if (n === 0) {
      p -= 10;
      notas.push(`cobertura: capitulos[${i}] sin segmentos (-10)`);
    } else if (n === 1) {
      p -= 6;
      notas.push(`cobertura: capitulos[${i}] con 1 solo segmento (-6)`);
    }
  });
  const ordenados = segs
    .filter((s) => typeof s.start === 'number' && typeof s.end === 'number')
    .sort((a, b) => (a.start as number) - (b.start as number));
  ordenados.forEach((s, j) => {
    if (j === 0) return;
    const hueco = (s.start as number) - (ordenados[j - 1].end as number);
    if (hueco > HUECO_MAX_S) {
      p -= 8;
      notas.push(`cobertura: hueco de ${Math.round(hueco / 60)} min antes de segmentos[${j}] (-8)`);
    }
  });
  return { criterio: 'cobertura', puntaje: red1(Math.max(0, p)), max, notas };
}

function puntuarClaridad(caps: Capitulo[]): JustificacionCriterio {
  const max = 30;
  const notas: string[] = [];
  let p = max;
  if (caps.length === 0) {
    return { criterio: 'claridad', puntaje: 0, max, notas: ['claridad: sin capitulos'] };
  }
  const vistos = new Set<string>();
  caps.forEach((c, i) => {
    const t = typeof c.titulo === 'string' ? c.titulo : '';
    if (t.trim().length < TITULO_MIN) {
      p -= 4;
      notas.push(`claridad: capitulos[${i}] titulo < ${TITULO_MIN} caracteres (-4)`);
    }
    if (t && vistos.has(t)) {
      p -= 4;
      notas.push(`claridad: capitulos[${i}] titulo duplicado (-4)`);
    }
    if (t) vistos.add(t);
  });
  return { criterio: 'claridad', puntaje: red1(Math.max(0, p)), max, notas };
}

function puntuarTono(segs: Segmento[]): JustificacionCriterio {
  const max = 15;
  const notas: string[] = [];
  if (segs.length === 0) {
    return { criterio: 'tono_forma', puntaje: 0, max, notas: ['tono_forma: sin segmentos'] };
  }
  const conSpeaker = segs.filter(
    (s) => typeof s.speaker === 'string' && (s.speaker as string).trim(),
  ).length;
  const ratioSpeaker = conSpeaker / segs.length;
  let p = 10 + red1(ratioSpeaker * 5);
  if (ratioSpeaker === 0) notas.push('tono_forma: ningun segmento trae speaker (+0 de 5)');
  else if (ratioSpeaker < 1) notas.push(`tono_forma: speaker en ${Math.round(ratioSpeaker * 100)}%`);
  const conPregunta = segs.filter((s) => typeof s.text === 'string' && s.text.includes('?')).length;
  const qRatio = conPregunta / segs.length;
  if (qRatio > Q_UMBRAL) {
    const pen = Math.min(5, red1((qRatio - Q_UMBRAL) * 100 * 0.4));
    p -= pen;
    notas.push(`tono_forma: exceso de "?" (${Math.round(qRatio * 100)}% de segmentos, -${pen})`);
  }
  const tiny = segs.filter(
    (s) => typeof s.start === 'number' && typeof s.end === 'number' && s.end - s.start < TINY_S,
  ).length;
  const tinyRatio = tiny / segs.length;
  if (tinyRatio > TINY_UMBRAL) {
    const pen = Math.min(5, red1((tinyRatio - TINY_UMBRAL) * 100 * 0.4));
    p -= pen;
    notas.push(`tono_forma: segmentos <${TINY_S}s en ${Math.round(tinyRatio * 100)}% (-${pen})`);
  }
  return { criterio: 'tono_forma', puntaje: red1(Math.min(max, Math.max(0, p))), max, notas };
}

function puntuarRitmo(caps: Capitulo[], duracion: number): JustificacionCriterio {
  const max = 20;
  const notas: string[] = [];
  if (caps.length === 0 || !(duracion > 0)) {
    return { criterio: 'duracion_ritmo', puntaje: 0, max, notas: ['duracion_ritmo: sin capitulos o sin duracion'] };
  }
  const bounds = limitesCapitulos(caps, duracion);
  let p = max;
  caps.forEach((_, i) => {
    if (i + 1 >= bounds.length) return;
    const dur = bounds[i + 1] - bounds[i];
    if (dur < CAP_MIN_S) {
      const pen = Math.min(3, red1(((CAP_MIN_S - dur) / CAP_MIN_S) * 3));
      p -= pen;
      notas.push(`duracion_ritmo: capitulos[${i}] de ${Math.round(dur)}s < 3 min (-${pen})`);
    } else if (dur > CAP_MAX_S) {
      const pen = Math.min(3, red1(((dur - CAP_MAX_S) / CAP_MAX_S) * 3));
      p -= pen;
      notas.push(`duracion_ritmo: capitulos[${i}] de ${Math.round(dur / 60)} min > 15 min (-${pen})`);
    }
  });
  return { criterio: 'duracion_ritmo', puntaje: red1(Math.max(0, p)), max, notas };
}
