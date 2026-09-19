import type { IncomingMessage, ServerResponse } from 'http';
import { TelnyxBackendService } from '../server/telnyxBackend';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const authUser = await TelnyxBackendService.verifyAuthToken(authHeader as string);

    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'No autorizado. Se requiere token de Firebase en el header Authorization.' 
      }));
      return;
    }

    const connectionId = (req.query?.connectionId as string) || process.env.TELNYX_CONNECTION_ID || '';

    // 1. Get or create Telephony Credential for this user
    const credential = await TelnyxBackendService.getOrCreateTelephonyCredential(authUser.uid, connectionId);

    // 2. Generate 24h JWT token for WebRTC
    const token = await TelnyxBackendService.generateAgentJwt(credential.id);

    // 3. Return payload to frontend (API Key remains 100% hidden in backend)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      token,
      sipUsername: credential.sip_username,
      credentialId: credential.id,
      connectionId: connectionId,
      allowedNumbers: []
    }));
  } catch (err: any) {
    console.error('[API /api/telnyx-token] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: err.message || 'Error interno al generar credenciales de Telnyx' 
    }));
  }
}
