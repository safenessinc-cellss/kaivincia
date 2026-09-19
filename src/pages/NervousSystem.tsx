import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, Activity, Zap, Users2, ShieldAlert, BarChart3, TrendingUp, DollarSign,
  Terminal, AlertTriangle, Cpu, Wifi, MessageSquare, Shield, Clock, Crosshair, CheckCircle2, X,
  Search, ChevronRight, Fingerprint, Lock, Globe, CheckSquare
} from 'lucide-react';
import { useGlobalContext } from '../contexts/GlobalContext';

// --- MOCK DATA ---
const INSIGHTS = [
  { 
    id: '1', 
    type: 'predictive', 
    title: 'Insights de Mañana', 
    value: 'Predicciones', 
    desc: 'Nuestro motor RAG analiza el Banco de Datos y flujos de sentimiento para anticipar cuellos de botella.', 
    icon: BarChart3, 
    color: 'text-[#00F0FF]' 
  },
  { 
    id: '2', 
    type: 'burnout', 
    title: 'Retención de Talento', 
    value: '94%', 
    desc: 'Probabilidad de Burnout en Módulo de Proyectos: Baja (12%)', 
    icon: Users2, 
    color: 'text-emerald-400' 
  },
  { 
    id: '3', 
    type: 'equilibrium', 
    title: 'Punto de Equilibrio', 
    value: '18/05', 
    desc: 'Capacidad de contratación sugerida: 2 nuevos Agentes Sr.', 
    icon: TrendingUp, 
    color: 'text-[#A855F7]' 
  },
  { 
    id: '4', 
    type: 'churn', 
    title: 'Riesgo de Churn', 
    value: 'High Q', 
    desc: 'Análisis de sentimiento detectó fricción en Facturación Q2.', 
    icon: AlertTriangle, 
    color: 'text-red-400' 
  },
];

const FEED_EVENTS = [
  { id: 101, type: 'projects', time: '15:05:55', msg: 'Retraso detectado en Proyecto TechCorp v2. Impacto: -12% Liquidez', icon: Clock, color: 'text-amber-400' },
  { id: 102, type: 'talent', time: '14:50:55', msg: 'Carlos Ruiz alcanzó ROI de 210%. Impacto: Bono Nómina Aplicado', icon: Zap, color: 'text-[#00F0FF]' },
  { id: 103, type: 'security', time: '14:20:55', msg: 'Palabra clave de riesgo "Reembolso" en Chat #402. Impacto: Log CISO Generado', icon: Shield, color: 'text-red-400' },
];

const LEADERBOARD = [
  { id: 'a1', name: 'Carlos Ruiz', roi: '210%', status: 'optimal', details: { revenue: '$52,200', deals: 14, avgDealSize: '$3,728', winRate: '72%' } },
  { id: 'a2', name: 'Ana Silva', roi: '195%', status: 'optimal', details: { revenue: '$48,000', deals: 11, avgDealSize: '$4,363', winRate: '65%' } },
  { id: 'a3', name: 'Marta García', roi: '160%', status: 'optimal', details: { revenue: '$38,500', deals: 9, avgDealSize: '$4,277', winRate: '58%' } },
  { id: 'a4', name: 'Roberto S.', roi: '155%', status: 'warning', details: { revenue: '$35,000', deals: 8, avgDealSize: '$4,375', winRate: '52%' } },
];

