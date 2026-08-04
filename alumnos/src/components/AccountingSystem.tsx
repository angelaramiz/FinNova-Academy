import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

function getToken() { return localStorage.getItem('supabase_auth_token') || ''; }
async function apiGet(path: string) {
  return apiFetch(path);
}
async function apiPost(path: string, body?: any) {
  return apiFetch(path, { method: body ? 'POST' : 'GET', ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) });
}

// ─── DATA ─────────────────────────────────────────────────────────
const ACCOUNTS = [
  { code: '1-01', name: 'Caja', type: 'Activo', balance: 28500 },
  { code: '1-02', name: 'Bancos', type: 'Activo', balance: 248000 },
  { code: '1-03', name: 'Clientes', type: 'Activo', balance: 125000 },
  { code: '1-04', name: 'Deudores diversos', type: 'Activo', balance: 18000 },
  { code: '1-05', name: 'Inventarios', type: 'Activo', balance: 210000 },
  { code: '1-06', name: 'Equipo de cómputo', type: 'Activo', balance: 95000 },
  { code: '1-07', name: 'Mobiliario y equipo', type: 'Activo', balance: 65000 },
  { code: '1-08', name: 'Depreciación acumulada', type: 'Activo', balance: -35000 },
  { code: '2-01', name: 'Proveedores', type: 'Pasivo', balance: -95000 },
  { code: '2-02', name: 'Acreedores', type: 'Pasivo', balance: -32000 },
  { code: '2-03', name: 'IVA por pagar', type: 'Pasivo', balance: -18500 },
  { code: '2-04', name: 'ISR por pagar', type: 'Pasivo', balance: -25000 },
  { code: '2-05', name: 'PTU por pagar', type: 'Pasivo', balance: -12000 },
  { code: '3-01', name: 'Capital social', type: 'Capital', balance: -350000 },
  { code: '3-02', name: 'Utilidad del ejercicio', type: 'Capital', balance: -65000 },
  { code: '4-01', name: 'Ventas', type: 'Ingreso', balance: -380000 },
  { code: '5-01', name: 'Compras', type: 'Gasto', balance: 180000 },
  { code: '5-02', name: 'Gastos de venta', type: 'Gasto', balance: 42000 },
  { code: '5-03', name: 'Gastos de administración', type: 'Gasto', balance: 55000 },
  { code: '5-04', name: 'Gastos financieros', type: 'Gasto', balance: 8500 },
];

function fmt(n: number) { return n.toLocaleString('es-MX', { minimumFractionDigits: 2 }); }

function genJournal() {
  return [
    { date: '01/07/2026', ref: 'FAC-045', desc: 'Emisión de factura a Comercial del Norte', account: '1-03 Clientes', debit: 58500, credit: 0, type: 'Factura' },
    { date: '01/07/2026', ref: 'FAC-045', desc: 'Reconocimiento de venta', account: '4-01 Ventas', debit: 0, credit: 50000, type: 'Factura' },
    { date: '01/07/2026', ref: 'FAC-045', desc: 'IVA trasladado', account: '2-03 IVA por pagar', debit: 0, credit: 8500, type: 'Factura' },
    { date: '03/07/2026', ref: 'PAG-012', desc: 'Registro de pago Transportes Rápidos', account: '1-02 Bancos', debit: 35000, credit: 0, type: 'Pago' },
    { date: '03/07/2026', ref: 'PAG-012', desc: 'Aplicación de pago a factura', account: '1-03 Clientes', debit: 0, credit: 35000, type: 'Pago' },
    { date: '05/07/2026', ref: 'PROV-03', desc: 'Factura de proveedor Servicios Tech MX', account: '5-01 Compras', debit: 22000, credit: 0, type: 'Compra' },
    { date: '05/07/2026', ref: 'PROV-03', desc: 'IVA acreditable de proveedor', account: '2-03 IVA por pagar', debit: 3520, credit: 0, type: 'Compra' },
    { date: '05/07/2026', ref: 'PROV-03', desc: 'Registro de proveedor', account: '2-01 Proveedores', debit: 0, credit: 25520, type: 'Compra' },
    { date: '08/07/2026', ref: 'NOM-07', desc: 'Pago de nómina quincenal', account: '1-02 Bancos', debit: 0, credit: 95000, type: 'Nómina' },
    { date: '08/07/2026', ref: 'NOM-07', desc: 'Gasto por nómina', account: '5-03 Gastos de administración', debit: 95000, credit: 0, type: 'Nómina' },
    { date: '10/07/2026', ref: 'DEP-07', desc: 'Depreciación mensual equipo cómputo', account: '5-03 Gastos de administración', debit: 1980, credit: 0, type: 'Póliza' },
    { date: '10/07/2026', ref: 'DEP-07', desc: 'Depreciación acumulada equipo', account: '1-08 Depreciación acumulada', debit: 0, credit: 1980, type: 'Póliza' },
    { date: '12/07/2026', ref: 'BAN-07', desc: 'Comisión bancaria mensual', account: '5-04 Gastos financieros', debit: 850, credit: 0, type: 'Banco' },
    { date: '12/07/2026', ref: 'BAN-07', desc: 'Cargo a cuenta', account: '1-02 Bancos', debit: 0, credit: 850, type: 'Banco' },
    { date: '15/07/2026', ref: 'FAC-046', desc: 'Emisión factura Almacenes del Bajío', account: '1-03 Clientes', debit: 92000, credit: 0, type: 'Factura' },
    { date: '15/07/2026', ref: 'FAC-046', desc: 'Reconocimiento de venta', account: '4-01 Ventas', debit: 0, credit: 78000, type: 'Factura' },
    { date: '15/07/2026', ref: 'FAC-046', desc: 'IVA trasladado', account: '2-03 IVA por pagar', debit: 0, credit: 14000, type: 'Factura' },
    { date: '18/07/2026', ref: 'PAG-013', desc: 'Pago factura proveedor Papelería del Norte', account: '2-01 Proveedores', debit: 15000, credit: 0, type: 'Compra' },
    { date: '18/07/2026', ref: 'PAG-013', desc: 'Transferencia bancaria', account: '1-02 Bancos', debit: 0, credit: 15000, type: 'Compra' },
    { date: '20/07/2026', ref: 'CJ-07', desc: 'Compra material oficina (caja chica)', account: '5-02 Gastos de venta', debit: 3200, credit: 0, type: 'Caja' },
    { date: '20/07/2026', ref: 'CJ-07', desc: 'Salida de caja chica', account: '1-01 Caja', debit: 0, credit: 3200, type: 'Caja' },
    { date: '22/07/2026', ref: 'FAC-047', desc: 'Factura venta Inversiones del Valle', account: '1-03 Clientes', debit: 155000, credit: 0, type: 'Factura' },
    { date: '22/07/2026', ref: 'FAC-047', desc: 'Reconocimiento de venta', account: '4-01 Ventas', debit: 0, credit: 135000, type: 'Factura' },
    { date: '22/07/2026', ref: 'FAC-047', desc: 'IVA trasladado', account: '2-03 IVA por pagar', debit: 0, credit: 20000, type: 'Factura' },
  ];
}

