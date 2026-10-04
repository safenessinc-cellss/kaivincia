import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Type, 
  Layout, 
  Layers, 
  Eye, 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  Dices,
  Sun,
  Moon,
  Laptop,
  BookmarkPlus,
  Trash2,
  SlidersHorizontal,
  Contrast,
  Zap,
  Activity,
  Layers2,
  X
} from 'lucide-react';
import { useAppearance } from '../../contexts/AppearanceContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  AppearanceConfig, 
  AVAILABLE_FONTS, 
  APPEARANCE_PRESETS,
  PresetCategory,
  QUICK_SWATCHES,
  generateHarmoniousPalette,
  getContrastRatio,
  getLuminance 
} from '../../services/appearanceService';

export default function AppearancePanel() {
  const { t } = useLanguage();
  const { 
    appearance, 
    previewAppearance, 
    setPreviewAppearance, 
    updateAppearance, 
    resetAppearance, 
    saveCustomPreset,
    deleteCustomPreset,
    canEditAppearance,
    presets,
    systemPrefersDark
  } = useAppearance();

  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'menu' | 'components' | 'accessibility' | 'advanced'>('colors');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all' | 'custom'>('all');
  const [localConfig, setLocalConfig] = useState<AppearanceConfig>(appearance);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');

  // Sincronizar estado local cuando cambia la apariencia en Firestore
  useEffect(() => {
    setLocalConfig(appearance);
  }, [appearance]);

  // Manejador de cambios con previsualización en vivo
  const handleConfigChange = (partial: Partial<AppearanceConfig>) => {
    const updated = {
      ...localConfig,
      ...partial,
      fonts: { ...localConfig.fonts, ...(partial.fonts || {}) },
      colors: { ...localConfig.colors, ...(partial.colors || {}) },
      layout: { ...localConfig.layout, ...(partial.layout || {}) },
      accessibility: { ...localConfig.accessibility, ...(partial.accessibility || {}) },
      advanced: { ...(localConfig.advanced || appearance.advanced), ...(partial.advanced || {}) }
    };
    setLocalConfig(updated);
    setPreviewAppearance(updated);
  };

  const handleApplyPreset = (presetKey: string) => {
    const selectedPreset = presets[presetKey];
    if (selectedPreset) {
      handleConfigChange({
        preset: presetKey,
        colors: { ...selectedPreset.colors }
      });
      return;
    }

    const custom = (localConfig.customPresets || []).find(p => p.id === presetKey);
    if (custom) {
      handleConfigChange({
        preset: presetKey,
        colors: { ...custom.colors }
      });
    }
  };

  // Generador aleatorio de paletas
  const handleRandomizePalette = () => {
    const isLightMode = localConfig.advanced?.colorMode === 'light' || (!systemPrefersDark && localConfig.advanced?.colorMode === 'auto');
    const randomColors = generateHarmoniousPalette(isLightMode);
    handleConfigChange({
      colors: randomColors,
      preset: 'custom'
    });
  };

  // Guardar preset personalizado
  const handleConfirmSavePreset = async () => {
    if (!customPresetName.trim()) return;
    try {
      await saveCustomPreset(customPresetName.trim(), localConfig.colors);
      setShowSavePresetModal(false);
      setCustomPresetName('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving custom preset:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAppearance(localConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save appearance:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await resetAppearance();
      setShowResetConfirm(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to reset appearance:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setLocalConfig(appearance);
    setPreviewAppearance(null);
  };

  const hasUnsavedChanges = JSON.stringify(localConfig) !== JSON.stringify(appearance);

  // Ratios de contraste WCAG
  const textOnSurfaceRatio = getContrastRatio(localConfig.colors.textPrimary, localConfig.colors.surface);
  const secondaryOnSurfaceRatio = getContrastRatio(localConfig.colors.textSecondary, localConfig.colors.surface);
  const primaryOnBgRatio = getContrastRatio(localConfig.colors.primary, localConfig.colors.background);

  // Filtrar presets por categoría
  const filteredPresets = Object.entries(presets).filter(([_key, p]) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const customPresetsList = localConfig.customPresets || [];

  if (!canEditAppearance) {
    return (
      <div className="max-w-4xl mx-auto p-6 sm:p-12 text-center">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-slate-300 space-y-4">
          <ShieldAlert className="w-16 h-16 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            {t('common.access_denied', 'Acceso Restringido')}
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {t('appearance.admin_only', 'Solo los usuarios con rol SuperAdmin o Administrador tienen permisos para modificar la apariencia corporativa de Kaivincia.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Cabecera Principal */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight uppercase flex items-center gap-2">
                <span>{t('appearance.title', 'Personalización Visual')}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  SuperAdmin
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {t('appearance.subtitle', 'Ajusta tipografías, paletas cromáticas, menú, bordes y accesibilidad global en tiempo real.')}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Globales: Guardar como Preset, Guardar y Restablecer */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Botón Guardar como Preset */}
          <button
            type="button"
            onClick={() => setShowSavePresetModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Guardar combinación actual como nuevo preset personalizado"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('appearance.save_as_preset', 'Guardar como preset')}</span>
          </button>

          {/* Botón Aleatorio */}
          <button
            type="button"
            onClick={handleRandomizePalette}
            className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Generar paleta armónica aleatoria"
          >
            <Dices className="w-4 h-4" />
            <span className="hidden sm:inline">{t('appearance.randomize', 'Aleatorio')}</span>
          </button>

          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              {t('common.cancel', 'Descartar')}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Restablecer tema por defecto"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t('appearance.reset', 'Restablecer')}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.35)] flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveSuccess ? t('appearance.saved_success', '¡Guardado!') : t('appearance.save', 'Guardar Cambios')}</span>
          </button>
        </div>
      </div>

      {/* Control de Modo Claro / Oscuro / Auto */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
            <span>{t('appearance.mode_title', 'Modo de Luminosidad Global')}</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/20">
              {localConfig.advanced?.colorMode === 'auto' ? 'Auto (SO)' : (localConfig.advanced?.colorMode === 'light' ? 'Claro' : 'Oscuro')}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {t('appearance.mode_desc', 'Selecciona si la plataforma adapta el tema automáticamente según el sistema operativo o fuerza un modo.')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleConfigChange({ advanced: { ...(localConfig.advanced || {}), colorMode: 'auto' } as any })}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              localConfig.advanced?.colorMode === 'auto'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Auto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleConfigChange({
                advanced: { ...(localConfig.advanced || {}), colorMode: 'light' } as any,
                preset: 'pure-white',
                colors: APPEARANCE_PRESETS['pure-white'].colors
              });
            }}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              localConfig.advanced?.colorMode === 'light'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{t('appearance.mode_light', 'Forzar Claro')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleConfigChange({
                advanced: { ...(localConfig.advanced || {}), colorMode: 'dark' } as any,
                preset: 'kaivincia-cyan',
                colors: APPEARANCE_PRESETS['kaivincia-cyan'].colors
              });
            }}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              localConfig.advanced?.colorMode === 'dark'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{t('appearance.mode_dark', 'Forzar Oscuro')}</span>
          </button>
        </div>
      </div>

      {/* Selector de Presets de Tema Agrupado por Categorías */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">
              {t('appearance.presets', 'Galería de Temas y Presets')}
            </h3>
          </div>

          {/* Filtros de Categoría */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: t('common.all', 'Todos') },
              { id: 'light', label: `☀️ ${t('appearance.cat_light', 'Claros')} (${Object.values(presets).filter(p => p.category === 'light').length})` },
              { id: 'dark', label: `🌙 ${t('appearance.cat_dark', 'Oscuros')} (${Object.values(presets).filter(p => p.category === 'dark').length})` },
              { id: 'neutral', label: `🏛️ ${t('appearance.cat_neutral', 'Neutros')} (${Object.values(presets).filter(p => p.category === 'neutral').length})` },
              { id: 'vibrant', label: `⚡ ${t('appearance.cat_vibrant', 'Vibrantes')} (${Object.values(presets).filter(p => p.category === 'vibrant').length})` },
              { id: 'custom', label: `⭐ ${t('appearance.cat_custom', 'Mis Presets')} (${customPresetsList.length})` }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Presets Oficiales */}
        {selectedCategory !== 'custom' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredPresets.map(([key, preset]) => {
              const isSelected = localConfig.preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[92px] ${
                    isSelected 
                      ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(0,240,255,0.2)] ring-1 ring-cyan-400' 
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                        {preset.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block truncate font-mono">
                      {preset.category}
                    </span>
                  </div>

                  {/* Muestras de Color */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-4 h-4 rounded-full border border-black/30 shadow-sm" style={{ backgroundColor: preset.colors.primary }} title="Primario" />
                    <span className="w-4 h-4 rounded-full border border-black/30 shadow-sm" style={{ backgroundColor: preset.colors.background }} title="Fondo" />
                    <span className="w-4 h-4 rounded-full border border-black/30 shadow-sm" style={{ backgroundColor: preset.colors.surface }} title="Superficie" />
                    <span className="w-4 h-4 rounded-full border border-black/30 shadow-sm" style={{ backgroundColor: preset.colors.secondary }} title="Secundario" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Sección: Mis Presets Personalizados */}
        {(selectedCategory === 'custom' || selectedCategory === 'all') && customPresetsList.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⭐ Presets Personalizados Creados por Administradores</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {customPresetsList.map(custom => {
                const isSelected = localConfig.preset === custom.id;
                return (
                  <div
                    key={custom.id}
                    className={`p-3 rounded-2xl border text-left transition-all relative group flex flex-col justify-between min-h-[92px] ${
                      isSelected 
                        ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div 
                      onClick={() => handleApplyPreset(custom.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white truncate max-w-[100px]">
                          {custom.name}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">Personalizado</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: custom.colors.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: custom.colors.background }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: custom.colors.surface }} />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomPreset(custom.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Eliminar preset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid Principal: Pestañas de Edición a la Izquierda y Mockup Interactivo a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: CONTROLES (7 columnas) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
            {[
              { id: 'colors', label: t('appearance.tab.colors', 'Colores'), icon: Palette },
              { id: 'advanced', label: t('appearance.tab.advanced', 'Ajustes de Color & Superficie'), icon: SlidersHorizontal },
              { id: 'typography', label: t('appearance.tab.typography', 'Tipografía'), icon: Type },
              { id: 'menu', label: t('appearance.tab.menu', 'Menú / Sidebar'), icon: Layout },
              { id: 'components', label: t('appearance.tab.components', 'Componentes'), icon: Layers },
              { id: 'accessibility', label: t('appearance.tab.accessibility', 'Accesibilidad'), icon: Eye }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* CONTENIDO DE PESTAÑA */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-6">
            {/* PESTAÑA 1: COLORES */}
            {activeTab === 'colors' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wider mb-1">
                      {t('appearance.colors.title', 'Paleta Cromática Corporativa')}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t('appearance.colors.desc', 'Configura los colores hexadecimales aplicados globalmente a través de variables CSS.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRandomizePalette}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Aleatorio</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'primary', label: t('appearance.colors.primary', 'Color Primario (Acentos/Botones)'), val: localConfig.colors.primary },
                    { key: 'secondary', label: t('appearance.colors.secondary', 'Color Secundario (Bordes/Bases)'), val: localConfig.colors.secondary },
                    { key: 'background', label: t('appearance.colors.background', 'Color de Fondo Principal'), val: localConfig.colors.background },
                    { key: 'surface', label: t('appearance.colors.surface', 'Color de Superficie (Tarjetas/Modales)'), val: localConfig.colors.surface },
                    { key: 'textPrimary', label: t('appearance.colors.text_primary', 'Texto Principal'), val: localConfig.colors.textPrimary },
                    { key: 'textSecondary', label: t('appearance.colors.text_secondary', 'Texto Secundario (Muted)'), val: localConfig.colors.textSecondary },
                    { key: 'sidebarBg', label: t('appearance.colors.sidebar_bg', 'Fondo de Barra Lateral'), val: localConfig.colors.sidebarBg },
                    { key: 'sidebarText', label: t('appearance.colors.sidebar_text', 'Texto de Barra Lateral'), val: localConfig.colors.sidebarText },
                    { key: 'sidebarActive', label: t('appearance.colors.sidebar_active', 'Ítem Activo en Sidebar'), val: localConfig.colors.sidebarActive },
                    { key: 'headerBg', label: t('appearance.colors.header_bg', 'Fondo de Encabezado Superior'), val: localConfig.colors.headerBg }
                  ].map(colorField => (
                    <div key={colorField.key} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 truncate max-w-[200px]">
                          {colorField.label}
                        </label>
                        <span className="font-mono text-[11px] text-cyan-400 uppercase">
                          {colorField.val}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Selector de color nativo */}
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-slate-700 shrink-0 shadow-inner">
                          <input
                            type="color"
                            value={colorField.val}
                            onChange={(e) => handleConfigChange({
                              colors: { ...localConfig.colors, [colorField.key]: e.target.value },
                              preset: 'custom'
                            })}
                            className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0 p-0"
                          />
                        </div>
                        {/* Input de texto hexadecimal */}
                        <input
                          type="text"
                          value={colorField.val}
                          onChange={(e) => handleConfigChange({
                            colors: { ...localConfig.colors, [colorField.key]: e.target.value },
                            preset: 'custom'
                          })}
                          maxLength={7}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white uppercase focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      {/* Paleta rápida de swatches para este campo */}
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                        <span className="text-[9px] text-slate-500 font-mono mr-1">Rápidos:</span>
                        {/* Muestras claras */}
                        {QUICK_SWATCHES.light.slice(0, 3).map(hex => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => handleConfigChange({
                              colors: { ...localConfig.colors, [colorField.key]: hex },
                              preset: 'custom'
                            })}
                            className="w-4 h-4 rounded-full border border-slate-600 shrink-0 hover:scale-125 transition-transform"
                            style={{ backgroundColor: hex }}
                            title={`Aplicar ${hex}`}
                          />
                        ))}
                        {/* Muestras oscuras */}
                        {QUICK_SWATCHES.dark.slice(0, 3).map(hex => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => handleConfigChange({
                              colors: { ...localConfig.colors, [colorField.key]: hex },
                              preset: 'custom'
                            })}
                            className="w-4 h-4 rounded-full border border-slate-600 shrink-0 hover:scale-125 transition-transform"
                            style={{ backgroundColor: hex }}
                            title={`Aplicar ${hex}`}
                          />
                        ))}
                        {/* Muestra vibrante */}
                        {QUICK_SWATCHES.vibrant.slice(0, 3).map(hex => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => handleConfigChange({
                              colors: { ...localConfig.colors, [colorField.key]: hex },
                              preset: 'custom'
                            })}
                            className="w-4 h-4 rounded-full border border-slate-600 shrink-0 hover:scale-125 transition-transform"
                            style={{ backgroundColor: hex }}
                            title={`Aplicar ${hex}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verificación de Accesibilidad WCAG AA */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                    <Contrast className="w-4 h-4 text-cyan-400" />
                    <span>Auditoría de Contraste WCAG AA</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Texto / Fondo:</span>
                      <span className={`font-mono font-bold ${textOnSurfaceRatio >= 4.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {textOnSurfaceRatio}:1 {textOnSurfaceRatio >= 4.5 ? '✓ AA' : '⚠'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Muted / Superficie:</span>
                      <span className={`font-mono font-bold ${secondaryOnSurfaceRatio >= 3.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {secondaryOnSurfaceRatio}:1 {secondaryOnSurfaceRatio >= 3.0 ? '✓ AA' : '⚠'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Acento / Fondo:</span>
                      <span className={`font-mono font-bold ${primaryOnBgRatio >= 3.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {primaryOnBgRatio}:1 {primaryOnBgRatio >= 3.0 ? '✓ AA' : '⚠'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA NUEVA: AJUSTES AVANZADOS DE COLOR & SUPERFICIE */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider mb-1">
                    {t('appearance.advanced.title', 'Ajustes Avanzados de Superficie y Contraste')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('appearance.advanced.desc', 'Controla la transparencia de paneles de cristal, intensidad de bordes y contraste dinámico.')}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Opacidad de Superficies (50% a 100%) */}
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>{t('appearance.advanced.surface_opacity', 'Opacidad de Superficies (Glassmorphism)')}</span>
                      <span className="font-mono text-cyan-400 text-sm">
                        {localConfig.advanced?.surfaceOpacity ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={localConfig.advanced?.surfaceOpacity ?? 100}
                      onChange={(e) => handleConfigChange({
                        advanced: { ...(localConfig.advanced || {}), surfaceOpacity: Number(e.target.value) } as any
                      })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>50% (Transparente)</span>
                      <span>75% (Translúcido)</span>
                      <span>100% (Sólido Opaco)</span>
                    </div>
                  </div>

                  {/* Intensidad de Bordes (0% a 100%) */}
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>{t('appearance.advanced.border_intensity', 'Intensidad de Bordes')}</span>
                      <span className="font-mono text-cyan-400 text-sm">
                        {localConfig.advanced?.borderIntensity ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={10}
                      value={localConfig.advanced?.borderIntensity ?? 100}
                      onChange={(e) => handleConfigChange({
                        advanced: { ...(localConfig.advanced || {}), borderIntensity: Number(e.target.value) } as any
                      })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0% (Sin bordes)</span>
                      <span>50% (Sutil)</span>
                      <span>100% (Marcado)</span>
                    </div>
                  </div>

                  {/* Contraste de Texto (0% a 100%) */}
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>{t('appearance.advanced.text_contrast', 'Contraste Tipográfico Adicional')}</span>
                      <span className="font-mono text-cyan-400 text-sm">
                        {localConfig.advanced?.textContrast ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={localConfig.advanced?.textContrast ?? 100}
                      onChange={(e) => handleConfigChange({
                        advanced: { ...(localConfig.advanced || {}), textContrast: Number(e.target.value) } as any
                      })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>50% (Suave)</span>
                      <span>80% (Estándar)</span>
                      <span>100% (Ultra Contraste)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: TIPOGRAFÍA */}
            {activeTab === 'typography' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider mb-1">
                    {t('appearance.fonts.title', 'Configuración Tipográfica')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('appearance.fonts.desc', 'Ajusta la familia de fuentes, tamaño base, peso y escala proporcional de encabezados.')}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Selector de Fuente Principal */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {t('appearance.fonts.family', 'Familia Tipográfica Principal')}
                    </label>
                    <select
                      value={localConfig.fonts.family}
                      onChange={(e) => handleConfigChange({
                        fonts: { ...localConfig.fonts, family: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      {AVAILABLE_FONTS.map(font => (
                        <option key={font.id} value={font.id}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slider de Tamaño Base (12px a 20px) */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>{t('appearance.fonts.base_size', 'Tamaño de Fuente Base')}</span>
                      <span className="font-mono text-cyan-400 text-sm">{localConfig.fonts.baseSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={20}
                      step={1}
                      value={localConfig.fonts.baseSize}
                      onChange={(e) => handleConfigChange({
                        fonts: { ...localConfig.fonts, baseSize: Number(e.target.value) }
                      })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>12px (Compacto)</span>
                      <span>14px (Estándar)</span>
                      <span>16px (Mediano)</span>
                      <span>20px (Grande)</span>
                    </div>
                  </div>

                  {/* Escala de Títulos y Peso de Fuente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        {t('appearance.fonts.heading_scale', 'Escala de Títulos')}
                      </label>
                      <select
                        value={localConfig.fonts.headingScale}
                        onChange={(e) => handleConfigChange({
                          fonts: { ...localConfig.fonts, headingScale: e.target.value as any }
                        })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="compact">Compacta (0.875x)</option>
                        <option value="normal">Normal (1.0x)</option>
                        <option value="large">Grande (1.2x)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        {t('appearance.fonts.weight', 'Peso de Fuente Base')}
                      </label>
                      <select
                        value={localConfig.fonts.weight}
                        onChange={(e) => handleConfigChange({
                          fonts: { ...localConfig.fonts, weight: e.target.value as any }
                        })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="normal">Normal (400)</option>
                        <option value="medium">Medium (500)</option>
                        <option value="semibold">Semibold (600)</option>
                        <option value="bold">Bold (700)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: MENÚ / SIDEBAR */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider mb-1">
                    {t('appearance.layout.menu_title', 'Geometría y Comportamiento del Menú')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('appearance.layout.menu_desc', 'Controla la anchura, posición lateral y comportamiento de colapso de la barra de navegación.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {t('appearance.layout.sidebar_size', 'Ancho de Barra Lateral')}
                    </label>
                    <select
                      value={localConfig.layout.sidebarSize}
                      onChange={(e) => handleConfigChange({
                        layout: { ...localConfig.layout, sidebarSize: e.target.value as any }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="compact">Compacto (64px - Solo iconos)</option>
                      <option value="normal">Normal (256px - Estándar)</option>
                      <option value="expanded">Expandido (320px - Detallado)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {t('appearance.layout.sidebar_position', 'Posición del Menú')}
                    </label>
                    <select
                      value={localConfig.layout.sidebarPosition}
                      onChange={(e) => handleConfigChange({
                        layout: { ...localConfig.layout, sidebarPosition: e.target.value as any }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="left">Izquierda (Predeterminada)</option>
                      <option value="right">Derecha (Modo RTL / Alternativo)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">
                      {t('appearance.layout.sidebar_collapsible', 'Comportamiento de Colapso')}
                    </label>
                    <select
                      value={localConfig.layout.sidebarCollapsible}
                      onChange={(e) => handleConfigChange({
                        layout: { ...localConfig.layout, sidebarCollapsible: e.target.value as any }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="auto">Automático (Interactivo por usuario)</option>
                      <option value="always_expanded">Siempre Expandido</option>
                      <option value="always_collapsed">Siempre Colapsado (Compacto)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 4: COMPONENTES */}
            {activeTab === 'components' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider mb-1">
                    {t('appearance.layout.components_title', 'Propiedades de Componentes')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('appearance.layout.components_desc', 'Ajusta el radio de curvatura de bordes, sombras de tarjetas y densidad de espaciado.')}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Slider de Radio de Bordes (0px a 24px) */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>{t('appearance.layout.border_radius', 'Radio de Bordes (Border Radius)')}</span>
                      <span className="font-mono text-cyan-400 text-sm">{localConfig.layout.borderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      step={2}
                      value={localConfig.layout.borderRadius}
                      onChange={(e) => handleConfigChange({
                        layout: { ...localConfig.layout, borderRadius: Number(e.target.value) }
                      })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0px (Cuadrado)</span>
                      <span>8px (Suave)</span>
                      <span>12px (Predeterminado)</span>
                      <span>24px (Pill / Redondo)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        {t('appearance.layout.card_shadow', 'Sombra de Tarjetas')}
                      </label>
                      <select
                        value={localConfig.layout.cardShadow}
                        onChange={(e) => handleConfigChange({
                          layout: { ...localConfig.layout, cardShadow: e.target.value as any }
                        })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="none">Ninguna (Plano)</option>
                        <option value="subtle">Sutil (Ligero relieve)</option>
                        <option value="medium">Media (Predeterminada)</option>
                        <option value="strong">Fuerte (Alto contraste / 3D)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        {t('appearance.layout.density', 'Densidad de Interfaz')}
                      </label>
                      <select
                        value={localConfig.layout.density}
                        onChange={(e) => handleConfigChange({
                          layout: { ...localConfig.layout, density: e.target.value as any }
                        })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="compact">Compacta (Más datos por pantalla)</option>
                        <option value="normal">Normal (Balance ergonómico)</option>
                        <option value="spacious">Espaciosa (Mayor holgura visual)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 5: ACCESIBILIDAD */}
            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider mb-1">
                    {t('appearance.accessibility.title', 'Accesibilidad e Inclusión')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('appearance.accessibility.desc', 'Optimiza la visibilidad para condiciones visuales y preferencias motoras.')}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Alto Contraste Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {t('appearance.accessibility.high_contrast', 'Modo Alto Contraste')}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Eleva el contraste de bordes, botones y textos para máxima legibilidad.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.accessibility.highContrast}
                        onChange={(e) => handleConfigChange({
                          accessibility: { ...localConfig.accessibility, highContrast: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {/* Reducir Movimiento Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {t('appearance.accessibility.reduce_motion', 'Reducir Movimiento (Motion Safe)')}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Deshabilita transiciones y animaciones que puedan inducir fatiga visual o mareo.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.accessibility.reduceMotion}
                        onChange={(e) => handleConfigChange({
                          accessibility: { ...localConfig.accessibility, reduceMotion: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {/* Modo Daltónico */}
                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="text-xs font-bold text-slate-300 block">
                      {t('appearance.accessibility.color_blind_mode', 'Filtro de Daltonismo')}
                    </label>
                    <select
                      value={localConfig.accessibility.colorBlindMode}
                      onChange={(e) => handleConfigChange({
                        accessibility: { ...localConfig.accessibility, colorBlindMode: e.target.value as any }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="none">Ninguno (Visión estándar)</option>
                      <option value="deuteranopia">Deuteranopia (Deficiencia verde)</option>
                      <option value="protanopia">Protanopia (Deficiencia roja)</option>
                      <option value="tritanopia">Tritanopia (Deficiencia azul)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: MINI-MOCKUP DE PREVISUALIZACIÓN EN VIVO (5 columnas) */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>{t('appearance.preview.title', 'Vista Previa en Vivo')}</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-md">
              En Vivo
            </span>
          </div>

          {/* Caja del Mockup Mejorada */}
          <div 
            className="rounded-3xl border border-slate-800 overflow-hidden shadow-2xl transition-all"
            style={{ 
              backgroundColor: localConfig.colors.background,
              fontFamily: `'${localConfig.fonts.family}', sans-serif`,
              fontSize: `${localConfig.fonts.baseSize}px`
            }}
          >
            {/* Header / Barra Superior Simulada */}
            <div 
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ 
                backgroundColor: localConfig.colors.headerBg,
                borderColor: localConfig.colors.secondary
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold ml-2 uppercase tracking-wider" style={{ color: localConfig.colors.textPrimary }}>
                  Kaivincia OS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: `${localConfig.colors.primary}20`, color: localConfig.colors.primary }}>
                  CRM Live
                </span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: localConfig.colors.primary, color: '#000000' }}>
                  K
                </div>
              </div>
            </div>

            {/* Layout Interno: Sidebar + Contenido */}
            <div className={`flex ${localConfig.layout.sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'} min-h-[380px]`}>
              {/* Sidebar Mockup */}
              <div 
                className="p-3 border-r flex flex-col justify-between"
                style={{ 
                  backgroundColor: localConfig.colors.sidebarBg,
                  borderColor: localConfig.colors.secondary,
                  width: localConfig.layout.sidebarSize === 'compact' ? '48px' : (localConfig.layout.sidebarSize === 'expanded' ? '140px' : '110px')
                }}
              >
                <div className="space-y-1.5">
                  <div 
                    className="p-1.5 rounded-lg flex items-center gap-2 font-bold text-[11px]"
                    style={{ 
                      backgroundColor: `${localConfig.colors.primary}25`,
                      color: localConfig.colors.sidebarActive
                    }}
                  >
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    {localConfig.layout.sidebarSize !== 'compact' && <span>Dashboard</span>}
                  </div>
                  <div 
                    className="p-1.5 rounded-lg flex items-center gap-2 text-[11px]"
                    style={{ color: localConfig.colors.sidebarText }}
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    {localConfig.layout.sidebarSize !== 'compact' && <span>Pipeline</span>}
                  </div>
                  <div 
                    className="p-1.5 rounded-lg flex items-center gap-2 text-[11px]"
                    style={{ color: localConfig.colors.sidebarText }}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    {localConfig.layout.sidebarSize !== 'compact' && <span>Ajustes</span>}
                  </div>
                </div>

                <div 
                  className="text-[9px] truncate font-mono"
                  style={{ color: localConfig.colors.textSecondary }}
                >
                  v2.6 OS
                </div>
              </div>

              {/* Contenido Principal Mockup con Fondo y Superficies */}
              <div className="flex-1 p-4 space-y-3">
                {/* Tarjeta de Métricas con Opacidad Ajustable */}
                <div 
                  className="p-3.5 border transition-all"
                  style={{ 
                    backgroundColor: localConfig.colors.surface,
                    opacity: (localConfig.advanced?.surfaceOpacity ?? 100) / 100,
                    borderColor: localConfig.colors.secondary,
                    borderRadius: `${localConfig.layout.borderRadius}px`,
                    boxShadow: localConfig.layout.cardShadow === 'strong' ? '0 10px 15px -3px rgba(0,0,0,0.5)' : (localConfig.layout.cardShadow === 'subtle' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none')
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold" style={{ color: localConfig.colors.textSecondary }}>
                      Ingresos MRR
                    </span>
                    <span 
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded-md"
                      style={{ 
                        backgroundColor: `${localConfig.colors.primary}25`, 
                        color: localConfig.colors.primary 
                      }}
                    >
                      +18.4%
                    </span>
                  </div>
                  <div className="text-lg font-black" style={{ color: localConfig.colors.textPrimary }}>
                    $128,450 USD
                  </div>
                </div>

                {/* Botón Primario y Secundario */}
                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full py-2 px-3 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                    style={{ 
                      backgroundColor: localConfig.colors.primary, 
                      color: getLuminance(localConfig.colors.primary) > 0.4 ? '#000000' : '#ffffff',
                      borderRadius: `${Math.min(localConfig.layout.borderRadius, 14)}px`
                    }}
                  >
                    <span>Botón Primario</span>
                  </button>

                  <button
                    type="button"
                    className="w-full py-2 px-3 font-bold text-xs uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-all"
                    style={{ 
                      backgroundColor: localConfig.colors.secondary, 
                      borderColor: localConfig.colors.secondary,
                      color: localConfig.colors.textPrimary,
                      borderRadius: `${Math.min(localConfig.layout.borderRadius, 14)}px`
                    }}
                  >
                    <span>Botón Secundario</span>
                  </button>
                </div>

                {/* Muestra de Tipografía y Superficie */}
                <div 
                  className="p-2.5 rounded-xl border text-[11px] space-y-1"
                  style={{ 
                    backgroundColor: localConfig.colors.surface,
                    borderColor: localConfig.colors.secondary,
                    color: localConfig.colors.textSecondary,
                    borderRadius: `${localConfig.layout.borderRadius}px`
                  }}
                >
                  <p className="font-bold" style={{ color: localConfig.colors.textPrimary }}>
                    Familia: {localConfig.fonts.family}
                  </p>
                  <p>Superficie clara/oscura con contraste {localConfig.fonts.weight} y escala {localConfig.fonts.headingScale}.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Guardar como Preset Personalizado */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  Guardar como Preset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Guarda la combinación actual de colores de fondo, superficie, acentos y barra lateral en tu galería de presets personalizados.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Nombre del Preset
              </label>
              <input
                type="text"
                placeholder="Ej. Mi Tema Corporativo Claro"
                value={customPresetName}
                onChange={(e) => setCustomPresetName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSavePreset}
                disabled={!customPresetName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-40"
              >
                Guardar Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Restablecer */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                ¿Restablecer Apariencia a Valores de Fábrica?
              </h3>
              <p className="text-xs text-slate-400">
                Se volverá al tema predeterminado "Kaivincia Cyan" y se sobreescribirán todos los ajustes guardados.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {t('appearance.confirm_reset', 'Sí, Restablecer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
