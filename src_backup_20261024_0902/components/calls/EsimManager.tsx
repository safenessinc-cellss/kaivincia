import React, { useState, useEffect, useMemo } from 'react';
import { 
  Smartphone, 
  Wifi, 
  Globe, 
  QrCode, 
  RefreshCw, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  X, 
  Sparkles,
  ShieldCheck,
  Signal,
  Cpu,
  MessageSquare,
  Settings,
  Users,
  Phone,
  Radio,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { EsimProfile } from '../../types/calls';
import EsimLineConfigModal from './EsimLineConfigModal';
import EsimSharedWhatsappHub from './EsimSharedWhatsappHub';

interface EsimManagerProps {
  className?: string;
  onStartCall?: (phone: string) => void;
}

export default function EsimManager({ className = '', onStartCall }: EsimManagerProps) {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'profiles' | 'whatsapp'>('profiles');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [isSimulatingId, setIsSimulatingId] = useState<string | null>(null);

  // Modal de configuración de línea & WhatsApp
  const [configModalProfile, setConfigModalProfile] = useState<EsimProfile | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Formulario nuevo perfil
  const [formRegion, setFormRegion] = useState('USA');
  const [formPackage, setFormPackage] = useState('15');
  const [formAgent, setFormAgent] = useState('Marta García');
  const [formCarrier, setFormCarrier] = useState('T-Mobile USA');
  const [formPhone, setFormPhone] = useState('+1 323 555 0122');
  const [formExtension, setFormExtension] = useState('Ext 101');
  const [formIsSharedWhatsApp, setFormIsSharedWhatsApp] = useState(true);

  // Sincronización reactiva con Firestore
  useEffect(() => {
    if (authLoading || !user) return;

    const q = collection(db, 'esim_profiles');
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setProfiles(list);
        if (!selectedProfileId && list.length > 0) {
          setSelectedProfileId(list[0].id);
        }
      } else {
        // Semilla inicial predeterminada con configuración de línea interna y WhatsApp único
        const defaults = [
          {
            id: 'esim_1',
            agentName: 'Marta García',
            phone: '+1 323 555 0122',
            lineName: 'Línea Corporativa Ventas & WhatsApp',
            extension: 'Ext 101',
            carrier: 'T-Mobile USA',
            region: 'USA',
            planName: 'USA Ultra HighSpeed 15GB',
            status: 'active',
            isInternalLineActive: true,
            isWhatsAppActive: true,
            isSharedWithAllOperators: true,
            assignedOperators: ['Todos los Operadores (Línea Compartida)'],
            smdpServer: 'rsp.t-mobile.com',
            activationCode: 'LPA:1$RSP.T-MOBILE.COM$T-MO-MARTA-902',
            totalDataGB: 15,
            usedDataGB: 4.8,
            expirationDate: '2026-09-12',
            signalStrength: 4,
            iccid: '8904903200001234567',
            isDemo: true,
            whatsAppConfig: {
              phoneNumberId: '109283746501928',
              wabaId: 'WABA-99281-CORP',
              displayName: 'Kaivincia CRM Corporativo',
              sharedMode: 'all_operators',
              webhookStatus: 'verified',
              multiAgentEnabled: true
            },
            sipCredentials: {
              sipUsername: '3235550122',
              sipDomain: 'sip.zadarma.com',
              callerId: '+1 323 555 0122'
            }
          },
          {
            id: 'esim_2',
            agentName: 'Carlos Ruiz',
            phone: '+34 690 987 654',
            lineName: 'Línea Europa Soporte & Cierres',
            extension: 'Ext 102',
            carrier: 'Vodafone Europe',
            region: 'Europa',
            planName: 'EuroTravel Premium 10GB',
            status: 'active',
            isInternalLineActive: true,
            isWhatsAppActive: true,
            isSharedWithAllOperators: true,
            assignedOperators: ['Todos los Operadores (Línea Compartida)'],
            smdpServer: 'rsp.vodafone.com',
            activationCode: 'LPA:1$RSP.VODAFONE.COM$VF-EUR-MARTA-304',
            totalDataGB: 10,
            usedDataGB: 8.5,
            expirationDate: '2026-08-30',
            signalStrength: 3,
            iccid: '8934000200009876543',
            isDemo: true,
            whatsAppConfig: {
              phoneNumberId: '209384817263540',
              wabaId: 'WABA-EUROPE-33',
              displayName: 'Kaivincia Europa',
              sharedMode: 'all_operators',
              webhookStatus: 'verified',
              multiAgentEnabled: true
            }
          },
          {
            id: 'esim_3',
            agentName: 'Miguel Rojas',
            phone: '+58 412 555 1122',
            lineName: 'Línea Contingencia Latam',
            extension: 'Ext 103',
            carrier: 'Digitel Local Backup',
            region: 'Latam',
            planName: 'Latam Multi-Carrier 5GB',
            status: 'expired',
            isInternalLineActive: false,
            isWhatsAppActive: false,
            isSharedWithAllOperators: false,
            assignedOperators: ['Miguel Rojas'],
            smdpServer: 'rsp.digitel.com.ve',
            activationCode: 'LPA:1$RSP.DIGITEL.COM.VE$DG-VEN-MIGUEL-501',
            totalDataGB: 5,
            usedDataGB: 5.0,
            expirationDate: '2026-06-25',
            signalStrength: 2,
            iccid: '8958021200001122334',
            isDemo: true
          }
        ];
        defaults.forEach(item => {
          setDoc(doc(db, 'esim_profiles', item.id), item).catch(console.error);
        });
        setProfiles(defaults);
        setSelectedProfileId(defaults[0].id);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Error fetching esim_profiles:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  const selectedProfile = useMemo(() => {
    return profiles.find(p => p.id === selectedProfileId) || profiles[0] || null;
  }, [profiles, selectedProfileId]);

  // Simular consumo de datos en la demo
  const handleSimulateUsage = async (profileId: string) => {
    if (isSimulatingId) return;
    setIsSimulatingId(profileId);

    const prof = profiles.find(p => p.id === profileId);
    if (!prof) {
      setIsSimulatingId(null);
      return;
    }

    const currentUsed = prof.usedDataGB || 0;
    const total = prof.totalDataGB || 10;
    const nextUsed = parseFloat(Math.min(total, currentUsed + 0.5).toFixed(1));
    const nextStatus = nextUsed >= total ? 'expired' : prof.status;

    try {
      await updateDoc(doc(db, 'esim_profiles', profileId), {
        usedDataGB: nextUsed,
        status: nextStatus
      });
    } catch (err) {
      console.warn('Error updating eSIM usage simulation:', err);
    } finally {
      setIsSimulatingId(null);
    }
  };

  // Crear nuevo perfil eSIM (con configuración completa de línea y WhatsApp)
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'esim_' + Date.now().toString().slice(-6);
    const totalGB = parseInt(formPackage, 10);
    const generatedPhone = formPhone.trim() || (formRegion === 'USA' ? '+1 (323) 555-' + Math.floor(1000 + Math.random() * 9000) : '+34 690 ' + Math.floor(100000 + Math.random() * 900000));
    
    const newProfile = {
      id: newId,
      agentName: formAgent,
      phone: generatedPhone,
      lineName: `Línea eSIM • ${formCarrier}`,
      extension: formExtension || 'Ext 104',
      carrier: formCarrier,
      region: formRegion,
      planName: `${formRegion} Roaming Pro ${totalGB}GB`,
      status: 'active',
      isInternalLineActive: true,
      isWhatsAppActive: formIsSharedWhatsApp,
      isSharedWithAllOperators: formIsSharedWhatsApp,
      assignedOperators: formIsSharedWhatsApp ? ['Todos los Operadores (Línea Compartida)'] : [formAgent],
      smdpServer: `rsp.${formCarrier.toLowerCase().replace(/\s+/g, '')}.com`,
      activationCode: `LPA:1$RSP.${formCarrier.toUpperCase()}$${newId.toUpperCase()}`,
      totalDataGB: totalGB,
      usedDataGB: 0.1,
      expirationDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      signalStrength: 4,
      iccid: '89' + Math.floor(10000000000000000 + Math.random() * 90000000000000000).toString(),
      isDemo: true,
      whatsAppConfig: {
        phoneNumberId: '10928374' + Math.floor(10000 + Math.random() * 90000),
        wabaId: 'WABA-' + formCarrier.toUpperCase().slice(0, 4),
        displayName: 'Kaivincia CRM Corporativo',
        sharedMode: formIsSharedWhatsApp ? 'all_operators' : 'assigned_only',
        webhookStatus: 'verified',
        multiAgentEnabled: true
      },
      sipCredentials: {
        sipUsername: generatedPhone.replace(/\D/g, ''),
        sipDomain: 'sip.zadarma.com',
        callerId: generatedPhone
      }
    };

    try {
      await setDoc(doc(db, 'esim_profiles', newId), newProfile);
      setSelectedProfileId(newId);
      setShowProvisionModal(false);
    } catch (err) {
      console.error('Error creating eSIM profile:', err);
    }
  };

  const handleOpenConfigModal = (profileToEdit: any) => {
    setConfigModalProfile(profileToEdit);
    setIsConfigModalOpen(true);
  };

  const handleOpenSharedWhatsapp = (prof: any) => {
    setSelectedProfileId(prof.id);
    setActiveTab('whatsapp');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Selector de Vistas: Gestión de Perfiles vs Bandeja WhatsApp Compartida */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profiles'
                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Líneas & Aprovisionamiento eSIM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Multi-Operador (Número Único)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProvisionModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Línea eSIM</span>
          </button>
        </div>
      </div>

      {/* VISTA 1: GESTIÓN DE PERFILES Y LÍNEAS */}
      {activeTab === 'profiles' && (
        <div className="space-y-6">
          {/* Banner de Estado de Integración y Modo Multi-Operador */}
          <div className="bg-gradient-to-r from-cyan-500/10 via-emerald-500/5 to-transparent border border-cyan-500/30 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[9px] font-black uppercase tracking-wider">
                    LÍNEAS INTERNAS PBX & WHATSAPP
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider">
                    Multi-Agente con Número Único
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                  Cada perfil eSIM puede configurarse como una <strong>línea interna dentro de la app</strong> con extensión y softphone WebRTC, y asignarse como el <strong>número oficial de WhatsApp Business</strong> para que todos los operadores atiendan clientes desde un único número unificado.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (selectedProfile) handleOpenConfigModal(selectedProfile);
              }}
              className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] shrink-0 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Configurar Línea Activa</span>
            </button>
          </div>

          {/* Grid Principal: Lista de Perfiles + Detalle y Código QR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Lista de Perfiles */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Líneas eSIM en el Sistema ({profiles.length})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Sincronización en tiempo real</span>
              </div>

              <div className="space-y-3">
                {profiles.map((prof) => {
                  const isSelected = prof.id === selectedProfileId;
                  const used = prof.usedDataGB || 0;
                  const total = prof.totalDataGB || 10;
                  const pct = Math.min(100, Math.round((used / total) * 100));
                  const isExpired = prof.status === 'expired' || used >= total;

                  return (
                    <div
                      key={prof.id}
                      onClick={() => setSelectedProfileId(prof.id)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            isExpired 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                {prof.lineName || prof.agentName || 'Línea eSIM'}
                              </h5>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                isExpired
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {isExpired ? 'Agotada / Inactiva' : 'Activa'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-cyan-500 dark:text-cyan-400 font-bold">
                                {prof.phone}
                              </span>
                              {prof.extension && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                  {prof.extension}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {prof.carrier}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                            {used} / {total} GB ({pct}%)
                          </span>
                        </div>
                      </div>

                      {/* Badges de capacidades integradas */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {prof.isInternalLineActive !== false && (
                          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> Marcador WebRTC
                          </span>
                        )}
                        {prof.isWhatsAppActive !== false && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono flex items-center gap-1 font-bold">
                            <MessageSquare className="w-2.5 h-2.5" /> WhatsApp Número Único
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" /> {prof.isSharedWithAllOperators !== false ? 'Todos los Operadores' : (prof.assignedOperators?.[0] || '1 Operador')}
                        </span>
                      </div>

                      {/* Barra de progreso de consumo de datos */}
                      <div className="mt-4">
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 90 
                                ? 'bg-rose-500' 
                                : pct >= 70 
                                  ? 'bg-amber-500' 
                                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Acciones de la tarjeta */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenConfigModal(prof);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Settings className="w-3 h-3" /> Configurar Parámetros
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSharedWhatsapp(prof);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" /> Abrir WhatsApp
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateUsage(prof.id);
                          }}
                          disabled={isSimulatingId === prof.id || isExpired}
                          className="text-slate-400 hover:text-white underline cursor-pointer disabled:opacity-40"
                        >
                          {isSimulatingId === prof.id ? 'Simulando...' : '⚡ Simular Datos (+500MB)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha: Tarjeta de Instalación & QR del Perfil Seleccionado */}
            <div className="lg:col-span-5">
              {selectedProfile ? (
                <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl sticky top-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-sm font-black uppercase tracking-tight italic">
                        Instalación Móvil & Código QR
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenConfigModal(selectedProfile)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono hover:bg-cyan-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-2.5 h-2.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  {/* Botones de acción rápida sobre la línea */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenSharedWhatsapp(selectedProfile)}
                      className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp Único</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onStartCall) onStartCall(selectedProfile.phone || '+1 323 555 0122');
                      }}
                      className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Probar Llamada</span>
                    </button>
                  </div>

                  {/* Código QR Generado Dinámicamente para Escaneo */}
                  <div className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedProfile.activationCode || 'LPA:1$RSP.KAIVINCIA.COM$DEMO')}`}
                      alt="eSIM Activation QR"
                      className="w-40 h-40 rounded-xl"
                    />
                    <p className="text-[10px] font-mono text-slate-600 mt-2 font-bold uppercase tracking-wider text-center">
                      Escanear desde iPhone / Android para instalar eSIM
                    </p>
                  </div>

                  {/* Parámetros de Activación Manual */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Número Asignado</span>
                      <span className="text-cyan-400 text-[11px] font-bold select-all">
                        {selectedProfile.phone || '+1 323 555 0122'} ({selectedProfile.extension || 'Ext 101'})
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Servidor SM-DP+</span>
                      <span className="text-slate-200 text-[11px] break-all select-all">
                        {selectedProfile.smdpServer || 'rsp.kaivincia.com'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Código de Activación LPA</span>
                      <span className="text-cyan-400 text-[11px] break-all select-all">
                        {selectedProfile.activationCode || 'LPA:1$RSP.KAIVINCIA$001'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
                  Selecciona una línea eSIM para ver su código de instalación.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: BANDEJA WHATSAPP COMPARTIDA (NÚMERO ÚNICO PARA TODOS LOS OPERADORES) */}
      {activeTab === 'whatsapp' && (
        <EsimSharedWhatsappHub
          profile={selectedProfile || profiles[0]}
          onOpenConfig={() => handleOpenConfigModal(selectedProfile || profiles[0])}
          onCallContact={(phone) => {
            if (onStartCall) onStartCall(phone);
          }}
        />
      )}

      {/* Modal para Configurar Línea eSIM & WhatsApp */}
      <EsimLineConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        profile={configModalProfile}
        onSaveSuccess={(updated) => {
          setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
        }}
      />

      {/* Modal para Generar Nuevo Perfil eSIM */}
      <AnimatePresence>
        {showProvisionModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 text-white border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 pb-4 border-b border-slate-900">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black uppercase tracking-tight italic">
                    Nueva Línea eSIM & WhatsApp
                  </h4>
                  <p className="text-xs text-slate-400">Aprovisionamiento con línea interna y WhatsApp corporativo</p>
                </div>
              </div>

              <form onSubmit={handleCreateProfile} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Número Telefónico de la Línea
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono font-bold focus:outline-none focus:border-cyan-400"
                    placeholder="+1 (323) 555-0122"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Extensión Interna
                    </label>
                    <input
                      type="text"
                      value={formExtension}
                      onChange={(e) => setFormExtension(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400"
                      placeholder="Ext 101"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Carrier / Operador
                    </label>
                    <input
                      type="text"
                      value={formCarrier}
                      onChange={(e) => setFormCarrier(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400"
                      placeholder="T-Mobile, Vodafone..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Región / Cobertura
                    </label>
                    <select
                      value={formRegion}
                      onChange={(e) => setFormRegion(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="USA">Estados Unidos</option>
                      <option value="Europa">Europa (EEA)</option>
                      <option value="Latam">Latinoamérica</option>
                      <option value="Global">Global 120 Países</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Paquete de Datos
                    </label>
                    <select
                      value={formPackage}
                      onChange={(e) => setFormPackage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="5">5 GB (30 días)</option>
                      <option value="10">10 GB (30 días)</option>
                      <option value="15">15 GB (30 días)</option>
                      <option value="30">30 GB (60 días)</option>
                    </select>
                  </div>
                </div>

                {/* Checkbox de WhatsApp Único Compartido */}
                <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">WhatsApp Compartido (Número Único)</span>
                    <span className="text-[10px] text-emerald-400/80">Todos los operadores usarán este número</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsSharedWhatsApp}
                    onChange={(e) => setFormIsSharedWhatsApp(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProvisionModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                  >
                    Generar Perfil
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
