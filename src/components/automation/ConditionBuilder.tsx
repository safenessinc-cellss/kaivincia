import { Area, Condition, ConditionOperator } from '../../types/automation';
import { FIELDS_BY_AREA, OPERATORS } from '../../config/automationCatalog';
import { Plus, Trash2, SlidersHorizontal, Info } from 'lucide-react';

interface ConditionBuilderProps {
  area: Area;
  conditions: Condition[];
  onChangeConditions: (conditions: Condition[]) => void;
  disabled?: boolean;
}

export default function ConditionBuilder({
  area,
  conditions,
  onChangeConditions,
  disabled
}: ConditionBuilderProps) {
  const availableFields = FIELDS_BY_AREA[area] || [];

  const handleAddCondition = () => {
    const firstField = availableFields[0]?.key || 'mensaje_texto';
    const newCond: Condition = {
      id: 'cond_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      field: firstField,
      operator: 'equals',
      value: '',
      logic: conditions.length > 0 ? 'AND' : 'AND'
    };
    onChangeConditions([...conditions, newCond]);
  };

  const handleRemoveCondition = (id: string) => {
    onChangeConditions(conditions.filter((c) => c.id !== id));
  };

  const handleUpdateCondition = (id: string, updates: Partial<Condition>) => {
    onChangeConditions(
      conditions.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates };

        // Si cambió el campo, ajustar operador por defecto compatible
        if (updates.field && updates.field !== c.field) {
          const fieldDef = availableFields.find((f) => f.key === updates.field);
          if (fieldDef?.type === 'number') {
            updated.operator = 'greater_than';
            updated.value = 0;
          } else if (fieldDef?.type === 'boolean') {
            updated.operator = 'equals';
            updated.value = 'true';
          } else {
            updated.operator = 'contains';
            updated.value = '';
          }
        }
        return updated;
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px]">2</span>
            SI SE CUMPLE(N) LA(S) SIGUIENTE(S) CONDICIÓN(ES):
          </label>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Filtra de manera exacta qué eventos dispararán las acciones. Si no agregas condiciones, la regla se ejecutará para todos los eventos del área.
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={handleAddCondition}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir Condición
        </button>
      </div>

      {conditions.length === 0 ? (
        <div className="p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Sin condiciones configuradas (Disparar siempre para este evento).
          </p>
          <p className="text-[10px] text-slate-500">
            Haz clic en <span className="text-emerald-400 font-bold">"Añadir Condición"</span> para filtrar por contenido del mensaje, monto, origen o puntaje.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((cond, index) => {
            const fieldDef = availableFields.find((f) => f.key === cond.field);
            const applicableOperators = OPERATORS.filter(
              (op) => !fieldDef || op.applicableTypes.includes(fieldDef.type)
            );

            return (
              <div
                key={cond.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3 relative group"
              >
                {/* Conector lógico AND / OR para condiciones sucesivas */}
                {index > 0 ? (
                  <select
                    value={cond.logic}
                    disabled={disabled}
                    onChange={(e) =>
                      handleUpdateCondition(cond.id, { logic: e.target.value as 'AND' | 'OR' })
                    }
                    className="bg-blue-950/80 border border-blue-800 text-[#00F0FF] text-[10px] font-mono font-bold rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-[#00F0FF]"
                  >
                    <option value="AND">Y (AND)</option>
                    <option value="OR">O (OR)</option>
                  </select>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-2 bg-emerald-950/40 rounded-lg border border-emerald-800/60 shrink-0 text-center">
                    SI
                  </span>
                )}

                {/* Selector de Campo */}
                <div className="flex-1 min-w-[160px]">
                  <select
                    value={cond.field}
                    disabled={disabled}
                    onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF] transition-all font-medium"
                  >
                    {availableFields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Operador */}
                <div className="w-full md:w-44">
                  <select
                    value={cond.operator}
                    disabled={disabled}
                    onChange={(e) =>
                      handleUpdateCondition(cond.id, {
                        operator: e.target.value as ConditionOperator
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-amber-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF] transition-all font-mono"
                  >
                    {applicableOperators.map((op) => (
                      <option key={op.key} value={op.key}>
                        {op.label} [{op.symbol}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input de Valor según el tipo del campo */}
                {!['is_empty', 'is_not_empty'].includes(cond.operator) && (
                  <div className="flex-1 min-w-[160px]">
                    {fieldDef?.type === 'select' && fieldDef.options ? (
                      <select
                        value={String(cond.value)}
                        disabled={disabled}
                        onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
                      >
                        <option value="">-- Seleccionar Opción --</option>
                        {fieldDef.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : fieldDef?.type === 'boolean' ? (
                      <select
                        value={String(cond.value)}
                        disabled={disabled}
                        onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
                      >
                        <option value="true">Verdadero (Sí / Activo)</option>
                        <option value="false">Falso (No / Inactivo)</option>
                      </select>
                    ) : (
                      <input
                        type={fieldDef?.type === 'number' ? 'number' : 'text'}
                        value={String(cond.value)}
                        disabled={disabled}
                        placeholder={fieldDef?.placeholder || 'Valor a comparar (ej: PERFIL)'}
                        onChange={(e) =>
                          handleUpdateCondition(cond.id, {
                            value: fieldDef?.type === 'number' ? Number(e.target.value) : e.target.value
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF] placeholder:text-slate-600 font-medium"
                      />
                    )}
                  </div>
                )}

                {/* Botón eliminar condición */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemoveCondition(cond.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors self-end md:self-center cursor-pointer"
                  title="Eliminar Condición"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {conditions.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
          <Info className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
          <span>
            Las comparaciones de texto no distinguen entre mayúsculas y minúsculas (ej: <code className="text-[#00F0FF]">perfil</code> coincide con <code className="text-[#00F0FF]">PERFIL</code>).
          </span>
        </div>
      )}
    </div>
  );
}
