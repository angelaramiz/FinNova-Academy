import { useMemo, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES } from './DBTSim'; // fuentes reales del pipeline
import { DAG_TASKS } from './AirflowSim'; // tareas reales del DAG

interface ApiClientSimProps { theme: Theme; onBack: () => void; }

type Method = 'GET' | 'POST';

interface ApiResponse { status: number; statusText: string; ms: number; contentType: string; body: any; headers: Array<[string, string]>; }

interface HistoryItem { id: number; method: Method; path: string; status: number; ms: number; }

// ─── Endpoints simulados (fuentes reales del pipeline) ─────────

function registerEndpoints(path: string, method: Method): ApiResponse | null {
  const ms = 180 + Math.floor(Math.random() * 340);
  if (method === 'GET' && path === '/api/ventas') {
    return {
      status: 200, statusText: 'OK', ms, contentType: 'application/json',
      body: { ok: true, count: SOURCES.raw_ventas.rows.length, data: SOURCES.raw_ventas.rows },
      headers: [['content-type', 'application/json'], ['x-trace-id', 'lno-' + Math.random().toString(36).slice(2, 10)], ['cache-control', 'no-store']],
    };
  }
  if (method === 'GET' && /^\/api\/ventas\/\d+$/.test(path)) {
    const id = Number(path.split('/').pop());
    const row = SOURCES.raw_ventas.rows.find(r => r.id === id);
    if (row) return { status: 200, statusText: 'OK', ms, contentType: 'application/json', body: { ok: true, data: row }, headers: [['content-type', 'application/json'], ['x-trace-id', 'lno-' + Math.random().toString(36).slice(2, 10)]] };
    return { status: 404, statusText: 'Not Found', ms, contentType: 'application/json', body: { ok: false, error: `venta ${id} no existe en raw_ventas` }, headers: [['content-type', 'application/json']] };
  }
  if (method === 'GET' && path === '/api/estado/pipeline') {
    return {
      status: 200, statusText: 'OK', ms, contentType: 'application/json',
      body: { dag: 'lno_sales_pipeline', state: DAG_TASKS.length > 0 ? 'success' : 'failed', tasks: DAG_TASKS.map(t => ({ task: t.label, state: 'success', duration: t.duration })) },
      headers: [['content-type', 'application/json'], ['x-airflow-run', 'scheduled_2026-07-05T08:00']],
    };
  }
  if (method === 'POST' && path === '/api/ingesta/ventas') {
    return {
      status: 201, statusText: 'Created', ms: 420, contentType: 'application/json',
      body: { ok: true, inserted: 8, table: 'raw_ventas', message: 'batch recibido y persistido en S3 lno-raw-ventas' },
      headers: [['content-type', 'application/json'], ['x-trace-id', 'lno-ing-' + Math.random().toString(36).slice(2, 8)]],
    };
  }
  if (method === 'GET' && path === '/api/ventas?fecha=2026-07-05') {
    const rows = SOURCES.raw_ventas.rows.filter(r => r.fecha === '2026-07-05');
    return { status: 200, statusText: 'OK', ms, contentType: 'application/json', body: { ok: true, count: rows.length, data: rows }, headers: [['content-type', 'application/json']] };
  }
  if (method === 'GET' && path.startsWith('/api/ventas?')) {
    return { status: 200, statusText: 'OK', ms, contentType: 'application/json', body: { ok: true, count: SOURCES.raw_ventas.rows.length, data: SOURCES.raw_ventas.rows }, headers: [['content-type', 'application/json']] };
  }
  return null;
}

const SUGGESTED: Array<{ method: Method; path: string; label: string }> = [
  { method: 'GET', path: '/api/ventas', label: 'Listado de ventas (raw)' },
  { method: 'GET', path: '/api/ventas/3', label: 'Detalle de venta 3' },
  { method: 'GET', path: '/api/ventas/99', label: 'Venta inexistente (404)' },
  { method: 'GET', path: '/api/estado/pipeline', label: 'Estado del DAG de Airflow' },
  { method: 'POST', path: '/api/ingesta/ventas', label: 'Ingestar batch de ventas' },
  { method: 'GET', path: '/api/ventas?fecha=2026-07-05', label: 'Filtrar por fecha' },
];

