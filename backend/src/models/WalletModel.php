<?php
// File: backend/src/models/WalletModel.php

function wallet_get_or_create(PDO $pdo, int $playerId): array
{
    $stmt = $pdo->prepare("SELECT * FROM player_wallets WHERE player_id = :pid LIMIT 1");
    $stmt->execute(['pid' => $playerId]);
    $wallet = $stmt->fetch();

    if ($wallet) {
        return $wallet;
    }

    $stmt = $pdo->prepare("INSERT INTO player_wallets (player_id, points_balance, stars_balance)
                           VALUES (:pid, 0, 0)");
    $stmt->execute(['pid' => $playerId]);

    $id = (int)$pdo->lastInsertId();
    return [
        'id'             => $id,
        'player_id'      => $playerId,
        'points_balance' => 0,
        'stars_balance'  => 0,
    ];
}

function wallet_add_transaction(PDO $pdo, int $walletId, string $type, int $amount, string $description = '', ?int $reservationId = null, ?int $tournamentId = null): void
{
    $sql = "INSERT INTO wallet_transactions
        (wallet_id, type, amount, description, related_reservation_id, related_tournament_id)
        VALUES
        (:wallet_id, :type, :amount, :description, :reservation_id, :tournament_id)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'wallet_id'      => $walletId,
        'type'           => $type,
        'amount'         => $amount,
        'description'    => $description,
        'reservation_id' => $reservationId,
        'tournament_id'  => $tournamentId,
    ]);

    if ($type === 'points') {
        $stmt2 = $pdo->prepare("UPDATE player_wallets
                                SET points_balance = points_balance + :amount,
                                    updated_at = NOW()
                                WHERE id = :id");
        $stmt2->execute(['amount' => $amount, 'id' => $walletId]);
    } else {
        $stmt2 = $pdo->prepare("UPDATE player_wallets
                                SET stars_balance = stars_balance + :amount,
                                    updated_at = NOW()
                                WHERE id = :id");
        $stmt2->execute(['amount' => $amount, 'id' => $walletId]);
    }
}

function wallet_get_by_player(PDO $pdo, int $playerId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM player_wallets WHERE player_id = :pid LIMIT 1");
    $stmt->execute(['pid' => $playerId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function wallet_transactions_list(PDO $pdo, int $walletId): array
{
    $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE wallet_id = :wid ORDER BY created_at DESC");
    $stmt->execute(['wid' => $walletId]);
    return $stmt->fetchAll();
}
