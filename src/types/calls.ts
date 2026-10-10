/**
 * Tipos de datos consolidados para el sistema de VoIP, Softphone,
 * Gestión de Líneas eSIM, Comprobantes y Enrutamiento Telefónico.
 */

export interface DynamicLink {
  id: string;
  label: string;
  url: string;
}

export interface VoipProvider {
  id: string;
  name: string;
  presetKey?: 'zadarma' | 'telnyx' | 'twilio' | 'zoho_voice' | 'asterisk' | 'phoneiq' | 'custom';
  type: 'sip' | 'sdk' | 'api' | 'iframe' | 'webrtc';
  status: 'configured' | 'tested' | 'enabled' | 'available' | 'offline';
  credentials?: {
    // SIP Trunk Core
    username?: string;
    password?: string;
    domain?: string;
    port?: number;
    authUsername?: string;
    callerId?: string;
    callerName?: string;
    transport?: 'WSS' | 'UDP' | 'TCP' | 'TLS';
    // REST API & Webhooks
    apiKey?: string;
    apiSecret?: string;
    accountId?: string;
    apiBaseUrl?: string;
    webhookUrl?: string;
    webhookSecret?: string;
    // WebRTC Signaling & Media ICE
    wsUrl?: string;
    stunServer?: string;
    turnServer?: string;
    turnUsername?: string;
    turnPassword?: string;
    preferredCodec?: 'OPUS' | 'G711U' | 'G711A' | 'G729' | 'AUTO';
    dtmfType?: 'RFC2833' | 'SIP_INFO' | 'INBAND';
    allowedPrefixes?: string;
    recordCallsByDefault?: boolean;
  };
  costPerMinute?: string;
  currency?: string;
  lastUpdated?: string;
  isDefault?: boolean;
  priority?: number;
  failover?: string;
  projectIds?: string[];
  countryCodes?: string[];
  dynamicLinks?: DynamicLink[];
  qualityTrend?: number[];
  notes?: string;
  latencyMs?: number;
}

export interface CallRecord {
  id: string;
  agentId: string;
  agentName?: string;
  agentEmail?: string;
  contactId?: string;
  contactName: string;
  contactPhone: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'missed' | 'rejected' | 'busy' | 'no_answer';
  duration: number; // en segundos
  durationFormatted?: string; // mm:ss
  startedAt: string;
  endedAt?: string;
  recordingUrl?: string;
  provider: string;
  carrier?: string;
  notes?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  cost?: number;
  disposition?: string;
}

export interface EsimProfile {
  id: string;
  agentId?: string;
  agentName?: string;
  region: string;
  package?: string; // e.g. "10GB", "20GB"
  status: 'active' | 'pending' | 'expired' | 'demo';
  phone?: string;
  iccid?: string;
  operator?: string;
  carrier?: string;
  planName?: string;
  lineName?: string;
  extension?: string;
  isInternalLineActive?: boolean;
  isWhatsAppActive?: boolean;
  isSharedWithAllOperators?: boolean;
  assignedOperators?: string[];
  smdpServer?: string;
  activationCode?: string;
  totalDataGB?: number;
  usedDataGB?: number;
  expirationDate?: string;
  signalStrength?: number;
  dataUsedMb?: number;
  dataTotalMb?: number;
  expiresAt?: string;
  createdAt?: string;
  qrCodeUrl?: string;
  isDemo?: boolean;
  autoRecharge?: boolean;
  whatsAppConfig?: {
    phoneNumberId?: string;
    wabaId?: string;
    displayName?: string;
    sharedMode?: 'all_operators' | 'assigned_only';
    webhookStatus?: 'verified' | 'pending';
    multiAgentEnabled?: boolean;
    apiToken?: string;
  };
  sipCredentials?: {
    sipUsername?: string;
    sipPassword?: string;
    sipDomain?: string;
    callerId?: string;
  };
}

export interface UtilityBillData {
  id: string;
  name: string;
  company: string;
  address: string;
  account: string;
  date: string;
  amount: string;
  dueDate: string;
  status: 'draft' | 'generated' | 'sent' | 'approved' | 'rejected';
  pdfUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SoftphoneState {
  status: 'idle' | 'calling' | 'connected' | 'on_hold' | 'ended';
  phoneNumber: string;
  duration: number;
  isMuted: boolean;
  isSpeaker?: boolean;
  isOnHold?: boolean;
  isRecording: boolean;
  carrier: string;
  liveLatency?: number;
  liveJitter?: number;
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  condition: 'cost' | 'quality' | 'geo' | 'load';
  target: string;
  fallback: string;
  enabled: boolean;
  description?: string;
}

export interface TelnyxGlobalConfig {
  id?: string;
  connectionId: string;
  connectionName?: string;
  connectionType?: 'sip_credential' | 'call_control';
  apiKeyMasked?: string;
  webhookUrl: string;
  login_token?: string;
  webrtcJwt?: string;
  maxConcurrentCalls: number;
  recordCallsByDefault: boolean;
  alertOnLimitReached: boolean;
  projectOverrides?: Record<string, string>;
  lastVerifiedAt?: string;
  lastVerificationStatus?: 'active' | 'error' | 'pending';
  lastVerificationMessage?: string;
  updatedAt?: string;
}

export interface TelnyxPhoneNumber {
  id: string;
  phoneNumber: string;
  friendlyName?: string;
  status: 'available' | 'assigned' | 'disabled' | 'in_use';
  assignedAgentIds: string[];
  assignedAgentNames?: string[];
  isSharedPool?: boolean;
  connectionId?: string;
  monthlyCost?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface TelnyxAgentAssignment {
  id: string; // agent user UID
  agentId: string;
  agentName: string;
  agentEmail: string;
  authorizedNumbers: string[]; // phone numbers E.164
  defaultCallerId: string;
  allowSharedPool: boolean;
  strictMode: boolean; // Cannot call with numbers assigned to others
  recordCalls: boolean;
  customConnectionId?: string;
  updatedAt?: string;
}

export interface TelnyxSipCredential {
  id: string; // Document ID (e.g. sip_3054059835856258128)
  name: string; // e.g. "Kaivincia-User6"
  connectionId: string; // e.g. "3054059835856258128"
  username: string; // e.g. "karelyamachado"
  passwordEncrypted: string; // ENC_V1:... encrypted with cryptoUtils
  passwordMasked?: string; // e.g. "••••••••"
  assignedTo?: string | null; // UID del agente asignado
  assignedAgentName?: string | null;
  assignedAgentEmail?: string | null;
  status: 'active' | 'inactive';
  sipDomain?: string; // default: "sip.telnyx.com"
  sipPort?: number; // default: 5060
  transport?: 'WSS' | 'UDP' | 'TCP' | 'TLS';
  isDefault?: boolean;
  callerId?: string;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'error' | 'untested';
  lastTestMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoipProviderSettingsDoc {
  id: string; // provider ID e.g. 'telnyx', 'zadarma', 'dialpad', 'twilio'
  name: string;
  type: 'sip' | 'api' | 'webrtc';
  status: 'configured' | 'tested' | 'enabled' | 'available' | 'offline';
  priority: number;
  isPrimary?: boolean;
  credentialsEncrypted?: {
    username?: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
    connectionId?: string;
    domain?: string;
    callerId?: string;
  };
  assignedNumbers?: string[];
  updatedAt?: string;
}
