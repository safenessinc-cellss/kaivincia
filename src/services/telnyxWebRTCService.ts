/**
 * Telnyx WebRTC SDK Client Service
 * Gestiona la inicialización de TelnyxRTC mediante JWT (login_token)
 * Documentación oficial: https://developers.telnyx.com/docs/webrtc
 */

import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TelnyxRTC } from '@telnyx/webrtc';

// Token JWT por defecto para inicialización del SDK de Telnyx WebRTC
export let TELNYX_WEBRTC_LOGIN_TOKEN = '';

export interface TelnyxWebRTCState {
  isInitialized: boolean;
  isConnected: boolean;
  loginToken: string;
  canMakeOutbound: boolean;
  canReceiveInbound: boolean;
  activeCallId: string | null;
  lastError: string | null;
}

class TelnyxWebRTCService {
  private client: any = null;
  private currentCall: any = null;
  private tokenRequestVersion = 0;
  private state: TelnyxWebRTCState = {
    isInitialized: false,
    isConnected: false,
    loginToken: TELNYX_WEBRTC_LOGIN_TOKEN,
    canMakeOutbound: false,
    canReceiveInbound: false,
    activeCallId: null,
    lastError: null
  };

  private listeners: Array<(state: TelnyxWebRTCState) => void> = [];

  constructor() {
    // WebRTC JWTs are issued per authenticated operator by /api/telnyx-token.
    // Never hydrate a shared login token into another user's browser session.
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
      const requestVersion = ++this.tokenRequestVersion;
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Debes iniciar sesión para generar un token VoIP individual.');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await currentUser.getIdToken()}`
      };

      const res = await fetch('/api/telnyx-token', { headers });
      const data = await res.json();

      if (!res.ok || data.error) {
        if (res.status === 401 || res.status === 403) this.clearSession();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Ignore responses from an earlier account/session or a superseded request.
      if (requestVersion !== this.tokenRequestVersion || auth.currentUser?.uid !== currentUser.uid) {
        return { success: false, message: 'La sesión cambió; solicita un nuevo token para el operador actual.' };
      }

      if (data.token) {
        // Per-operator JWTs stay in memory and are never written to the shared
        // settings/telnyx_config document.
        this.state.canMakeOutbound = data.permissions?.outbound === true;
        this.state.canReceiveInbound = data.permissions?.inbound === true;
        await this.setLoginToken(data.token, false);
        if (this.client?.updateToken && this.state.isInitialized) {
          this.client.updateToken(data.token);
        } else {
          await this.initClient(data.token);
        }
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

      // Desconectar cliente existente antes de crear uno nuevo
      if (this.client) {
        try { this.client.disconnect(); } catch {}
      }

      // Crear cliente usando el SDK importado desde @telnyx/webrtc
      this.client = new TelnyxRTC({
        login_token: token,
        debug: true,
        debugOutput: 'socket',
        ringbackFile: '/sounds/ringback.mp3',
        ringtoneFile: '/sounds/ringtone.mp3'
      });

      this.client.on('telnyx.ready', () => {
        console.log('[TelnyxWebRTC] ✅ Cliente conectado y listo.');
        this.state.isConnected = true;
        this.state.isInitialized = true;
        this.state.lastError = null;
        this.notify();
      });

      const clientForSession = this.client;
      clientForSession.on('telnyx.warning', async (warning: any) => {
        if (warning?.code === 34001) {
          console.log('[TelnyxWebRTC] 🔄 Token por expirar, renovando automáticamente...');
          try {
            const { getAuth } = await import('firebase/auth');
            const user = getAuth().currentUser;
            if (!user) throw new Error('No hay usuario autenticado');
            const firebaseToken = await user.getIdToken();

            const res = await fetch('/api/telnyx-token', {
              headers: { 'Authorization': `Bearer ${firebaseToken}` },
            });
            if (!res.ok) throw new Error(`Backend respondió ${res.status}`);
            const data = await res.json();
            const newToken = data.token;
            if (!newToken) throw new Error('Respuesta sin token');
            if (this.client !== clientForSession || auth.currentUser?.uid !== user.uid) return;

            this.state.canMakeOutbound = data.permissions?.outbound === true;
            this.state.canReceiveInbound = data.permissions?.inbound === true;
            await this.setLoginToken(newToken, false);
            clientForSession.updateToken(newToken);
            console.log('[TelnyxWebRTC] ✅ Token renovado correctamente');
          } catch (err: any) {
            console.error('[TelnyxWebRTC] ❌ Fallo al renovar token:', err.message);
            try { this.client?.disconnect(); } catch {}
            this.state.isConnected = false;
            this.state.canMakeOutbound = false;
            this.state.canReceiveInbound = false;
            this.state.lastError = 'Sesión expirada. Vuelve a autenticarte.';
            this.notify();
          }
        }
      });

      this.client.on('telnyx.error', (error: any) => {
        console.error('[TelnyxWebRTC] ❌ Error en cliente:', error);
        this.state.lastError = error?.message || 'Error en conexión Telnyx WebRTC';
        this.notify();
      });

      this.client.on('telnyx.notification', (notification: any) => {
        console.log('[TelnyxWebRTC] Notificación:', notification);
        if (notification?.call) {
          this.state.activeCallId = notification.call.id;
          this.notify();
        }
      });

      this.client.connect();

      return {
        success: true,
        message: 'SDK de Telnyx WebRTC inicializado correctamente con el nuevo login_token.'
      };
    } catch (err: any) {
      console.error('[TelnyxWebRTC] ❌ Error inicializando SDK:', err);
      this.state.lastError = err?.message || 'Error desconocido al inicializar Telnyx';
      this.notify();
      return { success: false, message: err?.message || 'Error al inicializar cliente' };
    }
  }

