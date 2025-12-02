<?php
// File: backend/src/models/PromotionModel.php

function promotion_list_available_for_player(PDO $pdo, int $playerId): array
{
    $wallet = wallet_get_or_create($pdo, $playerId);
    $points = (int)$wallet['points_balance'];

    $today = date('Y-m-d');

    $sql = "SELECT p.*,
                   CASE WHEN p.min_points <= :points THEN 1 ELSE 0 END AS can_redeem
            FROM promotions p
            WHERE p.valid_from <= :today
              AND p.valid_to >= :today";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'points' => $points,
        'today'  => $today,
    ]);
    return $stmt->fetchAll();
}

function promotion_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM promotions WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function promotion_redemption_create(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO promotion_redemptions
        (promotion_id, player_id, reservation_id, tournament_id, points_spent, discount_applied)
        VALUES
        (:promotion_id, :player_id, :reservation_id, :tournament_id, :points_spent, :discount_applied)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'promotion_id'    => $data['promotion_id'],
        'player_id'       => $data['player_id'],
        'reservation_id'  => $data['reservation_id'],
        'tournament_id'   => $data['tournament_id'],
        'points_spent'    => $data['points_spent'],
        'discount_applied'=> $data['discount_applied'],
    ]);
    return (int)$pdo->lastInsertId();
}
