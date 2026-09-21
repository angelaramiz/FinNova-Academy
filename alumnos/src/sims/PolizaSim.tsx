// PolizaSim — 5º submódulo Contalink: captura de pólizas como la pantalla
// real (PÓLIZA DE LA FACTURA PROVISIÓN/EGRESOS): editor multilínea
// CUENTA/DEBE/HABER, Eliminar por línea, Agregar asiento, totales que
// bloquean Guardar si descuadran, Notas con UUID, Guardar/Cancelar,
// Descargar XML/PDF. El motor vive en backend (polizaEngine); el Sim valida
// en local (catálogo DOF completo) y persiste vía /api/sim/polizas.
// Goldens: MARCELO F 70900/7090/63810, PPD 1000/160/1160, ventas, capital.
// Diseño ContaLink claro (clk-*). Cero LLM.
import { useMemo, useState } from 'react';
import { agrupadorDe, agrupadorDeCuentaInterna, etiquetaAgrupador, CATALOGO_AGRUPADOR } from './catalogoAgrupador';
import { reportarSim } from './reportarSim';
import { apiFetch } from '../lib/api';
import TourSim from './TourSim';
import { TOURS } from './toursContalink';

type Fase = 'documento' | 'conciliacion' | 'poliza' | 'balanza';
const FASES: { id: Fase; titulo: string; detalle: string }[] = [
  { id: 'documento', titulo: '1. Documento', detalle: 'CFDI fuente: UUID, montos, PUE/PPD' },
  { id: 'conciliacion', titulo: '2. Conciliación', detalle: 'Cotejo contra estado de cuenta' },
  { id: 'poliza', titulo: '3. Póliza', detalle: 'Captura multilínea DEBE/HABER' },
  { id: 'balanza', titulo: '4. Balanza', detalle: 'Guarda y acumula por agrupador' },
];

interface CfdiForm {
  rfc: string; emisor: string; fecha: string; uuid: string; metodo: 'PUE' | 'PPD';
  producto: string; moneda: string; subtotal: string; iva16: string; isrRet: string; total: string;
}

interface EdoForm { fecha: string; concepto: string; totalPagado: string; banco: string; }

interface Linea { id: number; cuenta: string; debe: string; haber: string; }

