import { formatSlotDateTime } from '../utils/format.js'
import CopyToWhatsAppButton from './CopyToWhatsAppButton.jsx'

export default function PatientLinksList({ links, timezone }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Horarios enviados</h2>
      {links.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no le has mandado horarios a nadie.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {links.map((link) => {
            const appointment = (link.appointments || []).find((a) => a.status === 'confirmed')
            const url = `${baseUrl}/p/${link.token}`
            return (
              <li key={link.id} className="py-3 text-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium">{link.patient_name}</p>
                    <p className="text-slate-500">
                      {(link.offered_slots || []).length} horario(s) ofrecidos
                    </p>
                  </div>
                  {appointment ? (
                    <span className="text-emerald-700 capitalize text-right">
                      Agendó: {formatSlotDateTime(appointment.start_time, timezone)}
                    </span>
                  ) : (
                    <span className="text-slate-400">Pendiente</span>
                  )}
                </div>
                <div className="mt-2">
                  <CopyToWhatsAppButton text={url} label="Copiar link" />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
