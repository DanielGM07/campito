// File: src/App.jsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './layout/AppShell'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPlayerPage from './pages/auth/RegisterPlayerPage'
import RegisterProviderPage from "./pages/auth/RegisterProviderPage"

// Player
import PlayerDashboardPage from './pages/player/PlayerDashboardPage'
import TeamsPage from './pages/player/TeamsPage'
import ExploreTeamsPage from './pages/player/ExploreTeamsPage'
import TournamentsPage from './pages/player/TournamentsPage'
import ReservationsPage from './pages/player/ReservationsPage'
import NotificationsPage from './pages/player/NotificationsPage'
import RankingsPage from './pages/player/RankingsPage'
import PromotionsPage from './pages/player/PromotionsPage'
import BookCourtPage from './pages/player/BookCourtPage'

// Provider
import ProviderDashboardPage from './pages/provider/ProviderDashboardPage'
import ProviderCourtsPage from './pages/provider/ProviderCourtsPage'
import ProviderReservationsPage from './pages/provider/ProviderReservationsPage'
import ProviderCourtSchedulePage from './pages/provider/ProviderCourtSchedulePage'
import ProviderTournamentsPage from './pages/provider/ProviderTournamentsPage'
import ProviderTournamentCreatePage from './pages/provider/ProviderTournamentCreatePage'
import ProviderTournamentEditPage from "./pages/provider/ProviderTournamentEditPage"

// Admin
import AdminRoute from './routes/AdminRoute'
import AdminProviderRequestsPage from './pages/admin/AdminProviderRequestsPage'
import AdminProvidersPage from './pages/admin/AdminProvidersPage'
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminReservationsPage from "./pages/admin/AdminReservationsPage";
import AdminTournamentsPage from './pages/admin/AdminTournamentsPage'


function PrivateRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Cargando sesión...</h1>
            <p className="auth-subtitle">
              Verificando tus credenciales, por favor esperá.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Si es admin e intenta entrar a rutas de jugador ⇒ lo mandamos a su home admin
  if (isAdmin) return <Navigate to="/admin/provider-requests" replace />

  return <AppShell>{children}</AppShell>
}

function ProviderRoute({ children }) {
  const { user, loading, isProvider, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Cargando sesión...</h1>
            <p className="auth-subtitle">
              Verificando tus credenciales de proveedor, por favor esperá.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Si es admin y quiere entrar a rutas de proveedor ⇒ también lo mando al home admin
  if (isAdmin) return <Navigate to="/admin/provider-requests" replace />

  if (!isProvider) return <Navigate to="/dashboard" replace />

  return <AppShell>{children}</AppShell>
}

// Fallback inteligente para cualquier ruta desconocida
function FallbackRoute() {
  const { user, isAdmin } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin/provider-requests" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  const { user, isAdmin } = useAuth()

  return (
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={isAdmin ? "/admin/provider-requests" : "/dashboard"}
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? <Navigate to="/dashboard" replace /> : <RegisterPlayerPage />
        }
      />
      <Route
        path="/register/provider"
        element={
          user ? <Navigate to="/dashboard" replace /> : <RegisterProviderPage />
        }
      />

      {/* Home / dashboard del usuario logueado */}
      <Route
        path="/"
        element={
          isAdmin ? (
            <Navigate to="/admin/provider-requests" replace />
          ) : (
            <PrivateRoute>
              <PlayerDashboardPage />
            </PrivateRoute>
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAdmin ? (
            <Navigate to="/admin/provider-requests" replace />
          ) : (
            <PrivateRoute>
              <PlayerDashboardPage />
            </PrivateRoute>
          )
        }
      />

      {/* Rutas privadas jugador */}
      <Route
        path="/player/book"
        element={
          <PrivateRoute>
            <BookCourtPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/player/reservations"
        element={
          <PrivateRoute>
            <ReservationsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/player/teams"
        element={
          <PrivateRoute>
            <TeamsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/player/teams/explore"
        element={
          <PrivateRoute>
            <ExploreTeamsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/player/tournaments"
        element={
          <PrivateRoute>
            <TournamentsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/player/promotions"
        element={
          <PrivateRoute>
            <PromotionsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/player/notifications"
        element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/player/rankings"
        element={
          <PrivateRoute>
            <RankingsPage />
          </PrivateRoute>
        }
      />

      {/* Rutas privadas proveedor */}
      <Route
        path="/provider/dashboard"
        element={
          <ProviderRoute>
            <ProviderDashboardPage />
          </ProviderRoute>
        }
      />
      <Route
        path="/provider/courts"
        element={
          <ProviderRoute>
            <ProviderCourtsPage />
          </ProviderRoute>
        }
      />
      <Route
        path="/provider/reservations"
        element={
          <ProviderRoute>
            <ProviderReservationsPage />
          </ProviderRoute>
        }
      />
      <Route
        path="/provider/courts/schedule"
        element={
          <ProviderRoute>
            <ProviderCourtSchedulePage />
          </ProviderRoute>
        }
      />
      <Route
        path="/provider/tournaments"
        element={
          <ProviderRoute>
            <ProviderTournamentsPage />
          </ProviderRoute>
        }
      />
      <Route
        path="/provider/tournaments/new"
        element={
          <ProviderRoute>
            <ProviderTournamentCreatePage />
          </ProviderRoute>
        }
      />
      <Route
        path="/provider/tournaments/edit/:id"
        element={
          <ProviderRoute>
            <ProviderTournamentEditPage />
          </ProviderRoute>
        }
      />

      {/* Rutas ADMIN */}
      <Route element={<AdminRoute />}>
        <Route
          path="/admin/provider-requests"
          element={<AdminProviderRequestsPage />}
        />
        <Route
          path="/admin/providers"
          element={<AdminProvidersPage />}
        />
        <Route
          path="/admin/users"
          element={<AdminUsersPage />}
        />
        <Route
          path="/admin/reservations"
          element={<AdminReservationsPage />}
        />
        <Route
          path="/admin/tournaments"
          element={<AdminTournamentsPage />}
        />
      </Route>

      {/* Fallback global */}
      <Route path="*" element={<FallbackRoute />} />
    </Routes>
  )
}
