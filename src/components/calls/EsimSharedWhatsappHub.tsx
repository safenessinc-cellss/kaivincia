import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Phone, 
  User, 
  Users, 
  CheckCheck, 
  Clock, 
  Share2, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  Paperclip, 
  Smile, 
  Settings, 
  RefreshCw,
  Plus,
  X,
  ExternalLink
} from 'lucide-react';
import { EsimProfile } from '../../types/calls';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  profile: EsimProfile;
  onOpenConfig?: () => void;
  onCallContact?: (phoneNumber: string) => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  sender: 'client' | 'operator';
  operatorName?: string;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface ChatThread {
  id: string;
  clientName: string;
  clientPhone: string;
  company?: string;
  lastMessage: string;
  lastMessageTime: string;
  assignedOperator: string;
  unreadCount: number;
  status: 'open' | 'pending' | 'resolved';
  messages: ChatMessage[];
}

const DEFAULT_SHARED_THREADS: ChatThread[] = [
  {
    id: 'wa_1',
    clientName: 'Marta Morales (Directora Logística)',
    clientPhone: '+34 690 123 456',
    company: 'Distribuidora Ibérica',
    lastMessage: 'Perfecto, quedo a la espera de la propuesta para las 15 unidades.',
    lastMessageTime: '11:42 AM',
    assignedOperator: 'Marta García',
    unreadCount: 1,
    status: 'open',
    messages: [
      { id: 'm1', sender: 'client', text: 'Hola, vi su anuncio de soluciones GPS y telemetría.', time: '11:20 AM' },
      { id: 'm2', sender: 'operator', operatorName: 'Carlos Ruiz', text: '¡Hola Marta! Bienvenido/a a Kaivincia. ¿Cuántos vehículos conforman tu flota actual?', time: '11:25 AM', status: 'read' },
      { id: 'm3', sender: 'client', text: 'Actualmente tenemos 15 furgonetas en ruta nacional.', time: '11:32 AM' },
      { id: 'm4', sender: 'operator', operatorName: 'Marta García', text: 'Excelente. Te armamos un plan corporativo con corte de motor y seguimiento en tiempo real.', time: '11:36 AM', status: 'read' },
      { id: 'm5', sender: 'client', text: 'Perfecto, quedo a la espera de la propuesta para las 15 unidades.', time: '11:42 AM' }
    ]
  },
  {
    id: 'wa_2',
    clientName: 'Ing. Carlos Mendoza',
    clientPhone: '+1 415 882 9901',
    company: 'Transportes Mendoza SA',
    lastMessage: 'Confirmamos la demo para mañana a las 10:00.',
    lastMessageTime: 'Ayer',
    assignedOperator: 'Zaydeli De La Rosa',
    unreadCount: 0,
    status: 'pending',
    messages: [
      { id: 'm1', sender: 'client', text: 'Hola, quisiéramos coordinar una demostración con nuestro equipo.', time: 'Ayer 15:00' },
      { id: 'm2', sender: 'operator', operatorName: 'Zaydeli De La Rosa', text: 'Con gusto Ingeniero, agendamos la sesión en el CRM con geolocalización.', time: 'Ayer 15:15', status: 'read' },
      { id: 'm3', sender: 'client', text: 'Confirmamos la demo para mañana a las 10:00.', time: 'Ayer 15:30' }
    ]
  },
  {
    id: 'wa_3',
    clientName: 'Lic. Laura Gómez',
    clientPhone: '+54 9 11 4455 6677',
    company: 'Agroquímicos del Sur',
    lastMessage: '¿Tienen cobertura de red satelital para zonas rurales?',
    lastMessageTime: '2 días',
    assignedOperator: 'Todos los Operadores',
    unreadCount: 0,
    status: 'open',
    messages: [
      { id: 'm1', sender: 'client', text: 'Buenas tardes, ¿tienen cobertura de red satelital para zonas rurales?', time: 'Mar 10:11' }
    ]
  }
];

const OPERATORS_LIST = [
  'Marta García',
  'Carlos Ruiz',
  'Zaydeli De La Rosa',
  'Miguel Rojas',
  'Roberto Gómez'
];

const QUICK_TEMPLATES = [
  { label: 'Bienvenida & Catálogo', text: '¡Hola! Gracias por contactarnos en Kaivincia. Te comparto nuestro catálogo de soluciones y planes corporativos.' },
  { label: 'Confirmación de Cita', text: 'Te confirmamos la cita comercial agendada en nuestro sistema. Cualquier duda estamos a tu disposición por esta misma vía.' },
  { label: 'Envío de Cotización', text: 'Ya hemos generado la cotización formal ajustada a los requerimientos de tu flota. Te la enviamos adjunta.' },
  { label: 'Seguimiento de Interés', text: 'Hola, ¿pudiste revisar la información que te compartimos? Con gusto aclaramos cualquier inquietud.' }
];

