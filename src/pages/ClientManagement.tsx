import { useState, useEffect } from 'react';
import { 
  Users, FolderKanban, BarChart3, MessageSquare, TrendingUp, 
  Search, Plus, Building2, Phone, Mail, Calendar, DollarSign, FileText,
  AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert, X, Save,
  ExternalLink, MessageCircle, Loader2, Clock, LayoutList, LayoutDashboard,
  Zap, Star, Filter, MoreHorizontal, Activity, MapPin, Target, ArrowUpRight
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  collection, query, onSnapshot, addDoc, serverTimestamp, 
  where, doc, updateDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import IAAdvisor from '../components/IAAdvisor';
import Client360 from '../components/Client360';

interface Client {
  id: string;
  companyName: string;
  taxId?: string;
  contactName: string;
  email: string;
  phone: string;
  industry?: string;
  source?: string;
  website?: string;
  notes?: string;
  status: 'Lead' | 'Activo' | 'En Riesgo' | 'Pausado' | 'Finalizado';
  paymentModel: 'Fijo' | 'Híbrido' | 'Cita';
  contractValue: number;
  healthScore: number;
  service?: string;
  startDate?: string;
  billingStatus?: string;
  projects?: any[];
  setterId?: string;
  roiGoal?: number;
  gpsLocation?: string;
}

export default function ClientManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('perfil360');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState('Todos');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isContractScannerOpen, setIsContractScannerOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [subTab360, setSubTab360] = useState<'info' | 'projects' | 'comms' | 'tasks' | 'interactions' | 'time_logs'>('info');
  const [projectViewMode, setProjectViewMode] = useState<'list' | 'kanban'>('list');
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [clientTasks, setClientTasks] = useState<any[]>([]);
  const [clientInteractions, setClientInteractions] = useState<any[]>([]);
  const [clientTimeLogs, setClientTimeLogs] = useState<any[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [draggedProject, setDraggedProject] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterService, setFilterService] = useState('Todos');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [newClient, setNewClient] = useState({
    companyName: '',
    taxId: '',
    contactName: '',
    role: '',
    phone: '',
    email: '',
    industry: '',
    source: '',
    website: '',
    notes: '',
    service: 'Appointment Setting',
    paymentModel: 'Fijo' as 'Fijo' | 'Híbrido' | 'Cita',
    contractValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    status: 'Lead' as Client['status'],
    setterId: '',
    roiGoal: 0,
    gpsLocation: ''
  });

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || c.status === filterStatus;
    const matchesService = filterService === 'Todos' || c.service === filterService;
    return matchesSearch && matchesStatus && matchesService;
  });

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  // Real-time clients listener
  useEffect(() => {
    const q = query(collection(db, 'clients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      setClients(clientsData);
      if (clientsData.length > 0 && !selectedClientId) {
        setSelectedClientId(clientsData[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });

    return () => unsubscribe();
  }, [selectedClientId]);

  useEffect(() => {
    if (location.state?.openModal && location.state?.prefill) {
      setNewClient(prev => ({
        ...prev,
        companyName: location.state.prefill.company || '',
        contactName: location.state.prefill.contact || '',
        phone: location.state.prefill.phone || '',
        email: location.state.prefill.email || '',
        paymentModel: location.state.prefill.paymentModel || 'Fijo',
        service: location.state.prefill.service || prev.service
      }));
      setIsNewClientModalOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedClient) {
      const qProjects = query(collection(db, 'projects'), where('clientId', '==', selectedClient.id));
      const unsubProjects = onSnapshot(qProjects, (snapshot) => {
        setClientProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'projects'));

      const qTasks = query(collection(db, 'tasks'), where('assignedTo', '==', selectedClient.id)); // Assuming tasks for client use assignedTo or clientId. We should query by clientId if we store it. Since we lack clientId in Tasks schema, let's just query where('clientId', '==', selectedClient.id) assuming we add it. Wait, the blueprint says Task doesn't have clientId, but we are fetching client tasks. Let's use `where('clientId', '==', selectedClient.id)`.
      const unsubTasks = onSnapshot(query(collection(db, 'tasks'), where('clientId', '==', selectedClient.id)), (snapshot) => {
        setClientTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

      const unsubInteractions = onSnapshot(query(collection(db, 'client_interactions'), where('clientId', '==', selectedClient.id)), (snapshot) => {
        const interacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a:any, b:any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
        setClientInteractions(interacts);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'client_interactions'));

      const unsubTimeLogs = onSnapshot(query(collection(db, 'time_logs'), where('projectId', '==', selectedClient.id)), (snapshot) => {
        setClientTimeLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a:any, b:any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'time_logs'));

      const unsubInvoices = onSnapshot(query(collection(db, 'invoices'), where('clientId', '==', selectedClient.id)), (snapshot) => {
        setClientInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'invoices'));

      return () => {
        unsubProjects();
        unsubTasks();
        unsubInteractions();
        unsubTimeLogs();
        unsubInvoices();
      };
    }
  }, [selectedClient]);

  const handleDragStart = (project: any) => {
    setDraggedProject(project);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedProject || draggedProject.status === newStatus) return;

    try {
      const projectRef = doc(db, 'projects', draggedProject.id);
      await updateDoc(projectRef, { 
        status: newStatus as any,
        updatedAt: new Date().toISOString()
      });
      setDraggedProject(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${draggedProject.id}`);
    }
  };

  const handleSaveClient = async () => {
    // Basic Validation
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newClient.companyName) errors.companyName = 'Nombre de empresa requerido';
    if (!newClient.contactName) errors.contactName = 'Nombre de contacto requerido';
    if (!newClient.email) {
      errors.email = 'Email requerido';
    } else if (!emailRegex.test(newClient.email)) {
      errors.email = 'Email inválido';
    }
    
    if (isNaN(newClient.contractValue) || newClient.contractValue <= 0) {
      errors.contractValue = 'Ingrese un monto válido mayor a 0';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);
    try {
      // 1. Create Client Record
      const clientRef = await addDoc(collection(db, 'clients'), {
        ...newClient,
        status: newClient.status || 'Lead',
        healthScore: 100,
        createdAt: serverTimestamp()
      });

      // 2. Automation: Create Folder in Vault SGI
      await addDoc(collection(db, 'documents'), {
         title: `CARPETA CLIENTE: ${newClient.companyName}`,
         category: 'Legal',
         clientId: clientRef.id,
         tags: ['Cifrado', 'Vault'],
         status: 'approved',
         type: 'folder',
         createdAt: serverTimestamp()
      });

      // 3. Automation: IA Advisor Notification
      await addDoc(collection(db, 'system_events'), {
         type: 'AI_INSIGHT',
         message: `Nuevo cliente ${newClient.companyName} registrado. Iniciando secuencia de onboarding y monitoreo de ROI (Meta: ${newClient.roiGoal}%).`,
         severity: 'info',
         timestamp: serverTimestamp()
      });

      setIsNewClientModalOpen(false);
      setNewClient({
        companyName: '',
        taxId: '',
        contactName: '',
        role: '',
        phone: '',
        email: '',
        industry: '',
        source: '',
        website: '',
        notes: '',
        service: 'Appointment Setting',
        paymentModel: 'Fijo' as 'Fijo' | 'Híbrido' | 'Cita',
        contractValue: 0,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Lead' as Client['status'],
        setterId: '',
        roiGoal: 0,
        gpsLocation: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpsell = async (clientId: string) => {
    const clientToUpsell = clients.find(c => c.id === clientId);
    if (!clientToUpsell) return;

    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        status: 'Activo',
        lastUpsellDate: serverTimestamp(),
        healthScore: 100
      });
      
      await addDoc(collection(db, 'tasks'), {
        title: `📞 Seguimiento Upsell: ${clientToUpsell.companyName}`,
        description: 'Preparar propuesta de escalamiento B2B premium. El cliente ha sido marcado para escalamiento.',
        status: 'pending',
        priority: 'high',
        createdAt: serverTimestamp(),
        assignedTo: auth.currentUser?.uid || 'system'
      });

      alert(`¡Oportunidad de Upsell activada para ${clientToUpsell.companyName}! Se ha creado una tarea prioritaria.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'clients');
    }
  };

  const handleAddInteraction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const type = (e.currentTarget.elements.namedItem('type') as HTMLSelectElement).value;
    const note = (e.currentTarget.elements.namedItem('note') as HTMLInputElement).value;
    if (!note && type !== 'Follow-up') return;
    try {
      await addDoc(collection(db, 'client_interactions'), {
        clientId: selectedClient.id,
        type,
        note,
        timestamp: new Date().toISOString(),
        assignedUser: auth.currentUser?.email || 'System' // Changed to email since `name` might not be populated in basic auth structure easily here
      });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'client_interactions');
    }
  };

  const handleQuickFollowUp = async () => {
    try {
      await addDoc(collection(db, 'client_interactions'), {
        clientId: selectedClient.id,
        type: 'Follow-up',
        note: '',
        timestamp: new Date().toISOString(),
        assignedUser: auth.currentUser?.email || 'System'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'client_interactions');
    }
  };

  const handleAddTimeLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const hours = parseFloat((e.currentTarget.elements.namedItem('hours') as HTMLInputElement).value);
    const description = (e.currentTarget.elements.namedItem('description') as HTMLInputElement).value;
    const date = new Date().toISOString().split('T')[0];
    if (!description || isNaN(hours)) return;
    try {
      await addDoc(collection(db, 'time_logs'), {
        projectId: selectedClient.id, // Using projectId as generic relation
        hours,
        description,
        date,
        userUid: auth.currentUser?.uid,
        userName: auth.currentUser?.email || 'System',
        createdAt: new Date().toISOString()
      });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'time_logs');
    }
  };

  let calculatedHealthScore = 100;
  if (selectedClient) {
     if (clientInteractions.length > 0) {
       const latestInteraction = new Date(clientInteractions[0].timestamp || clientInteractions[0].createdAt).getTime();
       const daysSinceLastContact = (Date.now() - latestInteraction) / (1000 * 3600 * 24);
       if (daysSinceLastContact > 30) calculatedHealthScore -= 30;
       else if (daysSinceLastContact > 14) calculatedHealthScore -= 15;
     } else {
       calculatedHealthScore -= 30;
     }

     const openTasksCount = clientTasks.filter(t => t.status !== 'completed' && t.status !== 'Completada').length;
     if (openTasksCount >= 5) calculatedHealthScore -= 20;

     const hasOverdueInvoices = clientInvoices.some(inv => inv.status === 'Vencida' || inv.status === 'overdue');
     if (hasOverdueInvoices) calculatedHealthScore -= 40;

     calculatedHealthScore = Math.max(0, Math.min(100, calculatedHealthScore));
  }

  return (
    <div className="h-full bg-[#0B0E14] text-slate-300 flex flex-col overflow-hidden font-sans">
      {/* Header Section */}
      <div className="p-8 pb-4 shrink-0 flex justify-between items-end border-b border-[#1E293B]/30 bg-[#0B0E14]/80 backdrop-blur-md z-10">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
            <Building2 className="w-8 h-8 text-[#00F0FF]" />
             Gestión de Clientes
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00F0FF] rounded-full animate-pulse" />
            KAIVINCIA REVENUE OPS // AUDITORIA_CUMPLIDA
          </p>
        </div>
        <button 
          onClick={() => setIsNewClientModalOpen(true)}
          className="bg-white text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#00F0FF] hover:text-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {isNewClientModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0B0E14] rounded-3xl shadow-[0_0_50px_rgba(181,154,69,0.15)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-[#00F0FF]/30 relative"
          >
            <div className="p-6 border-b border-[#1E293B] flex justify-between items-center bg-gray-900/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#00F0FF]/10 text-[#00F0FF] rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 shadow-[0_0_10px_rgba(181,154,69,0.3)]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Registrar Nuevo Cliente</h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">Apertura de Cartera B2B // KV-SYS-REGEN</p>
                </div>
              </div>
              <button onClick={() => setIsNewClientModalOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-full border border-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="p-8 overflow-y-auto flex-1 space-y-8">
              {/* Initial Status Selector */}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Estado Inicial del Cliente</label>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { id: 'Lead', label: 'Lead', icon: Search, color: 'text-slate-400', activeColor: 'bg-slate-800/50', borderColor: 'border-slate-700' },
                    { id: 'Activo', label: 'Activo', icon: CheckCircle2, color: 'text-emerald-500', activeColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
                    { id: 'En Riesgo', label: 'Riesgo', icon: AlertTriangle, color: 'text-red-500', activeColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
                    { id: 'Pausado', label: 'Pausado', icon: Clock, color: 'text-amber-500', activeColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
                    { id: 'Finalizado', label: 'Cerrado', icon: ShieldAlert, color: 'text-purple-500', activeColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
                  ].map((s) => {
                    const isActive = newClient.status === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setNewClient({...newClient, status: s.id as Client['status']})}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                          isActive 
                            ? `${s.activeColor} ${s.borderColor} shadow-[0_0_15px_rgba(34,211,238,0.1)] ring-1 ring-[#00F0FF]/40` 
                            : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'
                        }`}
                      >
                        <s.icon className={`w-5 h-5 ${isActive ? s.color : 'text-slate-700'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                <h4 className="text-[10px] font-black text-[#00F0FF] uppercase tracking-[0.2em] border-b border-[#1E293B] pb-2">Información Corporativa</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Empresa / Razón Social</label>
                    <input 
                      type="text" 
                      value={newClient.companyName}
                      onChange={(e) => {
                        setNewClient({...newClient, companyName: e.target.value});
                        if (formErrors.companyName) setFormErrors({...formErrors, companyName: ''});
                      }}
                      placeholder="Ej. TechCorp S.A."
                      className={`w-full bg-[#12161F] rounded-xl p-3 text-sm text-white focus:border-[#00F0FF] outline-none border transition-all ${formErrors.companyName ? 'border-red-500 bg-red-900/20' : 'border-[#1E293B]'}`}
                    />
                    {formErrors.companyName && <p className="text-[10px] text-red-500 font-bold uppercase">{formErrors.companyName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">NIT / Tax ID</label>
                    <input 
                      type="text" 
                      value={newClient.taxId}
                      onChange={(e) => setNewClient({...newClient, taxId: e.target.value})}
                      placeholder="Identificación Fiscal"
                      className="w-full bg-[#12161F] border border-[#1E293B] rounded-xl p-3 text-sm text-white focus:border-[#00F0FF] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Industria / Nicho</label>
                    <input 
                      type="text" 
                      value={newClient.industry}
                      onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                      placeholder="Ej. SaaS B2B, Logística"
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
                <h4 className="text-[10px] font-black text-[#00F0FF] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Datos de Contacto</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Contacto Principal</label>
                    <input 
                      type="text" 
                      value={newClient.contactName}
                      onChange={(e) => {
                        setNewClient({...newClient, contactName: e.target.value});
                        if (formErrors.contactName) setFormErrors({...formErrors, contactName: ''});
                      }}
                      placeholder="Nombre del Stakeholder"
                      className={`w-full bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none border transition-all ${formErrors.contactName ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}
                    />
                    {formErrors.contactName && <p className="text-[10px] text-red-500 font-bold uppercase">{formErrors.contactName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Origen / Fuente</label>
                    <select 
                      value={newClient.source}
                      onChange={(e) => setNewClient({...newClient, source: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Seleccionar Origen</option>
                      <option value="LinkedIn">LinkedIn Outreach</option>
                      <option value="Referencia">Referencia / Partner</option>
                      <option value="Marketing">Marketing (Inbound)</option>
                      <option value="Cold Call">Llamada en Frío</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sitio Web</label>
                    <input 
                      type="url" 
                      value={newClient.website}
                      onChange={(e) => setNewClient({...newClient, website: e.target.value})}
                      placeholder="https://www.empresa.com"
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email de Contacto</label>
                    <input 
                      type="email" 
                      value={newClient.email}
                      onChange={(e) => {
                        setNewClient({...newClient, email: e.target.value});
                        if (formErrors.email) setFormErrors({...formErrors, email: ''});
                      }}
                      placeholder="user@domain.com"
                      className={`w-full bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none border transition-all ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}
                    />
                    {formErrors.email && <p className="text-[10px] text-red-500 font-bold uppercase">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Teléfono de Contacto</label>
                    <input 
                      type="text" 
                      value={newClient.phone}
                      placeholder="+X XXX XXX XXXX"
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      className="w-full bg-white border-gray-100 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
                <h4 className="text-[10px] font-black text-[#00F0FF] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Configuración Estratégica</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Asignar Setter / SDR</label>
                    <select 
                      value={newClient.setterId}
                      onChange={(e) => setNewClient({...newClient, setterId: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none border transition-all"
                    >
                      <option value="">Seleccionar Responsable</option>
                      <option value="s1">Carlos Mendoza</option>
                      <option value="s2">Ana Silva</option>
                      <option value="s3">Marta Torres</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Meta de ROI (%)</label>
                    <input 
                      type="number" 
                      value={newClient.roiGoal}
                      onChange={(e) => setNewClient({...newClient, roiGoal: parseInt(e.target.value)})}
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all"
                      placeholder="Ej: 300"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Ubicación Táctica (Coordenadas GPS)</label>
                    <input 
                      type="text" 
                      value={newClient.gpsLocation}
                      onChange={(e) => setNewClient({...newClient, gpsLocation: e.target.value})}
                      placeholder="Lat, Long (Opcional para servicios de campo)"
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
                <h4 className="text-[10px] font-black text-[#00F0FF] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Configuración Comercial</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Servicio Contratado</label>
                    <select 
                      value={newClient.service}
                      onChange={(e) => setNewClient({...newClient, service: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none border transition-all"
                    >
                      <option>Appointment Setting</option>
                      <option>Call Center Outbound</option>
                      <option>Consultoría de Ventas</option>
                      <option>Lead Generation</option>
                      <option>Híbrido personalizado</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Modelo de Pago</label>
                    <select 
                      value={newClient.paymentModel}
                      onChange={(e) => setNewClient({...newClient, paymentModel: e.target.value as any})}
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none border transition-all"
                    >
                      <option value="Fijo">Fijo (Recurrente)</option>
                      <option value="Cita">Por Cita (Variable ETL)</option>
                      <option value="Híbrido">Híbrido (Fijo + Variable)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Valor de Contrato (USD/mes)</label>
                    <input 
                      type="number" 
                      value={newClient.contractValue}
                      onChange={(e) => {
                        setNewClient({...newClient, contractValue: parseInt(e.target.value)});
                        if (formErrors.contractValue) setFormErrors({...formErrors, contractValue: ''});
                      }}
                      className={`w-full bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none border transition-all ${formErrors.contractValue ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}
                    />
                    {formErrors.contractValue && <p className="text-[10px] text-red-500 font-bold uppercase">{formErrors.contractValue}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Fecha Inicio</label>
                    <input 
                      type="date" 
                      value={newClient.startDate}
                      onChange={(e) => setNewClient({...newClient, startDate: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-transparent outline-none border transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Notas Internas / Briefing</label>
                <textarea 
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  rows={3}
                  placeholder="Contexto adicional sobre el cliente, retos detectados..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none transition-all placeholder:italic"
                />
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 flex justify-end items-center gap-4 bg-gray-50/50 relative z-10">
              <button 
                type="button"
                onClick={() => setIsNewClientModalOpen(false)}
                className="px-6 py-3 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-900 transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSaveClient}
                disabled={isSaving}
                className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:shadow-gray-200 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#00F0FF]" /> : <Save className="w-4 h-4 text-[#00F0FF]" />}
                Registrar Cliente
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'kpis', label: 'Dashboard KPIs', icon: BarChart3 },
            { id: 'perfil360', label: 'Perfil 360°', icon: Users },
            { id: 'proyectos', label: 'Proyectos Activos', icon: FolderKanban },
            { id: 'retencion', label: 'Retención y Escalamiento', icon: TrendingUp },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-[#00F0FF] text-[#00F0FF] bg-cyan-500/10/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          
          {/* DASHBOARD KPIS */}
          {activeTab === 'kpis' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Health Score Promedio</p>
                    <div className="flex items-end gap-3">
                       <h3 className="text-4xl font-black text-gray-900 leading-none">88%</h3>
                       <span className="text-emerald-500 font-bold text-xs mb-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +4.2</span>
                    </div>
                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-[#00F0FF] to-[#00BFFF] w-[88%] rounded-full shadow-[0_0_10px_rgba(181,154,69,0.3)]" />
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Churn Risk Velocity</p>
                    <h3 className="text-4xl font-black text-gray-900 leading-none">Low</h3>
                    <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-tighter">Stable Portfolio</p>
                 </div>
                 <div className="bg-[#0B0E14] p-6 rounded-2xl border border-[#00F0FF]/30 shadow-xl group">
                    <p className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest mb-2">Meta Global ROI</p>
                    <h3 className="text-4xl font-black text-white leading-none">320%</h3>
                    <p className="text-[10px] text-white/50 font-mono mt-2 group-hover:text-[#00F0FF] transition-colors">Targeting: Enterprise Aggressive</p>
                 </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                   <div>
                     <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Inversión vs Retorno (ROI)</h3>
                     <p className="text-xs text-gray-500">Métricas específicas por cliente - Ciclo Q1 2026</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-200" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Inversión</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#00F0FF]" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Retorno</span>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-8">
                  {clients.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-700">
                          <span>{c.companyName}</span>
                          <span className="text-[#00F0FF]">ROI: {((c.contractValue * 3.5) / (c.contractValue || 1) * 100).toFixed(0)}%</span>
                       </div>
                       <div className="flex gap-px h-6 rounded-lg overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: '25%' }}
                            className="bg-gray-100 border-r border-white" 
                          />
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: '75%' }}
                            className="bg-gradient-to-r from-[#00F0FF] to-[#00BFFF]" 
                          />
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROYECTOS ACTIVOS */}
          {activeTab === 'proyectos' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#0B0E14] p-8 rounded-3xl border border-[#00F0FF]/30 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Target className="w-40 h-40 text-white" />
                   </div>
                   <div className="relative z-10">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Control de Pulsión Global</h3>
                      <p className="text-xs text-[#00F0FF] font-mono mt-1">Sincronización en tiempo real con el Nervous System</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {clientProjects.map(project => (
                     <div key={project.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                           <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:bg-[#00F0FF]/10">
                              <LayoutDashboard className="w-5 h-5 text-[#00F0FF]" />
                           </div>
                           <select 
                             value={project.status}
                             onChange={async (e) => {
                               try {
                                  await updateDoc(doc(db, 'projects', project.id), { 
                                     status: e.target.value,
                                     updatedAt: serverTimestamp() 
                                  });
                                  // Update Global Pulse
                                  await addDoc(collection(db, 'system_events'), {
                                     type: 'PULSE_UPDATE',
                                     message: `Proyecto "${project.name}" actualizado a ${e.target.value} por el Gestor.`,
                                     timestamp: serverTimestamp()
                                  });
                               } catch (err) {
                                  handleFirestoreError(err, OperationType.UPDATE, 'projects');
                               }
                             }}
                             className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border outline-none cursor-pointer ${
                               project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                               project.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                               'bg-gray-50 text-gray-600 border-gray-200'
                             }`}
                           >
                              <option value="Active">Activo</option>
                              <option value="Paused">Pausado</option>
                              <option value="Completed">Completado</option>
                           </select>
                        </div>
                        <h4 className="font-black text-gray-900 uppercase tracking-tighter text-sm mb-1">{project.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{project.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">Progreso AI</span>
                           <span className="text-xs font-mono font-bold text-gray-900">{project.progress || 0}%</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* PERFIL 360 */}
          {activeTab === 'perfil360' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Client List (Sidebar) */}
              <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="text" 
                          placeholder="Buscar cliente (Ej: TechCorp)..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white text-gray-900"
                        />
                      </div>
                    <button 
                      onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                      className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:text-gray-900 transition-colors bg-white relative"
                    >
                      <Filter className="w-5 h-5" />
                      {(filterStatus !== 'Todos' || filterService !== 'Todos') && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00F0FF] rounded-full border border-white"></span>
                      )}
                    </button>
                  </div>
                  {isFilterMenuOpen && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-3">
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Estado</label>
                         <select 
                           value={filterStatus}
                           onChange={(e) => setFilterStatus(e.target.value)}
                           className="w-full text-xs p-1.5 rounded-md border border-gray-200 outline-none"
                         >
                            <option value="Todos">Todos</option>
                            <option value="Activo">Activo</option>
                            <option value="En Riesgo">En Riesgo</option>
                            <option value="Pausado">Pausado</option>
                            <option value="Finalizado">Finalizado</option>
                            <option value="Lead">Lead</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Servicio</label>
                         <select 
                           value={filterService}
                           onChange={(e) => setFilterService(e.target.value)}
                           className="w-full text-xs p-1.5 rounded-md border border-gray-200 outline-none"
                         >
                            <option value="Todos">Todos</option>
                            <option value="Appointment Setting">Appointment Setting</option>
                            <option value="Call Center Outbound">Call Center Outbound</option>
                            <option value="Consultoría de Ventas">Consultoría de Ventas</option>
                            <option value="Lead Generation">Lead Generation</option>
                            <option value="Híbrido personalizado">Híbrido personalizado</option>
                         </select>
                       </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border shadow-sm ${
                        selectedClientId === client.id ? 'bg-[#00F0FF]/5 border-[#00F0FF] ring-2 ring-[#00F0FF]/10' : 'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
                         <Building2 className={`w-5 h-5 ${selectedClientId === client.id ? 'text-[#00F0FF]' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-xs uppercase tracking-tight truncate">{client.companyName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${client.healthScore > 70 ? 'bg-emerald-500' : client.healthScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${client.healthScore}%` }}
                              />
                           </div>
                           <span className="text-[9px] font-mono text-gray-500">{client.healthScore}%</span>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${client.status === 'Activo' ? 'bg-green-500 animate-pulse' : client.status === 'En Riesgo' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Details (Main) */}
              <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-y-auto">
                {!selectedClient ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <Building2 className="w-16 h-16 text-gray-100 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Selecciona un cliente para ver su perfil</p>
                  </div>
                ) : (
                  <>
                    <div className="p-8 border-b border-gray-200">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-5">
                          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200 shadow-sm transition-transform hover:scale-105">
                            <Building2 className="w-10 h-10 text-[#00F0FF]" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{selectedClient.companyName}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /> {selectedClient.contactName}</span>
                              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {selectedClient.phone}</span>
                              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> {selectedClient.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border ${
                            selectedClient.status === 'Activo' ? 'bg-green-50 text-green-700 border-green-200' : 
                            selectedClient.status === 'En Riesgo' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {selectedClient.status}
                          </span>
                          <button 
                            onClick={() => setIsChatModalOpen(true)}
                            className="flex items-center gap-2 bg-[#00F0FF]/10 text-[#00E5F2] hover:bg-[#00F0FF]/20 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-[#00F0FF]/30"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Chatear con Cliente
                          </button>
                        </div>
                      </div>

                      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto hide-scrollbar">
                        <button 
                          onClick={() => setSubTab360('info')}
                          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${subTab360 === 'info' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                          Visión General
                        </button>
                        <button 
                          onClick={() => setSubTab360('comms')}
                          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${subTab360 === 'comms' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                          Comunicaciones
                        </button>
                        <button 
                          onClick={() => setSubTab360('interactions')}
                          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${subTab360 === 'interactions' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                          Interacciones
                        </button>
                        <button 
                          onClick={() => setSubTab360('tasks')}
                          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${subTab360 === 'tasks' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                          Tareas Activas
                        </button>
                        <button 
                          onClick={() => setSubTab360('projects')}
                          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${subTab360 === 'projects' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                          Progreso
                        </button>
                        <button 
                          onClick={() => setSubTab360('time_logs')}
                          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${subTab360 === 'time_logs' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                          Tiempo
                        </button>
                      </div>

                      {subTab360 === 'info' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                              <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-[0.15em]">Servicio</p>
                              <p className="font-bold text-gray-900 text-sm">{selectedClient.service || 'Appointment Setting'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                              <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-[0.15em]">Meta ROI</p>
                              <p className="font-bold text-[#00F0FF] text-sm">{selectedClient.roiGoal || '0'}% Target</p>
                            </div>
                            <div className={`p-4 rounded-xl border shadow-sm ${
                              calculatedHealthScore >= 80 ? 'bg-green-50 border-green-200' :
                              calculatedHealthScore >= 50 ? 'bg-amber-50 border-amber-200' :
                              'bg-red-50 border-red-200'
                            }`}>
                              <p className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-[0.15em]">Health Score</p>
                              <div className="flex items-end gap-2">
                                <p className={`font-bold text-2xl leading-none ${
                                  calculatedHealthScore >= 80 ? 'text-green-600' :
                                  calculatedHealthScore >= 50 ? 'text-amber-600' :
                                  'text-red-600'
                                }`}>
                                  {calculatedHealthScore}/100
                                </p>
                              </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                              <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-[0.15em]">Modelo Pago</p>
                              <p className="font-bold text-gray-900 text-sm">{selectedClient.paymentModel}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                              <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-[0.15em]">MRR Contrato</p>
                              <p className="font-bold text-emerald-600 text-sm flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/> ${selectedClient.contractValue?.toLocaleString() || '0'}</p>
                            </div>
                          </div>

                          {/* 360° Timeline Feed */}
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                              <Activity className="w-4 h-4 text-[#00F0FF]" /> Timeline de Eventos 360°
                            </h4>
                            <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                               <div className="relative">
                                  <div className="absolute -left-8 top-1 w-6 h-6 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center">
                                     <MapPin className="w-3 h-3 text-emerald-600" />
                                  </div>
                                  <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                     <p className="text-[10px] font-mono text-gray-400 mb-1">HOY - 09:30 AM</p>
                                     <p className="text-xs text-gray-700 font-bold">Visita Táctica Realizada</p>
                                     <p className="text-[10px] text-gray-500 mt-0.5">El agente Ana S. completó el check-in GPS en la sede central.</p>
                                  </div>
                               </div>
                               <div className="relative">
                                  <div className="absolute -left-8 top-1 w-6 h-6 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center">
                                     <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                     <p className="text-[10px] font-mono text-gray-400 mb-1">AYER - 04:15 PM</p>
                                     <p className="text-xs text-gray-700 font-bold">Ticket Resuelto (TKT-003)</p>
                                     <p className="text-[10px] text-gray-500 mt-0.5">Ajuste de integración de API completado satisfactoriamente.</p>
                                  </div>
                               </div>
                               <div className="relative">
                                  <div className="absolute -left-8 top-1 w-6 h-6 bg-purple-100 border border-purple-200 rounded-full flex items-center justify-center">
                                     <Zap className="w-3 h-3 text-purple-600" />
                                  </div>
                                  <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                     <p className="text-[10px] font-mono text-gray-400 mb-1">2 DÍAS ATRÁS</p>
                                     <p className="text-xs text-gray-700 font-bold">Health Score inicial generado</p>
                                     <p className="text-[10px] text-gray-500 mt-0.5">Sistema Nervioso detectó alta afinidad estratégica al 100%.</p>
                                  </div>
                               </div>
                            </div>
                          </div>

                          {selectedClient.status === 'En Riesgo' && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 animate-pulse">
                              <ShieldAlert className="w-6 h-6 text-red-500" />
                              <div>
                                <p className="font-bold text-red-500 uppercase tracking-tighter">ALERTA DE RETENCIÓN</p>
                                <p className="text-[10px] text-red-400 font-mono">Este cliente ha bajado su actividad en el radar. Requiere intervención inmediata.</p>
                              </div>
                              <button 
                                onClick={() => handleUpsell(selectedClient.id)}
                                className="ml-auto bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
                              >
                                Recuperar Cuenta
                              </button>
                            </div>
                          )}

                          <div className="mt-8">
                            <h4 className="text-[10px] font-black text-slate-500 mb-4 tracking-widest uppercase">Acciones del Gestor</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <button 
                                onClick={() => setIsContractScannerOpen(true)}
                                className="px-4 py-3 bg-[#12161F] border border-[#1E293B] rounded-2xl text-[10px] font-black text-slate-300 hover:bg-slate-800 hover:border-[#00F0FF] transition-all flex items-center gap-3 group uppercase tracking-widest shadow-sm"
                              >
                                <div className="h-8 w-8 bg-black/40 rounded-xl flex items-center justify-center group-hover:bg-[#00F0FF]/10 transition-colors">
                                  <FileText className="w-4 h-4 text-[#00F0FF]" />
                                </div>
                                Ver Contratos
                              </button>
                              <button 
                                onClick={() => setSubTab360('projects')}
                                className="px-4 py-3 bg-[#12161F] border border-[#1E293B] rounded-2xl text-[10px] font-black text-slate-300 hover:bg-slate-800 hover:border-[#00F0FF] transition-all flex items-center gap-3 group uppercase tracking-widest shadow-sm"
                              >
                                <div className="h-8 w-8 bg-black/40 rounded-xl flex items-center justify-center group-hover:bg-[#00F0FF]/10 transition-colors">
                                  <FolderKanban className="w-4 h-4 text-[#00F0FF]" />
                                </div>
                                Ver Proyectos
                              </button>
                              <button 
                                onClick={() => setIsChatModalOpen(true)}
                                className="px-4 py-3 bg-[#12161F] border border-[#1E293B] rounded-2xl text-[10px] font-black text-slate-300 hover:bg-slate-800 hover:border-[#00F0FF] transition-all flex items-center gap-3 group uppercase tracking-widest shadow-sm"
                              >
                                <div className="h-8 w-8 bg-black/40 rounded-xl flex items-center justify-center group-hover:bg-[#00F0FF]/10 transition-colors">
                                  <MessageCircle className="w-4 h-4 text-[#00F0FF]" />
                                </div>
                                Chat Interno
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {subTab360 === 'projects' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Pipeline de Proyectos del Cliente</h4>
                            <button className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest hover:underline">Nuevo Registro +</button>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {[
                              { name: 'Onboarding Inicial', status: 'Completo', progress: 100 },
                              { name: 'Setup de CRM & Voip', status: 'En Proceso', progress: 75 },
                              { name: 'Campaña Outbound Q2', status: 'En Proceso', progress: 30 },
                            ].map((p, i) => (
                              <div key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                                    <FolderKanban className={`w-5 h-5 ${p.status === 'Completo' ? 'text-green-500' : 'text-[#00F0FF]'}`} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-gray-900 uppercase">{p.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{p.status}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-gray-900 mb-1">{p.progress}%</p>
                                  <div className="w-24 bg-gray-200 h-1 rounded-full overflow-hidden">
                                    <div className={`h-full ${p.status === 'Completo' ? 'bg-green-500' : 'bg-[#00F0FF]'}`} style={{ width: `${p.progress}%` }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {subTab360 === 'comms' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Historial de Comunicaciones</h4>
                            <button className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest hover:underline">Registrar Llamada +</button>
                          </div>
                          <div className="space-y-3">
                            {[
                              { type: 'Reunión', date: '2026-04-20', subject: 'Revisión mensual de resultados', author: 'Ana Gómez', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                              { type: 'Llamada', date: '2026-04-15', subject: 'Discusión sobre escalamiento de campaña', author: 'Carlos Ruiz', icon: Phone, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                              { type: 'Email', date: '2026-04-10', subject: 'Envío de facturación correspondiente', author: 'Sistema', icon: Mail, color: 'text-[#00F0FF]', bg: 'bg-[#00F0FF]/10' },
                            ].map((c, i) => (
                              <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4 items-start shadow-sm">
                                <div className={`p-2 rounded-lg ${c.bg} shrink-0`}>
                                  <c.icon className={`w-5 h-5 ${c.color}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <p className="text-sm font-bold text-gray-900">{c.subject}</p>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.date}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Por: <span className="font-medium text-gray-700">{c.author}</span></p>
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{c.type}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {subTab360 === 'tasks' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tareas Activas</h4>
                            <button className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest hover:underline">Nueva Tarea +</button>
                          </div>
                          <div className="space-y-3">
                            {[
                              { title: 'Preparar reporte de alcance Q1', status: 'Pendiente', priority: 'Media', dueDate: 'Mañana' },
                              { title: 'Agendar reunión de seguimiento técnico', status: 'En Progreso', priority: 'Alta', dueDate: 'Hoy' },
                              { title: 'Revisión de plantilla de correos', status: 'Completada', priority: 'Baja', dueDate: 'Hace 2 días' },
                            ].map((t, i) => (
                              <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${t.status === 'Completada' ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${t.status === 'Completada' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                                    {t.status === 'Completada' && <CheckCircle2 className="w-3 h-3" />}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-bold ${t.status === 'Completada' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{t.title}</p>
                                    <p className="text-[10px] mt-0.5 uppercase font-bold text-gray-400">Vence: {t.dueDate}</p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${
                                  t.priority === 'Alta' ? 'bg-red-50 text-red-600' :
                                  t.priority === 'Media' ? 'bg-cyan-500/10 text-yellow-600' :
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                  {t.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {subTab360 === 'interactions' && (
                        <div className="space-y-6">
                           <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Nueva Interacción</h4>
                                <button onClick={handleQuickFollowUp} className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest hover:underline">+ Quick Follow-up</button>
                              </div>
                              <form onSubmit={handleAddInteraction} className="flex gap-4">
                                 <select name="type" className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none w-1/4">
                                    <option value="Llamada">Llamada</option>
                                    <option value="Reunión">Reunión presencial</option>
                                    <option value="Email">Email</option>
                                    <option value="Nota Interna">Nota interna</option>
                                    <option value="Follow-up">Follow-up</option>
                                 </select>
                                 <input name="note" type="text" placeholder="Ej. El cliente solicita más capacidad de leads para Q3..." className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none flex-1 focus:ring-2 focus:ring-[#00F0FF]" />
                                 <button type="submit" className="bg-gray-900 text-white rounded-xl px-6 font-black uppercase text-xs tracking-widest hover:bg-black transition-colors">Guardar</button>
                              </form>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Historial Cronológico</h4>
                              {clientInteractions.map((interact, i) => (
                                 <div key={i} className="bg-white border border-gray-100 p-4 rounded-xl flex gap-4">
                                    <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{interact.type}</span>
                                          <span className="text-[10px] text-gray-400 font-bold">{new Date(interact.timestamp).toLocaleString()}</span>
                                       </div>
                                       <p className="text-sm font-medium text-gray-800">{interact.note}</p>
                                       <p className="text-[10px] text-gray-400 mt-2">Por: {interact.assignedUser}</p>
                                    </div>
                                 </div>
                              ))}
                              {clientInteractions.length === 0 && (
                                <p className="text-gray-400 text-xs italic">No hay interacciones registradas aún.</p>
                              )}
                           </div>
                        </div>
                      )}

                      {subTab360 === 'time_logs' && (
                        <div className="space-y-6">
                           <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Registrar Tiempo</h4>
                              <form onSubmit={handleAddTimeLog} className="flex gap-4">
                                 <input name="hours" type="number" step="0.25" placeholder="Horas (ej. 1.5)" className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none w-1/4 focus:ring-2 focus:ring-[#00F0FF]" />
                                 <input name="description" type="text" placeholder="Descripción de la tarea ejecutada..." className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none flex-1 focus:ring-2 focus:ring-[#00F0FF]" />
                                 <button type="submit" className="bg-gray-900 text-white rounded-xl px-6 font-black uppercase text-xs tracking-widest hover:bg-black transition-colors">Registrar</button>
                              </form>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Registros</h4>
                              {clientTimeLogs.map((log, i) => (
                                 <div key={i} className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                       <p className="text-sm font-medium text-gray-800">{log.description}</p>
                                       <p className="text-[10px] text-gray-400 mt-1">Por: {log.userName} | Fecha: {log.date}</p>
                                    </div>
                                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                       <span className="text-xs font-black text-gray-900">{log.hours} h</span>
                                    </div>
                                 </div>
                              ))}
                              {clientTimeLogs.length === 0 && (
                                <p className="text-gray-400 text-xs italic">No hay registros de tiempo aún.</p>
                              )}
                           </div>
                        </div>
                      )}
                    </div>

                  </>
                )}
              </div>
            </div>
          )}

          {/* PROYECTOS ACTIVOS */}
          {activeTab === 'proyectos' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-full flex flex-col overflow-hidden">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Gestión de Proyectos Operativos</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Visualización de Entregables y Roadmap</p>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => setProjectViewMode('list')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${projectViewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <LayoutList className="w-4 h-4" /> Detalle
                    </button>
                    <button 
                      onClick={() => setProjectViewMode('kanban')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${projectViewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Tablero
                    </button>
                  </div>
               </div>

               {!selectedClient ? (
                <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest">
                  Selecciona un cliente para ver sus proyectos
                </div>
               ) : projectViewMode === 'list' ? (
                 <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {clientProjects.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-100 italic text-gray-400">
                        No hay proyectos registrados para este cliente.
                      </div>
                    ) : clientProjects.map((p, i) => (
                      <div key={p.id || i} className="group p-5 bg-gray-50 border border-gray-100 rounded-[2rem] hover:bg-white hover:shadow-xl hover:border-[#00F0FF]/20 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm ${p.status === 'Finalizado' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-white border-gray-100 text-[#00F0FF]'}`}>
                            <FolderKanban className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{p.name}</h4>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                p.status === 'En riesgo' ? 'bg-red-100 text-red-600' : 
                                p.status === 'En ejecución' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                              }`}>{p.status}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedClient.companyName} • {p.description || 'Hito Operativo'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-xs font-black text-gray-900 mb-1">{p.progress || 0}%</p>
                            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${p.status === 'Finalizado' ? 'bg-green-500' : 'bg-[#00F0FF]'}`} style={{ width: `${p.progress || 0}%` }}></div>
                            </div>
                          </div>
                          <button className="bg-white border border-gray-200 p-2 rounded-xl text-gray-400 group-hover:text-gray-900 hover:border-gray-900 transition-all">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex gap-6 h-full min-w-[1200px]">
                      {['Planificación', 'En ejecución', 'En riesgo', 'Finalizado'].map((status) => {
                        const projectsInStatus = clientProjects.filter(p => p.status === status);
                        return (
                          <div 
                            key={status} 
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(status)}
                            className={`flex-1 min-w-[280px] bg-gray-50/50 rounded-[2.5rem] p-5 flex flex-col border transition-all ${
                              draggedProject ? 'border-dashed border-[#00F0FF]/20 bg-cyan-500/10/30' : 'border-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-6 px-2">
                               <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${
                                   status === 'Planificación' ? 'bg-blue-400' : 
                                   status === 'En ejecución' ? 'bg-[#00F0FF]' : 
                                   status === 'Finalizado' ? 'bg-green-500' : 'bg-red-500'
                                 }`} />
                                 <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{status}</h4>
                               </div>
                               <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                                 {projectsInStatus.length}
                               </span>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto pr-1 flex flex-col custom-scrollbar">
                               {projectsInStatus.map((p) => (
                                 <div 
                                   key={p.id}
                                   draggable
                                   onDragStart={() => handleDragStart(p)}
                                   className={`bg-white p-5 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-[#00F0FF]/20 transition-all cursor-grab active:cursor-grabbing group select-none relative ${
                                     draggedProject?.id === p.id ? 'opacity-40 grayscale scale-95' : 'opacity-100'
                                   }`}
                                 >
                                   <div className="flex justify-between items-start mb-3">
                                      <div className="flex flex-col gap-1">
                                         <span className="text-[8px] font-black text-[#00F0FF] uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded-md self-start">PROYECTO</span>
                                         <h5 className="text-[11px] font-black text-gray-900 uppercase leading-tight pr-4">{p.name}</h5>
                                      </div>
                                      <FolderKanban className="w-3.5 h-3.5 text-gray-200 group-hover:text-[#00F0FF] transition-colors shrink-0" />
                                   </div>
                                   
                                   <div className="space-y-2">
                                      <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
                                         <span>Progreso</span>
                                         <span className="text-gray-900">{p.progress || 0}%</span>
                                      </div>
                                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                         <div 
                                           className={`h-full transition-all duration-700 ${status === 'Finalizado' ? 'bg-green-500' : 'bg-[#00F0FF]'}`}
                                           style={{ width: `${p.progress || 0}%` }}
                                         />
                                      </div>
                                   </div>

                                   {p.description && (
                                     <p className="mt-4 text-[10px] text-gray-400 line-clamp-2 leading-relaxed italic border-t border-gray-50 pt-2 group-hover:text-gray-600 transition-colors">
                                       "{p.description}"
                                     </p>
                                   )}

                                   <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase">
                                         <Clock className="w-3 h-3" /> {p.endDate || 'Planificado'}
                                      </div>
                                      <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-all">
                                         <ArrowRight className="w-3 h-3" />
                                      </button>
                                   </div>
                                 </div>
                               ))}
                               {projectsInStatus.length === 0 && !draggedProject && (
                                 <div className="flex-1 flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white/30 group hover:bg-white/50 transition-all">
                                    <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                       <Plus className="w-4 h-4 text-gray-300" />
                                    </div>
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Soltar aquí</p>
                                 </div>
                               )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* RETENCIÓN Y ESCALAMIENTO */}
          {activeTab === 'retencion' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
                <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tighter uppercase flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-[#00F0FF]" /> Inteligencia de Crecimiento
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clients.map(client => (
                    <div key={client.id} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col justify-between group ${
                      client.healthScore < 50 ? 'bg-red-50 border-red-100 hover:bg-red-100' : 'bg-white border-gray-50 hover:border-[#00F0FF]'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                            client.healthScore < 50 ? 'bg-white text-red-600' : 'bg-gray-900 text-white'
                          }`}>
                            {client.healthScore}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">{client.companyName}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Engagement Radar</p>
                          </div>
                        </div>
                        {client.healthScore < 50 && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100/50">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                          client.healthScore < 50 ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {client.healthScore < 50 ? 'Intervención Requerida' : 'Estable'}
                        </span>
                        <button 
                          onClick={() => handleUpsell(client.id)}
                          className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all flex items-center gap-2 group-hover:bg-[#00F0FF]"
                        >
                          Upsell <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                  <TrendingUp className="w-48 h-48" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase">Oportunidades de Escalamiento</h3>
                  <p className="text-gray-400 font-medium text-sm leading-relaxed mb-8">
                    Nuestro motor de IA analiza patrones de consumo y éxito académico para detectar clientes listos para escalar a servicios de Agencia Premium o consultorías estratégicas personalizadas.
                  </p>
                  <button className="bg-[#00F0FF] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#00BFFF] transition-all flex items-center gap-3 shadow-xl hover:shadow-yellow-100">
                    Ejecutar Análisis Predictivo <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTRACT SCANNER MODAL */}
          {isContractScannerOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                   <div className="flex items-center gap-4">
                     <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-[#00F0FF]" />
                     </div>
                     <div>
                       <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Expediente Legal</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Contratos y Anexos</p>
                     </div>
                   </div>
                   <button onClick={() => setIsContractScannerOpen(false)} className="bg-white border border-gray-200 p-2 rounded-xl text-gray-400 hover:text-gray-900">
                     <X className="w-5 h-5" />
                   </button>
                </div>
                <div className="p-8 space-y-4">
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Buscar contrato por ID o fecha..." 
                      className="w-full bg-gray-50 border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium outline-none border focus:border-[#00F0FF] transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Contrato Maestro B2B', date: '15 Jan 2026', size: '2.4 MB' },
                      { name: 'Anexo de Privacidad & Datos', date: '16 Jan 2026', size: '1.1 MB' },
                      { name: 'Propuesta Económica Firmada', date: '20 Feb 2026', size: '4.5 MB' }
                    ].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                            <FileText className="w-5 h-5 text-gray-400 group-hover:text-[#00F0FF]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{doc.name}</p>
                            <p className="text-[10px] text-gray-400">{doc.date} • {doc.size}</p>
                          </div>
                        </div>
                        <button className="bg-white p-2 rounded-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                  <button className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Subir Nuevo</button>
                  <button className="flex-1 bg-white border border-gray-200 text-gray-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all">Firmar Digital</button>
                </div>
              </div>
            </div>
          )}

          {/* CHAT INTERNO MODAL */}
          {isChatModalOpen && selectedClient && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-[#00F0FF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Chat Interno: {selectedClient.companyName}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Canal Privado de Seguimiento</p>
                    </div>
                  </div>
                  <button onClick={() => setIsChatModalOpen(false)} className="bg-white border border-gray-200 p-2 rounded-xl text-gray-400 hover:text-gray-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <iframe 
                    src={`/crm/chat?clientId=${selectedClient.id}&clientName=${encodeURIComponent(selectedClient.companyName)}&embedded=true`} 
                    className="w-full h-full border-none"
                    title="Chat Interno"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
