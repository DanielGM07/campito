// File: src/pages/player/BookCourtPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function BookCourtPage() {
  const [filters, setFilters] = useState({
    location: '',
    sport: 'futbol',
    date: new Date().toISOString().slice(0, 10),
  })

  const [courts, setCourts] = useState([])
  const [loadingCourts, setLoadingCourts] = useState(false)
  const [courtsError, setCourtsError] = useState(null)

  const [selectedCourt, setSelectedCourt] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState(null)

  const [selectedSlot, setSelectedSlot] = useState(null)

  const [teams, setTeams] = useState([])
  const [reservationType, setReservationType] = useState('individual')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [createSuccess, setCreateSuccess] = useState(null)

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const searchCourts = async (e) => {
    if (e) e.preventDefault()
    setLoadingCourts(true)
    setCourtsError(null)
    setSelectedCourt(null)
    setSlots([])
    setSelectedSlot(null)

    try {
      const res = await api.post('court_search_public', {
        location: filters.location || undefined,
        sport: filters.sport || undefined,
        date: filters.date || undefined,
      })
      setCourts(res.courts || [])
    } catch (err) {
      setCourtsError(err.message)
      setCourts([])
    } finally {
      setLoadingCourts(false)
    }
  }

  const loadSlots = async (court) => {
    setSelectedCourt(court)
    setSlots([])
    setSelectedSlot(null)
    setSlotsError(null)
    setLoadingSlots(true)
    try {
      const res = await api.post('court_availability_list', {
        court_id: court.id,
        date: filters.date,
      })
      setSlots(res.slots || [])
    } catch (err) {
      setSlotsError(err.message)
    } finally {
      setLoadingSlots(false)
    }
  }

  const loadTeams = async () => {
    try {
      const res = await api.get('team_list_my')
      setTeams(res.teams || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadTeams()
    // buscar canchas por defecto al entrar (opcional)
    searchCourts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateReservation = async (e) => {
    e.preventDefault()
    if (!selectedCourt || !selectedSlot) return

    if (reservationType === 'team' && !selectedTeamId) {
      setCreateError('Seleccioná un equipo para la reserva por equipo.')
      return
    }

    setCreating(true)
    setCreateError(null)
    setCreateSuccess(null)

    try {
      await api.post('reservation_create', {
        court_id: selectedCourt.id,
        reserved_date: filters.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        type: reservationType,
        team_id: reservationType === 'team' ? Number(selectedTeamId) : undefined,
      })

      setCreateSuccess('Reserva creada correctamente.')
      setSelectedSlot(null)
      // podrías recargar slots para que desaparezca el horario recién reservado
      await loadSlots(selectedCourt)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const isSlotSelected = (slot) =>
    selectedSlot &&
    slot.start_time === selectedSlot.start_time &&
    slot.end_time === selectedSlot.end_time

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Reservar cancha</h1>
        <p className="page-subtitle">
          Buscá canchas disponibles según ubicación, deporte y fecha, elegí un
          horario y confirmá tu reserva.
        </p>
      </section>

      {/* Filtros */}
      <section className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Filtros de búsqueda</div>
            <div className="card-subtitle">
              Ajustá la ubicación, deporte y fecha para ver disponibilidad.
            </div>
          </div>
        </div>

        <form
          className="form-grid"
          onSubmit={searchCourts}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr auto',
            gap: 10,
            alignItems: 'flex-end',
          }}
        >
          <div className="field">
            <label className="field-label">Ubicación (texto libre)</label>
            <input
              name="location"
              className="field-input"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Ej: Caballito, Palermo..."
            />
          </div>
          <div className="field">
            <label className="field-label">Deporte</label>
            <select
              name="sport"
              className="field-select"
              value={filters.sport}
              onChange={handleFilterChange}
            >
              <option value="futbol">Fútbol</option>
              <option value="futsal">Futsal</option>
              <option value="basquet">Básquet</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Fecha</label>
            <input
              type="date"
              name="date"
              className="field-input"
              value={filters.date}
              onChange={handleFilterChange}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loadingCourts}
          >
            {loadingCourts ? 'Buscando...' : 'Buscar canchas'}
          </button>
        </form>

        {courtsError && (
          <p style={{ fontSize: 12, color: '#f97373', marginTop: 8 }}>
            {courtsError}
          </p>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
          gap: 14,
        }}
      >
        {/* Lista de canchas */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Canchas disponibles</div>
              <div className="card-subtitle">
                Seleccioná una cancha para ver los horarios libres.
              </div>
            </div>
          </div>

          {loadingCourts ? (
            <p className="page-subtitle">Buscando canchas...</p>
          ) : courts.length === 0 ? (
            <p className="page-subtitle">
              No se encontraron canchas con esos filtros.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 10,
                marginTop: 6,
              }}
            >
              {courts.map((court) => {
                const isActive = selectedCourt && selectedCourt.id === court.id
                return (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => loadSlots(court)}
                    style={{
                      textAlign: 'left',
                      borderRadius: 14,
                      border: isActive
                        ? '1px solid rgba(59,130,246,0.9)'
                        : '1px solid rgba(148,163,184,0.5)',
                      padding: '9px 10px',
                      fontSize: 12,
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(37,99,235,0.28), transparent)'
                        : 'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{court.name}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {court.provider_name} · {court.sport}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {court.location}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      Precio aprox. por hora:{' '}
                      <strong>
                        $
                        {Number(
                          court.price_per_hour || 0,
                        ).toLocaleString('es-AR')}
                      </strong>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Horarios + confirmación */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Horarios y confirmación</div>
              <div className="card-subtitle">
                Elegí un horario y el tipo de reserva, luego confirmá.
              </div>
            </div>
          </div>

          {!selectedCourt ? (
            <p className="page-subtitle">
              Primero seleccioná una cancha de la lista.
            </p>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 8,
                  color: 'var(--text-muted)',
                }}
              >
                Cancha seleccionada:{' '}
                <strong>{selectedCourt.name}</strong> ·{' '}
                {selectedCourt.provider_name}
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  Horarios disponibles para {filters.date}
                </div>
                {loadingSlots ? (
                  <p
                    className="page-subtitle"
                    style={{ marginBottom: 6 }}
                  >
                    Cargando horarios...
                  </p>
                ) : slotsError ? (
                  <p
                    style={{
                      fontSize: 12,
                      color: '#f97373',
                      marginBottom: 6,
                    }}
                  >
                    {slotsError}
                  </p>
                ) : slots.length === 0 ? (
                  <p className="page-subtitle">
                    No hay horarios disponibles para esta fecha.
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(90px, 1fr))',
                      gap: 6,
                    }}
                  >
                    {slots.map((slot, idx) => {
                      const selectable = slot.is_available !== false
                      const active = isSlotSelected(slot)
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!selectable}
                          onClick={() =>
                            selectable && setSelectedSlot(slot)
                          }
                          style={{
                            borderRadius: 999,
                            border: active
                              ? '1px solid rgba(59,130,246,0.9)'
                              : '1px solid rgba(148,163,184,0.5)',
                            padding: '5px 8px',
                            fontSize: 11,
                            cursor: selectable ? 'pointer' : 'not-allowed',
                            background: !selectable
                              ? 'rgba(148,163,184,0.16)'
                              : active
                              ? 'linear-gradient(135deg, rgba(37,99,235,0.35), transparent)'
                              : 'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                            opacity: selectable ? 1 : 0.5,
                          }}
                        >
                          {slot.start_time.slice(0, 5)} -{' '}
                          {slot.end_time.slice(0, 5)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Formulario de confirmación */}
              <form onSubmit={handleCreateReservation}>
                <div
                  style={{
                    borderTop: '1px solid rgba(148,163,184,0.45)',
                    paddingTop: 8,
                    marginTop: 4,
                  }}
                >
                  <div className="field">
                    <label className="field-label">
                      Tipo de reserva
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        fontSize: 12,
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setReservationType('individual')}
                        style={
                          reservationType === 'individual'
                            ? {
                                borderColor:
                                  'rgba(59,130,246,0.85)',
                                boxShadow:
                                  '0 0 0 1px rgba(59,130,246,0.6)',
                              }
                            : {}
                        }
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setReservationType('team')}
                        style={
                          reservationType === 'team'
                            ? {
                                borderColor:
                                  'rgba(59,130,246,0.85)',
                                boxShadow:
                                  '0 0 0 1px rgba(59,130,246,0.6)',
                              }
                            : {}
                        }
                      >
                        Por equipo
                      </button>
                    </div>
                  </div>

                  {reservationType === 'team' && (
                    <div className="field" style={{ marginTop: 6 }}>
                      <label className="field-label">
                        Equipo (donde sos capitán / integrante)
                      </label>
                      <select
                        className="field-select"
                        value={selectedTeamId}
                        onChange={(e) =>
                          setSelectedTeamId(e.target.value)
                        }
                      >
                        <option value="">Seleccioná un equipo</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} · {t.sport}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {createError && (
                    <p
                      style={{
                        fontSize: 12,
                        color: '#f97373',
                        marginTop: 6,
                      }}
                    >
                      {createError}
                    </p>
                  )}
                  {createSuccess && (
                    <p
                      style={{
                        fontSize: 12,
                        color: '#4ade80',
                        marginTop: 6,
                      }}
                    >
                      {createSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ marginTop: 8, width: '100%' }}
                    disabled={!selectedSlot || creating}
                  >
                    {creating
                      ? 'Creando reserva...'
                      : selectedSlot
                      ? `Confirmar reserva ${selectedSlot.start_time.slice(
                          0,
                          5,
                        )} - ${selectedSlot.end_time.slice(0, 5)}`
                      : 'Seleccioná un horario'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
