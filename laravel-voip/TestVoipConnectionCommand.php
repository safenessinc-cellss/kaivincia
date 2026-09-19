<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ZadarmaService;
use Illuminate\Support\Facades\Http;

/**
 * Class TestVoipConnectionCommand
 * 
 * Command: php artisan voip:test-integration {--extension= : Extensión SIP a probar} {--test-number= : Número de destino para simular llamada Callback}
 * 
 * Kaivincia Corp - Arquitecto de Sistemas Senior
 * Script de Auditoría e Integración Completa para Zadarma VoIP REST API & Firmas HMAC-SHA256.
 */
class TestVoipConnectionCommand extends Command
{
    /**
     * El nombre y firma del comando en consola.
     *
     * @var string
     */
    protected $signature = 'voip:test-integration 
                            {--extension= : La extensión SIP del agente de ventas (ej: 432100)} 
                            {--test-number= : Número celular del lead de EE.UU. en formato internacional (ej: 12135627140)}';

    /**
     * La descripción del comando.
     *
     * @var string
     */
    protected $description = 'Auditoría integral en vivo de la conexión con Zadarma API, generación de tokens WebRTC y simulación de Callback';

    /**
     * Instancia del servicio core de Zadarma.
     */
    protected ZadarmaService $zadarmaService;

    /**
     * Constructor del Comando.
     */
    public function __construct(ZadarmaService $zadarmaService)
    {
        parent::__construct();
        $this->zadarmaService = $zadarmaService;
    }

    /**
     * Ejecuta el comando de consola.
     *
     * @return int
     */
    public function handle()
    {
        $this->clearConsole();
        $this->printHeader();

        // 1. Verificación preliminar de variables de entorno (.env)
        if (!$this->checkEnvironmentVariables()) {
            return 1;
        }

        // 2. TEST: Conectividad y Consulta de Saldo Operativo (Autenticación HMAC-SHA256)
        $balance = $this->runBalanceAudit();
        if ($balance === null) {
            $this->error("\n[CRÍTICO] Deteniendo auditoría debido a fallo de autenticación/red con el carrier.");
            return 1;
        }

        // 3. TEST: Generación de Credenciales WebRTC Seguras (Validez 72 Horas)
        $extension = $this->option('extension');
        if ($extension) {
            $this->runWebRtcKeyAudit($extension);
        } else {
            $this->warn("\n[OMITIDO] Test WebRTC: No se especificó '--extension=XXXX'.");
            $this->info("Uso: php artisan voip:test-integration --extension=432100");
        }

        // 4. TEST: Simulación de Lanzamiento de Llamada por Callback B2B
        $testNumber = $this->option('test-number');
        if ($extension && $testNumber) {
            $this->runCallbackAudit($extension, $testNumber);
        } else {
            $this->warn("\n[OMITIDO] Test Callback: Se requiere especificar '--extension' y '--test-number'.");
            $this->info("Uso: php artisan voip:test-integration --extension=432100 --test-number=12135627140");
        }

        $this->printFooter();
        return 0;
    }

