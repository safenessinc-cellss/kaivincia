import React from 'react';
import { Sparkles, ArrowRight, AlertCircle, Zap, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIInsight {
  type: 'success' | 'alert' | 'info' | 'automation';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface IAAdvisorProps {
  moduleName: string;
  insights: AIInsight[];
}

export default function IAAdvisor({ moduleName, insights }: IAAdvisorProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#0B0E14] border border-[#A855F7]/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-16 h-16 text-[#A855F7]" />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-10 bg-[#A855F7]/10 rounded-xl flex items-center justify-center text-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Zap className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-[#A855F7] uppercase tracking-[0.3em] font-mono">IA Advisor // Neural Link</h4>
          <p className="text-sm font-black text-white italic tracking-tighter uppercase">{moduleName} Copilot v2.0</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
              insight.type === 'alert' ? 'bg-red-500/10 border-red-500/20' :
              insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
              insight.type === 'automation' ? 'bg-[#A855F7]/10 border-[#A855F7]/20' :
              'bg-blue-500/10 border-blue-500/20'
            }`}
          >
            <div className="mt-0.5">
              {insight.type === 'alert' && <AlertCircle className="w-4 h-4 text-red-500" />}
              {insight.type === 'success' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
              {insight.type === 'automation' && <Zap className="w-4 h-4 text-[#A855F7]" />}
              {insight.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-gray-200 leading-relaxed font-mono">
                {insight.message}
              </p>
              {insight.action && (
                <button 
                  onClick={insight.action.onClick}
                  className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white hover:gap-3 transition-all underline decoration-[#A855F7] decoration-2 underline-offset-4"
                >
                  {insight.action.label} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Terminal Pulse Bar */}
      <div className="mt-6 flex items-center gap-2">
        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#A855F7] to-transparent"
          />
        </div>
        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest font-mono">Synced</span>
      </div>
    </motion.div>
  );
}
