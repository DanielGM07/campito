// File: src/routes/AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppShell from '../layout/AppShell'

export default function AdminRoute() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Cargando sesión...</h1>
            <p className="auth-subtitle">
              Verificando tus credenciales de administrador.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    // Está logueado pero no es admin → lo mando al inicio
    return <Navigate to="/" replace />
  }

  // Si es admin, renderizamos todo dentro del layout general
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
