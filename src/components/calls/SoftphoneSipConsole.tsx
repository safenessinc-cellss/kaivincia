import React from 'react';
import { ChevronDown, ChevronUp, Terminal, Activity, Trash2 } from 'lucide-react';
import { SoftphoneState } from '../../types/calls';

interface SoftphoneSipConsoleProps {
  logs: string[];
  isOpen: boolean;
  onToggle: () => void;
  onClearLogs?: () => void;
  liveLatency?: number;
  liveJitter?: number;
  callStatus?: SoftphoneState['status'];
}

export default function SoftphoneSipConsole({
  logs,
  isOpen,
  onToggle,
  onClearLogs,
  liveLatency = 24,
  liveJitter = 1.1,
  callStatus = 'idle'
}: SoftphoneSipConsoleProps) {
  return (
    <div className="pt-1">
      {/* Botón para expandir/colapsar la consola SIP */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 hover:text-cyan-400 py-1 px-3 rounded-lg hover:bg-slate-900/60 transition-all cursor-pointer"
        >
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>{isOpen ? 'Ocultar consola SIP WebRTC' : 'Mostrar consola SIP WebRTC'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {logs.length > 0 && (
            <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full font-sans">
              {logs.length}
            </span>
          )}
        </button>
      </div>

      {/* Contenido colapsable */}
      {isOpen && (
        <div className="mt-2 space-y-2 animate-fadeIn">
          {/* Telemetría en Vivo si la llamada está conectada */}
          {callStatus === 'connected' && (
            <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>Latencia: <strong className="text-white">{liveLatency}ms</strong></span>
              </span>
              <span>Jitter: <strong className="text-white">{liveJitter}ms</strong></span>
              <span>Códec: <strong className="text-emerald-400">OPUS 48kHz</strong></span>
            </div>
          )}

          {/* Caja de terminal SIP */}
          <div className="p-2.5 bg-black/95 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-400 max-h-36 overflow-y-auto space-y-1 shadow-inner scrollbar-thin">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 mb-1 text-[9px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                LOGS DE SEÑALIZACIÓN SIP & WEBRTC (Últimos 30)
              </span>
              {onClearLogs && logs.length > 0 && (
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                  title="Limpiar logs"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="text-slate-600 italic py-1">Esperando eventos de señalización SIP...</div>
            ) : (
              logs.map((log, idx) => {
                let colorClass = 'text-emerald-400';
                if (log.includes('INVITE')) colorClass = 'text-cyan-300';
                else if (log.includes('200 OK') || log.includes('ESTABLISHED')) colorClass = 'text-emerald-300 font-bold';
                else if (log.includes('BYE') || log.includes('FINALIZADA')) colorClass = 'text-amber-300';
                else if (log.includes('FORCED')) colorClass = 'text-cyan-400 font-bold';
                else if (log.includes('ERROR') || log.includes('FAIL')) colorClass = 'text-rose-400';

                return (
                  <div key={idx} className={`leading-relaxed break-words ${colorClass}`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
