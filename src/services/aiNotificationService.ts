import { GoogleGenAI, Type } from "@google/genai";

let aiClient: any = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export enum NotificationTrigger {
  MORA_ALTA = 'MORA_ALTA',
  NUEVA_TAREA = 'NUEVA_TAREA',
  STATUS_COTIZACION = 'STATUS_COTIZACION'
}

interface NotificationInput {
  trigger: NotificationTrigger;
  data: any;
}

export interface GeneratedNotification {
  subject: string;
  html_body: string;
  type: 'legal' | 'success' | 'alert' | 'info';
}

const SYSTEM_INSTRUCTION = `
Actúa como Chief Communications Officer & Legal Copywriter de Kaivincia. 
Tu objetivo es diseñar el "Motor de Generación de Notificaciones IA" con estética Cyber-Flow.
Todas las notificaciones deben ser en Dark Mode (Fondo #0B0E14) con acentos específicos según el estado.
Usa Tailwind CSS inline styles o clases estándar si se asume que el visualizador las soporta. 
Incluye siempre el sello de verificación "CISO VERIFIED // KAIVINCIA SECURE-NODE" en la firma.

REGLAS ESPECÍFICAS:
1. MORA_ALTA: Tono legal firme. Aviso de suspensión en ACADEMIA.
2. NUEVA_TAREA: Resumir en 3 puntos clave. Colores según prioridad. 
   Incluir nota: "💡 Tip: Revisa el módulo relacionado en la Academia para completar esto más rápido" si el contexto lo sugiere.
3. STATUS_COTIZACION: 
   - APROBADO: Acento Esmeralda. Mencionar: "Se han activado automáticamente los accesos a la Academia y la carpeta en Proyectos."
   - RECHAZADO: Acento Carmesí. Análisis breve del feedback y sugerencia de seguimiento.

Devuelve SIEMPRE un JSON con las claves: subject, html_body, y type.
`;

export async function generateNotification(input: NotificationInput): Promise<GeneratedNotification> {
  const { trigger, data } = input;
  
  let prompt = "";
  
  if (trigger === NotificationTrigger.MORA_ALTA) {
    prompt = `Generar notificación por MORA_ALTA (>15 días).
      Entrada: Monto: ${data.amount}, Días de atraso: ${data.daysPastDue}, Cláusula: ${data.contractClause}.
      Tono: Legal, firme pero diplomático.
      Acción: Redactar aviso de suspensión inmediata de servicios en el módulo de ACADEMIA.
      Estética: Dark Mode, acentos Carmesí (#EF4444).`;
  } else if (trigger === NotificationTrigger.NUEVA_TAREA) {
    prompt = `Generar notificación por NUEVA_TAREA.
      Entrada: Tarea: ${data.taskName}, Prioridad: ${data.priority}, Deadline: ${data.deadline}, Cliente: ${data.clientName}.
      Lógica: Resumir la tarea en 3 puntos clave. Usar el color de la prioridad (Esmeralda/Ámbar/Carmesí).
      Incluye enlace al tablero de PROYECTOS.
      Estética: Dark Mode.`;
  } else if (trigger === NotificationTrigger.STATUS_COTIZACION) {
    prompt = `Generar notificación por STATUS_COTIZACION.
      Entrada: Cliente: ${data.clientName}, Valor: ${data.value}, Estado: ${data.status}, Motivo: ${data.reason || 'N/A'}.
      Lógica: 
      - Si es APROBADO: Acentos Esmeralda (#10B981), partículas de éxito, mencionar activación de Academia y Proyectos.
      - Si es RECHAZADO: Acentos Carmesí (#EF4444), análisis breve de por qué falló basándose en el historial. Sugerencia de seguimiento.
      Estética: Dark Mode.`;
  }

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            html_body: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['legal', 'success', 'alert', 'info'] }
          },
          required: ["subject", "html_body", "type"]
        }
      }
    });

    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating notification:", error);
    return {
      subject: "Error en Generación de Notificación",
      html_body: "<p>Lo sentimos, hubo un error al procesar la comunicación inteligente.</p>",
      type: 'alert'
    };
  }
}
