// TASK-D1 — DIOTSim: recrea la pantalla y el flujo reales del modulo DIOT
// de Contalink (fuente: contex_Font/diot.html + goldens del video).
// 8 pantallas + 3 modos (tutorial/practica/examen) + 6 errores inyectables.
// TASK-P1: cascara Contalink (sidebar + hero + header de modo).
// Anti-desvio: sin SpreadsheetWidget/DualViewLayout, sin CDNs, sin numeros
// inventados (motor en ./diotEngine.ts). Cero LLM.
import { useEffect, useMemo, useState } from 'react';
import {
  TIPOS_OP,
  generarEscenario,
  validarOperacion,
  construirTXT,
  resolverTipoDeclaracion,
  describirPresentacion,
  puedePresentar,
  calificarPractica,
  calificarExamen,
  TOUR_TUTORIAL,
  ACUSE_FOLIO,
  type EscenarioDIOT,
  type ModoDIOT,
} from './diotEngine';

type Paso = 'modo' | 'metricas' | 'tabla' | 'campos' | 'descarga' | 'presentar' | 'revision' | 'certificado';

const PASOS: Paso[] = ['metricas', 'tabla', 'campos', 'descarga', 'presentar', 'revision', 'certificado'];

const TEORIA: Record<Exclude<Paso, 'modo'>, { titulo: string; cuerpo: string; ref: string }> = {
  metricas: {
    titulo: 'Panel de Métricas',
    cuerpo: 'Totales calculados automáticamente: operaciones, base gravable e IVA acreditable. El DIOT 2025+ usa 54 columnas (23 pre-2025).',
    ref: 'Modificación SAT 2025 · 54 columnas',
  },
  tabla: {
    titulo: 'Tabla de Operaciones',
    cuerpo: 'Cada fila es una factura o nota de crédito conciliada. El reporte toma la FECHA DE PAGO, no la de la factura: Dic-emitida/Ene-pagada va en Enero.',
    ref: 'Art. 32 CFF · Fecha de pago',
  },
  campos: {
    titulo: 'Campos Clave',
    cuerpo: 'RFC 13 caracteres, tipo 1-5 (1 Bienes, 2 Servicios, 3 Arrendamiento, 4 Fideicomisos, 5 Extranjeros), tasa y desglose acreditables.',
    ref: 'Anexo 1-A RMF',
  },
  descarga: {
    titulo: 'Descarga',
    cuerpo: 'TXT oficial SAT (pipe-separated, idéntico al enviado), Excel agrupado por RFC y a detalle.',
    ref: 'Portal SAT · Formato TXT DIOT',
  },
  presentar: {
    titulo: 'Presentar Declaración',
    cuerpo: 'Normal = primera del periodo; Complementaria = corrige. CASO nov-2025: si ya hay Normal en SAT, solo Complementaria.',
    ref: 'Art. 32 CFF · Tipos de declaración',
  },
  revision: {
    titulo: 'Revisión y Estados',
    cuerpo: 'Previa lista → Procesando → Éxito + acuse / Error. Reintento 1-2h, máx 5/día, no reenviar.',
    ref: 'Validación SAT · E01-E22',
  },
  certificado: {
    titulo: 'Certificado',
    cuerpo: 'Examen aprobado con 90+: competencia en presentación de DIOT.',
    ref: 'Evaluación · Nivel profesional',
  },
};

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

// TASK-P2: badge de Tipo en 5 colores (maqueta TIPOS_OP :527-533).
function badgeTipo(tipo: number): string {
  switch (tipo) {
    case 1: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 2: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 3: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 4: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    default: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }
}

