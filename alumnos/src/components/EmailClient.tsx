import { themeColors, Theme } from '../lib/theme';

interface EmailProps {
  email: {
    from: string;
    to: string;
    subject: string;
    body: string;
    urgency?: string;
  };
  onContinue: () => void;
  theme: Theme;
}

export default function EmailClient({ email, onContinue, theme }: EmailProps) {
  const colors = themeColors[theme];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: colors.bg }}>📧</div>
          <span className="text-[10px] font-bold font-mono" style={{ color: colors.text }}>Correo electrónico</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
            background: email.urgency === 'alta' ? '#ef444420' : colors.bg,
            color: email.urgency === 'alta' ? '#ef4444' : colors.textMuted,
          }}>
            {email.urgency === 'alta' ? '🔴 Urgente' : '📩 Bandeja de entrada'}
          </span>
        </div>
      </div>

      {/* Email header */}
      <div className="px-4 py-3 border-b-2 shrink-0" style={{ borderColor: colors.border }}>
        <p className="text-xs font-bold mb-0.5" style={{ color: colors.text }}>{email.subject}</p>
        <div className="flex items-center gap-3 text-[9px] font-mono" style={{ color: colors.textMuted }}>
          <span><strong style={{ color: colors.text }}>De:</strong> {email.from}</span>
          <span><strong style={{ color: colors.text }}>Para:</strong> {email.to}</span>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: colors.text }}>
          {(email?.body || '').split('\n').map((line, i) => {
            const parts = (line || '').split(/(\*\*.*?\*\*)/g);
            return (
              <p key={i} className="mb-1">
                {parts.map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    const content = part.slice(2, -2);
                    // Check if it's a phone or email
                    if (/\d/.test(content) || content.includes('@')) {
                      return <span key={j} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: colors.primary + '20', color: colors.primary }}>{content}</span>;
                    }
                    return <span key={j} className="font-bold" style={{ color: colors.text }}>{content}</span>;
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t-2 flex items-center justify-between shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>1 archivo adjunto: Solicitud.pdf</span>
        <button onClick={onContinue}
          className="px-5 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
          style={{
            borderColor: colors.primary,
            background: colors.primary,
            color: '#1B2632',
            boxShadow: `3px 3px 0px 0px ${colors.border}`,
          }}
        >📋 Ir a la tarea</button>
      </div>
    </div>
  );
}
