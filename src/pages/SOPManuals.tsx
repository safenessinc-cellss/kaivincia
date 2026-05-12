import React, { useState } from 'react';
import { 
  BookOpen, Target, CheckCircle2, AlertCircle, MapPin, 
  Smartphone, Calendar, ChevronRight, Zap, ShieldCheck,
  CheckSquare, ArrowRight, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEPARTMENTS = [
  { id: 'KV-PRO-VTA', name: 'Ventas / Setters', color: 'text-cyan-500' },
  { id: 'KV-PRO-FIELD', name: 'Despliegue Táctico', color: 'text-emerald-500' },
  { id: 'KV-PRO-ADM', name: 'Administración & RRHH', color: 'text-[#A855F7]' },
];

const DOCUMENTS = {
  'KV-PRO-VTA': [
    { 
      id: 'KV-PRO-VTA-01', 
      title: 'Prospección en LinkedIn',
      desc: 'Networking profesional y primer contacto en LinkedIn.',
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80'
    },
    { 
      id: 'KV-PRO-VTA-02', 
      title: 'Agenda de Visitas', 
      active: true,
      desc: 'Protocolo oficial para el agendamiento y confirmación de visitas de consultores B2B a instalaciones del cliente. Diseño a prueba de errores.',
      image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80'
    },
    { 
      id: 'KV-PRO-VTA-03', 
      title: 'Seguimiento Omnicanal',
      desc: 'Estrategia de comunicación y seguimiento a través de pipelines multicanal.',
      image: 'https://images.unsplash.com/photo-1611162618828-0bea69c36214?w=800&q=80'
    },
  ],
  'KV-PRO-FIELD': [
    {
      id: 'KV-PRO-FIELD-01',
      title: 'Despliegue Táctico',
      desc: 'Ejecución y estrategia para el despliegue técnico en instalaciones del cliente.',
      image: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=800&q=80'
    }
  ],
  'KV-PRO-ADM': [
    {
      id: 'KV-PRO-ADM-01',
      title: 'Administración & RRHH',
      desc: 'Procesos de recursos humanos, gestión interna y estructura organizacional.',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80'
    }
  ]
};

export default function SOPManuals() {
  const [activeDept, setActiveDept] = useState('KV-PRO-VTA');
  const [activeDoc, setActiveDoc] = useState('KV-PRO-VTA-02');

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex">
      {/* Sidebar Navigation */}
      <div className="w-80 border-r border-white/5 bg-[#0B0E14] flex flex-col hidden lg:flex shrink-0">
        <div className="p-8 border-b border-white/5">
          <div className="h-10 w-10 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center text-[#A855F7] mb-4">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-black uppercase italic tracking-widest">Manuales Kaivincia</h2>
          <p className="text-[10px] text-gray-500 font-mono mt-1">Manuales & SOPs Visuales</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {DEPARTMENTS.map(dept => (
            <div key={dept.id}>
              <button 
                onClick={() => setActiveDept(dept.id)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest w-full text-left p-2 rounded-lg transition-all ${
                  activeDept === dept.id ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeDept === dept.id ? dept.color.replace('text-', 'bg-') : 'bg-gray-700'}`} />
                {dept.name}
              </button>
              
              <AnimatePresence>
                {activeDept === dept.id && DOCUMENTS[dept.id as keyof typeof DOCUMENTS] && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 mt-2 space-y-1 overflow-hidden"
                  >
                    {DOCUMENTS[dept.id as keyof typeof DOCUMENTS].map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setActiveDoc(doc.id)}
                        className={`w-full text-left p-2 text-[10px] uppercase font-mono rounded-lg transition-all ${
                          activeDoc === doc.id ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' : 'text-gray-500 hover:bg-white/5'
                        }`}
                      >
                        {doc.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-12 relative z-10">
          
          {(() => {
            const currentDeptDocs = DOCUMENTS[activeDept as keyof typeof DOCUMENTS] || [];
            const doc = currentDeptDocs.find(d => d.id === activeDoc) || currentDeptDocs[0];
            
            if (!doc) return null;

            return (
              <>
                {/* Document Header */}
                <header className="border-b border-white/5 pb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[10px] font-black uppercase tracking-widest rounded-full font-mono">
                      {doc.id}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">v2.0.4</span>
                  </div>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter shadow-cyan-500/20 drop-shadow-lg">
                    {doc.title}
                  </h1>
                  <p className="text-gray-400 mt-4 max-w-2xl text-sm leading-relaxed">
                    {doc.desc}
                  </p>
                </header>

                {/* Hero Illustration */}
                <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden relative border border-white/10 group">
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent z-10" />
                   <img 
                     src={doc.image} 
                     alt={`3D Illustration for ${doc.title}`} 
                     className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
                   />
                   <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE] animate-pulse" />
                      <span className="text-[10px] font-mono text-[#22D3EE] uppercase tracking-[0.2em]">Visual Module Rendered</span>
                   </div>
                </div>

          {/* The 3-3-3 Rule Callout */}
          <section className="bg-[#161B22] border border-[#22D3EE]/30 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="w-24 h-24 text-[#22D3EE]" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#22D3EE] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> La Regla del 3-3-3
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div>
                <p className="text-2xl font-black text-white italic">03</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-1">Pasos Máximos</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white italic">03</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-1">Segundos p/ entender</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white italic">03</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-1">Checklists de Éxito</p>
              </div>
            </div>
          </section>

          {/* Logic Gates Flowchart */}
          <section className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              1. Flujograma de Decisión <div className="h-px flex-1 bg-white/5" />
            </h3>
            
            <div className="bg-black/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden">
               {/* Decorative Tech Map */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-20" />
               
               <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto space-y-6">
                 {/* Lead Box */}
                 <div className="bg-[#161B22] border border-[#A855F7]/30 px-6 py-4 rounded-xl text-center w-64 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A855F7] mb-1">Punto Mínimo</p>
                   <p className="font-bold text-sm">Lead Calificado &gt; 80%</p>
                 </div>
                 
                 <ArrowRight className="w-5 h-5 text-gray-500 rotate-90" />
                 
                 {/* Decision Diamond */}
                 <div className="w-32 h-32 rotate-45 border-2 border-cyan-500/50 flex items-center justify-center bg-cyan-500/10">
                    <div className="-rotate-45 text-center px-4">
                       <p className="text-[10px] font-bold text-cyan-200">¿Decisor principal confirmó hora?</p>
                    </div>
                 </div>

                 <div className="flex w-full justify-center gap-24 relative mt-[-20px]">
                    <div className="flex flex-col items-center">
                       <ArrowRight className="w-5 h-5 text-emerald-500 rotate-[135deg] mb-2" />
                       <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-lg text-emerald-500 text-xs font-bold w-32 text-center">
                          SÍ: Agendar en CRM
                       </div>
                    </div>
                    <div className="flex flex-col items-center">
                       <ArrowRight className="w-5 h-5 text-red-500 rotate-[45deg] mb-2" />
                       <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg text-red-500 text-xs font-bold w-32 text-center">
                          NO: Reprogramar Call
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          </section>

          {/* Visual Step-by-Step */}
          <section className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              2. Proceso en CRM (Visual) <div className="h-px flex-1 bg-white/5" />
            </h3>
            
            <div className="grid grid-cols-1 gap-8">
              {/* Image annotated mock */}
              <div className="bg-[#161B22] border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center">
                 <div className="w-full md:w-1/2 aspect-video bg-black rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-gray-700" />
                    {/* Neon Arrow overlay mock */}
                    <div className="absolute top-[30%] left-[20%] animate-bounce">
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_0_10px_#22D3EE] text-[#22D3EE] rotate-45">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                       </svg>
                       <span className="absolute top-10 left-4 text-[10px] font-black uppercase text-cyan-300 bg-black/80 px-2 py-1 rounded">Click 'Nueva Cita'</span>
                    </div>
                 </div>
                 <div className="w-full md:w-1/2 space-y-4">
                    <div className="flex items-start gap-3">
                       <div className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                       <div>
                         <h4 className="font-bold text-sm">Registro en Dashboard</h4>
                         <p className="text-xs text-gray-400 mt-1">Ve al módulo Tareas y Calendario. Haz clic en el botón superior derecho de 'Nueva Cita'.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                       <div>
                         <h4 className="font-bold text-sm">Vínculo de Target</h4>
                         <p className="text-xs text-gray-400 mt-1">Busca el código de cliente y valida que el estado de salud sea &gt; 50%.</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Confirmation Script & Checklist */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  3. Guion de Confirmación <div className="h-px flex-1 bg-white/5" />
                </h3>
                <div className="bg-[#161B22] p-6 rounded-3xl border border-white/5 relative">
                   <div className="absolute top-4 right-4 pointer-events-none">
                      <Smartphone className="w-24 h-24 text-white/5" />
                   </div>
                   <p className="text-sm italic text-gray-300 leading-relaxed relative z-10 font-serif">
                     "Excelente [Nombre]. Queda agendada nuestra sesión técnica presencial para el [Día] a las [Hora] en sus instalaciones. Nuestro Consultor Especialista le enviará una notificación GPS 15 minutos antes de su llegada. ¿Mantenemos como único requerimiento el acceso a la sala de juntas?"
                   </p>
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  4. Checklist ZERO FAIL <div className="h-px flex-1 bg-green-500/20" />
                </h3>
                <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 space-y-4">
                   {[
                     "Cliente validado en CRM (No Duplicado)",
                     "Ubicación GPS extraída de Google Maps insertada",
                     "Decisor Principal etiquetado en el evento"
                   ].map((item, idx) => (
                     <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5 relative flex items-center justify-center w-5 h-5 rounded border border-emerald-500/50 bg-black/50 group-hover:bg-emerald-500/20 transition-colors">
                           <CheckSquare className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item}</span>
                     </label>
                   ))}
                </div>
             </div>
          </section>

          <footer className="pt-12 text-center text-[10px] uppercase font-mono text-gray-600 tracking-[0.2em] opacity-50 pb-12">
             Propiedad de Kaivincia Corp // Distribución Restringida
          </footer>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
