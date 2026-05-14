import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Video, ExternalLink, Calendar, CheckCircle, XCircle, Globe, Bot, 
  Edit2, Save, X, Plus, Trash2, Briefcase, UserPlus, Sparkles, UserCheck,
  Clock, Linkedin, ShieldAlert, Zap, History, MessageCircle, Phone, Monitor,
  FileText, Handshake, BookOpen, MapPin, Coffee, FileSearch, Download, Upload,
  Users, Lock, Info, AlertTriangle, Fingerprint, MousePointer2, ArrowLeft, FileCheck,
  MonitorPlay
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = ["Nuevo", "En Revisión", "Entrevista", "Academia Kaivincia", "Contratado"];

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'portal' | 'docs' | 'employee-portal'>('candidates');
  const [isUploading, setIsUploading] = useState(false);
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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length === 0) {
        // Seed with suggested jobs
        const initialJobs = [
          {
            title: 'Appointment Setter Senior',
            department: 'Ventas Nivel 1',
            location: 'Remoto / Global',
            type: 'Tiempo Completo',
            description: 'Buscamos setters con experiencia en High Ticket Sales para calificar leads y agendar llamadas para nuestro equipo de closers.',
            isUrgent: true,
            status: 'active',
            candidatesCount: 5,
            daysActive: 3,
            acquisitionCost: 15.5,
            createdAt: new Date().toISOString()
          },
          {
            title: 'Growth Specialist AI',
            department: 'Growth & Ops',
            location: 'Remoto',
            type: 'Tiempo Completo',
            description: 'Responsable de optimizar los flujos de automatización y el entrenamiento de modelos de IA locales.',
            isUrgent: false,
            status: 'active',
            candidatesCount: 12,
            daysActive: 8,
            acquisitionCost: 45.2,
            createdAt: new Date().toISOString()
          },
          {
            title: 'Project Manager Operativo',
            department: 'Gestión',
            location: 'Híbrido / Madrid',
            type: 'Tiempo Completo',
            description: 'Liderar la implementación de sistemas Kaivincia en nuevos clientes corporativos.',
            isUrgent: false,
            status: 'active',
            candidatesCount: 3,
            daysActive: 1,
            acquisitionCost: 0,
            createdAt: new Date().toISOString()
          }
        ];
        initialJobs.forEach(async job => {
          try {
            await addDoc(collection(db, 'jobs'), job);
          } catch (e) {
            console.error("Error seeding job", e);
          }
        });
      } else {
        setJobs(data);
      }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    // Simulate AI extraction
    setTimeout(async () => {
      const newCandidate = {
        name: 'Candidato Extraído IA',
        role: 'Por Definir',
        status: 'Nuevo',
        aiScore: Math.floor(Math.random() * 30) + 70,
        email: 'ia.extract@nucleus.test',
        phone: '+00 000 000 000',
        createdAt: new Date().toISOString(),
        aiSummary: 'Perfil extraído automáticamente mediante el motor Nucleus Core.'
      };
      
      try {
        await addDoc(collection(db, 'candidates'), newCandidate);
      } catch (error) {
        console.error("Error seeding extracted candidate", error);
      }
      
      setIsUploading(false);
      alert('Analizando CV con IA: Extracción completada. El perfil ha sido catalogado en el Pipeline.');
    }, 2500);
  };

  if (loadingCandidates || loadingJobs) return <div>Cargando...</div>;

  return (
    <div className="space-y-4 flex flex-col h-full relative">
      <div className="flex justify-between items-center bg-white/50 p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-[#00F0FF] transition-all group shadow-xl active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Reclutamiento y Selección</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Gestión de Talento Gibbor N-Core</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`py-3 px-6 text-sm font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'candidates' ? 'border-[#00F0FF] text-[#00F0FF] bg-cyan-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pipeline
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`py-3 px-6 text-sm font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'jobs' ? 'border-[#00F0FF] text-[#00F0FF] bg-cyan-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Vacantes
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`py-3 px-6 text-sm font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'docs' ? 'border-[#00F0FF] text-[#00F0FF] bg-cyan-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Gestión Documental
        </button>
        <button
          onClick={() => setActiveTab('employee-portal')}
          className={`py-3 px-6 text-sm font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'employee-portal' ? 'border-[#00F0FF] text-[#00F0FF] bg-cyan-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> Portal de Equipo
        </button>
        <button
          onClick={() => setActiveTab('portal')}
          className={`py-3 px-6 text-sm font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'portal' ? 'border-[#00F0FF] text-[#00F0FF] bg-cyan-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4" /> Portal Público
        </button>
      </div>
      
      {/* Gestión Documental Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Document Creation Center */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Nucleus Document Studio</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Generación Legal y Contractual</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 bg-gray-50 text-gray-400 hover:text-[#00F0FF] rounded-2xl transition-all">
                      <Save className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-gray-50 text-gray-400 hover:text-[#00F0FF] rounded-2xl transition-all">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-start p-6 bg-gray-900 text-white rounded-3xl group hover:scale-[1.02] transition-all shadow-xl">
                      <Handshake className="w-6 h-6 text-[#00F0FF] mb-4 group-hover:rotate-12 transition-transform" />
                      <span className="text-xs font-black uppercase tracking-widest">Contrato de Trabajo</span>
                      <span className="text-[9px] text-gray-400 mt-1 uppercase">Términos y Condiciones G-Center</span>
                    </button>
                    <button className="flex flex-col items-start p-6 bg-white border border-gray-100 rounded-3xl group hover:scale-[1.02] transition-all hover:shadow-xl">
                      <Lock className="w-6 h-6 text-indigo-500 mb-4 group-hover:rotate-12 transition-transform" />
                      <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Acuerdo NDA</span>
                      <span className="text-[9px] text-gray-400 mt-1 uppercase">Confidencialidad Nucleus</span>
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-2 w-2 rounded-full bg-[#00F0FF] animate-pulse" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Editor de Clausulado Smart</span>
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 w-3/4 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-4 w-full bg-gray-100 rounded-full" />
                      <div className="h-4 w-5/6 bg-gray-100 rounded-full" />
                      <div className="h-32 w-full bg-white border border-gray-100 rounded-2xl flex items-center justify-center">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Cargando plantilla legal Gibbor Center...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg flex items-center gap-6 group hover:border-[#00F0FF]/30 transition-all">
                    <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                       <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">Kit de Bienvenida</h4>
                       <p className="text-[10px] text-gray-400 font-medium mt-1 leading-tight">Envío automático de manuales de cultura y marca Gibbor.</p>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
                    <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                       <Download className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">Exportar Batch</h4>
                       <p className="text-[10px] text-gray-400 font-medium mt-1 leading-tight">Descarga masiva de documentos para auditoría externa.</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* ID & Vault Section */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0B0E14] rounded-[3rem] p-10 border border-gray-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8">
                  <Fingerprint className="w-12 h-12 text-[#00F0FF]/10 group-hover:text-[#00F0FF]/20 transition-colors" />
                </div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-8">Bóveda de Identidad</h3>
                
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-800 rounded-3xl p-10 text-center hover:border-[#00F0FF]/30 transition-all cursor-pointer bg-black/20 group/upload">
                    <Upload className="w-10 h-10 text-gray-600 mx-auto mb-4 group-hover/upload:text-[#00F0FF] group-hover/upload:scale-110 transition-all" />
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Arrastra Documento</p>
                    <p className="text-[8px] text-gray-700 mt-2">DNI, Pasaporte o Licencia</p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Documentos Recientes</span>
                    {[
                      { name: 'ID_CARLOS_RUIZ.pdf', size: '1.2MB', type: 'DNI' },
                      { name: 'CONTRACT_SILVA_signed.pdf', size: '2.4MB', type: 'Contrato' }
                    ].map((file, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-white uppercase truncate">{file.name}</p>
                          <p className="text-[8px] text-gray-500 mt-1 uppercase">{file.type} • {file.size}</p>
                        </div>
                        <Download className="w-3 h-3 text-gray-600 hover:text-white cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl">
                 <div className="flex items-center gap-3 mb-6">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Protocolo de Privacidad</h4>
                 </div>
                 <p className="text-[11px] text-gray-500 leading-relaxed italic">
                   Gibbor Center asegura que todos los documentos de identidad son encriptados en reposo y cumplen con la normativa GDPR. El acceso está restringido a SuperAdmin.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal de Equipo Tab */}
      {activeTab === 'employee-portal' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Top Stats: Attendance & Real-time Status */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'En Línea Ahora', val: '42/50', icon: Zap, color: 'text-green-500', bg: 'bg-green-50' },
                { label: 'En Break', val: '5', icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Fuera de Línea', val: '3', icon: UserPlus, color: 'text-gray-400', bg: 'bg-gray-50' },
                { label: 'Solicitudes Pend.', val: '2', icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' }
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex items-center gap-4">
                   <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-xl font-black text-gray-900 italic">{stat.val}</p>
                   </div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Attendance & Control Center */}
              <div className="lg:col-span-8 space-y-6">
                 <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8">
                       <MapPin className="w-8 h-8 text-gray-100 animate-bounce" />
                    </div>
                    <div className="flex justify-between items-end mb-10">
                       <div>
                          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Monitor de Disponibilidad</h3>
                          <p className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest mt-1 italic">Sincronización de Red Gibbor Core</p>
                       </div>
                       <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
                          <Clock className="w-4 h-4 text-[#00F0FF]" />
                          <span className="text-xs font-mono font-black italic">14:41:22 UTC-5</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          {[
                            { name: 'Ana S.', role: 'Setter', status: 'active', ip: '192.168.1.45' },
                            { name: 'Carlos R.', role: 'Aprendiz', status: 'break', ip: '192.168.1.12' },
                            { name: 'Elena M.', role: 'Gestor', status: 'active', ip: '187.12.4.99' },
                            { name: 'Luis P.', role: 'Setter', status: 'offline', ip: 'Unknown' },
                          ].map((emp, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group overflow-hidden">
                               <div className="flex justify-between items-start mb-4">
                                  <div className="h-8 w-8 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-[10px] font-black italic">
                                     {emp.name.split(' ')[0][0]}
                                  </div>
                                  <div className={`h-2 w-2 rounded-full ${emp.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_#10B981]' : emp.status === 'break' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                               </div>
                               <h4 className="text-[11px] font-black text-gray-900 uppercase italic truncate">{emp.name}</h4>
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{emp.role}</p>
                               <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MousePointer2 className="w-3 h-3 text-[#00F0FF]" />
                                  <span className="text-[8px] font-mono text-gray-400">{emp.ip}</span>
                               </div>
                            </div>
                          ))}
                       </div>
                       
                       <button className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#00F0FF] transition-all shadow-xl active:scale-95 italic">
                          Acceder al Panel de Control de Jornada (Fichaje)
                       </button>
                    </div>
                 </div>

                 {/* Leave Requests & Absence Protocol */}
                 <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Solicitudes de Ausencia</h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Flujo de Aprobación Centralizado</p>
                       </div>
                       <button className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-[#00F0FF] transition-all shadow-lg active:scale-90">
                          <Plus className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="space-y-4">
                       {[
                         { user: 'Marcos Gil', type: 'Día Libre', date: '15 May - 16 May', status: 'pending', reason: 'Asuntos familiares' },
                         { user: 'Sofia Lopez', type: 'Cambio Turno', date: 'Hoy (Tarde)', status: 'approved', reason: 'Cita médica dental' }
                       ].map((req, i) => (
                         <div key={i} className="flex items-center gap-6 p-6 bg-gray-50/50 border border-gray-100 rounded-3xl group hover:border-blue-200 transition-all">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                               <Calendar className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                               <div className="flex items-center gap-3">
                                  <h4 className="text-sm font-black text-gray-900 uppercase italic tracking-tighter">{req.user}</h4>
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${req.status === 'approved' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                                     {req.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                                  </span>
                               </div>
                               <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{req.type} • {req.date}</p>
                               <p className="text-xs text-gray-500 mt-2 italic">"{req.reason}"</p>
                            </div>
                            <div className="flex gap-2">
                               <button className="p-3 bg-white border border-gray-100 text-emerald-500 rounded-xl hover:shadow-lg transition-all"><CheckCircle className="w-4 h-4" /></button>
                               <button className="p-3 bg-white border border-gray-100 text-red-500 rounded-xl hover:shadow-lg transition-all"><XCircle className="w-4 h-4" /></button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Sidebar: Role Config & Training */}
              <div className="lg:col-span-4 space-y-6">
                 {/* Roles Basados en Experiencia */}
                 <div className="bg-[#0B0E14] rounded-[3rem] p-10 border border-gray-800 shadow-2xl text-white">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                       <ShieldAlert className="w-5 h-5 text-[#00F0FF]" /> Config de Roles
                    </h3>
                    <div className="space-y-4">
                       {[
                         { id: 'sales', label: 'Setters', color: 'text-[#00F0FF]', border: 'group-hover:border-[#00F0FF]/30', desc: 'Acceso ilimitado a CRM y Pipeline.' },
                         { id: 'alumno', label: 'Aprendices', color: 'text-amber-500', border: 'group-hover:border-amber-500/30', desc: 'Limitado a Academia y Simuladores.' },
                         { id: 'gestor', label: 'Gestores', color: 'text-emerald-500', border: 'group-hover:border-emerald-500/30', desc: 'Monitor de disponibilidad y operativa total.' }
                       ].map(roleDef => (
                         <div key={roleDef.id} className={`p-4 border border-white/5 bg-white/5 rounded-2xl group transition-all ${roleDef.border}`}>
                            <div className="flex justify-between items-start mb-2">
                               <h4 className={`text-xs font-black ${roleDef.color} uppercase tracking-widest`}>{roleDef.label}</h4>
                               <button 
                                 onClick={() => navigate('/crm/superadmin')}
                                 className="text-[8px] font-black text-gray-500 hover:text-white uppercase tracking-widest border border-white/10 px-2 py-1 rounded-lg transition-colors"
                               >
                                 Asignar
                               </button>
                            </div>
                            <p className="text-[9px] text-gray-400 leading-relaxed italic">{roleDef.desc}</p>
                         </div>
                       ))}
                    </div>
                    <button 
                      onClick={() => navigate('/crm/superadmin')}
                      className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#00F0FF] hover:text-black transition-all"
                    >
                       Gestionar Permisos Maestros
                    </button>
                 </div>

                 {/* Welcome Kit Library */}
                 <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-2xl">
                    <h3 className="text-sm font-black text-gray-900 uppercase italic tracking-widest mb-6 flex items-center gap-3">
                       <BookOpen className="w-5 h-5 text-indigo-500" /> Kit de Bienvenida
                    </h3>
                    <div className="space-y-4">
                       {[
                         { title: 'Manual de Cultura Gibbor', type: 'PDF • 4.5MB' },
                         { title: 'Guía de Herramientas AI', type: 'EPUB • 1.2MB' },
                         { title: 'Identidad Visual v4', type: 'ZIP • 42MB' }
                       ].map((doc, i) => (
                         <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 cursor-pointer group">
                           <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-gray-400 group-hover:text-indigo-500">
                             <FileText className="w-4 h-4" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-gray-900 uppercase truncate">{doc.title}</p>
                              <p className="text-[8px] text-gray-400 uppercase">{doc.type}</p>
                           </div>
                           <Download className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Protocolo de Faltas */}
                 <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                       <AlertTriangle className="w-5 h-5" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Protocolo S.O.P. Ausencias</h4>
                    </div>
                    <p className="text-[10px] text-red-900/60 leading-relaxed italic">
                      Las ausencias injustificadas activan automáticamente un strike en el expediente del colaborador. 3 strikes resultan en auditoría disciplinaria obligatoria.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
      {activeTab === 'candidates' && (
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* AI Intake Board - Reduced Size */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-xl relative overflow-hidden group mb-2 shrink-0 transition-all hover:shadow-[#00F0FF]/5">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <Bot className="w-16 h-16 text-[#00F0FF]" />
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
               <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
                        <Sparkles className="w-5 h-5 text-[#00F0FF] animate-pulse" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter italic">Clasificador de Talento Nucleus</h3>
                        <p className="text-[9px] font-black text-[#00F0FF] uppercase tracking-widest mt-0.5 italic">Extracción y Catalogación IA Multi-Factor</p>
                     </div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic pr-8">
                    Sube archivos PDF de currículos. Nuestro motor de IA extraerá automáticamente la experiencia, catalogará las habilidades y asignará un <b className="text-gray-900 uppercase">Ajuste Cultural</b> basado en los valores de Gibbor Center.
                  </p>
               </div>
               <div className="flex-1 max-w-sm">
                  <label className="block">
                     <div className={`border-2 border-dashed border-gray-100 rounded-3xl p-6 bg-gray-50/50 hover:bg-white hover:border-[#00F0FF]/50 transition-all cursor-pointer text-center group/uploader relative overflow-hidden shadow-inner ${isUploading ? 'animate-pulse opacity-50 pointer-events-none' : ''}`}>
                        <input 
                           type="file" 
                           className="hidden" 
                           accept=".pdf,.doc,.docx"
                           onChange={handleFileUpload}
                        />
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00F0FF] origin-left scale-x-0 group-hover/uploader:scale-x-100 transition-transform duration-1000" />
                        <Upload className={`w-8 h-8 text-gray-400 mx-auto mb-2 group-hover/uploader:text-[#00F0FF] group-hover/uploader:scale-110 transition-all ${isUploading ? 'animate-bounce' : ''}`} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           {isUploading ? 'Extrayendo Datos...' : 'Importar Lote de CVs'}
                        </p>
                        <p className="text-[8px] font-black text-gray-300 mt-1 uppercase tracking-tight">PDF • WORD • LINKEDIN • AI DRIVEN</p>
                     </div>
                  </label>
               </div>
            </div>
          </div>

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
                          {candidate.aiScore || 0}% AJUSTE
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
                           <span className="text-[10px] font-black text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">ID CANDIDATO: {selectedCandidate.id.slice(0,8)}</span>
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
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Perfil de LinkedIn</p>
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
        <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 space-y-6">
              <div className="h-14 w-14 bg-gray-900 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-6 transition-transform">
                <Globe className="w-7 h-7 text-[#00F0FF] animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Portal de Carreras Kaivincia</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Sincronización Web Externa Automática</p>
              </div>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic pr-8">
                Este portal es la cara pública de tu empresa. Todas las vacantes marcadas como <b className="text-gray-900 uppercase">ONLINE</b> en la pestaña anterior se publicarán automáticamente aquí. Los candidatos podrán postularse y sus perfiles entrarán directamente a tu Pipeline de IA.
              </p>
              <div className="flex gap-4">
                <a 
                  href="/careers" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00F0FF] transition-all shadow-xl flex items-center gap-3"
                >
                  <ExternalLink className="w-5 h-5 text-[#00F0FF]" /> Abrir en Nueva Ventana
                </a>
                <button className="px-8 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all">
                  Personalizar Diseño
                </button>
              </div>
            </div>
            
            <div className="lg:w-1/3 bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <MonitorPlay className="w-5 h-5 text-indigo-500" />
                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Vista Previa Móvil</h4>
              </div>
              <div className="aspect-[9/16] bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative group/mock">
                <div className="absolute inset-0 bg-gray-900/5 transition-opacity group-hover/mock:opacity-0" />
                <iframe 
                  src="/careers" 
                  className="w-full h-full border-none pointer-events-none scale-90" 
                  title="Mobile Preview"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="bg-[#0B0E14] p-8 rounded-[2.5rem] border border-gray-800 flex items-center gap-6 group">
               <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#00F0FF] group-hover:scale-110 transition-transform">
                  <UserPlus className="w-8 h-8" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter italic">Formulario de Aplicación</h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-1 leading-tight">Configura las preguntas personalizadas que los candidatos deben responder.</p>
               </div>
            </div>
            <div className="bg-[#0B0E14] p-8 rounded-[2.5rem] border border-gray-800 flex items-center gap-6 group">
               <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter italic">Tracking de Conversión</h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-1 leading-tight">Analiza cuántos visitantes del portal terminan convirtiéndose en aplicantes.</p>
               </div>
            </div>
          </div>
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
