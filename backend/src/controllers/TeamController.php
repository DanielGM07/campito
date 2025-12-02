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

/**
 * INVITAR MIEMBRO POR ID (ya existía, lo ajusto)
 *
 * Ahora permite que cualquier integrante del equipo invite a otros,
 * no solo el dueño.
 */
function team_invite_member_controller(PDO $pdo): void
{
    $requestingUserId = auth_require_login();
    $input   = get_json_input();

    $required = ['team_id', 'invited_user_id'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    $teamId        = (int)$input['team_id'];
    $invitedUserId = (int)$input['invited_user_id'];

    $team = team_find_by_id($pdo, $teamId);
    if (!$team) {
        json_response(['error' => 'Equipo no encontrado'], 404);
    }

    // NUEVO: cualquier integrante puede invitar (no solo owner)
    $isOwner   = ((int)$team['owner_id'] === $requestingUserId);
    $isMember  = team_member_is_in_team($pdo, $teamId, $requestingUserId);

    if (!$isOwner && !$isMember) {
        json_response(['error' => 'No formas parte del equipo'], 403);
    }

    if (team_member_is_in_team($pdo, $teamId, $invitedUserId)) {
        json_response(['error' => 'El jugador ya es integrante del equipo'], 400);
    }

    if (team_invitation_exists_pending($pdo, $teamId, $invitedUserId)) {
        json_response(['error' => 'Ya existe una invitación pendiente para este jugador'], 400);
    }

    $currentCount = team_member_count($pdo, $teamId);
    if ($currentCount >= (int)$team['max_members']) {
        json_response(['error' => 'El equipo ya alcanzó el máximo de integrantes'], 400);
    }

    $userInvited = user_find_by_id($pdo, $invitedUserId);
    if (!$userInvited || !$userInvited['is_player']) {
        json_response(['error' => 'Jugador invitado no válido'], 400);
    }

    $invId = team_invitation_create($pdo, $teamId, $invitedUserId, $userInvited['email']);

    json_response([
        'message'        => 'Invitación enviada',
        'invitation_id'  => $invId,
    ], 201);
}

/**
 * NUEVO: INVITAR JUGADOR POR EMAIL O DNI
 *
 * Front: action=team_invite_player
 * Body: { "team_id": X, "identifier": "email@o.dni" }
 */
function team_invite_player_controller(PDO $pdo): void
{
    $requestingUserId = auth_require_login();
    $input            = get_json_input();

    if (empty($input['team_id']) || empty($input['identifier'])) {
        json_response(['error' => 'team_id e identifier son requeridos'], 400);
    }

    $teamId     = (int)$input['team_id'];
    $identifier = trim((string)$input['identifier']);

    $team = team_find_by_id($pdo, $teamId);
    if (!$team) {
        json_response(['error' => 'Equipo no encontrado'], 404);
    }

    // cualquier integrante del equipo puede invitar
    $isOwner  = ((int)$team['owner_id'] === $requestingUserId);
    $isMember = team_member_is_in_team($pdo, $teamId, $requestingUserId);

    if (!$isOwner && !$isMember) {
        json_response(['error' => 'No formas parte del equipo'], 403);
    }

    // Buscar jugador por email o por DNI
    $userInvited = null;

    if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
        $userInvited = user_find_by_email($pdo, $identifier);
    } else {
        // Asumimos que el identificador puede ser DNI (exact match)
        $stmt = $pdo->prepare('SELECT * FROM users WHERE dni = :dni LIMIT 1');
        $stmt->execute([':dni' => $identifier]);
        $userInvited = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    if (!$userInvited) {
        json_response(['error' => 'Jugador no encontrado por ese identificador'], 404);
    }

    if (!$userInvited['is_player']) {
        json_response(['error' => 'El usuario encontrado no es jugador'], 400);
    }

    $invitedUserId = (int)$userInvited['id'];

    if ($invitedUserId === $requestingUserId) {
        json_response(['error' => 'No puedes invitarte a ti mismo'], 400);
    }

    if (team_member_is_in_team($pdo, $teamId, $invitedUserId)) {
        json_response(['error' => 'El jugador ya es integrante del equipo'], 400);
    }

    if (team_invitation_exists_pending($pdo, $teamId, $invitedUserId)) {
        json_response(['error' => 'Ya existe una invitación pendiente para este jugador'], 400);
    }

    $currentCount = team_member_count($pdo, $teamId);
    if ($currentCount >= (int)$team['max_members']) {
        json_response(['error' => 'El equipo ya alcanzó el máximo de integrantes'], 400);
    }

    $invId = team_invitation_create($pdo, $teamId, $invitedUserId, $userInvited['email']);

    json_response([
        'message'       => 'Invitación enviada',
        'invitation_id' => $invId,
        'invited_email' => $userInvited['email'],
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

/**
 * NUEVO: listar equipos a los que el jugador se puede unir.
 *
 * Regla:
 * - No esté ya en el equipo.
 * - El equipo no esté lleno.
 * - (Opcional) que no esté borrado.
 */
function team_list_public_joinable_controller(PDO $pdo): void
{
    $userId = auth_require_login();

    $sql = "
        SELECT
            t.*,
            (
                SELECT COUNT(*)
                FROM team_members tm
                WHERE tm.team_id = t.id
            ) AS current_members
        FROM teams t
        WHERE
            -- no soy miembro del equipo
            NOT EXISTS (
                SELECT 1
                FROM team_members tm2
                WHERE tm2.team_id = t.id
                  AND tm2.user_id = :user_id
            )
            -- hay lugar disponible (no está lleno)
            AND (
                SELECT COUNT(*)
                FROM team_members tm3
                WHERE tm3.team_id = t.id
            ) < t.max_members
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':user_id' => $userId]);
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    json_response(['teams' => $teams]);
}


/**
 * NUEVO: unirse a un equipo (sin aprobación extra).
 *
 * Front: action=team_join_request_create
 * Body: { "team_id": X, "message": "opcional" }
 *
 * Reglas:
 * - Debe existir el equipo.
 * - No debe estar ya en el equipo.
 * - El equipo no debe estar lleno.
 */
function team_join_request_create_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    if (empty($input['team_id'])) {
        json_response(['error' => 'team_id requerido'], 400);
    }

    $teamId = (int)$input['team_id'];
    $team   = team_find_by_id($pdo, $teamId);

    if (!$team) {
        json_response(['error' => 'Equipo no encontrado'], 404);
    }

    if (team_member_is_in_team($pdo, $teamId, $userId)) {
        json_response(['error' => 'Ya eres integrante de este equipo'], 400);
    }

    $currentCount = team_member_count($pdo, $teamId);
    if ($currentCount >= (int)$team['max_members']) {
        json_response(['error' => 'El equipo ya está lleno'], 400);
    }

    // En esta versión, directamente lo unimos al equipo
    team_member_add($pdo, $teamId, $userId);

    json_response([
        'message' => 'Te uniste al equipo correctamente',
        'team_id' => $teamId,
    ], 201);
}

/**
 * Listar integrantes de un equipo donde el usuario actual participa.
 *
 * Front: POST action=team_members_list
 * Body:  { "team_id": X }
 */
function team_members_list_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    if (empty($input['team_id'])) {
        json_response(['error' => 'team_id requerido'], 400);
    }

    $teamId = (int)$input['team_id'];

    $team = team_find_by_id($pdo, $teamId);
    if (!$team) {
        json_response(['error' => 'Equipo no encontrado'], 404);
    }

    // Solo alguien que forma parte del equipo (o el dueño) puede ver los integrantes
    $isOwner  = ((int)$team['owner_id'] === $userId);
    $isMember = team_member_is_in_team($pdo, $teamId, $userId);

    if (!$isOwner && !$isMember) {
        json_response(['error' => 'No formas parte de este equipo'], 403);
    }

    $sql = "
        SELECT
            tm.user_id AS id,
            u.first_name,
            u.last_name,
            u.email,
            u.dni,
            tm.role,
            tm.joined_at,
            CASE
                WHEN u.id = :owner_id THEN 1
                ELSE 0
            END AS is_owner
        FROM team_members tm
        INNER JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = :team_id
        ORDER BY is_owner DESC, tm.joined_at ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':team_id'  => $teamId,
        ':owner_id' => (int)$team['owner_id'],
    ]);

    $members = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    json_response([
        'team'    => [
            'id'    => $team['id'],
            'name'  => $team['name'],
            'sport' => $team['sport'],
        ],
        'members' => $members,
    ]);
}