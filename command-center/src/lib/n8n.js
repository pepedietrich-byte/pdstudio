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

// ─── BUILD Sheet Metadata Persistence ───────────────────────────────────────
// Schreibt demo_url + Datumsfelder persistent ins BUILD-Sheet.
// Wird automatisch nach jedem erfolgreichen A2 Build und A3 Polish aufgerufen,
// und manuell wenn der User in der Site-Karte "Metadaten speichern" klickt.
const BUILD_META_WEBHOOK =
  import.meta.env.VITE_N8N_BUILD_META_WEBHOOK ||
  `${(BASE || 'https://n8n.srv1736252.hstgr.cloud').replace(/\/$/, '')}/webhook/build-meta-write`

export async function updateBuildMetadata(leadId, fields = {}) {
  if (!leadId) throw new Error('lead_id ist Pflicht')
  const payload = {
    lead_id:       leadId,
    demo_url:      fields.demo_url || '',
    build_status:  fields.build_status || '',
    deploy_status: fields.deploy_status || '',
    site_dir:      fields.site_dir || '',
    built_at:      fields.built_at,
    polished_at:   fields.polished_at,
    deployed_at:   fields.deployed_at,
    run_id:        fields.run_id || '',
    source:        fields.source || 'ui',
    kind:          fields.kind || 'build',  // 'build' | 'polish' | 'manual'
  }
  // Strip undefined so the workflow defaults timestamps correctly
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

  const r = await fetch(BUILD_META_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`Meta-Write HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

export function isBuildMetaWriteAvailable() {
  return !!BUILD_META_WEBHOOK
}

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
      level: polishOptions.level || 'normal',
      focus: polishOptions.focus || 'images',
    },
  }
  const r = await fetch(A3_POLISH_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`A3 HTTP ${r.status}: ${await r.text()}`)
  const started = await r.json()

  // Async pattern — poll runner status if still running
  if (started.status === 'started' || started.status === 'running' || started.build_status === 'running') {
    const final = await pollRunnerStatus(started.run_id, polishOptions.onProgress)
    return {
      ...started,
      ...final,
      polished_url:  final.deploy_url || started.polished_url || '',
      polish_level:  started.polish_level,
      polish_focus:  started.polish_focus,
      run_id:        started.run_id,
      duration_s:    final.duration_seconds,
    }
  }

  return started
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

// Poll runner status via API proxy (no CORS issues)
async function pollRunnerStatus(runId, onProgress) {
  const PROXY = '/api/runner-status'  // Vercel proxy to VPS runner
  const start = Date.now()
  const TIMEOUT_MS = 25 * 60 * 1000  // 25 min worst case
  while (Date.now() - start < TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, 20000))  // poll every 20s
    try {
      const r = await fetch(`${PROXY}?run_id=${encodeURIComponent(runId)}`)
      if (!r.ok) continue
      const d = await r.json()
      onProgress?.(d)
      if (['success', 'failed', 'warning', 'timeout'].includes(d.status)) return d
    } catch { /* keep polling */ }
  }
  return { status: 'timeout', error: 'frontend poll timeout' }
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
      style:           buildOptions.style           || 'cinnabar',
      colorDirection:  buildOptions.colorDirection  || 'auto',
      quality:         buildOptions.quality         || 'premium',
      imageSource:     buildOptions.imageSource     || 'unsplash',
      reservation_mode: buildOptions.reservation_mode || 'reservation',
      style_prompt:    buildOptions.style_prompt    || '',
      // Stufe 3: Concept + Animation Block ans n8n weiterreichen
      concept_block:   buildOptions.concept_block   || '',
      animation_block: buildOptions.animation_block || '',
    },
    images:         lead.images || [],
    // ── Stufe 4: Premium-Build-Bridge ────────────────────────────────────
    // Wenn der Aufrufer den fertigen Prompt + Gate-Verdict mitgibt, dürfen
    // n8n + Runner ihn 1:1 durchreichen — der "alte" n8n-Prompt wird ignoriert.
    // Runner /run-a2 erwartet: prompt (Text) + metadata.gates_passed (boolean)
    final_prompt:           buildOptions.final_prompt           || '',
    prompt_builder_version: buildOptions.prompt_builder_version || '',
    gates_passed:           buildOptions.gates_passed === true,
    accepted_hero_url:      buildOptions.accepted_hero_url      || '',
    a5_concept_id:          buildOptions.a5_concept_id          || '',
    a6_quality_score:       buildOptions.a6_quality_score       || null,
    excluded_unsafe_facts:  buildOptions.excluded_unsafe_facts  || {},
    metadata: {
      gates_passed:           buildOptions.gates_passed === true,
      prompt_builder_version: buildOptions.prompt_builder_version || '',
      accepted_hero_url:      buildOptions.accepted_hero_url      || '',
      a6_quality_score:       buildOptions.a6_quality_score       || null,
      site_dir:               buildOptions.site_dir               || `sites/${lead.lead_id}`,
    },
  }

  // 1. Trigger via n8n webhook — async pattern returns run_id immediately
  const r = await fetch(VPS_BUILDER_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!r.ok) throw new Error(`Runner HTTP ${r.status}: ${await r.text()}`)
  const started = await r.json()
  const runId = started.run_id

  // 2. If started/running response (async pattern), poll runner status
  if (started.status === 'started' || started.status === 'running' || started.build_status === 'running') {
    const final = await pollRunnerStatus(runId, buildOptions.onProgress)
    return {
      ...started,
      ...final,
      run_id: runId,
    }
  }

  // 3. Sync response (legacy)
  return started
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
