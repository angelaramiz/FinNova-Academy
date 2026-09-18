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
  if (!e.razon.trim()) errores.push('razón social requerida (vs constancia) 📚 Debe ser idéntica a la Constancia de Situación Fiscal: el SAT valida el timbrado contra ese nombre y una coma de diferencia lo rechaza.');
  if (!e.regimen.trim()) errores.push('régimen requerido 📚 El régimen fiscal (ej. 601 General de Ley) define las obligaciones de la empresa; va en el CFDI y debe coincidir con la constancia.');
  if (!e.cp.trim()) errores.push('CP requerido 📚 El código postal del domicilio fiscal es dato obligatorio del CFDI 4.0 y debe ser el de la constancia.');
  if (!e.cer || !e.key || !e.pass) errores.push('CSD incompleto: cer + key + password 📚 Sin Certificado de Sello Digital vigente no hay timbrado: el .cer firma y el .key con su contraseña autoriza cada CFDI ante el SAT.');
  if (!(e.logoMB <= 2)) errores.push('logo debe ser imagen de máximo 2MB 📚 El logo solo adorna el recibo: si pesa más, el PDF se vuelve lento e inservible para enviar por correo.');
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
  return conceptos.filter((c) => !c.cuenta.trim()).map((c) => `${c.concepto} sin cuenta contable 📚 Toda percepción y deducción debe amarrarse a una cuenta (Anexo 24): sin cuenta, el asiento de nómina descuadra y el gasto no es deducible.`);
}

// ---- P2: Vista previa del CFDI de Nómina 4.0 (antes de timbrar) ----
// Todo determinista: el sello y el UUID simulados salen de los datos
// (mismo hash que folioAcuse del DIOT). NUNCA random. Cero LLM.
export function selloSimulado(s: string): string {
  let h1 = 7;
  let h2 = 13;
  for (let i = 0; i < s.length; i++) {
    h1 = (Math.imul(h1, 31) + s.charCodeAt(i)) >>> 0;
    h2 = (Math.imul(h2, 37) + s.charCodeAt(i + 1 < s.length ? i + 1 : 0)) >>> 0;
  }
  const hex = (h: number) => (h >>> 0).toString(16).padStart(8, '0');
  return `${hex(h1)}${hex(h2)}${hex(h1 ^ h2)}${hex((h2 ^ 0x9e3779b9) >>> 0)}`.toUpperCase();
}

export function uuidSimulado(s: string): string {
  const h = selloSimulado(`uuid|${s}`).toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export interface DatosCFDI {
  razon: string;
  regimen: string;
  cp: string;
  empleadoNombre: string;
  empleadoRfc: string;
  empleadoCurp: string;
  empleadoNss: string;
  diario: number;
  dias: number;
  bruto: number;
  isr: number;
  imss: number;
  neto: number;
  fecha: string;
}

export interface VistaPreviaCFDI {
  emisor: { razon: string; regimen: string; cp: string };
  receptor: { nombre: string; rfc: string; curp: string; nss: string };
  concepto: { clave: string; descripcion: string; importe: number };
  complementoNomina: { dias: number; percepciones: number; deduccionISR: number; deduccionIMSS: number; neto: number };
  fecha: string;
  cadenaOriginal: string;
  selloSimulado: string;
  uuidSimulado: string;
}

export function vistaPreviaCFDI(d: DatosCFDI): VistaPreviaCFDI {
  const base = `${d.razon}|${d.empleadoRfc}|${d.bruto}|${d.fecha}`;
  return {
    emisor: { razon: d.razon, regimen: d.regimen, cp: d.cp },
    receptor: { nombre: d.empleadoNombre, rfc: d.empleadoRfc, curp: d.empleadoCurp, nss: d.empleadoNss },
    concepto: { clave: '84111505', descripcion: 'Sueldos y salarios', importe: d.bruto },
    complementoNomina: { dias: d.dias, percepciones: d.bruto, deduccionISR: d.isr, deduccionIMSS: d.imss, neto: d.neto },
    fecha: d.fecha,
    cadenaOriginal: `||4.0|${d.razon}|${d.regimen}|${d.cp}|${d.empleadoRfc}|${d.bruto.toFixed(2)}|${d.neto.toFixed(2)}|${d.fecha}||`,
    selloSimulado: selloSimulado(base),
    uuidSimulado: uuidSimulado(base),
  };
}

export function timbrar(t: { seleccionados: number; total: number; contraCaja: boolean; fechaXML: string }): { ok: boolean; mensaje: string } {
  if (t.seleccionados <= 0) return { ok: false, mensaje: 'palomea todos o uno por uno 📚 Timbrar es firmar ante el SAT: solo se timbra lo revisado; lo no palomeado queda pendiente y fiscalmente no existe.' };
  if (!t.contraCaja) return { ok: false, mensaje: 'en efectivo va contra caja 📚 El pago en efectivo sale de caja, no de bancos: si lo cargas a bancos, tu conciliación bancaria nacerá descuadrada.' };
  if (!t.fechaXML) return { ok: false, mensaje: 'fecha del XML requerida 📚 La fecha del comprobante define a qué periodo pertenecen el gasto y la retención: sin fecha no hay periodo.' };
  return { ok: true, mensaje: `${t.seleccionados}/${t.total} timbrados, pago automático (modalidad CFDIs), lista de raya PDF/Excel lista.` };
}
