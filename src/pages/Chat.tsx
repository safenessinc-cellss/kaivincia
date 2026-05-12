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
  const [isEmbedded, setIsEmbedded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      await addDoc(collection(db, 'chat_messages'), {
        text: newMessage,
        senderId: auth.currentUser?.uid,
        type: activeFilter === 'all' ? 'groups' : activeFilter,
        targetId: activeFilter === 'clients' ? activeClientId : null,
        createdAt: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (activeFilter !== 'all' && msg.type !== activeFilter) return false;
    
    // Improved client filtering
    if (activeFilter === 'clients' && activeClientId) {
      return msg.targetId === activeClientId;
    }

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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'all' ? 'bg-[#00F0FF] text-black' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <MessageSquare className="w-4 h-4" /> Todos los Mensajes
            </button>
            <button 
              onClick={() => setActiveFilter('groups')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'groups' ? 'bg-[#00F0FF] text-black' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Hash className="w-4 h-4" /> Grupos (General)
            </button>
            <button 
              onClick={() => setActiveFilter('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'users' ? 'bg-[#00F0FF] text-black' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users className="w-4 h-4" /> Equipo Interno
            </button>
            <button 
              onClick={() => setActiveFilter('clients')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'clients' ? 'bg-[#00F0FF] text-black' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <User className="w-4 h-4" /> Clientes
            </button>
            <button 
              onClick={() => setActiveFilter('private')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'private' ? 'bg-[#00F0FF] text-black' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <MessageSquare className="w-4 h-4" /> Mensajes Privados
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h3 className="font-bold text-gray-900 capitalize">
            {activeFilter === 'all' ? 'Todos los Mensajes' : 
             activeFilter === 'groups' ? 'Chat General' : 
             activeFilter === 'users' ? 'Chat de Equipo' : 
             activeFilter === 'clients' ? 'Chat con Clientes' : 'Mensajes Privados'}
          </h3>
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
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
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
              placeholder={`Enviar mensaje en ${activeFilter}...`}
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
      </div>
    </div>
  );
}
