import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, Building2, BookOpen, DollarSign, ArrowRight, Briefcase, 
  Zap, BrainCircuit, Loader2, CheckCircle2, Terminal, X, Sparkles, Navigation 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalContext } from '../contexts/GlobalContext';
import { LOGO_ICON } from '../constants/images';

interface CommandResult {
  id: string;
  type: 'command' | 'client' | 'task' | 'ai';
  title: string;
  subtitle: string;
  icon: any;
  path?: string;
  action?: () => void;
}

export default function CommandBar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResult, setAiResult] = useState<CommandResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { clients, tasks } = useGlobalContext();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      setAiResult(null);
      setIsProcessingAI(false);
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const baseResults: CommandResult[] = [
    { id: 'c1', type: 'command', title: '/nuevo-cliente', subtitle: 'Crear nuevo cliente B2B', icon: Users, action: () => { navigate('/crm/client-management'); onClose(); } },
    { id: 'c2', type: 'command', title: '/factura', subtitle: 'Ir a pagos y facturación', icon: DollarSign, action: () => { navigate('/crm/billing'); onClose(); } },
    { id: 'c3', type: 'command', title: '/equipo', subtitle: 'Gestión de equipo y rendimiento', icon: Briefcase, action: () => { navigate('/crm/team'); onClose(); } },
    { id: 'c4', type: 'command', title: '/academy', subtitle: 'Asignar o revisar cursos', icon: BookOpen, action: () => { navigate('/crm/academy-internal'); onClose(); } },
    { id: 'c5', type: 'command', title: '/nervios', subtitle: 'Centro de Inteligencia Neuronal', icon: BrainCircuit, action: () => { navigate('/crm/nervous'); onClose(); } },
  ];

  const clientResults: CommandResult[] = clients.map(c => ({
    id: `client-${c.id}`,
    type: 'client',
    title: c.companyName || c.contactName || 'Sin Nombre',
    subtitle: 'Base de Datos de Clientes',
    icon: Building2,
    path: '/crm/client-management'
  }));

  const taskResults: CommandResult[] = tasks.map(t => ({
    id: `task-${t.id}`,
    type: 'task',
    title: t.title || 'Sin Título',
    subtitle: `Prioridad: ${t.priority || 'Normal'} • Estado: ${t.status || 'Pendiente'}`,
    icon: CheckCircle2,
    path: '/crm/tasks'
  }));

  const allSearchResults = [...baseResults, ...clientResults, ...taskResults];

  const handleNaturalLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsProcessingAI(true);
    setAiResult(null);
    
    // Simulate Neural Processing
    await new Promise(resolve => setTimeout(resolve, 1200));

    const lowerQ = query.toLowerCase();
    let path = '/crm';
    let title = '';
    let icon = BrainCircuit;

    if (lowerQ.includes('factura') || lowerQ.includes('cobrar') || lowerQ.includes('pago')) {
      path = '/crm/billing';
      title = 'Generar Facturación Táctica';
      icon = DollarSign;
    } else if (lowerQ.includes('curso') || lowerQ.includes('academi') || lowerQ.includes('entrenar')) {
      path = '/crm/academy-internal';
      title = 'Optimización de Habilidades (Academia)';
      icon = BookOpen;
    } else if (lowerQ.includes('cliente') || lowerQ.includes('contacto') || lowerQ.includes('lead')) {
      path = '/crm/client-management';
      title = 'Gestión de Relaciones (CRM 360)';
      icon = Building2;
    } else if (lowerQ.includes('nervio') || lowerQ.includes('ia') || lowerQ.includes('cerebro')) {
      path = '/crm/nervous';
      title = 'Despliegue del Sistema Nervioso';
      icon = BrainCircuit;
    } else {
      path = '/crm/operations';
      title = 'Ir al Centro de Operaciones';
      icon = Zap;
    }

    setAiResult({ 
      id: 'ai-suggestion',
      type: 'ai',
      title: `Interpretación IA: ${title}`, 
      subtitle: 'Sugerencia neural basada en tu comando',
      path, 
      icon 
    });
    setIsProcessingAI(false);
  };

  const filteredResults = query 
    ? allSearchResults.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) || 
        r.subtitle.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : baseResults;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#05070A]/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-[#0F172A] rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden border border-cyan-500/20 relative z-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Tech Info */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-cyan-500/10 rounded flex items-center justify-center border border-cyan-500/20">
                  <img src={LOGO_ICON} alt="K" className="h-4 w-4 object-contain brightness-0 invert opacity-70" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black font-serif text-cyan-400/70 tracking-widest uppercase">Neural Cmd Link</span>
                  <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" />
                </div>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md transition-colors text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleNaturalLanguage} className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 transition-colors ${query ? 'text-cyan-400' : 'text-slate-500'}`} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setAiResult(null);
                }}
                className="w-full h-16 pl-14 pr-32 bg-transparent border-b border-cyan-500/10 text-white placeholder:text-slate-600 focus:outline-none text-lg font-medium"
                placeholder="Escribe un comando o petición neural..."
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button 
                  type="submit" 
                  disabled={isProcessingAI || !query} 
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#05070A] bg-cyan-400 hover:bg-cyan-300 rounded-md transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] disabled:opacity-30 disabled:shadow-none flex items-center gap-2"
                >
                  {isProcessingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                  Procesar IA
                </button>
              </div>
            </form>

            {/* Results Section */}
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {isProcessingAI ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 text-center flex flex-col items-center justify-center gap-6"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-cyan-500/20 rounded-full animate-ping absolute inset-0" />
                      <div className="w-16 h-16 border-2 border-cyan-500/40 rounded-full animate-[spin_3s_linear_infinite] flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-400 animate-pulse">Sincronizando Red Neuronal</p>
                      <p className="text-[10px] text-slate-500 uppercase font-mono">Interpretando intención táctica...</p>
                    </div>
                  </motion.div>
                ) : aiResult ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black text-purple-400 uppercase tracking-widest">
                      <Terminal className="w-3 h-3" /> Sugerencia de Inteligencia
                    </div>
                    <button
                      onClick={() => { navigate(aiResult.path!); onClose(); }}
                      className="w-full group relative flex items-center gap-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                        <aiResult.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors uppercase tracking-tight">{aiResult.title}</p>
                        <p className="text-xs text-purple-300/60 font-mono mt-1">{aiResult.subtitle}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-purple-400/40 group-hover:translate-x-1 transition-all" />
                    </button>
                    <div className="mt-4 pt-4 border-t border-cyan-500/5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 italic">Resultados Relacionados</div>
                    </div>
                  </motion.div>
                ) : null}

                {!isProcessingAI && (
                  <div className="p-2 space-y-1">
                    {filteredResults.length > 0 ? (
                      <>
                        {!query && !aiResult && (
                          <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Navigation className="w-3 h-3" /> Accesos Rápidos Tácticos
                          </div>
                        )}
                        {filteredResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => {
                              if (result.action) {
                                result.action();
                              } else if (result.path) {
                                navigate(result.path);
                                onClose();
                              }
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group text-left border border-transparent hover:border-cyan-500/10"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                                result.type === 'command' ? 'bg-slate-800 text-slate-300 border-slate-700 group-hover:border-cyan-400 group-hover:text-cyan-400' :
                                result.type === 'client' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                <result.icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-200 group-hover:text-white transition-colors truncate uppercase tracking-tight">{result.title}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate uppercase tracking-widest">{result.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </>
                    ) : !aiResult && (
                      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 px-6">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                          <X className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-300 font-bold uppercase tracking-tight">Sin resultados exactos para "{query}"</p>
                          <p className="text-xs text-slate-500">Usa el botón de arriba para procesar con Inteligencia Artificial.</p>
                        </div>
                        <button 
                          onClick={handleNaturalLanguage}
                          className="mt-2 text-cyan-400 text-xs font-black uppercase tracking-widest hover:text-cyan-300 transition-colors"
                        >
                          Intentar Modo Neural →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="bg-black/40 px-5 py-3 border-t border-cyan-500/10 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-2 text-cyan-500/60 uppercase tracking-tighter">
                <BrainCircuit className="w-3 h-3" /> Kaivincia AI Link v4.1 - Active
              </div>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-slate-500"><kbd className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded border border-slate-700 min-w-[20px] text-center">↵</kbd> AI Proc</span>
                <span className="flex items-center gap-1.5 text-slate-500"><kbd className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded border border-slate-700 min-w-[20px] text-center">ESC</kbd> Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
