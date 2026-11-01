import metaConfigHandler from '../server/api-handlers/meta-config.js';
import metaSendHandler from '../server/api-handlers/meta-send.js';
import metaTestHandler from '../server/api-handlers/meta-test.js';
import metaWebhookHandler from '../server/api-handlers/meta-webhook.js';

export const config = { api: { bodyParser: false } };

const handlers: Record<string, (req: any, res: any) => Promise<void>> = {
  'meta-config': metaConfigHandler,
  'meta-send': metaSendHandler,
  'meta-test': metaTestHandler,
  'meta-webhook': metaWebhookHandler,
};

export default async function handler(req: any, res: any) {
  const url = new URL(req.url || '/', 'http://localhost');
  const endpoint = String(req.query?.endpoint || url.searchParams.get('endpoint') || '');
  const selected = handlers[endpoint];

  if (!selected) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, error: 'Unknown Meta API endpoint.' }));
    return;
  }

  try {
    await selected(req, res);
  } catch (error) {
    console.error('[Meta API dispatcher] Unhandled error:', error);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Internal Meta API error.' }));
    }
  }
}
