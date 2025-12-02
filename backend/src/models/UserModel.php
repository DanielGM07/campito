<?php
// File: backend/src/models/UserModel.php

function user_find_by_email(PDO $pdo, string $email): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email AND status != 'deleted' LIMIT 1");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function user_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id AND status != 'deleted' LIMIT 1");
    $stmt->execute(['id' => $id]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function user_create_player(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO users 
        (first_name, last_name, dni, birth_date, email, password_hash, location, is_player, is_provider, is_admin)
        VALUES
        (:first_name, :last_name, :dni, :birth_date, :email, :password_hash, :location, 1, 0, 0)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'first_name'    => $data['first_name'],
        'last_name'     => $data['last_name'],
        'dni'           => $data['dni'],
        'birth_date'    => $data['birth_date'],
        'email'         => $data['email'],
        'password_hash' => $data['password_hash'],
        'location'      => $data['location'],
    ]);

    $userId = (int) $pdo->lastInsertId();

    // Crear wallet de puntos para el jugador
    $stmtWallet = $pdo->prepare("INSERT INTO player_wallets (player_id) VALUES (:player_id)");
    $stmtWallet->execute(['player_id' => $userId]);

    return $userId;
}
