import { formatSlotDateTime } from '../utils/format.js'

export default function AppointmentsList({ appointments, timezone }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Próximas citas</h2>
      {appointments.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay citas agendadas.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {appointments.map((a) => (
            <li key={a.id} className="py-2 text-sm flex justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium">{a.patient_name}</p>
                <p className="text-slate-500">
                  {a.patient_email}
                  {a.patient_phone ? ` · ${a.patient_phone}` : ''}
                </p>
              </div>
              <p className="text-slate-600 capitalize text-right">
                {formatSlotDateTime(a.start_time, timezone)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
