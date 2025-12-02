<?php
// File: backend/src/controllers/UserController.php

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../models/UserModel.php';

function user_me(PDO $pdo): void
{
    $userId = auth_require_login();
    $user   = user_find_by_id($pdo, $userId);

    if (!$user) {
        json_response(['error' => 'Usuario no encontrado'], 404);
    }

    unset($user['password_hash']);

    json_response(['user' => $user]);
}

// =========================================================
//  ADMIN: LISTAR JUGADORES
//  action = admin_user_list (GET)
// =========================================================
function admin_user_list_controller(PDO $pdo): void
{
    $adminId = auth_require_login();
    $me = user_find_by_id($pdo, $adminId);

    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    try {
        $users = user_find_all_players_for_admin($pdo);
        json_response(['users' => $users]);
    } catch (Throwable $e) {
        error_log($e->getMessage());
        json_response(['error' => 'Error al obtener usuarios'], 500);
    }
}


// =========================================================
//  ADMIN: CAMBIAR ESTADO DE UN JUGADOR
//  action = admin_user_change_status (POST)
//  body: { user_id, status }
// =========================================================
function admin_user_change_status_controller(PDO $pdo): void
{
    $adminId = auth_require_login();
    $me = user_find_by_id($pdo, $adminId);

    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $input = get_json_input();

    if (empty($input['user_id']) || empty($input['status'])) {
        json_response(['error' => 'Parámetros inválidos'], 400);
    }

    $userId = (int) $input['user_id'];
    $status = $input['status'];

    $allowed = ['active', 'suspended', 'deleted'];
    if (!in_array($status, $allowed, true)) {
        json_response([
            'error' => 'Estado inválido',
            'allowed' => $allowed
        ], 400);
    }

    $user = user_find_by_id($pdo, $userId);
    if (!$user) {
        json_response(['error' => 'Usuario no encontrado'], 404);
    }

    try {
        $ok = user_update_status($pdo, $userId, $status);
        if (!$ok) {
            json_response(['error' => 'Error al actualizar estado'], 500);
        }

        json_response([
            'message' => 'Estado actualizado correctamente'
        ]);
    } catch (Throwable $e) {
        error_log($e->getMessage());
        json_response(['error' => 'Error interno'], 500);
    }
}