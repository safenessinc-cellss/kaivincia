import React from 'react';
import { 
  Radio, 
  Activity, 
  Settings, 
  UserCheck, 
  Briefcase, 
  Users, 
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Hand
} from 'lucide-react';
import { VoipProvider, SoftphoneState } from '../../types/calls';
import { useLanguage } from '../../contexts/LanguageContext';

interface SoftphoneConfigProps {
  providers: VoipProvider[];
  selectedCarrier: string;
  onSelectCarrier: (carrierId: string) => void;
  authorizedCallerIds: string[];
  selectedCallerId: string;
  onSelectCallerId: (id: string) => void;
  callerIdMode?: 'auto' | 'manual';
  onCallerIdModeChange?: (mode: 'auto' | 'manual') => void;
  callerIdAutoReason?: string;
  selectedProject: string;
  onSelectProject: (project: string) => void;
  selectedClientName: string;
  onSelectClient: (clientName: string, clientPhone?: string) => void;
  clients: any[];
  liveLatency: number;
  liveJitter?: number;
  hasValidSipCredentials: boolean;
  onOpenProviderModal: (provider: VoipProvider) => void;
  callStatus: SoftphoneState['status'];
  agentAssignment?: any;
}

export default function SoftphoneConfig({
  providers,
  selectedCarrier,
  onSelectCarrier,
  authorizedCallerIds,
  selectedCallerId,
  onSelectCallerId,
  callerIdMode = 'auto',
  onCallerIdModeChange,
  callerIdAutoReason = 'Línea predeterminada asignada',
  selectedProject,
  onSelectProject,
  selectedClientName,
  onSelectClient,
  clients,
  liveLatency,
  hasValidSipCredentials,
  onOpenProviderModal,
  callStatus,
  agentAssignment
}: SoftphoneConfigProps) {
  const { t } = useLanguage();

  const activeCarrierObj = providers.find(p => p.id === selectedCarrier) || providers[0];

  return (
    <div className="bg-white/90 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3 shadow-inner">
      {/* Cabecera con Latencia y Acciones Rápidas */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-700" />
          <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
            {t('voip.routing_title', 'Parámetros de Enrutamiento')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" />
            <span>{liveLatency}ms</span>
          </span>
          {activeCarrierObj && (
            <button
              type="button"
              onClick={() => onOpenProviderModal(activeCarrierObj)}
              className="text-[9px] font-black uppercase text-cyan-700 hover:text-cyan-700 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              title="Editar parámetros y credenciales del carrier activo"
            >
              <Settings className="w-2.5 h-2.5" />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Selectores Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Selector de Carrier */}
        <div>
          <label className="text-[9px] uppercase font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-cyan-700" />
            <span>Troncal / Carrier Activo</span>
          </label>
          <select
            value={selectedCarrier}
            onChange={(e) => onSelectCarrier(e.target.value)}
            disabled={callStatus !== 'idle'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isDefault ? '⭐' : ''} ({p.costPerMinute || '$0.012'}/m)
              </option>
            ))}
          </select>
        </div>

        {/* Caller ID: automático o selección manual, siempre limitado a líneas autorizadas */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[9px] uppercase font-bold text-slate-700 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-700" />
              <span>Número de salida (Caller ID)</span>
            </label>
            <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Autorizado
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => onCallerIdModeChange?.('auto')}
              disabled={callStatus !== 'idle'}
              aria-pressed={callerIdMode === 'auto'}
              className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 ${callerIdMode === 'auto' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <Sparkles className="w-3 h-3" /> Automático
            </button>
            <button
              type="button"
              onClick={() => onCallerIdModeChange?.('manual')}
              disabled={callStatus !== 'idle'}
              aria-pressed={callerIdMode === 'manual'}
              className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 ${callerIdMode === 'manual' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <Hand className="w-3 h-3" /> Manual
            </button>
          </div>

          {authorizedCallerIds.length > 0 ? (
            <>
              <select
                value={selectedCallerId}
                onChange={(e) => onSelectCallerId(e.target.value)}
                disabled={callStatus !== 'idle' || callerIdMode === 'auto'}
                className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                aria-label="Número de salida autorizado"
              >
                {authorizedCallerIds.map(num => (
                  <option key={num} value={num}>
                    {num} {agentAssignment?.defaultCallerId === num ? '(Preferido)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[10px] text-slate-600">
                {callerIdMode === 'auto' ? callerIdAutoReason : 'Selección manual entre tus líneas asignadas.'}
              </p>
              <div className="mt-2 rounded-lg bg-white border border-blue-100 px-2.5 py-2">
                <div className="text-[9px] uppercase tracking-wide text-slate-500 font-semibold">Caller ID solicitado a Telnyx</div>
                <div className="text-sm font-bold font-mono text-slate-900">{selectedCallerId || 'Sin línea seleccionada'}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">La presentación final depende de la validación de Telnyx y de la red de destino.</div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-amber-200 rounded-xl px-2.5 py-2 text-[10px] text-amber-800 font-medium">
              No hay números asignados. Contacta a tu supervisor para solicitar una línea.
            </div>
          )}
        </div>
      </div>

      {/* Grid de Proyecto y Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
        {/* Selector de Proyecto / Campaña */}
        <div>
          <label className="text-[9px] uppercase font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Briefcase className="w-2.5 h-2.5 text-slate-600" />
            <span>Proyecto / Campaña</span>
          </label>
          <select
            value={selectedProject}
            onChange={(e) => onSelectProject(e.target.value)}
            disabled={callStatus !== 'idle'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 font-medium focus:outline-none focus:border-cyan-400 disabled:opacity-50 cursor-pointer"
          >
            <option value="Ventas B2B">Ventas B2B (Closer)</option>
            <option value="Onboarding Clientes">Onboarding & Bienvenida</option>
            <option value="Soporte VIP">Soporte & Éxito</option>
            <option value="Cobranza">Cobranzas & Facturación</option>
            <option value="Prospección Fría">Prospección Telefónica</option>
          </select>
        </div>

        {/* Selector de Cliente Vinculado */}
        <div>
          <label className="text-[9px] uppercase font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Users className="w-2.5 h-2.5 text-slate-600" />
            <span>Cliente Vinculado</span>
          </label>
          <select
            value={selectedClientName}
            onChange={(e) => {
              const clientVal = e.target.value;
              const foundClient = clients.find((c: any) => c.name === clientVal || c.company === clientVal);
              onSelectClient(clientVal, foundClient?.phone);
            }}
            disabled={callStatus !== 'idle'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 font-medium focus:outline-none focus:border-cyan-400 disabled:opacity-50 cursor-pointer"
          >
            <option value="">-- Sin vincular / Marcado manual --</option>
            {clients.slice(0, 15).map((c: any) => (
              <option key={c.id || c.name} value={c.name || c.company}>
                {c.name || c.company} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botón directo a configuración avanzada de APIs & Troncales */}
      {activeCarrierObj && (
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-700" />
            <span>Cifrado TLS/SRTP con backend Telnyx & Zadarma</span>
          </span>
          <button
            type="button"
            onClick={() => onOpenProviderModal(activeCarrierObj)}
            className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-cyan-700 border border-cyan-200 hover:border-cyan-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            title="Configurar APIs, sockets y parámetros del carrier"
          >
            <Settings className="w-3 h-3" />
            <span>APIs & Troncales</span>
          </button>
        </div>
      )}
    </div>
  );
}
