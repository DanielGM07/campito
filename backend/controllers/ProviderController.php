<?php
// File: backend/src/controllers/ProviderController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';

function provider_profile_get_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No tienes perfil de proveedor'], 404);
    }

    json_response(['provider' => $provider]);
}

function provider_profile_update_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No tienes perfil de proveedor'], 404);
    }

    $input = get_json_input();

    $data = [
        'venue_name'    => $input['venue_name']    ?? $provider['venue_name'],
        'contact_phone' => $input['contact_phone'] ?? $provider['contact_phone'],
        'contact_email' => $input['contact_email'] ?? $provider['contact_email'],
        'address'       => $input['address']       ?? $provider['address'],
        'description'   => $input['description']   ?? $provider['description'],
    ];

    provider_update_profile($pdo, (int) $provider['id'], $data);

    $updated = provider_find_by_id($pdo, (int) $provider['id']);

    json_response([
        'message'  => 'Perfil de proveedor actualizado',
        'provider' => $updated,
    ]);
}
