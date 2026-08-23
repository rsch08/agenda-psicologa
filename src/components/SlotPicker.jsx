import { formatDayLabel, formatSlotTime } from '../utils/format.js'

// Muestra TODOS los días con horarios disponibles de una sola vista —
// sin tener que hacer clic día por día, como en el embed de correo de
// Calendly.
export default function SlotPicker({ days, timezone, onSelect, selectedISO }) {
  if (days.length === 0) {
    return (
      <p className="text-muted text-sm py-6">
        No hay horarios disponibles por ahora. Vuelve a revisar más tarde.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <div key={day.date}>
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted capitalize mb-2">
            {formatDayLabel(day.date)}
          </h3>
          <div className="flex flex-wrap gap-2">
            {day.slots.map((slot) => (
              <button
                key={slot.startISO}
                type="button"
                onClick={() => onSelect(slot)}
                className={`px-3 py-2 rounded-sm border font-mono text-sm transition ${
                  selectedISO === slot.startISO
                    ? 'bg-thread border-thread text-paper-2'
                    : 'border-line text-ink hover:border-thread hover:text-thread'
                }`}
              >
                {formatSlotTime(slot.startISO, timezone)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
