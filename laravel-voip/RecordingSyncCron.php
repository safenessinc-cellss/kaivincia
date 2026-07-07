<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\ZadarmaService;

/**
 * Class RecordingSyncCron
 * 
 * Command: php artisan voip:sync-recordings
 * 
 * Arquitecto de Sistemas Senior - Sincronizador de Multimedia VoIP
 * Este script se programa mediante un cronjob para ejecutarse de forma asíncrona.
 * Se encarga de verificar las llamadas completadas del CRM que aún no tienen vinculada su grabación
 * de voz y las solicita de forma segura a Zadarma.
 */
class RecordingSyncCron extends Command
{
    /**
     * El nombre y firma del comando de consola.
     */
    protected $signature = 'voip:sync-recordings {--limit=50 : Cantidad máxima de registros a procesar por lote}';

    /**
     * Descripción del comando.
     */
    protected $description = 'Sincroniza grabaciones de voz de Zadarma para llamadas que aún no disponen de enlace directo';

    protected ZadarmaService $zadarmaService;

    public function __construct(ZadarmaService $zadarmaService)
    {
        parent::__construct();
        $this->zadarmaService = $zadarmaService;
    }

    /**
     * Ejecutar el comando de consola.
     */
    public function handle()
    {
        $limit = (int) $this->option('limit');
        $this->info("Iniciando Sincronización de Grabaciones Zadarma (Límite: {$limit} registros)...");

        // Buscar llamadas completadas con duración mayor a 5 segundos que no tengan enlace de grabación
        // y que tengan menos de 48 horas de antigüedad (las grabaciones se borran o procesan de inmediato).
        $pendingCalls = DB::table('call_logs')
            ->where('status', 'completed')
            ->where('duration_seconds', '>', 5)
            ->whereNull('recording_url')
            ->where('created_at', '>=', now()->subDays(2))
            ->limit($limit)
            ->get();

        if ($pendingCalls->isEmpty()) {
            $this->info("No se encontraron registros de llamadas pendientes de sincronización.");
            return 0;
        }

        $syncCount = 0;
        $failCount = 0;

        foreach ($pendingCalls as $call) {
            $this->comment("Consultando grabación para Call ID: {$call->pbx_call_id} (Agente ID: {$call->agent_id})");

            try {
                // Solicitar enlace de descarga de grabación a Zadarma
                // Zadarma utiliza el Call ID original o con el sufijo '_rec' si fue grabada por canal de extensión
                $recordingUrl = $this->zadarmaService->obtenerGrabacionUrl($call->pbx_call_id);

                if ($recordingUrl) {
                    DB::table('call_logs')
                        ->where('id', $call->id)
                        ->update([
                            'recording_url' => $recordingUrl,
                            'is_recorded' => true,
                            'updated_at' => now()
                        ]);

                    $this->info("✓ Grabación sincronizada con éxito para ID {$call->pbx_call_id}");
                    $syncCount++;
                } else {
                    $this->warn("Grabación no disponible aún en Zadarma para ID {$call->pbx_call_id}");
                    $failCount++;
                }

            } catch (\Exception $e) {
                $this->error("Error de sincronización en ID {$call->pbx_call_id}: " . $e->getMessage());
                Log::error("Fallo de sincronización de audio Zadarma:", [
                    'call_id' => $call->pbx_call_id,
                    'error' => $e->getMessage()
                ]);
                $failCount++;
            }

            // Pausa de cortesía (throttle) para no saturar los límites de peticiones (Rate Limit) de la API de Zadarma
            usleep(250000); // 250ms
        }

        $this->info("Sincronización finalizada. Éxito: {$syncCount}, Pendientes/Fallo: {$failCount}.");
        return 0;
    }
}
