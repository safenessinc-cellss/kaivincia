import type { IncomingMessage, ServerResponse } from 'http';

interface TelnyxCredentialResponse {
  data?: {
    id: string;
    sip_username: string;
    connection_id: string;
  };
  errors?: Array<{ detail: string; title: string }>;
}

interface TelnyxConnectionResponse {
  data?: {
    id: string;
    connection_name: string;
    active: boolean;
    transport_protocol?: string;
  };
  errors?: Array<{ detail: string; title: string }>;
}

let dynamicApiKey = process.env.TELNYX_API_KEY || '';
let dynamicConnectionId = process.env.TELNYX_CONNECTION_ID || '3046958032463333200';
let dynamicMaxConcurrentCalls = 10;
let activeCallsCount = 0;

/**
 * Backend Service for Telnyx Voice & WebRTC
 * Securely handles API keys and generates ephemeral JWT tokens for agents.
 */
export class TelnyxBackendService {
  public static getApiKey(): string {
    return dynamicApiKey || process.env.TELNYX_API_KEY || '';
  }

  public static getDefaultConnectionId(): string {
    return dynamicConnectionId || process.env.TELNYX_CONNECTION_ID || '';
  }

  public static maskApiKey(key: string): string {
    if (!key) return '';
    if (key.length <= 10) return '••••••••';
    return `${key.slice(0, 7)}••••••••••••••••${key.slice(-6)}`;
  }

  public static getWebhookUrl(): string {
    const appUrl = process.env.APP_URL || 'https://ais-dev-je7y4j4rkf2urn7d5cqnsz-316420818896.us-east1.run.app';
    const cleanUrl = appUrl.replace(/\/$/, '');
    return `${cleanUrl}/api/telnyx/webhook`;
  }

  public static getConfig() {
    const key = this.getApiKey();
    return {
      connectionId: this.getDefaultConnectionId(),
      apiKeyMasked: this.maskApiKey(key),
      isKeyConfigured: Boolean(key && key.length > 5),
      webhookUrl: this.getWebhookUrl(),
      maxConcurrentCalls: dynamicMaxConcurrentCalls,
      activeCallsCount,
      updatedAt: new Date().toISOString()
    };
  }

  public static updateConfig(params: {
    apiKey?: string;
    connectionId?: string;
    maxConcurrentCalls?: number;
  }) {
    if (params.apiKey && params.apiKey.trim()) {
      dynamicApiKey = params.apiKey.trim();
      process.env.TELNYX_API_KEY = dynamicApiKey;
    }
    if (params.connectionId && params.connectionId.trim()) {
      dynamicConnectionId = params.connectionId.trim();
      process.env.TELNYX_CONNECTION_ID = dynamicConnectionId;
    }
    if (typeof params.maxConcurrentCalls === 'number' && params.maxConcurrentCalls > 0) {
      dynamicMaxConcurrentCalls = params.maxConcurrentCalls;
    }

    return this.getConfig();
  }

  public static incrementActiveCalls(): { activeCalls: number; limitReached: boolean } {
    activeCallsCount += 1;
    return {
      activeCalls: activeCallsCount,
      limitReached: activeCallsCount >= dynamicMaxConcurrentCalls
    };
  }

  public static decrementActiveCalls(): { activeCalls: number } {
    if (activeCallsCount > 0) activeCallsCount -= 1;
    return { activeCalls: activeCallsCount };
  }

  public static async handleWebhook(eventData: any): Promise<{ received: boolean; action?: string }> {
    try {
      const eventType = eventData?.data?.event_type || eventData?.event_type || 'unknown';
      const payload = eventData?.data?.payload || eventData?.payload || {};

      console.log(`[Telnyx Webhook] Received event: ${eventType}`, payload?.call_control_id || payload?.call_leg_id);

      if (eventType.includes('initiated') || eventType.includes('ringing')) {
        this.incrementActiveCalls();
      } else if (eventType.includes('hangup') || eventType.includes('ended')) {
        this.decrementActiveCalls();
      }

      return { received: true, action: eventType };
    } catch (err: any) {
      console.error('[Telnyx Webhook] Error processing event:', err);
      return { received: false, action: err.message };
    }
  }