const CASOS: Record<string, { nombre: string; cfdi: CfdiForm; edo: EdoForm }> = {
  marcelo: {
    nombre: 'MARCELO F · Arrendamiento PUE (ASIENTO 1)',
    cfdi: { rfc: 'FOFM8406126X3', emisor: 'MARCELO F', fecha: '02-01-2025', uuid: '1317D7E0-38AC-489F-9082-E75019D8975E', metodo: 'PUE', producto: 'Arrendamiento de residencias DEL 15 de enero al 14 de febrero del 2025', moneda: 'MXN', subtotal: '70900', iva16: '0', isrRet: '7090', total: '63810' },
    edo: { fecha: '02-01-2025', concepto: 'Arrendamiento de residencias', totalPagado: '63810', banco: 'RITO FINANCIERA' },
  },
  ppd: {
    nombre: 'Proveedor PPD · Provisión 1000/160/1160',
    cfdi: { rfc: 'PROV920101ABC', emisor: 'PROVEEDOR PPD', fecha: '05-01-2025', uuid: 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE', metodo: 'PPD', producto: 'Arrendamiento de bodega enero 2025', moneda: 'MXN', subtotal: '1000', iva16: '160', isrRet: '0', total: '1160' },
    edo: { fecha: '', concepto: '', totalPagado: '', banco: '' },
  },
  ventas: {
    nombre: 'Ventas enero · 26680/23000/3680',
    cfdi: { rfc: 'CLIENTE750101XYZ', emisor: 'EMPRESA (propia)', fecha: '10-01-2025', uuid: 'FFFFFFFF-1111-2222-3333-444444444444', metodo: 'PUE', producto: 'Ventas y/o servicios gravados a la tasa general', moneda: 'MXN', subtotal: '23000', iva16: '3680', isrRet: '0', total: '26680' },
    edo: { fecha: '10-01-2025', concepto: 'Cobro ventas enero', totalPagado: '26680', banco: 'RITO FINANCIERA' },
  },
  capital: {
    nombre: 'Aportación · 50000/50000',
    cfdi: { rfc: 'SOCIO800101AAA', emisor: 'SOCIO APORTANTE', fecha: '15-01-2025', uuid: 'BBBBBBBB-2222-3333-4444-555555555555', metodo: 'PUE', producto: 'Aportación de capital fijo', moneda: 'MXN', subtotal: '50000', iva16: '0', isrRet: '0', total: '50000' },
    edo: { fecha: '15-01-2025', concepto: 'Aportación de capital', totalPagado: '50000', banco: 'RITO FINANCIERA' },
  },
};

const VACIO_CFDI: CfdiForm = { rfc: '', emisor: '', fecha: '', uuid: '', metodo: 'PUE', producto: '', moneda: 'MXN', subtotal: '', iva16: '', isrRet: '', total: '' };
const VACIO_EDO: EdoForm = { fecha: '', concepto: '', totalPagado: '', banco: '' };

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
  const [busqueda, setBusqueda] = useState('');

  function cargarCaso(id: string) {
    setCasoId(id);
    setCfdi({ ...CASOS[id].cfdi });
    setEdo({ ...CASOS[id].edo });
    setLineas([]);
    setNotas(`${CASOS[id].cfdi.uuid}, ${CASOS[id].cfdi.producto}.`);
    setMensajes([]);
    setFolio(null);
  }

  const pagoConfirmado = useMemo(() => {
    const t = num(edo.totalPagado);
    const c = num(cfdi.total);
    if (!edo.fecha || !Number.isFinite(t) || !Number.isFinite(c)) return false;
    return Math.abs(t - c) <= 0.01;
  }, [edo, cfdi.total]);

  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q.length < 2) return [];
    return CATALOGO_AGRUPADOR.filter(e => e.codigo.includes(q) || e.nombre.toLowerCase().includes(q)).slice(0, 8);
  }, [busqueda]);

  function resolverLinea(l: Linea): string | null {
    if (!l.cuenta.trim()) return 'Vacía: escribe la cuenta interna (ej. 601-83) o el agrupador (ej. 601.45).';
    const interna = agrupadorDeCuentaInterna(l.cuenta.trim());
    if (interna) return null;
    if (agrupadorDe(l.cuenta.trim())) return null;
    return `La cuenta ${l.cuenta.trim()} no existe en el Anexo 24: sin código agrupador no va a la balanza electrónica.`;
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
        setLineas(r.poliza.lineas.map(l => ({ id: seqId++, cuenta: l.cuentaInterna, debe: l.debe ? String(l.debe) : '', haber: l.haber ? String(l.haber) : '' })));
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
      const agr = interna ? interna.codigo : l.cuenta.trim();
      return { cuentaInterna: l.cuenta.trim(), agrupador: agr, descripcion: (interna ?? agrupadorDe(agr))?.nombre ?? l.cuenta.trim(), debe: num(l.debe) || 0, haber: num(l.haber) || 0 };
    });
    const poliza = {
      tipo: (pagoConfirmado ? 'EGRESOS' : cfdi.metodo === 'PPD' ? 'PROVISION' : 'DIARIO') as 'EGRESOS' | 'PROVISION' | 'DIARIO',
      fecha: edo.fecha || cfdi.fecha, concepto: cfdi.producto, uuid: cfdi.uuid, rfcTercero: cfdi.rfc,
      montoTotal: num(cfdi.total) || 0, moneda: cfdi.moneda || 'MXN', metodoPago: '03',
      banco: edo.banco || undefined, lineas: lineasOk,
      totalDebe: totales.debe, totalHaber: totales.haber,
    };
    let fol = `LOCAL-${Date.now()}`;
    try {
      const r = await apiFetch<{ folio: string }>('/api/sim/polizas/guardar', { method: 'POST', body: JSON.stringify({ poliza }) });
      fol = r.folio;
    } catch { /* best-effort: el folio local + reporte conservan el avance */ }
    setFolio(fol);
    setGuardadas(g => [...g, ...lineasOk.map(l => ({ agrupador: l.agrupador, debe: l.debe, haber: l.haber }))]);
    const score = 100;
    await reportarSim({ taskType: 'poliza_practica', title: `Póliza Contalink — ${cfdi.producto.slice(0, 40)}`, score, passed: true });
    setMensajes([`✅ Póliza guardada con folio ${fol}. Avance registrado.`]);
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

  const campo = 'w-full border border-slate-300 rounded px-2 py-1 text-[12px] bg-white text-slate-800';

  return (
    <div className="fade-in">
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
          <label style={{ fontSize: 11 }}>Caso del curso&nbsp;
            <select value={casoId} onChange={(e) => cargarCaso(e.target.value)} className={campo} style={{ width: 'auto' }}>
              {Object.entries(CASOS).map(([id, c]) => <option key={id} value={id}>{c.nombre}</option>)}
            </select>
          </label>
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
        </div>
      )}

      {fase === 'conciliacion' && (
        <div data-tour="poliza-concilia" className="stat-card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>2. Cotejo contra estado de cuenta</div>
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
          <div style={{ fontSize: 11, marginBottom: 8 }}>
            Buscador Anexo 24:&nbsp;
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={campo} style={{ width: 260 }} placeholder="ej. 601.45 o arrendamiento" />
            {sugerencias.length > 0 && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, marginTop: 4, background: 'white' }}>
                {sugerencias.map(s => <div key={s.codigo} style={{ padding: '4px 8px', fontSize: 11 }}>{s.codigo} — {s.nombre}</div>)}
              </div>
            )}
          </div>
          <table className="data-table">
            <thead><tr><th>CUENTA CONTABLE</th><th>Agrupador SAT</th><th style={{ textAlign: 'right' }}>DEBE</th><th style={{ textAlign: 'right' }}>HABER</th><th></th></tr></thead>
            <tbody>
              {lineas.map((l, i) => {
                const interna = agrupadorDeCuentaInterna(l.cuenta.trim());
                const directa = !interna ? agrupadorDe(l.cuenta.trim()) : null;
                return (
                  <tr key={l.id}>
                    <td><input value={l.cuenta} onChange={(e) => setLineas(lineas.map(x => x.id === l.id ? { ...x, cuenta: e.target.value } : x))} className={campo} placeholder="601-83 o 601.45" /></td>
                    <td style={{ fontSize: 11, color: '#1e40af' }}>{interna ? etiquetaAgrupador(l.cuenta.trim()) : directa ? `${directa.codigo} — ${directa.nombre}` : '—'}</td>
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
            <button data-tour="poliza-guardar" className="btn btn-success" disabled={!cuadra} onClick={guardar} title={cuadra ? 'Guardar póliza' : 'Cuadra DEBE = HABER para guardar'}>Guardar</button>
            <button className="btn btn-secondary" onClick={() => { setLineas([]); setFolio(null); }}>Cancelar</button>
            <button className="btn btn-secondary" onClick={() => descargar('xml')}>Descargar XML</button>
            <button className="btn btn-secondary" onClick={() => descargar('pdf')}>Descargar PDF</button>
          </div>
        </div>
      )}

      {fase === 'balanza' && (
        <div data-tour="poliza-balanza" className="stat-card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>4. Balanza por agrupador (Anexo 24 · B){folio ? ` · último folio ${folio}` : ''}</div>
          {balanza.length === 0
            ? <div style={{ fontSize: 12, color: '#64748b' }}>Aún no guardas pólizas en esta sesión. Captura y guarda para ver cómo cada línea alimenta su agrupador.</div>
            : (
              <table className="data-table">
                <thead><tr><th>Agrupador</th><th>Cuenta</th><th style={{ textAlign: 'right' }}>Debe</th><th style={{ textAlign: 'right' }}>Haber</th><th style={{ textAlign: 'right' }}>Saldo final</th></tr></thead>
                <tbody>
                  {balanza.map(b => (
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
            )}
          <div className="reference-box">Saldo final = debe − haber en cuentas deudoras (1/5/6/7) y al revés en acreedoras (2/3/4). Es la sección B de la balanza electrónica.</div>
          <button className="btn btn-secondary" onClick={() => setFase('documento')}>Nueva póliza +</button>
        </div>
      )}

      {mensajes.length > 0 && (
        <div className="stat-card" style={{ marginTop: 12 }}>
          {mensajes.map((m, i) => <div key={i} style={{ fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 4 }}>{m}</div>)}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>DETALLE DE PAGOS · PUE = egreso · PPD = provisión</div>
    </div>
  );
}
