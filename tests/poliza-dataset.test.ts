import { describe, expect, it } from 'vitest';
// Dataset de operaciones para Pólizas (TDD): 21 filas CFDI↔banco conectadas,
// UUID único por caso, semillas sin repetir. Fuente única: backend dataset.
import {
  POLIZA_CASOS,
  getPolizaCasos,
  getPolizaSemilla,
  type PolizaCaso,
} from '../backend/src/data/polizaDataset';
import { generarPoliza } from '../backend/src/services/polizaEngine';
import { agrupadorDeCuentaInterna } from '../alumnos/src/sims/catalogoAgrupador';
import { getSatCuenta, resolverAgrupador } from '../backend/src/services/satCatalog';

const UUID = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
const RFC = /^([A-ZÑ&]{4}\d{6}[A-Z0-9]{3}|[A-ZÑ&]{3}\d{6}[A-Z0-9]{3})$/;
const r2 = (n: number) => Math.round(n * 100) / 100;

function mismoMes(a: string, b: string): boolean {
  const pa = a.split('-');
  const pb = b.split('-');
  return pa[1] === pb[1] && pa[2] === pb[2];
}

describe('dataset pólizas: volumen e identidad', () => {
  it('tiene al menos 21 casos con UUID único y válido (id = uuid del CFDI)', () => {
    expect(POLIZA_CASOS.length).toBeGreaterThanOrEqual(21);
    const uuids = POLIZA_CASOS.map((c: PolizaCaso) => c.cfdi.uuid);
    expect(new Set(uuids).size).toBe(uuids.length);
    for (const u of uuids) expect(u).toMatch(UUID);
    for (const c of POLIZA_CASOS) expect(c.id).toBe(c.cfdi.uuid);
  });
  it('todos los RFC son PF (13) o PM (12) válidos', () => {
    for (const c of POLIZA_CASOS) expect(c.cfdi.rfc).toMatch(RFC);
  });
  it('el caso MARCELO golden se preserva intacto', () => {
    const m = POLIZA_CASOS.find((c: PolizaCaso) => c.cfdi.uuid === '1317D7E0-38AC-489F-9082-E75019D8975E');
    expect(m).toBeDefined();
    expect(m!.cfdi.subtotal).toBe(70900);
    expect(m!.cfdi.isrRet).toBe(7090);
    expect(m!.cfdi.total).toBe(63810);
  });
});

describe('dataset pólizas: coherencia entre tablas (como el Excel)', () => {
  it('cada CFDI cuadra solo: subtotal + iva − retenciones = total', () => {
    for (const c of POLIZA_CASOS) {
      const f = c.cfdi;
      expect(r2(f.subtotal + f.iva16 + f.iva8 - f.ivaRet - f.isrRet)).toBeCloseTo(f.total, 2);
    }
  });
  it('PUE ⇒ hay fila de banco del mismo mes por el mismo total; PPD ⇒ sin banco (promesa)', () => {
    for (const c of POLIZA_CASOS) {
      if (c.cfdi.metodo === 'PUE') {
        expect(c.edo, `${c.id} PUE sin banco`).not.toBeNull();
        expect(mismoMes(c.cfdi.fecha, c.edo!.fecha)).toBe(true);
        expect(c.edo!.totalPagado).toBeCloseTo(c.cfdi.total, 2);
      } else {
        expect(c.edo, `${c.id} PPD no debe tocar el banco`).toBeNull();
      }
    }
  });
  it('retención ISR solo en arrendamiento a PF y exacta al 10%', () => {
    for (const c of POLIZA_CASOS) {
      if (c.cfdi.isrRet > 0) {
        expect(c.cfdi.rfc.length).toBe(13);
        expect(c.cfdi.isrRet).toBeCloseTo(r2(c.cfdi.subtotal * 0.1), 2);
      }
    }
  });
});

describe('dataset pólizas: el motor genera cada caso sin errores', () => {
  it('los 21 casos producen póliza cuadrada (DEBE = HABER)', () => {
    for (const c of POLIZA_CASOS) {
      const res = generarPoliza(c.cfdi, c.edo ? [c.edo] : []);
      expect(res.errores, `${c.id}: ${JSON.stringify(res.errores)}`).toEqual([]);
      expect(res.poliza).not.toBeNull();
      expect(res.poliza!.totalDebe).toBeCloseTo(res.poliza!.totalHaber, 2);
    }
  });
  it('el diesel va a 601.48 + 118.01 (no a 601.45 de arrendamiento)', () => {
    const diesel = POLIZA_CASOS.find((c: PolizaCaso) => c.cfdi.uuid === 'C5070101-0002-4000-8000-000000000002')!;
    const res = generarPoliza(diesel.cfdi, [diesel.edo!]);
    const agrs = res.poliza!.lineas.map((l) => l.agrupador).sort();
    expect(agrs).toEqual(['102.01', '118.01', '601.48']);
  });
});

describe('dataset pólizas: cobertura de mapas internos (captura manual)', () => {
  it('cada agrupador del dataset resuelve en front y back + tiene interna', () => {
    const usados = new Set<string>();
    for (const c of POLIZA_CASOS) {
      const res = generarPoliza(c.cfdi, c.edo ? [c.edo] : []);
      for (const l of res.poliza!.lineas) usados.add(l.agrupador);
    }
    expect(usados.size).toBeGreaterThan(10);
    for (const agr of usados) {
      expect(getSatCuenta(agr), `back sin ${agr}`).toBeDefined();
      expect(resolverAgrupador(agr), `back no resuelve ${agr}`).toBe(agr);
      const interna = agr.replace(/\./g, '-');
      expect(agrupadorDeCuentaInterna(interna)?.codigo, `front sin ${interna}`).toBe(agr);
    }
  });
});

describe('dataset pólizas: semilla sin repetir', () => {
  it('sin usados devuelve el primero; con usados salta al siguiente libre (determinista)', () => {
    const todos = getPolizaCasos();
    expect(getPolizaSemilla([])!.id).toBe(todos[0].id);
    const usados = todos.slice(0, 5).map((c) => c.id);
    expect(getPolizaSemilla(usados)!.id).toBe(todos[5].id);
    expect(getPolizaSemilla(usados)!.id).toBe(getPolizaSemilla(usados)!.id);
  });
  it('con todo usado devuelve null (banca agotada)', () => {
    const usados = getPolizaCasos().map((c) => c.id);
    expect(getPolizaSemilla(usados)).toBeNull();
  });
});
