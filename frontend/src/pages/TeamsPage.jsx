// File: frontend/src/pages/TeamsPage.jsx

import { useEffect, useState } from 'react'
import { api } from '../api/http'

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
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold mb-1">Mis equipos</h1>
        <p className="text-xs text-slate-400">
          Creá equipos y administrá invitaciones desde acá.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Crear nuevo equipo</h2>
          {error && (
            <p className="mb-2 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <form className="space-y-3 text-sm" onSubmit={handleCreateTeam}>
            <div className="space-y-1">
              <label>Nombre</label>
              <input
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label>Deporte</label>
              <select
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                <option value="futbol">Fútbol</option>
                <option value="futsal">Futsal</option>
                <option value="basquet">Básquet</option>
              </select>
            </div>
            <div className="space-y-1">
              <label>Descripción (opcional)</label>
              <textarea
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full mt-1 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-sm py-2 font-medium disabled:opacity-60"
            >
              {saving ? 'Creando...' : 'Crear equipo'}
            </button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Listado</h2>
          {loading ? (
            <p className="text-xs text-slate-400">Cargando...</p>
          ) : teams.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aún no formas parte de ningún equipo.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {teams.map((t) => (
                <li
                  key={t.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-md px-3 py-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Deporte: {t.sport} · Máx. {t.max_members} jugadores
                      </div>
                    </div>
                  </div>
                  {t.description && (
                    <p className="mt-1 text-[11px] text-slate-300">
                      {t.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
