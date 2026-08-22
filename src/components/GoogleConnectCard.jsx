export default function GoogleConnectCard({ status, onDisconnect, disconnecting }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-2">Google Calendar</h2>
      {status?.connected ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-emerald-700">
            Conectado como <span className="font-medium">{status.connected_email}</span>
          </p>
          <div className="flex items-center gap-3">
            <a href="/api/google-auth" className="text-sm text-indigo-600 hover:underline">
              Reconectar
            </a>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnecting}
              className="text-sm text-red-600 hover:underline disabled:opacity-60"
            >
              Desconectar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-slate-500">
            No conectado — todavía no puedes ver tu calendario real ni ofrecer horarios.
          </p>
          <a
            href="/api/google-auth"
            className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Conectar con Google
          </a>
        </div>
      )}
    </div>
  )
}