// ─── JSON viewer con syntax highlight ──────────────────────────

function jsonHighlight(value: string, colors: any) {
  const parts = value.split(/("(?:\\"|[^"])*"|\b\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g);
  return parts.map((p, i) => {
    if (p.startsWith('"')) return <span key={i} style={{ color: colors.success }}>{p}</span>;
    if (/^\d/.test(p) || p === 'true' || p === 'false' || p === 'null') return <span key={i} style={{ color: colors.primary }}>{p}</span>;
    return <span key={i}>{p}</span>;
  });
}

// ─── Componente ────────────────────────────────────────────────

let histId = 0;

export default function ApiClientSim({ theme, onBack }: ApiClientSimProps) {
  const colors = themeColors[theme];
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState('/api/ventas');
  const [body, setBody] = useState('{ "source": "api_lno", "batch": 7 }');
  const [resp, setResp] = useState<ApiResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const parsed = useMemo(() => {
    try { return JSON.parse(body); } catch { return null; }
  }, [body]);

  const send = (path: string, m: Method, payload?: string): void => {
    setLoading(true);
    setResp(null);
    let r: ApiResponse | null = null;
    setTimeout(() => {
      if (m === 'GET') r = registerEndpoints(path, 'GET');
      else {
        const base = registerEndpoints(path, 'POST');
        if (base) r = { ...base, body: { ...base.body, recv: payload ? safeParse(payload) : null } };
      }
      if (!r) {
        r = { status: m === 'GET' ? 404 : 405, statusText: m === 'GET' ? 'Not Found' : 'Method Not Allowed', ms: 90, contentType: 'application/json', body: { ok: false, error: `no hay endpoint ${m} ${path} (revisa la ruta en el API gateway)` }, headers: [['content-type', 'application/json']] };
      }
      const finalResp = r;
      setResp(finalResp);
      setHistory(h => [{ id: ++histId, method: m, path, status: finalResp.status, ms: finalResp.ms }, ...h].slice(0, 12));
      setLoading(false);
    }, 260);
  };

  const statusColor = (s: number) => (s < 300 ? colors.success : s < 500 ? colors.warning : colors.error);

  const rows = useMemo(() => (resp && resp.body && resp.body.data && Array.isArray(resp.body.data) ? resp.body.data : null) as Array<Record<string, any>> | null, [resp]);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      {/* Barra */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <span className="text-sm">📡</span>
        <span className="text-xs font-bold" style={{ color: colors.text }}>API Client · Gateway dataflow</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.success}18`, color: colors.success }}>● ambiente: dev</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>base: https://api.dataflow.mx</span>
        <div className="flex-1" />
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>← Escritorio</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Izquierda: request */}
        <div className="w-2/5 shrink-0 border-r p-3 flex flex-col gap-3 overflow-y-auto" style={{ borderColor: colors.border }}>
          <div className="flex gap-1.5 items-center">
            <select value={method} onChange={e => setMethod(e.target.value as Method)} className="text-[10px] font-bold px-2 py-1.5 rounded outline-none" style={{ background: method === 'POST' ? colors.secondary : colors.primary, color: '#fff', border: 'none' }}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
            <input value={url} onChange={e => setUrl(e.target.value)} className="flex-1 text-[10px] font-mono px-2 py-1.5 rounded outline-none" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.text }} spellCheck={false} />
            <button onClick={() => send(url, method, method === 'POST' ? body : undefined)} className="text-[10px] px-3 py-1.5 rounded font-bold" style={{ background: colors.primary, color: '#fff', opacity: loading ? 0.6 : 1 }}>
              {loading ? '…' : 'Enviar'}
            </button>
          </div>

          {method === 'POST' && (
            <div>
              <div className="text-[8px] font-bold mb-1" style={{ color: colors.textMuted }}>BODY (JSON) · {parsed ? 'válido' : 'JSON inválido'}</div>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="w-full text-[10px] font-mono px-2 py-1.5 rounded outline-none resize-none" style={{ background: colors.cardBg, border: `1px solid ${parsed ? colors.border : colors.error}`, color: colors.text }} spellCheck={false} />
            </div>
          )}

          <div>
            <div className="text-[8px] font-bold mb-1" style={{ color: colors.textMuted }}>ENDOPOINTS SUGERIDOS (ingesta)</div>
            <div className="space-y-1">
              {SUGGESTED.map(s => (
                <button key={s.path + s.method} onClick={() => { setMethod(s.method); setUrl(s.path); send(s.path, s.method, s.method === 'POST' ? body : undefined); }} className="w-full text-left px-2 py-1.5 rounded flex items-center gap-2" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: s.method === 'POST' ? colors.secondary : colors.primary, color: '#fff' }}>{s.method}</span>
                  <span className="text-[9px] font-mono" style={{ color: colors.text }}>{s.path}</span>
                  <span className="ml-auto text-[8px]" style={{ color: colors.textMuted }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[8px] font-bold mb-1" style={{ color: colors.textMuted }}>HISTORIAL</div>
            {history.length === 0 && <div className="text-[8px]" style={{ color: colors.textMuted }}>Aún no has enviado peticiones.</div>}
            <div className="space-y-0.5">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: h.method === 'POST' ? colors.secondary : colors.primary, color: '#fff' }}>{h.method}</span>
                  <span className="text-[8px] font-mono truncate flex-1" style={{ color: colors.textMuted }}>{h.path}</span>
                  <span className="text-[8px] font-mono" style={{ color: statusColor(h.status) }}>{h.status}</span>
                  <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{h.ms}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Derecha: response */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-[10px] animate-pulse" style={{ color: colors.textMuted }}>⚡ Esperando respuesta del gateway…</div>
            </div>
          ) : resp ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-1 rounded" style={{ background: statusColor(resp.status), color: '#fff' }}>{resp.status} {resp.statusText}</span>
                <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{resp.ms} ms · {resp.contentType}</span>
                <div className="flex-1" />
                <button onClick={() => setResp(null)} className="text-[8px] px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>Limpiar</button>
              </div>

              {rows && rows.length > 0 ? (
                <div className="rounded-md overflow-hidden mb-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                  <div className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
                    Respuesta: {rows.length} filas de raw_ventas
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          {Object.keys(rows[0]).map(k => (
                            <th key={k} className="px-2 py-1 text-[8px] font-mono" style={{ color: colors.primary, borderBottom: `1px solid ${colors.border}` }}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} style={{ background: i % 2 ? colors.bg : undefined }}>
                            {Object.values(r).map((v, j) => (
                              <td key={j} className="px-2 py-1 text-[8px] font-mono" style={{ color: colors.text }}>{typeof v === 'number' ? v.toLocaleString('es-MX') : String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <pre className="rounded-md p-3 mb-3 text-[10px] font-mono whitespace-pre-wrap" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {jsonHighlight(JSON.stringify(resp.body, null, 2), colors)}
                </pre>
              )}

              <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>RESPONSE HEADERS</div>
                {resp.headers.map(([k, v]) => (
                  <div key={k} className="px-3 py-1 flex gap-2 text-[8px] font-mono" style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.primary }}>{k}:</span>
                    <span style={{ color: colors.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">📡</div>
                <div className="text-[10px]" style={{ color: colors.textMuted }}>Envía una petición para probar el API de ingesta.<br />Prueba el listado de ventas o ingestar un batch.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function safeParse(text: string): any {
  try { return JSON.parse(text); } catch { return null; }
}