export default function NervousSystem() {
  const [systemState, setSystemState] = useState<'analysis' | 'alert' | 'secure'>('analysis');
  const [cashFlowPulse, setCashFlowPulse] = useState(false);
  const [cpuLoad, setCpuLoad] = useState(42);
  const [selectedAgent, setSelectedAgent] = useState<typeof LEADERBOARD[0] | null>(null);
  const { clients, tasks, users } = useGlobalContext();
  const navigate = useNavigate();

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
      setSystemState(prev => {
        if (prev === 'analysis') return 'alert';
        if (prev === 'alert') return 'secure';
        return 'analysis';
      });
    }, 15000);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(loadInterval);
      clearInterval(stateInterval);
    };
  }, []);

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] bg-[#020617] text-white p-6 md:p-10 space-y-10 flex flex-col relative overflow-hidden font-sans selection:bg-[#00F0FF]/30 selection:text-white">
      {/* Background Neural Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/50 to-transparent" />
      
      {/* Header Neural */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 shrink-0 relative z-10">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-gradient-to-br from-gray-900 to-black border border-[#00F0FF]/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.15)] group transition-all duration-500 hover:border-[#00F0FF]">
             <BrainCircuit className="w-10 h-10 text-[#00F0FF] group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Kaivincia Corp</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono text-[10px] font-black uppercase animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Admin System: Active
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-1.5">
              <span>Dashboard Executivo</span>
              <span className="w-1 h-1 bg-slate-800 rounded-full" />
              <span>IA Optimization</span>
              <span className="w-1 h-1 bg-slate-800 rounded-full" />
              <span className="text-emerald-500 font-bold">Security Pulse: 99.8% Encrypted</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 px-6 py-4 rounded-[2rem] shadow-2xl">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sistema Nervioso Neural</span>
            <span className="text-xs text-[#00F0FF] font-black uppercase tracking-tight">Command Center & Neural Chat</span>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-[10px] text-slate-500 uppercase">Latency Node</span>
               <span className="text-sm font-mono font-black text-emerald-400">12ms</span>
             </div>
             <div className="h-10 w-10 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center text-[#00F0FF]">
               <Fingerprint className="w-6 h-6" />
             </div>
          </div>
        </div>
      </div>

      {/* Operational Health Pulse Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10 shrink-0">
        <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-center group hover:bg-white/[0.04] transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Operational Health</span>
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-center group hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Uso de API GenAI</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-black text-white">88%</span>
            <div className="w-2 h-2 bg-[#00F0FF] rounded-full animate-pulse" />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-center group hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Sincronización GPS</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-black text-emerald-400">Active</span>
            <Globe className="w-4 h-4 text-emerald-500 animate-spin-slow" />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-center group hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Latencia de Nodo</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-black text-[#00F0FF]">14ms</span>
            <span className="text-[10px] font-bold text-[#00F0FF]/50 font-mono">U_NODE_01</span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid - I, II, III, IV */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0 relative z-10">
        {/* I. Cash Flow */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className={`bg-[#0f172a]/60 backdrop-blur-xl border rounded-[2rem] p-6 transition-all duration-700 ${cashFlowPulse ? 'border-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.1)]' : 'border-white/10'}`}
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">I. Cash Flow Analytics</h3>
            <div className="p-2 bg-[#00F0FF]/10 rounded-lg">
               <DollarSign className="w-5 h-5 text-[#00F0FF]" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-mono text-3xl font-black">$57.2K</span>
            <span className="text-sm font-bold text-emerald-400">+12.4%</span>
          </div>
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span className="text-slate-500">Operativo:</span>
              <span className="text-white font-bold">$45,200</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span className="text-slate-500">Neto:</span>
              <span className="text-emerald-400 font-bold">+$12,400</span>
            </div>
          </div>
        </motion.div>

        {/* II. Customer Health */}
        <motion.div whileHover={{ scale: 1.01 }} className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-400">II. Customer Nervous Health</h3>
            <div className="p-2 bg-red-400/10 rounded-lg">
               <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-mono text-3xl font-black">88%</span>
            <span className="text-sm font-bold text-red-400">-2% Risk</span>
          </div>
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span className="text-emerald-400 font-bold">Normal</span>
              <span className="text-slate-500">Status</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span className="text-red-400 font-bold">Error Node</span>
              <span className="text-white">2 Entities Delayed</span>
            </div>
          </div>
        </motion.div>

        {/* III. Performance Score */}
        <motion.div whileHover={{ scale: 1.01 }} className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">III. Performance Node Score</h3>
            <button onClick={() => navigate('/crm/team')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
              Audit Leaderboard →
            </button>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-3xl font-black">185%</span>
            <span className="text-sm font-bold text-emerald-400">+15% Efficient</span>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {LEADERBOARD.map((l) => (
              <button 
                key={l.id} 
                onClick={() => setSelectedAgent(l)} 
                className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5 hover:border-[#00F0FF]/30 transition-all group"
              >
                <div className="w-6 h-6 rounded bg-[#00F0FF]/10 flex items-center justify-center text-[10px] font-black text-[#00F0FF] group-hover:bg-[#00F0FF] group-hover:text-black transition-colors">
                  {l.name.charAt(0)}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                   <span className="text-[9px] font-black text-white/50 truncate w-16">{l.name.split(' ')[0]}</span>
                   <span className="text-[10px] font-mono font-black text-[#00F0FF]">{l.roi}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* IV. Growth Expansion */}
        <motion.div whileHover={{ scale: 1.01 }} className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-400">IV. Growth Systemic Expansion</h3>
            <div className="p-2 bg-purple-400/10 rounded-lg">
               <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-mono text-3xl font-black">+24%</span>
            <span className="text-sm font-bold text-purple-400 uppercase">Scale Active</span>
          </div>
          <div className="space-y-3 border-t border-white/5 pt-4">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">42</span>
                <span className="text-[9px] font-mono uppercase text-slate-500">Certificaciones Mes</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-[#A855F7]">12</span>
                <span className="text-[9px] font-mono uppercase text-slate-500">Nuevos Leads (High Q)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* V. Tasks Execution */}
        <motion.div 
          whileHover={{ scale: 1.01 }} 
          onClick={() => navigate('/crm/tasks')}
          className="bg-[#0f172a]/60 backdrop-blur-xl border border-[#00F0FF]/30 rounded-[2rem] p-6 cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">V. Collaborative Task Execution</h3>
            <div className="p-2 bg-[#00F0FF]/10 rounded-lg group-hover:bg-[#00F0FF] group-hover:text-black transition-colors">
               <CheckSquare className="w-5 h-5 text-[#00F0FF] group-hover:text-inherit" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-mono text-3xl font-black">92%</span>
            <span className="text-sm font-bold text-[#00F0FF] uppercase">Efficiency Rate</span>
          </div>
          <div className="space-y-3 border-t border-white/5 pt-4">
             <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Gestion de Tareas</span>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Insights, Link, Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 relative z-10">
        {/* Insights Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           <div className="bg-[#0B0E14]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-7 flex flex-col flex-1 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/5 blur-3xl rounded-full" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#00F0FF]">Insights de Mañana</h2>
                <BarChart3 className="w-5 h-5 text-slate-600" />
              </div>
              
              <div className="space-y-5 overflow-y-auto pr-3 custom-scrollbar flex-1">
                {INSIGHTS.map(insight => (
                  <motion.div 
                    key={insight.id} 
                    whileHover={{ x: 4 }}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#00F0FF]/20 transition-all cursor-default"
                  >
                     <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40">{insight.title}</span>
                        <span className={`text-xs font-mono font-black ${insight.color}`}>{insight.value}</span>
                     </div>
                     <p className="text-[10px] leading-relaxed text-slate-400 font-medium">{insight.desc}</p>
                  </motion.div>
                ))}
              </div>
              
              <button className="mt-6 w-full py-4 bg-gradient-to-r from-[#00F0FF]/10 to-[#00F0FF]/5 text-[#00F0FF] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-[#00F0FF]/20 hover:from-[#00F0FF]/20 hover:to-[#00F0FF]/10 transition-all">
                Ver Reporte de Estrategia
              </button>
           </div>
        </div>

        {/* Neural Link / Advisor Central Console */}
        <div className="lg:col-span-6 bg-[#0B0E14] border border-[#1E293B] rounded-[3.5rem] p-10 relative flex flex-col items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden group">
           {/* Decorative Outer Rings */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[500px] h-[500px] border border-[#00F0FF]/5 rounded-full animate-spin-slow" />
              <div className="w-[400px] h-[400px] border border-dashed border-[#00F0FF]/10 rounded-full animate-spin-reverse" />
              <div className="w-[300px] h-[300px] border border-[#00F0FF]/5 rounded-full animate-pulse" />
           </div>
           
           <motion.div 
             animate={{ 
               scale: [1, 1.04, 1],
               filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
             }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="relative z-10 mb-12"
           >
              <div className="w-40 h-40 flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-[#00F0FF]/10 blur-[40px] rounded-full animate-pulse" />
                 <BrainCircuit className="w-24 h-24 text-[#00F0FF] drop-shadow-[0_0_20px_#00F0FF]" />
              </div>
           </motion.div>

           <div className="w-full max-w-xl bg-black/80 border border-[#1E293B] rounded-[2.5rem] p-8 backdrop-blur-3xl relative z-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_#10B981]" />
                    <div>
                      <span className="text-[12px] font-black text-[#00F0FF] uppercase tracking-[0.4em]">IA Advisor // Neural Link</span>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">Estrategia Ejecutiva Copilot v2.0</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Status</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Synced</span>
                 </div>
              </div>
              
              <div className="space-y-8">
                 <div>
                    <div className="flex items-center gap-2 mb-3">
                       <Crosshair className="w-4 h-4 text-emerald-400" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Análisis Sistémico</span>
                    </div>
                    <div className="text-[13px] font-mono leading-relaxed text-slate-300 italic pl-6 border-l-2 border-emerald-500/30">
                      &gt; El <span className="text-emerald-400 font-bold">12% del Revenue</span> de este mes provino de cierres en 'Despliegue Táctico'. Sugerencia: <span className="text-white underline decoration-[#00F0FF]">Escalar rutas en Zona Norte</span> para maximizar ROI.
                    </div>
                    <button className="mt-5 ml-6 px-6 py-2.5 bg-[#00F0FF]/10 text-[#00F0FF] rounded-xl border border-[#00F0FF]/30 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#00F0FF] hover:text-black transition-all flex items-center gap-2 group">
                      <Zap className="w-3 h-3" /> Optimizar Rutas
                    </button>
                 </div>
                 
                 <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                       <AlertTriangle className="w-4 h-4 text-red-500" />
                       <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Alerta de Salud</span>
                    </div>
                    <p className="text-[13px] font-mono text-slate-400 leading-relaxed pl-6 border-l-2 border-red-500/30">
                      &gt; <span className="text-white font-bold">2 clientes</span> muestran deserción en el Módulo de Academia. Impacto proyectado: <span className="text-red-400">-$4.2k MRR</span>.
                    </p>
                    <button className="mt-5 ml-6 px-6 py-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/30 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-400 hover:text-white transition-all flex items-center gap-2">
                       Intervenir Academia
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Intelligence Feed Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           <div className="bg-[#0B0E14]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-7 flex flex-col flex-1 shadow-2xl relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#00F0FF]">Intelligence Feed</h2>
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </div>
              
              <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-8 relative">
                {/* Circuit Line Decor */}
                <div className="absolute left-[3px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-[#00F0FF]/20 via-[#00F0FF]/40 to-transparent z-0" />
                
                {FEED_EVENTS.map(event => (
                  <div key={event.id} className="relative pl-8 group cursor-default">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full border border-[#00F0FF]/50 bg-slate-900 z-10 group-hover:scale-125 transition-transform shadow-[0_0_8px_#00F0FF]" />
                    
                    <div className="flex justify-between items-center mb-1.5">
                       <span className="text-[10px] font-black uppercase text-[#00F0FF]/60 tracking-wider transition-colors group-hover:text-[#00F0FF]">{event.type}</span>
                       <span className="text-[9px] font-mono text-slate-500 font-bold">{event.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono transition-colors group-hover:text-white">{event.msg}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 space-y-3">
                 <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                    Ver Archivo Completo
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Modern Footer Stats Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 px-10 py-6 bg-[#0f172a]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] relative z-10">
        <div className="flex items-center gap-10">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Entidad</span>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-[#00F0FF] rounded-full" />
                 <span className="text-xs text-white font-black uppercase tracking-tight">Red Neuronal Kaivincia</span>
              </div>
           </div>
           <div className="h-8 w-px bg-white/5" />
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Cluster</span>
              <span className="text-xs text-[#00F0FF] font-black uppercase font-mono">Austin-Cluster-01</span>
           </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-10">
           <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cloud Load</span>
               <span className="text-xs text-white font-black font-mono">14.2%</span>
             </div>
             <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden">
               <motion.div animate={{ width: '14.2%' }} className="bg-[#00F0FF] h-full shadow-[0_0_8px_#00F0FF]" />
             </div>
           </div>
           
           <div className="flex flex-col items-center">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">User Synapses</span>
             <span className="text-xs text-emerald-400 font-black font-mono">1,242/s</span>
           </div>

           <div className="flex flex-col items-center">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Integrity</span>
             <span className="text-xs text-[#00F0FF] font-black font-mono">100.00%</span>
           </div>

           <div className="flex flex-col items-center">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">System Latency</span>
             <span className="text-xs text-white font-black font-mono">12ms</span>
           </div>
        </div>
      </div>

      {/* Agent Details Bio-Metric Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, rotateX: 20 }}
              animate={{ scale: 1, rotateX: 0 }}
              exit={{ scale: 0.9, rotateX: 20 }}
              className="bg-[#0f172a] border border-[#00F0FF]/40 rounded-[3rem] p-10 w-full max-w-md shadow-[0_0_80px_rgba(0,240,255,0.2)] relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00F0FF]/5 to-transparent h-20 animate-[scan_3s_linear_infinite] pointer-events-none" />
              
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-5">
                   <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-[#00F0FF]/30 p-1">
                         <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-2xl font-black text-[#00F0FF]">
                            {selectedAgent.name.charAt(0)}
                         </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0f172a] animate-pulse" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                        {selectedAgent.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                         <Fingerprint className="w-3 h-3 text-[#00F0FF]" />
                         <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                           Identity Verified
                         </p>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedAgent(null)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${selectedAgent.status === 'optimal' ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 shadow-[0_0_30px_rgba(0,240,255,0.1)]' : 'bg-amber-500/10 border-amber-500/30'}`}>
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-1">ROI Score</span>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Optimal Node Pulse</span>
                  </div>
                  <span className={`text-4xl font-mono font-black ${selectedAgent.status === 'optimal' ? 'text-[#00F0FF]' : 'text-amber-400'}`}>
                    {selectedAgent.roi}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/50 border border-[#1E293B] rounded-3xl p-5 group hover:border-[#00F0FF]/30 transition-all">
                    <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Revenue</p>
                    <p className="text-lg font-black text-emerald-400 font-mono tracking-tighter group-hover:scale-105 transition-transform">{selectedAgent.details.revenue}</p>
                  </div>
                  <div className="bg-black/50 border border-[#1E293B] rounded-3xl p-5 group hover:border-[#00F0FF]/30 transition-all">
                    <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Win Rate</p>
                    <p className="text-lg font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform">{selectedAgent.details.winRate}</p>
                  </div>
                  <div className="bg-black/50 border border-[#1E293B] rounded-3xl p-5 group hover:border-[#00F0FF]/30 transition-all">
                    <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Ticket Avg</p>
                    <p className="text-lg font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform">{selectedAgent.details.avgDealSize}</p>
                  </div>
                  <div className="bg-black/50 border border-[#1E293B] rounded-3xl p-5 group hover:border-[#00F0FF]/30 transition-all">
                    <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Deals Closed</p>
                    <p className="text-lg font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform">{selectedAgent.details.deals}</p>
                  </div>
                </div>
                
                <button 
                   onClick={() => navigate('/crm/team')}
                   className="w-full py-5 bg-gradient-to-r from-[#00F0FF] to-cyan-600 rounded-3xl text-black font-black uppercase text-xs tracking-[0.2em] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center gap-3"
                >
                   Ver Despliegue de Skill Map <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(500%); }
        }
        @keyframes red-pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(0, 240, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0); }
        }
      `}} />
    </div>
  );
}

