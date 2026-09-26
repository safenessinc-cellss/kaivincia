import React from 'react';
import { Delete, Clock, Zap, Activity } from 'lucide-react';
import { SoftphoneState } from '../../types/calls';
import { useLanguage } from '../../contexts/LanguageContext';

interface SoftphoneDisplayProps {
  phoneNumber: string;
  onBackspace: () => void;
  onClear?: () => void;
  callStatus: SoftphoneState['status'];
  duration: number;
  onForceConnect?: () => void;
  compact?: boolean;
}

export default function SoftphoneDisplay({
  phoneNumber,
  onBackspace,
  onClear,
  callStatus,
  duration,
  onForceConnect,
  compact = false
}: SoftphoneDisplayProps) {
  const { t } = useLanguage();

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden transition-all ${
      compact ? 'p-2.5 mb-2' : 'p-3 mb-2.5'
    }`}>
      {/* Barra superior de estado y temporizador */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1 font-mono">
        <div className="flex items-center gap-1.5">
          {callStatus === 'idle' && (
            <span className="flex items-center gap-1 text-slate-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t('voip.status_idle', 'DISPONIBLE')}</span>
            </span>
          )}
          {callStatus === 'calling' && (
            <span className="flex items-center gap-1 text-cyan-400 animate-pulse font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>{t('voip.status_calling', 'LLAMANDO...')}</span>
            </span>
          )}
          {callStatus === 'connected' && (
            <span className="flex items-center gap-1 text-emerald-400 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('voip.status_connected', 'EN LLAMADA')}</span>
            </span>
          )}
          {callStatus === 'on_hold' && (
            <span className="flex items-center gap-1 text-amber-400 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
              <span>{t('voip.status_hold', 'EN ESPERA')}</span>
            </span>
          )}
          {callStatus === 'ended' && (
            <span className="flex items-center gap-1 text-rose-400 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{t('voip.status_ended', 'FINALIZADA')}</span>
            </span>
          )}
        </div>

        {/* Cronómetro en llamada */}
        {(callStatus === 'connected' || callStatus === 'on_hold') && (
          <span className="flex items-center gap-1 text-white font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-[10px]">
            <Clock className="w-2.5 h-2.5 text-cyan-400" />
            <span>{formatTimer(duration)}</span>
          </span>
        )}
      </div>

      {/* Número Marcado / Input visual */}
      <div className="min-h-[36px] flex items-center justify-center relative px-8">
        <span className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-white select-all truncate text-center">
          {phoneNumber || <span className="text-slate-600 font-normal tracking-normal text-base">_ _ _ _ _ _</span>}
        </span>

        {/* Botón de Borrar (Backspace) */}
        {phoneNumber && callStatus === 'idle' && (
          <button
            type="button"
            onClick={onBackspace}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={t('common.delete', 'Borrar dígito')}
          >
            <Delete className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Botón de Conexión Forzada si está en estado 'calling' */}
      {callStatus === 'calling' && onForceConnect && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-center">
          <button
            type="button"
            onClick={onForceConnect}
            className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)] flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>{t('voip.connect_now', '⚡ Conectar Ahora')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
