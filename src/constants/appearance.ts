// Sistema de apariencia — 12 paletas predefinidas + personalizacion

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    hover: string;
    light: string;
    accent: string;
    accentLight: string;
    background: string;
  };
}

export type Density = 'compact' | 'normal' | 'comfortable';
export type ThemeMode = 'light' | 'dark';

export interface AppearanceSettings {
  paletteId: string;
  colors: ColorPalette['colors'];
  radius: number;
  density: Density;
  mode: ThemeMode;
}

export const PREDEFINED_PALETTES: ColorPalette[] = [
  { id: 'kaivincia-corporate', name: 'Kaivincia Corporate', description: 'Profesional y confiable', colors: { primary: '#1E3A8A', hover: '#1E40AF', light: '#DBEAFE', accent: '#F59E0B', accentLight: '#FEF3C7', background: '#F8FAFC' } },
  { id: 'fresco', name: 'Fresco', description: 'Limpio y moderno', colors: { primary: '#059669', hover: '#047857', light: '#D1FAE5', accent: '#10B981', accentLight: '#A7F3D0', background: '#F0FDF4' } },
  { id: 'ambar', name: 'Ambar', description: 'Calido y acogedor', colors: { primary: '#D97706', hover: '#B45309', light: '#FEF3C7', accent: '#EA580C', accentLight: '#FED7AA', background: '#FFFBEB' } },
  { id: 'energetico', name: 'Energetico', description: 'Vibrante y dinamico', colors: { primary: '#DC2626', hover: '#B91C1C', light: '#FEE2E2', accent: '#F97316', accentLight: '#FFEDD5', background: '#FEF2F2' } },
  { id: 'indigo-saas', name: 'Indigo SaaS', description: 'Moderno y tech', colors: { primary: '#4F46E5', hover: '#4338CA', light: '#E0E7FF', accent: '#06B6D4', accentLight: '#CFFAFE', background: '#F5F3FF' } },
  { id: 'slate-minimal', name: 'Slate Minimal', description: 'Minimalista y limpio', colors: { primary: '#334155', hover: '#1E293B', light: '#E2E8F0', accent: '#0EA5E9', accentLight: '#E0F2FE', background: '#F8FAFC' } },
  { id: 'teal-moderno', name: 'Teal Moderno', description: 'Fresco y tech', colors: { primary: '#0D9488', hover: '#0F766E', light: '#CCFBF1', accent: '#14B8A6', accentLight: '#99F6E4', background: '#F0FDFA' } },
  { id: 'violeta-premium', name: 'Violeta Premium', description: 'Elegante y sofisticado', colors: { primary: '#7C3AED', hover: '#6D28D9', light: '#EDE9FE', accent: '#A855F7', accentLight: '#F3E8FF', background: '#FAF5FF' } },
  { id: 'naranja-vibrante', name: 'Naranja Vibrante', description: 'Energetico y llamativo', colors: { primary: '#EA580C', hover: '#C2410C', light: '#FFEDD5', accent: '#F59E0B', accentLight: '#FEF3C7', background: '#FFF7ED' } },
  { id: 'rosa-suave', name: 'Rosa Suave', description: 'Creativo y amable', colors: { primary: '#DB2777', hover: '#BE185D', light: '#FCE7F3', accent: '#F472B6', accentLight: '#FBCFE8', background: '#FDF2F8' } },
  { id: 'cyan-fresco', name: 'Cyan Fresco', description: 'Innovador y claro', colors: { primary: '#0891B2', hover: '#0E7490', light: '#CFFAFE', accent: '#06B6D4', accentLight: '#A5F3FC', background: '#ECFEFF' } },
  { id: 'rojo-ejecutivo', name: 'Rojo Ejecutivo', description: 'Formal y corporativo', colors: { primary: '#991B1B', hover: '#7F1D1D', light: '#FEE2E2', accent: '#DC2626', accentLight: '#FECACA', background: '#FEF2F2' } },
];

export const DEFAULT_PALETTE_ID = 'kaivincia-corporate';

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  paletteId: DEFAULT_PALETTE_ID,
  colors: PREDEFINED_PALETTES[0].colors,
  radius: 8,
  density: 'normal',
  mode: 'light',
};

export function applyAppearanceToDOM(settings: AppearanceSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', settings.colors.primary);
  root.style.setProperty('--color-primary-hover', settings.colors.hover);
  root.style.setProperty('--color-primary-light', settings.colors.light);
  root.style.setProperty('--color-accent', settings.colors.accent);
  root.style.setProperty('--color-accent-light', settings.colors.accentLight);
  root.style.setProperty('--color-bg', settings.mode === 'dark' ? '#0F172A' : settings.colors.background);
  root.style.setProperty('--radius-base', settings.radius + 'px');
  const sp = settings.density === 'compact' ? '0.5rem' : settings.density === 'comfortable' ? '1.5rem' : '1rem';
  root.style.setProperty('--density-spacing', sp);
  root.setAttribute('data-theme-mode', settings.mode);
  root.setAttribute('data-density', settings.density);
}
