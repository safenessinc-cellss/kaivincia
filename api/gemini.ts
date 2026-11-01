import { GoogleGenAI } from '@google/genai';
import { adminAuth, adminDb } from '../server/_lib/firebaseAdmin.js';

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type ResponseLike = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

const normalizeRole = (raw: unknown): string => {
  const role = String(raw || 'none').toLowerCase().trim();
  const aliases: Record<string, string> = {
    sales: 'agent', ventas: 'agent', tlmk: 'agent', telemarketing: 'agent',
    setter: 'agent', closer: 'agent', agente: 'agent', operador: 'agent',
    colaborador: 'collaborator', alumno: 'student', estudiante: 'student',
    cliente: 'user', usuario: 'user'
  };
  return aliases[role] || role;
};

const parseJson = (text: string): any => {
  const clean = text.trim().replace(/^\u0060\u0060\u0060(?:json)?\s*/i, '').replace(/\u0060\u0060\u0060\s*$/i, '').trim();
  return JSON.parse(clean);
};

const cleanText = (value: unknown, max = 1000): string =>
  String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

async function authenticate(req: RequestLike) {
  const rawHeader = req.headers.authorization;
  const header = Array.isArray(rawHeader) ? rawHeader[0] : String(rawHeader || '');
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw Object.assign(new Error('Autenticación requerida.'), { statusCode: 401 });

  const decoded = await adminAuth.verifyIdToken(token);
  const userSnapshot = await adminDb.collection('users').doc(decoded.uid).get();
  if (!userSnapshot.exists) throw Object.assign(new Error('Perfil de usuario no encontrado.'), { statusCode: 403 });

  const user = userSnapshot.data() || {};
  const role = normalizeRole(user.role);
  const status = String(user.status || '').toLowerCase();
  if (!['active', 'approved'].includes(status) && role !== 'superadmin') {
    throw Object.assign(new Error('La cuenta no está habilitada para usar IA.'), { statusCode: 403 });
  }
  return { uid: decoded.uid, role, status, user };
}

async function hasPermission(context: { uid: string; role: string; user: any }, permissionId: string, fallbackRoles: string[]) {
  const override = context.user.permissions?.[permissionId];
  if (typeof override === 'boolean') return override;

  const matrixSnapshot = await adminDb.collection('settings').doc('rbac_matrix').get();
  const matrix = matrixSnapshot.data()?.matrix || {};
  const roleMatrix = matrix[context.role] || (context.role === 'agent' ? matrix.sales : undefined);
  const value = roleMatrix?.[permissionId];
  if (typeof value === 'boolean') return value;
  return fallbackRoles.includes(context.role);
}

async function consumeDailyQuota(uid: string) {
  const date = new Date().toISOString().slice(0, 10);
  const ref = adminDb.collection('ai_usage').doc(uid);
  await adminDb.runTransaction(async (transaction: any) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data() || {};
    const count = current.date === date ? Number(current.count || 0) : 0;
    if (count >= 50) throw Object.assign(new Error('Límite diario de IA alcanzado. Inténtalo mañana.'), { statusCode: 429 });
    transaction.set(ref, { date, count: count + 1, updatedAt: new Date().toISOString() }, { merge: true });
  });
}

