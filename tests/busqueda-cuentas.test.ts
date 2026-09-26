// Búsqueda de cuentas por nombre (el practicante sabe nombres, no códigos).
import { describe, it, expect } from 'vitest';
import {
  buscarCuentas, normalizarBusqueda, desambiguarArrendamiento,
} from '../backend/src/services/satCatalog';
import { buscarCuentasFront } from '../alumnos/src/sims/catalogoAgrupador';

describe('normalizarBusqueda', () => {
  it('minúsculas, sin acentos, sin stopwords (c→s por faltas típicas)', () => {
    expect(normalizarBusqueda('Papelería y Artículos de Oficina')).toBe('papeleria articulos ofisina');
    expect(normalizarBusqueda('BANCOS')).toBe('bancos');
    expect(normalizarBusqueda('  ISR   retenido ')).toBe('isr retenido');
  });
});

describe('buscarCuentas (motor)', () => {
  it('código exacto rankea 100', () => {
    const r = buscarCuentas('601.45');
    expect(r[0].agrupador).toBe('601.45');
    expect(r[0].score).toBe(100);
  });

  it('"bancos" trae 102.01 primero con su interna sugerida', () => {
    const r = buscarCuentas('bancos');
    expect(r[0].agrupador).toBe('102.01');
    expect(r[0].cuentaInternaSugerida).toBe('102-01-002');
  });

  it('"renta" propone PF y PM (desambigua, no adivina)', () => {
    const r = buscarCuentas('renta');
    const cods = r.map(x => x.agrupador);
    expect(cods).toContain('601.45');
    expect(cods).toContain('601.46');
  });

  it('"papeleria" sin acento casa con "Papelería"', () => {
    const r = buscarCuentas('papeleria');
    expect(r[0].agrupador).toBe('601.55');
  });

  it('"isr retenido" trae 216.03', () => {
    const r = buscarCuentas('isr retenido');
    expect(r.map(x => x.agrupador)).toContain('216.03');
  });

  it('601.83 avisa colisión con 601-83', () => {
    const r = buscarCuentas('no deducible');
    const hit = r.find(x => x.agrupador === '601.83')!;
    expect(hit).toBeTruthy();
    expect(hit.avisoColision).toContain('601-83');
  });

  it('vacío no devuelve nada', () => {
    expect(buscarCuentas('')).toEqual([]);
    expect(buscarCuentas('de la')).toEqual([]);
  });
});

describe('desambiguarArrendamiento (RFC manda)', () => {
  it('RFC 13 → PF 601.45', () => {
    expect(desambiguarArrendamiento('FOFM8406126X3').agrupador).toBe('601.45');
    expect(desambiguarArrendamiento('AAAA010101AAA').agrupador).toBe('601.45');
  });

  it('RFC 12 → PM 601.46', () => {
    expect(desambiguarArrendamiento('AAA010101AA1').agrupador).toBe('601.46');
  });

  it('sin RFC propone PF con aviso', () => {
    const d = desambiguarArrendamiento('');
    expect(d.agrupador).toBe('601.45');
    expect(d.como).toContain('confirma');
  });
});

describe('código exacto manda (reporte tester: escribió 102-01-002 y guardó 001)', () => {
  it('si escribes la interna exacta, esa se sugiere (no la primera del mapa)', () => {
    const r = buscarCuentasFront('102-01-002');
    expect(r[0].agrupador).toBe('102.01');
    expect(r[0].cuentaInternaSugerida).toBe('102-01-002');
  });
});

describe('paridad front (espejo)', () => {
  it('buscarCuentasFront coincide en los casos del curso', () => {
    for (const q of ['bancos', 'renta', 'papeleria', 'isr retenido', '601.45', 'no deducible']) {
      const back = buscarCuentas(q).map(r => r.agrupador);
      const front = buscarCuentasFront(q).map(r => r.agrupador);
      expect(front[0], `top1 difiere en '${q}'`).toBe(back[0]);
      for (const c of ['601.45', '102.01']) {
        if (back.includes(c)) expect(front, `'${q}' sin ${c} en front`).toContain(c);
      }
    }
  });
});
