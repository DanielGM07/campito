<?php
// File: backend/src/models/TournamentModel.php

function tournament_create(PDO $pdo, int $providerId, array $data): int
{
    $sql = "INSERT INTO tournaments
        (provider_id, name, sport, description, rules, prizes, venue_info,
         start_date, end_date, max_teams, min_players_per_team, max_players_per_team,
         registration_fee, status)
        VALUES
        (:provider_id, :name, :sport, :description, :rules, :prizes, :venue_info,
         :start_date, :end_date, :max_teams, :min_players_per_team, :max_players_per_team,
         :registration_fee, :status)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'provider_id'          => $providerId,
        'name'                 => $data['name'],
        'sport'                => $data['sport'],
        'description'          => $data['description'] ?? null,
        'rules'                => $data['rules'] ?? null,
        'prizes'               => $data['prizes'] ?? null,
        'venue_info'           => $data['venue_info'] ?? null,
        'start_date'           => $data['start_date'],
        'end_date'             => $data['end_date'],
        'max_teams'            => $data['max_teams'],
        'min_players_per_team' => $data['min_players_per_team'],
        'max_players_per_team' => $data['max_players_per_team'],
        'registration_fee'     => $data['registration_fee'],
        'status'               => 'registration_open',
    ]);

    return (int)$pdo->lastInsertId();
}

function tournament_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM tournaments WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function tournament_list_public(PDO $pdo, array $filters): array
{
    $where = [];
    $params = [];

    if (!empty($filters['sport'])) {
        $where[] = "sport = :sport";
        $params['sport'] = $filters['sport'];
    }
    if (!empty($filters['status'])) {
        $where[] = "status = :status";
        $params['status'] = $filters['status'];
    }
    if (!empty($filters['from_date'])) {
        $where[] = "start_date >= :from_date";
        $params['from_date'] = $filters['from_date'];
    }
    if (!empty($filters['to_date'])) {
        $where[] = "end_date <= :to_date";
        $params['to_date'] = $filters['to_date'];
    }

    $sql = "SELECT t.*, p.venue_name
            FROM tournaments t
            INNER JOIN providers p ON p.id = t.provider_id";
    if ($where) {
        $sql .= " WHERE " . implode(' AND ', $where);
    }
    $sql .= " ORDER BY t.start_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function tournament_list_by_provider(PDO $pdo, int $providerId): array
{
    $stmt = $pdo->prepare("SELECT * FROM tournaments WHERE provider_id = :pid ORDER BY start_date DESC");
    $stmt->execute(['pid' => $providerId]);
    return $stmt->fetchAll();
}

function tournament_update(PDO $pdo, int $id, array $data): void
{
    $sql = "UPDATE tournaments
            SET name = :name,
                sport = :sport,
                description = :description,
                rules = :rules,
                prizes = :prizes,
                venue_info = :venue_info,
                start_date = :start_date,
                end_date = :end_date,
                max_teams = :max_teams,
                min_players_per_team = :min_players_per_team,
                max_players_per_team = :max_players_per_team,
                registration_fee = :registration_fee,
                updated_at = NOW()
            WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'name'                 => $data['name'],
        'sport'                => $data['sport'],
        'description'          => $data['description'],
        'rules'                => $data['rules'],
        'prizes'               => $data['prizes'],
        'venue_info'           => $data['venue_info'],
        'start_date'           => $data['start_date'],
        'end_date'             => $data['end_date'],
        'max_teams'            => $data['max_teams'],
        'min_players_per_team' => $data['min_players_per_team'],
        'max_players_per_team' => $data['max_players_per_team'],
        'registration_fee'     => $data['registration_fee'],
        'id'                   => $id,
    ]);
}

function tournament_update_status(PDO $pdo, int $id, string $status): void
{
    $stmt = $pdo->prepare("UPDATE tournaments SET status = :status, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        'status' => $status,
        'id'     => $id,
    ]);
}

function tournament_find_all_for_admin(PDO $pdo): array
{
    $sql = "
        SELECT 
            t.id,
            t.name,
            t.sport,
            t.status,
            t.start_date,
            t.end_date,
            
            p.id AS provider_id,
            p.venue_name AS provider_name,

            -- contar equipos inscriptos
            (
                SELECT COUNT(*) 
                FROM tournament_team tt 
                WHERE tt.tournament_id = t.id
            ) AS team_count

        FROM tournaments t
        INNER JOIN providers p ON p.id = t.provider_id
        ORDER BY t.created_at DESC
    ";

    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}