import { 
  Area, 
  EventKey, 
  ConditionOperator, 
  ConditionFieldDefinition, 
  ActionType 
} from '../types/automation';

export interface AreaMeta {
  id: Area;
  name: string;
  description: string;
  iconName: string;
  color: string;
}

export const AREAS: AreaMeta[] = [
  {
    id: 'Marketing',
    name: 'Marketing & Ads',
    description: 'Captación de leads desde Meta Ads, Instagram, Facebook y formularios web.',
    iconName: 'Megaphone',
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/30'
  },
  {
    id: 'CRM_Ventas',
    name: 'CRM & Ventas',
    description: 'Flujo comercial, pipeline de oportunidades, asignación de setters y citas.',
    iconName: 'Target',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
  },
  {
    id: 'Atencion',
    name: 'Atención & Soporte',
    description: 'Mensajes omnicanal, tickets de soporte y llamadas de clientes.',
    iconName: 'Headphones',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/30'
  },
  {
    id: 'Academy',
    name: 'Academy & Alumnos',
    description: 'Inscripciones a cursos, avances formativos y emisión de certificados.',
    iconName: 'GraduationCap',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/30'
  },
  {
    id: 'Facturacion',
    name: 'Facturación & GPS',
    description: 'Cobranzas, facturas creadas, pagos registrados y comprobantes contables.',
    iconName: 'Receipt',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
  },
  {
    id: 'Operaciones',
    name: 'Operaciones & Proyectos',
    description: 'Gestión de tareas de equipo, vencimientos, hitos y proyectos activos.',
    iconName: 'CheckSquare',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/30'
  },
  {
    id: 'RRHH',
    name: 'Talento & RRHH',
    description: 'Altas de colaboradores, reclutamiento y solicitudes de permisos/vacaciones.',
    iconName: 'Users',
    color: 'text-rose-400 bg-rose-400/10 border-rose-400/30'
  },
  {
    id: 'Nomina',
    name: 'Nómina & Pagos',
    description: 'Cálculo de honorarios, dispersión de nóminas y comisiones de venta.',
    iconName: 'DollarSign',
    color: 'text-green-400 bg-green-400/10 border-green-400/30'
  }
];

export interface EventMeta {
  key: EventKey;
  label: string;
  description: string;
  samplePayloadSummary: string;
}

