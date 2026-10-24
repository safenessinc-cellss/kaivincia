import { Area, EventKey } from '../../types/automation';
import { EVENTS_BY_AREA } from '../../config/automationCatalog';
import { Zap, AlertCircle } from 'lucide-react';

interface EventSelectorProps {
  area: Area;
  selectedEvent: EventKey;
  onSelectEvent: (event: EventKey) => void;
  disabled?: boolean;
}

export default function EventSelector({
  area,
  selectedEvent,
  onSelectEvent,
  disabled
}: EventSelectorProps) {
  const events = EVENTS_BY_AREA[area] || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] flex items-center justify-center text-[10px]">
            <Zap className="w-3 h-3" />
          </span>
          ¿CUÁNDO OCURRA QUÉ EVENTO DISPARADOR?
        </label>
        <span className="text-[10px] text-gray-400 font-mono">
          {events.length} eventos disponibles en {area}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {events.map((evt) => {
          const isSelected = selectedEvent === evt.key;

          return (
            <button
              key={evt.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectEvent(evt.key)}
              className={`p-4 rounded-2xl border text-left transition-all relative group cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-950/70 to-slate-900 border-[#00F0FF] ring-2 ring-[#00F0FF]/30 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors leading-snug">
                  {evt.label}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 shrink-0">
                  {evt.key}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                {evt.description}
              </p>

              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 bg-black/40 px-2 py-1 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Datos recibidos:</span>
                <span className="truncate text-slate-300">{evt.samplePayloadSummary}</span>
              </div>
            </button>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-slate-500 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          No se detectan eventos configurados para esta área seleccionada.
        </div>
      )}
    </div>
  );
}
