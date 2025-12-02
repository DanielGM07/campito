<?php
// File: backend/src/controllers/ProviderRequestController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/ProviderRequestModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';

function provider_request_create_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $input = get_json_input();

    $required = ['venue_name', 'contact_phone', 'contact_email', 'address', 'description'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    // Si ya tiene una solicitud previa pendiente
    $existing = provider_request_find_by_user($pdo, $userId);
    if ($existing && $existing['status'] === 'pending') {
        json_response(['error' => 'Ya tienes una solicitud pendiente'], 400);
    }

    $id = provider_request_create($pdo, [
        'user_id'        => $userId,
        'venue_name'     => $input['venue_name'],
        'contact_phone'  => $input['contact_phone'],
        'contact_email'  => $input['contact_email'],
        'address'        => $input['address'],
        'description'    => $input['description'],
    ]);

    json_response([
        'message' => 'Solicitud creada correctamente',
        'request_id' => $id
    ], 201);
}

function provider_request_list_pending_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $me = user_find_by_id($pdo, $userId);
    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $pending = provider_request_find_all_pending($pdo);

    json_response(['requests' => $pending]);
}

function provider_request_approve_controller(PDO $pdo): void
{
    $adminId = auth_require_login();
    $me = user_find_by_id($pdo, $adminId);
    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $input = get_json_input();

    if (empty($input['request_id'])) {
        json_response(['error' => 'request_id requerido'], 400);
    }

    $requestId = (int) $input['request_id'];

    $request = provider_request_find_by_id($pdo, $requestId);
    if (!$request) {
        json_response(['error' => 'Solicitud no encontrada'], 404);
    }

    if ($request['status'] !== 'pending') {
        json_response(['error' => 'La solicitud ya fue procesada'], 400);
    }

    $pdo->beginTransaction();

    try {
        provider_request_update_status($pdo, $requestId, 'approved', $input['comment'] ?? null);

        provider_create($pdo, [
            'user_id'       => $request['user_id'],
            'venue_name'    => $request['venue_name'],
            'contact_phone' => $request['contact_phone'],
            'contact_email' => $request['contact_email'],
            'address'       => $request['address'],
            'description'   => $request['description'],
        ]);

        $stmt = $pdo->prepare("UPDATE users SET is_provider = 1 WHERE id = :id");
        $stmt->execute(['id' => $request['user_id']]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_response(['error' => 'No se pudo aprobar la solicitud'], 500);
    }

    json_response(['message' => 'Proveedor aprobado']);
}

function provider_request_reject_controller(PDO $pdo): void
{
    $adminId = auth_require_login();
    $me = user_find_by_id($pdo, $adminId);
    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $input = get_json_input();

    if (empty($input['request_id'])) {
        json_response(['error' => 'request_id requerido'], 400);
    }

    provider_request_update_status(
        $pdo,
        (int) $input['request_id'],
        'rejected',
        $input['comment'] ?? null
    );

    json_response(['message' => 'Solicitud rechazada']);
}
