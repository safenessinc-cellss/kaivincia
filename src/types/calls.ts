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
  type: 'sip' | 'sdk' | 'api' | 'iframe';
  status: 'configured' | 'tested' | 'enabled' | 'available' | 'offline';
  credentials?: {
    username?: string;
    password?: string;
    domain?: string;
    wsUrl?: string;
    apiKey?: string;
    accountId?: string;
    callerId?: string;
  };
  costPerMinute?: string;
  lastUpdated?: string;
  isDefault?: boolean;
  priority?: number;
  failover?: string;
  projectIds?: string[];
  countryCodes?: string[];
  dynamicLinks?: DynamicLink[];
  qualityTrend?: number[];
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
  agentId: string;
  agentName?: string;
  region: string;
  package: string; // e.g. "10GB", "20GB"
  status: 'active' | 'pending' | 'expired' | 'demo';
  phone?: string;
  iccid?: string;
  operator?: string;
  dataUsedMb: number;
  dataTotalMb: number;
  expiresAt: string;
  createdAt: string;
  qrCodeUrl?: string;
  isDemo: boolean;
  autoRecharge?: boolean;
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
