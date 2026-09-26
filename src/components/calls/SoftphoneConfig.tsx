import React from 'react';
import { 
  Radio, 
  Activity, 
  Settings, 
  UserCheck, 
  Briefcase, 
  Users, 
  ShieldCheck, 
  SlidersHorizontal 
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
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 space-y-3 shadow-inner">
      {/* Cabecera con Latencia y Acciones Rápidas */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-black uppercase text-white tracking-wider">
            {t('voip.routing_title', 'Parámetros de Enrutamiento')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" />
            <span>{liveLatency}ms</span>
          </span>
          {activeCarrierObj && (
            <button
              type="button"
              onClick={() => onOpenProviderModal(activeCarrierObj)}
              className="text-[9px] font-black uppercase text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
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
          <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-cyan-400" />
            <span>Troncal / Carrier Activo</span>
          </label>
          <select
            value={selectedCarrier}
            onChange={(e) => onSelectCarrier(e.target.value)}
            disabled={callStatus !== 'idle'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isDefault ? '⭐' : ''} ({p.costPerMinute || '$0.012'}/m)
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Caller ID Autorizado */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <UserCheck className="w-2.5 h-2.5 text-cyan-400" />
              <span>Caller ID de Salida</span>
            </label>
            {authorizedCallerIds.length > 0 && (
              <span className="text-[9px] text-emerald-400 font-bold">● Habilitado</span>
            )}
          </div>

          {authorizedCallerIds.length > 0 ? (
            <select
              value={selectedCallerId}
              onChange={(e) => onSelectCallerId(e.target.value)}
              disabled={callStatus !== 'idle'}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400 disabled:opacity-50 cursor-pointer"
            >
              {authorizedCallerIds.map(num => (
                <option key={num} value={num}>
                  {num} {agentAssignment?.defaultCallerId === num ? '(Default)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-slate-950 border border-amber-500/30 rounded-xl px-2.5 py-1.5 text-[10px] text-amber-300 font-medium">
              Central: +1 (305) 555-0199
            </div>
          )}
        </div>
      </div>

      {/* Grid de Proyecto y Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/60">
        {/* Selector de Proyecto / Campaña */}
        <div>
          <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Briefcase className="w-2.5 h-2.5 text-slate-400" />
            <span>Proyecto / Campaña</span>
          </label>
          <select
            value={selectedProject}
            onChange={(e) => onSelectProject(e.target.value)}
            disabled={callStatus !== 'idle'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-cyan-400 disabled:opacity-50 cursor-pointer"
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
          <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Users className="w-2.5 h-2.5 text-slate-400" />
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-cyan-400 disabled:opacity-50 cursor-pointer"
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
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>Cifrado TLS/SRTP con backend Telnyx & Zadarma</span>
          </span>
          <button
            type="button"
            onClick={() => onOpenProviderModal(activeCarrierObj)}
            className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
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
