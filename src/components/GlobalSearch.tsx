import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, FileText, Users, DollarSign, Command as CmdIcon, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalContext } from '../contexts/GlobalContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { clients, users, tasks } = useGlobalContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  // Command K logic should be at a higher level, but we can manage local shortcuts here
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const searchQuery = query.toLowerCase();

  const filteredClients = clients.filter(c => 
    c.companyName?.toLowerCase().includes(searchQuery) ||
    c.contactName?.toLowerCase().includes(searchQuery)
  ).slice(0, 5);

  const filteredTasks = tasks.filter(t =>
    t.title?.toLowerCase().includes(searchQuery) ||
    t.description?.toLowerCase().includes(searchQuery)
  ).slice(0, 5);

  const navigationItems = [
    { label: 'Dashboard', path: '/crm/dashboard', icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
    { label: 'Pipeline', path: '/crm/pipeline', icon: <Loader2 className="w-4 h-4 text-blue-400" /> },
    { label: 'Clientes (Control 360)', path: '/crm/client-management', icon: <Users className="w-4 h-4 text-purple-400" /> },
    { label: 'Tareas', path: '/crm/tasks', icon: <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" /> },
    { label: 'Facturación', path: '/crm/billing', icon: <FileText className="w-4 h-4 text-orange-400" /> },
  ].filter(nav => nav.label.toLowerCase().includes(searchQuery));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-black/40"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#111318] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center px-4 py-3 border-b border-gray-800">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input 
              ref={inputRef}
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar clientes, tareas, navegación..." 
              className="flex-1 bg-transparent border-none text-white outline-none placeholder-gray-500 font-medium"
            />
            <div className="flex gap-1 text-[10px] font-bold text-gray-500">
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase">ESC</span>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-2 py-2 hide-scrollbar">
            {query.length > 0 && filteredClients.length === 0 && filteredTasks.length === 0 && navigationItems.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">No se encontraron resultados para "{query}"</p>
            ) : (
              <div className="space-y-4">
                
                {navigationItems.length > 0 && (
                  <div>
                    <h3 className="px-3 text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest mt-2">Navegación</h3>
                    {navigationItems.map((item, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSelect(item.path)}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
                      >
                        <div className="mr-3">{item.icon}</div>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {filteredClients.length > 0 && (
                  <div>
                    <h3 className="px-3 text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Clientes</h3>
                    {filteredClients.map((client) => (
                      <button 
                        key={client.id}
                        onClick={() => handleSelect('/crm/client-management')}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
                      >
                        <Users className="w-4 h-4 text-purple-400 mr-3 opacity-50 group-hover:opacity-100" />
                        <div>
                          <p className="text-sm font-medium text-gray-300 group-hover:text-white">{client.companyName || 'Sin compañía'}</p>
                          <p className="text-xs text-gray-500">{client.contactName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredTasks.length > 0 && (
                  <div>
                    <h3 className="px-3 text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Tareas</h3>
                    {filteredTasks.map((task) => (
                      <button 
                        key={task.id}
                        onClick={() => handleSelect('/crm/tasks')}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#00F0FF] mr-3 opacity-50 group-hover:opacity-100" />
                        <div>
                          <p className="text-sm font-medium text-gray-300 group-hover:text-white truncate">{task.title}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black">{task.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
              </div>
            )}
            
            {query.length === 0 && (
               <div className="px-3 text-sm text-gray-500 font-medium">
                 Para empezar a buscar, escribe nombres de clientes, tareas, o simplemente la sección a la que quieras ir (por ejemplo "Facturación").
               </div>
            )}
          </div>
          
          <div className="bg-white/5 px-4 py-2 flex items-center justify-between text-xs font-medium text-gray-400">
            <span className="flex items-center gap-1.5"><CmdIcon className="w-3 h-3" /> / Ctrl + K para abrir</span>
            <span>Usa las flechas para navegar (Pronto)</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
