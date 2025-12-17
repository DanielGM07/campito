<?php
// File: backend/public/index.php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../src/config/db.php';
require_once __DIR__ . '/../src/helpers/response.php';
require_once __DIR__ . '/../src/helpers/auth.php';

// Models base
require_once __DIR__ . '/../src/models/UserModel.php';

// Controllers
require_once __DIR__ . '/../src/controllers/AuthController.php';
require_once __DIR__ . '/../src/controllers/UserController.php';
require_once __DIR__ . '/../src/controllers/ProviderRequestController.php';
require_once __DIR__ . '/../src/controllers/ProviderController.php';
require_once __DIR__ . '/../src/controllers/CourtController.php';
require_once __DIR__ . '/../src/controllers/ReservationController.php';

require_once __DIR__ . '/../src/controllers/TeamController.php';
require_once __DIR__ . '/../src/controllers/TournamentController.php';
require_once __DIR__ . '/../src/controllers/ReviewController.php';
require_once __DIR__ . '/../src/controllers/WalletController.php';
require_once __DIR__ . '/../src/controllers/PromotionController.php';
require_once __DIR__ . '/../src/controllers/NotificationController.php';
require_once __DIR__ . '/../src/controllers/RankingController.php';

$action = $_GET['action'] ?? 'ping';

