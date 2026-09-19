import React, { useState } from 'react';
import { MapPin, Search, Clock, CheckCircle2, AlertTriangle, PhoneCall, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

interface VoipCoverageZonesProps {
  onSelectAreaCode?: (code: string) => void;
  className?: string;
}

const COVERAGE_LIST = [
  { code: '323', city: 'Los Ángeles', state: 'California', tz: 'America/Los_Angeles', label: 'PT (Pacífico)', status: 'Ruta Óptima' },
  { code: '619', city: 'San Diego', state: 'California', tz: 'America/Los_Angeles', label: 'PT (Pacífico)', status: 'Ruta Óptima' },
  { code: '760', city: 'Oceanside / Palm Springs', state: 'California', tz: 'America/Los_Angeles', label: 'PT (Pacífico)', status: 'Ruta Óptima' },
  { code: '720', city: 'Denver', state: 'Colorado', tz: 'America/Denver', label: 'MT (Montaña)', status: 'Ruta Óptima' },
  { code: '562', city: 'Long Beach', state: 'California', tz: 'America/Los_Angeles', label: 'PT (Pacífico)', status: 'Ruta Óptima' },
  { code: '631', city: 'Suffolk County (Long Island)', state: 'New York', tz: 'America/New_York', label: 'ET (Este)', status: 'Ruta Óptima' },
  { code: '856', city: 'Camden / Cherry Hill', state: 'New Jersey', tz: 'America/New_York', label: 'ET (Este)', status: 'Ruta Óptima' },
  { code: '213', city: 'Los Ángeles Downtown', state: 'California', tz: 'America/Los_Angeles', label: 'PT (Pacífico)', status: 'Ruta Óptima' },
  { code: '909', city: 'San Bernardino', state: 'California', tz: 'America/Los_Angeles', label: 'PT (Pacífico)', status: 'Ruta Óptima' },
  { code: '951', city: 'Riverside', state: 'California', tz: 'America/Los_Angeles', label: 'PT (Pacífico)', status: 'Ruta Óptima' },
  { code: '714', city: 'Anaheim / Orange County', state: 'California', tz: 'America/Los_Angeles', label: 'PT (Pacífico)', status: 'Ruta Óptima' }
];

export default function VoipCoverageZones({ onSelectAreaCode, className = '' }: VoipCoverageZonesProps) {
  const { t } = useLanguage();
  const [areaSearch, setAreaSearch] = useState('');

  const filtered = COVERAGE_LIST.filter(item => 
    item.code.includes(areaSearch) || 
    item.city.toLowerCase().includes(areaSearch.toLowerCase()) || 
    item.state.toLowerCase().includes(areaSearch.toLowerCase())
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 italic">
              <MapPin className="w-5 h-5 text-cyan-500" />
              <span>Zonas de Cobertura Activas (USA / LATAM)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Monitoreo de códigos de área autorizados, franja horaria local y verificación de horas legales de llamada (TCPA).
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código de área o ciudad..."
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400 font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            let localTimeStr = '';
            let isSafeToCall = true;
            try {
              localTimeStr = new Date().toLocaleTimeString('es-ES', {
                timeZone: item.tz,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
              const localHour = parseInt(new Date().toLocaleTimeString('en-US', { timeZone: item.tz, hour: '2-digit', hour12: false }), 10);
              isSafeToCall = localHour >= 9 && localHour < 20;
            } catch (e) {
              localTimeStr = '--:--';
            }

            return (
              <motion.div
                key={item.code}
                whileHover={{ y: -3 }}
                className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black font-mono text-cyan-500">
                        +1 ({item.code})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.city}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.state} · {item.label}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{localTimeStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSafeToCall 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}>
                      {isSafeToCall ? 'Horario Hábil' : 'Fuera de Horario'}
                    </span>

                    {onSelectAreaCode && (
                      <button
                        onClick={() => onSelectAreaCode(item.code)}
                        className="p-1 rounded-lg hover:bg-cyan-500/20 text-cyan-500"
                        title="Usar código en marcador"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
