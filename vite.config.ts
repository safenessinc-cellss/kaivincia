import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv, Plugin} from 'vite';
import path from 'path';

function telnyxDevApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'telnyx-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || (!req.url.startsWith('/api/telnyx') && !req.url.startsWith('/api/meta'))) {
          return next();
        }

        // Ensure env variables are present in process.env
        if (env.TELNYX_API_KEY) process.env.TELNYX_API_KEY = env.TELNYX_API_KEY;
        if (env.TELNYX_CONNECTION_ID) process.env.TELNYX_CONNECTION_ID = env.TELNYX_CONNECTION_ID;
        if (env.META_APP_ID) process.env.META_APP_ID = env.META_APP_ID;
        if (env.META_APP_SECRET) process.env.META_APP_SECRET = env.META_APP_SECRET;
        if (env.META_VERIFY_TOKEN) process.env.META_VERIFY_TOKEN = env.META_VERIFY_TOKEN;
        if (env.WHATSAPP_PHONE_NUMBER_ID) process.env.WHATSAPP_PHONE_NUMBER_ID = env.WHATSAPP_PHONE_NUMBER_ID;
        if (env.WHATSAPP_BUSINESS_ACCOUNT_ID) process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        if (env.FACEBOOK_PAGE_ID) process.env.FACEBOOK_PAGE_ID = env.FACEBOOK_PAGE_ID;
        if (env.FACEBOOK_PAGE_ACCESS_TOKEN) process.env.FACEBOOK_PAGE_ACCESS_TOKEN = env.FACEBOOK_PAGE_ACCESS_TOKEN;
        if (env.INSTAGRAM_ACCOUNT_ID) process.env.INSTAGRAM_ACCOUNT_ID = env.INSTAGRAM_ACCOUNT_ID;
        if (env.INSTAGRAM_ACCESS_TOKEN) process.env.INSTAGRAM_ACCESS_TOKEN = env.INSTAGRAM_ACCESS_TOKEN;

        const { TelnyxBackendService } = await import('./server/telnyxBackend');
        const url = new URL(req.url, 'http://localhost:3000');
        const pathname = url.pathname;

        res.setHeader('Content-Type', 'application/json');

        if (pathname === '/api/meta-config') {
          const { default: metaConfigHandler } = await import('./api/meta-config.js');
          return metaConfigHandler(req, res);
        }

        if (pathname === '/api/meta-send') {
          const { default: metaSendHandler } = await import('./api/meta-send.js');
          return metaSendHandler(req, res);
        }

        if (pathname === '/api/meta-webhook') {
          const { default: metaWebhookHandler } = await import('./api/meta-webhook.js');
          return metaWebhookHandler(req, res);
        }

        if (pathname === '/api/meta-test') {
          const { default: metaTestHandler } = await import('./api/meta-test.js');
          return metaTestHandler(req, res);
        }

        if (pathname === '/api/telnyx/config' || pathname === '/api/telnyx-config') {
          const { default: telnyxConfigHandler } = await import('./api/telnyx/config.js');
          return telnyxConfigHandler(req, res);
        }

        if (pathname === '/api/telnyx/webhook') {
          const { default: telnyxWebhookHandler } = await import('./api/telnyx/webhook.js');
          return telnyxWebhookHandler(req, res);
        }

        if (pathname === '/api/telnyx-test' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const connectionId = body?.connectionId || process.env.TELNYX_CONNECTION_ID || '';
              const result = await TelnyxBackendService.testConnection(connectionId);
              res.statusCode = result.httpStatus >= 200 && result.httpStatus < 300 ? 200 : result.httpStatus;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        if (pathname === '/api/telnyx-token' && req.method === 'GET') {
          try {
            const authHeader = req.headers['authorization'] || '';
            const authUser = await TelnyxBackendService.verifyAuthToken(authHeader as string);
            
            // In dev mode, if agent is testing without a full Google token, accept dev fallback
            const uid = authUser?.uid || (req.headers['x-dev-uid'] as string) || 'dev-agent-01';

            const connectionId = url.searchParams.get('connectionId') || process.env.TELNYX_CONNECTION_ID || '';
            const credential = await TelnyxBackendService.getOrCreateTelephonyCredential(uid, connectionId);
            const token = await TelnyxBackendService.generateAgentJwt(credential.id);

            res.statusCode = 200;
            res.end(JSON.stringify({
              token,
              sipUsername: credential.sip_username,
              credentialId: credential.id,
              connectionId,
              allowedNumbers: []
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (pathname === '/api/telnyx-numbers' && req.method === 'GET') {
          try {
            const result = await TelnyxBackendService.getAccountPhoneNumbers();
            res.statusCode = result.success ? 200 : 400;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, numbers: [], message: err.message }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), telnyxDevApiPlugin(env)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
