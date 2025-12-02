<?php
// File: backend/src/helpers/auth.php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function auth_require_login(): int
{
    if (!isset($_SESSION['user_id'])) {
        json_response(['error' => 'No autenticado'], 401);
    }

    return (int) $_SESSION['user_id'];
}

function auth_login_session(int $userId): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['user_id'] = $userId;
}

function auth_logout_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}
