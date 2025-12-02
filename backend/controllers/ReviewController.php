<?php
// File: backend/src/controllers/ReviewController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/ReviewModel.php';
require_once __DIR__ . '/../models/ReservationModel.php';
require_once __DIR__ . '/../models/CourtModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';

function review_create_controller(PDO $pdo): void
{
    $playerId = auth_require_login();
    $input    = get_json_input();

    $required = ['reservation_id', 'rating'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $reservationId = (int)$input['reservation_id'];
    if ($reservationId <= 0) {
        json_response(['error' => 'reservation_id inválido'], 400);
    }

    $reservation = reservation_find_by_id($pdo, $reservationId);
    if (!$reservation || (int)$reservation['player_id'] !== $playerId) {
        json_response(['error' => 'Reserva no encontrada'], 404);
    }

    if ($reservation['status'] !== 'completed') {
        json_response(['error' => 'Solo puedes calificar reservas completadas'], 400);
    }

    if (review_find_by_reservation_and_player($pdo, $reservationId, $playerId)) {
        json_response(['error' => 'Ya has calificado esta reserva'], 400);
    }

    $rating = (int)$input['rating'];
    if ($rating < 1 || $rating > 5) {
        json_response(['error' => 'Rating debe estar entre 1 y 5'], 400);
    }

    $court = court_find_by_id($pdo, (int)$reservation['court_id']);
    if (!$court) {
        json_response(['error' => 'Cancha no encontrada'], 404);
    }
    $provider = provider_find_by_id($pdo, (int)$court['provider_id']);
    if (!$provider) {
        json_response(['error' => 'Proveedor no encontrado'], 404);
    }

    $id = review_create($pdo, [
        'reservation_id' => $reservationId,
        'player_id'      => $playerId,
        'provider_id'    => (int)$provider['id'],
        'court_id'       => (int)$court['id'],
        'rating'         => $rating,
        'comment'        => $input['comment'] ?? null,
    ]);

    json_response([
        'message' => 'Reseña creada',
        'review_id' => $id,
    ], 201);
}

function review_list_by_court_controller(PDO $pdo): void
{
    if (empty($_GET['court_id'])) {
        json_response(['error' => 'court_id requerido'], 400);
    }
    $courtId = (int)$_GET['court_id'];
    $reviews = review_list_by_court($pdo, $courtId);
    $avg     = review_average_by_court($pdo, $courtId);
    json_response([
        'average_rating' => $avg,
        'reviews'        => $reviews,
    ]);
}
