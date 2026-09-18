// TASK-D3 — Motor puro de AuditoriaSim (el componente React lo consume).
// Fuente: video auditoria (VTT verificado: 434.22, 464, 1000, 1066.67,
// 99.11, 132, cuenta 113) + spec del Gate (4606, 10000/1600, 2787.88,
// 2507 al 60%, 0.32, prorrateo 50%, 194.67, 2714, 434). Cero LLM.

export const GOLDENS = {
  diotBase16: 4606,
  ingresos: 10000,
  ivaTrasladado: 1600,
  egresos: 2787.88,
  ivaPagado: 424.22,
  parcial: 2507,
  factorParcial: 0.6,
  coeficiente: 0.32,
  prorrateo: 0.5,
  ivaACargo: 194.67,
  isrSAT: 464,
  retISR: 1000,
  ivaRetenido: 1066.67,
  neto: 99.11,
  netoRecargos: 132,
  satIngresos: 10000,
  satCompras: 2714,
  satIVA: 434,
  pueIng: 1,
  ppdIng: 7,
  pueComp: 7,
  noDeducibles: 3,
};

export type Modulo = 'M1' | 'M2' | 'M3';

// M1 = solo CFDIs: BLOQUEA DIOT con aviso.
export function validarModulo(m: Modulo): { bloqueado: boolean; aviso: string } {
  if (m === 'M1') {
    return { bloqueado: true, aviso: 'M1 es solo CFDIs: el modulo DIOT queda BLOQUEADO. Cambia en Configuración → Contabilidad → Automatización.' };
  }
  return { bloqueado: false, aviso: '' };
}

export interface DatosHoja {
  ingresos: number;
  ivaTrasladado: number;
  egresos: number;
  ivaPagado: number;
  parcial: number;
  factorParcial: number;
  coeficiente: number;
  prorrateo: number;
}

export function validarHoja(d: DatosHoja): string[] {
  const e: string[] = [];
  const g = GOLDENS;
  if (d.ingresos !== g.ingresos) e.push(`ingresos deben ser ${g.ingresos} 📚 Los ingresos de tu hoja deben ser los facturados y cobrados: si difieren, registraste algo que no facturaste o viceversa.`);
  if (d.ivaTrasladado !== g.ivaTrasladado) e.push(`IVA trasladado debe ser ${g.ivaTrasladado} 📚 Trasladado = 16% de lo cobrado (10000 × 16%): es el IVA que cobraste a clientes y le debes al SAT.`);
  if (d.egresos !== g.egresos) e.push(`egresos deben ser ${g.egresos} 📚 Los egresos de la hoja deben ser las compras y gastos con comprobante: sin CFDI no hay deducción.`);
  if (d.ivaPagado !== g.ivaPagado) e.push(`IVA pagado debe ser ${g.ivaPagado} 📚 Es el IVA que te trasladaron tus proveedores y puedes acreditar: solo vale con factura pagada (PUE) o complemento (PPD).`);
  if (d.parcial !== g.parcial || d.factorParcial !== g.factorParcial) {
    e.push(`parcial ${g.parcial} al ${g.factorParcial * 100}% 📚 Solo la parte cobrada/pagada del periodo entra al cálculo: el resto sigue pendiente y no se declara aún.`);
  }
  if (d.coeficiente !== g.coeficiente) e.push(`coeficiente mensual ${g.coeficiente} (no 0.2) 📚 El coeficiente de utilidad sale de tu declaración anual, no se inventa: usar el de otro ejercicio te calcula mal el ISR.`);
  if (d.prorrateo !== g.prorrateo) e.push(`prorrateo ${g.prorrateo * 100}% 📚 Si mezclas actividades gravadas y exentas, solo acreditas la proporción que corresponde a lo gravado.`);
  return e;
}

export function cuadrar(v: { diot: number; hoja: number; reporte: number }): string[] {
  if (v.diot !== v.hoja || v.hoja !== v.reporte) {
    return [`no cuadra: DIOT=${v.diot} hoja=${v.hoja} reporte=${v.reporte} (DIOT=hoja=reporte) 📚 DIOT, hoja y reporte son tres fotos del mismo mes: si difieren, una de las tres miente y el SAT lo nota primero.`];
  }
  return [];
}

export interface DatosSAT {
  ingresos: number;
  compras: number;
  iva: number;
  pueIng: number;
  ppdIng: number;
  pueComp: number;
  noDeducibles: number;
  isr: number;
  retIsr: number;
}

