import { formatSlotDateTime } from '../utils/format.js'
import CopyToWhatsAppButton from './CopyToWhatsAppButton.jsx'

export default function PatientLinksList({ links, timezone }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="bg-paper-2 border border-line rounded-sm p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
        Horarios enviados
      </h2>
      {links.length === 0 ? (
        <p className="text-sm text-muted">Todavía no le has mandado horarios a nadie.</p>
      ) : (
        <ul className="divide-y divide-line">
          {links.map((link) => {
            const appointment = (link.appointments || []).find((a) => a.status === 'confirmed')
            const url = `${baseUrl}/p/${link.token}`
            return (
              <li key={link.id} className="py-3 text-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium text-ink">
                      {link.patient_name}{' '}
                      <span className="font-mono text-[11px] uppercase tracking-wide text-thread">
                        {link.meeting_type}
                      </span>
                    </p>
                    <p className="text-muted">
                      {(link.offered_slots || []).length} horario(s) ofrecidos
                    </p>
                  </div>
                  {appointment ? (
                    <span className="text-thread capitalize text-right">
                      Agendó: {formatSlotDateTime(appointment.start_time, timezone)}
                    </span>
                  ) : (
                    <span className="text-muted">Pendiente</span>
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
