import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// Auditoría Contalink #1 — DIOT único: el test evalúa el código REAL servido
// en prod (alumnos/public/sims/diot.html), no el motor deprecado.
// Certifica: determinismo por semilla, conteos por fase/nivel, consistencia
// de totales y folio de acuse determinista. Cero LLM.

const HTML_PATH = join(__dirname, '..', 'alumnos', 'public', 'sims', 'diot.html');
const SRC: string = readFileSync(HTML_PATH, 'utf8');

function sliceBlock(src: string, startMarker: string): string {
  const i = src.indexOf(startMarker);
  if (i < 0) throw new Error(`no encontrado: ${startMarker}`);
  let depth = 0;
  let j = i;
  // avanza hasta el primer { o [ y balancea hasta cerrarlo
  while (j < src.length && src[j] !== '{' && src[j] !== '[') j++;
  const open = src[j];
  const close = open === '{' ? '}' : ']';
  for (; j < src.length; j++) {
    if (src[j] === open) depth++;
    if (src[j] === close) { depth--; if (depth === 0) { j++; break; } }
  }
  return src.slice(i, j) + ';';
}

function buildSandbox() {
  const seed = SRC.slice(
    SRC.indexOf('// SEED-DETERMINISTA-INI'),
    SRC.indexOf('// SEED-DETERMINISTA-FIN'),
  );
  const randEnd = 'arr.length)];';
  const parts = [
    seed,
    sliceBlock(SRC, 'const EMPRESAS ='),
    sliceBlock(SRC, 'const TIPOS_OP ='),
    sliceBlock(SRC, 'const TASAS_IVA ='),
    SRC.slice(SRC.indexOf('const rand ='), SRC.indexOf(randEnd) + randEnd.length),
    'const pad2 = n => n.toString().padStart(2, "0");',
    sliceBlock(SRC, 'function generarRFCValido'),
    sliceBlock(SRC, 'function generarRFCInvalido'),
    sliceBlock(SRC, 'function calcularIVA'),
    sliceBlock(SRC, 'function generarScenarioDIOT'),
    'return { generarScenarioDIOT, folioAcuse, calcularIVA };',
  ];
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(parts.join('\n'))() as {
    generarScenarioDIOT: (fase: string, nivel?: number) => any;
    folioAcuse: (fase: string, ops: any[]) => string;
    calcularIVA: (monto: number, tasa: string) => number;
  };
}

describe('diot unificado (prod HTML)', () => {
  it('sin azar: el generador no usa Math.random', () => {
    expect(SRC).not.toMatch(/Math\.random/);
    expect(SRC).toContain('SEED-DETERMINISTA-INI');
  });

  it('determinista: misma fase+nivel = mismo escenario', () => {
    const sb = buildSandbox();
    const a = JSON.stringify(sb.generarScenarioDIOT('practica', 1));
    const b = JSON.stringify(sb.generarScenarioDIOT('practica', 1));
    expect(a).toBe(b);
  });

  it('fases distintas = datos distintos; errores 0/2/4', () => {
    const sb = buildSandbox();
    const piloto = sb.generarScenarioDIOT('piloto', 1);
    const practica = sb.generarScenarioDIOT('practica', 1);
    const examen = sb.generarScenarioDIOT('examen', 1);
    expect(piloto.cantErrores).toBe(0);
    expect(practica.cantErrores).toBe(2);
    expect(examen.cantErrores).toBe(4);
    expect(practica.erroresInyectados).toHaveLength(2);
    expect(examen.erroresInyectados).toHaveLength(4);
    expect(JSON.stringify(piloto.operaciones)).not.toBe(JSON.stringify(practica.operaciones));
  });

  it('conteos por nivel: 8/12/15 operaciones', () => {
    const sb = buildSandbox();
    expect(sb.generarScenarioDIOT('practica', 1).operaciones).toHaveLength(8);
    expect(sb.generarScenarioDIOT('practica', 2).operaciones).toHaveLength(12);
    expect(sb.generarScenarioDIOT('practica', 3).operaciones).toHaveLength(15);
  });

  it('totales consistentes: suma de |monto| e IVA por tasa', () => {
    const sb = buildSandbox();
    const sc = sb.generarScenarioDIOT('examen', 1);
    // operaciones con error de monto son negativas: el display usa |monto|
    const total = sc.operaciones.reduce((s: number, o: any) => s + Math.abs(o.monto), 0);
    expect(total).toBeGreaterThan(0);
    for (const op of sc.operaciones) {
      const esErrorIva = sc.erroresInyectados.some((e: any) => e.operacionId === op.id && e.campo === 'iva');
      const esErrorTasa = sc.erroresInyectados.some((e: any) => e.operacionId === op.id && e.campo === 'tasa');
      if (!esErrorIva && !esErrorTasa) {
        expect(op.iva).toBe(sb.calcularIVA(Math.abs(op.monto), op.tasa));
      }
    }
  });

  it('densidad PC: base 14px en pantallas amplias sin zoom (no rompe el tour)', () => {
    expect(SRC).toMatch(/@media\s*\(min-width:\s*1024px\)[\s\S]*?html\s*\{\s*font-size:\s*14px/);
    expect(SRC).not.toMatch(/body\s*\{\s*[^}]*zoom\s*:/);
  });

  it('el piloto (observación) no genera acuse: solo práctica/examen presentan', () => {
    const llamadas = SRC.match(/^\s*mostrarFolio\(\);/gm) || [];
    // Exactamente 2: completePractice y completeExam. completePilot oculta la fila.
    expect(llamadas).toHaveLength(2);
    const pilotFn = SRC.slice(SRC.indexOf('function completePilot'), SRC.indexOf('function endPilot'));
    expect(pilotFn).not.toContain('mostrarFolio()');
    expect(pilotFn).toContain("folioRow').style.display = 'none'");
    expect(SRC).toContain('id="folioRow"');
  });

  it('folio de acuse determinista con formato ACU-2026-XXXX y visible en el modal', () => {    const sb = buildSandbox();
    const sc = sb.generarScenarioDIOT('practica', 1);
    const f1 = sb.folioAcuse('practica', sc.operaciones);
    const f2 = sb.folioAcuse('practica', sc.operaciones);
    expect(f1).toBe(f2);
    expect(f1).toMatch(/^ACU-2026-\d{4}$/);
    expect(SRC).toContain('id="compFolio"');
    expect(SRC).toContain('mostrarFolio()');
  });
});
