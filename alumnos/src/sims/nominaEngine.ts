// TASK-D4 — Motor puro de NominaSim (el componente React lo consume).
// Fuente: video de nomina (transcripcion verificada) + spec del Gate.
// Tarifa ISR progresiva R-14 OBLIGATORIA (misma del backend workflowEngine
// isrProgresivo): tramo 1 hasta 6000 -> 0; tramo 2 6000-30000 ->
// 115.20 + 6.4% del excedente; tramo 3 +30000 -> 1651.20 + 10.88%.
// NUNCA 15% fijo (trampa #4). Cero LLM.

// Tramo 1: hasta 6000 -> 0. Tramo 2: 6000-30000 -> 115.20 + 6.4%.
// Tramo 3: +30000 -> 1651.20 + 10.88%. (Tarifa R-14 del simulador.)
export function calcularISR(bruto: number): number {
  if (bruto <= 6000) return 0;
  if (bruto <= 30000) return Math.round(115.2 + (bruto - 6000) * 0.064);
  return Math.round(1651.2 + (bruto - 30000) * 0.1088);
}

export interface DatosNomina {
  diario: number;
  dias: number;
  esMinimo: boolean;
  causaISR: boolean;
  asimilada: boolean;
  montoAsimilada?: number;
}

export interface ResultadoNomina {
  bruto: number;
  isr: number;
  imss: number;
  neto: number;
}

export function calcularNomina(d: DatosNomina): ResultadoNomina {
  if (d.asimilada) {
    const bruto = d.montoAsimilada || 0;
    const isr = calcularISR(bruto);
    return { bruto, isr, imss: 0, neto: Math.round((bruto - isr) * 100) / 100 };
  }
  const bruto = Math.round(d.diario * d.dias * 100) / 100;
  if (d.esMinimo) return { bruto, isr: 0, imss: 0, neto: bruto };
  const isr = d.causaISR ? calcularISR(bruto) : 0;
  // Simplificación didáctica declarada: cuota obrera fija 5% del bruto.
  // La LSS real calcula por ramos de seguro (no es una tasa única).
  const imss = Math.round(bruto * 0.05 * 100) / 100;
  return { bruto, isr, imss, neto: Math.round((bruto - isr - imss) * 100) / 100 };
}

export interface DatosEmpresa {
  razon: string;
  regimen: string;
  cp: string;
  cer: string;
  key: string;
  pass: string;
  logoMB: number;
}

export function validarEmpresa(e: DatosEmpresa): string[] {
  const errores: string[] = [];
  if (!e.razon.trim()) errores.push('razón social requerida (vs constancia)');
  if (!e.regimen.trim()) errores.push('régimen requerido');
  if (!e.cp.trim()) errores.push('CP requerido');
  if (!e.cer || !e.key || !e.pass) errores.push('CSD incompleto: cer + key + password');
  if (!(e.logoMB <= 2)) errores.push('logo debe ser imagen de máximo 2MB');
  return errores;
}

export function periodos(periodicidad: 'semanal' | 'quincenal', modoQuincenal: '15' | '15.2' = '15'): string[] {
  if (periodicidad === 'semanal') return ['20–26 jul', '27 jul–2 ago'];
  const suf = modoQuincenal === '15.2' ? ' (15.2)' : '';
  return [`16–31${suf}`, `1–15${suf}`];
}

export interface Empleado {
  nombre: string;
  periodicidad: 'semanal' | 'quincenal';
}

export function filtroOrdinaria(emps: Empleado[], periodicidad: 'semanal' | 'quincenal'): Empleado[] {
  return emps.filter((e) => e.periodicidad === periodicidad);
}

export function aplicarIncidencias(periodo: string, inc: { vacaciones: number; he: number; festivo: number }): { aplicadas: boolean; mensaje: string } {
  if (periodo === '20–26 jul') {
    return { aplicadas: true, mensaje: `Camila ${inc.vacaciones} días vacaciones; Emilio ${inc.he} HE + ${inc.festivo} festivo aplicados.` };
  }
  return { aplicadas: false, mensaje: 'las extras solo afectan el periodo 20–26.' };
}

export interface ConceptoCuenta {
  concepto: string;
  cuenta: string;
}

export function validarCuentas(conceptos: ConceptoCuenta[]): string[] {
  return conceptos.filter((c) => !c.cuenta.trim()).map((c) => `${c.concepto} sin cuenta contable: las extraordinarias sin cuenta se detectan aquí`);
}

export function timbrar(t: { seleccionados: number; total: number; contraCaja: boolean; fechaXML: string }): { ok: boolean; mensaje: string } {
  if (t.seleccionados <= 0) return { ok: false, mensaje: 'palomea todos o uno por uno' };
  if (!t.contraCaja) return { ok: false, mensaje: 'en efectivo va contra caja' };
  if (!t.fechaXML) return { ok: false, mensaje: 'fecha del XML requerida' };
  return { ok: true, mensaje: `${t.seleccionados}/${t.total} timbrados, pago automático (modalidad CFDIs), lista de raya PDF/Excel lista.` };
}
