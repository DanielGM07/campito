<?php

/**
 * Verifica que, para un rango de fechas y horas,
 * la cancha tenga disponibilidad configurada en TODOS los días.
 *
 * Devuelve:
 *  - null si todo está OK
 *  - array con error detallado si falla
 */
function court_validate_schedule_for_range(
    PDO $pdo,
    int $courtId,
    string $startDate,
    string $endDate,
    string $startTime,
    string $endTime
): ?array {
    $start = new DateTime($startDate);
    $end   = new DateTime($endDate);

    // Traer todos los slots de la cancha
    $stmt = $pdo->prepare("
        SELECT weekday, start_time, end_time
        FROM court_time_slots
        WHERE court_id = :court_id
          AND is_available = 1
    ");
    $stmt->execute(['court_id' => $courtId]);
    $slots = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$slots) {
        return [
            'error' => 'La cancha no tiene horarios configurados'
        ];
    }

    // Indexar por weekday
    $byDay = [];
    foreach ($slots as $s) {
        $byDay[(int)$s['weekday']][] = $s;
    }

    // Recorrer cada día del rango
    for ($d = clone $start; $d <= $end; $d->modify('+1 day')) {
        $weekday = (int)$d->format('w');

        if (!isset($byDay[$weekday])) {
            return [
                'error' => "La cancha no tiene horarios el día {$d->format('Y-m-d')}"
            ];
        }

        $okForDay = false;

        foreach ($byDay[$weekday] as $slot) {
            if (
                $slot['start_time'] <= $startTime &&
                $slot['end_time']   >= $endTime
            ) {
                $okForDay = true;
                break;
            }
        }

        if (!$okForDay) {
            return [
                'error' =>
                    "Horario inválido el {$d->format('Y-m-d')} "
                    . "(la cancha no abre de {$startTime} a {$endTime})"
            ];
        }
    }

    return null;
}
