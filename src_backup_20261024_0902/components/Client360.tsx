import React from 'react';
import { 
  X, Activity, MapPin, GraduationCap, DollarSign, 
  MessageSquare, History, ShieldCheck, Zap, TrendingUp,
  ExternalLink, Target, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import IAAdvisor from './IAAdvisor';

interface Client360Props {
  client: any;
  onClose: () => void;
}

export default function Client360({ client, onClose }: Client360Props) {
  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 sm:p-8">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="w-full max-w-4xl h-full bg-[#0B0E14] border-l border-white/10 shadow-2xl rounded-[3rem] overflow-hidden flex flex-col"
      >
        {/* Header Section */}
        <div className="p-8 border-b border-white/5 flex justify-between items-start">
          <div className="flex gap-6 items-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#222] to-black border border-white/10 flex items-center justify-center text-4xl font-black text-white italic rotate-3 shadow-2xl">
              {client.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{client.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-[#A855F7] uppercase tracking-[0.2em]">{client.industry || 'B2B Enterprise'}</span>
                <div className="h-1 w-1 bg-gray-700 rounded-full" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                   <ShieldCheck className="w-3 h-3 text-emerald-500" /> CISO Verified Data
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Health Score', value: `${client.healthScore || 85}%`, icon: Activity, color: 'text-emerald-500' },
               { label: 'LTV Proyectado', value: `$${client.ltv || '12.5k'}`, icon: DollarSign, color: 'text-cyan-500' },
               { label: 'Visitas GPS', value: client.visitCount || 3, icon: MapPin, color: 'text-orange-500' },
               { label: 'Nivel Academia', value: client.academyLevel || 'Lvl 4', icon: GraduationCap, color: 'text-purple-500' }
             ].map(stat => (
               <div key={stat.label} className="bg-white/5 border border-white/5 p-4 rounded-3xl group hover:border-white/10 transition-all text-center">
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color} opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform`} />
                  <p className="text-xl font-black text-white italic tracking-tighter">{stat.value}</p>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             {/* Left Column: IA & Context */}
             <div className="lg:col-span-12">
                <IAAdvisor 
                  moduleName="Unified Client Insights"
                  insights={[
                    {
                      type: 'success',
                      message: `Análisis de Nodo: ${client.name} ha completado el 80% de su onboarding en Academia. Su Health Score ha subido 12 puntos este mes.`,
                      action: { label: "Ver Progreso Academia", onClick: () => {} }
                    },
                    {
                      type: 'info',
                      message: "Última visita en terreno (Zona Centro 14:32) mostró una satisfacción del entorno de 5/5. Potencial de Upsell detectado.",
                      action: { label: "Revisar Log GPS", onClick: () => {} }
                    }
                  ]}
                />
             </div>

             {/* Nervous System Branches */}
             <div className="lg:col-span-8 space-y-6">
                <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-6">
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <History className="w-4 h-4" /> Actividad Sistémica Reciente
                   </h3>
                   <div className="space-y-4">
                      {[
                        { time: 'Hace 2 horas', event: 'Factura Proforma #882 generada vía Despliegue Táctico', type: 'finance' },
                        { time: 'Ayer', event: 'Módulo de Academia: 3 usuarios nuevos añadidos', type: 'academy' },
                        { time: 'Hace 3 días', event: 'Reunión Presencial: GPS Validated en Corporativo', type: 'visit' }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 p-4 hover:bg-white/5 transition-all rounded-2xl border border-transparent hover:border-white/5">
                           <div className="h-10 w-10 bg-black/40 rounded-xl flex items-center justify-center shrink-0">
                              <Zap className="w-4 h-4 text-gray-500" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.time}</p>
                              <p className="text-sm text-gray-300 font-medium mt-1">{item.event}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Right Column: Key Links */}
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#A855F7]/10 rounded-[2.5rem] border border-[#A855F7]/20 p-6 text-center">
                   <Target className="w-10 h-10 text-[#A855F7] mx-auto mb-4" />
                   <h4 className="text-xs font-black text-white uppercase italic tracking-tight">Siguiente Paso Estratégico</h4>
                   <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">Migrar a este cliente al Plan Híbrido Elite para duplicar volumen de citas.</p>
                   <button className="w-full mt-4 py-3 bg-[#A855F7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#A855F7]/20 hover:scale-[1.02] transition-transform">Ejecutar Acción</button>
                </div>

                <div className="space-y-2">
                   {[
                     { label: 'Expediente Legal', icon: ShieldCheck },
                     { label: 'Contratos Digitales', icon: Briefcase },
                     { label: 'Bitácora de Chat', icon: MessageSquare }
                   ].map(link => (
                     <button key={link.label} className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-3">
                           <link.icon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                           <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest">{link.label}</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-700" />
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-black/20 text-center">
           <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">Neural Link Status: Sync Ready // Encryption AES-256</p>
        </div>
      </motion.div>
    </div>
  );
}
