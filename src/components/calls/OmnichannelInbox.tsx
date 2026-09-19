import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Send, 
  User, 
  CheckCheck, 
  Phone, 
  Mail, 
  Instagram, 
  FileText, 
  Bot, 
  ShieldCheck,
  X
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';

interface OmnichannelInboxProps {
  onStartCallWithContact?: (phone: string) => void;
  className?: string;
}

const DEFAULT_THREADS = [
  {
    id: 'th_1',
    name: 'Marta Morales',
    phone: '+34 690 123 456',
    email: 'marta.m@cliente.com',
    channel: 'WhatsApp',
    lastMsg: 'Perfecto, quedo a la espera del presupuesto.',
    time: '11:42 AM',
    unread: 1,
    priority: 'High',
    messages: [
      { id: 'm1', sender: 'them', text: 'Hola, quería consultar sobre el plan empresarial.', time: '11:30 AM' },
      { id: 'm2', sender: 'me', text: '¡Hola Marta! Con gusto te envío el detalle de cobertura.', time: '11:35 AM' },
      { id: 'm3', sender: 'them', text: 'Perfecto, quedo a la espera del presupuesto.', time: '11:42 AM' }
    ]
  },
  {
    id: 'th_2',
    name: 'Carlos Mendoza',
    phone: '+1 415 882 9901',
    email: 'carlos@techcorp.io',
    channel: 'Email',
    lastMsg: 'Confirmamos la reunión técnica para el viernes.',
    time: 'Ayer',
    unread: 0,
    priority: 'Medium',
    messages: [
      { id: 'm1', sender: 'them', text: 'Confirmamos la reunión técnica para el viernes a las 10:00.', time: 'Ayer' }
    ]
  },
  {
    id: 'th_3',
    name: 'Laura Gómez',
    phone: '+54 9 11 4455 6677',
    email: 'laura@gomez.ar',
    channel: 'Instagram',
    lastMsg: '¿Tienen soporte para integración con CRM?',
    time: '2 días',
    unread: 0,
    priority: 'Low',
    messages: [
      { id: 'm1', sender: 'them', text: 'Hola, ¿tienen soporte para integración con CRM?', time: '2 días' }
    ]
  }
];

export default function OmnichannelInbox({ onStartCallWithContact, className = '' }: OmnichannelInboxProps) {
  const { t } = useLanguage();

  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<any[]>(DEFAULT_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('th_1');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // Formulario de nueva conversación
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('+34 690 000 000');
  const [newChannel, setNewChannel] = useState('WhatsApp');
  const [newInitialMsg, setNewInitialMsg] = useState('Hola, te contacto del equipo de Kaivincia.');

  // Sincronización con Firestore
  useEffect(() => {
    if (authLoading || !user) return;

    const q = collection(db, 'omnichannel_threads');
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setThreads(loaded);
      }
    }, (err) => {
      console.warn('Could not sync omnichannel_threads, fallback local:', err);
    });

    return () => unsub();
  }, [user, authLoading]);

  const selectedThread = threads.find(t => t.id === selectedThreadId) || threads[0] || null;

  const filteredThreads = threads.filter(t => {
    if (channelFilter !== 'all' && t.channel?.toLowerCase() !== channelFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name?.toLowerCase().includes(q) || t.lastMsg?.toLowerCase().includes(q) || t.phone?.includes(q);
    }
    return true;
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThread) return;

    const newMsg = {
      id: 'msg_' + Date.now().toString(),
      sender: 'me',
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...(selectedThread.messages || []), newMsg];
    const updatedThread = {
      ...selectedThread,
      messages: updatedMessages,
      lastMsg: newMsg.text,
      time: 'Ahora'
    };

    setThreads(prev => prev.map(t => t.id === selectedThread.id ? updatedThread : t));
    setReplyText('');

    try {
      await setDoc(doc(db, 'omnichannel_threads', selectedThread.id), updatedThread, { merge: true });
    } catch (e) {}
  };

  const handleCreateNewThread = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'th_' + Date.now().toString().slice(-6);
    const threadData = {
      id: newId,
      name: newName || 'Nuevo Contacto',
      phone: newTarget,
      email: '',
      channel: newChannel,
      lastMsg: newInitialMsg,
      time: 'Ahora',
      unread: 0,
      priority: 'Medium',
      messages: [
        {
          id: 'm1',
          sender: 'me',
          text: newInitialMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setThreads(prev => [threadData, ...prev]);
    setSelectedThreadId(newId);
    setShowNewModal(false);

    try {
      await setDoc(doc(db, 'omnichannel_threads', newId), threadData);
    } catch (e) {}
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] ${className}`}>
      {/* Columna Izquierda: Lista de Hilos de Conversación */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col shadow-sm">
        {/* Barra superior del Inbox */}
        <div className="p-2 space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-500" />
              <span>Bandeja Omnicanal</span>
            </h4>
            <button
              onClick={() => setShowNewModal(true)}
              className="p-1.5 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 transition-colors shadow-sm"
              title="Nueva conversación"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar chats..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filtros de canales */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {['all', 'whatsapp', 'email', 'instagram'].map(c => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  channelFilter === c
                    ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2">
          {filteredThreads.map(t => {
            const isSelected = t.id === selectedThreadId;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedThreadId(t.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-950/40 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.name?.charAt(0) || 'U'}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[130px]">
                      {t.name}
                    </h5>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">{t.time}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate pl-9">{t.lastMsg}</p>
                <div className="flex items-center justify-between pl-9 mt-1.5">
                  <span className="text-[8px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-bold uppercase text-slate-600 dark:text-slate-400">
                    {t.channel}
                  </span>
                  {t.unread > 0 && (
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[9px] font-black flex items-center justify-center">
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Vista del Chat Activo */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        {selectedThread ? (
          <>
            {/* Header del Chat */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold text-base">
                  {selectedThread.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedThread.name}</span>
                    <span className="text-[9px] font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {selectedThread.channel}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">{selectedThread.phone || selectedThread.email}</p>
                </div>
              </div>

              {selectedThread.phone && onStartCallWithContact && (
                <button
                  onClick={() => onStartCallWithContact(selectedThread.phone)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>Llamar</span>
                </button>
              )}
            </div>

            {/* Mensajes del Chat */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
              {(selectedThread.messages || []).map((m: any) => {
                const isMe = m.sender === 'me';
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-md rounded-2xl p-3.5 text-xs ${
                        isMe
                          ? 'bg-cyan-500 text-black font-medium rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className={`block text-[9px] text-right mt-1 font-mono ${isMe ? 'text-black/60' : 'text-slate-400'}`}>
                        {m.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input de Respuesta */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta omnicanal..."
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400">
            Selecciona una conversación para interactuar.
          </div>
        )}
      </div>

      {/* Modal Nueva Conversación */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 text-white border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowNewModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-base font-black uppercase tracking-tight mb-4">Iniciar Nueva Conversación</h4>

            <form onSubmit={handleCreateNewThread} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Teléfono o Destino</label>
                <input
                  type="text"
                  required
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Canal</label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  <option value="WhatsApp">WhatsApp Business</option>
                  <option value="Email">Correo Electrónico</option>
                  <option value="Instagram">Instagram Direct</option>
                  <option value="SMS">SMS Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mensaje Inicial</label>
                <textarea
                  rows={2}
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider"
                >
                  Crear Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
