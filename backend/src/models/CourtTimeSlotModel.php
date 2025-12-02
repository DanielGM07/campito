<?php
// File: backend/src/models/CourtTimeSlotModel.php

function court_timeslot_create(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO court_time_slots (court_id, weekday, start_time, end_time, is_available)
            VALUES (:court_id, :weekday, :start_time, :end_time, :is_available)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'court_id'    => $data['court_id'],
        'weekday'     => $data['weekday'],
        'start_time'  => $data['start_time'],
        'end_time'    => $data['end_time'],
        'is_available'=> $data['is_available'] ?? 1,
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
    $stmt->execute(['court_id' => $courtId]);
    return $stmt->fetchAll();
}

function court_timeslot_delete(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare("DELETE FROM court_time_slots WHERE id = :id");
    $stmt->execute(['id' => $id]);
}
