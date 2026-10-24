export type Area = 
  | 'Marketing' 
  | 'CRM_Ventas' 
  | 'Atencion' 
  | 'Academy' 
  | 'Facturacion' 
  | 'Operaciones' 
  | 'RRHH' 
  | 'Nomina';

export type EventKey =
  // Marketing
  | 'NUEVO_LEAD_FACEBOOK'
  | 'NUEVO_LEAD_INSTAGRAM'
  | 'NUEVO_LEAD_FORMULARIO_META'
  | 'NUEVO_LEAD_WEB'
  // CRM / Ventas
  | 'LEAD_CREADO'
  | 'LEAD_ASIGNADO'
  | 'ETAPA_CAMBIADA'
  | 'OPORTUNIDAD_GANADA'
  | 'OPORTUNIDAD_PERDIDA'
  | 'CITA_AGENDADA'
  // Atención
  | 'MENSAJE_RECIBIDO'
  | 'TICKET_ABIERTO'
  | 'TICKET_CERRADO'
  | 'LLAMADA_PERDIDA'
  // Academy
  | 'ALUMNO_INSCRITO'
  | 'CURSO_COMPLETADO'
  | 'CERTIFICADO_EMITIDO'
  // Facturación
  | 'FACTURA_CREADA'
  | 'FACTURA_PAGADA'
  | 'FACTURA_VENCIDA'
  | 'PAGO_REGISTRADO'
  // Operaciones
  | 'TAREA_CREADA'
  | 'TAREA_VENCIDA'
  | 'PROYECTO_INICIADO'
  | 'PROYECTO_CERRADO'
  // RRHH
  | 'EMPLEADO_INGRESA'
  | 'EMPLEADO_SALE'
  | 'SOLICITUD_VACACIONES'
  // Nómina
  | 'NOMINA_GENERADA'
  | 'NOMINA_PAGADA';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

export interface ConditionFieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
  logic: 'AND' | 'OR';
}

export type ActionType =
  | 'crear_contacto'
  | 'actualizar_contacto'
  | 'asignar_setter'
  | 'crear_tarea'
  | 'crear_cita'
  | 'enviar_notificacion_interna'
  | 'enviar_email'
  | 'enviar_whatsapp'
  | 'enviar_dm_instagram'
  | 'llamar_webhook'
  | 'cambiar_etapa_pipeline'
  | 'actualizar_campo'
  | 'emitir_documento'
  | 'alertar_supervisor';

export interface ActionFallback {
  type: ActionType;
  params: Record<string, any>;
  responsibleRole?: string;
  notifySupervisor: boolean;
}

export interface Action {
  id: string;
  type: ActionType;
  params: Record<string, any>;
  order: number;
  responsibleRole: string;
  delayMinutes: number;
  isEnabled: boolean;
  fallback?: ActionFallback;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  area: Area;
  event: EventKey;
  conditions: Condition[];
  actions: Action[];
  isActive: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  executionCount?: number;
  failureCount?: number;
  lastRunAt?: string;
}

export interface AutomationLogActionExecution {
  actionId: string;
  actionType: ActionType;
  status: 'success' | 'failed' | 'fallback_triggered' | 'skipped';
  message: string;
  timestamp: string;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  area: Area;
  event: EventKey;
  payload: Record<string, any>;
  conditionsMatched: boolean;
  actionsExecuted: AutomationLogActionExecution[];
  errors?: string[];
  retries: number;
  status: 'completed' | 'partial' | 'failed' | 'no_match';
  timestamp: any; // Firestore serverTimestamp or ISO string
  linkedRecord?: {
    type: 'lead' | 'client' | 'invoice' | 'task' | 'ticket' | 'project' | 'student';
    id: string;
    label: string;
  };
}

export type IntegrationProvider =
  | 'meta_lead_ads'
  | 'instagram_dm'
  | 'whatsapp_cloud'
  | 'web_forms'
  | 'smtp_email'
  | 'custom_webhook';

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  name: string;
  status: 'connected' | 'pending' | 'error';
  lastTestedAt?: string;
  errorMessage?: string;
  config?: Record<string, any>;
  isConfigured: boolean;
  details?: string;
}
