import { TelnyxBackendService } from '../server/telnyxBackend.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
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
    // ============================================================
    // DIAGNÓSTICO 1: ¿Llega el header?
    // ============================================================
    const authHeader =
      req.headers['authorization'] || req.headers['Authorization'];

    console.log(
      '[telnyx-numbers] Auth header:',
      authHeader ? `${String(authHeader).substring(0, 40)}...` : 'AUSENTE'
    );
    console.log(
      '[telnyx-numbers] Tipo de authHeader:',
      typeof authHeader
    );

    if (!authHeader) {
      console.error('[telnyx-numbers] ❌ No hay header Authorization');
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          numbers: [],
          error: 'Falta header Authorization',
        })
      );
      return;
    }

    // ============================================================
    // DIAGNÓSTICO 2: ¿Existe el servicio?
    // ============================================================
    console.log(
      '[telnyx-numbers] TelnyxBackendService:',
      typeof TelnyxBackendService,
      TelnyxBackendService ? '✅ existe' : '❌ undefined'
    );

    if (!TelnyxBackendService) {
      console.error('[telnyx-numbers] ❌ TelnyxBackendService no importado');
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          numbers: [],
          error: 'Error de importación del servicio',
        })
      );
      return;
    }

    // ============================================================
    // DIAGNÓSTICO 3: Verificar token
    // ============================================================
    console.log('[telnyx-numbers] Llamando a verifyAuthToken...');
    const authUser = await TelnyxBackendService.verifyAuthToken(
      authHeader as string
    );

    console.log(
      '[telnyx-numbers] Resultado verifyAuthToken:',
      authUser ? `✅ uid=${authUser.uid}` : '❌ null'
    );

    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          numbers: [],
          error: 'No autorizado. Token de Firebase inválido o ausente.',
        })
      );
      return;
    }

    // ============================================================
    // Obtener números
    // ============================================================
    const result = await TelnyxBackendService.getAccountPhoneNumbers();
    res.statusCode = result.success ? 200 : 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    console.error('[telnyx-numbers] ❌ Error inesperado:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        numbers: [],
        error: err.message || 'Error al obtener números',
      })
    );
  }
}