function sanitizeHtml(value: unknown) {
  return cleanText(value, 12000)
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<(?!\/?(?:p|br|strong|em|ul|ol|li|h[1-4])\b)[^>]*>/gi, '');
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Método no permitido.' }));
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw Object.assign(new Error('Servicio de IA no configurado en el servidor.'), { statusCode: 503 });

    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}) as Record<string, any>;
    const task = cleanText(body.task, 40);
    const context = await authenticate(req);
    await consumeDailyQuota(context.uid);
    const ai = new GoogleGenAI({ apiKey });

    if (task === 'client-import') {
      if (body.consent !== true) throw Object.assign(new Error('Se requiere consentimiento para enviar el texto a Gemini.'), { statusCode: 400 });
      const allowed = await hasPermission(context, 'client_base_global', ['superadmin', 'admin', 'ceo', 'gestor']);
      if (!allowed) throw Object.assign(new Error('No tienes permiso para importar clientes globales.'), { statusCode: 403 });
      const documentText = cleanText(body.textContent, 50000);
      if (!documentText) throw Object.assign(new Error('El documento no contiene texto válido.'), { statusCode: 400 });

      const prompt = `Extrae únicamente datos explícitos de clientes del siguiente documento. No inventes nombres, teléfonos, correos, importes, estados ni condiciones comerciales. Si un dato no aparece, devuelve cadena vacía o cero. Devuelve JSON con la clave "clients" y un máximo de 100 registros. Cada registro debe tener name, company, email, phone, sector, amount, status, billingModel y pipelineStage. status sólo puede ser "Activo", "En Riesgo", "Lead" o "Inactivo"; si no está explícito usa "Lead". billingModel sólo puede ser "Fijo", "Variable" o "Híbrido"; si no está explícito usa "Variable". pipelineStage si no está explícito usa "Contacto Inicial".\n\nDOCUMENTO:\n${documentText}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = parseJson(response.text || '{}');
      const clients = (Array.isArray(parsed.clients) ? parsed.clients : []).slice(0, 100).map((item: any) => ({
        name: cleanText(item.name, 150),
        company: cleanText(item.company, 150),
        email: cleanText(item.email, 254),
        phone: cleanText(item.phone, 50),
        sector: cleanText(item.sector, 80) || 'No especificado',
        amount: Number.isFinite(Number(item.amount)) && Number(item.amount) >= 0 ? Number(item.amount) : 0,
        status: ['Activo', 'En Riesgo', 'Lead', 'Inactivo'].includes(item.status) ? item.status : 'Lead',
        billingModel: ['Fijo', 'Variable', 'Híbrido'].includes(item.billingModel) ? item.billingModel : 'Variable',
        pipelineStage: cleanText(item.pipelineStage, 80) || 'Contacto Inicial'
      })).filter((item: any) => item.name);
      res.statusCode = 200;
      res.end(JSON.stringify({ clients }));
      return;
    }

    if (task === 'chat-suggestions' || task === 'chat-summary') {
      if (body.consent !== true) throw Object.assign(new Error('Se requiere consentimiento para procesar mensajes con Gemini.'), { statusCode: 400 });
      const messages = Array.isArray(body.messages) ? body.messages.slice(-20).map((item: any) => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        text: cleanText(item.text, 1200)
      })).filter((item: any) => item.text) : [];
      if (messages.length === 0) throw Object.assign(new Error('No hay mensajes válidos para analizar.'), { statusCode: 400 });

      if (task === 'chat-suggestions') {
        const prompt = `Eres un asistente de comunicación profesional. Sugiere exactamente 3 respuestas breves, claras y respetuosas para continuar esta conversación con ${cleanText(body.peerName, 100) || 'el contacto'}. No inventes hechos ni compromisos. Devuelve JSON: {"suggestions":["...","...","..."]}.\n\nCONVERSACIÓN:\n${messages.map((m: any) => `${m.role}: ${m.text}`).join('\n')}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
        const parsed = parseJson(response.text || '{}');
        const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3).map((value: unknown) => cleanText(value, 500)).filter(Boolean) : [];
        res.statusCode = 200;
        res.end(JSON.stringify({ suggestions }));
        return;
      }

      const prompt = `Resume esta conversación en español en máximo 120 palabras. Separa hechos confirmados, pendientes y compromisos; no inventes datos.\n\n${messages.map((m: any) => `${m.role}: ${m.text}`).join('\n')}`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      res.statusCode = 200;
      res.end(JSON.stringify({ summary: cleanText(response.text, 2000) }));
      return;
    }

    if (task === 'notification') {
      const trigger = cleanText(body.trigger, 40);
      if (!['MORA_ALTA', 'NUEVA_TAREA', 'STATUS_COTIZACION'].includes(trigger)) {
        throw Object.assign(new Error('Tipo de notificación no permitido.'), { statusCode: 400 });
      }
      const data = body.data && typeof body.data === 'object' ? body.data : {};
      const safeData = JSON.stringify(data).slice(0, 10000);
      const prompt = `Genera un borrador de notificación empresarial en español. No afirmes que una acción se ejecutó, que un usuario fue suspendido, que una cotización fue aprobada ni que un servicio fue activado si los datos no lo demuestran. No uses sellos de certificación, CISO ni garantías de seguridad. Devuelve JSON con subject, html_body y priority (alta|media|baja). Usa HTML sencillo: p, strong, em, ul, li, br.\nTIPO: ${trigger}\nDATOS: ${safeData}`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
      const parsed = parseJson(response.text || '{}');
      const result = {
        subject: cleanText(parsed.subject, 180),
        html_body: sanitizeHtml(parsed.html_body),
        priority: ['alta', 'media', 'baja'].includes(parsed.priority) ? parsed.priority : 'media'
      };
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return;
    }

    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Tarea de IA no reconocida.' }));
  } catch (error: any) {
    res.statusCode = Number(error?.statusCode) || 500;
    res.end(JSON.stringify({ error: error?.message || 'No se pudo completar la solicitud de IA.' }));
  }
}
