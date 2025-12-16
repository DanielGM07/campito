-- File: database/schema.sql

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS campito_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campito_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    dni               VARCHAR(20)  NOT NULL UNIQUE,
    birth_date        DATE         NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    location          VARCHAR(255) NOT NULL,
    is_player         TINYINT(1)   NOT NULL DEFAULT 1,
    is_provider       TINYINT(1)   NOT NULL DEFAULT 0,
    is_admin          TINYINT(1)   NOT NULL DEFAULT 0,
    status            ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de solicitudes de proveedor
CREATE TABLE IF NOT EXISTS provider_requests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    venue_name      VARCHAR(255) NOT NULL,
    contact_phone   VARCHAR(50),
    contact_email   VARCHAR(255),
    address         VARCHAR(255) NOT NULL,
    description     TEXT,
    status          ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    admin_comment   TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_provider_requests_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Perfil de proveedor (sede)
CREATE TABLE IF NOT EXISTS providers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    venue_name      VARCHAR(255) NOT NULL,
    contact_phone   VARCHAR(50),
    contact_email   VARCHAR(255),
    address         VARCHAR(255) NOT NULL,
    description     TEXT,
    status          ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_providers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabla de canchas
CREATE TABLE IF NOT EXISTS courts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_id      INT UNSIGNED NOT NULL,
    name             VARCHAR(100) NOT NULL,
    sport            VARCHAR(50)  NOT NULL,
    price_per_hour   DECIMAL(10,2) NOT NULL,
    max_players      INT UNSIGNED NOT NULL,
    internal_location VARCHAR(255),
    status           ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
    photos_json      JSON NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_courts_provider
        FOREIGN KEY (provider_id) REFERENCES providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabla de horarios predefinidos por cancha (bloques de tiempo)
