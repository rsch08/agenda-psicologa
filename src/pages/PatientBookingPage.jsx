import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SlotPicker from '../components/SlotPicker.jsx'
import BookingForm from '../components/BookingForm.jsx'
import WelcomeMessage from '../components/WelcomeMessage.jsx'
import { formatSlotDateTime } from '../utils/format.js'
import { groupSlotsByDay } from '../utils/candidateSlots.js'

export default function PatientBookingPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [data, setData] = useState(null)

  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/patient/${token}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar tu link.')
      setData(json)
      setShowPicker(!json.appointment)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitBooking(offeredSlotId, { name, email }) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/patient/${token}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offered_slot_id: offeredSlotId, name, email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo agendar la cita.')
      setData((prev) => ({ ...prev, appointment: json.appointment }))
      setSelectedSlot(null)
      setShowPicker(false)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Si ya tiene una cita confirmada, cambiar de horario reagenda directo con
  // el mismo nombre/correo que ya dio — no hace falta volver a pedírselo.
  function handleSlotClick(slot) {
    if (submitting) return
    setSubmitError(null)
    if (data.appointment) {
      submitBooking(slot.id, {
        name: data.appointment.patient_name,
        email: data.appointment.patient_email,
      })
    } else {
      setSelectedSlot(slot)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Cargando…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    )
  }

  const days = groupSlotsByDay(
    data.slots.map((s) => ({ startISO: s.start_time, endISO: s.end_time, id: s.id })),
    data.timezone,
  )

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">
            Hola {data.patient_name}
            {data.psychologist_name
              ? `, agenda tu sesión con ${data.psychologist_name}`
              : ', agenda tu sesión'}
          </h1>
        </header>

        {data.appointment && (
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <p className="text-emerald-700 font-medium mb-1">¡Cita confirmada!</p>
            <p className="text-sm text-slate-600 capitalize mb-2">
              {formatSlotDateTime(data.appointment.start_time, data.timezone)}
            </p>
            <p className="text-xs text-slate-500 mb-3">Revisa tu correo para más detalles.</p>
            {submitError && <p className="text-sm text-red-600 mb-2">{submitError}</p>}
            {!showPicker && (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="text-sm text-indigo-600 hover:underline"
              >
                ¿Te equivocaste de horario? Elige otro aquí
              </button>
            )}
          </div>
        )}

        {showPicker && <WelcomeMessage />}

        {showPicker && (
          <div className="bg-white rounded-xl shadow p-5">
            {submitting && data.appointment && (
              <p className="text-sm text-slate-500 mb-3">Agendando…</p>
            )}
            <SlotPicker
              days={days}
              timezone={data.timezone}
              selectedISO={selectedSlot?.startISO}
              onSelect={handleSlotClick}
            />
          </div>
        )}
      </div>

      {selectedSlot && (
        <BookingForm
          slot={selectedSlot}
          timezone={data.timezone}
          submitting={submitting}
          error={submitError}
          initialName={data.patient_name}
          onCancel={() => {
            setSelectedSlot(null)
            setSubmitError(null)
          }}
          onConfirm={({ name, email }) => submitBooking(selectedSlot.id, { name, email })}
        />
      )}
    </div>
  )
}
