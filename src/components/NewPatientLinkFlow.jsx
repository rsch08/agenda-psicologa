import { useState } from 'react'
import CalendarWidget from './CalendarWidget.jsx'
import CopyToWhatsAppButton from './CopyToWhatsAppButton.jsx'
import { adminFetch } from '../utils/adminApi.js'
import { groupSlotsByDay } from '../utils/candidateSlots.js'
import { buildPatientPackageWhatsAppText } from '../utils/whatsapp.js'

export default function NewPatientLinkFlow({ settings, onDone, onCancel }) {
  const [step, setStep] = useState('name') // name -> widget -> share
  const [patientName, setPatientName] = useState('')
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
        body: JSON.stringify({ patient_name: patientName.trim(), slots: selected }),
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
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-10">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
        {step === 'name' && (
          <>
            <h2 className="text-lg font-semibold mb-1">Nuevo horario</h2>
            <p className="text-sm text-slate-500 mb-4">¿Para qué paciente es?</p>
            <input
              autoFocus
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nombre del paciente"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!patientName.trim()}
                onClick={() => setStep('widget')}
                className="flex-1 rounded-lg bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {step === 'widget' && (
          <>
            <h2 className="text-lg font-semibold mb-1">Elige los horarios para {patientName}</h2>
            <p className="text-sm text-slate-500 mb-3">
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
              <p className="text-sm text-slate-500">{selected.length} seleccionados</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selected.length === 0 || creating}
                  onClick={handleCreate}
                  className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'share' && result && (
          <>
            <h2 className="text-lg font-semibold mb-1">Listo — link para {patientName}</h2>
            <p className="text-sm text-slate-500 mb-3">Compártelo directo, no necesita contraseña.</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm break-all mb-4">
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
                psychologistName: settings?.psychologist_name,
                url: result.url,
              })}
              label="Copiar mensaje"
            />
            <button
              type="button"
              onClick={onDone}
              className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50 mt-4"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
