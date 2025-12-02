-- File: database/seed.sql

USE campito_db;

-- Usuarios de prueba
-- Las contraseñas son "test"
INSERT INTO users (first_name, last_name, dni, birth_date, email, password_hash, location, is_player, is_provider, is_admin)
VALUES
('Admin', 'Sistema', '00000000', '1990-01-01', 'admin@campito.test', '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai', 'Buenos Aires', 0, 0, 1),
('Juan', 'Jugador', '12345678', '1995-05-10', 'player@example.com', '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai', 'Buenos Aires', 1, 0, 0),
('Pedro', 'Proveedor', '23456789', '1992-03-15', 'proveedor@example.com', '$2y$10$796ya9G9QzB4Dfq4Qr5QnOXRD.20gSyufp0dHWAjSUYduWRs8L0Ai', 'Buenos Aires', 1, 1, 0);

-- Proveedor de prueba
INSERT INTO providers (user_id, venue_name, contact_phone, contact_email, address, description)
VALUES
(3, 'Campito FC', '+54 11 1111-1111', 'contacto@campitofc.test', 'Av. Siempre Viva 123', 'Complejo deportivo de prueba');

-- Canchas de prueba
INSERT INTO courts (provider_id, name, sport, price_per_hour, max_players, internal_location, status)
VALUES
(1, 'Cancha 1', 'futbol', 8000.00, 10, 'Sector A', 'active'),
(1, 'Cancha 2', 'futbol', 9000.00, 10, 'Sector B', 'active');

-- Equipo de prueba
INSERT INTO teams (owner_id, name, sport, description, max_members)
VALUES
(2, 'Los Pibes del Fondo', 'futbol', 'Equipo de prueba', 11);

INSERT INTO team_members (team_id, user_id, role)
VALUES
(1, 2, 'captain');

-- Torneo de prueba
INSERT INTO tournaments (provider_id, name, sport, description, rules, prizes, venue_info, start_date, end_date, max_teams, min_players_per_team, max_players_per_team, registration_fee, status)
VALUES
(1, 'Torneo Apertura', 'futbol', 'Torneo de ejemplo', 'Reglas básicas', 'Copa + puntos', 'Campito FC', '2025-02-01', '2025-03-01', 8, 7, 11, 15000.00, 'registration_open');

-- Registro de equipo en torneo
INSERT INTO tournament_registrations (tournament_id, team_id, total_fee, status)
VALUES
(1, 1, 15000.00, 'confirmed');

-- Wallet de puntos para usuarios
INSERT INTO player_wallets (player_id, points_balance, stars_balance)
VALUES
(2, 100, 3);

-- Promoción global de ejemplo
INSERT INTO promotions (provider_id, name, description, discount_type, discount_value, min_points, valid_from, valid_to, conditions)
VALUES
(NULL, '10% OFF en reservas', 'Descuento del 10% en reservas de canchas', 'percentage', 10.00, 50, '2025-01-01', '2025-12-31', 'Válido solo para reservas entre semana');

-- Promoción específica de proveedor
INSERT INTO promotions (provider_id, name, description, discount_type, discount_value, min_points, valid_from, valid_to, conditions)
VALUES
(1, '2x1 Martes', 'Reservá 2 horas al precio de 1 los martes', 'fixed_amount', 8000.00, 0, '2025-01-01', '2025-12-31', 'Solo martes, de 14 a 18 hs');
