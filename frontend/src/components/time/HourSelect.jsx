import { hourLabel } from './timeUtils'

export default function HourSelect({
  label,
  value,
  onChange,
  min = 0,
  max = 23,
  include24 = false,
  disabledHours = [],
}) {
  const disabledSet = new Set((disabledHours || []).map(n => Number(n)))

  const hours = []
  for (let h = min; h <= max; h++) hours.push(h)
  if (include24 && max < 24) hours.push(24)

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <select
        className="field-select"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={e => {
          const v = e.target.value
          onChange(v === '' ? null : Number(v))
        }}>
        <option value="">Seleccioná…</option>
        {hours.map(h => (
          <option key={h} value={h} disabled={disabledSet.has(h)}>
            {hourLabel(h)}
          </option>
        ))}
      </select>
    </div>
  )
}
