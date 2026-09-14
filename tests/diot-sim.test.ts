import { describe, expect, it } from 'vitest';
// TASK-D1: DIOTSim — motor puro (el componente React lo consume).
// Goldens del video + diot.html. Determinista por semilla, cero LLM.
import {
  TIPOS_OP,
  TASAS_IVA,
  ESCENARIO_TUTORIAL,
  generarEscenario,
  validarOperacion,
  construirTXT,
  calificarPractica,
  calificarExamen,
  puedePresentar,
  type OperacionDIOT,
} from '../alumnos/src/sims/diotEngine';

describe('diotEngine (TASK-D1)', () => {
  it('catalogos fijos: 5 tipos de operacion y tasas 16/8/0/exento', () => {
    expect(Object.keys(TIPOS_OP)).toEqual(['1', '2', '3', '4', '5']);
    expect(TIPOS_OP[1]).toBe('Bienes');
    expect(TIPOS_OP[5]).toBe('Extranjeros');
    expect(TASAS_IVA).toEqual({ '16': 0.16, '8': 0.08, '0': 0, exento: 0 });
  });

  it('escenario tutorial: goldens del video (8 ops, base 892130.50, IVA 142740.88)', () => {
    const esc = ESCENARIO_TUTORIAL;
    expect(esc.operaciones).toHaveLength(8);
    expect(esc.errores).toHaveLength(0);
    const base = esc.operaciones.reduce((a, o) => a + o.monto, 0);
    const iva = esc.operaciones.reduce((a, o) => a + o.iva, 0);
    expect(Math.round(base * 100) / 100).toBe(892130.5);
    expect(Math.round(iva * 100) / 100).toBe(142740.88);
    expect(esc.periodo).toBe('Enero 2026');
  });

  it('generador determinista: misma semilla, mismo escenario', () => {
    const a = generarEscenario('practica', 7);
    const b = generarEscenario('practica', 7);
    expect(a).toEqual(b);
    expect(a.operaciones).toHaveLength(8);
    expect(a.errores).toHaveLength(2);
  });

  it('generador por modo: practica 8+2, examen 12+4, tutorial 8+0', () => {
    expect(generarEscenario('tutorial', 1).errores).toHaveLength(0);
    const ex = generarEscenario('examen', 3);
    expect(ex.operaciones).toHaveLength(12);
    expect(ex.errores).toHaveLength(4);
  });

  it('los 6 tipos de error existen con pista del Q&A', () => {
    const tipos = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      for (const e of generarEscenario('examen', seed).errores) tipos.add(e.campo);
    }
    expect([...tipos].sort()).toEqual(['iva', 'monto', 'nacionalidad', 'rfc', 'tasa', 'tipo']);
    const ex = generarEscenario('examen', 3);
    for (const e of ex.errores) {
      expect(e.pista.length).toBeGreaterThan(10);
      expect(e.valorCorrecto).toBeDefined();
    }
  });

  it('validarOperacion: RFC 13 chars, monto positivo, IVA = monto x tasa', () => {
    const buena: OperacionDIOT = {
      id: 1, rfc: 'COR850622AB3', nombre: 'X', pais: 'MX', nacionalidad: 'Nacional',
      tipoContraparte: 'PM', tipo: 1, tasa: '16', monto: 1000, iva: 160,
      origen: 'Factura', folio: 'A-1001', fecha: '05/01/2026',
    };
    expect(validarOperacion(buena)).toEqual([]);
    expect(validarOperacion({ ...buena, rfc: 'CORTO' })[0]).toContain('RFC');
    expect(validarOperacion({ ...buena, monto: -1000 })[0]).toContain('positivo');
    expect(validarOperacion({ ...buena, iva: 999 })[0]).toContain('IVA');
  });

  it('construirTXT: 23 columnas pre-2025, 54 columnas 2025+ (pipe-separated)', () => {
    const ops = ESCENARIO_TUTORIAL.operaciones;
    const txt23 = construirTXT(ops, 2024);
    const txt54 = construirTXT(ops, 2026);
    expect(txt23.split('\n')).toHaveLength(8);
    expect(txt23.split('\n')[0].split('|')).toHaveLength(23);
    expect(txt54.split('\n')[0].split('|')).toHaveLength(54);
    // determinista: TXT identico al re-generado (golden "TXT identico al enviado")
    expect(construirTXT(ops, 2026)).toBe(txt54);
  });

  it('fecha DIOT = fecha de pago: Dic-emitida/Ene-pagada va en Enero', () => {
    const esc = generarEscenario('practica', 7);
    for (const op of esc.operaciones) {
      expect(op.fecha).toContain('/01/2026');
    }
  });

  it('puedePresentar bloquea si faltan errores por eliminar', () => {
    expect(puedePresentar(1, 2)).toEqual({ ok: false, faltantes: 1 });
    expect(puedePresentar(2, 2)).toEqual({ ok: true, faltantes: 0 });
  });

  it('scoring practica: 100 + bono tiempo - 5 por pista', () => {
    expect(calificarPractica(100, 0)).toBe(120);
    expect(calificarPractica(100, 5)).toBe(95);
    expect(calificarPractica(200, 2)).toBe(90);
  });

  it('scoring examen: precision + bono, certificado >= 90', () => {
    expect(calificarExamen(4, 4, 200)).toBeGreaterThanOrEqual(90);
    expect(calificarExamen(2, 4, 10)).toBeLessThan(90);
  });
});
