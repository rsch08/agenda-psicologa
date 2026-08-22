export async function adminFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body) headers['Content-Type'] = 'application/json'

  const res = await fetch(path, { ...options, headers, credentials: 'same-origin' })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}
