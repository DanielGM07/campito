<?php
// File: backend/src/controllers/NotificationController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/NotificationModel.php';

function notification_list_my_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $list   = notification_list_for_user($pdo, $userId);
    json_response(['notifications' => $list]);
}

function notification_mark_read_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    if (empty($input['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }

    notification_mark_as_read($pdo, $userId, (int)$input['id']);
    json_response(['message' => 'Notificación marcada como leída']);
}
