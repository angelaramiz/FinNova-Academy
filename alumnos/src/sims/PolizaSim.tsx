// PolizaSim — 5º submódulo Contalink: captura de pólizas como la pantalla
// real (PÓLIZA DE LA FACTURA PROVISIÓN/EGRESOS): editor multilínea
// CUENTA/DEBE/HABER, Eliminar por línea, Agregar asiento, totales que
// bloquean Guardar si descuadran, Notas con UUID, Guardar/Cancelar,
// Descargar XML/PDF. El motor vive en backend (polizaEngine); el Sim valida
// en local (catálogo DOF completo) y persiste vía /api/sim/polizas.
// Goldens: MARCELO F 70900/7090/63810, PPD 1000/160/1160, ventas, capital.
// Diseño ContaLink claro (clk-*). Cero LLM.
import { useEffect, useMemo, useState } from 'react';
import { agrupadorDe, agrupadorDeCuentaInterna, etiquetaAgrupador, buscarCuentasFront } from './catalogoAgrupador';
import { reportarSim } from './reportarSim';
import { apiFetch } from '../lib/api';
import TourSim from './TourSim';
import { TOURS } from './toursContalink';

type Fase = 'documento' | 'conciliacion' | 'poliza' | 'detective' | 'balanza';
const FASES: { id: Fase; titulo: string; detalle: string }[] = [
  { id: 'documento', titulo: '1. Documento', detalle: 'CFDI fuente: UUID, montos, PUE/PPD' },
  { id: 'conciliacion', titulo: '2. Conciliación', detalle: 'Cotejo contra estado de cuenta' },
  { id: 'poliza', titulo: '3. Póliza', detalle: 'Captura multilínea DEBE/HABER' },
  { id: 'detective', titulo: '🕵️ Detective', detalle: 'Solo si descuadra: investiga en 4 pasos' },
  { id: 'balanza', titulo: '4. Balanza', detalle: 'Guarda y acumula por agrupador' },
];

// ─── R-kinder: regla del cero + protocolo detective (guion del educador) ──
const REGLA_CERO = 'Cada cuenta tiene su casa: 1/5/6/7 viven en el DEBE, 2/3/4 viven en el HABER. Si todos están en su casa, la suma final da 0.';
const REGLA_ORO = 'Sin papel no hay póliza, sin pago no toco el banco, y el columpio siempre queda parejo.';
const PREGUNTAS_DETECTIVE: { titulo: string; frase: string; destino: Fase }[] = [
  { titulo: '¿El CFDI cuadra solo?', frase: '¿El papel cuadra solito antes de culpar a la alcancía? Subtotal + IVA debe dar el total.', destino: 'documento' },
  { titulo: '¿PUE o PPD / banco bien?', frase: '¿Ya salió el dinero o solo me prometieron pagar? PPD sin banco es provisión.', destino: 'conciliacion' },
  { titulo: '¿601.45 vs 601.46 vs 601.83?', frase: '¿Esta renta es de Don Físico (PF→601.45), de Empresa Moral (PM→601.46) o de papelito sin sello (601.83)?', destino: 'poliza' },
  { titulo: '¿Olvidaste la retención o el IVA?', frase: '¿Le quitaste su mordida al SAT antes de pagar? Arrendamiento PF retiene 10% ISR.', destino: 'poliza' },
];

interface CfdiForm {
  rfc: string; emisor: string; fecha: string; uuid: string; metodo: 'PUE' | 'PPD';
  producto: string; moneda: string; subtotal: string; iva16: string; isrRet: string; total: string;
}

interface EdoForm { fecha: string; concepto: string; totalPagado: string; banco: string; }

interface Linea { id: number; cuenta: string; debe: string; haber: string; agrupador?: string }

const CASOS: Record<string, { nombre: string; cfdi: CfdiForm; edo: EdoForm }> = {
  marcelo: {
    nombre: 'MARCELO F · Arrendamiento PUE (ASIENTO 1)',
    cfdi: { rfc: 'FOFM8406126X3', emisor: 'MARCELO F', fecha: '02-01-2025', uuid: '1317D7E0-38AC-489F-9082-E75019D8975E', metodo: 'PUE', producto: 'Arrendamiento de residencias DEL 15 de enero al 14 de febrero del 2025', moneda: 'MXN', subtotal: '70900', iva16: '0', isrRet: '7090', total: '63810' },
    edo: { fecha: '02-01-2025', concepto: 'Arrendamiento de residencias', totalPagado: '63810', banco: 'RITO FINANCIERA' },
  },
  ppd: {
    nombre: 'Proveedor PPD · Provisión 1000/160/1160',
    cfdi: { rfc: 'PROV920101ABC', emisor: 'PROVEEDOR PPD', fecha: '05-01-2025', uuid: 'A1B2C3D4-E5F6-4A7B-8C9D-E0F1A2B3C4D5', metodo: 'PPD', producto: 'Arrendamiento de bodega enero 2025', moneda: 'MXN', subtotal: '1000', iva16: '160', isrRet: '0', total: '1160' },
    edo: { fecha: '', concepto: '', totalPagado: '', banco: '' },
  },
  ventas: {
    nombre: 'Ventas enero · 26680/23000/3680',
    cfdi: { rfc: 'TLC750101ABC', emisor: 'EMPRESA (propia)', fecha: '10-01-2025', uuid: 'C3D4E5F6-A7B8-4C9D-0E1F-A2B3C4D5E6F7', metodo: 'PUE', producto: 'Ventas y/o servicios gravados a la tasa general', moneda: 'MXN', subtotal: '23000', iva16: '3680', isrRet: '0', total: '26680' },
    edo: { fecha: '10-01-2025', concepto: 'Cobro ventas enero', totalPagado: '26680', banco: 'RITO FINANCIERA' },
  },
  capital: {
    nombre: 'Aportación · 50000/50000',
    cfdi: { rfc: 'SOC800101AAA', emisor: 'SOCIO APORTANTE', fecha: '15-01-2025', uuid: 'B2C3D4E5-F6A7-4B8C-9D0E-F1A2B3C4D5E6', metodo: 'PUE', producto: 'Aportación de capital fijo', moneda: 'MXN', subtotal: '50000', iva16: '0', isrRet: '0', total: '50000' },
    edo: { fecha: '15-01-2025', concepto: 'Aportación de capital', totalPagado: '50000', banco: 'RITO FINANCIERA' },
  },
};