const CLIENTS = [
  { name: 'Comercial del Norte S.A.', rfc: 'CNS-990101-HIJ', balance: 52000, invoices: 3 },
  { name: 'Transportes Rápidos S.A.', rfc: 'TRA-880202-KLM', balance: 18500, invoices: 2 },
  { name: 'Almacenes del Bajío S.P.R.', rfc: 'ALB-770303-NOP', balance: 92000, invoices: 4 },
  { name: 'Inversiones del Valle S.A.', rfc: 'INV-660404-QRS', balance: 155000, invoices: 5 },
  { name: 'Corporativo Trust S.A.', rfc: 'CTR-550505-TUV', balance: 0, invoices: 1 },
];

const SUPPLIERS = [
  { name: 'Transportes Express S.A.', rfc: 'TEX-660606-ABC', balance: 35000, invoices: 4 },
  { name: 'Papelería del Norte', rfc: 'PAN-770707-DEF', balance: 22000, invoices: 2 },
  { name: 'Servicios Tech MX', rfc: 'STM-880808-GHI', balance: 18500, invoices: 3 },
  { name: 'Combustibles del Bajío', rfc: 'CBL-900909-JKL', balance: 15000, invoices: 2 },
];

type Module = 'diario' | 'cuentas' | 'clientes' | 'proveedores' | 'reportes';

