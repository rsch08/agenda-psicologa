import { useEffect, useState } from 'react'
import SlotPicker from '../components/SlotPicker.jsx'
import BookingForm from '../components/BookingForm.jsx'
import CopyToWhatsAppButton from '../components/CopyToWhatsAppButton.jsx'
import { formatSlotDateTime } from '../utils/format.js'
import { buildAvailabilityWhatsAppText, buildConfirmationWhatsAppText } from '../utils/whatsapp.js'

export default function BookingPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [days, setDays] = useState([])
  const [settings, setSettings] = useState(null)

  const [selectedSlot, setSelectedSlot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [confirmed, setConfirmed] = useState(null)

  useEffect(() => {
    loadAvailability()
  }, [])

  async function loadAvailability() {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/availability')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar la disponibilidad.')
      setDays(data.days)
      setSettings(data.settings)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm({ name, email, phone }) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, startISO: selectedSlot.startISO }),
      })
      const data = await res.json()
      if (!res.ok) {
        // El horario se ocupó justo antes de confirmar: refrescamos la lista.
        if (res.status === 409) loadAvailability()
        throw new Error(data.error || 'No se pudo agendar la cita.')
      }
      setConfirmed({ ...data.appointment, patientName: name })
      setSelectedSlot(null)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const bookingUrl = typeof window !== 'undefined' ? window.location.href : ''

  if (confirmed) {
    const confirmationText = buildConfirmationWhatsAppText({
      startISO: confirmed.start_time,
      timezone: settings?.timezone,
      psychologistName: settings?.psychologist_name,
      patientName: confirmed.patientName,
    })

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-6 text-center">
          <div className="text-emerald-600 text-3xl mb-2">✓</div>
          <h1 className="text-lg font-semibold mb-1">¡Sesión agendada!</h1>
          <p className="text-sm text-slate-600 capitalize mb-4">
            {formatSlotDateTime(confirmed.start_time, settings?.timezone)}
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Te llegará una invitación de Google Calendar a tu correo con los detalles.
          </p>
          <CopyToWhatsAppButton text={confirmationText} label="Copiar confirmación" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">
            {settings?.psychologist_name
              ? `Agenda tu sesión con ${settings.psychologist_name}`
              : 'Agenda tu sesión'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Elige cualquiera de los horarios disponibles a continuación.
          </p>
        </header>

        {loading && <p className="text-sm text-slate-500">Cargando horarios…</p>}
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}

        {!loading && !loadError && (
          <>
            {days.length > 0 && (
              <div className="mb-6">
                <CopyToWhatsAppButton
                  text={buildAvailabilityWhatsAppText({
                    days,
                    timezone: settings?.timezone,
                    psychologistName: settings?.psychologist_name,
                    bookingUrl,
                  })}
                />
              </div>
            )}

            <div className="bg-white rounded-xl shadow p-5">
              <SlotPicker
                days={days}
                timezone={settings?.timezone}
                selectedISO={selectedSlot?.startISO}
                onSelect={(slot) => {
                  setSelectedSlot(slot)
                  setSubmitError(null)
                }}
              />
            </div>
          </>
        )}
      </div>

      {selectedSlot && (
        <BookingForm
          slot={selectedSlot}
          timezone={settings?.timezone}
          submitting={submitting}
          error={submitError}
          onCancel={() => {
            setSelectedSlot(null)
            setSubmitError(null)
          }}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
