// File: frontend/src/pages/provider/ProviderTournamentEditPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'
import { useNavigate, useParams } from 'react-router-dom'

export default function ProviderTournamentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(null)

  const fetchTournament = async () => {
    try {
      const res = await api.get('tournament_list_provider')
      const found = (res.tournaments || []).find(t => String(t.id) === String(id))

      if (!found) {
        setError('Torneo no encontrado.')
        return
      }

      // ❗ Solo copiamos campos editables
      setForm({
        id: found.id,
        name: found.name,
        description: found.description ?? '',
        rules: found.rules ?? '',
        prizes: found.prizes ?? '',
        max_teams: Number(found.max_teams) || 4, // ✅ normalizamos + fallback
        min_players_per_team: found.min_players_per_team,
        max_players_per_team: found.max_players_per_team,
        registration_fee: found.registration_fee,
        status: found.status,
        sport: found.sport,
        start_date: found.start_date,
        end_date: found.end_date,
      })
    } catch (e) {
      setError(e.message || 'Error al cargar torneo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTournament()
  }, [])

  const handle = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const submit = async e => {
    e.preventDefault()
    setError(null)

    if (!['scheduled', 'registration_open'].includes(form.status)) {
      setError('Este torneo ya no se puede modificar.')
      return
    }

    if (Number(form.min_players_per_team) > Number(form.max_players_per_team)) {
      setError('Los jugadores mínimos no pueden ser mayores a los máximos.')
      return
    }

    try {
      setSaving(true)
      await api.post('tournament_update_provider', {
        id: form.id,
        name: form.name,
        description: form.description,
        rules: form.rules,
        prizes: form.prizes,
        max_teams: Number(form.max_teams),
        min_players_per_team: Number(form.min_players_per_team),
        max_players_per_team: Number(form.max_players_per_team),
        registration_fee: Number(form.registration_fee),
      })
      navigate('/provider/tournaments')
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Cargando torneo...</p>
  if (!form) return <p>No encontrado.</p>

  const locked = !['scheduled', 'registration_open'].includes(form.status)

  return (
    <div>
      <h1 className="page-title">Editar torneo</h1>

      <div className="card">
        {error && <p style={{ color: '#f87171' }}>{error}</p>}

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          Deporte: <b>{form.sport}</b> · Fechas:{' '}
          <b>
            {form.start_date} → {form.end_date}
          </b>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label className="field-label">Nombre</label>
            <input className="field-input" name="name" value={form.name} onChange={handle} disabled={locked} />
          </div>

          <div className="field">
            <label className="field-label">Máx. equipos</label>
            <select
              className="field-select"
              name="max_teams"
              value={form.max_teams}
              onChange={handle}
              disabled={locked}
              required>
              <option value={4}>4 equipos</option>
              <option value={8}>8 equipos</option>
              <option value={16}>16 equipos</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label">Jugadores mínimos por equipo</label>
            <input
              type="number"
              min="1"
              className="field-input"
              name="min_players_per_team"
              value={form.min_players_per_team}
              onChange={handle}
              disabled={locked}
            />
          </div>

          <div className="field">
            <label className="field-label">Jugadores máximos por equipo</label>
            <input
              type="number"
              min={form.min_players_per_team}
              className="field-input"
              name="max_players_per_team"
              value={form.max_players_per_team}
              onChange={handle}
              disabled={locked}
            />
          </div>

          <div className="field">
            <label className="field-label">Costo inscripción</label>
            <input
              type="number"
              min="0"
              className="field-input"
              name="registration_fee"
              value={form.registration_fee}
              onChange={handle}
              disabled={locked}
            />
          </div>

          <div className="field">
            <label className="field-label">Descripción</label>
            <textarea
              className="field-textarea"
              name="description"
              value={form.description}
              onChange={handle}
              disabled={locked}
            />
          </div>

          <div className="field">
            <label className="field-label">Reglas</label>
            <textarea className="field-textarea" name="rules" value={form.rules} onChange={handle} disabled={locked} />
          </div>

          <div className="field">
            <label className="field-label">Premios</label>
            <textarea
              className="field-textarea"
              name="prizes"
              value={form.prizes}
              onChange={handle}
              disabled={locked}
            />
          </div>

          <button className="btn btn-primary" disabled={saving || locked}>
            {locked ? 'Torneo bloqueado' : saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
