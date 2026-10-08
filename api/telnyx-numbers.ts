import { TelnyxBackendService } from '../server/telnyxBackend';

export default async function handler(req: any, res: any) {
  // ============================================================
  // CORS
  // ============================================================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Solo GET
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    // ============================================================
    // 1. Obtener el token de autorización (Firebase ID Token)
    // ============================================================
    const authHeader =
      req.headers['authorization'] || req.headers['Authorization'];

    // Log para depuración (no imprime el token completo por seguridad)
    console.log(
      '[API /api/telnyx-numbers] Auth header recibido:',
      authHeader ? `${String(authHeader).substring(0, 20)}...` : 'AUSENTE'
    );

    if (!authHeader) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          numbers: [],
          error: 'No autorizado. Falta el header Authorization.',
        })
      );
      return;
    }

    // ============================================================
    // 2. Verificar el token de Firebase
    // ============================================================
    const authUser = await TelnyxBackendService.verifyAuthToken(
      authHeader as string
    );

    if (!authUser?.uid) {
      console.warn('[API /api/telnyx-numbers] Token inválido o sin UID');
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

    console.log('[API /api/telnyx-numbers] Usuario autenticado:', authUser.uid);

    // ============================================================
    // 3. Obtener números desde Telnyx
    // ============================================================
    const result = await TelnyxBackendService.getAccountPhoneNumbers();

    // Si Telnyx devolvió un error (por ejemplo, API Key inválida),
    // devolvemos 400 con el detalle para poder depurar.
    if (!result.success) {
      console.error(
        '[API /api/telnyx-numbers] Error desde TelnyxBackendService:',
        result
      );
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          numbers: [],
          error: result.message || 'Error al obtener números de Telnyx',
          details: result,
        })
      );
      return;
    }

    // Éxito
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        numbers: result.numbers || result.data || [],
      })
    );
  } catch (err: any) {
    console.error('[API /api/telnyx-numbers] Error inesperado:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        numbers: [],
        error: err.message || 'Error al obtener números de Telnyx',
      })
    );
  }
}
