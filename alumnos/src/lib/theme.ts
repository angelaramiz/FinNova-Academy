export const themeColors = {
  light: {
    bg: '#F8F6F1',
    cardBg: '#FFFFFF',
    cardSecondary: '#F0EDE6',
    text: '#1B2632',
    textMuted: '#64748B',
    primary: '#FFB162',
    secondary: '#A35139',
    border: '#D4CFC4',
    // Semantic tokens
    success: '#22C55E',
    successBg: '#DCFCE7',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    info: '#3B82F6',
    infoBg: '#DBEAFE',
  },
  dark: {
    bg: '#0F172A',
    cardBg: '#1E293B',
    cardSecondary: '#1A2332',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    primary: '#FFB162',
    secondary: '#A35139',
    border: '#334155',
    // Semantic tokens
    success: '#22C55E',
    successBg: '#14532D20',
    error: '#EF4444',
    errorBg: '#7F1D1D20',
    warning: '#F59E0B',
    warningBg: '#78350F20',
    info: '#3B82F6',
    infoBg: '#1E3A5F20',
  }
};

export type Theme = 'light' | 'dark';

// Utility: get semantic color from theme
export function getSemanticColor(theme: Theme, semantic: 'success' | 'error' | 'warning' | 'info') {
  return themeColors[theme][semantic];
}

export function getSemanticBg(theme: Theme, semantic: 'success' | 'error' | 'warning' | 'info') {
  return themeColors[theme][`${semantic}Bg` as keyof typeof themeColors[Theme]];
}
