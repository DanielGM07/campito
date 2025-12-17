<?php
// File: backend/src/controllers/TournamentController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/ProviderModel.php';
require_once __DIR__ . '/../models/TeamModel.php';
require_once __DIR__ . '/../models/TournamentModel.php';
require_once __DIR__ . '/../models/TournamentRegistrationModel.php';

require_once __DIR__ . '/../helpers/time.php';
require_once __DIR__ . '/../models/CourtTimeSlotModel.php';

require_once __DIR__ . '/../helpers/court_schedule.php';
require_once __DIR__ . '/../helpers/reservation_conflicts.php';


function tournament_list_public_controller(PDO $pdo): void
{
    $filters = [
        'sport'     => $_GET['sport']     ?? null,
        'status'    => $_GET['status']    ?? 'registration_open',
        'from_date' => $_GET['from_date'] ?? null,
        'to_date'   => $_GET['to_date']   ?? null,
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

// ======================================================
// Helpers Provider
// ======================================================
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

// ======================================================
// LISTAR TORNEOS DEL PROVEEDOR
// ======================================================
function tournament_list_provider_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $me = user_find_by_id($pdo, $userId);

    if (!$me || !$me['is_provider']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $provider = provider_find_by_user($pdo, $userId);

    $stmt = $pdo->prepare("
        SELECT *
        FROM tournaments
        WHERE provider_id = :pid
        ORDER BY created_at DESC
    ");

    $stmt->execute(['pid' => $provider['id']]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(['tournaments' => $rows]);
}

// ======================================================
// ACTUALIZAR TORNEO (Proveedor)
// ======================================================
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

// ======================================================
// CAMBIAR STATUS TORNEO (Proveedor)
// ======================================================
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

// ======================================================
// ADMIN: LISTAR TODOS LOS TORNEOS
// ======================================================
function admin_tournament_list_controller(PDO $pdo): void
{
    $adminId = auth_require_login();
    $me = user_find_by_id($pdo, $adminId);

    if (!$me || !$me['is_admin']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    try {
        $rows = tournament_find_all_for_admin($pdo);

        $tournaments = array_map(function ($t) {
            return [
                "id"            => $t["id"],
                "name"          => $t["name"],
                "sport"         => $t["sport"],
                "status"        => $t["status"],
                "start_date"    => $t["start_date"],
                "end_date"      => $t["end_date"],
                "provider_id"   => $t["provider_id"],
                "provider_name" => $t["provider_name"],
                "team_count"    => (int)$t["team_count"],
            ];
        }, $rows);

        json_response(["tournaments" => $tournaments]);

    } catch (Throwable $e) {
        error_log($e->getMessage());
        json_response(["error" => "Error al obtener torneos"], 500);
    }
}

// ======================================================
// CREAR TORNEO (Proveedor) + BLOQUEO HORARIO (Opción A)
// ======================================================
function tournament_create_provider_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $me = user_find_by_id($pdo, $userId);

    if (!$me || !$me['is_provider']) {
        json_response(['error' => 'No autorizado'], 403);
    }

    $provider = provider_find_by_user($pdo, $userId);
    if (!$provider) {
        json_response(['error' => 'No tienes perfil de proveedor'], 404);
    }

    $input = get_json_input();

    $required = [
        'name', 'sport', 'description', 'rules', 'prizes',
        'start_date', 'end_date',
        'start_time', 'end_time',
        'court_id',
        'max_teams', 'min_players_per_team', 'max_players_per_team',
        'registration_fee'
    ];

    foreach ($required as $r) {
        if (!isset($input[$r]) || $input[$r] === '') {
            json_response(['error' => "Campo requerido: $r"], 400);
        }
    }

    // fechas
    if ($input['end_date'] < $input['start_date']) {
        json_response(['error' => 'La fecha fin no puede ser menor a la fecha inicio'], 400);
    }

    // normalizar horas (en punto, permitir 24:00 en fin)
    $startTime = normalize_hour_time((string)$input['start_time']);
    $endTime   = normalize_end_time_allow_24((string)$input['end_time']);

    $sHour = hour_time_to_int($startTime);
    $eHour = hour_time_to_int($endTime);

    if ($eHour <= $sHour) {
        json_response(['error' => 'La hora fin debe ser mayor que la hora inicio'], 400);
    }

    $courtId = (int)$input['court_id'];

    // Verificar cancha del proveedor + activa
    $stmtCourt = $pdo->prepare("
        SELECT c.*
        FROM courts c
        WHERE c.id = :court_id
          AND c.provider_id = :provider_id
          AND c.status = 'active'
        LIMIT 1
    ");
    $stmtCourt->execute([
        'court_id'    => $courtId,
        'provider_id' => (int)$provider['id'],
    ]);
    $court = $stmtCourt->fetch(PDO::FETCH_ASSOC);

    if (!$court) {
        json_response(['error' => 'Cancha inválida o no pertenece a tu sede'], 400);
    }

    // deporte debe coincidir
    if (($court['sport'] ?? null) !== $input['sport']) {
        json_response(['error' => 'El deporte del torneo debe coincidir con el deporte de la cancha'], 400);
    }

    $tz = new DateTimeZone("America/Argentina/Buenos_Aires");
    $d1 = new DateTime($input['start_date'], $tz);
    $d2 = new DateTime($input['end_date'], $tz);

    // VALIDACIÓN: torneo dentro de horarios de la cancha + sin reservas
    $d = clone $d1;
    while ($d <= $d2) {
        $weekday = (int)$d->format('w'); // 0..6

        // slots base para ese weekday
        $slots = court_timeslots_list_for_court_weekday($pdo, $courtId, $weekday);

        $availableStartHours = [];
        foreach ($slots as $s) {
            $availableStartHours[hour_time_to_int((string)$s['start_time'])] = true;
        }

        // cada hora del torneo debe existir como slot
        for ($h = $sHour; $h < $eHour; $h++) {
            if (empty($availableStartHours[$h])) {
                $missing = sprintf('%02d:00', $h);
                json_response([
                    'error' => "El torneo se sale del horario disponible de la cancha. Falta el turno $missing para el día " . $d->format('Y-m-d')
                ], 400);
            }
        }

        // reservas existentes ese día
        $stmtRes = $pdo->prepare("
            SELECT start_time, end_time
            FROM reservations
            WHERE court_id = :court_id
              AND reserved_date = :reserved_date
              AND status IN ('pending','confirmed','in_progress','completed')
        ");
        $stmtRes->execute([
            ':court_id' => $courtId,
            ':reserved_date' => $d->format('Y-m-d'),
        ]);
        $reservations = $stmtRes->fetchAll(PDO::FETCH_ASSOC) ?: [];

        for ($h = $sHour; $h < $eHour; $h++) {
            $blockStart = sprintf('%02d:00:00', $h);
            $blockEnd   = ($h + 1 === 24) ? '24:00:00' : sprintf('%02d:00:00', $h + 1);

            foreach ($reservations as $r) {
                $rs = (string)$r['start_time'];
                $re = (string)$r['end_time'];
                if ($blockStart < $re && $blockEnd > $rs) {
                    json_response([
                        'error' => "No se puede crear el torneo: existe una reserva el " . $d->format('Y-m-d') .
                                   " en el horario " . substr($blockStart,0,5) . " - " . substr($blockEnd,0,5)
                    ], 400);
                }
            }
        }

        $d->modify('+1 day');
    }

    try {
        $pdo->beginTransaction();

        // Crear torneo (mismo INSERT que tenías)
        $stmt = $pdo->prepare("
            INSERT INTO tournaments (
                provider_id, name, sport, description, rules, prizes,
                venue_info, start_date, end_date,
                max_teams, min_players_per_team, max_players_per_team,
                registration_fee,
                status
            ) VALUES (
                :provider_id, :name, :sport, :description, :rules, :prizes,
                :venue_info, :start_date, :end_date,
                :max_teams, :min_players_per_team, :max_players_per_team,
                :registration_fee,
                'registration_open'
            )
        ");

        $stmt->execute([
            'provider_id'          => (int)$provider['id'],
            'name'                 => $input['name'],
            'sport'                => $input['sport'],
            'description'          => $input['description'],
            'rules'                => $input['rules'],
            'prizes'               => $input['prizes'],
            'venue_info'           => $input['venue_info'] ?? '',
            'start_date'           => $input['start_date'],
            'end_date'             => $input['end_date'],
            'max_teams'            => (int)$input['max_teams'],
            'min_players_per_team' => (int)$input['min_players_per_team'],
            'max_players_per_team' => (int)$input['max_players_per_team'],
            'registration_fee'     => (float)$input['registration_fee'],
        ]);

        $tournamentId = (int)$pdo->lastInsertId();

        // Generar matches/bloques de 1 hora
        $insertMatch = $pdo->prepare("
            INSERT INTO matches (
                tournament_id,
                court_id,
                team_home_id,
                team_away_id,
                match_datetime,
                status
            ) VALUES (
                :tournament_id,
                :court_id,
                NULL,
                NULL,
                :match_datetime,
                'scheduled'
            )
        ");

        $d = new DateTime($input['start_date'], $tz);
        $end = new DateTime($input['end_date'], $tz);

        while ($d <= $end) {
            for ($h = $sHour; $h < $eHour; $h++) {
                $dt = $d->format('Y-m-d') . ' ' . sprintf('%02d:00:00', $h);
                $insertMatch->execute([
                    'tournament_id'  => $tournamentId,
                    'court_id'       => $courtId,
                    'match_datetime' => $dt,
                ]);
            }
            $d->modify('+1 day');
        }

        $pdo->commit();

        json_response([
            'message'       => 'Torneo creado y horarios bloqueados correctamente',
            'tournament_id' => $tournamentId,
        ], 201);

    } catch (Throwable $e) {
        $pdo->rollBack();
        error_log($e->getMessage());
        json_response(['error' => 'Error al crear torneo'], 500);
    }
}


// ======================================================
// INSCRIPCIÓN DE EQUIPO EN TORNEO (Jugador - solo capitán)
// (sin cambios por ahora)
// ======================================================
function tournament_register_team_controller(PDO $pdo): void
{
    $userId = auth_require_login();
    $input  = get_json_input();

    if (empty($input['tournament_id']) || empty($input['team_id'])) {
        json_response(['error' => 'tournament_id y team_id son requeridos'], 400);
    }

    $tournamentId = (int)$input['tournament_id'];
    $teamId       = (int)$input['team_id'];

    // 1) Verificar que el usuario sea CAPITÁN del equipo
    $stmt = $pdo->prepare("
        SELECT role
        FROM team_members
        WHERE team_id = :tid AND user_id = :uid
        LIMIT 1
    ");
    $stmt->execute(['tid' => $teamId, 'uid' => $userId]);
    $rowRole = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$rowRole || $rowRole['role'] !== 'captain') {
        json_response(['error' => 'Solo el capitán del equipo puede inscribirlo en un torneo'], 403);
    }

    // 2) Obtener torneo
    $stmt = $pdo->prepare("SELECT * FROM tournaments WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $tournamentId]);
    $tournament = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tournament) {
        json_response(['error' => 'Torneo no encontrado'], 404);
    }
    if ($tournament['status'] !== 'registration_open') {
        json_response(['error' => 'La inscripción para este torneo no está abierta'], 400);
    }

    $startDate = $tournament['start_date'];
    $endDate   = $tournament['end_date'];

    // 3) Obtener equipo
    $team = team_find_by_id($pdo, $teamId);
    if (!$team) {
        json_response(['error' => 'Equipo no encontrado'], 404);
    }

    // Deporte debe coincidir
    if ($team['sport'] !== $tournament['sport']) {
        json_response(['error' => 'El deporte del equipo no coincide con el del torneo'], 400);
    }

    // 4) Validar cantidad de jugadores del equipo
    $membersCount = team_member_count($pdo, $teamId);
    if ($membersCount < (int)$tournament['min_players_per_team'] ||
        $membersCount > (int)$tournament['max_players_per_team']) {
        json_response([
            'error' => 'La cantidad de jugadores del equipo no cumple los requisitos del torneo',
        ], 400);
    }

    // 5) Verificar que el equipo NO esté ya inscripto en este torneo
    $stmt = $pdo->prepare("
        SELECT id
        FROM tournament_registrations
        WHERE tournament_id = :tid AND team_id = :team_id
        LIMIT 1
    ");
    $stmt->execute([
        'tid'      => $tournamentId,
        'team_id'  => $teamId,
    ]);
    if ($stmt->fetch()) {
        json_response(['error' => 'El equipo ya está inscripto en este torneo'], 400);
    }

    // 6) Verificar cupo
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS cnt
        FROM tournament_registrations
        WHERE tournament_id = :tid
          AND status IN ('pending', 'confirmed')
    ");
    $stmt->execute(['tid' => $tournamentId]);
    $regCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

    if ($regCount >= (int)$tournament['max_teams']) {
        json_response(['error' => 'Cupo de equipos alcanzado para este torneo'], 400);
    }

    // 7) Conflictos de jugadores en otros torneos (fechas)
    $stmt = $pdo->prepare("
        SELECT user_id
        FROM team_members
        WHERE team_id = :tid
    ");
    $stmt->execute(['tid' => $teamId]);
    $playerRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $conflicts = [];
    if ($playerRows) {
        $placeholders = [];
        $params = [
            ':current_tournament_id' => $tournamentId,
            ':start_date'            => $startDate,
            ':end_date'              => $endDate,
        ];

        $i = 0;
        foreach ($playerRows as $pr) {
            $ph = ':p' . $i;
            $placeholders[] = $ph;
            $params[$ph] = (int)$pr['user_id'];
            $i++;
        }

        $inClause = implode(',', $placeholders);

        $sqlConflicts = "
            SELECT DISTINCT
                u.id       AS player_id,
                u.first_name,
                u.last_name,
                t2.id      AS tournament_id,
                t2.name    AS tournament_name
            FROM team_members tm2
            INNER JOIN tournament_registrations tr2
                ON tr2.team_id = tm2.team_id
            INNER JOIN tournaments t2
                ON t2.id = tr2.tournament_id
            INNER JOIN users u
                ON u.id = tm2.user_id
            WHERE tm2.user_id IN ($inClause)
              AND tr2.tournament_id <> :current_tournament_id
              AND t2.status IN ('registration_open','registration_closed','in_progress')
              AND NOT (
                    t2.end_date < :start_date
                    OR t2.start_date > :end_date
              )
        ";

        $stmt = $pdo->prepare($sqlConflicts);
        $stmt->execute($params);
        $conflicts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if (!empty($conflicts)) {
        $names = [];
        foreach ($conflicts as $c) {
            $names[] = $c['first_name'] . ' ' . $c['last_name'] . ' (torneo: ' . $c['tournament_name'] . ')';
        }
        $names = array_unique($names);

        json_response([
            'error' => 'Hay jugadores de tu equipo que ya están inscriptos en otros torneos con fechas superpuestas: ' .
                       implode('; ', $names),
        ], 400);
    }

    // 8) Crear inscripción
    $stmt = $pdo->prepare("
        INSERT INTO tournament_registrations (
            tournament_id, team_id, total_fee, status
        ) VALUES (
            :t, :team, :fee, 'confirmed'
        )
    ");
    $stmt->execute([
        't'    => $tournamentId,
        'team' => $teamId,
        'fee'  => $tournament['registration_fee'],
    ]);

    json_response(['message' => 'Inscripción exitosa'], 201);
}
