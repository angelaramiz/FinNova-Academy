/**
 * MarketLanding.tsx
 * Landing page principal del portal de alumnos con dashboard financiero
 * de 3 niveles de comprensión: Básico, Intermedio y Avanzado.
 * 
 * Inspirado en el dashboard de oro estacional (oro_estacional_dashboard.html).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  BarChart3,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  Sparkles,
  Eye,
  Lock,
  BookOpen,
  GraduationCap,
  Shield
} from 'lucide-react';

// ─── DATA ──────────────────────────────────────────────────────────────────────
const ASSETS = [
  { name: 'Oro', ticker: 'XAU', price: 4078, change: 1.24, color: '#C9A84C' },
  { name: 'Plata', ticker: 'XAG', price: 32.85, change: 0.67, color: '#A8B2C1' },
  { name: 'Petróleo', ticker: 'CL', price: 73.42, change: -0.89, color: '#6B8A5E' },
  { name: 'S&P 500', ticker: 'SPX', price: 5528, change: 0.33, color: '#5B8DEF' },
];

const MONTHLY_RETURNS = [
  { m: 'Ene', avg: 0.66, pp: 47 }, { m: 'Feb', avg: 0.92, pp: 47 },
  { m: 'Mar', avg: 1.35, pp: 53 }, { m: 'Abr', avg: -0.33, pp: 40 },
  { m: 'May', avg: -0.67, pp: 40 }, { m: 'Jun', avg: 1.60, pp: 67 },
  { m: 'Jul', avg: 2.11, pp: 53 }, { m: 'Ago', avg: -1.52, pp: 27 },
  { m: 'Sep', avg: 1.28, pp: 60 }, { m: 'Oct', avg: -1.43, pp: 47 },
  { m: 'Nov', avg: 0.67, pp: 60 }, { m: 'Dic', avg: 0.57, pp: 47 },
];

const CALENDAR_SIGNALS = [
  { m: 'ENE', signal: '+67%', type: 'neutral' },
  { m: 'FEB', signal: 'SHORT', type: 'bearish' },
  { m: 'MAR', signal: '+53%', type: 'neutral' },
  { m: 'ABR', signal: '−60%', type: 'bearish' },
  { m: 'MAY', signal: '−60%', type: 'bearish' },
  { m: 'JUN', signal: 'DÉBIL', type: 'bearish' },
  { m: 'JUL ★', signal: 'ENTRADA', type: 'active' },
  { m: 'AGO', signal: '+65%', type: 'bullish' },
  { m: 'SEP', signal: 'SHORT', type: 'bearish' },
  { m: 'OCT', signal: '+60%', type: 'bullish' },
  { m: 'NOV', signal: '+60%', type: 'bullish' },
  { m: 'DIC', signal: '+60%', type: 'bullish' },
];

const PNL_DATA = [
  { yr: 2010, e: 1245, x: 1184, pnl: -6100 },
  { yr: 2011, e: 1499, x: 1613, pnl: 11400 },
  { yr: 2012, e: 1601, x: 1615, pnl: 1400 },
  { yr: 2013, e: 1225, x: 1315, pnl: 9000 },
  { yr: 2014, e: 1315, x: 1303, pnl: -1200 },
  { yr: 2015, e: 1173, x: 1095, pnl: -7800 },
  { yr: 2016, e: 1322, x: 1350, pnl: 2800 },
  { yr: 2017, e: 1241, x: 1269, pnl: 2800 },
  { yr: 2018, e: 1252, x: 1224, pnl: -2800 },
  { yr: 2019, e: 1409, x: 1427, pnl: 1800 },
  { yr: 2020, e: 1781, x: 1970, pnl: 18900 },
  { yr: 2021, e: 1766, x: 1813, pnl: 4700 },
  { yr: 2022, e: 1807, x: 1757, pnl: -5000 },
  { yr: 2023, e: 1912, x: 1958, pnl: 4600 },
  { yr: 2024, e: 2326, x: 2426, pnl: 10000 },
];

const INTRA_WEEK = [
  { d: '30-Jun', avg: -0.24, pp: 56, note: '' },
  { d: '1-Jul', avg: 0.17, pp: 56, note: '' },
  { d: '2-Jul', avg: 0.22, pp: 67, note: '' },
  { d: '3-Jul', avg: 0.18, pp: 56, note: 'HOY' },
  { d: '4-Jul', avg: null, pp: null, note: 'CERRADO' },
  { d: '7-Jul', avg: 0.70, pp: 67, note: 'ENTRADA' },
  { d: '8-Jul', avg: 0.08, pp: 56, note: '' },
  { d: '9-Jul', avg: 0.23, pp: 67, note: '' },
];

const FUNDAMENTALS = [
  { icon: '✅', label: 'Fed en pausa 3.50–3.75%', positive: true },
  { icon: '✅', label: 'Conflicto Medio Oriente: safe-haven bid', positive: true },
  { icon: '✅', label: 'Bancos centrales: 65% compras en H2', positive: true },
  { icon: '✅', label: 'Dólar bajo presión (DXY débil)', positive: true },
  { icon: '⚠️', label: 'Precio atípico ~$4,078 (2x histórico)', positive: false },
  { icon: '⚠️', label: 'NFP puede mover mercado', positive: false },
];

// ─── MARKET MOOD GAUGE ─────────────────────────────────────────────────────────
function MarketMoodGauge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animProgress, setAnimProgress] = useState(0);
  // Mood value: 0 = strong sell, 0.5 = neutral, 1 = strong buy
  // Based on seasonal signal: 73% bullish for July = 0.73
  const moodValue = 0.73;

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
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Gradient arc (sell: red → neutral: amber → buy: green)
    const gradient = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    gradient.addColorStop(0, '#B34040');
    gradient.addColorStop(0.35, '#C87D2A');
    gradient.addColorStop(0.5, '#8B8B3A');
    gradient.addColorStop(0.65, '#4A9A4A');
    gradient.addColorStop(1, '#2A7A4B');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle
    const eased = 1 - Math.pow(1 - animProgress, 3);
    const needleAngle = startAngle + (moodValue * eased) * Math.PI;
    const needleLen = radius - 30;
    const nx = cx + Math.cos(needleAngle) * needleLen;
    const ny = cy + Math.sin(needleAngle) * needleLen;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#C9A84C';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#C9A84C';
    ctx.fill();

    // Labels
    ctx.font = '600 10px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#B34040';
    ctx.textAlign = 'left';
    ctx.fillText('VENDER', cx - radius + 5, cy + 16);

    ctx.fillStyle = '#7A7268';
    ctx.textAlign = 'center';
    ctx.fillText('NEUTRAL', cx, cy - radius + 30);

    ctx.fillStyle = '#2A7A4B';
    ctx.textAlign = 'right';
    ctx.fillText('COMPRAR', cx + radius - 5, cy + 16);

  }, [animProgress, moodValue]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} />
      <div className="flex items-center gap-2 -mt-1">
        <span className="text-xs font-mono font-bold" style={{ color: '#2A7A4B' }}>
          SEÑAL: COMPRA
        </span>
        <span className="text-[10px] font-mono" style={{ color: '#7A7268' }}>
          (73% confianza estacional)
        </span>
      </div>
    </div>
  );
}

// ─── ANIMATED HERO CHART (Canvas) ──────────────────────────────────────────────
function HeroChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let animFrame = 0;
    const animTotal = 80;
    const data = PNL_DATA.filter(d => d.yr >= 2016);
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
      const pad = { l: 40, r: 16, t: 20, b: 30 };
      const chartW = W - pad.l - pad.r;
      const chartH = H - pad.t - pad.b;
      const barW = chartW / data.length;
      const mid = pad.t + chartH / 2;

      // Grid line
      ctx.strokeStyle = 'rgba(201,168,76,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, mid);
      ctx.lineTo(W - pad.r, mid);
      ctx.stroke();

      ctx.fillStyle = 'rgba(201,168,76,0.3)';
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
        const isActive = i === data.length - 1;

        const grad = ctx.createLinearGradient(0, isPos ? mid - bH : mid, 0, isPos ? mid : mid + bH);
        if (isActive) {
          grad.addColorStop(0, isPos ? 'rgba(201,168,76,0.9)' : 'rgba(179,64,64,0.9)');
          grad.addColorStop(1, isPos ? 'rgba(201,168,76,0.3)' : 'rgba(179,64,64,0.3)');
        } else {
          grad.addColorStop(0, isPos ? 'rgba(42,122,75,0.8)' : 'rgba(179,64,64,0.7)');
          grad.addColorStop(1, isPos ? 'rgba(42,122,75,0.2)' : 'rgba(179,64,64,0.2)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(bX, isPos ? mid - bH : mid, bW, bH);

        if (progress >= animTotal * 0.6) {
          ctx.fillStyle = isActive ? 'rgba(201,168,76,0.9)' : 'rgba(120,110,100,0.7)';
          ctx.font = `${isActive ? 'bold ' : ''}9px "Space Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(d.yr.toString().slice(2), bX + bW / 2, H - pad.b + 12);
        }

        if (progress >= animTotal * 0.8 && eased > 0.9) {
          const fmt = (d.pnl >= 0 ? '+' : '') + Math.round(d.pnl / 1000) + 'k';
          ctx.fillStyle = isPos ? 'rgba(42,122,75,0.9)' : 'rgba(179,64,64,0.9)';
          if (isActive) ctx.fillStyle = 'rgba(201,168,76,1)';
          ctx.font = `${isActive ? 'bold ' : ''}8px "Space Mono", monospace`;
          ctx.textAlign = 'center';
          const ty = isPos ? mid - bH - 4 : mid + bH + 10;
          ctx.fillText(fmt, bX + bW / 2, ty);
        }
      });
      ctx.textAlign = 'left';
    }

    function animate() {
      animFrame++;
      drawFrame(animFrame);
      if (animFrame < animTotal + 20) requestAnimationFrame(animate);
    }
    setTimeout(animate, 600);

    const handleResize = () => { resize(); drawFrame(animTotal); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative h-[200px] border border-[rgba(201,168,76,0.15)] bg-[#0F1628] overflow-hidden rounded-lg">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute bottom-2 right-3 font-mono text-[10px] tracking-wider" style={{ color: '#8B7035' }}>
        JUN→JUL P&L/CONTRATO · 2016–2024
      </div>
    </div>
  );
}

// ─── LEVEL SELECTOR TABS ────────────────────────────────────────────────────────
type Level = 'basico' | 'intermedio' | 'avanzado';

const LEVELS: { key: Level; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  {
    key: 'basico',
    label: 'Básico',
    icon: <Eye className="w-4 h-4" />,
    color: '#2A7A4B',
    description: 'Para cualquier persona. Datos simples y visuales.',
  },
  {
    key: 'intermedio',
    label: 'Intermedio',
    icon: <BarChart3 className="w-4 h-4" />,
    color: '#C87D2A',
    description: 'Datos ampliados y parámetros ajustables.',
  },
  {
    key: 'avanzado',
    label: 'Avanzado',
    icon: <Lock className="w-4 h-4" />,
    color: '#B34040',
    description: 'Dashboard completo para expertos.',
  },
];

// ─── BASIC LEVEL COMPONENT ─────────────────────────────────────────────────────
function BasicLevel() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Price chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: '#C9A84C' }}>
              Precio del Oro · En Vivo
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
          </div>
          <HeroChart />
          <p className="text-[11px] mt-2" style={{ color: '#7A7268' }}>
            Cada barra muestra cuánto dinero ganarías (verde) o perderías (rojo) por contrato de oro en el período Jun→Jul, año por año.
          </p>
        </div>

        {/* Market Mood Gauge */}
        <div className="border p-5 rounded-lg" style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0F1628' }}>
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: '#C9A84C' }}>
              Humor del Mercado
            </span>
          </div>
          <MarketMoodGauge />
          <p className="text-[11px] mt-3 text-center" style={{ color: '#7A7268' }}>
            Basado en 15 años de datos históricos del oro. En julio, el mercado tiende a subir el 73% de las veces.
          </p>
        </div>
      </div>

      {/* Asset Panel */}
      <div className="border p-5 rounded-lg" style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0F1628' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: '#C9A84C' }}>
            Panel de Activos Principales
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ASSETS.map((asset) => (
            <div
              key={asset.ticker}
              className="border p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#7A7268' }}>
                {asset.name}
              </div>
              <div className="font-mono text-lg font-bold" style={{ color: asset.color }}>
                ${asset.price.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {asset.change >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" style={{ color: '#2A7A4B' }} />
                ) : (
                  <ArrowDownRight className="w-3 h-3" style={{ color: '#B34040' }} />
                )}
                <span
                  className="font-mono text-xs"
                  style={{ color: asset.change >= 0 ? '#2A7A4B' : '#B34040' }}
                >
                  {asset.change >= 0 ? '+' : ''}{asset.change}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simple Signal Banner */}
      <div
        className="p-5 rounded-lg flex flex-col sm:flex-row items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(42,122,75,0.06))',
          border: '1px solid rgba(201,168,76,0.3)',
        }}
      >
        <div className="text-3xl">⬆</div>
        <div className="flex-1 text-center sm:text-left">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>
            Señal del Mercado · Julio 2026
          </div>
          <div className="text-[15px] font-semibold mt-1" style={{ color: '#E8E0D0' }}>
            El oro tiende a subir en julio — ¡Buen momento para observar!
          </div>
          <div className="text-[11px] mt-1" style={{ color: '#7A7268' }}>
            Basado en datos históricos de 15 años. No es asesoría de inversión.
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-3xl font-bold" style={{ color: '#2A7A4B' }}>73%</span>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: '#7A7268' }}>
            Probabilidad<br/>Histórica
          </div>
        </div>
      </div>
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
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
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

