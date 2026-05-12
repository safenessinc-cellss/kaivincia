import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LifeBuoy, Search, AlertCircle, Clock, 
  CheckCircle2, Plus, ArrowUpRight,
  User, Tag, Zap, Shield, FileText, Bot, Navigation, Activity, X
} from 'lucide-react';
import { format, differenceInHours } from 'date-fns';

type Status = 'open' | 'in-progress' | 'resolved';
type Priority = 'high' | 'medium' | 'low';

interface Ticket {
  id: string;
  subject: string;
  client: string;
  priority: Priority;
  status: Status;
  time: string;
  tags: string[];
  slaExpireAt: string;
}

const INITIAL_TICKETS: Ticket[] = [
  { id: 'TKT-001', subject: 'Falla crítica acceso al portal de cliente', client: 'Global Logistics', priority: 'high', status: 'open', time: new Date(Date.now() - 3600000).toISOString(), tags: ['Acceso', 'Portal'], slaExpireAt: new Date(Date.now() + 3600000).toISOString() }, // Expires in 1 hr
  { id: 'TKT-002', subject: 'Duda con facturación de servicios tácticos', client: 'TechSolutions Inc.', priority: 'medium', status: 'in-progress', time: new Date(Date.now() - 86400000).toISOString(), tags: ['Facturación', 'Táctico'], slaExpireAt: new Date(Date.now() + 86400000).toISOString() },
  { id: 'TKT-003', subject: 'Actualización de datos fiscales', client: 'Alpha Industries', priority: 'low', status: 'open', time: new Date(Date.now() - 172800000).toISOString(), tags: ['Admin'], slaExpireAt: new Date(Date.now() + 172800000).toISOString() },
];

