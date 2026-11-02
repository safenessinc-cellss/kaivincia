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
  private activeUid: string | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshInFlight: Promise<{ success: boolean; token?: string; message: string }> | null = null;
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

  /**
   * Actualiza el login_token (JWT) en memoria y opcionalmente en Firestore
   */
  public async setLoginToken(newJwt: string, persistToFirestore = false): Promise<void> {
    const cleanToken = (newJwt || '').trim();
    TELNYX_WEBRTC_LOGIN_TOKEN = cleanToken;
    this.state.loginToken = cleanToken;
    this.scheduleTokenRefresh(cleanToken);
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
    // Coalesce warning/timer/manual refresh requests into one backend request.
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.performTokenRefresh();
    try {
      return await this.refreshInFlight;
    } finally {
      this.refreshInFlight = null;
    }
  }

  private async performTokenRefresh(): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const requestVersion = ++this.tokenRequestVersion;
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Debes iniciar sesión para generar un token VoIP individual.');
      if (this.activeUid && this.activeUid !== currentUser.uid) {
        // Never carry a Telnyx session or JWT across Firebase identities.
        this.clearSession();
      }
      this.activeUid = currentUser.uid;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${await currentUser.getIdToken(true)}`
      };

      const res = await fetch('/api/telnyx-token', {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        if (res.status === 401 || res.status === 403) {
          // Authorization was denied by the trusted backend. Disable telephony
          // and clear only the Telnyx session; do not sign out Firebase globally.
          this.clearSession();
        }
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
        if (this.client?.login && this.state.isInitialized) {
          // TelnyxRTC SDK re-authenticates using login({ creds }); updateToken
          // is not part of the documented SDK interface.
          await this.client.login({ creds: { login_token: data.token } });
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
   * Programar renovación preventiva usando el exp del JWT.
   * Renueva 5 minutos antes de expirar; en caso de fallo transitorio,
   * reintenta en 60 segundos sin entrar en un bucle agresivo.
   */
  private scheduleTokenRefresh(jwt: string): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    try {
      const payloadPart = jwt.split('.')[1];
      if (!payloadPart) return;
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const payload = JSON.parse(atob(padded));
      const expMs = Number(payload.exp) * 1000;
      if (!Number.isFinite(expMs) || expMs <= Date.now()) return;

      const refreshAt = Math.max(1000, expMs - Date.now() - 5 * 60 * 1000);
      this.refreshTimer = setTimeout(async () => {
        this.refreshTimer = null;
        if (!auth.currentUser) return;

        const result = await this.fetchFreshTokenFromBackend();
        if (!result.success && this.state.isInitialized && auth.currentUser) {
          // Limited retry delay; do not repeatedly hammer Telnyx/backend.
          this.refreshTimer = setTimeout(() => {
            this.refreshTimer = null;
            void this.fetchFreshTokenFromBackend();
          }, 60_000);
        }
      }, refreshAt);
    } catch {
      // If exp cannot be decoded, leave manual/SDK-warning refresh available.
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
      // Never log JWT fragments: token pieces are credentials and should not
      // appear in browser logs or support screenshots.
      console.log('[TelnyxWebRTC] Inicializando cliente TelnyxRTC con token temporal.');

      // Desconectar cliente existente antes de crear uno nuevo
      if (this.client) {
        try { this.client.disconnect(); } catch {}
      }

      // Crear cliente usando el SDK importado desde @telnyx/webrtc
      this.client = new TelnyxRTC({
        login_token: token,
        // Keep SDK socket debug disabled: debug output can expose login_token JWTs.
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
            if (this.client !== clientForSession) return;
            const result = await this.fetchFreshTokenFromBackend();
            if (!result.success) throw new Error(result.message);
            console.log('[TelnyxWebRTC] ✅ Token individual renovado correctamente');
          } catch (err: any) {
            console.error('[TelnyxWebRTC] ❌ Fallo al renovar token:', err.message);
            // A transient network error should not tear down an otherwise
            // live call. Outbound is paused until the next successful refresh.
            this.state.canMakeOutbound = false;
            this.state.canReceiveInbound = false;
            this.state.lastError = 'No fue posible renovar el token. Se reintentará antes de habilitar nuevas llamadas.';
            this.notify();
          }
        }
      });

      this.client.on('telnyx.error', (error: any) => {
        // Login/authentication errors mean the SDK is not registered. Prevent
        // the dialer from attempting an invite on an unauthenticated socket.
        const eventError = error?.error || error;
        const message = String(eventError?.message || 'Error en conexión Telnyx WebRTC');
        const authFailure = /login incorrect|authentication required|login_failed|authentication failed/i.test(message);
        if (authFailure) {
          this.state.isConnected = false;
          this.state.isInitialized = false;
          this.state.canMakeOutbound = false;
          this.state.canReceiveInbound = false;
          this.state.lastError = 'Telnyx rechazó la autenticación. Verifica la credencial SIP y vuelve a solicitar un token.';
          // Stop the SDK's repeated login attempts with the same rejected token.
          // A fresh connection should only be created after an explicit token refresh.
          if (this.client === clientForSession) {
            try { clientForSession.disconnect(); } catch {}
            this.client = null;
          }
          console.error('[TelnyxWebRTC] Autenticación Telnyx rechazada; cliente desconectado.');
        } else {
          this.state.lastError = message;
          console.error('[TelnyxWebRTC] Error en cliente Telnyx:', message);
        }
        this.notify();
      });

      this.client.on('telnyx.notification', (notification: any) => {
        console.log('[TelnyxWebRTC] Notificación:', notification);
        if (notification?.call) {
          this.state.activeCallId = notification.call.id;
          this.notify();
        }
      });

      // connect() starts the SDK lifecycle. The authenticated/registered state
      // is only set by telnyx.ready; do not treat token receipt as ready.
      await this.client.connect();

      return {
        success: true,
        message: 'Conexión Telnyx iniciada; esperando registro telnyx.ready.'
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

    if (!this.client?.newCall || !this.state.isConnected) {
      throw new Error(
        this.state.lastError
          ? `Telnyx no está autenticado: ${this.state.lastError}. Renueva el token y espera el estado “Conectado” antes de llamar.`
          : 'Telnyx aún no está conectado. Espera a que el softphone muestre “Conectado” antes de llamar.'
      );
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
    this.activeUid = null;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
    this.refreshInFlight = null;
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