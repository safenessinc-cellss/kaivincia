export type CustomFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'date' 
  | 'time' 
  | 'datetime' 
  | 'select' 
  | 'multiselect' 
  | 'gps' 
  | 'file' 
  | 'checkbox' 
  | 'url';

export interface TemplateField {
  id: string;
  label: string;
  key: string;
  type: CustomFieldType;
  required: boolean;
  isSystemFixed: boolean; // Campos base inmutables: nombre, teléfono, proyecto, distribuidor, ruta, etc.
  placeholder?: string;
  helpText?: string;
  options?: string[]; // Opciones para select / multiselect
  defaultValue?: any;
  order: number;
  group: string; // Grupo de sección (ej: "Datos Básicos", "Cita y Agenda", "Oferta y Promoción", "Logística")
  validationPattern?: string;
  exportToCard?: boolean; // Si se incluye en la tarjeta exportable al distribuidor
  cardEmoji?: string; // Emoji representativo para la tarjeta del distribuidor (📍, 🔗, 👤, 📅, etc.)
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  operationType: 'cita_distribuidor' | 'prospeccion_tlmk' | 'onboarding_cliente' | 'soporte_garantia' | 'cobranza' | 'custom';
  assignedProjectIds: string[];
  fields: TemplateField[];
  exportCardHeader?: string;
  exportCardFooter?: string;
  version: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Campos base obligatorios y preconfigurados del ecosistema Kaivincia
export const SYSTEM_FIXED_FIELDS: TemplateField[] = [
  {
    id: 'sys_fullName',
    label: 'Nombre Completo del Cliente',
    key: 'fullName',
    type: 'text',
    required: true,
    isSystemFixed: true,
    group: 'Datos del Contacto',
    order: 1,
    exportToCard: true,
    cardEmoji: '👤'
  },
  {
    id: 'sys_phone',
    label: 'Teléfono de Contacto',
    key: 'phone',
    type: 'text',
    required: true,
    isSystemFixed: true,
    group: 'Datos del Contacto',
    order: 2,
    exportToCard: true,
    cardEmoji: '📞'
  },
  {
    id: 'sys_project',
    label: 'Proyecto Asignado',
    key: 'projectName',
    type: 'text',
    required: true,
    isSystemFixed: true,
    group: 'Asignación Operativa',
    order: 3,
    exportToCard: false
  },
  {
    id: 'sys_distributor',
    label: 'Distribuidor / Socio Comercial',
    key: 'distributorName',
    type: 'text',
    required: true,
    isSystemFixed: true,
    group: 'Asignación Operativa',
    order: 4,
    exportToCard: true,
    cardEmoji: '🏢'
  },
  {
    id: 'sys_route',
    label: 'Ruta de Visita / Cuadrante',
    key: 'route',
    type: 'text',
    required: true,
    isSystemFixed: true,
    group: 'Logística y Geografía',
    order: 5,
    exportToCard: true,
    cardEmoji: '📍'
  },
  {
    id: 'sys_assignedTo',
    label: 'Operador / Agente Responsable',
    key: 'assignedTo',
    type: 'text',
    required: true,
    isSystemFixed: true,
    group: 'Asignación Operativa',
    order: 6,
    exportToCard: false
  },
  {
    id: 'sys_nextFollowUp',
    label: 'Próxima Tarea / Seguimiento',
    key: 'nextFollowUpDate',
    type: 'datetime',
    required: false,
    isSystemFixed: true,
    group: 'Gestión y Citas',
    order: 7,
    exportToCard: false
  }
];

// Plantilla estándar de ejemplo predefinida (Cita para Distribuidor)
export const DEFAULT_DISTRIBUTOR_APPOINTMENT_TEMPLATE: FormTemplate = {
  id: 'template_cita_distribuidor_std',
  name: 'Cita Entregable al Distribuidor',
  description: 'Ficha operativa estandarizada con formato exportable para visitas en terreno y seguimiento de leads.',
  operationType: 'cita_distribuidor',
  assignedProjectIds: ['all'],
  isDefault: true,
  version: 1,
  exportCardHeader: '📍 CITA – Seguimiento de Lead',
  exportCardFooter: 'Generado automáticamente por el Ecosistema Kaivincia CRM',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'SuperAdmin Maestro',
  fields: [
    ...SYSTEM_FIXED_FIELDS,
    {
      id: 'field_gps_link',
      label: 'Dirección GPS / Google Maps',
      key: 'gpsLink',
      type: 'gps',
      required: true,
      isSystemFixed: false,
      group: 'Logística y Geografía',
      order: 8,
      placeholder: 'https://maps.google.com/?q=...',
      exportToCard: true,
      cardEmoji: '🔗'
    },
    {
      id: 'field_place_attention',
      label: 'Lugar de Atención / Referencia',
      key: 'placeAttention',
      type: 'text',
      required: true,
      isSystemFixed: false,
      group: 'Logística y Geografía',
      order: 9,
      placeholder: 'Ej: Domicilio particular frente al parque central',
      exportToCard: true,
      cardEmoji: '🏠'
    },
    {
      id: 'field_appointment_datetime',
      label: 'Cita Programada (Día y Hora)',
      key: 'appointmentDateTime',
      type: 'datetime',
      required: true,
      isSystemFixed: false,
      group: 'Gestión y Citas',
      order: 10,
      exportToCard: true,
      cardEmoji: '📅'
    },
    {
      id: 'field_product_interest',
      label: 'Producto/s de Interés',
      key: 'productsInterest',
      type: 'select',
      options: ['Purificador de Agua Osmosis', 'Sistema Alcalino Comercial', 'Filtro de Ducha Spa', 'Dispensador Frío/Calor', 'Paquete Completo'],
      required: true,
      isSystemFixed: false,
      group: 'Oferta y Demanda',
      order: 11,
      exportToCard: true,
      cardEmoji: '👉'
    },
    {
      id: 'field_offered_gift',
      label: 'Regalo Ofrecido por Asistir',
      key: 'offeredGift',
      type: 'text',
      required: false,
      isSystemFixed: false,
      group: 'Oferta y Demanda',
      order: 12,
      placeholder: 'Ej: Test de pureza TDS gratis + Filtro de grifo de cortesía',
      exportToCard: true,
      cardEmoji: '🎁'
    },
    {
      id: 'field_discount_coupon',
      label: 'Cupón de Descuento Promocional',
      key: 'discountCoupon',
      type: 'text',
      required: false,
      isSystemFixed: false,
      group: 'Oferta y Demanda',
      order: 13,
      placeholder: 'Ej: PROMO-VERANO-20',
      exportToCard: true,
      cardEmoji: '📲'
    },
    {
      id: 'field_notes_observations',
      label: 'Observaciones Importantes para el Visor',
      key: 'importantObservations',
      type: 'textarea',
      required: false,
      isSystemFixed: false,
      group: 'Gestión y Citas',
      order: 14,
      placeholder: 'Detalles clave dados por el cliente durante la llamada...',
      exportToCard: true,
      cardEmoji: '📝'
    }
  ]
};
