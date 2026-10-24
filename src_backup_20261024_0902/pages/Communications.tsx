import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Users, User, Hash, Search, Sparkles, 
  CheckCircle2, Paperclip, Send, MoreHorizontal, Smile, 
  RotateCcw, Layout, FileText, Activity, TrendingUp, 
  PieChart, ChevronRight, ListTodo, Plus, Scissors,
  ShieldCheck, ShieldAlert, Lock, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import AINotificationEngine from '../components/AINotificationEngine';
import { useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useGlobalContext } from '../contexts/GlobalContext';

interface Message {
  id: string;
  sender: string;
  role: 'team' | 'customer';
  text: string;
  time: string;
  timestamp?: number;
  priority?: 'high' | 'normal' | 'low';
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface Channel {
  id: string;
  name: string;
  type: 'team' | 'client' | 'group';
  sentimentEmoji: string;
  lastMessage: string;
  unread?: number;
  priority?: boolean;
}

export default function Communications() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const embeddedState = searchParams.get('embedded') === 'true';
  const queryClientId = searchParams.get('clientId');
  // const queryClientName = searchParams.get('clientName');

  const { clients, users } = useGlobalContext();
  const userData = users.find(u => u.id === auth.currentUser?.uid);

  const [activeChannelId, setActiveChannelId] = useState(queryClientId || 'general');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [view, setView] = useState<'chat' | 'ai-engine'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const baseChannels: Channel[] = [
    { id: 'general', name: 'Kaivincia Interno', type: 'team', sentimentEmoji: '🔥', lastMessage: 'Chat de equipo' },
    { id: 'dev-ops', name: 'DevOps & Scaling', type: 'group', sentimentEmoji: '⚡', lastMessage: 'Sistema estable' }
  ];

  // Derive client channels from `clients` context
  const clientChannels: Channel[] = clients.map(c => ({
    id: c.id,
    name: c.companyName || 'Cliente',
    type: 'client',
    sentimentEmoji: c.healthScore > 80 ? '🤝' : c.healthScore < 50 ? '⚠️' : '✨',
    lastMessage: 'Abrir chat'
  }));

  const allChannels = [...baseChannels, ...clientChannels];
  const activeChannel = allChannels.find(c => c.id === activeChannelId) || allChannels[0];

  useEffect(() => {
    if (!activeChannel) return;
    const q = query(
      collection(db, 'chat_messages'),
      where('channelId', '==', activeChannel.id)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          time: data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora',
          sortTimestamp: data.timestamp?.toMillis() || Date.now()
        } as Message & { sortTimestamp: number };
      }).sort((a, b) => a.sortTimestamp - b.sortTimestamp);

