// Vercel proxy → VPS Runner status endpoint
// Frontend kann CORS-frei den Build-Status pollen.
// Bearer-Secret bleibt server-side.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')     return res.status(405).json({ error: 'GET only' })

  const runId = req.query.run_id
  if (!runId) return res.status(400).json({ error: 'run_id required' })

  const SECRET = process.env.RUNNER_SECRET || process.env.VPS_RUNNER_SECRET
  if (!SECRET) return res.status(500).json({ error: 'RUNNER_SECRET not configured on server' })

  const RUNNER_BASE = process.env.RUNNER_BASE_URL || 'http://76.13.11.80:8787'

  try {
    const r = await fetch(`${RUNNER_BASE}/run-a2/${encodeURIComponent(runId)}/status`, {
      headers: { 'Authorization': `Bearer ${SECRET}` },
    })
    const data = await r.json()
    return res.status(r.status).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'runner unreachable', detail: err.message })
  }
}
