// File: src/pages/player/TournamentsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetchTournaments() {
      try {
        const res = await api.get('tournament_list_public')
        if (!isMounted) return
        setTournaments(res.tournaments || [])
      } catch (e) {
        if (!isMounted) return
        setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchTournaments()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) return <p>Cargando torneos...</p>
  if (error)
    return <p style={{ fontSize: 13, color: '#f97373' }}>Error: {error}</p>

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Torneos disponibles</h1>
        <p className="page-subtitle">
          Revisá los torneos con inscripción abierta o próximos a comenzar.
        </p>
      </section>

      {tournaments.length === 0 ? (
        <p className="page-subtitle">No hay torneos publicados por ahora.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          {tournaments.map((t) => (
            <article key={t.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{t.name}</div>
                  <div className="card-subtitle">
                    {t.sport} · {t.start_date} → {t.end_date}
                  </div>
                </div>
                <div className="chip">Máx. {t.max_teams} equipos</div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Sede: {t.venue_name}
              </div>
              {t.description && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text)',
                    marginBottom: 8,
                  }}
                >
                  {t.description}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Inscripción</div>
                  <div style={{ fontWeight: 600 }}>
                    ${Number(t.registration_fee).toLocaleString('es-AR')}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" disabled>
                  Próximamente: inscribirme
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