try {
    switch ($action) {
        case 'ping':
            json_response(['message' => 'API Campito OK']);
            break;

        // =========================
        // Auth
        // =========================
        case 'auth_register_player':
            auth_register_player($pdo);
            break;
        case 'auth_register_provider':
            auth_register_provider_controller($pdo);
            break;
        case 'auth_login':
            auth_login($pdo);
            break;
        case 'auth_logout':
            auth_logout();
            break;

        // =========================
        // Usuario actual
        // =========================
        case 'me':
            user_me($pdo);
            break;

        // =========================
        // Provider Requests
        // =========================
        case 'provider_request_create':
            provider_request_create_controller($pdo);
            break;
        case 'provider_request_list_pending':
            provider_request_list_pending_controller($pdo);
            break;
        case 'provider_request_approve':
            provider_request_approve_controller($pdo);
            break;
        case 'provider_request_reject':
            provider_request_reject_controller($pdo);
            break;

        // =========================
        // Perfil proveedor
        // =========================
        case 'provider_profile_get':
            provider_profile_get_controller($pdo);
            break;
        case 'provider_profile_update':
            provider_profile_update_controller($pdo);
            break;

        // =========================
        // Canchas (proveedor)
        // =========================
        case 'court_create':
            court_create_controller($pdo);
            break;
        case 'court_update':
            court_update_controller($pdo);
            break;
        case 'court_delete':
            court_delete_controller($pdo);
            break;
        case 'court_list_by_provider':
            court_list_by_provider_controller($pdo);
            break;

        // Canchas (jugador) - búsqueda pública
        case 'court_search_public':
            court_search_public_controller($pdo);
            break;

        // Horarios (time slots)
        case 'court_timeslots_list_by_court':
            court_timeslots_list_by_court_controller($pdo);
            break;
        case 'court_timeslot_create':
            court_timeslot_create_controller($pdo);
            break;
        case 'court_timeslot_delete':
            court_timeslot_delete_controller($pdo);
            break;
        case 'court_timeslots_bulk_create':
            court_timeslots_bulk_create_controller($pdo);
            break;

        // Disponibilidad por fecha (jugador)
        case 'court_availability_list':
            court_availability_list_controller($pdo);
            break;

        // =========================
        // Reservas (jugador)
        // =========================
        case 'reservation_create':
            reservation_create_controller($pdo);
            break;
        case 'reservation_list_my':
            reservation_list_my_controller($pdo);
            break;
        case 'reservation_cancel_my':
            reservation_cancel_my_controller($pdo);
            break;
        case 'reservation_update_time_my':
            reservation_update_time_my_controller($pdo);
            break;

        // Reservas (proveedor)
        case 'reservation_list_by_provider':
            reservation_list_by_provider_controller($pdo);
            break;

        // =========================
        // Equipos
        // =========================
        case 'team_list_my':
            team_list_my_controller($pdo);
            break;
        case 'team_create':
            team_create_controller($pdo);
            break;
        case 'team_update':
            team_update_controller($pdo);
            break;
        case 'team_delete':
            team_delete_controller($pdo);
            break;
        case 'team_invite_member':
            team_invite_member_controller($pdo);
            break;
        case 'team_invite_player':
            team_invite_player_controller($pdo);
            break;
        case 'team_list_public_joinable':
            team_list_public_joinable_controller($pdo);
            break;
        case 'team_join_request_create':
            team_join_request_create_controller($pdo);
            break;
        case 'team_invitations_my_pending':
            team_invitations_my_pending_controller($pdo);
            break;
        case 'team_invitation_respond':
            team_invitation_respond_controller($pdo);
            break;
        case 'team_leave':
            team_leave_controller($pdo);
            break;
        case 'team_members_list':
            team_members_list_controller($pdo);
            break;

        // =========================
        // Torneos (público/jugador)
        // =========================
        case 'tournament_list_public':
            tournament_list_public_controller($pdo);
            break;
        case 'tournament_detail':
            tournament_detail_controller($pdo);
            break;
        case 'tournament_register_team':
            tournament_register_team_controller($pdo);
            break;
        case 'tournament_list_my_teams':
            tournament_list_my_teams_controller($pdo);
            break;

        // Torneos (proveedor)
        case 'tournament_create_provider':
            tournament_create_provider_controller($pdo);
            break;
        case 'tournament_update_provider':
            tournament_update_provider_controller($pdo);
            break;
        case 'tournament_change_status_provider':
            tournament_change_status_provider_controller($pdo);
            break;
        case 'tournament_list_provider':
            tournament_list_provider_controller($pdo);
            break;

        // =========================
        // Reseñas
        // =========================
        case 'review_create':
            review_create_controller($pdo);
            break;
        case 'review_list_by_court':
            review_list_by_court_controller($pdo);
            break;

        // =========================
        // Wallet / puntos
        // =========================
        case 'wallet_get_my':
            wallet_get_my_controller($pdo);
            break;

        // =========================
        // Promociones
        // =========================
        case 'promotion_list_available':
            promotion_list_available_controller($pdo);
            break;
        case 'promotion_redeem':
            promotion_redeem_controller($pdo);
            break;

        // =========================
        // Notificaciones
        // =========================
        case 'notification_list_my':
            notification_list_my_controller($pdo);
            break;
        case 'notification_mark_read':
            notification_mark_read_controller($pdo);
            break;

        // =========================
        // Rankings
        // =========================
        case 'ranking_players':
            ranking_players_controller($pdo);
            break;
        case 'ranking_teams':
            ranking_teams_controller($pdo);
            break;

        // =========================
        // ADMIN - Proveedores
        // =========================
        case 'admin_provider_list':
            admin_provider_list_controller($pdo);
            break;
        case 'admin_provider_change_status':
            admin_provider_change_status_controller($pdo);
            break;

        // ADMIN - Usuarios
        case 'admin_user_list':
            admin_user_list_controller($pdo);
            break;
        case 'admin_user_change_status':
            admin_user_change_status_controller($pdo);
            break;

        // ADMIN - Reservas
        case 'admin_reservation_list':
            admin_reservation_list_controller($pdo);
            break;

        // ADMIN - Torneos
        case 'admin_tournament_list':
            admin_tournament_list_controller($pdo);
            break;

        default:
            json_response(['error' => 'Acción no encontrada'], 404);
    }
} catch (Throwable $e) {
    error_log($e->getMessage());
    json_response(['error' => 'Error interno del servidor'], 500);
}
