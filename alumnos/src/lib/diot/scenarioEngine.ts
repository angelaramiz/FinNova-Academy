// Motor de escenarios DIOT — lógica pura (sin UI), port del lab.
import { EMPRESAS, ERRORES_POR_FASE, NIVELES_OPS, TASAS_IVA } from './constants';
import type {
  DiotMode, ErrorInyectado, OperacionDIOT, OrigenOperacion,
  Rng, ScenarioDIOT, TasaIVA, TipoOperacion,
} from './types';

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALFANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function rand(min: number, max: number, rng: Rng): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function randItem<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}
function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function generarRFCValido(rng: Rng = Math.random): string {
  let rfc = '';
  for (let i = 0; i < 3; i++) rfc += LETRAS[rand(0, 25, rng)];
  rfc += pad2(rand(90, 99, rng)) + pad2(rand(1, 12, rng)) + pad2(rand(1, 28, rng));
  for (let i = 0; i < 3; i++) rfc += ALFANUM[rand(0, 35, rng)];
  return rfc;
}

const RFC_INVALIDOS = {
  corto: 'CORP850622AB',
  formato: '1234567890123',
  fecha: 'CORP132599AB3',
  homoclave: 'CORP850622000',
} as const;

export function generarRFCInvalido(tipo: keyof typeof RFC_INVALIDOS): string {
  return RFC_INVALIDOS[tipo] ?? 'INVALIDO';
}

export function calcularIVA(monto: number, tasa: TasaIVA): number {
  return Math.round(monto * TASAS_IVA[tasa] * 100) / 100;
}

export function generarScenarioDIOT(fase: DiotMode, nivel = 1, rng: Rng = Math.random): ScenarioDIOT {
  const empresa = { ...EMPRESAS[rand(0, 13, rng)], rfc: generarRFCValido(rng) };
  const cantOps = NIVELES_OPS[Math.min(Math.max(nivel, 1), 3) - 1];
  const cantErrores = ERRORES_POR_FASE[fase] ?? 0;

  const operaciones: OperacionDIOT[] = [];
  const erroresInyectados: ErrorInyectado[] = [];
  const tiposOp: TipoOperacion[] = [1, 2, 3, 4, 5];
  const tasas: TasaIVA[] = ['16', '8', '0', 'exento'];
  const origenes: OrigenOperacion[] = ['Factura', 'Nota de crédito', 'Póliza'];

  for (let i = 0; i < cantOps; i++) {
    const tipo = randItem(tiposOp, rng);
    const tasa = randItem(tasas, rng);
    const origen = randItem(origenes, rng);
    const pool = tipo === 5
      ? EMPRESAS.filter((e) => e.nacionalidad === 'Extranjero')
      : EMPRESAS.filter((e) => e.nacionalidad === 'Nacional');
    const empresaOp = randItem(pool, rng);
    const monto = rand(5000, 300000, rng);
    operaciones.push({
      id: i + 1,
      rfc: generarRFCValido(rng),
      nombre: empresaOp.nombre,
      pais: empresaOp.pais,
      nacionalidad: empresaOp.nacionalidad,
      tipoContraparte: empresaOp.tipoContraparte,
      tipo, tasa, monto,
      iva: calcularIVA(monto, tasa),
      origen,
      folio: `${origen === 'Factura' ? 'A' : origen === 'Nota de crédito' ? 'NC' : 'POL'}-${rand(1000, 9999, rng)}`,
      fecha: `${pad2(rand(1, 28, rng))}/01/2026`,
    });
  }

  const tiposError = ['rfc', 'monto', 'iva', 'tipo', 'tasa', 'nacionalidad'] as const;
  const usados = new Set<number>();
  for (let i = 0; i < cantErrores; i++) {
    let opIndex = rand(0, operaciones.length - 1, rng);
    while (usados.has(opIndex)) opIndex = rand(0, operaciones.length - 1, rng);
    usados.add(opIndex);
    const op = operaciones[opIndex];
    const tipoError = randItem([...tiposError], rng);
    if (tipoError === 'rfc') {
      const subtipo = randItem(['corto', 'formato', 'fecha', 'homoclave'] as const, rng);
      const rfcMal = generarRFCInvalido(subtipo);
      erroresInyectados.push({ operacionId: op.id, campo: 'rfc', error: 'RFC inválido', pista: `El RFC "${rfcMal}" no tiene formato correcto (13: 3 letras + 6 fecha + 3 homoclave).`, valorIncorrecto: rfcMal, valorCorrecto: op.rfc });
      op.rfc = rfcMal;
    } else if (tipoError === 'monto') {
      erroresInyectados.push({ operacionId: op.id, campo: 'monto', error: 'Monto negativo', pista: `El monto $${op.monto} aparece negativo; en DIOT todo es positivo.`, valorIncorrecto: op.monto * -1, valorCorrecto: op.monto });
      op.monto = op.monto * -1;
    } else if (tipoError === 'iva') {
      erroresInyectados.push({ operacionId: op.id, campo: 'iva', error: 'IVA incorrecto', pista: `El IVA no coincide con tasa ${op.tasa}% (debería ser $${calcularIVA(Math.abs(op.monto), op.tasa)}).`, valorIncorrecto: op.iva * 2, valorCorrecto: op.iva });
      op.iva = op.iva * 2;
    } else if (tipoError === 'tipo') {
      const tipoMal = ((op.tipo % 5) + 1) as TipoOperacion;
      erroresInyectados.push({ operacionId: op.id, campo: 'tipo', error: 'Tipo incorrecto', pista: `Marcada como tipo ${tipoMal} pero es tipo ${op.tipo}.`, valorIncorrecto: tipoMal, valorCorrecto: op.tipo });
      op.tipo = tipoMal;
    } else if (tipoError === 'tasa') {
      const tasaMal: TasaIVA = op.tasa === '16' ? '0' : '16';
      erroresInyectados.push({ operacionId: op.id, campo: 'tasa', error: 'Tasa incorrecta', pista: `Tasa ${tasaMal}% no corresponde; debería ser ${op.tasa}%.`, valorIncorrecto: tasaMal, valorCorrecto: op.tasa });
      op.tasa = tasaMal;
      op.iva = calcularIVA(Math.abs(op.monto), tasaMal);
    } else {
      const nacMal = op.nacionalidad === 'Nacional' ? 'Extranjero' : 'Nacional';
      erroresInyectados.push({ operacionId: op.id, campo: 'nacionalidad', error: 'Nacionalidad incorrecta', pista: `Proveedor ${op.nacionalidad} marcado como ${nacMal}.`, valorIncorrecto: nacMal, valorCorrecto: op.nacionalidad });
      op.nacionalidad = nacMal as OperacionDIOT['nacionalidad'];
    }
  }

  return { empresa, operaciones, erroresInyectados, cantErrores };
}
