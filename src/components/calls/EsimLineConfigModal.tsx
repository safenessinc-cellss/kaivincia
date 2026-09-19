import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Phone, 
  MessageSquare, 
  Users, 
  Settings, 
  ShieldCheck, 
  CheckCircle2, 
  Server, 
  Sparkles, 
  Radio, 
  Save, 
  Globe, 
  Key, 
  Share2, 
  HelpCircle
} from 'lucide-react';
import { EsimProfile } from '../../types/calls';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: EsimProfile | null;
  onSaveSuccess?: (updated: EsimProfile) => void;
}

const AVAILABLE_OPERATORS = [
  'Marta García',
  'Carlos Ruiz',
  'Zaydeli De La Rosa',
  'Miguel Rojas',
  'Roberto Gómez',
  'Operador General TLMK'
];

export default function EsimLineConfigModal({
  isOpen,
  onClose,
  profile,
  onSaveSuccess
}: Props) {
  if (!isOpen || !profile) return null;

  const [phone, setPhone] = useState(profile.phone || '+1 (323) 555-0122');
  const [lineName, setLineName] = useState(profile.lineName || `Línea eSIM • ${profile.carrier || 'Ventas'}`);
  const [extension, setExtension] = useState(profile.extension || 'Ext 101');
  const [carrier, setCarrier] = useState(profile.carrier || 'T-Mobile USA');
  const [region, setRegion] = useState(profile.region || 'USA');
  
  // Opciones principales de integración
  const [isInternalLineActive, setIsInternalLineActive] = useState(profile.isInternalLineActive ?? true);
  const [isWhatsAppActive, setIsWhatsAppActive] = useState(profile.isWhatsAppActive ?? true);
  const [isSharedWithAllOperators, setIsSharedWithAllOperators] = useState(profile.isSharedWithAllOperators ?? true);
  const [assignedOperators, setAssignedOperators] = useState<string[]>(
    profile.assignedOperators || ['Todos los Operadores']
  );

  // Parámetros de WhatsApp Business Multi-Agente
  const [wabaDisplayName, setWabaDisplayName] = useState(profile.whatsAppConfig?.displayName || 'Kaivincia Soluciones');
  const [wabaPhoneId, setWabaPhoneId] = useState(profile.whatsAppConfig?.phoneNumberId || '109283746501928');
  const [wabaAccountId, setWabaAccountId] = useState(profile.whatsAppConfig?.wabaId || 'WABA-99281-CORP');
  const [wabaApiToken, setWabaApiToken] = useState(profile.whatsAppConfig?.apiToken || 'EAAG...wh_token_prod_active');

  // Parámetros SIP / Softphone
  const [sipUsername, setSipUsername] = useState(profile.sipCredentials?.sipUsername || profile.phone?.replace(/\D/g, '') || '345678');
  const [sipDomain, setSipDomain] = useState(profile.sipCredentials?.sipDomain || 'sip.zadarma.com');
  const [smdpServer, setSmdpServer] = useState(profile.smdpServer || 'rsp.t-mobile.com');
  const [activationCode, setActivationCode] = useState(profile.activationCode || `LPA:1$RSP.CARRIER$${profile.id}`);

  const [activeTab, setActiveTab] = useState<'line' | 'whatsapp' | 'operators' | 'sip'>('line');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const toggleOperator = (op: string) => {
    if (assignedOperators.includes(op)) {
      setAssignedOperators(assignedOperators.filter(o => o !== op));
    } else {
      setAssignedOperators([...assignedOperators, op]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(false);

    const updatedData: Partial<EsimProfile> = {
      phone,
      lineName,
      extension,
      carrier,
      region,
      isInternalLineActive,
      isWhatsAppActive,
      isSharedWithAllOperators,
      assignedOperators: isSharedWithAllOperators ? ['Todos los Operadores (Línea Compartida)'] : assignedOperators,
      smdpServer,
      activationCode,
      status: 'active',
      whatsAppConfig: {
        phoneNumberId: wabaPhoneId,
        wabaId: wabaAccountId,
        displayName: wabaDisplayName,
        sharedMode: isSharedWithAllOperators ? 'all_operators' : 'assigned_only',
        webhookStatus: 'verified',
        multiAgentEnabled: true,
        apiToken: wabaApiToken
      },
      sipCredentials: {
        sipUsername,
        sipPassword: '••••••••••••',
        sipDomain,
        callerId: phone
      }
    };

    try {
      const ref = doc(db, 'esim_profiles', profile.id);
      await updateDoc(ref, updatedData);
    } catch (err) {
      console.warn('Could not save to Firestore, operating in local state:', err);
    }

    const merged = { ...profile, ...updatedData };
    if (onSaveSuccess) onSaveSuccess(merged);

    setIsSaving(false);
    setSuccessMsg(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0A0E17] text-white border border-cyan-500/30 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00F0FF]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Configurar Línea eSIM & WhatsApp Multi-Agente
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Línea Interna App
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {profile.id} • {carrier} • <span className="text-cyan-400 font-bold">{phone}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notificación de éxito */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Configuración de la línea y WhatsApp compartida guardada con éxito!</span>
          </div>
        )}

        {/* Pestañas de configuración */}
        <div className="px-6 pt-4 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('line')}
            className={`px-3.5 py-2 font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'line'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Línea Interna</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3.5 py-2 font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Business</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operators')}
            className={`px-3.5 py-2 font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'operators'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Operadores Compartidos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sip')}
            className={`px-3.5 py-2 font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sip'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Troncal & APN</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">

          {/* TAB 1: LÍNEA INTERNA */}
          {activeTab === 'line' && (
            <div className="space-y-4">
              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-cyan-200/90 leading-relaxed">
                  Esta eSIM funciona como una <strong>línea telefónica interna dentro de la app</strong>. Puede emitir y recibir llamadas desde el Marcador WebRTC, con Caller ID asignado y sin depender de teléfonos físicos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Número Telefónico de la Línea *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (323) 555-0122"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Número que verán clientes al recibir llamadas y mensajes.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Nombre Descriptivo de la Línea
                  </label>
                  <input
                    type="text"
                    required
                    value={lineName}
                    onChange={(e) => setLineName(e.target.value)}
                    placeholder="Línea Principal Ventas"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Extensión Interna
                  </label>
                  <input
                    type="text"
                    value={extension}
                    onChange={(e) => setExtension(e.target.value)}
                    placeholder="Ext 101"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Operador / Carrier Red
                  </label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="T-Mobile, Vodafone..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Región / País
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="USA">USA (+1)</option>
                    <option value="España">España (+34)</option>
                    <option value="México">México (+52)</option>
                    <option value="Colombia">Colombia (+57)</option>
                    <option value="Venezuela">Venezuela (+58)</option>
                    <option value="Internacional">Global Multi-Región</option>
                  </select>
                </div>
              </div>

              {/* Toggles de activación */}
              <div className="pt-2 space-y-3">
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Activar como Línea en el Marcador WebRTC</p>
                      <p className="text-[10px] text-slate-400">Aparecerá en el selector de líneas del softphone para llamadas directas.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalLineActive}
                      onChange={(e) => setIsInternalLineActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP BUSINESS */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                  <p className="font-bold">Línea de WhatsApp Vinculada a este Número eSIM ({phone})</p>
                  <p className="mt-0.5">
                    Permite que todos los operadores atiendan mensajes de clientes usando este <strong>único número corporativo</strong> mediante Meta Cloud API.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Habilitar WhatsApp Business en este Número</p>
                  <p className="text-[10px] text-emerald-400/80">Canal oficial para atención al cliente y mensajes automáticos.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWhatsAppActive}
                    onChange={(e) => setIsWhatsAppActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Nombre Comercial en WhatsApp
                  </label>
                  <input
                    type="text"
                    value={wabaDisplayName}
                    onChange={(e) => setWabaDisplayName(e.target.value)}
                    placeholder="Kaivincia CRM Corporativo"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Phone Number ID (Meta Cloud API)
                  </label>
                  <input
                    type="text"
                    value={wabaPhoneId}
                    onChange={(e) => setWabaPhoneId(e.target.value)}
                    placeholder="109283746501928"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    WABA ID (WhatsApp Business Account)
                  </label>
                  <input
                    type="text"
                    value={wabaAccountId}
                    onChange={(e) => setWabaAccountId(e.target.value)}
                    placeholder="WABA-99281-CORP"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Access Token / API Key
                  </label>
                  <input
                    type="password"
                    value={wabaApiToken}
                    onChange={(e) => setWabaApiToken(e.target.value)}
                    placeholder="EAAG...token"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Estado de Conexión Meta:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  VERIFICADO & ACTIVO
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: OPERADORES COMPARTIDOS (UN SOLO NÚMERO PARA TODOS) */}
          {activeTab === 'operators' && (
            <div className="space-y-4">
              <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                <Share2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-purple-200/90 leading-relaxed">
                  <p className="font-bold">WhatsApp y Telefonía Multi-Agente con Número Único</p>
                  <p className="mt-0.5">
                    Todos los operadores ingresan a la app y atienden a los clientes a través de este <strong>mismo número de teléfono ({phone})</strong>. Cada mensaje enviado identifica internamente al operador que respondió.
                  </p>
                </div>
              </div>

              {/* Toggle compartido para todos */}
              <div className="p-4 bg-slate-900/90 border border-purple-500/40 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white">Compartir Número con TODOS los Operadores</p>
                  <p className="text-[10px] text-purple-300/80">
                    Habilita la bandeja compartida unificada para el equipo comercial y de soporte.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSharedWithAllOperators}
                    onChange={(e) => setIsSharedWithAllOperators(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              {/* Lista de Operadores Disponibles */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Operadores con Acceso a este Número ({isSharedWithAllOperators ? 'Todos Habilitados' : assignedOperators.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_OPERATORS.map(op => {
                    const isSelected = isSharedWithAllOperators || assignedOperators.includes(op);
                    return (
                      <div
                        key={op}
                        onClick={() => {
                          if (!isSharedWithAllOperators) toggleOperator(op);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isSharedWithAllOperators 
                            ? 'bg-purple-950/30 border-purple-500/30 text-purple-200' 
                            : isSelected
                              ? 'bg-purple-500/20 border-purple-500/60 text-white cursor-pointer'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{op}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1" />}
                      </div>
                    );
                  })}
                </div>
                {isSharedWithAllOperators && (
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    * El modo unificado está activo. Todos los colaboradores pueden ver y responder chats desde el número único.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TRONCAL & APN */}
          {activeTab === 'sip' && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                <Server className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Configuración de la conexión SIP y Servidor de Aprovisionamiento SM-DP+ para la eSIM y enrutamiento WebRTC.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Usuario SIP / Troncal
                  </label>
                  <input
                    type="text"
                    value={sipUsername}
                    onChange={(e) => setSipUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Dominio SIP / PBX Host
                  </label>
                  <input
                    type="text"
                    value={sipDomain}
                    onChange={(e) => setSipDomain(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Servidor SM-DP+ (eSIM Remote Provisioning)
                  </label>
                  <input
                    type="text"
                    value={smdpServer}
                    onChange={(e) => setSmdpServer(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Código de Activación LPA
                  </label>
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer botones */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[10px] text-slate-500 font-mono">
              Número: <span className="text-cyan-400 font-bold">{phone}</span> • WhatsApp: <span className={isWhatsAppActive ? 'text-emerald-400' : 'text-slate-500'}>{isWhatsAppActive ? 'Activo (Único)' : 'Inactivo'}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-black uppercase tracking-wider text-black bg-[#00F0FF] hover:bg-cyan-400 rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