export const EVENTS_BY_AREA: Record<Area, EventMeta[]> = {
  Marketing: [
    {
      key: 'NUEVO_LEAD_FACEBOOK',
      label: 'Nuevo Lead desde Facebook Lead Ads',
      description: 'Se dispara cuando un usuario completa un formulario nativo de anuncio en Facebook.',
      samplePayloadSummary: '{ nombre, email, telefono, campana, ad_id, ciudad }'
    },
    {
      key: 'NUEVO_LEAD_INSTAGRAM',
      label: 'Nuevo Lead por DM o Comentario en Instagram',
      description: 'Se dispara cuando un usuario envía un mensaje directo o comenta una palabra clave en Instagram.',
      samplePayloadSummary: '{ ig_username, mensaje, palabra_clave, postId, telefono }'
    },
    {
      key: 'NUEVO_LEAD_FORMULARIO_META',
      label: 'Nuevo Lead Formulario Instantáneo Meta',
      description: 'Se dispara al recibir respuestas del conector de Meta Instant Forms.',
      samplePayloadSummary: '{ form_id, respuestas: [], canal, lead_id, timestamp }'
    },
    {
      key: 'NUEVO_LEAD_WEB',
      label: 'Nuevo Lead desde Formulario Web (Landing)',
      description: 'Se dispara cuando un visitante llena el formulario en kaivincia.com o landing externa.',
      samplePayloadSummary: '{ nombre, email, telefono, mensaje, fuente, url_origen }'
    }
  ],
  CRM_Ventas: [
    {
      key: 'LEAD_CREADO',
      label: 'Lead Registrado en el CRM',
      description: 'Se dispara cuando un lead ingresa o es creado manualmente en la base.',
      samplePayloadSummary: '{ lead_id, nombre, canal_origen, score, estado }'
    },
    {
      key: 'LEAD_ASIGNADO',
      label: 'Lead Asignado a Setter / Closer',
      description: 'Se dispara cuando un asesor comercial toma posesión de un prospecto.',
      samplePayloadSummary: '{ lead_id, setter_id, setter_name, fecha_asignacion }'
    },
    {
      key: 'ETAPA_CAMBIADA',
      label: 'Etapa del Pipeline Cambiada',
      description: 'Se dispara cuando una oportunidad es arrastrada a una nueva etapa del Kanban.',
      samplePayloadSummary: '{ lead_id, etapa_anterior, etapa_nueva, valor_estimado }'
    },
    {
      key: 'OPORTUNIDAD_GANADA',
      label: 'Oportunidad Ganada (Cierre de Venta)',
      description: 'Se dispara cuando el estado comercial pasa a Venta Cerrada / Ganado.',
      samplePayloadSummary: '{ lead_id, monto, moneda, plan_contratado, closer_id }'
    },
    {
      key: 'OPORTUNIDAD_PERDIDA',
      label: 'Oportunidad Perdida / Descartada',
      description: 'Se dispara cuando se descarta o no califica el prospecto.',
      samplePayloadSummary: '{ lead_id, motivo_descarte, etapa_final }'
    },
    {
      key: 'CITA_AGENDADA',
      label: 'Cita Comercial Agendada',
      description: 'Se dispara cuando se programa una reunión (presencial, llamada o meet).',
      samplePayloadSummary: '{ lead_id, fecha, hora, tipo_cita, agente_asignado }'
    }
  ],
  Atencion: [
    {
      key: 'MENSAJE_RECIBIDO',
      label: 'Mensaje Entrante Recibido',
      description: 'Se dispara cuando un cliente envía un mensaje por canal de soporte.',
      samplePayloadSummary: '{ contacto_id, canal, texto, sentimiento }'
    },
    {
      key: 'TICKET_ABIERTO',
      label: 'Ticket de Soporte Abierto',
      description: 'Se dispara al crearse un caso de asistencia técnica o administrativa.',
      samplePayloadSummary: '{ ticket_id, prioridad, asunto, cliente_id }'
    },
    {
      key: 'TICKET_CERRADO',
      label: 'Ticket de Soporte Resuelto / Cerrado',
      description: 'Se dispara cuando el agente concluye la resolución del ticket.',
      samplePayloadSummary: '{ ticket_id, resolucion, tiempo_atencion_min }'
    },
    {
      key: 'LLAMADA_PERDIDA',
      label: 'Llamada Telefónica Perdida en VoIP',
      description: 'Se dispara cuando un cliente llama y la llamada no fue contestada.',
      samplePayloadSummary: '{ telefono, provider, duracion_espera_seg, fecha }'
    }
  ],
  Academy: [
    {
      key: 'ALUMNO_INSCRITO',
      label: 'Alumno Inscrito en Curso / Programa',
      description: 'Se dispara cuando se confirma la matrícula de un nuevo alumno.',
      samplePayloadSummary: '{ alumno_id, curso_id, curso_nombre, tutor_asignado }'
    },
    {
      key: 'CURSO_COMPLETADO',
      label: 'Curso o Módulo Completado',
      description: 'Se dispara cuando un alumno completa el 100% de las lecciones obligatorias.',
      samplePayloadSummary: '{ alumno_id, curso_id, calificacion_promedio }'
    },
    {
      key: 'CERTIFICADO_EMITIDO',
      label: 'Certificado de Academia Emitido',
      description: 'Se dispara cuando se genera el comprobante digital de graduación.',
      samplePayloadSummary: '{ certificado_id, alumno_id, codigo_verificacion }'
    }
  ],
  Facturacion: [
    {
      key: 'FACTURA_CREADA',
      label: 'Nueva Factura Emitida',
      description: 'Se dispara cuando se genera un comprobante o invoice a un cliente.',
      samplePayloadSummary: '{ factura_id, cliente_id, monto, moneda, fecha_vencimiento }'
    },
    {
      key: 'FACTURA_PAGADA',
      label: 'Factura Marcada como Pagada',
      description: 'Se dispara cuando se concilia el pago completo de una factura.',
      samplePayloadSummary: '{ factura_id, cliente_id, monto_pagado, metodo_pago, comprobante_url }'
    },
    {
      key: 'FACTURA_VENCIDA',
      label: 'Factura con Plazo Vencido',
      description: 'Se dispara cuando una factura pendiente supera su fecha límite de pago.',
      samplePayloadSummary: '{ factura_id, dias_atraso, saldo_pendiente, cliente_nombre }'
    },
    {
      key: 'PAGO_REGISTRADO',
      label: 'Comprobante o Pago Parcial Registrado',
      description: 'Se dispara al subir un recibo o transferencia bancaria en verificación.',
      samplePayloadSummary: '{ pago_id, referencia, monto, estado_verificacion }'
    }
  ],
  Operaciones: [
    {
      key: 'TAREA_CREADA',
      label: 'Nueva Tarea Operativa Creada',
      description: 'Se dispara cuando se asigna un pendiente en la gestión de proyectos.',
      samplePayloadSummary: '{ tarea_id, titulo, asignado_a, prioridad, fecha_limite }'
    },
    {
      key: 'TAREA_VENCIDA',
      label: 'Tarea con Plazo Vencido',
      description: 'Se dispara cuando la fecha y hora de entrega han expirado sin completarse.',
      samplePayloadSummary: '{ tarea_id, titulo, asignado_a, dias_retraso }'
    },
    {
      key: 'PROYECTO_INICIADO',
      label: 'Nuevo Proyecto de Cliente Iniciado',
      description: 'Se dispara cuando el onboarding de un cliente comienza oficialmente.',
      samplePayloadSummary: '{ proyecto_id, cliente_id, lider_proyecto, alcance }'
    },
    {
      key: 'PROYECTO_CERRADO',
      label: 'Proyecto Finalizado y Entregado',
      description: 'Se dispara cuando se aprueba la entrega final del servicio.',
      samplePayloadSummary: '{ proyecto_id, cliente_id, calificacion_nps }'
    }
  ],
  RRHH: [
    {
      key: 'EMPLEADO_INGRESA',
      label: 'Nuevo Colaborador Ingresa al Equipo',
      description: 'Se dispara al dar de alta a un empleado o contratista en el sistema.',
      samplePayloadSummary: '{ colaborador_id, nombre, puesto, departamento, fecha_ingreso }'
    },
    {
      key: 'EMPLEADO_SALE',
      label: 'Baja o Salida de Colaborador',
      description: 'Se dispara cuando concluye la relación contractual con un miembro.',
      samplePayloadSummary: '{ colaborador_id, motivo_baja, fecha_egreso }'
    },
    {
      key: 'SOLICITUD_VACACIONES',
      label: 'Solicitud de Vacaciones / Permiso',
      description: 'Se dispara cuando un colaborador pide días libres para revisión.',
      samplePayloadSummary: '{ solicitud_id, colaborador_id, dias_solicitados, fecha_inicio }'
    }
  ],
  Nomina: [
    {
      key: 'NOMINA_GENERADA',
      label: 'Cierre de Período de Nómina Generado',
      description: 'Se dispara cuando se consolida la prenómina quincenal o mensual.',
      samplePayloadSummary: '{ periodo_id, total_empleados, monto_total, fecha_corte }'
    },
    {
      key: 'NOMINA_PAGADA',
      label: 'Dispersión de Pagos Completada',
      description: 'Se dispara cuando se procesan las transferencias de nómina del equipo.',
      samplePayloadSummary: '{ periodo_id, comprobantes_emitidos, fecha_dispersion }'
    }
  ]
};

