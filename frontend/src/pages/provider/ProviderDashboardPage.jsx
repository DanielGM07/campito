// File: src/pages/provider/ProviderDashboardPage.jsx

import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function ProviderDashboardPage() {
  const [profile, setProfile] = useState(null)
  const [courts, setCourts] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [profileRes, courtsRes, tournamentsRes] = await Promise.all([
          api.get('provider_profile_get'),
          api.get('court_list_by_provider'),
          api.get('tournament_list_provider'),
        ])

        setProfile(profileRes.provider || profileRes)
        setCourts(courtsRes.courts || [])
        setTournaments(tournamentsRes.tournaments || [])
      } catch (e) {
        setError(e.message || 'Error al cargar el panel de proveedor')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <p>Cargando panel de proveedor...</p>
  }

  if (error) {
    return <p style={{ color: '#f97373', fontSize: 12 }}>Error: {error}</p>
  }

  const totalCourts = courts.length
  const totalTournaments = tournaments.length
  const activeCourts = courts.filter((c) => c.status === 'active').length

  const lastCourts = courts.slice(0, 3)
  const lastTournaments = tournaments.slice(0, 3)

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">Panel de proveedor</h1>
        <p className="page-subtitle">
          Resumen de tu complejo, canchas y torneos.
        </p>
      </div>

      {profile && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                {profile.venue_name || profile.name || 'Tu complejo'}
              </div>
              <div className="card-subtitle">
                {profile.address || 'Dirección no configurada'}
              </div>
            </div>
            <div className="badge">
              <span>Proveedor</span>
              <span>#{profile.id}</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {profile.description ||
              'Configurá la descripción de tu complejo en tu perfil.'}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Canchas</div>
              <div className="card-subtitle">Total creadas</div>
            </div>
            <div className="chip">
              <span>{totalCourts}</span>
            </div>
          </div>
          <div style={{ fontSize: 12 }}>
            <strong>{activeCourts}</strong> activas ·{' '}
            <strong>{totalCourts - activeCourts}</strong> inactivas
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Torneos</div>
              <div className="card-subtitle">Organizados por tu complejo</div>
            </div>
            <div className="chip">
              <span>{totalTournaments}</span>
            </div>
          </div>
          <div style={{ fontSize: 12 }}>
            Creá y administrá torneos desde el menú de proveedor.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Próximos pasos</div>
              <div className="card-subtitle">Atajos rápidos</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => (window.location.href = '/provider/courts')}
            >
              + Crear cancha
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => window.location.reload()}
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          gap: 12,
        }}
      >
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Últimas canchas</div>
              <div className="card-subtitle">
                Las últimas canchas cargadas en tu complejo.
              </div>
            </div>
          </div>
          {lastCourts.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              Todavía no creaste canchas. Empezá desde <strong>Mis canchas</strong>.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {lastCourts.map((c) => (
                <li
                  key={c.id}
                  style={{
                    fontSize: 12,
                    padding: '6px 0',
                    borderTop: '1px dashed rgba(148,163,184,0.4)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {c.sport} · Máx. {c.max_players} jugadores
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div>
                        $
                        {Number(c.price_per_hour).toLocaleString('es-AR')}
                      </div>
                      <div>{c.status}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Torneos recientes</div>
              <div className="card-subtitle">
                Los últimos torneos que creaste.
              </div>
            </div>
          </div>
          {lastTournaments.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              Todavía no creaste torneos.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {lastTournaments.map((t) => (
                <li
                  key={t.id}
                  style={{
                    fontSize: 12,
                    padding: '6px 0',
                    borderTop: '1px dashed rgba(148,163,184,0.4)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{t.name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {t.sport} · {t.status}
                      </div>
                    </div>
                    {!!t.max_teams && (
                      <div
                        style={{
                          fontSize: 11,
                          textAlign: 'right',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Máx. {t.max_teams} equipos
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