  /**
   * Realiza una llamada saliente mediante Telnyx WebRTC
   * Incluye remoteElement para reproducir el audio del otro lado
   */
  public async makeCall(destinationNumber: string, callerIdNumber?: string): Promise<any> {
    if (!this.state.loginToken) {
      throw new Error('Falta el login_token de Telnyx WebRTC.');
    }

    console.log(`[TelnyxWebRTC] Iniciando llamada a ${destinationNumber} con Caller ID ${callerIdNumber || 'default'}`);

    if (!this.client?.newCall) {
      throw new Error('El cliente TelnyxRTC no está inicializado. Ve a la pestaña de configuración del softphone y pulsa "Configurar JWT" para autenticarte con Telnyx.');
    }

    // Crear la llamada con remoteElement para reproducir el audio entrante
    this.currentCall = this.client.newCall({
      destinationNumber: destinationNumber,
      callerNumber: callerIdNumber,
      remoteElement: 'remote-audio'
    });

    console.log('[TelnyxWebRTC] Llamada creada:', this.currentCall);

    // Guardar el ID de la llamada activa
    if (this.currentCall?.id) {
      this.state.activeCallId = this.currentCall.id;
      this.notify();
    }

    return this.currentCall;
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

  /** Disconnects and clears all in-memory credentials when the operator changes. */
  public clearSession(): void {
    this.tokenRequestVersion += 1;
    try { this.currentCall?.hangup?.(); } catch {}
    try { this.client?.disconnect?.(); } catch {}
    this.currentCall = null;
    this.client = null;
    TELNYX_WEBRTC_LOGIN_TOKEN = '';
    this.state = {
      isInitialized: false,
      isConnected: false,
      loginToken: '',
      canMakeOutbound: false,
      canReceiveInbound: false,
      activeCallId: null,
      lastError: null
    };
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

export const updateTelnyxLoginToken = (jwt: string, persistToFirestore = false) => {
  return telnyxWebRTCService.setLoginToken(jwt, persistToFirestore);
};