export const FIELDS_BY_AREA: Record<Area, ConditionFieldDefinition[]> = {
  Marketing: [
    { key: 'origen_canal', label: 'Canal de Origen', type: 'select', options: [
      { value: 'Instagram', label: 'Instagram Direct / Comentario' },
      { value: 'Facebook', label: 'Facebook Lead Ads' },
      { value: 'MetaForms', label: 'Meta Instant Forms' },
      { value: 'LandingWeb', label: 'Landing Page Web' }
    ]},
    { key: 'mensaje_texto', label: 'Texto del Mensaje / Comentario', type: 'string', placeholder: 'Ej: PERFIL, PRECIO, INFO' },
    { key: 'palabra_clave', label: 'Palabra Clave (Keyword)', type: 'string', placeholder: 'Ej: PERFIL' },
    { key: 'nombre_campana', label: 'Nombre de Campaña Meta', type: 'string', placeholder: 'Ej: Campaña_Setters_Q3' },
    { key: 'pais', label: 'País del Prospecto', type: 'string', placeholder: 'Ej: España, México, USA' },
    { key: 'tiene_telefono', label: '¿Tiene Teléfono Válido?', type: 'boolean' }
  ],
  CRM_Ventas: [
    { key: 'etapa_actual', label: 'Etapa del Pipeline', type: 'select', options: [
      { value: 'LEAD_IN', label: 'Nuevos Leads (LEAD_IN)' },
      { value: 'CONTACTADO', label: 'Contactado' },
      { value: 'SEGUIMIENTO', label: 'En Seguimiento' },
      { value: 'CITA_AGENDADA', label: 'Cita Agendada' },
      { value: 'CITA_CUMPLIDA', label: 'Cita Cumplida' },
      { value: 'PROPUESTA', label: 'En Propuesta' },
      { value: 'CIERRE', label: 'Venta Cerrada' },
      { value: 'NO_INTERESADO', label: 'Descartado' }
    ]},
    { key: 'valor_estimado', label: 'Valor Estimado ($ USD)', type: 'number' },
    { key: 'setter_asignado', label: 'Setter Asignado', type: 'string', placeholder: 'ID o Nombre de Setter' },
    { key: 'tipo_cita', label: 'Modalidad de la Cita', type: 'select', options: [
      { value: 'videollamada', label: 'Videollamada (Meet/Zoom)' },
      { value: 'presencial', label: 'Presencial (GPS Requerido)' },
      { value: 'telefonica', label: 'Llamada Telefónica' }
    ]},
    { key: 'score_calificacion', label: 'Puntaje de Calificación (0-100)', type: 'number' },
    { key: 'tiempo_sin_contacto_horas', label: 'Horas sin Contacto', type: 'number' }
  ],
  Atencion: [
    { key: 'prioridad_ticket', label: 'Prioridad del Ticket', type: 'select', options: [
      { value: 'urgente', label: 'Urgente / Crítica' },
      { value: 'alta', label: 'Alta' },
      { value: 'media', label: 'Media' },
      { value: 'baja', label: 'Baja' }
    ]},
    { key: 'canal_atencion', label: 'Canal de Contacto', type: 'select', options: [
      { value: 'WhatsApp', label: 'WhatsApp' },
      { value: 'Instagram', label: 'Instagram DM' },
      { value: 'Email', label: 'Correo Electrónico' },
      { value: 'Telefono', label: 'Teléfono VoIP' }
    ]},
    { key: 'sentimiento_detectado', label: 'Sentimiento del Mensaje', type: 'select', options: [
      { value: 'positivo', label: 'Positivo' },
      { value: 'neutral', label: 'Neutral' },
      { value: 'negativo', label: 'Negativo / Molesto' }
    ]}
  ],
  Academy: [
    { key: 'curso_id', label: 'Identificador del Curso', type: 'string', placeholder: 'Ej: curso_tlmk_elite' },
    { key: 'calificacion_final', label: 'Calificación Final (0-100)', type: 'number' },
    { key: 'progreso_porcentaje', label: 'Porcentaje de Progreso (%)', type: 'number' },
    { key: 'tiene_tutor', label: '¿Tiene Tutor Asignado?', type: 'boolean' }
  ],
  Facturacion: [
    { key: 'monto_factura', label: 'Monto Total de la Factura ($ USD)', type: 'number' },
    { key: 'moneda', label: 'Moneda de Pago', type: 'select', options: [
      { value: 'USD', label: 'Dólares (USD)' },
      { value: 'EUR', label: 'Euros (EUR)' },
      { value: 'VES', label: 'Bolívares (VES)' }
    ]},
    { key: 'estado_factura', label: 'Estado Actual de Factura', type: 'select', options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'pagada', label: 'Pagada' },
      { value: 'vencida', label: 'Vencida' },
      { value: 'anulada', label: 'Anulada' }
    ]},
    { key: 'dias_vencida', label: 'Días de Vencimiento', type: 'number' },
    { key: 'tiene_comprobante', label: '¿Adjuntó Comprobante de Pago?', type: 'boolean' }
  ],
  Operaciones: [
    { key: 'prioridad_tarea', label: 'Prioridad de la Tarea', type: 'select', options: [
      { value: 'alta', label: 'Alta' },
      { value: 'media', label: 'Media' },
      { value: 'baja', label: 'Baja' }
    ]},
    { key: 'dias_retraso_tarea', label: 'Días de Retraso', type: 'number' },
    { key: 'departamento', label: 'Departamento Responsable', type: 'select', options: [
      { value: 'Ventas', label: 'Ventas' },
      { value: 'Operaciones', label: 'Operaciones' },
      { value: 'Tecnologia', label: 'Tecnología' },
      { value: 'Finanzas', label: 'Finanzas' }
    ]},
    { key: 'estado_proyecto', label: 'Estado del Proyecto', type: 'string', placeholder: 'Ej: En desarrollo, Pruebas' }
  ],
  RRHH: [
    { key: 'rol_puesto', label: 'Puesto del Colaborador', type: 'select', options: [
      { value: 'setter', label: 'Setter Telefónico' },
      { value: 'closer', label: 'Closer de Ventas' },
      { value: 'gestor', label: 'Gestor de Operaciones' },
      { value: 'tutor', label: 'Tutor Académico' }
    ]},
    { key: 'dias_solicitados', label: 'Días de Vacaciones Solicitados', type: 'number' }
  ],
  Nomina: [
    { key: 'monto_total_nomina', label: 'Monto Total de la Nómina ($)', type: 'number' },
    { key: 'tipo_periodo', label: 'Tipo de Período', type: 'select', options: [
      { value: 'quincenal', label: 'Quincenal' },
      { value: 'mensual', label: 'Mensual' },
      { value: 'comision_spot', label: 'Comisión por Venta Cerrada' }
    ]}
  ]
};

