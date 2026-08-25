import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface Tip { icon: string; text: string; }

const TIPS: Record<string, Tip[]> = {
  cfdi: [
    { icon: '💡', text: 'El RFC del emisor SIEMPRE va en el campo "RFC Emisor" del portal.' },
    { icon: '💡', text: 'El IVA se calcula sobre el SUBTOTAL, no sobre el total.' },
    { icon: '⚠️', text: 'Si el RFC tiene una letra mal, el SAT rechaza la factura.' },
  ],
  gastos: [
    { icon: '💡', text: 'En restaurantes solo el 65% del consumo es deducible.' },
    { icon: '⚠️', text: 'La propina NUNCA es deducible ni genera IVA acreditable.' },
    { icon: '💡', text: 'LISR art. 28 fracc. XV regula la deducción de restaurantes.' },
  ],
  cobranza: [
    { icon: '💡', text: 'Cruza el nombre del remitente del SPEI contra la factura.' },
    { icon: '⚠️', text: 'No apliques el pago del cliente A a la factura de B.' },
    { icon: '💡', text: 'Saldo pendiente = total de factura - monto recibido.' },
  ],
  proveedores: [
    { icon: '💡', text: 'Un CFDI de proveedor te permite acreditar el IVA.' },
    { icon: '💡', text: 'Valida que el RFC del proveedor sea válido y el IVA sea 16%.' },
    { icon: '⚠️', text: 'El IVA acreditable reduce lo que pagas de IVA al SAT.' },
  ],
  nomina: [
    { icon: '⚠️', text: 'El ISR se calcula con TABLA PROGRESIVA del SAT, no con 15% fijo.' },
    { icon: '💡', text: 'Neto = Bruto - ISR - IMSS - otras retenciones.' },
    { icon: '💡', text: 'El IMSS es la cuota del trabajador (5%).' },
  ],
  conciliacion: [
    { icon: '💡', text: 'Saldo conciliado = banco + depósitos en tránsito - cheques sin cobrar.' },
    { icon: '⚠️', text: 'Las ventas con tarjeta NO afectan el efectivo de la caja.' },
    { icon: '💡', text: 'Si la diferencia es mayor a $100, hay un descuadre que reportar.' },
  ],
};

interface QuickTipsProps {
  theme: Theme;
  moduleId?: string;
}

export default function QuickTips({ theme, moduleId }: QuickTipsProps) {
  const colors = themeColors[theme];
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="px-2 py-1 rounded-lg border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
        style={{ borderColor: '#3b82f6', background: '#3b82f6', color: '#fff' }}>
        ⚡ Consejos
      </button>
    );
  }

  const tips = TIPS[moduleId || 'cfdi'] || TIPS.cfdi;

  return (
    <div className="rounded-xl border-2 p-3 mb-3" style={{ borderColor: '#3b82f650', background: '#3b82f610' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold font-mono" style={{ color: '#3b82f6' }}>⚡ Consejos y atajos</span>
        <button onClick={() => setShow(false)} className="text-[10px] cursor-pointer" style={{ color: colors.textMuted }}>✕</button>
      </div>
      <div className="space-y-1.5">
        {tips.map((t, i) => (
          <div key={i} className="text-[10px] flex items-start gap-1.5" style={{ color: colors.text }}>
            <span>{t.icon}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}