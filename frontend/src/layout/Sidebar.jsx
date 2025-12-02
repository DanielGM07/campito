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
            <SidebarLink
              to="/player/reservations"
              icon="📅"
              label="Mis reservas"
            />
            <SidebarLink to="/player/teams" icon="👥" label="Mis equipos" />
            <SidebarLink
              to="/player/tournaments"
              icon="🏆"
              label="Torneos"
            />
            <SidebarLink
              to="/player/promotions"
              icon="🎟️"
              label="Promociones"
            />
            <SidebarLink
              to="/player/notifications"
              icon="🔔"
              label="Notificaciones"
            />
            <SidebarLink
              to="/player/rankings"
              icon="📈"
              label="Rankings"
            />
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <div style={{ fontWeight: 500, marginBottom: 2 }}>Tip</div>
        <div>Usá el panel izquierdo para navegar según tu rol.</div>
      </div>
    </aside>
  )
}
