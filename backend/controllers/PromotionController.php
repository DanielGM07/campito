<?php
// File: backend/src/controllers/PromotionController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/WalletModel.php';
require_once __DIR__ . '/../models/PromotionModel.php';

function promotion_list_available_controller(PDO $pdo): void
{
    $playerId   = auth_require_login();
    $list       = promotion_list_available_for_player($pdo, $playerId);
    json_response(['promotions' => $list]);
}

function promotion_redeem_controller(PDO $pdo): void
{
    $playerId = auth_require_login();
    $input    = get_json_input();

    $required = ['promotion_id', 'points_spent', 'discount_applied'];
    foreach ($required as $r) {
        if (!isset($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $promotion = promotion_find_by_id($pdo, (int)$input['promotion_id']);
    if (!$promotion) {
        json_response(['error' => 'Promoción no encontrada'], 404);
    }

    $wallet = wallet_get_or_create($pdo, $playerId);
    $pointsBalance = (int)$wallet['points_balance'];
    $pointsSpent   = (int)$input['points_spent'];

    if ($pointsSpent <= 0 || $pointsSpent > $pointsBalance) {
        json_response(['error' => 'Puntos insuficientes'], 400);
    }

    if ($pointsSpent < (int)$promotion['min_points']) {
        json_response(['error' => 'No cumples el mínimo de puntos para esta promoción'], 400);
    }

    $reservationId = isset($input['reservation_id']) ? (int)$input['reservation_id'] : null;
    $tournamentId  = isset($input['tournament_id'])  ? (int)$input['tournament_id']  : null;

    $pdo->beginTransaction();
    try {
        $walletId = (int)$wallet['id'];

        wallet_add_transaction(
            $pdo,
            $walletId,
            'points',
            -$pointsSpent,
            'Canje de promoción',
            $reservationId,
            $tournamentId
        );

        $redemptionId = promotion_redemption_create($pdo, [
            'promotion_id'     => (int)$promotion['id'],
            'player_id'        => $playerId,
            'reservation_id'   => $reservationId,
            'tournament_id'    => $tournamentId,
            'points_spent'     => $pointsSpent,
            'discount_applied' => (float)$input['discount_applied'],
        ]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_response(['error' => 'No se pudo canjear la promoción'], 500);
    }

    json_response([
        'message'        => 'Promoción canjeada',
        'redemption_id'  => $redemptionId,
    ]);
}
