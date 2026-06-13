const BASE = import.meta.env.VITE_N8N_BASE_URL || ''

const WEBHOOKS = {
  1: import.meta.env.VITE_N8N_AGENT1_WEBHOOK || '',
  2: import.meta.env.VITE_N8N_AGENT2_WEBHOOK || '',
  3: import.meta.env.VITE_N8N_AGENT3_WEBHOOK || '',
  4: import.meta.env.VITE_N8N_AGENT4_WEBHOOK || '',
  5: import.meta.env.VITE_N8N_AGENT5_WEBHOOK || '',
  6: import.meta.env.VITE_N8N_AGENT6_WEBHOOK || '',
  7: import.meta.env.VITE_N8N_AGENT7_WEBHOOK || '',
}

export const WORKFLOW_AGENT_MAP = {
  '8K3BEqjsfl21BAS9': 1,
  '04XC92MJvaYKtjbi': 2,
  'peVGxOTGY1v2D12B': 3,
  '4E80rzbb97rCGx66': 4,
  'HiIcsFHR3OAQr15m': 5,
  '4VMphtkSDdcpZTNU': 6,
  'nTVZLymUEYRt1W86': 7,
}

// New agent names (A1-A6 architecture). A7 webhook is reused by A2 internally.
export const AGENT_NAMES = {
  1: 'Lead Qualifier',
  2: 'Claude Code Builder',
  3: 'Polish Agent',
  4: 'Human Writer',
  5: 'Pricing Agent',
  6: 'Fact Checker',
  7: 'Claude Code Builder', // internal — A7 webhook, shown as A2 in UI
}

export function isWebhookConfigured(agentId) {
  return !!WEBHOOKS[agentId]
}

export async function triggerAgent(agentId, params = {}) {
  const url = WEBHOOKS[agentId]
  if (!url) throw new Error(`Webhook für Agent ${agentId} nicht konfiguriert`)
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
  return r.json().catch(() => ({ ok: true }))
}

export async function triggerAgent2WithUrl(websiteUrl) {
  return triggerAgent(2, { website: websiteUrl, source: 'manual_url' })
}

export async function triggerPipelineWithGoogleUrl(googleUrl) {
  return triggerAgent(1, { google_url: googleUrl, source: 'google_maps' })
}

export async function triggerBuild(leadId, extra = {}) {
  return triggerAgent(6, { lead_id: leadId, ...extra })
}

export async function triggerWebsiteBuild(leadId, extra = {}) {
  return triggerAgent(7, { lead_id: leadId, ...extra })
}

// ─── A2 VPS Builder ─────────────────────────────────────────────────────────
// Triggert den autonomen VPS-Runner über n8n: git pull → Claude Code → npm build → vercel deploy
// Antwort enthält demo_url direkt — kein Polling nötig.
const VPS_BUILDER_WEBHOOK =
  import.meta.env.VITE_N8N_AGENT2_VPS_WEBHOOK ||
  `${(BASE || 'https://n8n.srv1736252.hstgr.cloud').replace(/\/$/, '')}/webhook/agent2-build`

// ─── A3 Polish Agent ─────────────────────────────────────────────────────────
const A3_POLISH_WEBHOOK =
  import.meta.env.VITE_N8N_AGENT3_POLISH_WEBHOOK ||
  `${(BASE || 'https://n8n.srv1736252.hstgr.cloud').replace(/\/$/, '')}/webhook/agent3-polish`

