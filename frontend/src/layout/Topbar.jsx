// File: src/layout/Topbar.jsx
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Topbar() {
  const { user, logout } = useAuth()
  const { /* theme, */ toggleTheme } = useTheme()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo-pill">C</div>
        <div className="logo-text">CAMPITO</div>
      </div>
      <div className="topbar-actions">
        <div className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
          <div className="theme-toggle-thumb" />
        </div>

        {user && (
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Cerrar sesión
          </button>
        )}
      </div>
    </header>
  )
}
