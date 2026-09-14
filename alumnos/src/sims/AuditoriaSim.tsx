// TASK-D3 — AuditoriaSim: flujo de auditoria cobrado/pagado de la directora +
// Pedro (VTT auditoria). 12 pantallas con goldens internos. Cero LLM.
import { useMemo, useState } from 'react';
import {
  GOLDENS,
  validarModulo,
  validarHoja,
  cuadrar,
  validarSAT,
  polizaCierre,
  resolverCasoABC,
  opcionesCasoABC,
  type Modulo,
  type CasoABC,
} from './auditoriaEngine';

type Paso = 'portada' | 'selector' | 'cobrado' | 'deducible' | 'diot' | 'hoja' | 'ivaisr' | 'cuadre' | 'portal' | 'poliza' | 'casos' | 'certificado';
const PASOS: Paso[] = ['portada', 'selector', 'cobrado', 'deducible', 'diot', 'hoja', 'ivaisr', 'cuadre', 'portal', 'poliza', 'casos', 'certificado'];
const TITULOS: Record<Paso, string> = {
  portada: 'Auditoría cobrado / pagado',
  selector: 'Selector de modalidad M1/M2/M3',
  cobrado: 'Detalle de cobros por factura',
  deducible: 'Deducibilidad',
  diot: 'Base DIOT 16%',
  hoja: 'Hoja de trabajo',
  ivaisr: 'IVA / ISR cobrado vs pagado',
  cuadre: 'Cuadre + balanza',
  portal: 'Portal SAT',
  poliza: 'Póliza de cierre',
  casos: 'Casos a / b / c',
  certificado: 'Cierre',
};