const VACIO_CFDI: CfdiForm = { rfc: '', emisor: '', fecha: '', uuid: '', metodo: 'PUE', producto: '', moneda: 'MXN', subtotal: '', iva16: '', isrRet: '', total: '' };
const VACIO_EDO: EdoForm = { fecha: '', concepto: '', totalPagado: '', banco: '' };

// ─── Semillas de la base (21 filas CFDI↔banco) ──────────────────────
// GET /api/sim/polizas/casos trae el catálogo; si falla, CASOS local.
// El UUID es el id: nunca se repite (usadas en localStorage).
interface CasoApi {
  id: string; nombre: string;
  cfdi: { rfc: string; emisor: string; fecha: string; uuid: string; metodo: 'PUE' | 'PPD'; producto: string; moneda: string; subtotal: number; iva16: number; isrRet: number; total: number };
  edo: { fecha: string; concepto: string; totalPagado: number; banco: string } | null;
}
interface CasoOp { nombre: string; cfdi: CfdiForm; edo: EdoForm }
function casoApiAOp(r: CasoApi): CasoOp {
  return {
    nombre: r.nombre,
    cfdi: { rfc: r.cfdi.rfc, emisor: r.cfdi.emisor, fecha: r.cfdi.fecha, uuid: r.cfdi.uuid, metodo: r.cfdi.metodo, producto: r.cfdi.producto, moneda: r.cfdi.moneda || 'MXN', subtotal: String(r.cfdi.subtotal), iva16: String(r.cfdi.iva16), isrRet: String(r.cfdi.isrRet), total: String(r.cfdi.total) },
    edo: r.edo ? { fecha: r.edo.fecha, concepto: r.edo.concepto, totalPagado: String(r.edo.totalPagado), banco: r.edo.banco } : { ...VACIO_EDO },
  };
}
function leerUsadas(): string[] {
  try { const u = JSON.parse(localStorage.getItem('poliza_semillas_usadas') || '[]'); return Array.isArray(u) ? u : []; }
  catch { return []; }
}

// ─── Glosario kinder (lo pidió el tester-estudiante) ───────────────
const GLOSARIO: [string, string][] = [
  ['CFDI', 'La factura electrónica: el papel que dice qué se compró (ej. la renta de MARCELO).'],
  ['PUE', 'Pago en una sola exhibición: el dinero ya salió, va a EGRESOS.'],
  ['PPD', 'Pago diferido: es promesa (apartar el juguete), va a PROVISIÓN sin tocar el banco.'],
  ['DEBE', 'Columna izquierda del columpio: ahí viven gastos, activo y lo que entra.'],
  ['HABER', 'Columna derecha: ahí viven deudas, capital, ingresos y tu pago que sale del banco.'],
  ['ISR', 'Pedacito que no es tuyo: se aparta para el gobierno (ej. 10% de la renta a persona física).'],
  ['Folio', 'El ticket que te dan al guardar: con él encuentras tu póliza en la Balanza.'],
  ['Semilla', 'Una factura distinta para practicar: cada una trae su UUID para no repetir.'],
];

// Pista del piloto según la fase (modo "yo lo intento").
const PISTA_PILOTO: Record<string, string> = {
  documento: 'Toca mi botón y genero las líneas por ti. O presiona "Generar líneas con el motor" tú mismo.',
  conciliacion: 'Revisa el veredicto: verde ✅ u azul (PPD) y puedes seguir; rojo 🛑 y no toques el banco.',
  poliza: 'Si el columpio está parejo, presiona Guardar (o mi botón y guardo por ti).',
  detective: 'Responde las 4 preguntas en orden; cada una te lleva donde se revisa.',
  balanza: 'Ya terminamos: tu folio vive aquí. Pide otra factura para practicar.',
};

