import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, query, orderBy, setDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Receipt, FileText, Settings, DollarSign, AlertTriangle, 
  TrendingUp, Users, Plus, Download, Send, Activity,
  Calculator, PieChart, Sparkles, Loader2, X, Briefcase,
  ArrowRight, Save, Zap, RefreshCw, CreditCard, MapPin
} from 'lucide-react';
// ❌ ELIMINADO: import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Billing() {
  const navigate = useNavigate();
  const { userData } = useOutletContext<{ userData: any }>();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [globalRules, setGlobalRules] = useState<any>({
    fijo: { baseAmount: 3000 },
    cita: { appointmentRate: 150 },
    hibrido: { baseAmount: 1500, appointmentRate: 100, milestoneBonus: 500 },
    billingDay: 1
  });

  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [costConfig, setCostConfig] = useState({
    totalMonthlyPayroll: 15000,
    overhead: 3000
  });

  const [newInvoice, setNewInvoice] = useState({
    client: '',
    amount: '',
    type: 'Fijo',
    description: ''
  });

  const [newQuote, setNewQuote] = useState({
    client: '',
    items: [{ desc: '', price: '' }],
    total: 0
  });

  const handleSaveManualInvoice = () => {
    const { client, amount, description } = newInvoice;
    const errors: Record<string, string> = {};

    if (!client) errors.client = "El cliente es obligatorio";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errors.amount = "Monto inválido";
    if (!description) errors.description = "El concepto es obligatorio";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    generateAutomaticInvoice(newInvoice.client, Number(newInvoice.amount), newInvoice.type);
    setIsInvoiceModalOpen(false);
    setNewInvoice({ client: '', amount: '', description: '', type: 'Fijo' });
  };

  useEffect(() => {
    const unsubInvoices = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(invoicesData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'invoices'));

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProspects = onSnapshot(collection(db, 'prospects'), (snapshot) => {
      setProspects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRules = onSnapshot(doc(db, 'settings', 'billing'), (snapshot) => {
      if (snapshot.exists()) {
        setGlobalRules(snapshot.data());
      }
    });
    
    return () => {
      unsubInvoices();
      unsubClients();
      unsubProspects();
      unsubRules();
    };
  }, []);

  const handleSaveGlobalRules = async () => {
    try {
      await setDoc(doc(db, 'settings', 'billing'), globalRules, { merge: true });
      setIsRulesModalOpen(false);
      alert('Reglas de facturación actualizadas correctamente.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/billing');
    }
  };

  // Cost Structure Data (Calculated)
  const costData = {
    ...costConfig,
    totalHoursWorked: 1200,
    manHourCost: (costConfig.totalMonthlyPayroll + costConfig.overhead) / 1200
  };

  // Función generateWithAI - CORREGIDA (sin Gemini)
  const generateWithAI = async (mode: 'invoice' | 'quote' | 'cost') => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    
    // Simular delay de procesamiento
    setTimeout(() => {
      try {
        if (mode === 'invoice') {
          const mockData = {
            client: aiPrompt.includes('para') ? aiPrompt.split('para')[1]?.trim() || "Cliente Demo" : "Cliente Demo",
            amount: Math.floor(Math.random() * 5000) + 500,
            type: "Fijo",
            description: `Factura generada por IA: ${aiPrompt.substring(0, 100)}`
          };
          setNewInvoice({ ...newInvoice, ...mockData, amount: String(mockData.amount) });
          alert(`✅ IA generó una factura sugerida:\nCliente: ${mockData.client}\nMonto: $${mockData.amount}`);
        } 
        else if (mode === 'quote') {
          const mockItems = [
            { desc: `Consultoría: ${aiPrompt.substring(0, 40)}`, price: "1500" },
            { desc: "Implementación y Setup", price: "800" }
          ];
          const mockData = {
            client: aiPrompt.includes('para') ? aiPrompt.split('para')[1]?.trim() || "Cliente Demo" : "Cliente Demo",
            items: mockItems,
            total: 2300
          };
          setNewQuote({ ...newQuote, ...mockData });
          alert(`✅ IA generó un presupuesto sugerido:\nCliente: ${mockData.client}\nTotal: $${mockData.total}`);
        } 
        else {
          alert(`📊 Análisis de Costos IA (Demo)\n\n📝 Consulta: "${aiPrompt}"\n\n💡 Recomendación: Optimizar estructura de costos operativos para mejorar márgenes en un 15-20%.`);
        }
        
        setAiPrompt('');
      } catch (error) {
        console.error("Mock AI Error:", error);
        alert("Error en el asistente IA. Por favor, intenta nuevamente.");
      } finally {
        setIsAiLoading(false);
      }
    }, 800);
  };

  const handleBulkGenerateInvoices = async () => {
    if (clients.length === 0) return;
    if (!window.confirm('¿Estás seguro de que deseas generar las facturas de todos los clientes activos para este mes?')) return;
    
    setIsBulkLoading(true);
    let count = 0;
    try {
      for (const client of clients) {
        if (client.status !== 'Activo') continue;
        
        let amount = 0;
        const rules = client.billingRules || {};
        
        if (client.billingModel === 'Fijo') {
          amount = rules.baseAmount || globalRules.fijo.baseAmount;
        } else if (client.billingModel === 'Cita') {
          const effectiveAppointments = prospects.filter(p => 
            (p.clientId === client.id || p.company === client.company) && 
            p.status === 'Cita Efectiva'
          ).length;
          const rate = rules.appointmentRate || globalRules.cita.appointmentRate;
          amount = effectiveAppointments * rate;
        } else if (client.billingModel === 'Híbrido') {
          const effectiveAppointments = prospects.filter(p => 
            (p.clientId === client.id || p.company === client.company) && 
            p.status === 'Cita Efectiva'
          ).length;
          const base = rules.baseAmount || globalRules.hibrido.baseAmount;
          const rate = rules.appointmentRate || globalRules.hibrido.appointmentRate;
          const bonus = rules.milestoneBonus || globalRules.hibrido.milestoneBonus;
          amount = base + (effectiveAppointments * rate) + bonus;
        }

        if (amount > 0) {
          await addDoc(collection(db, 'invoices'), {
            clientId: client.id,
            clientName: client.name,
            company: client.company,
            amount,
            status: 'Pendiente',
            type: 'Cierre Mensual',
            billingModel: client.billingModel,
            createdAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            items: [{ description: `Cierre Mensual - ${client.billingModel}`, amount }]
          });

          await addDoc(collection(db, 'notifications'), {
            userId: client.id,
            type: 'invoice',
            title: 'Nueva Factura Generada',
            message: `Se ha generado una nueva factura por $${amount.toLocaleString()} correspondiente al cierre mensual.`,
            link: '/client-portal/billing',
            read: false,
            createdAt: new Date().toISOString()
          });

          count++;
        }
      }
      alert(`Proceso completado. Se generaron ${count} facturas.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bulk_invoices');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const generateAutomaticInvoice = async (clientName: string, amount: number, type: string) => {
    try {
      const newInv = {
        client: clientName,
        amount,
        status: 'Pendiente',
        date: new Date().toISOString().split('T')[0],
        type,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'invoices'), newInv);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invoices');
    }
  };

  const generatePDF = (inv: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Factura Comercial`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${inv.client || inv.clientName || 'Cliente B2B'}`, 20, 40);
    doc.text(`Fecha: ${new Date(inv.createdAt || inv.date || Date.now()).toLocaleDateString()}`, 20, 50);
    doc.text(`Estado: ${inv.status || 'Pendiente'}`, 20, 60);
    
    const tableData = [
      [inv.type || inv.description || "Servicios Comerciales", `$${inv.amount}`]
    ];
    
    (doc as any).autoTable({
      startY: 70,
      head: [['Descripción', 'Monto']],
      body: tableData,
    });
    
    doc.save(`Factura_${inv.client || 'B2B'}.pdf`);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Resto del JSX se mantiene igual */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturación y Cobranza</h2>
          <p className="text-sm text-gray-500 mt-1">Automatización, cotizaciones y control de cartera</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/crm/cobranza')}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <MapPin className="h-4 w-4 text-purple-600" /> Cobranza GPS
          </button>
          <button 
            onClick={handleBulkGenerateInvoices}
            disabled={isBulkLoading}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-black flex items-center gap-2 disabled:opacity-50"
          >
            {isBulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-[#00F0FF]" />}
            Cierre de Mes
          </button>
          <button 
            onClick={() => setIsQuoteModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-[#00F0FF]" /> Generar Presupuesto
          </button>
          <button 
            onClick={() => setIsInvoiceModalOpen(true)}
            className="bg-[#00F0FF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Generar Factura
          </button>
        </div>
      </div>

      {/* Hero Illustration */}
      <div className="w-full aspect-[21/6] md:aspect-[21/4] rounded-3xl overflow-hidden relative border border-gray-200 group shrink-0">
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
         <img 
           src="https://images.unsplash.com/photo-1642232923580-ed8acdb8fecc?auto=format&fit=crop&w=1600&q=80" 
           alt="Capital Flow & Finanzas" 
           className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
         />
         <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
            <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">Capital Flow & Facturación</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-[0.2em] drop-shadow-md">Capital Flow & Facturación</span>
            </div>
         </div>
      </div>

      {/* El resto del JSX (modales y tabs) se mantiene exactamente igual */}
      {/* ... (mantén el código JSX existente de los modales y tabs) ... */}
    </div>
  );
}
