// TASK-D2 — ConciliacionSim: recrea el flujo del webinar de Pedro Castillo
// (VTT conciliacion). 7 pantallas: Alta -> Convertidor -> Carga -> Manual ->
// Auto -> Casos -> Cierre. Sin SpreadsheetWidget, sin CDNs. Cero LLM.
// Diseno ContaLink (mas.html): hero azul, stat-cards vivas de la caratula,
// 4 fases, teoria de cuenta puente. Montos SIEMPRE goldens del video.
import { useMemo, useState } from 'react';
import {
  validarAltaBanco,
  validarCaratula,
  sugerirPorMonto,
  aplicarCaso,
  validarCierre,
  CASOS,
} from './conciliacionEngine';
import { etiquetaAgrupador } from './catalogoAgrupador';
import { reportarSim } from './reportarSim';
import TourSim from './TourSim';
import { TOURS } from './toursContalink';

type Paso = 'alta' | 'convertidor' | 'carga' | 'manual' | 'auto' | 'casos' | 'cierre';
const PASOS: Paso[] = ['alta', 'convertidor', 'carga', 'manual', 'auto', 'casos', 'cierre'];
const TITULOS: Record<Paso, string> = {
  alta: 'Alta de banco y caja',
  convertidor: 'Convertidor PDF a Excel',
  carga: 'Carga del estado de cuenta',
  manual: 'Conciliación manual',
  auto: 'Autoconciliación',
  casos: 'Casos de uso',
  cierre: 'Cierre del periodo',
};

// Fases visuales ContaLink que agrupan los 7 pasos del webinar.
const FASES: { id: string; titulo: string; detalle: string; color: string; pasos: Paso[] }[] = [
  { id: 'config', titulo: '1. Configuración', detalle: 'Alta de banco y caja', color: '#3b82f6', pasos: ['alta'] },
  { id: 'carga', titulo: '2. Carga', detalle: 'PDF → Excel → estado de cuenta', color: '#10b981', pasos: ['convertidor', 'carga'] },
  { id: 'concilia', titulo: '3. Conciliación', detalle: 'Manual, auto y 8 casos', color: '#f59e0b', pasos: ['manual', 'auto', 'casos'] },
  { id: 'cierre', titulo: '4. Cierre', detalle: 'Póliza y bloqueo del periodo', color: '#7c3aed', pasos: ['cierre'] },
];

const MOVS_DEMO = [
  { id: 1, monto: 1219.6, descripcion: 'PAGO FOLIO 8821' },
  { id: 2, monto: 789, descripcion: 'FACEBOOK ADS' },
  { id: 3, monto: 150, descripcion: 'RETIRO' },
];

const FACTS_DEMO = [
  { folio: '8821', monto: 4419.6 },
  { folio: '51010', monto: 8062 },
  { folio: 'FB-45', monto: 789 },
];

