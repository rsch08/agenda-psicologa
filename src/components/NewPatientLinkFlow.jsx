import { useState } from 'react'
import CalendarWidget from './CalendarWidget.jsx'
import CopyToWhatsAppButton from './CopyToWhatsAppButton.jsx'
import { adminFetch } from '../utils/adminApi.js'
import { groupSlotsByDay } from '../utils/candidateSlots.js'
import { buildPatientPackageWhatsAppText } from '../utils/whatsapp.js'
import { cleanPersonName } from '../utils/name.js'

export default function NewPatientLinkFlow({ settings, onDone, onCancel }) {
  const [step, setStep] = useState('name') // name -> widget -> share
  const [patientName, setPatientName] = useState('')
  const [meetingType, setMeetingType] = useState('virtual')
  const [selected, setSelected] = useState([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { url }

  function toggleSlot(slot) {
    setSelected((prev) => {
      const exists = prev.some((s) => s.start_time === slot.start_time)
      if (exists) return prev.filter((s) => s.start_time !== slot.start_time)
      return [...prev, slot]
    })
  }

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const data = await adminFetch('/api/admin/patient-links', {
        method: 'POST',
        body: JSON.stringify({
          patient_name: cleanPersonName(patientName),
          slots: selected,
          meeting_type: meetingType,
        }),
      })
      setResult(data)
      setStep('share')
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-10">
      <div className="bg-paper border border-line rounded-sm shadow-lg max-w-lg w-full p-6">
        {step === 'name' && (
          <>
            <h2 className="font-display font-medium text-lg text-ink mb-1">Nuevo horario</h2>
            <p className="text-sm text-muted mb-4">¿Para qué paciente es?</p>
            <input
              autoFocus
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nombre del paciente"
              className="w-full rounded-sm border border-line bg-paper-2 px-3 py-2 text-sm text-ink mb-4 focus:outline-none focus:ring-1 focus:ring-thread"
            />

            <p className="text-sm text-muted mb-2">¿Presencial o virtual?</p>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMeetingType('presencial')}
                className={`flex-1 rounded-sm border py-2 font-mono text-sm tracking-wide ${
                  meetingType === 'presencial'
                    ? 'border-thread bg-tint1 text-thread'
                    : 'border-line text-muted hover:bg-paper-2'
                }`}
              >
                Presencial
              </button>
              <button
                type="button"
                onClick={() => setMeetingType('virtual')}
                className={`flex-1 rounded-sm border py-2 font-mono text-sm tracking-wide ${
                  meetingType === 'virtual'
                    ? 'border-thread bg-tint1 text-thread'
                    : 'border-line text-muted hover:bg-paper-2'
                }`}
              >
                Virtual
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-sm border border-line py-2 font-mono text-sm tracking-wide text-ink hover:bg-paper-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!patientName.trim()}
                onClick={() => {
                  setPatientName((n) => cleanPersonName(n))
                  setStep('widget')
                }}
                className="flex-1 rounded-sm bg-thread text-paper-2 font-mono text-sm tracking-wide py-2 hover:bg-ink disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {step === 'widget' && (
          <>
            <h2 className="font-display font-medium text-lg text-ink mb-1">
              Elige los horarios para {patientName}
            </h2>
            <p className="text-sm text-muted mb-3">
              Los tachados ya están ocupados en tu calendario. Haz clic en los que quieras ofrecerle.
            </p>
            <CalendarWidget
              timezone={settings?.timezone}
              durationMinutes={settings?.session_duration_minutes}
              selected={selected}
              onToggle={toggleSlot}
            />
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted">{selected.length} seleccionados</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-sm border border-line px-4 py-2 font-mono text-sm tracking-wide text-ink hover:bg-paper-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selected.length === 0 || creating}
                  onClick={handleCreate}
                  className="rounded-sm bg-thread text-paper-2 font-mono text-sm tracking-wide px-4 py-2 hover:bg-ink disabled:opacity-50"
                >
                  {creating ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'share' && result && (
          <>
            <h2 className="font-display font-medium text-lg text-ink mb-1">
              Listo — link para {patientName}
            </h2>
            <p className="text-sm text-muted mb-3">Compártelo directo, no necesita contraseña.</p>
            <div className="bg-paper-2 border border-line rounded-sm px-3 py-2 text-sm text-ink break-all mb-4">
              {result.url}
            </div>
            <CopyToWhatsAppButton
              text={buildPatientPackageWhatsAppText({
                patientName,
                days: groupSlotsByDay(
                  selected.map((s) => ({ startISO: s.start_time, endISO: s.end_time })),
                  settings?.timezone,
                ),
                timezone: settings?.timezone,
                url: result.url,
              })}
              label="Copiar mensaje"
            />
            <button
              type="button"
              onClick={onDone}
              className="w-full rounded-sm border border-line py-2 font-mono text-sm tracking-wide text-ink hover:bg-paper-2 mt-4"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
