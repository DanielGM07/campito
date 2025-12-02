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
