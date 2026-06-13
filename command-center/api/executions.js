// Vercel serverless proxy for n8n executions API
// Avoids CORS issues + keeps API key server-side
export default async function handler(req, res) {
  const N8N_BASE = process.env.N8N_BASE_URL
  const N8N_KEY  = process.env.N8N_API_KEY

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!N8N_BASE || !N8N_KEY) {
    return res.status(200).json({ data: [], _error: 'n8n not configured (set N8N_BASE_URL + N8N_API_KEY in Vercel env)' })
  }

  const limit      = req.query.limit || 30
  const workflowId = req.query.workflowId || ''
  let url = `${N8N_BASE}/api/v1/executions?limit=${limit}&includeData=false`
  if (workflowId) url += `&workflowId=${workflowId}`

  try {
    const r = await fetch(url, { headers: { 'X-N8N-API-KEY': N8N_KEY } })
    if (!r.ok) return res.status(200).json({ data: [], _error: `n8n ${r.status}` })
    const data = await r.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(data)
  } catch (e) {
    return res.status(200).json({ data: [], _error: e.message })
  }
}
