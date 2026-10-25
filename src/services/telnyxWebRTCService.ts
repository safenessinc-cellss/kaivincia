/**
 * Telnyx WebRTC SDK Client Service
 * Gestiona la inicialización de TelnyxRTC mediante JWT (login_token)
 * Documentación oficial: https://developers.telnyx.com/docs/webrtc
 */

import { auth } from '../firebase';

// Token JWT por defecto para inicialización del SDK de Telnyx WebRTC
export let TELNYX_WEBRTC_LOGIN_TOKEN = '';


/**
 * E.164 valida el formato, no la autorización del número en Telnyx.
 * Rechaza números de ejemplo reservados por NANP (555-0100..0199).
 */
export function validateTelnyxCallerId(value: unknown): string {
  const raw = String(value ?? '').trim();
  const normalized = raw.replace(/[\s().-]/g, '');
  if (!normalized || !/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error('Tu Caller ID no está configurado correctamente, contacta con el administrador. Debe ser un número E.164 autorizado.');
  }
  if (normalized === '+13055550199' || /^\+1\d{3}55501\d{2}$/.test(normalized)) {
    throw new Error('El Caller ID configurado es un número de prueba y no puede utilizarse para llamadas reales. Contacta con el administrador.');
  }
  return normalized;
}

export interface TelnyxWebRTCState {
  isInitialized: boolean;
  isConnected: boolean;
  loginToken: string;
  activeCallId: string | null;
  lastError: string | null;
}

class TelnyxWebRTCService {
  private client: any = null;
  private currentCall: any = null;
  private initializingToken: string | null = null;
  private initializedToken: string | null = null;
  private state: TelnyxWebRTCState = {
    isInitialized: false,
    isConnected: false,
    loginToken: TELNYX_WEBRTC_LOGIN_TOKEN,
    activeCallId: null,
    lastError: null
  };

  private listeners: Array<(state: TelnyxWebRTCState) => void> = [];
  private callUpdateListeners: Array<(call: any) => void> = [];

  constructor() {}

  /**
   * Mantiene el JWT solo en memoria del cliente. Los tokens WebRTC son credenciales
   * de sesión y no deben escribirse en documentos Firestore compartidos.
   */
  public async setLoginToken(newJwt: string, _persistToFirestore = false): Promise<void> {
    const cleanToken = (newJwt || '').trim();
    if (!cleanToken) throw new Error('El token WebRTC está vacío.');
    if (cleanToken !== this.state.loginToken) {
      this.state.loginToken = cleanToken;
      TELNYX_WEBRTC_LOGIN_TOKEN = cleanToken;
      this.notify();
    }
  }

