import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

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
  const journal = genJournal();

  const modules = [
    { id: 'diario' as Module, icon: '📋', label: 'Libro Diario' },
    { id: 'cuentas' as Module, icon: '📚', label: 'Catálogo de Cuentas' },
    { id: 'clientes' as Module, icon: '👥', label: 'Clientes' },
    { id: 'proveedores' as Module, icon: '🚛', label: 'Proveedores' },
    { id: 'reportes' as Module, icon: '📊', label: 'Reportes' },
  ];

  const totalDebe = journal.reduce((s, e) => s + e.debit, 0);
  const totalHaber = journal.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="flex h-full" style={{ background: colors.bg }}>
      {/* Left Sidebar (Odoo-style) */}
      <div className="w-48 shrink-0 border-r-2 flex flex-col" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f0f4f8' }}>
        <div className="px-4 py-3 border-b-2" style={{ borderColor: colors.border }}>
          <button onClick={onBack} className="text-[9px] px-2 py-1 rounded border cursor-pointer hover:opacity-70 mb-2 inline-block" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>← Escritorio</button>
          <p className="text-xs font-bold" style={{ color: colors.text }}>📊 Contabilidad</p>
          <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>Operadora del Norte</p>
        </div>
        <div className="flex-1 overflow-auto py-2">
          {modules.map(m => (
            <button key={m.id} onClick={() => setMod(m.id)}
              className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-[10px] font-mono cursor-pointer hover:opacity-80 transition"
              style={{ color: mod === m.id ? colors.primary : colors.textMuted, background: mod === m.id ? (isDark ? 'rgba(255,177,98,0.1)' : 'rgba(255,177,98,0.15)') : 'transparent', borderLeft: mod === m.id ? `3px solid ${colors.primary}` : '3px solid transparent' }}>
              <span className="text-sm">{m.icon}</span>
              <span className="font-bold">{m.label}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t-2 text-[7px] font-mono" style={{ borderColor: colors.border, color: colors.textMuted }}>
          Simulador v0.1 · Julio 2026
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b-2 flex items-center justify-between shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono uppercase tracking-wider" style={{ color: colors.primary }}>{modules.find(m => m.id === mod)?.icon} {modules.find(m => m.id === mod)?.label}</span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: colors.cardBg, color: colors.textMuted }}>{mod === 'diario' ? journal.length : mod === 'cuentas' ? ACCOUNTS.length : mod === 'clientes' ? CLIENTS.length : mod === 'proveedores' ? SUPPLIERS.length : '—'} registros</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-mono" style={{ color: colors.textMuted }}>
            <span>Crear</span>
            <span>Importar</span>
            <span>Exportar</span>
          </div>
        </div>

        {/* Module content */}
        <div className="flex-1 overflow-auto">
          {mod === 'diario' && (
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                  <th className="px-4 py-2 text-[8px] font-mono uppercase" style={{ color: colors.textMuted }}>Fecha</th>
                  <th className="px-4 py-2 text-[8px] font-mono uppercase" style={{ color: colors.textMuted }}>Ref</th>
                  <th className="px-4 py-2 text-[8px] font-mono uppercase" style={{ color: colors.textMuted }}>Descripción</th>
                  <th className="px-4 py-2 text-[8px] font-mono uppercase" style={{ color: colors.textMuted }}>Cuenta</th>
                  <th className="px-4 py-2 text-[8px] font-mono uppercase text-right" style={{ color: '#22c55e' }}>Debe</th>
                  <th className="px-4 py-2 text-[8px] font-mono uppercase text-right" style={{ color: '#ef4444' }}>Haber</th>
                  <th className="px-4 py-2 text-[8px] font-mono uppercase" style={{ color: colors.textMuted }}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((e, i) => (
                  <tr key={i} className="hover:opacity-80" style={{ borderBottom: `1px solid ${colors.border}30` }}>
                    <td className="px-4 py-2 text-[9px] font-mono" style={{ color: colors.text }}>{e.date}</td>
                    <td className="px-4 py-2 text-[9px] font-mono font-bold" style={{ color: colors.primary }}>{e.ref}</td>
                    <td className="px-4 py-2 text-[9px]" style={{ color: colors.text }}>{e.desc}</td>
                    <td className="px-4 py-2 text-[9px] font-mono" style={{ color: colors.textMuted }}>{e.account}</td>
                    <td className="px-4 py-2 text-[9px] font-mono text-right" style={{ color: e.debit > 0 ? '#22c55e' : colors.textMuted }}>{e.debit > 0 ? `$${fmt(e.debit)}` : ''}</td>
                    <td className="px-4 py-2 text-[9px] font-mono text-right" style={{ color: e.credit > 0 ? '#ef4444' : colors.textMuted }}>{e.credit > 0 ? `$${fmt(e.credit)}` : ''}</td>
                    <td className="px-4 py-2"><span className="text-[7px] font-bold px-1.5 py-0.5 rounded" style={{ background: colors.primary + '20', color: colors.primary }}>{e.type}</span></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: isDark ? 'rgba(255,177,98,0.1)' : 'rgba(255,177,98,0.1)', borderTop: `2px solid ${colors.primary}` }}>
                  <td colSpan={4} className="px-4 py-2 text-[9px] font-bold text-right" style={{ color: colors.text }}>TOTALES:</td>
                  <td className="px-4 py-2 text-[9px] font-bold text-right" style={{ color: '#22c55e' }}>${fmt(totalDebe)}</td>
                  <td className="px-4 py-2 text-[9px] font-bold text-right" style={{ color: '#ef4444' }}>${fmt(totalHaber)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}

          {mod === 'cuentas' && (
            <div className="overflow-auto">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                    <th className="px-4 py-2 text-[8px] font-mono uppercase" style={{ color: colors.textMuted }}>Código</th>
                    <th className="px-4 py-2 text-[8px] font-mono uppercase" style={{ color: colors.textMuted }}>Cuenta</th>
                    <th className="px-4 py-2 text-[8px] font-mono uppercase" style={{ color: colors.textMuted }}>Tipo</th>
                    <th className="px-4 py-2 text-[8px] font-mono uppercase text-right" style={{ color: colors.text }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {ACCOUNTS.map(a => (
                    <tr key={a.code} className="hover:opacity-80" style={{ borderBottom: `1px solid ${colors.border}30` }}>
                      <td className="px-4 py-2 text-[9px] font-mono font-bold" style={{ color: colors.primary }}>{a.code}</td>
                      <td className="px-4 py-2 text-[9px]" style={{ color: colors.text }}>{a.name}</td>
                      <td className="px-4 py-2">
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded" style={{ background: a.type === 'Activo' ? '#22c55e20' : a.type === 'Pasivo' ? '#ef444420' : a.type === 'Capital' ? '#8b5cf620' : '#f59e0b20', color: a.type === 'Activo' ? '#22c55e' : a.type === 'Pasivo' ? '#ef4444' : a.type === 'Capital' ? '#8b5cf6' : '#f59e0b' }}>
                          {a.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[9px] font-mono text-right font-bold" style={{ color: a.balance >= 0 ? '#22c55e' : '#ef4444' }}>{a.balance >= 0 ? `$${fmt(a.balance)}` : `-$${fmt(Math.abs(a.balance))}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mod === 'clientes' && (
            <div className="p-4 space-y-2">
              {CLIENTS.map(c => (
                <div key={c.name} className="p-4 rounded-xl border-2 flex items-center justify-between" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: colors.primary, color: '#1B2632' }}>{c.name.charAt(0)}</div>
                    <div>
                      <p className="text-[10px] font-bold" style={{ color: colors.text }}>{c.name}</p>
                      <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{c.rfc} · {c.invoices} facturas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: c.balance > 0 ? '#22c55e' : colors.textMuted }}>{c.balance > 0 ? `$${fmt(c.balance)}` : `$0`}</p>
                    <p className="text-[7px] font-mono" style={{ color: colors.textMuted }}>Saldo pendiente</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mod === 'proveedores' && (
            <div className="p-4 space-y-2">
              {SUPPLIERS.map(s => (
                <div key={s.name} className="p-4 rounded-xl border-2 flex items-center justify-between" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: colors.secondary, color: '#fff' }}>{s.name.charAt(0)}</div>
                    <div>
                      <p className="text-[10px] font-bold" style={{ color: colors.text }}>{s.name}</p>
                      <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{s.rfc} · {s.invoices} facturas recibidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: '#ef4444' }}>${fmt(s.balance)}</p>
                    <p className="text-[7px] font-mono" style={{ color: colors.textMuted }}>Por pagar</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mod === 'reportes' && (
            <div className="p-6 max-w-2xl mx-auto space-y-6">
              <h2 className="text-sm font-bold text-center" style={{ color: colors.text }}>📊 Reportes Financieros</h2>
              <div className="p-5 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <p className="text-[10px] font-bold mb-3" style={{ color: colors.text }}>Balanza de Comprobación — Julio 2026</p>
                <table className="w-full text-[9px]">
                  <thead><tr className="border-b" style={{ borderColor: colors.border }}><th style={{ color: colors.textMuted }} className="text-left py-1">Tipo</th><th style={{ color: colors.textMuted }} className="text-right py-1">Saldo</th></tr></thead>
                  <tbody>
                    {['Activo','Pasivo','Capital','Ingreso','Gasto'].map(type => {
                      const total = ACCOUNTS.filter(a => a.type === type).reduce((s, a) => s + Math.abs(a.balance), 0);
                      return (
                        <tr key={type} className="border-b" style={{ borderColor: colors.border + '30' }}>
                          <td className="py-1.5 font-bold" style={{ color: colors.text }}>{type}</td>
                          <td className="py-1.5 text-right font-mono" style={{ color: colors.text }}>${fmt(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-5 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <p className="text-[10px] font-bold mb-3" style={{ color: colors.text }}>📈 Estado de Resultados — Julio 2026</p>
                <div className="space-y-1 text-[9px]">
                  <div className="flex justify-between"><span style={{ color: colors.textMuted }}>Ventas totales</span><span className="font-mono font-bold" style={{ color: '#22c55e' }}>$380,000.00</span></div>
                  <div className="flex justify-between"><span style={{ color: colors.textMuted }}>(-) Compras</span><span className="font-mono" style={{ color: '#ef4444' }}>$180,000.00</span></div>
                  <div className="flex justify-between"><span style={{ color: colors.textMuted }}>(-) Gastos operativos</span><span className="font-mono" style={{ color: '#ef4444' }}>$105,500.00</span></div>
                  <div className="flex justify-between border-t pt-1 mt-1" style={{ borderColor: colors.border }}>
                    <span className="font-bold" style={{ color: colors.text }}>Utilidad neta</span>
                    <span className="font-mono font-bold text-base" style={{ color: colors.primary }}>$94,500.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-4 py-1.5 border-t-2 flex items-center justify-between text-[7px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
          <span style={{ color: colors.textMuted }}>Sistema Contable · Operadora del Norte S.A. de C.V.</span>
          <span style={{ color: colors.textMuted }}>Julio 2026</span>
        </div>
      </div>
    </div>
  );
}
