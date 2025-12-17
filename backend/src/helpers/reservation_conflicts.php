<?php

/**
 * Verifica si existen reservas que choquen con el rango horario del torneo
 * Devuelve null si no hay conflictos, o array con detalle si hay
 */
function reservation_conflicts_for_tournament(
    PDO $pdo,
    int $courtId,
    string $startDate,
    string $endDate,
    string $startTime,
    string $endTime
): ?array {
    $stmt = $pdo->prepare("
        SELECT
            reserved_date,
            start_time,
            end_time
        FROM reservations
        WHERE court_id = :court_id
          AND status IN ('pending','confirmed','in_progress','completed')
          AND reserved_date BETWEEN :start_date AND :end_date
          AND NOT (
                end_time <= :start_time
                OR start_time >= :end_time
          )
        ORDER BY reserved_date, start_time
        LIMIT 1
    ");

    $stmt->execute([
        'court_id'   => $courtId,
        'start_date' => $startDate,
        'end_date'   => $endDate,
        'start_time' => $startTime,
        'end_time'   => $endTime,
    ]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        return [
            'error' =>
                "Conflicto con una reserva existente el "
                . "{$row['reserved_date']} "
                . "de {$row['start_time']} a {$row['end_time']}"
        ];
    }

    return null;
}