  /**
   * Solicita un nuevo JWT renovado al backend (/api/telnyx-token)
   */
  public async fetchFreshTokenFromBackend(): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const currentUser = auth.currentUser;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }
      }

      const res = await fetch('/api/telnyx-token', { headers });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data.token) {
        await this.setLoginToken(data.token, false);
        await this.initClient(data.token);
        return {
          success: true,
          token: data.token,
          message: 'Nuevo login_token JWT obtenido y aplicado en el cliente Telnyx.'
        };
      }

      return {
        success: false,
        message: 'Respuesta del backend sin token.'
      };
    } catch (err: any) {
      console.error('[TelnyxWebRTC] Error solicitando token del backend:', err);
      return {
        success: false,
        message: err.message || 'Error al conectar con /api/telnyx-token'
      };
    }
  }

  /**
   * Obtiene el estado actual
   */
  public getState(): TelnyxWebRTCState {
    return { ...this.state };
  }

  /**
   * Obtiene el login_token actual
   */
  public getLoginToken(): string {
    return this.state.loginToken || TELNYX_WEBRTC_LOGIN_TOKEN;
  }

  /**
   * Inicializa el cliente TelnyxRTC con el login_token especificado
   */
  public async initClient(tokenOverride?: string): Promise<{ success: boolean; message: string }> {
    const token = (tokenOverride || this.getLoginToken()).trim();
    if (!token) {
      const errMsg = 'No se ha configurado login_token (JWT) para el SDK de Telnyx WebRTC.';
      this.state.lastError = errMsg;
      this.notify();
      return { success: false, message: errMsg };
    }

    if (this.initializingToken === token) {
      return { success: true, message: 'La conexión Telnyx ya se está inicializando.' };
    }
    if (this.initializedToken === token && this.client && this.state.isConnected) {
      return { success: true, message: 'El cliente Telnyx ya está conectado.' };
    }

    const TelnyxRTCClass = (window as any).TelnyxRTC;
    if (!TelnyxRTCClass) {
      this.state.isConnected = false;
      this.state.isInitialized = false;
      this.state.lastError = 'No se encontró el SDK TelnyxRTC en el navegador.';
      this.notify();
      return { success: false, message: this.state.lastError };
    }

    this.initializingToken = token;
    const previousClient = this.client;
    this.client = null;
    this.state.isConnected = false;
    this.state.isInitialized = false;
    this.initializedToken = null;
    try {
      if (previousClient) {
        try { previousClient.disconnect(); } catch {}
      }

      const client = new TelnyxRTCClass({ login_token: token });
      this.client = client;
      const isCurrent = () => this.client === client;
      client.on('telnyx.ready', () => {
        if (!isCurrent()) return;
        this.initializedToken = token;
        this.state.isConnected = true;
        this.state.isInitialized = true;
        this.state.lastError = null;
        this.notify();
      });
      client.on('telnyx.error', (error: any) => {
        if (!isCurrent()) return;
        this.state.isConnected = false;
        this.state.lastError = error?.message || 'Error en conexión Telnyx WebRTC';
        this.notify();
      });
      client.on('telnyx.notification', (notification: any) => {
        if (!isCurrent()) return;
        if (notification?.type === 'callUpdate' && notification?.call) {
          this.callUpdateListeners.forEach(listener => {
            try { listener(notification.call); } catch {}
          });
        }
        if (notification?.type === 'error') {
          this.state.lastError = notification?.message || 'Notificación de error Telnyx';
          this.notify();
        }
      });
      client.connect();
      return { success: true, message: 'Inicialización de Telnyx WebRTC solicitada.' };
    } catch (err: any) {
      this.state.lastError = err?.message || 'Error desconocido al inicializar Telnyx';
      this.state.isConnected = false;
      this.state.isInitialized = false;
      this.notify();
      return { success: false, message: this.state.lastError };
    } finally {
      if (this.initializingToken === token) this.initializingToken = null;
    }
  }

  /**
   * Realiza una llamada saliente mediante Telnyx WebRTC
   */
  public async makeCall(destinationNumber: string, callerIdNumber: string): Promise<any> {
    const normalizedDestination = String(destinationNumber || '').trim().replace(/[\s().-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedDestination)) {
      throw new Error('Introduce un número de destino válido en formato internacional E.164 (con +).');
    }

    // Caller ID explícito y validado; nunca usar un fallback genérico.
    const normalizedCallerId = validateTelnyxCallerId(callerIdNumber);

    if (!this.client || !this.state.isConnected) {
      throw new Error('Telnyx WebRTC no está conectado. No se puede iniciar la llamada.');
    }
    if (typeof this.client.newCall !== 'function') {
      throw new Error('El SDK Telnyx cargado no admite llamadas salientes mediante newCall().');
    }

    const options: Record<string, string> = {
      destinationNumber: normalizedDestination,
      callerNumber: normalizedCallerId
    };
    const call = this.client.newCall(options);
    if (!call) throw new Error('Telnyx no creó el objeto de llamada.');
    this.currentCall = call;
    this.state.activeCallId = call.id || call.callID || null;
    this.notify();
    return call;
  }

  /**
   * Cuelga la llamada activa
   */
  public hangup(): void {
    if (this.currentCall?.hangup) {
      try { this.currentCall.hangup(); } catch {}
    }
    this.currentCall = null;
    this.state.activeCallId = null;
    this.notify();
  }

  public subscribeCallUpdates(listener: (call: any) => void): () => void {
    this.callUpdateListeners.push(listener);
    return () => {
      this.callUpdateListeners = this.callUpdateListeners.filter(item => item !== listener);
    };
  }

  public subscribe(listener: (state: TelnyxWebRTCState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }
}

export const telnyxWebRTCService = new TelnyxWebRTCService();

export const updateTelnyxLoginToken = (jwt: string, persistToFirestore = true) => {
  return telnyxWebRTCService.setLoginToken(jwt, persistToFirestore);
};
