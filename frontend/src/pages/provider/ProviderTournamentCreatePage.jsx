// File: src/pages/provider/ProviderTournamentCreatePage.jsx
import { useState } from "react"
import { api } from "../../api/http"
import { useNavigate } from "react-router-dom"

const TODAY = new Date().toISOString().split("T")[0]

export default function ProviderTournamentCreatePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: "",
    sport: "futbol",
    description: "",
    rules: "",
    prizes: "",
    venue_info: "",
    start_date: "",
    end_date: "",
    max_teams: "",
    min_players_per_team: "",
    max_players_per_team: "",
    registration_fee: "",
  })

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.end_date < form.start_date) {
      setError("La fecha de fin no puede ser menor a la de inicio.")
      return
    }

    try {
      setSaving(true)
      await api.post("tournament_create_provider", form)
      navigate("/provider/tournaments")
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Crear torneo</h1>

      <div className="card">
        {error && <p style={{ color: "red" }}>{error}</p>}

        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label className="field-label">Nombre</label>
            <input className="field-input" name="name" value={form.name} onChange={handle} required />
          </div>

          <div className="field">
            <label className="field-label">Deporte</label>
            <select className="field-select" name="sport" value={form.sport} onChange={handle}>
              <option value="futbol">Fútbol</option>
              <option value="futsal">Futsal</option>
              <option value="basket">Básquet</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label">Fecha inicio</label>
            <input
              type="date"
              className="field-input"
              name="start_date"
              value={form.start_date}
              min={TODAY}
              onChange={handle}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Fecha fin</label>
            <input
              type="date"
              className="field-input"
              name="end_date"
              value={form.end_date}
              min={form.start_date || TODAY}
              onChange={handle}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Máx. equipos</label>
            <input type="number" min="2" className="field-input" name="max_teams" value={form.max_teams} onChange={handle} required />
          </div>

          <div className="field">
            <label className="field-label">Jugadores mínimos por equipo</label>
            <input type="number" min="1" className="field-input" name="min_players_per_team" value={form.min_players_per_team} onChange={handle} required />
          </div>

          <div className="field">
            <label className="field-label">Jugadores máximos por equipo</label>
            <input type="number" min={form.min_players_per_team || 1} className="field-input" name="max_players_per_team" value={form.max_players_per_team} onChange={handle} required />
          </div>

          <div className="field">
            <label className="field-label">Costo inscripción</label>
            <input type="number" min="0" className="field-input" name="registration_fee" value={form.registration_fee} onChange={handle} required />
          </div>

          <div className="field">
            <label className="field-label">Descripción</label>
            <textarea className="field-textarea" name="description" value={form.description} onChange={handle}></textarea>
          </div>

          <div className="field">
            <label className="field-label">Reglas</label>
            <textarea className="field-textarea" name="rules" value={form.rules} onChange={handle}></textarea>
          </div>

          <div className="field">
            <label className="field-label">Premios</label>
            <textarea className="field-textarea" name="prizes" value={form.prizes} onChange={handle}></textarea>
          </div>

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Crear torneo"}
          </button>
        </form>
      </div>
    </div>
  )
}
