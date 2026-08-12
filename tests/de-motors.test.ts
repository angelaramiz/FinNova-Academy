import { describe, it, expect } from 'vitest';
import { SOURCES, MODELS, compileModelSql, topoOrder } from '../alumnos/src/components/DBTSim';

describe('motor dbt (compileModelSql) — motores DE', () => {
  it('expone las fuentes y modelos reales del pipeline', () => {
    expect(Object.keys(SOURCES)).toContain('raw_ventas');
    expect(MODELS.map(m => m.name)).toEqual(expect.arrayContaining(['stg_ventas', 'stg_clientes', 'int_ventas_cliente', 'mrt_ventas_por_cliente']));
  });

  it('compila stg_ventas con 8 filas y el schema esperado', () => {
    const m = MODELS.find(x => x.name === 'stg_ventas')!;
    const out = compileModelSql(m.sql, SOURCES);
    expect(out.rows.length).toBe(8);
    expect(out.schema).toContain('id');
    expect(out.schema).toContain('total');
  });

  it('compila el mart mrt_ventas_por_cliente (JOIN + GROUP BY + ORDER BY)', () => {
    const m = MODELS.find(x => x.name === 'mrt_ventas_por_cliente')!;
    const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
    for (const name of ['stg_ventas', 'stg_clientes', 'int_ventas_cliente']) {
      const model = MODELS.find(x => x.name === name)!;
      tables[name] = compileModelSql(model.sql, { ...SOURCES, ...tables });
    }
    const out = compileModelSql(m.sql, { ...SOURCES, ...tables });
    expect(out.rows.length).toBeGreaterThan(0);
    expect(out.schema).toContain('total_ventas');
  });

  it('el total de ventas del mart coincide con la suma de stg_ventas', () => {
    const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
    for (const name of ['stg_ventas', 'stg_clientes', 'int_ventas_cliente']) {
      const model = MODELS.find(x => x.name === name)!;
      tables[name] = compileModelSql(model.sql, { ...SOURCES, ...tables });
    }
    const expectedTotal = tables.stg_ventas.rows.reduce((s: number, r: any) => s + Number(r.total), 0);
    const mrt = compileModelSql(MODELS.find(x => x.name === 'mrt_ventas_por_cliente')!.sql, { ...SOURCES, ...tables });
    const sumMrt = mrt.rows.reduce((s: number, r: any) => s + Number(r.total_ventas), 0);
    expect(sumMrt).toBe(expectedTotal);
  });

  it('topoOrder ordena staging → intermediate → marts', () => {
    const order = topoOrder().map((m: any) => m.name);
    const idx = (n: string) => order.indexOf(n);
    expect(idx('stg_ventas')).toBeGreaterThanOrEqual(0);
    expect(idx('stg_ventas')).toBeLessThan(idx('int_ventas_cliente'));
    expect(idx('int_ventas_cliente')).toBeLessThan(idx('mrt_ventas_por_cliente'));
  });
});