export interface ActionMeta {
  type: ActionType;
  label: string;
  description: string;
  available: boolean;
  pending: boolean;
  requiredIntegration?: string;
  defaultParams: Record<string, any>;
  paramFields: {
    key: string;
    label: string;
    type: 'string' | 'select' | 'textarea' | 'number';
    options?: { value: string; label: string }[];
    placeholder?: string;
  }[];
}

export const ACTIONS_CATALOG: ActionMeta[] = [
  {
    type: 'crear_contacto',
    label: 'Crear / Actualizar Contacto en CRM',
    description: 'Guarda o actualiza la ficha del cliente en la base central sin duplicar.',
    available: true,
    pending: false,
    defaultParams: { origen: 'Meta Ads', etiqueta: 'Prospecto' },
    paramFields: [
      { key: 'origen', label: 'Etiqueta de Origen', type: 'string', placeholder: 'Ej: Instagram Network Ads' },
      { key: 'etiqueta', label: 'Etiqueta Inicial', type: 'string', placeholder: 'Ej: Calificado' }
    ]
  },
  {
    type: 'asignar_setter',
    label: 'Asignar a Setter / Agente Comercial',
    description: 'Distribuye el prospecto por turno rotativo o a un agente concreto.',
    available: true,
    pending: false,
    defaultParams: { modo: 'rotativo', rol: 'setter' },
    paramFields: [
      { key: 'modo', label: 'Método de Asignación', type: 'select', options: [
        { value: 'rotativo', label: 'Rotativo Automático (Round-Robin)' },
        { value: 'especifico', label: 'Asignar a Usuario Específico' }
      ]},
      { key: 'rol', label: 'Rol Asignable', type: 'select', options: [
        { value: 'setter', label: 'Setter Comercial' },
        { value: 'closer', label: 'Closer de Ventas' },
        { value: 'gestor', label: 'Gestor Operativo' }
      ]}
    ]
  },
  {
    type: 'crear_tarea',
    label: 'Crear Tarea con Fecha Límite',
    description: 'Genera una tarea pendiente en el módulo de Operaciones para un responsable.',
    available: true,
    pending: false,
    defaultParams: { titulo: 'Seguimiento inmediato a nuevo lead', prioridad: 'alta', plazoHoras: 2 },
    paramFields: [
      { key: 'titulo', label: 'Título de la Tarea', type: 'string', placeholder: 'Ej: Llamar antes de 2 horas' },
      { key: 'prioridad', label: 'Prioridad', type: 'select', options: [
        { value: 'alta', label: 'Alta' },
        { value: 'media', label: 'Media' },
        { value: 'baja', label: 'Baja' }
      ]},
      { key: 'plazoHoras', label: 'Plazo Límite de Ejecución (Horas)', type: 'number', placeholder: '2' }
    ]
  },
  {
    type: 'crear_cita',
    label: 'Crear Bloque de Cita en Agenda',
    description: 'Reserva automáticamente un espacio en el calendario operativo.',
    available: true,
    pending: false,
    defaultParams: { tipo: 'videollamada', duracionMin: 30 },
    paramFields: [
      { key: 'tipo', label: 'Modalidad de Cita', type: 'select', options: [
        { value: 'videollamada', label: 'Videollamada' },
        { value: 'presencial', label: 'Presencial' },
        { value: 'telefonica', label: 'Telefónica' }
      ]},
      { key: 'duracionMin', label: 'Duración (Minutos)', type: 'number', placeholder: '30' }
    ]
  },
  {
    type: 'cambiar_etapa_pipeline',
    label: 'Mover Lead a Etapa del Pipeline',
    description: 'Actualiza la columna del Kanban de oportunidades.',
    available: true,
    pending: false,
    defaultParams: { nuevaEtapa: 'CONTACTADO' },
    paramFields: [
      { key: 'nuevaEtapa', label: 'Nueva Etapa', type: 'select', options: [
        { value: 'LEAD_IN', label: 'LEAD_IN' },
        { value: 'CONTACTADO', label: 'CONTACTADO' },
        { value: 'SEGUIMIENTO', label: 'SEGUIMIENTO' },
        { value: 'CITA_AGENDADA', label: 'CITA_AGENDADA' },
        { value: 'CITA_CUMPLIDA', label: 'CITA_CUMPLIDA' },
        { value: 'PROPUESTA', label: 'PROPUESTA' },
        { value: 'CIERRE', label: 'CIERRE (Ganado)' },
        { value: 'NO_INTERESADO', label: 'NO_INTERESADO' }
      ]}
    ]
  },
  {
    type: 'enviar_notificacion_interna',
    label: 'Enviar Alerta / Notificación Interna',
    description: 'Envía alerta de sistema a los supervisores o agentes involucrados.',
    available: true,
    pending: false,
    defaultParams: { canal: 'sistema', mensaje: 'Nueva alerta de automatización' },
    paramFields: [
      { key: 'mensaje', label: 'Mensaje de la Alerta', type: 'textarea', placeholder: 'Ej: Lead de alto valor recibido. Atender de inmediato.' },
      { key: 'destinatario', label: 'Destinatario', type: 'select', options: [
        { value: 'supervisor', label: 'Supervisores & Gestión' },
        { value: 'asignado', label: 'Agente Asignado' },
        { value: 'todos', label: 'Todo el Equipo' }
      ]}
    ]
  },
  {
    type: 'actualizar_campo',
    label: 'Actualizar Campo Específico del Registro',
    description: 'Modifica un atributo puntual de la entidad (factura, lead o tarea).',
    available: true,
    pending: false,
    defaultParams: { campo: 'estado', valor: 'activo' },
    paramFields: [
      { key: 'campo', label: 'Nombre del Campo', type: 'string', placeholder: 'Ej: estado, score, notas' },
      { key: 'valor', label: 'Nuevo Valor a Asignar', type: 'string', placeholder: 'Ej: auditado' }
    ]
  },
  {
    type: 'alertar_supervisor',
    label: 'Escalar Incidencia a C-Level / Dirección',
    description: 'Registra un evento prioritario en el Centro de Seguridad y Alertas.',
    available: true,
    pending: false,
    defaultParams: { nivel: 'alto', motivo: 'Incumplimiento de SLA' },
    paramFields: [
      { key: 'motivo', label: 'Motivo del Escalamiento', type: 'string', placeholder: 'Ej: Tarea vencida por más de 48h' }
    ]
  },
  // Acciones que dependen de conectores externos (disponibilidad condicional)
  {
    type: 'enviar_whatsapp',
    label: 'Enviar Mensaje por WhatsApp Cloud API',
    description: 'Envía plantilla aprobada por Meta vía WhatsApp oficial.',
    available: false,
    pending: true,
    requiredIntegration: 'WhatsApp Cloud API',
    defaultParams: { plantilla: 'saludo_bienvenida' },
    paramFields: [
      { key: 'plantilla', label: 'Nombre de Plantilla WhatsApp', type: 'string', placeholder: 'Ej: bienvenida_lead_v1' }
    ]
  },
  {
    type: 'enviar_dm_instagram',
    label: 'Enviar Mensaje Directo en Instagram',
    description: 'Responde automáticamente a DMs en la cuenta de Instagram conectada.',
    available: false,
    pending: true,
    requiredIntegration: 'Instagram Graph API',
    defaultParams: { mensaje: '¡Hola! Gracias por contactar a Kaivincia Corp.' },
    paramFields: [
      { key: 'mensaje', label: 'Texto del Mensaje', type: 'textarea', placeholder: 'Escribe el mensaje de respuesta...' }
    ]
  },
  {
    type: 'enviar_email',
    label: 'Enviar Correo Electrónico (SMTP)',
    description: 'Envía notificación o comprobante por correo al cliente.',
    available: true,
    pending: false,
    defaultParams: { asunto: 'Notificación Kaivincia Corp' },
    paramFields: [
      { key: 'asunto', label: 'Asunto del Correo', type: 'string', placeholder: 'Ej: Tu comprobante ha sido aprobado' },
      { key: 'cuerpo', label: 'Cuerpo del Mensaje', type: 'textarea', placeholder: 'Contenido del correo...' }
    ]
  },
  {
    type: 'llamar_webhook',
    label: 'Disparar Webhook Externo (Make / Zapier / Backend)',
    description: 'Envía el payload del evento a una URL HTTPS de servicio externo.',
    available: true,
    pending: false,
    defaultParams: { metodo: 'POST' },
    paramFields: [
      { key: 'url', label: 'URL del Webhook (HTTPS)', type: 'string', placeholder: 'https://hook.eu1.make.com/...' }
    ]
  },
  {
    type: 'emitir_documento',
    label: 'Emitir Comprobante / Recibo Contable',
    description: 'Genera el registro contable en Facturación conservando el comprobante.',
    available: true,
    pending: false,
    defaultParams: { tipoDoc: 'recibo_pago' },
    paramFields: [
      { key: 'tipoDoc', label: 'Tipo de Comprobante', type: 'select', options: [
        { value: 'recibo_pago', label: 'Recibo Oficial de Pago' },
        { value: 'factura_gps', label: 'Factura con Validez GPS' },
        { value: 'certificado_alumno', label: 'Certificado de Alumno' }
      ]}
    ]
  }
];

