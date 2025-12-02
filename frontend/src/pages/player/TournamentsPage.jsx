// File: src/pages/player/TournamentsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [teams, setTeams] = useState([])

  // estado por torneo para inscripción
  const [selectedTeamByTournament, setSelectedTeamByTournament] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [messageByTournament, setMessageByTournament] = useState({})

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tourRes, teamRes] = await Promise.all([
        api.get('tournament_list_public'),
        api.get('team_list_my'),
      ])

      setTournaments(tourRes.tournaments || [])
      setTeams(teamRes.teams || [])
    } catch (err) {
      setError(err.message || 'Error al cargar torneos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectTeam = (tournamentId, teamId) => {
    setSelectedTeamByTournament((prev) => ({
      ...prev,
      [tournamentId]: teamId,
    }))
    setMessageByTournament((prev) => ({
      ...prev,
      [tournamentId]: null,
    }))
  }

  const handleRegister = async (tournament) => {
    const tid = tournament.id
    const teamId = selectedTeamByTournament[tid]

    if (!teamId) {
      setMessageByTournament((prev) => ({
        ...prev,
        [tid]: { type: 'error', text: 'Seleccioná un equipo para inscribir.' },
      }))
      return
    }

    setSubmittingId(tid)
    setMessageByTournament((prev) => ({
      ...prev,
      [tid]: null,
    }))

    try {
      await api.post('tournament_register_team', {
        tournament_id: tid,
        team_id: Number(teamId),
      })

      setMessageByTournament((prev) => ({
        ...prev,
        [tid]: { type: 'success', text: 'Equipo inscripto correctamente.' },
      }))
    } catch (err) {
      setMessageByTournament((prev) => ({
        ...prev,
        [tid]: {
          type: 'error',
          text: err.message || 'No se pudo inscribir el equipo.',
        },
      }))
    } finally {
      setSubmittingId(null)
    }
  }

  const teamsForTournamentSport = (sport) =>
    teams.filter((t) => t.sport === sport)

  if (loading) {
    return <p className="page-subtitle">Cargando torneos...</p>
  }

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Torneos disponibles</h1>
        <p className="page-subtitle">
          Inscribí a tu equipo en torneos con inscripción abierta. Solo el
          capitán puede realizar la inscripción.
        </p>
      </section>

      {error && (
        <p
          style={{
            fontSize: 12,
            color: '#f97373',
            marginBottom: 10,
          }}
        >
          {error}
        </p>
      )}

      {tournaments.length === 0 ? (
        <div className="card">
          <p className="page-subtitle">
            No hay torneos disponibles por el momento.
          </p>
        </div>
      ) : (
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {tournaments.map((tour) => {
            const tid = tour.id
            const teamsForSport = teamsForTournamentSport(tour.sport)
            const msg = messageByTournament[tid]

            return (
              <div
                key={tid}
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(148,163,184,0.5)',
                  padding: '9px 10px',
                  background:
                    'linear-gradient(135deg, rgba(15,23,42,0.06), transparent)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
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
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {tour.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      Deporte: {tour.sport} · Sede:{' '}
                      {tour.venue_name || tour.venue_info || 'N/A'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      Desde {tour.start_date} hasta {tour.end_date}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      Equipos máx.: {tour.max_teams} · Jugadores por equipo:{' '}
                      {tour.min_players_per_team}–{tour.max_players_per_team}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      Inscripción:{' '}
                      <strong>
                        $
                        {Number(
                          tour.registration_fee || 0,
                        ).toLocaleString('es-AR')}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 6,
                    }}
                  >
                    <span className="chip" style={{ fontSize: 11 }}>
                      {tour.status === 'registration_open'
                        ? 'Inscripción abierta'
                        : tour.status}
                    </span>
                  </div>
                </div>

                {tour.description && (
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {tour.description}
                  </p>
                )}

                {/* BLOQUE DE INSCRIPCIÓN */}
                {tour.status === 'registration_open' ? (
                  <div
                    style={{
                      borderTop: '1px dashed rgba(148,163,184,0.6)',
                      paddingTop: 6,
                      marginTop: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {teamsForSport.length === 0 ? (
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        No tenés equipos para este deporte. Creá uno en la
                        sección <b>“Mis equipos”</b>.
                      </p>
                    ) : (
                      <>
                        <div className="field">
                          <label className="field-label">
                            Seleccioná el equipo a inscribir
                          </label>
                          <select
                            className="field-select"
                            value={selectedTeamByTournament[tid] || ''}
                            onChange={(e) =>
                              handleSelectTeam(tid, e.target.value)
                            }
                          >
                            <option value="">Elegí un equipo</option>
                            {teamsForSport.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                          <p
                            style={{
                              fontSize: 10,
                              color: 'var(--text-muted)',
                              marginTop: 2,
                            }}
                          >
                            Solo el capitán del equipo puede completar la
                            inscripción.
                          </p>
                        </div>

                        {msg && (
                          <p
                            style={{
                              fontSize: 11,
                              marginTop: 2,
                              color:
                                msg.type === 'error'
                                  ? '#f97373'
                                  : '#4ade80',
                            }}
                          >
                            {msg.text}
                          </p>
                        )}

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleRegister(tour)}
                          disabled={submittingId === tid}
                        >
                          {submittingId === tid
                            ? 'Inscribiendo...'
                            : 'Inscribir equipo'}
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
