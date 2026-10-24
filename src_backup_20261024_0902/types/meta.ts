/**
 * Tipos de datos consolidados para la integración de Meta en Kaivincia
 * Canales soportados: WhatsApp Business Cloud API, Facebook Messenger e Instagram Messaging.
 */

export type MetaChannel = 'whatsapp' | 'facebook' | 'instagram';

export type MetaMessageDirection = 'inbound' | 'outbound';

export type MetaMessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';

export interface MetaConfig {
  appId: string;
  appSecretMasked?: string;
  verifyTokenMasked?: string;
  webhookUrl: string;
  whatsapp: {
    configured: boolean;
    phoneNumberId?: string;
    businessAccountId?: string;
    status: 'connected' | 'disconnected' | 'error' | 'not_configured';
    displayName?: string;
  };
  facebook: {
    configured: boolean;
    pageId?: string;
    pageAccessTokenMasked?: string;
    status: 'connected' | 'disconnected' | 'error' | 'not_configured';
    pageName?: string;
  };
  instagram: {
    configured: boolean;
    accountId?: string;
    accessTokenMasked?: string;
    status: 'connected' | 'disconnected' | 'error' | 'not_configured';
    accountUsername?: string;
  };
  lastVerifiedAt?: string;
  updatedAt?: string;
}

export interface MetaContact {
  id: string; // ID único en Kaivincia
  channel: MetaChannel;
  externalId: string; // WhatsApp: phone E.164, FB: PSID (Page-scoped ID), IG: IGSID
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  projectId?: string;
  projectName?: string;
  tags?: string[];
  lastInteractionAt: string;
  createdAt: string;
}

export interface MetaMessage {
  id: string; // WAMID o ID de Meta o doc ID interno
  threadId: string;
  channel: MetaChannel;
  direction: MetaMessageDirection;
  senderId: string;
  recipientId: string;
  content: {
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'template' | 'interactive';
    text?: string;
    mediaUrl?: string;
    templateName?: string;
    templateParams?: any[];
  };
  status: MetaMessageStatus;
  externalMessageId?: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  metadata?: Record<string, any>;
}

export interface MetaThread {
  id: string; // externalId_channel o doc ID
  channel: MetaChannel;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  contactAvatar?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  projectId?: string;
  projectName?: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  unreadCount: number;
  lastMessageText: string;
  lastMessageTimestamp: string;
  lastMessageDirection: MetaMessageDirection;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessagePayload {
  to: string; // Número E.164
  text?: string;
  template?: {
    name: string;
    language?: string;
    params?: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image';
      text?: string;
      [key: string]: any;
    }>;
  };
}

export interface FacebookMessagePayload {
  recipientId: string; // PSID
  text: string;
}

export interface InstagramMessagePayload {
  recipientId: string; // IGSID
  text: string;
}

export interface MetaSendResponse {
  success: boolean;
  messageId?: string;
  channel: MetaChannel;
  recipientId?: string;
  error?: string;
}

export interface MetaSendPayload {
  channel: MetaChannel;
  to: string;
  text?: string;
  template?: {
    name: string;
    params?: any[];
    languageCode?: string;
  };
}