export default function DIOTSim() {
  const [modo, setModo] = useState<ModoDIOT | null>(null);
  const [paso, setPaso] = useState<Paso>('modo');
  const [pilotoOk, setPilotoOk] = useState(() => localStorage.getItem('diot_piloto') === 'true');
  const [practicaOk, setPracticaOk] = useState(() => localStorage.getItem('diot_practica') === 'true');
  const [eliminados, setEliminados] = useState<number[]>([]);
  const [pistas, setPistas] = useState(0);
  const [pistaVisible, setPistaVisible] = useState<string | null>(null);
  const [selOp, setSelOp] = useState<number | null>(null);
  const [inicio, setInicio] = useState(0);
  const [segRest, setSegRest] = useState(300);
  const [enviado, setEnviado] = useState(false);
  const [tipoDecl, setTipoDecl] = useState<'Normal' | 'Complementaria'>('Normal');
  // P5: nov-2025 configurable en UI (Normal en SAT => solo Complementaria).
  const [tieneNormalSAT, setTieneNormalSAT] = useState(false);
  const [envio, setEnvio] = useState<'Previa' | 'Definitiva'>('Previa');
  const [conDatos, setConDatos] = useState(true);
  const [oscuro, setOscuro] = useState(false);
  // TASK-P3: tour guiado del tutorial (reemplaza el stepper libre).
  const [tour, setTour] = useState<number | null>(null);
  // TASK-P4: toasts 4s + hint-bubble 6s + auto-pistas 15s (maqueta :893-919, :1363-1371).
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; tipo: 'success' | 'error' | 'info' }>>([]);
  const [ultimaAccion, setUltimaAccion] = useState(0);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [modalModo, setModalModo] = useState<ModoDIOT | null>(null);
  const [duracion, setDuracion] = useState('');

  const esc: EscenarioDIOT = useMemo(() => {
    if (modo === 'practica') return generarEscenario('practica', 7);
    if (modo === 'examen') return generarEscenario('examen', 3);
    return generarEscenario('tutorial', 1);
  }, [modo]);

  const ops = useMemo(() => esc.operaciones.filter((o) => !eliminados.includes(o.id)), [esc, eliminados]);
  const base = ops.reduce((a, o) => a + Math.abs(o.monto), 0);
  const iva = ops.reduce((a, o) => a + o.iva, 0);
  const encontrados = eliminados.filter((id) => esc.errores.some((e) => e.operacionId === id)).length;
  const gate = puedePresentar(encontrados, esc.errores.length);

  useEffect(() => {
    if (modo !== 'examen' || paso === 'modo' || enviado) return;
    if (segRest <= 0) { finalizar(true); return; }
    const t = setTimeout(() => setSegRest((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segRest, modo, paso, enviado]);

  useEffect(() => {
    setTipoDecl(resolverTipoDeclaracion(tieneNormalSAT));
  }, [tieneNormalSAT]);

  function pushToast(msg: string, tipo: 'success' | 'error' | 'info' = 'info') {
    const id = Date.now() + Math.random();
    setToasts((xs) => [...xs, { id, msg, tipo }]);
    setTimeout(() => setToasts((xs) => xs.filter((x) => x.id !== id)), 4000);
  }

  function mostrarPista(texto: string) {
    setPistaVisible(texto);
    setTimeout(() => setPistaVisible((v) => (v === texto ? null : v)), 6000);
  }

  function solicitarModo(m: ModoDIOT) {
    if (m === 'examen' && (!pilotoOk || !practicaOk)) {
      pushToast('Completa Piloto y Práctica primero para desbloquear el Examen', 'error');
      return;
    }
    setModalModo(m);
  }

  function entrar(m: ModoDIOT) {
    setModalModo(null);
    setModo(m);
    setEliminados([]);
    setPistas(0);
    setPistaVisible(null);
    setSelOp(null);
    setEnviado(false);
    setSegRest(300);
    setInicio(Date.now());
    setUltimaAccion(Date.now());
    setToasts([]);
    if (m === 'tutorial') {
      setTour(0);
      setPaso(TOUR_TUTORIAL[0].paso);
    } else {
      setTour(null);
      setPaso('metricas');
      if (m === 'practica') pushToast('Práctica iniciada. Encuentra 2 errores en las operaciones.', 'info');
      if (m === 'examen') pushToast('Examen iniciado. Tienes 5 minutos. ¡Buena suerte!', 'info');
    }
  }

  function avanzarTour() {
    if (tour === null) return;
    if (tour >= TOUR_TUTORIAL.length - 1) {
      setTour(null);
      return;
    }
    const sig = tour + 1;
    setTour(sig);
    setPaso(TOUR_TUTORIAL[sig].paso);
  }

  // Resalta el ancla del paso del tour (scroll + anillo).
  useEffect(() => {
    if (tour === null) return;
    const el = document.getElementById(TOUR_TUTORIAL[tour].ancla);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    el.classList.add('ring-2', 'ring-blue-500', 'rounded-xl');
    return () => {
      el.classList.remove('ring-2', 'ring-blue-500', 'rounded-xl');
    };
  }, [tour, paso]);

  function eliminar(id: number) {
    setUltimaAccion(Date.now());
    const err = esc.errores.find((e) => e.operacionId === id);
    if (err) {
      // Fade 400ms antes de quitar la fila (maqueta eliminarOperacion).
      setEliminando(id);
      setTimeout(() => {
        setEliminados((xs) => [...xs, id]);
        setEliminando(null);
      }, 400);
      if (modo === 'practica') {
        pushToast(`✅ ¡Correcto! ${err.error}. ${err.pista}`, 'success');
      }
      // En examen: silencio (sin toast).
    } else {
      // Era correcta: shake 800ms + error solo en práctica.
      setShakeId(id);
      setTimeout(() => setShakeId((v) => (v === id ? null : v)), 800);
      if (modo === 'practica') {
        pushToast('❌ Esta operación era correcta. No deberías haberla eliminado.', 'error');
      }
    }
  }

  function pedirPista() {
    const pendiente = esc.errores[encontrados];
    if (!pendiente || pistas >= 3) return;
    setPistas((p) => p + 1);
    setUltimaAccion(Date.now());
    mostrarPista(pendiente.pista);
  }

  // Auto-pistas tras 15s inactivo en práctica, máx 3 (maqueta :1363-1371).
  useEffect(() => {
    if (modo !== 'practica' || enviado || paso === 'modo') return;
    const t = setInterval(() => {
      if (Date.now() - ultimaAccion > 15000 && pistas < 3) {
        const pendiente = esc.errores.find((e) => !eliminados.includes(e.operacionId));
        if (pendiente) {
          setPistas((p) => (p >= 3 ? p : p + 1));
          mostrarPista(pendiente.pista);
          setUltimaAccion(Date.now());
        }
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, enviado, paso, pistas, eliminados, ultimaAccion]);

  // TASK-P2: descarga real del TXT oficial (mismo motor, identico al enviado).
  function descargarTXT() {
    const txt = construirTXT(ops, esc.ejercicio);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIOT_${esc.periodo.replace(' ', '_')}_${esc.ejercicio < 2025 ? 23 : 54}col.txt`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarPista(`TXT ${esc.ejercicio < 2025 ? '23' : '54'} columnas descargado (idéntico al enviado).`);
  }

  function finalizar(tiempoAgotado = false) {
    setEnviado(true);
    const segs = Math.round((Date.now() - inicio) / 1000);
    setDuracion(`${Math.floor(segs / 60)}:${String(segs % 60).padStart(2, '0')}`);
    if (modo === 'practica') {
      const score = calificarPractica(segs, pistas);
      localStorage.setItem('diot_practica', 'true');
      localStorage.setItem('diot_practica_score', String(score));
      setPracticaOk(true);
    } else if (modo === 'examen') {
      const score = calificarExamen(encontrados, esc.errores.length, tiempoAgotado ? 0 : segRest);
      localStorage.setItem('diot_examen', 'true');
      localStorage.setItem('diot_examen_score', String(score));
    } else {
      localStorage.setItem('diot_piloto', 'true');
      setPilotoOk(true);
    }
    setPaso('certificado');
  }

  const scoreFinal =
    modo === 'practica'
      ? calificarPractica(Math.round((Date.now() - inicio) / 1000), pistas)
      : modo === 'examen'
        ? calificarExamen(encontrados, esc.errores.length, segRest)
        : 100;

  const enModo = paso === 'modo' || !modo;
  const vistaModo = enModo && (
    <div className="p-4 space-y-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">DIOT · Declaración Informativa de Operaciones con Terceros</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Periodo Enero 2026 · 54 columnas · Elige modo</p>
        <div className="grid gap-2">
          <button onClick={() => solicitarModo('tutorial')} className="text-left p-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40">
            <div className="font-semibold text-blue-800 dark:text-blue-200 text-sm">▶ Tutorial guiado {pilotoOk && '✓'}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">8 pasos sobre el reporte real. Solo observas.</div>
          </button>
          <button onClick={() => solicitarModo('practica')} className="text-left p-3 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40">
            <div className="font-semibold text-green-800 dark:text-green-200 text-sm">✋ Práctica {practicaOk && '✓'}</div>
            <div className="text-xs text-green-700 dark:text-green-300">8 operaciones, 2 errores inyectados. Elimínalos.</div>
          </button>
          <button
            onClick={() => solicitarModo('examen')}
            disabled={!pilotoOk || !practicaOk}
            className="text-left p-3 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:opacity-40"
          >
            <div className="font-semibold text-purple-800 dark:text-purple-200 text-sm">🏆 Examen {(!pilotoOk || !practicaOk) && '🔒'}</div>
            <div className="text-xs text-purple-700 dark:text-purple-300">12 operaciones, 4 errores, 5 minutos, sin pistas. Certificado con 90+.</div>
          </button>
        </div>
      </div>
  );

  const t = TEORIA[paso as Exclude<Paso, 'modo'>];
  const idx = PASOS.indexOf(paso);

  const vistaFlujo = !enModo && (
    <div className="p-4 space-y-3">
      <div id="spot-banner" className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">Reporte DIOT</span>
            <span className="px-2 py-1 bg-green-500/20 rounded text-xs font-medium">{esc.periodo}</span>
            <span className="px-2 py-1 bg-blue-500/20 rounded text-xs font-medium">54 columnas</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-bold mb-1">Declaración Informativa de Operaciones con Terceros</h1>
          <p id="empresaNombre" className="text-blue-100 text-xs sm:text-sm">{esc.empresa.nombre}</p>
        </div>
      </div>

      {tour === null && (
        <div className="flex gap-1">
          {PASOS.map((p, i) => (
            <button
              key={p}
              onClick={() => setPaso(p)}
              className={`flex-1 h-1.5 rounded-full ${i <= idx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              aria-label={p}
            />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3">
        <div className="font-semibold text-amber-900 dark:text-amber-200 text-sm">📚 {t.titulo}</div>
        <div className="text-xs text-amber-800 dark:text-amber-300">{t.cuerpo}</div>
        <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">{t.ref}</div>
      </div>

      {(paso === 'metricas' || paso === 'tabla') && (
        <div id="spot-stats" className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 text-lg">📄</div>
            <div id="statOps" className="text-xl font-bold text-slate-800 dark:text-white">{ops.length}</div>
            <div className="text-[10px] text-slate-500">Operaciones</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="w-9 h-9 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2 text-green-600 dark:text-green-400 text-lg">💲</div>
            <div id="statMonto" className="text-xl font-bold text-slate-800 dark:text-white">${(base / 1000).toFixed(0)}k</div>
            <div className="text-[10px] text-slate-500">Base gravable</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-2 text-amber-600 dark:text-amber-400 text-lg">⚖️</div>
            <div id="statIva" className="text-xl font-bold text-slate-800 dark:text-white">${(iva / 1000).toFixed(0)}k</div>
            <div className="text-[10px] text-slate-500">IVA acreditable</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2 text-purple-600 dark:text-purple-400 text-lg">✅</div>
            <div id="statEstado" className={`text-xl font-bold ${enviado || gate.ok ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}>
              {modo === 'tutorial' ? (enviado ? 'Listo' : 'Para revisar') : `${encontrados}/${esc.errores.length}`}
            </div>
            <div className="text-[10px] text-slate-500">{modo === 'tutorial' ? (enviado ? 'Declaración presentada' : 'Para revisar') : 'Errores hallados'}</div>
          </div>
        </div>
      )}

      {(paso === 'metricas' || paso === 'tabla' || paso === 'revision') && (
        <div id="spot-actions" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => mostrarPista('Excel agrupado por RFC generado del mismo motor (mismos totales).')} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium">📊 Excel agrupado</button>
            <button onClick={() => mostrarPista('Excel a detalle generado del mismo motor (todas las operaciones).')} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium">📄 Excel detalle</button>
            <button onClick={descargarTXT} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium">⬇ Descargar TXT</button>
          </div>
          <button onClick={() => setPaso('presentar')} className="px-4 py-2.5 bg-blue-700 text-white rounded-lg text-xs font-medium">➤ Presentar declaración</button>
        </div>
      )}
      {pistaVisible && paso === 'presentar' && (
        <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300 text-amber-800 dark:text-amber-200 text-xs">{pistaVisible}</div>
      )}

      {(paso === 'metricas' || paso === 'tabla' || paso === 'revision') && (
        <div id="spot-table" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Operaciones con terceros</h3>
            <p className="text-[10px] text-slate-500">Datos generados automáticamente. Revisa antes de enviar.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-1.5">Fecha pago</th>
                  <th className="px-2 py-1.5">RFC</th>
                  <th className="px-2 py-1.5">Nombre</th>
                  <th className="px-2 py-1.5">Tipo</th>
                  <th className="px-2 py-1.5 text-right">Monto</th>
                  <th className="px-2 py-1.5 text-right">IVA</th>
                  {(modo === 'practica' || modo === 'examen') && !enviado && <th className="px-2 py-1.5 text-center">Acción</th>}
                </tr>
              </thead>
              <tbody id="operationsBody">
                {ops.map((op) => {
                  // P5: validación final inline (maqueta :779-791): verde/rojo
                  // por fila en revisión, sin pantalla aparte.
                  const errs = validarOperacion({ ...op, monto: Math.abs(op.monto) });
                  const marcaRevision = paso === 'revision' ? (errs.length === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/30') : '';
                  return (
                    <tr
                      key={op.id}
                      onClick={() => setSelOp(op.id)}
                      style={eliminando === op.id ? { opacity: 0, transform: 'translateX(100px)', transition: 'all 0.4s ease' } : undefined}
                      className={`border-t border-slate-100 dark:border-slate-700 cursor-pointer ${marcaRevision} ${op.monto < 0 ? 'bg-red-50 dark:bg-red-900/20' : ''} ${selOp === op.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''} ${shakeId === op.id ? 'bg-red-100 dark:bg-red-900/40' : ''}`}
                    >
                      <td className="px-2 py-1.5 text-slate-500">{op.fecha}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px]">{op.rfc}</td>
                      <td className="px-2 py-1.5 max-w-[140px] truncate">{op.nombre}</td>
                      <td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] ${badgeTipo(op.tipo)}`}>{TIPOS_OP[op.tipo]}</span></td>
                      <td className={`px-2 py-1.5 text-right font-mono ${op.monto < 0 ? 'text-red-600 font-bold' : ''}`}>{fmt(Math.abs(op.monto))}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(op.iva)}</td>
                      {(modo === 'practica' || modo === 'examen') && !enviado && (
                        <td className="px-2 py-1.5 text-center">
                          <button onClick={(e) => { e.stopPropagation(); eliminar(op.id); }} className="px-2 py-0.5 text-red-600 border border-red-300 rounded text-[10px]" aria-label={`Eliminar ${op.id}`}>🗑</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td colSpan={4} className="px-2 py-1.5 font-semibold text-xs">TOTALES</td>
                  <td className="px-2 py-1.5 text-right font-bold font-mono text-xs">{fmt(base)}</td>
                  <td className="px-2 py-1.5 text-right font-bold font-mono text-xs">{fmt(iva)}</td>
                  {(modo === 'practica' || modo === 'examen') && !enviado && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
          {paso === 'revision' && (
            <div className="px-3 py-2 text-xs space-y-1">
              {ops.flatMap((op) => validarOperacion({ ...op, monto: Math.abs(op.monto) })).map((e, i) => (
                <div key={i} className="text-red-600 dark:text-red-400">• Op: {e}</div>
              ))}
              {ops.every((op) => validarOperacion({ ...op, monto: Math.abs(op.monto) }).length === 0) && (
                <div className="text-green-600 dark:text-green-400">✓ Todas las operaciones validan (RFC 13, montos positivos, IVA = tasa × monto).</div>
              )}
            </div>
          )}
        </div>
      )}

      {(paso === 'metricas' || paso === 'tabla') && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1 text-sm">¿Cómo se genera este reporte?</h4>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Se alimenta automáticamente de facturas de egresos, notas de crédito conciliadas y pólizas</li>
            <li>• Toma la fecha de pago/conciliación, no la fecha de la factura</li>
            <li>• Puedes cuadrarlo contra la Hoja de Trabajo para Impuestos</li>
          </ul>
        </div>
      )}

      {paso === 'campos' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
          {!selOp && <div className="text-slate-500">Toca una operación de la tabla (paso anterior) para ver sus campos clave.</div>}
          {selOp && (() => {
            const op = esc.operaciones.find((o) => o.id === selOp)!;
            return (
              <div>
                <div className="font-semibold text-slate-800 dark:text-white">{op.nombre}</div>
                <div>RFC: <span className="font-mono">{op.rfc}</span> · Folio: <span className="font-mono">{op.folio}</span></div>
                <div>Nacionalidad: {op.nacionalidad} · Contraparte: {op.tipoContraparte} · País: {op.pais}</div>
                <div>Tipo: {op.tipo} ({TIPOS_OP[op.tipo]}) · Tasa: {op.tasa}% · Origen: {op.origen}</div>
                <div>Base: {fmt(op.monto)} · IVA: {fmt(op.iva)} · Fecha de pago: {op.fecha}</div>
              </div>
            );
          })()}
        </div>
      )}

      {paso === 'descarga' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-2">
          <div className="font-semibold text-slate-800 dark:text-white">TXT oficial SAT · {esc.ejercicio < 2025 ? '23 columnas (pre-2025)' : '54 columnas (2025+, automático por ejercicio)'}</div>
          <pre className="bg-slate-900 text-green-300 p-2 rounded text-[9px] overflow-x-auto max-h-32 overflow-y-auto">
            {construirTXT(ops, esc.ejercicio).split('\n').slice(0, 3).join('\n')}{ops.length > 3 ? '\n…' : ''}
          </pre>
          <div className="text-slate-500">Excel agrupado por RFC y a detalle se generan del mismo motor (mismas operaciones, mismos totales).</div>
        </div>
      )}

      {paso === 'presentar' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={tieneNormalSAT} onChange={(e) => setTieneNormalSAT(e.target.checked)} />
            Ya hay Normal en el SAT (caso nov-2025 → solo Complementaria)
          </label>
          <div>Tipo: <b>{tipoDecl}</b> {tieneNormalSAT && '(ya hay Normal en SAT: solo Complementaria)'}</div>
          <div className="flex flex-wrap gap-2">
            <select value={envio} onChange={(e) => setEnvio(e.target.value as 'Previa' | 'Definitiva')} className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs">
              <option value="Previa">Con revisión previa</option>
              <option value="Definitiva">Definitivo</option>
            </select>
            <select value={conDatos ? 'datos' : 'ceros'} onChange={(e) => setConDatos(e.target.value === 'datos')} className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs">
              <option value="datos">Con datos</option>
              <option value="ceros">En ceros</option>
            </select>
          </div>
          <div className="text-slate-500">Combinación: {describirPresentacion({ tipo: tipoDecl, envio, conDatos })}</div>
          {(modo === 'practica' || modo === 'examen') && !gate.ok && (
            <div className="text-red-600 dark:text-red-400">⚠️ Aún faltan {gate.faltantes} error(es) por eliminar. No puedes presentar.</div>
          )}
          {modo === 'practica' && (
            <button onClick={pedirPista} disabled={pistas >= 3} className="px-3 py-1.5 border border-amber-400 text-amber-700 rounded text-xs disabled:opacity-40">
              💡 Pedir pista ({pistas}/3)
            </button>
          )}
          {pistaVisible && <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300 text-amber-800 dark:text-amber-200">{pistaVisible}</div>}
          <button id="btn-presentar" onClick={() => finalizar()}
            disabled={(modo !== 'tutorial' && !gate.ok) || enviado}
            className="w-full px-3 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-40"
          >
            Presentar declaración
          </button>
        </div>
      )}

      {paso === 'certificado' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center space-y-2">
          <div className="text-3xl font-bold text-slate-800 dark:text-white">
            {modo === 'tutorial' ? '✓' : `${scoreFinal}/100`}
          </div>
          <div className="text-xs text-slate-500">
            {modo === 'tutorial' && 'Tutorial completado. Abre el modal de cierre para continuar.'}
            {modo === 'practica' && `Práctica: ${encontrados}/${esc.errores.length} errores, ${pistas} pistas.`}
            {modo === 'examen' && `Examen: ${encontrados}/${esc.errores.length} errores.`}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => { setTour(null); const i = PASOS.indexOf(paso); setPaso(i > 0 ? PASOS[i - 1] : 'modo'); if (i === 0) setModo(null); }}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
        >
          ← Atrás
        </button>
        {paso !== 'certificado' && tour === null && (
          <button onClick={() => setPaso(PASOS[PASOS.indexOf(paso) + 1])} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs">
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );

  // TASK-P4: modal de inicio por modo (maqueta :410-441, :954-1035).
  const MODAL_INFO: Record<ModoDIOT, { fase: string; titulo: string; desc: string; btn: string; features: string[] }> = {
    tutorial: {
      fase: 'Fase 1 de 3', titulo: 'Modo Piloto Automático', desc: 'El sistema ejecutará el flujo completo. Tú solo observas y avanzas.', btn: 'Iniciar Modo Piloto',
      features: ['Observa el flujo con explicación teórica', 'Cada paso incluye referencias legales', '~5 minutos · 8 pasos guiados'],
    },
    practica: {
      fase: 'Fase 2 de 3', titulo: 'Modo Práctica', desc: 'Tú harás el flujo. Identifica y elimina los errores intencionales.', btn: 'Iniciar Modo Práctica',
      features: ['Encuentra 2 errores inyectados', 'Elimina con la papelera de cada fila', 'Pistas si te atascas (máx 3)'],
    },
    examen: {
      fase: 'Fase 3 de 3', titulo: 'Modo Examen', desc: 'Desafío final: 4 errores sutiles, 5 minutos, sin pistas.', btn: 'Iniciar Modo Examen',
      features: ['5 minutos límite', '4 errores sutiles', 'Certificado con 90/100'],
    },
  };
  const escModal = modalModo ? generarEscenario(modalModo, modalModo === 'tutorial' ? 1 : modalModo === 'practica' ? 7 : 3) : null;

  // TASK-P3: overlay del tour (maqueta :1077-1184). Reemplaza el stepper
  // libre mientras el tutorial está guiado.
  const pasoTour = tour !== null ? TOUR_TUTORIAL[tour] : null;

  const badgeModo =
    modo === 'practica'
      ? { texto: 'Practicando', clases: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' }
      : modo === 'examen'
        ? { texto: 'Examinando', clases: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' }
        : { texto: 'Observando', clases: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' };

  // TASK-P1: cascara Contalink (sidebar + header de modo, maqueta :211-286).
  return (
    <div className={`${oscuro ? 'dark' : ''} flex h-full overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200`}>
      <aside className="w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-bold text-slate-800 dark:text-white">contalink</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Simulador Educativo</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">Módulo DIOT</div>
          {(['tutorial', 'practica', 'examen'] as ModoDIOT[]).map((m) => {
            const locked = m === 'examen' && (!pilotoOk || !practicaOk);
            const done = m === 'tutorial' ? pilotoOk : m === 'practica' ? practicaOk : false;
            const label = m === 'tutorial' ? 'Modo Piloto' : m === 'practica' ? 'Modo Práctica' : 'Modo Examen';
            return (
              <button
                key={m}
                onClick={() => solicitarModo(m)}
                disabled={locked}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${modo === m ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : ''} ${locked ? 'opacity-40' : 'cursor-pointer'}`}
              >
                <span>{m === 'tutorial' ? '▶' : m === 'practica' ? '🎯' : '🏆'}</span>
                <span>{label}</span>
                {done && <span className="ml-auto text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">✓</span>}
                {locked && <span className="ml-auto text-xs">🔒</span>}
              </button>
            );
          })}
          <div className="px-4 py-2 mt-4 text-xs font-semibold text-slate-400 uppercase">Contabilidad</div>
          <div className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">📊 Dashboard</div>
          <div className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">📄 DIOT</div>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">AA</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Practicante</div>
            <div className="text-xs text-slate-500">Nivel 1</div>
          </div>
          <button onClick={() => setOscuro((o) => !o)} className="p-2 rounded-lg text-sm" aria-label="Cambiar tema">{oscuro ? '☀️' : '🌙'}</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="hidden sm:inline">Contabilidad</span>
            <span className="hidden sm:inline">/</span>
            <span className="hidden sm:inline">Reportes</span>
            <span className="hidden sm:inline">/</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400">DIOT{modo ? ` · Modo ${modo === 'tutorial' ? 'Piloto' : modo === 'practica' ? 'Práctica' : 'Examen'}` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg ${badgeModo.clases}`}>
              <span className="text-xs font-medium">{badgeModo.texto}</span>
            </div>
            {modo === 'examen' && !enModo && !enviado && (
              <div className={`px-2.5 py-1.5 border rounded-lg ${segRest < 60 ? 'bg-red-50 dark:bg-red-900/30 border-red-300' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200'}`}>
                <span className={`text-xs font-mono ${segRest < 60 ? 'text-red-700 dark:text-red-300 font-bold' : 'text-amber-700 dark:text-amber-300'}`}>
                  {Math.floor(segRest / 60)}:{String(segRest % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {enModo ? vistaModo : vistaFlujo}
        </div>
        {/* TASK-P4: toasts 4s (maqueta :893-900) */}
        <div className="absolute bottom-3 right-3 z-30 space-y-2 max-w-[320px]">
          {toasts.map((x) => (
            <div key={x.id} role="alert" className={`px-3 py-2 rounded-lg shadow-xl text-xs text-white ${x.tipo === 'success' ? 'bg-green-600' : x.tipo === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}>
              {x.msg}
            </div>
          ))}
        </div>
        {/* TASK-P4: hint-bubble 6s (maqueta :902-919) */}
        {pistaVisible && paso !== 'presentar' && (
          <div className="absolute bottom-20 right-3 z-20 max-w-[280px] rounded-xl p-3 bg-amber-50 dark:bg-amber-900 border-2 border-amber-500 shadow-xl">
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">💡 Pista</div>
            <div className="text-xs text-amber-800 dark:text-amber-300">{pistaVisible}</div>
          </div>
        )}
        {pasoTour && (
          <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600">
                  PASO {tour! + 1} / {TOUR_TUTORIAL.length}
                </span>
                <div className="flex gap-1">
                  {TOUR_TUTORIAL.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < tour! ? 'bg-green-500' : i === tour ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => setTour(null)} className="text-slate-400 text-xs p-1" aria-label="Saltar tour">✕</button>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-1 text-sm">{pasoTour.titulo}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{pasoTour.descripcion}</p>
            <div className="rounded-lg p-2.5 mb-2 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500">
              <div className="text-[10px] font-semibold text-amber-900 dark:text-amber-200 mb-0.5">📚 Teoría</div>
              <div className="text-xs text-amber-900 dark:text-amber-100">{pasoTour.teoria}</div>
            </div>
            <div className="rounded-lg p-2 mb-3 bg-blue-50 dark:bg-blue-900/30">
              <span className="text-[10px] text-blue-900 dark:text-blue-200 font-medium">📖 {pasoTour.referencia}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="text-[10px] text-slate-500">{Math.round((tour! / TOUR_TUTORIAL.length) * 100)}% completado</div>
              <div className="flex gap-2">
                <button onClick={() => setTour(null)} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 rounded-lg">Saltar</button>
                <button onClick={avanzarTour} className="px-4 py-1.5 text-xs bg-blue-700 text-white rounded-lg font-medium">
                  {tour === TOUR_TUTORIAL.length - 1 ? 'Finalizar ✓' : 'Siguiente →'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* TASK-P4: modal de inicio por modo (maqueta :410-441, :954-1035) */}
        {modalModo && escModal && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-40 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-full overflow-y-auto">
              <div className={`p-5 text-white ${modalModo === 'tutorial' ? 'bg-gradient-to-br from-blue-700 to-indigo-800' : modalModo === 'practica' ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-purple-600 to-indigo-700'}`}>
                <div className="text-xs uppercase tracking-wider opacity-80">{MODAL_INFO[modalModo].fase}</div>
                <h2 className="text-lg font-bold">{MODAL_INFO[modalModo].titulo}</h2>
                <p className="text-sm opacity-90">{MODAL_INFO[modalModo].desc}</p>
              </div>
              <div className="p-5 space-y-3">
                {MODAL_INFO[modalModo].features.map((f, i) => (
                  <div key={i} className="text-xs text-slate-600 dark:text-slate-300">• {f}</div>
                ))}
                <div className="rounded-lg p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div>Empresa: {escModal.empresa.nombre}</div>
                  <div>RFC: {escModal.empresa.rfc}</div>
                  <div>Periodo: {escModal.periodo}</div>
                  <div>Operaciones: {escModal.operaciones.length} | Errores: {escModal.errores.length}</div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button onClick={() => setModalModo(null)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 rounded-lg">Cancelar</button>
                <button onClick={() => entrar(modalModo)} className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium">{MODAL_INFO[modalModo].btn}</button>
              </div>
            </div>
          </div>
        )}
        {/* TASK-P4: modal de cierre (maqueta :443-502) */}
        {paso === 'certificado' && modo && enviado && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-40 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-full overflow-y-auto">
              <div className={`p-5 text-white ${modo === 'examen' && scoreFinal >= 90 ? 'bg-gradient-to-br from-amber-500 to-yellow-600' : modo === 'practica' ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-blue-700 to-indigo-800'}`}>
                <div className="text-xs uppercase tracking-wider opacity-80">¡Completado!</div>
                <h2 className="text-lg font-bold">
                  {modo === 'tutorial' ? 'Modo Piloto Finalizado' : modo === 'practica' ? 'Modo Práctica Completado' : 'Examen Completado'}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg p-3 text-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-xl font-bold">{modo === 'tutorial' ? '8/8' : `${encontrados}/${esc.errores.length}`}</div>
                    <div className="text-[10px] text-slate-500">{modo === 'tutorial' ? 'Pasos' : 'Errores'}</div>
                  </div>
                  <div className="rounded-lg p-3 text-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-xl font-bold">{duracion || '—'}</div>
                    <div className="text-[10px] text-slate-500">Tiempo</div>
                  </div>
                  <div className="rounded-lg p-3 text-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-xl font-bold text-green-600">{modo === 'tutorial' ? '✓' : `${scoreFinal}/100`}</div>
                    <div className="text-[10px] text-slate-500">Puntaje</div>
                  </div>
                </div>
                {modo === 'examen' && scoreFinal >= 90 && (
                  <div className="rounded-lg p-3 bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                    <div className="font-bold text-sm">🏆 ¡CERTIFICADO DIOT BÁSICO!</div>
                    <div className="text-xs">Has demostrado competencia en la presentación de DIOT</div>
                  </div>
                )}
                {(modo === 'tutorial' || modo === 'practica') && (
                  <div className="text-xs text-green-600 dark:text-green-400 text-center">✓ Declaración {tipoDecl} presentada · Acuse {ACUSE_FOLIO}</div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => modo && entrar(modo)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium">Repetir</button>
                  {modo === 'tutorial' && <button onClick={() => { setPaso('modo'); setModo(null); solicitarModo('practica'); }} className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium">Ir a Práctica</button>}
                  {modo === 'practica' && <button onClick={() => { setPaso('modo'); setModo(null); solicitarModo('examen'); }} className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium">Ir a Examen</button>}
                  {modo === 'examen' && <button onClick={() => { setPaso('modo'); setModo(null); }} className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium">Repetir</button>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