      setMessages(msgs as Message[]);
    }, (error) => {
      console.error("Neural Chat Error:", error);
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });

    return () => unsub();
  }, [activeChannelId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChannelId) return;

    const messageText = newMessage;
    setNewMessage(''); // Clear immediately for UX

    try {
      await addDoc(collection(db, 'chat_messages'), {
        channelId: activeChannelId,
        sender: userData?.name || auth.currentUser?.email || 'Usuario',
        role: userData?.role === 'customer' ? 'customer' : 'team',
        text: messageText,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending message:", err);
      // Restore message if failed
      setNewMessage(messageText);
      handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
    }
  };

  return (
    <div className="h-full min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* COLUMN 1: NAVIGATION (LEFT) */}
      {!embeddedState && (
        <div className="w-full md:w-80 border-r border-white/5 flex flex-col bg-[#050505] shadow-2xl z-20">
          <div className="p-6 border-b border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Command Center</h2>
              <div className="p-2 bg-[#00F0FF]/10 text-[#00F0FF] rounded-xl">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input 
                type="text" 
                placeholder="Buscar canal o mensaje..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00F0FF]/50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-4 text-white">
               <button 
                 onClick={() => setView('chat')}
                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   view === 'chat' ? 'bg-[#00F0FF] text-black shadow-lg' : 'text-gray-500 hover:text-white'
                 }`}
               >
                  <div className="flex flex-col items-center">
                    <MessageSquare className="w-4 h-4 mb-1" />
                    Chat
                  </div>
               </button>
               <button 
                 onClick={() => setView('ai-engine')}
                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   view === 'ai-engine' ? 'bg-[#A855F7] text-white shadow-lg' : 'text-gray-500 hover:text-white'
                 }`}
               >
                  <div className="flex flex-col items-center">
                    <Wand2 className="w-4 h-4 mb-1" />
                    AI Engine
                  </div>
               </button>
            </div>

            {view === 'chat' ? (
              <>
                {/* Groups section */}
                <div>
                  <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-4 mb-4">Canales Activos</h3>
                  <div className="space-y-1">
                    {allChannels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannelId(channel.id)}
                        className={`w-full group px-4 py-3 rounded-2xl flex items-center gap-4 transition-all duration-300 ${
                          activeChannelId === channel.id 
                            ? 'bg-gradient-to-r from-[#00F0FF]/20 to-transparent border-l-2 border-[#00F0FF]' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner transition-transform group-hover:scale-110 ${
                          channel.type === 'team' ? 'bg-blue-500/10 text-blue-400' : 
                          channel.type === 'client' ? 'bg-[#00F0FF]/10 text-[#00F0FF]' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {channel.type === 'client' ? <User className="w-5 h-5" /> : channel.type === 'team' ? <Users className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-sm font-bold truncate ${activeChannelId === channel.id ? 'text-white' : 'text-gray-400'}`}>{channel.name}</span>
                            <span className="text-sm">{channel.sentimentEmoji}</span>
                          </div>
                          <p className="text-[10px] text-gray-600 truncate font-medium">{channel.lastMessage}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-4">Recursos Inteligentes</h3>
                 <div className="p-4 bg-[#A855F7]/10 rounded-2xl border border-[#A855F7]/20">
                    <p className="text-[9px] font-black text-[#A855F7] uppercase tracking-widest mb-1 italic">Status: Link Active</p>
                    <p className="text-[10px] text-white font-medium">El motor de IA está conectado a los módulos de Proyectos, Academia y Finanzas.</p>
                 </div>
                 <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Plantillas Legales', icon: FileText },
                      { label: 'Firmas CISO', icon: ShieldCheck },
                      { label: 'Logs de Envío', icon: Activity }
                    ].map(item => (
                      <button key={item.label} className="w-full p-4 rounded-xl border border-white/5 bg-white/2 backdrop-blur-sm flex items-center gap-3 hover:bg-white/5 transition-all text-left">
                         <item.icon className="w-4 h-4 text-[#A855F7]" />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COLUMN 2: CHAT FLOW OR AI ENGINE (CENTER) */}
      <div className="flex-1 flex flex-col bg-[#080808] relative">
        {view === 'chat' ? (
          <>
            {/* Header */}
            {activeChannel && (
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#080808]/80 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-4 text-white">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#111] to-black border border-white/10 flex items-center justify-center text-[#00F0FF] shadow-2xl rotate-3">
                    {activeChannel.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tight">{activeChannel.name}</h3>
                    <div className="text-[9px] font-black text-[#00F0FF] uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Sincronización IA Activa
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsSummarizing(true)}
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-[#00F0FF]/20 text-gray-300 hover:text-[#00F0FF] border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                    Resumir con IA
                  </button>
                  <button className="p-2.5 bg-white/5 text-gray-500 hover:text-white border border-white/10 rounded-xl transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Message Flow */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar text-white">
              <AnimatePresence>
                {isSummarizing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-900 border border-[#00F0FF]/30 rounded-[2rem] p-6 mb-8 shadow-2xl relative overflow-hidden"
                  >
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[#00F0FF]">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Resumen Inteligente</span>
                        </div>
                        <button onClick={() => setIsSummarizing(false)} className="text-gray-500 hover:text-white uppercase text-[8px] font-black">Cerrar</button>
                     </div>
                     <p className="text-sm text-gray-300 leading-relaxed font-medium">
                        El cliente {activeChannel?.name} está muy satisfecho. 
                        <span className="text-[#00F0FF] italic"> Acción recomendada:</span> Continuar con el soporte de primer nivel.
                     </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <MessageSquare className="w-12 h-12 mb-4 text-gray-600" />
                  <p className="text-sm font-medium">Comienza la conversación en {activeChannel?.name}</p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'team' ? 'items-start' : 'items-end'}`}>
                   <div className={`flex gap-4 max-w-[85%] group ${msg.role === 'customer' ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-10 w-10 rounded-2xl shrink-0 flex items-center justify-center font-black text-xs shadow-2xl transition-transform group-hover:scale-110 ${
                        msg.role === 'team' ? 'bg-gray-800 text-[#00F0FF] rotate-3' : 'bg-[#00F0FF] text-black -rotate-3'
                      }`}>
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 mb-1 ${msg.role === 'customer' ? 'justify-end' : ''}`}>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{msg.sender}</span>
                          {msg.priority === 'high' && <span className="bg-red-500/20 text-red-500 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">Priority</span>}
                        </div>
                        <div className={`rounded-[2rem] px-6 py-4 shadow-2xl border transition-all ${
                          msg.role === 'team' 
                            ? msg.sentiment === 'negative' ? 'bg-red-950/20 border-red-500/50 text-red-200' : 'bg-[#111] border-white/5 text-gray-200 rounded-tl-[4px]' 
                            : 'bg-white border-white/10 text-gray-900 rounded-tr-[4px] shadow-[#00F0FF]/5'
                        } ${msg.sentiment === 'positive' ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5' : ''}`}>
                          <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center justify-end gap-2 mt-3 text-[8px] font-black text-gray-600 uppercase tracking-widest">
                            {msg.time}
                            {msg.role === 'team' && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-8 border-t border-white/5 bg-[#050505] shrink-0">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4 bg-white/5 border border-white/10 rounded-[2.5rem] p-2 pl-6 shadow-2xl group focus-within:border-[#00F0FF]/50 transition-all">
                <button type="button" className="text-gray-500 hover:text-[#00F0FF] p-2 transition-colors hidden sm:block">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent border-none text-sm text-gray-200 outline-none placeholder:text-gray-600 font-medium py-2"
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-[#00F0FF] text-black h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center hover:bg-[#00BFFF] transition-colors shadow-lg disabled:opacity-50 shrink-0">
                  <Send className="w-4 h-4 sm:w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <AINotificationEngine />
        )}
      </div>

      {/* COLUMN 3: CONTEXT DASHBOARD (RIGHT) */}
      {!embeddedState && activeChannel?.type === 'client' && (
        <div className="hidden lg:flex w-96 border-l border-white/5 flex-col bg-[#050505] overflow-y-auto">
          <div className="p-8 space-y-8">
            <div className="text-center text-white">
              <div className="h-24 w-24 bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-3xl rotate-3">
                 <Activity className="w-10 h-10 text-[#00F0FF]" />
              </div>
              <h4 className="text-xl font-black uppercase italic tracking-tighter">{activeChannel.name}</h4>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Status Activo</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 text-white">Health Score</p>
                  <p className="text-2xl font-black text-white italic tracking-tighter">{clients.find(c => c.id === activeChannel.id)?.healthScore || '--'}%</p>
               </div>
               <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 text-white">Pipeline</p>
                  <p className="text-sm mt-1 font-black text-[#00F0FF] uppercase tracking-tighter truncate">{clients.find(c => c.id === activeChannel.id)?.pipelineStage || '--'}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
