import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Plus, Settings, PlayCircle, CheckCircle2, AlertCircle, 
  ArrowRight, Bell, MessageSquare, Mail, Activity, Webhook, Clock,
  MoreVertical, Edit2, Trash2, PhoneCall, Sparkles, Loader2, ShieldAlert,
  Terminal, Server, Cpu, Database, ChevronRight, X, Power, ToggleLeft, ToggleRight,
  Filter, Layers, ArrowUpRight, Code, Binary, ZapOff
} from 'lucide-react';
import { collection, onSnapshot, addDoc, doc, updateDoc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

// --- TYPES ---
interface Workflow {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: {
    type: 'INTERNAL' | 'EXTERNAL';
    target: string;
    payload: string;
  };
  isActive: boolean;
  stats: {
    success: number;
    failed: number;
  };
  createdAt: string;
}

interface TelemetryLog {
  id: string;
  timestamp: string;
  workflow: string;
  event: string;
  status: 'info' | 'success' | 'error';
}

const MASTER_AUTOMATIONS: Partial<Workflow>[] = [
  {
    name: 'Protector contra Abandono',
    trigger: 'CAÍDA_PUNTAJE_SALUD',
    condition: 'Puntaje_Salud < 40',
    action: { type: 'INTERNAL', target: 'Crear_Tarea_Urgente', payload: 'Etiquetar_Usuario_Critico' },
    isActive: true,
    stats: { success: 124, failed: 2 }
  },
  {
    name: 'Motor de Upsell',
    trigger: 'CURSO_COMPLETADO',
    condition: 'Tipo_Curso == "Gratis"',
    action: { type: 'INTERNAL', target: 'Enviar_Notificación_Push', payload: 'Invitar_Kaivincia_PRO' },
    isActive: true,
    stats: { success: 850, failed: 12 }
  },
  {
    name: 'Sincronización de Campo',
    trigger: 'CHECKIN_GPS',
    condition: 'Venta_Marcada == true',
    action: { type: 'EXTERNAL', target: 'Webhook_Post', payload: 'Generar_PDF_Factura' },
    isActive: false,
    stats: { success: 0, failed: 0 }
  }
];

export default function Automations() {
  const { userData } = useOutletContext<{ userData: any }>();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(1);
  const [newWorkflow, setNewWorkflow] = useState<Partial<Workflow>>({
    name: '',
    trigger: 'TICKET_ABIERTO',
    condition: '',
    action: { type: 'INTERNAL', target: 'Notificación Push', payload: '{}' },
    isActive: true,
    stats: { success: 0, failed: 0 }
  });

  const logEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';

  useEffect(() => {
    if (!isAdmin) return;

    // Listen to Workflows
    const unsubWorkflows = onSnapshot(collection(db, 'automation_workflows'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workflow));
      if (data.length === 0) {
        // Pre-populate if empty for demo/setup
        setWorkflows(MASTER_AUTOMATIONS.map((wa, i) => ({ ...wa, id: `master-${i}`, createdAt: new Date().toISOString() } as Workflow)));
      } else {
        setWorkflows(data);
      }
    });

    // Simulated Telemetry
    const simulatedEvents = [
      'Ejecutando Protector contra Abandono...',
      'Validando condición: Puntaje_Salud < 40',
      'Acción interna: ¡Tarea creada!',
      'Evento emitido: CURSO_COMPLETADO',
      'Webhook enviado a Slack',
      'Sincronización de Campo en espera de señal GPS...',
      'Disparador: NUEVO_CLIENTE detectado',
      'Sincronizando con ERP...',
    ];

    const logInterval = setInterval(() => {
      const randomEvent = simulatedEvents[Math.floor(Math.random() * simulatedEvents.length)];
      const newLog: TelemetryLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        workflow: 'SYSTEM_KERNEL',
        event: randomEvent,
        status: randomEvent.includes('!') ? 'success' : (randomEvent.includes('espera') ? 'info' : 'success')
      };
      setLogs(prev => [...prev.slice(-15), newLog]);
    }, 4000);

    return () => {
      unsubWorkflows();
      clearInterval(logInterval);
    };
  }, [isAdmin]);

  useEffect(() => {
     logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSaveWorkflow = async () => {
    try {
      await addDoc(collection(db, 'automation_workflows'), {
        ...newWorkflow,
        createdAt: new Date().toISOString()
      });
      setIsBuilderOpen(false);
      setBuilderStep(1);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'automation_workflows');
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    if (id.startsWith('master-')) {
       setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: !current } : w));
       return;
    }
    try {
      await updateDoc(doc(db, 'automation_workflows', id), { isActive: !current });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `automation_workflows/${id}`);
    }
  };

  if (!isAdmin) return <div className="p-8 text-center text-gray-500">Acceso denegado.</div>;

  return (
    <div className="h-full bg-[#0B0E14] text-slate-300 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="p-8 pb-4 shrink-0 flex justify-between items-end border-b border-[#1E293B]/30 bg-[#0B0E14]/80 backdrop-blur-md z-10">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Cpu className="w-8 h-8 text-[#00F0FF]" />
             Motor de Automatización
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00F0FF] rounded-full animate-pulse" />
            KAIVINCIA LOGIC ENGINE v4.2 // READY_FOR_DEPLOYMENT
          </p>
        </div>
        <button 
          onClick={() => setIsBuilderOpen(true)}
          className="bg-white text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#00F0FF] hover:text-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <Plus className="w-4 h-4" /> Crear Workflow
        </button>
      </div>

      {/* Assembly Line Grid */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((wf) => (
            <motion.div 
              key={wf.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#12161F] border border-[#1E293B] rounded-2xl p-6 relative overflow-hidden group hover:border-[#00F0FF]/50 transition-colors"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Binary className="w-20 h-20 text-white" />
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">{wf.name}</h3>
                  <p className="text-[10px] font-mono text-[#00F0FF] uppercase">{wf.trigger}</p>
                </div>
                <button 
                  onClick={() => toggleStatus(wf.id, wf.isActive)}
                  className={`p-2 rounded-lg transition-colors ${wf.isActive ? 'bg-[#00F0FF]/10 text-[#00F0FF]' : 'bg-slate-800 text-slate-600'}`}
                >
                  {wf.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 bg-slate-800 rounded-full flex flex-col items-center group-hover:bg-[#00F0FF]/20">
                     <div className={`w-1.5 h-4 bg-[#00F0FF] rounded-full transition-all ${wf.isActive ? 'translate-y-0' : 'translate-y-6 opacity-0'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Condición
                    </p>
                    <p className="text-xs text-slate-300 font-mono truncate">{wf.condition || 'Sin filtros definidos'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-[#1E293B]">
                    {wf.action.type === 'INTERNAL' ? <Server className="w-4 h-4 text-emerald-400" /> : <Webhook className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{wf.action.type}: {wf.action.target}</p>
                    <p className="text-[11px] text-white/70 font-mono">{wf.action.payload}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#1E293B] pt-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Éxitos</p>
                  <p className="text-xl font-black text-emerald-400 font-mono">{wf.stats.success}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Fallos</p>
                  <p className="text-xl font-black text-red-500 font-mono">{wf.stats.failed}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live Log: Telemetry Console */}
      <div className="h-48 shrink-0 bg-black border-t border-[#1E293B] p-4 flex flex-col font-mono text-[11px]">
        <div className="flex items-center justify-between mb-2">
           <span className="flex items-center gap-2 text-[#22D3EE] font-black uppercase tracking-widest bg-[#22D3EE]/10 px-3 py-1 rounded">
             <Terminal className="w-3 h-3" /> Kernel Telemetry Live
           </span>
           <span className="text-slate-600">CONEXIÓN_ESTABLE // 99.9% TIEMPO_ACTIVIDAD</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 group">
              <span className="text-slate-700 shrink-0">[{log.timestamp}]</span>
              <span className="text-[#00F0FF] shrink-0 uppercase tracking-tighter opacity-50">{log.workflow}:</span>
              <span className={`flex-1 ${log.status === 'success' ? 'text-emerald-400' : (log.status === 'error' ? 'text-red-500' : 'text-slate-300')}`}>
                {log.event}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Rule Builder Modal */}
      <AnimatePresence>
        {isBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0B0E14] border border-[#00F0FF]/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(181,154,69,0.15)]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#1E293B] flex justify-between items-center">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-[#00F0FF]/10 rounded-xl flex items-center justify-center text-[#00F0FF]">
                     <Layers className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter">Configurador Lógico</h3>
                     <p className="text-[10px] font-mono text-slate-500 uppercase">Paso {builderStep} de 3 // Instrucción de Construcción</p>
                   </div>
                 </div>
                 <button onClick={() => setIsBuilderOpen(false)} className="text-slate-500 hover:text-white">
                   <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Steps Progress */}
              <div className="flex px-6 pt-4 gap-2">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: builderStep >= s ? '100%' : '0%' }}
                      className="h-full bg-[#00F0FF]"
                    />
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="p-8 min-h-[300px]">
                {builderStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-[#00F0FF]" /> 1. TRIGGER (Disparador)
                    </h4>
                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Nombre del Flujo de Trabajo</label>
                      <input 
                        type="text"
                        value={newWorkflow.name}
                        onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                        className="w-full bg-[#12161F] border border-[#1E293B] rounded-xl p-4 text-white font-mono focus:border-[#00F0FF] transition-colors"
                        placeholder="Ej: Alerta de Abandono Global"
                      />
                      
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Evento del Sistema</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'CURSO_COMPLETADO', label: 'CURSO_COMPLETADO' },
                          { key: 'TICKET_ABIERTO', label: 'TICKET_ABIERTO' },
                          { key: 'CHECKIN_GPS', label: 'CHECKIN_GPS' },
                          { key: 'NUEVO_LEAD', label: 'NUEVO_LEAD' },
                          { key: 'FACTURA_PAGADA', label: 'FACTURA_PAGADA' },
                          { key: 'CAÍDA_PUNTAJE_SALUD', label: 'CAÍDA_PUNTAJE_SALUD' }
                        ].map((trigger) => (
                           <button 
                            key={trigger.key}
                            onClick={() => setNewWorkflow({ ...newWorkflow, trigger: trigger.key })}
                            className={`p-3 rounded-xl border text-[11px] font-black tracking-widest transition-all ${newWorkflow.trigger === trigger.key ? 'bg-[#00F0FF] text-black border-[#00F0FF]' : 'bg-[#12161F] text-slate-400 border-[#1E293B] hover:border-slate-700'}`}
                           >
                             {trigger.label}
                           </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {builderStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="w-5 h-5 text-[#00F0FF]" />
                      <h4 className="text-lg font-black text-white uppercase tracking-widest">2. CONDICIÓN (Filtro)</h4>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500 font-mono">Define la lógica booleana que debe cumplirse para disparar el evento.</p>
                      <textarea 
                        value={newWorkflow.condition}
                        onChange={(e) => setNewWorkflow({ ...newWorkflow, condition: e.target.value })}
                        className="w-full h-32 bg-[#12161F] border border-[#1E293B] rounded-xl p-4 text-white font-mono focus:border-[#00F0FF] transition-colors resize-none"
                        placeholder="Ej: VALOR_VENTA > 500 && CATEGORIA == 'PREMIUM'"
                      />
                      <div className="flex gap-2">
                         <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded">{"PUNTAJE_SALUD < 40"}</span>
                         <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded">{"TIPO_USUARIO == 'GOLD'"}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {builderStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-[#00F0FF]" />
                      <h4 className="text-lg font-black text-white uppercase tracking-widest">3. ACCIÓN (Ejecución)</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setNewWorkflow({ ...newWorkflow, action: { ...newWorkflow.action!, type: 'INTERNAL' } })}
                        className={`p-6 rounded-2xl border text-left transition-all ${newWorkflow.action?.type === 'INTERNAL' ? 'bg-[#00F0FF]/10 border-[#00F0FF]' : 'bg-[#12161F] border-[#1E293B]'}`}
                      >
                        <Server className={`w-8 h-8 mb-4 ${newWorkflow.action?.type === 'INTERNAL' ? 'text-[#00F0FF]' : 'text-slate-600'}`} />
                        <p className="font-black text-white uppercase tracking-tighter text-sm">INTERNA</p>
                        <p className="text-[10px] text-slate-500 mt-1">Tarea, Push, Registro</p>
                      </button>

                      <button 
                        onClick={() => setNewWorkflow({ ...newWorkflow, action: { ...newWorkflow.action!, type: 'EXTERNAL' } })}
                        className={`p-6 rounded-2xl border text-left transition-all ${newWorkflow.action?.type === 'EXTERNAL' ? 'bg-blue-500/10 border-blue-500' : 'bg-[#12161F] border-[#1E293B]'}`}
                      >
                        <Webhook className={`w-8 h-8 mb-4 ${newWorkflow.action?.type === 'EXTERNAL' ? 'text-blue-500' : 'text-slate-600'}`} />
                        <p className="font-black text-white uppercase tracking-tighter text-sm">EXTERNA</p>
                        <p className="text-[10px] text-slate-500 mt-1">Webhook, WhatsApp, Slack</p>
                      </button>
                    </div>

                    <div className="space-y-4 mt-6">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Objetivo / Carga (Payload)</label>
                      <input 
                        type="text"
                        value={newWorkflow.action?.target}
                        onChange={(e) => setNewWorkflow({ ...newWorkflow, action: { ...newWorkflow.action!, target: e.target.value } })}
                        className="w-full bg-[#12161F] border border-[#1E293B] rounded-xl p-4 text-white font-mono focus:border-[#00F0FF] mb-2"
                        placeholder="Nombre de la acción"
                      />
                      <textarea 
                        value={newWorkflow.action?.payload}
                        onChange={(e) => setNewWorkflow({ ...newWorkflow, action: { ...newWorkflow.action!, payload: e.target.value } })}
                        className="w-full h-24 bg-[#12161F] border border-[#1E293B] rounded-xl p-4 text-white font-mono focus:border-[#00F0FF] resize-none"
                        placeholder="JSON Payload {}"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#1E293B] bg-black/40 flex justify-between">
                <button 
                  disabled={builderStep === 1}
                  onClick={() => setBuilderStep(prev => prev - 1)}
                  className="px-6 py-3 rounded-xl border border-[#1E293B] text-xs font-black uppercase tracking-widest disabled:opacity-30"
                >
                  Atrás
                </button>
                {builderStep < 3 ? (
                  <button 
                    onClick={() => setBuilderStep(prev => prev + 1)}
                    className="bg-[#00F0FF] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2"
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveWorkflow}
                    className="bg-emerald-500 text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all"
                  >
                    Implementar Flujo de Trabajo
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
