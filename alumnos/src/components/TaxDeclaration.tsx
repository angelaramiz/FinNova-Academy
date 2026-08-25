import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface TaxDeclarationProps {
  theme: Theme;
  onBack: () => void;
}

export default function TaxDeclaration({ theme, onBack }: TaxDeclarationProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/sim/documents/tax_declaration?format=json')
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center"><div className="animate-pulse text-[11px]" style={{ color: colors.textMuted }}>Cargando declaración...</div></div>;
  if (!data) return <div className="p-6 text-center"><p className="text-[11px]" style={{ color: colors.textMuted }}>Error al cargar declaración</p></div>;

  const utilidad = data.utilidadOperativa || 0;
  const total = data.totalImpuestos || 0;
  const neta = data.utilidadNeta || 0;

  return (
    <div className="h-full overflow-auto p-4">
      <button onClick={onBack} className="text-[11px] font-mono mb-3 cursor-pointer" style={{ color: colors.textMuted }}>← Volver</button>

      <div className="rounded-2xl border-2 p-5 mb-4" style={{ borderColor: '#ef444450', background: '#ef444410' }}>
        <h3 className="text-[14px] font-bold mb-1" style={{ color: '#ef4444' }}>📋 Declaración de Impuestos — {data.period}</h3>
        <p className="text-[11px]" style={{ color: colors.textMuted }}>Resumen fiscal del mes. ISR 30% + IVA por pagar.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border-2 p-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
          <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>Ventas netas</p>
          <p className="text-[16px] font-bold font-mono" style={{ color: colors.text }}>${(data.ventasNetas||0).toLocaleString('es-MX')}</p>
        </div>
        <div className="rounded-xl border-2 p-4" style={{ borderColor: '#22c55e50', background: '#22c55e10' }}>
          <p className="text-[10px] font-mono" style={{ color: '#22c55e' }}>Utilidad de operación</p>
          <p className="text-[16px] font-bold font-mono" style={{ color: '#22c55e' }}>${utilidad.toLocaleString('es-MX')}</p>
        </div>
      </div>

      <div className="rounded-xl border-2 p-4 mb-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <h4 className="text-[12px] font-bold mb-3" style={{ color: colors.text }}>Impuestos a pagar</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span style={{ color: colors.textMuted }}>IVA por pagar (cobrado - pagado)</span>
            <span className="font-mono font-bold" style={{ color: colors.text }}>${(data.ivaPorPagar||0).toLocaleString('es-MX')}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span style={{ color: colors.textMuted }}>ISR (30% sobre utilidad)</span>
            <span className="font-mono font-bold" style={{ color: colors.text }}>${(data.isrPorPagar||0).toLocaleString('es-MX')}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-[13px] font-bold">
            <span style={{ color: '#ef4444' }}>TOTAL IMPUESTOS</span>
            <span className="font-mono" style={{ color: '#ef4444' }}>${total.toLocaleString('es-MX')}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 p-4" style={{ borderColor: '#22c55e50', background: '#22c55e10' }}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-mono" style={{ color: '#22c55e' }}>UTILIDAD NETA DEL MES</p>
            <p className="text-[20px] font-bold font-mono" style={{ color: '#22c55e' }}>${neta.toLocaleString('es-MX')}</p>
          </div>
          <div className="text-3xl">{neta > 0 ? '📈' : '📉'}</div>
        </div>
        <p className="text-[10px] mt-2" style={{ color: colors.textMuted }}>
          {neta > 0 ? 'La empresa tuvo utilidad este mes. ¡Buen trabajo!' : 'La empresa tuvo pérdidas este mes. Revisa los gastos.'}
        </p>
      </div>
    </div>
  );
}
