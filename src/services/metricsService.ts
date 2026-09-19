import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export type AvailabilityStatus = 'available' | 'in_progress' | 'off_shift';

export interface TimelineEvent {
  id: string;
  type: 'call' | 'task' | 'appointment' | 'lead_contact' | 'lead_created' | 'note' | 'session';
  title: string;
  description: string;
  timestamp: any;
  status?: string;
  metadata?: Record<string, any>;
}

export interface MetricsFilters {
  dateRange?: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  startDate?: Date | null;
  endDate?: Date | null;
  role?: string;
  searchQuery?: string;
}

export interface TeamMemberMetrics {
  uid: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  leadsAssigned: number;
  leadsAttended: number;
  avgFirstContactTimeMinutes: number | null;
  callsRegistered: number;
  callsDurationTotalSeconds: number;
  tasksPending: number;
  tasksCompleted: number;
  appointmentsScheduled: number;
  lastActivityAt: any;
  availabilityStatus: AvailabilityStatus;
  workedTimeTodayMinutes: number;
  sessionTimeTodayMinutes: number;
  activeTaskTitle?: string;
}

/**
 * Convierte de forma segura cualquier valor Timestamp / Date / string a objeto Date
 */
export function toSafeDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    return val.toDate();
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Determina el estado de disponibilidad en base a reglas de supervisión:
 * - 'in_progress': Si tiene una tarea o gestión en curso actualmente.
 * - 'available': Si su última actividad (lastSeenAt) fue en los últimos 5 minutos y no está en gestión.
 * - 'off_shift': Si no tiene actividad en los últimos 5 minutos o más de 24 horas.
 */
export function computeAvailability(
  lastSeenAt: any, 
  activeTask?: { title?: string; status?: string } | null
): AvailabilityStatus {
  if (activeTask && (activeTask.status === 'in_progress' || activeTask.status === 'in-progress')) {
    return 'in_progress';
  }

  const date = toSafeDate(lastSeenAt);
  if (!date) return 'off_shift';

  const diffMs = Date.now() - date.getTime();
  const fiveMinutesMs = 5 * 60 * 1000;

  if (diffMs <= fiveMinutesMs && diffMs >= 0) {
    return 'available';
  }

  return 'off_shift';
}

/**
 * Calcula el tiempo trabajado real (en minutos) como la diferencia entre 
 * la primera y la última acción registrada en el día.
 */
export function computeWorkedTime(firstAction: Date | null, lastAction: Date | null): number {
  if (!firstAction || !lastAction) return 0;
  const diffMs = lastAction.getTime() - firstAction.getTime();
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Calcula el tiempo de sesión conectada (en minutos).
 */
export function computeSessionTime(loginAt: Date | null, lastSeenAt: Date | null): number {
  if (!loginAt) return 0;
  const end = lastSeenAt || new Date();
  const diffMs = end.getTime() - loginAt.getTime();
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Obtiene el rango de fechas en formato { start: Date, end: Date } según MetricsFilters
 */
export function getDateRangeBounds(filters?: MetricsFilters): { start: Date; end: Date } {
  const now = new Date();
  const range = filters?.dateRange || 'today';

  if (range === 'custom' && filters?.startDate && filters?.endDate) {
    return {
      start: new Date(filters.startDate),
      end: new Date(filters.endDate)
    };
  }

  if (range === 'yesterday') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start, end: now };
  }

  if (range === 'month') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end: now };
  }

  // 'today' por defecto
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Suscripción reactiva consolidada para supervisión de métricas de equipo
 */
