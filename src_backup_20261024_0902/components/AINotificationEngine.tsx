import { useState } from 'react';
import { 
  Sparkles, Mail, ShieldCheck, Zap, AlertTriangle, 
  CheckCircle2, Send, Wand2, Copy, FileCode, Eye,
  Layout, Users, Target, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateNotification, NotificationTrigger, GeneratedNotification } from '../services/aiNotificationService';

export default function AINotificationEngine() {
  const [activeTrigger, setActiveTrigger] = useState<NotificationTrigger>(NotificationTrigger.NUEVA_TAREA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedNotification | null>(null);
  
  // Form States
  const [moraData, setMoraData] = useState({ amount: '4,500', daysPastDue: '18', contractClause: '7.2 (Incumplimiento de Pago)' });
  const [tareaData, setTareaData] = useState({ taskName: 'Auditoría de Seguridad Q2', priority: 'Carmesí', deadline: '2026-05-15', clientName: 'TechCorp Solutions' });
  const [cotizacionData, setCotizacionData] = useState({ clientName: 'Innovate SA', value: '12,000', status: 'Rechazado', reason: 'Presupuesto ajustado por inflación' });

  const handleGenerate = async () => {
    setIsGenerating(true);
    let data = {};
    if (activeTrigger === NotificationTrigger.MORA_ALTA) data = moraData;
    if (activeTrigger === NotificationTrigger.NUEVA_TAREA) data = tareaData;
    if (activeTrigger === NotificationTrigger.STATUS_COTIZACION) data = cotizacionData;

    try {
      const res = await generateNotification({ trigger: activeTrigger, data });
      setResult(res);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white p-8 overflow-hidden font-sans">
      <div className="mb-8">
         <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-[#A855F7]" /> AI Notification Engine
         </h2>
         <p className="text-gray-500 font-mono text-[10px] mt-2 tracking-widest uppercase">CISO APPROVED // NEURAL-COMM-LINK v1.0</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Trigger Selection & Config */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2">
           <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A855F7] mb-6">Select Neural Trigger</h4>
              <div className="space-y-2">
                 {[
                   { id: NotificationTrigger.MORA_ALTA, label: 'Mora Alta (>15d)', icon: AlertTriangle, color: 'text-red-500' },
                   { id: NotificationTrigger.NUEVA_TAREA, label: 'Asignación Tarea', icon: Zap, color: 'text-amber-500' },
                   { id: NotificationTrigger.STATUS_COTIZACION, label: 'Status Cotización', icon: Target, color: 'text-emerald-500' }
                 ].map(t => (
                   <button 
                     key={t.id}
                     onClick={() => { setActiveTrigger(t.id); setResult(null); }}
                     className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                       activeTrigger === t.id ? 'bg-[#A855F7] border-[#A855F7] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                     }`}
                   >
                      <t.icon className={`w-5 h-5 ${activeTrigger === t.id ? 'text-white' : t.color}`} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t.label}</span>
                   </button>
                 ))}
              </div>
           </div>

           {/* Dynamic Context Form */}
           <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6">Execution Context</h4>
              <div className="space-y-4">
                 {activeTrigger === NotificationTrigger.MORA_ALTA && (
                   <>
                      <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-[#A855F7] block mb-1.5">Monto Adeudado</label>
                         <input value={moraData.amount} onChange={(e) => setMoraData({...moraData, amount: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
                      </div>
                      <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-[#A855F7] block mb-1.5">Días en Mora</label>
                         <input value={moraData.daysPastDue} onChange={(e) => setMoraData({...moraData, daysPastDue: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
                      </div>
                   </>
                 )}
                 {activeTrigger === NotificationTrigger.NUEVA_TAREA && (
                   <>
                      <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-amber-500 block mb-1.5">Nombre Tarea</label>
                         <input value={tareaData.taskName} onChange={(e) => setTareaData({...tareaData, taskName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
                      </div>
                      <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-amber-500 block mb-1.5">Prioridad</label>
                         <select value={tareaData.priority} onChange={(e) => setTareaData({...tareaData, priority: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white">
                            <option value="Carmesí">Carmesí (Urgente)</option>
                            <option value="Ámbar">Ámbar (Media)</option>
                            <option value="Esmeralda">Esmeralda (Baja)</option>
                         </select>
                      </div>
                   </>
                 )}
                 {activeTrigger === NotificationTrigger.STATUS_COTIZACION && (
                   <>
                      <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-emerald-500 block mb-1.5">Estado</label>
                         <select value={cotizacionData.status} onChange={(e) => setCotizacionData({...cotizacionData, status: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white">
                            <option value="Aprobado">Aprobado</option>
                            <option value="Rechazado">Rechazado</option>
                         </select>
                      </div>
                      <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-emerald-500 block mb-1.5">Motivo de Rechazo (si aplica)</label>
                         <textarea value={cotizacionData.reason} onChange={(e) => setCotizacionData({...cotizacionData, reason: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white min-h-[80px]" />
                      </div>
                   </>
                 )}

                 <button 
                   onClick={handleGenerate}
                   disabled={isGenerating}
                   className="w-full py-4 mt-4 bg-white/10 border border-[#A855F7]/30 text-white rounded-2xl font-black uppercase tracking-[0.2em] italic text-[10px] hover:bg-[#A855F7] transition-all flex items-center justify-center gap-3"
                 >
                    {isGenerating ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isGenerating ? 'Synthesizing...' : 'Generate Communication'}
                 </button>
              </div>
           </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 bg-[#0B0E14] rounded-[3rem] border border-white/5 shadow-3xl overflow-hidden flex flex-col relative">
           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#080808]/50">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-[#A855F7]">
                    <Eye className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-tight italic">Live Neural Preview</h4>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">REAL-TIME RENDER</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2.5 bg-white/5 text-gray-500 hover:text-white border border-white/10 rounded-xl transition-all">
                    <Copy className="w-4 h-4" />
                 </button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <AnimatePresence mode="wait">
                 {isGenerating ? (
                   <motion.div 
                     key="loading"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="h-full flex flex-col items-center justify-center gap-6"
                   >
                      <div className="relative">
                         <motion.div 
                           animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
                           transition={{ repeat: Infinity, duration: 3 }}
                           className="w-16 h-16 border-2 border-[#A855F7] border-t-transparent rounded-full" 
                         />
                         <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#A855F7]" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse">Compiling Neural Template...</p>
                   </motion.div>
                 ) : result ? (
                   <motion.div 
                     key="result"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="max-w-2xl mx-auto"
                   >
                      {/* Email Header */}
                      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Subject:</span>
                            <span className="text-xs font-black text-white uppercase italic tracking-tighter">{result.subject}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Status:</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              result.type === 'legal' ? 'bg-red-500/20 text-red-500' :
                              result.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                              'bg-blue-500/20 text-blue-500'
                            }`}>DEPLOY-READY</span>
                         </div>
                      </div>

                      {/* Rendered Body */}
                      <div className="bg-[#050505] border border-white/5 rounded-[2rem] p-10 shadow-2xl communication-body prose prose-invert max-w-none">
                         <div dangerouslySetInnerHTML={{ __html: result.html_body }} />
                      </div>

                      <div className="mt-8 flex justify-center gap-4">
                         <button className="px-8 py-3 bg-[#A855F7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
                            <Send className="w-4 h-4" /> Ship Notification
                         </button>
                         <button className="px-8 py-3 bg-white/5 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">
                            Send Test Draft
                         </button>
                      </div>
                   </motion.div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-20">
                      <Mail className="w-20 h-20 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">No Communication Generated</p>
                   </div>
                 )}
              </AnimatePresence>
           </div>
           
           {/* Terminal Output */}
           <div className="h-32 bg-black border-t border-white/10 p-4 font-mono text-[9px] uppercase tracking-widest text-[#A855F7]">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 bg-[#A855F7] rounded-full animate-pulse" />
                 KAIVINCIA SECURITY FEED: ACTIVE
              </div>
              <p className="text-gray-600 mb-1">{'>'} INITIALIZING NEURAL ENGINE...</p>
              <p className="text-gray-600 mb-1">{'>'} LOADING SYSTEM INSTRUCTION: Chief Communications Officer</p>
              {result && <p className="text-emerald-500">{'>'} SUCCESS: COMMUNICATION GENERATED VIA GEMINI-3-FLASH</p>}
              {isGenerating && <p className="text-amber-500 animate-pulse">{'>'} CALLING LLM-NODE: MAPPING TOKENS...</p>}
           </div>
        </div>
      </div>
    </div>
  );
}
