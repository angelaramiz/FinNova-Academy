import { describe, it, expect } from 'vitest';
import { generateWorkflow } from '../backend/src/services/workflowEngine';
import { generateBusinessExpenseEntries } from '../backend/src/services/autoEntries';
import { getPracticasModules, getPracticasModule, auditPracticasModules } from '../backend/src/services/practicasModules';
import { generateMonthPlan } from '../backend/src/services/taskPlanner';
import { getSpecialtyWorkflows } from '../backend/src/services/specialties';

const VALID_TYPES = getSpecialtyWorkflows('accounting');

describe('R-13 — Prácticas Profesionales (ruta guiada de contabilidad)', () => {
  describe('Guías 💡 en los workflows', () => {
    it('el workflow de factura incluye guías de CFDI/SAT en correo y formulario', () => {
      const wf = generateWorkflow('invoice_emission');
      const email = wf.steps.find(s => s.type === 'email');
      const form = wf.steps.find(s => s.type === 'form');
      expect(email?.guides?.length).toBeGreaterThan(0);
      expect(form?.guides?.length).toBeGreaterThan(0);
      expect(form?.guides?.some(g => g.title.includes('IVA'))).toBe(true);
      expect(form?.guides?.some(g => g.body.includes('16'))).toBe(true);
    });

    it('cada guía tiene id, title y body', () => {
      const wf = generateWorkflow('invoice_emission');
      for (const step of wf.steps) {
        for (const g of step.guides || []) {
          expect(g.id).toBeTruthy();
          expect(g.title).toBeTruthy();
          expect(g.body).toBeTruthy();
        }
      }
    });

    it('el workflow de proveedor enseña IVA acreditable', () => {
      const wf = generateWorkflow('supplier_invoice');
      const form = wf.steps.find(s => s.type === 'form');
      expect(form?.guides?.some(g => g.body.includes('acreditar') || g.body.includes('acreditable'))).toBe(true);
    });
  });

  describe('Workflow business_expense (comida empresarial)', () => {
    it('tiene estructura de pasos email → spreadsheet → result', () => {
      const wf = generateWorkflow('business_expense');
      expect(wf.taskType).toBe('business_expense');
      expect(wf.steps.map(s => s.type)).toEqual(['email', 'spreadsheet', 'result']);
    });

    it('valida IVA, total, gasto deducible (65%) e IVA acreditable', () => {
      const wf = generateWorkflow('business_expense');
      const labels = wf.validation.map(v => v.label);
      expect(labels).toContain('IVA del consumo');
      expect(labels).toContain('Total pagado');
      expect(labels).toContain('Gasto deducible');
      expect(labels).toContain('IVA acreditable');
      // La propina NO es deducible: no debe validarse como gasto deducible.
      const deducible = wf.validation.find(v => v.label === 'Gasto deducible');
      expect(deducible?.expected).toBe(Math.round((wf.steps[1].data.rows[0].cell_B) * 0.65));
    });

    it('los números salen de los motores (subtotal → IVA = 16%)', () => {
      const wf = generateWorkflow('business_expense');
      const rows = wf.steps.find(s => s.type === 'spreadsheet')!.data.rows;
      const subtotal = rows.find(r => r.label === 'Subtotal del ticket').cell_B;
      const ivaRow = rows.find(r => r.label === 'IVA del consumo (16%)').cell_B;
      expect(ivaRow).toBe(Math.round(subtotal * 0.16));
    });

    it('genera asiento contable de gasto con IVA acreditable', () => {
      const entries = generateBusinessExpenseEntries({ subtotal: 4800, iva: 768, total: 6068, propina: 500 });
      expect(entries.length).toBeGreaterThanOrEqual(4);
      expect(entries[0].account).toContain('5-03'); // gasto de administración (cargo)
      expect(entries[0].debit).toBe(4800);
      expect(entries[1].account).toContain('2-03'); // IVA acreditable (cargo)
      expect(entries[1].debit).toBe(768);
      expect(entries[2].account).toContain('1-02'); // bancos (abono)
      expect(entries[2].credit).toBe(6068);
      // La propina NO es deducible: aparece como gasto no deducible.
      const propina = entries.find(e => e.desc.includes('no deducible'));
      expect(propina).toBeTruthy();
      expect(propina!.account).toContain('5-08');
      expect(propina!.debit).toBe(500);
    });

    it('el asiento cuadra (débitos = créditos)', () => {
      const entries = generateBusinessExpenseEntries({ subtotal: 4800, iva: 768, total: 6068, propina: 500 });
      const debit = entries.reduce((s, e) => s + e.debit, 0);
      const credit = entries.reduce((s, e) => s + e.credit, 0);
      expect(debit).toBe(credit);
    });
  });

  describe('Catálogo de módulos', () => {
    it('expone al menos 4 módulos procedurales', () => {
      const modules = getPracticasModules();
      expect(modules.length).toBeGreaterThanOrEqual(4);
    });

    it('cada módulo tiene pasos con tipos válidos (guia/tarea/asiento)', () => {
      for (const m of getPracticasModules()) {
        for (const p of m.pasos) {
          expect(['guia', 'tarea', 'asiento']).toContain(p.tipo);
          expect(p.titulo).toBeTruthy();
          expect(p.descripcion).toBeTruthy();
        }
      }
    });

    it('el módulo de gastos referencia el workflow business_expense', () => {
      const mod = getPracticasModule('mod-gastos');
      expect(mod).toBeTruthy();
      expect(mod!.pasos.some(p => p.taskType === 'business_expense')).toBe(true);
    });

    it('cada paso de tarea referencia un workflow real del motor', () => {
      const issues = auditPracticasModules(VALID_TYPES);
      expect(issues).toEqual([]);
    });

    it('getPracticasModule devuelve undefined para un id inexistente', () => {
      expect(getPracticasModule('mod-inexistente')).toBeUndefined();
    });
  });

  describe('Integración con TaskPlanner', () => {
    it('el plan de prácticas incluye business_expense y tareas contables', () => {
      const plan = generateMonthPlan(6, 2026, 'practicas');
      const types = new Set(plan.tasks.map(t => t.type));
      expect(types.has('business_expense')).toBe(true);
      expect(types.has('invoice_emission')).toBe(true);
    });

    it('business_expense está registrado en los workflowTypes contables', () => {
      expect(VALID_TYPES).toContain('business_expense');
    });
  });
});