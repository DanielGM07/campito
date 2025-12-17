<?php
// File: backend/src/helpers/time.php

require_once __DIR__ . '/response.php';

// Acepta "HH:MM" o "HH:MM:SS" y fuerza "HH:00:00" (solo horas en punto).
// NO permite 24:00 acá.
function normalize_hour_time(string $t): string
{
    $t = trim($t);

    // si viene "HH:MM", lo pasamos a "HH:MM:00"
    if (preg_match('/^\d{2}:\d{2}$/', $t)) {
        $t = $t . ':00';
    }

    if (!preg_match('/^\d{2}:\d{2}:\d{2}$/', $t)) {
        json_response(['error' => 'Formato de hora inválido. Usar HH:MM o HH:MM:SS'], 400);
    }

    [$hh, $mm, $ss] = array_map('intval', explode(':', $t));

    if ($hh < 0 || $hh > 23) {
        json_response(['error' => 'Hora inválida (0..23). Para fin se permite 24:00'], 400);
    }
    if ($mm !== 0 || $ss !== 0) {
        json_response(['error' => 'Los horarios deben ser en horas en punto (minutos y segundos 00)'], 400);
    }

    return sprintf('%02d:%02d:%02d', $hh, $mm, $ss);
}

// Permite "24:00" / "24:00:00" para end_time.
function normalize_end_time_allow_24(string $t): string
{
    $t = trim($t);
    if ($t === '24:00' || $t === '24:00:00') return '24:00:00';
    return normalize_hour_time($t);
}

// "HH:MM:SS" => HH int, y "24:00:00" => 24
function hour_time_to_int(string $t): int
{
    if ($t === '24:00:00') return 24;
    return (int)substr($t, 0, 2);
}
