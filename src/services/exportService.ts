import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { TeamMemberMetrics, MetricsFilters } from './metricsService';

/**
 * Formatea minutos a string legible (ej: "2h 15m")
 */
function formatMinutes(mins: number | null): string {
  if (mins === null || mins === undefined) return '—';
  if (mins < 1) return '< 1m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Formatea segundos a HH:MM:SS
 */
function formatSeconds(secs: number): string {
  if (!secs || secs <= 0) return '00:00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Traduce el estado de disponibilidad
 */
function translateStatus(status: string): string {
  switch (status) {
    case 'available':
      return 'Disponible';
    case 'in_progress':
      return 'En gestión';
    case 'off_shift':
      return 'Fuera de turno';
    default:
      return status;
  }
}

/**
 * Exporta las métricas a un archivo Excel (.xlsx) estructurado
 */
export function exportMetricsToExcel(
  metrics: TeamMemberMetrics[],
  filters?: MetricsFilters
): void {
  const exportDateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
  const filename = `Supervision_Operativa_Kaivincia_${exportDateStr}.xlsx`;

  // Filas de datos estructurados
  const rows = metrics.map((m, idx) => {
    const rate = m.leadsAssigned > 0 
      ? `${Math.round((m.leadsAttended / m.leadsAssigned) * 100)}%` 
      : '0%';

    return {
      '#': idx + 1,
      'Colaborador': m.name,
      'Email': m.email,
      'Rol': m.role.toUpperCase(),
      'Disponibilidad': translateStatus(m.availabilityStatus),
      'Leads Asignados': m.leadsAssigned,
      'Leads Atendidos': m.leadsAttended,
      '% Atención': rate,
      'T. 1er Contacto (min)': m.avgFirstContactTimeMinutes !== null ? m.avgFirstContactTimeMinutes : '—',
      'Llamadas VoIP': m.callsRegistered,
      'Duración VoIP': formatSeconds(m.callsDurationTotalSeconds),
      'Tareas Pendientes': m.tasksPending,
      'Tareas Completadas': m.tasksCompleted,
      'Citas Agendadas': m.appointmentsScheduled,
      'Tiempo Trabajado (min)': m.workedTimeTodayMinutes,
      'Tiempo Trabajado (formato)': formatMinutes(m.workedTimeTodayMinutes),
      'Sesión Conectada (min)': m.sessionTimeTodayMinutes,
      'Sesión Conectada (formato)': formatMinutes(m.sessionTimeTodayMinutes)
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ajuste de anchos de columna
  worksheet['!cols'] = [
    { wch: 4 },
    { wch: 22 },
    { wch: 28 },
    { wch: 14 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 14 },
    { wch: 15 },
    { wch: 16 },
    { wch: 18 },
    { wch: 15 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Supervisión Operativa');

  XLSX.writeFile(workbook, filename);
}

/**
 * Exporta las métricas a un reporte PDF corporativo
 */
export function exportMetricsToPdf(
  metrics: TeamMemberMetrics[],
  filters?: MetricsFilters
): void {
  const doc = new jsPDF('landscape');
  const exportDateStr = format(new Date(), 'dd/MM/yyyy HH:mm');
  const fileDateStr = format(new Date(), 'yyyy-MM-dd_HHmm');

  // Encabezado Corporativo
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');

  doc.setFontSize(14);
  doc.setTextColor(0, 240, 255); // Cyan
  doc.text('KAIVINCIA CRM - REPORTE DE SUPERVISIÓN OPERATIVA', 14, 12);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Generado el: ${exportDateStr} | Total Colaboradores: ${metrics.length}`, 14, 18);

  // Preparar filas de la tabla
  const tableData = metrics.map((m, idx) => [
    idx + 1,
    m.name,
    m.role.toUpperCase(),
    translateStatus(m.availabilityStatus),
    m.leadsAssigned,
    m.leadsAttended,
    formatMinutes(m.avgFirstContactTimeMinutes),
    m.callsRegistered,
    formatSeconds(m.callsDurationTotalSeconds),
    m.tasksPending,
    m.tasksCompleted,
    m.appointmentsScheduled,
    formatMinutes(m.workedTimeTodayMinutes)
  ]);

  (doc as any).autoTable({
    startY: 28,
    head: [[
      '#',
      'Colaborador',
      'Rol',
      'Estado',
      'Leads',
      'Atend.',
      '1er Cont.',
      'Llamadas',
      'Duración',
      'Pend.',
      'Compl.',
      'Citas',
      'T. Trabajado'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [0, 240, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 38 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', cellWidth: 20 },
      9: { halign: 'right', cellWidth: 16 },
      10: { halign: 'right', cellWidth: 16 },
      11: { halign: 'right', cellWidth: 16 },
      12: { halign: 'right', cellWidth: 24 }
    },
    margin: { left: 10, right: 10 }
  });

  doc.save(`Supervision_Operativa_Kaivincia_${fileDateStr}.pdf`);
}
