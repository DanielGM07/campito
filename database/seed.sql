-- File: database/seed.sql
USE campito_db;
-- =========================
-- OPCIONAL: reset rápido (para re-ejecutar el seed sin errores por UNIQUE/FK)
-- Comentá este bloque si no querés borrar datos existentes.
-- =========================
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM audit_logs;
DELETE FROM promotion_redemptions;
DELETE FROM wallet_transactions;
DELETE FROM notifications;
DELETE FROM reviews;
DELETE FROM reservations;
DELETE FROM matches;
DELETE FROM tournament_registrations;
DELETE FROM tournaments;
DELETE FROM team_invitations;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM court_time_slots;
DELETE FROM courts;
DELETE FROM promotions;
DELETE FROM provider_requests;
DELETE FROM providers;
DELETE FROM player_wallets;
DELETE FROM users;
SET FOREIGN_KEY_CHECKS = 1;
-- =========================
-- Usuarios de prueba
-- Las contraseñas son "test"
-- =========================
INSERT INTO users (
    first_name,
    last_name,
    dni,
    birth_date,
    email,
    password_hash,
    location,
    is_player,
    is_provider,
    is_admin
  )
VALUES (
    'Admin',
    'Sistema',
    '00000000',
    '1990-01-01',
    'admin@campito.test',
    '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai',
    'Buenos Aires',
    0,
    0,
    1
  ),
  (
    'Juan',
    'Jugador',
    '12345678',
    '1995-05-10',
    'player@example.com',
    '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai',
    'Buenos Aires',
    1,
    0,
    0
  ),
  (
    'Pedro',
    'Proveedor',
    '23456789',
    '1992-03-15',
    'proveedor@example.com',
    '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai',
    'Buenos Aires',
    1,
    1,
    0
  ),
  -- más jugadores para tests
  (
    'Lucia',
    'Gomez',
    '34567890',
    '1998-08-20',
    'lucia@example.com',
    '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai',
    'Buenos Aires',
    1,
    0,
    0
  ),
  (
    'Martin',
    'Lopez',
    '45678901',
    '1996-02-14',
    'martin@example.com',
    '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai',
    'Buenos Aires',
    1,
    0,
    0
  ),
  (
    'Sofia',
    'Perez',
    '56789012',
    '2000-11-03',
    'sofia@example.com',
    '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai',
    'Buenos Aires',
    1,
    0,
    0
  ),
  -- otro proveedor para probar multivenue
  (
    'Nico',
    'Dueño',
    '67890123',
    '1989-07-07',
    'nico.proveedor@example.com',
    '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai',
    'Buenos Aires',
    1,
    1,
    0
  );
-- =========================
-- Proveedores de prueba
-- =========================
INSERT INTO providers (
    user_id,
    venue_name,
    contact_phone,
    contact_email,
    address,
    description
  )
VALUES (
    3,
    'Campito FC',
    '+54 11 1111-1111',
    'contacto@campitofc.test',
    'Av. Siempre Viva 123',
    'Complejo deportivo de prueba'
  ),
  (
    7,
    'La Canchita',
    '+54 11 2222-2222',
    'hola@lacanchita.test',
    'Calle Falsa 456',
    'Complejo alternativo para tests'
  );
-- =========================
-- Canchas de prueba
-- =========================
INSERT INTO courts (
    provider_id,
    name,
    sport,
    price_per_hour,
    max_players,
    internal_location,
    status
  )
VALUES (
    1,
    'Cancha 1',
    'futbol',
    8000.00,
    10,
    'Sector A',
    'active'
  ),
  (
    1,
    'Cancha 2',
    'futbol',
    9000.00,
    10,
    'Sector B',
    'active'
  ),
  (
    1,
    'Cancha 3',
    'futbol',
    7500.00,
    8,
    'Sector C',
    'maintenance'
  ),
  (
    2,
    'Cancha 1',
    'futbol',
    6500.00,
    10,
    'Sede B - Piso 1',
    'active'
  );
-- =========================
-- Time slots (evitar 24:00:00; usar 23:00:00-23:59:59 si querés el "último turno")
-- weekday: 1=Lunes ... 7=Domingo (según tu criterio)
-- =========================
INSERT INTO court_time_slots (
    court_id,
    weekday,
    start_time,
    end_time,
    is_available
  )
