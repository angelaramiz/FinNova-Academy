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
  if (!b.nombre.trim()) errores.push('nombre del banco requerido 📚 Cada cuenta bancaria se da de alta por separado: concilias banco por banco, nunca todo revuelto.');
  if (!b.cuenta.trim()) errores.push('cuenta contable requerida (ej. 102-01-001) 📚 La cuenta del Anexo 24 es el puente entre el banco y tu contabilidad: sin ella no hay póliza que registrar.');
  if (!(b.saldoInicial >= 0)) errores.push('saldo inicial debe ser numero >= 0 📚 El saldo inicial es el punto de partida del periodo: si arranca mal, todo el conciliado hereda el error.');
  if (b.clabe && ![10, 16, 18].includes(b.clabe.length)) {
    errores.push('CLABE debe ser de 10, 16 o 18 digitos (o vacia) 📚 La CLABE identifica la cuenta para transferencias: un dígito mal capturado manda el traspaso a otro lado.');
  }
  if (b.moneda !== 'MN' && b.moneda !== 'USD') errores.push('moneda MN o USD (no editable tras conciliar) 📚 La moneda se fija al alta porque cambia la valuación: en USD el tipo de cambio mueve el saldo en cada cierre.');
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
    return [`carátula no cuadra: inicial + depositos - retiros = ${esperado}, final ${c.final} 📚 La carátula prueba que el Excel es copia fiel del PDF: debe dar al centavo o la carga nació corrupta.`];
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
    errores.push('fecha de la poliza = fecha del movimiento bancario 📚 La póliza se registra el día que el banco movió el dinero: fecharla otro día descuadra el periodo y arrastra el DIOT.');
  }
  if (d.contrapartida === d.cuentaBanco) {
    errores.push('la contrapartida no puede ser la misma cuenta del banco (descuadra) 📚 Cargar y abonar la misma cuenta se cancela a cero y esconde el movimiento: la contrapartida explica de dónde vino o a dónde fue el dinero.');
  }
  return errores;
}

// ---- P3: Modo Caso Real — datos sucios como en la vida real ----
// Escenario FIJO y determinista (no es de los 8 casos del webinar: va aparte
// para no romper su canon). 4 filas sucias + 2 limpias. Eliminar partidas
// siempre es error grave. Cero LLM.
export type AccionFila = 'corregir' | 'transito' | 'eliminar';

export interface FilaSucia {
  id: string;
  descripcion: string;
  monto: number;
  rfc: string;
  uuid: string | null;
  folioRef: string;
  limpia: boolean;
  // dato real contra el que se detecta la suciedad (no se muestra al alumno)
  datoReal: string;
  accionCorrecta: AccionFila;
  leccion: string;
}

export const CASO_REAL_FILAS: FilaSucia[] = [
  {
    id: 'r1', descripcion: 'PGO FOLIO 88211', monto: 1219.6, rfc: 'LNO080515TYU', uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    folioRef: '88211', limpia: false, datoReal: 'folio 8821 (la factura real termina en 8821, no 88211)', accionCorrecta: 'corregir',
    leccion: 'La descripción del banco trae un dígito de más: el folio real es 8821. 📚 El banco captura a mano y se equivoca: concilia contra la factura, no contra lo que dice el concepto.',
  },
  {
    id: 'r2', descripcion: 'PAGO PROVEEDOR TREX', monto: 4000, rfc: 'TREX990101AB1', uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    folioRef: '51010', limpia: false, datoReal: 'RFC TREX990101AB2 (el dígito verificador real es 2)', accionCorrecta: 'corregir',
    leccion: 'El RFC trae un dígito cambiado (AB1 vs AB2). 📚 Un RFC que no existe invalida la deducción: verifícalo contra la constancia del proveedor antes de conciliar.',
  },
  {
    id: 'r3', descripcion: 'FACEBOOK ADS', monto: 789.01, rfc: 'FBA150320XY9', uuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    folioRef: 'FB-45', limpia: false, datoReal: 'factura por 789.00 (un centavo de diferencia)', accionCorrecta: 'corregir',
    leccion: 'El banco trae 789.01 pero la factura es 789.00. 📚 El centavo va a cuenta de gastos (como en el caso USD del webinar): nunca descuadres la factura por redondeo del banco.',
  },
  {
    id: 'r4', descripcion: 'CHEQUE 4471 PROVEEDOR', monto: 12500, rfc: 'LNO080515TYU', uuid: null,
    folioRef: '4471', limpia: false, datoReal: 'cheque expedido no cobrado por el banco (partida en tránsito)', accionCorrecta: 'transito',
    leccion: 'r4: cheque expedido que el banco aún no cobra: márcalo en tránsito, NO lo elimines. 📚 Las partidas en tránsito explican la diferencia entre tu saldo y el del banco; eliminarlas es un error contable grave porque esconde dinero.',
  },
  {
    id: 'r5', descripcion: 'PAGO FOLIO 8821', monto: 1219.6, rfc: 'LNO080515TYU', uuid: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    folioRef: '8821', limpia: true, datoReal: 'fila limpia', accionCorrecta: 'corregir',
    leccion: 'r5 está limpia: folio, RFC, monto y UUID correctos. 📚 No toda fila necesita acción: marcar de más también es error, igual que en una auditoría real.',
  },
  {
    id: 'r6', descripcion: 'TRASPASO SANTANDER', monto: 20000, rfc: 'LNO080515TYU', uuid: 'e5f6a7b8-c9d0-1234-efab-345678901234',
    folioRef: 'TR-77', limpia: true, datoReal: 'fila limpia', accionCorrecta: 'corregir',
    leccion: 'r6 está limpia: traspaso documentado con folio interno. 📚 Los traspasos con su folio interno se concilian directo; solo van por puente 899 cuando cruzan bancos.',
  },
];

export interface ResultadoCasoReal {
  ok: boolean;
  score: number;
  detectados: number;
  total: number;
  falsosPositivos: number;
  detalle: string[];
}

export function resolverCasoReal(marcajes: { id: string; accion: AccionFila }[]): ResultadoCasoReal {
  const detalle: string[] = [];
  let detectados = 0;
  let falsosPositivos = 0;
  const total = CASO_REAL_FILAS.filter((f) => !f.limpia).length;
  for (const m of marcajes) {
    const fila = CASO_REAL_FILAS.find((f) => f.id === m.id);
    if (!fila) continue;
    if (m.accion === 'eliminar') {
      detalle.push(`❌ ${fila.id}: eliminar la partida es un error grave aunque esté sucia. 📚 Nada se elimina en conciliación: se corrige o se marca en tránsito; eliminar esconde dinero y en auditoría es hallazgo.`);
      continue;
    }
    if (fila.limpia) {
      falsosPositivos++;
      detalle.push(`⚠️ ${fila.id}: ${fila.leccion}`);
      continue;
    }
    if (m.accion === fila.accionCorrecta) {
      detectados++;
      detalle.push(`✅ ${fila.id}: ${fila.leccion}`);
    } else {
      detalle.push(`❌ ${fila.id}: esa acción no resuelve (dato real: ${fila.datoReal}). ${fila.leccion}`);
    }
  }
  const score = Math.max(0, Math.round((detectados / total) * 100) - falsosPositivos * 10);
  return { ok: detectados === total && falsosPositivos === 0, score, detectados, total, falsosPositivos, detalle };
}
