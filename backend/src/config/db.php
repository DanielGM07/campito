<?php
// File: backend/src/config/db.php

$DB_HOST = 'localhost';
$DB_NAME = 'campito_db';
$DB_USER = 'root';
$DB_PASS = ''; // XAMPP por defecto

$dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de conexión a la base de datos']);
    exit;
}
