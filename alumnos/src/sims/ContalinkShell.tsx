// ContalinkShell — chrome común ContaLink OS claro (clon visual de
// contex_Font/mas.html). Un solo sistema para los 5 submódulos: header con
// logo, sidebar (Principal / Módulos Contables / Fiscal + buscador Anexo 24
// decorativo), topbar breadcrumb + usuario "Angel Aramiz · Practicante".
// El contenido monta el Sim correspondiente; DIOT monta el iframe existente
// (ContalinkFrame src="/sims/diot.html"). Tema CLARO siempre.
import { useState } from 'react';
import { ContalinkStyles } from './ContalinkStyles';
import ConciliacionSim from './ConciliacionSim';
import AuditoriaSim from './AuditoriaSim';
import NominaSim from './NominaSim';
import PolizaSim from './PolizaSim';
import ContalinkFrame from './ContalinkFrame';

export type ModuloContalink = 'conciliacion' | 'diot' | 'nomina' | 'auditoria' | 'poliza';

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
  poliza: 'Pólizas',
};

const NAV_MODULOS: { id: ModuloContalink; label: string; icon: string }[] = [
  { id: 'conciliacion', label: 'Conciliación Bancaria', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'diot', label: 'DIOT', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'nomina', label: 'Nómina', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'auditoria', label: 'Auditoría Contable', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'poliza', label: 'Pólizas', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
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
      <ContalinkStyles />
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
            {modulo === 'poliza' && <PolizaSim />}
          </div>
        </div>
      </div>
    </div>
  );
}
