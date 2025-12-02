<?php
// File: backend/src/models/ProviderRequestModel.php

function provider_request_create(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO provider_requests 
        (user_id, venue_name, contact_phone, contact_email, address, description)
        VALUES
        (:user_id, :venue_name, :contact_phone, :contact_email, :address, :description)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'user_id'        => $data['user_id'],
        'venue_name'     => $data['venue_name'],
        'contact_phone'  => $data['contact_phone'],
        'contact_email'  => $data['contact_email'],
        'address'        => $data['address'],
        'description'    => $data['description'],
    ]);

    return (int) $pdo->lastInsertId();
}

function provider_request_find_by_user(PDO $pdo, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM provider_requests WHERE user_id = :id ORDER BY id DESC LIMIT 1");
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function provider_request_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM provider_requests WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function provider_request_find_all_pending(PDO $pdo): array
{
    $stmt = $pdo->query("SELECT pr.*, u.email, u.first_name, u.last_name 
                         FROM provider_requests pr
                         INNER JOIN users u ON u.id = pr.user_id
                         WHERE pr.status = 'pending'
                         ORDER BY pr.created_at DESC");
    return $stmt->fetchAll();
}

function provider_request_update_status(PDO $pdo, int $id, string $status, ?string $comment): void
{
    $stmt = $pdo->prepare("
        UPDATE provider_requests
        SET status = :status, admin_comment = :comment
        WHERE id = :id
    ");
    $stmt->execute([
        'status' => $status,
        'comment' => $comment,
        'id' => $id,
    ]);
}
