// TrainingPlayer — reproductor uniforme de capacitaciones Contalink.
// Props: (training, videoSrc). Piezas: encabezado, reproductor 16:9 +
// selector de fuente, índice de capítulos, transcripción buscable con
// resaltado sincronizado. Responsive. Sin quiz (follow-up fuera de scope).
import { useEffect, useMemo, useRef, useState } from 'react';
import { filtrarSegmentos, fmtTiempo, indiceActivo } from '../lib/capacitaciones';

export interface TrainingCapitulo {
  titulo: string;
  inicio: number;
}

export interface TrainingSegmento {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface TrainingData {
  titulo: string;
  instructor: string;
  duracion: number;
  duracionTxt: string;
  capitulos: TrainingCapitulo[];
  segmentos: TrainingSegmento[];
}

interface Props {
  training: TrainingData;
  videoSrc?: string;
}

export default function TrainingPlayer({ training, videoSrc }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [src, setSrc] = useState<string>(videoSrc ?? '');
  const [urlInput, setUrlInput] = useState<string>(videoSrc ?? '');
  const [now, setNow] = useState<number>(0);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    setSrc(videoSrc ?? '');
    setUrlInput(videoSrc ?? '');
    setNow(0);
  }, [videoSrc, training.titulo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setNow(v.currentTime);
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [src]);

  const seek = (t: number) => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = t;
      v.play().catch(() => undefined);
    }
    setNow(t);
  };

  const filtrados = useMemo(
    () => filtrarSegmentos(training.segmentos, query),
    [query, training.segmentos],
  );

  const activo = useMemo(
    () => indiceActivo(training.segmentos, now),
    [now, training.segmentos],
  );

  const abrirLocal = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setSrc(url);
    setUrlInput('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white">
        <h1 className="text-xl font-bold">{training.titulo}</h1>
        <p className="text-blue-100 text-sm mt-1">
          {training.instructor} · {training.duracionTxt} · {training.capitulos.length} capítulos
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        {src ? (
          <video ref={videoRef} src={src} controls className="w-full aspect-video rounded-lg bg-black" preload="metadata" />
        ) : (
          <div className="w-full aspect-video rounded-lg bg-slate-900 text-slate-300 flex items-center justify-center text-sm">
            Sin video: pega una URL o abre el .mp4 local (no va al repo).
          </div>
        )}
        {!src && <video ref={videoRef} className="hidden" preload="none" />}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://…/video.mp4"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <button onClick={() => setSrc(urlInput.trim())} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
            Usar URL
          </button>
          <label className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50 text-center">
            Abrir video local
            <input type="file" accept="video/*" className="hidden" onChange={(e) => abrirLocal(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-2">Capítulos</h3>
          <ol className="space-y-1">
            {training.capitulos.map((c, i) => (
              <li key={i}>
                <button onClick={() => seek(c.inicio)} className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-blue-50 flex justify-between gap-2">
                  <span className="text-slate-700">{i + 1}. {c.titulo}</span>
                  <span className="font-mono text-slate-400 shrink-0">{fmtTiempo(c.inicio)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la transcripción…"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3"
          />
          <div className="max-h-[480px] overflow-y-auto space-y-1 pr-1">
            {filtrados.map((s, i) => {
              const globalIdx = training.segmentos.indexOf(s);
              const isActive = globalIdx === activo && !query.trim();
              return (
                <button
                  key={`${s.start}-${i}`}
                  onClick={() => seek(s.start)}
                  className={`w-full text-left px-2 py-1 rounded text-xs flex gap-2 ${isActive ? 'bg-blue-100 font-medium' : 'hover:bg-slate-50'}`}
                >
                  <span className="font-mono text-slate-400 shrink-0">{fmtTiempo(s.start)}</span>
                  <span className="text-slate-700">{s.text}</span>
                </button>
              );
            })}
            {filtrados.length === 0 && <p className="text-xs text-slate-400 p-2">Sin coincidencias.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
