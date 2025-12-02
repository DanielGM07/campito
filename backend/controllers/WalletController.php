<?php
// File: backend/src/controllers/WalletController.php

require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/WalletModel.php';

function wallet_get_my_controller(PDO $pdo): void
{
    $playerId = auth_require_login();
    $wallet   = wallet_get_or_create($pdo, $playerId);
    $tx       = wallet_transactions_list($pdo, (int)$wallet['id']);

    json_response([
        'wallet'       => $wallet,
        'transactions' => $tx,
    ]);
}
