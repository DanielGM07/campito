// File: src/pages/provider/ProviderReservationsPage.jsx
import { useEffect, useState } from "react"
import { api } from "../../api/http"

export default function ProviderReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReservations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("reservation_list_by_provider")
      setReservations(res.reservations || [])
    } catch (e) {
      setError(e.message || "Error al cargar las reservas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const formatDate = (d) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("es-AR")
  }

  const formatTime = (t) => (t ? t.slice(0, 5) : "-")

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">Reservas de mis canchas</h1>
        <p className="page-subtitle">
          Consultá las reservas realizadas sobre las canchas de tu complejo.
        </p>
      </div>

      {error && (
        <p style={{ color: "#f97373", fontSize: 12, marginBottom: 10 }}>
          Error: {error}
        </p>
      )}

      <div className="card">
        {loading ? (
          <p className="page-subtitle">Cargando reservas...</p>
        ) : reservations.length === 0 ? (
          <p className="page-subtitle">
            Todavía no hay reservas sobre tus canchas.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid rgba(148,163,184,0.35)",
                  }}
                >
                  <th style={{ padding: "8px 4px" }}>Fecha</th>
                  <th style={{ padding: "8px 4px" }}>Hora</th>
                  <th style={{ padding: "8px 4px" }}>Cancha</th>
                  <th style={{ padding: "8px 4px" }}>Jugador</th>
                  <th style={{ padding: "8px 4px" }}>Tipo</th>
                  <th style={{ padding: "8px 4px" }}>Estado</th>
                  <th style={{ padding: "8px 4px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: "1px solid rgba(148,163,184,0.18)",
                    }}
                  >
                    <td style={{ padding: "6px 4px" }}>
                      {formatDate(r.reserved_date)}
                    </td>
                    <td style={{ padding: "6px 4px" }}>
                      {formatTime(r.start_time)} - {formatTime(r.end_time)}
                    </td>
                    <td style={{ padding: "6px 4px" }}>
                      <div>{r.court_name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                        }}
                      >
                        {r.court_sport}
                      </div>
                    </td>
                    <td style={{ padding: "6px 4px" }}>
                      {r.player_first_name} {r.player_last_name}
                    </td>
                    <td style={{ padding: "6px 4px", fontSize: 12 }}>
                      {r.type === "team" ? "Equipo" : "Individual"}
                    </td>
                    <td style={{ padding: "6px 4px", fontSize: 12 }}>
                      <span className="chip">{r.status}</span>
                    </td>
                    <td style={{ padding: "6px 4px" }}>
                      ${Number(r.total_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
