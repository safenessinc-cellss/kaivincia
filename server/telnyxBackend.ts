import type { IncomingMessage, ServerResponse } from 'http';
import * as admin from 'firebase-admin';

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

// ============================================================
// Inicializar Firebase Admin (una sola vez)
// ============================================================
if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      console.error('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY no configurada');
    } else {
      // Vercel puede escapar los \n, hay que restaurarlos
      const serviceAccount = JSON.parse(raw.replace(/\\n/g, '\n'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase Admin] Inicializado correctamente');
    }
  } catch (err) {
    console.error('[Firebase Admin] Error al inicializar:', err);
  }
}

/**
 * Backend Service for Telnyx Voice & WebRTC
 * Securely handles API keys and generates ephemeral JWT tokens for agents.
 */
export class TelnyxBackendService {
  private static getApiKey(): string {
    const key = process.env.TELNYX_API_KEY || '';
    if (!key) {
      console.warn('[Telnyx Backend] Warning: TELNYX_API_KEY environment variable is not defined.');
    }
    return key;
  }

  private static getDefaultConnectionId(): string {
    return process.env.TELNYX_CONNECTION_ID || '';
  }

  /**
   * Verifica el ID Token de Firebase usando Firebase Admin SDK.
   */
  public static async verifyAuthToken(
    authHeader?: string
  ): Promise<{ uid: string; email?: string } | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[verifyAuthToken] Header Authorization ausente o mal formado');
      return null;
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) return null;

    if (!admin.apps.length) {
      console.error('[verifyAuthToken] Firebase Admin no está inicializado');
      return null;
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      console.log('[verifyAuthToken] Token válido para uid:', decoded.uid);
      return {
        uid: decoded.uid,
        email: decoded.email,
      };
    } catch (err: any) {
      console.error('[verifyAuthToken] verifyIdToken falló:', err.code, err.message);
      return null;
    }
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

    const listRes = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (listRes.ok) {
      const listData = await listRes.json();
      const existing = listData.data?.find(
        (c: any) => c.name === `kaivincia-agent-${uid}`
      );
      if (existing) {
        return {
          id: existing.id,
          sip_username: existing.sip_username,
        };
      }
    }

    const createRes = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connection_id: connId,
        name: `kaivincia-agent-${uid}`,
      }),
    });

    const createData: TelnyxCredentialResponse = await createRes.json();
    if (!createRes.ok || !createData.data) {
      const errMsg =
        createData.errors?.[0]?.detail ||
        createData.errors?.[0]?.title ||
        'Error creando credencial en Telnyx';
      throw new Error(errMsg);
    }

    return {
      id: createData.data.id,
      sip_username: createData.data.sip_username,
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

    const tokenRes = await fetch(
      `https://api.telnyx.com/v2/telephony_credentials/${credentialId}/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Error generando JWT de Telnyx (${tokenRes.status}): ${text}`);
    }

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
        message: 'Falta configurar la variable TELNYX_API_KEY en el servidor.',
      };
    }

    if (!connId) {
      return {
        success: false,
        httpStatus: 400,
        message:
          'Debes proporcionar un Connection ID válido de Telnyx (Credential Connection).',
      };
    }

    try {
      const res = await fetch(
        `https://api.telnyx.com/v2/connections/${encodeURIComponent(connId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data: TelnyxConnectionResponse = await res.json().catch(() => ({}));

      if (res.ok && data.data) {
        return {
          success: true,
          httpStatus: res.status,
          message: `Conexión Telnyx "${data.data.connection_name}" verificada y activa.`,
          connectionData: data.data,
        };
      }

      const errorDetail =
        data.errors?.[0]?.detail ||
        data.errors?.[0]?.title ||
        `Respuesta inesperada (${res.status})`;
      return {
        success: false,
        httpStatus: res.status,
        message: `Telnyx API rechazó la conexión: ${errorDetail}`,
        connectionData: data,
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 500,
        message: `Error de red al conectar con Telnyx API: ${err.message || 'Error desconocido'}`,
      };
    }
  }

  /**
   * Fetches active phone numbers (DIDs) available in the Telnyx account
   */
  public static async getAccountPhoneNumbers(): Promise<{
    success: boolean;
    numbers: Array<{
      id: string;
      phone_number: string;
      status: string;
      connection_id?: string;
    }>;
    message?: string;
  }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, numbers: [], message: 'TELNYX_API_KEY no configurada.' };
    }

    try {
      const res = await fetch(
        'https://api.telnyx.com/v2/phone_numbers?filter[status]=active&page[size]=50',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          numbers: [],
          message: `Error Telnyx (${res.status}): ${errorText}`,
        };
      }

      const json = await res.json();
      const numbers = (json.data || []).map((item: any) => ({
        id: item.id,
        phone_number: item.phone_number,
        status: item.status,
        connection_id: item.connection_id,
      }));

      return { success: true, numbers };
    } catch (err: any) {
      return { success: false, numbers: [], message: err.message };
    }
  }
}
