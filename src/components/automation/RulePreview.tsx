import { Area, EventKey, Condition, Action } from '../../types/automation';
import { 
  AREAS, 
  EVENTS_BY_AREA, 
  FIELDS_BY_AREA, 
  OPERATORS, 
  ACTIONS_CATALOG 
} from '../../config/automationCatalog';
import { Sparkles, ArrowRight, CheckCircle2, Sliders } from 'lucide-react';

interface RulePreviewProps {
  area: Area;
  event: EventKey;
  conditions: Condition[];
  actions: Action[];
  ruleName?: string;
}

export default function RulePreview({
  area,
  event,
  conditions,
  actions,
  ruleName
}: RulePreviewProps) {
  const areaMeta = AREAS.find((a) => a.id === area);
  const eventMeta = EVENTS_BY_AREA[area]?.find((e) => e.key === event);
  const fields = FIELDS_BY_AREA[area] || [];

  // 1. Traducción del evento a lenguaje natural
  const eventPhrase = eventMeta?.label || event;

  // 2. Traducción de las condiciones
  let conditionsPhrase = 'en todos los casos (sin restricciones)';
  if (conditions.length > 0) {
    const parts = conditions.map((cond, idx) => {
      const fieldDef = fields.find((f) => f.key === cond.field);
      const opMeta = OPERATORS.find((o) => o.key === cond.operator);
      const fieldLabel = fieldDef?.label || cond.field;
      const opLabel = opMeta?.label || cond.operator;
      const valStr = ['is_empty', 'is_not_empty'].includes(cond.operator)
        ? ''
        : `"${cond.value}"`;

      const logicPrefix = idx > 0 ? (cond.logic === 'AND' ? ' y ' : ' o ') : '';
      return `${logicPrefix}${fieldLabel} ${opLabel} ${valStr}`.trim();
    });

    conditionsPhrase = parts.join(' ');
  }

  // 3. Traducción de las acciones
  let actionsPhrase = 'ninguna acción definida';
  const activeActions = actions.filter((a) => a.isEnabled);
  if (activeActions.length > 0) {
    const actionParts = activeActions.map((act) => {
      const meta = ACTIONS_CATALOG.find((m) => m.type === act.type);
      const label = meta?.label || act.type;
      const delayStr = act.delayMinutes > 0 ? ` (tras ${act.delayMinutes} min de espera)` : '';
      const respStr = act.responsibleRole ? ` asignado a [${act.responsibleRole}]` : '';
      return `${label}${delayStr}${respStr}`;
    });

    if (actionParts.length === 1) {
      actionsPhrase = actionParts[0];
    } else {
      const last = actionParts.pop();
      actionsPhrase = `${actionParts.join(', ')} y ${last}`;
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border border-[#00F0FF]/30 shadow-xl space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F0FF]">
          <Sparkles className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          Explicación en Lenguaje Natural (Regla Humana)
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300">
          Área: {areaMeta?.name}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-black/60 border border-slate-800/80 text-sm leading-relaxed text-slate-200">
        <p>
          <span className="font-mono font-bold text-amber-400 uppercase">Cuando </span>
          <span className="font-semibold text-white underline decoration-amber-400/40 underline-offset-4">
            {eventPhrase}
          </span>
          {', '}
          <span className="font-mono font-bold text-emerald-400 uppercase">si </span>
          <span className="font-semibold text-emerald-300">
            {conditionsPhrase}
          </span>
          {', '}
          <span className="font-mono font-bold text-[#00F0FF] uppercase">entonces </span>
          <span className="font-semibold text-cyan-200">
            {actionsPhrase}.
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Disparador: <strong className="text-white">{event}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
          <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Condiciones: <strong className="text-white">{conditions.length} activas</strong></span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
          <ArrowRight className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
          <span>Acciones: <strong className="text-white">{activeActions.length} en cadena</strong></span>
        </div>
      </div>
    </div>
  );
}
