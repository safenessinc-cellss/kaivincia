import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, query, orderBy, setDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Receipt, FileText, Settings, DollarSign, AlertTriangle, 
  TrendingUp, Users, Plus, Download, Send, Activity,
  Calculator, PieChart, Sparkles, Loader2, X, Briefcase,
  ArrowRight, Save, Zap, RefreshCw, CreditCard
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Billing() {
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

  const costData = {
    ...costConfig,
    totalHoursWorked: 1200,
    manHourCost: (costConfig.totalMonthlyPayroll + costConfig.overhead) / 1200
  };

  const generateWithAI = async (mode: 'invoice' | 'quote' | 'cost') => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    
    setTimeout(() => {
      try {
        if (mode === 'invoice') {
          const mockData = {
            client: "Cliente Demo",
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
            client: "Cliente Demo",
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
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturación y Cobranza</h2>
          <p className="text-sm text-gray-500 mt-1">Automatización, cotizaciones y control de cartera</p>
        </div>
        <div className="flex gap-3">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto shrink-0">
          {[
            { id: 'dashboard', label: 'Panel de Control', icon: TrendingUp },
            { id: 'facturas', label: 'Gestión de Facturas', icon: Receipt },
            { id: 'recurrencia', label: 'Modelo Fijo', icon: RefreshCw },
            { id: 'costos', label: 'Estructura de Costos', icon: Calculator },
            { id: 'modelos', label: 'Modelos de Cobro', icon: Settings },
            { id: 'comisiones', label: 'Comisiones', icon: Users },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-[#00F0FF] text-[#00F0FF]' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Total Facturado (Mes)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${invoices.reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Total Cobrado</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${invoices.filter(i => i.status === 'Pagada').reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Total Pendiente</p>
                  <p className="text-2xl font-bold text-orange-500">
                    ${invoices.filter(i => i.status === 'Pendiente').reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-red-100 bg-red-50">
                  <p className="text-sm text-red-600 mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> En Mora</p>
                  <p className="text-2xl font-bold text-red-700">
                    ${invoices.filter(i => i.status === 'Vencida').reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facturas' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Monto</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{inv.client}</td>
                      <td className="px-6 py-4 font-bold">${inv.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          inv.status === 'Pagada' ? 'bg-green-100 text-green-700' :
                          inv.status === 'Vencida' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => generatePDF(inv)} className="p-2 hover:bg-gray-100 rounded-lg">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'costos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Costo Real Hora Hombre</p>
                  <p className="text-3xl font-black text-gray-900">${costData.manHourCost.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Total Horas Ejecutadas</p>
                  <p className="text-3xl font-black text-blue-600">{costData.totalHoursWorked}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Punto de Equilibrio</p>
                  <p className="text-3xl font-black text-green-600">720h</p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#00F0FF] rounded-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Auditor de Costos IA</h3>
                    <p className="text-xs text-gray-400">Analiza márgenes y optimiza la rentabilidad</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ej: ¿Cuál debería ser mi tarifa por hora para tener un 40% de margen?"
                    className="flex-1 bg-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none"
                  />
                  <button 
                    onClick={() => generateWithAI('cost')}
                    disabled={isAiLoading}
                    className="bg-[#00F0FF] px-6 py-3 rounded-xl font-bold hover:bg-[#00BFFF] transition-all flex items-center gap-2"
                  >
                    {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    Analizar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modelos' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-3xl p-8 text-white">
                <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-2 text-[#00F0FF]">Reglas Globales de Facturación</h3>
                <p className="text-gray-400 text-xs">Configura el comportamiento por defecto de tus modelos de cobro</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'fijo', title: 'Modelo Fijo', desc: 'Cobro mensual recurrente', icon: DollarSign, color: 'bg-blue-500' },
                  { id: 'cita', title: 'Modelo por Cita', desc: 'Facturación por citas', icon: Activity, color: 'bg-[#00F0FF]' },
                  { id: 'hibrido', title: 'Modelo Híbrido', desc: 'Base + variables', icon: TrendingUp, color: 'bg-green-500' },
                ].map((model) => (
                  <div key={model.id} className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-[#00F0FF] transition-all">
                    <div className={`w-14 h-14 ${model.color} rounded-2xl flex items-center justify-center mb-6 text-white`}>
                      <model.icon className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-gray-900 text-lg mb-2">{model.title}</h4>
                    <p className="text-xs text-gray-400 mb-8">{model.desc}</p>
                    <button 
                      onClick={() => {
                        setSelectedModel(model);
                        setIsRulesModalOpen(true);
                      }}
                      className="w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-black uppercase text-gray-600 hover:bg-gray-900 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Configurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comisiones' && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <div className="max-w-md mx-auto">
                <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Dispersión de Comisiones</h3>
                <p className="text-gray-500 mb-8">
                  El sistema libera automáticamente los pagos a Setters y Closers una vez que la factura del cliente cambia a estado <span className="text-green-600 font-bold">"Pagada"</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Generar Nueva Factura</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-900 rounded-xl text-white mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-bold uppercase">Asistente IA</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ej: Factura a TechSolutions por 15 citas..."
                    className="flex-1 bg-gray-800 rounded-lg text-sm p-2 outline-none"
                  />
                  <button 
                    onClick={() => generateWithAI('invoice')}
                    disabled={isAiLoading}
                    className="bg-[#00F0FF] p-2 rounded-lg disabled:opacity-50"
                  >
                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <input 
                placeholder="Cliente"
                value={newInvoice.client}
                onChange={e => setNewInvoice({...newInvoice, client: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00F0FF]"
              />
              <input 
                placeholder="Monto (USD)"
                type="number"
                value={newInvoice.amount}
                onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00F0FF]"
              />
              <textarea 
                placeholder="Descripción"
                value={newInvoice.description}
                onChange={e => setNewInvoice({...newInvoice, description: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00F0FF]"
                rows={3}
              />

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="flex-1 py-3 text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveManualInvoice}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold"
                >
                  Generar Factura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Generar Presupuesto</h3>
              <button onClick={() => setIsQuoteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-900 rounded-xl text-white mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-bold uppercase">Asistente IA</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ej: Presupuesto para 3 meses de Appointment Setting..."
                    className="flex-1 bg-gray-800 rounded-lg text-sm p-2 outline-none"
                  />
                  <button 
                    onClick={() => generateWithAI('quote')}
                    disabled={isAiLoading}
                    className="bg-[#00F0FF] p-2 rounded-lg disabled:opacity-50"
                  >
                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <input 
                placeholder="Cliente"
                value={newQuote.client}
                onChange={e => setNewQuote({...newQuote, client: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00F0FF]"
              />

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Conceptos</p>
                {newQuote.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      placeholder="Descripción"
                      value={item.desc}
                      onChange={e => {
                        const items = [...newQuote.items];
                        items[idx].desc = e.target.value;
                        setNewQuote({...newQuote, items});
                      }}
                      className="flex-1 p-2 border border-gray-200 rounded-lg"
                    />
                    <input 
                      placeholder="Precio"
                      type="number"
                      value={item.price}
                      onChange={e => {
                        const items = [...newQuote.items];
                        items[idx].price = e.target.value;
                        const total = items.reduce((acc, i) => acc + Number(i.price || 0), 0);
                        setNewQuote({...newQuote, items, total});
                      }}
                      className="w-24 p-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                ))}
                <button 
                  onClick={() => setNewQuote({...newQuote, items: [...newQuote.items, {desc: '', price: ''}]})}
                  className="text-xs text-[#00F0FF] font-bold"
                >
                  + Añadir concepto
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold">Total Estimado:</span>
                <span className="text-2xl font-black text-[#00F0FF]">${newQuote.total.toLocaleString()}</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="flex-1 py-3 text-gray-500"
                >
                  Cancelar
                </button>
                <button className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold">
                  Guardar y Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
