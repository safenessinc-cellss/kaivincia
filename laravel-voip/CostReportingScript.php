<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Class CostReportingScript
 * 
 * CRM VoIP Analytics Engine
 * 
 * Genera reportes de consumo telefónico y costos operativos para el Panel de Control
 * y Monitoreo de Kaivincia Corp. Basado en la tarifa Zadarma de $0.012/minuto.
 */
class CostReportingScript
{
    /**
     * Generar un reporte consolidado de llamadas y costos para un rango de fechas.
     *
     * @param string|null $startDate Fecha inicio (formato Y-m-d, ej: '2026-07-01')
     * @param string|null $endDate Fecha fin (formato Y-m-d, ej: '2026-07-07')
     * @param int|null $agentId ID de agente opcional para reporte individual
     * @return array Estructura de métricas analíticas
     */
    public function generarReporteConsumo(?string $startDate = null, ?string $endDate = null, ?int $agentId = null): array
    {
        // Rango por defecto: Últimos 30 días si no se especifican fechas
        $start = $startDate ? Carbon::parse($startDate)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $end = $endDate ? Carbon::parse($endDate)->endOfDay() : Carbon::now()->endOfDay();

        // 1. Consulta base de filtros
        $query = DB::table('call_logs')
            ->whereBetween('start_time', [$start, $end]);

        if ($agentId) {
            $query->where('agent_id', $agentId);
        }

        // Obtener clones de la consulta para calcular estadísticas específicas
        $totalCalls = (clone $query)->count();
        $outgoingCalls = (clone $query)->where('direction', 'outbound')->count();
        $incomingCalls = (clone $query)->where('direction', 'incoming')->count();

        // Llamadas Contestadas
        $answeredCalls = (clone $query)->where('disposition', 'answered')->count();
        
        // Tasa de Conexión (Answer Rate)
        $connectionRate = $totalCalls > 0 ? round(($answeredCalls / $totalCalls) * 100, 2) : 0.00;

        // Sumatoria de Duración en Segundos y Minutos Hablados
        $totalDurationSec = (clone $query)->where('disposition', 'answered')->sum('duration_seconds');
        $totalMinutes = round($totalDurationSec / 60, 2);

        // Promedio de Duración de Llamada Contestada (AHT - Average Handling Time)
        $avgDurationSec = $answeredCalls > 0 ? round($totalDurationSec / $answeredCalls, 1) : 0;
        $avgDurationFormatted = gmdate("i:s", $avgDurationSec);

        // Costo Total Real y Estimado
        // Zadarma rate: $0.012 por minuto
        $totalCost = (clone $query)->sum('cost');

        // Si los costos de la base de datos están en cero, calculamos un estimado del negocio
        if ($totalCost <= 0) {
            $totalCost = round($totalMinutes * 0.012, 4);
        }

        // 2. Rendimiento y costos agrupados por agente
        $agentStatsQuery = DB::table('call_logs')
            ->join('agent_sip_configs', 'call_logs.sip_extension', '=', 'agent_sip_configs.sip_username')
            ->select(
                'call_logs.agent_id',
                'agent_sip_configs.sip_username',
                DB::raw('COUNT(call_logs.id) as total_llamadas'),
                DB::raw("SUM(CASE WHEN call_logs.disposition = 'answered' THEN 1 ELSE 0 END) as contestadas"),
                DB::raw('SUM(call_logs.duration_seconds) as duracion_total_segundos'),
                DB::raw('SUM(call_logs.cost) as costo_total')
            )
            ->whereBetween('call_logs.start_time', [$start, $end]);

        if ($agentId) {
            $agentStatsQuery->where('call_logs.agent_id', $agentId);
        }

        $agentStats = $agentStatsQuery
            ->groupBy('call_logs.agent_id', 'agent_sip_configs.sip_username')
            ->get()
            ->map(function ($item) {
                $itemMinutes = round($item->duracion_total_segundos / 60, 2);
                $calculatedCost = $item->costo_total > 0 ? $item->costo_total : round($itemMinutes * 0.012, 4);
                
                return [
                    'agent_id' => $item->agent_id,
                    'sip_extension' => $item->sip_username,
                    'total_calls' => $item->total_llamadas,
                    'answered_calls' => $item->contestadas,
                    'connection_rate' => $item->total_llamadas > 0 ? round(($item->contestadas / $item->total_llamadas) * 100, 2) . '%' : '0%',
                    'minutes_talked' => $itemMinutes,
                    'avg_call_duration' => $item->contestadas > 0 ? gmdate("i:s", round($item->duracion_total_segundos / $item->contestadas)) : '00:00',
                    'total_cost_usd' => round($calculatedCost, 4)
                ];
            });

        // 3. Distribución horaria de llamadas (Picos de tráfico para dimensionamiento)
        $hourlyDistribution = DB::table('call_logs')
            ->select(DB::raw('EXTRACT(HOUR FROM start_time) as hora'), DB::raw('COUNT(id) as volumen'))
            ->whereBetween('start_time', [$start, $end])
            ->groupBy(DB::raw('EXTRACT(HOUR FROM start_time)'))
            ->orderBy('hora')
            ->get()
            ->pluck('volumen', 'hora')
            ->toArray();

        return [
            'period' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
            'summary' => [
                'total_calls' => $totalCalls,
                'outgoing_calls' => $outgoingCalls,
                'incoming_calls' => $incomingCalls,
                'answered_calls' => $answeredCalls,
                'unanswered_calls' => $totalCalls - $answeredCalls,
                'connection_rate_percent' => $connectionRate,
                'total_minutes_billed' => $totalMinutes,
                'avg_handling_time_seconds' => $avgDurationSec,
                'avg_handling_time_formatted' => $avgDurationFormatted,
                'total_cost_usd' => round($totalCost, 4)
            ],
            'agents' => $agentStats,
            'hourly_load' => $hourlyDistribution,
            'pricing_basis' => 'Zadarma Outbound Rate: $0.012/min fixed flat rate'
        ];
    }
}
