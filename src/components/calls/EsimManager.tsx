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
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { EsimProfile } from '../../types/calls';

interface EsimManagerProps {
  className?: string;
}

export default function EsimManager({ className = '' }: EsimManagerProps) {
  const { t } = useLanguage();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [isSimulatingId, setIsSimulatingId] = useState<string | null>(null);

  // Formulario nuevo perfil
  const [formRegion, setFormRegion] = useState('USA');
  const [formPackage, setFormPackage] = useState('15');
  const [formAgent, setFormAgent] = useState('Marta García');
  const [formCarrier, setFormCarrier] = useState('T-Mobile USA');

  // Sincronización reactiva con Firestore
  useEffect(() => {
    const q = collection(db, 'esim_profiles');
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setProfiles(list);
        if (!selectedProfileId && list.length > 0) {
          setSelectedProfileId(list[0].id);
        }
      } else {
        // Semilla inicial predeterminada
        const defaults = [
          {
            id: 'esim_1',
            agentName: 'Marta García',
            phone: '+1 323 555 0122',
            carrier: 'T-Mobile USA',
            region: 'USA',
            planName: 'USA Ultra HighSpeed 15GB',
            status: 'active',
            smdpServer: 'rsp.t-mobile.com',
            activationCode: 'LPA:1$RSP.T-MOBILE.COM$T-MO-MARTA-902',
            totalDataGB: 15,
            usedDataGB: 4.8,
            expirationDate: '2026-09-12',
            signalStrength: 4,
            iccid: '8904903200001234567',
            isDemo: true
          },
          {
            id: 'esim_2',
            agentName: 'Carlos Ruiz',
            phone: '+34 690 987 654',
            carrier: 'Vodafone Europe',
            region: 'Europa',
            planName: 'EuroTravel Premium 10GB',
            status: 'active',
            smdpServer: 'rsp.vodafone.com',
            activationCode: 'LPA:1$RSP.VODAFONE.COM$VF-EUR-MARTA-304',
            totalDataGB: 10,
            usedDataGB: 8.5,
            expirationDate: '2026-08-30',
            signalStrength: 3,
            iccid: '8934000200009876543',
            isDemo: true
          },
          {
            id: 'esim_3',
            agentName: 'Miguel Rojas',
            phone: '+58 412 555 1122',
            carrier: 'Digitel Local Backup',
            region: 'Latam',
            planName: 'Latam Multi-Carrier 5GB',
            status: 'expired',
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
  }, []);

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

  // Crear nuevo perfil eSIM (simulado)
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'esim_' + Date.now().toString().slice(-6);
    const totalGB = parseInt(formPackage, 10);
    const newProfile = {
      id: newId,
      agentName: formAgent,
      phone: formRegion === 'USA' ? '+1 (323) 555-' + Math.floor(1000 + Math.random() * 9000) : '+34 690 ' + Math.floor(100000 + Math.random() * 900000),
      carrier: formCarrier,
      region: formRegion,
      planName: `${formRegion} Roaming Pro ${totalGB}GB`,
      status: 'active',
      smdpServer: `rsp.${formCarrier.toLowerCase().replace(/\s+/g, '')}.com`,
      activationCode: `LPA:1$RSP.${formCarrier.toUpperCase()}$${newId.toUpperCase()}`,
      totalDataGB: totalGB,
      usedDataGB: 0.1,
      expirationDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      signalStrength: 4,
      iccid: '89' + Math.floor(10000000000000000 + Math.random() * 90000000000000000).toString(),
      isDemo: true
    };

    try {
      await setDoc(doc(db, 'esim_profiles', newId), newProfile);
      setSelectedProfileId(newId);
      setShowProvisionModal(false);
    } catch (err) {
      console.error('Error creating eSIM profile:', err);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Banner de Estado de Integración: DEMO / AVISO DE CARRIER */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider">
                DEMO / SIMULACIÓN OPERATIVA
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Módulo de Resiliencia Móvil & Perfiles eSIM
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Las líneas telefónicas y consumo de datos mostrados operan en modo simulador para pruebas de contingencia. Para aprovisionamiento celular físico en vivo, se requiere vincular API de carrier (e.g. GigSky, 1oT o Truphone).
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowProvisionModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generar Perfil eSIM</span>
        </button>
      </div>

      {/* Grid Principal: Lista de Perfiles + Detalle y Código QR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Lista de Perfiles */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Perfiles Asignados al Equipo ({profiles.length})
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Actualización en tiempo real</span>
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
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {prof.agentName}
                          </h5>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isExpired
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {isExpired ? 'Agotada / Vencida' : 'Activa'}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-cyan-500 dark:text-cyan-400 mt-0.5">
                          {prof.phone}
                        </p>
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
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Vence: {prof.expirationDate || '30 días'}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateUsage(prof.id);
                      }}
                      disabled={isSimulatingId === prof.id || isExpired}
                      className="text-cyan-500 hover:text-cyan-400 font-bold underline cursor-pointer disabled:opacity-40"
                    >
                      {isSimulatingId === prof.id ? 'Simulando...' : '⚡ Simular Consumo (+500MB)'}
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
            <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-6 space-y-6 shadow-xl sticky top-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-black uppercase tracking-tight italic">
                    Aprovisionamiento eSIM
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                  LPA Server
                </span>
              </div>

              {/* Código QR Generado Dinámicamente para Escaneo */}
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedProfile.activationCode || 'LPA:1$RSP.KAIVINCIA.COM$DEMO')}`}
                  alt="eSIM Activation QR"
                  className="w-44 h-44 rounded-xl"
                />
                <p className="text-[10px] font-mono text-slate-600 mt-3 font-bold uppercase tracking-wider text-center">
                  Escanea desde Cámara en iPhone / Android
                </p>
              </div>

              {/* Parámetros de Activación Manual */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Servidor SM-DP+</span>
                  <span className="text-slate-200 text-[11px] break-all select-all">
                    {selectedProfile.smdpServer || 'rsp.kaivincia.com'}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Código de Activación</span>
                  <span className="text-cyan-400 text-[11px] break-all select-all">
                    {selectedProfile.activationCode || 'LPA:1$RSP.KAIVINCIA$001'}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">ICCID</span>
                    <span className="text-slate-300 text-[11px] select-all">
                      {selectedProfile.iccid || '8904903200001234567'}
                    </span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
              Selecciona un perfil eSIM para ver el código de instalación.
            </div>
          )}
        </div>
      </div>

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
                    Nuevo Perfil eSIM
                  </h4>
                  <p className="text-xs text-slate-400">Aprovisionamiento virtual para agente</p>
                </div>
              </div>

              <form onSubmit={handleCreateProfile} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Colaborador Asignado
                  </label>
                  <input
                    type="text"
                    required
                    value={formAgent}
                    onChange={(e) => setFormAgent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400"
                    placeholder="Nombre del agente..."
                  />
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

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Operador / Carrier Asociado
                  </label>
                  <input
                    type="text"
                    value={formCarrier}
                    onChange={(e) => setFormCarrier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400"
                    placeholder="Ej. T-Mobile, Vodafone, AT&T..."
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