export default function ConciliacionSim() {
  const [paso, setPaso] = useState<Paso>('alta');
  const [banco, setBanco] = useState({ nombre: 'BBVA débito', cuenta: '102-01-001', saldoInicial: '50000', clabe: '', moneda: 'MN' });
  const [caratula, setCaratula] = useState({ inicial: '50000', depositos: '20000', retiros: '15000', final: '55000' });
  const [periodo, setPeriodo] = useState({ ini: '2025-05-13', fin: '2025-06-13' });
  const [selMov, setSelMov] = useState(1);
  const [casoId, setCasoId] = useState('parcial');
  const [payload, setPayload] = useState('');
  const [resultado, setResultado] = useState<string | null>(null);
  const [cierre, setCierre] = useState({ fechaPoliza: '2025-06-10', fechaMovimiento: '2025-06-10', contrapartida: '899-04', cuentaBanco: '102-01-001' });

  const errBanco = useMemo(
    () => validarAltaBanco({ nombre: banco.nombre, cuenta: banco.cuenta, saldoInicial: Number(banco.saldoInicial), clabe: banco.clabe, moneda: banco.moneda as 'MN' | 'USD' }),
    [banco],
  );
  const errCaratula = useMemo(
    () => validarCaratula({ inicial: Number(caratula.inicial), depositos: Number(caratula.depositos), retiros: Number(caratula.retiros), final: Number(caratula.final) }),
    [caratula],
  );
  const mov = MOVS_DEMO.find((m) => m.id === selMov)!;
  const sugerencias = useMemo(() => sugerirPorMonto(mov, FACTS_DEMO), [mov]);
  const caso = CASOS.find((c) => c.id === casoId)!;
  const errCierre = useMemo(() => validarCierre(cierre), [cierre]);

  function resolverCaso() {
    let p: Record<string, unknown> = {};
    try {
      p = payload ? (JSON.parse(payload) as Record<string, unknown>) : {};
    } catch {
      setResultado('❌ Payload inválido: usa JSON, ej. {"montoAplicado": 1219.6}');
      return;
    }
    const r = aplicarCaso(casoId, p);
    if (r.ok) reportarSim({ taskType: 'conciliacion_practica', title: `Conciliación — ${caso.titulo}`, score: 100, passed: true });
    setResultado(
      `${r.ok ? '✅' : '❌'} ${r.mensaje}` +
      (r.resto !== undefined ? ` · resto ${r.resto.toFixed(2)}` : '') +
      (r.aplicado !== undefined ? ` · aplicado ${r.aplicado.toFixed(2)}` : '') +
      (r.conciliados !== undefined ? ` · ${r.conciliados} auto, ${r.pendientes} pendientes` : ''),
    );
  }

  const idx = PASOS.indexOf(paso);
  const faseDe = (p: Paso) => FASES.find((f) => f.pasos.includes(p))!;
  const faseActiva = faseDe(paso);
  const num = (v: string, set: (s: string) => void, label: string) => (
    <label className="block text-xs text-slate-600">
      {label}
      <input value={v} onChange={(e) => set(e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-sm" />
    </label>
  );
  // Sistema claro ContaLink (mas.html): tarjetas blancas, borde #e2e8f0.
  const card = 'space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs';

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 12 }}>
      {/* Hero ContaLink (mas.html: gradiente azul conciliación #1e40af→#3b82f6) */}
      <div data-tour="conciliacion-hero" className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
        <div className="flex gap-1.5 flex-wrap mb-1.5">
          {['Conciliación Bancaria', 'BBVA débito', 'Cuenta puente 899'].map((b) => (
            <span key={b} className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.2)' }}>{b}</span>
          ))}
        </div>
        <h2 className="text-lg font-bold">Conciliación bancaria · BBVA débito</h2>
        <p className="text-xs opacity-90">Configuración, carga, conciliación y cierre · periodo {periodo.ini} → {periodo.fin}</p>
      </div>

      <TourSim titulo={TOURS.conciliacion.titulo} pasos={TOURS.conciliacion.pasos} storageKey={TOURS.conciliacion.storageKey} onNavegar={(p) => setPaso(p as Paso)} />

      {/* Stat-cards blancas con icono en cuadro de color (mas.html) */}
      <div data-tour="conciliacion-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { v: `$${Number(caratula.inicial).toLocaleString()}`, l: 'Saldo inicial', c: '#1e293b', bg: '#eff6ff', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', ic: '#1e40af' },
          { v: `$${Number(caratula.depositos).toLocaleString()}`, l: 'Depósitos (azul)', c: '#065f46', bg: '#f0fdf4', icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4', ic: '#10b981' },
          { v: `$${Number(caratula.retiros).toLocaleString()}`, l: 'Retiros (rojo)', c: '#991b1b', bg: '#fef2f2', icon: 'M17 16V4m0 0l4 4m-4-4L13 8m-6 8v-4m0 4l-4-4m4 4l4-4', ic: '#ef4444' },
          { v: `$${Number(caratula.final).toLocaleString()}`, l: 'Saldo final', c: '#1e40af', bg: '#faf5ff', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', ic: '#7c3aed' },
        ].map((s) => (
          <div key={s.l} className="stat-card" style={{ background: 'white', border: errCaratula.length === 0 ? '1px solid #e2e8f0' : '1px solid #f87171', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div><div className="stat-value" style={{ color: s.c }}>{s.v}</div><div className="stat-label">{s.l}</div></div>
              <div style={{ width: 40, height: 40, background: s.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.ic} strokeWidth="2"><path d={s.icon} /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fases ContaLink */}
      <div data-tour="conciliacion-fases" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FASES.map((f) => (
          <button key={f.id} onClick={() => setPaso(f.pasos[0])}
            className={`text-left p-2.5 rounded-xl border-2 transition bg-white ${faseActiva.id === f.id ? '' : 'opacity-70 hover:opacity-100'}`}
            style={{ borderColor: faseActiva.id === f.id ? f.color : '#e2e8f0', background: faseActiva.id === f.id ? `${f.color}12` : 'white' }}>
            <div className="text-xs font-bold text-slate-800" style={{ borderLeft: `4px solid ${f.color}`, paddingLeft: 6 }}>{f.titulo}</div>
            <div className="text-[10px] text-slate-500 mt-0.5" style={{ paddingLeft: 10 }}>{f.detalle}</div>
            <div className="flex gap-1 mt-1.5" style={{ paddingLeft: 10 }}>
              {f.pasos.map((p) => (
                <span key={p} title={TITULOS[p]} className="h-1.5 flex-1 rounded-full" style={{ background: PASOS.indexOf(p) <= idx ? f.color : undefined }} />
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="text-sm font-semibold text-slate-700">{TITULOS[paso]} <span className="text-[10px] font-normal text-slate-500">· paso {idx + 1}/{PASOS.length}</span></div>

      {paso === 'alta' && (
        <div className={card}>
          {num(banco.nombre, (v) => setBanco({ ...banco, nombre: v }), 'Nombre (ej. BBVA débito)')}
          {num(banco.cuenta, (v) => setBanco({ ...banco, cuenta: v }), 'Cuenta contable (102-01-001)')}
          {etiquetaAgrupador(banco.cuenta) && <div className="text-[10px] text-slate-500">SAT Anexo 24 → {etiquetaAgrupador(banco.cuenta)}</div>}
          {num(banco.saldoInicial, (v) => setBanco({ ...banco, saldoInicial: v }), 'Saldo inicial (50000)')}
          {num(banco.clabe, (v) => setBanco({ ...banco, clabe: v }), 'CLABE 10/16/18 (o vacía)')}
          <div className="text-[10px] text-slate-500">Moneda MN/USD: no editable tras conciliar · fintech sin banco → General</div>
          {errBanco.length === 0 ? <div className="text-green-600">✓ Cuenta válida, lista para conciliar.</div> : errBanco.map((e, i) => <div key={i} className="text-red-600">• {e}</div>)}
        </div>
      )}

      {paso === 'convertidor' && (
        <div className={card}>
          <div className="text-slate-500">Sube el PDF → Excel. Revisa que coincida con la carátula al 100%.</div>
          {num(caratula.inicial, (v) => setCaratula({ ...caratula, inicial: v }), 'Saldo inicial')}
          {num(caratula.depositos, (v) => setCaratula({ ...caratula, depositos: v }), 'Depósitos')}
          {num(caratula.retiros, (v) => setCaratula({ ...caratula, retiros: v }), 'Retiros')}
          {num(caratula.final, (v) => setCaratula({ ...caratula, final: v }), 'Saldo final')}
          {errCaratula.length === 0 ? <div className="text-green-600">✓ Carátula 100% igual. Puedes cargar.</div> : errCaratula.map((e, i) => <div key={i} className="text-red-600">• {e}</div>)}
          <div className="text-[10px] text-slate-500">Banco no listado → Excel manual + avisa a soporte con el PDF.</div>
        </div>
      )}

      {paso === 'carga' && (
        <div data-tour="conciliacion-carga" className={card}>
          <div>Banco: <b>BBVA débito</b> (si lo subes en otro banco y concilias, hay que borrar y repetir).</div>
          {num(periodo.ini, (v) => setPeriodo({ ...periodo, ini: v }), 'Periodo inicio (13-may-2025 si hay corte distinto)')}
          {num(periodo.fin, (v) => setPeriodo({ ...periodo, fin: v }), 'Periodo fin (13-jun-2025)')}
          <div className="flex gap-2">
            <span className="status-badge status-info">azul = depósitos</span>
            <span className="status-badge status-error">rojo = retiros</span>
          </div>
        </div>
      )}

      {paso === 'manual' && (
        <div data-tour="conciliacion-manual" className={card}>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="data-table">
              <thead><tr><th>Movimiento</th><th>Descripción</th><th style={{ textAlign: 'right' }}>Monto</th><th style={{ textAlign: 'center' }}>Estado</th></tr></thead>
              <tbody>
                {MOVS_DEMO.map((m) => (
                  <tr key={m.id} onClick={() => setSelMov(m.id)} style={{ cursor: 'pointer', background: m.id === selMov ? '#eff6ff' : undefined }}>
                    <td style={{ fontFamily: 'monospace' }}>#{m.id}</td>
                    <td style={{ fontSize: 12 }}>{m.descripcion}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>${m.monto}</td>
                    <td style={{ textAlign: 'center' }}>{m.id === selMov ? <span className="status-badge status-info">Seleccionado</span> : <span className="status-badge status-pending">Pendiente</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>Sugerencia (monto + folio): <b>{sugerencias[0]?.folio}</b> por ${sugerencias[0]?.monto}</div>
          <div className="text-slate-500">Filtros: periodo, RFC, folio interno, folio fiscal, UUID, forma y método de pago.</div>
        </div>
      )}

      {paso === 'auto' && (
        <div className={`${card} space-y-1`}>
          <div>Algoritmo: casa monto + fecha + folio/RFC/folio fiscal.</div>
          <div className="font-semibold">12 movimientos → 10 automáticos, 2 a pendientes.</div>
          <div className="text-slate-500">Tip del video: agrega folio/RFC/folio fiscal en el Excel para que ate el 100%.</div>
        </div>
      )}

      {paso === 'casos' && (
        <div data-tour="conciliacion-casos" className={card}>
          <div className="flex flex-wrap gap-1">
            {CASOS.map((c) => (
              <button key={c.id} onClick={() => { setCasoId(c.id); setResultado(null); }} className={`px-2 py-1 rounded border ${c.id === casoId ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white'}`}>
                {c.titulo}
              </button>
            ))}
          </div>
          <div className="font-semibold">{caso.titulo}</div>
          <div className="text-slate-600">{caso.descripcion}</div>
          <div className="theory-box" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderLeft: '4px solid #f59e0b', padding: 12, borderRadius: 6, margin: '12px 0' }}><div className="theory-box-title">📚 Teoría</div><div className="theory-box-text">{caso.teoria}</div></div>
          <label className="block">
            Tu resolución (JSON)
            <input value={payload} onChange={(e) => setPayload(e.target.value)} placeholder='{"montoAplicado": 1219.6}' className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono" />
          </label>
          <button onClick={resolverCaso} className="btn btn-primary">Conciliar</button>
          {resultado && <div className="p-2 rounded bg-slate-50">{resultado}</div>}
        </div>
      )}

      {paso === 'cierre' && (
        <div data-tour="conciliacion-cierre" className={card}>
          {num(cierre.fechaPoliza, (v) => setCierre({ ...cierre, fechaPoliza: v }), 'Fecha póliza (= fecha movimiento)')}
          {num(cierre.fechaMovimiento, (v) => setCierre({ ...cierre, fechaMovimiento: v }), 'Fecha movimiento')}
          {num(cierre.contrapartida, (v) => setCierre({ ...cierre, contrapartida: v }), 'Contrapartida (≠ cuenta del banco)')}
          {cierre.contrapartida.startsWith('899')
            ? <div className="text-[10px] text-slate-500">Cuenta puente interna (transitoria, queda en ceros el mismo día — no se declara en Anexo 24)</div>
            : etiquetaAgrupador(cierre.contrapartida) && <div className="text-[10px] text-slate-500">SAT Anexo 24 → {etiquetaAgrupador(cierre.contrapartida)}</div>}
          {errCierre.length === 0 ? <><div className="text-green-600">✓ Cierre válido: bloquea edición, genera folios. Casilla revaluación para USD.</div><button onClick={() => reportarSim({ taskType: 'conciliacion_practica', title: 'Conciliación — cierre del periodo', score: 100, passed: true })} className="btn btn-primary">Registrar cierre</button></> : errCierre.map((e, i) => <div key={i} className="text-red-600">• {e}</div>)}
        </div>
      )}

      {/* Teoría: cuenta puente (mas.html: reference-box azul) */}
      <div className="reference-box" style={{ background: '#eff6ff', borderLeft: '4px solid #1e40af', padding: '8px 12px', borderRadius: 6, margin: '12px 0', fontSize: 11, color: '#1e40af', fontWeight: 500 }}>
        📚 <b>Traspasos SIEMPRE por cuenta puente 899/104.</b> Retiro: cargo a 899-04, abono a BBVA. Depósito: cargo a Santander, abono a 899-04. Queda en ceros el mismo día — directo a otro banco duplica la póliza.
      </div>

      <div className="flex justify-between">
        <button onClick={() => setPaso(PASOS[Math.max(0, idx - 1)])} className="btn btn-secondary">← Atrás</button>
        {idx < PASOS.length - 1 && <button onClick={() => setPaso(PASOS[idx + 1])} className="btn btn-primary">Siguiente →</button>}
      </div>
    </div>
  );
}