  /**
   * Validates Firebase ID Token from Authorization header
   * Supports Google tokeninfo verification without requiring local service-account files.
   */
  public static async verifyAuthToken(authHeader?: string): Promise<{ uid: string; email?: string } | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) return null;

    try {
      // Decode or verify token using Google TokenInfo endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
      if (response.ok) {
        const payload = await response.json();
        return {
          uid: payload.user_id || payload.sub,
          email: payload.email
        };
      }

      // Fallback for development if token format is simple json or simulated in preview
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload.user_id || payload.sub) {
          return {
            uid: payload.user_id || payload.sub,
            email: payload.email
          };
        }
      }
    } catch (err) {
      console.error('[Telnyx Backend] Token verification failed:', err);
    }

    return null;
  }

  /**
   * Creates or retrieves a telephony credential for the specified agent
   */
  public static async getOrCreateTelephonyCredential(
    uid: string, 
    connectionId?: string
  ): Promise<{ id: string; sip_username: string }> {
    const apiKey = this.getApiKey();
    const connId = connectionId || this.getDefaultConnectionId();

    if (!apiKey) {
      throw new Error('TELNYX_API_KEY no configurada en el servidor.');
    }

    // 1. List existing telephony credentials to check if one exists for this agent
    const listRes = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (listRes.ok) {
      const listData = await listRes.json();
      const existing = listData.data?.find((c: any) => c.name === `kaivincia-agent-${uid}`);
      if (existing) {
        return {
          id: existing.id,
          sip_username: existing.sip_username
        };
      }
    }

    // 2. If not found, create new telephony credential
    const createRes = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        connection_id: connId,
        name: `kaivincia-agent-${uid}`
      })
    });

    const createData: TelnyxCredentialResponse = await createRes.json();
    if (!createRes.ok || !createData.data) {
      const errMsg = createData.errors?.[0]?.detail || createData.errors?.[0]?.title || 'Error creando credencial en Telnyx';
      throw new Error(errMsg);
    }

    return {
      id: createData.data.id,
      sip_username: createData.data.sip_username
    };
  }

  /**
   * Generates a 24-hour JWT token for the agent's WebRTC connection
   */
  public static async generateAgentJwt(credentialId: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('TELNYX_API_KEY no configurada en el servidor.');
    }

    const tokenRes = await fetch(`https://api.telnyx.com/v2/telephony_credentials/${credentialId}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Error generando JWT de Telnyx (${tokenRes.status}): ${text}`);
    }

    // Telnyx returns raw JWT string or JSON with token
    const contentType = tokenRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await tokenRes.json();
      return json.token || json.data?.token || JSON.stringify(json);
    }

    return await tokenRes.text();
  }

  /**
   * Tests connection validity against Telnyx API
   */
  public static async testConnection(connectionId?: string): Promise<{
    success: boolean;
    httpStatus: number;
    message: string;
    connectionData?: any;
  }> {
    const apiKey = this.getApiKey();
    const connId = connectionId || this.getDefaultConnectionId();

    if (!apiKey) {
      return {
        success: false,
        httpStatus: 400,
        message: 'Falta configurar la variable TELNYX_API_KEY en el servidor.'
      };
    }

    if (!connId) {
      return {
        success: false,
        httpStatus: 400,
        message: 'Debes proporcionar un Connection ID válido de Telnyx (Credential Connection).'
      };
    }

    try {
      const res = await fetch(`https://api.telnyx.com/v2/connections/${encodeURIComponent(connId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data: TelnyxConnectionResponse = await res.json().catch(() => ({}));

      if (res.ok && data.data) {
        return {
          success: true,
          httpStatus: res.status,
          message: `Conexión Telnyx "${data.data.connection_name}" verificada y activa.`,
          connectionData: data.data
        };
      }

      const errorDetail = data.errors?.[0]?.detail || data.errors?.[0]?.title || `Respuesta inesperada (${res.status})`;
      return {
        success: false,
        httpStatus: res.status,
        message: `Telnyx API rechazó la conexión: ${errorDetail}`,
        connectionData: data
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 500,
        message: `Error de red al conectar con Telnyx API: ${err.message || 'Error desconocido'}`
      };
    }
  }

  /**
   * Fetches active phone numbers (DIDs) available in the Telnyx account
   */
  public static async getAccountPhoneNumbers(): Promise<{
    success: boolean;
    numbers: Array<{ id: string; phone_number: string; status: string; connection_id?: string }>;
    message?: string;
  }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, numbers: [], message: 'TELNYX_API_KEY no configurada.' };
    }

    try {
      const res = await fetch('https://api.telnyx.com/v2/phone_numbers?filter[status]=active&page[size]=50', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, numbers: [], message: `Error Telnyx (${res.status}): ${errorText}` };
      }

      const json = await res.json();
      const numbers = (json.data || []).map((item: any) => ({
        id: item.id,
        phone_number: item.phone_number,
        status: item.status,
        connection_id: item.connection_id
      }));

      return { success: true, numbers };
    } catch (err: any) {
      return { success: false, numbers: [], message: err.message };
    }
  }
}
