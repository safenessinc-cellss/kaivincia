import { useState, useEffect } from 'react';
import { TemplateField, CustomFieldType } from '../../types/templates';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Check, 
  X, 
  HelpCircle, 
  Tag, 
  FileText, 
  Hash, 
  Calendar, 
  List, 
  MapPin, 
  Paperclip, 
  CheckSquare, 
  Link as LinkIcon 
} from 'lucide-react';

interface FieldEditorProps {
  field: TemplateField | null;
  existingGroups: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: TemplateField) => void;
}

const FIELD_TYPES: { type: CustomFieldType; label: string; icon: any; description: string }[] = [
  { type: 'text', label: 'Texto Corto', icon: FileText, description: 'Línea de texto simple (nombres, referencias)' },
  { type: 'textarea', label: 'Texto Largo', icon: FileText, description: 'Párrafos, notas y observaciones' },
  { type: 'number', label: 'Numérico', icon: Hash, description: 'Valores cuantitativos o montos' },
  { type: 'datetime', label: 'Fecha y Hora', icon: Calendar, description: 'Horarios específicos de citas' },
  { type: 'date', label: 'Solo Fecha', icon: Calendar, description: 'Días calendario sin hora' },
  { type: 'time', label: 'Solo Hora', icon: Calendar, description: 'Franjas horarias' },
  { type: 'select', label: 'Lista Desplegable (Única)', icon: List, description: 'Selección de una sola opción' },
  { type: 'multiselect', label: 'Selección Múltiple', icon: List, description: 'Etiquetas o productos múltiples' },
  { type: 'gps', label: 'Coordenadas / Enlace GPS', icon: MapPin, description: 'Google Maps o geolocalización' },
  { type: 'url', label: 'Enlace Web / URL', icon: LinkIcon, description: 'Vínculos externos a documentos o perfiles' },
  { type: 'checkbox', label: 'Interruptor Sí/No', icon: CheckSquare, description: 'Confirmación booleana' },
  { type: 'file', label: 'Adjunto de Archivo', icon: Paperclip, description: 'Documentos o fotografías' }
];

const PRESET_EMOJIS = ['📍', '🔗', '👤', '📅', '👉', '🎁', '📲', '📝', '🏠', '📞', '🏢', '🏷️', '💼', '⭐', '⚡'];

