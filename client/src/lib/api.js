const API_BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error ${res.status}`)
  }
  return res.json()
}

// ---- Farms ----
export const api = {
  farms: {
    list: () => request('/farms'),
    get: (id) => request(`/farms/${id}`),
    create: (data) => request('/farms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/farms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    readings: (id, limit = 100) => request(`/farms/${id}/readings?limit=${limit}`),
    advisories: (id) => request(`/farms/${id}/advisories`),
    alerts: (id) => request(`/farms/${id}/alerts`),
    agentRuns: (id) => request(`/farms/${id}/agent-runs`),
  },

  readings: {
    create: (data) => request('/readings', { method: 'POST', body: JSON.stringify(data) }),
  },

  alerts: {
    resolve: (id) => request(`/alerts/${id}/resolve`, { method: 'PUT' }),
  },

  chat: {
    ask: (data) => request('/chat', { method: 'POST', body: JSON.stringify(data) }),
  },

  analytics: {
    riskExplanation: (farmId) => request(`/farms/${farmId}/risk/explanation`),
    forecast:        (farmId) => request(`/farms/${farmId}/forecast`),
    decisionTrace:   (farmId, readingId) => request(`/farms/${farmId}/decision-trace${readingId ? `?readingId=${readingId}` : ''}`),
    whatIf:          (farmId, scenario, language = 'en') => request(`/farms/${farmId}/what-if`, { method: 'POST', body: JSON.stringify({ scenario, language }) }),
    mapRisk:         () => request('/map/risk'),
    scenarios:       () => request('/what-if/scenarios'),
  },

  health: () => request('/health'),
}