export function validarSAT(d: DatosSAT): string[] {
  const e: string[] = [];
  const g = GOLDENS;
  if (d.ingresos !== g.satIngresos) e.push(`SAT ingresos ${g.satIngresos} 📚 Lo que el SAT tiene de ti debe ser lo que declaras: si el portal dice otro número, te falta descargar XML.`);
  if (d.compras !== g.satCompras) e.push(`SAT compras ${g.satCompras} 📚 Tus compras según el SAT son tus CFDI recibidos: si no coinciden, hay facturas que no registraste.`);
  if (Math.abs(d.iva - g.satIVA) > 1) e.push(`SAT IVA ${g.satIVA} ±1 📚 El SAT redondea distinto a tu hoja: ±1 peso es tolerancia de redondeo, más que eso es diferencia real.`);
  if (d.pueIng !== g.pueIng) e.push(`${g.pueIng} PUE ing 📚 PUE = Pago en Una exhibición: se declara al cobrarse, con el CFDI pagado.`);
  if (d.ppdIng !== g.ppdIng) e.push(`${g.ppdIng} PPD ing 📚 PPD = Pago en Parcialidades: cada parcialidad necesita su complemento de pago para acreditarse.`);
  if (d.pueComp !== g.pueComp) e.push(`${g.pueComp} PUE comp 📚 Las compras PUE se acreditan al pagarlas: verifica que el método de pago sea PUE en el XML.`);
  if (d.noDeducibles !== g.noDeducibles) e.push(`${g.noDeducibles} no deducibles 📚 Hay gastos que la ley no deja deducir aunque tengan factura: van aparte para no inflar la deducción.`);
  if (d.isr !== g.isrSAT) e.push(`ISR SAT ${g.isrSAT} 📚 El ISR del portal sale de tus ingresos menos deducciones autorizadas por el coeficiente: recalcúlalo por ese camino.`);
  if (d.retIsr !== g.retISR) e.push(`retencion ISR ${g.retISR} (saldo a favor) 📚 Las retenciones que te hicieron son pagos anticipados a tu favor: si no las registras, pagas de más.`);
  return e;
}

export interface DatosPoliza {
  trasladado: number;
  retenido: number;
  acreditable: number;
  porPagar: number;
}

// Trasladado + Retenido vs Acreditable + IVA por pagar: debitos = creditos.
export function polizaCierre(d: DatosPoliza): string[] {
  const debe = Math.round((d.trasladado + d.retenido) * 100) / 100;
  const haber = Math.round((d.acreditable + d.porPagar) * 100) / 100;
  if (Math.abs(debe - haber) > 0.015) {
    return [`no cuadra: debe ${debe} vs haber ${haber} (Trasladado + Retenido = Acreditable + Por pagar) 📚 Partida doble: todo cargo tiene su abono; si debe ≠ haber, la póliza está incompleta y no debe cerrarse.`];
  }
  return [];
}

export type CasoABC = 'a' | 'b' | 'c';

const CASOS_ABC: Record<CasoABC, { titulo: string; correcta: string; 'por que': string; distractores: string[] }> = {
  a: {
    titulo: 'Caso A · 72h sin XML',
    correcta: 'reaplicar-31-dic',
    'por que': 'Pasadas 72h sin XML en el SAT, se reaplica la descarga al 31-dic y se concilia manual.',
    distractores: ['dejar-72h', 'omitir-factura'],
  },
  b: {
    titulo: 'Caso B · Corte bancario distinto',
    correcta: 'alta-manual-31-ene',
    'por que': 'Con corte distinto al mes natural, alta manual del periodo al 31-ene.',
    distractores: ['esperar-corte', 'dividir-excel'],
  },
  c: {
    titulo: 'Caso C · PPD sin complemento',
    correcta: 'exigir-complemento',
    'por que': 'PPD sin complemento de pago no acredita: hay que exigirlo al proveedor.',
    distractores: ['omitir-ppd', 'acreditar-sin-complemento'],
  },
};

export function resolverCasoABC(caso: CasoABC, accion: string): { ok: boolean; mensaje: string } {
  const c = CASOS_ABC[caso];
  if (!c) return { ok: false, mensaje: 'caso desconocido' };
  if (accion === c.correcta) return { ok: true, mensaje: `✅ ${c.titulo}: ${c['por que']}` };
  return { ok: false, mensaje: `❌ ${c.titulo}: esa salida no resuelve. Pista: ${c['por que']}` };
}

export function opcionesCasoABC(caso: CasoABC): string[] {
  const c = CASOS_ABC[caso];
  return [c.correcta, ...c.distractores];
}
