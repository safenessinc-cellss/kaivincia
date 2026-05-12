import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, Activity, Zap, Users2, ShieldAlert, BarChart3, TrendingUp, DollarSign,
  Terminal, AlertTriangle, Cpu, Wifi, MessageSquare, Shield, Clock, Crosshair, CheckCircle2, X
} from 'lucide-react';

// --- MOCK DATA ---
const INSIGHTS = [
  { id: '1', type: 'burnout', title: 'Riesgo de Burnout', value: '78%', desc: 'Módulo Talento: 3 agentes superan 50h/sem.', icon: Users2, color: 'text-amber-400' },
  { id: '2', type: 'hiring', title: 'Equilibrio Capacit.', value: '+2 Asesores', desc: 'Sugerencia de contratación Q3.', icon: TrendingUp, color: 'text-[#22D3EE]' },
  { id: '3', type: 'churn', title: 'Riesgo de Churn', value: '14%', desc: 'Análisis de Sentimiento B2B.', icon: AlertTriangle, color: 'text-red-400' },
];

const FEED_EVENTS = [
  { id: 101, type: 'projects', time: 'hace 2 min', msg: '[ALERTA] Proyecto Alpha retrasado. Impacto Liq: -$4.2K', icon: Clock, color: 'text-amber-400' },
  { id: 102, type: 'talent', time: 'hace 15 min', msg: '[AUTO] Bono ROI 15% aplicado a Carlos M.', icon: Zap, color: 'text-[#22D3EE]' },
  { id: 103, type: 'security', time: 'hace 45 min', msg: '[CISO] Escaneo: Palabra "Reembolso" detectada (Chat #422)', icon: Shield, color: 'text-red-400' },
  { id: 104, type: 'projects', time: 'hace 1 hora', msg: '[INFO] Integración ERP completada al 100%.', icon: CheckCircle2, color: 'text-emerald-400' },
];

const LEADERBOARD = [
  { 
    id: 'a1',
    name: 'Ana S.', 
    roi: '240%', 
    status: 'optimal',
    details: { revenue: '$45,200', deals: 12, avgDealSize: '$3,766', winRate: '68%' }
  },
  { 
    id: 'a2',
    name: 'Carlos M.', 
    roi: '185%', 
    status: 'optimal',
    details: { revenue: '$32,100', deals: 8, avgDealSize: '$4,012', winRate: '54%' }
  },
  { 
    id: 'a3',
    name: 'Marta T.', 
    roi: '92%', 
    status: 'warning',
    details: { revenue: '$14,500', deals: 4, avgDealSize: '$3,625', winRate: '32%' }
  },
];

