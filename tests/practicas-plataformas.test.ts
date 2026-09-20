// Plataformas de prácticas: la especialidad practicas es un catálogo;
// cada módulo pertenece a una plataforma (contabilidad general, Contalink,
// futuro: odoo...). TDD (orden Dev Principal 2026-09-13).
import { describe, it, expect } from 'vitest';
import {
  PRACTICAS_MODULES,
  PLATAFORMAS_MODULOS,
  auditPracticasModules,
} from '../backend/src/services/practicasModules';
import { getSpecialtyWorkflows } from '../backend/src/services/specialties';

describe('plataformas de practicas', () => {
  it('todo módulo tiene plataforma del catálogo', () => {
    const ids = new Set(PLATAFORMAS_MODULOS.map((p) => p.id));
    for (const m of PRACTICAS_MODULES) {
      expect(ids.has(m.plataforma), `${m.id} sin plataforma válida`).toBe(true);
    }
  });

  it('contabilidad y contalink tienen módulos', () => {
    const por = (p: string) => PRACTICAS_MODULES.filter((m) => m.plataforma === p);
    expect(por('contabilidad').length).toBeGreaterThan(0);
    expect(por('contalink').length).toBe(5);
  });

  it('los 5 Contalink son webinar/video + pólizas (Anexo 24)', () => {
    const ids = PRACTICAS_MODULES.filter((m) => m.plataforma === 'contalink').map((m) => m.id).sort();
    expect(ids).toEqual(['mod-auditoria', 'mod-conciliacion', 'mod-nomina-web', 'mod-polizas', 'mod-reporte']);
  });

  it('audit no reporta fallos de plataforma', () => {
    const fallos = auditPracticasModules(getSpecialtyWorkflows('accounting')).filter((i) => !i.ok && i.paso === 'plataforma');
    expect(fallos).toEqual([]);
  });
});
