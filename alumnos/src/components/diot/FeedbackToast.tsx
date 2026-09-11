// Toast de feedback (success/error/info), auto-dismissado por el hook.
export type ToastKind = 'success' | 'error' | 'info';

interface Props {
  mensaje: string;
  tipo?: ToastKind;
}

const BG = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-blue-600' } as const;

export default function FeedbackToast({ mensaje, tipo = 'info' }: Props) {
  if (!mensaje) return null;
  return (
    <div role="alert" className={`fixed bottom-5 right-5 px-5 py-3 rounded-lg shadow-xl z-[200] max-w-[400px] text-white text-sm ${BG[tipo]}`}>
      {mensaje}
    </div>
  );
}
