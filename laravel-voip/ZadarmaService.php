<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Class ZadarmaService
 * 
 * Senior Systems Architect - VoIP Integration Core (Zadarma API)
 * 
 * This service handles communication with the Zadarma REST API, using HMAC-SHA256
 * authentication according to the official standard.
 */
class ZadarmaService
{
    protected string $key;
    protected string $secret;
    protected string $baseUrl;

    /**
     * Constructor - Loads credentials securely from environment variables.
     */
    public function __construct()
    {
        $this->key = config('services.zadarma.key') ?? env('ZADARMA_API_KEY', '');
        $this->secret = config('services.zadarma.secret') ?? env('ZADARMA_API_SECRET', '');
        $this->baseUrl = 'https://api.zadarma.com';
    }

    /**
     * 1. getWebrtcKey($extension)
     * Obtiene una clave temporal WebRTC (válida por 72h) para que el widget del agente
     * pueda registrarse de forma segura en los servidores WebRTC de Zadarma sin exponer la contraseña SIP real.
     * 
     * @param string $extension Extensión SIP (ej: "432100" o "12345")
     * @return array Estructura con la clave temporal y parámetros de conexión
     */
    public function getWebrtcKey(string $extension): array
    {
        $cleanExtension = preg_replace('/\D/', '', $extension);
        
        Log::info("Solicitando clave WebRTC temporal para extensión: {$cleanExtension}");
        
        $response = $this->sendRequest('/v1/webrtc/key/', [
            'user' => $cleanExtension
        ], 'GET');

        if (isset($response['status']) && $response['status'] === 'success') {
            return [
                'success' => true,
                'key' => $response['key'] ?? '',
                'server' => $response['server'] ?? 'webrtc.zadarma.com',
                'sip_username' => $cleanExtension,
                'expires_in_hours' => 72
            ];
        }

        Log::error("Fallo al obtener clave WebRTC de Zadarma para extensión: {$cleanExtension}", ['response' => $response]);
        return [
            'success' => false,
            'message' => $response['message'] ?? 'No se pudo obtener la clave WebRTC.',
            'raw' => $response
        ];
    }

    /**
     * 2. initiateCallback($fromExtension, $toNumber)
     * Inicia una llamada saliente utilizando el método de Callback (Llamada de Retorno).
     * El servidor de Zadarma primero timbra a la extensión SIP del agente ($fromExtension),
     * y en cuanto el agente descuelga su auricular, timbra de manera inmediata al cliente ($toNumber).
     * Esto evita latencias y garantiza grabaciones estables.
     * 
     * @param string $fromExtension Extensión SIP del agente emisor (ej: "432100")
     * @param string $toNumber Número del lead/cliente en formato internacional sin "+" (ej: "12135627140")
     * @return array Respuesta con el ID único de la sesión de llamada (call_id) o error
     */
    public function initiateCallback(string $fromExtension, string $toNumber): array
    {
        $params = [
            'from' => preg_replace('/\D/', '', $fromExtension),
            'to' => preg_replace('/\D/', '', $toNumber),
        ];

        Log::info("Iniciando Callback Zadarma: Extensión {$params['from']} -> Cliente {$params['to']}");

        $response = $this->sendRequest('/v1/request/callback/', $params, 'GET');

        if (isset($response['status']) && $response['status'] === 'success') {
            return [
                'success' => true,
                'pbx_call_id' => $response['call_id'] ?? null,
                'message' => 'Llamada Callback iniciada exitosamente.',
                'raw' => $response
            ];
        }

        Log::warning("Callback fallido en Zadarma API:", ['params' => $params, 'response' => $response]);
        return [
            'success' => false,
            'message' => $response['message'] ?? 'Fallo al iniciar llamada Callback.',
            'raw' => $response
        ];
    }

    /**
     * 3. getCallStatus($callId)
     * Consulta el estado en tiempo real de una llamada específica o el estado de los canales activos.
     * 
     * @param string $callId ID único de la llamada en Zadarma (pbx_call_id)
     * @return array Detalle del estado de la llamada
     */
    public function getCallStatus(string $callId): array
    {
        Log::info("Consultando estado de llamada: {$callId}");

        // Consultar estadísticas de llamadas activas o recientes
        $response = $this->sendRequest('/v1/pbx/state/', [], 'GET');

        // Si se busca una llamada en curso específica, se filtra en la respuesta
        if (isset($response['status']) && $response['status'] === 'success') {
            $activeCalls = $response['calls'] ?? [];
            foreach ($activeCalls as $call) {
                if (($call['call_id'] ?? '') === $callId) {
                    return [
                        'success' => true,
                        'is_active' => true,
                        'state' => $call['state'] ?? 'unknown', // ringing, connected
                        'duration' => $call['duration'] ?? 0,
                        'raw' => $call
                    ];
                }
            }
        }

        // Si no está activa en los canales, buscamos el historial reciente
        $history = $this->getCallHistory([
            'call_id' => $callId,
            'limit' => 1
        ]);

        if (!empty($history['data'])) {
            $callDetail = $history['data'][0];
            return [
                'success' => true,
                'is_active' => false,
                'state' => 'completed',
                'disposition' => $callDetail['disposition'] ?? 'answered',
                'duration' => $callDetail['duration'] ?? 0,
                'cost' => $callDetail['billcost'] ?? 0.0,
                'raw' => $callDetail
            ];
        }

        return [
            'success' => false,
            'is_active' => false,
            'message' => 'Llamada no encontrada en canales activos ni en historial reciente.'
        ];
    }

