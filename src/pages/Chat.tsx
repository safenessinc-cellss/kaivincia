import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  Send, Users, User, MessageSquare, Hash, Search, Sparkles, 
  Check, CheckCheck, Shield, ShieldAlert, ShieldCheck, 
  AlertCircle, Loader2, Bot, Info, Settings, UserCheck, 
  UserX, RefreshCw, Layers, ChevronRight, X, Sparkle, Layout
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';

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

  // Colleague filters
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Simulated typing engine state
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  // AI states (Sincronización IA)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Admin User Management state
  const [editingRole, setEditingRole] = useState('user');
  const [editingStatus, setEditingStatus] = useState('active');
  const [updateFeedback, setUpdateFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // UI state
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  const userList = Object.entries(users).map(([id, data]) => ({ id, ...data }));

  // Filter colleague list
  const filteredUsers = userList.filter(u => {
    if (u.id === auth.currentUser?.uid) return false; // Hide current user
    
    // Name/Email Search
    if (userSearchTerm) {
      const term = userSearchTerm.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(term);
      const emailMatch = u.email?.toLowerCase().includes(term);
      if (!nameMatch && !emailMatch) return false;
    }

    // Role Filter
    if (userRoleFilter !== 'all') {
      if (u.role !== userRoleFilter) return false;
    }

    return true;
  });

  // Calculate unread count for a given user
  const getUnreadCount = (userId: string) => {
    return messages.filter(msg => 
      msg.type === 'private' && 
      msg.senderId === userId && 
      msg.targetId === auth.currentUser?.uid && 
      !msg.isRead
    ).length;
  };

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
    // Load users
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

  // Update selected colleague's edit states
  useEffect(() => {
    if (activePrivateUserId && users[activePrivateUserId]) {
      setEditingRole(users[activePrivateUserId].role || 'user');
      setEditingStatus(users[activePrivateUserId].status || 'active');
      setConversationSummary('');
      setAiSuggestions([]);
    }
  }, [activePrivateUserId, users]);

  // Mark incoming private messages as read when chat is open
  useEffect(() => {
    if (activeFilter === 'private' && activePrivateUserId) {
      const unreadMsgs = messages.filter(msg => 
        msg.type === 'private' && 
        msg.senderId === activePrivateUserId && 
        msg.targetId === auth.currentUser?.uid && 
        !msg.isRead
      );

      unreadMsgs.forEach(async (msg) => {
        try {
          const docRef = doc(db, 'chat_messages', msg.id);
          await updateDoc(docRef, {
            isRead: true,
            readAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Error marking message as read:", err);
        }
      });
    }
  }, [activeFilter, activePrivateUserId, messages]);

  // Simulate peer typing
  useEffect(() => {
    if (activeFilter === 'private' && activePrivateUserId) {
      setIsPeerTyping(true);
      const timer = setTimeout(() => {
        setIsPeerTyping(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [activePrivateUserId, activeFilter]);

  // Auto-trigger typing simulation after sending a message
  const triggerPeerTypingSimulation = () => {
    setTimeout(() => {
      setIsPeerTyping(true);
      setTimeout(() => {
        setIsPeerTyping(false);
      }, 2500);
    }, 1500);
  };

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
        isRead: false,
        createdAt: new Date().toISOString()
      });
      setNewMessage('');

      // If chatting privately, trigger a realistic peer response simulation
      if (activeFilter === 'private') {
        triggerPeerTypingSimulation();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
    }
  };

  // Sincronización IA - Generate Smart Replies
  const handleGenerateAiSuggestions = async () => {
    if (!activePrivateUserId) return;
    setIsGeneratingSuggestions(true);
    setAiSuggestions([]);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY no configurado");
      const ai = new GoogleGenAI({ apiKey });

      // Build context from the last 6 messages
      const chatContext = filteredMessages.slice(-6).map(m => {
        const name = m.senderId === auth.currentUser?.uid ? 'Yo' : (users[m.senderId]?.name || 'Colega');
        return `${name}: ${m.text}`;
      }).join('\n');

      const prompt = `
        Actúa como un asistente de redacción empresarial altamente calificado para Kaivincia Corp.
        Basándote en los últimos mensajes del siguiente chat privado de Slack corporativo, genera EXACTAMENTE 3 opciones de respuestas breves, ejecutivas, amables y profesionales que "Yo" podría responder.
        
        Conversación reciente:
        ${chatContext || "(No hay mensajes recientes en el chat. Sugiere saludos iniciales o invitaciones cordiales de trabajo.)"}

        Devuelve un objeto JSON estrictamente formateado de la siguiente manera:
        {
          "suggestions": ["Sugerencia corta 1", "Sugerencia corta 2", "Sugerencia corta 3"]
        }
        Asegúrate de que cada sugerencia tenga un tono corporativo óptimo, esté escrita en español y sea directa (menos de 12 palabras).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setAiSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      console.error("AI Smart Replies failed:", err);
      // Fallback answers in case of errors
      setAiSuggestions([
        "Entendido. Lo reviso inmediatamente y te aviso.",
        "Excelente, quedo a la espera de más detalles.",
        "Gracias por el reporte. ¿Te parece si agendamos una llamada rápida?"
      ]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Sincronización IA - Generate Executive Summary
  const handleGenerateSummary = async () => {
    if (!activePrivateUserId) return;
    setIsGeneratingSummary(true);
    setConversationSummary('');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY no configurado");
      const ai = new GoogleGenAI({ apiKey });

      // Build context from last 12 messages
      const chatContext = filteredMessages.slice(-12).map(m => {
        const name = m.senderId === auth.currentUser?.uid ? 'Yo' : (users[m.senderId]?.name || 'Colega');
        return `${name}: ${m.text}`;
      }).join('\n');

      const prompt = `
        Analiza los siguientes mensajes de chat corporativo entre un miembro del equipo y yo.
        Genera un informe analítico ejecutivo y un resumen de acuerdos en un formato de viñetas estructurado, claro y directo en español.
        Enfócate en:
        1. Resumen de lo discutido (máx. 2 líneas).
        2. Tareas o compromisos pendientes asignados a cada uno.
        3. Sentimiento o tono detectado de la conversación.
        
        Conversación:
        ${chatContext || "No hay mensajes suficientes para generar un resumen."}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      if (response.text) {
        setConversationSummary(response.text);
      } else {
        setConversationSummary("La IA no logró extraer suficiente contexto.");
      }
    } catch (err) {
      console.error("AI Summary failed:", err);
      setConversationSummary("Error al contactar con el Copilot de Inteligencia de Kaivincia.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Admin User Management - Save changes
  const handleSaveUserManagement = async () => {
    if (!activePrivateUserId) return;
    setIsSavingUser(true);
    setUpdateFeedback(null);
    try {
      const userRef = doc(db, 'users', activePrivateUserId);
      await updateDoc(userRef, {
        role: editingRole,
        status: editingStatus
      });

      setUpdateFeedback({ type: 'success', text: 'Permisos y estado actualizados en la base de datos Firestore' });
      setTimeout(() => setUpdateFeedback(null), 4000);
    } catch (err) {
      console.error(err);
      setUpdateFeedback({ type: 'error', text: 'Error de Seguridad: Permiso denegado para editar este perfil' });
      setTimeout(() => setUpdateFeedback(null), 4000);
    } finally {
      setIsSavingUser(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    // 1. Private messages strictly filtered for private tab and active user
    if (msg.type === 'private') {
      if (activeFilter !== 'private') return false;
      if (!activePrivateUserId) return false;
      const myUid = auth.currentUser?.uid;
      return (
        (msg.senderId === myUid && msg.targetId === activePrivateUserId) ||
        (msg.senderId === activePrivateUserId && msg.targetId === myUid)
      );
    }

    // 2. Client messages strictly filtered for clients tab and active client
    if (msg.type === 'clients') {
      if (activeFilter !== 'clients') return false;
      if (activeClientId) {
        return msg.targetId === activeClientId;
      }
      return true;
    }

    // 3. For other filters
    if (activeFilter !== 'all' && msg.type !== activeFilter) return false;

    // 4. If search term is active, filter text
    if (searchTerm) {
      return msg.text.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const activePeer = users[activePrivateUserId || ''] || null;
  const currentUserDoc = users[auth.currentUser?.uid || ''] || null;
  const isCurrentUserAdmin = currentUserDoc?.role === 'admin' || currentUserDoc?.role === 'superadmin' || auth.currentUser?.email === 'safeness.c.a@gmail.com';

  return (
    <div id="chat-layout-container" className={`h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden ${isEmbedded ? '' : 'rounded-3xl shadow-2xl border border-slate-200'}`}>
      
      {/* Sidebar / Filters (Column 1) */}
      {!isEmbedded && (
        <div id="chat-sidebar" className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#00F0FF]/15 rounded-lg text-black">
                <Layout className="w-5 h-5 text-slate-800" />
              </span>
              <h2 className="text-md font-black tracking-tight text-slate-900">Comunicaciones</h2>
            </div>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              CEO Mode
            </span>
          </div>

          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="chat-search-input"
                type="text"
                placeholder="Buscar mensajes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00F0FF]/40 focus:border-[#00F0FF] outline-none transition-all"
              />
            </div>

            {/* General Filter Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                id="chat-filter-all"
                onClick={() => setActiveFilter('all')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${activeFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Todos
              </button>
              <button 
                id="chat-filter-groups"
                onClick={() => setActiveFilter('groups')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${activeFilter === 'groups' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
              >
                <Hash className="w-3.5 h-3.5" /> General
              </button>
            </div>
          </div>

          {/* Direct Colleagues Section (User Management & Messaging) */}
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Canales de Equipo</span>
                <span className="bg-slate-200/60 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded">
                  {filteredUsers.length} COLEGAS
                </span>
              </div>

              {/* Colleague Search and Role Filters */}
              <div className="space-y-1.5">
                <input
                  id="colleague-search-input"
                  type="text"
                  placeholder="Filtrar por nombre o email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[11px] border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none"
                />
                
                <select
                  id="colleague-role-select"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none text-slate-600"
                >
                  <option value="all">Todos los Roles</option>
                  <option value="superadmin">Super Administradores</option>
                  <option value="admin">Administradores</option>
                  <option value="manager">Manejadores / Managers</option>
                  <option value="user">Especialistas / Users</option>
                </select>
              </div>
            </div>

            {/* List of Colleagues with Unread Notifications Badges */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button 
                id="chat-filter-clients"
                onClick={() => setActiveFilter('clients')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeFilter === 'clients' ? 'bg-[#00F0FF] text-black shadow-sm font-black' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Clientes Kaivincia (CRM)</span>
                </div>
                <span className="bg-white/70 px-1.5 py-0.5 rounded text-[10px]">CRM Link</span>
              </button>

              <div className="pt-2">
                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mensajes Privados</p>
                <div className="space-y-0.5">
                  {filteredUsers.map(u => {
                    const isSelected = activeFilter === 'private' && activePrivateUserId === u.id;
                    const unreadCount = getUnreadCount(u.id);
                    const isOnline = u.status === 'active';
                    
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setActiveFilter('private');
                          setActivePrivateUserId(u.id);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group ${
                          isSelected 
                            ? 'bg-slate-900 text-white shadow-lg' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className={`h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center transition-transform group-hover:scale-105 ${
                              isSelected ? 'bg-[#00F0FF] text-black' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 ${isSelected ? 'border-slate-900' : 'border-white'} ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                            }`} />
                          </div>

                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold block truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                {u.name || u.email}
                              </span>
                            </div>
                            <span className={`text-[9px] uppercase tracking-wider block font-semibold ${
                              isSelected ? 'text-[#00F0FF]' : 'text-slate-400'
                            }`}>
                              {u.role || 'user'} • {u.status || 'active'}
                            </span>
                          </div>
                        </div>

                        {/* Unread Message Notification Badge */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {unreadCount > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-black h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                              {unreadCount}
                            </span>
                          )}
                          <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                      </button>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <div className="p-4 text-center">
                      <p className="text-xs text-slate-400 italic">No se encontraron colegas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Logged in User Profile Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {currentUserDoc?.name?.charAt(0).toUpperCase() || auth.currentUser?.email?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div className="truncate min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUserDoc?.name || auth.currentUser?.email}</p>
                  <p className="text-[9px] uppercase font-black tracking-wider text-slate-400 truncate">{currentUserDoc?.role || 'admin'}</p>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area (Column 2) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeFilter === 'private' && !activePrivateUserId ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-md font-black text-slate-900 mb-1">Iniciar Comunicación Privada</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">Selecciona uno de los miembros registrados del equipo Kaivincia en la barra lateral para abrir un canal seguro de chat directo.</p>
            
            <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-4 max-h-64 overflow-y-auto space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black text-left mb-2 px-1">Miembros de Equipo Disponibles</p>
              {userList
                .filter(u => u.id !== auth.currentUser?.uid)
                .map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setActiveFilter('private');
                      setActivePrivateUserId(u.id);
                    }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xs">
                        {u.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{u.name || 'Especialista'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.status === 'active' ? 'Disponible' : 'Desconectado'}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {activeFilter === 'private' && activePeer ? (
                  <>
                    <div className="h-9 w-9 rounded-xl bg-slate-150 text-slate-900 font-bold flex items-center justify-center flex-shrink-0 border border-slate-200">
                      {activePeer.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="truncate min-w-0">
                      <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5 leading-tight">
                        {activePeer.name || activePeer.email}
                        <span className={`h-2 w-2 rounded-full ${activePeer.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium truncate lowercase">
                        {activePeer.email} • Canal de Comunicación Directo
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="font-black text-slate-900 capitalize text-sm">
                      {activeFilter === 'all' ? 'Todos los Mensajes' : 
                       activeFilter === 'groups' ? 'Chat General (Corporativo)' : 
                       activeFilter === 'users' ? 'Chat de Equipo' : 
                       activeFilter === 'clients' ? 'Chat con Clientes CRM' : 'Sala de Comunicación'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Sincronizado en tiempo real con Firestore
                    </p>
                  </div>
                )}
              </div>

              {/* Header Right Buttons */}
              <div className="flex items-center gap-2">
                {activeFilter === 'private' && (
                  <button
                    id="toggle-sidebar-button"
                    onClick={() => setShowRightSidebar(!showRightSidebar)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      showRightSidebar 
                        ? 'bg-slate-950 text-white border-slate-950' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Gestión & IA</span>
                  </button>
                )}
              </div>
            </div>

            {/* Message Thread Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
              {filteredMessages.map((msg) => {
                const isMe = msg.senderId === auth.currentUser?.uid;
                const sender = users[msg.senderId] || { name: 'Colega', email: '' };
                const isRead = msg.isRead === true;
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-2.5 max-w-[80%] group">
                      {!isMe && (
                        <div className="h-8 w-8 rounded-lg bg-slate-950 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {sender.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      
                      <div className={`rounded-2xl px-4 py-3 shadow-sm relative transition-all ${
                        isMe 
                          ? 'bg-slate-900 text-white rounded-br-none border border-slate-800' 
                          : 'bg-white border border-slate-100 text-slate-900 rounded-bl-none'
                      }`}>
                        {!isMe && (
                          <div className="flex justify-between items-center mb-1 gap-4">
                            <span className="text-[10px] font-black text-[#00F0FF] uppercase tracking-wider">{sender.name || 'Colega'}</span>
                            {/* IA NLP Classification */}
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-50 text-slate-500 uppercase tracking-widest flex items-center gap-1">
                              <Sparkle className="w-2 h-2 text-[#00F0FF]" /> 
                              {msg.text.toLowerCase().includes('urgente') || msg.text.toLowerCase().includes('asunto')
                                ? 'Prioridad: Alta'
                                : 'Prioridad: Normal'}
                            </span>
                          </div>
                        )}
                        <p className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</p>
                        
                        <div className={`text-[9px] mt-1.5 font-bold flex items-center justify-end gap-1 uppercase tracking-widest ${
                          isMe ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          {msg.createdAt ? format(parseISO(msg.createdAt), 'HH:mm') : ''}
                          {isMe && (
                            isRead ? (
                              <CheckCheck className="w-3 h-3 text-[#00F0FF]" title="Leído por el destinatario" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-400" title="Enviado a Firestore" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic typing indicator simulated */}
              {isPeerTyping && activePeer && (
                <div className="flex items-end gap-2.5 max-w-[80%] animate-pulse">
                  <div className="h-8 w-8 rounded-lg bg-slate-950 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {activePeer.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">{activePeer.name || 'Colega'} está escribiendo</span>
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {filteredMessages.length === 0 && !isPeerTyping && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                  No hay mensajes registrados en este chat.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Suggestions & Input Bar */}
            <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
              
              {/* Sincronización IA - Quick suggestions box above input */}
              {activeFilter === 'private' && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#00F0FF]" /> Sugerencias Inteligentes de IA
                    </span>
                    <button
                      id="ai-generate-suggestions-button"
                      onClick={handleGenerateAiSuggestions}
                      disabled={isGeneratingSuggestions}
                      className="text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-black flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 transition-all disabled:opacity-50"
                    >
                      {isGeneratingSuggestions ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-2.5 h-2.5" /> Recargar con IA
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {aiSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setNewMessage(suggestion)}
                        className="text-[11px] font-medium bg-[#00F0FF]/10 text-slate-900 border border-[#00F0FF]/30 px-3 py-1.5 rounded-full hover:bg-[#00F0FF]/25 transition-all flex-shrink-0 max-w-xs truncate"
                      >
                        {suggestion}
                      </button>
                    ))}
                    {!isGeneratingSuggestions && aiSuggestions.length === 0 && (
                      <button
                        onClick={handleGenerateAiSuggestions}
                        className="text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-all"
                      >
                        ⚡ Generar sugerencias rápidas de conversación para este colega
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Send Form */}
              <form id="message-send-form" onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  id="message-input"
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    activeFilter === 'private' && activePeer
                      ? `Escribe un mensaje confidencial a ${activePeer.name || 'Colega'}...`
                      : `Enviar mensaje en ${activeFilter === 'all' ? 'Chat General' : activeFilter}...`
                  }
                  className="flex-1 rounded-xl border-slate-200 text-xs shadow-sm focus:border-slate-950 focus:ring-1 focus:ring-slate-950 px-4 py-3 border outline-none bg-slate-50 focus:bg-white transition-all"
                />
                <button
                  id="message-send-button"
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-slate-950 text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12 transition-colors flex-shrink-0"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Right Column: User Profile, Administration and AI executive tools (Column 3) */}
      {activeFilter === 'private' && activePeer && showRightSidebar && !isEmbedded && (
        <div id="user-mgmt-sidebar" className="w-full md:w-80 border-l border-slate-200 bg-white p-5 overflow-y-auto flex flex-col flex-shrink-0">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Detalles & Gestión</h3>
            <button 
              onClick={() => setShowRightSidebar(false)} 
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-black transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section A: User Card Profile */}
          <div className="text-center pb-5 border-b border-slate-100 mb-5">
            <div className="h-16 w-16 bg-slate-900 text-white text-xl font-black rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
              {activePeer.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <h4 className="text-sm font-black text-slate-900">{activePeer.name || 'Especialista'}</h4>
            <p className="text-[11px] text-slate-500 font-medium lowercase mb-2">{activePeer.email}</p>
            
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                {activePeer.role || 'user'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                activePeer.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {activePeer.status || 'active'}
              </span>
            </div>
          </div>

          {/* Section B: Admin User Management Portal (Gestión de Usuarios) */}
          <div className="pb-5 border-b border-slate-100 mb-5">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-600" /> Control Administrativo
            </h5>

            {isCurrentUserAdmin ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Rol de Acceso en Sistema
                  </label>
                  <select
                    id="user-mgmt-role-select"
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-slate-950 transition-all text-slate-800"
                  >
                    <option value="user">Especialista / User</option>
                    <option value="manager">Manejador / Manager</option>
                    <option value="admin">Administrador / Admin</option>
                    <option value="superadmin">Super Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    id="user-mgmt-status-select"
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-slate-950 transition-all text-slate-800"
                  >
                    <option value="active">Activo (Disponible)</option>
                    <option value="pending">Pendiente de Aprobación</option>
                    <option value="inactive">Inactivo (Desconectado)</option>
                    <option value="suspended">Suspendido / Bloqueado</option>
                  </select>
                </div>

                {updateFeedback && (
                  <div className={`p-2.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 ${
                    updateFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{updateFeedback.text}</span>
                  </div>
                )}

                <button
                  id="user-mgmt-save-button"
                  onClick={handleSaveUserManagement}
                  disabled={isSavingUser}
                  className="w-full bg-slate-950 text-white text-xs font-black py-2.5 px-4 rounded-xl hover:bg-slate-850 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSavingUser ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  🔒 El control administrativo de roles y estados de cuenta de colega está restringido. Inicie sesión como Administrador o con el correo principal <strong className="text-slate-900">safeness.c.a@gmail.com</strong> para habilitar estas opciones.
                </p>
              </div>
            )}
          </div>

          {/* Section C: Sincronización IA - Conversation Executive Summarizer (Insights de Mañana) */}
          <div className="mt-auto">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" /> Copilot IA Ejecutivo
            </h5>

            <div className="bg-[#00F0FF]/5 border border-[#00F0FF]/25 p-4 rounded-2xl">
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed mb-3">
                ¿Te uniste tarde a la conversación? Genera un reporte resumido de la conversación actual con acuerdos e insights automatizados.
              </p>

              {conversationSummary && (
                <div className="bg-white border border-[#00F0FF]/15 p-3 rounded-xl mb-3 text-[11px] text-slate-800 leading-relaxed font-mono max-h-48 overflow-y-auto whitespace-pre-line shadow-sm">
                  {conversationSummary}
                </div>
              )}

              <button
                id="ai-generate-summary-button"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="w-full bg-slate-900 text-[#00F0FF] hover:bg-slate-850 text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#00F0FF]/25 transition-all disabled:opacity-50"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extrayendo...
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" /> Generar Resumen IA
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
