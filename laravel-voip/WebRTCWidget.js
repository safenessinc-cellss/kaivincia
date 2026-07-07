/**
 * Zadarma WebRTC Phone Widget Integration
 * 
 * Arquitecto de Sistemas Senior - Integraciones de Telecomunicaciones
 * 
 * Este widget inicializa la conexión de audio directamente desde el navegador del agente
 * utilizando el protocolo SIP sobre WebSockets (WSS) provisto por Zadarma.
 * Evita la necesidad de teléfonos físicos o software externos (Softphones).
 */

class ZadarmaWebRTCWidget {
    constructor(config) {
        this.server = config.server || 'webrtc.zadarma.com'; // Servidor oficial de WebSockets Zadarma
        this.sipUser = config.sipUser;   // ID de extensión SIP del agente (ej: "432100")
        this.password = config.password; // Clave de la extensión SIP
        this.remoteAudioId = config.remoteAudioId || 'remoteAudio'; // Elemento HTML <audio> para la voz remota
        
        this.phone = null;
        this.session = null;
        this.isConnected = false;
        
        // Callbacks de eventos para enlazar con la UI (React/Vue/JS)
        this.onCallStarted = config.onCallStarted || function() {};
        this.onCallConnected = config.onCallConnected || function() {};
        this.onCallEnded = config.onCallEnded || function() {};
        this.onSipStatusChange = config.onSipStatusChange || function() {};
        
        this.init();
    }

    /**
     * Cargar de forma asíncrona la librería WebRTC de Zadarma o usar JsSIP estándar.
     * Zadarma utiliza un wrapper propietario basado en JsSIP.js.
     */
    init() {
        console.log("Iniciando Módulo de Voz Zadarma WebRTC...");
        this.onSipStatusChange("INITIALIZING");
        
        // Cargar script oficial de Zadarma WebRTC si no existe
        if (!window.ZadarmaWebRTC && !window.JsSIP) {
            const script = document.createElement('script');
            script.src = 'https://my.zadarma.com/images/webphone/lib/jssip-3.3.11.min.js';
            script.onload = () => {
                this.setupSIPEngine();
            };
            script.onerror = () => {
                console.error("Fallo al cargar el motor SIP.js.");
                this.onSipStatusChange("ERROR_LOADING_ENGINE");
            };
            document.head.appendChild(script);
        } else {
            this.setupSIPEngine();
        }
    }

    /**
     * Configurar el socket y el User Agent (UA) de JsSIP para Zadarma.
     */
    setupSIPEngine() {
        try {
            const socket = new JsSIP.WebSocketInterface(`wss://${this.server}`);
            const configuration = {
                sockets: [socket],
                uri: `sip:${this.sipUser}@sip.zadarma.com`,
                password: this.password,
                register: true, // Auto-registro en los servidores de Zadarma
                session_timers: false
            };

            this.phone = new JsSIP.UA(configuration);

            // Enlazar eventos de Registro SIP
            this.phone.on('registered', () => {
                this.isConnected = true;
                console.log("SIP registrado con éxito en Zadarma.");
                this.onSipStatusChange("REGISTERED");
            });

            this.phone.on('unregistered', () => {
                this.isConnected = false;
                console.warn("SIP desregistrado de Zadarma.");
                this.onSipStatusChange("UNREGISTERED");
            });

            this.phone.on('registrationFailed', (e) => {
                this.isConnected = false;
                console.error("Fallo de registro SIP Zadarma:", e.cause);
                this.onSipStatusChange("REGISTRATION_FAILED", e.cause);
            });

            // Enlazar llamadas entrantes y salientes
            this.phone.on('newRTCSession', (data) => {
                this.handleNewSession(data);
            });

            // Arrancar el motor SIP
            this.phone.start();

        } catch (error) {
            console.error("Error crítico configurando motor SIP:", error);
            this.onSipStatusChange("CRITICAL_ERROR", error.message);
        }
    }