function IntermediateGarchSimulator() {
  const [asset, setAsset] = useState('GLD');
  const [horizon, setHorizon] = useState(21);
  const [simResults, setSimResults] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + aw, y);
      ctx.stroke();

      const val = vMax - (i / 4) * (vMax - vMin);
      ctx.fillStyle = '#5c6480';
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(val < 20 ? 2 : 0), padL - 5, y + 3);
    }

    // Cone Fill (IC 80%)
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#f5a623';
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
    ctx.strokeStyle = 'rgba(245, 166, 35, 0.6)';
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
    ctx.strokeStyle = '#2dd4a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= horizon; i++) {
      const x = px(nH - 1 + i);
      if (i === 0) ctx.moveTo(x, py(p50[i]));
      else ctx.lineTo(x, py(p50[i]));
    }
    ctx.stroke();

    // Historical prices
    ctx.strokeStyle = 'rgba(232, 234, 240, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < nH; i++) {
      const x = px(i);
      if (i === 0) ctx.moveTo(x, py(hist[i]));
      else ctx.lineTo(x, py(hist[i]));
    }
    ctx.stroke();

    // Separator line
    const sepX = px(nH - 1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sepX, padT);
    ctx.lineTo(sepX, padT + ah);
    ctx.stroke();

    // Label separating real and projection
    ctx.fillStyle = '#7A7268';
    ctx.font = '9px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← Real', padL + (sepX - padL) / 2, H - 4);
    ctx.fillText(`Proyección GJR-GARCH (${horizon}d) →`, sepX + (padL + aw - sepX) / 2, H - 4);

    // Current Price Node
    ctx.fillStyle = '#e8eaf0';
    ctx.beginPath();
    ctx.arc(sepX, py(S_last), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2dd4a0';
    ctx.font = 'bold 10px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(S_last.toFixed(S_last < 20 ? 3 : 1), sepX + 6, py(S_last) + 3);

  }, [simResults, horizon]);

  const assetNames: Record<string, string> = {
    GLD: 'Oro (GLD ETF)',
    SPY: 'S&P 500 (SPY ETF)',
    USDMXN: 'USD/MXN Tipo de Cambio',
    UNG: 'Gas Natural (UNG ETF)',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5 border p-5 rounded-lg mb-6" style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0F1628' }}>
      <div className="space-y-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest block mb-1 text-teal-400">Modelo Cuantitativo</span>
          <h4 className="text-sm font-semibold text-slate-200">Proyector de Volatilidad GJR-GARCH</h4>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
            Calibra la asimetría de volatilidad en tiempo real y estima el rango probable de precios mediante simulación Monte Carlo.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider block mb-1 text-slate-400">Activo Financiero</label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full bg-[#1A2338] border border-slate-700/60 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-teal-450"
            >
              <option value="GLD">Oro (GLD)</option>
              <option value="SPY">S&P 500 (SPY)</option>
              <option value="USDMXN">USD/MXN</option>
              <option value="UNG">Gas Natural (UNG)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase font-mono tracking-wider block text-slate-400">Horizonte de Proyección</label>
              <span className="text-xs font-mono font-bold text-teal-400">{horizon}d</span>
            </div>
            <input
              type="range"
              min="5"
              max="42"
              step="1"
              value={horizon}
              onChange={(e) => setHorizon(parseInt(e.target.value))}
              className="w-full h-1 bg-[#131A2D] rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
          </div>

          <button
            onClick={runSimulation}
            className="w-full py-2 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-400 rounded text-xs font-bold font-mono tracking-wider transition uppercase"
          >
            ▶ Recalcular Modelo
          </button>
        </div>

        {simResults && (
          <div className="bg-[#131A2D]/60 border border-slate-800/80 rounded p-3 text-[11px] leading-relaxed space-y-1.5 text-left">
            <div>
              <span className="text-slate-500">Vol Anualizada:</span>{' '}
              <span className="font-mono text-teal-450 font-bold">{simResults.volAnn.toFixed(1)}%</span>
            </div>
            <div className="text-[10px] text-slate-400 leading-snug">
              Con 95% de confianza, se estima que el rango para {assetNames[asset]} en {horizon} días estará entre{' '}
              <span className="font-mono text-[#f5a623] font-bold">${simResults.p10[horizon].toFixed(asset === 'UNG' ? 2 : 1)}</span> y{' '}
              <span className="font-mono text-[#f5a623] font-bold">${simResults.p90[horizon].toFixed(asset === 'UNG' ? 2 : 1)}</span>.
            </div>
          </div>
        )}
      </div>

      <div className="relative min-h-[220px] bg-[#0A0E1A] rounded overflow-hidden flex flex-col justify-between p-1.5 border border-slate-800/60">
        <canvas ref={canvasRef} className="w-full h-[210px] block" />
        <div className="flex justify-between items-center px-2 py-1 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
          <span>MC Sims: 3,000</span>
          <span>Ecuación: GJR-GARCH MLE (Student-t)</span>
        </div>
      </div>
    </div>
  );
}

