<?php

namespace App\Helpers;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Class TimezoneValidator
 * 
 * Arquitecto de Sistemas Senior - Validador de Zonas Horarias B2B
 * Mapea códigos de área de EE.UU. a sus respectivas zonas horarias geográficas
 * para garantizar cumplimiento con las regulaciones de telecomunicaciones y optimizar conversiones.
 */
class TimezoneValidator
{
    /**
     * Catálogo maestro de códigos de área de EE.UU. integrados y sus zonas horarias de IANA.
     */
    protected static array $areaCodeMap = [
        // California - PT (Pacific Time - America/Los_Angeles)
        '213' => ['state' => 'California', 'city' => 'Los Ángeles Downtown', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        '562' => ['state' => 'California', 'city' => 'Long Beach', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        '714' => ['state' => 'California', 'city' => 'Anaheim / Orange County', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        '909' => ['state' => 'California', 'city' => 'San Bernardino', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        '951' => ['state' => 'California', 'city' => 'Riverside', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        '323' => ['state' => 'California', 'city' => 'Los Ángeles Este/Oeste', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        '310' => ['state' => 'California', 'city' => 'Santa Mónica / Beverly Hills', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        '619' => ['state' => 'California', 'city' => 'San Diego', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        '760' => ['state' => 'California', 'city' => 'Oceanside / Palm Springs', 'timezone' => 'America/Los_Angeles', 'label' => 'PT (Pacífico)'],
        
        // Colorado - MT (Mountain Time - America/Denver)
        '720' => ['state' => 'Colorado', 'city' => 'Denver', 'timezone' => 'America/Denver', 'label' => 'MT (Montaña)'],
        '303' => ['state' => 'Colorado', 'city' => 'Denver / Boulder', 'timezone' => 'America/Denver', 'label' => 'MT (Montaña)'],
        '970' => ['state' => 'Colorado', 'city' => 'Fort Collins / Grand Junction', 'timezone' => 'America/Denver', 'label' => 'MT (Montaña)'],
        
        // New York - ET (Eastern Time - America/New_York)
        '631' => ['state' => 'New York', 'city' => 'Long Island / Suffolk County', 'timezone' => 'America/New_York', 'label' => 'ET (Este)'],
        '212' => ['state' => 'New York', 'city' => 'Manhattan', 'timezone' => 'America/New_York', 'label' => 'ET (Este)'],
        '718' => ['state' => 'New York', 'city' => 'Brooklyn / Queens / Bronx', 'timezone' => 'America/New_York', 'label' => 'ET (Este)'],
        '917' => ['state' => 'New York', 'city' => 'NYC Cellphones', 'timezone' => 'America/New_York', 'label' => 'ET (Este)'],
        
        // New Jersey - ET (Eastern Time - America/New_York)
        '856' => ['state' => 'New Jersey', 'city' => 'Camden / Cherry Hill', 'timezone' => 'America/New_York', 'label' => 'ET (Este)'],
        '201' => ['state' => 'New Jersey', 'city' => 'Jersey City / Hackensack', 'timezone' => 'America/New_York', 'label' => 'ET (Este)'],
        '973' => ['state' => 'New Jersey', 'city' => 'Newark / Paterson', 'timezone' => 'America/New_York', 'label' => 'ET (Este)'],
    ];

    /**
     * Valida si un número de cliente se encuentra en horario recomendado para llamadas.
     * Rango de Horario Seguro: 9:00 AM a 8:00 PM hora local del lead.
     *
     * @param string $phoneNumber Número de teléfono internacional (ej: "+12135550199" o "12135550199")
     * @return array Estructura de auditoría y validación
     */
    public static function validate(string $phoneNumber): array
    {
        // Limpiar el número para dejar solo dígitos
        $digits = preg_replace('/\D/', '', $phoneNumber);

        // Extraer código de área de EE.UU.
        // Los números de EE.UU. tienen 10 dígitos (más prefijo "1" de país opcional)
        // Ejemplo: "12135550199" (11 dígitos) o "2135550199" (10 dígitos)
        $areaCode = '';
        if (strlen($digits) === 11 && str_starts_with($digits, '1')) {
            $areaCode = substr($digits, 1, 3);
        } elseif (strlen($digits) === 10) {
            $areaCode = substr($digits, 0, 3);
        } else {
            // Si el número tiene otra longitud, intentar extraer los primeros 3 caracteres como fallback
            $areaCode = substr($digits, 0, 3);
        }

        // Obtener el mapeo de zona horaria
        if (!isset(self::$areaCodeMap[$areaCode])) {
            return [
                'success' => true,
                'area_code' => $areaCode,
                'covered' => false,
                'state' => 'Desconocido',
                'city' => 'Desconocido',
                'timezone' => 'UTC',
                'local_time' => Carbon::now('UTC')->toDateTimeString(),
                'is_safe' => true, // Por defecto permitir llamadas para evitar bloqueos falsos
                'message' => "Código de área ({$areaCode}) no mapeado. Operación autorizada con precaución estándar."
            ];
        }

        $info = self::$areaCodeMap[$areaCode];
        $tz = $info['timezone'];

        // Obtener la hora actual en la zona horaria del cliente
        $clientTime = Carbon::now($tz);
        $hour = $clientTime->hour;
        $minute = $clientTime->minute;

        // Horario Seguro: 9:00 AM (inclusive) a 8:00 PM (exclusive, de 09:00 a 19:59)
        $isSafe = ($hour >= 9 && $hour < 20);

        return [
            'success' => true,
            'area_code' => $areaCode,
            'covered' => true,
            'state' => $info['state'],
            'city' => $info['city'],
            'timezone' => $tz,
            'timezone_label' => $info['label'],
            'local_time' => $clientTime->format('Y-m-d h:i A'),
            'hour_24' => $hour,
            'is_safe' => $isSafe,
            'recommendation' => $isSafe ? 'SEGURO' : 'ADVERTENCIA_NO_RECOMENDADO',
            'message' => $isSafe 
                ? "El cliente está en {$info['city']}, {$info['state']}. La hora actual es {$clientTime->format('h:i A')} ({$info['label']}). Es seguro llamar."
                : "¡ATENCIÓN! El cliente está en {$info['city']}, {$info['state']}. La hora actual es {$clientTime->format('h:i A')} ({$info['label']}). Está fuera del horario seguro (9:00 AM - 8:00 PM)."
        ];
    }
}
