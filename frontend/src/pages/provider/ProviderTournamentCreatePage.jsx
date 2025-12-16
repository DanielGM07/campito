// File: frontend/src/pages/provider/ProviderTournamentCreatePage.jsx
import { useEffect, useMemo, useState } from "react"
import { api } from "../../api/http"
import { useNavigate } from "react-router-dom"

const TODAY = new Date().toISOString().split("T")[0]

export default function ProviderTournamentCreatePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [courts, setCourts] = useState([])
  const [loadingCourts, setLoadingCourts] = useState(true)

  const [form, setForm] = useState({
    name: "",
    sport: "futbol",
    description: "",
    rules: "",
    prizes: "",
    venue_info: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    court_id: "",
    max_teams: "",
    min_players_per_team: "",
    max_players_per_team: "",
    registration_fee: "",
  })

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    const loadCourts = async () => {
      setLoadingCourts(true)
      setError(null)
      try {
        const res = await api.get("court_list_by_provider")
        setCourts(res.courts || [])
      } catch (err) {
        setError(err.message || "Error al cargar canchas")
      } finally {
        setLoadingCourts(false)
      }
    }
    loadCourts()
  }, [])

  // Filtrar canchas por deporte elegido
  const courtsForSport = useMemo(() => {
    return (courts || []).filter((c) => c.sport === form.sport && c.status === "active")
  }, [courts, form.sport])

  // Si cambia sport y la cancha elegida ya no aplica, la limpiamos
  useEffect(() => {
    if (!form.court_id) return
    const exists = courtsForSport.some((c) => String(c.id) === String(form.court_id))
    if (!exists) {
      setForm((prev) => ({ ...prev, court_id: "" }))
    }
  }, [form.court_id, courtsForSport])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.end_date < form.start_date) {
      setError("La fecha de fin no puede ser menor a la de inicio.")
      return
    }
    if (!form.start_time || !form.end_time) {
      setError("Debés indicar hora de inicio y fin del torneo.")
      return
    }
    if (form.end_time <= form.start_time) {
      setError("La hora de fin debe ser mayor a la de inicio.")
      return
    }
    if (!form.court_id) {
      setError("Debés seleccionar una cancha.")
      return
    }

    try {
      setSaving(true)
      await api.post("tournament_create_provider", {
        ...form,
        court_id: Number(form.court_id),
      })
      navigate("/provider/tournaments")
    } catch (err) {
      setError(err.message || "No se pudo crear el torneo")
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
            <label className="field-label">Cancha</label>
            <select
              className="field-select"
              name="court_id"
              value={form.court_id}
              onChange={handle}
              disabled={loadingCourts}
              required
            >
              <option value="">
                {loadingCourts ? "Cargando canchas..." : "Elegí una cancha"}
              </option>
              {courtsForSport.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.internal_location ? `(${c.internal_location})` : ""}
                </option>
              ))}
            </select>
            {!loadingCourts && courtsForSport.length === 0 ? (
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                No tenés canchas activas para este deporte.
              </p>
            ) : null}
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
            <label className="field-label">Hora inicio torneo</label>
            <input
              type="time"
              className="field-input"
              name="start_time"
              value={form.start_time}
              onChange={handle}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Hora fin torneo</label>
            <input
              type="time"
              className="field-input"
              name="end_time"
              value={form.end_time}
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

          <button className="btn btn-primary" disabled={saving || loadingCourts || courtsForSport.length === 0}>
            {saving ? "Guardando..." : "Crear torneo"}
          </button>
        </form>
      </div>
    </div>
  )
}
