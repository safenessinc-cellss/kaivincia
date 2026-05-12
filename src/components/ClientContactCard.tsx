import React from 'react';
import { 
  Building2, User, Mail, Phone, ArrowUpRight, 
  ShieldCheck, Zap, Globe, MoreHorizontal 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface ClientContactCardProps {
  client: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    industry?: string;
    status?: 'active' | 'lead' | 'risk';
  };
}

export default function ClientContactCard({ client }: ClientContactCardProps) {
  const navigate = useNavigate();

  const statusColors = {
    active: 'text-emerald-500 bg-emerald-500/10',
    lead: 'text-cyan-500 bg-cyan-500/10',
    risk: 'text-red-500 bg-red-500/10'
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-[#161B22] border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden group shadow-2xl transition-all hover:border-[#22D3EE]/30"
    >
      {/* Background Decorative Element */}
      <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Building2 className="w-32 h-32 text-white" />
      </div>

      {/* Top Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center text-[#22D3EE] shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">{client.companyName}</h3>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 font-mono">
              {client.industry || 'B2B ENTERPRISE'}
            </span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${statusColors[client.status || 'lead']}`}>
          {client.status || 'Lead'}
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-4 mb-8 relative z-10">
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-transparent hover:border-white/5 transition-all">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-bold text-gray-300">{client.contactName}</span>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <Mail className="w-3.5 h-3.5 text-[#22D3EE]/50" />
            <span className="text-[10px] font-mono text-gray-400 truncate">{client.email}</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <Phone className="w-3.5 h-3.5 text-emerald-500/50" />
            <span className="text-[10px] font-mono text-gray-400">{client.phone}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button 
        onClick={() => navigate(`/crm/clients/${client.id}`)}
        className="w-full py-4 bg-[#22D3EE] text-black font-black uppercase italic tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 group/btn relative overflow-hidden transition-all active:scale-95"
      >
        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12" />
        Ver Perfil 360° <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </button>

      {/* System Metadata Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center opacity-30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-[#22D3EE]" />
          <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 font-mono">ID: {client.id.substring(0, 8)}</span>
        </div>
        <Zap className="w-3 h-3 text-cyan-500/100" />
      </div>
    </motion.div>
  );
}
