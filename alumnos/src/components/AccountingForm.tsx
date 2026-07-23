import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'choice';
  options?: string[];
  correct?: any;
  hint?: string;
}

interface FormData {
  fields: FormField[];
}

interface AccountingFormProps {
  formData: FormData;
  onSubmit: (answers: Record<string, any>) => void;
  theme: Theme;
  loading?: boolean;
}

export default function AccountingForm({ formData, onSubmit, theme, loading }: AccountingFormProps) {
  const colors = themeColors[theme];
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize defaults for choice fields
    const defaults: Record<string, any> = {};
    formData.fields.forEach(f => {
      if (f.type === 'choice' && f.options?.length) {
        defaults[f.key] = answers[f.key] || '';
      }
      if (f.type === 'number') {
        defaults[f.key] = answers[f.key] ?? '';
      }
    });
    if (Object.keys(defaults).length) setAnswers(prev => ({ ...defaults, ...prev }));
  }, []);

  function handleChange(key: string, value: any) {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validate all fields filled
    const newErrors: Record<string, string> = {};
    formData.fields.forEach(f => {
      const val = answers[f.key];
      if (val === undefined || val === '' || val === null) {
        newErrors[f.key] = 'Campo requerido';
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(answers);
  }

  const isDark = theme === 'dark';

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: colors.bg }}>📋</div>
          <span className="text-[10px] font-bold font-mono" style={{ color: colors.text }}>Sistema Contable</span>
        </div>
        <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>Nuevo registro</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">
        {formData.fields.map(field => (
          <div key={field.key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold font-mono uppercase tracking-wider" style={{ color: colors.text }}>
                {field.label}
                {field.key === 'subtotal' || field.key === 'iva' || field.key === 'total' || field.key === 'outstandingBalance' ? (
                  <span className="ml-1.5 text-[8px] font-mono" style={{ color: colors.primary }}>(calcula manualmente)</span>
                ) : null}
              </label>
              {field.hint && (
                <button type="button" onClick={() => setShowHint(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                  className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer"
                  style={{ borderColor: colors.primary, color: colors.primary, background: 'transparent' }}
                >💡</button>
              )}
            </div>

            {field.type === 'choice' && field.options ? (
              <select value={answers[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                style={{
                  borderColor: errors[field.key] ? '#ef4444' : colors.border,
                  background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                  color: colors.text,
                }}
              >
                <option value="">Seleccionar...</option>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'number' ? (
              <input type="number" step="any" value={answers[field.key] ?? ''} onChange={e => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                style={{
                  borderColor: errors[field.key] ? '#ef4444' : colors.border,
                  background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                  color: colors.text,
                }}
                placeholder="0.00"
              />
            ) : (
              <input type="text" value={answers[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                style={{
                  borderColor: errors[field.key] ? '#ef4444' : colors.border,
                  background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                  color: colors.text,
                }}
                placeholder="Escribe aquí..."
              />
            )}

            {errors[field.key] && (
              <p className="text-[8px] mt-1 font-mono" style={{ color: '#ef4444' }}>{errors[field.key]}</p>
            )}
            {showHint[field.key] && field.hint && (
              <div className="mt-1 p-2 rounded-lg border text-[9px]" style={{
                borderColor: colors.primary + '40',
                background: colors.primary + '10',
                color: colors.textMuted,
              }}>
                💡 {field.hint}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl border-2 text-xs font-bold cursor-pointer hover:opacity-85 transition disabled:opacity-50"
            style={{
              borderColor: colors.primary,
              background: colors.primary,
              color: '#1B2632',
              boxShadow: `3px 3px 0px 0px ${colors.border}`,
            }}
          >{loading ? 'Validando...' : '✓ Validar y entregar'}</button>
        </div>
      </form>
    </div>
  );
}
