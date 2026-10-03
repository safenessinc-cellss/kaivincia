import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface AppearanceFonts {
  family: string;
  baseSize: number; // 12px a 20px
  headingScale: 'compact' | 'normal' | 'large';
  weight: 'normal' | 'medium' | 'semibold' | 'bold';
}

export interface AppearanceColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarActive: string;
  headerBg: string;
}

export interface AppearanceLayout {
  sidebarSize: 'compact' | 'normal' | 'expanded'; // 64px, 256px, 320px
  sidebarPosition: 'left' | 'right';
  sidebarCollapsible: 'auto' | 'always_expanded' | 'always_collapsed';
  borderRadius: number; // 0px a 24px
  cardShadow: 'none' | 'subtle' | 'medium' | 'strong';
  density: 'compact' | 'normal' | 'spacious';
}

export interface AppearanceAccessibility {
  highContrast: boolean;
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  reduceMotion: boolean;
}

export interface CustomPreset {
  id: string;
  name: string;
  colors: AppearanceColors;
  createdAt: string;
}

export interface AdvancedColorSettings {
  surfaceOpacity: number; // 50 a 100 (%)
  borderIntensity: number; // 0 a 100 (%)
  textContrast: number; // 0 a 100 (%)
  colorMode: 'auto' | 'light' | 'dark';
}

export interface AppearanceConfig {
  fonts: AppearanceFonts;
  colors: AppearanceColors;
  layout: AppearanceLayout;
  accessibility: AppearanceAccessibility;
  advanced?: AdvancedColorSettings;
  preset: string;
  customPresets?: CustomPreset[];
  updatedAt?: any;
  updatedBy?: string;
}

export type PresetCategory = 'dark' | 'light' | 'vibrant' | 'neutral';

export interface PresetTheme {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  colors: AppearanceColors;
}

export const AVAILABLE_FONTS = [
  { id: 'Inter', name: 'Inter (Modern & Clean)', googleFamily: 'Inter:wght@300;400;500;600;700' },
  { id: 'Rajdhani', name: 'Rajdhani (Cyber / Tech)', googleFamily: 'Rajdhani:wght@300;400;500;600;700' },
  { id: 'Roboto', name: 'Roboto (Google Standard)', googleFamily: 'Roboto:wght@300;400;500;700' },
  { id: 'Open Sans', name: 'Open Sans (Neutral & Legible)', googleFamily: 'Open+Sans:wght@300;400;600;700' },
  { id: 'Lato', name: 'Lato (Corporate & Warm)', googleFamily: 'Lato:wght@300;400;700' },
  { id: 'Poppins', name: 'Poppins (Geometric & Friendly)', googleFamily: 'Poppins:wght@300;400;500;600;700' },
  { id: 'Montserrat', name: 'Montserrat (Urban & Strong)', googleFamily: 'Montserrat:wght@300;400;500;600;700' },
  { id: 'Source Sans Pro', name: 'Source Sans Pro (Adobe UI)', googleFamily: 'Source+Sans+3:wght@300;400;600;700' },
  { id: 'Nunito', name: 'Nunito (Rounded & Soft)', googleFamily: 'Nunito:wght@300;400;600;700' },
  { id: 'Raleway', name: 'Raleway (Elegant & Thin)', googleFamily: 'Raleway:wght@300;400;500;600;700' },
  { id: 'Work Sans', name: 'Work Sans (Crisp & Professional)', googleFamily: 'Work+Sans:wght@300;400;500;600;700' }
];

