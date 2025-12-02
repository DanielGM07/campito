// File: src/App.jsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './layout/AppShell'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPlayerPage from './pages/auth/RegisterPlayerPage'

// Player
import PlayerDashboardPage from './pages/player/PlayerDashboardPage'
import TeamsPage from './pages/player/TeamsPage'
import TournamentsPage from './pages/player/TournamentsPage'
import ReservationsPage from './pages/player/ReservationsPage'
import NotificationsPage from './pages/player/NotificationsPage'
import RankingsPage from './pages/player/RankingsPage'
import PromotionsPage from './pages/player/PromotionsPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

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

  return <AppShell>{children}</AppShell>
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          user ? <Navigate to="/dashboard" replace /> : <RegisterPlayerPage />
        }
      />

      {/* Rutas privadas jugador */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <PlayerDashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <PlayerDashboardPage />
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
