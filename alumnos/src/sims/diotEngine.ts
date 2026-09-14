// TASK-D1 — Motor puro de DIOTSim (el componente React lo consume).
// Fuente: contex_Font/diot.html (scenario engine + validaciones + scoring)
// + goldens del video. Determinista por semilla. Cero LLM.
// Anti-desvio: sin SpreadsheetWidget/DualViewLayout, sin CDNs, sin numeros
// inventados (los goldens del tutorial salen del video).

export const TIPOS_OP: Record<number, string> = {
  1: 'Bienes',
  2: 'Servicios',
  3: 'Arrendamiento',
  4: 'Fideicomisos',
  5: 'Extranjeros',
};

export const TASAS_IVA: Record<string, number> = { '16': 0.16, '8': 0.08, '0': 0, exento: 0 };

export type TasaIVA = keyof typeof TASAS_IVA;
export type ModoDIOT = 'tutorial' | 'practica' | 'examen';

export interface OperacionDIOT {
  id: number;
  rfc: string;
  nombre: string;
  pais: string;
  nacionalidad: 'Nacional' | 'Extranjero';
  tipoContraparte: 'PF' | 'PM';
  tipo: number;
  tasa: TasaIVA;
  monto: number;
  iva: number;
  origen: 'Factura' | 'Nota de crédito' | 'Póliza';
  folio: string;
  fecha: string; // fecha de PAGO (no de factura): DD/01/2026
}

export interface ErrorInyectado {
  operacionId: number;
  campo: 'rfc' | 'monto' | 'iva' | 'tipo' | 'tasa' | 'nacionalidad';
  error: string;
  pista: string;
  valorIncorrecto: unknown;
  valorCorrecto: unknown;
}

export interface EscenarioDIOT {
  periodo: string;
  ejercicio: number;
  operaciones: OperacionDIOT[];
  errores: ErrorInyectado[];
}

// Folio del acuse al presentar con exito (golden del video).
export const ACUSE_FOLIO = 'ACU-2026-0117';

