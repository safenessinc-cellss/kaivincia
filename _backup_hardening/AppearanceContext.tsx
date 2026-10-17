import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  AppearanceConfig, 
  DEFAULT_APPEARANCE, 
  AVAILABLE_FONTS, 
  APPEARANCE_PRESETS,
  AppearanceColors,
  CustomPreset,
  saveAppearance as saveAppearanceService,
  resetAppearance as resetAppearanceService 
} from '../services/appearanceService';

interface AppearanceContextType {
  appearance: AppearanceConfig;
  previewAppearance: AppearanceConfig | null;
  setPreviewAppearance: (config: AppearanceConfig | null) => void;
  updateAppearance: (config: Partial<AppearanceConfig>) => Promise<void>;
  resetAppearance: () => Promise<void>;
  applyPreset: (presetKey: string) => Promise<void>;
  saveCustomPreset: (name: string, colors: AppearanceColors) => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;
  loading: boolean;
  canEditAppearance: boolean;
  presets: typeof APPEARANCE_PRESETS;
  systemPrefersDark: boolean;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kaivincia_appearance_settings';

// Cargar fuente de Google Fonts dinámicamente si no está en el documento
function ensureGoogleFontLoaded(family: string) {
  const fontMeta = AVAILABLE_FONTS.find(f => f.id === family);
  if (!fontMeta) return;

  const linkId = `google-font-${fontMeta.id.toLowerCase().replace(/\s+/g, '-')}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontMeta.googleFamily}&display=swap`;
    document.head.appendChild(link);
  }
}