export async function triggerPolish(lead, polishOptions = {}) {
  if (!lead?.lead_id) throw new Error('lead_id ist Pflicht')
  const payload = {
    lead_id:       lead.lead_id,
    business_name: lead.business_name || lead.name,
    cuisine:       lead.cuisine || '',
    atmosphere:    lead.atmosphere || '',
    demo_url:      lead.demo_url || lead.build?.demo_url || '',
    site_slug:     lead.site_slug || '',
    polish_options: {
      level: polishOptions.level || 'normal', // light | normal | deep
      focus: polishOptions.focus || 'images', // images | typography | color | layout | all
    },
  }
  const r = await fetch(A3_POLISH_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`A3 HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

// ─── A4 Human Writer ─────────────────────────────────────────────────────────
const A4_WRITER_WEBHOOK =
  import.meta.env.VITE_N8N_AGENT4_WRITE_WEBHOOK ||
  `${(BASE || 'https://n8n.srv1736252.hstgr.cloud').replace(/\/$/, '')}/webhook/agent4-write`

export async function triggerWriter(lead, writerOptions = {}) {
  if (!lead?.lead_id) throw new Error('lead_id ist Pflicht')
  const payload = {
    lead_id:        lead.lead_id,
    business_name:  lead.business_name || lead.name,
    address:        lead.address || '',
    website_url:    lead.website_url || lead.website || '',
    google_rating:  lead.google_rating || lead.rating || '',
    google_reviews_count: lead.google_reviews_count || lead.reviews || '',
    special_note:   lead.special_note || '',
    demo_url:       lead.demo_url || lead.build?.demo_url || '',
    channel:        writerOptions.channel || 'email',  // email | sms | whatsapp | call_script
    context:        writerOptions.context || 'cold_outreach',
    tone:           writerOptions.tone    || 'direct',
  }
  const r = await fetch(A4_WRITER_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`A4 HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

// ─── A5 Pricing Agent ─────────────────────────────────────────────────────────
const A5_PRICING_WEBHOOK =
  import.meta.env.VITE_N8N_AGENT5_PRICE_WEBHOOK ||
  `${(BASE || 'https://n8n.srv1736252.hstgr.cloud').replace(/\/$/, '')}/webhook/agent5-price`

export async function triggerPricing(lead) {
  if (!lead?.lead_id) throw new Error('lead_id ist Pflicht')
  const payload = {
    lead_id:        lead.lead_id,
    business_name:  lead.business_name || lead.name,
    google_rating:  lead.google_rating || lead.rating || '',
    google_reviews_count: lead.google_reviews_count || lead.reviews || '',
    score:          lead.score || lead.audit_score || 0,
    price_range:    lead.price_range || lead.priceRange || '€€',
    cuisine:        lead.cuisine || '',
  }
  const r = await fetch(A5_PRICING_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`A5 HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

// ─── A6 Fact Checker ─────────────────────────────────────────────────────────
const A6_FACT_WEBHOOK =
  import.meta.env.VITE_N8N_AGENT6_CHECK_WEBHOOK ||
  `${(BASE || 'https://n8n.srv1736252.hstgr.cloud').replace(/\/$/, '')}/webhook/agent6-check`

export async function triggerFactCheck(lead) {
  if (!lead?.lead_id) throw new Error('lead_id ist Pflicht')
  const payload = {
    lead_id:       lead.lead_id,
    business_name: lead.business_name || lead.name,
    website_url:   lead.website_url || lead.website || '',
    phone:         lead.phone || '',
    email:         lead.email || '',
    address:       lead.address || '',
  }
  const r = await fetch(A6_FACT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`A6 HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function triggerVpsBuild(lead, buildOptions = {}) {
  if (!lead?.lead_id || !lead?.business_name) {
    throw new Error('lead_id und business_name sind Pflicht')
  }

  const payload = {
    lead_id:        lead.lead_id,
    business_name:  lead.business_name || lead.name,
    address:        lead.address || '',
    phone:          lead.phone || '',
    website_url:    lead.website_url || lead.website || '',
    cuisine:        lead.cuisine || '',
    atmosphere:     lead.atmosphere || '',
    opening_hours:  lead.opening_hours || lead.hours || '',
    google_rating:  lead.google_rating || lead.rating || '',
    google_reviews_count: lead.google_reviews_count || lead.reviews || '',
    specials:       lead.specials || '',
    price_range:    lead.price_range || lead.priceRange || '€€',
    build_options: {
      style:          buildOptions.style          || 'restaurant-premium',
      colorDirection: buildOptions.colorDirection || 'auto',
      quality:        buildOptions.quality        || 'premium',
      imageSource:    buildOptions.imageSource    || 'unsplash',
    },
    images:         lead.images || [],
  }

  const r = await fetch(VPS_BUILDER_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!r.ok) throw new Error(`Runner HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function triggerPipelineFromUrl(websiteUrl) {
  const url = WEBHOOKS[2]
  if (!url) throw new Error('Agent 2 Webhook nicht konfiguriert')
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ website: websiteUrl, source: 'manual_url' }),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
  return r.json().catch(() => ({ ok: true }))
}

export async function stopExecution(id) {
  const apiKey = import.meta.env.VITE_N8N_API_KEY
  if (!BASE || !apiKey) throw new Error('N8N nicht konfiguriert')
  const r = await fetch(`${BASE}/api/v1/executions/${id}/stop`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': apiKey },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json().catch(() => ({ ok: true }))
}

export async function fetchExecutions(limit = 30) {
  try {
    const r = await fetch(`/api/executions?limit=${limit}`)
    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data?.data)) return data.data
    }
  } catch (_) { /* proxy not available in dev */ }

  const apiKey = import.meta.env.VITE_N8N_API_KEY
  if (!BASE || !apiKey) return []
  try {
    const r = await fetch(`${BASE}/api/v1/executions?limit=${limit}&includeData=false`, {
      headers: { 'X-N8N-API-KEY': apiKey },
    })
    if (!r.ok) return []
    const { data } = await r.json()
    return data || []
  } catch { return [] }
}
