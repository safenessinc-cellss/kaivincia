export interface UserSession {
  id: string;
  uid: string;
  userEmail: string;
  userName: string;
  device: string;
  browser: string;
  os: string;
  ip?: string;
  createdAt: string;
  lastSeenAt: string;
  isActive: boolean;
  userAgent?: string;
}

export interface SecurityUser {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'frozen' | 'suspended' | 'pending';
  mfaEnabled?: boolean;
  mfaEnrolled?: boolean; // Real Firebase Auth MFA status
  mfaMethod?: 'sms' | 'totp' | 'none';
  lastLogin?: string;
  lastSeenAt?: string;
  activeSessionsCount?: number;
  assignedClients?: string[];
  assignedProjects?: string[];
  createdAt?: string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  category: 'AUTH' | 'ACCESS' | 'ROLE_CHANGE' | 'STATUS_CHANGE' | 'SESSION_TERMINATED' | 'DATA_EXPORT' | 'SECURITY';
  details?: string;
  targetId?: string;
  targetType?: string;
  previousValue?: any;
  newValue?: any;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ip?: string;
  userAgent?: string;
  timestamp: any;
}

export interface OperatorMetric {
  uid: string;
  name: string;
  email: string;
  role: string;
  status: 'available' | 'in_management' | 'off_shift' | 'offline';
  leadsAssigned: number;
  leadsAttended: number;
  avgFirstContactMinutes: number;
  callsCount: number;
  tasksPending: number;
  tasksCompleted: number;
  appointmentsBooked: number;
  activeSessionDurationMinutes: number;
  actualWorkedMinutes: number;
  lastActionTime?: string;
  lastActionDescription?: string;
}
