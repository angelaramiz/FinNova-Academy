// PaginaPolizasPrueba — página pública para practicar pólizas sin cuenta.
// Sin login: casos, semillas y cálculo van por /api/sim/polizas/pub;
// guardar es local a la sesión (folio PRUEBA-). Cero LLM.
import PolizaSim from './PolizaSim';

export default function PaginaPolizasPrueba() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span style={{ fontWeight: 800, color: '#1e40af' }}>🔗 contalink</span>
        <span style={{ color: '#64748b' }}>Pólizas · prueba libre</span>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
        <PolizaSim publico />
      </main>
    </div>
  );
}
