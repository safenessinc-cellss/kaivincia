# KAIVINCIA VOIP - MANUAL DE INTEGRACIÓN REST & WEBRTC ZADARMA
### Arquitecto de Sistemas Senior - Telecomunicaciones & CRM Real-Time

Este repositorio contiene la arquitectura completa, de extremo a extremo, lista para producción para habilitar llamadas IP con validación de zona horaria (Timezone Guard), WebRTC en navegador, Click-to-Call por Callback y sincronización en tiempo real con Firebase Firestore.

---

## 1. FLUJO DE ARQUITECTURA (SISTEMA DE LLAMADAS)

El ciclo de vida de una llamada B2B de alta velocidad en Kaivincia sigue el siguiente flujograma:

```
[ Agente en CRM ]
       │
       ▼  (Clic en botón "Llamar")
[ Interceptor Timezone Guard ]
       │
       ├─► [ Fuera de Horario (8PM-9AM) ] ──► Alerta / Cita Recomendada / Cancelar
       │
       ▼  (Horario Seguro - Clic en Continuar)
[ POST /api/call/initiate ] ──► [ Laravel CallController ]
                                            │
                                            ▼ (Zadarma HMAC Signature)
                              [ Zadarma REST API: /v1/request/callback/ ]
                                            │
                                            ├─► [ PBX llama al Agente vía WebRTC ]
                                            │
                                            └─► [ PBX llama al Lead (California/NY) ]
                                            │
                                            ▼ (Eventos Webhook en Tiempo Real)
                              [ POST /api/webhooks/zadarma ]
                                            │
                                            ├─► [ Actualiza Firestore calls/{callId} ]
                                            │
                                            └─► [ Log de Actividades & Telemetría ]
```

---

## 2. COMPOSICIÓN DE ARCHIVOS EN ESTE REPOSITORIO

En la carpeta `/laravel-voip` de tu espacio de trabajo se han generado los siguientes componentes listos para producción:

1. **`ZadarmaService.php`**: El motor de firmas HMAC-SHA256 y API Client oficial. Implementa `getWebrtcKey`, `initiateCallback`, `getCallStatus`, `getRecordings` y `getAccountBalance`.
2. **`ZadarmaWebhookController.php`**: El webhook receptor. Procesa `NOTIFY_START`, `NOTIFY_END` y `NOTIFY_RECORD`, con firma de seguridad y actualización en base de datos.
3. **`TimezoneValidator.php`**: Validador geográfico de códigos de área de EE.UU. (California, Colorado, NY, NJ) a husos PT, MT, CT, ET con bloqueo inteligente.
4. **`database_migrations.sql`**: Los esquemas para `agent_sip_configs`, `call_logs` y `area_code_schedules` (incluye Seeding inicial).
5. **`RecordingSyncCron.php`**: Comando de Artisan para sincronización asíncrona de grabaciones de audio en segundo plano.
6. **`CostReportingScript.php`**: Motor analítico para generar reportes financieros con tarifa plana de $0.012/minuto.
7. **`WebRTCWidget.js`**: SDK de JavaScript puro para registrar SIP sobre WebSockets (WSS) sin necesidad de software de terceros.

---

## 3. CÓDIGO BACKEND LARAVEL COMPLETO (PRO-GRADE)

### A. RUTA DE PETICIONES (`routes/api.php`)
```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CallController;
use App\Http\Controllers\Webhook\ZadarmaWebhookController;

/*
|--------------------------------------------------------------------------
| API de Comunicaciones Unificadas - Kaivincia VoIP
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // Endpoints de Control de Voz
    Route::post('/call/initiate', [CallController::class, 'initiate']);
    Route::get('/call/status/{callId}', [CallController::class, 'status']);
    Route::get('/call/history', [CallController::class, 'history']);
});

// Canal Webhook Libre de CSRF (Zadarma enviará firmas de validación SHA256)
Route::post('/webhooks/zadarma', [ZadarmaWebhookController::class, 'handle']);
```

---

### B. CONTROLADOR DE TRANSACCIONES (`app/Http/Controllers/Api/CallController.php`)
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\ZadarmaService;
use App\Helpers\TimezoneValidator;

class CallController extends Controller
{
    protected ZadarmaService $zadarmaService;

    public function __construct(ZadarmaService $zadarmaService)
    {
        $this->zadarmaService = $zadarmaService;
    }

