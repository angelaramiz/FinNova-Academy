import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface SeccionCurso {
  titulo: string;
  texto: string;
  puntos?: string[];
}

interface CursoInfo {
  id: string;
  titulo: string;
  npc: string;
  introduccion: string;
  secciones: SeccionCurso[];
  cierre: string;
}

interface PracticasCursoProps {
  theme: Theme;
  curso: CursoInfo;
  onBack: () => void;
}

const NPC_COLOR = '#f59e0b';

export default function PracticasCurso({ theme, curso, onBack }: PracticasCursoProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [sectionIdx, setSectionIdx] = useState(-1);
  const [bubble, setBubble] = useState(0);
  const [finished, setFinished] = useState(false);

  const isIntro = sectionIdx === -1;
  const isCierre = sectionIdx === curso.secciones.length;
  const currentText = isIntro ? curso.introduccion : isCierre ? curso.cierre : curso.secciones[sectionIdx].texto;
  const currentTitle = isIntro ? 'Introducción' : isCierre ? 'Cierre' : curso.secciones[sectionIdx].titulo;
  const totalBubbles = isIntro || isCierre ? 1 : Math.max(1, Math.ceil(currentText.length / 260));

  function next() {
    if (isIntro) { setSectionIdx(0); setBubble(0); return; }
    if (bubble + 1 < totalBubbles) { setBubble(bubble + 1); return; }
    if (isCierre) { setFinished(true); return; }
    setSectionIdx(sectionIdx + 1); setBubble(0);
  }

  function prev() {
    if (isIntro) return;
    if (bubble > 0) { setBubble(bubble - 1); return; }
    if (sectionIdx === 0) { setSectionIdx(-1); return; }
    setSectionIdx(sectionIdx - 1); setBubble(0);
  }

  const progress = finished ? 100 : Math.round((((isIntro ? 0 : sectionIdx + 1) / (curso.secciones.length + 2)) * 100));

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold" style={{ background: '#f59e0b30' }}>🎓</div>
          <span className="text-[13px] font-bold font-mono" style={{ color: colors.text }}>Curso con tu capacitador</span>
        </div>
        <span className="text-[9px] font-mono ml-auto" style={{ color: colors.textMuted }}>{sectionIdx + 2}/{curso.secciones.length + 2}</span>
      </div>

      <div className="px-4 py-2 shrink-0" style={{ background: colors.cardBg, borderBottom: `1px solid ${colors.border}` }}>
        <p className="text-[12px] font-bold mb-1" style={{ color: colors.text }}>{curso.titulo}</p>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.bg }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: NPC_COLOR }} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex items-start gap-3" style={{ background: isDark ? '#151821' : '#faf7f2' }}>
        <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-xl font-bold cursor-pointer select-none" style={{ background: NPC_COLOR + '20', border: `2px solid ${NPC_COLOR}`, color: NPC_COLOR }}>
          🎓
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold font-mono mb-1" style={{ color: NPC_COLOR }}>Capacitador · Prácticas Profesionales</p>
          {!finished ? (
            <div className="rounded-2xl rounded-tl-sm p-4 border-2 animate-slide-in" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <p className="text-[10px] font-bold font-mono mb-2" style={{ color: colors.primary }}>📘 {currentTitle}</p>
              <p className="text-[12px] leading-relaxed" style={{ color: colors.text }}>{currentText}</p>
              {!isIntro && !isCierre && curso.secciones[sectionIdx].puntos && (
                <ul className="mt-3 space-y-1">
                  {curso.secciones[sectionIdx].puntos!.map((p, i) => (
                    <li key={i} className="text-[10px] font-mono flex items-start gap-1.5" style={{ color: colors.textMuted }}>
                      <span style={{ color: NPC_COLOR }}>▸</span> {p}
                    </li>
                  ))}
                </ul>
              )}
              {totalBubbles > 1 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: totalBubbles }).map((_, i) => (
                      <button key={i} onClick={() => setBubble(i)} className="w-1.5 h-1.5 rounded-full cursor-pointer" style={{ background: i === bubble ? NPC_COLOR : colors.border }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl rounded-tl-sm p-5 border-2 text-center animate-slide-in" style={{ borderColor: '#22c55e', background: '#22c55e08' }}>
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-[13px] font-bold mb-1" style={{ color: '#22c55e' }}>¡Curso completado!</p>
              <p className="text-[11px] mb-3" style={{ color: colors.textMuted }}>Ya tienes la base teórica del tema. Ahora practica las tareas del tracker y al final toma tu prueba de conocimiento.</p>
              <button onClick={onBack} className="px-5 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition" style={{ borderColor: '#22c55e', background: '#22c55e', color: '#1B2632' }}>
                Continuar a las tareas
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t-2 shrink-0 flex items-center justify-between gap-3" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <button onClick={prev} disabled={isIntro}
          className="px-4 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition disabled:opacity-40"
          style={{ borderColor: colors.border, background: colors.bg, color: colors.text }}>← Anterior</button>
        <button onClick={next}
          className="px-5 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
          style={{ borderColor: NPC_COLOR, background: NPC_COLOR, color: '#1B2632', boxShadow: `2px 2px 0px 0px ${colors.border}` }}>
          {isIntro ? 'Empezar curso →' : isCierre ? 'Terminar curso ✓' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}