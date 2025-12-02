<?php
// File: backend/src/controllers/RankingController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/RankingModel.php';

function ranking_players_controller(PDO $pdo): void
{
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $rows  = ranking_players_by_points($pdo, $limit);
    json_response(['players' => $rows]);
}

function ranking_teams_controller(PDO $pdo): void
{
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $rows  = ranking_teams_by_points($pdo, $limit);
    json_response(['teams' => $rows]);
}
