// Burbuja amarilla de pista (práctica: ayuda automática por inactividad).
interface Props {
  pista: string | null;
}

export default function HintBubble({ pista }: Props) {
  if (!pista) return null;
  return (
    <div className="fixed bottom-20 right-5 bg-amber-50 border-2 border-amber-400 rounded-xl p-3 shadow-xl z-50 max-w-[280px]">
      <div className="text-xs font-semibold text-amber-900 mb-1">💡 Pista</div>
      <div className="text-xs text-amber-800">{pista}</div>
    </div>
  );
}
