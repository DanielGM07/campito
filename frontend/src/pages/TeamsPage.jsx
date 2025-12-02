// File: src/pages/player/TeamsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [name, setName] = useState('')
  const [sport, setSport] = useState('futbol')
  const [description, setDescription] = useState('')
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [invitations, setInvitations] = useState([])
  const [loadingInv, setLoadingInv] = useState(true)
  const [invActionId, setInvActionId] = useState(null)

  // Estado para invitar jugadores
  const [inviteTeamId, setInviteTeamId] = useState(null)
  const [inviteIdentifier, setInviteIdentifier] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(null)

  // Estado para ver integrantes de un equipo
  const [membersTeamId, setMembersTeamId] = useState(null)
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState(null)

  const fetchTeams = async () => {
    setLoadingTeams(true)
    setError(null)
    try {
      const res = await api.get('team_list_my')
      setTeams(res.teams || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingTeams(false)
    }
  }

  const fetchInvitations = async () => {
    setLoadingInv(true)
    try {
      const res = await api.get('team_invitations_my_pending')
      setInvitations(res.invitations || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingInv(false)
    }
  }

  useEffect(() => {
    fetchTeams()
    fetchInvitations()
  }, [])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.post('team_create', { name, sport, description })
      setName('')
      setSport('futbol')
      setDescription('')
      await fetchTeams()
    } catch (e2) {
      setError(e2.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInvitationResponse = async (invitationId, response) => {
    setInvActionId(invitationId)
    try {
      await api.post('team_invitation_respond', {
        invitation_id: invitationId,
        response,
      })
      await Promise.all([fetchTeams(), fetchInvitations()])
    } catch (e) {
      console.error(e)
    } finally {
      setInvActionId(null)
    }
  }

  const openInviteForm = (teamId) => {
    setInviteTeamId(teamId === inviteTeamId ? null : teamId)
    setInviteIdentifier('')
    setInviteError(null)
    setInviteSuccess(null)
  }

  const submitInvite = async (e) => {
    e.preventDefault()
    if (!inviteTeamId || !inviteIdentifier.trim()) {
      setInviteError('Ingresá email o DNI del jugador.')
      return
    }
    setInviteSending(true)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      await api.post('team_invite_player', {
        team_id: inviteTeamId,
        identifier: inviteIdentifier.trim(), // email o DNI
      })
      setInviteSuccess('Invitación enviada correctamente.')
      setInviteIdentifier('')
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setInviteSending(false)
    }
  }

  const isCaptain = (team) =>
    team.is_captain === true ||
    team.role === 'captain' ||
    team.is_owner === true ||
    Number(team.owner_id) === Number(team.current_user_id)

  const openMembers = async (teamId) => {
    // si ya está abierto, lo cerramos
    if (membersTeamId === teamId) {
      setMembersTeamId(null)
      setMembers([])
      setMembersError(null)
      return
    }

    setMembersTeamId(teamId)
    setMembers([])
    setMembersError(null)
    setMembersLoading(true)
    try {
      const res = await api.post('team_members_list', { team_id: teamId })
      setMembers(res.members || [])
    } catch (err) {
      setMembersError(err.message)
    } finally {
      setMembersLoading(false)
    }
  }

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Mis equipos</h1>
        <p className="page-subtitle">
          Creá equipos, respondé invitaciones y gestioná a quién invitás como
          jugador. También podés ver los integrantes de cada equipo.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 14,
        }}
      >
        {/* Crear equipo */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Crear nuevo equipo</div>
              <div className="card-subtitle">
                El creador se marca como capitán automáticamente.
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: 12,
                marginBottom: 8,
                padding: '6px 8px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.4)',
                background:
                  'linear-gradient(135deg, rgba(127,29,29,0.24), transparent)',
                color: '#fecaca',
              }}
            >
              {error}
            </div>
          )}

          <form className="form-grid" onSubmit={handleCreateTeam}>
            <div className="field">
              <label className="field-label">Nombre del equipo</label>
              <input
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="field-label">Deporte</label>
              <select
                className="field-select"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                <option value="futbol">Fútbol</option>
                <option value="futsal">Futsal</option>
                <option value="basquet">Básquet</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label">Descripción (opcional)</label>
              <textarea
                className="field-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={saving}
            >
              {saving ? 'Creando equipo...' : 'Crear equipo'}
            </button>
          </form>
        </div>

        {/* Invitaciones recibidas */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Invitaciones recibidas</div>
              <div className="card-subtitle">
                Invitaciones de otros equipos para sumarte como jugador.
              </div>
            </div>
            <div className="chip">{invitations.length} pendientes</div>
          </div>

          {loadingInv ? (
            <p className="page-subtitle">Cargando invitaciones...</p>
          ) : invitations.length === 0 ? (
            <p className="page-subtitle">
              No tenés invitaciones pendientes por ahora.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 6,
              }}
            >
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.5)',
                    padding: '8px 10px',
                    fontSize: 12,
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.10), transparent)',
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
                        {inv.team_name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        Deporte: {inv.sport}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        Invitación #{inv.id}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        alignItems: 'flex-end',
                      }}
                    >
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          handleInvitationResponse(inv.id, 'accept')
                        }
                        disabled={invActionId === inv.id}
                      >
                        {invActionId === inv.id
                          ? 'Aceptando...'
                          : 'Aceptar'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          handleInvitationResponse(inv.id, 'reject')
                        }
                        disabled={invActionId === inv.id}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Listado de equipos (abajo, ancho completo) + invitar jugadores + ver integrantes */}
      <section style={{ marginTop: 14 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Equipos donde participo</div>
              <div className="card-subtitle">
                Como capitán o integrante de plantel. Podés ver los
                integrantes y, si corresponde, invitar jugadores.
              </div>
            </div>
          </div>

          {loadingTeams ? (
            <p className="page-subtitle">Cargando equipos...</p>
          ) : teams.length === 0 ? (
            <p className="page-subtitle">
              Aún no formas parte de ningún equipo.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 10,
                marginTop: 6,
              }}
            >
              {teams.map((t) => {
                const isCap = isCaptain(t)
                const isMembersOpen = membersTeamId === t.id

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
                          Deporte: {t.sport} · Máx. {t.max_members} jugadores
                        </div>
                        {t.description && (
                          <p
                            style={{
                              marginTop: 4,
                              fontSize: 11,
                              color: 'var(--text-muted)',
                            }}
                          >
                            {t.description}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {isCap && <div className="chip">Capitán</div>}
                        {isCap && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: 6 }}
                            type="button"
                            onClick={() => openInviteForm(t.id)}
                          >
                            {inviteTeamId === t.id
                              ? 'Cerrar invitación'
                              : 'Invitar jugador'}
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: 6 }}
                          type="button"
                          onClick={() => openMembers(t.id)}
                        >
                          {isMembersOpen
                            ? 'Ocultar integrantes'
                            : 'Ver integrantes'}
                        </button>
                      </div>
                    </div>

                    {/* Form de invitación (solo si sos capitán y está abierto) */}
                    {isCap && inviteTeamId === t.id && (
                      <form
                        onSubmit={submitInvite}
                        style={{
                          marginTop: 4,
                          paddingTop: 6,
                          borderTop:
                            '1px dashed rgba(148,163,184,0.5)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginBottom: 4,
                          }}
                        >
                          Enviá una invitación por email o DNI.
                        </div>
                        <div className="field">
                          <input
                            className="field-input"
                            placeholder="Email o DNI del jugador"
                            value={inviteIdentifier}
                            onChange={(e) =>
                              setInviteIdentifier(e.target.value)
                            }
                          />
                        </div>
                        {inviteError && (
                          <div
                            style={{
                              fontSize: 11,
                              color: '#f97373',
                              marginTop: 4,
                            }}
                          >
                            {inviteError}
                          </div>
                        )}
                        {inviteSuccess && (
                          <div
                            style={{
                              fontSize: 11,
                              color: '#4ade80',
                              marginTop: 4,
                            }}
                          >
                            {inviteSuccess}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: 6,
                          }}
                        >
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={inviteSending}
                          >
                            {inviteSending
                              ? 'Enviando...'
                              : 'Enviar invitación'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Lista de integrantes */}
                    {isMembersOpen && (
                      <div
                        style={{
                          marginTop: 6,
                          paddingTop: 6,
                          borderTop:
                            '1px dashed rgba(148,163,184,0.5)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginBottom: 4,
                          }}
                        >
                          Integrantes del equipo
                        </div>

                        {membersLoading ? (
                          <p
                            className="page-subtitle"
                            style={{ fontSize: 11 }}
                          >
                            Cargando integrantes...
                          </p>
                        ) : membersError ? (
                          <p
                            style={{
                              fontSize: 11,
                              color: '#f97373',
                            }}
                          >
                            {membersError}
                          </p>
                        ) : members.length === 0 ? (
                          <p
                            className="page-subtitle"
                            style={{ fontSize: 11 }}
                          >
                            Todavía no hay integrantes registrados en este
                            equipo.
                          </p>
                        ) : (
                          <ul
                            style={{
                              listStyle: 'none',
                              padding: 0,
                              margin: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            {members.map((m) => (
                              <li
                                key={m.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: 6,
                                  padding: '4px 6px',
                                  borderRadius: 8,
                                  border:
                                    '1px solid rgba(148,163,184,0.35)',
                                  background:
                                    'linear-gradient(135deg, rgba(15,23,42,0.06), transparent)',
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 12,
                                    }}
                                  >
                                    {m.first_name} {m.last_name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: 'var(--text-muted)',
                                      marginTop: 2,
                                    }}
                                  >
                                    DNI {m.dni} · {m.email}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: 10,
                                  }}
                                >
                                  {m.role === 'captain' || m.is_owner ? (
                                    <span className="chip">
                                      Capitán
                                    </span>
                                  ) : (
                                    <span className="chip">
                                      Integrante
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