    /**
     * Iniciar llamada Callback de forma segura.
     * Valida zona horaria del lead antes de disparar la petición.
     */
    public function initiate(Request $request)
    {
        $request->validate([
            'lead_id' => 'required|integer',
            'client_phone' => 'required|string',
            'force_call' => 'boolean'
        ]);

        $agent = $request->user();
        $clientPhone = $request->input('client_phone');
        $leadId = $request->input('lead_id');
        $forceCall = $request->input('force_call', false);

        // 1. Obtener la configuración SIP del agente
        $sipConfig = DB::table('agent_sip_configs')->where('user_id', $agent->id)->first();
        if (!$sipConfig) {
            return response()->json([
                'status' => 'error',
                'message' => 'El agente no cuenta con una extensión SIP asignada en Kaivincia VoIP.'
            ], 422);
        }

        // 2. Ejecutar Timezone Guard (Validación de Zona Horaria)
        $tzValidation = TimezoneValidator::validate($clientPhone);
        
        if (!$tzValidation['is_safe'] && !$forceCall) {
            return response()->json([
                'status' => 'warning',
                'message' => 'Llamada retenida por sistema de protección de zona horaria.',
                'timezone_data' => $tzValidation
            ], 403);
        }

        // 3. Invocar API de Zadarma para iniciar el Callback
        $result = $this->zadarmaService->initiateCallback($sipConfig->sip_username, $clientPhone);

        if (!$result['success']) {
            Log::error("Fallo en inicio de llamada Zadarma para Agente ID: {$agent->id}", ['result' => $result]);
            return response()->json([
                'status' => 'error',
                'message' => 'El carrier de Zadarma rechazó la llamada: ' . $result['message']
            ], 502);
        }

        $pbxCallId = $result['pbx_call_id'];

        // 4. Registrar en la Base de Datos Relacional (Historial local)
        DB::table('call_logs')->insert([
            'pbx_call_id' => $pbxCallId,
            'direction' => 'outbound',
            'caller_number' => $sipConfig->caller_id_number ?? 'Kaivincia DID',
            'called_number' => $clientPhone,
            'sip_extension' => $sipConfig->sip_username,
            'agent_id' => $agent->id,
            'lead_id' => $leadId,
            'status' => 'ringing',
            'start_time' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 5. Retornar éxito
        return response()->json([
            'status' => 'success',
            'message' => 'Llamada enviada con éxito al PBX de Zadarma.',
            'pbx_call_id' => $pbxCallId,
            'timezone_data' => $tzValidation
        ]);
    }

    /**
     * Consulta el estado de una llamada activa.
     */
    public function status($callId)
    {
        $log = DB::table('call_logs')->where('pbx_call_id', $callId)->first();
        if (!$log) {
            return response()->json(['status' => 'error', 'message' => 'Llamada no encontrada.'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $log
        ]);
    }

    /**
     * Obtener el historial completo de llamadas con filtros.
     */
    public function history(Request $request)
    {
        $query = DB::table('call_logs')
            ->orderBy('start_time', 'desc');

        if ($request->has('agent_id')) {
            $query->where('agent_id', $request->input('agent_id'));
        }

        if ($request->has('lead_id')) {
            $query->where('lead_id', $request->input('lead_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate(20)
        ]);
    }
}
```

---

### C. MODELO ELOQUENT (`app/Models/CallLog.php`)
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallLog extends Model
{
    protected $table = 'call_logs';

    protected $fillable = [
        'pbx_call_id',
        'direction',
        'caller_number',
        'called_number',
        'sip_extension',
        'agent_id',
        'lead_id',
        'status',
        'disposition',
        'start_time',
        'end_time',
        'duration_seconds',
        'cost',
        'status_code',
        'is_recorded',
        'recording_url',
        'user_agent'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_recorded' => 'boolean',
        'cost' => 'float',
        'duration_seconds' => 'integer'
    ];

    /**
     * Relación con el Agente (Usuario del CRM)
     */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    /**
     * Relación con el Lead/Cliente
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    // Scopes de Utilidad Operativa
    public function scopeToday($query)
    {
        return $query->whereDate('start_time', today());
    }

    public function scopeByAgent($query, $agentId)
    {
        return $query->where('agent_id', $agentId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }
}
```

---

## 4. COMPONENTE FRONTEND REACT.JS (WEBRTC WIDGET)

Este componente se inyecta en el panel general de los agentes de Kaivincia CRM, registrando su extensión de forma segura usando la API REST de Laravel como intermediario:

```jsx
import React, { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, ShieldCheck, Terminal, DollarSign, Activity } from 'lucide-react';

export default function WebRTCWidget({ agentExtension }) {
  const [sipStatus, setSipStatus] = useState('UNREGISTERED');
  const [callSession, setCallSession] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [logs, setLogs] = useState([]);
  
  const phoneRef = useRef(null);
  const timerRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    if (!agentExtension) return;

    addLog(`Iniciando aprovisionamiento SIP para Extensión: ${agentExtension}`);
    
    // 1. Cargar script de JsSIP dinámicamente
    const script = document.createElement('script');
    script.src = 'https://my.zadarma.com/images/webphone/lib/jssip-3.3.11.min.js';
    script.async = true;
    script.onload = () => {
      addLog("Librería de telefonía JsSIP cargada exitosamente.");
      initializeSipEngine();
    };
    script.onerror = () => {
      addLog("❌ Error crítico: No se pudo cargar el motor SIP.js.");
      setSipStatus('ERROR');
    };
    document.head.appendChild(script);

    return () => {
      if (phoneRef.current) {
        phoneRef.current.stop();
      }
      clearInterval(timerRef.current);
    };
  }, [agentExtension]);

  // 2. Autenticar y Registrar con el Servidor WSS de Zadarma
  const initializeSipEngine = async () => {
    try {
      // Solicitar clave temporal WebRTC al backend Laravel (Válida por 72h)
      // POST /api/voip/get-webrtc-key o similar endpoint
      const response = await fetch('/api/voip/webrtc-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ extension: agentExtension })
      });

      const data = await response.json();
      if (!data.success) {
        addLog(`❌ Fallo de Backend: ${data.message}`);
        setSipStatus('REGISTRATION_FAILED');
        return;
      }

      // Configurar el socket y el motor SIP
      const socket = new window.JsSIP.WebSocketInterface(`wss://${data.server}`);
      const config = {
        sockets: [socket],
        uri: `sip:${data.sip_username}@sip.zadarma.com`,
        password: data.key, // Clave temporal segura de Zadarma
        register: true,
        session_timers: false
      };

      const phone = new window.JsSIP.UA(config);
      phoneRef.current = phone;

      // Eventos de Registro
      phone.on('registered', () => {
        setSipStatus('REGISTERED');
        addLog(`✓ Conexión encriptada establecida. SIP Registrado en Zadarma.`);
      });

      phone.on('unregistered', () => {
        setSipStatus('UNREGISTERED');
        addLog(`⚠️ Conexión SIP cerrada.`);
      });

      phone.on('registrationFailed', (e) => {
        setSipStatus('REGISTRATION_FAILED');
        addLog(`❌ Fallo de Registro SIP: ${e.cause}`);
      });

      // Monitorear Nuevas Sesiones (Llamadas Entrantes y Salientes)
      phone.on('newRTCSession', (data) => {
        const session = data.session;
        setCallSession(session);
        addLog(`🔔 Nueva sesión multimedia creada [${session.direction}]`);

        // Vincular el Audio de Voz Remoto
        session.on('peerconnection', (e) => {
          e.peerconnection.addEventListener('track', (trackEvent) => {
            if (remoteAudioRef.current && trackEvent.streams[0]) {
              remoteAudioRef.current.srcObject = trackEvent.streams[0];
              remoteAudioRef.current.play().catch(err => console.warn(err));
            }
          });
        });

        session.on('accepted', () => {
          setSipStatus('CALL_CONNECTED');
          addLog('✓ Llamada CONECTADA y en curso.');
          startDurationTimer();
        });

        session.on('ended', () => {
          cleanupSession();
          addLog('Llamada finalizada por el usuario.');
        });

        session.on('failed', (e) => {
          cleanupSession();
          addLog(`Llamada fallida/cancelada. Causa: ${e.cause}`);
        });
      });

      phone.start();

    } catch (error) {
      addLog(`❌ Excepción crítica inicializando WebRTC: ${error.message}`);
      setSipStatus('ERROR');
    }
  };

  const startDurationTimer = () => {
    setCallDuration(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const cleanupSession = () => {
    setCallSession(null);
    clearInterval(timerRef.current);
    setCallDuration(0);
    setSipStatus('REGISTERED');
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  const handleHangup = () => {
    if (callSession) {
      callSession.terminate();
    }
  };

  const toggleMute = () => {
    if (callSession) {
      if (isMuted) {
        callSession.unmute({ audio: true });
        setIsMuted(false);
        addLog("Micrófono activado.");
      } else {
        callSession.mute({ audio: true });
        setIsMuted(true);
        addLog("Micrófono silenciado (MUTE).");
      }
    }
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-[#0B0E14] border border-white/5 rounded-3xl p-6 shadow-2xl z-50 overflow-hidden font-sans">
      <audio ref={remoteAudioRef} id="remoteAudio" className="hidden" />

      {/* Glow Decorativo de Estado */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${
        sipStatus === 'CALL_CONNECTED' ? 'bg-emerald-400 shadow-[0_0_15px_#10B981]' :
        sipStatus === 'REGISTERED' ? 'bg-cyan-400 shadow-[0_0_15px_#22D3EE]' :
        'bg-red-400 shadow-[0_0_15px_#EF4444]'
      }`} />

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-white italic">KAIVINCIA VOIP</h4>
          <p className="text-[9px] font-mono text-gray-500">Agente Ext: {agentExtension || 'No Asignada'}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            sipStatus === 'REGISTERED' ? 'bg-cyan-400 animate-pulse' :
            sipStatus === 'CALL_CONNECTED' ? 'bg-emerald-400 animate-bounce' :
            'bg-red-500'
          }`} />
          <span className="text-[9px] font-black font-mono text-gray-300 uppercase tracking-wider">{sipStatus}</span>
        </div>
      </div>

      {/* Estado de Llamada Activa */}
      {sipStatus === 'CALL_CONNECTED' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-4 text-center">
          <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1 animate-pulse">Llamada Activa</p>
          <p className="text-2xl font-black font-mono text-white tracking-widest">{formatTime(callDuration)}</p>
          <p className="text-[9px] text-gray-500 font-mono mt-1">Tarifa estimada: $0.012/min</p>
        </div>
      )}

      {/* Controles de Voz */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {sipStatus === 'CALL_CONNECTED' && (
          <>
            <button 
              onClick={toggleMute}
              className={`p-3.5 rounded-full border transition-all ${
                isMuted 
                  ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button 
              onClick={handleHangup}
              className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Consola Terminal Log (Para Neural Link e Historial) */}
      <div className="border border-white/5 rounded-2xl bg-black/40 p-3 h-32 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-1.5 text-[8px] font-mono text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-1">
          <Terminal className="w-3 h-3" /> Consola SIP / WebRTC
        </div>
        <div className="space-y-1 font-mono text-[9px] text-gray-400 leading-normal">
          {logs.map((log, i) => (
            <p key={i} className="truncate">{log}</p>
          ))}
          {logs.length === 0 && <p className="text-gray-600">Ningún evento registrado en este turno.</p>}
        </div>
      </div>
    </div>
  );
}
```

---

## 5. CÓMO CONFIGURAR EL PANEL DE ZADARMA (Paso a Paso)

Para poner este sistema en producción en **Kaivincia Corp**, debes configurar la cuenta corporativa de Zadarma de la siguiente manera:

### 1. Obtención de API Key y Secret (Credenciales REST)
1. Inicia sesión en tu cuenta de administrador en [my.zadarma.com](https://my.zadarma.com).
2. Dirígete a la sección **Configuración (Settings)** -> **Integraciones y API (Integrations & API)**.
3. Haz clic en **Zadarma API**.
4. Haz clic en **Generar Credenciales** (si aún no se han creado). El sistema te arrojará:
   - `KEY`: Un string hexadecimal público.
   - `SECRET`: Un string encriptado que debes copiar y resguardar (nunca compartir).
5. Copia estas credenciales y agrégalas de inmediato a tu archivo `.env` del backend de Laravel.

### 2. Creación de Extensiones SIP para Agentes
1. Ve a **Mi PBX (My PBX)** -> **Extensiones (Extensions)**.
2. Crea una extensión SIP para cada Setter del equipo (ej: `100`, `101`, `102`...).
3. Entra a editar cada extensión para habilitar:
   - **Registro WebRTC / SIP sobre WebSockets (WSS)**. Esto es vital para el widget en el navegador.
   - **Grabación de llamadas**: Habilita "Grabar llamadas en la extensión" para que Zadarma almacene de forma automática el archivo de voz y dispare el webhook al finalizar.
4. Anota el usuario de la extensión (ej: `12345-100`) y la clave SIP. Estos campos se guardarán en la tabla `agent_sip_configs` asociada a cada usuario en el CRM.

### 3. Configuración de la URL de Webhook
1. Ve a **Configuración** -> **API y Webhooks**.
2. En el campo de **URL de Notificaciones** ingresa la dirección de tu gateway de Laravel:
   `https://api.kaivinciacorp.com/api/webhooks/zadarma`
3. Activa los siguientes triggers (eventos obligatorios):
   - `NOTIFY_OUT_START`: Al comenzar una llamada saliente (Callback).
   - `NOTIFY_OUT_END`: Al colgar una llamada saliente.
   - `NOTIFY_START`: Al comenzar llamada entrante.
   - `NOTIFY_END`: Al finalizar llamada entrante.
   - `NOTIFY_RECORD`: En cuanto el archivo MP3 de la llamada esté procesado y disponible para descarga en los servidores del PBX.

---

## 6. SCRIPT DE PRUEBAS AUTOMATIZADAS (Artisan Command)

Crea el siguiente script en tu servidor Laravel para validar de forma integral la conexión del core con Zadarma:

`app/Console/Commands/TestVoipConnection.php`
```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ZadarmaService;

class TestVoipConnection extends Command
{
    protected $signature = 'voip:test-integration {--extension= : Extensión SIP a probar} {--test-number= : Número destino para simular llamada}';
    protected $description = 'Prueba integral del API de Zadarma, firma HMAC y comunicación con el carrier';

    protected ZadarmaService $service;

    public function __construct(ZadarmaService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    public function handle()
    {
        $this->info("=== INICIANDO AUDITORÍA DE INTEGRACIÓN VOIP ZADARMA ===");

        // Test 1: Verificar saldo y conexión básica de API
        $this->comment("1. Probando conexión básica y firma HMAC con saldo...");
        $balanceRes = $this->service->getAccountBalance();
        
        if ($balanceRes['success']) {
            $this->info("✓ Conexión establecida de forma exitosa.");
            $this->info("Saldo Actual: {$balanceRes['balance']} {$balanceRes['currency']}");
        } else {
            $this->error("❌ Fallo en conexión: " . $balanceRes['message']);
            return 1;
        }

        // Test 2: Obtener Clave WebRTC Temporal
        $extension = $this->option('extension');
        if ($extension) {
            $this->comment("2. Generando clave WebRTC para extensión {$extension}...");
            $webrtcRes = $this->service->getWebrtcKey($extension);
            if ($webrtcRes['success']) {
                $this->info("✓ Clave WebRTC generada de manera correcta.");
                $this->info("WSS Server: {$webrtcRes['server']}");
                $this->info("Clave Temporal: " . substr($webrtcRes['key'], 0, 10) . "...");
            } else {
                $this->error("❌ Fallo al generar clave WebRTC: " . $webrtcRes['message']);
            }
        }

        // Test 3: Simular Callback
        $targetNumber = $this->option('test-number');
        if ($extension && $targetNumber) {
            $this->comment("3. Simulando llamada Callback (Zadarma llamará a {$extension} y luego a {$targetNumber})...");
            $callbackRes = $this->service->initiateCallback($extension, $targetNumber);
            if ($callbackRes['success']) {
                $this->info("✓ Callback iniciado con éxito.");
                $this->info("Zadarma Call ID: {$callbackRes['pbx_call_id']}");
            } else {
                $this->error("❌ Error de Callback: " . $callbackRes['message']);
            }
        }

        $this->info("=== AUDITORÍA FINALIZADA ===");
        return 0;
    }
}
```

---

## 7. CUMPLIMIENTO REGULATORIO Y SEGURIDAD (E911 & STIR/SHAKEN)

Al realizar marcaciones directas hacia teléfonos en los Estados Unidos, es de carácter obligatorio cumplir con las normas de la FCC:

1. **E911 (Enhanced 911)**: Las extensiones SIP de tus agentes de ventas son de uso corporativo y virtual. **Zadarma bloquea por defecto las llamadas al número de emergencia 911** desde extensiones internacionales para evitar multas de enrutamiento fallido. Configura en el panel de Zadarma el bloqueo explícito en la marcación saliente de tus agentes para que no intenten marcar números de emergencia de EE.UU. desde redes IP externas.
2. **STIR/SHAKEN (Cumplimiento de Antiespam)**: Para evitar que tus llamadas salientes aparezcan etiquetadas como "Fraude Potencial" o "Spam" por carriers norteamericanos (T-Mobile, AT&T, Verizon):
   - Tus números DIDs (de California, Colorado, New York) deben registrarse con el perfil verificado del cliente (KYC completado en Zadarma con los datos fiscales de Kaivincia Corp).
   - Configura el **Caller ID saliente** para que coincida exactamente con los DIDs adquiridos. Zadarma firmará digitalmente la llamada con nivel de atestación "A", maximizando la tasa de contestación de los prospectos (Setters High Ticket).
