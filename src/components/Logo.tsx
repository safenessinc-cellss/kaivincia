import { BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className = "", iconOnly = false }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-[#00F0FF]/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="h-10 w-10 bg-gradient-to-br from-gray-900 to-black border border-[#00F0FF]/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.1)] relative z-10 transition-all duration-300 group-hover:border-[#00F0FF] overflow-hidden">
          {!imageError ? (
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain p-1"
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <BrainCircuit className="w-6 h-6 text-[#00F0FF]" />
          )}
        </div>
      </motion.div>
      
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#00F0FF] transition-colors">
            Kaivincia
          </span>
          <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest mt-0.5">
            Neural Ecosystem
          </span>
        </div>
      )}
    </div>
  );
}
