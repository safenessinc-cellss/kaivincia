import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Settings, Phone, Save, X, CheckCircle2, AlertCircle, Plus, Edit2,
  Link as LinkIcon, GripVertical, Activity, Lock, Eye, EyeOff, PlayCircle,
  ChevronUp, ChevronDown, MessageSquare, Mic, User, Send, ListTodo, Search,
  BrainCircuit, Zap, Sparkles, Filter, MoreVertical, PhoneIncoming, PhoneOutgoing,
  MessageCircle, BarChart2, TrendingUp, ShieldCheck, Clock, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DynamicLink {
  id: string;
  label: string;
  url: string;
}

interface Provider {
  id: string;
  name: string;
  status: 'Activo' | 'Inactivo';
  costPerMinute: string;
  lastUpdated: string;
  type: 'api' | 'iframe';
  accountId?: string;
  apiKey?: string;
  iframeUrl?: string;
  isDefault: boolean;
  dynamicLinks?: DynamicLink[];
  qualityTrend?: number[]; // Percentage quality for sparkline
}

interface ChatMessage {
  id: string;
  sender: string;
  role: 'agent' | 'customer';
  text: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export default function CallSystem() {
  const { userData } = useOutletContext<{ userData: any }>();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [routingRule, setRoutingRule] = useState('cost');
  const [activeTab, setActiveTab] = useState('monitor');
  const [showSecrets, setShowSecrets] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  
  // New States for evolved features
  const [activeCall, setActiveCall] = useState<any | null>({
    id: 'call_99',
    customer: 'Juan Pérez (LTV: $4,500)',
    agent: 'Marta García',
    duration: '02:45',
    status: 'In Progress',
    sentiment: 'positive',
    provider: 'Twilio (USA-Route)',
    sentimentTrend: [40, 50, 65, 60, 75, 80, 85]
  });

  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [inboxFilter, setInboxFilter] = useState('all');

  // Softphone States & Configuration
  const [softphoneOpen, setSoftphoneOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('1');
  const [softphoneStatus, setSoftphoneStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [softphoneDuration, setSoftphoneDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSipConsole, setShowSipConsole] = useState(false);
  const [sipLogs, setSipLogs] = useState<string[]>([]);
  const [connectionStage, setConnectionStage] = useState('');
  const [liveLatency, setLiveLatency] = useState(24);
  const [liveJitter, setLiveJitter] = useState(1.2);
  const [callHistory, setCallHistory] = useState<any[]>([
    { id: 'h1', number: '+34 690 123 456', name: 'Miguel Rojas', timestamp: 'Hace 10 min', status: 'completed', duration: '02:45', provider: 'Twilio' },
    { id: 'h2', number: '+1 415 555 2671', name: 'TechCorp CEO', timestamp: 'Hace 1 hora', status: 'missed', duration: '00:00', provider: 'Twilio' },
    { id: 'h3', number: '+54 9 11 9876 5432', name: 'Ana Silva', timestamp: 'Ayer', status: 'completed', duration: '05:00', provider: 'Zoho Voice' },
  ]);

  const playDTMFTone = (key: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      const dtmfFreqs: { [key: string]: [number, number] } = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
      };
      
      if (!dtmfFreqs[key]) return;
      const [f1, f2] = dtmfFreqs[key];
      
      osc1.frequency.value = f1;
      osc2.frequency.value = f2;
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(audioCtx.currentTime + 0.12);
      osc2.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio Context restricted or unsupported:', e);
    }
  };

  const addSipLog = (log: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setSipLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  };

  const getCostPerMinute = () => {
    const selectedProv = providers.find(p => p.id === selectedProviderId);
    if (!selectedProv) return 0.015;
    const match = selectedProv.costPerMinute.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0.015;
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Live Jitter and Latency updates
  useEffect(() => {
    let interval: any;
    if (softphoneStatus === 'connected') {
      interval = setInterval(() => {
        setLiveLatency(prev => {
          const change = Math.floor(Math.random() * 7) - 3;
          return Math.max(12, Math.min(120, prev + change));
        });
        setLiveJitter(prev => {
          const change = (Math.random() * 0.6) - 0.3;
          return Math.max(0.2, Math.min(15, parseFloat((prev + change).toFixed(2))));
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [softphoneStatus]);

  useEffect(() => {
    let timer: any;
    if (softphoneStatus === 'connected') {
      timer = setInterval(() => {
        setSoftphoneDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSoftphoneDuration(0);
    }
    return () => clearInterval(timer);
  }, [softphoneStatus]);

  useEffect(() => {
    if (softphoneStatus === 'connected' && activeCall) {
      const costRate = getCostPerMinute();
      const currentCost = (softphoneDuration * (costRate / 60)).toFixed(4);
      setActiveCall((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          duration: formatDuration(softphoneDuration),
          cost: `$${currentCost}`,
          latency: `${liveLatency}ms`,
          jitter: `${liveJitter}ms`,
          isMuted,
          isRecording
        };
      });
    }
  }, [softphoneDuration, softphoneStatus, liveLatency, liveJitter, isMuted, isRecording]);

  const handleDial = (numToDial?: string, name?: string) => {
    const targetNumber = numToDial || phoneNumber;
    if (!targetNumber) return;
    
    setSoftphoneStatus('calling');
    setSipLogs([]);
    const currentProv = providers.find(p => p.id === selectedProviderId) || { name: 'Direct VoIP Route', type: 'api', costPerMinute: '$0.015' };
    
    addSipLog(`SIP ENGINE INITIALIZED - Carrier: ${currentProv.name} (${currentProv.type.toUpperCase()})`);
    setConnectionStage('Iniciando...');
    
    setTimeout(() => {
      setConnectionStage('Enrutando...');
      addSipLog(`DNS lookup successful for sip.${currentProv.name.toLowerCase().replace(/\s+/g, '')}.com`);
      addSipLog(`SIP/2.0 REGISTER sent. Transport: TLS/WSS`);
      
      setTimeout(() => {
        setConnectionStage('Autenticando...');
        addSipLog(`SIP/2.0 401 Unauthorized - Auth Challenge Received`);
        addSipLog(`SIP/2.0 REGISTER with Auth Digest response`);
        
        setTimeout(() => {
          setConnectionStage('Negociando SDP...');
          addSipLog(`SIP/2.0 200 OK (Registered successfully)`);
          addSipLog(`WebRTC RTCPeerConnection established. ICE gathering complete.`);
          addSipLog(`Outbound route established with termination rate ${currentProv.costPerMinute}/min`);
          
          setTimeout(() => {
            setConnectionStage('Timbrando...');
            addSipLog(`SIP/2.0 INVITE sip:${targetNumber.replace(/\s+/g, '')} SDP Offer (Opus @ 48kHz)`);
            addSipLog(`SIP/2.0 100 Trying | 180 Ringing`);
            playDTMFTone('2');
            
            setTimeout(() => {
              setSoftphoneStatus('connected');
              setConnectionStage('Conectado');
              addSipLog(`SIP/2.0 200 OK (Answered)`);
              addSipLog(`RTP Media stream bound. Codec: OPUS 48kHz Stereo`);
              addSipLog(`Real-time NLP stream monitoring is online.`);
              
              setActiveCall({
                id: 'call_' + Date.now().toString().slice(-4),
                customer: `${name || 'Cliente'} (${targetNumber})`,
                agent: userData?.name || 'Marta García',
                duration: '00:00',
                cost: '$0.0000',
                status: 'In Progress',
                sentiment: 'positive',
                provider: `${currentProv.name} (IP Route)`,
                latency: `${liveLatency}ms`,
                jitter: `${liveJitter}ms`,
                sentimentTrend: [50, 55, 60, 65, 70, 75, 80],
                isMuted: false,
                isRecording: false
              });
            }, 1500);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleHangUp = () => {
    setSoftphoneStatus('ended');
    setConnectionStage('Colgando...');
    addSipLog(`SIP/2.0 BYE sent (Agent Hangup)`);
    addSipLog(`RTCP PeerConnection closed.`);
    const currentProv = providers.find(p => p.id === selectedProviderId) || { name: 'Twilio' };
    
    setTimeout(() => {
      setSoftphoneStatus('idle');
      const finalCost = (softphoneDuration * (getCostPerMinute() / 60)).toFixed(3);
      const newHistoryItem = {
        id: 'h_' + Date.now().toString(),
        number: phoneNumber || 'Número Desconocido',
        name: 'Llamada Saliente',
        timestamp: 'Ahora',
        status: 'completed',
        duration: formatDuration(softphoneDuration),
        provider: currentProv.name,
        cost: `$${finalCost}`
      };
      setCallHistory(prev => [newHistoryItem, ...prev]);
      setActiveCall(null);
      setIsMuted(false);
      setIsRecording(false);
    }, 1500);
  };

  const triggerSoftphoneCall = (name: string, number: string) => {
    setPhoneNumber(number);
    setSoftphoneOpen(true);
    handleDial(number, name);
  };

  const sentimentData = activeCall?.sentimentTrend.map((val: number, i: number) => ({ time: i, value: val }));

  const transcription: ChatMessage[] = [
    { id: '1', sender: 'Marta García', role: 'agent', text: 'Hola Juan, gracias por atenderme. ¿Cómo va todo con el onboarding?', timestamp: '00:05', sentiment: 'neutral' },
    { id: '2', sender: 'Juan Pérez', role: 'customer', text: 'Hola Marta, la verdad es que bien, aunque el tema del presupuesto me tiene algo preocupado.', timestamp: '00:15', sentiment: 'negative' },
    { id: '3', sender: 'Marta García', role: 'agent', text: 'Entiendo perfectamente. Justo estuve revisando tu caso y podemos hacer un ajuste del 15% si cerramos el plan anual hoy.', timestamp: '00:45', sentiment: 'positive' },
    { id: '4', sender: 'Juan Pérez', role: 'customer', text: 'Vaya, eso cambia las cosas. Me parece genial. Enviame el correo mañana con la propuesta formal.', timestamp: '01:20', sentiment: 'positive' },
    { id: '5', sender: 'Marta García', role: 'agent', text: 'Hecho. Te lo mando mañana a primera hora. También agendamos la reunión de seguimiento para el viernes.', timestamp: '01:45', sentiment: 'positive' },
  ];

  const actionItems = [
    { id: 'ai1', text: 'Enviar propuesta formal con ajuste del 15%', type: 'email', dueDate: 'Mañana', completed: false },
    { id: 'ai2', text: 'Reunión de seguimiento estratégica', type: 'event', dueDate: 'Viernes', completed: false },
  ];

  const chatThreads = [
    { id: 't1', name: 'Miguel Rojas', lastMsg: '¿Cuándo empezamos?', time: '2m ago', priority: 'High', type: 'WhatsApp' },
    { id: 't2', name: 'Ana Silva', lastMsg: 'Gracias por el soporte.', time: '15m ago', priority: 'Low', type: 'Instagram' },
    { id: 't3', name: 'Empresa XYZ', lastMsg: 'Solicitud de factura.', time: '1h ago', priority: 'Medium', type: 'Email' },
  ];

  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'voip_providers'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProviders(data.list || []);
        setRoutingRule(data.routingRule || 'cost');
      } else {
        setProviders([
          { 
            id: '1', name: 'Twilio', status: 'Inactivo', costPerMinute: '$0.015', lastUpdated: new Date().toISOString(), type: 'api', isDefault: false,
            dynamicLinks: [{ id: 'l1', label: 'Billing Dashboard', url: 'https://console.twilio.com/billing' }]
          },
          { 
            id: '2', name: 'Zoho Voice', status: 'Activo', costPerMinute: '$0.020', lastUpdated: new Date().toISOString(), type: 'iframe', isDefault: true,
            dynamicLinks: [{ id: 'l2', label: 'Admin Panel', url: 'https://voice.zoho.com/admin' }]
          }
        ]);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/voip_providers'));

    return () => unsub();
  }, []);

  const handleSaveConfig = async () => {
    if (!editingProvider) return;
    
    try {
      let updatedList = [...providers];
      
      if (editingProvider.isDefault) {
        updatedList = updatedList.map(p => ({ ...p, isDefault: false }));
      }

      const existingIndex = updatedList.findIndex(p => p.id === editingProvider.id);
      if (existingIndex >= 0) {
        updatedList[existingIndex] = { ...editingProvider, lastUpdated: new Date().toISOString() };
      } else {
        updatedList.push({ ...editingProvider, id: Date.now().toString(), lastUpdated: new Date().toISOString() });
      }

      await setDoc(doc(db, 'settings', 'voip_providers'), {
        list: updatedList,
        routingRule
      }, { merge: true });
      
      setIsEditing(false);
      setEditingProvider(null);
      setTestStatus('idle');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/voip_providers');
    }
  };

  const testConnection = () => {
    setTestStatus('testing');
    setTimeout(() => {
      if (editingProvider?.type === 'api' && (!editingProvider.apiKey || !editingProvider.accountId)) {
        setTestStatus('error');
      } else if (editingProvider?.type === 'iframe' && !editingProvider.iframeUrl) {
        setTestStatus('error');
      } else {
        setTestStatus('success');
      }
    }, 1500);
  };

  const openEditor = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
    } else {
      setEditingProvider({
        id: '',
        name: '',
        status: 'Inactivo',
        costPerMinute: '$0.00',
        lastUpdated: new Date().toISOString(),
        type: 'api',
        isDefault: false,
        dynamicLinks: []
      });
    }
    setIsEditing(true);
    setTestStatus('idle');
    setShowSecrets(false);
  };

  const addDynamicLink = () => {
    if (!editingProvider) return;
    setEditingProvider({
      ...editingProvider,
      dynamicLinks: [...(editingProvider.dynamicLinks || []), { id: Date.now().toString(), label: '', url: '' }]
    });
  };

  const updateDynamicLink = (id: string, field: 'label' | 'url', value: string) => {
    if (!editingProvider) return;
    setEditingProvider({
      ...editingProvider,
      dynamicLinks: editingProvider.dynamicLinks?.map(link => 
        link.id === id ? { ...link, [field]: value } : link
      )
    });
  };

  const removeDynamicLink = (id: string) => {
    if (!editingProvider) return;
    setEditingProvider({
      ...editingProvider,
      dynamicLinks: editingProvider.dynamicLinks?.filter(link => link.id !== id)
    });
  };

  const moveProvider = (index: number, direction: 'up' | 'down') => {
    const newProviders = [...providers];
    if (direction === 'up' && index > 0) {
      [newProviders[index - 1], newProviders[index]] = [newProviders[index], newProviders[index - 1]];
    } else if (direction === 'down' && index < newProviders.length - 1) {
      [newProviders[index + 1], newProviders[index]] = [newProviders[index], newProviders[index + 1]];
    }
    setProviders(newProviders);
    setDoc(doc(db, 'settings', 'voip_providers'), { list: newProviders }, { merge: true });
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword === 'admin123') { // Simulated auth check
      setShowSecrets(true);
      setAuthPrompt(false);
      setAuthPassword('');
    } else {
      alert('Contraseña incorrecta');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando sistema de llamadas...</div>;

  const defaultProvider = providers.find(p => p.isDefault);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Centro de Inteligencia en Comunicaciones</h2>
          <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-[0.2em] italic">Orquestación de Voz, NLP y Enrutamiento Multinivel</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'monitor', label: 'Monitor VoIP', icon: Activity },
            { id: 'inbox', label: 'Bandeja Omnicanal', icon: MessageSquare },
            { id: 'routing', label: 'Enrutamiento IA', icon: BrainCircuit },
            { id: 'directory', label: 'Proveedores', icon: Settings },
            { id: 'logs', label: 'Auditoría', icon: Phone },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedLog(null); }}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          
          {/* MONITOR VOIP - Lógica de Supervivencia y Sentimiento */}
          {activeTab === 'monitor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
               {/* Left Column: Active Call Dashboard */}
               <div className="lg:col-span-8 flex flex-col gap-6">
                  {activeCall ? (
                    <motion.div 
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl overflow-hidden relative"
                    >
                       <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse" />
                       <div className="flex justify-between items-start mb-8">
                          <div className="flex items-center gap-4">
                             <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 relative">
                                <PhoneOutgoing className="w-8 h-8" />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                                </span>
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{activeCall.customer}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                   <User className="w-3 h-3" /> Agente: <span className="text-blue-600">{activeCall.agent}</span>
                                </p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-3xl font-mono font-black text-gray-900">{activeCall.duration}</p>
                             <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{activeCall.provider}</span>
                          </div>
                       </div>

                       {/* Waveform Visualization */}
                       <div className="bg-gray-900 rounded-3xl p-8 mb-8 relative overflow-hidden group">
                          <div className="flex items-end justify-between gap-1 h-32">
                             {Array.from({ length: 40 }).map((_, i) => (
                               <motion.div 
                                 key={i}
                                 animate={{ height: [10, Math.random() * 80 + 20, 10] }}
                                 transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                                 className="w-full bg-blue-500 opacity-50 rounded-full"
                               />
                             ))}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <X className="w-4 h-4" /> Intervenir Llamada
                             </button>
                          </div>
                       </div>

                       {/* Bottom Stats */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sentimiento IA</p>
                             <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${activeCall.sentiment === 'positive' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeCall.sentiment === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                                   {activeCall.sentiment}
                                </span>
                             </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Latencia / Jitter</p>
                             <p className="text-xs font-black text-gray-900 font-mono">{activeCall.latency || '24ms'} ({activeCall.jitter || '1.2ms'})</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Grabación</p>
                             <div className="flex items-center gap-2 text-red-500">
                                <div className={`h-2 w-2 rounded-full ${activeCall.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                   {activeCall.isRecording ? 'En Curso (REC)' : 'Pausada'}
                                </span>
                             </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Costo Acumulado</p>
                             <p className="text-xs font-black text-green-600 font-mono">{activeCall.cost || '$0.0000'}</p>
                          </div>
                       </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-20 bg-white border-2 border-dashed border-gray-200 rounded-[3rem] text-center">
                       <Mic className="w-16 h-16 text-gray-300 mb-6" />
                       <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Sin llamadas activas</h3>
                       <p className="text-xs text-gray-400 max-w-xs mt-2 uppercase tracking-widest">El sistema está escuchando. Las llamadas se mostrarán aquí en tiempo real.</p>
                    </div>
                  )}

                  {/* Sentiment Trend Chart */}
                  {activeCall && (
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Evolución del Sentimiento (IA NLP)
                       </h4>
                       <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={sentimentData}>
                                <defs>
                                   <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', color: '#fff' }}
                                  labelStyle={{ display: 'none' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#sentimentGradient)" />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                  )}
               </div>

               {/* Right Column: Mini Logs */}
               <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl h-full flex flex-col p-6">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" /> Próximas Llamadas
                     </h4>
                     <div className="space-y-4 flex-1">
                        {[
                          { time: '12:00', name: 'Miguel Rojas', type: 'Seguimiento', priority: 'High', number: '+34 690 123 456' },
                          { time: '13:30', name: 'Ana Silva', type: 'Onboarding', priority: 'Low', number: '+54 9 11 9876 5432' },
                          { time: '15:00', name: 'TechCorp CEO', type: 'Demos', priority: 'Critical', number: '+1 415 555 2671' },
                        ].map((call, i) => (
                          <div 
                             key={i} 
                             onClick={() => triggerSoftphoneCall(call.name, call.number)}
                             className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-[#00F0FF]/30 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden"
                          >
                             {call.priority === 'Critical' && <div className="absolute top-0 right-0 h-full w-1 bg-red-500" />}
                             <div>
                                <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{call.name}</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{call.type}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-xs font-black text-blue-600 font-mono italic">{call.time}</p>
                                <button className="text-[9px] font-black uppercase text-gray-400 group-hover:text-[#00F0FF]">Llamar</button>
                             </div>
                          </div>
                        ))}
                     </div>
                     <button className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00F0FF] transition-all shadow-xl">
                        Agenda Inteligente
                     </button>
                  </div>
               </div>
            </div>
          )}

          {/* BANDEJA OMNICANAL */}
          {activeTab === 'inbox' && (
            <div className="flex gap-6 h-[calc(100vh-16rem)] min-h-[600px]">
               {/* Sidebar: Threads */}
               <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
                     <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                           type="text" 
                           placeholder="Buscar conversación..."
                           className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-[#00F0FF] border-none outline-none"
                        />
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {['All', 'WhatsApp', 'Email', 'Instagram', 'Voicemail'].map(f => (
                          <button 
                             key={f}
                             onClick={() => setInboxFilter(f.toLowerCase())}
                             className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                inboxFilter === f.toLowerCase() ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-400 border-gray-100 hover:border-[#00F0FF]'
                             }`}
                          >
                             {f}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl flex-1 overflow-y-auto p-4 space-y-3">
                     {chatThreads.map(thread => (
                       <div key={thread.id} className="p-5 rounded-[2rem] hover:bg-gray-50 transition-all cursor-pointer group relative border border-transparent hover:border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center font-black text-[10px] text-gray-900">{thread.name.charAt(0)}</div>
                                <h5 className="text-xs font-black text-gray-900 uppercase tracking-tighter">{thread.name}</h5>
                             </div>
                             <span className="text-[9px] font-black text-gray-400 uppercase">{thread.time}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate mb-3 pl-11">{thread.lastMsg}</p>
                          <div className="flex items-center gap-3 pl-11">
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${
                                thread.priority === 'High' ? 'bg-red-500 text-white' : 
                                thread.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                             }`}>
                                {thread.priority} PRIORITY
                             </span>
                             <div className="flex items-center gap-1 text-[8px] font-black text-[#00F0FF] uppercase tracking-widest">
                                <MessageCircle className="w-3 h-3" /> {thread.type}
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               {/* Chat Content */}
               <div className="hidden lg:flex flex-1 flex-col gap-4">
                  <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl flex-1 flex flex-col p-8 overflow-hidden">
                     <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-50 overflow-visible">
                        <div className="flex gap-4 items-center">
                           <div className="h-14 w-14 bg-[#00F0FF] rounded-[1.5rem] flex items-center justify-center text-white text-xl font-black italic shadow-lg rotate-3 group-hover:rotate-0 transition-transform">MR</div>
                           <div>
                              <h5 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Miguel Rojas</h5>
                              <div className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em] italic flex items-center gap-2">
                                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Escribiendo Respuesta IA...
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button 
                              onClick={() => triggerSoftphoneCall('Miguel Rojas', '+34 690 123 456')}
                              className="h-12 w-12 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 hover:text-[#00F0FF] transition-all hover:shadow-md"
                            >
                              <Phone className="w-5 h-5" />
                            </button>
                           <button className="h-12 w-12 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 transition-all hover:shadow-md"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto space-y-8 px-4 py-4 custom-scrollbar">
                        {transcription.map(msg => (
                          <div key={msg.id} className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}>
                             <div className={`max-w-[80%] p-6 rounded-[2rem] relative group ${
                                msg.role === 'customer' ? 'bg-gray-50 text-gray-700 rounded-bl-none border border-gray-100' : 'bg-gray-900 text-white rounded-br-none shadow-2xl'
                             }`}>
                                {msg.sentiment === 'negative' && (
                                   <div className="absolute -top-3 -left-3 bg-red-600 text-white p-1 rounded-full shadow-lg">
                                      <AlertCircle className="w-4 h-4" />
                                   </div>
                                )}
                                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                <div className="flex justify-between items-center mt-4">
                                   <p className={`text-[8px] font-black uppercase tracking-widest ${msg.role === 'customer' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.timestamp} • SENTIMIENTO: {msg.sentiment?.toUpperCase()}
                                   </p>
                                   {msg.role === 'agent' && <ShieldCheck className="w-3 h-3 text-blue-400" />}
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>

                     <div className="mt-8 pt-8 border-t border-gray-100 flex gap-4">
                        <div className="relative flex-1">
                           <div className="absolute left-6 top-1/2 -translate-y-1/2">
                              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                           </div>
                           <input 
                              type="text" 
                              placeholder="Redactar con Kaivincia Intelligence..."
                              className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[2rem] text-sm font-medium border-none outline-none focus:ring-4 focus:ring-[#00F0FF]/10 transition-all"
                           />
                        </div>
                        <button className="h-16 w-16 bg-gray-900 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-[#00F0FF] transition-all shadow-2xl active:scale-95 group">
                           <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                      </div>
                  </div>
               </div>
            </div>
          )}
          {/* DIRECTORIO VOIP */}
          {activeTab === 'directory' && (
            <div className="space-y-8">
               {!isEditing ? (
                <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Nodos de Interconexión</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Gestión de Carriers y Terminación de Voz</p>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => openEditor()}
                        className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00F0FF] transition-all shadow-xl flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Fusionar Nuevo Carrier
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white text-gray-400 font-black border-b border-gray-100 uppercase text-[9px] tracking-[0.3em]">
                        <tr>
                          <th className="px-10 py-6">Estructura / Nodo</th>
                          <th className="px-10 py-6">Sincronización</th>
                          <th className="px-10 py-6">Tarificación / Min</th>
                          <th className="px-10 py-6">Estabilidad (24h)</th>
                          <th className="px-10 py-6">Última Revisión</th>
                          {isAdmin && <th className="px-10 py-6 text-right">Mantenimiento</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {providers.map((provider) => (
                          <tr key={provider.id} className="hover:bg-blue-50/30 bg-white group transition-colors">
                            <td className="px-10 py-8">
                              <div className="font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter italic text-base">
                                {provider.name}
                                {provider.isDefault && <span className="bg-blue-600 text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200">Main Route</span>}
                              </div>
                              <div className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-widest">{provider.type === 'api' ? 'Backbone Engine' : 'Bridge Interface'}</div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-3">
                                  <div className={`h-2.5 w-2.5 rounded-full ${provider.status === 'Activo' ? 'bg-green-500 shadow-xl shadow-green-100 animate-pulse' : 'bg-gray-200'}`} />
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${provider.status === 'Activo' ? 'text-green-600' : 'text-gray-400'}`}>
                                    {provider.status === 'Activo' ? 'Online Peak' : 'Offline / Reserved'}
                                  </span>
                               </div>
                            </td>
                            <td className="px-10 py-8 font-mono font-black text-gray-900 text-xs italic">{provider.costPerMinute}</td>
                            <td className="px-10 py-8">
                               <div className="h-10 w-32 filter drop-shadow-sm">
                                  <ResponsiveContainer width="100%" height="100%">
                                     <LineChart data={(provider.qualityTrend || [80, 85, 82, 90, 88, 92, 95]).map((v, i) => ({ v, i }))}>
                                        <Line type="stepAfter" dataKey="v" stroke={provider.status === 'Activo' ? "#3b82f6" : "#cbd5e1"} strokeWidth={3} dot={false} />
                                     </LineChart>
                                  </ResponsiveContainer>
                               </div>
                            </td>
                            <td className="px-10 py-8 text-gray-400 text-[10px] font-black font-mono uppercase tracking-widest">{new Date(provider.lastUpdated).toLocaleDateString()}</td>
                            {isAdmin && (
                              <td className="px-10 py-8 text-right">
                                <button onClick={() => openEditor(provider)} className="p-3 bg-gray-50 text-gray-400 hover:text-white hover:bg-gray-900 rounded-2xl transition-all shadow-sm">
                                  <Edit2 className="w-5 h-5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                 <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-900">Configuración de Proveedor</h3>
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proveedor</label>
                      <input 
                        type="text" 
                        value={editingProvider?.name}
                        onChange={(e) => setEditingProvider({...editingProvider!, name: e.target.value})}
                        placeholder="Ej: Twilio, Vonage..."
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Minuto (Estimado)</label>
                      <input 
                        type="text" 
                        value={editingProvider?.costPerMinute}
                        onChange={(e) => setEditingProvider({...editingProvider!, costPerMinute: e.target.value})}
                        placeholder="Ej: $0.015"
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select 
                        value={editingProvider?.status}
                        onChange={(e) => setEditingProvider({...editingProvider!, status: e.target.value as any})}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border bg-white"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Integración</label>
                      <select 
                        value={editingProvider?.type}
                        onChange={(e) => setEditingProvider({...editingProvider!, type: e.target.value as any})}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border bg-white"
                      >
                        <option value="api">API Directa (Twilio, Asterisk)</option>
                        <option value="iframe">Webphone Iframe (Zoho, Aircall)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Links Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Enlaces Dinámicos (Dashboards, Webhooks)</label>
                      <button onClick={addDynamicLink} className="text-xs text-[#00F0FF] font-medium hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Añadir Enlace
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editingProvider?.dynamicLinks?.map(link => (
                        <div key={link.id} className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Etiqueta (Ej: Billing Dashboard)"
                            value={link.label}
                            onChange={(e) => updateDynamicLink(link.id, 'label', e.target.value)}
                            className="w-1/3 border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border text-sm"
                          />
                          <input 
                            type="url" 
                            placeholder="URL (Ej: https://...)"
                            value={link.url}
                            onChange={(e) => updateDynamicLink(link.id, 'url', e.target.value)}
                            className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border text-sm"
                          />
                          <button onClick={() => removeDynamicLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!editingProvider?.dynamicLinks || editingProvider.dynamicLinks.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No hay enlaces configurados.</p>
                      )}
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-500" /> Credenciales Técnicas
                      </h4>
                      {!showSecrets && (
                        <button onClick={() => setAuthPrompt(true)} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded-md shadow-sm hover:bg-gray-50 font-medium flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Mostrar Secretos
                        </button>
                      )}
                      {showSecrets && (
                        <button onClick={() => setShowSecrets(false)} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded-md shadow-sm hover:bg-gray-50 font-medium flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Ocultar Secretos
                        </button>
                      )}
                    </div>

                    {editingProvider?.type === 'iframe' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL del Webphone (Iframe)</label>
                        <input 
                          type={showSecrets ? "url" : "password"}
                          value={editingProvider.iframeUrl || ''}
                          onChange={(e) => setEditingProvider({...editingProvider, iframeUrl: e.target.value})}
                          placeholder="https://voice.zoho.com/webphone/..."
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border font-mono text-sm"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account ID / SID</label>
                          <input 
                            type={showSecrets ? "text" : "password"}
                            value={editingProvider?.accountId || ''}
                            onChange={(e) => setEditingProvider({...editingProvider!, accountId: e.target.value})}
                            placeholder="••••••••••••••••"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Auth Token</label>
                          <input 
                            type={showSecrets ? "text" : "password"}
                            value={editingProvider?.apiKey || ''}
                            onChange={(e) => setEditingProvider({...editingProvider!, apiKey: e.target.value})}
                            placeholder="••••••••••••••••"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editingProvider?.isDefault}
                          onChange={(e) => setEditingProvider({...editingProvider!, isDefault: e.target.checked})}
                          className="rounded border-gray-300 text-[#00F0FF] focus:ring-[#00F0FF] w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-900">Establecer como Proveedor Predeterminado</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {testStatus === 'success' && <span className="text-sm text-green-600 flex items-center gap-1 font-medium"><CheckCircle2 className="w-4 h-4"/> Conexión Exitosa</span>}
                      {testStatus === 'error' && <span className="text-sm text-red-600 flex items-center gap-1 font-medium"><AlertCircle className="w-4 h-4"/> Error de Credenciales</span>}
                      
                      <button 
                        onClick={testConnection}
                        disabled={testStatus === 'testing'}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                      >
                        {testStatus === 'testing' ? 'Probando...' : 'Test de Conexión'}
                      </button>
                      <button 
                        onClick={handleSaveConfig}
                        disabled={testStatus === 'testing'}
                        className="bg-[#00F0FF] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2 shadow-sm"
                      >
                        <Save className="h-4 w-4" /> Guardar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ENRUTAMIENTO IA */}
          {activeTab === 'routing' && (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                  <div className="flex justify-between items-start mb-10">
                     <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Lógica de Enrutamiento Inteligente</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configuración de flujos basados en intención y capacidad</p>
                     </div>
                     <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all">
                        <Plus className="w-4 h-4" /> Nueva Regla Maestro
                     </button>
                  </div>

                  {/* Visual Drag & Drop Simulation */}
                  <div className="relative mb-16 p-12 bg-gray-50/50 rounded-[4rem] border border-gray-100/50 overflow-hidden group">
                     <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
                     
                     <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-6">
                        {/* Source Node */}
                        <motion.div 
                           whileHover={{ y: -5 }}
                           className="w-full lg:w-64 p-8 bg-white rounded-[2.5rem] shadow-2xl border border-blue-100 flex flex-col items-center relative z-10"
                        >
                           <div className="h-16 w-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
                              <PhoneIncoming className="w-8 h-8" />
                           </div>
                           <p className="text-xs font-black uppercase tracking-widest text-gray-900 italic">Core Incoming</p>
                           <p className="text-[9px] font-black uppercase text-blue-500 mt-1">Llamada Entrante</p>
                           <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-md cursor-pointer" />
                        </motion.div>

                        <div className="rotate-90 lg:rotate-0 flex items-center">
                           <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-gray-900 rounded-full" />
                           <ChevronDown className="w-6 h-6 text-gray-900 -ml-3 rotate-270 lg:rotate-270" />
                        </div>

                        {/* IA Processor Node */}
                        <motion.div 
                           whileHover={{ scale: 1.02 }}
                           className="w-full lg:w-96 p-10 bg-gray-900 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center relative z-10 overflow-hidden"
                        >
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient-x" />
                           <div className="h-20 w-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center text-blue-400 mb-6 shadow-inner">
                              <BrainCircuit className="w-12 h-12 animate-pulse" />
                           </div>
                           <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] italic mb-3">Analizador de Intención IA</h4>
                           <div className="flex flex-wrap justify-center gap-2">
                              <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase rounded-full border border-blue-500/30">NLP DeepSeek-V3</span>
                              <span className="px-4 py-1.5 bg-green-500/20 text-green-400 text-[9px] font-black uppercase rounded-full border border-green-500/30">Fast-Track</span>
                              <span className="px-4 py-1.5 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase rounded-full border border-purple-500/30">Sentiment Analysis</span>
                           </div>
                           <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-900 rounded-full border-4 border-white shadow-md" />
                           <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-900 rounded-full border-4 border-white shadow-md" />
                        </motion.div>

                        <div className="rotate-90 lg:rotate-0 flex items-center">
                           <div className="w-16 h-1 bg-gradient-to-r from-gray-900 to-[#00F0FF] rounded-full" />
                           <ChevronDown className="w-6 h-6 text-[#00F0FF] -ml-3 rotate-270 lg:rotate-270" />
                        </div>

                        {/* Target Node */}
                        <motion.div 
                           whileHover={{ y: 5 }}
                           className="w-full lg:w-72 p-8 bg-white rounded-[2.5rem] shadow-2xl border border-[#00F0FF]/20 flex flex-col items-center relative z-10"
                        >
                           <div className="h-16 w-16 bg-[#00F0FF]/10 rounded-3xl flex items-center justify-center text-[#00F0FF] mb-4 shadow-lg shadow-[#00F0FF]/10">
                              <ShieldCheck className="w-8 h-8" />
                           </div>
                           <p className="text-xs font-black uppercase tracking-widest text-gray-900 italic">Agente Certificado X</p>
                           <div className="mt-3 w-full bg-gray-50 rounded-full h-1 overflow-hidden">
                              <div className="h-full bg-[#00F0FF] w-[98%]" />
                           </div>
                           <p className="text-[8px] font-black text-gray-400 uppercase mt-2 tracking-widest italic">Matching Accuracy: 99.4%</p>
                        </motion.div>
                     </div>

                     {/* Connection Lines (SVGs or absolute divs) */}
                     <div className="hidden lg:block absolute inset-0 pointer-events-none">
                        {/* More complex SVG connections could go here */}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Parámetros de Auditoría</h4>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase text-gray-600">Detección de Tono</span>
                              <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                                 <div className="absolute top-1 right-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                              </div>
                           </div>
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase text-gray-600">Extracción de Leads</span>
                              <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                                 <div className="absolute top-1 right-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                              </div>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-gray-600">Silencio Crítico (Alert)</span>
                              <div className="w-12 h-6 bg-gray-200 rounded-full relative">
                                 <div className="absolute top-1 left-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Distribución por Carga</h4>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">* Balance automático basado en el Módulo de Talento (5% libre min)</p>
                           <div className="space-y-3">
                              {[
                                { name: 'Ventas USA', load: 85, color: 'bg-blue-600' },
                                { name: 'Soporte VIP', load: 30, color: 'bg-green-500' },
                                { name: 'Onboarding', load: 55, color: 'bg-amber-500' },
                              ].map(row => (
                                <div key={row.name}>
                                   <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1">
                                      <span>{row.name}</span>
                                      <span>{row.load}%</span>
                                   </div>
                                   <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div className={`h-full ${row.color}`} style={{ width: `${row.load}%` }} />
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* REGISTRO DE LLAMADAS + TRANSCRIPCIÓN IA */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
               {!selectedLog ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Auditoría de Llamadas</h3>
                      <p className="text-sm text-gray-500 mt-1">Registro inmutable de interacciones entre Agentes y Clientes/Alumnos.</p>
                    </div>
                    <div className="flex gap-2">
                       <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" /> Exportar Reporte
                       </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Agente</th>
                          <th className="px-6 py-4">Destino</th>
                          <th className="px-6 py-4">Duración</th>
                          <th className="px-6 py-4">Sentimiento</th>
                          <th className="px-6 py-4 text-right">Transcripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {[
                          { id: '1', date: 'Hoy, 10:30 AM', agent: 'Marta García', target: 'Juan Pérez (CEO)', duration: '02:45', provider: 'Twilio', status: 'Success', sentiment: 'Positive' },
                          { id: '2', date: 'Ayer, 15:45 PM', agent: 'Carlos Ruiz', target: 'TechSolutions Inc.', duration: '12:10', provider: 'Zoho Voice', status: 'Success', sentiment: 'Neutral' },
                          { id: '3', date: 'Ayer, 09:20 AM', agent: 'Ana Silva', target: 'Miguel Rojas', duration: '05:00', provider: 'Twilio', status: 'Failed', sentiment: 'N/A' },
                        ].map((log, i) => (
                          <tr key={i} className="hover:bg-blue-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedLog(log)}>
                            <td className="px-6 py-4">
                               <div className={`h-2 w-2 rounded-full ${log.status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`} />
                            </td>
                            <td className="px-6 py-4">
                               <p className="font-black text-gray-900 uppercase text-[11px] tracking-tighter">{log.agent}</p>
                               <p className="text-[10px] text-gray-400 font-bold">{log.date}</p>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-tighter">{log.target}</td>
                            <td className="px-6 py-4 font-mono text-[11px] text-gray-900">{log.duration}</td>
                            <td className="px-6 py-4">
                               <span className={`text-[10px] font-black uppercase tracking-widest ${log.sentiment === 'Positive' ? 'text-green-600' : 'text-gray-400'}`}>
                                  {log.sentiment}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1 w-full text-[10px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl group-hover:bg-blue-100 transition-all">
                                <Sparkles className="w-3 h-3" /> Ver Análisis IA
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
               ) : (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-6"
                 >
                    <button 
                       onClick={() => setSelectedLog(null)}
                       className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00F0FF] hover:text-gray-900"
                    >
                       <ChevronUp className="w-4 h-4 rotate-270" /> Volver al Registro
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                       {/* Transcription Column */}
                       <div className="lg:col-span-8">
                          <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl p-8 h-full flex flex-col">
                             <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
                                <div>
                                   <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Análisis de Transcripción</h3>
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: {selectedLog.id} • {selectedLog.date}</p>
                                </div>
                                <div className="flex gap-3">
                                   <button className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
                                      <PlayCircle className="w-6 h-6" />
                                   </button>
                                   <button className="px-6 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                                      Guardar Reporte
                                   </button>
                                </div>
                             </div>

                             <div className="flex-1 space-y-8 overflow-y-auto pr-4 mb-2">
                                {transcription.map((msg, i) => (
                                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'customer' ? 'flex-row' : 'flex-row-reverse'}`}>
                                     <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black ${msg.role === 'customer' ? 'bg-gray-400' : 'bg-[#00F0FF]'}`}>
                                        {msg.sender.charAt(0)}
                                     </div>
                                     <div className={`max-w-[70%] group`}>
                                        <div className={`p-5 rounded-[2rem] border relative ${
                                          msg.role === 'customer' ? 'bg-white border-gray-100 rounded-tl-none' : 'bg-blue-600 text-white border-blue-500 shadow-lg rounded-tr-none'
                                        }`}>
                                           <div className="flex justify-between items-center mb-2">
                                              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{msg.sender}</span>
                                              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{msg.timestamp}</span>
                                           </div>
                                           <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                                           <button className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#00F0FF] hover:scale-125">
                                              <Zap className="w-4 h-4 fill-current" />
                                           </button>
                                        </div>
                                     </div>
                                  </div>
                                ))}
                             </div>

                             {/* Audio Player UX */}
                             <div className="bg-gray-900/5 backdrop-blur-md rounded-3xl p-4 mt-6 flex items-center gap-6 border border-gray-100">
                                <button className="h-10 w-10 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg"><PlayCircle className="w-5 h-5" /></button>
                                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden relative">
                                   <div className="absolute inset-0 bg-blue-600 w-1/3" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 font-mono">01:12 / 02:45</span>
                             </div>
                          </div>
                       </div>

                       {/* Insights Column */}
                       <div className="lg:col-span-4 space-y-6">
                          {/* Sentiment Widget */}
                          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl overflow-hidden relative">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Humor del Cliente
                             </h4>
                             <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 h-3 bg-gradient-to-r from-red-500 via-cyan-500/100 to-green-500 rounded-full relative">
                                   <motion.div 
                                      initial={{ left: '0%' }}
                                      animate={{ left: '85%' }}
                                      className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-gray-900 rounded-full shadow-lg"
                                   />
                                </div>
                                <span className="text-xs font-black text-green-600 uppercase italic">Éxito</span>
                             </div>
                             <p className="text-[10px] text-gray-400 italic">El cliente comenzó escéptico pero cerró con un sentimiento de alta confianza.</p>
                          </div>

                          {/* Action Items */}
                          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <ListTodo className="w-4 h-4" /> Compromisos Pactados
                             </h4>
                             <div className="space-y-4">
                                {actionItems.map(item => (
                                  <div key={item.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl relative overflow-hidden group">
                                     <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                          item.type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                        }`}>
                                           {item.type}
                                        </span>
                                        <span className="text-[9px] font-bold text-red-500">{item.dueDate}</span>
                                     </div>
                                     <p className="text-[11px] font-black text-gray-700 leading-tight mb-4">{item.text}</p>
                                     <button className="w-full py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg group-hover:scale-105">
                                        <Zap className="w-3 h-3" /> Convertir en Tarea
                                     </button>
                                  </div>
                                ))}
                             </div>
                          </div>

                          {/* NLP Tags */}
                          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Keywords Detectadas</h4>
                             <div className="flex flex-wrap gap-2">
                                {['Presupuesto', 'Plan Anual', '15% Off', 'Mañana', 'Reunión', 'Onboarding'].map(tag => (
                                  <span key={tag} className="px-3 py-1 bg-gray-50 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-widest border border-gray-100">{tag}</span>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               )}
            </div>
          )}

        </div>
      </div>

      {/* Auth Prompt Modal */}
      {authPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Re-Autenticación Requerida</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Para ver las credenciales de la API, ingresa tu contraseña de SuperAdmin.</p>
            
            <form onSubmit={handleAuthSubmit}>
              <input 
                type="password" 
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="Contraseña (simulación: admin123)"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] p-2 border mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setAuthPrompt(false); setAuthPassword(''); }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00F0FF] text-white rounded-lg font-medium hover:bg-[#00BFFF]"
                >
                  Verificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Softphone Toggle */}
      <div className="fixed bottom-8 right-8 z-[90]">
         <motion.button
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={() => setSoftphoneOpen(!softphoneOpen)}
           className="flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-full border border-gray-800 shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:border-[#00F0FF]/50 transition-all font-black text-xs uppercase tracking-widest"
         >
           <span className="relative flex h-3 w-3">
             {softphoneStatus === 'connected' ? (
               <>
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
               </>
             ) : (
               <>
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
               </>
             )}
           </span>
           <Phone className="w-4 h-4" />
           {softphoneStatus === 'connected' ? 'En Llamada...' : 'Softphone'}
         </motion.button>
      </div>

      {/* Softphone Dialer Drawer */}
      <AnimatePresence>
        {softphoneOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-28 right-8 z-[90] w-80 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col text-white"
          >
             {/* Softphone Header */}
             <div className="p-5 border-b border-slate-900 bg-gradient-to-r from-slate-900 to-transparent flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <Phone className="w-5 h-5 text-[#00F0FF]" />
                   <div>
                      <h4 className="text-xs font-black text-white italic tracking-tighter uppercase">Kaivincia Softphone</h4>
                      <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                        {softphoneStatus === 'idle' ? 'Listo / Sip OK' : 
                         softphoneStatus === 'calling' ? 'Estableciendo canal...' : 
                         softphoneStatus === 'connected' ? 'Llamada Conectada' : 'Llamada Finalizada'}
                      </p>
                   </div>
                </div>
                <button onClick={() => setSoftphoneOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                   <X className="w-4 h-4" />
                </button>
             </div>

             {/* Screen / Display */}
             <div className="p-5 bg-slate-950 border-b border-slate-900 text-center relative min-h-[90px] flex flex-col justify-center">
                {softphoneStatus === 'idle' ? (
                  <>
                     <input 
                       type="text"
                       value={phoneNumber}
                       onChange={e => setPhoneNumber(e.target.value)}
                       placeholder="Ingresar número..."
                       className="bg-transparent border-none text-center text-xl font-black font-mono text-white placeholder-slate-800 outline-none w-full"
                     />
                     {phoneNumber && (
                       <button 
                         onClick={() => setPhoneNumber('')}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-slate-500 hover:text-slate-300"
                       >
                         Limpiar
                       </button>
                     )}
                  </>
                ) : (
                  <div className="space-y-1">
                     <p className="text-xs font-mono text-slate-400">{phoneNumber || 'Número Privado'}</p>
                     <p className="text-lg font-black text-white italic uppercase tracking-widest animate-pulse">
                       {softphoneStatus === 'calling' ? 'Marcando...' : 
                        softphoneStatus === 'connected' ? 'Llamada Activa' : 'Colgando...'}
                     </p>
                     {softphoneStatus === 'connected' && (
                       <p className="text-sm font-mono font-black text-[#00F0FF]">{formatDuration(softphoneDuration)}</p>
                     )}
                  </div>
                )}
             </div>

             {/* Tabs / Subsections */}
             {softphoneStatus === 'idle' && (
               <div className="p-5 space-y-4">
                  {/* Carrier Selection */}
                  <div>
                     <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Carrier de Voz (Enrutador)</label>
                     <select 
                       value={selectedProviderId}
                       onChange={e => setSelectedProviderId(e.target.value)}
                       className="w-full bg-slate-900 text-xs font-bold text-slate-300 border border-slate-800 rounded-xl p-2.5 outline-none focus:border-[#00F0FF] transition-all"
                     >
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.costPerMinute}/m)</option>
                        ))}
                     </select>
                  </div>

                  {/* Dial Pad Grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                     {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
                       <button 
                         key={key}
                         onClick={() => {
                           setPhoneNumber(prev => prev + key);
                           playDTMFTone(key);
                         }}
                         className="h-12 bg-slate-900 hover:bg-slate-800 border border-slate-800/50 hover:border-slate-700/50 text-white font-mono font-black rounded-2xl text-base transition-all active:scale-95 flex items-center justify-center shadow-sm"
                       >
                         {key}
                       </button>
                     ))}
                  </div>

                  {/* Call Trigger button */}
                  <button 
                    onClick={() => handleDial()}
                    disabled={!phoneNumber}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                     <Phone className="w-4 h-4" /> Iniciar Llamada
                  </button>
               </div>
             )}

             {softphoneStatus !== 'idle' && (
               <div className="p-5 space-y-6">
                  {/* ZohoPhone / Iframe Webphone simulation */}
                  {providers.find(p => p.id === selectedProviderId)?.type === 'iframe' && (
                     <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 relative overflow-hidden">
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                           <span className="h-1.5 w-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                           <span className="text-[6px] font-mono font-bold text-[#00F0FF]">IFRAME WEBRTC DEVICE</span>
                        </div>
                        <div className="w-full flex justify-between text-[7px] text-slate-500 font-mono">
                           <span>Status: connected</span>
                           <span>TLS 1.3 Active</span>
                        </div>
                        <div className="h-10 w-full bg-slate-950 rounded-lg flex items-center justify-around border border-slate-800/60 p-1">
                           <span className="text-[7px] text-slate-400 font-mono">Input Level</span>
                           <div className="h-2 w-16 bg-slate-800 rounded relative overflow-hidden">
                              <motion.div 
                                animate={{ width: ['15%', '85%', '35%', '90%', '25%'] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="h-full bg-green-500" 
                              />
                           </div>
                        </div>
                        <p className="text-[7px] text-[#00F0FF] tracking-wider uppercase font-mono leading-tight">Canal de Voz enlazado vía Zoho Phone WebRTC SDK</p>
                     </div>
                  )}

                  {/* Audio controls */}
                  <div className="grid grid-cols-3 gap-3">
                     <button 
                       onClick={() => {
                         setIsMuted(!isMuted);
                         addSipLog(isMuted ? "SIP/2.0 Audio stream UNMUTED" : "SIP/2.0 Audio stream MUTED");
                       }}
                       className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
                         isMuted ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                       }`}
                     >
                        <Mic className="w-4 h-4" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Silencio</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsSpeaker(!isSpeaker);
                         addSipLog(isSpeaker ? "Audio output routed to Headset" : "Audio output routed to Speakerphone (Boosted gain)");
                       }}
                       className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
                         isSpeaker ? 'bg-blue-500/10 border-[#00F0FF] text-[#00F0FF]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                       }`}
                     >
                        <Activity className="w-4 h-4" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Altavoz</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsRecording(!isRecording);
                         addSipLog(isRecording ? "NLP RECORDER STOPPED" : "NLP RECORDER ACTIVE - Real-time NLP stream transcription triggered");
                       }}
                       className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
                         isRecording ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                       }`}
                     >
                        <span className="relative flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-ping"></span>
                        </span>
                        <span className="text-[7px] font-black uppercase tracking-widest">Grabar</span>
                     </button>
                  </div>

                  {/* End call button */}
                  <button 
                    onClick={handleHangUp}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                     <X className="w-4 h-4" /> Terminar Llamada
                  </button>
               </div>
             )}

             {/* Collapsible SIP Console Log */}
             <div className="border-t border-slate-900 bg-slate-950/40">
                <button 
                  onClick={() => setShowSipConsole(!showSipConsole)}
                  className="w-full px-5 py-2.5 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-slate-900/10 transition-all border-none outline-none"
                >
                   <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" /> Consola de Registro SIP / WebRTC
                   </span>
                   <span className="font-mono text-[9px]">{showSipConsole ? '[-]' : '[+]'}</span>
                </button>
                {showSipConsole && (
                   <div className="px-5 pb-5 max-h-32 overflow-y-auto font-mono text-[7px] text-green-400 bg-slate-950/80 p-3 space-y-1 border-t border-slate-900/50">
                      {sipLogs.length === 0 ? (
                         <p className="text-slate-600 italic">Esperando inicialización de canal...</p>
                      ) : (
                         sipLogs.map((log, index) => (
                            <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
                         ))
                      )}
                   </div>
                )}
             </div>

             {/* Call History section in Softphone */}
             {softphoneStatus === 'idle' && (
               <div className="p-5 pt-0 border-t border-slate-900">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest my-3">Historial Reciente</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                     {callHistory.map(hist => (
                       <div 
                         key={hist.id} 
                         onClick={() => setPhoneNumber(hist.number)}
                         className="p-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer group/hist transition-all border border-transparent hover:border-slate-800"
                       >
                          <div className="flex items-center gap-2">
                             <PhoneOutgoing className={`w-3 h-3 ${hist.status === 'completed' ? 'text-green-500' : 'text-red-500'}`} />
                             <div>
                                <p className="text-[10px] font-black text-slate-200 group-hover/hist:text-[#00F0FF] transition-colors">{hist.number}</p>
                                <p className="text-[7px] font-bold text-slate-500 uppercase">{hist.timestamp}</p>
                             </div>
                          </div>
                          <span className="text-[8px] font-mono text-slate-400 font-bold">{hist.duration}</span>
                       </div>
                     ))}
                  </div>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
