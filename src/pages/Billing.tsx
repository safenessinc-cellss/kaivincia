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
import { GoogleGenAI } from '@google/genai';
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
    totalHoursWorked: 1200, // This should ideally come from time_logs aggregation
    manHourCost: (costConfig.totalMonthlyPayroll + costConfig.overhead) / 1200
  };

  const generateWithAI = async (mode: 'invoice' | 'quote' | 'cost') => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not found. Please set it in Settings > Secrets.");
      
      const ai = new GoogleGenAI({ apiKey });

      let prompt = '';
      if (mode === 'invoice') {
        prompt = `Genera los detalles de una factura profesional basada en: "${aiPrompt}". Devuelve JSON: {"client": "Nombre", "amount": 100, "type": "Fijo/Variable", "description": "..."}`;
      } else if (mode === 'quote') {
        prompt = `Genera un presupuesto detallado basado en: "${aiPrompt}". Devuelve JSON: {"client": "Nombre", "items": [{"desc": "...", "price": 100}], "total": 100}`;
      } else {
        prompt = `Analiza la estructura de costos: Nómina $${costData.totalMonthlyPayroll}, Gastos $${costData.overhead}, Horas ${costData.totalHoursWorked}. Basado en: "${aiPrompt}". Devuelve JSON: {"analysis": "...", "recommendation": "...", "targetHourRate": 25}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      const data = JSON.parse(text);

      if (mode === 'invoice') {
        setNewInvoice({ ...newInvoice, ...data, amount: String(data.amount) });
      } else if (mode === 'quote') {
        setNewQuote({ ...newQuote, ...data });
      } else {
        alert(`Análisis de IA: ${data.analysis}\n\nRecomendación: ${data.recommendation}\nTarifa Objetivo: $${data.targetHourRate}/h`);
      }
      setAiPrompt('');
    } catch (error) {
      console.error("AI Error:", error);
      alert("Error al procesar con IA.");
    } finally {
      setIsAiLoading(false);
    }
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
          const invoiceRef = await addDoc(collection(db, 'invoices'), {
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

          // Create Notification for Client
          await addDoc(collection(db, 'notifications'), {
            userId: client.id, // Assuming client ID is the user ID for portal
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
              <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-[0.2em] drop-shadow-md">3D glass sculpture of a rising currency wave & gold-tinted data</span>
            </div>
         </div>
      </div>

      {/* Rules Configuration Modal */}
      {isRulesModalOpen && selectedModel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 ${selectedModel.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                  <selectedModel.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-none">Configurar Reglas</h3>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">{selectedModel.title}</p>
                </div>
              </div>
              <button onClick={() => setIsRulesModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {selectedModel.id === 'fijo' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Fee Mensual Base (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number"
                        value={globalRules.fijo.baseAmount}
                        onChange={e => setGlobalRules({
                          ...globalRules,
                          fijo: { ...globalRules.fijo, baseAmount: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mb-1">Nota Lógica</p>
                    <p className="text-xs text-blue-600 leading-relaxed">Este monto se facturará automáticamente cada mes a los clientes bajo este modelo, independientemente de la actividad operativa.</p>
                  </div>
                </div>
              )}

              {selectedModel.id === 'cita' && (
                <div className="space-y-4">
                   <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Valor por Cita Efectiva (USD)</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number"
                        value={globalRules.cita.appointmentRate}
                        onChange={e => setGlobalRules({
                          ...globalRules,
                          cita: { ...globalRules.cita, appointmentRate: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-[#00F0FF]/10 rounded-2xl border border-[#00F0FF]/20">
                    <p className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-widest mb-1">Nota Lógica</p>
                    <p className="text-xs text-[#00F0FF]/80 leading-relaxed">La facturación se calculará multiplicando el número de prospectos en estado "Cita Efectiva" detectados en el ETL por este valor unitario.</p>
                  </div>
                </div>
              )}

              {selectedModel.id === 'hibrido' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Fee Base</label>
                      <input 
                        type="number"
                        value={globalRules.hibrido.baseAmount}
                        onChange={e => setGlobalRules({
                          ...globalRules,
                          hibrido: { ...globalRules.hibrido, baseAmount: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Valor Cita</label>
                      <input 
                        type="number"
                        value={globalRules.hibrido.appointmentRate}
                        onChange={e => setGlobalRules({
                          ...globalRules,
                          hibrido: { ...globalRules.hibrido, appointmentRate: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bono por Cumplimiento de Hitos (USD)</label>
                    <input 
                      type="number"
                      value={globalRules.hibrido.milestoneBonus}
                      onChange={e => setGlobalRules({
                        ...globalRules,
                        hibrido: { ...globalRules.hibrido, milestoneBonus: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none"
                    />
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-[10px] text-green-700 font-bold uppercase tracking-widest mb-1">Nota Lógica</p>
                    <p className="text-xs text-green-600 leading-relaxed">Combina un ingreso garantizado con variables por productividad y premios por cierre de proyectos u objetivos específicos.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsRulesModalOpen(false)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveGlobalRules}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#00F0FF]" /> Guardar Cambios
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
              <h3 className="text-xl font-bold text-gray-900">Generar Presupuesto / Cotización</h3>
              <button onClick={() => setIsQuoteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* AI Assistant for Quote */}
              <div className="p-4 bg-gray-900 rounded-xl text-white mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-bold uppercase">Asistente IA de Ventas</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ej: Presupuesto para 3 meses de Appointment Setting con 2 setters..."
                    className="flex-1 bg-gray-800 border-gray-700 rounded-lg text-sm p-2 outline-none"
                  />
                  <button 
                    onClick={() => generateWithAI('quote')}
                    disabled={isAiLoading}
                    className="bg-[#00F0FF] p-2 rounded-lg hover:bg-[#00BFFF] disabled:opacity-50"
                  >
                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  placeholder="Cliente / Prospecto"
                  value={newQuote.client}
                  onChange={e => setNewQuote({...newQuote, client: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00F0FF]"
                />
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Conceptos del Presupuesto</p>
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
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
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
                        className="w-24 p-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => setNewQuote({...newQuote, items: [...newQuote.items, {desc: '', price: ''}]})}
                    className="text-xs text-[#00F0FF] font-bold hover:underline"
                  >
                    + Añadir concepto
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Estimado:</span>
                  <span className="text-2xl font-black text-[#00F0FF]">${newQuote.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-gray-700"
                >
                  Cerrar
                </button>
                <button 
                  className="flex-1 py-2 bg-gray-900 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar y Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {/* AI Assistant for Invoice */}
              <div className="p-4 bg-gray-900 rounded-xl text-white mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-bold uppercase">Asistente IA</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ej: Factura a TechSolutions por 15 citas de marzo..."
                    className="flex-1 bg-gray-800 border-gray-700 rounded-lg text-sm p-2 outline-none"
                  />
                  <button 
                    onClick={() => generateWithAI('invoice')}
                    disabled={isAiLoading}
                    className="bg-[#00F0FF] p-2 rounded-lg hover:bg-[#00BFFF] disabled:opacity-50"
                  >
                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <input 
                    placeholder="Cliente"
                    value={newInvoice.client}
                    onChange={e => {
                      setNewInvoice({...newInvoice, client: e.target.value});
                      if (formErrors.client) setFormErrors({...formErrors, client: ''});
                    }}
                    className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#00F0FF] transition-all ${formErrors.client ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                  />
                  {formErrors.client && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-2">{formErrors.client}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input 
                      placeholder="Monto (USD)"
                      type="number"
                      value={newInvoice.amount}
                      onChange={e => {
                        setNewInvoice({...newInvoice, amount: e.target.value});
                        if (formErrors.amount) setFormErrors({...formErrors, amount: ''});
                      }}
                      className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#00F0FF] transition-all ${formErrors.amount ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    />
                    {formErrors.amount && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-2">{formErrors.amount}</p>}
                  </div>
                  <select 
                    value={newInvoice.type}
                    onChange={e => setNewInvoice({...newInvoice, type: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00F0FF] bg-gray-50 transition-all font-medium text-sm"
                  >
                    <option>Fijo</option>
                    <option>Variable</option>
                    <option>Híbrido</option>
                  </select>
                </div>

                <div>
                  <textarea 
                    placeholder="Descripción / Concepto"
                    value={newInvoice.description}
                    onChange={e => {
                      setNewInvoice({...newInvoice, description: e.target.value});
                      if (formErrors.description) setFormErrors({...formErrors, description: ''});
                    }}
                    className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#00F0FF] transition-all ${formErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    rows={3}
                  />
                  {formErrors.description && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-2">{formErrors.description}</p>}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    setFormErrors({});
                  }}
                  className="flex-1 py-3 text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveManualInvoice}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#00F0FF]" /> Generar Factura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'dashboard', label: 'Panel de Control', icon: TrendingUp },
            { id: 'facturas', label: 'Gestión de Facturas', icon: Receipt },
            { id: 'recurrencia', label: 'Modelo Fijo (Recurrente)', icon: RefreshCw },
            { id: 'costos', label: 'Estructura de Costos', icon: Calculator },
            { id: 'modelos', label: 'Modelos de Cobro', icon: Settings },
            { id: 'comisiones', label: 'Comisiones', icon: Users },
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
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Total Facturado (Mes)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${invoices.reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Total Cobrado</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${invoices.filter(i => i.status === 'Pagada').reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Total Pendiente</p>
                  <p className="text-2xl font-bold text-orange-500">
                    ${invoices.filter(i => i.status === 'Pendiente').reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-red-100 bg-red-50 shadow-sm">
                  <p className="text-sm text-red-600 mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> En Mora</p>
                  <p className="text-2xl font-bold text-red-700">
                    ${invoices.filter(i => i.status === 'Vencida').reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Rentabilidad Real (Ingresos vs Costos de Nómina)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Cliente</th>
                        <th className="px-4 py-3">Ingresos (Facturado)</th>
                        <th className="px-4 py-3">Costo Operativo (Nómina)</th>
                        <th className="px-4 py-3">Margen Neto</th>
                        <th className="px-4 py-3 rounded-r-lg">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-900">TechSolutions Inc.</td>
                        <td className="px-4 py-3 text-green-600 font-bold">$4,000</td>
                        <td className="px-4 py-3 text-red-500">$2,500</td>
                        <td className="px-4 py-3 font-black text-gray-900 bg-gray-50">$1,500 (37.5%)</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Saludable</span></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-900">Global Logistics</td>
                        <td className="px-4 py-3 text-green-600 font-bold">$3,500</td>
                        <td className="px-4 py-3 text-red-500">$3,200</td>
                        <td className="px-4 py-3 font-black text-red-600 bg-red-50">$300 (8.5%)</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Revisar Costos</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recurrencia' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Suscripciones B2B (Modelo Fijo)</h3>
                    <p className="text-sm text-gray-500">Gestión de cobros mensuales recurrentes sin variables.</p>
                  </div>
                  <button 
                    onClick={handleBulkGenerateInvoices}
                    disabled={isBulkLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isBulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-[#00F0FF]" />}
                    Ejecutar Cobros del Mes
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Mensual</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próximo Cobro</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.filter(c => c.billingModel === 'Fijo' && c.status === 'Activo').map(client => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{client.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.company}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                            ${(client.billingRules?.baseAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                              Suscripción Activa
                            </span>
                          </td>
                        </tr>
                      ))}
                      {clients.filter(c => c.billingModel === 'Fijo' && c.status === 'Activo').length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                            No hay clientes con modelo fijo activo para facturación recurrente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600 h-fit">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm uppercase">Lógica de Recurrencia</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      El sistema identifica a todos los clientes marcados con <strong>Modelo Fijo</strong> y genera una factura automática basada en su <strong>Base Amount</strong> configurado. 
                      Este proceso no requiere intervención manual ni variables externas, asegurando el flujo de caja mensual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facturas' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="px-6 py-4">ID Factura</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Tipo / Concepto</th>
                    <th className="px-6 py-4">Monto</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-600">{inv.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{inv.client}</td>
                      <td className="px-6 py-4 text-gray-500">{inv.type}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">${inv.amount.toLocaleString()}</td>
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
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                               alert(`Generando Link de Pago Seguro (Stripe API).\n\nEn entorno de producción, esto generaría un checkout.session para la factura ${inv.id} y enviaría el link al cliente por correo y WhatsApp.`);
                            }}
                            className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg text-[#00F0FF] hover:text-[#00BFFF] transition-colors"
                            title="Generar Link de Pago"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => generatePDF(inv)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors" 
                            title="Descargar Factura PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors" title="Enviar Recordatorio">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
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
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Costo Real Hora Hombre</p>
                  <p className="text-3xl font-black text-gray-900">${costData.manHourCost.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-2">Basado en Nómina + Overhead</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Total Horas Ejecutadas</p>
                  <p className="text-3xl font-black text-blue-600">{costData.totalHoursWorked}</p>
                  <p className="text-xs text-gray-500 mt-2">Datos de Log de Horas</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Punto de Equilibrio (H)</p>
                  <p className="text-3xl font-black text-green-600">720h</p>
                  <p className="text-xs text-gray-500 mt-2">Para cubrir costos fijos</p>
                </div>
              </div>

              {/* AI Cost Assistant */}
              <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#00F0FF] rounded-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Auditor de Costos IA</h3>
                    <p className="text-xs text-gray-400">Analiza márgenes y optimiza la rentabilidad operativa</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ej: ¿Cuál debería ser mi tarifa por hora para tener un 40% de margen?"
                    className="flex-1 bg-gray-800 border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none"
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

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Desglose de Estructura de Costos</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Nómina Total (Setters, Closers, Ops)</span>
                    </div>
                    <span className="font-bold text-gray-900">${costData.totalMonthlyPayroll.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">Gastos Operativos (Software, Ads, Oficina)</span>
                    </div>
                    <span className="font-bold text-gray-900">${costData.overhead.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Inversión Mensual Total</span>
                    <span className="text-2xl font-black text-gray-900">${(costData.totalMonthlyPayroll + costData.overhead).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modelos' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-3xl p-8 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-2 text-[#00F0FF]">Reglas Globales de Facturación</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Configura el comportamiento por defecto de tus modelos de cobro</p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Día de Corte Mensual</p>
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={globalRules.billingDay}
                      onChange={e => setGlobalRules({...globalRules, billingDay: parseInt(e.target.value)})}
                      className="bg-gray-800 border-gray-700 w-20 text-center rounded-xl py-2 font-black text-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF] outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleSaveGlobalRules}
                    className="bg-[#00F0FF] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#00BFFF] transition-all shadow-xl"
                  >
                    Guardar Setup Global
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F0FF]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'fijo', title: 'Modelo Fijo', desc: 'Cobro mensual recurrente sin variables.', icon: DollarSign, color: 'bg-blue-500' },
                  { id: 'cita', title: 'Modelo por Cita', desc: 'Facturación automática basada en citas agendadas (ETL).', icon: Activity, color: 'bg-[#00F0FF]' },
                  { id: 'hibrido', title: 'Modelo Híbrido', desc: 'Base fija + variable por cumplimiento de hitos.', icon: TrendingUp, color: 'bg-green-500' },
                ].map((model, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#00F0FF] transition-all group hover:shadow-2xl hover:shadow-gray-100">
                    <div className={`w-14 h-14 ${model.color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-xl group-hover:scale-110 transition-transform`}>
                      <model.icon className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-gray-900 text-lg mb-2 uppercase tracking-tight">{model.title}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">{model.desc}</p>
                    <button 
                      onClick={() => {
                        setSelectedModel(model);
                        setIsRulesModalOpen(true);
                      }}
                      className="w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Configurar Reglas
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
                <div className="p-4 bg-cyan-500/10 border border-yellow-100 rounded-xl text-left">
                  <p className="text-sm text-yellow-800 font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Pendiente de Liberación
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Comisiones retenidas (Facturas pendientes):</span>
                    <span className="font-bold text-gray-900">$2,450.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
