import React, { useState, useEffect } from 'react';
import { Palette, Save, RotateCcw, Check, Sun, Moon, Sparkles } from 'lucide-react';
import {
  PREDEFINED_PALETTES,
  DEFAULT_APPEARANCE,
  ColorPalette,
  AppearanceSettings,
  Density,
  applyAppearanceToDOM,
} from '../../constants/appearance';

interface ThemeModuleProps {
  initial?: AppearanceSettings;
  onSave?: (settings: AppearanceSettings) => void;
  autoApplyDefault?: boolean;
}

const COLOR_LABELS: Record<keyof ColorPalette['colors'], string> = {
  primary: 'Primario',
  hover: 'Oscuro (hover)',
  light: 'Claro (badges)',
  accent: 'Acento (alertas)',
  accentLight: 'Acento claro',
  background: 'Fondo del area',
};

export default function ThemeModule({ initial, onSave, autoApplyDefault = true }: ThemeModuleProps) {
  const [autoApply, setAutoApply] = useState(autoApplyDefault);
  const [settings, setSettings] = useState<AppearanceSettings>(initial ?? DEFAULT_APPEARANCE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (autoApply) applyAppearanceToDOM(settings);
  }, [settings, autoApply]);

  const updateColor = (key: keyof ColorPalette['colors'], value: string) => {
    setSettings(s => ({ ...s, paletteId: 'custom', colors: { ...s.colors, [key]: value } }));
  };

  const selectPalette = (p: ColorPalette) => {
    setSettings(s => ({ ...s, paletteId: p.id, colors: p.colors }));
  };

  const reset = () => {
    setSettings(DEFAULT_APPEARANCE);
    applyAppearanceToDOM(DEFAULT_APPEARANCE);
  };

  const handleSave = () => {
    applyAppearanceToDOM(settings);
    onSave?.(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6" /> Apariencia y Tema
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Elige una paleta o personaliza. Los cambios se aplican automaticamente.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm font-medium">Auto-aplicar</span>
          <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} className="w-5 h-5" />
        </label>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Vista previa en tiempo real</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Live</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.radius }} className="px-4 py-2 font-medium">Boton primario</button>
          <button style={{ background: settings.colors.light, color: settings.colors.primary, borderRadius: settings.radius }} className="px-4 py-2 font-medium">Boton secundario</button>
          <span style={{ color: settings.colors.primary }} className="font-semibold">Texto primario</span>
          <span style={{ background: settings.colors.accent, color: 'white', borderRadius: settings.radius }} className="px-2 py-1 text-xs font-bold">BADGE</span>
          <div style={{ background: settings.colors.light, borderColor: settings.colors.primary, borderRadius: settings.radius }} className="px-3 py-2 border-2 text-sm font-medium">Card activo</div>
          <div style={{ background: settings.colors.accentLight, color: settings.colors.accent, borderRadius: settings.radius }} className="px-3 py-2 text-sm font-medium">Alerta (accent)</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">12 paletas predefinidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {PREDEFINED_PALETTES.map(p => (
            <button key={p.id} onClick={() => selectPalette(p)} className={'p-3 rounded-lg border-2 text-left transition ' + (settings.paletteId === p.id ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-300')}>
              <div className="flex gap-1 mb-2">
                {[p.colors.primary, p.colors.accent, p.colors.light, p.colors.accentLight].map((c, i) => (
                  <div key={i} style={{ background: c }} className="w-4 h-4 rounded-full border border-gray-200" />
                ))}
              </div>
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="text-xs text-gray-500">{p.description}</div>
              {settings.paletteId === p.id && <Check className="w-4 h-4 mt-1 text-gray-900" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Personalizacion avanzada</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(COLOR_LABELS) as Array<keyof ColorPalette['colors']>).map(key => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{COLOR_LABELS[key]}</label>
              <div className="flex gap-2">
                <input type="color" value={settings.colors[key]} onChange={(e) => updateColor(key, e.target.value)} className="w-12 h-10 rounded border cursor-pointer" />
                <input type="text" value={settings.colors[key]} onChange={(e) => updateColor(key, e.target.value)} className="flex-1 px-3 py-2 border rounded font-mono text-sm" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Radio de las esquinas: <span className="font-mono">{settings.radius}px</span></label>
          <input type="range" min={0} max={24} value={settings.radius} onChange={(e) => setSettings(s => ({ ...s, radius: +e.target.value }))} className="w-full" />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Densidad</label>
          <div className="flex gap-2 flex-wrap">
            {(['compact','normal','comfortable'] as Density[]).map(d => (
              <button key={d} onClick={() => setSettings(s => ({ ...s, density: d }))} className={'px-4 py-2 rounded border-2 font-medium transition ' + (settings.density === d ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-300')}>
                {d === 'compact' ? 'Compacta' : d === 'normal' ? 'Normal' : 'Comoda'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Modo de visualizacion</label>
          <div className="flex gap-2">
            <button onClick={() => setSettings(s => ({ ...s, mode: 'light' }))} className={'px-4 py-2 rounded border-2 font-medium flex items-center gap-2 transition ' + (settings.mode === 'light' ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-300')}>
              <Sun className="w-4 h-4" /> Claro
            </button>
            <button onClick={() => setSettings(s => ({ ...s, mode: 'dark' }))} className={'px-4 py-2 rounded border-2 font-medium flex items-center gap-2 transition ' + (settings.mode === 'dark' ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-300')}>
              <Moon className="w-4 h-4" /> Oscuro
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t flex-wrap gap-3">
        <button onClick={reset} className="px-4 py-2 border rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50">
          <RotateCcw className="w-4 h-4" /> Restaurar predeterminado
        </button>
        <button onClick={handleSave} className="px-6 py-2 rounded-lg font-semibold text-white flex items-center gap-2" style={{ background: settings.colors.primary }}>
          {saved ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar</>}
        </button>
      </div>
    </div>
  );
}