// Aplicar variables CSS y clases de accesibilidad en el elemento raíz (:root)
function applyCssVariablesToRoot(config: AppearanceConfig) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Tipografía
  ensureGoogleFontLoaded(config.fonts.family);
  root.style.setProperty('--font-family', `'${config.fonts.family}', sans-serif`);
  root.style.setProperty('--font-size-base', `${config.fonts.baseSize}px`);

  // Escala de encabezados
  const headingScales: Record<string, string> = {
    compact: '0.875',
    normal: '1',
    large: '1.2'
  };
  root.style.setProperty('--heading-scale', headingScales[config.fonts.headingScale] || '1');

  // Peso tipográfico
  const fontWeights: Record<string, string> = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  };
  root.style.setProperty('--font-weight-base', fontWeights[config.fonts.weight] || '400');

  // 2. Colores principales
  root.style.setProperty('--color-primary', config.colors.primary);
  root.style.setProperty('--color-secondary', config.colors.secondary);
  root.style.setProperty('--color-background', config.colors.background);
  root.style.setProperty('--color-surface', config.colors.surface);
  root.style.setProperty('--color-text-primary', config.colors.textPrimary);
  root.style.setProperty('--color-text-secondary', config.colors.textSecondary);
  root.style.setProperty('--color-sidebar-bg', config.colors.sidebarBg);
  root.style.setProperty('--color-sidebar-text', config.colors.sidebarText);
  root.style.setProperty('--color-sidebar-active', config.colors.sidebarActive);
  root.style.setProperty('--color-header-bg', config.colors.headerBg);

  // 3. Ajustes avanzados de color y superficie
  const opacity = (config.advanced?.surfaceOpacity ?? 100) / 100;
  const borderIntensity = (config.advanced?.borderIntensity ?? 100) / 100;
  root.style.setProperty('--surface-opacity', String(opacity));
  root.style.setProperty('--border-intensity', String(borderIntensity));

  // 4. Menú y Layout
  const sidebarWidths: Record<string, string> = {
    compact: '64px',
    normal: '256px',
    expanded: '320px'
  };
  root.style.setProperty('--sidebar-width', sidebarWidths[config.layout.sidebarSize] || '256px');
  root.style.setProperty('--border-radius', `${config.layout.borderRadius}px`);

  // Sombras de tarjetas
  const shadowValues: Record<string, string> = {
    none: 'none',
    subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    strong: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
  };
  root.style.setProperty('--card-shadow', shadowValues[config.layout.cardShadow] || shadowValues.medium);

  // Densidad de padding
  const densityPaddings: Record<string, string> = {
    compact: '0.5rem',
    normal: '1rem',
    spacious: '1.5rem'
  };
  root.style.setProperty('--density-padding', densityPaddings[config.layout.density] || '1rem');

  // 5. Accesibilidad (Clases globales)
  if (config.accessibility.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  if (config.accessibility.reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  // Modos de daltonismo
  root.classList.remove('colorblind-deuteranopia', 'colorblind-protanopia', 'colorblind-tritanopia');
  if (config.accessibility.colorBlindMode !== 'none') {
    root.classList.add(`colorblind-${config.accessibility.colorBlindMode}`);
  }
}

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Detección en tiempo real de preferencia de SO (dark vs light)
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const [appearance, setAppearance] = useState<AppearanceConfig>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...DEFAULT_APPEARANCE,
          ...parsed,
          fonts: { ...DEFAULT_APPEARANCE.fonts, ...(parsed.fonts || {}) },
          colors: { ...DEFAULT_APPEARANCE.colors, ...(parsed.colors || {}) },
          layout: { ...DEFAULT_APPEARANCE.layout, ...(parsed.layout || {}) },
          accessibility: { ...DEFAULT_APPEARANCE.accessibility, ...(parsed.accessibility || {}) },
          advanced: { ...DEFAULT_APPEARANCE.advanced, ...(parsed.advanced || {}) },
          customPresets: parsed.customPresets || []
        };
      }
    } catch {}
    return DEFAULT_APPEARANCE;
  });

  const [previewAppearance, setPreviewAppearance] = useState<AppearanceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Permisos: SuperAdmin o Admin
  const canEditAppearance = useMemo(() => {
    if (!user) return false;
    const role = (user as any)?.role;
    const email = user.email || '';
    return role === 'superadmin' || role === 'admin' || email === 'safeness.c.a@gmail.com' || email === 'deuwyrobert@gmail.com';
  }, [user]);

  // Si colorMode es 'auto', reaccionar a cambios del sistema
  useEffect(() => {
    if (appearance.advanced?.colorMode === 'auto') {
      const currentIsDark = appearance.colors.background.toLowerCase() === '#05070a' || appearance.colors.background.toLowerCase() === '#09090b';
      if (!systemPrefersDark && currentIsDark) {
        // El SO está en modo claro y el tema actual es oscuro: cambiar a preset claro
        const lightPreset = APPEARANCE_PRESETS['pure-white'];
        if (lightPreset) {
          applyCssVariablesToRoot({
            ...appearance,
            colors: lightPreset.colors
          });
        }
      } else if (systemPrefersDark && !currentIsDark) {
        // El SO está en modo oscuro y el tema actual es claro: cambiar a preset oscuro
        const darkPreset = APPEARANCE_PRESETS['kaivincia-cyan'];
        if (darkPreset) {
          applyCssVariablesToRoot({
            ...appearance,
            colors: darkPreset.colors
          });
        }
      } else {
        applyCssVariablesToRoot(previewAppearance || appearance);
      }
    } else {
      applyCssVariablesToRoot(previewAppearance || appearance);
    }
  }, [appearance, previewAppearance, systemPrefersDark]);

  // Suscripción en tiempo real a Firestore (settings/appearance)
  useEffect(() => {
    const docRef = doc(db, 'settings', 'appearance');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.data() as AppearanceConfig;
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
        setAppearance(merged);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
      } else {
        setAppearance(DEFAULT_APPEARANCE);
      }
    }, (error) => {
      console.warn('Realtime appearance subscription error (fallback to local):', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateAppearance = useCallback(async (partial: Partial<AppearanceConfig>) => {
    const updated = await saveAppearanceService(partial, user?.uid);
    setAppearance(updated);
    setPreviewAppearance(null);
  }, [user]);

  const resetAppearance = useCallback(async () => {
    const reset = await resetAppearanceService(user?.uid);
    setAppearance(reset);
    setPreviewAppearance(null);
  }, [user]);

  const applyPreset = useCallback(async (presetKey: string) => {
    const preset = APPEARANCE_PRESETS[presetKey];
    if (preset) {
      await updateAppearance({
        preset: presetKey,
        colors: preset.colors
      });
      return;
    }

    // Buscar en customPresets
    const custom = (appearance.customPresets || []).find(p => p.id === presetKey);
    if (custom) {
      await updateAppearance({
        preset: presetKey,
        colors: custom.colors
      });
    }
  }, [appearance.customPresets, updateAppearance]);

  const saveCustomPreset = useCallback(async (name: string, colors: AppearanceColors) => {
    const newPreset: CustomPreset = {
      id: `custom_${Date.now()}`,
      name: name.trim() || 'Mi Preset Personalizado',
      colors,
      createdAt: new Date().toISOString()
    };
    const updatedCustoms = [...(appearance.customPresets || []), newPreset];
    await updateAppearance({
      customPresets: updatedCustoms,
      preset: newPreset.id,
      colors
    });
  }, [appearance.customPresets, updateAppearance]);

  const deleteCustomPreset = useCallback(async (id: string) => {
    const updatedCustoms = (appearance.customPresets || []).filter(p => p.id !== id);
    await updateAppearance({
      customPresets: updatedCustoms,
      preset: appearance.preset === id ? 'kaivincia-cyan' : appearance.preset
    });
  }, [appearance.customPresets, appearance.preset, updateAppearance]);

  const contextValue = useMemo(() => ({
    appearance,
    previewAppearance,
    setPreviewAppearance,
    updateAppearance,
    resetAppearance,
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,
    loading,
    canEditAppearance,
    presets: APPEARANCE_PRESETS,
    systemPrefersDark
  }), [
    appearance, 
    previewAppearance, 
    updateAppearance, 
    resetAppearance, 
    applyPreset, 
    saveCustomPreset,
    deleteCustomPreset,
    loading, 
    canEditAppearance, 
    systemPrefersDark
  ]);

  return (
    <AppearanceContext.Provider value={contextValue}>
      {children}
    </AppearanceContext.Provider>
  );
};

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
