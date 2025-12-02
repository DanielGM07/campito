<?php
// File: backend/src/controllers/CourtController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';
require_once __DIR__ . '/../models/CourtModel.php';

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
