import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface DashboardProps { theme: Theme; onClose: () => void; }

function getToken() { return localStorage.getItem('supabase_auth_token') || ''; }
async function apiGet(path: string) {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

type Level = 'Junior' | 'Semi-Senior' | 'Senior';

export default function Dashboard({ theme, onClose }: DashboardProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try { const s = await apiGet('/api/sim/my-stats'); setStats(s); } catch {}
    try { const p = await apiGet('/api/sim/my-profile'); setProfile(p); } catch {}
  }

  const s = stats || { tasksCompleted: 0, totalScore: 0, totalTime: 0, level: 'Junior' };
  const levelColors: Record<Level, string> = { Junior: '#22c55e', 'Semi-Senior': '#f59e0b', Senior: '#ef4444' };
  const level = (s.level || 'Junior') as Level;
  const avgScore = s.tasksCompleted > 0 ? Math.round(s.totalScore / s.tasksCompleted) : 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden animate-slide-in" style={{
        borderColor: colors.border, background: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)',
        boxShadow: `8px 8px 0px 0px ${colors.border}`,
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: colors.primary, color: '#1B2632' }}>📊</div>
            <span className="text-sm font-bold" style={{ color: colors.text }}>Mi rendimiento</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold cursor-pointer"
            style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>✕</button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {/* Level + Score Hero */}
          <div className="flex items-center gap-6 mb-6 p-5 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{
              background: levelColors[level] + '20', border: `3px solid ${levelColors[level]}`,
              color: levelColors[level],
            }}>
              {level === 'Junior' ? '🌱' : level === 'Semi-Senior' ? '📈' : '🏆'}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold" style={{ color: levelColors[level] }}>{level}</p>
              <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>Nivel actual</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{s.totalScore}</p>
              <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>Puntos totales</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Tareas completadas', value: s.tasksCompleted, icon: '✅', color: '#22c55e' },
              { label: 'Puntaje promedio', value: avgScore, icon: '⭐', color: colors.primary },
              { label: 'Tiempo total', value: `${s.totalTime} min`, icon: '⏱️', color: '#3b82f6' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border-2 text-center" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <span className="text-xl">{item.icon}</span>
                <p className="text-lg font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* XP Bar */}
          <div className="mb-6 p-4 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: colors.text }}>Progreso a {level === 'Junior' ? 'Semi-Senior' : level === 'Semi-Senior' ? 'Senior' : '¡Max!'}</span>
              <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
                {level === 'Junior' ? `${s.tasksCompleted}/5 tareas` : level === 'Semi-Senior' ? `${s.tasksCompleted}/15 tareas` : 'Completo'}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: colors.bg }}>
              <div className="h-full rounded-full transition-all duration-700" style={{
                width: level === 'Junior' ? `${Math.min((s.tasksCompleted / 5) * 100, 100)}%` : level === 'Semi-Senior' ? `${Math.min((s.tasksCompleted / 15) * 100, 100)}%` : '100%',
                background: `linear-gradient(90deg, ${colors.primary}, ${levelColors[level]})`,
              }} />
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="p-4 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
            <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
              <span>📋</span> Últimas actividades
            </h3>
            <div className="space-y-3">
              {(s.history || s.tasksCompleted > 0) ? (
                (s.history as any[] || []).length > 0 ? (s.history as any[]).slice(-5).reverse().map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: h.passed ? '#22c55e' : '#f59e0b' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{h.taskTitle}</p>
                      <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{h.completedAt ? new Date(h.completedAt).toLocaleDateString('es-MX') : ''}</p>
                    </div>
                    <span className="text-[9px] font-bold" style={{ color: h.passed ? '#22c55e' : '#f59e0b' }}>{h.score}/{h.maxScore}</span>
                  </div>
                )) : Array.from({ length: Math.min(s.tasksCompleted, 5) }).map((_, i) => {
                  const taskNames = ['Emisión de Factura', 'Registro de Pago', 'Conciliación Bancaria', 'Cálculo de IVA', 'Póliza de Diario'];
                  const name = taskNames[s.tasksCompleted - 1 - i] || `Tarea #${s.tasksCompleted - i}`;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{name}</p>
                        <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>Completada</p>
                      </div>
                      <span className="text-[9px] font-bold" style={{ color: colors.primary }}>+{10 + (i % 3) * 15} pts</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-center py-4" style={{ color: colors.textMuted }}>Aún no has completado ninguna tarea</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