// ---- PRNG determinista (mulberry32) ----
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EMPRESAS: Array<{ nombre: string; pais: string; nacionalidad: 'Nacional' | 'Extranjero'; tipoContraparte: 'PF' | 'PM' }> = [
  { nombre: 'DISTRIBUIDORA DE ALIMENTOS DEL NORTE SA DE CV', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'SERVICIOS LEGALES Y FISCALES INTEGRADOS SC', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PF' },
  { nombre: 'TECNOLOGIA Y SISTEMAS AVANZADOS SA DE CV', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'CONSTRUCCIONES Y DESARROLLOS URBANOS SA', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'TRANSPORTES Y LOGISTICA DEL PACIFICO SA DE CV', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'PRODUCTOS QUIMICOS INDUSTRIALES SA', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'MATERIALES ELECTRICOS Y COMPONENTES SA DE CV', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'GLOBAL TECH SOLUTIONS INC', pais: 'US', nacionalidad: 'Extranjero', tipoContraparte: 'PM' },
  { nombre: 'EUROPEAN INDUSTRIAL SUPPLIES GMBH', pais: 'DE', nacionalidad: 'Extranjero', tipoContraparte: 'PM' },
  { nombre: 'CONSULTORIA EMPRESARIAL MODERNA SC', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PF' },
];

const RFC_VALIDO = /^[A-Z]{3}[0-9]{6}[A-Z0-9]{3}$/;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function calcularIVA(monto: number, tasa: TasaIVA): number {
  return Math.round(Math.abs(monto) * TASAS_IVA[tasa] * 100) / 100;
}

function rfcValido(rng: () => number): string {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const pick = (s: string) => s[Math.floor(rng() * s.length)];
  return (
    pick(L) + pick(L) + pick(L) +
    pad2(90 + Math.floor(rng() * 10)) + pad2(1 + Math.floor(rng() * 12)) + pad2(1 + Math.floor(rng() * 28)) +
    pick(A) + pick(A) + pick(A)
  );
}

const RFC_MALOS: Record<string, string> = {
  corto: 'CORP850622AB',
  formato: '1234567890123',
  fecha: 'CORP132599AB3',
  homoclave: 'CORP850622000',
};

// ---- Escenario tutorial fijo (goldens del video) ----
// Base 892130.50 e IVA 142740.88 => tasa efectiva exactamente 16%:
// las 8 operaciones del tutorial van todas a tasa 16 (variedad en
// tipos 1-5 y origenes Factura/NC/Poliza).
const TUTORIAL_DATOS: Array<[number, TasaIVA, number, OperacionDIOT['origen'], number, number]> = [
  // [monto, tasa, tipo, origen, empresaIdx, dia]
  [150000, '16', 1, 'Factura', 0, 5],
  [200000, '16', 2, 'Factura', 1, 8],
  [125000.5, '16', 1, 'Factura', 2, 12],
  [98000, '16', 3, 'Factura', 3, 15],
  [175000, '16', 2, 'Nota de crédito', 4, 18],
  [60000, '16', 4, 'Factura', 5, 21],
  [24130, '16', 5, 'Factura', 7, 24],
  [60000, '16', 1, 'Póliza', 6, 27],
];

export const ESCENARIO_TUTORIAL: EscenarioDIOT = {
  periodo: 'Enero 2026',
  ejercicio: 2026,
  operaciones: TUTORIAL_DATOS.map(([monto, tasa, tipo, origen, empIdx, dia], i) => {
    const emp = EMPRESAS[empIdx];
    const pref = origen === 'Factura' ? 'A' : origen === 'Nota de crédito' ? 'NC' : 'POL';
    return {
      id: i + 1,
      rfc: ['COR850622AB3', 'SLE900115CD4', 'TSA880230EF5', 'CDU750410GH6', 'TLP920618IJ7', 'PQI810922KL8', 'GTS950301MN9', 'MEC870714OP1'][i],
      nombre: emp.nombre,
      pais: emp.pais,
      nacionalidad: emp.nacionalidad,
      tipoContraparte: emp.tipoContraparte,
      tipo,
      tasa,
      monto,
      iva: calcularIVA(monto, tasa),
      origen,
      folio: `${pref}-${1000 + i * 137}`,
      fecha: `${pad2(dia)}/01/2026`,
    };
  }),
  errores: [],
};

// ---- Generador con semilla (practica 8+2, examen 12+4) ----

const CAMPOS_ERROR = ['rfc', 'monto', 'iva', 'tipo', 'tasa', 'nacionalidad'] as const;

export function generarEscenario(modo: ModoDIOT, seed: number): EscenarioDIOT {
  if (modo === 'tutorial') return structuredClone(ESCENARIO_TUTORIAL);
  const rng = makeRng(seed);
  const nOps = modo === 'examen' ? 12 : 8;
  const nErrores = modo === 'examen' ? 4 : 2;
  const tipos = [1, 2, 3, 4, 5];
  const tasas = Object.keys(TASAS_IVA) as TasaIVA[];
  const origenes: Array<OperacionDIOT['origen']> = ['Factura', 'Nota de crédito', 'Póliza'];

  const operaciones: OperacionDIOT[] = [];
  for (let i = 0; i < nOps; i++) {
    const tipo = tipos[Math.floor(rng() * tipos.length)];
    const tasa = tasas[Math.floor(rng() * tasas.length)];
    const origen = origenes[Math.floor(rng() * origenes.length)];
    const pool = tipo === 5 ? EMPRESAS.filter((e) => e.nacionalidad === 'Extranjero') : EMPRESAS.filter((e) => e.nacionalidad === 'Nacional');
    const emp = pool[Math.floor(rng() * pool.length)];
    const monto = 5000 + Math.floor(rng() * 295001);
    const pref = origen === 'Factura' ? 'A' : origen === 'Nota de crédito' ? 'NC' : 'POL';
    operaciones.push({
      id: i + 1,
      rfc: rfcValido(rng),
      nombre: emp.nombre,
      pais: emp.pais,
      nacionalidad: emp.nacionalidad,
      tipoContraparte: emp.tipoContraparte,
      tipo,
      tasa,
      monto,
      iva: calcularIVA(monto, tasa),
      origen,
      folio: `${pref}-${1000 + Math.floor(rng() * 9000)}`,
      fecha: `${pad2(1 + Math.floor(rng() * 28))}/01/2026`,
    });
  }

  const errores: ErrorInyectado[] = [];
  const usados = new Set<number>();
  for (let i = 0; i < nErrores; i++) {
    let idx = Math.floor(rng() * operaciones.length);
    while (usados.has(idx)) idx = Math.floor(rng() * operaciones.length);
    usados.add(idx);
    const op = operaciones[idx];
    const campo = CAMPOS_ERROR[Math.floor(rng() * CAMPOS_ERROR.length)];
    errores.push(injectarError(op, campo, rng));
  }

  return { periodo: 'Enero 2026', ejercicio: 2026, operaciones, errores };
}

function injectarError(op: OperacionDIOT, campo: (typeof CAMPOS_ERROR)[number], rng: () => number): ErrorInyectado {
  switch (campo) {
    case 'rfc': {
      const subtipos = Object.keys(RFC_MALOS);
      const mal = RFC_MALOS[subtipos[Math.floor(rng() * subtipos.length)]];
      const err: ErrorInyectado = {
        operacionId: op.id, campo,
        error: 'RFC inválido',
        pista: `El RFC "${mal}" no tiene formato correcto: 3 letras + 6 de fecha + 3 homoclave (13 caracteres).`,
        valorIncorrecto: mal, valorCorrecto: op.rfc,
      };
      op.rfc = mal;
      return err;
    }
    case 'monto': {
      const err: ErrorInyectado = {
        operacionId: op.id, campo,
        error: 'Monto negativo',
        pista: `El monto aparece negativo. En DIOT todos los montos van positivos.`,
        valorIncorrecto: op.monto * -1, valorCorrecto: op.monto,
      };
      op.monto = op.monto * -1;
      return err;
    }
    case 'iva': {
      const err: ErrorInyectado = {
        operacionId: op.id, campo,
        error: 'IVA incorrecto',
        pista: `El IVA no coincide con tasa ${op.tasa}%: deberia ser $${calcularIVA(op.monto, op.tasa)}.`,
        valorIncorrecto: op.iva * 2, valorCorrecto: op.iva,
      };
      op.iva = op.iva * 2;
      return err;
    }
    case 'tipo': {
      const mal = (op.tipo % 5) + 1;
      const err: ErrorInyectado = {
        operacionId: op.id, campo,
        error: 'Tipo de operación incorrecto',
        pista: `Esta operacion es "${TIPOS_OP[op.tipo]}" pero esta marcada como "${TIPOS_OP[mal]}".`,
        valorIncorrecto: mal, valorCorrecto: op.tipo,
      };
      op.tipo = mal;
      return err;
    }
    case 'tasa': {
      const mal: TasaIVA = op.tasa === '16' ? '0' : '16';
      const err: ErrorInyectado = {
        operacionId: op.id, campo,
        error: 'Tasa de IVA incorrecta',
        pista: `La tasa ${mal}% no corresponde: deberia ser ${op.tasa}%.`,
        valorIncorrecto: mal, valorCorrecto: op.tasa,
      };
      op.tasa = mal;
      op.iva = calcularIVA(op.monto, mal);
      return err;
    }
    case 'nacionalidad': {
      const mal = op.nacionalidad === 'Nacional' ? 'Extranjero' : 'Nacional';
      const err: ErrorInyectado = {
        operacionId: op.id, campo,
        error: 'Nacionalidad incorrecta',
        pista: `Este proveedor es ${op.nacionalidad} pero aparece como ${mal}.`,
        valorIncorrecto: mal, valorCorrecto: op.nacionalidad,
      };
      op.nacionalidad = mal as OperacionDIOT['nacionalidad'];
      return err;
    }
  }
}

// ---- Validacion (reglas SAT del video) ----
export function validarOperacion(op: OperacionDIOT): string[] {
  const errores: string[] = [];
  if (!RFC_VALIDO.test(op.rfc)) errores.push(`RFC "${op.rfc}" invalido: 13 caracteres (3 letras + 6 fecha + 3 homoclave)`);
  if (!(op.monto > 0)) errores.push('Monto debe ser positivo en DIOT');
  const ivaEsperado = calcularIVA(op.monto, op.tasa);
  if (Math.abs(op.iva - ivaEsperado) > 0.015) errores.push(`IVA $${op.iva} no coincide con tasa ${op.tasa}% (esperado $${ivaEsperado})`);
  return errores;
}

// ---- TXT oficial (23 cols pre-2025 / 54 cols 2025+, pipe-separated) ----
export function construirTXT(ops: OperacionDIOT[], ejercicio: number): string {
  const nCols = ejercicio < 2025 ? 23 : 54;
  return ops
    .map((op) => {
      const base = [
        op.rfc,
        op.nombre,
        op.pais,
        op.nacionalidad,
        op.tipoContraparte,
        String(op.tipo),
        TIPOS_OP[op.tipo],
        op.tasa,
        op.monto.toFixed(2),
        op.iva.toFixed(2),
        op.origen,
        op.folio,
        op.fecha,
      ];
      while (base.length < nCols) base.push('');
      return base.slice(0, nCols).join('|');
    })
    .join('\n');
}

// ---- Presentar: Normal vs Complementaria (CASO nov-2025) ----
export function resolverTipoDeclaracion(tieneNormalEnSAT: boolean): 'Normal' | 'Complementaria' {
  return tieneNormalEnSAT ? 'Complementaria' : 'Normal';
}

export function puedePresentar(encontrados: number, totales: number): { ok: boolean; faltantes: number } {
  return { ok: encontrados >= totales, faltantes: Math.max(0, totales - encontrados) };
}

// ---- Scoring (del html: practica 100+bono-pistas / examen precision+bono) ----
export function calificarPractica(segundos: number, pistas: number): number {
  const bono = segundos < 120 ? 20 : segundos < 180 ? 10 : 0;
  return Math.max(0, 100 + bono - pistas * 5);
}

export function calificarExamen(encontrados: number, totales: number, segundosRestantes: number): number {
  if (totales <= 0) return 0;
  const precision = Math.round((encontrados / totales) * 100);
  const bono = segundosRestantes > 120 ? 15 : segundosRestantes > 60 ? 10 : 0;
  return Math.min(100, precision + bono);
}
