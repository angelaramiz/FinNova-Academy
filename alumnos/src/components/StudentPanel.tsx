import { Briefcase } from 'lucide-react';
import SimuladorLaboral from './SimuladorLaboral';
import { themeColors, Theme } from '../lib/theme';

interface StudentPanelProps {
  theme: Theme;
  profile: any;
}

export default function StudentPanel({ theme }: StudentPanelProps) {
  const colors = themeColors[theme];

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]" style={{ background: colors.bg }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: colors.primary, color: '#1B2632' }}>
          <Briefcase className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold font-mono tracking-wider" style={{ color: colors.text }}>SIMULADOR LABORAL</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>En línea</span>
        </div>
      </div>
      <div className="flex-1">
        <SimuladorLaboral theme={theme} />
      </div>
    </div>
  );
}
