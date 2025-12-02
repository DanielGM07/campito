// File: src/pages/provider/ProviderCourtsPage.jsx

import { useEffect, useState } from 'react'
import { api } from '../../api/http'

const INITIAL_FORM = {
  id: null,
  name: '',
  sport: 'futbol',
  price_per_hour: '',
  max_players: '',
  internal_location: '',
  status: 'active',
}

export default function ProviderCourtsPage() {
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)

  const isEditing = form.id !== null

  const fetchCourts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('court_list_by_provider')
      setCourts(res.courts || [])
    } catch (e) {
      setError(e.message || 'Error al cargar las canchas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourts()
  }, [])

  const resetForm = () => setForm(INITIAL_FORM)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: form.name,
        sport: form.sport,
        price_per_hour: Number(form.price_per_hour),
        max_players: Number(form.max_players),
        internal_location: form.internal_location || null,
        status: form.status || 'active',
      }

      if (isEditing) {
        await api.post('court_update', { id: form.id, ...payload })
      } else {
        await api.post('court_create', payload)
      }

      resetForm()
      await fetchCourts()
    } catch (e) {
      setError(e.message || 'Error al guardar la cancha')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (court) => {
    setForm({
      id: court.id,
      name: court.name || '',
      sport: court.sport || 'futbol',
      price_per_hour: court.price_per_hour ?? '',
      max_players: court.max_players ?? '',
      internal_location: court.internal_location || '',
      status: court.status || 'active',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (court) => {
    const ok = window.confirm(
      `¿Eliminar la cancha "${court.name}"? Se hará una baja lógica.`
    )
    if (!ok) return

    setSaving(true)
    setError(null)
    try {
      await api.post('court_delete', { id: court.id })
      if (form.id === court.id) resetForm()
      await fetchCourts()
    } catch (e) {
      setError(e.message || 'Error al eliminar la cancha')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Cargando canchas...</p>
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">Mis canchas</h1>
        <p className="page-subtitle">
          Creá, editá y administrá las canchas de tu complejo.
        </p>
      </div>

      {error && (
        <p style={{ color: '#f97373', fontSize: 12, marginBottom: 10 }}>
          Error: {error}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.2fr)',
          gap: 12,
        }}
      >
        {/* Formulario */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {isEditing ? 'Editar cancha' : 'Crear nueva cancha'}
              </div>
              <div className="card-subtitle">
                Completá los datos básicos de la cancha.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label className="field-label">Nombre de la cancha</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="field-input"
                placeholder="Ej: Cancha 5 techada"
                required
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                gap: 8,
              }}
            >
              <div className="field">
                <label className="field-label">Deporte</label>
                <select
                  name="sport"
                  value={form.sport}
                  onChange={handleChange}
                  className="field-select"
                >
                  <option value="futbol">Fútbol</option>
                  <option value="futsal">Futsal</option>
                  <option value="basket">Básquet</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Estado</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="field-select"
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                gap: 8,
              }}
            >
              <div className="field">
                <label className="field-label">Precio por hora (ARS)</label>
                <input
                  name="price_per_hour"
                  type="number"
                  min="0"
                  step="100"
                  value={form.price_per_hour}
                  onChange={handleChange}
                  className="field-input"
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">
                  Cantidad máxima de jugadores
                </label>
                <input
                  name="max_players"
                  type="number"
                  min="1"
                  value={form.max_players}
                  onChange={handleChange}
                  className="field-input"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">
                Ubicación interna (opcional)
              </label>
              <input
                name="internal_location"
                value={form.internal_location}
                onChange={handleChange}
                className="field-input"
                placeholder="Ej: Piso 2, sector techado, etc."
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
              }}
            >
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving
                  ? 'Guardando...'
                  : isEditing
                  ? 'Guardar cambios'
                  : 'Crear cancha'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-ghost btn-sm"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Listado de canchas */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Listado de canchas</div>
              <div className="card-subtitle">
                Vista rápida de todas las canchas del complejo.
              </div>
            </div>
            <div className="chip">Total: {courts.length}</div>
          </div>

          {courts.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              Todavía no cargaste canchas. Creá la primera desde el formulario.
            </div>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {courts.map((c) => (
                <li
                  key={c.id}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.4)',
                    padding: '8px 10px',
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.06), transparent)',
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {c.sport} · Máx. {c.max_players} jugadores
                      </div>
                      {c.internal_location && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                          }}
                        >
                          {c.internal_location}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div>
                        $
                        {Number(c.price_per_hour).toLocaleString('es-AR')}
                      </div>
                      <div>{c.status}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleEdit(c)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        borderColor: 'rgba(239,68,68,0.65)',
                        color: '#fecaca',
                      }}
                      onClick={() => handleDelete(c)}
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
    </div>
  )
}
