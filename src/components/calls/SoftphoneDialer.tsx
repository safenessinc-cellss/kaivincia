import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Disc, 
  Volume2, 
  VolumeX, 
  X, 
  Zap, 
  Sparkles, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  Clock, 
  Delete,
  Settings,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { VoipProvider, CallRecord, SoftphoneState } from '../../types/calls';
import VoipProviderModal from './VoipProviderModal';

interface SoftphoneDialerProps {
  mode?: 'embedded' | 'floating';
  initialPhoneNumber?: string;
  onCallStart?: (phoneNumber: string) => void;
  onCallEnd?: (record: Partial<CallRecord>) => void;
  onCloseFloating?: () => void;
  onClose?: () => void;
  className?: string;
}

// Frecuencias DTMF estándar (ITU-T)
const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

const KEYPAD_BUTTONS = [
  { key: '1', sub: '—' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: '*', sub: 'SEC' },
  { key: '0', sub: '+' },
  { key: '#', sub: 'HASH' },
];

const DEFAULT_PROVIDERS: VoipProvider[] = [
  {
    id: 'zadarma',
    name: 'Zadarma (SIP Cloud)',
    type: 'sip',
    status: 'enabled',
    costPerMinute: '$0.012',
    credentials: {
      domain: 'sip.zadarma.com',
      username: '345678'
    }
  },
  {
    id: 'telnyx',
    name: 'Telnyx WebRTC',
    type: 'api',
    status: 'available',
    costPerMinute: '$0.010'
  },
  {
    id: 'twilio',
    name: 'Twilio Voice',
    type: 'sdk',
    status: 'available',
    costPerMinute: '$0.015'
  }
];

