<?php
// File: backend/src/models/ReservationModel.php

function reservation_has_overlap_for_court(PDO $pdo, int $courtId, string $date, string $start, string $end): bool
{
    $sql = "SELECT COUNT(*) AS cnt
            FROM reservations
            WHERE court_id = :court_id
              AND reserved_date = :reserved_date
              AND status IN ('pending','confirmed')
              AND NOT (end_time <= :start_time OR start_time >= :end_time)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'court_id'      => $courtId,
        'reserved_date' => $date,
        'start_time'    => $start,
        'end_time'      => $end,
    ]);
    $row = $stmt->fetch();

    return $row && (int)$row['cnt'] > 0;
}

function reservation_has_overlap_for_player(PDO $pdo, int $playerId, string $date, string $start, string $end): bool
{
    $sql = "SELECT COUNT(*) AS cnt
            FROM reservations
            WHERE player_id = :player_id
              AND reserved_date = :reserved_date
              AND status IN ('pending','confirmed')
              AND NOT (end_time <= :start_time OR start_time >= :end_time)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'player_id'     => $playerId,
        'reserved_date' => $date,
        'start_time'    => $start,
        'end_time'      => $end,
    ]);
    $row = $stmt->fetch();

    return $row && (int)$row['cnt'] > 0;
}

function reservation_weekly_count_for_player(PDO $pdo, int $playerId, string $date): int
{
    $sql = "SELECT COUNT(*) AS cnt
            FROM reservations
            WHERE player_id = :player_id
              AND status NOT IN ('cancelled', 'rejected')
              AND YEARWEEK(reserved_date, 1) = YEARWEEK(:reserved_date, 1)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'player_id'     => $playerId,
        'reserved_date' => $date,
    ]);
    $row = $stmt->fetch();

    return $row ? (int)$row['cnt'] : 0;
}

function reservation_conflicts_with_tournament(PDO $pdo, int $courtId, string $date, string $start, string $end): bool
{
    $sql = "SELECT COUNT(*) AS cnt
            FROM matches m
            INNER JOIN tournaments t ON t.id = m.tournament_id
            WHERE m.court_id = :court_id
              AND DATE(m.match_datetime) = :reserved_date
              AND t.status IN ('scheduled','registration_open','in_progress')
              AND NOT (
                    DATE_ADD(m.match_datetime, INTERVAL 90 MINUTE) <= :start_time_dt
                    OR m.match_datetime >= :end_time_dt
              )";

    $startDt = $date . ' ' . $start;
    $endDt   = $date . ' ' . $end;

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'court_id'      => $courtId,
        'reserved_date' => $date,
        'start_time_dt' => $startDt,
        'end_time_dt'   => $endDt,
    ]);
    $row = $stmt->fetch();

    return $row && (int)$row['cnt'] > 0;
}

function reservation_create(PDO $pdo, array $data): int
{
    $sql = "INSERT INTO reservations
        (court_id, player_id, team_id, reserved_date, start_time, end_time, total_price,
         price_per_player, players_count, type, status)
        VALUES
        (:court_id, :player_id, :team_id, :reserved_date, :start_time, :end_time, :total_price,
         :price_per_player, :players_count, :type, :status)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'court_id'        => $data['court_id'],
        'player_id'       => $data['player_id'],
        'team_id'         => $data['team_id'],
        'reserved_date'   => $data['reserved_date'],
        'start_time'      => $data['start_time'],
        'end_time'        => $data['end_time'],
        'total_price'     => $data['total_price'],
        'price_per_player'=> $data['price_per_player'],
        'players_count'   => $data['players_count'],
        'type'            => $data['type'],
        'status'          => $data['status'],
    ]);

    return (int)$pdo->lastInsertId();
}

function reservation_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM reservations WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function reservation_update_status(PDO $pdo, int $id, string $status): void
{
    $stmt = $pdo->prepare("UPDATE reservations SET status = :status, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        'status' => $status,
        'id'     => $id,
    ]);
}

function reservation_update_time(PDO $pdo, int $id, string $date, string $start, string $end): void
{
    $sql = "UPDATE reservations
            SET reserved_date = :reserved_date,
                start_time = :start_time,
                end_time = :end_time,
                updated_at = NOW()
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'reserved_date' => $date,
        'start_time'    => $start,
        'end_time'      => $end,
        'id'            => $id,
    ]);
}

function reservation_list_by_player(PDO $pdo, int $playerId): array
{
    $stmt = $pdo->prepare("SELECT * FROM reservations WHERE player_id = :id ORDER BY reserved_date DESC, start_time DESC");
    $stmt->execute(['id' => $playerId]);
    return $stmt->fetchAll();
}

function reservation_list_by_court_and_date_range(PDO $pdo, int $courtId, string $from, string $to): array
{
    $stmt = $pdo->prepare(
        "SELECT * FROM reservations
         WHERE court_id = :court_id
           AND reserved_date BETWEEN :from AND :to
         ORDER BY reserved_date, start_time"
    );
    $stmt->execute([
        'court_id' => $courtId,
        'from'     => $from,
        'to'       => $to,
    ]);
    return $stmt->fetchAll();
}

function reservation_find_all_for_admin(PDO $pdo): array
{
    $sql = "
        SELECT 
            r.id,
            r.date,
            r.start_time,
            r.end_time,
            r.status,

            u.id AS player_id,
            u.first_name AS player_first_name,
            u.last_name AS player_last_name,
            u.email AS player_email,

            p.id AS provider_id,
            p.venue_name AS provider_name,

            c.id AS court_id,
            c.name AS court_name

        FROM reservations r
        INNER JOIN users u ON u.id = r.user_id
        INNER JOIN courts c ON c.id = r.court_id
        INNER JOIN providers p ON p.id = c.provider_id
        
        ORDER BY r.date DESC, r.start_time DESC
    ";

    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}