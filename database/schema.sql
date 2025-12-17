-- Schema limpio (estructura) para campito_db
-- MariaDB/MySQL
CREATE DATABASE IF NOT EXISTS campito_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campito_db;
-- =========================
-- TABLAS
-- =========================
CREATE TABLE users (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    dni varchar(20) NOT NULL,
    birth_date date NOT NULL,
    email varchar(255) NOT NULL,
    password_hash varchar(255) NOT NULL,
    location varchar(255) NOT NULL,
    is_player tinyint(1) NOT NULL DEFAULT 1,
    is_provider tinyint(1) NOT NULL DEFAULT 0,
    is_admin tinyint(1) NOT NULL DEFAULT 0,
    status enum('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    UNIQUE KEY dni (dni),
    UNIQUE KEY email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE providers (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id int(10) UNSIGNED NOT NULL,
    venue_name varchar(255) NOT NULL,
    contact_phone varchar(50) DEFAULT NULL,
    contact_email varchar(255) DEFAULT NULL,
    address varchar(255) NOT NULL,
    description text DEFAULT NULL,
    status enum('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_providers_user (user_id),
    CONSTRAINT fk_providers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE provider_requests (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id int(10) UNSIGNED NOT NULL,
    venue_name varchar(255) NOT NULL,
    contact_phone varchar(50) DEFAULT NULL,
    contact_email varchar(255) DEFAULT NULL,
    address varchar(255) NOT NULL,
    description text DEFAULT NULL,
    status enum('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    admin_comment text DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_provider_requests_user (user_id),
    CONSTRAINT fk_provider_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE courts (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    provider_id int(10) UNSIGNED NOT NULL,
    name varchar(100) NOT NULL,
    sport varchar(50) NOT NULL,
    price_per_hour decimal(10, 2) NOT NULL,
    max_players int(10) UNSIGNED NOT NULL,
    internal_location varchar(255) DEFAULT NULL,
    status enum('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
    photos_json longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(photos_json)),
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_courts_provider (provider_id),
    CONSTRAINT fk_courts_provider FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE court_time_slots (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    court_id int(10) UNSIGNED NOT NULL,
    weekday tinyint(3) UNSIGNED NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_available tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_court_weekday_slot (court_id, weekday, start_time, end_time),
    KEY idx_court_timeslots_court_weekday (court_id, weekday, start_time),
    CONSTRAINT fk_time_slots_court FOREIGN KEY (court_id) REFERENCES courts (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE teams (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_id int(10) UNSIGNED NOT NULL,
    name varchar(100) NOT NULL,
    sport varchar(50) NOT NULL,
    description text DEFAULT NULL,
    max_members int(10) UNSIGNED NOT NULL DEFAULT 11,
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_teams_owner (owner_id),
    CONSTRAINT fk_teams_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE team_members (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id int(10) UNSIGNED NOT NULL,
    user_id int(10) UNSIGNED NOT NULL,
    role enum('captain', 'member') NOT NULL DEFAULT 'member',
    joined_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    UNIQUE KEY uq_team_member (team_id, user_id),
    KEY fk_team_members_user (user_id),
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE team_invitations (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id int(10) UNSIGNED NOT NULL,
    invited_user_id int(10) UNSIGNED DEFAULT NULL,
    invited_email varchar(255) DEFAULT NULL,
    status enum('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    responded_at datetime DEFAULT NULL,
    PRIMARY KEY (id),
    KEY fk_team_inv_team (team_id),
    KEY fk_team_inv_user (invited_user_id),
    CONSTRAINT fk_team_inv_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_team_inv_user FOREIGN KEY (invited_user_id) REFERENCES users (id) ON DELETE
    SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE tournaments (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    provider_id int(10) UNSIGNED NOT NULL,
    name varchar(255) NOT NULL,
    sport varchar(50) NOT NULL,
    description text DEFAULT NULL,
    rules text DEFAULT NULL,
    prizes text DEFAULT NULL,
    venue_info varchar(255) DEFAULT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    max_teams int(10) UNSIGNED NOT NULL,
    min_players_per_team int(10) UNSIGNED NOT NULL,
    max_players_per_team int(10) UNSIGNED NOT NULL,
    registration_fee decimal(10, 2) NOT NULL DEFAULT 0.00,
    status enum(
        'scheduled',
        'registration_open',
        'registration_closed',
        'in_progress',
        'finished',
        'cancelled'
    ) NOT NULL DEFAULT 'scheduled',
    winning_team_id int(10) UNSIGNED DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_tournaments_provider (provider_id),
    KEY fk_tournaments_winner (winning_team_id),
    CONSTRAINT fk_tournaments_provider FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tournaments_winner FOREIGN KEY (winning_team_id) REFERENCES teams (id) ON DELETE
    SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE tournament_registrations (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    tournament_id int(10) UNSIGNED NOT NULL,
    team_id int(10) UNSIGNED NOT NULL,
    total_fee decimal(10, 2) NOT NULL,
    status enum('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    UNIQUE KEY uq_tournament_team (tournament_id, team_id),
    KEY fk_tourn_reg_team (team_id),
    CONSTRAINT fk_tourn_reg_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tourn_reg_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE matches (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    tournament_id int(10) UNSIGNED NOT NULL,
    court_id int(10) UNSIGNED DEFAULT NULL,
    team_home_id int(10) UNSIGNED DEFAULT NULL,
    team_away_id int(10) UNSIGNED DEFAULT NULL,
    match_datetime datetime NOT NULL,
    home_score int(11) DEFAULT NULL,
    away_score int(11) DEFAULT NULL,
    status enum(
        'scheduled',
        'in_progress',
        'finished',
        'cancelled'
    ) NOT NULL DEFAULT 'scheduled',
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_matches_tournament (tournament_id),
    KEY fk_matches_court (court_id),
    KEY fk_matches_home_team (team_home_id),
    KEY fk_matches_away_team (team_away_id),
    CONSTRAINT fk_matches_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_matches_court FOREIGN KEY (court_id) REFERENCES courts (id) ON DELETE
    SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_matches_home_team FOREIGN KEY (team_home_id) REFERENCES teams (id) ON DELETE
    SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_matches_away_team FOREIGN KEY (team_away_id) REFERENCES teams (id) ON DELETE
    SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE reservations (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    court_id int(10) UNSIGNED NOT NULL,
    player_id int(10) UNSIGNED NOT NULL,
    team_id int(10) UNSIGNED DEFAULT NULL,
    reserved_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    total_price decimal(10, 2) NOT NULL,
    price_per_player decimal(10, 2) NOT NULL,
    players_count int(10) UNSIGNED NOT NULL,
    type enum('individual', 'team') NOT NULL DEFAULT 'individual',
    status enum(
        'pending',
        'confirmed',
        'rejected',
        'cancelled',
        'completed'
    ) NOT NULL DEFAULT 'pending',
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_res_player (player_id),
    KEY fk_res_team (team_id),
    KEY idx_reservations_court_datetime (court_id, reserved_date, start_time, end_time),
    CONSTRAINT fk_res_court FOREIGN KEY (court_id) REFERENCES courts (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_res_player FOREIGN KEY (player_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_res_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE
    SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE reviews (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    reservation_id int(10) UNSIGNED NOT NULL,
    player_id int(10) UNSIGNED NOT NULL,
    provider_id int(10) UNSIGNED NOT NULL,
    court_id int(10) UNSIGNED NOT NULL,
    rating tinyint(3) UNSIGNED NOT NULL,
    comment text DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_reservation (reservation_id, player_id),
    KEY fk_reviews_player (player_id),
    KEY fk_reviews_provider (provider_id),
    KEY fk_reviews_court (court_id),
    CONSTRAINT fk_reviews_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_player FOREIGN KEY (player_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_provider FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_court FOREIGN KEY (court_id) REFERENCES courts (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE notifications (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id int(10) UNSIGNED NOT NULL,
    type varchar(50) NOT NULL,
    title varchar(255) NOT NULL,
    message text NOT NULL,
    is_read tinyint(1) NOT NULL DEFAULT 0,
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_notifications_user (user_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE player_wallets (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id int(10) UNSIGNED NOT NULL,
    points_balance int(11) NOT NULL DEFAULT 0,
    stars_balance int(11) NOT NULL DEFAULT 0,
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    UNIQUE KEY uq_wallet_player (player_id),
    CONSTRAINT fk_wallets_player FOREIGN KEY (player_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE wallet_transactions (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    wallet_id int(10) UNSIGNED NOT NULL,
    type enum('points', 'stars') NOT NULL,
    amount int(11) NOT NULL,
    description varchar(255) DEFAULT NULL,
    related_reservation_id int(10) UNSIGNED DEFAULT NULL,
    related_tournament_id int(10) UNSIGNED DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_wallet_tx_wallet (wallet_id),
    KEY fk_wallet_tx_reservation (related_reservation_id),
    KEY fk_wallet_tx_tournament (related_tournament_id),
    CONSTRAINT fk_wallet_tx_wallet FOREIGN KEY (wallet_id) REFERENCES player_wallets (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wallet_tx_reservation FOREIGN KEY (related_reservation_id) REFERENCES reservations (id) ON DELETE
    SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_wallet_tx_tournament FOREIGN KEY (related_tournament_id) REFERENCES tournaments (id) ON DELETE
    SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE promotions (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    provider_id int(10) UNSIGNED DEFAULT NULL,
    name varchar(255) NOT NULL,
    description text DEFAULT NULL,
    discount_type enum('percentage', 'fixed_amount') NOT NULL,
    discount_value decimal(10, 2) NOT NULL,
    min_points int(11) NOT NULL DEFAULT 0,
    valid_from date NOT NULL,
    valid_to date NOT NULL,
    conditions text DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_promotions_provider (provider_id),
    CONSTRAINT fk_promotions_provider FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE
    SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE promotion_redemptions (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    promotion_id int(10) UNSIGNED NOT NULL,
    player_id int(10) UNSIGNED NOT NULL,
    reservation_id int(10) UNSIGNED DEFAULT NULL,
    tournament_id int(10) UNSIGNED DEFAULT NULL,
    points_spent int(11) NOT NULL,
    discount_applied decimal(10, 2) NOT NULL,
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_redemptions_promotion (promotion_id),
    KEY fk_redemptions_player (player_id),
    KEY fk_redemptions_reservation (reservation_id),
    KEY fk_redemptions_tournament (tournament_id),
    CONSTRAINT fk_redemptions_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_redemptions_player FOREIGN KEY (player_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_redemptions_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE
    SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_redemptions_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE
    SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE audit_logs (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id int(10) UNSIGNED DEFAULT NULL,
    action varchar(100) NOT NULL,
    entity_type varchar(100) NOT NULL,
    entity_id int(10) UNSIGNED DEFAULT NULL,
    metadata longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(metadata)),
    created_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    KEY fk_audit_user (user_id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE
    SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;