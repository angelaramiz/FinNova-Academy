import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';

type FieldType = 'text' | 'number' | 'choice' | 'currency' | 'rfc' | 'email' | 'phone' | 'date' | 'select' | 'calculated';

interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMsg?: string;
}

interface FormField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  correct?: any;
  hint?: string;
  validation?: ValidationRule;
  readonly?: boolean;
  dependsOn?: string;
  formula?: string;
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

function validateField(field: FormField, value: any, allAnswers: Record<string, any>): string {
  const v = field.validation || {};
  const val = value === undefined || value === null ? '' : String(value);

  if (v.required && (val === '' || val === undefined || val === null)) {
    return 'Este campo es requerido';
  }
  if (val === '' || val === undefined || val === null) return '';

  if (field.type === 'number' || field.type === 'currency' || field.type === 'calculated') {
    const num = Number(val);
    if (isNaN(num)) return 'Debe ser un número válido';
    if (v.min !== undefined && num < v.min) return `Mínimo: ${v.min}`;
    if (v.max !== undefined && num > v.max) return `Máximo: ${v.max}`;
  }

  if (field.type === 'rfc') {
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i;
    if (!rfcRegex.test(val.replace(/[-\s]/g, ''))) return 'RFC inválido (ej: GOBR850101XYZ)';
  }

  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Correo electrónico inválido';
  }

  if (field.type === 'phone') {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(val.replace(/[-\s()+]/g, ''))) return 'Teléfono: 10 dígitos';
  }

  if (v.pattern) {
    const regex = new RegExp(v.pattern);
    if (!regex.test(val)) return v.patternMsg || 'Formato inválido';
  }
  if (v.minLength !== undefined && val.length < v.minLength) return `Mínimo ${v.minLength} caracteres`;
  if (v.maxLength !== undefined && val.length > v.maxLength) return `Máximo ${v.maxLength} caracteres`;

  return '';
}

function calculateFormula(formula: string, answers: Record<string, any>): number {
  try {
    let expr = formula;
    for (const [key, val] of Object.entries(answers)) {
      const num = Number(val) || 0;
      expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(num));
    }
    return Function(`"use strict"; return (${expr})`)();
  } catch { return 0; }
}

