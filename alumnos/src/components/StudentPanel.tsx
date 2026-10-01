import { lazy, Suspense } from 'react';
// P1-3: la oficina 3D (three) no entra al initial; carga diferida.
const SimuladorLaboral = lazy(() => import('./SimuladorLaboral'));
import { themeColors, Theme } from '../lib/theme';

interface StudentPanelProps {
  theme: Theme;
  profile: any;
}

export default function StudentPanel({ theme, profile }: StudentPanelProps) {
  const colors = themeColors[theme];

  return (
    <div className="flex flex-col min-h-[calc(100vh-40px)]" style={{ background: colors.bg }}>
      <div className="flex-1">
        <Suspense fallback={<div className="p-6 text-xs font-mono animate-pulse" style={{ color: colors.textMuted }}>Cargando oficina 3D…</div>}>
          <SimuladorLaboral theme={theme} profile={profile} />
        </Suspense>
      </div>
    </div>
  );
}
