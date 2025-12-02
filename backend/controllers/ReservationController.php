<?php
// File: backend/src/controllers/ReservationController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';
require_once __DIR__ . '/../models/CourtModel.php';
require_once __DIR__ . '/../models/ReservationModel.php';

function reservation_create_controller(PDO $pdo): void
{
    $playerId = auth_require_login();
    $user     = user_find_by_id($pdo, $playerId);
    if (!$user || !$user['is_player']) {
        json_response(['error' => 'No eres jugador'], 403);
    }

    $input = get_json_input();

    $required = ['court_id', 'reserved_date', 'start_time', 'end_time', 'players_count', 'type'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $court = court_find_by_id($pdo, (int)$input['court_id']);
    if (!$court || $court['status'] !== 'active') {
        json_response(['error' => 'Cancha no disponible'], 400);
    }

    $date  = $input['reserved_date']; // formato Y-m-d
    $start = $input['start_time'];    // HH:MM:SS
    $end   = $input['end_time'];

    if (strtotime("$date $start") <= time()) {
        json_response(['error' => 'No se permiten reservas en fechas/horarios pasados'], 400);
    }

    if (reservation_has_overlap_for_court($pdo, (int)$court['id'], $date, $start, $end)) {
        json_response(['error' => 'Horario ocupado para esta cancha'], 400);
    }

    if (reservation_conflicts_with_tournament($pdo, (int)$court['id'], $date, $start, $end)) {
        json_response(['error' => 'No se puede reservar en horario de torneo'], 400);
    }

    if (reservation_has_overlap_for_player($pdo, $playerId, $date, $start, $end)) {
        json_response(['error' => 'Ya tienes una reserva en ese horario'], 400);
    }

    $weekCount = reservation_weekly_count_for_player($pdo, $playerId, $date);
    if ($weekCount >= 3) {
        json_response(['error' => 'Límite de 3 reservas por semana alcanzado'], 400);
    }

    $playersCount = (int)$input['players_count'];
    if ($playersCount <= 0 || $playersCount > (int)$court['max_players']) {
        json_response(['error' => 'Cantidad de jugadores inválida para la cancha'], 400);
    }

    $type = $input['type'] === 'team' ? 'team' : 'individual';
    $teamId = null;
    if ($type === 'team') {
        if (empty($input['team_id'])) {
            json_response(['error' => 'team_id requerido para reservas de equipo'], 400);
        }
        $teamId = (int)$input['team_id'];
    }

    $hours = (strtotime($end) - strtotime($start)) / 3600;
    if ($hours <= 0) {
        json_response(['error' => 'Horario inválido'], 400);
    }

    $totalPrice      = $hours * (float)$court['price_per_hour'];
    $pricePerPlayer  = $totalPrice / $playersCount;

    $id = reservation_create($pdo, [
        'court_id'        => (int)$court['id'],
        'player_id'       => $playerId,
        'team_id'         => $teamId,
        'reserved_date'   => $date,
        'start_time'      => $start,
        'end_time'        => $end,
        'total_price'     => $totalPrice,
        'price_per_player'=> $pricePerPlayer,
        'players_count'   => $playersCount,
        'type'            => $type,
        'status'          => 'pending',
    ]);

    $reservation = reservation_find_by_id($pdo, $id);

    json_response([
        'message'     => 'Reserva creada',
        'reservation' => $reservation,
    ], 201);
}

function reservation_list_my_controller(PDO $pdo): void
{
    $playerId = auth_require_login();
    $reservas = reservation_list_by_player($pdo, $playerId);

    json_response(['reservations' => $reservas]);
}

function reservation_cancel_my_controller(PDO $pdo): void
{
    $playerId = auth_require_login();
    $input    = get_json_input();

    if (empty($input['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }

    $res = reservation_find_by_id($pdo, (int)$input['id']);
    if (!$res || (int)$res['player_id'] !== $playerId) {
        json_response(['error' => 'Reserva no encontrada'], 404);
    }

    if ($res['status'] === 'cancelled') {
        json_response(['error' => 'La reserva ya está cancelada'], 400);
    }

    reservation_update_status($pdo, (int)$res['id'], 'cancelled');

    json_response(['message' => 'Reserva cancelada']);
}

function reservation_update_time_my_controller(PDO $pdo): void
{
    $playerId = auth_require_login();
    $input    = get_json_input();

    $required = ['id', 'reserved_date', 'start_time', 'end_time'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $res = reservation_find_by_id($pdo, (int)$input['id']);
    if (!$res || (int)$res['player_id'] !== $playerId) {
        json_response(['error' => 'Reserva no encontrada'], 404);
    }

    $date  = $input['reserved_date'];
    $start = $input['start_time'];
    $end   = $input['end_time'];

    if (strtotime("$date $start") <= time()) {
        json_response(['error' => 'Solo se pueden modificar reservas futuras'], 400);
    }

    if (reservation_has_overlap_for_court($pdo, (int)$res['court_id'], $date, $start, $end)) {
        json_response(['error' => 'Horario ocupado para esta cancha'], 400);
    }

    if (reservation_conflicts_with_tournament($pdo, (int)$res['court_id'], $date, $start, $end)) {
        json_response(['error' => 'No se puede reservar en horario de torneo'], 400);
    }

    if (reservation_has_overlap_for_player($pdo, $playerId, $date, $start, $end)) {
        json_response(['error' => 'Ya tienes una reserva en ese horario'], 400);
    }

    reservation_update_time($pdo, (int)$res['id'], $date, $start, $end);

    $updated = reservation_find_by_id($pdo, (int)$res['id']);

    json_response([
        'message'     => 'Reserva modificada',
        'reservation' => $updated,
    ]);
}
