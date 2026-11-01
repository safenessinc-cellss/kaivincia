import React, { useRef, useEffect } from 'react';
import { Delete, Clock, Zap, Copy, ClipboardPaste, X } from 'lucide-react';
import { SoftphoneState } from '../../types/calls';
import { useLanguage } from '../../contexts/LanguageContext';

export interface SoftphoneDisplayProps {
  phoneNumber: string;
  callerId?: string;
  onPhoneNumberChange: (val: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
  callStatus: SoftphoneState['status'];
  duration: number;
  onForceConnect?: () => void;
  compact?: boolean;
  onCopySuccess?: (msg: string) => void;
  onPasteSuccess?: (msg: string) => void;
  onDigitType?: (char: string) => void;
}

/**
 * Limpia y normaliza números telefónicos para discado WebRTC / SIP.
 * Soporta formatos:
 * - +1 (555) 123-4567 -> +15551234567
 * - (555) 123-4567    -> 5551234567
 * - 555-123-4567      -> 5551234567
 * - +34 91 234 56 78  -> +34912345678
 * - 15551234567       -> 15551234567
 * Mantiene '+' inicial y caracteres SIP '*', '#'
 */
export function sanitizeDialNumber(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const startsWithPlus = trimmed.startsWith('+');
  // Eliminar espacios, paréntesis, guiones, puntos y cualquier letra
  const cleaned = trimmed.replace(/[^0-9*#]/g, '');
  return startsWithPlus ? `+${cleaned}` : cleaned;
}

/**
 * Formatea un número telefónico para previsualización legible en UI
 */
export function formatDialNumberPreview(num: string): string {
  if (!num) return '';
  const digits = num.replace(/\D/g, '');
  // Formato US +1 (XXX) XXX-XXXX
  if (num.startsWith('+1') && digits.length === 11) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // Formato US 10 dígitos (XXX) XXX-XXXX
  if (!num.startsWith('+') && digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // Formato US 11 dígitos iniciando con 1
  if (!num.startsWith('+') && digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // Formato internacional general
  if (num.startsWith('+') && digits.length > 8) {
    return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  }
  return num;
}

export default function SoftphoneDisplay({
  phoneNumber,
  callerId,
  onPhoneNumberChange,
  onBackspace,
  onClear,
  callStatus,
  duration,
  onForceConnect,
  compact = false,
  onCopySuccess,
  onPasteSuccess,
  onDigitType
}: SoftphoneDisplayProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Manejo de pegado (Paste) con limpieza inteligente de formatos
  const handlePasteEvent = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const cleaned = sanitizeDialNumber(pastedText);
    if (cleaned) {
      onPhoneNumberChange(cleaned);
      onPasteSuccess?.(t('voip.pasted', 'Número pegado'));
    }
  };

  // Botón directo "Pegar" usando la Clipboard API
  const handleClipboardPasteBtn = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        onPasteSuccess?.('Usa Ctrl+V / Cmd+V para pegar');
        inputRef.current?.focus();
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const cleaned = sanitizeDialNumber(text);
      if (cleaned) {
        onPhoneNumberChange(cleaned);
        onPasteSuccess?.(t('voip.pasted', 'Número pegado'));
      }
    } catch (err) {
      // Si el navegador bloquea permisos de lectura asíncrona, dar foco al input
      inputRef.current?.focus();
      onPasteSuccess?.('Pega directamente en el campo (Cmd+V / Ctrl+V)');
    }
  };

  // Botón directo "Copiar" usando la Clipboard API
  const handleClipboardCopyBtn = async () => {
    if (!phoneNumber) return;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      onCopySuccess?.(t('common.copied', 'Número copiado'));
    } catch (err) {
      // Fallback con selección de input
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        onCopySuccess?.(t('common.copied', 'Número copiado'));
      }
    }
  };

  // Manejo de teclado en el input editable
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir atajos del sistema: Cmd/Ctrl + A, C, V, X, Z
    if (e.metaKey || e.ctrlKey) {
      return;
    }

    // Enter para iniciar llamada
    if (e.key === 'Enter') {
      return;
    }

