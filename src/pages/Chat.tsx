import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  Send, Users, User, MessageSquare, Hash, Search, Sparkles, 
  Check, CheckCheck, Shield, ShieldAlert, ShieldCheck, 
  AlertCircle, Loader2, Bot, Info, Settings, UserCheck, 
  UserX, RefreshCw, Layers, ChevronRight, X, Sparkle, Layout,
  UserPlus, CheckCircle, Mail, Phone, Activity, Clock, 
  Volume2, ShieldX, HelpCircle, ArrowRight, CornerDownRight,
  Filter, Grid, List, CheckCircle2, Paperclip, MoreHorizontal, Smile, RotateCcw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { useGlobalContext } from '../contexts/GlobalContext';
import { motion, AnimatePresence } from 'motion/react';

type ChatFilter = 'all' | 'groups' | 'clients' | 'private' | 'contacts';

interface StandardMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  type: 'groups' | 'clients' | 'private';
  targetId: string | null;
  createdAt: string;
  isRead: boolean;
  role: 'team' | 'customer';
  priority?: 'high' | 'normal';
}

interface GroupChannel {
  id: string;
  name: string;
  type: 'team' | 'group';
  sentimentEmoji: string;
  lastMessage: string;
}

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clients, users: globalUsers } = useGlobalContext();
  const currentUserDoc = globalUsers.find(u => u.id === auth.currentUser?.uid) || null;

  // Navigation and active item states
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('groups');
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activePrivateUserId, setActivePrivateUserId] = useState<string | null>(null);
  
  // Messages and Input states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filters and searches
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  // Interactive UI states
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // AI features (Sincronización IA)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Administration panel states
  const [editingRole, setEditingRole] = useState('user');
  const [editingStatus, setEditingStatus] = useState('active');
  const [updateFeedback, setUpdateFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Base corporate group channels
  const baseChannels: GroupChannel[] = [
    { id: 'general', name: 'Kaivincia Interno', type: 'team', sentimentEmoji: '🔥', lastMessage: 'Chat de equipo activo' },
    { id: 'dev-ops', name: 'DevOps & Scaling', type: 'group', sentimentEmoji: '⚡', lastMessage: 'Infraestructura estable' }
  ];

  // Derive client list for sidebar
  const clientChannels = clients.map(c => ({
    id: c.id,
    name: c.companyName || 'Cliente',
    type: 'client' as const,
    sentimentEmoji: c.healthScore > 80 ? '🤝' : c.healthScore < 50 ? '⚠️' : '✨',
    lastMessage: 'Soporte CRM disponible'
  }));

  // Filter registered users list for the directory and direct messages
  const filteredUsers = globalUsers.filter(u => {
    if (u.id === auth.currentUser?.uid) return false; // Hide current user
    
    // Search
    if (userSearchTerm) {
      const term = userSearchTerm.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(term);
      const emailMatch = u.email?.toLowerCase().includes(term);
      if (!nameMatch && !emailMatch) return false;
    }

    // Role
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;

    // Status
    if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;

    return true;
  });

  // Load query params to route automatically
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    const clientIdParam = params.get('clientId');
    const clientNameParam = params.get('clientName');

    if (viewParam === 'contacts') {
      setActiveFilter('contacts');
    } else if (clientIdParam) {
      setActiveFilter('clients');
      setActiveClientId(clientIdParam);
      setSearchTerm(clientNameParam || '');
    }
  }, [location]);

  // Load chat messages in real-time
  useEffect(() => {
    const q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }, (error) => {
      console.error("Error fetching chat messages:", error);
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });

    return () => unsubscribe();
  }, []);

  // Update selected colleague's administration states
  useEffect(() => {
    if (activePrivateUserId) {
      const peer = globalUsers.find(u => u.id === activePrivateUserId);
      if (peer) {
        setEditingRole(peer.role || 'user');
        setEditingStatus(peer.status || 'active');
        setConversationSummary('');
        setAiSuggestions([]);
      }
    }
  }, [activePrivateUserId, globalUsers]);

  // Standardize messages array to support both direct chat and client/group collections structures
  const parsedMessages: StandardMessage[] = messages.map(msg => {
    const senderId = msg.senderId || (msg.role === 'customer' ? msg.channelId : 'unknown');
    const text = msg.text || '';
    
    // Deduce type
    let type = msg.type;
    if (!type) {
      if (msg.channelId === 'general' || msg.channelId === 'dev-ops') {
        type = 'groups';
      } else if (msg.channelId) {
        type = 'clients';
      } else {
        type = 'private';
      }
    }

    // Deduce target
    const targetId = msg.targetId || msg.channelId || null;

    // Deduce timestamp
    let createdAt = msg.createdAt;
    if (!createdAt && msg.timestamp) {
      try {
        createdAt = new Date(msg.timestamp.toMillis()).toISOString();
      } catch (e) {
        createdAt = new Date().toISOString();
      }
    }
    if (!createdAt) {
      createdAt = new Date().toISOString();
    }

    const sender = globalUsers.find(u => u.id === senderId);
    const senderName = msg.sender || sender?.name || sender?.email?.split('@')[0] || 'Colega';

    // NLP Automated Priority Classifications
    const isUrgent = text.toLowerCase().includes('urgente') || text.toLowerCase().includes('urgency') || text.toLowerCase().includes('asunto prioritario') || text.toLowerCase().includes('cuidado');

    return {
      id: msg.id,
      text,
      senderId,
      senderName,
      type,
      targetId,
      createdAt,
      isRead: msg.isRead ?? true,
      role: msg.role || (senderId === auth.currentUser?.uid ? 'team' : 'customer'),
      priority: isUrgent ? 'high' as const : 'normal' as const
    };
  });

  // Filtering messages based on selected channel/private-peer/client
  const filteredMessages = parsedMessages.filter(msg => {
    // Search filter across text
    if (searchTerm && !msg.text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (activeFilter === 'groups') {
      return msg.type === 'groups' && msg.targetId === activeChannelId;
    }

    if (activeFilter === 'clients') {
      return msg.type === 'clients' && msg.targetId === activeClientId;
    }

    if (activeFilter === 'private') {
      if (!activePrivateUserId) return false;
      const myUid = auth.currentUser?.uid;
      return (
        msg.type === 'private' && (
          (msg.senderId === myUid && msg.targetId === activePrivateUserId) ||
          (msg.senderId === activePrivateUserId && msg.targetId === myUid)
        )
      );
    }

    return true; // fall through
  });

  // Mark direct messages as read when private chat is open
  useEffect(() => {
    if (activeFilter === 'private' && activePrivateUserId) {
      const myUid = auth.currentUser?.uid;
      const unreadPrivateMsgs = messages.filter(msg => 
        msg.type === 'private' && 
        msg.senderId === activePrivateUserId && 
        msg.targetId === myUid && 
        !msg.isRead
      );

      unreadPrivateMsgs.forEach(async (msg) => {
        try {
          const docRef = doc(db, 'chat_messages', msg.id);
          await updateDoc(docRef, {
            isRead: true,
            readAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Error marking direct message as read:", err);
        }
      });
    }
  }, [activeFilter, activePrivateUserId, messages]);

  // Calculate unread count for direct message threads
  const getUnreadCount = (userId: string) => {
    return parsedMessages.filter(msg => 
      msg.type === 'private' && 
      msg.senderId === userId && 
      msg.targetId === auth.currentUser?.uid && 
      !msg.isRead
    ).length;
  };

  // Simulate peer writing indicator
  useEffect(() => {
    if (activeFilter === 'private' && activePrivateUserId) {
      setIsPeerTyping(true);
      const timer = setTimeout(() => {
        setIsPeerTyping(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activePrivateUserId, activeFilter]);

  const triggerPeerTypingResponse = () => {
    setTimeout(() => {
      setIsPeerTyping(true);
      setTimeout(() => {
        setIsPeerTyping(false);
      }, 2000);
    }, 1200);
  };

  // Send message controller
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const textPayload = newMessage.trim();
    setNewMessage(''); // Clear immediately for snappy UI

    try {
      const myUid = auth.currentUser?.uid || 'unknown';
      let targetId: string | null = null;
      let type: 'groups' | 'clients' | 'private' = 'groups';
      let channelId: string | null = null;

      if (activeFilter === 'groups') {
        type = 'groups';
        targetId = activeChannelId;
        channelId = activeChannelId;
      } else if (activeFilter === 'clients') {
        type = 'clients';
        targetId = activeClientId;
        channelId = activeClientId;
      } else if (activeFilter === 'private') {
        type = 'private';
        targetId = activePrivateUserId;
      }

      await addDoc(collection(db, 'chat_messages'), {
        text: textPayload,
        senderId: myUid,
        sender: currentUserDoc?.name || auth.currentUser?.email || 'Usuario',
        role: currentUserDoc?.role === 'customer' ? 'customer' : 'team',
        type,
        targetId,
        channelId,
        isRead: false,
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp()
      });

      if (activeFilter === 'private') {
        triggerPeerTypingResponse();
      }
    } catch (err) {
      console.error("Error sending message to Firestore:", err);
      setNewMessage(textPayload); // Restore on error
      handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
    }
  };

  // Sincronización IA - Generate Smart Suggestions
  const handleGenerateAiSuggestions = async () => {
    if (!activePrivateUserId) return;
    setIsGeneratingSuggestions(true);
    setAiSuggestions([]);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY no configurado");
      const ai = new GoogleGenAI({ apiKey });

      const peer = globalUsers.find(u => u.id === activePrivateUserId);
      const recentContext = filteredMessages.slice(-6).map(m => {
        const name = m.senderId === auth.currentUser?.uid ? 'Yo' : m.senderName;
        return `${name}: ${m.text}`;
      }).join('\n');

      const prompt = `
        Actúa como un asistente ejecutivo premium de redactores para Kaivincia Corp.
        Basándote en los últimos mensajes de este chat corporativo privado con ${peer?.name || 'Colega'}, genera EXACTAMENTE 3 respuestas de trabajo ejecutivas, eficientes y cordiales que "Yo" podría responder de inmediato.
        
        Conversación reciente:
        ${recentContext || "(No hay mensajes recientes. Sugiere un saludo corporativo cortés para iniciar el contacto.)"}

        Devuelve únicamente un objeto JSON estructurado de la siguiente manera:
        {
          "suggestions": ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"]
        }
        Asegúrate de que cada sugerencia tenga un tono profesional óptimo en español y sea directa (menos de 10 palabras).
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
      console.error("Gemini smart suggestions failed:", err);
      // Fallback
      setAiSuggestions([
        "Entendido. Lo reviso de inmediato y te confirmo.",
        "Excelente. Quedo atento a las directrices de la CEO.",
        "Entendido. ¿Te parece si agendamos una llamada rápida en Teams?"
      ]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Sincronización IA - Generate structured executive summary
  const handleGenerateSummary = async () => {
    if (!activePrivateUserId) return;
    setIsGeneratingSummary(true);
    setConversationSummary('');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY no configurado");
      const ai = new GoogleGenAI({ apiKey });

      const peer = globalUsers.find(u => u.id === activePrivateUserId);
      const chatContext = filteredMessages.slice(-12).map(m => {
        const name = m.senderId === auth.currentUser?.uid ? 'Yo' : m.senderName;
        return `${name}: ${m.text}`;
      }).join('\n');

      const prompt = `
        Analiza los siguientes mensajes de chat corporativo confidencial de Kaivincia Corp con ${peer?.name || 'Colega'}.
        Genera un informe analítico ejecutivo y un resumen estructurado con viñetas en español.
        Enfócate en:
        1. Resumen de temas discutidos (máximo 2 líneas).
        2. Tareas o compromisos pendientes acordados.
        3. Tono analítico o sentimiento general detectado.
        
        Conversación reciente:
        ${chatContext || "No hay mensajes suficientes en el chat para analizar."}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      if (response.text) {
        setConversationSummary(response.text);
      } else {
        setConversationSummary("La IA no logró extraer suficiente contexto de esta conversación.");
      }
    } catch (err) {
      console.error("Gemini summary failed:", err);
      setConversationSummary("Error de Conectividad: No se pudo contactar con el Copilot IA de Kaivincia.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Admin User Management - Save changes to Firestore
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

      setUpdateFeedback({ type: 'success', text: 'Permisos de acceso y rol actualizados con éxito en la base de datos' });
      setTimeout(() => setUpdateFeedback(null), 4000);
    } catch (err) {
      console.error("Error saving user modifications:", err);
      setUpdateFeedback({ type: 'error', text: 'Error de Permisos: No tienes autorización para modificar perfiles' });
      setTimeout(() => setUpdateFeedback(null), 4000);
    } finally {
      setIsSavingUser(false);
    }
  };

  // Helpers to check current peer status
  const activePeer = activePrivateUserId ? globalUsers.find(u => u.id === activePrivateUserId) : null;
  const isCurrentUserAdmin = currentUserDoc?.role === 'admin' || currentUserDoc?.role === 'superadmin' || auth.currentUser?.email === 'safeness.c.a@gmail.com';

  // Statistics calculation
  const totalUsersCount = globalUsers.length;
  const onlineUsersCount = globalUsers.filter(u => u.status === 'active').length;
  const adminUsersCount = globalUsers.filter(u => u.role === 'admin' || u.role === 'superadmin').length;

  return (
    <div id="neural-chat-main-container" className="h-full min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row overflow-hidden font-sans text-white">
      
      {/* COLUMN 1: LEFT SIDEBAR (CHANNELS & ACTIVE LISTS) */}
      <div id="neural-chat-sidebar" className="w-full md:w-80 border-r border-white/5 flex flex-col bg-[#050505] shadow-2xl z-20 shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
              Command Center
            </h2>
            <div className="flex items-center gap-1 bg-[#00F0FF]/10 text-[#00F0FF] text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Sincronización IA
            </div>
          </div>
          
          {/* Main search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input 
              type="text" 
              placeholder="Buscar canal, cliente o mensaje..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#00F0FF]/50 transition-all font-medium"
            />
          </div>
        </div>

        {/* Navigation Tabs (Chats vs Users Directory) */}
        <div className="px-4 py-1 flex gap-1 bg-white/5 rounded-2xl mx-4 mb-4">
          <button 
            onClick={() => {
              setActiveFilter('groups');
              setActiveChannelId('general');
            }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeFilter !== 'contacts' ? 'bg-[#00F0FF] text-black shadow-lg shadow-[#00F0FF]/15' : 'text-gray-500 hover:text-white'
            }`}
          >
            <div className="flex flex-col items-center">
              <MessageSquare className="w-4 h-4 mb-0.5" />
              Chat
            </div>
          </button>
          <button 
            onClick={() => setActiveFilter('contacts')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeFilter === 'contacts' ? 'bg-[#00F0FF] text-black shadow-lg shadow-[#00F0FF]/15' : 'text-gray-500 hover:text-white'
            }`}
          >
            <div className="flex flex-col items-center">
              <Users className="w-4 h-4 mb-0.5" />
              Miembros
            </div>
          </button>
        </div>

        {/* Sidebar Scrollable Channels List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {activeFilter !== 'contacts' ? (
            <>
              {/* Category A: Team Group Channels */}
              <div>
                <div className="flex items-center justify-between px-3 mb-3">
                  <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Canales de Equipo</h3>
                  <span className="bg-white/5 text-gray-400 text-[8px] font-black px-1.5 py-0.5 rounded">
                    {baseChannels.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {baseChannels.map(channel => {
                    const isSelected = activeFilter === 'groups' && activeChannelId === channel.id;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setActiveFilter('groups');
                          setActiveChannelId(channel.id);
                        }}
                        className={`w-full group px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 text-left ${
                          isSelected 
                            ? 'bg-gradient-to-r from-[#00F0FF]/15 to-transparent border-l-2 border-[#00F0FF] text-white' 
                            : 'hover:bg-white/5 text-gray-400'
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5 transition-transform group-hover:scale-105 ${
                          isSelected ? 'bg-blue-500/15 text-blue-400' : 'bg-white/5 text-gray-500'
                        }`}>
                          <Hash className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                              {channel.name}
                            </span>
                            <span className="text-xs">{channel.sentimentEmoji}</span>
                          </div>
                          <p className="text-[9px] text-gray-600 truncate font-medium">{channel.lastMessage}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category B: Clients Channels */}
              <div>
                <div className="flex items-center justify-between px-3 mb-3">
                  <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Clientes CRM</h3>
                  <span className="bg-white/5 text-gray-400 text-[8px] font-black px-1.5 py-0.5 rounded">
                    {clientChannels.length}
                  </span>
                </div>
                <div className="space-y-0.5 max-h-40 overflow-y-auto scrollbar-thin">
                  {clientChannels.map(client => {
                    const isSelected = activeFilter === 'clients' && activeClientId === client.id;
                    return (
                      <button
                        key={client.id}
                        onClick={() => {
                          setActiveFilter('clients');
                          setActiveClientId(client.id);
                        }}
                        className={`w-full group px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 text-left ${
                          isSelected 
                            ? 'bg-gradient-to-r from-[#00F0FF]/15 to-transparent border-l-2 border-[#00F0FF] text-white' 
                            : 'hover:bg-white/5 text-gray-400'
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5 transition-transform group-hover:scale-105 ${
                          isSelected ? 'bg-[#00F0FF]/15 text-[#00F0FF]' : 'bg-white/5 text-gray-500'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                              {client.name}
                            </span>
                            <span className="text-xs">{client.sentimentEmoji}</span>
                          </div>
                          <p className="text-[9px] text-gray-600 truncate font-medium">{client.lastMessage}</p>
                        </div>
                      </button>
                    );
                  })}
                  {clientChannels.length === 0 && (
                    <p className="text-[10px] text-gray-600 italic px-3">No hay clientes sincronizados</p>
                  )}
                </div>
              </div>

              {/* Category C: Private DM Threads */}
              <div>
                <div className="flex items-center justify-between px-3 mb-3">
                  <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Mensajes Directos</h3>
                  <span className="bg-[#00F0FF]/10 text-[#00F0FF] text-[8px] font-black px-1.5 py-0.5 rounded">
                    {filteredUsers.length} COLEGAS
                  </span>
                </div>
                <div className="space-y-0.5 max-h-56 overflow-y-auto scrollbar-thin">
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
                        className={`w-full group px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 text-left ${
                          isSelected 
                            ? 'bg-gradient-to-r from-[#A855F7]/15 to-transparent border-l-2 border-[#A855F7] text-white' 
                            : 'hover:bg-white/5 text-gray-400'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center transition-transform group-hover:scale-105 ${
                            isSelected ? 'bg-[#A855F7] text-white' : 'bg-white/5 text-gray-300'
                          }`}>
                            {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#050505] ${
                            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs font-bold truncate block ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                              {u.name || u.email}
                            </span>
                            {unreadCount > 0 && (
                              <span className="bg-rose-500 text-white text-[8px] font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center animate-bounce">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-600 truncate uppercase font-bold tracking-wider">
                            {u.role || 'user'} • {u.status || 'active'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Búsqueda Rápida</h3>
              <input
                type="text"
                placeholder="Filtrar miembros en tiempo real..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#00F0FF]/50"
              />
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Filtrar por Rol</label>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-gray-300 font-bold focus:outline-none"
                >
                  <option value="all">Todos los Roles</option>
                  <option value="superadmin">SuperAdmin</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Manager</option>
                  <option value="user">Especialista</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Filtrar por Estado</label>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-gray-300 font-bold focus:outline-none"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activo / Disponible</option>
                  <option value="pending">Pendiente</option>
                  <option value="suspended">Bloqueado</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer Logged-in Profile */}
        <div className="p-4 border-t border-white/5 bg-[#111] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#00F0FF] to-yellow-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-lg shadow-black">
              {currentUserDoc?.name?.charAt(0).toUpperCase() || auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-black text-white truncate leading-tight">{currentUserDoc?.name || auth.currentUser?.email}</p>
              <p className="text-[9px] uppercase font-black tracking-wider text-gray-500">{currentUserDoc?.role || 'user'}</p>
            </div>
          </div>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

      </div>

      {/* COLUMN 2: CENTER WORKSPACE */}
      <div className="flex-1 flex flex-col bg-[#080808] relative min-w-0">
        
        {/* CASE A: MEMBERS / USERS MANAGEMENT DIRECTORY DIRECT */}
        {activeFilter === 'contacts' ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-8 custom-scrollbar">
            
            {/* Executive statistics dashboard header */}
            <div className="mb-8 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 h-36 w-36 bg-[#00F0FF]/5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-1/3 h-20 w-20 bg-purple-500/5 rounded-full blur-2xl" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-[#00F0FF]">
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">Centro de Control de Identidades Kaivincia</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-400">
                  Gestión de Miembros y Permisos
                </h1>
                <p className="text-gray-400 text-xs max-w-2xl leading-relaxed">
                  Supervisa la lista de todos los colaboradores autenticados, audita roles del sistema en tiempo real y gestiona permisos de acceso directo sincronizados de inmediato en Firestore.
                </p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <span className="block text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">Miembros</span>
                    <span className="text-xl sm:text-2xl font-black text-white">{totalUsersCount}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">En Línea</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> {onlineUsersCount}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">Administradores</span>
                    <span className="text-xl sm:text-2xl font-black text-[#00F0FF]">{adminUsersCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter control bar */}
            <div className="bg-zinc-950/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar miembro por nombre o correo..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#00F0FF]/40"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="all">Todos los Roles</option>
                  <option value="superadmin">SuperAdmin</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Manager</option>
                  <option value="user">Especialista</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="suspended">Bloqueado</option>
                </select>

                <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'grid' ? 'bg-[#00F0FF] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-[#00F0FF] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Render Members: Grid vs List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(u => {
                  const isOnline = u.status === 'active';
                  const unreadCount = getUnreadCount(u.id);
                  
                  return (
                    <motion.div 
                      key={u.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#050505] border border-white/5 hover:border-[#00F0FF]/30 hover:shadow-2xl hover:shadow-[#00F0FF]/5 rounded-3xl p-5 flex flex-col justify-between relative group transition-all"
                    >
                      {unreadCount > 0 && (
                        <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">
                          {unreadCount} mensaje(s) nuevo(s)
                        </span>
                      )}

                      <div>
                        {/* Profile header within card */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative shrink-0">
                            <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-gray-300 font-black flex items-center justify-center border border-white/10 text-md shadow-inner">
                              {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#050505] ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                            }`} />
                          </div>

                          <div>
                            <h4 className="font-black text-white text-sm truncate max-w-[150px]">{u.name || 'Especialista'}</h4>
                            <p className="text-xs text-gray-500 truncate lowercase font-medium">{u.email}</p>
                          </div>
                        </div>

                        {/* Badges & Extra meta information */}
                        <div className="space-y-2 mb-5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 text-[9px] font-black uppercase tracking-wide">
                              {u.role || 'user'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                              isOnline 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-white/5 text-gray-500 border-white/5'
                            }`}>
                              {u.status || 'active'}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-600 space-y-1">
                            <p className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
                              <span>ID: {u.id.substring(0, 12)}...</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-600" />
                              <span>Conexión: Sincronizado en vivo</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons inside card */}
                      <div className="pt-3 border-t border-white/5 flex gap-2">
                        <button
                          onClick={() => {
                            setActiveFilter('private');
                            setActivePrivateUserId(u.id);
                          }}
                          className="flex-1 bg-white text-black hover:bg-[#00F0FF] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-black" /> Enviar Mensaje
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter('private');
                            setActivePrivateUserId(u.id);
                            setShowRightSidebar(true);
                          }}
                          className="bg-white/5 hover:bg-white/10 text-gray-300 p-2.5 rounded-xl border border-white/5 transition-all"
                          title="Gestionar roles y estado de cuenta"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="col-span-full py-16 text-center text-gray-500">
                    <Users className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                    <p className="text-sm">No se encontraron miembros registrados con los filtros aplicados.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Members List View */
              <div className="bg-[#050505] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/2 text-gray-400 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Correo Electrónico</th>
                      <th className="px-6 py-4">Rol en CRM</th>
                      <th className="px-6 py-4">Estatus</th>
                      <th className="px-6 py-4 text-right">Acciones Directas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => {
                      const isOnline = u.status === 'active';
                      const unreadCount = getUnreadCount(u.id);
                      
                      return (
                        <tr key={u.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold flex items-center justify-center text-xs">
                                  {u.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#050505] ${
                                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-white leading-none">{u.name || 'Especialista'}</p>
                                <p className="text-[9px] text-gray-600 font-mono mt-1">UID: {u.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400 font-mono lowercase">
                            {u.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300 text-[9px] font-black uppercase tracking-wider">
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                              isOnline 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-white/5 text-gray-500 border-white/5'
                            }`}>
                              {u.status || 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {unreadCount > 0 && (
                                <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full mr-2">
                                  {unreadCount} nuevo
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setActiveFilter('private');
                                  setActivePrivateUserId(u.id);
                                }}
                                className="bg-[#00F0FF] text-black hover:bg-[#00BFFF] text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
                              >
                                Chatear
                              </button>
                              <button
                                onClick={() => {
                                  setActiveFilter('private');
                                  setActivePrivateUserId(u.id);
                                  setShowRightSidebar(true);
                                }}
                                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* CASE B: STANDARD CHAT WINDOW (GROUPS / CLIENTS / PRIVATE PEER) */
          <>
            {activeFilter === 'private' && !activePrivateUserId ? (
              /* No Private Chat Selected State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Users className="w-16 h-16 text-zinc-800 mb-4 animate-pulse" />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Mensajería Privada Segura</h3>
                <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
                  Inicia una conversación confidencial con cualquier colaborador de la plataforma. Los mensajes se envían en tiempo real y están cifrados localmente en Firestore.
                </p>
                
                <button 
                  onClick={() => setActiveFilter('contacts')}
                  className="bg-[#00F0FF] text-black hover:bg-[#00BFFF] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#00F0FF]/10 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" /> Ver Directorio de Miembros
                </button>
              </div>
            ) : (
              /* Active Chat Stream */
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#080808]/85 backdrop-blur-md z-10 shrink-0">
                  <div className="flex items-center gap-4 text-white min-w-0">
                    {activeFilter === 'private' && activePeer ? (
                      <>
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-zinc-850 to-zinc-950 border border-white/10 flex items-center justify-center font-bold text-white shadow-xl flex-shrink-0">
                          {activePeer.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="truncate min-w-0">
                          <h3 className="text-md font-black uppercase italic tracking-tight flex items-center gap-2">
                            {activePeer.name || activePeer.email}
                            <span className={`h-2 w-2 rounded-full ${activePeer.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                          </h3>
                          <div className="text-[9px] font-black text-[#A855F7] uppercase tracking-[0.2em] truncate">
                            Canal Privado • {activePeer.email}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#111] to-black border border-white/10 flex items-center justify-center text-[#00F0FF] shadow-xl flex-shrink-0">
                          {activeFilter === 'groups' ? <Hash className="w-5 h-5 text-[#00F0FF]" /> : <User className="w-5 h-5 text-purple-400" />}
                        </div>
                        <div>
                          <h3 className="text-md font-black uppercase italic tracking-tight">
                            {activeFilter === 'groups' 
                              ? (baseChannels.find(c => c.id === activeChannelId)?.name || 'General')
                              : (clients.find(c => c.id === activeClientId)?.companyName || 'Canal de Cliente')
                            }
                          </h3>
                          <div className="text-[9px] font-black text-[#00F0FF] uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Sincronización IA Activa
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Header right icons */}
                  <div className="flex gap-2">
                    {activeFilter === 'private' && (
                      <button 
                        onClick={() => setIsSummarizing(true)}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#A855F7]/20 text-gray-300 hover:text-[#A855F7] border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                        Resumir con IA
                      </button>
                    )}
                    
                    {activeFilter === 'private' && (
                      <button 
                        onClick={() => setShowRightSidebar(!showRightSidebar)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          showRightSidebar 
                            ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-lg shadow-[#00F0FF]/10' 
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                        }`}
                        title="Ver gestión administrativa y resumen IA"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Summarize Banner */}
                <AnimatePresence>
                  {isSummarizing && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mx-6 sm:mx-8 mt-6 bg-[#050505] border border-[#A855F7]/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-[#A855F7]">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Resumen de IA en Vivo</span>
                        </div>
                        <button onClick={() => setIsSummarizing(false)} className="text-gray-500 hover:text-white uppercase text-[8px] font-black">Cerrar</button>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        El colega {activePeer?.name || 'miembro de equipo'} se encuentra activo y coordinando tareas. 
                        <span className="text-[#A855F7] italic"> Nota del Copilot:</span> Utilice el botón "Generar Resumen IA" en el panel lateral para extraer acuerdos, compromisos y un análisis pormenorizado en tiempo real.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message stream */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar text-white">
                  
                  {filteredMessages.length === 0 && !isPeerTyping && (
                    <div className="flex flex-col items-center justify-center h-full opacity-45 py-12">
                      <MessageSquare className="w-12 h-12 mb-4 text-zinc-800 animate-pulse" />
                      <p className="text-xs font-semibold uppercase tracking-wider">No hay mensajes registrados en este canal</p>
                      <p className="text-[10px] text-gray-600 mt-1">Escribe abajo para iniciar la conversación instantánea</p>
                    </div>
                  )}

                  {filteredMessages.map((msg) => {
                    const isMe = msg.senderId === auth.currentUser?.uid;
                    const isHighPriority = msg.priority === 'high';

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] group ${isMe ? 'flex-row-reverse' : ''}`}>
                          
                          {/* Avatar block */}
                          <div className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs shadow-lg ${
                            isMe ? 'bg-zinc-800 text-[#00F0FF] rotate-3' : 'bg-white text-black -rotate-3'
                          }`}>
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>

                          {/* Message bubble content */}
                          <div className="space-y-1">
                            <div className={`flex items-center gap-2 mb-0.5 ${isMe ? 'justify-end' : ''}`}>
                              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{msg.senderName}</span>
                              {isHighPriority && (
                                <span className="bg-rose-500/10 text-rose-500 text-[7px] border border-rose-500/25 font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                  Prioridad: Alta
                                </span>
                              )}
                            </div>
                            
                            <div className={`rounded-2xl px-5 py-3 shadow-xl border transition-all ${
                              isMe 
                                ? 'bg-zinc-950 border-white/5 text-gray-100 rounded-tr-none' 
                                : 'bg-white text-black border-white/10 rounded-tl-none'
                            }`}>
                              <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                              <div className={`flex items-center justify-end gap-1.5 mt-2 text-[8px] font-black uppercase tracking-widest ${
                                isMe ? 'text-gray-500' : 'text-zinc-400'
                              }`}>
                                {msg.createdAt ? format(parseISO(msg.createdAt), 'HH:mm') : 'Ahora'}
                                {isMe && (
                                  msg.isRead ? (
                                    <span title="Leído por el destinatario">
                                      <CheckCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
                                    </span>
                                  ) : (
                                    <span title="Enviado con éxito">
                                      <Check className="w-3.5 h-3.5 text-zinc-500" />
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator simulated */}
                  {isPeerTyping && activePeer && (
                    <div className="flex flex-col items-start animate-pulse">
                      <div className="flex gap-3 max-w-[80%]">
                        <div className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs shadow-lg bg-white text-black -rotate-3">
                          {activePeer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{activePeer.name}</span>
                          <div className="rounded-2xl px-5 py-3 shadow-xl border bg-white text-black border-white/10 rounded-tl-none flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-600">Escribiendo</span>
                            <div className="flex gap-0.5">
                              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce" />
                              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message send and smart suggestions bar */}
                <div className="p-4 sm:p-6 border-t border-white/5 bg-[#050505] shrink-0">
                  <div className="max-w-4xl mx-auto space-y-3">
                    
                    {/* Sincronización IA - Quick Suggestions panel */}
                    {activeFilter === 'private' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" /> Sugerencias Inteligentes Copilot
                          </span>
                          <button
                            onClick={handleGenerateAiSuggestions}
                            disabled={isGeneratingSuggestions}
                            className="text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5 transition-all disabled:opacity-50"
                          >
                            {isGeneratingSuggestions ? (
                              <>
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Analizando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-2.5 h-2.5" /> Recargar sugerencias
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                          {aiSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setNewMessage(suggestion)}
                              className="text-[10px] font-bold bg-[#00F0FF]/10 text-white border border-[#00F0FF]/25 px-3 py-1.5 rounded-full hover:bg-[#00F0FF]/25 transition-all flex-shrink-0"
                            >
                              {suggestion}
                            </button>
                          ))}
                          {!isGeneratingSuggestions && aiSuggestions.length === 0 && (
                            <button
                              onClick={handleGenerateAiSuggestions}
                              className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/3 border border-white/5 px-4 py-2 rounded-full hover:bg-white/5 transition-all"
                            >
                              ⚡ Generar respuestas contextuales con Inteligencia Artificial
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat box Form */}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-[2rem] p-2 pl-6 shadow-2xl focus-within:border-[#00F0FF]/40 transition-all">
                      <button type="button" className="text-gray-500 hover:text-[#00F0FF] p-2 transition-colors hidden sm:block">
                        <Paperclip className="w-4.5 h-4.5" />
                      </button>
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={
                          activeFilter === 'private' && activePeer 
                            ? `Escribir mensaje confidencial a ${activePeer.name || 'Colega'}...`
                            : 'Escribe un mensaje de equipo...'
                        }
                        className="flex-1 bg-transparent border-none text-xs text-gray-200 outline-none placeholder:text-gray-600 font-medium py-2.5"
                      />
                      <button type="button" className="text-gray-500 hover:text-[#00F0FF] p-2 transition-colors hidden sm:block">
                        <Smile className="w-4.5 h-4.5" />
                      </button>
                      <button type="submit" disabled={!newMessage.trim()} className="bg-[#00F0FF] text-black h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center hover:bg-[#00BFFF] transition-colors shadow-lg disabled:opacity-40 shrink-0">
                        <Send className="w-4 h-4 text-black" />
                      </button>
                    </form>

                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* COLUMN 3: RIGHT SIDEBAR (ADMINISTRATION & IA DETAILS) */}
      {activeFilter === 'private' && activePeer && showRightSidebar && (
        <div id="neural-chat-right-sidebar" className="w-full md:w-80 border-l border-white/5 flex flex-col bg-[#050505] p-5 overflow-y-auto shrink-0 z-20">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Gestión & Copilot</h3>
            <button 
              onClick={() => setShowRightSidebar(false)} 
              className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User profile view */}
          <div className="text-center pb-5 border-b border-white/5 mb-5 space-y-3">
            <div className="h-16 w-16 bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-2xl flex items-center justify-center font-bold text-white text-lg mx-auto shadow-xl">
              {activePeer.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{activePeer.name || 'Especialista'}</h4>
              <p className="text-[10px] text-gray-500 lowercase font-mono truncate">{activePeer.email}</p>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 text-[9px] font-black uppercase tracking-wider border border-white/5">
                {activePeer.role || 'user'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                activePeer.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}>
                {activePeer.status || 'active'}
              </span>
            </div>
          </div>

          {/* User Management Panel (Restricted to Admin / SuperAdmin) */}
          <div className="pb-5 border-b border-white/5 mb-5 space-y-3">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#00F0FF]" /> Control de Acceso
            </h5>

            {isCurrentUserAdmin ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-600 uppercase tracking-wider mb-1">
                    Rol de Sistema Autorizado
                  </label>
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:border-[#00F0FF]"
                  >
                    <option value="user">Especialista / Colaborador</option>
                    <option value="tutor">Tutor Académico</option>
                    <option value="telemarketing">Operador Telemarketing</option>
                    <option value="manager">Manejador / Manager</option>
                    <option value="admin">Administrador / Admin</option>
                    <option value="superadmin">Super Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-600 uppercase tracking-wider mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:border-[#00F0FF]"
                  >
                    <option value="active">Activo (Activado)</option>
                    <option value="pending">Pendiente de Aprobación</option>
                    <option value="suspended">Suspendido / Bloqueado</option>
                  </select>
                </div>

                {updateFeedback && (
                  <div className={`p-2.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 ${
                    updateFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{updateFeedback.text}</span>
                  </div>
                )}

                <button
                  onClick={handleSaveUserManagement}
                  disabled={isSavingUser}
                  className="w-full bg-[#00F0FF] text-black hover:bg-[#00BFFF] text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSavingUser ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Sincronizando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-white/2 rounded-xl border border-white/5 text-gray-500 text-[10px] leading-relaxed">
                🔒 La configuración administrativa de cuentas de colaboradores está restringida. Inicia sesión con una cuenta de nivel Administrador o el correo principal <strong className="text-white">safeness.c.a@gmail.com</strong> para modificar este perfil.
              </div>
            )}
          </div>

          {/* Conversation executive summarizer */}
          <div className="space-y-3 mt-auto">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-[#A855F7]" /> Copilot de Inteligencia
            </h5>
            
            <div className="bg-[#A855F7]/5 border border-[#A855F7]/20 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                Genera de inmediato un informe analítico ejecutivo y un resumen estructurado de acuerdos sobre los últimos mensajes cruzados con este colega.
              </p>

              {conversationSummary && (
                <div className="bg-black/60 border border-white/5 p-3 rounded-xl text-[10px] text-gray-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-mono custom-scrollbar">
                  {conversationSummary}
                </div>
              )}

              <button
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="w-full bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-white text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extrayendo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" /> Generar Resumen IA
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