export const QUICK_SWATCHES = {
  light: ['#ffffff', '#f8f9fa', '#f5f5f5', '#f0f0f0', '#e9ecef', '#dee2e6'],
  dark: ['#0a0a0a', '#121212', '#1a1a1a', '#212121', '#2a2a2a', '#333333'],
  vibrant: ['#00F0FF', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#9B59B6']
};

export const APPEARANCE_PRESETS: Record<string, PresetTheme> = {
  // --- OSCUROS (Dark) ---
  'kaivincia-cyan': {
    id: 'kaivincia-cyan',
    name: 'Kaivincia Cyan',
    category: 'dark',
    description: 'Estilo cyber-corporativo insignia con acentos cian brillante',
    colors: {
      primary: '#00F0FF',
      secondary: '#1e293b',
      background: '#05070a',
      surface: '#0b1118',
      textPrimary: '#ffffff',
      textSecondary: '#94a3b8',
      sidebarBg: '#070b10',
      sidebarText: '#cbd5e1',
      sidebarActive: '#00F0FF',
      headerBg: '#070b10'
    }
  },
  'dark-elegant': {
    id: 'dark-elegant',
    name: 'Dark Elegant',
    category: 'dark',
    description: 'Minimalismo oscuro con acentos dorados champagne y superficies obsidiana',
    colors: {
      primary: '#E2B857',
      secondary: '#27272a',
      background: '#09090b',
      surface: '#18181b',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      sidebarBg: '#121215',
      sidebarText: '#e4e4e7',
      sidebarActive: '#E2B857',
      headerBg: '#121215'
    }
  },

  // --- CLAROS (Light - 10 Presets Luminosos) ---
  'pure-white': {
    id: 'pure-white',
    name: 'Pure White',
    category: 'light',
    description: 'Fondo blanco puro inmaculado con superficies grises ultra claras y azul real',
    colors: {
      primary: '#0284c7',
      secondary: '#e2e8f0',
      background: '#ffffff',
      surface: '#f8fafc',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      sidebarBg: '#f1f5f9',
      sidebarText: '#334155',
      sidebarActive: '#0284c7',
      headerBg: '#ffffff'
    }
  },
  'soft-cream': {
    id: 'soft-cream',
    name: 'Soft Cream',
    category: 'light',
    description: 'Fondo crema cálido con superficies beige, lectura descansada y acentos ámbar',
    colors: {
      primary: '#b45309',
      secondary: '#e7e0d3',
      background: '#faf7f0',
      surface: '#ffffff',
      textPrimary: '#292524',
      textSecondary: '#57534e',
      sidebarBg: '#f4eee1',
      sidebarText: '#44403c',
      sidebarActive: '#b45309',
      headerBg: '#fbf8f3'
    }
  },
  'sky-blue': {
    id: 'sky-blue',
    name: 'Sky Blue',
    category: 'light',
    description: 'Fondo azul cielo etéreo con tarjetas blancas puras y acentos celestes',
    colors: {
      primary: '#0284c7',
      secondary: '#cfe4ed',
      background: '#e8f4f8',
      surface: '#ffffff',
      textPrimary: '#0c4a6e',
      textSecondary: '#334155',
      sidebarBg: '#dff0f6',
      sidebarText: '#164e63',
      sidebarActive: '#0284c7',
      headerBg: '#ffffff'
    }
  },
  'mint-fresh': {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    category: 'light',
    description: 'Fondo menta suave con superficies blancas y acentos esmeralda refrescantes',
    colors: {
      primary: '#059669',
      secondary: '#c8e6c9',
      background: '#e8f5e9',
      surface: '#ffffff',
      textPrimary: '#064e3b',
      textSecondary: '#374151',
      sidebarBg: '#dcedc8',
      sidebarText: '#1b5e20',
      sidebarActive: '#059669',
      headerBg: '#ffffff'
    }
  },
  'lavender-mist': {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    category: 'light',
    description: 'Fondo lavanda pastel relajante con tarjetas blancas y acentos violeta',
    colors: {
      primary: '#7c3aed',
      secondary: '#e1bee7',
      background: '#f3e5f5',
      surface: '#ffffff',
      textPrimary: '#3b0764',
      textSecondary: '#4b5563',
      sidebarBg: '#ede7f6',
      sidebarText: '#4a148c',
      sidebarActive: '#7c3aed',
      headerBg: '#ffffff'
    }
  },
  'peach-blossom': {
    id: 'peach-blossom',
    name: 'Peach Blossom',
    category: 'light',
    description: 'Fondo melocotón cálido y acogedor con acentos naranja fuego comercial',
    colors: {
      primary: '#ea580c',
      secondary: '#fed7aa',
      background: '#fef3e2',
      surface: '#ffffff',
      textPrimary: '#431407',
      textSecondary: '#57534e',
      sidebarBg: '#ffedd5',
      sidebarText: '#7c2d12',
      sidebarActive: '#ea580c',
      headerBg: '#ffffff'
    }
  },
  'rose-quartz': {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    category: 'light',
    description: 'Fondo rosa cuarzo tenue con superficies limpias y acentos magenta intenso',
    colors: {
      primary: '#db2777',
      secondary: '#f8bbd0',
      background: '#fce4ec',
      surface: '#ffffff',
      textPrimary: '#500724',
      textSecondary: '#4b5563',
      sidebarBg: '#f8bbd0',
      sidebarText: '#880e4f',
      sidebarActive: '#db2777',
      headerBg: '#ffffff'
    }
  },
  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    category: 'light',
    description: 'Fondo azul océano diurno con superficies blancas y azul cobalto náutico',
    colors: {
      primary: '#1d4ed8',
      secondary: '#bbdefb',
      background: '#e3f2fd',
      surface: '#ffffff',
      textPrimary: '#0c2340',
      textSecondary: '#334155',
      sidebarBg: '#d0e8fc',
      sidebarText: '#0d47a1',
      sidebarActive: '#1d4ed8',
      headerBg: '#ffffff'
    }
  },
  'light-corporate': {
    id: 'light-corporate',
    name: 'Light Corporate',
    category: 'light',
    description: 'Tema claro de alta claridad, azul ejecutivo y superficies blancas puras',
    colors: {
      primary: '#2563eb',
      secondary: '#e2e8f0',
      background: '#f8fafc',
      surface: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      sidebarBg: '#ffffff',
      sidebarText: '#334155',
      sidebarActive: '#2563eb',
      headerBg: '#ffffff'
    }
  },

  // --- NEUTROS (Neutral) ---
  'sand-dune': {
    id: 'sand-dune',
    name: 'Sand Dune',
    category: 'neutral',
    description: 'Fondo arena orgánico equilibrado con superficies blancas y acentos terracota',
    colors: {
      primary: '#854d0e',
      secondary: '#e6dcce',
      background: '#f5f0e6',
      surface: '#ffffff',
      textPrimary: '#292524',
      textSecondary: '#57534e',
      sidebarBg: '#ebe4d8',
      sidebarText: '#44403c',
      sidebarActive: '#854d0e',
      headerBg: '#ffffff'
    }
  },
  'cloud-gray': {
    id: 'cloud-gray',
    name: 'Cloud Gray',
    category: 'neutral',
    description: 'Fondo gris nube neutro con superficies blancas y acentos grafito profesional',
    colors: {
      primary: '#475569',
      secondary: '#e2e8f0',
      background: '#f5f5f5',
      surface: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      sidebarBg: '#eaeaea',
      sidebarText: '#1e293b',
      sidebarActive: '#2563eb',
      headerBg: '#ffffff'
    }
  },

  // --- VIBRANTES (Vibrant) ---
  'neon-purple': {
    id: 'neon-purple',
    name: 'Neon Purple',
    category: 'vibrant',
    description: 'Vibrante violeta eléctrico con fondo nocturno de alto contraste',
    colors: {
      primary: '#A855F7',
      secondary: '#2e1065',
      background: '#0c061a',
      surface: '#170b2e',
      textPrimary: '#f5f3ff',
      textSecondary: '#c4b5fd',
      sidebarBg: '#130827',
      sidebarText: '#ddd6fe',
      sidebarActive: '#C084FC',
      headerBg: '#130827'
    }
  },
  'emerald-green': {
    id: 'emerald-green',
    name: 'Emerald Green',
    category: 'vibrant',
    description: 'Verde esmeralda bio-financiero para enfoque y serenidad operativa',
    colors: {
      primary: '#10B981',
      secondary: '#064e3b',
      background: '#04140d',
      surface: '#062417',
      textPrimary: '#ecfdf5',
      textSecondary: '#a7f3d0',
      sidebarBg: '#051b12',
      sidebarText: '#d1fae5',
      sidebarActive: '#34D399',
      headerBg: '#051b12'
    }
  },
  'sunset-orange': {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    category: 'vibrant',
    description: 'Naranja atardecer cálido y dinámico de alta energía comercial',
    colors: {
      primary: '#F97316',
      secondary: '#431407',
      background: '#120905',
      surface: '#20110a',
      textPrimary: '#fff7ed',
      textSecondary: '#fed7aa',
      sidebarBg: '#180d07',
      sidebarText: '#ffedd5',
      sidebarActive: '#FB923C',
      headerBg: '#180d07'
    }
  }
};

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  fonts: {
    family: 'Inter',
    baseSize: 14,
    headingScale: 'normal',
    weight: 'normal'
  },
  colors: APPEARANCE_PRESETS['kaivincia-cyan'].colors,
  layout: {
    sidebarSize: 'normal',
    sidebarPosition: 'left',
    sidebarCollapsible: 'auto',
    borderRadius: 12,
    cardShadow: 'medium',
    density: 'normal'
  },
  accessibility: {
    highContrast: false,
    colorBlindMode: 'none',
    reduceMotion: false
  },
  advanced: {
    surfaceOpacity: 100,
    borderIntensity: 100,
    textContrast: 100,
    colorMode: 'dark'
  },
  preset: 'kaivincia-cyan',
  customPresets: []
};

