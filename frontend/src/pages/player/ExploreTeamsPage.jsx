// File: src/pages/player/ExploreTeamsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function ExploreTeamsPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estado para el panel de "unirse"
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState(null)
  const [joinSuccess, setJoinSuccess] = useState(null)

  const loadTeams = async () => {
    setLoading(true)
    setError(null)
    try {
      // Endpoint: equipos a los que todavía me puedo unir (no lleno, no soy miembro)
      const res = await api.get('team_list_public_joinable')
      setTeams(res.teams || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const openJoinPanel = (teamId) => {
    setSelectedTeamId(teamId === selectedTeamId ? null : teamId)
    setJoinError(null)
    setJoinSuccess(null)
  }

  const handleJoinTeam = async (e) => {
    e.preventDefault()
    if (!selectedTeamId) return

    setJoinLoading(true)
    setJoinError(null)
    setJoinSuccess(null)

    try {
      // IMPORTANTE: este endpoint te une directo al equipo
      await api.post('team_join_request_create', {
        team_id: selectedTeamId,
      })

      setJoinSuccess('Te uniste al equipo correctamente.')
      // recargamos la lista para que el equipo desaparezca de "joinables"
      await loadTeams()
      setSelectedTeamId(null)
    } catch (err) {
      setJoinError(err.message)
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Unirse a equipos</h1>
        <p className="page-subtitle">
          Acá ves equipos con lugares disponibles a los que todavía no pertenecés.
          Al confirmar, te unís automáticamente al equipo.
        </p>
      </section>

      {error && (
        <p style={{ fontSize: 13, color: '#f97373', marginBottom: 8 }}>
          Error al cargar equipos: {error}
        </p>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Equipos disponibles</div>
            <div className="card-subtitle">
              Solo se muestran equipos donde no sos integrante y que aún tienen lugar.
            </div>
          </div>
        </div>

        {loading ? (
          <p className="page-subtitle">Cargando equipos...</p>
        ) : teams.length === 0 ? (
          <p className="page-subtitle">
            No hay equipos disponibles para unirte en este momento o ya estás en todos los que aplican.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 10,
              marginTop: 6,
            }}
          >
            {teams.map((t) => {
              const isOpen = selectedTeamId === t.id
              return (
                <div
                  key={t.id}
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(148,163,184,0.5)',
                    padding: '9px 10px',
                    fontSize: 12,
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        Deporte: {t.sport}
                      </div>
                      {t.location && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginTop: 2,
                          }}
                        >
                          Zona: {t.location}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        Jugadores: {t.current_members || 0} / {t.max_members}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => openJoinPanel(t.id)}
                      >
                        {isOpen ? 'Cancelar' : 'Unirse al equipo'}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <form
                      onSubmit={handleJoinTeam}
                      style={{
                        marginTop: 4,
                        paddingTop: 6,
                        borderTop: '1px dashed rgba(148,163,184,0.5)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginBottom: 4,
                        }}
                      >
                        Si confirmás, vas a unirte automáticamente a{' '}
                        <strong>{t.name}</strong>. El capitán y el resto
                        del equipo podrán verte en la lista de jugadores.
                      </div>

                      {joinError && (
                        <div
                          style={{
                            fontSize: 11,
                            color: '#f97373',
                            marginTop: 4,
                          }}
                        >
                          {joinError}
                        </div>
                      )}
                      {joinSuccess && (
                        <div
                          style={{
                            fontSize: 11,
                            color: '#4ade80',
                            marginTop: 4,
                          }}
                        >
                          {joinSuccess}
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 8,
                          marginTop: 6,
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelectedTeamId(null)}
                          disabled={joinLoading}
                        >
                          Volver
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={joinLoading}
                        >
                          {joinLoading
                            ? 'Uniéndote...'
                            : 'Confirmar unión'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
