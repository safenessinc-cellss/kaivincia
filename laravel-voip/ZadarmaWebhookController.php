<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Services\ZadarmaService;

/**
 * Class ZadarmaWebhookController
 * 
 * Arquitecto de Sistemas Senior - Webhook Gateway VoIP
 * Maneja notificaciones en tiempo real desde los servidores de Zadarma para llamadas y grabaciones.
 */
class ZadarmaWebhookController extends Controller
{
    protected ZadarmaService $zadarmaService;

    public function __construct(ZadarmaService $zadarmaService)
    {
        $this->zadarmaService = $zadarmaService;
    }

    /**
     * Endpoint de Entrada para los Webhooks de Zadarma.
     * Zadarma enviará peticiones POST a: https://api.kaivinciacorp.com/api/voip/webhooks
     */
    public function handle(Request $request)
    {
        $event = $request->input('event');
        $callId = $request->input('call_id');
        
        Log::info("Zadarma Webhook Recibido - Evento: {$event}, Call ID: {$callId}", $request->all());

        // 1. Verificación de Seguridad (Firma de Zadarma)
        if (!$this->verifyZadarmaSignature($request)) {
            Log::warning("Firma de Webhook Zadarma Inválida - Acceso Denegado.");
            return response()->json(['status' => 'error', 'message' => 'Unauthorized signature.'], 403);
        }

        try {
            switch ($event) {
                // LLAMADA SALIENTE INICIADA (Llamada Click-to-Call o Softphone)
                case 'NOTIFY_OUT_START':
                    $this->handleOutgoingCallStart($request);
                    break;

                // LLAMADA SALIENTE FINALIZADA (Se cuelga la llamada)
                case 'NOTIFY_OUT_END':
                    $this->handleOutgoingCallEnd($request);
                    break;

                // LLAMADA ENTRANTE INICIADA (Llamada del cliente al DID corporativo)
                case 'NOTIFY_START':
                    $this->handleIncomingCallStart($request);
                    break;

                // LLAMADA ENTRANTE FINALIZADA
                case 'NOTIFY_END':
                    $this->handleIncomingCallEnd($request);
                    break;

                // GRABACIÓN DE AUDIO DISPONIBLE
                case 'NOTIFY_RECORD':
                    $this->handleCallRecordingReady($request);
                    break;

                default:
                    Log::info("Evento Zadarma no manejado específicamente: {$event}");
                    break;
            }

            // Zadarma espera un código de respuesta HTTP 200 y, en ocasiones, un eco del string de validación
            if ($request->has('zd_echo')) {
                return response($request->input('zd_echo'));
            }

            return response()->json(['status' => 'success', 'message' => 'Processed.']);

        } catch (\Exception $e) {
            Log::error("Fallo crítico procesando Webhook de Zadarma: " . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json(['status' => 'error', 'message' => 'Internal server error.'], 500);
        }
    }

    /**
     * Valida la firma del Webhook enviada por Zadarma utilizando SHA256 HMAC del secreto de API.
     */
    protected function verifyZadarmaSignature(Request $request): bool
    {
        // En un webhook real, Zadarma puede enviar un header "Signature" o un parámetro en la query.
        // Si no está habilitada la validación estricta de firma, Zadarma recomienda comparar con un token
        // pre-acordado o usar autenticación por IP de servidores de Zadarma.
        
        $signature = $request->header('Signature') ?? $request->input('signature');
        if (!$signature) {
            // Alternativa: Validación por lista blanca de IPs oficiales de Zadarma
            $zadarmaIps = ['185.45.152.0/24', '185.45.155.0/24', '37.139.38.0/24', '128.72.112.0/20'];
            $clientIp = $request->ip();
            
            foreach ($zadarmaIps as $range) {
                if ($this->ipInCIDR($clientIp, $range)) {
                    return true;
                }
            }
            return false;
        }

        // Generar firma local de prueba (Zadarma concatena los parámetros POST ordenados por clave + secret)
        $params = $request->except(['signature', 'sign']);
        ksort($params);
        $paramString = implode('', $params);
        
        $localSignature = base64_encode(hash_hmac('sha256', $paramString, env('ZADARMA_API_SECRET', '')));

        return hash_equals($localSignature, $signature);
    }

    /**
     * Helper para verificar si una IP está en un rango CIDR.
     */
    protected function ipInCIDR(string $ip, string $cidr): bool
    {
        list($subnet, $bits) = explode('/', $cidr);
        $ip = ip2long($ip);
        $subnet = ip2long($subnet);
        $mask = -1 << (32 - $bits);
        $subnet &= $mask;
        return ($ip & $mask) == $subnet;
    }

    /**
     * Procesar el inicio de una llamada saliente (Notificación inicial).
     */
    protected function handleOutgoingCallStart(Request $request)
    {
        $callId = $request->input('call_id');
        $caller = $request->input('caller_id'); // Número del DID o la extensión del agente
        $called = $request->input('called_phone'); // Número del cliente
        $sip = $request->input('sip'); // Extensión SIP que realiza la llamada (ej: "4321")

        // Buscar agente dueño de la extensión SIP en la base de datos
        $agentConfig = DB::table('agent_sip_configs')->where('sip_username', $sip)->first();
        $agentId = $agentConfig ? $agentConfig->user_id : null;

        // Registrar la llamada con estado 'Mapeando/Marcando'
        DB::table('call_logs')->insertOrIgnore([
            'pbx_call_id' => $callId,
            'direction' => 'outbound',
            'caller_number' => $caller,
            'called_number' => $called,
            'sip_extension' => $sip,
            'agent_id' => $agentId,
            'status' => 'ringing',
            'start_time' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Opcional: Despachar evento Pusher/WebSockets para actualizar la UI del agente en tiempo real
        // event(new \App\Events\CallStarted($agentId, $callId, $called));
    }

    /**
     * Procesar el fin de una llamada saliente (Cálculo de duración, costos y cierre).
     */
    protected function handleOutgoingCallEnd(Request $request)
    {
        $callId = $request->input('call_id');
        $duration = (int) $request->input('duration', 0); // Duración en segundos
        $disposition = $request->input('disposition', 'no answer'); // answered, busy, no answer, cancel
        $cost = (float) $request->input('cost', 0.00); // Costo devuelto por Zadarma
        $statusCode = $request->input('status_code');

        // Zadarma a veces no envía el costo real inmediatamente si no está configurada la facturación unificada.
        // Como arquitecto senior, calculamos la tarifa por defecto si el API reporta 0, para garantizar reportes de costos.
        if ($cost <= 0 && $disposition === 'answered') {
            $cost = round(($duration / 60) * 0.012, 4); // Tarifa fija de Kaivincia ($0.012/min)
        }

        DB::table('call_logs')
            ->where('pbx_call_id', $callId)
            ->update([
                'status' => $disposition === 'answered' ? 'completed' : 'failed',
                'duration_seconds' => $duration,
                'end_time' => now(),
                'cost' => $cost,
                'disposition' => $disposition,
                'status_code' => $statusCode,
                'updated_at' => now()
            ]);

        // Opcional: Emitir evento Pusher para actualizar el dashboard del agente y cerrar el modal
        // event(new \App\Events\CallEnded($callId, $duration, $cost));
    }

    /**
     * Procesar el inicio de una llamada entrante (Cliente llama al DID).
     */
    protected function handleIncomingCallStart(Request $request)
    {
        $callId = $request->input('call_id');
        $caller = $request->input('caller_id'); // Celular del cliente
        $called = $request->input('called_did'); // El DID corporativo de Kaivincia (ej: 12135550155)

        DB::table('call_logs')->insertOrIgnore([
            'pbx_call_id' => $callId,
            'direction' => 'incoming',
            'caller_number' => $caller,
            'called_number' => $called,
            'status' => 'ringing',
            'start_time' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Procesar el fin de una llamada entrante.
     */
    protected function handleIncomingCallEnd(Request $request)
    {
        $callId = $request->input('call_id');
        $duration = (int) $request->input('duration', 0);
        $disposition = $request->input('disposition');

        DB::table('call_logs')
            ->where('pbx_call_id', $callId)
            ->update([
                'status' => $disposition === 'answered' ? 'completed' : 'failed',
                'duration_seconds' => $duration,
                'end_time' => now(),
                'disposition' => $disposition,
                'updated_at' => now()
            ]);
    }

    /**
     * Notificación de Grabación Lista para Descargar (Webhook o consulta posterior).
     * Zadarma envía 'call_id_with_rec' para amarrar la grabación.
     */
    protected function handleCallRecordingReady(Request $request)
    {
        $callId = $request->input('call_id_with_rec') ?? $request->input('call_id');
        $recordingId = $request->input('recording_id');
        
        // Obtener el enlace de descarga directa usando nuestro servicio de Zadarma
        $recordingUrl = $this->zadarmaService->obtenerGrabacionUrl($callId);

        if ($recordingUrl) {
            DB::table('call_logs')
                ->where('pbx_call_id', $callId)
                ->orWhere('pbx_call_id', str_replace('_rec', '', $callId))
                ->update([
                    'recording_url' => $recordingUrl,
                    'is_recorded' => true,
                    'updated_at' => now()
                ]);

            Log::info("Enlace de Grabación de Audio Vinculado para Call ID: {$callId}. Enlace: {$recordingUrl}");
        } else {
            Log::warning("Zadarma reportó grabación lista, pero la API no retornó un enlace de descarga para ID: {$callId}");
        }
    }
}
