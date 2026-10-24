import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  Settings, 
  RefreshCw, 
  Power, 
  Activity, 
  Send, 
  ShieldAlert,
  Webhook,
  Mail,
  FileSpreadsheet,
  MessageCircle,
  Instagram,
  Share2
} from 'lucide-react';
import { IntegrationItem } from '../../types/integrations';

interface ProviderCardProps {
  item: IntegrationItem;
  isAdmin: boolean;
  onTest: (item: IntegrationItem) => void;
  onConfigure: (item: IntegrationItem) => void;
  onToggleStatus: (item: IntegrationItem) => void;
  isTesting: boolean;
}

export const getProviderIcon = (iconType: string, className: string = 'w-6 h-6') => {
  switch (iconType) {
    case 'meta':
      return <Share2 className={`${className} text-[#1877F2]`} />;
    case 'instagram':
      return <Instagram className={`${className} text-[#E4405F]`} />;
    case 'whatsapp':
      return <MessageCircle className={`${className} text-[#25D366]`} />;
    case 'forms':
      return <FileSpreadsheet className={`${className} text-[#00F0FF]`} />;
    case 'email':
      return <Mail className={`${className} text-[#F59E0B]`} />;
    case 'webhook':
      return <Webhook className={`${className} text-[#A855F7]`} />;
    default:
      return <Activity className={`${className} text-[#00F0FF]`} />;
  }
};

export default function ProviderCard({
  item,
  isAdmin,
  onTest,
  onConfigure,
  onToggleStatus,
  isTesting
}: ProviderCardProps) {
  const isConnected = item.status === 'connected';
  const isPending = item.status === 'pending';
  const isError = item.status === 'error';

  return (
    <div
      id={`provider-card-${item.id}`}
      className={`rounded-2xl border transition-all duration-300 p-6 flex flex-col justify-between ${
        isConnected
          ? 'bg-slate-900/60 border-slate-800 hover:border-[#00F0FF]/40 hover:shadow-[0_0_25px_rgba(0,240,255,0.08)]'
          : isError
          ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700/60'
          : 'bg-slate-950/60 border-slate-800/80 hover:border-amber-500/40'
      }`}
    >
      <div>
        {/* Top bar: Icon, title, status badge */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center p-2.5 shrink-0 shadow-inner">
              {getProviderIcon(item.iconType, 'w-6 h-6')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {item.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="shrink-0">
            {isConnected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Conectado
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Clock className="w-3 h-3" />
                Pendiente
              </span>
            )}
            {isError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3 h-3" />
                Error
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300/90 leading-relaxed mb-4">
          {item.description}
        </p>

        {/* Config Summary Chips */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-4 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-mono">Configuración activa:</span>
            {item.isConfigured ? (
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Válida
              </span>
            ) : (
              <span className="text-amber-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" /> Requiere parámetros
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
            {item.config.pageId && (
              <div className="truncate">
                <span className="text-slate-600">Page ID: </span>
                <span className="text-slate-200">{item.config.pageId}</span>
              </div>
            )}
            {item.config.formId && (
              <div className="truncate">
                <span className="text-slate-600">Form: </span>
                <span className="text-slate-200">{item.config.formId}</span>
              </div>
            )}
            {item.config.phoneNumberId && (
              <div className="truncate">
                <span className="text-slate-600">Phone ID: </span>
                <span className="text-slate-200">{item.config.phoneNumberId}</span>
              </div>
            )}
            {item.config.instagramAccountId && (
              <div className="truncate">
                <span className="text-slate-600">Account: </span>
                <span className="text-slate-200">@{item.config.instagramAccountId}</span>
              </div>
            )}
            {item.config.universalWebhookKey && (
              <div className="truncate col-span-2">
                <span className="text-slate-600">Key: </span>
                <span className="text-[#00F0FF]">{item.config.universalWebhookKey}</span>
              </div>
            )}
            {item.config.smtpHost && (
              <div className="truncate col-span-2">
                <span className="text-slate-600">SMTP: </span>
                <span className="text-slate-200">{item.config.smtpHost}:{item.config.smtpPort || 587}</span>
              </div>
            )}
            {item.config.targetEndpoint && (
              <div className="truncate col-span-2">
                <span className="text-slate-600">Endpoint: </span>
                <span className="text-slate-200">{item.config.targetEndpoint}</span>
              </div>
            )}
          </div>
        </div>

        {/* Enabled Events Tags */}
        <div className="mb-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1.5">
            Eventos en Automation Engine:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {item.enabledEvents.map((evt) => (
              <span
                key={evt}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-cyan-300 border border-cyan-800/30"
              >
                {evt}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 text-center mb-4">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Recibidos</span>
            <span className="text-xs font-mono font-bold text-white">
              {item.stats.totalReceived.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Éxito</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {item.stats.successCount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Errores</span>
            <span className={`text-xs font-mono font-bold ${item.stats.errorCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {item.stats.errorCount}
            </span>
          </div>
        </div>

        {/* Last test result notice */}
        {item.testResult && (
          <div
            className={`p-2.5 rounded-xl border text-[11px] mb-4 flex items-start gap-2 ${
              item.testResult.success
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
            }`}
          >
            {item.testResult.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-tight">
              <span className="font-semibold block">{item.testResult.message}</span>
              {item.testResult.latencyMs && (
                <span className="text-[10px] opacity-75 font-mono">
                  Latencia: {item.testResult.latencyMs}ms • {new Date(item.testResult.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <a
          href={item.docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-[#00F0FF] flex items-center gap-1 transition-colors py-1.5"
          title="Ver documentación oficial de la API"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Docs</span>
        </a>

        <div className="flex items-center gap-2">
          {/* Test connection button */}
          <button
            id={`btn-test-${item.id}`}
            type="button"
            disabled={isTesting}
            onClick={() => onTest(item)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-all border border-slate-700 hover:border-slate-600 disabled:opacity-50 cursor-pointer"
            title="Ejecutar prueba de conexión real con el servidor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#00F0FF]' : ''}`} />
            <span>{isTesting ? 'Probando...' : 'Probar'}</span>
          </button>

          {/* Configure button */}
          <button
            id={`btn-configure-${item.id}`}
            type="button"
            onClick={() => onConfigure(item)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] flex items-center gap-1.5 transition-all border border-[#00F0FF]/40 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar</span>
          </button>

          {/* Connect/Disconnect toggle (RBAC Admin only) */}
          {isAdmin ? (
            <button
              id={`btn-toggle-${item.id}`}
              type="button"
              onClick={() => onToggleStatus(item)}
              className={`p-2 rounded-xl text-xs transition-all border cursor-pointer ${
                isConnected
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title={isConnected ? 'Desconectar integración' : 'Conectar integración'}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span
              className="p-2 rounded-xl bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
              title="Solo administradores pueden conectar o desconectar"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
