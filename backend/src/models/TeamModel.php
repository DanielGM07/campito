<?php
// File: backend/src/models/TeamModel.php

function team_create(PDO $pdo, int $ownerId, array $data): int
{
    $sql = "INSERT INTO teams (owner_id, name, sport, description, max_members)
            VALUES (:owner_id, :name, :sport, :description, :max_members)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'owner_id'    => $ownerId,
        'name'        => $data['name'],
        'sport'       => $data['sport'],
        'description' => $data['description'] ?? null,
        'max_members' => $data['max_members'] ?? 11,
    ]);

    $teamId = (int)$pdo->lastInsertId();

    // Owner becomes captain
    $stmt = $pdo->prepare("INSERT INTO team_members (team_id, user_id, role) VALUES (:team_id, :user_id, 'captain')");
    $stmt->execute([
        'team_id' => $teamId,
        'user_id' => $ownerId,
    ]);

    return $teamId;
}

function team_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM teams WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function team_list_by_owner(PDO $pdo, int $ownerId): array
{
    $stmt = $pdo->prepare("SELECT * FROM teams WHERE owner_id = :owner_id ORDER BY name");
    $stmt->execute(['owner_id' => $ownerId]);
    return $stmt->fetchAll();
}

function team_list_by_player(PDO $pdo, int $userId): array
{
    $sql = "SELECT t.*
            FROM teams t
            INNER JOIN team_members tm ON tm.team_id = t.id
            WHERE tm.user_id = :user_id
            ORDER BY t.name";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['user_id' => $userId]);
    return $stmt->fetchAll();
}

function team_update(PDO $pdo, int $teamId, array $data): void
{
    $sql = "UPDATE teams
            SET name = :name,
                sport = :sport,
                description = :description,
                max_members = :max_members,
                updated_at = NOW()
            WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'name'        => $data['name'],
        'sport'       => $data['sport'],
        'description' => $data['description'],
        'max_members' => $data['max_members'],
        'id'          => $teamId,
    ]);
}

function team_delete(PDO $pdo, int $teamId): void
{
    // Hard delete (members cascade)
    $stmt = $pdo->prepare("DELETE FROM teams WHERE id = :id");
    $stmt->execute(['id' => $teamId]);
}

function team_member_count(PDO $pdo, int $teamId): int
{
    $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = :team_id");
    $stmt->execute(['team_id' => $teamId]);
    $row = $stmt->fetch();
    return $row ? (int)$row['cnt'] : 0;
}

function team_member_is_in_team(PDO $pdo, int $teamId, int $userId): bool
{
    $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = :team_id AND user_id = :user_id");
    $stmt->execute([
        'team_id' => $teamId,
        'user_id' => $userId,
    ]);
    $row = $stmt->fetch();
    return $row && (int)$row['cnt'] > 0;
}

function team_member_add(PDO $pdo, int $teamId, int $userId): void
{
    $stmt = $pdo->prepare("INSERT INTO team_members (team_id, user_id, role) VALUES (:team_id, :user_id, 'member')");
    $stmt->execute([
        'team_id' => $teamId,
        'user_id' => $userId,
    ]);
}

function team_member_remove(PDO $pdo, int $teamId, int $userId): void
{
    $stmt = $pdo->prepare("DELETE FROM team_members WHERE team_id = :team_id AND user_id = :user_id");
    $stmt->execute([
        'team_id' => $teamId,
        'user_id' => $userId,
    ]);
}

function team_member_list(PDO $pdo, int $teamId): array
{
    $sql = "SELECT tm.*, u.first_name, u.last_name, u.email
            FROM team_members tm
            INNER JOIN users u ON u.id = tm.user_id
            WHERE tm.team_id = :team_id
            ORDER BY tm.role DESC, u.first_name";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['team_id' => $teamId]);
    return $stmt->fetchAll();
}