export const ACTIONS_BY_AREA: Record<Area, ActionType[]> = {
  Marketing: [
    'crear_contacto',
    'asignar_setter',
    'crear_tarea',
    'enviar_notificacion_interna',
    'enviar_whatsapp',
    'enviar_dm_instagram',
    'llamar_webhook'
  ],
  CRM_Ventas: [
    'cambiar_etapa_pipeline',
    'asignar_setter',
    'crear_cita',
    'crear_tarea',
    'enviar_notificacion_interna',
    'enviar_whatsapp',
    'actualizar_campo'
  ],
  Atencion: [
    'crear_tarea',
    'enviar_notificacion_interna',
    'enviar_whatsapp',
    'enviar_email',
    'actualizar_campo',
    'alertar_supervisor'
  ],
  Academy: [
    'actualizar_campo',
    'emitir_documento',
    'enviar_email',
    'enviar_notificacion_interna'
  ],
  Facturacion: [
    'actualizar_campo',
    'emitir_documento',
    'enviar_notificacion_interna',
    'enviar_email',
    'alertar_supervisor'
  ],
  Operaciones: [
    'crear_tarea',
    'actualizar_campo',
    'alertar_supervisor',
    'enviar_notificacion_interna',
    'llamar_webhook'
  ],
  RRHH: [
    'crear_tarea',
    'enviar_notificacion_interna',
    'actualizar_campo',
    'enviar_email'
  ],
  Nomina: [
    'emitir_documento',
    'enviar_notificacion_interna',
    'enviar_email',
    'alertar_supervisor'
  ]
};

