<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Class ZadarmaService
 * 
 * Arquitecto de Sistemas Senior - Integrador VoIP Zadarma
 * Clase central para interactuar con la API REST de Zadarma.
 * Genera firmas dinámicas basadas en algoritmos HMAC-SHA256 según el estándar oficial.
 */
class ZadarmaService
{
    protected string $key;
    protected string $secret;
    protected string $baseUrl;

    public function __construct()
    {
        $this->key = config('services.zadarma.key') ?? env('ZADARMA_API_KEY', '');
        $this->secret = config('services.zadarma.secret') ?? env('ZADARMA_API_SECRET', '');
        $this->baseUrl = 'https://api.zadarma.com';
    }

    /**
     * Iniciar Llamada utilizando el método Callback de Zadarma.
     * Realiza un Callback (Llamada de retorno) que primero timbra en la extensión del agente
     * y, al contestar, se conecta automáticamente con el lead.
     *
     * @param string $from Extensión SIP del agente (ej: "12345" o número asignado)
     * @param string $to Número telefónico del cliente/lead (formato internacional sin "+", ej: "12135550199")
     * @param string|null $sipId Clave opcional para identificar la transacción en nuestra base de datos
     * @return array
     */
    public function iniciarLlamada(string $from, string $to, ?string $sipId = null): array
    {
        $params = [
            'from' => preg_replace('/\D/', '', $from),
            'to' => preg_replace('/\D/', '', $to),
        ];

        if ($sipId) {
            $params['sip_id'] = $sipId; // Para amarrar con Zadarma SIP ID específico
        }

        // Zadarma API endpoint para Callback
        $method = '/v1/request/callback/';

        return $this->sendRequest($method, $params, 'GET');
    }

    /**
     * Obtener el estado de los canales activos (Llamadas en curso).
     *
     * @return array
     */
    public function obtenerEstadoLlamadas(): array
    {
        return $this->sendRequest('/v1/pbx/state/', [], 'GET');
    }

    /**
     * Obtener la tarifa y costo estimado para un número de destino.
     *
     * @param string $number Número de destino (ej: "12135550199")
     * @return array
     */
    public function obtenerTarifaDestino(string $number): array
    {
        return $this->sendRequest('/v1/tariffs/price/', ['number' => preg_replace('/\D/', '', $number)], 'GET');
    }

    /**
     * Activar o desactivar grabación de llamada en tiempo real para una extensión SIP activa.
     *
     * @param string $sipId Extensión SIP o ID de canal
     * @param bool $status True para iniciar, False para detener
     * @return array
     */
    public function grabarLlamada(string $sipId, bool $status = true): array
    {
        $params = [
            'sip_id' => $sipId,
            'status' => $status ? 'on' : 'off'
        ];

        return $this->sendRequest('/v1/pbx/record/', $params, 'GET');
    }

    /**
     * Obtener el link de descarga de una grabación de llamada específica de Zadarma.
     *
     * @param string $pbxCallId ID único de la llamada en Zadarma
     * @return string|null Url de descarga del archivo .mp3
     */
    public function obtenerGrabacionUrl(string $pbxCallId): ?string
    {
        $response = $this->sendRequest('/v1/pbx/record/request/', [
            'call_id_with_rec' => $pbxCallId
        ], 'GET');

        if (isset($response['status']) && $response['status'] === 'success') {
            return $response['link'] ?? null;
        }

        return null;
    }

    /**
     * Envía la petición HTTP HTTP-REST firmada a Zadarma.
     * Zadarma requiere firma HMAC en el header: 'Authorization: KEY:SIGNATURE'
     * donde SIGNATURE es base64_encode(hash_hmac('sha256', $method . $params_sorted_str . md5($params_sorted_str), $secret))
     */
    protected function sendRequest(string $method, array $params = [], string $httpVerb = 'GET'): array
    {
        if (empty($this->key) || empty($this->secret)) {
            Log::error('Zadarma API: Faltan credenciales clave/secreto en el entorno.');
            return ['status' => 'error', 'message' => 'Credenciales VoIP Zadarma no configuradas.'];
        }

        // Ordenar parámetros alfabéticamente
        ksort($params);
        $queryString = http_build_query($params);

        // Algoritmo de firma oficial de Zadarma
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
                Log::warning('Zadarma API Error Response:', [
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
            Log::critical('Fallo de conexión crítico con la API Zadarma:', [
                'exception' => $e->getMessage(),
                'method' => $method
            ]);
            return [
                'status' => 'error',
                'message' => 'Fallo crítico de conexión con la red de Zadarma: ' . $e->getMessage()
            ];
        }
    }
}
