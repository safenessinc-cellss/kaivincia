import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { motion } from 'motion/react';

export default function FloatingEditButton({ userData }: { userData: any }) {
  if (userData?.role !== 'superadmin') return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed bottom-6 left-6 z-[9999]"
    >
      <Link
        to="/crm/superadmin"
        className="flex items-center gap-2 bg-[#00F0FF] text-white p-4 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-110 active:scale-95 transition-all group"
        title="Panel de Control Maestro"
      >
        <Settings className="w-6 h-6 animate-[spin_4s_linear_infinite]" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] transition-all duration-500 whitespace-nowrap text-[10px] font-black uppercase tracking-widest pl-0 group-hover:pl-2">
          Control Maestro
        </span>
      </Link>
    </motion.div>
  );
}
