// File: frontend/src/pages/ProviderDashboardPage.jsx

import { useEffect, useState } from 'react'
import { api } from '../api/http'

export default function ProviderDashboardPage() {
  const [provider, setProvider] = useState(null)
  const [courts, setCourts] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newCourt, setNewCourt] = useState({
    name: '',
    sport: 'futbol',
    price_per_hour: '',
    max_players: '',
    internal_location: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, c, t] = await Promise.all([
        api.get('provider_profile_get'),
        api.get('court_list_by_provider'),
        api.get('tournament_list_provider'),
      ])
      setProvider(p.provider)
      setCourts(c.courts || [])
      setTournaments(t.tournaments || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleCourtChange = (e) => {
    const { name, value } = e.target
    setNewCourt((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateCourt = async (e) => {
    e.preventDefault()
    try {
      await api.post('court_create', {
        ...newCourt,
        price_per_hour: Number(newCourt.price_per_hour),
        max_players: Number(newCourt.max_players),
      })
      setNewCourt({
        name: '',
        sport: 'futbol',
        price_per_hour: '',
        max_players: '',
        internal_location: '',
      })
      await fetchAll()
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <p>Cargando...</p>
  if (error)
    return <p className="text-xs text-red-400 mb-2">Error: {error}</p>

  if (!provider) {
    return (
      <p className="text-xs text-slate-400">
        No tenés un perfil de proveedor. Primero enviá una solicitud desde la
        app (endpoint <code>provider_request_create</code>).
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold mb-1">
          Panel de proveedor · {provider.venue_name}
        </h1>
        <p className="text-xs text-slate-400">
          Administrá tus canchas y torneos.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Crear nueva cancha</h2>
          <form className="space-y-2 text-sm" onSubmit={handleCreateCourt}>
            <div className="space-y-1">
              <label>Nombre</label>
              <input
                name="name"
                value={newCourt.name}
                onChange={handleCourtChange}
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label>Deporte</label>
              <select
                name="sport"
                value={newCourt.sport}
                onChange={handleCourtChange}
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              >
                <option value="futbol">Fútbol</option>
                <option value="futsal">Futsal</option>
                <option value="basquet">Básquet</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label>Precio / hora</label>
                <input
                  name="price_per_hour"
                  type="number"
                  value={newCourt.price_per_hour}
                  onChange={handleCourtChange}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex-1 space-y-1">
                <label>Máx. jugadores</label>
                <input
                  name="max_players"
                  type="number"
                  value={newCourt.max_players}
                  onChange={handleCourtChange}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label>Ubicación interna (opcional)</label>
              <input
                name="internal_location"
                value={newCourt.internal_location}
                onChange={handleCourtChange}
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-sm py-2 font-medium"
            >
              Crear cancha
            </button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Mis canchas</h2>
          {courts.length === 0 ? (
            <p className="text-xs text-slate-500">
              Todavía no cargaste canchas.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {courts.map((c) => (
                <li
                  key={c.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-md px-3 py-2"
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.sport} · Máx. {c.max_players} jugadores
                      </div>
                      {c.internal_location && (
                        <div className="text-[11px] text-slate-500">
                          {c.internal_location}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-300">
                      <div>
                        ${Number(c.price_per_hour).toLocaleString('es-AR')}
                      </div>
                      <div className="text-slate-500">{c.status}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-3">Mis torneos</h2>
        {tournaments.length === 0 ? (
          <p className="text-xs text-slate-500">
            Todavía no creaste torneos.
          </p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3 text-xs">
            {tournaments.map((t) => (
              <li
                key={t.id}
                className="bg-slate-950/60 border border-slate-800 rounded-md px-3 py-2"
              >
                <div className="font-medium text-sm mb-1">{t.name}</div>
                <div className="text-[11px] text-slate-400">
                  {t.sport} · {t.start_date} → {t.end_date}
                </div>
                <div className="text-[11px] text-slate-400">
                  Estado: {t.status}
                </div>
                <div className="text-[11px] text-slate-400">
                  Máx. equipos: {t.max_teams}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
