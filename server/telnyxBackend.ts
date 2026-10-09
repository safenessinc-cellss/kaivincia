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
// Inicializar Firebase Admin (una sola vez por instancia)
// ============================================================
let firebaseInitError: string | null = null;

if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!raw) {
      firebaseInitError = 'FIREBASE_SERVICE_ACCOUNT_KEY no está configurada en Vercel';
      console.error('[Firebase Admin] ❌', firebaseInitError);
    } else {
      console.log('[Firebase Admin] Variable encontrada, longitud:', raw.length);
      console.log('[Firebase Admin] Primeros 50 caracteres:', raw.substring(0, 50));

      let parsed: any;
      try {
        // Caso 1: JSON completo con \n reales
        parsed = JSON.parse(raw);
      } catch (e1) {
        // Caso 2: JSON con \n escapados (formato típico de Vercel)
        try {
          parsed = JSON.parse(raw.replace(/\\n/g, '\n'));
        } catch (e2) {
          throw new Error(
            `No se pudo parsear el JSON. Error: ${(e2 as Error).message}`
          );
        }
      }

      // Validar que tenga los campos mínimos
      if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        throw new Error(
          'JSON inválido: faltan project_id, client_email o private_key'
        );
      }

      // Restaurar los \n de la private_key si están escapados
      if (parsed.private_key.includes('\\n')) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });

      console.log('[Firebase Admin] ✅ Inicializado correctamente');
      console.log('[Firebase Admin] Proyecto:', parsed.project_id);
      console.log('[Firebase Admin] Service account:', parsed.client_email);
    }
  } catch (err: any) {
    firebaseInitError = err.message || 'Error desconocido';
    console.error('[Firebase Admin] ❌ Error al inicializar:', err);
  }
}

/**
 * Backend Service for Telnyx Voice & WebRTC
 */
export class TelnyxBackendService {
  private static getApiKey(): string {
    const key = process.env.TELNYX_API_KEY || '';
    if (!key) {
      console.warn(
        '[Telnyx Backend] Warning: TELNYX_API_KEY environment variable is not defined.'
      );
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
    // Diagnóstico 1: ¿Llegó el header?
    if (!authHeader) {
      console.warn('[verifyAuthToken] ❌ No llegó header Authorization');
      return null;
    }

    console.log(
      '[verifyAuthToken] Header recibido:',
      authHeader.substring(0, 30) + '...'
    );

    if (!authHeader.startsWith('Bearer ')) {
      console.warn('[verifyAuthToken] ❌ Formato incorrecto (no empieza con Bearer)');
      return null;
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      console.warn('[verifyAuthToken] ❌ Token vacío');
      return null;
    }

    // Diagnóstico 2: ¿Se inicializó Firebase Admin?
    if (!admin.apps.length) {
      console.error(
        '[verifyAuthToken] ❌ Firebase Admin NO inicializado. Causa:',
        firebaseInitError
      );
      return null;
    }

    // Diagnóstico 3: Intentar verificar el token
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      console.log('[verifyAuthToken] ✅ Token válido. UID:', decoded.uid);
      return {
        uid: decoded.uid,
        email: decoded.email,
      };
    } catch (err: any) {
      console.error('[verifyAuthToken] ❌ verifyIdToken falló:', {
        code: err.code,
        message: err.message,
      });
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

    const listRes = await fetch(
      'https://api.telnyx.com/v2/telephony_credentials',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

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

    const createRes = await fetch(
      'https://api.telnyx.com/v2/telephony_credentials',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_id: connId,
          name: `kaivincia-agent-${uid}`,
        }),
      }
    );

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
      throw new Error(
        `Error generando JWT de Telnyx (${tokenRes.status}): ${text}`
      );
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
        message: `Error de red al conectar con Telnyx API: ${
          err.message || 'Error desconocido'
        }`,
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
      return {
        success: false,
        numbers: [],
        message: 'TELNYX_API_KEY no configurada.',
      };
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
