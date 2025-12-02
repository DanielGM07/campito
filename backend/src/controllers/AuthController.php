<?php
// File: backend/src/controllers/AuthController.php

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../models/UserModel.php';

function auth_register_player(PDO $pdo): void
{
    $input = get_json_input();

    $required = ['first_name', 'last_name', 'dni', 'birth_date', 'email', 'password', 'location'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            json_response(['error' => "Campo requerido: {$field}"], 400);
        }
    }

    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'Email inválido'], 400);
    }

    // Validar mayor de edad (18 años)
    $birth = DateTime::createFromFormat('Y-m-d', $input['birth_date']);
    if (!$birth) {
        json_response(['error' => 'Fecha de nacimiento inválida (formato Y-m-d)'], 400);
    }
    $today = new DateTime();
    $age   = $today->diff($birth)->y;
    if ($age < 18) {
        json_response(['error' => 'Debes ser mayor de 18 años'], 400);
    }

    if (user_find_by_email($pdo, $input['email'])) {
        json_response(['error' => 'El email ya está registrado'], 400);
    }

    $passwordHash = password_hash($input['password'], PASSWORD_BCRYPT);

    $pdo->beginTransaction();
    try {
        $userId = user_create_player($pdo, [
            'first_name'    => $input['first_name'],
            'last_name'     => $input['last_name'],
            'dni'           => $input['dni'],
            'birth_date'    => $input['birth_date'],
            'email'         => $input['email'],
            'password_hash' => $passwordHash,
            'location'      => $input['location'],
        ]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_response(['error' => 'No se pudo registrar el usuario'], 500);
    }

    auth_login_session($userId);

    $user = user_find_by_id($pdo, $userId);
    unset($user['password_hash']);

    json_response([
        'message' => 'Registro exitoso',
        'user'    => $user,
    ], 201);
}

function auth_login(PDO $pdo): void
{
    $input = get_json_input();

    if (empty($input['email']) || empty($input['password'])) {
        json_response(['error' => 'Email y contraseña son requeridos'], 400);
    }

    $user = user_find_by_email($pdo, $input['email']);
    if (!$user || !password_verify($input['password'], $user['password_hash'])) {
        json_response(['error' => 'Credenciales inválidas'], 401);
    }

    if ($user['status'] !== 'active') {
        json_response(['error' => 'Cuenta no activa'], 403);
    }

    auth_login_session((int) $user['id']);

    unset($user['password_hash']);

    json_response([
        'message' => 'Login exitoso',
        'user'    => $user,
    ]);
}

function auth_logout(): void
{
    auth_logout_session();
    json_response(['message' => 'Logout exitoso']);
}
