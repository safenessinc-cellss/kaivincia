import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, UploadCloud, BarChart3, 
  MessageSquare, Calendar, Receipt, ShieldAlert,
  Bell, CheckCircle2, AlertTriangle, Download, CreditCard,
  FolderKanban, GripVertical, FileText, CheckCircle, Clock,
  ChevronRight, BrainCircuit, Send, FileSignature
} from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [moraInvoices, setMoraInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  // Drag and drop state for files
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([
    { name: 'Assets_Marca.zip', size: '15MB', date: 'Hoy', status: 'Aprobado' }
  ]);
  
  const currentClientId = 'mock-client-id'; 

  useEffect(() => {
    const unsubInvoices = onSnapshot(
      query(collection(db, 'invoices'), where('clientId', '==', currentClientId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const invs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        setInvoices(invs);
        setMoraInvoices(invs.filter(i => i.status === 'Vencida' || i.status === 'En Mora'));
        setLoading(false);
      }
    );

    // Mock Notifications
    setNotifications([
      { id: '1', title: 'Nuevo Entregable', message: 'Fase 1: UI Kit está lista para tu aprobación.', read: false, type: 'alert' }
    ]);

    return () => {
      unsubInvoices();
    };
  }, []);

  const downloadInvoicePDF = (inv: any) => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(22);
    docPdf.text(`Factura Comercial B2B`, 20, 20);
    docPdf.setFontSize(12);
    docPdf.text(`ID Factura: ${inv.id}`, 20, 30);
    docPdf.text(`Fecha Emisión: ${new Date(inv.createdAt).toLocaleDateString()}`, 20, 40);
    docPdf.text(`Monto: $${inv.amount.toLocaleString()}`, 20, 50);
    docPdf.text(`Estado: ${inv.status}`, 20, 60);
    docPdf.save(`Factura_${inv.id}.pdf`);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFiles(prev => [...prev, {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
        date: 'Justo ahora',
        status: 'Revisión'
      }]);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const projectPhases = ['Planificación', 'Desarrollo', 'QA', 'Entrega'];
  const currentPhaseIndex = 1; // "Desarrollo"
  
  const hasMora = moraInvoices.length > 0;

  const hoursData = [
    { name: 'Consumidas', value: 85 },
    { name: 'Restantes', value: 35 }
  ];

  return (
    <div className="bg-[#0B0F19] min-h-screen text-gray-100 flex flex-col font-sans relative">
      
      {/* MORA BANNER */}
      {hasMora && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 shrink-0 backdrop-blur-md">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <p className="text-sm font-medium text-red-200">
                <strong className="text-red-400">Atención:</strong> Tienes acciones pendientes en tu cuenta para continuar con el flujo del proyecto.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('facturacion')}
              className="px-4 py-1.5 bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors"
            >
              Resolver Ahora
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1e3a8a] to-[#00F0FF] rounded-lg"></div>
              KAIVINCIA <span className="text-[#00F0FF] font-light">Portal</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B0F19]"></span>
              )}
            </button>
            <div className="h-8 w-8 bg-gray-800 rounded-full border border-gray-700 flex items-center justify-center text-xs font-bold text-[#00F0FF]">
              CL
            </div>
          </div>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="border-b border-white/5 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-6 flex overflow-x-auto hide-scrollbar">
          {[
            { id: 'dashboard', label: 'Resumen Proyecto', icon: LayoutDashboard },
            { id: 'data', label: 'Centro Documental', icon: UploadCloud },
            { id: 'facturacion', label: 'Facturación', icon: Receipt },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'border-b-2 border-[#00F0FF] text-[#00F0FF]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* TIMELINE VISUAL */}
              <div className="bg-[#111827] border border-white/5 p-8 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-[#1e3a8a]" /> Progreso del Proyecto Active
                </h3>
                
                <div className="relative">
                  {/* Pipeline line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -translate-y-1/2 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#1e3a8a] to-[#00F0FF] -translate-y-1/2 rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
                  
                  <div className="relative flex justify-between">
                    {projectPhases.map((phase, idx) => (
                      <div key={phase} className="flex flex-col items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center shrink-0 transition-colors z-10 ${
                          idx < currentPhaseIndex ? 'bg-[#00F0FF] border-[#111827]' :
                          idx === currentPhaseIndex ? 'bg-[#1e3a8a] border-[#111827] shadow-[0_0_15px_rgba(37,99,235,0.5)]' :
                          'bg-gray-800 border-[#111827]'
                        }`}>
                          {idx < currentPhaseIndex && <CheckCircle2 className="w-3 h-3 text-[##111827]" />}
                          {idx === currentPhaseIndex && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          idx <= currentPhaseIndex ? 'text-gray-200' : 'text-gray-600'
                        }`}>
                          {phase}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* QUICK APPROVAL WIDGET */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#111827] to-[#0f172a] border border-white/5 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <FileSignature className="w-48 h-48 text-[#00F0FF]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 relative z-10">Acción Requerida</h3>
                  <p className="text-sm text-gray-400 mb-8 relative z-10 max-w-md">El equipo ha entregado los wireframes de la Fase 1. Requerimos tu firma digital para proceder al desarrollo.</p>
                  
                  <div className="bg-[#0B0F19]/50 border border-white/10 p-4 rounded-2xl flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-200">Wireframes_Finales.pdf</p>
                        <p className="text-xs text-gray-500">Subido hace 2 horas</p>
                      </div>
                    </div>
                    <button 
                      disabled={hasMora}
                      onClick={() => setIsSignModalOpen(true)}
                      className="px-6 py-3 bg-[#00F0FF] hover:bg-[#00BFFF] text-white font-bold rounded-xl shadow-lg shadow-[#00F0FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Aprobar y Firmar
                    </button>
                  </div>
                </div>

                {/* HOURS CONSUMED WIDGET */}
                <div className="bg-[#111827] border border-white/5 p-8 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center relative">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest absolute top-6 left-6">Horas Consumidas</h3>
                  
                  <div className="w-48 h-48 mt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={hoursData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#1e3a8a" />
                          <Cell fill="#374151" />
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-white">85</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">de 120 hrs</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#111827] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                
                {/* DRAG & DROP AREA */}
                <div 
                  className={`p-12 border-b-2 border-dashed transition-colors flex flex-col items-center justify-center text-center ${
                    dragActive ? 'border-[#00F0FF] bg-[#00F0FF]/5' : 'border-gray-800 bg-[#0B0F19]/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <UploadCloud className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-200 mb-2">Arrastra tus archivos aquí</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm">Documentos, imágenes o reportes necesarios para el desarrollo del proyecto.</p>
                  <label className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-bold rounded-xl cursor-pointer transition-colors">
                    Examinar Equipo
                    <input type="file" className="hidden" />
                  </label>
                </div>

                {/* UPLOADED FILES LIST */}
                <div className="p-8">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Documentos Compartidos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="p-4 bg-[#0B0F19] border border-gray-800 rounded-2xl flex items-center gap-4 hover:border-gray-700 transition-colors">
                        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{file.size} • {file.date}</p>
                        </div>
                        <div>
                          <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] uppercase font-bold rounded-md">
                            {file.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facturacion' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-[#111827] border border-white/5 rounded-3xl p-8 shadow-2xl">
                 <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-bold text-white">Estado de Cuenta</h3>
                   {hasMora && (
                     <span className="px-4 py-1.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">
                       Saldo Vencido: ${moraInvoices.reduce((a, b) => a + b.amount, 0).toLocaleString()}
                     </span>
                   )}
                 </div>

                 <div className="overflow-x-auto hide-scrollbar">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-[#0B0F19] text-gray-500 font-medium uppercase text-xs">
                       <tr>
                         <th className="px-6 py-4 rounded-l-xl">Concepto</th>
                         <th className="px-6 py-4">Fecha</th>
                         <th className="px-6 py-4">Monto</th>
                         <th className="px-6 py-4">Estado</th>
                         <th className="px-6 py-4 rounded-r-xl text-right">Acción</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800/50">
                       {invoices.length === 0 ? (
                         <tr>
                           <td colSpan={5} className="py-12 text-center text-gray-600">No hay facturas emitidas.</td>
                         </tr>
                       ) : invoices.map(inv => (
                         <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 font-bold text-gray-300">{inv.items?.[0]?.description || 'Servicio'}</td>
                           <td className="px-6 py-4 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                           <td className="px-6 py-4 font-black text-gray-200">${inv.amount.toLocaleString()}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                                inv.status === 'Pagada' ? 'bg-green-500/20 text-green-400' :
                                inv.status === 'Vencida' ? 'bg-red-500/20 text-red-400' :
                                'bg-orange-500/20 text-orange-400'
                              }`}>
                                {inv.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right flex justify-end gap-2">
                             <button onClick={() => downloadInvoicePDF(inv)} className="p-2 text-gray-500 hover:text-white bg-gray-800 rounded-lg transition-colors">
                               <Download className="w-4 h-4" />
                             </button>
                             {inv.status !== 'Pagada' && (
                               <button className="p-2 text-white bg-[#00F0FF] hover:bg-[#00BFFF] rounded-lg transition-colors">
                                 <CreditCard className="w-4 h-4" />
                               </button>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* FLOATING AI CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen ? (
          <div className="bg-[#111827] border border-gray-700 w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B0F19] p-4 flex justify-between items-center border-b border-gray-800">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#00F0FF]" />
                <span className="font-bold text-gray-200 text-sm">Soporte IA</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 text-sm">
              <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-sm text-gray-300 self-start max-w-[85%]">
                Hola, soy el asistente de tu proyecto. ¿Necesitas revisar entregables, facturas o próximos pasos?
              </div>
              <div className="bg-[#1e3a8a] text-white p-3 rounded-2xl rounded-tr-sm self-end max-w-[85%]">
                ¿Cuándo terminamos la fase de Desarrollo?
              </div>
              <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-sm text-gray-300 self-start max-w-[85%]">
                Basado en tu Cronograma de Proyecto, la fase de Desarrollo termina el 15 de Noviembre. ¡Vamos un 45% adelantados!
              </div>
            </div>
            <div className="p-3 border-t border-gray-800 bg-[#0B0F19] flex gap-2">
              <input type="text" placeholder="Escribe aquí..." className="flex-1 bg-gray-800 border-none rounded-lg text-sm text-white px-3 focus:ring-1 focus:ring-[#00F0FF] outline-none" />
              <button className="p-2 bg-[#00F0FF] rounded-lg text-white hover:bg-[#00BFFF]">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#00F0FF] rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* QUICK APPROVAL MODAL */}
      {isSignModalOpen && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111827] border border-gray-700 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 text-center">Firma Digital</h3>
            <p className="text-sm text-gray-400 mb-6 text-center">Confirmo que he revisado y apruebo los "Wireframes_Finales.pdf".</p>
            
            <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold select-none">Firma aquí</p>
              <div className="h-24 w-full bg-gray-900/50 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-gray-600 italic">
                (Área para firma traza)
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsSignModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-gray-800 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={() => setIsSignModalOpen(false)} className="flex-1 py-3 bg-[#1e3a8a] text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

