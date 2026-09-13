import { useState } from 'react';
import { 
  TrendingUp, Users, Target, ShieldAlert, Sparkles, 
  ChevronRight, BrainCircuit, Wallet, BarChart3, 
  Globe, Zap, ArrowRight, MessageSquare, BookOpen,
  PieChart, Activity, Briefcase, CheckCircle2, History, X, Plus, Download, Upload, User, Building2, Mail, Phone, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JourneyStep {
  stage: string;
  module: string;
  action: string;
  metricImpact: string;
}

export default function StrategicReport() {
  const [activeTab, setActiveTab] = useState<'journey' | 'burnout' | 'scaling'>('journey');

  const dataJourney: JourneyStep[] = [
    { stage: 'Prospecto Ingresado', module: 'Ventas (Pipeline)', action: 'Lead scoring automático vía IA', metricImpact: '+1 Lead Calificado' },
    { stage: 'Contrato Firmado', module: 'Finanzas / Billing', action: 'Generación de link de cobro instantáneo', metricImpact: 'MRR Proyectado ↑' },
    { stage: 'Asignación de Equipo', module: 'Proyectos / Academia', action: 'Verificación de habilidades en Academia', metricImpact: 'Eficiencia Operativa ↑' },
    { stage: 'Ejecución Mensual', module: 'Operaciones', action: 'Cruces de ROI vs Costo de Nómina', metricImpact: 'Margen Operativo Bruto' },
    { stage: 'Detección Probabilidades', module: 'Predictivo', action: 'Análisis de sentimiento en Chat de cliente', metricImpact: 'Health Score (Vulnerabilidad)' },
    { stage: 'Caso de Éxito', module: 'Academia / Sales', action: 'Conversión de proyecto en curso de Academia', metricImpact: 'Crecimiento Orgánico' }
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] p-8 lg:p-12 font-sans text-gray-400">
      
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 text-[#00F0FF] mb-2">
            <BrainCircuit className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Strategic Intelligence v5</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Informe de Predicción Semanal</h1>
          <p className="text-sm text-gray-500 mt-2">Corte de datos: {new Date().toLocaleDateString()} • Análisis Global Kaivincia</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/10 transition-all">
             Distribuir a Ejecutivos
           </button>
           <button className="px-6 py-3 bg-[#00F0FF] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
             Exportar CISO Log
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'journey', label: 'Viaje del Dato', icon: <Target className="w-4 h-4" /> },
          { id: 'burnout', label: 'Salud Organizacional', icon: <Users className="w-4 h-4" /> },
          { id: 'scaling', label: 'Predicción de Escalamiento', icon: <TrendingUp className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
              activeTab === tab.id 
                ? 'bg-[#00F0FF] text-black border-[#00F0FF]' 
                : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'journey' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Etapa del Viaje</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Módulo Core</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Acción Sistémica</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Impacto en Métrica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dataJourney.map((step, idx) => (
                    <tr key={idx} className="group hover:bg-white/5 transition-all">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-white italic">{idx + 1}</div>
                            <span className="text-xs font-bold text-gray-200 uppercase italic tracking-tight">{step.stage}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest border border-[#00F0FF]/20 px-3 py-1 rounded-full">{step.module}</span>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-400 font-medium">{step.action}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-emerald-500 font-black italic text-xs">
                           <TrendingUp className="w-3 h-3" /> {step.metricImpact}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
               <div className="p-10 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[3rem]">
                  <h4 className="text-xl font-black text-white italic mb-4">Meta de Eficiencia Alcanzada</h4>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">El sistema ha detectado que la integración de Academia-Proyectos ha reducido el tiempo de Onboarding en un 24% respecto al mes anterior.</p>
                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                     <CheckCircle2 className="w-5 h-5" /> Validación CISO Exitosa
                  </div>
               </div>
               <div className="p-10 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-[3rem]">
                  <h4 className="text-xl font-black text-white italic mb-4">Expansión Sugerida</h4>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">Basado en el éxito del Pipeline actual, se recomienda habilitar 2 nuevas plazas para el Módulo de Ventas B2B.</p>
                  <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                     <Zap className="w-5 h-5" /> Auto-Scaling Ready
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'burnout' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
             {/* Health Metrics */}
             <div className="md:col-span-1 space-y-6">
                <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
                   <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Health Global del Equipo</p>
                   <p className="text-5xl font-black text-white italic tracking-tighter">88.4%</p>
                   <div className="mt-6 flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 8 ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                      ))}
                   </div>
                </div>
                <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
                   <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Riesgo de Rotación (IA)</p>
                   <div className="space-y-4">
                      {[
                        { label: 'Carga de Trabajo', val: 72, status: 'stable' },
                        { label: 'Satisfacción (Chat)', val: 91, status: 'high' },
                        { label: 'Relación ROI/Sueldo', val: 84, status: 'positive' }
                      ].map(m => (
                        <div key={m.label}>
                           <div className="flex justify-between text-[8px] font-black uppercase mb-1">
                              <span>{m.label}</span>
                              <span className="text-white">{m.val}%</span>
                           </div>
                           <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${m.val > 80 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${m.val}%` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <div className="flex items-center gap-2 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                        <ShieldAlert className="w-3 h-3" /> Alerta de Burnout
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">Se detectó fatiga semántica en el equipo de Desarrollo Senior. Riesgo de rotación estimado en 15% para el próximo trimestre.</p>
                   </div>
                </div>
             </div>

             <div className="md:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                   <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00F0FF] via-transparent to-transparent" />
                </div>
                <Activity className="w-16 h-16 text-[#00F0FF] mb-8 animate-pulse" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Monitor de Salud en Tiempo Real</h3>
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-8">
                  El sistema cruza el sentimiento de los chats internos con el cumplimiento de KPIs para asignar un "Score de Burnout" preventivo a cada colaborador.
                </p>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase border border-emerald-500/20">
                      Carga Balanceada
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[9px] font-black uppercase border border-blue-500/20">
                      ROI Positivo
                   </div>
                </div>
             </div>
          </motion.div>
        )}
         {activeTab === 'scaling' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="glass-panel p-10 rounded-[3rem] border-[#00F0FF]/20">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h4 className="text-[10px] font-black text-[#00F0FF] uppercase tracking-[0.3em] font-mono mb-2">Simulation Engine x1</h4>
                      <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">Prediction Outcome</h3>
                    </div>
                    <div className="p-4 bg-[#00F0FF]/10 rounded-2xl border border-[#00F0FF]/20">
                      <TrendingUp className="w-6 h-6 text-[#00F0FF]" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Break-even Point Analysis</p>
                      <div className="flex items-end justify-between">
                         <div>
                            <p className="text-3xl font-black text-white italic tracking-tighter">+$12.5K</p>
                            <p className="text-[9px] font-black text-emerald-500 uppercase mt-1">Margen Post-Contratación</p>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-black text-gray-400 italic">45 Días</p>
                            <p className="text-[9px] font-black text-gray-600 uppercase mt-1">Time to Profit</p>
                         </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 leading-relaxed bg-[#00F0FF]/5 p-6 rounded-2xl border border-[#00F0FF]/10">
                      <span className="text-white font-bold">Resumen de IA:</span> Basado en la tendencia de ventas del Q2 y la carga actual de proyectos, la contratación de 2 agentes adicionales no solo es viable, sino necesaria para evitar la pérdida de leads por saturación.
                    </p>
                  </div>
               </div>

               <div className="glass-panel p-10 rounded-[3rem]">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] font-mono mb-8">Efficiency Vectors</h4>
                  <div className="space-y-8">
                    {[
                      { l: 'Adquisición de Clientes', v: 85, c: 'blue' },
                      { l: 'Retención (Churn Risk)', v: 12, c: 'red' },
                      { l: 'Escalamiento Academia', v: 64, c: 'purple' },
                      { l: 'Optimización de Nómina', v: 92, c: 'emerald' }
                    ].map(metric => (
                      <div key={metric.l}>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">{metric.l}</span>
                           <span className={`text-[10px] font-mono font-black text-${metric.c}-400`}>{metric.v}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full bg-${metric.c}-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]`} style={{ width: `${metric.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             </div>

             <div className="p-10 glass-panel rounded-[3rem] text-center relative overflow-hidden bg-gradient-to-br from-[#00F0FF]/5 to-transparent">
                <Sparkles className="w-12 h-12 text-[#00F0FF] mx-auto mb-6 animate-pulse" />
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Plan de Escalamiento Q3/Q4</h3>
                <p className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed mb-10">
                  El sistema recomienda una expansión agresiva en el Módulo de Academia para alimentar el Pipeline de Talento. La simulación indica un crecimiento del 40% en facturación si se logra la certificación del 80% del equipo actual en las nuevas tecnologías mapeadas.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                   <button className="px-10 py-5 bg-[#00F0FF] text-black rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-[#00F0FF]/20">Aprobar Presupuesto</button>
                   <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/10">Correr Nueva Simulación</button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
