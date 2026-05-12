import { useMemo, useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  GripVertical, DollarSign, Clock, AlertTriangle, Filter, 
  Trophy, Sparkles, BrainCircuit, Target, TrendingUp, 
  Users2, ArrowUpRight, Zap, CheckCircle2, X, ClipboardCheck,
  ShieldCheck, LayoutTemplate
} from 'lucide-react';
import { 
  FunnelChart, Funnel, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
  defaultDropAnimationSideEffects,
  DragOverEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

// --- CONFIG ---
const STAGES = ["LEAD_IN", "CONTACTADO", "CITA_AGENDADA", "PROPUESTA", "CIERRE", "POST_VENTA"];

const STAGE_CONFIG: Record<string, { color: string, glow: string }> = {
  "LEAD_IN": { color: "text-slate-400", glow: "border-slate-800" },
  "CONTACTADO": { color: "text-yellow-400", glow: "border-yellow-900/30" },
  "CITA_AGENDADA": { color: "text-blue-400", glow: "border-blue-900/30" },
  "PROPUESTA": { color: "text-purple-400", glow: "border-purple-900/30" },
  "CIERRE": { color: "text-[#22D3EE]", glow: "border-cyan-900/30" },
  "POST_VENTA": { color: "text-emerald-400", glow: "border-emerald-900/30" }
};


// --- COMPONENTS ---

function DraggableClientCard({ client, isOverlay = false, onContextMenu }: { client: any, isOverlay?: boolean, onContextMenu?: (e: React.MouseEvent, client: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: client.id,
    data: client
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const isHighQ = client.healthScore > 85;

  if (isDragging && !isOverlay) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-20 bg-slate-800/10 h-[140px] rounded-2xl border border-dashed border-slate-700" />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...listeners}
      {...attributes}
      onContextMenu={(e) => onContextMenu?.(e, client)}
      className={`bg-[#12161F]/80 backdrop-blur-md p-5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing group select-none relative overflow-hidden ${
        isOverlay 
          ? 'shadow-[0_20px_50px_rgba(34,211,238,0.2)] border-[#22D3EE] z-50 scale-105' 
          : isHighQ 
            ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-400' 
            : 'border-[#1E293B] hover:border-[#22D3EE]/30'
      }`}
    >
      {isHighQ && (
        <div className="absolute top-0 right-0 p-1">
           <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
           <h4 className="font-black text-white text-xs leading-tight uppercase tracking-widest truncate">{client.companyName}</h4>
           <div className="flex items-center gap-2 mt-1">
             <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                <Users2 className="w-3 h-3 text-slate-400" />
             </div>
             <span className="text-[9px] font-mono text-slate-500 uppercase">{client.setterName || 'Sin asignar'}</span>
           </div>
        </div>
        <div className={`p-1.5 rounded-lg border transition-all ${isOverlay ? 'bg-[#22D3EE] border-[#22D3EE] text-black' : 'bg-black/40 border-[#1E293B] text-slate-600 group-hover:text-[#22D3EE] group-hover:border-[#22D3EE]/30'}`}>
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <div className="font-mono text-xs font-black text-white flex items-center gap-1">
             <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
             {(Number(client.contractValue) || 0).toLocaleString()}
           </div>
           <div className={`px-2 py-0.5 rounded-md text-[9px] font-black font-mono border ${
              client.healthScore > 80 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
              client.healthScore > 50 ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
              'bg-red-400/10 text-red-400 border-red-400/20'
           }`}>
             IA: {client.healthScore}%
           </div>
        </div>
        
        {/* IA Forecast Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-500">
             <span>Pronóstico Cierre</span>
             <span className="text-[#22D3EE]">{client.closingProbability || '45'}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${client.closingProbability || 45}%` }}
               className="h-full bg-gradient-to-r from-blue-500 to-[#22D3EE]"
             />
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ stage, clients, isOverColumn, onContextMenu }: { stage: string, clients: any[], isOverColumn: boolean, onContextMenu?: (e: React.MouseEvent, client: any) => void }) {
  const { setNodeRef } = useDroppable({
    id: stage,
  });

  const totalAmount = clients.reduce((acc, c) => acc + (Number(c.contractValue) || 0), 0);
  const config = STAGE_CONFIG[stage] || { color: "text-slate-400", glow: "border-slate-800" };

  return (
    <div 
      ref={setNodeRef} 
      className={`flex-shrink-0 w-80 rounded-3xl flex flex-col border transition-all duration-300 bg-[#0B0E14] relative overflow-hidden ${
        isOverColumn 
          ? `${config.glow} shadow-[0_0_40px_rgba(34,211,238,0.1)] bg-[#12161F]` 
          : 'border-[#1E293B]'
      }`}
    >
      <div className="p-6 pb-4 border-b border-[#1E293B]/50 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2 ${config.color}`}>
            <Zap className={`w-3.5 h-3.5 ${isOverColumn ? 'animate-pulse' : ''}`} />
            {stage}
          </h3>
          <span className="bg-slate-800/50 border border-[#1E293B] text-white px-3 py-1 rounded-full text-[9px] font-mono font-bold">
            {clients.length}
          </span>
        </div>
        <div className="flex flex-col">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Capacidad Nodo</span>
           <span className="text-xl font-black text-white italic tracking-tighter font-mono">
             ${(totalAmount).toLocaleString()}
           </span>
        </div>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar min-h-[400px]">
        {clients.map(client => (
          <DraggableClientCard key={client.id} client={client} onContextMenu={onContextMenu} />
        ))}

        {clients.length === 0 && (
          <div className="h-full min-h-[150px] flex flex-col items-center justify-center border border-dashed border-[#1E293B] rounded-2xl bg-black/20 group">
             <div className="p-4 bg-slate-800/30 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-slate-700" />
             </div>
             <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest text-center px-6">
                Nodo Disponible
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function Pipeline() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClient, setActiveClient] = useState<any>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'funnel'>('kanban');
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; client: any } | null>(null);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, client: any) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, client });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const q = query(collection(db, 'clients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (data.length === 0) {
        // Mock data if empty
        data = [
          { id: 'mock-1', companyName: 'TechCorp v2', contractValue: 15000, healthScore: 92, status: 'Activo', pipelineStage: 'LEAD_IN', setterName: 'Carlos M.', closingProbability: 85 },
          { id: 'mock-2', companyName: 'Alpha Ind.', contractValue: 8000, healthScore: 45, status: 'Lead', pipelineStage: 'CITA_AGENDADA', setterName: 'Ana S.', closingProbability: 30 },
          { id: 'mock-3', companyName: 'Global Logistics', contractValue: 22000, healthScore: 78, status: 'Activo', pipelineStage: 'PROPUESTA', setterName: 'Marta T.', closingProbability: 60 }
        ];
      }
      setClients(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'clients'));

    return () => unsubscribe();
  }, []);

  const totalValue = clients.filter(c => c.pipelineStage !== 'Cerrado Perdido').reduce((acc, c) => acc + (Number(c.contractValue) || 0), 0);
  const isVolumeDropping = totalValue < 40000; // Simulated threshold for risk alert

  const funnelData = useMemo(() => {
    return STAGES.map((stage, idx) => {
      const stageClients = clients.filter(c => (c.pipelineStage || 'LEAD_IN') === stage);
      return {
        value: Math.max(stageClients.length, 1), // funnels need >0 to render decently, or actual length
        name: stage,
        fill: idx === 0 ? '#94A3B8' : idx === 1 ? '#FACC15' : idx === 2 ? '#60A5FA' : idx === 3 ? '#C084FC' : idx === 4 ? '#22D3EE' : '#34D399',
        realValue: stageClients.length,
        totalValue: stageClients.reduce((acc, c) => acc + (Number(c.contractValue) || 0), 0)
      };
    }).sort((a,b) => STAGES.indexOf(a.name) - STAGES.indexOf(b.name));
  }, [clients]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveClient(event.active.data.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverStage(event.over ? (event.over.id as string) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveClient(null);
    setOverStage(null);

    if (!over) return;

    const clientId = active.id as string;
    const newStage = over.id as string;
    const clientData = active.data.current;

    if (newStage === clientData?.pipelineStage) return;

    // Side Effect: CITA_AGENDADA -> CIERRE (Triggers Form)
    if (newStage === 'CIERRE' && clientData.pipelineStage === 'CITA_AGENDADA') {
        setPendingUpdate({ clientId, newStage, clientData });
        setIsFormOpen(true);
        return;
    }

    await executeUpdate(clientId, newStage, clientData);
  };

  const executeUpdate = async (clientId: string, newStage: string, clientData: any) => {
    try {
      if (newStage === 'POST_VENTA') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22D3EE', '#0891B2', '#0E7490'] });
      }

      // Update Client
      if (!clientId.startsWith('mock-')) {
        await updateDoc(doc(db, 'clients', clientId), {
          pipelineStage: newStage,
          updatedAt: serverTimestamp()
        });
      } else {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, pipelineStage: newStage } : c));
      }

      // Notify Nervous System (Neural Link)
      await addDoc(collection(db, 'system_events'), {
        type: 'PIPELINE_MOVE',
        message: `Oportunidad "${clientData.companyName}" movida a ${newStage}. Valor: $${clientData.contractValue}.`,
        severity: newStage === 'POST_VENTA' ? 'success' : 'info',
        timestamp: serverTimestamp()
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${clientId}`);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-[#0B0E14] text-white font-mono">
      <div className="flex flex-col items-center gap-4">
         <div className="w-12 h-12 border-b-2 border-[#22D3EE] rounded-full animate-spin" />
         <span className="text-[10px] uppercase tracking-widest text-[#22D3EE]">Sincronizando Pipeline...</span>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-[#0B0E14] text-slate-300 flex flex-col p-8 overflow-hidden">
      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/10 flex items-center justify-center border border-[#22D3EE]/30">
                  <TrendingUp className="w-6 h-6 text-[#22D3EE]" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Pipeline Comercial</h2>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Nodos de Energía y Flujo Operativo</p>
               </div>
            </div>
          </div>

          <div className="flex gap-8">
             {isVolumeDropping && (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex items-center gap-4 bg-red-500/10 border border-red-500/50 px-6 rounded-2xl text-red-500 animate-pulse"
               >
                  <AlertTriangle className="w-5 h-5 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest">ALERTA DE RIESGO DE LIQUIDEZ</span>
                     <span className="text-[8px] font-mono opacity-70">Volumen pipeline por debajo del 20% critico</span>
                  </div>
               </motion.div>
             )}
             <div className="bg-[#12161F] border border-[#1E293B] p-5 rounded-2xl flex flex-col min-w-[240px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Target className="w-16 h-16 text-white" />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Volumen Total Pipeline</span>
                <span className="text-3xl font-black text-white font-mono flex items-center gap-2">
                   <DollarSign className="w-6 h-6 text-[#22D3EE]" />
                   {totalValue.toLocaleString()}
                </span>
                <div className="mt-3 flex items-center gap-2">
                   <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#22D3EE] w-[75%]" />
                   </div>
                   <span className="text-[10px] text-emerald-400 font-mono">+12.4%</span>
                </div>
             </div>
             
             <div className="flex bg-[#12161F] border border-[#1E293B] rounded-2xl overflow-hidden p-1">
               <button onClick={() => setViewMode('kanban')} className={`px-4 py-2 text-xs font-bold uppercase transition-colors rounded-xl ${viewMode === 'kanban' ? 'bg-[#22D3EE] text-black' : 'text-slate-500 hover:text-white'}`}>
                 <div className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Kanban</div>
               </button>
               <button onClick={() => setViewMode('funnel')} className={`px-4 py-2 text-xs font-bold uppercase transition-colors rounded-xl ${viewMode === 'funnel' ? 'bg-[#22D3EE] text-black' : 'text-slate-500 hover:text-white'}`}>
                 <div className="flex items-center gap-2"><Filter className="w-4 h-4" /> Funnel</div>
               </button>
             </div>
          </div>
        </div>

        {/* View Toggle */}
        {viewMode === 'kanban' ? (
          <div className="flex-1 flex gap-8 overflow-x-auto pb-10 custom-scrollbar relative px-1">
            {STAGES.map(stage => (
              <DroppableColumn 
                key={stage} 
                stage={stage} 
                clients={clients.filter(c => (c.pipelineStage || 'LEAD_IN') === stage)}
                isOverColumn={overStage === stage}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 bg-[#12161F] border border-[#1E293B] rounded-3xl p-8 relative overflow-hidden flex flex-col items-center">
            <h3 className="text-xl font-black text-white italic uppercase mb-8">Embudo de Conversión (Leads a Contratos)</h3>
            <div className="w-full max-w-4xl h-[400px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <FunnelChart>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1E293B', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any, name: any, props: any) => [`${props.payload.realValue} Oportunidades ($${props.payload.totalValue.toLocaleString()})`, name]}
                  />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="right" fill="#fff" stroke="none" dataKey="name" fontSize={12} fontWeight="bold" />
                    <LabelList position="inside" fill="#000" stroke="none" dataKey="realValue" fontSize={14} fontWeight="bold" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: { opacity: '0.4' },
            },
          }),
        }}>
          {activeClient ? <DraggableClientCard client={activeClient} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Form KV-FOR-FIELD-01 Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-[#0B0E14] border border-[#22D3EE]/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.2)]"
             >
               <div className="p-8 border-b border-[#1E293B] flex justify-between items-center bg-gradient-to-r from-cyan-400/5 to-transparent">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                       <ClipboardCheck className="w-6 h-6 text-[#22D3EE]" /> KV-FOR-FIELD-01
                    </h3>
                    <p className="text-[10px] font-mono text-[#22D3EE] uppercase mt-1">Formulario de Validación Táctica & Cierre</p>
                  </div>
                  <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="p-8 space-y-6">
                  <div className="p-4 bg-slate-800/20 border border-[#1E293B] rounded-2xl">
                     <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Entidad Validada</p>
                     <p className="text-lg font-black text-white uppercase">{pendingUpdate?.clientData?.companyName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado de Visita</label>
                        <select className="w-full bg-[#12161F] border border-[#1E293B] rounded-xl p-3 text-sm text-white focus:border-[#22D3EE] outline-none transition-all">
                           <option>Satisfactorio - Listo para Cierre</option>
                           <option>Pendiente de Ajustes</option>
                           <option>Rechazado por el Cliente</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score de Compromiso</label>
                        <input type="range" className="w-full accent-[#22D3EE]" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas de Implementación</label>
                     <textarea className="w-full bg-[#12161F] border border-[#1E293B] rounded-xl p-4 text-sm text-white focus:border-[#22D3EE] outline-none h-32 resize-none" placeholder="Observaciones críticas para el despliegue..." />
                  </div>
               </div>

               <div className="p-8 border-t border-[#1E293B] bg-black/40 flex justify-end gap-4">
                  <button onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl border border-[#1E293B] text-xs font-black uppercase tracking-widest">Cancelar</button>
                  <button 
                    onClick={() => {
                      executeUpdate(pendingUpdate.clientId, pendingUpdate.newStage, pendingUpdate.clientData);
                      setIsFormOpen(false);
                    }}
                    className="bg-[#22D3EE] text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2"
                  >
                    Confirmar & Sincronizar <ShieldCheck className="w-4 h-4" />
                  </button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[200] bg-[#0B0E14] border border-[#1E293B] shadow-2xl rounded-xl py-2 min-w-[200px] overflow-hidden"
          style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-[#1E293B] flex flex-col">
            <span className="text-[10px] font-black tracking-widest uppercase text-[#22D3EE]">Acciones Cliente</span>
            <span className="text-sm font-bold text-white truncate max-w-[200px]">{contextMenu.client.companyName}</span>
          </div>
          <button 
            className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-[#12161F] flex items-center gap-2"
            onClick={async () => {
              // Mark as Closed Lost
              try {
                const { updateDoc, doc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'clients', contextMenu.client.id), {
                  pipelineStage: 'Cerrado Perdido',
                  status: 'Perdido'
                });
                setContextMenu(null);
              } catch(e) { console.error(e); }
            }}
          >
            <X className="w-4 h-4 text-red-500" /> Marcar Pérdida
          </button>
          <button 
            className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-[#12161F] flex items-center gap-2 border-t border-[#1E293B]"
            onClick={async () => {
              // Delete permanently
              try {
                const { deleteDoc, doc } = await import('firebase/firestore');
                await deleteDoc(doc(db, 'clients', contextMenu.client.id));
                setContextMenu(null);
              } catch(e) { console.error(e); }
            }}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Eliminar Registro
          </button>
        </div>
      )}
    </div>
  );
}