export default function AuditoriaSim() {
  const [paso, setPaso] = useState<Paso>('portada');
  const [modulo, setModulo] = useState<Modulo>('M2');
  const [hoja, setHoja] = useState({ ingresos: '10000', ivaTrasladado: '1600', egresos: '2787.88', ivaPagado: '424.22', parcial: '2507', factorParcial: '0.6', coeficiente: '0.32', prorrateo: '0.5' });
  const [sat, setSat] = useState({ ingresos: '10000', compras: '2714', iva: '434', pueIng: '1', ppdIng: '7', pueComp: '7', noDeducibles: '3', isr: '464', retIsr: '1000' });
  const [poliza, setPoliza] = useState({ trasladado: '1600', retenido: '1066.67', acreditable: '2567.56', porPagar: '99.11' });
  const [caso, setCaso] = useState<CasoABC>('a');
  const [accion, setAccion] = useState('');
  const [resCaso, setResCaso] = useState<string | null>(null);

  const mod = validarModulo(modulo);
  const errHoja = useMemo(
    () => validarHoja({ ingresos: Number(hoja.ingresos), ivaTrasladado: Number(hoja.ivaTrasladado), egresos: Number(hoja.egresos), ivaPagado: Number(hoja.ivaPagado), parcial: Number(hoja.parcial), factorParcial: Number(hoja.factorParcial), coeficiente: Number(hoja.coeficiente), prorrateo: Number(hoja.prorrateo) }),
    [hoja],
  );
  const errSat = useMemo(
    () => validarSAT({ ingresos: Number(sat.ingresos), compras: Number(sat.compras), iva: Number(sat.iva), pueIng: Number(sat.pueIng), ppdIng: Number(sat.ppdIng), pueComp: Number(sat.pueComp), noDeducibles: Number(sat.noDeducibles), isr: Number(sat.isr), retIsr: Number(sat.retIsr) }),
    [sat],
  );
  const errPoliza = useMemo(
    () => polizaCierre({ trasladado: Number(poliza.trasladado), retenido: Number(poliza.retenido), acreditable: Number(poliza.acreditable), porPagar: Number(poliza.porPagar) }),
    [poliza],
  );
  const errCuadre = useMemo(() => cuadrar({ diot: GOLDENS.diotBase16, hoja: GOLDENS.diotBase16, reporte: GOLDENS.diotBase16 }), []);

  const idx = PASOS.indexOf(paso);
  const num = (v: string, set: (s: string) => void, label: string) => (
    <label className="block text-xs text-slate-600 dark:text-slate-300">
      {label}
      <input value={v} onChange={(e) => set(e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
    </label>
  );
  const lista = (errs: string[], okMsg: string) =>
    errs.length === 0 ? <div className="text-xs text-green-600">✓ {okMsg}</div> : errs.map((e, i) => <div key={i} className="text-xs text-red-600">• {e}</div>);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Auditoría cobrado / pagado</h2>
      <div className="flex gap-0.5">
        {PASOS.map((p, i) => (
          <button key={p} onClick={() => setPaso(p)} className={`flex-1 h-1.5 rounded-full ${i <= idx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} aria-label={TITULOS[p]} />
        ))}
      </div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{TITULOS[paso]}</div>

      {paso === 'portada' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
          <div>Audita lo cobrado y pagado antes de llenar el SAT: DIOT = hoja = reporte.</div>
          <div className="text-slate-500">3 vías: Detalle de Cobros por factura · grid PUE/PPD/canceladas/sin complemento · Tesorería → Conciliación. Conciliar = cobrar/pagar.</div>
        </div>
      )}

      {paso === 'selector' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-2">
          <div className="flex gap-1">
            {(['M1', 'M2', 'M3'] as Modulo[]).map((m) => (
              <button key={m} onClick={() => setModulo(m)} className={`px-3 py-1.5 rounded border ${m === modulo ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'}`}>{m}</button>
            ))}
          </div>
          {mod.bloqueado ? <div className="text-red-600">⛔ {mod.aviso}</div> : <div className="text-green-600">✓ {modulo} con DIOT habilitado.</div>}
          <div className="text-slate-500">M1 = solo CFDIs. Cambio en Configuración → Contabilidad → Automatización.</div>
        </div>
      )}

      {paso === 'cobrado' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
          <div>Filtros: pagadas / no pagadas + PUE / PPD / canceladas / sin complemento.</div>
          <div>Cheque <b>Documentos no contabilizados</b> antes de cerrar.</div>
          <div className="text-slate-500">Tesorería → Conciliación es la tercera vía: lo conciliado es lo cobrado/pagado.</div>
        </div>
      )}

      {paso === 'deducible' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
          <div>7 PUE de compras: 3 al 0% (caso Héctor Daniel RESICO) + 1 viático 8%.</div>
          <div>Reasigna cuenta si no deduce; bloqueo si ya hay póliza.</div>
          <div className="text-slate-500">No deducibles del SAT: {GOLDENS.noDeducibles}.</div>
        </div>
      )}

      {paso === 'diot' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
          <div className="text-2xl font-bold">Base 16% = {GOLDENS.diotBase16}</div>
          <div className="text-slate-500">Informativas incluidas. De aquí sale la DIOT del periodo.</div>
        </div>
      )}

      {paso === 'hoja' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          {num(hoja.ingresos, (v) => setHoja({ ...hoja, ingresos: v }), 'Ingresos (10000)')}
          {num(hoja.ivaTrasladado, (v) => setHoja({ ...hoja, ivaTrasladado: v }), 'IVA trasladado (1600)')}
          {num(hoja.egresos, (v) => setHoja({ ...hoja, egresos: v }), 'Egresos (2787.88)')}
          {num(hoja.ivaPagado, (v) => setHoja({ ...hoja, ivaPagado: v }), 'IVA pagado (424.22)')}
          {num(hoja.parcial, (v) => setHoja({ ...hoja, parcial: v }), 'Parcial (2507 al 60%)')}
          {num(hoja.coeficiente, (v) => setHoja({ ...hoja, coeficiente: v }), 'Coeficiente mensual (0.32)')}
          {num(hoja.prorrateo, (v) => setHoja({ ...hoja, prorrateo: v }), 'Prorrateo (50%)')}
          {lista(errHoja, 'Hoja válida.')}
        </div>
      )}

      {paso === 'ivaisr' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
          <div>CFDIs vs cobrado/pagado. IVA a cargo: <b>{GOLDENS.ivaACargo}</b>.</div>
          <div>Links azules = drill-down a cada documento.</div>
          <div>Retenciones en cuenta <b>113</b> (IVA retenido cobrado + ISR retenido).</div>
        </div>
      )}

      {paso === 'cuadre' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
          {lista(errCuadre, `DIOT = hoja = reporte (${GOLDENS.diotBase16}). Trasladado ${GOLDENS.ivaTrasladado}; 464 = 464 → 0.`)}
        </div>
      )}

      {paso === 'portal' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          {num(sat.ingresos, (v) => setSat({ ...sat, ingresos: v }), 'Ingresos (10000)')}
          {num(sat.compras, (v) => setSat({ ...sat, compras: v }), 'Compras (2714)')}
          {num(sat.iva, (v) => setSat({ ...sat, iva: v }), 'IVA (434 ±1)')}
          {num(sat.pueIng, (v) => setSat({ ...sat, pueIng: v }), 'PUE ing (1)')}
          {num(sat.ppdIng, (v) => setSat({ ...sat, ppdIng: v }), 'PPD ing (7)')}
          {num(sat.pueComp, (v) => setSat({ ...sat, pueComp: v }), 'PUE comp (7)')}
          {num(sat.noDeducibles, (v) => setSat({ ...sat, noDeducibles: v }), 'No deducibles (3)')}
          {num(sat.isr, (v) => setSat({ ...sat, isr: v }), 'ISR (464)')}
          {num(sat.retIsr, (v) => setSat({ ...sat, retIsr: v }), 'Ret. ISR (1000 → a favor)')}
          {lista(errSat, `SAT válido. IVA retenido ${GOLDENS.ivaRetenido}; neto ${GOLDENS.neto} (${GOLDENS.netoRecargos} con recargos).`)}
          <div className="text-[10px] text-slate-500">Efectivo no precargado: se edita a mano.</div>
        </div>
      )}

      {paso === 'poliza' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          {num(poliza.trasladado, (v) => setPoliza({ ...poliza, trasladado: v }), 'Trasladado (1600)')}
          {num(poliza.retenido, (v) => setPoliza({ ...poliza, retenido: v }), 'Retenido (1066.67)')}
          {num(poliza.acreditable, (v) => setPoliza({ ...poliza, acreditable: v }), 'Acreditable')}
          {num(poliza.porPagar, (v) => setPoliza({ ...poliza, porPagar: v }), 'IVA por pagar (99.11/132)')}
          {lista(errPoliza, 'Póliza cuadra: débitos = créditos.')}
        </div>
      )}

      {paso === 'casos' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs">
          <div className="flex gap-1">
            {(['a', 'b', 'c'] as CasoABC[]).map((c) => (
              <button key={c} onClick={() => { setCaso(c); setAccion(''); setResCaso(null); }} className={`px-2 py-1 rounded border ${c === caso ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'}`}>
                Caso {c.toUpperCase()}
              </button>
            ))}
          </div>
          <select value={accion} onChange={(e) => setAccion(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs">
            <option value="">Elige salida…</option>
            {opcionesCasoABC(caso).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <button onClick={() => setResCaso(resolverCasoABC(caso, accion).mensaje)} disabled={!accion} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs disabled:opacity-40">Resolver</button>
          {resCaso && <div className="p-2 rounded bg-slate-50 dark:bg-slate-900">{resCaso}</div>}
        </div>
      )}

      {paso === 'certificado' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center text-xs space-y-1">
          <div className="text-2xl">✓</div>
          <div>Auditoría cerrada: DIOT, hoja, reporte y SAT cuadran.</div>
          <div className="text-slate-500">Neto {GOLDENS.neto} ({GOLDENS.netoRecargos} con recargos) · Póliza de ajuste_cancelación de cuentas vivas lista.</div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={() => setPaso(PASOS[Math.max(0, idx - 1)])} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs">← Atrás</button>
        {idx < PASOS.length - 1 && <button onClick={() => setPaso(PASOS[idx + 1])} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs">Siguiente →</button>}
      </div>
    </div>
  );
}