export default function Helpdesk() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<Status>('open');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);

  // New Ticket State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<{ id: string; priority: Priority; category: string; slaHours: number } | null>(null);
  const [newTicketForm, setNewTicketForm] = useState({ client: '', subject: '', description: '', category: 'Técnico / Acceso' });

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.client.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = t.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleResolveConfirm = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
    setResolvingTicketId(null);
    alert(`KV-FOR-CX-01 (Encuesta de Satisfacción) enviada automáticamente a cliente para el ticket ${id}`);
    
    // Simulate ISO 9001 linkage
    setTimeout(() => {
      alert(`Resolución vinculada al Reporte de Incidencias KV-FOR-OPS-01 para trazabilidad ISO 9001.`);
    }, 1000);
  };

  const getPriorityColor = (priority: Priority) => {
    switch(priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch(status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <LifeBuoy className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleAiSummary = (e: React.MouseEvent, ticketName: string) => {
    e.stopPropagation();
    setAiSummary(null);
    setTimeout(() => {
      setAiSummary(`Resumen de la IA para ${ticketName}:\n1. Cliente reporta fallo intermitente.\n2. Verificado desde logs que el error es 503 Gateway Timeout.\n3. Se requiere escalado al equipo de infraestructura.`);
    }, 500);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.client || !newTicketForm.subject || !newTicketForm.description) return;
    
    setIsAnalyzing(true);

    setTimeout(() => {
      const descLower = newTicketForm.description.toLowerCase();
      const subjectLower = newTicketForm.subject.toLowerCase();
      const combinedText = descLower + " " + subjectLower;
      
      const highKeywords = ['bloqueo', 'caído', 'caido', 'no entra', 'urgente', 'crítico', 'critico'];
      let isHigh = highKeywords.some(kw => combinedText.includes(kw));
      
      let priority: Priority = isHigh ? 'high' : 'medium';
      if (newTicketForm.category === 'Otros' && !isHigh) priority = 'low';

      let slaHours = priority === 'high' ? 2 : priority === 'medium' ? 12 : 24;

      const newId = `TKT-${Math.floor(100 + Math.random() * 900)}`;

      if (newTicketForm.category === 'Facturación') {
         console.log(`[SYS-ROUTE] Ticket ${newId} notificado al Módulo Financiero.`);
      } else if (newTicketForm.category.includes('Acceso')) {
         console.log(`[SYS-ROUTE] Ticket ${newId} genera Log CISO (Escalado de Accesos).`);
      }

      const newTicket: Ticket = {
        id: newId,
        subject: newTicketForm.subject,
        client: newTicketForm.client,
        priority,
        status: 'open',
        time: new Date().toISOString(),
        tags: [newTicketForm.category.split(' ')[0]],
        slaExpireAt: new Date(Date.now() + slaHours * 3600000).toISOString()
      };

      setTickets(prev => [newTicket, ...prev]);
      setActiveFilter('open');
      setIsAnalyzing(false);
      setTriageResult({ id: newId, priority, category: newTicketForm.category, slaHours });
      
    }, 2000);
  };

  const closeNewModal = () => {
     setIsNewModalOpen(false);
     setTriageResult(null);
     setNewTicketForm({ client: '', subject: '', description: '', category: 'Técnico / Acceso' });
  };

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] bg-[#0B0E14] text-white p-8 space-y-8 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <LifeBuoy className="w-8 h-8 text-cyan-500" /> 
            Helpdesk <span className="text-gray-600">// CX SUPPORT</span>
          </h1>
          <p className="text-gray-400 font-mono text-xs mt-2 uppercase tracking-widest">
            Control de SLA Operativo y Resolución Táctica
          </p>
        </div>
        <button 
          onClick={() => setIsNewModalOpen(true)}
          className="bg-cyan-500 text-black px-6 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <Plus className="w-4 h-4" /> Nuevo Ticket
        </button>
      </div>

      <div className="flex-1 bg-[#161B22]/50 border border-white/5 rounded-3xl p-6 flex flex-col">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 shrink-0">
          <div className="flex bg-black/50 border border-white/5 rounded-xl p-1 gap-1">
            {(['open', 'in-progress', 'resolved'] as Status[]).map(status => (
              <button 
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === status ? 'bg-[#22D3EE]/20 border border-[#22D3EE]/30 text-[#22D3EE] shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'text-gray-500 hover:text-gray-300 transparent border border-transparent'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar ticket..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-white focus:border-cyan-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-20">
          <AnimatePresence>
            {filteredTickets.map((ticket, i) => {
              const hoursToSLA = differenceInHours(new Date(ticket.slaExpireAt), new Date());
              const isExpired = hoursToSLA <= 0;
              const isHigh = ticket.priority === 'high';
              const isLow = ticket.priority === 'low';
              
              return (
                <motion.div 
                  layout
                  key={ticket.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                  className={`group bg-[#11141A] rounded-2xl p-5 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between transition-all relative overflow-hidden
                    ${isExpired && ticket.status !== 'resolved' ? 'border-2 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-[pulse_2s_infinite]' : 'border border-white/5'}
                    ${isHigh && ticket.status !== 'resolved' ? 'shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-gradient-to-r from-red-500/5 to-transparent' : ''}
                    ${isLow ? 'opacity-80' : ''}
                  `}
                >
                  {isHigh && ticket.status !== 'resolved' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse" />
                  )}

                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(ticket.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black font-mono text-gray-400">{ticket.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        {ticket.status !== 'resolved' && (
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border font-mono ${isExpired ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-[#22D3EE]/30 text-[#22D3EE] bg-[#22D3EE]/10'}`}>
                              SLA: {isExpired ? 'EXPIRADO' : `${hoursToSLA}h restantes`}
                           </span>
                        )}
                        {isLow && <span className="w-2 h-2 rounded-full bg-amber-500/50" />}
                      </div>
                      <h3 className="text-base font-bold text-gray-200 uppercase tracking-tight">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <User className="w-3.5 h-3.5 text-[#22D3EE]" /> {ticket.client}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                          <Clock className="w-3.5 h-3.5" /> Opend: {format(new Date(ticket.time), 'MMM dd, HH:mm')}
                        </div>
                         {ticket.status === 'in-progress' && (
                           <span className="flex items-center gap-1.5 text-[10px] text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                             [LOCKED BY AGENT X]
                           </span>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row xl:flex-col gap-3 w-full xl:w-auto mt-4 xl:mt-0 pt-4 xl:pt-0 border-t border-white/5 xl:border-t-0 shrink-0">
                    <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest">
                       <button className="flex items-center gap-1 px-3 py-1.5 bg-[#1E293B]/50 hover:bg-[#1E293B] border border-white/5 rounded text-gray-300 transition-colors">
                          <Shield className="w-3 h-3 text-amber-400" /> Escalar a N2
                       </button>
                       <button className="flex items-center gap-1 px-3 py-1.5 bg-[#1E293B]/50 hover:bg-[#1E293B] border border-white/5 rounded text-gray-300 transition-colors">
                          <Navigation className="w-3 h-3 text-emerald-400" /> Vincular Factura
                       </button>
                       <button className="flex items-center gap-1 px-3 py-1.5 bg-[#1E293B]/50 hover:bg-[#1E293B] border border-white/5 rounded text-gray-300 transition-colors">
                          <FileText className="w-3 h-3 text-indigo-400" /> Ver Contrato
                       </button>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                       <button 
                         onClick={(e) => handleAiSummary(e, ticket.id)}
                         className="flex items-center gap-2 px-4 py-2 bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/30 text-[#A855F7] rounded text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                         <Bot className="w-3.5 h-3.5" /> IA Summary
                       </button>
                       {ticket.status !== 'resolved' && (
                          <button 
                            onClick={() => setResolvingTicketId(ticket.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] rounded text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Resolver Ticket
                          </button>
                       )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredTickets.length === 0 && (
            <div className="text-center py-12 text-gray-500 font-mono text-xs uppercase tracking-widest">
              No hay tickets en estado [{activeFilter}]
            </div>
          )}
        </div>
      </div>
      
      {/* Resolve Confirmation Modal */}
      <AnimatePresence>
         {resolvingTicketId && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-[#0B0E14]/90 backdrop-blur-md flex items-center justify-center p-4"
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                  className="bg-[#11141A] border border-[#1E293B] rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
               >
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#10B981]" />
                  <LifeBuoy className="w-10 h-10 text-[#10B981] mb-4" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-2">Confirmar Resolución</h3>
                  <p className="text-xs text-gray-400 font-mono mb-6">
                     Estás a punto de resolver el ticket {resolvingTicketId}. El sistema de integración enviará el formulario <span className="text-[#22D3EE]">KV-FOR-CX-01</span> de encuesta de satisfacción al cliente de inmediato y creará una entrada de registro ISO 9001. ¿Continuar con la operación?
                  </p>
                  <div className="flex gap-3">
                     <button onClick={() => setResolvingTicketId(null)} className="flex-1 py-3 bg-[#1E293B] text-gray-300 font-black uppercase tracking-widest text-[10px] rounded hover:bg-[#1E293B]/80 transition-colors">Abortar</button>
                     <button onClick={() => handleResolveConfirm(resolvingTicketId)} className="flex-1 py-3 bg-[#10B981] text-[#0B0E14] font-black uppercase tracking-widest text-[10px] rounded hover:bg-[#10B981]/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">Confirmar Acción</button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* IA Summary Modal */}
       <AnimatePresence>
         {aiSummary && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-[#0B0E14]/80 backdrop-blur flex items-center justify-center p-4"
               onClick={() => setAiSummary(null)}
            >
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#11141A] border border-[#A855F7]/30 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_30px_rgba(168,85,247,0.1)] relative"
               >
                  <div className="flex items-center gap-3 mb-4 border-b border-[#1E293B] pb-4">
                     <Bot className="w-6 h-6 text-[#A855F7]" />
                     <h3 className="text-sm font-black uppercase tracking-widest text-[#A855F7]">Brain // Neural Summary</h3>
                  </div>
                  <div className="text-sm font-mono text-gray-300 whitespace-pre-line leading-relaxed">
                     {aiSummary}
                  </div>
                  <button onClick={() => setAiSummary(null)} className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 rounded text-[10px] font-black text-gray-400 uppercase tracking-widest transition-colors">Cerrar Visor</button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* NEW TICKET MODAL - CYBER-FLOW */}
      <AnimatePresence>
        {isNewModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E14]/90 backdrop-blur-md p-4"
          >
            <motion.div 
               initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
               className="bg-[#0B0E14] border border-[#22D3EE]/50 shadow-[0_0_50px_rgba(34,211,238,0.15)] rounded-2xl p-8 max-w-2xl w-full relative overflow-hidden"
            >
               {/* Decorative Tech Corners */}
               <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#22D3EE] rounded-tl-2xl opacity-50 pointer-events-none" />
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#22D3EE] rounded-br-2xl opacity-50 pointer-events-none" />

               {!triageResult ? (
                 <>
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                           <Plus className="w-6 h-6 text-[#22D3EE]" /> Nuevo Ticket Operativo
                         </h3>
                         <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Ingesta y Triage por Neural Link</p>
                      </div>
                      <button onClick={closeNewModal} className="text-gray-500 hover:text-white transition-colors">
                         <X className="w-6 h-6" />
                      </button>
                   </div>

                   <form onSubmit={handleCreateTicket} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#22D3EE] mb-2">Cliente / Entidad</label>
                            <select 
                               required
                               value={newTicketForm.client}
                               onChange={e => setNewTicketForm({...newTicketForm, client: e.target.value})}
                               className="w-full bg-[#11141A] border border-[#1E293B] text-gray-200 text-sm font-mono rounded-lg px-4 py-3 outline-none focus:border-[#22D3EE] transition-colors"
                            >
                               <option value="" disabled>Seleccione Cliente...</option>
                               <option value="Global Logistics">Global Logistics</option>
                               <option value="TechSolutions Inc.">TechSolutions Inc.</option>
                               <option value="Alpha Industries">Alpha Industries</option>
                               <option value="BioTech Corp">BioTech Corp</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#22D3EE] mb-2">Categoría</label>
                            <select 
                               value={newTicketForm.category}
                               onChange={e => setNewTicketForm({...newTicketForm, category: e.target.value})}
                               className="w-full bg-[#11141A] border border-[#1E293B] text-gray-200 text-sm font-mono rounded-lg px-4 py-3 outline-none focus:border-[#22D3EE] transition-colors"
                            >
                               <option value="Técnico / Acceso">Técnico / Acceso</option>
                               <option value="Facturación">Facturación</option>
                               <option value="Operativo / Campo">Operativo / Campo</option>
                               <option value="Otros">Otros</option>
                            </select>
                         </div>
                      </div>

                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-[#22D3EE] mb-2">Asunto Principal</label>
                         <input 
                            required
                            type="text"
                            placeholder="Ej. Error de autenticación en portal web..."
                            value={newTicketForm.subject}
                            onChange={e => setNewTicketForm({...newTicketForm, subject: e.target.value})}
                            className="w-full bg-[#11141A] border border-[#1E293B] text-gray-200 text-sm font-bold placeholder:font-mono placeholder:text-gray-600 rounded-lg px-4 py-3 outline-none focus:border-[#22D3EE] transition-colors uppercase tracking-tight"
                         />
                      </div>

                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-[#22D3EE] mb-2 flex items-center justify-between">
                            <span>Descripción Detallada</span>
                            <span className="text-gray-600 font-mono text-[8.5px]">Se evaluará por IA para Priorización</span>
                         </label>
                         <textarea 
                            required
                            rows={4}
                            placeholder="Describa el incidente con la mayor cantidad de detalles posible..."
                            value={newTicketForm.description}
                            onChange={e => setNewTicketForm({...newTicketForm, description: e.target.value})}
                            className="w-full bg-[#11141A] border border-[#1E293B] text-gray-300 text-sm font-mono rounded-lg px-4 py-3 outline-none focus:border-[#22D3EE] transition-colors resize-none mb-1"
                         />
                      </div>

                      <div className="pt-2 relative">
                         {isAnalyzing ? (
                            <div className="w-full h-14 bg-[#11141A] rounded-xl overflow-hidden relative flex items-center justify-center border border-[#22D3EE]/30">
                               <div className="absolute inset-0 z-0">
                                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent animate-[scan_1.5s_linear_infinite]" />
                               </div>
                               <div className="absolute inset-0 bg-[#0B0E14]/50 backdrop-blur-[2px] z-10" />
                               <span className="relative z-20 text-[#22D3EE] text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                  <Activity className="w-4 h-4 animate-pulse" /> Neural Triage Active...
                               </span>
                            </div>
                         ) : (
                            <button 
                               type="submit" 
                               className="w-full py-4 bg-[#22D3EE] text-[#0B0E14] rounded-xl font-black uppercase italic tracking-[0.2em] shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                            >
                               <Bot className="w-5 h-5 group-hover:animate-bounce" /> Analizar y Crear Ticket
                            </button>
                         )}
                      </div>
                   </form>
                 </>
               ) : (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                   className="text-center py-8"
                 >
                    <div className="w-20 h-20 mx-auto bg-[#10B981]/10 border-2 border-[#10B981] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                       <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Ticket {triageResult.id} Generado</h3>
                    
                    <div className={`inline-flex flex-col items-center gap-1 px-6 py-4 rounded-xl border mt-4 mb-6 ${getPriorityColor(triageResult.priority)}`}>
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Prioridad asignada por IA</span>
                       <span className="text-xl font-black uppercase tracking-widest">{triageResult.priority}</span>
                    </div>

                    <p className="text-sm font-mono text-gray-400 max-w-md mx-auto mb-2">
                       El sistema de Neural Triage ha analizado el contexto e identificado la urgencia.
                    </p>
                    <p className="text-sm font-mono text-gray-400 max-w-md mx-auto">
                       Tiempo estimado de respuesta (SLA): <span className="text-[#22D3EE] font-bold">{triageResult.slaHours} horas</span>.
                    </p>

                    {triageResult.category === 'Facturación' && (
                       <div className="mt-6 text-amber-500 font-mono text-[10px] uppercase bg-amber-500/10 inline-block px-4 py-2 border border-amber-500/20 rounded">
                          [INTEGRATION] Notificado al Módulo Financiero
                       </div>
                    )}
                    {triageResult.category.includes('Acceso') && (
                       <div className="mt-6 text-red-500 font-mono text-[10px] uppercase bg-red-500/10 inline-block px-4 py-2 border border-red-500/20 rounded">
                          [SECURITY] Generado Log CISO - ALERTA ACCESOS
                       </div>
                    )}

                    <div className="mt-8 flex justify-center">
                       <button 
                          onClick={closeNewModal} 
                          className="px-10 py-3 bg-[#1E293B] hover:bg-[#334155] border border-white/10 text-white rounded font-black uppercase tracking-widest text-xs transition-colors"
                       >
                          Volver al Tablero [OPEN]
                       </button>
                    </div>
                 </motion.div>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

