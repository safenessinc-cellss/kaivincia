import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Database, UploadCloud, Activity, Target, 
  Users, PhoneCall, Calendar, ArrowRight, AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Search,
  Sparkles, Zap, ShieldCheck, Database as DBIcon, GraduationCap, Briefcase, DollarSign,
  Type, Calendar as CalendarIcon, Coins, Info, Trash2, Check, RefreshCw, TrendingUp, TrendingDown, History
} from 'lucide-react';
import Papa from 'papaparse';
import { collection, writeBatch, doc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

import IAAdvisor from '../components/IAAdvisor';

export default function Operations() {
  const [activeTab, setActiveTab] = useState('carga-datos');
  const navigate = useNavigate();
  
  // ETL State
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Validate, 4: Confirm
  const [isProcessing, setIsProcessing] = useState(false);
  const [destination, setDestination] = useState<'CRM' | 'Academia' | 'Talento' | 'Finanzas'>('CRM');
  const [cleanOptions, setCleanOptions] = useState<Record<number, boolean>>({});
  const [duplicateCheck, setDuplicateCheck] = useState<Set<string>>(new Set());
  
  // Banco de Datos State
  const [prospects, setProspects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'prospects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProspects(data);
      setDuplicateCheck(new Set(data.map(p => p.email).filter(Boolean)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'prospects'));

    return () => unsubscribe();
  }, []);

  const expectedColumns = [
    { id: 'name', label: 'Nombre Completo', type: Type, category: 'Texto' },
    { id: 'email', label: 'Correo Electrónico', type: Info, category: 'Email' },
    { id: 'phone', label: 'Teléfono', type: PhoneCall, category: 'Contacto' },
    { id: 'amount', label: 'Presupuesto/Monto', type: Coins, category: 'Moneda' },
    { id: 'date', label: 'Fecha de Registro', type: CalendarIcon, category: 'Fecha' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsProcessing(true);
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setHeaders(results.meta.fields || []);
          setParsedData(results.data);
          
          // Auto-Detección Inteligente
          const initialMapping: Record<string, string> = {};
          const fields = results.meta.fields || [];
          
          expectedColumns.forEach(col => {
            const match = fields.find(f => {
              const fLow = f.toLowerCase();
              const cLow = col.id.toLowerCase();
              const lLow = col.label.toLowerCase();
              return fLow.includes(cLow) || 
                     fLow.includes(lLow.split(' ')[0]) || 
                     (cLow === 'name' && (fLow.includes('customer') || fLow.includes('cliente'))) ||
                     (cLow === 'amount' && (fLow.includes('price') || fLow.includes('total')));
            });
            if (match) initialMapping[col.id] = match;
          });
          
          setMapping(initialMapping);
          setTimeout(() => {
            setIsProcessing(false);
            setStep(2);
          }, 2000); // Simulate "Scanner" delay
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          setIsProcessing(false);
          alert("Error al leer el archivo CSV.");
        }
      });
    }
  };

  const getImportHealth = () => {
    if (parsedData.length === 0) return 100;
    let score = 100;
    expectedColumns.forEach(col => {
      const isMapped = mapping[col.id];
      if (!isMapped) score -= (100 / expectedColumns.length) / 2;
      else {
        const emptyCount = parsedData.filter(row => !row[isMapped]).length;
        score -= (emptyCount / parsedData.length) * (100 / expectedColumns.length);
      }
    });
    return Math.max(0, Math.round(score));
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const collectionName = destination === 'CRM' ? 'prospects' : 
                            destination === 'Academia' ? 'academic_records' :
                            destination === 'Talento' ? 'job_applications' : 'invoices';

      parsedData.forEach((row, idx) => {
        const mappedRow: any = {
          createdAt: new Date().toISOString(),
          source: 'ETL Import',
          importBatchId: Date.now().toString()
        };

        expectedColumns.forEach(col => {
          const sourceHeader = mapping[col.id];
          let val = sourceHeader ? row[sourceHeader] : '';
          
          // Clean logic
          if (cleanOptions[idx] && typeof val === 'string') {
            val = val.trim().replace(/\s+/g, ' ');
            if (col.id === 'name') val = val.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
          }
          
          mappedRow[col.id] = val;
        });

        const docRef = doc(collection(db, collectionName));
        batch.set(docRef, mappedRow);
      });
      
      await batch.commit();
      setStep(4);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'import');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (prospects.length === 0) return;
    const csv = Papa.unparse(prospects.map(({ id, ...rest }) => rest));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `prospectos_kaivincia_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setMapping({});
    setStep(1);
    setCleanOptions({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Operaciones</h2>
          <p className="text-sm text-gray-500 mt-1">Centro de control de producción y carga de datos</p>
        </div>
      </div>

      {/* Hero Illustration */}
      <div className="w-full aspect-[21/6] md:aspect-[21/4] rounded-3xl overflow-hidden relative border border-gray-200 group shrink-0">
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
         <img 
           src="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1600&q=80" 
           alt="Sala de Control Operativa" 
           className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
         />
         <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
            <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">Sala de Control y Operaciones</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE] animate-pulse" />
              <span className="text-[10px] font-mono text-[#22D3EE] uppercase tracking-[0.2em] drop-shadow-md">organized tactical dashboard with floating 3D charts & glass-textured globe</span>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'sala-control', label: 'Sala de Control (Productividad)', icon: Activity },
            { id: 'carga-datos', label: 'Importación Inteligente (ETL)', icon: UploadCloud },
            { id: 'banco-datos', label: 'Banco de Datos', icon: Database },
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
          
          {/* SALA DE CONTROL */}
          {activeTab === 'sala-control' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <IAAdvisor 
                moduleName="Sala de Control"
                insights={[
                  {
                    type: 'alert',
                    message: "Baja de Producción Detectada: El termómetro está al 72%. Priorizando automáticamente Leads Calientes en el Pipeline Comercial para compensar.",
                    action: { label: "Ver Pipeline", onClick: () => navigate('/crm/pipeline') }
                  },
                  {
                    type: 'success',
                    message: "Sincronización de Setters: Los TOP performers han aumentado su Show Rate un 12% tras la última actualización del Script IA."
                  }
                ]}
              />
              {/* TOP GRID: ENERGY CENTER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* TERMÓMETRO DE PRODUCCIÓN (Neon Gauge) */}
                <div className="lg:col-span-5 bg-[#0B0E14] border border-[#1F2937] rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group hover:border-[#A855F7]/30 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/5 to-transparent pointer-events-none" />
                  
                  <div className="relative w-72 h-72">
                    {/* Background Ring */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="144"
                        cy="144"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-900"
                      />
                      {/* Dynamic Ring */}
                      <motion.circle
                        cx="144"
                        cy="144"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 120}
                        initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                        animate={{ strokeDashoffset: (2 * Math.PI * 120) * (1 - 0.72) }}
                        fill="transparent"
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ${
                          18 > 20 ? 'text-[#10B981] drop-shadow-[0_0_15px_#10B981]' :
                          18 > 10 ? 'text-[#F59E0B] drop-shadow-[0_0_15px_#F59E0B]' :
                          'text-[#EF4444] animate-pulse drop-shadow-[0_0_15px_#EF4444]'
                        }`}
                      />
                    </svg>
                    
                    {/* Central Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-6xl font-black text-white italic tracking-tighter">72%</span>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-2">Capacidad Nodo</span>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3 justify-center">
                       <Zap className={`w-5 h-5 ${18 > 20 ? 'text-[#10B981]' : 'text-[#F59E0B]'}`} /> 18 / 25 Citas Hoy
                    </h3>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2">Meta de Producción Operativa</p>
                  </div>
                </div>

                {/* EMBUDO VISUAL EN VIVO (Liquid Funnel) */}
                <div className="lg:col-span-7 bg-[#0B0E14] border border-[#1F2937] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group hover:border-cyan-500/20 transition-all flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                     <div>
                        <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Liquid Funnel System</h3>
                        <p className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.3em]">Live Conversion Link</p>
                     </div>
                     <div className="flex gap-4">
                        <div className="text-right">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Inbound Flow</p>
                           <p className="text-sm font-black text-white tracking-tighter">145 Calls</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-3 relative">
                     {[
                       { label: 'Nuevos', value: 120, total: 150, color: 'bg-blue-500', icon: Users },
                       { label: 'Contactados', value: 65, total: 120, color: 'bg-indigo-500', icon: PhoneCall },
                       { label: 'Interesados', value: 30, total: 65, color: 'bg-violet-500', icon: Target },
                       { label: 'Citas', value: 18, total: 30, color: 'bg-[#00F0FF]', icon: Calendar },
                       { label: 'Confirmadas', value: 15, total: 18, color: 'bg-emerald-500', icon: CheckCircle2 }
                     ].map((stage, idx) => (
                       <div key={idx} className="flex items-center gap-6 group/stage relative">
                          {/* Connector Line */}
                          {idx < 4 && (
                            <div className="absolute left-[20px] top-full h-3 w-[1px] bg-white/10 z-0" />
                          )}
                          
                          <div className={`h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover/stage:text-white transition-colors z-10`}>
                             <stage.icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 h-12 bg-[#161B22]/50 backdrop-blur-md rounded-2xl border border-white/5 flex items-center px-6 relative overflow-hidden group-hover/stage:border-white/10 transition-all">
                             {/* Liquid Fill */}
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(stage.value / stage.total) * 100}%` }}
                               className={`absolute left-0 top-0 bottom-0 ${stage.color} opacity-20`}
                             />
                             <div className="flex-1 flex justify-between items-center relative z-10">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{stage.label}</span>
                                <div className="flex items-center gap-3">
                                   <span className="text-sm font-black text-white italic tracking-tighter">{stage.value}</span>
                                   <span className="text-[9px] font-black text-gray-600 uppercase">/ {stage.total}</span>
                                </div>
                             </div>
                             
                             {/* Liquid Glow Line */}
                             <motion.div 
                               initial={{ x: '-100%' }}
                               animate={{ x: '100%' }}
                               transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                               className="absolute bottom-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                             />
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* BOTTOM GRID: LEADERBOARD & KPIS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Ranking En Vivo (Top Setters) */}
                <div className="lg:col-span-8 bg-[#0B0E14] border border-[#1F2937] rounded-[3rem] p-10">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                         <TrendingUp className="w-5 h-5 text-[#A855F7]" /> Top Output Setters
                      </h3>
                      <button className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Ver Escalafón Completo</button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { name: 'Ana Silva', citas: 6, rate: 75, trend: 'up' },
                        { name: 'Carlos Ruiz', citas: 5, rate: 80, trend: 'up' },
                        { name: 'Maria Gomez', citas: 4, rate: 65, trend: 'down' },
                      ].map((setter, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden">
                           <div className="absolute top-4 right-4">
                              <div className={`p-1.5 rounded-lg ${setter.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_#10B98133]' : 'bg-red-500/10 text-red-500 shadow-[0_0_10px_#EF444433]'}`}>
                                 {setter.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              </div>
                           </div>
                           
                           <div className="flex flex-col items-center mb-6">
                              <div className="relative mb-4">
                                 <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#222] to-black border border-white/10 flex items-center justify-center text-xl font-black text-white italic group-hover:rotate-6 transition-transform">
                                    {setter.name.charAt(0)}
                                 </div>
                                 <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-[#A855F7] rounded-full border-4 border-[#0B0E14] flex items-center justify-center text-[9px] font-black text-white">
                                    {i + 1}
                                 </div>
                              </div>
                              <h4 className="text-xs font-black text-white uppercase tracking-tighter italic">{setter.name}</h4>
                              <p className="text-[9px] font-black text-[#A855F7] uppercase tracking-widest mt-1">Lead Setter</p>
                           </div>

                           <div className="space-y-4">
                              <div className="flex justify-between items-center px-1">
                                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Show Rate</span>
                                 <span className="text-[10px] font-black text-emerald-500 italic">{setter.rate}%</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${setter.rate}%` }}
                                   className="h-full bg-emerald-500 shadow-[0_0_10px_#10B981]"
                                 />
                              </div>
                              <div className="flex justify-between items-center text-center p-3 bg-black/40 rounded-xl">
                                 <div className="flex-1">
                                    <p className="text-[8px] font-black text-gray-500 uppercase mb-0.5">Citas</p>
                                    <p className="text-sm font-black text-white italic tracking-tighter">{setter.citas}</p>
                                 </div>
                                 <div className="w-[1px] h-4 bg-white/5" />
                                 <div className="flex-1">
                                    <p className="text-[8px] font-black text-gray-500 uppercase mb-0.5">Ranking</p>
                                    <p className="text-sm font-black text-white italic tracking-tighter">#{i + 1}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Micro KPIs Column */}
                <div className="lg:col-span-4 space-y-6">
                   <div className="bg-[#0B0E14] border border-[#1F2937] rounded-[3rem] p-8 group hover:border-[#00F0FF]/30 transition-all">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="h-10 w-10 bg-[#00F0FF]/10 rounded-xl flex items-center justify-center text-[#00F0FF]">
                            <History className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Uptime Operativo</h4>
                            <p className="text-sm font-black text-white italic tracking-tighter uppercase">99.9% Node Ready</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                         {[
                           { label: 'Efectividad CRM', value: '42%', color: 'text-blue-500' },
                           { label: 'Latencia IA', value: '142ms', color: 'text-amber-500' }
                         ].map(kpi => (
                           <div key={kpi.label} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</span>
                              <span className={`text-xs font-black ${kpi.color} italic tracking-tighter`}>{kpi.value}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-gradient-to-br from-[#A855F7]/20 to-transparent border border-[#A855F7]/30 rounded-[3rem] p-8 text-center shadow-2xl relative overflow-hidden group">
                      <div className="relative z-10">
                         <Sparkles className="w-8 h-8 text-[#A855F7] mx-auto mb-4 animate-pulse" />
                         <h4 className="text-xs font-black text-white uppercase italic tracking-tighter">Insights de IA Kaivincia</h4>
                         <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                            "Aumentando el ritmo de llamadas a leads de LinkedIn, podríamos cerrar la brecha de la meta diaria en 45 minutos."
                         </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
             {/* IMPORTACIÓN INTELIGENTE (ETL) */}
          {activeTab === 'carga-datos' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header & Health Section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-3">
                       <Zap className="w-8 h-8 text-[#A855F7]" /> Inyección de Datos ETL
                    </h3>
                    <p className="text-gray-500 font-mono text-[10px] mt-1">SISTEMA DE MIGRACIÓN KAIVINCIA v4.2 // CLOUD-CORE-SYNC</p>
                 </div>

                 {step > 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salud de Importación</p>
                          <div className="flex items-center gap-2">
                             <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${getImportHealth()}%` }}
                                   className={`h-full ${getImportHealth() > 80 ? 'bg-emerald-500' : getImportHealth() > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                />
                             </div>
                             <span className="text-sm font-black italic">{getImportHealth()}%</span>
                          </div>
                       </div>
                    </motion.div>
                 )}
              </div>

              {/* Steps Progress */}
              <div className="grid grid-cols-4 gap-2">
                 {[
                   { id: 1, label: 'INGESTA' },
                   { id: 2, label: 'MAPEO' },
                   { id: 3, label: 'VALIDACIÓN' },
                   { id: 4, label: 'DESPLIEGUE' }
                 ].map((s) => (
                   <div key={s.id} className="relative">
                      <div className={`h-1 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-[#A855F7] shadow-[0_0_10px_#A855F7]' : 'bg-gray-200'}`} />
                      <p className={`mt-2 text-[9px] font-black tracking-[0.2em] ${step >= s.id ? 'text-[#A855F7]' : 'text-gray-300'}`}>{s.label}</p>
                   </div>
                 ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative group"
                  >
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#A855F7]', 'bg-[#A855F7]/5'); }}
                      onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-[#A855F7]', 'bg-[#A855F7]/5'); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedFile = e.dataTransfer.files[0];
                        if (droppedFile && droppedFile.name.endsWith('.csv')) {
                          const event = { target: { files: [droppedFile] } } as any;
                          handleFileUpload(event);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-96 bg-[#0B0E14] border-2 border-dashed border-gray-800 rounded-[3rem] flex flex-col items-center justify-center p-12 cursor-pointer transition-all hover:border-[#A855F7]/50 relative overflow-hidden group/drop"
                    >
                       {/* Scanner Ray Effect during processing */}
                       {isProcessing && (
                         <motion.div 
                           initial={{ top: '-10%' }}
                           animate={{ top: '110%' }}
                           transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                           className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_#22D3EE] z-10"
                         />
                       )}

                       <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/5 to-transparent opacity-0 group-hover/drop:opacity-100 transition-opacity" />
                       
                       <div className={`relative z-20 flex flex-col items-center transition-all ${isProcessing ? 'scale-90 opacity-50' : 'group-hover:scale-110'}`}>
                          <div className="h-24 w-24 rounded-full bg-[#A855F7]/10 flex items-center justify-center mb-6 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all">
                             <UploadCloud className="w-10 h-10 text-[#A855F7]" />
                          </div>
                          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Drop CSV Data Stream</h3>
                          <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest">ENCRYPTED-NODE-TRANSFER</p>
                       </div>
                       
                       <input 
                         type="file" 
                         accept=".csv" 
                         ref={fileInputRef}
                         onChange={handleFileUpload}
                         className="hidden" 
                       />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                  >
                    {/* Mapping Table */}
                    <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                       <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                          <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Mapeo Dinámico de Columnas</h4>
                          <span className="text-[10px] font-mono bg-black text-white px-3 py-1 rounded-full uppercase tracking-widest">Auto-Detect Active</span>
                       </div>
                       
                       <table className="w-full">
                          <thead>
                             <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Dato del Archivo</th>
                                <th className="px-8 py-4 text-center"></th>
                                <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Campo Kaivincia</th>
                                <th className="px-8 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Limpiar</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {expectedColumns.map(col => (
                               <tr key={col.id} className="group hover:bg-gray-50/50 transition-colors">
                                  <td className="px-8 py-6">
                                     <select 
                                       value={mapping[col.id] || ''}
                                       onChange={(e) => setMapping({...mapping, [col.id]: e.target.value})}
                                       className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#A855F7] outline-none"
                                     >
                                       <option value="">-- Ignorar Campo --</option>
                                       {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                     </select>
                                  </td>
                                  <td className="px-4 py-6 text-center">
                                     <ArrowRight className="w-4 h-4 text-gray-300 inline" />
                                  </td>
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-[#A855F7]/5 rounded-lg flex items-center justify-center text-[#A855F7]">
                                           <col.type className="w-4 h-4" />
                                        </div>
                                        <div>
                                           <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">{col.label}</p>
                                           <p className="text-[9px] text-gray-400 uppercase font-mono">{col.category}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                     <button 
                                       onClick={() => {
                                         const newClean = { ...cleanOptions };
                                         parsedData.forEach((_, i) => newClean[i] = !newClean[i]);
                                         setCleanOptions(newClean);
                                       }}
                                       className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                         Object.values(cleanOptions).some(v => v) ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                                       }`}
                                     >
                                        {Object.values(cleanOptions).some(v => v) ? <Check className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                                        Toggle Clean
                                     </button>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    {/* Destination & Summary */}
                    <div className="lg:col-span-4 space-y-6">
                       <div className="bg-[#0B0E14] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-10">
                             <DBIcon className="w-24 h-24" />
                          </div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A855F7] mb-8">Data Destination</h4>
                          <div className="grid grid-cols-2 gap-3">
                             {[
                               { id: 'CRM', icon: Users, label: 'CRM Leads' },
                               { id: 'Academia', icon: GraduationCap, label: 'Academy' },
                               { id: 'Talento', icon: Briefcase, label: 'Talent' },
                               { id: 'Finanzas', icon: DollarSign, label: 'Finance' }
                             ].map(d => (
                               <button 
                                 key={d.id}
                                 onClick={() => setDestination(d.id as any)}
                                 className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                                   destination === d.id ? 'bg-[#A855F7] border-[#A855F7] text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                 }`}
                               >
                                  <d.icon className="w-5 h-5" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">{d.label}</span>
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Import Intel</h4>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                <span className="text-xs font-bold text-gray-500">Rows Detected</span>
                                <span className="text-sm font-black italic">{parsedData.length}</span>
                             </div>
                             
                             {/* Duplicate Detection Alert */}
                             {parsedData.some(row => duplicateCheck.has(row[mapping['email']])) && (
                               <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600">
                                  <AlertTriangle className="w-5 h-5" />
                                  <div className="flex-1">
                                     <p className="text-[10px] font-black uppercase tracking-widest">Duplicado Detectado</p>
                                     <p className="text-[9px] font-medium opacity-70">Emails ya existen en el Banco de Datos.</p>
                                  </div>
                                  <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-full">
                                    {parsedData.filter(row => duplicateCheck.has(row[mapping['email']])).length}
                                  </span>
                               </div>
                             )}
                          </div>

                          <button 
                            onClick={handleConfirm}
                            disabled={isProcessing || getImportHealth() < 10}
                            className="w-full mt-8 py-5 bg-[#A855F7] text-white rounded-2xl font-black uppercase tracking-[0.2em] italic text-[10px] shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                          >
                             {isProcessing ? 'Sincronizando...' : 'Ejecutar Inyección'}
                          </button>
                          <button onClick={resetImport} className="w-full mt-2 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Abortar Operación</button>
                       </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                     <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute inset-0 border-2 border-emerald-500 rounded-full"
                        />
                        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                     </div>
                     <h3 className="text-4xl font-black text-gray-900 italic tracking-tighter uppercase mb-4">Transferencia Exitosa</h3>
                     <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-10">
                        Los datos han sido inyectados en el nodo <span className="font-black text-black">[{destination}]</span>. Se ha actualizado la red de clientes y el Pipeline sincronizará los nuevos registros de forma asíncrona.
                     </p>
                     
                     <div className="flex justify-center gap-4">
                        <button 
                          onClick={resetImport}
                          className="px-8 py-4 bg-gray-50 text-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-all"
                        >
                          Cargar Nuevo Stream
                        </button>
                        <button 
                          onClick={() => navigate('/crm/clients')}
                          className="px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all"
                        >
                          Ir al Centro de Control
                        </button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* BANCO DE DATOS */}
          {activeTab === 'banco-datos' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#00F0FF]" /> Banco de Datos Global
                </h3>
                <button 
                  onClick={handleExportCSV}
                  disabled={prospects.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-black transition-all disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 rotate-180" /> Exportar CSV
                </button>
              </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Buscar prospecto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#00F0FF]"
                    />
                  </div>
                  <select className="bg-gray-50 border border-gray-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-[#00F0FF]">
                    <option value="">Todos los Distribuidores</option>
                    <option value="dist1">Distribuidor Norte</option>
                    <option value="dist2">Distribuidor Sur</option>
                  </select>
                  <select className="bg-gray-50 border border-gray-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-[#00F0FF]">
                    <option value="">Todos los Proyectos</option>
                    <option value="proj1">Proyecto Solar</option>
                    <option value="proj2">Proyecto Fibra</option>
                  </select>
                  <select className="bg-gray-50 border border-gray-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-[#00F0FF]">
                    <option value="">Cualquier Estado</option>
                    <option value="new">Nuevo</option>
                    <option value="contacted">Contactado</option>
                    <option value="converted">Convertido</option>
                  </select>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Prospecto</th>
                        <th className="px-6 py-3">Distribuidor</th>
                        <th className="px-6 py-3">Proyecto</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3">Último Contacto</th>
                        <th className="px-6 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {prospects
                        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((row, i) => (
                        <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <div>
                              <p>{row.name}</p>
                              <p className="text-[10px] text-gray-400">{row.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{row.distributor || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-600">{row.project || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              row.status === 'Nuevo' ? 'bg-blue-100 text-blue-700' :
                              row.status === 'Contactado' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{row.lastContact ? new Date(row.lastContact).toLocaleDateString() : 'Nunca'}</td>
                          <td className="px-6 py-4">
                            <button className="text-[#00F0FF] hover:underline font-medium">Gestionar</button>
                          </td>
                        </tr>
                      ))}
                      {prospects.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No hay prospectos en el banco de datos. Importa un archivo para comenzar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                  <p>Mostrando {prospects.length} prospectos</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Anterior</button>
                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Siguiente</button>
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
