import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, Zap, AlertCircle, MapPin, 
  DollarSign, Activity, CheckCircle2, Navigation, 
  Briefcase, Lock, User, Send, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Constants for Turs
const TUR_VERSION = "2.0";

const AREAS = [
  { id: 'ventas', name: 'Ventas (B2B)', color: 'text-[#A855F7]', bg: 'bg-[#A855F7]', border: 'border-[#A855F7]' },
  { id: 'tactico', name: 'Despliegue Táctico', color: 'text-[#22D3EE]', bg: 'bg-[#22D3EE]', border: 'border-[#22D3EE]' },
  { id: 'finanzas', name: 'Finanzas', color: 'text-[#10B981]', bg: 'bg-[#10B981]', border: 'border-[#10B981]' },
  { id: 'talento', name: 'Talento & RRHH', color: 'text-indigo-400', bg: 'bg-indigo-400', border: 'border-indigo-400' },
];

export default function MasterForms() {
  const [activeArea, setActiveArea] = useState('ventas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const activeColorTheme = AREAS.find(a => a.id === activeArea);

  const handleLogSubmit = async (formCode: string, payload: any) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'system_logs'), {
        formCode,
        version: TUR_VERSION,
        data: payload,
        timestamp: serverTimestamp(),
        type: 'TUR_RECORD',
        module: activeArea
      });
      setSuccessMsg(`Registro Inmutable Guardado: ${formCode}`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/5 bg-[#0B0E14] flex flex-col shrink-0 z-20">
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center gap-4">
          <div className="h-10 w-10 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center text-white">
            <FileText className="w-5 h-5" />
          </div>
          <div>
             <h2 className="text-sm font-black uppercase italic tracking-widest">Turs</h2>
             <p className="text-[10px] text-gray-500 font-mono mt-1">Turs Inventory</p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-hidden p-4 gap-2 md:space-y-4 scrollbar-hide">
          {AREAS.map(area => (
            <button 
              key={area.id}
              onClick={() => setActiveArea(area.id)}
              className={`flex items-center gap-3 text-[10px] md:text-xs font-black uppercase tracking-widest text-left p-3 md:p-4 rounded-2xl transition-all whitespace-nowrap md:whitespace-normal shrink-0 md:w-full ${
                activeArea === area.id ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${area.color} ${activeArea === area.id ? area.bg : 'bg-gray-700'}`} />
              {area.name}
              {activeArea === area.id && <ChevronRight className="w-4 h-4 ml-auto hidden md:block" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative p-4 md:p-8 lg:p-12">
        {/* Dynamic Background matching area color */}
        <div className="absolute inset-0 opacity-5 pointer-events-none transition-colors duration-700" 
             style={{ background: `radial-gradient(circle at 50% 0%, var(--tw-gradient-stops))` }}>
          <div className={`absolute inset-0 bg-gradient-to-b ${activeColorTheme?.color.replace('text-', 'from-') === 'from-indigo-400' ? 'from-indigo-500' : 
            activeColorTheme?.color.replace('text-', 'from-') === 'from-[#A855F7]' ? 'from-purple-500' :
            activeColorTheme?.color.replace('text-', 'from-') === 'from-[#22D3EE]' ? 'from-cyan-500' :
            'from-emerald-500'
          } to-transparent`} />
        </div>

        <AnimatePresence mode="wait">
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 right-4 z-50 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
           {activeArea === 'ventas' && <BANTForm onSubmit={handleLogSubmit} />}
           {activeArea === 'tactico' && <FieldEvidenceForm onSubmit={handleLogSubmit} />}
           {activeArea === 'finanzas' && <BillingProformaForm onSubmit={handleLogSubmit} />}
           {activeArea === 'talento' && <PerformanceForm onSubmit={handleLogSubmit} />}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 1. FORMULARIO BANT (VENTAS)
// -----------------------------------------------------------------------------
function BANTForm({ onSubmit }: { onSubmit: (code: string, data: any) => void }) {
  const [budget, setBudget] = useState<number | ''>('');
  const [authority, setAuthority] = useState(false);
  const MIN_BUDGET = 500;
  
  const isLocked = typeof budget === 'number' && budget > 0 && budget < MIN_BUDGET;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
       <FormHeader code="KV-FOR-VTA-01" title="Calificación BANT" color="text-[#A855F7]" border="border-[#A855F7]" progress={40} />
       
       <div className="bg-[#161B22] border border-white/5 rounded-b-[2.5rem] p-6 md:p-8 space-y-6">
          {/* AI Cerebro Callout */}
          <div className="bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-2xl p-4 flex gap-4 items-start">
             <Zap className="w-5 h-5 text-[#A855F7] shrink-0 mt-0.5 animate-pulse" />
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#A855F7]">Brain Logic // Auto-Qualify</h4>
                <p className="text-xs text-gray-400 mt-1">Si el presupuesto es menor a ${MIN_BUDGET}, el lead será derivado a Nutrición Automática.</p>
             </div>
          </div>

          <div className="space-y-4">
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Presupuesto Estimado (USD)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                   <input 
                     type="number" 
                     value={budget}
                     onChange={(e) => setBudget(Number(e.target.value))}
                     className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-mono focus:border-[#A855F7] outline-none transition-all placeholder:text-gray-700"
                     placeholder="Ej. 1500"
                   />
                </div>
             </div>
             
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">¿Es Decisor Principal?</label>
                <div className="flex gap-4">
                   <button onClick={() => setAuthority(true)} className={`flex-1 py-4 rounded-2xl border transition-all ${authority ? 'bg-[#A855F7]/20 border-[#A855F7] text-white' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}>SÍ</button>
                   <button onClick={() => setAuthority(false)} className={`flex-1 py-4 rounded-2xl border transition-all ${!authority ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}>NO</button>
                </div>
             </div>
          </div>

          {isLocked ? (
             <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Lock className="w-5 h-5 text-orange-500" />
                   <span className="text-xs font-bold text-orange-500">Mover a Nutrición (Low Budget)</span>
                </div>
                <button onClick={() => onSubmit("KV-FOR-VTA-01", { action: 'nurture', budget, authority })} className="bg-orange-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Ejecutar</button>
             </div>
          ) : (
             <button 
               onClick={() => onSubmit("KV-FOR-VTA-01", { action: 'schedule', budget, authority })}
               className="w-full bg-[#A855F7] text-white py-4 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[50px]"
             >
               <Send className="w-5 h-5" /> Agendar Cita
             </button>
          )}
       </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// 2. FORMULARIO EVIDENCIA (TÁCTICO)
// -----------------------------------------------------------------------------
function FieldEvidenceForm({ onSubmit }: { onSubmit: (code: string, data: any) => void }) {
  const [distance, setDistance] = useState(0);

  const simulateGPS = () => {
    // Randomize distance
    const dist = Math.floor(Math.random() * 200);
    setDistance(dist);
  }

  const isFailed = distance > 100;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
       <FormHeader code="KV-FOR-FIELD-01" title="Evidencia Táctica (GPS)" color="text-[#22D3EE]" border="border-[#22D3EE]" progress={75} />
       
       <div className="bg-[#161B22] border border-white/5 rounded-b-[2.5rem] p-6 md:p-8 space-y-6">
          <div className="bg-[#22D3EE]/10 border border-[#22D3EE]/20 rounded-2xl p-4 flex gap-4 items-start">
             <MapPin className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#22D3EE]">Node Validation</h4>
                <p className="text-xs text-gray-400 mt-1">El sistema verificará que te encuentres a menos de 100m del corporativo del cliente.</p>
             </div>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-3xl p-6 text-center space-y-4">
             <div className="h-16 w-16 bg-[#22D3EE]/10 rounded-full flex items-center justify-center mx-auto text-[#22D3EE]">
                <Activity className="w-8 h-8" />
             </div>
             
             {distance > 0 && (
               <div className={`p-4 rounded-xl border ${isFailed ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                 {isFailed ? (
                   <div className="flex items-center gap-3 justify-center text-red-500">
                     <AlertCircle className="w-5 h-5" />
                     <span className="text-xs font-bold truncate">Check-in fallido: Distancia {distance}m.</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-3 justify-center text-emerald-500">
                     <CheckCircle2 className="w-5 h-5" />
                     <span className="text-xs font-bold truncate">Check-in Válido: {distance}m de tolerancia.</span>
                   </div>
                 )}
               </div>
             )}

             <button onClick={simulateGPS} className="w-full py-4 border border-white/10 hover:border-[#22D3EE]/50 bg-white/5 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all min-h-[50px]">
                Validar Coordenadas GPS
             </button>
          </div>

          <button 
             disabled={isFailed || distance === 0}
             onClick={() => onSubmit("KV-FOR-FIELD-01", { action: 'evidence_logged', distance })}
             className="w-full bg-[#22D3EE] text-black py-4 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:scale-[1.02] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 min-h-[50px]"
          >
            Subir Evidencia Segura
          </button>
       </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// 3. FORMULARIO FACTURACIÓN (FINANZAS)
// -----------------------------------------------------------------------------
function BillingProformaForm({ onSubmit }: { onSubmit: (code: string, data: any) => void }) {
  // Simulated incoming data
  const baseAmount = 14500;
  const tax = baseAmount * 0.16;
  const total = baseAmount + tax;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
       <FormHeader code="KV-FOR-FIN-01" title="Factura Proforma Auto" color="text-[#10B981]" border="border-[#10B981]" progress={90} />
       
       <div className="bg-[#161B22] border border-white/5 rounded-b-[2.5rem] p-6 md:p-8 space-y-6">
          <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl p-4 flex gap-4 items-start">
             <Navigation className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">Data Extraction</h4>
                <p className="text-xs text-gray-400 mt-1">Monto importado automáticamente del Cierre en Terreno (ID: TACT-882).</p>
             </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 font-mono text-sm space-y-4">
             <div className="flex justify-between text-gray-400">
               <span>Subtotal B2B</span>
               <span>${baseAmount.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-400">
               <span>Impto. (Auto-16%)</span>
               <span>${tax.toFixed(2)}</span>
             </div>
             <div className="w-full h-px bg-white/10 my-2" />
             <div className="flex justify-between text-[#10B981] font-black text-lg">
               <span>TOTAL</span>
               <span>${total.toFixed(2)}</span>
             </div>
          </div>

          <button 
             onClick={() => onSubmit("KV-FOR-FIN-01", { action: 'invoice_generated', total })}
             className="w-full bg-[#10B981] text-black py-4 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.02] flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[50px]"
          >
            Emitir & Notificar Cliente
          </button>
       </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// 4. FORMULARIO DESEMPEÑO (TALENTO)
// -----------------------------------------------------------------------------
function PerformanceForm({ onSubmit }: { onSubmit: (code: string, data: any) => void }) {
  const systemShowRate = 68; // Fetched from Operaciones
  const [selfShowRate, setSelfShowRate] = useState<number | ''>('');

  const delta = typeof selfShowRate === 'number' ? selfShowRate - systemShowRate : 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
       <FormHeader code="KV-FOR-ADM-01" title="Autoevaluación vs Sistema" color="text-indigo-400" border="border-indigo-400" progress={100} />
       
       <div className="bg-[#161B22] border border-white/5 rounded-b-[2.5rem] p-6 md:p-8 space-y-6">
          <div className="bg-indigo-400/10 border border-indigo-400/20 rounded-2xl p-4 flex gap-4 items-start">
             <Briefcase className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">KPI Sync</h4>
                <p className="text-xs text-gray-400 mt-1">El sistema cruzará tu percepción con la realidad de Operaciones.</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-black/50 border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-black text-gray-500 mb-2 tracking-widest">Realidad Sistema</p>
                <div className="text-2xl font-black text-white italic">{systemShowRate}%</div>
                <p className="text-[8px] text-emerald-500 uppercase mt-1">Show Rate</p>
             </div>
             
             <div className="bg-black/50 border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-black text-gray-500 mb-2 tracking-widest">Tu Percepción</p>
                <input 
                  type="number"
                  value={selfShowRate}
                  onChange={e => setSelfShowRate(Number(e.target.value))}
                  className="w-full bg-transparent text-2xl font-black italic text-indigo-400 outline-none placeholder:text-gray-700"
                  placeholder="0%"
                />
                <p className="text-[8px] text-indigo-400 uppercase mt-1">Ingresa el %</p>
             </div>
          </div>

          {typeof selfShowRate === 'number' && (
             <div className={`p-4 rounded-xl border flex items-start gap-3 ${Math.abs(delta) > 10 ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                {Math.abs(delta) > 10 ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                <p className="text-xs font-bold">
                   {Math.abs(delta) > 10 
                     ? `Ojo: Hay una brecha del ${Math.abs(delta)}% entre tu percepción y métricas. Se programará 1:1.` 
                     : `¡Alineación perfecta! Conoces bien tus métricas.`}
                </p>
             </div>
          )}

          <button 
             onClick={() => onSubmit("KV-FOR-ADM-01", { action: 'eval_submitted', selfShowRate, systemShowRate })}
             className="w-full bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:scale-[1.02] flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[50px]"
          >
            Sellar Evaluación
          </button>
       </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// HELPER: FORM HEADER
// -----------------------------------------------------------------------------
function FormHeader({ code, title, color, border, progress }: { code: string, title: string, color: string, border: string, progress: number }) {
  return (
    <div className={`bg-[#0B0E14] border ${border} rounded-t-[2.5rem] p-6 md:p-8 flex items-center justify-between relative overflow-hidden group`}>
       <div className={`absolute -right-10 -top-10 w-40 h-40 bg-current opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity ${color}`} />
       
       <div>
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono bg-current/10 border border-current/20 mb-3 ${color}`}>
            {code} // v{TUR_VERSION}
          </span>
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
            {title}
          </h2>
       </div>

       {/* Progress radial or simple indicator */}
       <div className="hidden md:flex flex-col items-end">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Completitud</div>
          <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
             <div className={`h-full bg-current ${color}`} style={{ width: `${progress}%` }} />
          </div>
       </div>
    </div>
  );
}
