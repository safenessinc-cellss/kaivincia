import { useState } from 'react';
import { AutomationRule, Condition } from '../../types/automation';
import { FIELDS_BY_AREA, ACTIONS_CATALOG, OPERATORS } from '../../config/automationCatalog';
import { evaluateRuleConditions } from '../../services/automationEngine';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Sparkles, 
  Clock, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface RuleTesterProps {
  rule: AutomationRule;
  onClose: () => void;
}

export default function RuleTester({ rule, onClose }: RuleTesterProps) {
  const fields = FIELDS_BY_AREA[rule.area] || [];

  // Inicializar payload de prueba con valores por defecto acordes al área
  const [testPayload, setTestPayload] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === 'number') initial[f.key] = 100;
      else if (f.type === 'boolean') initial[f.key] = true;
      else if (f.type === 'select' && f.options && f.options.length > 0) initial[f.key] = f.options[0].value;
      else initial[f.key] = f.key === 'mensaje_texto' || f.key === 'palabra_clave' ? 'PERFIL' : 'Ejemplo de prueba';
    });
    return initial;
  });

  const [testResult, setTestResult] = useState<{
    ran: boolean;
    conditionsMatched: boolean;
    stepDetails: { conditionId: string; field: string; operator: string; expected: any; actual: any; passed: boolean }[];
    actionsSimulated: { actionType: string; label: string; order: number; willExecute: boolean; delay: number; responsible: string }[];
  } | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    setTestPayload((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRunSimulation = () => {
    // 1. Evaluar paso a paso las condiciones sin escribir en Firestore
    const { matched, details } = evaluateRuleConditions(rule.conditions, testPayload);

    // 2. Simular qué acciones se ejecutarían
    const activeActions = rule.actions
      .filter((a) => a.isEnabled)
      .sort((a, b) => a.order - b.order);

    const simulated = activeActions.map((act) => {
      const meta = ACTIONS_CATALOG.find((m) => m.type === act.type);
      return {
        actionType: act.type,
        label: meta?.label || act.type,
        order: act.order,
        willExecute: matched,
        delay: act.delayMinutes,
        responsible: act.responsibleRole
      };
    });

    setTestResult({
      ran: true,
      conditionsMatched: matched,
      stepDetails: details,
      actionsSimulated: simulated
    });
  };

  const handleReset = () => {
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B0E14] border border-slate-800 rounded-[2.5rem] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
                  Simulador de Regla (Dry-Run Controlado)
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Sin tocar datos reales
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Regla: <strong className="text-white">{rule.name}</strong> • Disparador: <span className="text-[#00F0FF]">{rule.event}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario de Entrada Mock */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00F0FF]" />
              1. Configura los Datos Simulados del Evento
            </span>
            <button
              onClick={handleReset}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reiniciar Valores
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">
                  {f.label}
                </label>
                {f.type === 'select' && f.options ? (
                  <select
                    value={testPayload[f.key] ?? ''}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
                  >
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'boolean' ? (
                  <select
                    value={String(testPayload[f.key])}
                    onChange={(e) => handleFieldChange(f.key, e.target.value === 'true')}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
                  >
                    <option value="true">Verdadero (True / Activo)</option>
                    <option value="false">Falso (False / Inactivo)</option>
                  </select>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={testPayload[f.key] ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        f.key,
                        f.type === 'number' ? Number(e.target.value) : e.target.value
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botón Ejecutar Simulación */}
        <div className="flex justify-center">
          <button
            onClick={handleRunSimulation}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 text-black font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Simular Evaluación Paso a Paso
          </button>
        </div>

        {/* Resultado del Dry-Run */}
        {testResult && (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                2. Resultado del Análisis
              </span>
              <div
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  testResult.conditionsMatched
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {testResult.conditionsMatched ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> REGLA SE EJECUTARÍA
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> CONDICIONES NO CUMPLIDAS (IGNORADA)
                  </>
                )}
              </div>
            </div>

            {/* Desglose de Condiciones */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Evaluación de Condiciones:
              </span>
              {testResult.stepDetails.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl">
                  Sin condiciones configuradas (pasa automáticamente en 100% de los casos).
                </p>
              ) : (
                <div className="space-y-1.5">
                  {testResult.stepDetails.map((step, idx) => (
                    <div
                      key={step.conditionId || idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        step.passed
                          ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                          : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {step.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>
                          [{step.field}] {step.operator} <strong className="text-white">{JSON.stringify(step.expected)}</strong>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Valor real simulado: <span className="text-white font-bold">{JSON.stringify(step.actual)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desglose de Acciones que se Dispararían */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Acciones Encadenadas a Ejecutar:
              </span>
              <div className="space-y-1.5">
                {testResult.actionsSimulated.map((act) => (
                  <div
                    key={act.order}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      act.willExecute
                        ? 'bg-blue-950/30 border-blue-800/60 text-cyan-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-black text-[#00F0FF] text-[10px] font-mono font-bold flex items-center justify-center border border-slate-800">
                        {act.order}
                      </span>
                      <span className="font-bold">{act.label}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                      <span>Responsable: <strong className="text-white">{act.responsible}</strong></span>
                      {act.delay > 0 && <span>Espera: <strong className="text-amber-300">{act.delay} min</strong></span>}
                      <span className={act.willExecute ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                        {act.willExecute ? '✓ Se dispararía' : '✗ Descartada'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
          >
            Cerrar Simulador
          </button>
        </div>

      </div>
    </div>
  );
}
