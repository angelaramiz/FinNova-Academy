import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface MatchSuggestion {
  invoice: { invoiceNumber: string; clientName: string; amount: number; status: string; dueDate: string };
  matchScore: number;
  matchReason: string[];
}

interface PaymentMatcherProps {
  theme: Theme;
  clientName: string;
  amount: number;
  onMatchConfirmed: () => void;
  onSkip: () => void;
}

function getScoreColor(score: number) {
  if (score >= 85) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score: number) {
  if (score === 100) return 'Perfecto';
  if (score >= 85) return 'Muy bueno';
  if (score >= 60) return 'Bueno';
  return 'Posible';
}

export default function PaymentMatcher({ theme, clientName, amount, onMatchConfirmed, onSkip }: PaymentMatcherProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/api/sim/suggest-matches', {
          method: 'POST',
          body: JSON.stringify({ clientName, amount }),
          headers: { 'Content-Type': 'application/json' },
        });
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    })();
  }, [clientName, amount]);

  async function handleConfirm(invoiceNumber: string) {
    setConfirming(invoiceNumber);
    try {
      await apiFetch('/api/sim/confirm-match', {
        method: 'POST',
        body: JSON.stringify({ invoiceNumber, paymentId: `PAY-${Date.now()}` }),
        headers: { 'Content-Type': 'application/json' },
      });
      onMatchConfirmed();
    } catch {}
    setConfirming(null);
  }

  const scoreBarWidth = (score: number) => `${Math.min(score, 100)}%`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ background: isDark ? '#1a1a2e' : '#fff', border: `1px solid ${colors.border}`, width: '100%', maxWidth: 480, maxHeight: '80vh' }}>
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center gap-3" style={{ background: isDark ? '#16213e' : '#f8fafc', borderBottom: `1px solid ${colors.border}` }}>
          <span className="text-xl">🔗</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold" style={{ color: colors.text }}>Sugerencia de Matching</div>
            <div className="text-[11px]" style={{ color: colors.textMuted }}>
              {clientName} · ${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-center py-8" style={{ color: colors.textMuted }}>Buscando facturas pendientes...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📭</div>
              <div className="text-sm" style={{ color: colors.textMuted }}>No se encontraron facturas pendientes para este cliente.</div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[11px] font-medium mb-2" style={{ color: colors.textMuted }}>{suggestions.length} factura{suggestions.length > 1 ? 's' : ''} pendiente{suggestions.length > 1 ? 's' : ''}</div>
              {suggestions.map((s, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: isDark ? '#0f3460' : '#f0f9ff', border: `1px solid ${getScoreColor(s.matchScore)}40` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: colors.text }}>{s.invoice.invoiceNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#22c55e20', color: '#22c55e' }}>● {s.invoice.status}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: getScoreColor(s.matchScore) }}>{s.matchScore}%</span>
                  </div>
                  <div className="text-xs mb-1" style={{ color: colors.text }}>{s.invoice.clientName}</div>
                  <div className="text-xs mb-2" style={{ color: colors.textMuted }}>
                    Vence: {new Date(s.invoice.dueDate).toLocaleDateString('es-MX')} · ${s.invoice.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  {/* Score bar */}
                  <div className="w-full h-1.5 rounded-full mb-2" style={{ background: isDark ? '#1a1a2e' : '#e2e8f0' }}>
                    <div className="h-full rounded-full" style={{ width: scoreBarWidth(s.matchScore), background: getScoreColor(s.matchScore) }} />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {s.matchReason.map((r, j) => (
                      <span key={j} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: isDark ? '#1a1a2e20' : '#e2e8f0', color: colors.textMuted }}>✓ {r}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleConfirm(s.invoice.invoiceNumber)}
                    disabled={confirming === s.invoice.invoiceNumber}
                    className="w-full text-xs py-1.5 rounded-md font-bold transition-all"
                    style={{ background: confirming === s.invoice.invoiceNumber ? '#6b7280' : getScoreColor(s.matchScore), color: '#fff' }}
                  >
                    {confirming === s.invoice.invoiceNumber ? 'Confirmando...' : 'Confirmar match'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex gap-2" style={{ borderTop: `1px solid ${colors.border}` }}>
          <button onClick={onSkip} className="flex-1 text-xs py-2 rounded-md font-medium" style={{ background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
            Omitir matching
          </button>
        </div>
      </div>
    </div>
  );
}
