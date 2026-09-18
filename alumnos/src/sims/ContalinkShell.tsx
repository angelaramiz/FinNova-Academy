// ContalinkShell — chrome común ContaLink OS claro (clon visual de
// contex_Font/mas.html). Un solo sistema para los 4 submódulos: header con
// logo, sidebar (Principal / Módulos Contables / Fiscal + buscador Anexo 24
// decorativo), topbar breadcrumb + usuario "Angel Aramiz · Practicante".
// El contenido monta el Sim correspondiente; DIOT monta el iframe existente
// (ContalinkFrame src="/sims/diot.html"). Tema CLARO siempre.
import { useState } from 'react';
import ConciliacionSim from './ConciliacionSim';
import AuditoriaSim from './AuditoriaSim';
import NominaSim from './NominaSim';
import ContalinkFrame from './ContalinkFrame';

export type ModuloContalink = 'conciliacion' | 'diot' | 'nomina' | 'auditoria';

interface Props {
  modulo: ModuloContalink;
  onCambiar: (m: ModuloContalink) => void;
  onDiotCompletado?: (info: { mode: string; score: number }) => void;
}

const ETIQUETAS: Record<ModuloContalink, string> = {
  conciliacion: 'Conciliación Bancaria',
  diot: 'DIOT',
  nomina: 'Nómina',
  auditoria: 'Auditoría Contable',
};

