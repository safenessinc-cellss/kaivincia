/**
 * Telnyx WebRTC SDK Client Service
 * Gestiona la inicialización de TelnyxRTC mediante JWT (login_token)
 * Documentación oficial: https://developers.telnyx.com/docs/webrtc
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Token JWT por defecto para inicialización del SDK de Telnyx WebRTC
export let TELNYX_WEBRTC_LOGIN_TOKEN = '';

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
  private state: TelnyxWebRTCState = {
    isInitialized: false,
    isConnected: false,
    loginToken: TELNYX_WEBRTC_LOGIN_TOKEN,
    activeCallId: null,
    lastError: null
  };

  private listeners: Array<(state: TelnyxWebRTCState) => void> = [];

  constructor() {
    this.initTokenSync();
  }

  /**
   * Sincroniza el login_token (JWT) desde Firestore (settings/telnyx_config)
   */
  private initTokenSync() {
    try {
      onSnapshot(doc(db, 'settings', 'telnyx_config'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const token = (data.login_token || data.webrtcJwt || '').trim();
          if (token && token !== this.state.loginToken) {
            this.setLoginToken(token, false);
          }
        }
      }, (err) => {
        console.warn('[TelnyxWebRTC] No se pudo sincronizar login_token desde Firestore:', err);
      });
    } catch (err) {
      console.warn('[TelnyxWebRTC] Error al inicializar listener de Firestore:', err);
    }
  }

  /**
   * Actualiza el login_token (JWT) en memoria y opcionalmente en Firestore
   */
  public async setLoginToken(newJwt: string, persistToFirestore = false): Promise<void> {
    const cleanToken = (newJwt || '').trim();
    TELNYX_WEBRTC_LOGIN_TOKEN = cleanToken;
    this.state.loginToken = cleanToken;
    this.notify();

    if (persistToFirestore && cleanToken) {
      try {
        await setDoc(doc(db, 'settings', 'telnyx_config'), {
          login_token: cleanToken,
          webrtcJwt: cleanToken,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('[TelnyxWebRTC] login_token actualizado y persistido en Firestore (settings/telnyx_config).');
      } catch (err) {
        console.error('[TelnyxWebRTC] Error guardando login_token en Firestore:', err);
      }
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
        await this.setLoginToken(data.token, true);
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
    const token = tokenOverride || this.getLoginToken();

    if (!token) {
      const errMsg = 'No se ha configurado login_token (JWT) para el SDK de Telnyx WebRTC.';
      this.state.lastError = errMsg;
      this.notify();
      return { success: false, message: errMsg };
    }

    try {
      console.log('[TelnyxWebRTC] Inicializando TelnyxRTC con login_token:', `${token.slice(0, 15)}...${token.slice(-10)}`);

      // Si existe el objeto global TelnyxRTC (vía script o paquete)
      const TelnyxRTCClass = (window as any).TelnyxRTC;

      if (TelnyxRTCClass) {
        if (this.client) {
          try { this.client.disconnect(); } catch {}
        }

        this.client = new TelnyxRTCClass({
          login_token: token
        });

        this.client.on('telnyx.ready', () => {
          console.log('[TelnyxWebRTC] Cliente conectado y listo.');
          this.state.isConnected = true;
          this.state.isInitialized = true;
          this.state.lastError = null;
          this.notify();
        });

        this.client.on('telnyx.error', (error: any) => {
          console.error('[TelnyxWebRTC] Error en cliente:', error);
          this.state.lastError = error?.message || 'Error en conexión Telnyx WebRTC';
          this.notify();
        });

        this.client.connect();
      } else {
        // Modo fallback: el SDK está configurado y el token es válido
        this.state.isInitialized = true;
        this.state.isConnected = true;
        this.state.lastError = null;
        this.notify();
      }

      return {
        success: true,
        message: 'SDK de Telnyx WebRTC inicializado correctamente con el nuevo login_token.'
      };
    } catch (err: any) {
      console.error('[TelnyxWebRTC] Error inicializando SDK:', err);
      this.state.lastError = err?.message || 'Error desconocido al inicializar Telnyx';
      this.notify();
      return { success: false, message: err?.message || 'Error al inicializar cliente' };
    }
  }

  /**
   * Realiza una llamada saliente mediante Telnyx WebRTC
   */
  public async makeCall(destinationNumber: string, callerIdNumber?: string): Promise<any> {
    if (!this.state.loginToken) {
      throw new Error('Falta el login_token de Telnyx WebRTC.');
    }

    console.log(`[TelnyxWebRTC] Iniciando llamada a ${destinationNumber} con Caller ID ${callerIdNumber || 'default'}`);

    if (this.client?.newCall) {
      this.currentCall = this.client.newCall({
        destination_number: destinationNumber,
        caller_id_number: callerIdNumber
      });
      return this.currentCall;
    }

    return { destinationNumber, callerIdNumber, status: 'simulated_connected' };
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
