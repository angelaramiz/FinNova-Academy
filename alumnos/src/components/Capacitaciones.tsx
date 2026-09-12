// Vista galería de capacitaciones Contalink — las 3 con el MISMO
// TrainingPlayer (cero duplicación de layout). videoSrc configurable
// por módulo; los .mp4 (~500 MB) NO van al repo: URL o archivo local.
import { useState } from 'react';
import TrainingPlayer from './TrainingPlayer';
import type { TrainingData } from './TrainingPlayer';
import auditoria from '../data/capacitaciones/auditoria.json';
import conciliacion from '../data/capacitaciones/conciliacion.json';
import nomina from '../data/capacitaciones/nomina.json';

// Fuentes por defecto (vacío = el alumno pega URL o abre el .mp4 local).
// Ejemplo: auditoria: 'https://cdn…/auditoria_editado.mp4'
const VIDEO_SRC: Record<string, string> = {
  auditoria: '',
  conciliacion: '',
  nomina: '',
};

const MODULOS: { id: string; tab: string; data: TrainingData }[] = [
  { id: 'auditoria', tab: 'Auditoría', data: auditoria as TrainingData },
  { id: 'conciliacion', tab: 'Conciliación', data: conciliacion as TrainingData },
  { id: 'nomina', tab: 'Nómina', data: nomina as TrainingData },
];

export default function Capacitaciones() {
  const [activo, setActivo] = useState<string>('auditoria');
  const mod = MODULOS.find((m) => m.id === activo) ?? MODULOS[0];
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {MODULOS.map((m) => (
          <button
            key={m.id}
            onClick={() => setActivo(m.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              m.id === activo ? 'bg-blue-700 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {m.tab}
          </button>
        ))}
      </div>
      <TrainingPlayer key={mod.id} training={mod.data} videoSrc={VIDEO_SRC[mod.id]} />
    </div>
  );
}