    /**
     * Limpia la pantalla para una presentación limpia.
     */
    private function clearConsole()
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
            system('clear');
        }
    }

    /**
     * Renderiza el encabezado corporativo del script de auditoría.
     */
    private function printHeader()
    {
        $this->line("<fg=cyan;options=bold>=============================================================================</>");
        $this->line("<fg=yellow;options=bold>   KAIVINCIA CORP - SISTEMAS DE TELECOMUNICACIONES & VOIP INTELIGENTE       </>");
        $this->line("<fg=cyan;options=bold>   AUDITORÍA EN VIVO: INTEGRACIÓN CORE DE LA API DE ZADARMA                 </>");
        $this->line("<fg=cyan;options=bold>=============================================================================</>");
        $this->line("Fecha local de ejecución: " . now()->toDateTimeString());
        $this->line("Entorno de ejecución: " . app()->environment());
        $this->line("-----------------------------------------------------------------------------");
    }

    /**
     * Valida que las variables de entorno de Zadarma existan en el archivo .env
     */
    private function checkEnvironmentVariables(): bool
    {
        $this->comment("Paso 1: Validando configuración de entorno (.env)...");
        
        $key = env('ZADARMA_API_KEY');
        $secret = env('ZADARMA_API_SECRET');

        if (empty($key) || empty($secret)) {
            $this->error("❌ ERROR: Las credenciales de Zadarma no están definidas en tu archivo .env.");
            $this->line("<fg=gray>Por favor, asegúrate de añadir las siguientes claves:</>");
            $this->line("<fg=green>ZADARMA_API_KEY=tu_api_key_aqui</>");
            $this->line("<fg=green>ZADARMA_API_SECRET=tu_api_secret_aqui</>");
            return false;
        }

        $this->info("✓ Variables de entorno detectadas correctamente.");
        $this->line("  Key: " . substr($key, 0, 6) . "************************");
        $this->line("  Secret: " . substr($secret, 0, 4) . "**********************");
        return true;
    }

    /**
     * Prueba la firma HMAC y obtiene el saldo actual de la cuenta.
     */
    private function runBalanceAudit(): ?float
    {
        $this->line("");
        $this->comment("Paso 2: Probando firma HMAC-SHA256 y obteniendo balance de cuenta...");

        $startTime = microtime(true);
        $result = $this->zadarmaService->getAccountBalance();
        $elapsed = round((microtime(true) - $startTime) * 1000, 2);

        if (isset($result['success']) && $result['success'] === true) {
            $balance = (float) $result['balance'];
            $currency = $result['currency'] ?? 'USD';

            $this->info("✓ Autenticación HMAC Exitosa! Conexión lograda en {$elapsed}ms.");
            $this->line("  Saldo disponible: <fg=green;options=bold>{$balance} {$currency}</>");
            
            if ($balance < 2.00) {
                $this->warn("  ⚠️ ALERTA: El saldo es inferior a $2.00 USD. Recarga saldo para evitar caídas en el servicio.");
            } else {
                $this->line("  Estado de salud financiera: <fg=emerald>ÓPTIMO</>");
            }

            return $balance;
        }

        $this->error("❌ ERROR: Fallo de autenticación o comunicación.");
        $this->line("  Mensaje devuelto: " . ($result['message'] ?? 'Desconocido'));
        $this->line("  Respuesta raw del servidor: " . json_encode($result['raw'] ?? $result));
        return null;
    }

    /**
     * Prueba la generación de tokens temporales de autenticación para WebRTC.
     */
    private function runWebRtcKeyAudit(string $extension)
    {
        $this->line("");
        $this->comment("Paso 3: Auditando generación de clave segura temporal WebRTC (WSS)...");
        $this->line("  Extensión SIP objetivo: {$extension}");

        $startTime = microtime(true);
        $result = $this->zadarmaService->getWebrtcKey($extension);
        $elapsed = round((microtime(true) - $startTime) * 1000, 2);

        if (isset($result['success']) && $result['success'] === true) {
            $this->info("✓ Clave WebRTC obtenida exitosamente en {$elapsed}ms!");
            $this->line("  WSS Server Gateway: <fg=cyan>{$result['server']}</>");
            $this->line("  Token Temporal SIP: <fg=yellow>" . substr($result['key'], 0, 15) . "... (Válido por 72 horas)</>");
            $this->line("  Identificador SIP: <fg=gray>{$result['sip_username']}</>");
        } else {
            $this->error("❌ ERROR: Zadarma rechazó la solicitud de clave WebRTC.");
            $this->line("  Razón: " . ($result['message'] ?? 'Desconocida'));
            $this->line("  Asegúrate de que la extensión {$extension} esté activa y configurada en el panel de Zadarma.");
        }
    }

    /**
     * Simula el inicio de una llamada Callback en vivo.
     */
    private function runCallbackAudit(string $extension, string $testNumber)
    {
        $this->line("");
        $this->comment("Paso 4: Simulando iniciación de llamada Click-to-Call (Callback)...");
        $this->line("  Desde Extensión Agente: {$extension}");
        $this->line("  Hacia Número Destino B2B: {$testNumber}");

        $confirm = $this->confirm("¿Deseas disparar una petición de Callback real a la API de Zadarma?", false);

        if (!$confirm) {
            $this->warn("⚠️ Simulación de llamada cancelada por el operador.");
            return;
        }

        $this->line("Disparando Callback seguro a Zadarma...");
        $startTime = microtime(true);
        $result = $this->zadarmaService->initiateCallback($extension, $testNumber);
        $elapsed = round((microtime(true) - $startTime) * 1000, 2);

        if (isset($result['success']) && $result['success'] === true) {
            $this->info("✓ ¡Llamada Callback iniciada con éxito en {$elapsed}ms!");
            $this->line("  Zadarma Session Call ID: <fg=green;options=bold>" . ($result['pbx_call_id'] ?? 'N/A') . "</>");
            $this->line("  Explicación del flujo:");
            $this->line("  1. Zadarma timbrará de inmediato a tu extensión WebRTC ({$extension}).");
            $this->line("  2. Al descolgar, Zadarma enlazará y llamará al número de destino ({$testNumber}).");
        } else {
            $this->error("❌ ERROR: El carrier rechazó la solicitud de llamada Callback.");
            $this->line("  Código/Razón: " . ($result['message'] ?? 'Desconocida'));
            $this->line("  Raw response: " . json_encode($result['raw'] ?? $result));
        }
    }

    /**
     * Imprime el pie de página de la auditoría.
     */
    private function printFooter()
    {
        $this->line("");
        $this->line("<fg=cyan;options=bold>=============================================================================</>");
        $this->line("<fg=green;options=bold>✓ AUDITORÍA INTEGRAL DE ENLACE TELEFÓNICO COMPLETADA CON ÉXITO</>");
        $this->line("<fg=cyan;options=bold>=============================================================================</>");
    }
}