    /**
     * Administrar la sesión de llamada en curso (RTP Stream, ICE candidates y Audio).
     */
    handleNewSession(data) {
        this.session = data.session;
        const direction = this.session.direction; // 'incoming' o 'outgoing'

        console.log(`Nueva sesión WebRTC detectada (${direction}) ID: ${this.session.id}`);
        this.onCallStarted({ direction, id: this.session.id });

        // Capturar streams multimedia remotos al conectar la llamada
        this.session.on('peerconnection', (data) => {
            const peerconnection = data.peerconnection;
            peerconnection.addEventListener('track', (e) => {
                console.log("Audio Track remota recibida.");
                const remoteAudio = document.getElementById(this.remoteAudioId);
                if (remoteAudio && e.streams[0]) {
                    remoteAudio.srcObject = e.streams[0];
                    remoteAudio.play().catch(err => console.warn("Audio Play pospuesto:", err));
                }
            });
        });

        this.session.on('connecting', () => {
            console.log("Estableciendo conexión WebRTC...");
            this.onSipStatusChange("CONNECTING_WEBRTC");
        });

        this.session.on('accepted', () => {
            console.log("Llamada CONECTADA y activa.");
            this.onCallConnected();
            this.onSipStatusChange("CALL_CONNECTED");
        });

        this.session.on('ended', () => {
            console.log("Llamada FINALIZADA.");
            this.cleanupSession();
            this.onCallEnded("ended");
        });

        this.session.on('failed', (e) => {
            console.warn("Llamada FALLIDA/CANCELADA:", e.cause);
            this.cleanupSession();
            this.onCallEnded("failed", e.cause);
        });
    }

    /**
     * Realizar una llamada saliente (Outbound Call) directamente desde el navegador.
     *
     * @param {string} destinationNumber Número de destino (ej: "12135550199")
     */
    call(destinationNumber) {
        if (!this.isConnected || !this.phone) {
            alert("No se puede iniciar llamada: El dispositivo WebRTC no está registrado en Zadarma.");
            return false;
        }

        const cleanNumber = destinationNumber.replace(/\D/g, '');
        console.log(`Llamando vía WebRTC a: ${cleanNumber}`);

        const options = {
            mediaConstraints: { audio: true, video: false }, // Llamada de voz pura sin video
            rtcOfferConstraints: { offerToReceiveAudio: 1, offerToReceiveVideo: 0 }
        };

        this.session = this.phone.call(`sip:${cleanNumber}@sip.zadarma.com`, options);
        return true;
    }

    /**
     * Contestar una llamada entrante.
     */
    answer() {
        if (this.session && this.session.direction === 'incoming') {
            this.session.answer({
                mediaConstraints: { audio: true, video: false }
            });
        }
    }

    /**
     * Colgar la llamada activa.
     */
    hangup() {
        if (this.session) {
            console.log("Colgando sesión de voz activa...");
            this.session.terminate();
        }
    }

    /**
     * Silenciar micrófono (Mute).
     */
    toggleMute(shouldMute) {
        if (this.session) {
            if (shouldMute) {
                this.session.mute({ audio: true });
                console.log("Micrófono Silenciado.");
            } else {
                this.session.unmute({ audio: true });
                console.log("Micrófono Activado.");
            }
        }
    }

    /**
     * Enviar tonos DTMF durante la llamada (ej: presione 1 para ventas).
     */
    sendDTMF(tone) {
        if (this.session) {
            this.session.sendDTMF(tone);
            console.log(`Tono DTMF enviado: ${tone}`);
        }
    }

    cleanupSession() {
        this.session = null;
        const remoteAudio = document.getElementById(this.remoteAudioId);
        if (remoteAudio) {
            remoteAudio.srcObject = null;
        }
        this.onSipStatusChange("REGISTERED"); // Volver a estado de espera disponible
    }
}

// Exportar clase para uso global o de bundler
window.ZadarmaWebRTCWidget = ZadarmaWebRTCWidget;
export default ZadarmaWebRTCWidget;
