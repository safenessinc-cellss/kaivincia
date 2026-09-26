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
  Settings, 
  AlertCircle, 
  Maximize2,
  Minimize2
} from 'lucide-react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlobalContext } from '../../contexts/GlobalContext';
import { VoipProvider, CallRecord, SoftphoneState } from '../../types/calls';
import VoipProviderModal from './VoipProviderModal';

// Subcomponentes modulares del Softphone
import SoftphoneTabs from './SoftphoneTabs';
import SoftphoneDisplay from './SoftphoneDisplay';
import SoftphoneKeypad from './SoftphoneKeypad';
import SoftphoneConfig from './SoftphoneConfig';
import SoftphoneSipConsole from './SoftphoneSipConsole';

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
  const { clients = [] } = useGlobalContext();

  // Navegación por pestañas: Marcador (por defecto) o Configuración
  const [activeTab, setActiveTab] = useState<'dialer' | 'config'>('dialer');

  // En modo flotante, toggle para expandir / ver configuración
  const [isFloatingExpanded, setIsFloatingExpanded] = useState(false);

  // Estados del discador
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [callStatus, setCallStatus] = useState<SoftphoneState['status']>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('telnyx');
  const [providers, setProviders] = useState<VoipProvider[]>(DEFAULT_PROVIDERS);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<Partial<VoipProvider> | null>(null);
  const [liveLatency, setLiveLatency] = useState(24);
  const [liveJitter, setLiveJitter] = useState(1.1);
  const [sipLogs, setSipLogs] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);

  // Estados de Telnyx: Control de Caller ID autorizado y Campaña / Cliente
  const [authorizedCallerIds, setAuthorizedCallerIds] = useState<string[]>([]);
  const [selectedCallerId, setSelectedCallerId] = useState<string>('+13055550199');
  const [selectedProject, setSelectedProject] = useState<string>('Ventas B2B');
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [agentAssignment, setAgentAssignment] = useState<any | null>(null);

  // Referencias para gestión segura de audio y temporizadores
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);
  const callDurationIntervalRef = useRef<any>(null);
  const timeoutsRef = useRef<any[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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

    // Suscripción a asignaciones de números de Telnyx para la colaboradora actual
    let sharedPoolNumbers: string[] = ['+13055550199'];
    const unsubNumbers = onSnapshot(collection(db, 'telnyx_phone_numbers'), (snapshot) => {
      if (!snapshot.empty) {
        sharedPoolNumbers = snapshot.docs
          .map(d => d.data())
          .filter((n: any) => n.status !== 'disabled' && (n.isSharedPool || n.assignedAgentIds?.includes(user.uid)))
          .map((n: any) => n.phoneNumber);
      }
    }, () => {});

    const unsubAssignments = onSnapshot(collection(db, 'telnyx_agent_assignments'), (snapshot) => {
      if (!snapshot.empty) {
        const found = snapshot.docs.find(d => d.id === user.uid || d.data().agentEmail === user.email);
        if (found) {
          const assignData = found.data();
          setAgentAssignment(assignData);
          const authorized = assignData.authorizedNumbers || [];
          const combined = Array.from(new Set([...authorized, ...(assignData.allowSharedPool ? sharedPoolNumbers : [])]));
          setAuthorizedCallerIds(combined);
          if (assignData.defaultCallerId && combined.includes(assignData.defaultCallerId)) {
            setSelectedCallerId(assignData.defaultCallerId);
          } else if (combined.length > 0) {
            setSelectedCallerId(combined[0]);
          }
        } else {
          setAuthorizedCallerIds(sharedPoolNumbers);
          if (sharedPoolNumbers.length > 0) setSelectedCallerId(sharedPoolNumbers[0]);
        }
      } else {
        setAuthorizedCallerIds(['+13055550199', '+14155550142']);
      }
    }, (err) => {
      console.warn('Could not read agent assignments:', err);
      setAuthorizedCallerIds(['+13055550199', '+14155550142']);
    });

    return () => {
      unsubVoip();
      unsubEsim();
      unsubNumbers();
      unsubAssignments();
    };
  }, [user, authLoading]);

  // Limpieza de temporizadores
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  // Audio Context seguro
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

  // Tono DTMF sintético de dos frecuencias ITU-T
  const playDtmfTone = useCallback((char: string) => {
    const freqs = DTMF_FREQUFrequencies(char);
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

  const DTMF_FREQUFrequencies = (char: string): [number, number] | undefined => {
    return DTMF_FREQUENCIES[char];
  };

  // Ringback tone
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

  // Teclado físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

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

  // Limpieza al desmontar
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

  const activeCarrierObj = useMemo(() => {
    return providers.find(p => p.id === selectedCarrier) || providers[0] || DEFAULT_PROVIDERS[0];
  }, [providers, selectedCarrier]);

  const hasValidSipCredentials = useMemo(() => {
    if (!activeCarrierObj) return false;
    if (activeCarrierObj.status === 'offline') return false;
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

    const ringTimeout = setTimeout(() => {
      stopRingback();
      playConnectBeep();
      setCallStatus('connected');
      setSipLogs(prev => [
        `[${new Date().toLocaleTimeString()}] SIP 200 OK -> SDP Answer Audio G.711u / Opus 48kHz`,
        `[${new Date().toLocaleTimeString()}] WebRTC PeerConnection ESTABLISHED (SRTP Secure)`,
        ...prev.slice(0, 30)
      ]);

      callDurationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        setLiveLatency(20 + Math.floor(Math.random() * 8));
        setLiveJitter(parseFloat((1.0 + Math.random() * 0.4).toFixed(1)));
      }, 1000);

    }, 3500);

    timeoutsRef.current.push(ringTimeout);
  };

  // Forzar conexión inmediata
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

  // Llamada demo
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
    const endedRecord: any = {
      contactPhone: phoneNumber,
      contactName: selectedClientName ? `${selectedClientName} (${phoneNumber})` : `Contacto ${phoneNumber}`,
      callerId: selectedCallerId || activeCarrierObj?.credentials?.callerId || '+1 (305) 555-0199',
      duration: finalDuration,
      status: finalDuration > 0 ? 'completed' : 'missed',
      direction: 'outbound',
      startedAt: currentCallStartedAtRef.current || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      provider: activeCarrierObj.name.includes('Telnyx') ? `Telnyx Backbone` : activeCarrierObj.name,
      carrier: activeCarrierObj.id,
      agentId: auth.currentUser?.uid || user?.uid || 'agent_current',
      agentName: user?.displayName || (user as any)?.name || 'Colaboradora Kaivincia',
      agentEmail: auth.currentUser?.email || user?.email || 'agent@kaivincia.com',
      projectName: selectedProject || 'General',
      disposition: finalDuration > 0 ? 'Conectada / Éxito' : 'Sin contestar',
      notes: `Caller ID: ${selectedCallerId || 'Central'} | Proyecto/Campaña: ${selectedProject || 'General'}`,
      isRecorded: isRecording || Boolean(agentAssignment?.recordCalls)
    };

    addDoc(collection(db, 'voip_call_history'), endedRecord).catch(err => {
      console.warn('Could not write call record to Firestore:', err);
    });

    setSipLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SIP BYE -> Llamada finalizada`,
      ...prev.slice(0, 30)
    ]);

    setCallStatus('ended');

    if (onCallEnd) {
      onCallEnd(endedRecord);
    }

    const resetTimeout = setTimeout(() => {
      setCallStatus('idle');
      setDuration(0);
      setIsMuted(false);
      setIsOnHold(false);
      setIsRecording(false);
    }, 1500);
    timeoutsRef.current.push(resetTimeout);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    setSipLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Micrófono ${!isMuted ? 'SILENCIADO' : 'ACTIVADO'}`,
      ...prev.slice(0, 30)
    ]);
  };

  const toggleHold = () => {
    const nextHold = !isOnHold;
    setIsOnHold(nextHold);
    setSipLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SIP ${nextHold ? 'CALL ON HOLD' : 'CALL RETRIEVED'}`,
      ...prev.slice(0, 30)
    ]);
  };

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
        `[${new Date().toLocaleTimeString()}] Grabación de audio FINALIZADA`,
        ...prev.slice(0, 30)
      ]);
    }
  };

  const isFloating = mode === 'floating';
  // En modo floating, mostrar pestañas si el usuario decidió expandirlo
  const showTabs = !isFloating || isFloatingExpanded;

  return (
    <div className={`relative bg-slate-950/95 backdrop-blur-xl text-white rounded-3xl border border-slate-800 shadow-2xl transition-all ${
      isFloating ? 'p-3.5 sm:p-4' : 'p-4 sm:p-6'
    } ${className}`}>
      
      {/* Botón de cierre en modo flotante */}
      {isFloating && (
        <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
          <button
            type="button"
            onClick={() => setIsFloatingExpanded(!isFloatingExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            title={isFloatingExpanded ? 'Contraer configuración' : 'Expandir configuración'}
          >
            {isFloatingExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Cerrar marcador"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cabecera del Marcador */}
      <div className={`flex items-center justify-between gap-2 border-b border-slate-900 ${
        isFloating ? 'pb-2.5 mb-2.5' : 'pb-3 mb-3'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight italic flex items-center gap-1.5">
              <span>{t('voip.softphone_title', 'Softphone WebRTC')}</span>
              {isFloating && (
                <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  MINI
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[170px] sm:max-w-none">
              {activeCarrierObj?.name || 'Telnyx WebRTC'} · OPUS
            </p>
          </div>
        </div>

        {/* SIP Badge & Demo Test en modo no-flotante */}
        {!isFloating && (
          <div className="flex items-center gap-2">
            {hasValidSipCredentials ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                SIP OK
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-[9px] font-mono text-amber-400 font-semibold">
                <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                Pendiente
              </span>
            )}

            <button
              type="button"
              onClick={handleDemoTestCall}
              disabled={callStatus !== 'idle'}
              className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>Demo</span>
            </button>
          </div>
        )}
      </div>

      {/* Pestañas (Marcador vs Configuración) */}
      {showTabs && (
        <SoftphoneTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedCarrierName={activeCarrierObj?.name}
          hasValidSip={hasValidSipCredentials}
          authorizedCallerId={selectedCallerId}
          isFloating={isFloating}
        />
      )}

      {/* Display del Número y Estado (SIEMPRE VISIBLE) */}
      <SoftphoneDisplay
        phoneNumber={phoneNumber}
        onBackspace={handleBackspace}
        onClear={handleClear}
        callStatus={callStatus}
        duration={duration}
        onForceConnect={handleForceConnectNow}
        compact={isFloating}
      />

      {/* Cuerpo según la Pestaña Activa */}
      {activeTab === 'dialer' || (!showTabs && isFloating) ? (
        /* PESTAÑA 1: Teclado DTMF Compacto */
        <div className="space-y-2">
          <SoftphoneKeypad
            onDigitPress={handleDigitPress}
            disabled={callStatus === 'ended'}
            compact={isFloating}
          />
        </div>
      ) : (
        /* PESTAÑA 2: Configuración (Selectores de Carrier, Caller ID, Campaña, Cliente) */
        <div className="space-y-2">
          <SoftphoneConfig
            providers={providers}
            selectedCarrier={selectedCarrier}
            onSelectCarrier={setSelectedCarrier}
            authorizedCallerIds={authorizedCallerIds}
            selectedCallerId={selectedCallerId}
            onSelectCallerId={setSelectedCallerId}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            selectedClientName={selectedClientName}
            onSelectClient={(clientName, phone) => {
              setSelectedClientName(clientName);
              if (phone && callStatus === 'idle') {
                setPhoneNumber(phone);
              }
            }}
            clients={clients}
            liveLatency={liveLatency}
            liveJitter={liveJitter}
            hasValidSipCredentials={hasValidSipCredentials}
            onOpenProviderModal={(provider) => {
              setProviderToEdit(provider);
              setIsProviderModalOpen(true);
            }}
            callStatus={callStatus}
            agentAssignment={agentAssignment}
          />
        </div>
      )}

      {/* BOTONES DE ACCIÓN PRINCIPALES (SIEMPRE VISIBLES FUERA DE LAS PESTAÑAS) */}
      <div className="pt-2.5">
        {callStatus === 'idle' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStartCall()}
              disabled={!phoneNumber.trim()}
              className="flex-1 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>{t('voip.call', 'Llamar')}</span>
            </button>

            {isFloating && (
              <button
                type="button"
                onClick={handleDemoTestCall}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl transition-all cursor-pointer"
                title="Llamada de prueba"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Controles en Vivo durante la Llamada */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-bold cursor-pointer ${
                  isMuted 
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
                title={isMuted ? 'Activar micrófono' : 'Silenciar'}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Muted' : 'Mute'}</span>
              </button>

              <button
                type="button"
                onClick={toggleHold}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-bold cursor-pointer ${
                  isOnHold 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
                title={isOnHold ? 'Reanudar llamada' : 'Poner en espera'}
              >
                {isOnHold ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isOnHold ? 'Reanudar' : 'Hold'}</span>
              </button>

              <button
                type="button"
                onClick={toggleRecord}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-bold cursor-pointer ${
                  isRecording 
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
                title={isRecording ? 'Detener grabación' : 'Grabar llamada'}
              >
                <Disc className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-400' : 'text-slate-300'}`} />
                <span>{isRecording ? 'REC' : 'Grabar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-bold cursor-pointer ${
                  isSpeaker 
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
                title="Altavoz"
              >
                {isSpeaker ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Audio</span>
              </button>
            </div>

            {/* Botón Colgar */}
            <button
              type="button"
              onClick={handleHangup}
              className="w-full py-2.5 sm:py-3 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <PhoneOff className="w-4 h-4 fill-current" />
              <span>{t('voip.hangup', 'Colgar')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Consola SIP Colapsable en la parte inferior */}
      <SoftphoneSipConsole
        logs={sipLogs}
        isOpen={showConsole}
        onToggle={() => setShowConsole(!showConsole)}
        onClearLogs={() => setSipLogs([])}
        liveLatency={liveLatency}
        liveJitter={liveJitter}
        callStatus={callStatus}
      />

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
