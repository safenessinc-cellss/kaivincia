import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, addDoc, deleteDoc, where, limit, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
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

const formatAttendanceTime = (value: any) => {
  const date = value && typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Hora no disponible' : date.toLocaleString();
};

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'portal' | 'docs' | 'employee-portal'>('candidates');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Attendance State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [absenceRequests, setAbsenceRequests] = useState<any[]>([]);

  // Absence Form State
  const [absenceForm, setAbsenceForm] = useState({
    type: 'Día Libre',
    startDate: '',
    endDate: '',
    reason: ''
  });
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
      setCandidates(data);
      setLoadingCandidates(false);
    }, (error) => {
      console.warn("Candidates listener error:", error);
      handleFirestoreError(error, OperationType.GET, 'candidates');
      setLoadingCandidates(false);
    });

    return () => unsubscribe();
  }, []);

  // Attendance state is read from persisted records for the signed-in user.
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setAttendanceLog([]);
      setIsCheckedIn(false);
      return;
    }
    const attendanceQuery = query(
      collection(db, 'attendance_logs'),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    return onSnapshot(attendanceQuery, (snapshot) => {
      const logs: Array<{ id: string; type?: string; [key: string]: unknown }> = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setAttendanceLog(logs);
      setIsCheckedIn(logs[0]?.type === 'in');
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance_logs');
    });
  }, []);

  // HR review queue: real absence requests only, no sample records.
  useEffect(() => {
    const absenceQuery = query(collection(db, 'absence_requests'), orderBy('createdAt', 'desc'));
    return onSnapshot(absenceQuery, (snapshot) => {
      setAbsenceRequests(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'absence_requests');
    });
  }, []);

  // Fetch Jobs
  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(data);
      setLoadingJobs(false);
    }, (error) => {
      console.warn("Jobs listener error:", error);
      handleFirestoreError(error, OperationType.GET, 'jobs');
      setLoadingJobs(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Candidates Logic ---
  const updateStage = async (candidateId: string, newStage: string) => {
    try {
      await updateDoc(doc(db, 'candidates', candidateId), { status: newStage });
      if (newStage === 'Academia Kaivincia') {
        alert('Etapa del candidato actualizada. No se ha enviado ningún correo ni se han creado accesos a la Academia.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `candidates/${candidateId}`);
    }
  };

  const handleSaveCandidateEdit = async () => {
    if (!editingCandidate) return;
    try {
      const dataToUpdate = { ...editingCandidate };
      const id = dataToUpdate.id;
      delete dataToUpdate.id;
      delete dataToUpdate.aiScore;
      delete dataToUpdate.aiSummary;
      delete dataToUpdate.aiPros;
      delete dataToUpdate.aiCons;
      delete dataToUpdate.aiJustification;
      delete dataToUpdate.aiExtractedSkills;
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

  const handleAbsenceStatusChange = async (requestId: string, status: 'approved' | 'rejected') => {
    const reviewer = auth.currentUser;
    if (!reviewer) return;
    try {
      await updateDoc(doc(db, 'absence_requests', requestId), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewer.uid,
        reviewerEmail: reviewer.email || ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `absence_requests/${requestId}`);
    }
  };

  const handleAttendance = async (type: 'in' | 'out') => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const log = {
        userId: currentUser.uid,
        userName: currentUser.email || '',
        type,
        timestamp: serverTimestamp(),
        source: 'web'
      };
      await addDoc(collection(db, 'attendance_logs'), log);
      setIsCheckedIn(type === 'in');
      alert(`Fichaje ${type === 'in' ? 'de entrada' : 'de salida'} registrado.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance_logs');
    }
  };

  const handleAbsenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      alert('Debes iniciar sesión con una cuenta de correo válida para enviar la solicitud.');
      return;
    }
    try {
      const request = {
        ...absenceForm,
        userId: currentUser.uid,
        userName: currentUser.email,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'absence_requests'), request);
      alert('Solicitud registrada con estado pendiente. La notificación automática a RRHH/superior no está confirmada.');
      setIsAbsenceModalOpen(false);
      setAbsenceForm({ type: 'Día Libre', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'absence_requests');
    }
  };

  if ((loadingCandidates || loadingJobs) && candidates.length === 0 && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#00F0FF] rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cargando gestión de talento y reclutamiento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full relative">
      {/* Attendance Modal */}
      <AnimatePresence>
        {isAttendanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAttendanceModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <Clock className="w-12 h-12 text-gray-50 opacity-50" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl">
                  <Fingerprint className="w-6 h-6 text-[#00F0FF]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Control de Fichaje personal</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Registro web de asistencia</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-center py-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 font-mono">Estado del fichaje</p>
                  <p className="text-5xl font-black text-gray-900 italic tracking-tighter">{isCheckedIn ? 'ENTRADA REGISTRADA' : 'SIN FICHAJE ACTIVO'}</p>
                  <p className="text-[9px] text-gray-500 mt-3">{attendanceLog[0]?.timestamp ? `Último evento: ${formatAttendanceTime(attendanceLog[0].timestamp)}` : 'Sin registros de asistencia todavía'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAttendance('in')}
                    disabled={isCheckedIn}
                    className={`py-6 rounded-3xl flex flex-col items-center gap-3 transition-all ${
                      isCheckedIn 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-emerald-500 text-white shadow-xl hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    <Zap className="w-6 h-6" />
                    <span className="text-xs font-black uppercase tracking-widest">Check-In</span>
                  </button>
                  <button 
                    onClick={() => handleAttendance('out')}
                    disabled={!isCheckedIn}
                    className={`py-6 rounded-3xl flex flex-col items-center gap-3 transition-all ${
                      !isCheckedIn 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-red-500 text-white shadow-xl hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    <MousePointer2 className="w-6 h-6" />
                    <span className="text-xs font-black uppercase tracking-widest">Check-Out</span>
                  </button>
                </div>

                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                   <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500">
                      <MapPin className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">Ubicación no capturada</p>
                      <p className="text-[9px] text-blue-700/70 mt-1 uppercase">No se registra GPS ni IP. El evento se asocia a tu cuenta autenticada.</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Absence Request Modal */}
      <AnimatePresence>
        {isAbsenceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAbsenceModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] p-10 border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl">
                  <Calendar className="w-6 h-6 text-[#00F0FF]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Nueva Solicitud</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Protocolo de Ausencia Kaivincia</p>
                </div>
              </div>

              <form onSubmit={handleAbsenceSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo de Ausencia</label>
                    <select 
                      value={absenceForm.type}
                      onChange={(e) => setAbsenceForm({...absenceForm, type: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#00F0FF] outline-none transition-all"
                    >
                      <option>Día Libre</option>
                      <option>Cita Médica</option>
                      <option>Vacaciones</option>
                      <option>Asuntos Personales</option>
                      <option>Baja Laboral</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Desde</label>
                      <input 
                        type="date"
                        required
                        value={absenceForm.startDate}
                        onChange={(e) => setAbsenceForm({...absenceForm, startDate: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#00F0FF] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hasta</label>
                      <input 
                        type="date"
                        required
                        value={absenceForm.endDate}
                        onChange={(e) => setAbsenceForm({...absenceForm, endDate: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#00F0FF] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Motivo Justificado</label>
                    <textarea 
                      required
                      placeholder="Describe el motivo de la ausencia..."
                      value={absenceForm.reason}
                      onChange={(e) => setAbsenceForm({...absenceForm, reason: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#00F0FF] outline-none transition-all min-h-[120px]"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAbsenceModalOpen(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00F0FF] hover:text-black transition-all shadow-xl"
                  >
                    Enviar Solicitud
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center bg-white/50 p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Reclutamiento y Selección</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Gestión de Talento Kaivincia N-Core</p>
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
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Cargando plantilla legal Kaivincia Center...</span>
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
                       <p className="text-[10px] text-gray-400 font-medium mt-1 leading-tight">Envío automático de manuales de cultura y marca Kaivincia.</p>
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
                   Este módulo no recibe ni archiva documentos de identidad. No solicites ni cargues DNI, pasaportes u otros documentos sensibles hasta que se habiliten almacenamiento privado, control de acceso y una política de retención verificada.
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
                { label: 'Mi estado de jornada', val: isCheckedIn ? 'En jornada' : 'Sin fichaje', icon: Zap, color: isCheckedIn ? 'text-green-600' : 'text-gray-400', bg: isCheckedIn ? 'bg-green-50' : 'bg-gray-50' },
                { label: 'Mis registros', val: String(attendanceLog.length), icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Solicitudes registradas', val: String(absenceRequests.length), icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Pendientes de RR. HH.', val: String(absenceRequests.filter(item => item.status === 'pending').length), icon: MessageCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' }
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
                          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Disponibilidad del equipo</h3>
                          <p className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest mt-1 italic">Sin telemetría global conectada</p>
                       </div>
                       <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
                          <Clock className="w-4 h-4 text-[#00F0FF]" />
                          <span className="text-xs font-mono font-black italic">Estado no disponible</span>
                       </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                       <p className="text-xs font-black uppercase tracking-widest text-gray-700">Monitor global no conectado</p>
                       <p className="text-[10px] text-gray-500 mt-2">No hay telemetría real de disponibilidad. No se muestran nombres, estados ni direcciones IP de ejemplo.</p>
                    </div>
                    <button
                      onClick={() => setIsAttendanceModalOpen(true)}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#00F0FF] transition-all shadow-xl active:scale-95 italic"
                    >
                      Abrir fichaje personal
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
                       <button 
                          onClick={() => setIsAbsenceModalOpen(true)}
                          className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-[#00F0FF] transition-all shadow-lg active:scale-90"
                       >
                          <Plus className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="space-y-4">
                       {absenceRequests.length === 0 ? (
                         <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
                           No hay solicitudes registradas.
                         </div>
                       ) : absenceRequests.map((req) => (
                         <div key={req.id} className="flex items-center gap-4 p-5 bg-gray-50/50 border border-gray-100 rounded-3xl">
                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${req.status === 'approved' ? 'bg-green-100 text-green-600' : req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                               <Calendar className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-black text-gray-900 truncate">{req.userName || req.userEmail || 'Colaborador'}</h4>
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${req.status === 'approved' ? 'bg-green-500 text-white' : req.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                                     {req.status === 'approved' ? 'Aprobada' : req.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                                  </span>
                               </div>
                               <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{req.type || 'Ausencia'} • {req.startDate || '—'} – {req.endDate || '—'}</p>
                               <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{req.reason || 'Sin motivo indicado'}</p>
                            </div>
                            {req.status === 'pending' && (
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleAbsenceStatusChange(req.id, 'approved')} title="Aprobar solicitud" className="p-3 bg-white border border-gray-100 text-emerald-600 rounded-xl hover:shadow-lg transition-all"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={() => handleAbsenceStatusChange(req.id, 'rejected')} title="Rechazar solicitud" className="p-3 bg-white border border-gray-100 text-red-500 rounded-xl hover:shadow-lg transition-all"><XCircle className="w-4 h-4" /></button>
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                    </div>
                 </div>
              
              {/* Sidebar: Role Config & Training */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-[#0B0E14] rounded-[3rem] p-10 border border-gray-800 shadow-2xl text-white">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                       <ShieldAlert className="w-5 h-5 text-[#00F0FF]" /> Permisos de RR. HH.
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      El acceso a candidatos, directorio y solicitudes de ausencia depende del rol y de los permisos individuales. La asignación de roles y permisos del sistema queda reservada a SuperAdmin.
                    </p>
                 </div>

                 <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-2xl">
                    <h3 className="text-sm font-black text-gray-900 uppercase italic tracking-widest mb-4 flex items-center gap-3">
                       <BookOpen className="w-5 h-5 text-indigo-500" /> Kit de Bienvenida
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      No hay documentos publicados en la biblioteca de empleados. Los enlaces de descarga aparecerán cuando se conecte un repositorio privado de documentos.
                    </p>
                 </div>

                 {/* Protocolo de Faltas */}
                 <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                       <AlertTriangle className="w-5 h-5" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Protocolo S.O.P. Ausencias</h4>
                    </div>
                    <p className="text-[10px] text-red-900/60 leading-relaxed italic">
                      Las solicitudes requieren revisión y aprobación manual por RR. HH. Este módulo no aplica sanciones automáticas ni modifica expedientes disciplinarios.
                    </p>
                 </div>
              </div>
           </div>
      )}
      {activeTab === 'candidates' && (
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm shrink-0">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recepción de candidaturas</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              La importación masiva de CV no está habilitada. Las candidaturas se reciben mediante el formulario público, que extrae texto del CV y lo deja disponible para revisión de RR. HH.
            </p>
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
                      <div className={`absolute top-0 left-0 h-full w-1.5 ${candidate.hasResume ? 'bg-emerald-500' : 'bg-gray-300'}`} />

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
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          {candidate.hasResume ? 'CV recibido' : 'CV pendiente'}
                        </span>
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                          {candidate.status || 'Nuevo'}
                        </span>
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
                  <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 space-y-5">
                     <div>
                       <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Revisión de Recursos Humanos</h3>
                       <p className="text-[10px] text-gray-500 mt-2">La evaluación y el avance del candidato son decisiones del equipo de RR. HH.; no se asigna una puntuación automática.</p>
                     </div>
                     <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest">
                       <span className="px-3 py-2 bg-white rounded-xl border border-gray-200">Estado: {selectedCandidate.status || 'Nuevo'}</span>
                       <span className="px-3 py-2 bg-white rounded-xl border border-gray-200">{selectedCandidate.hasResume ? 'Texto de CV disponible' : 'Sin CV registrado'}</span>
                     </div>
                     <div className="space-y-2">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Texto extraído del currículum</h4>
                       <div className="max-h-72 overflow-y-auto whitespace-pre-wrap bg-white rounded-2xl border border-gray-200 p-5 text-xs leading-relaxed text-gray-700">
                         {selectedCandidate.resumeText ? String(selectedCandidate.resumeText).slice(0, 12000) : 'No se ha guardado texto de currículum para esta candidatura.'}
                       </div>
                     </div>
                     <div className="space-y-2">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Notas internas de RR. HH.</h4>
                       <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">{selectedCandidate.hrNotes || 'Aún no hay notas internas.'}</p>
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

                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6">
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-700 flex items-center gap-2">
                       <History className="w-4 h-4 text-gray-400" /> Historial de comunicaciones
                     </h3>
                     <p className="text-xs text-gray-500 mt-2">No hay historial real de llamadas o WhatsApp sincronizado con este candidato.</p>
                  </div>
               </div>

               <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-4">
                  <button disabled title="La agenda de entrevistas aún no está conectada" className="flex-1 h-16 bg-gray-200 text-gray-500 rounded-3xl font-black text-xs uppercase tracking-[0.2em] cursor-not-allowed italic">
                     Agenda no disponible
                  </button>
                  <button disabled title="La eliminación de candidatos no está conectada" className="h-16 w-16 bg-gray-100 border border-gray-200 text-gray-300 rounded-3xl flex items-center justify-center cursor-not-allowed">
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
                 { label: 'Días activa (sin cálculo)', val: '—', color: 'amber' },
                 { label: 'Costo de adquisición (no conectado)', val: '—', color: 'green' }
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
                     <th className="px-10 py-6">Datos de la vacante</th>
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
                Este portal es la cara pública de tu empresa. Todas las vacantes marcadas como <b className="text-gray-900 uppercase">ONLINE</b> en la pestaña anterior se publicarán automáticamente aquí. Los candidatos podrán postularse y sus perfiles entrarán directamente al pipeline de selección.
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

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Notas internas de RR. HH.</label>
                <textarea
                  value={editingCandidate.hrNotes || ''}
                  onChange={e => setEditingCandidate({...editingCandidate, hrNotes: e.target.value})}
                  rows={5}
                  maxLength={5000}
                  placeholder="Añade observaciones verificables de la entrevista o revisión del perfil..."
                  className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none resize-y"
                />
                <p className="text-[10px] text-gray-400">Máximo 5.000 caracteres. Solo visible para usuarios con permiso de RR. HH.</p>
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
