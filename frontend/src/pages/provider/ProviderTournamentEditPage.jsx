import { useEffect, useState } from "react"
import { api } from "../../api/http"
import { useNavigate, useParams } from "react-router-dom"

const TODAY = new Date().toISOString().split("T")[0]

export default function ProviderTournamentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(null)

  const fetchTournament = async () => {
    const res = await api.get("tournament_list_provider")
    const found = res.tournaments.find(t => t.id == id)
    setForm(found)
    setLoading(false)
  }

  useEffect(() => {
    fetchTournament()
  }, [])

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.end_date < form.start_date) {
      setError("La fecha de fin no puede ser menor a la de inicio.")
      return
    }

    setSaving(true)
    await api.post("tournament_update_provider", form)
    navigate("/provider/tournaments")
  }

  if (loading) return <p>Cargando...</p>
  if (!form) return <p>No encontrado.</p>

  return (
    <div>
      <h1 className="page-title">Editar torneo</h1>

      <div className="card">
        {error && <p style={{ color: "red" }}>{error}</p>}

        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label className="field-label">Nombre</label>
            <input className="field-input" name="name" value={form.name} onChange={handle} />
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
            <input type="date" className="field-input" name="start_date" min={TODAY} value={form.start_date} onChange={handle} />
          </div>

          <div className="field">
            <label className="field-label">Fecha fin</label>
            <input type="date" className="field-input" name="end_date" min={form.start_date} value={form.end_date} onChange={handle} />
          </div>

          <div className="field">
            <label className="field-label">Máx. equipos</label>
            <input type="number" className="field-input" name="max_teams" value={form.max_teams} onChange={handle} />
          </div>

          <div className="field">
            <label className="field-label">Jugadores mínimos por equipo</label>
            <input type="number" className="field-input" name="min_players_per_team" value={form.min_players_per_team} onChange={handle} />
          </div>

          <div className="field">
            <label className="field-label">Jugadores máximos por equipo</label>
            <input type="number" className="field-input" name="max_players_per_team" value={form.max_players_per_team} onChange={handle} />
          </div>

          <div className="field">
            <label className="field-label">Costo inscripción</label>
            <input type="number" className="field-input" name="registration_fee" value={form.registration_fee} onChange={handle} />
          </div>

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  )
}
