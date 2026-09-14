// TASK-D2 — ConciliacionSim: recrea el flujo del webinar de Pedro Castillo
// (VTT conciliacion). 7 pantallas: Alta -> Convertidor -> Carga -> Manual ->
// Auto -> Casos -> Cierre. Sin SpreadsheetWidget, sin CDNs. Cero LLM.
import { useMemo, useState } from 'react';
import {
  validarAltaBanco,
  validarCaratula,
  sugerirPorMonto,
  aplicarCaso,
  validarCierre,
  CASOS,
} from './conciliacionEngine';

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
    setResultado(
      `${r.ok ? '✅' : '❌'} ${r.mensaje}` +
      (r.resto !== undefined ? ` · resto ${r.resto.toFixed(2)}` : '') +
      (r.aplicado !== undefined ? ` · aplicado ${r.aplicado.toFixed(2)}` : '') +
      (r.conciliados !== undefined ? ` · ${r.conciliados} auto, ${r.pendientes} pendientes` : ''),
    );
  }

  const idx = PASOS.indexOf(paso);
  const num = (v: string, set: (s: string) => void, label: string) => (
    <label className="block text-xs text-slate-600 dark:text-slate-300">
      {label}
      <input value={v} onChange={(e) => set(e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
    </label>
  );

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Conciliación bancaria · BBVA débito</h2>
      <div className="flex gap-1">
        {PASOS.map((p, i) => (
          <button key={p} onClick={() => setPaso(p)} className={`flex-1 h-1.5 rounded-full ${i <= idx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} aria-label={TITULOS[p]} />
        ))}
      </div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{TITULOS[paso]}</div>

      {paso === 'alta' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          {num(banco.nombre, (v) => setBanco({ ...banco, nombre: v }), 'Nombre (ej. BBVA débito)')}
          {num(banco.cuenta, (v) => setBanco({ ...banco, cuenta: v }), 'Cuenta contable (102-01-001)')}
          {num(banco.saldoInicial, (v) => setBanco({ ...banco, saldoInicial: v }), 'Saldo inicial (50000)')}
          {num(banco.clabe, (v) => setBanco({ ...banco, clabe: v }), 'CLABE 10/16/18 (o vacía)')}
          <div className="text-[10px] text-slate-500">Moneda MN/USD: no editable tras conciliar · fintech sin banco → General</div>
          {errBanco.length === 0 ? <div className="text-xs text-green-600">✓ Cuenta válida, lista para conciliar.</div> : errBanco.map((e, i) => <div key={i} className="text-xs text-red-600">• {e}</div>)}
        </div>
      )}

      {paso === 'convertidor' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          <div className="text-xs text-slate-500">Sube el PDF → Excel. Revisa que coincida con la carátula al 100%.</div>
          {num(caratula.inicial, (v) => setCaratula({ ...caratula, inicial: v }), 'Saldo inicial')}
          {num(caratula.depositos, (v) => setCaratula({ ...caratula, depositos: v }), 'Depósitos')}
          {num(caratula.retiros, (v) => setCaratula({ ...caratula, retiros: v }), 'Retiros')}
          {num(caratula.final, (v) => setCaratula({ ...caratula, final: v }), 'Saldo final')}
          {errCaratula.length === 0 ? <div className="text-xs text-green-600">✓ Carátula 100% igual. Puedes cargar.</div> : errCaratula.map((e, i) => <div key={i} className="text-xs text-red-600">• {e}</div>)}
          <div className="text-[10px] text-slate-500">Banco no listado → Excel manual + avisa a soporte con el PDF.</div>
        </div>
      )}

      {paso === 'carga' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs">
          <div>Banco: <b>BBVA débito</b> (si lo subes en otro banco y concilias, hay que borrar y repetir).</div>
          {num(periodo.ini, (v) => setPeriodo({ ...periodo, ini: v }), 'Periodo inicio (13-may-2025 si hay corte distinto)')}
          {num(periodo.fin, (v) => setPeriodo({ ...periodo, fin: v }), 'Periodo fin (13-jun-2025)')}
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">azul = depósitos</span>
            <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">rojo = retiros</span>
          </div>
        </div>
      )}

      {paso === 'manual' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs">
          <div className="flex gap-1">
            {MOVS_DEMO.map((m) => (
              <button key={m.id} onClick={() => setSelMov(m.id)} className={`px-2 py-1 rounded border ${m.id === selMov ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'}`}>
                ${m.monto} · {m.descripcion}
              </button>
            ))}
          </div>
          <div>Sugerencia (monto + folio): <b>{sugerencias[0]?.folio}</b> por ${sugerencias[0]?.monto}</div>
          <div className="text-slate-500">Filtros: periodo, RFC, folio interno, folio fiscal, UUID, forma y método de pago.</div>
        </div>
      )}

      {paso === 'auto' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
          <div>Algoritmo: casa monto + fecha + folio/RFC/folio fiscal.</div>
          <div className="font-semibold">12 movimientos → 10 automáticos, 2 a pendientes.</div>
          <div className="text-slate-500">Tip del video: agrega folio/RFC/folio fiscal en el Excel para que ate el 100%.</div>
        </div>
      )}

      {paso === 'casos' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs">
          <div className="flex flex-wrap gap-1">
            {CASOS.map((c) => (
              <button key={c.id} onClick={() => { setCasoId(c.id); setResultado(null); }} className={`px-2 py-1 rounded border ${c.id === casoId ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'}`}>
                {c.titulo}
              </button>
            ))}
          </div>
          <div className="font-semibold">{caso.titulo}</div>
          <div className="text-slate-600 dark:text-slate-300">{caso.descripcion}</div>
          <div className="text-amber-700 dark:text-amber-300">📚 {caso.teoria}</div>
          <label className="block">
            Tu resolución (JSON)
            <input value={payload} onChange={(e) => setPayload(e.target.value)} placeholder='{"montoAplicado": 1219.6}' className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs" />
          </label>
          <button onClick={resolverCaso} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs">Conciliar</button>
          {resultado && <div className="p-2 rounded bg-slate-50 dark:bg-slate-900">{resultado}</div>}
        </div>
      )}

      {paso === 'cierre' && (
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs">
          {num(cierre.fechaPoliza, (v) => setCierre({ ...cierre, fechaPoliza: v }), 'Fecha póliza (= fecha movimiento)')}
          {num(cierre.fechaMovimiento, (v) => setCierre({ ...cierre, fechaMovimiento: v }), 'Fecha movimiento')}
          {num(cierre.contrapartida, (v) => setCierre({ ...cierre, contrapartida: v }), 'Contrapartida (≠ cuenta del banco)')}
          {errCierre.length === 0 ? <div className="text-green-600">✓ Cierre válido: bloquea edición, genera folios. Casilla revaluación para USD.</div> : errCierre.map((e, i) => <div key={i} className="text-red-600">• {e}</div>)}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={() => setPaso(PASOS[Math.max(0, idx - 1)])} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs">← Atrás</button>
        {idx < PASOS.length - 1 && <button onClick={() => setPaso(PASOS[idx + 1])} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs">Siguiente →</button>}
      </div>
    </div>
  );
}
