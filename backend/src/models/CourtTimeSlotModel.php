<?php
// File: backend/src/models/CourtTimeSlotModel.php

function court_timeslot_exists(PDO $pdo, int $courtId, int $weekday, string $startTime, string $endTime): bool
{
    $sql = "SELECT 1
            FROM court_time_slots
            WHERE court_id = :court_id
              AND weekday  = :weekday
              AND start_time = :start_time
              AND end_time   = :end_time
            LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':court_id'   => $courtId,
        ':weekday'    => $weekday,
        ':start_time' => $startTime,
        ':end_time'   => $endTime,
    ]);
    return (bool)$stmt->fetchColumn();
}

function court_timeslot_overlaps(PDO $pdo, int $courtId, int $weekday, string $startTime, string $endTime): bool
{
    // overlap: start < existing_end AND end > existing_start
    $sql = "SELECT 1
            FROM court_time_slots
            WHERE court_id = :court_id
              AND weekday  = :weekday
              AND is_available = 1
              AND (start_time < :end_time AND end_time > :start_time)
            LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':court_id'   => $courtId,
        ':weekday'    => $weekday,
        ':start_time' => $startTime,
        ':end_time'   => $endTime,
    ]);
    return (bool)$stmt->fetchColumn();
}

function court_timeslot_create(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO court_time_slots (court_id, weekday, start_time, end_time, is_available)
            VALUES (:court_id, :weekday, :start_time, :end_time, :is_available)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':court_id'      => $data['court_id'],
        ':weekday'       => $data['weekday'],
        ':start_time'    => $data['start_time'],
        ':end_time'      => $data['end_time'],
        ':is_available'  => $data['is_available'] ?? 1,
    ]);
    return (int)$pdo->lastInsertId();
}

function court_timeslot_find_by_court(PDO $pdo, int $courtId): array
{
    $stmt = $pdo->prepare("
        SELECT *
        FROM court_time_slots
        WHERE court_id = :court_id
        ORDER BY weekday ASC, start_time ASC
    ");
    $stmt->execute([':court_id' => $courtId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function court_timeslot_delete(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare("DELETE FROM court_time_slots WHERE id = :id");
    $stmt->execute([':id' => $id]);
}

/**
 * Bulk create: recibe slots [ ['start_time'=>'HH:00:00','end_time'=>'HH+1:00:00'], ... ]
 * Inserta ignorando duplicados (por UNIQUE KEY uq_court_weekday_slot).
 */
function court_timeslots_bulk_create(PDO $pdo, int $courtId, int $weekday, array $slots): array
{
    $created = [];
    $skipped = [];

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO court_time_slots (court_id, weekday, start_time, end_time, is_available)
            VALUES (:court_id, :weekday, :start_time, :end_time, 1)
        ");

        foreach ($slots as $s) {
            $start = $s['start_time'];
            $end   = $s['end_time'];

            if (court_timeslot_exists($pdo, $courtId, $weekday, $start, $end)) {
                $skipped[] = ['start_time' => $start, 'end_time' => $end];
                continue;
            }

            $stmt->execute([
                ':court_id'   => $courtId,
                ':weekday'    => $weekday,
                ':start_time' => $start,
                ':end_time'   => $end,
            ]);

            if ((int)$stmt->rowCount() === 1) {
                $created[] = ['start_time' => $start, 'end_time' => $end];
            } else {
                $skipped[] = ['start_time' => $start, 'end_time' => $end];
            }
        }

        $pdo->commit();

        return [
            'created' => $created,
            'skipped_existing' => $skipped,
        ];
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function court_timeslots_list_for_court_weekday(PDO $pdo, int $courtId, int $weekday): array
{
    $stmt = $pdo->prepare("
        SELECT start_time, end_time
        FROM court_time_slots
        WHERE court_id = :court_id
          AND weekday  = :weekday
          AND is_available = 1
        ORDER BY start_time ASC
    ");
    $stmt->execute([
        ':court_id' => $courtId,
        ':weekday'  => $weekday,
    ]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}