export default function NervousSystem() {
  const [systemState, setSystemState] = useState<'analysis' | 'alert'>('analysis');
  const [cashFlowPulse, setCashFlowPulse] = useState(false);
  const [cpuLoad, setCpuLoad] = useState(42);
  const [selectedAgent, setSelectedAgent] = useState<typeof LEADERBOARD[0] | null>(null);

  // Simulate dynamic data
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setCashFlowPulse(true);
      setTimeout(() => setCashFlowPulse(false), 1000);
    }, 8000);

    const loadInterval = setInterval(() => {
      setCpuLoad(Math.floor(30 + Math.random() * 40));
    }, 3000);

    const stateInterval = setInterval(() => {
      setSystemState(prev => prev === 'analysis' ? 'alert' : 'analysis');
    }, 15000);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(loadInterval);
      clearInterval(stateInterval);
    };
  }, []);

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] bg-[#020617] text-white p-6 space-y-6 flex flex-col relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/30 to-transparent" />

      {/* Header */}
      <div className="flex justify-between items-center shrink-0 relative z-10">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            Nervous System
          </h1>
          <p className="text-[10px] font-mono text-[#22D3EE]/70 uppercase tracking-widest mt-1 ml-9">
            Centro de Comando Neuronal & IA Predictiva
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase font-mono tracking-widest bg-[#0f172a]/80 border border-[#1E293B] px-4 py-2 rounded-lg">
          <span className="flex items-center gap-2"><Wifi className="w-3 h-3 text-emerald-400" /> Link Activo</span>
          <span className="w-px h-3 bg-[#1E293B]" />
          <span className="flex items-center gap-2 text-cyan-400"><Cpu className="w-3 h-3" /> Load: {cpuLoad}%</span>
        </div>
      </div>

      {/* Top Row: Global System Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 relative z-10">
        {/* Cash Flow */}
        <div className={`bg-[#0f172a]/80 backdrop-blur border rounded-2xl p-5 transition-all duration-500 ${cashFlowPulse ? 'border-[#22D3EE] shadow-[0_0_20px_rgba(34,211,238,0.2)] scale-[1.02]' : 'border-[#1E293B] shadow-lg'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cash Flow Analytics</h3>
            <DollarSign className={`w-4 h-4 ${cashFlowPulse ? 'text-[#22D3EE]' : 'text-slate-500'}`} />
          </div>
          <div className="font-mono text-xl font-bold mb-1">$142,500 <span className="text-xs text-emerald-400">+12%</span></div>
          <p className="text-[9px] font-mono text-slate-500 uppercase">Operativo vs. Neto</p>
        </div>

        {/* Neural Health */}
        <div className="bg-[#0f172a]/80 backdrop-blur border border-[#1E293B] rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Health</h3>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-1 relative z-10">
            <span className="font-mono text-xl font-bold text-white">8.5%</span>
            <span className="text-[10px] font-mono text-red-400 px-1.5 py-0.5 bg-red-400/10 rounded uppercase">Riesgo</span>
          </div>
          <p className="text-[9px] font-mono text-slate-500 uppercase relative z-10">3 Error Nodes detectados</p>
        </div>

        {/* Performance Node */}
        <div className="bg-[#0f172a]/80 backdrop-blur border border-[#1E293B] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Score (ROI)</h3>
            <Crosshair className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-2">
            {LEADERBOARD.map((l, i) => (
              <button 
                key={l.id} 
                onClick={() => setSelectedAgent(l)}
                className="w-full flex justify-between items-center text-[10px] font-mono p-2 rounded hover:bg-[#1E293B]/50 transition-colors border border-transparent hover:border-[#1E293B] group"
              >
                <span className="text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${l.status === 'optimal' ? 'bg-[#22D3EE]' : 'bg-amber-400'}`} />
                  {l.name}
                </span>
                <span className={`${l.status === 'warning' ? 'text-amber-400' : 'text-[#22D3EE]'} font-bold`}>{l.roi}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Growth Expansion */}
        <div className="bg-[#0f172a]/80 backdrop-blur border border-[#1E293B] rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Growth Expansion</h3>
            <TrendingUp className="w-4 h-4 text-[#A855F7]" />
          </div>
          <div className="flex items-baseline gap-3 mb-1">
            <div className="font-mono text-xl font-bold">124 <span className="text-[10px] text-slate-500 font-normal">HQ Leads</span></div>
          </div>
          <div className="font-mono text-[9px] text-[#A855F7] uppercase flex items-center gap-1">
            <Zap className="w-3 h-3" /> 14 Certificaciones activas
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 relative z-10">
        
        {/* I. Insights de Mañana */}
        <div className="lg:col-span-3 bg-[#0f172a]/80 backdrop-blur border border-[#1E293B] rounded-3xl p-5 flex flex-col shadow-lg">
           <div className="flex items-center gap-2 mb-6 shrink-0">
             <BarChart3 className="w-4 h-4 text-emerald-400" />
             <h2 className="text-[10px] font-black uppercase tracking-widest text-white">Insights de Mañana</h2>
           </div>
           
           <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
             {INSIGHTS.map(insight => (
               <div key={insight.id} className="p-4 rounded-xl bg-black/40 border border-[#1E293B] hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                     <insight.icon className={`w-4 h-4 ${insight.color}`} />
                     <span className={`text-xs font-mono font-bold ${insight.color}`}>{insight.value}</span>
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-300 mb-1">{insight.title}</h4>
                  <p className="text-[10px] font-mono text-gray-500">{insight.desc}</p>
               </div>
             ))}
           </div>
        </div>

        {/* II. IA Advisor / Neural Link */}
        <div className="lg:col-span-6 bg-[#0B0E14] border border-[#1E293B] rounded-3xl p-6 relative shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col justify-center items-center overflow-hidden">
           {/* Decorative Tech Rings */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-[400px] h-[400px] border border-[#22D3EE] rounded-full animate-[spin_60s_linear_infinite]" />
              <div className="w-[300px] h-[300px] border border-dashed border-[#22D3EE] rounded-full absolute animate-[spin_40s_linear_infinite_reverse]" />
           </div>

           {/* Central Brain Hologram */}
           <motion.div 
             animate={{ scale: [1, 1.05, 1], filter: ['drop-shadow(0 0 10px #22D3EE)', 'drop-shadow(0 0 30px #22D3EE)', 'drop-shadow(0 0 10px #22D3EE)'] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="relative z-10 mb-8 mt-4"
           >
              <BrainCircuit className="w-24 h-24 text-[#22D3EE]" strokeWidth={1} />
           </motion.div>

           {/* Console Data Window */}
           <div className="w-full max-w-lg bg-black/60 border border-[#1E293B] rounded-xl p-4 backdrop-blur-md relative z-10 font-mono">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1E293B]">
                 <Terminal className="w-4 h-4 text-[#22D3EE]" />
                 <span className="text-[10px] text-[#22D3EE] uppercase tracking-widest font-black">Neural Link v2.0</span>
              </div>
              
              <AnimatePresence mode="wait">
                 {systemState === 'analysis' ? (
                   <motion.div 
                     key="analysis"
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                     className="min-h-[60px]"
                   >
                     <p className="text-xs text-emerald-400 mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        [ANALISIS_SISTEMICO]
                     </p>
                     <p className="text-sm text-gray-300 leading-relaxed">
                        &gt; Cruzando datos de Despliegue Táctico vs ROI...<br/>
                        &gt; Eficiencia táctica estabilizada al 87.4%. No se requieren ajustes mediatos.
                     </p>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="alert"
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                     className="min-h-[60px]"
                   >
                     <p className="text-xs text-amber-500 mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        [ALERTA_DE_SALUD]
                     </p>
                     <p className="text-sm text-gray-300 leading-relaxed">
                        &gt; Detectada deserción atípica en Academia Interna (Cohorte B).<br/>
                        &gt; Proyección: Pérdida potencial de MRR de $12.5K en Q4 si no se interviene.
                     </p>
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* III. Intelligence Feed */}
        <div className="lg:col-span-3 bg-[#0f172a]/80 backdrop-blur border border-[#1E293B] rounded-3xl p-5 flex flex-col shadow-lg">
           <div className="flex items-center gap-2 mb-6 shrink-0">
             <MessageSquare className="w-4 h-4 text-cyan-400" />
             <h2 className="text-[10px] font-black uppercase tracking-widest text-white">Intelligence Feed</h2>
           </div>

           <div className="space-y-0 relative flex-1 overflow-y-auto pr-2 custom-scrollbar">
             {/* Vertical Line */}
             <div className="absolute left-[11px] top-2 bottom-0 w-px bg-[#1E293B] z-0" />
             
             {FEED_EVENTS.map(event => (
               <div key={event.id} className="relative z-10 flex gap-4 mb-6 last:mb-0 group">
                  <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full bg-[#020617] border border-[#1E293B] group-hover:border-white/30 flex items-center justify-center transition-colors`}>
                     <event.icon className={`w-3 h-3 ${event.color}`} />
                  </div>
                  <div>
                     <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">{event.time}</p>
                     <p className="text-xs text-gray-300 font-mono leading-relaxed">{event.msg}</p>
                  </div>
               </div>
             ))}
           </div>
        </div>

      </div>

      {/* Agent Details Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#0f172a] border border-[#22D3EE]/30 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(34,211,238,0.15)] relative overflow-hidden"
            >
              {/* Scanline Effect */}
              <div className="absolute inset-x-0 h-2 bg-[#22D3EE]/20 top-0 animate-[scan_2s_linear_infinite]" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-[#22D3EE]" /> 
                    {selectedAgent.name}
                  </h3>
                  <p className="text-[10px] font-mono text-[#22D3EE]/70 uppercase tracking-widest mt-1">
                    Desglose de ROI Táctico
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedAgent(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${selectedAgent.status === 'optimal' ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                  <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest">ROI Total</span>
                  <span className={`text-2xl font-mono font-bold ${selectedAgent.status === 'optimal' ? 'text-[#22D3EE]' : 'text-amber-400'}`}>
                    {selectedAgent.roi}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 border border-[#1E293B] rounded-lg p-3">
                    <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">Ingreso (Revenue)</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{selectedAgent.details.revenue}</p>
                  </div>
                  <div className="bg-black/30 border border-[#1E293B] rounded-lg p-3">
                    <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">Cierres (Deals)</p>
                    <p className="text-sm font-bold text-white font-mono">{selectedAgent.details.deals}</p>
                  </div>
                  <div className="bg-black/30 border border-[#1E293B] rounded-lg p-3">
                    <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">Win Rate</p>
                    <p className="text-sm font-bold text-white font-mono">{selectedAgent.details.winRate}</p>
                  </div>
                  <div className="bg-black/30 border border-[#1E293B] rounded-lg p-3">
                    <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">Ticket Promedio</p>
                    <p className="text-sm font-bold text-white font-mono">{selectedAgent.details.avgDealSize}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