const NAV_MODULOS: { id: ModuloContalink; label: string; icon: string }[] = [
  { id: 'conciliacion', label: 'Conciliación Bancaria', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'diot', label: 'DIOT', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'nomina', label: 'Nómina', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'auditoria', label: 'Auditoría Contable', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

export default function ContalinkShell({ modulo, onCambiar, onDiotCompletado }: Props) {
  const [colapsado, setColapsado] = useState<boolean>(() => {
    try { return localStorage.getItem('contalink_sidebar') === '0'; } catch { return false; }
  });
  function alternar() {
    setColapsado((c) => {
      try { localStorage.setItem('contalink_sidebar', c ? '1' : '0'); } catch { /* sin storage */ }
      return !c;
    });
  }
  return (
    <div className="clk-shell">
      <style>{`
        .clk-shell { background: #f8fafc; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; min-height: 70vh; height: 100%; font-family: 'Inter', system-ui, sans-serif; }
        .clk-header { background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 16px; height: 52px; flex-shrink: 0; }
        .clk-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #1e40af; font-size: 16px; }
        .clk-logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #1e40af, #3b82f6); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .clk-body { flex: 1; display: flex; overflow: hidden; min-height: 0; }
        .clk-sidebar { width: 260px; background: white; border-right: 1px solid #e2e8f0; overflow-y: auto; padding: 16px 0; flex-shrink: 0; transition: width 0.2s ease; }
        .clk-sidebar.collapsed { width: 60px; }
        .clk-sidebar.collapsed .clk-nav-section { display: none; }
        .clk-sidebar.collapsed .clk-nav-item { justify-content: center; padding: 10px 0; }
        .clk-sidebar.collapsed .clk-nav-item span { display: none; }
        .clk-sidebar.collapsed .clk-search { display: none; }
        .clk-toggle { background: white; border: 1px solid #e2e8f0; border-radius: 6px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; flex-shrink: 0; }
        .clk-toggle:hover { background: #f1f5f9; color: #1e40af; }
        .clk-nav-section { padding: 8px 16px; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; }
        .clk-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; color: #475569; cursor: pointer; transition: all 0.15s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; }
        .clk-nav-item:hover { background: #f1f5f9; color: #1e40af; }
        .clk-nav-item.active { background: #eff6ff; color: #1e40af; border-left-color: #1e40af; font-weight: 600; }
        .clk-nav-item.disabled { opacity: 0.55; cursor: default; }
        .clk-nav-item.disabled:hover { background: none; color: #475569; }
        .clk-main { flex: 1; overflow-y: auto; background: #f8fafc; min-width: 0; }
        .clk-topbar { background: white; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 5; }
        .clk-breadcrumb { font-size: 13px; color: #64748b; }
        .clk-breadcrumb span { color: #1e40af; font-weight: 600; }
        .clk-user { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #475569; }
        .clk-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; }
        .clk-content { padding: 24px; }
        .clk-search { margin: 8px 16px 0; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #64748b; background: #f8fafc; }
        .clk-shell .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
        .clk-shell .stat-value { font-size: 22px; font-weight: 700; color: #1e293b; }
        .clk-shell .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
        .clk-shell .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .clk-shell .data-table th { background: #f8fafc; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; font-size: 11px; }
        .clk-shell .data-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
        .clk-shell .data-table tr:hover { background: #f8fafc; }
        .clk-shell .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .clk-shell .status-ok { background: #d1fae5; color: #065f46; }
        .clk-shell .status-error { background: #fee2e2; color: #991b1b; }
        .clk-shell .status-warning { background: #fef3c7; color: #92400e; }
        .clk-shell .status-info { background: #dbeafe; color: #1e40af; }
        .clk-shell .status-pending { background: #f3e8ff; color: #6b21a8; }
        .clk-shell .status-timbrado { background: #d1fae5; color: #065f46; }
        .clk-shell .theory-box { background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 12px 0; }
        .clk-shell .theory-box-title { font-size: 11px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
        .clk-shell .theory-box-text { font-size: 12px; color: #78350f; line-height: 1.5; }
        .clk-shell .reference-box { background: #eff6ff; border-left: 4px solid #1e40af; padding: 8px 12px; border-radius: 6px; margin: 12px 0; font-size: 11px; color: #1e40af; font-weight: 500; }
        .clk-shell .btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 6px; }
        .clk-shell .btn-primary { background: #1e40af; color: white; }
        .clk-shell .btn-primary:hover { background: #1e3a8a; }
        .clk-shell .btn-success { background: #10b981; color: white; }
        .clk-shell .btn-success:hover { background: #059669; }
        .clk-shell .btn-purple { background: #7c3aed; color: white; }
        .clk-shell .btn-purple:hover { background: #6d28d9; }
        .clk-shell .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .clk-shell .btn-secondary:hover { background: #e2e8f0; }
        .clk-shell .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .clk-shell .tab-btn { padding: 12px 20px; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; background: none; border-top: none; border-left: none; border-right: none; }
        .clk-shell .tab-btn:hover { color: #1e40af; }
        .clk-shell .tab-btn.active { color: #1e40af; border-bottom-color: #1e40af; font-weight: 600; }
        .clk-shell .mode-card { background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; }
        .clk-shell .mode-card:hover { border-color: #1e40af; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
        .clk-shell .fade-in { animation: clkFadeIn 0.3s ease-out; }
        @keyframes clkFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .clk-shell ::-webkit-scrollbar { width: 8px; height: 8px; }
        .clk-shell ::-webkit-scrollbar-track { background: #f1f5f9; }
        .clk-shell ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .clk-shell ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <div className="clk-header">
        <div className="clk-logo">
          <div className="clk-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <span>contalink</span>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>| Simulador Educativo</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
        </div>
      </div>
      <div className="clk-body">
        <div className={`clk-sidebar ${colapsado ? 'collapsed' : ''}`}>
          <div className="clk-nav-section">Principal</div>
          <button className="clk-nav-item disabled" title="Dashboard (próximamente)" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span>Dashboard</span>
          </button>
          <div className="clk-nav-section">Módulos Contables</div>
          {NAV_MODULOS.map((item) => (
            <button
              key={item.id}
              className={`clk-nav-item ${modulo === item.id ? 'active' : ''}`}
              title={item.label}
              onClick={() => { if (modulo !== item.id) onCambiar(item.id); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="clk-nav-section">Fiscal</div>
          <button className="clk-nav-item disabled" title="Declaraciones Automáticas (próximamente)" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span>Declaraciones Automáticas</span>
          </button>
          <div className="clk-search">🔍 Buscar cuenta Anexo 24…</div>
        </div>
        <div className="clk-main">
          <div className="clk-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="clk-toggle" onClick={alternar} title={colapsado ? 'Expandir menú' : 'Retraer menú'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="clk-breadcrumb">Contabilidad / <span>{ETIQUETAS[modulo]}</span></div>
            </div>
            <div className="clk-user">
              <div className="clk-avatar">AA</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12 }}>Angel Aramiz</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Practicante</div>
              </div>
            </div>
          </div>
          <div className="clk-content">
            {modulo === 'diot' && (
              <ContalinkFrame src="/sims/diot.html" title="DIOT Contalink" onCompletado={onDiotCompletado} />
            )}
            {modulo === 'conciliacion' && <ConciliacionSim />}
            {modulo === 'nomina' && <NominaSim />}
            {modulo === 'auditoria' && <AuditoriaSim />}
          </div>
        </div>
      </div>
    </div>
  );
}
