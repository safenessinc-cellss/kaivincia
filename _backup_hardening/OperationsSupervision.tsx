import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  TrendingUp, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Activity, 
  ShieldCheck, 
  RefreshCw,
  UserCheck,
  Zap,
  AlertTriangle
} from 'lucide-react';

import { useLanguage } from '../../contexts/LanguageContext';
import { auth, db } from '../../firebase';
import { 
  TeamMemberMetrics, 
  MetricsFilters, 
  subscribeToTeamMetrics 
} from '../../services/metricsService';
import { 
  exportMetricsToExcel, 
  exportMetricsToPdf 
} from '../../services/exportService';
import TeamMetricsTable from './TeamMetricsTable';
import WorkTimelineDrawer from './WorkTimelineDrawer';

export default function OperationsSupervision() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<TeamMemberMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMemberMetrics | null>(null);

  // Filtros globales
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // RBAC
  const currentUser = auth.currentUser;
  const [userRole, setUserRole] = useState<string>('collaborator');

  useEffect(() => {
    try {
      const cached = localStorage.getItem('kaivincia_user_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.role) setUserRole(parsed.role);
      }
    } catch (e) {
      console.warn('Error reading cached user role', e);
    }
  }, []);

  const isSupervisor = useMemo(() => {
    const email = currentUser?.email || '';
    return (
      ['superadmin', 'admin', 'ceo', 'gestor'].includes(userRole) ||
      email === 'safeness.c.a@gmail.com' ||
      email === 'deuwyrobert@gmail.com'
    );
  }, [userRole, currentUser]);

  // Suscripción reactiva a métricas operativas consolidadas
  useEffect(() => {
    setLoading(true);
    const filters: MetricsFilters = {
      dateRange,
      role: selectedRole
    };

    const unsubscribe = subscribeToTeamMetrics((updatedMetrics) => {
      // Si no es supervisor, filtrar únicamente las métricas del propio colaborador
      if (!isSupervisor && currentUser) {
        const myMetrics = updatedMetrics.filter(m => m.uid === currentUser.uid || m.email === currentUser.email);
        setMetrics(myMetrics);
      } else {
        setMetrics(updatedMetrics);
      }
      setLoading(false);
    }, filters);

    return () => unsubscribe();
  }, [dateRange, selectedRole, isSupervisor, currentUser]);

  // KPIs agregados globales
  const summaryKpis = useMemo(() => {
    const totalMembers = metrics.length;
    const availableCount = metrics.filter(m => m.availabilityStatus === 'available').length;
    const inProgressCount = metrics.filter(m => m.availabilityStatus === 'in_progress').length;

    const totalLeadsAssigned = metrics.reduce((acc, m) => acc + m.leadsAssigned, 0);
    const totalLeadsAttended = metrics.reduce((acc, m) => acc + m.leadsAttended, 0);
    const leadsAttendanceRate = totalLeadsAssigned > 0 
      ? Math.round((totalLeadsAttended / totalLeadsAssigned) * 100) 
      : 0;

    const totalCalls = metrics.reduce((acc, m) => acc + m.callsRegistered, 0);
    const totalCallDurationSecs = metrics.reduce((acc, m) => acc + m.callsDurationTotalSeconds, 0);

    const totalTasksPending = metrics.reduce((acc, m) => acc + m.tasksPending, 0);
    const totalTasksCompleted = metrics.reduce((acc, m) => acc + m.tasksCompleted, 0);

    const totalAppointments = metrics.reduce((acc, m) => acc + m.appointmentsScheduled, 0);

    // Promedio ponderado de tiempo a 1er contacto
    const contactTimes = metrics
      .map(m => m.avgFirstContactTimeMinutes)
      .filter((t): t is number => t !== null && t !== undefined);
    const avgContactTime = contactTimes.length > 0 
      ? Math.round(contactTimes.reduce((a, b) => a + b, 0) / contactTimes.length) 
      : null;

    return {
      totalMembers,
      availableCount,
      inProgressCount,
      totalLeadsAssigned,
      totalLeadsAttended,
      leadsAttendanceRate,
      totalCalls,
      totalCallDurationSecs,
      totalTasksPending,
      totalTasksCompleted,
      totalAppointments,
      avgContactTime
    };
  }, [metrics]);

  const handleExportExcel = () => {
    exportMetricsToExcel(metrics, { dateRange, role: selectedRole });
  };

  const handleExportPdf = () => {
    exportMetricsToPdf(metrics, { dateRange, role: selectedRole });
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones de Exportación */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {t('security.ops.title', 'Supervisión Operativa de Colaboradores')}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            {t('security.ops.subtitle', 'Monitoreo en tiempo real de disponibilidad, gestión de leads, actividad VoIP, tareas y bitácora de trabajo de todo el equipo operativo.')}
          </p>
        </div>

        {/* Acciones de Exportación */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={metrics.length === 0}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-40 active:scale-95 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t('security.ops.export_excel', 'Exportar Excel')}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={metrics.length === 0}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-40 active:scale-95 shadow-sm"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>{t('security.ops.export_pdf', 'Exportar PDF')}</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de KPIs Globales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Colaboradores Activos */}
        <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('security.ops.kpi_team', 'Equipo')}</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {summaryKpis.totalMembers}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{summaryKpis.availableCount} disp.</span>
            <span>·</span>
            <span className="text-blue-400 font-semibold">{summaryKpis.inProgressCount} gest.</span>
          </div>
        </div>

        {/* KPI 2: Leads Atendidos */}
        <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('security.ops.kpi_leads', 'Atención Leads')}</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {summaryKpis.totalLeadsAttended}
            <span className="text-xs text-slate-500 font-normal"> / {summaryKpis.totalLeadsAssigned}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {t('security.ops.rate', 'Tasa')}: <strong className="text-white font-mono">{summaryKpis.leadsAttendanceRate}%</strong>
          </div>
        </div>

        {/* KPI 3: Tiempo 1er Contacto */}
        <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('security.ops.first_contact_time', 'T. 1er Contacto')}</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono">
            {summaryKpis.avgContactTime !== null ? `${summaryKpis.avgContactTime}m` : '—'}
          </div>
          <div className="text-[10px] text-slate-400">
            {t('security.ops.avg_response', 'Promedio de respuesta')}
          </div>
        </div>

        {/* KPI 4: Llamadas VoIP */}
        <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('security.ops.calls_registered', 'Llamadas VoIP')}</span>
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {summaryKpis.totalCalls}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {Math.round(summaryKpis.totalCallDurationSecs / 60)} min acum.
          </div>
        </div>

        {/* KPI 5: Tareas */}
        <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('security.ops.tasks', 'Tareas')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {summaryKpis.totalTasksCompleted}
            <span className="text-xs text-amber-400 font-normal"> / {summaryKpis.totalTasksPending} pend.</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {t('security.ops.completed_tasks', 'Completadas vs pend.')}
          </div>
        </div>

        {/* KPI 6: Citas */}
        <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('security.ops.appointments', 'Citas Agendadas')}</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300 font-mono">
            {summaryKpis.totalAppointments}
          </div>
          <div className="text-[10px] text-slate-400">
            {t('security.ops.scheduled_total', 'Compromisos de agenda')}
          </div>
        </div>
      </div>

      {/* Barra de Filtros Principales (Rango de Fechas y Roles) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
        {/* Selector de Rango de Fechas */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              dateRange === 'today'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('security.ops.range_today', 'Hoy')}
          </button>
          <button
            type="button"
            onClick={() => setDateRange('yesterday')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              dateRange === 'yesterday'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('security.ops.range_yesterday', 'Ayer')}
          </button>
          <button
            type="button"
            onClick={() => setDateRange('week')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              dateRange === 'week'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('security.ops.range_week', 'Semana')}
          </button>
          <button
            type="button"
            onClick={() => setDateRange('month')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              dateRange === 'month'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('security.ops.range_month', 'Mes')}
          </button>
        </div>

        {/* Filtro por Rol / Equipo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('security.ops.filter_role', 'Rol')}:</span>
          </span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
          >
            <option value="all">{t('common.all_roles', 'Todos los roles')}</option>
            <option value="tlmk">Telemarketing (TLMK)</option>
            <option value="gestor">Gestor / Closer</option>
            <option value="admin">Administrador</option>
            <option value="superadmin">Superadmin</option>
            <option value="collaborator">Colaborador</option>
          </select>
        </div>
      </div>

      {/* Nota RBAC para no supervisores */}
      {!isSupervisor && (
        <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
          <span>
            {t('security.ops.collab_notice', 'Visualizando tus métricas operativas individuales. Los supervisores pueden ver todo el equipo.')}
          </span>
        </div>
      )}

      {/* Tabla Principal de Métricas */}
      <TeamMetricsTable
        metrics={metrics}
        loading={loading}
        onRowClick={(member) => setSelectedMember(member)}
      />

      {/* Drawer de Ruta de Trabajo (Timeline) */}
      <WorkTimelineDrawer
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}