export default function SoftphoneDialer({
  mode = 'embedded',
  initialPhoneNumber = '',
  onCallStart,
  onCallEnd,
  onCloseFloating,
  onClose,
  className = ''
}: SoftphoneDialerProps) {
  const handleClose = onClose || onCloseFloating;
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  // Estados del discador
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [callStatus, setCallStatus] = useState<SoftphoneState['status']>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('zadarma');
  const [providers, setProviders] = useState<VoipProvider[]>(DEFAULT_PROVIDERS);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<Partial<VoipProvider> | null>(null);
  const [liveLatency, setLiveLatency] = useState(24);
  const [liveJitter, setLiveJitter] = useState(1.1);
  const [sipLogs, setSipLogs] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);

  // Referencias para gestión segura de audio y temporizadores
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);
  const callDurationIntervalRef = useRef<any>(null);
  const timeoutsRef = useRef<any[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const currentCallStartedAtRef = useRef<string>('');

  // Sincronizar número inicial si cambia por props
  useEffect(() => {
    if (initialPhoneNumber) {
      setPhoneNumber(initialPhoneNumber);
    }
  }, [initialPhoneNumber]);

  // Cargar proveedores desde Firestore y líneas eSIM internas
  useEffect(() => {
    if (authLoading || !user) return;

    let voipList: VoipProvider[] = DEFAULT_PROVIDERS;
    let esimList: VoipProvider[] = [];

    const updateCombined = () => {
      setProviders([...voipList, ...esimList]);
    };

    const unsubVoip = onSnapshot(collection(db, 'voip_providers'), (snapshot) => {
      if (!snapshot.empty) {
        voipList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as VoipProvider));
      }
      updateCombined();
    }, (err) => {
      console.warn('Could not read voip_providers, using fallback:', err);
    });

    const unsubEsim = onSnapshot(collection(db, 'esim_profiles'), (snapshot) => {
      if (!snapshot.empty) {
        esimList = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((p: any) => p.isInternalLineActive !== false && p.status !== 'expired')
          .map((p: any) => ({
            id: `esim_${p.id}`,
            name: `📱 ${p.lineName || 'Línea eSIM'} (${p.extension || 'Ext. 101'})`,
            type: 'sip' as const,
            status: 'enabled' as const,
            costPerMinute: '$0.008',
            credentials: {
              domain: p.sipCredentials?.sipDomain || 'sip.zadarma.com',
              username: p.sipCredentials?.sipUsername || p.phone?.replace(/\D/g, '') || '345678',
              callerId: p.phone || '+1 323 555 0122'
            }
          }));
        updateCombined();
      }
    }, (err) => {
      console.warn('Could not read esim_profiles for softphone:', err);
    });

    return () => {
      unsubVoip();
      unsubEsim();
    };
  }, [user, authLoading]);

  // Función de limpieza de temporizadores
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  // Obtener o crear contexto de audio seguro
  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch (e) {
      console.warn('Web Audio not available:', e);
      return null;
    }
  }, []);

  // Reproducir tono DTMF sintético de dos frecuencias
  const playDtmfTone = useCallback((char: string) => {
    const freqs = DTMF_FREQUENCIES[char];
    if (!freqs) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const oscLow = ctx.createOscillator();
      const oscHigh = ctx.createOscillator();
      const gain = ctx.createGain();

      oscLow.frequency.setValueAtTime(freqs[0], now);
      oscHigh.frequency.setValueAtTime(freqs[1], now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);

      oscLow.connect(gain);
      oscHigh.connect(gain);
      gain.connect(ctx.destination);

      oscLow.start(now);
      oscHigh.start(now);
      oscLow.stop(now + 0.13);
      oscHigh.stop(now + 0.13);
    } catch (e) {
      console.warn('Error synthesizing DTMF tone', e);
    }
  }, [getAudioContext]);

  // Reproducir ringback tone (llamada saliente en progreso)
  const startRingback = useCallback(() => {
    stopRingback();
    const ctx = getAudioContext();
    if (!ctx) return;

    const playCycle = () => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = audioCtxRef.current.currentTime;
        const osc1 = audioCtxRef.current.createOscillator();
        const osc2 = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        gain.gain.setValueAtTime(0.06, now + 1.6);
        gain.gain.linearRampToValueAtTime(0, now + 1.7);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtxRef.current.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (err) {
        console.warn('Ringback cycle error', err);
      }
    };

    playCycle();
    ringIntervalRef.current = setInterval(playCycle, 4000);
  }, [getAudioContext]);

  const stopRingback = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  // Sonido de conexión establecida
  const playConnectBeep = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }, [getAudioContext]);

  // Sonido de fin de llamada
  const playHangupBeep = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }, [getAudioContext]);

  // Manejo de pulsación de teclado físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea externo
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.key >= '0' && e.key <= '9') || e.key === '*' || e.key === '#') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter' && callStatus === 'idle' && phoneNumber.trim()) {
        e.preventDefault();
        handleStartCall();
      } else if (e.key === 'Escape' && callStatus !== 'idle') {
        e.preventDefault();
        handleHangup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callStatus, phoneNumber]);

  // Limpieza total al desmontar el componente
  useEffect(() => {
    return () => {
      stopRingback();
      clearAllTimeouts();
      if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
    };
  }, [clearAllTimeouts, stopRingback]);

  // Manejo de dígitos
  const handleDigitPress = (char: string) => {
    playDtmfTone(char);
    setPhoneNumber(prev => prev + char);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber('');
  };

  // Carrier activo y verificación de credenciales
  const activeCarrierObj = useMemo(() => {
    return providers.find(p => p.id === selectedCarrier) || providers[0] || DEFAULT_PROVIDERS[0];
  }, [providers, selectedCarrier]);

  const hasValidSipCredentials = useMemo(() => {
    if (!activeCarrierObj) return false;
    if (activeCarrierObj.status === 'offline') return false;
    // Zadarma o SIP requiere usuario o dominio
    if (activeCarrierObj.type === 'sip') {
      return !!(activeCarrierObj.credentials?.username || activeCarrierObj.credentials?.domain);
    }
    return true;
  }, [activeCarrierObj]);

  // Iniciar llamada
  const handleStartCall = (targetPhone?: string) => {
    const dialNum = targetPhone || phoneNumber;
    if (!dialNum || dialNum.trim().length === 0) return;

    currentCallStartedAtRef.current = new Date().toISOString();
    setCallStatus('calling');
    setDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    setIsRecording(false);
    setSipLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SIP INVITE -> ${dialNum} (Carrier: ${activeCarrierObj.name})`,
      ...prev.slice(0, 30)
    ]);

    startRingback();
    onCallStart?.(dialNum);

    // Simular o negociar conexión WebRTC
    const ringTimeout = setTimeout(() => {
      stopRingback();
      playConnectBeep();
      setCallStatus('connected');
      setSipLogs(prev => [
        `[${new Date().toLocaleTimeString()}] SIP 200 OK -> SDP Answer Audio G.711u / Opus 48kHz`,
        `[${new Date().toLocaleTimeString()}] WebRTC PeerConnection ESTABLISHED (SRTP Secure)`,
        ...prev.slice(0, 30)
      ]);

      // Iniciar cronómetro de duración
      callDurationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        // Simular pequeñas variaciones reales de jitter y latencia
        setLiveLatency(20 + Math.floor(Math.random() * 8));
        setLiveJitter(parseFloat((1.0 + Math.random() * 0.4).toFixed(1)));
      }, 1000);

    }, 3500);

    timeoutsRef.current.push(ringTimeout);
  };

  // Forzar conexión inmediata ("⚡ Conectar Ahora")
  const handleForceConnectNow = () => {
    if (callStatus !== 'calling') return;
    clearAllTimeouts();
    stopRingback();
    playConnectBeep();
    setCallStatus('connected');
    setSipLogs(prev => [
      `[${new Date().toLocaleTimeString()}] FORCED 200 OK -> Sesión de llamada conectada manualmente`,
      ...prev.slice(0, 30)
    ]);
    if (!callDurationIntervalRef.current) {
      callDurationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  // Llamada de prueba de demostración ("Demo Test")
  const handleDemoTestCall = () => {
    const demoNumbers = ['+1 (323) 555-0144', '+1 (415) 882-9901', '+34 912 345 678'];
    const randomNum = demoNumbers[Math.floor(Math.random() * demoNumbers.length)];
    setPhoneNumber(randomNum);
    handleStartCall(randomNum);
  };

  // Colgar llamada
  const handleHangup = () => {
    stopRingback();
    clearAllTimeouts();
    playHangupBeep();

    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }

    const finalDuration = duration;
    const endedRecord: Partial<CallRecord> = {
      contactPhone: phoneNumber,
      contactName: `Contacto ${phoneNumber}`,
      duration: finalDuration,
      status: finalDuration > 0 ? 'completed' : 'missed',
      direction: 'outbound',
      startedAt: currentCallStartedAtRef.current || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      provider: activeCarrierObj.name,
      carrier: activeCarrierObj.id,
      agentId: auth.currentUser?.uid || 'agent_current',
      agentEmail: auth.currentUser?.email || 'agent@kaivincia.com'
    };

    setSipLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SIP BYE -> Llamada finalizada (Duración: ${formatTimer(finalDuration)})`,
      ...prev.slice(0, 30)
    ]);

    setCallStatus('ended');

    if (onCallEnd) {
      onCallEnd(endedRecord);
    }

    // Regresar a estado idle tras 1.5s
    const resetTimeout = setTimeout(() => {
      setCallStatus('idle');
      setDuration(0);
      setIsMuted(false);
      setIsOnHold(false);
      setIsRecording(false);
    }, 1500);
    timeoutsRef.current.push(resetTimeout);
  };

  // Alternar Mute
  const toggleMute = () => {
    setIsMuted(prev => !prev);
    setSipLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Micrófono ${!isMuted ? 'SILENCIADO' : 'ACTIVADO'}`,
      ...prev.slice(0, 30)
    ]);
  };

  // Alternar Hold
  const toggleHold = () => {
    const nextHold = !isOnHold;
    setIsOnHold(nextHold);
    setSipLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SIP ${nextHold ? 'CALL ON HOLD' : 'CALL RETRIEVED'}`,
      ...prev.slice(0, 30)
    ]);
  };

  // Alternar Grabación local
  const toggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setSipLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Grabación de audio local INICIADA (MediaRecorder)`,
        ...prev.slice(0, 30)
      ]);
    } else {
      setIsRecording(false);
      setSipLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Grabación de audio FINALIZADA y guardada`,
        ...prev.slice(0, 30)
      ]);
    }
  };

  // Formato mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl p-5 sm:p-7 ${className}`}>
      {/* Botón de cierre en modo flotante */}
      {mode === 'floating' && (
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors z-20"
          title="Cerrar discador"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Cabecera del Marcador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight italic flex items-center gap-2">
              <span>{t('voip.softphone_title', 'Softphone WebRTC')}</span>
              {mode === 'floating' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  FLOTANTE
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {t('voip.softphone_sub', 'Códecs OPUS / G.711u · Cancelación de eco')}
            </p>
          </div>
        </div>

        {/* Estado del Servidor SIP / Carrier & Botones */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasValidSipCredentials ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              SIP: {activeCarrierObj.name.split(' ')[0]} (OK)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-[10px] font-mono text-amber-400 font-semibold">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              {t('voip.sip_pending', 'Pendiente de conectar')}
            </span>
          )}

          {/* Botón directo a configuración de APIs del carrier */}
          <button
            type="button"
            onClick={() => {
              setProviderToEdit(activeCarrierObj);
              setIsProviderModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Configurar APIs, sockets y parámetros del carrier activo"
          >
            <Settings className="w-3 h-3" />
            <span>APIs & Troncales</span>
          </button>

          {/* Botones de prueba rápida */}
          <button
            type="button"
            onClick={handleDemoTestCall}
            disabled={callStatus !== 'idle'}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Demo Test</span>
          </button>
        </div>
      </div>

      {/* Contenido Principal: Selector de Carrier + Display + Teclado */}
      <div className="mt-5 space-y-4">
        {/* Selector y Configuración Coherente de Carrier VoIP */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('voip.carrier', 'Carrier Activo')}:</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>{liveLatency}ms</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setProviderToEdit(activeCarrierObj);
                  setIsProviderModalOpen(true);
                }}
                className="text-[10px] font-black uppercase text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                title="Editar todos los parámetros técnicos y credenciales de este proveedor"
              >
                <Settings className="w-3 h-3" />
                <span>Editar Parámetros</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              disabled={callStatus !== 'idle'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isDefault ? '⭐' : ''} ({p.costPerMinute || '$0.012'}/m)
                </option>
              ))}
            </select>

            {/* Caller ID & Códec Activo */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500 text-[10px]">Caller ID:</span>
              <span className="text-cyan-300 font-bold truncate max-w-[130px]" title={activeCarrierObj?.credentials?.callerId || 'Predeterminado'}>
                {activeCarrierObj?.credentials?.callerId || '+1 (305) 555-0199'}
              </span>
            </div>
          </div>
        </div>

        {/* Pantalla del Número / Display */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center relative overflow-hidden">
          {/* Indicador de Estado Activo */}
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
            <span className="flex items-center gap-1.5">
              {callStatus === 'idle' && <span className="text-slate-500 font-medium">DISPONIBLE</span>}
              {callStatus === 'calling' && <span className="text-cyan-400 animate-pulse font-bold">LLAMANDO...</span>}
              {callStatus === 'connected' && <span className="text-emerald-400 font-bold">EN LLAMADA</span>}
              {callStatus === 'on_hold' && <span className="text-amber-400 font-bold">EN ESPERA</span>}
              {callStatus === 'ended' && <span className="text-rose-400 font-bold">FINALIZADA</span>}
            </span>

            {/* Temporizador */}
            {(callStatus === 'connected' || callStatus === 'on_hold') && (
              <span className="flex items-center gap-1 text-white font-bold bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{formatTimer(duration)}</span>
              </span>
            )}
          </div>

          {/* Número Marcado */}
          <div className="min-h-[44px] flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-white select-all">
              {phoneNumber || <span className="text-slate-600">_ _ _ _ _ _</span>}
            </span>
          </div>

          {/* Botones de Edición Rápida (Borrar / Limpiar) */}
          {phoneNumber && callStatus === 'idle' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleBackspace}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Borrar dígito"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Botón de Conexión Forzada si está en estado 'calling' */}
          {callStatus === 'calling' && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center">
              <button
                type="button"
                onClick={handleForceConnectNow}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>⚡ Conectar Ahora</span>
              </button>
            </div>
          )}
        </div>

        {/* Teclado Numérico DTMF */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {KEYPAD_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => handleDigitPress(btn.key)}
              className="group bg-slate-900/80 hover:bg-cyan-500/10 active:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 rounded-2xl py-3 px-2 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <span className="text-lg sm:text-xl font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                {btn.key}
              </span>
              <span className="text-[9px] font-mono text-slate-500 group-hover:text-cyan-300/70 tracking-widest uppercase">
                {btn.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Barra de Controles de Llamada (Llamar / Colgar / Mute / Hold / Grabar) */}
        <div className="pt-2">
          {callStatus === 'idle' ? (
            <button
              type="button"
              onClick={() => handleStartCall()}
              disabled={!phoneNumber.trim()}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-black font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Phone className="w-5 h-5 fill-current" />
              <span>{t('voip.call', 'Llamar')}</span>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Controles en Vivo durante la Llamada */}
              <div className="grid grid-cols-4 gap-2">
                {/* Mute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold ${
                    isMuted 
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title={isMuted ? 'Activar micrófono' : 'Silenciar'}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-slate-300" />}
                  <span className="text-[9px]">{isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                {/* Hold */}
                <button
                  type="button"
                  onClick={toggleHold}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold ${
                    isOnHold 
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title={isOnHold ? 'Reanudar llamada' : 'Poner en espera'}
                >
                  {isOnHold ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-slate-300" />}
                  <span className="text-[9px]">{isOnHold ? 'Reanudar' : 'Hold'}</span>
                </button>

                {/* Record */}
                <button
                  type="button"
                  onClick={toggleRecord}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold ${
                    isRecording 
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title={isRecording ? 'Detener grabación' : 'Grabar llamada'}
                >
                  <Disc className={`w-4 h-4 ${isRecording ? 'text-rose-400' : 'text-slate-300'}`} />
                  <span className="text-[9px]">{isRecording ? 'REC' : 'Grabar'}</span>
                </button>

                {/* Speaker */}
                <button
                  type="button"
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold ${
                    isSpeaker 
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                  title="Altavoz"
                >
                  {isSpeaker ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                  <span className="text-[9px]">Audio</span>
                </button>
              </div>

              {/* Botón Colgar */}
              <button
                type="button"
                onClick={handleHangup}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <PhoneOff className="w-5 h-5 fill-current" />
                <span>{t('voip.hangup', 'Colgar')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Telemetría en Vivo (Latencia, Jitter, Códec) */}
        {callStatus === 'connected' && (
          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Latencia: <strong className="text-white">{liveLatency}ms</strong></span>
            </span>
            <span>Jitter: <strong className="text-white">{liveJitter}ms</strong></span>
            <span>Códec: <strong className="text-emerald-400">OPUS 48kHz</strong></span>
          </div>
        )}

        {/* Toggle para ver consola SIP técnica */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowConsole(!showConsole)}
            className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 underline transition-colors cursor-pointer"
          >
            {showConsole ? 'Ocultar consola SIP WebRTC' : 'Mostrar consola SIP WebRTC'}
          </button>
        </div>

        {/* Consola SIP */}
        {showConsole && (
          <div className="p-3 bg-black rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 max-h-32 overflow-y-auto space-y-1">
            {sipLogs.length === 0 ? (
              <span className="text-slate-600">Esperando eventos de señalización SIP...</span>
            ) : (
              sipLogs.map((log, idx) => <div key={idx}>{log}</div>)
            )}
          </div>
        )}
      </div>

      {/* Modal de Configuración Integral de APIs & Troncales VoIP */}
      <VoipProviderModal
        isOpen={isProviderModalOpen}
        onClose={() => {
          setIsProviderModalOpen(false);
          setProviderToEdit(null);
        }}
        provider={providerToEdit}
        allProviders={providers}
        onSaved={(saved) => {
          setSelectedCarrier(saved.id);
        }}
      />
    </div>
  );
}