export function subscribeToTeamMetrics(
  callback: (metrics: TeamMemberMetrics[]) => void,
  filters?: MetricsFilters
): () => void {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  let isSubscribed = true;

  // Mapa reactivo de datos en memoria para consolidación sin N+1 queries
  let usersList: any[] = [];
  let leadsList: any[] = [];
  let tasksList: any[] = [];
  let callsList: any[] = [];
  let appointmentsList: any[] = [];
  let sessionsMap: Map<string, any> = new Map();

  const recompute = () => {
    if (!isSubscribed) return;

    try {
      const bounds = getDateRangeBounds(filters);

      const metricsResult: TeamMemberMetrics[] = usersList
        .filter(u => {
          // Filtrado por rol si está definido
          if (filters?.role && filters.role !== 'all') {
            if (u.role !== filters.role) return false;
          }
          return true;
        })
        .map(u => {
          const uid = u.id || u.uid;
          const userEmail = u.email || '';
          const userName = u.displayName || u.name || userEmail.split('@')[0] || 'Colaborador';

          // 1. Leads
          const userLeads = leadsList.filter(l => l.assignedTo === uid || l.agentId === uid);
          const leadsAssigned = userLeads.length;
          const attendedLeads = userLeads.filter(l => l.lastContactAt != null || l.firstContactAt != null || l.status === 'contacted' || l.status === 'qualified');
          const leadsAttended = attendedLeads.length;

          // Tiempo promedio a 1er contacto (firstContactAt - createdAt)
          let totalContactTimeMs = 0;
          let contactTimeCount = 0;
          userLeads.forEach(l => {
            const created = toSafeDate(l.createdAt);
            const firstContact = toSafeDate(l.firstContactAt || l.lastContactAt);
            if (created && firstContact && firstContact >= created) {
              totalContactTimeMs += (firstContact.getTime() - created.getTime());
              contactTimeCount++;
            }
          });
          const avgFirstContactTimeMinutes = contactTimeCount > 0 
            ? Math.round((totalContactTimeMs / contactTimeCount) / (1000 * 60)) 
            : null;

          // 2. Tareas
          const userTasks = tasksList.filter(t => t.assignedTo === uid || t.userId === uid);
          const tasksPending = userTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
          const tasksCompleted = userTasks.filter(t => t.status === 'completed').length;
          const activeTask = userTasks.find(t => t.status === 'in_progress' || t.status === 'in-progress');

          // 3. Llamadas VoIP
          const userCalls = callsList.filter(c => c.agentId === uid || c.userId === uid);
          const callsRegistered = userCalls.length;
          const callsDurationTotalSeconds = userCalls.reduce((acc, c) => acc + (Number(c.duration) || 0), 0);

          // 4. Citas agendadas
          const userAppointments = appointmentsList.filter(a => a.assignedTo === uid || a.agentId === uid || a.hostId === uid);
          const appointmentsScheduled = userAppointments.length;

          // 5. Sesión y disponibilidad
          const session = sessionsMap.get(uid);
          const lastSeenAt = session?.lastSeenAt || u.lastSeenAt || u.updatedAt || null;
          const availabilityStatus = computeAvailability(lastSeenAt, activeTask);

          // 6. Tiempo trabajado hoy (primera vs última acción del día de hoy)
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const actionsToday: Date[] = [];
          
          userCalls.forEach(c => {
            const d = toSafeDate(c.createdAt || c.timestamp);
            if (d && d >= todayStart) actionsToday.push(d);
          });
          userTasks.forEach(t => {
            const d = toSafeDate(t.updatedAt || t.completedAt || t.createdAt);
            if (d && d >= todayStart) actionsToday.push(d);
          });
          userAppointments.forEach(a => {
            const d = toSafeDate(a.createdAt);
            if (d && d >= todayStart) actionsToday.push(d);
          });
          if (lastSeenAt) {
            const d = toSafeDate(lastSeenAt);
            if (d && d >= todayStart) actionsToday.push(d);
          }

          actionsToday.sort((a, b) => a.getTime() - b.getTime());

          const firstActionToday = actionsToday.length > 0 ? actionsToday[0] : null;
          const lastActionToday = actionsToday.length > 0 ? actionsToday[actionsToday.length - 1] : null;

          const workedTimeTodayMinutes = computeWorkedTime(firstActionToday, lastActionToday);

          const loginAt = toSafeDate(session?.loginAt || session?.createdAt);
          const sessionTimeTodayMinutes = computeSessionTime(loginAt, toSafeDate(lastSeenAt));

          // Última actividad global encontrada
          let lastActivityAt = lastSeenAt;
          if (actionsToday.length > 0) {
            const latestAction = actionsToday[actionsToday.length - 1];
            if (!lastActivityAt || latestAction > toSafeDate(lastActivityAt)!) {
              lastActivityAt = latestAction;
            }
          }

          return {
            uid,
            name: userName,
            email: userEmail,
            role: u.role || 'collaborator',
            avatarUrl: u.photoURL || u.avatarUrl,
            leadsAssigned,
            leadsAttended,
            avgFirstContactTimeMinutes,
            callsRegistered,
            callsDurationTotalSeconds,
            tasksPending,
            tasksCompleted,
            appointmentsScheduled,
            lastActivityAt,
            availabilityStatus,
            workedTimeTodayMinutes,
            sessionTimeTodayMinutes,
            activeTaskTitle: activeTask?.title
          };
        });

      callback(metricsResult);
    } catch (err) {
      console.error('Error calculando métricas operativas:', err);
    }
  };

  // Suscripciones en paralelo
  const unsubs: (() => void)[] = [];

  try {
    // 1. Usuarios
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recompute();
    }, (err) => console.warn('Aviso lectura users (metrics):', err));
    unsubs.push(unsubUsers);

    // 2. Leads
    const unsubLeads = onSnapshot(collection(db, 'leads'), (snap) => {
      leadsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recompute();
    }, (err) => console.warn('Aviso lectura leads (metrics):', err));
    unsubs.push(unsubLeads);

    // 3. Tareas
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      tasksList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recompute();
    }, (err) => console.warn('Aviso lectura tasks (metrics):', err));
    unsubs.push(unsubTasks);

    // 4. VoIP call history
    const unsubCalls = onSnapshot(collection(db, 'voip_call_history'), (snap) => {
      callsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recompute();
    }, (err) => console.warn('Aviso lectura voip_call_history (metrics):', err));
    unsubs.push(unsubCalls);

    // 5. Citas
    const unsubAppointments = onSnapshot(collection(db, 'appointments'), (snap) => {
      appointmentsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recompute();
    }, (err) => console.warn('Aviso lectura appointments (metrics):', err));
    unsubs.push(unsubAppointments);

    // 6. Sesiones
    const unsubSessions = onSnapshot(collection(db, 'user_sessions'), (snap) => {
      sessionsMap = new Map();
      snap.docs.forEach(d => {
        const data = d.data();
        const userId = data.userId || d.id;
        const current = sessionsMap.get(userId);
        const currentSeen = toSafeDate(current?.lastSeenAt);
        const newSeen = toSafeDate(data.lastSeenAt);
        if (!current || (newSeen && (!currentSeen || newSeen > currentSeen))) {
          sessionsMap.set(userId, { id: d.id, ...data });
        }
      });
      recompute();
    }, (err) => console.warn('Aviso lectura user_sessions (metrics):', err));
    unsubs.push(unsubSessions);

  } catch (err) {
    console.error('Error inicializando listeners de métricas:', err);
  }

  return () => {
    isSubscribed = false;
    unsubs.forEach(unsub => {
      try {
        unsub();
      } catch (e) {
        // Ignorar errores al desuscribir
      }
    });
  };
}

