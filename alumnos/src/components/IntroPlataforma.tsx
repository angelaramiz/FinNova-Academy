// Ventana de introducción genérica a la plataforma: va DESPUÉS del protector
// y ANTES del escritorio. Indistinta de materia, especialidad o curso: cero
// jerga contable o de datos.
interface Props {
  nombre: string;
  onEntrar: () => void;
}

export default function IntroPlataforma({ nombre, onEntrar }: Props) {
  return (
    <div className="w-full flex-1 flex items-center justify-center p-6 select-none" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', color: '#1e293b' }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>👋 Hola, {nombre}</div>
        <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
          Esta es tu oficina de práctica: aquí se aprende haciendo, no solo leyendo.
        </div>
        <ul style={{ fontSize: 13, margin: '14px 0 0 18px', padding: 0, display: 'grid', gap: 8 }}>
          <li>📁 <b>Casos guiados paso a paso:</b> cada actividad te lleva de la mano hasta el resultado.</li>
          <li>🛟 <b>Equivocarte no cuesta:</b> todo se puede reintentar y cada error trae su explicación.</li>
          <li>📈 <b>Tu avance queda registrado:</b> lo que completes suma a tu expediente de práctica.</li>
        </ul>
        <button onClick={onEntrar} style={{ marginTop: 18, width: '100%', fontSize: 14, fontWeight: 700, padding: '10px 12px', borderRadius: 8, border: 'none', background: '#1e40af', color: '#fff', cursor: 'pointer' }}>
          Entrar a mi escritorio →
        </button>
      </div>
    </div>
  );
}