// ─── COMPONENT ───────────────────────────────────────────────────
export default function AccountingSystem({ theme, onBack }: { theme: Theme; onBack: () => void }) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [mod, setMod] = useState<Module>('diario');
  const [dynamicEntries, setDynamicEntries] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ date: '', ref: '', desc: '', account: '', debit: '', credit: '' });
  const [realAccounts, setRealAccounts] = useState<any[]>([]);
  const [balanceGeneral, setBalanceGeneral] = useState<any>(null);
  const [estadoResultados, setEstadoResultados] = useState<any>(null);
  const [balanza, setBalanza] = useState<any>(null);
  const [reportTab, setReportTab] = useState<'bg' | 'er' | 'bal'>('bg');
  const [persistentClients, setPersistentClients] = useState<any[]>([]);
  const [persistentSuppliers, setPersistentSuppliers] = useState<any[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [journalPage, setJournalPage] = useState(0);
  const journalPageSize = 15;
  const journal = genJournal();
  const allEntries = [...dynamicEntries, ...journal];

  useEffect(() => {
    (async () => {
      try {
        const [journalData, accountsData, clientsData, suppliersData] = await Promise.all([
          apiGet('/api/sim/journal'),
          apiGet('/api/sim/chart-of-accounts'),
          apiGet('/api/sim/clients'),
          apiGet('/api/sim/suppliers'),
        ]);
        if (Array.isArray(journalData)) setDynamicEntries(journalData);
        if (Array.isArray(accountsData)) setRealAccounts(accountsData);
        if (Array.isArray(clientsData)) setPersistentClients(clientsData);
        if (Array.isArray(suppliersData)) setPersistentSuppliers(suppliersData);
      } catch {
        setApiError('Error al cargar datos');
      }
    })();
  }, []);

  useEffect(() => {
    if (mod === 'reportes') {
      (async () => {
        try {
          const [bg, er, bal] = await Promise.all([
            apiGet('/api/sim/reports/balance-general'),
            apiGet('/api/sim/reports/estado-resultados'),
            apiGet('/api/sim/reports/balanza-comprobacion'),
          ]);
          setBalanceGeneral(bg);
          setEstadoResultados(er);
          setBalanza(bal);
        } catch {
          setApiError('Error al cargar datos');
        }
      })();
    }
  }, [mod]);

  function openNewEntry() {
    setForm({ date: new Date().toLocaleDateString('es-MX').replace(/\//g, '/'), ref: '', desc: '', account: '', debit: '', credit: '' });
    setEditEntry(null);
    setShowForm(true);
  }

  function openEditEntry(entry: any) {
    setForm({ date: entry.date, ref: entry.ref, desc: entry.desc, account: entry.account, debit: String(entry.debit || ''), credit: String(entry.credit || '') });
    setEditEntry(entry);
    setShowForm(true);
  }

  async function handleSave() {
    const newEntry = {
      date: form.date,
      ref: form.ref || `POL-${Date.now()}`,
      desc: form.desc,
      account: form.account,
      debit: Number(form.debit) || 0,
      credit: Number(form.credit) || 0,
      type: 'manual',
    };
    // Persistir en backend
    try {
      await apiPost('/api/sim/journal', newEntry);
    } catch (e) { console.error('Error guardando asiento:', e); }
    setDynamicEntries(prev => {
      if (editEntry) {
        return prev.map(e => e === editEntry ? newEntry : e);
      }
      return [...prev, newEntry];
    });
    setShowForm(false);
    setEditEntry(null);
  }

  function handleDelete(entry: any) {
    setDynamicEntries(prev => prev.filter(e => e !== entry));
  }

  const filteredEntries = allEntries.filter(e =>
    !filter || e.account.toLowerCase().includes(filter.toLowerCase()) ||
    e.desc.toLowerCase().includes(filter.toLowerCase()) ||
    e.ref.toLowerCase().includes(filter.toLowerCase())
  );

  const modules = [
    { id: 'diario' as Module, icon: '📋', label: 'Libro Diario' },
    { id: 'cuentas' as Module, icon: '📚', label: 'Catálogo de Cuentas' },
    { id: 'clientes' as Module, icon: '👥', label: 'Clientes' },
    { id: 'proveedores' as Module, icon: '🚛', label: 'Proveedores' },
    { id: 'reportes' as Module, icon: '📊', label: 'Reportes' },
  ];

  const totalDebe = allEntries.reduce((s, e) => s + e.debit, 0);
  const totalHaber = allEntries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="flex h-full" style={{ background: colors.bg }}>
      {/* Left Sidebar (Odoo-style) */}
      <div className="w-48 shrink-0 border-r-2 flex flex-col" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f0f4f8' }}>
        <div className="px-4 py-3 border-b-2" style={{ borderColor: colors.border }}>
          <button onClick={onBack} className="text-[12px] px-2 py-1 rounded border cursor-pointer hover:opacity-70 mb-2 inline-block" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>← Escritorio</button>
          <p className="text-xs font-bold" style={{ color: colors.text }}>📊 Contabilidad</p>
          <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Operadora del Norte</p>
        </div>
        <div className="flex-1 overflow-auto py-2">
          {modules.map(m => (
            <button key={m.id} onClick={() => setMod(m.id)}
              className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-[13px] font-mono cursor-pointer hover:opacity-80 transition"
              style={{ color: mod === m.id ? colors.primary : colors.textMuted, background: mod === m.id ? (isDark ? 'rgba(255,177,98,0.1)' : 'rgba(255,177,98,0.15)') : 'transparent', borderLeft: mod === m.id ? `3px solid ${colors.primary}` : '3px solid transparent' }}>
              <span className="text-sm">{m.icon}</span>
              <span className="font-bold">{m.label}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t-2 text-[13px] font-mono" style={{ borderColor: colors.border, color: colors.textMuted }}>
          Simulador v0.1 · Julio 2026
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {apiError && (
          <div className="mx-4 mt-3 px-4 py-2 rounded-lg text-[11px] font-mono flex items-center gap-2" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
            ⚠️ {apiError}
            <button onClick={() => setApiError(null)} className="ml-auto text-[10px] cursor-pointer">✕</button>
          </div>
        )}
        {/* Toolbar */}
        <div className="px-4 py-3 border-b-2 flex items-center justify-between shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono uppercase tracking-wider" style={{ color: colors.primary }}>{modules.find(m => m.id === mod)?.icon} {modules.find(m => m.id === mod)?.label}</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: colors.cardBg, color: colors.textMuted }}>{mod === 'diario' ? filteredEntries.length : mod === 'cuentas' ? ACCOUNTS.length : mod === 'clientes' ? CLIENTS.length : mod === 'proveedores' ? SUPPLIERS.length : '—'} registros</span>
          </div>
          <div className="flex items-center gap-2">
            {mod === 'diario' && (
              <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
                placeholder="🔍 Buscar..."
                className="text-[11px] font-mono px-2 py-1 rounded border"
                style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text, width: 200 }} />
            )}
            {mod === 'diario' && (
              <button onClick={openNewEntry} className="text-[11px] font-bold px-2 py-1 rounded cursor-pointer hover:opacity-80"
                style={{ background: colors.primary, color: '#1B2632' }}>+ Nuevo asiento</button>
            )}
          </div>
        </div>

        {/* Module content */}
        <div className="flex-1 overflow-auto">
          {mod === 'diario' && (
            <>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                  <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Fecha</th>
                  <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Ref</th>
                  <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Descripción</th>
                  <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Cuenta</th>
                  <th className="px-4 py-2 text-[11px] font-mono uppercase text-right" style={{ color: '#22c55e' }}>Debe</th>
                  <th className="px-4 py-2 text-[11px] font-mono uppercase text-right" style={{ color: '#ef4444' }}>Haber</th>
                  <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Tipo</th>
                  <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.slice(journalPage * journalPageSize, (journalPage + 1) * journalPageSize).map((e, i) => (
                  <tr key={i} className="hover:opacity-80" style={{ borderBottom: `1px solid ${colors.border}30` }}>
                    <td className="px-4 py-2 text-[12px] font-mono" style={{ color: colors.text }}>{e.date}</td>
                    <td className="px-4 py-2 text-[12px] font-mono font-bold" style={{ color: colors.primary }}>{e.ref}</td>
                    <td className="px-4 py-2 text-[12px]" style={{ color: colors.text }}>{e.desc}</td>
                    <td className="px-4 py-2 text-[12px] font-mono" style={{ color: colors.textMuted }}>{e.account}</td>
                    <td className="px-4 py-2 text-[12px] font-mono text-right" style={{ color: e.debit > 0 ? '#22c55e' : colors.textMuted }}>{e.debit > 0 ? `$${fmt(e.debit)}` : ''}</td>
                    <td className="px-4 py-2 text-[12px] font-mono text-right" style={{ color: e.credit > 0 ? '#ef4444' : colors.textMuted }}>{e.credit > 0 ? `$${fmt(e.credit)}` : ''}</td>
                    <td className="px-4 py-2"><span className="text-[13px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.type === 'manual' ? '#22c55e20' : colors.primary + '20', color: e.type === 'manual' ? '#22c55e' : colors.primary }}>{e.type}</span></td>
                    <td className="px-4 py-2 flex gap-1">
                      <button onClick={() => openEditEntry(e)} className="text-[11px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-70" style={{ background: colors.primary + '30', color: colors.primary }}>✏️</button>
                      <button onClick={() => handleDelete(e)} className="text-[11px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-70" style={{ background: '#ef444430', color: '#ef4444' }}>🗑</button>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-[12px]" style={{ color: colors.textMuted }}>No hay asientos que mostrar</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: isDark ? 'rgba(255,177,98,0.1)' : 'rgba(255,177,98,0.1)', borderTop: `2px solid ${colors.primary}` }}>
                  <td colSpan={4} className="px-4 py-2 text-[12px] font-bold text-right" style={{ color: colors.text }}>TOTALES:</td>
                  <td className="px-4 py-2 text-[12px] font-bold text-right" style={{ color: '#22c55e' }}>${fmt(totalDebe)}</td>
                  <td className="px-4 py-2 text-[12px] font-bold text-right" style={{ color: '#ef4444' }}>${fmt(totalHaber)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
            {/* Pagination */}
            {filteredEntries.length > journalPageSize && (
              <div className="px-4 py-2 flex items-center justify-between border-t" style={{ borderColor: colors.border }}>
                <span className="text-[11px] font-mono" style={{ color: colors.textMuted }}>
                  Mostrando {journalPage * journalPageSize + 1}-{Math.min((journalPage + 1) * journalPageSize, filteredEntries.length)} de {filteredEntries.length}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setJournalPage(0)} disabled={journalPage === 0} className="text-[10px] px-2 py-1 rounded border cursor-pointer disabled:opacity-30" style={{ borderColor: colors.border, color: colors.textMuted }}>«</button>
                  <button onClick={() => setJournalPage(p => Math.max(0, p - 1))} disabled={journalPage === 0} className="text-[10px] px-2 py-1 rounded border cursor-pointer disabled:opacity-30" style={{ borderColor: colors.border, color: colors.textMuted }}>‹</button>
                  <span className="text-[11px] font-mono px-2 py-1" style={{ color: colors.text }}>{journalPage + 1}/{Math.ceil(filteredEntries.length / journalPageSize)}</span>
                  <button onClick={() => setJournalPage(p => Math.min(Math.ceil(filteredEntries.length / journalPageSize) - 1, p + 1))} disabled={journalPage >= Math.ceil(filteredEntries.length / journalPageSize) - 1} className="text-[10px] px-2 py-1 rounded border cursor-pointer disabled:opacity-30" style={{ borderColor: colors.border, color: colors.textMuted }}>›</button>
                  <button onClick={() => setJournalPage(Math.ceil(filteredEntries.length / journalPageSize) - 1)} disabled={journalPage >= Math.ceil(filteredEntries.length / journalPageSize) - 1} className="text-[10px] px-2 py-1 rounded border cursor-pointer disabled:opacity-30" style={{ borderColor: colors.border, color: colors.textMuted }}>»</button>
                </div>
              </div>
            )}
            </>
          )}

          {mod === 'cuentas' && (
            <div className="overflow-auto">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                    <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Código</th>
                    <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Cuenta</th>
                    <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Tipo</th>
                    <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Nivel</th>
                    <th className="px-4 py-2 text-[11px] font-mono uppercase" style={{ color: colors.textMuted }}>Naturaleza</th>
                    <th className="px-4 py-2 text-[11px] font-mono uppercase text-right" style={{ color: colors.text }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {realAccounts.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px]" style={{ color: colors.textMuted }}>No hay cuentas registradas</td></tr>
                  )}
                  {realAccounts.map(a => (
                    <tr key={a.code} className="hover:opacity-80" style={{ borderBottom: `1px solid ${colors.border}30`, paddingLeft: a.level > 1 ? `${(a.level - 1) * 16}px` : undefined }}>
                      <td className="px-4 py-2 text-[12px] font-mono font-bold" style={{ color: colors.primary, paddingLeft: a.level > 1 ? `${16 + (a.level - 1) * 16}px` : undefined }}>{a.code}</td>
                      <td className="px-4 py-2 text-[12px] font-bold" style={{ color: a.level === 1 ? colors.text : colors.textMuted }}>{a.name}</td>
                      <td className="px-4 py-2">
                        <span className="text-[13px] font-bold px-1.5 py-0.5 rounded" style={{ background: a.type === 'Activo' ? '#22c55e20' : a.type === 'Pasivo' ? '#ef444420' : a.type === 'Capital' ? '#8b5cf620' : a.type === 'Ingreso' ? '#3b82f620' : '#f59e0b20', color: a.type === 'Activo' ? '#22c55e' : a.type === 'Pasivo' ? '#ef4444' : a.type === 'Capital' ? '#8b5cf6' : a.type === 'Ingreso' ? '#3b82f6' : '#f59e0b' }}>
                          {a.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[11px] font-mono" style={{ color: colors.textMuted }}>{a.level}</td>
                      <td className="px-4 py-2 text-[11px] font-mono" style={{ color: a.nature === 'D' ? '#22c55e' : '#ef4444' }}>{a.nature === 'D' ? 'D (Deudora)' : 'H (Acreedora)'}</td>
                      <td className="px-4 py-2 text-[12px] font-mono text-right font-bold" style={{ color: a.balance >= 0 ? '#22c55e' : '#ef4444' }}>{a.balance >= 0 ? `$${fmt(a.balance)}` : `-$${fmt(Math.abs(a.balance))}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mod === 'clientes' && (
            <div className="p-4 space-y-2">
              {persistentClients.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px]" style={{ color: colors.textMuted }}>No hay cuentas registradas</td></tr>
              )}
              {persistentClients.map(c => (
                <div key={c.id} className="p-4 rounded-xl border-2 flex items-center justify-between" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: colors.primary, color: '#1B2632' }}>{c.name.charAt(0)}</div>
                    <div>
                      <p className="text-[13px] font-bold" style={{ color: colors.text }}>{c.name}</p>
                      <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>{c.rfc} · {c.contact}</p>
                      <p className="text-[13px] font-mono" style={{ color: colors.textMuted }}>Límite crédito: ${fmt(c.creditLimit)} · {c.paymentTerms}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: c.outstandingBalance > 0 ? '#f59e0b' : '#22c55e' }}>{c.outstandingBalance > 0 ? `$${fmt(c.outstandingBalance)}` : '$0'}</p>
                    <p className="text-[13px] font-mono" style={{ color: colors.textMuted }}>Saldo pendiente</p>
                    <p className="text-[13px] font-mono" style={{ color: colors.textMuted }}>{c.invoicesCount} facturas · ${fmt(c.totalPurchases)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mod === 'proveedores' && (
            <div className="p-4 space-y-2">
              {persistentSuppliers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px]" style={{ color: colors.textMuted }}>No hay cuentas registradas</td></tr>
              )}
              {persistentSuppliers.map(s => (
                <div key={s.id} className="p-4 rounded-xl border-2 flex items-center justify-between" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: colors.secondary, color: '#fff' }}>{s.name.charAt(0)}</div>
                    <div>
                      <p className="text-[13px] font-bold" style={{ color: colors.text }}>{s.name}</p>
                      <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>{s.rfc} · {s.contact}</p>
                      <p className="text-[13px] font-mono" style={{ color: colors.textMuted }}>Términos: {s.paymentTerms}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: s.outstandingBalance > 0 ? '#ef4444' : '#22c55e' }}>{s.outstandingBalance > 0 ? `$${fmt(s.outstandingBalance)}` : '$0'}</p>
                    <p className="text-[13px] font-mono" style={{ color: colors.textMuted }}>Por pagar</p>
                    <p className="text-[13px] font-mono" style={{ color: colors.textMuted }}>{s.invoicesCount} facturas · ${fmt(s.totalPurchases)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mod === 'reportes' && (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setReportTab('bg')} className="text-[12px] font-bold px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: reportTab === 'bg' ? colors.primary : colors.cardBg, color: reportTab === 'bg' ? '#1B2632' : colors.textMuted, border: `1px solid ${colors.border}` }}>Balance General</button>
                <button onClick={() => setReportTab('er')} className="text-[12px] font-bold px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: reportTab === 'er' ? colors.primary : colors.cardBg, color: reportTab === 'er' ? '#1B2632' : colors.textMuted, border: `1px solid ${colors.border}` }}>Estado de Resultados</button>
                <button onClick={() => setReportTab('bal')} className="text-[12px] font-bold px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: reportTab === 'bal' ? colors.primary : colors.cardBg, color: reportTab === 'bal' ? '#1B2632' : colors.textMuted, border: `1px solid ${colors.border}` }}>Balanza Comprobación</button>
              </div>

              {reportTab === 'bg' && balanceGeneral && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-center" style={{ color: colors.text }}>📊 Balance General</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border" style={{ borderColor: colors.border, background: colors.cardBg }}>
                      <p className="text-[12px] font-bold mb-2" style={{ color: '#22c55e' }}>ACTIVOS</p>
                      {balanceGeneral.activos.map((a: any) => (
                        <div key={a.code} className="flex justify-between py-1 text-[11px] border-b" style={{ borderColor: colors.border + '30' }}>
                          <span style={{ color: colors.textMuted }}>{a.name}</span>
                          <span className="font-mono" style={{ color: colors.text }}>${fmt(a.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 mt-2 border-t-2" style={{ borderColor: '#22c55e' }}>
                        <span className="text-[12px] font-bold" style={{ color: '#22c55e' }}>Total Activos</span>
                        <span className="text-[12px] font-mono font-bold" style={{ color: '#22c55e' }}>${fmt(balanceGeneral.totalActivos)}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border" style={{ borderColor: colors.border, background: colors.cardBg }}>
                        <p className="text-[12px] font-bold mb-2" style={{ color: '#ef4444' }}>PASIVOS</p>
                        {balanceGeneral.pasivos.map((a: any) => (
                          <div key={a.code} className="flex justify-between py-1 text-[11px] border-b" style={{ borderColor: colors.border + '30' }}>
                            <span style={{ color: colors.textMuted }}>{a.name}</span>
                            <span className="font-mono" style={{ color: colors.text }}>${fmt(a.balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 mt-2 border-t-2" style={{ borderColor: '#ef4444' }}>
                          <span className="text-[12px] font-bold" style={{ color: '#ef4444' }}>Total Pasivos</span>
                          <span className="text-[12px] font-mono font-bold" style={{ color: '#ef4444' }}>${fmt(balanceGeneral.totalPasivos)}</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border" style={{ borderColor: colors.border, background: colors.cardBg }}>
                        <p className="text-[12px] font-bold mb-2" style={{ color: '#8b5cf6' }}>CAPITAL</p>
                        {balanceGeneral.capital.map((a: any) => (
                          <div key={a.code} className="flex justify-between py-1 text-[11px] border-b" style={{ borderColor: colors.border + '30' }}>
                            <span style={{ color: colors.textMuted }}>{a.name}</span>
                            <span className="font-mono" style={{ color: colors.text }}>${fmt(a.balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 mt-2 border-t-2" style={{ borderColor: '#8b5cf6' }}>
                          <span className="text-[12px] font-bold" style={{ color: '#8b5cf6' }}>Total Capital</span>
                          <span className="text-[12px] font-mono font-bold" style={{ color: '#8b5cf6' }}>${fmt(balanceGeneral.totalCapital)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-[12px] font-mono py-2 rounded-lg" style={{ background: balanceGeneral.balanced ? '#22c55e20' : '#ef444420', color: balanceGeneral.balanced ? '#22c55e' : '#ef4444' }}>
                    {balanceGeneral.balanced ? '✓ Balance cuadrado: Activos = Pasivos + Capital' : '⚠ Balance descuadrado'}
                  </div>
                </div>
              )}

              {reportTab === 'er' && estadoResultados && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-center" style={{ color: colors.text }}>📈 Estado de Resultados — Julio 2026</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border" style={{ borderColor: colors.border, background: colors.cardBg }}>
                      <p className="text-[12px] font-bold mb-2" style={{ color: '#22c55e' }}>INGRESOS</p>
                      {estadoResultados.ingresos.map((a: any) => (
                        <div key={a.code} className="flex justify-between py-1 text-[11px] border-b" style={{ borderColor: colors.border + '30' }}>
                          <span style={{ color: colors.textMuted }}>{a.name}</span>
                          <span className="font-mono" style={{ color: '#22c55e' }}>${fmt(a.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 mt-2 border-t-2" style={{ borderColor: '#22c55e' }}>
                        <span className="text-[12px] font-bold" style={{ color: '#22c55e' }}>Total Ingresos</span>
                        <span className="text-[12px] font-mono font-bold" style={{ color: '#22c55e' }}>${fmt(estadoResultados.totalIngresos)}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ borderColor: colors.border, background: colors.cardBg }}>
                      <p className="text-[12px] font-bold mb-2" style={{ color: '#ef4444' }}>GASTOS</p>
                      {estadoResultados.gastos.map((a: any) => (
                        <div key={a.code} className="flex justify-between py-1 text-[11px] border-b" style={{ borderColor: colors.border + '30' }}>
                          <span style={{ color: colors.textMuted }}>{a.name}</span>
                          <span className="font-mono" style={{ color: '#ef4444' }}>${fmt(a.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 mt-2 border-t-2" style={{ borderColor: '#ef4444' }}>
                        <span className="text-[12px] font-bold" style={{ color: '#ef4444' }}>Total Gastos</span>
                        <span className="text-[12px] font-mono font-bold" style={{ color: '#ef4444' }}>${fmt(estadoResultados.totalGastos)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border-2" style={{ borderColor: colors.primary, background: colors.cardBg }}>
                    <div className="flex justify-between">
                      <span className="text-[13px] font-bold" style={{ color: colors.text }}>UTILIDAD NETA</span>
                      <span className="text-sm font-mono font-bold" style={{ color: colors.primary }}>${fmt(estadoResultados.utilidadNeta)}</span>
                    </div>
                  </div>
                </div>
              )}

              {reportTab === 'bal' && balanza && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-center" style={{ color: colors.text }}>📋 Balanza de Comprobación — Julio 2026</h3>
                  <div className="p-4 rounded-xl border" style={{ borderColor: colors.border, background: colors.cardBg }}>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b" style={{ borderColor: colors.border }}>
                          <th className="text-left py-1" style={{ color: colors.textMuted }}>Código</th>
                          <th className="text-left py-1" style={{ color: colors.textMuted }}>Cuenta</th>
                          <th className="text-left py-1" style={{ color: colors.textMuted }}>Tipo</th>
                          <th className="text-right py-1" style={{ color: '#22c55e' }}>DEBE</th>
                          <th className="text-right py-1" style={{ color: '#ef4444' }}>HABER</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanza.accounts.map((a: any) => (
                          <tr key={a.code} className="border-b" style={{ borderColor: colors.border + '30' }}>
                            <td className="py-1 font-mono" style={{ color: colors.primary }}>{a.code}</td>
                            <td className="py-1" style={{ color: colors.text }}>{a.name}</td>
                            <td className="py-1" style={{ color: colors.textMuted }}>{a.type}</td>
                            <td className="py-1 text-right font-mono" style={{ color: a.debit > 0 ? '#22c55e' : colors.textMuted }}>{a.debit > 0 ? `$${fmt(a.debit)}` : ''}</td>
                            <td className="py-1 text-right font-mono" style={{ color: a.credit > 0 ? '#ef4444' : colors.textMuted }}>{a.credit > 0 ? `$${fmt(a.credit)}` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2" style={{ borderColor: colors.primary }}>
                          <td colSpan={3} className="py-2 text-right font-bold" style={{ color: colors.text }}>TOTALES:</td>
                          <td className="py-2 text-right font-mono font-bold" style={{ color: '#22c55e' }}>${fmt(balanza.totalDebitos)}</td>
                          <td className="py-2 text-right font-mono font-bold" style={{ color: '#ef4444' }}>${fmt(balanza.totalCreditos)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="text-center text-[12px] font-mono py-2 rounded-lg" style={{ background: balanza.balanced ? '#22c55e20' : '#ef444420', color: balanza.balanced ? '#22c55e' : '#ef4444' }}>
                    {balanza.balanced ? '✓ Balanza cuadrada: DEBE = HABER' : '⚠ Balanza descuadrada'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-4 py-1.5 border-t-2 flex items-center justify-between text-[13px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
          <span style={{ color: colors.textMuted }}>Sistema Contable · Operadora del Norte S.A. de C.V.</span>
          <span style={{ color: colors.textMuted }}>Julio 2026</span>
        </div>
      </div>

      {/* Entry Form Modal */}
      {showForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl shadow-2xl overflow-hidden" style={{ background: isDark ? '#1a1a2e' : '#fff', border: `1px solid ${colors.border}`, width: '100%', maxWidth: 420 }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <span className="text-xs font-bold" style={{ color: colors.text }}>{editEntry ? '✏️ Editar asiento' : '📋 Nuevo asiento contable'}</span>
              <button onClick={() => setShowForm(false)} className="text-lg cursor-pointer" style={{ color: colors.textMuted }}>×</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { key: 'date', label: 'Fecha', placeholder: '01/08/2026' },
                { key: 'ref', label: 'Referencia', placeholder: 'POL-001' },
                { key: 'desc', label: 'Descripción', placeholder: 'Descripción del asiento' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[12px] font-bold font-mono uppercase mb-1 block" style={{ color: colors.textMuted }}>{f.label}</label>
                  <input type="text" value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] font-mono outline-none"
                    style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }}
                    placeholder={f.placeholder} />
                </div>
              ))}
              {/* Account autocomplete */}
              <div className="relative">
                <label className="text-[12px] font-bold font-mono uppercase mb-1 block" style={{ color: colors.textMuted }}>Cuenta</label>
                <input type="text" value={form.account} onChange={e => {
                  setForm(prev => ({ ...prev, account: e.target.value }));
                  setShowAccountDropdown(true);
                }} onFocus={() => setShowAccountDropdown(true)} onBlur={() => setTimeout(() => setShowAccountDropdown(false), 200)}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] font-mono outline-none"
                  style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }}
                  placeholder="Escriba código o nombre..." />
                {showAccountDropdown && realAccounts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg border max-h-40 overflow-auto" style={{ borderColor: colors.border, background: isDark ? '#1a1a2e' : '#fff' }}>
                    {realAccounts.filter(a => a.isDetail && (
                      a.code.toLowerCase().includes(form.account.toLowerCase()) ||
                      a.name.toLowerCase().includes(form.account.toLowerCase())
                    )).slice(0, 10).map(a => (
                      <div key={a.code} className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:opacity-80 transition text-[12px]"
                        style={{ borderBottom: `1px solid ${colors.border}30` }}
                        onMouseDown={() => { setForm(prev => ({ ...prev, account: `${a.code} ${a.name}` })); setShowAccountDropdown(false); }}>
                        <span className="font-mono font-bold" style={{ color: colors.primary }}>{a.code}</span>
                        <span style={{ color: colors.text }}>{a.name}</span>
                        <span className="ml-auto text-[10px] font-mono" style={{ color: a.nature === 'D' ? '#22c55e' : '#ef4444' }}>{a.nature}</span>
                      </div>
                    ))}
                    {realAccounts.filter(a => a.isDetail && (
                      a.code.toLowerCase().includes(form.account.toLowerCase()) ||
                      a.name.toLowerCase().includes(form.account.toLowerCase())
                    )).length === 0 && (
                      <div className="px-3 py-2 text-[11px]" style={{ color: colors.textMuted }}>No se encontraron cuentas</div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[12px] font-bold font-mono uppercase mb-1 block" style={{ color: '#22c55e' }}>DEBE</label>
                  <input type="number" step="0.01" min="0" value={form.debit} onChange={e => setForm(prev => ({ ...prev, debit: e.target.value, credit: e.target.value ? '' : prev.credit }))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] font-mono outline-none"
                    style={{ borderColor: form.debit ? '#22c55e40' : colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: '#22c55e' }}
                    placeholder="0.00" />
                </div>
                <div className="flex-1">
                  <label className="text-[12px] font-bold font-mono uppercase mb-1 block" style={{ color: '#ef4444' }}>HABER</label>
                  <input type="number" step="0.01" min="0" value={form.credit} onChange={e => setForm(prev => ({ ...prev, credit: e.target.value, debit: e.target.value ? '' : prev.debit }))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] font-mono outline-none"
                    style={{ borderColor: form.credit ? '#ef444440' : colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: '#ef4444' }}
                    placeholder="0.00" />
                </div>
              </div>
              {form.debit && form.credit && (
                <p className="text-[11px] font-mono" style={{ color: '#f59e0b' }}>⚠ No puede tener DEBE y HABER al mismo tiempo</p>
              )}
            </div>
            <div className="px-5 py-3 flex gap-2" style={{ borderTop: `1px solid ${colors.border}` }}>
              <button onClick={() => setShowForm(false)} className="flex-1 text-[13px] py-2 rounded-lg font-medium cursor-pointer"
                style={{ background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>Cancelar</button>
              <button onClick={handleSave} disabled={!form.desc || !form.account || (!form.debit && !form.credit)}
                className="flex-1 text-[13px] py-2 rounded-lg font-bold cursor-pointer disabled:opacity-50"
                style={{ background: colors.primary, color: '#1B2632' }}>{editEntry ? 'Guardar' : 'Crear asiento'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
