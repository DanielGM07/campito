<?php
// File: backend/src/controllers/CourtController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/time.php';

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';
require_once __DIR__ . '/../models/CourtModel.php';
require_once __DIR__ . '/../models/CourtTimeSlotModel.php';

function provider_require_role(PDO $pdo, int $userId): array
{
    $user = user_find_by_id($pdo, $userId);
    if (!$user || !$user['is_provider']) {
        json_response(['error' => 'No eres proveedor'], 403);
    }

    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No tienes perfil de proveedor'], 403);
    }

    return $provider;
}

function court_create_controller(PDO $pdo): void
{
    $userId   = auth_require_login();
    $provider = provider_require_role($pdo, $userId);

    $input = get_json_input();

    $required = ['name', 'sport', 'price_per_hour', 'max_players'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $data = [
        'provider_id'       => (int) $provider['id'],
        'name'              => $input['name'],
        'sport'             => $input['sport'],
        'price_per_hour'    => (float) $input['price_per_hour'],
        'max_players'       => (int) $input['max_players'],
        'internal_location' => $input['internal_location'] ?? null,
        'status'            => $input['status'] ?? 'active',
        'photos_json'       => isset($input['photos']) ? json_encode($input['photos']) : null,
    ];

    $id = court_create($pdo, $data);
    $created = court_find_by_id($pdo, $id);

    json_response([
        'message' => 'Cancha creada',
        'court'   => $created,
    ], 201);
}

function court_update_controller(PDO $pdo): void
{
    $userId   = auth_require_login();
    $provider = provider_require_role($pdo, $userId);

    $input = get_json_input();

    if (empty($input['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }

    $court = court_find_by_id($pdo, (int) $input['id']);
    if (!$court || (int)$court['provider_id'] !== (int)$provider['id']) {
        json_response(['error' => 'Cancha no encontrada'], 404);
    }

    $data = [
        'name'              => $input['name']              ?? $court['name'],
        'sport'             => $input['sport']             ?? $court['sport'],
        'price_per_hour'    => isset($input['price_per_hour']) ? (float)$input['price_per_hour'] : (float)$court['price_per_hour'],
        'max_players'       => isset($input['max_players']) ? (int)$input['max_players'] : (int)$court['max_players'],
        'internal_location' => $input['internal_location'] ?? $court['internal_location'],
        'status'            => $input['status']            ?? $court['status'],
        'photos_json'       => isset($input['photos']) ? json_encode($input['photos']) : $court['photos_json'],
    ];

    court_update($pdo, (int)$court['id'], $data);
    $updated = court_find_by_id($pdo, (int)$court['id']);

    json_response([
        'message' => 'Cancha actualizada',
        'court'   => $updated,
    ]);
}

function court_delete_controller(PDO $pdo): void
{
    $userId   = auth_require_login();
    $provider = provider_require_role($pdo, $userId);

    $input = get_json_input();

    if (empty($input['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }

    $court = court_find_by_id($pdo, (int) $input['id']);
    if (!$court || (int)$court['provider_id'] !== (int)$provider['id']) {
        json_response(['error' => 'Cancha no encontrada'], 404);
    }

    court_soft_delete($pdo, (int)$court['id']);
    json_response(['message' => 'Cancha eliminada (baja lógica)']);
}

function court_list_by_provider_controller(PDO $pdo): void
{
    $userId   = auth_require_login();
    $provider = provider_require_role($pdo, $userId);

    $courts = court_list_by_provider($pdo, (int)$provider['id']);
    json_response(['courts' => $courts]);
}

function court_search_public_controller(PDO $pdo): void
{
    auth_require_login();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $input = $_GET;
    } else {
        $input = get_json_input();
    }

    $sport    = isset($input['sport']) && $input['sport'] !== '' ? $input['sport'] : null;
    $location = isset($input['location']) && $input['location'] !== '' ? $input['location'] : null;

    $sql = "
        SELECT
            c.id,
            c.name,
            c.sport,
            c.price_per_hour,
            c.max_players,
            c.internal_location,
            c.status,
            p.id          AS provider_id,
            p.venue_name  AS provider_name,
            p.address     AS provider_address,
            p.status      AS provider_status
        FROM courts c
        INNER JOIN providers p ON p.id = c.provider_id
        WHERE
            c.status = 'active'
            AND p.status = 'active'
    ";

    $params = [];

    if ($sport !== null) {
        $sql .= " AND c.sport = :sport";
        $params[':sport'] = $sport;
    }

    if ($location !== null) {
        $sql .= " AND (p.address LIKE :loc OR c.internal_location LIKE :loc)";
        $params[':loc'] = '%' . $location . '%';
    }

    $sql .= " ORDER BY p.venue_name ASC, c.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $courts = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    json_response(['courts' => $courts]);
}

// Verifica ownership por proveedor
function court_require_owned_by_provider(PDO $pdo, int $courtId, int $userId): void
{
    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No se encontró perfil de proveedor'], 404);
    }

    $stmt = $pdo->prepare("SELECT * FROM courts WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $courtId]);
    $court = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$court || (int)$court['provider_id'] !== (int)$provider['id']) {
        json_response(['error' => 'No tienes permiso sobre esta cancha'], 403);
    }
}

// LISTAR slots (todas las canchas del proveedor)
function court_timeslots_list_by_court_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $me = user_find_by_id($pdo, $userId);
    if (!$me || !$me['is_provider']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No se encontró perfil de proveedor'], 404);
    }

    $sql = "
        SELECT
            ts.*,
            c.name AS court_name,
            c.sport AS court_sport,
            c.id   AS court_id
        FROM court_time_slots ts
        INNER JOIN courts c ON c.id = ts.court_id
        WHERE c.provider_id = :provider_id
        ORDER BY c.id ASC, ts.weekday ASC, ts.start_time ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['provider_id' => $provider['id']]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    json_response(['slots' => $rows]);
}

// CREAR slot de 1 hora (validado)
function court_timeslot_create_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $me = user_find_by_id($pdo, $userId);
    if (!$me || !$me['is_provider']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $input = get_json_input();

    $required = ['court_id', 'weekday', 'start_time', 'end_time'];
    foreach ($required as $r) {
        if (!isset($input[$r]) || $input[$r] === '') {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $courtId = (int)$input['court_id'];
    court_require_owned_by_provider($pdo, $courtId, $userId);

    $weekday = (int)$input['weekday'];
    if ($weekday < 0 || $weekday > 6) {
        json_response(['error' => 'weekday debe ser un número entre 0 (domingo) y 6 (sábado)'], 400);
    }

    $start = normalize_hour_time((string)$input['start_time']);
    $end   = normalize_end_time_allow_24((string)$input['end_time']);

    $sHour = hour_time_to_int($start);
    $eHour = hour_time_to_int($end);

    if ($eHour <= $sHour) {
        json_response(['error' => 'end_time debe ser mayor que start_time'], 400);
    }
    if (($eHour - $sHour) !== 1) {
        json_response(['error' => 'El turno debe ser de 1 hora exacta'], 400);
    }
    if (court_timeslot_overlaps($pdo, $courtId, $weekday, $start, $end)) {
        json_response(['error' => 'Este horario se solapa con otro ya cargado'], 400);
    }

    try {
        $id = court_timeslot_create($pdo, [
            'court_id'    => $courtId,
            'weekday'     => $weekday,
            'start_time'  => $start,
            'end_time'    => $end,
            'is_available'=> 1,
        ]);

        json_response([
            'message' => 'Horario creado correctamente',
            'id'      => $id,
        ], 201);
    } catch (Throwable $e) {
        json_response(['error' => 'No se pudo crear el horario (posible duplicado)'], 400);
    }
}

// BULK CREATE por rango (se parte en slots de 1h)
function court_timeslots_bulk_create_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $me = user_find_by_id($pdo, $userId);
    if (!$me || !$me['is_provider']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $input = get_json_input();
    if (empty($input['court_id']) || !isset($input['weekday']) || empty($input['range'])) {
        json_response(['error' => 'court_id, weekday y range son requeridos'], 400);
    }

    $courtId = (int)$input['court_id'];
    court_require_owned_by_provider($pdo, $courtId, $userId);

    $weekday = (int)$input['weekday'];
    if ($weekday < 0 || $weekday > 6) {
        json_response(['error' => 'weekday debe ser 0..6'], 400);
    }

    $range = $input['range'];
    if (empty($range['start_time']) || empty($range['end_time'])) {
        json_response(['error' => 'range.start_time y range.end_time son requeridos'], 400);
    }

    $start = normalize_hour_time((string)$range['start_time']);
    $end   = normalize_end_time_allow_24((string)$range['end_time']);

    $sHour = hour_time_to_int($start);
    $eHour = hour_time_to_int($end);

    if ($eHour <= $sHour) {
        json_response(['error' => 'end_time debe ser mayor que start_time'], 400);
    }

    $slots = [];
    for ($h = $sHour; $h < $eHour; $h++) {
        $slotStart = sprintf('%02d:00:00', $h);
        $slotEnd   = ($h + 1 === 24) ? '24:00:00' : sprintf('%02d:00:00', $h + 1);
        $slots[] = ['start_time' => $slotStart, 'end_time' => $slotEnd];
    }

    try {
        $result = court_timeslots_bulk_create($pdo, $courtId, $weekday, $slots);
        json_response([
            'message' => 'Rango procesado',
            'created' => $result['created'],
            'skipped_existing' => $result['skipped_existing'],
        ], 201);
    } catch (Throwable $e) {
        error_log($e->getMessage());
        json_response(['error' => 'No se pudo procesar el rango'], 500);
    }
}

// ELIMINAR slot
function court_timeslot_delete_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $me = user_find_by_id($pdo, $userId);
    if (!$me || !$me['is_provider']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $input = get_json_input();
    if (empty($input['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM court_time_slots WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => (int)$input['id']]);
    $slot = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$slot) {
        json_response(['error' => 'Horario no encontrado'], 404);
    }

    court_require_owned_by_provider($pdo, (int)$slot['court_id'], $userId);
    court_timeslot_delete($pdo, (int)$input['id']);

    json_response(['message' => 'Horario eliminado correctamente']);
}
