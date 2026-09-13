import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ExternalLink, 
  Filter, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS, pt } from 'date-fns/locale';

import { db, auth } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  SupportTicket, 
  replyTicket, 
  closeTicket, 
  assignTicket 
} from '../../services/helpdeskService';
import QuickTicketForm from './QuickTicketForm';

interface SupportTabProps {
  onCloseDrawer?: () => void;
  onTicketCountChange?: (count: number) => void;
}

export default function SupportTab({ onCloseDrawer, onTicketCountChange }: SupportTabProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Estados principales
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de usuario y RBAC
  const [userRole, setUserRole] = useState<string>('collaborator');
  const [adminUsers, setAdminUsers] = useState<Array<{ uid: string; email: string; name: string }>>([]);

  // Estados de interacción
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtros administrativos y de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.currentUser;
  const isAdminOrManager = useMemo(() => {
    const email = currentUser?.email || '';
    return (
      ['superadmin', 'admin', 'ceo', 'gestor'].includes(userRole) ||
      email === 'safeness.c.a@gmail.com' ||
      email === 'deuwyrobert@gmail.com'
    );
  }, [userRole, currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Detección de rol y lista de operadores para asignación
  useEffect(() => {
    if (!currentUser) return;

    // Obtener rol desde cache inicial si existe
    try {
      const cached = localStorage.getItem('kaivincia_user_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.role) setUserRole(parsed.role);
      }
    } catch (e) {
      console.warn('Error reading cached user data', e);
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const currentDoc = snapshot.docs.find(d => d.id === currentUser.uid);
      if (currentDoc) {
        setUserRole(currentDoc.data().role || 'collaborator');
      }

      const staff = snapshot.docs
        .filter(d => ['superadmin', 'admin', 'ceo', 'gestor', 'tlmk'].includes(d.data().role))
        .map(d => ({
          uid: d.id,
          email: d.data().email || 'Sin correo',
          name: d.data().name || d.data().email || d.id
        }));
      setAdminUsers(staff);
    }, (err) => {
      console.warn('User listener warning in SupportTab (handled):', err);
    });

    return () => unsubUsers();
  }, [currentUser]);

  // 2. Suscripción a tickets según RBAC
  useEffect(() => {
    if (!currentUser) {
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
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as SupportTicket[];

      setTickets(list);
      setLoading(false);

      // Notificar conteo de tickets activos al padre
      const activeCount = list.filter(t => t.status === 'open' || t.status === 'in_progress').length;
      if (onTicketCountChange) {
        onTicketCountChange(activeCount);
      }
    }, (err) => {
      console.error('Error fetching support tickets:', err);
      setError(err?.message || 'Error cargando tickets');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isAdminOrManager, onTicketCountChange]);

  // Ticket actualmente seleccionado
  const selectedTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  // Auto-scroll en la conversación cuando se actualiza el ticket seleccionado
  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length]);

  // Formato relativo de tiempo seguro
  const formatRelativeTime = (val: any) => {
    if (!val) return '';
    try {
      const date = val?.toDate ? val.toDate() : (val instanceof Date ? val : new Date(val));
      if (isNaN(date.getTime())) return '';
      const locale = language === 'en' ? enUS : (language === 'pt' ? pt : es);
      return formatDistanceToNow(date, { addSuffix: true, locale });
    } catch {
      return '';
    }
  };

  // Filtrado de tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesUser = userFilter === 'all' || t.userId === userFilter;

      return matchesSearch && matchesStatus && matchesUser;
    });
  }, [tickets, searchQuery, statusFilter, userFilter]);

  // Responder ticket
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setReplying(true);
    try {
      await replyTicket(selectedTicket.id, replyText.trim());
      setReplyText('');
      showToast(t('helpdesk.ticket_replied', 'Respuesta enviada correctamente.'));
    } catch (err: any) {
      console.error('Error enviando respuesta:', err);
      showToast(err?.message || 'Error al enviar respuesta');
    } finally {
      setReplying(false);
    }
  };

  // Cerrar ticket
  const handleClose = async () => {
    if (!selectedTicket) return;
    setStatusActionLoading(true);
    try {
      await closeTicket(selectedTicket.id);
      showToast(t('helpdesk.ticket_closed', 'Ticket cerrado exitosamente.'));
    } catch (err: any) {
      console.error('Error cerrando ticket:', err);
      showToast(err?.message || 'Error al cerrar el ticket');
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Asignar ticket (Admin)
  const handleAssign = async (targetUid: string) => {
    if (!selectedTicket) return;
    const targetUser = adminUsers.find(u => u.uid === targetUid);
    setStatusActionLoading(true);
    try {
      await assignTicket(
        selectedTicket.id,
        targetUid || null,
        targetUser?.email || null
      );
      showToast(t('helpdesk.success_assign', 'Ticket asignado correctamente.'));
    } catch (err: any) {
      console.error('Error asignando ticket:', err);
      showToast(err?.message || 'Error al asignar ticket');
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Redirigir a la vista completa de Helpdesk
  const handleNavigateFull = () => {
    navigate('/crm/helpdesk');
    if (onCloseDrawer) {
      onCloseDrawer();
    }
  };

  // Badges estilizados
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">{t('helpdesk.status_open', 'Abierto')}</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">{t('helpdesk.status_in_progress', 'En Proceso')}</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{t('helpdesk.status_resolved', 'Resuelto')}</span>;
      case 'closed':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-700/50 text-slate-400 border border-slate-700">{t('helpdesk.status_closed', 'Cerrado')}</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">{t('helpdesk.priority_critical', 'Crítica')}</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase">{t('helpdesk.priority_high', 'Alta')}</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">{t('helpdesk.priority_medium', 'Media')}</span>;
      case 'low':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-700/40 text-slate-300 border border-slate-600 uppercase">{t('helpdesk.priority_low', 'Baja')}</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-800 text-slate-400">{priority}</span>;
    }
  };

  // VISTA 1: Formulario de creación
  if (isCreating) {
    return (
      <div className="p-1 space-y-3">
        <QuickTicketForm
          onSuccess={(newId) => {
            setIsCreating(false);
            setSelectedTicketId(newId);
          }}
          onCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  // VISTA 2: Detalle de ticket individual
  if (selectedTicket) {
    return (
      <div className="flex flex-col h-full space-y-3">
        {/* Toast */}
        {toastMessage && (
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Encabezado del Ticket */}
        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedTicketId(null)}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('helpdesk.back_to_list', 'Volver a lista')}</span>
            </button>
            <button
              onClick={handleNavigateFull}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              title={t('helpdesk.view_full', 'Abrir en pantalla completa')}
            >
              <span>{t('helpdesk.view_full', 'Ver completo')}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {getStatusBadge(selectedTicket.status)}
              {getPriorityBadge(selectedTicket.priority)}
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(selectedTicket.createdAt)}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {selectedTicket.subject}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('helpdesk.author', 'Creador')}: <span className="text-slate-300">{selectedTicket.userEmail}</span>
            </p>
          </div>

          {/* Asignación (Solo Administradores / Gestores) */}
          {isAdminOrManager && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-medium">{t('helpdesk.assign_to', 'Asignar')}:</span>
              </div>
              <select
                value={selectedTicket.assignedTo || ''}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={statusActionLoading}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="">{t('helpdesk.unassigned', 'Sin asignar')}</option>
                {adminUsers.map(u => (
                  <option key={u.uid} value={u.uid}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botón Cerrar Ticket */}
          {selectedTicket.status !== 'closed' && (
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleClose}
                disabled={statusActionLoading}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3 h-3" />
                <span>{t('helpdesk.close_btn', 'Cerrar Ticket')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Conversación / Mensajes */}
        <div className="flex-1 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-3 overflow-y-auto space-y-2.5 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-800">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{t('helpdesk.messages_title', 'Historial de Conversación')}</span>
          </div>

          {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
            <p className="text-xs text-slate-500 italic text-center py-4">
              {t('helpdesk.no_messages', 'No hay mensajes registrados en este ticket.')}
            </p>
          ) : (
            selectedTicket.messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser?.uid;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-xs space-y-1 ${
                    isMe 
                      ? 'bg-cyan-950/40 border border-cyan-500/30 ml-4 text-cyan-100' 
                      : 'bg-slate-900 border border-slate-800 mr-4 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">{msg.senderEmail}</span>
                    <span>{formatRelativeTime(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed text-white text-[11px]">
                    {msg.text}
                  </p>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulario de respuesta */}
        {selectedTicket.status !== 'closed' ? (
          <form onSubmit={handleReply} className="flex gap-2 items-end pt-1">
            <textarea
              rows={2}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('helpdesk.reply_placeholder', 'Escribe tu respuesta...')}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={replying || !replyText.trim()}
              className="px-3.5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 active:scale-95"
              title={t('helpdesk.send_reply', 'Enviar respuesta')}
            >
              {replying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        ) : (
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            {t('helpdesk.ticket_closed_notice', 'Este ticket se encuentra cerrado. Para realizar una nueva consulta, crea otro ticket.')}
          </div>
        )}
      </div>
    );
  }

  // VISTA 3: Lista de tickets
  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Barra superior de acciones */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setIsCreating(true)}
          className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('helpdesk.new_ticket', 'Nuevo Ticket')}</span>
        </button>

        <button
          onClick={handleNavigateFull}
          className="px-2.5 py-2 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
          title={t('helpdesk.view_full', 'Abrir Centro de Soporte')}
        >
          <span>{t('helpdesk.view_full', 'Ver completo')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('helpdesk.search_placeholder', 'Buscar tickets...')}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      {/* Filtros para Administradores / Gestores */}
      {isAdminOrManager && (
        <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            <span>Filtros Administrativos</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">
                {t('helpdesk.filter_by_status', 'Por estado')}:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all">{t('helpdesk.all_statuses', 'Todos los estados')}</option>
                <option value="open">{t('helpdesk.status_open', 'Abierto')}</option>
                <option value="in_progress">{t('helpdesk.status_in_progress', 'En Proceso')}</option>
                <option value="resolved">{t('helpdesk.status_resolved', 'Resuelto')}</option>
                <option value="closed">{t('helpdesk.status_closed', 'Cerrado')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">
                {t('helpdesk.filter_by_user', 'Por usuario')}:
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all">{t('helpdesk.all_users', 'Todos los usuarios')}</option>
                {adminUsers.map(u => (
                  <option key={u.uid} value={u.uid}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Tickets con Scroll */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin scrollbar-thumb-slate-800 max-h-[380px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="text-xs">{t('helpdesk.loading_tickets', 'Cargando tickets...')}</span>
          </div>
        ) : error ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 border border-slate-800/60 rounded-2xl space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-xs font-semibold text-slate-300">
              {t('helpdesk.no_tickets', 'No hay tickets registrados')}
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              {t('helpdesk.no_tickets_desc', 'Crea un nuevo ticket de soporte cuando requieras asistencia o reportar una incidencia.')}
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('helpdesk.new_ticket', 'Crear Ticket')}</span>
            </button>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className="p-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 rounded-xl cursor-pointer transition-all duration-200 group space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {formatRelativeTime(ticket.createdAt)}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {ticket.subject}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {ticket.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                <span className="truncate max-w-[160px]">
                  {ticket.userEmail}
                </span>
                <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5 font-medium">
                  <span>{t('helpdesk.quick_view', 'Ver conversación')}</span>
                  {ticket.messages && ticket.messages.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded-full font-bold">
                      {ticket.messages.length}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
