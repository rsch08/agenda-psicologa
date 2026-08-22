import { useState } from 'react'

export default function PasscodeGate({ onSubmit, error, checking }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white rounded-xl shadow p-6 space-y-3">
        <h1 className="text-lg font-semibold">Panel de configuración</h1>
        <p className="text-sm text-slate-500">Ingresa el passcode para continuar.</p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={checking}
          className="w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {checking ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
