import { useState } from 'react';
import { 
  Area, 
  EventKey, 
  Condition, 
  Action, 
  AutomationRule 
} from '../../types/automation';
import { EVENTS_BY_AREA } from '../../config/automationCatalog';
import AreaSelector from './AreaSelector';
import EventSelector from './EventSelector';
import ConditionBuilder from './ConditionBuilder';
import ActionList from './ActionList';
import RulePreview from './RulePreview';
import { 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Layers, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

interface RuleBuilderProps {
  initialRule?: AutomationRule | null;
  currentUserId: string;
  currentUserName?: string;
  onSaveRule: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  canApprove?: boolean;
}

export default function RuleBuilder({
  initialRule,
  currentUserId,
  currentUserName,
  onSaveRule,
  onCancel,
  canApprove = false
}: RuleBuilderProps) {
  // Estados principales del constructor
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [area, setArea] = useState<Area>(initialRule?.area || 'Marketing');
  const [event, setEvent] = useState<EventKey>(
    initialRule?.event || EVENTS_BY_AREA['Marketing'][0].key
  );
  const [conditions, setConditions] = useState<Condition[]>(initialRule?.conditions || []);
  const [actions, setActions] = useState<Action[]>(initialRule?.actions || []);
  const [isActive, setIsActive] = useState<boolean>(initialRule?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Al cambiar de área, inicializar evento y limpiar condiciones incompatibles
  const handleAreaChange = (newArea: Area) => {
    setArea(newArea);
    const firstEvent = EVENTS_BY_AREA[newArea][0]?.key || ('NUEVO_LEAD_WEB' as EventKey);
    setEvent(firstEvent);
    setConditions([]);
  };

  const handleNextStep = () => {
    setValidationError(null);
    if (currentStep === 1) {
      if (!name.trim()) {
        setValidationError('Por favor asigna un nombre descriptivo a la automatización.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('El nombre de la regla es obligatorio.');
      setCurrentStep(1);
      return;
    }

    if (actions.length === 0) {
      setValidationError('Debes agregar al menos una acción a ejecutar.');
      setCurrentStep(3);
      return;
    }

    setIsSaving(true);
    try {
      await onSaveRule({
        name: name.trim(),
        description: description.trim(),
        area,
        event,
        conditions,
        actions,
        isActive,
        isApproved: canApprove ? true : (initialRule?.isApproved ?? false),
        approvedBy: canApprove ? currentUserId : initialRule?.approvedBy,
        approvedAt: canApprove ? new Date().toISOString() : initialRule?.approvedAt,
        createdBy: initialRule?.createdBy || currentUserId,
        createdByName: initialRule?.createdByName || currentUserName || 'Operador',
        executionCount: initialRule?.executionCount || 0,
        failureCount: initialRule?.failureCount || 0
      });
    } catch (err: any) {
      setValidationError(err?.message || 'Error al guardar la regla en Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#0B0E14] border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
      {/* Header del Modal Constructor */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                {initialRule ? 'Editar Flujo de Automatización' : 'Diseñador Visual de Regla'}
              </h2>
              <p className="text-xs text-slate-400">
                Estructura de proceso natural: <span className="text-white font-bold">«Cuando ocurra [Evento], si se cumple [Condición], hacer [Acciones]»</span>
              </p>
            </div>
          </div>
        </div>

        {/* Pasos Visuales (Stepper) */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentStep === 1
                ? 'bg-[#00F0FF] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Evento
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentStep === 2
                ? 'bg-[#00F0FF] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Condiciones
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentStep === 3
                ? 'bg-[#00F0FF] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Acciones
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Contenido según el paso activo */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Nombre y Descripción */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                  Nombre de la Automatización *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lead de Instagram con palabra PERFIL a Setter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                  Estado Inicial
                </label>
                <div className="flex items-center gap-3 h-10">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    {isActive ? 'Activa' : 'Inactiva / Pausada'}
                  </button>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                  Descripción Operativa (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Explica a qué proceso responde esta regla (ej: Calificación de leads de campaña Meta Ads Q3)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>

            {/* Selector de Área */}
            <AreaSelector
              selectedArea={area}
              onSelectArea={handleAreaChange}
            />

            {/* Selector de Evento */}
            <EventSelector
              area={area}
              selectedEvent={event}
              onSelectEvent={setEvent}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ConditionBuilder
              area={area}
              conditions={conditions}
              onChangeConditions={setConditions}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ActionList
              area={area}
              actions={actions}
              onChangeActions={setActions}
            />

            {/* Vista Previa reactiva en lenguaje natural */}
            <RulePreview
              area={area}
              event={event}
              conditions={conditions}
              actions={actions}
              ruleName={name}
            />
          </div>
        )}

        {/* Footer con Navegación y Acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-800">
          <div>
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all"
            >
              Cancelar
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#22D3EE] text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-[#00F0FF] hover:opacity-90 text-black text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'Guardando...' : initialRule ? 'Actualizar Regla' : 'Guardar y Activar Regla'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
