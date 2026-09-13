import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Phone, 
  CheckCircle2, 
  Calendar, 
  UserCheck, 
  Activity, 
  Briefcase, 
  AlertCircle, 
  Filter, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Timer,
  FileText
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es, enUS, pt } from 'date-fns/locale';

import { useLanguage } from '../../contexts/LanguageContext';
import { 
  TeamMemberMetrics, 
  TimelineEvent, 
  getTimelineForUser, 
  getDateRangeBounds,
  toSafeDate 
} from '../../services/metricsService';

interface WorkTimelineDrawerProps {
  member: TeamMemberMetrics | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkTimelineDrawer({
  member,
  isOpen,
  onClose
}: WorkTimelineDrawerProps) {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');

  // Cerrar al pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cargar timeline cuando se abre el drawer o cambia el rango de fecha
  useEffect(() => {
    if (!isOpen || !member) {
      setEvents([]);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    const bounds = getDateRangeBounds({ dateRange });

    getTimelineForUser(member.uid, bounds)
      .then((res) => {
        if (!isCancelled) {
          setEvents(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching timeline events:', err);
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, member, dateRange]);

  if (!isOpen || !member) return null;

  const getLocale = () => {
    return language === 'en' ? enUS : (language === 'pt' ? pt : es);
  };

  const formatTimestamp = (ts: any): { rel: string; exact: string } => {
    const date = toSafeDate(ts);
    if (!date) return { rel: '—', exact: '—' };
    try {
      const rel = formatDistanceToNow(date, { addSuffix: true, locale: getLocale() });
      const exact = format(date, 'HH:mm - dd/MM/yyyy');
      return { rel, exact };
    } catch {
      return { rel: '—', exact: '—' };
    }
  };

  const formatMinutes = (mins: number) => {
    if (!mins || mins <= 0) return '0 min';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const renderEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-cyan-400" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'lead_contact':
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel Drawer */}
      <div className="relative w-full max-w-xl bg-slate-900 border-l border-cyan-500/20 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header con Perfil */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 text-lg shadow-inner shrink-0 overflow-hidden">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{member.name}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {member.role}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title={t('common.close', 'Cerrar')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comparativa clave: Tiempo Trabajado Real vs Sesión Conectada */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-semibold mb-0.5">
                <Timer className="w-3.5 h-3.5" />
                <span>{t('security.ops.worked_time', 'Tiempo Trabajado Real')}</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {formatMinutes(member.workedTimeTodayMinutes)}
              </div>
              <span className="text-[10px] text-slate-500">
                {t('security.ops.worked_time_hint', 'Entre 1ª y última acción')}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold mb-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('security.ops.session_time', 'Sesión Conectada')}</span>
              </div>
              <div className="text-base font-bold text-slate-300 font-mono">
                {formatMinutes(member.sessionTimeTodayMinutes)}
              </div>
              <span className="text-[10px] text-slate-500">
                {t('security.ops.session_time_hint', 'Tiempo con ventana activa')}
              </span>
            </div>
          </div>
        </div>

        {/* Filtro de Fechas de la Ruta */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('security.ops.timeline_title', 'Ruta de Trabajo')}</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setDateRange('today')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateRange === 'today' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('security.ops.range_today', 'Hoy')}
            </button>
            <button
              onClick={() => setDateRange('yesterday')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateRange === 'yesterday' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('security.ops.range_yesterday', 'Ayer')}
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateRange === 'week' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('security.ops.range_week', 'Semana')}
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateRange === 'month' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('security.ops.range_month', 'Mes')}
            </button>
          </div>
        </div>

        {/* Timeline Cronológico */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">
                {t('security.ops.loading_timeline', 'Cargando bitácora de acciones...')}
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-2 mt-4">
              <Clock className="w-9 h-9 text-slate-600 mx-auto" />
              <h4 className="text-xs font-semibold text-slate-300">
                {t('security.ops.no_events', 'Sin acciones registradas en este período')}
              </h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                {t('security.ops.no_events_desc', 'El colaborador no presenta llamadas VoIP, tareas completadas ni citas en el rango seleccionado.')}
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {events.map((event) => {
                const timeInfo = formatTimestamp(event.timestamp);
                return (
                  <div key={event.id} className="relative group">
                    {/* Bullet icono en la línea de tiempo */}
                    <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 group-hover:border-cyan-400 flex items-center justify-center transition-colors shadow-md z-10">
                      {renderEventIcon(event.type)}
                    </div>

                    {/* Tarjeta de evento */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 transition-all space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {event.title}
                        </span>
                        <span className="text-[10px] text-cyan-400/80 font-mono">
                          {timeInfo.rel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-800/40">
                        <span className="font-mono">{timeInfo.exact}</span>
                        {event.status && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase text-[9px]">
                            {event.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {events.length} {t('security.ops.total_events', 'acciones auditadas')}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {t('common.close', 'Cerrar')}
          </button>
        </div>

      </div>
    </div>
  );
}
