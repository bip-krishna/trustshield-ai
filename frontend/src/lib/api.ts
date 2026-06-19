const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || error.message || 'Request failed')
  }

  return res.json()
}

export const api = {
  auth: {
    register: (data: any) => fetchAPI('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => fetchAPI('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchAPI('/api/auth/me'),
  },
  otp: {
    send: (email: string) => fetchAPI('/api/otp/send', { method: 'POST', body: JSON.stringify({ email, otp_code: '' }) }),
    verify: (email: string, otp_code: string) => fetchAPI('/api/otp/verify', { method: 'POST', body: JSON.stringify({ email, otp_code }) }),
    resend: (email: string) => fetchAPI('/api/otp/resend', { method: 'POST', body: JSON.stringify({ email, otp_code: '' }) }),
  },
  face: {
    verify: (email: string, face_embedding: string) => fetchAPI('/api/face/verify', { method: 'POST', body: JSON.stringify({ email, face_embedding }) }),
    enroll: (email: string, face_embedding: string) => fetchAPI('/api/face/enroll', { method: 'POST', body: JSON.stringify({ email, face_embedding }) }),
  },
  transactions: {
    create: (data: any) => fetchAPI('/api/transactions/create', { method: 'POST', body: JSON.stringify(data) }),
    history: () => fetchAPI('/api/transactions/history'),
  },
  devices: {
    list: () => fetchAPI('/api/devices/'),
    toggleTrust: (id: number) => fetchAPI(`/api/devices/${id}/trust`, { method: 'POST' }),
    remove: (id: number) => fetchAPI(`/api/devices/${id}`, { method: 'DELETE' }),
  },
  users: {
    dashboard: () => fetchAPI('/api/users/dashboard'),
  },
  risk: {
    score: () => fetchAPI('/api/risk/score'),
    events: () => fetchAPI('/api/risk/events'),
  },
  admin: {
    users: () => fetchAPI('/api/admin/users'),
    toggleUserStatus: (id: number) => fetchAPI(`/api/admin/users/${id}/toggle-status`, { method: 'PUT' }),
    deleteUser: (id: number) => fetchAPI(`/api/admin/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id: number) => fetchAPI(`/api/admin/users/${id}/reset-password`, { method: 'POST' }),
    devices: () => fetchAPI('/api/admin/devices'),
    toggleDeviceTrust: (id: number) => fetchAPI(`/api/admin/devices/${id}/toggle-trust`, { method: 'PUT' }),
    deleteDevice: (id: number) => fetchAPI(`/api/admin/devices/${id}`, { method: 'DELETE' }),
    monitoring: () => fetchAPI('/api/admin/monitoring'),
    audit: () => fetchAPI('/api/admin/audit'),
    analytics: () => fetchAPI('/api/admin/analytics'),
  },
}
