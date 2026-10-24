export type IntegrationProvider =
  | 'meta_lead_ads'
  | 'instagram_dm'
  | 'whatsapp_cloud'
  | 'web_forms'
  | 'smtp_email'
  | 'custom_webhook';

export type IntegrationStatus = 'connected' | 'pending' | 'error';

export interface IntegrationConfig {
  // Meta Lead Ads
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  pageId?: string;
  formId?: string;
  pixelId?: string;

  // Instagram
  instagramAccountId?: string;
  verifyToken?: string;

  // WhatsApp Cloud
  phoneNumberId?: string;
  wabaId?: string;
  webhookCallbackUrl?: string;

  // Web Forms & Universal Webhook
  universalWebhookKey?: string;
  allowedOrigins?: string[];
  redirectSuccessUrl?: string;

  // SMTP Email
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail?: string;
  fromName?: string;

  // Custom Webhook
  targetEndpoint?: string;
  httpMethod?: 'POST' | 'GET' | 'PUT';
  authHeaderName?: string;
  authHeaderValue?: string;
  customHeaders?: Record<string, string>;
  signingSecret?: string;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  statusCode?: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface IntegrationItem {
  id: string;
  provider: IntegrationProvider;
  name: string;
  subtitle: string;
  description: string;
  status: IntegrationStatus;
  category: 'marketing' | 'messaging' | 'forms' | 'email' | 'webhooks';
  iconType: string;
  badge: string;
  docUrl: string;
  config: IntegrationConfig;
  isConfigured: boolean;
  lastTestedAt?: string;
  testResult?: IntegrationTestResult;
  enabledEvents: string[];
  stats: {
    totalReceived: number;
    successCount: number;
    errorCount: number;
    lastEventAt?: string;
  };
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IntegrationTestLog {
  id: string;
  integrationId: string;
  provider: IntegrationProvider;
  status: 'success' | 'failed';
  message: string;
  latencyMs: number;
  executedBy: string;
  timestamp: any;
  payloadSent?: any;
  responseReceived?: any;
}

export const INITIAL_PROVIDERS: IntegrationItem[] = [
  {
    id: 'int_meta_lead_ads',
    provider: 'meta_lead_ads',
    name: 'Meta Lead Ads',
    subtitle: 'Facebook & Instagram Instant Forms',
    description: 'Sincronización instantánea de leads capturados en campañas de Facebook & Instagram directamente al Pipeline y asignación automática a TLMK.',
    status: 'connected',
    category: 'marketing',
    iconType: 'meta',
    badge: 'Oficial Graph API v19.0',
    docUrl: 'https://developers.facebook.com/docs/marketing-api/lead-ads/',
    config: {
      appId: '109283746192834',
      pageId: '1048291049281',
      formId: 'form_leadgen_2026_master',
      accessToken: 'EAABw...[Token Cifrado]'
    },
    isConfigured: true,
    lastTestedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    testResult: {
      success: true,
      message: 'Token de Página verificado con permisos leads_retrieval activos.',
      latencyMs: 124,
      statusCode: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    enabledEvents: ['NUEVO_LEAD_FACEBOOK', 'NUEVO_LEAD_FORMULARIO_META', 'LEAD_CREADO'],
    stats: {
      totalReceived: 1420,
      successCount: 1412,
      errorCount: 8,
      lastEventAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'superadmin@kaivincia.com'
  },
  {
    id: 'int_instagram_dm',
    provider: 'instagram_dm',
    name: 'Instagram Direct Message',
    subtitle: 'Mensajería Directa & Comentarios',
    description: 'Recepción y respuesta de mensajes directos de prospectos desde perfiles corporativos de Instagram con detección de intención de compra.',
    status: 'connected',
    category: 'messaging',
    iconType: 'instagram',
    badge: 'Instagram Graph API',
    docUrl: 'https://developers.facebook.com/docs/messenger-platform/instagram',
    config: {
      instagramAccountId: 'kaivincia_oficial',
      verifyToken: 'kv_verify_token_secure_2026'
    },
    isConfigured: true,
    lastTestedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    testResult: {
      success: true,
      message: 'Webhook handshake con Instagram Graph API exitoso.',
      latencyMs: 145,
      statusCode: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    enabledEvents: ['NUEVO_LEAD_INSTAGRAM', 'MENSAJE_RECIBIDO'],
    stats: {
      totalReceived: 560,
      successCount: 554,
      errorCount: 6,
      lastEventAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'superadmin@kaivincia.com'
  },
  {
    id: 'int_whatsapp_cloud',
    provider: 'whatsapp_cloud',
    name: 'WhatsApp Business Cloud API',
    subtitle: 'Meta Cloud API Oficial',
    description: 'Envío de plantillas homologadas de citas para distribuidores, seguimiento 1-a-1 y disparadores de confirmación automática.',
    status: 'connected',
    category: 'messaging',
    iconType: 'whatsapp',
    badge: 'Meta Cloud v19.0',
    docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    config: {
      phoneNumberId: '10928374910293',
      wabaId: 'waba_99182736451',
      accessToken: 'EAAB...[Bearer Token]'
    },
    isConfigured: true,
    lastTestedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    testResult: {
      success: true,
      message: 'Número de WhatsApp verificado y listo para envío de plantillas HSM.',
      latencyMs: 98,
      statusCode: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
    },
    enabledEvents: ['MENSAJE_RECIBIDO', 'CITA_AGENDADA'],
    stats: {
      totalReceived: 3890,
      successCount: 3878,
      errorCount: 12,
      lastEventAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'superadmin@kaivincia.com'
  },
  {
    id: 'int_web_forms',
    provider: 'web_forms',
    name: 'Formularios Web Universales',
    subtitle: 'Landing Pages & Sitios Externos',
    description: 'Endpoint receptor universal con clave API para conectar formularios de WordPress, Webflow, Shopify o landings personalizadas.',
    status: 'connected',
    category: 'forms',
    iconType: 'forms',
    badge: 'Webhook Receptor HTTPS',
    docUrl: 'https://kaivincia.com/docs/webhooks-forms',
    config: {
      universalWebhookKey: 'wh_live_kv_892374619283',
      allowedOrigins: ['https://kaivincia.com', 'https://promocion.kaivincia.com']
    },
    isConfigured: true,
    lastTestedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    testResult: {
      success: true,
      message: 'Receptor HTTPS validado con CORS y clave autorizada.',
      latencyMs: 45,
      statusCode: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    },
    enabledEvents: ['NUEVO_LEAD_WEB', 'LEAD_CREADO'],
    stats: {
      totalReceived: 980,
      successCount: 978,
      errorCount: 2,
      lastEventAt: new Date(Date.now() - 1000 * 60 * 40).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'superadmin@kaivincia.com'
  },
  {
    id: 'int_smtp_email',
    provider: 'smtp_email',
    name: 'Email Transaccional SMTP',
    subtitle: 'Amazon SES / SendGrid / Postmark',
    description: 'Servidor SMTP seguro para envío de notificaciones automáticas, fichas de clientes y confirmaciones de citas a distribuidores.',
    status: 'connected',
    category: 'email',
    iconType: 'email',
    badge: 'TLS / SSL Port 587',
    docUrl: 'https://kaivincia.com/docs/smtp-setup',
    config: {
      smtpHost: 'email-smtp.us-east-1.amazonaws.com',
      smtpPort: 587,
      smtpUser: 'AKIAIOSFODNN7EXAMPLE',
      smtpSecure: true,
      fromEmail: 'notificaciones@kaivincia.com',
      fromName: 'Kaivincia Operaciones'
    },
    isConfigured: true,
    lastTestedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    testResult: {
      success: true,
      message: 'Handshake SMTP exitoso con autenticación STARTTLS.',
      latencyMs: 180,
      statusCode: 250,
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    enabledEvents: ['CITA_AGENDADA', 'FACTURA_CREADA', 'OPORTUNIDAD_GANADA'],
    stats: {
      totalReceived: 4210,
      successCount: 4195,
      errorCount: 15,
      lastEventAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'superadmin@kaivincia.com'
  },
  {
    id: 'int_custom_webhook',
    provider: 'custom_webhook',
    name: 'Webhooks Personalizados',
    subtitle: 'Zapier, Make, ERP & Sistemas Propios',
    description: 'Emisión y recepción de payloads JSON firmados con HMAC SHA-256 para enlazar con ERPs, sistemas contables o herramientas no-code.',
    status: 'pending',
    category: 'webhooks',
    iconType: 'webhook',
    badge: 'HMAC SHA-256 Firma',
    docUrl: 'https://kaivincia.com/docs/custom-webhooks',
    config: {
      targetEndpoint: 'https://api.erp-distribuidor.com/v1/leads',
      httpMethod: 'POST',
      authHeaderName: 'X-Kaivincia-Signature'
    },
    isConfigured: false,
    lastTestedAt: undefined,
    enabledEvents: ['OPORTUNIDAD_GANADA', 'CITA_AGENDADA'],
    stats: {
      totalReceived: 120,
      successCount: 110,
      errorCount: 10,
      lastEventAt: new Date(Date.now() - 1000 * 60 * 150).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'superadmin@kaivincia.com'
  }
];
