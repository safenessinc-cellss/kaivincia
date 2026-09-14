import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, Briefcase, Users, DollarSign, Plus, CheckCircle2, 
  XCircle, Clock, Search, Filter, Sparkles, ChevronRight, Eye, 
  Trash2, Pause, Play, Download, CreditCard, ShieldCheck, 
  FileText, ArrowUpRight, LogOut, RefreshCw, Mail, Phone, MapPin, 
  Calendar, Award, Check, ExternalLink, X, AlertCircle
} from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import jsPDF from 'jspdf';

export default function CompanyDashboard() {
  const navigate = useNavigate();

  // Company session
  const [company, setCompany] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('kaivincia_company_session');
      return saved ? JSON.parse(saved) : {
        id: 'comp-demo',
        companyName: 'TechVanguard Innovations S.L.',
        email: 'talento@techvanguard.io',
        contactName: 'Elena Ramos',
        taxId: 'B-99887766',
        industry: 'Tecnología & SaaS',
        plan: 'saas_basic',
        status: 'active'
      };
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'billing' | 'profile'>('jobs');
  
  // Vacancies state
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    department: 'Tecnología',
    type: 'Remoto',
    location: 'España / Remoto',
    salaryRange: '35.000€ - 45.000€',
    experienceLevel: 'Senior (+3 años)',
    description: '',
    requirements: '',
    isUrgent: false,
  });

  // Candidates state
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [candidateFilterJob, setCandidateFilterJob] = useState<string>('all');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [candidateSearch, setCandidateSearch] = useState('');

  // Billing / Payment state
  const [currentPlan, setCurrentPlan] = useState<'saas_basic' | 'managed_premium'>(
    company?.plan === 'managed_premium' ? 'managed_premium' : 'saas_basic'
  );
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutGateway, setCheckoutGateway] = useState<'stripe' | 'paypal' | 'mercadopago'>('stripe');
  const [targetPlanToBuy, setTargetPlanToBuy] = useState<'saas_basic' | 'managed_premium'>('saas_basic');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [invoices, setInvoices] = useState([
    { id: 'INV-2026-001', date: '01/03/2026', concept: 'Suscripción SaaS Autogestión (Mensual)', amount: '199,00 €', status: 'Pagado', gateway: 'Stripe' },
    { id: 'INV-2026-002', date: '01/02/2026', concept: 'Activación Plataforma Reclutamiento IA', amount: '199,00 €', status: 'Pagado', gateway: 'Stripe' },
  ]);

  // Sync Jobs
  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter for this company if companyId set, or provide company-relevant jobs
      if (all.length > 0) {
        setJobs(all);
      } else {
        // Mock default jobs
        setJobs([
          {
            id: 'job-1',
            title: 'Closer de Ventas High-Ticket B2B',
            department: 'Ventas & Crecimiento',
            type: 'Remoto',
            location: 'Madrid / Remoto Global',
            salaryRange: '40.000€ - 65.000€ OTE',
            experienceLevel: 'Mid-Senior',
            description: 'Responsable del cierre de acuerdos estratégicos corporativos para soluciones SaaS de alta gama.',
            status: 'active',
            candidatesCount: 8,
            createdAt: new Date().toISOString()
          },
          {
            id: 'job-2',
            title: 'Setter Especialista en Prospección Outbound',
            department: 'Generación de Demanda',
            type: 'Híbrido',
            location: 'Barcelona / Híbrido',
            salaryRange: '28.000€ - 38.000€',
            experienceLevel: 'Junior-Mid',
            description: 'Calificación de leads empresariales y concertación de reuniones comerciales para el equipo de ventas.',
            status: 'active',
            candidatesCount: 14,
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
          }
        ]);
      }
      setLoadingJobs(false);
    }, (err) => {
      console.warn("Jobs listener fallback:", err);
      setLoadingJobs(false);
    });

    return () => unsub();
  }, []);

  // Sync Candidates
  useEffect(() => {
    const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (all.length > 0) {
        setCandidates(all);
      } else {
        // Mock initial candidates with AI match
        setCandidates([
          {
            id: 'cand-1',
            name: 'Valeria Montiel',
            email: 'valeria.montiel@candidate.com',
            phone: '+34 612 345 678',
            role: 'Closer de Ventas High-Ticket B2B',
            jobId: 'job-1',
            aiScore: 94,
            status: 'Entrevista',
            skills: ['Negociación B2B', 'Venta Consultiva', 'HubSpot CRM', 'Pipeline Management', 'Cierre SPIN'],
            aiSummary: 'Candidata excepcional con 4 años cerrando contratos superiores a 30k€. Excelente dominio de objeciones y encaje perfecto con el TDR del puesto.',
            aiPros: ['Superó el 130% de cuota comercial durante 2025', 'Experiencia previa en el sector SaaS B2B'],
            aiCons: ['Disponibilidad de incorporación en 30 días (periodo de preaviso)'],
            createdAt: new Date().toISOString()
          },
          {
            id: 'cand-2',
            name: 'Rodrigo Balmes',
            email: 'rodrigo.balmes@candidate.com',
            phone: '+34 689 901 234',
            role: 'Setter Especialista en Prospección Outbound',
            jobId: 'job-2',
            aiScore: 88,
            status: 'En Revisión',
            skills: ['Cold Emailing', 'LinkedIn Sales Navigator', 'Generación de Leads', 'Loom Pitching'],
            aiSummary: 'Perfil enérgico y metódico egresado de la Academia Kaivincia. Genera más de 45 demos cualificadas al mes con enfoque multicanal.',
            aiPros: ['Certificación Setter Pro con honores', 'Excelente comunicación persuasiva escrita y verbal'],
            aiCons: ['Poca experiencia en el mercado anglosajón'],
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: 'cand-3',
            name: 'Javier Navarro',
            email: 'javier.navarro@candidate.com',
            phone: '+34 655 432 109',
            role: 'Closer de Ventas High-Ticket B2B',
            jobId: 'job-1',
            aiScore: 68,
            status: 'Nuevo',
            skills: ['Venta Retail', 'Atención al Cliente', 'POS'],
            aiSummary: 'Trayectoria predominantemente enfocada en comercio minorista. Requiere un período de formación considerable en ciclos de venta B2B complejos.',
            aiPros: ['Gran vocación de servicio y proactividad'],
            aiCons: ['Sin experiencia previa en entornos corporativos o prospección fría'],
            createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
          }
        ]);
      }
      setLoadingCandidates(false);
    }, (err) => {
      console.warn("Candidates listener fallback:", err);
      setLoadingCandidates(false);
    });

    return () => unsub();
  }, []);

  // Filtered Candidates (Sorted by AI Match Score Descending)
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(c => {
        const matchesJob = candidateFilterJob === 'all' || c.jobId === candidateFilterJob || c.role === candidateFilterJob;
        const matchesScore = (c.aiScore || 0) >= minMatchScore;
        const matchesSearch = !candidateSearch || 
          c.name?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
          c.email?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
          c.role?.toLowerCase().includes(candidateSearch.toLowerCase());
        return matchesJob && matchesScore && matchesSearch;
      })
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  }, [candidates, candidateFilterJob, minMatchScore, candidateSearch]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title) return;

    try {
      const newJob = {
        ...jobForm,
        companyId: company?.id || 'comp-demo',
        companyName: company?.companyName || 'Empresa Colaboradora',
        status: 'active',
        candidatesCount: 0,
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, 'jobs'), newJob);
      } catch {
        setJobs(prev => [{ id: 'job-' + Date.now(), ...newJob }, ...prev]);
      }

      setIsNewJobModalOpen(false);
      setJobForm({
        title: '',
        department: 'Tecnología',
        type: 'Remoto',
        location: 'España / Remoto',
        salaryRange: '35.000€ - 45.000€',
        experienceLevel: 'Senior (+3 años)',
        description: '',
        requirements: '',
        isUrgent: false,
      });
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status: nextStatus });
    } catch {
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: nextStatus } : j));
    }
  };

  const updateCandidateStatus = async (candidateId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'candidates', candidateId), { status });
    } catch {
      setCandidates(candidates.map(c => c.id === candidateId ? { ...c, status } : c));
    }
    if (selectedCandidate?.id === candidateId) {
      setSelectedCandidate({ ...selectedCandidate, status });
    }
  };

  const handleSubscribePlan = (plan: 'saas_basic' | 'managed_premium') => {
    setTargetPlanToBuy(plan);
    setIsCheckoutModalOpen(true);
  };

  const executeCheckout = async () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentSuccess(true);
      setCurrentPlan(targetPlanToBuy);
      
      const newInv = {
        id: `INV-2026-00${invoices.length + 1}`,
        date: new Date().toLocaleDateString('es-ES'),
        concept: targetPlanToBuy === 'managed_premium' 
          ? 'Servicio Gestionado Headhunter IA (Retainer Mensual)' 
          : 'Suscripción SaaS Autogestión (Mensual)',
        amount: targetPlanToBuy === 'managed_premium' ? '750,00 €' : '199,00 €',
        status: 'Pagado',
        gateway: checkoutGateway.toUpperCase()
      };
      setInvoices([newInv, ...invoices]);

      setTimeout(() => {
        setIsCheckoutModalOpen(false);
        setPaymentSuccess(false);
      }, 1500);
    }, 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('kaivincia_company_session');
    navigate('/empresas/login');
  };

  const handleDownloadInvoice = (inv: any) => {
    try {
      const docPdf = new jsPDF();
      docPdf.setFillColor(15, 23, 42);
      docPdf.rect(0, 0, 210, 40, 'F');
      docPdf.setTextColor(0, 240, 255);
      docPdf.setFontSize(20);
      docPdf.text('KAIVINCIA CORP - COMPROBANTE B2B', 14, 25);
      
      docPdf.setTextColor(30, 41, 59);
      docPdf.setFontSize(11);
      docPdf.text(`Factura / Recibo: ${inv.id}`, 14, 55);
      docPdf.text(`Fecha de Emisión: ${inv.date}`, 14, 65);
      docPdf.text(`Empresa: ${company?.companyName || 'Empresa Cliente'}`, 14, 75);
      docPdf.text(`NIF / CIF: ${company?.taxId || 'N/A'}`, 14, 85);
      docPdf.text(`Email de Contacto: ${company?.email || 'talento@empresa.com'}`, 14, 95);
      
      docPdf.setDrawColor(200, 200, 200);
      docPdf.line(14, 105, 196, 105);
      
      docPdf.setFontSize(13);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text('Detalle de Servicio:', 14, 120);
      docPdf.setFontSize(10);
      docPdf.text(`Concepto: ${inv.concept}`, 14, 130);
      docPdf.text(`Pasarela de Pago: ${inv.gateway}`, 14, 140);
      docPdf.text(`Estado de Transacción: ${inv.status}`, 14, 150);
      
      docPdf.setFontSize(15);
      docPdf.setTextColor(16, 185, 129);
      docPdf.text(`Total Liquidado: ${inv.amount}`, 14, 170);
      
      docPdf.setFontSize(9);
      docPdf.setTextColor(100, 116, 139);
      docPdf.text('Documento oficial generado con validez contable por Kaivincia Corp.', 14, 200);
      docPdf.save(`Comprobante_${inv.id}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-gray-200 font-sans flex flex-col selection:bg-cyan-500/30">
      
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#0a0d14]/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center font-black text-black text-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                K
              </div>
              <div>
                <span className="text-lg font-black text-white uppercase italic tracking-tighter">Kaivincia</span>
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md">Panel B2B</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 pl-6 border-l border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-300">{company?.companyName || 'Empresa Colaboradora'}</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-400">
                {currentPlan === 'managed_premium' ? 'Plan Gestionado VIP' : 'SaaS Autogestión'}
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'jobs', label: 'Mis Vacantes', icon: Briefcase },
              { id: 'candidates', label: 'Candidatos & IA', icon: Users, badge: candidates.length },
              { id: 'billing', label: 'Planes & Pagos', icon: DollarSign },
              { id: 'profile', label: 'Empresa', icon: Building2 },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-black text-cyan-400' : 'bg-white/10 text-gray-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors ml-2"
              title="Cerrar sesión corporativa"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        
        {/* TAB 1: MIS VACANTES */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e121a] border border-white/5 p-6 rounded-3xl">
              <div>
                <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">Gestión de Vacantes</h1>
                <p className="text-xs text-gray-400 mt-1">
                  Publica puestos de trabajo y recibe automáticamente candidatos evaluados por la IA de Kaivincia.
                </p>
              </div>
              <button
                onClick={() => setIsNewJobModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Vacante</span>
              </button>
            </div>

            {/* Jobs List */}
            {loadingJobs ? (
              <div className="text-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Cargando vacantes...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">No tienes vacantes activas</h3>
                <p className="text-xs text-gray-400 mt-1 mb-6">Crea tu primera oferta para comenzar a recibir talento evaluado por IA.</p>
                <button
                  onClick={() => setIsNewJobModalOpen(true)}
                  className="px-6 py-2.5 bg-cyan-500 text-black text-xs font-bold uppercase rounded-xl"
                >
                  Crear Vacante
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    className="bg-[#0e121a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            job.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {job.status === 'active' ? '● Activa en Careers' : 'Pausada'}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                            {job.department}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px]">
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase font-bold">Modalidad</span>
                        <span className="font-semibold text-gray-200">{job.type || 'Remoto'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase font-bold">Rango Salarial</span>
                        <span className="font-semibold text-cyan-400">{job.salaryRange || 'A convenir'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase font-bold">Candidatos</span>
                        <span className="font-bold text-white">{job.candidatesCount || 0} postulados</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 mb-6">
                      {job.description || 'Sin descripción ingresada.'}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <button
                        onClick={() => {
                          setCandidateFilterJob(job.id);
                          setActiveTab('candidates');
                        }}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ver Postulantes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleJobStatus(job.id, job.status)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-gray-300 transition-colors flex items-center gap-1"
                          title={job.status === 'active' ? 'Pausar vacante' : 'Reactivar vacante'}
                        >
                          {job.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>{job.status === 'active' ? 'Pausar' : 'Activar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATOS & IA MATCH */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-[#0e121a] border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full md:w-auto relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, puesto o competencia..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] uppercase font-bold text-gray-500">Vacante:</span>
                  <select
                    value={candidateFilterJob}
                    onChange={(e) => setCandidateFilterJob(e.target.value)}
                    className="bg-transparent text-white focus:outline-none text-xs"
                  >
                    <option value="all" className="bg-[#0e121a]">Todas las vacantes</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id} className="bg-[#0e121a]">{j.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] uppercase font-bold text-gray-500">Match Min:</span>
                  <select
                    value={minMatchScore}
                    onChange={(e) => setMinMatchScore(Number(e.target.value))}
                    className="bg-transparent text-white focus:outline-none text-xs font-bold text-cyan-400"
                  >
                    <option value={0} className="bg-[#0e121a]">Todos (0%+)</option>
                    <option value={70} className="bg-[#0e121a]">Notable (70%+)</option>
                    <option value={85} className="bg-[#0e121a]">Excelente (85%+)</option>
                    <option value={90} className="bg-[#0e121a]">Elite (90%+)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-[#0e121a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-wider font-extrabold text-gray-400">
                    <tr>
                      <th className="p-4 pl-6">Candidato</th>
                      <th className="p-4">Puesto Postulado</th>
                      <th className="p-4">IA Match Score</th>
                      <th className="p-4">Habilidades Extraídas</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 pr-6 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-500">
                          No se encontraron candidatos que coincidan con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map(c => {
                        const score = c.aiScore || 0;
                        const scoreColor = score >= 85 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : score >= 70 ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                        return (
                          <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-900 to-blue-900 flex items-center justify-center font-bold text-white uppercase text-sm border border-white/10">
                                  {c.name ? c.name.charAt(0) : 'C'}
                                </div>
                                <div>
                                  <span className="font-bold text-white block">{c.name}</span>
                                  <span className="text-[10px] text-gray-500 font-medium">{c.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-gray-300 font-medium">
                              {c.role || 'Puesto General'}
                            </td>
                            <td className="p-4">
                              <div className="inline-flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${scoreColor}`}>
                                  <Sparkles className="w-3 h-3" />
                                  <span>{score}%</span>
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(c.skills || c.aiExtractedSkills || ['Ventas', 'Comunicación']).slice(0, 3).map((s: string, idx: number) => (
                                  <span key={idx} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/5">
                                    {s}
                                  </span>
                                ))}
                                {(c.skills?.length || 0) > 3 && (
                                  <span className="text-[9px] text-gray-500 font-bold">+{c.skills.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <select
                                value={c.status || 'Nuevo'}
                                onChange={(e) => updateCandidateStatus(c.id, e.target.value)}
                                className="bg-[#151a24] border border-white/10 text-[11px] font-semibold text-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
                              >
                                <option value="Nuevo">Nuevo</option>
                                <option value="En Revisión">En Revisión</option>
                                <option value="Entrevista">Entrevista</option>
                                <option value="Seleccionado">Seleccionado</option>
                                <option value="Rechazado">Rechazado</option>
                              </select>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <button
                                onClick={() => setSelectedCandidate(c)}
                                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Dossier</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MONETIZACIÓN & FACTURACIÓN (PLANES Y PASARELAS) */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="bg-[#0e121a] border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Modelo de Suscripción Kaivincia B2B</span>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mt-1">Planes y Pasarelas de Pago</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Escoge entre autogestión completa con Gemini AI o delega la selección a nuestros especialistas con garantía de colocación.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-gray-500 block leading-none">Plan Activo</span>
                  <span className="text-xs font-bold text-white">
                    {currentPlan === 'managed_premium' ? 'Servicio Gestionado VIP' : 'SaaS Autogestión'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* PLAN 1: SAAS AUTOGESTIÓN */}
              <div className={`rounded-3xl p-8 border relative flex flex-col justify-between transition-all ${
                currentPlan === 'saas_basic' 
                  ? 'bg-gradient-to-b from-[#0f1722] to-[#0e121a] border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)]' 
                  : 'bg-[#0e121a] border-white/10 hover:border-white/20'
              }`}>
                {currentPlan === 'saas_basic' && (
                  <div className="absolute -top-3.5 right-8 bg-cyan-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Plan en Uso
                  </div>
                )}
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">SaaS Autogestión</h3>
                  <p className="text-xs text-gray-400 mt-2">
                    Ideal para departamentos de RRHH o líderes de equipo que desean acelerar el cribado curricular con IA.
                  </p>
                  
                  <div className="my-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">199 €</span>
                      <span className="text-xs text-gray-500 font-bold uppercase">/ mes</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-bold">O 49€ por vacante individual</span>
                  </div>

                  <ul className="space-y-3 my-6 text-xs text-gray-300">
                    {[
                      'Publicación ilimitada de vacantes en portal Careers',
                      'Cribado inteligente con IA (Match Score 0-100%)',
                      'Extracción automática de habilidades desde CV (PDF/Word)',
                      'Pipeline Kanban de candidatos en tiempo real',
                      'Acceso directo a la base de egresados Academia Kaivincia',
                      'Soporte técnico estándar'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribePlan('saas_basic')}
                  disabled={currentPlan === 'saas_basic'}
                  className={`w-full py-4 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all ${
                    currentPlan === 'saas_basic'
                      ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 active:scale-95'
                  }`}
                >
                  {currentPlan === 'saas_basic' ? 'Plan Actual' : 'Contratar Plan Autogestión'}
                </button>
              </div>

              {/* PLAN 2: SERVICIO GESTIONADO (PREMIUM) */}
              <div className={`rounded-3xl p-8 border relative flex flex-col justify-between transition-all ${
                currentPlan === 'managed_premium' 
                  ? 'bg-gradient-to-b from-[#11162b] to-[#0e121a] border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]' 
                  : 'bg-[#0e121a] border-white/10 hover:border-white/20'
              }`}>
                {currentPlan === 'managed_premium' && (
                  <div className="absolute -top-3.5 right-8 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Plan en Uso
                  </div>
                )}
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Servicio Gestionado</h3>
                  <p className="text-xs text-gray-400 mt-2">
                    Servicio llave en mano: Headhunter Kaivincia dedicado + IA para perfiles de alta dirección y ventas críticas.
                  </p>
                  
                  <div className="my-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">750 €</span>
                      <span className="text-xs text-gray-500 font-bold uppercase">/ mes</span>
                    </div>
                    <span className="text-[10px] text-blue-400 font-bold">+ 12% comisión de éxito sobre salario bruto anual</span>
                  </div>

                  <ul className="space-y-3 my-6 text-xs text-gray-300">
                    {[
                      'Todo lo incluido en el Plan SaaS Autogestión',
                      'Asesor de selección y headhunting dedicado',
                      'Entrevistas de validación técnica y fit cultural previas',
                      'Shortlist con 3 finalistas de élite garantizados en 14 días',
                      'Garantía de sustitución de 90 días sin coste adicional',
                      'Pruebas de competencia simuladas (Roleplay y Casos de Negocio)',
                      'Soporte prioritario VIP por WhatsApp / Slack'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribePlan('managed_premium')}
                  disabled={currentPlan === 'managed_premium'}
                  className={`w-full py-4 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all ${
                    currentPlan === 'managed_premium'
                      ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                  }`}
                >
                  {currentPlan === 'managed_premium' ? 'Plan Actual' : 'Contratar Servicio Gestionado VIP'}
                </button>
              </div>

            </div>

            {/* Invoices History Table */}
            <div className="bg-[#0e121a] border border-white/5 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Historial de Facturación</h3>
                  <p className="text-xs text-gray-400">Comprobantes y recibos fiscales emitidos automáticamente</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                    <tr>
                      <th className="p-3">Factura</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Importe</th>
                      <th className="p-3">Pasarela</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Descargar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono font-bold text-white">{inv.id}</td>
                        <td className="p-3 text-gray-400">{inv.date}</td>
                        <td className="p-3 text-gray-200 font-medium">{inv.concept}</td>
                        <td className="p-3 font-bold text-white">{inv.amount}</td>
                        <td className="p-3 text-cyan-400 font-semibold">{inv.gateway}</td>
                        <td className="p-3">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => handleDownloadInvoice(inv)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#00F0FF]/20 text-gray-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
                            title="Descargar Comprobante PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PERFIL DE EMPRESA */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto bg-[#0e121a] border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black text-2xl">
                {company?.companyName?.charAt(0) || 'E'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{company?.companyName}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{company?.industry} • CIF {company?.taxId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Email Corporativo</span>
                <span className="font-semibold text-white">{company?.email}</span>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Persona de Contacto</span>
                <span className="font-semibold text-white">{company?.contactName}</span>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Teléfono</span>
                <span className="font-semibold text-white">{company?.phone || '+34 910 000 000'}</span>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Estado de Verificación</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verificado para Contratación
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200">
              <span className="font-bold">Privacidad y Confidencialidad:</span> Los datos de tus vacantes y candidatos se procesan conforme al RGPD y se almacenan de forma cifrada en la infraestructura segura de Kaivincia.
            </div>
          </div>
        )}

      </main>

      {/* MODAL: NUEVA VACANTE */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Publicar Nueva Vacante</h3>
                <p className="text-xs text-gray-400">Define los requerimientos (TDR) para que la IA realice el scoring</p>
              </div>
              <button 
                onClick={() => setIsNewJobModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Título del Puesto *
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="Ej. Closer de Ventas B2B Senior"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Departamento
                  </label>
                  <select
                    value={jobForm.department}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    className="w-full px-4 py-3 bg-[#131822] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Tecnología">Tecnología & Producto</option>
                    <option value="Ventas & Crecimiento">Ventas & Crecimiento</option>
                    <option value="Generación de Demanda">Generación de Demanda (Setters)</option>
                    <option value="Operaciones & Soporte">Operaciones & Soporte</option>
                    <option value="Finanzas">Finanzas & Cobranza</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Modalidad de Trabajo
                  </label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                    className="w-full px-4 py-3 bg-[#131822] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Remoto">100% Remoto</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Rango Salarial Proyectado
                  </label>
                  <input
                    type="text"
                    value={jobForm.salaryRange}
                    onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                    placeholder="Ej. 35.000€ - 45.000€ + Comisiones"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Nivel de Experiencia Requerido
                  </label>
                  <input
                    type="text"
                    value={jobForm.experienceLevel}
                    onChange={(e) => setJobForm({ ...jobForm, experienceLevel: e.target.value })}
                    placeholder="Ej. +3 años en ventas B2B"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Descripción del Puesto & Responsabilidades
                </label>
                <textarea
                  rows={3}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Detalla las funciones clave que desempeñará el profesional en tu equipo..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Requisitos Clave & Términos de Referencia (TDR para el algoritmo de IA)
                </label>
                <textarea
                  rows={3}
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  placeholder="Requisitos obligatorios, software requerido (CRM, Dialers), idiomas, certificaciones..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="urgentJob"
                  checked={jobForm.isUrgent}
                  onChange={(e) => setJobForm({ ...jobForm, isUrgent: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 bg-white/5 border-white/10 focus:ring-0"
                />
                <label htmlFor="urgentJob" className="text-gray-300 font-medium cursor-pointer">
                  Marcar como vacante de alta prioridad (Destacada en el portal)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase tracking-wider"
                >
                  Publicar Vacante Ahora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOSSIER DE CANDIDATO & EVALUACIÓN IA */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-xl">
                  {selectedCandidate.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedCandidate.name}</h3>
                  <p className="text-xs text-gray-400">{selectedCandidate.role} • {selectedCandidate.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Match Overview Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini AI Match Score</span>
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-white">{selectedCandidate.aiScore || 0}%</span>
                    <span className="text-xs font-bold text-emerald-400 uppercase">
                      {selectedCandidate.aiScore >= 85 ? 'Excelente Compatibilidad' : selectedCandidate.aiScore >= 70 ? 'Apto para el puesto' : 'En evaluación'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">Estado:</span>
                  <select
                    value={selectedCandidate.status || 'Nuevo'}
                    onChange={(e) => updateCandidateStatus(selectedCandidate.id, e.target.value)}
                    className="bg-[#151a24] border border-white/20 text-xs font-bold text-white rounded-xl px-3 py-1.5"
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="En Revisión">En Revisión</option>
                    <option value="Entrevista">Entrevista</option>
                    <option value="Seleccionado">Seleccionado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              {selectedCandidate.aiSummary && (
                <p className="text-xs text-gray-200 mt-4 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5 font-medium">
                  "{selectedCandidate.aiSummary}"
                </p>
              )}
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Fortalezas Identificadas
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {(selectedCandidate.aiPros || ['Adecuación notable a los requisitos clave', 'Sólida experiencia comunicativa']).map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" /> Aspectos a Profundizar
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {(selectedCandidate.aiCons || ['Verificar disponibilidad exacta para onboarding']).map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Skills & Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Habilidades Técnicas</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedCandidate.skills || selectedCandidate.aiExtractedSkills || []).map((s: string, idx: number) => (
                  <span key={idx} className="text-xs font-bold px-3 py-1 rounded-xl bg-white/5 text-cyan-300 border border-cyan-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span>{selectedCandidate.phone || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>{selectedCandidate.email}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
              >
                Cerrar Dossier
              </button>
              <button
                onClick={() => {
                  updateCandidateStatus(selectedCandidate.id, 'Entrevista');
                  alert(`Se ha agendado fase de Entrevista para ${selectedCandidate.name}. Se ha notificado al candidato.`);
                  setSelectedCandidate(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider"
              >
                Convocar a Entrevista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHECKOUT DE MONETIZACIÓN (STRIPE / PAYPAL / MERCADO PAGO) */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border border-white/10 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Pasarela de Pago</h3>
                <p className="text-xs text-gray-400">
                  {targetPlanToBuy === 'managed_premium' ? 'Activación Plan Gestionado VIP' : 'Suscripción SaaS Autogestión'}
                </p>
              </div>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">¡Pago Procesado con Éxito!</h4>
                <p className="text-xs text-gray-400">Tu cuenta corporativa ha sido actualizada con acceso total inmediato.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Total a pagar</span>
                    <span className="text-2xl font-black text-white">
                      {targetPlanToBuy === 'managed_premium' ? '750,00 €' : '199,00 €'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/60">
                    Factura Fiscal Inmediata
                  </span>
                </div>

                {/* Gateway Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Selecciona tu Pasarela de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'stripe', name: 'Stripe', sub: 'Tarjetas' },
                      { id: 'paypal', name: 'PayPal', sub: 'Cuenta' },
                      { id: 'mercadopago', name: 'MercadoPago', sub: 'Latam' },
                    ].map(gw => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setCheckoutGateway(gw.id as any)}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          checkoutGateway === gw.id
                            ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-lg'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                        }`}
                      >
                        <span className="block font-bold text-xs">{gw.name}</span>
                        <span className="text-[9px] text-gray-500">{gw.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Card Inputs for Stripe */}
                {checkoutGateway === 'stripe' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Número de Tarjeta Corporativa
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          defaultValue="•••• •••• •••• 4242"
                          className="w-full pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <CreditCard className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                          Caducidad
                        </label>
                        <input
                          type="text"
                          defaultValue="12/28"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                          CVC / CVV
                        </label>
                        <input
                          type="text"
                          defaultValue="•••"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={executeCheckout}
                  disabled={processingPayment}
                  className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-[0.99] disabled:opacity-50"
                >
                  {processingPayment ? 'Procesando Pago Seguro...' : `Confirmar y Pagar con ${checkoutGateway.toUpperCase()}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