CREATE TABLE IF NOT EXISTS court_time_slots (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    court_id    INT UNSIGNED NOT NULL,
    weekday     TINYINT UNSIGNED NOT NULL, -- 0=domingo, 6=sábado
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_time_slots_court
        FOREIGN KEY (court_id) REFERENCES courts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Equipos
CREATE TABLE IF NOT EXISTS teams (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id       INT UNSIGNED NOT NULL,
    name           VARCHAR(100) NOT NULL,
    sport          VARCHAR(50)  NOT NULL,
    description    TEXT,
    max_members    INT UNSIGNED NOT NULL DEFAULT 11,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_teams_owner
        FOREIGN KEY (owner_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Miembros de equipo
CREATE TABLE IF NOT EXISTS team_members (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id    INT UNSIGNED NOT NULL,
    user_id    INT UNSIGNED NOT NULL,
    role       ENUM('captain', 'member') NOT NULL DEFAULT 'member',
    joined_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_team_member (team_id, user_id),
    CONSTRAINT fk_team_members_team
        FOREIGN KEY (team_id) REFERENCES teams(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_team_members_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Invitaciones a equipo
CREATE TABLE IF NOT EXISTS team_invitations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id        INT UNSIGNED NOT NULL,
    invited_user_id INT UNSIGNED NULL,
    invited_email  VARCHAR(255) NULL,
    status         ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at   DATETIME NULL,
    CONSTRAINT fk_team_inv_team
        FOREIGN KEY (team_id) REFERENCES teams(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_team_inv_user
        FOREIGN KEY (invited_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Torneos
CREATE TABLE IF NOT EXISTS tournaments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_id      INT UNSIGNED NOT NULL,
    name             VARCHAR(255) NOT NULL,
    sport            VARCHAR(50)  NOT NULL,
    description      TEXT,
    rules            TEXT,
    prizes           TEXT,
    venue_info       VARCHAR(255),
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    max_teams        INT UNSIGNED NOT NULL,
    min_players_per_team INT UNSIGNED NOT NULL,
    max_players_per_team INT UNSIGNED NOT NULL,
    registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    status           ENUM('scheduled', 'registration_open', 'registration_closed', 'in_progress', 'finished', 'cancelled')
                    NOT NULL DEFAULT 'scheduled',
    winning_team_id  INT UNSIGNED NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tournaments_provider
        FOREIGN KEY (provider_id) REFERENCES providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_tournaments_winner
        FOREIGN KEY (winning_team_id) REFERENCES teams(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Equipos inscriptos a torneos
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT UNSIGNED NOT NULL,
    team_id       INT UNSIGNED NOT NULL,
    total_fee     DECIMAL(10,2) NOT NULL,
    status        ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tournament_team (tournament_id, team_id),
    CONSTRAINT fk_tourn_reg_tournament
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_tourn_reg_team
        FOREIGN KEY (team_id) REFERENCES teams(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Partidos de torneo / Bloques de ocupación (Opción A)
-- CAMBIO: team_home_id y team_away_id ahora son NULLABLE para permitir “bloques”
CREATE TABLE IF NOT EXISTS matches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournament_id   INT UNSIGNED NOT NULL,
    court_id        INT UNSIGNED NULL,
    team_home_id    INT UNSIGNED NULL,
    team_away_id    INT UNSIGNED NULL,
    match_datetime  DATETIME NOT NULL,
    home_score      INT NULL,
    away_score      INT NULL,
    status          ENUM('scheduled', 'in_progress', 'finished', 'cancelled') NOT NULL DEFAULT 'scheduled',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_matches_tournament
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_matches_court
        FOREIGN KEY (court_id) REFERENCES courts(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_matches_home_team
        FOREIGN KEY (team_home_id) REFERENCES teams(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_matches_away_team
        FOREIGN KEY (team_away_id) REFERENCES teams(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Reservas de canchas
CREATE TABLE IF NOT EXISTS reservations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    court_id       INT UNSIGNED NOT NULL,
    player_id      INT UNSIGNED NOT NULL, -- jugador que hace la reserva
    team_id        INT UNSIGNED NULL,     -- si es reserva por equipo
    reserved_date  DATE NOT NULL,
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    total_price    DECIMAL(10,2) NOT NULL,
    price_per_player DECIMAL(10,2) NOT NULL,
    players_count  INT UNSIGNED NOT NULL,
    type           ENUM('individual', 'team') NOT NULL DEFAULT 'individual',
    status         ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_court
        FOREIGN KEY (court_id) REFERENCES courts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_res_player
        FOREIGN KEY (player_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_res_team
        FOREIGN KEY (team_id) REFERENCES teams(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índice para evitar reservas superpuestas por cancha (se validará a nivel app usando este índice)
CREATE INDEX idx_reservations_court_datetime
    ON reservations (court_id, reserved_date, start_time, end_time);

-- Reseñas y calificaciones
CREATE TABLE IF NOT EXISTS reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT UNSIGNED NOT NULL,
    player_id      INT UNSIGNED NOT NULL,
    provider_id    INT UNSIGNED NOT NULL,
    court_id       INT UNSIGNED NOT NULL,
    rating         TINYINT UNSIGNED NOT NULL, -- 1 a 5
    comment        TEXT,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review_reservation (reservation_id, player_id),
    CONSTRAINT fk_reviews_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_player
        FOREIGN KEY (player_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_provider
        FOREIGN KEY (provider_id) REFERENCES providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_court
        FOREIGN KEY (court_id) REFERENCES courts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Wallet de puntos por jugador
CREATE TABLE IF NOT EXISTS player_wallets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    player_id     INT UNSIGNED NOT NULL,
    points_balance INT NOT NULL DEFAULT 0,
    stars_balance  INT NOT NULL DEFAULT 0,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wallet_player (player_id),
    CONSTRAINT fk_wallets_player
        FOREIGN KEY (player_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Movimientos de puntos/estrellas
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_id      INT UNSIGNED NOT NULL,
    type           ENUM('points', 'stars') NOT NULL,
    amount         INT NOT NULL,
    description    VARCHAR(255),
    related_reservation_id INT UNSIGNED NULL,
    related_tournament_id  INT UNSIGNED NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_tx_wallet
        FOREIGN KEY (wallet_id) REFERENCES player_wallets(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_wallet_tx_reservation
        FOREIGN KEY (related_reservation_id) REFERENCES reservations(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_wallet_tx_tournament
        FOREIGN KEY (related_tournament_id) REFERENCES tournaments(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Promociones (globales o de proveedor)
CREATE TABLE IF NOT EXISTS promotions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_id    INT UNSIGNED NULL, -- NULL = global
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    discount_type  ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_points     INT NOT NULL DEFAULT 0,
    valid_from     DATE NOT NULL,
    valid_to       DATE NOT NULL,
    conditions     TEXT,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_promotions_provider
        FOREIGN KEY (provider_id) REFERENCES providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Canjes de promociones
CREATE TABLE IF NOT EXISTS promotion_redemptions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promotion_id   INT UNSIGNED NOT NULL,
    player_id      INT UNSIGNED NOT NULL,
    reservation_id INT UNSIGNED NULL,
    tournament_id  INT UNSIGNED NULL,
    points_spent   INT NOT NULL,
    discount_applied DECIMAL(10,2) NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_redemptions_promotion
        FOREIGN KEY (promotion_id) REFERENCES promotions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_redemptions_player
        FOREIGN KEY (player_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_redemptions_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_redemptions_tournament
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      INT UNSIGNED NOT NULL,
    type         VARCHAR(50) NOT NULL,
    title        VARCHAR(255) NOT NULL,
    message      TEXT NOT NULL,
    is_read      TINYINT(1) NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Logs básicos de auditoría (opcional)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   INT UNSIGNED NULL,
    metadata    JSON NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;
