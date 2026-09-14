// Formato del documento dual: categóricos por tipo, dinero intacto (TDD).
import { describe, it, expect } from 'vitest';
import {
  formatDocCell,
  getDocTitle,
  getWorkflowDocumentHtml,
} from '../alumnos/src/lib/workflowDoc';

describe('formatDocCell en reporte_practica (categórico)', () => {
  it('texto (periodo, folio, Ene/Fuera) se muestra tal cual, sin $NaN', () => {
    expect(formatDocCell('reporte_practica', 'enero 2026')).toBe('enero 2026');
    expect(formatDocCell('reporte_practica', 'Ene')).toBe('Ene');
    expect(formatDocCell('reporte_practica', 'Fuera')).toBe('Fuera');
    expect(formatDocCell('reporte_practica', 'ACU-2026-0117')).toBe('ACU-2026-0117');
  });

  it('conteos enteros sin $ ni decimales', () => {
    expect(formatDocCell('reporte_practica', 23)).toBe('23');
    expect(formatDocCell('reporte_practica', 54)).toBe('54');
    expect(formatDocCell('reporte_practica', 0)).toBe('0');
  });

  it('vacío/undefined/null no dan $NaN', () => {
    expect(formatDocCell('reporte_practica', undefined)).toBe('');
    expect(formatDocCell('reporte_practica', '')).toBe('');
    expect(formatDocCell('reporte_practica', null)).toBe('');
  });

  it('escapa HTML en texto', () => {
    expect(formatDocCell('reporte_practica', '<b>Ene</b>')).toBe('&lt;b&gt;Ene&lt;/b&gt;');
  });
});

describe('formatDocCell en workflows de dinero (sin regresión)', () => {
  it('montos con $ y 2 decimales', () => {
    expect(formatDocCell('invoice_emission', 10000)).toBe('$10,000.00');
    expect(formatDocCell('payroll', 0)).toBe('$0.00');
  });

  it('no numérico no da $NaN', () => {
    expect(formatDocCell('invoice_emission', 'abc')).toBe('');
  });
});

describe('documento reporte_practica', () => {
  const data = {
    rows: [
      { label: 'Columnas pre-2025', cell_B: 23, editable: true },
      { label: 'Periodo', cell_B: 'enero 2026', editable: true },
      { label: 'Op Ene normal 1', cell_B: 'Ene', editable: true },
    ],
  };

  it('sin $NaN en el HTML', () => {
    const html = getWorkflowDocumentHtml('reporte_practica', data);
    expect(html).not.toContain('NaN');
    expect(html).toContain('>23<');
    expect(html).toContain('enero 2026');
  });

  it('título propio, no genérico', () => {
    expect(getDocTitle('reporte_practica')).toContain('DIOT');
    expect(getDocTitle('conciliacion_practica')).toContain('CONCILIACIÓN');
    expect(getDocTitle('auditoria_practica')).toContain('AUDITORÍA');
    expect(getDocTitle('nomina_practica')).toContain('NÓMINA');
  });
});
