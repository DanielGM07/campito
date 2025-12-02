<?php
// File: backend/src/models/TournamentRegistrationModel.php

function tournament_registration_count(PDO $pdo, int $tournamentId): int
{
    $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM tournament_registrations WHERE tournament_id = :tid AND status = 'confirmed'");
    $stmt->execute(['tid' => $tournamentId]);
    $row = $stmt->fetch();
    return $row ? (int)$row['cnt'] : 0;
}

function tournament_registration_exists(PDO $pdo, int $tournamentId, int $teamId): bool
{
    $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM tournament_registrations WHERE tournament_id = :tid AND team_id = :team_id");
    $stmt->execute([
        'tid'      => $tournamentId,
        'team_id'  => $teamId,
    ]);
    $row = $stmt->fetch();
    return $row && (int)$row['cnt'] > 0;
}

function tournament_registration_create(PDO $pdo, int $tournamentId, int $teamId, float $fee): int
{
    $sql = "INSERT INTO tournament_registrations (tournament_id, team_id, total_fee, status)
            VALUES (:tournament_id, :team_id, :total_fee, 'confirmed')";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'tournament_id' => $tournamentId,
        'team_id'       => $teamId,
        'total_fee'     => $fee,
    ]);
    return (int)$pdo->lastInsertId();
}

function tournament_registration_list_for_team(PDO $pdo, int $teamId): array
{
    $sql = "SELECT tr.*, t.name AS tournament_name, t.sport, t.start_date, t.end_date
            FROM tournament_registrations tr
            INNER JOIN tournaments t ON t.id = tr.tournament_id
            WHERE tr.team_id = :team_id
            ORDER BY t.start_date DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['team_id' => $teamId]);
    return $stmt->fetchAll();
}