export default function EsimSharedWhatsappHub({
  profile,
  onOpenConfig,
  onCallContact,
  className = ''
}: Props) {
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>(DEFAULT_SHARED_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('wa_1');
  const [currentOperator, setCurrentOperator] = useState<string>('Marta García');
  const [searchQuery, setSearchQuery] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [messageInput, setMessageInput] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);

  // Nuevo contacto modal
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('+1 ');
  const [newInitialText, setNewInitialText] = useState('¡Hola! Te contactamos del equipo de Kaivincia.');

  // Sincronización reactiva con Firestore
  useEffect(() => {
    if (authLoading || !user) return;

    const q = collection(db, 'shared_whatsapp_chats');
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatThread));
        setThreads(list);
      }
    }, (err) => {
      console.warn('Could not sync shared_whatsapp_chats from Firestore:', err);
    });

    return () => unsub();
  }, [user, authLoading]);

  const selectedThread = threads.find(t => t.id === selectedThreadId) || threads[0] || null;

  const filteredThreads = threads.filter(t => {
    if (operatorFilter !== 'all' && t.assignedOperator !== operatorFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.clientName.toLowerCase().includes(q) ||
        t.clientPhone.includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedThread) return;

    const newMsg: ChatMessage = {
      id: 'm_' + Date.now().toString(),
      sender: 'operator',
      operatorName: currentOperator,
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    const updatedMessages = [...(selectedThread.messages || []), newMsg];
    const updatedThread: ChatThread = {
      ...selectedThread,
      messages: updatedMessages,
      lastMessage: newMsg.text,
      lastMessageTime: 'Ahora',
      unreadCount: 0
    };

    setThreads(prev => prev.map(t => t.id === selectedThread.id ? updatedThread : t));
    setMessageInput('');
    setShowTemplates(false);

    try {
      await setDoc(doc(db, 'shared_whatsapp_chats', selectedThread.id), updatedThread, { merge: true });
    } catch (e) {
      console.warn('Operating offline:', e);
    }
  };

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'wa_' + Date.now().toString().slice(-6);
    const newChat: ChatThread = {
      id: newId,
      clientName: newClientName || 'Contacto WhatsApp',
      clientPhone: newClientPhone,
      company: 'Prospecto Nuevo',
      lastMessage: newInitialText,
      lastMessageTime: 'Ahora',
      assignedOperator: currentOperator,
      unreadCount: 0,
      status: 'open',
      messages: [
        {
          id: 'm1',
          sender: 'operator',
          operatorName: currentOperator,
          text: newInitialText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent'
        }
      ]
    };

    setThreads(prev => [newChat, ...prev]);
    setSelectedThreadId(newId);
    setShowNewContactModal(false);

    try {
      await setDoc(doc(db, 'shared_whatsapp_chats', newId), newChat);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleTransferOperator = async (newOp: string) => {
    if (!selectedThread) return;
    const updated = { ...selectedThread, assignedOperator: newOp };
    setThreads(prev => prev.map(t => t.id === selectedThread.id ? updated : t));
    try {
      await updateDoc(doc(db, 'shared_whatsapp_chats', selectedThread.id), {
        assignedOperator: newOp
      });
    } catch (e) {}
  };

  return (
    <div className={`bg-[#0A0E17] text-white border border-slate-800 rounded-3xl overflow-hidden shadow-2xl ${className}`}>
      
      {/* Barra de Control de la Línea Compartida */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Identidad del Número Único */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                WhatsApp Corporativo Compartido
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Número Único
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
              <span className="text-cyan-400 font-bold">{profile.phone || '+1 (323) 555-0122'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{profile.lineName || 'Línea eSIM 1'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400 font-semibold">Multi-Operador Activo</span>
            </div>
          </div>
        </div>

        {/* Selector de Operador Activo & Botones de Configuración */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 px-3 flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] text-slate-400 uppercase font-black">Operando como:</span>
            <select
              value={currentOperator}
              onChange={(e) => setCurrentOperator(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
            >
              {OPERATORS_LIST.map(op => (
                <option key={op} value={op} className="bg-slate-900 text-white">{op}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenConfig}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            title="Configurar número eSIM y credenciales WhatsApp"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar Línea</span>
          </button>
        </div>
      </div>

      {/* Workspace Principal del Chat: Lista Izquierda + Mensajería Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 h-[640px]">
        
        {/* Columna Izquierda: Lista de Conversaciones */}
        <div className="lg:col-span-5 border-r border-slate-800 flex flex-col bg-[#070A11]">
          {/* Buscador & Filtro de Operadores */}
          <div className="p-3.5 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente, teléfono o mensaje..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNewContactModal(true)}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-colors cursor-pointer shadow-sm"
                title="Iniciar nueva conversación de WhatsApp"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de filtro por operador */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Filtrar operador:</span>
              <select
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-slate-300 font-mono text-[10px] focus:outline-none"
              >
                <option value="all">Todos los Operadores ({threads.length})</option>
                {OPERATORS_LIST.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Threads */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
            {filteredThreads.map(th => {
              const isSelected = th.id === selectedThreadId;
              return (
                <div
                  key={th.id}
                  onClick={() => setSelectedThreadId(th.id)}
                  className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected 
                      ? 'bg-slate-900 border-l-4 border-emerald-500' 
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 font-black text-sm shrink-0">
                    {th.clientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-white truncate">
                        {th.clientName}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {th.lastMessageTime}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono">
                      {th.clientPhone}
                    </p>

                    <p className="text-xs text-slate-400 truncate mt-1">
                      {th.lastMessage}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                        Agente: {th.assignedOperator}
                      </span>

                      {th.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center">
                          {th.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Chat y Envío Multi-Operador */}
        <div className="lg:col-span-7 flex flex-col bg-[#0B0F19]">
          {selectedThread ? (
            <>
              {/* Header del Chat Activo */}
              <div className="p-3.5 px-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white">{selectedThread.clientName}</h4>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{selectedThread.clientPhone}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Empresa: {selectedThread.company || 'Cliente'} • Asignado a: <strong className="text-purple-300">{selectedThread.assignedOperator}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Botón de Llamar desde el marcador con la eSIM */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onCallContact) onCallContact(selectedThread.clientPhone);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Llamar con línea eSIM interna"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Llamar por eSIM</span>
                  </button>

                  {/* Transferir conversación a otro operador */}
                  <div className="relative">
                    <select
                      value={selectedThread.assignedOperator}
                      onChange={(e) => handleTransferOperator(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-purple-300 text-[10px] font-bold rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer"
                      title="Reasignar chat a otro operador"
                    >
                      <option value="Todos los Operadores">Línea Abierta (Todos)</option>
                      {OPERATORS_LIST.map(op => (
                        <option key={op} value={op}>Asignar a {op}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Historial de Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {selectedThread.messages?.map(msg => {
                  const isOp = msg.sender === 'operator';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOp ? 'items-end' : 'items-start'}`}
                    >
                      {/* Badge del Operador que respondió */}
                      {isOp && msg.operatorName && (
                        <span className="text-[9px] font-mono text-purple-300 font-bold mb-0.5 px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-500/20">
                          Respondió: {msg.operatorName}
                        </span>
                      )}

                      <div
                        className={`max-w-md rounded-2xl p-3 text-xs leading-relaxed ${
                          isOp
                            ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-950/20'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-75 font-mono">
                          <span>{msg.time}</span>
                          {isOp && <CheckCheck className="w-3 h-3 text-cyan-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Plantillas Rápidas (Acordeón) */}
              {showTemplates && (
                <div className="p-3 bg-slate-900 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                  {QUICK_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMessageInput(tmpl.text);
                        setShowTemplates(false);
                      }}
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 rounded-xl text-[11px] transition-all cursor-pointer"
                    >
                      <span className="text-cyan-400 font-bold block">{tmpl.label}</span>
                      <span className="text-slate-400 truncate block text-[10px]">{tmpl.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Input y Acciones de Envío */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-800 bg-slate-900/90 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Enviando desde número corporativo: <strong>{profile.phone}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{showTemplates ? 'Ocultar Plantillas' : 'Plantillas Rápidas HSM'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Escribir mensaje como ${currentOperator}...`}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-bold text-white">Selecciona una conversación</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Todos los operadores comparten la atención de este número único. Los mensajes se envían con la identidad corporativa.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Iniciar Chat con Nuevo Contacto */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0E17] border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-black uppercase text-emerald-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Nuevo Chat WhatsApp (Número Único)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowNewContactModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChat} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Nombre del Cliente / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Distribuidora Nacional"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Número de Teléfono WhatsApp (Con código de país) *
                </label>
                <input
                  type="text"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="+34 690 000 000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Mensaje Inicial
                </label>
                <textarea
                  rows={2}
                  value={newInitialText}
                  onChange={(e) => setNewInitialText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewContactModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Iniciar Conversación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
