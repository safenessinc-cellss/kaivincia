import React, { useState, useEffect, useMemo } from 'react';
import {
  Phone,
  Server,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Plus,
  Trash2,
  UserCheck,
  Users,
  Copy,
  Check,
  RefreshCw,
  Power,
  Sliders,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Radio,
  FileSpreadsheet,
  Building2,
  Tag,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlobalContext } from '../../contexts/GlobalContext';
import { TelnyxGlobalConfig, TelnyxPhoneNumber, TelnyxAgentAssignment } from '../../types/calls';
import { telnyxWebRTCService } from '../../services/telnyxWebRTCService';

const DEFAULT_CONFIG: TelnyxGlobalConfig = {
  connectionId: '3046958032463333200',
  connectionName: 'Kaivincia-Voice-Test',
  connectionType: 'sip_credential',
  apiKeyMasked: 'KEY01A0••••••••••••••••••••••••',
  webhookUrl: 'https://ais-dev-je7y4j4rkf2urn7d5cqnsz-316420818896.us-east1.run.app/api/telnyx/webhook',
  maxConcurrentCalls: 10,
  recordCallsByDefault: true,
  alertOnLimitReached: true,
  lastVerificationStatus: 'active',
  lastVerificationMessage: 'Conexión verificada en Telnyx Backbone',
  updatedAt: new Date().toISOString()
};

const INITIAL_DEMO_NUMBERS: TelnyxPhoneNumber[] = [
  {
    id: 'num_1',
    phoneNumber: '+13055550199',
    friendlyName: 'Línea Central Miami (Principal)',
    status: 'assigned',
    assignedAgentIds: [],
    assignedAgentNames: ['Marta García', 'Carlos Ruiz'],
    isSharedPool: true,
    connectionId: '3046958032463333200',
    monthlyCost: '$1.00',
    tags: ['Ventas', 'Miami']
  },
  {
    id: 'num_2',
    phoneNumber: '+14155550142',
    friendlyName: 'Línea Soporte San Francisco',
    status: 'assigned',
    assignedAgentIds: [],
    assignedAgentNames: ['Ana Silva'],
    isSharedPool: false,
    connectionId: '3046958032463333200',
    monthlyCost: '$1.00',
    tags: ['Soporte', 'California']
  },
  {
    id: 'num_3',
    phoneNumber: '+13235550188',
    friendlyName: 'Línea Los Ángeles Operaciones',
    status: 'available',
    assignedAgentIds: [],
    assignedAgentNames: [],
    isSharedPool: true,
    connectionId: '3046958032463333200',
    monthlyCost: '$1.00',
    tags: ['Operaciones']
  }
];

