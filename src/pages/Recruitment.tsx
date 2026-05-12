import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Video, ExternalLink, Calendar, CheckCircle, XCircle, Globe, Bot, 
  Edit2, Save, X, Plus, Trash2, Briefcase, UserPlus, Sparkles, UserCheck,
  Clock, Linkedin, ShieldAlert, Zap, History, MessageCircle, Phone, Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = ["Nuevo", "En Revisión", "Entrevista", "Prueba Técnica", "Oferta"];

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'portal'>('candidates');
  const navigate = useNavigate();
  
  // Candidates State
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Jobs State
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Tiempo Completo',
    description: '',
    isUrgent: false,
    status: 'active',
    candidatesCount: 0,
    daysActive: 0,
    acquisitionCost: 0
  });

  // Fetch Candidates
  useEffect(() => {
    const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length === 0) {
        // Seed with required example
        const example = {
          id: 'example-1',
          name: 'Carlos Ruiz',
          role: 'Analista de Operaciones',
          status: 'En Revisión',
          aiScore: 92,
          email: 'carlos.ruiz@example.com',
          phone: '+34 600 000 000',
          linkedin: 'https://linkedin.com/in/carlosruiz',
          portfolio: 'https://carlosruiz.dev',
          aiPros: ['Experiencia en automatización de procesos', 'Fuerte background en SQL y Python'],
          aiCons: ['Poca experiencia en liderazgo de equipos directos'],
          createdAt: new Date().toISOString()
        };
        setCandidates([example]);
      } else {
        setCandidates(data);
      }
      setLoadingCandidates(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'candidates'));

    return () => unsubscribe();
  }, []);

  // Fetch Jobs
  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingJobs(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'jobs'));

    return () => unsubscribe();
  }, []);

  // --- Candidates Logic ---
  const updateStage = async (candidateId: string, newStage: string) => {
    try {
      await updateDoc(doc(db, 'candidates', candidateId), { status: newStage });
      if (newStage === 'Academia Kaivincia') {
        alert('Candidato aprobado para la Academia. (Simulación: Correo de bienvenida enviado con accesos)');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `candidates/${candidateId}`);
    }
  };

  const handleSaveCandidateEdit = async () => {
    if (!editingCandidate) return;
    try {
      const { id, ...dataToUpdate } = editingCandidate;
      await updateDoc(doc(db, 'candidates', id), dataToUpdate);
      setEditingCandidate(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `candidates/${editingCandidate.id}`);
    }
  };

  const handleEscalateToClient = (candidate: any) => {
    // Navigate to Client Management with state to pre-fill modal
    navigate('/crm/client-management', { 
      state: { 
        prefill: {
          company: candidate.company || `${candidate.name} (Freelance)`,
          contact: candidate.name,
          email: candidate.email,
          phone: candidate.phone || '',
          paymentModel: 'Fijo',
          service: candidate.role || 'Consultoría'
        },
        openModal: true
      }
    });
  };

  // --- Jobs Logic ---
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await updateDoc(doc(db, 'jobs', editingJob.id), jobForm);
      } else {
        await addDoc(collection(db, 'jobs'), {
          ...jobForm,
          createdAt: new Date().toISOString()
        });
      }
      setShowJobModal(false);
      setEditingJob(null);
      setJobForm({ 
        title: '', 
        department: '', 
        location: '', 
        type: 'Tiempo Completo', 
        description: '', 
        isUrgent: false, 
        status: 'active',
        candidatesCount: 0,
        daysActive: 0,
        acquisitionCost: 0
      });
    } catch (error) {
      handleFirestoreError(error, editingJob ? OperationType.UPDATE : OperationType.CREATE, 'jobs');
    }
  };

  const openEditJob = (job: any) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      isUrgent: job.isUrgent || false,
      status: job.status,
      candidatesCount: job.candidatesCount || 0,
      daysActive: job.daysActive || 0,
      acquisitionCost: job.acquisitionCost || 0
    });
    setShowJobModal(true);
  };

  const toggleJobStatus = async (job: any) => {
    try {
      await updateDoc(doc(db, 'jobs', job.id), {
        status: job.status === 'active' ? 'closed' : 'active'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${job.id}`);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta vacante?')) {
      try {
        await deleteDoc(doc(db, 'jobs', jobId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `jobs/${jobId}`);
      }
    }
  };

  if (loadingCandidates || loadingJobs) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 flex flex-col h-full relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reclutamiento y Selección</h2>
          <p className="text-sm text-gray-500 mt-1">Gestión de talento y portal de vacantes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'candidates' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Candidatos (Pipeline)
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'jobs' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Vacantes (Job Board)
        </button>
        <button
          onClick={() => setActiveTab('portal')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'portal' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4" /> Ver Portal Público
        </button>
      </div>
      
      {/* Candidates Tab */}
      {activeTab === 'candidates' && (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {STAGES.map(stage => {
            const stageCandidates = candidates.filter(c => (c.status || 'Nuevo') === stage);
            
            return (
              <div key={stage} className="flex-shrink-0 w-80 flex flex-col h-full group/column">
                <div className="mb-4 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-300 group-hover/column:bg-[#00F0FF] transition-colors" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover/column:text-gray-900 transition-colors">
                      {stage}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-gray-300 bg-gray-100/50 px-2.5 py-0.5 rounded-full">
                    {stageCandidates.length}
                  </span>
                </div>
                
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-[400px] p-1">
                  {stageCandidates.map(candidate => (
                    <motion.div 
                      layoutId={candidate.id}
                      key={candidate.id} 
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setIsDrawerOpen(true);
                      }}
                      className="bg-white p-5 rounded-[2rem] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-[#00F0FF]/30 hover:shadow-xl transition-all cursor-pointer group/card relative overflow-hidden active:scale-95"
                    >
                      {/* Match Score Indicator Line */}
                      <div className={`absolute top-0 left-0 h-full w-1.5 ${
                        (candidate.aiScore || 0) >= 90 ? 'bg-green-500' :
                        (candidate.aiScore || 0) >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />

                      <div className="flex gap-4 items-start mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-900 border border-gray-100 shadow-inner group-hover/card:scale-110 transition-transform">
                          {candidate.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter truncate">{candidate.name}</h4>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{candidate.role || 'Sin Cargo'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex -space-x-2">
                           <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-400">IA</div>
                           <div className="w-6 h-6 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center">
                              <Zap className="w-3 h-3 text-[#00F0FF]" />
                           </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          (candidate.aiScore || 0) >= 90 ? 'bg-green-500 text-white' :
                          (candidate.aiScore || 0) >= 70 ? 'bg-blue-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {candidate.aiScore || 0}% MATCH
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {stageCandidates.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                       Vacío
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer: Ficha de Candidato Rápida */}
      <AnimatePresence>
        {isDrawerOpen && selectedCandidate && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[70] flex flex-col"
            >
               <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                     <div className="h-16 w-16 bg-gray-900 rounded-[2rem] flex items-center justify-center text-white text-2xl font-black italic shadow-2xl rotate-3">
                        {selectedCandidate.name.charAt(0)}
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">{selectedCandidate.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Candidate ID: {selectedCandidate.id.slice(0,8)}</span>
                        </div>
                     </div>
                  </div>
                  <button 
                     onClick={() => setIsDrawerOpen(false)}
                     className="h-12 w-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 transition-all hover:shadow-xl"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                  {/* IA Analysis Panel */}
                  <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-8">
                        <Sparkles className="w-10 h-10 text-[#00F0FF]/20 animate-pulse" />
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="h-6 w-1 bg-[#00F0FF] rounded-full" />
                           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#00F0FF]">Auditoría Predictiva IA</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-10">
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                                 <CheckCircle className="w-3 h-3" /> Puntos Fuertes
                              </p>
                              <div className="space-y-3">
                                 {(selectedCandidate.aiPros || ['Perfil sólido', 'Alta concurrencia técnica']).map((pro: string, i: number) => (
                                    <div key={i} className="flex gap-2 text-xs font-medium text-gray-300 leading-relaxed italic">
                                       <span className="text-[#00F0FF]">•</span> {pro}
                                    </div>
                                 ))}
                              </div>
                           </div>
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                                 <ShieldAlert className="w-3 h-3" /> Señales de Alerta
                              </p>
                              <div className="space-y-3">
                                 {(selectedCandidate.aiCons || ['Falta experiencia en sector específico', 'Brecha salarial alta']).map((con: string, i: number) => (
                                    <div key={i} className="flex gap-2 text-xs font-medium text-gray-300 leading-relaxed italic">
                                       <span className="text-red-500">•</span> {con}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Links & Channels */}
                  <div className="grid grid-cols-2 gap-6">
                     <a href={selectedCandidate.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-[#00F0FF]/30 transition-all hover:bg-white group">
                        <Linkedin className="w-6 h-6 text-[#00F0FF] group-hover:scale-110 transition-transform" />
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">LinkedIn Profile</p>
                           <p className="text-xs font-bold text-gray-900 truncate">Ver Perfil</p>
                        </div>
                     </a>
                     <a href={selectedCandidate.portfolio || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-blue-200 transition-all hover:bg-white group">
                        <Monitor className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Portafolio / Github</p>
                           <p className="text-xs font-bold text-gray-900 truncate">Ver Trabajo</p>
                        </div>
                     </a>
                  </div>

                  {/* Communication History (VoIP/Messaging Mock) */}
                  <div className="space-y-6">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-2 italic">
                           <History className="w-4 h-4 text-[#00F0FF]" /> Historial de Nodos
                        </h3>
                        <span className="text-[9px] font-black text-gray-400">Sincronizado Módulo VoIP</span>
                     </div>
                     <div className="space-y-4">
                        {[
                           { type: 'Call', text: 'Entrevista inicial exitosa', time: 'Hoy, 10:30', icon: Phone },
                           { type: 'WhatsApp', text: 'Envió portafolio actualizado', time: 'Ayer, 19:42', icon: MessageCircle },
                           { type: 'Stage', text: 'Movido a En Revisión por IA', time: 'hace 2 días', icon: Zap },
                        ].map((log, i) => (
                           <div key={i} className="flex gap-4 items-start p-5 bg-white border border-gray-100 rounded-[1.5rem] hover:shadow-lg transition-all">
                              <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                 <log.icon className="w-5 h-5" />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.type}</span>
                                    <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                    <span className="text-[10px] font-black text-gray-400 italic">{log.time}</span>
                                 </div>
                                 <p className="text-[11px] font-bold text-gray-900 mt-1">{log.text}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-4">
                  <button className="flex-1 h-16 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#00F0FF] transition-all shadow-xl active:scale-95 italic">
                     Agendar Entrevista
                  </button>
                  <button className="h-16 w-16 bg-white border border-gray-200 text-gray-400 rounded-3xl flex items-center justify-center hover:text-red-500 hover:border-red-100 transition-all hover:bg-red-50">
                     <Trash2 className="w-6 h-6" />
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                 { label: 'Candidatos Totales', val: candidates.length, color: 'blue' },
                 { label: 'Días Activa (Avg)', val: '12.4', color: 'amber' },
                 { label: 'Costo Adquisición (Avg)', val: '$45.2', color: 'green' }
              ].map(metric => (
                 <div key={metric.label} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${metric.color}-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">{metric.label}</p>
                    <p className={`text-4xl font-black text-gray-900 tracking-tighter italic`}>{metric.val}</p>
                 </div>
              ))}
           </div>

           <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
             <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div>
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Posiciones Estratégicas</h3>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Gestión de Vacantes y Embudos</p>
               </div>
               <button 
                 onClick={() => {
                   setEditingJob(null);
                   setJobForm({ title: '', department: '', location: '', type: 'Tiempo Completo', description: '', isUrgent: false, status: 'active', candidatesCount: 0, daysActive: 0, acquisitionCost: 0 });
                   setShowJobModal(true);
                 }}
                 className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00F0FF] transition-all shadow-xl flex items-center gap-3"
               >
                 <Plus className="w-5 h-5 text-[#00F0FF]" /> Abrir Nueva Plaza
               </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-white text-gray-400 font-black border-b border-gray-100 uppercase text-[9px] tracking-[0.3em]">
                   <tr>
                     <th className="px-10 py-6">Puesto / Nodo</th>
                     <th className="px-10 py-6">Departamento</th>
                     <th className="px-10 py-6">Metadatos (IA)</th>
                     <th className="px-10 py-6">Sincronización</th>
                     <th className="px-10 py-6 text-right">Dirección</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {jobs.map(job => (
                     <tr key={job.id} className="hover:bg-blue-50/30 transition-colors">
                       <td className="px-10 py-8">
                         <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-gray-400" />
                           </div>
                           <div>
                              <div className="font-black text-gray-900 uppercase tracking-tighter italic text-base">
                                 {job.title}
                                 {job.isUrgent && <span className="ml-3 bg-red-500 text-white text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">CRITICAL</span>}
                              </div>
                              <div className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-widest">{job.location} • {job.type}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-10 py-8 text-[10px] font-black text-gray-500 uppercase tracking-widest">{job.department}</td>
                       <td className="px-10 py-8">
                          <div className="flex gap-4">
                             <div className="text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Candidatos</p>
                                <p className="text-xs font-black text-gray-900 uppercase">{job.candidatesCount || 0}</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Días</p>
                                <p className="text-xs font-black text-gray-900 uppercase">{job.daysActive || 0}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                         <button 
                           onClick={() => toggleJobStatus(job)}
                           className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${job.status === 'active' ? 'bg-green-100 text-green-700 shadow-sm border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                         >
                           {job.status === 'active' ? 'ONLINE' : 'ARCHIVADO'}
                         </button>
                       </td>
                       <td className="px-10 py-8 text-right flex justify-end gap-3">
                         <button onClick={() => openEditJob(job)} className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl transition-all">
                           <Edit2 className="w-5 h-5" />
                         </button>
                         <button onClick={() => deleteJob(job.id)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl transition-all">
                           <Trash2 className="w-5 h-5" />
                         </button>
                       </td>
                     </tr>
                   ))}
                   {jobs.length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-10 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 text-gray-300">
                             <Zap className="w-12 h-12" />
                             <p className="text-[11px] font-black uppercase tracking-[0.4em]">Sin Vacantes Activas en el Nodo</p>
                          </div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {/* Portal Público Tab */}
      {activeTab === 'portal' && (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center gap-2">
            <div className="flex gap-1.5 ml-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="mx-auto bg-white px-4 py-1 rounded-md text-xs text-gray-500 border border-gray-200 shadow-sm flex items-center gap-2">
              <Globe className="w-3 h-3" /> kaivincia.com/careers
            </div>
            <a href="/careers" target="_blank" rel="noreferrer" className="mr-2 text-gray-500 hover:text-gray-700" title="Abrir en nueva pestaña">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <iframe 
            src="/careers" 
            className="w-full flex-1 border-none" 
            title="Portal Público de Vacantes"
          />
        </div>
      )}

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#00F0FF]/10 text-[#00F0FF] rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none">Perfil del Candidato</h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Edición y Auditoría</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCandidate(null)} 
                className="text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-full p-2 transition-colors hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              {/* Status Selector Visual */}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Estado del Pipeline</label>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                  {STAGES.map(stage => {
                    const isActive = editingCandidate.status === stage;
                    const getIcon = () => {
                      if (stage === 'Nuevo') return <Plus className="w-3 h-3" />;
                      if (stage === 'En Revisión') return <Clock className="w-3 h-3" />;
                      if (stage === 'Entrevista') return <Calendar className="w-3 h-3" />;
                      if (stage === 'Academia Kaivincia') return <Sparkles className="w-3 h-3" />;
                      if (stage === 'Contratado') return <UserCheck className="w-3 h-3" />;
                      return null;
                    };
                    return (
                      <button
                        key={stage}
                        onClick={() => setEditingCandidate({...editingCandidate, status: stage})}
                        className={`group relative px-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all border flex flex-col items-center gap-2 ${
                          isActive 
                            ? 'bg-gray-900 border-gray-900 text-white shadow-xl scale-105 z-10' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#00F0FF] text-black' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-900'}`}>
                          {getIcon()}
                        </div>
                        {stage}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={editingCandidate.name || ''} 
                    onChange={e => setEditingCandidate({...editingCandidate, name: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Puesto / Rol</label>
                  <input 
                    type="text" 
                    value={editingCandidate.role || ''} 
                    onChange={e => setEditingCandidate({...editingCandidate, role: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Teléfono / WhatsApp</label>
                  <input 
                    type="text" 
                    value={editingCandidate.phone || editingCandidate.whatsapp || ''} 
                    onChange={e => setEditingCandidate({...editingCandidate, phone: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={editingCandidate.email || ''} 
                    onChange={e => setEditingCandidate({...editingCandidate, email: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* IA SECTION - Clearly Distinguishable */}
              <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group border border-[#00F0FF]/20">
                {/* AI Glow Effect */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00F0FF]/20 rounded-full blur-[80px]" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#00F0FF] text-black rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(181,154,69,0.3)]">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tighter">Motor de Análisis IA</h4>
                      <p className="text-[10px] text-[#00F0FF] font-black uppercase tracking-widest">Auditoría Predictiva Activa</p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-[#00F0FF] animate-pulse" />
                </div>

                <div className="grid grid-cols-1 gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                      <span>Score de Concurrencia</span>
                      <span className="text-[#00F0FF]">{editingCandidate.aiScore || 0}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={editingCandidate.aiScore || 0}
                      onChange={e => setEditingCandidate({...editingCandidate, aiScore: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Resumen Ejecutivo</label>
                    <textarea 
                      value={editingCandidate.aiSummary || ''}
                      onChange={e => setEditingCandidate({...editingCandidate, aiSummary: e.target.value})}
                      rows={2}
                      className="w-full bg-gray-800 border-gray-700 text-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#00F0FF] outline-none border resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Justificación del Perfil</label>
                    <textarea 
                      value={editingCandidate.aiJustification || ''}
                      onChange={e => setEditingCandidate({...editingCandidate, aiJustification: e.target.value})}
                      rows={3}
                      className="w-full bg-gray-800 border-gray-700 text-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#00F0FF] outline-none border resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end items-center gap-4 bg-gray-50/50">
              <button 
                onClick={() => setEditingCandidate(null)}
                className="px-6 py-3 text-gray-500 font-bold text-sm hover:text-gray-900 transition-colors"
              >
                Descartar cambios
              </button>
              <button 
                onClick={handleSaveCandidateEdit}
                className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg hover:shadow-gray-200 flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-[#00F0FF]" /> Aplicar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{editingJob ? 'Editar Vacante' : 'Nueva Vacante'}</h3>
              <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveJob} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título del Puesto</label>
                    <input 
                      required
                      type="text" 
                      value={jobForm.title} 
                      onChange={e => setJobForm({...jobForm, title: e.target.value})}
                      className="w-full border-gray-300 rounded-lg p-2 border focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                      placeholder="Ej: Desarrollador Frontend Senior"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <input 
                      required
                      type="text" 
                      value={jobForm.department} 
                      onChange={e => setJobForm({...jobForm, department: e.target.value})}
                      className="w-full border-gray-300 rounded-lg p-2 border focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                      placeholder="Ej: Tecnología, Ventas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input 
                      required
                      type="text" 
                      value={jobForm.location} 
                      onChange={e => setJobForm({...jobForm, location: e.target.value})}
                      className="w-full border-gray-300 rounded-lg p-2 border focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                      placeholder="Ej: Remoto, Ciudad de México"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                    <select 
                      required
                      value={jobForm.type} 
                      onChange={e => setJobForm({...jobForm, type: e.target.value})}
                      className="w-full border-gray-300 rounded-lg p-2 border focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white"
                    >
                      <option value="Tiempo Completo">Tiempo Completo</option>
                      <option value="Medio Tiempo">Medio Tiempo</option>
                      <option value="Por Proyecto">Por Proyecto / Freelance</option>
                    </select>
                  </div>
                  <div className="flex items-center mt-6">
                    <input 
                      type="checkbox" 
                      id="isUrgent"
                      checked={jobForm.isUrgent} 
                      onChange={e => setJobForm({...jobForm, isUrgent: e.target.checked})}
                      className="h-4 w-4 text-[#00F0FF] focus:ring-[#00F0FF] border-gray-300 rounded"
                    />
                    <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-900">
                      Marcar como Urgente
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la Vacante</label>
                    <textarea 
                      required
                      value={jobForm.description} 
                      onChange={e => setJobForm({...jobForm, description: e.target.value})}
                      rows={5}
                      className="w-full border-gray-300 rounded-lg p-2 border focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                      placeholder="Describe las responsabilidades, requisitos y beneficios..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-[#00F0FF] text-black rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar Vacante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
