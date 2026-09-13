export type PipelineStage = 
  | 'LEAD_IN'           // Nuevos Leads Meta Ads
  | 'CONTACTADO'        // Contactado
  | 'SEGUIMIENTO'       // En Seguimiento / Reprogramado
  | 'CITA_AGENDADA'     // Cita Agendada
  | 'CITA_CUMPLIDA'     // Cita Cumplida (GPS Verificada)
  | 'PROPUESTA'         // En Propuesta / Negociación
  | 'CIERRE'            // Venta Cerrada / Ganado
  | 'NO_INTERESADO';    // Descartado / No Interesado

export type CallDisposition = 
  | 'CITA_AGENDADA'
  | 'INTERESADO'
  | 'NO_CONTESTA'
  | 'BUZON'
  | 'VOLVER_A_LLAMAR'
  | 'NUMERO_EQUIVOCADO'
  | 'NO_INTERESADO';

export interface LeadNote {
  id: string;
  author: string;
  authorRole?: string;
  text: string;
  createdAt: string;
  disposition?: CallDisposition;
}

export interface AppointmentData {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  assignedAgent: string; // Nombre del consultor o cerrador
  assignedAgentEmail?: string;
  type: 'presencial' | 'videollamada' | 'telefonica';
  address?: string;
  notes?: string;
  status: 'programada' | 'cumplida' | 'atrasada' | 'cancelada';
  gpsVerified?: boolean;
  gpsCoordinates?: { lat: number; lng: number };
  gpsCheckInTime?: string;
  clientFeedback?: {
    rating: number; // 1-5
    comment: string;
    submittedAt: string;
  };
}

export interface LeadOpportunity {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  source: 'meta_ads' | 'instagram' | 'whatsapp' | 'manual' | 'referido' | 'web';
  campaignName?: string;
  adSetName?: string;
  pipelineStage: PipelineStage;
  assignedTLMK: string; // TLMK asignado (ej: "Zaydeli De La Rosa", "Marta García")
  assignedTLMKId?: string;
  contractValue?: number;
  healthScore?: number;
  lastCallDate?: string;
  lastCallStatus?: CallDisposition;
  nextFollowUpDate?: string; // ISO string o YYYY-MM-DDTHH:mm
  isOverdue?: boolean; // Atrasado
  appointment?: AppointmentData;
  notes: LeadNote[];
  createdAt: string;
  updatedAt: string;
}

export interface VoipProviderConfig {
  id: string;
  name: string;
  callerIdNumber: string;
  providerType: 'zadarma' | 'twilio' | 'webrtc' | 'custom_sip';
  status: 'connected' | 'disconnected';
  costPerMinute: string;
  sipServer?: string;
}
