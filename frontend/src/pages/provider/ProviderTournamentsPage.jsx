// File: src/pages/provider/ProviderTournamentsPage.jsx
import { useEffect, useState } from "react"
import { api } from "../../api/http"
import { useNavigate } from "react-router-dom"

export default function ProviderTournamentsPage() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTournaments = async () => {
    try {
      const res = await api.get("tournament_list_provider")
      setTournaments(res.tournaments || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTournaments()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este torneo? Esta acción no puede deshacerse.")) return
    await api.post("tournament_delete_provider", { id })
    fetchTournaments()
  }

  if (loading) return <p>Cargando torneos...</p>

  return (
    <div>
      <h1 className="page-title">Torneos</h1>
      <p className="page-subtitle">Administrá tus torneos creados.</p>

      <button
        className="btn btn-primary"
        onClick={() => navigate("/provider/tournaments/new")}
        style={{ marginBottom: 12 }}
      >
        Crear torneo
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div className="card">
        {tournaments.length === 0 ? (
          <p>No tenés torneos creados.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {tournaments.map((t) => (
              <li
                key={t.id}
                style={{
                  padding: 10,
                  borderBottom: "1px solid rgba(148,163,184,0.4)"
                }}
              >
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {t.sport} — {t.start_date} → {t.end_date}
                </div>

                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/provider/tournaments/edit/${t.id}`)}
                  >
                    Editar
                  </button>

                  <button
                    className="btn btn-sm"
                    style={{ borderColor: "rgba(239,68,68,0.65)", color: "#fecaca" }}
                    onClick={() => handleDelete(t.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
