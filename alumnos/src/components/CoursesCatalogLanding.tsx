/**
 * CoursesCatalogLanding.tsx
 * Landing informativa / catálogo de cursos.
 * Muestra qué aprenderá el alumno y un CTA hacia registro.
 * 
 * Rediseñado con estilo Minimalista Flat Design (Neo-brutalismo suave)
 * Soporta modo Light y Dark basados en la paleta de colores del usuario.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  BarChart3,
  Shield,
  Zap,
  Target,
  Award,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Star,
  Sun,
  Moon
} from 'lucide-react';
import { themeColors } from './MarketLanding';

type Theme = 'light' | 'dark';

const MODULES = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Mentalidad y Fundamentos de Inversión',
    description: 'Aprende los pilares psicológicos y conceptuales del inversor exitoso. Entiende cómo funcionan los mercados desde cero.',
    topics: ['Psicología del mercado', 'Tipos de activos', 'Riesgo vs. retorno', 'Interés compuesto'],
    level: 'Principiante',
    duration: '4 semanas',
    color: '#2A7A4B',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Análisis de Empresas y Ratios Financieros',
    description: 'Domina los ratios financieros P/E, P/B, ROE y la valuación DCF para evaluar empresas como un profesional.',
    topics: ['Ratios P/E y P/B', 'WACC y costo de capital', 'Flujo de caja descontado', 'Análisis comparativo'],
    level: 'Intermedio',
    duration: '6 semanas',
    color: '#C87D2A',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />, // Changed from TrendingUp to keep icons clean
    title: 'Análisis Técnico y Patrones de Mercado',
    description: 'Identifica patrones de precio, soportes, resistencias y señales de trading usando datos históricos reales.',
    topics: ['Velas japonesas', 'Soportes y resistencias', 'Medias móviles', 'Indicadores RSI y MACD'],
    level: 'Intermedio',
    duration: '5 semanas',
    color: '#C87D2A',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Gestión de Riesgo y Portafolios',
    description: 'Aprende a diversificar, calcular el riesgo de portafolio y establecer estrategias de stop-loss y cobertura.',
    topics: ['Diversificación', 'Value at Risk (VaR)', 'Cobertura con derivados', 'Rebalanceo'],
    level: 'Avanzado',
    duration: '6 semanas',
    color: '#B34040',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Futuros, Derivados y Commodities',
    description: 'Entiende contratos de futuros CME, márgenes de garantía, apalancamiento y análisis estacional de commodities.',
    topics: ['Contratos de futuros', 'Márgenes CME', 'Análisis estacional', 'Oro, plata, petróleo'],
    level: 'Avanzado',
    duration: '8 semanas',
    color: '#B34040',
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Modelos Cuantitativos y Volatilidad',
    description: 'Construye modelos GJR-GARCH, Black-Scholes y simulaciones Monte Carlo para pricing de opciones y gestión activa.',
    topics: ['Volatilidad GARCH', 'Black-Scholes', 'Monte Carlo', 'Estrategias de opciones'],
    level: 'Experto',
    duration: '10 semanas',
    color: '#5B8DEF',
  },
];

const STATS = [
  { value: '500+', label: 'Alumnos Formados', icon: <Users className="w-5 h-5" /> },
  { value: '15+', label: 'Módulos Prácticos', icon: <BookOpen className="w-5 h-5" /> },
  { value: '95%', label: 'Tasa de Finalización', icon: <Award className="w-5 h-5" /> },
  { value: '60s', label: 'Clips Conceptuales', icon: <Clock className="w-5 h-5" /> },
];

const BENEFITS = [
  'Clips de video de 60 segundos con conceptos financieros esenciales',
  'Laboratorios prácticos con datos reales del mercado',
  'Ejercicios interactivos validados por IA (Gemini)',
  'Certificaciones digitales verificables por empleadores',
  'Simuladores de trading y futuros CME en vivo',
  'Atención directa de instructores expertos',
];

export default function CoursesCatalogLanding() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const colors = themeColors[theme];

  // Sync theme
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.style.backgroundColor = colors.bg;
    document.documentElement.style.backgroundColor = colors.bg;
    try {
      window.dispatchEvent(new Event('themechange'));
    } catch (_) {}
  }, [theme, colors.bg]);

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        background: colors.bg,
        color: colors.text,
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
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
        <Link to="/" className="flex items-center gap-3 hover:opacity-85 transition">
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
              Catálogo de Formación Financiera
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {/* Theme Toggler */}
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="p-2 border rounded cursor-pointer transition-all active:scale-95 animate-fadeIn"
            style={{
              borderColor: colors.border,
              background: colors.bg,
              color: colors.text,
            }}
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <Link
            to="/"
            className="hidden sm:inline-block px-4 py-2 text-[11px] font-bold tracking-wider uppercase transition-all"
            style={{ color: colors.secondary }}
          >
            ← Dashboard
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 text-[11px] font-bold tracking-wider uppercase transition-all duration-150 border active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            style={{
              background: colors.primary,
              borderColor: colors.border,
              color: '#1B2632',
              boxShadow: `3px 3px 0px 0px ${colors.border}`,
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Registrarme
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="px-5 md:px-10 py-16 md:py-24 text-center" style={{ borderBottom: `2px solid ${colors.border}` }}>
        <div className="max-w-3xl mx-auto animate-fadeIn">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: colors.secondary }}>
              Programa de Formación Cuantitativa y Estacional
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 animate-fadeIn"
            style={{ color: colors.text }}
          >
            Aprende a Leer el Mercado<br />
            <span style={{ color: colors.secondary }}>Como un Profesional</span>
          </h1>
          <p className="text-[15px] leading-relaxed max-w-xl mx-auto mb-8 font-medium animate-fadeIn" style={{ color: colors.textMuted }}>
            Domina los mercados mediante el uso de modelos estadísticos y patrones históricos. Clases prácticas, simuladores interactivos y mentoría IA personalizada.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-4 py-2 border rounded"
                style={{
                  borderColor: colors.border,
                  background: colors.cardBg,
                  boxShadow: `3px 3px 0px 0px ${colors.border}`
                }}
              >
                <span style={{ color: colors.secondary }}>{stat.icon}</span>
                <div className="text-left">
                  <span className="font-mono text-sm font-bold block" style={{ color: colors.text }}>{stat.value}</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: colors.textMuted }}>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES GRID */}
      <section className="px-5 md:px-10 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: colors.secondary }}>
            Módulos de Aprendizaje
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: colors.text }}>
            Ruta de Formación Completa
          </h2>
          <p className="text-[13px] max-w-lg mx-auto font-medium" style={{ color: colors.textMuted }}>
            Cada módulo combina clips de 60 segundos, laboratorios prácticos en Canvas y validaciones automáticas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((mod) => (
            <div
              key={mod.title}
              className="p-6 rounded flex flex-col justify-between transition-all duration-150 border group hover:translate-y-[-2px]"
              style={{
                background: colors.cardBg,
                borderColor: colors.border,
                boxShadow: `4px 4px 0px 0px ${colors.border}`
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-2 border"
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      borderColor: colors.border
                    }}
                  >
                    {mod.icon}
                  </div>
                  <span
                    className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border"
                    style={{
                      color: colors.text,
                      borderColor: colors.border,
                      background: colors.bg,
                      fontWeight: 'bold'
                    }}
                  >
                    {mod.level}
                  </span>
                </div>
                <h3 className="text-sm font-bold mb-2 transition-colors group-hover:text-orange-450" style={{ color: colors.text }}>
                  {mod.title}
                </h3>
                <p className="text-[11px] leading-relaxed mb-4 font-medium" style={{ color: colors.textMuted }}>
                  {mod.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {mod.topics.map(t => (
                    <span
                      key={t}
                      className="text-[9px] px-2 py-0.5 border"
                      style={{
                        background: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                        fontWeight: 'bold'
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: colors.border }}>
                <span className="font-mono text-[10px] font-bold" style={{ color: colors.textMuted }}>
                  <Clock className="w-3 h-3 inline mr-1" />{mod.duration}
                </span>
                <span className="text-[10px] font-bold flex items-center gap-0.5 transition group-hover:text-orange-450" style={{ color: colors.secondary }}>
                  Ver Módulo <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section
        className="px-5 md:px-10 py-16 transition-colors"
        style={{
          background: colors.cardBg,
          borderTop: `2px solid ${colors.border}`,
          borderBottom: `2px solid ${colors.border}`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: colors.secondary }}>
              ¿Por qué FinNova Academy?
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: colors.text }}>
              Metodología Diseñada para Resultados
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded border text-left"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                  boxShadow: `3px 3px 0px 0px ${colors.border}`
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.secondary }} />
                <span className="text-[12px] font-semibold" style={{ color: colors.text }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 md:px-10 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-5 h-5 fill-current" style={{ color: colors.primary }} />
              ))}
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: colors.text }}>
            Comienza Tu Formación Financiera
          </h2>
          <p className="text-[14px] leading-relaxed mb-8 max-w-md mx-auto font-medium" style={{ color: colors.textMuted }}>
            Regístrate hoy mismo y accede de inmediato al catálogo de cursos, laboratorios interactivos y certificación inteligente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-10 py-4 font-bold text-[14px] tracking-wider uppercase transition-all duration-150 border active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-2"
              style={{
                background: colors.primary,
                borderColor: colors.border,
                color: '#1B2632',
                boxShadow: `4px 4px 0px 0px ${colors.border}`,
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Crear Mi Cuenta <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="px-8 py-4 text-[13px] tracking-wider uppercase transition-all duration-150 border active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
              style={{
                background: colors.cardBg,
                borderColor: colors.border,
                color: colors.text,
                boxShadow: `4px 4px 0px 0px ${colors.border}`,
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="px-5 md:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold"
        style={{
          borderTop: `2px solid ${colors.border}`,
          color: colors.textMuted,
        }}
      >
        <span>© 2026 FinNova Academy · Formación Práctica</span>
        <span>Validación inteligente vía Gemini AI</span>
      </footer>
    </div>
  );
}
