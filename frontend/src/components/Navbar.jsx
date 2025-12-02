// File: frontend/src/components/Navbar.jsx

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const linkClass = (path) =>
    `px-3 py-1 rounded-md text-sm ${
      location.pathname === path
        ? 'bg-sky-500 text-white'
        : 'text-slate-200 hover:bg-slate-800'
    }`

  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-500 text-xs font-bold">
            C
          </span>
          <span className="font-semibold text-sm">Campito</span>
        </div>

        {user ? (
          <nav className="flex items-center gap-2">
            <Link to="/dashboard" className={linkClass('/dashboard')}>
              Inicio
            </Link>
            <Link to="/teams" className={linkClass('/teams')}>
              Equipos
            </Link>
            <Link to="/tournaments" className={linkClass('/tournaments')}>
              Torneos
            </Link>
            {user.is_provider === 1 && (
              <Link to="/provider" className={linkClass('/provider')}>
                Proveedor
              </Link>
            )}
            <button
              onClick={logout}
              className="ml-2 px-3 py-1 rounded-md text-sm bg-red-500 text-white hover:bg-red-600"
            >
              Salir
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/login" className={linkClass('/login')}>
              Ingresar
            </Link>
            <Link to="/register" className={linkClass('/register')}>
              Registrarse
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
