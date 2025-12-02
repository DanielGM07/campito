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
    $userId = auth_require_login();
    $input = get_json_input();

    $required = ['court_id', 'reserved_date', 'start_time', 'end_time', 'players_count', 'type'];
    foreach ($required as $r) {
        if (!isset($input[$r]) || $input[$r] === '') {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $courtId       = (int)$input['court_id'];
    $reservedDate  = $input['reserved_date']; // YYYY-MM-DD
    $startTime     = $input['start_time'];    // HH:MM:SS
    $endTime       = $input['end_time'];      // HH:MM:SS
    $playersCount  = (int)$input['players_count'];
    $type          = $input['type'];
    $teamId        = isset($input['team_id']) ? (int)$input['team_id'] : null;

    // 👉 Validación de fecha FUTURA o HOY pero con horario futuro
    $now = new DateTime("now", new DateTimeZone("America/Argentina/Buenos_Aires"));
    $slotStart = new DateTime("$reservedDate $startTime", new DateTimeZone("America/Argentina/Buenos_Aires"));

    if ($slotStart < $now) {
        json_response(['error' => 'No se permiten reservas en fechas/horarios pasados'], 400);
    }

    // Verificar que la cancha exista
    $stmt = $pdo->prepare("SELECT * FROM courts WHERE id = :id AND status = 'active'");
    $stmt->execute(['id' => $courtId]);
    $court = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$court) {
        json_response(['error' => 'Cancha no encontrada'], 404);
    }

    // Precio
    $pricePerHour = (float)$court['price_per_hour'];
    $totalPrice   = $pricePerHour;
    $pricePerPlayer = $totalPrice / max($playersCount, 1);

    // 👉 Verificar que NO esté reservado el mismo rango
    $stmt = $pdo->prepare("
        SELECT id FROM reservations
        WHERE court_id = :court_id
          AND reserved_date = :reserved_date
          AND status IN ('pending', 'confirmed', 'in_progress', 'completed')
          AND (
                start_time < :end_time
                AND end_time > :start_time
              )
    ");
    $stmt->execute([
        'court_id'      => $courtId,
        'reserved_date' => $reservedDate,
        'start_time'    => $startTime,
        'end_time'      => $endTime,
    ]);

    if ($stmt->fetch()) {
        json_response(['error' => 'El horario ya está reservado'], 400);
    }

    // Insertar reserva
    $stmt = $pdo->prepare("
        INSERT INTO reservations
        (court_id, player_id, team_id, reserved_date, start_time, end_time,
         total_price, price_per_player, players_count, type, status)
        VALUES
        (:court_id, :player_id, :team_id, :reserved_date, :start_time, :end_time,
         :total_price, :price_per_player, :players_count, :type, 'confirmed')
    ");

    $stmt->execute([
        'court_id'        => $courtId,
        'player_id'       => $userId,
        'team_id'         => $teamId,
        'reserved_date'   => $reservedDate,
        'start_time'      => $startTime,
        'end_time'        => $endTime,
        'total_price'     => $totalPrice,
        'price_per_player'=> $pricePerPlayer,
        'players_count'   => $playersCount,
        'type'            => $type,
    ]);

    json_response(['message' => 'Reserva creada correctamente'], 201);
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

// NUEVO: listar reservas de las canchas del proveedor logueado
// function reservation_list_by_provider_controller(PDO $pdo): void
// {
//     $userId = auth_require_login();

//     // Verificar que sea proveedor
//     $me = user_find_by_id($pdo, $userId);
//     if (!$me || !$me['is_provider']) {
//         json_response(['error' => 'No autorizado'], 403);
//     }

//     // Buscar perfil de proveedor
//     $provider = provider_find_by_user($pdo, $userId);
//     if (!$provider) {
//         json_response(['error' => 'No se encontró perfil de proveedor'], 404);
//     }

//     $sql = "
//         SELECT 
//             r.*,
//             c.name       AS court_name,
//             c.sport      AS court_sport,
//             u.first_name AS player_first_name,
//             u.last_name  AS player_last_name
//         FROM reservations r
//         INNER JOIN courts c ON c.id = r.court_id
//         INNER JOIN users u  ON u.id = r.player_id
//         WHERE c.provider_id = :provider_id
//         ORDER BY r.reserved_date DESC, r.start_time DESC
//     ";

//     $stmt = $pdo->prepare($sql);
//     $stmt->execute(['provider_id' => $provider['id']]);
//     $rows = $stmt->fetchAll();

//     json_response(['reservations' => $rows]);
// }

function court_availability_list_controller(PDO $pdo): void
{
    auth_require_login();
    $input = get_json_input();

    if (empty($input['court_id']) || empty($input['date'])) {
        json_response(['error' => 'court_id y date son requeridos'], 400);
    }

    $courtId = (int)$input['court_id'];
    $date    = $input['date'];

    // Validar formato de fecha simple
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dt || $dt->format('Y-m-d') !== $date) {
        json_response(['error' => 'Formato de fecha inválido, usar YYYY-MM-DD'], 400);
    }

    // weekday: 0 (domingo) a 6 (sábado) como en court_time_slots
    $weekday = (int)$dt->format('w');

    // 1) Buscar todos los slots base configurados para esa cancha y día
    $sqlSlots = "
        SELECT
            id,
            start_time,
            end_time,
            is_available
        FROM court_time_slots
        WHERE court_id = :court_id
          AND weekday = :weekday
          AND is_available = 1
        ORDER BY start_time ASC
    ";
    $stmtSlots = $pdo->prepare($sqlSlots);
    $stmtSlots->execute([
        ':court_id' => $courtId,
        ':weekday'  => $weekday,
    ]);
    $slots = $stmtSlots->fetchAll(PDO::FETCH_ASSOC) ?: [];

    if (empty($slots)) {
        // No hay configuración de horarios para esa cancha / día
        json_response(['slots' => []]);
    }

    // 2) Reservas ya hechas para ese día y cancha
    // Consideramos ocupados los estados: pending, confirmed, in_progress, completed
    $sqlRes = "
        SELECT
            start_time,
            end_time
        FROM reservations
        WHERE court_id = :court_id
          AND reserved_date = :reserved_date
          AND status IN ('pending', 'confirmed', 'in_progress', 'completed')
    ";
    $stmtRes = $pdo->prepare($sqlRes);
    $stmtRes->execute([
        ':court_id'      => $courtId,
        ':reserved_date' => $date,
    ]);
    $reservations = $stmtRes->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // 3) Marcar slots ocupados según superposición de horarios
    $resultSlots = [];

    foreach ($slots as $slot) {
        $slotStart = $slot['start_time']; // "HH:MM:SS"
        $slotEnd   = $slot['end_time'];   // "HH:MM:SS"

        $available = true;

        foreach ($reservations as $res) {
            $resStart = $res['start_time'];
            $resEnd   = $res['end_time'];

            // Superposición: inicio del slot < fin de reserva && fin del slot > inicio de reserva
            if ($slotStart < $resEnd && $slotEnd > $resStart) {
                $available = false;
                break;
            }
        }

        $resultSlots[] = [
            'id'           => (int)$slot['id'],
            'start_time'   => $slotStart,
            'end_time'     => $slotEnd,
            'is_available' => $available,
        ];
    }

    json_response(['slots' => $resultSlots]);
}

// =========================================================
// ADMIN: LISTAR TODAS LAS RESERVAS
// action = admin_reservation_list
// =========================================================
function admin_reservation_list_controller(PDO $pdo): void
{
    $adminId = auth_require_login();
    $me = user_find_by_id($pdo, $adminId);

    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    try {
        $rows = reservation_find_all_for_admin($pdo);

        // transformar nombres para frontend
        $reservations = array_map(function ($r) {
            return [
                "id" => $r["id"],
                "date" => $r["date"],
                "start_time" => $r["start_time"],
                "end_time" => $r["end_time"],
                "status" => $r["status"],

                "player_id" => $r["player_id"],
                "player_name" => $r["player_first_name"] . " " . $r["player_last_name"],
                "player_email" => $r["player_email"],

                "provider_id" => $r["provider_id"],
                "provider_name" => $r["provider_name"],

                "court_id" => $r["court_id"],
                "court_name" => $r["court_name"],
            ];
        }, $rows);

        json_response([
            "reservations" => $reservations
        ]);

    } catch (Throwable $e) {
        error_log($e->getMessage());
        json_response(
            ['error' => 'Error al obtener reservas'],
            500
        );
    }
}

// ======================================================
// RESERVAS DEL PROVEEDOR (todas sus canchas)
// ======================================================
function reservation_list_by_provider_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    // Debe ser proveedor
    $me = user_find_by_id($pdo, $userId);
    if (!$me || !$me['is_provider']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    // Perfil proveedor
    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No tienes perfil de proveedor'], 404);
    }

    // Obtener reservas de TODAS sus canchas
    $sql = "
        SELECT 
            r.*,
            c.name AS court_name,
            c.sport AS court_sport,
            u.first_name,
            u.last_name
        FROM reservations r
        INNER JOIN courts c ON c.id = r.court_id
        INNER JOIN users u ON u.id = r.player_id
        WHERE c.provider_id = :pid
        ORDER BY r.reserved_date DESC, r.start_time DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['pid' => $provider['id']]);
    $rows = $stmt->fetchAll();

    json_response(['reservations' => $rows]);
}