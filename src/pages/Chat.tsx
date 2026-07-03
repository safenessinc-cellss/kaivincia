import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Send, Users, User, MessageSquare, Hash, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLocation } from 'react-router-dom';

type ChatFilter = 'all' | 'users' | 'clients' | 'private' | 'groups';

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<Record<string, any>>({});
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activePrivateUserId, setActivePrivateUserId] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userList = Object.entries(users).map(([id, data]) => ({ id, ...data }));

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientId = params.get('clientId') || location.state?.clientId;
    const clientName = params.get('clientName') || location.state?.clientName;
    const embedded = params.get('embedded') === 'true';

    setIsEmbedded(embedded);

    if (clientId) {
      setActiveFilter('clients');
      setActiveClientId(clientId);
      setSearchTerm(clientName || '');
    }
  }, [location]);

  useEffect(() => {
    // Load users for names/avatars
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersMap: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        usersMap[doc.id] = doc.data();
      });
      setUsers(usersMap);
    });

    // Load messages
    const q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'chat_messages'));

    return () => {
      unsubUsers();
      unsubMessages();
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const type = activeFilter === 'all' ? 'groups' : activeFilter;
      let targetId = null;

      if (activeFilter === 'clients') {
        targetId = activeClientId;
      } else if (activeFilter === 'private') {
        targetId = activePrivateUserId;
      }

      await addDoc(collection(db, 'chat_messages'), {
        text: newMessage,
        senderId: auth.currentUser?.uid,
        type,
        targetId,
        createdAt: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
    }
  };

  const filteredMessages = messages.filter(msg => {
    // 1. Private messages must strictly be filtered for private tab and active user
    if (msg.type === 'private') {
      if (activeFilter !== 'private') return false;
      if (!activePrivateUserId) return false;
      const myUid = auth.currentUser?.uid;
      return (
        (msg.senderId === myUid && msg.targetId === activePrivateUserId) ||
        (msg.senderId === activePrivateUserId && msg.targetId === myUid)
      );
    }

    // 2. Client messages must strictly be filtered for clients tab and active client
    if (msg.type === 'clients') {
      if (activeFilter !== 'clients') return false;
      if (activeClientId) {
        return msg.targetId === activeClientId;
      }
      return true;
    }

    // 3. For all other filters
    if (activeFilter !== 'all' && msg.type !== activeFilter) return false;

    // 4. If search term is active, filter text
    if (searchTerm) {
      return msg.text.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className={`h-full flex flex-col md:flex-row bg-white overflow-hidden ${isEmbedded ? '' : 'rounded-xl shadow-sm border border-gray-200'}`}>
      
      {/* Sidebar / Filters */}
      {!isEmbedded && (
        <div className="w-full md:w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Comunicaciones</h2>
          </div>
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar mensajes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'all' ? 'bg-[#00F0FF] text-black font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <MessageSquare className="w-4 h-4" /> Todos los Mensajes
            </button>
            <button 
              onClick={() => setActiveFilter('groups')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'groups' ? 'bg-[#00F0FF] text-black font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Hash className="w-4 h-4" /> Chat General
            </button>
            <button 
              onClick={() => setActiveFilter('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'users' ? 'bg-[#00F0FF] text-black font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users className="w-4 h-4" /> Equipo Interno
            </button>
            <button 
              onClick={() => setActiveFilter('clients')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'clients' ? 'bg-[#00F0FF] text-black font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <User className="w-4 h-4" /> Clientes
            </button>
            <button 
              onClick={() => {
                setActiveFilter('private');
                const firstOtherUser = userList.find(u => u.id !== auth.currentUser?.uid);
                if (firstOtherUser) {
                  setActivePrivateUserId(firstOtherUser.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'private' && !activePrivateUserId ? 'bg-[#00F0FF] text-black font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <MessageSquare className="w-4 h-4" /> Mensajes Privados
            </button>

            {/* Direct Messages Section */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Colegas en Línea</span>
                <span className="bg-gray-250 text-gray-600 px-1.5 py-0.5 rounded text-[8px] font-bold">
                  {userList.filter(u => u.id !== auth.currentUser?.uid).length}
                </span>
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto px-1">
                {userList
                  .filter(u => u.id !== auth.currentUser?.uid)
                  .map(u => {
                    const isSelected = activeFilter === 'private' && activePrivateUserId === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setActiveFilter('private');
                          setActivePrivateUserId(u.id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isSelected 
                            ? 'bg-gray-900 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 ${
                            isSelected ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                          </div>
                          <span className="truncate">{u.name || u.email}</span>
                        </div>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      </button>
                    );
                  })}
                {userList.filter(u => u.id !== auth.currentUser?.uid).length === 0 && (
                  <p className="text-[10px] text-gray-400 italic px-3 py-1">Cargando colegas...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeFilter === 'private' && !activePrivateUserId ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Iniciar un Chat Privado</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-6">Selecciona un compañero del equipo para iniciar una conversación directa, segura y confidencial.</p>
            
            <div className="w-full max-w-md bg-white border border-gray-100 rounded-[2rem] shadow-xl p-4 max-h-64 overflow-y-auto space-y-2">
              {userList
                .filter(u => u.id !== auth.currentUser?.uid)
                .map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setActiveFilter('private');
                      setActivePrivateUserId(u.id);
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-gray-950 text-white flex items-center justify-center font-black text-xs">
                        {u.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900">{u.name || 'Usuario'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.status === 'active' ? 'Disponible' : 'Inactivo'}
                    </span>
                  </button>
                ))}
              {userList.filter(u => u.id !== auth.currentUser?.uid).length === 0 && (
                <p className="text-xs text-gray-400 italic py-4">No hay otros miembros registrados en el equipo.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 capitalize">
                  {activeFilter === 'all' ? 'Todos los Mensajes' : 
                   activeFilter === 'groups' ? 'Chat General' : 
                   activeFilter === 'users' ? 'Chat de Equipo' : 
                   activeFilter === 'clients' ? 'Chat con Clientes' : 
                   `Chat Privado con ${users[activePrivateUserId || '']?.name || 'Colega'}`}
                </h3>
                {activeFilter === 'private' && activePrivateUserId && (
                  <p className="text-[10px] text-slate-400 font-medium lowercase">
                    {users[activePrivateUserId]?.email || ''} • Canal de comunicación Directa Segura
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {filteredMessages.map((msg) => {
                const isMe = msg.senderId === auth.currentUser?.uid;
                const sender = users[msg.senderId] || { name: 'Usuario Desconocido' };
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-3 max-w-[85%] group">
                      {!isMe && (
                        <div className="h-10 w-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                          {sender.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className={`rounded-[1.5rem] px-6 py-4 shadow-xl relative transition-all hover:scale-[1.01] ${
                        isMe 
                          ? 'bg-gray-900 text-white rounded-br-none border border-white/10' 
                          : 'bg-white border border-gray-100 text-gray-900 rounded-bl-none shadow-gray-200/50'
                      }`}>
                        {!isMe && (
                          <div className="flex justify-between items-center mb-2 gap-4">
                            <div className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest">{sender.name}</div>
                            {/* IA Priority Label */}
                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${
                              msg.text.toLowerCase().includes('urgente') || msg.text.toLowerCase().includes('error') || msg.text.toLowerCase().includes('pago')
                                ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                : msg.text.toLowerCase().includes('gracias') || msg.text.toLowerCase().includes('bueno')
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-blue-50 text-blue-600'
                            }`}>
                              <Sparkles className="w-2 h-2" />
                              {msg.text.toLowerCase().includes('urgente') || msg.text.toLowerCase().includes('error') || msg.text.toLowerCase().includes('pago')
                                ? 'Prioridad IA: Alta'
                                : msg.text.toLowerCase().includes('gracias') || msg.text.toLowerCase().includes('hola')
                                  ? 'Prioridad IA: Baja'
                                  : 'Prioridad IA: Normal'}
                            </div>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div className={`text-[9px] mt-3 font-black flex items-center justify-end gap-2 uppercase tracking-widest ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                          {format(parseISO(msg.createdAt), 'HH:mm')}
                          {isMe && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm py-12">
                  No hay mensajes en esta categoría.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    activeFilter === 'private' && activePrivateUserId
                      ? `Enviar mensaje privado a ${users[activePrivateUserId]?.name || 'Colega'}...`
                      : `Enviar mensaje en ${activeFilter}...`
                  }
                  className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] px-4 py-2 border outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-[#00F0FF] text-black p-2 rounded-full hover:bg-[#00BFFF] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
