import { adminAuth } from '../../api/_lib/firebaseAdmin.js';

export interface TelnyxHandlerOptions {
  methods?: string[];
  requireAuth?: boolean;
}

export function withTelnyxHandler(
  handler: (req: any, res: any, authUser?: any) => Promise<void>,
  options: TelnyxHandlerOptions = {}
) {
  const { methods = ['GET'], requireAuth = true } = options;

  return async (req: any, res: any) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (!methods.includes(req.method)) {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    try {
      let authUser = null;
      if (requireAuth) {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Falta header Authorization' }));
          return;
        }
        authUser = await adminAuth.verifyIdToken(authHeader.replace('Bearer ', ''), true);
        if (!authUser?.uid) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Token inválido' }));
          return;
        }
      }

      await handler(req, res, authUser);
    } catch (err: any) {
      console.error('[telnyxHandler] Error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Error interno' }));
    }
  };
}
