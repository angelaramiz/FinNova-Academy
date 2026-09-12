// Validadores DIOT — reglas SAT puras (sin UI). Usados por práctica/examen
// y por el futuro revisor de moldes para calificar sin depender del lab.
import { TIPOS_OP } from './constants';
import type { TasaIVA } from './types';
import { calcularIVA } from './scenarioEngine';

export interface DiotValidation {
  ok: boolean;
  codigo?: string;
  detalle?: string;
}

/** RFC persona moral/física: 3-4 letras + 6 fecha válida + 3 homoclave. */
export function validarRFC(rfc: string): DiotValidation {
  const v = (rfc ?? '').trim().toUpperCase();
  if (v.length !== 13) return { ok: false, codigo: 'RFC_CORTO', detalle: `Debe tener 13 caracteres (trae ${v.length}).` };
  if (!/^[A-ZÑ&]{3,4}/.test(v)) return { ok: false, codigo: 'RFC_FORMATO', detalle: 'Debe iniciar con 3-4 letras.' };
  const fecha = v.slice(v.length - 9, v.length - 3);
  if (!/^\d{6}$/.test(fecha)) return { ok: false, codigo: 'RFC_FORMATO', detalle: 'Bloque de fecha no numérico.' };
  const anio = Number(fecha.slice(0, 2));
  const mes = Number(fecha.slice(2, 4));
  const dia = Number(fecha.slice(4, 6));
  void anio;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return { ok: false, codigo: 'RFC_FECHA', detalle: `Fecha ${fecha} inválida.` };
  const homoclave = v.slice(-3);
  if (!/^[A-Z0-9]{3}$/.test(homoclave)) return { ok: false, codigo: 'RFC_HOMOCLAVE', detalle: 'Homoclave debe ser alfanumérica (3).' };
  return { ok: true };
}

/** Monto DIOT: positivo, máximo 2 decimales. */
export function validarMonto(monto: number): DiotValidation {
  if (!Number.isFinite(monto)) return { ok: false, codigo: 'MONTO_NAN', detalle: 'Monto no numérico.' };
  if (monto <= 0) return { ok: false, codigo: 'MONTO_NEGATIVO', detalle: 'En DIOT todos los montos son positivos.' };
  if (Math.round(monto * 100) !== monto * 100) return { ok: false, codigo: 'MONTO_DECIMALES', detalle: 'Máximo 2 decimales.' };
  return { ok: true };
}

/** IVA = |monto| × tasa (tolerancia de centavos por redondeo). */
export function validarIVA(monto: number, tasa: TasaIVA, iva: number): DiotValidation {
  const esperado = calcularIVA(Math.abs(monto), tasa);
  if (Math.abs(esperado - iva) > 0.011) {
    return { ok: false, codigo: 'IVA_MISMATCH', detalle: `Esperado $${esperado} con tasa ${tasa}%.` };
  }
  return { ok: true };
}

/** Tipo de operación 1-5 del catálogo. */
export function validarTipo(tipo: number): DiotValidation {
  if (!TIPOS_OP[tipo as keyof typeof TIPOS_OP]) return { ok: false, codigo: 'TIPO_INVALIDO', detalle: 'Tipo debe ser 1-5.' };
  return { ok: true };
}
