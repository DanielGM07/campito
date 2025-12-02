// File: src/pages/provider/ProviderCourtSchedulePage.jsx
import { useEffect, useState } from "react"
import { api } from "../../api/http"

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
]

export default function ProviderCourtSchedulePage() {
  const [courts, setCourts] = useState([])
  const [selectedCourtId, setSelectedCourtId] = useState("")
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    weekday: 1,
    start_time: "",
    end_time: "",
  })

  const loadCourts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("court_list_by_provider")
      const list = res.courts || []
      setCourts(list)
      if (list.length > 0) {
        setSelectedCourtId(String(list[0].id))
      }
    } catch (e) {
      setError(e.message || "Error al cargar las canchas")
    } finally {
      setLoading(false)
    }
  }

  const loadSlots = async (courtId) => {
    if (!courtId) {
      setSlots([])
      return
    }
    try {
      const res = await api.get("court_timeslots_list_by_court", {
        court_id: Number(courtId),
      })
      setSlots(res.slots || [])
    } catch (e) {
      console.error(e)
      setSlots([])
    }
  }

  useEffect(() => {
    loadCourts()
  }, [])

  useEffect(() => {
    if (selectedCourtId) {
      loadSlots(selectedCourtId)
    }
  }, [selectedCourtId])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateSlot = async (e) => {
    e.preventDefault()
    if (!selectedCourtId) return

    setSaving(true)
    try {
      await api.post("court_timeslot_create", {
        court_id: Number(selectedCourtId),
        weekday: Number(form.weekday),
        start_time: form.start_time,
        end_time: form.end_time,
      })
      setForm((prev) => ({ ...prev, start_time: "", end_time: "" }))
      await loadSlots(selectedCourtId)
    } catch (e) {
      alert(e.message || "Error al crear el horario")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    const ok = window.confirm("¿Eliminar este horario?")
    if (!ok) return

    try {
      await api.post("court_timeslot_delete", { id: slotId })
      await loadSlots(selectedCourtId)
    } catch (e) {
      alert(e.message || "Error al eliminar el horario")
    }
  }

  const slotsByWeekday = WEEKDAYS.map((day) => ({
    ...day,
    items: slots.filter((s) => Number(s.weekday) === day.value),
  }))

  if (loading) {
    return <p>Cargando canchas...</p>
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">Horarios de disponibilidad</h1>
        <p className="page-subtitle">
          Definí los días y horarios en los que cada cancha se puede reservar.
        </p>
      </div>

      {error && (
        <p style={{ color: "#f97373", fontSize: 12, marginBottom: 10 }}>
          Error: {error}
        </p>
      )}

      {courts.length === 0 ? (
        <div className="card">
          <p className="page-subtitle">
            Primero necesitás crear canchas en la sección <b>“Mis canchas”</b>.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr)",
            gap: 12,
          }}
        >
          {/* Selección de cancha + formulario */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Configurar horarios</div>
                <div className="card-subtitle">
                  Elegí una cancha y agregá bloques de horarios.
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label">Cancha</label>
                <select
                  className="field-select"
                  value={selectedCourtId}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
                >
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.sport}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleCreateSlot} className="form-grid">
                <div className="field">
                  <label className="field-label">Día de la semana</label>
                  <select
                    name="weekday"
                    className="field-select"
                    value={form.weekday}
                    onChange={handleFormChange}
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div className="field">
                    <label className="field-label">Hora inicio</label>
                    <input
                      type="time"
                      name="start_time"
                      className="field-input"
                      value={form.start_time}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Hora fin</label>
                    <input
                      type="time"
                      name="end_time"
                      className="field-input"
                      value={form.end_time}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Agregar horario"}
                </button>
              </form>
            </div>
          </div>

          {/* Listado de horarios */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Horarios cargados</div>
                <div className="card-subtitle">
                  Vista por día. Podés eliminar bloques que ya no quieras ofrecer.
                </div>
              </div>
            </div>

            {slots.length === 0 ? (
              <p className="page-subtitle">
                Todavía no cargaste horarios para esta cancha.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {slotsByWeekday.map((day) => (
                  <div
                    key={day.value}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.4)",
                      padding: "8px 10px",
                      background:
                        "linear-gradient(135deg, rgba(15,23,42,0.04), transparent)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {day.label}
                      </div>
                      <div
                        className="chip"
                        style={{ fontSize: 11 }}
                      >
                        {day.items.length} bloque(s)
                      </div>
                    </div>

                    {day.items.length === 0 ? (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                        }}
                      >
                        Sin horarios configurados para este día.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          fontSize: 11,
                        }}
                      >
                        {day.items.map((s) => (
                          <div
                            key={s.id}
                            className="chip"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span>
                              {s.start_time?.slice(0, 5)} -{" "}
                              {s.end_time?.slice(0, 5)}
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 10, padding: "2px 6px" }}
                              onClick={() => handleDeleteSlot(s.id)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