VALUES -- Campito FC - Cancha 1 (court_id=1) Lunes
  (1, 1, '10:00:00', '11:00:00', 1),
  (1, 1, '11:00:00', '12:00:00', 1),
  (1, 1, '12:00:00', '13:00:00', 1),
  (1, 1, '13:00:00', '14:00:00', 1),
  (1, 1, '14:00:00', '15:00:00', 1),
  (1, 1, '15:00:00', '16:00:00', 1),
  (1, 1, '16:00:00', '17:00:00', 1),
  (1, 1, '17:00:00', '18:00:00', 1),
  (1, 1, '18:00:00', '19:00:00', 1),
  (1, 1, '19:00:00', '20:00:00', 1),
  -- Campito FC - Cancha 2 (court_id=2) Martes
  (2, 2, '14:00:00', '15:00:00', 1),
  (2, 2, '15:00:00', '16:00:00', 1),
  (2, 2, '16:00:00', '17:00:00', 1),
  (2, 2, '17:00:00', '18:00:00', 1),
  -- La Canchita - Cancha 1 (court_id=4) Viernes
  (4, 5, '18:00:00', '19:00:00', 1),
  (4, 5, '19:00:00', '20:00:00', 1),
  (4, 5, '20:00:00', '21:00:00', 1);
-- =========================
-- Equipos de prueba
-- =========================
INSERT INTO teams (owner_id, name, sport, description, max_members)
VALUES (
    2,
    'Los Pibes del Fondo',
    'futbol',
    'Equipo de prueba',
    11
  ),
  (
    4,
    'Las Guerreras',
    'futbol',
    'Equipo femenino mixto para tests',
    11
  ),
  (
    5,
    'FC Palermo',
    'futbol',
    'Equipo barrio',
    11
  );
-- Miembros de equipos
INSERT INTO team_members (team_id, user_id, role)
VALUES (1, 2, 'captain'),
  (1, 4, 'member'),
  (1, 5, 'member'),
  (2, 4, 'captain'),
  (2, 6, 'member'),
  (3, 5, 'captain'),
  (3, 2, 'member');
-- Invitaciones (para testear flujo invitación por email y por usuario)
INSERT INTO team_invitations (
    team_id,
    invited_user_id,
    invited_email,
    status,
    responded_at
  )
VALUES (2, 5, NULL, 'pending', NULL),
  (
    3,
    NULL,
    'invitadoexterno@example.com',
    'pending',
    NULL
  );
-- =========================
-- Torneos de prueba
-- =========================
INSERT INTO tournaments (
    provider_id,
    name,
    sport,
    description,
    rules,
    prizes,
    venue_info,
    start_date,
    end_date,
    max_teams,
    min_players_per_team,
    max_players_per_team,
    registration_fee,
    status
  )
VALUES (
    1,
    'Torneo Apertura',
    'futbol',
    'Torneo de ejemplo',
    'Reglas básicas',
    'Copa + puntos',
    'Campito FC',
    '2025-02-01',
    '2025-03-01',
    8,
    7,
    11,
    15000.00,
    'registration_open'
  ),
  (
    1,
    'Relámpago Viernes',
    'futbol',
    'Torneo corto para probar brackets',
    'Eliminación directa',
    'Medallas',
    'Campito FC',
    '2025-12-20',
    '2025-12-20',
    4,
    5,
    11,
    5000.00,
    'registration_open'
  ),
  (
    2,
    'Copa La Canchita',
    'futbol',
    'Torneo sede B',
    'Fair play',
    'Copa',
    'La Canchita',
    '2026-01-10',
    '2026-02-10',
    8,
    7,
    11,
    12000.00,
    'scheduled'
  );
-- Registros de equipos en torneos
INSERT INTO tournament_registrations (tournament_id, team_id, total_fee, status)
VALUES (1, 1, 15000.00, 'confirmed'),
  (2, 1, 5000.00, 'confirmed'),
  (2, 2, 5000.00, 'confirmed'),
  (2, 3, 5000.00, 'pending');
-- =========================
-- Partidos (matches)
-- =========================
INSERT INTO matches (
    tournament_id,
    court_id,
    team_home_id,
    team_away_id,
    match_datetime,
    home_score,
    away_score,
    status
  )
VALUES -- Torneo 2 (Relámpago Viernes) - programados
  (
    2,
    1,
    1,
    2,
    '2025-12-20 18:00:00',
    NULL,
    NULL,
    'scheduled'
  ),
  (
    2,
    1,
    3,
    NULL,
    '2025-12-20 19:00:00',
    NULL,
    NULL,
    'scheduled'
  ),
  -- Torneo 1 (Apertura) - uno finalizado para probar UI
  (
    1,
    2,
    1,
    2,
    '2025-02-10 20:00:00',
    3,
    1,
    'finished'
  );
-- =========================
-- Reservas
-- =========================
INSERT INTO reservations (
    court_id,
    player_id,
    team_id,
    reserved_date,
    start_time,
    end_time,
    total_price,
    price_per_player,
    players_count,
    type,
    status
  )
