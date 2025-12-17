import HourSelect from './HourSelect'
import { hourLabel } from './timeUtils'

export default function HourRangeSelect({
  startHour,
  endHour,
  onChangeStart,
  onChangeEnd,
  minStart = 0,
  maxStart = 23,
  minEnd = 1,
  maxEnd = 24,
  disabledStartHours = [],
  disabledEndHours = [],
  helper,
}) {
  return (
    <div className="form-grid">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <HourSelect
          label="Hora inicio"
          value={startHour ?? ''}
          onChange={onChangeStart}
          min={minStart}
          max={maxStart}
          include24={false}
          disabledHours={disabledStartHours}
        />
        <HourSelect
          label="Hora fin"
          value={endHour ?? ''}
          onChange={onChangeEnd}
          min={minEnd}
          max={maxEnd === 24 ? 23 : maxEnd}
          include24={maxEnd === 24}
          disabledHours={disabledEndHours}
        />
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {startHour == null || endHour == null
          ? 'Elegí un rango (en horas en punto).'
          : `Rango: ${hourLabel(startHour)} → ${hourLabel(endHour)} (${Math.max(0, endHour - startHour)} hora/s)`}
      </div>

      {helper ? <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{helper}</div> : null}
    </div>
  )
}
