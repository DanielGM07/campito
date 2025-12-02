<?php
// File: backend/src/controllers/TeamController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/TeamModel.php';
require_once __DIR__ . '/../models/TeamInvitationModel.php';

function team_list_my_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $teams  = team_list_by_player($pdo, $userId);
    json_response(['teams' => $teams]);
}

function team_create_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $user   = user_find_by_id($pdo, $userId);
    if (!$user || !$user['is_player']) {
        json_response(['error' => 'No eres jugador'], 403);
    }

    $input = get_json_input();
    $required = ['name', 'sport'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $data = [
        'name'        => $input['name'],
        'sport'       => $input['sport'],
        'description' => $input['description'] ?? null,
        'max_members' => $input['max_members'] ?? 11,
    ];

    $teamId = team_create($pdo, $userId, $data);
    $team   = team_find_by_id($pdo, $teamId);

    json_response([
        'message' => 'Equipo creado',
        'team'    => $team,
    ], 201);
}

function team_update_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    if (empty($input['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }

    $team = team_find_by_id($pdo, (int)$input['id']);
    if (!$team || (int)$team['owner_id'] !== $userId) {
        json_response(['error' => 'Equipo no encontrado o no eres dueño'], 404);
    }

    $data = [
        'name'        => $input['name']        ?? $team['name'],
        'sport'       => $input['sport']       ?? $team['sport'],
        'description' => $input['description'] ?? $team['description'],
        'max_members' => $input['max_members'] ?? $team['max_members'],
    ];

    team_update($pdo, (int)$team['id'], $data);
    $updated = team_find_by_id($pdo, (int)$team['id']);

    json_response([
        'message' => 'Equipo actualizado',
        'team'    => $updated,
    ]);
}

function team_delete_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    if (empty($input['id'])) {
        json_response(['error' => 'id requerido'], 400);
    }

    $team = team_find_by_id($pdo, (int)$input['id']);
    if (!$team || (int)$team['owner_id'] !== $userId) {
        json_response(['error' => 'Equipo no encontrado o no eres dueño'], 404);
    }

    team_delete($pdo, (int)$team['id']);

    json_response(['message' => 'Equipo eliminado']);
}

function team_invite_member_controller(PDO $pdo): void
{
    $ownerId = auth_require_login();
    $input   = get_json_input();

    $required = ['team_id', 'invited_user_id'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $team = team_find_by_id($pdo, (int)$input['team_id']);
    if (!$team || (int)$team['owner_id'] !== $ownerId) {
        json_response(['error' => 'Equipo no encontrado o no eres dueño'], 404);
    }

    $invitedUserId = (int)$input['invited_user_id'];
    if (team_member_is_in_team($pdo, (int)$team['id'], $invitedUserId)) {
        json_response(['error' => 'El jugador ya es integrante del equipo'], 400);
    }

    if (team_invitation_exists_pending($pdo, (int)$team['id'], $invitedUserId)) {
        json_response(['error' => 'Ya existe una invitación pendiente para este jugador'], 400);
    }

    $currentCount = team_member_count($pdo, (int)$team['id']);
    if ($currentCount >= (int)$team['max_members']) {
        json_response(['error' => 'El equipo ya alcanzó el máximo de integrantes'], 400);
    }

    $userInvited = user_find_by_id($pdo, $invitedUserId);
    if (!$userInvited || !$userInvited['is_player']) {
        json_response(['error' => 'Jugador invitado no válido'], 400);
    }

    $invId = team_invitation_create($pdo, (int)$team['id'], $invitedUserId, $userInvited['email']);

    json_response([
        'message'        => 'Invitación enviada',
        'invitation_id'  => $invId,
    ], 201);
}

function team_invitations_my_pending_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $list   = team_invitation_list_pending_for_user($pdo, $userId);
    json_response(['invitations' => $list]);
}

function team_invitation_respond_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    $required = ['invitation_id', 'response'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $inv = team_invitation_find_by_id($pdo, (int)$input['invitation_id']);
    if (!$inv || (int)$inv['invited_user_id'] !== $userId) {
        json_response(['error' => 'Invitación no encontrada'], 404);
    }

    if ($inv['status'] !== 'pending') {
        json_response(['error' => 'La invitación ya fue respondida'], 400);
    }

    $response = $input['response'] === 'accept' ? 'accepted' : 'rejected';
    team_invitation_update_status($pdo, (int)$inv['id'], $response);

    if ($response === 'accepted') {
        $team = team_find_by_id($pdo, (int)$inv['team_id']);
        if ($team) {
            $currentCount = team_member_count($pdo, (int)$team['id']);
            if ($currentCount >= (int)$team['max_members']) {
                json_response(['error' => 'El equipo alcanzó el máximo de integrantes'], 400);
            }
        }
        team_member_add($pdo, (int)$inv['team_id'], $userId);
    }

    json_response([
        'message'  => 'Respuesta registrada',
        'status'   => $response,
    ]);
}

function team_leave_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    if (empty($input['team_id'])) {
        json_response(['error' => 'team_id requerido'], 400);
    }

    $team = team_find_by_id($pdo, (int)$input['team_id']);
    if (!$team) {
        json_response(['error' => 'Equipo no encontrado'], 404);
    }

    if ((int)$team['owner_id'] === $userId) {
        json_response(['error' => 'El dueño no puede abandonar el equipo, debe eliminarlo o transferirlo'], 400);
    }

    if (!team_member_is_in_team($pdo, (int)$team['id'], $userId)) {
        json_response(['error' => 'No eres integrante del equipo'], 400);
    }

    team_member_remove($pdo, (int)$team['id'], $userId);

    json_response(['message' => 'Has abandonado el equipo']);
}
