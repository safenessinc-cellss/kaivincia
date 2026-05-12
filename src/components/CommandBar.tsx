import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, BookOpen, DollarSign, FileText, ArrowRight, Briefcase, Zap, BrainCircuit, Loader2, CheckCircle2 } from 'lucide-react';
import { useGlobalContext } from '../contexts/GlobalContext';

export default function CommandBar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string, path: string, icon: any } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { clients, tasks } = useGlobalContext();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setAiResult(null);
      setIsProcessingAI(false);
    }
  }, [isOpen]);

  const baseResults = [
    { id: 'c1', type: 'command', title: '/nuevo-cliente', subtitle: 'Crear nuevo cliente B2B', icon: Users, action: () => { navigate('/crm/client-management'); onClose(); } },
    { id: 'c2', type: 'command', title: '/factura', subtitle: 'Ir a pagos y facturación', icon: DollarSign, action: () => { navigate('/crm/billing'); onClose(); } },
    { id: 'c3', type: 'command', title: '/equipo', subtitle: 'Gestión de equipo y rendimiento', icon: Briefcase, action: () => { navigate('/crm/team'); onClose(); } },
    { id: 'c4', type: 'command', title: '/cursos', subtitle: 'Asignar o revisar cursos', icon: BookOpen, action: () => { navigate('/crm/academy-internal'); onClose(); } },
  ];

  const clientResults = clients.map(c => ({
    id: c.id,
    type: 'client',
    title: c.companyName || c.contactName || 'Sin Nombre',
    subtitle: 'Cliente',
    icon: Building2,
    path: '/crm/client-management'
  }));

  const taskResults = tasks.map(t => ({
    id: t.id,
    type: 'task',
    title: t.title,
    subtitle: `Estado: ${t.status}`,
    icon: CheckCircle2,
    path: '/crm/tasks'
  }));

  const searchResults = [...baseResults, ...clientResults, ...taskResults];

  const handleNaturalLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsProcessingAI(true);
    setAiResult(null);
    
    setTimeout(() => {
      const lowerQ = query.toLowerCase();
      let path = '/crm';
      let title = '';
      let icon = BrainCircuit;

      if (lowerQ.includes('factura') || lowerQ.includes('cobrar') || lowerQ.includes('pago')) {
        path = '/crm/billing';
        title = 'Ir a Facturación y Pagos';
        icon = DollarSign;
      } else if (lowerQ.includes('curso') || lowerQ.includes('academi') || lowerQ.includes('entrenar')) {
        path = '/crm/academy-internal';
        title = 'Abrir Academia Interna';
        icon = BookOpen;
      } else if (lowerQ.includes('cliente') || lowerQ.includes('contacto') || lowerQ.includes('lead')) {
        path = '/crm/client-management';
        title = 'Abrir Gestión de Clientes';
        icon = Building2;
      } else if (lowerQ.includes('equipo') || lowerQ.includes('talento') || lowerQ.includes('asignar')) {
        path = '/crm/team';
        title = 'Abrir Gestión de Talento';
        icon = Briefcase;
      } else {
        path = '/crm/operations';
        title = 'Abrir Centro de Operaciones';
        icon = Zap;
      }

      setAiResult({ title: `Analista IA sugiere: ${title}`, path, icon });
      setIsProcessingAI(false);
    }, 800);
  };

  const filteredResults = query 
    ? searchResults.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) || 
        r.subtitle.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : baseResults;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER COM LOGO KAIVINCIA */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src="/images/logo.png" 
              alt="Kaivincia" 
              className="h-6 w-6 object-contain"
            />
          </div>
          <div>
            <p className="text-[8px] font-black text-[#00F0FF] uppercase tracking-[0.2em]">Kaivincia AI</p>
            <p className="text-[9px] font-medium text-gray-500 -mt-0.5">Comando Neural</p>
          </div>
        </div>

        <form onSubmit={handleNaturalLanguage} className="flex items-center px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-[#00F0FF] mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAiResult(null);
            }}
            placeholder="Comando natural (Ej: 'Crear factura para cliente X', 'buscar Tarea Y')"
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-gray-900 placeholder:text-gray-400 outline-none"
          />
          <button type="submit" disabled={isProcessingAI || !query} className="hidden sm:inline-block px-3 py-1.5 text-xs font-semibold text-white bg-[#00F0FF] hover:bg-[#00E5F2] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
            {isProcessingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
            Procesar IA
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {aiResult && (
             <div className="mb-2 p-1">
               <div className="text-xs font-black text-purple-600 uppercase tracking-widest px-3 mb-2 flex items-center gap-1">
                  <BrainCircuit className="w-3 h-3" /> Respuesta IA
               </div>
               <button
                  onClick={() => { navigate(aiResult.path); onClose(); }}
                  className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-xl transition-colors group text-left border border-purple-100 hover:border-purple-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
                      {aiResult.icon && <aiResult.icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-purple-900">{aiResult.title}</p>
                      <p className="text-xs text-purple-600 font-medium italic">Click para ir a la vista sugerida</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </button>
             </div>
          )}

          {filteredResults.length > 0 && !isProcessingAI && !aiResult ? (
            <div className="space-y-1">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                 Comandos Rápidos y Búsqueda
              </div>
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    if ('action' in result && result.action) {
                      result.action();
                    } else if ('path' in result && result.path) {
                      navigate(result.path);
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      result.type === 'command' ? 'bg-gray-100 text-gray-600 group-hover:text-[#00F0FF]' :
                      result.type === 'client' ? 'bg-blue-50 text-blue-600' : 
                      result.type === 'task' ? 'bg-emerald-50 text-emerald-600' : 'bg-green-50 text-green-600'
                    }`}>
                      <result.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold transition-colors ${result.type === 'task' ? 'text-sm' : ''} text-gray-900 group-hover:text-[#00F0FF]`}>{result.title}</p>
                      <p className="text-xs text-gray-500 uppercase font-black mt-0.5">{result.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#00F0FF] transition-colors" />
                </button>
              ))}
            </div>
          ) : (
             !aiResult && !isProcessingAI && filteredResults.length === 0 && (
               <div className="p-8 text-center text-gray-500">
                 <p className="mb-2">No hay coincidencias exactas para "{query}".</p>
                 <p className="text-sm">Presiona Enter o haz click en 'Procesar IA' para que Kaivincia interprete tu comando.</p>
               </div>
             )
          )}
          {isProcessingAI && (
             <div className="p-12 text-center text-purple-600 flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                 <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Interpretando Comando...</p>
             </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
          <span className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Kaivincia" className="h-4 w-4 object-contain" />
            Kaivincia Neural Command
          </span>
          <span className="flex gap-3">
            <span><kbd className="bg-white border px-1 rounded">↵</kbd> Procesar AI</span>
            <span><kbd className="bg-white border px-1 rounded">ESC</kbd> Cerrar</span>
          </span>
        </div>
      </div>
    </div>
  );
});
}