export default function AccountingForm({ formData, onSubmit, theme, loading }: AccountingFormProps) {
  const colors = themeColors[theme];
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const defaults: Record<string, any> = {};
    formData.fields.forEach(f => {
      if (f.type === 'choice' && f.options?.length) defaults[f.key] = answers[f.key] || '';
      if (f.type === 'number' || f.type === 'currency') defaults[f.key] = answers[f.key] ?? '';
      if (f.type === 'select' && f.options?.length) defaults[f.key] = answers[f.key] || '';
    });
    if (Object.keys(defaults).length) setAnswers(prev => ({ ...defaults, ...prev }));
  }, []);

  function handleChange(key: string, value: any) {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
    // Validate on change
    const field = formData.fields.find(f => f.key === key);
    if (field) {
      const err = validateField(field, value, { ...answers, [key]: value });
      setErrors(prev => ({ ...prev, [key]: err }));
    }
    // Recalculate dependent fields
    formData.fields.forEach(f => {
      if (f.type === 'calculated' && f.formula && f.dependsOn === key) {
        const val = calculateFormula(f.formula, { ...answers, [key]: value });
        setAnswers(prev => ({ ...prev, [key]: val.toFixed(2) }));
      }
    });
  }

  function handleBlur(key: string) {
    setTouched(prev => ({ ...prev, [key]: true }));
    const field = formData.fields.find(f => f.key === key);
    if (field) {
      const err = validateField(field, answers[key], answers);
      setErrors(prev => ({ ...prev, [key]: err }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    let hasError = false;
    formData.fields.forEach(f => {
      const err = validateField(f, answers[f.key], answers);
      if (err) { newErrors[f.key] = err; hasError = true; }
      setTouched(prev => ({ ...prev, [f.key]: true }));
    });
    setErrors(newErrors);
    if (hasError) return;
    onSubmit(answers);
  }

  const isDark = theme === 'dark';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-[12px] font-bold" style={{ background: colors.bg }}>📋</div>
          <span className="text-[13px] font-bold font-mono" style={{ color: colors.text }}>Sistema Contable</span>
        </div>
        <span className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Validación en tiempo real</span>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">
        {formData.fields.map(field => {
          const hasError = touched[field.key] && errors[field.key];
          const isValid = touched[field.key] && !errors[field.key] && answers[field.key] !== '' && answers[field.key] !== undefined;
          const borderColor = hasError ? '#ef4444' : isValid ? '#22c55e' : colors.border;
          const inputStyle = { borderColor, background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: colors.text };

          return (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-bold font-mono uppercase tracking-wider" style={{ color: colors.text }}>
                  {field.label}
                  {field.validation?.required && <span className="ml-0.5" style={{ color: '#ef4444' }}>*</span>}
                  {field.type === 'calculated' && <span className="ml-1.5 text-[11px] font-mono" style={{ color: colors.primary }}>🔒 Auto</span>}
                </label>
                {field.hint && (
                  <button type="button" onClick={() => setShowHint(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                    className="text-[11px] px-1.5 py-0.5 rounded border cursor-pointer"
                    style={{ borderColor: colors.primary, color: colors.primary, background: 'transparent' }}>💡</button>
                )}
              </div>

              {field.type === 'choice' || field.type === 'select' ? (
                <select value={answers[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field.key)}
                  className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                  style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.type === 'calculated' ? (
                <div className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono" style={{ ...inputStyle, background: isDark ? 'rgba(0,0,0,0.5)' : '#f8fafc', opacity: 0.8 }}>
                  ${Number(answers[field.key] || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              ) : field.type === 'rfc' ? (
                <input type="text" value={answers[field.key] || ''} onChange={e => handleChange(field.key, e.target.value.toUpperCase())}
                  onBlur={() => handleBlur(field.key)}
                  className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition uppercase"
                  style={inputStyle} placeholder="GOBR850101XYZ" maxLength={13} />
              ) : field.type === 'email' ? (
                <input type="email" value={answers[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field.key)}
                  className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                  style={inputStyle} placeholder="correo@ejemplo.com" />
              ) : field.type === 'phone' ? (
                <input type="tel" value={answers[field.key] || ''} onChange={e => handleChange(field.key, e.target.value.replace(/\D/g, ''))}
                  onBlur={() => handleBlur(field.key)}
                  className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                  style={inputStyle} placeholder="5512345678" maxLength={10} />
              ) : field.type === 'currency' ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: colors.textMuted }}>$</span>
                  <input type="number" step="0.01" min="0" value={answers[field.key] ?? ''} onChange={e => handleChange(field.key, e.target.value)}
                    onBlur={() => handleBlur(field.key)}
                    className="w-full pl-6 pr-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                    style={inputStyle} placeholder="0.00" />
                </div>
              ) : field.type === 'number' ? (
                <input type="number" step="any" value={answers[field.key] ?? ''} onChange={e => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field.key)}
                  className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                  style={inputStyle} placeholder="0.00" />
              ) : (
                <input type="text" value={answers[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field.key)}
                  className="w-full px-3 py-2 rounded-xl border-2 text-xs font-mono outline-none transition"
                  style={inputStyle} placeholder="Escribe aquí..." />
              )}

              {hasError && <p className="text-[11px] mt-1 font-mono" style={{ color: '#ef4444' }}>⚠ {errors[field.key]}</p>}
              {isValid && <p className="text-[11px] mt-1 font-mono" style={{ color: '#22c55e' }}>✓ Válido</p>}
              {showHint[field.key] && field.hint && (
                <div className="mt-1 p-2 rounded-lg border text-[12px]" style={{ borderColor: colors.primary + '40', background: colors.primary + '10', color: colors.textMuted }}>
                  💡 {field.hint}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4">
          <button type="submit" disabled={loading}
            className="w-full max-w-xs mx-auto py-3 rounded-xl border-2 text-xs font-bold cursor-pointer hover:opacity-85 transition disabled:opacity-50"
            style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632', boxShadow: `3px 3px 0px 0px ${colors.border}` }}>
            {loading ? 'Validando...' : '✓ Validar y entregar'}
          </button>
        </div>
      </form>
    </div>
  );
}
