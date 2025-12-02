// File: src/pages/player/TeamsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [name, setName] = useState('')
  const [sport, setSport] = useState('futbol')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchTeams = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('team_list_my')
      setTeams(res.teams || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
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

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Mis equipos</h1>
        <p className="page-subtitle">
          Creá equipos y administrá tus planteles para torneos y reservas.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 14,
        }}
      >
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

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Listado de equipos</div>
              <div className="card-subtitle">
                Equipos donde sos capitán o integrante.
              </div>
            </div>
          </div>

          {loading ? (
            <p className="page-subtitle">Cargando equipos...</p>
          ) : teams.length === 0 ? (
            <p className="page-subtitle">
              Aún no formas parte de ningún equipo.
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
              {teams.map((t) => (
                <div
                  key={t.id}
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
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 1,
                        }}
                      >
                        Deporte: {t.sport} · Máx. {t.max_members} jugadores
                      </div>
                    </div>
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
