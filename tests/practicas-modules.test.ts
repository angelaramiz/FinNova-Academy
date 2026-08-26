import { describe, it, expect } from 'vitest';
import { generateWorkflow } from '../backend/src/services/workflowEngine';
import { generateBusinessExpenseEntries } from '../backend/src/services/autoEntries';
import { getPracticasModules, getPracticasModule, auditPracticasModules, buildPracticasTracker, getPracticasCursos, getPracticaCurso, evaluatePracticaPrueba } from '../backend/src/services/practicasModules';
import { generateMonthPlan } from '../backend/src/services/taskPlanner';
import { getSpecialtyWorkflows } from '../backend/src/services/specialties';
import { getNpc } from '../backend/src/data/worldBible';

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
      // Cada fila editable (transcrita/calculada por el alumno) tiene una regla.
      const editableRows = wf.steps.find(s => s.type === 'spreadsheet')!.data.rows.filter((r: any) => r.editable);
      for (const r of editableRows) {
        const hasRule = wf.validation.some(v => v.field === `row_${r.label}`);
        expect(hasRule).toBe(true);
      }
      // La propina NO es deducible: no debe validarse como gasto deducible.
      const subtotal = wf.steps.find(s => s.type === 'spreadsheet')!.data.rows.find((r: any) => r.label === 'Subtotal del ticket').cell_B;
      const deducible = wf.validation.find(v => v.label === 'Gasto deducible');
      expect(deducible?.expected).toBe(Math.round(subtotal * 0.65));
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

    it('NO auto-aprueba: respuestas correctas pasan, incorrectas reprueban (regresión INC-001)', () => {
      const wf = generateWorkflow('business_expense');
      const rows = wf.steps.find(s => s.type === 'spreadsheet')!.data.rows;
      const build = (useCorrect: boolean) => {
        const answers: Record<string, any> = {};
        for (const r of rows) {
          answers[`row_${r.label}`] = useCorrect ? r.cell_B : (typeof r.cell_B === 'string' ? 'xx' : 0);
        }
        let total = 0, max = 0;
        for (const rule of wf.validation) {
          const ua = answers[rule.field];
          if (ua === undefined) continue;
          max += rule.points;
          const un = Number(ua), en = Number(rule.expected), tol = rule.tolerance ?? 0;
          const pass = rule.type === 'calculated'
            ? Math.abs(un - en) <= tol
            : String(ua).trim().toLowerCase() === String(rule.expected).trim().toLowerCase();
          if (pass) total += rule.points;
        }
        return { max, pct: max > 0 ? Math.round(total / max * 100) : 0, pass: max > 0 && total >= max * 0.6 };
      };
      const ok = build(true);
      expect(ok.max).toBeGreaterThan(0); // si max=0 auto-aprueba (bug)
      expect(ok.pct).toBe(100);
      expect(ok.pass).toBe(true);
      const bad = build(false);
      expect(bad.pass).toBe(false);
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

  describe('R-13.5 — Tracker semanal (mecanización por tema)', () => {
    it('el tracker expone las 4 semanas del plan de prácticas', () => {
      const tracker = buildPracticasTracker(7, 2026);
      expect(tracker.length).toBe(4);
      expect(tracker.map(s => s.week)).toEqual([1, 2, 3, 4]);
    });

    it('cada semana tiene tema, objetivo y módulo real', () => {
      const tracker = buildPracticasTracker(7, 2026);
      for (const s of tracker) {
        expect(s.tema).toBeTruthy();
        expect(s.objetivo).toBeTruthy();
        expect(getPracticasModule(s.moduloId)).toBeTruthy();
      }
    });

    it('las repeticiones salen del plan real (business_expense se repite en la semana 2)', () => {
      const tracker = buildPracticasTracker(7, 2026);
      const week2 = tracker.find(s => s.week === 2)!;
      const be = week2.repeticiones.find(r => r.taskType === 'business_expense');
      expect(be).toBeTruthy();
      expect(be!.veces).toBeGreaterThanOrEqual(1);
      expect(be!.explicacion.length).toBeGreaterThan(10);
    });

    it('cada repetición explica POR QUÉ se repite (mecanización)', () => {
      const tracker = buildPracticasTracker(7, 2026);
      for (const s of tracker) {
        for (const r of s.repeticiones) {
          expect(r.explicacion.length).toBeGreaterThan(15);
        }
      }
    });

    it('cada semana incluye la prueba del tema (con preguntas)', () => {
      const tracker = buildPracticasTracker(7, 2026);
      for (const s of tracker) {
        expect(s.prueba.preguntas.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('R-13.5 — Cursos teóricos con el NPC capacitador', () => {
    it('cada módulo tiene un curso con el NPC capacitador', () => {
      for (const m of getPracticasModules()) {
        expect(m.curso).toBeTruthy();
        expect(m.curso.npc).toBe('capacitador');
        expect(m.curso.secciones.length).toBeGreaterThan(0);
        expect(m.curso.introduccion.length).toBeGreaterThan(10);
        expect(m.curso.cierre.length).toBeGreaterThan(10);
      }
    });

    it('el NPC capacitador existe en el mundo vivo (worldBible) con ruta contable', () => {
      const npc = getNpc('capacitador');
      expect(npc).toBeTruthy();
      expect(npc!.route).toBe('contable');
      expect(npc!.company).toBe('lno');
    });

    it('getPracticaCurso devuelve el curso del módulo gastos', () => {
      const curso = getPracticaCurso('mod-gastos');
      expect(curso).toBeTruthy();
      expect(curso!.titulo).toContain('gastos');
      expect(curso!.secciones.some(s => s.texto.includes('65%'))).toBe(true);
    });

    it('los cursos se listan vía getPracticasCursos (uno por módulo)', () => {
      const cursos = getPracticasCursos();
      expect(cursos.length).toBe(getPracticasModules().length);
    });
  });

  describe('R-13.5 — Prueba de conocimiento al final de cada tema', () => {
    it('evaluatePracticaPrueba acierta con todas las respuestas correctas', () => {
      const res = evaluatePracticaPrueba('mod-gastos', [2, 1, 1, 2]);
      expect(res.aciertos).toBe(4);
      expect(res.scorePct).toBe(100);
      expect(res.aprobado).toBe(true);
      expect(res.resultados.every(r => r.acierto)).toBe(true);
    });

    it('evaluatePracticaPrueba reprueba con respuestas incorrectas', () => {
      const res = evaluatePracticaPrueba('mod-gastos', [0, 0, 0, 0]);
      expect(res.aprobado).toBe(false);
      expect(res.scorePct).toBeLessThan(50);
    });

    it('cada pregunta tiene una explicación pedagógica', () => {
      for (const m of getPracticasModules()) {
        for (const p of m.prueba.preguntas) {
          expect(p.explicacion.length).toBeGreaterThan(10);
          expect(p.correcta).toBeGreaterThanOrEqual(0);
          expect(p.correcta).toBeLessThan(p.opciones.length);
        }
      }
    });

    it('el módulo de CFDI prueba que el IVA correcto es 16% (no 10%)', () => {
      const res = evaluatePracticaPrueba('mod-cfdi', [1, 2, 2, 1]);
      expect(res.aprobado).toBe(true);
      const pregunta = getPracticasModule('mod-cfdi')!.prueba.preguntas[2];
      expect(pregunta.q).toContain('IVA');
      expect(pregunta.opciones[2]).toContain('16%');
    });

    it('la prueba del módulo gastos valida que la propina NO es deducible', () => {
      const pregunta = getPracticasModule('mod-gastos')!.prueba.preguntas[0];
      expect(pregunta.q).toContain('NO es deducible');
      expect(pregunta.correcta).toBe(2);
    });
  });

  describe('R-13.5 — Auditoría ampliada', () => {
    it('auditPracticasModules valida cursos, pruebas y tracker', () => {
      const issues = auditPracticasModules(VALID_TYPES);
      expect(issues).toEqual([]);
    });
  });

  describe('COMPROBACIÓN DE TAREA — la actividad coincide con el módulo y NO auto-aprueba (INC-001/002)', () => {
    // Mapeo módulo → taskType (tarea que el alumno ejecuta) y su skill/objetivo.
    const MODULO_TAREA: Record<string, { taskType: string; skill: string }> = {
      'mod-cfdi': { taskType: 'invoice_emission', skill: 'facturacion' },
      'mod-gastos': { taskType: 'business_expense', skill: 'gastos' },
      'mod-cobranza': { taskType: 'payment_registration', skill: 'cobranza' },
      'mod-proveedores': { taskType: 'supplier_invoice', skill: 'proveedores' },
      'mod-nomina': { taskType: 'payroll', skill: 'nomina' },
      'mod-cierre': { taskType: 'bank_reconciliation', skill: 'conciliacion' },
    };

    it('cada módulo referencia la tarea correcta según su objetivo (no hay desalineación tema↔actividad)', () => {
      for (const m of getPracticasModules()) {
        const map = MODULO_TAREA[m.id];
        expect(map, `módulo ${m.id} sin mapeo`).toBeTruthy();
        // El módulo debe tener al menos un paso tarea con su taskType correcto.
        const paso = m.pasos.find(p => p.tipo === 'tarea');
        expect(paso, `módulo ${m.id} sin paso tarea`).toBeTruthy();
        expect(paso!.taskType).toBe(map.taskType);
        expect(m.skill).toBe(map.skill);
      }
    });

    it('ningún workflow de prácticas auto-aprueba: cada fila/campo editable tiene regla de validación', () => {
      const spreadsheetSteps = ['business_expense', 'payroll', 'bank_reconciliation', 'cash_cut'];
      for (const mod of getPracticasModules()) {
        const map = MODULO_TAREA[mod.id];
        const wf = generateWorkflow(map.taskType);
        // Recolecta campos/filas editables (los que el alumno envía).
        const step = wf.steps.find(s => s.type === 'spreadsheet' || s.type === 'form');
        const editableKeys: string[] = [];
        if (step?.type === 'spreadsheet') {
          for (const r of step.data.rows) {
            if (r.editable !== false) editableKeys.push(`row_${r.label}`);
          }
        } else if (step?.type === 'form') {
          for (const f of step.data.fields) editableKeys.push(f.key);
        }
        for (const key of editableKeys) {
          const hasRule = wf.validation.some(v => v.field === key);
          expect(hasRule, `[${mod.id}] el campo editable '${key}' no tiene regla de validación → auto-aprueba`).toBe(true);
        }
        // maxPossible > 0 (realmente evalúa).
        const max = wf.validation.reduce((s, v) => s + v.points, 0);
        expect(max, `[${mod.id}] maxPossible=0 (auto-aprueba)`).toBeGreaterThan(0);
      }
    });

    it('payroll usa TARIFA PROGRESIVA, NO 15% fijo (coherencia con su lección y módulo)', () => {
      const wf = generateWorkflow('payroll');
      const email = wf.steps.find(s => s.type === 'email');
      const body = email!.data.body;
      expect(body).toMatch(/progresiva|tarifa|tramo/i);
      expect(body).not.toMatch(/ISR:\s*15%/);
      // Ninguna regla valida un "ISR 15%".
      expect(wf.validation.some(v => v.field.includes('15%'))).toBe(false);
      // Hay ISR por empleado (progresivo) y se valida cada uno.
      expect(wf.validation.some(v => v.field.includes('ISR'))).toBe(true);
    });
  });
});