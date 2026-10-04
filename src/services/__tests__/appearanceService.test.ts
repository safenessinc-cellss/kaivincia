import { 
  APPEARANCE_PRESETS,
  getPresetsByCategory,
  getLightPresets,
  findPresetById,
  getContrastRatio,
  PRESET_CATEGORY_ORDER,
  PresetCategory
} from '../appearanceService';

console.log('--- INICIANDO SUITE DE PRUEBAS DE APPEARANCE SERVICE ---');

// 1. Verifica que los 6 presets originales siguen existiendo
const originalPresetIds = [
  'kaivincia-cyan',
  'dark-elegant',
  'light-corporate',
  'neon-purple',
  'emerald-green',
  'sunset-orange'
];

originalPresetIds.forEach(id => {
  const found = findPresetById(id);
  if (!found) throw new Error(`Fallo: El preset original "${id}" no fue encontrado.`);
  console.log(`✓ Preset original encontrado: ${found.name} (${found.category})`);
});

// 2. Verifica que los 10 nuevos presets claros existen
const newLightPresetIds = [
  'pure-white',
  'soft-cream',
  'sky-blue',
  'mint-fresh',
  'lavender-mist',
  'peach-blossom',
  'rose-quartz',
  'sand-dune',
  'cloud-gray',
  'ocean-breeze'
];

newLightPresetIds.forEach(id => {
  const found = findPresetById(id);
  if (!found) throw new Error(`Fallo: El nuevo preset claro "${id}" no fue encontrado.`);
  console.log(`✓ Nuevo preset claro encontrado: ${found.name} (${found.category})`);
});

// 3. Verifica getPresetsByCategory() agrupa correctamente
const grouped = getPresetsByCategory();
PRESET_CATEGORY_ORDER.forEach(cat => {
  const list = grouped[cat];
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`Fallo: La categoría "${cat}" no contiene presets agrupados.`);
  }
  console.log(`✓ Categoría "${cat}" agrupada correctamente con ${list.length} presets.`);
});

// 4. Verifica que los presets claros tienen texto oscuro (contraste >= 4.5:1 WCAG AA)
const allLightAndNeutral = [...newLightPresetIds, 'light-corporate'];
allLightAndNeutral.forEach(id => {
  const preset = findPresetById(id);
  if (!preset) throw new Error(`Preset ${id} no encontrado.`);
  const ratio = getContrastRatio(preset.colors.text, preset.colors.background);
  if (ratio < 4.5) {
    throw new Error(`Fallo WCAG AA: Preset "${preset.name}" tiene ratio ${ratio}:1 (< 4.5:1).`);
  }
  console.log(`✓ Preset claro "${preset.name}" cumple WCAG AA: ${ratio}:1 (text vs bg)`);
});

// 5. Verifica que todos los presets tienen category válida
const validCategories: PresetCategory[] = ['dark', 'light', 'vibrant', 'neutral'];
Object.values(APPEARANCE_PRESETS).forEach(preset => {
  if (!validCategories.includes(preset.category)) {
    throw new Error(`Fallo: Preset "${preset.name}" tiene categoría inválida "${preset.category}".`);
  }
  if (!preset.colors.primary || !preset.colors.background || !preset.colors.surface || !preset.colors.text) {
    throw new Error(`Fallo: Preset "${preset.name}" tiene campos de color incompletos.`);
  }
});
console.log(`✓ Todos los ${Object.keys(APPEARANCE_PRESETS).length} presets tienen categoría y campos de color válidos.`);

console.log('--- TODAS LAS PRUEBAS UNITARIAS PASARON EXITOSAMENTE (5/5) ---');