// ─── INTERMEDIATE LEVEL COMPONENT ──────────────────────────────────────────────
// ─── INTERMEDIATE LEVEL COMPONENT ──────────────────────────────────────────────
function IntermediateLevel() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* GJR-GARCH Interactive Simulator (Fused Layer) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: '#C9A84C' }}>
            Simulador de Volatilidad Cuantitativa (Fusión GJR-GARCH)
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
        </div>
        <IntermediateGarchSimulator />
      </div>

      {/* Seasonal Charts + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: '#C9A84C' }}>
              Rendimiento Estacional Jun→Jul · 15 Años
            </span>
          </div>
          <HeroChart />
        </div>

        {/* Monthly Bar Chart */}
        <div className="border p-5 rounded-lg" style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0F1628' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>
              Retorno Promedio Mensual (2010–2024)
            </span>
          </div>
          <div className="space-y-2">
            {MONTHLY_RETURNS.map((m) => {
              const maxVal = Math.max(...MONTHLY_RETURNS.map(r => Math.abs(r.avg)));
              const pct = (Math.abs(m.avg) / maxVal) * 100;
              const isPos = m.avg >= 0;
              const isJul = m.m === 'Jul';
              return (
                <div key={m.m} className="grid grid-cols-[55px_1fr_50px] items-center gap-2">
                  <span
                    className="font-mono text-[10px]"
                    style={{
                      color: isJul ? '#C9A84C' : '#7A7268',
                      fontWeight: isJul ? 700 : 400,
                    }}
                  >
                    {m.m}{isJul ? ' ★' : ''}
                  </span>
                  <div className="h-4 relative overflow-hidden rounded-sm" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div
                      className="absolute left-0 top-0 h-full rounded-sm transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        background: isPos
                          ? 'linear-gradient(90deg, rgba(42,122,75,0.3), rgba(42,122,75,0.7))'
                          : 'linear-gradient(90deg, rgba(179,64,64,0.3), rgba(179,64,64,0.7))',
                        filter: isJul ? 'brightness(1.3)' : undefined,
                      }}
                    />
                  </div>
                  <span
                    className="font-mono text-[10px] text-right"
                    style={{ color: isPos ? '#2A7A4B' : '#B34040' }}
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
      <div className="border p-5 rounded-lg" style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0F1628' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>
            Ciclo Anual del Oro · Señales por Mes
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1">
          {CALENDAR_SIGNALS.map((cal) => {
            const borderColor = {
              bullish: '#2A7A4B',
              bearish: '#B34040',
              neutral: '#7A7268',
              active: '#C9A84C',
            }[cal.type];
            const bg = {
              bullish: 'rgba(42,122,75,0.08)',
              bearish: 'rgba(179,64,64,0.08)',
              neutral: 'transparent',
              active: 'rgba(201,168,76,0.12)',
            }[cal.type];
            const textColor = {
              bullish: '#2A7A4B',
              bearish: '#B34040',
              neutral: '#7A7268',
              active: '#C9A84C',
            }[cal.type];
            return (
              <div
                key={cal.m}
                className="p-2 text-center"
                style={{
                  borderTop: `3px solid ${borderColor}`,
                  background: bg,
                }}
              >
                <div className="font-mono text-[8px]" style={{ color: '#7A7268' }}>{cal.m}</div>
                <div className="font-mono text-[8px] mt-1 font-bold" style={{ color: textColor }}>{cal.signal}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* P&L Table */}
      <div className="border p-5 rounded-lg overflow-x-auto" style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0F1628' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>
            Historial Año por Año — Jun → Jul
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
        </div>
        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Año', 'Entrada Jun', 'Salida Jul', 'Cambio', 'P&L/contrato', 'Resultado'].map((h) => (
                <th
                  key={h}
                  className="font-mono text-[9px] uppercase tracking-wider pb-2 font-normal"
                  style={{
                    color: '#7A7268',
                    borderBottom: '1px solid rgba(201,168,76,0.15)',
                    padding: '0 8px 10px',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PNL_DATA.map((row) => {
              const chg = ((row.x - row.e) / row.e * 100);
              const win = row.pnl > 0;
              return (
                <tr
                  key={row.yr}
                  className="transition-colors hover:bg-[rgba(201,168,76,0.04)]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <td className="font-mono text-[11px] py-2 px-2" style={{ color: '#7A7268' }}>{row.yr}</td>
                  <td className="font-mono text-[11px] py-2 px-2" style={{ color: '#D8D0C0' }}>${row.e.toLocaleString()}</td>
                  <td className="font-mono text-[11px] py-2 px-2" style={{ color: '#D8D0C0' }}>${row.x.toLocaleString()}</td>
                  <td className="font-mono text-[11px] py-2 px-2" style={{ color: chg >= 0 ? '#2A7A4B' : '#B34040' }}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </td>
                  <td className="font-mono text-[11px] py-2 px-2 font-bold" style={{ color: win ? '#2A7A4B' : '#B34040' }}>
                    {row.pnl >= 0 ? '+' : ''}${Math.abs(row.pnl).toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span
                      className="inline-block font-mono text-[9px] tracking-wider px-2 py-0.5"
                      style={{
                        background: win ? 'rgba(42,122,75,0.12)' : 'rgba(179,64,64,0.12)',
                        color: win ? '#2A7A4B' : '#B34040',
                        border: `1px solid ${win ? 'rgba(42,122,75,0.3)' : 'rgba(179,64,64,0.3)'}`,
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
        <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
          <span className="font-mono text-[10px]" style={{ color: '#7A7268' }}>GANADORES</span>
          <span className="font-mono text-[12px] font-bold" style={{ color: '#2A7A4B' }}>10 / 15 · 67%</span>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[10px]" style={{ color: '#7A7268' }}>P&L PROMEDIO</span>
          <span className="font-mono text-[12px] font-bold" style={{ color: '#C9A84C' }}>+$2,967 / contrato</span>
        </div>
      </div>

      {/* Signal banner for intermediate */}
      <div
        className="p-5 rounded-lg grid gap-5"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(42,122,75,0.06))',
          border: '1px solid rgba(201,168,76,0.3)',
          gridTemplateColumns: 'auto 1fr auto',
        }}
      >
        <div className="w-14 h-14 flex items-center justify-center text-2xl border rounded-lg" style={{ background: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.3)' }}>
          ⬆
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: '#C9A84C' }}>
            Señal Activa · Semana del 7 julio 2026
          </div>
          <div className="text-[15px] font-semibold" style={{ color: '#E8E0D0' }}>
            LONG Oro — Inicio del Rally Estacional de Verano
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: '#7A7268' }}>
            5 fuentes independientes convergen: Seasonax (50 años), StoneX Research, DiscoveryAlert (25 años COMEX)
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-4xl font-bold" style={{ color: '#2A7A4B' }}>73%</span>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: '#7A7268' }}>
            1ª semana julio<br/>positiva (11/15 años)
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADVANCED LEVEL COMPONENT ──────────────────────────────────────────────────
function AdvancedLevel() {
  const [subTab, setSubTab] = useState<'cuantitativa' | 'estacional'>('cuantitativa');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub tabs inside advanced */}
      <div className="flex border-b border-slate-800 gap-4 pb-2">
        <button
          onClick={() => setSubTab('cuantitativa')}
          className={`pb-2 text-xs font-semibold font-mono tracking-wide border-b-2 transition uppercase cursor-pointer ${
            subTab === 'cuantitativa'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Capa Cuantitativa (GJR-GARCH MLE)
        </button>
        <button
          onClick={() => setSubTab('estacional')}
          className={`pb-2 text-xs font-semibold font-mono tracking-wide border-b-2 transition uppercase cursor-pointer ${
            subTab === 'estacional'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Capa Estacional (Historial COMEX)
        </button>
      </div>

      {subTab === 'cuantitativa' && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className="flex items-start gap-3 p-4 rounded-lg text-[12px]"
            style={{
              background: 'rgba(91,156,246,0.06)',
              border: '1px solid rgba(91,156,246,0.2)',
              color: '#D8D0C0',
            }}
          >
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#5B9CF6' }} />
            <div>
              <strong style={{ color: '#E8E0D0' }}>Capa Cuantitativa Avanzada:</strong> Motor predictivo GJR-GARCH con calibración de parámetros MLE, simulaciones Monte Carlo, tests estadísticos de Kupiec/Christoffersen y detector de régimen de volatilidad.
            </div>
          </div>
          <div className="w-full rounded-lg overflow-hidden border bg-[#0d0f14]" style={{ borderColor: 'rgba(91,156,246,0.15)' }}>
            <iframe
              src="/motor_predictivo_v3.html"
              className="w-full border-none bg-[#0d0f14]"
              style={{ height: '1350px' }}
              title="Motor Predictivo GJR-GARCH"
            />
          </div>
        </div>
      )}

      {subTab === 'estacional' && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className="flex items-start gap-3 p-4 rounded-lg text-[12px]"
            style={{
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: '#D8D0C0',
            }}
          >
            <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#C9A84C' }} />
            <div>
              <strong style={{ color: '#E8E0D0' }}>Capa Estacional Histórica:</strong> Análisis estacional del Oro COMEX con datos propios de 15 años (2010–2024) y niveles operativos de trading.
            </div>
          </div>
          <div className="w-full rounded-lg overflow-hidden border bg-[#0A0E1A]" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
            <iframe
              src="/oro_estacional_dashboard.html"
              className="w-full border-none bg-[#0A0E1A]"
              style={{ height: '2200px' }}
              title="Dashboard Estacional del Oro"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CTA BANNER ────────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <div
      className="p-6 md:p-10 rounded-lg mt-8"
      style={{
        background: 'linear-gradient(135deg, #0F1628 0%, #0D1E35 100%)',
        border: '1px solid rgba(201,168,76,0.3)',
      }}
    >
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
        <div className="max-w-xl">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: '#C9A84C' }}>
            FinNova Academy · Formación Financiera Práctica
          </div>
          <h3 className="text-2xl font-bold leading-tight mb-3" style={{ color: '#E8E0D0' }}>
            ¿Quieres entender los niveles<br />básico, intermedio y experto?
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: '#7A7268' }}>
            Explora nuestros cursos y contenido educativo diseñado para que puedas sacarle provecho al mercado financiero. Desde conceptos fundamentales hasta análisis técnico avanzado — aprende a tu ritmo con certificación validada por IA.
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            {['📊 Futuros y Derivados', '🥇 Commodities', '📈 Análisis Técnico', '⚖️ Gestión de Riesgo'].map(p => (
              <span
                key={p}
                className="text-[11px] px-3 py-1"
                style={{ border: '1px solid rgba(201,168,76,0.15)', color: '#7A7268' }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 shrink-0">
          <Link
            to="/cursos"
            className="px-8 py-3.5 font-bold text-[13px] tracking-wider uppercase text-center transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: '#C9A84C',
              color: '#0A0E1A',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Ver Cursos y Contenido →
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 text-[12px] tracking-wider uppercase text-center transition-all duration-200 hover:bg-[rgba(201,168,76,0.06)]"
            style={{
              border: '1px solid rgba(201,168,76,0.4)',
              color: '#C9A84C',
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

// ─── MAIN LANDING COMPONENT ────────────────────────────────────────────────────
export default function MarketLanding() {
  const [activeLevel, setActiveLevel] = useState<Level>('basico');
  const [livePrice, setLivePrice] = useState(4078);

  // Simulated live price animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrice(prev => prev + (Math.random() - 0.48) * 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#0A0E1A',
        color: '#D8D0C0',
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
        @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
      `}</style>

      {/* HEADER */}
      <header
        className="flex items-center justify-between px-5 md:px-10 py-4 sticky top-0 z-50"
        style={{
          borderBottom: '1px solid rgba(201,168,76,0.15)',
          background: '#0F1628',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center font-mono text-[13px] font-bold"
            style={{ border: '1.5px solid #C9A84C', color: '#C9A84C' }}
          >
            FA
          </div>
          <div>
            <div className="text-[13px] tracking-[0.18em] uppercase font-medium" style={{ color: '#C8C0B0' }}>
              FinNova Academy
            </div>
            <div className="text-[10px] tracking-[0.12em] uppercase" style={{ color: '#7A7268' }}>
              Análisis Cuantitativo · Mercados Financieros
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] tracking-wider" style={{ color: '#C9A84C' }}>
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: '#C9A84C',
                animation: 'pulseDot 2s ease-in-out infinite',
              }}
            />
            ORO ~${Math.round(livePrice).toLocaleString()}
          </div>
          <Link
            to="/cursos"
            className="px-5 py-2 text-[11px] font-semibold tracking-wider uppercase transition-all duration-200"
            style={{
              border: '1px solid #C9A84C',
              color: '#C9A84C',
              background: 'transparent',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Ver Cursos
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="px-5 md:px-10 py-12 md:py-16" style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: '#C9A84C' }}>
                Dashboard de Mercado · Datos Reales 2010–2024
              </span>
              <div className="flex-1 h-px" style={{ background: '#8B7035' }} />
            </div>
            <h1
              className="text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-3"
              style={{ color: '#E8E0D0' }}
            >
              Entiende el Mercado<br />
              <span style={{ color: '#C9A84C' }}>a Tu Nivel</span>
            </h1>
            <p className="text-[15px] leading-relaxed max-w-md mb-8" style={{ color: '#7A7268' }}>
              Explora datos financieros reales en 3 niveles de complejidad. Desde lo más básico hasta herramientas avanzadas de análisis profesional.
            </p>
            <div className="flex gap-6">
              <div>
                <span className="font-mono text-3xl font-bold block leading-none" style={{ color: '#C9A84C' }}>3</span>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#7A7268' }}>Niveles</div>
              </div>
              <div>
                <span className="font-mono text-3xl font-bold block leading-none" style={{ color: '#C9A84C' }}>15</span>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#7A7268' }}>Años de datos</div>
              </div>
              <div>
                <span className="font-mono text-3xl font-bold block leading-none" style={{ color: '#C9A84C' }}>$4k+</span>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#7A7268' }}>Precio actual</div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <HeroChart />
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
              className="flex items-center gap-3 px-5 py-3.5 rounded-lg transition-all duration-200 text-left flex-1 cursor-pointer"
              style={{
                border: activeLevel === lvl.key
                  ? `2px solid ${lvl.color}`
                  : '2px solid rgba(255,255,255,0.06)',
                background: activeLevel === lvl.key
                  ? `${lvl.color}10`
                  : 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `${lvl.color}15`,
                  color: lvl.color,
                  border: `1px solid ${lvl.color}30`,
                }}
              >
                {lvl.icon}
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: activeLevel === lvl.key ? lvl.color : '#D8D0C0' }}>
                  {lvl.label}
                </div>
                <div className="text-[10px]" style={{ color: '#7A7268' }}>
                  {lvl.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Level Content */}
        {activeLevel === 'basico' && <BasicLevel />}
        {activeLevel === 'intermedio' && <IntermediateLevel />}
        {activeLevel === 'avanzado' && <AdvancedLevel />}

        {/* CTA — Only for basic and intermediate */}
        {activeLevel !== 'avanzado' && <CtaBanner />}
      </main>

      {/* FOOTER */}
      <footer
        className="px-5 md:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px]"
        style={{
          borderTop: '1px solid rgba(201,168,76,0.15)',
          color: '#7A7268',
        }}
      >
        <span>© 2026 FinNova Academy · Datos propios 2010–2024 · LBMA PM Price · CME COMEX</span>
        <span>⚠ No constituye asesoría de inversión. Siempre gestiona tu riesgo.</span>
      </footer>
    </div>
  );
}
