import React, { useState, useEffect } from 'react';
import { 
  MapPin, Camera, CheckCircle2, ChevronRight, Navigation, 
  Map as MapIcon, Image as ImageIcon, Send, Star, 
  Target, ShieldCheck, Zap, AlertCircle, Clock, Sparkles, 
  FileText, ScanLine, Smartphone, Check, FileSignature
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// import { db } from '../firebase';
// import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import IAAdvisor from '../components/IAAdvisor';
import SaleSuccessView from '../components/SaleSuccessView';

interface Visit {
  id: string;
  clientName: string;
  address: string;
  status: 'pending' | 'checked-in' | 'completed';
  scheduledTime: string;
}

export default function TacticalDeployment() {
  const [visits, setVisits] = useState<Visit[]>([
    { id: 'v1', clientName: 'BioTech Solutions', address: 'Av. Industrial 450, S1', status: 'pending', scheduledTime: '14:30' },
    { id: 'v2', clientName: 'Quantum Logistics', address: 'Calle 50 #12-34', status: 'pending', scheduledTime: '16:00' },
    { id: 'v3', clientName: 'Alpha Industries', address: 'Parque Tecnológico Norte', status: 'completed', scheduledTime: '11:00' },
  ]);
  
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [activeTab, setActiveTab] = useState<'gps' | 'evidence' | 'report'>('gps');
  
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const [photos, setPhotos] = useState<{fachada: string | null, doc: string | null, aborto: string | null}>({
    fachada: null, doc: null, aborto: null
  });

  const [decision, setDecision] = useState<'VENTA CERRADA' | 'SEGUIMIENTO' | 'ABORTO/NO UBICADO' | ''>('');
  const [satisfaction, setSatisfaction] = useState(3);
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  const pendingVisits = visits.filter(v => v.status !== 'completed');
  const upcomingVisit = pendingVisits.length > 0 ? pendingVisits[0] : null;

  const handleCheckIn = () => {
    setIsLocating(true);
    setTimeout(() => {
      setLocation({ lat: 40.7128, lng: -74.0060 });
      setCheckInTime(new Date().toISOString());
      setIsLocating(false);
      setActiveTab('evidence');
      if (activeVisit) {
        setVisits(vs => vs.map(v => v.id === activeVisit.id ? { ...v, status: 'checked-in' } : v));
        setActiveVisit({ ...activeVisit, status: 'checked-in' });
      }
    }, 1500);
  };

  const handleCapturePhoto = (type: 'fachada' | 'doc' | 'aborto') => {
    const randomId = Math.floor(Math.random() * 1000);
    setPhotos(prev => ({ ...prev, [type]: `https://picsum.photos/seed/${randomId}/400/300` }));
  };

  const handleSubmit = () => {
    if (!activeVisit || !decision) return;
    
    if (decision === 'ABORTO/NO UBICADO' && !photos.aborto) {
      alert("Para marcación de Aborto, debe adjuntar fotografía de la puerta / local en la pestaña Evidencia.");
      setActiveTab('evidence');
      return;
    }
    if (decision === 'VENTA CERRADA' && (!photos.fachada || !photos.doc)) {
      alert("Para Venta Cerrada se requiere foto de fachada y documento en Evidencia.");
      setActiveTab('evidence');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setVisits(vs => vs.map(v => v.id === activeVisit.id ? { ...v, status: 'completed' } : v));
      
      if (decision === 'VENTA CERRADA') {
        setSuccessData({
          invoiceId: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: '$' + (Math.random() * 5000 + 1000).toFixed(2),
          clientEmail: 'contacto@' + activeVisit.clientName.toLowerCase().replace(' ', '') + '.com'
        });
      }

      // Reset
      if (decision !== 'VENTA CERRADA') {
         setActiveVisit(null);
         setLocation(null);
         setCheckInTime(null);
         setPhotos({fachada: null, doc: null, aborto: null});
         setDecision('');
         setNotes('');
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)] bg-[#05070A] text-white">
      
      {/* Sidebar: Hoja de Ruta */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#020407] flex flex-col shrink-0">
         <div className="p-6 border-b border-[#1E293B]">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#22D3EE] flex items-center gap-3">
               <Navigation className="w-6 h-6" /> Táctico Field
            </h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Operator Node: Active</p>
         </div>
         <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <MapIcon className="w-3.5 h-3.5" /> Hoja de Ruta Hoy
            </h3>
            <div className="space-y-4">
               {visits.map(visit => (
                 <button 
                   key={visit.id}
                   onClick={() => { 
                     if (visit.status !== 'completed') {
                       setActiveVisit(visit); 
                       setActiveTab('gps');
                       if (visit.id !== activeVisit?.id) {
                         setLocation(null);
                         setCheckInTime(null);
                         setPhotos({fachada: null, doc: null, aborto: null});
                         setDecision('');
                         setNotes('');
                       }
                     }
                   }}
                   className={`w-full p-4 transition-all rounded-2xl border text-left flex items-start justify-between group ${
                     activeVisit?.id === visit.id 
                     ? 'bg-[#22D3EE]/10 border-[#22D3EE]/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                     : visit.status === 'completed'
                       ? 'bg-transparent border-[#1E293B] opacity-40'
                       : 'bg-white/[0.02] border-[#1E293B] hover:border-[#22D3EE]/30'
                   }`}
                 >
                    <div>
                       <h4 className={`text-sm font-black uppercase tracking-tight ${activeVisit?.id === visit.id ? 'text-[#22D3EE]' : 'text-gray-100'}`}>
                         {visit.clientName}
                       </h4>
                       <p className="text-[10px] text-gray-500 font-mono mt-1 mb-3">{visit.address}</p>
                       <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest ${
                            visit.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            visit.status === 'checked-in' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-white/10 text-gray-400'
                          }`}>
                             {visit.status === 'completed' ? 'Completado' : visit.status === 'checked-in' ? 'En Curso' : visit.scheduledTime}
                          </span>
                       </div>
                    </div>
                    {visit.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {visit.status !== 'completed' && <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${activeVisit?.id === visit.id ? 'text-[#22D3EE]' : 'text-gray-600'}`} />}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Main Execution Content */}
      <div className="flex-1 flex flex-col overflow-y-auto relative p-6 lg:p-10 space-y-8 bg-[#05070A]">
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />

         {!activeVisit ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full relative z-10 h-full min-h-[400px]">
               <div className="w-24 h-24 bg-[#1E293B] rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#22D3EE]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-in-out" />
                  <Target className="w-10 h-10 text-gray-500 group-hover:text-[#22D3EE] transition-colors relative z-10" />
               </div>
               <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-300">Terminal Táctica en Espera</h2>
               <p className="text-sm font-mono text-gray-500 mt-2">Seleccione un objetivo en la hoja de ruta para iniciar protocolo.</p>
               
               {upcomingVisit && (
                  <button 
                    onClick={() => { setActiveVisit(upcomingVisit); setActiveTab('gps'); }}
                    className="mt-8 px-6 py-3 bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/30 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#22D3EE] hover:text-[#05070A] transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  >
                     Fijar Blanco: {upcomingVisit.clientName}
                  </button>
               )}
            </div>
         ) : (
            <div className="max-w-4xl mx-auto w-full relative z-10 space-y-8 pb-10">
               
               {/* IA Advisor Component - Scanning Effect */}
               <div className="bg-[#0A0D14] border border-[#1E293B] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-1 bg-[#22D3EE]" />
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-[#22D3EE]/50 animate-[scan_2s_ease-in-out_infinite]" />
                  
                  <div className="p-2 bg-[#22D3EE]/10 rounded-lg shrink-0 w-9 h-9 flex justify-center items-center">
                     <ScanLine className="w-5 h-5 text-[#22D3EE] animate-pulse" />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Neural Link Advisor</h4>
                     <p className="text-xs font-mono text-[#22D3EE]">
                        Despliegue activo en {activeVisit.clientName}. Objetivos a {Math.floor(Math.random() * 300 + 50)}m. Recomendación: Proceder al Check-in Radarsat.
                     </p>
                  </div>
               </div>

               {/* Target Header */}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-[#1E293B] text-gray-400 text-[9px] font-black uppercase tracking-widest rounded">Misión Activa</span>
                        {location && <span className="px-2 py-0.5 bg-[#22D3EE]/10 text-[#22D3EE] text-[9px] font-black uppercase tracking-widest rounded border border-[#22D3EE]/20">Posición Fijada</span>}
                     </div>
                     <h1 className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg">
                        {activeVisit.clientName}
                     </h1>
                     <p className="text-sm font-mono text-gray-400 mt-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#22D3EE]" /> {activeVisit.address}
                     </p>
                  </div>
               </div>

               {/* Tabs Navigation */}
               <div className="flex bg-[#0A0D14] p-1 rounded-xl border border-[#1E293B] overflow-x-auto hide-scrollbar">
                  {[
                    { id: 'gps', icon: MapIcon, label: 'Radarsat (GPS)' },
                    { id: 'evidence', icon: Camera, label: 'Captura Visual' },
                    { id: 'report', icon: FileSignature, label: 'Veredicto' },
                  ].map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id as any)}
                       className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                         activeTab === tab.id 
                         ? 'bg-[#1E293B] text-white shadow-sm' 
                         : 'text-gray-500 hover:text-gray-300'
                       }`}
                     >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#22D3EE]' : ''}`} />
                        {tab.label}
                     </button>
                  ))}
               </div>

               {/* TAB 1: RADARSAT (GPS) */}
               {activeTab === 'gps' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     <div className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden border border-[#1E293B] bg-[#0A0D14]">
                        {/* Fake Map Background */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-30 grayscale mix-blend-luminosity" />
                        
                        {/* Scanner sweep effect */}
                        {isLocating && (
                           <div className="absolute inset-0 z-10 pointer-events-none">
                              <div className="w-full h-2 bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent shadow-[0_0_20px_#22D3EE] animate-[mapScan_3s_linear_infinite]" />
                           </div>
                        )}

                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                           {!location && !isLocating && (
                              <button 
                                onClick={handleCheckIn}
                                className="px-8 py-4 bg-[#22D3EE] text-[#05070A] font-black uppercase italic tracking-[0.2em] rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center gap-3 hover:bg-[#1bbad3] hover:scale-105 active:scale-95 transition-all text-sm md:text-base"
                              >
                                 <Navigation className="w-5 h-5" /> Iniciar Despliegue
                              </button>
                           )}

                           {isLocating && (
                              <div className="flex flex-col items-center gap-4">
                                 <div className="w-16 h-16 border-4 border-[#22D3EE]/20 border-t-[#22D3EE] rounded-full animate-spin" />
                                 <div className="bg-[#05070A]/80 backdrop-blur px-4 py-2 rounded-lg border border-[#22D3EE]/30">
                                   <p className="text-xs font-mono text-[#22D3EE] tracking-widest uppercase animate-pulse">Triangulando Coordenadas...</p>
                                 </div>
                              </div>
                           )}

                           {location && !isLocating && (
                              <div className="flex flex-col items-center gap-4 transform scale-110">
                                 <div className="w-12 h-12 bg-[#22D3EE]/20 border-2 border-[#22D3EE] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                                    <div className="w-3 h-3 bg-[#22D3EE] rounded-full animate-ping" />
                                 </div>
                                 <div className="bg-[#05070A]/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-[#10B981]/50 text-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                    <div className="flex items-center justify-center gap-2 text-[#10B981] mb-2">
                                       <ShieldCheck className="w-5 h-5" />
                                       <span className="text-[10px] font-black uppercase tracking-[0.3em]">CISO Verified</span>
                                    </div>
                                    <p className="text-[10px] font-mono text-gray-400">LAT: {location.lat.toFixed(4)} // LNG: {location.lng.toFixed(4)}</p>
                                    <p className="text-[10px] font-mono text-gray-400 mt-1">TS: {checkInTime}</p>
                                    <p className="text-[10px] font-mono text-gray-400 mt-1">CELL ID: CX-889-VF</p>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     {location && (
                        <div className="flex justify-end">
                           <button onClick={() => setActiveTab('evidence')} className="flex items-center gap-2 text-[#22D3EE] text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
                              Continuar a Evidencia <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                     )}
                  </motion.div>
               )}

               {/* TAB 2: EVIDENCIA VISUAL */}
               {activeTab === 'evidence' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     
                     <div className="bg-[#10B981]/10 border border-[#10B981]/20 p-4 rounded-xl flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                        <div>
                           <h4 className="text-xs font-black uppercase tracking-widest text-[#10B981] mb-1">Directiva ISO 9001</h4>
                           <p className="text-[10px] font-mono text-gray-400">La captura visual de la fachada es obligatoria para validar la trazabilidad operativa del despliegue.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Slot 1: Fachada */}
                        <div className="bg-[#0A0D14] border border-[#1E293B] rounded-2xl p-4 flex flex-col items-center justify-center aspect-[4/3] relative overflow-hidden group">
                           {photos.fachada ? (
                              <>
                                 <img src={photos.fachada} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                 <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#05070A] to-transparent p-4 z-10">
                                    <div className="flex justify-between items-end">
                                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 drop-shadow-md">Fachada Registrada</span>
                                       <span className="text-[8px] font-mono text-gray-300">LAT/LNG incrustado</span>
                                    </div>
                                 </div>
                                 <button onClick={() => setPhotos(p => ({...p, fachada: null}))} className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-lg backdrop-blur-sm z-20 hover:bg-red-500 transition-colors">
                                    <Camera className="w-4 h-4 text-white" />
                                 </button>
                              </>
                           ) : (
                              <button onClick={() => handleCapturePhoto('fachada')} className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-[#22D3EE] transition-colors">
                                 <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center group-hover:bg-[#22D3EE]/10 group-hover:scale-110 transition-all">
                                    <Camera className="w-8 h-8" />
                                 </div>
                                 <span className="text-xs font-black uppercase tracking-widest text-center">Fachada / Entorno<span className="text-red-500 ml-1">*</span></span>
                              </button>
                           )}
                        </div>

                        {/* Slot 2: Documento */}
                        <div className="bg-[#0A0D14] border border-[#1E293B] rounded-2xl p-4 flex flex-col items-center justify-center aspect-[4/3] relative overflow-hidden group">
                           {photos.doc ? (
                              <>
                                 <img src={photos.doc} className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale brightness-125" />
                                 <div className="absolute inset-0 pointer-events-none border-2 border-[#22D3EE]/30 m-4 rounded" />
                                 <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#05070A] to-transparent p-4 z-10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#22D3EE] drop-shadow-md">Documento Analizado</span>
                                 </div>
                                 <button onClick={() => setPhotos(p => ({...p, doc: null}))} className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-lg backdrop-blur-sm z-20 hover:bg-red-500 transition-colors">
                                    <Camera className="w-4 h-4 text-white" />
                                 </button>
                              </>
                           ) : (
                              <button onClick={() => handleCapturePhoto('doc')} className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-[#22D3EE] transition-colors">
                                 <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center group-hover:bg-[#22D3EE]/10 group-hover:scale-110 transition-all border border-dashed border-gray-600 group-hover:border-[#22D3EE]">
                                    <FileText className="w-8 h-8" />
                                 </div>
                                 <span className="text-xs font-black uppercase tracking-widest text-center">Orden / Doc. de Visita</span>
                              </button>
                           )}
                        </div>
                     </div>

                     {/* Slot 3: Aborto - Condicional */}
                     <AnimatePresence>
                        {decision === 'ABORTO/NO UBICADO' && (
                           <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="overflow-hidden">
                              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mt-4 flex flex-col md:flex-row items-center gap-6">
                                 <div className="flex-1">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">Prueba de Aborto Requerida</h4>
                                    <p className="text-[10px] font-mono text-gray-400">Se requiere fotografía de la puerta cerrada o local inexistente para justificar el Aborto.</p>
                                 </div>
                                 <div className="shrink-0 w-full md:w-48 aspect-video relative rounded-xl border border-red-500/30 overflow-hidden bg-[#0A0D14] flex items-center justify-center">
                                    {photos.aborto ? (
                                       <>
                                          <img src={photos.aborto} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                          <button onClick={() => setPhotos(p => ({...p, aborto: null}))} className="absolute top-2 right-2 bg-[#05070A]/80 p-1.5 rounded text-white hover:text-red-400 backdrop-blur-md">
                                             <Camera className="w-3 h-3" />
                                          </button>
                                       </>
                                    ) : (
                                       <button onClick={() => handleCapturePhoto('aborto')} className="w-full h-full flex flex-col items-center justify-center gap-2 text-red-500/70 hover:text-red-400 transition-colors bg-red-500/5">
                                          <Camera className="w-6 h-6" />
                                          <span className="text-[8px] font-black uppercase tracking-widest">Capturar Puerta</span>
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>

                     <div className="flex justify-end mt-8">
                        <button onClick={() => setActiveTab('report')} className="flex items-center gap-2 text-[#22D3EE] text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
                           Ir a Veredicto <ChevronRight className="w-4 h-4" />
                        </button>
                     </div>
                  </motion.div>
               )}

               {/* TAB 3: INFORME (EL VEREDICTO) */}
               {activeTab === 'report' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                     
                     {/* Tactical Selector */}
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-4">Resolución Táctica (Veredicto)</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                           {[
                             { id: 'VENTA CERRADA', label: 'Venta Cerrada', color: 'emerald', desc: 'Activa Finanzas', baseClass: 'emerald' },
                             { id: 'SEGUIMIENTO', label: 'Seguimiento', color: 'amber', desc: 'Re-agendar visita', baseClass: 'amber' },
                             { id: 'ABORTO/NO UBICADO', label: 'Aborto', color: 'red', desc: 'Misión Fallida', baseClass: 'red' },
                           ].map(opt => (
                              <button 
                                key={opt.id}
                                onClick={() => setDecision(opt.id as any)}
                                className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                                  decision === opt.id 
                                  ? opt.id === 'VENTA CERRADA'
                                    ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                    : opt.id === 'SEGUIMIENTO'
                                      ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                      : 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                  : 'bg-[#0A0D14] border-[#1E293B] hover:border-gray-500'
                                }`}
                              >
                                 <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      decision === opt.id 
                                      ? opt.id === 'VENTA CERRADA' ? 'bg-emerald-500 shadow-[0_0_8px_currentColor]' : opt.id === 'SEGUIMIENTO' ? 'bg-amber-500 shadow-[0_0_8px_currentColor]' : 'bg-red-500 shadow-[0_0_8px_currentColor]'
                                      : 'bg-[#1E293B]'}`} />
                                    <span className={`text-xs font-black uppercase tracking-widest ${
                                      decision === opt.id 
                                      ? opt.id === 'VENTA CERRADA' ? 'text-emerald-400' : opt.id === 'SEGUIMIENTO' ? 'text-amber-400' : 'text-red-400'
                                      : 'text-gray-400'}`}>
                                       {opt.label}
                                    </span>
                                 </div>
                                 <span className="text-[9px] font-mono text-gray-600 pl-5">{opt.desc}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Smart Link: Invoice Preview if Venta Cerrada */}
                     <AnimatePresence>
                        {decision === 'VENTA CERRADA' && (
                           <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="overflow-hidden">
                              <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-2xl p-6 mt-2 flex items-center gap-6">
                                 <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
                                    <Target className="w-6 h-6 text-[#10B981]" />
                                 </div>
                                 <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#10B981] mb-1">Smart Link: Neural Finance</h4>
                                    <p className="text-[10px] font-mono text-gray-400">
                                       Al finalizar el despliegue, el sistema generará automáticamente la factura proforma (Invoice ID provisional) y la enviará al módulo de Facturación GPS.
                                    </p>
                                 </div>
                              </div>
                           </motion.div>
                        )}
                        {decision === 'ABORTO/NO UBICADO' && (
                           <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="overflow-hidden">
                              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mt-2 flex items-center gap-6">
                                 <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                 </div>
                                 <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">CISO Alert</h4>
                                    <p className="text-[10px] font-mono text-gray-400">
                                       Has seleccionado Aborto. Recuerda adjuntar la evidencia fotográfica de la puerta o lugar en la pestaña Evidencia para auditoría.
                                    </p>
                                 </div>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>

                     {/* Satisfaction Slider */}
                     {decision !== 'ABORTO/NO UBICADO' && (
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-4">Nivel de Interés / Satisfacción</label>
                           <div className="flex bg-[#0A0D14] p-2 rounded-2xl border border-[#1E293B] gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                  key={star} 
                                  onClick={() => setSatisfaction(star)}
                                  className={`flex-1 py-3 rounded-xl transition-all flex justify-center items-center ${
                                    satisfaction >= star 
                                    ? 'bg-[#22D3EE]/10 text-[#22D3EE] shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]' 
                                    : 'hover:bg-white/5 text-gray-600'
                                  }`}
                                >
                                   <Star className={`w-5 h-5 ${satisfaction >= star ? 'fill-current' : ''}`} />
                                </button>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Notes */}
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-4 flex items-center gap-2">
                           Debriefing de la Visita <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[8px]">IA SUMMARY YIELD</span>
                        </label>
                        <textarea 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ingrese las notas operativas aquí. La IA estructurará el resumen corporativo automáticamente..."
                          className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-2xl p-6 text-sm font-mono text-gray-300 outline-none focus:border-[#22D3EE]/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all min-h-[120px] resize-none"
                        />
                     </div>

                     {/* Submit Button */}
                     <div className="pt-4 border-t border-[#1E293B]">
                        <button 
                          onClick={handleSubmit}
                          disabled={!decision || isSubmitting || !location}
                          className="w-full py-5 bg-emerald-500 text-[#05070A] font-black uppercase italic tracking-[0.2em] rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base relative overflow-hidden group"
                        >
                           {isSubmitting && (
                              <div className="absolute inset-0 bg-[#05070A]/20 flex items-center justify-center backdrop-blur-sm z-10">
                                 <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                           )}
                           <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                           <Send className="w-5 h-5 relative z-10" /> 
                           <span className="relative z-10">Finalizar Misión Operativa</span>
                        </button>
                        {!location && <p className="text-center text-[10px] font-black uppercase text-red-500 mt-3 tracking-widest">Requiere Check-In GPS Previo</p>}
                     </div>

                  </motion.div>
               )}

            </div>
         )}

         {/* Global Success View Overlay */}
         <AnimatePresence>
           {successData && (
             <SaleSuccessView 
               {...successData} 
               onClose={() => setSuccessData(null)} 
             />
           )}
         </AnimatePresence>

         <style>{`
           @keyframes mapScan {
             0% { transform: translateY(-100%) }
             100% { transform: translateY(100vh) }
           }
           @keyframes scan {
             0% { transform: translateX(-100%) }
             100% { transform: translateX(100vw) }
           }
         `}</style>
      </div>
    </div>
  );
}