export default function TelnyxAdminHub() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { users: contextUsers = [] } = useGlobalContext();

  const [activeSubTab, setActiveSubTab] = useState<'connection' | 'numbers' | 'assignments' | 'guide'>('connection');
  
  // Configuración global
  const [config, setConfig] = useState<TelnyxGlobalConfig>(DEFAULT_CONFIG);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [connectionIdInput, setConnectionIdInput] = useState(DEFAULT_CONFIG.connectionId);
  const [connectionNameInput, setConnectionNameInput] = useState(DEFAULT_CONFIG.connectionName || '');
  const [connectionTypeInput, setConnectionTypeInput] = useState<'sip_credential' | 'call_control'>('sip_credential');
  const [maxCallsInput, setMaxCallsInput] = useState(10);
  const [recordByDefault, setRecordByDefault] = useState(true);

  // Estados de WebRTC SDK login_token (JWT)
  const [loginTokenInput, setLoginTokenInput] = useState('');
  const [isEditingLoginToken, setIsEditingLoginToken] = useState(false);
  const [showLoginTokenPlain, setShowLoginTokenPlain] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [isGeneratingBackendToken, setIsGeneratingBackendToken] = useState(false);
  const [isTestingWebRtc, setIsTestingWebRtc] = useState(false);
  const [webRtcStatus, setWebRtcStatus] = useState<{ initialized: boolean; connected: boolean; error: string | null }>({
    initialized: false,
    connected: false,
    error: null
  });
  const [webRtcTestMsg, setWebRtcTestMsg] = useState<{ success: boolean; message: string } | null>(null);

  // Estados de test & backend sync
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; httpStatus?: number } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Inventario de Números
  const [phoneNumbers, setPhoneNumbers] = useState<TelnyxPhoneNumber[]>(INITIAL_DEMO_NUMBERS);
  const [isSyncingNumbers, setIsSyncingNumbers] = useState(false);
  const [numberSearch, setNumberSearch] = useState('');
  const [numberStatusFilter, setNumberStatusFilter] = useState<'all' | 'available' | 'assigned' | 'disabled'>('all');
  
  // Modal / Form nuevo número manual
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPhoneFriendlyName, setNewPhoneFriendlyName] = useState('');
  const [newPhoneIsShared, setNewPhoneIsShared] = useState(false);
  const [newPhoneTag, setNewPhoneTag] = useState('Ventas');

  // Asignaciones por Colaboradora
  const [assignments, setAssignments] = useState<Record<string, TelnyxAgentAssignment>>({});
  const [selectedAgentForModal, setSelectedAgentForModal] = useState<any | null>(null);

  // Cargar configuración y datos de Firestore en tiempo real
  useEffect(() => {
    // 0. Suscripción a estado de WebRTC SDK
    const unsubWebRtc = telnyxWebRTCService.subscribe((rtcState) => {
      setWebRtcStatus({
        initialized: rtcState.isInitialized,
        connected: rtcState.isConnected,
        error: rtcState.lastError
      });
      if (rtcState.loginToken && !loginTokenInput) {
        setLoginTokenInput(rtcState.loginToken);
      }
    });

    // 1. Suscripción a config global
    const unsubConfig = onSnapshot(doc(db, 'settings', 'telnyx_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as TelnyxGlobalConfig;
        setConfig(prev => ({ ...prev, ...data }));
        setConnectionIdInput(data.connectionId || DEFAULT_CONFIG.connectionId);
        setConnectionNameInput(data.connectionName || DEFAULT_CONFIG.connectionName || '');
        setConnectionTypeInput(data.connectionType || 'sip_credential');
        setMaxCallsInput(data.maxConcurrentCalls || 10);
        setRecordByDefault(data.recordCallsByDefault ?? true);
        const jwtFromDb = (data.login_token || data.webrtcJwt || '').trim();
        if (jwtFromDb) {
          setLoginTokenInput(jwtFromDb);
        }
      } else {
        // Inicializar documento base
        setDoc(doc(db, 'settings', 'telnyx_config'), DEFAULT_CONFIG).catch(console.error);
      }
    }, (err) => console.warn('Could not load telnyx_config:', err));

    // 2. Suscripción a números de teléfono
    const unsubNumbers = onSnapshot(collection(db, 'telnyx_phone_numbers'), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TelnyxPhoneNumber));
        setPhoneNumbers(list);
      } else {
        INITIAL_DEMO_NUMBERS.forEach(n => {
          setDoc(doc(db, 'telnyx_phone_numbers', n.id), n).catch(console.error);
        });
      }
    }, (err) => console.warn('Could not load telnyx_phone_numbers:', err));

    // 3. Suscripción a asignaciones de colaboradoras
    const unsubAssignments = onSnapshot(collection(db, 'telnyx_agent_assignments'), (snap) => {
      if (!snap.empty) {
        const map: Record<string, TelnyxAgentAssignment> = {};
        snap.docs.forEach(d => {
          map[d.id] = { id: d.id, ...d.data() } as TelnyxAgentAssignment;
        });
        setAssignments(map);
      }
    }, (err) => console.warn('Could not load telnyx_agent_assignments:', err));

    return () => {
      unsubWebRtc();
      unsubConfig();
      unsubNumbers();
      unsubAssignments();
    };
  }, []);

  // Lista normalizada de colaboradoras (contextUsers + fallback seguro)
  const collaborators = useMemo(() => {
    if (contextUsers && contextUsers.length > 0) {
      return contextUsers.map((u: any) => ({
        id: u.id || u.uid,
        name: u.displayName || u.name || u.email || 'Colaboradora',
        email: u.email || '',
        role: u.role || 'Agente',
        avatar: u.photoURL || u.name?.[0] || 'C'
      }));
    }
    return [
      { id: 'usr_1', name: 'Marta García', email: 'marta.garcia@kaivincia.com', role: 'Closer B2B', avatar: 'M' },
      { id: 'usr_2', name: 'Carlos Ruiz', email: 'carlos.ruiz@kaivincia.com', role: 'Ventas Senior', avatar: 'C' },
      { id: 'usr_3', name: 'Ana Silva', email: 'ana.silva@kaivincia.com', role: 'Soporte & Éxito', avatar: 'A' },
      { id: 'usr_4', name: 'Miguel Rojas', email: 'miguel.rojas@kaivincia.com', role: 'Operaciones', avatar: 'M' }
    ];
  }, [contextUsers]);

  // Probar Conexión con Telnyx
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telnyx-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connectionIdInput })
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Conexión con Telnyx exitosa' : 'Fallo en la prueba'),
        httpStatus: data.httpStatus || res.status
      });

      if (data.success) {
        await updateDoc(doc(db, 'settings', 'telnyx_config'), {
          lastVerifiedAt: new Date().toISOString(),
          lastVerificationStatus: 'active',
          lastVerificationMessage: data.message
        }).catch(() => {});
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Error de red: ${err.message || 'No se pudo contactar el backend'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Guardar configuración principal de Telnyx
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingConfig(true);
    setSaveSuccessMsg('');
    try {
      // 1. Notificar al backend sobre cambios en key o connectionId
      await fetch('/api/telnyx/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: newApiKey.trim() || undefined,
          connectionId: connectionIdInput.trim(),
          maxConcurrentCalls: maxCallsInput
        })
      });

      // 2. Guardar en Firestore (sin la key en texto plano)
      const updatedConfigData: Partial<TelnyxGlobalConfig> = {
        connectionId: connectionIdInput.trim(),
        connectionName: connectionNameInput.trim() || 'Kaivincia-Platform-Production',
        connectionType: connectionTypeInput,
        maxConcurrentCalls: maxCallsInput,
        recordCallsByDefault: recordByDefault,
        updatedAt: new Date().toISOString()
      };

      if (newApiKey.trim()) {
        const masked = `${newApiKey.trim().slice(0, 7)}••••••••••••••••${newApiKey.trim().slice(-6)}`;
        updatedConfigData.apiKeyMasked = masked;
      }

      if (loginTokenInput.trim()) {
        updatedConfigData.login_token = loginTokenInput.trim();
        updatedConfigData.webrtcJwt = loginTokenInput.trim();
        await telnyxWebRTCService.setLoginToken(loginTokenInput.trim(), false);
      }

      await setDoc(doc(db, 'settings', 'telnyx_config'), updatedConfigData, { merge: true });

      setIsEditingKey(false);
      setNewApiKey('');
      setSaveSuccessMsg('¡Configuración de Telnyx guardada y aplicada con éxito!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Error al guardar configuración: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Guardar login_token (JWT) específico de Telnyx WebRTC
  const handleSaveLoginToken = async (customToken?: string) => {
    const token = (customToken !== undefined ? customToken : loginTokenInput).trim();
    if (!token) {
      alert('Por favor introduce un JWT válido para el login_token de Telnyx WebRTC.');
      return;
    }
    setIsSavingToken(true);
    setWebRtcTestMsg(null);
    try {
      await telnyxWebRTCService.setLoginToken(token, true);
      const testRes = await telnyxWebRTCService.initClient(token);
      setWebRtcTestMsg(testRes);
      setIsEditingLoginToken(false);
      setSaveSuccessMsg('¡login_token (JWT) de Telnyx WebRTC actualizado y guardado en Firestore!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      setWebRtcTestMsg({ success: false, message: `Error guardando login_token: ${err.message}` });
    } finally {
      setIsSavingToken(false);
    }
  };

  // Generar nuevo token 24h desde backend de Telnyx
  const handleGenerateFreshToken = async () => {
    setIsGeneratingBackendToken(true);
    setWebRtcTestMsg(null);
    try {
      const res = await telnyxWebRTCService.fetchFreshTokenFromBackend();
      if (res.success && res.token) {
        setLoginTokenInput(res.token);
        setWebRtcTestMsg({ success: true, message: res.message });
        setSaveSuccessMsg('¡Nuevo login_token generado exitosamente desde la API de Telnyx!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        setWebRtcTestMsg({ success: false, message: res.message });
      }
    } catch (err: any) {
      setWebRtcTestMsg({ success: false, message: `Error generando token: ${err.message}` });
    } finally {
      setIsGeneratingBackendToken(false);
    }
  };

  // Probar cliente WebRTC con el token actual
  const handleTestWebRtcClient = async () => {
    setIsTestingWebRtc(true);
    setWebRtcTestMsg(null);
    try {
      const res = await telnyxWebRTCService.initClient(loginTokenInput);
      setWebRtcTestMsg(res);
    } catch (err: any) {
      setWebRtcTestMsg({ success: false, message: err.message || 'Error en prueba WebRTC' });
    } finally {
      setIsTestingWebRtc(false);
    }
  };

  // Copiar token al portapapeles
  const handleCopyLoginToken = () => {
    if (!loginTokenInput) return;
    navigator.clipboard.writeText(loginTokenInput);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Sincronizar Números desde la API de Telnyx
  const handleSyncNumbersFromTelnyx = async () => {
    setIsSyncingNumbers(true);
    try {
      const res = await fetch('/api/telnyx-numbers');
      const data = await res.json();
      if (data.success && Array.isArray(data.numbers) && data.numbers.length > 0) {
        for (const item of data.numbers) {
          const docId = `num_${item.id || item.phone_number.replace(/\D/g, '')}`;
          const existing = phoneNumbers.find(p => p.phoneNumber === item.phone_number);
          await setDoc(doc(db, 'telnyx_phone_numbers', docId), {
            id: docId,
            phoneNumber: item.phone_number,
            friendlyName: existing?.friendlyName || `Telnyx Direct (${item.phone_number})`,
            status: existing?.status || 'available',
            assignedAgentIds: existing?.assignedAgentIds || [],
            assignedAgentNames: existing?.assignedAgentNames || [],
            isSharedPool: existing?.isSharedPool ?? true,
            connectionId: item.connection_id || connectionIdInput,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        alert(`¡Sincronización exitosa! Se procesaron ${data.numbers.length} números desde Telnyx.`);
      } else {
        alert(data.message || 'Telnyx respondió correctamente. Se mantienen los números registrados.');
      }
    } catch (err: any) {
      alert(`Error al sincronizar con Telnyx: ${err.message}`);
    } finally {
      setIsSyncingNumbers(false);
    }
  };

  // Activar o desactivar número sin eliminar
  const handleToggleNumberStatus = async (numberItem: TelnyxPhoneNumber) => {
    const nextStatus = numberItem.status === 'disabled' ? 'available' : 'disabled';
    try {
      await updateDoc(doc(db, 'telnyx_phone_numbers', numberItem.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error toggling number status:', err);
    }
  };

  // Alternar Pool Compartido
  const handleToggleSharedPool = async (numberItem: TelnyxPhoneNumber) => {
    const nextShared = !numberItem.isSharedPool;
    try {
      await updateDoc(doc(db, 'telnyx_phone_numbers', numberItem.id), {
        isSharedPool: nextShared,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error toggling shared pool:', err);
    }
  };

  // Registrar número manual
  const handleAddNumberManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoneNumber.trim()) return;

    let formatted = newPhoneNumber.trim();
    if (!formatted.startsWith('+')) {
      formatted = `+${formatted.replace(/\D/g, '')}`;
    }

    const docId = `num_${Date.now().toString().slice(-6)}`;
    const newDoc: TelnyxPhoneNumber = {
      id: docId,
      phoneNumber: formatted,
      friendlyName: newPhoneFriendlyName.trim() || `Línea ${formatted}`,
      status: 'available',
      assignedAgentIds: [],
      assignedAgentNames: [],
      isSharedPool: newPhoneIsShared,
      connectionId: connectionIdInput,
      monthlyCost: '$1.00',
      tags: [newPhoneTag],
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'telnyx_phone_numbers', docId), newDoc);
      setShowAddNumberModal(false);
      setNewPhoneNumber('');
      setNewPhoneFriendlyName('');
    } catch (err: any) {
      alert(`Error al agregar número: ${err.message}`);
    }
  };

  // Eliminar número del inventario
  const handleDeleteNumber = async (id: string, phone: string) => {
    if (!window.confirm(`¿Estás segura de eliminar el número ${phone} del inventario de Kaivincia?`)) return;
    try {
      await deleteDoc(doc(db, 'telnyx_phone_numbers', id));
    } catch (err) {
      console.error('Error deleting phone number:', err);
    }
  };

  // Guardar asignación de colaboradora
  const handleSaveAgentAssignment = async (agent: any, data: Partial<TelnyxAgentAssignment>) => {
    const docId = agent.id;
    const assignmentDoc: TelnyxAgentAssignment = {
      id: docId,
      agentId: docId,
      agentName: agent.name,
      agentEmail: agent.email,
      authorizedNumbers: data.authorizedNumbers || [],
      defaultCallerId: data.defaultCallerId || data.authorizedNumbers?.[0] || '',
      allowSharedPool: data.allowSharedPool ?? true,
      strictMode: data.strictMode ?? true,
      recordCalls: data.recordCalls ?? true,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'telnyx_agent_assignments', docId), assignmentDoc);

      // Actualizar también en los números para reflejar a qué colaboradoras están asignados
      for (const num of phoneNumbers) {
        const isNowAssigned = assignmentDoc.authorizedNumbers.includes(num.phoneNumber);
        const wasAssigned = (num.assignedAgentIds || []).includes(docId);

        if (isNowAssigned && !wasAssigned) {
          const updatedIds = [...(num.assignedAgentIds || []), docId];
          const updatedNames = [...(num.assignedAgentNames || []), agent.name];
          await updateDoc(doc(db, 'telnyx_phone_numbers', num.id), {
            status: 'assigned',
            assignedAgentIds: updatedIds,
            assignedAgentNames: updatedNames
          }).catch(() => {});
        } else if (!isNowAssigned && wasAssigned) {
          const updatedIds = (num.assignedAgentIds || []).filter(id => id !== docId);
          const updatedNames = (num.assignedAgentNames || []).filter(n => n !== agent.name);
          await updateDoc(doc(db, 'telnyx_phone_numbers', num.id), {
            status: updatedIds.length > 0 ? 'assigned' : 'available',
            assignedAgentIds: updatedIds,
            assignedAgentNames: updatedNames
          }).catch(() => {});
        }
      }

      setSelectedAgentForModal(null);
    } catch (err: any) {
      alert(`Error al guardar asignación: ${err.message}`);
    }
  };

  // Copiar webhook al portapapeles
  const handleCopyWebhook = () => {
    const url = config.webhookUrl || 'https://ais-dev-je7y4j4rkf2urn7d5cqnsz-316420818896.us-east1.run.app/api/telnyx/webhook';
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // Filtrar números
  const filteredNumbers = useMemo(() => {
    return phoneNumbers.filter(num => {
      const matchesQuery = num.phoneNumber.includes(numberSearch) ||
        (num.friendlyName || '').toLowerCase().includes(numberSearch.toLowerCase()) ||
        (num.tags || []).some(t => t.toLowerCase().includes(numberSearch.toLowerCase()));
      const matchesStatus = numberStatusFilter === 'all' || num.status === numberStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [phoneNumbers, numberSearch, numberStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Banner Principal de Administración Telnyx */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 rounded-3xl border border-cyan-500/20 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight italic">
                    Administración Telnyx & Troncales de Voz
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Backbone Activo
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Control centralizado de conexión, aprovisionamiento de números (DIDs), permisos de salida por colaboradora y enlace WebRTC sin depender de código ni de desarrolladores.
                </p>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas del Banner */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin' : 'text-cyan-400'}`} />
              <span>{isTesting ? 'Verificando...' : 'Probar Conexión'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncNumbersFromTelnyx}
              disabled={isSyncingNumbers}
              className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingNumbers ? 'animate-spin' : ''}`} />
              <span>{isSyncingNumbers ? 'Sincronizando...' : 'Sincronizar Telnyx'}</span>
            </button>
          </div>
        </div>

        {/* Notificación de Resultado del Test */}
        {testResult && (
          <div className={`mt-4 p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
            testResult.success
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <div className="flex-1">
              <strong className="font-bold">{testResult.success ? 'Conexión Exitosa: ' : 'Error de Conexión: '}</strong>
              <span>{testResult.message}</span>
            </div>
            {testResult.httpStatus && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40 border border-white/10">
                HTTP {testResult.httpStatus}
              </span>
            )}
          </div>
        )}

        {/* Alerta de Límite de Llamadas Simultáneas */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono text-[11px]">Connection ID:</span>
            <span className="font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded-lg border border-slate-800">
              {config.connectionId}
            </span>
            <span className="text-[11px] text-cyan-400 font-medium">({config.connectionName})</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Canales Simultáneos: <strong className="text-white">0 / {config.maxConcurrentCalls}</strong></span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold uppercase">
              Alerta de límite: Activada
            </span>
          </div>
        </div>
      </div>

      {/* Navegación por Sub-Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'connection', label: '1. Conexión & Webhooks', icon: Server, badge: 'Plataforma' },
          { id: 'numbers', label: '2. Números Telefónicos (DIDs)', icon: Phone, badge: `${phoneNumbers.length}` },
          { id: 'assignments', label: '3. Asignación a Colaboradoras', icon: Users, badge: `${collaborators.length}` },
          { id: 'guide', label: '4. SIP Trunking vs Call Control (Guía)', icon: HelpCircle, badge: 'Info' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-black/20 text-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* PESTAÑA 1: CONEXIÓN & WEBHOOKS */}
      {activeSubTab === 'connection' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Configuración de Conexión & Claves */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-500" />
                <span>Parámetros de Conexión Telnyx</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modifica y actualiza la conexión de Telnyx compartida para toda la plataforma sin necesidad de tocar el código fuente.
              </p>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Connection ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  TELNYX_CONNECTION_ID (Plataforma)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={connectionIdInput}
                    onChange={(e) => setConnectionIdInput(e.target.value)}
                    placeholder="Ej. 3046958032463333200"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ID de conexión activo de Telnyx. Puedes usar tu Credential Connection actual o cambiar a una Call Control Application.
                </p>
              </div>

              {/* Nombre de la Conexión */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nombre Identificador
                  </label>
                  <input
                    type="text"
                    value={connectionNameInput}
                    onChange={(e) => setConnectionNameInput(e.target.value)}
                    placeholder="Kaivincia-Voice-Test"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tipo de Conexión Telnyx
                  </label>
                  <select
                    value={connectionTypeInput}
                    onChange={(e) => setConnectionTypeInput(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="sip_credential">SIP Trunking (Credential Connection) - Actual</option>
                    <option value="call_control">Programmable Voice (Call Control App WebRTC)</option>
                  </select>
                </div>
              </div>

              {/* TELNYX_API_KEY (Segura / Ofuscada) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      TELNYX_API_KEY (Secreto del Servidor)
                    </label>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Cifrada en Backend
                  </span>
                </div>

                {!isEditingKey ? (
                  <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="font-mono text-xs text-slate-400 font-bold tracking-wider select-none">
                      {config.apiKeyMasked || 'KEY01A0••••••••••••••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingKey(true)}
                      className="text-xs font-black uppercase text-cyan-500 hover:text-cyan-400 underline cursor-pointer"
                    >
                      Reemplazar Clave
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="Pega aquí la nueva TELNYX_API_KEY (KEY01...)"
                      className="w-full bg-white dark:bg-slate-900 border border-cyan-500/60 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Nunca se mostrará nuevamente tras guardarla por seguridad.</span>
                      <button
                        type="button"
                        onClick={() => { setIsEditingKey(false); setNewApiKey(''); }}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TELNYX WebRTC SDK — login_token (JWT) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-cyan-500/20 dark:border-cyan-500/30 space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <div>
                      <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Telnyx WebRTC SDK — login_token (JWT)</span>
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Token JWT de autenticación para el cliente <code className="text-cyan-400 font-mono text-[10px]">TelnyxRTC(&#123; login_token &#125;)</code> en /crm/calls
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {loginTokenInput ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>JWT Activo</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Pendiente JWT</span>
                      </span>
                    )}
                    {webRtcStatus.connected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        WebRTC Conectado
                      </span>
                    )}
                  </div>
                </div>

                {!isEditingLoginToken ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl">
                      <div className="flex-1 font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold truncate select-all">
                        {loginTokenInput ? (
                          showLoginTokenPlain ? (
                            <span className="break-all">{loginTokenInput}</span>
                          ) : (
                            <span>{`${loginTokenInput.slice(0, 16)}••••••••••••••••••••••••${loginTokenInput.slice(-10)}`}</span>
                          )
                        ) : (
                          <span className="text-slate-500 italic">No hay login_token configurado aún. Haz clic en "Actualizar JWT" o genera uno nuevo.</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {loginTokenInput && (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowLoginTokenPlain(!showLoginTokenPlain)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title={showLoginTokenPlain ? "Ocultar token" : "Ver token completo"}
                            >
                              {showLoginTokenPlain ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={handleCopyLoginToken}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Copiar token"
                            >
                              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsEditingLoginToken(true)}
                          className="px-2.5 py-1 text-xs font-black uppercase text-cyan-500 hover:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          {loginTokenInput ? 'Actualizar JWT' : 'Configurar JWT'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={loginTokenInput}
                      onChange={(e) => setLoginTokenInput(e.target.value)}
                      placeholder="Pega aquí el nuevo login_token JWT de Telnyx (eyJhbGciOi...)"
                      className="w-full bg-white dark:bg-slate-900 border border-cyan-500/60 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none resize-none"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>Este token se persistirá en Firestore (<code className="text-cyan-400 font-mono">settings/telnyx_config</code>) y se aplicará inmediatamente a las llamadas.</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingLoginToken(false)}
                          className="px-3 py-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSavingToken || !loginTokenInput.trim()}
                          onClick={() => handleSaveLoginToken()}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSavingToken ? 'Guardando...' : 'Guardar y Aplicar JWT'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acciones Rápidas para el SDK WebRTC */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateFreshToken}
                    disabled={isGeneratingBackendToken}
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Obtener un nuevo JWT 24h directamente desde la API backend de Telnyx"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBackendToken ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingBackendToken ? 'Generando JWT...' : 'Generar Nuevo JWT (Backend API)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestWebRtcClient}
                    disabled={isTestingWebRtc || !loginTokenInput.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Verificar inicialización del cliente TelnyxRTC con este token"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isTestingWebRtc ? 'animate-pulse text-cyan-400' : 'text-cyan-400'}`} />
                    <span>{isTestingWebRtc ? 'Probando WebRTC...' : 'Probar SDK WebRTC'}</span>
                  </button>
                </div>

                {/* Resultado de Prueba o Generación de WebRTC */}
                {webRtcTestMsg && (
                  <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                    webRtcTestMsg.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {webRtcTestMsg.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{webRtcTestMsg.message}</span>
                  </div>
                )}
              </div>

              {/* Límites de Concurrencia & Opciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Límite de Llamadas Simultáneas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxCallsInput}
                    onChange={(e) => setMaxCallsInput(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400">Alerta preventiva al alcanzar este límite</span>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Grabación por Defecto
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordByDefault}
                      onChange={(e) => setRecordByDefault(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">Grabar todas las llamadas automáticamente</span>
                  </label>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSavingConfig ? 'Guardando...' : 'Guardar Configuración en Plataforma'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Panel Derecho: Webhook URL & Estado en Vivo */}
          <div className="space-y-6">
            {/* Tarjeta de Webhook */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Webhook URL de Kaivincia
                  </h5>
                  <span className="text-[10px] text-slate-400">Requerido en Telnyx Portal</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Este es el endpoint público de Kaivincia que debes pegar en tu <strong>Call Control Application</strong> o en tu Webhook de Telnyx para recibir estados de llamadas y grabaciones:
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="font-mono text-xs text-cyan-300 break-all select-all">
                  {config.webhookUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedWebhook ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡URL Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Webhook URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <strong className="text-white block">Eventos que Kaivincia procesa:</strong>
                <div>• <span className="text-cyan-400 font-mono">call.initiated</span> (Llamada iniciada)</div>
                <div>• <span className="text-emerald-400 font-mono">call.answered</span> (Contestada)</div>
                <div>• <span className="text-rose-400 font-mono">call.hangup</span> (Finalizada)</div>
                <div>• <span className="text-purple-400 font-mono">call.recording.saved</span> (Grabación MP3)</div>
              </div>
            </div>

            {/* Tarjeta de Seguridad */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Aislamiento de Claves</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Las colaboradoras nunca tienen acceso visual a la <code className="text-cyan-300">TELNYX_API_KEY</code>. La generación de tokens de llamada (JWT) se realiza exclusivamente del lado del servidor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: INVENTARIO DE NÚMEROS TELEFÓNICOS (DIDs) */}
      {activeSubTab === 'numbers' && (
        <div className="space-y-6">
          {/* Barra de Filtro y Acciones de Números */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                value={numberSearch}
                onChange={(e) => setNumberSearch(e.target.value)}
                placeholder="Buscar número, alias o etiqueta..."
                className="w-full sm:w-72 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
              />

              <select
                value={numberStatusFilter}
                onChange={(e) => setNumberStatusFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">Todos los Estados</option>
                <option value="available">Disponibles</option>
                <option value="assigned">Asignados</option>
                <option value="disabled">Desactivados</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSyncNumbersFromTelnyx}
                disabled={isSyncingNumbers}
                className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNumbers ? 'animate-spin' : ''}`} />
                <span>Importar de Telnyx</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddNumberModal(true)}
                className="px-4 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Número</span>
              </button>
            </div>
          </div>

          {/* Tabla de Números */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 px-5">Número E.164 & Alias</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Colaboradoras Asignadas</th>
                    <th className="py-3.5 px-4">Pool Compartido</th>
                    <th className="py-3.5 px-4">Costo Mensual</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredNumbers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No se encontraron números que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredNumbers.map(num => (
                      <tr key={num.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5">
                          <div className="space-y-0.5">
                            <div className="font-mono text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{num.phoneNumber}</span>
                              {(num.tags || []).map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-bold">
                                  {t}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {num.friendlyName || 'Línea Kaivincia'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {num.status === 'available' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                              Disponible
                            </span>
                          )}
                          {num.status === 'assigned' && (
                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black uppercase">
                              Asignado ({num.assignedAgentNames?.length || 1})
                            </span>
                          )}
                          {num.status === 'disabled' && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[10px] font-black uppercase">
                              Desactivado
                            </span>
                          )}
                          {num.status === 'in_use' && (
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-black uppercase animate-pulse">
                              En Uso
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {num.assignedAgentNames && num.assignedAgentNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {num.assignedAgentNames.map(name => (
                                <span key={name} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Sin asignar</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleSharedPool(num)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              num.isSharedPool
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {num.isSharedPool ? 'Pool Compartido' : 'Uso Exclusivo'}
                          </button>
                        </td>

                        <td className="py-4 px-4 font-mono text-xs text-slate-400">
                          {num.monthlyCost || '$1.00'}/mes
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Activar / Desactivar sin borrar */}
                            <button
                              type="button"
                              onClick={() => handleToggleNumberStatus(num)}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                num.status === 'disabled'
                                  ? 'bg-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                              }`}
                              title={num.status === 'disabled' ? 'Activar número' : 'Desactivar número temporalmente'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            {/* Eliminar */}
                            <button
                              type="button"
                              onClick={() => handleDeleteNumber(num.id, num.phoneNumber)}
                              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                              title="Eliminar número de Kaivincia"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal para Registrar Número Manual */}
          {showAddNumberModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-white uppercase tracking-tight">
                    Registrar Número Telefónico
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddNumberModal(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddNumberManual} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Número Telefónico E.164
                    </label>
                    <input
                      type="text"
                      required
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      placeholder="+1 (305) 555-0199"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Nombre / Identificador Amigable
                    </label>
                    <input
                      type="text"
                      value={newPhoneFriendlyName}
                      onChange={(e) => setNewPhoneFriendlyName(e.target.value)}
                      placeholder="Ej. Línea Comercial México / Miami"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Etiqueta
                      </label>
                      <select
                        value={newPhoneTag}
                        onChange={(e) => setNewPhoneTag(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white font-bold"
                      >
                        <option value="Ventas">Ventas</option>
                        <option value="Soporte">Soporte</option>
                        <option value="Operaciones">Operaciones</option>
                        <option value="Cobranza">Cobranza</option>
                        <option value="B2B">B2B</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-2 cursor-pointer mt-3">
                        <input
                          type="checkbox"
                          checked={newPhoneIsShared}
                          onChange={(e) => setNewPhoneIsShared(e.target.checked)}
                          className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300">Pool Compartido</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNumberModal(false)}
                      className="px-4 py-2 rounded-2xl text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider shadow-lg"
                    >
                      Guardar Número
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: ASIGNACIÓN A COLABORADORAS & PERMISOS */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-500" />
                  <span>Control de Números Autorizados por Colaboradora</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Establece qué números puede usar cada colaboradora como identificador de salida. Por seguridad, no podrán llamar con números asignados a otras colaboradoras.
                </p>
              </div>
            </div>
          </div>

          {/* Grid de Colaboradoras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collaborators.map(agent => {
              const assignment = assignments[agent.id] || {
                agentId: agent.id,
                agentName: agent.name,
                agentEmail: agent.email,
                authorizedNumbers: [],
                defaultCallerId: '',
                allowSharedPool: true,
                strictMode: true,
                recordCalls: true
              };

              return (
                <div
                  key={agent.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 relative"
                >
                  {/* Header de la Colaboradora */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400 text-sm">
                        {agent.avatar}
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900 dark:text-white">
                          {agent.name}
                        </h5>
                        <span className="text-[11px] text-slate-400">{agent.email} ({agent.role})</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedAgentForModal({ ...agent, assignment })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Configurar
                    </button>
                  </div>

                  {/* Números Autorizados */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Números Autorizados ({assignment.authorizedNumbers?.length || 0}):
                    </label>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                      {assignment.authorizedNumbers && assignment.authorizedNumbers.length > 0 ? (
                        assignment.authorizedNumbers.map((phone: string) => {
                          const isDefault = assignment.defaultCallerId === phone;
                          return (
                            <span
                              key={phone}
                              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                                isDefault
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span>{phone}</span>
                              {isDefault && <span className="text-[9px] uppercase font-black text-cyan-400">(Default)</span>}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin números específicos asignados</span>
                      )}
                    </div>
                  </div>

                  {/* Reglas de Seguridad */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${assignment.strictMode ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="text-slate-400">Modo Estricto: <strong className="text-slate-200">{assignment.strictMode ? 'Activo' : 'Inactivo'}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${assignment.allowSharedPool ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                      <span className="text-slate-400">Pool Compartido: <strong className="text-slate-200">{assignment.allowSharedPool ? 'Permitido' : 'Bloqueado'}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal de Configuración de Asignación */}
          {selectedAgentForModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">
                      Asignar Números a {selectedAgentForModal.name}
                    </h4>
                    <span className="text-xs text-slate-400">{selectedAgentForModal.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAgentForModal(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Selector de Números Autorizados */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Selecciona los Números Autorizados:
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {phoneNumbers.filter(n => n.status !== 'disabled').map(num => {
                        const currentAuth = selectedAgentForModal.assignment?.authorizedNumbers || [];
                        const isChecked = currentAuth.includes(num.phoneNumber);

                        return (
                          <label
                            key={num.id}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const nextAuth = e.target.checked
                                    ? [...currentAuth, num.phoneNumber]
                                    : currentAuth.filter((p: string) => p !== num.phoneNumber);
                                  setSelectedAgentForModal({
                                    ...selectedAgentForModal,
                                    assignment: {
                                      ...selectedAgentForModal.assignment,
                                      authorizedNumbers: nextAuth,
                                      defaultCallerId: nextAuth.includes(selectedAgentForModal.assignment?.defaultCallerId)
                                        ? selectedAgentForModal.assignment?.defaultCallerId
                                        : nextAuth[0] || ''
                                    }
                                  });
                                }}
                                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                              />
                              <div>
                                <span className="font-mono text-xs font-bold block text-white">{num.phoneNumber}</span>
                                <span className="text-[10px] text-slate-400">{num.friendlyName}</span>
                              </div>
                            </div>
                            {num.isSharedPool && (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Pool
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Número Predeterminado */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Número Predeterminado de Salida (Default Outbound Caller ID):
                    </label>
                    <select
                      value={selectedAgentForModal.assignment?.defaultCallerId || ''}
                      onChange={(e) => setSelectedAgentForModal({
                        ...selectedAgentForModal,
                        assignment: {
                          ...selectedAgentForModal.assignment,
                          defaultCallerId: e.target.value
                        }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Selecciona el número predeterminado --</option>
                      {(selectedAgentForModal.assignment?.authorizedNumbers || []).map((p: string) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Permisos Estrictos */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAgentForModal.assignment?.strictMode ?? true}
                        onChange={(e) => setSelectedAgentForModal({
                          ...selectedAgentForModal,
                          assignment: {
                            ...selectedAgentForModal.assignment,
                            strictMode: e.target.checked
                          }
                        })}
                        className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-300 font-bold">
                        Impedir utilizar números asignados a otras colaboradoras (Estricto)
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAgentForModal.assignment?.allowSharedPool ?? true}
                        onChange={(e) => setSelectedAgentForModal({
                          ...selectedAgentForModal,
                          assignment: {
                            ...selectedAgentForModal.assignment,
                            allowSharedPool: e.target.checked
                          }
                        })}
                        className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-300">
                        Permitir también usar números del Pool Compartido de la empresa
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAgentForModal(null)}
                    className="px-4 py-2 rounded-2xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAgentAssignment(selectedAgentForModal, selectedAgentForModal.assignment)}
                    className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider shadow-lg"
                  >
                    Guardar Asignación
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: GUÍA TÉCNICA SIP TRUNKING VS CALL CONTROL */}
      {activeSubTab === 'guide' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
              Arquitectura de Voz: SIP Trunking vs Programmable Voice (Call Control)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Respuesta a tu consulta sobre el tipo de conexión Telnyx adecuado para la operación dentro de Kaivincia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opción A */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Server className="w-5 h-5" />
                <h5 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  1. SIP Trunking (Credential Connection) - Tu Conexión Actual
                </h5>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Es la conexión que tienes actualmente configurada con el ID: <code className="text-cyan-300 font-mono">3046958032463333200</code>.
              </p>
              <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                <div>• <strong>Uso tradicional:</strong> Se utiliza cuando se conectan teléfonos físicos IP, servidores PBX Asterisk/FreePBX o software externo como Zoiper / MicroSIP.</div>
                <div>• <strong>Compatibilidad en Kaivincia:</strong> Kaivincia la soporta mediante generación de credenciales de telefonía Telnyx (<code className="text-cyan-300">/v2/telephony_credentials</code>).</div>
                <div>• <strong>Ventaja:</strong> Ya la tienes lista y funcionando sin pasos adicionales.</div>
              </div>
            </div>

            {/* Opción B */}
            <div className="p-6 rounded-3xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Zap className="w-5 h-5" />
                <h5 className="text-sm font-black uppercase tracking-wider text-white">
                  2. Call Control Application (Programmable Voice) - Recomendado
                </h5>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Diseñada específicamente para hacer llamadas directamente desde el navegador web sin softphones externos:
              </p>
              <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                <div>• <strong>Flujo WebRTC Nativo:</strong> La colaboradora pulsa "Llamar", Telnyx señaliza por WebSockets y dispara los Webhooks en tiempo real a Kaivincia.</div>
                <div>• <strong>Webhook URL:</strong> Utiliza la URL de Kaivincia provista en la Pestaña 1.</div>
                <div>• <strong>Control total:</strong> Grabación instantánea en la nube, transcripción y registro automatizado.</div>
              </div>
            </div>
          </div>

          {/* Pasos para dar de alta Call Control en Telnyx cuando desees */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
            <h6 className="text-xs font-black uppercase tracking-wider text-cyan-400">
              ¿Cómo crear la Call Control Application en Telnyx (Opcional pero Recomendado)?
            </h6>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal pl-5">
              <li>Inicia sesión en tu portal de <strong>Telnyx Portal</strong>.</li>
              <li>En el menú lateral, ve a <strong>Voice</strong> &gt; <strong>Call Control Applications</strong>.</li>
              <li>Pulsa <strong>"Add Call Control Application"</strong> y nómbrala <code className="text-cyan-300 font-mono">Kaivincia-Voice-Production</code>.</li>
              <li>En <strong>Webhook URL</strong>, pega: <code className="text-white font-mono bg-black/50 px-2 py-0.5 rounded">{config.webhookUrl}</code>.</li>
              <li>Selecciona <strong>API Version v2</strong> y guarda la aplicación.</li>
              <li>Copia el <strong>Application ID / Connection ID</strong> generado y pégalo en el campo <em>TELNYX_CONNECTION_ID</em> de esta plataforma. ¡Listo!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
