import React from 'react';
import { Phone, Sliders, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SoftphoneTabsProps {
  activeTab: 'dialer' | 'config';
  onTabChange: (tab: 'dialer' | 'config') => void;
  selectedCarrierName?: string;
  hasValidSip?: boolean;
  authorizedCallerId?: string;
  isFloating?: boolean;
}

export default function SoftphoneTabs({
  activeTab,
  onTabChange,
  selectedCarrierName,
  hasValidSip = true,
  authorizedCallerId,
  isFloating = false
}: SoftphoneTabsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between bg-slate-900/90 p-1 rounded-2xl border border-slate-800/80 mb-3 shadow-inner">
      <div className="grid grid-cols-2 gap-1 w-full">
        {/* Pestaña 1: Marcador */}
        <button
          type="button"
          onClick={() => onTabChange('dialer')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dialer'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Phone className={`w-3.5 h-3.5 ${activeTab === 'dialer' ? 'fill-current' : ''}`} />
          <span>{t('voip.tab_dialer', 'Marcador')}</span>
        </button>

        {/* Pestaña 2: Configuración */}
        <button
          type="button"
          onClick={() => onTabChange('config')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'config'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t('voip.tab_config', 'Configuración')}</span>

          {/* Indicador de estado de línea */}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hasValidSip ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
            }`}
            title={hasValidSip ? 'Línea SIP configurada' : 'Configuración pendiente'}
          />
        </button>
      </div>
    </div>
  );
}