VALUES -- individual (Juan)
  (
    1,
    2,
    NULL,
    '2025-12-22',
    '10:00:00',
    '11:00:00',
    8000.00,
    8000.00,
    1,
    'individual',
    'confirmed'
  ),
  -- team (Los Pibes)
  (
    2,
    2,
    1,
    '2025-12-22',
    '11:00:00',
    '12:00:00',
    9000.00,
    3000.00,
    3,
    'team',
    'confirmed'
  ),
  -- pending
  (
    4,
    4,
    NULL,
    '2025-12-19',
    '19:00:00',
    '20:00:00',
    6500.00,
    6500.00,
    1,
    'individual',
    'pending'
  ),
  -- cancelled
  (
    1,
    5,
    NULL,
    '2025-12-18',
    '12:00:00',
    '13:00:00',
    8000.00,
    8000.00,
    1,
    'individual',
    'cancelled'
  );
-- =========================
-- Reviews (una sobre una reserva confirmada / completada en tu lógica)
-- =========================
INSERT INTO reviews (
    reservation_id,
    player_id,
    provider_id,
    court_id,
    rating,
    comment
  )
VALUES (
    1,
    2,
    1,
    1,
    5,
    'Todo impecable, buena iluminación.'
  ),
  (
    2,
    2,
    1,
    2,
    4,
    'Buena cancha, pero el vestuario estaba lleno.'
  );
-- =========================
-- Wallets
-- =========================
INSERT INTO player_wallets (player_id, points_balance, stars_balance)
VALUES (2, 100, 3),
  (4, 60, 1),
  (5, 10, 0),
  (6, 0, 0);
-- Movimientos de wallet
INSERT INTO wallet_transactions (
    wallet_id,
    type,
    amount,
    description,
    related_reservation_id,
    related_tournament_id
  )
VALUES (
    1,
    'points',
    50,
    'Puntos por reserva #1',
    1,
    NULL
  ),
  (
    1,
    'stars',
    1,
    'Estrella por review',
    NULL,
    NULL
  ),
  (
    2,
    'points',
    60,
    'Puntos de bienvenida',
    NULL,
    NULL
  );
-- =========================
-- Promociones
-- =========================
INSERT INTO promotions (
    provider_id,
    name,
    description,
    discount_type,
    discount_value,
    min_points,
    valid_from,
    valid_to,
    conditions
  )
VALUES (
    NULL,
    '10% OFF en reservas',
    'Descuento del 10% en reservas de canchas',
    'percentage',
    10.00,
    50,
    '2025-01-01',
    '2025-12-31',
    'Válido solo para reservas entre semana'
  ),
  (
    1,
    '2x1 Martes',
    'Reservá 2 horas al precio de 1 los martes',
    'fixed_amount',
    8000.00,
    0,
    '2025-01-01',
    '2025-12-31',
    'Solo martes, de 14 a 18 hs'
  ),
  (
    2,
    'Promo Bienvenida',
    'Descuento fijo para nuevos usuarios',
    'fixed_amount',
    1000.00,
    0,
    '2025-01-01',
    '2026-12-31',
    'Una vez por usuario'
  );
-- Redenciones de promociones
INSERT INTO promotion_redemptions (
    promotion_id,
    player_id,
    reservation_id,
    tournament_id,
    points_spent,
    discount_applied
  )
VALUES (1, 2, 1, NULL, 50, 800.00);
-- =========================
-- Notificaciones
-- =========================
INSERT INTO notifications (user_id, type, title, message, is_read)
VALUES (
    2,
    'reservation',
    'Reserva confirmada',
    'Tu reserva #1 fue confirmada para el 2025-12-22 10:00.',
    0
  ),
  (
    2,
    'tournament',
    'Inscripción confirmada',
    'Tu equipo quedó inscripto en el torneo Relámpago Viernes.',
    1
  ),
  (
    4,
    'team',
    'Invitación pendiente',
    'Tenés una invitación para unirte a un equipo.',
    0
  ),
  (
    3,
    'admin',
    'Nuevo torneo creado',
    'Se creó el torneo Relámpago Viernes en tu complejo.',
    0
  );
-- =========================
-- Audit logs (para probar listados/admin)
-- =========================
INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
VALUES (
    3,
    'CREATE',
    'tournament',
    2,
    JSON_OBJECT('name', 'Relámpago Viernes', 'max_teams', 4)
  ),
  (
    2,
    'CREATE',
    'reservation',
    1,
    JSON_OBJECT(
      'court_id',
      1,
      'date',
      '2025-12-22',
      'start',
      '10:00'
    )
  ),
  (
    2,
    'REVIEW',
    'reservation',
    1,
    JSON_OBJECT('rating', 5)
  );