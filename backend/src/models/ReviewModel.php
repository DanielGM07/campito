<?php
// File: backend/src/models/ReviewModel.php

function review_can_create_for_reservation(PDO $pdo, int $reservationId, int $playerId): bool
{
    $sql = "SELECT r.*, c.provider_id
            FROM reservations r
            INNER JOIN courts c ON c.id = r.court_id
            WHERE r.id = :id AND r.player_id = :player_id AND r.status = 'completed'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'id'         => $reservationId,
        'player_id'  => $playerId,
    ]);
    $res = $stmt->fetch();
    return (bool)$res;
}

function review_create(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO reviews
        (reservation_id, player_id, provider_id, court_id, rating, comment)
        VALUES
        (:reservation_id, :player_id, :provider_id, :court_id, :rating, :comment)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'reservation_id' => $data['reservation_id'],
        'player_id'      => $data['player_id'],
        'provider_id'    => $data['provider_id'],
        'court_id'       => $data['court_id'],
        'rating'         => $data['rating'],
        'comment'        => $data['comment'],
    ]);

    return (int)$pdo->lastInsertId();
}

function review_find_by_reservation_and_player(PDO $pdo, int $reservationId, int $playerId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM reviews WHERE reservation_id = :rid AND player_id = :pid LIMIT 1");
    $stmt->execute([
        'rid' => $reservationId,
        'pid' => $playerId,
    ]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function review_list_by_court(PDO $pdo, int $courtId): array
{
    $sql = "SELECT rv.*, u.first_name, u.last_name
            FROM reviews rv
            INNER JOIN users u ON u.id = rv.player_id
            WHERE rv.court_id = :id
            ORDER BY rv.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $courtId]);
    return $stmt->fetchAll();
}

function review_average_by_court(PDO $pdo, int $courtId): ?float
{
    $stmt = $pdo->prepare("SELECT AVG(rating) AS avg_rating FROM reviews WHERE court_id = :id");
    $stmt->execute(['id' => $courtId]);
    $row = $stmt->fetch();
    return $row && $row['avg_rating'] !== null ? (float)$row['avg_rating'] : null;
}
