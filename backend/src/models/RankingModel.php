<?php
// File: backend/src/models/RankingModel.php

function ranking_players_by_points(PDO $pdo, int $limit = 50): array
{
    $sql = "SELECT u.id, u.first_name, u.last_name, u.email, w.points_balance, w.stars_balance
            FROM users u
            INNER JOIN player_wallets w ON w.player_id = u.id
            WHERE u.is_player = 1 AND u.status = 'active'
            ORDER BY w.points_balance DESC, w.stars_balance DESC
            LIMIT :limit";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

function ranking_teams_by_points(PDO $pdo, int $limit = 50): array
{
    $sql = "SELECT t.id, t.name, t.sport,
                   COALESCE(SUM(w.points_balance), 0) AS team_points
            FROM teams t
            INNER JOIN team_members tm ON tm.team_id = t.id
            INNER JOIN player_wallets w ON w.player_id = tm.user_id
            GROUP BY t.id, t.name, t.sport
            ORDER BY team_points DESC
            LIMIT :limit";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}
