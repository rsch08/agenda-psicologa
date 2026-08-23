import { useState } from 'react'
import { formatSlotDateTime } from '../utils/format.js'
import { cleanPersonName } from '../utils/name.js'

export default function BookingForm({
  slot,
  timezone,
  onCancel,
  onConfirm,
  submitting,
  error,
  initialName = '',
}) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm({ name: cleanPersonName(name), email: email.trim() })
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-10">
      <div className="bg-paper border border-line rounded-sm shadow-lg max-w-md w-full p-6">
        <h2 className="font-display font-medium text-lg text-ink mb-1">Confirmar tu sesión</h2>
        <p className="text-sm text-muted capitalize mb-4">
          {formatSlotDateTime(slot.startISO, timezone)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border border-line bg-paper-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-thread"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Correo</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-line bg-paper-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-thread"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-sm border border-line py-2 font-mono text-sm tracking-wide text-ink hover:bg-paper-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-sm bg-thread py-2 font-mono text-sm tracking-wide text-paper-2 hover:bg-ink disabled:opacity-60"
            >
              {submitting ? 'Agendando…' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
