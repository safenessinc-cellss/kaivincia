import { useState } from 'react';
import { Area, Action, ActionType, ActionFallback } from '../../types/automation';
import { ACTIONS_CATALOG, ACTIONS_BY_AREA } from '../../config/automationCatalog';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface ActionListProps {
  area: Area;
  actions: Action[];
  onChangeActions: (actions: Action[]) => void;
  disabled?: boolean;
}

export default function ActionList({
  area,
  actions,
  onChangeActions,
  disabled
}: ActionListProps) {
  const [selectedActionType, setSelectedActionType] = useState<ActionType>('crear_contacto');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const allowedActionTypes = ACTIONS_BY_AREA[area] || [];
  const availableActionMetas = ACTIONS_CATALOG.filter((a) =>
    allowedActionTypes.includes(a.type)
  );

  const handleAddAction = (type: ActionType) => {
    const meta = ACTIONS_CATALOG.find((a) => a.type === type);
    if (!meta) return;

    const newAction: Action = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      type,
      params: { ...meta.defaultParams },
      order: actions.length + 1,
      responsibleRole: 'setter',
      delayMinutes: 0,
      isEnabled: true,
      fallback: {
        type: 'enviar_notificacion_interna',
        params: { mensaje: `Fallo al ejecutar acción ${meta.label}` },
        responsibleRole: 'supervisor',
        notifySupervisor: true
      }
    };

    onChangeActions([...actions, newAction]);
    setShowAddMenu(false);
  };

  const handleRemoveAction = (id: string) => {
    const remaining = actions.filter((a) => a.id !== id);
    const reordered = remaining.map((a, idx) => ({ ...a, order: idx + 1 }));
    onChangeActions(reordered);
  };

  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === actions.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newActions = [...actions];
    const temp = newActions[index];
    newActions[index] = newActions[targetIndex];
    newActions[targetIndex] = temp;

    const reordered = newActions.map((a, idx) => ({ ...a, order: idx + 1 }));
    onChangeActions(reordered);
  };

  const handleUpdateAction = (id: string, updates: Partial<Action>) => {
    onChangeActions(
      actions.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const handleUpdateParam = (id: string, paramKey: string, value: any) => {
    onChangeActions(
      actions.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          params: {
            ...a.params,
            [paramKey]: value
          }
        };
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] flex items-center justify-center text-[10px]">3</span>
            HACER LAS SIGUIENTES ACCIONES EN ORDEN:
          </label>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Se ejecutarán secuencialmente de arriba a abajo. Puedes configurar tiempos de espera y acciones de contingencia (fallback).
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="px-3.5 py-1.5 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir Acción
        </button>
      </div>

      {/* Menú selector de acción a agregar */}
      {showAddMenu && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Selecciona la Acción para {area}:
            </span>
            <button
              type="button"
              onClick={() => setShowAddMenu(false)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableActionMetas.map((meta) => (
              <button
                key={meta.type}
                type="button"
                onClick={() => handleAddAction(meta.type)}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-[#00F0FF] hover:bg-slate-900 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-[#00F0FF]">
                      {meta.label}
                    </span>
                    {meta.pending ? (
                      <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Pendiente Conexión
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Lista
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {meta.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista ordenada de acciones configuradas */}
      {actions.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-center space-y-2">
          <p className="text-xs text-slate-400 font-medium">
            No has agregado ninguna acción a la regla todavía.
          </p>
          <p className="text-[10px] text-slate-500">
            Haz clic en <span className="text-[#00F0FF] font-bold">"Añadir Acción"</span> para encadenar tareas como crear contacto, asignar setter o enviar alertas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => {
            const meta = ACTIONS_CATALOG.find((a) => a.type === action.type);

            return (
              <div
                key={action.id}
                className={`p-4 rounded-2xl border transition-all ${
                  action.isEnabled
                    ? 'bg-slate-950/90 border-slate-800 shadow-md'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                {/* Header de la tarjeta de acción */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-950 text-[#00F0FF] border border-blue-800 text-xs font-mono font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        {meta?.label || action.type}
                        {meta?.pending && (
                          <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Requiere Configurar {meta.requiredIntegration}
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {meta?.description}
                      </p>
                    </div>
                  </div>

                  {/* Controles de orden, estado y eliminación */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={disabled || index === 0}
                      onClick={() => handleMoveAction(index, 'up')}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 cursor-pointer"
                      title="Subir orden"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled || index === actions.length - 1}
                      onClick={() => handleMoveAction(index, 'down')}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 cursor-pointer"
                      title="Bajar orden"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        handleUpdateAction(action.id, { isEnabled: !action.isEnabled })
                      }
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      title={action.isEnabled ? 'Desactivar acción' : 'Activar acción'}
                    >
                      {action.isEnabled ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleRemoveAction(action.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar acción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Parámetros específicos de la acción */}
                {meta && meta.paramFields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {meta.paramFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">
                          {field.label}
                        </label>
                        {field.type === 'select' && field.options ? (
                          <select
                            disabled={disabled || !action.isEnabled}
                            value={action.params[field.key] || ''}
                            onChange={(e) =>
                              handleUpdateParam(action.id, field.key, e.target.value)
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
                          >
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            disabled={disabled || !action.isEnabled}
                            rows={2}
                            value={action.params[field.key] || ''}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              handleUpdateParam(action.id, field.key, e.target.value)
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF] placeholder:text-slate-600"
                          />
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            disabled={disabled || !action.isEnabled}
                            value={action.params[field.key] || ''}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              handleUpdateParam(
                                action.id,
                                field.key,
                                field.type === 'number' ? Number(e.target.value) : e.target.value
                              )
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF] placeholder:text-slate-600"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Parámetros Operativos: Responsable, Tiempo de Espera y Fallback */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-black/40 border border-slate-900 text-xs">
                  {/* Rol Responsable */}
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <UserCheck className="w-3 h-3 text-[#00F0FF]" />
                      Rol Responsable
                    </label>
                    <select
                      disabled={disabled || !action.isEnabled}
                      value={action.responsibleRole}
                      onChange={(e) =>
                        handleUpdateAction(action.id, { responsibleRole: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00F0FF]"
                    >
                      <option value="setter">Setter Telefónico (TLMK)</option>
                      <option value="closer">Closer de Ventas</option>
                      <option value="gestor">Gestor de Operaciones</option>
                      <option value="admin">Administrador</option>
                      <option value="tutor">Tutor Académico</option>
                      <option value="supervisor">Supervisor General</option>
                    </select>
                  </div>

                  {/* Tiempo de Espera (Delay) */}
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Espera Previa
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        disabled={disabled || !action.isEnabled}
                        value={action.delayMinutes}
                        onChange={(e) =>
                          handleUpdateAction(action.id, {
                            delayMinutes: Math.max(0, parseInt(e.target.value) || 0)
                          })
                        }
                        className="w-20 bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00F0FF]"
                      />
                      <span className="text-[10px] text-slate-500">minutos (0 = Inmediato)</span>
                    </div>
                  </div>

                  {/* Fallback de Contingencia */}
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      Plan Si Falla (Fallback)
                    </label>
                    <select
                      disabled={disabled || !action.isEnabled}
                      value={action.fallback?.type || 'enviar_notificacion_interna'}
                      onChange={(e) =>
                        handleUpdateAction(action.id, {
                          fallback: {
                            type: e.target.value as ActionType,
                            params: { mensaje: 'Alerta: Fallo en acción de automatización' },
                            responsibleRole: 'supervisor',
                            notifySupervisor: true
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 text-rose-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-rose-500 font-medium"
                    >
                      <option value="enviar_notificacion_interna">Notificar a Supervisor</option>
                      <option value="crear_tarea">Crear Tarea de Rescate Manual</option>
                      <option value="alertar_supervisor">Escalar a Seguridad CISO</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
