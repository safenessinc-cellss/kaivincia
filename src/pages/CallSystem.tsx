import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { 
  Phone, 
  Activity, 
  Clock, 
  Smartphone, 
  Server, 
  MessageSquare, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Radio, 
  PhoneCall,
  Sparkles,
  ChevronRight,
  Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

// Subcomponentes modulares de telefonía
import SoftphoneDialer from '../components/calls/SoftphoneDialer';
import CallHistoryTable from '../components/calls/CallHistoryTable';
import EsimManager from '../components/calls/EsimManager';
import ZohoUtilityBillGenerator from '../components/calls/ZohoUtilityBillGenerator';
import VoipProviderConfig from '../components/calls/VoipProviderConfig';
import LiveCallMonitor from '../components/calls/LiveCallMonitor';
import OmnichannelInbox from '../components/calls/OmnichannelInbox';
import VoipCoverageZones from '../components/calls/VoipCoverageZones';

export default function CallSystem() {
  const { userData } = useOutletContext<{ userData: any }>() || {};
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Roles administrativos autorizados para configurar proveedores y supervisar
  const isAdmin = useMemo(() => {
    return ['superadmin', 'admin', 'ceo', 'gestor'].includes(userData?.role);
  }, [userData?.role]);

  // Manejo de pestaña activa vía URL o estado
  const currentTabParam = searchParams.get('tab') || 'monitor';
  const dialParam = searchParams.get('dial') || '';

  const [activeTab, setActiveTab] = useState<string>(currentTabParam);
  const [isSoftphoneFloating, setIsSoftphoneFloating] = useState(false);
  const [dialTargetNumber, setDialTargetNumber] = useState<string>(dialParam);

  // Llamada activa simulada/en curso para monitor
  const [activeCallSession, setActiveCallSession] = useState<any | null>(null);

  // Sincronizar URL cuando cambia la pestaña
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tabId);
      return p;
    });
  };

  // Escuchar parámetro 'dial' para abrir marcador
  useEffect(() => {
    if (dialParam) {
      setDialTargetNumber(dialParam);
      setIsSoftphoneFloating(true);
    }
  }, [dialParam]);

  // Iniciar llamada desde cualquier sección (historial, inbox o zonas)
  const handleTriggerCall = (phone: string, contactName?: string) => {
    setDialTargetNumber(phone);
    setIsSoftphoneFloating(true);
  };

  // Simular llamada de prueba para el monitor
  const handleTriggerMonitorTestCall = () => {
    setActiveCallSession({
      id: 'call_test_' + Date.now().toString().slice(-4),
      customer: '+1 (323) 555-0199 (Cliente California)',
      agent: userData?.displayName || userData?.name || 'Marta García',
      duration: '00:45',
      provider: 'Zadarma SIP Direct',
      sentiment: 'positive',
      latency: '22ms',
      jitter: '0.8ms',
      cost: '$0.0090',
      isRecording: true
    });
  };

  const TABS = [
    { id: 'monitor', label: t('calls.tabs.monitor', 'Monitor VoIP'), icon: Activity },
    { id: 'softphone', label: t('calls.tabs.softphone', 'Marcador WebRTC'), icon: Phone },
    { id: 'logs', label: t('calls.tabs.logs', 'Historial & Grabaciones'), icon: Clock },
    { id: 'esim', label: t('calls.tabs.esim', 'Líneas eSIM'), icon: Smartphone },
    { id: 'directory', label: t('calls.tabs.directory', 'Troncales SIP'), icon: Server },
    { id: 'inbox', label: t('calls.tabs.inbox', 'Bandeja Omnicanal'), icon: MessageSquare },
    { id: 'cobertura', label: t('calls.tabs.coverage', 'Zonas & Horarios'), icon: MapPin },
    { id: 'utilidades', label: t('calls.tabs.utilities', 'Comprobante Utility'), icon: FileText }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabecera Principal del Sistema Telefónico */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                  {t('calls.title', 'Centro Telefónico & VoIP')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Troncal Zadarma Online
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('calls.subtitle', 'Telefonía SIP redundante, supervisión de llamadas en vivo y aprovisionamiento móvil.')}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas del Header */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsSoftphoneFloating(!isSoftphoneFloating)}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isSoftphoneFloating
                ? 'bg-amber-500 text-black shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.25)]'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isSoftphoneFloating ? 'Ocultar Marcador' : 'Marcador Flotante'}</span>
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-black shadow-md'
                  : 'bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400 dark:text-black' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido Dinámico de la Pestaña Activa */}
      <div className="transition-opacity duration-200">
        {activeTab === 'monitor' && (
          <LiveCallMonitor
            activeCall={activeCallSession}
            onHangUp={() => setActiveCallSession(null)}
            onTriggerTestCall={handleTriggerMonitorTestCall}
          />
        )}

        {activeTab === 'softphone' && (
          <div className="max-w-md mx-auto">
            <SoftphoneDialer
              initialPhoneNumber={dialTargetNumber}
              mode="embedded"
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <CallHistoryTable
            onTriggerCall={(phone) => handleTriggerCall(phone)}
          />
        )}

        {activeTab === 'esim' && (
          <EsimManager />
        )}

        {activeTab === 'directory' && (
          <VoipProviderConfig
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'inbox' && (
          <OmnichannelInbox
            onStartCallWithContact={(phone) => handleTriggerCall(phone)}
          />
        )}

        {activeTab === 'cobertura' && (
          <VoipCoverageZones
            onSelectAreaCode={(code) => handleTriggerCall(`+1${code}`)}
          />
        )}

        {activeTab === 'utilidades' && (
          <ZohoUtilityBillGenerator />
        )}
      </div>

      {/* Marcador Flotante (Popup / Floating Widget) */}
      <AnimatePresence>
        {isSoftphoneFloating && activeTab !== 'softphone' && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-88 shadow-2xl drop-shadow-2xl"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSoftphoneFloating(false)}
                className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-slate-800 text-white hover:bg-rose-600 flex items-center justify-center text-xs font-bold shadow-lg transition-colors cursor-pointer"
                title="Cerrar marcador flotante"
              >
                ✕
              </button>
              <SoftphoneDialer
                initialPhoneNumber={dialTargetNumber}
                mode="floating"
                onClose={() => setIsSoftphoneFloating(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
