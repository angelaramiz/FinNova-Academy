// TASK-D1 — DIOTSim (DEPRECADO como vista: la implementación viva es
// alumnos/public/sims/diot.html embebido vía ContalinkFrame; este archivo
// queda solo como referencia del flujo y NO se importa en prod).
// 8 pantallas + 3 modos (tutorial/practica/examen) + 6 errores inyectables.
// Anti-desvio: sin SpreadsheetWidget/DualViewLayout, sin CDNs, sin numeros
// inventados (motor en ./diotEngine.ts). Cero LLM.
import { useEffect, useMemo, useState } from 'react';
import {
  TIPOS_OP,
  generarEscenario,
  validarOperacion,
  construirTXT,
  resolverTipoDeclaracion,
  puedePresentar,
  calificarPractica,
  calificarExamen,
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
  const [tieneNormalSAT] = useState(false); // CASO nov-2025: cambiar a true => solo Complementaria

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

  function entrar(m: ModoDIOT) {
    if (m === 'examen' && (!pilotoOk || !practicaOk)) return;
    setModo(m);
    setPaso('metricas');
    setEliminados([]);
    setPistas(0);
    setPistaVisible(null);
    setSelOp(null);
    setEnviado(false);
    setSegRest(300);
    setInicio(Date.now());
  }

  function eliminar(id: number) {
    const err = esc.errores.find((e) => e.operacionId === id);
    if (err) {
      setEliminados((xs) => [...xs, id]);
    } else {
      setPistaVisible('Esa operación era correcta. No debiste eliminarla.');
    }
  }

  function pedirPista() {
    const pendiente = esc.errores[encontrados];
    if (!pendiente || pistas >= 3) return;
    setPistas((p) => p + 1);
    setPistaVisible(pendiente.pista);
  }

  function finalizar(tiempoAgotado = false) {
    setEnviado(true);
    const segs = Math.round((Date.now() - inicio) / 1000);
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

  if (paso === 'modo' || !modo) {
    return (
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">DIOT · Declaración Informativa de Operaciones con Terceros</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Periodo Enero 2026 · 54 columnas · Elige modo</p>
        <div className="grid gap-2">
          <button onClick={() => entrar('tutorial')} className="text-left p-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40">
            <div className="font-semibold text-blue-800 dark:text-blue-200 text-sm">▶ Tutorial guiado {pilotoOk && '✓'}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">8 pasos sobre el reporte real. Solo observas.</div>
          </button>
          <button onClick={() => entrar('practica')} className="text-left p-3 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40">
            <div className="font-semibold text-green-800 dark:text-green-200 text-sm">✋ Práctica {practicaOk && '✓'}</div>
            <div className="text-xs text-green-700 dark:text-green-300">8 operaciones, 2 errores inyectados. Elimínalos.</div>
          </button>
          <button
            onClick={() => entrar('examen')}
            disabled={!pilotoOk || !practicaOk}
            className="text-left p-3 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:opacity-40"
          >
            <div className="font-semibold text-purple-800 dark:text-purple-200 text-sm">🏆 Examen {(!pilotoOk || !practicaOk) && '🔒'}</div>
            <div className="text-xs text-purple-700 dark:text-purple-300">12 operaciones, 4 errores, 5 minutos, sin pistas. Certificado con 90+.</div>
          </button>
        </div>
      </div>
    );
  }

  const t = TEORIA[paso as Exclude<Paso, 'modo'>];
  const idx = PASOS.indexOf(paso);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">Reporte DIOT</span>{' '}
          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium">{esc.periodo}</span>{' '}
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium">54 columnas</span>
        </div>
        {modo === 'examen' && !enviado && (
          <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 rounded text-xs font-mono text-amber-700 dark:text-amber-300">
            {Math.floor(segRest / 60)}:{String(segRest % 60).padStart(2, '0')}
          </div>
        )}
      </div>

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

      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3">
        <div className="font-semibold text-amber-900 dark:text-amber-200 text-sm">📚 {t.titulo}</div>
        <div className="text-xs text-amber-800 dark:text-amber-300">{t.cuerpo}</div>
        <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">{t.ref}</div>
      </div>

      {(paso === 'metricas' || paso === 'tabla') && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="text-xl font-bold text-slate-800 dark:text-white">{ops.length}</div>
            <div className="text-[10px] text-slate-500">Operaciones</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="text-xl font-bold text-slate-800 dark:text-white">${(base / 1000).toFixed(0)}k</div>
            <div className="text-[10px] text-slate-500">Base gravable</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="text-xl font-bold text-slate-800 dark:text-white">${(iva / 1000).toFixed(0)}k</div>
            <div className="text-[10px] text-slate-500">IVA acreditable</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {modo === 'tutorial' ? 'Listo' : `${encontrados}/${esc.errores.length}`}
            </div>
            <div className="text-[10px] text-slate-500">{modo === 'tutorial' ? 'Para revisar' : 'Errores hallados'}</div>
          </div>
        </div>
      )}

      {(paso === 'tabla' || paso === 'revision') && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 font-semibold text-sm text-slate-800 dark:text-white">
            Operaciones con terceros
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
              <tbody>
                {ops.map((op) => {
                  const errs = validarOperacion({ ...op, monto: Math.abs(op.monto) });
                  return (
                    <tr
                      key={op.id}
                      onClick={() => setSelOp(op.id)}
                      className={`border-t border-slate-100 dark:border-slate-700 cursor-pointer ${op.monto < 0 ? 'bg-red-50 dark:bg-red-900/20' : ''} ${selOp === op.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                    >
                      <td className="px-2 py-1.5 text-slate-500">{op.fecha}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px]">{op.rfc}</td>
                      <td className="px-2 py-1.5 max-w-[140px] truncate">{op.nombre}</td>
                      <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{TIPOS_OP[op.tipo]}</span></td>
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
          <div>Tipo: <b>{tipoDecl}</b> {tieneNormalSAT && '(ya hay Normal en SAT: solo Complementaria)'}</div>
          <div>Envío: Previa / Definitiva · Datos: Con datos / En ceros</div>
          {(modo === 'practica' || modo === 'examen') && !gate.ok && (
            <div className="text-red-600 dark:text-red-400">⚠️ Aún faltan {gate.faltantes} error(es) por eliminar. No puedes presentar.</div>
          )}
          {modo === 'practica' && (
            <button onClick={pedirPista} disabled={pistas >= 3} className="px-3 py-1.5 border border-amber-400 text-amber-700 rounded text-xs disabled:opacity-40">
              💡 Pedir pista ({pistas}/3)
            </button>
          )}
          {pistaVisible && <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300 text-amber-800 dark:text-amber-200">{pistaVisible}</div>}
          <button
            onClick={() => finalizar()}
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
            {modo === 'tutorial' && 'Tutorial completado. Ahora practica con datos diferentes.'}
            {modo === 'practica' && `Práctica: ${encontrados}/${esc.errores.length} errores, ${pistas} pistas.`}
            {modo === 'examen' && `Examen: ${encontrados}/${esc.errores.length} errores.`}
          </div>
          {modo === 'examen' && scoreFinal >= 90 && (
            <div className="rounded-lg p-3 bg-gradient-to-br from-amber-400 to-amber-600 text-white">
              <div className="font-bold text-sm">🏆 ¡CERTIFICADO DIOT BÁSICO!</div>
              <div className="text-xs">Competencia en presentación de DIOT · Folio {ACUSE_FOLIO}</div>
            </div>
          )}
          {(modo === 'tutorial' || modo === 'practica' || (modo === 'examen' && enviado)) && enviado && modo !== 'examen' && (
            <div className="text-xs text-green-600 dark:text-green-400">✓ Declaración {tipoDecl} presentada · Acuse {ACUSE_FOLIO}</div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => { const i = PASOS.indexOf(paso); setPaso(i > 0 ? PASOS[i - 1] : 'modo'); if (i === 0) setModo(null); }}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
        >
          ← Atrás
        </button>
        {paso !== 'certificado' && (
          <button onClick={() => setPaso(PASOS[PASOS.indexOf(paso) + 1])} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs">
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}
