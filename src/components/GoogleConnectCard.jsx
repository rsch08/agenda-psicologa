export default function GoogleConnectCard({ status, passcode, onDisconnect, disconnecting }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-2">Google Calendar</h2>
      {status?.connected ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-emerald-700">
            Conectado como <span className="font-medium">{status.connected_email}</span>
          </p>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="text-sm text-red-600 hover:underline disabled:opacity-60"
          >
            Desconectar
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-slate-500">
            No conectado — los horarios que se muestran no se cruzan con tu calendario real.
          </p>
          <a
            href={`/api/google-auth?passcode=${encodeURIComponent(passcode)}`}
            className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Conectar con Google
          </a>
        </div>
      )}
    </div>
  )
}
