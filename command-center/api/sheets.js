// Vercel serverless proxy — avoids CORS when browser fetches n8n sheets webhook
export default async function handler(req, res) {
  const N8N_BASE = process.env.N8N_BASE_URL || process.env.VITE_N8N_BASE_URL

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!N8N_BASE) {
    return res.status(200).json({ data: [], _error: 'N8N_BASE_URL not configured' })
  }

  const tab = req.query.tab || 'LEADS'
  const url = `${N8N_BASE}/webhook/sheets-data?tab=${encodeURIComponent(tab)}`

  try {
    const r = await fetch(url)
    if (!r.ok) return res.status(200).json({ data: [], _error: `n8n ${r.status}` })
    const data = await r.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(data)
  } catch (e) {
    return res.status(200).json({ data: [], _error: e.message })
  }
}