export interface OperatorMeta {
  key: ConditionOperator;
  label: string;
  symbol: string;
  applicableTypes: ('string' | 'number' | 'boolean' | 'select')[];
}

export const OPERATORS: OperatorMeta[] = [
  { key: 'equals', label: 'es igual a', symbol: '=', applicableTypes: ['string', 'number', 'boolean', 'select'] },
  { key: 'not_equals', label: 'es diferente de', symbol: '≠', applicableTypes: ['string', 'number', 'boolean', 'select'] },
  { key: 'contains', label: 'contiene el texto', symbol: '⊃', applicableTypes: ['string'] },
  { key: 'not_contains', label: 'no contiene el texto', symbol: '⊅', applicableTypes: ['string'] },
  { key: 'greater_than', label: 'es mayor que', symbol: '>', applicableTypes: ['number'] },
  { key: 'less_than', label: 'es menor que', symbol: '<', applicableTypes: ['number'] },
  { key: 'greater_or_equal', label: 'es mayor o igual a', symbol: '≥', applicableTypes: ['number'] },
  { key: 'less_or_equal', label: 'es menor o igual a', symbol: '≤', applicableTypes: ['number'] },
  { key: 'in', label: 'está en la lista', symbol: '∈', applicableTypes: ['string', 'select'] },
  { key: 'not_in', label: 'no está en la lista', symbol: '∉', applicableTypes: ['string', 'select'] },
  { key: 'is_empty', label: 'está vacío / no existe', symbol: '∅', applicableTypes: ['string', 'number', 'select'] },
  { key: 'is_not_empty', label: 'tiene valor / está presente', symbol: '∃', applicableTypes: ['string', 'number', 'select'] }
];
