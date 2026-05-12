import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  DollarSign, Activity, Wallet, Users, 
  Target, TrendingUp, ShieldAlert, Zap, Sparkles, 
  CheckCircle2, Clock, 
  BrainCircuit, BarChart3, BookOpen, ChevronRight, 
  History, RefreshCw, FileText,
  Cpu, Layers, Network
} from 'lucide-react';
import { 
  AreaChart, Area, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { collection, query, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import IAAdvisor from '../components/IAAdvisor';

interface SystemEvent {
  id: string;
  module: 'Finanzas' | 'Proyectos' | 'Talento' | 'Academia' | 'Seguridad';
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  impact: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Data State
  const [clients, setClients] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // System Events Feed
  const [events, setEvents] = useState<SystemEvent[]>([
    { 
      id: '1', 
      module: 'Proyectos', 
      type: 'warning', 
      message: 'Retraso detectado en Proyecto TechCorp v2', 
      timestamp: new Date(), 
      impact: '-12% Liquidez Proyectada' 
    },
    { 
      id: '2', 
      module: 'Talento', 
      type: 'success', 
      message: 'Carlos Ruiz alcanzó ROI de 210%', 
      timestamp: new Date(Date.now() - 1000 * 60 * 15), 
      impact: 'Bono Nómina Aplicado' 
    },
    { 
      id: '3', 
      module: 'Seguridad', 
      type: 'error', 
      message: 'Palabra clave de riesgo "Reembolso" en Chat #402', 
      timestamp: new Date(Date.now() - 1000 * 60 * 45), 
      impact: 'Log CISO Generado' 
    }
  ]);

  useEffect(() => {
    // Listeners for real database connection test
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubClients();
    };
  }, []);

  // Intelligence Pulse Metrics
  const mrr = useMemo(() => clients.reduce((acc, c) => acc + (Number(c.amount) || 0), 0), [clients]);
  const avgHealth = 88; 
  const teamROI = 185; 
  const academyGrowth = 24;

  const handleAiOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      const newEvent: SystemEvent = {
        id: Math.random().toString(),
        module: 'Talento',
        type: 'success',
        message: 'Optimización IA: Carga redistribuida según certificaciones Academia',
        timestamp: new Date(),
        impact: '+15% Eficiencia Operativa'
      };
      setEvents([newEvent, ...events.slice(0, 4)]);
    }, 2000);
  };

  const chartData = [
    { name: 'Lun', revenue: 4000, expenses: 2400 },
    { name: 'Mar', revenue: 3000, expenses: 1398 },
    { name: 'Mie', revenue: 2000, expenses: 9800 },
    { name: 'Jue', revenue: 2780, expenses: 3908 },
    { name: 'Vie', revenue: 1890, expenses: 4800 },
    { name: 'Sab', revenue: 2390, expenses: 3800 },
    { name: 'Dom', revenue: 3490, expenses: 4300 },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-400 font-sans p-6 lg:p-10 pb-20">
      
      {/* HEADER: DYNAMIC STATUS BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Nervous System</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Synapse: Active
              </span>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest border-l border-white/10 pl-3">
                Kaivincia Architecture v5.0
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleAiOptimization}
            disabled={isOptimizing}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/30 transition-all flex items-center gap-3 group relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isOptimizing ? (
                <motion.div 
                  key="optimizing"
                  initial={{ rotate: 0 }} 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              ) : (
                <Sparkles key="idle" className="w-4 h-4 group-hover:scale-125 transition-transform" />
              )}
            </AnimatePresence>
            {isOptimizing ? 'Optimizando...' : 'IA Optimization'}
          </button>
          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl">
             <div className="text-right">
                <p className="text-[8px] font-black uppercase text-gray-500">Security Pulse</p>
                <p className="text-xs font-black text-white">99.8% Encrypted</p>
             </div>
             <ShieldAlert className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Hero Illustration */}
      <div className="w-full aspect-[21/9] md:aspect-[21/6] rounded-3xl overflow-hidden relative border border-white/10 group mb-10">
         <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/50 to-transparent z-10" />
         <img 
           src="https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1600&q=80" 
           alt="Sistema Nervioso Neural" 
           className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
         />
         <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
            <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">Command Center & Neural Chat</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#deff9a] shadow-[0_0_10px_#deff9a] animate-pulse" />
              <span className="text-[10px] font-mono text-[#deff9a] uppercase tracking-[0.2em] drop-shadow-md">glowing holographic brain interconnected with data nodes</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* NEW: PREDICTIVE INSIGHTS RADAR (INSIGHTS DE MAÑANA) */}
        <div className="xl:col-span-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#151921] to-[#1a1f28] border border-[#00F0FF]/20 rounded-[3rem] p-8 relative overflow-hidden group shadow-[0_0_50px_rgba(181,154,69,0.05)]"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
               <Zap className="w-32 h-32 text-[#00F0FF]" />
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
               <div className="lg:w-1/3 flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="flex items-center gap-2 text-[#00F0FF] mb-4">
                     <BrainCircuit className="w-6 h-6" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Insights de Mañana</span>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none mb-6">
                     Predicciones <br/> Algorítmicas
                  </h2>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-sm mb-8">
                     Nuestro motor RAG analiza el Banco de Datos y flujos de sentimiento para anticipar cuellos de botella operativos antes de que ocurran.
                  </p>
                  <button 
                    onClick={() => navigate('/crm/reports')}
                    className="flex items-center gap-3 px-8 py-4 bg-[#00F0FF] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#00F0FF]/20"
                  >
                     <FileText className="w-4 h-4" /> Ver Reporte de Estrategia
                  </button>
               </div>

               <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {[
                    { 
                      title: 'Retención de Talento', 
                      desc: 'Probabilidad de Burnout en Módulo de Proyectos: Baja (12%)', 
                      icon: <Users className="w-5 h-5" />, 
                      val: '94%',
                      color: 'emerald'
                    },
                    { 
                      title: 'Punto de Equilibrio', 
                      desc: 'Capacidad de contratación sugerida: 2 nuevos Agentes Sr.', 
                      icon: <TrendingUp className="w-5 h-5" />, 
                      val: '18/05',
                      color: 'blue'
                    },
                    { 
                      title: 'Riesgo de Churn', 
                      desc: 'Análisis de sentimiento detectó fricción en Facturación Q2.', 
                      icon: <ShieldAlert className="w-5 h-5" />, 
                      val: 'High Q',
                      color: 'amber'
                    }
                  ].map((insight, idx) => (
                    <div key={idx} className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-[#00F0FF]/30 transition-all group/card">
                       <div className={`h-12 w-12 rounded-2xl bg-${insight.color}-500/10 text-${insight.color}-500 flex items-center justify-center mb-6 group-hover/card:scale-110 transition-transform`}>
                          {insight.icon}
                       </div>
                       <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">{insight.title}</p>
                       <p className="text-xs font-bold text-gray-300 leading-relaxed mb-4">{insight.desc}</p>
                       <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                          <span className={`text-xl font-black italic tracking-tighter text-${insight.color}-500`}>{insight.val}</span>
                          <ChevronRight className="w-4 h-4 text-gray-700" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>

        {/* NEURAL PULSE & AI OVERVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
           <div className="lg:col-span-8">
              <IAAdvisor 
                moduleName="Estrategia Ejecutiva"
                insights={[
                  { 
                    type: 'automation', 
                    message: "Análisis Sistémico: El 12% del Revenue de este mes provino de cierres en 'Despliegue Táctico'. Sugerencia: Escalar rutas en Zona Norte para maximizar ROI.",
                    action: { label: "Optimizar Rutas", onClick: () => navigate('/crm/tactical') }
                  },
                  { 
                    type: 'alert', 
                    message: "Alerta de Salud: 2 clientes muestran deserción en el Módulo de Academia. Impacto proyectado: -$4.2k MRR.",
                    action: { label: "Intervenir Academia", onClick: () => navigate('/crm/academia') }
                  }
                ]}
              />
           </div>
           
           <div className="lg:col-span-4 bg-[#0B0E14] border border-[#1F2937] rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global System Pulse</h4>
                    <p className="text-xl font-black text-white italic tracking-tighter uppercase mt-1">Operational Health</p>
                 </div>
                 <Activity className="w-5 h-5 text-cyan-500 animate-pulse" />
              </div>
              
              <div className="space-y-4">
                 {[
                   { label: 'Uso de API GenAI', value: '88%', color: 'bg-cyan-500' },
                   { label: 'Sincronización GPS', value: 'Active', color: 'bg-emerald-500' },
                   { label: 'Latencia de Nodo', value: '14ms', color: 'bg-[#A855F7]' }
                 ].map(stat => (
                   <div key={stat.label} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-500">
                         <span>{stat.label}</span>
                         <span className="text-white">{stat.value}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full ${stat.color} w-[80%]`} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* THE CORE: 4 QUADRANTS OPERATIONAL MAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* A. FLOW OF CAPITAL (FINANCE) */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/crm/commissions')}
            className="bg-[#151921] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl cursor-pointer"
          >
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-1 italic">I. Cash Flow Analytics</h3>
                <p className="text-4xl font-black text-white italic tracking-tighter">${(mrr > 0 ? mrr/1000 : 57.2).toFixed(1)}K <span className="text-xs text-emerald-500 font-bold tracking-widest uppercase ml-2">+12.4%</span></p>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500">
               <span>Operativo: $45,200</span>
               <span className="text-emerald-500">Neto: +$12,400</span>
            </div>
          </motion.div>

          {/* B. CLIENT HEALTH HEATMAP (CRM/PROJECTS) */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/crm/operations')}
            className="bg-[#151921] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl cursor-pointer"
          >
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-1 italic">II. Customer Nervous Health</h3>
                <p className="text-4xl font-black text-white italic tracking-tighter">{avgHealth}% <span className="text-xs text-amber-500 font-bold tracking-widest uppercase ml-2">-2% Risk</span></p>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-2 h-48 content-center">
              {[...Array(24)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-full w-full rounded-lg transition-all duration-500 cursor-pointer hover:scale-110 active:scale-95 border ${
                    i === 3 || i === 12 ? 'bg-[#EF4444] border-red-500/50' : 
                    i % 5 === 0 ? 'bg-[#F59E0B22] border-amber-500/30' : 'bg-[#10B98122] border-emerald-500/30'
                  }`}
                  title="Unit Status"
                />
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
               <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                   <span className="text-[8px] font-black uppercase tracking-widest">Normal</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
                   <span className="text-[8px] font-black uppercase tracking-widest">Error Node</span>
                 </div>
               </div>
               <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">2 Entities Delayed</span>
            </div>
          </motion.div>

          {/* C. TEAM PERFORMANCE RANKING (TALENTO) */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/crm/team')}
            className="bg-[#151921] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl cursor-pointer"
          >
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-1 italic">III. Performance Node Score</h3>
                <p className="text-4xl font-black text-white italic tracking-tighter">{teamROI}% <span className="text-xs text-emerald-500 font-bold tracking-widest uppercase ml-2">+15% Efficient</span></p>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4 h-48 overflow-y-auto pr-2 scrollbar-hide">
               {[
                 { name: 'Carlos Ruiz', roi: 210, impact: 'Peak' },
                 { name: 'Ana Silva', roi: 195, impact: 'High' },
                 { name: 'Marta García', roi: 160, impact: 'Target' },
                 { name: 'Roberto S.', roi: 155, impact: 'Target' },
               ].map((member, i) => (
                 <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="h-8 w-8 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">{member.name.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[10px] font-bold text-white uppercase">{member.name}</span>
                         <span className="text-[9px] font-black text-emerald-500">{member.roi}% ROI</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#10B981]" style={{ width: `${(member.roi/2.1)}%` }} />
                      </div>
                    </div>
                 </div>
               ))}
            </div>

            <button onClick={() => navigate('/crm/team')} className="mt-6 w-full text-center text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Audit Leaderboard →</button>
          </motion.div>

          {/* D. INTEL GROWTH HUB (ACADEMIA/SALES) */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/crm/academia')}
            className="bg-[#151921] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl cursor-pointer"
          >
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-1 italic">IV. Growth Systemic Expansion</h3>
                <p className="text-4xl font-black text-white italic tracking-tighter">+{academyGrowth}% <span className="text-xs text-blue-500 font-bold tracking-widest uppercase ml-2">Scale Active</span></p>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 h-48 content-center">
               <div className="p-5 bg-white/5 border border-white/5 rounded-3xl text-center">
                  <BookOpen className="w-6 h-6 text-purple-400 mx-auto mb-3" />
                  <p className="text-2xl font-black text-white tracking-widest">42</p>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Certificaciones Mes</p>
               </div>
               <div className="p-5 bg-white/5 border border-white/5 rounded-3xl text-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
                  <p className="text-2xl font-black text-white tracking-widest">12</p>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Nuevos Leads (High Q)</p>
               </div>
            </div>

             <div className="mt-6 flex justify-between gap-4">
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-purple-500 w-[75%]" />
               </div>
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[45%]" />
               </div>
             </div>
          </motion.div>

        </div>

        {/* RIGHT SIDEBAR: SYSTEMIC EVENT FEED */}
        <div className="xl:col-span-3 space-y-8">
          
          <div className="bg-[#151921] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <History className="w-4 h-4 text-[#F59E0B]" /> Intelligence Feed
            </h3>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
              <AnimatePresence initial={false}>
                {events.map((event) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="p-5 rounded-[2rem] bg-white/5 border border-white/5 relative overflow-hidden group hover:bg-white/[0.07] transition-colors"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      event.type === 'success' ? 'bg-emerald-500' : 
                      event.type === 'warning' ? 'bg-amber-500' : 'bg-[#EF4444]'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                        event.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                        event.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-[#EF4444]/10 border-red-500/20 text-red-500'
                      }`}>
                        {event.module}
                      </span>
                      <span className="text-[7px] font-black text-gray-600 font-mono italic">
                        {format(event.timestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                    
                    <p className="text-[10px] font-bold text-gray-200 leading-snug mb-3">
                      {event.message}
                    </p>
                    
                    <div className="flex items-center gap-2">
                       <Layers className="w-3 h-3 text-gray-700" />
                       <span className={`text-[9px] font-black uppercase tracking-widest ${
                         event.type === 'error' ? 'text-red-400' : 'text-[#F59E0B]'
                       }`}>
                         Impact: {event.impact}
                       </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
               <div className="bg-white/5 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center gap-4">
                     <Network className="w-8 h-8 text-white opacity-20" />
                     <p className="text-[9px] font-black uppercase tracking-widest text-center text-gray-500 leading-relaxed">
                        Red Neuronal Kaivincia <br/> <span className="text-white">Active Node: Austin-Cluster-01</span>
                     </p>
                  </div>
               </div>
            </div>
          </div>

        </div>

      </div>

      {/* GLOBAL FOOTER METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pb-10">
         {[
           { label: 'Cloud Load', val: '14.2%', color: 'text-emerald-500' },
           { label: 'User Synapses', val: '1,242/s', color: 'text-blue-500' },
           { label: 'Integrity', val: '100.00%', color: 'text-emerald-500' },
           { label: 'Latency', val: '12ms', color: 'text-blue-500' }
         ].map((stat, i) => (
           <div key={i} className="bg-white/5 border border-white/5 px-6 py-4 rounded-2xl flex justify-between items-center transition-all hover:bg-white/10">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{stat.label}</span>
              <span className={`text-[10px] font-black ${stat.color} font-mono tracking-tighter`}>{stat.val}</span>
           </div>
         ))}
      </div>

    </div>
  );
}
