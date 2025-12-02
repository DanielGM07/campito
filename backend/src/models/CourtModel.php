<?php
// File: backend/src/models/CourtModel.php

function court_create(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO courts
        (provider_id, name, sport, price_per_hour, max_players, internal_location, status, photos_json)
        VALUES
        (:provider_id, :name, :sport, :price_per_hour, :max_players, :internal_location, :status, :photos_json)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'provider_id'      => $data['provider_id'],
        'name'             => $data['name'],
        'sport'            => $data['sport'],
        'price_per_hour'   => $data['price_per_hour'],
        'max_players'      => $data['max_players'],
        'internal_location'=> $data['internal_location'],
        'status'           => $data['status'],
        'photos_json'      => $data['photos_json'],
    ]);

    return (int) $pdo->lastInsertId();
}

function court_update(PDO $pdo, int $id, array $data): void
{
    $sql = "UPDATE courts
            SET name = :name,
                sport = :sport,
                price_per_hour = :price_per_hour,
                max_players = :max_players,
                internal_location = :internal_location,
                status = :status,
                photos_json = :photos_json,
                updated_at = NOW()
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'name'             => $data['name'],
        'sport'            => $data['sport'],
        'price_per_hour'   => $data['price_per_hour'],
        'max_players'      => $data['max_players'],
        'internal_location'=> $data['internal_location'],
        'status'           => $data['status'],
        'photos_json'      => $data['photos_json'],
        'id'               => $id,
    ]);
}

function court_soft_delete(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare("UPDATE courts SET status = 'inactive', updated_at = NOW() WHERE id = :id");
    $stmt->execute(['id' => $id]);
}

function court_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM courts WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function court_list_by_provider(PDO $pdo, int $providerId): array
{
    $stmt = $pdo->prepare("SELECT * FROM courts WHERE provider_id = :pid ORDER BY name ASC");
    $stmt->execute(['pid' => $providerId]);
    return $stmt->fetchAll();
}
