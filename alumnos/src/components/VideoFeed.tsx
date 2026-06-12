/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Clock, Sparkles, Award, RefreshCw, ChevronDown, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import ExerciseBlock from './ExerciseBlock';

interface Clip {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  sequenceOrder: number;
}

interface VideoFeedProps {
  clips: Clip[];
  courseId: string;
  onProgressUpdated: () => void;
  completedClipIds: string[];
}

export default function VideoFeed({ clips, courseId, onProgressUpdated, completedClipIds }: VideoFeedProps) {
  const [activeClipId, setActiveClipId] = useState<string | null>(clips[0]?.id || null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver to discover which video card fills the scroll window
  useEffect(() => {
    if (!containerRef.current) return;

    const observerOptions = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.6, // Card must fill at least 60% of vertical viewport
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const clipId = entry.target.getAttribute('data-clip-id');
          if (clipId) {
            setActiveClipId(clipId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    const children = containerRef.current.querySelectorAll('[data-clip-id]');
    children.forEach(child => observer.observe(child));

    return () => {
      children.forEach(child => observer.unobserve(child));
      observer.disconnect();
    };
  }, [clips]);

  if (clips.length === 0) {
    return (
      <div id="empty-feed-card" className="flex flex-col items-center justify-center p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl h-[550px] text-slate-400">
        <Sparkles className="w-12 h-12 text-amber-500 mb-4 animate-pulse" />
        <p className="text-lg font-semibold text-slate-200">No hay clips aprobados</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">Introduce un guión en el pipeline o inicia un webhook para generar videos cortos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 max-w-6xl mx-auto items-stretch">
      {/* Scroll Viewport mimicking TikTok Layout */}
      <div 
        id="reels-scroll-container"
        ref={containerRef}
        className="w-full max-w-md mx-auto h-[680px] overflow-y-scroll snap-y snap-mandatory scroll-smooth border border-slate-800 rounded-3xl bg-black shadow-2xl relative scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        {clips.map(clip => (
          <VideoCard 
            key={clip.id} 
            clip={clip} 
            courseId={courseId}
            isActive={clip.id === activeClipId}
            isCompleted={completedClipIds.includes(clip.id)}
            onCompletelyWatched={() => {
              onProgressUpdated();
            }}
          />
        ))}
      </div>

      {/* Linked Exercise Drawer / Section (Dynamic based on intersection) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {activeClipId ? (
          <div id="active-clip-details" className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/20 font-mono">
                  Concepto #{clips.findIndex(c => c.id === activeClipId) + 1}
                </span>
                {completedClipIds.includes(activeClipId) && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Completado +25XP
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-100">
                {clips.find(c => c.id === activeClipId)?.title}
              </h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                {clips.find(c => c.id === activeClipId)?.description}
              </p>
            </div>

            {/* Practical Interactive Exercise corresponding to Clip in View */}
            <div className="mt-6 border-t border-slate-800/80 pt-6 flex-1 flex flex-col justify-end">
              <ExerciseBlock clipId={activeClipId} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-8 text-center border border-dashed border-slate-800 rounded-3xl text-slate-500">
            Desliza para ver conceptos y resolver desafíos interactivos.
          </div>
        )}
      </div>
    </div>
  );
}

/* Individual Video Render card with active state logic */
interface VideoCardProps {
  key?: string;
  clip: Clip;
  courseId: string;
  isActive: boolean;
  isCompleted: boolean;
  onCompletelyWatched: () => void;
}

function VideoCard({ clip, courseId, isActive, isCompleted, onCompletelyWatched }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsWatched, setSecondsWatched] = useState(0);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync player activation based on scroll state
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      setSecondsWatched(0); // Reset progress upon scroll focus
    } else {
      setIsPlaying(false);
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }
    }
    return () => {
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }
    };
  }, [isActive]);

  // Handle mock video player clock tracking and api submission
  useEffect(() => {
    if (isPlaying && isActive) {
      videoIntervalRef.current = setInterval(() => {
        setSecondsWatched(prev => {
          const nextSec = prev + 1;
          
          // Call progress logger on key intervals (every 4s or completion limit)
          if (nextSec % 4 === 0 || nextSec >= clip.duration) {
            api.logProgress({
              courseId,
              clipId: clip.id,
              watchedSeconds: nextSec,
              isCompleted: nextSec >= clip.duration,
            }).then(() => {
              if (nextSec >= clip.duration) {
                onCompletelyWatched();
              }
            }).catch(err => {
              console.error('Failed forwarding clip progress telemetry:', err);
            });
          }

          if (nextSec >= clip.duration) {
            // Loop the video mock automatically
            return 0;
          }
          return nextSec;
        });
      }, 1000);
    } else {
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }
    }

    return () => {
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }
    };
  }, [isPlaying, isActive, clip.duration, courseId]);

  const progressPercent = Math.min((secondsWatched / clip.duration) * 100, 100);

  return (
    <div 
      data-clip-id={clip.id}
      className="w-full h-full snap-start relative flex flex-col justify-between bg-zinc-950 select-none overflow-hidden"
    >
      {/* Mock Video Canvas Backdrop */}
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
        <video 
          id={`video-node-${clip.id}`}
          src={clip.videoUrl} 
          className="w-full h-full object-cover opacity-60 brightness-75"
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/55" />
      </div>

      {/* Floating Sparkles indicator */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <div className="bg-black/60 backdrop-blur-md border border-slate-800/80 rounded-full px-3 py-1 flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold font-mono shadow-lg">
          <Sparkles className="w-3.5 h-3.5 animate-spin duration-1000" /> Micro-Concepto
        </div>
        {isCompleted && (
          <div className="bg-emerald-500/80 text-white backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 text-[11px] font-semibold font-mono shadow-lg">
            ✓ Completado
          </div>
        )}
      </div>

      {/* Large visual play overlay trigger */}
      <div 
        id="video-player-viewport-trigger"
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
      >
        {!isPlaying && (
          <div className="bg-white/15 backdrop-blur-xl border border-white/20 p-5 rounded-full shadow-2xl transition hover:scale-115 text-slate-100 animate-pulse">
            <Play className="w-8 h-8 fill-current" />
          </div>
        )}
      </div>

      {/* Bottom details block overlay */}
      <div className="mt-auto px-4 pb-6 z-20 w-full flex flex-col gap-3">
        <div>
          <h4 className="text-md font-bold text-white leading-snug drop-shadow-md">
            {clip.title}
          </h4>
          <p className="text-zinc-300 text-xs mt-1.5 line-clamp-2 leading-relaxed drop-shadow-sm">
            {clip.description}
          </p>
        </div>

        {/* Video Progression and Timer status */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold font-mono mt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> 0:{secondsWatched.toString().padStart(2, '0')}
          </span>
          <span>
            0:{clip.duration}
          </span>
        </div>

        {/* Dynamic customized ProgressBar */}
        <div className="w-full bg-slate-800 rounded-full h-1 relative overflow-hidden">
          <div 
            className="bg-amber-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Overlay instructions badge */}
        <div className="text-[10px] text-zinc-500 text-center uppercase font-mono tracking-wider mt-1">
          {isPlaying ? 'Video en reproducción' : 'Video pausado'} • Toca para pausar
        </div>
      </div>
    </div>
  );
}
