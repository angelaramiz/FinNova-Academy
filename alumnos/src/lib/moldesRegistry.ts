import { validateMolde } from './revisorMoldes';
import auditoria from '../data/capacitaciones/auditoria.json';
import conciliacion from '../data/capacitaciones/conciliacion.json';
import nomina from '../data/capacitaciones/nomina.json';
import reporteImpuestos from '../data/capacitaciones/reporte-impuestos.json';

// TASK-1-2 (Revisor de moldes): registro versionado de moldes + auditoria.
// Un molde = JSON de capacitacion + su contrato (validateMolde).

export interface MoldeRegistrado {
  id: string;
  version: string;
  fuente: string;
  validado_en: string;
}

export interface ResultadoAuditoria {
  id: string;
  errores: string[];
}

const DATOS: Record<string, unknown> = {
  auditoria,
  conciliacion,
  nomina,
  'reporte-impuestos': reporteImpuestos,
};

export const MOLDES: MoldeRegistrado[] = [
  {
    id: 'auditoria',
    version: '1',
    fuente: 'alumnos/src/data/capacitaciones/auditoria.json',
    validado_en: '2026-09-12',
  },
  {
    id: 'conciliacion',
    version: '1',
    fuente: 'alumnos/src/data/capacitaciones/conciliacion.json',
    validado_en: '2026-09-12',
  },
  {
    id: 'nomina',
    version: '1',
    fuente: 'alumnos/src/data/capacitaciones/nomina.json',
    validado_en: '2026-09-12',
  },
  {
    id: 'reporte-impuestos',
    version: '1',
    fuente: 'alumnos/src/data/capacitaciones/reporte-impuestos.json',
    validado_en: '2026-09-12',
  },
];

export function auditMoldes(): ResultadoAuditoria[] {
  return MOLDES.map((m) => ({ id: m.id, errores: validateMolde(DATOS[m.id]) }));
}