const LOCAL_STORAGE_KEY = 'kaivincia_appearance_settings';

/**
 * Validador de contraste WCAG AA entre dos colores hexadecimales
 */
export function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0;
  const rgb = [
    parseInt(cleanHex.slice(0, 2), 16) / 255,
    parseInt(cleanHex.slice(2, 4), 16) / 255,
    parseInt(cleanHex.slice(4, 6), 16) / 255
  ].map(val => val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function getContrastRatio(colorA: string, colorB: string): number {
  const lumA = getLuminance(colorA);
  const lumB = getLuminance(colorB);
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return parseFloat(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

/**
 * Generador aleatorio de paletas cromáticas armónicas y coherentes
 */
export function generateHarmoniousPalette(forceLight: boolean = false): AppearanceColors {
  const isLight = forceLight || Math.random() > 0.5;

  const vibrantAccents = [
    '#00F0FF', '#0284c7', '#2563eb', '#7c3aed', '#db2777', 
    '#ea580c', '#10B981', '#059669', '#d97706', '#E2B857'
  ];
  const chosenAccent = vibrantAccents[Math.floor(Math.random() * vibrantAccents.length)];

  if (isLight) {
    const lightBgs = ['#ffffff', '#f8fafc', '#faf7f0', '#f1f5f9', '#e8f4f8', '#fef3e2'];
    const bg = lightBgs[Math.floor(Math.random() * lightBgs.length)];
    return {
      primary: chosenAccent,
      secondary: '#e2e8f0',
      background: bg,
      surface: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      sidebarBg: '#f8fafc',
      sidebarText: '#334155',
      sidebarActive: chosenAccent,
      headerBg: '#ffffff'
    };
  } else {
    const darkBgs = ['#05070a', '#09090b', '#0c061a', '#04140d', '#120905'];
    const darkSurfaces = ['#0b1118', '#18181b', '#170b2e', '#062417', '#20110a'];
    const index = Math.floor(Math.random() * darkBgs.length);
    return {
      primary: chosenAccent,
      secondary: '#1e293b',
      background: darkBgs[index],
      surface: darkSurfaces[index],
      textPrimary: '#ffffff',
      textSecondary: '#94a3b8',
      sidebarBg: '#070b10',
      sidebarText: '#cbd5e1',
      sidebarActive: chosenAccent,
      headerBg: '#070b10'
    };
  }
}

/**
 * Servicio para persistencia de la configuración visual
 */
export async function getAppearance(): Promise<AppearanceConfig> {
  try {
    const docRef = doc(db, 'settings', 'appearance');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AppearanceConfig;
      const merged: AppearanceConfig = {
        ...DEFAULT_APPEARANCE,
        ...data,
        fonts: { ...DEFAULT_APPEARANCE.fonts, ...(data.fonts || {}) },
        colors: { ...DEFAULT_APPEARANCE.colors, ...(data.colors || {}) },
        layout: { ...DEFAULT_APPEARANCE.layout, ...(data.layout || {}) },
        accessibility: { ...DEFAULT_APPEARANCE.accessibility, ...(data.accessibility || {}) },
        advanced: { ...DEFAULT_APPEARANCE.advanced, ...(data.advanced || {}) },
        customPresets: data.customPresets || []
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (error) {
    console.warn('Could not fetch appearance from Firestore, using cache/fallback:', error);
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) return JSON.parse(local);
  } catch {}

  return DEFAULT_APPEARANCE;
}

export async function saveAppearance(
  config: Partial<AppearanceConfig>, 
  userUid?: string
): Promise<AppearanceConfig> {
  const current = await getAppearance();
  const merged: AppearanceConfig = {
    ...current,
    ...config,
    fonts: { ...current.fonts, ...(config.fonts || {}) },
    colors: { ...current.colors, ...(config.colors || {}) },
    layout: { ...current.layout, ...(config.layout || {}) },
    accessibility: { ...current.accessibility, ...(config.accessibility || {}) },
    advanced: { ...(current.advanced || DEFAULT_APPEARANCE.advanced), ...(config.advanced || {}) },
    customPresets: config.customPresets !== undefined ? config.customPresets : (current.customPresets || []),
    updatedAt: serverTimestamp(),
    updatedBy: userUid || 'system'
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
  } catch {}

  try {
    const docRef = doc(db, 'settings', 'appearance');
    await setDoc(docRef, merged, { merge: true });
  } catch (error) {
    console.error('Error saving appearance to Firestore:', error);
    throw error;
  }

  return merged;
}

export async function resetAppearance(userUid?: string): Promise<AppearanceConfig> {
  return saveAppearance(DEFAULT_APPEARANCE, userUid);
}
