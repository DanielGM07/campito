// frontend/src/pages/provider/ProviderCourtSchedulePage.jsx
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/http'
import HourSelect from '../../components/time/HourSelect'
import HourRangePicker from '../../components/time/HourRangePicker'
import { hourToTime } from '../../components/time/timeUtils'

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

export default function ProviderCourtSchedulePage() {
  const [courts, setCourts] = useState([])
  const [selectedCourtId, setSelectedCourtId] = useState('')
  const [allSlots, setAllSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [saving, setSaving] = useState(false)

  // Alta 1x1
  const [weekday, setWeekday] = useState(1)
  const [startHour, setStartHour] = useState(null)

  // Bulk por rango
  const [bulkWeekday, setBulkWeekday] = useState(1)
  const [bulkStartHour, setBulkStartHour] = useState(null)
  const [bulkEndHour, setBulkEndHour] = useState(null)

  const loadCourts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('court_list_by_provider')
      const list = res.courts || []
      setCourts(list)
      if (list.length > 0) setSelectedCourtId(String(list[0].id))
    } catch (e) {
      setError(e.message || 'Error al cargar las canchas')
    } finally {
      setLoading(false)
    }
  }

  const loadSlots = async () => {
    try {
      const res = await api.get('court_timeslots_list_by_court')
      setAllSlots(res.slots || [])
    } catch (e) {
      console.error(e)
      setAllSlots([])
    }
  }

  useEffect(() => {
    const init = async () => {
      await loadCourts()
      await loadSlots()
    }
    init()
  }, [])

  const slotsForSelectedCourt = useMemo(() => {
    if (!selectedCourtId) return []
    return allSlots.filter(s => Number(s.court_id) === Number(selectedCourtId))
  }, [allSlots, selectedCourtId])

  const slotsByWeekday = useMemo(() => {
    return WEEKDAYS.map(day => ({
      ...day,
      items: slotsForSelectedCourt
        .filter(s => Number(s.weekday) === day.value)
        .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
    }))
  }, [slotsForSelectedCourt])

  // Horas ya usadas (por día) para deshabilitar en el select 1x1
  const usedStartHoursForDay = useMemo(() => {
    const set = new Set()
    slotsForSelectedCourt
      .filter(s => Number(s.weekday) === Number(weekday))
      .forEach(s => {
        const hh = Number(String(s.start_time).slice(0, 2))
        set.add(hh)
      })
    return Array.from(set)
  }, [slotsForSelectedCourt, weekday])

  // Para BULK: deshabilitar horas inicio/fin si ya existen slots (para no confundir),
  // igual el backend ignora duplicados; esto es solo UX.
  const usedStartHoursForBulkDay = useMemo(() => {
    const set = new Set()
    slotsForSelectedCourt
      .filter(s => Number(s.weekday) === Number(bulkWeekday))
      .forEach(s => {
        const hh = Number(String(s.start_time).slice(0, 2))
        set.add(hh)
      })
    return Array.from(set)
  }, [slotsForSelectedCourt, bulkWeekday])

  const handleCreateSlot = async e => {
    e.preventDefault()
    if (!selectedCourtId) return
    if (startHour === null || startHour === undefined) {
      alert('Seleccioná una hora de inicio.')
      return
    }

    const s = Number(startHour)
    const eHour = s + 1
    if (eHour > 24) {
      alert('La última hora de inicio posible es 23:00.')
      return
    }

    setSaving(true)
    try {
      await api.post('court_timeslot_create', {
        court_id: Number(selectedCourtId),
        weekday: Number(weekday),
        start_time: hourToTime(s),
        end_time: hourToTime(eHour),
      })
      setStartHour(null)
      await loadSlots()
    } catch (err) {
      alert(err.message || 'Error al crear el horario')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkCreate = async e => {
    e.preventDefault()
    if (!selectedCourtId) return
    if (bulkStartHour == null || bulkEndHour == null) {
      alert('Seleccioná hora inicio y hora fin.')
      return
    }
    if (bulkEndHour <= bulkStartHour) {
      alert('La hora fin debe ser mayor a la hora inicio.')
      return
    }

    setSaving(true)
    try {
      await api.post('court_timeslots_bulk_create', {
        court_id: Number(selectedCourtId),
        weekday: Number(bulkWeekday),
        range: {
          start_time: hourToTime(Number(bulkStartHour)),
          end_time: hourToTime(Number(bulkEndHour)),
        },
      })
      setBulkStartHour(null)
      setBulkEndHour(null)
      await loadSlots()
    } catch (err) {
      alert(err.message || 'Error al cargar el rango')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async slotId => {
    const ok = window.confirm('¿Eliminar este horario?')
    if (!ok) return
    try {
      await api.post('court_timeslot_delete', { id: slotId })
      await loadSlots()
    } catch (e) {
      alert(e.message || 'Error al eliminar el horario')
    }
  }

  if (loading) return <p>Cargando canchas...</p>

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">Horarios de disponibilidad</h1>
        <p className="page-subtitle">
          Definí turnos de <b>1 hora</b> por día. Podés agregar 1x1 o cargar un <b>rango</b> (se parte automáticamente
          en turnos de 1 hora). Soporta 23:00 → 24:00.
        </p>
      </div>

      {error ? <p style={{ color: '#f97373', fontSize: 12, marginBottom: 10 }}>Error: {error}</p> : null}

      {courts.length === 0 ? (
        <div className="card">
          <p className="page-subtitle">
            Primero necesitás crear canchas en el apartado <b>“Mis canchas”</b>.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.3fr)',
            gap: 12,
          }}>
          {/* Configuración */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Configurar horarios</div>
                <div className="card-subtitle">Elegí una cancha y cargá turnos.</div>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label">Cancha</label>
                <select
                  className="field-select"
                  value={selectedCourtId}
                  onChange={e => setSelectedCourtId(e.target.value)}>
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.sport}
                    </option>
                  ))}
                </select>
              </div>

              {/* 1x1 */}
              <div style={{ paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.25)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Agregar 1 turno (1 hora)</div>

                <form onSubmit={handleCreateSlot} className="form-grid">
                  <div className="field">
                    <label className="field-label">Día de la semana</label>
                    <select className="field-select" value={weekday} onChange={e => setWeekday(Number(e.target.value))}>
                      {WEEKDAYS.map(d => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <HourSelect
                    label="Hora inicio (turno de 1h)"
                    value={startHour ?? ''}
                    onChange={h => setStartHour(h)}
                    min={0}
                    max={23}
                    include24={false}
                    disabledHours={usedStartHoursForDay}
                  />

                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Fin automático:{' '}
                    <b>
                      {startHour === null
                        ? '—'
                        : `${String(startHour).padStart(2, '0')}:00 → ${String(startHour + 1).padStart(2, '0')}:00`}
                    </b>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Agregar turno'}
                  </button>
                </form>
              </div>

              {/* BULK */}
              <div style={{ paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.25)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Cargar por rango</div>

                <form onSubmit={handleBulkCreate} className="form-grid">
                  <div className="field">
                    <label className="field-label">Día de la semana</label>
                    <select
                      className="field-select"
                      value={bulkWeekday}
                      onChange={e => setBulkWeekday(Number(e.target.value))}>
                      {WEEKDAYS.map(d => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <HourRangePicker
                    startHour={bulkStartHour}
                    endHour={bulkEndHour}
                    onChangeStart={setBulkStartHour}
                    onChangeEnd={setBulkEndHour}
                    minStart={0}
                    maxStart={23}
                    minEnd={1}
                    maxEnd={24}
                    // UX: marcamos como deshabilitados los inicios ya usados
                    disabledStartHours={usedStartHoursForBulkDay}
                    helper="Se crearán turnos de 1 hora dentro del rango. Si ya existen, se ignoran."
                  />

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Procesando...' : 'Cargar rango'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Listado */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Horarios cargados</div>
                <div className="card-subtitle">Vista por día. Podés eliminar turnos.</div>
              </div>
            </div>

            {slotsForSelectedCourt.length === 0 ? (
              <p className="page-subtitle">Todavía no cargaste horarios para esta cancha.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slotsByWeekday.map(day => (
                  <div
                    key={day.value}
                    style={{
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.4)',
                      padding: '8px 10px',
                      background: 'linear-gradient(135deg, rgba(15,23,42,0.04), transparent)',
                    }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{day.label}</div>
                      <div className="chip" style={{ fontSize: 11 }}>
                        {day.items.length} turno(s)
                      </div>
                    </div>

                    {day.items.length === 0 ? (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Sin horarios configurados para este día.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11 }}>
                        {day.items.map(s => (
                          <div
                            key={s.id}
                            className="chip"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span>
                              {String(s.start_time).slice(0, 5)} - {String(s.end_time).slice(0, 5)}
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 10, padding: '2px 6px' }}
                              onClick={() => handleDeleteSlot(s.id)}>
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
