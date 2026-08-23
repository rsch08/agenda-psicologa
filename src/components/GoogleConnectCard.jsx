export default function GoogleConnectCard({ status, onDisconnect, disconnecting }) {
  return (
    <div className="bg-paper-2 border border-line rounded-sm p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
        Google Calendar
      </h2>
      {status?.connected ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-thread">
            Conectado como <span className="font-medium">{status.connected_email}</span>
          </p>
          <div className="flex items-center gap-3">
            <a href="/api/google-auth" className="text-sm text-ink hover:text-thread">
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
          <p className="text-sm text-muted">
            No conectado — todavía no puedes ver tu calendario real ni ofrecer horarios.
          </p>
          <a
            href="/api/google-auth"
            className="inline-flex items-center px-3 py-2 rounded-sm bg-thread text-paper-2 font-mono text-sm tracking-wide hover:bg-ink"
          >
            Conectar con Google
          </a>
        </div>
      )}
    </div>
  )
}
