// File: src/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'sidebar-link' + (isActive ? ' sidebar-link-active' : '')
      }
    >
      <span className="sidebar-link-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const { isPlayer /* isProvider, isAdmin */ } = useAuth()

  return (
    <aside className="sidebar">
      {isPlayer && (
        <div>
          <div className="sidebar-section-title">Jugador</div>
          <div className="sidebar-group">
            <SidebarLink to="/dashboard" icon="🏠" label="Inicio" />
            <SidebarLink to="/player/teams" icon="👥" label="Mis equipos" />
            <SidebarLink
              to="/player/tournaments"
              icon="🏆"
              label="Torneos"
            />
          </div>
        </div>
      )}

      {/* Más adelante: grupos para Provider y Admin */}

      <div className="sidebar-footer">
        <div style={{ fontWeight: 500, marginBottom: 2 }}>Tip</div>
        <div>Usá el panel izquierdo para navegar según tu rol.</div>
      </div>
    </aside>
  )
}
