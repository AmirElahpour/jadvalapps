/**
 * Design system v2 — modern, fresh, high-quality palette + gradients + glass.
 * Dark: deep navy/indigo with sky accents. Light: warm ivory with teal accents.
 */

export const palette = {
  dark: {
    bg: '#0A0E1A',
    bg2: '#0F1526',
    surface: '#141C33',
    surfaceAlt: '#182240',
    surfaceGlass: 'rgba(20, 28, 51, 0.72)',
    border: '#233052',
    borderSoft: '#1B2742',
    text: '#F0F4FF',
    textDim: '#A9B7D6',
    textFaint: '#6B7A9E',
    primary: '#22D3EE',      // cyan
    primaryDeep: '#0891B2', // deep cyan
    primaryText: '#04202B',
    accent: '#818CF8',       // indigo accent
    accent2: '#F472B6',      // pink accent
    danger: '#FB7185',
    dangerDeep: '#E11D48',
    success: '#34D399',
    warning: '#FBBF24',
    chipBg: '#1C2A4D',
    overlay: 'rgba(3, 7, 18, 0.72)',
    splashBg: '#070B16',
    headerGrad: ['#0E1730', '#0A0E1A'] as const,
    cardGrad: ['#182240', '#141C33'] as const,
    fabGrad: ['#22D3EE', '#3B82F6'] as const,
    tabActiveGrad: ['#22D3EE', '#3B82F6'] as const,
    onColor: '#FFFFFF',
  },
  light: {
    bg: '#F6F5F2',
    bg2: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F3F9',
    surfaceGlass: 'rgba(255, 255, 255, 0.82)',
    border: '#E2E8F0',
    borderSoft: '#ECF0F7',
    text: '#0F172A',
    textDim: '#5B6B8C',
    textFaint: '#94A3BD',
    primary: '#0891B2',      // teal 600
    primaryDeep: '#0E7490',
    primaryText: '#FFFFFF',
    accent: '#6366F1',
    accent2: '#EC4899',
    danger: '#E11D48',
    dangerDeep: '#BE123C',
    success: '#059669',
    warning: '#D97706',
    chipBg: '#EDF1F8',
    overlay: 'rgba(15, 23, 42, 0.40)',
    splashBg: '#070B16',
    headerGrad: ['#FFFFFF', '#F6F5F2'] as const,
    cardGrad: ['#FFFFFF', '#FBFCFE'] as const,
    fabGrad: ['#0891B2', '#2563EB'] as const,
    tabActiveGrad: ['#0891B2', '#2563EB'] as const,
    onColor: '#FFFFFF',
    surfaceGlassStr: 'rgba(255, 255, 255, 0.82)',
  },
};

export type ThemeMode = 'dark' | 'light';
export type Palette = typeof palette.dark;

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
};

export const font = {
  regular: 'Vazirmatn',
  medium: 'VazirmatnMedium',
  bold: 'VazirmatnBold',
  black: 'VazirmatnBlack',
};

export const shadow = (mode: ThemeMode) =>
  mode === 'dark'
    ? { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 }
    : { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 };
