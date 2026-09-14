// TASK-D2 — Motor puro de ConciliacionSim (el componente React lo consume).
// Fuente: webinar Pedro Castillo (VTT conciliacion) + spec del Gate.
// Todos los montos son goldens del video. Cero LLM.
export interface AltaBanco {
  nombre: string;
  cuenta: string;
  saldoInicial: number;
  clabe: string;
  moneda: 'MN' | 'USD';
}

export function validarAltaBanco(b: AltaBanco): string[] {
  const errores: string[] = [];
  if (!b.nombre.trim()) errores.push('nombre del banco requerido');
  if (!b.cuenta.trim()) errores.push('cuenta contable requerida (ej. 102-01-001)');
  if (!(b.saldoInicial >= 0)) errores.push('saldo inicial debe ser numero >= 0');
  if (b.clabe && ![10, 16, 18].includes(b.clabe.length)) {
    errores.push('CLABE debe ser de 10, 16 o 18 digitos (o vacia)');
  }
  if (b.moneda !== 'MN' && b.moneda !== 'USD') errores.push('moneda MN o USD (no editable tras conciliar)');
  return errores;
}

export interface Caratula {
  inicial: number;
  depositos: number;
  retiros: number;
  final: number;
}

export function validarCaratula(c: Caratula): string[] {
  const esperado = Math.round((c.inicial + c.depositos - c.retiros) * 100) / 100;
  if (Math.abs(esperado - c.final) > 0.015) {
    return [`carátula no cuadra: inicial + depositos - retiros = ${esperado}, final ${c.final}`];
  }
  return [];
}

export interface Movimiento {
  id: number;
  monto: number;
  descripcion: string;
}

export interface FacturaCandidata {
  folio: string;
  monto: number;
}

export function sugerirPorMonto(mov: Movimiento, facturas: FacturaCandidata[]): FacturaCandidata[] {
  const porMonto = facturas.filter((f) => Math.abs(f.monto - mov.monto) < 1);
  const porFolio = facturas.filter((f) => mov.descripcion.includes(f.folio));
  const resto = facturas.filter((f) => !porMonto.includes(f) && !porFolio.includes(f));
  return [...porFolio, ...porMonto, ...resto];
}

// ---- 8 casos del webinar ----
export interface CasoConciliacion {
  id: string;
  titulo: string;
  descripcion: string;
  teoria: string;
}

export const CASOS: CasoConciliacion[] = [
  {
    id: 'parcial',
    titulo: 'Pago parcial de factura',
    descripcion: 'Factura 4419.60, el banco trae 1219.60. Solo se concilia lo del banco; resto 3200.00.',
    teoria: 'Se respetan las entradas y salidas del banco: concilia el movimiento, no la factura completa.',
  },
  {
    id: 'uno-vs-dos',
    titulo: 'Un movimiento, dos facturas',
    descripcion: 'Cobro masivo: 89.50 + 65.98. Resto 626.20 pendiente con el siguiente folio.',
    teoria: 'Limpia filtros, busca por cliente, agrega folios uno por uno.',
  },
  {
    id: 'n-vs-uno',
    titulo: 'Dos movimientos, una factura',
    descripcion: 'Pagos al proveedor 4062 + 4000 contra factura folio 51010.',
    teoria: 'Tipico de comisiones o pagos en partes: ambos movimientos se concilian por su parte.',
  },
  {
    id: 'usd',
    titulo: 'Pesos contra factura en dolares',
    descripcion: 'Factura 45 USD, movimiento 789. TC = 789/45 con todos los decimales; el centavo va a cuenta.',
    teoria: 'TC con todos los decimales de tu calculadora o queda diferencia.',
  },
  {
    id: 'traspaso',
    titulo: 'Traspaso entre bancos',
    descripcion: 'SIEMPRE por cuenta puente 899/104. Directo a otro banco duplica la poliza.',
    teoria: 'Retiro: cargo a 899-04, abono a BBVA. Deposito: cargo a Santander, abono a 899-04. Queda en ceros.',
  },
  {
    id: 'rebote',
    titulo: 'Movimiento rebotado',
    descripcion: 'Retiro 150 devuelto 150: se puentean igual que un traspaso, sin duplicar.',
    teoria: 'Salida y entrada por 899-04: no se duplica el efecto.',
  },
  {
    id: 'reembolso',
    titulo: 'Reembolso a socio',
    descripcion: '2 facturas por 2018.40 via cuenta de reembolso del socio (viaticos).',
    teoria: 'Primero el gasto contra el deudor/acreedor; luego el retiro puenteado y el deposito que deja en ceros.',
  },
  {
    id: 'auto',
    titulo: 'Autoconciliacion',
    descripcion: '12 movimientos: 10 automaticos, 2 a pendientes para hacerlo manual.',
    teoria: 'El algoritmo casa monto + fecha + folio/RFC/folio fiscal; lo que no puede, a pendientes.',
  },
];

