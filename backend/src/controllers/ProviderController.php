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

/**
 * ADMIN: listar todos los proveedores.
 * action = admin_provider_list (GET)
 */
function admin_provider_list_controller(PDO $pdo): void
{
    $adminId = auth_require_login();
    $me = user_find_by_id($pdo, $adminId);

    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    try {
        $providers = provider_find_all_for_admin($pdo);

        json_response([
            'providers' => $providers,
        ]);
    } catch (Throwable $e) {
        error_log($e->getMessage());
        json_response(['error' => 'Error al obtener proveedores'], 500);
    }
}

/**
 * ADMIN: cambiar estado de un proveedor.
 * action = admin_provider_change_status (POST)
 * body JSON: { "provider_id": 1, "status": "suspended" }
 */
function admin_provider_change_status_controller(PDO $pdo): void
{
    $adminId = auth_require_login();
    $me = user_find_by_id($pdo, $adminId);

    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $input = get_json_input();

    if (empty($input['provider_id']) || empty($input['status'])) {
        json_response(['error' => 'provider_id y status son requeridos'], 400);
    }

    $providerId = (int) $input['provider_id'];
    $status     = (string) $input['status'];

    $allowedStatuses = ['active', 'suspended', 'deleted'];
    if (!in_array($status, $allowedStatuses, true)) {
        json_response([
            'error'   => 'Estado inválido',
            'allowed' => $allowedStatuses,
        ], 400);
    }

    // Verificar que el proveedor exista
    $provider = provider_find_by_id($pdo, $providerId);
    if (!$provider) {
        json_response(['error' => 'Proveedor no encontrado'], 404);
    }

    try {
        $ok = provider_update_status($pdo, $providerId, $status);

        if (!$ok) {
            json_response(['error' => 'No se pudo actualizar el estado'], 500);
        }

        json_response([
            'message' => 'Estado actualizado correctamente',
        ]);
    } catch (Throwable $e) {
        error_log($e->getMessage());
        json_response(['error' => 'Error al actualizar el estado del proveedor'], 500);
    }
}