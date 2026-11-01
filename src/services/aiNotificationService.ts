import { requestGemini } from './geminiApi';

export enum NotificationTrigger {
  MORA_ALTA = 'MORA_ALTA',
  NUEVA_TAREA = 'NUEVA_TAREA',
  STATUS_COTIZACION = 'STATUS_COTIZACION'
}

export interface GeneratedNotification {
  subject: string;
  html_body: string;
  priority: 'alta' | 'media' | 'baja';
}

/**
 * Generates a notification draft through the authenticated server endpoint.
 * The result is a preview only; this function does not send or publish it.
 */
export async function generateNotification(params: {
  trigger: NotificationTrigger;
  data: Record<string, unknown>;
}): Promise<GeneratedNotification> {
  return requestGemini<GeneratedNotification>('notification', {
    trigger: params.trigger,
    data: params.data
  });
}
