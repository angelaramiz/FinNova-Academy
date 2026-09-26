// ContalinkStyles — CSS compartido del shell claro Contalink.
// Lo usa ContalinkShell y cualquier página que monte Sims sin el shell
// (ej. PaginaPolizasPrueba). Fuente única: no duplicar a mano.
export const CONTALINK_CSS = `
        .clk-shell { background: #f8fafc; color-scheme: light; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; min-height: 70vh; height: 100%; font-family: 'Inter', system-ui, sans-serif; }
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
      `;

export function ContalinkStyles() {
  return <style>{CONTALINK_CSS}</style>;
}
