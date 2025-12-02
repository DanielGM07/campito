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
  const { isPlayer, isProvider, isAdmin } = useAuth()

  return (
    <aside className="sidebar">
      {/* Prioridad: si es provider, mostramos SOLO provider.
          Si no es provider pero sí player, mostramos player. */}
      {isProvider ? (
        <div>
          <div className="sidebar-section-title">Proveedor</div>
          <div className="sidebar-group">
            <SidebarLink
              to="/provider/dashboard"
              icon="🏢"
              label="Inicio proveedor"
            />
            <SidebarLink
              to="/provider/courts"
              icon="⚽"
              label="Mis canchas"
            />
            {/* 🔹 NUEVO */}
            <SidebarLink
                to="/provider/reservations"
                icon="📅"
                label="Reservas"
            />
            <SidebarLink
                to="/provider/courts/schedule"
                icon="🕒"
                label="Horarios"
            />
            <SidebarLink
                to="/provider/tournaments"
                icon="🏆"
                label="Torneos"
            />
            {/* Más adelante: reservas, torneos, reseñas, stats, etc. */}
          </div>
        </div>
      ) : isPlayer ? (
        <div>
          <div className="sidebar-section-title">Jugador</div>
          <div className="sidebar-group">
            <SidebarLink to="/dashboard" icon="🏠" label="Inicio" />
            <SidebarLink
              to="/player/book"
              icon="⚽"
              label="Reservar cancha"
            />
            <SidebarLink
              to="/player/reservations"
              icon="📅"
              label="Mis reservas"
            />
            <SidebarLink to="/player/teams" icon="👥" label="Mis equipos" />
            <SidebarLink
              to="/player/teams/explore"
              icon="🧭"
              label="Explorar equipos"
            />
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
      ) : null}

      {isAdmin && (
        <div style={{ marginTop: 24 }}>
          <div className="sidebar-section-title">Admin</div>
          <div className="sidebar-group">
            <SidebarLink
              to="/admin/provider-requests"
              icon="📋"
              label="Solicitudes de proveedores"
            />
            <SidebarLink
                to="/admin/providers"
                icon="🏟️"
                label="Proveedores"
            />
            <SidebarLink 
                to="/admin/users" 
                icon="👤" 
                label="Jugadores" 
            />
            <SidebarLink to="/admin/reservations" icon="📅" label="Reservas" />
            <SidebarLink to="/admin/tournaments" icon="🏆" label="Torneos" />

            {/* Más adelante: dashboard, usuarios, etc. */}
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
