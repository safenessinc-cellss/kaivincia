import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  User, 
  Clock, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Briefcase,
  ChevronRight,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS, pt } from 'date-fns/locale';

import { useLanguage } from '../../contexts/LanguageContext';
import { TeamMemberMetrics, AvailabilityStatus, toSafeDate } from '../../services/metricsService';

interface TeamMetricsTableProps {
  metrics: TeamMemberMetrics[];
  loading?: boolean;
  onRowClick: (member: TeamMemberMetrics) => void;
}

type SortField = 
  | 'name'
  | 'role'
  | 'availabilityStatus'
  | 'leadsAssigned'
  | 'leadsAttended'
  | 'avgFirstContactTimeMinutes'
  | 'callsRegistered'
  | 'callsDurationTotalSeconds'
  | 'tasksPending'
  | 'tasksCompleted'
  | 'appointmentsScheduled'
  | 'workedTimeTodayMinutes'
  | 'lastActivityAt';

export default function TeamMetricsTable({
  metrics,
  loading = false,
  onRowClick
}: TeamMetricsTableProps) {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('leadsAssigned');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // Formato relativo de fechas
  const formatRelativeTime = (val: any) => {
    if (!val) return t('security.ops.never', 'Sin registro');
    try {
      const date = toSafeDate(val);
      if (!date) return t('security.ops.never', 'Sin registro');
      const locale = language === 'en' ? enUS : (language === 'pt' ? pt : es);
      return formatDistanceToNow(date, { addSuffix: true, locale });
    } catch {
      return '';
    }
  };

  // Formateador de minutos a horas y minutos legibles
  const formatDurationMinutes = (totalMinutes: number | null) => {
    if (totalMinutes === null || totalMinutes === undefined) return '—';
    if (totalMinutes < 1) return '< 1 min';
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Formateador de segundos a HH:MM:SS
  const formatSecondsToHMS = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds <= 0) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cambiar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtrado y ordenamiento de métricas
  const filteredAndSortedMetrics = useMemo(() => {
    return metrics
      .filter(m => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
          !query ||
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query) ||
          m.role.toLowerCase().includes(query);

        const matchesAvailability = 
          availabilityFilter === 'all' || 
          m.availabilityStatus === availabilityFilter;

        return matchesSearch && matchesAvailability;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        // Manejo especial de fechas y valores nulos
        if (sortField === 'lastActivityAt') {
          valA = toSafeDate(valA)?.getTime() || 0;
          valB = toSafeDate(valB)?.getTime() || 0;
        }

        if (valA === null || valA === undefined) valA = -1;
        if (valB === null || valB === undefined) valB = -1;

        if (typeof valA === 'string') {
          return sortDirection === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [metrics, searchQuery, sortField, sortDirection, availabilityFilter]);

  // Badge de disponibilidad con tooltips e indicadores visuales
  const renderAvailabilityBadge = (status: AvailabilityStatus, taskTitle?: string) => {
    switch (status) {
      case 'available':
        return (
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
            title={t('security.ops.status_available_desc', 'Conectado en los últimos 5 minutos sin tareas bloqueantes')}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('security.ops.status_available', 'Disponible')}</span>
          </span>
        );
      case 'in_progress':
        return (
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm"
            title={taskTitle ? `En gestión activa: ${taskTitle}` : t('security.ops.status_in_progress', 'En gestión')}
          >
            <Activity className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="max-w-[110px] truncate">{t('security.ops.status_in_progress', 'En gestión')}</span>
          </span>
        );
      case 'off_shift':
      default:
        return (
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/60"
            title={t('security.ops.status_off_shift_desc', 'Sin actividad en los últimos 5 minutos')}
          >
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>{t('security.ops.status_off_shift', 'Fuera de turno')}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('security.ops.search_collaborator', 'Buscar colaborador por nombre, correo o rol...')}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-400 text-xs px-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t('security.ops.filter_availability', 'Estado')}:</span>
          </div>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
          >
            <option value="all">{t('common.all', 'Todos')}</option>
            <option value="available">{t('security.ops.status_available', 'Disponible')}</option>
            <option value="in_progress">{t('security.ops.status_in_progress', 'En gestión')}</option>
            <option value="off_shift">{t('security.ops.status_off_shift', 'Fuera de turno')}</option>
          </select>
        </div>
      </div>

      {/* Contenido: Tabla Desktop / Tarjetas Móviles */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">
            {t('security.ops.loading_metrics', 'Calculando y sincronizando métricas operativas del equipo...')}
          </p>
        </div>
      ) : filteredAndSortedMetrics.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-2">
          <User className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">
            {t('security.ops.no_data', 'No se encontraron colaboradores')}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery 
              ? t('security.ops.no_search_results', 'No hay colaboradores que coincidan con la búsqueda.') 
              : t('security.ops.no_team_records', 'No hay registros operativos disponibles en el rango seleccionado.')}
          </p>
        </div>
      ) : (
        <>
          {/* VISTA DESKTOP / TABLET: Tabla Completa */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40 shadow-xl">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    <th 
                      onClick={() => handleSort('name')}
                      className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t('security.ops.col_collaborator', 'Colaborador')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('availabilityStatus')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t('security.ops.col_status', 'Disponibilidad')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('leadsAssigned')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.leads_assigned', 'Leads Asig.')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('leadsAttended')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.leads_attended', 'Atendidos')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('avgFirstContactTimeMinutes')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.first_contact_time', 'T. 1er Contacto')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('callsRegistered')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.calls_registered', 'Llamadas')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('callsDurationTotalSeconds')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right hidden lg:table-cell"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.calls_duration', 'Duración VoIP')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('tasksPending')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.tasks_pending', 'Pendientes')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('tasksCompleted')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.tasks_completed', 'Completadas')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('appointmentsScheduled')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.appointments', 'Citas')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('workedTimeTodayMinutes')}
                      className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.worked_time', 'T. Trabajado')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('lastActivityAt')}
                      className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('security.ops.last_activity', 'Última Actividad')}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredAndSortedMetrics.map((member) => (
                    <tr
                      key={member.uid}
                      onClick={() => onRowClick(member)}
                      className="hover:bg-cyan-500/5 cursor-pointer transition-colors group"
                    >
                      {/* Avatar + Nombre + Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 text-xs shrink-0 overflow-hidden">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                              <span>{member.name}</span>
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {member.email} · <span className="uppercase text-cyan-500/70 font-mono">{member.role}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Disponibilidad */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderAvailabilityBadge(member.availabilityStatus, member.activeTaskTitle)}
                      </td>

                      {/* Leads Asignados */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {member.leadsAssigned.toLocaleString()}
                      </td>

                      {/* Leads Atendidos */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                        {member.leadsAttended.toLocaleString()}
                        {member.leadsAssigned > 0 && (
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({Math.round((member.leadsAttended / member.leadsAssigned) * 100)}%)
                          </span>
                        )}
                      </td>

                      {/* T. Primer Contacto */}
                      <td className="py-3 px-3 text-right font-mono text-cyan-300">
                        {formatDurationMinutes(member.avgFirstContactTimeMinutes)}
                      </td>

                      {/* Llamadas */}
                      <td className="py-3 px-3 text-right font-mono text-white">
                        {member.callsRegistered.toLocaleString()}
                      </td>

                      {/* Duración VoIP */}
                      <td className="py-3 px-3 text-right font-mono text-slate-400 hidden lg:table-cell">
                        {formatSecondsToHMS(member.callsDurationTotalSeconds)}
                      </td>

                      {/* Tareas Pendientes */}
                      <td className="py-3 px-3 text-right font-mono text-amber-400">
                        {member.tasksPending.toLocaleString()}
                      </td>

                      {/* Tareas Completadas */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">
                        {member.tasksCompleted.toLocaleString()}
                      </td>

                      {/* Citas */}
                      <td className="py-3 px-3 text-right font-mono text-indigo-300">
                        {member.appointmentsScheduled.toLocaleString()}
                      </td>

                      {/* Tiempo Trabajado Hoy */}
                      <td className="py-3 px-3 text-right font-mono text-cyan-400 font-semibold whitespace-nowrap">
                        {formatDurationMinutes(member.workedTimeTodayMinutes)}
                      </td>

                      {/* Última Actividad */}
                      <td className="py-3 px-4 text-right text-[11px] text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(member.lastActivityAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* VISTA MÓVIL: Tarjetas de Colaboradores */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredAndSortedMetrics.map((member) => (
              <div
                key={member.uid}
                onClick={() => onRowClick(member)}
                className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{member.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                      </h4>
                      <p className="text-[10px] text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  {renderAvailabilityBadge(member.availabilityStatus, member.activeTaskTitle)}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-500 block">{t('security.ops.leads', 'Leads')}</span>
                    <span className="font-bold text-cyan-300 font-mono">
                      {member.leadsAttended}/{member.leadsAssigned}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-500 block">{t('security.ops.calls_registered', 'Llamadas')}</span>
                    <span className="font-bold text-white font-mono">{member.callsRegistered}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-500 block">{t('security.ops.tasks', 'Tareas')}</span>
                    <span className="font-bold text-emerald-400 font-mono">{member.tasksCompleted}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{t('security.ops.worked_today', 'Trabajado hoy')}: </span>
                    <strong className="text-white font-mono">{formatDurationMinutes(member.workedTimeTodayMinutes)}</strong>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatRelativeTime(member.lastActivityAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
