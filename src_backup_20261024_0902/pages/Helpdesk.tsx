import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  Plus, 
  Search, 
  MessageSquare, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  UserCheck, 
  ShieldAlert, 
  RefreshCw,
  Sparkles,
  Inbox,
  AlertTriangle
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  SupportTicket, 
  createTicket, 
  replyTicket, 
  changeTicketStatus, 
  assignTicket, 
  closeTicket 
} from '../services/helpdeskService';

export default function Helpdesk() {
  const { t } = useLanguage();
  const { user, loading: authLoading, userData } = useAuth();

  // Estados de datos
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rol del usuario actual
  const [userRole, setUserRole] = useState<string>(() => userData?.role || 'collaborator');
  const [adminUsers, setAdminUsers] = useState<Array<{ uid: string; email: string; name: string }>>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal de creación
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Campo de respuesta rápida
  const [replyText, setReplyText] = useState('');

  const currentRole = userData?.role || userRole;
  const isAdminOrManager = ['superadmin', 'admin', 'ceo', 'gestor'].includes(currentRole);

  // 1. Obtener rol del usuario si es admin
  useEffect(() => {
    if (authLoading || !user) return;
    if (userData?.role) {
      setUserRole(userData.role);
    }

    if (!isAdminOrManager) return;

    const unsubUser = onSnapshot(collection(db, 'users'), (snapshot) => {
      const currentDoc = snapshot.docs.find(d => d.id === user.uid);
      if (currentDoc) {
        const role = currentDoc.data().role || 'collaborator';
        setUserRole(role);
      }
      // Lista de operadores para asignación
      const staff = snapshot.docs
        .filter(d => ['superadmin', 'admin', 'ceo', 'gestor', 'tlmk'].includes(d.data().role))
        .map(d => ({
          uid: d.id,
          email: d.data().email || 'Sin correo',
          name: d.data().name || d.data().email || d.id
        }));
      setAdminUsers(staff);
    }, (err) => {
      console.warn("Helpdesk users query handled:", err?.message);
    });

    return () => unsubUser();
  }, [user, authLoading, userData?.role, isAdminOrManager]);

  // 2. Suscripción reactiva a support_tickets según RBAC
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let q;
    if (isAdminOrManager) {
      q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        collection(db, 'support_tickets'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: SupportTicket[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SupportTicket));
        setTickets(docs);
        setLoading(false);

        // Mantener sincronizado el ticket seleccionado
        if (selectedTicket) {
          const updated = docs.find(t => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      },
      (error) => {
        console.warn('Error al escuchar support_tickets:', error?.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, isAdminOrManager]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Manejador de creación
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    setActionLoading(true);
    try {
      const newId = await createTicket({
        subject: newSubject,
        description: newDescription,
        priority: newPriority
      });
      setNewSubject('');
      setNewDescription('');
      setNewPriority('medium');
      setShowCreateModal(false);
      showToast(t('helpdesk.success_create'));
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error al crear ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador de respuesta
  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setActionLoading(true);
    try {
      await replyTicket(selectedTicket.id, replyText);
      setReplyText('');
      showToast(t('helpdesk.success_reply'));
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error al responder', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cambio de estado
  const handleStatusChange = async (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await changeTicketStatus(selectedTicket.id, status);
      showToast(t('helpdesk.success_status'));
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error al cambiar estado', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Asignar responsable
  const handleAssign = async (targetUid: string) => {
    if (!selectedTicket) return;
    const targetUser = adminUsers.find(u => u.uid === targetUid);
    setActionLoading(true);
    try {
      await assignTicket(
        selectedTicket.id, 
        targetUid || null, 
        targetUser?.email || null
      );
      showToast(t('helpdesk.success_assign'));
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error al asignar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cerrar ticket
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await closeTicket(selectedTicket.id);
      showToast(t('helpdesk.success_close'));
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error al cerrar ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrado en memoria
  const filteredTickets = tickets.filter(tkt => {
    const matchesSearch = 
      tkt.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tkt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tkt.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tkt.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || tkt.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t('helpdesk.priority_critical')}</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">{t('helpdesk.priority_high')}</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">{t('helpdesk.priority_medium')}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-500/20 text-slate-400 border border-slate-500/30">{t('helpdesk.priority_low')}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t('helpdesk.status_open')}</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" /> {t('helpdesk.status_in_progress')}</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> {t('helpdesk.status_resolved')}</span>;
      case 'closed':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5"><XCircle className="w-3 h-3" /> {t('helpdesk.status_closed')}</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2 text-sm font-medium transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' 
            : 'bg-red-950/90 text-red-300 border-red-500/40'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {t('helpdesk.title')}
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Firestore Sync
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('helpdesk.subtitle')} • Rol activo: <span className="text-white font-semibold capitalize">{userRole}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 transition-all border border-cyan-400/30"
          >
            <Plus className="w-4 h-4" />
            {t('helpdesk.new_ticket')}
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={t('helpdesk.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">{t('helpdesk.all_statuses')}</option>
            <option value="open">{t('helpdesk.status_open')}</option>
            <option value="in_progress">{t('helpdesk.status_in_progress')}</option>
            <option value="resolved">{t('helpdesk.status_resolved')}</option>
            <option value="closed">{t('helpdesk.status_closed')}</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">{t('helpdesk.all_priorities')}</option>
            <option value="critical">{t('helpdesk.priority_critical')}</option>
            <option value="high">{t('helpdesk.priority_high')}</option>
            <option value="medium">{t('helpdesk.priority_medium')}</option>
            <option value="low">{t('helpdesk.priority_low')}</option>
          </select>
        </div>
      </div>

      {/* Contenedor Principal: Lista y Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista de Tickets (5 columnas) */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Sincronizando con Firestore...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">{t('helpdesk.no_tickets')}</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/20' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      #{ticket.id.slice(-6).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">
                    {ticket.subject}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900 pt-2">
                    <div className="flex items-center gap-1 truncate max-w-[60%]">
                      <span className="truncate">{ticket.userEmail}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-cyan-400" />
                      <span>{ticket.messages?.length || 1}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detalle y Conversación del Ticket (7 columnas) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-5">
              {/* Header del Ticket Seleccionado */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500 font-bold">
                      #{selectedTicket.id}
                    </span>
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h2 className="text-lg font-black text-white">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reportado por: <span className="text-white">{selectedTicket.userEmail}</span>
                  </p>
                </div>

                {/* Acciones de Estado & Cierre */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={actionLoading || selectedTicket.status === 'in_progress'}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all disabled:opacity-40"
                  >
                    {t('helpdesk.status_in_progress')}
                  </button>
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    disabled={actionLoading || selectedTicket.status === 'resolved'}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-all disabled:opacity-40"
                  >
                    {t('helpdesk.status_resolved')}
                  </button>
                  <button
                    onClick={handleCloseTicket}
                    disabled={actionLoading || selectedTicket.status === 'closed'}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all disabled:opacity-40"
                  >
                    {t('helpdesk.close_btn')}
                  </button>
                </div>
              </div>

              {/* Asignación (Visible para Admins / Gestores) */}
              {isAdminOrManager && (
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    {t('helpdesk.assigned_to')}:
                  </span>
                  <select
                    value={selectedTicket.assignedTo || ''}
                    onChange={(e) => handleAssign(e.target.value)}
                    disabled={actionLoading}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">{t('helpdesk.unassigned')}</option>
                    {adminUsers.map(u => (
                      <option key={u.uid} value={u.uid}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conversación / Mensajes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  {t('helpdesk.messages_title')}
                </h4>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {selectedTicket.messages?.map((msg, idx) => {
                    const isSelf = msg.senderId === auth.currentUser?.uid;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                          isSelf 
                            ? 'bg-cyan-950/30 border-cyan-500/30 ml-6' 
                            : 'bg-slate-950 border-slate-800 mr-6'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-bold text-slate-400">{msg.senderEmail}</span>
                          <span>{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}</span>
                        </div>
                        <p className="text-white whitespace-pre-line leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campo de Respuesta */}
              {selectedTicket.status !== 'closed' ? (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <textarea
                    rows={3}
                    placeholder={t('helpdesk.reply_placeholder')}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSendReply}
                      disabled={actionLoading || !replyText.trim()}
                      className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-cyan-950/40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t('helpdesk.reply_btn')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  Este ticket se encuentra cerrado. Para realizar nuevas consultas, crea un nuevo ticket.
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center p-8 bg-slate-900/30 rounded-2xl border border-slate-800/80 text-center space-y-2">
              <LifeBuoy className="w-10 h-10 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-400">Selecciona un ticket</h3>
              <p className="text-xs text-slate-600 max-w-xs">
                Haz clic en cualquier ticket de la lista para visualizar su historial de conversación, estado y opciones de asignación.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Creación */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-cyan-400" />
                {t('helpdesk.new_ticket')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t('helpdesk.subject_label')} *
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Ej: Problema al sincronizar llamadas VoIP"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t('helpdesk.priority_label')}
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="low">{t('helpdesk.priority_low')}</option>
                  <option value="medium">{t('helpdesk.priority_medium')}</option>
                  <option value="high">{t('helpdesk.priority_high')}</option>
                  <option value="critical">{t('helpdesk.priority_critical')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t('helpdesk.description_label')} *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe el incidente o solicitud con el mayor detalle posible..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800"
                >
                  {t('helpdesk.cancel_btn')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-md shadow-cyan-950/40"
                >
                  {actionLoading ? 'Guardando...' : t('helpdesk.create_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
