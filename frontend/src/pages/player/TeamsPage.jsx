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

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Mis equipos</h1>
        <p className="page-subtitle">
          Creá equipos y respondé invitaciones para sumarte a otros.
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

      {/* Listado de equipos (abajo, ancho completo) */}
      <section style={{ marginTop: 14 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Equipos donde participo</div>
              <div className="card-subtitle">
                Como capitán o integrante de plantel.
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
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 10,
                marginTop: 6,
              }}
            >
              {teams.map((t) => (
                <div
                  key={t.id}
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(148,163,184,0.5)',
                    padding: '9px 10px',
                    fontSize: 12,
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                  }}
                >
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
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
