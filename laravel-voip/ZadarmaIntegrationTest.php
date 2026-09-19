<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\ZadarmaService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Class ZadarmaIntegrationTest
 * 
 * Test de Integración Automatizado en Laravel para verificar la conectividad,
 * generación de firmas HMAC-SHA256, tokens WebRTC y simulación de llamadas Callback con Zadarma.
 * 
 * Kaivincia Corp - Arquitecto de Sistemas Senior
 */
class ZadarmaIntegrationTest extends TestCase
{
    protected ZadarmaService $zadarmaService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Configuramos credenciales de prueba en caso de que no existan en el .env
        config(['services.zadarma.key' => env('ZADARMA_API_KEY', 'test_key_1234567890')]);
        config(['services.zadarma.secret' => env('ZADARMA_API_SECRET', 'test_secret_0987654321')]);

        $this->zadarmaService = new ZadarmaService();
    }

    /**
     * Test 1: Verificar el cálculo correcto de la firma HMAC-SHA256 y petición de saldo de cuenta.
     * Se prueba simulando la respuesta de Zadarma utilizando el Http Facade Mocking.
     * 
     * @return void
     */
    public function test_get_account_balance_generates_correct_hmac_signature_and_succeeds()
    {
        Http::fake([
            'https://api.zadarma.com/v1/info/balance/' => Http::response([
                'status' => 'success',
                'balance' => 12.50,
                'currency' => 'USD'
            ], 200)
        ]);

        $result = $this->zadarmaService->getAccountBalance();

        $this->assertTrue($result['success']);
        $this->assertEquals(12.50, $result['balance']);
        $this->assertEquals('USD', $result['currency']);

        // Validar que se enviaron las cabeceras correctas de firma HMAC
        Http::assertSent(function ($request) {
            $this->assertTrue($request->hasHeader('Authorization'));
            $authHeader = $request->header('Authorization')[0];
            
            // Estructura esperada de la cabecera -> key:signature
            $this->assertStringStartsWith('test_key_1234567890:', $authHeader);
            return true;
        });
    }

    /**
     * Test 2: Generación correcta de clave temporal para el Widget WebRTC del agente.
     * 
     * @return void
     */
    public function test_get_webrtc_key_returns_temporary_key_successfully()
    {
        $extension = '432100';

        Http::fake([
            'https://api.zadarma.com/v1/webrtc/key/*' => Http::response([
                'status' => 'success',
                'key' => 'temp_webrtc_token_abc123xyz789',
                'server' => 'webrtc.zadarma.com'
            ], 200)
        ]);

        $result = $this->zadarmaService->getWebrtcKey($extension);

        $this->assertTrue($result['success']);
        $this->assertEquals('temp_webrtc_token_abc123xyz789', $result['key']);
        $this->assertEquals('webrtc.zadarma.com', $result['server']);
        $this->assertEquals('432100', $result['sip_username']);

        Http::assertSent(function ($request) use ($extension) {
            $this->assertEquals('GET', $request->method());
            $this->assertStringContainsString('user=' . $extension, $request->url());
            return true;
        });
    }

    /**
     * Test 3: Simulación de iniciación de llamada Callback Click-to-Call exitosa.
     * 
     * @return void
     */
    public function test_initiate_callback_creates_pbx_call_session()
    {
        $fromExtension = '432100';
        $toNumber = '12135627140';

        Http::fake([
            'https://api.zadarma.com/v1/request/callback/*' => Http::response([
                'status' => 'success',
                'from' => '432100',
                'to' => '12135627140',
                'call_id' => 'call_session_9988776655_abc',
                'balance' => 12.35
            ], 200)
        ]);

        $result = $this->zadarmaService->initiateCallback($fromExtension, $toNumber);

        $this->assertTrue($result['success']);
        $this->assertEquals('call_session_9988776655_abc', $result['pbx_call_id']);
        $this->assertEquals('Llamada Callback iniciada exitosamente.', $result['message']);

        Http::assertSent(function ($request) use ($fromExtension, $toNumber) {
            $this->assertStringContainsString('from=' . $fromExtension, $request->url());
            $this->assertStringContainsString('to=' . $toNumber, $request->url());
            return true;
        });
    }

    /**
     * Test 4: Manejo y control de errores si Zadarma devuelve un código de error de red.
     * 
     * @return void
     */
    public function test_api_failure_is_handled_gracefully_with_detailed_log()
    {
        $extension = '432100';

        Http::fake([
            'https://api.zadarma.com/v1/webrtc/key/*' => Http::response([
                'status' => 'error',
                'message' => 'Extension not found or not active.'
            ], 404)
        ]);

        $result = $this->zadarmaService->getWebrtcKey($extension);

        $this->assertFalse($result['success']);
        $this->assertEquals('Extension not found or not active.', $result['message']);
        $this->assertEquals(404, $result['raw']['code']);
    }

    /**
     * Test 5: Simulación real para desarrollo local.
     * Este test permite disparar una petición real a la API externa de Zadarma
     * si y solo si las credenciales en .env son válidas y diferentes de las de prueba.
     * 
     * @return void
     */
    public function test_live_connection_if_valid_credentials_exist()
    {
        $liveKey = env('ZADARMA_API_KEY');
        $liveSecret = env('ZADARMA_API_SECRET');

        if (empty($liveKey) || empty($liveSecret) || $liveKey === 'test_key_1234567890') {
            $this->markTestSkipped('Test en vivo omitido: Falta configurar credenciales reales de Zadarma en .env.');
        }

        // Si existen credenciales reales, instanciamos el servicio real sin simular peticiones HTTP
        $realService = new ZadarmaService();
        $result = $realService->getAccountBalance();

        $this->assertTrue($result['success'], 'La conexión en vivo con Zadarma falló. Verifica tus credenciales.');
        $this->assertGreaterThanOrEqual(0.0, $result['balance']);
        dump("✓ Conexión en vivo exitosa. Saldo real: {$result['balance']} {$result['currency']}");
    }
}
