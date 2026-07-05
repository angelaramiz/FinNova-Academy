/**
 * CoursesCatalogLanding.tsx
 * Landing informativa / catálogo de cursos.
 * Muestra qué aprenderá el alumno y un CTA hacia registro.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
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
  Star
} from 'lucide-react';

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
    icon: <TrendingUp className="w-6 h-6" />,
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
  return (
    <div
      className="min-h-screen"
      style={{
        background: '#0A0E1A',
        color: '#D8D0C0',
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
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
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
              Catálogo de Formación Financiera
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden sm:inline-block px-4 py-2 text-[11px] font-semibold tracking-wider uppercase transition-all"
            style={{ color: '#C9A84C' }}
          >
            ← Dashboard
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 text-[11px] font-semibold tracking-wider uppercase transition-all duration-200"
            style={{
              background: '#C9A84C',
              color: '#0A0E1A',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Registrarme
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="px-5 md:px-10 py-16 md:py-24 text-center" style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
        <div className="max-w-3xl mx-auto animate-fadeIn">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: '#C9A84C' }}>
              Programa Completo de Formación
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-4"
            style={{ color: '#E8E0D0' }}
          >
            Aprende a Leer el Mercado<br />
            <span style={{ color: '#C9A84C' }}>Como un Profesional</span>
          </h1>
          <p className="text-[15px] leading-relaxed max-w-xl mx-auto mb-8" style={{ color: '#7A7268' }}>
            Desde conceptos fundamentales hasta modelos cuantitativos avanzados. Formación práctica con datos reales, ejercicios interactivos evaluados por IA y certificación verificable.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-4 py-2"
                style={{
                  border: '1px solid rgba(201,168,76,0.15)',
                  background: 'rgba(15,22,40,0.6)',
                }}
              >
                <span style={{ color: '#C9A84C' }}>{stat.icon}</span>
                <div className="text-left">
                  <span className="font-mono text-sm font-bold block" style={{ color: '#E8E0D0' }}>{stat.value}</span>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: '#7A7268' }}>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES GRID */}
      <section className="px-5 md:px-10 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase mb-3" style={{ color: '#C9A84C' }}>
            Módulos de Aprendizaje
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#E8E0D0' }}>
            Ruta de Formación Completa
          </h2>
          <p className="text-[13px] max-w-lg mx-auto" style={{ color: '#7A7268' }}>
            Cada módulo combina clips conceptuales, ejercicios prácticos y evaluaciones por IA para garantizar tu aprendizaje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((mod) => (
            <div
              key={mod.title}
              className="p-6 rounded-lg flex flex-col justify-between transition-all duration-200 hover:translate-y-[-2px] group"
              style={{
                background: '#0F1628',
                border: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-2.5 rounded-lg"
                    style={{
                      background: `${mod.color}15`,
                      color: mod.color,
                      border: `1px solid ${mod.color}30`,
                    }}
                  >
                    {mod.icon}
                  </div>
                  <span
                    className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5"
                    style={{
                      color: mod.color,
                      border: `1px solid ${mod.color}30`,
                      background: `${mod.color}10`,
                    }}
                  >
                    {mod.level}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-2 group-hover:text-[#C9A84C] transition-colors" style={{ color: '#E8E0D0' }}>
                  {mod.title}
                </h3>
                <p className="text-[11px] leading-relaxed mb-4" style={{ color: '#7A7268' }}>
                  {mod.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {mod.topics.map(t => (
                    <span
                      key={t}
                      className="text-[9px] px-2 py-0.5"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#A8A0A0',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                <span className="font-mono text-[10px]" style={{ color: '#7A7268' }}>
                  <Clock className="w-3 h-3 inline mr-1" />{mod.duration}
                </span>
                <span className="text-[10px] flex items-center gap-0.5 transition group-hover:text-[#C9A84C]" style={{ color: '#7A7268' }}>
                  Ver Detalles <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section
        className="px-5 md:px-10 py-16"
        style={{
          background: 'linear-gradient(135deg, #0F1628 0%, #0D1E35 100%)',
          borderTop: '1px solid rgba(201,168,76,0.15)',
          borderBottom: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase mb-3" style={{ color: '#C9A84C' }}>
              ¿Por qué FinNova Academy?
            </div>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#E8E0D0' }}>
              Metodología que Funciona
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  background: 'rgba(42,122,75,0.06)',
                  border: '1px solid rgba(42,122,75,0.15)',
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#2A7A4B' }} />
                <span className="text-[12px]" style={{ color: '#D8D0C0' }}>{b}</span>
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
                <Star key={i} className="w-5 h-5" style={{ color: '#C9A84C', fill: '#C9A84C' }} />
              ))}
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#E8E0D0' }}>
            Comienza Tu Formación Hoy
          </h2>
          <p className="text-[14px] leading-relaxed mb-8 max-w-md mx-auto" style={{ color: '#7A7268' }}>
            Regístrate ahora y accede a nuestro programa completo de formación financiera con herramientas interactivas y certificación validada por IA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-10 py-4 font-bold text-[14px] tracking-wider uppercase transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
              style={{
                background: '#C9A84C',
                color: '#0A0E1A',
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Crear Mi Cuenta <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="px-8 py-4 text-[13px] tracking-wider uppercase transition-all duration-200 hover:bg-[rgba(201,168,76,0.06)] inline-flex items-center justify-center"
              style={{
                border: '1px solid rgba(201,168,76,0.4)',
                color: '#C9A84C',
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
        className="px-5 md:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px]"
        style={{
          borderTop: '1px solid rgba(201,168,76,0.15)',
          color: '#7A7268',
        }}
      >
        <span>© 2026 FinNova Academy · Formación Financiera Práctica</span>
        <span>Certificación validada por IA · Powered by Gemini</span>
      </footer>
    </div>
  );
}
