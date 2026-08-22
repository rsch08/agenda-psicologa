import { useState } from 'react'
import { formatSlotDateTime } from '../utils/format.js'

export default function BookingForm({ slot, timezone, onCancel, onConfirm, submitting, error }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm({ name: name.trim(), email: email.trim(), phone: phone.trim() })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-10">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-1">Confirmar tu sesión</h2>
        <p className="text-sm text-slate-600 capitalize mb-4">
          {formatSlotDateTime(slot.startISO, timezone)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Teléfono (opcional)
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Agendando…' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
