<?php
// File: backend/src/controllers/CourtController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';
require_once __DIR__ . '/../models/CourtModel.php';
require_once __DIR__ . '/../models/CourtTimeSlotModel.php'; // 👈 NUEVO

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
        'photos_json'       => isset($input['photos'])
            ? json_encode($input['photos'])
            : $court['photos_json'],
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
    // Solo jugadores logueados (opcional, pero consistente con el resto)
    auth_require_login();

    // Soportar tanto GET como POST por si acaso
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

    // Orden: primero por venue, después por nombre de cancha
    $sql .= " ORDER BY p.venue_name ASC, c.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $courts = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    json_response([
        'courts' => $courts,
    ]);
}

// NUEVO: helper para validar que la cancha pertenece al proveedor logueado
function court_require_owned_by_provider(PDO $pdo, int $courtId, int $userId): void
{
    // Buscar perfil de proveedor
    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No se encontró perfil de proveedor'], 404);
    }

    // Verificar que la cancha sea del proveedor
    $stmt = $pdo->prepare("SELECT * FROM courts WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $courtId]);
    $court = $stmt->fetch();

    if (!$court || (int)$court['provider_id'] !== (int)$provider['id']) {
        json_response(['error' => 'No tienes permiso sobre esta cancha'], 403);
    }
}

// NUEVO: listar time slots por cancha
function court_timeslots_list_by_court_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $me = user_find_by_id($pdo, $userId);
    if (!$me || !$me['is_provider']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    // Buscar perfil de proveedor
    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No se encontró perfil de proveedor'], 404);
    }

    // 👉 YA NO PEDIMOS court_id. Traemos TODOS los horarios
    // de TODAS las canchas de este proveedor.
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
    $rows = $stmt->fetchAll();

    json_response(['slots' => $rows]);
}


// NUEVO: crear time slot
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

    // TODO: podrías validar solapamiento de horarios, por ahora lo dejamos simple

    $id = court_timeslot_create($pdo, [
        'court_id'    => $courtId,
        'weekday'     => $weekday,
        'start_time'  => $input['start_time'],
        'end_time'    => $input['end_time'],
        'is_available'=> 1,
    ]);

    json_response([
        'message' => 'Horario creado correctamente',
        'id'      => $id,
    ], 201);
}

// NUEVO: eliminar time slot
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

    // Verificar ownership de la cancha a través del slot
    $stmt = $pdo->prepare("SELECT * FROM court_time_slots WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => (int)$input['id']]);
    $slot = $stmt->fetch();

    if (!$slot) {
        json_response(['error' => 'Horario no encontrado'], 404);
    }

    court_require_owned_by_provider($pdo, (int)$slot['court_id'], $userId);

    court_timeslot_delete($pdo, (int)$input['id']);

    json_response(['message' => 'Horario eliminado correctamente']);
}
