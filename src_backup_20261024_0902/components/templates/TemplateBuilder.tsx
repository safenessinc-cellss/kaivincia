import { useState, useMemo } from 'react';
import { 
  FormTemplate, 
  TemplateField, 
  DEFAULT_DISTRIBUTOR_APPOINTMENT_TEMPLATE, 
  SYSTEM_FIXED_FIELDS 
} from '../../types/templates';
import FieldEditor from './FieldEditor';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  MoveUp, 
  MoveDown, 
  Save, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Lock, 
  HelpCircle, 
  MapPin, 
  Tag, 
  CheckSquare, 
  Share2 
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface TemplateBuilderProps {
  initialTemplate?: FormTemplate;
  currentUserEmail?: string;
  onSaved?: (template: FormTemplate) => void;
  onOpenPreview?: (template: FormTemplate) => void;
}

export default function TemplateBuilder({
  initialTemplate,
  currentUserEmail,
  onSaved,
  onOpenPreview
}: TemplateBuilderProps) {
  const [template, setTemplate] = useState<FormTemplate>(
    initialTemplate || DEFAULT_DISTRIBUTOR_APPOINTMENT_TEMPLATE
  );

  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Agrupar campos por sección
  const groupedFields = useMemo(() => {
    const groups: Record<string, TemplateField[]> = {};
    // Ordenar campos por order
    const sorted = [...template.fields].sort((a, b) => a.order - b.order);

    sorted.forEach((field) => {
      const g = field.group || 'Datos Generales';
      if (!groups[g]) groups[g] = [];
      groups[g].push(field);
    });
    return groups;
  }, [template.fields]);

  const existingGroups = useMemo(() => {
    const set = new Set(template.fields.map((f) => f.group || 'Datos Generales'));
    return Array.from(set);
  }, [template.fields]);

  // Manejador para abrir editor de nuevo campo
  const handleAddNewField = (groupName?: string) => {
    setEditingField(null);
    setIsEditorOpen(true);
  };

  // Manejador para guardar campo editado o nuevo
  const handleSaveField = (savedField: TemplateField) => {
    const existingIndex = template.fields.findIndex((f) => f.id === savedField.id);
    let updatedFields: TemplateField[];

    if (existingIndex >= 0) {
      updatedFields = [...template.fields];
      updatedFields[existingIndex] = savedField;
    } else {
      const nextOrder = template.fields.length > 0
        ? Math.max(...template.fields.map((f) => f.order)) + 1
        : 1;
      updatedFields = [...template.fields, { ...savedField, order: nextOrder }];
    }

    setTemplate({
      ...template,
      fields: updatedFields,
      updatedAt: new Date().toISOString()
    });
  };

  // Eliminar campo (solo si no es del sistema)
  const handleDeleteField = (fieldId: string) => {
    const target = template.fields.find((f) => f.id === fieldId);
    if (target?.isSystemFixed) {
      alert('Los campos base del sistema no pueden ser eliminados para mantener la integridad del CRM.');
      return;
    }

    if (confirm(`¿Eliminar el campo "${target?.label}" de la plantilla?`)) {
      setTemplate({
        ...template,
        fields: template.fields.filter((f) => f.id !== fieldId),
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Mover campo hacia arriba o abajo
  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const sorted = [...template.fields].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((f) => f.id === fieldId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index - 1].order;
      sorted[index - 1].order = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index + 1].order;
      sorted[index + 1].order = temp;
    }

    setTemplate({
      ...template,
      fields: sorted,
      updatedAt: new Date().toISOString()
    });
  };

  // Guardar plantilla en Firestore con registro de auditoría
  const handleSaveTemplate = async () => {
    if (!template.name.trim()) {
      setErrorMsg('Por favor especifica un nombre para la plantilla.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const templateId = template.id || `template_${Date.now()}`;
      const payload: FormTemplate = {
        ...template,
        id: templateId,
        version: (template.version || 1) + 1,
        updatedAt: new Date().toISOString(),
        createdBy: currentUserEmail || template.createdBy || 'Admin'
      };

      // 1. Guardar documento en Firestore
      const docRef = doc(db, 'form_templates', templateId);
      await setDoc(docRef, {
        ...payload,
        firestoreUpdatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Registrar en audit_logs
      await addDoc(collection(db, 'audit_logs'), {
        action: 'UPDATE_FORM_TEMPLATE',
        category: 'ACCESS',
        userEmail: currentUserEmail || 'admin@kaivincia.com',
        targetId: templateId,
        targetName: template.name,
        operationType: template.operationType,
        fieldsCount: template.fields.length,
        version: payload.version,
        result: 'SUCCESS',
        timestamp: serverTimestamp()
      });

      setTemplate(payload);
      setSaveSuccess(true);
      if (onSaved) onSaved(payload);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving form template:', err);
      setErrorMsg(`Error al guardar la plantilla: ${err?.message || 'Error de conexión'}`);
    } finally {
      setSaving(false);
    }
  };

  // Cargar valores predeterminados
  const handleResetToDefault = () => {
    if (confirm('¿Restablecer esta plantilla con la configuración por defecto de Cita para Distribuidor?')) {
      setTemplate({
        ...DEFAULT_DISTRIBUTOR_APPOINTMENT_TEMPLATE,
        id: template.id || `template_${Date.now()}`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Éxito o Error */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Plantilla guardada con éxito en Firestore (Versión {template.version}). Los contactos vinculados adoptarán estos campos automáticamente.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Configuración de Encabezado de Plantilla */}
      <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-widest font-bold block mb-1">
              Diseñador de Fichas Dinámicas (Estilo Bitrix24 / HubSpot)
            </span>
            <h2 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#00F0FF]" />
              {template.name || 'Nueva Plantilla'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer transition-all"
              title="Restablecer valores originales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer
            </button>

            {onOpenPreview && (
              <button
                type="button"
                onClick={() => onOpenPreview(template)}
                className="px-3.5 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 text-xs font-bold border border-cyan-800/60 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                Previsualizar Ficha
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveTemplate}
              className="px-5 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#22D3EE] text-black text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Plantilla'}
            </button>
          </div>
        </div>

        {/* Campos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              Nombre de la Plantilla <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              placeholder="Ej: Cita Entregable al Distribuidor"
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              Tipo de Operación Comercial
            </label>
            <select
              value={template.operationType}
              onChange={(e) => setTemplate({ ...template, operationType: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
            >
              <option value="cita_distribuidor">Cita para Distribuidor (Visitas en Terreno)</option>
              <option value="prospeccion_tlmk">Prospección TLMK / Llamadas Frías</option>
              <option value="onboarding_cliente">Onboarding y Cierre Comercial</option>
              <option value="soporte_garantia">Soporte Técnico / Garantías</option>
              <option value="cobranza">Cobranza y Acuerdos de Pago</option>
              <option value="custom">Operación Personalizada</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              Encabezado de la Tarjeta Entregable (WhatsApp/Kanban)
            </label>
            <input
              type="text"
              value={template.exportCardHeader || ''}
              onChange={(e) => setTemplate({ ...template, exportCardHeader: e.target.value })}
              placeholder="Ej: 📍 CITA – Seguimiento de Lead"
              className="w-full bg-slate-900 border border-slate-800 text-white font-mono rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
            />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="text-[10px] font-mono uppercase text-slate-400">
            Descripción y Propósito Operativo
          </label>
          <input
            type="text"
            value={template.description}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            placeholder="Describe para qué proyectos o equipos está destinada esta plantilla..."
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
          />
        </div>
      </div>

      {/* Árbol de Secciones y Campos de la Ficha */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#00F0FF]" />
            Estructura de Secciones y Campos ({template.fields.length} campos totales)
          </h3>

          <button
            type="button"
            onClick={() => handleAddNewField()}
            className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Añadir Campo Personalizado
          </button>
        </div>

        {Object.entries(groupedFields).map(([groupName, fields]) => (
          <div
            key={groupName}
            className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-lg"
          >
            {/* Cabecera de la Sección */}
            <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                <span className="font-bold text-white text-xs uppercase tracking-wide">
                  {groupName}
                </span>
                <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-md bg-black/40">
                  {fields.length} {fields.length === 1 ? 'campo' : 'campos'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingField({
                    id: `field_${Date.now()}`,
                    label: '',
                    key: '',
                    type: 'text',
                    required: false,
                    isSystemFixed: false,
                    group: groupName,
                    order: template.fields.length + 1,
                    exportToCard: true,
                    cardEmoji: '👉'
                  });
                  setIsEditorOpen(true);
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar a esta sección
              </button>
            </div>

            {/* Lista de Campos */}
            <div className="divide-y divide-slate-800/50">
              {fields.map((f, idx) => (
                <div
                  key={f.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Emoji de tarjeta */}
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm shadow-inner shrink-0">
                      {f.cardEmoji || '•'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{f.label}</span>
                        {f.required && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Requerido
                          </span>
                        )}
                        {f.isSystemFixed ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Sistema
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/40 text-cyan-400 border border-cyan-800/30">
                            Personalizado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>Clave: <strong className="text-slate-300">{f.key}</strong></span>
                        <span>•</span>
                        <span>Tipo: <strong className="text-cyan-300 uppercase">{f.type}</strong></span>
                        {f.exportToCard && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Share2 className="w-2.5 h-2.5" /> Incluido en Tarjeta Distribuidor
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Controles de Reordenamiento y Edición */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveField(f.id, 'up')}
                      className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                      title="Subir posición"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveField(f.id, 'down')}
                      className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                      title="Bajar posición"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingField(f);
                        setIsEditorOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-[#00F0FF] border border-slate-800 cursor-pointer"
                      title="Editar configuración del campo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {!f.isSystemFixed && (
                      <button
                        type="button"
                        onClick={() => handleDeleteField(f.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer"
                        title="Eliminar campo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Editor de Campo */}
      <FieldEditor
        field={editingField}
        existingGroups={existingGroups}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveField}
      />
    </div>
  );
}
