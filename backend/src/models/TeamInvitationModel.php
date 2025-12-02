<?php
// File: backend/src/models/TeamInvitationModel.php

function team_invitation_create(PDO $pdo, int $teamId, int $invitedUserId, ?string $invitedEmail = null): int
{
    $sql = "INSERT INTO team_invitations (team_id, invited_user_id, invited_email, status)
            VALUES (:team_id, :invited_user_id, :invited_email, 'pending')";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'team_id'        => $teamId,
        'invited_user_id'=> $invitedUserId,
        'invited_email'  => $invitedEmail,
    ]);
    return (int)$pdo->lastInsertId();
}

function team_invitation_find_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM team_invitations WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function team_invitation_list_pending_for_user(PDO $pdo, int $userId): array
{
    $sql = "SELECT ti.*, t.name AS team_name, t.sport
            FROM team_invitations ti
            INNER JOIN teams t ON t.id = ti.team_id
            WHERE ti.invited_user_id = :user_id
              AND ti.status = 'pending'
            ORDER BY ti.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['user_id' => $userId]);
    return $stmt->fetchAll();
}

function team_invitation_update_status(PDO $pdo, int $id, string $status): void
{
    $stmt = $pdo->prepare("UPDATE team_invitations
                           SET status = :status, responded_at = NOW()
                           WHERE id = :id");
    $stmt->execute([
        'status' => $status,
        'id'     => $id,
    ]);
}

function team_invitation_exists_pending(PDO $pdo, int $teamId, int $userId): bool
{
    $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt
                           FROM team_invitations
                           WHERE team_id = :team_id
                             AND invited_user_id = :user_id
                             AND status = 'pending'");
    $stmt->execute([
        'team_id' => $teamId,
        'user_id' => $userId,
    ]);
    $row = $stmt->fetch();
    return $row && (int)$row['cnt'] > 0;
}
