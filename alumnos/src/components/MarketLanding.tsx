/**
 * MarketLanding.tsx
 * Landing page principal del portal de alumnos con dashboard financiero
 * de 3 niveles de comprensión: Básico, Intermedio y Avanzado.
 * 
 * Rediseñado con estilo Minimalista Flat Design (Neo-brutalismo suave)
 * Soporta modo Light y Dark basados en la paleta de colores del usuario:
 * - Light: Palladian (#EEE9DF), Oatmeal (#C9C1B1), Burning Flame (#FFB162), Truffle (#A35139), Abyssal Blue (#1B2632)
 * - Dark: Abyssal Blue (#1B2632), Blue Fantastic (#2C3B4D), Burning Flame (#FFB162), Truffle (#A35139), Palladian (#EEE9DF)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  BarChart3,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  Eye,
  Lock,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { api } from '../lib/api';

// ─── THEME CONFIGURATION ───────────────────────────────────────────────────────
export const themeColors = {
  light: {
    bg: '#E2DCD0',          // Warm Palladian-Oatmeal blend for high card contrast
    cardBg: '#FFFFFF',      // Pure white for crisp cards
    cardSecondary: '#C9C1B1', // Oatmeal
    text: '#1B2632',        // Abyssal Anchorfish Blue
    textMuted: '#2C3B4D',   // Blue Fantastic
    primary: '#FFB162',     // Burning Flame
    secondary: '#A35139',   // Truffle Trouble
    border: '#1B2632',      // Abyssal Anchorfish Blue
  },
  dark: {
    bg: '#1B2632',          // Abyssal Anchorfish Blue
    cardBg: '#2C3B4D',      // Blue Fantastic
    cardSecondary: '#1F2937', // Dark slate
    text: '#EEE9DF',        // Palladian
    textMuted: '#C9C1B1',   // Oatmeal
    primary: '#FFB162',     // Burning Flame
    secondary: '#A35139',   // Truffle Trouble
    border: '#EEE9DF',      // Palladian
  }
};

export type Theme = 'light' | 'dark';

// ─── DATA ──────────────────────────────────────────────────────────────────────
const ASSET_COLORS: Record<string, string> = {
  XAU: '#C9A84C',
  XAG: '#A8B2C1',
  CL: '#6B8A5E',
  SPX: '#5B8DEF',
};

const DEFAULT_ASSETS = [
  { name: 'Oro', ticker: 'XAU', price: 4113, change: -0.42 },
  { name: 'Plata', ticker: 'XAG', price: 34.50, change: 0.38 },
  { name: 'Petroleo', ticker: 'CL', price: 75.80, change: -1.15 },
  { name: 'S&P 500', ticker: 'SPX', price: 6024, change: 0.55 },
];

const ASSET_NAMES: Record<string, string> = { XAU: 'Oro', XAG: 'Plata', CL: 'Petroleo', SPX: 'S&P 500' };
const ASSET_LABELS: Record<string, string> = { XAU: 'oro', XAG: 'plata', CL: 'petroleo', SPX: 'S&P 500' };

// ─── MARKET MOOD GAUGE ─────────────────────────────────────────────────────────
function MarketMoodGauge({ theme, moodValue = 0.73, assetName = 'oro' }: { theme: Theme; moodValue?: number; assetName?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const colors = themeColors[theme];

  useEffect(() => {
    let frame = 0;
    const total = 60;
    const animate = () => {
      frame++;
      setAnimProgress(Math.min(frame / total, 1));
      if (frame < total) requestAnimationFrame(animate);
    };
    const timer = setTimeout(animate, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = 280;
    const H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H - 20;
    const radius = 100;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = theme === 'light' ? 'rgba(27,38,50,0.08)' : 'rgba(238,233,223,0.08)';
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Gradient arc (sell: red → neutral: amber → buy: green)
    const gradient = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    gradient.addColorStop(0, '#A35139'); // Truffle/Reddish
    gradient.addColorStop(0.5, '#C9C1B1'); // Oatmeal/Neutral
    gradient.addColorStop(1, '#FFB162'); // Burning Flame/Buy

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Needle
    const eased = 1 - Math.pow(1 - animProgress, 3);
    const needleAngle = startAngle + (moodValue * eased) * Math.PI;
    const needleLen = radius - 30;
    const nx = cx + Math.cos(needleAngle) * needleLen;
    const ny = cy + Math.sin(needleAngle) * needleLen;

    // Needle line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 4;
    ctx.strokeStyle = colors.border;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = colors.border;
    ctx.fill();

    // Labels
    ctx.font = 'bold 10px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#A35139';
    ctx.textAlign = 'left';
    ctx.fillText('VENDER', cx - radius + 5, cy + 16);

    ctx.fillStyle = colors.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('NEUTRAL', cx, cy - radius + 30);

    ctx.fillStyle = colors.secondary;
    ctx.textAlign = 'right';
    ctx.fillText('COMPRAR', cx + radius - 5, cy + 16);

  }, [animProgress, moodValue, theme, colors]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} />
      <div className="flex items-center gap-2 -mt-1">
        <span className="text-xs font-mono font-bold" style={{ color: colors.secondary }}>
          SEÑAL: COMPRA
        </span>
        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
          (73% confianza estacional)
        </span>
      </div>
    </div>
  );
}

interface AssetAnalytics {
  monthlyReturns: { m: string; avg: number; pp: number }[];
  calendarSignals: { m: string; signal: string; type: string }[];
  pnlHistory: { yr: number; e: number; x: number; pnl: number }[];
  heroData: { yr: number; pnl: number }[];
  moodValue: number;
  winRate: number;
  avgPnl: number;
  signalTitle: string;
  signalDescription: string;
  confidenceText: string;
  bannerTitle: string;
  bannerDescription: string;
}

// ─── ANIMATED HERO CHART (Canvas) ──────────────────────────────────────────────
function HeroChart({ theme, asset = 'XAU', data: chartData }: { theme: Theme; asset?: string; data?: { yr: number; pnl: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = themeColors[theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let animFrame = 0;
    const animTotal = 80;
    const data = chartData || [];
    if (data.length === 0) return;
    const max = Math.max(...data.map(d => Math.abs(d.pnl)));

    function resize() {
      if (!canvas || !ctx) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();

    function drawFrame(progress: number) {
      if (!canvas || !ctx) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const pad = { l: 45, r: 16, t: 25, b: 30 };
      const chartW = W - pad.l - pad.r;
      const chartH = H - pad.t - pad.b;
      const barW = chartW / data.length;
      const mid = pad.t + chartH / 2;

      // Draw asset label at top-left
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 9px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(asset === 'XAU' ? 'ORO (XAU)' : asset === 'XAG' ? 'PLATA (XAG)' : asset === 'CL' ? 'PETRÓLEO (CL)' : 'S&P 500 (SPX)', pad.l, pad.t - 8);

      // Base flat line
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad.l, mid);
      ctx.lineTo(W - pad.r, mid);
      ctx.stroke();

      ctx.fillStyle = colors.textMuted;
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('$0', 4, mid + 3);

      data.forEach((d, i) => {
        const t = Math.min(progress / (animTotal * 0.7) - i / data.length * 0.5, 1);
        if (t <= 0) return;
        const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
        const bH = (Math.abs(d.pnl) / max) * (chartH / 2) * eased;
        const bX = pad.l + i * barW + barW * 0.15;
        const bW = barW * 0.7;
        const isPos = d.pnl >= 0;

        // Solid flat colors
        ctx.fillStyle = isPos ? colors.primary : colors.secondary;
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1.5;
        ctx.fillRect(bX, isPos ? mid - bH : mid, bW, bH);
        ctx.strokeRect(bX, isPos ? mid - bH : mid, bW, bH);

        // Labels
        if (progress >= animTotal * 0.6) {
          ctx.fillStyle = colors.text;
          ctx.font = 'bold 9px "Space Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(d.yr.toString().slice(2), bX + bW / 2, H - pad.b + 12);
        }

        if (progress >= animTotal * 0.8 && eased > 0.9) {
          const fmt = (d.pnl >= 0 ? '+' : '') + Math.round(d.pnl / 1000) + 'k';
          ctx.fillStyle = colors.text;
          ctx.font = 'bold 8px "Space Mono", monospace';
          ctx.textAlign = 'center';
          const ty = isPos ? mid - bH - 6 : mid + bH + 12;
          ctx.fillText(fmt, bX + bW / 2, ty);
        }
      });
    }

    function animate() {
      animFrame++;
      drawFrame(animFrame);
      if (animFrame < animTotal + 20) requestAnimationFrame(animate);
    }
    setTimeout(animate, 200);

    const handleResize = () => { resize(); drawFrame(animTotal); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [theme, colors, asset]);

  return (
    <div
      className="relative h-[200px] overflow-hidden rounded"
      style={{
        border: `2px solid ${colors.border}`,
        background: colors.cardBg,
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

// ─── GJR-GARCH MATH & SIMULATION ENGINE (FOR INTERMEDIATE) ──────────────────────
const GARCH_FALLBACK_PRICES: Record<string, number[]> = {
  USDMXN: [
    18.28, 18.28, 18.31, 18.28, 18.17, 18.26, 18.18, 18.16, 18.03, 18.00,
    17.99, 17.98, 17.96, 18.01, 17.99, 17.96, 17.90, 17.93, 17.90, 17.97, 17.98,
    17.98, 17.91, 17.92, 17.98, 17.98, 17.91, 17.97, 17.96, 17.82, 17.79,
    17.65, 17.63, 17.59, 17.58, 17.48, 17.47, 17.37, 17.36, 17.16, 17.15, 17.23,
    17.47, 17.38, 17.24, 17.32, 17.50, 17.25, 17.21, 17.18, 17.19, 17.21,
    17.16, 17.17, 17.12, 17.21, 17.26, 17.10, 17.15, 17.22, 17.28, 17.19,
    17.25, 17.31, 17.24, 17.18, 17.22, 17.29, 17.35, 17.28, 17.21, 17.26,
    17.33, 17.27, 17.20, 17.25, 17.30, 17.23, 17.18, 17.22, 17.28, 17.34,
    17.27, 17.21, 17.26, 17.32, 17.28, 17.22, 17.18, 17.24, 17.30, 17.26,
    17.21, 17.27, 17.33, 17.28, 17.23, 17.19, 17.25, 17.28, 17.34, 17.29,
    17.24, 17.30, 17.36, 17.31, 17.27, 17.32, 17.28, 17.23, 17.29, 17.35,
    17.30, 17.26, 17.31, 17.37, 17.32, 17.28, 17.34, 17.51, 17.40, 17.35,
    17.27, 17.35, 17.46, 17.4975
  ],
  SPY: [
    547.6, 551.2, 548.8, 553.1, 556.7, 554.3, 558.6, 562.2, 559.8, 564.1,
    568.4, 565.9, 570.2, 574.5, 572.1, 576.4, 580.7, 578.3, 582.6, 586.9,
    584.5, 588.8, 592.4, 590.0, 594.3, 598.6, 596.2, 600.5, 604.8, 602.4,
    598.7, 594.3, 590.8, 595.2, 599.6, 603.1, 607.4, 605.0, 609.3, 613.6,
    611.2, 607.8, 603.4, 598.9, 594.5, 590.1, 595.6, 599.2, 603.7, 601.3,
    597.8, 594.3, 589.9, 594.4, 598.8, 603.3, 607.7, 605.3, 600.8, 596.4,
    591.9, 587.5, 592.0, 596.5, 601.0, 605.4, 603.0, 598.5, 594.1, 598.6,
    603.1, 607.5, 605.1, 600.7, 596.2, 591.8, 596.3, 600.7, 605.2, 603.8,
    599.3, 594.9, 590.4, 595.9, 600.3, 604.8, 602.4, 597.9, 593.5, 598.0,
    602.4, 606.9, 604.5, 600.0, 595.6, 591.1, 595.6, 600.1, 604.5, 602.1
  ],
  GLD: [
    431.3, 428.8, 426.3, 423.9, 421.5, 419.2, 416.9, 414.7, 412.5, 411.3,
    409.2, 411.8, 414.3, 416.9, 419.5, 422.2, 424.9, 427.7, 430.5, 433.3,
    436.2, 432.8, 429.5, 426.2, 422.9, 425.6, 428.4, 431.1, 433.9, 436.7,
    433.4, 430.1, 432.8, 435.5, 438.3, 441.1, 438.9, 436.6, 434.4, 432.2,
    430.0, 432.8, 435.6, 438.4, 436.2, 434.0, 436.8, 439.6, 437.4, 435.2,
    433.0, 435.8, 438.7, 436.5, 434.3, 432.1, 430.0, 432.8, 435.7, 437.6,
    435.4, 433.3, 431.1, 428.9, 431.8, 434.7, 437.6, 435.4, 433.3, 431.1,
    433.8, 436.5, 434.4, 432.2, 430.1, 432.9, 435.7, 433.6, 431.4, 429.3,
    432.1, 434.9, 432.8, 430.7, 432.5, 435.4, 433.2, 431.1, 429.0, 432.9,
    434.8, 432.6, 430.5, 432.3, 434.1, 432.0, 431.5, 433.2, 433.8, 411.3
  ],
  UNG: [
    7.27, 7.41, 7.34, 7.20, 7.06, 6.93, 7.07, 7.21, 7.35, 7.49,
    7.41, 7.27, 7.13, 6.99, 6.86, 6.99, 7.13, 7.27, 7.41, 7.34,
    7.20, 7.07, 6.94, 7.08, 7.22, 7.36, 7.50, 7.43, 7.29, 7.16,
    7.03, 6.90, 7.04, 7.18, 7.32, 7.46, 7.38, 7.24, 7.11, 6.98,
    7.12, 7.26, 7.40, 7.53, 7.45, 7.31, 7.18, 7.05, 6.92, 7.05,
    7.19, 7.33, 7.46, 7.38, 7.25, 7.12, 6.99, 7.13, 7.27, 7.40,
    7.32, 7.19, 7.06, 6.93, 7.07, 7.20, 7.34, 7.27, 7.13, 7.00,
    6.88, 7.01, 7.15, 7.28, 7.21, 7.08, 6.95, 7.09, 7.22, 7.36,
    7.28, 7.15, 7.02, 6.89, 7.03, 7.16, 7.30, 7.22, 7.09, 6.97,
    7.10, 7.24, 7.17, 7.04, 6.92, 7.05, 7.19, 7.12, 6.99, 7.20
  ]
};

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function studentT(nu: number) {
  const df = Math.max(3, Math.round(nu));
  const z = randn();
  let chi2 = 0;
  for (let i = 0; i < df; i++) {
    chi2 += Math.pow(randn(), 2);
  }
  const t = z / Math.sqrt(chi2 / df);
  return t * Math.sqrt((df - 2) / df);
}

function calibrateAndSimulateGJR(assetKey: string, horizon: number) {
  const prices = GARCH_FALLBACK_PRICES[assetKey] || GARCH_FALLBACK_PRICES['GLD'];
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }

  const n = returns.length;
  const mu = returns.reduce((s, r) => s + r, 0) / n;
  const uncVar = returns.reduce((s, r) => s + Math.pow(r - mu, 2), 0) / n;

  // MLE Grid search
  let bestLL = -Infinity;
  let best = { omega: uncVar * 0.05, alpha: 0.08, gamma: 0.06, beta: 0.88, nu: 6 };

  const alphas = [0.04, 0.08, 0.12];
  const gammas = [0.03, 0.06, 0.09];
  const betas = [0.80, 0.86, 0.90];
  const nus = [5, 8, 15];

  for (const a of alphas) {
    for (const gm of gammas) {
      for (const b of betas) {
        if (a + gm / 2 + b >= 0.99) continue;
        const om = uncVar * (1 - a - gm / 2 - b) * 0.1;
        if (om <= 0) continue;
        for (const nu of nus) {
          let v2 = uncVar;
          let ll = 0;
          for (const r of returns) {
            const eps = r - mu;
            if (v2 <= 0) { ll = -Infinity; break; }
            ll += -0.5 * Math.log(v2) - 0.5 * (nu + 1) * Math.log(1 + Math.pow(eps, 2) / (v2 * (nu - 2)));
            const ind = eps < 0 ? 1 : 0;
            v2 = om + a * Math.pow(eps, 2) + gm * ind * Math.pow(eps, 2) + b * v2;
            v2 = Math.max(v2, 1e-9);
          }
          if (ll > bestLL) {
            bestLL = ll;
            best = { omega: om, alpha: a, gamma: gm, beta: b, nu };
          }
        }
      }
    }
  }

  let currentVol2 = uncVar;
  for (const r of returns) {
    const eps = r - mu;
    const ind = eps < 0 ? 1 : 0;
    currentVol2 = best.omega + best.alpha * Math.pow(eps, 2) + best.gamma * ind * Math.pow(eps, 2) + best.beta * currentVol2;
    currentVol2 = Math.max(currentVol2, 1e-9);
  }

  // Monte Carlo Paths
  const nSims = 3000;
  const S_last = prices[prices.length - 1];
  const paths: number[][] = [];

  for (let s = 0; s < nSims; s++) {
    const path = [S_last];
    let v2 = currentVol2;
    for (let t = 0; t < horizon; t++) {
      const z = studentT(best.nu);
      const r = mu + Math.sqrt(v2) * z;
      path.push(path[path.length - 1] * Math.exp(r));
      const eps = r - mu;
      const ind = eps < 0 ? 1 : 0;
      v2 = Math.max(best.omega + best.alpha * Math.pow(eps, 2) + best.gamma * ind * Math.pow(eps, 2) + best.beta * v2, 1e-9);
    }
    paths.push(path);
  }

  const p10: number[] = [];
  const p50: number[] = [];
  const p90: number[] = [];

  for (let t = 0; t <= horizon; t++) {
    const vals = paths.map(p => p[t]).sort((a, b) => a - b);
    p10.push(vals[Math.floor(0.10 * nSims)]);
    p50.push(vals[Math.floor(0.50 * nSims)]);
    p90.push(vals[Math.floor(0.90 * nSims)]);
  }

  const volAnn = Math.sqrt(currentVol2 * 252) * 100;
  return { hist: prices.slice(-40), p10, p50, p90, volAnn, S_last };
}

function IntermediateGarchSimulator({ theme }: { theme: Theme }) {
  const [asset, setAsset] = useState('GLD');
  const [horizon, setHorizon] = useState(21);
  const [simResults, setSimResults] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = themeColors[theme];

  const runSimulation = useCallback(() => {
    const res = calibrateAndSimulateGJR(asset, horizon);
    setSimResults(res);
  }, [asset, horizon]);

  useEffect(() => {
    runSimulation();
  }, [asset, runSimulation]);

  useEffect(() => {
    if (!simResults) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dprVal = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dprVal;
    canvas.height = H * dprVal;
    ctx.scale(dprVal, dprVal);

    ctx.clearRect(0, 0, W, H);
    const { hist, p10, p50, p90, S_last } = simResults;
    const nH = hist.length;
    const tot = nH + horizon;
    
    const padL = 45;
    const padR = 15;
    const padT = 15;
    const padB = 25;
    const aw = W - padL - padR;
    const ah = H - padT - padB;

    const all = [...hist, ...p10, ...p90];
    const vMin = Math.min(...all) * 0.995;
    const vMax = Math.max(...all) * 1.005;

    const px = (i: number) => padL + (i / (tot - 1)) * aw;
    const py = (v: number) => padT + (1 - (v - vMin) / (vMax - vMin)) * ah;

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * ah;
      ctx.strokeStyle = theme === 'light' ? 'rgba(27, 38, 50, 0.08)' : 'rgba(238, 233, 223, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + aw, y);
      ctx.stroke();

      const val = vMax - (i / 4) * (vMax - vMin);
      ctx.fillStyle = colors.textMuted;
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(val < 20 ? 2 : 0), padL - 5, y + 3);
    }

    // Cone Fill (IC 80%)
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    for (let i = 0; i <= horizon; i++) {
      const x = px(nH - 1 + i);
      if (i === 0) ctx.moveTo(x, py(p90[i]));
      else ctx.lineTo(x, py(p90[i]));
    }
    for (let i = horizon; i >= 0; i--) {
      ctx.lineTo(px(nH - 1 + i), py(p10[i]));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Upper/Lower dotted lines
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = theme === 'light' ? 'rgba(163, 81, 57, 0.5)' : 'rgba(255, 177, 98, 0.5)';
    ctx.lineWidth = 1;
    for (const band of [p10, p90]) {
      ctx.beginPath();
      for (let i = 0; i <= horizon; i++) {
        const x = px(nH - 1 + i);
        if (i === 0) ctx.moveTo(x, py(band[i]));
        else ctx.lineTo(x, py(band[i]));
      }
      ctx.stroke();
    }
    ctx.restore();

    // Median prediction line
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= horizon; i++) {
      const x = px(nH - 1 + i);
      if (i === 0) ctx.moveTo(x, py(p50[i]));
      else ctx.lineTo(x, py(p50[i]));
    }
    ctx.stroke();

    // Historical prices
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < nH; i++) {
      const x = px(i);
      if (i === 0) ctx.moveTo(x, py(hist[i]));
      else ctx.lineTo(x, py(hist[i]));
    }
    ctx.stroke();

    // Separator line
    const sepX = px(nH - 1);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sepX, padT);
    ctx.lineTo(sepX, padT + ah);
    ctx.stroke();

    // Label separating real and projection
    ctx.fillStyle = colors.textMuted;
    ctx.font = 'bold 9px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← Real', padL + (sepX - padL) / 2, H - 4);
    ctx.fillText(`Proyección GJR-GARCH (${horizon}d) →`, sepX + (padL + aw - sepX) / 2, H - 4);

    // Current Price Node
    ctx.fillStyle = colors.text;
    ctx.beginPath();
    ctx.arc(sepX, py(S_last), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.secondary;
    ctx.font = 'bold 10px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(S_last.toFixed(S_last < 20 ? 3 : 1), sepX + 7, py(S_last) + 3);

  }, [simResults, horizon, theme, colors]);

  const assetNames: Record<string, string> = {
    GLD: 'Oro (GLD ETF)',
    SPY: 'S&P 500 (SPY ETF)',
    USDMXN: 'USD/MXN Tipo de Cambio',
    UNG: 'Gas Natural (UNG ETF)',
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5 p-5 mb-6 transition-colors"
      style={{
        border: `2px solid ${colors.border}`,
        background: colors.cardBg,
        boxShadow: `4px 4px 0px 0px ${colors.border}`
      }}
    >
      <div className="space-y-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest block mb-1 text-orange-400 font-bold">
            Modelo Cuantitativo
          </span>
          <h4 className="text-sm font-semibold" style={{ color: colors.text }}>Proyector GJR-GARCH</h4>
          <p className="text-[10px] mt-0.5 leading-relaxed font-medium" style={{ color: colors.textMuted }}>
            Calibra la asimetría de volatilidad en tiempo real y estima el rango probable de precios mediante simulación Monte Carlo.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider block mb-1" style={{ color: colors.textMuted }}>
              Activo Financiero
            </label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full border rounded px-2.5 py-1.5 text-xs outline-none font-bold"
              style={{
                background: colors.bg,
                borderColor: colors.border,
                color: colors.text
              }}
            >
              <option value="GLD">Oro (GLD)</option>
              <option value="SPY">S&P 500 (SPY)</option>
              <option value="USDMXN">USD/MXN</option>
              <option value="UNG">Gas Natural (UNG)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase font-mono tracking-wider block" style={{ color: colors.textMuted }}>
                Horizonte
              </label>
              <span className="text-xs font-mono font-bold" style={{ color: colors.secondary }}>{horizon}d</span>
            </div>
            <input
              type="range"
              min="5"
              max="42"
              step="1"
              value={horizon}
              onChange={(e) => setHorizon(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                background: colors.cardSecondary,
                accentColor: colors.primary
              }}
            />
          </div>

          <button
            onClick={runSimulation}
            className="w-full py-2 border hover:opacity-90 rounded text-xs font-bold font-mono tracking-wider transition uppercase cursor-pointer"
            style={{
              background: colors.primary,
              borderColor: colors.border,
              color: '#1B2632'
            }}
          >
            ▶ Recalcular
          </button>
        </div>

        {simResults && (
          <div
            className="border rounded p-3 text-[11px] leading-relaxed space-y-1.5 text-left"
            style={{
              background: colors.bg,
              borderColor: colors.border
            }}
          >
            <div>
              <span style={{ color: colors.textMuted }}>Vol Anualizada:</span>{' '}
              <span className="font-mono font-bold" style={{ color: colors.secondary }}>{simResults.volAnn.toFixed(1)}%</span>
            </div>
            <div className="text-[10px] leading-snug font-medium" style={{ color: colors.textMuted }}>
              Con 95% de confianza, {assetNames[asset]} se mantendrá entre{' '}
              <span className="font-mono font-bold" style={{ color: colors.secondary }}>
                ${simResults.p10[horizon].toFixed(asset === 'UNG' ? 2 : 1)}
              </span>{' '}
              y{' '}
              <span className="font-mono font-bold" style={{ color: colors.secondary }}>
                ${simResults.p90[horizon].toFixed(asset === 'UNG' ? 2 : 1)}
              </span>.
            </div>
          </div>
        )}
      </div>

      <div
        className="relative min-h-[220px] rounded overflow-hidden flex flex-col justify-between p-1.5 border"
        style={{
          background: colors.bg,
          borderColor: colors.border
        }}
      >
        <canvas ref={canvasRef} className="w-full h-[210px] block" />
        <div className="flex justify-between items-center px-2 py-1 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
          <span>Simulaciones: 3,000</span>
          <span>Modelo: GJR-GARCH Student-t</span>
        </div>
      </div>
    </div>
  );
}

// ─── BASIC LEVEL COMPONENT ─────────────────────────────────────────────────────
interface LevelProps {
  theme: Theme;
  selectedAsset: string;
  setSelectedAsset: (ticker: string) => void;
  marketAssets: { name: string; ticker: string; price: number; change: number }[];
  assetAnalytics: AssetAnalytics;
}

function BasicLevel({ theme, selectedAsset, setSelectedAsset, marketAssets, assetAnalytics }: LevelProps) {
  const colors = themeColors[theme];
  const label = ASSET_LABELS[selectedAsset] || 'oro';
  const assetName = ASSET_NAMES[selectedAsset] || 'Oro';
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: colors.secondary }}>
              Precio de {assetName} · Histórico Jun→Jul
            </span>
            <div className="flex-1 h-0.5" style={{ background: colors.border }} />
          </div>
          <HeroChart theme={theme} asset={selectedAsset} data={assetAnalytics.heroData} />
          <p className="text-[11px] mt-2 font-medium" style={{ color: colors.textMuted }}>
            Muestra el rendimiento por contrato de {label} en el período Jun→Jul de cada año. Las barras representan las ganancias o pérdidas netas de la estacionalidad.
          </p>
        </div>

        {/* Market Mood Gauge */}
        <div
          className="border p-5 rounded"
          style={{
            borderColor: colors.border,
            background: colors.cardBg,
            boxShadow: `4px 4px 0px 0px ${colors.border}`
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: colors.secondary }}>
              Medidor de Humor del Mercado
            </span>
          </div>
          <MarketMoodGauge theme={theme} moodValue={assetAnalytics.moodValue} assetName={label} />
          <p className="text-[11px] mt-3 text-center font-medium" style={{ color: colors.textMuted }}>
            Análisis estacional de commodities. Históricamente, el precio del {label} sube un {Math.round(assetAnalytics.moodValue * 100)}% de las veces durante julio.
          </p>
        </div>
      </div>

      {/* Asset Panel */}
      <div
        className="border p-5 rounded"
        style={{
          borderColor: colors.border,
          background: colors.cardBg,
          boxShadow: `4px 4px 0px 0px ${colors.border}`
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: colors.secondary }}>
            Panel de Activos Principales (Haz clic para ver gráfico)
          </span>
          <div className="flex-1 h-0.5" style={{ background: colors.border }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {marketAssets.map((asset) => {
            const isActive = selectedAsset === asset.ticker;
            const color = ASSET_COLORS[asset.ticker] || '#5B8DEF';
            return (
              <div
                key={asset.ticker}
                onClick={() => setSelectedAsset(asset.ticker)}
                className="border p-4 rounded transition-all duration-150 cursor-pointer active:scale-[0.98]"
                style={{
                  borderColor: isActive ? colors.secondary : colors.border,
                  borderWidth: isActive ? '2.5px' : '2px',
                  background: isActive ? colors.cardSecondary : colors.bg,
                }}
              >
                <div className="text-[9px] uppercase tracking-wider mb-1 font-bold" style={{ color: isActive ? (theme === 'light' ? '#1B2632' : '#EEE9DF') : colors.textMuted }}>
                  {asset.name}
                </div>
                <div className="font-mono text-lg font-bold" style={{ color: isActive ? (theme === 'light' ? '#1B2632' : '#EEE9DF') : colors.text }}>
                  ${asset.price.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {asset.change >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" style={{ color: isActive ? (theme === 'light' ? '#A35139' : '#FFB162') : colors.secondary }} />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" style={{ color: isActive ? (theme === 'light' ? '#A35139' : '#FFB162') : colors.secondary }} />
                  )}
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: isActive ? (theme === 'light' ? '#A35139' : '#FFB162') : colors.secondary }}
                  >
                    {asset.change >= 0 ? '+' : ''}{asset.change}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simple Signal Banner */}
      <div
        className="p-5 rounded flex flex-col sm:flex-row items-center gap-4 text-left"
        style={{
          background: colors.cardBg,
          border: `2px solid ${colors.border}`,
          boxShadow: `4px 4px 0px 0px ${colors.border}`
        }}
      >
        <div className="text-3xl text-orange-400">⬆</div>
        <div className="flex-1 text-center sm:text-left">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: colors.secondary }}>
            Ciclo de Commodities · Señal Estacional
          </div>
          <div className="text-[15px] font-bold mt-1" style={{ color: colors.text }}>
            {assetAnalytics.bannerTitle}
          </div>
          <div className="text-[11px] mt-1 font-medium" style={{ color: colors.textMuted }}>
            {assetAnalytics.bannerDescription}
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-3xl font-bold" style={{ color: colors.secondary }}>{Math.round(assetAnalytics.moodValue * 100)}%</span>
          <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: colors.textMuted }}>
            Probabilidad<br/>Histórica
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INTERMEDIATE LEVEL COMPONENT ──────────────────────────────────────────────
function IntermediateLevel({ theme, selectedAsset, setSelectedAsset, marketAssets, assetAnalytics }: LevelProps) {
  const colors = themeColors[theme];
  const assetName = ASSET_NAMES[selectedAsset] || 'Oro';
  const { monthlyReturns, calendarSignals, pnlHistory } = assetAnalytics;
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* GJR-GARCH Interactive Simulator (Fused Layer) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: colors.secondary }}>
            Simulador de Volatilidad Cuantitativa (Fusión GJR-GARCH)
          </span>
          <div className="flex-1 h-0.5" style={{ background: colors.border }} />
        </div>
        <IntermediateGarchSimulator theme={theme} />
      </div>

      {/* Seasonal Charts + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: colors.secondary }}>
              Rendimiento Estacional Jun→Jul · 15 Años ({selectedAsset})
            </span>
          </div>
          <HeroChart theme={theme} asset={selectedAsset} data={assetAnalytics.heroData} />
        </div>

        {/* Monthly Bar Chart */}
        <div
          className="border p-5 rounded"
          style={{
            borderColor: colors.border,
            background: colors.cardBg,
            boxShadow: `4px 4px 0px 0px ${colors.border}`
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: colors.secondary }}>
              Retorno Promedio Mensual (2010–2024)
            </span>
          </div>
          <div className="space-y-2">
            {monthlyReturns.map((m) => {
              const maxVal = Math.max(...monthlyReturns.map(r => Math.abs(r.avg)));
              const pctVal = maxVal > 0 ? (Math.abs(m.avg) / maxVal) * 100 : 0;
              const isPos = m.avg >= 0;
              const isJul = m.m === 'Jul';
              return (
                <div key={m.m} className="grid grid-cols-[55px_1fr_50px] items-center gap-2">
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{
                      color: isJul ? colors.secondary : colors.textMuted,
                    }}
                  >
                    {m.m}{isJul ? ' ★' : ''}
                  </span>
                  <div className="h-4 relative overflow-hidden border" style={{ background: colors.bg, borderColor: colors.border }}>
                    <div
                      className="absolute left-0 top-0 h-full transition-all duration-1000"
                      style={{
                        width: `${pctVal}%`,
                        background: isPos ? colors.primary : colors.secondary,
                      }}
                    />
                  </div>
                  <span
                    className="font-mono text-[10px] text-right font-bold"
                    style={{ color: isPos ? colors.text : colors.secondary }}
                  >
                    {isPos ? '+' : ''}{m.avg.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Strip */}
      <div
        className="border p-5 rounded"
        style={{
          borderColor: colors.border,
          background: colors.cardBg,
          boxShadow: `4px 4px 0px 0px ${colors.border}`
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: colors.secondary }}>
            Ciclo Anual del {assetName} · Señales por Mes
          </span>
          <div className="flex-1 h-0.5" style={{ background: colors.border }} />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1 border-t border-l" style={{ borderColor: colors.border }}>
          {calendarSignals.map((cal) => {
            const bgVal = cal.type === 'active' ? colors.primary : cal.type === 'bullish' ? colors.cardSecondary : 'transparent';
            return (
              <div
                key={cal.m}
                className="p-2 text-center border-r border-b"
                style={{
                  borderColor: colors.border,
                  background: bgVal,
                }}
              >
                <div className="font-mono text-[8px] font-bold" style={{ color: colors.text }}>{cal.m}</div>
                <div className="font-mono text-[8px] mt-1 font-bold" style={{ color: colors.secondary }}>{cal.signal}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* P&L Table */}
      <div
        className="border p-5 rounded overflow-x-auto"
        style={{
          borderColor: colors.border,
          background: colors.cardBg,
          boxShadow: `4px 4px 0px 0px ${colors.border}`
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: colors.secondary }}>
            Historial Año por Año — Jun → Jul
          </span>
          <div className="flex-1 h-0.5" style={{ background: colors.border }} />
        </div>
        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Año', 'Entrada Jun', 'Salida Jul', 'Cambio', 'P&L/contrato', 'Resultado'].map((h) => (
                <th
                  key={h}
                  className="font-mono text-[9px] uppercase tracking-wider pb-2 font-bold"
                  style={{
                    color: colors.textMuted,
                    borderBottom: `2px solid ${colors.border}`,
                    padding: '0 8px 10px',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pnlHistory.map((row) => {
              const chg = ((row.x - row.e) / row.e * 100);
              const win = row.pnl > 0;
              return (
                <tr
                  key={row.yr}
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${colors.border}` }}
                >
                  <td className="font-mono text-[11px] py-2.5 px-2" style={{ color: colors.text }}>{row.yr}</td>
                  <td className="font-mono text-[11px] py-2.5 px-2" style={{ color: colors.textMuted }}>${row.e.toLocaleString()}</td>
                  <td className="font-mono text-[11px] py-2.5 px-2" style={{ color: colors.textMuted }}>${row.x.toLocaleString()}</td>
                  <td className="font-mono text-[11px] py-2.5 px-2 font-bold" style={{ color: chg >= 0 ? colors.text : colors.secondary }}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </td>
                  <td className="font-mono text-[11px] py-2.5 px-2 font-bold" style={{ color: win ? colors.text : colors.secondary }}>
                    {row.pnl >= 0 ? '+' : ''}${Math.abs(row.pnl).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span
                      className="inline-block font-mono text-[9px] tracking-wider px-2 py-0.5 border"
                      style={{
                        background: win ? colors.primary : colors.bg,
                        color: colors.text,
                        borderColor: colors.border,
                        fontWeight: 'bold'
                      }}
                    >
                      {win ? '✅ SUBE' : '❌ BAJA'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
          <span className="font-mono text-[10px] font-bold" style={{ color: colors.textMuted }}>GANADORES</span>
          <span className="font-mono text-[12px] font-bold" style={{ color: colors.text }}>{assetAnalytics.winRate}%</span>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[10px] font-bold" style={{ color: colors.textMuted }}>P&L PROMEDIO</span>
          <span className="font-mono text-[12px] font-bold" style={{ color: colors.secondary }}>+${assetAnalytics.avgPnl.toLocaleString()} / contrato</span>
        </div>
      </div>

      {/* Signal banner for intermediate */}
      <div
        className="p-5 rounded grid gap-5"
        style={{
          background: colors.cardBg,
          border: `2px solid ${colors.border}`,
          boxShadow: `4px 4px 0px 0px ${colors.border}`,
          gridTemplateColumns: 'auto 1fr auto',
        }}
      >
        <div className="w-14 h-14 flex items-center justify-center text-2xl border" style={{ background: colors.bg, borderColor: colors.border }}>
          ⬆
        </div>
        <div className="text-left">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-1 font-bold" style={{ color: colors.secondary }}>
            Señal Activa · Rally Estacional
          </div>
          <div className="text-[15px] font-bold" style={{ color: colors.text }}>
            {assetAnalytics.signalTitle}
          </div>
          <div className="text-[11px] mt-0.5 font-medium" style={{ color: colors.textMuted }}>
            {assetAnalytics.signalDescription}
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-4xl font-bold" style={{ color: colors.secondary }}>{Math.round(assetAnalytics.moodValue * 100)}%</span>
          <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: colors.textMuted }}>
            {assetAnalytics.confidenceText}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADVANCED LEVEL COMPONENT ──────────────────────────────────────────────────
function AdvancedLevel({ theme, selectedAsset, setSelectedAsset, marketAssets, assetAnalytics }: LevelProps) {
  const [subTab, setSubTab] = useState<'cuantitativa' | 'estacional'>('cuantitativa');
  const colors = themeColors[theme];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub tabs inside advanced */}
      <div className="flex gap-4 pb-1 border-b" style={{ borderColor: colors.border }}>
        <button
          onClick={() => setSubTab('cuantitativa')}
          className="pb-2 text-xs font-bold font-mono tracking-wide transition uppercase cursor-pointer"
          style={{
            borderBottom: subTab === 'cuantitativa' ? `3px solid ${colors.secondary}` : '3px solid transparent',
            color: subTab === 'cuantitativa' ? colors.secondary : colors.textMuted,
          }}
        >
          Capa Cuantitativa (GJR-GARCH MLE)
        </button>
        <button
          onClick={() => setSubTab('estacional')}
          className="pb-2 text-xs font-bold font-mono tracking-wide transition uppercase cursor-pointer"
          style={{
            borderBottom: subTab === 'estacional' ? `3px solid ${colors.secondary}` : '3px solid transparent',
            color: subTab === 'estacional' ? colors.secondary : colors.textMuted,
          }}
        >
          Capa Estacional (Historial COMEX)
        </button>
      </div>

      {subTab === 'cuantitativa' && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className="flex items-start gap-3 p-4 rounded text-[12px] text-left"
            style={{
              background: colors.cardBg,
              border: `2px solid ${colors.border}`,
              boxShadow: `4px 4px 0px 0px ${colors.border}`,
              color: colors.text,
            }}
          >
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.secondary }} />
            <div>
              <strong style={{ color: colors.text }}>Capa Cuantitativa Avanzada:</strong> Motor predictivo GJR-GARCH con calibración de parámetros MLE, simulaciones Monte Carlo, tests estadísticos de Kupiec/Christoffersen y detector de régimen de volatilidad.
            </div>
          </div>
          <div
            className="w-full rounded overflow-hidden border"
            style={{
              borderColor: colors.border,
              boxShadow: `4px 4px 0px 0px ${colors.border}`
            }}
          >
            {/* Syncing theme to the iframe via dynamic URL or shared localStorage trigger */}
            <iframe
              src={`/motor_predictivo_v3.html?theme=${theme}`}
              className="w-full border-none"
              style={{ height: '1350px', background: colors.cardBg }}
              title="Motor Predictivo GJR-GARCH"
            />
          </div>
        </div>
      )}

      {subTab === 'estacional' && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className="flex items-start gap-3 p-4 rounded text-[12px] text-left"
            style={{
              background: colors.cardBg,
              border: `2px solid ${colors.border}`,
              boxShadow: `4px 4px 0px 0px ${colors.border}`,
              color: colors.text,
            }}
          >
            <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.secondary }} />
            <div>
              <strong style={{ color: colors.text }}>Capa Estacional Histórica:</strong> Análisis estacional del Oro COMEX con datos propios de 15 años (2010–2024) y niveles operativos de trading.
            </div>
          </div>
          <div
            className="w-full rounded overflow-hidden border"
            style={{
              borderColor: colors.border,
              boxShadow: `4px 4px 0px 0px ${colors.border}`
            }}
          >
            <iframe
              src={`/oro_estacional_dashboard.html?theme=${theme}`}
              className="w-full border-none"
              style={{ height: '2200px', background: colors.cardBg }}
              title="Dashboard Estacional del Oro"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CTA BANNER ────────────────────────────────────────────────────────────────
function CtaBanner({ theme, selectedAsset, setSelectedAsset, marketAssets, assetAnalytics }: LevelProps) {
  const colors = themeColors[theme];
  return (
    <div
      className="p-6 md:p-10 rounded text-left transition-colors"
      style={{
        background: colors.cardBg,
        border: `2px solid ${colors.border}`,
        boxShadow: `4px 4px 0px 0px ${colors.border}`
      }}
    >
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
        <div className="max-w-xl">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3 font-bold" style={{ color: colors.secondary }}>
            FinNova Academy · Formación Financiera Práctica
          </div>
          <h3 className="text-2xl font-bold leading-tight mb-3" style={{ color: colors.text }}>
            ¿Quieres entender los niveles<br />básico, intermedio y experto?
          </h3>
          <p className="text-[13px] leading-relaxed font-medium" style={{ color: colors.textMuted }}>
            Explora nuestros cursos y contenido educativo diseñado para que puedas sacarle provecho al mercado financiero. Desde conceptos fundamentales hasta análisis técnico avanzado — aprende a tu ritmo con certificación validada por IA.
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            {['📊 Futuros y Derivados', '🥇 Commodities', '📈 Análisis Técnico', '⚖️ Gestión de Riesgo'].map(p => (
              <span
                key={p}
                className="text-[11px] px-3 py-1 border"
                style={{ borderColor: colors.border, color: colors.text, background: colors.bg, fontWeight: 'bold' }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
          <Link
            to="/cursos"
            className="px-8 py-3.5 font-bold text-[13px] tracking-wider uppercase text-center transition-all duration-150 border active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            style={{
              background: colors.primary,
              borderColor: colors.border,
              color: '#1B2632',
              boxShadow: `3px 3px 0px 0px ${colors.border}`,
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Ver Cursos y Contenido →
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 text-[12px] tracking-wider uppercase text-center transition-all duration-150 border active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            style={{
              background: colors.cardBg,
              borderColor: colors.border,
              color: colors.text,
              boxShadow: `3px 3px 0px 0px ${colors.border}`,
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Registrarme Ahora
          </Link>
        </div>
      </div>
    </div>
  );
}

type Level = 'basico' | 'intermedio' | 'avanzado';

const LEVELS: { key: Level; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: 'basico',
    label: 'Básico',
    icon: <Eye className="w-4 h-4" />,
    description: 'Para principiantes. Datos visuales y directos.',
  },
  {
    key: 'intermedio',
    label: 'Intermedio',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Datos históricos y proyector de volatilidad.',
  },
  {
    key: 'avanzado',
    label: 'Avanzado',
    icon: <Lock className="w-4 h-4" />,
    description: 'Análisis cuantitativo avanzado y estacionalidad.',
  },
];

const DEFAULT_ANALYTICS: AssetAnalytics = {
  monthlyReturns: [{ m: 'Ene', avg: 0, pp: 0 }, { m: 'Feb', avg: 0, pp: 0 }, { m: 'Mar', avg: 0, pp: 0 }, { m: 'Abr', avg: 0, pp: 0 }, { m: 'May', avg: 0, pp: 0 }, { m: 'Jun', avg: 0, pp: 0 }, { m: 'Jul', avg: 0, pp: 0 }, { m: 'Ago', avg: 0, pp: 0 }, { m: 'Sep', avg: 0, pp: 0 }, { m: 'Oct', avg: 0, pp: 0 }, { m: 'Nov', avg: 0, pp: 0 }, { m: 'Dic', avg: 0, pp: 0 }],
  calendarSignals: [],
  pnlHistory: [],
  heroData: [],
  moodValue: 0.5,
  winRate: 50,
  avgPnl: 0,
  signalTitle: '',
  signalDescription: '',
  confidenceText: 'Confianza Estacional',
  bannerTitle: '',
  bannerDescription: '',
};

export default function MarketLanding() {
  const [activeLevel, setActiveLevel] = useState<Level>('basico');
  const [selectedAsset, setSelectedAsset] = useState<string>('XAU');
  const [livePrice, setLivePrice] = useState(4078);
  const [marketAssets, setMarketAssets] = useState(DEFAULT_ASSETS);
  const [allAssetData, setAllAssetData] = useState<any[]>([]);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const colors = themeColors[theme];

  // Sync theme to document body class and local storage
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.style.backgroundColor = colors.bg;
    document.documentElement.style.backgroundColor = colors.bg;
    try {
      window.dispatchEvent(new Event('themechange'));
    } catch (_) {}
  }, [theme, colors.bg]);

  // Fetch real market data from backend (prices + analytics)
  useEffect(() => {
    let mounted = true;

    async function fetchPrices() {
      try {
        const data = await api.getMarketPrices();
        if (!mounted) return;
        if (data.assets && data.assets.length > 0) {
          setMarketAssets(data.assets);
          setAllAssetData(data.assets);
          const selected = data.assets.find((a: any) => a.ticker === selectedAsset);
          if (selected) setLivePrice(selected.price);
        }
      } catch (err) {
        console.warn('[Market] API fallback, using defaults');
        setMarketAssets(DEFAULT_ASSETS);
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Compute selectedAsset analytics whenever the asset or data changes
  const assetAnalytics: AssetAnalytics = React.useMemo(() => {
    const found = allAssetData.find((a: any) => a.ticker === selectedAsset);
    if (found && found.monthlyReturns) {
      return {
        monthlyReturns: found.monthlyReturns,
        calendarSignals: found.calendarSignals,
        pnlHistory: found.pnlHistory,
        heroData: found.heroData,
        moodValue: found.moodValue,
        winRate: found.winRate,
        avgPnl: found.avgPnl,
        signalTitle: found.signalTitle,
        signalDescription: found.signalDescription,
        confidenceText: found.confidenceText || 'Confianza Estacional',
        bannerTitle: found.bannerTitle,
        bannerDescription: found.bannerDescription,
      };
    }
    return DEFAULT_ANALYTICS;
  }, [selectedAsset, allAssetData]);

  // Update livePrice when selectedAsset changes
  useEffect(() => {
    const selected = marketAssets.find(a => a.ticker === selectedAsset);
    if (selected) setLivePrice(selected.price);
  }, [selectedAsset, marketAssets]);

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        background: colors.bg,
        color: colors.text,
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>

      {/* HEADER */}
      <header
        className="flex items-center justify-between px-5 md:px-10 py-4 sticky top-0 z-50 transition-colors"
        style={{
          borderBottom: `2px solid ${colors.border}`,
          background: colors.cardBg,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center font-mono text-[14px] font-bold"
            style={{ border: `2.5px solid ${colors.border}`, color: colors.text, background: colors.primary }}
          >
            FA
          </div>
          <div className="text-left">
            <div className="text-[13px] tracking-[0.18em] uppercase font-bold" style={{ color: colors.text }}>
              FinNova Academy
            </div>
            <div className="text-[10px] tracking-[0.12em] uppercase font-bold" style={{ color: colors.textMuted }}>
              Análisis Cuantitativo · Mercados Financieros
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Theme Toggler Button */}
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="p-2 border rounded cursor-pointer transition-all active:scale-95"
            style={{
              borderColor: colors.border,
              background: colors.bg,
              color: colors.text,
            }}
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] tracking-wider font-bold" style={{ color: colors.secondary }}>
            ORO ~${Math.round(livePrice).toLocaleString()}
          </div>

          <Link
            to="/cursos"
            className="px-5 py-2 text-[11px] font-bold tracking-wider uppercase transition-all duration-150 border active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            style={{
              borderColor: colors.border,
              color: colors.text,
              background: colors.primary,
              boxShadow: `3px 3px 0px 0px ${colors.border}`,
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Ver Cursos
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="px-5 md:px-10 py-12 md:py-16 text-left" style={{ borderBottom: `2px solid ${colors.border}` }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: colors.secondary }}>
                Dashboard de Mercado · Análisis Real
              </span>
              <div className="flex-1 h-0.5" style={{ background: colors.border }} />
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-3"
              style={{ color: colors.text }}
            >
              Entiende el Mercado<br />
              <span style={{ color: colors.secondary }}>a Tu Nivel</span>
            </h1>
            <p className="text-[15px] leading-relaxed max-w-md mb-8 font-medium" style={{ color: colors.textMuted }}>
              Explora datos financieros reales en 3 niveles de complejidad. Desde lo más básico hasta herramientas avanzadas de análisis profesional.
            </p>
            <div className="flex gap-6">
              <div>
                <span className="font-mono text-3xl font-bold block leading-none" style={{ color: colors.secondary }}>3</span>
                <div className="text-[10px] uppercase tracking-wider mt-1 font-bold" style={{ color: colors.textMuted }}>Niveles</div>
              </div>
              <div>
                <span className="font-mono text-3xl font-bold block leading-none" style={{ color: colors.secondary }}>15</span>
                <div className="text-[10px] uppercase tracking-wider mt-1 font-bold" style={{ color: colors.textMuted }}>Años de datos</div>
              </div>
              <div>
                <span className="font-mono text-3xl font-bold block leading-none" style={{ color: colors.secondary }}>$4k+</span>
                <div className="text-[10px] uppercase tracking-wider mt-1 font-bold" style={{ color: colors.textMuted }}>Precio actual</div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <HeroChart theme={theme} asset={selectedAsset} />
          </div>
        </div>
      </section>

      {/* LEVEL SELECTOR + CONTENT */}
      <main className="px-5 md:px-10 py-10 max-w-6xl mx-auto">
        {/* Level Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.key}
              onClick={() => setActiveLevel(lvl.key)}
              className="flex items-center gap-3 px-5 py-3.5 rounded transition-all duration-150 text-left flex-1 cursor-pointer border active:translate-x-0.5 active:translate-y-0.5"
              style={{
                borderColor: colors.border,
                background: activeLevel === lvl.key ? colors.primary : colors.cardBg,
                boxShadow: activeLevel === lvl.key ? 'none' : `3px 3px 0px 0px ${colors.border}`,
              }}
            >
              <div
                className="p-2 border"
                style={{
                  background: activeLevel === lvl.key ? colors.cardBg : colors.bg,
                  color: colors.text,
                  borderColor: colors.border,
                }}
              >
                {lvl.icon}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: activeLevel === lvl.key ? '#1B2632' : colors.text }}>
                  {lvl.label}
                </div>
                <div className="text-[10px] font-medium" style={{ color: activeLevel === lvl.key ? '#2C3B4D' : colors.textMuted }}>
                  {lvl.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Level Content */}
        {activeLevel === 'basico' && <BasicLevel theme={theme} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} marketAssets={marketAssets} assetAnalytics={assetAnalytics} />}
        {activeLevel === 'intermedio' && <IntermediateLevel theme={theme} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} marketAssets={marketAssets} assetAnalytics={assetAnalytics} />}
        {activeLevel === 'avanzado' && <AdvancedLevel theme={theme} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} marketAssets={marketAssets} assetAnalytics={assetAnalytics} />}

        {/* CTA — Only for basic and intermediate */}
        {activeLevel !== 'avanzado' && <CtaBanner theme={theme} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} marketAssets={marketAssets} assetAnalytics={assetAnalytics} />}
      </main>

      {/* FOOTER */}
      <footer
        className="px-5 md:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold"
        style={{
          borderTop: `2px solid ${colors.border}`,
          color: colors.textMuted,
        }}
      >
        <span>© 2026 FinNova Academy · Datos de 15 años · LBMA PM Price · CME COMEX</span>
        <span>⚠ No constituye asesoría de inversión. Gestiona tu riesgo.</span>
      </footer>
    </div>
  );
}