    // Backspace / Delete
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
      return;
    }

    // Caracteres telefónicos válidos
    if ((e.key >= '0' && e.key <= '9') || e.key === '*' || e.key === '#' || e.key === '+') {
      // Emitir tono DTMF sintético
      onDigitType?.(e.key);
      return;
    }

    // Bloquear caracteres no numéricos
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeDialNumber(rawVal);
    onPhoneNumberChange(sanitized);
  };

  const formattedPreview = formatDialNumberPreview(phoneNumber);

  return (
    <div className={`bg-white/90 border border-slate-200 rounded-2xl relative overflow-hidden transition-all shadow-inner ${
      compact ? 'p-2.5 mb-2' : 'p-3 mb-2.5'
    }`}>
      {/* Barra superior: Estado, Cronómetro y Acciones de Copiar/Pegar */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1.5 font-mono">
        {/* Indicador de Estado */}
        <div className="flex items-center gap-1.5">
          {callerId && (
            <span
              className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5"
              title="Caller ID de salida"
            >
              {callerId}
            </span>
          )}
          {callStatus === 'idle' && (
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t('voip.status_idle', 'DISPONIBLE')}</span>
            </span>
          )}
          {callStatus === 'calling' && (
            <span className="flex items-center gap-1 text-blue-700 animate-pulse font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>{t('voip.status_calling', 'LLAMANDO...')}</span>
            </span>
          )}
          {callStatus === 'connected' && (
            <span className="flex items-center gap-1 text-emerald-700 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('voip.status_connected', 'EN LLAMADA')}</span>
            </span>
          )}
          {callStatus === 'on_hold' && (
            <span className="flex items-center gap-1 text-amber-700 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
              <span>{t('voip.status_hold', 'EN ESPERA')}</span>
            </span>
          )}
          {callStatus === 'ended' && (
            <span className="flex items-center gap-1 text-rose-700 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{t('voip.status_ended', 'FINALIZADA')}</span>
            </span>
          )}
        </div>

        {/* Lado derecho: Cronómetro y Botones de Copiar / Pegar */}
        <div className="flex items-center gap-1">
          {/* Cronómetro en llamada */}
          {(callStatus === 'connected' || callStatus === 'on_hold') && (
            <span className="flex items-center gap-1 text-slate-800 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
              <Clock className="w-2.5 h-2.5 text-cyan-400" />
              <span>{formatTimer(duration)}</span>
            </span>
          )}

          {/* Botón Pegar */}
          {callStatus === 'idle' && (
            <button
              type="button"
              onClick={handleClipboardPasteBtn}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-[10px] font-sans font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              title="Pegar número desde el portapapeles (Cmd+V / Ctrl+V)"
            >
              <ClipboardPaste className="w-3 h-3 text-cyan-400" />
              <span className="hidden xs:inline">{t('common.paste', 'Pegar')}</span>
            </button>
          )}

          {/* Botón Copiar */}
          {phoneNumber && (
            <button
              type="button"
              onClick={handleClipboardCopyBtn}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-blue-700 border border-slate-700 text-[10px] font-sans font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              title="Copiar número actual (Cmd+C / Ctrl+C)"
            >
              <Copy className="w-3 h-3 text-cyan-400" />
              <span className="hidden xs:inline">{t('common.copy', 'Copiar')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Input editable con soporte de teclado, selección Cmd+A y pegado Cmd+V */}
      <div className="relative flex items-center justify-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="tel"
          value={phoneNumber}
          onChange={handleInputChange}
          onPaste={handlePasteEvent}
          onKeyDown={handleKeyDown}
          placeholder="+1 (555) 000-0000"
          disabled={callStatus !== 'idle'}
          className={`w-full bg-white border border-slate-200 focus:border-blue-500/60 rounded-xl py-1.5 px-8 font-mono font-bold tracking-wider text-center text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 selection:bg-cyan-500/30 selection:text-cyan-200 transition-all ${
            compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
          } ${callStatus !== 'idle' ? 'opacity-85 cursor-not-allowed' : ''}`}
          aria-label="Número de teléfono a marcar"
        />

        {/* Botón de Borrar (Backspace) o Limpiar todo (Clear) */}
        {phoneNumber && callStatus === 'idle' && (
          <div className="absolute right-2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={onBackspace}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={t('common.delete', 'Borrar último dígito')}
            >
              <Delete className="w-3.5 h-3.5" />
            </button>
            {phoneNumber.length > 2 && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title={t('common.clear', 'Limpiar número')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Previsualización de formato limpio cuando difiere del input crudo */}
      {phoneNumber && formattedPreview !== phoneNumber && (
        <div className="mt-1 text-center font-mono text-[10px] text-blue-700 tracking-wide truncate">
          Formato: {formattedPreview}
        </div>
      )}

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
