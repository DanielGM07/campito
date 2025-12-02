// File: frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPlayerPage from './pages/RegisterPlayerPage'
import PlayerDashboardPage from './pages/PlayerDashboardPage'
import TeamsPage from './pages/TeamsPage'
import TournamentsPage from './pages/TournamentsPage'
import ProviderDashboardPage from './pages/ProviderDashboardPage'
import Navbar from './components/Navbar'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPlayerPage />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <PlayerDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <PrivateRoute>
                <TeamsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/tournaments"
            element={
              <PrivateRoute>
                <TournamentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/provider"
            element={
              <PrivateRoute>
                <ProviderDashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
