// frontend/src/pages/provider/ProviderTournamentCreatePage.jsx
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/http'
import { useNavigate } from 'react-router-dom'
import HourRangePicker from '../../components/time/HourRangePicker'
import { hourToTime, timeToHour } from '../../components/time/timeUtils'

const TODAY = new Date().toISOString().split('T')[0]

function eachDate(from, to) {
  if (!from || !to) return []
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return []
  if (b < a) return []
  const out = []
  const d = new Date(a)
  while (d <= b) {
    out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export default function ProviderTournamentCreatePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [courts, setCourts] = useState([])
  const [loadingCourts, setLoadingCourts] = useState(true)

  const [allSlots, setAllSlots] = useState([]) // provider slots

  const [form, setForm] = useState({
    name: '',
    sport: 'futbol',
    description: '',
    rules: '',
    prizes: '',
    venue_info: '',
    start_date: '',
    end_date: '',
    // ahora trabajamos con horas int (0..24) usando HourRangePicker:
    start_hour: null,
    end_hour: null,
    court_id: '',
    max_teams: 4, // ✅ select (4/8/16) + default
    min_players_per_team: '',
    max_players_per_team: '',
    registration_fee: '',
  })

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  useEffect(() => {
    const load = async () => {
      setLoadingCourts(true)
      setError(null)
      try {
        const res = await api.get('court_list_by_provider')
        setCourts(res.courts || [])
        const slotsRes = await api.get('court_timeslots_list_by_court')
        setAllSlots(slotsRes.slots || [])
      } catch (err) {
        setError(err.message || 'Error al cargar canchas/horarios')
      } finally {
        setLoadingCourts(false)
      }
    }
    load()
  }, [])

  const courtsForSport = useMemo(() => {
    return (courts || []).filter(c => c.sport === form.sport && c.status === 'active')
  }, [courts, form.sport])

  useEffect(() => {
    // si cambió sport y la cancha ya no aplica
    if (!form.court_id) return
    const exists = courtsForSport.some(c => String(c.id) === String(form.court_id))
    if (!exists) {
      setForm(p => ({ ...p, court_id: '', start_hour: null, end_hour: null }))
    }
  }, [form.court_id, courtsForSport])

  // slots de la cancha seleccionada
  const slotsForCourt = useMemo(() => {
    if (!form.court_id) return []
    return (allSlots || []).filter(s => Number(s.court_id) === Number(form.court_id))
  }, [allSlots, form.court_id])

  // mapa weekday -> set de startHour disponibles
  const availableStartByWeekday = useMemo(() => {
    const map = new Map()
    for (let w = 0; w <= 6; w++) map.set(w, new Set())
    slotsForCourt.forEach(s => {
      const w = Number(s.weekday)
      const h = timeToHour(s.start_time)
      if (h != null) map.get(w)?.add(h)
    })
    return map
  }, [slotsForCourt])

  // weekdays involucrados en el rango de fechas
  const weekdaysInRange = useMemo(() => {
    if (!form.start_date || !form.end_date) return []
    return eachDate(form.start_date, form.end_date).map(d => d.getDay()) // 0..6
  }, [form.start_date, form.end_date])

  // horas inicio válidas: deben existir como startHour en TODOS los weekdays del rango
  const validStartHours = useMemo(() => {
    if (!form.court_id || weekdaysInRange.length === 0) return new Set()
    // intersección de sets por weekday
    const uniqueWeekdays = Array.from(new Set(weekdaysInRange))
    let acc = null
    uniqueWeekdays.forEach(w => {
      const set = availableStartByWeekday.get(w) || new Set()
      if (acc === null) acc = new Set(set)
      else acc = new Set([...acc].filter(h => set.has(h)))
    })
    return acc || new Set()
  }, [form.court_id, weekdaysInRange, availableStartByWeekday])

  const disabledStartHours = useMemo(() => {
    // deshabilitamos las que NO estén en validStartHours (0..23)
    const dis = []
    for (let h = 0; h <= 23; h++) {
      if (!validStartHours.has(h)) dis.push(h)
    }
    return dis
  })

  const disabledEndHours = useMemo(() => {
    // endHour debe ser > startHour y además cada hora del rango debe existir por weekday
    // Para UX: si no hay start_hour, no deshabilitamos.
    const dis = []
    for (let end = 1; end <= 24; end++) {
      if (form.start_hour == null) continue
      if (end <= form.start_hour) {
        dis.push(end)
        continue
      }
      // validar que para todos los weekdays existan todas las horas [start, end)
      const uniqueWeekdays = Array.from(new Set(weekdaysInRange))
      let ok = true
      for (const w of uniqueWeekdays) {
        const set = availableStartByWeekday.get(w) || new Set()
        for (let h = form.start_hour; h < end; h++) {
          if (!set.has(h)) {
            ok = false
            break
          }
        }
        if (!ok) break
      }
      if (!ok) dis.push(end)
    }
    return dis
  }, [form.start_hour, weekdaysInRange, availableStartByWeekday])

  useEffect(() => {
    // si cambian fechas/cancha y el start/end ya no son válidos, limpiamos
    if (form.start_hour != null && disabledStartHours.includes(form.start_hour)) {
      setForm(p => ({ ...p, start_hour: null, end_hour: null }))
    }
    if (form.end_hour != null && disabledEndHours.includes(form.end_hour)) {
      setForm(p => ({ ...p, end_hour: null }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.court_id, form.start_date, form.end_date, form.sport])

  const submit = async e => {
    e.preventDefault()
    setError(null)

    if (!form.court_id) {
      setError('Debés seleccionar una cancha.')
      return
    }
    if (!form.start_date || !form.end_date) {
      setError('Debés indicar fecha de inicio y fin.')
      return
    }
    if (form.end_date < form.start_date) {
      setError('La fecha de fin no puede ser menor a la de inicio.')
      return
    }
    if (form.start_hour == null || form.end_hour == null) {
      setError('Debés indicar hora de inicio y fin del torneo.')
      return
    }
    if (form.end_hour <= form.start_hour) {
      setError('La hora fin debe ser mayor a la hora inicio.')
      return
    }

    try {
      setSaving(true)
      await api.post('tournament_create_provider', {
        name: form.name,
        sport: form.sport,
        description: form.description,
        rules: form.rules,
        prizes: form.prizes,
        venue_info: form.venue_info,
        start_date: form.start_date,
        end_date: form.end_date,
        start_time: hourToTime(form.start_hour),
        end_time: hourToTime(form.end_hour),
        court_id: Number(form.court_id),
        max_teams: Number(form.max_teams),
        min_players_per_team: Number(form.min_players_per_team),
        max_players_per_team: Number(form.max_players_per_team),
        registration_fee: Number(form.registration_fee),
      })
      navigate('/provider/tournaments')
    } catch (err) {
      setError(err.message || 'No se pudo crear el torneo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Crear torneo</h1>

      <div className="card">
        {error && <p style={{ color: 'red' }}>{error}</p>}

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
              onChange={e => setForm(p => ({ ...p, court_id: e.target.value, start_hour: null, end_hour: null }))}
              disabled={loadingCourts}
              required>
              <option value="">{loadingCourts ? 'Cargando canchas...' : 'Elegí una cancha'}</option>
              {courtsForSport.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.internal_location ? `(${c.internal_location})` : ''}
                </option>
              ))}
            </select>
            {!loadingCourts && courtsForSport.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
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
              onChange={e => setForm(p => ({ ...p, start_date: e.target.value, start_hour: null, end_hour: null }))}
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
              onChange={e => setForm(p => ({ ...p, end_date: e.target.value, start_hour: null, end_hour: null }))}
              required
            />
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field-label">Horario del torneo</label>
            {!form.court_id ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Primero seleccioná una cancha para conocer sus horarios disponibles.
              </div>
            ) : weekdaysInRange.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Seleccioná las fechas para calcular horas válidas.
              </div>
            ) : (
              <HourRangePicker
                startHour={form.start_hour}
                endHour={form.end_hour}
                onChangeStart={h => setForm(p => ({ ...p, start_hour: h, end_hour: null }))}
                onChangeEnd={h => setForm(p => ({ ...p, end_hour: h }))}
                minStart={0}
                maxStart={23}
                minEnd={1}
                maxEnd={24}
                disabledStartHours={disabledStartHours}
                disabledEndHours={disabledEndHours}
                helper="Las horas no disponibles aparecen deshabilitadas. El backend vuelve a validar y avisa si hay conflicto con reservas."
              />
            )}
          </div>

          <div className="field">
            <label className="field-label">Máx. equipos</label>
            <select className="field-select" name="max_teams" value={form.max_teams} onChange={handle} required>
              <option value={4}>4 equipos</option>
              <option value={8}>8 equipos</option>
              <option value={16}>16 equipos</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label">Jugadores mínimos por equipo</label>
            <input
              type="number"
              min="1"
              className="field-input"
              name="min_players_per_team"
              value={form.min_players_per_team}
              onChange={handle}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Jugadores máximos por equipo</label>
            <input
              type="number"
              min={form.min_players_per_team || 1}
              className="field-input"
              name="max_players_per_team"
              value={form.max_players_per_team}
              onChange={handle}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Costo inscripción</label>
            <input
              type="number"
              min="0"
              className="field-input"
              name="registration_fee"
              value={form.registration_fee}
              onChange={handle}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Descripción</label>
            <textarea
              className="field-textarea"
              name="description"
              value={form.description}
              onChange={handle}></textarea>
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
            {saving ? 'Guardando...' : 'Crear torneo'}
          </button>
        </form>
      </div>
    </div>
  )
}
