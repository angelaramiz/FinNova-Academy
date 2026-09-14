// TASK-O2 — Escritorio por especialidad (entrada OS).
// Wallpaper por especialidad + DesktopShell en modo OS (sin header propio,
// con barra de tareas). TASK-O3: fondo elegido + última app persistidos.
// Sin 3D, sin marcas. Cero LLM.
import { useState } from 'react';
import DesktopShell from './DesktopShell';
import { wallpaperPorEspecialidad, cargarPrefs, guardarPrefs, type SpecialtyId } from '../lib/bloqueo';

interface Props {
  theme: 'light' | 'dark';
  tasks: Array<{ id: string; title: string; type: string; difficulty: number; time: number; isTrap?: boolean; trapId?: string }>;
  onClose: () => void;
  onTaskComplete?: () => void;
  specialty: SpecialtyId;
  onSpecialtyChange?: (specialty: string) => void;
}

export default function OsDesktop({ theme, tasks, onClose, onTaskComplete, specialty, onSpecialtyChange }: Props) {
  const [fondo, setFondo] = useState(() => cargarPrefs().fondo);
  const [screenInicial] = useState(() => cargarPrefs().ultimaApp);

  function cambiarFondo(f: string) {
    setFondo(f);
    guardarPrefs({ fondo: f, ordenIconos: cargarPrefs().ordenIconos, ultimaApp: cargarPrefs().ultimaApp });
  }

  const wallpaper = fondo === 'default' ? wallpaperPorEspecialidad(specialty) : fondo;

  return (
    <div className="absolute inset-0" style={{ background: wallpaper }}>
      <DesktopShell
        theme={theme}
        tasks={tasks as never}
        onClose={onClose}
        onTaskComplete={onTaskComplete}
        specialty={specialty}
        onSpecialtyChange={onSpecialtyChange}
        osMode
        fondo={fondo}
        onFondoChange={cambiarFondo}
        screenInicial={screenInicial ?? undefined}
      />
    </div>
  );
}
