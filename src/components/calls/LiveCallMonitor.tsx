import React from 'react';
import { AlertCircle, Mic, PhoneOutgoing, ShieldCheck, User, X } from 'lucide-react';

interface LiveCallMonitorProps {
  activeCall?: any;
  onHangUp?: () => void;
  onTriggerTestCall?: () => void;
  className?: string;
}

export default function LiveCallMonitor({
  activeCall,
  onHangUp,
  onTriggerTestCall,
  className = ''
}: LiveCallMonitorProps) {
  if (!activeCall) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}>
        <div className="lg:col-span-8 min-h-[360px] flex flex-col items-center justify-center p-10 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center">
          <Mic className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Sin llamadas en curso</h3>
          <p className="text-sm text-slate-500 max-w-md mt-2">El monitor está esperando una llamada real. No hay métricas ni transcripción disponibles hasta conectar esas fuentes.</p>
          {onTriggerTestCall && (
            <button onClick={onTriggerTestCall} className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 text-xs font-bold">
              Simular llamada (demostración)
            </button>
          )}
        </div>
        <div className="lg:col-span-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Transcripción en vivo</h4>
          <p className="mt-3 text-sm text-slate-500">Pendiente de conexión con un servicio de transcripción.</p>
        </div>
      </div>
    );
  }

  const contact = activeCall.customer || activeCall.contactName || activeCall.contactPhone || 'Contacto no identificado';
  const agent = activeCall.agent || activeCall.agentName || 'Agente no identificado';
  const provider = activeCall.provider || activeCall.carrier || 'Proveedor no verificado';
  const duration = activeCall.duration ?? '—';

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}>
      <div className="lg:col-span-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <PhoneOutgoing className="w-7 h-7 text-cyan-500" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{contact}</h3>
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-2"><User className="w-3 h-3" /> {agent}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{duration}</p>
            <p className="text-xs text-slate-500">{provider}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
            <AlertCircle className="w-4 h-4" /> Analítica de llamada no conectada
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">No se muestran valores inventados de sentimiento, latencia, grabación ni coste. Esas métricas aparecerán cuando sus servicios estén integrados.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Sentimiento IA: No disponible', 'Latencia: No medida', 'Grabación: No verificada', 'Tarifa: No disponible'].map(label => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-500">{label}</div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button disabled className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-400 cursor-not-allowed">
            <ShieldCheck className="inline w-4 h-4 mr-2" /> Supervisión no conectada
          </button>
          {onHangUp && (
            <button onClick={onHangUp} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">
              <X className="inline w-4 h-4 mr-2" /> Terminar llamada
            </button>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Transcripción en vivo</h4>
        <p className="mt-3 text-sm text-slate-500">No hay un proveedor de transcripción conectado a esta llamada.</p>
      </div>
    </div>
  );
}
