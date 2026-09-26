// PaginaPolizasPrueba — página pública para practicar pólizas sin cuenta.
// Sin login: casos, semillas y cálculo van por /api/sim/polizas/pub;
// guardar es local a la sesión (folio PRUEBA-). Cero LLM.
import PolizaSim from './PolizaSim';
import { ContalinkStyles } from './ContalinkStyles';

export default function PaginaPolizasPrueba() {
  return (
    <div className="clk-shell" style={{ minHeight: '100vh' }}>
      <ContalinkStyles />
      <header className="clk-header" style={{ gap: 8, fontSize: 13 }}>
        <span style={{ fontWeight: 800, color: '#1e40af' }}>🔗 contalink</span>
        <span style={{ color: '#64748b' }}>Pólizas · prueba libre</span>
      </header>
      <main className="clk-content" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <PolizaSim publico />
      </main>
    </div>
  );
}