export interface ResultadoCaso {
  ok: boolean;
  mensaje: string;
  resto?: number;
  aplicado?: number;
  conciliados?: number;
  pendientes?: number;
  duplicado?: boolean;
}

const FACTURA_PARCIAL = 4419.6;
const FACTURAS_UNO_DOS = [89.5, 65.98];
const RESTO_UNO_DOS = 626.2;
const MOVS_N_UNO = [4062, 4000];
const USD_FACTURA = 45;
const USD_MOVIMIENTO = 789;
const REBOTE = 150;
const REEMBOLSO = 2018.4;
const CUENTA_PUENTE = '899-04';

export function aplicarCaso(id: string, payload: Record<string, unknown>): ResultadoCaso {
  switch (id) {
    case 'parcial': {
      const m = Number(payload.montoAplicado);
      if (!(m > 0)) return { ok: false, mensaje: 'indica el monto del movimiento bancario' };
      if (Math.abs(m - 1219.6) > 0.015) return { ok: false, mensaje: 'el banco trae 1219.60, no el total de la factura' };
      return { ok: true, mensaje: 'conciliado por lo del banco', resto: Math.round((FACTURA_PARCIAL - m) * 100) / 100 };
    }
    case 'uno-vs-dos': {
      const folios = payload.folios;
      if (!Array.isArray(folios) || folios.length !== 2) return { ok: false, mensaje: 'agrega los 2 folios' };
      const aplicado = FACTURAS_UNO_DOS[0] + FACTURAS_UNO_DOS[1];
      return { ok: true, mensaje: `2 facturas relacionadas (${aplicado.toFixed(2)})`, resto: RESTO_UNO_DOS, aplicado };
    }
    case 'n-vs-uno': {
      if (payload.folio !== '51010') return { ok: false, mensaje: 'la factura es el folio 51010' };
      const montos = payload.montos;
      if (!Array.isArray(montos) || montos.length !== 2) return { ok: false, mensaje: 'selecciona los 2 movimientos' };
      const aplicado = MOVS_N_UNO[0] + MOVS_N_UNO[1];
      return { ok: true, mensaje: 'ambos movimientos conciliados por su parte', aplicado };
    }
    case 'usd': {
      const tc = Number(payload.tipoCambio);
      const esperado = USD_MOVIMIENTO / USD_FACTURA;
      if (!tc || Math.abs(tc - esperado) > 0.0000001) {
        return { ok: false, mensaje: `TC = 789/45 con todos los decimales (${esperado})` };
      }
      return { ok: true, mensaje: 'conciliado; el centavo (789.01) va a gastos no deducibles' };
    }
    case 'traspaso': {
      const dest = String(payload.cuentaDestino || '');
      if (!dest.startsWith('899')) return { ok: false, mensaje: 'directo a otro banco duplica la poliza: usa la cuenta puente 899/104' };
      return { ok: true, mensaje: `puenteado por ${CUENTA_PUENTE}: queda en ceros el mismo dia` };
    }
    case 'rebote': {
      const ret = Number(payload.retiro);
      const dep = Number(payload.deposito);
      if (ret !== REBOTE || dep !== REBOTE) return { ok: false, mensaje: 'retiro 150 y devolucion 150' };
      if (String(payload.cuenta || '') !== CUENTA_PUENTE) return { ok: false, mensaje: 'puentea por 899-04' };
      return { ok: true, mensaje: 'rebote puenteado', duplicado: false };
    }
    case 'reembolso': {
      if (Math.abs(Number(payload.monto) - REEMBOLSO) > 0.015) return { ok: false, mensaje: 'las 2 facturas suman 2018.40' };
      if (!String(payload.cuenta || '').includes('reembolso')) return { ok: false, mensaje: 'usa la cuenta de reembolso del socio' };
      return { ok: true, mensaje: 'gasto contra deudor + retiro puenteado + deposito en ceros' };
    }
    case 'auto': {
      return { ok: true, mensaje: '10 automaticos, 2 a pendientes', conciliados: 10, pendientes: 2 };
    }
    default:
      return { ok: false, mensaje: `caso desconocido: ${id}` };
  }
}

export interface DatosCierre {
  fechaPoliza: string;
  fechaMovimiento: string;
  contrapartida: string;
  cuentaBanco: string;
}

export function validarCierre(d: DatosCierre): string[] {
  const errores: string[] = [];
  if (d.fechaPoliza !== d.fechaMovimiento) {
    errores.push('fecha de la poliza = fecha del movimiento bancario');
  }
  if (d.contrapartida === d.cuentaBanco) {
    errores.push('la contrapartida no puede ser la misma cuenta del banco (descuadra)');
  }
  return errores;
}
