<?php
// File: backend/src/controllers/TournamentController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';
require_once __DIR__ . '/../models/TeamModel.php';
require_once __DIR__ . '/../models/TournamentModel.php';
require_once __DIR__ . '/../models/TournamentRegistrationModel.php';

function tournament_list_public_controller(PDO $pdo): void
{
    $filters = [
        'sport'    => $_GET['sport']    ?? null,
        'status'   => $_GET['status']   ?? 'registration_open',
        'from_date'=> $_GET['from_date']?? null,
        'to_date'  => $_GET['to_date']  ?? null,
    ];
    $list = tournament_list_public($pdo, $filters);
    json_response(['tournaments' => $list]);
}

function tournament_detail_controller(PDO $pdo): void
{
    if (empty($_GET['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }
    $tour = tournament_find_by_id($pdo, (int)$_GET['id']);
    if (!$tour) {
        json_response(['error' => 'Torneo no encontrado'], 404);
    }
    json_response(['tournament' => $tour]);
}

function tournament_register_team_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    $required = ['tournament_id', 'team_id'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $tournament = tournament_find_by_id($pdo, (int)$input['tournament_id']);
    if (!$tournament) {
        json_response(['error' => 'Torneo no encontrado'], 404);
    }

    if ($tournament['status'] !== 'registration_open') {
        json_response(['error' => 'La inscripción no está abierta'], 400);
    }

    $team = team_find_by_id($pdo, (int)$input['team_id']);
    if (!$team) {
        json_response(['error' => 'Equipo no encontrado'], 404);
    }

    if ((int)$team['owner_id'] !== $userId && !team_member_is_in_team($pdo, (int)$team['id'], $userId)) {
        json_response(['error' => 'No perteneces a ese equipo'], 403);
    }

    if ($team['sport'] !== $tournament['sport']) {
        json_response(['error' => 'El deporte del equipo no coincide con el del torneo'], 400);
    }

    $membersCount = team_member_count($pdo, (int)$team['id']);
    if ($membersCount < (int)$tournament['min_players_per_team'] || $membersCount > (int)$tournament['max_players_per_team']) {
        json_response(['error' => 'La cantidad de jugadores del equipo no cumple los requisitos del torneo'], 400);
    }

    $currentReg = tournament_registration_count($pdo, (int)$tournament['id']);
    if ($currentReg >= (int)$tournament['max_teams']) {
        json_response(['error' => 'Cupo de equipos alcanzado'], 400);
    }

    if (tournament_registration_exists($pdo, (int)$tournament['id'], (int)$team['id'])) {
        json_response(['error' => 'El equipo ya está inscripto en este torneo'], 400);
    }

    $fee = (float)$tournament['registration_fee'];

    $regId = tournament_registration_create($pdo, (int)$tournament['id'], (int)$team['id'], $fee);

    json_response([
        'message'              => 'Equipo inscripto al torneo',
        'registration_id'      => $regId,
    ], 201);
}

function tournament_list_my_teams_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $teams  = team_list_by_player($pdo, $userId);

    $results = [];
    foreach ($teams as $team) {
        $regs = tournament_registration_list_for_team($pdo, (int)$team['id']);
        $results[] = [
            'team'          => $team,
            'registrations' => $regs,
        ];
    }

    json_response(['teams_tournaments' => $results]);
}

// Proveedor

function provider_get_from_user(PDO $pdo, int $userId): array
{
    $user = user_find_by_id($pdo, $userId);
    if (!$user || !$user['is_provider']) {
        json_response(['error' => 'No eres proveedor'], 403);
    }
    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No tienes perfil de proveedor'], 403);
    }
    return $provider;
}

function tournament_create_provider_controller(PDO $pdo): void
{
    $userId   = auth_require_login();
    $provider = provider_get_from_user($pdo, $userId);

    $input = get_json_input();
    $required = [
        'name','sport','start_date','end_date',
        'max_teams','min_players_per_team','max_players_per_team','registration_fee'
    ];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $data = [
        'name'                 => $input['name'],
        'sport'                => $input['sport'],
        'description'          => $input['description'] ?? null,
        'rules'                => $input['rules'] ?? null,
        'prizes'               => $input['prizes'] ?? null,
        'venue_info'           => $input['venue_info'] ?? $provider['venue_name'],
        'start_date'           => $input['start_date'],
        'end_date'             => $input['end_date'],
        'max_teams'            => (int)$input['max_teams'],
        'min_players_per_team' => (int)$input['min_players_per_team'],
        'max_players_per_team' => (int)$input['max_players_per_team'],
        'registration_fee'     => (float)$input['registration_fee'],
    ];

    $id = tournament_create($pdo, (int)$provider['id'], $data);
    $tour = tournament_find_by_id($pdo, $id);

    json_response([
        'message'   => 'Torneo creado',
        'tournament'=> $tour,
    ], 201);
}

function tournament_update_provider_controller(PDO $pdo): void
{
    $userId   = auth_require_login();
    $provider = provider_get_from_user($pdo, $userId);

    $input = get_json_input();
    if (empty($input['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }

    $tour = tournament_find_by_id($pdo, (int)$input['id']);
    if (!$tour || (int)$tour['provider_id'] !== (int)$provider['id']) {
        json_response(['error' => 'Torneo no encontrado'], 404);
    }

    if (!in_array($tour['status'], ['scheduled','registration_open'], true)) {
        json_response(['error' => 'Solo se pueden modificar torneos programados o con inscripción abierta'], 400);
    }

    $data = [
        'name'                 => $input['name']                 ?? $tour['name'],
        'sport'                => $input['sport']                ?? $tour['sport'],
        'description'          => $input['description']          ?? $tour['description'],
        'rules'                => $input['rules']                ?? $tour['rules'],
        'prizes'               => $input['prizes']               ?? $tour['prizes'],
        'venue_info'           => $input['venue_info']           ?? $tour['venue_info'],
        'start_date'           => $input['start_date']           ?? $tour['start_date'],
        'end_date'             => $input['end_date']             ?? $tour['end_date'],
        'max_teams'            => $input['max_teams']            ?? $tour['max_teams'],
        'min_players_per_team' => $input['min_players_per_team'] ?? $tour['min_players_per_team'],
        'max_players_per_team' => $input['max_players_per_team'] ?? $tour['max_players_per_team'],
        'registration_fee'     => $input['registration_fee']     ?? $tour['registration_fee'],
    ];

    tournament_update($pdo, (int)$tour['id'], $data);
    $updated = tournament_find_by_id($pdo, (int)$tour['id']);

    json_response([
        'message'    => 'Torneo actualizado',
        'tournament' => $updated,
    ]);
}

function tournament_change_status_provider_controller(PDO $pdo): void
{
    $userId   = auth_require_login();
    $provider = provider_get_from_user($pdo, $userId);

    $input = get_json_input();
    if (empty($input['id']) || empty($input['status'])) {
        json_response(['error' => 'id y status requeridos'], 400);
    }

    $allowed = ['registration_open','registration_closed','in_progress','finished','cancelled'];
    if (!in_array($input['status'], $allowed, true)) {
        json_response(['error' => 'Status inválido'], 400);
    }

    $tour = tournament_find_by_id($pdo, (int)$input['id']);
    if (!$tour || (int)$tour['provider_id'] !== (int)$provider['id']) {
        json_response(['error' => 'Torneo no encontrado'], 404);
    }

    tournament_update_status($pdo, (int)$tour['id'], $input['status']);
    $updated = tournament_find_by_id($pdo, (int)$tour['id']);

    json_response([
        'message'    => 'Estado del torneo actualizado',
        'tournament' => $updated,
    ]);
}

function tournament_list_provider_controller(PDO $pdo): void
{
    $userId   = auth_require_login();
    $provider = provider_get_from_user($pdo, $userId);

    $list = tournament_list_by_provider($pdo, (int)$provider['id']);
    json_response(['tournaments' => $list]);
}