/**
 * Obtiene el timeline cronológico de acciones y ruta de trabajo de un colaborador específico
 */
export async function getTimelineForUser(
  uid: string,
  dateBounds?: { start: Date; end: Date }
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  try {
    // 1. Llamadas realizadas
    const callsSnap = await getDocs(
      query(collection(db, 'voip_call_history'), where('agentId', '==', uid))
    ).catch(() => null);

    callsSnap?.docs.forEach(d => {
      const data = d.data();
      const ts = data.createdAt || data.timestamp;
      const date = toSafeDate(ts);
      if (dateBounds && date && (date < dateBounds.start || date > dateBounds.end)) return;

      events.push({
        id: `call_${d.id}`,
        type: 'call',
        title: `Llamada VoIP ${data.direction === 'inbound' ? 'Entrante' : 'Saliente'}`,
        description: `Contacto: ${data.customerPhone || data.targetPhone || 'Sin número'} | Duración: ${data.duration || 0}s`,
        timestamp: ts,
        status: data.status || 'completed',
        metadata: data
      });
    });

    // 2. Tareas asignadas / gestionadas
    const tasksSnap = await getDocs(
      query(collection(db, 'tasks'), where('assignedTo', '==', uid))
    ).catch(() => null);

    tasksSnap?.docs.forEach(d => {
      const data = d.data();
      const ts = data.updatedAt || data.completedAt || data.createdAt;
      const date = toSafeDate(ts);
      if (dateBounds && date && (date < dateBounds.start || date > dateBounds.end)) return;

      events.push({
        id: `task_${d.id}`,
        type: 'task',
        title: `Tarea: ${data.title || 'Sin título'}`,
        description: data.description ? data.description.substring(0, 100) : `Estado: ${data.status || 'pending'}`,
        timestamp: ts,
        status: data.status,
        metadata: data
      });
    });

    // 3. Citas agendadas
    const appSnap = await getDocs(
      query(collection(db, 'appointments'), where('assignedTo', '==', uid))
    ).catch(() => null);

    appSnap?.docs.forEach(d => {
      const data = d.data();
      const ts = data.createdAt || data.scheduledAt;
      const date = toSafeDate(ts);
      if (dateBounds && date && (date < dateBounds.start || date > dateBounds.end)) return;

      events.push({
        id: `apt_${d.id}`,
        type: 'appointment',
        title: `Cita con ${data.clientName || data.leadName || 'Cliente'}`,
        description: `Fecha agendada: ${data.date || 'Pendiente'} ${data.time || ''} (${data.status || 'scheduled'})`,
        timestamp: ts,
        status: data.status || 'scheduled',
        metadata: data
      });
    });

    // 4. Interacción con Leads (atención o primer contacto)
    const leadsSnap = await getDocs(
      query(collection(db, 'leads'), where('assignedTo', '==', uid))
    ).catch(() => null);

    leadsSnap?.docs.forEach(d => {
      const data = d.data();
      if (data.lastContactAt) {
        const date = toSafeDate(data.lastContactAt);
        if (!dateBounds || (date && date >= dateBounds.start && date <= dateBounds.end)) {
          events.push({
            id: `lead_contact_${d.id}`,
            type: 'lead_contact',
            title: `Atención a Lead: ${data.name || data.fullName || 'Prospecto'}`,
            description: `Estado del lead: ${data.status || 'contacted'}. Email: ${data.email || 'N/D'}`,
            timestamp: data.lastContactAt,
            status: data.status,
            metadata: data
          });
        }
      }
    });

  } catch (err) {
    console.error(`Error obteniendo timeline para ${uid}:`, err);
  }

  // Ordenar cronológicamente descendente (más reciente primero)
  events.sort((a, b) => {
    const da = toSafeDate(a.timestamp)?.getTime() || 0;
    const db = toSafeDate(b.timestamp)?.getTime() || 0;
    return db - da;
  });

  return events;
}
