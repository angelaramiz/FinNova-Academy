import { describe, it, expect } from 'vitest';
import { generateCvLatex } from '../backend/src/services/cvProfile';
import { generateCvPdf } from '../backend/src/services/cvPdf';
import { buildSkillProfile, buildDemoSkillProfile } from '../backend/src/services/skillProfile';

function sampleProfile() {
  return {
    specialty: 'data_engineering',
    branch: 'analyst' as const,
    practicePct: 45,
    overall: 72,
    skills: [
      { label: 'SQL', score: 85, level: 'Avanzado' },
      { label: 'Calidad de datos', score: 70, level: 'Intermedio' },
    ],
    strengths: ['SQL'],
    gaps: ['Orquestación'],
    extra: {
      fullName: 'Ana García',
      title: 'Analista de Datos',
      email: 'ana@ejemplo.mx',
      city: 'CDMX',
      summary: 'Perfil verificado en simulador laboral.',
      education: [{ degree: 'Ing. en Sistemas', school: 'UT', year: '2025' }],
      languages: [{ name: 'Español', level: 'Nativo' }],
      projects: [{ name: 'Capstone', desc: 'Pipeline de ventas' }],
    },
  };
}

describe('cvProfile — CV institucional de egreso', () => {
  it('genera el .tex con moderncv y los datos del alumno escapados', () => {
    const tex = generateCvLatex(sampleProfile() as any);
    expect(tex).toContain('\\documentclass[11pt,a4paper,sans]{moderncv}');
    expect(tex).toContain('Ana García');
    expect(tex).toContain('\\section{Perfil}');
    expect(tex).toContain('\\section{Habilidades verificadas}');
    expect(tex).not.toContain('practicePct');
    expect(tex).toContain('45%');
    expect(tex).toContain('\\section{Proyectos}');
  });

  it('genera un PDF semántico válido con metadata ATS', async () => {
    const pdf = await generateCvPdf(sampleProfile() as any);
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.slice(0, 5).toString('latin1')).toBe('%PDF-');
    // Metadata del documento (usada por parsers ATS) presente en el catálogo
    const str = pdf.toString('latin1');
    expect(str).toContain('/Title');
    expect(str).toContain('/Subject');
    expect(str).toContain('/Author');
    expect(str).toContain('/Keywords');
    expect(str).toContain('/Creator');
  });

  it('escapa caracteres especiales de LaTeX', () => {
    const profile = sampleProfile() as any;
    profile.extra.summary = '40% de práctica & más #1';
    const tex = generateCvLatex(profile);
    expect(tex).toContain('40\\%');
    expect(tex).toContain('\\&');
  });

  it('maneja datos vacíos sin romper', () => {
    const empty = { specialty: 'accounting', branch: 'accounting', practicePct: 0, overall: 0, skills: [], strengths: [], gaps: [], extra: {} };
    const tex = generateCvLatex(empty as any);
    expect(tex).toContain('\\begin{document}');
    expect(tex).toContain('\\end{document}');
  });
});

describe('skillProfile — perfil demo "como si completado"', () => {
  it('genera un perfil completo por cada rol (analyst/engineering/science/accounting)', () => {
    for (const role of ['analyst', 'engineering', 'science', 'accounting'] as const) {
      const p = buildDemoSkillProfile(role);
      expect(p.skills.length).toBeGreaterThan(3);
      expect(p.overall).toBeGreaterThan(0);
      expect(p.branch).toBe(role);
      expect(p.specialty).toBe(role === 'accounting' ? 'accounting' : 'data_engineering');
      for (const s of p.skills) {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
        expect(['Básico', 'Intermedio', 'Avanzado']).toContain(s.level);
      }
    }
  });

  it('los perfiles demo no alteran el progreso real (son datos sintéticos por rol)', () => {
    const eng = buildDemoSkillProfile('engineering');
    const sci = buildDemoSkillProfile('science');
    expect(eng.skills.some(s => s.label === 'Python / ETL')).toBe(true);
    expect(sci.skills.some(s => s.label === 'Modelos ML')).toBe(true);
    // cada rol tiene skills distintivas, no el set de otro
    expect(eng.skills.some(s => s.label === 'Modelos ML')).toBe(false);
  });

  it('el .tex de un perfil demo engineering incluye sus habilidades', () => {
    const skills = buildDemoSkillProfile('engineering');
    const tex = generateCvLatex({
      specialty: 'data_engineering', branch: 'engineering', practicePct: 88, overall: skills.overall,
      skills: skills.skills, strengths: skills.strengths, gaps: skills.gaps, extra: {},
    } as any);
    expect(tex).toContain('Python / ETL');
    expect(tex).toContain('88%');
  });
});
