import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface SatPortalProps {
  theme: Theme;
  invoiceData?: any;
  onSubmit?: (formData: Record<string, any>) => void;
}

export default function SatPortal({ theme, invoiceData, onSubmit }: SatPortalProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [step, setStep] = useState<'fill' | 'preview' | 'stamp' | 'done'>('fill');
  const [form, setForm] = useState({
    rfcEmisor: invoiceData?.clientRfc || '',
    razonSocial: invoiceData?.client || '',
    rfcReceptor: 'OLN-220701-ABC',
    usoCFDI: 'D03',
    regimenFiscal: '601',
    metodoPago: 'PUE',
    formaPago: '03',
    subtotal: invoiceData?.subtotal || 0,
    iva: invoiceData?.iva || 0,
    total: invoiceData?.total || 0,
  });

  function handleSubmit() {
    setStep('preview');
  }

  function handleStamp() {
    setStep('stamp');
    setTimeout(() => setStep('done'), 2000);
  }

  if (step === 'done') {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-[14px] font-bold mb-2" style={{ color: '#22c55e' }}>CFDI Timbrado exitosamente</h3>
        <p className="text-[11px] mb-3" style={{ color: colors.textMuted }}>UUID: {`${Math.floor(Math.random()*90000000)+10000000}-4321-ABCD-1234-${Math.floor(Math.random()*900000000000)+100000000000}`}</p>
        <p className="text-[10px]" style={{ color: colors.textMuted }}>El CFDI ha sido registrado ante el SAT y está listo para enviarse al cliente.</p>
        <button onClick={() => onSubmit?.(form)} className="mt-4 px-6 py-2 rounded-xl text-[11px] font-bold cursor-pointer" style={{ background: colors.primary, color: '#1B2632' }}>Continuar →</button>
      </div>
    );
  }

  if (step === 'stamp') {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3 animate-pulse">⏳</div>
        <h3 className="text-[14px] font-bold mb-2" style={{ color: colors.text }}>Timbrando CFDI...</h3>
        <p className="text-[11px]" style={{ color: colors.textMuted }}>Conectando con el SAT para validar y timbrar el comprobante fiscal...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-[12px] font-bold font-mono mb-3" style={{ color: colors.text }}>🌐 Portal SAT — Facturación electrónica</h3>

      {step === 'fill' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold block mb-1" style={{ color: colors.textMuted }}>RFC Emisor (proveedor)</label>
              <input value={form.rfcEmisor} onChange={e => setForm({...form, rfcEmisor: e.target.value})}
                className="w-full px-2 py-1.5 rounded border text-[11px] font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }} />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold block mb-1" style={{ color: colors.textMuted }}>Razón Social</label>
              <input value={form.razonSocial} onChange={e => setForm({...form, razonSocial: e.target.value})}
                className="w-full px-2 py-1.5 rounded border text-[11px] font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold block mb-1" style={{ color: colors.textMuted }}>RFC Receptor (tu empresa)</label>
              <input value={form.rfcReceptor} disabled className="w-full px-2 py-1.5 rounded border text-[11px] font-mono opacity-70" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : '#f0f0f0', color: colors.text }} />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold block mb-1" style={{ color: colors.textMuted }}>Uso CFDI</label>
              <select value={form.usoCFDI} onChange={e => setForm({...form, usoCFDI: e.target.value})}
                className="w-full px-2 py-1.5 rounded border text-[11px] font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }}>
                <option value="D03">D03 — Gastos en general</option>
                <option value="G01">G01 — Adquisición de mercancías</option>
                <option value="G03">G03 — Gastos en general</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold block mb-1" style={{ color: colors.textMuted }}>Régimen fiscal</label>
              <select value={form.regimenFiscal} onChange={e => setForm({...form, regimenFiscal: e.target.value})}
                className="w-full px-2 py-1.5 rounded border text-[11px] font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }}>
                <option value="601">601 — General de Ley</option>
                <option value="612">612 — Personas Físicas</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold block mb-1" style={{ color: colors.textMuted }}>Método de pago</label>
              <select value={form.metodoPago} onChange={e => setForm({...form, metodoPago: e.target.value})}
                className="w-full px-2 py-1.5 rounded border text-[11px] font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }}>
                <option value="PUE">PUE — Pago en una sola exhibición</option>
                <option value="PPD">PPD — Pago en parcialidades</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold block mb-1" style={{ color: colors.textMuted }}>Forma de pago</label>
              <select value={form.formaPago} onChange={e => setForm({...form, formaPago: e.target.value})}
                className="w-full px-2 py-1.5 rounded border text-[11px] font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text }}>
                <option value="03">03 — Transferencia SPEI</option>
                <option value="01">01 — Efectivo</option>
                <option value="04">04 — Tarjeta de crédito</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 rounded border" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.1)' : '#f8fafc' }}>
              <p className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Subtotal</p>
              <p className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>${form.subtotal.toLocaleString('es-MX', {minimumFractionDigits:2})}</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.1)' : '#f8fafc' }}>
              <p className="text-[9px] font-mono" style={{ color: colors.textMuted }}>IVA (16%)</p>
              <p className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>${form.iva.toLocaleString('es-MX', {minimumFractionDigits:2})}</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: '#22c55e', background: '#22c55e10' }}>
              <p className="text-[9px] font-mono font-bold" style={{ color: '#22c55e' }}>TOTAL</p>
              <p className="text-[14px] font-bold font-mono" style={{ color: '#22c55e' }}>${form.total.toLocaleString('es-MX', {minimumFractionDigits:2})}</p>
            </div>
          </div>
          <button onClick={handleSubmit} className="w-full py-2 rounded-xl text-[11px] font-bold cursor-pointer" style={{ background: colors.primary, color: '#1B2632' }}>Vista previa del CFDI →</button>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl border" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : '#fff' }}>
            <p className="text-[10px] font-mono font-bold mb-2" style={{ color: colors.text }}>Vista previa del CFDI</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div><span style={{ color: colors.textMuted }}>Emisor:</span> <span style={{ color: colors.text }}>{form.rfcEmisor}</span></div>
              <div><span style={{ color: colors.textMuted }}>Receptor:</span> <span style={{ color: colors.text }}>{form.rfcReceptor}</span></div>
              <div><span style={{ color: colors.textMuted }}>Uso CFDI:</span> <span style={{ color: colors.text }}>{form.usoCFDI}</span></div>
              <div><span style={{ color: colors.textMuted }}>Régimen:</span> <span style={{ color: colors.text }}>{form.regimenFiscal}</span></div>
              <div><span style={{ color: colors.textMuted }}>Método:</span> <span style={{ color: colors.text }}>{form.metodoPago}</span></div>
              <div><span style={{ color: colors.textMuted }}>Total:</span> <span className="font-bold" style={{ color: '#22c55e' }}>${form.total.toLocaleString('es-MX', {minimumFractionDigits:2})}</span></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('fill')} className="flex-1 py-2 rounded-xl border text-[11px] font-bold cursor-pointer" style={{ borderColor: colors.border, color: colors.textMuted }}>← Editar</button>
            <button onClick={handleStamp} className="flex-1 py-2 rounded-xl text-[11px] font-bold cursor-pointer" style={{ background: '#22c55e', color: '#fff' }}>Timbrar ante el SAT ✓</button>
          </div>
        </div>
      )}
    </div>
  );
}
