// File: src/pages/player/TournamentsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [teams, setTeams] = useState([])
  const [myTeamsTournaments, setMyTeamsTournaments] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [registerLoadingId, setRegisterLoadingId] = useState(null)
  const [registerError, setRegisterError] = useState(null)
  const [registerSuccess, setRegisterSuccess] = useState(null)
  const [selectedTeamByTournament, setSelectedTeamByTournament] = useState({})

  useEffect(() => {
    let isMounted = true
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [toursRes, teamsRes, myToursRes] = await Promise.all([
          api.get('tournament_list_public'),
          api.get('team_list_my'),
          api.get('tournament_list_my_teams'),
        ])
        if (!isMounted) return
        setTournaments(toursRes.tournaments || [])
        setTeams(teamsRes.teams || [])
        setMyTeamsTournaments(myToursRes.teams_tournaments || [])
      } catch (e) {
        if (!isMounted) return
        setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  const handleTeamChange = (tournamentId, teamId) => {
    setSelectedTeamByTournament((prev) => ({
      ...prev,
      [tournamentId]: teamId,
    }))
  }

  const handleRegisterTeam = async (tournamentId) => {
    const teamId = selectedTeamByTournament[tournamentId]
    if (!teamId) {
      setRegisterError('Seleccioná un equipo para inscribirte.')
      return
    }
    setRegisterLoadingId(tournamentId)
    setRegisterError(null)
    setRegisterSuccess(null)
    try {
      await api.post('tournament_register_team', {
        tournament_id: tournamentId,
        team_id: Number(teamId),
      })
      setRegisterSuccess('Equipo inscripto correctamente.')
      const myToursRes = await api.get('tournament_list_my_teams')
      setMyTeamsTournaments(myToursRes.teams_tournaments || [])
    } catch (e) {
      setRegisterError(e.message)
    } finally {
      setRegisterLoadingId(null)
    }
  }

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Torneos</h1>
        <p className="page-subtitle">
          Explorá torneos disponibles e inscribí a tus equipos.
        </p>
      </section>

      {(error || registerError || registerSuccess) && (
        <div style={{ marginBottom: 10 }}>
          {error && (
            <p style={{ fontSize: 13, color: '#f97373' }}>
              Error al cargar torneos: {error}
            </p>
          )}
          {registerError && (
            <p style={{ fontSize: 12, color: '#f97373' }}>
              {registerError}
            </p>
          )}
          {registerSuccess && (
            <p style={{ fontSize: 12, color: '#4ade80' }}>
              {registerSuccess}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <p className="page-subtitle">Cargando torneos...</p>
      ) : (
        <>
          {/* Torneos públicos */}
          <section
            style={{
              marginBottom: 16,
            }}
          >
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    Torneos disponibles públicamente
                  </div>
                  <div className="card-subtitle">
                    Podés inscribir uno de tus equipos a cada torneo.
                  </div>
                </div>
              </div>

              {tournaments.length === 0 ? (
                <p className="page-subtitle">
                  No hay torneos publicados por ahora.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 12,
                    marginTop: 6,
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
                        <div className="chip">
                          Máx. {t.max_teams} equipos
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginBottom: 6,
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
                          borderTop: '1px solid rgba(148,163,184,0.35)',
                          paddingTop: 8,
                          marginTop: 6,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 12,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: 'var(--text-muted)',
                              }}
                            >
                              Inscripción
                            </div>
                            <div style={{ fontWeight: 600 }}>
                              $
                              {Number(
                                t.registration_fee,
                              ).toLocaleString('es-AR')}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                marginBottom: 4,
                              }}
                            >
                              Equipo a inscribir
                            </div>
                            <select
                              className="field-select"
                              style={{
                                fontSize: 11,
                                padding: '6px 8px',
                                minWidth: 140,
                              }}
                              value={selectedTeamByTournament[t.id] || ''}
                              onChange={(e) =>
                                handleTeamChange(t.id, e.target.value)
                              }
                            >
                              <option value="">Elegir equipo</option>
                              {teams.map((team) => (
                                <option
                                  key={team.id}
                                  value={team.id}
                                >
                                  {team.name}
                                </option>
                              ))}
                            </select>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ marginTop: 6, width: '100%' }}
                              onClick={() => handleRegisterTeam(t.id)}
                              disabled={
                                registerLoadingId === t.id ||
                                teams.length === 0
                              }
                            >
                              {registerLoadingId === t.id
                                ? 'Inscribiendo...'
                                : 'Inscribir equipo'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Mis torneos con mis equipos */}
          <section>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Torneos de mis equipos</div>
                  <div className="card-subtitle">
                    Inscripciones actuales e historial por equipo.
                  </div>
                </div>
              </div>

              {myTeamsTournaments.length === 0 ? (
                <p className="page-subtitle">
                  Todavía ningún equipo tuyo está inscripto a torneos.
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginTop: 6,
                    maxHeight: 320,
                    overflow: 'auto',
                  }}
                >
                  {myTeamsTournaments.map((item) => (
                    <div
                      key={item.team.id}
                      style={{
                        borderRadius: 14,
                        border: '1px solid rgba(148,163,184,0.5)',
                        padding: '9px 10px',
                        fontSize: 12,
                        background:
                          'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {item.team.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              marginTop: 2,
                            }}
                          >
                            Deporte: {item.team.sport}
                          </div>
                        </div>
                        <div className="chip">
                          {item.registrations.length} inscripciones
                        </div>
                      </div>

                      {item.registrations.length > 0 && (
                        <div
                          style={{
                            marginTop: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            fontSize: 11,
                          }}
                        >
                          {item.registrations.map((r) => (
                            <div
                              key={r.id}
                              style={{
                                borderRadius: 10,
                                border:
                                  '1px solid rgba(148,163,184,0.45)',
                                padding: '6px 8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 8,
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 500 }}>
                                  {r.tournament_name}
                                </div>
                                <div
                                  style={{
                                    color: 'var(--text-muted)',
                                    marginTop: 2,
                                  }}
                                >
                                  {r.sport} · {r.start_date} →{' '}
                                  {r.end_date}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  Monto
                                </div>
                                <div style={{ fontWeight: 600 }}>
                                  $
                                  {Number(
                                    r.total_fee,
                                  ).toLocaleString('es-AR')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