function num(s: string): number {
  const n = Number(String(s).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}
function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Naturaleza por estructura del Anexo 24: 1/5/6/7 deudoras, 2/3/4 acreedoras. */
function naturalezaDe(agrupador: string): 'D' | 'H' {
  return '234'.includes(agrupador.charAt(0)) ? 'H' : 'D';
}

let seqId = 1;

export default function PolizaSim() {
  const [fase, setFase] = useState<Fase>('documento');
  const [casoId, setCasoId] = useState('marcelo');
  const [cfdi, setCfdi] = useState<CfdiForm>(CASOS.marcelo.cfdi);
  const [edo, setEdo] = useState<EdoForm>(CASOS.marcelo.edo);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [notas, setNotas] = useState(`${CASOS.marcelo.cfdi.uuid}, ${CASOS.marcelo.cfdi.producto}.`);
  const [mensajes, setMensajes] = useState<string[]>([]);
  const [folio, setFolio] = useState<string | null>(null);
  const [guardadas, setGuardadas] = useState<{ agrupador: string; debe: number; haber: number }[]>([]);
  const [openLinea, setOpenLinea] = useState<number | null>(null);
  const [declara60183, setDeclara60183] = useState(false);
  const [pilotoModo, setPilotoModo] = useState<'nadie' | 'auto' | 'yo'>('nadie');
  const [casosOp, setCasosOp] = useState<Record<string, CasoOp> | null>(null);
  const [usadas, setUsadas] = useState<string[]>(leerUsadas);
  const [pilotoBusy, setPilotoBusy] = useState(false);
  const mapa = casosOp ?? CASOS;

  // Catálogo de la base al montar; fallback silencioso a CASOS local.
  useEffect(() => {
    let vivo = true;
    apiFetch<CasoApi[]>('/api/sim/polizas/casos')
      .then((rows) => {
        if (!vivo || !Array.isArray(rows) || rows.length === 0) return;
        const m: Record<string, CasoOp> = {};
        for (const r of rows) { if (r && r.id) m[r.id] = casoApiAOp(r); }
        if (Object.keys(m).length > 0) setCasosOp(m);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  function marcarUsada(id: string) {
    setUsadas((prev) => {
      if (prev.includes(id)) return prev;
      const u = [...prev, id];
      try { localStorage.setItem('poliza_semillas_usadas', JSON.stringify(u)); } catch {}
      return u;
    });
  }

  async function otraSemilla() {
    const excl = [...usadas, cfdi.uuid].filter(Boolean).join(',');
    try {
      const r = await apiFetch<CasoApi>(`/api/sim/polizas/semilla?exclude=${encodeURIComponent(excl)}`);
      const m = { ...mapa, [r.id]: casoApiAOp(r) };
      setCasosOp(m);
      cargarCaso(r.id, m);
      marcarUsada(r.id);
      setMensajes([`🎲 Semilla nueva: ${r.nombre}. UUID sin repetir.`]);
    } catch {
      setMensajes(['🎲 Ya operaste los 21 casos. Repasa con el selector o limpia tus usadas para empezar de cero.']);
    }
  }

  // Piloto que SÍ actúa: ejecuta el siguiente paso según la fase.
  // Con estado Trabajando: el primer clic siempre reacciona (hallazgo tester).
  async function accionPiloto() {
    if (pilotoBusy) return;
    setPilotoBusy(true);
    try {
      if (fase === 'documento') { await generarDesdeMotor(); return; }
      if (fase === 'poliza' && cuadra) { await guardar(); return; }
      if (fase === 'detective') { setFase('balanza'); return; }
      if (fase === 'conciliacion') { setFase('poliza'); return; }
      setMensajes((m) => [...m, '🐖 Aquí te toca a ti: presiona "yo lo intento" y sigue la pista.']);
    } finally {
      setPilotoBusy(false);
    }
  }

  function cargarCaso(id: string, m?: Record<string, CasoOp>) {
    const c = (m ?? casosOp ?? CASOS)[id];
    if (!c) return;
    setCasoId(id);
    setCfdi({ ...c.cfdi });
    setEdo({ ...c.edo });
    setLineas([]);
    setNotas(`${c.cfdi.uuid}, ${c.cfdi.producto}.`);
    setMensajes([]);
    setFolio(null);
  }

  const pagoConfirmado = useMemo(() => {
    const t = num(edo.totalPagado);
    const c = num(cfdi.total);
    if (!edo.fecha || !Number.isFinite(t) || !Number.isFinite(c)) return false;
    return Math.abs(t - c) <= 0.01;
  }, [edo, cfdi.total]);

  function resolverLinea(l: Linea): string | null {
    if (!l.cuenta.trim()) return 'Vacía: escribe el nombre ("bancos", "renta") o el código (601.45). Usa el buscador de la línea.';
    const interna = agrupadorDeCuentaInterna(l.cuenta.trim());
    if (interna) return null;
    if (agrupadorDe(l.cuenta.trim())) return null;
    return `La cuenta ${l.cuenta.trim()} no existe en el Anexo 24: sin código agrupador no va a la balanza electrónica.`;
  }

  function etiquetaLinea(l: Linea): { texto: string; naturaleza: 'D' | 'H' | null; colision: string | null } {
    // El agrupador calculado por el motor manda; la equivalencia interna
    // (601-83→601.45) solo aplica cuando el alumno escribe a mano.
    if (l.agrupador) {
      const e = agrupadorDe(l.agrupador);
      const codigo = l.agrupador;
      const nombre = e?.nombre ?? l.agrupador;
      const naturaleza: 'D' | 'H' = '234'.includes(codigo.charAt(0)) ? 'H' : 'D';
      const colision = codigo === '601.83'
        ? '⚠ 601.83 = gasto NO deducible. Si buscas renta deducible es 601-83 → 601.45.'
        : null;
      return { texto: `${codigo} · ${nombre}`, naturaleza, colision };
    }
    const interna = agrupadorDeCuentaInterna(l.cuenta.trim());
    const directa = !interna ? agrupadorDe(l.cuenta.trim()) : null;
    const codigo = interna ? interna.codigo : directa ? directa.codigo : null;
    const nombre = interna ? interna.nombre : directa ? directa.nombre : null;
    if (!codigo) return { texto: '—', naturaleza: null, colision: null };
    const naturaleza: 'D' | 'H' = '234'.includes(codigo.charAt(0)) ? 'H' : 'D';
    const colision = codigo === '601.83'
      ? '⚠ 601.83 = gasto NO deducible. Si buscas renta deducible es 601-83 → 601.45.'
      : null;
    return { texto: `${codigo} · ${nombre}`, naturaleza, colision };
  }

  const totales = useMemo(() => {
    const d = lineas.reduce((s, l) => s + (num(l.debe) || 0), 0);
    const h = lineas.reduce((s, l) => s + (num(l.haber) || 0), 0);
    return { debe: d, haber: h, dif: Math.abs(d - h) };
  }, [lineas]);

  const erroresLinea = useMemo(() => {
    const errs: string[] = [];
    lineas.forEach((l, i) => {
      const e = resolverLinea(l);
      if (e) errs.push(`Línea ${i + 1}: ${e}`);
      const d = num(l.debe);
      const h = num(l.haber);
      if (l.cuenta.trim() && (Number.isNaN(d) || Number.isNaN(h))) errs.push(`Línea ${i + 1}: montos inválidos.`);
      else if (l.cuenta.trim() && d > 0 && h > 0) errs.push(`Línea ${i + 1}: no puede llevar DEBE y HABER a la vez.`);
      else if (l.cuenta.trim() && d === 0 && h === 0) errs.push(`Línea ${i + 1}: sin monto.`);
    });
    return errs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineas]);

  const cuadra = lineas.length > 0 && erroresLinea.length === 0 && totales.dif <= 0.01;

  async function generarDesdeMotor() {
    setMensajes([]);
    const body = {
      cfdi: {
        rfc: cfdi.rfc, emisor: cfdi.emisor, fecha: cfdi.fecha, uuid: cfdi.uuid, metodo: cfdi.metodo,
        producto: cfdi.producto, moneda: cfdi.moneda || 'MXN',
        subtotal: num(cfdi.subtotal) || 0, iva16: num(cfdi.iva16) || 0, iva8: 0,
        ivaRet: 0, isrRet: num(cfdi.isrRet) || 0, total: num(cfdi.total) || 0,
      },
      edoCta: edo.fecha ? [{ fecha: edo.fecha, concepto: edo.concepto, totalPagado: num(edo.totalPagado) || 0, banco: edo.banco }] : [],
    };
    try {
      const r = await apiFetch<{ poliza: { lineas: { cuentaInterna: string; agrupador: string; descripcion: string; debe: number; haber: number }[] } | null; errores: { mensaje: string; porQue: string }[] }>('/api/sim/polizas/generar', { method: 'POST', body: JSON.stringify(body) });
      if (r.poliza) {
        setLineas(r.poliza.lineas.map(l => ({ id: seqId++, cuenta: l.cuentaInterna, agrupador: l.agrupador, debe: l.debe ? String(l.debe) : '', haber: l.haber ? String(l.haber) : '' })));
        setMensajes([`✅ Motor: póliza generada (${r.poliza.lineas.length} líneas). Revísala antes de guardar.`]);
        setFase('poliza');
      } else {
        setMensajes(['❌ El motor rechazó el documento:', ...r.errores.map(e => `${e.mensaje} ${e.porQue}`)]);
      }
    } catch {
      setMensajes(['⚠ Sin conexión al motor: captura las líneas a mano con el catálogo (el cuadre local sigue validando).']);
    }
  }

  async function guardar() {
    if (!cuadra) return;
    const lineasOk = lineas.map(l => {
      const interna = agrupadorDeCuentaInterna(l.cuenta.trim());
      // El agrupador del motor manda; si el alumno editó a mano, equivalencia.
      const agr = l.agrupador ?? (interna ? interna.codigo : l.cuenta.trim());
      return { cuentaInterna: l.cuenta.trim(), agrupador: agr, descripcion: agrupadorDe(agr)?.nombre ?? (interna ?? agrupadorDe(agr))?.nombre ?? l.cuenta.trim(), debe: num(l.debe) || 0, haber: num(l.haber) || 0 };
    });
    // El tipo lo manda el documento, no el formulario: PUE conciliado =
    // EGRESOS, PPD = PROVISIÓN. El servidor lo vuelve a validar (422).
    const tipo = (pagoConfirmado ? 'EGRESOS' : cfdi.metodo === 'PPD' ? 'PROVISION' : 'DIARIO') as 'EGRESOS' | 'PROVISION' | 'DIARIO';
    const fiscal = { uuid: cfdi.uuid, rfc: cfdi.rfc, metodo: cfdi.metodo, conciliado: pagoConfirmado };
    const poliza = {
      tipo,
      fecha: edo.fecha || cfdi.fecha, concepto: cfdi.producto, uuid: cfdi.uuid, rfcTercero: cfdi.rfc,
      montoTotal: num(cfdi.total) || 0, moneda: cfdi.moneda || 'MXN', metodoPago: '03',
      banco: edo.banco || undefined, lineas: lineasOk,
      totalDebe: totales.debe, totalHaber: totales.haber,
    };
    let fol = `LOCAL-${Date.now()}`;
    try {
      const r = await apiFetch<{ folio: string; error?: string }>('/api/sim/polizas/guardar', { method: 'POST', body: JSON.stringify({ poliza, fiscal }) });
      if ((r as { error?: string }).error) {
        setMensajes([`❌ El servidor rechazó la póliza: ${(r as { error?: string }).error}`]);
        return;
      }
      fol = r.folio;
    } catch (e: unknown) {
      const apiErr = e as { details?: unknown; message?: string };
      const det = apiErr?.details;
      const motivo = (typeof det === 'string' ? det : (det as { error?: string } | null | undefined)?.error) || apiErr?.message || '';
      // UUID duplicado (422 amable del servidor): no es error técnico, no se rompió nada.
      if (/ya contabilizado|duplicarías el registro/i.test(motivo)) {
        setMensajes([`⚠ ${motivo} 📚 Pide otra factura con el botón de practicar: cada UUID se contabiliza una sola vez.`]);
        return;
      }
      if (motivo && !/^HTTP error! status:/i.test(motivo)) {
        setMensajes([`⚠ ${motivo} 📚 No rompiste nada: revisa el dato y vuelve a intentar.`]);
        return;
      }
      setMensajes(['⚠ Sin conexión al servidor: la póliza quedó en tu balanza local, pero el folio es provisional.']);
    }
    setFolio(fol);
    marcarUsada(cfdi.uuid);
    setGuardadas(g => [...g, ...lineasOk.map(l => ({ agrupador: l.agrupador, debe: l.debe, haber: l.haber }))]);
    const score = 100;
    await reportarSim({ taskType: 'poliza_practica', title: `Póliza Contalink — ${cfdi.producto.slice(0, 40)}`, score, passed: true });
    setMensajes([`✅ Póliza guardada con folio ${fol}. Lo verás en la Balanza (pestaña 4): tu avance quedó registrado.`]);
    setFase('balanza');
  }

  const balanza = useMemo(() => {
    const m = new Map<string, { agrupador: string; nombre: string; debe: number; haber: number; final: number }>();
    for (const g of guardadas) {
      const e = agrupadorDe(g.agrupador);
      const a = m.get(g.agrupador) ?? { agrupador: g.agrupador, nombre: e?.nombre ?? g.agrupador, debe: 0, haber: 0, final: 0 };
      a.debe += g.debe; a.haber += g.haber;
      a.final = naturalezaDe(g.agrupador) === 'D' ? a.debe - a.haber : a.haber - a.debe;
      m.set(g.agrupador, a);
    }
    return [...m.values()];
  }, [guardadas]);

  function descargar(tipo: 'xml' | 'pdf') {
    const cuerpo = [
      `PÓLIZA ${(pagoConfirmado ? 'EGRESOS' : 'PROVISIÓN')} · ${folio ?? 'sin folio'}`,
      `Fecha: ${edo.fecha || cfdi.fecha} · UUID: ${cfdi.uuid} · RFC: ${cfdi.rfc}`,
      ...lineas.map(l => `${l.cuenta} | DEBE ${l.debe || 0} | HABER ${l.haber || 0}`),
      `Total DEBE ${fmt(totales.debe)} · Total HABER ${fmt(totales.haber)}`,
      `Notas: ${notas}`,
    ].join('\n');
    const blob = new Blob([tipo === 'xml' ? `<poliza>\n${cuerpo}\n</poliza>` : cuerpo], { type: tipo === 'xml' ? 'text/xml' : 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `poliza-${folio ?? 'borrador'}.${tipo === 'xml' ? 'xml' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const docAvisos = useMemo(() => {
    const avisos: string[] = [];
    if (cfdi.uuid && !/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/.test(cfdi.uuid.trim())) {
      avisos.push('📚 UUID sin formato de folio fiscal (8-4-4-4-12 hexadecimal): el motor lo rechazará. El UUID amarra tu póliza con su CFDI.');
    }
    if (cfdi.rfc && !/^([A-ZÑ&]{4}\d{6}[A-Z0-9]{3}|[A-ZÑ&]{3}\d{6}[A-Z0-9]{3})$/i.test(cfdi.rfc.trim())) {
      avisos.push('📚 RFC inválido (PF 13 o PM 12): además define la cuenta (601.45 vs 601.46) y la retención del 10%.');
    }
    return avisos;
  }, [cfdi.uuid, cfdi.rfc]);

  const campo = 'w-full border border-slate-300 rounded px-2 py-1 text-[12px] bg-white text-slate-800';

  return (
    <div className="fade-in" style={{ color: '#1e293b' }}>
      <TourSim titulo={TOURS.poliza.titulo} pasos={TOURS.poliza.pasos} storageKey={TOURS.poliza.storageKey} onNavegar={(p) => setFase(p as Fase)} />

      <div data-tour="poliza-hero" className="stat-card" style={{ borderLeft: '4px solid #1e40af' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>📝 Póliza de la factura (provisión / egresos)</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>Del CFDI al asiento: concilia contra el banco, clasifica al agrupador SAT y cuadra DEBE = HABER.</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <div><span className="stat-value">${fmt(totales.debe)}</span><div className="stat-label">Total DEBE</div></div>
          <div><span className="stat-value">${fmt(totales.haber)}</span><div className="stat-label">Total HABER</div></div>
          <div><span className="stat-value" style={{ color: totales.dif <= 0.01 ? '#059669' : '#dc2626' }}>${fmt(totales.dif)}</span><div className="stat-label">Diferencia</div></div>
          <div><span className="stat-value">{lineas.length}</span><div className="stat-label">Líneas</div></div>
        </div>
      </div>

      <div data-tour="poliza-fases" style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        {FASES.map(f => (
          <button key={f.id} onClick={() => setFase(f.id)} className={`tab-btn ${fase === f.id ? 'active' : ''}`} title={f.detalle}>{f.titulo}</button>
        ))}
      </div>

      <div className="theory-box">
        <div className="theory-box-title">📚 Puente teórico</div>
        <div className="theory-box-text">PUE pagado = egreso directo (gasto + retenciones + bancos). PPD = solo provisión (gasto + <b>119.01 IVA pendiente</b> + proveedores 201.01): el IVA acreditable 118.01 nace hasta el pago. Arrendamiento a PF retiene <b>10% ISR</b> (Art. 116 LISR). Tu cuenta interna (601-83) viaja al SAT como agrupador (601.45).</div>
      </div>

      {fase === 'documento' && (
        <div data-tour="poliza-doc" className="stat-card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>1. Documento fuente (CFDI)</div>
          {/* R-kinder: papel vs alcancía lado a lado (así concilia un contador real) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 8 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>📄 Lo que dice el papel (CFDI)</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{cfdi.emisor || '—'} · {cfdi.producto || '—'}</div>
              <div style={{ fontSize: 11 }}>Subtotal ${cfdi.subtotal || '0'} + IVA ${cfdi.iva16 || '0'} − ISR ${cfdi.isrRet || '0'} = <b>${cfdi.total || '0'}</b> ({cfdi.metodo})</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>🐖 Lo que dice la alcancía (banco)</div>
              {edo.fecha
                ? <div style={{ fontSize: 11 }}>{edo.banco || '—'} · {edo.fecha} · <b>${edo.totalPagado || '0'}</b></div>
                : <div style={{ fontSize: 11, color: '#64748b' }}>aún no se paga, es promesa (PPD: va como PROVISIÓN a 201.01, sin tocar el banco)</div>}
            </div>
          </div>
          <label style={{ fontSize: 11 }}>Caso del curso&nbsp;
            <select value={casoId} onChange={(e) => cargarCaso(e.target.value)} className={campo} style={{ width: 'auto' }}>
              {Object.entries(mapa).map(([id, c]) => <option key={id} value={id}>{c.nombre}</option>)}
            </select>
          </label>
          <button className="btn btn-secondary" style={{ marginLeft: 8, fontSize: 11 }} onClick={otraSemilla} title="Otra semilla: factura nueva con UUID sin repetir">
            🎲 Practicar con otra factura{usadas.length > 0 ? ` (${usadas.length} usadas)` : ''}
          </button>
          <details style={{ fontSize: 11, marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>📖 Glosario kinder (palabras raras en 1 línea)</summary>
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              {GLOSARIO.map(([t, d]) => <li key={t}><b>{t}:</b> {d}</li>)}
            </ul>
          </details>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
            <label style={{ fontSize: 11 }}>RFC<input value={cfdi.rfc} onChange={(e) => setCfdi({ ...cfdi, rfc: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>Emisor<input value={cfdi.emisor} onChange={(e) => setCfdi({ ...cfdi, emisor: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>Fecha<input value={cfdi.fecha} onChange={(e) => setCfdi({ ...cfdi, fecha: e.target.value })} className={campo} placeholder="DD-MM-AAAA" /></label>
            <label style={{ fontSize: 11 }}>UUID<input value={cfdi.uuid} onChange={(e) => setCfdi({ ...cfdi, uuid: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>Método<select value={cfdi.metodo} onChange={(e) => setCfdi({ ...cfdi, metodo: e.target.value as 'PUE' | 'PPD' })} className={campo}><option value="PUE">PUE</option><option value="PPD">PPD</option></select></label>
            <label style={{ fontSize: 11 }}>Moneda<input value={cfdi.moneda} onChange={(e) => setCfdi({ ...cfdi, moneda: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11, gridColumn: '1 / -1' }}>Producto<input value={cfdi.producto} onChange={(e) => setCfdi({ ...cfdi, producto: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>Subtotal<input value={cfdi.subtotal} onChange={(e) => setCfdi({ ...cfdi, subtotal: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>IVA 16%<input value={cfdi.iva16} onChange={(e) => setCfdi({ ...cfdi, iva16: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>ISR retención<input value={cfdi.isrRet} onChange={(e) => setCfdi({ ...cfdi, isrRet: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>Total<input value={cfdi.total} onChange={(e) => setCfdi({ ...cfdi, total: e.target.value })} className={campo} /></label>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={generarDesdeMotor}>⚙ Generar líneas con el motor</button>
            <button className="btn btn-secondary" onClick={() => setFase('conciliacion')}>Siguiente →</button>
          </div>
          {docAvisos.length > 0 && (
            <ul style={{ fontSize: 11, color: '#92400e', marginTop: 8 }}>
              {docAvisos.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          )}
        </div>
      )}

      {fase === 'conciliacion' && (
        <div data-tour="poliza-concilia" className="stat-card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>2. Cotejo contra estado de cuenta</div>
          <div style={{ fontSize: 11, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 6, marginBottom: 8 }}>
            👉 Revisa aquí el cotejo papel vs banco: si el veredicto es verde ✅ (o azul en PPD) puedes seguir a la póliza; si es rojo 🛑, no toques el banco y pasa al Detective.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            <label style={{ fontSize: 11 }}>Fecha pago<input value={edo.fecha} onChange={(e) => setEdo({ ...edo, fecha: e.target.value })} className={campo} placeholder="DD-MM-AAAA" /></label>
            <label style={{ fontSize: 11 }}>Concepto<input value={edo.concepto} onChange={(e) => setEdo({ ...edo, concepto: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>Total pagado<input value={edo.totalPagado} onChange={(e) => setEdo({ ...edo, totalPagado: e.target.value })} className={campo} /></label>
            <label style={{ fontSize: 11 }}>Banco<input value={edo.banco} onChange={(e) => setEdo({ ...edo, banco: e.target.value })} className={campo} placeholder="RITO FINANCIERA" /></label>
          </div>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            {pagoConfirmado
              ? <span className="status-badge status-ok">✓ Pago confirmado: CFDI ${fmt(num(cfdi.total) || 0)} = banco ${fmt(num(edo.totalPagado) || 0)} → póliza de EGRESOS</span>
              : <span className="status-badge status-warning">○ Sin pago confirmado {cfdi.metodo === 'PPD' ? '(PPD: va como PROVISIÓN a 201.01)' : '(captura el estado de cuenta o será póliza de DIARIO)'} — 📚 el banco solo se afecta si el dinero salió</span>}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setFase('documento')}>← Atrás</button>
            <button className="btn btn-primary" onClick={() => setFase('poliza')}>A la póliza →</button>
          </div>
        </div>
      )}

      {fase === 'poliza' && (
        <div data-tour="poliza-editor" className="stat-card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>PÓLIZA DE LA FACTURA ({pagoConfirmado ? 'EGRESOS' : cfdi.metodo === 'PPD' ? 'PROVISIÓN' : 'DIARIO'})</div>
          {/* R-kinder: regla de oro + columpio visual DEBE vs HABER */}
          <div style={{ fontSize: 11, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: 6, marginBottom: 8 }}>
            ⚖️ Regla de oro: {REGLA_ORO}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, background: '#dcfce7', borderRadius: 6, padding: 4, textAlign: 'center' }}>🟢 DEBE ${fmt(totales.debe)}</div>
              <div style={{ flex: 1, background: '#fee2e2', borderRadius: 6, padding: 4, textAlign: 'center' }}>🔴 HABER ${fmt(totales.haber)}</div>
            </div>
            <div style={{ fontSize: 11, marginTop: 4 }}>{totales.dif <= 0.01 ? '✅ El columpio quedó parejo: puedes guardar.' : '⚖️ Se ladeó, quita o agrega aquí hasta que dé igual.'}</div>
          </div>
          <div style={{ fontSize: 11, marginBottom: 8, color: '#475569' }}>
            💡 Escribe el <b>nombre</b> ("bancos", "renta", "isr retenido") o el <b>código</b> (601.45) en cada línea y elige el resultado: se registra tu cuenta interna y viaja su agrupador al SAT.
            <br />🐖 Ojo kinder: al pagar, el banco va en <b>HABER aunque su casa sea DEBE</b> — así es como sale el dinero. El que manda es el columpio, no la etiqueta.
          </div>
          <table className="data-table">
            <thead><tr><th>CUENTA CONTABLE</th><th>Agrupador SAT</th><th style={{ textAlign: 'right' }}>DEBE</th><th style={{ textAlign: 'right' }}>HABER</th><th></th></tr></thead>
            <tbody>
              {lineas.map((l, i) => {
                const et = etiquetaLinea(l);
                const sug = openLinea === l.id && l.cuenta.trim().length >= 1 ? buscarCuentasFront(l.cuenta.trim()) : [];
                return (
                  <tr key={l.id}>
                    <td style={{ position: 'relative' }}>
                      <input value={l.cuenta} onFocus={() => setOpenLinea(l.id)} onBlur={() => setTimeout(() => setOpenLinea(o => o === l.id ? null : o), 150)} onChange={(e) => { setLineas(lineas.map(x => x.id === l.id ? { ...x, cuenta: e.target.value, agrupador: undefined } : x)); setOpenLinea(l.id); }} className={campo} placeholder="bancos, renta, 601.45…" />
                      {sug.length > 0 && (
                        <div style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, border: '1px solid #1e40af', borderRadius: 6, marginTop: 2, background: 'white', maxHeight: 220, overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
                          {sug.map(s => (
                            <button key={s.agrupador} onMouseDown={(e) => { e.preventDefault(); setLineas(lineas.map(x => x.id === l.id ? { ...x, cuenta: s.cuentaInternaSugerida, agrupador: undefined } : x)); setOpenLinea(null); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: 11, background: 'white', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} title={`Registra ${s.cuentaInternaSugerida} → viaja ${s.agrupador}`}>
                              <b>[{s.agrupador}]</b> {s.nombre} <span style={{ color: '#64748b' }}>· {s.naturaleza === 'D' ? '→ DEBE' : '→ HABER'}</span>
                              <br /><span style={{ color: '#1e40af' }}>↳ registra {s.cuentaInternaSugerida} · [Usar]</span>
                              {s.avisoColision && <><br /><span style={{ color: '#991b1b' }}>{s.avisoColision}</span></>}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 11, color: '#1e40af' }}>
                      {et.texto}
                      {et.naturaleza && <span style={{ color: '#64748b' }}> {et.naturaleza === 'D' ? '→ DEBE' : '→ HABER'}</span>}
                      {et.colision && <><br /><span style={{ color: '#991b1b' }}>{et.colision}</span></>}
                    </td>
                    <td><input value={l.debe} onChange={(e) => setLineas(lineas.map(x => x.id === l.id ? { ...x, debe: e.target.value } : x))} className={campo} style={{ textAlign: 'right' }} placeholder="0.00" /></td>
                    <td><input value={l.haber} onChange={(e) => setLineas(lineas.map(x => x.id === l.id ? { ...x, haber: e.target.value } : x))} className={campo} style={{ textAlign: 'right' }} placeholder="0.00" /></td>
                    <td><button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setLineas(lineas.filter((_, j) => j !== i))}>Eliminar</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => setLineas([...lineas, { id: seqId++, cuenta: '', debe: '', haber: '' }])}>Agregar asiento</button>
          </div>
          {lineas.length === 0 && (
            <div style={{ fontSize: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 8, marginTop: 8 }}>
              📭 Tu póliza está vacía porque aún no generas las líneas: llegaste directo del Documento sin generar.
              <br />Vuelve al Documento y presiona "Generar líneas con el motor", o agrega tu primera línea a mano.
              <div style={{ marginTop: 6 }}>
                <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={() => setFase('documento')}>📄 Ir al Documento a generar</button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 13, fontWeight: 700 }}>
            <span>Total: ${fmt(totales.debe)}</span>
            <span>Total: ${fmt(totales.haber)}</span>
            {cuadra
              ? <span className="status-badge status-ok">✓ Póliza cuadrada: DEBE = HABER</span>
              : <span className="status-badge status-error">○ Descuadrada por ${fmt(totales.dif)}{erroresLinea.length > 0 ? ` · ${erroresLinea.length} error(es)` : ''}</span>}
          </div>
          {erroresLinea.length > 0 && (
            <ul style={{ fontSize: 11, color: '#991b1b', marginTop: 6 }}>
              {erroresLinea.map((e, i) => <li key={i}>📚 {e}</li>)}
            </ul>
          )}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Notas Adicionales</div>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className={campo} rows={2} style={{ width: '100%' }} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setFase('conciliacion')}>← Atrás</button>
            <button data-tour="poliza-guardar" className="btn btn-success" disabled={!cuadra} onClick={guardar} title={cuadra ? 'Guardar póliza' : lineas.length === 0 ? 'Te falta generar líneas: vuelve al Documento y genera' : 'Cuadra DEBE = HABER para guardar'}>Guardar</button>
            {!cuadra && <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>{lineas.length === 0 ? 'Te falta generar líneas (0 líneas, $0.00): sin líneas no hay nada que guardar.' : 'Te falta cuadrar DEBE = HABER para guardar.'}</span>}
            <button className="btn btn-secondary" onClick={() => { setLineas([]); setFolio(null); }}>Cancelar</button>
            <button className="btn btn-secondary" onClick={() => descargar('xml')}>Descargar XML</button>
            <button className="btn btn-secondary" onClick={() => descargar('pdf')}>Descargar PDF</button>
            {!cuadra && <button className="btn btn-secondary" onClick={() => setFase('detective')}>🕵️ Pasar a Modo detective</button>}
          </div>
        </div>
      )}

      {fase === 'detective' && (
        <div data-tour="poliza-editor" className="stat-card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🕵️ Modo detective (solo si descuadra: investiga en 4 pasos)</div>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>Si la póliza no da 0, no se guarda. Se investiga en este orden — cada pregunta te lleva donde se revisa.</div>
          {PREGUNTAS_DETECTIVE.map((p, i) => (
            <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, marginBottom: 6, background: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{i + 1}. {p.titulo}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>🐖 {p.frase}</div>
              <button className="btn btn-secondary" style={{ marginTop: 6, fontSize: 11 }} onClick={() => setFase(p.destino)}>revisar aquí →</button>
            </div>
          ))}
          <div style={{ border: '1px solid #fca5a5', borderRadius: 8, padding: 8, background: '#fef2f2', marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>🏥 601.83 = hospital de gastos enfermos, no basurero para esconder errores</div>
            <div style={{ fontSize: 11 }}>✅ Legítimo: gasto real pagado pero sin requisitos fiscales → su IVA se vuelve costo, nunca a 118.01.</div>
            <div style={{ fontSize: 11 }}>⛔ Prohibido: meter la diferencia a 601.83 solo para que cuadre. Si sobra por error de dedo, se corrige el dedo.</div>
            <label style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
              <input type="checkbox" checked={declara60183} onChange={(e) => setDeclara60183(e.target.checked)} /> declaro que este gasto no tiene requisitos fiscales
            </label>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setFase('poliza')}>← Volver a la póliza</button>
            <button className="btn btn-primary" onClick={() => setFase('balanza')}>Ver mi balanza →</button>
          </div>
        </div>
      )}

      {fase === 'balanza' && (
        <div data-tour="poliza-balanza" className="stat-card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>4. Balanza de comprobación por rubros (Anexo 24 · B){folio ? ` · último folio ${folio}` : ''}</div>
          <div style={{ fontSize: 11, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 6, marginBottom: 8 }}>
            📚 {REGLA_CERO} Es la sección B de la balanza electrónica: la suma final debe dar 0.
          </div>
          {balanza.length === 0
            ? <div style={{ fontSize: 12, color: '#64748b' }}>Aún no guardas pólizas en esta sesión. Captura y guarda para ver cómo cada línea alimenta su agrupador.</div>
            : (
              <>
                <div style={{ fontWeight: 700, fontSize: 12, margin: '8px 0 4px' }}>Sección Balance (1-Activo · 2-Pasivo · 3-Capital: lo que tengo y debo)</div>
                <table className="data-table">
                  <thead><tr><th>Agrupador</th><th>Cuenta</th><th style={{ textAlign: 'right' }}>Debe</th><th style={{ textAlign: 'right' }}>Haber</th><th style={{ textAlign: 'right' }}>Saldo final</th></tr></thead>
                  <tbody>
                    {balanza.filter(b => '123'.includes(b.agrupador.charAt(0))).map(b => (
                      <tr key={b.agrupador}>
                        <td style={{ fontFamily: 'monospace' }}>{b.agrupador}</td>
                        <td>{b.nombre}</td>
                        <td style={{ textAlign: 'right' }}>${fmt(b.debe)}</td>
                        <td style={{ textAlign: 'right' }}>${fmt(b.haber)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>${fmt(b.final)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontWeight: 700, fontSize: 12, margin: '8px 0 4px' }}>Sección Resultados (4-Ingresos · 5/6/7-Costos y Gastos: lo que gané y gasté)</div>
                <table className="data-table">
                  <thead><tr><th>Agrupador</th><th>Cuenta</th><th style={{ textAlign: 'right' }}>Debe</th><th style={{ textAlign: 'right' }}>Haber</th><th style={{ textAlign: 'right' }}>Saldo final</th></tr></thead>
                  <tbody>
                    {balanza.filter(b => !'123'.includes(b.agrupador.charAt(0))).map(b => (
                      <tr key={b.agrupador}>
                        <td style={{ fontFamily: 'monospace' }}>{b.agrupador}</td>
                        <td>{b.nombre}</td>
                        <td style={{ textAlign: 'right' }}>${fmt(b.debe)}</td>
                        <td style={{ textAlign: 'right' }}>${fmt(b.haber)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>${fmt(b.final)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, marginTop: 8, color: '#059669' }}>
                  GRAN TOTAL ${fmt(balanza.reduce((s, b) => s + b.debe, 0) - balanza.reduce((s, b) => s + b.haber, 0))} — {Math.abs(balanza.reduce((s, b) => s + b.debe, 0) - balanza.reduce((s, b) => s + b.haber, 0)) <= 0.01 ? '✅ cero perfecto, todos en casa' : '🕵️ descuadra: pasa al Modo detective'}
                </div>
              </>
            )}
          <div className="reference-box">Saldo final = debe − haber en cuentas deudoras (1/5/6/7) y al revés en acreedoras (2/3/4). Es la sección B de la balanza electrónica.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setFase('documento')}>Nueva póliza +</button>
            <button className="btn btn-secondary" onClick={() => setFase('detective')}>🕵️ Pasar a Modo detective</button>
          </div>
        </div>
      )}

      {/* R-kinder: piloto cerdito-alcancía con 2 modos */}
      <div className="stat-card" style={{ marginTop: 12, borderLeft: '4px solid #f59e0b' }}>
        <div style={{ fontWeight: 700, fontSize: 12 }}>🐖 Piloto kinder (tu guía)</div>
        <div style={{ fontSize: 11, color: '#475569' }}>Receta = CFDI · Alcancía = banco · Columpio = póliza · Apartar juguete = PPD · Llevarlo pagado = PUE.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className={`btn ${pilotoModo === 'auto' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 11 }} onClick={() => setPilotoModo('auto')}>hazlo por mí</button>
          <button className={`btn ${pilotoModo === 'yo' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 11 }} onClick={() => setPilotoModo('yo')}>yo lo intento</button>
        </div>
        {pilotoModo === 'auto' && <div style={{ fontSize: 11, marginTop: 6 }}>🐖 {PISTA_PILOTO[fase] ?? 'Sigue la pista de tu fase.'}</div>}
        {pilotoModo === 'auto' && <button className="btn btn-primary" style={{ fontSize: 11, marginTop: 6 }} onClick={accionPiloto} disabled={pilotoBusy}>{pilotoBusy ? '⏳ Trabajando... espérame' : '▶ Haz el siguiente paso por mí'}</button>}
        {pilotoModo === 'yo' && <div style={{ fontSize: 11, marginTop: 6 }}>🎉 ¡Tú puedes! Pista: {PISTA_PILOTO[fase] ?? 'revisa la regla de oro antes de Guardar.'}</div>}
      </div>

      {mensajes.length > 0 && (
        <div className="stat-card" style={{ marginTop: 12 }}>
          {mensajes.map((m, i) => <div key={i} style={{ fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 4 }}>{m}</div>)}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>DETALLE DE PAGOS · PUE = egreso · PPD = provisión</div>
    </div>
  );
}
