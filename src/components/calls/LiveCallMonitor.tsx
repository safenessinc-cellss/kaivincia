import React, { useState } from 'react';
import { 
  PhoneOutgoing, 
  PhoneIncoming, 
  User, 
  ShieldCheck, 
  Radio, 
  X, 
  Activity, 
  Mic, 
  Sparkles, 
  PlayCircle, 
  BrainCircuit, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';

interface LiveCallMonitorProps {
  activeCall?: any;
  onHangUp?: () => void;
  onTriggerTestCall?: () => void;
  className?: string;
}

const DUMMY_SENTIMENT_DATA = [
  { time: '00:10', score: 65 },
  { time: '00:30', score: 72 },
  { time: '00:50', score: 68 },
  { time: '01:10', score: 85 },
  { time: '01:30', score: 88 },
  { time: '01:50', score: 82 },
  { time: '02:10', score: 91 },
  { time: '02:30', score: 94 },
];

export default function LiveCallMonitor({
  activeCall,
  onHangUp,
  onTriggerTestCall,
  className = ''
}: LiveCallMonitorProps) {
  const { t } = useLanguage();

  const [supervisionMode, setSupervisionMode] = useState<'spy' | 'whisper' | 'barge' | null>(null);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(true);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}>
      {/* Columna Izquierda: Panel de Llamada Activa */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {activeCall ? (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 animate-pulse" />
            
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-cyan-50 dark:bg-cyan-950/40 rounded-2xl flex items-center justify-center text-cyan-500 relative">
                  <PhoneOutgoing className="w-8 h-8" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    {activeCall.customer || '+1 (323) 555-0144'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                    <User className="w-3 h-3" /> Agente: <span className="text-cyan-500">{activeCall.agent || 'Marta García'}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-mono font-black text-slate-900 dark:text-white">{activeCall.duration || '01:45'}</p>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{activeCall.provider || 'Zadarma SIP'}</span>
              </div>
            </div>

            {/* Onda de Audio Dinámica */}
            <div className="bg-slate-950 rounded-3xl p-8 mb-6 relative overflow-hidden group">
              {supervisionMode && (
                <div className="absolute top-4 left-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[8px] font-black uppercase tracking-widest animate-pulse">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Supervisión Activa: Modo {supervisionMode.toUpperCase()}
                  <button 
                    onClick={() => setSupervisionMode(null)} 
                    className="ml-1 text-white hover:text-red-400 underline font-mono cursor-pointer"
                  >
                    [Salir]
                  </button>
                </div>
              )}

              <div className="flex items-end justify-between gap-1 h-28 pt-6">
                {Array.from({ length: 36 }).map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [10, Math.random() * 70 + 15, 10] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.04 }}
                    className="w-full bg-cyan-500/60 rounded-full"
                  />
                ))}
              </div>

              <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setIsInterventionModalOpen(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-xl text-[9px] uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Radio className="w-4 h-4" /> Intervenir (Whisper / Spy / Barge)
                </button>
                <button 
                  onClick={onHangUp}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-[9px] uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <X className="w-4 h-4" /> Terminar Llamada
                </button>
              </div>
            </div>

            {/* Estadísticas de la Sesión en Vivo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sentimiento IA</p>
                <span className="text-xs font-black uppercase text-emerald-500">Positivo (88%)</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Latencia / Jitter</p>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">24ms (1.1ms)</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grabación</p>
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  REC Activo
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tarifa Estimada</p>
                <p className="text-xs font-mono font-bold text-emerald-500">$0.018 USD</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center">
            <Mic className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
              Sin llamadas en curso
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              El motor de monitoreo está en espera. Cuando un agente inicie o reciba una llamada, se desplegará el análisis en vivo aquí.
            </p>
            {onTriggerTestCall && (
              <button
                onClick={onTriggerTestCall}
                className="mt-5 px-5 py-2.5 bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-400 text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <PhoneOutgoing className="w-4 h-4" /> Simular Llamada en Vivo
              </button>
            )}
          </div>
        )}

        {/* Gráfico de Evolución de Sentimiento */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-500" />
                <span>Evolución de Tono y Sentimiento (IA)</span>
              </h4>
              <p className="text-[10px] text-slate-400">Detección acústica y de palabras clave en tiempo real</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
              Tendencia Favorable
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DUMMY_SENTIMENT_DATA}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '11px' }} />
                <Area type="monotone" dataKey="score" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#sentimentGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Transcripción en Vivo */}
      <div className="lg:col-span-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-full min-h-[500px]">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Transcripción en Tiempo Real
              </h4>
            </div>
            <span className="text-[9px] font-mono text-emerald-500 font-bold animate-pulse">
              ● STREAMING
            </span>
          </div>

          <div className="flex-1 py-4 space-y-3 overflow-y-auto text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] font-black uppercase text-cyan-500 block">Agente (00:15)</span>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                "Buenas tardes, le contacto de Kaivincia para revisar la propuesta de implementación de telefonía corporativa."
              </p>
            </div>

            <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-2xl border border-cyan-200/50 dark:border-cyan-900/40">
              <span className="text-[9px] font-black uppercase text-blue-500 block">Cliente (00:28)</span>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                "Hola Marta, sí, justo estábamos analizando la compatibilidad con nuestras líneas SIP en Europa."
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] font-black uppercase text-cyan-500 block">Agente (00:45)</span>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                "Excelente, contamos con troncales redundantes mediante Zadarma y Telnyx que garantizan latencias inferiores a 30ms."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Intervención de Supervisor */}
      <AnimatePresence>
        {isInterventionModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 text-white border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsInterventionModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 pb-4 border-b border-slate-900">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black uppercase tracking-tight italic">
                    Modo de Supervisión Telefónica
                  </h4>
                  <p className="text-xs text-slate-400">Selecciona el nivel de intervención en la llamada</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {/* Modo Spy */}
                <button
                  type="button"
                  onClick={() => { setSupervisionMode('spy'); setIsInterventionModalOpen(false); }}
                  className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-cyan-400">
                      1. Modo Espía (Spy / Listen Only)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      Silencioso
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Escuchas la llamada sin que el agente ni el cliente sepan que estás en la sala.
                  </p>
                </button>

                {/* Modo Whisper */}
                <button
                  type="button"
                  onClick={() => { setSupervisionMode('whisper'); setIsInterventionModalOpen(false); }}
                  className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-amber-400">
                      2. Susurrador (Whisper / Coaching)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      Solo Agente
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Solo tu agente te escucha para que puedas darle soporte o coaching en vivo. El cliente no te escucha.
                  </p>
                </button>

                {/* Modo Barge */}
                <button
                  type="button"
                  onClick={() => { setSupervisionMode('barge'); setIsInterventionModalOpen(false); }}
                  className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-rose-400">
                      3. Conferencia Total (Barge In)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                      Tripartita
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Te incorporas directamente a la conversación con audio bidireccional para ambos participantes.
                  </p>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
