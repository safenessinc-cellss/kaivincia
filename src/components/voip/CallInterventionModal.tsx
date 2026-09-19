import React, { useState } from 'react';
import { X, Headphones, Ear, MessageSquare, PhoneOff, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeCall: any;
  onIntervene: (mode: 'whisper' | 'spy' | 'barge' | 'hangup') => void;
}

export default function CallInterventionModal({ isOpen, onClose, activeCall, onIntervene }: Props) {
  const [selectedMode, setSelectedMode] = useState<'whisper' | 'spy' | 'barge' | 'hangup' | null>(null);

  if (!isOpen || !activeCall) return null;

  const handleApply = (mode: 'whisper' | 'spy' | 'barge' | 'hangup') => {
    setSelectedMode(mode);
    onIntervene(mode);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0D121D] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Intervención de Supervisor VoIP</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {activeCall.customer} • Agente: {activeCall.agent}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-400 mb-2">
            Selecciona el nivel de supervisión en vivo para ingresar al canal de voz WebRTC:
          </p>

          {/* Mode 1: Whisper */}
          <button
            onClick={() => handleApply('whisper')}
            className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500 text-left transition-all group cursor-pointer flex items-start gap-3"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-colors">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Modo Whisper (Susurrar)</span>
                <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Recomendado</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Hablas exclusivamente con el agente para orientarlo en el cierre sin que el cliente te escuche.
              </p>
            </div>
          </button>

          {/* Mode 2: Spy / Silent monitoring */}
          <button
            onClick={() => handleApply('spy')}
            className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500 text-left transition-all group cursor-pointer flex items-start gap-3"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              <Ear className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Modo Spy (Escucha Silenciosa)</span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Auditoría</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Monitorea el audio en alta fidelidad de forma 100% invisible para ambas partes.
              </p>
            </div>
          </button>

          {/* Mode 3: Barge-in / 3-way call */}
          <button
            onClick={() => handleApply('barge')}
            className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500 text-left transition-all group cursor-pointer flex items-start gap-3"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Modo Barge-in (Tripartita)</span>
                <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Conferencia</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Ingresas activamente a la conversación para hablar con el agente y el cliente al mismo tiempo.
              </p>
            </div>
          </button>

          {/* Mode 4: Force Hangup */}
          <button
            onClick={() => handleApply('hangup')}
            className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500 text-left transition-all group cursor-pointer flex items-start gap-3"
          >
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <PhoneOff className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Cortar / Finalizar Llamada</span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Envía comando SIP BYE inmediato para terminar la llamada en el carrier.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
