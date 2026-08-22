export async function adminFetch(path, passcode, options = {}) {
  const headers = { ...(options.headers || {}), 'x-admin-passcode': passcode }
  if (options.body) headers['Content-Type'] = 'application/json'

  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}
