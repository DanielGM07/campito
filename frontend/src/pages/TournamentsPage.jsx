// File: frontend/src/pages/TournamentsPage.jsx

import { useEffect, useState } from 'react'
import { api } from '../api/http'

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetchTournaments() {
      try {
        const res = await api.get('tournament_list_public')
        if (!isMounted) return
        setTournaments(res.tournaments || [])
      } catch (e) {
        if (!isMounted) return
        setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchTournaments()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) return <p>Cargando...</p>
  if (error) return <p className="text-xs text-red-400">{error}</p>

  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-xl font-semibold mb-1">Torneos disponibles</h1>
        <p className="text-xs text-slate-400">
          Listado de torneos con inscripción abierta o próximos.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {tournaments.length === 0 ? (
          <p className="text-xs text-slate-500">No hay torneos publicados.</p>
        ) : (
          tournaments.map((t) => (
            <article
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm"
            >
              <div className="flex justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-sm mb-1">{t.name}</h2>
                  <div className="text-[11px] text-slate-400">
                    {t.sport} · {t.start_date} → {t.end_date}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sede: {t.venue_name}
                  </div>
                  <div className="mt-2 text-xs text-slate-300 line-clamp-3">
                    {t.description}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-300">
                  <div>Inscripción:</div>
                  <div className="font-semibold">
                    ${Number(t.registration_fee).toLocaleString('es-AR')}
                  </div>
                  <div className="mt-1 text-slate-400">
                    Máx. {t.max_teams} equipos
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
