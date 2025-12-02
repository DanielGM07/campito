// File: src/pages/player/RankingsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function RankingsPage() {
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetchRankings() {
      setLoading(true)
      setError(null)
      try {
        const [p, t] = await Promise.all([
          api.get('ranking_players'),
          api.get('ranking_teams'),
        ])
        if (!isMounted) return
        setPlayers(p.players || [])
        setTeams(t.teams || [])
      } catch (e) {
        if (!isMounted) return
        setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchRankings()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Rankings</h1>
        <p className="page-subtitle">
          Top jugadores y equipos según los puntos acumulados en Campito.
        </p>
      </section>

      {error && (
        <p style={{ fontSize: 13, color: '#f97373', marginBottom: 8 }}>
          Error al cargar rankings: {error}
        </p>
      )}

      {loading ? (
        <p className="page-subtitle">Cargando rankings...</p>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
            gap: 14,
          }}
        >
          {/* Ranking jugadores */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Ranking de jugadores</div>
                <div className="card-subtitle">
                  Ordenado por puntos, luego por estrellas.
                </div>
              </div>
            </div>

            {players.length === 0 ? (
              <p className="page-subtitle">
                Todavía no hay jugadores en el ranking.
              </p>
            ) : (
              <div
                style={{
                  maxHeight: 280,
                  overflow: 'auto',
                  marginTop: 6,
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        textAlign: 'left',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <th style={{ padding: '6px 6px' }}>#</th>
                      <th style={{ padding: '6px 6px' }}>Jugador</th>
                      <th style={{ padding: '6px 6px' }}>Puntos</th>
                      <th style={{ padding: '6px 6px' }}>Estrellas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p, idx) => (
                      <tr
                        key={p.id}
                        style={{
                          borderTop: '1px solid rgba(148,163,184,0.35)',
                          background:
                            idx < 3
                              ? 'linear-gradient(135deg, rgba(0,229,255,0.12), transparent)'
                              : 'transparent',
                        }}
                      >
                        <td style={{ padding: '6px 6px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: '999px',
                              border:
                                '1px solid rgba(148,163,184,0.55)',
                              fontSize: 11,
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td style={{ padding: '6px 6px' }}>
                          <div style={{ fontWeight: 500 }}>
                            {p.first_name} {p.last_name}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--text-muted)',
                            }}
                          >
                            {p.email}
                          </div>
                        </td>
                        <td style={{ padding: '6px 6px' }}>
                          {p.points_balance}
                        </td>
                        <td style={{ padding: '6px 6px' }}>
                          {p.stars_balance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ranking equipos */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Ranking de equipos</div>
                <div className="card-subtitle">
                  Suma de puntos de los jugadores de cada equipo.
                </div>
              </div>
            </div>

            {teams.length === 0 ? (
              <p className="page-subtitle">
                Todavía no hay equipos en el ranking.
              </p>
            ) : (
              <div
                style={{
                  maxHeight: 280,
                  overflow: 'auto',
                  marginTop: 6,
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        textAlign: 'left',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <th style={{ padding: '6px 6px' }}>#</th>
                      <th style={{ padding: '6px 6px' }}>Equipo</th>
                      <th style={{ padding: '6px 6px' }}>Deporte</th>
                      <th style={{ padding: '6px 6px' }}>Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t, idx) => (
                      <tr
                        key={t.id}
                        style={{
                          borderTop: '1px solid rgba(148,163,184,0.35)',
                          background:
                            idx < 3
                              ? 'linear-gradient(135deg, rgba(26,115,255,0.16), transparent)'
                              : 'transparent',
                        }}
                      >
                        <td style={{ padding: '6px 6px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: '999px',
                              border:
                                '1px solid rgba(148,163,184,0.55)',
                              fontSize: 11,
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td style={{ padding: '6px 6px' }}>
                          <div style={{ fontWeight: 500 }}>{t.name}</div>
                        </td>
                        <td style={{ padding: '6px 6px' }}>{t.sport}</td>
                        <td style={{ padding: '6px 6px' }}>
                          {t.team_points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