    /**
     * 4. getRecordings($callId)
     * Obtiene el enlace de descarga directo para el archivo de grabación .mp3 de una llamada.
     * 
     * @param string $callId ID único de la llamada en Zadarma
     * @return string|null URL del archivo de grabación o null si no está disponible aún
     */
    public function getRecordings(string $callId): ?string
    {
        Log::info("Solicitando grabación de llamada Zadarma ID: {$callId}");

        $response = $this->sendRequest('/v1/pbx/record/request/', [
            'call_id_with_rec' => $callId
        ], 'GET');

        if (isset($response['status']) && $response['status'] === 'success') {
            return $response['link'] ?? null;
        }

        Log::warning("Grabación no disponible aún o error para ID: {$callId}", ['response' => $response]);
        return null;
    }

    /**
     * 5. getAccountBalance()
     * Consulta el saldo actual en USD de la cuenta de Zadarma de Kaivincia Corp.
     * Útil para monitoreo y alertas de recarga en el panel Neural Link.
     * 
     * @return array Información del saldo
     */
    public function getAccountBalance(): array
    {
        Log::info("Consultando saldo de cuenta Zadarma...");
        $response = $this->sendRequest('/v1/info/balance/', [], 'GET');

        if (isset($response['status']) && $response['status'] === 'success') {
            return [
                'success' => true,
                'balance' => (float) ($response['balance'] ?? 0.0),
                'currency' => $response['currency'] ?? 'USD',
                'raw' => $response
            ];
        }

        return [
            'success' => false,
            'balance' => 0.0,
            'message' => $response['message'] ?? 'No se pudo consultar el saldo.'
        ];
    }

    /**
     * 6. getCallHistory($params)
     * Consulta el historial general de llamadas del PBX aplicando filtros dinámicos.
     * 
     * @param array $params Filtros (start, end, call_id, etc.)
     * @return array Listado de llamadas registradas
     */
    public function getCallHistory(array $params = []): array
    {
        Log::info("Consultando historial de llamadas Zadarma...", $params);

        // Endpoint de estadísticas generales
        $response = $this->sendRequest('/v1/statistics/calls/', $params, 'GET');

        if (isset($response['status']) && $response['status'] === 'success') {
            return [
                'success' => true,
                'data' => $response['stats'] ?? [],
                'raw' => $response
            ];
        }

        return [
            'success' => false,
            'data' => [],
            'message' => $response['message'] ?? 'Fallo al obtener historial de llamadas.'
        ];
    }

    /**
     * Envía la petición HTTP REST firmada con HMAC-SHA256 a los servidores de Zadarma.
     */
    protected function sendRequest(string $method, array $params = [], string $httpVerb = 'GET'): array
    {
        if (empty($this->key) || empty($this->secret)) {
            Log::error('Zadarma API: Credenciales no configuradas en el entorno (.env).');
            return ['status' => 'error', 'message' => 'API Key o Secret no configurados.'];
        }

        // Ordenar parámetros alfabéticamente para construir la query
        ksort($params);
        $queryString = http_build_query($params);

        // Algoritmo oficial de firma de Zadarma:
        // Firma = Base64_encode(HMAC_SHA256(Method + QueryString + MD5(QueryString), Secret))
        $md5Query = md5($queryString);
        $signaturePayload = $method . $queryString . $md5Query;
        
        $signature = base64_encode(hash_hmac('sha256', $signaturePayload, $this->secret));
        $authHeader = $this->key . ':' . $signature;

        try {
            if (strtoupper($httpVerb) === 'POST') {
                $response = Http::withHeaders([
                    'Authorization' => $authHeader,
                    'Accept' => 'application/json',
                ])->post($this->baseUrl . $method, $params);
            } else {
                $response = Http::withHeaders([
                    'Authorization' => $authHeader,
                    'Accept' => 'application/json',
                ])->get($this->baseUrl . $method, $params);
            }

            if ($response->failed()) {
                Log::warning("Zadarma API error en llamada a {$method}:", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [
                    'status' => 'error',
                    'code' => $response->status(),
                    'message' => $response->json('message') ?? 'Error en la API de Zadarma.'
                ];
            }

            return $response->json();

        } catch (\Exception $e) {
            Log::critical("Excepción crítica conectando con la API de Zadarma a {$method}:", [
                'error' => $e->getMessage()
            ]);
            return [
                'status' => 'error',
                'message' => 'Fallo de red o excepción crítica de Zadarma: ' . $e->getMessage()
            ];
        }
    }
}
