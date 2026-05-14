import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Mail, Upload, FileSpreadsheet, AlertCircle, 
  CheckCircle2, Plus, X, Building2, Phone, Globe, User,
  MessageSquare, FileText, ArrowLeft, Send, Download, ExternalLink,
  Shield, CreditCard, Zap, Settings, Briefcase, TrendingUp, GraduationCap,
  ArrowUpRight, Sparkles, DollarSign, Target, Receipt, Loader2, Activity,
  CheckSquare, Calendar, PlayCircle, Circle, LayoutGrid, ListTodo, History,
  ChevronRight, ArrowRight, PieChart, Clock, BarChart2, ShieldCheck, BrainCircuit
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';

interface UpsellOpportunity {
  id: string;
  name: string;
  clientName: string;
  service: string;
  email: string;
  source: 'Academia' | 'Cliente Actual';
  reason: string;
  potentialValue: string;
  originalData: any;
}

export default function Clients() {
  const [activeMainTab, setActiveMainTab] = useState<'list' | 'upsell'>('list');
  const [clients, setClients] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [upsellOpportunities, setUpsellOpportunities] = useState<UpsellOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    sector: 'Tecnología',
    status: 'Activo',
    billingModel: 'Fijo', // Fijo, Cita, Híbrido
    contractValue: 0,
    healthScore: 100,
    assignedManagerId: '',
    billingRules: {
      baseAmount: 0,
      appointmentRate: 0,
      milestoneBonus: 0
    }
  });

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // Tasks State
  const [clientTasks, setClientTasks] = useState<any[]>([]);
  const [newClientTask, setNewClientTask] = useState({ title: '', assignee: '', dueDate: '' });

  // Visitas State
  const [clientVisits, setClientVisits] = useState<any[]>([]);
  const [newVisit, setNewVisit] = useState({ 
    outcome: 'Seguimiento', 
    notes: '', 
    photoUrl: '', 
    location: null as any 
  });
  const [isRegisteringVisit, setIsRegisteringVisit] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeProfileTab, setActiveProfileTab] = useState<'360' | 'info' | 'chat' | 'tasks' | 'visitas' | 'contract' | 'billing'>('360');
  const [clientIntel, setClientIntel] = useState<{
    ltv: number;
    pendingInvoices: number;
    paymentHistory: any[];
    projects: any[];
    academyStats: { progress: number; topTalent: string };
    sentiment: 'Positive' | 'Neutral' | 'Critical';
  }>({
    ltv: 0,
    pendingInvoices: 0,
    paymentHistory: [],
    projects: [],
    academyStats: { progress: 0, topTalent: 'N/A' },
    sentiment: 'Positive'
  });

  useEffect(() => {
    if (!selectedClient || activeProfileTab !== '360') return;

    const fetchIntel = async () => {
      try {
        // 1. Finance Data
        const invoicesSnap = await getDocs(query(collection(db, 'invoices'), where('clientId', '==', selectedClient.id)));
        const invoices = invoicesSnap.docs.map(d => d.data());
        const ltv = invoices.filter(inv => inv.status === 'Pagada').reduce((acc, inv) => acc + (inv.amount || 0), 0);
        const pending = invoices.filter(inv => inv.status === 'Pendiente').length;
        const history = invoices.slice(-5).map(inv => ({ 
          month: new Date(inv.date || new Date()).toLocaleString('default', { month: 'short' }), 
          amount: inv.amount 
        }));

        // 2. Projects Data
        const projectsSnap = await getDocs(query(collection(db, 'projects'), where('clientId', '==', selectedClient.id)));
        const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 3. Academy Stats (Mocking logic for now based on users with same domain or company)
        const employeesSnap = await getDocs(query(collection(db, 'users'), where('company', '==', selectedClient.company || selectedClient.name)));
        const employees = employeesSnap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string, name: string }));
        
        let totalProgress = 0;
        let topTalent = 'N/A';
        let maxProg = -1;

        if (employees.length > 0) {
          const academySnap = await getDocs(collection(db, 'academic_progress'));
          const academyMap = new Map(academySnap.docs.map(d => [d.data().userId, d.data().progressPercentage]));
          
          employees.forEach(emp => {
            const prog = academyMap.get(emp.id) || 0;
            totalProgress += prog;
            if (prog > maxProg) {
              maxProg = prog;
              topTalent = emp.name;
            }
          });
          totalProgress = totalProgress / employees.length;
        }

        setClientIntel({
          ltv,
          pendingInvoices: pending,
          paymentHistory: history,
          projects,
          academyStats: { progress: totalProgress, topTalent },
          sentiment: (selectedClient.healthScore || 85) > 80 ? 'Positive' : (selectedClient.healthScore || 85) > 60 ? 'Neutral' : 'Critical'
        });
      } catch (error) {
        console.error("Error fetching client intel:", error);
      }
    };

    fetchIntel();
  }, [selectedClient, activeProfileTab]);

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'clients'));

    const unsubCollabs = onSnapshot(collection(db, 'collaborators'), (snapshot) => {
      setCollaborators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProspects = onSnapshot(collection(db, 'prospects'), (snapshot) => {
      setProspects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubCollabs();
      unsubProspects();
    };
  }, []);

  useEffect(() => {
    // Logic to detect Upsell Opportunities
    const detectUpsells = async () => {
      try {
        const opportunities: UpsellOpportunity[] = [];

        // 1. Detect from Academic Progress (Students who finished)
        const academicSnap = await getDocs(collection(db, 'academic_progress'));
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersMap = new Map(usersSnap.docs.map(d => [d.id, d.data()]));

        academicSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.progressPercentage >= 100 || data.isCertified) {
            const user = usersMap.get(data.userId);
            if (user) {
              opportunities.push({
                id: `acad-${doc.id}`,
                name: user.name,
                clientName: user.name,
                service: 'Servicios B2B Pro',
                email: user.email,
                source: 'Academia',
                reason: 'Certificado completado. Listo para escalar a servicios B2B.',
                potentialValue: '$500 - $1,500 / mes',
                originalData: { ...user, ...data }
              });
            }
          }
        });

        // 2. Detect from Current Clients (High Health Score)
        clients.forEach(client => {
          if (client.healthScore > 90 && client.billingModel === 'Fijo') {
            opportunities.push({
              id: `client-${client.id}`,
              name: client.name,
              clientName: client.company || client.name,
              service: 'Escalamiento Variable',
              email: client.email,
              source: 'Cliente Actual',
              reason: 'Excelente salud de cuenta. Potencial para escalar a Modelo Híbrido/Variable.',
              potentialValue: '+$2,000 variable',
              originalData: client
            });
          }
        });

        setUpsellOpportunities(opportunities);
      } catch (error) {
        console.error("Error detecting upsells:", error);
      }
    };

    if (!loading) {
      detectUpsells();
    }
  }, [loading, clients]);

  const handleEscalate = (opp: UpsellOpportunity) => {
    setNewClient({
      ...newClient,
      name: opp.name,
      email: opp.email,
      company: opp.originalData.company || '',
      phone: opp.originalData.phone || '',
      status: 'Prospecto',
      billingModel: opp.source === 'Academia' ? 'Fijo' : 'Híbrido'
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!selectedClient) return;

    let unsubChat = () => {};
    let unsubTasks = () => {};
    let unsubVisits = () => {};

    if (activeProfileTab === 'chat') {
      const q = query(collection(db, `clients/${selectedClient.id}/messages`), orderBy('timestamp', 'asc'));
      unsubChat = onSnapshot(q, (snapshot) => {
        setChatHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    if (activeProfileTab === 'tasks') {
      const q = query(collection(db, `clients/${selectedClient.id}/tasks`), orderBy('createdAt', 'desc'));
      unsubTasks = onSnapshot(q, (snapshot) => {
        setClientTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    if (activeProfileTab === 'visitas') {
      const q = query(collection(db, `clients/${selectedClient.id}/visits`), orderBy('timestamp', 'desc'));
      unsubVisits = onSnapshot(q, (snapshot) => {
        setClientVisits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubChat();
      unsubTasks();
      unsubVisits();
    };
  }, [selectedClient, activeProfileTab]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'clients'), {
        ...newClient,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewClient({
        name: '',
        company: '',
        email: '',
        phone: '',
        website: '',
        sector: 'Tecnología',
        status: 'Activo',
        billingModel: 'Fijo',
        contractValue: 0,
        healthScore: 100,
        assignedManagerId: '',
        billingRules: {
          baseAmount: 0,
          appointmentRate: 0,
          milestoneBonus: 0
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedClient) return;

    try {
      await addDoc(collection(db, `clients/${selectedClient.id}/messages`), {
        text: chatMessage,
        sender: auth.currentUser?.email || 'Kaivincia Admin',
        timestamp: new Date().toISOString()
      });
      setChatMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientTask.title.trim() || !selectedClient) return;

    try {
      await addDoc(collection(db, `clients/${selectedClient.id}/tasks`), {
        ...newClientTask,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setNewClientTask({ title: '', assignee: '', dueDate: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    if (!selectedClient) return;
    
    let newStatus = 'pending';
    if (currentStatus === 'pending') newStatus = 'in-progress';
    else if (currentStatus === 'in-progress') newStatus = 'completed';
    else if (currentStatus === 'completed') newStatus = 'pending';

    try {
      await updateDoc(doc(db, `clients/${selectedClient.id}/tasks`, taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'tasks');
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada por tu navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewVisit(prev => ({
          ...prev,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        }));
      },
      (err) => {
        console.error("Error Obteniendo Ubicación:", err);
        alert("No se pudo obtener la ubicación. Por favor acepta los permisos.");
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVisit(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      await addDoc(collection(db, `clients/${selectedClient.id}/visits`), {
        ...newVisit,
        timestamp: new Date().toISOString(),
        registeredBy: auth.currentUser?.email || 'Funcionario Interno'
      });
      
      // Update pipeline stage logic
      if (newVisit.outcome === 'Venta Concluida') {
        await updateDoc(doc(db, 'clients', selectedClient.id), {
          pipelineStage: 'Cerrado Ganado',
          status: 'Activo'
        });
      } else if (newVisit.outcome === 'Venta Rechazada') {
        await updateDoc(doc(db, 'clients', selectedClient.id), {
          pipelineStage: 'Cerrado Perdido',
          status: 'Lead Perdido'
        });
      }

      setIsRegisteringVisit(false);
      setNewVisit({ outcome: 'Seguimiento', notes: '', photoUrl: '', location: null });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'visits');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ type: 'loading', message: 'Analizando patrones...' });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error("El archivo está vacío o no tiene cabeceras.");
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1).map((row, index) => {
        const obj: any = { _id: index };
        headers.forEach((header: string, i: number) => {
          obj[header] = row[i];
        });
        return obj;
      });

      // Fuzzy Mapping Logic
      const mapping: Record<string, string> = {};
      const targetColumns = ['name', 'company', 'email', 'phone', 'sector'];
      
      headers.forEach((h: string) => {
        const header = h.toLowerCase();
        if (header.includes('nombre') || header.includes('name')) mapping[h] = 'name';
        else if (header.includes('empresa') || header.includes('company') || header.includes('business')) mapping[h] = 'company';
        else if (header.includes('email') || header.includes('correo')) mapping[h] = 'email';
        else if (header.includes('tel') || header.includes('phone')) mapping[h] = 'phone';
        else if (header.includes('sector') || header.includes('industria')) mapping[h] = 'sector';
      });

      setImportRows(rows);
      setColumnMapping(mapping);
      setImportStep(2);
      setImportStatus({ type: 'idle', message: '' });
    } catch (error: any) {
      console.error("Error importing file:", error);
      setImportStatus({ type: 'error', message: error.message || 'Error al leer el archivo.' });
    }
  };

  const handleRunHealthCheck = () => {
    setImportStatus({ type: 'loading', message: 'Eliminando duplicados y validando emails...' });
    
    setTimeout(() => {
      const errors: any[] = [];
      importRows.forEach((row, idx) => {
        const email = row[Object.keys(columnMapping).find(k => columnMapping[k] === 'email') || ''];
        const name = row[Object.keys(columnMapping).find(k => columnMapping[k] === 'name') || ''];
        
        if (!email || !email.includes('@')) {
          errors.push({ rowIdx: idx, field: 'email', message: 'Email inválido o vacío' });
        }
        if (!name) {
          errors.push({ rowIdx: idx, field: 'name', message: 'Falta nombre' });
        }
      });
      setImportErrors(errors);
      setImportStep(3);
      setImportStatus({ type: 'idle', message: '' });
    }, 1500);
  };

  const finalizeImport = async () => {
    setImportStatus({ type: 'loading', message: 'Normalizando divisas e insertando datos...' });
    try {
      let successCount = 0;
      for (const row of importRows) {
        const mappedData: any = {
           status: 'Activo',
           billingModel: 'Fijo',
           createdAt: new Date().toISOString()
        };
        Object.entries(columnMapping).forEach(([fileCol, dbCol]) => {
          mappedData[dbCol] = row[fileCol];
        });

        if (mappedData.name) {
          await addDoc(collection(db, 'clients'), mappedData);
          successCount++;
        }
      }
      setImportStep(4);
      setImportStatus({ type: 'success', message: `¡${successCount} clientes importados con éxito!` });
      setTimeout(() => {
        setIsImporting(false);
        setImportStep(1);
        setImportRows([]);
      }, 3000);
    } catch (error) {
      setImportStatus({ type: 'error', message: 'Fallo crítico en la inserción.' });
    }
  };

  const handleExportToExcel = () => {
    try {
      const dataToExport = filteredClients.map(c => ({
        Nombre: c.name || '',
        Empresa: c.company || '',
        Email: c.email || '',
        Teléfono: c.phone || '',
        Sector: c.sector || '',
        'Modelo Cobro': c.billingModel || '',
        Estado: c.status || '',
        'Monto Contrato': c.amount || 0,
        'Etapa Pipeline': c.pipelineStage || '',
        'Fecha Registro': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
      }));

      if (dataToExport.length === 0) {
        alert("No hay clientes para exportar.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
      
      XLSX.writeFile(workbook, `Clientes_B2B_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Hubo un error al exportar los datos. Intente nuevamente.");
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone?.includes(searchTerm);
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesSector = sectorFilter ? c.sector === sectorFilter : true;
    
    return matchesSearch && matchesStatus && matchesSector;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando clientes...</div>;

  const handleGenerateInvoice = async () => {
    if (!selectedClient) return;
    setIsGeneratingInvoice(true);
    try {
      let amount = 0;
      const rules = selectedClient.billingRules || {};
      
      if (selectedClient.billingModel === 'Fijo') {
        amount = rules.baseAmount || 0;
      } else if (selectedClient.billingModel === 'Cita') {
        const effectiveAppointments = prospects.filter(p => 
          (p.clientId === selectedClient.id || p.company === selectedClient.company) && 
          p.status === 'Cita Efectiva'
        ).length;
        amount = effectiveAppointments * (rules.appointmentRate || 0);
      } else if (selectedClient.billingModel === 'Híbrido') {
        const effectiveAppointments = prospects.filter(p => 
          (p.clientId === selectedClient.id || p.company === selectedClient.company) && 
          p.status === 'Cita Efectiva'
        ).length;
        amount = (rules.baseAmount || 0) + (effectiveAppointments * (rules.appointmentRate || 0)) + (rules.milestoneBonus || 0);
      }

      if (amount <= 0) {
        alert('El monto de la factura es 0. Verifica las reglas o las citas efectivas.');
        setIsGeneratingInvoice(false);
        return;
      }

      await addDoc(collection(db, 'invoices'), {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        company: selectedClient.company,
        amount,
        status: 'Pendiente',
        type: 'Automatizada',
        billingModel: selectedClient.billingModel,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        items: [
          { description: `Servicios B2B - Modelo ${selectedClient.billingModel}`, amount }
        ]
      });

      // Create Notification for Client
      await addDoc(collection(db, 'notifications'), {
        userId: selectedClient.id,
        type: 'invoice',
        title: 'Nueva Factura Generada',
        message: `Se ha generado una nueva factura por $${amount.toLocaleString()}.`,
        link: '/client-portal/billing',
        read: false,
        createdAt: new Date().toISOString()
      });

      alert(`Factura de $${amount.toLocaleString()} generada correctamente.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invoices');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  if (selectedClient) {
    return (
      <div className="space-y-6 flex flex-col h-full bg-[#0B0E14] text-gray-400 p-2 sm:p-4">
        <div className="flex flex-col md:flex-row items-center gap-6 glass-panel p-6 rounded-[2rem]">
          <button 
            onClick={() => setSelectedClient(null)}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">{selectedClient.name}</h2>
            <div className="flex items-center gap-3 mt-2 justify-center md:justify-start">
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedClient.company || 'Independiente'}</span>
               <span className="h-1 w-1 bg-gray-700 rounded-full" />
               <span className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest">Node ID: {selectedClient.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveProfileTab('chat')}
              className="flex items-center gap-3 px-6 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all text-[10px]"
            >
              <MessageSquare className="w-4 h-4" /> Open Comms
            </button>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
              selectedClient.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }`}>
              {selectedClient.status}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] overflow-hidden shrink-0">
          <div className="flex border-b border-white/10 overflow-x-auto hide-scrollbar p-2 gap-2">
            {[
              { id: '360', label: '360° Pulse', icon: LayoutGrid },
              { id: 'info', label: 'General Intel', icon: User },
              { id: 'chat', label: 'Comm Hub', icon: MessageSquare },
              { id: 'tasks', label: 'Tactical Tasks', icon: CheckSquare },
              { id: 'visitas', label: 'Node Logistics', icon: Globe },
              { id: 'contract', label: 'Legal Archives', icon: FileText },
              { id: 'billing', label: 'Revenue Rules', icon: CreditCard },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveProfileTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${
                  activeProfileTab === tab.id 
                    ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-6">
          {activeProfileTab === '360' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
                
                {/* LEFT COLUMN: FINANCIAL & RADAR */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Financial Hub */}
                  <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent">
                    <div className="flex justify-between items-start mb-8">
                       <div>
                          <h4 className="text-[10px] font-black text-[#00F0FF] uppercase tracking-[0.3em] font-mono mb-2">Finance Core</h4>
                          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Ledger Insights</h3>
                       </div>
                       <DollarSign className="w-8 h-8 text-[#00F0FF] opacity-40" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Lifetime Value</p>
                          <p className="text-xl font-black text-emerald-400 italic font-mono">${clientIntel.ltv.toLocaleString()}</p>
                       </div>
                       <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Pending Invoices</p>
                          <p className="text-xl font-black text-amber-400 italic font-mono">{clientIntel.pendingInvoices}</p>
                       </div>
                    </div>

                    <div className="h-40 w-full">
                       <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <BarChart data={clientIntel.paymentHistory}>
                             <XAxis dataKey="month" hide />
                             <Tooltip 
                               contentStyle={{ backgroundColor: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                               itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                               labelStyle={{ color: '#00F0FF', fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }}
                             />
                             <Bar dataKey="amount" fill="#00F0FF" radius={[4, 4, 0, 0]} opacity={0.6} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Health Radar - Spider Chart */}
                  <div className="glass-panel p-8 rounded-[2.5rem] bg-[#161B22]/60">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] font-mono mb-8 text-center">Neural Health Vector</h4>
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                           { subject: 'Payment', A: 95, fullMark: 100 },
                           { subject: 'Project', A: 85, fullMark: 100 },
                           { subject: 'Academy', A: clientIntel.academyStats.progress, fullMark: 100 },
                           { subject: 'Feedback', A: 90, fullMark: 100 },
                           { subject: 'Usage', A: 88, fullMark: 100 },
                         ]}>
                           <PolarGrid stroke="rgba(255,255,255,0.1)" />
                           <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold' }} />
                           <Radar name="Client Health" dataKey="A" stroke="#00F0FF" fill="#00F0FF" fillOpacity={0.3} />
                         </RadarChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="mt-8 flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full animate-pulse ${clientIntel.sentiment === 'Positive' ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : clientIntel.sentiment === 'Neutral' ? 'bg-amber-500 shadow-[0_0_10px_#F59E0B]' : 'bg-red-500 shadow-[0_0_10px_#EF4444]'}`} />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Sentiment: {clientIntel.sentiment}</span>
                       </div>
                       <span className="text-2xl font-black text-white italic tracking-tighter">{(selectedClient.healthScore || 85)}%</span>
                    </div>

                    {/* PREVENTIVE ACTION BUTTON */}
                    <AnimatePresence>
                      {(selectedClient.healthScore || 85) < 60 && (
                        <motion.button 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="w-full mt-6 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                        >
                          <AlertCircle className="w-4 h-4" /> Ejecutar Acción Preventiva
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* CENTER COLUMN: OPS & ACADEMY */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Operational Nodes */}
                  <div className="glass-panel p-8 rounded-[2.5rem]">
                    <div className="flex justify-between items-center mb-10">
                       <h3 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                         <Briefcase className="w-6 h-6 text-[#00F0FF]" /> Active Operations
                       </h3>
                       <button className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest border border-[#00F0FF]/20 px-4 py-2 rounded-xl hover:bg-[#00F0FF]/10 transition-colors">Ver Gantt</button>
                    </div>
                    
                    <div className="space-y-4">
                       {clientIntel.projects.length === 0 ? (
                         <div className="py-20 text-center opacity-40">
                            <Activity className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No nodes active at this location</p>
                         </div>
                       ) : (
                         clientIntel.projects.map(p => (
                            <div key={p.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/[0.08] transition-all relative overflow-hidden">
                               <div className="flex justify-between items-start mb-6">
                                  <div>
                                     <h4 className="text-sm font-black text-white uppercase italic tracking-tight">{p.name}</h4>
                                     <p className="text-[9px] font-black text-gray-600 uppercase mt-1 tracking-widest">Category: {p.category || 'Consultora'}</p>
                                  </div>
                                  <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                                    p.status === 'Completado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 glow-emerald' :
                                    p.status === 'Retrasado' ? 'bg-red-500/10 text-red-400 border-red-500/20 glow-crimson' :
                                    p.status === 'En Pausa' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 glow-amber' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  }`}>
                                     {p.status}
                                  </div>
                               </div>
                               
                               <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${p.progress || 50}%` }}
                                    className={`h-full ${
                                      p.status === 'Retrasado' ? 'bg-red-500' : 
                                      p.status === 'Completado' ? 'bg-emerald-500' : 
                                      p.status === 'En Pausa' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                  />
                               </div>
                               <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                  <span>Task Completion</span>
                                  <span className="text-white">{p.progress || 50}%</span>
                               </div>
                            </div>
                         ))
                       )}
                    </div>
                  </div>

                  {/* Academy Node Integrated */}
                  <div className="glass-panel p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-500/5 to-transparent relative overflow-hidden group">
                     <GraduationCap className="absolute top-0 right-0 w-32 h-32 text-blue-500/5 -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-blue-400" /> Talent Forge Node
                     </h3>
                     
                     <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Avg. Staff Progress</p>
                           <p className="text-3xl font-black text-white italic tracking-tighter">{clientIntel.academyStats.progress.toFixed(1)}%</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Top Certified Talent</p>
                           <p className="text-sm font-black text-blue-400 uppercase italic truncate">{clientIntel.academyStats.topTalent}</p>
                        </div>
                     </div>

                     <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                              <ShieldCheck className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-white uppercase tracking-widest">Certification Compliance</p>
                              <p className="text-xs text-gray-500 mt-0.5">85% of staff ready for scaling protocol.</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTION RECAP & INTEL */}
                <div className="lg:col-span-3 space-y-6">
                   <div className="glass-panel p-8 rounded-[3rem] bg-white/[0.02] border-white/5 relative overflow-hidden">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] font-mono mb-8">Interaction Log</h4>
                      <div className="space-y-8 relative">
                          <div className="absolute left-[15px] top-4 bottom-4 w-[1px] bg-white/5" />
                          {[
                            { label: 'Platform Login', date: '2h ago', color: 'bg-emerald-500' },
                            { label: 'Invoice Generated', date: 'Yesterday', color: 'bg-blue-500' },
                            { label: 'Milestone Sync', date: '2d ago', color: 'bg-purple-500' },
                          ].map((log, i) => (
                            <div key={i} className="flex gap-4 relative">
                               <div className={`h-8 w-8 rounded-full border border-cyber-dark z-10 shrink-0 ${log.color} opacity-20`} />
                               <div className="pt-1">
                                  <p className="text-[10px] font-black text-white uppercase tracking-widest">{log.label}</p>
                                  <p className="text-[9px] text-gray-600 font-mono mt-0.5">{log.date}</p>
                               </div>
                            </div>
                          ))}
                      </div>
                   </div>

                   <div className="p-10 bg-[#00F0FF] rounded-[3rem] text-black shadow-[0_20px_50px_rgba(181,154,69,0.3)] group hover:scale-[1.02] transition-all cursor-pointer">
                      <Zap className="w-10 h-10 mb-8 opacity-40 group-hover:scale-110 transition-transform" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4">Tactical Directive</h4>
                      <p className="text-sm font-black italic tracking-tighter uppercase leading-tight mb-8">Initiate Scale Module: <span className="text-white bg-black px-2 py-0.5 rounded-lg">Variable B2B</span></p>
                      <button className="w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Execute Node Expansion</button>
                   </div>

                   <button onClick={() => setActiveProfileTab('info')} className="w-full py-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                      View Raw Node Data <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            )}

            {activeProfileTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Datos de Contacto</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{selectedClient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="text-sm font-medium">{selectedClient.phone || 'No registrado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Sitio Web</p>
                        <p className="text-sm font-medium">{selectedClient.website || 'No registrado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Modelo de Negocio</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-[#00F0FF]" />
                      <div>
                        <p className="text-xs text-gray-500">Modelo de Cobro</p>
                        <p className="text-sm font-bold">{selectedClient.billingModel || 'Fijo'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Sector</p>
                        <p className="text-sm font-medium">{selectedClient.sector}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeProfileTab === 'chat' && (
              <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm">Inicia una conversación interna sobre este cliente</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => {
                      const isMe = msg.sender === auth.currentUser?.email;
                      return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                            isMe 
                              ? 'bg-[#00F0FF] text-white rounded-tr-none' 
                              : 'bg-gray-100 text-gray-900 rounded-tl-none'
                          }`}>
                            {!isMe && <p className="text-[10px] font-bold text-gray-500 mb-1">{msg.sender}</p>}
                            <p>{msg.text}</p>
                            <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
                  <input 
                    type="text"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    placeholder="Escribe un mensaje interno..."
                    className="flex-1 p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm"
                  />
                  <button 
                    type="submit"
                    className="bg-gray-900 text-white p-2 rounded-lg hover:bg-black transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}

            {activeProfileTab === 'tasks' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tareas del Cliente</h3>
                  
                  <form onSubmit={handleCreateTask} className="flex gap-3 mb-6">
                    <input 
                      type="text"
                      required
                      placeholder="Nueva tarea..."
                      value={newClientTask.title}
                      onChange={e => setNewClientTask({...newClientTask, title: e.target.value})}
                      className="flex-1 p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm"
                    />
                    <input 
                      type="text"
                      placeholder="Responsable"
                      value={newClientTask.assignee}
                      onChange={e => setNewClientTask({...newClientTask, assignee: e.target.value})}
                      className="w-40 p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm"
                    />
                    <input 
                      type="date"
                      value={newClientTask.dueDate}
                      onChange={e => setNewClientTask({...newClientTask, dueDate: e.target.value})}
                      className="w-40 p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm"
                    />
                    <button 
                      type="submit"
                      className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors font-bold text-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </form>

                  <div className="space-y-3">
                    {clientTasks.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 text-sm italic">No hay tareas asociadas a este cliente.</p>
                    ) : (
                      clientTasks.map(task => (
                        <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${task.status === 'completed' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm'}`}>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleToggleTask(task.id, task.status)}
                              className="flex-shrink-0 relative group"
                              title="Clic para cambiar estado: Pendiente -> En Proceso -> Completado"
                            >
                              {task.status === 'completed' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                              {task.status === 'in-progress' && <PlayCircle className="h-6 w-6 text-blue-500" />}
                              {task.status === 'pending' && <Circle className="h-6 w-6 text-gray-300 group-hover:text-gray-400" />}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-bold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                  {task.title}
                                </p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {task.status === 'in-progress' ? 'En Proceso' : task.status === 'completed' ? 'Completado' : 'Pendiente'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                {task.assignee && (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                    <User className="w-3 h-3" /> {task.assignee}
                                  </span>
                                )}
                                {task.dueDate && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                    new Date(task.dueDate) < new Date() && task.status !== 'completed'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    <Calendar className="w-3 h-3" /> {task.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeProfileTab === 'visitas' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Historial de Visitas</h3>
                    <p className="text-sm text-gray-500">Registra y revisa salidas a terreno con el cliente.</p>
                  </div>
                  <button 
                    onClick={() => setIsRegisteringVisit(!isRegisteringVisit)}
                    className="bg-[#00F0FF] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#00BFFF] transition-colors flex items-center gap-2 text-sm"
                  >
                    {isRegisteringVisit ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isRegisteringVisit ? 'Cancelar' : 'Registrar Visita'}
                  </button>
                </div>

                {isRegisteringVisit && (
                  <form onSubmit={handleRegisterVisit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2">Nueva Visita en Terreno</h4>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Resultado / Estado</label>
                      <select 
                        required
                        value={newVisit.outcome}
                        onChange={e => setNewVisit({...newVisit, outcome: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm font-bold"
                      >
                        <option>Seguimiento</option>
                        <option>Venta Concluida</option>
                        <option>Venta Rechazada</option>
                        <option>Presentación Entregada</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notas y Observaciones</label>
                      <textarea
                        required
                        placeholder="Detalles sobre acuerdos, razones de rechazo o interés..."
                        value={newVisit.notes}
                        onChange={e => setNewVisit({...newVisit, notes: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Photo / Camera Capture */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adjuntar Evidencia (Foto)</label>
                        <div className="flex gap-2 items-center">
                          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold text-sm transition-colors border border-gray-200 flex-1 flex justify-center items-center gap-2">
                            <Upload className="w-4 h-4" /> Tomar Foto o Subir
                            {/* capture="environment" forces the rear camera on mobile */}
                            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                          </label>
                        </div>
                        {newVisit.photoUrl && (
                          <div className="mt-2 w-full h-32 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden relative">
                            <img src={newVisit.photoUrl} alt="Evidencia" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setNewVisit({...newVisit, photoUrl: ''})}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Geolocation */}
                      <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Geolocalización In-Situ</label>
                         {newVisit.location ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex items-start gap-3 h-[128px]">
                              <Globe className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-green-800">Ubicación Capturada</p>
                                <p className="text-[10px] text-green-600 font-mono mt-1 mb-2">Lat: {newVisit.location.lat.toFixed(6)} <br/>Lng: {newVisit.location.lng.toFixed(6)}</p>
                                <button type="button" onClick={() => setNewVisit({...newVisit, location: null})} className="text-xs font-bold text-red-500 hover:underline">Eliminar ubicación</button>
                              </div>
                            </div>
                         ) : (
                          <button 
                            type="button"
                            onClick={captureLocation}
                            className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-4 py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <Globe className="w-4 h-4" /> Capturar GPS Automáticamente
                          </button>
                         )}
                      </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                      <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors">
                        Guardar Visita
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {clientVisits.length === 0 ? (
                    <div className="bg-white border rounded-xl p-8 text-center text-gray-500 shadow-sm">
                      <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-bold">Aún no hay visitas registradas</p>
                      <p className="text-sm mt-1">Registra tu primera salida técnica o comercial en terreno.</p>
                    </div>
                  ) : (
                    clientVisits.map(visit => (
                      <div key={visit.id} className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900">{visit.registeredBy}</h4>
                            <p className="text-xs text-gray-500">{new Date(visit.timestamp).toLocaleString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            visit.outcome === 'Venta Concluida' ? 'bg-green-100 text-green-700' :
                            visit.outcome === 'Venta Rechazada' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {visit.outcome}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{visit.notes}</p>
                        
                        {(visit.photoUrl || visit.location) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            {visit.photoUrl && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Evidencia Fotográfica</span>
                                <div className="h-40 rounded-lg overflow-hidden border border-gray-200">
                                  <img src={visit.photoUrl} alt="Visita" className="w-full h-full object-cover" />
                                </div>
                              </div>
                            )}
                            {visit.location && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Verificación GPS</span>
                                <div className="h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                                   {/* Simple map iframe showing the location visually */}
                                   <iframe
                                      width="100%"
                                      height="100%"
                                      frameBorder="0"
                                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${visit.location.lng - 0.01},${visit.location.lat - 0.01},${visit.location.lng + 0.01},${visit.location.lat + 0.01}&layer=mapnik&marker=${visit.location.lat},${visit.location.lng}`}
                                      className="rounded-lg pointer-events-none"
                                   ></iframe>
                                </div>
                                <div className="text-[10px] pt-1 text-gray-500 font-mono text-center">
                                  {visit.location.lat}, {visit.location.lng}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeProfileTab === 'contract' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden font-serif">
                      <div className="absolute top-0 right-0 p-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                          <Shield className="w-3 h-3" /> Contrato Firmado
                        </span>
                      </div>
                      
                      <div className="max-w-2xl mx-auto space-y-8">
                        <div className="text-center border-b border-gray-100 pb-8">
                          <Building2 className="w-12 h-12 text-[#00F0FF] mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-gray-900 font-sans tracking-tight">CONTRATO DE PRESTACIÓN DE SERVICIOS B2B</h3>
                          <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase">Reference ID: KV-{selectedClient.id?.substring(0, 8).toUpperCase()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 text-sm font-sans">
                          <div>
                            <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-2 tracking-widest">Prestador de Servicios</h4>
                            <p className="font-bold text-gray-900">Kaivincia Corp S.L.</p>
                            <p className="text-gray-600">CIF: B12345678</p>
                            <p className="text-gray-500 text-[10px]">Calle de la Innovación 42, Madrid</p>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-2 tracking-widest">Cliente / Contratante</h4>
                            <p className="font-bold text-gray-900">{selectedClient.company || selectedClient.name}</p>
                            <p className="text-gray-600">{selectedClient.email}</p>
                            <p className="text-gray-500 text-[10px]">{selectedClient.phone || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="space-y-6 text-sm text-gray-700 leading-relaxed border-t border-gray-50 pt-8">
                          <div className="space-y-2">
                            <p className="font-bold text-gray-900 uppercase text-[10px] tracking-wider">Cláusula 1: Objeto del Contrato</p>
                            <p>El presente contrato tiene por objeto la prestación de servicios de generación de leads calificados, gestión de ventas y consultoría estratégica por parte de Kaivincia Corp para el crecimiento de la cartera B2B del Cliente.</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-bold text-gray-900 uppercase text-[10px] tracking-wider">Cláusula 2: Modelo de Compensación</p>
                            <p>Las partes acuerdan un modelo de compensación basado en <strong>{selectedClient.billingModel || 'Fijo'}</strong>. Los pagos se realizarán dentro de los primeros 5 días de cada mes natural.</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-bold text-gray-900 uppercase text-[10px] tracking-wider">Cláusula 3: Confidencialidad</p>
                            <p>Ambas partes se comprometen a mantener la más estricta confidencialidad sobre toda la información técnica, comercial o financiera a la que tengan acceso durante la vigencia del contrato.</p>
                          </div>
                        </div>

                        <div className="pt-12 grid grid-cols-2 gap-12 border-t border-gray-100">
                          <div className="text-center space-y-4">
                            <div className="h-16 border-b border-gray-200 flex items-end justify-center pb-2">
                              <span className="text-xs italic text-gray-400 font-sans">Firmado Digitalmente</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kaivincia Corp</p>
                          </div>
                          <div className="text-center space-y-4">
                            <div className="h-16 border-b border-gray-200 flex items-end justify-center pb-2">
                              <span className="text-xs italic text-gray-400 font-sans">Firmado Digitalmente</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{selectedClient.name}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Documentos Adjuntos</h4>
                      <div className="space-y-3">
                        {[
                          { name: 'Contrato_Principal.pdf', size: '1.2 MB', date: '12/03/2024' },
                          { name: 'Anexo_Tarifas.pdf', size: '450 KB', date: '12/03/2024' },
                          { name: 'NDA_Firmado.pdf', size: '890 KB', date: '10/03/2024' },
                        ].map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400 group-hover:text-[#00F0FF]" />
                              <div>
                                <p className="text-xs font-bold text-gray-900">{doc.name}</p>
                                <p className="text-[10px] text-gray-500">{doc.size} • {doc.date}</p>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-4 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs font-bold text-gray-400 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all">
                        + Subir Nuevo Documento
                      </button>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-xl text-white shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-[#00F0FF]" />
                        <h4 className="text-xs font-bold uppercase tracking-widest">Seguridad Legal</h4>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Este contrato está protegido por encriptación de grado bancario y cumple con la normativa eIDAS para firmas electrónicas en la Unión Europea.
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-500">Hash: 8f2d...4e1a</span>
                        <button className="text-[10px] font-bold text-[#00F0FF] hover:underline">Verificar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeProfileTab === 'billing' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#00F0FF]" /> Configuración de Reglas de Cobro
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Modelo de Facturación</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Fijo', 'Cita', 'Híbrido'].map(model => (
                          <button 
                            key={model}
                            onClick={() => setSelectedClient({...selectedClient, billingModel: model})}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                              selectedClient.billingModel === model 
                                ? 'border-[#00F0FF] bg-cyan-500/10 text-[#00F0FF]' 
                                : 'border-gray-100 hover:border-gray-200 text-gray-500'
                            }`}
                          >
                            <p className="font-bold text-sm">{model}</p>
                            <p className="text-[10px] mt-1 opacity-70">
                              {model === 'Fijo' ? 'Mensual recurrente' : model === 'Cita' ? 'Por cita agendada' : 'Base + Variable'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      {(selectedClient.billingModel === 'Fijo' || selectedClient.billingModel === 'Híbrido') && (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-500 uppercase">Monto Base Mensual</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              type="number"
                              value={selectedClient.billingRules?.baseAmount || 0}
                              onChange={e => setSelectedClient({
                                ...selectedClient, 
                                billingRules: { ...selectedClient.billingRules, baseAmount: Number(e.target.value) }
                              })}
                              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm"
                            />
                          </div>
                        </div>
                      )}
                      {(selectedClient.billingModel === 'Cita' || selectedClient.billingModel === 'Híbrido') && (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-500 uppercase">Costo por Cita Efectiva</label>
                          <div className="relative">
                            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              type="number"
                              value={selectedClient.billingRules?.appointmentRate || 0}
                              onChange={e => setSelectedClient({
                                ...selectedClient, 
                                billingRules: { ...selectedClient.billingRules, appointmentRate: Number(e.target.value) }
                              })}
                              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm"
                            />
                          </div>
                        </div>
                      )}
                      {selectedClient.billingModel === 'Híbrido' && (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-500 uppercase">Bono por Hitos (Opcional)</label>
                          <div className="relative">
                            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              type="number"
                              value={selectedClient.billingRules?.milestoneBonus || 0}
                              onChange={e => setSelectedClient({
                                ...selectedClient, 
                                billingRules: { ...selectedClient.billingRules, milestoneBonus: Number(e.target.value) }
                              })}
                              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'clients', selectedClient.id), {
                              billingModel: selectedClient.billingModel,
                              billingRules: selectedClient.billingRules || {}
                            });
                            alert('Reglas de cobro actualizadas correctamente.');
                          } catch (error) {
                            handleFirestoreError(error, OperationType.UPDATE, `clients/${selectedClient.id}`);
                          }
                        }}
                        className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all text-sm"
                      >
                        Guardar Reglas
                      </button>
                      <button 
                        onClick={handleGenerateInvoice}
                        disabled={isGeneratingInvoice}
                        className="flex-1 py-3 bg-[#00F0FF] text-white rounded-xl font-bold hover:bg-[#00BFFF] shadow-lg shadow-yellow-100 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                        Generar Factura
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex gap-3">
                    <Activity className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">Automatización de Facturación</p>
                      <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Al generar la factura, el sistema calculará automáticamente el monto basado en las citas marcadas como <strong>"Efectivas"</strong> en el módulo de Operaciones para este cliente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 bg-[#0B0E14] text-gray-400 min-h-screen">
      {/* COMMAND HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 glass-panel p-8 rounded-[2.5rem]">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none mb-3">B2B Nexus Command</h2>
          <div className="flex flex-wrap items-center gap-6">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Multi-Node Portfolio Audit
            </p>
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              <button 
                onClick={() => setActiveMainTab('list')}
                className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeMainTab === 'list' ? 'bg-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Active Nodes
              </button>
              <button 
                onClick={() => setActiveMainTab('upsell')}
                className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${activeMainTab === 'upsell' ? 'bg-[#00F0FF]/20 text-[#00F0FF] shadow-xl border border-[#00F0FF]/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Zap className="w-3 h-3" /> Expansion Ops
                {upsellOpportunities.length > 0 && (
                  <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">{upsellOpportunities.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button 
            onClick={handleExportToExcel}
            className="flex-1 lg:flex-none bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <Download className="h-4 w-4" /> Export Ledger
          </button>
          <button 
            onClick={() => setIsImporting(!isImporting)}
            className="flex-1 lg:flex-none bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <Upload className="h-4 w-4" /> Node Intel Sync
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 lg:flex-none bg-gradient-to-br from-[#00F0FF] to-[#8d7735] text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(181,154,69,0.3)]"
          >
            <Plus className="h-4 w-4" /> New Client Node
          </button>
        </div>
      </div>

      {/* PORTFOLIO KPI DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Portfolio Val', val: '$1.2M', trend: '+12.4%', color: 'blue' },
          { label: 'Avg Pulse Health', val: '86.4', trend: '+2.1%', color: 'emerald' },
          { label: 'Pending Liquidation', val: '$42.5K', trend: '-5.2%', color: 'amber' },
          { label: 'Churn Probability', val: '1.4%', trend: 'Minimal', color: 'purple' }
        ].map((kpi, i) => (
          <div key={kpi.label} className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
              {i === 0 ? <Globe className="w-12 h-12" /> : i === 1 ? <Activity className="w-12 h-12" /> : i === 2 ? <Receipt className="w-12 h-12" /> : <ShieldCheck className="w-12 h-12" />}
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{kpi.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-white italic tracking-tighter">{kpi.val}</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg bg-${kpi.color}-500/10 text-${kpi.color}-400 mb-1`}>{kpi.trend}</span>
            </div>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: '65%' }} 
                 className={`h-full bg-${kpi.color}-500 opacity-50`} 
               />
            </div>
          </div>
        ))}
      </div>

      {activeMainTab === 'upsell' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {upsellOpportunities.map((opp) => (
            <div key={opp.id} className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-[#00F0FF]/40 transition-all">
              <div className="absolute top-0 right-0 p-6 bg-white/5 rounded-bl-3xl border-l border-b border-white/10 opacity-60">
                 {opp.source === 'Academia' ? <GraduationCap className="h-6 w-6 text-blue-400" /> : <TrendingUp className="h-6 w-6 text-[#00F0FF]" />}
              </div>
              
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-6 font-mono">Vector: {opp.source === 'Academia' ? 'Neural Scaling' : 'Market Surge'}</h4>
              
              <div className="mb-8">
                <h3 className="text-xl font-black text-white italic tracking-tighter mb-2">{opp.clientName || opp.name}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">{opp.potentialValue || 'High Propensity'}</span>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{opp.email || 'Encrypted ID'}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl italic">
                   <p className="text-[11px] text-gray-500 leading-relaxed">"{opp.reason}"</p>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-8 group-hover:bg-white/10 transition-colors">
                <p className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest mb-2">Expansion Module</p>
                <p className="text-xs font-black text-white uppercase italic">{opp.service || 'Advanced Growth Protocol'}</p>
              </div>

              <div className="flex gap-4">
                 <button className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Review Hub</button>
                 <button onClick={() => handleEscalate(opp)} className="flex-1 py-4 bg-[#00F0FF] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#00F0FF]/20">Deploy Proposal</button>
              </div>
            </div>
          ))}
          {upsellOpportunities.length === 0 && (
            <div className="col-span-full py-20 text-center glass-panel rounded-[3rem] border-dashed border-white/10">
              <Zap className="w-16 h-16 text-white/5 mx-auto mb-6" />
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Zero Expansion Vectors Detected</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">The Neural Core will alert you when a node reaches peak saturation.</p>
            </div>
          )}
        </div>
      )}

      {activeMainTab === 'list' && (
        <>
          {isImporting && (
            <div className="glass-panel p-10 rounded-[3rem] mb-12 overflow-hidden relative">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Intel Sync 2.0</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Data Normalization Protocol</p>
                </div>
                <button onClick={() => { setIsImporting(false); setImportStep(1); }} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex gap-4 mb-10">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${importStep >= step ? 'bg-[#00F0FF]' : 'bg-gray-100'}`} />
                  </div>
                ))}
              </div>

              {importStep === 1 && (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                   className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2.5rem] p-16 hover:border-[#00F0FF]/50 transition-all cursor-pointer group bg-white/[0.02]"
                   onClick={() => fileInputRef.current?.click()}
                >
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                   <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-white/10 group-hover:border-[#00F0FF]/30">
                      <FileSpreadsheet className="w-10 h-10 text-gray-600 group-hover:text-[#00F0FF]" />
                   </div>
                   <p className="text-sm font-black text-white uppercase tracking-[0.3em] mb-3 font-mono">Deploy Dataset Alpha</p>
                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">XLSX, CSV or Neural JSON supported</p>
                </motion.div>
              )}

              {importStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                   <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00F0FF] font-mono">Phase 02: Neural Mapping</h4>
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">98.4% Confidence Logic</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.keys(importRows[0] || {}).filter(k => k !== '_id').map(header => (
                        <div key={header} className="p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
                           <div>
                              <p className="text-[9px] font-black text-gray-600 uppercase mb-2 tracking-widest">Dataset Column</p>
                              <p className="text-xs font-black text-white italic truncate max-w-[150px]">{header}</p>
                           </div>
                           <ArrowRight className="w-4 h-4 text-gray-700" />
                           <select 
                             value={columnMapping[header] || ''} 
                             onChange={(e) => setColumnMapping({...columnMapping, [header]: e.target.value})}
                             className="bg-cyber-dark border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#00F0FF] text-white"
                           >
                              <option value="">Ignore</option>
                              <option value="name">Client ID</option>
                              <option value="company">Org Reference</option>
                              <option value="email">Digital Address</option>
                              <option value="phone">Comm Link</option>
                              <option value="sector">Industry Core</option>
                           </select>
                        </div>
                      ))}
                   </div>
                   <div className="pt-10 flex justify-end">
                      <button 
                        onClick={handleRunHealthCheck}
                        className="px-10 py-5 bg-[#00F0FF] text-black rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-[#00F0FF]/20"
                      >
                         Execute Integrity Scan <Activity className="w-4 h-4" />
                      </button>
                   </div>
                </motion.div>
              )}

              {importStep === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                   <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00F0FF] font-mono">Phase 03: Data Ledger Preview</h4>
                      <div className="flex gap-6">
                         <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{importErrors.length} Collision Points Detected</span>
                         <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest underline decoration-2 underline-offset-4">Auto-Patch Node</button>
                      </div>
                   </div>
                   
                   <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/40">
                      <div className="max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                           <thead className="bg-white/5 text-gray-500 sticky top-0 backdrop-blur-md">
                              <tr>
                                 {Object.entries(columnMapping).map(([fileCol, dbCol]) => (
                                   <th key={fileCol} className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-white/5">{dbCol}</th>
                                 ))}
                              </tr>
                           </thead>
                           <tbody className="font-mono text-[10px]">
                              {importRows.slice(0, 15).map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                   {Object.entries(columnMapping).map(([fileCol, dbCol]) => {
                                      const hasError = importErrors.some(e => e.rowIdx === rIdx && e.field === dbCol);
                                      return (
                                        <td key={fileCol} className={`px-6 py-4 ${hasError ? 'bg-red-500/10 text-red-400 font-black' : 'text-gray-400'}`}>
                                           {row[fileCol] || <span className="opacity-20 italic">VOID</span>}
                                        </td>
                                      );
                                   })}
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                   </div>

                   <div className="pt-10 flex justify-end gap-6">
                      <button onClick={() => setImportStep(2)} className="px-8 py-5 border border-white/10 text-gray-500 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Re-Map Logic</button>
                      <button 
                        onClick={finalizeImport}
                        className="px-10 py-5 bg-emerald-500 text-black rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-emerald-500/20"
                      >
                         Ingest {importRows.length} Registers <Sparkles className="w-4 h-4 fill-current" />
                      </button>
                   </div>
                </motion.div>
              )}

              {importStatus.type === 'loading' && (
                <div className="absolute inset-0 bg-cyber-dark/95 backdrop-blur-2xl z-20 flex flex-col items-center justify-center p-16 text-center">
                   <div className="relative h-32 w-32 mb-10">
                      <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                      <div className="absolute inset-0 border-4 border-[#00F0FF] rounded-full border-t-transparent animate-spin" />
                      <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-[#00F0FF] animate-pulse" />
                   </div>
                   <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Processing Neural Logic</h4>
                   <p className="text-[10px] font-black text-gray-500 font-mono animate-pulse uppercase tracking-[0.4em]">{importStatus.message}</p>
                </div>
              )}

              {importStep === 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-20 text-center">
                   <div className="h-24 w-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20 glow-emerald">
                      <CheckCircle2 className="w-12 h-12" />
                   </div>
                   <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Ingestion Successful</h4>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] font-mono">{importStatus.message}</p>
                   <button 
                     onClick={() => { setIsImporting(false); setImportStep(1); }}
                     className="mt-12 px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
                   >
                     Return to Base
                   </button>
                </motion.div>
              )}
            </div>
          )}

          <div className="glass-panel rounded-[3rem] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-wrap gap-4 justify-between items-center bg-white/5">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative max-w-sm w-full group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-[#00F0FF] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search Node, Company, or Ledger ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-cyber-dark border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white focus:ring-2 focus:ring-[#00F0FF]/50 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-6 py-4 bg-cyber-dark border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none text-white focus:ring-2 focus:ring-[#00F0FF]/50 transition-all min-w-[180px]"
                >
                  <option value="">All Logic States</option>
                  <option value="Activo">Online / Active</option>
                  <option value="En Riesgo">System Risk</option>
                  <option value="Lead">Potential Node</option>
                  <option value="Inactivo">Offline</option>
                </select>

                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="px-6 py-4 bg-cyber-dark border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none text-white focus:ring-2 focus:ring-[#00F0FF]/50 transition-all min-w-[180px]"
                >
                  <option value="">All Industry Cores</option>
                  {Array.from(new Set(clients.map(c => c.sector).filter(Boolean))).map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              
              <div className="text-[10px] font-black text-[#00F0FF] bg-[#00F0FF]/10 px-6 py-3 rounded-2xl border border-[#00F0FF]/20 shadow-[0_0_15px_rgba(181,154,69,0.1)]">
                Active Nodes: <span className="text-white ml-2">{filteredClients.length}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Core Node / Org</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Comm Link</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Revenue Model</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Neural Status</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Tactical Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredClients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-white/[0.05] cursor-pointer transition-all group"
                      onClick={() => setSelectedClient(client)}
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-black text-white italic truncate max-w-[200px] mb-1">{client.name}</div>
                        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 opacity-40" /> {client.company || 'Independiente'}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-[11px] font-black text-gray-400 mb-1">{client.phone}</div>
                        <div className="text-[10px] text-gray-600 font-medium lowercase tracking-tight">{client.email}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="px-3 py-1.5 bg-white/5 border border-white/5 text-[#00F0FF] rounded-xl text-[9px] font-black uppercase tracking-widest group-hover:border-[#00F0FF]/30 transition-all">
                          {client.billingModel || 'Fijo'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`px-4 py-1.5 inline-flex text-[9px] font-black uppercase tracking-widest rounded-full border ${
                          client.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 glow-emerald' : 
                          client.status === 'Prospecto' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                          'bg-gray-500/10 text-gray-500 border-gray-500/20'
                        }`}>
                          {client.status === 'Activo' ? 'Online' : client.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              setSelectedClient(client);
                              setActiveProfileTab('chat');
                            }}
                            className="bg-white/5 p-3 rounded-xl text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 border border-white/5 transition-all"
                            title="Open Link"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedClient(client)}
                            className="bg-white/5 p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                            title="Inspect Index"
                          >
                            <User className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No se encontraron clientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* New Client Command Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel border-white/20 w-full max-w-2xl overflow-hidden rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-[#00F0FF] to-[#8d7735] rounded-2xl text-black shadow-2xl">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Register Core Node</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Module: Portfolio Ingestion</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="p-10 space-y-8 bg-cyber-dark/50">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Node Command Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#00F0FF] transition-colors" />
                    <input 
                      required
                      value={newClient.name}
                      onChange={e => setNewClient({...newClient, name: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00F0FF]/50 outline-none text-sm text-white font-medium"
                      placeholder="e.g. Victor Kaine"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Organization ID</label>
                  <div className="relative group">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#00F0FF] transition-colors" />
                    <input 
                      required
                      value={newClient.company}
                      onChange={e => setNewClient({...newClient, company: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00F0FF]/50 outline-none text-sm text-white font-medium"
                      placeholder="e.g. Cyberdyne Systems"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Digital Address (Email)</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#00F0FF] transition-colors" />
                  <input 
                    type="email"
                    required
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00F0FF]/50 outline-none text-sm text-white font-medium"
                    placeholder="protocol@org.com"
                  />
                </div>
                {clients.some(c => c.email === newClient.email) && (
                  <p className="text-[9px] text-red-500 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Address Collision Detected
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Comm ID (Phone)</label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#00F0FF] transition-colors" />
                    <input 
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00F0FF]/50 outline-none text-sm text-white font-medium"
                      placeholder="+34 000 000 000"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Revenue Logic</label>
                  <select 
                    value={newClient.billingModel}
                    onChange={e => setNewClient({...newClient, billingModel: e.target.value})}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00F0FF]/50 outline-none text-sm text-white font-black uppercase tracking-widest"
                  >
                    <option value="Fijo">Fixed Logic</option>
                    <option value="Cita">Sync Based</option>
                    <option value="Híbrido">Hybrid Neural</option>
                  </select>
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 bg-white/5 border border-white/10 text-gray-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                >
                  Abort Protocol
                </button>
                <button 
                  type="submit"
                  disabled={clients.some(c => c.email === newClient.email)}
                  className="flex-1 py-5 bg-[#00F0FF] text-black rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-2xl shadow-[#00F0FF]/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Initiate Node Ingestion
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
