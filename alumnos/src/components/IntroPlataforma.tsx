// Ventana de introducción a la plataforma: va DESPUÉS del protector y ANTES
// del escritorio. Indistinta de materia, especialidad o curso: cero jerga
// contable o de datos.
interface Props {
  nombre: string;
  onEntrar: () => void;
}

const PASOS = [
  { n: '1', titulo: 'Explora el caso', texto: 'Lee el documento y los datos: todo lo que necesitas está a la vista.' },
  { n: '2', titulo: 'Resuelve a tu ritmo', texto: 'Captura tu respuesta paso a paso, con guía y ejemplos en cada pantalla.' },
  { n: '3', titulo: 'Registra tu avance', texto: 'Lo que completes suma a tu expediente de práctica verificable.' },
];

export default function IntroPlataforma({ nombre, onEntrar }: Props) {
  return (
    <div className="w-full flex-1 flex items-center justify-center p-6 select-none" style={{ minHeight: 480, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
      <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', color: '#1e293b' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '20px 24px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ffb162', color: '#1b2632', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>SL</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>SIMULADOR DE PRÁCTICAS</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Práctica profesional guiada</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>👋 Hola, {nombre}</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
            Esta es tu oficina de práctica: aquí se aprende haciendo, no solo leyendo.
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {PASOS.map(p => (
              <div key={p.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#dbeafe', color: '#1e40af', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.n}</div>
                <div style={{ fontSize: 13 }}><b>{p.titulo}:</b> <span style={{ color: '#475569' }}>{p.texto}</span></div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
            Sin instalar nada · Equivocarte no cuesta: todo se puede reintentar
          </div>
          <button onClick={onEntrar} style={{ marginTop: 14, width: '100%', fontSize: 14, fontWeight: 700, padding: '10px 12px', borderRadius: 8, border: 'none', background: '#1e40af', color: '#fff', cursor: 'pointer' }}>
            Entrar a mi escritorio →
          </button>
        </div>
      </div>
    </div>
  );
}
