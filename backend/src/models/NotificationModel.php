<?php
// File: backend/src/models/NotificationModel.php

function notification_create(PDO $pdo, int $userId, string $type, string $title, string $message): void
{
    $sql = "INSERT INTO notifications (user_id, type, title, message)
            VALUES (:user_id, :type, :title, :message)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'user_id' => $userId,
        'type'    => $type,
        'title'   => $title,
        'message' => $message,
    ]);
}

function notification_list_for_user(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = :uid ORDER BY created_at DESC");
    $stmt->execute(['uid' => $userId]);
    return $stmt->fetchAll();
}

function notification_mark_as_read(PDO $pdo, int $userId, int $notificationId): void
{
    $sql = "UPDATE notifications
            SET is_read = 1
            WHERE id = :id AND user_id = :uid";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'id'  => $notificationId,
        'uid' => $userId,
    ]);
}
