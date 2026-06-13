// TODO: wire to n8n webhooks
// POST /webhook/twin/lead-scan    → startLeadScan
// GET  /webhook/twin/today-leads  → getTodayLeads
// GET  /webhook/twin/best-leads   → getBestLeads

export async function startLeadScan(branche, ort, limit = 20) {
  // TODO: fetch('/api/twin/lead-scan', { method: 'POST', body: JSON.stringify({ branche, ort, limit }) })
  return { started: true, branche, ort, limit, message: `Scan für ${branche} in ${ort} gestartet.` }
}

export async function getTodayLeads(minScore = 0) {
  // TODO: fetch(`/api/twin/today-leads?min_score=${minScore}`)
  return { leads: [], count: 0, date: new Date().toISOString().slice(0, 10) }
}

export async function getBestLeads(limit = 5, minScore = 70, city = null) {
  // TODO: fetch(`/api/twin/best-leads?limit=${limit}&min_score=${minScore}${city ? `&city=${city}` : ''}`)
  return { leads: [], count: 0 }
}