export default function FieldEditor({
  field,
  existingGroups,
  isOpen,
  onClose,
  onSave
}: FieldEditorProps) {
  const [formData, setFormData] = useState<TemplateField>({
    id: `field_${Date.now()}`,
    label: '',
    key: '',
    type: 'text',
    required: false,
    isSystemFixed: false,
    group: existingGroups[0] || 'Datos Generales',
    order: 10,
    placeholder: '',
    helpText: '',
    options: [],
    exportToCard: true,
    cardEmoji: '👉'
  });

  const [newOption, setNewOption] = useState('');
  const [customGroup, setCustomGroup] = useState('');
  const [isNewGroup, setIsNewGroup] = useState(false);

  useEffect(() => {
    if (field) {
      setFormData({ ...field });
      setIsNewGroup(!existingGroups.includes(field.group));
      if (!existingGroups.includes(field.group)) {
        setCustomGroup(field.group);
      }
    } else {
      setFormData({
        id: `field_${Date.now()}`,
        label: '',
        key: '',
        type: 'text',
        required: false,
        isSystemFixed: false,
        group: existingGroups[0] || 'Datos Generales',
        order: 10,
        placeholder: '',
        helpText: '',
        options: [],
        exportToCard: true,
        cardEmoji: '👉'
      });
      setIsNewGroup(false);
      setCustomGroup('');
    }
  }, [field, existingGroups]);

  if (!isOpen) return null;

  const handleLabelChange = (val: string) => {
    const updated = { ...formData, label: val };
    // Generar key automática si no es un campo del sistema
    if (!formData.isSystemFixed && !field) {
      const slug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      updated.key = slug || `field_${Date.now()}`;
    }
    setFormData(updated);
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    const opts = formData.options || [];
    if (!opts.includes(newOption.trim())) {
      setFormData({ ...formData, options: [...opts, newOption.trim()] });
    }
    setNewOption('');
  };

  const handleRemoveOption = (optToRemove: string) => {
    setFormData({
      ...formData,
      options: (formData.options || []).filter((o) => o !== optToRemove)
    });
  };

  const handleSave = () => {
    if (!formData.label.trim()) {
      alert('Por favor especifica una etiqueta para el campo.');
      return;
    }

    const finalGroup = isNewGroup ? (customGroup.trim() || 'Personalizado') : formData.group;
    onSave({
      ...formData,
      group: finalGroup
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0E14] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic">
                {field ? 'Configurar Campo de Ficha' : 'Añadir Nuevo Campo Personalizado'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {formData.isSystemFixed ? 'Campo estándar del sistema (protegido)' : 'Personalización operativa para el proyecto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <div className="space-y-4 text-xs">
          {/* Etiqueta y Clave */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">
                Etiqueta / Nombre Visible <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Ej: Cupón de Descuento"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">
                Identificador de Campo (Key)
              </label>
              <input
                type="text"
                disabled={formData.isSystemFixed}
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-mono rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Tipo de Campo */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              Tipo de Dato / Control
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FIELD_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = formData.type === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    disabled={formData.isSystemFixed}
                    onClick={() => setFormData({ ...formData, type: t.type })}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-[#00F0FF]' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-[11px] leading-tight">{t.label}</div>
                      <div className="text-[9px] text-slate-500 line-clamp-1">{t.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones si es Select o Multiselect */}
          {(formData.type === 'select' || formData.type === 'multiselect') && (
            <div className="space-y-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="text-[10px] font-mono uppercase text-slate-300 block">
                Opciones Disponibles
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe una opción y pulsa Añadir..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-1.5 outline-none focus:border-[#00F0FF]"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1.5 rounded-xl bg-[#00F0FF] text-black font-bold cursor-pointer"
                >
                  Añadir
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(formData.options || []).map((opt) => (
                  <span
                    key={opt}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] flex items-center gap-1 border border-slate-700"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt)}
                      className="text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grupo de Sección */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              Sección / Bloque de la Ficha
            </label>
            <div className="flex items-center gap-2">
              <select
                value={isNewGroup ? 'NEW' : formData.group}
                onChange={(e) => {
                  if (e.target.value === 'NEW') {
                    setIsNewGroup(true);
                  } else {
                    setIsNewGroup(false);
                    setFormData({ ...formData, group: e.target.value });
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
              >
                {existingGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="NEW">+ Crear Nueva Sección...</option>
              </select>

              {isNewGroup && (
                <input
                  type="text"
                  placeholder="Nombre de nueva sección..."
                  value={customGroup}
                  onChange={(e) => setCustomGroup(e.target.value)}
                  className="flex-1 bg-slate-900 border border-cyan-500/50 text-white rounded-xl px-3 py-2 outline-none"
                />
              )}
            </div>
          </div>

          {/* Placeholder y Texto de Ayuda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">
                Texto de Marcador de Posición (Placeholder)
              </label>
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Ej: Ingrese las indicaciones del lugar..."
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">
                Texto de Ayuda / Instrucción para la Operadora
              </label>
              <input
                type="text"
                value={formData.helpText || ''}
                onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                placeholder="Ej: Preguntar siempre si tienen referencias exactas"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
              />
            </div>
          </div>

          {/* Configuración de Exportación para el Distribuidor (Tarjeta Kanban) */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-cyan-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-xs block">
                  Exportación a Tarjeta Entregable al Distribuidor
                </span>
                <span className="text-[10px] text-slate-400">
                  ¿Este campo debe figurar en el reporte final/WhatsApp del distribuidor?
                </span>
              </div>
              <input
                type="checkbox"
                id="exportToCardToggle"
                checked={formData.exportToCard !== false}
                onChange={(e) => setFormData({ ...formData, exportToCard: e.target.checked })}
                className="w-4 h-4 accent-[#00F0FF] rounded cursor-pointer"
              />
            </div>

            {formData.exportToCard !== false && (
              <div className="space-y-1.5 pt-2 border-t border-cyan-900/30">
                <label className="text-[10px] font-mono uppercase text-cyan-300">
                  Emoji de Prefijo en la Ficha del Distribuidor
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.cardEmoji || '👉'}
                    onChange={(e) => setFormData({ ...formData, cardEmoji: e.target.value })}
                    className="w-16 bg-slate-900 border border-cyan-700/50 text-center text-base rounded-xl py-1.5 outline-none"
                  />
                  <div className="flex flex-wrap gap-1">
                    {PRESET_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, cardEmoji: emoji })}
                        className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${
                          formData.cardEmoji === emoji
                            ? 'bg-cyan-500/20 border-cyan-400 scale-110'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Requerido / Obligatorio */}
          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="w-4 h-4 accent-[#00F0FF] rounded"
              />
              <span className="text-white font-bold text-xs">
                Campo Obligatorio (No permite guardar contacto sin completar este dato)
              </span>
            </label>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#22D3EE] text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          >
            Guardar Campo
          </button>
        </div>
      </div>
    </div>
  );
}
