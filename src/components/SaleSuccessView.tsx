import React from 'react';
import { CheckCircle2, Send, FileText, Clock, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface SaleSuccessViewProps {
  invoiceId: string;
  amount: string;
  clientEmail: string;
  onClose: () => void;
}

export default function SaleSuccessView({ invoiceId, amount, clientEmail, onClose }: SaleSuccessViewProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0E14] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Animated Checkmark */}
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="relative h-32 w-32 mx-auto"
        >
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
          <div className="relative h-full w-full bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]">
             <CheckCircle2 className="w-16 h-16 text-[#0B0E14]" />
          </div>
        </motion.div>

        <div className="space-y-2">
           <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Venta Sincronizada</h2>
           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Operación Exitosa // Nodo Finanzas Activo</p>
        </div>

        {/* Financial Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-left space-y-4 shadow-2xl"
        >
           <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Folio Factura</span>
              <span className="font-mono text-white text-sm font-bold">{invoiceId}</span>
           </div>
           <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Monto Total</span>
              <span className="font-mono text-[#00F0FF] text-xl font-black tracking-tighter">{amount}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Cliente</span>
              <span className="text-xs font-bold text-white truncate max-w-[150px]">{clientEmail}</span>
           </div>
        </motion.div>

        {/* Status Tracker */}
        <div className="space-y-6 pt-4">
           <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Protocolo de Despliegue</h4>
           <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 z-0" />
              {[
                { label: 'Visita', status: 'done', icon: MapCircle },
                { label: 'Evidencia', status: 'done', icon: Camera },
                { label: 'Factura', status: 'active', icon: Zap },
                { label: 'Pago', status: 'pending', icon: Clock }
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                   <div className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all ${
                     step.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-[#0B0E14]' :
                     step.status === 'active' ? 'bg-[#0B0E14] border-emerald-500 text-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]' :
                     'bg-[#0B0E14] border-white/10 text-gray-700'
                   }`}>
                      {step.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                   </div>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${
                     step.status === 'pending' ? 'text-gray-700' : 'text-white'
                   }`}>{step.label}</span>
                </div>
              ))}
           </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full py-6 mt-8 bg-white text-black font-black uppercase italic tracking-[0.3em] rounded-3xl"
        >
           Volver al Centro de Control
        </motion.button>

        <div className="flex items-center justify-center gap-4 pt-4 opacity-30">
           <ShieldCheck className="w-4 h-4 text-emerald-500" />
           <p className="text-[8px] font-black uppercase tracking-[0.2em]">Transaction Verified // AES-256 Link</p>
        </div>
      </div>
    </div>
  );
}

function MapCircle(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function Camera(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
