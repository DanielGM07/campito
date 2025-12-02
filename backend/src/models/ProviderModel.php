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

function provider_find_all_for_admin(PDO $pdo): array
{
    $sql = "
        SELECT 
            p.id,
            p.user_id,
            p.venue_name,
            p.contact_phone,
            p.contact_email,
            p.address,
            p.description,
            p.status,
            p.created_at,
            p.updated_at,
            u.first_name AS user_first_name,
            u.last_name  AS user_last_name,
            u.email      AS user_email
        FROM providers p
        INNER JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
    ";

    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Actualiza el estado de un proveedor (active / suspended / deleted).
 */
function provider_update_status(PDO $pdo, int $providerId, string $status): bool
{
    $stmt = $pdo->prepare("
        UPDATE providers
        SET status = :status
        WHERE id = :id
        LIMIT 1
    ");

    return $stmt->execute([
        'status' => $status,
        'id'     => $providerId,
    ]);
}