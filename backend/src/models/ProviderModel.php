<?php
// File: backend/src/models/ProviderModel.php

function provider_create(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO providers 
        (user_id, venue_name, contact_phone, contact_email, address, description)
        VALUES
        (:user_id, :venue_name, :contact_phone, :contact_email, :address, :description)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'user_id'       => $data['user_id'],
        'venue_name'    => $data['venue_name'],
        'contact_phone' => $data['contact_phone'],
        'contact_email' => $data['contact_email'],
        'address'       => $data['address'],
        'description'   => $data['description'],
    ]);

    return (int) $pdo->lastInsertId();
}

function provider_find_by_user(PDO $pdo, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM providers WHERE user_id = :id LIMIT 1");
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function provider_update_profile(PDO $pdo, int $id, array $data): void
{
    $sql = "UPDATE providers
            SET venue_name = :venue_name,
                contact_phone = :contact_phone,
                contact_email = :contact_email,
                address = :address,
                description = :description,
                updated_at = NOW()
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'venue_name'    => $data['venue_name'],
        'contact_phone' => $data['contact_phone'],
        'contact_email' => $data['contact_email'],
        'address'       => $data['address'],
        'description'   => $data['description'],
        'id'            => $id,
    ]);
}

function provider_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM providers WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}
