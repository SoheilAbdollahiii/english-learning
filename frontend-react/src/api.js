// Centralized API transport and JWT refresh handling.
// Set VITE_API_BASE_URL when the frontend and API are deployed on different origins.
// In production, an empty base uses same-origin routes; local development targets Django.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')).replace(/\/$/, '')

export const apiUrl = (path) => `${API_BASE}${path}`

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  let response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        const refreshRes = await fetch(apiUrl('/api/token/refresh/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (refreshRes.ok) {
          const data = await refreshRes.json()
          localStorage.setItem('access_token', data.access)
          headers['Authorization'] = `Bearer ${data.access}`
          response = await fetch(url, { ...options, headers })
        } else {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.reload()
        }
      } catch (err) {
        console.error('Token refresh failed', err)
      }
    } else {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.reload()
    }
  }

  return response
}
